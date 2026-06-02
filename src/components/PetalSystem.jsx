import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createPetalGeometry } from "./Petal";
import { logger } from "../utils/logger";

const log = logger.create('PetalSystem');

/**
 * PetalSystem — Instanced mesh of animated cherry blossom petals.
 *
 * Petals are divided into three groups for a cinematic, natural feel:
 *   1. STREAM petals (60%) — sweep in arcs from upper-left INTO the vase mouth
 *   2. ORBIT petals (25%) — gently orbit close to the vase at mid-height
 *   3. SCATTER petals (15%) — drift loosely in the scene for atmosphere
 *
 * The key insight is that petals need to render IN FRONT of the vase,
 * flowing toward it, not behind it.
 */
const PETAL_COUNT = 180;

// Cherry blossom color palette — pinks and magentas, matching reference
const COLOR_PINK    = new THREE.Color("#d44a7a");  // Vivid cherry pink
const COLOR_MAGENTA = new THREE.Color("#a83860");  // Deeper magenta
const COLOR_LIGHT   = new THREE.Color("#e89cb8");  // Soft light pink

// Group splits
const STREAM_COUNT  = Math.floor(PETAL_COUNT * 0.60);  // 108 petals
const ORBIT_COUNT   = Math.floor(PETAL_COUNT * 0.25);  //  45 petals
const SCATTER_COUNT = PETAL_COUNT - STREAM_COUNT - ORBIT_COUNT; // 27 petals

