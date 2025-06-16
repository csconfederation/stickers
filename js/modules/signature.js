import { CSS_CLASSES } from '../config.js';
import { Utils } from './utils.js';

export class SignatureManager {
  constructor(canvas, onSignatureReady) {
    this.canvas = canvas;
    this.onSignatureReady = onSignatureReady;
    this.isDrawing = false;
  }

  startDrawing(brushSize, brushColor, strokeWidth = 0, strokeColor = '#000000') {
    this.isDrawing = true;
    this.brushSize = brushSize;
    this.brushColor = brushColor;
    this.strokeWidth = strokeWidth;
    this.strokeColor = strokeColor;
    
    // Show drawing canvas
    this.canvas.drawingCanvas.classList.add('active');
  }

  handleDrawStart(x, y) {
    if (!this.isDrawing) return;
    
    this.canvas.startPath(x, y, this.brushColor, this.brushSize, this.strokeColor, this.strokeWidth);
  }

  handleDraw(x, y) {
    if (!this.isDrawing) return;
    
    // Validate coordinates
    if (!this.isValidCoordinate(x, y)) return;
    
    this.canvas.drawTo(x, y);
  }

  isValidCoordinate(x, y) {
    return typeof x === 'number' && 
           typeof y === 'number' && 
           !isNaN(x) && 
           !isNaN(y) &&
           x >= 0 && 
           y >= 0 &&
           x <= this.canvas.drawingCanvas.width &&
           y <= this.canvas.drawingCanvas.height;
  }

  updateBrushSettings(size, color, strokeWidth = 0, strokeColor = '#000000') {
    this.brushSize = size;
    this.brushColor = color;
    this.strokeWidth = strokeWidth;
    this.strokeColor = strokeColor;
    // Update canvas drawing settings if drawing is active
    if (this.isDrawing) {
      this.canvas.updateDrawSettings(color, size, strokeColor, strokeWidth);
    }
  }

  handleDrawEnd() {
    if (!this.isDrawing) return;
    this.canvas.endPath();
  }

  finishDrawing() {
    this.isDrawing = false;
    this.canvas.drawingCanvas.classList.remove('active');
    
    // Remove drawing mode indicator
    document.getElementById('canvasWrapper').classList.remove(CSS_CLASSES.DRAWING_MODE);
    document.getElementById('drawingModeTooltip').classList.add(CSS_CLASSES.HIDDEN);
    
    // Hide drawing tools UI
    document.getElementById('drawingTools').classList.remove(CSS_CLASSES.ACTIVE);
    
    // Get drawn signature bounds and crop
    const croppedData = this.cropDrawing();
    if (croppedData) {
      this.onSignatureReady(croppedData, 'drawn');
    }
    
    this.canvas.clearDrawing();
  }

  cropDrawing() {
    const imageData = this.canvas.drawCtx.getImageData(
      0, 0, 
      this.canvas.drawingCanvas.width, 
      this.canvas.drawingCanvas.height
    );
    
    // Find bounds
    let minX = this.canvas.drawingCanvas.width;
    let minY = this.canvas.drawingCanvas.height;
    let maxX = 0;
    let maxY = 0;
    
    for (let y = 0; y < this.canvas.drawingCanvas.height; y++) {
      for (let x = 0; x < this.canvas.drawingCanvas.width; x++) {
        const alpha = imageData.data[(y * this.canvas.drawingCanvas.width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (maxX <= minX || maxY <= minY) return null;
    
    // Create cropped canvas
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.putImageData(
      this.canvas.drawCtx.getImageData(minX, minY, width, height), 
      0, 0
    );
    
    return {
      dataUrl: tempCanvas.toDataURL(),
      bounds: { x: minX, y: minY, width, height }
    };
  }

  handleFileUpload(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      
      if (!this.validateDataUrl(dataUrl)) {
        Utils.showToast('Invalid image file', 'error');
        return;
      }
      
      this.onSignatureReady({ dataUrl, bounds: null }, 'uploaded');
    };
    
    reader.onerror = () => {
      Utils.showToast('Failed to read file', 'error');
    };
    
    reader.readAsDataURL(file);
  }

  validateDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string') return false;
    
    // Check format with stricter base64 validation
    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,([A-Za-z0-9+/]*={0,2})$/i;
    if (!dataUrlPattern.test(dataUrl)) return false;
    
    // Additional base64 validation
    const base64Part = dataUrl.split(',')[1];
    if (!base64Part) return false;
    
    try {
      atob(base64Part);
    } catch (e) {
      return false;
    }
    
    // Check size (5MB limit)
    if (dataUrl.length > 5 * 1024 * 1024) return false;
    
    return true;
  }

  cancelDrawing() {
    this.isDrawing = false;
    this.canvas.clearDrawing();
    this.canvas.drawingCanvas.classList.remove('active');
    
    // Remove drawing mode indicator
    document.getElementById('canvasWrapper').classList.remove(CSS_CLASSES.DRAWING_MODE);
    document.getElementById('drawingModeTooltip').classList.add(CSS_CLASSES.HIDDEN);
    
    // Hide drawing tools UI
    document.getElementById('drawingTools').classList.remove(CSS_CLASSES.ACTIVE);
  }
}