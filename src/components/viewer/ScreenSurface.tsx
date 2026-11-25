'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GraphicsQuality, ScreenConfig, ScreenDisplayMode } from '@/types/auditorium';

const MOVIE_STILL_SRC = '/movies/odin-force-4k.png';

function drawCalibrationGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  screen: ScreenConfig,
) {
  ctx.fillStyle = '#0d111a';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e8cf86';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 2;
  const cols = 12;
  const rows = 5;
  for (let c = 1; c < cols; c++) {
    const x = (c / cols) * width;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, height - 18);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    const y = (r / rows) * height;
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.lineTo(width - 18, y);
    ctx.stroke();
  }

  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, height * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 120, cy);
  ctx.lineTo(cx + 120, cy);
  ctx.moveTo(cx, cy - 120);
  ctx.lineTo(cx, cy + 120);
  ctx.stroke();

  ctx.fillStyle = '#e8cf86';
  ctx.font = 'bold 46px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `SEATFIX • ${screen.widthMeters.toFixed(2)}m × ${screen.heightMeters.toFixed(2)}m (2.39:1)`,
    cx,
    cy - height * 0.38,
  );
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '32px monospace';
  ctx.fillText('OPTICAL PERSPECTIVE & DISTORTION REFERENCE CHART', cx, cy + height * 0.43);
}

function drawMovieStill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement | null,
) {
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, width, height);

  if (!image || !image.complete || image.naturalWidth === 0) {
    return;
  }

  // Fit width edge-to-edge across the 2.39:1 CinemaScope screen while preserving
  // the central ODIN FORCE subject and lightning cleanly.
  const imgAspect = image.naturalWidth / image.naturalHeight;
  const targetAspect = width / height;

  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (imgAspect < targetAspect) {
    sh = image.naturalWidth / targetAspect;
    sy = (image.naturalHeight - sh) * 0.52;
  } else {
    sw = image.naturalHeight * targetAspect;
    sx = (image.naturalWidth - sw) * 0.5;
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

export function ScreenSurface({
  screen,
  displayMode,
  graphicsQuality,
}: {
  screen: ScreenConfig;
  displayMode: ScreenDisplayMode;
  graphicsQuality: GraphicsQuality;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const movieImageRef = useRef<HTMLImageElement | null>(null);
  const displayModeRef = useRef<ScreenDisplayMode>(displayMode);

  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 858;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;

    canvasRef.current = c;
    textureRef.current = tex;

    if (materialRef.current) {
      materialRef.current.map = tex;
      materialRef.current.emissiveMap = tex;
      materialRef.current.needsUpdate = true;
    }

    const img = new Image();
    img.src = MOVIE_STILL_SRC;
    img.onload = () => {
      movieImageRef.current = img;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      if (displayModeRef.current === 'cinema-loop') {
        drawMovieStill(ctx, c.width, c.height, img);
        tex.needsUpdate = true;
      }
    };
    movieImageRef.current = img;

    return () => {
      tex.dispose();
      textureRef.current = null;
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    displayModeRef.current = displayMode;
    const canvas = canvasRef.current;
    const texture = textureRef.current;
    if (!canvas || !texture) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (displayMode === 'calibration-grid') {
      drawCalibrationGrid(ctx, canvas.width, canvas.height, screen);
    } else {
      drawMovieStill(ctx, canvas.width, canvas.height, movieImageRef.current);
    }
    texture.needsUpdate = true;
  }, [displayMode, screen]);

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

      {/* Active illuminated CinemaScope screen surface */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[screen.widthMeters, screen.heightMeters]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.95}
          roughness={0.75}
          metalness={0.02}
        />
      </mesh>

      {/* Soft neutral screen bounce light */}
      {graphicsQuality !== 'low' && (
        <pointLight
          position={[0, 0, 2.4]}
          color="#e2e8f0"
          intensity={graphicsQuality === 'high' ? 6.5 : 4.2}
          distance={20}
          decay={1.6}
        />
      )}
    </group>
  );
}
