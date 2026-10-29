// Start of the app: navigation and keyboard shortcuts
import { $ } from './utils.js';
import { toast, closeModal } from './ui.js';
import { loadDecks, renderLibrary } from './library.js';
import { renderDeck } from './editor.js';
import { flip, move, mark, undo } from './study.js';
import './quiz.js';

$('#logo-home').onclick = (e) => { e.preventDefault(); loadDecks(); };
$('#breadcrumb').onclick = (e) => {
  const go = e.target.dataset.go;
  if (!go) return;
  e.preventDefault();
  go === 'decks' ? loadDecks() : renderDeck();
};

$('#global-search').oninput = async (e) => {
  const q = e.target.value.trim().toLowerCase();
  if ($('#view-decks').classList.contains('hidden')) await loadDecks();
  $('#lib-search').value = q;
  renderLibrary();
};

document.addEventListener('keydown', (e) => {
  if (!$('#view-quiz').classList.contains('hidden') && /^[1-4]$/.test(e.key)) {
    document.querySelectorAll('#quiz-options .opt')[Number(e.key) - 1]?.click();
    return;
  }
  if ($('#view-study').classList.contains('hidden') || !$('#modal').classList.contains('hidden')) {
    if (e.key === 'Escape') closeModal();
    return;
  }
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === 'Escape') return loadDecks();
  if ($('#study-play').classList.contains('hidden')) return;
  if (e.code === 'Space') { e.preventDefault(); flip(); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); flip(); }
  else if (e.key === 'ArrowRight') move(1);
  else if (e.key === 'ArrowLeft') move(-1);
  else if (e.key === 'Backspace') undo();
  else if (e.key.toLowerCase() === 'k') mark(true);
  else if (e.key.toLowerCase() === 'l') mark(false);
});

loadDecks().catch((err) => toast('Cannot reach server: ' + err.message));
