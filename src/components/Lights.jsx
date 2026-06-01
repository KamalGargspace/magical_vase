import React from "react";

/**
 * Cinematic 5-light rig tuned for translucent purple glass.
 * Designed to illuminate THROUGH the glass, not just on its surface.
 */
export default function Lights() {
  return (
    <group>
      {/* Soft violet ambient — sets the purple mood */}
      <ambientLight color="#2d1b69" intensity={2.0} />

      {/* Key light: warm white from top-left to illuminate glass interior */}
      <directionalLight
        position={[-4, 8, 5]}
        intensity={5.0}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Purple accent from top-right: defines the purple mood on the ridges */}
      <directionalLight
        position={[5, 6, 2]}
        intensity={4.0}
        color="#a855f7"
      />

      {/* Warm gold fill from behind/below: creates the golden inner glow */}
      <pointLight
        position={[0, 0, -3]}
        intensity={6.0}
        color="#fbbf24"
        distance={12}
        decay={2}
      />

      {/* Top specular spot: makes the glass rim sparkle */}
      <spotLight
        position={[0, 10, 3]}
        angle={0.3}
        penumbra={1}
        intensity={8.0}
        color="#ffffff"
        castShadow
      />

      {/* Floor bounce: warm glow reflecting off the surface */}
      <pointLight
        position={[0, -1, 3]}
        intensity={2.0}
        color="#fcd34d"
        distance={8}
        decay={2}
      />
    </group>
  );
}
