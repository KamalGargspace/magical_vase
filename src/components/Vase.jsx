import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { motion } from "framer-motion-3d";

const vaseModelUrl = "/vase.glb";

// ─── Translucent Purple Glass Material ──────────────────────────────────────
function useGlassMaterial() {
  return useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      // Core glass physics
      transmission: 1.0,
      transparent: true,
      opacity: 1.0,
      thickness: 1.5,
      ior: 1.45,

      // Purple attenuation — light passing through picks up this color
      attenuationDistance: 0.8,
      attenuationColor: new THREE.Color("#c084fc"), // Bright lilac purple

      // Surface appearance
      roughness: 0.05,
      metalness: 0.0,
      color: new THREE.Color("#e8d5f5"),  // Very light lavender tint

      // Reflections
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.5,
      reflectivity: 0.9,

      // Specular highlights
      specularIntensity: 1.0,
      specularColor: new THREE.Color("#f5e6ff"),

      side: THREE.DoubleSide,
    });

    // Fluted ridge vertex shader
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFlutes = { value: 14.0 };
      shader.uniforms.uAmp    = { value: 0.018 };

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
        uniform float uFlutes;
        uniform float uAmp;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float theta = atan(position.x, position.z);
        float ridge = sin(theta * uFlutes) * uAmp;
        vec2  radial = normalize(vec2(position.x, position.z));
        float r      = length(vec2(position.x, position.z));
        if (r > 0.001) {
          transformed.x += radial.x * ridge;
          transformed.z += radial.y * ridge;
        }`
      );
      mat.userData.shader = shader;
    };

    mat.needsUpdate = true;
    return mat;
  }, []);
}

// ─── Floating Rock Island ─────────────────────────────────────────────────────
function RockIsland() {
  return (
    <mesh position={[0, -1.8, 0]} scale={[4.0, 0.8, 2.8]} receiveShadow castShadow>
      <sphereGeometry args={[1, 32, 16]} />
      <meshStandardMaterial 
        color="#0d140b" // Dark mossy green/black
        roughness={1.0} 
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── Main Vase Component ────────────────────────────────────────────────────
export default function Vase({ progress = 0 }) {
  const groupRef = useRef();
  const material = useGlassMaterial();
  const { scene } = useGLTF(vaseModelUrl);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, material]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle floating above the rock
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;
    // Interpolate tilt to 0 as progress reaches 1 so it stands straight at the end
    const rotX = 0.4 * (1.0 - progress);
    const rotZ = -0.6 * (1.0 - progress);
    groupRef.current.rotation.set(rotX, -0.4 + progress * Math.PI * 2.0, rotZ);
  });

  return (
    <group>
      <RockIsland />
      <motion.group
        ref={groupRef}
        initial={{ scale: 0 }}
        animate={{ scale: 1.8 }}
        whileHover={{ scale: 1.85 }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        transition={{ type: "spring", stiffness: 50, damping: 16, duration: 1.6 }}
        position={[0, 0.5, 0]} // Shifted up slightly to sit on the rock
      >
        <primitive object={scene} />
      </motion.group>
    </group>
  );
}

useGLTF.preload(vaseModelUrl);
