# API Documentation

This document describes the internal API structure and module interfaces for the CSC Signature Overlay Tool.

## Module Architecture

The application follows a modular ES6 architecture with clear separation of concerns:

```
SignatureOverlayApp (Main Controller)
├── CanvasManager (Rendering)
├── SignatureManager (Drawing/Upload)
├── TransformController (Interactions)
└── Utils (Helpers)
```

## Core Modules

### 1. SignatureOverlayApp (`js/app.js`)

Main application controller that orchestrates all modules.

#### Constructor
```javascript
new SignatureOverlayApp()
```

#### Key Methods

##### State Management
```javascript
updateTransform(newTransform)    // Update signature transform
updateScale(value)              // Scale: 10-200%
updateRotation(value)           // Rotation: -180° to 180°
updateOpacity(value)            // Opacity: 0-100%
```

##### Background Controls
```javascript
updateBackgroundType(type)      // 'original', 'solid', 'gradient', 'transparent'
updateBackgroundColor(color)    // Hex color string
updateGradientColor1(color)     // Gradient start color
updateGradientColor2(color)     // Gradient end color
updateGradientDirection(dir)    // 'to-bottom', 'to-right', etc.
```

##### File Operations
```javascript
handleFileUpload(event)         // Process uploaded signature files
validateImageFile(file)         // Validate image files
exportImage()                   // Export final image as PNG
```

##### State Management
```javascript
setState(updates)               // Centralized state updates with auto-render/save
saveState()                     // Auto-save current state to localStorage
loadSavedState()               // Restore saved state on startup
```

**setState Method Details:**
```javascript
// Merge updates into current state and trigger render/save
setState({
  transform: { scale: 1.5, rotation: 45 },
  backgroundSettings: { type: 'solid', solidColor: '#ff0000' }
})

// Supports nested object updates with automatic merging
// Automatically calls debouncedRender() and debouncedSaveState()
```

##### Input Validation
```javascript
validateNumericInput(value, min, max, default)  // Numeric range validation
validateStringInput(value, maxLength)           // String sanitization
validateTeamPrefix(prefix)                      // Team validation
validateAssetType(asset)                        // Asset type validation
validateColorInput(color)                       // Color format validation
```

### 2. CanvasManager (`js/modules/canvas.js`)

Handles all canvas rendering operations.

#### Constructor
```javascript
new CanvasManager(mainCanvasId, drawingCanvasId)
```

#### Methods

##### Canvas Setup
```javascript
setDimensions(width, height)    // Set canvas size
clear()                         // Clear main canvas
clearDrawing()                  // Clear drawing canvas
```

##### Rendering
```javascript
render(state)                   // Render complete scene
renderCustomBackground(settings) // Render custom backgrounds
createGradient(color1, color2, direction) // Create gradient fills
```

##### Drawing Operations
```javascript
startPath(x, y, color, size)    // Begin drawing path
drawTo(x, y)                    // Continue drawing path
endPath()                       // End drawing path
updateDrawSettings(color, size) // Update brush settings
```

##### Export
```javascript
exportImage(filename)           // Export canvas as PNG
getDrawingData()               // Get drawing canvas data URL
```

### 3. SignatureManager (`js/modules/signature.js`)

Manages signature creation through drawing or file upload.

#### Constructor
```javascript
new SignatureManager(canvas, onSignatureReady)
```

#### Methods

##### Drawing Mode
```javascript
startDrawing(brushSize, brushColor) // Enter drawing mode
handleDrawStart(x, y)               // Begin drawing stroke
handleDraw(x, y)                    // Continue drawing stroke
handleDrawEnd()                     // End drawing stroke
finishDrawing()                     // Complete drawing and process
cancelDrawing()                     // Cancel drawing session
```

##### File Upload
```javascript
handleFileUpload(file)          // Process uploaded image file
validateDataUrl(dataUrl)        // Validate image data URL
```

##### Processing
```javascript
cropDrawing()                   // Auto-crop drawn signature
updateBrushSettings(size, color) // Update brush properties
```

### 4. TransformController (`js/modules/transform.js`)

Handles signature transformation (move, scale, rotate).

#### Constructor
```javascript
new TransformController(updateCallback)
```

#### Methods

