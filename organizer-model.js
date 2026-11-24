import * as THREE from './assets/three.module.js';
import { beveledBox, fineSurfaceTexture } from './furniture-surfaces.js';

// Shared model for the interactive studio and the exported AR asset. Units: metres.
export function createOrganizerModel({ surfaceDetail = false } = {}) {
  const model = new THREE.Group();
  model.name = 'Caoba_Organizador_180x50x30cm';
  const white = new THREE.MeshStandardMaterial({ color: '#f2f0ec', roughness: .43 });
  const inner = new THREE.MeshStandardMaterial({ color: '#ded9d1', roughness: .68 });
  const handle = new THREE.MeshStandardMaterial({ color: '#22201e', roughness: .39, metalness: .46 });
  const hinge = new THREE.MeshStandardMaterial({ color: '#b1aaa2', roughness: .37, metalness: .65 });
  if (surfaceDetail) {
    const finish = fineSurfaceTexture();
    for (const material of [white, inner]) {
      material.bumpMap = finish;
      material.bumpScale = .00012;
    }
  }
  const doors = [];
  function box(name, w, h, d, x, y, z, material, parent = model) {
    const radius = Math.min(.00145, Math.min(w, h, d) * .17);
    const mesh = new THREE.Mesh(beveledBox(w, h, d, radius), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const width = .5, height = 1.8, thickness = .018, plinth = .08;
  // Total exterior depth, including closed doors and handles, is exactly 30 cm.
  const bodyDepth = .262, bodyZ = -.019, front = .112;
  box('Zocalo', width, plinth, bodyDepth - .038, 0, .04, bodyZ - .011, inner);
  box('Lateral_izquierdo', thickness, height - plinth, bodyDepth, -width / 2 + thickness / 2, (height + plinth) / 2, bodyZ, white);
  box('Lateral_derecho', thickness, height - plinth, bodyDepth, width / 2 - thickness / 2, (height + plinth) / 2, bodyZ, white);
  box('Tapa', width, thickness, bodyDepth, 0, height - thickness / 2, bodyZ, white);
  box('Base', width, thickness, bodyDepth, 0, plinth + thickness / 2, bodyZ, white);
  box('Fondo', width - 2 * thickness, height - plinth - 2 * thickness, thickness, 0, (height + plinth) / 2, -.15 + thickness / 2, inner);
  for (let i = 1; i < 4; i++) box(`Estante_${i}`, width - 2 * thickness, thickness, bodyDepth - 2 * thickness, 0, plinth + (height - plinth) * i / 4, bodyZ, inner);
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = side < 0 ? 'Puerta_izquierda' : 'Puerta_derecha';
    pivot.position.set(side * (width / 2 - .003), (height + plinth) / 2, front);
    model.add(pivot);
    const doorWidth = (width - .008) / 2;
    box('Frente', doorWidth, height - plinth - .01, thickness, -side * doorWidth / 2, 0, thickness / 2, white, pivot);
    const pullX = -side * (doorWidth - .025);
    box('Barra del tirador', .011, .22, .009, pullX, .02, .0335, handle, pivot);
    for (const y of [-.067, .107]) box('Soporte del tirador', .01, .013, .017, pullX, y, .024, handle, pivot);
    for (const y of [-.64, 0, .64]) {
      box('Placa de bisagra', .028, .047, .007, -side * .026, y, -.003, hinge, pivot);
      box('Brazo de bisagra', .035, .017, .019, -side * .019, y, -.012, hinge, pivot);
    }
    doors.push({ pivot, side });
  }
  return {
    model,
    setDoorsOpen(open) {
      for (const { pivot, side } of doors) pivot.rotation.y = Number(open) * side * Math.PI * .56;
    }
  };
}
