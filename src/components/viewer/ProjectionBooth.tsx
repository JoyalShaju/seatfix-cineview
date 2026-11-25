'use client';

import React from 'react';
import type { AuditoriumLayoutConfig } from '@/types/auditorium';

/**
 * Flagship 4K RGB Laser Cinema Projector & Recessed Architectural Projection Suite.
 * Positioned at the rear auditorium wall without any obstructing light-cone geometry.
 */
export function ProjectionBooth({
  layout,
  boothY,
}: {
  layout: AuditoriumLayoutConfig;
  boothY: number;
}) {
  const L = layout.dimensions.lengthMeters;
  const lensZ = L - 0.42;
  const lensY = boothY - 0.02;

  const dy = lensY - layout.screen.center.y;
  const dz = lensZ - layout.screen.center.z;
  const throwPitchRad = Math.atan2(dy, dz);

  const finOffsets = [-0.26, -0.13, 0, 0.13, 0.26];

  return (
    <group>
      {/* Recessed Architectural Projection Suite Port */}
      <group position={[0, boothY, L - 0.03]}>
        {/* Warm recessed booth interior backing */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.1, 1.18]} />
          <meshStandardMaterial
            color="#100f12"
            emissive="#241d12"
            emissiveIntensity={0.55}
            roughness={0.85}
          />
        </mesh>

        {/* Outer matte obsidian surround */}
        <mesh position={[0, 0.62, 0.01]}>
          <boxGeometry args={[3.28, 0.08, 0.1]} />
          <meshStandardMaterial color="#0b0b0e" roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0, -0.62, 0.01]}>
          <boxGeometry args={[3.28, 0.08, 0.1]} />
          <meshStandardMaterial color="#0b0b0e" roughness={0.6} metalness={0.4} />
        </mesh>

        {/* Brushed champagne-gold inner aperture trim */}
        <mesh position={[0, 0.56, -0.01]}>
          <boxGeometry args={[3.14, 0.035, 0.06]} />
          <meshStandardMaterial color="#b89446" metalness={0.88} roughness={0.24} />
        </mesh>
        <mesh position={[0, -0.56, -0.01]}>
          <boxGeometry args={[3.14, 0.035, 0.06]} />
          <meshStandardMaterial color="#b89446" metalness={0.88} roughness={0.24} />
        </mesh>
        <mesh position={[-1.55, 0, -0.01]}>
          <boxGeometry args={[0.035, 1.15, 0.06]} />
          <meshStandardMaterial color="#b89446" metalness={0.88} roughness={0.24} />
        </mesh>
        <mesh position={[1.55, 0, -0.01]}>
          <boxGeometry args={[0.035, 1.15, 0.06]} />
          <meshStandardMaterial color="#b89446" metalness={0.88} roughness={0.24} />
        </mesh>

        {/* Subtle warm interior booth accent strip */}
        <mesh position={[0, 0.52, 0.02]}>
          <boxGeometry args={[2.9, 0.018, 0.02]} />
          <meshStandardMaterial
            color="#f5e1a4"
            emissive="#d4af37"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* Flagship 4K Dual-Laser Cinema Projector */}
      <group position={[0, lensY, L - 0.25]} rotation={[-throwPitchRad, 0, 0]}>
        {/* Precision Gimbal Pedestal & Machined Baseplate */}
        <mesh position={[0, -0.44, 0.12]}>
          <boxGeometry args={[0.72, 0.05, 0.78]} />
          <meshStandardMaterial color="#18191f" metalness={0.78} roughness={0.32} />
        </mesh>
        {[-0.2, 0.2].map((sx) => (
          <mesh key={`strut-${sx}`} position={[sx, -0.32, 0.12]}>
            <cylinderGeometry args={[0.045, 0.055, 0.22, 16]} />
            <meshStandardMaterial color="#383b44" metalness={0.85} roughness={0.26} />
          </mesh>
        ))}

        {/* Lower Optical Engine Chassis (matte anodized slate) */}
        <mesh position={[0, -0.06, 0.12]}>
          <boxGeometry args={[1.18, 0.36, 1.02]} />
          <meshStandardMaterial color="#1d2028" metalness={0.58} roughness={0.36} />
        </mesh>

        {/* Upper Laser Cooling & Exhaust Crown (brushed gunmetal) */}
        <mesh position={[0, 0.2, 0.15]}>
          <boxGeometry args={[1.06, 0.2, 0.9]} />
          <meshStandardMaterial color="#2a2d36" metalness={0.68} roughness={0.32} />
        </mesh>

        {/* Machined Side Heat-Sink Cooling Fins */}
        {finOffsets.map((fz) => (
          <React.Fragment key={`fin-${fz}`}>
            <mesh position={[-0.6, -0.03, fz + 0.12]}>
              <boxGeometry args={[0.04, 0.26, 0.045]} />
              <meshStandardMaterial color="#424654" metalness={0.8} roughness={0.28} />
            </mesh>
            <mesh position={[0.6, -0.03, fz + 0.12]}>
              <boxGeometry args={[0.04, 0.26, 0.045]} />
              <meshStandardMaterial color="#424654" metalness={0.8} roughness={0.28} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Champagne-Gold Front Brand Fascia & Precision Bezel */}
        <mesh position={[0, 0.15, -0.395]}>
          <boxGeometry args={[1.12, 0.035, 0.025]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.21, -0.395]}>
          <boxGeometry args={[1.14, 0.022, 0.025]} />
          <meshStandardMaterial color="#8f7a4b" metalness={0.85} roughness={0.28} />
        </mesh>

        {/* Laser Lock & Calibration Telemetry LEDs */}
        <mesh position={[0.42, -0.1, -0.395]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#16a34a"
            emissiveIntensity={2.0}
          />
        </mesh>
        <mesh position={[0.48, -0.1, -0.395]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial
            color="#e8cf86"
            emissive="#d4af37"
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* Machined Turret Lens Mount Plate */}
        <mesh position={[0, 0.01, -0.41]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.25, 0.05, 32]} />
          <meshStandardMaterial color="#15171d" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Outer Stepped Titanium Lens Barrel */}
        <mesh position={[0, 0.01, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.205, 0.16, 32]} />
          <meshStandardMaterial color="#363a45" metalness={0.84} roughness={0.24} />
        </mesh>

        {/* Dual Brushed-Brass Focus & Zoom Control Rings */}
        <mesh position={[0, 0.01, -0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.208, 0.208, 0.028, 32]} />
          <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.01, -0.59]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.162, 0.162, 0.026, 32]} />
          <meshStandardMaterial color="#c9a349" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Inner Matte Baffle Barrel & Recessed Optical Hood */}
        <mesh position={[0, 0.01, -0.63]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.145, 0.158, 0.16, 32]} />
          <meshStandardMaterial color="#0e1015" metalness={0.75} roughness={0.32} />
        </mesh>

        {/* Multi-Coated Objective Glass + Crisp Glowing Laser Aperture */}
        <mesh position={[0, 0.01, -0.712]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.128, 32]} />
          <meshStandardMaterial
            color="#d8ecff"
            emissive="#f5e6ba"
            emissiveIntensity={1.6}
            roughness={0.08}
            metalness={0.35}
          />
        </mesh>
        <mesh position={[0, 0.01, -0.716]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.068, 24]} />
          <meshStandardMaterial
            color="#fffdf5"
            emissive="#fff3d1"
            emissiveIntensity={3.2}
            roughness={0.05}
          />
        </mesh>

        {/* Dedicated Subtle Accent Light on Projector Chassis & Lens */}
        <pointLight
          position={[0, 0.25, -0.95]}
          color="#f6e4b4"
          intensity={2.4}
          distance={4.5}
          decay={2}
        />
      </group>
    </group>
  );
}
