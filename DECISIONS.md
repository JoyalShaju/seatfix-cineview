# CineView 3D — Architectural Decision Log

## ADR-001: Right-Handed Meter Coordinate System (`1 unit = 1m`)
- **Context**: Geometry calculations, Three.js rendering, and physical theatre calibration must share exact units and axes without conversion drift.
- **Decision**: Adopt Three.js native right-handed Y-up coordinates in meters (`+X` right, `+Y` up, `+Z` rear, `-Z` toward screen, `Y=0` front floor datum, `Z=0` front wall).
- **Consequences**: Direct 1:1 mapping between `GEOMETRY.md` formulas, unit tests, DB seat columns, and Three.js `Vector3`/`PerspectiveCamera`.

## ADR-002: React 19 + `@react-three/fiber` v9 + Next.js 16
- **Context**: Latest Next.js (`16.4.6`) ships with React 19 (`19.3.1`). `@react-three/fiber` v8 only supports React 18, while v9.8.x officially targets React 19.
- **Decision**: Use Next.js 16.4.x + React 19.3.x + `@react-three/fiber` 9.8.x + `@react-three/drei` 10.7.x + `three` 0.187.x, with `transpilePackages: ['three']` and client-only dynamic `<Canvas>` loading (`ssr: false`).
- **Consequences**: Avoids peer dependency conflicts and future-proofs the frontend without alpha/experimental WebGPU libraries (avoiding R3F v10 alpha).

## ADR-003: Pure TypeScript Geometry Module Decoupled from React/Three
- **Context**: Viewing angles, seat eye poses, and obstruction checks must be unit-tested fast in Node without a WebGL context or DOM.
- **Decision**: Keep `src/lib/geometry/` strictly pure TypeScript (zero `react`, `three`, or `window` imports).
- **Consequences**: Sub-millisecond Vitest execution, reusable on both Next.js server routes (recommendations/validation) and client 3D scene.

## ADR-004: Better Auth 1.x Over NextAuth v5 Beta
- **Context**: The prompt specifies Auth.js or an equivalent mature authentication library compatible with the selected framework, avoiding beta/alpha dependencies where stable options exist. NextAuth v5 remains tagged `@beta` for App Router, whereas `better-auth` 1.x is stable.
- **Decision**: Standardize on `better-auth@1.x` with Prisma adapter when introducing authentication in Phase 5.
- **Consequences**: Full App Router Server Component / Route Handler ergonomics without relying on beta packages.

## ADR-005: Prisma 7.x Stable Over Prisma 8 RC
- **Context**: `prisma@latest` currently resolves to `8.0.0-rc.35`, whereas `7.10.1` is the stable production line (`prev` tag).
- **Decision**: Pin Prisma to stable `7.10.x` in Phase 5 to honor the stability requirement.

## ADR-006: Instanced Rendering & Procedural-First Digital Twin
- **Context**: Rendering 100–300+ individual multi-mesh seats as separate React components creates excessive WebGL draw calls on consumer laptops/phones.
- **Decision**: Build a procedural generator in Phase 2 using `THREE.InstancedMesh` for seat bases, cushions, backrests, and armrests (with per-instance color/status attribute), backed by `AuditoriumLayoutConfig` JSON/DB schemas that support optional glTF/GLB overrides later.
- **Consequences**: Keeps seat draw calls to ~4–6 total regardless of auditorium size while maintaining individual clickable/hoverable `instanceId` picking.
