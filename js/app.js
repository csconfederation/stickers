import { TEAMS, ASSET_TYPES, BACKGROUND_TYPES, DEFAULT_STATE, SCALE_LIMITS } from './config.js';
import { CanvasManager } from './modules/canvas.js';
import { DrawingPad, validateUpload } from './modules/signature.js';
import {
  boxStyle, centeredTransform, dragTo, hitTest, normalizeTransform, resizeTo, rotateTo
} from './modules/transform.js';
import { createState, loadSavedState, saveState } from './modules/state.js';
import { assetLabel, assetUrl, pickAsset, probeAssets } from './modules/assets.js';
import { listenForTheme } from './modules/theme.js';
import { exportFilename, loadImage, showToast } from './modules/utils.js';

const $ = (id) => document.getElementById(id);
const FORM_CONTROLS = 'input, select, textarea, [contenteditable]';
const BACKGROUND_INPUTS = {
  backgroundColor: 'solidColor',
  gradientColor1: 'gradientColor1',
  gradientColor2: 'gradientColor2'
};

class App {
  constructor() {
    this.state = createState();
    this.available = null; // { [asset]: boolean } for the selected team
    this.requestId = 0; // lets a newer team/asset request cancel an older one
    this.gesture = null;
    this.strokePointer = null;
    this.drawing = false;

    this.canvas = new CanvasManager($('mainCanvas'), $('canvasWrapper'));
    this.pad = new DrawingPad($('drawingCanvas'));
    this.sliders = [...document.querySelectorAll('.transform-controls input[type="range"]')];
    this.resizeStage(ASSET_TYPES.Sticker.width, ASSET_TYPES.Sticker.height);

    this.populateSelects();
    this.bindControls();
    this.bindDrawing();
    this.bindGestures();
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.restore();
  }

  populateSelects() {
    const teamSelect = $('teamSelect');
    teamSelect.append(new Option('Select a Franchise', ''));
    for (const team of TEAMS) teamSelect.append(new Option(`${team.name} (${team.prefix})`, team.prefix));

    for (const key of Object.keys(ASSET_TYPES)) $('assetSelect').append(new Option(assetLabel(key, null), key));

    const scale = $('scaleSlider');
    scale.min = SCALE_LIMITS.min * 100;
    scale.max = SCALE_LIMITS.max * 100;
  }

  bindControls() {
    $('teamSelect').addEventListener('change', (e) => this.selectTeam(e.target.value, this.state.asset));
    $('assetSelect').addEventListener('change', (e) => this.selectAsset(e.target.value));

    $('drawBtn').addEventListener('click', () => this.startDrawing());
    $('uploadBtn').addEventListener('click', () => this.showUpload());
    $('fileInput').addEventListener('change', (e) => this.handleUpload(e));

    $('clearDrawing').addEventListener('click', () => this.pad.clear());
    $('doneDrawing').addEventListener('click', () => this.applyDrawing());
    for (const id of ['brushSize', 'strokeWidth']) {
      $(id).addEventListener('input', (e) => { $(`${id}Value`).textContent = e.target.value; });
    }

    $('backgroundType').addEventListener('change', (e) => this.setBackground({ type: e.target.value }));
    $('gradientDirection').addEventListener('change', (e) => this.setBackground({ gradientDirection: e.target.value }));
    for (const [id, key] of Object.entries(BACKGROUND_INPUTS)) {
      $(id).addEventListener('input', (e) => this.setBackground({ [key]: e.target.value }));
    }

    for (const slider of this.sliders) {
      slider.addEventListener('input', () => {
        const { stateKey, multiplier = '1' } = slider.dataset;
        this.setTransform({ [stateKey]: Number(slider.value) * Number(multiplier) });
      });
    }
    $('resetTransform').addEventListener('click', () => this.setTransform(this.state.initialTransform));
    $('deleteSignature').addEventListener('click', () => this.deleteSignature());
    $('doneTransform').addEventListener('click', () => this.setSelected(false));

    $('exportBtn').addEventListener('click', () => this.exportImage());
  }

  // ---- Background -------------------------------------------------------

  // Applies saved settings, then loads the saved asset once.
  async restore() {
    const saved = loadSavedState();
    this.state.backgroundSettings = saved.backgroundSettings;
    this.syncControls();
    if (saved.teamPrefix) await this.selectTeam(saved.teamPrefix, saved.asset);
  }

  async selectTeam(prefix, wantedAsset) {
    const id = ++this.requestId;
    if (!prefix) {
      Object.assign(this.state, { teamPrefix: null, asset: null, backgroundImage: null });
      this.available = null;
      this.refresh();
      return;
    }
    const available = await probeAssets(prefix);
    if (id !== this.requestId) return;
    const asset = pickAsset(wantedAsset, available);
    if (!asset) {
      showToast('No images are available for that franchise.');
      this.syncControls();
      return;
    }
    await this.showBackground(prefix, asset, available, id);
  }

