'use strict';

(() => {
  const instruments = [
    ['Bombo', 'kick'], ['Caja', 'snare'], ['Tom grave', 'low-tom'],
    ['Tom medio', 'mid-tom'], ['Tom agudo', 'high-tom'], ['Conga grave', 'low-conga'],
    ['Conga media', 'mid-conga'], ['Conga aguda', 'high-conga'], ['Rimshot', 'rim'],
    ['Claves', 'claves'], ['Palmas', 'clap'], ['Maracas', 'maracas'], ['Cencerro', 'cowbell'], ['Charles cerrado', 'closed-hat'],
    ['Charles abierto', 'open-hat'], ['Plato', 'cymbal']
  ];
  const storageKey = 'whoami.drums.v1';
  const defaults = [[0,4,8,12],[4,12],[],[],[],[],[],[],[],[],[4,12],[],[],[0,2,4,6,8,10,12,14],[],[]];
  const grid = document.querySelector('#drum-grid');
  const playButton = document.querySelector('#drum-play');
  const clearButton = document.querySelector('#drum-clear');
  const tempo = document.querySelector('#drum-tempo');
  const volume = document.querySelector('#drum-volume');
  const status = document.querySelector('#drum-status');
  const drumWindow = document.querySelector('#drums');
  let pattern = defaults.map(steps => Array.from({length: 16}, (_, step) => steps.includes(step)));
  let audio, master, buffersPromise, playing = false, starting = false, generation = 0;
  let timer = null, frame = null, nextTime = 0, nextStep = 0, queued = [];
  const cells = [];

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.pattern) && saved.pattern.length === instruments.length && saved.pattern.every(row => Array.isArray(row) && row.length === 16 && row.every(value => typeof value === 'boolean'))) pattern = saved.pattern;
    if (Number.isInteger(saved?.tempo) && saved.tempo >= 60 && saved.tempo <= 180) tempo.value = saved.tempo;
    if (Number.isInteger(saved?.volume) && saved.volume >= 0 && saved.volume <= 100) volume.value = saved.volume;
  } catch { /* Keep the default pattern if saved settings are unavailable. */ }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({pattern, tempo: Number(tempo.value), volume: Number(volume.value)})); }
    catch { status.textContent = 'No se pudo guardar el patrón en este navegador.'; }
  }
  function updateTempo() {
    document.querySelector('#drum-bpm-display').textContent = tempo.value;
    document.querySelector('#drum-tempo-value').textContent = `${tempo.value} BPM`;
  }
  function render() {
    grid.replaceChildren(); cells.length = 0;
    const corner = document.createElement('span'); corner.className = 'drum-number'; corner.textContent = 'INSTRUMENTO'; grid.append(corner);
    for (let step = 0; step < 16; step++) {
      const label = document.createElement('span'); label.className = 'drum-number'; label.textContent = String(step + 1).padStart(2, '0'); grid.append(label);
    }
    instruments.forEach(([name], row) => {
      const sound = document.createElement('button'); sound.type = 'button'; sound.className = 'drum-instrument'; sound.textContent = name; sound.setAttribute('aria-label', `Escuchar ${name}`);
      sound.addEventListener('click', async () => {
        try { await prepareAudio(); trigger(row, audio.currentTime); status.textContent = name; }
        catch { status.textContent = 'No se pudieron cargar los sonidos. Comprueba la conexión.'; }
      });
      grid.append(sound); cells[row] = [];
      for (let step = 0; step < 16; step++) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'drum-step'; button.dataset.group = String(Math.floor(step / 4));
        button.setAttribute('aria-label', `${name}, paso ${step + 1}`); button.setAttribute('aria-pressed', String(pattern[row][step]));
        button.addEventListener('click', () => { pattern[row][step] = !pattern[row][step]; button.setAttribute('aria-pressed', String(pattern[row][step])); save(); });
        cells[row].push(button); grid.append(button);
      }
    });
  }
  async function prepareAudio() {
    if (!audio) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio unavailable');
      audio = new AudioContextClass(); master = audio.createGain(); master.connect(audio.destination);
    }
    master.gain.value = Number(volume.value) / 100 * .65;
    const resume = audio.state === 'suspended' ? audio.resume() : Promise.resolve();
    if (!buffersPromise) buffersPromise = Promise.all(instruments.map(async ([, file]) => {
      const response = await fetch(`assets/audio/808/${file}.wav`);
      if (!response.ok) throw new Error('Sample unavailable');
      return audio.decodeAudioData(await response.arrayBuffer());
    })).catch(error => { buffersPromise = null; throw error; });
    await Promise.all([resume, buffersPromise]);
  }
  function trigger(row, when) {
    buffersPromise.then(buffers => {
      const source = audio.createBufferSource(); source.buffer = buffers[row]; source.connect(master); source.start(when);
    });
  }
  function schedule() {
    // Browsers throttle timers in background tabs; skip missed beats instead of replaying them.
    if (nextTime < audio.currentTime - .25) { nextTime = audio.currentTime + .02; queued = []; }
    while (playing && nextTime < audio.currentTime + .12) {
      for (let row = 0; row < instruments.length; row++) if (pattern[row][nextStep]) trigger(row, nextTime);
      queued.push({step: nextStep, time: nextTime});
      nextTime += 60 / Number(tempo.value) / 4; nextStep = (nextStep + 1) % 16;
    }
  }
  function draw() {
    if (!playing) return;
    let current = null;
    while (queued.length && queued[0].time <= audio.currentTime) current = queued.shift().step;
    if (current !== null) cells.forEach(row => row.forEach((cell, step) => cell.classList.toggle('is-current', step === current)));
    frame = requestAnimationFrame(draw);
  }
  function stop() {
    generation++; playing = false; starting = false; clearInterval(timer); cancelAnimationFrame(frame); queued = [];
    playButton.textContent = '▶ Reproducir'; playButton.setAttribute('aria-pressed', 'false');
    cells.forEach(row => row.forEach(cell => cell.classList.remove('is-current')));
    if (audio && master) { master.gain.cancelScheduledValues(audio.currentTime); master.gain.setValueAtTime(0, audio.currentTime); }
  }
  playButton.addEventListener('click', async () => {
    if (playing || starting) { stop(); status.textContent = 'Reproducción detenida.'; return; }
    const request = ++generation; starting = true; status.textContent = 'Cargando sonidos…';
    try {
      await prepareAudio();
      if (request !== generation || drumWindow.hidden) return;
      starting = false; playing = true; nextStep = 0; nextTime = audio.currentTime + .05;
      playButton.textContent = '■ Detener'; playButton.setAttribute('aria-pressed', 'true'); status.textContent = 'Reproduciendo';
      schedule(); timer = setInterval(schedule, 25); frame = requestAnimationFrame(draw);
    } catch { if (request === generation) { starting = false; status.textContent = 'No se pudieron cargar los sonidos. Comprueba la conexión.'; } }
  });
  clearButton.addEventListener('click', () => { pattern = instruments.map(() => Array(16).fill(false)); cells.forEach(row => row.forEach(cell => cell.setAttribute('aria-pressed', 'false'))); save(); status.textContent = 'Patrón borrado.'; });
  tempo.addEventListener('input', () => { updateTempo(); save(); });
  volume.addEventListener('input', () => { if (master) master.gain.value = Number(volume.value) / 100 * .65; save(); });
  new MutationObserver(() => { if (drumWindow.hidden && (playing || starting)) stop(); }).observe(drumWindow, {attributes: true, attributeFilter: ['hidden']});
  render(); updateTempo();
})();
