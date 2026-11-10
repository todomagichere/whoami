'use strict';

(() => {
  const wallpaper = document.querySelector('.wallpaper');
  const fileInput = document.querySelector('#wallpaper-file');
  const colorInput = document.querySelector('#wallpaper-color');
  const status = document.querySelector('#wallpaper-status');
  const buttons = [...document.querySelectorAll('button[data-theme],button[data-wallpaper]')];
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
  const defaultMessage = 'Los fondos elegidos se guardan en este navegador.';
  let databasePromise = null;
  let pendingWrites = Promise.resolve();
  let imageUrl = '';
  let revision = 0;

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      let blocked = false;
      const request = indexedDB.open('whoami.wallpaper.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('settings');
      request.onsuccess = () => {
        const database = request.result;
        if (blocked) { database.close(); return; }
        database.onversionchange = () => { database.close(); databasePromise = null; };
        resolve(database);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => { blocked = true; reject(new Error('Wallpaper database blocked')); };
    }).catch(error => { databasePromise = null; throw error; });
    return databasePromise;
  }

  async function readPreference() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('settings', 'readonly');
      const request = transaction.objectStore('settings').get('background');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function writePreference(preference) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('settings', 'readwrite');
      transaction.objectStore('settings').put(preference, 'background');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function savePreference(preference, label) {
    const current = revision;
    status.textContent = `${label} · guardando…`;
    pendingWrites = pendingWrites.catch(() => {}).then(async () => {
      if (current !== revision) return;
      await writePreference(preference);
      if (current === revision) status.textContent = `${label} · guardado en este navegador.`;
    }).catch(() => {
      if (current === revision) status.textContent = `${label} · no se pudo guardar en este navegador.`;
    });
  }

  function selectButton(selected) {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
  }

  function clearImage() {
    revision++;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = '';
    wallpaper.style.backgroundImage = 'none';
    fileInput.value = '';
  }

  function applyTheme(button, persist = true) {
    clearImage();
    document.body.dataset.theme = button.dataset.theme;
    wallpaper.style.backgroundColor = '';
    selectButton(button);
    const label = `Fondo ${button.textContent.trim()}`;
    if (persist) savePreference({kind: 'theme', value: button.dataset.theme}, label);
    else status.textContent = `${label} · guardado en este navegador.`;
  }

  function applyPreset(button, persist = true) {
    clearImage();
    document.body.dataset.theme = 'ink';
    wallpaper.style.backgroundColor = '';
    wallpaper.style.backgroundImage = `url("${button.dataset.wallpaper}")`;
    selectButton(button);
    const label = `Fondo ${button.textContent.trim()}`;
    if (persist) savePreference({kind: 'preset', value: button.dataset.wallpaper}, label);
    else status.textContent = `${label} · guardado en este navegador.`;
  }

  function applyColor(value, persist = true) {
    clearImage();
    document.body.dataset.theme = 'ink';
    wallpaper.style.backgroundColor = value;
    colorInput.value = value;
    selectButton(null);
    if (persist) savePreference({kind: 'color', value}, 'Color de fondo');
    else status.textContent = 'Color de fondo · guardado en este navegador.';
  }

  async function applyFile(file, name, current, persist = true) {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      if (current !== revision) { URL.revokeObjectURL(url); return; }
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageUrl = url;
      document.body.dataset.theme = 'ink';
      wallpaper.style.backgroundColor = '';
      wallpaper.style.backgroundImage = `url("${url}")`;
      selectButton(null);
      const label = name || 'Imagen de fondo';
      if (persist) savePreference({kind: 'file', file, name: label}, label);
      else status.textContent = `${label} · guardado en este navegador.`;
    } catch {
      URL.revokeObjectURL(url);
      if (current === revision) status.textContent = 'No se puede abrir esa imagen. Prueba con otra.';
    }
  }

  async function restorePreference() {
    const current = revision;
    try {
      const preference = await readPreference();
      if (current !== revision || !preference) return;
      if (preference.kind === 'theme') {
        const button = buttons.find(item => item.dataset.theme === preference.value);
        if (button) applyTheme(button, false);
      } else if (preference.kind === 'preset') {
        const button = buttons.find(item => item.dataset.wallpaper === preference.value);
        if (button) applyPreset(button, false);
      } else if (preference.kind === 'color' && /^#[0-9a-f]{6}$/i.test(preference.value)) {
        applyColor(preference.value, false);
      } else if (preference.kind === 'file' && preference.file instanceof Blob && allowedTypes.includes(preference.file.type)) {
        await applyFile(preference.file, preference.name, ++revision, false);
      }
    } catch {
      if (current === revision) status.textContent = 'No se puede guardar el fondo en este navegador.';
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.theme) applyTheme(button);
    else applyPreset(button);
  }));
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      fileInput.value = '';
      status.textContent = 'Elige una imagen PNG, JPG, WebP, GIF o AVIF.';
      return;
    }
    applyFile(file, file.name, ++revision);
  });
  colorInput.addEventListener('input', () => applyColor(colorInput.value));
  document.querySelector('#wallpaper-reset').addEventListener('click', () => {
    applyTheme(document.querySelector('[data-theme="ink"]'));
  });
  status.textContent = defaultMessage;
  restorePreference();
})();
