(function () {
  /* ═══════ Star generator ═══════ */
  function generateStars(container, count, className, maxOpacity) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = className;
      const sz = Math.random() * 2.2 + 0.4;
      s.style.width = sz + 'px';
      s.style.height = sz + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.setProperty('--dur', (Math.random() * 5 + 3) + 's');
      s.style.setProperty('--mop', (Math.random() * maxOpacity + 0.05).toFixed(2));
      s.style.animationDelay = (Math.random() * 6) + 's';
      container.appendChild(s);
    }
  }

  generateStars(document.getElementById('splashStars'), 160, 's-star', 0.3);
  generateStars(document.getElementById('gameStars'), 90, 'g-star', 0.12);

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

    const splash = document.getElementById('splash');
    const transition = document.getElementById('transition');
    const gameArea = document.getElementById('game-area');

    splash.classList.add('hide');
    transition.classList.add('active');

    setTimeout(() => {
      gameArea.classList.add('visible');
    }, 900);

    setTimeout(() => {
      transition.classList.remove('active');
      splash.style.display = 'none';
    }, 2200);
  });
})();