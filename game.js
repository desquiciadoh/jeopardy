(function () {
  const state = {
    teams: [],
    selectedTeamId: null,
    currentRoundIndex: 0,
    roundOpen: true,
    activeQuestion: null,
    usedQuestions: new Set(),
    gameFinished: false,
    answerShown: false
  };

  const teamsSection = document.getElementById("teams-section");
  const boardSection = document.getElementById("board-section");
  const questionOverlay = document.getElementById("question-overlay");
  const finalSection = document.getElementById("final-section");

  function esc(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function qk(r, t, q) { return `${r}-${t}-${q}`; }
  function isUsed(r, t, q) { return state.usedQuestions.has(qk(r, t, q)); }

  function isRoundDone(ri) {
    const rd = GAME_CONFIG.rounds[ri];
    for (let t = 0; t < rd.themes.length; t++)
      for (let q = 0; q < rd.themes[t].questions.length; q++)
        if (!isUsed(ri, t, q)) return false;
    return true;
  }

  function curRound() { return GAME_CONFIG.rounds[state.currentRoundIndex]; }

  function remaining(ri) {
    let n = 0;
    GAME_CONFIG.rounds[ri].themes.forEach((th, ti) =>
      th.questions.forEach((_, qi) => { if (!isUsed(ri, ti, qi)) n++; }));
    return n;
  }

  function sortedTeams() { return [...state.teams].sort((a, b) => b.score - a.score); }

  /* ═══════ Public API (window) ═══════ */

  window.addTeam = function () {
    const inp = document.getElementById("team-name-input");
    if (!inp) return;
    const nm = inp.value.trim();
    if (!nm) return;
    state.teams.push({ id: Date.now() + Math.random(), name: nm, score: 0 });
    if (!state.selectedTeamId) state.selectedTeamId = state.teams[0].id;
    inp.value = "";
    render();
  };

  window.removeTeam = function (id) {
    const t = state.teams.find(x => x.id === id);
    if (!t || !confirm(`Удалить экипаж «${t.name}»?`)) return;
    state.teams = state.teams.filter(x => x.id !== id);
    if (state.selectedTeamId === id)
      state.selectedTeamId = state.teams.length ? state.teams[0].id : null;
    render();
  };

  window.changeScore = function (id, amt) {
    const t = state.teams.find(x => x.id === id);
    if (t) { t.score += amt; renderTeams(); }
  };

  window.selectTeam = function (id) {
    state.selectedTeamId = id;
    renderTeams();
    renderBoard();
  };

  window.openQ = function (ri, ti, qi) {
    if (state.gameFinished) return;
    if (!state.selectedTeamId) { alert("Сначала выберите экипаж."); return; }
    if (isUsed(ri, ti, qi)) return;
    const rd = GAME_CONFIG.rounds[ri], th = rd.themes[ti], q = th.questions[qi];
    const tm = state.teams.find(x => x.id === state.selectedTeamId);
    state.activeQuestion = { ri, ti, qi, question: q, themeName: th.name, teamId: tm ? tm.id : null };
    state.answerShown = false;
    questionOverlay.classList.remove("hidden");
    renderModal();
  };

  window.closeQ = function () {
    state.activeQuestion = null;
    state.answerShown = false;
    questionOverlay.classList.add("hidden");
    questionOverlay.innerHTML = "";
  };

  window.showAns = function () {
    state.answerShown = true;
    renderModal();
  };

  window.correct = function () {
    if (!state.activeQuestion) return;
    const t = state.teams.find(x => x.id === state.activeQuestion.teamId);
    if (t) t.score += state.activeQuestion.question.price;
    markUsed();
    proceed();
  };

  window.wrong = function () {
    if (!state.activeQuestion) return;
    const t = state.teams.find(x => x.id === state.activeQuestion.teamId);
    if (t) t.score -= state.activeQuestion.question.price;
    markUsed();
    proceed();
  };

  window.toggleRound = function () {
    state.roundOpen = !state.roundOpen;
    renderBoard();
  };

  /* ═══════ Internals ═══════ */

  function markUsed() {
    const { ri, ti, qi } = state.activeQuestion;
    state.usedQuestions.add(qk(ri, ti, qi));
  }

  function proceed() {
    const ri = state.activeQuestion.ri;
    closeQ();
    if (isRoundDone(ri)) {
      if (ri < GAME_CONFIG.rounds.length - 1) {
        state.currentRoundIndex = ri + 1;
        state.roundOpen = true;
      } else {
        finish();
        return;
      }
    }
    render();
  }

  function finish() {
    state.gameFinished = true;
    state.roundOpen = false;
    teamsSection.classList.add("hidden");
    boardSection.classList.add("hidden");
    renderFinal();
    finalSection.classList.remove("hidden");
  }

  /* ═══════ Renderers ═══════ */

  function renderModal() {
    if (!state.activeQuestion) return;
    const tm = state.teams.find(x => x.id === state.activeQuestion.teamId);
    const { question: q, themeName } = state.activeQuestion;
    questionOverlay.innerHTML = `
      <div class="question-modal">
        <div class="question-modal__top">
          <div class="question-modal__theme">${esc(themeName)}</div>
          <div class="question-modal__price">${q.price}</div>
          <div class="question-modal__team">
            <span>Отвечает:</span>
            <strong>${tm ? esc(tm.name) : "—"}</strong>
          </div>
        </div>
        <div class="question-modal__text">${esc(q.question)}</div>
        <div class="answer-box ${state.answerShown ? "visible" : ""}">${esc(q.answer)}</div>
        <div class="question-actions">
          ${state.answerShown
        ? `<button class="btn btn--green" onclick="correct()">Верно</button>
               <button class="btn btn--red" onclick="wrong()">Неверно</button>`
        : `<button class="btn btn--purple" onclick="showAns()">Показать ответ</button>
               <button class="btn btn--soft" onclick="closeQ()">Назад</button>`}
        </div>
      </div>`;
  }

  function renderTeams() {
    if (state.gameFinished) return;
    teamsSection.innerHTML = `
      <div class="team-topbar">
        <div><h2 class="section-title">
          <span class="section-title__icon">★</span> Экипажи
        </h2></div>
        <div class="team-add">
          <input id="team-name-input" type="text" placeholder="Название экипажа"
            onkeydown="if(event.key==='Enter')addTeam()"/>
          <button class="btn btn--main" onclick="addTeam()">Добавить</button>
        </div>
      </div>
      ${state.teams.length === 0
        ? `<div class="empty-state">Добавьте экипажи и выберите отвечающий.</div>`
        : `<div class="teams-grid">${state.teams.map(t => `
          <div class="team-card ${state.selectedTeamId === t.id ? "active" : ""}">
            <div class="team-card__name">${esc(t.name)}</div>
            <div class="team-card__score">${t.score}</div>
            <div class="team-card__actions">
              <button class="btn btn--red" onclick="changeScore(${t.id},-100)">−100</button>
              <button class="btn btn--green" onclick="changeScore(${t.id},100)">+100</button>
            </div>
            <div class="team-card__bottom">
              <button class="btn btn--gold team-select-btn" onclick="selectTeam(${t.id})">
                ${state.selectedTeamId === t.id ? "Отвечает" : "Выбрать"}
              </button>
              <button class="team-remove-btn" onclick="removeTeam(${t.id})">удалить</button>
            </div>
          </div>`).join("")}</div>`}`;
  }

  function renderBoard() {
    if (state.gameFinished) return;
    const rd = curRound(), rem = remaining(state.currentRoundIndex);
    const sel = state.teams.find(x => x.id === state.selectedTeamId);
    boardSection.innerHTML = `
      <div class="round-status">
        <div class="round-status__left">
          <div class="round-status__label">Активный этап</div>
          <div class="round-status__title">${esc(rd.name)}</div>
        </div>
        <div class="round-status__right">
          <span>Осталось: ${rem}</span>
          <button class="btn btn--soft" onclick="toggleRound()">${state.roundOpen ? "Скрыть" : "Раскрыть"}</button>
        </div>
      </div>
      ${state.roundOpen ? `
        <div class="round-accordion"><div class="round-accordion__body"><div class="game-board">
          ${rd.themes.map((th, ti) => `
            <div class="theme-row">
              <div class="theme-title">${esc(th.name)}</div>
              <div class="theme-cells">
                ${th.questions.map((q, qi) => {
          const u = isUsed(state.currentRoundIndex, ti, qi);
          return `<div class="question-cell ${u ? "question-cell--used" : ""}">
                    <div class="question-cell__price">${q.price}</div>
                    <button class="btn btn--gold question-cell__play" ${u ? "disabled" : ""}
                      onclick="openQ(${state.currentRoundIndex},${ti},${qi})">Играть</button>
                  </div>`;
        }).join("")}
              </div>
            </div>`).join("")}
        </div></div></div>` : ""}
      <div class="board-hint">${sel
        ? `Отвечает: <strong>${esc(sel.name)}</strong>`
        : `Выберите <strong>отвечающий экипаж</strong> выше`}</div>`;
  }

  function renderFinal() {
    const s = sortedTeams();
    finalSection.innerHTML = `
      <div class="final-title">Миссия завершена</div>
      <div class="final-subtitle">Итоговая таблица результатов</div>
      ${s.length === 0 ? `<div class="empty-state">Экипажи не добавлены.</div>` : `
        <div class="leaderboard">${s.map((t, i) => `
          <div class="leaderboard-item ${i === 0 ? "leaderboard-item--1" : ""}">
            <div class="leaderboard-place">${i + 1}</div>
            <div class="leaderboard-name">${esc(t.name)}</div>
            <div class="leaderboard-score">${t.score}</div>
          </div>`).join("")}</div>`}`;
  }

  function render() { renderTeams(); renderBoard(); }

  /* ═══════ Keyboard ═══════ */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !questionOverlay.classList.contains("hidden")) closeQ();
  });

  render();
})();