import { UPLOAD } from '../config.js';

// Returns an error message, or null if the file is acceptable.
export function validateUpload(file) {
  if (!UPLOAD.types.includes(file.type)) return 'Unsupported file type. Use a PNG, JPEG, WebP, GIF or BMP image.';
  if (file.size > UPLOAD.maxBytes) return 'File too large. The maximum size is 10 MB.';
  return null;
}

// The size an uploaded image is drawn at: shrunk so its longer side is at most
// UPLOAD.maxSide, never enlarged.
export function uploadSize(width, height) {
  const factor = Math.min(1, UPLOAD.maxSide / Math.max(width, height));
  return { width: Math.round(width * factor), height: Math.round(height * factor) };
}

// Where a signature drawn on a pad that overlays the stage lands on the asset.
// capture is DrawingPad.capture(): the cropped image plus its bounds and the
// pad's size, both in the pad's CSS pixels.
export function padPlacement({ image, bounds, padSize }, asset) {
  const toAssetX = asset.width / padSize.width;
  const toAssetY = asset.height / padSize.height;
  return {
    x: (bounds.x + bounds.width / 2) * toAssetX,
    y: (bounds.y + bounds.height / 2) * toAssetY,
    scale: bounds.width * toAssetX / image.width,
    rotation: 0,
    opacity: 1
  };
}
