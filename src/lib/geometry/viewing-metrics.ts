import type {
  AuditoriumDimensions,
  ScreenConfig,
  SeatCategoryConfig,
  SeatSpec,
  ViewingMetrics,
} from '@/types/auditorium';
import { computeScreenBasis } from './screen-geometry';
import { computeSeatCameraPose } from './seat-camera';
import { angleBetweenVec3Rad, clamp, distanceVec3, dotVec3, radToDeg, subVec3 } from './vector';

/**
 * Evaluates a preference-based heuristic suitability score (0-100) from viewing angles and coverage.
 * Explicitly NOT an industry-certified comfort rating.
 */
export function scoreViewingSuitability(metrics: {
  horizontalViewingAngleDeg: number;
  verticalTopEdgeAngleDeg: number;
  horizontalScreenCoverageDeg: number;
}): { score: number; label: string } {
  const absH = Math.abs(metrics.horizontalViewingAngleDeg);

  // Horizontal coverage sweet spot ~36-52 deg (heuristic preference)
  const coverageDelta =
    metrics.horizontalScreenCoverageDeg < 36
      ? (36 - metrics.horizontalScreenCoverageDeg) * 1.4
      : metrics.horizontalScreenCoverageDeg > 58
        ? (metrics.horizontalScreenCoverageDeg - 58) * 1.35
        : 0;

  // Off-axis lateral skew penalty
  const offAxisPenalty = absH * 1.15;

  // Upward neck-tilt penalty if top edge exceeds ~30 deg
  const upwardPenalty =
    metrics.verticalTopEdgeAngleDeg > 30 ? (metrics.verticalTopEdgeAngleDeg - 30) * 2.1 : 0;

  const rawScore = 100 - coverageDelta - offAxisPenalty - upwardPenalty;
  const score = Math.round(clamp(rawScore, 15, 99));

  let label = 'Balanced View (Estimate)';
  if (score >= 88) {
    label = 'Prime Center Zone (Estimate)';
  } else if (score >= 74) {
    label = 'Strong Sightline (Estimate)';
  } else if (score >= 58) {
    label = 'Moderate Angle (Estimate)';
  } else {
    label = 'Extreme Perspective (Estimate)';
  }

  return { score, label };
}

/**
 * Pure geometric calculation of all seat viewing distances, angles, and true 3D
 * vector-subtended angular screen coverage.
 */
export function calculateViewingMetrics(
  seat: SeatSpec,
  category: SeatCategoryConfig,
  screen: ScreenConfig,
  dimensions: AuditoriumDimensions,
  eyeHeightMeters: number,
  cameraVerticalFovDeg: number,
): ViewingMetrics {
  if (!Number.isFinite(cameraVerticalFovDeg) || cameraVerticalFovDeg <= 5 || cameraVerticalFovDeg >= 150) {
    throw new Error(`Invalid cameraVerticalFovDeg: ${cameraVerticalFovDeg}`);
  }

  const basis = computeScreenBasis(screen);
  const pose = computeSeatCameraPose(seat, category, screen, dimensions, eyeHeightMeters);
  const eye = pose.eyePosition;

  const eyeFromCenter = subVec3(eye, basis.center);
  const perpendicularDistanceMeters = dotVec3(eyeFromCenter, basis.normal);
  if (perpendicularDistanceMeters <= 0.1) {
    throw new Error(
      `Seat ${seat.code} must be in front of the screen plane; perpendicular distance = ${perpendicularDistanceMeters.toFixed(3)}m`,
    );
  }

  const distanceToScreenCenterMeters = distanceVec3(eye, basis.center);
  const horizontalOffsetMeters = dotVec3(eyeFromCenter, basis.right);
  const verticalOffsetMeters = dotVec3(eyeFromCenter, basis.up);

  const horizontalViewingAngleDeg = radToDeg(
    Math.atan2(horizontalOffsetMeters, perpendicularDistanceMeters),
  );

  const toCenter = subVec3(basis.center, eye);
  const toTop = subVec3(basis.topMid, eye);
  const toBottom = subVec3(basis.bottomMid, eye);

  const verticalViewingAngleDeg = radToDeg(
    Math.atan2(toCenter.y, Math.hypot(toCenter.x, toCenter.z)),
  );
  const verticalTopEdgeAngleDeg = radToDeg(
    Math.atan2(toTop.y, Math.hypot(toTop.x, toTop.z)),
  );
  const verticalBottomEdgeAngleDeg = radToDeg(
    Math.atan2(toBottom.y, Math.hypot(toBottom.x, toBottom.z)),
  );

  // True 3D angular span from eye to screen left/right and top/bottom edge midpoints.
  const toLeft = subVec3(basis.leftMid, eye);
  const toRight = subVec3(basis.rightMid, eye);

  const horizontalScreenCoverageDeg = radToDeg(angleBetweenVec3Rad(toLeft, toRight));
  const verticalScreenCoverageDeg = radToDeg(angleBetweenVec3Rad(toTop, toBottom));
  const verticalFovFillPercent = (verticalScreenCoverageDeg / cameraVerticalFovDeg) * 100;

  const { score, label } = scoreViewingSuitability({
    horizontalViewingAngleDeg,
    verticalTopEdgeAngleDeg,
    horizontalScreenCoverageDeg,
  });

  return {
    seatId: seat.id,
    seatCode: seat.code,
    eyePosition: eye,
    distanceToScreenCenterMeters,
    perpendicularDistanceMeters,
    horizontalOffsetMeters,
    verticalOffsetMeters,
    horizontalViewingAngleDeg,
    verticalViewingAngleDeg,
    verticalTopEdgeAngleDeg,
    verticalBottomEdgeAngleDeg,
    horizontalScreenCoverageDeg,
    verticalScreenCoverageDeg,
    verticalFovFillPercent,
    suitabilityEstimateScore: score,
    suitabilityLabel: label,
  };
}
