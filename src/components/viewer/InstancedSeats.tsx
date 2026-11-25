'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';
import { createSeatUpholsteryTextures } from './seatTextures';

const COLOR_PREVIEW = new THREE.Color('#d4af37');
const COLOR_SELECTED = new THREE.Color('#10b981');
const COLOR_HOVERED = new THREE.Color('#cbd5e1');
const COLOR_BOOKED = new THREE.Color('#202329');
const COLOR_HELD = new THREE.Color('#4d525c');
const COLOR_STANDARD = new THREE.Color('#5b606b');
const COLOR_PREMIUM = new THREE.Color('#434750');
const COLOR_RECLINER = new THREE.Color('#767b85');
const COLOR_ACCESSIBLE = new THREE.Color('#3f585b');

/**
 * Ergonomic waterfall seat pan extruded laterally so the front knee lip curves downward.
 */
function createWaterfallCushionGeometry(width: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  // Side profile in XY (X = depth front-to-back, Y = thickness), then rotated to face -Z
  shape.moveTo(-0.24, -0.055);
  shape.lineTo(0.16, -0.055);
  shape.quadraticCurveTo(0.24, -0.055, 0.25, -0.01);
  shape.quadraticCurveTo(0.25, 0.055, 0.17, 0.068);
  shape.lineTo(-0.18, 0.052);
  shape.quadraticCurveTo(-0.25, 0.045, -0.25, -0.01);
  shape.quadraticCurveTo(-0.25, -0.055, -0.24, -0.055);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width - 0.05,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 3,
  });
  geo.center();
  // Rotate so the waterfall front edge (+X in shape) points toward -Z (viewer front)
  geo.rotateY(Math.PI / 2);
  return geo;
}

/**
 * Contoured high-back lumbar panel with gently tapered shoulders.
 */
function createTailoredBackrestGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.21, -0.27);
  shape.lineTo(0.21, -0.27);
  shape.quadraticCurveTo(0.23, 0.02, 0.195, 0.25);
  shape.quadraticCurveTo(0.18, 0.29, 0.0, 0.3);
  shape.quadraticCurveTo(-0.18, 0.29, -0.195, 0.25);
  shape.quadraticCurveTo(-0.23, 0.02, -0.21, -0.27);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.024,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

/**
 * Plush curved winged headrest pillow.
 */
function createHeadrestPillowGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.17, -0.075);
  shape.quadraticCurveTo(0, -0.095, 0.17, -0.075);
  shape.quadraticCurveTo(0.2, 0, 0.16, 0.08);
  shape.quadraticCurveTo(0, 0.105, -0.16, 0.08);
  shape.quadraticCurveTo(-0.2, 0, -0.17, -0.075);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.085,
    bevelEnabled: true,
    bevelThickness: 0.026,
    bevelSize: 0.022,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

/**
 * Curved luxury armrest side profile (front knuckle curls gracefully downward).
 */
function createSculptedArmrestGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.19, -0.04);
  shape.lineTo(0.15, -0.04);
  shape.quadraticCurveTo(0.22, -0.04, 0.23, 0.01);
  shape.quadraticCurveTo(0.22, 0.055, 0.14, 0.055);
  shape.lineTo(-0.17, 0.048);
  shape.quadraticCurveTo(-0.21, 0.042, -0.21, 0);
  shape.quadraticCurveTo(-0.21, -0.04, -0.19, -0.04);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.062,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.014,
    bevelSegments: 2,
  });
  geo.center();
  geo.rotateY(Math.PI / 2);
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
  const bolsterRef = useRef<THREE.InstancedMesh>(null);
  const headrestRef = useRef<THREE.InstancedMesh>(null);
  const trimRef = useRef<THREE.InstancedMesh>(null);
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
    const cushion = createWaterfallCushionGeometry(0.49);
    const back = createTailoredBackrestGeometry();
    const bolster = new THREE.CapsuleGeometry(0.042, 0.38, 6, 10);
    const headrest = createHeadrestPillowGeometry();
    const trim = new THREE.BoxGeometry(0.36, 0.016, 0.018);
    const footrest = createWaterfallCushionGeometry(0.47);
    const arm = createSculptedArmrestGeometry();

    return {
      cushion,
      back,
      bolster,
      headrest,
      trim,
      footrest,
      base: new THREE.CylinderGeometry(0.095, 0.16, 0.32, 16),
      arm,
      cupholder: new THREE.TorusGeometry(0.032, 0.008, 10, 20),
      head: new THREE.SphereGeometry(0.11, 14, 10),
    };
  }, []);

  const materials = useMemo(() => {
    const tex = createSeatUpholsteryTextures();

    // Matte velvet / tailored upholstery with cool-silver fabric sheen (zero cream tint)
    const velvet = new THREE.MeshPhysicalMaterial({
      map: tex.albedoDetailMap,
      bumpMap: tex.bumpMap,
      bumpScale: 0.016,
      roughnessMap: tex.roughnessMap,
      roughness: 0.9,
      metalness: 0.0,
      sheen: 0.36,
      sheenRoughness: 0.78,
      sheenColor: new THREE.Color('#cbd5e1'),
    });

    const headrestMat = new THREE.MeshPhysicalMaterial({
      map: tex.albedoDetailMap,
      bumpMap: tex.bumpMap,
      bumpScale: 0.01,
      roughnessMap: tex.roughnessMap,
      roughness: 0.85,
      metalness: 0.0,
      sheen: 0.34,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color('#dce2eb'),
    });

    // Dark ash-slate outer bolsters & sculpted armrests
    const bolsterMat = new THREE.MeshStandardMaterial({
      color: '#2c2e34',
      bumpMap: tex.bumpMap,
      bumpScale: 0.008,
      roughness: 0.72,
      metalness: 0.04,
    });

    const armLeather = new THREE.MeshStandardMaterial({
      color: '#2f3137',
      roughness: 0.68,
      metalness: 0.05,
    });

    const brushedBrass = new THREE.MeshStandardMaterial({
      color: '#d4b468',
      roughness: 0.28,
      metalness: 0.88,
    });

    const pedestalDark = new THREE.MeshStandardMaterial({
      color: '#18191f',
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
      tex,
      velvet,
      headrestMat,
      bolsterMat,
      armLeather,
      brushedBrass,
      pedestalDark,
      audience,
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
      materials.tex.dispose();
      materials.velvet.dispose();
      materials.headrestMat.dispose();
      materials.bolsterMat.dispose();
      materials.armLeather.dispose();
      materials.brushedBrass.dispose();
      materials.pedestalDark.dispose();
      materials.audience.dispose();
    };
  }, [geometries, materials]);

  // Populate static seat chassis transforms
  useEffect(() => {
    const dummy = new THREE.Object3D();

    layout.seats.forEach((seat, idx) => {
      const cat = layout.categories[seat.categoryId];
      const scaleW = cat.widthMeters / 0.54;
      const scaleD = cat.depthMeters / 0.62;
      const { x, y, z } = seat.floorPosition;

      // Pedestal column
      dummy.position.set(x, y + 0.16, z + 0.03);
      dummy.rotation.set(0, seat.yawRad, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      baseRef.current?.setMatrixAt(idx, dummy.matrix);

      // Waterfall contoured seat pan
      dummy.position.set(x, y + cat.cushionHeightMeters - 0.035, z - 0.02);
      dummy.rotation.set(-0.04, seat.yawRad, 0);
      dummy.scale.set(scaleW, 1, scaleD);
      dummy.updateMatrix();
      cushionRef.current?.setMatrixAt(idx, dummy.matrix);

      // Sculpted armrests + recessed brushed-brass cupholder rings
      const armOffset = cat.widthMeters * 0.49;
      [-1, 1].forEach((side, sideIdx) => {
        const ax = x + side * armOffset * Math.cos(seat.yawRad);
        const az = z - side * armOffset * Math.sin(seat.yawRad);

        dummy.position.set(ax, y + cat.cushionHeightMeters + 0.135, az + 0.01);
        dummy.rotation.set(0, seat.yawRad, 0);
        dummy.scale.set(seat.categoryId === 'recliner' ? 1.2 : 1, 1, scaleD);
        dummy.updateMatrix();
        armRef.current?.setMatrixAt(idx * 2 + sideIdx, dummy.matrix);

        // Cupholder ring embedded cleanly into armrest top
        const cupLocalZ = -0.15 * scaleD;
        dummy.position.set(
          ax + cupLocalZ * Math.sin(seat.yawRad),
          y + cat.cushionHeightMeters + 0.188,
          az + cupLocalZ * Math.cos(seat.yawRad),
        );
        dummy.rotation.set(Math.PI / 2, 0, seat.yawRad);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cupholderRef.current?.setMatrixAt(idx * 2 + sideIdx, dummy.matrix);
      });
    });

    // LUXE Sofa extended ottoman legrests (Row J)
    reclinerSeats.forEach((seat, idx) => {
      const cat = layout.categories[seat.categoryId];
      const { x, y, z } = seat.floorPosition;
      const footLocalZ = -0.4;
      dummy.position.set(
        x + footLocalZ * Math.sin(seat.yawRad),
        y + cat.cushionHeightMeters - 0.09,
        z + footLocalZ * Math.cos(seat.yawRad),
      );
      dummy.rotation.set(0.28, seat.yawRad, 0);
      dummy.scale.set(cat.widthMeters / 0.5, 0.85, 0.72);
      dummy.updateMatrix();
      footrestRef.current?.setMatrixAt(idx, dummy.matrix);
    });

    [baseRef, cushionRef, armRef, cupholderRef, footrestRef].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
      }
    });
  }, [layout, reclinerSeats]);

  // Backrest, side bolsters, winged headrest, and rear brass shoulder trim
  useEffect(() => {
    if (
      !backRef.current ||
      !bolsterRef.current ||
      !headrestRef.current ||
      !trimRef.current
    ) {
      return;
    }
    const dummy = new THREE.Object3D();

    layout.seats.forEach((seat, idx) => {
      const cat = layout.categories[seat.categoryId];
      const scaleW = cat.widthMeters / 0.54;
      const scaleD = cat.depthMeters / 0.62;
      const { x, y, z } = seat.floorPosition;
      const isHiddenOwnSeat =
        visualizationMode === 'first-person' && seat.id === activePreviewSeatId;

      const reclineTilt = seat.categoryId === 'recliner' ? 0.22 : 0.13;
      const backLocalZ = 0.21 * scaleD;
      const backCenterY = y + cat.cushionHeightMeters + 0.27;

      // Main lumbar backrest
      dummy.position.set(
        x + backLocalZ * Math.sin(seat.yawRad),
        backCenterY,
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

      // Left & right angled leather side-support bolsters
      const bolsterOffsetX = 0.215 * scaleW;
      [-1, 1].forEach((side, sideIdx) => {
        const bx = x + backLocalZ * Math.sin(seat.yawRad) + side * bolsterOffsetX * Math.cos(seat.yawRad);
        const bz = z + backLocalZ * Math.cos(seat.yawRad) - side * bolsterOffsetX * Math.sin(seat.yawRad) - 0.02;
        dummy.position.set(bx, backCenterY - 0.02, bz);
        dummy.rotation.set(reclineTilt, seat.yawRad, side * -0.05);
        if (isHiddenOwnSeat) {
          dummy.scale.set(0, 0, 0);
        } else {
          dummy.scale.set(1, cat.backHeightMeters / 1.02, 1);
        }
        dummy.updateMatrix();
        bolsterRef.current?.setMatrixAt(idx * 2 + sideIdx, dummy.matrix);
      });

      // Tailored curved headrest pillow
      const headLocalZ = backLocalZ + 0.05;
      dummy.position.set(
        x + headLocalZ * Math.sin(seat.yawRad),
        y + cat.cushionHeightMeters + 0.56 * (cat.backHeightMeters / 1.02),
        z + headLocalZ * Math.cos(seat.yawRad),
      );
      dummy.rotation.set(reclineTilt * 0.55, seat.yawRad, 0);
      if (isHiddenOwnSeat) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.scale.set(scaleW, 1, 1);
      }
      dummy.updateMatrix();
      headrestRef.current?.setMatrixAt(idx, dummy.matrix);

      // Brushed-brass shoulder inlay accent strip on seat back
      const trimLocalZ = backLocalZ + 0.075;
      dummy.position.set(
        x + trimLocalZ * Math.sin(seat.yawRad),
        y + cat.cushionHeightMeters + 0.44 * (cat.backHeightMeters / 1.02),
        z + trimLocalZ * Math.cos(seat.yawRad),
      );
      dummy.rotation.set(reclineTilt, seat.yawRad, 0);
      if (isHiddenOwnSeat) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.scale.set(scaleW, 1, 1);
      }
      dummy.updateMatrix();
      trimRef.current?.setMatrixAt(idx, dummy.matrix);
    });

    backRef.current.instanceMatrix.needsUpdate = true;
    bolsterRef.current.instanceMatrix.needsUpdate = true;
    headrestRef.current.instanceMatrix.needsUpdate = true;
    trimRef.current.instanceMatrix.needsUpdate = true;
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

      headrestColor.copy(color).offsetHSL(0, -0.04, 0.04);

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
        args={[geometries.cupholder, materials.brushedBrass, seatCount * 2]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={bolsterRef}
        args={[geometries.bolster, materials.bolsterMat, seatCount * 2]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={trimRef}
        args={[geometries.trim, materials.brushedBrass, seatCount]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={cushionRef}
        args={[geometries.cushion, materials.velvet, seatCount]}
        onClick={handleSeatClick}
        onPointerMove={handleSeatMove}
        onPointerOut={handleSeatOut}
        frustumCulled={false}
      />
      <instancedMesh
        ref={backRef}
        args={[geometries.back, materials.velvet, seatCount]}
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
        <>
          <instancedMesh
            ref={footrestRef}
            args={[geometries.footrest, materials.bolsterMat, reclinerSeats.length]}
            frustumCulled={false}
          />
          {layout.rows[layout.rows.length - 1] && (
            <group>
              {[
                { x: -4.63, w: 2.04 },
                { x: 0, w: 4.12 },
                { x: 4.63, w: 2.04 },
              ].map((pod, pIdx) => {
                const rowJ = layout.rows[layout.rows.length - 1]!;
                return (
                  <group key={`sofa-pod-${pIdx}`}>
                    <mesh position={[pod.x, rowJ.floorYMeters + 0.18, rowJ.zMeters + 0.04]}>
                      <boxGeometry args={[pod.w, 0.34, 0.88]} />
                      <meshStandardMaterial color="#272930" roughness={0.78} metalness={0.06} />
                    </mesh>
                    {[-1, 1].map((side) => (
                      <mesh
                        key={`wing-${pIdx}-${side}`}
                        position={[
                          pod.x + side * (pod.w / 2 + 0.04),
                          rowJ.floorYMeters + 0.62,
                          rowJ.zMeters + 0.08,
                        ]}
                      >
                        <boxGeometry args={[0.09, 0.68, 0.92]} />
                        <meshStandardMaterial color="#464952" roughness={0.74} metalness={0.05} />
                      </mesh>
                    ))}
                  </group>
                );
              })}
            </group>
          )}
        </>
      )}

      {audienceSimulationEnabled && (
        <instancedMesh
          ref={audienceRef}
          args={[geometries.head, materials.audience, seatCount]}
          frustumCulled={false}
        />
      )}

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
