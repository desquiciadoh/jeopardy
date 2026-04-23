(function () {

  /* ═══════ Facts carousel ═══════ */
  let factIndex = 0;
  const factText = document.getElementById('factText');
  const factWrap = document.getElementById('splashFact');

  function showFact() {
    factText.textContent = SPACE_FACTS[factIndex];
  }

  function cycleFacts() {
    factWrap.classList.add('fading');
    setTimeout(() => {
      factIndex = (factIndex + 1) % SPACE_FACTS.length;
      showFact();
      factWrap.classList.remove('fading');
    }, 600);
  }

  showFact();
  const factTimer = setInterval(cycleFacts, 5000);

  /* ═══════ Launch transition ═══════ */
  document.getElementById('launchBtn').addEventListener('click', () => {
    clearInterval(factTimer);

    const splash     = document.getElementById('splash');
    const transition = document.getElementById('transition');
    const gameArea   = document.getElementById('game-area');

    // Запускаем переход
    splash.classList.add('hide');
    transition.classList.add('active');

    // Показываем игровую зону чуть позже — полосы уже летят
    setTimeout(() => {
      gameArea.classList.add('visible');
    }, 950);

    // Убираем transition и splash
    setTimeout(() => {
      transition.classList.remove('active');
      splash.style.display = 'none';
    }, 2400);
  });

})();