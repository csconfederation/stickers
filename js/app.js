import { TEAMS, ASSET_TYPES, BACKGROUND_TYPES, DEFAULT_ASSET, SCALE_LIMITS } from './config.js';
import { CanvasManager, renderComposite } from './modules/canvas.js';
import { DrawingPad, padPixelRatio } from './modules/pad.js';
import { padPlacement, uploadSize, validateUpload } from './modules/signature.js';
import { boxStyle, dragTo, normalizeTransform, resizeTo, rotateTo } from './modules/transform.js';
import {
  PLACEMENT, clearPlacements, createSignatureLayer, createTextLayer, editPlacement, layerSize,
  measureWith, resolvePlacements, topLayerAt
} from './modules/layers.js';
import { createState, loadSavedState, saveState } from './modules/state.js';
import { assetUrl, availability, loadManifest, manifestTeams, pickAsset, thumbUrl } from './modules/assets.js';
import { listenForTheme } from './modules/theme.js';
import { clamp, exportFilename, loadImage, showToast } from './modules/utils.js';

const $ = (id) => document.getElementById(id);
const FORM_CONTROLS = 'input, select, textarea, [contenteditable]';
// Arrow keys and Delete act on the selected layer only from these, so they never fight a tab list or the kit.
const LAYER_KEY_SCOPE = '#canvasWrapper, #layerList, #layerBar';
const BACKGROUND_INPUTS = {
  backgroundColor: 'solidColor',
  gradientColor1: 'gradientColor1',
  gradientColor2: 'gradientColor2'
};
const TEXT_INPUTS = { textColor: 'color', textOutlineColor: 'outlineColor' };
const BACKGROUND_HINTS = {
  [BACKGROUND_TYPES.ORIGINAL]: 'Swap the backdrop behind the sticker for a color, a gradient or nothing.',
  [BACKGROUND_TYPES.TRANSPARENT]: 'See-through PNG. The checkerboard only shows where.'
};

// The kit sheet: which assets share a row (squares first, then wider), and each one's short label.
const KIT_ROWS = [
  ['Sticker', 'StickerShadow', 'SeasonTeamSticker', 'SeasonSignatureSticker'],
  ['ProfilePicture', 'DesktopBackground', 'YoutubeBanner'],
  ['DiscordBanner', 'TwitterBanner'],
  ['TwitchBanner']
];
const KIT_LABELS = {
  Sticker: 'Sticker',
  StickerShadow: 'Sticker shadow',
  SeasonTeamSticker: 'Season team',
  SeasonSignatureSticker: 'Season signature',
  ProfilePicture: 'Avatar',
  DesktopBackground: 'Wallpaper',
  YoutubeBanner: 'YouTube',
  DiscordBanner: 'Discord',
  TwitterBanner: 'Twitter/X',
  TwitchBanner: 'Twitch'
};
const THUMB_MAX_WIDTH = 480; // THUMB_SIZE in scripts/build_assets.py
const KIT_THROTTLE_MS = 100;
const LAND_STAGGER_MS = 45;

// Phones, upright or on their side, sign on a full-screen pad; wider screens
// sign over the stage.
const sheetSigning = matchMedia('(max-width: 599px), (max-height: 500px) and (pointer: coarse)');
const stacked = matchMedia('(max-width: 899px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// A drawn signature is shared by every asset, so the pad is sharp enough for
// the widest one at its default size.
const PAD_SHARED_BITMAP_WIDTH = PLACEMENT.signatureMaxWidth * Math.max(...Object.values(ASSET_TYPES).map((a) => a.width));

// Resolves once the layers' fonts are loaded; a missing font falls back instead of blocking.
const loadFonts = (layers) => Promise.all(
  layers
    .filter((layer) => layer.kind === 'text')
    .map((layer) => document.fonts.load(`${layer.font.weight} 64px "${layer.font.family}"`, layer.text).catch(() => {}))
);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'class') el.className = value;
    else if (value !== false && value != null) el.setAttribute(name, value === true ? '' : value);
  }
  el.append(...children);
  return el;
}

function icon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

// The track fill for a range input (see input[type="range"] in css/styles.css).
function paintRange(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  input.style.setProperty('--fill', `${(Number(input.value) - min) / (max - min) * 100}%`);
}

// Rough luminance, enough to pick a pad surface the ink shows up on.
function isLightColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}

// Bounds of the pixels with real opacity, in image pixels, from a small sample.
function opaqueBox(img) {
  const n = 64;
  const ctx = h('canvas', { width: n, height: n }).getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, n, n);
  const { data } = ctx.getImageData(0, 0, n, n);
  let [left, top, right, bottom] = [n, n, -1, -1];
  for (let i = 0; i < n * n; i++) {
    if (data[i * 4 + 3] < 16) continue;
    const x = i % n;
    const y = (i - x) / n;
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  if (right < 0) return null;
  const sx = img.naturalWidth / n;
  const sy = img.naturalHeight / n;
  return { x: left * sx, y: top * sy, width: (right - left + 1) * sx, height: (bottom - top + 1) * sy };
}

