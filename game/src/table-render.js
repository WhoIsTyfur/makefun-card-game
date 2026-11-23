// Draws the duel table from the game state on a fixed 1280x800 stage.
import { SUITS, SUIT_ORDER } from './deck.js';
import { evaluateBrew, MAX_BREW } from './combos.js';
import { START_LIFE, HAND_LIMIT } from './rules.js';
import { makeCardFace, makeCardBack, suitGlyphSvg } from './card-art.js';
import { rivalPortrait, playerPortrait } from './portraits.js';
import { DIFFICULTIES } from './opponent-ai.js';

export const STAGE_W = 1280;
export const STAGE_H = 800;
const HAND_Y = 604;
const HAND_CARD_W = 124;
const RIVAL_CARD_W = 78;
const BREW_Y = 214;

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function place(e, x, y, rot = 0) {
  e.style.left = `${x}px`;
  e.style.top = `${y}px`;
  if (rot) e.style.setProperty('--rot', `${rot}deg`);
  return e;
}

export function handSlots(count, centerX = 640, cardW = HAND_CARD_W, span = 780) {
  const gap = count > 1 ? Math.min(cardW + 10, (span - cardW) / (count - 1)) : 0;
  const width = cardW + gap * (count - 1);
  const left = centerX - width / 2;
  return Array.from({ length: count }, (_, i) => ({ x: left + gap * i, rot: (i - (count - 1) / 2) * 2.2, lift: Math.abs(i - (count - 1) / 2) * 3 }));
}

function lifePanel(side, who, isTurn, level, hurt = false) {
  const p = el('div', `panel life-panel ${who}${isTurn ? ' active' : ''}${hurt ? ' hurt' : ''}`);
  const pct = Math.max(0, side.life / START_LIFE) * 100;
  const title = who === 'rival' ? `ABBESS GRUE<span class="level-tag">${(DIFFICULTIES[level] || DIFFICULTIES.adept).name.toUpperCase()}</span>` : 'YOU · APPRENTICE';
  p.innerHTML = `
    <div class="who">${title}</div>
    <div class="life-row"><div class="flask"></div><span class="life-num">${side.life}</span><span class="life-max">/${START_LIFE}</span></div>
    <div class="life-bar"><i style="width:${pct}%"></i></div>
    <div class="stat-row">
      <span class="ward-badge${side.ward ? ' on' : ''}">${suitGlyphSvg('salt', 22)} WARD ${side.ward}</span>
      <span class="chain-badge${side.chain >= 2 ? ' on' : ''}">CHAIN ×${side.chain}</span>
    </div>
    <div class="satchel">Satchel ${side.satchel.length} · Hand ${side.hand.length}</div>
    ${who === 'rival' ? rivalPortrait(64) : playerPortrait(64)}`;
  return p;
}

/** How hard the announced brew will land, counting the ward your selected brew would add. */
function incomingAfterWard(state, ui) {
  const picked = state.player.hand.filter((c) => ui.selected.has(c.id));
  const extraWard = state.phase === 'player' ? evaluateBrew(picked, state.player.lastSuit, state.player.chain).ward : 0;
  const ward = state.player.ward + extraWard;
  const incoming = state.rival.intent.brew.damage;
  return { incoming, ward, taken: Math.max(0, incoming - ward) };
}

function intentPanel(state, ui) {
  const intent = state.rival.intent;
  const p = el('div', 'panel intent-panel');
  if (!intent || state.phase === 'won' || state.phase === 'lost') {
    p.innerHTML = '<div class="intent-head">RIVAL INTENT</div><div class="intent-title">—</div>';
    return p;
  }
  const b = intent.brew;
  const glyphs = intent.cards.map((c) => suitGlyphSvg(c.suit, 26)).join('');
  const threat = b.damage >= state.player.life + state.player.ward ? ' lethal' : '';
  p.innerHTML = `
    <div class="intent-head">RIVAL INTENT · NEXT BREW</div>
    <div class="intent-mood${threat}">${threat ? 'LETHAL!' : intent.mood.toUpperCase()}</div>
    <div class="intent-title">${b.title}</div>
    <div class="intent-glyphs">${glyphs}<span class="intent-count">${intent.cards.length} cards · glowing in her hand</span></div>
    <div class="intent-nums">
      <span class="dmg">⚔ ${b.damage}</span>
      ${b.ward ? `<span class="wrd">■ +${b.ward}</span>` : ''}
      ${b.heal ? `<span class="hl">◆ +${b.heal}</span>` : ''}
    </div>
    ${counterLine(state, ui)}`;
  return p;
}