  async selectAsset(asset) {
    if (!asset) {
      this.syncControls();
      return;
    }
    await this.showBackground(this.state.teamPrefix, asset, this.available, ++this.requestId);
  }

  async showBackground(prefix, asset, available, id) {
    let image;
    try {
      image = await loadImage(assetUrl(prefix, asset));
    } catch {
      if (id !== this.requestId) return;
      showToast('Failed to load the background image.');
      this.syncControls();
      return;
    }
    if (id !== this.requestId) return;
    Object.assign(this.state, { teamPrefix: prefix, asset, backgroundImage: image });
    this.available = available;
    this.resizeStage(ASSET_TYPES[asset].width, ASSET_TYPES[asset].height);
    if (this.state.signature) this.state.transform = normalizeTransform(this.state.transform, this.canvas.size);
    this.refresh();
  }

  setBackground(change) {
    Object.assign(this.state.backgroundSettings, change);
    this.refresh();
  }

  resizeStage(width, height) {
    this.canvas.setDimensions(width, height);
    this.pad.resize(width, height);
  }

  // ---- Signature: drawing and upload ------------------------------------

  startDrawing() {
    this.drawing = true;
    this.state.selected = false;
    this.syncSignature();
    this.syncDrawingUI();
  }

  stopDrawing() {
    this.drawing = false;
    this.pad.clear();
    this.syncDrawingUI();
  }

  syncDrawingUI() {
    $('drawingTools').classList.toggle('active', this.drawing);
    $('drawingCanvas').classList.toggle('active', this.drawing);
    $('canvasWrapper').classList.toggle('drawing-mode', this.drawing);
    $('drawingModeTooltip').classList.toggle('hidden', !this.drawing);
    if (this.drawing) $('uploadWrapper').classList.add('hidden');
  }

  readBrush() {
    return {
      size: Number($('brushSize').value),
      color: $('brushColor').value,
      outlineWidth: Number($('strokeWidth').value),
      outlineColor: $('strokeColor').value
    };
  }

