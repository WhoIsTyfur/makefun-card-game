// Recipes: how a brew of 1-5 reagent cards is scored.
// Rank patterns (pairs, triples...), runs and single-suit "purity" stack;
// each suit then routes its card values: Brimstone & Quicksilver hit,
// Salt becomes Ward, Verdigris heals. Repeating last brew's main suit builds a Chain.
import { SUIT_ORDER } from './deck.js';

export const MAX_BREW = 5;

export const RECIPES = [
  { key: 'pair', name: 'Pair', bonus: 4 },
  { key: 'twoPair', name: 'Two Pair', bonus: 9 },
  { key: 'triple', name: 'Triple', bonus: 11 },
  { key: 'fullHouse', name: 'Full House', bonus: 18 },
  { key: 'quad', name: 'Quad', bonus: 22 },
  { key: 'run', name: 'Run 3+', bonus: 6, per: 4 },
  { key: 'purity', name: 'Purity 3+', bonus: 7, per: 3 },
  { key: 'elixir', name: 'Grand Elixir', bonus: 15 },
];
export const CHAIN_STEP = 3;

function rankPattern(cards) {
  const counts = {};
  for (const c of cards) counts[c.value] = (counts[c.value] || 0) + 1;
  const groups = Object.values(counts).sort((a, b) => b - a);
  if (groups[0] === 4) return { key: 'quad', name: 'Quad', bonus: 22 };
  if (groups[0] === 3 && groups[1] === 2) return { key: 'fullHouse', name: 'Full House', bonus: 18 };
  if (groups[0] === 3) return { key: 'triple', name: 'Triple', bonus: 11 };
  if (groups[0] === 2 && groups[1] === 2) return { key: 'twoPair', name: 'Two Pair', bonus: 9 };
  if (groups[0] === 2) return { key: 'pair', name: 'Pair', bonus: 4 };
  return null;
}

function runPattern(cards) {
  if (cards.length < 3) return null;
  const values = cards.map((c) => c.value).sort((a, b) => a - b);
  for (let i = 1; i < values.length; i++) if (values[i] !== values[i - 1] + 1) return null;
  return { key: 'run', name: `Run of ${cards.length}`, bonus: 6 + 4 * (cards.length - 3) };
}

function purityPattern(cards) {
  if (cards.length < 3) return null;
  if (!cards.every((c) => c.suit === cards[0].suit)) return null;
  return { key: 'purity', name: `Pure ${cards.length}`, bonus: 7 + 3 * (cards.length - 3) };
}

export function dominantSuit(cards) {
  let best = null;
  let bestCount = 0;
  for (const suit of SUIT_ORDER) {
    const n = cards.filter((c) => c.suit === suit).length;
    if (n > bestCount) { best = suit; bestCount = n; }
  }
  return best;
}

/**
 * Scores a brew. `chainBefore` is the brewer's chain and `lastSuit` the main suit
 * of their previous brew; the result says what the brew does when it lands.
 */
export function evaluateBrew(cards, lastSuit = null, chainBefore = 0) {
  const combos = [];
  if (cards.length === 0) return emptyBrew();
  const rank = rankPattern(cards);
  const run = runPattern(cards);
  const purity = purityPattern(cards);
  if (rank) combos.push(rank);
  if (run) combos.push(run);
  if (purity) combos.push(purity);
  if (run && purity && cards.length >= 4) combos.push({ key: 'elixir', name: 'Grand Elixir', bonus: 15 });

  const suit = dominantSuit(cards);
  const chain = suit && suit === lastSuit && combos.length > 0 ? chainBefore + 1 : combos.length > 0 ? 1 : 0;
  const chainBonus = chain >= 2 ? (chain - 1) * CHAIN_STEP : 0;
  const comboBonus = combos.reduce((sum, c) => sum + c.bonus, 0);

  let damage = 0, ward = 0, heal = 0, draw = 0, burn = 0;
  for (const c of cards) {
    if (c.suit === 'brimstone') { damage += c.value + 2; burn += 2; }
    else if (c.suit === 'quicksilver') { damage += c.value; draw += 1; }
    else if (c.suit === 'salt') ward += c.value;
    else if (c.suit === 'verdigris') heal += Math.ceil(c.value / 2);
  }
  damage += comboBonus + chainBonus;
  return { cards, combos, comboBonus, chain, chainBonus, damage, ward, heal, draw, burn, suit, title: brewTitle(combos, cards) };
}

function emptyBrew() {
  return { cards: [], combos: [], comboBonus: 0, chain: 0, chainBonus: 0, damage: 0, ward: 0, heal: 0, draw: 0, burn: 0, suit: null, title: '—' };
}

export function brewTitle(combos, cards) {
  if (combos.length === 0) return cards.length === 1 ? 'Single Dram' : 'Loose Mix';
  return combos.map((c) => c.name).join(' + ');
}

/** Every way to pick 1..MAX_BREW cards from a hand (hands stay small, so this is cheap). */
export function allBrews(hand) {
  const out = [];
  const pick = [];
  const walk = (start) => {
    if (pick.length > 0) out.push(pick.slice());
    if (pick.length === MAX_BREW) return;
    for (let i = start; i < hand.length; i++) {
      pick.push(hand[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}
