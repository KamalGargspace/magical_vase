import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { logger } from '../utils/logger';
import treeUrl from '../assets/tree2.glb?url';
import { createPetalGeometry } from './Petal'; // Reuse our beautiful petal geometry

const log = logger.create('Background3D');

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
function fbm(x, y, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += noise2D(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return val;
}

// ─── Stars ──────────────────────────────────────────────────────────────────
const STAR_COUNT = 300;

function Stars() {
  const ref = useRef();
  const positions = useMemo(() => {
    log.time('Stars:init');
    const arr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = 50 + Math.random() * 20; // Pushed further back
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) + 10;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 20;
    }
    log.timeEnd('Stars:init');
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.001;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#dce2ff" transparent opacity={0.6} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── Moon ────────────────────────────────────────────────────────────────────
function Moon() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.6 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
  });

  return (
    <group position={[18, 25, -60]}>
      <mesh ref={ref}>
        <sphereGeometry args={[7.0, 64, 64]} />
        {/* Simple moon simulation using procedural bumps isn't straightforward without custom shaders,
            so we'll rely on a bright white/grey surface with slight roughness and emissive glow. */}
        <meshStandardMaterial color="#f0f0f5" emissive="#d0d0e0" emissiveIntensity={0.5} roughness={0.9} />
      </mesh>
      {/* Soft outer glow */}
      <mesh>
        <sphereGeometry args={[16.0, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Central bright glow */}
      <mesh>
        <sphereGeometry args={[9.0, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ─── Mountain Terrain (Realistic 3D FBM) ───────────────────────────────────
function MountainTerrain({ position, color, seed, scaleY = 10, size = 150 }) {
  const geo = useMemo(() => {
    try {
      const geometry = new THREE.PlaneGeometry(size, size, 100, 100);
      geometry.rotateX(-Math.PI / 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        
        let y = fbm((x + seed * 100) * 0.05, (z + seed * 100) * 0.05, 4) * scaleY;
        y += Math.pow(Math.max(0, fbm((x + seed * 50) * 0.12, (z + seed * 50) * 0.12, 3) - 0.4), 2) * scaleY * 1.5;
        
        const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (size / 2);
        const edgeFade = Math.max(0, 1 - Math.pow(edgeDist, 3));
        y *= edgeFade;
        pos.setY(i, y);
      }
      geometry.computeVertexNormals();
      return geometry;
    } catch (err) {
      log.error('Failed to generate terrain:', err);
      const fallback = new THREE.PlaneGeometry(size, size, 4, 4);
      fallback.rotateX(-Math.PI / 2);
      return fallback;
    }
  }, [seed, scaleY, size]);

  return (
    <mesh geometry={geo} position={position}>
      <meshStandardMaterial color={color} roughness={1.0} metalness={0.0} />
    </mesh>
  );
}

// ─── Floating Dust ──────────────────────────────────────────────────────────
const DUST_COUNT = 80;

function DustParticles() {
  const ref = useRef();
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3);
    const speeds = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 12 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
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
      if (pos[i * 3 + 1] > 10) { pos[i * 3 + 1] = -2; pos[i * 3] = (Math.random() - 0.5) * 20; }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={DUST_COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#bba8e0" transparent opacity={0.25} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── Tree Falling Petals ────────────────────────────────────────────────────
const TREE_PETAL_COUNT = 150;

function TreePetals() {
  const ref = useRef();
  const petalGeo = useMemo(() => createPetalGeometry(), []);
  const petalMat = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: '#ff99b3', 
    side: THREE.DoubleSide, 
    transparent: true, 
    opacity: 0.8 
  }), []);

  const data = useMemo(() => {
    return Array.from({ length: TREE_PETAL_COUNT }, () => ({
      // Constrain spawn area to the tree canopy
      x: 6 + Math.random() * 6,
      y: 1 + Math.random() * 9,
      z: -12 + Math.random() * 6,
      speed: 0.3 + Math.random() * 0.8,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      scale: 0.15 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    
    data.forEach((p, i) => {
      // Gentle, slow fall
      let currentY = p.y - (t * p.speed) % 12;
      if (currentY < -2) {
        currentY += 12; // Wrap back to the canopy
      }
      
      // Wind drift
      const dx = Math.sin(t * 0.3 + p.phase) * 1.5;
      const dz = Math.cos(t * 0.4 + p.phase) * 1.0;

      dummy.position.set(p.x + dx, currentY, p.z + dz);
      dummy.rotation.set(
        p.rx + t * p.speed,
        p.ry + t * p.speed * 0.6,
        p.rz + t * p.speed * 1.2
      );
      
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[petalGeo, petalMat, TREE_PETAL_COUNT]} />
  );
}

// ─── Night Sky Dome ─────────────────────────────────────────────────────────
function SkyDome() {
  const mat = useMemo(() => {
    try {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTopColor:     { value: new THREE.Color('#010108') },  // Deep night sky
          uMidColor:     { value: new THREE.Color('#080418') },  // Purple-blue mid
          uHorizonColor: { value: new THREE.Color('#1a123a') },  // Glowing indigo horizon
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
            vec3 c = mix(uHorizonColor, uMidColor, smoothstep(-0.1, 0.25, h));
            c = mix(c, uTopColor, smoothstep(0.25, 0.7, h));
            gl_FragColor = vec4(c, 1.0);
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
      });
    } catch (err) {
      log.error('SkyDome shader failed, using fallback:', err);
      return new THREE.MeshBasicMaterial({ color: '#010105', side: THREE.BackSide });
    }
  }, []);

  return <mesh material={mat}><sphereGeometry args={[180, 24, 24]} /></mesh>;
}

// ─── Moonlight Beams ────────────────────────────────────────────────────────
function MoonBeams() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.rotation.z = Math.sin(t * 0.05) * 0.025;
      ref.current.material.opacity = 0.02 + Math.sin(t * 0.1) * 0.01;
    }
  });

  return (
    <group position={[15, 20, -40]} rotation={[0.4, -0.4, -0.1]}>
      <mesh ref={ref}>
        <planeGeometry args={[12, 50]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.02} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ─── Cherry Blossom Tree ────────────────────────────────────────────────────
function CherryTree() {
  try {
    const { scene } = useGLTF(treeUrl);

    const cloned = useMemo(() => {
      const c = scene.clone(true);
      c.traverse((child) => {
        if (child.isMesh && child.material) {
          // Since tree2 is branches, let's give it a slightly mystical dark silhouette look
          // that catches the light beautifully, instead of making it pitch black.
          const mat = child.material.clone();
          mat.color.set('#2a1b38'); // Deep purple/brown
          mat.roughness = 0.5;
          mat.metalness = 0.3;
          child.material = mat;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return c;
    }, [scene]);

    return (
      <group position={[8, -6, 1]} scale={4.5} rotation={[0, -0.8, 0]}>
        <primitive object={cloned} />
        {/* Soft magical lighting specifically for the branches to make them look beautiful */}
        <pointLight position={[-3, 6, 2]} color="#dfba6b" intensity={2.0} distance={15} decay={2} />
        <pointLight position={[2, 2, 5]} color="#c084fc" intensity={3.0} distance={20} decay={2} />
      </group>
    );
  } catch (err) {
    log.error('Failed to load cherry tree GLB:', err);
    return null;
  }
}

try {
  useGLTF.preload(treeUrl);
} catch (err) {
  log.warn('Failed to preload tree asset:', err);
}

// ─── Main Export ────────────────────────────────────────────────────────────
export default function Background3D() {
  return (
    <group>
      <SkyDome />
      <Stars />
      <Moon />
      <MoonBeams />
      <DustParticles />
      <TreePetals />

      {/* Mountain silhouettes — darker to match the reference image */}
      <MountainTerrain position={[0, -6, -140]} scaleY={40} seed={2.5} color="#05070a" />
      <MountainTerrain position={[0, -5, -110]} scaleY={28} seed={7.1} color="#0a0c12" />
      <MountainTerrain position={[0, -4, -80]} scaleY={15} seed={1.3} color="#0e1018" />

      {/* Cherry Blossom Tree */}
      <CherryTree />
    </group>
  );
}
