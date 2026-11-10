'use strict';

(() => {
  const canvas = document.querySelector('#gpu-wallpaper');
  const toggle = document.querySelector('#gpu-wallpaper-toggle');
  const status = document.querySelector('#gpu-wallpaper-status');
  const desktop = document.querySelector('#desktop');
  const login = document.querySelector('#login');
  const motionSetting = document.querySelector('#reduce-motion');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultMessage = 'Constelación que responde al cursor. Requiere WebGPU.';
  const pointer = {x: 0.5, y: 0.5, active: 0};
  let state = null;
  let generation = 0;
  let starting = false;

  const shader = /* wgsl */ `
    struct Parameters {
      resolution: vec2f,
      padding: vec2f,
    }
    @group(0) @binding(0) var<uniform> u: Parameters;
    @group(0) @binding(1) var<storage, read> points: array<vec4f, 33>;

    @vertex fn vertex_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
      var vertices = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
      return vec4f(vertices[index], 0.0, 1.0);
    }

    @fragment fn fragment_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
      let shortest = min(u.resolution.x, u.resolution.y);
      let uv = (position.xy - u.resolution * 0.5) / shortest;
      var light = 0.0;
      for (var i = 0u; i < 32u; i = i + 1u) {
        let p = points[i].xy;
        let next = points[i + 1u].xy;
        let d = length(uv - p);
        light += (1.0 - smoothstep(0.0015, 0.0045, d)) * 0.42;
        light += (1.0 - smoothstep(0.0, 0.035, d)) * 0.035;
        let segment = next - p;
        let segmentLength = length(segment);
        if (segmentLength < 0.28) {
          let amount = clamp(dot(uv - p, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
          let lineDistance = length(uv - p - amount * segment);
          light += (1.0 - smoothstep(0.0005, 0.0025, lineDistance)) * 0.16;
        }
      }
      let alpha = clamp(light, 0.0, 0.6);
      return vec4f(vec3f(0.74, 0.9, 0.85) * alpha, alpha);
    }
  `;

  function reducedMotion() {
    return motionPreference.matches || document.body.classList.contains('reduce-motion');
  }

  function dispose() {
    generation++;
    starting = false;
    const previous = state;
    state = null;
    canvas.hidden = true;
    if (previous) {
      cancelAnimationFrame(previous.frame);
      previous.context.unconfigure();
      previous.device.destroy();
    }
  }

  function updatePoints(points, width, height, time) {
    const shortest = Math.min(width, height);
    const aspectX = width / shortest, aspectY = height / shortest;
    const mouseX = (pointer.x - 0.5) * aspectX, mouseY = (pointer.y - 0.5) * aspectY;
    const hash = value => { const n = Math.sin(value * 127.1) * 43758.5453; return n - Math.floor(n); };
    for (let i = 0; i < 33; i++) {
      const index = i + 1;
      let x = (hash(index * 2.7) - 0.5) * aspectX * 0.92 + Math.sin(time * 0.17 + index) * 0.012;
      let y = (hash(index * 7.3) - 0.5) * aspectY * 0.92 + Math.cos(time * 0.13 + index * 1.4) * 0.012;
      const dx = x - mouseX, dy = y - mouseY, distance = Math.hypot(dx, dy);
      const t = Math.min(1, distance / 0.25), influence = (1 - t * t * (3 - 2 * t)) * pointer.active;
      x += dx / Math.max(distance, 0.001) * influence * 0.045;
      y += dy / Math.max(distance, 0.001) * influence * 0.045;
      points[i * 4] = x;
      points[i * 4 + 1] = y;
    }
  }

  function draw(timestamp) {
    const current = state;
    if (!current) return;
    current.frame = 0;
    if (!toggle.checked || reducedMotion() || document.hidden || !login.hidden) return;
    if (timestamp - current.lastFrame < 1000 / 30) {
      current.frame = requestAnimationFrame(draw);
      return;
    }
    current.lastFrame = timestamp;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      current.frame = requestAnimationFrame(draw);
      return;
    }
    const scale = Math.min(devicePixelRatio || 1, 1280 / rect.width, 900 / rect.height);
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    try {
      updatePoints(current.points, width, height, timestamp / 1000);
      current.device.queue.writeBuffer(current.buffer, 0, new Float32Array([width, height, 0, 0]));
      current.device.queue.writeBuffer(current.pointBuffer, 0, current.points);
      const encoder = current.device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [{view: current.context.getCurrentTexture().createView(),
          clearValue: {r: 0, g: 0, b: 0, a: 0}, loadOp: 'clear', storeOp: 'store'}]
      });
      pass.setPipeline(current.pipeline);
      pass.setBindGroup(0, current.bindGroup);
      pass.draw(3);
      pass.end();
      current.device.queue.submit([encoder.finish()]);
      current.frame = requestAnimationFrame(draw);
    } catch {
      if (state === current) unavailable();
    }
  }

  function unavailable() {
    dispose();
    toggle.checked = false;
    status.textContent = 'El fondo interactivo dejó de estar disponible.';
  }

  function syncVisibility() {
    if (!state) return;
    const visible = toggle.checked && !reducedMotion() && !document.hidden && login.hidden;
    canvas.hidden = !visible;
    if (!visible) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    } else if (!state.frame) {
      state.lastFrame = 0;
      state.frame = requestAnimationFrame(draw);
    }
  }

  async function start() {
    const request = ++generation;
    let device = null;
    let context = null;
    starting = true;
    status.textContent = 'Preparando el fondo interactivo…';
    try {
      const adapter = await navigator.gpu.requestAdapter({powerPreference: 'low-power'});
      if (!adapter) throw new Error('WebGPU adapter unavailable');
      if (request !== generation || !toggle.checked || reducedMotion()) return;
      device = await adapter.requestDevice();
      if (request !== generation || !toggle.checked || reducedMotion()) { device.destroy(); return; }
      context = canvas.getContext('webgpu');
      if (!context) throw new Error('WebGPU canvas unavailable');
      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({device, format, alphaMode: 'premultiplied'});
      const module = device.createShaderModule({code: shader});
      const info = await module.getCompilationInfo();
      if (info.messages.some(message => message.type === 'error')) throw new Error('Shader compilation failed');
      const pipeline = await device.createRenderPipelineAsync({
        layout: 'auto',
        vertex: {module, entryPoint: 'vertex_main'},
        fragment: {module, entryPoint: 'fragment_main', targets: [{format}]},
        primitive: {topology: 'triangle-list'}
      });
      if (request !== generation || !toggle.checked || reducedMotion()) { device.destroy(); return; }
      const buffer = device.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
      const points = new Float32Array(33 * 4);
      const pointBuffer = device.createBuffer({size: points.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
      const bindGroup = device.createBindGroup({layout: pipeline.getBindGroupLayout(0),
        entries: [{binding: 0, resource: {buffer}}, {binding: 1, resource: {buffer: pointBuffer}}]});
      const current = {device, context, pipeline, buffer, pointBuffer, points, bindGroup, frame: 0, lastFrame: 0};
      state = current;
      starting = false;
      status.textContent = 'Fondo interactivo activado.';
      device.addEventListener('uncapturederror', event => {
        event.preventDefault();
        if (state === current) unavailable();
      });
      device.lost.then(() => {
        if (state !== current) return;
        unavailable();
      });
      syncVisibility();
    } catch {
      if (request === generation && context) context.unconfigure();
      if (device) device.destroy();
      if (request !== generation) return;
      starting = false;
      toggle.checked = false;
      canvas.hidden = true;
      status.textContent = 'El fondo interactivo no está disponible en este navegador o dispositivo.';
    }
  }

  function update() {
    if (!toggle.checked) {
      dispose();
      status.textContent = defaultMessage;
    } else if (reducedMotion()) {
      dispose();
      status.textContent = 'Se activará cuando se desactive la reducción de movimiento.';
    } else if (!state && !starting) {
      start();
    } else {
      syncVisibility();
    }
  }

  desktop.addEventListener('pointermove', event => {
    if (!state || canvas.hidden) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    pointer.active = 1;
  });
  desktop.addEventListener('pointerleave', () => { pointer.active = 0; });
  toggle.addEventListener('change', update);
  motionSetting.addEventListener('change', update);
  motionPreference.addEventListener('change', update);
  document.addEventListener('visibilitychange', syncVisibility);
  new MutationObserver(syncVisibility).observe(login, {attributes: true, attributeFilter: ['hidden']});

  if (!navigator.gpu) {
    toggle.disabled = true;
    status.textContent = 'El fondo interactivo no está disponible en este navegador.';
  }
})();
