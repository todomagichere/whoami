'use strict';

(() => {
  const win = document.querySelector('#quake');
  const intro = document.querySelector('#quake-intro');
  const game = document.querySelector('#quake-game');
  const container = document.querySelector('#quake-frame-container');
  const start = document.querySelector('#quake-start');

  function stop() {
    container.replaceChildren();
    game.hidden = true;
    intro.hidden = false;
  }

  start.addEventListener('click', () => {
    if (container.firstChild) return;
    const frame = document.createElement('iframe');
    frame.title = 'Quake III Arena, demo de QuakeJS';
    frame.src = 'https://mcftira.github.io/quakejs/';
    frame.allow = 'autoplay; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-forms');
    frame.referrerPolicy = 'no-referrer';
    intro.hidden = true;
    game.hidden = false;
    container.append(frame);
    frame.focus();
  });
  document.querySelector('#quake-stop').addEventListener('click', () => { stop(); start.focus(); });
  new MutationObserver(() => { if (win.hidden) stop(); }).observe(win, {attributes: true, attributeFilter: ['hidden']});
})();
