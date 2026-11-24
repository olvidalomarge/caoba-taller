import * as THREE from './assets/three.module.js';
import { beveledBox, fineSurfaceTexture } from './furniture-surfaces.js';

let reflectionMap;
function studioReflections() {
  if (reflectionMap) return reflectionMap;
  const width = 128, height = 64;
  const data = new Uint16Array(width * height * 4);
  const half = THREE.DataUtils.toHalfFloat;
  // Softboxes in linear light. Brighter regions form wide, soft reflections.
  const softboxes = [
    { u: 0.8, v: .72, sx: .055, sy: .14, color: [2.5, 2.28, 2.05] },
    { u: 0.46, v: .65, sx: .09, sy: .09, color: [1.15, 1.22, 1.37] }
  ];
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const values = [0.10 + v * .18, .084 + v * .18, .069 + v * .19];
      for (const { u: centerU, v: centerV, sx, sy, color } of softboxes) {
        const distance = Math.abs(u - centerU);
        const du = Math.min(distance, 1 - distance);
        const fade = Math.exp(-((du / sx) ** 2 + ((v - centerV) / sy) ** 2));
        for (let channel = 0; channel < 3; channel++) values[channel] += fade * color[channel];
      }
      const i = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) data[i + channel] = half(values[channel]);
      data[i + 3] = half(1);
    }
  }
  reflectionMap = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  reflectionMap.colorSpace = THREE.LinearSRGBColorSpace;
  reflectionMap.mapping = THREE.EquirectangularReflectionMapping;
  reflectionMap.magFilter = reflectionMap.minFilter = THREE.LinearFilter;
  reflectionMap.needsUpdate = true;
  return reflectionMap;
}

function softContact(width, depth, opacity) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  const fade = context.createRadialGradient(48, 48, 8, 48, 48, 48);
  fade.addColorStop(0, '#000');
  fade.addColorStop(.35, '#000b');
  fade.addColorStop(.7, '#0003');
  fade.addColorStop(1, '#0000');
  context.fillStyle = fade;
  context.fillRect(0, 0, 96, 96);
  const material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas), color: '#312015', transparent: true,
    opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
}

function wallFinish() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const washed = context.createRadialGradient(110, 88, 3, 110, 88, 75);
  washed.addColorStop(0, '#e0cebc');
  washed.addColorStop(.45, '#d1beaa');
  washed.addColorStop(1, '#bfa992');
  context.fillStyle = washed;
  context.fillRect(0, 0, 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function lightStudio(scene, { floating, targetHeight }) {
  scene.background = new THREE.Color('#d2bca8');
  scene.fog = new THREE.Fog('#d2bca8', 6, 15);
  scene.environment = studioReflections();
  scene.environmentIntensity = .66;
  scene.add(new THREE.HemisphereLight('#fff7ec', '#ab9684', .50));

  const key = new THREE.DirectionalLight('#fff1e6', 2.05);
  key.position.set(-2.25, 5.1, 3.35);
  key.target.position.set(0, targetHeight, 0);
  key.castShadow = true;
  const shadowSize = matchMedia('(pointer: coarse)').matches ? 1024 : 1536;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, { left: -2.15, right: 2.15, top: 2, bottom: -2, near: .1, far: 12 });
  key.shadow.bias = -.00025;
  key.shadow.normalBias = floating ? .009 : .003;
  key.shadow.radius = shadowSize / 105;
  key.shadow.blurSamples = 8;
  key.shadow.intensity = .72;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#e8efff', .48);
  fill.position.set(4, 2.8, -2);
  scene.add(fill);

  const texture = fineSurfaceTexture();
  const floorY = floating ? -.72 : -.002;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({
    color: '#b9a18a', roughness: .89, bumpMap: texture, bumpScale: .0015
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  scene.add(floor);
  const contact = softContact(floating ? 2.5 : .79, floating ? 1.85 : .56, floating ? .25 : .61);
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(floating ? .23 : .018, floorY + .002, floating ? -.18 : -.018);
  scene.add(contact);

  // The nightstand floats against the backdrop in the front view; the wall clears the orbit behind it.
  if (!floating) return () => {};
  const wall = new THREE.Group();
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), new THREE.MeshStandardMaterial({
    map: wallFinish(), roughness: .96, bumpMap: texture, bumpScale: .0025
  }));
  backdrop.position.set(0, 3.28, -.555);
  backdrop.receiveShadow = true;
  wall.add(backdrop);
  const baseboard = new THREE.Mesh(beveledBox(18, .095, .032, .004), new THREE.MeshStandardMaterial({
    color: '#ddd0c0', roughness: .64
  }));
  baseboard.position.set(0, floorY + .0475, -.535);
  baseboard.receiveShadow = true;
  wall.add(baseboard);
  scene.add(wall);
  return camera => { wall.visible = camera.position.z > -.43; };
}
