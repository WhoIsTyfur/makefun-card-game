// Card faces and backs, drawn as DOM + inline SVG: each suit has its own colour AND shape.
import { SUITS } from './deck.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const SHAPES = {
  triangle: '<polygon points="50,8 94,88 6,88" />',
  circle: '<circle cx="50" cy="50" r="42" />',
  square: '<rect x="11" y="11" width="78" height="78" rx="6" />',
  diamond: '<polygon points="50,4 94,50 50,96 6,50" />',
};

const MARKS = {
  triangle: '<path d="M50 36 C42 50 40 62 50 72 C60 62 58 50 50 36Z" fill="#fff6" />',
  circle: '<ellipse cx="38" cy="36" rx="14" ry="9" fill="#fff8" />',
  square: '<path d="M30 50 L50 30 L70 50 L50 70Z" fill="none" stroke="#fff8" stroke-width="5" />',
  diamond: '<path d="M50 22 L50 78 M30 50 L70 50" stroke="#fff8" stroke-width="5" />',
};

export function suitGlyphSvg(suitId, size = 40) {
  const suit = SUITS[suitId];
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100" width="${size}" height="${size}" class="glyph">`
    + `<g fill="${suit.color}" stroke="${suit.ink}" stroke-width="5" stroke-linejoin="round">${SHAPES[suit.shape]}</g>${MARKS[suit.shape]}</svg>`;
}

export function makeCardFace(card) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card face suit-${card.suit}`;
  el.dataset.id = card.id;
  el.style.setProperty('--suit', suit.color);
  el.style.setProperty('--ink', suit.ink);
  el.innerHTML = `
    <div class="corner tl"><span class="val">${card.value}</span>${suitGlyphSvg(card.suit, 26)}</div>
    <div class="heart">${suitGlyphSvg(card.suit, 70)}</div>
    <div class="corner br"><span class="val">${card.value}</span>${suitGlyphSvg(card.suit, 26)}</div>
    <div class="suitname">${suit.name}</div>`;
  return el;
}

export function makeCardBack(id) {
  const el = document.createElement('div');
  el.className = 'card back';
  if (id) el.dataset.id = id;
  el.innerHTML = `<div class="sigil"><svg viewBox="0 0 100 100" width="56" height="56"><circle cx="50" cy="50" r="40" fill="none" stroke="#d8b46a" stroke-width="4"/><polygon points="50,14 82,70 18,70" fill="none" stroke="#d8b46a" stroke-width="4"/><circle cx="50" cy="52" r="10" fill="#d8b46a"/></svg></div>`;
  return el;
}