// ─── Soft Velvety Petal Material ────────────────────────────────────────────
function buildPetalMaterial() {
  try {
    log.time('buildPetalMaterial');

    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.65,
      metalness: 0.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide,
      color: new THREE.Color("#ffffff"),
      envMapIntensity: 0.8,
      transmission: 0.0,
      thickness: 0.0,
      transparent: false,
      opacity: 1.0,
      sheen: 1.0,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#f0c0d8"),
    });

    mat.onBeforeCompile = (shader) => {
      try {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `#include <common>
          attribute vec3 aColor;
          varying vec3 vInstanceColor;`
        );
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vInstanceColor = aColor;`
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>
          varying vec3 vInstanceColor;`
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          diffuseColor.rgb *= vInstanceColor;`
        );
        mat.userData.shader = shader;
        log.debug('Petal shader compiled successfully');
      } catch (err) {
        log.error('Petal shader compilation failed:', err);
      }
    };

    mat.needsUpdate = true;
    log.timeEnd('buildPetalMaterial');
    return mat;
  } catch (err) {
    log.error('Failed to build petal material, using fallback:', err);
    return new THREE.MeshStandardMaterial({
      color: "#d44a7a",
      side: THREE.DoubleSide,
    });
  }
}

// ─── Petal Physics Initialization ───────────────────────────────────────────
function initPetalStates(count) {
  log.info(`Initializing ${count} scroll-driven vortex petals`);
  
  return Array.from({ length: count }, (_, i) => {
    // Wide state (progress = 0): Distributed in a huge atmospheric cylinder
    const wideRadius = 2.0 + Math.random() * 8.0;
    const wideHeight = -1.0 + Math.random() * 10.0;

    // Target state (progress = 1): Swirling inside the vase
    // Vase interior is roughly Y: 0.4 to 1.8.
    // Distribute them evenly along Y to form a volumetric tornado, preventing bundling
    const normalizedI = i / count; 
    const targetHeight = 0.4 + normalizedI * 1.4; 
    
    // Funnel shape: slightly wider at the top mouth, narrow at the belly
    const funnelWidth = 0.1 + (targetHeight / 1.8) * 0.4;
    const targetRadius = Math.pow(Math.random(), 1.5) * funnelWidth;

    return {
      wideRadius,
      wideHeight,
      targetRadius,
      targetHeight,
      angleBase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.4,
      tumbleSpeed: 0.5 + Math.random() * 1.5,
      scale: 0.4 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      rotXBase: Math.random() * Math.PI * 2,
      rotYBase: Math.random() * Math.PI * 2,
      rotZBase: Math.random() * Math.PI * 2,
    };
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PetalSystem({ progress = 0 }) {
  const meshRef   = useRef();
  const statesRef = useRef(null);
  const burstRef  = useRef(0);

  // Listen for click burst events from the Canvas
  useEffect(() => {
    const handleBurst = () => {
      log.debug('Burst event received');
      burstRef.current = 1.0;
    };
    window.addEventListener('burst', handleBurst);
    return () => window.removeEventListener('burst', handleBurst);
  }, []);

  const petalGeo = useMemo(() => createPetalGeometry(), []);
  const petalMat = useMemo(() => buildPetalMaterial(), []);

  // Build the per-instance color attribute — cherry blossom pinks
  const colorArray = useMemo(() => {
    const arr = new Float32Array(PETAL_COUNT * 3);
    const palette = [COLOR_PINK, COLOR_MAGENTA, COLOR_LIGHT];
    for (let i = 0; i < PETAL_COUNT; i++) {
      const color = palette[i % palette.length];
      color.toArray(arr, i * 3);
    }
    return arr;
  }, []);

  useEffect(() => {
    try {
      if (!petalGeo.attributes.position) return;
      petalGeo.setAttribute("aColor", new THREE.InstancedBufferAttribute(colorArray, 3));
      log.debug('Color attribute set on petal geometry');
    } catch (err) {
      log.error('Failed to set petal color attribute:', err);
    }
  }, [colorArray, petalGeo]);

  useEffect(() => {
    statesRef.current = initPetalStates(PETAL_COUNT);
  }, []);

  // Reusable temp objects (no allocations per frame)
  const _m = useMemo(() => new THREE.Matrix4(), []);
  const _p = useMemo(() => new THREE.Vector3(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _e = useMemo(() => new THREE.Euler(), []);
  const _s = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!meshRef.current || !statesRef.current) return;

    const t      = state.clock.getElapsedTime();
    const states = statesRef.current;
    const mesh   = meshRef.current;
    
    // Smoothly decay the burst energy
    burstRef.current = THREE.MathUtils.lerp(burstRef.current, 0, 0.025);
    const bVal = burstRef.current;

    // Easing curve for the scroll pull: accelerates as you scroll
    // Clamp progress to 0 to prevent NaN on Mac elastic overscroll (Math.pow(negative) = NaN)
    const safeProgress = Math.max(0, progress);
    const pull = Math.min(1.0, Math.pow(safeProgress, 1.5) * 1.2); 

    for (let i = 0; i < PETAL_COUNT; i++) {
      const s = states[i];

      // Lerp radius and height based on scroll progress
      const currentRadius = THREE.MathUtils.lerp(s.wideRadius, s.targetRadius, pull);
      
      // Add a subtle organic drift to the wide height so they don't look completely frozen
      const organicDriftY = Math.sin(t * 0.5 + s.phase) * 1.5 * (1.0 - pull);
      const currentHeight = THREE.MathUtils.lerp(s.wideHeight + organicDriftY, s.targetHeight, pull);

      // Angle: constant swirl around Y axis, accelerating rapidly as they get sucked in
      const angle = s.angleBase + t * s.speed + pull * t * s.speed * 6.0;

      // Burst explosion forces
      const bx = bVal * Math.sin(s.phase * 5) * 8;
      const by = bVal * Math.cos(s.phase * 3) * 6;
      const bz = bVal * Math.sin(s.phase * 7) * 5;

      _p.set(
        Math.cos(angle) * currentRadius + bx,
        currentHeight + by,
        Math.sin(angle) * currentRadius + bz
      );

      // Tumble rotation
      _e.set(
        s.rotXBase + t * s.tumbleSpeed + bVal * 18,
        s.rotYBase + t * s.tumbleSpeed * 0.8 + bVal * 18,
        s.rotZBase + t * s.tumbleSpeed * 1.2 + bVal * 18,
        "XYZ"
      );

      // Scale: slightly smaller when sucked inside the vase to simulate depth
      const sc = s.scale * (1.0 - pull * 0.35);
      _s.set(sc, sc, sc);

      _q.setFromEuler(_e);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[petalGeo, petalMat, PETAL_COUNT]}
        castShadow
        frustumCulled={false}
      />
    </group>
  );
}
