// ?shot=table|title|win|loss&seed=N : plays the real rules forward from a seed
// (both sides choosing brews with the rival's planner) to a telling moment, for screenshots.
import { createDuel, resolveBrew, runRivalTurn } from './rules.js';
import { planRivalBrew } from './opponent-ai.js';
import { allBrews, evaluateBrew } from './combos.js';

function planForPlayer(state) {
  return planRivalBrew({ ...state, rival: state.player, player: state.rival });
}

function playOneTurn(state) {
  if (state.phase === 'player') {
    const plan = planForPlayer(state);
    resolveBrew(state, 'player', plan.cards.map((c) => c.id));
  } else if (state.phase === 'rival') {
    runRivalTurn(state);
  }
}

/** The strongest multi-recipe brew the player could pick right now (for the staged selection). */
function showiestSelection(state) {
  let best = null;
  for (const cards of allBrews(state.player.hand)) {
    const b = evaluateBrew(cards, state.player.lastSuit, state.player.chain);
    const score = b.combos.length * 100 + b.chain * 40 + b.damage;
    if (!best || score > best.score) best = { score, brew: b };
  }
  return best;
}

/** Mid-duel, on the player's turn: Grue's brew just landed with a recipe, her next intent is up. */
export function stageTable(seed) {
  for (let s = seed; s < seed + 3000; s++) {
    const state = createDuel(s);
    for (let guard = 0; guard < 60 && (state.phase === 'player' || state.phase === 'rival'); guard++) {
      playOneTurn(state);
      const last = state.lastBrew;
      if (state.phase !== 'player' || !last || last.by !== 'rival') continue;
      if (state.turn < 3 || last.brew.combos.length < 2 || last.dealt < 8 || state.rival.hand.length < 4) continue;
      if (state.player.life < 25 || state.rival.life < 20 || state.rival.life > 70) continue;
      if (state.player.hand.length < 6 || !state.rival.intent || state.rival.intent.brew.damage < 10) continue;
      const pick = showiestSelection(state);
      if (!pick || pick.brew.combos.length < 2) continue;
      return { state, selected: new Set(pick.brew.cards.map((c) => c.id)), pops: [{ target: 'player', text: `−${last.dealt}`, kind: 'dmg' }], seed: s };
    }
  }
  return null;
}

/** Plays whole duels until one ends the way the shot needs. */
export function stageEnding(seed, wantWin) {
  for (let s = seed; s < seed + 400; s++) {
    const state = createDuel(s);
    for (let guard = 0; guard < 200 && (state.phase === 'player' || state.phase === 'rival'); guard++) playOneTurn(state);
    if (state.phase === (wantWin ? 'won' : 'lost') && state.turn >= 6) return { state, seed: s };
  }
  return null;
}
