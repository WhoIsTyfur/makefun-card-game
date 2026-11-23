// Mouse and keyboard: click cards or press 1-0 to pick, Enter to brew, D to distill, M to mute.
export function bindInput(stage, handlers) {
  stage.addEventListener('click', (ev) => {
    const action = ev.target.closest('[data-action]');
    if (action) { handlers.action(action.dataset.action); return; }
    const card = ev.target.closest('.card.in-hand');
    if (card) handlers.toggleCard(card.dataset.id);
  });
  stage.addEventListener('contextmenu', (ev) => { ev.preventDefault(); handlers.clearSelection(); });
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const k = ev.key.toLowerCase();
    if (k >= '0' && k <= '9') { handlers.toggleSlot(k === '0' ? 9 : Number(k) - 1); return; }
    if (k === 'enter' || k === ' ') { ev.preventDefault(); handlers.action('confirm'); return; }
    if (k === 'd') handlers.action('distill');
    if (k === 'm') handlers.action('mute');
    if (k === 'escape' || k === 'backspace') handlers.clearSelection();
  });
}
