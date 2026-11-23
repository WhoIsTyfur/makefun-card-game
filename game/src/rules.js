// The duel: two alchemists, 80 vitality each. On your turn draw 2 (hand max 10),
// optionally Distill (swap up to 3 cards once a turn), then Brew 1-5 cards.
// Ward lasts until its owner's next turn. Reduce the rival to 0 to win.
import { createRng } from './rng.js';
import { buildSatchel, drawCards, sortHand } from './deck.js';
import { evaluateBrew, MAX_BREW } from './combos.js';
import { planRivalBrew } from './opponent-ai.js';

export const START_LIFE = 80;
export const START_HAND = 7;
export const DRAW_PER_TURN = 2;
export const HAND_LIMIT = 10;
export const DISTILL_MAX = 3;

function makeSide(owner, name, rng) {
  return { owner, name, life: START_LIFE, ward: 0, satchel: buildSatchel(owner, rng), hand: [], spent: [], chain: 0, lastSuit: null, distilled: false, intent: null };
}

export function createDuel(seed) {
  const rng = createRng(seed);
  const state = {
    seed, rng, turn: 1, phase: 'player',
    player: makeSide('you', 'You', rng),
    rival: makeSide('rival', 'Abbess Grue', rng),
    lastBrew: null,
    log: ['The crucible is lit. Brew first, apprentice.'],
    stats: { biggestHit: 0, bestCombo: '—', bestBonus: 0, turns: 0 },
  };
  drawCards(state.player, START_HAND, rng);
  drawCards(state.rival, START_HAND, rng);
  sortHand(state.player.hand);
  state.rival.intent = planRivalBrew(state);
  return state;
}

function drawUpTo(side, n, rng) {
  const room = Math.max(0, HAND_LIMIT - side.hand.length);
  return drawCards(side, Math.min(n, room), rng);
}

export function canBrew(state, cards) {
  return state.phase === 'player' && cards.length >= 1 && cards.length <= MAX_BREW;
}

export function canDistill(state, cards) {
  return state.phase === 'player' && !state.player.distilled && cards.length >= 1 && cards.length <= DISTILL_MAX;
}

/** Swap up to 3 cards for fresh ones, once per turn. */
export function distill(state, cardIds) {
  const side = state.player;
  const cards = side.hand.filter((c) => cardIds.includes(c.id));
  if (!canDistill(state, cards)) return null;
  side.hand = side.hand.filter((c) => !cardIds.includes(c.id));
  side.spent.push(...cards);
  const drawn = drawCards(side, cards.length, state.rng);
  side.distilled = true;
  sortHand(side.hand);
  state.log.push(`You distilled ${cards.length} reagent${cards.length > 1 ? 's' : ''}.`);
  return drawn;
}

/** Resolves a brew by `who` ('player' or 'rival') and returns what happened. */
export function resolveBrew(state, who, cardIds) {
  const me = state[who];
  const foe = who === 'player' ? state.rival : state.player;
  const cards = me.hand.filter((c) => cardIds.includes(c.id));
  if (cards.length < 1 || cards.length > MAX_BREW) return null;
  const brew = evaluateBrew(cards, me.lastSuit, me.chain);
  me.hand = me.hand.filter((c) => !cardIds.includes(c.id));

  const absorbed = Math.min(foe.ward, brew.damage);
  foe.ward -= absorbed;
  const dealt = brew.damage - absorbed;
  foe.life = Math.max(0, foe.life - dealt);
  const healed = Math.min(brew.heal, START_LIFE - me.life);
  me.life += healed;
  me.ward += brew.ward;
  me.chain = brew.chain;
  me.lastSuit = brew.combos.length > 0 ? brew.suit : null;
  me.spent.push(...cards);
  const drew = drawUpTo(me, brew.draw, state.rng);
  if (who === 'player') sortHand(me.hand);

  const result = { by: who, brew, absorbed, dealt, healed, drew: drew.length, turn: state.turn };
  state.lastBrew = result;
  state.log.push(describeBrew(me, brew, result));
  if (who === 'player') {
    if (dealt > state.stats.biggestHit) state.stats.biggestHit = dealt;
    if (brew.comboBonus > state.stats.bestBonus) { state.stats.bestBonus = brew.comboBonus; state.stats.bestCombo = brew.title; }
  }
  if (foe.life <= 0) state.phase = who === 'player' ? 'won' : 'lost';
  else state.phase = who === 'player' ? 'rival' : 'player';
  return result;
}

function describeBrew(me, brew, r) {
  const parts = [`${me.name} brewed ${brew.title}`];
  if (brew.damage) parts.push(`${r.dealt} damage${r.absorbed ? ` (${r.absorbed} warded)` : ''}`);
  if (brew.ward) parts.push(`+${brew.ward} ward`);
  if (r.healed) parts.push(`+${r.healed} life`);
  if (brew.chain >= 2) parts.push(`chain ×${brew.chain}`);
  return parts.join(' · ');
}

/** The rival's turn: its old ward fades, it brews exactly what it announced, then plans the next brew. */
export function runRivalTurn(state) {
  if (state.phase !== 'rival') return null;
  const rival = state.rival;
  rival.ward = 0;
  const plan = rival.intent || planRivalBrew(state);
  const result = resolveBrew(state, 'rival', plan.cards.map((c) => c.id));
  drawUpTo(rival, DRAW_PER_TURN, state.rng);
  if (state.phase === 'player') startPlayerTurn(state);
  return result;
}

export function startPlayerTurn(state) {
  state.turn += 1;
  state.stats.turns = state.turn;
  const me = state.player;
  me.ward = 0;
  me.distilled = false;
  const drawn = drawUpTo(me, DRAW_PER_TURN, state.rng);
  sortHand(me.hand);
  state.rival.intent = planRivalBrew(state);
  return drawn;
}
