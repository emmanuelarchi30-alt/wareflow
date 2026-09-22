'use client';
import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const toWorld = (x, z) => [(x - 50) * 0.8, (z - 50) * 0.8];

const zoneColors = {
  racking: 0x4A5568,
  aisle: 0x2D3748,
  loading: 0x35507A,
  empty: 0x2a3a4a,
  obstacle: 0xE53E3E,
};

/* ------------------------------------------------------------------
   INSTALACIONES: piso, zonas, racks y tecnología (ambiente de empresa)
------------------------------------------------------------------- */

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color={0xf3f5f7} roughness={0.65} metalness={0.03} />
      </mesh>
    </group>
  );
}

function ZoneTiles({ zones, selectedIssue, hoveredZone, onHoverIn, onHoverOut, onZoneClick }) {
  const tiles = useMemo(() => zones.map((zone, i) => {
    const isSelected = selectedIssue && Math.abs(selectedIssue.x - zone.x) < 5 && Math.abs(selectedIssue.y - zone.y) < 5;
    const isHovered = hoveredZone === i;
    const color = isSelected ? 0xff8a3d : isHovered ? 0x2E9CFF : zone.type === 'obstacle' ? 0xff6b6b : 0xffffff;
    const opacity = isSelected ? 0.65 : isHovered ? 0.55 : zone.type === 'obstacle' ? 0.22 : 0.04;
    const pos = toWorld(zone.x + zone.width / 2, zone.y + zone.height / 2);
    return { key: i, zone, pos: [pos[0], 0.05, pos[1]], size: [zone.width * 0.008, zone.height * 0.008], color, opacity };
  }), [zones, selectedIssue, hoveredZone]);

  return (
    <>
      {tiles.map(t => (
        <mesh
          key={t.key}
          position={t.pos}
          onPointerOver={() => onHoverIn(t.key)}
          onPointerOut={onHoverOut}
          onClick={() => onZoneClick?.(t.zone)}
        >
          <boxGeometry args={[t.size[0], 0.1, t.size[1]]} />
          <meshStandardMaterial color={t.color} roughness={0.8} metalness={0.1} transparent opacity={t.opacity} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function FloorMarks({ zones }) {
  const stripes = useMemo(() => zones.filter(z => z.type === 'loading').flatMap((z, i) => {
    const pos = toWorld(z.x + z.width / 2, z.y + z.height / 2);
    const width = z.width * 0.008;
    const count = Math.max(2, Math.floor(width / 2.5));
    return Array.from({ length: count }, (_, j) => ({
      i: `s-${i}-${j}`,
      pos: [pos[0] - width / 2 + (j + 0.5) * (width / count), 0.07, pos[1]],
      size: [Math.min(1.6, width / count), 0.5],
    }));
  }), [zones]);

  const lanes = useMemo(() => zones.filter(z => z.type === 'aisle').map((z, i) => {
    const pos = toWorld(z.x + z.width / 2, z.y + z.height / 2);
    const central = z.width >= z.height;
    const length = (central ? z.width : z.height) * 0.008;
    return { i: `l-${i}`, pos: [pos[0], 0.07, pos[1]], length, rotation: central ? 0 : Math.PI / 2 };
  }), [zones]);

  return (
    <>
      {stripes.map(s => (
        <mesh key={s.i} position={s.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={s.size} />
          <meshStandardMaterial color={0x87909c} roughness={0.6} />
        </mesh>
      ))}
      {lanes.map(l => (
        <mesh key={l.i} position={l.pos} rotation={[-Math.PI / 2, 0, l.rotation]}>
          <planeGeometry args={[l.length, 0.12]} />
          <meshStandardMaterial color={0xc3cad3} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

function Rack({ position, width, depth }) {
  const shelves = useMemo(() => {
    const rows = [];
    const colsX = Math.max(2, Math.floor(width / 0.85));
    const colsZ = Math.max(3, Math.floor(depth / 0.7));
    for (let z = 0; z < colsZ; z++) {
      for (let x = 0; x < colsX; x++) {
        for (let level = 0; level < 3; level++) {
          rows.push({
            position: [(x - colsX / 2 + 0.5) * 0.85, -1 + level * 0.75 + 0.32 + Math.abs(Math.sin((x + z) * 7)) * 0.1, (z - colsZ / 2 + 0.5) * 0.7],
            color: [0xC9773B, 0x8B5A2B, 0xA05A2C, 0xB87A4A][(x + z + level) % 4],
            scale: 0.3 + ((x + z + level) % 3) * 0.06,
          });
        }
      }
    }
    return rows;
  }, [width, depth]);

  const uprights = useMemo(() => {
    const colsX = Math.max(2, Math.floor(width / 0.85));
    const colsZ = Math.max(3, Math.floor(depth / 0.7));
    const list = [];
    for (let x = 0; x <= colsX; x++) for (let z = 0; z <= colsZ; z++) list.push([(x - colsX / 2) * 0.85, (z - colsZ / 2) * 0.7]);
    return list;
  }, [width, depth]);

  return (
    <group position={position}>
      {uprights.map((u, i) => (
        <mesh key={`u${i}`} position={[u[0], 0.7, u[1] - 0.2]}>
          <boxGeometry args={[0.1, 2.6, 0.1]} />
          <meshStandardMaterial color={0x9aa5b1} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {[0, 1, 2].map(lvl => (
        <mesh key={`b${lvl}`} position={[0, -0.55 + lvl * 0.75, 0]}>
          <boxGeometry args={[width, 0.08, depth]} />
          <meshStandardMaterial color={0x3c4654} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {shelves.map((s, i) => (
        <mesh key={i} position={s.position}>
          <boxGeometry args={[s.scale, s.scale, s.scale]} />
          <meshStandardMaterial color={s.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function CompanyWall({ selectedIssue }) {
  const signRef = useRef();
  useFrame(({ clock }) => {
    if (signRef.current) signRef.current.material.emissiveIntensity = 0.35 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
  });

  return (
    <group position={[-58, 0, 0]}>
      <mesh position={[0, 6, -8]}>
        <boxGeometry args={[0.6, 22, 90]} />
        <meshStandardMaterial color={0x232a31} roughness={0.9} />
      </mesh>
      <mesh position={[0, 15, -8]}>
        <boxGeometry args={[0.4, 8, 90]} />
        <meshStandardMaterial color={0x1b2027} roughness={0.8} />
      </mesh>
      <mesh ref={signRef} position={[0.35, 14, -8]}>
        <boxGeometry args={[0.15, 2.4, 34]} />
        <meshStandardMaterial color={0x0e2a3a} emissive={selectedIssue ? 0xff5500 : 0x1f6f8b} emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      <Html position={[0.5, 13.4, 4]} center style={{ pointerEvents: 'none' }}>
        <div className="px-4 py-1 rounded text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.75)', whiteSpace: 'nowrap' }}>
          {selectedIssue ? `⚠ ${(selectedIssue.type || 'PROBLEMA').toUpperCase().replace(/_/g, ' ')}` : 'WAREFLOW · CENTRO DE OPERACIONES'}
        </div>
      </Html>
    </group>
  );
}

/* -------------------- EDIFICIO: paredes, portón y oficinas -------------------- */

function BuildingWalls() {
  return (
    <group>
      {[
        { pos: [0, 6, -44], size: [92, 12, 0.5] },
        { pos: [0, 6, 44], size: [92, 12, 0.5] },
        { pos: [-44, 6, 0], size: [0.5, 12, 88] },
        { pos: [44, 6, 0], size: [0.5, 12, 88] },
      ].map((w, i) => (
        <mesh key={`w${i}`} position={w.pos} castShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color={0x39434a} roughness={0.85} />
        </mesh>
      ))}
      {[
        { pos: [0, 12.3, -44], size: [92, 0.6, 0.6] },
        { pos: [0, 12.3, 44], size: [92, 0.6, 0.6] },
        { pos: [-44, 12.3, 0], size: [0.6, 0.6, 88] },
        { pos: [44, 12.3, 0], size: [0.6, 0.6, 88] },
      ].map((b, i) => (
        <mesh key={`b${i}`} position={b.pos}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={0x2a3136} roughness={0.9} />
        </mesh>
      ))}
      {/* Portón principal en pared delantera */}
      <group position={[0, 0, 44.25]}>
        <mesh position={[-3, 3.2, 0]}>
          <boxGeometry args={[0.35, 6.4, 0.4]} />
          <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[3, 3.2, 0]}>
          <boxGeometry args={[0.35, 6.4, 0.4]} />
          <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 6.8, 0]}>
          <boxGeometry args={[6.8, 0.6, 0.6]} />
          <meshStandardMaterial color={0x4a545c} roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.2, 0.3]}>
          <planeGeometry args={[6.2, 6.2]} />
          <meshStandardMaterial color={0x182028} emissive={0x182028} transparent opacity={0.85} roughness={0.3} metalness={0.5} />
        </mesh>
        {/* señal encima del portón: gran rótulo de fachada */}
        <mesh position={[0, 9.6, 0]}>
          <boxGeometry args={[20, 2.2, 0.7]} />
          <meshStandardMaterial color={0x0e2230} roughness={0.4} />
        </mesh>
        <mesh position={[0, 9.6, 0.36]}>
          <boxGeometry args={[19.4, 1.6, 0.12]} />
          <meshStandardMaterial color={0x0d8fd0} emissive={0x0d8fd0} emissiveIntensity={0.4} />
        </mesh>
        <Html position={[0, 9.6, 0.75]} center style={{ pointerEvents: 'none' }}>
          <div className="px-6 py-2 rounded font-black text-white tracking-[0.3em]" style={{ background: 'rgba(3,15,24,0.55)', whiteSpace: 'nowrap', fontSize: '22px' }}>
            WAREFLOW <span style={{ color: '#4dd0ff' }}>LOGÍSTICA</span>
          </div>
        </Html>
        <mesh position={[0, 8.5, 0]}>
          <boxGeometry args={[4.5, 0.5, 0.5]} />
          <meshStandardMaterial color={0x14c5ff} emissive={0x14c5ff} emissiveIntensity={0.7} />
        </mesh>
        <Html position={[0, 8.5, 0.6]} center style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-0.5 rounded text-[11px] font-bold text-[#06222e]" style={{ background: 'rgba(20,197,255,0.92)', whiteSpace: 'nowrap' }}>ENTRADA PRINCIPAL</div>
        </Html>
      </group>
    </group>
  );
}

function OfficeAnnex() {
  const windowMatRefs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    windowMatRefs.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = 0.5 + (Math.sin(t * 2 + i) * 0.5 + 0.5) * 0.4;
    });
  });

  const desks = useMemo(() => {
    const rows = [];
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) {
      rows.push({ pos: [-3 + x * 2.6, 1.1, -2 + z * 2.4] });
    }
    return rows;
  }, []);

  return (
    <group position={[52, 0, 0]}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[10, 2.4, 8]} />
        <meshStandardMaterial color={0x2e5e6e} roughness={0.5} metalness={0.3} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, 3.6, 0]}>
        <boxGeometry args={[9, 2.4, 7]} />
        <meshStandardMaterial color={0x2e5e6e} roughness={0.5} metalness={0.3} transparent opacity={0.75} />
      </mesh>
      {desks.map((d, i) => (
        <group key={`d${i}`} position={d.pos}>
          <mesh>
            <boxGeometry args={[1.1, 0.12, 0.8]} />
            <meshStandardMaterial color={0x9aa5b1} roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.9, 0.7, 0.6]} />
            <meshStandardMaterial color={0x4a545c} roughness={0.7} />
          </mesh>
          <mesh position={[0.25, -0.05, 0]}>
            <boxGeometry args={[0.45, 0.3, 0.02]} />
            <meshStandardMaterial color={0x22aaff} emissive={0x22aaff} emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2, 3, 4, 5].map(i =>
        <mesh key={`win${i}`} ref={el => { windowMatRefs.current[i] = el; }} position={[-5.05, 1.4 + (i % 2) * 2.4, -2.5 + i % 3 * 2.5]}>
          <boxGeometry args={[0.1, 1, 1.8]} />
          <meshStandardMaterial color={0x0b1420} emissive={0x55ddff} emissiveIntensity={0.6} />
        </mesh>
      )}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[6, 0.9, 0.5]} />
        <meshStandardMaterial color={0x1f6f8b} emissive={0x1f6f8b} emissiveIntensity={0.5} />
      </mesh>
      <Html position={[0, 5.1, 0.6]} center style={{ pointerEvents: 'none' }}>
        <div className="px-3 py-0.5 rounded text-[10px] font-black text-white" style={{ background: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>OFICINAS · Administración</div>
      </Html>
    </group>
  );
}

function Truck({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[-2.4, 1.2, 0]}>
        <boxGeometry args={[5.4, 1.9, 2.5]} />
        <meshStandardMaterial color={0x3d5a80} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[2.7, 1.1, 0]}>
        <boxGeometry args={[2.4, 1.8, 2.5]} />
        <meshStandardMaterial color={0x5b7896} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[2.7, 1.9, 0]}>
        <boxGeometry args={[2.1, 0.9, 2]} />
        <meshStandardMaterial color={0x22364e} roughness={0.7} />
      </mesh>
      {[[-2.4, 0.4, 1.2], [-2.4, 0.4, -1.2], [2.4, 0.4, 1.2], [2.4, 0.4, -1.2]].map((p, i) => (
        <mesh key={`wh${i}`} position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.4, 14]} />
          <meshStandardMaterial color={0x111111} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-3.4, 1.5, 0]}>
        <boxGeometry args={[0.2, 0.7, 2]} />
        <meshStandardMaterial color={0x22364e} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* -------------------- EXTERIORES DE LA EMPRESA -------------------- */

function SecurityBooth() {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) lightRef.current.material.emissiveIntensity = 0.8 + Math.sin(clock.getElapsedTime() * 4) * 0.4;
  });
  return (
    <group position={[-13, 0, 47.2]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.4, 2.2, 2]} />
        <meshStandardMaterial color={0x555f6b} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[1.2, 1.4, 0]}>
        <boxGeometry args={[0.1, 1.9, 1.7]} />
        <meshStandardMaterial color={0xbfe8ff} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[2.8, 0.4, 2.4]} />
        <meshStandardMaterial color={0x2a3136} roughness={0.7} />
      </mesh>
      <mesh ref={lightRef} position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={0xff2222} emissive={0xff3b3b} emissiveIntensity={1} />
      </mesh>
      {/* pluma de acceso */}
      <mesh position={[1.3, 1, -1.6]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 5.4, 10]} />
        <meshStandardMaterial color={0x3d5a80} roughness={0.6} />
      </mesh>
      {/* bolardos de protección */}
      {[[-4.6, 1, -4.6], [-4.6, 1, 5], [4.6, 1, 5]].map((p, i) => (
        <mesh key={`b${i}`} position={p}>
          <cylinderGeometry args={[0.14, 0.14, 2, 10]} />
          <meshStandardMaterial color={0xfff3d0} emissive={0xffc81a} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Car({ position, rotation = 0, color = 0x3d5a80 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.8, 0.5, 3.4]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.9, -0.1]}>
        <boxGeometry args={[1.5, 0.5, 1.7]} />
        <meshStandardMaterial color={0x9fd8ef} transparent opacity={0.85} roughness={0.2} />
      </mesh>
      {[[-0.9, 0.25, 1.1], [-0.9, 0.25, -1.1], [0.9, 0.25, 1.1], [0.9, 0.25, -1.1]].map((p, i) => (
        <mesh key={`cw${i}`} position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 12]} />
          <meshStandardMaterial color={0x151515} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.9, 0.35, 1.75]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color={0xfff6d8} emissive={0xfff2c0} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.9, 0.35, 1.75]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color={0xfff6d8} emissive={0xfff2c0} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function ParkingLines() {
  const lines = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 4; i++) arr.push({ pos: [52 + (-1.5 + i * 2.2), 0.02, 36], size: [0.14, 4.6] });
    for (let i = 0; i < 4; i++) arr.push({ pos: [52 + (-1.5 + i * 2.2), 0.02, 46], size: [0.14, 4.6] });
    return arr;
  }, []);
  return (
    <group>
      {lines.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={l.size} />
          <meshStandardMaterial color={0xffffff} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function AGVChargeStation() {
  return (
    <group position={[39, 0, -38]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[4, 1.8, 1.4]} />
        <meshStandardMaterial color={0x37424d} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[1.6, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color={0x22ff66} emissive={0x22ff66} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[-1.6, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color={0x22ff66} emissive={0x22ff66} emissiveIntensity={0.7} />
      </mesh>
      <Html position={[0, 2.4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>⚡ Carga de flota</div>
      </Html>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[4.6, 0.12, 2]} />
        <meshStandardMaterial color={0x4a545c} roughness={0.6} />
      </mesh>
    </group>
  );
}

function PalletCluster({ position }) {
  return (
    <group position={position}>
      {[[0, 0, 0], [1.1, 0, 0], [0.55, 0, 1.15]].map((o, i) => (
        <group key={i} position={o}>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[0.95, 0.14, 0.7]} />
            <meshStandardMaterial color={0x8a6a3f} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.85, 0.55, 0.62]} />
            <meshStandardMaterial color={[0xC9773B, 0x8B5A2B, 0xa86b36][i % 3]} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.85, 0.25, 0.62]} />
            <meshStandardMaterial color={0xe8b98a} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.88, 0.4, 0.66]} />
            <meshStandardMaterial color={0xffffff} transparent opacity={0.1} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WallSigns() {
  const back = [
    { x: -28, text: 'ZONA DE RECIBO', c: '#2E9CFF' },
    { x: 0, text: 'RACKS A–G', c: '#8bd4ff' },
    { x: 28, text: 'ZONA DE DESPACHO', c: '#22d3a3' },
  ];
  const front = [
    { x: -34, text: 'CONTROL DE ACCESO', c: '#ffc81a' },
    { x: 34, text: 'MANTENIMIENTO', c: '#ffffff' },
  ];
  return (
    <group>
      {back.map((s, i) => (
        <group key={`b${i}`} position={[s.x, 6.4, -43.2]}>
          <mesh>
            <boxGeometry args={[7, 1.1, 0.15]} />
            <meshStandardMaterial color={0x0e2a3a} roughness={0.5} />
          </mesh>
          <Html position={[0, 0, 0.35]} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-1 rounded font-black text-white" style={{ background: 'rgba(4,18,26,0.9)', whiteSpace: 'nowrap', fontSize: '15px', color: s.c }}>{s.text}</div>
          </Html>
        </group>
      ))}
      {front.map((s, i) => (
        <group key={`f${i}`} position={[s.x, 6.4, 43.2]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <boxGeometry args={[7, 1.1, 0.15]} />
            <meshStandardMaterial color={0x0e2a3a} roughness={0.5} />
          </mesh>
          <Html position={[0, 0, 0.35]} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-1 rounded font-black text-white" style={{ background: 'rgba(4,18,26,0.9)', whiteSpace: 'nowrap', fontSize: '15px', color: s.c }}>{s.text}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* -------------------- WORKERS (personas) -------------------- */

function Worker({ path, speed, delay = 0, color = 0x3d7ac9 }) {
  const ref = useRef();
  const armL = useRef();
  const armR = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = ((t + delay) * speed) % 1;
    const seg = p * (path.length - 1);
    const i = Math.min(Math.floor(seg), path.length - 2);
    const f = seg - i;
    const a = path[i];
    const b = path[i + 1];
    const px = a[0] + (b[0] - a[0]) * f;
    const pz = a[1] + (b[1] - a[1]) * f;

    if (ref.current) {
      ref.current.position.set(px, 0.95 + Math.sin(t * 6 + delay) * 0.03, pz);
      ref.current.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
    const swing = Math.sin(t * 6 + delay) * 0.6;
    if (armL.current) armL.current.rotation.x = swing;
    if (armR.current) armR.current.rotation.x = -swing;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.28, 0.55, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color={0xe8b98a} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.52, 0.05]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color={0xffd27f} roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 0.9, 0]} ref={armL}>
        <boxGeometry args={[0.14, 0.7, 0.14]} />
        <meshStandardMaterial color={0x2f5f9e} roughness={0.6} />
      </mesh>
      <mesh position={[-0.5, 0.9, 0]} ref={armR}>
        <boxGeometry args={[0.14, 0.7, 0.14]} />
        <meshStandardMaterial color={0x2f5f9e} roughness={0.6} />
      </mesh>
      <mesh position={[0.2, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color={0x1c3d6e} roughness={0.6} />
      </mesh>
      <mesh position={[-0.2, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color={0x1c3d6e} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* -------------------- TECNOLOGÍA: AGV, terminales, luces -------------------- */

function AGVRobot({ path, speed, delay = 0 }) {
  const ref = useRef();
  const lightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = ((t + delay) * speed) % 1;
    const seg = p * (path.length - 1);
    const i = Math.min(Math.floor(seg), path.length - 2);
    const f = seg - i;
    const a = path[i];
    const b = path[i + 1];
    const px = a[0] + (b[0] - a[0]) * f;
    const pz = a[1] + (b[1] - a[1]) * f;

    if (ref.current) {
      ref.current.position.set(px, 0.32, pz);
      ref.current.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
    if (lightRef.current) lightRef.current.material.emissiveIntensity = 0.8 + Math.sin(t * 6 + delay) * 0.4;
  });

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.9, 0.4, 0.7]} />
        <meshStandardMaterial color={0x23303c} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.24, 12]} />
        <meshStandardMaterial color={0xffb020} roughness={0.3} />
      </mesh>
      <mesh ref={lightRef} position={[-0.3, 0.22, 0]}>
        <boxGeometry args={[0.14, 0.06, 0.1]} />
        <meshStandardMaterial color={0x22ff66} emissive={0x22ff66} emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.15, 0.25, 0]}>
        <boxGeometry args={[0.3, 0.12, 0.1]} />
        <meshStandardMaterial color={0x0a1014} emissive={0x22aaff} emissiveIntensity={0.5} roughness={0.2} metalness={0.6} />
      </mesh>
    </group>
  );
}

function Terminal({ position }) {
  const screenRef = useRef();
  useFrame(({ clock }) => {
    if (screenRef.current) screenRef.current.material.emissiveIntensity = 0.9 + Math.sin(clock.getElapsedTime() * 3) * 0.35;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh ref={screenRef} position={[0, 1.35, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.06]} />
        <meshStandardMaterial color={0x0b1420} emissive={0x22aaff} emissiveIntensity={0.8} roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

function CeilingLightStrip({ position, length = 12 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.75 + Math.sin(clock.getElapsedTime() * 2.4) * 0.2;
  });
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[length, 0.08, 0.5]} />
        <meshStandardMaterial color={0x333a42} roughness={0.8} />
      </mesh>
      <mesh ref={ref} position={[0, 0.035, 0]}>
        <boxGeometry args={[length - 0.3, 0.05, 0.3]} />
        <meshStandardMaterial color={0xfff4d0} emissive={0xfff0c0} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

/* -------------------- MAQUINARIA -------------------- */

function Forklift({ start, end, speed, amplitude, delay = 0, cargo = true }) {
  const ref = useRef();
  const cargoRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const progress = ((t + delay) * speed) % 1;
    const phase = Math.floor((t + delay) * speed);
    const direction = phase % 2 === 0 ? 1 : -1;

    const x = THREE.MathUtils.lerp(start[0], end[0], direction > 0 ? progress : 1 - progress);
    const z = THREE.MathUtils.lerp(start[1], end[1], direction > 0 ? progress : 1 - progress);

    if (ref.current) {
      ref.current.position.set(x, 1.1 + Math.sin(t * 3 + delay) * 0.05, z);
      ref.current.rotation.y = direction > 0 ? Math.atan2(end[1] - start[1], end[0] - start[0]) : Math.atan2(start[1] - end[1], start[0] - end[0]);
      ref.current.rotation.z = Math.sin(t * 2 + delay) * amplitude;
    }
    if (cargoRef.current) cargoRef.current.position.y = Math.sin(t * 1.2 + delay) * 0.15;
  });

  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.1, 0.7, 0.7]} />
        <meshStandardMaterial color={0xE5A00D} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0.7, 0.9, 0]}>
        <boxGeometry args={[0.25, 0.9, 0.6]} />
        <meshStandardMaterial color={0x8B5A2B} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.3, 0.3, 0.9]} />
        <meshStandardMaterial color={0x222222} roughness={0.4} metalness={0.6} />
      </mesh>
      {[0, 1].map(i => (
        <mesh key={i} position={[-0.55, 0.25, i === 0 ? 0.35 : -0.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 12]} />
          <meshStandardMaterial color={0x111111} roughness={0.2} />
        </mesh>
      ))}
      {cargo && (
        <group ref={cargoRef} position={[0, 1.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.4, 0.5]} />
            <meshStandardMaterial color={0xC9773B} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.8, 0.15, 0.5]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Conveyor({ position, rotation = 0, length = 8 }) {
  const beltRef = useRef();
  const parcelRefs = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beltRef.current) beltRef.current.position.x = (t * 1.2) % 0.5;
    parcelRefs.current.forEach((p, i) => {
      if (p) p.position.x = (((t * (i % 2 === 0 ? 2.2 : 1.4)) % 6) - 3);
    });
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[length, 0.4, 1]} />
        <meshStandardMaterial color={0x445566} roughness={0.8} metalness={0.2} />
      </mesh>
      <group ref={beltRef} position={[0, 0.21, 0]}>
        {Array.from({ length: Math.floor(length / 0.5) }).map((_, i) => (
          <mesh key={i} position={[i * 0.5 - length / 4, 0.05, 0]}>
            <boxGeometry args={[0.25, 0.1, 0.8]} />
            <meshStandardMaterial color={0x8899aa} roughness={0.6} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`p${i}`} ref={el => { parcelRefs.current[i] = el; }} position={[0, 0.5, 0]}>
          <boxGeometry args={[0.45, 0.3, 0.4]} />
          <meshStandardMaterial color={i % 2 ? 0xC9773B : 0x8B5A2B} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[length, 0.1, 1]} />
        <meshStandardMaterial color={0x667788} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* -------------------- ACTORES DE TAREAS (pool interno del Canvas) -------------------- */

const TASK_SPECS = {
  recepcion: () => ({ points: [toWorld(24, 3), toWorld(-6, 22), toWorld(-32, 16)], color: 0xC9773B, count: 3 }),
  picking: () => ({ points: [toWorld(-8, 42), toWorld(6, 38), toWorld(18, 8)], color: 0xE5A00D, count: 3 }),
  despacho: () => ({ points: [toWorld(12, 30), toWorld(36, 4)], color: 0x22aa66, count: 2 }),
};

function ActorManager({ simRef }) {
  const poolRef = useRef([]);

  const register = useCallback((mesh, i) => { poolRef.current[i] = mesh; if (simRef.current) simRef.current.pool[i] = mesh; }, [simRef]);

  useFrame((state, delta) => {
    const sim = simRef.current;
    if (!sim) return;
    const actors = sim.actors || [];
    for (let i = actors.length - 1; i >= 0; i--) {
      const a = actors[i];
      a.t += delta * a.speed;
      const pts = a.points;
      const seg = a.t * (pts.length - 1);
      const idx = Math.min(Math.floor(seg), pts.length - 2);
      const f = seg - idx;
      const p0 = pts[idx];
      const p1 = pts[idx + 1];
      if (a.mesh) {
        a.mesh.position.set(
          THREE.MathUtils.lerp(p0[0], p1[0], f),
          0.6 + Math.sin(a.t * 18) * 0.06,
          THREE.MathUtils.lerp(p0[1], p1[1], f)
        );
        a.mesh.rotation.y = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        a.mesh.visible = true;
      }
      if (a.t >= 1) actors.splice(i, 1);
    }
  });

  const pool = [];
  for (let i = 0; i < 12; i++) {
    pool.push(
      <mesh key={i} ref={el => el && register(el, i)} visible={false} position={[0, -50, 0]}>
        <boxGeometry args={[0.9, 0.45, 0.7]} />
        <meshStandardMaterial color={0xC9773B} roughness={0.7} />
      </mesh>
    );
  }
  return <group>{pool}</group>;
}

/* -------------------- MARCADORES DE PROBLEMAS -------------------- */

function IssueMarker({ issue, isSelected }) {
  const severityColors = { critical: 0xFF3B3B, warning: 0xFFC81A, good: 0x2ED47A };
  const color = severityColors[issue.severity] || 0x2E9CFF;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setScale(s => s === 1 ? 1.4 : 1), 900);
    return () => clearInterval(id);
  }, []);

  const pos = [(issue.x - 50) * 0.8, 4, (issue.y - 50) * 0.8];

  return (
    <group position={pos} scale={scale * (isSelected ? 1.6 : 1)}>
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.8, 1.3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
        <meshBasicMaterial color={0xcccccc} transparent opacity={0.8} />
      </mesh>
      <Html position={[0, -2.4, 0]} center className="text-center pointer-events-none" style={{ whiteSpace: 'nowrap' }} distanceFactor={8}>
        <div className={`px-2.5 py-1 rounded text-xs font-medium text-white shadow-lg border border-white/20 ${
          issue.severity === 'critical' ? 'bg-status-critical' : issue.severity === 'warning' ? 'bg-status-warning' : 'bg-status-good'
        }`}>
          {issue.severity === 'critical' && '🔴'} {issue.severity === 'warning' && '🟡'} {issue.severity === 'good' && '🟢'}
          {issue.description?.slice(0, 30) || ''}
        </div>
      </Html>
    </group>
  );
}

