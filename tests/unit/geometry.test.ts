import { describe, expect, it } from 'vitest';
import { GRAND_LUMINA_SCREEN_1 } from '@/lib/auditorium/grand-lumina';
import { validateAuditoriumLayout } from '@/lib/auditorium/schema';
import { estimateScreenObstruction } from '@/lib/geometry/obstruction';
import { computeSeatCameraPose, clampHeadLookOffsets } from '@/lib/geometry/seat-camera';
import { computeScreenBasis } from '@/lib/geometry/screen-geometry';
import { calculateViewingMetrics } from '@/lib/geometry/viewing-metrics';
import { degToRad } from '@/lib/geometry/vector';

function getSeat(code: string) {
  const seat = GRAND_LUMINA_SCREEN_1.seats.find((s) => s.code === code);
  if (!seat) {
    throw new Error(`Seat ${code} not found in Grand Lumina Screen 1`);
  }
  return seat;
}

describe('Auditorium Digital Twin Schema & Layout', () => {
  it('generates exactly 136 uniquely identified seats in Grand Lumina Screen 1', () => {
    expect(GRAND_LUMINA_SCREEN_1.seats).toHaveLength(136);
    expect(GRAND_LUMINA_SCREEN_1.calibrationStatus).toBe('SIMULATED');

    const ids = new Set(GRAND_LUMINA_SCREEN_1.seats.map((s) => s.id));
    const codes = new Set(GRAND_LUMINA_SCREEN_1.seats.map((s) => s.code));
    expect(ids.size).toBe(136);
    expect(codes.size).toBe(136);
  });

  it('rejects duplicate seat codes or out-of-bounds layouts', () => {
    const broken = structuredClone(GRAND_LUMINA_SCREEN_1);
    broken.seats[1]!.code = broken.seats[0]!.code;
    expect(() => validateAuditoriumLayout(broken)).toThrow();

    const outsideWall = structuredClone(GRAND_LUMINA_SCREEN_1);
    outsideWall.seats[0]!.floorPosition.x = 10.5;
    expect(() => validateAuditoriumLayout(outsideWall)).toThrow();
  });
});

describe('Seat Camera Positioning Algorithm', () => {
  it('places the camera at the exact seat floor position plus seated eye height and back offset', () => {
    const seatE7 = getSeat('E7');
    const cat = GRAND_LUMINA_SCREEN_1.categories[seatE7.categoryId];
    const pose = computeSeatCameraPose(
      seatE7,
      cat,
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
    );

    expect(pose.eyePosition.x).toBeCloseTo(seatE7.floorPosition.x, 5);
    expect(pose.eyePosition.y).toBeCloseTo(seatE7.floorPosition.y + 1.15 + cat.eyeHeightOffsetMeters, 5);
    expect(pose.eyePosition.z).toBeCloseTo(seatE7.floorPosition.z + cat.eyeBackOffsetMeters, 5);
  });

  it('allows full 360-degree horizontal look-around while clamping extreme pitch', () => {
    const clamped = clampHeadLookOffsets(degToRad(180), degToRad(-85));
    expect(clamped.yawRad).toBeCloseTo(degToRad(180), 6);
    expect(clamped.pitchRad).toBeCloseTo(degToRad(-65), 6);
  });

  it('rejects invalid out-of-range eye heights', () => {
    const seatE7 = getSeat('E7');
    const cat = GRAND_LUMINA_SCREEN_1.categories[seatE7.categoryId];
    expect(() =>
      computeSeatCameraPose(
        seatE7,
        cat,
        GRAND_LUMINA_SCREEN_1.screen,
        GRAND_LUMINA_SCREEN_1.dimensions,
        0.2,
      ),
    ).toThrow();
  });
});

