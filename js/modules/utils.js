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

  // Load image with promise and security validation
  loadImage(src) {
    return new Promise((resolve, reject) => {
      // Validate image source
      if (!this.validateImageSrc(src)) {
        reject(new Error('Invalid image source'));
        return;
      }

      const img = new Image();
      
      // Set up timeout for loading
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        
        // Validate image dimensions
        if (img.width > 4096 || img.height > 4096) {
          reject(new Error('Image too large'));
          return;
        }
        
        if (img.width < 1 || img.height < 1) {
          reject(new Error('Invalid image dimensions'));
          return;
        }
        
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      // Set crossOrigin for security when needed
      if (src.startsWith('data:')) {
        // Data URLs are safe to load directly
        img.src = src;
      } else {
        // External URLs need CORS handling
        img.crossOrigin = 'anonymous';
        img.src = src;
      }
    });
  },

  // Validate image source URL
  validateImageSrc(src) {
    if (typeof src !== 'string' || src.length === 0) {
      return false;
    }
    
    // Allow data URLs and relative paths only
    if (src.startsWith('data:image/')) {
      // Validate data URL format
      const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,/i;
      return dataUrlPattern.test(src) && src.length < 10 * 1024 * 1024; // 10MB limit
    }
    
    // Allow relative paths for team assets
    if (src.startsWith('teams/') && !src.includes('..') && !src.includes('//')) {
      return true;
    }
    
    return false;
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

  // Show toast notification with input sanitization
  showToast(message, type = 'info', duration = 3000) {
    // Sanitize inputs
    const sanitizedMessage = this.sanitizeText(message);
    const sanitizedType = this.sanitizeText(type);
    
    // Validate type
    const validTypes = ['info', 'success', 'error', 'warning'];
    const safeType = validTypes.includes(sanitizedType) ? sanitizedType : 'info';
    
    // Validate duration
    const safeDuration = Math.max(1000, Math.min(10000, parseInt(duration) || 3000));
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${safeType}`;
    toast.textContent = sanitizedMessage; // Use textContent to prevent XSS
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, safeDuration);
  },

  // Sanitize text input to prevent XSS
  sanitizeText(input) {
    const div = document.createElement('div');
    div.textContent = String(input || '');
    return div.innerHTML;
  },

  // Validate and sanitize object properties
  sanitizeObject(obj, allowedKeys = []) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }
    
    const sanitized = {};
    for (const key of allowedKeys) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeText(value);
        } else if (typeof value === 'number' && !isNaN(value)) {
          sanitized[key] = value;
        } else if (typeof value === 'boolean') {
          sanitized[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects recursively (with depth limit)
          sanitized[key] = this.sanitizeObjectShallow(value);
        }
      }
    }
    return sanitized;
  },

  // Shallow sanitization for nested objects
  sanitizeObjectShallow(obj) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeText(value);
      } else if (typeof value === 'number' && !isNaN(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
};