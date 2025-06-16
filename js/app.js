import { 
  TEAMS, 
  ASSET_TYPES, 
  DEFAULT_STATE, 
  DRAWING_CONFIG,
  BACKGROUND_TYPES,
  GRADIENT_DIRECTIONS,
  CSS_CLASSES,
  UI_TEXT,
  FILE_LIMITS,
  TIMING
} from './config.js';
import { CanvasManager } from './modules/canvas.js';
import { SignatureManager } from './modules/signature.js';
import { TransformController } from './modules/transform.js';
import { Utils } from './modules/utils.js';

class SignatureOverlayApp {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.initializeModules();
    this.cacheElements();
    this.setupUI();
    this.setupEventListeners();
    this.loadSavedState();
    
    // Performance optimization: debounced render
    this.debouncedRender = Utils.debounce(() => this.render(), TIMING.RENDER_DEBOUNCE);
    
    // Auto-save state changes
    this.debouncedSaveState = Utils.debounce(() => this.saveState(), TIMING.SAVE_DEBOUNCE);
  }

  cacheElements() {
    // Cache frequently accessed DOM elements
    this.elements = {
      teamSelect: document.getElementById('teamSelect'),
      assetSelect: document.getElementById('assetSelect'),
      brushSize: document.getElementById('brushSize'),
      brushSizeValue: document.getElementById('brushSizeValue'),
      brushColor: document.getElementById('brushColor'),
      drawingTools: document.getElementById('drawingTools'),
      uploadWrapper: document.getElementById('uploadWrapper'),
      canvasWrapper: document.getElementById('canvasWrapper'),
      drawingModeTooltip: document.getElementById('drawingModeTooltip'),
      transformSection: document.getElementById('transformSection'),
      signatureBox: document.getElementById('signatureBox'),
      backgroundSection: document.getElementById('backgroundSection'),
      exportBtn: document.getElementById('exportBtn')
    };
  }

  initializeModules() {
    // Initialize canvas
    this.canvas = new CanvasManager('mainCanvas', 'drawingCanvas');
    
    // Initialize signature manager
    this.signature = new SignatureManager(
      this.canvas,
      (signatureData, type) => this.handleSignatureReady(signatureData, type)
    );
    
    // Initialize transform controller
    this.transform = new TransformController(
      (newTransform) => this.updateTransform(newTransform)
    );
  }

  setupUI() {
    // Populate team dropdown
    const teamSelect = this.elements.teamSelect;
    
    // Add a default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = UI_TEXT.SELECT_TEAM_PLACEHOLDER;
    teamSelect.appendChild(defaultOption);
    
    // Add all teams (already sorted alphabetically)
    TEAMS.forEach(team => {
      const option = document.createElement('option');
      option.value = team.prefix;
      option.textContent = `${team.name} (${team.prefix})`;
      option.dataset.teamId = team.id;
      option.dataset.teamName = team.name;
      teamSelect.appendChild(option);
    });
    
    // Populate asset type dropdown
    const assetSelect = this.elements.assetSelect;
    Object.entries(ASSET_TYPES).forEach(([key, asset]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${asset.displayName} (${asset.width}x${asset.height})`;
      assetSelect.appendChild(option);
    });
    
    // Set default drawing values
    this.elements.brushSize.value = DRAWING_CONFIG.defaultBrushSize;
    this.elements.brushSizeValue.textContent = DRAWING_CONFIG.defaultBrushSize;
    this.elements.brushColor.value = DRAWING_CONFIG.defaultColor;
    
    // Set UI text
    document.getElementById('drawingInstruction').textContent = UI_TEXT.DRAWING_INSTRUCTION;
  }

  setupEventListeners() {
    // Background selection
    document.getElementById('teamSelect').addEventListener('change', 
      (e) => this.handleTeamChange(e.target.value));
    document.getElementById('assetSelect').addEventListener('change', 
      (e) => this.handleAssetChange(e.target.value));
    
    // Signature input
    document.getElementById('drawBtn').addEventListener('click', 
      () => this.startDrawing());
    document.getElementById('uploadBtn').addEventListener('click', 
      () => this.showUploadDialog());
    document.getElementById('fileInput').addEventListener('change', 
      (e) => this.handleFileUpload(e));
    
    // Drawing controls
    document.getElementById('doneDrawing').addEventListener('click', 
      () => this.signature.finishDrawing());
    document.getElementById('clearDrawing').addEventListener('click', 
      () => this.signature.cancelDrawing());
    document.getElementById('brushSize').addEventListener('input', 
      (e) => this.updateBrushSize(e.target.value));
    document.getElementById('brushColor').addEventListener('change', 
      (e) => this.updateBrushColor(e.target.value));
    
    // Background controls
    document.getElementById('backgroundType').addEventListener('change', 
      (e) => this.updateBackgroundType(e.target.value));
    document.getElementById('backgroundColor').addEventListener('change', 
      (e) => this.updateBackgroundSetting('solidColor', e.target.value));
    document.getElementById('gradientColor1').addEventListener('change', 
      (e) => this.updateBackgroundSetting('gradientColor1', e.target.value));
    document.getElementById('gradientColor2').addEventListener('change', 
      (e) => this.updateBackgroundSetting('gradientColor2', e.target.value));
    document.getElementById('gradientDirection').addEventListener('change', 
      (e) => this.updateBackgroundSetting('gradientDirection', e.target.value));

    // Transform controls - use generic handler
    document.querySelectorAll('.transform-controls input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => this.handleSliderUpdate(e));
    });
    document.getElementById('resetTransform').addEventListener('click', 
      () => this.resetTransform());
    document.getElementById('deleteSignature').addEventListener('click', 
      () => this.deleteSignature());
    document.getElementById('doneTransform').addEventListener('click', 
      () => this.finishEditingSignature());
    
    // Export
    document.getElementById('exportBtn').addEventListener('click', 
      () => this.exportImage());
    
    // Canvas mouse events
    this.setupCanvasEvents();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  setupCanvasEvents() {
    const mainCanvas = this.canvas.mainCanvas;
    const drawingCanvas = this.canvas.drawingCanvas;
    
    // Main canvas events for dragging
    mainCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());
    
    // Drawing canvas events
    drawingCanvas.addEventListener('mousedown', (e) => {
      const pos = Utils.getRelativePosition(e, drawingCanvas);
      this.signature.handleDrawStart(pos.x, pos.y);
    });
    
    drawingCanvas.addEventListener('mousemove', (e) => {
      if (e.buttons !== 1) return;
      const pos = Utils.getRelativePosition(e, drawingCanvas);
      this.signature.handleDraw(pos.x, pos.y);
    });
    
    drawingCanvas.addEventListener('mouseup', () => {
      this.signature.handleDrawEnd();
    });
    
    // Transform handles
    document.querySelectorAll('.transform-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const handleType = e.target.dataset.handle;
        this.transform.startHandleTransform(
          handleType,
          e.clientX,
          e.clientY,
          this.state.transform,
          this.state.signature
        );
      });
    });
  }

  // Background management
  async handleTeamChange(teamPrefix) {
    const selectedOption = this.elements.teamSelect.selectedOptions[0];
    
    if (!teamPrefix || !selectedOption) {
      // Reset state when no team is selected
      this.setState({
        teamId: null,
        teamPrefix: null,
        teamName: null,
        asset: null,
        backgroundImage: null
      });
      
      this.elements.assetSelect.disabled = true;
      this.elements.assetSelect.value = '';
      this.elements.exportBtn.disabled = true;
      this.canvas.clear();
      return;
    }
    
    // Store team information
    this.state.teamId = selectedOption.dataset.teamId;
    this.state.teamPrefix = teamPrefix;
    this.state.teamName = selectedOption.dataset.teamName;
    
    this.elements.assetSelect.disabled = false;
    
    // Automatically select and load the Sticker asset
    this.elements.assetSelect.value = 'Sticker';
    await this.handleAssetChange('Sticker');
  }

  async handleAssetChange(assetType) {
    if (!this.state.teamPrefix || !assetType) return;
    
    this.state.asset = assetType;
    const assetConfig = ASSET_TYPES[assetType];
    
    try {
      // Use team prefix for folder name
      const imagePath = `teams/${this.state.teamPrefix}/${assetConfig.filename}`;
      this.state.backgroundImage = await Utils.loadImage(imagePath);
      
      // Set canvas dimensions
      this.canvas.setDimensions(assetConfig.width, assetConfig.height);
      
      // Show/hide background controls for sticker assets
      const isSticker = assetType === 'Sticker' || assetType === 'StickerShadow';
      const backgroundSection = document.getElementById('backgroundSection');
      
      if (isSticker) {
        backgroundSection.classList.remove(CSS_CLASSES.HIDDEN);
      } else {
        backgroundSection.classList.add(CSS_CLASSES.HIDDEN);
        // Reset to original background for non-sticker assets
        this.state.backgroundSettings.type = BACKGROUND_TYPES.ORIGINAL;
      }
      
      // Render
      this.render();
      
      // Enable export
      document.getElementById('exportBtn').disabled = false;
      
      // Auto-save state
      this.debouncedSaveState();
      
      Utils.showToast('Background loaded successfully', 'success');
    } catch (error) {
      Utils.showToast('Failed to load background image', 'error');
      console.error(error);
    }
  }

  // Signature management
  startDrawing() {
    const brushSize = parseInt(document.getElementById('brushSize').value);
    const brushColor = document.getElementById('brushColor').value;
    
    document.getElementById('drawingTools').classList.add(CSS_CLASSES.ACTIVE);
    document.getElementById('uploadWrapper').classList.add(CSS_CLASSES.HIDDEN);
    
    // Add visual indicator to canvas wrapper
    document.getElementById('canvasWrapper').classList.add(CSS_CLASSES.DRAWING_MODE);
    document.getElementById('drawingModeTooltip').classList.remove(CSS_CLASSES.HIDDEN);
    
    this.signature.startDrawing(brushSize, brushColor);
  }

  showUploadDialog() {
    document.getElementById('drawingTools').classList.remove(CSS_CLASSES.ACTIVE);
    document.getElementById('uploadWrapper').classList.remove(CSS_CLASSES.HIDDEN);
  }

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Enhanced security validation
    if (!this.validateImageFile(file)) {
      e.target.value = ''; // Reset file input
      return;
    }
    
    this.signature.handleFileUpload(file);
    document.getElementById('uploadWrapper').classList.add(CSS_CLASSES.HIDDEN);
    e.target.value = ''; // Reset file input
  }

  validateImageFile(file) {
    // Check file size
    if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
      Utils.showToast('File too large. Maximum size is 5MB', 'error');
      return false;
    }

    // Minimum file size check (prevent empty files)
    if (file.size < FILE_LIMITS.MIN_FILE_SIZE) {
      Utils.showToast('File too small. Please select a valid image', 'error');
      return false;
    }

    // Strict MIME type validation
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      Utils.showToast('Invalid file type. Please select a valid image file (JPEG, PNG, GIF, WebP, BMP)', 'error');
      return false;
    }

    // File name validation (prevent path traversal)
    const fileName = file.name;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      Utils.showToast('Invalid file name', 'error');
      return false;
    }

    // File extension validation
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    if (!validExtensions.test(fileName)) {
      Utils.showToast('Invalid file extension', 'error');
      return false;
    }

    return true;
  }

  async handleSignatureReady(signatureData, type) {
    try {
      const img = await Utils.loadImage(signatureData.dataUrl);
      this.state.signature = img;
      this.state.signatureType = type;
      
      // Set initial position
      if (signatureData.bounds && type === 'drawn') {
        this.state.transform.x = signatureData.bounds.x;
        this.state.transform.y = signatureData.bounds.y;
      } else {
        // Center the signature
        this.state.transform.x = (this.canvas.mainCanvas.width - img.width) / 2;
        this.state.transform.y = (this.canvas.mainCanvas.height - img.height) / 2;
      }
      
      // Show transform controls
      document.getElementById('transformSection').classList.remove(CSS_CLASSES.HIDDEN);
      document.getElementById('signatureBox').classList.add(CSS_CLASSES.ACTIVE);
      
      // Enable export button if we have both background and signature
      if (this.state.backgroundImage) {
        document.getElementById('exportBtn').disabled = false;
      }
      
      this.updateSignatureBox();
      this.render();
      
      Utils.showToast('Signature added successfully', 'success');
    } catch (error) {
      Utils.showToast('Failed to process signature', 'error');
      console.error(error);
    }
  }

  // Transform management
  updateTransform(newTransform) {
    this.state.transform = newTransform;
    this.updateSignatureBox();
    this.render();
    this.debouncedSaveState();
  }

  handleSliderUpdate(e) {
    const slider = e.target;
    const key = slider.dataset.stateKey;
    const value = parseFloat(slider.value);
    const multiplier = parseFloat(slider.dataset.multiplier) || 1;
    
    // Update display
    slider.nextElementSibling.textContent = `${value}${slider.dataset.unit || ''}`;
    
    // Update state
    this.state.transform[key] = value * multiplier;
    this.debouncedRender();
    
    if (key === 'scale' || key === 'rotation') {
      this.updateSignatureBox();
    }
  }

  updateBrushSize(value) {
    try {
      const safeValue = this.validateNumericInput(value, DRAWING_CONFIG.minBrushSize, DRAWING_CONFIG.maxBrushSize, DRAWING_CONFIG.defaultBrushSize);
      document.getElementById('brushSizeValue').textContent = safeValue;
      // Always update signature manager brush settings
      const color = document.getElementById('brushColor').value;
      this.signature.updateBrushSettings(parseInt(safeValue), color);
    } catch (error) {
      console.error('Failed to update brush size:', error);
      Utils.showToast('Failed to update brush size', 'error');
    }
  }

  updateBrushColor(value) {
    try {
      const safeColor = this.validateColorInput(value);
      // Always update signature manager brush settings
      const size = document.getElementById('brushSize').value;
      this.signature.updateBrushSettings(parseInt(size), safeColor);
    } catch (error) {
      console.error('Failed to update brush color:', error);
      Utils.showToast('Failed to update brush color', 'error');
    }
  }

  // Background control methods
  updateBackgroundType(type) {
    const validTypes = Object.values(BACKGROUND_TYPES);
    const safeType = validTypes.includes(type) ? type : BACKGROUND_TYPES.ORIGINAL;
    
    // Show/hide relevant controls
    document.getElementById('solidColorGroup').classList.toggle(CSS_CLASSES.HIDDEN, safeType !== BACKGROUND_TYPES.SOLID);
    document.getElementById('gradientGroup').classList.toggle(CSS_CLASSES.HIDDEN, safeType !== BACKGROUND_TYPES.GRADIENT);
    
    this.setState({
      backgroundSettings: { ...this.state.backgroundSettings, type: safeType }
    });
  }

  updateBackgroundSetting(key, value) {
    const safeValue = key.includes('Color') ? this.validateColorInput(value) : value;
    this.setState({
      backgroundSettings: { ...this.state.backgroundSettings, [key]: safeValue }
    });
  }

  resetTransform() {
    this.setState({
      transform: { ...DEFAULT_STATE.transform }
    });
    
    // Update UI sliders
    document.querySelectorAll('.transform-controls input[type="range"]').forEach(slider => {
      const key = slider.dataset.stateKey;
      const unit = slider.dataset.unit || '';
      const multiplier = parseFloat(slider.dataset.multiplier) || 1;
      const defaultValue = DEFAULT_STATE.transform[key] / multiplier;
      
      slider.value = defaultValue;
      const displayValueEl = slider.nextElementSibling;
      if (displayValueEl) {
        displayValueEl.textContent = `${defaultValue}${unit}`;
      }
    });
    
    this.updateSignatureBox();
  }

  finishEditingSignature() {
    // Hide the signature box outline
    document.getElementById('signatureBox').classList.remove(CSS_CLASSES.ACTIVE);
    
    // Enable export button if we have both background and signature
    if (this.state.backgroundImage && this.state.signature) {
      document.getElementById('exportBtn').disabled = false;
    }
    
    Utils.showToast('Signature locked in place', 'success');
  }

  deleteSignature() {
    if (!confirm('Delete the current signature?')) return;
    
    this.state.signature = null;
    this.state.signatureType = null;
    
    document.getElementById('transformSection').classList.add(CSS_CLASSES.HIDDEN);
    document.getElementById('signatureBox').classList.remove(CSS_CLASSES.ACTIVE);
    
    // Keep export buttons enabled if we still have a background
    // (user can export background without signature)
    if (!this.state.backgroundImage) {
      document.getElementById('exportBtn').disabled = true;
    }
    
    this.render();
    Utils.showToast('Signature deleted', 'info');
  }

  setState(updates) {
    Object.assign(this.state, updates);
    this.debouncedRender();
    this.debouncedSaveState();
  }

  updateSignatureBox() {
    if (!this.state.signature) return;
    
    this.transform.updateSignatureBox(
      document.getElementById('signatureBox'),
      this.state.transform,
      this.state.signature
    );
  }

  // Canvas interaction
  handleCanvasMouseDown(e) {
    if (!this.state.signature) return;
    
    const pos = Utils.getRelativePosition(e, this.canvas.mainCanvas);
    const sigBounds = {
      x: this.state.transform.x,
      y: this.state.transform.y,
      width: this.state.signature.width * this.state.transform.scale,
      height: this.state.signature.height * this.state.transform.scale
    };
    
    if (Utils.pointInRect(pos.x, pos.y, sigBounds)) {
      this.transform.startDrag(e.clientX, e.clientY, this.state.transform);
      this.canvas.mainCanvas.style.cursor = 'grabbing';
    }
  }

  handleMouseMove(e) {
    if (this.transform.handleMove(e.clientX, e.clientY)) {
      e.preventDefault();
    }
  }

  handleMouseUp() {
    this.transform.endTransform();
    this.canvas.mainCanvas.style.cursor = 'move';
  }

  // Keyboard shortcuts
  handleKeyboard(e) {
    // Delete key - remove signature
    if (e.key === 'Delete' && this.state.signature) {
      this.deleteSignature();
    }
    
    // Ctrl/Cmd + E - export image
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      this.exportImage();
    }
  }

  // Rendering
  render() {
    this.canvas.render(this.state);
  }

  // Export/Save
  exportImage() {
    if (!this.state.teamPrefix || !this.state.asset) {
      Utils.showToast('Please select a background first', 'warning');
      return;
    }
    
    const filename = Utils.generateFilename(
      this.state.teamPrefix, 
      this.state.teamName, 
      this.state.asset
    );
    this.canvas.exportImage(filename);
    Utils.showToast('Image exported successfully', 'success');
  }


  // Auto-save functionality
  saveState() {
    try {
      // Create a serializable version of the state
      const stateToSave = {
        teamPrefix: this.state.teamPrefix,
        teamName: this.state.teamName,
        asset: this.state.asset,
        transform: this.state.transform,
        backgroundSettings: this.state.backgroundSettings
      };
      
      localStorage.setItem('csc_sticker_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  loadSavedState() {
    try {
      const savedState = localStorage.getItem('csc_sticker_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Sanitize strings that could contain HTML
        if (parsedState.teamName) {
          parsedState.teamName = parsedState.teamName.replace(/[<>"'&]/g, '');
        }
        
        // Validate enums against allowed values
        if (parsedState.teamPrefix && !TEAMS.find(t => t.prefix === parsedState.teamPrefix)) {
          parsedState.teamPrefix = null;
        }
        if (parsedState.asset && !ASSET_TYPES[parsedState.asset]) {
          parsedState.asset = null;
        }
        
        // Merge saved state with defaults
        this.state = { ...DEFAULT_STATE, ...parsedState };
        
        // Update UI to reflect loaded state
        if (this.state.teamPrefix) {
          document.getElementById('teamSelect').value = this.state.teamPrefix;
          this.handleTeamChange(this.state.teamPrefix);
          
          if (this.state.asset) {
            document.getElementById('assetSelect').value = this.state.asset;
            // Load the asset in the background
            setTimeout(() => this.handleAssetChange(this.state.asset), 100);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
      // Continue with default state
    }
  }

  // Input validation methods
  validateNumericInput(value, min, max, defaultValue) {
    const num = parseFloat(value);
    if (isNaN(num)) return defaultValue;
    return Math.max(min, Math.min(max, num));
  }

  validateStringInput(value, maxLength = 100) {
    if (typeof value !== 'string') return '';
    return value.substring(0, maxLength).replace(/[<>\"'&]/g, '');
  }

  validateTeamPrefix(prefix) {
    const validPrefixes = TEAMS.map(team => team.prefix);
    return validPrefixes.includes(prefix) ? prefix : null;
  }

  validateAssetType(asset) {
    return Object.keys(ASSET_TYPES).includes(asset) ? asset : null;
  }

  validateColorInput(color) {
    // Validate hex color format
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (typeof color === 'string' && hexPattern.test(color)) {
      return color;
    }
    return '#ffffff'; // Default to white
  }


  // Cleanup method for memory management
  cleanup() {
    // Clear canvas contexts
    if (this.canvas) {
      this.canvas.clear();
      this.canvas.clearDrawing();
    }
    
    // Clear stored state
    this.state = { ...DEFAULT_STATE };
  }
}

// Initialize app when DOM is ready with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.app = new SignatureOverlayApp();
    
    
    // Set up error handling
    window.addEventListener('error', (event) => {
      console.error('Application error:', event.error);
      Utils.showToast('An error occurred. Please refresh the page.', 'error');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      Utils.showToast('An error occurred. Please try again.', 'error');
    });
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Failed to load application. Please refresh the page.</div>';
  }
});