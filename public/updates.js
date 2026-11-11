'use strict';

(() => {
  const version = document.querySelector('meta[name="app-version"]')?.content;
  // Local development uses a stable placeholder, so edits do not trigger reloads.
  if (!version || version === 'development') return;

  let usedWorkspace = false;
  let updateAvailable = false;
  let checking = false;
  const windows = [...document.querySelectorAll('.window')];
  const rememberUse = () => { if (windows.some(window => !window.hidden)) usedWorkspace = true; };
  const observer = new MutationObserver(rememberUse);
  windows.forEach(window => observer.observe(window, {attributes: true, attributeFilter: ['hidden']}));
  rememberUse();

  function applyUpdate() {
    if (!updateAvailable || document.hidden) return;
    const busy = usedWorkspace || document.querySelector('dialog[open], #calendar-panel:not([hidden])');
    if (!busy) { location.reload(); return; }
    if (document.querySelector('#update-notice')) return;
    const notice = document.createElement('div');
    notice.id = 'update-notice';
    notice.setAttribute('role', 'status');
    const message = document.createElement('span');
    message.textContent = 'Hay una nueva versión disponible.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Actualizar';
    button.addEventListener('click', () => location.reload());
    notice.append(message, button);
    document.body.append(notice);
  }

  async function check() {
    if (checking || document.hidden) return;
    if (updateAvailable) { applyUpdate(); return; }
    checking = true;
    try {
      const url = new URL('index.html', document.baseURI);
      url.searchParams.set('version-check', Date.now());
      const response = await fetch(url, {cache: 'no-store'});
      if (!response.ok) return;
      const html = await response.text();
      const newest = new DOMParser().parseFromString(html, 'text/html').querySelector('meta[name="app-version"]')?.content;
      if (newest && newest !== 'development' && newest !== version) { updateAvailable = true; applyUpdate(); }
    } catch { /* Temporary network failures can be retried on the next check. */ }
    finally { checking = false; }
  }
  document.addEventListener('visibilitychange', check);
  window.addEventListener('focus', check);
  setTimeout(check, 10000);
  setInterval(check, 60000);
})();
