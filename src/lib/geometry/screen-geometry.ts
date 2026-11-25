import type { ScreenConfig, Vec3 } from '@/types/auditorium';
import { addVec3, assertFiniteVec3, degToRad, scaleVec3 } from './vector';

export interface ScreenBasis {
  center: Vec3;
  right: Vec3;
  up: Vec3;
  normal: Vec3;
  leftMid: Vec3;
  rightMid: Vec3;
  topMid: Vec3;
  bottomMid: Vec3;
  topLeft: Vec3;
  topRight: Vec3;
  bottomLeft: Vec3;
  bottomRight: Vec3;
}

/**
 * Validates screen configuration and computes its orthonormal basis and edge/corner points.
 */
export function computeScreenBasis(screen: ScreenConfig): ScreenBasis {
  if (!Number.isFinite(screen.widthMeters) || screen.widthMeters <= 0) {
    throw new Error(`Invalid screen widthMeters: ${screen.widthMeters}`);
  }
  if (!Number.isFinite(screen.heightMeters) || screen.heightMeters <= 0) {
    throw new Error(`Invalid screen heightMeters: ${screen.heightMeters}`);
  }
  if (!Number.isFinite(screen.tiltDeg) || Math.abs(screen.tiltDeg) > 45) {
    throw new Error(`Invalid screen tiltDeg: ${screen.tiltDeg}`);
  }
  assertFiniteVec3(screen.center, 'screen.center');

  const tiltRad = degToRad(screen.tiltDeg);
  const right: Vec3 = { x: 1, y: 0, z: 0 };
  const up: Vec3 = { x: 0, y: Math.cos(tiltRad), z: Math.sin(tiltRad) };
  // Screen normal faces into the auditorium (+Z when vertical).
  const normal: Vec3 = { x: 0, y: -Math.sin(tiltRad), z: Math.cos(tiltRad) };

  const halfW = screen.widthMeters / 2;
  const halfH = screen.heightMeters / 2;
  const halfRight = scaleVec3(right, halfW);
  const halfUp = scaleVec3(up, halfH);

  const leftMid = addVec3(screen.center, scaleVec3(right, -halfW));
  const rightMid = addVec3(screen.center, halfRight);
  const topMid = addVec3(screen.center, halfUp);
  const bottomMid = addVec3(screen.center, scaleVec3(up, -halfH));

  return {
    center: screen.center,
    right,
    up,
    normal,
    leftMid,
    rightMid,
    topMid,
    bottomMid,
    topLeft: addVec3(topMid, scaleVec3(right, -halfW)),
    topRight: addVec3(topMid, halfRight),
    bottomLeft: addVec3(bottomMid, scaleVec3(right, -halfW)),
    bottomRight: addVec3(bottomMid, halfRight),
  };
}

/**
 * Generates an evenly spaced grid of sample points across the active screen surface,
 * inset slightly from the frame border to avoid grazing edge artifacts.
 */
export function generateScreenSampleGrid(
  screen: ScreenConfig,
  columns = 5,
  rows = 3,
  edgeInsetRatio = 0.06,
): Vec3[] {
  const basis = computeScreenBasis(screen);
  const points: Vec3[] = [];
  const usableHalfW = (screen.widthMeters / 2) * (1 - edgeInsetRatio * 2);
  const usableHalfH = (screen.heightMeters / 2) * (1 - edgeInsetRatio * 2);

  for (let r = 0; r < rows; r++) {
    const vNorm = rows === 1 ? 0 : (r / (rows - 1)) * 2 - 1;
    for (let c = 0; c < columns; c++) {
      const uNorm = columns === 1 ? 0 : (c / (columns - 1)) * 2 - 1;
      const offsetU = scaleVec3(basis.right, uNorm * usableHalfW);
      const offsetV = scaleVec3(basis.up, vNorm * usableHalfH);
      points.push(addVec3(basis.center, addVec3(offsetU, offsetV)));
    }
  }
  return points;
}
