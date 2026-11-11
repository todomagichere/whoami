'use strict';

(() => {
  const clock = document.querySelector('#clock');
  const panel = document.querySelector('#calendar-panel');
  const label = document.querySelector('#calendar-label');
  const todayLabel = document.querySelector('#calendar-today');
  const days = document.querySelector('#calendar-days');
  const selectedLabel = document.querySelector('#calendar-selected-date');
  const list = document.querySelector('#calendar-event-list');
  const empty = document.querySelector('#calendar-no-events');
  const form = document.querySelector('#calendar-event-form');
  const title = document.querySelector('#calendar-event-title');
  const time = document.querySelector('#calendar-event-time');
  const status = document.querySelector('#calendar-event-status');
  const addButton = document.querySelector('#calendar-add-event');
  const prefix = 'whoami.calendar.event.';
  const fullDate = new Intl.DateTimeFormat('es-ES', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
  const monthDate = new Intl.DateTimeFormat('es-ES', {month: 'long', year: 'numeric'});
  let selected = new Date();
  let visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  let events = [];
  let eventsAvailable = true;
  let lastDate = '';

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function loadEvents() {
    try {
      const next = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const event = JSON.parse(localStorage.getItem(key));
          if (event && typeof event.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && (event.time === '' || /^\d{2}:\d{2}$/.test(event.time))) next.push({...event, key});
        } catch { /* Ignore malformed entries without changing them. */ }
      }
      events = next;
      eventsAvailable = true;
      return true;
    } catch {
      events = [];
      eventsAvailable = false;
      status.textContent = 'No se pueden consultar los eventos guardados en este navegador.';
      return false;
    }
  }
  function renderEvents() {
    selectedLabel.textContent = fullDate.format(selected);
    const selectedKey = dateKey(selected);
    const selectedEvents = events.filter(event => event.date === selectedKey)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title, 'es'));
    list.replaceChildren();
    empty.hidden = selectedEvents.length > 0;
    empty.textContent = eventsAvailable ? 'Sin eventos' : 'Eventos no disponibles';
    selectedEvents.forEach(event => {
      const row = document.createElement('li');
      const content = document.createElement('span');
      if (event.time) { const eventTime = document.createElement('time'); eventTime.textContent = event.time; content.append(eventTime); }
      const name = document.createElement('span'); name.textContent = event.title; content.append(name);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Eliminar';
      remove.setAttribute('aria-label', `Eliminar ${event.title}`);
      remove.addEventListener('click', () => {
        try { localStorage.removeItem(event.key); status.textContent = 'Evento eliminado.'; loadEvents(); render(); }
        catch { status.textContent = 'No se pudo eliminar el evento.'; }
      });
      row.append(content, remove); list.append(row);
    });
  }
  function render() {
    const today = new Date();
    const year = visibleMonth.getFullYear(), month = visibleMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const selectedKey = dateKey(selected), todayKey = dateKey(today);
    const eventCounts = new Map();
    events.forEach(event => eventCounts.set(event.date, (eventCounts.get(event.date) || 0) + 1));
    label.textContent = monthDate.format(visibleMonth);
    todayLabel.textContent = new Intl.DateTimeFormat('es-ES', {weekday: 'long', day: 'numeric', month: 'long'}).format(today);
    lastDate = today.toDateString();
    days.replaceChildren();
    for (let index = 0; index < firstDay + count; index += 7) {
      const row = document.createElement('tr');
      for (let column = 0; column < 7; column++) {
        const day = index + column - firstDay + 1;
        const cell = document.createElement('td');
        if (day > 0 && day <= count) {
          const date = new Date(year, month, day), key = dateKey(date);
          const button = document.createElement('button'); button.type = 'button'; button.className = 'calendar-day';
          button.dataset.date = key; button.textContent = String(day);
          button.tabIndex = key === selectedKey ? 0 : -1;
          button.setAttribute('aria-pressed', String(key === selectedKey));
          const number = eventCounts.get(key) || 0;
          button.setAttribute('aria-label', fullDate.format(date) + (number ? `, ${number} ${number === 1 ? 'evento' : 'eventos'}` : ''));
          if (number) button.classList.add('has-events');
          if (key === todayKey) { button.classList.add('calendar-current-day'); button.setAttribute('aria-current', 'date'); }
          button.addEventListener('click', () => { selectDate(date); openEventForm(); });
          cell.append(button);
        }
        row.append(cell);
      }
      days.append(row);
    }
    renderEvents();
  }
  function selectDate(date, focus = false) {
    selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    status.textContent = '';
    render();
    if (focus) days.querySelector(`[data-date="${dateKey(selected)}"]`)?.focus();
  }
  function close(restoreFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    clock.setAttribute('aria-expanded', 'false');
    if (restoreFocus) clock.focus({preventScroll: true});
  }
  clock.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    selected = new Date(); visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    form.hidden = true; form.reset(); status.textContent = '';
    loadEvents(); render(); panel.hidden = false; clock.setAttribute('aria-expanded', 'true');
  });
  document.querySelector('#calendar-prev').addEventListener('click', () => selectDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)));
  document.querySelector('#calendar-next').addEventListener('click', () => selectDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)));
  document.querySelector('#calendar-go-today').addEventListener('click', () => selectDate(new Date()));
  days.addEventListener('keydown', event => {
    if (!event.target.matches('.calendar-day')) return;
    const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7};
    if (!(event.key in offsets)) return;
    event.preventDefault(); selectDate(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + offsets[event.key]), true);
  });
  function openEventForm() { form.hidden = false; status.textContent = ''; title.focus(); }
  addButton.addEventListener('click', openEventForm);
  document.querySelector('#calendar-event-cancel').addEventListener('click', () => { form.hidden = true; form.reset(); status.textContent = ''; addButton.focus(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = title.value.trim();
    if (!text) { status.textContent = 'Escribe un nombre para el evento.'; title.focus(); return; }
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(prefix + id, JSON.stringify({title: text, date: dateKey(selected), time: time.value}));
      form.hidden = true; form.reset(); status.textContent = 'Evento guardado en este navegador.'; loadEvents(); render(); addButton.focus();
    } catch { status.textContent = 'No se pudo guardar el evento. Comprueba el almacenamiento del navegador.'; }
  });
  document.addEventListener('pointerdown', event => { if (!panel.hidden && !panel.contains(event.target) && !clock.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
  }, true);
  window.addEventListener('storage', event => { if (!panel.hidden && (!event.key || event.key.startsWith(prefix))) { loadEvents(); render(); } });
  new MutationObserver(() => { if (!document.querySelector('#login').hidden) close(); }).observe(document.querySelector('#login'), {attributes: true, attributeFilter: ['hidden']});
  setInterval(() => { if (!panel.hidden && new Date().toDateString() !== lastDate) render(); }, 30000);
})();
