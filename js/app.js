import { TEAMS, ASSET_TYPES, BACKGROUND_TYPES, DEFAULT_ASSET, SCALE_LIMITS } from './config.js';
import { CanvasManager, renderComposite } from './modules/canvas.js';
import { DrawingPad, padPixelRatio } from './modules/pad.js';
import { padPlacement, validateUpload } from './modules/signature.js';
import { boxStyle, dragTo, normalizeTransform, resizeTo, rotateTo } from './modules/transform.js';
import {
  PLACEMENT, clearPlacements, createSignatureLayer, createTextLayer, editPlacement, layerSize,
  measureWith, resolvePlacements, topLayerAt
} from './modules/layers.js';
import { createState, loadSavedState, saveState } from './modules/state.js';
import { assetLabel, assetUrl, availability, loadManifest, manifestTeams, pickAsset, thumbUrl } from './modules/assets.js';
import { listenForTheme } from './modules/theme.js';
import { exportFilename, loadImage, showToast } from './modules/utils.js';

const $ = (id) => document.getElementById(id);
const FORM_CONTROLS = 'input, select, textarea, [contenteditable]';
const BACKGROUND_INPUTS = {
  backgroundColor: 'solidColor',
  gradientColor1: 'gradientColor1',
  gradientColor2: 'gradientColor2'
};
const TEXT_INPUTS = { textInput: 'text', textColor: 'color', textOutlineColor: 'outlineColor' };

// A drawn signature is shared by every asset, so the pad is sharp enough for
// the widest one at its default size.
const PAD_SHARED_BITMAP_WIDTH = PLACEMENT.signatureMaxWidth * Math.max(...Object.values(ASSET_TYPES).map((a) => a.width));

// Resolves once the layers' fonts are loaded; a missing font falls back instead of blocking.
const loadFonts = (layers) => Promise.all(
  layers
    .filter((layer) => layer.kind === 'text')
    .map((layer) => document.fonts.load(`${layer.font.weight} 64px "${layer.font.family}"`, layer.text).catch(() => {}))
);

// Fires 'change' after every render, for UI built on top (kit thumbnails).
class App extends EventTarget {
  constructor() {
    super();
    this.state = createState();
    this.manifest = {}; // { [prefix]: [file names] }
    this.available = null; // { [asset]: boolean } for the selected team
    this.thumbs = new Map(); // asset -> Promise<thumbnail image>, for the selected team
    this.requestId = 0; // lets a newer team/asset request cancel an older one
    this.gesture = null;
    this.drawing = false;

    this.canvas = new CanvasManager($('mainCanvas'), $('canvasWrapper'));
    this.pad = new DrawingPad($('drawingCanvas'), () => this.readBrush());
    this.measure = measureWith(document.createElement('canvas').getContext('2d'));
    this.sliders = [...document.querySelectorAll('.transform-controls input[type="range"]')];
    this.canvas.setDimensions(this.assetSize.width, this.assetSize.height);

    this.populateSelects();
    this.bindControls();
    this.bindText();
    this.bindGestures();
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    new ResizeObserver(() => this.syncPad()).observe($('drawingCanvas'));
    this.init();
  }

  // The stage shows the selected asset; before a franchise is chosen it is a blank Sticker.
  get assetKey() {
    return this.state.asset ?? DEFAULT_ASSET;
  }

  get assetSize() {
    const { width, height } = ASSET_TYPES[this.assetKey];
    return { width, height };
  }

  get selected() {
    return this.state.layers.find((layer) => layer.id === this.state.selectedId) ?? null;
  }

  // The selected layer's placement on the current asset, stored or default.
  get placement() {
    return this.selected && this.placementOf(this.selected);
  }

  placementOf(layer) {
    const { layers } = this.state;
    return resolvePlacements(layers, this.assetKey, this.assetSize, this.measure)[layers.indexOf(layer)];
  }

