'use client';

import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { clampHeadLookOffsets, computeSeatCameraPose } from '@/lib/geometry/seat-camera';
import { findSeatById, useCineViewStore } from '@/store/useCineViewStore';

const OVERVIEW_POSITION = new THREE.Vector3(0, 8.8, 20.6);
const OVERVIEW_TARGET = new THREE.Vector3(0, 3.6, 5.8);

// Elevated upper-left rear auditorium corner for the dramatic entrance swoop
const ENTRY_CORNER_POSITION = new THREE.Vector3(-7.4, 8.8, 19.8);
const ENTRY_LOOK_TARGET = new THREE.Vector3(0.4, 4.4, 4.2);

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
    introPhase,
    setHeadLookOffsets,
  } = useCineViewStore();

  const targetPosRef = useRef(new THREE.Vector3());
  const targetQuatRef = useRef(new THREE.Quaternion());
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const hasInitializedRef = useRef(false);
  const needsOverviewResetRef = useRef(false);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Entrance fly-in state (glides from upper corner down into the selected seat)
  const flyRef = useRef({
    started: false,
    finished: false,
    progress: 0,
  });
  const entryQuatRef = useRef(new THREE.Quaternion());
  const flyPosRef = useRef(new THREE.Vector3());
  const flyQuatRef = useRef(new THREE.Quaternion());
  const lastSeatIdRef = useRef(activePreviewSeatId);

  // Smooth fixed-duration seat-to-seat transition state (eliminates mobile lerp delta spikes)
  const seatTweenRef = useRef({
    active: false,
    progress: 1,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    curPos: new THREE.Vector3(),
    curQuat: new THREE.Quaternion(),
    trackedSeatId: activePreviewSeatId,
    trackedLookCenter: lookAtScreenCenter,
  });

  // Flag overview camera reset when entering 3d-overview or resetting view
  useEffect(() => {
    if (visualizationMode === '3d-overview') {
      needsOverviewResetRef.current = true;
    }
  }, [visualizationMode, cameraResetNonce]);

  // Precompute entry corner look orientation once
  useEffect(() => {
    const m = new THREE.Matrix4().lookAt(
      ENTRY_CORNER_POSITION,
      ENTRY_LOOK_TARGET,
      new THREE.Vector3(0, 1, 0),
    );
    entryQuatRef.current.setFromRotationMatrix(m);
  }, []);

  // Mouse and touch drag-look in first-person seat mode
  useEffect(() => {
    if (visualizationMode !== 'first-person') return;
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      draggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      // Yield fly-in immediately if the user grabs the camera
      if (flyRef.current.started && !flyRef.current.finished) {
        flyRef.current.finished = true;
      }
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

  useFrame(({ camera: activeCamera, size }, delta) => {
    if (activeCamera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / Math.max(1, size.height);
      const minHfovRad = (88 * Math.PI) / 180;
      const neededVfovDeg =
        (2 * Math.atan(Math.tan(minHfovRad / 2) / Math.max(0.65, aspect)) * 180) / Math.PI;
      const targetVfov = Math.min(86, Math.max(layout.cameraVerticalFovDeg, neededVfovDeg));
      if (Math.abs(activeCamera.fov - targetVfov) > 0.05) {
        activeCamera.fov = targetVfov;
        activeCamera.updateProjectionMatrix();
      }
    }

    if (visualizationMode === '3d-overview') {
      flyRef.current.finished = true;
      if (needsOverviewResetRef.current) {
        activeCamera.position.copy(OVERVIEW_POSITION);
        activeCamera.lookAt(OVERVIEW_TARGET);
        needsOverviewResetRef.current = false;
      }
      return;
    }

    if (visualizationMode !== 'first-person') return;

    // Cancel initial fly-in if user clicked a different seat mid-flight
    if (lastSeatIdRef.current !== activePreviewSeatId) {
      lastSeatIdRef.current = activePreviewSeatId;
      flyRef.current.finished = true;
    }

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

    // Park at upper auditorium corner while the SeatFix intro plays
    if (!reducedMotion && introPhase === 'playing' && !flyRef.current.finished) {
      activeCamera.position.copy(ENTRY_CORNER_POSITION);
      activeCamera.quaternion.copy(entryQuatRef.current);
      hasInitializedRef.current = true;
      return;
    }

    // Swoop down from the top corner into the seat once the intro begins opening
    if (!reducedMotion && !flyRef.current.finished) {
      if (!flyRef.current.started) {
        flyRef.current.started = true;
        flyRef.current.progress = 0;
      }

      const flyDurationSec = 2.05;
      flyRef.current.progress = Math.min(
        1,
        flyRef.current.progress + Math.min(delta, 0.05) / flyDurationSec,
      );
      const t = flyRef.current.progress;
      // Smooth quintic ease-in-out
      const ease = t * t * t * (t * (t * 6 - 15) + 10);

      flyPosRef.current.lerpVectors(ENTRY_CORNER_POSITION, targetPosRef.current, ease);
      // Gentle arched glide over the seating rows
      flyPosRef.current.y += Math.sin(t * Math.PI) * 0.65;
      flyQuatRef.current.slerpQuaternions(entryQuatRef.current, targetQuatRef.current, ease);

      activeCamera.position.copy(flyPosRef.current);
      activeCamera.quaternion.copy(flyQuatRef.current);

      if (t >= 1) {
        flyRef.current.finished = true;
      }
      hasInitializedRef.current = true;
      return;
    }

    if (!hasInitializedRef.current || reducedMotion) {
      activeCamera.position.copy(targetPosRef.current);
      activeCamera.quaternion.copy(targetQuatRef.current);
      seatTweenRef.current.active = false;
      seatTweenRef.current.trackedSeatId = activePreviewSeatId;
      seatTweenRef.current.trackedLookCenter = lookAtScreenCenter;
      hasInitializedRef.current = true;
      return;
    }

    const tween = seatTweenRef.current;
    if (
      tween.trackedSeatId !== activePreviewSeatId ||
      tween.trackedLookCenter !== lookAtScreenCenter
    ) {
      tween.trackedSeatId = activePreviewSeatId;
      tween.trackedLookCenter = lookAtScreenCenter;
      tween.startPos.copy(activeCamera.position);
      tween.startQuat.copy(activeCamera.quaternion);
      tween.progress = 0;
      tween.active = true;
    }

    if (tween.active) {
      // Cap frame delta on the first frame after tap so React/DOM work never causes a jump
      const safeDt = tween.progress === 0 ? Math.min(delta, 0.016) : Math.min(delta, 0.033);
      tween.progress = Math.min(1, tween.progress + safeDt / 0.55);
      const t = tween.progress;
      const ease = t * t * t * (t * (t * 6 - 15) + 10);

      tween.curPos.lerpVectors(tween.startPos, targetPosRef.current, ease);
      tween.curQuat.slerpQuaternions(tween.startQuat, targetQuatRef.current, ease);

      activeCamera.position.copy(tween.curPos);
      activeCamera.quaternion.copy(tween.curQuat);

      if (t >= 1) {
        tween.active = false;
      }
      return;
    }

    // Smooth responsive damping for interactive touch/mouse head-look
    const alpha = 1 - Math.exp(-14 * Math.min(delta, 0.033));
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
