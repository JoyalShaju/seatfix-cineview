'use client';

import React from 'react';
import { Eye, Gauge, Scale, ShieldAlert, Users } from 'lucide-react';
import { estimateScreenObstruction } from '@/lib/geometry/obstruction';
import { calculateViewingMetrics } from '@/lib/geometry/viewing-metrics';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';

export function ViewingTelemetryPanel() {
  const {
    layout,
    activePreviewSeatId,
    eyeHeightMeters,
    audienceSimulationEnabled,
    assumedAudienceHeightMeters,
    comparisonSeatIds,
    setAudienceSimulationEnabled,
    setAssumedAudienceHeightMeters,
    toggleComparisonSeat,
  } = useCineViewStore();

  const seat = findSeatById(layout, activePreviewSeatId);
  const category = layout.categories[seat.categoryId];

  const metrics = React.useMemo(
    () =>
      calculateViewingMetrics(
        seat,
        category,
        layout.screen,
        layout.dimensions,
        eyeHeightMeters,
        layout.cameraVerticalFovDeg,
      ),
    [seat, category, layout, eyeHeightMeters],
  );

  const obstruction = React.useMemo(
    () =>
      estimateScreenObstruction(seat, layout, eyeHeightMeters, {
        audienceSimulationEnabled,
        assumedAudienceHeightMeters,
      }),
    [seat, layout, eyeHeightMeters, audienceSimulationEnabled, assumedAudienceHeightMeters],
  );

  const isCompared = comparisonSeatIds.includes(seat.id);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d4af37]/20 bg-gradient-to-r from-[#1a1610] to-[#0e0d0c] p-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-gradient-to-r from-[#e8cf86] to-[#c9a349] px-2 py-0.5 font-mono text-sm font-bold text-[#050507]">
              {seat.code}
            </span>
            <span className="text-sm font-semibold text-[#f5f3ee]">{category.label}</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            ${(category.priceMinor / 100).toFixed(2)} • Eye at{' '}
            <span className="font-mono text-stone-200">
              {metrics.eyePosition.y.toFixed(2)}m
            </span>{' '}
            elevation
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleComparisonSeat(seat.id)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isCompared
              ? 'border-[#d4af37]/55 bg-[#d4af37]/15 text-[#f3e1a9]'
              : 'border-white/15 bg-white/[0.04] text-stone-200 hover:border-[#d4af37]/45 hover:bg-white/[0.08]'
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          {isCompared ? 'Compared' : 'Compare'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-[#08080b] p-3">
          <div className="text-xs text-stone-400">Distance to Screen</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-white tabular-nums">
            {metrics.distanceToScreenCenterMeters.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-stone-400">m</span>
          </div>
          <div className="mt-0.5 text-[11px] text-stone-500">
            {Math.abs(metrics.horizontalOffsetMeters) < 0.4
              ? 'Dead center axis'
              : `${Math.abs(metrics.horizontalOffsetMeters).toFixed(1)}m ${
                  metrics.horizontalOffsetMeters > 0 ? 'right' : 'left'
                } of center`}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#08080b] p-3">
          <div className="text-xs text-stone-400">Screen Angular Size</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-[#e8cf86] tabular-nums">
            {metrics.horizontalScreenCoverageDeg.toFixed(0)}°
            <span className="mx-1 text-sm text-stone-500">×</span>
            {metrics.verticalScreenCoverageDeg.toFixed(0)}°
          </div>
          <div className="mt-0.5 text-[11px] text-stone-500">
            Camera lens min 88° H / {layout.cameraVerticalFovDeg}° V base
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#08080b] p-3">
          <div className="text-xs text-stone-400">Horizontal Angle</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-white tabular-nums">
            {metrics.horizontalViewingAngleDeg >= 0 ? '+' : ''}
            {metrics.horizontalViewingAngleDeg.toFixed(1)}°
          </div>
          <div className="mt-0.5 text-[11px] text-stone-500">
            {Math.abs(metrics.horizontalViewingAngleDeg) <= 10
              ? 'Minimal side skew'
              : Math.abs(metrics.horizontalViewingAngleDeg) <= 25
                ? 'Gentle off-axis angle'
                : 'Steep side perspective'}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#08080b] p-3">
          <div className="text-xs text-stone-400">Vertical Gaze</div>
          <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-white tabular-nums">
            {metrics.verticalViewingAngleDeg >= 0 ? '+' : ''}
            {metrics.verticalViewingAngleDeg.toFixed(1)}°
          </div>
          <div className="mt-0.5 text-[11px] text-stone-500">
            Top edge tilt {metrics.verticalTopEdgeAngleDeg.toFixed(1)}°
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#08080b] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-stone-100">
            <Eye className="h-4 w-4 text-emerald-400" />
            <span>{obstruction.estimatedVisibilityPercent}% Clear Screen</span>
          </div>
          <span className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-stone-400">
            {obstruction.unblockedCount}/{obstruction.sampleCount} rays
          </span>
        </div>

        {obstruction.detectedBlockerKinds.length > 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1.5 text-xs text-[#f3e1a9]">
            <ShieldAlert className="h-4 w-4 shrink-0 text-[#e8cf86]" />
            <span>
              Estimated interference: {obstruction.detectedBlockerKinds.join(', ')}
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2.5 border-t border-white/[0.07] pt-3">
          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs font-medium text-stone-300">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-[#e8cf86]" />
              Simulate seated audience ahead
            </span>
            <input
              type="checkbox"
              checked={audienceSimulationEnabled}
              onChange={(e) => setAudienceSimulationEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-[#d4af37]"
            />
          </label>

          {audienceSimulationEnabled && (
            <label className="flex items-center justify-between gap-3 text-xs text-stone-400">
              <span>Patron height: {assumedAudienceHeightMeters.toFixed(2)}m</span>
              <input
                type="range"
                min={1.02}
                max={1.34}
                step={0.02}
                value={assumedAudienceHeightMeters}
                onChange={(e) => setAssumedAudienceHeightMeters(Number(e.target.value))}
                className="w-32 accent-[#d4af37]"
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#d4af37]/15 bg-[#12100c] px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-xs text-stone-300">
          <Gauge className="h-4 w-4 text-[#e8cf86]" />
          <span>{metrics.suitabilityLabel}</span>
        </div>
        <span className="font-mono text-sm font-bold text-[#e8cf86]">
          {metrics.suitabilityEstimateScore}/100
        </span>
      </div>
    </div>
  );
}
