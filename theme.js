// Apply the saved preference before rendering. Storage may be unavailable in private contexts.
try {
  const preference = localStorage.getItem('theme');
  const dark = preference ? preference === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch {
  document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
