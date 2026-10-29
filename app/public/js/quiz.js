// Quiz screen: multiple choice with a score
import { $, esc, shuffle } from './utils.js';
import { state } from './state.js';
import { api } from './api.js';
import { show, toast } from './ui.js';
import { loadDecks } from './library.js';

export async function startQuiz(id) {
  state.deck = state.decks.find((d) => d.id === id) || state.deck;
  const cards = await api(`/decks/${id}/cards`);
  if (cards.length < 2) return toast('Add at least 2 cards to take a quiz');
  state.quiz = { cards: shuffle(cards), idx: 0, score: 0 };
  show('quiz');
  renderQuiz();
}

function renderQuiz() {
  const qz = state.quiz;
  const done = qz.idx >= qz.cards.length;
  $('#quiz-play').classList.toggle('hidden', done);
  $('#quiz-result').classList.toggle('hidden', !done);
  $('#quiz-score').textContent = `Score ${qz.score}`;
  $('#quiz-progress').style.width = (Math.min(qz.idx, qz.cards.length) / qz.cards.length) * 100 + '%';
  if (done) {
    const pct = Math.round((qz.score / qz.cards.length) * 100);
    $('#quiz-counter').textContent = 'Finished';
    $('#quiz-final').textContent = `${qz.score} / ${qz.cards.length}`;
    $('#quiz-pct').textContent = `${pct}% correct`;
    $('#quiz-msg').textContent = pct === 100 ? 'Perfect score!' : pct >= 70 ? 'Great job!' : 'Keep practicing!';
    return;
  }
  const c = qz.cards[qz.idx];
  const others = shuffle(qz.cards.filter((x) => x !== c && x.translation !== c.translation)).slice(0, 3);
  $('#quiz-counter').textContent = `${qz.idx + 1} / ${qz.cards.length}`;
  $('#q-pos').textContent = c.part_of_speech || '';
  $('#q-word').textContent = c.word;
  $('#quiz-options').innerHTML = shuffle([c, ...others])
    .map((o, i) => `<button class="opt glass" data-ok="${o === c}"><span class="opt-key">${i + 1}</span>${esc(o.translation)}</button>`).join('');
}

$('#quiz-options').onclick = (e) => {
  const btn = e.target.closest('.opt');
  if (!btn || btn.disabled) return;
  const ok = btn.dataset.ok === 'true';
  document.querySelectorAll('#quiz-options .opt').forEach((b) => {
    b.disabled = true;
    if (b.dataset.ok === 'true') b.classList.add('correct');
    else if (b !== btn) b.classList.add('dim');
  });
  if (!ok) btn.classList.add('wrong');
  else state.quiz.score++;
  setTimeout(() => { state.quiz.idx++; renderQuiz(); }, ok ? 700 : 1400);
};

$('#btn-quiz-again').onclick = () => startQuiz(state.deck.id);
$('#btn-quiz-back').onclick = () => loadDecks();
$('#btn-quiz-done').onclick = () => loadDecks();
