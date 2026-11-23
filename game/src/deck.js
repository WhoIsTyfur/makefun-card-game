// The four reagent suits and each duellist's 40-card satchel.
import { shuffleInPlace } from './rng.js';

export const SUITS = {
  brimstone: { id: 'brimstone', name: 'Brimstone', glyph: '▲', shape: 'triangle', color: '#e2482c', ink: '#9c2412', rider: 'Burn: +2 damage each' },
  quicksilver: { id: 'quicksilver', name: 'Quicksilver', glyph: '●', shape: 'circle', color: '#159fc4', ink: '#0b6481', rider: 'Draw 1 card each' },
  salt: { id: 'salt', name: 'Salt', glyph: '■', shape: 'square', color: '#7d55d0', ink: '#4c2c95', rider: 'Value becomes Ward' },
  verdigris: { id: 'verdigris', name: 'Verdigris', glyph: '◆', shape: 'diamond', color: '#2b9a55', ink: '#17663a', rider: 'Half value heals you' },
};
export const SUIT_ORDER = ['brimstone', 'quicksilver', 'salt', 'verdigris'];
export const MAX_VALUE = 10;

export function buildSatchel(owner, rng) {
  const cards = [];
  for (const suit of SUIT_ORDER) {
    for (let value = 1; value <= MAX_VALUE; value++) {
      cards.push({ id: `${owner}-${suit}-${value}`, suit, value });
    }
  }
  return shuffleInPlace(cards, rng);
}

/** Draws n cards, folding the spent pile back in when the satchel runs dry. */
export function drawCards(side, n, rng) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (side.satchel.length === 0) {
      if (side.spent.length === 0) break;
      side.satchel = shuffleInPlace(side.spent, rng);
      side.spent = [];
    }
    drawn.push(side.satchel.pop());
  }
  side.hand.push(...drawn);
  return drawn;
}

export function sortHand(hand) {
  hand.sort((a, b) => a.value - b.value || SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit));
}
