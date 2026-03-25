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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getQuestionKey(roundIndex, themeIndex, questionIndex) {
  return `${roundIndex}-${themeIndex}-${questionIndex}`;
}

function isQuestionUsed(roundIndex, themeIndex, questionIndex) {
  return state.usedQuestions.has(getQuestionKey(roundIndex, themeIndex, questionIndex));
}

function isRoundCompleted(roundIndex) {
  const round = GAME_CONFIG.rounds[roundIndex];
  for (let themeIndex = 0; themeIndex < round.themes.length; themeIndex += 1) {
    for (let questionIndex = 0; questionIndex < round.themes[themeIndex].questions.length; questionIndex += 1) {
      if (!isQuestionUsed(roundIndex, themeIndex, questionIndex)) {
        return false;
      }
    }
  }
  return true;
}

function getCurrentRound() {
  return GAME_CONFIG.rounds[state.currentRoundIndex];
}

function getRemainingQuestionsInRound(roundIndex) {
  const round = GAME_CONFIG.rounds[roundIndex];
  let total = 0;
  round.themes.forEach((theme, themeIndex) => {
    theme.questions.forEach((_, questionIndex) => {
      if (!isQuestionUsed(roundIndex, themeIndex, questionIndex)) {
        total += 1;
      }
    });
  });
  return total;
}

function sortTeamsByScore() {
  return [...state.teams].sort((a, b) => b.score - a.score);
}

function addTeam() {
  const input = document.getElementById("team-name-input");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  state.teams.push({
    id: Date.now() + Math.random(),
    name,
    score: 0
  });

  if (state.selectedTeamId === null) {
    state.selectedTeamId = state.teams[0].id;
  }

  input.value = "";
  render();
}

function removeTeam(teamId) {
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) return;

  const confirmed = window.confirm(`Удалить команду «${team.name}»?`);
  if (!confirmed) return;

  state.teams = state.teams.filter((item) => item.id !== teamId);

  if (state.selectedTeamId === teamId) {
    state.selectedTeamId = state.teams.length ? state.teams[0].id : null;
  }

  render();
}

function changeTeamScore(teamId, amount) {
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) return;
  team.score += amount;
  renderTeams();
}

function selectTeam(teamId) {
  state.selectedTeamId = teamId;
  renderTeams();
  renderBoard();
}

function openQuestion(roundIndex, themeIndex, questionIndex) {
  if (state.gameFinished) return;
  if (state.selectedTeamId === null) {
    alert("Сначала выберите команду, которая отвечает.");
    return;
  }

  const key = getQuestionKey(roundIndex, themeIndex, questionIndex);
  if (state.usedQuestions.has(key)) return;

  const round = GAME_CONFIG.rounds[roundIndex];
  const theme = round.themes[themeIndex];
  const question = theme.questions[questionIndex];
  const team = state.teams.find((item) => item.id === state.selectedTeamId);

  state.activeQuestion = {
    roundIndex,
    themeIndex,
    questionIndex,
    question,
    themeName: theme.name,
    teamId: team ? team.id : null
  };

  state.answerShown = false;
  questionOverlay.classList.remove("hidden");
  renderQuestionModal();
}

function closeQuestion() {
  state.activeQuestion = null;
  state.answerShown = false;
  questionOverlay.classList.add("hidden");
  questionOverlay.innerHTML = "";
}

function showAnswer() {
  state.answerShown = true;
  renderQuestionModal();
}

function renderQuestionModal() {
  if (!state.activeQuestion) return;

  const activeTeam = state.teams.find((item) => item.id === state.activeQuestion.teamId);
  const { question, themeName } = state.activeQuestion;

  questionOverlay.innerHTML = `
    <div class="question-modal">
      <div class="question-modal__top">
        <div class="question-modal__theme">${escapeHtml(themeName)}</div>
        <div class="question-modal__price">${question.price}</div>
        <div class="question-modal__team">
          <span>Отвечает:</span>
          <strong>${activeTeam ? escapeHtml(activeTeam.name) : "Команда не выбрана"}</strong>
        </div>
      </div>

      <div class="question-modal__text">${escapeHtml(question.question)}</div>

      <div class="answer-box ${state.answerShown ? "visible" : ""}">
        ${escapeHtml(question.answer)}
      </div>

      <div class="question-actions">
        ${
          state.answerShown
            ? `
              <button class="btn btn--green" onclick="handleCorrectAnswer()">Верно</button>
              <button class="btn btn--red" onclick="handleWrongAnswer()">Неверно</button>
            `
            : `
              <button class="btn btn--purple" onclick="showAnswer()">Показать ответ</button>
              <button class="btn btn--soft" onclick="closeQuestion()">Вернуться назад</button>
            `
        }
      </div>
    </div>
  `;
}

function markQuestionAsUsed() {
  const { roundIndex, themeIndex, questionIndex } = state.activeQuestion;
  state.usedQuestions.add(getQuestionKey(roundIndex, themeIndex, questionIndex));
}

function handleCorrectAnswer() {
  if (!state.activeQuestion) return;

  const team = state.teams.find((item) => item.id === state.activeQuestion.teamId);
  if (team) {
    team.score += state.activeQuestion.question.price;
  }

  markQuestionAsUsed();
  proceedAfterAnswer();
}

function handleWrongAnswer() {
  if (!state.activeQuestion) return;

  const team = state.teams.find((item) => item.id === state.activeQuestion.teamId);
  if (team) {
    team.score -= state.activeQuestion.question.price;
  }

  markQuestionAsUsed();
  proceedAfterAnswer();
}

