// CSC-Web posts Mantine's color scheme to the embedded page. No attribute
// means the default dark theme.
const PARENT_ORIGIN = 'https://playcsc.com';

export function themeFromMessage({ origin, data }, ownOrigin) {
  if (origin !== PARENT_ORIGIN && origin !== ownOrigin) return null;
  return data === 'light' || data === 'dark' ? data : null;
}

export function listenForTheme() {
  window.addEventListener('message', (event) => {
    const theme = themeFromMessage(event, location.origin);
    if (theme) document.documentElement.dataset.theme = theme;
  });
}