function counterLine(state, ui) {
  const { incoming, ward, taken } = incomingAfterWard(state, ui);
  if (!incoming) return '<div class="intent-tip">No attack coming: press your advantage</div>';
  if (ward >= incoming) return `<div class="intent-tip good">■ Your ward ${ward} blocks it all</div>`;
  if (ward > 0) return `<div class="intent-tip">You take <b>${taken}</b> · ■ ward blocks ${ward}</div>`;
  return `<div class="intent-tip">You take <b>${taken}</b> · ward with ■ Salt to blunt it</div>`;
}

function recipeBook() {
  const rows = [
    ['Pair', '+4'], ['Two Pair', '+9'], ['Triple', '+11'], ['Full House', '+18'], ['Quad', '+22'],
    ['Run 3/4/5', '+6/10/14'], ['Pure suit 3/4/5', '+7/10/13'], ['Run + Pure 4+', '+15'], ['Chain (same suit)', '+3 / step'],
  ];
  const p = el('div', 'panel recipe-book');
  p.innerHTML = `<div class="book-head">RECIPES</div>`
    + rows.map(([n, v]) => `<div class="recipe"><span>${n}</span><b>${v}</b></div>`).join('')
    + `<div class="book-head small">REAGENTS</div>`
    + SUIT_ORDER.map((s) => `<div class="rider">${suitGlyphSvg(s, 20)}<span style="color:${SUITS[s].color}">${SUITS[s].name}</span><em>${SUITS[s].rider}</em></div>`).join('');
  return p;
}

function brewCallout(last) {
  const box = el('div', `callout by-${last.by}`);
  const chips = last.brew.combos.map((c) => `<span class="chip">${c.name.toUpperCase()} <b>+${c.bonus}</b></span>`);
  if (last.brew.chain >= 2) chips.push(`<span class="chip chain">CHAIN ×${last.brew.chain} <b>+${last.brew.chainBonus}</b></span>`);
  if (chips.length === 0) chips.push('<span class="chip dim">NO RECIPE</span>');
  const who = last.by === 'player' ? 'YOUR BREW' : 'GRUE\'S BREW';
  const effects = [];
  if (last.brew.damage) effects.push(`<span class="dmg">⚔ ${last.dealt} DMG${last.absorbed ? ` <small>(${last.absorbed} warded)</small>` : ''}</span>`);
  if (last.brew.ward) effects.push(`<span class="wrd">■ +${last.brew.ward} WARD</span>`);
  if (last.healed) effects.push(`<span class="hl">◆ +${last.healed} LIFE</span>`);
  if (last.drew) effects.push(`<span class="drw">● +${last.drew} CARD${last.drew > 1 ? 'S' : ''}</span>`);
  box.innerHTML = `<div class="callout-who">${who}</div><div class="chips">${chips.join('')}</div><div class="effects">${effects.join('')}</div>`;
  return box;
}

function previewPanel(state, ui) {
  const p = el('div', 'panel action-panel');
  const picked = state.player.hand.filter((c) => ui.selected.has(c.id));
  const brew = evaluateBrew(picked, state.player.lastSuit, state.player.chain);
  const yourTurn = state.phase === 'player' && !ui.busy;
  const canBrew = yourTurn && picked.length >= 1 && picked.length <= MAX_BREW;
  const canDistill = yourTurn && !state.player.distilled && picked.length >= 1 && picked.length <= 3;
  p.innerHTML = `
    <div class="preview-head">${picked.length ? `BREW PREVIEW · ${picked.length}/${MAX_BREW}` : 'PICK 1–5 CARDS'}</div>
    <div class="preview-title">${picked.length ? brew.title : 'Click cards or press 1–0'}</div>
    <div class="preview-nums">
      <span class="dmg">⚔ ${brew.damage}</span><span class="wrd">■ ${brew.ward}</span><span class="hl">◆ ${brew.heal}</span>
    </div>
    <button class="btn brew${canBrew ? '' : ' off'}" data-action="brew">BREW <kbd>Enter</kbd></button>
    <button class="btn distill${canDistill ? '' : ' off'}" data-action="distill">DISTILL ≤3 <kbd>D</kbd></button>`;
  return p;
}

