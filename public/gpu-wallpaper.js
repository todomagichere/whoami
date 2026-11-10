'use strict';

(() => {
  const wallpaper = document.querySelector('.wallpaper');
  const toggle = document.querySelector('#gpu-wallpaper-toggle');
  const status = document.querySelector('#gpu-wallpaper-status');
  const desktop = document.querySelector('#desktop');
  const login = document.querySelector('#login');
  const motionSetting = document.querySelector('#reduce-motion');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultMessage = 'Constelación que responde al cursor.';
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

  const vertexShader = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;

  const fragmentShader = `
    uniform vec2 resolution;
    uniform vec4 points[14];

    float nodeLight(vec2 uv, vec2 p, vec2 next) {
      float distanceToPoint = length(uv - p);
      float light = (1.0 - smoothstep(0.0015, 0.0045, distanceToPoint)) * 0.42;
      light += (1.0 - smoothstep(0.0, 0.035, distanceToPoint)) * 0.035;
      vec2 segment = next - p;
      if (length(segment) < 0.28) {
        float amount = clamp(dot(uv - p, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
        float lineDistance = length(uv - p - amount * segment);
        light += (1.0 - smoothstep(0.0005, 0.0025, lineDistance)) * 0.16;
      }
      return light;
    }

    void main() {
      float shortest = min(resolution.x, resolution.y);
      vec2 pixel = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
      vec2 uv = (pixel - resolution * 0.5) / shortest;
      float light = 0.0;
      for (int i = 0; i < 13; i++) {
        light += nodeLight(uv, points[i].xy, points[i].zw);
        light += nodeLight(uv, points[i].zw, points[i + 1].xy);
      }
      float alpha = clamp(light, 0.0, 0.6);
      gl_FragColor = vec4(vec3(0.74, 0.9, 0.85) * alpha, alpha);
    }
  `;

  function reducedMotion() {
    return motionPreference.matches || document.body.classList.contains('reduce-motion');
  }

  function freshCanvas(id) {
    const previous = wallpaper.querySelector(`#${id}`);
    const next = previous.cloneNode(false);
    next.hidden = true;
    previous.replaceWith(next);
    return next;
  }

  function dispose() {
    generation++;
    starting = false;
    const previous = state;
    state = null;
    wallpaper.querySelectorAll('canvas').forEach(canvas => { canvas.hidden = true; });
    if (previous) {
      cancelAnimationFrame(previous.frame);
      previous.dispose();
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

  async function createWebGPU(canvas) {
    let device = null;
    let context = null;
    try {
      const adapter = await navigator.gpu.requestAdapter({powerPreference: 'low-power'});
      if (!adapter) throw new Error('WebGPU adapter unavailable');
      device = await adapter.requestDevice();
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
      const buffer = device.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
      const pointBuffer = device.createBuffer({size: 33 * 4 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
      const bindGroup = device.createBindGroup({layout: pipeline.getBindGroupLayout(0),
        entries: [{binding: 0, resource: {buffer}}, {binding: 1, resource: {buffer: pointBuffer}}]});
      return {
        kind: 'webgpu', canvas, device,
        render(width, height, points) {
          device.queue.writeBuffer(buffer, 0, new Float32Array([width, height, 0, 0]));
          device.queue.writeBuffer(pointBuffer, 0, points);
          const encoder = device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [{view: context.getCurrentTexture().createView(),
              clearValue: {r: 0, g: 0, b: 0, a: 0}, loadOp: 'clear', storeOp: 'store'}]
          });
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bindGroup);
          pass.draw(3);
          pass.end();
          device.queue.submit([encoder.finish()]);
        },
        dispose() { context.unconfigure(); device.destroy(); }
      };
    } catch (error) {
      if (context) context.unconfigure();
      if (device) device.destroy();
      throw error;
    }
  }

  function createWebGL(canvas) {
    const options = {alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power'};
    const gl = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
    if (!gl) throw new Error('WebGL unavailable');
    let vertex = null, fragment = null, program = null, buffer = null;
    try {
      function compile(type, source) {
        const compiled = gl.createShader(type);
        if (!compiled) throw new Error('Shader allocation failed');
        gl.shaderSource(compiled, source);
        gl.compileShader(compiled);
        if (!gl.getShaderParameter(compiled, gl.COMPILE_STATUS)) {
          gl.deleteShader(compiled);
          throw new Error('Shader compilation failed');
        }
        return compiled;
      }
      const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      vertex = compile(gl.VERTEX_SHADER, vertexShader);
      fragment = compile(gl.FRAGMENT_SHADER, `precision ${precision && precision.precision ? 'highp' : 'mediump'} float;\n${fragmentShader}`);
      program = gl.createProgram();
      if (!program) throw new Error('Program allocation failed');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program linking failed');
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Buffer allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      const resolution = gl.getUniformLocation(program, 'resolution');
      const pointLocation = gl.getUniformLocation(program, 'points[0]');
      if (position < 0 || !resolution || !pointLocation) throw new Error('Shader input unavailable');
      const packed = new Float32Array(14 * 4);
      gl.deleteShader(vertex); vertex = null;
      gl.deleteShader(fragment); fragment = null;
      return {
        kind: 'webgl', canvas, gl,
        render(width, height, points) {
          for (let i = 0; i < 28; i++) {
            packed[i * 2] = points[i * 4];
            packed[i * 2 + 1] = points[i * 4 + 1];
          }
          gl.viewport(0, 0, width, height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.enableVertexAttribArray(position);
          gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
          gl.uniform2f(resolution, width, height);
          gl.uniform4fv(pointLocation, packed);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
        dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); }
      };
    } catch (error) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      throw error;
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
    const canvas = current.canvas;
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
      current.render(width, height, current.points);
      current.frame = requestAnimationFrame(draw);
    } catch {
      if (state === current) unavailable();
    }
  }

  function unavailable() {
    const previous = state;
    dispose();
    if (previous?.kind === 'webgpu' && toggle.checked && !reducedMotion()) {
      start(true);
      return;
    }
    toggle.checked = false;
    status.textContent = 'El fondo interactivo dejó de estar disponible.';
  }

  function syncVisibility() {
    if (!state) return;
    const visible = toggle.checked && !reducedMotion() && !document.hidden && login.hidden;
    state.canvas.hidden = !visible;
    if (!visible) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    } else if (!state.frame) {
      state.lastFrame = 0;
      state.frame = requestAnimationFrame(draw);
    }
  }

  async function start(skipWebGPU = false) {
    const request = ++generation;
    let renderer = null;
    starting = true;
    status.textContent = 'Preparando el fondo interactivo…';
    try {
      if (!skipWebGPU && navigator.gpu) {
        try { renderer = await createWebGPU(freshCanvas('gpu-wallpaper')); } catch { /* Try WebGL. */ }
      }
      if (request !== generation || !toggle.checked || reducedMotion()) {
        if (renderer) renderer.dispose();
        return;
      }
      if (!renderer) renderer = createWebGL(freshCanvas('webgl-wallpaper'));
      if (request !== generation || !toggle.checked || reducedMotion()) {
        renderer.dispose();
        return;
      }
      const current = {...renderer, points: new Float32Array(33 * 4), frame: 0, lastFrame: 0};
      state = current;
      starting = false;
      status.textContent = 'Fondo interactivo activado.';
      if (current.kind === 'webgpu') {
        current.device.addEventListener('uncapturederror', event => {
          event.preventDefault();
          if (state === current) unavailable();
        });
        current.device.lost.then(() => {
          if (state === current) unavailable();
        });
      } else {
        current.canvas.addEventListener('webglcontextlost', event => {
          event.preventDefault();
          if (state === current) unavailable();
        });
      }
      syncVisibility();
    } catch {
      if (renderer) renderer.dispose();
      if (request !== generation) return;
      starting = false;
      toggle.checked = false;
      wallpaper.querySelectorAll('canvas').forEach(canvas => { canvas.hidden = true; });
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
    if (!state || state.canvas.hidden) return;
    const rect = state.canvas.getBoundingClientRect();
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

})();
