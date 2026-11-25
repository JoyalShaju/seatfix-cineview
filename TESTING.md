# CineView 3D — Testing Strategy & Verification Log

## Test Layers

1. **Unit Tests (`tests/unit/`, Vitest)**
   - Coordinate system invariants & seat pose calculations
   - Viewing-angle formulas: center seat, symmetrical left/right pairs, front vs. rear distance scaling, elevated risers, extreme corner seats, and invalid/degenerate screen geometry handling
   - Angular screen coverage ($\alpha_H, \alpha_V$) vs. naive formulas
   - Multi-ray obstruction estimation (clear seat, blocked by audience head in front)
   - Auditorium configuration Zod schema validation & uniqueness checks

2. **Integration Tests (`tests/integration/`, Vitest)**
   - Synchronization between seat selection, Zustand store, comparison tray cap, and head-look reset
   - Rule-based seat recommendation outputs across preference presets

3. **End-to-End & Browser Tests (`tests/e2e/`, Playwright — Planned Phase 7)**
   - Desktop & mobile responsive viewports
   - Selecting seats updates 3D view & telemetry; mode switching (`2D Map` / `3D Overview` / `First-Person Seat`)
   - Keyboard navigation & reduced-motion preference verification
   - WebGL fallback rendering verification

---

## Verification Log

### Milestone 2 — Core 3D Proof of Concept (2026-11-25)
- `npm run test` (`vitest run`): **Passed** — 2 test files, 15/15 tests passed (`tests/unit/geometry.test.ts`: 11 tests; `tests/integration/store-and-recommender.test.ts`: 4 tests).
- `npm run typecheck` (`tsc --noEmit`): **Passed** — 0 TypeScript errors in strict mode.
- `npm run lint` (`eslint .`): **Passed** — 0 errors, 0 warnings.
- `npm run build` (`next build`): **Passed** — Compiled and prerendered `/` cleanly via Next.js 16.4.6 (Turbopack).
- **Known Verification Limitation**: Automated Playwright headless WebGL visual inspection has not yet been configured (scheduled for Phase 7); visual 3D inspection should be verified locally in a WebGL-enabled browser (`npm run dev` -> `http://localhost:3000`).
