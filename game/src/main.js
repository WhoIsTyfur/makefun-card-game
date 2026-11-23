// VITRIOL boot and turn flow: routes between screens and sequences each brew's motion and sound.
import { createDuel, resolveBrew, runRivalTurn, distill, canBrew, canDistill } from './rules.js';
import { renderTable, STAGE_W, STAGE_H } from './table-render.js';
import { renderTitle, renderEnd } from './screens.js';
import { captureCards, animateFromCapture, burst, floatText, shake, slamCallout } from './animations.js';
import { sfx, toggleMute } from './audio.js';
import { startMusic } from './music.js';
import { bindInput } from './input.js';
import { stageTable, stageEnding } from './shots.js';
import { SUITS } from './deck.js';

const stage = document.getElementById('stage');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seedParam = Number(params.get('seed')) || 0;

let screen = 'title';
let state = null;
const ui = { selected: new Set(), busy: false, pops: [], flash: null, shot };

function fitStage() {
  const k = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.transform = `translate(-50%,-50%) scale(${k})`;
}
window.addEventListener('resize', fitStage);
fitStage();

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function draw({ animate = true } = {}) {
  const before = animate ? captureCards(stage) : null;
  renderTable(stage, state, ui);
  if (before) {
    const dealt = animateFromCapture(stage, before);
    for (let i = 0; i < dealt; i++) sfx.deal(i);
  }
}

function pickedCards() {
  return state.player.hand.filter((c) => ui.selected.has(c.id));
}

function impact(result) {
  const targetY = result.by === 'player' ? 80 : 656;
  const ownY = result.by === 'player' ? 656 : 80;
  slamCallout(stage);
  if (result.brew.combos.length) sfx.combo(result.brew.combos.length + result.brew.chain);
  if (result.dealt > 0) {
    sfx.hit();
    floatText(stage, 214, targetY - 40, `−${result.dealt}`, 'dmg');
    burst(stage, 140, targetY, [SUITS.brimstone.color, '#ffd27a', '#fff'], 18 + Math.min(30, result.dealt));
    shake(stage.querySelector(result.by === 'player' ? '.life-panel.rival' : '.life-panel.player'), 6 + Math.min(14, result.dealt / 2));
  }
  if (result.absorbed > 0) { sfx.ward(); floatText(stage, 120, targetY - 20, `■ ${result.absorbed}`, 'wrd'); }
  if (result.healed > 0) { sfx.heal(); floatText(stage, 150, ownY - 30, `+${result.healed}`, 'hl'); }
  if (result.brew.ward > 0) burst(stage, 120, ownY, [SUITS.salt.color, '#e9ddff'], 14, 120);
}

async function playerBrew() {
  const cards = pickedCards();
  if (ui.busy || !canBrew(state, cards)) return;
  ui.busy = true;
  sfx.brew();
  const result = resolveBrew(state, 'player', cards.map((c) => c.id));
  ui.selected.clear();
  draw();
  await wait(380);
  impact(result);
  await wait(1100);
  if (state.phase === 'won') return finish(true);
  draw({ animate: false });
  await wait(500);
  const rivalResult = runRivalTurn(state);
  sfx.brew();
  draw();
  await wait(560);
  impact(rivalResult);
  await wait(900);
  ui.busy = false;
  if (state.phase === 'lost') return finish(false);
  draw({ animate: false });
}

function playerDistill() {
  const cards = pickedCards();
  if (ui.busy || !canDistill(state, cards)) return;
  distill(state, cards.map((c) => c.id));
  ui.selected.clear();
  sfx.distill();
  draw();
}

async function finish(won) {
  ui.busy = true;
  await wait(300);
  draw({ animate: false });
  screen = won ? 'won' : 'lost';
  const o = renderEnd(stage, state, won);
  o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'backwards' });
  o.querySelector('.end-card').animate([{ transform: 'scale(.4) rotate(-6deg)', opacity: 0 }, { transform: 'scale(1.08) rotate(1deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,1.3,.35,1)' });
  if (won) { sfx.win(); burst(stage, 640, 300, ['#f3d27a', '#e2482c', '#159fc4', '#7d55d0', '#2b9a55'], 80, 520); } else sfx.lose();
  ui.busy = false;
}

let difficulty = 'adept';

function startDuel(level = difficulty) {
  difficulty = level;
  startMusic();
  state = createDuel(seedParam || (Date.now() & 0xffffff), difficulty);
  ui.selected.clear();
  ui.busy = false;
  ui.pops = [];
  screen = 'duel';
  stage.innerHTML = '';
  draw();
}

bindInput(stage, {
  toggleCard(id) {
    if (screen !== 'duel' || ui.busy || state.phase !== 'player') return;
    if (ui.selected.has(id)) { ui.selected.delete(id); sfx.unpick(); } else { ui.selected.add(id); sfx.pick(); }
    draw();
  },
  toggleSlot(i) {
    if (screen === 'title' && (i === 0 || i === 2)) { startDuel(i === 0 ? 'novice' : 'magister'); return; }
    if (screen !== 'duel' || !state.player.hand[i]) return;
    this.toggleCard(state.player.hand[i].id);
  },
  clearSelection() {
    if (screen !== 'duel' || ui.busy) return;
    ui.selected.clear();
    draw();
  },
  action(name) {
    if (name === 'mute') { toggleMute(); return; }
    if (screen === 'title' && name.startsWith('start-')) { startDuel(name.slice(6)); return; }
    if (screen === 'title' && name === 'confirm') { startDuel('adept'); return; }
    if ((screen === 'won' || screen === 'lost') && (name === 'restart' || name === 'confirm')) { startDuel(); return; }
    if (screen !== 'duel') return;
    if (name === 'brew' || name === 'confirm') playerBrew();
    if (name === 'distill') playerDistill();
  },
});

function boot() {
  if (!shot) { renderTitle(stage); return; }
  document.documentElement.classList.add('shot-mode');
  if (shot === 'title') { renderTitle(stage, { animate: false }); return; }
  if (shot === 'table') {
    const staged = stageTable(seedParam || 1);
    state = staged.state;
    ui.selected = staged.selected;
    ui.pops = staged.pops;
    screen = 'duel';
    renderTable(stage, state, ui);
    return;
  }
  const staged = stageEnding(seedParam || 1, shot === 'win');
  state = staged.state;
  screen = shot === 'win' ? 'won' : 'lost';
  renderTable(stage, state, ui);
  renderEnd(stage, state, shot === 'win');
}
boot();
