// .. theme switching
const root = document.documentElement;
const themeToggle = document.querySelector('#theme-toggle');

export function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('ks-theme', theme);
}

export function initTheme() {
  const saved = localStorage.getItem('ks-theme');
  setTheme(saved === 'light' ? 'light' : 'dark');

  themeToggle.onclick = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };
}
