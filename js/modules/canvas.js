import { BACKGROUND_TYPES, GRADIENT_DIRECTIONS } from '../config.js';

export class CanvasManager {
  constructor(mainCanvasId, drawingCanvasId) {
    this.mainCanvas = document.getElementById(mainCanvasId);
    this.drawingCanvas = document.getElementById(drawingCanvasId);
    this.ctx = this.mainCanvas.getContext('2d');
    this.drawCtx = this.drawingCanvas.getContext('2d');
    
    // Set up drawing context
    this.drawCtx.lineCap = 'round';
    this.drawCtx.lineJoin = 'round';
    
    // Initialize drawing state
    this.currentColor = null;
    this.currentSize = null;
  }

  setDimensions(width, height) {
    this.mainCanvas.width = width;
    this.mainCanvas.height = height;
    this.drawingCanvas.width = width;
    this.drawingCanvas.height = height;
    
    // Update wrapper dimensions
    const wrapper = this.mainCanvas.parentElement;
    wrapper.style.width = width + 'px';
    wrapper.style.height = height + 'px';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
  }

  clearDrawing() {
    this.drawCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
  }

  render(state) {
    this.clear();
    
    // Draw background
    if (state.backgroundImage) {
      // Check if we need custom background for sticker assets
      const isSticker = state.asset === 'Sticker' || state.asset === 'StickerShadow';
      
      if (isSticker && state.backgroundSettings.type !== BACKGROUND_TYPES.ORIGINAL) {
        // First draw the custom background
        this.renderCustomBackground(state.backgroundSettings);
        // Then draw the sticker image on top
        this.ctx.drawImage(
          state.backgroundImage, 
          0, 0, 
          this.mainCanvas.width, 
          this.mainCanvas.height
        );
      } else {
        // For non-sticker assets or original background, just draw the image
        this.ctx.drawImage(
          state.backgroundImage, 
          0, 0, 
          this.mainCanvas.width, 
          this.mainCanvas.height
        );
      }
    }
    
    // Draw signature
    if (state.signature) {
      this.ctx.save();
      this.ctx.globalAlpha = state.transform.opacity;
      
      const width = state.signature.width * state.transform.scale;
      const height = state.signature.height * state.transform.scale;
      const centerX = state.transform.x + width / 2;
      const centerY = state.transform.y + height / 2;
      
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(state.transform.rotation * Math.PI / 180);
      this.ctx.drawImage(
        state.signature, 
        -width / 2, 
        -height / 2, 
        width, 
        height
      );
      
      this.ctx.restore();
    }
  }

  exportImage(filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.mainCanvas.toDataURL('image/png');
    link.click();
  }

  getDrawingData() {
    return this.drawingCanvas.toDataURL('image/png');
  }

  // Drawing methods
  startPath(x, y, color, size, strokeColor = null, strokeWidth = 0) {
    this.drawCtx.beginPath();
    this.drawCtx.moveTo(x, y);
    this.drawCtx.strokeStyle = color;
    this.drawCtx.lineWidth = size;
    this.currentColor = color;
    this.currentSize = size;
    this.currentStrokeColor = strokeColor;
    this.currentStrokeWidth = strokeWidth;
  }

  drawTo(x, y) {
    this.drawCtx.lineTo(x, y);
    
    // Draw stroke (outline) first if enabled
    if (this.currentStrokeWidth > 0 && this.currentStrokeColor) {
      this.drawCtx.save();
      this.drawCtx.strokeStyle = this.currentStrokeColor;
      this.drawCtx.lineWidth = this.currentSize + (this.currentStrokeWidth * 2);
      this.drawCtx.stroke();
      this.drawCtx.restore();
    }
    
    // Draw main line on top
    this.drawCtx.stroke();
  }

  endPath() {
    this.drawCtx.closePath();
  }

  updateDrawSettings(color, size, strokeColor = null, strokeWidth = 0) {
    this.drawCtx.strokeStyle = color;
    this.drawCtx.lineWidth = size;
    this.currentColor = color;
    this.currentSize = size;
    this.currentStrokeColor = strokeColor;
    this.currentStrokeWidth = strokeWidth;
  }

  renderCustomBackground(backgroundSettings) {
    const { type, solidColor, gradientColor1, gradientColor2, gradientDirection } = backgroundSettings;
    
    this.ctx.save();
    
    if (type === BACKGROUND_TYPES.SOLID) {
      this.ctx.fillStyle = solidColor;
      this.ctx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    } else if (type === BACKGROUND_TYPES.GRADIENT) {
      const gradient = this.createGradient(gradientColor1, gradientColor2, gradientDirection);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    } else if (type === BACKGROUND_TYPES.TRANSPARENT) {
      // Do nothing - leave transparent
    }
    
    this.ctx.restore();
  }

  createGradient(color1, color2, direction) {
    let gradient;
    
    switch (direction) {
      case GRADIENT_DIRECTIONS.TO_BOTTOM:
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.mainCanvas.height);
        break;
      case GRADIENT_DIRECTIONS.TO_RIGHT:
        gradient = this.ctx.createLinearGradient(0, 0, this.mainCanvas.width, 0);
        break;
      case GRADIENT_DIRECTIONS.TO_BOTTOM_RIGHT:
        gradient = this.ctx.createLinearGradient(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        break;
      case GRADIENT_DIRECTIONS.TO_BOTTOM_LEFT:
        gradient = this.ctx.createLinearGradient(this.mainCanvas.width, 0, 0, this.mainCanvas.height);
        break;
      default:
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.mainCanvas.height);
    }
    
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    return gradient;
  }
}