##### Interaction Handling
```javascript
startDrag(x, y, currentTransform)              // Begin drag operation
startHandleTransform(handle, x, y, transform, dimensions) // Begin handle drag
handleMove(x, y)                                // Process mouse movement
endTransform()                                  // End transformation
```

##### Transform Operations
```javascript
handleRotation(x, y)            // Process rotation
handleResize(dx, dy)           // Process scaling
updateSignatureBox(element, transform, dimensions) // Update visual handles
```

### 5. Utils (`js/modules/utils.js`)

Utility functions and helpers.

#### Methods

##### Performance
```javascript
debounce(func, wait)            // Debounce function calls
```

##### DOM Utilities
```javascript
getRelativePosition(event, element) // Get mouse position relative to element
showToast(message, type, duration)  // Display notification toast
```

##### Image Processing
```javascript
loadImage(src)                  // Load image with security validation
validateImageSrc(src)           // Validate image source URL
```

##### Validation & Sanitization
```javascript
sanitizeText(input)             // Sanitize text input
sanitizeObject(obj, allowedKeys) // Sanitize object properties
sanitizeObjectShallow(obj)      // Shallow object sanitization
```

##### File Operations
```javascript
formatFileSize(bytes)           // Format file size for display
generateFilename(teamPrefix, teamName, asset, extension) // Generate export filename
```

##### Geometry
```javascript
pointInRect(x, y, rect)         // Check if point is inside rectangle
clamp(value, min, max)          // Constrain value to range
```

## Configuration (`js/config.js`)

### Constants

#### TEAMS
Array of team objects with:
```javascript
{
  id: string,      // Franchise ID
  prefix: string,  // Team prefix (folder name)
  name: string     // Display name
}
```

#### ASSET_TYPES
Object mapping asset types to configurations:
```javascript
{
  width: number,     // Asset width in pixels
  height: number,    // Asset height in pixels
  displayName: string, // Human-readable name
  filename: string   // File name in team directories
}
```

#### DEFAULT_STATE
Default application state structure:
```javascript
{
  teamId: string,
  teamPrefix: string,
  teamName: string,
  asset: string,
  backgroundImage: Image,
  signature: Image,
  signatureType: string,
  transform: {
    x: number,
    y: number,
    scale: number,
    rotation: number,
    opacity: number
  },
  backgroundSettings: {
    type: string,
    solidColor: string,
    gradientColor1: string,
    gradientColor2: string,
    gradientDirection: string
  }
}
```

#### DRAWING_CONFIG
Drawing tool configuration:
```javascript
{
  defaultBrushSize: number,
  minBrushSize: number,
  maxBrushSize: number,
  defaultColor: string
}
```

#### ASSET_KEYS
Constants for asset type keys:
```javascript
{
  STICKER: 'Sticker',
  STICKER_SHADOW: 'StickerShadow',
  PROFILE_PICTURE: 'ProfilePicture',
  DISCORD_BANNER: 'DiscordBanner',
  TWITTER_BANNER: 'TwitterBanner',
  YOUTUBE_BANNER: 'YoutubeBanner',
  TWITCH_BANNER: 'TwitchBanner',
  DESKTOP_BACKGROUND: 'DesktopBackground'
}
```

#### BACKGROUND_TYPES
Constants for background types:
```javascript
{
  ORIGINAL: 'original',
  SOLID: 'solid',
  GRADIENT: 'gradient',
  TRANSPARENT: 'transparent'
}
```

#### GRADIENT_DIRECTIONS
Constants for gradient directions:
```javascript
{
  TO_BOTTOM: 'to-bottom',
  TO_RIGHT: 'to-right',
  TO_BOTTOM_RIGHT: 'to-bottom-right',
  TO_BOTTOM_LEFT: 'to-bottom-left'
}
```

#### CSS_CLASSES
Constants for CSS class names:
```javascript
{
  HIDDEN: 'hidden',
  ACTIVE: 'active',
  DRAWING_MODE: 'drawing-mode'
}
```

#### UI_TEXT
Constants for UI text strings:
```javascript
{
  DRAWING_INSTRUCTION: 'Draw your signature on the canvas below, then click "Apply Signature" when finished.',
  DRAWING_MODE_TOOLTIP: 'Click and drag to draw on the canvas',
  SELECT_TEAM_PLACEHOLDER: 'Select a Team'
}
```

