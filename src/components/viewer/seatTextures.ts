import * as THREE from 'three';

export interface SeatUpholsteryTextures {
  albedoDetailMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates paired albedo-detail, bump, and roughness maps for luxury cinema
 * upholstery (woven velvet micro-texture + tailored diamond stitching + seam shading).
 * Because InstancedMesh multiplies `instanceColor` by `map`, white/light-neutral
 * center tones preserve seat tier color while dark stitched seams add depth.
 */
export function createSeatUpholsteryTextures(): SeatUpholsteryTextures {
  const size = 256;

  // 1. Albedo detail map (multiplied with instanceColor)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  // 2. Bump map (raised padded pillows, recessed stitch lines)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  // 3. Roughness map (matte fabric/leather pores, slightly burnished centers)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (cCtx && bCtx && rCtx) {
    // Base neutral tones
    cCtx.fillStyle = '#efefef';
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#9a9a9a';
    bCtx.fillRect(0, 0, size, size);

    // High roughness base (matte velvet/leather, NOT shiny plastic)
    rCtx.fillStyle = '#d8d8d8';
    rCtx.fillRect(0, 0, size, size);

    // Fine woven fabric / leather grain micro-texture
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const hash = ((x * 73 + y * 139 + x * y) % 29) - 14;
        const cVal = Math.min(255, Math.max(210, 236 + hash));
        cCtx.fillStyle = `rgb(${cVal},${cVal},${cVal})`;
        cCtx.fillRect(x, y, 2, 2);

        const bVal = Math.min(200, Math.max(120, 152 + hash * 1.4));
        bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
        bCtx.fillRect(x, y, 2, 2);

        const rVal = Math.min(248, Math.max(190, 218 + hash));
        rCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
        rCtx.fillRect(x, y, 2, 2);
      }
    }

    // Tailored diamond-tufted channels & stitch seams
    const step = 64;
    for (let offset = -size; offset < size * 2; offset += step) {
      // Soft dark seam shading in albedo
      cCtx.strokeStyle = 'rgba(40, 34, 30, 0.34)';
      cCtx.lineWidth = 4;
      cCtx.beginPath();
      cCtx.moveTo(offset, 0);
      cCtx.lineTo(offset + size, size);
      cCtx.stroke();
      cCtx.beginPath();
      cCtx.moveTo(offset, size);
      cCtx.lineTo(offset + size, 0);
      cCtx.stroke();

      // Deep recessed seam in bump map
      bCtx.strokeStyle = '#383838';
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.moveTo(offset, 0);
      bCtx.lineTo(offset + size, size);
      bCtx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(offset, size);
      bCtx.lineTo(offset + size, 0);
      bCtx.stroke();

      // Subtle dashed cool-silver stitch highlights along seams
      cCtx.save();
      cCtx.setLineDash([4, 5]);
      cCtx.strokeStyle = 'rgba(235, 240, 248, 0.24)';
      cCtx.lineWidth = 1.2;
      cCtx.beginPath();
      cCtx.moveTo(offset + 2, 0);
      cCtx.lineTo(offset + size + 2, size);
      cCtx.stroke();
      cCtx.restore();
    }

    // Subtle soft cushion edge vignette
    const vignette = cCtx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.15,
      size / 2,
      size / 2,
      size * 0.7,
    );
    vignette.addColorStop(0, 'rgba(255,255,255,0.06)');
    vignette.addColorStop(1, 'rgba(20,16,14,0.16)');
    cCtx.fillStyle = vignette;
    cCtx.fillRect(0, 0, size, size);
  }

  const albedoDetailMap = new THREE.CanvasTexture(colorCanvas);
  albedoDetailMap.colorSpace = THREE.SRGBColorSpace;
  albedoDetailMap.wrapS = THREE.RepeatWrapping;
  albedoDetailMap.wrapT = THREE.RepeatWrapping;
  albedoDetailMap.repeat.set(2.5, 2.5);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2.5, 2.5);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2.5, 2.5);

  return {
    albedoDetailMap,
    bumpMap,
    roughnessMap,
    dispose: () => {
      albedoDetailMap.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}
