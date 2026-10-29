// Library screen: list of sets, search and tabs
import { $, icon, esc } from './utils.js';
import { state } from './state.js';
import { api } from './api.js';
import { show } from './ui.js';
import { studyDeck } from './study.js';
import { startQuiz } from './quiz.js';

export async function loadDecks() {
  state.decks = await api('/decks');
  renderLibrary();
  show('decks');
}

const monthLabel = (iso) => 'In ' + new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
export function renderLibrary() {
  const q = $('#lib-search').value.trim().toLowerCase();
  const quiz = state.tab === 'quiz';
  const list = state.decks
    .filter((d) => !q || d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q))
    .filter((d) => !quiz || d.card_count >= 2)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const terms = state.decks.reduce((n, d) => n + d.card_count, 0);
  $('#lib-stats').textContent = `${state.decks.length} sets · ${terms} terms`;
  const grid = $('#deck-grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty glass">${q ? 'No matches.' : quiz ? 'Add at least 2 cards to a set to quiz yourself.' : 'No sets yet — create your first one!'}</div>`;
    return;
  }
  let month = '';
  grid.innerHTML = list.map((d) => {
    const pct = d.card_count ? Math.round((d.known_count / d.card_count) * 100) : 0;
    const m = monthLabel(d.created_at);
    const head = m !== month ? `<div class="month-head">${(month = m)}</div>` : '';
    const side = quiz ? '' : `<div class="progress mini-progress"><div class="progress-bar" style="width:${pct}%"></div></div>`;
    return `${head}<article class="set-row glass" data-id="${d.id}" id="deck-${d.id}" tabindex="0" role="button">
      <div class="set-main">
        <div class="set-meta"><span>${d.card_count} Terms</span><span class="sep"></span><span>${quiz ? 'Multiple choice' : pct + '% known'}</span></div>
        <h3>${esc(d.name)}</h3>
      </div>
      <div class="set-side">${side}<span class="go">${icon('right')}</span></div>
    </article>`;
  }).join('');
}

$('#lib-search').oninput = renderLibrary;

$('#lib-tabs').onclick = (e) => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  state.tab = btn.dataset.tab;
  document.querySelectorAll('#lib-tabs .seg').forEach((p) => {
    p.classList.toggle('active', p === btn);
    p.setAttribute('aria-selected', p === btn);
  });
  renderLibrary();
};

$('#deck-grid').onclick = (e) => {
  const el = e.target.closest('.set-row');
  if (!el) return;
  const id = Number(el.dataset.id);
  state.tab === 'quiz' ? startQuiz(id) : studyDeck(id);
};
$('#deck-grid').onkeydown = (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('set-row')) { e.preventDefault(); e.target.click(); }
};
