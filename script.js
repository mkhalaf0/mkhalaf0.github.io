const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const darkPreference = matchMedia('(prefers-color-scheme: dark)');
const themeButton = document.getElementById('themeBtn');
let explicitTheme = false;
try { explicitTheme = Boolean(localStorage.getItem('theme')); } catch {}
let mapLayer;
const mapTileURL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
function applyTheme(theme) {
  root.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? 'Light' : 'Dark';
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}
applyTheme(root.dataset.theme || 'light');
themeButton.addEventListener('click', () => {
  const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  explicitTheme = true;
  applyTheme(theme);
  try { localStorage.setItem('theme', theme); } catch {}
});
darkPreference.addEventListener('change', event => {
  if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light');
});

// Native disclosure navigation works without JavaScript; these handlers improve dismissal.
const menu = document.querySelector('.nav-more');
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
document.addEventListener('click', event => {
  if (!menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});

// Reveal only on entry: the document remains readable if scripts or observers are unavailable.
const entranceAnimations = new Set();
function arrive(element, delay = 0) {
  if (reducedMotion.matches || !element.animate) return;
  const animation = element.animate(
    [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 700, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
  );
  entranceAnimations.add(animation);
  animation.finished.then(() => entranceAnimations.delete(animation)).catch(() => entranceAnimations.delete(animation));
}
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      arrive(entry.target);
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('section > h2, .research-grid, .news > li, .pub, .entry, .lab-copy, .honors > li, .skills > div, .footer-main').forEach(el => reveal.observe(el));
  const navigationLinks = [...document.querySelectorAll('nav a[href^="#"]')];
  const activeSection = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigationLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });
  document.querySelectorAll('main section, main > header').forEach(el => activeSection.observe(el));
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) entranceAnimations.forEach(animation => animation.cancel());
});

// Publication controls use pressed-button semantics, keeping native details and citations intact.
const publicationSection = document.getElementById('publications');
const filterButtons = [...publicationSection.querySelectorAll('.ptab')];
filterButtons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.f;
  filterButtons.forEach(other => {
    other.classList.toggle('active', other === button);
    other.setAttribute('aria-pressed', String(other === button));
  });
  let visible = 0;
  publicationSection.querySelectorAll('[data-pg]').forEach(element => {
    const show = filter === 'all' || element.dataset.pg === filter;
    element.hidden = !show;
    if (show && element.matches('article')) arrive(element, Math.min(visible++, 4) * 45);
  });
  document.getElementById('publication-count').textContent = `${visible} publications shown.`;
}));

const feedback = document.getElementById('feedback');
let feedbackTimeout;
function announce(message) {
  feedback.textContent = message;
  feedback.classList.add('show');
  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => feedback.classList.remove('show'), 4500);
}
async function copyText(text, button) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    const label = button.textContent;
    button.textContent = 'Copied';
    announce('Copied to clipboard.');
    setTimeout(() => { button.textContent = label; }, 1800);
  } catch {
    announce('Copy is unavailable here. Select the text and copy it manually.');
  }
}
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', () => copyText(button.dataset.copy, button));
});
document.querySelectorAll('.bibbox').forEach(box => {
  const citation = box.textContent.trim();
  const button = document.createElement('button');
  button.className = 'copybtn';
  button.type = 'button';
  button.textContent = 'Copy citation';
  button.addEventListener('click', () => copyText(citation, button));
  box.append(button);
});

// A native modal provides focus trapping, Escape dismissal, and focus restoration.
const dialog = document.getElementById('lightbox');
const enlargedImage = dialog.querySelector('img');
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  enlargedImage.src = button.dataset.image;
  enlargedImage.alt = button.querySelector('img')?.alt || 'Exploded illustration of smart-glasses hardware';
  document.getElementById('image-caption').textContent = enlargedImage.alt;
  dialog.showModal();
}));
dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

// Load the map only near its section; the complete conference list is the offline fallback.
function loadMap() {
  const container = document.getElementById('confmap');
  const status = document.getElementById('map-status');
  if (!window.L || !window.conferencePlaces) {
    status.textContent = 'The map is unavailable. All conference details are listed alongside it.';
    return;
  }
  container.querySelector('.map-loading')?.remove();
  const map = L.map(container, { scrollWheelZoom: false, dragging: !matchMedia('(pointer: coarse)').matches });
  mapLayer = L.tileLayer(mapTileURL, {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  mapLayer.on('tileerror', () => { status.textContent = 'Some map tiles could not load. Conference details remain available in the list.'; });
  const bounds = [];
  window.conferencePlaces.forEach(place => {
    const popup = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = place.c;
    popup.append(title);
    place.items.forEach(item => {
      popup.append(document.createElement('br'));
      const line = document.createElement(item.u ? 'a' : 'span');
      line.textContent = item.t;
      if (item.u) { line.href = item.u; line.target = '_blank'; line.rel = 'noopener noreferrer'; }
      popup.append(line);
    });
    L.marker(place.ll, {
      title: place.c, alt: `Conferences in ${place.c}`,
      icon: L.divIcon({ className: 'pin-wrap', html: '<span class="pin-dot"></span>', iconSize: [16,16], iconAnchor: [8,8] }),
    }).addTo(map).bindPopup(popup);
    bounds.push(place.ll);
  });
  const fit = () => { map.invalidateSize(); map.fitBounds(bounds, { padding: [32,32], maxZoom: 5, animate: false }); };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(container);
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { loadMap(); observer.disconnect(); }
  }, { threshold: 0.01 });
  observer.observe(document.getElementById('confmap'));
} else loadMap();
