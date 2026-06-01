import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createPetalGeometry } from "./Petal";

const PETAL_COUNT  = 300;
const COLOR_PURPLE = new THREE.Color("#6d28d9");
const COLOR_GOLD   = new THREE.Color("#dfba6b");
const PURPLE_RATIO = 0.72;

// ─── Soft Velvety Petal Material ────────────────────────────────────────────
function buildPetalMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({
    roughness: 0.65,           // Soft, velvety surface — not shiny
    metalness: 0.0,            // No metallic look — organic
    clearcoat: 0.3,            // Very subtle surface sheen
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
    color: new THREE.Color("#ffffff"),
    envMapIntensity: 0.8,
    // Thin translucency removed to fix depth sorting against the glass vase
    // Opaque objects render before transmission passes, placing them correctly inside.
    transmission: 0.0,
    thickness: 0.0,
    transparent: false,
    opacity: 1.0,
    sheen: 1.0,                // Velvet-like sheen
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color("#e9d5ff"),
  });

  mat.onBeforeCompile = (shader) => {
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
  };
  mat.needsUpdate = true;
  return mat;
}

// ─── Petal Physics Initialization ───────────────────────────────────────────
function initPetalStates(count) {
  return Array.from({ length: count }, () => ({
    startHeight: 4.5 + Math.random() * 7.0,
    startRadius: 2.5 + Math.random() * 4.0,
    startAngle:  Math.random() * Math.PI * 2,
    spinSpeed:   0.8 + Math.random() * 1.8,
    rotXBase:    Math.random() * Math.PI * 2,
    rotYBase:    Math.random() * Math.PI * 2,
    rotZBase:    Math.random() * Math.PI * 2,
    scale:       0.6 + Math.random() * 0.5,
    phase:       Math.random() * Math.PI * 2,
  }));
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PetalSystem({ progress = 0 }) {
  const meshRef   = useRef();
  const statesRef = useRef(null);
  const burstRef  = useRef(0);

  // Listen for click burst events from the Canvas
  useEffect(() => {
    const handleBurst = () => { burstRef.current = 1.0; };
    window.addEventListener('burst', handleBurst);
    return () => window.removeEventListener('burst', handleBurst);
  }, []);

  const petalGeo = useMemo(() => createPetalGeometry(), []);
  const petalMat = useMemo(() => buildPetalMaterial(), []);

  // Build the per-instance color attribute
  const colorArray = useMemo(() => {
    const arr = new Float32Array(PETAL_COUNT * 3);
    for (let i = 0; i < PETAL_COUNT; i++) {
      const color = i < PETAL_COUNT * PURPLE_RATIO ? COLOR_PURPLE : COLOR_GOLD;
      color.toArray(arr, i * 3);
    }
    return arr;
  }, []);

  useEffect(() => {
    if (!petalGeo.attributes.position) return;
    petalGeo.setAttribute("aColor", new THREE.InstancedBufferAttribute(colorArray, 3));
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
    const pVal   = progress;

    // Smoothly decay the burst energy
    burstRef.current = THREE.MathUtils.lerp(burstRef.current, 0, 0.025);
    const bVal = burstRef.current;

    for (let i = 0; i < PETAL_COUNT; i++) {
      const s = states[i];

      // Scroll compresses radius and height toward vase mouth
      const baseRadius = s.startRadius * (1.0 - pVal * 0.92);
      const baseY = s.startHeight * (1.0 - pVal * 0.88);

      // Burst logic: random outward explosion based on each petal's unique properties
      const burstRadius = bVal * (4.0 + Math.abs(Math.sin(s.phase * 5.0)) * 12.0);
      const burstY = bVal * (Math.cos(s.phase * 3.0) * 12.0);
      
      const radius = baseRadius + burstRadius;
      const y = baseY + burstY;
      
      // When burst happens, add chaotic rotation to angle
      const angle = s.startAngle + t * s.spinSpeed * 0.4 + pVal * 10.0 * s.spinSpeed + bVal * s.spinSpeed * 8.0;

      _p.set(
        Math.cos(angle) * radius,
        y + Math.sin(t * 1.2 + s.phase) * 0.3, // gentle float
        Math.sin(angle) * radius
      );

      // Tumbling rotation with burst turbulence
      _e.set(
        s.rotXBase + Math.sin(t * 1.8 + s.phase) * 0.6 + bVal * 18.0,
        s.rotYBase + Math.cos(t * 1.3 + s.phase) * 0.6 + bVal * 18.0,
        s.rotZBase + Math.sin(t * 2.2 + s.phase) * 0.6 + bVal * 18.0,
        "XYZ"
      );
      _q.setFromEuler(_e);

      const sc = s.scale * (1.0 - pVal * 0.3);
      _s.set(sc, sc, sc);

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