/* -------------------- ELEMENTOS ADICIONALES -------------------- */

function ScatteredPallets({ positions }) {
  return (
    <>
      {positions.map((p, i) => (
        <group key={`sp-${i}`} position={p}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[1.2, 0.12, 0.8]} />
            <meshStandardMaterial color={[0x8a6a3f, 0xa0784a, 0x7a5830][i % 3]} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[1.1, 0.55, 0.7]} />
            <meshStandardMaterial color={[0xC9773B, 0x8B5A2B, 0xa86b36][i % 3]} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[1.05, 0.2, 0.65]} />
            <meshStandardMaterial color={0xe8b98a} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function JibCrane({ position = [0, 0, 0] }) {
  const jRef = useRef();
  useFrame(({ clock }) => {
    if (jRef.current) {
      jRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.08;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 8.5, 0]}>
        <boxGeometry args={[0.3, 0.3, 22]} />
        <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[-11, 8.5, 0]}>
        <boxGeometry args={[0.3, 0.3, 22]} />
        <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 8.3, 0]}>
        <boxGeometry args={[22, 0.25, 0.3]} />
        <meshStandardMaterial color={0x555f6b} roughness={0.5} metalness={0.5} />
      </mesh>
      <group ref={jRef}>
        <mesh position={[8, 8.5, 0]}>
          <boxGeometry args={[0.2, 0.5, 3]} />
          <meshStandardMaterial color={0x4a545c} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[9.5, 8.8, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.8]} />
          <meshStandardMaterial color={0x333a42} roughness={0.5} />
        </mesh>
        <mesh position={[10, 8.35, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.6, 12]} />
          <meshStandardMaterial color={0x111111} roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
      <mesh position={[0, 8.6, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1, 12]} />
        <meshStandardMaterial color={0x9aa5b1} roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}

