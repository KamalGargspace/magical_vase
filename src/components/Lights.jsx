import React from "react";
import { logger } from "../utils/logger";

const log = logger.create('Lights');

/**
 * Cinematic lighting rig tuned for a dark, moody scene matching the reference.
 * 
 * Key changes from previous:
 *   • Ambient dramatically reduced to keep the scene dark
 *   • Purple accent reduced to avoid washing out the background
 *   • Lights focused tightly on the vase to make it the star
 *   • Golden underglow kept for the rock island effect
 */
export default function Lights() {
  try {
    log.debug('Rendering lights rig');
  } catch (e) {
    // Non-critical
  }

  return (
    <group>
      {/* Increased ambient light to make the terrain and background visible */}
      <ambientLight color="#3d355c" intensity={2.5} />

      {/* Key light: warm white from top-left to illuminate glass interior */}
      <directionalLight
        position={[-4, 8, 5]}
        intensity={3.5}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Purple accent from top-right: subtle purple mood on the ridges */}
      <directionalLight
        position={[5, 6, 2]}
        intensity={2.0}
        color="#8b45d9"
      />

      {/* Warm gold fill from behind/below: creates the golden inner glow */}
      <pointLight
        position={[0, 0, -3]}
        intensity={4.0}
        color="#fbbf24"
        distance={10}
        decay={2}
      />

      {/* Top specular spot: makes the glass rim sparkle */}
      <spotLight
        position={[0, 10, 3]}
        angle={0.3}
        penumbra={1}
        intensity={6.0}
        color="#ffffff"
        castShadow
      />

      {/* Floor bounce: warm glow reflecting off the surface */}
      <pointLight
        position={[0, -1, 3]}
        intensity={1.5}
        color="#fcd34d"
        distance={8}
        decay={2}
      />

      {/* ✦ Golden-amber glow beneath the floating island */}
      <pointLight
        position={[0, -2.5, 0]}
        intensity={6.0}
        color="#f59e0b"
        distance={5}
        decay={2}
      />

      {/* Warm underside fill — broader golden aura */}
      <spotLight
        position={[0, -3.5, 0]}
        angle={0.8}
        penumbra={1}
        intensity={3.0}
        color="#d97706"
        distance={8}
        target-position={[0, 0, 0]}
      />

      {/* Subtle rim light from behind to separate vase from dark background */}
      <pointLight
        position={[0, 3, -4]}
        intensity={2.0}
        color="#6b45a0"
        distance={8}
        decay={2}
      />
    </group>
  );
}