// A team's art cropped to its opaque pixels and fit to a size-px square, so art
// drawn with wide transparent margins sits as large as the rest. Resolves to a canvas.
async function trimmedArt(src, size) {
  const img = await loadImage(src);
  const box = opaqueBox(img) ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
  const px = Math.round(size * devicePixelRatio);
  const canvas = h('canvas', { width: px, height: px, 'aria-hidden': 'true' });
  const fit = Math.min(px / box.width, px / box.height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, box.x, box.y, box.width, box.height,
    (px - box.width * fit) / 2, (px - box.height * fit) / 2, box.width * fit, box.height * fit);
  return canvas;
}

// An uploaded image no larger than UPLOAD.maxSide, so every asset can fit it.
function fitUpload(img) {
  const { width, height } = uploadSize(img.naturalWidth, img.naturalHeight);
  if (width === img.naturalWidth && height === img.naturalHeight) return img;
  const canvas = h('canvas', { width, height });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// A toast with one action, for undoing a delete.
function actionToast(message, label, onAction) {
  const button = h('button', { type: 'button', class: 'btn', 'data-testid': 'toast-undo' }, icon('arrow-back-up'), label);
  const toast = h('div', { class: 'toast', role: 'status' }, h('span', {}, message), button);
  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  };
  button.addEventListener('click', () => {
    onAction();
    dismiss();
  }, { once: true });
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(dismiss, 6000);
}

// Fires 'change' after every render, for UI built on top (kit thumbnails).
class App extends EventTarget {
  constructor() {
    super();
    this.state = createState();
    this.manifest = {}; // { [prefix]: [file names] }
    this.teams = []; // TEAMS that have assets, for the franchise wall
    this.available = null; // { [asset]: boolean } for the selected team
    this.thumbs = new Map(); // asset -> Promise<thumbnail image>, for the selected team
    this.requestId = 0; // lets a newer team/asset request cancel an older one
    this.gesture = null;
    this.drawing = null; // 'overlay' (pad over the stage) or 'sheet' (full-screen pad) while signing
    this.placing = false; // true while only the current asset's placement changes
    this.kit = new Map(); // asset -> { tile, pick, thumb, canvas, message, download }
    this.kitFrame = 0;
    this.kitTimer = 0;
    this.textBound = false; // the text field shows the selected text layer
    this.wallArtLoaded = false;
    this.stageAction = null;

    this.canvas = new CanvasManager($('mainCanvas'), $('canvasWrapper'));
    this.overlayPad = new DrawingPad($('drawingCanvas'), () => this.readBrush());
    this.sheetPad = new DrawingPad($('signPad'), () => this.readBrush());
    this.measure = measureWith(document.createElement('canvas').getContext('2d'));
    this.sliders = [...$('layerControls').querySelectorAll('input[type="range"]')];
    this.tabs = [...document.querySelectorAll('[role="tab"]')];
    this.canvas.setDimensions(this.assetSize.width, this.assetSize.height);

    const scale = $('scaleSlider');
    scale.min = SCALE_LIMITS.min * 100;
    scale.max = SCALE_LIMITS.max * 100;

    this.buildKit();
    this.bindHeader();
    this.bindWall();
    this.bindTabs();
    this.bindSign();
    this.bindText();
    this.bindBackground();
    this.bindLayerControls();
    this.bindGestures();
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('input', (e) => {
      if (e.target.type === 'range') paintRange(e.target);
    });
    for (const input of document.querySelectorAll('input[type="range"]')) paintRange(input);
    const padObserver = new ResizeObserver(() => this.syncPads());
    padObserver.observe($('drawingCanvas'));
    padObserver.observe($('signPad'));
    this.addEventListener('change', () => this.queueKit());
    this.setTab('tabSign');
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

  get pad() {
    return this.drawing === 'sheet' ? this.sheetPad : this.overlayPad;
  }

  get team() {
    return TEAMS.find((team) => team.prefix === this.state.teamPrefix) ?? null;
  }

  placementOf(layer) {
    const { layers } = this.state;
    return resolvePlacements(layers, this.assetKey, this.assetSize, this.measure)[layers.indexOf(layer)];
  }

  async init() {
    const saved = loadSavedState();
    this.state.backgroundSettings = saved.backgroundSettings;
    this.setStage('loading');
    this.syncControls();
    try {
      this.manifest = await loadManifest();
    } catch {
      this.setStage('error', "Couldn't load the franchise list. Check your connection and try again.", 'Try again', () => this.init());
      return;
    }
    this.teams = manifestTeams(this.manifest);
    this.buildWall();
    if (this.teams.some((team) => team.prefix === saved.teamPrefix)) {
      await this.selectTeam(saved.teamPrefix, saved.asset);
    } else {
      this.setStage('empty');
      this.openWall();
    }
  }

  // state is 'empty' (no franchise yet), 'loading', 'ready' or 'error'; empty and
  // error show a message with one action.
  setStage(state, message = '', actionLabel = '', action = null) {
    if (state === 'empty') {
      message = 'Pick your franchise to load its stickers, banners and wallpaper.';
      actionLabel = 'Pick your franchise';
      action = () => this.openWall();
    }
    $('stage').dataset.state = state;
    $('stageMessage').hidden = !message;
    $('stageMessageText').textContent = message;
    $('stageMessageBtn').textContent = actionLabel;
    this.stageAction = action;
    this.syncDownload();
    // The stage resizes when the asset arrives, which would shift ink on the pad.
    $('drawBtn').disabled = state === 'loading' || state === 'error';
  }

  bindHeader() {
    $('franchiseChip').addEventListener('click', () => this.openWall());
    $('downloadBtn').addEventListener('click', () => this.download(this.state.asset, $('downloadBtn')));
    $('stageMessageBtn').addEventListener('click', () => this.stageAction?.());
  }

  // ---- Franchise wall ----------------------------------------------------

  bindWall() {
    const wall = $('franchiseWall');
    $('wallClose').addEventListener('click', () => wall.close());
    // A click on the backdrop targets the dialog itself, outside its box.
    wall.addEventListener('click', (e) => {
      if (e.target !== wall) return;
      const r = wall.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) wall.close();
    });
    wall.addEventListener('close', () => $('franchiseChip').setAttribute('aria-expanded', 'false'));
    $('wallGrid').addEventListener('click', (e) => {
      const item = e.target.closest('.wall-item');
      if (!item) return;
      wall.close();
      this.selectTeam(item.dataset.prefix, this.state.asset);
    });
    $('wallGrid').addEventListener('keydown', (e) => this.onWallKey(e));
  }

