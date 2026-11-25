'use client';

import React, { useMemo } from 'react';
import type { AuditoriumLayoutConfig, GraphicsQuality } from '@/types/auditorium';
import { ProjectionBooth } from './ProjectionBooth';
import { WallPxlLogo } from './WallPxlLogo';

export function ProceduralAuditoriumShell({
  layout,
  graphicsQuality,
}: {
  layout: AuditoriumLayoutConfig;
  graphicsQuality: GraphicsQuality;
}) {
  const { widthMeters: W, lengthMeters: L, frontHeightMeters: H } = layout.dimensions;

  const sideRibZs = useMemo(() => [2.2, 4.4, 6.6, 8.8, 11.0, 13.2, 15.4, 17.6], []);
  const surroundSpeakerZs = useMemo(() => [6.2, 9.8, 13.4, 16.8], []);
  const ceilingBaffleZs = useMemo(() => [2.4, 5.2, 8.0, 10.8, 13.6, 16.4], []);

  const lastRow = layout.rows[layout.rows.length - 1]!;
  const rearWalkwayY = lastRow.floorYMeters;
  const rearWalkwayStartZ = lastRow.zMeters + lastRow.riserDepthMeters / 2;
  const rearWalkwayDepth = Math.max(1.2, L - rearWalkwayStartZ);

  return (
    <group>
      {/* Auditorium Luxury 2700K Mood Lighting */}
      <ambientLight intensity={0.44} color="#e7e2d8" />
      <hemisphereLight args={['#a88e5a', '#070709', 0.48]} />
      <directionalLight
        position={[0, H - 0.6, L * 0.45]}
        intensity={0.46}
        color="#f5dfb3"
        castShadow={graphicsQuality === 'high'}
      />

      {/* Front Pit Floor & Stage Skirt */}
      <mesh position={[0, -0.05, L / 2]} receiveShadow={graphicsQuality === 'high'}>
        <boxGeometry args={[W, 0.1, L]} />
        <meshStandardMaterial color="#0b0b0e" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* PXL-style Architectural Screen Wing Coves & Stage Subwoofer Plinth */}
      <mesh position={[0, 0.72, 0.48]}>
        <boxGeometry args={[layout.screen.widthMeters + 1.6, 1.44, 0.42]} />
        <meshStandardMaterial color="#060608" roughness={0.9} metalness={0.15} />
      </mesh>
      {[-1, 1].map((side) => (
        <React.Fragment key={`screen-wing-${side}`}>
          <mesh position={[side * (layout.screen.widthMeters / 2 + 1.1), H / 2, 0.55]}>
            <boxGeometry args={[1.4, H, 0.45]} />
            <meshStandardMaterial color="#0a090c" roughness={0.85} />
          </mesh>
          <mesh position={[side * (layout.screen.widthMeters / 2 + 0.42), H / 2, 0.78]}>
            <boxGeometry args={[0.035, H - 0.8, 0.035]} />
            <meshStandardMaterial
              color="#e8cf86"
              emissive="#b69142"
              emissiveIntensity={1.05}
            />
          </mesh>
        </React.Fragment>
      ))}

      {/* Stepped Stadium Risers & Warm Champagne Step Lighting */}
      {layout.rows.map((row) => {
        const blockHeight = Math.max(0.12, row.floorYMeters + 0.1);
        const centerY = row.floorYMeters - blockHeight / 2;
        return (
          <group key={row.rowLabel}>
            <mesh
              position={[0, centerY, row.zMeters]}
              receiveShadow={graphicsQuality === 'high'}
            >
              <boxGeometry args={[W - 0.1, blockHeight, row.riserDepthMeters]} />
              <meshStandardMaterial color="#111015" roughness={0.9} metalness={0.05} />
            </mesh>

            {layout.aisles.map((aisle) => (
              <mesh
                key={`${row.rowLabel}-${aisle.id}-led`}
                position={[
                  aisle.centerXMeters,
                  row.floorYMeters + 0.008,
                  row.zMeters - row.riserDepthMeters / 2 + 0.04,
                ]}
              >
                <boxGeometry args={[aisle.widthMeters * 0.82, 0.014, 0.035]} />
                <meshStandardMaterial
                  color="#f0d790"
                  emissive="#c99c3c"
                  emissiveIntensity={1.15}
                  roughness={0.4}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Rear LUXE Lobby Walkway */}
      <mesh position={[0, rearWalkwayY / 2, rearWalkwayStartZ + rearWalkwayDepth / 2]}>
        <boxGeometry args={[W - 0.1, Math.max(0.15, rearWalkwayY), rearWalkwayDepth]} />
        <meshStandardMaterial color="#0d0d11" roughness={0.92} />
      </mesh>

      {/* Brushed-Brass Aisle Handrails */}
      {layout.aisles.map((aisle) => {
        const startZ = layout.rows[2]!.zMeters;
        const startY = layout.rows[2]!.floorYMeters + 0.88;
        const endZ = lastRow.zMeters;
        const endY = lastRow.floorYMeters + 0.88;
        const dz = endZ - startZ;
        const dy = endY - startY;
        const railLen = Math.hypot(dz, dy);
        const slopeAngle = Math.atan2(dy, dz);

        return (
          <mesh
            key={aisle.id}
            position={[aisle.centerXMeters, (startY + endY) / 2, (startZ + endZ) / 2]}
            rotation={[-slopeAngle, 0, 0]}
          >
            <boxGeometry args={[0.048, 0.048, railLen]} />
            <meshStandardMaterial color="#8f7a4b" metalness={0.84} roughness={0.28} />
          </mesh>
        );
      })}

      {/* Front Safety Rails / Configured Obstacles */}
      {layout.obstacles.map((obs) => (
        <mesh key={obs.id} position={[obs.center.x, obs.center.y, obs.center.z]}>
          <boxGeometry args={[obs.size.x, obs.size.y, obs.size.z]} />
          <meshStandardMaterial color="#2a2826" metalness={0.68} roughness={0.35} />
        </mesh>
      ))}

      {/* Front & Rear Enclosure Walls */}
      <mesh position={[0, H / 2, -0.05]}>
        <boxGeometry args={[W, H, 0.1]} />
        <meshStandardMaterial color="#050507" roughness={0.95} />
      </mesh>
      <mesh position={[0, H / 2, L + 0.05]}>
        <boxGeometry args={[W, H, 0.1]} />
        <meshStandardMaterial color="#09090c" roughness={0.92} />
      </mesh>

      {/* Rear Laser Projection Booth + 3D Projector + Rear Surround Speakers */}
      <ProjectionBooth
        layout={layout}
        boothY={Math.min(H - 1.35, rearWalkwayY + 2.35)}
      />
      {[-3.6, 3.6].map((sx) => (
        <mesh key={`rear-spk-${sx}`} position={[sx, rearWalkwayY + 2.3, L - 0.12]}>
          <boxGeometry args={[0.38, 0.56, 0.24]} />
          <meshStandardMaterial color="#0d0d10" roughness={0.7} metalness={0.25} />
        </mesh>
      ))}

      {/* Side Acoustic Walls */}
      <mesh position={[-W / 2 - 0.05, H / 2, L / 2]}>
        <boxGeometry args={[0.1, H, L]} />
        <meshStandardMaterial color="#08080b" roughness={0.94} />
      </mesh>
      <mesh position={[W / 2 + 0.05, H / 2, L / 2]}>
        <boxGeometry args={[0.1, H, L]} />
        <meshStandardMaterial color="#08080b" roughness={0.94} />
      </mesh>

      {/* Horizontal Warm Architectural Cove Strips along Side Walls */}
      {[-W / 2 + 0.12, W / 2 - 0.12].map((wallX, idx) => (
        <mesh key={`cove-${idx}`} position={[wallX, H - 1.15, L / 2]}>
          <boxGeometry args={[0.04, 0.045, L - 2.4]} />
          <meshStandardMaterial
            color="#f0d790"
            emissive="#c99c3c"
            emissiveIntensity={0.95}
          />
        </mesh>
      ))}

      {/* Illuminated P[XL] Architectural Wall Logos on Left and Right Walls */}
      <WallPxlLogo position={[-W / 2 + 0.06, 4.35, 7.7]} rotationY={Math.PI / 2} />
      <WallPxlLogo position={[W / 2 - 0.06, 4.35, 7.7]} rotationY={-Math.PI / 2} />

      {/* Ribbed Acoustic Wall Panels & Warm Sconces */}
      {sideRibZs.map((zPos) => (
        <React.Fragment key={`pilaster-${zPos}`}>
          <mesh position={[-W / 2 + 0.12, H / 2, zPos]}>
            <boxGeometry args={[0.22, H - 0.3, 0.42]} />
            <meshStandardMaterial color="#121116" roughness={0.88} />
          </mesh>
          <mesh position={[W / 2 - 0.12, H / 2, zPos]}>
            <boxGeometry args={[0.22, H - 0.3, 0.42]} />
            <meshStandardMaterial color="#121116" roughness={0.88} />
          </mesh>

          <mesh position={[-W / 2 + 0.24, 3.1, zPos]}>
            <boxGeometry args={[0.03, 0.55, 0.06]} />
            <meshStandardMaterial
              color="#f3df9e"
              emissive="#c99c3c"
              emissiveIntensity={1.0}
            />
          </mesh>
          <mesh position={[W / 2 - 0.24, 3.1, zPos]}>
            <boxGeometry args={[0.03, 0.55, 0.06]} />
            <meshStandardMaterial
              color="#f3df9e"
              emissive="#c99c3c"
              emissiveIntensity={1.0}
            />
          </mesh>
        </React.Fragment>
      ))}

      {/* Atmos Side Surround Speaker Enclosures */}
      {surroundSpeakerZs.map((zPos, i) => (
        <React.Fragment key={`spk-${zPos}`}>
          <mesh
            position={[-W / 2 + 0.22, 2.75 + i * 0.48, zPos]}
            rotation={[0, 0, -0.25]}
          >
            <boxGeometry args={[0.22, 0.48, 0.34]} />
            <meshStandardMaterial color="#0c0c10" roughness={0.6} metalness={0.35} />
          </mesh>
          <mesh
            position={[W / 2 - 0.22, 2.75 + i * 0.48, zPos]}
            rotation={[0, 0, 0.25]}
          >
            <boxGeometry args={[0.22, 0.48, 0.34]} />
            <meshStandardMaterial color="#0c0c10" roughness={0.6} metalness={0.35} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Front Emergency Exit Doors + Illuminated Green EXIT Signs */}
      {[-W / 2 + 0.08, W / 2 - 0.08].map((doorX, idx) => (
        <group key={`exit-${idx}`} position={[doorX, 1.15, 2.0]}>
          <mesh>
            <boxGeometry args={[0.08, 2.2, 1.05]} />
            <meshStandardMaterial color="#141418" roughness={0.7} />
          </mesh>
          <mesh position={[idx === 0 ? 0.08 : -0.08, 1.32, 0]}>
            <boxGeometry args={[0.04, 0.2, 0.42]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#16a34a"
              emissiveIntensity={1.6}
            />
          </mesh>
        </group>
      ))}

      {/* Ceiling & Recessed Acoustic Coffer Baffles */}
      <mesh position={[0, H + 0.05, L / 2]}>
        <boxGeometry args={[W, 0.1, L]} />
        <meshStandardMaterial color="#040406" roughness={0.96} />
      </mesh>
      {ceilingBaffleZs.map((zPos) => (
        <group key={`baffle-${zPos}`}>
          <mesh position={[0, H - 0.2, zPos]}>
            <boxGeometry args={[W - 1.0, 0.34, 0.18]} />
            <meshStandardMaterial color="#0d0d11" roughness={0.92} />
          </mesh>
          <mesh position={[0, H - 0.38, zPos]}>
            <boxGeometry args={[W - 3.0, 0.02, 0.04]} />
            <meshStandardMaterial
              color="#e8cf86"
              emissive="#b69142"
              emissiveIntensity={0.55}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
