'use client';

import React from 'react';
import { Crosshair, Grid2x2, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCineViewStore } from '@/store/useCineViewStore';
import type { GraphicsQuality } from '@/types/auditorium';

export function CameraControlsPanel() {
  const {
    lookAtScreenCenter,
    eyeHeightMeters,
    screenDisplayMode,
    graphicsQuality,
    reducedMotion,
    setLookAtScreenCenter,
    setEyeHeightMeters,
    resetCameraView,
    setScreenDisplayMode,
    setGraphicsQuality,
    setReducedMotion,
  } = useCineViewStore();

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-white/[0.08] bg-[#08080b] p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-stone-200 uppercase">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#e8cf86]" />
          <span>Camera &amp; Optics</span>
        </div>
        <button
          type="button"
          onClick={resetCameraView}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-300 hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setLookAtScreenCenter(false)}
          className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
            !lookAtScreenCenter
              ? 'border-[#d4af37]/55 bg-[#d4af37]/15 text-[#f3e1a9]'
              : 'border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/[0.07]'
          }`}
        >
          Natural Seat Forward
        </button>
        <button
          type="button"
          onClick={() => setLookAtScreenCenter(true)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
            lookAtScreenCenter
              ? 'border-[#d4af37]/55 bg-[#d4af37]/15 text-[#f3e1a9]'
              : 'border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/[0.07]'
          }`}
        >
          <Crosshair className="h-3.5 w-3.5" />
          Center Screen
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-xs text-stone-300">
        <div className="flex items-center justify-between">
          <span>Seated Eye Height</span>
          <span className="font-mono font-semibold text-[#e8cf86]">
            {eyeHeightMeters.toFixed(2)} m
          </span>
        </div>
        <input
          type="range"
          min={0.95}
          max={1.35}
          step={0.01}
          value={eyeHeightMeters}
          onChange={(e) => setEyeHeightMeters(Number(e.target.value))}
          aria-label="Seated eye height in meters"
          className="w-full accent-[#d4af37]"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
        <button
          type="button"
          onClick={() =>
            setScreenDisplayMode(
              screenDisplayMode === 'cinema-loop' ? 'calibration-grid' : 'cinema-loop',
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-stone-200 hover:bg-white/[0.09]"
        >
          <Grid2x2 className="h-3.5 w-3.5 text-[#e8cf86]" />
          {screenDisplayMode === 'cinema-loop' ? 'Aspect Grid' : 'Film Preview'}
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <Sparkles className="mx-1.5 h-3 w-3 text-[#e8cf86]" />
          {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setGraphicsQuality(q)}
              className={`rounded-md px-2 py-1 text-[11px] capitalize transition ${
                graphicsQuality === q
                  ? 'bg-[#d4af37]/25 font-semibold text-[#f5e6ba]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between text-xs text-stone-300">
        <span>Reduced motion (instant seat cuts)</span>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
          className="h-4 w-4 rounded accent-[#d4af37]"
        />
      </label>
    </div>
  );
}