function DustParticles() {
  const ref = useRef();
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80;
      arr[i * 3 + 1] = Math.random() * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      const arr = ref.current.geometry.attributes.position.array;
      const t = clock.getElapsedTime();
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.1) * 0.003;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry attach="geometry">
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={0xffffff} transparent opacity={0.25} sizeAttenuation />
    </points>
  );
}

function SafetyCone({ position, color = 0xff8c00 }) {
  return (
    <group position={position}>
      <mesh>
        <coneGeometry args={[0.2, 0.7, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 8]} />
        <meshStandardMaterial color={0xffffff} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.1, 8]} />
        <meshStandardMaterial color={0x333333} roughness={0.5} />
      </mesh>
    </group>
  );
}

function SafetyConeBarrier() {
  const cones = [
    [-42, 1, -20], [-42, 1, -10], [-42, 1, 0], [-42, 1, 10], [-42, 1, 20],
    [42, 1, -20], [42, 1, -10], [42, 1, 0], [42, 1, 10], [42, 1, 20],
    [-30, 1, -33], [-20, 1, -33], [-10, 1, -33], [0, 1, -33], [10, 1, -33], [20, 1, -33], [30, 1, -33],
    [-30, 1, 33], [-20, 1, 33], [-10, 1, 33], [0, 1, 33], [10, 1, 33], [20, 1, 33], [30, 1, 33],
  ];
  return (
    <>
      {cones.map((c, i) => (
        <SafetyCone key={`sc-${i}`} position={c} color={i % 3 === 0 ? 0xff6b6b : 0xff8c00} />
      ))}
    </>
  );
}