describe('Viewing-Angle & Angular Screen Coverage Mathematics', () => {
  it('produces symmetrical metrics for symmetrical left and right seats', () => {
    // Row E has 14 seats: E1..E3 left wing, E4..E11 center block, E12..E14 right wing.
    // E4 and E11 are mirror images across X = 0.
    const leftSeat = getSeat('E4');
    const rightSeat = getSeat('E11');

    const mLeft = calculateViewingMetrics(
      leftSeat,
      GRAND_LUMINA_SCREEN_1.categories[leftSeat.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );
    const mRight = calculateViewingMetrics(
      rightSeat,
      GRAND_LUMINA_SCREEN_1.categories[rightSeat.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );

    expect(mLeft.horizontalOffsetMeters).toBeCloseTo(-mRight.horizontalOffsetMeters, 5);
    expect(mLeft.horizontalViewingAngleDeg).toBeCloseTo(-mRight.horizontalViewingAngleDeg, 5);
    expect(mLeft.distanceToScreenCenterMeters).toBeCloseTo(mRight.distanceToScreenCenterMeters, 5);
    expect(mLeft.horizontalScreenCoverageDeg).toBeCloseTo(mRight.horizontalScreenCoverageDeg, 5);
    expect(mLeft.verticalScreenCoverageDeg).toBeCloseTo(mRight.verticalScreenCoverageDeg, 5);
  });

  it('shows higher upward angle and larger angular coverage in front row vs rear row', () => {
    const front = getSeat('A6');
    const center = getSeat('E7');
    const rear = getSeat('J6');

    const mFront = calculateViewingMetrics(
      front,
      GRAND_LUMINA_SCREEN_1.categories[front.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );
    const mCenter = calculateViewingMetrics(
      center,
      GRAND_LUMINA_SCREEN_1.categories[center.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );
    const mRear = calculateViewingMetrics(
      rear,
      GRAND_LUMINA_SCREEN_1.categories[rear.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );

    expect(mFront.distanceToScreenCenterMeters).toBeLessThan(mCenter.distanceToScreenCenterMeters);
    expect(mCenter.distanceToScreenCenterMeters).toBeLessThan(mRear.distanceToScreenCenterMeters);

    expect(mFront.verticalViewingAngleDeg).toBeGreaterThan(mCenter.verticalViewingAngleDeg);
    expect(mCenter.verticalViewingAngleDeg).toBeGreaterThan(mRear.verticalViewingAngleDeg);

    expect(mFront.horizontalScreenCoverageDeg).toBeGreaterThan(mCenter.horizontalScreenCoverageDeg);
    expect(mCenter.horizontalScreenCoverageDeg).toBeGreaterThan(mRear.horizontalScreenCoverageDeg);
  });

  it('captures horizontal foreshortening for extreme corner seats compared to center seats in the same row', () => {
    const corner = getSeat('B1');
    const center = getSeat('B7');

    const mCorner = calculateViewingMetrics(
      corner,
      GRAND_LUMINA_SCREEN_1.categories[corner.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );
    const mCenter = calculateViewingMetrics(
      center,
      GRAND_LUMINA_SCREEN_1.categories[center.categoryId],
      GRAND_LUMINA_SCREEN_1.screen,
      GRAND_LUMINA_SCREEN_1.dimensions,
      1.15,
      55,
    );

    expect(Math.abs(mCorner.horizontalViewingAngleDeg)).toBeGreaterThan(35);
    expect(mCorner.horizontalScreenCoverageDeg).toBeLessThan(mCenter.horizontalScreenCoverageDeg);
  });

  it('throws on invalid screen dimensions or seat placed behind screen', () => {
    expect(() =>
      computeScreenBasis({ ...GRAND_LUMINA_SCREEN_1.screen, widthMeters: 0 }),
    ).toThrow();

    const invalidSeat = { ...getSeat('A6'), floorPosition: { x: 0, y: 0, z: 0.1 } };
    expect(() =>
      calculateViewingMetrics(
        invalidSeat,
        GRAND_LUMINA_SCREEN_1.categories.standard,
        GRAND_LUMINA_SCREEN_1.screen,
        GRAND_LUMINA_SCREEN_1.dimensions,
        1.15,
        55,
      ),
    ).toThrow();
  });
});

describe('Visual Obstruction Estimator', () => {
  it('reports 100% visibility on an unobstructed center stadium seat without audience simulation', () => {
    const seatF7 = getSeat('F7');
    const est = estimateScreenObstruction(seatF7, GRAND_LUMINA_SCREEN_1, 1.15, {
      audienceSimulationEnabled: false,
    });
    expect(est.sampleCount).toBe(15);
    expect(est.estimatedVisibilityPercent).toBe(100);
    expect(est.detectedBlockerKinds).toHaveLength(0);
  });

  it('detects reduced visibility when a tall audience head sits directly in front on a low-riser row', () => {
    const seatB7 = getSeat('B7');
    const clearEst = estimateScreenObstruction(seatB7, GRAND_LUMINA_SCREEN_1, 1.15, {
      audienceSimulationEnabled: false,
    });
    const tallAudienceEst = estimateScreenObstruction(seatB7, GRAND_LUMINA_SCREEN_1, 1.05, {
      audienceSimulationEnabled: true,
      assumedAudienceHeightMeters: 1.32,
    });

    expect(clearEst.estimatedVisibilityPercent).toBe(100);
    expect(tallAudienceEst.estimatedVisibilityPercent).toBeLessThan(
      clearEst.estimatedVisibilityPercent,
    );
    expect(tallAudienceEst.detectedBlockerKinds).toContain('audience-head');
  });
});
