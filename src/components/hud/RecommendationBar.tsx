'use client';

import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import {
  recommendSeats,
  type RecommendationPreset,
} from '@/lib/recommendations/recommender';
import { useCineViewStore } from '@/store/useCineViewStore';

const PRESETS: Array<{ id: RecommendationPreset; label: string }> = [
  { id: 'best-overall', label: 'Best Overall' },
  { id: 'most-centered', label: 'Centered' },
  { id: 'recliner', label: 'LUXE Sofa' },
  { id: 'near-aisle', label: 'Near Aisle' },
  { id: 'closest', label: 'Closest' },
  { id: 'farthest', label: 'Farthest' },
];

export function RecommendationBar() {
  const { layout, eyeHeightMeters, activePreviewSeatId, setActivePreviewSeat } =
    useCineViewStore();
  const [preset, setPreset] = useState<RecommendationPreset>('best-overall');

  const results = React.useMemo(
    () => recommendSeats(layout, preset, eyeHeightMeters, 3),
    [layout, preset, eyeHeightMeters],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-stone-200 uppercase">
          <Compass className="h-3.5 w-3.5 text-[#e8cf86]" />
          <span>Seat Finder</span>
        </div>
        <span className="text-[11px] text-stone-500">Rule-based geometry</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              preset === p.id
                ? 'bg-[#d4af37]/20 text-[#f3e1a9] ring-1 ring-[#d4af37]/55'
                : 'bg-white/[0.04] text-stone-300 hover:bg-white/[0.09] hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {results.map((item) => {
          const isCurrent = item.seat.id === activePreviewSeatId;
          return (
            <button
              key={item.seat.id}
              type="button"
              onClick={() => setActivePreviewSeat(item.seat.id)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                isCurrent
                  ? 'border-[#d4af37]/60 bg-[#d4af37]/10'
                  : 'border-white/[0.07] bg-[#08080b] hover:border-white/20'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#e8cf86]">
                    {item.seat.code}
                  </span>
                  <span className="truncate text-xs font-medium text-stone-200">
                    {layout.categories[item.seat.categoryId].label}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-stone-400">{item.reason}</p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-stone-200">
                ${(layout.categories[item.seat.categoryId].priceMinor / 100).toFixed(0)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
