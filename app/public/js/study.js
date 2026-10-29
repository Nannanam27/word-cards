// Flashcards screen: flip, mark, undo and swipe
import { $, shuffle } from './utils.js';
import { state } from './state.js';
import { api } from './api.js';
import { show, toast } from './ui.js';
import { loadDecks } from './library.js';
import { openDeck, saveDeckMeta } from './editor.js';

$('#btn-study').onclick = async () => {
  await saveDeckMeta();
  const cards = state.cards.filter((c) => !String(c.id).startsWith('new-'));
  if (!cards.length) return toast('Fill in a term and definition first');
  show('study');
  startRound(cards);
};

// Open a set straight into flashcards
export async function studyDeck(id) {
  state.deck = state.decks.find((d) => d.id === id) || state.deck;
  state.cards = await api(`/decks/${id}/cards`);
  if (!state.cards.length) {
    toast('This set has no cards yet. Add some first');
    return openDeck(id);
  }
  show('study');
  startRound(state.cards);
}

// One round goes through every card once, answers are kept so undo works
export function startRound(cards) {
  state.study = cards.slice();
  state.idx = 0;
  state.history = [];
  $('#study-set-name').textContent = state.deck.name;
  $('#study-play').classList.remove('hidden');
  $('#study-done').classList.add('hidden');
  renderStudy();
}

function renderTally() {
  const h = state.history;
  $('#tally-know').textContent = h.filter((x) => x.known).length;
  $('#tally-learning').textContent = h.filter((x) => !x.known).length;
  $('#btn-undo').disabled = !h.length;
}

function renderStudy() {
  const total = state.study.length;
  if (state.idx >= total) return finishRound();
  const c = state.study[state.idx];
  const card = $('#flip-card');
  const wasFlipped = card.classList.contains('flipped');
  card.classList.remove('flipped', 'slide-in');
  void card.offsetWidth;
  card.classList.add('slide-in');
  card.classList.toggle('known-mark', !!c.known);
  // Change the text after the card turns back
  const token = (state.renderToken = (state.renderToken || 0) + 1);
  setTimeout(() => {
    if (token !== state.renderToken) return;
    const front = state.swap ? c.translation : c.word;
    const back = state.swap ? c.word : c.translation;
    $('#f-pos').textContent = c.part_of_speech || '';
    $('#f-main').textContent = front;
    $('#f-main').classList.toggle('thai', state.swap);
    $('#b-main').textContent = back;
    $('#b-main').classList.toggle('thai', !state.swap);
    $('#b-example').textContent = c.example ? `“${c.example}”` : '';
  }, wasFlipped ? 150 : 0);
  $('#study-counter').textContent = `${state.idx + 1} / ${total}`;
  $('#study-progress').style.width = (state.idx / total) * 100 + '%';
  renderTally();
}

function finishRound() {
  const h = state.history;
  $('#study-progress').style.width = '100%';
  $('#study-counter').textContent = `${state.study.length} / ${state.study.length}`;
  $('#done-know').textContent = h.filter((x) => x.known).length;
  $('#done-learning').textContent = h.filter((x) => !x.known).length;
  $('#btn-study-review').disabled = !h.some((x) => !x.known);
  $('#study-play').classList.add('hidden');
  $('#study-done').classList.remove('hidden');
}

export const flip = () => $('#flip-card').classList.toggle('flipped');
export const move = (d) => {
  state.idx = Math.min(Math.max(state.idx + d, 0), state.study.length - 1);
  renderStudy();
};

async function saveKnown(c, known) {
  const updated = await api('/cards/' + c.id, { method: 'PUT', body: { ...c, known } });
  Object.assign(c, updated);
  const orig = state.cards.find((x) => x.id === c.id);
  if (orig) Object.assign(orig, updated);
}

export async function mark(known) {
  if ($('#study-play').classList.contains('hidden')) return;
  const c = state.study[state.idx];
  state.history.push({ card: c, known, prevKnown: !!c.known });
  const pill = $(known ? '#tally-know' : '#tally-learning');
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
  state.idx++;
  renderStudy();
  if (!!c.known !== known) {
    try { await saveKnown(c, known); } catch (err) { toast(err.message); }
  }
}

export async function undo() {
  const last = state.history.pop();
  if (!last) return;
  state.idx = state.study.indexOf(last.card);
  $('#study-play').classList.remove('hidden');
  $('#study-done').classList.add('hidden');
  if (!!last.card.known !== last.prevKnown) {
    try { await saveKnown(last.card, last.prevKnown); } catch (err) { toast(err.message); }
  }
  renderStudy();
}

// Swipe right for know, left for still learning
const SWIPE_DISTANCE = 90;
let drag = null;
let suppressClick = false;
const flipCard = $('#flip-card');
function setDrag(dx) {
  flipCard.style.transform = dx ? `translateX(${dx}px) rotate(${dx / 18}deg)` : '';
  const amount = Math.min(Math.abs(dx) / SWIPE_DISTANCE, 1);
  $('#swipe-know').style.opacity = dx > 0 ? amount : 0;
  $('#swipe-learning').style.opacity = dx < 0 ? amount : 0;
}
flipCard.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;
  drag = { x: e.clientX, y: e.clientY, dx: 0, active: false, id: e.pointerId };
});
flipCard.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!drag.active) {
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
    if (Math.abs(dx) < 10) return;
    drag.active = true;
    flipCard.classList.add('dragging');
    flipCard.setPointerCapture(drag.id);
  }
  drag.dx = dx;
  setDrag(dx);
});
function endDrag() {
  if (!drag) return;
  const { dx, active } = drag;
  drag = null;
  if (!active) return;
  suppressClick = true;
  flipCard.classList.remove('dragging');
  flipCard.style.transition = 'transform 220ms ease';
  if (Math.abs(dx) >= SWIPE_DISTANCE) {
    flipCard.style.transform = `translateX(${dx > 0 ? 120 : -120}vw) rotate(${dx > 0 ? 20 : -20}deg)`;
    setTimeout(() => { flipCard.style.transition = 'none'; setDrag(0); mark(dx > 0); requestAnimationFrame(() => { flipCard.style.transition = ''; }); }, 200);
  } else {
    setDrag(0);
    setTimeout(() => { flipCard.style.transition = ''; }, 230);
  }
}
flipCard.addEventListener('pointerup', endDrag);
flipCard.addEventListener('pointercancel', endDrag);

$('#flip-card').onclick = () => {
  if (suppressClick) { suppressClick = false; return; }
  flip();
};
$('#btn-known').onclick = () => mark(true);
$('#btn-learning').onclick = () => mark(false);
$('#btn-undo').onclick = undo;
$('#btn-shuffle').onclick = () => {
  startRound(shuffle(state.study));
  toast('Shuffled');
};
$('#btn-swap').onclick = () => { state.swap = !state.swap; renderStudy(); };
$('#btn-back-deck').onclick = () => loadDecks();
$('#btn-edit-set').onclick = () => openDeck(state.deck.id);
$('#btn-study-restart').onclick = () => startRound(state.study);
$('#btn-study-review').onclick = () => startRound(state.history.filter((x) => !x.known).map((x) => x.card));
