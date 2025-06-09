export class CanvasManager {
  constructor(mainCanvasId, drawingCanvasId) {
    this.mainCanvas = document.getElementById(mainCanvasId);
    this.drawingCanvas = document.getElementById(drawingCanvasId);
    this.ctx = this.mainCanvas.getContext('2d');
    this.drawCtx = this.drawingCanvas.getContext('2d');
    
    // Set up drawing context
    this.drawCtx.lineCap = 'round';
    this.drawCtx.lineJoin = 'round';
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
      
      if (isSticker && state.backgroundSettings.type !== 'original') {
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
  startPath(x, y, color, size) {
    this.drawCtx.beginPath();
    this.drawCtx.moveTo(x, y);
    this.drawCtx.strokeStyle = color;
    this.drawCtx.lineWidth = size;
    this.currentColor = color;
    this.currentSize = size;
  }

  drawTo(x, y) {
    this.drawCtx.lineTo(x, y);
    this.drawCtx.stroke();
  }

  endPath() {
    this.drawCtx.closePath();
  }

  updateDrawSettings(color, size) {
    this.drawCtx.strokeStyle = color;
    this.drawCtx.lineWidth = size;
    this.currentColor = color;
    this.currentSize = size;
  }

  renderCustomBackground(backgroundSettings) {
    const { type, solidColor, gradientColor1, gradientColor2, gradientDirection } = backgroundSettings;
    
    this.ctx.save();
    
    if (type === 'solid') {
      this.ctx.fillStyle = solidColor;
      this.ctx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    } else if (type === 'gradient') {
      const gradient = this.createGradient(gradientColor1, gradientColor2, gradientDirection);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    } else if (type === 'transparent') {
      // Do nothing - leave transparent
    }
    
    this.ctx.restore();
  }

  createGradient(color1, color2, direction) {
    let gradient;
    
    switch (direction) {
      case 'to-bottom':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.mainCanvas.height);
        break;
      case 'to-right':
        gradient = this.ctx.createLinearGradient(0, 0, this.mainCanvas.width, 0);
        break;
      case 'to-bottom-right':
        gradient = this.ctx.createLinearGradient(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        break;
      case 'to-bottom-left':
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