function ExtraContainers() {
  const containers = [
    { pos: [18, 0, 12], color: 0x3d5a80, size: [1.5, 1.5, 1.5] },
    { pos: [22, 0, 15], color: 0x5b7896, size: [1.2, 1.2, 1.2] },
    { pos: [-18, 0, -12], color: 0x6b7684, size: [1.4, 1.4, 1.4] },
    { pos: [-22, 0, -15], color: 0x7a8a9a, size: [1.3, 1.3, 1.3] },
    { pos: [30, 0, -18], color: 0x4a6fa5, size: [1.0, 1.0, 1.0] },
    { pos: [-30, 0, 20], color: 0x5a80a0, size: [1.1, 1.1, 1.1] },
    { pos: [12, 0, -22], color: 0x3d7ac9, size: [0.9, 0.9, 0.9] },
    { pos: [-12, 0, 28], color: 0x2d5a7a, size: [1.3, 1.3, 1.3] },
  ];
  return (
    <>
      {containers.map((c, i) => (
        <group key={`ec-${i}`} position={c.pos}>
          <mesh>
            <boxGeometry args={c.size} />
            <meshStandardMaterial color={c.color} roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, c.size[1] / 2 + 0.05, 0]}>
            <boxGeometry args={[c.size[0] * 0.9, 0.05, c.size[2] * 0.9]} />
            <meshStandardMaterial color={0xffffff} roughness={0.6} />
          </mesh>
          <mesh position={[0, c.size[1] * 0.6, 0]}>
            <boxGeometry args={[c.size[0] * 0.7, 0.04, c.size[2] * 0.7]} />
            <meshStandardMaterial color={0x1a2530} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function FireExtinguisher({ position }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.12, 0.8, 12]} />
        <meshStandardMaterial color={0xff3333} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.08]} />
        <meshStandardMaterial color={0x333333} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.15, 12]} />
        <meshStandardMaterial color={0x333333} roughness={0.5} />
      </mesh>
      <Html position={[0.2, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="px-1 py-0.5 rounded text-[8px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>EXTINTOR</div>
      </Html>
    </group>
  );
}

