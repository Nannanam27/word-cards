// Shared UI: switch screens, toast and modal
import { $, esc } from './utils.js';
import { state } from './state.js';

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

export function show(view) {
  ['decks', 'deck', 'study', 'quiz'].forEach((v) => $('#view-' + v).classList.toggle('hidden', v !== view));
  document.body.classList.toggle('studying', view === 'study');
  window.scrollTo(0, 0);
  const bc = $('#breadcrumb');
  if (view === 'decks') bc.innerHTML = '';
  else if (view === 'quiz') bc.innerHTML = `<a href="#" data-go="decks">Library</a> / ${esc(state.deck.name)} / Quiz`;
  else bc.innerHTML = `<a href="#" data-go="decks">Library</a> / ${view === 'study'
      ? `<a href="#" data-go="deck">${esc(state.deck.name)}</a> / Study` : esc(state.deck.name)}`;
}

// Modal
export function openModal(title, fields, onSave) {
  $('#modal-title').textContent = title;
  $('#modal-fields').innerHTML = fields.map((f) => `
    <div class="field">
      <label for="f-${f.name}">${f.label}</label>
      ${f.type === 'textarea'
        ? `<textarea id="f-${f.name}" name="${f.name}">${esc(f.value)}</textarea>`
        : f.type === 'select'
        ? `<select id="f-${f.name}" name="${f.name}">${f.options.map((o) => `<option ${o === f.value ? 'selected' : ''}>${o}</option>`).join('')}</select>`
        : `<input class="input" id="f-${f.name}" name="${f.name}" value="${esc(f.value)}" ${f.required ? 'required' : ''} autocomplete="off"/>`}
    </div>`).join('');
  $('#modal').classList.remove('hidden');
  setTimeout(() => $('#modal-fields input, #modal-fields textarea')?.focus(), 50);
  $('#modal-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try { await onSave(data); closeModal(); } catch (err) { toast(err.message); }
  };
}
export function closeModal() { $('#modal').classList.add('hidden'); }
$('#modal-cancel').onclick = closeModal;
$('#modal').onclick = (e) => { if (e.target.id === 'modal') closeModal(); };