  populateSelects() {
    $('teamSelect').append(new Option('Select a Franchise', ''));
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
    $('undoStroke').addEventListener('click', () => this.pad.undo());
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
        this.setPlacement({ [stateKey]: Number(slider.value) * Number(multiplier) });
      });
    }
    $('resetTransform').addEventListener('click', () => this.resetPlacement());
    $('deleteSignature').addEventListener('click', () => this.deleteLayer());
    $('doneTransform').addEventListener('click', () => this.select(null));

    $('exportBtn').addEventListener('click', () => this.exportImage());
  }

  async init() {
    const saved = loadSavedState();
    this.state.backgroundSettings = saved.backgroundSettings;
    this.syncControls();
    try {
      this.manifest = await loadManifest();
    } catch {
      showToast('Could not load the franchise list.');
      return;
    }
    for (const team of manifestTeams(this.manifest)) $('teamSelect').append(new Option(`${team.name} (${team.prefix})`, team.prefix));
    if (this.manifest[saved.teamPrefix]) await this.selectTeam(saved.teamPrefix, saved.asset);
  }

  // ---- Background -------------------------------------------------------

  async selectTeam(prefix, wantedAsset) {
    const id = ++this.requestId;
    if (!prefix) {
      clearPlacements(this.state.layers);
      Object.assign(this.state, { teamPrefix: null, asset: null, backgroundImage: null });
      this.available = null;
      this.thumbs.clear();
      this.refresh();
      return;
    }
    const available = availability(this.manifest[prefix]);
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
    delete $('mainCanvas').dataset.asset;
    let image;
    try {
      image = await loadImage(assetUrl(prefix, asset));
    } catch {
      if (id !== this.requestId) return;
      showToast('Failed to load the background image.');
      this.syncControls();
      this.syncStageAsset();
      return;
    }
    if (id !== this.requestId) return;
    if (prefix !== this.state.teamPrefix) {
      // Placements belong to a team's assets; the layers stay. Picking the first team keeps
      // what was drawn on the blank stage.
      if (this.state.teamPrefix) clearPlacements(this.state.layers);
      this.thumbs.clear();
    }
    Object.assign(this.state, { teamPrefix: prefix, asset, backgroundImage: image });
    this.available = available;
    this.canvas.setDimensions(ASSET_TYPES[asset].width, ASSET_TYPES[asset].height);
    this.refresh();
  }

  setBackground(change) {
    Object.assign(this.state.backgroundSettings, change);
    this.refresh();
  }

  // ---- Signature: drawing and upload ------------------------------------

  startDrawing() {
    this.drawing = true;
    this.select(null);
    this.syncDrawingUI();
    this.syncPad();
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

  // The pad overlays the stage, so it follows the stage's displayed size.
  syncPad() {
    const { width, height } = $('drawingCanvas').getBoundingClientRect();
    if (!width || !height) return;
    // At least the stage's own pixel width too, so it isn't upscaled on the asset it was drawn on.
    const minWidth = Math.max(PAD_SHARED_BITMAP_WIDTH, this.assetSize.width);
    this.pad.resize(width, height, padPixelRatio(width, height, devicePixelRatio, minWidth));
  }

  readBrush() {
    return {
      size: Number($('brushSize').value),
      color: $('brushColor').value,
      outlineWidth: Number($('strokeWidth').value),
      outlineColor: $('strokeColor').value
    };
  }

  applyDrawing() {
    const capture = this.pad.capture();
    if (!capture) {
      showToast('Draw your signature first.', 'warning');
      return;
    }
    this.stopDrawing();
    // Drawn over the stage, so it starts where it was drawn on this asset; every other asset uses the default.
    const layer = createSignatureLayer(capture.image);
    layer.origins[this.assetKey] = normalizeTransform(padPlacement(capture, this.assetSize), this.assetSize);
    this.addLayer(layer);
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
      this.addLayer(createSignatureLayer(await loadImage(url)));
      $('uploadWrapper').classList.add('hidden');
    } catch {
      showToast('Could not read that image.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---- Layers -----------------------------------------------------------

  addLayer(layer) {
    this.state.layers.push(layer);
    this.select(layer.id);
    this.render();
  }

  async addText() {
    const layer = createTextLayer({
      text: 'Your Name',
      color: $('textColor').value,
      outlineColor: $('textOutlineColor').value,
      outlineWidth: Number($('textOutlineWidth').value)
    });
    await loadFonts([layer]);
    this.addLayer(layer);
    $('textInput').focus();
    $('textInput').select();
  }

  bindText() {
    $('addTextBtn').addEventListener('click', () => this.addText());
    for (const [id, key] of Object.entries(TEXT_INPUTS)) {
      $(id).addEventListener('input', (e) => this.editText({ [key]: e.target.value }));
    }
    $('textOutlineWidth').addEventListener('input', (e) => {
      $('textOutlineWidthValue').textContent = e.target.value;
      this.editText({ outlineWidth: Number(e.target.value) });
    });
  }

  // Edits the selected text layer; with none selected the controls just set the next one's defaults.
  async editText(change) {
    const layer = this.selected;
    if (layer?.kind !== 'text') return;
    Object.assign(layer, change);
    if ('text' in change) await loadFonts([layer]); // new characters may need another font subset
    this.syncLayer();
    this.render();
  }

  select(id) {
    this.state.selectedId = id;
    this.syncTextControls();
    this.syncLayer();
  }

  deleteLayer() {
    const layer = this.selected;
    if (!layer || !confirm('Delete the selected layer?')) return;
    this.state.layers = this.state.layers.filter((l) => l !== layer);
    this.select(null);
    this.render();
  }

  // Changes the selected layer's placement on the current asset only.
  setPlacement(change) {
    const layer = this.selected;
    if (!layer) return;
    layer.placements = editPlacement(layer.placements, this.assetKey, this.placementOf(layer), change, this.assetSize);
    this.syncLayer();
    this.render();
  }

  // Drops the manual placement so the asset falls back to where the signature was drawn, or its default.
  resetPlacement() {
    const layer = this.selected;
    if (!layer) return;
    const { [this.assetKey]: removed, ...rest } = layer.placements;
    layer.placements = rest;
    this.syncLayer();
    this.render();
  }

  // Brings sliders, labels, the selection box and section visibility in line with the selection.
  syncLayer() {
    const layer = this.selected;
    $('transformSection').classList.toggle('hidden', !layer);
    $('signatureBox').classList.toggle('active', layer !== null);
    if (!layer) return;

    const placement = this.placementOf(layer);
    for (const slider of this.sliders) {
      const { stateKey, unit = '', multiplier = '1' } = slider.dataset;
      const value = placement[stateKey] / Number(multiplier);
      slider.value = value;
      slider.nextElementSibling.textContent = `${Math.round(value)}${unit}`;
    }

    const box = boxStyle(placement, layerSize(layer, this.measure), this.assetSize);
    Object.assign($('signatureBox').style, {
      left: `${box.left}%`,
      top: `${box.top}%`,
      width: `${box.width}%`,
      height: `${box.height}%`,
      transform: `rotate(${box.rotation}deg)`
    });
  }

  syncTextControls() {
    const layer = this.selected;
    const text = layer?.kind === 'text' ? layer : null;
    $('textInput').disabled = !text;
    if (!text) return;
    $('textInput').value = text.text;
    $('textColor').value = text.color;
    $('textOutlineColor').value = text.outlineColor;
    $('textOutlineWidth').value = text.outlineWidth;
    $('textOutlineWidthValue').textContent = text.outlineWidth;
  }

  // ---- Pointer and keyboard ---------------------------------------------

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

  // Pressing on a layer selects the topmost one there and starts dragging it in one gesture.
  onCanvasDown(e) {
    if (this.drawing) return;
    const hit = topLayerAt(this.state.layers, this.canvas.pointFromEvent(e), this.assetKey, this.assetSize, this.measure);
    if (!hit) return;
    this.select(hit.id);
    this.beginGesture(e, 'drag');
  }

  beginGesture(e, kind) {
    const layer = this.selected;
    if (!layer || this.gesture || !isPrimaryPress(e)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    this.gesture = {
      kind,
      pointerId: e.pointerId,
      start: { ...this.placementOf(layer) },
      startPoint: this.canvas.pointFromEvent(e)
    };
    if (kind === 'drag') $('mainCanvas').style.cursor = 'grabbing';
  }

  moveGesture(e) {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointerId) return;
    const point = this.canvas.pointFromEvent(e);
    if (g.kind === 'drag') this.setPlacement(dragTo(g.start, g.startPoint, point));
    else if (g.kind === 'resize') this.setPlacement(resizeTo(g.start, g.startPoint, point));
    else this.setPlacement(rotateTo(g.start, g.startPoint, point, e.shiftKey));
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
    } else if (this.selected && !mod && !e.altKey && !e.target.closest(FORM_CONTROLS)) {
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
      const { x, y } = this.placement;
      this.setPlacement({ x: x + nudge.x, y: y + nudge.y });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteLayer();
    }
  }

  // ---- Rendering, controls and export -----------------------------------

  // Everything renderComposite needs to draw an asset, over the given image.
  scene(assetKey, image) {
    const { width, height } = ASSET_TYPES[assetKey];
    return {
      image,
      assetSize: { width, height },
      backgroundSettings: this.state.backgroundSettings,
      customBackground: Boolean(ASSET_TYPES[assetKey].customBackground),
      layers: this.state.layers,
      assetKey
    };
  }

  render() {
    this.canvas.render(this.scene(this.assetKey, this.state.backgroundImage));
    this.dispatchEvent(new Event('change'));
  }

  // After background state changes: draw, save, and re-sync every control.
  refresh() {
    this.render();
    saveState(this.state);
    this.syncControls();
    this.syncStageAsset();
  }

  // Test hook: #mainCanvas[data-asset] is "<PREFIX>/<AssetKey>" once that asset's
  // background is on the stage, and absent while one is loading or none is chosen.
  syncStageAsset() {
    const { teamPrefix, asset, backgroundImage } = this.state;
    const dataset = $('mainCanvas').dataset;
    if (teamPrefix && asset && backgroundImage) dataset.asset = `${teamPrefix}/${asset}`;
    else delete dataset.asset;
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
    this.syncLayer();
  }

  // ---- Kit: every asset of the team, signed ------------------------------

  // PNG blob of one asset at its export size, with every layer on it. Loads the
  // asset's full-size image unless it is the one on the stage.
  async exportAsset(assetKey) {
    const { teamPrefix, layers } = this.state;
    if (!teamPrefix) return null;
    const [image] = await Promise.all([
      assetKey === this.state.asset ? this.state.backgroundImage : loadImage(assetUrl(teamPrefix, assetKey)),
      loadFonts(layers)
    ]);
    const scene = this.scene(assetKey, image);
    const canvas = document.createElement('canvas');
    Object.assign(canvas, scene.assetSize);
    renderComposite(canvas.getContext('2d'), scene);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  // Draws an asset's thumbnail with the layers on top, scaled to the canvas width.
  // Size the canvas to the asset's aspect ratio first.
  async renderThumb(canvas, assetKey) {
    const prefix = this.state.teamPrefix;
    if (!prefix) return;
    if (!this.thumbs.has(assetKey)) this.thumbs.set(assetKey, loadImage(thumbUrl(prefix, assetKey)));
    const [image] = await Promise.all([this.thumbs.get(assetKey), loadFonts(this.state.layers)]);
    if (prefix !== this.state.teamPrefix) return; // the team changed while this loaded
    const scene = this.scene(assetKey, image);
    renderComposite(canvas.getContext('2d'), { ...scene, scale: canvas.width / scene.assetSize.width });
  }

  async exportImage() {
    const { teamPrefix, asset } = this.state;
    if (!asset) return;
    const blob = await this.exportAsset(asset);
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
