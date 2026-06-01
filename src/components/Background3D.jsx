import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import treeUrl from '../assets/tree.glb?url';

// ─── Simple 2D Noise for Terrain ────────────────────────────────────────────
function hash(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
function noise2D(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return (
    hash(ix, iy) * (1 - ux) * (1 - uy) +
    hash(ix + 1, iy) * ux * (1 - uy) +
    hash(ix, iy + 1) * (1 - ux) * uy +
    hash(ix + 1, iy + 1) * ux * uy
  );
}
function fbm(x, y, octaves = 5) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += noise2D(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return val;
}

// ─── Stars ──────────────────────────────────────────────────────────────────
const STAR_COUNT = 500;

function Stars() {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      const r = 35 + Math.random() * 5;
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) + 3;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#e0d4ff" transparent opacity={0.65} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── Moon ────────────────────────────────────────────────────────────────────
function Moon() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.7 + Math.sin(state.clock.getElapsedTime() * 0.4) * 0.12;
  });

  return (
    <group position={[4, 12, -20]}>
      <mesh ref={ref}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshStandardMaterial color="#f0eaff" emissive="#c4b5fd" emissiveIntensity={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.5, 32, 32]} />
        <meshBasicMaterial color="#8b6cc4" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ─── Mountain Terrain (Realistic 3D FBM) ───────────────────────────────────
function MountainTerrain({ position, color, seed, scaleY = 10, size = 120 }) {
  const geo = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size, size, 128, 128);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      
      // Use FBM noise for realistic terrain elevation
      let y = fbm((x + seed * 100) * 0.06, (z + seed * 100) * 0.06, 6) * scaleY;
      
      // Add sharp ridges
      y += Math.pow(Math.max(0, fbm((x + seed * 50) * 0.15, (z + seed * 50) * 0.15, 3) - 0.4), 2) * scaleY * 1.5;
      
      // Fade out to flat at the edges to blend into scene
      const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (size / 2);
      const edgeFade = Math.max(0, 1 - Math.pow(edgeDist, 3));
      
      y *= edgeFade;
      pos.setY(i, y);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, [seed, scaleY, size]);

  return (
    <mesh geometry={geo} position={position}>
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.0} />
    </mesh>
  );
}



// ─── Floating Dust ──────────────────────────────────────────────────────────
const DUST_COUNT = 100;

function DustParticles() {
  const ref = useRef();
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3);
    const speeds = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 10 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      speeds.push({ dy: 0.001 + Math.random() * 0.003, phase: Math.random() * Math.PI * 2 });
    }
    return { positions, speeds };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < DUST_COUNT; i++) {
      pos[i * 3] += Math.sin(t * 0.15 + speeds[i].phase) * 0.0004;
      pos[i * 3 + 1] += speeds[i].dy;
      if (pos[i * 3 + 1] > 10) { pos[i * 3 + 1] = -1; pos[i * 3] = (Math.random() - 0.5) * 16; }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={DUST_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#c9a0ff" transparent opacity={0.25} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── Night Sky Dome ─────────────────────────────────────────────────────────
function SkyDome() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTopColor:     { value: new THREE.Color('#010108') },
      uMidColor:     { value: new THREE.Color('#080418') },
      uHorizonColor: { value: new THREE.Color('#150c2e') },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor, uMidColor, uHorizonColor;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;
        vec3 c = mix(uHorizonColor, uMidColor, smoothstep(-0.05, 0.15, h));
        c = mix(c, uTopColor, smoothstep(0.15, 0.6, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

  return <mesh material={mat}><sphereGeometry args={[180, 32, 32]} /></mesh>;
}

// ─── Moonlight Beams ────────────────────────────────────────────────────────
function MoonBeams() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.rotation.z = Math.sin(t * 0.05) * 0.025;
      ref.current.material.opacity = 0.03 + Math.sin(t * 0.1) * 0.008;
    }
  });

  return (
    <group position={[6, 10, -10]} rotation={[0.4, -0.3, 0.3]}>
      <mesh ref={ref}>
        <planeGeometry args={[4, 20]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[-2.5, 0.5, 0.3]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[2.5, 16]} />
        <meshBasicMaterial color="#ddd6fe" transparent opacity={0.02} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ─── Cherry Blossom Tree ────────────────────────────────────────────────────
function CherryTree() {
  const { scene } = useGLTF(treeUrl);
  return (
    <group position={[14, -2.5, -10]} scale={1.8} rotation={[0, -0.6, 0]}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload(treeUrl);

// ─── Main Export ────────────────────────────────────────────────────────────
export default function Background3D() {
  return (
    <group>
      <SkyDome />
      <Stars />
      <Moon />
      <MoonBeams />
      <DustParticles />

      {/* Realistic 3D Mountain Terrain in the distance */}
      {/* Pushed far back and lowered so they don't look like sand swallowing the vase */}
      {/* Changed colors to deep night-blue so they are visible in dark */}
      <MountainTerrain position={[0, -4, -80]} scaleY={25} seed={2.5} color="#161b36" />
      <MountainTerrain position={[0, -4, -60]} scaleY={16} seed={7.1} color="#1f2547" />

      {/* Cherry Blossom Tree on the right */}
      <CherryTree />
    </group>
  );
}