function FireExtinguishers() {
  const positions = [
    [44, 1.2, -30], [-44, 1.2, -30], [44, 1.2, 30], [-44, 1.2, 30],
    [0, 1.2, 44], [40, 1.2, -40], [-40, 1.2, 40],
  ];
  return (
    <>
      {positions.map((p, i) => (
        <FireExtinguisher key={`fe-${i}`} position={p} />
      ))}
    </>
  );
}

function AdditionalSignage() {
  const signs = [
    { pos: [30, 5, -43.2], text: 'PELIGRO: ZONA DE CARGA', c: '#ff3333' },
    { pos: [-30, 5, 43.2], text: 'USO DE EPP OBLIGATORIO', c: '#ffc81a' },
    { pos: [-43.2, 5, 30], text: 'SALIDA EMERGENCIA', c: '#22d3a3' },
    { pos: [43.2, 5, -20], text: 'EXTINTOR AQUÍ', c: '#ff6666' },
  ];
  return (
    <>
      {signs.map((s, i) => (
        <group key={`as-${i}`} position={s.pos} rotation={s.pos[0] === 0 ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
          <mesh>
            <boxGeometry args={[7, 1, 0.15]} />
            <meshStandardMaterial color={s.c} roughness={0.4} />
          </mesh>
          <Html position={[0, 0, 0.35]} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-0.5 rounded font-bold text-white" style={{ background: 'rgba(0,0,0,0.8)', fontSize: '11px', whiteSpace: 'nowrap' }}>⚠ {s.text}</div>
          </Html>
        </group>
      ))}
    </>
  );
}

function UtilityCart({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 0.15, 0.8]} />
        <meshStandardMaterial color={0x9aa5b1} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.55, 0.7]} />
        <meshStandardMaterial color={0x6b7684} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[-0.5, 0.2, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.2, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} />
      </mesh>
      <mesh position={[-0.5, 0.2, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.2, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} />
      </mesh>
      <mesh position={[0.3, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <meshStandardMaterial color={0x22aaff} emissive={0x22aaff} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function UtilityCarts() {
  return (
    <>
      <UtilityCart position={[36, 0, 10]} />
      <UtilityCart position={[-36, 0, -10]} rotation={[0, Math.PI, 0]} />
      <UtilityCart position={[10, 0, -36]} rotation={[0, Math.PI / 2, 0]} />
    </>
  );
}

function OilDrums() {
  const drums = [
    { pos: [28, 0, 18], color: 0x333333 },
    { pos: [30, 0, 20], color: 0x444444 },
    { pos: [-28, 0, -18], color: 0x555555 },
    { pos: [-30, 0, -20], color: 0x666666 },
  ];
  return (
    <>
      {drums.map((d, i) => (
        <group key={`od-${i}`} position={d.pos}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 1.1, 16]} />
            <meshStandardMaterial color={d.color} roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color={0x1a1a1a} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color={0x1a1a1a} roughness={0.5} />
          </mesh>
          <Html position={[0.4, 0, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="px-1 py-0.5 rounded text-[8px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>⛽ {d.color === 0x333333 ? 'ACEITE' : 'COMBUSTIBLE'}</div>
          </Html>
        </group>
      ))}
    </>
  );
}

function StackedCrates() {
  const stacks = [
    { pos: [15, 0, -5], rows: 3 },
    { pos: [-25, 0, 15], rows: 2 },
    { pos: [5, 0, 30], rows: 4 },
  ];
  return (
    <>
      {stacks.map((s, i) => (
        <group key={`sc-${i}`} position={s.pos}>
          {[0, 1, 2, 3].map(r => (
            r < s.rows && (
              <group key={r} position={[0, r * 0.6, 0]}>
                <mesh>
                  <boxGeometry args={[0.8, 0.4, 0.8]} />
                  <meshStandardMaterial color={[0x8B5A2B, 0xA05A2C, 0xB87A4A][i % 3]} roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.22, 0]}>
                  <boxGeometry args={[0.75, 0.04, 0.75]} />
                  <meshStandardMaterial color={0x6a4a2a} roughness={0.7} />
                </mesh>
              </group>
            )
          ))}
        </group>
      ))}
    </>
  );
}

function CanopyStructure() {
  return (
    <group position={[0, 5.5, 44.5]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[16, 0.3, 4]} />
        <meshStandardMaterial color={0x333a42} roughness={0.6} metalness={0.3} />
      </mesh>
      {[-8, -4, 0, 4, 8].map(x => (
        <mesh key={`cs-${x}`} position={[x, -0.15, 0]}>
          <boxGeometry args={[0.2, 0.3, 4]} />
          <meshStandardMaterial color={0x555f6b} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(y => (
        <mesh key={`cs-r-${y}`} position={[-8, y, 2]}>
          <boxGeometry args={[0.05, 0.05, 3.8]} />
          <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(y => (
        <mesh key={`cs-r2-${y}`} position={[8, y, 2]}>
          <boxGeometry args={[0.05, 0.05, 3.8]} />
          <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(y => (
        <mesh key={`cs-r3-${y}`} position={[0, y, -2]}>
          <boxGeometry args={[0.05, 0.05, 3.8]} />
          <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function ExtraCeilingLights() {
  const positions = [
    [-25, 9, 30], [25, 9, -10], [-10, 9, -30], [35, 9, 25],
    [-35, 9, -25], [15, 9, 40], [-20, 9, -40], [40, 9, 10],
  ];
  return (
    <>
      {positions.map((p, i) => (
        <group key={`ecl-${i}`} position={p}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[8, 0.06, 0.4]} />
            <meshStandardMaterial color={0x333a42} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[7.5, 0.04, 0.3]} />
            <meshStandardMaterial color={0xfff4d0} emissive={0xfff0c0} emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ReflectiveFloorMarkers() {
  const markers = [
    [-35, 0.02, 0], [-30, 0.02, 0], [-25, 0.02, 0], [-20, 0.02, 0], [-15, 0.02, 0],
    [0, 0.02, 0], [5, 0.02, 0], [10, 0.02, 0], [15, 0.02, 0], [20, 0.02, 0],
    [25, 0.02, 0], [30, 0.02, 0], [35, 0.02, 0],
    [0, 0.02, -35], [0, 0.02, -30], [0, 0.02, -25], [0, 0.02, -20], [0, 0.02, -15],
    [0, 0.02, 5], [0, 0.02, 10], [0, 0.02, 15], [0, 0.02, 20], [0, 0.02, 25], [0, 0.02, 30], [0, 0.02, 35],
  ];
  return (
    <>
      {markers.map((m, i) => (
        <mesh key={`rfm-${i}`} position={m} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 12]} />
          <meshStandardMaterial color={0xffffff} emissive={0xccddff} emissiveIntensity={0.3} roughness={0.1} metalness={0.9} transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

function ToolStorage({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.5, 2.5, 0.5]} />
        <meshStandardMaterial color={0x4a545c} roughness={0.7} />
      </mesh>
      {[0, 0.8, 1.6].map(y => (
        <mesh key={`ts-${y}`} position={[0, y, 0.26]}>
          <boxGeometry args={[1.4, 0.15, 0.04]} />
          <meshStandardMaterial color={0x3d4a54} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0.6, 1.2, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.4, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} />
      </mesh>
      <mesh position={[-0.6, 1.2, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.4, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ToolStorages() {
  return (
    <>
      <ToolStorage position={[35, 0, 35]} />
      <ToolStorage position={[-35, 0, -35]} rotation={[0, Math.PI / 2, 0]} />
    </>
  );
}

function PackagingStation({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3, 1, 2]} />
        <meshStandardMaterial color={0x4a545c} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[2.8, 0.8, 1.8]} />
        <meshStandardMaterial color={0x5a6470} roughness={0.5} metalness={0.2} />
      </mesh>
      {[0, 1, 2].map(i => (
        <mesh key={`pkg-${i}`} position={[-1 + i * 1, 0.55, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={[0xC9773B, 0x8B5A2B, 0xe8b98a][i % 3]} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[1.5, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.6]} />
        <meshStandardMaterial color={0x22aaff} emissive={0x22aaff} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-1.5, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.6]} />
        <meshStandardMaterial color={0xffc81a} emissive={0xffc81a} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function LoadingDock({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[5, 0.6, 2.5]} />
        <meshStandardMaterial color={0x2b2f36} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[4.5, 1.8, 2]} />
        <meshStandardMaterial color={0x3d4a54} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[4, 0.3, 1.5]} />
        <meshStandardMaterial color={0x5a6470} roughness={0.5} />
      </mesh>
      {[0, 1].map(i => (
        <mesh key={`ld-r${i}`} position={[-1.5 + i * 3, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 3, 10]} />
          <meshStandardMaterial color={0x9aa5b1} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[0.4, 0.15, 0.15]} />
        <meshStandardMaterial color={0xffb020} emissive={0xffb020} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[2.8, 0, 0]}>
        <boxGeometry args={[0.15, 2.5, 2]} />
        <meshStandardMaterial color={0x6b7684} roughness={0.5} metalness={0.3} />
      </mesh>
      {[0, 1, 2].map(i => (
        <mesh key={`ld-p${i}`} position={[3.2, 0.35, -0.8 + i * 0.8]}>
          <boxGeometry args={[0.6, 0.3, 0.6]} />
          <meshStandardMaterial color={[0xC9773B, 0x8B5A2B, 0xa86b36][i % 3]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function MoreForklifts() {
  return (
    <>
      <Forklift start={[-18, 8]} end={[-18, -20]} speed={0.08} amplitude={0.02} delay={2} />
      <Forklift start={[28, 16]} end={[28, -15]} speed={0.07} amplitude={0.015} delay={1.6} cargo={false} />
      <Forklift start={[-28, 20]} end={[10, 20]} speed={0.065} amplitude={0.02} delay={0.3} />
      <Forklift start={[35, -5]} end={[-15, -5]} speed={0.09} amplitude={0.025} delay={2.2} />
      <Forklift start={[0, 40]} end={[-25, 40]} speed={0.075} amplitude={0.015} delay={1} cargo={false} />
      <Forklift start={[12, -30]} end={[12, -45]} speed={0.06} amplitude={0.02} delay={0.6} />
    </>
  );
}

function MoreWorkers() {
  return (
    <>
      <Worker path={[toWorld(40, 30), toWorld(40, 10), toWorld(20, 10), toWorld(20, 30)]} speed={0.045} delay={0.5} color={0x3d7ac9} />
      <Worker path={[toWorld(-20, -30), toWorld(-20, -50), toWorld(-40, -50), toWorld(-40, -30)]} speed={0.055} delay={1.3} color={0xd9552b} />
      <Worker path={[toWorld(30, -40), toWorld(30, -60), toWorld(10, -60), toWorld(10, -40)]} speed={0.05} delay={2.1} color={0x2f9e77} />
      <Worker path={[toWorld(-30, 50), toWorld(-50, 50), toWorld(-50, 30), toWorld(-30, 30)]} speed={0.042} delay={0.9} color={0x9b59b6} />
      <Worker path={[toWorld(50, 50), toWorld(50, 30), toWorld(35, 30), toWorld(35, 50)]} speed={0.05} delay={1.7} color={0xe0a528} />
      <Worker path={[toWorld(-45, 15), toWorld(-45, -15), toWorld(-30, -15), toWorld(-30, 15)]} speed={0.048} delay={2.5} color={0x16a085} />
      <Worker path={[toWorld(5, 70), toWorld(-5, 70), toWorld(-5, 55), toWorld(5, 55)]} speed={0.055} delay={0.3} color={0xd35400} />
    </>
  );
}

function MoreConveyors() {
  return (
    <>
      <Conveyor position={[-20, 0.8, 30]} rotation={Math.PI} length={14} />
      <Conveyor position={[22, 0.8, -20]} rotation={0} length={10} />
      <Conveyor position={[-10, 0.8, -30]} rotation={Math.PI / 2} length={12} />
      <Conveyor position={[40, 0.8, 20]} rotation={Math.PI / 2} length={8} />
      <Conveyor position={[-30, 0.8, 35]} rotation={0} length={15} />
    </>
  );
}

function MorePallets() {
  return (
    <ScatteredPallets positions={
      [
        [40, 0, 30], [-40, 0, -30], [35, 0, -40], [-35, 0, 40],
        [50, 0, 0], [-50, 0, 0], [0, 0, -50], [0, 0, 50],
        [15, 0, -35], [-15, 0, 35], [30, 0, 45], [-30, 0, -45],
        [45, 0, -25], [-45, 0, 25], [10, 0, 50], [-10, 0, -50],
        [55, 0, 20], [-55, 0, -20], [20, 0, -55], [-20, 0, 55],
      ]
    } />
  );
}

function MoreContainers() {
  return (
    <ExtraContainers />
  );
}

function MoreCeilingLights() {
  return (
    <>
      <CeilingLightStrip position={[40, 9, 40]} length={10} />
      <CeilingLightStrip position={[-40, 9, -40]} length={10} />
      <CeilingLightStrip position={[0, 9, -50]} length={12} />
      <CeilingLightStrip position={[50, 9, 10]} length={8} />
      <CeilingLightStrip position={[-50, 9, -10]} length={8} />
      <CeilingLightStrip position={[15, 9, 50]} length={9} />
      <CeilingLightStrip position={[-50, 9, 50]} length={9} />
      <CeilingLightStrip position={[-50, 9, -50]} length={10} />
    </>
  );
}

function MoreSignage() {
  return (
    <>
      <group position={[45, 6.4, -43.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[7, 1, 0.15]} />
          <meshStandardMaterial color={0x0e2a3a} roughness={0.5} />
        </mesh>
        <Html position={[0, 0, 0.35]} center style={{ pointerEvents: 'none' }}>
          <div className="px-2 py-1 rounded font-black text-white" style={{ background: 'rgba(4,18,26,0.9)', whiteSpace: 'nowrap', fontSize: '13px', color: '#22d3a3' }}>CARGA RÁPIDA</div>
        </Html>
      </group>
      <group position={[-45, 6.4, 43.2]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[7, 1, 0.15]} />
          <meshStandardMaterial color={0x0e2a3a} roughness={0.5} />
        </mesh>
        <Html position={[0, 0, 0.35]} center style={{ pointerEvents: 'none' }}>
          <div className="px-2 py-1 rounded font-black text-white" style={{ background: 'rgba(4,18,26,0.9)', whiteSpace: 'nowrap', fontSize: '13px', color: '#ffc81a' }}>ZONA PACKING</div>
        </Html>
      </group>
      <group position={[0, 6.4, 43.2]}>
        <mesh>
          <boxGeometry args={[7, 1, 0.15]} />
          <meshStandardMaterial color={0x0e2a3a} roughness={0.5} />
        </mesh>
        <Html position={[0, 0, 0.35]} center style={{ pointerEvents: 'none' }}>
          <div className="px-2 py-1 rounded font-black text-white" style={{ background: 'rgba(4,18,26,0.9)', whiteSpace: 'nowrap', fontSize: '13px', color: '#4dd0ff' }}>ALMACÉN PRINCIPAL</div>
        </Html>
      </group>
    </>
  );
}

function MorePackagingAreas() {
  return (
    <>
      <PackagingStation position={[35, 0, -25]} />
      <PackagingStation position={[-35, 0, 25]} />
      <PackagingStation position={[45, 0, 15]} />
    </>
  );
}

function MoreLoadingDocks() {
  return (
    <>
      <LoadingDock position={[0, 0, 46.5]} />
      <LoadingDock position={[-50, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <LoadingDock position={[50, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </>
  );
}

function MoreFireExtinguishers() {
  return (
    <>
      <FireExtinguisher position={[44, 1.2, 10]} />
      <FireExtinguisher position={[-44, 1.2, -10]} />
      <FireExtinguisher position={[20, 1.2, 44]} />
      <FireExtinguisher position={[-20, 1.2, -44]} />
      <FireExtinguisher position={[44, 1.2, -20]} />
      <FireExtinguisher position={[-44, 1.2, 20]} />
    </>
  );
}

function MoreUtilityCarts() {
  return (
    <>
      <UtilityCart position={[42, 0, 20]} />
      <UtilityCart position={[-42, 0, -20]} rotation={[0, Math.PI, 0]} />
      <UtilityCart position={[20, 0, -42]} rotation={[0, Math.PI / 2, 0]} />
      <UtilityCart position={[-20, 0, 42]} rotation={[0, -Math.PI / 2, 0]} />
      <UtilityCart position={[30, 0, 30]} rotation={[0, Math.PI / 4, 0]} />
    </>
  );
}

function MoreOilDrums() {
  return (
    <>
      {[
        { pos: [35, 0, 25], color: 0x444444 },
        { pos: [-35, 0, -25], color: 0x555555 },
        { pos: [25, 0, -35], color: 0x333333 },
        { pos: [-25, 0, 35], color: 0x666666 },
        { pos: [15, 0, -45], color: 0x3d5a80 },
        { pos: [-15, 0, 45], color: 0x5b7896 },
        { pos: [45, 0, 5], color: 0x2d5a7a },
        { pos: [-45, 0, -5], color: 0x4a6fa5 },
      ].map((d, i) => (
        <group key={`od2-${i}`} position={d.pos}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 1.1, 16]} />
            <meshStandardMaterial color={d.color} roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color={0x1a1a1a} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
            <meshStandardMaterial color={0x1a1a1a} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function MoreSafetyCones() {
  const cones = [
    [38, 1, 42], [38, 1, 38], [38, 1, 34],
    [-38, 1, -42], [-38, 1, -38], [-38, 1, -34],
    [42, 1, -38], [42, 1, -34], [42, 1, -30],
    [-42, 1, 38], [-42, 1, 34], [-42, 1, 30],
  ];
  return (
    <>
      {cones.map((c, i) => (
        <SafetyCone key={`sc2-${i}`} position={c} color={i % 3 === 0 ? 0xff6b6b : 0xff8c00} />
      ))}
    </>
  );
}

function WarehouseSceneInner({ zones, issues, selectedIssue, onZoneClick, onReady, interactions, simRef }) {
  const groupRef = useRef();
  const [hoveredZone, setHoveredZone] = useState(null);
  const { runningTask, stats } = interactions;

  useEffect(() => {
    if (groupRef.current && onReady) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const mmax = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).z);
      onReady({ center, maxDim: mmax });
    }
  }, [zones, onReady]);

  const handleHoverIn = useCallback(i => setHoveredZone(i), []);
  const handleHoverOut = useCallback(() => setHoveredZone(null), []);
  const handleZoneClick = useCallback(z => onZoneClick?.(z), [onZoneClick]);

  const rackZones = useMemo(() => zones.filter(z => z.type === 'racking'), [zones]);
  const loadingZones = useMemo(() => zones.filter(z => z.type === 'loading'), [zones]);

  const workerPaths = useMemo(() => [
    { path: [toWorld(-26, 30), toWorld(-8, 30), toWorld(-4, 26), toWorld(-12, 12), toWorld(-28, 44)], speed: 0.05, color: 0x3d7ac9 },
    { path: [toWorld(26, 12), toWorld(26, 42), toWorld(6, 44), toWorld(2, 16)], speed: 0.045, color: 0xd9552b },
    { path: [toWorld(-34, 66), toWorld(-10, 60), toWorld(-6, 46), toWorld(-30, 22)], speed: 0.05, color: 0x2f9e77 },
    { path: [toWorld(30, 58), toWorld(16, 66), toWorld(8, 30), toWorld(30, 34)], speed: 0.04, color: 0x9b59b6 },
    { path: [toWorld(-16, 84), toWorld(-4, 80), toWorld(20, 70), toWorld(16, 44)], speed: 0.055, color: 0xe0a528 },
    { path: [toWorld(34, 86), toWorld(24, 90), toWorld(-20, 70), toWorld(-24, 40)], speed: 0.042, color: 0x3d7ac9 },
    { path: [toWorld(-40, 40), toWorld(-40, 12), toWorld(-20, 4), toWorld(0, 18)], speed: 0.06, color: 0xe67e22 },
    { path: [toWorld(36, 20), toWorld(28, 30), toWorld(12, 26), toWorld(6, 32)], speed: 0.05, color: 0x16a085 },
    { path: [toWorld(-30, 78), toWorld(-30, 30), toWorld(-18, 30), toWorld(-30, 80)], speed: 0.04, color: 0x8e44ad },
    { path: [toWorld(20, 70), toWorld(30, 60), toWorld(30, 8), toWorld(20, 8)], speed: 0.055, color: 0xd35400 },
    { path: [toWorld(6, 50), toWorld(-4, 44), toWorld(2, 24), toWorld(12, 30)], speed: 0.06, color: 0x2c3e50 },
    { path: [toWorld(-24, 90), toWorld(-20, 70), toWorld(-6, 60), toWorld(10, 66)], speed: 0.05, color: 0x27ae60 },
  ], []);

  const agvPaths = useMemo(() => [
    { path: [toWorld(-18, 20), toWorld(0, 34), toWorld(22, 12)], speed: 0.07 },
    { path: [toWorld(20, 28), toWorld(-4, 52), toWorld(18, 60)], speed: 0.06 },
    { path: [toWorld(-28, 54), toWorld(28, 44), toWorld(30, 8)], speed: 0.065 },
    { path: [toWorld(-36, 44), toWorld(-16, 34), toWorld(-30, 12)], speed: 0.08 },
    { path: [toWorld(34, 40), toWorld(24, 20), toWorld(2, 4)], speed: 0.075 },
    { path: [toWorld(0, 56), toWorld(12, 44), toWorld(8, 26)], speed: 0.07 },
  ], []);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[40, 90, 30]} intensity={1.05} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80} shadow-camera-near={1} shadow-camera-far={260} />
      <directionalLight position={[-40, 30, -30]} intensity={0.35} color={0xaebdff} />
      <hemisphereLight intensity={0.5} groundColor={0xc2c9d2} />

      <Floor />
      <BuildingWalls />
      <OfficeAnnex />
      <SecurityBooth />
      <ParkingLines />
      <Car position={[52.5, 0, 33]} rotation={Math.PI} color={0x4a6fa5} />
      <Car position={[56, 0, 33]} rotation={Math.PI} color={0xb03a2e} />
      <Car position={[52.5, 0, 50]} rotation={0} color={0xffffff} />
      <Car position={[56, 0, 50]} rotation={0} color={0x5a5f6b} />
      <ZoneTiles zones={zones} selectedIssue={selectedIssue} hoveredZone={hoveredZone} onHoverIn={handleHoverIn} onHoverOut={handleHoverOut} onZoneClick={handleZoneClick} />
      <FloorMarks zones={zones} />
      <WallSigns />

      <Truck position={[-22, 0, -46.5]} rotation={Math.PI} />
      <Truck position={[28, 0, -46.5]} rotation={Math.PI} />
      <Truck position={[4, 0, 46.6]} rotation={0} />

      {rackZones.map((zone, i) => {
        const p = toWorld(zone.x + zone.width / 2, zone.y + zone.height / 2);
        return <Rack key={`rack-${i}`} position={[p[0], 0.9, p[1]]} width={zone.width * 0.008} depth={zone.height * 0.008} />;
      })}

      {loadingZones.map((zone, i) => {
        const p = toWorld(zone.x + zone.width / 2, zone.y + zone.height / 2);
        return (
          <group key={`dock-${i}`} position={[p[0], 0, p[1]]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[zone.width * 0.008, 0.18, zone.height * 0.008]} />
              <meshStandardMaterial color={0x2b2f36} roughness={0.7} />
            </mesh>
            <mesh position={[-zone.width * 0.004, 0.32, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.09, 0.09, zone.width * 0.008, 10]} />
              <meshStandardMaterial color={0xffb020} emissive={0xffb020} emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      })}

      <Conveyor position={[6, 0.8, 0]} rotation={0} length={16} />
      <Conveyor position={[-14, 0.8, -10]} rotation={Math.PI} length={12} />

      <AGVChargeStation />
      <PalletCluster position={[10, 0, -14]} />
      <PalletCluster position={[-20, 0, 20]} />
      <PalletCluster position={[26, 0, 18]} />

      {loadingZones.map((z, i) => {
        const p = toWorld(z.x + z.width / 2, z.y + 12);
        return <Terminal key={`t-${i}`} position={[p[0], 0, p[1]]} />;
      })}

      {workerPaths.map((w, i) => <Worker key={`w-${i}`} path={w.path} speed={w.speed} delay={i * 0.7} color={w.color} />)}
      {agvPaths.map((a, i) => <AGVRobot key={`agv-${i}`} path={a.path} speed={a.speed} delay={i * 0.5} />)}

      <Forklift start={[-22, 8]} end={[8, 8]} speed={0.06} amplitude={0.02} delay={0} />
      <Forklift start={[22, -12]} end={[-10, -12]} speed={0.05} amplitude={0.015} delay={0.4} />
      <Forklift start={[-5, -8]} end={[-5, 30]} speed={0.07} amplitude={0.02} delay={0.8} />
      <Forklift start={[16, 24]} end={[16, -20]} speed={0.09} amplitude={0.015} delay={1.2} cargo={false} />

      {[[-36, -10, 8], [-36, 18, 12], [-8, -30, 10], [16, 34, 14], [36, -24, 8], [-24, 52, 14]].map(([lx, lz, ll], i) => (
        <CeilingLightStrip key={`cl-${i}`} position={[lx, 9, lz]} length={ll} />
      ))}

      <JibCrane position={[0, 0, 0]} />
      <ScatteredPallets positions={[[14, 0, -8], [-14, 0, 12], [24, 0, 20], [-24, 0, -18], [8, 0, 32], [-32, 0, -22], [32, 0, -12]]} />
      <MorePallets />
      <SafetyConeBarrier />
      <MoreSafetyCones />
      <ExtraContainers />
      <MoreContainers />
      <FireExtinguishers />
      <MoreFireExtinguishers />
      <AdditionalSignage />
      <MoreSignage />
      <UtilityCarts />
      <MoreUtilityCarts />
      <OilDrums />
      <MoreOilDrums />
      <StackedCrates />
      <CanopyStructure />
      <ExtraCeilingLights />
      <MoreCeilingLights />
      <ReflectiveFloorMarkers />
      <ToolStorages />
      <MoreConveyors />
      <MoreLoadingDocks />
      <MorePackagingAreas />
      <AGVChargeStation />
      <DustParticles />
      <MoreWorkers />
      <MoreForklifts />
      <ActorManager simRef={simRef} />

      {issues.map((issue, i) => (
        <IssueMarker key={i} issue={issue} isSelected={selectedIssue?.type === issue.type && selectedIssue.x === issue.x} />
      ))}

      <OrbitControls enablePan enableZoom enableRotate minZoom={0.4} maxZoom={8} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />

      {(runningTask || (stats && stats.total > 0)) && (
        <Html position={[0, 11, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: 'rgba(8,18,28,0.85)' }}>
            {runningTask ? `▶ SIMULANDO: ${runningTask.toUpperCase()}` : `Actividad: Recibidos ${stats.recibidos} · Picking ${stats.preparados} · Despachos ${stats.despachados}`}
          </div>
        </Html>
      )}
    </group>
  );
}

const WarehouseScene = memo(WarehouseSceneInner);

/* -------------------- PANEL DE CONTROL DE SIMULACIÓN -------------------- */

function TaskControls({ onTask, onReset, runningTask, stats }) {
  const tasks = [
    { id: 'recepcion', label: 'Recibir pallets', icon: '📥' },
    { id: 'picking', label: 'Preparar pedido', icon: '📦' },
    { id: 'despacho', label: 'Despachar camión', icon: '🚚' },
  ];
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-2 sm:p-3 pointer-events-none">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#0b1520]/80 backdrop-blur-md shadow-2xl pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 pt-2 sm:px-3">
          {tasks.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTask(t.id)}
              disabled={runningTask !== null}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: runningTask === t.id ? 'linear-gradient(135deg,#2E9CFF,#6C63FF)' : 'rgba(255,255,255,0.1)' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button type="button" onClick={onReset} disabled={runningTask !== null} className="px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-secondary hover:text-primary transition-colors disabled:opacity-50">
            ⟲ Reset
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5 sm:px-3 text-center border-t border-white/10">
          {[['Recibidos', stats?.recibidos || 0], ['Picking', stats?.preparados || 0], ['Despachos', stats?.despachados || 0], ['Total', stats?.total || 0]].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] sm:text-xs text-secondary">{label}</p>
              <p className="text-sm sm:text-lg font-bold text-primary leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- EXPORT -------------------- */

export function Warehouse3D({ zones, issues, selectedIssue, onZoneClick, className = '', cameraPosition = [0, 54, 78] }) {
  const [camera, setCamera] = useState(cameraPosition);
  const [runningTask, setRunningTask] = useState(null);
  const [stats, setStats] = useState({ recibidos: 0, preparados: 0, despachados: 0, total: 0 });
  const simRef = useRef({ actors: [], pool: [] });

  const onSceneReady = useCallback(({ center, maxDim }) => {
    const distance = Math.min(maxDim * 1.05, 75);
    if (Math.abs(center.x) > 1 || Math.abs(center.z) > 1) {
      setCamera([center.x, distance * 0.72, center.z + distance]);
    }
  }, []);

  const launchTask = useCallback((type) => {
    if (runningTask) return;
    setRunningTask(type);

    const spec = TASK_SPECS[type]();
    for (let k = 0; k < spec.count; k++) {
      const mesh = simRef.current.pool[k % simRef.current.pool.length];
      if (!mesh) continue;
      mesh.material.color.set(spec.color);
      mesh.visible = false;
      simRef.current.actors.push({ type, mesh, points: spec.points, t: 0, speed: 0.5 + k * 0.08 });
    }

    const ms = type === 'despacho' ? 2600 : 3800;
    setTimeout(() => {
      setStats(s => {
        const key = type === 'recepcion' ? 'recibidos' : type === 'picking' ? 'preparados' : 'despachados';
        return { ...s, [key]: s[key] + 1, total: s.total + 1 };
      });
    }, ms);
    setTimeout(() => setRunningTask(null), ms + 400);
  }, [runningTask]);

  const resetSim = useCallback(() => {
    simRef.current.actors = [];
    simRef.current.pool.forEach(m => { if (m) m.visible = false; });
    setStats({ recibidos: 0, preparados: 0, despachados: 0, total: 0 });
  }, []);

  const interactions = useMemo(() => ({ runningTask, stats }), [runningTask, stats]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden glass ${className}`}>
      <div className="h-96 sm:h-[520px] lg:h-[600px]">
        <Canvas
          camera={{ position: camera, fov: 50 }}
          style={{ width: '100%', height: '100%' }}
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <WarehouseScene
            zones={zones}
            issues={issues}
            selectedIssue={selectedIssue}
            onZoneClick={onZoneClick}
            onReady={onSceneReady}
            interactions={interactions}
            simRef={simRef}
          />
        </Canvas>
      </div>
      <TaskControls onTask={launchTask} onReset={resetSim} runningTask={runningTask} stats={stats} />
    </div>
  );
}

export function Warehouse3DLegend() {
  const items = [
    { type: 'racking', label: 'Estanterías', color: '#B8C0CC' },
    { type: 'aisle', label: 'Pasillos', color: '#E4E8EE' },
    { type: 'loading', label: 'Carga/Descarga', color: '#8C95A1' },
    { type: 'empty', label: 'Espacio libre', color: '#F3F5F7' },
    { type: 'obstacle', label: 'Obstáculos', color: '#E85D5D' },
  ];
  return (
    <div className="flex flex-wrap gap-4 text-sm text-secondary">
      {items.map(item => (
        <div key={item.type} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}