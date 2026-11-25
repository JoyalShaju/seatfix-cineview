import type { Vec3 } from '@/types/auditorium';

export const RAD_TO_DEG = 180 / Math.PI;
export const DEG_TO_RAD = Math.PI / 180;

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function assertFiniteVec3(v: Vec3, label: string): void {
  if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) {
    throw new Error(`Invalid non-finite vector for ${label}: (${v.x}, ${v.y}, ${v.z})`);
  }
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scaleVec3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function lengthVec3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function distanceVec3(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function normalizeVec3(v: Vec3, label = 'vector'): Vec3 {
  const len = lengthVec3(v);
  if (len <= 1e-9) {
    throw new Error(`Cannot normalize zero-length ${label}`);
  }
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function radToDeg(rad: number): number {
  return rad * RAD_TO_DEG;
}

export function degToRad(deg: number): number {
  return deg * DEG_TO_RAD;
}

/**
 * Computes the true 3D angle in radians between two non-zero vectors a and b.
 */
export function angleBetweenVec3Rad(a: Vec3, b: Vec3): number {
  const lenA = lengthVec3(a);
  const lenB = lengthVec3(b);
  if (lenA <= 1e-9 || lenB <= 1e-9) {
    throw new Error('Cannot compute angle for a zero-length vector');
  }
  const cosTheta = clamp(dotVec3(a, b) / (lenA * lenB), -1, 1);
  return Math.acos(cosTheta);
}
