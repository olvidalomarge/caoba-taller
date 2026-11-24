import * as THREE from './assets/three.module.js';
import { OrbitControls } from './assets/OrbitControls.js';
import { createOrganizerModel } from './organizer-model.js';
import { lightStudio } from './studio-lighting.js';

export function createStudio({ canvas, state, createModel = createOrganizerModel, view = {} }) {
  const {
    position = [1.55, 1.55, 3.25], targetHeight = .84,
    minDistance = 1.2, maxDistance = 7, floating = false
  } = view;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const updateBackdrop = lightStudio(scene, { floating, targetHeight });
  const camera = new THREE.PerspectiveCamera(38, 1, .05, 35);
  const initial = new THREE.Vector3(...position);
  const target = new THREE.Vector3(0, targetHeight, 0);
  camera.position.copy(initial);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = !reducedMotion.matches;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minPolarAngle = .15;
  controls.enablePan = false;
  controls.update();

  const { model, setDoorsOpen } = createModel({ surfaceDetail: true });
  scene.add(model);
  const dialog = canvas.closest('dialog');
  let frame = 0;
  let movement;
  let open = Number(state().open);
  setDoorsOpen(open);

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas.parentElement;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = floating && camera.aspect < .94
      ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(19)) * .94 / camera.aspect))
      : 38;
    camera.updateProjectionMatrix();
  }

  function requestRender() {
    if (frame || document.hidden || !dialog.open) return;
    frame = requestAnimationFrame(render);
  }

  function render(time) {
    frame = 0;
    if (document.hidden || !dialog.open) return;
    if (movement) {
      const t = Math.min(1, (time - movement.start) / movement.duration);
      open = THREE.MathUtils.lerp(movement.from, movement.to, 1 - (1 - t) ** 3);
      setDoorsOpen(open);
      if (t >= 1) movement = undefined;
      else requestRender();
    }
    controls.update();
    updateBackdrop(camera);
    renderer.render(scene, camera);
  }

  controls.addEventListener('change', requestRender);
  document.addEventListener('visibilitychange', requestRender);
  new ResizeObserver(() => { resize(); requestRender(); }).observe(canvas.parentElement);
  resize();
  requestRender();

  return {
    update() {
      const next = Number(state().open);
      if (reducedMotion.matches || next === open) {
        movement = undefined;
        open = next;
        setDoorsOpen(open);
      } else {
        movement = { from: open, to: next, start: performance.now(), duration: floating ? 330 : 410 };
      }
      requestRender();
    },
    resize() { resize(); requestRender(); },
    rotate() {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
      offset.clampLength(minDistance, maxDistance);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    reset() {
      camera.position.copy(initial);
      controls.target.copy(target);
      controls.update();
      requestRender();
    }
  };
}