  bindDrawing() {
    const pad = $('drawingCanvas');
    pad.addEventListener('pointerdown', (e) => {
      if (this.strokePointer !== null || !isPrimaryPress(e)) return;
      pad.setPointerCapture(e.pointerId);
      this.strokePointer = e.pointerId;
      this.pad.start(this.canvas.pointFromEvent(e), this.readBrush());
    });
    pad.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.strokePointer) return;
      const events = e.getCoalescedEvents?.() ?? [];
      for (const point of events.length ? events : [e]) this.pad.extend(this.canvas.pointFromEvent(point));
    });
    const end = (e) => {
      if (e.pointerId !== this.strokePointer) return;
      this.strokePointer = null;
      this.pad.end();
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
  }

  applyDrawing() {
    const captured = this.pad.capture();
    if (!captured) {
      showToast('Draw your signature first.', 'warning');
      return;
    }
    this.stopDrawing();
    this.addSignature(captured.source, { ...DEFAULT_STATE.transform, x: captured.center.x, y: captured.center.y });
  }

  showUpload() {
    if (this.drawing) this.stopDrawing();
    $('uploadWrapper').classList.remove('hidden');
  }

  async handleUpload(e) {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    const error = validateUpload(file);
    if (error) {
      showToast(error);
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      this.addSignature(image, centeredTransform(image, this.canvas.size));
      $('uploadWrapper').classList.add('hidden');
    } catch {
      showToast('Could not read that image.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  addSignature(source, transform) {
    Object.assign(this.state, { signature: source, initialTransform: transform, transform: { ...transform }, selected: true });
    this.syncSignature();
    this.render();
  }

  deleteSignature() {
    if (!confirm('Delete the current signature?')) return;
    Object.assign(this.state, { signature: null, initialTransform: null, selected: false });
    this.syncSignature();
    this.render();
  }

  // ---- Signature: transform and selection -------------------------------

  setTransform(change) {
    this.state.transform = normalizeTransform({ ...this.state.transform, ...change }, this.canvas.size);
    this.syncSignature();
    this.render();
  }

  setSelected(selected) {
    this.state.selected = selected;
    this.syncSignature();
  }

  // Brings sliders, labels, the selection box and section visibility in line with state.
  syncSignature() {
    const { signature, selected, transform } = this.state;
    const editing = selected && signature !== null;
    $('transformSection').classList.toggle('hidden', !editing);
    $('signatureBox').classList.toggle('active', editing);
    if (!signature) return;

    for (const slider of this.sliders) {
      const { stateKey, unit = '', multiplier = '1' } = slider.dataset;
      const value = transform[stateKey] / Number(multiplier);
      slider.value = value;
      slider.nextElementSibling.textContent = `${Math.round(value)}${unit}`;
    }

    const box = boxStyle(transform, signature, this.canvas.size);
    Object.assign($('signatureBox').style, {
      left: `${box.left}%`,
      top: `${box.top}%`,
      width: `${box.width}%`,
      height: `${box.height}%`,
      transform: `rotate(${box.rotation}deg)`
    });
  }

  bindGestures() {
    const canvas = $('mainCanvas');
    const handles = [...document.querySelectorAll('.transform-handle')];

    canvas.addEventListener('pointerdown', (e) => this.onCanvasDown(e));
    for (const handle of handles) {
      const kind = handle.dataset.handle === 'rotate' ? 'rotate' : 'resize';
      handle.addEventListener('pointerdown', (e) => this.beginGesture(e, kind));
    }
    for (const el of [canvas, ...handles]) {
      el.addEventListener('pointermove', (e) => this.moveGesture(e));
      el.addEventListener('pointerup', (e) => this.endGesture(e));
      el.addEventListener('pointercancel', (e) => this.endGesture(e));
    }
  }

  // Pressing on the signature selects it and starts dragging in one gesture.
  onCanvasDown(e) {
    const { signature, transform } = this.state;
    if (this.drawing || !signature || !hitTest(this.canvas.pointFromEvent(e), transform, signature)) return;
    this.setSelected(true);
    this.beginGesture(e, 'drag');
  }

  beginGesture(e, kind) {
    if (this.gesture || !isPrimaryPress(e)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    this.gesture = {
      kind,
      pointerId: e.pointerId,
      start: { ...this.state.transform },
      startPoint: this.canvas.pointFromEvent(e)
    };
    if (kind === 'drag') $('mainCanvas').style.cursor = 'grabbing';
  }

  moveGesture(e) {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointerId) return;
    const point = this.canvas.pointFromEvent(e);
    if (g.kind === 'drag') this.setTransform(dragTo(g.start, g.startPoint, point));
    else if (g.kind === 'resize') this.setTransform(resizeTo(g.start, g.startPoint, point));
    else this.setTransform(rotateTo(g.start, g.startPoint, point, e.shiftKey));
  }

  endGesture(e) {
    if (!this.gesture || e.pointerId !== this.gesture.pointerId) return;
    this.gesture = null;
    $('mainCanvas').style.cursor = '';
  }

  onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      this.exportImage();
    } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey && this.drawing) {
      e.preventDefault();
      this.pad.undo();
    } else if (this.state.selected && !mod && !e.altKey && !e.target.closest(FORM_CONTROLS)) {
      this.onSelectedKey(e);
    }
  }

  onSelectedKey(e) {
    const step = e.shiftKey ? 10 : 1;
    const nudge = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step }
    }[e.key];
    if (nudge) {
      e.preventDefault();
      const { x, y } = this.state.transform;
      this.setTransform({ x: x + nudge.x, y: y + nudge.y });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSignature();
    }
  }

  // ---- Rendering, controls and export -----------------------------------

  render() {
    this.canvas.render(this.state);
  }

  // After background state changes: draw, save, and re-sync every control.
  refresh() {
    this.render();
    saveState(this.state);
    this.syncControls();
  }

  syncControls() {
    const { teamPrefix, asset, backgroundImage, backgroundSettings: bg } = this.state;
    $('teamSelect').value = teamPrefix ?? '';

    const assetSelect = $('assetSelect');
    assetSelect.disabled = !teamPrefix;
    for (const option of assetSelect.options) {
      if (!option.value) continue;
      option.textContent = assetLabel(option.value, this.available);
      option.disabled = this.available !== null && !this.available[option.value];
    }
    assetSelect.value = asset ?? '';

    $('backgroundSection').classList.toggle('hidden', !ASSET_TYPES[asset]?.customBackground);
    $('backgroundType').value = bg.type;
    $('backgroundColor').value = bg.solidColor;
    $('gradientColor1').value = bg.gradientColor1;
    $('gradientColor2').value = bg.gradientColor2;
    $('gradientDirection').value = bg.gradientDirection;
    $('solidColorGroup').classList.toggle('hidden', bg.type !== BACKGROUND_TYPES.SOLID);
    $('gradientGroup').classList.toggle('hidden', bg.type !== BACKGROUND_TYPES.GRADIENT);

    $('exportBtn').disabled = !backgroundImage;
    this.syncSignature();
  }

  async exportImage() {
    const { backgroundImage, teamPrefix, asset } = this.state;
    if (!backgroundImage) return;
    this.render();
    const blob = await this.canvas.toBlob();
    if (!blob) {
      showToast('Export failed.');
      return;
    }
    const teamName = TEAMS.find((team) => team.prefix === teamPrefix).name;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename(teamPrefix, teamName, asset);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Image exported.', 'success');
  }
}

// Left mouse button, or any touch/pen contact; ignores a second finger.
function isPrimaryPress(e) {
  return e.isPrimary && (e.pointerType !== 'mouse' || e.button === 0);
}

listenForTheme();
window.app = new App();
