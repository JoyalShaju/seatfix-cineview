'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
}

/**
 * Smooth, delta-time-locked cinema projector intro:
 * - Soft feathered radial overhead projector glow (no harsh polygon edges)
 * - Clean framing border sized proportionally for both 360px phones and desktop
 * - Zero intersecting horizontal line through the wordmark
 * - Gentle floating dust motes & curved stadium-row arcs
 */
export function SeatFixIntro({
  reducedMotion,
  onStartEnter,
  onComplete,
}: {
  reducedMotion: boolean;
  onStartEnter?: () => void;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<'playing' | 'entering' | 'done'>('playing');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const triggeredRef = useRef(false);

  const triggerEnter = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    setPhase('entering');
    onStartEnter?.();
  }, [onStartEnter]);

  useEffect(() => {
    const enterDelayMs = reducedMotion ? 450 : 2650;
    const enterTimer = window.setTimeout(() => {
      triggerEnter();
    }, enterDelayMs);

    return () => window.clearTimeout(enterTimer);
  }, [reducedMotion, triggerEnter]);

  useEffect(() => {
    if (phase !== 'entering') return;
    const finishMs = reducedMotion ? 220 : 780;
    const doneTimer = window.setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, finishMs);
    return () => window.clearTimeout(doneTimer);
  }, [phase, reducedMotion, onComplete]);

  useEffect(() => {
    if (reducedMotion || phase === 'done') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let startTs: number | null = null;
    let lastTs: number | null = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const motes: DustMote[] = Array.from({ length: 40 }, (_, i) => ({
      x: ((i * 137.5) % 100) / 100,
      y: ((i * 73.1) % 100) / 100,
      vx: ((i % 7) - 3) * 0.008,
      vy: -0.006 - (i % 5) * 0.0025,
      r: 0.9 + (i % 3) * 0.6,
      alpha: 0.16 + ((i * 19) % 38) / 100,
      phase: i * 0.7,
    }));

    const renderFrame = (now: number) => {
      if (startTs === null) startTs = now;
      if (lastTs === null) lastTs = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const elapsed = (now - startTs) / 1000;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 640;
      const cx = w * 0.5;
      const cy = h * (isMobile ? 0.43 : 0.45);

      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, w, h);

      const openT = Math.min(1, elapsed / 1.1);
      const easeOpen = 1 - Math.pow(1 - openT, 3);
      const gridT = Math.min(1, Math.max(0, (elapsed - 0.15) / 1.05));
      const easeGrid = 1 - Math.pow(1 - gridT, 3);

      // 1. Soft feathered volumetric projector halo (no sharp triangular clipping edges)
      const haloRadius = Math.max(w, h) * (0.45 + 0.25 * easeOpen);
      const halo = ctx.createRadialGradient(cx, cy * 0.65, 8, cx, cy, haloRadius);
      halo.addColorStop(0, `rgba(244, 223, 160, ${0.18 * easeOpen})`);
      halo.addColorStop(0.32, `rgba(212, 175, 55, ${0.08 * easeOpen})`);
      halo.addColorStop(0.68, `rgba(120, 88, 32, ${0.025 * easeOpen})`);
      halo.addColorStop(1, 'rgba(3, 3, 5, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // 2. Responsive cinema screen frame (always comfortably encloses typography on phones & desktop)
      if (easeGrid > 0.01) {
        const targetW = isMobile ? Math.min(w - 36, 400) : Math.min(w * 0.62, 620);
        const screenW = targetW * (0.86 + 0.14 * easeGrid);
        const screenH = Math.max(screenW / 2.39, isMobile ? 168 : 220) * (0.9 + 0.1 * easeGrid);
        const sx = cx - screenW / 2;
        const sy = cy - screenH / 2;

        // Subtle vanishing perspective lines from screen corners outward (stay clear of center text)
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.12 * easeGrid})`;
        ctx.lineWidth = 1;
        const corners: Array<readonly [number, number, number, number]> = [
          [sx, sy, 0, 0],
          [sx + screenW, sy, w, 0],
          [sx, sy + screenH, 0, h],
          [sx + screenW, sy + screenH, w, h],
        ];
        for (const [ox, oy, tx, ty] of corners) {
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + (tx - ox) * easeGrid, oy + (ty - oy) * easeGrid);
          ctx.stroke();
        }

        // Delicate CinemaScope border frame
        ctx.strokeStyle = `rgba(232, 207, 134, ${0.36 * easeGrid})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, screenW, screenH);

        // Soft vertical projector shimmer inside frame (kept very subtle behind text)
        const sweepX = sx + ((elapsed * 0.45) % 1.4) * screenW - screenW * 0.2;
        const sweepGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
        sweepGrad.addColorStop(0, 'rgba(232, 207, 134, 0)');
        sweepGrad.addColorStop(0.5, `rgba(255, 244, 214, ${0.09 * easeGrid})`);
        sweepGrad.addColorStop(1, 'rgba(232, 207, 134, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(sx, sy, screenW, screenH);

        // Stepped stadium row arcs gracefully below the frame (responsive span)
        const rowCount = isMobile ? 4 : 5;
        const bottomSpace = h * 0.91 - (sy + screenH);
        for (let r = 0; r < rowCount; r++) {
          const depth = (r + 1) / rowCount;
          const rowProgress = Math.min(1, Math.max(0, (elapsed - 0.25 - r * 0.08) / 0.7));
          if (rowProgress <= 0) continue;

          const yBase = sy + screenH + depth * bottomSpace * 0.85;
          const halfSpan = screenW * 0.48 + depth * w * (isMobile ? 0.22 : 0.28);
          const curveDrop = (isMobile ? 10 : 14) + depth * 18;

          ctx.strokeStyle = `rgba(232, 207, 134, ${(0.07 + depth * 0.12) * rowProgress})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - halfSpan * rowProgress, yBase);
          ctx.quadraticCurveTo(
            cx,
            yBase + curveDrop * rowProgress,
            cx + halfSpan * rowProgress,
            yBase,
          );
          ctx.stroke();
        }
      }

      // 3. Delta-time-smooth floating dust motes
      for (const m of motes) {
        m.x = (m.x + m.vx * dt + 1) % 1;
        m.y = (m.y + m.vy * dt + 1) % 1;
        const px = m.x * w;
        const py = m.y * h;
        const radialDist = Math.hypot(px - cx, py - cy) / haloRadius;
        if (radialDist > 0.95) continue;

        const shimmer = 0.6 + 0.4 * Math.sin(elapsed * 2.0 + m.phase);
        const alpha = m.alpha * shimmer * (1 - radialDist) * easeOpen;
        ctx.fillStyle = `rgba(248, 232, 180, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion, phase]);

  if (phase === 'done') return null;

  const isEntering = phase === 'entering';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to SeatFix"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#030305] transition-all will-change-transform ${
        reducedMotion
          ? 'duration-200'
          : 'duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
      } ${
        isEntering
          ? 'pointer-events-none scale-[1.08] opacity-0'
          : 'scale-100 opacity-100'
      }`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Top & Bottom CinemaScope Letterbox Curtains */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 right-0 left-0 h-[6vh] border-b border-[#d4af37]/15 bg-black transition-transform duration-700 ease-out sm:h-[7vh] ${
          isEntering ? '-translate-y-full' : 'translate-y-0'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 bottom-0 left-0 h-[6vh] border-t border-[#d4af37]/15 bg-black transition-transform duration-700 ease-out sm:h-[7vh] ${
          isEntering ? 'translate-y-full' : 'translate-y-0'
        }`}
      />

      {/* Clean Typography Locked to the Exact Center (cy) of the Screen Frame */}
      <div
        className={`absolute top-[43vh] left-1/2 z-10 flex w-[82vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col items-center px-4 text-center transition-all duration-700 sm:top-[45vh] ${
          isEntering ? 'scale-105 opacity-0' : 'animate-seatfix-rise'
        }`}
      >
        <p className="mb-2.5 font-mono text-[9px] tracking-[0.34em] text-[#d4af37]/85 uppercase sm:mb-3 sm:text-[11px] sm:tracking-[0.42em]">
          First-Person Theatre Optics
        </p>

        <h1 className="bg-gradient-to-b from-[#fffdf7] via-[#f4e4b5] to-[#b9923b] bg-clip-text text-3xl font-semibold tracking-[0.22em] text-transparent uppercase sm:text-5xl sm:tracking-[0.28em]">
          SeatFix
        </h1>

        <div
          aria-hidden="true"
          className="mt-3.5 h-[1px] w-20 bg-gradient-to-r from-transparent via-[#e8cf86]/75 to-transparent sm:w-28"
        />

        <p className="mt-3 max-w-[240px] text-[11px] leading-relaxed font-normal tracking-[0.08em] text-stone-300/90 sm:max-w-sm sm:text-sm sm:tracking-[0.12em]">
          Take your seat before the lights dim.
        </p>
      </div>

      {/* Responsive Skip Button (centered near bottom on mobile, right-aligned on desktop) */}
      <button
        type="button"
        onClick={triggerEnter}
        className="absolute bottom-[8.5vh] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-5 py-2 font-mono text-[11px] tracking-[0.18em] text-stone-300 uppercase backdrop-blur-md transition hover:border-[#e8cf86]/60 hover:text-[#f5e6ba] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8cf86] sm:right-8 sm:bottom-[9.5vh] sm:left-auto sm:translate-x-0"
      >
        Skip →
      </button>
    </div>
  );
}
