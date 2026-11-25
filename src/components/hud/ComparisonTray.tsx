'use client';

import React from 'react';
import { Eye, Scale, X } from 'lucide-react';
import { estimateScreenObstruction } from '@/lib/geometry/obstruction';
import { calculateViewingMetrics } from '@/lib/geometry/viewing-metrics';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';

export function ComparisonTray() {
  const {
    layout,
    comparisonSeatIds,
    activePreviewSeatId,
    eyeHeightMeters,
    audienceSimulationEnabled,
    assumedAudienceHeightMeters,
    setActivePreviewSeat,
    removeComparisonSeat,
  } = useCineViewStore();

  const items = React.useMemo(
    () =>
      comparisonSeatIds.map((id) => {
        const seat = findSeatById(layout, id);
        const cat = layout.categories[seat.categoryId];
        const metrics = calculateViewingMetrics(
          seat,
          cat,
          layout.screen,
          layout.dimensions,
          eyeHeightMeters,
          layout.cameraVerticalFovDeg,
        );
        const obstruction = estimateScreenObstruction(seat, layout, eyeHeightMeters, {
          audienceSimulationEnabled,
          assumedAudienceHeightMeters,
        });
        return { seat, cat, metrics, obstruction };
      }),
    [
      comparisonSeatIds,
      layout,
      eyeHeightMeters,
      audienceSimulationEnabled,
      assumedAudienceHeightMeters,
    ],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-stone-200 uppercase">
          <Scale className="h-3.5 w-3.5 text-[#e8cf86]" />
          <span>Side-by-Side Comparison ({items.length}/3)</span>
        </div>
        <span className="text-[11px] text-stone-500">
          Same {layout.cameraVerticalFovDeg}° lens
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#08080b] p-5 text-center text-xs text-stone-400">
          Tap <span className="font-medium text-stone-200">Compare</span> in View &amp; Specs
          to pin up to 3 seats side by side.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {items.map(({ seat, cat, metrics, obstruction }) => {
            const isCurrent = seat.id === activePreviewSeatId;
            return (
              <div
                key={seat.id}
                className={`flex flex-col justify-between rounded-xl border p-3 transition ${
                  isCurrent
                    ? 'border-[#d4af37]/60 bg-[#d4af37]/[0.08]'
                    : 'border-white/[0.08] bg-[#08080b]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-white">
                      {seat.code}
                    </span>
                    <span className="ml-2 text-[11px] text-stone-400">
                      ${(cat.priceMinor / 100).toFixed(0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeComparisonSeat(seat.id)}
                    aria-label={`Remove ${seat.code} from comparison`}
                    className="rounded-md p-1 text-stone-500 hover:bg-white/10 hover:text-stone-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 text-xs text-stone-400">
                  <div className="flex justify-between">
                    <span>Distance</span>
                    <span className="font-mono text-stone-100">
                      {metrics.distanceToScreenCenterMeters.toFixed(1)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>H-Angle</span>
                    <span className="font-mono text-stone-100">
                      {metrics.horizontalViewingAngleDeg >= 0 ? '+' : ''}
                      {metrics.horizontalViewingAngleDeg.toFixed(1)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Screen Span</span>
                    <span className="font-mono text-[#e8cf86]">
                      {metrics.horizontalScreenCoverageDeg.toFixed(1)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visibility</span>
                    <span className="font-mono text-emerald-300">
                      {obstruction.estimatedVisibilityPercent}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePreviewSeat(seat.id)}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#e8cf86] to-[#c9a349] font-semibold text-[#050507]'
                      : 'bg-white/[0.08] text-stone-200 hover:bg-white/[0.14]'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isCurrent ? 'Viewing Now' : 'Sit Here'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
