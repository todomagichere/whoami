'use strict';

(() => {
  const win = document.querySelector('#quake');
  const container = document.querySelector('#quake-frame-container');

  function update() {
    if (win.hidden) {
      container.replaceChildren();
      return;
    }
    if (container.firstChild) return;
    const frame = document.createElement('iframe');
    frame.title = 'Quake III Arena, demo de QuakeJS';
    frame.src = 'https://mcftira.github.io/quakejs/';
    frame.allow = 'autoplay; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-forms');
    frame.referrerPolicy = 'no-referrer';
    container.append(frame);
  }
  new MutationObserver(update).observe(win, {attributes: true, attributeFilter: ['hidden']});
  update();
})();
