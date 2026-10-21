// Pure geometry for a layer on one asset. A placement is { x, y, scale,
// rotation, opacity } where x/y is the layer's center in asset pixels and
// rotation is in degrees. A size is anything with width and height.
import { SCALE_LIMITS } from '../config.js';
import { clamp } from './utils.js';

const SNAP_STEP = 15;

export const clampScale = (scale) => clamp(scale, SCALE_LIMITS.min, SCALE_LIMITS.max);

// Wraps to (-180, 180] so the rotation slider always holds the value.
export function normalizeAngle(degrees) {
  const wrapped = ((degrees % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

export function normalizeTransform(t, canvas) {
  return {
    x: clamp(t.x, 0, canvas.width),
    y: clamp(t.y, 0, canvas.height),
    scale: clampScale(t.scale),
    rotation: normalizeAngle(t.rotation),
    opacity: clamp(t.opacity, 0, 1)
  };
}

// Maps a canvas point into the signature's unrotated frame, origin at its center.
export function toLocal(point, t) {
  const angle = -t.rotation * Math.PI / 180;
  const dx = point.x - t.x;
  const dy = point.y - t.y;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle)
  };
}

export function hitTest(point, t, size) {
  const local = toLocal(point, t);
  return Math.abs(local.x) <= size.width * t.scale / 2 && Math.abs(local.y) <= size.height * t.scale / 2;
}

// The gesture functions take the transform and pointer position at gesture
// start plus the current pointer, and return only the fields they change.
export function dragTo(start, startPoint, point) {
  return { x: start.x + point.x - startPoint.x, y: start.y + point.y - startPoint.y };
}

// Scales about the center: the corner follows the pointer's distance from it.
export function resizeTo(start, startPoint, point) {
  const startDistance = Math.hypot(startPoint.x - start.x, startPoint.y - start.y);
  if (startDistance < 1) return { scale: start.scale };
  const distance = Math.hypot(point.x - start.x, point.y - start.y);
  return { scale: clampScale(start.scale * distance / startDistance) };
}

export function rotateTo(start, startPoint, point, snap = false) {
  const angleOf = (p) => Math.atan2(p.y - start.y, p.x - start.x) * 180 / Math.PI;
  const rotation = normalizeAngle(start.rotation + angleOf(point) - angleOf(startPoint));
  return { rotation: snap ? normalizeAngle(Math.round(rotation / SNAP_STEP) * SNAP_STEP) : rotation };
}

// Selection box as percentages of the canvas, so it follows the displayed scale.
export function boxStyle(t, size, canvas) {
  const width = size.width * t.scale;
  const height = size.height * t.scale;
  return {
    left: (t.x - width / 2) / canvas.width * 100,
    top: (t.y - height / 2) / canvas.height * 100,
    width: width / canvas.width * 100,
    height: height / canvas.height * 100,
    rotation: t.rotation
  };
}