#### FILE_LIMITS
File validation and size limits:
```javascript
{
  MAX_FILE_SIZE: 5242880,        // 5MB in bytes
  MIN_FILE_SIZE: 100,            // 100 bytes minimum
  MAX_IMAGE_DIMENSION: 4096,     // Maximum width/height
  MIN_IMAGE_DIMENSION: 1,        // Minimum width/height
  FILE_READ_TIMEOUT: 30000,      // 30 seconds
  IMAGE_LOAD_TIMEOUT: 10000,     // 10 seconds
  MAX_DATA_URL_SIZE: 10485760    // 10MB for data URLs
}
```

#### TIMING
Timing and performance constants:
```javascript
{
  RENDER_DEBOUNCE: 16,           // 60fps render debounce
  SAVE_DEBOUNCE: 500,            // Auto-save debounce
  TOAST_DURATION: 3000,          // Toast notification duration
  TOAST_ANIMATION: 300,          // Toast animation duration
  PERFORMANCE_CHECK_INTERVAL: 30000,  // Performance monitoring interval
  MEMORY_WARNING_THRESHOLD: 52428800  // 50MB memory warning threshold
}
```

#### TRANSFORM_LIMITS
Transform value constraints:
```javascript
{
  MIN_SCALE: 0.1,                // Minimum scale factor
  MAX_SCALE: 5,                  // Maximum scale factor
  MIN_ROTATION: -180,            // Minimum rotation in degrees
  MAX_ROTATION: 180,             // Maximum rotation in degrees
  MIN_OPACITY: 0,                // Minimum opacity
  MAX_OPACITY: 1                 // Maximum opacity
}
```

## Event System

### Application Events

#### File Upload
```javascript
'change' on fileInput -> handleFileUpload()
```

#### Transform Controls
```javascript
'input' on sliders -> handleSliderUpdate()  // Generic handler for all transform sliders
'mousedown' on canvas -> startDrag()
'mousemove' on document -> handleMove()
'mouseup' on document -> endTransform()
```

**Slider Update System:**
```javascript
// Data attributes on sliders define behavior:
// data-state-key: property name in state.transform
// data-unit: display unit (%, °)
// data-multiplier: value conversion factor (0.01 for percentage)
```

#### Background Controls
```javascript
'change' on backgroundType -> updateBackgroundType()
'change' on color inputs -> updateBackgroundColor()
```

#### Drawing
```javascript
'mousedown' on drawingCanvas -> handleDrawStart()
'mousemove' on drawingCanvas -> handleDraw()
'mouseup' on drawingCanvas -> handleDrawEnd()
```

### Error Handling

Global error boundaries:
```javascript
window.addEventListener('error', handler)
window.addEventListener('unhandledrejection', handler)
```

Module-specific error handling with try/catch blocks and user feedback via toast notifications.

## Security Considerations

### Input Validation
- All user inputs are validated and sanitized
- Numeric inputs are clamped to safe ranges
- String inputs are length-limited and XSS-protected
- File uploads are strictly validated

### Memory Management
- Performance monitoring with usage alerts
- Resource cleanup on navigation
- Debounced operations to prevent overload

### Data Security
- localStorage data is validated on load
- JSON parsing is wrapped in error handling
- File operations have timeout protection

## Performance Optimizations

### Rendering
- Debounced rendering at 60fps
- Canvas operations are batched
- Transform updates use RAF when possible

### Memory
- Automatic cleanup of unused resources
- Image loading with size limits
- Storage quotas and limits enforced

### Network
- Local-only operations (no external requests)
- Efficient asset loading
- Minimal DOM manipulation

## Error Codes

| Code | Description | Action |
|------|-------------|---------|
| FILE_TOO_LARGE | File exceeds 5MB limit | Reduce file size |
| INVALID_FILE_TYPE | Unsupported file format | Use PNG/JPG/GIF |
| STORAGE_QUOTA | localStorage full | Clear old projects |
| LOAD_TIMEOUT | Image load timeout | Check file/network |
| INVALID_PROJECT | Corrupted project data | Use different project |

This API documentation provides the foundation for extending and maintaining the CSC Signature Overlay Tool.