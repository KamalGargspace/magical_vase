import * as THREE from 'three';
import { logger } from '../utils/logger';

const log = logger.create('Petal');

/**
 * Creates a soft, organic flower petal geometry.
 * Uses a wide, thin silhouette with gentle curves and natural curling.
 *
 * Performance notes:
 *   • bevelSegments reduced 6→3 (halves bevel vertex count)
 *   • steps reduced 8→4 (halves extrusion subdivision)
 *   • Wrapped in try/catch for shader compilation safety
 */
export function createPetalGeometry() {
  try {
    log.time('createPetalGeometry');

    const shape = new THREE.Shape();

    // Wide, asymmetric petal silhouette — like a real rose petal
    shape.moveTo(0, 0);
    shape.bezierCurveTo( 0.18, 0.08,  0.38, 0.30,  0.32, 0.65);
    shape.bezierCurveTo( 0.28, 0.85,  0.18, 1.05,  0.08, 1.15);
    shape.quadraticCurveTo( 0.02, 1.22, 0.00, 1.25); // soft tip
    shape.quadraticCurveTo(-0.02, 1.22,-0.08, 1.15);
    shape.bezierCurveTo(-0.18, 1.05, -0.28, 0.85, -0.32, 0.65);
    shape.bezierCurveTo(-0.38, 0.30, -0.18, 0.08,  0.00, 0.00);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.004,          // Paper-thin
      bevelEnabled: true,
      bevelSegments: 3,      // Reduced from 6 for perf
      steps: 4,              // Reduced from 8 for perf
      bevelSize: 0.003,
      bevelThickness: 0.002,
    });

    // Natural 3D curling
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Gentle longitudinal curl (petal curves backward along its length)
      const longCurl = Math.sin((y / 1.25) * Math.PI * 0.7) * 0.12;

      // Soft lateral curl (edges gently lift upward like a real petal)
      const edgeLift = Math.pow(Math.abs(x) / 0.35, 2) * 0.18;

      // Very subtle twist along the length
      const twist = x * Math.sin(y * 1.2) * 0.08;

      pos.setZ(i, z + longCurl + edgeLift + twist);
    }

    geometry.computeVertexNormals();
    geometry.center();
    geometry.scale(0.30, 0.30, 0.30);

    log.timeEnd('createPetalGeometry');
    log.info('Petal geometry created', { vertexCount: pos.count });

    return geometry;
  } catch (err) {
    log.error('Failed to create petal geometry:', err);
    // Fallback: return a simple flat circle geometry
    const fallback = new THREE.CircleGeometry(0.15, 8);
    log.warn('Using fallback circle geometry for petals');
    return fallback;
  }
}
