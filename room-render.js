import * as THREE from './assets/three.module.js';
import { createOrganizerModel } from './organizer-model.js';

export function createRoomRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  camera.position.z = 5;
  const scene = new THREE.Scene();
  const pivot = new THREE.Group();
  const { model } = createOrganizerModel({ surfaceDetail: true });
  pivot.rotation.x = 0.13;
  pivot.add(model);
  scene.add(pivot, new THREE.HemisphereLight('#fff9ef', '#aa8c77', 2.2));

  const key = new THREE.DirectionalLight('#fff4e7', 2.5);
  key.position.set(-2, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#edf4ff', 0.9);
  fill.position.set(3, 1, 2);
  scene.add(fill);

  let width = 0;
  let height = 0;
  return function draw({ x, y, size, angle }) {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    if (width !== nextWidth || height !== nextHeight) {
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.left = -width / height;
      camera.right = width / height;
      camera.updateProjectionMatrix();
    }
    pivot.position.set((2 * x - 1) * width / height, 1 - 2 * y, 0);
    pivot.scale.setScalar(size / 90);
    model.rotation.y = THREE.MathUtils.degToRad(angle);
    renderer.render(scene, camera);
  };
}
