import { TEAMS, ASSET_TYPES, DEFAULT_STATE, DRAWING_CONFIG } from './config.js';
import { CanvasManager } from './modules/canvas.js';
import { SignatureManager } from './modules/signature.js';
import { TransformController } from './modules/transform.js';
import { StorageManager } from './modules/storage.js';
import { Utils } from './modules/utils.js';

class SignatureOverlayApp {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.initializeModules();
    this.setupUI();
    this.setupEventListeners();
    this.loadLastProject();
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
    
    // Initialize storage
    this.storage = new StorageManager();
  }

  setupUI() {
    // Populate team dropdown
    const teamSelect = document.getElementById('teamSelect');
    
    // Add a default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a Team';
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
    const assetSelect = document.getElementById('assetSelect');
    Object.entries(ASSET_TYPES).forEach(([key, asset]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${asset.displayName} (${asset.width}x${asset.height})`;
      assetSelect.appendChild(option);
    });
    
    // Set default drawing values
    document.getElementById('brushSize').value = DRAWING_CONFIG.defaultBrushSize;
    document.getElementById('brushSizeValue').textContent = DRAWING_CONFIG.defaultBrushSize;
    document.getElementById('brushColor').value = DRAWING_CONFIG.defaultColor;
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
      (e) => this.updateBackgroundColor(e.target.value));
    document.getElementById('gradientColor1').addEventListener('change', 
      (e) => this.updateGradientColor1(e.target.value));
    document.getElementById('gradientColor2').addEventListener('change', 
      (e) => this.updateGradientColor2(e.target.value));
    document.getElementById('gradientDirection').addEventListener('change', 
      (e) => this.updateGradientDirection(e.target.value));

    // Transform controls
    document.getElementById('scaleSlider').addEventListener('input', 
      (e) => this.updateScale(e.target.value));
    document.getElementById('rotationSlider').addEventListener('input', 
      (e) => this.updateRotation(e.target.value));
    document.getElementById('opacitySlider').addEventListener('input', 
      (e) => this.updateOpacity(e.target.value));
    document.getElementById('resetTransform').addEventListener('click', 
      () => this.resetTransform());
    document.getElementById('deleteSignature').addEventListener('click', 
      () => this.deleteSignature());
    
    // Export/Save
    document.getElementById('exportBtn').addEventListener('click', 
      () => this.exportImage());
    document.getElementById('saveProject').addEventListener('click', 
      () => this.saveProject());
    document.getElementById('loadProject').addEventListener('click', 
      () => this.showLoadDialog());
    
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
    const selectedOption = document.getElementById('teamSelect').selectedOptions[0];
    
    if (!teamPrefix || !selectedOption) {
      this.state.teamId = null;
      this.state.teamPrefix = null;
      this.state.teamName = null;
      this.state.asset = null;
      document.getElementById('assetSelect').disabled = true;
      document.getElementById('assetSelect').value = '';
      this.canvas.clear();
      return;
    }
    
    // Store team information
    this.state.teamId = selectedOption.dataset.teamId;
    this.state.teamPrefix = teamPrefix;
    this.state.teamName = selectedOption.dataset.teamName;
    
    document.getElementById('assetSelect').disabled = false;
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
        backgroundSection.classList.remove('hidden');
      } else {
        backgroundSection.classList.add('hidden');
        // Reset to original background for non-sticker assets
        this.state.backgroundSettings.type = 'original';
      }
      
      // Render
      this.render();
      
      // Enable export
      document.getElementById('exportBtn').disabled = false;
      document.getElementById('saveProject').disabled = false;
      
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
    
    document.getElementById('drawingTools').classList.add('active');
    document.getElementById('uploadWrapper').classList.add('hidden');
    
    this.signature.startDrawing(brushSize, brushColor);
  }

  showUploadDialog() {
    document.getElementById('drawingTools').classList.remove('active');
    document.getElementById('uploadWrapper').classList.remove('hidden');
  }

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('File too large. Maximum size is 5MB', 'error');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      Utils.showToast('Please select an image file', 'error');
      return;
    }
    
    this.signature.handleFileUpload(file);
    document.getElementById('uploadWrapper').classList.add('hidden');
    e.target.value = ''; // Reset file input
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
      document.getElementById('transformSection').classList.remove('hidden');
      document.getElementById('signatureBox').classList.add('active');
      
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
  }

  updateScale(value) {
    this.state.transform.scale = value / 100;
    document.getElementById('scaleValue').textContent = value + '%';
    this.updateSignatureBox();
    this.render();
  }

  updateRotation(value) {
    this.state.transform.rotation = parseInt(value);
    document.getElementById('rotationValue').textContent = value + '°';
    this.updateSignatureBox();
    this.render();
  }

  updateOpacity(value) {
    this.state.transform.opacity = value / 100;
    document.getElementById('opacityValue').textContent = value + '%';
    this.render();
  }

  updateBrushSize(value) {
    document.getElementById('brushSizeValue').textContent = value;
    // Always update signature manager brush settings
    const color = document.getElementById('brushColor').value;
    this.signature.updateBrushSettings(parseInt(value), color);
  }

  updateBrushColor(value) {
    // Always update signature manager brush settings
    const size = document.getElementById('brushSize').value;
    this.signature.updateBrushSettings(parseInt(size), value);
  }

  // Background control methods
  updateBackgroundType(type) {
    this.state.backgroundSettings.type = type;
    
    // Show/hide relevant controls
    document.getElementById('solidColorGroup').classList.toggle('hidden', type !== 'solid');
    document.getElementById('gradientGroup').classList.toggle('hidden', type !== 'gradient');
    
    this.render();
  }

  updateBackgroundColor(color) {
    this.state.backgroundSettings.solidColor = color;
    this.render();
  }

  updateGradientColor1(color) {
    this.state.backgroundSettings.gradientColor1 = color;
    this.render();
  }

  updateGradientColor2(color) {
    this.state.backgroundSettings.gradientColor2 = color;
    this.render();
  }

  updateGradientDirection(direction) {
    this.state.backgroundSettings.gradientDirection = direction;
    this.render();
  }

  resetTransform() {
    this.state.transform = { ...DEFAULT_STATE.transform };
    
    // Update UI
    document.getElementById('scaleSlider').value = 100;
    document.getElementById('scaleValue').textContent = '100%';
    document.getElementById('rotationSlider').value = 0;
    document.getElementById('rotationValue').textContent = '0°';
    document.getElementById('opacitySlider').value = 100;
    document.getElementById('opacityValue').textContent = '100%';
    
    this.updateSignatureBox();
    this.render();
  }

  deleteSignature() {
    if (!confirm('Delete the current signature?')) return;
    
    this.state.signature = null;
    this.state.signatureType = null;
    
    document.getElementById('transformSection').classList.add('hidden');
    document.getElementById('signatureBox').classList.remove('active');
    
    this.render();
    Utils.showToast('Signature deleted', 'info');
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
    
    // Ctrl/Cmd + S - save project
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveProject();
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

  saveProject() {
    const projectData = {
      state: this.state,
      signature: this.state.signature ? this.state.signature.src : null
    };
    
    const projectId = this.storage.saveProject(projectData);
    Utils.showToast('Project saved successfully', 'success');
  }

  showLoadDialog() {
    // Create and show project list dialog
    const projects = this.storage.getProjects();
    
    if (projects.length === 0) {
      Utils.showToast('No saved projects found', 'info');
      return;
    }
    
    // For now, just load the most recent
    const project = projects[0];
    this.loadProject(project);
  }

  async loadProject(project) {
    try {
      // Restore state
      this.state = { ...project.state };
      
      // Update UI
      document.getElementById('teamSelect').value = this.state.teamPrefix || '';
      document.getElementById('assetSelect').value = this.state.asset || '';
      document.getElementById('assetSelect').disabled = !this.state.teamPrefix;
      
      // Load background
      if (this.state.teamPrefix && this.state.asset) {
        await this.handleAssetChange(this.state.asset);
      }
      
      // Load signature
      if (project.signature) {
        const img = await Utils.loadImage(project.signature);
        this.state.signature = img;
        
        // Show transform controls
        document.getElementById('transformSection').classList.remove('hidden');
        document.getElementById('signatureBox').classList.add('active');
        
        // Update transform UI
        document.getElementById('scaleSlider').value = this.state.transform.scale * 100;
        document.getElementById('scaleValue').textContent = 
          (this.state.transform.scale * 100) + '%';
        document.getElementById('rotationSlider').value = this.state.transform.rotation;
        document.getElementById('rotationValue').textContent = 
          this.state.transform.rotation + '°';
        document.getElementById('opacitySlider').value = this.state.transform.opacity * 100;
        document.getElementById('opacityValue').textContent = 
          (this.state.transform.opacity * 100) + '%';
        
        this.updateSignatureBox();
      }
      
      this.render();
      Utils.showToast('Project loaded successfully', 'success');
    } catch (error) {
      Utils.showToast('Failed to load project', 'error');
      console.error(error);
    }
  }

  loadLastProject() {
    const lastProject = this.storage.loadCurrentProject();
    if (lastProject) {
      this.loadProject(lastProject);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SignatureOverlayApp();
});