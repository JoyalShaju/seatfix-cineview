import type {
  AuditoriumLayoutConfig,
  ObstacleBox,
  RowStepSpec,
  SeatAvailabilityStatus,
  SeatCategoryConfig,
  SeatCategoryId,
  SeatSpec,
} from '@/types/auditorium';
import { validateAuditoriumLayout } from './schema';

const CATEGORIES: Record<SeatCategoryId, SeatCategoryConfig> = {
  standard: {
    id: 'standard',
    label: 'Classic Club',
    priceMinor: 1400,
    currency: 'USD',
    widthMeters: 0.54,
    depthMeters: 0.62,
    backHeightMeters: 1.02,
    cushionHeightMeters: 0.44,
    eyeHeightOffsetMeters: 0,
    eyeBackOffsetMeters: 0.06,
    colorHex: '#5c6068',
  },
  premium: {
    id: 'premium',
    label: 'Prime PXL Lounge',
    priceMinor: 1900,
    currency: 'USD',
    widthMeters: 0.56,
    depthMeters: 0.66,
    backHeightMeters: 1.08,
    cushionHeightMeters: 0.45,
    eyeHeightOffsetMeters: 0.01,
    eyeBackOffsetMeters: 0.07,
    colorHex: '#464952',
  },
  recliner: {
    id: 'recliner',
    label: 'LUXE Sofa',
    priceMinor: 2500,
    currency: 'USD',
    widthMeters: 0.66,
    depthMeters: 0.88,
    backHeightMeters: 1.14,
    cushionHeightMeters: 0.46,
    eyeHeightOffsetMeters: -0.04,
    eyeBackOffsetMeters: 0.14,
    colorHex: '#757169',
  },
  accessible: {
    id: 'accessible',
    label: 'Accessible Bay',
    priceMinor: 1400,
    currency: 'USD',
    widthMeters: 0.72,
    depthMeters: 0.78,
    backHeightMeters: 1.0,
    cushionHeightMeters: 0.44,
    eyeHeightOffsetMeters: -0.06,
    eyeBackOffsetMeters: 0.05,
    colorHex: '#445c5d',
  },
};

interface RowBlueprint {
  label: string;
  zMeters: number;
  floorYMeters: number;
  riserDepthMeters: number;
  pitchMeters: number;
  leftCount: number;
  centerCount: number;
  rightCount: number;
  defaultCategory: SeatCategoryId;
}

const ROW_BLUEPRINTS: RowBlueprint[] = [
  { label: 'A', zMeters: 4.2, floorYMeters: 0.0, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 2, centerCount: 8, rightCount: 2, defaultCategory: 'standard' },
  { label: 'B', zMeters: 5.35, floorYMeters: 0.16, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'standard' },
  { label: 'C', zMeters: 6.5, floorYMeters: 0.48, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'standard' },
  { label: 'D', zMeters: 7.65, floorYMeters: 0.8, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'standard' },
  { label: 'E', zMeters: 8.8, floorYMeters: 1.12, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'premium' },
  { label: 'F', zMeters: 9.95, floorYMeters: 1.44, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'premium' },
  { label: 'G', zMeters: 11.1, floorYMeters: 1.76, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'premium' },
  { label: 'H', zMeters: 12.25, floorYMeters: 2.08, riserDepthMeters: 1.15, pitchMeters: 1.15, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'premium' },
  { label: 'I', zMeters: 13.45, floorYMeters: 2.4, riserDepthMeters: 1.25, pitchMeters: 1.2, leftCount: 3, centerCount: 8, rightCount: 3, defaultCategory: 'premium' },
  { label: 'J', zMeters: 14.8, floorYMeters: 2.74, riserDepthMeters: 1.45, pitchMeters: 1.35, leftCount: 3, centerCount: 6, rightCount: 3, defaultCategory: 'recliner' },
];

// Deterministic sample occupancy so users immediately see varied availability states.
const DEMO_BOOKED_CODES = new Set([
  'D6', 'D7', 'E7', 'E8', 'F6', 'F7', 'F8', 'G7', 'G8', 'H6', 'J5', 'J6',
]);
const DEMO_HELD_CODES = new Set(['E6', 'F9', 'G6']);

function getDemoAvailability(code: string): SeatAvailabilityStatus {
  if (DEMO_BOOKED_CODES.has(code)) return 'booked';
  if (DEMO_HELD_CODES.has(code)) return 'held';
  return 'available';
}

/**
 * Generates the fictional 136-seat demonstration auditorium "Grand Lumina — Screen 1".
 * Single source of truth consumed by the 2D Seat Map, 3D Scene, and Geometry Engine.
 */
