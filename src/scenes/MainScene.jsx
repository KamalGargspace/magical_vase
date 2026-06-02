import React from "react";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { BlendFunction } from "postprocessing";
import { logger } from "../utils/logger";
import Lights from "../components/Lights";
import Vase from "../components/Vase";
import PetalSystem from "../components/PetalSystem";
import CameraRig from "../components/CameraRig";
import Background3D from "../components/Background3D";

const log = logger.create('MainScene');

/**
 * MainScene — Assembles all 3D actors and post-processing effects.
 *
 * Performance notes:
 *   • Reflector resolution capped at 512 (was 1024) to halve GPU fill rate
 *   • Bloom kernel reduced to 2 (was 3) for faster blur passes
 *   • Blur quality lowered to [200, 80] for lighter reflector cost
 */
export default function MainScene({ progress = 0 }) {
  try {
    log.debug('Rendering MainScene', { progress: progress.toFixed(3) });
  } catch (err) {
    // Non-critical — swallow logging errors silently
  }

  return (
    <>
      {/* 3D atmospheric background — sky sphere, dust, light beams */}
      <Background3D />

      {/* Environment map for glass reflections only (not rendered as background) */}
      <Environment preset="night" background={false} />

      {/* Water Reflection Floor — resolution 512 for performance */}
      <mesh position={[0, -2.0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <MeshReflectorMaterial
          blur={[200, 80]}
          resolution={512}
          mixBlur={2}
          mixStrength={60}
          roughness={0.3}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#010208"
          metalness={0.7}
        />
      </mesh>

      {/* Scene actors */}
      <Lights />
      <Vase progress={progress} />
      <PetalSystem progress={progress} />
      <CameraRig progress={progress} />

      {/* Post-processing stack — reduced kernel for perf */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          kernelSize={2}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.15}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.5} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0006, 0.0006]}
        />
      </EffectComposer>
    </>
  );
}
