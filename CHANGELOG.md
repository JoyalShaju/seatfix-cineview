# Changelog

All notable milestones, architectural updates, and verified changes to CineView 3D are recorded here.

## [0.2.19] — 2026-11-25 — Smooth Mobile Seat-Switching Transitions
### Fixed
- Replaced exponential frame-delta lerp during seat switches in [CameraController.tsx](src/components/viewer/CameraController.tsx) with a fixed-duration (`0.55s`) quintic tween and clamped first-frame `dt` so mobile DOM/tap frames never cause camera jumps.
- Optimized [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx) to patch only the 2 seats whose backrest visibility changed (instead of recomputing all 136 seats) and switched to granular Zustand selectors.

## [0.2.18] — 2026-11-25 — True Cool-Neutral Ash Lighting & Velvet Sheen
### Fixed
- Replaced yellow/cream auditorium light colors and cream `sheenColor` in [ProceduralAuditoriumShell.tsx](src/components/viewer/ProceduralAuditoriumShell.tsx), [ScreenSurface.tsx](src/components/viewer/ScreenSurface.tsx), [seatTextures.ts](src/components/viewer/seatTextures.ts), and [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx) with neutral architectural white lights (`#f3f5f8` / `#f8fafc`) and cool-silver sheen (`#cbd5e1`) so ash-grey seats render as true ash grey without a cream cast.

## [0.2.17] — 2026-11-25 — Ash-Grey Luxury Seat Palette
### Changed
- Updated seat upholstery colors in [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx), [grand-lumina.ts](src/lib/auditorium/grand-lumina.ts), and [SeatMap2D.tsx](src/components/seat-map/SeatMap2D.tsx) to a cohesive ash-tone luxury palette (`#5c6068` Classic Club ash, `#464952` Prime PXL smoked ash, `#757169` Row J LUXE Sofa stone-ash leather, `#2c2e34` charcoal-ash bolsters).

## [0.2.16] — 2026-11-25 — Tailored Velvet & Stitched Leather Seat Sculpture
### Changed
- Created [seatTextures.ts](src/components/viewer/seatTextures.ts) generating paired albedo-detail, bump, and high-roughness maps with woven micro-texture, diamond-tufted stitching, and recessed seam shading so upholstery never looks like glossy plastic.
- Rebuilt [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx) using `MeshPhysicalMaterial` (`sheen`, `roughness: 0.88`, `metalness: 0`) with waterfall-curved seat pans, contoured lumbar backrests, dark leather side bolsters, sculpted armrests with brushed-brass cupholder torus rings, and brass rear shoulder trim.

## [0.2.15] — 2026-11-25 — Front-to-Back Luxury Seating Progression & Lights Off Mode
### Added
- Added a **Lights Off / Lights On** (`houseLightsOn`) cinema-dark mode toggle in [CineViewExperience.tsx](src/components/CineViewExperience.tsx), [CameraControlsPanel.tsx](src/components/hud/CameraControlsPanel.tsx), [ProceduralAuditoriumShell.tsx](src/components/viewer/ProceduralAuditoriumShell.tsx), and [AuditoriumCanvas.tsx](src/components/viewer/AuditoriumCanvas.tsx) so users can dim house downlights and wall sconces while preserving aisle step strips, EXIT signs, projector glow, and screen luminance.
- Added upholstered **LUXE Sofa** plinths, privacy side bolsters, and extended ottoman legrests to Row J in [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx).

### Changed
- Refined seat tier progression from front to back in [grand-lumina.ts](src/lib/auditorium/grand-lumina.ts) and [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx): **Classic Club** (Rows A–D, graphite slate), **Prime PXL Lounge** (Rows E–I, deep burgundy velvet), and **LUXE Sofa** (Row J, warm cognac leather).

## [0.2.14] — 2026-11-25 — Cinematic Top-Corner Fly-In Entrance
### Added
- Added a `2.05s` quintic-eased aerial fly-in camera swoop in [CameraController.tsx](src/components/viewer/CameraController.tsx) synced with [SeatFixIntro.tsx](src/components/intro/SeatFixIntro.tsx) via `introPhase` in [useCineViewStore.ts](src/store/useCineViewStore.ts), gliding from the upper-left auditorium corner down into the seated eye pose (automatically bypassed when `reducedMotion` is enabled or interrupted by user interaction).

## [0.2.13] — 2026-11-25 — Brighter Pre-Show Auditorium House Lighting
### Changed
- Added warm overhead house downlights (`ambientLight`, `hemisphereLight`, dual `directionalLight`, and ceiling cove `pointLight`s) in [ProceduralAuditoriumShell.tsx](src/components/viewer/ProceduralAuditoriumShell.tsx), softened distance fog in [AuditoriumCanvas.tsx](src/components/viewer/AuditoriumCanvas.tsx), and lifted seat/riser upholstery shades in [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx) so every seat, armrest, cupholder, and row step is clearly visible in 3D.

