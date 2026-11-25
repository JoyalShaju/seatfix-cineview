'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AlertTriangle } from 'lucide-react';
import { SeatMap2D } from '@/components/seat-map/SeatMap2D';
import { useCineViewStore } from '@/store/useCineViewStore';
import { CameraController } from './CameraController';
import { InstancedSeats } from './InstancedSeats';
import { ProceduralAuditoriumShell } from './ProceduralAuditoriumShell';
import { ScreenSurface } from './ScreenSurface';

function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

export function AuditoriumCanvas() {
  const { layout, graphicsQuality, screenDisplayMode, reducedMotion } = useCineViewStore();
  const [webglSupported] = useState<boolean>(() => detectWebGLSupport());

  if (!webglSupported) {
    return (
      <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-amber-500/30 bg-[#0d0f17] p-5">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">WebGL Unavailable — 2D Fallback Active</p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Your browser or graphics driver does not support WebGL hardware rendering. You can
              still inspect seat geometry metrics and select seats using the 2D seating chart.
            </p>
          </div>
        </div>
        <SeatMap2D />
      </div>
    );
  }

  const dpr: [number, number] =
    graphicsQuality === 'low' ? [1, 1] : graphicsQuality === 'medium' ? [1, 1.5] : [1, 2];

  return (
    <Canvas
      dpr={dpr}
      shadows={graphicsQuality === 'high'}
      camera={{
        fov: layout.cameraVerticalFovDeg,
        near: 0.1,
        far: 60,
        position: [0, 3.2, 12.2],
      }}
      gl={{
        antialias: graphicsQuality !== 'low',
        powerPreference: 'high-performance',
      }}
      className="h-full w-full touch-none select-none"
    >
      <color attach="background" args={['#08080c']} />
      <fog attach="fog" args={['#08080c', 26, 56]} />

      <ProceduralAuditoriumShell layout={layout} graphicsQuality={graphicsQuality} />
      <ScreenSurface
        screen={layout.screen}
        displayMode={screenDisplayMode}
        graphicsQuality={graphicsQuality}
        reducedMotion={reducedMotion}
      />
      <InstancedSeats />
      <CameraController />
    </Canvas>
  );
}
