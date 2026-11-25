'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Armchair,
  Box,
  Compass,
  Crosshair,
  Eye,
  Grid2x2,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Ticket,
} from 'lucide-react';
import { CameraControlsPanel } from '@/components/hud/CameraControlsPanel';
import { ComparisonTray } from '@/components/hud/ComparisonTray';
import { RecommendationBar } from '@/components/hud/RecommendationBar';
import { ViewingTelemetryPanel } from '@/components/hud/ViewingTelemetryPanel';
import { SeatFixIntro } from '@/components/intro/SeatFixIntro';
import { SeatMap2D } from '@/components/seat-map/SeatMap2D';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';
import type { VisualizationMode } from '@/types/auditorium';

const AuditoriumCanvas = dynamic(
  () => import('@/components/viewer/AuditoriumCanvas').then((m) => m.AuditoriumCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#040406] text-sm text-stone-400">
        Loading 3D Auditorium...
      </div>
    ),
  },
);

const DEMO_VANTAGE_SEATS = [
  { code: 'A6', label: 'A6 Front' },
  { code: 'E5', label: 'E5 Mid' },
  { code: 'H7', label: 'H7 Prime' },
  { code: 'J6', label: 'J6 Recliner' },
  { code: 'B1', label: 'B1 Corner' },
];

type InspectorTab = 'seats' | 'specs' | 'compare';

