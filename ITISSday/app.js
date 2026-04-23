(function () {

  // ═══════ Состояние ═══════
  const state = {
    current:   0,
    total:     QUESTIONS.length,
    direction: 'next', // 'next' | 'prev'
    locked:    false,
  };

  // ═══════ DOM ═══════
  const cardText     = document.getElementById('cardText');
  const cardNum      = document.getElementById('cardNum');
  const qCurrent     = document.getElementById('qCurrent');
  const qTotal       = document.getElementById('qTotal');
  const progressFill = document.getElementById('progressFill');
  const progressGlow = document.getElementById('progressGlow');
  const prevBtn      = document.getElementById('prevBtn');
  const nextBtn      = document.getElementById('nextBtn');
  const navDots      = document.getElementById('navDots');
  const finishScreen = document.getElementById('finishScreen');
  const questionCard = document.getElementById('questionCard');
  const transition   = document.getElementById('transition');
  const tLinesWrap   = document.getElementById('tLinesWrap');
  const restartBtn   = document.getElementById('restartBtn');

  // ═══════ Init ═══════
  qTotal.textContent = String(state.total).padStart(2, '0');
  buildDots();
  renderCard(false);

  // ═══════ Dot-индикаторы ═══════
  function buildDots() {
    navDots.innerHTML = '';
    const show = Math.min(state.total, 15); // не больше 15 точек
    for (let i = 0; i < show; i++) {
      const d = document.createElement('span');
      d.className = 'nav-dot';
      d.dataset.index = i;
      d.addEventListener('click', () => goTo(i));
      navDots.appendChild(d);
    }
    updateDots();
  }

  function updateDots() {
    const dots = navDots.querySelectorAll('.nav-dot');
    const show = dots.length;
    dots.forEach((d, i) => {
      // Если вопросов больше 15 — маппируем индексы
      const mapped = state.total > 15
        ? Math.round(i * (state.total - 1) / (show - 1))
        : i;
      d.classList.toggle('active',  mapped === state.current);
      d.classList.toggle('visited', mapped < state.current);
    });
  }

  // ═══════ Рендер карточки ═══════
  function renderCard(animate) {
    const idx = state.current;
    cardNum.textContent  = String(idx + 1).padStart(2, '0');
    qCurrent.textContent = String(idx + 1).padStart(2, '0');

    // Прогресс-бар
    const pct = ((idx) / (state.total - 1)) * 100;
    progressFill.style.width = pct + '%';
    progressGlow.style.left  = pct + '%';

    // Текст
    cardText.textContent = QUESTIONS[idx];

    // Кнопки
    prevBtn.disabled = (idx === 0);
    nextBtn.disabled = false;

    // Dots
    updateDots();

    // Анимация появления карточки
    if (animate) {
      questionCard.classList.remove('card--enter-left', 'card--enter-right', 'card--exit-left', 'card--exit-right');
      void questionCard.offsetWidth; // reflow
      const cls = state.direction === 'next' ? 'card--enter-right' : 'card--enter-left';
      questionCard.classList.add(cls);
    }
  }

  // ═══════ Tron-переход ═══════
  function runTransition(callback) {
    if (state.locked) return;
    state.locked = true;

    // Генерируем линии динамически при каждом переходе
    buildTronLines();

    transition.classList.add('active');

    // Через пик перехода — меняем содержимое
    setTimeout(() => {
      callback();
      renderCard(true);
    }, 320);

    // Убираем переход
    setTimeout(() => {
      transition.classList.remove('active');
      // Чистим линии после анимации
      setTimeout(() => {
        tLinesWrap.innerHTML = '';
        state.locked = false;
      }, 100);
    }, 900);
  }

  // ═══════ Генератор Tron-линий ═══════
  function buildTronLines() {
    tLinesWrap.innerHTML = '';

    const count   = 28;
    const upCount = Math.floor(count / 2);

    for (let i = 0; i < count; i++) {
      const line = document.createElement('div');
      line.className = 't-line';

      // Равномерное распределение + небольшой random-jitter
      const base   = (i / (count - 1)) * 96 + 2; // 2% … 98%
      const jitter = (Math.random() - 0.5) * 2.5;
      const left   = Math.max(0.5, Math.min(99, base + jitter));
      line.style.left = left + '%';

      // Ширина: большинство 1px, акцентные 2px
      const isThick = (i % 5 === 0);
      line.style.width = isThick ? '2px' : '1px';

      // Направление
      const goUp = i < upCount;
      const dir  = goUp ? 'up' : 'down';
      line.dataset.dir = dir;

      // Индивидуальные тайминги
      const duration = 0.55 + Math.random() * 0.45; // 0.55–1.0s
      const delay    = Math.random() * 0.18;          // 0–0.18s

      // Яркость — центральные линии чуть ярче
      const centerDist = Math.abs(left - 50) / 50; // 0=центр, 1=край
      const brightness = 0.65 + (1 - centerDist) * 0.35;

      line.style.setProperty('--dur',   duration + 's');
      line.style.setProperty('--delay', delay + 's');
      line.style.setProperty('--br',    brightness);

      tLinesWrap.appendChild(line);

      // Запускаем анимацию через rAF чтобы CSS успел применить стили
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          line.classList.add(goUp ? 'tl-up' : 'tl-down');
        });
      });
    }
  }

  // ═══════ Навигация ═══════
  function goNext() {
    if (state.locked) return;
    if (state.current >= state.total - 1) {
      // Последний вопрос — показываем финал
      runTransition(() => {
        questionCard.classList.add('hidden');
        finishScreen.classList.remove('hidden');
        prevBtn.disabled = true;
        nextBtn.disabled = true;
      });
      return;
    }
    state.direction = 'next';
    runTransition(() => { state.current++; });
  }

  function goPrev() {
    if (state.locked || state.current <= 0) return;
    state.direction = 'prev';
    runTransition(() => { state.current--; });
  }

  function goTo(idx) {
    if (state.locked || idx === state.current) return;
    state.direction = idx > state.current ? 'next' : 'prev';
    runTransition(() => { state.current = idx; });
  }

  // ═══════ Restart ═══════
  restartBtn.addEventListener('click', () => {
    state.direction = 'prev';
    runTransition(() => {
      state.current = 0;
      finishScreen.classList.add('hidden');
      questionCard.classList.remove('hidden');
    });
  });

  // ═══════ События ═══════
  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', goPrev);

  // Стрелки клавиатуры
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
  });

  // Свайп на мобильных
  let touchStartX = 0;
  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? goNext() : goPrev();
    }
  }, { passive: true });

})();