'use strict';

(() => {
  const games = [
    {id: 'quake', title: 'Quake III Arena, demo de QuakeJS', url: 'https://mcftira.github.io/quakejs/'},
    {id: 'neverball', title: 'Neverball', url: 'https://play.neverball.org/'},
    {id: 'micropolis', title: 'Micropolis', url: 'https://www.graememcc.co.uk/micropolisJS/'}
  ];
  games.forEach(({id, title, url}) => {
    const win = document.getElementById(id);
    const container = document.getElementById(`${id}-frame-container`);
    function update() {
      if (win.hidden) { container.replaceChildren(); return; }
      if (container.firstChild) return;
      const frame = document.createElement('iframe');
      frame.title = title;
      frame.src = url;
      frame.allow = 'autoplay; fullscreen';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-downloads');
      frame.referrerPolicy = 'no-referrer';
      container.append(frame);
    }
    new MutationObserver(update).observe(win, {attributes: true, attributeFilter: ['hidden']});
    update();
  });
})();
