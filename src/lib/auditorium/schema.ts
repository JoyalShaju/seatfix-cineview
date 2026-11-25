import { z } from 'zod';
import type { AuditoriumLayoutConfig } from '@/types/auditorium';

const vec3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

const seatCategorySchema = z.object({
  id: z.enum(['standard', 'premium', 'recliner', 'accessible']),
  label: z.string().min(1),
  priceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  widthMeters: z.number().positive(),
  depthMeters: z.number().positive(),
  backHeightMeters: z.number().positive(),
  cushionHeightMeters: z.number().positive(),
  eyeHeightOffsetMeters: z.number().finite(),
  eyeBackOffsetMeters: z.number().finite(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const auditoriumLayoutSchema = z
  .object({
    id: z.string().min(1),
    cinemaName: z.string().min(1),
    auditoriumName: z.string().min(1),
    version: z.number().int().positive(),
    calibrationStatus: z.enum(['SIMULATED', 'CALIBRATED']),
    calibrationNotes: z.string().min(1),
    dimensions: z.object({
      widthMeters: z.number().positive(),
      lengthMeters: z.number().positive(),
      frontHeightMeters: z.number().positive(),
      rearHeightMeters: z.number().positive(),
    }),
    screen: z.object({
      widthMeters: z.number().positive(),
      heightMeters: z.number().positive(),
      center: vec3Schema,
      tiltDeg: z.number().min(-30).max(30),
      frameThicknessMeters: z.number().nonnegative(),
    }),
    aisles: z.array(
      z.object({
        id: z.string().min(1),
        centerXMeters: z.number().finite(),
        widthMeters: z.number().positive(),
        hasHandrail: z.boolean(),
      }),
    ),
    categories: z.object({
      standard: seatCategorySchema,
      premium: seatCategorySchema,
      recliner: seatCategorySchema,
      accessible: seatCategorySchema,
    }),
    rows: z.array(
      z.object({
        rowLabel: z.string().min(1),
        rowIndex: z.number().int().nonnegative(),
        zMeters: z.number().positive(),
        floorYMeters: z.number().nonnegative(),
        riserDepthMeters: z.number().positive(),
        pitchMeters: z.number().positive(),
      }),
    ),
    seats: z.array(
      z.object({
        id: z.string().min(1),
        code: z.string().min(1),
        rowLabel: z.string().min(1),
        rowIndex: z.number().int().nonnegative(),
        seatNumber: z.number().int().positive(),
        sectionId: z.string().min(1),
        categoryId: z.enum(['standard', 'premium', 'recliner', 'accessible']),
        floorPosition: vec3Schema,
        yawRad: z.number().finite(),
        isAccessible: z.boolean(),
        isAisleAdjacent: z.boolean(),
        initialAvailability: z.enum(['available', 'held', 'booked', 'blocked']),
      }),
    ),
    obstacles: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        kind: z.enum(['pillar', 'railing', 'balcony-overhang', 'wall', 'equipment']),
        center: vec3Schema,
        size: vec3Schema,
      }),
    ),
    defaultEyeHeightMeters: z.number().min(0.8).max(1.6),
    cameraVerticalFovDeg: z.number().min(30).max(90),
  })
  .superRefine((data, ctx) => {
    const seenIds = new Set<string>();
    const seenCodes = new Set<string>();
    const halfW = data.dimensions.widthMeters / 2;

    for (const seat of data.seats) {
      if (seenIds.has(seat.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate seat id: ${seat.id}`,
        });
      }
      seenIds.add(seat.id);

      if (seenCodes.has(seat.code)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate seat code: ${seat.code}`,
        });
      }
      seenCodes.add(seat.code);

      if (Math.abs(seat.floorPosition.x) >= halfW) {
        ctx.addIssue({
          code: 'custom',
          message: `Seat ${seat.code} X (${seat.floorPosition.x}) is outside auditorium width`,
        });
      }

      if (seat.floorPosition.z <= data.screen.center.z + 0.5) {
        ctx.addIssue({
          code: 'custom',
          message: `Seat ${seat.code} Z (${seat.floorPosition.z}) is not in front of screen`,
        });
      }
    }
  });

export function validateAuditoriumLayout(config: AuditoriumLayoutConfig): AuditoriumLayoutConfig {
  return auditoriumLayoutSchema.parse(config);
}
