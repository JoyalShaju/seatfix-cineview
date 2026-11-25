'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GraphicsQuality, ScreenConfig, ScreenDisplayMode } from '@/types/auditorium';

function drawCalibrationGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  screen: ScreenConfig,
) {
  ctx.fillStyle = '#0d111a';
  ctx.fillRect(0, 0, width, height);

  // Outer 2.39:1 safe action border
  ctx.strokeStyle = '#e8cf86';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // Subtle geometric grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 1.5;
  const cols = 12;
  const rows = 5;
  for (let c = 1; c < cols; c++) {
    const x = (c / cols) * width;
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x, height - 14);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    const y = (r / rows) * height;
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(width - 14, y);
    ctx.stroke();
  }

  // Center circle & crosshairs
  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, height * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 80, cy);
  ctx.lineTo(cx + 80, cy);
  ctx.moveTo(cx, cy - 80);
  ctx.lineTo(cx, cy + 80);
  ctx.stroke();

  // Corner framing triangles
  ctx.fillStyle = '#e8cf86';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `SEATFIX • ${screen.widthMeters.toFixed(2)}m × ${screen.heightMeters.toFixed(2)}m (2.39:1)`,
    cx,
    cy - height * 0.38,
  );
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '20px monospace';
  ctx.fillText('OPTICAL PERSPECTIVE & DISTORTION REFERENCE CHART', cx, cy + height * 0.42);
}

function drawCinemaFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
) {
  // Rich deep-space horizon cinema frame (subtle, clean, high contrast)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#040714');
  skyGrad.addColorStop(0.55, '#0d1b38');
  skyGrad.addColorStop(0.8, '#2b2038');
  skyGrad.addColorStop(1, '#090a10');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle drifting starfield
  for (let i = 0; i < 64; i++) {
    const sx = ((i * 197 + t * 8) % width);
    const sy = ((i * 89) % (height * 0.68));
    const alpha = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.fillStyle = `rgba(226, 232, 240, ${alpha.toFixed(2)})`;
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Warm golden-amber horizon flare
  const orbX = width * 0.5 + Math.sin(t * 0.18) * 35;
  const orbY = height * 0.58;
  const glow = ctx.createRadialGradient(orbX, orbY, 12, orbX, orbY, height * 0.45);
  glow.addColorStop(0, 'rgba(255, 245, 220, 0.96)');
  glow.addColorStop(0.22, 'rgba(232, 207, 134, 0.52)');
  glow.addColorStop(0.6, 'rgba(180, 125, 45, 0.16)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Anamorphic lens flare streak
  ctx.fillStyle = 'rgba(125, 211, 252, 0.24)';
  ctx.fillRect(0, orbY - 2, width, 4);

  // Silhouette ridge foreground
  ctx.fillStyle = '#070910';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height * 0.78);
  ctx.lineTo(width * 0.22, height * 0.72);
  ctx.lineTo(width * 0.41, height * 0.77);
  ctx.lineTo(width * 0.62, height * 0.69);
  ctx.lineTo(width * 0.85, height * 0.76);
  ctx.lineTo(width, height * 0.73);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Subtle title card
  ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
  ctx.font = '600 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOLARIS HORIZON', width * 0.5, height * 0.46);

  ctx.fillStyle = 'rgba(232, 207, 134, 0.9)';
  ctx.font = '500 14px monospace';
  ctx.fillText('SEATFIX • 2.39:1 ANAMORPHIC PROJECTION PREVIEW', width * 0.5, height * 0.52);
}

export function ScreenSurface({
  screen,
  displayMode,
  graphicsQuality,
  reducedMotion,
}: {
  screen: ScreenConfig;
  displayMode: ScreenDisplayMode;
  graphicsQuality: GraphicsQuality;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lastUpdateRef = useRef(-1);

  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 428;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    canvasRef.current = c;
    textureRef.current = tex;

    if (materialRef.current) {
      materialRef.current.map = tex;
      materialRef.current.emissiveMap = tex;
      materialRef.current.needsUpdate = true;
    }

    return () => {
      tex.dispose();
      textureRef.current = null;
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const texture = textureRef.current;
    if (!canvas || !texture) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (displayMode === 'calibration-grid') {
      drawCalibrationGrid(ctx, canvas.width, canvas.height, screen);
    } else {
      drawCinemaFrame(ctx, canvas.width, canvas.height, 0);
    }
    texture.needsUpdate = true;
    lastUpdateRef.current = -1;
  }, [displayMode, screen]);

  useFrame(({ clock }) => {
    if (displayMode !== 'cinema-loop' || reducedMotion || graphicsQuality === 'low') {
      return;
    }
    const elapsed = clock.getElapsedTime();
    if (elapsed - lastUpdateRef.current < 1 / 20) {
      return;
    }
    lastUpdateRef.current = elapsed;
    const canvas = canvasRef.current;
    const texture = textureRef.current;
    if (!canvas || !texture) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCinemaFrame(ctx, canvas.width, canvas.height, elapsed);
    texture.needsUpdate = true;
  });

  const tiltRad = -(screen.tiltDeg * Math.PI) / 180;
  const bezel = screen.frameThicknessMeters;

  return (
    <group
      position={[screen.center.x, screen.center.y, screen.center.z]}
      rotation={[tiltRad, 0, 0]}
    >
      {/* Velvet matte masking bezel */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry
          args={[
            screen.widthMeters + bezel * 2,
            screen.heightMeters + bezel * 2,
            0.08,
          ]}
        />
        <meshStandardMaterial color="#050608" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Active illuminated screen surface */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[screen.widthMeters, screen.heightMeters]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.85}
          roughness={0.7}
          metalness={0.02}
        />
      </mesh>

      {/* Soft screen spill light illuminating front rows */}
      {graphicsQuality !== 'low' && (
        <pointLight
          position={[0, 0, 2.2]}
          color="#a5c4ff"
          intensity={graphicsQuality === 'high' ? 8.5 : 5.5}
          distance={20}
          decay={1.6}
        />
      )}
    </group>
  );
}
