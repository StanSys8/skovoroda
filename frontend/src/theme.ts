export type Theme = 'dark' | 'light';

export function detectTheme(): Theme {
  const saved = localStorage.getItem('skovoroda.theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('skovoroda.theme', theme);
}