export function CineViewExperience() {
  const {
    layout,
    activePreviewSeatId,
    hoveredSeatId,
    selectedSeatIds,
    comparisonSeatIds,
    visualizationMode,
    lookAtScreenCenter,
    headYawOffsetRad,
    screenDisplayMode,
    reducedMotion,
    setActivePreviewSeatByCode,
    setVisualizationMode,
    setLookAtScreenCenter,
    setHeadLookOffsets,
    resetCameraView,
    setScreenDisplayMode,
    setReducedMotion,
    clearSelectedSeats,
  } = useCineViewStore();

  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>('seats');
  const [introFinished, setIntroFinished] = useState(false);
  const [mount3DScene, setMount3DScene] = useState(false);

  // Defer WebGL shader & geometry initialization briefly so the intro animation runs jitter-free
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMount3DScene(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
    }
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [setReducedMotion]);

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    if (!document.fullscreenElement) {
      await stageRef.current.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const activeSeat = findSeatById(layout, activePreviewSeatId);
  const activeCat = layout.categories[activeSeat.categoryId];
  const hoveredSeat = hoveredSeatId ? findSeatById(layout, hoveredSeatId) : null;

  const selectedSeats = selectedSeatIds.map((id) => findSeatById(layout, id));
  const totalMinor = selectedSeats.reduce(
    (sum, s) => sum + layout.categories[s.categoryId].priceMinor,
    0,
  );

  const modes: Array<{
    id: VisualizationMode;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'first-person',
      label: 'First-Person',
      shortLabel: 'Eye View',
      icon: <Eye className="h-3.5 w-3.5" />,
    },
    {
      id: '3d-overview',
      label: '3D Hall',
      shortLabel: '3D Hall',
      icon: <Box className="h-3.5 w-3.5" />,
    },
    {
      id: '2d-map',
      label: '2D Map',
      shortLabel: '2D Map',
      icon: <MapIcon className="h-3.5 w-3.5" />,
    },
  ];

  const isLookingBehind = Math.abs(Math.abs(headYawOffsetRad) - Math.PI) < 0.35;

  return (
    <div className="relative flex min-h-screen flex-col text-[#f5f3ee]">
      <SeatFixIntro
        reducedMotion={reducedMotion}
        onComplete={() => setIntroFinished(true)}
      />

      {/* Sleek Luxury Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#d4af37]/15 bg-[#070709]/92 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-gradient-to-br from-[#2b2212] to-[#0a0908] text-[#e8cf86] shadow-[0_0_20px_rgba(212,175,55,0.16)]">
              <Armchair className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate bg-gradient-to-r from-[#fffdf7] to-[#e8cf86] bg-clip-text text-sm font-bold tracking-tight text-transparent sm:text-base">
                  SeatFix
                </span>
                <span className="shrink-0 rounded-md border border-[#d4af37]/30 bg-[#d4af37]/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#e8cf86]">
                  {layout.calibrationStatus === 'SIMULATED' ? 'SIMULATED' : 'CALIBRATED'}
                </span>
              </div>
              <p className="truncate text-xs text-stone-400">
                {layout.cinemaName} • {layout.auditoriumName} •{' '}
                <span className="text-stone-200">Solaris Horizon</span>
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Visualization modes"
            className="flex shrink-0 items-center rounded-xl border border-white/10 bg-[#0d0d11] p-1"
          >
            {modes.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={visualizationMode === m.id}
                type="button"
                onClick={() => setVisualizationMode(m.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  visualizationMode === m.id
                    ? 'bg-gradient-to-r from-[#e8cf86] to-[#c9a349] font-semibold text-[#050507] shadow-sm'
                    : 'text-stone-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {m.icon}
                <span className="hidden md:inline">{m.label}</span>
                <span className="sr-only md:hidden">{m.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-4 px-3 py-3 transition-all duration-700 sm:px-5 sm:py-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5 ${
          introFinished ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-95'
        }`}
      >
        {/* Left/Top Stage: 3D Cinema Viewport */}
        <section ref={stageRef} className="flex flex-col gap-3 lg:col-span-7 xl:col-span-8">
          <div className="relative h-[40vh] min-h-[260px] w-full overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#040406] shadow-[0_20px_60px_rgba(0,0,0,0.85)] sm:h-[48vh] lg:h-[calc(100vh-14.5rem)] lg:min-h-[500px]">
            {visualizationMode === '2d-map' ? (
              <div className="flex h-full w-full flex-col justify-center overflow-auto bg-[#09090c] p-4 sm:p-8">
                <SeatMap2D />
              </div>
            ) : mount3DScene ? (
              <AuditoriumCanvas />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#040406]" />
            )}

            {/* Minimal Top Overlay */}
            <div className="pointer-events-none absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
              <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[#d4af37]/25 bg-[#08080a]/82 px-3 py-1.5 backdrop-blur-md">
                <span className="rounded bg-gradient-to-r from-[#e8cf86] to-[#c9a349] px-1.5 py-0.5 font-mono text-xs font-bold text-[#050507]">
                  {activeSeat.code}
                </span>
                <span className="text-xs font-medium text-stone-100">{activeCat.label}</span>
                {hoveredSeat && hoveredSeat.id !== activeSeat.id && (
                  <span className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#f3e1a9] sm:inline">
                    Hover {hoveredSeat.code}
                  </span>
                )}
              </div>

              <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#08080a]/82 p-1 backdrop-blur-md">
                {visualizationMode !== '2d-map' && (
                  <button
                    type="button"
                    onClick={resetCameraView}
                    aria-label="Reset camera view"
                    title="Reset camera view"
                    className="rounded-lg p-1.5 text-stone-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  className="rounded-lg p-1.5 text-stone-300 transition hover:bg-white/10 hover:text-white"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {visualizationMode !== '2d-map' && (
              <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-white/10 bg-[#08080a]/78 px-2.5 py-1 text-[11px] text-stone-300 backdrop-blur-sm sm:block">
                {visualizationMode === 'first-person'
                  ? 'Drag 360° to look around (including behind) • Click any seat to move'
                  : 'Drag to orbit • Scroll to zoom • Click any seat to sit'}
              </div>
            )}
          </div>

          {/* Sleek Quick Jump & View Controls Strip */}
          <div className="no-scrollbar flex items-center justify-between gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0d0d11] px-3 py-2">
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="mr-1 hidden text-[11px] font-medium text-stone-500 sm:inline">
                Quick Jump:
              </span>
              {DEMO_VANTAGE_SEATS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => setActivePreviewSeatByCode(preset.code)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    activeSeat.code === preset.code
                      ? 'bg-gradient-to-r from-[#e8cf86] to-[#c9a349] font-semibold text-[#050507]'
                      : 'bg-white/[0.05] text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 border-l border-white/10 pl-2.5">
              <button
                type="button"
                onClick={() => {
                  if (visualizationMode !== 'first-person') {
                    setVisualizationMode('first-person');
                  }
                  if (isLookingBehind) {
                    setHeadLookOffsets(0, 0);
                  } else {
                    setLookAtScreenCenter(false);
                    setHeadLookOffsets(Math.PI, 0.06);
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  isLookingBehind
                    ? 'bg-[#d4af37]/20 text-[#f3e1a9] ring-1 ring-[#d4af37]/50'
                    : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isLookingBehind ? 'Look Front' : 'Look Behind'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLookAtScreenCenter(!lookAtScreenCenter)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  lookAtScreenCenter
                    ? 'bg-[#d4af37]/20 text-[#f3e1a9] ring-1 ring-[#d4af37]/50'
                    : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>{lookAtScreenCenter ? 'Centered Aim' : 'Natural Forward'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setScreenDisplayMode(
                    screenDisplayMode === 'cinema-loop' ? 'calibration-grid' : 'cinema-loop',
                  )
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-stone-300 transition hover:bg-white/10"
              >
                <Grid2x2 className="h-3.5 w-3.5 text-[#e8cf86]" />
                <span>{screenDisplayMode === 'cinema-loop' ? 'Aspect Grid' : 'Film'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right/Bottom Tabbed Inspector */}
        <aside className="flex flex-col gap-3 lg:col-span-5 xl:col-span-4">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#121217] to-[#0a0a0d]">
            <div className="grid grid-cols-3 border-b border-white/10 bg-[#08080b] p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('seats')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
                  activeTab === 'seats'
                    ? 'bg-[#1a1814] text-[#f5f3ee] shadow-sm ring-1 ring-[#d4af37]/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5 text-[#e8cf86]" />
                <span>Seats</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
                  activeTab === 'specs'
                    ? 'bg-[#1a1814] text-[#f5f3ee] shadow-sm ring-1 ring-[#d4af37]/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-[#e8cf86]" />
                <span>View &amp; Optics</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compare')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
                  activeTab === 'compare'
                    ? 'bg-[#1a1814] text-[#f5f3ee] shadow-sm ring-1 ring-[#d4af37]/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-[#e8cf86]" />
                <span>Find ({comparisonSeatIds.length})</span>
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'seats' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold tracking-wide text-stone-200 uppercase">
                      Select a Seat to Sit in 3D
                    </h2>
                    <span className="text-[11px] text-stone-400">Row A Front → J Rear</span>
                  </div>
                  <SeatMap2D compact />
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="flex flex-col gap-4">
                  <ViewingTelemetryPanel />
                  <CameraControlsPanel />
                </div>
              )}

              {activeTab === 'compare' && (
                <div className="flex flex-col gap-5">
                  <RecommendationBar />
                  <ComparisonTray />
                </div>
              )}
            </div>
          </div>

          {/* Selection Summary Card */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/25 bg-gradient-to-r from-[#16130d] to-[#0a0a0c] px-4 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 shrink-0 text-[#e8cf86]" />
                <span className="text-xs font-semibold tracking-wide text-[#e8cf86] uppercase">
                  {selectedSeats.length}{' '}
                  {selectedSeats.length === 1 ? 'Seat Selected' : 'Seats Selected'}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-sm font-semibold text-white">
                {selectedSeats.length > 0
                  ? selectedSeats.map((s) => s.code).join(', ')
                  : 'Tap an available seat'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <div className="text-right">
                <div className="text-[11px] text-stone-400">Subtotal</div>
                <div className="font-mono text-base font-bold text-white">
                  ${(totalMinor / 100).toFixed(2)}
                </div>
              </div>
              {selectedSeats.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelectedSeats}
                  className="rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/10 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
