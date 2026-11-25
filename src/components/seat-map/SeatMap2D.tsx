'use client';

import React from 'react';
import { Accessibility, Armchair, Check, Clock, Eye, Lock } from 'lucide-react';
import { useCineViewStore } from '@/store/useCineViewStore';
import type { SeatSpec } from '@/types/auditorium';

function SeatButton({
  seat,
  isPreviewing,
  isSelected,
  isCompared,
  onPreview,
  onSelect,
  onHover,
}: {
  seat: SeatSpec;
  isPreviewing: boolean;
  isSelected: boolean;
  isCompared: boolean;
  onPreview: () => void;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}) {
  const isAvailable = seat.initialAvailability === 'available';
  const isHeld = seat.initialAvailability === 'held';
  const isBooked = seat.initialAvailability === 'booked';

  let baseStyle =
    'bg-gradient-to-b from-[#2f323a] to-[#1d1f24] border-white/15 text-stone-200 hover:border-[#e8cf86] hover:from-[#3d414b] hover:to-[#272930]';

  if (isBooked) {
    baseStyle = 'bg-[#0b0b0e] border-white/[0.04] text-stone-600 cursor-not-allowed';
  } else if (isHeld) {
    baseStyle = 'bg-[#2a2620] border-[#d4af37]/25 text-stone-300';
  } else if (isSelected) {
    baseStyle =
      'bg-gradient-to-b from-emerald-500/25 to-emerald-900/30 border-emerald-400 text-emerald-100 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.22)]';
  } else if (seat.categoryId === 'recliner') {
    baseStyle =
      'bg-gradient-to-b from-[#54514b] to-[#34322e] border-[#d4af37]/45 text-[#f5efe0] hover:border-[#e8cf86]';
  } else if (seat.categoryId === 'premium') {
    baseStyle =
      'bg-gradient-to-b from-[#3d4048] to-[#26282e] border-white/25 text-stone-100 hover:border-[#e8cf86]';
  } else if (seat.categoryId === 'accessible') {
    baseStyle =
      'bg-gradient-to-b from-[#2c3d3e] to-[#1b2728] border-teal-400/40 text-teal-100 hover:border-[#e8cf86]';
  }

  const previewRing = isPreviewing
    ? 'ring-2 ring-[#e8cf86] ring-offset-2 ring-offset-[#0a0a0d] shadow-[0_0_14px_rgba(212,175,55,0.5)] z-10'
    : '';

  return (
    <button
      type="button"
      onClick={() => {
        onPreview();
        if (isAvailable) {
          onSelect();
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      aria-label={`Seat ${seat.code}, ${seat.categoryId}, ${seat.initialAvailability}${isPreviewing ? ', currently viewing in 3D' : ''}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
      title={`${seat.code} • ${seat.categoryId.toUpperCase()} (${seat.initialAvailability})`}
      className={`relative flex h-7 min-w-0 flex-1 max-w-[30px] items-center justify-center rounded-t-md rounded-b-[4px] border text-[9px] sm:h-7 sm:text-[10px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8cf86] ${baseStyle} ${previewRing}`}
    >
      {isBooked ? (
        <Lock className="h-2.5 w-2.5 opacity-50" aria-hidden="true" />
      ) : isHeld ? (
        <Clock className="h-2.5 w-2.5 opacity-80" aria-hidden="true" />
      ) : isSelected ? (
        <Check className="h-3 w-3 text-emerald-300 stroke-[2.5]" aria-hidden="true" />
      ) : seat.isAccessible ? (
        <Accessibility className="h-3 w-3" aria-hidden="true" />
      ) : seat.categoryId === 'recliner' ? (
        <Armchair className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
      ) : (
        <span className="leading-none">{seat.seatNumber}</span>
      )}

      {isPreviewing && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e8cf86] text-[#050507] shadow"
          aria-hidden="true"
        >
          <Eye className="h-2 w-2 stroke-[2.75]" />
        </span>
      )}

      {isCompared && !isPreviewing && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#d4af37]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export function SeatMap2D({ compact = false }: { compact?: boolean }) {
  const {
    layout,
    activePreviewSeatId,
    selectedSeatIds,
    comparisonSeatIds,
    setActivePreviewSeat,
    toggleSeatSelection,
    setHoveredSeat,
  } = useCineViewStore();

  const seatsByRow = React.useMemo(() => {
    const grouped = new Map<string, SeatSpec[]>();
    for (const row of layout.rows) {
      grouped.set(row.rowLabel, []);
    }
    for (const seat of layout.seats) {
      grouped.get(seat.rowLabel)?.push(seat);
    }
    return grouped;
  }, [layout]);

  return (
    <div className="flex w-full flex-col gap-3.5">
      {/* Screen perspective bar */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <div className="h-[5px] w-4/5 max-w-md rounded-full bg-gradient-to-r from-[#292214] via-[#e8cf86] to-[#292214] shadow-[0_4px_22px_rgba(212,175,55,0.35)]" />
        <span className="text-[10px] font-semibold tracking-[0.22em] text-stone-400 uppercase">
          Screen • {layout.screen.widthMeters}m × {layout.screen.heightMeters}m
        </span>
      </div>

      {/* Responsive full-width seat rows */}
      <div className="mx-auto flex w-full max-w-[540px] flex-col gap-1.5">
        {layout.rows.map((row) => {
          const rowSeats = seatsByRow.get(row.rowLabel) ?? [];
          const leftSeats = rowSeats.filter((s) => s.sectionId === 'left-wing');
          const centerSeats = rowSeats.filter((s) => s.sectionId === 'center-block');
          const rightSeats = rowSeats.filter((s) => s.sectionId === 'right-wing');

          return (
            <div key={row.rowLabel} className="flex w-full items-center gap-1 sm:gap-2">
              <span className="w-3.5 shrink-0 text-right font-mono text-[11px] font-semibold text-stone-500">
                {row.rowLabel}
              </span>

              <div className="flex flex-[3] items-center justify-end gap-[2px] sm:gap-1">
                {leftSeats.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isPreviewing={activePreviewSeatId === seat.id}
                    isSelected={selectedSeatIds.includes(seat.id)}
                    isCompared={comparisonSeatIds.includes(seat.id)}
                    onPreview={() => setActivePreviewSeat(seat.id)}
                    onSelect={() => toggleSeatSelection(seat.id)}
                    onHover={(h) => setHoveredSeat(h ? seat.id : null)}
                  />
                ))}
              </div>

              <div className="w-1.5 shrink-0 sm:w-3" aria-hidden="true" />

              <div className="flex flex-[8] items-center justify-center gap-[2px] sm:gap-1">
                {centerSeats.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isPreviewing={activePreviewSeatId === seat.id}
                    isSelected={selectedSeatIds.includes(seat.id)}
                    isCompared={comparisonSeatIds.includes(seat.id)}
                    onPreview={() => setActivePreviewSeat(seat.id)}
                    onSelect={() => toggleSeatSelection(seat.id)}
                    onHover={(h) => setHoveredSeat(h ? seat.id : null)}
                  />
                ))}
              </div>

              <div className="w-1.5 shrink-0 sm:w-3" aria-hidden="true" />

              <div className="flex flex-[3] items-center justify-start gap-[2px] sm:gap-1">
                {rightSeats.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isPreviewing={activePreviewSeatId === seat.id}
                    isSelected={selectedSeatIds.includes(seat.id)}
                    isCompared={comparisonSeatIds.includes(seat.id)}
                    onPreview={() => setActivePreviewSeat(seat.id)}
                    onSelect={() => toggleSeatSelection(seat.id)}
                    onHover={(h) => setHoveredSeat(h ? seat.id : null)}
                  />
                ))}
              </div>

              <span className="w-3.5 shrink-0 text-left font-mono text-[11px] font-semibold text-stone-500">
                {row.rowLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className={`flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 border-t border-[#d4af37]/15 pt-3 text-[11px] text-stone-400 ${
          compact ? 'text-[10px]' : ''
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e8cf86] text-[#050507]">
            <Eye className="h-2 w-2 stroke-[2.75]" />
          </span>
          3D Eye
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded border border-emerald-400 bg-emerald-500/20 text-emerald-300">
            <Check className="h-2.5 w-2.5" />
          </span>
          Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-white/25 bg-[#3d4048]" />
          Prime PXL
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Armchair className="h-3.5 w-3.5 text-[#e8cf86]" />
          LUXE Sofa
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Accessibility className="h-3.5 w-3.5 text-teal-300" />
          Accessible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-purple-300" />
          Held
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-stone-500" />
          Booked
        </span>
      </div>
    </div>
  );
}