export function buildGrandLuminaScreen1(): AuditoriumLayoutConfig {
  const screenCenterZ = 0.35;
  const screenCenterY = 4.05;
  const aisleOffset = 2.95;

  const rows: RowStepSpec[] = [];
  const seats: SeatSpec[] = [];

  ROW_BLUEPRINTS.forEach((bp, rowIndex) => {
    rows.push({
      rowLabel: bp.label,
      rowIndex,
      zMeters: bp.zMeters,
      floorYMeters: bp.floorYMeters,
      riserDepthMeters: bp.riserDepthMeters,
      pitchMeters: bp.pitchMeters,
    });

    const isReclinerRow = bp.defaultCategory === 'recliner';
    const seatPitchX = isReclinerRow ? 0.68 : 0.58;

    const xPositions: Array<{ x: number; sectionId: string; isAisleAdjacent: boolean }> = [];

    // Left wing seats (outermost to aisle edge)
    const leftInnerStart = isReclinerRow ? -3.95 : -3.9;
    for (let i = bp.leftCount - 1; i >= 0; i--) {
      xPositions.push({
        x: Number((leftInnerStart - i * seatPitchX).toFixed(3)),
        sectionId: 'left-wing',
        isAisleAdjacent: i === 0,
      });
    }

    // Center block seats (symmetrical around X = 0)
    const centerHalfSpan = ((bp.centerCount - 1) * seatPitchX) / 2;
    for (let i = 0; i < bp.centerCount; i++) {
      xPositions.push({
        x: Number((-centerHalfSpan + i * seatPitchX).toFixed(3)),
        sectionId: 'center-block',
        isAisleAdjacent: i === 0 || i === bp.centerCount - 1,
      });
    }

    // Right wing seats (aisle edge to outermost)
    const rightInnerStart = isReclinerRow ? 3.95 : 3.9;
    for (let i = 0; i < bp.rightCount; i++) {
      xPositions.push({
        x: Number((rightInnerStart + i * seatPitchX).toFixed(3)),
        sectionId: 'right-wing',
        isAisleAdjacent: i === 0,
      });
    }

    xPositions.forEach((slot, idx) => {
      const seatNumber = idx + 1;
      const code = `${bp.label}${seatNumber}`;

      // Accessible bays on outer front corners A1, A2, A11, A12
      const isAccessible =
        bp.label === 'A' && (seatNumber === 1 || seatNumber === 2 || seatNumber === 11 || seatNumber === 12);

      // Wing seats angle gently inward toward the screen centerline for ergonomic neck alignment;
      // center block seats face straight (-Z).
      let yawRad = 0;
      if (slot.sectionId !== 'center-block') {
        const targetYaw = Math.atan2(slot.x, bp.zMeters - screenCenterZ);
        yawRad = Number((targetYaw * 0.35).toFixed(4));
      }

      const categoryId: SeatCategoryId = isAccessible ? 'accessible' : bp.defaultCategory;

      seats.push({
        id: `gl-s1-${code}`,
        code,
        rowLabel: bp.label,
        rowIndex,
        seatNumber,
        sectionId: slot.sectionId,
        categoryId,
        floorPosition: {
          x: slot.x,
          y: bp.floorYMeters,
          z: bp.zMeters,
        },
        yawRad,
        isAccessible,
        isAisleAdjacent: slot.isAisleAdjacent,
        initialAvailability: getDemoAvailability(code),
      });
    });
  });

  // Structural aisle handrails along the stepped riser drop-offs & acoustic side wall pilasters
  const obstacles: ObstacleBox[] = [
    {
      id: 'obs-front-safety-rail-left',
      label: 'Front Row Left Safety Rail',
      kind: 'railing',
      center: { x: -4.18, y: 0.42, z: 3.55 },
      size: { x: 1.35, y: 0.84, z: 0.06 },
    },
    {
      id: 'obs-front-safety-rail-right',
      label: 'Front Row Right Safety Rail',
      kind: 'railing',
      center: { x: 4.18, y: 0.42, z: 3.55 },
      size: { x: 1.35, y: 0.84, z: 0.06 },
    },
  ];

  const layout: AuditoriumLayoutConfig = {
    id: 'grand-lumina-screen-1',
    cinemaName: 'PVR Lulu Style Reference',
    auditoriumName: 'Audi 1 • PXL & LUXE Showcase',
    version: 1,
    calibrationStatus: 'SIMULATED',
    calibrationNotes:
      'Simulated reference auditorium inspired by flagship Lulu Mall PVR LUXE & P[XL] theatres (136 seats, 16.0m x 20.0m, 11.2m x 4.70m wide-format screen). Dimensions are simulated estimates, not laser-measured venue drawings.',
    dimensions: {
      widthMeters: 16.0,
      lengthMeters: 20.0,
      frontHeightMeters: 8.5,
      rearHeightMeters: 8.5,
    },
    screen: {
      widthMeters: 11.2,
      heightMeters: 4.7,
      center: { x: 0, y: screenCenterY, z: screenCenterZ },
      tiltDeg: 0,
      frameThicknessMeters: 0.22,
    },
    aisles: [
      { id: 'aisle-left', centerXMeters: -aisleOffset, widthMeters: 1.15, hasHandrail: true },
      { id: 'aisle-right', centerXMeters: aisleOffset, widthMeters: 1.15, hasHandrail: true },
    ],
    categories: CATEGORIES,
    rows,
    seats,
    obstacles,
    defaultEyeHeightMeters: 1.15,
    cameraVerticalFovDeg: 62,
  };

  return validateAuditoriumLayout(layout);
}

export const GRAND_LUMINA_SCREEN_1 = buildGrandLuminaScreen1();
