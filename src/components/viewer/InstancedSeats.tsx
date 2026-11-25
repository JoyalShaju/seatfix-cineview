'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';

const COLOR_PREVIEW = new THREE.Color('#e8cf86');
const COLOR_SELECTED = new THREE.Color('#10b981');
const COLOR_HOVERED = new THREE.Color('#f5e6ba');
const COLOR_BOOKED = new THREE.Color('#101014');
const COLOR_HELD = new THREE.Color('#3b2d42');
const COLOR_STANDARD = new THREE.Color('#23242b');
const COLOR_PREMIUM = new THREE.Color('#521622');
const COLOR_RECLINER = new THREE.Color('#4a3121');
const COLOR_ACCESSIBLE = new THREE.Color('#1c4445');

/**
 * Generates a subtle stitched quilted leatherette bump map on an offscreen canvas
 * so cinema upholstery catches auditorium cove light realistically.
 */
function createQuiltedLeatherBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle leather grain noise
    for (let i = 0; i < 2400; i++) {
      const x = (i * 73) % 256;
      const y = (i * 139) % 256;
      const shade = 116 + ((i * 19) % 28);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Diamond luxury stitching grooves
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 2;
    const step = 32;
    for (let offset = -256; offset < 512; offset += step) {
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offset, 256);
      ctx.lineTo(offset + 256, 0);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Builds a rounded luxury cushion / backrest profile via ExtrudeGeometry.
 */
function createRoundedSlabGeometry(
  width: number,
  height: number,
  depth: number,
  bevelSize = 0.025,
): THREE.ExtrudeGeometry {
  const w = width - bevelSize * 2;
  const h = height - bevelSize * 2;
  const r = Math.min(0.035, w * 0.15, h * 0.15);

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

  const extrudeDepth = Math.max(0.02, depth - bevelSize * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
  });
  geo.center();
  return geo;
}

