# CineView 3D

**Immersive Cinema Seat Visualization and Ticket Booking Platform**

CineView 3D solves the guesswork of 2D cinema seat charts by placing moviegoers inside a geometrically accurate, real-time 3D digital twin of the auditorium—at the exact seated eye position of any seat—before they book.

## Key Features (Planned & In-Progress)
- **True First-Person Seat Visualization**: Camera positioned at each seat's 3D coordinates `(x, y + eyeHeight, z)` with natural seat orientation, mouse/touch head-look, "Look at Screen Center" option, and reduced-motion support.
- **Synchronized Views**: 2D Seat Map (also serves as WebGL fallback), 3D Theatre Overview, and First-Person Seat View backed by one single-source-of-truth layout schema.
- **Pure Geometry & Obstruction Engine**: Real-world meter calculations for viewing distance, off-axis horizontal/vertical viewing angles, true vector-subtended angular screen size, and multi-ray visibility estimates.
- **Digital Twin & Calibration**: Configuration-driven procedural auditoriums with explicit `SIMULATED` vs `CALIBRATED` provenance labeling.
- **Booking & Theatre Admin** *(Upcoming Phases)*: Transaction-safe PostgreSQL seat holds, atomic booking confirmation, QR tickets, and manager layout/showtime dashboard.

## Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Product spec, stack, system architecture, database ERD, and risks.
- [GEOMETRY.md](./GEOMETRY.md) — 3D coordinate system, camera pose math, viewing angles, and obstruction raycasting.
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) — Acceptance criteria and 8-phase roadmap.
- [DECISIONS.md](./DECISIONS.md) — Architectural decision records.
- [TESTING.md](./TESTING.md) — Test strategy and verified test execution log.
- [CHANGELOG.md](./CHANGELOG.md) — Milestone history.

## Local Development (Quick Start)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
