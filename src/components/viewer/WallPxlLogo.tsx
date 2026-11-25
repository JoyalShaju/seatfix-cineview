'use client';

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

function createLetterPGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  // Outer silhouette of P (width ~0.34, height 0.52, centered vertically [-0.26, +0.26])
  shape.moveTo(-0.16, -0.26);
  shape.lineTo(-0.06, -0.26);
  shape.lineTo(-0.06, -0.02);
  shape.lineTo(0.06, -0.02);
  shape.quadraticCurveTo(0.21, -0.02, 0.21, 0.12);
  shape.quadraticCurveTo(0.21, 0.26, 0.06, 0.26);
  shape.lineTo(-0.16, 0.26);
  shape.closePath();

  // Inner counter hole of P
  const hole = new THREE.Path();
  hole.moveTo(-0.06, 0.06);
  hole.lineTo(0.05, 0.06);
  hole.quadraticCurveTo(0.12, 0.06, 0.12, 0.12);
  hole.quadraticCurveTo(0.12, 0.18, 0.05, 0.18);
  hole.lineTo(-0.06, 0.18);
  hole.closePath();
  shape.holes.push(hole);

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
}

function createBracketGeometry(side: 'left' | 'right'): THREE.ExtrudeGeometry {
  const s = side === 'left' ? 1 : -1;
  const shape = new THREE.Shape();
  // Tall architectural bracket [ or ] (height 0.60)
  shape.moveTo(s * -0.06, -0.3);
  shape.lineTo(s * 0.08, -0.3);
  shape.lineTo(s * 0.08, -0.23);
  shape.lineTo(s * 0.01, -0.23);
  shape.lineTo(s * 0.01, 0.23);
  shape.lineTo(s * 0.08, 0.23);
  shape.lineTo(s * 0.08, 0.3);
  shape.lineTo(s * -0.06, 0.3);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 1,
  });
}

function createLetterLGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.14, -0.24);
  shape.lineTo(0.14, -0.24);
  shape.lineTo(0.14, -0.155);
  shape.lineTo(-0.045, -0.155);
  shape.lineTo(-0.045, 0.24);
  shape.lineTo(-0.14, 0.24);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 1,
  });
}

/**
 * Architectural illuminated "P[XL]" wall emblem.
 * "P" and "[ ]" match the warm champagne-gold wall strip lights,
 * while "XL" glows in crisp architectural white.
 */
export function WallPxlLogo({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  const assets = useMemo(() => {
    const letterP = createLetterPGeometry();
    const leftBracket = createBracketGeometry('left');
    const rightBracket = createBracketGeometry('right');
    const letterL = createLetterLGeometry();
    const xStroke = new THREE.BoxGeometry(0.085, 0.54, 0.035);
    const plaque = new THREE.BoxGeometry(2.15, 0.86, 0.03);

    // Matches ProceduralAuditoriumShell wall strip lights exactly
    const goldLightMat = new THREE.MeshStandardMaterial({
      color: '#f3df9e',
      emissive: '#c99c3c',
      emissiveIntensity: 1.05,
      roughness: 0.3,
      metalness: 0.4,
    });

    const whiteLightMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#f8fafc',
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.1,
    });

    const plaqueMat = new THREE.MeshStandardMaterial({
      color: '#09090c',
      roughness: 0.88,
      metalness: 0.25,
    });

    return {
      geometries: [letterP, leftBracket, rightBracket, letterL, xStroke, plaque],
      materials: [goldLightMat, whiteLightMat, plaqueMat],
      letterP,
      leftBracket,
      rightBracket,
      letterL,
      xStroke,
      plaque,
      goldLightMat,
      whiteLightMat,
      plaqueMat,
    };
  }, []);

  useEffect(() => {
    return () => {
      assets.geometries.forEach((g) => g.dispose());
      assets.materials.forEach((m) => m.dispose());
    };
  }, [assets]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Matte obsidian backing plaque */}
      <mesh
        geometry={assets.plaque}
        material={assets.plaqueMat}
        position={[0, 0, -0.015]}
      />

      {/* Gold "P" */}
      <mesh
        geometry={assets.letterP}
        material={assets.goldLightMat}
        position={[-0.64, 0, 0.005]}
      />

      {/* Gold "[" */}
      <mesh
        geometry={assets.leftBracket}
        material={assets.goldLightMat}
        position={[-0.3, 0, 0.005]}
      />

      {/* White "X" (two crisp intersecting strokes) */}
      <group position={[0.02, 0, 0.02]}>
        <mesh
          geometry={assets.xStroke}
          material={assets.whiteLightMat}
          rotation={[0, 0, 0.52]}
        />
        <mesh
          geometry={assets.xStroke}
          material={assets.whiteLightMat}
          rotation={[0, 0, -0.52]}
        />
      </group>

      {/* White "L" */}
      <mesh
        geometry={assets.letterL}
        material={assets.whiteLightMat}
        position={[0.42, 0, 0.005]}
      />

      {/* Gold "]" */}
      <mesh
        geometry={assets.rightBracket}
        material={assets.goldLightMat}
        position={[0.72, 0, 0.005]}
      />
    </group>
  );
}
