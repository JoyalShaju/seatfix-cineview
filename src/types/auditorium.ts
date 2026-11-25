/**
 * Core domain types for CineView 3D Digital Twin & Geometry Engine.
 * All coordinates and dimensions are expressed in meters using the
 * right-handed Y-up coordinate system documented in GEOMETRY.md.
 */

export type CalibrationStatus = 'SIMULATED' | 'CALIBRATED';

export type SeatCategoryId = 'standard' | 'premium' | 'recliner' | 'accessible';

export type SeatAvailabilityStatus = 'available' | 'held' | 'booked' | 'blocked';

export type VisualizationMode = '2d-map' | '3d-overview' | 'first-person';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type ScreenDisplayMode = 'cinema-loop' | 'calibration-grid';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ScreenConfig {
  widthMeters: number;
  heightMeters: number;
  /** Center position of the active screen surface in meters. */
  center: Vec3;
  /** Downward screen tilt in degrees (0 = vertical). */
  tiltDeg: number;
  /** Border bezel thickness in meters. */
  frameThicknessMeters: number;
}

export interface SeatCategoryConfig {
  id: SeatCategoryId;
  label: string;
  priceMinor: number;
  currency: string;
  widthMeters: number;
  depthMeters: number;
  backHeightMeters: number;
  cushionHeightMeters: number;
  /** Category-specific vertical eye delta relative to standard eye height (m). */
  eyeHeightOffsetMeters: number;
  /** Distance behind seat floor center toward the backrest where eyes sit (m). */
  eyeBackOffsetMeters: number;
  colorHex: string;
}

export interface AuditoriumDimensions {
  widthMeters: number;
  lengthMeters: number;
  frontHeightMeters: number;
  rearHeightMeters: number;
}

export interface AisleSpec {
  id: string;
  /** Center X position of the aisle in meters. */
  centerXMeters: number;
  widthMeters: number;
  hasHandrail: boolean;
}

export interface ObstacleBox {
  id: string;
  label: string;
  kind: 'pillar' | 'railing' | 'balcony-overhang' | 'wall' | 'equipment';
  center: Vec3;
  size: Vec3;
}

export interface SeatSpec {
  id: string;
  /** Human-readable seat identifier, e.g., "H12". */
  code: string;
  rowLabel: string;
  rowIndex: number;
  seatNumber: number;
  sectionId: string;
  categoryId: SeatCategoryId;
  /** Physical floor anchor position on the row riser in meters. */
  floorPosition: Vec3;
  /** Horizontal seat rotation around +Y in radians (0 = facing -Z toward screen). */
  yawRad: number;
  isAccessible: boolean;
  isAisleAdjacent: boolean;
  initialAvailability: SeatAvailabilityStatus;
}

export interface RowStepSpec {
  rowLabel: string;
  rowIndex: number;
  /** Z center of the row riser platform in meters. */
  zMeters: number;
  /** Floor surface elevation Y in meters. */
  floorYMeters: number;
  /** Total depth of the riser platform in meters. */
  riserDepthMeters: number;
  /** Row-to-row pitch in meters. */
  pitchMeters: number;
}

export interface AuditoriumLayoutConfig {
  id: string;
  cinemaName: string;
  auditoriumName: string;
  version: number;
  calibrationStatus: CalibrationStatus;
  calibrationNotes: string;
  dimensions: AuditoriumDimensions;
  screen: ScreenConfig;
  aisles: AisleSpec[];
  categories: Record<SeatCategoryId, SeatCategoryConfig>;
  rows: RowStepSpec[];
  seats: SeatSpec[];
  obstacles: ObstacleBox[];
  defaultEyeHeightMeters: number;
  cameraVerticalFovDeg: number;
}

export interface CameraPose {
  eyePosition: Vec3;
  /** Base forward yaw in radians matching seat orientation. */
  naturalYawRad: number;
  /** Yaw in radians pointing directly at screen center. */
  screenCenterYawRad: number;
  /** Pitch in radians pointing directly at screen center. */
  screenCenterPitchRad: number;
  /** Clamped safe interior bounds for camera head movement. */
  minX: number;
  maxX: number;
}

export interface ViewingMetrics {
  seatId: string;
  seatCode: string;
  eyePosition: Vec3;
  /** Direct 3D Euclidean distance from eye to screen center (m). */
  distanceToScreenCenterMeters: number;
  /** Perpendicular distance from eye to screen plane (m). */
  perpendicularDistanceMeters: number;
  /** Lateral offset from screen centerline in meters (- = left, + = right). */
  horizontalOffsetMeters: number;
  /** Vertical offset from screen center in meters (- = below, + = above). */
  verticalOffsetMeters: number;
  /** Horizontal off-axis viewing angle from screen normal in degrees. */
  horizontalViewingAngleDeg: number;
  /** Vertical elevation angle from eye to screen center in degrees (+ = looking up). */
  verticalViewingAngleDeg: number;
  /** Vertical elevation angle from eye to screen top edge in degrees. */
  verticalTopEdgeAngleDeg: number;
  /** Vertical elevation angle from eye to screen bottom edge in degrees. */
  verticalBottomEdgeAngleDeg: number;
  /** True 3D vector-subtended horizontal angular screen size in degrees. */
  horizontalScreenCoverageDeg: number;
  /** True 3D vector-subtended vertical angular screen size in degrees. */
  verticalScreenCoverageDeg: number;
  /** Percentage of fixed camera vertical FOV occupied vertically by screen. */
  verticalFovFillPercent: number;
  /** Preference-based heuristic suitability score (0-100), not a certified standard. */
  suitabilityEstimateScore: number;
  suitabilityLabel: string;
}

export interface ObstructionSamplePoint {
  screenPoint: Vec3;
  blocked: boolean;
  blockerKind?: 'seatback' | 'audience-head' | 'railing' | 'pillar' | 'balcony-overhang' | 'wall';
  blockerLabel?: string;
}

export interface ObstructionEstimate {
  seatId: string;
  sampleCount: number;
  unblockedCount: number;
  /** Estimated visible screen proportion (0-100%). */
  estimatedVisibilityPercent: number;
  audienceSimulationEnabled: boolean;
  assumedAudienceHeightMeters: number;
  detectedBlockerKinds: string[];
  samples: ObstructionSamplePoint[];
}
