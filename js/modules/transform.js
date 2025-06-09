export class TransformController {
  constructor(updateCallback) {
    this.onUpdate = updateCallback;
    this.isDragging = false;
    this.isTransforming = false;
    this.activeHandle = null;
    this.startPos = { x: 0, y: 0 };
    this.startTransform = null;
  }

  startDrag(x, y, currentTransform) {
    this.isDragging = true;
    this.startPos = { x, y };
    this.startTransform = { ...currentTransform };
  }

  startHandleTransform(handle, x, y, currentTransform, signatureDimensions) {
    this.isTransforming = true;
    this.activeHandle = handle;
    this.startPos = { x, y };
    this.startTransform = { ...currentTransform };
    this.signatureDimensions = signatureDimensions;
  }

  handleMove(x, y) {
    if (this.isDragging) {
      const dx = x - this.startPos.x;
      const dy = y - this.startPos.y;
      
      const newTransform = {
        ...this.startTransform,
        x: this.startTransform.x + dx,
        y: this.startTransform.y + dy
      };
      
      this.onUpdate(newTransform);
      return true;
    }
    
    if (this.isTransforming && this.activeHandle) {
      this.handleTransform(x, y);
      return true;
    }
    
    return false;
  }

  handleTransform(x, y) {
    const dx = x - this.startPos.x;
    const dy = y - this.startPos.y;
    
    switch (this.activeHandle) {
      case 'rotate':
        this.handleRotation(x, y);
        break;
      case 'tl':
      case 'tr':
      case 'bl':
      case 'br':
        this.handleResize(dx, dy);
        break;
    }
  }

  handleRotation(x, y) {
    const centerX = this.startTransform.x + 
      (this.signatureDimensions.width * this.startTransform.scale) / 2;
    const centerY = this.startTransform.y + 
      (this.signatureDimensions.height * this.startTransform.scale) / 2;
    
    const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
    const startAngle = Math.atan2(
      this.startPos.y - centerY, 
      this.startPos.x - centerX
    ) * 180 / Math.PI;
    
    const rotation = this.startTransform.rotation + (angle - startAngle);
    
    this.onUpdate({
      ...this.startTransform,
      rotation: rotation
    });
  }

  handleResize(dx, dy) {
    // Calculate new scale based on handle position
    const aspectRatio = this.signatureDimensions.width / this.signatureDimensions.height;
    let scaleChange = 0;
    
    switch (this.activeHandle) {
      case 'br':
        scaleChange = Math.max(dx, dy) / 
          Math.max(this.signatureDimensions.width, this.signatureDimensions.height);
        break;
      case 'tl':
        scaleChange = -Math.max(dx, dy) / 
          Math.max(this.signatureDimensions.width, this.signatureDimensions.height);
        break;
      case 'tr':
        scaleChange = Math.max(dx, -dy) / 
          Math.max(this.signatureDimensions.width, this.signatureDimensions.height);
        break;
      case 'bl':
        scaleChange = Math.max(-dx, dy) / 
          Math.max(this.signatureDimensions.width, this.signatureDimensions.height);
        break;
    }
    
    const newScale = Math.max(0.1, Math.min(5, this.startTransform.scale + scaleChange));
    
    this.onUpdate({
      ...this.startTransform,
      scale: newScale
    });
  }

  endTransform() {
    this.isDragging = false;
    this.isTransforming = false;
    this.activeHandle = null;
  }

  updateSignatureBox(element, transform, signatureDimensions) {
    const width = signatureDimensions.width * transform.scale;
    const height = signatureDimensions.height * transform.scale;
    
    element.style.left = transform.x + 'px';
    element.style.top = transform.y + 'px';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.transform = `rotate(${transform.rotation}deg)`;
  }
}