import React from "react";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { BlendFunction } from "postprocessing";
import Lights from "../components/Lights";
import Vase from "../components/Vase";
import PetalSystem from "../components/PetalSystem";
import CameraRig from "../components/CameraRig";
import Background3D from "../components/Background3D";

/**
 * MainScene — Assembles all 3D actors and post-processing effects.
 */
export default function MainScene({ progress = 0 }) {
  return (
    <>
      {/* 3D atmospheric background — sky sphere, dust, light beams */}
      <Background3D />

      {/* Environment map for glass reflections only (not rendered as background) */}
      <Environment preset="night" background={false} />

      {/* Water Reflection Floor */}
      <mesh position={[0, -2.0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={2}
          mixStrength={80}
          roughness={0.2}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#02030a"
          metalness={0.8}
        />
      </mesh>

      {/* Scene actors */}
      <Lights />
      <Vase progress={progress} />
      <PetalSystem progress={progress} />
      <CameraRig progress={progress} />

      {/* Post-processing stack */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          kernelSize={3}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.15}
        />
        <Vignette eskil={false} offset={0.15} darkness={1.2} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0006, 0.0006]}
        />
      </EffectComposer>
    </>
  );
}
