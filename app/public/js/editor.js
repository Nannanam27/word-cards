// Set editor screen: title, cards and auto save
import { $, icon, esc } from './utils.js';
import { state } from './state.js';
import { api } from './api.js';
import { show, toast } from './ui.js';
import { loadDecks } from './library.js';
import { startRound } from './study.js';

$('#btn-new-deck').onclick = async () => {
  const d = await api('/decks', { method: 'POST', body: { name: 'Untitled set', description: '' } });
  state.decks.push({ ...d, card_count: 0, known_count: 0 });
  await openDeck(d.id, true);
  // Start with two empty cards
  for (let i = 0; i < 2; i++) await addBlankCard(false);
  $('#deck-title').select();
};

export async function saveDeckMeta() {
  const name = $('#deck-title').value.trim() || 'Untitled set';
  const description = $('#deck-desc').value;
  if (name === state.deck.name && description === (state.deck.description || '')) return;
  state.deck = { ...state.deck, ...(await api('/decks/' + state.deck.id, { method: 'PUT', body: { name, description } })) };
  show('deck');
  markSaved();
}
$('#deck-title').onchange = saveDeckMeta;
$('#deck-desc').onchange = saveDeckMeta;
$('#deck-desc').oninput = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };

$('#btn-delete-deck').onclick = async () => {
  if (!confirm(`Delete deck "${state.deck.name}" and all its cards?`)) return;
  await api('/decks/' + state.deck.id, { method: 'DELETE' });
  toast('Deck deleted');
  loadDecks();
};

const markSaved = () => { $('#save-status').textContent = 'Saved just now'; };

$('#btn-search-toggle').onclick = () => {
  const box = $('#search-box');
  box.classList.toggle('hidden');
  if (box.classList.contains('hidden')) { $('#search').value = ''; renderCards(); } else $('#search').focus();
};

export async function openDeck(id, isNew = false) {
  state.isNew = isNew;
  if (!state.decks.length) state.decks = await api('/decks');
  state.deck = state.decks.find((d) => d.id === id) || state.deck;
  state.cards = await api(`/decks/${id}/cards`);
  $('#search').value = '';
  $('#search-box').classList.add('hidden');
  renderDeck();
}

export function renderDeck() {
  const { deck } = state;
  $('#deck-title').value = deck.name;
  $('#deck-desc').value = deck.description || '';
  $('#deck-heading').textContent = state.isNew ? 'Create a new flashcard set' : 'Edit flashcard set';
  $('#btn-done').textContent = state.isNew ? 'Create' : 'Done';
  $('#btn-study-label').textContent = state.isNew ? 'Create and practice' : 'Save and practice';
  $('#save-status').textContent = 'All changes saved';
  renderProgress();
  renderCards();
  show('deck');
}

function renderProgress() {
  const cards = state.cards;
  const known = cards.filter((c) => c.known).length;
  const pct = cards.length ? (known / cards.length) * 100 : 0;
  $('#deck-progress').style.width = pct + '%';
  $('#deck-progress-text').textContent = `${known} / ${cards.length} known`;
}

const POS = ['', 'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'phrase'];

function cardRow(c, n) {
  return `
    <div class="term-card glass" data-id="${c.id}">
      <div class="term-head">
        <span class="num">${n}</span>
        <div class="term-ops">
          <select class="pos-select" data-f="part_of_speech" title="Part of speech">
            ${POS.map((p) => `<option value="${p}" ${p === c.part_of_speech ? 'selected' : ''}>${p || 'type'}</option>`).join('')}
          </select>
          <button class="check-toggle ${c.known ? 'on' : ''}" data-act="known" title="Mark as known" aria-label="Mark as known" aria-pressed="${!!c.known}">${icon('check')}</button>
          <button class="card-del" data-act="del" title="Delete card">Delete</button>
        </div>
      </div>
      <div class="term-body">
        <div class="term-col">
          <input class="field-input" data-f="word" value="${esc(c.word)}" placeholder="Enter term" />
          <label>TERM</label>
        </div>
        <div class="term-col">
          <input class="field-input thai" data-f="translation" value="${esc(c.translation)}" placeholder="Enter definition" />
          <label>DEFINITION</label>
        </div>
      </div>
      <div class="term-col example-col">
        <input class="field-input small" data-f="example" value="${esc(c.example)}" placeholder="Example sentence (optional)" />
        <label>EXAMPLE</label>
      </div>
    </div>`;
}

function renderCards() {
  const q = $('#search').value.trim().toLowerCase();
  const list = state.cards.filter((c) => !q || c.word.toLowerCase().includes(q) || c.translation.toLowerCase().includes(q));
  $('#card-list').innerHTML = list.length
    ? list.map((c) => cardRow(c, state.cards.indexOf(c) + 1)).join('')
    : `<div class="empty glass">${q ? 'No matches.' : 'No cards yet. Click “ADD CARD” to start.'}</div>`;
}

$('#search').oninput = renderCards;

// A new card is saved only after the word and meaning are filled
async function addBlankCard(focus = true) {
  state.cards.push({ id: 'new-' + Date.now() + Math.random(), word: '', translation: '', part_of_speech: '', example: '', known: false });
  $('#search').value = '';
  renderCards(); renderProgress();
  if (focus) {
    const rows = document.querySelectorAll('.term-card');
    const last = rows[rows.length - 1];
    last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    last.querySelector('[data-f=word]').focus();
  }
}
$('#btn-add-card').onclick = () => addBlankCard();

async function saveCard(row) {
  const id = row.dataset.id;
  const c = state.cards.find((x) => String(x.id) === id);
  row.querySelectorAll('[data-f]').forEach((el) => (c[el.dataset.f] = el.value));
  if (!c.word.trim() || !c.translation.trim()) return; // wait until complete
  const body = { word: c.word, translation: c.translation, part_of_speech: c.part_of_speech, example: c.example, known: c.known };
  try {
    const saved = String(c.id).startsWith('new-')
      ? await api(`/decks/${state.deck.id}/cards`, { method: 'POST', body })
      : await api('/cards/' + c.id, { method: 'PUT', body });
    Object.assign(c, saved);
    row.dataset.id = saved.id;
    row.classList.add('saved');
    markSaved();
    setTimeout(() => row.classList.remove('saved'), 700);
  } catch (err) { toast(err.message); }
}

$('#card-list').addEventListener('change', (e) => {
  const row = e.target.closest('.term-card');
  if (row && e.target.dataset.f) saveCard(row);
});

$('#card-list').addEventListener('keydown', (e) => {
  // Tab on the last meaning adds a new card
  if (e.key === 'Tab' && !e.shiftKey && e.target.dataset.f === 'example') {
    const rows = document.querySelectorAll('.term-card');
    if (e.target.closest('.term-card') === rows[rows.length - 1]) { e.preventDefault(); e.target.blur(); addBlankCard(); }
  }
});

$('#card-list').onclick = async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const row = btn.closest('.term-card');
  const c = state.cards.find((x) => String(x.id) === row.dataset.id);
  const isNew = String(c.id).startsWith('new-');
  if (btn.dataset.act === 'del') {
    if (!isNew) await api('/cards/' + c.id, { method: 'DELETE' });
    state.cards = state.cards.filter((x) => x !== c);
    row.classList.add('removing');
    setTimeout(() => { renderCards(); renderProgress(); }, 250);
  } else if (btn.dataset.act === 'known') {
    c.known = !c.known;
    btn.classList.toggle('on', c.known);
    btn.setAttribute('aria-pressed', c.known);
    if (!isNew) await saveCard(row);
    renderProgress();
  }
};

$('#btn-done').onclick = () => loadDecks();
