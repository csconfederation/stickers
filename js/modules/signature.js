import { CSS_CLASSES } from '../config.js';

export class SignatureManager {
  constructor(canvas, onSignatureReady) {
    this.canvas = canvas;
    this.onSignatureReady = onSignatureReady;
    this.isDrawing = false;
    this.currentPath = [];
  }

  startDrawing(brushSize, brushColor) {
    this.isDrawing = true;
    this.brushSize = brushSize;
    this.brushColor = brushColor;
    this.currentPath = [];
    
    // Show drawing canvas
    this.canvas.drawingCanvas.classList.add('active');
  }

  handleDrawStart(x, y) {
    if (!this.isDrawing) return;
    
    this.canvas.startPath(x, y, this.brushColor, this.brushSize);
    this.currentPath.push({ x, y });
  }

  handleDraw(x, y) {
    if (!this.isDrawing) return;
    
    this.canvas.drawTo(x, y);
    this.currentPath.push({ x, y });
  }

  updateBrushSettings(size, color) {
    this.brushSize = size;
    this.brushColor = color;
    // Update canvas drawing settings if drawing is active
    if (this.isDrawing) {
      this.canvas.updateDrawSettings(color, size);
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
    
    // Set timeout for file reading
    const timeout = setTimeout(() => {
      reader.abort();
    }, 30000); // 30 second timeout
    
    reader.onload = (e) => {
      clearTimeout(timeout);
      
      try {
        const dataUrl = e.target.result;
        
        // Validate data URL
        if (!this.validateDataUrl(dataUrl)) {
          throw new Error('Invalid image data');
        }
        
        const img = new Image();
        img.onload = () => {
          // Additional security check on loaded image
          if (img.width > 4096 || img.height > 4096) {
            console.error('Image too large');
            return;
          }
          
          this.onSignatureReady(
            { dataUrl: dataUrl, bounds: null }, 
            'uploaded'
          );
        };
        
        img.onerror = () => {
          console.error('Failed to load uploaded image');
        };
        
        img.src = dataUrl;
      } catch (error) {
        console.error('File upload error:', error);
      }
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      console.error('Failed to read file');
    };
    
    reader.readAsDataURL(file);
  }

  validateDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string') return false;
    
    // Check format
    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,/i;
    if (!dataUrlPattern.test(dataUrl)) return false;
    
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