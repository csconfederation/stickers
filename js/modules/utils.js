export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

// rect is a getBoundingClientRect() result; size is the canvas' pixel size.
export function pointerToCanvas(clientX, clientY, rect, size) {
  return {
    x: (clientX - rect.left) * size.width / rect.width,
    y: (clientY - rect.top) * size.height / rect.height
  };
}

export function exportFilename(prefix, teamName, asset, date = new Date()) {
  const safeName = teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${prefix}_${safeName}_${asset}_${date.toISOString().slice(0, 10)}.png`;
}

export function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
