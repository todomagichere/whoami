'use strict';

(() => {
  const wallpaper = document.querySelector('.wallpaper');
  const toggle = document.querySelector('#gpu-wallpaper-toggle');
  const status = document.querySelector('#gpu-wallpaper-status');
  const desktop = document.querySelector('#desktop');
  const login = document.querySelector('#login');
  const motionSetting = document.querySelector('#reduce-motion');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultMessage = 'Paisaje espacial que responde al cursor.';
  const pointer = {x: 0.5, y: 0.5, active: 0, smoothX: 0.5, smoothY: 0.5, smoothActive: 0};
  let state = null;
  let generation = 0;
  let starting = false;

  // The two shaders share the same three depth layers and soft nebula.
  const shader = /* wgsl */ `
    struct Parameters {
      resolution: vec2f,
      time: f32,
      pointerStrength: f32,
      pointer: vec2f,
      padding: vec2f,
    }
    @group(0) @binding(0) var<uniform> u: Parameters;

    @vertex fn vertex_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
      var vertices = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
      return vec4f(vertices[index], 0.0, 1.0);
    }

    fn hash(p: vec2f) -> f32 {
      return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
    }

    fn stars(uv: vec2f, density: f32, depth: f32, time: f32, parallax: vec2f) -> f32 {
      let field = uv * density + vec2f(time * 0.009, time * 0.004) * depth + parallax * depth;
      let cell = floor(field);
      let local = fract(field);
      let random = hash(cell);
      let center = vec2f(0.18 + 0.64 * random, 0.18 + 0.64 * hash(cell + 19.7));
      let distance = length(local - center);
      let size = mix(0.018, 0.045, hash(cell + 41.3));
      let core = 1.0 - smoothstep(size * 0.3, size, distance);
      let glow = (1.0 - smoothstep(size, size * 4.5, distance)) * 0.16;
      let twinkle = 0.7 + 0.3 * sin(time * (0.5 + random) + random * 6.283);
      return (core + glow) * twinkle * step(0.25, random);
    }

    @fragment fn fragment_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
      let uv = (position.xy - u.resolution * 0.5) / min(u.resolution.x, u.resolution.y);
      let parallax = (u.pointer - vec2f(0.5)) * u.pointerStrength;
      let time = u.time;
      let drift = uv + parallax * 0.035;
      let wave = sin(drift.x * 3.1 + drift.y * 2.0 + sin(drift.y * 2.8 - time * 0.055) + time * 0.025);
      let cloud = pow(max(0.0, 1.0 - abs(drift.y + drift.x * 0.38 + wave * 0.12)), 4.0);
      let violet = cloud * (0.5 + 0.5 * sin(drift.x * 2.2 - time * 0.025));
      let blue = cloud * (1.0 - violet * 0.55);
      let far = stars(uv, 23.0, 0.3, time, parallax) * 0.30;
      let middle = stars(uv, 14.0, 0.65, time, parallax) * 0.50;
      let near = stars(uv, 8.0, 1.1, time, parallax) * 0.72;
      let starlight = far + middle + near;
      let nebulaAlpha = cloud * 0.24;
      let alpha = clamp(nebulaAlpha + starlight * 0.8, 0.0, 0.88);
      let color = vec3f(0.22, 0.13, 0.48) * violet * 0.20 + vec3f(0.08, 0.37, 0.55) * blue * 0.18 + vec3f(0.78, 0.88, 1.0) * starlight * 0.8;
      return vec4f(min(color, vec3f(alpha)), alpha);
    }
  `;

  const vertexShader = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;

  const fragmentShader = `
    uniform vec2 resolution;
    uniform float time;
    uniform float active;
    uniform vec2 pointer;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float stars(vec2 uv, float density, float depth, vec2 parallax) {
      vec2 field = uv * density + vec2(time * 0.009, time * 0.004) * depth + parallax * depth;
      vec2 cell = floor(field);
      vec2 local = fract(field);
      float random = hash(cell);
      vec2 center = vec2(0.18 + 0.64 * random, 0.18 + 0.64 * hash(cell + 19.7));
      float distanceToStar = length(local - center);
      float size = mix(0.018, 0.045, hash(cell + 41.3));
      float core = 1.0 - smoothstep(size * 0.3, size, distanceToStar);
      float glow = (1.0 - smoothstep(size, size * 4.5, distanceToStar)) * 0.16;
      float twinkle = 0.7 + 0.3 * sin(time * (0.5 + random) + random * 6.283);
      return (core + glow) * twinkle * step(0.25, random);
    }
    void main() {
      vec2 pixel = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
      vec2 uv = (pixel - resolution * 0.5) / min(resolution.x, resolution.y);
      vec2 parallax = (pointer - vec2(0.5)) * active;
      vec2 drift = uv + parallax * 0.035;
      float wave = sin(drift.x * 3.1 + drift.y * 2.0 + sin(drift.y * 2.8 - time * 0.055) + time * 0.025);
      float cloud = pow(max(0.0, 1.0 - abs(drift.y + drift.x * 0.38 + wave * 0.12)), 4.0);
      float violet = cloud * (0.5 + 0.5 * sin(drift.x * 2.2 - time * 0.025));
      float blue = cloud * (1.0 - violet * 0.55);
      float starlight = stars(uv, 23.0, 0.3, parallax) * 0.30 + stars(uv, 14.0, 0.65, parallax) * 0.50 + stars(uv, 8.0, 1.1, parallax) * 0.72;
      float alpha = clamp(cloud * 0.24 + starlight * 0.8, 0.0, 0.88);
      vec3 color = vec3(0.22, 0.13, 0.48) * violet * 0.20 + vec3(0.08, 0.37, 0.55) * blue * 0.18 + vec3(0.78, 0.88, 1.0) * starlight * 0.8;
      gl_FragColor = vec4(min(color, vec3(alpha)), alpha);
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
      const buffer = device.createBuffer({size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
      const bindGroup = device.createBindGroup({layout: pipeline.getBindGroupLayout(0),
        entries: [{binding: 0, resource: {buffer}}]});
      return {
        kind: 'webgpu', canvas, device,
        render(width, height, time) {
          device.queue.writeBuffer(buffer, 0, new Float32Array([width, height, time, pointer.smoothActive, pointer.smoothX, pointer.smoothY, 0, 0]));
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
      const timeLocation = gl.getUniformLocation(program, 'time');
      const pointerLocation = gl.getUniformLocation(program, 'pointer');
      const activeLocation = gl.getUniformLocation(program, 'active');
      if (position < 0 || !resolution || !timeLocation || !pointerLocation || !activeLocation) throw new Error('Shader input unavailable');
      gl.deleteShader(vertex); vertex = null;
      gl.deleteShader(fragment); fragment = null;
      return {
        kind: 'webgl', canvas, gl,
        render(width, height, time) {
          gl.viewport(0, 0, width, height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.enableVertexAttribArray(position);
          gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
          gl.uniform2f(resolution, width, height);
          gl.uniform1f(timeLocation, time);
          gl.uniform2f(pointerLocation, pointer.smoothX, pointer.smoothY);
          gl.uniform1f(activeLocation, pointer.smoothActive);
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
    const elapsed = current.lastFrame ? Math.min((timestamp - current.lastFrame) / 1000, 0.1) : 0;
    current.lastFrame = timestamp;
    current.time += elapsed;
    const easing = 1 - Math.exp(-elapsed * 3);
    pointer.smoothX += (pointer.x - pointer.smoothX) * easing;
    pointer.smoothY += (pointer.y - pointer.smoothY) * easing;
    pointer.smoothActive += (pointer.active - pointer.smoothActive) * easing;
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
      current.render(width, height, current.time);
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
      const current = {...renderer, time: 0, frame: 0, lastFrame: 0};
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
