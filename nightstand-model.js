import * as THREE from './assets/three.module.js';
import { beveledBox } from './furniture-surfaces.js';

function woodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(512, 512);
  let random = 729;
  // Broad bands and fine pores follow the same gently warped grain.
  for (let y = 0; y < 512; y++) {
    const ripple = Math.sin(y / 147) * 6 + Math.sin(y / 51) * 2.8;
    const sweep = Math.exp(-((y - 248) ** 2) / 23500);
    for (let x = 0; x < 512; x++) {
      const bend = 21 * sweep * Math.exp(-((x - 345) ** 2) / 10700);
      const grain = x + ripple + bend + 3.8 * Math.sin(y / 86 + x / 94);
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const speckle = (random >>> 28) / 16 - 0.5;
      const broad = Math.sin(grain / 23) * 5.5 + Math.sin(grain / 54 + 1.7) * 6.8;
      const fiber = 4.8 * Math.sin(grain * 1.65) + 2.3 * Math.sin(grain * 3.3 + y / 47);
      const pore = Math.max(0, Math.sin(grain * 0.91 + Math.sin(grain / 9))) ** 9;
      const shade = broad + fiber - 12 * pore + 5 * speckle;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = 194 + shade;
      pixels.data[i + 1] = 150 + shade * 0.92;
      pixels.data[i + 2] = 106 + shade * 0.78;
      pixels.data[i + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createNightstandModel() {
  const model = new THREE.Group();
  model.name = 'Mesa_de_luz_flotante_referencia_visual';
  const grain = woodTexture();
  const horizontalGrain = grain.clone();
  horizontalGrain.center.set(0.5, 0.5);
  horizontalGrain.rotation = Math.PI / 2;
  const wood = new THREE.MeshStandardMaterial({ map: grain, bumpMap: grain, bumpScale: .007, roughness: .51 });
  const horizontal = wood.clone();
  horizontal.map = horizontal.bumpMap = horizontalGrain;
  const inside = new THREE.MeshStandardMaterial({ map: grain, color: '#c5b8a6', roughness: .76 });
  const drawer = new THREE.Group();
  drawer.name = 'Cajón';
  model.add(drawer);

  function board(name, width, height, depth, x, y, z, material = wood, parent = model) {
    const mesh = new THREE.Mesh(beveledBox(width, height, depth, .008), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
  }

  // Relative proportions estimated from the photo. These values are not dimensions in metres.
  board('Tapa', 1.78, 0.062, 1.14, 0, 1.28, 0, horizontal);
  board('Estante inferior', 1.74, 0.072, 1.12, 0, 0.056, 0, horizontal);
  board('Lateral izquierdo', 0.071, 1.152, 1.09, -0.833, 0.668, -0.015);
  board('Lateral derecho', 0.071, 1.152, 1.09, 0.833, 0.668, -0.015);
  board('Fondo', 1.595, 1.152, 0.055, 0, 0.668, -0.525, inside);
  board('División del cajón', 1.595, 0.05, 1.0, 0, 0.61, 0.005, inside);
  board('Frente sin tirador', 1.728, 0.592, 0.065, 0, 0.943, 0.528, wood, drawer);
  board('Base del cajón', 1.467, 0.045, 0.938, 0, 0.711, 0.025, inside, drawer);
  board('Trasera del cajón', 1.467, 0.27, 0.047, 0, 0.86, -0.421, inside, drawer);
  for (const x of [-0.71, 0.71]) board('Costado del cajón', 0.047, 0.27, 0.921, x, 0.86, 0.04, inside, drawer);

  return { model, setDoorsOpen(open) { drawer.position.z = Number(open) * .52; } };
}
