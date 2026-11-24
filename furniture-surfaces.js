import * as THREE from './assets/three.module.js';

// Project the vertices of a segmented cube onto a box with gently rounded edges.
// Keep the planar section wide so slight bevels catch light without rounding the joinery.
export function beveledBox(width, height, depth, radius) {
  const segments = 5;
  const geometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const bevelNormal = new THREE.Vector3();
  const flat = 0.5 / segments;
  const inner = (value, length) => Math.sign(value) * Math.max(0, length / 2 - radius);
  const rounded = value => Math.sign(value) * Math.max(0, Math.abs(value) - flat);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i);
    bevelNormal.set(rounded(x), rounded(y), rounded(z)).normalize();
    const px = inner(x, width) + radius * bevelNormal.x;
    const py = inner(y, height) + radius * bevelNormal.y;
    const pz = inner(z, depth) + radius * bevelNormal.z;
    positions.setXYZ(i, px, py, pz);
    normals.setXYZ(i, bevelNormal.x, bevelNormal.y, bevelNormal.z);
    if (nx) uv.setXY(i, 0.5 - nx * pz / depth, 0.5 + py / height);
    else if (ny) uv.setXY(i, 0.5 + px / width, 0.5 - ny * pz / depth);
    else uv.setXY(i, 0.5 + nz * px / width, 0.5 + py / height);
  }
  return geometry;
}

export function fineSurfaceTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  let seed = 4027;
  for (let i = 0; i < data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = data[i + 1] = data[i + 2] = 92 + (seed >>> 26);
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  return texture;
}
