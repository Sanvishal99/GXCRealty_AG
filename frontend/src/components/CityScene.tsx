"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Suppress Three.js r168 Clock deprecation warning (used internally by R3F)
if (typeof window !== "undefined") {
  const _warn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _warn(...args);
  };
}

// ── Instanced buildings (single draw call) ────────────────────────────────────
function Buildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { matrices, colors } = useMemo(() => {
    const PALETTE = [
      new THREE.Color("#C8930A"),
      new THREE.Color("#D4A843"),
      new THREE.Color("#B8860B"),
      new THREE.Color("#E8C060"),
      new THREE.Color("#A07208"),
      new THREE.Color("#F0D080"),
      new THREE.Color("#9A7010"),
    ];

    const positions: { x: number; z: number; h: number; w: number; d: number; ci: number }[] = [];

    for (let bx = -8; bx <= 8; bx++) {
      for (let bz = -8; bz <= 8; bz++) {
        // Skip roads
        if (bx % 4 === 0 || bz % 4 === 0) continue;
        const h = 0.5 + Math.random() * 5;
        const w = 0.4 + Math.random() * 0.55;
        const d = 0.4 + Math.random() * 0.55;
        positions.push({
          x: bx * 1.1 + (Math.random() - 0.5) * 0.35,
          z: bz * 1.1 + (Math.random() - 0.5) * 0.35,
          h, w, d,
          ci: Math.floor(Math.random() * PALETTE.length),
        });
      }
    }

    const dummy = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    for (const b of positions) {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
      colors.push(PALETTE[b.ci]);
    }

    return { matrices, colors };
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < matrices.length; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
      meshRef.current.setColorAt(i, colors[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, matrices.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.35} metalness={0.55} />
    </instancedMesh>
  );
}

// ── Ground + roads as a single plane each ─────────────────────────────────────
function Ground() {
  return (
    <>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1a1400" roughness={1} metalness={0} />
      </mesh>
      {/* Road grid overlay using a grid texture-like approach via lines */}
      {[-4,-3,-2,-1,0,1,2,3,4].map(i => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[i * 4.4, 0.001, 0]}>
            <planeGeometry args={[0.5, 60]} />
            <meshStandardMaterial color="#2a1e00" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, i * 4.4]}>
            <planeGeometry args={[60, 0.5]} />
            <meshStandardMaterial color="#2a1e00" roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ── Camera scroll controller ───────────────────────────────────────────────────
function ScrollCamera({ scrollY }: { scrollY: number }) {
  const { camera } = useThree();
  const current = useRef({ x: 0, y: 12, z: 18, lookY: 1 });
  const initialized = useRef(false);

  // Set fov once
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 46;
    cam.near = 0.5;
    cam.far = 70;
    cam.updateProjectionMatrix();
    cam.position.set(0, 12, 18);
    cam.lookAt(0, 1, 0);
    initialized.current = true;
  }, [camera]);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const t = Math.min(scrollY / 3000, 1);

    let tx: number, ty: number, tz: number, lookY: number;

    if (t < 0.4) {
      const p = t / 0.4;
      tx = THREE.MathUtils.lerp(0, -1.5, p);
      ty = THREE.MathUtils.lerp(12, 4.5, p);
      tz = THREE.MathUtils.lerp(18, 7, p);
      lookY = THREE.MathUtils.lerp(1, 2, p);
    } else if (t < 0.75) {
      const p = (t - 0.4) / 0.35;
      tx = THREE.MathUtils.lerp(-1.5, 2.5, p);
      ty = THREE.MathUtils.lerp(4.5, 3, p);
      tz = THREE.MathUtils.lerp(7, -5, p);
      lookY = THREE.MathUtils.lerp(2, 2.5, p);
    } else {
      const p = (t - 0.75) / 0.25;
      tx = THREE.MathUtils.lerp(2.5, 0, p);
      ty = THREE.MathUtils.lerp(3, 10, p);
      tz = THREE.MathUtils.lerp(-5, -16, p);
      lookY = THREE.MathUtils.lerp(2.5, 0, p);
    }

    // Fast lerp = responsive, but still smooth
    const s = 0.06;
    current.current.x     += (tx    - current.current.x)     * s;
    current.current.y     += (ty    - current.current.y)     * s;
    current.current.z     += (tz    - current.current.z)     * s;
    current.current.lookY += (lookY - current.current.lookY) * s;

    cam.position.set(current.current.x, current.current.y, current.current.z);
    cam.lookAt(0, current.current.lookY, 0);
  });

  return null;
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function CityScene({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <Canvas
      dpr={[1, 1]}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: true,
      }}
      style={{ background: "transparent" }}
    >
      <ScrollCamera scrollY={scrollY} />

      <ambientLight intensity={0.4} color="#FFF0C0" />
      <directionalLight position={[8, 16, 8]} intensity={2.0} color="#FFE080" />
      <directionalLight position={[-6, 5, -10]} intensity={0.4} color="#B8A060" />

      <fog attach="fog" args={["#FDF8ED", 22, 50]} />

      <Ground />
      <Buildings />
    </Canvas>
  );
}
