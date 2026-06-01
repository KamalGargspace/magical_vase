import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CameraRig — Cinematic scroll dolly + mouse parallax.
 *
 * At progress=0, camera sits low and close for an imposing hero shot.
 * At progress=1, it sweeps up and back for a wide reveal.
 * Mouse parallax adds organic life on every frame.
 */
export default function CameraRig({ progress = 0 }) {
  useFrame((state) => {
    // Scroll-driven dolly path
    const baseX = 0;
    const baseY = THREE.MathUtils.lerp(1.2, 4.0, progress);
    const baseZ = THREE.MathUtils.lerp(5.5, 9.0, progress);

    // Mouse parallax overlay
    const mx = state.pointer.x * 0.6;
    const my = state.pointer.y * 0.35;

    // Ease toward target each frame for silky smoothness
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, baseX + mx, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, baseY + my, 0.04);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, baseZ, 0.04);

    // Look at a point that rises slightly with scroll
    const lookY = THREE.MathUtils.lerp(0.5, 1.2, progress);
    state.camera.lookAt(0, lookY, 0);
  });

  return null;
}