## [0.2.12] — 2026-11-25 — Illuminated P[XL] Side Wall Logos
### Added
- Created [WallPxlLogo.tsx](src/components/viewer/WallPxlLogo.tsx) and mounted it on both the left and right auditorium walls in [ProceduralAuditoriumShell.tsx](src/components/viewer/ProceduralAuditoriumShell.tsx), featuring extruded `P` and `[ ]` brackets in matching warm champagne gold (`#f3df9e` / `#c99c3c`) and `XL` in crisp illuminated white (`#ffffff`).

## [0.2.11] — 2026-11-25 — ODIN FORCE 4K Screen Feature & End-to-End Framing
### Added
- Copied `ODIN_FORCE_4K (1).png` to [public/movies/odin-force-4k.png](public/movies/odin-force-4k.png) and updated [ScreenSurface.tsx](src/components/viewer/ScreenSurface.tsx) to render it edge-to-edge on a `2048×858` high-anisotropy CinemaScope `CanvasTexture`.

### Changed
- Widened base vertical FOV to `62°` in [grand-lumina.ts](src/lib/auditorium/grand-lumina.ts) and enforced a minimum `88°` horizontal FOV in [CameraController.tsx](src/components/viewer/CameraController.tsx) on narrower desktop/mobile viewports so the full end-to-end screen frame is clearly visible from standard seats while remaining consistent across seat comparisons.
- Updated movie title indicator in [CineViewExperience.tsx](src/components/CineViewExperience.tsx) to **ODIN FORCE (4K)**.

## [0.2.10] — 2026-11-25 — Premium 4K Cinema Projector & Clean Screen View
### Changed
- Removed the translucent volumetric throw-cone mesh in [ProjectionBooth.tsx](src/components/viewer/ProjectionBooth.tsx) so the cinema screen remains 100% crisp and unobstructed from every seat.
- Upgraded the rear projector to a flagship dual-laser design featuring a precision gimbal pedestal, side heat-sink cooling fins, brushed-brass zoom/focus rings, multi-coated optical lens elements, and illuminated booth aperture trim.

## [0.2.9] — 2026-11-25 — 3D Rear Cinema Laser Projector & Throw Beam
### Added
- Created [ProjectionBooth.tsx](src/components/viewer/ProjectionBooth.tsx) and integrated it into [ProceduralAuditoriumShell.tsx](src/components/viewer/ProceduralAuditoriumShell.tsx), adding a recessed rear projection booth port, 3D 4K laser cinema projector chassis, stepped anamorphic lens barrel, illuminated objective lamp, and subtle additive projection beam aimed toward the screen center.

## [0.2.8] — 2026-11-25 — Public Netlify Deployment Configuration & Release
### Added
- Added [netlify.toml](netlify.toml) configured for Next.js 16 (`command = "npm run build"`, `publish = ".next"`, `[[plugins]] package = "@netlify/plugin-nextjs"`).
- Added `.netlify/` to [.gitignore](.gitignore) so local `.netlify/state.json` links are never committed.
- Created public Netlify project `seatfix-cineview` (`siteId: b6c34008-664e-49f7-b2ef-ee9cff82216a`) and published production deploy `6b06aaf992f370388fbdb0c9` (`@netlify/plugin-nextjs@5.16.9`) to `https://seatfix-cineview.netlify.app`.

## [0.2.7] — 2026-11-25 — Intro Smoothness, Framing & Mobile Polish
### Fixed
- Removed the center horizontal line crossing through the `SEATFIX` wordmark in [SeatFixIntro.tsx](src/components/intro/SeatFixIntro.tsx).
- Replaced hard triangular light cone edges with a soft feathered radial halo and delta-time-normalized dust-mote motion (`dt` clamped) for silky-smooth animation.
- Deferred 3D WebGL scene initialization by `650 ms` in [CineViewExperience.tsx](src/components/CineViewExperience.tsx) so shader compilation and instanced seat geometry generation never compete with the intro's opening frames.
- Made the intro CinemaScope frame, typography, and `Skip →` control responsive for narrow mobile portrait screens (`360px+`).

## [0.2.6] — 2026-11-25 — Volumetric Cinema Projector & Perspective Intro
### Changed
- Rebuilt [SeatFixIntro.tsx](src/components/intro/SeatFixIntro.tsx) with a live HTML5 `<canvas>` volumetric projector light cone, drifting dust motes, vanishing-point auditorium perspective seat-row arcs, anamorphic lens flare, CinemaScope letterbox curtains, and an optical zoom-through transition into the 3D hall.

## [0.2.5] — 2026-11-25 — Obsidian Black & Champagne-Gold Luxury Theme
### Changed
- Replaced the blue palette with a bespoke luxury cinema theme: deep obsidian-black backgrounds, champagne-gold / brushed-brass accents (`#e8cf86` / `#d4af37`), smoked charcoal velvet (`Classic Club`), deep burgundy (`Prime PXL Lounge`), and rich espresso leather (`LUXE Recliner`) seats with warm 2700K auditorium cove and aisle step lighting.

