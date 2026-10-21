import { ASSET_TYPES, BACKGROUND_TYPES, GRADIENT_DIRECTIONS } from '../config.js';
import { pointerToCanvas } from './utils.js';

// [x0, y0, x1, y1] of the gradient line for a direction.
export function gradientEndpoints(direction, width, height) {
  switch (direction) {
    case GRADIENT_DIRECTIONS.TO_RIGHT: return [0, 0, width, 0];
    case GRADIENT_DIRECTIONS.TO_BOTTOM_RIGHT: return [0, 0, width, height];
    case GRADIENT_DIRECTIONS.TO_BOTTOM_LEFT: return [width, 0, 0, height];
    default: return [0, 0, 0, height];
  }
}

export class CanvasManager {
  // The wrapper's --w/--h custom properties drive its displayed size (see CSS).
  constructor(canvas, wrapper) {
    this.canvas = canvas;
    this.wrapper = wrapper;
    this.ctx = canvas.getContext('2d');
  }

  get size() {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  // Assigning width/height clears the bitmap, so only do it on a real change.
  setDimensions(width, height) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.wrapper.style.setProperty('--w', width);
    this.wrapper.style.setProperty('--h', height);
  }

  pointFromEvent(event) {
    return pointerToCanvas(event.clientX, event.clientY, this.canvas.getBoundingClientRect(), this.canvas);
  }

  render(state) {
    const { ctx } = this;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);

    if (state.backgroundImage) {
      if (ASSET_TYPES[state.asset]?.customBackground) this.paintBackdrop(state.backgroundSettings);
      ctx.drawImage(state.backgroundImage, 0, 0, width, height);
    }

    if (state.signature) {
      const { x, y, scale, rotation, opacity } = state.transform;
      const w = state.signature.width * scale;
      const h = state.signature.height * scale;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(state.signature, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }

  paintBackdrop({ type, solidColor, gradientColor1, gradientColor2, gradientDirection }) {
    const { ctx } = this;
    const { width, height } = this.canvas;
    if (type === BACKGROUND_TYPES.SOLID) {
      ctx.fillStyle = solidColor;
    } else if (type === BACKGROUND_TYPES.GRADIENT) {
      const gradient = ctx.createLinearGradient(...gradientEndpoints(gradientDirection, width, height));
      gradient.addColorStop(0, gradientColor1);
      gradient.addColorStop(1, gradientColor2);
      ctx.fillStyle = gradient;
    } else {
      return;
    }
    ctx.fillRect(0, 0, width, height);
  }

  toBlob() {
    return new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'));
  }
}