  buildWall() {
    this.wallArtLoaded = false;
    const items = this.teams.map((team) => {
      const frame = h('span', { class: 'wall-art', 'data-src': this.teamArt(team.prefix) });
      const button = h('button', {
        type: 'button',
        class: 'wall-item',
        tabindex: -1,
        'data-prefix': team.prefix,
        'data-testid': `team-${team.prefix}`,
        'aria-label': `${team.name} (${team.prefix})`
      }, frame, h('span', { class: 'wall-code mono' }, team.prefix), h('span', { class: 'wall-name' }, team.name));
      return h('li', {}, button);
    });
    $('wallGrid').replaceChildren(...items);
    this.syncWall();
  }

  // Rings the current franchise and makes it the one tab stop in the grid.
  syncWall() {
    const items = [...$('wallGrid').querySelectorAll('.wall-item')];
    const current = items.find((item) => item.dataset.prefix === this.state.teamPrefix);
    for (const item of items) {
      if (item === current) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
      item.tabIndex = item === (current ?? items[0]) ? 0 : -1;
    }
  }

  openWall() {
    const wall = $('franchiseWall');
    if (wall.open || this.drawing || !this.teams.length) return;
    this.syncWall();
    this.loadWallArt();
    wall.showModal();
    $('franchiseChip').setAttribute('aria-expanded', 'true');
    $('wallGrid').querySelector('.wall-item[tabindex="0"]')?.focus(); // the current franchise, or the first
  }

  // The wall's art loads the first time it opens, not on every page load.
  loadWallArt() {
    if (this.wallArtLoaded) return;
    this.wallArtLoaded = true;
    for (const frame of $('wallGrid').querySelectorAll('.wall-art')) {
      trimmedArt(frame.dataset.src, 72)
        .then((canvas) => frame.append(canvas), () => {})
        .finally(() => frame.classList.add('is-loaded'));
    }
  }

  // The thumbnail that stands for a team: its Sticker, else the first asset it has.
  teamArt(prefix) {
    return thumbUrl(prefix, pickAsset(DEFAULT_ASSET, availability(this.manifest[prefix])));
  }