/** Rebuilds the table. `ui` carries selection, pops and flags from the controller. */
export function renderTable(root, state, ui) {
  root.innerHTML = '';
  const table = el('div', 'table');
  table.append(el('div', 'felt-ring'));
  table.append(el('div', 'crucible'));

  table.append(place(lifePanel(state.rival, 'rival', state.phase === 'rival', state.difficulty), 24, 20));
  const playerHurt = state.phase === 'player' && state.lastBrew?.by === 'rival' && state.lastBrew.dealt > 0;
  table.append(place(lifePanel(state.player, 'player', state.phase === 'player', null, playerHurt), 24, 596));
  table.append(place(intentPanel(state, ui), 968, 20));
  table.append(place(recipeBook(), 1010, 252));
  table.append(place(previewPanel(state, ui), 1040, 596));

  // Rival hand: face-down, fanned along the top.
  handSlots(state.rival.hand.length, 640, RIVAL_CARD_W, 520).forEach((slot, i) => {
    const card = state.rival.hand[i];
    const back = place(makeCardBack(card.id), slot.x, 26 - slot.lift * 0.5, -slot.rot);
    back.classList.add('small');
    if (state.rival.intent && state.rival.intent.cards.some((c) => c.id === card.id)) back.classList.add('primed');
    table.append(back);
  });

  // Satchels.
  const pile = place(el('div', 'pile', `<span>${state.player.satchel.length}</span>`), 268, 470);
  pile.dataset.pile = 'player';
  table.append(pile);

  // Last brew in the crucible.
  const last = state.lastBrew;
  if (last) {
    const cards = last.brew.cards;
    const slots = handSlots(cards.length, 560, 104, 470);
    cards.forEach((card, i) => {
      const face = place(makeCardFace(card), slots[i].x, BREW_Y + (i % 2) * 6, slots[i].rot * 0.6);
      face.classList.add('mid', 'brewed');
      table.append(face);
    });
    table.append(place(brewCallout(last), 300, 384));
  } else {
    table.append(place(el('div', 'crucible-hint', 'THE CRUCIBLE<br><small>brew combos here</small>'), 420, 280));
  }

  // Turn banner and log.
  const banner = state.phase === 'player' ? `YOUR TURN · ${state.turn}` : state.phase === 'rival' ? 'GRUE IS BREWING…' : '';
  if (banner) table.append(place(el('div', `turn-banner ${state.phase}`, banner), 268, 172));
  table.append(place(el('div', 'log', state.log[state.log.length - 1] || ''), 268, 548));

  // Player hand.
  const slots = handSlots(state.player.hand.length, 662, HAND_CARD_W, 730);
  state.player.hand.forEach((card, i) => {
    const s = slots[i];
    const raised = ui.selected.has(card.id);
    const face = place(makeCardFace(card), s.x, HAND_Y + s.lift - (raised ? 34 : 0), s.rot);
    face.classList.add('in-hand');
    if (raised) face.classList.add('selected');
    face.dataset.key = String((i + 1) % 10);
    face.append(el('div', 'hotkey', i < 10 ? String((i + 1) % 10) : ''));
    table.append(face);
  });
  if (state.player.hand.length >= HAND_LIMIT) table.append(place(el('div', 'hand-full', 'HAND FULL'), 600, 580));

  // Floating damage/heal numbers.
  for (const pop of ui.pops || []) {
    const at = pop.target === 'rival' ? [196, 150] : [150, 528];
    table.append(place(el('div', `pop ${pop.kind}`, pop.text), at[0], at[1]));
  }
  if (ui.flash) table.append(el('div', `flash ${ui.flash}`));
  root.append(table);
  return table;
}
