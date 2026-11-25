# CineView 3D — Project Plan & Development Roadmap

## 1. Initial Prototype Acceptance Criteria (Phase 2 Milestone)
The Phase 2 Core 3D Proof of Concept is complete when:
1. A realistic, documented **136-seat fictional auditorium (`Grand Lumina — Screen 1`)** is defined via a single validated configuration object (no hardcoded positions in UI/3D components).
2. The 3D auditorium renders procedurally with screen, stepped stadium risers, 10 rows (A–J), 136 uniquely identified seats (`A1`–`J12`), dual stepped aisles, handrails, walls, ceiling baffles, and exit signs.
3. Clicking any seat in either the **2D Seat Map**, **3D Theatre Overview**, or quick seat selector moves the virtual camera smoothly to that exact seat's 3D seated eye position `(x, y + eyeHeight, z)` and natural forward orientation.
4. Front (`A6`), center (`E7`), rear (`J6`), and extreme corner (`A1`, `J12`) seats produce visibly distinct, geometrically faithful screen perspectives under a locked virtual camera `vFOV`.
5. Live telemetry panel displays accurate distance, horizontal/vertical angles, horizontal/vertical angular screen size, estimated screen visibility (with optional audience-head simulation toggle), and clearly distinguishes `Camera vFOV` from `Screen Angular Coverage`.
6. Users can drag/touch to look around (clamped to realistic seated head motion), toggle "Look at Screen Center", adjust eye height, reset view, switch between `2D Map`, `3D Overview`, and `First-Person Seat` modes, enter Fullscreen, toggle `Reduced Motion`, and choose graphics quality (`Low`, `Medium`, `High`).
7. Pure geometry unit tests, TypeScript strict typecheck, ESLint, and Next.js production build all pass cleanly.

---

## 2. Phased Roadmap

### Phase 1 — Research & Architecture *(Completed)*
- Refined product specification, feasibility check, and verified dependency compatibility (`Next.js 16.4`, `React 19.3`, `Three.js 0.187`, `@react-three/fiber 9.8`, `@react-three/drei 10.7`).
- Designed PostgreSQL ERD, 3D right-handed meter coordinate system, seat-camera pose algorithm, and vector viewing-angle formulas.
- Established modular folder layout and documentation baseline.

### Phase 2 — Core 3D Proof of Concept *(Active Milestone)*
- Initialize Next.js App Router + TypeScript strict + Tailwind CSS + R3F/Drei + Zustand + Zod + Vitest.
- Implement pure TypeScript geometry engine (`src/lib/geometry/`) and Grand Lumina Screen 1 digital twin (`136 seats`).
- Implement procedural 3D auditorium, instanced seat rendering, animated cinema screen (movie loop + calibration test pattern), and first-person camera controller.
- Build synchronized 2D Seat Map, 3D Theatre Overview, First-Person Seat View, and Geometry Telemetry HUD.

### Phase 3 — Geometry Engine Refinement & Immersive Experience
- Add multi-seat comparison tray (up to 3 seats) with consistent projection & cached offscreen/snapshot previews on lower-power devices.
- Add rule-based transparent seat recommendation engine with configurable weights and human-readable explanations.
- Enhance auditorium architecture details (acoustic side panels, wall sconces, aisle step lighting, accessible seat bays, optional recliner geometry).
- WebGL capability detection & seamless 2D fallback UI.

### Phase 4 — Complete Frontend & Movie/Showtime Discovery
- Movie catalog browser, cinema & showtime selector, multi-seat selection cart, mobile responsive split/sheet views, and WCAG AA keyboard navigation.

### Phase 5 — Backend, Database & Booking Integrity
- Configure Docker Compose PostgreSQL + Prisma 7 schema & migrations + deterministic seed data.
- Implement Better Auth session & RBAC, REST API endpoints with Zod validation, server-authoritative temporary holds with expiry, and atomic double-booking-safe confirmation with idempotency keys + QR ticket view.

### Phase 6 — Theatre Administration & Calibration
- Admin dashboard (Cinema, Auditorium, Layout Builder, Movie, Showtime, Reservation monitor).
- Real-world calibration workflow (dimension/elevation overrides, obstruction placement, reference photo checklist, `SIMULATED` vs `CALIBRATED` publishing gate, audit logs).

### Phase 7 — Quality Assurance, Profiling & Hardening
- Playwright E2E suite (desktop + mobile + reduced motion + concurrent double-booking integration tests).
- FPS & WebGL draw-call profiling, security review, and accessibility audit.

### Phase 8 — Deployment & Documentation
- Production Dockerfile, GitHub Actions CI pipeline, user & administrator guides, and final demonstration walkthrough.
