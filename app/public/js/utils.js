// Small helpers
export const $ = (s) => document.querySelector(s);
export const icon = (name) => `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = (arr) => arr.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
