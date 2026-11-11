'use strict';

(() => {
  const clock = document.querySelector('#clock');
  const panel = document.querySelector('#calendar-panel');
  const label = document.querySelector('#calendar-label');
  const todayLabel = document.querySelector('#calendar-today');
  const days = document.querySelector('#calendar-days');
  let visibleMonth = new Date();
  let lastDate = '';

  function render() {
    const today = new Date();
    const year = visibleMonth.getFullYear(), month = visibleMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    label.textContent = new Intl.DateTimeFormat('es-ES', {month: 'long', year: 'numeric'}).format(new Date(year, month, 1));
    todayLabel.textContent = new Intl.DateTimeFormat('es-ES', {weekday: 'long', day: 'numeric', month: 'long'}).format(today);
    lastDate = today.toDateString();
    days.replaceChildren();
    for (let index = 0; index < firstDay + count; index += 7) {
      const row = document.createElement('tr');
      for (let column = 0; column < 7; column++) {
        const day = index + column - firstDay + 1;
        const cell = document.createElement('td');
        if (day > 0 && day <= count) {
          const date = new Date(year, month, day);
          const time = document.createElement('time');
          time.dateTime = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          time.textContent = String(day);
          time.setAttribute('aria-label', new Intl.DateTimeFormat('es-ES', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(date));
          if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            time.className = 'calendar-current-day';
            time.setAttribute('aria-current', 'date');
          }
          cell.append(time);
        }
        row.append(cell);
      }
      days.append(row);
    }
  }

  function close(restoreFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    clock.setAttribute('aria-expanded', 'false');
    if (restoreFocus) clock.focus({preventScroll: true});
  }
  clock.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    visibleMonth = new Date();
    render();
    panel.hidden = false;
    clock.setAttribute('aria-expanded', 'true');
  });
  document.querySelector('#calendar-prev').addEventListener('click', () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); render(); });
  document.querySelector('#calendar-next').addEventListener('click', () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); render(); });
  document.querySelector('#calendar-go-today').addEventListener('click', () => { visibleMonth = new Date(); render(); });
  document.addEventListener('pointerdown', event => { if (!panel.hidden && !panel.contains(event.target) && !clock.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
  }, true);
  new MutationObserver(() => { if (!document.querySelector('#login').hidden) close(); }).observe(document.querySelector('#login'), {attributes: true, attributeFilter: ['hidden']});
  setInterval(() => { if (!panel.hidden && new Date().toDateString() !== lastDate) render(); }, 30000);
})();
