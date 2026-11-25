import { create } from 'zustand';
import { GRAND_LUMINA_SCREEN_1 } from '@/lib/auditorium/grand-lumina';
import type {
  AuditoriumLayoutConfig,
  GraphicsQuality,
  ScreenDisplayMode,
  SeatSpec,
  VisualizationMode,
} from '@/types/auditorium';

export interface CineViewState {
  layout: AuditoriumLayoutConfig;
  activePreviewSeatId: string;
  hoveredSeatId: string | null;
  selectedSeatIds: string[];
  comparisonSeatIds: string[];
  visualizationMode: VisualizationMode;
  lookAtScreenCenter: boolean;
  eyeHeightMeters: number;
  headYawOffsetRad: number;
  headPitchOffsetRad: number;
  audienceSimulationEnabled: boolean;
  assumedAudienceHeightMeters: number;
  screenDisplayMode: ScreenDisplayMode;
  graphicsQuality: GraphicsQuality;
  reducedMotion: boolean;
  cameraResetNonce: number;

  setActivePreviewSeat: (seatId: string) => void;
  setActivePreviewSeatByCode: (code: string) => void;
  setHoveredSeat: (seatId: string | null) => void;
  toggleSeatSelection: (seatId: string) => void;
  clearSelectedSeats: () => void;
  toggleComparisonSeat: (seatId: string) => void;
  removeComparisonSeat: (seatId: string) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setLookAtScreenCenter: (value: boolean) => void;
  setEyeHeightMeters: (meters: number) => void;
  setHeadLookOffsets: (yawRad: number, pitchRad: number) => void;
  resetCameraView: () => void;
  setAudienceSimulationEnabled: (enabled: boolean) => void;
  setAssumedAudienceHeightMeters: (meters: number) => void;
  setScreenDisplayMode: (mode: ScreenDisplayMode) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setReducedMotion: (reduced: boolean) => void;
}

const DEFAULT_SEAT_ID =
  GRAND_LUMINA_SCREEN_1.seats.find((s) => s.code === 'H7')?.id ??
  GRAND_LUMINA_SCREEN_1.seats[0]!.id;

export function findSeatById(layout: AuditoriumLayoutConfig, seatId: string): SeatSpec {
  return layout.seats.find((s) => s.id === seatId) ?? layout.seats[0]!;
}

export const useCineViewStore = create<CineViewState>((set, get) => ({
  layout: GRAND_LUMINA_SCREEN_1,
  activePreviewSeatId: DEFAULT_SEAT_ID,
  hoveredSeatId: null,
  selectedSeatIds: [DEFAULT_SEAT_ID],
  comparisonSeatIds: [
    DEFAULT_SEAT_ID,
    GRAND_LUMINA_SCREEN_1.seats.find((s) => s.code === 'A6')?.id ?? DEFAULT_SEAT_ID,
    GRAND_LUMINA_SCREEN_1.seats.find((s) => s.code === 'J4')?.id ?? DEFAULT_SEAT_ID,
  ],
  visualizationMode: 'first-person',
  lookAtScreenCenter: false,
  eyeHeightMeters: GRAND_LUMINA_SCREEN_1.defaultEyeHeightMeters,
  headYawOffsetRad: 0,
  headPitchOffsetRad: 0,
  audienceSimulationEnabled: false,
  assumedAudienceHeightMeters: 1.18,
  screenDisplayMode: 'cinema-loop',
  graphicsQuality: 'medium',
  reducedMotion: false,
  cameraResetNonce: 0,

  setActivePreviewSeat: (seatId) =>
    set((state) => ({
      activePreviewSeatId: seatId,
      headYawOffsetRad: 0,
      headPitchOffsetRad: 0,
      visualizationMode:
        state.visualizationMode === '2d-map' ? '2d-map' : 'first-person',
    })),

  setActivePreviewSeatByCode: (code) => {
    const { layout } = get();
    const found = layout.seats.find((s) => s.code.toUpperCase() === code.toUpperCase());
    if (found) {
      get().setActivePreviewSeat(found.id);
    }
  },

  setHoveredSeat: (seatId) => set({ hoveredSeatId: seatId }),

  toggleSeatSelection: (seatId) =>
    set((state) => {
      const seat = findSeatById(state.layout, seatId);
      if (seat.initialAvailability !== 'available') {
        return state;
      }
      const exists = state.selectedSeatIds.includes(seatId);
      if (exists) {
        return { selectedSeatIds: state.selectedSeatIds.filter((id) => id !== seatId) };
      }
      if (state.selectedSeatIds.length >= 6) {
        return state;
      }
      return { selectedSeatIds: [...state.selectedSeatIds, seatId] };
    }),

  clearSelectedSeats: () => set({ selectedSeatIds: [] }),

  toggleComparisonSeat: (seatId) =>
    set((state) => {
      if (state.comparisonSeatIds.includes(seatId)) {
        return {
          comparisonSeatIds: state.comparisonSeatIds.filter((id) => id !== seatId),
        };
      }
      if (state.comparisonSeatIds.length >= 3) {
        return {
          comparisonSeatIds: [...state.comparisonSeatIds.slice(1), seatId],
        };
      }
      return { comparisonSeatIds: [...state.comparisonSeatIds, seatId] };
    }),

  removeComparisonSeat: (seatId) =>
    set((state) => ({
      comparisonSeatIds: state.comparisonSeatIds.filter((id) => id !== seatId),
    })),

  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  setLookAtScreenCenter: (value) =>
    set({
      lookAtScreenCenter: value,
      headYawOffsetRad: 0,
      headPitchOffsetRad: 0,
    }),

  setEyeHeightMeters: (meters) =>
    set({ eyeHeightMeters: Math.min(1.4, Math.max(0.95, meters)) }),

  setHeadLookOffsets: (yawRad, pitchRad) =>
    set({ headYawOffsetRad: yawRad, headPitchOffsetRad: pitchRad }),

  resetCameraView: () =>
    set((state) => ({
      headYawOffsetRad: 0,
      headPitchOffsetRad: 0,
      cameraResetNonce: state.cameraResetNonce + 1,
    })),

  setAudienceSimulationEnabled: (enabled) => set({ audienceSimulationEnabled: enabled }),

  setAssumedAudienceHeightMeters: (meters) =>
    set({ assumedAudienceHeightMeters: Math.min(1.4, Math.max(1.0, meters)) }),

  setScreenDisplayMode: (mode) => set({ screenDisplayMode: mode }),

  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),

  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
}));
