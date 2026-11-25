import { calculateViewingMetrics } from '@/lib/geometry/viewing-metrics';
import { estimateScreenObstruction } from '@/lib/geometry/obstruction';
import type { AuditoriumLayoutConfig, SeatSpec } from '@/types/auditorium';

export type RecommendationPreset =
  | 'best-overall'
  | 'most-centered'
  | 'closest'
  | 'farthest'
  | 'near-aisle'
  | 'recliner';

export interface RecommendedSeatResult {
  seat: SeatSpec;
  score: number;
  reason: string;
}

/**
 * Transparent, rule-based seat recommender using pure geometry, availability, and category rules.
 * Explicitly produces preference-based rankings without ML/AI claims.
 */
export function recommendSeats(
  layout: AuditoriumLayoutConfig,
  preset: RecommendationPreset,
  eyeHeightMeters: number,
  limit = 3,
): RecommendedSeatResult[] {
  const available = layout.seats.filter((s) => s.initialAvailability === 'available');

  const scored = available
    .map((seat) => {
      const cat = layout.categories[seat.categoryId];
      const metrics = calculateViewingMetrics(
        seat,
        cat,
        layout.screen,
        layout.dimensions,
        eyeHeightMeters,
        layout.cameraVerticalFovDeg,
      );
      const obstruction = estimateScreenObstruction(seat, layout, eyeHeightMeters);

      let score = metrics.suitabilityEstimateScore;
      let reason = '';

      switch (preset) {
        case 'best-overall': {
          score =
            metrics.suitabilityEstimateScore * 0.75 +
            obstruction.estimatedVisibilityPercent * 0.25;
          reason = `${metrics.horizontalScreenCoverageDeg.toFixed(1)}° screen span, ${Math.abs(metrics.horizontalViewingAngleDeg).toFixed(1)}° off-axis, ${obstruction.estimatedVisibilityPercent}% clear`;
          break;
        }
        case 'most-centered': {
          score = 100 - Math.abs(metrics.horizontalViewingAngleDeg) * 3 - Math.abs(metrics.verticalViewingAngleDeg) * 0.8;
          reason = `${Math.abs(metrics.horizontalViewingAngleDeg).toFixed(1)}° from center axis at ${metrics.distanceToScreenCenterMeters.toFixed(1)}m`;
          break;
        }
        case 'closest': {
          score = 100 - metrics.distanceToScreenCenterMeters * 5;
          reason = `${metrics.distanceToScreenCenterMeters.toFixed(1)}m from screen (${metrics.horizontalScreenCoverageDeg.toFixed(1)}° H-FOV)`;
          break;
        }
        case 'farthest': {
          score = metrics.distanceToScreenCenterMeters * 6 - Math.abs(metrics.horizontalViewingAngleDeg);
          reason = `${metrics.distanceToScreenCenterMeters.toFixed(1)}m distance, gentle ${metrics.verticalTopEdgeAngleDeg.toFixed(1)}° top angle`;
          break;
        }
        case 'near-aisle': {
          if (!seat.isAisleAdjacent) {
            score = -1000;
          } else {
            score = metrics.suitabilityEstimateScore + 10;
          }
          reason = `Direct aisle access • ${metrics.distanceToScreenCenterMeters.toFixed(1)}m distance`;
          break;
        }
        case 'recliner': {
          if (seat.categoryId !== 'recliner') {
            score = -1000;
          } else {
            score = metrics.suitabilityEstimateScore + 15;
          }
          reason = `LUXE Sofa • ${metrics.distanceToScreenCenterMeters.toFixed(1)}m elevated view`;
          break;
        }
      }

      return { seat, score, reason };
    })
    .filter((item) => item.score > -500)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
