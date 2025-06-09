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
      const img = new Image();
      img.onload = () => {
        this.onSignatureReady(
          { dataUrl: e.target.result, bounds: null }, 
          'uploaded'
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  cancelDrawing() {
    this.isDrawing = false;
    this.canvas.clearDrawing();
    this.canvas.drawingCanvas.classList.remove('active');
  }
}