export function InstancedSeats() {
  const {
    layout,
    activePreviewSeatId,
    hoveredSeatId,
    selectedSeatIds,
    visualizationMode,
    audienceSimulationEnabled,
    assumedAudienceHeightMeters,
    setActivePreviewSeat,
    setHoveredSeat,
    toggleSeatSelection,
  } = useCineViewStore();

  const cushionRef = useRef<THREE.InstancedMesh>(null);
  const backRef = useRef<THREE.InstancedMesh>(null);
  const headrestRef = useRef<THREE.InstancedMesh>(null);
  const footrestRef = useRef<THREE.InstancedMesh>(null);
  const baseRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);
  const cupholderRef = useRef<THREE.InstancedMesh>(null);
  const audienceRef = useRef<THREE.InstancedMesh>(null);

  const seatCount = layout.seats.length;
  const reclinerSeats = useMemo(
    () => layout.seats.filter((s) => s.categoryId === 'recliner'),
    [layout.seats],
  );

  const geometries = useMemo(() => {
    const cushion = createRoundedSlabGeometry(0.49, 0.13, 0.48, 0.024);
    const back = createRoundedSlabGeometry(0.47, 0.56, 0.13, 0.026);
    const headrest = createRoundedSlabGeometry(0.36, 0.18, 0.12, 0.026);
    const footrest = createRoundedSlabGeometry(0.48, 0.09, 0.28, 0.02);
    const arm = createRoundedSlabGeometry(0.085, 0.09, 0.42, 0.018);

    return {
      cushion,
      back,
      headrest,
      footrest,
      base: new THREE.CylinderGeometry(0.11, 0.17, 0.33, 14),
      arm,
      cupholder: new THREE.CylinderGeometry(0.036, 0.032, 0.04, 14),
      head: new THREE.SphereGeometry(0.11, 14, 10),
    };
  }, []);

  const materials = useMemo(() => {
    const bumpMap = createQuiltedLeatherBumpTexture();
    const leather = new THREE.MeshStandardMaterial({
      roughness: 0.54,
      metalness: 0.08,
      bumpMap,
      bumpScale: 0.008,
    });
    const headrestMat = new THREE.MeshStandardMaterial({
      roughness: 0.46,
      metalness: 0.1,
      bumpMap,
      bumpScale: 0.005,
    });
    const armLeather = new THREE.MeshStandardMaterial({
      color: '#121114',
      roughness: 0.48,
      metalness: 0.14,
    });
    const brushedMetal = new THREE.MeshStandardMaterial({
      color: '#bfa15a',
      roughness: 0.28,
      metalness: 0.85,
    });
    const pedestalDark = new THREE.MeshStandardMaterial({
      color: '#111114',
      roughness: 0.5,
      metalness: 0.65,
    });
    const audience = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      transparent: true,
      opacity: 0.42,
      roughness: 0.7,
    });

    return {
      bumpMap,
      leather,
      headrestMat,
      armLeather,
      brushedMetal,
      pedestalDark,
      audience,
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
      materials.bumpMap.dispose();
      materials.leather.dispose();
      materials.headrestMat.dispose();
      materials.armLeather.dispose();
      materials.brushedMetal.dispose();
      materials.pedestalDark.dispose();
      materials.audience.dispose();
    };
  }, [geometries, materials]);

  // Populate static seat chassis transforms (pedestals, cushions, armrests, cupholders, footrests)
  useEffect(() => {
    const dummy = new THREE.Object3D();

    layout.seats.forEach((seat, idx) => {
      const cat = layout.categories[seat.categoryId];
      const scaleW = cat.widthMeters / 0.54;
      const scaleD = cat.depthMeters / 0.62;
      const { x, y, z } = seat.floorPosition;

      // Pedestal column
      dummy.position.set(x, y + 0.165, z + 0.03);
      dummy.rotation.set(0, seat.yawRad, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      baseRef.current?.setMatrixAt(idx, dummy.matrix);

      // Plush contoured seat pan
      dummy.position.set(x, y + cat.cushionHeightMeters - 0.035, z - 0.01);
      dummy.rotation.set(-0.04, seat.yawRad, 0);
      dummy.scale.set(scaleW, 1, scaleD);
      dummy.updateMatrix();
      cushionRef.current?.setMatrixAt(idx, dummy.matrix);

      // Pair of wide padded armrests + recessed metallic cupholders
      const armOffset = cat.widthMeters * 0.49;
      [-1, 1].forEach((side, sideIdx) => {
        const ax = x + side * armOffset * Math.cos(seat.yawRad);
        const az = z - side * armOffset * Math.sin(seat.yawRad);

        dummy.position.set(ax, y + cat.cushionHeightMeters + 0.14, az + 0.02);
        dummy.rotation.set(0, seat.yawRad, 0);
        dummy.scale.set(seat.categoryId === 'recliner' ? 1.25 : 1, 1, scaleD);
        dummy.updateMatrix();
        armRef.current?.setMatrixAt(idx * 2 + sideIdx, dummy.matrix);

        // Cupholder embedded near front tip of each armrest
        const cupLocalZ = -0.15 * scaleD;
        dummy.position.set(
          ax + cupLocalZ * Math.sin(seat.yawRad),
          y + cat.cushionHeightMeters + 0.185,
          az + cupLocalZ * Math.cos(seat.yawRad),
        );
        dummy.rotation.set(0, seat.yawRad, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cupholderRef.current?.setMatrixAt(idx * 2 + sideIdx, dummy.matrix);
      });
    });

    // LUXE Recliner footrest extensions (Row J)
    reclinerSeats.forEach((seat, idx) => {
      const cat = layout.categories[seat.categoryId];
      const { x, y, z } = seat.floorPosition;
      const footLocalZ = -0.34;
      dummy.position.set(
        x + footLocalZ * Math.sin(seat.yawRad),
        y + cat.cushionHeightMeters - 0.12,
        z + footLocalZ * Math.cos(seat.yawRad),
      );
      dummy.rotation.set(0.42, seat.yawRad, 0);
      dummy.scale.set(cat.widthMeters / 0.56, 1, 1);
      dummy.updateMatrix();
      footrestRef.current?.setMatrixAt(idx, dummy.matrix);
    });

    [baseRef, cushionRef, armRef, cupholderRef, footrestRef].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
      }
    });
  }, [layout, reclinerSeats]);

  // Backrest & winged headrest transforms; hide only the active seat's own backrest/headrest in first-person mode
  useEffect(() => {
    if (!backRef.current || !headrestRef.current) return;
    const dummy = new THREE.Object3D();

    layout.seats.forEach((seat, idx) => {
      const cat = layout.categories[seat.categoryId];
      const scaleW = cat.widthMeters / 0.54;
      const scaleD = cat.depthMeters / 0.62;
      const { x, y, z } = seat.floorPosition;
      const isHiddenOwnSeat =
        visualizationMode === 'first-person' && seat.id === activePreviewSeatId;

      const reclineTilt = seat.categoryId === 'recliner' ? 0.22 : 0.13;
      const backLocalZ = 0.22 * scaleD;

      dummy.position.set(
        x + backLocalZ * Math.sin(seat.yawRad),
        y + cat.cushionHeightMeters + 0.27,
        z + backLocalZ * Math.cos(seat.yawRad),
      );
      dummy.rotation.set(reclineTilt, seat.yawRad, 0);
      if (isHiddenOwnSeat) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.scale.set(scaleW, cat.backHeightMeters / 1.02, 1);
      }
      dummy.updateMatrix();
      backRef.current?.setMatrixAt(idx, dummy.matrix);

      // Winged headrest pillow perched cleanly atop backrest
      const headLocalZ = backLocalZ + 0.045;
      dummy.position.set(
        x + headLocalZ * Math.sin(seat.yawRad),
        y + cat.cushionHeightMeters + 0.56 * (cat.backHeightMeters / 1.02),
        z + headLocalZ * Math.cos(seat.yawRad),
      );
      dummy.rotation.set(reclineTilt * 0.6, seat.yawRad, 0);
      if (isHiddenOwnSeat) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.scale.set(scaleW, 1, 1);
      }
      dummy.updateMatrix();
      headrestRef.current?.setMatrixAt(idx, dummy.matrix);
    });

    backRef.current.instanceMatrix.needsUpdate = true;
    headrestRef.current.instanceMatrix.needsUpdate = true;
  }, [layout, activePreviewSeatId, visualizationMode]);

  // Update per-instance upholstery colors
  useEffect(() => {
    const color = new THREE.Color();
    const headrestColor = new THREE.Color();

    layout.seats.forEach((seat, idx) => {
      if (seat.id === activePreviewSeatId) {
        color.copy(COLOR_PREVIEW);
      } else if (seat.id === hoveredSeatId) {
        color.copy(COLOR_HOVERED);
      } else if (selectedSeatIds.includes(seat.id)) {
        color.copy(COLOR_SELECTED);
      } else if (seat.initialAvailability === 'booked') {
        color.copy(COLOR_BOOKED);
      } else if (seat.initialAvailability === 'held') {
        color.copy(COLOR_HELD);
      } else if (seat.categoryId === 'recliner') {
        color.copy(COLOR_RECLINER);
      } else if (seat.categoryId === 'premium') {
        color.copy(COLOR_PREMIUM);
      } else if (seat.categoryId === 'accessible') {
        color.copy(COLOR_ACCESSIBLE);
      } else {
        color.copy(COLOR_STANDARD);
      }

      headrestColor.copy(color).offsetHSL(0, 0, 0.04);

      cushionRef.current?.setColorAt(idx, color);
      backRef.current?.setColorAt(idx, color);
      headrestRef.current?.setColorAt(idx, headrestColor);
    });

    [cushionRef, backRef, headrestRef].forEach((ref) => {
      if (ref.current?.instanceColor) {
        ref.current.instanceColor.needsUpdate = true;
      }
    });
  }, [layout, activePreviewSeatId, hoveredSeatId, selectedSeatIds]);

  // Optional simulated seated audience heads in front of active seat
  const activeSeat = findSeatById(layout, activePreviewSeatId);
  useEffect(() => {
    if (!audienceSimulationEnabled || !audienceRef.current) return;
    const dummy = new THREE.Object3D();

    layout.seats.forEach((seat, idx) => {
      const isInFront = seat.floorPosition.z < activeSeat.floorPosition.z - 0.1;
      if (!isInFront) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(0.001, 0.001, 0.001);
      } else {
        const cat = layout.categories[seat.categoryId];
        dummy.position.set(
          seat.floorPosition.x + cat.eyeBackOffsetMeters * Math.sin(seat.yawRad),
          seat.floorPosition.y + assumedAudienceHeightMeters + 0.05,
          seat.floorPosition.z + cat.eyeBackOffsetMeters * Math.cos(seat.yawRad),
        );
        dummy.scale.set(1, 1.15, 1);
      }
      dummy.updateMatrix();
      audienceRef.current?.setMatrixAt(idx, dummy.matrix);
    });
    audienceRef.current.instanceMatrix.needsUpdate = true;
  }, [audienceSimulationEnabled, assumedAudienceHeightMeters, activeSeat, layout]);

  const handleSeatClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const seat = layout.seats[e.instanceId];
    if (!seat) return;
    setActivePreviewSeat(seat.id);
    if (seat.initialAvailability === 'available') {
      toggleSeatSelection(seat.id);
    }
  };

  const handleSeatMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const seat = layout.seats[e.instanceId];
    if (seat && seat.id !== hoveredSeatId) {
      setHoveredSeat(seat.id);
    }
    document.body.style.cursor = 'pointer';
  };

  const handleSeatOut = () => {
    setHoveredSeat(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group>
      <instancedMesh
        ref={baseRef}
        args={[geometries.base, materials.pedestalDark, seatCount]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={armRef}
        args={[geometries.arm, materials.armLeather, seatCount * 2]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={cupholderRef}
        args={[geometries.cupholder, materials.brushedMetal, seatCount * 2]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={cushionRef}
        args={[geometries.cushion, materials.leather, seatCount]}
        onClick={handleSeatClick}
        onPointerMove={handleSeatMove}
        onPointerOut={handleSeatOut}
        frustumCulled={false}
      />
      <instancedMesh
        ref={backRef}
        args={[geometries.back, materials.leather, seatCount]}
        onClick={handleSeatClick}
        onPointerMove={handleSeatMove}
        onPointerOut={handleSeatOut}
        frustumCulled={false}
      />
      <instancedMesh
        ref={headrestRef}
        args={[geometries.headrest, materials.headrestMat, seatCount]}
        onClick={handleSeatClick}
        onPointerMove={handleSeatMove}
        onPointerOut={handleSeatOut}
        frustumCulled={false}
      />

      {reclinerSeats.length > 0 && (
        <instancedMesh
          ref={footrestRef}
          args={[geometries.footrest, materials.armLeather, reclinerSeats.length]}
          frustumCulled={false}
        />
      )}

      {audienceSimulationEnabled && (
        <instancedMesh
          ref={audienceRef}
          args={[geometries.head, materials.audience, seatCount]}
          frustumCulled={false}
        />
      )}

      {/* Floating active seat beacon visible in 3D Overview */}
      {visualizationMode === '3d-overview' && (
        <mesh
          position={[
            activeSeat.floorPosition.x,
            activeSeat.floorPosition.y + 1.48,
            activeSeat.floorPosition.z,
          ]}
          rotation={[Math.PI, 0, 0]}
        >
          <coneGeometry args={[0.14, 0.3, 12]} />
          <meshStandardMaterial
            color="#e8cf86"
            emissive="#c9a349"
            emissiveIntensity={1.35}
          />
        </mesh>
      )}
    </group>
  );
}
