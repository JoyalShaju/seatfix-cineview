import type {
  AuditoriumDimensions,
  CameraPose,
  ScreenConfig,
  SeatCategoryConfig,
  SeatSpec,
  Vec3,
} from '@/types/auditorium';
import { assertFiniteVec3, clamp, degToRad, subVec3 } from './vector';

export const MIN_EYE_HEIGHT_METERS = 0.8;
export const MAX_EYE_HEIGHT_METERS = 1.6;
export const MIN_HEAD_PITCH_OFFSET_RAD = degToRad(-65);
export const MAX_HEAD_PITCH_OFFSET_RAD = degToRad(65);

/**
 * Computes the exact 3D seated eye coordinate and reference look angles for a seat.
 * Matches right-handed Y-up meter conventions documented in GEOMETRY.md.
 */
export function computeSeatCameraPose(
  seat: SeatSpec,
  category: SeatCategoryConfig,
  screen: ScreenConfig,
  dimensions: AuditoriumDimensions,
  eyeHeightMeters: number,
): CameraPose {
  assertFiniteVec3(seat.floorPosition, `seat(${seat.code}).floorPosition`);
  assertFiniteVec3(screen.center, 'screen.center');

  if (!Number.isFinite(eyeHeightMeters) || eyeHeightMeters < MIN_EYE_HEIGHT_METERS || eyeHeightMeters > MAX_EYE_HEIGHT_METERS) {
    throw new Error(
      `eyeHeightMeters must be between ${MIN_EYE_HEIGHT_METERS}m and ${MAX_EYE_HEIGHT_METERS}m; received ${eyeHeightMeters}`,
    );
  }
  if (!Number.isFinite(seat.yawRad)) {
    throw new Error(`Invalid seat yawRad for ${seat.code}: ${seat.yawRad}`);
  }

  // Rotate local backrest offset (0, 0, +eyeBackOffsetMeters) around +Y by seat.yawRad.
  const backOffsetX = category.eyeBackOffsetMeters * Math.sin(seat.yawRad);
  const backOffsetZ = category.eyeBackOffsetMeters * Math.cos(seat.yawRad);

  const wallMargin = 0.4;
  const minX = -dimensions.widthMeters / 2 + wallMargin;
  const maxX = dimensions.widthMeters / 2 - wallMargin;

  const eyePosition: Vec3 = {
    x: clamp(seat.floorPosition.x + backOffsetX, minX, maxX),
    y: seat.floorPosition.y + eyeHeightMeters + category.eyeHeightOffsetMeters,
    z: seat.floorPosition.z + backOffsetZ,
  };

  const toScreen = subVec3(screen.center, eyePosition);
  const horizDist = Math.hypot(toScreen.x, toScreen.z);
  if (horizDist <= 1e-6) {
    throw new Error(`Seat ${seat.code} eye position coincides horizontally with screen center`);
  }

  // Three.js camera looks along local -Z; rotation.y = atan2(-dx, -dz) points -Z toward target.
  const screenCenterYawRad = Math.atan2(-toScreen.x, -toScreen.z);
  const screenCenterPitchRad = Math.atan2(toScreen.y, horizDist);

  return {
    eyePosition,
    naturalYawRad: seat.yawRad,
    screenCenterYawRad,
    screenCenterPitchRad,
    minX,
    maxX,
  };
}

/**
 * Permits full 360-degree horizontal look-around (including looking behind the seat)
 * while clamping vertical pitch to avoid unnatural upside-down camera inversion.
 */
export function clampHeadLookOffsets(
  deltaYawRad: number,
  deltaPitchRad: number,
): { yawRad: number; pitchRad: number } {
  return {
    yawRad: Number.isFinite(deltaYawRad) ? deltaYawRad : 0,
    pitchRad: clamp(deltaPitchRad, MIN_HEAD_PITCH_OFFSET_RAD, MAX_HEAD_PITCH_OFFSET_RAD),
  };
}