function proceedAfterAnswer() {
  const answeredRoundIndex = state.activeQuestion.roundIndex;
  closeQuestion();

  if (isRoundCompleted(answeredRoundIndex)) {
    if (answeredRoundIndex < GAME_CONFIG.rounds.length - 1) {
      state.currentRoundIndex = answeredRoundIndex + 1;
      state.roundOpen = true;
    } else {
      finishGame();
      return;
    }
  }

  render();
}

function finishGame() {
  state.gameFinished = true;
  state.roundOpen = false;
  teamsSection.classList.add("hidden");
  boardSection.classList.add("hidden");
  renderFinalLeaderboard();
  finalSection.classList.remove("hidden");
}

function renderTeams() {
  if (state.gameFinished) return;

  teamsSection.innerHTML = `
    <div class="team-topbar">
      <div>
        <h2 class="section-title">
          <span class="section-title__icon">👥</span>
          Команды
        </h2>
      </div>

      <div class="team-add">
        <input
          id="team-name-input"
          type="text"
          placeholder="Название команды"
          onkeydown="if(event.key === 'Enter') addTeam()"
        />
        <button class="btn btn--main" onclick="addTeam()">Добавить команду</button>
      </div>
    </div>

    ${
      state.teams.length === 0
        ? `<div class="empty-state">Добавьте команды и выберите, кто отвечает.</div>`
        : `
          <div class="teams-grid">
            ${state.teams.map((team) => `
              <div class="team-card ${state.selectedTeamId === team.id ? "active" : ""}">
                <div class="team-card__name">${escapeHtml(team.name)}</div>
                <div class="team-card__score">${team.score}</div>

                <div class="team-card__actions">
                  <button class="btn btn--red" onclick="changeTeamScore(${team.id}, -100)">−100</button>
                  <button class="btn btn--green" onclick="changeTeamScore(${team.id}, 100)">+100</button>
                </div>

                <div class="team-card__bottom">
                  <button class="btn btn--gold team-select-btn" onclick="selectTeam(${team.id})">
                    ${state.selectedTeamId === team.id ? "Отвечает сейчас" : "Выбрать отвечающей"}
                  </button>
                  <button class="team-remove-btn" onclick="removeTeam(${team.id})">удалить</button>
                </div>
              </div>
            `).join("")}
          </div>
        `
    }
  `;
}

function renderBoard() {
  if (state.gameFinished) return;

  const round = getCurrentRound();
  const remaining = getRemainingQuestionsInRound(state.currentRoundIndex);
  const selectedTeam = state.teams.find((item) => item.id === state.selectedTeamId);

  boardSection.innerHTML = `
    <div class="round-status">
      <div class="round-status__left">
        <div class="round-status__label">Активный этап</div>
        <div class="round-status__title">${escapeHtml(round.name)}</div>
      </div>
      <div class="round-status__right">
        <div class="round-status__questions">Осталось вопросов: ${remaining}</div>
        <button class="btn btn--soft" onclick="toggleCurrentRound()">
          ${state.roundOpen ? "Скрыть" : "Раскрыть"}
        </button>
      </div>
    </div>

    ${
      state.roundOpen
        ? `
          <div class="round-accordion">
            <div class="round-accordion__body">
              <div class="game-board">
                ${round.themes.map((theme, themeIndex) => `
                  <div class="theme-row">
                    <div class="theme-title">${escapeHtml(theme.name)}</div>
                    <div class="theme-cells">
                      ${theme.questions.map((question, questionIndex) => {
                        const used = isQuestionUsed(state.currentRoundIndex, themeIndex, questionIndex);
                        return `
                          <div class="question-cell ${used ? "question-cell--used" : ""}">
                            <div class="question-cell__price">${question.price}</div>
                            <button
                              class="btn btn--gold question-cell__play"
                              ${used ? "disabled" : ""}
                              onclick="openQuestion(${state.currentRoundIndex}, ${themeIndex}, ${questionIndex})"
                            >
                              Играть
                            </button>
                          </div>
                        `;
                      }).join("")}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        `
        : ""
    }

    <div class="board-hint">
      ${
        selectedTeam
          ? `Сейчас отвечает: <strong>${escapeHtml(selectedTeam.name)}</strong>`
          : `Сначала выберите <strong>отвечающую команду</strong> сверху`
      }
    </div>
  `;
}

function toggleCurrentRound() {
  state.roundOpen = !state.roundOpen;
  renderBoard();
}

function renderFinalLeaderboard() {
  const sortedTeams = sortTeamsByScore();

  finalSection.innerHTML = `
    <div class="final-title">Игра завершена</div>
    <div class="final-subtitle">Итоговая таблица результатов</div>

    ${
      sortedTeams.length === 0
        ? `<div class="empty-state">Команды не были добавлены.</div>`
        : `
          <div class="leaderboard">
            ${sortedTeams.map((team, index) => `
              <div class="leaderboard-item ${index === 0 ? "leaderboard-item--1" : ""}">
                <div class="leaderboard-place">${index + 1}</div>
                <div class="leaderboard-name">${escapeHtml(team.name)}</div>
                <div class="leaderboard-score">${team.score}</div>
              </div>
            `).join("")}
          </div>
        `
    }
  `;
}

function render() {
  renderTeams();
  renderBoard();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !questionOverlay.classList.contains("hidden")) {
    closeQuestion();
  }
});

render();