import type {
  AuditoriumLayoutConfig,
  ObstructionEstimate,
  ObstructionSamplePoint,
  ObstacleBox,
  SeatSpec,
  Vec3,
} from '@/types/auditorium';
import { generateScreenSampleGrid } from './screen-geometry';
import { computeSeatCameraPose } from './seat-camera';
import { distanceVec3, dotVec3, normalizeVec3, subVec3 } from './vector';

interface OccluderAabb {
  min: Vec3;
  max: Vec3;
  kind: ObstructionSamplePoint['blockerKind'];
  label: string;
}

interface OccluderSphere {
  center: Vec3;
  radius: number;
  kind: ObstructionSamplePoint['blockerKind'];
  label: string;
}

function boxToAabb(
  center: Vec3,
  size: Vec3,
  kind: ObstructionSamplePoint['blockerKind'],
  label: string,
): OccluderAabb {
  return {
    min: {
      x: center.x - size.x / 2,
      y: center.y - size.y / 2,
      z: center.z - size.z / 2,
    },
    max: {
      x: center.x + size.x / 2,
      y: center.y + size.y / 2,
      z: center.z + size.z / 2,
    },
    kind,
    label,
  };
}

/**
 * Slab-method ray-AABB intersection within segment distance (0 < t < maxDist).
 */
export function intersectRayAabb(
  origin: Vec3,
  dir: Vec3,
  maxDist: number,
  aabb: { min: Vec3; max: Vec3 },
): boolean {
  let tMin = 1e-4;
  let tMax = maxDist - 1e-4;

  const axes: Array<keyof Vec3> = ['x', 'y', 'z'];
  for (const axis of axes) {
    const d = dir[axis];
    const o = origin[axis];
    if (Math.abs(d) < 1e-9) {
      if (o < aabb.min[axis] || o > aabb.max[axis]) {
        return false;
      }
    } else {
      const invD = 1 / d;
      let t1 = (aabb.min[axis] - o) * invD;
      let t2 = (aabb.max[axis] - o) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) {
        return false;
      }
    }
  }
  return tMax >= tMin;
}

/**
 * Analytic ray-sphere intersection within segment distance (0 < t < maxDist).
 */
export function intersectRaySphere(
  origin: Vec3,
  dir: Vec3,
  maxDist: number,
  center: Vec3,
  radius: number,
): boolean {
  const oc = subVec3(origin, center);
  const b = dotVec3(oc, dir);
  const c = dotVec3(oc, oc) - radius * radius;
  const discriminant = b * b - c;
  if (discriminant < 0) return false;

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = -b - sqrtDisc;
  const t2 = -b + sqrtDisc;
  return (t1 > 1e-4 && t1 < maxDist - 1e-4) || (t2 > 1e-4 && t2 < maxDist - 1e-4);
}

function mapObstacleKind(kind: ObstacleBox['kind']): ObstructionSamplePoint['blockerKind'] {
  if (kind === 'railing') return 'railing';
  if (kind === 'pillar') return 'pillar';
  if (kind === 'balcony-overhang') return 'balcony-overhang';
  return 'wall';
}

export interface ObstructionOptions {
  audienceSimulationEnabled?: boolean;
  assumedAudienceHeightMeters?: number;
}

/**
 * Estimates screen visibility by casting 15 rays (5x3 grid) from the viewer's eye
 * to the screen surface against seatbacks ahead, static structural obstacles, and
 * optionally simulated seated audience heads.
 */
export function estimateScreenObstruction(
  seat: SeatSpec,
  layout: AuditoriumLayoutConfig,
  eyeHeightMeters: number,
  options: ObstructionOptions = {},
): ObstructionEstimate {
  const audienceSimulationEnabled = options.audienceSimulationEnabled ?? false;
  const assumedAudienceHeightMeters = options.assumedAudienceHeightMeters ?? 1.15;

  const category = layout.categories[seat.categoryId];
  const pose = computeSeatCameraPose(
    seat,
    category,
    layout.screen,
    layout.dimensions,
    eyeHeightMeters,
  );
  const eye = pose.eyePosition;
  const samplePoints = generateScreenSampleGrid(layout.screen, 5, 3, 0.06);

  const aabbs: OccluderAabb[] = layout.obstacles.map((obs) =>
    boxToAabb(obs.center, obs.size, mapObstacleKind(obs.kind), obs.label),
  );
  const spheres: OccluderSphere[] = [];

  for (const other of layout.seats) {
    if (other.id === seat.id) continue;
    // Only seats strictly closer to the screen can sit between the viewer and the screen.
    if (other.floorPosition.z >= seat.floorPosition.z - 0.1) continue;

    const otherCat = layout.categories[other.categoryId];
    // Seatback bounding approximation in world coordinates
    const seatBackCenter: Vec3 = {
      x: other.floorPosition.x + 0.16 * Math.sin(other.yawRad),
      y: other.floorPosition.y + otherCat.backHeightMeters * 0.55,
      z: other.floorPosition.z + 0.16 * Math.cos(other.yawRad),
    };
    aabbs.push(
      boxToAabb(
        seatBackCenter,
        {
          x: otherCat.widthMeters * 0.92,
          y: otherCat.backHeightMeters * 0.72,
          z: 0.16,
        },
        'seatback',
        `Seat ${other.code} backrest`,
      ),
    );

    if (audienceSimulationEnabled) {
      // Model seated patron head center slightly above assumed seated eye level.
      const headCenter: Vec3 = {
        x: other.floorPosition.x + otherCat.eyeBackOffsetMeters * Math.sin(other.yawRad),
        y: other.floorPosition.y + assumedAudienceHeightMeters + 0.05,
        z: other.floorPosition.z + otherCat.eyeBackOffsetMeters * Math.cos(other.yawRad),
      };
      spheres.push({
        center: headCenter,
        radius: 0.115,
        kind: 'audience-head',
        label: `Simulated viewer in ${other.code}`,
      });
    }
  }

  const samples: ObstructionSamplePoint[] = [];
  const blockerSet = new Set<string>();
  let unblockedCount = 0;

  for (const target of samplePoints) {
    const diff = subVec3(target, eye);
    const dist = distanceVec3(eye, target);
    const dir = normalizeVec3(diff, 'obstruction ray');

    let blockedBy: { kind: ObstructionSamplePoint['blockerKind']; label: string } | null = null;

    for (const box of aabbs) {
      if (intersectRayAabb(eye, dir, dist, box)) {
        blockedBy = { kind: box.kind, label: box.label };
        break;
      }
    }

    if (!blockedBy) {
      for (const sphere of spheres) {
        if (intersectRaySphere(eye, dir, dist, sphere.center, sphere.radius)) {
          blockedBy = { kind: sphere.kind, label: sphere.label };
          break;
        }
      }
    }

    if (blockedBy) {
      blockerSet.add(blockedBy.kind ?? 'obstacle');
      samples.push({
        screenPoint: target,
        blocked: true,
        blockerKind: blockedBy.kind,
        blockerLabel: blockedBy.label,
      });
    } else {
      unblockedCount += 1;
      samples.push({
        screenPoint: target,
        blocked: false,
      });
    }
  }

  return {
    seatId: seat.id,
    sampleCount: samplePoints.length,
    unblockedCount,
    estimatedVisibilityPercent: Math.round((unblockedCount / samplePoints.length) * 100),
    audienceSimulationEnabled,
    assumedAudienceHeightMeters,
    detectedBlockerKinds: Array.from(blockerSet),
    samples,
  };
}
