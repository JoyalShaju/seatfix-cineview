import { describe, expect, it, beforeEach } from 'vitest';
import { GRAND_LUMINA_SCREEN_1 } from '@/lib/auditorium/grand-lumina';
import { recommendSeats } from '@/lib/recommendations/recommender';
import { useCineViewStore } from '@/store/useCineViewStore';

describe('Zustand Store Synchronization & Seat Recommender', () => {
  beforeEach(() => {
    useCineViewStore.setState({
      visualizationMode: 'first-person',
      activePreviewSeatId: 'gl-s1-H7',
      selectedSeatIds: ['gl-s1-H7'],
      comparisonSeatIds: ['gl-s1-H7'],
      headYawOffsetRad: 0.4,
      headPitchOffsetRad: 0.2,
    });
  });

  it('resets head look offsets when jumping to a new seat by code', () => {
    useCineViewStore.getState().setActivePreviewSeatByCode('A6');
    const state = useCineViewStore.getState();
    expect(state.activePreviewSeatId).toBe('gl-s1-A6');
    expect(state.headYawOffsetRad).toBe(0);
    expect(state.headPitchOffsetRad).toBe(0);
  });

  it('caps seat comparison tray at 3 seats', () => {
    const store = useCineViewStore.getState();
    store.toggleComparisonSeat('gl-s1-A6');
    store.toggleComparisonSeat('gl-s1-J4');
    store.toggleComparisonSeat('gl-s1-B1');
    const compared = useCineViewStore.getState().comparisonSeatIds;
    expect(compared).toHaveLength(3);
    expect(compared).toEqual(['gl-s1-A6', 'gl-s1-J4', 'gl-s1-B1']);
  });

  it('does not allow selecting a booked seat into the booking cart', () => {
    const booked = GRAND_LUMINA_SCREEN_1.seats.find(
      (s) => s.initialAvailability === 'booked',
    )!;
    useCineViewStore.getState().toggleSeatSelection(booked.id);
    expect(useCineViewStore.getState().selectedSeatIds).not.toContain(booked.id);
  });

  it('recommends valid available seats matching requested preference presets', () => {
    const best = recommendSeats(GRAND_LUMINA_SCREEN_1, 'best-overall', 1.15, 3);
    const recliners = recommendSeats(GRAND_LUMINA_SCREEN_1, 'recliner', 1.15, 3);
    const aisle = recommendSeats(GRAND_LUMINA_SCREEN_1, 'near-aisle', 1.15, 3);

    expect(best).toHaveLength(3);
    expect(best.every((r) => r.seat.initialAvailability === 'available')).toBe(true);
    expect(recliners.every((r) => r.seat.categoryId === 'recliner')).toBe(true);
    expect(aisle.every((r) => r.seat.isAisleAdjacent)).toBe(true);
  });
});
