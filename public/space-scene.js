import * as THREE from './vendor/three/three.module.js';

// A seeded field keeps the shape of the galaxy stable between activations.
function randomGenerator() {
  let seed = 17381;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function createSpaceScene(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: false, powerPreference: 'low-power'});
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 3.1, 15);
  const galaxy = new THREE.Group();
  galaxy.position.set(1.4, -0.25, 0);
  galaxy.rotation.set(0.62, -0.18, -0.15);
  scene.add(galaxy);
  const random = randomGenerator();
  const resources = [];

  function points(positions, colors, sizes, opacity) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {opacity: {value: opacity}},
      vertexShader: `attribute float size; varying vec3 vColor;
        void main() { vColor = color; vec4 view = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * view;
          gl_PointSize = clamp(size * (300.0 / -view.z), 1.0, 36.0); }`,
      fragmentShader: `varying vec3 vColor; uniform float opacity;
        void main() { float d = length(gl_PointCoord - vec2(0.5));
          float glow = pow(max(0.0, 1.0 - d * 2.0), 2.0);
          gl_FragColor = vec4(vColor, glow * opacity); }`,
      vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    resources.push(geometry, material);
    return new THREE.Points(geometry, material);
  }

  const positions = [], colors = [], sizes = [];
  const inner = new THREE.Color('#ffd5b0'), outer = new THREE.Color('#5688f5');
  const rose = new THREE.Color('#d37bb6');
  for (let i = 0; i < 7600; i++) {
    const radius = 0.15 + Math.pow(random(), 1.45) * 6.6;
    const arm = (i % 4) * Math.PI / 2;
    const angle = arm + radius * 0.68 + (random() - 0.5) * (0.4 + radius * 0.13);
    const spread = 0.035 + radius * 0.045;
    positions.push(Math.cos(angle) * radius + (random() - 0.5) * spread,
      (random() - 0.5) * (0.18 + radius * 0.13),
      Math.sin(angle) * radius + (random() - 0.5) * spread);
    const color = inner.clone().lerp(outer, Math.min(1, radius / 5.8));
    if (random() < 0.28) color.lerp(rose, 0.55);
    color.multiplyScalar(0.55 + random() * 0.45);
    colors.push(color.r, color.g, color.b);
    sizes.push(0.10 + Math.pow(random(), 5) * 0.27);
  }
  galaxy.add(points(positions, colors, sizes, 0.95));

  const starPositions = [], starColors = [], starSizes = [];
  for (let i = 0; i < 1000; i++) {
    starPositions.push((random() - 0.5) * 50, (random() - 0.5) * 30, -8 - random() * 25);
    const tint = 0.55 + random() * 0.45;
    starColors.push(tint * 0.72, tint * 0.83, tint);
    starSizes.push(0.045 + Math.pow(random(), 7) * 0.22);
  }
  scene.add(points(starPositions, starColors, starSizes, 0.7));

  // A soft sprite-like core gives the galaxy volume without an expensive post-processing pass.
  const glowGeometry = new THREE.PlaneGeometry(5.2, 5.2);
  const glowMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; void main() { float d = length(vUv - 0.5) * 2.0;
      float glow = pow(max(0.0, 1.0 - d), 3.5);
      gl_FragColor = vec4(0.72, 0.38, 0.56, glow * 0.32); }`
  });
  resources.push(glowGeometry, glowMaterial);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  galaxy.add(glow);

  let lastWidth = 0, lastHeight = 0;
  return {
    kind: 'three', canvas,
    render(width, height, time, pointer) {
      if (width !== lastWidth || height !== lastHeight) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        lastWidth = width; lastHeight = height;
      }
      galaxy.rotation.y = -0.18 + time * 0.018;
      camera.position.x = (pointer.smoothX - 0.5) * pointer.smoothActive * 1.8;
      camera.position.y = 3.1 - (pointer.smoothY - 0.5) * pointer.smoothActive * 0.9;
      camera.lookAt(0.4, 0, 0);
      renderer.render(scene, camera);
    },
    dispose() { resources.forEach(resource => resource.dispose()); renderer.dispose(); }
  };
}