  // Arrow keys walk the grid by its rendered column count.
  onWallKey(e) {
    const items = [...$('wallGrid').querySelectorAll('.wall-item')];
    const index = items.indexOf(document.activeElement);
    if (index === -1) return;
    const columns = getComputedStyle($('wallGrid')).gridTemplateColumns.split(' ').length;
    const target = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + columns,
      ArrowUp: index - columns,
      Home: 0,
      End: items.length - 1
    }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    const next = items[clamp(target, 0, items.length - 1)];
    items[index].tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  }

  // ---- Background -------------------------------------------------------

  async selectTeam(prefix, wantedAsset) {
    const id = ++this.requestId;
    const available = availability(this.manifest[prefix]);
    const asset = pickAsset(wantedAsset, available);
    if (!asset) {
      showToast('Nothing has been made for that franchise yet.');
      return;
    }
    await this.showBackground(prefix, asset, available, id);
  }

  async selectAsset(asset) {
    await this.showBackground(this.state.teamPrefix, asset, this.available, ++this.requestId);
  }

  // Every pick supersedes a load still pending (id is the newest request), so the last
  // pick wins. Picking what the stage already shows restores it without a load.
  async showBackground(prefix, asset, available, id) {
    if (prefix === this.state.teamPrefix && asset === this.state.asset && this.state.backgroundImage) {
      this.setStage('ready');
      this.syncStageAsset();
      return;
    }
    delete $('mainCanvas').dataset.asset;
    this.setStage('loading');
    let image;
    try {
      image = await loadImage(assetUrl(prefix, asset));
    } catch {
      if (id !== this.requestId) return;
      const retry = () => this.showBackground(prefix, asset, available, ++this.requestId);
      this.setStage('error', `Couldn't load the ${ASSET_TYPES[asset].displayName}. Check your connection and try again.`, 'Try again', retry);
      this.syncStageAsset();
      return;
    }
    if (id !== this.requestId) return;
    if (prefix !== this.state.teamPrefix) {
      // Placements belong to a team's assets; the layers stay. Picking the first team keeps
      // what was drawn on the blank stage.
      if (this.state.teamPrefix) clearPlacements(this.state.layers);
      this.thumbs.clear();
      this.clearKit();
    }
    Object.assign(this.state, { teamPrefix: prefix, asset, backgroundImage: image });
    this.available = available;
    this.canvas.setDimensions(ASSET_TYPES[asset].width, ASSET_TYPES[asset].height);
    this.setStage('ready');
    this.refresh();
    this.syncPads();
  }

  setBackground(change) {
    Object.assign(this.state.backgroundSettings, change);
    this.refresh();
  }

  bindBackground() {
    for (const radio of document.querySelectorAll('input[name="backgroundType"]')) {
      radio.addEventListener('change', () => this.setBackground({ type: radio.value }));
    }
    $('gradientDirection').addEventListener('change', (e) => this.setBackground({ gradientDirection: e.target.value }));
    for (const [id, key] of Object.entries(BACKGROUND_INPUTS)) {
      $(id).addEventListener('input', (e) => this.setBackground({ [key]: e.target.value }));
    }
  }

  syncBackground() {
    const bg = this.state.backgroundSettings;
    for (const radio of document.querySelectorAll('input[name="backgroundType"]')) radio.checked = radio.value === bg.type;
    $('backgroundColor').value = bg.solidColor;
    $('gradientColor1').value = bg.gradientColor1;
    $('gradientColor2').value = bg.gradientColor2;
    $('gradientDirection').value = bg.gradientDirection;
    $('solidColorGroup').hidden = bg.type !== BACKGROUND_TYPES.SOLID;
    $('gradientGroup').hidden = bg.type !== BACKGROUND_TYPES.GRADIENT;
    $('bgHint').hidden = !BACKGROUND_HINTS[bg.type];
    $('bgHint').textContent = BACKGROUND_HINTS[bg.type] ?? '';
  }

  // ---- Tool tabs ----------------------------------------------------------

  bindTabs() {
    for (const tab of this.tabs) tab.addEventListener('click', () => this.setTab(tab.id));
    $('tabSign').parentElement.addEventListener('keydown', (e) => {
      const visible = this.tabs.filter((tab) => !tab.hidden);
      const index = visible.indexOf(document.activeElement);
      const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: visible.length - 1 }[e.key];
      if (index === -1 || target === undefined) return;
      e.preventDefault();
      const next = visible[(target + visible.length) % visible.length];
      this.setTab(next.id);
      next.focus();
    });
  }

  get activeTab() {
    return this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.id;
  }

  setTab(id) {
    for (const tab of this.tabs) {
      const on = tab.id === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $(tab.dataset.panel).classList.toggle('is-off', !on);
    }
  }

  // Shows the tab that edits a layer's content when it gets picked.
  revealTool(layer) {
    if (layer?.kind === 'text') this.setTab('tabText');
    else if (layer && this.activeTab === 'tabText') this.setTab('tabSign');
  }

  // ---- Signature: drawing and upload ------------------------------------

  bindSign() {
    $('drawBtn').addEventListener('click', () => this.startDrawing());
    $('uploadBtn').addEventListener('click', () => $('fileInput').click());
    $('fileInput').addEventListener('change', (e) => this.handleUpload(e));

    $('undoStroke').addEventListener('click', () => {
      this.pad.undo();
      this.syncSignActions();
    });
    $('clearDrawing').addEventListener('click', () => {
      this.pad.clear();
      this.syncSignActions();
    });
    $('cancelDrawing').addEventListener('click', () => this.stopDrawing());
    $('applyDrawing').addEventListener('click', () => this.applyDrawing());
    // Esc on the full-screen pad cancels signing.
    $('signView').addEventListener('cancel', (e) => {
      e.preventDefault();
      this.stopDrawing();
    });
    for (const pad of [this.overlayPad, this.sheetPad]) {
      for (const type of ['pointerup', 'pointercancel']) pad.canvas.addEventListener(type, () => this.syncSignActions());
    }
    for (const id of ['brushSize', 'strokeWidth']) {
      $(id).addEventListener('input', (e) => { $(`${id}Value`).textContent = e.target.value; });
    }
    $('brushColor').addEventListener('input', () => this.syncPaper());
  }

  startDrawing() {
    if (this.drawing || $('drawBtn').disabled) return;
    this.select(null);
    this.drawing = sheetSigning.matches ? 'sheet' : 'overlay';
    this.pad.clear();
    if (this.drawing === 'sheet') $('signView').showModal();
    else $('signView').show();
    this.syncDrawingUI();
    this.syncPads();
    this.syncPaper();
  }

  stopDrawing() {
    if (!this.drawing) return;
    this.pad.clear();
    this.drawing = null;
    $('signView').close();
    this.syncDrawingUI();
    $('drawBtn').focus({ preventScroll: true });
  }

  // While signing, nothing may resize the stage under the pad: that would stretch the ink.
  syncDrawingUI() {
    const overlay = this.drawing === 'overlay';
    const locked = Boolean(this.drawing);
    $('panelSign').classList.toggle('is-drawing', locked);
    $('canvasWrapper').classList.toggle('drawing-mode', overlay);
    $('drawingCanvas').classList.toggle('active', overlay);
    for (const el of [$('kit'), document.querySelector('.tray-head'), $('layerBar')]) el.inert = locked;
    $('franchiseChip').disabled = locked;
    this.syncDownload();
    this.syncSignActions();
    this.syncStageHint();
  }

  syncSignActions() {
    const empty = !this.drawing || this.pad.isEmpty;
    for (const id of ['undoStroke', 'clearDrawing', 'applyDrawing']) $(id).disabled = empty;
  }

  // Each pad follows its displayed size. The stage pad keeps at least the asset's own
  // width too, so the signature isn't upscaled on the asset it was drawn on.
  syncPads() {
    const pads = [
      [this.overlayPad, Math.max(PAD_SHARED_BITMAP_WIDTH, this.assetSize.width)],
      [this.sheetPad, PAD_SHARED_BITMAP_WIDTH]
    ];
    for (const [pad, minWidth] of pads) {
      const { width, height } = pad.canvas.getBoundingClientRect();
      if (width && height) pad.resize(width, height, padPixelRatio(width, height, devicePixelRatio, minWidth));
    }
  }

  // Light ink gets a dark sheet and dark ink a light one, so the default white and a black pen both show.
  syncPaper() {
    $('signPaper').dataset.ink = isLightColor($('brushColor').value) ? 'light' : 'dark';
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
    if (!capture) return;
    const layer = createSignatureLayer(capture.image);
    // Drawn over the stage, it starts where it was drawn on this asset; every other
    // asset, and the full-screen pad, use the default placement.
    if (this.drawing === 'overlay') {
      layer.origins[this.assetKey] = normalizeTransform(padPlacement(capture, this.assetSize), this.assetSize);
    }
    this.stopDrawing();
    this.addLayer(layer, { land: true });
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
      this.addLayer(createSignatureLayer(fitUpload(await loadImage(url))), { land: true });
    } catch {
      showToast("Couldn't read that image. Try a PNG or a JPEG.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---- Layers -----------------------------------------------------------

  addLayer(layer, { land = false } = {}) {
    const before = land ? this.snapshotKit() : null;
    this.state.layers.push(layer);
    this.select(layer.id);
    this.render();
    if (land) this.revealKit();
    if (before) this.landOnKit(layer, before);
  }

  // In the stacked layout a new signature brings the kit strip into view from its
  // first tile, so the player sees it land.
  revealKit() {
    if (!stacked.matches) return;
    $('kitSheet').scrollTo({ left: 0 });
    $('kit').scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  layerName(layer) {
    if (layer.kind === 'text') return layer.text.trim() || 'Text';
    const signatures = this.state.layers.filter((l) => l.kind === 'signature');
    return signatures.length > 1 ? `Signature ${signatures.indexOf(layer) + 1}` : 'Signature';
  }

  async addText() {
    const typed = this.selected?.kind === 'text' ? '' : $('textInput').value.trim();
    const layer = createTextLayer({
      text: typed || 'Your Name',
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
    $('textInput').addEventListener('input', (e) => this.editText({ text: e.target.value }));
    $('textInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.selected?.kind !== 'text') {
        e.preventDefault();
        this.addText();
      }
    });
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
    if ('text' in change) {
      await loadFonts([layer]); // new characters may need another font subset
      this.syncLayerList();
    }
    this.syncLayer();
    this.render();
  }

  select(id) {
    this.state.selectedId = id;
    this.syncTextControls();
    this.syncLayer();
    this.syncLayerList();
    this.syncStageHint();
  }

  // Deletes at once; the toast's Undo puts the layer back where it was.
  deleteLayer() {
    const layer = this.selected;
    if (!layer) return;
    const name = this.layerName(layer);
    const index = this.state.layers.indexOf(layer);
    const prefix = this.state.teamPrefix;
    this.state.layers.splice(index, 1);
    this.select(null);
    this.render();
    actionToast(`${name} deleted.`, 'Undo', () => {
      if (this.state.layers.includes(layer)) return;
      if (this.state.teamPrefix !== prefix) clearPlacements([layer]); // they were for the other team's assets
      this.state.layers.splice(Math.min(index, this.state.layers.length), 0, layer);
      this.select(layer.id);
      this.render();
    });
  }

  // Changes the selected layer's placement on the current asset only.
  setPlacement(change) {
    const layer = this.selected;
    if (!layer) return;
    layer.placements = editPlacement(layer.placements, this.assetKey, this.placementOf(layer), change, this.assetSize);
    this.syncLayer();
    this.placing = true;
    this.render();
    this.placing = false;
  }

  // Drops the manual placement so the asset falls back to where the signature was drawn, or its default.
  resetPlacement() {
    const layer = this.selected;
    if (!layer) return;
    const { [this.assetKey]: removed, ...rest } = layer.placements;
    layer.placements = rest;
    this.syncLayer();
    this.placing = true;
    this.render();
    this.placing = false;
  }

  bindLayerControls() {
    for (const slider of this.sliders) {
      slider.addEventListener('input', () => {
        const { stateKey, multiplier = '1' } = slider.dataset;
        this.setPlacement({ [stateKey]: Number(slider.value) * Number(multiplier) });
      });
    }
    $('resetTransform').addEventListener('click', () => this.resetPlacement());
    $('deleteSignature').addEventListener('click', () => this.deleteLayer());
    $('doneTransform').addEventListener('click', () => this.select(null));
    $('layerList').addEventListener('click', (e) => {
      const chip = e.target.closest('.layer-chip');
      if (!chip) return;
      this.select(chip.dataset.layer);
      this.revealTool(this.selected);
    });
  }

  // Brings sliders, labels and the selection box in line with the selection.
  syncLayer() {
    const layer = this.selected;
    $('layerBar').classList.toggle('has-selection', layer !== null);
    $('signatureBox').classList.toggle('active', layer !== null);
    if (!layer) return;

    const placement = this.placementOf(layer);
    for (const slider of this.sliders) {
      const { stateKey, unit = '', multiplier = '1' } = slider.dataset;
      const value = placement[stateKey] / Number(multiplier);
      slider.value = value;
      paintRange(slider);
      slider.closest('.field').querySelector('output').textContent = `${Math.round(value)}${unit}`;
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

  // One chip per layer. Chips are reused, so a focused chip keeps focus across updates.
  syncLayerList() {
    const list = $('layerList');
    const { layers, selectedId } = this.state;
    const current = [...list.querySelectorAll('.layer-chip')];
    const chips = layers.map((layer) => {
      const chip = current.find((c) => c.dataset.layer === layer.id) ?? h('button', {
        type: 'button',
        class: 'layer-chip',
        'data-testid': 'layer-chip',
        'data-layer': layer.id
      }, icon(layer.kind === 'text' ? 'typography' : 'signature'), h('span'));
      chip.setAttribute('aria-pressed', String(layer.id === selectedId));
      chip.lastChild.textContent = this.layerName(layer);
      return chip;
    });
    if (chips.length !== current.length || chips.some((chip, i) => chip !== current[i])) {
      list.replaceChildren(...(chips.length ? [h('span', { class: 'label layers-label' }, 'Layers'), ...chips] : []));
    }
  }

  syncTextControls() {
    const layer = this.selected;
    if (layer?.kind === 'text') {
      $('textInput').value = layer.text;
      $('textColor').value = layer.color;
      $('textOutlineColor').value = layer.outlineColor;
      $('textOutlineWidth').value = layer.outlineWidth;
      $('textOutlineWidthValue').textContent = layer.outlineWidth;
      paintRange($('textOutlineWidth'));
      this.textBound = true;
    } else if (this.textBound) {
      $('textInput').value = ''; // it was showing the layer that just lost the selection
      this.textBound = false;
    }
  }

  syncStageHint() {
    let hint = '';
    if (this.drawing === 'overlay') hint = 'Sign anywhere on the art, then Apply.';
    else if (this.selected) hint = 'Drag to move. Corners scale, the top handle rotates, arrow keys nudge.';
    $('stageHint').textContent = hint;
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

  // Pressing on a layer selects the topmost one there and starts dragging it in one
  // gesture; pressing on empty art drops the selection.
  onCanvasDown(e) {
    if (this.drawing || !isPrimaryPress(e)) return;
    const hit = topLayerAt(this.state.layers, this.canvas.pointFromEvent(e), this.assetKey, this.assetSize, this.measure);
    if (!hit) {
      if (this.selected) this.select(null);
      return;
    }
    if (hit !== this.selected) {
      this.select(hit.id);
      this.revealTool(hit);
    }
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
    if ($('franchiseWall').open) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === 'e') {
      e.preventDefault();
      if (!$('downloadBtn').disabled) this.download(this.state.asset, $('downloadBtn'));
    } else if (this.drawing) {
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.pad.undo();
        this.syncSignActions();
      } else if (e.key === 'Escape' && this.drawing === 'overlay') {
        this.stopDrawing();
      }
    } else if (this.selected && !mod && !e.altKey && !e.target.closest(FORM_CONTROLS)
      && (e.target === document.body || e.target.closest(LAYER_KEY_SCOPE))) {
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
    } else if (e.key === 'Escape') {
      this.select(null);
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
    this.syncCanvasLabel();
    this.syncKitNote();
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
    const team = this.team;
    $('chipCode').hidden = !team;
    $('chipCode').textContent = team?.prefix ?? '';
    $('chipName').textContent = team?.name ?? 'Pick your franchise';
    $('franchiseChip').setAttribute('aria-label', team ? `${team.name} (${team.prefix}). Change franchise` : 'Pick your franchise');
    this.syncChipArt();

    const { displayName, width, height, customBackground } = ASSET_TYPES[this.assetKey];
    $('stageLabel').textContent = displayName;
    $('stageSize').textContent = `${width}×${height}`;
    $('tabBackground').hidden = !team || !customBackground;
    if ($('tabBackground').hidden && this.activeTab === 'tabBackground') this.setTab('tabSign');

    this.syncBackground();
    this.syncDownload();
    this.syncKit();
    this.syncWall();
    this.syncLayer();
  }

  syncChipArt() {
    const prefix = this.state.teamPrefix ?? '';
    const art = $('chipArt');
    if (art.dataset.prefix === prefix) return;
    art.dataset.prefix = prefix;
    if (!prefix) {
      art.replaceChildren(icon('layout-grid'));
      return;
    }
    art.replaceChildren();
    trimmedArt(this.teamArt(prefix), 36).then((canvas) => {
      if (art.dataset.prefix === prefix) art.replaceChildren(canvas);
    }, () => {});
  }

  // Download exports what the stage shows, so only once an asset is up: not while
  // one loads, or over the last one when the next failed.
  syncDownload() {
    const button = $('downloadBtn');
    const ready = Boolean(this.state.backgroundImage) && !this.drawing && $('stage').dataset.state === 'ready';
    const { displayName, width, height } = ASSET_TYPES[this.assetKey];
    button.disabled = !ready;
    button.setAttribute('aria-label', `Download the ${displayName}, ${width}×${height} PNG`);
    button.title = ready ? `${displayName}, ${width}×${height} PNG` : '';
  }

  syncCanvasLabel() {
    const { layers } = this.state;
    const count = (kind) => layers.filter((layer) => layer.kind === kind).length;
    const signatures = count('signature');
    const texts = count('text');
    const parts = [this.team ? `${this.team.name} ${ASSET_TYPES[this.assetKey].displayName}` : 'Blank sticker'];
    if (signatures) parts.push(`${signatures} signature${signatures > 1 ? 's' : ''}`);
    if (texts) parts.push(`${texts} text layer${texts > 1 ? 's' : ''}`);
    const label = parts.join(', ');
    const canvas = $('mainCanvas');
    if (canvas.getAttribute('aria-label') !== label) canvas.setAttribute('aria-label', label);
  }

  // PNG blob of one asset at its export size, with every layer on it. Loads the
  // asset's full-size image unless it is the one on the stage. What it draws is
  // copied at the call, so a franchise switch or an edit during the load can't
  // mix into it.
  async exportAsset(assetKey) {
    const { teamPrefix, layers, backgroundSettings } = this.state;
    if (!teamPrefix) return null;
    const snapshot = {
      ...this.scene(assetKey, null),
      backgroundSettings: { ...backgroundSettings },
      layers: layers.map((layer) => ({ ...layer, placements: { ...layer.placements }, origins: { ...layer.origins } }))
    };
    const [image] = await Promise.all([
      assetKey === this.state.asset ? this.state.backgroundImage : loadImage(assetUrl(teamPrefix, assetKey)),
      loadFonts(snapshot.layers)
    ]);
    const scene = { ...snapshot, image };
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
    if (!this.thumbs.has(assetKey)) {
      const loading = loadImage(thumbUrl(prefix, assetKey));
      // A failed thumbnail is forgotten, so the next redraw tries it again.
      loading.catch(() => {
        if (this.thumbs.get(assetKey) === loading) this.thumbs.delete(assetKey);
      });
      this.thumbs.set(assetKey, loading);
    }
    const [image] = await Promise.all([this.thumbs.get(assetKey), loadFonts(this.state.layers)]);
    if (prefix !== this.state.teamPrefix) return; // the team changed while this loaded
    const scene = this.scene(assetKey, image);
    renderComposite(canvas.getContext('2d'), { ...scene, scale: canvas.width / scene.assetSize.width });
  }

  // Downloads one asset; button shows a busy state while a full-size image loads.
  async download(assetKey, button) {
    if (!assetKey || !this.available?.[assetKey] || this.drawing || button?.getAttribute('aria-busy') === 'true') return;
    const { displayName } = ASSET_TYPES[assetKey];
    const use = button?.querySelector('use');
    button?.setAttribute('aria-busy', 'true');
    use?.setAttribute('href', '#i-loader-2');
    // Named now, with the export's own snapshot, in case the franchise changes while it loads.
    const filename = exportFilename(this.state.teamPrefix, this.team.name, assetKey);
    const exporting = this.exportAsset(assetKey);
    try {
      const blob = await exporting;
      if (!blob) throw new Error('no image');
      saveBlob(blob, filename);
      showToast(`${displayName} downloaded.`, 'success');
    } catch {
      showToast(`Couldn't make the ${displayName} PNG. Try again.`);
    } finally {
      button?.removeAttribute('aria-busy');
      use?.setAttribute('href', '#i-download');
    }
  }

  // ---- The kit: every asset of the team, signed ---------------------------

  buildKit() {
    const resize = new ResizeObserver((entries) => {
      for (const entry of entries) this.sizeThumb(entry.target.closest('.kit-tile').dataset.asset);
    });
    const rows = KIT_ROWS.map((keys, i) => h('div', { class: `kit-row kit-row-${i + 1}` }, ...keys.map((key) => {
      const tile = this.buildTile(key);
      resize.observe(this.kit.get(key).thumb);
      return tile;
    })));
    $('kitSheet').replaceChildren(...rows);
  }

  buildTile(key) {
    const { width, height, displayName } = ASSET_TYPES[key];
    const canvas = h('canvas', { width: 0, height: 0 });
    const message = h('span', { class: 'kit-state' });
    const thumb = h('span', { class: 'kit-thumb' }, canvas, message);
    const pick = h('button', { type: 'button', class: 'kit-pick', 'data-testid': `asset-${key}`, title: displayName },
      thumb,
      h('span', { class: 'kit-label' }, KIT_LABELS[key]),
      h('span', { class: 'visually-hidden' }, `, ${width} by ${height}`));
    const download = h('button', {
      type: 'button',
      class: 'icon-btn kit-dl',
      'data-testid': `download-${key}`,
      'aria-label': `Download the ${displayName}`,
      title: `Download the ${displayName}`
    }, icon('download'));
    const tile = h('div', { class: 'kit-tile', 'data-asset': key, 'data-state': 'empty', style: `--ar: ${width / height}` },
      pick,
      h('div', { class: 'kit-foot' }, h('span', { class: 'kit-size mono' }, `${width}×${height}`), download));
    pick.addEventListener('click', () => this.chooseAsset(key));
    download.addEventListener('click', () => this.download(key, download));
    this.kit.set(key, { tile, pick, thumb, canvas, message, download });
    return tile;
  }

  chooseAsset(key) {
    if (!this.available?.[key]) return;
    this.selectAsset(key);
    // In the stacked layout the stage may be scrolled away from the kit strip.
    if (stacked.matches) $('stage').scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  // Thumbnail canvases match their displayed size, up to the thumbnail files' own width.
  sizeThumb(key) {
    const { thumb, canvas } = this.kit.get(key);
    const { width, height } = ASSET_TYPES[key];
    const px = Math.min(THUMB_MAX_WIDTH, Math.round(thumb.clientWidth * devicePixelRatio));
    if (!px || canvas.width === px) return;
    canvas.width = px;
    canvas.height = Math.round(px * height / width);
    this.drawTile(key);
  }

  clearKit() {
    for (const { tile, canvas } of this.kit.values()) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      tile.dataset.state = 'empty';
    }
  }

  // Availability, the current ring and each tile's state. Drawing sets ready or error.
  syncKit() {
    const { teamPrefix, asset } = this.state;
    let count = 0;
    for (const [key, { tile, pick, message, download }] of this.kit) {
      const available = Boolean(this.available?.[key]);
      if (available) count++;
      let state = tile.dataset.state;
      if (!teamPrefix) state = 'empty';
      else if (!available) state = 'unavailable';
      else if (state === 'empty' || state === 'unavailable') state = 'loading';
      tile.dataset.state = state;
      if (state === 'unavailable') message.textContent = `Not made for ${this.team.name} yet`;

      const current = Boolean(teamPrefix) && key === asset;
      tile.toggleAttribute('data-current', current);
      if (current) pick.setAttribute('aria-current', 'true');
      else pick.removeAttribute('aria-current');
      pick.setAttribute('aria-disabled', String(!available));
      download.hidden = !available;
    }
    $('kitCount').textContent = teamPrefix ? `${count} of ${this.kit.size}` : '';
    this.syncKitNote();
  }

  syncKitNote() {
    let note = 'Pick your franchise and the whole kit shows up here.';
    if (this.state.teamPrefix) {
      note = this.state.layers.length
        ? 'Live on every asset. Pick one to fine-tune it there.'
        : 'Sign once, it lands on every asset.';
    }
    if ($('kitNote').textContent !== note) $('kitNote').textContent = note;
  }

  // The current asset's tile follows every frame; the rest redraw at most every
  // KIT_THROTTLE_MS, and not at all while only the current asset's placement changes.
  queueKit() {
    if (!this.state.teamPrefix) return;
    this.kitFrame ||= requestAnimationFrame(() => {
      this.kitFrame = 0;
      this.drawTile(this.state.asset);
    });
    if (this.placing) return;
    this.kitTimer ||= setTimeout(() => {
      this.kitTimer = 0;
      this.drawKit();
    }, KIT_THROTTLE_MS);
  }

  drawKit() {
    for (const key of this.kit.keys()) this.drawTile(key);
  }

  drawTile(key) {
    const entry = this.kit.get(key);
    if (!entry || !this.available?.[key] || !entry.canvas.width) return;
    const prefix = this.state.teamPrefix;
    this.renderThumb(entry.canvas, key).then(() => {
      if (prefix === this.state.teamPrefix) entry.tile.dataset.state = 'ready';
    }, () => {
      if (prefix !== this.state.teamPrefix) return;
      entry.tile.dataset.state = 'error';
      entry.message.textContent = "Preview didn't load";
    });
  }

  // Copies of the drawn tiles as they are before a new signature lands.
  snapshotKit() {
    if (reducedMotion.matches || !this.state.teamPrefix) return null;
    const shots = new Map();
    for (const [key, { tile, canvas }] of this.kit) {
      if (tile.dataset.state !== 'ready' || !canvas.width) continue;
      const copy = h('canvas', { width: canvas.width, height: canvas.height });
      copy.getContext('2d').drawImage(canvas, 0, 0);
      shots.set(key, copy);
    }
    return shots;
  }

  // The one authored moment: a new signature stamps onto every tile of the kit in
  // turn. Each tile shows its old picture with only the new layer animating over
  // it, then the overlay goes and the redrawn tile underneath matches it.
  landOnKit(layer, shots) {
    const { layers, backgroundSettings } = this.state;
    const index = layers.indexOf(layer);
    let order = 0;
    for (const [key, before] of shots) {
      const size = ASSET_TYPES[key];
      const placement = resolvePlacements(layers, key, size, this.measure)[index];
      const stamp = h('canvas', { width: before.width, height: before.height });
      renderComposite(stamp.getContext('2d'), {
        image: null,
        assetSize: size,
        backgroundSettings,
        customBackground: false,
        layers: [{ ...layer, placements: { [key]: placement } }],
        assetKey: key,
        scale: stamp.width / size.width
      });
      stamp.style.transformOrigin = `${placement.x / size.width * 100}% ${placement.y / size.height * 100}%`;
      const overlay = h('span', { class: 'kit-landing', 'aria-hidden': 'true' }, before, stamp);
      this.kit.get(key).thumb.append(overlay);
      const remove = () => overlay.remove();
      stamp.animate(
        [
          { opacity: 0, transform: 'scale(1.8)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'none', filter: 'none' }
        ],
        { duration: 460, delay: order++ * LAND_STAGGER_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }
      ).finished.then(remove, remove);
    }
  }
}

// Left mouse button, or any touch/pen contact; ignores a second finger.
function isPrimaryPress(e) {
  return e.isPrimary && (e.pointerType !== 'mouse' || e.button === 0);
}

listenForTheme();
window.app = new App();
