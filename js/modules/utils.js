export const Utils = {
  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Get mouse position relative to element
  getRelativePosition(event, element) {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  },

  // Load image with promise
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Generate filename with team info
  generateFilename(teamPrefix, teamName, asset, extension = 'png') {
    const timestamp = new Date().toISOString().split('T')[0];
    const safeName = teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${teamPrefix}_${safeName}_${asset}_${timestamp}.${extension}`;
  },

  // Check if point is inside rectangle
  pointInRect(x, y, rect) {
    return x >= rect.x && 
           x <= rect.x + rect.width && 
           y >= rect.y && 
           y <= rect.y + rect.height;
  },

  // Constrain value between min and max
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  // Show toast notification
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};