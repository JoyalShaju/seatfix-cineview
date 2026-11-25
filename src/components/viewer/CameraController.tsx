'use client';

import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { clampHeadLookOffsets, computeSeatCameraPose } from '@/lib/geometry/seat-camera';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';

const OVERVIEW_POSITION = new THREE.Vector3(0, 7.2, 18.0);
const OVERVIEW_TARGET = new THREE.Vector3(0, 2.4, 5.2);

export function CameraController() {
  const { gl } = useThree();
  const {
    layout,
    activePreviewSeatId,
    visualizationMode,
    lookAtScreenCenter,
    eyeHeightMeters,
    headYawOffsetRad,
    headPitchOffsetRad,
    reducedMotion,
    cameraResetNonce,
    setHeadLookOffsets,
  } = useCineViewStore();

  const targetPosRef = useRef(new THREE.Vector3());
  const targetQuatRef = useRef(new THREE.Quaternion());
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const hasInitializedRef = useRef(false);
  const needsOverviewResetRef = useRef(false);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Flag overview camera reset when entering 3d-overview or resetting view
  useEffect(() => {
    if (visualizationMode === '3d-overview') {
      needsOverviewResetRef.current = true;
    }
  }, [visualizationMode, cameraResetNonce]);

  // Mouse and touch drag-look in first-person seat mode
  useEffect(() => {
    if (visualizationMode !== 'first-person') return;
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      draggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0032;
      const state = useCineViewStore.getState();
      const clamped = clampHeadLookOffsets(
        state.headYawOffsetRad - dx * sensitivity,
        state.headPitchOffsetRad - dy * sensitivity,
      );
      setHeadLookOffsets(clamped.yawRad, clamped.pitchRad);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, visualizationMode, setHeadLookOffsets]);

  useFrame(({ camera: activeCamera }, delta) => {
    if (
      activeCamera instanceof THREE.PerspectiveCamera &&
      activeCamera.fov !== layout.cameraVerticalFovDeg
    ) {
      activeCamera.fov = layout.cameraVerticalFovDeg;
      activeCamera.updateProjectionMatrix();
    }

    if (visualizationMode === '3d-overview') {
      if (needsOverviewResetRef.current) {
        activeCamera.position.copy(OVERVIEW_POSITION);
        activeCamera.lookAt(OVERVIEW_TARGET);
        needsOverviewResetRef.current = false;
      }
      return;
    }

    if (visualizationMode !== 'first-person') return;

    const seat = findSeatById(layout, activePreviewSeatId);
    const cat = layout.categories[seat.categoryId];
    const pose = computeSeatCameraPose(
      seat,
      cat,
      layout.screen,
      layout.dimensions,
      eyeHeightMeters,
    );

    targetPosRef.current.set(pose.eyePosition.x, pose.eyePosition.y, pose.eyePosition.z);

    const baseYaw = lookAtScreenCenter ? pose.screenCenterYawRad : pose.naturalYawRad;
    const basePitch = lookAtScreenCenter ? pose.screenCenterPitchRad : 0;

    eulerRef.current.set(
      basePitch + headPitchOffsetRad,
      baseYaw + headYawOffsetRad,
      0,
      'YXZ',
    );
    targetQuatRef.current.setFromEuler(eulerRef.current);

    if (!hasInitializedRef.current || reducedMotion) {
      activeCamera.position.copy(targetPosRef.current);
      activeCamera.quaternion.copy(targetQuatRef.current);
      hasInitializedRef.current = true;
      return;
    }

    const alpha = 1 - Math.exp(-8.5 * Math.min(delta, 0.05));
    activeCamera.position.lerp(targetPosRef.current, alpha);
    activeCamera.quaternion.slerp(targetQuatRef.current, alpha);
  });

  if (visualizationMode === '3d-overview') {
    return (
      <OrbitControls
        makeDefault
        target={[OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z]}
        minDistance={3.5}
        maxDistance={18.5}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI * 0.49}
        enablePan={false}
      />
    );
  }

  return null;
}
