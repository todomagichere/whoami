'use strict';

(() => {
  const win = document.querySelector('#computer');
  const capacity = 50 * 1024 * 1024;
  const format = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('es-ES', {maximumFractionDigits: 1})} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toLocaleString('es-ES', {maximumFractionDigits: 1})} MB`;
    return `${(bytes / 1024 ** 3).toLocaleString('es-ES', {maximumFractionDigits: 1})} GB`;
  };
  const display = (id, text) => { document.getElementById(id).textContent = text; };
  let updateNumber = 0;

  function localSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only this portfolio's keys count towards its virtual disk.
      if (key && key.startsWith('whoami.')) total += (key.length + (localStorage.getItem(key) || '').length) * 2;
    }
    return total;
  }

  function wallpaperSize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('whoami.wallpaper.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('settings');
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database blocked'));
      request.onsuccess = () => {
        const db = request.result;
        try {
          const transaction = db.transaction('settings', 'readonly');
          const get = transaction.objectStore('settings').get('background');
          get.onsuccess = () => resolve(get.result?.file instanceof Blob ? get.result.file.size : 0);
          get.onerror = () => reject(get.error);
          transaction.oncomplete = () => db.close();
          transaction.onabort = () => { db.close(); reject(transaction.error); };
        } catch (error) { db.close(); reject(error); }
      };
    });
  }

  async function refresh() {
    const current = ++updateNumber;
    let local = null, cookies = null, wallpaper = null;
    try { local = localSize(); } catch {}
    try { cookies = new TextEncoder().encode(document.cookie).length; } catch {}
    try { wallpaper = await wallpaperSize(); } catch {}
    if (current !== updateNumber) return;
    display('storage-local', local === null ? 'No disponible' : `≈ ${format(local)}`);
    display('storage-wallpaper', wallpaper === null ? 'No disponible' : format(wallpaper));
    display('storage-cookies', cookies === null ? 'No disponible' : `≈ ${format(cookies)}`);
    const known = [local, cookies, wallpaper].every(value => value !== null);
    const used = (local || 0) + (cookies || 0) + (wallpaper || 0);
    const percent = Math.min(100, used / capacity * 100);
    display('disk-percent', known ? `${percent < 0.1 && used ? '<0,1' : percent.toLocaleString('es-ES', {maximumFractionDigits: 1})} %` : '—');
    display('disk-used', `${known ? '' : 'Al menos '}${format(used)} usados`);
    display('disk-free', known ? `${format(Math.max(0, capacity - used))} libres` : 'Espacio libre no disponible');
    document.querySelector('#disk-meter-fill').style.width = `${percent}%`;
    document.querySelector('.disk-meter').setAttribute('aria-valuenow', String(Math.round(percent)));
    display('storage-browser', 'Estimación del navegador no disponible.');
    try {
      if (navigator.storage?.estimate) {
        const {usage, quota} = await navigator.storage.estimate();
        if (current !== updateNumber) return;
        if (Number.isFinite(usage) && Number.isFinite(quota)) display('storage-browser', `El navegador estima ${format(usage)} usados de hasta ${format(quota)} para este sitio.`);
      }
    } catch {}
  }

  document.querySelector('#storage-refresh').addEventListener('click', refresh);
  new MutationObserver(() => { if (!win.hidden) refresh(); }).observe(win, {attributes: true, attributeFilter: ['hidden']});
  window.addEventListener('storage', () => { if (!win.hidden) refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !win.hidden) refresh(); });
  setInterval(() => { if (!win.hidden && !document.hidden) refresh(); }, 5000);
})();