## [0.2.4] — 2026-11-25 — PVR Lulu-Inspired Luxury Seats & Auditorium Detailing
### Changed
- Upgraded [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx) to sculpted beveled cinema seating (`ExtrudeGeometry`) with contoured seat pans, high-back lumbar supports, winged headrest pillows, brushed-metal cupholders, quilted leatherette bump texture, and angled legrests for `LUXE Recliner` seats in Row J.
- Upgraded [ProceduralAuditoriumShell.tsx](src/components/viewer/ProceduralAuditoriumShell.tsx) with P[XL]/LUXE-inspired screen wing coves, recessed blue ceiling/wall cove strips, ribbed acoustic wall panels, surround speaker enclosures, and brushed-steel handrails.
- Updated [grand-lumina.ts](src/lib/auditorium/grand-lumina.ts) category labels (`Classic Club`, `Prime PXL Lounge`, `LUXE Recliner`, `Accessible Bay`) while clearly marking the hall as a `SIMULATED` PVR Lulu-inspired reference.

## [0.2.3] — 2026-11-25 — 360° Seated Look-Around & Rear Auditorium View
### Changed
- Enabled full 360° horizontal look-around in [seat-camera.ts](src/lib/geometry/seat-camera.ts) (while preserving vertical pitch clamping `±65°`) so users in front seats can freely turn around and inspect the seating tiers behind them.
- Added a one-click **Look Behind / Look Front** button in [CineViewExperience.tsx](src/components/CineViewExperience.tsx).
- Hid only the active seat's own backrest in `first-person` mode in [InstancedSeats.tsx](src/components/viewer/InstancedSeats.tsx) so turning 180° behind is completely unobstructed.

## [0.2.2] — 2026-11-25 — Blue & Black Gradient Theme + SeatFix Intro
### Added
- Created [SeatFixIntro.tsx](src/components/intro/SeatFixIntro.tsx) with animated horizon beam, brand entrance, auto-transition progress indicator, `Enter Auditorium` skip button, `reducedMotion` fast-path, and smooth exit fade into the live 3D hall.
- Added integration tests in [intro.test.tsx](tests/integration/intro.test.tsx).

### Changed
- Replaced the amber/charcoal palette with a deep black-to-sapphire-blue gradient theme across `globals.css`, all HUD cards, `SeatMap2D`, `ScreenSurface`, `InstancedSeats`, and `ProceduralAuditoriumShell`.
- Updated main brand title to **SeatFix** across metadata, intro, and header.

## [0.2.1] — 2026-11-25 — Responsive & Uncluttered Cinema UI Polish
### Changed
- Redesigned [SeatMap2D.tsx](src/components/seat-map/SeatMap2D.tsx) with proportional `flex-1` seat sizing so all 14 seats per row fit cleanly inside narrow mobile viewports without horizontal scrolling.
- Replaced the stacked right sidebar in [CineViewExperience.tsx](src/components/CineViewExperience.tsx) with a clean 3-tab inspector (`Seats`, `View & Optics`, `Find`) and a single-row horizontally scrollable Quick Jump & Optics bar below the 3D stage.
- Extracted [CameraControlsPanel.tsx](src/components/hud/CameraControlsPanel.tsx) and enlarged primary metric typography (`tabular-nums`) in [ViewingTelemetryPanel.tsx](src/components/hud/ViewingTelemetryPanel.tsx) for faster scanning on desktop and mobile.

## [0.2.0] — 2026-11-25 — Phase 2 Core 3D Proof of Concept
### Added
- Initialized Next.js 16.4.6 + React 19.3.1 + TypeScript strict + Tailwind CSS 4 + Three.js 0.187.0 + React Three Fiber 9.8.2 + Drei 10.7.9 + Zustand 5.1.0 + Zod 4.x + Vitest 4.x.
- Pure TypeScript geometry engine (`src/lib/geometry/`): vector math, orthonormal screen basis & sample grid, seated camera pose calculation with head-look clamping, 3D vector-subtended viewing-angle & angular coverage calculations, and 15-ray screen obstruction estimation.
- Configuration-driven digital twin (`src/lib/auditorium/grand-lumina.ts`) modeling a 136-seat fictional stadium auditorium (`Grand Lumina Cinema — Screen 1`, explicitly tagged `SIMULATED`).
- Real-time 3D viewport (`src/components/viewer/`): instanced seat meshes, stepped stadium risers, dual illuminated aisles, handrails, side acoustic pilasters, exit signs, toggleable cinema-loop vs. 2.39:1 calibration grid screen, optional simulated audience heads, and first-person / 3D overview camera controller.
- Synchronized 2D Seat Map (`src/components/seat-map/SeatMap2D.tsx`), live Geometry Telemetry HUD, 3-seat Comparison Tray, Rule-Based Seat Finder, Fullscreen support, Low/Medium/High quality presets, Reduced Motion support, and automatic WebGL-unavailable 2D fallback.
- 15 automated unit and integration tests covering geometry accuracy, symmetry, corner foreshortening, obstruction detection, store sync, and seat recommendations.

## [0.1.0] — 2026-11-25 — Phase 1 Technical Foundation
### Added
- Technical foundation documentation: `README.md`, `ARCHITECTURE.md`, `GEOMETRY.md`, `PROJECT_PLAN.md`, `DECISIONS.md`, `TESTING.md`, `.env.example`.
