// Title, victory and defeat screens, laid over the stage.
import { SUITS, SUIT_ORDER } from './deck.js';
import { makeCardFace, suitGlyphSvg } from './card-art.js';
import { confetti } from './animations.js';
import { rivalPortrait, playerPortrait } from './portraits.js';

function overlay(cls) {
  const o = document.createElement('div');
  o.className = `overlay ${cls}`;
  return o;
}

export function renderTitle(root, { animate = true } = {}) {
  root.innerHTML = '';
  const o = overlay('title-screen');
  o.innerHTML = `
    <div class="title-glow"></div>
    <div class="title-sub top">AN ALCHEMISTS' CARD DUEL</div>
    <h1 class="logo">VITRIOL</h1>
    <div class="title-sub">Brew poker-style recipes from four reagents. Outbrew Abbess Grue.</div>
    <div class="title-fan"></div>
    <div class="title-rules">
      ${SUIT_ORDER.map((s) => `<div class="rule">${suitGlyphSvg(s, 30)}<b style="color:${SUITS[s].color}">${SUITS[s].name}</b><span>${SUITS[s].rider}</span></div>`).join('')}
    </div>
    <div class="title-start">
      <button class="btn level" data-action="start-novice">NOVICE <kbd>1</kbd></button>
      <button class="btn start" data-action="start-adept">DUEL GRUE · ADEPT <kbd>Enter</kbd></button>
      <button class="btn level hard" data-action="start-magister">MAGISTER <kbd>3</kbd></button>
    </div>
    <div class="title-keys">Mouse: click cards · Keys: 1–0 pick · Enter brew · D distill · M mute</div>`;
  o.querySelector('.title-glow').insertAdjacentHTML('afterend', `<div class="title-rival">${rivalPortrait(110)}<span>ABBESS GRUE<br><em>awaits</em></span></div><div class="title-rival you">${playerPortrait(110)}<span>YOU<br><em>the apprentice</em></span></div>`);
  const fan = o.querySelector('.title-fan');
  const showcase = [
    { id: 't1', suit: 'brimstone', value: 7 }, { id: 't2', suit: 'quicksilver', value: 7 }, { id: 't3', suit: 'salt', value: 7 },
    { id: 't4', suit: 'verdigris', value: 8 }, { id: 't5', suit: 'brimstone', value: 9 },
  ];
  showcase.forEach((c, i) => {
    const f = makeCardFace(c);
    f.classList.add('title-card');
    f.style.setProperty('--rot', `${(i - 2) * 9}deg`);
    f.style.left = `${i * 92}px`;
    f.style.top = `${Math.abs(i - 2) * 14}px`;
    if (animate) f.animate([{ transform: 'translateY(300px) rotate(0deg)', opacity: 0 }, { transform: `translateY(0) rotate(${(i - 2) * 9}deg)`, opacity: 1 }], { duration: 700, delay: 150 + i * 110, easing: 'cubic-bezier(.2,1.3,.35,1)', fill: 'backwards' });
    fan.append(f);
  });
  const label = document.createElement('div');
  label.className = 'fan-label';
  label.innerHTML = 'TRIPLE 7 · +11 POWER';
  fan.append(label);
  root.append(o);
}

export function renderEnd(root, state, won) {
  const o = overlay(won ? 'end-screen win' : 'end-screen loss');
  const fx = document.createElement('div');
  fx.className = 'confetti-layer';
  o.append(fx);
  if (won) confetti(fx, SUIT_ORDER.map((s) => SUITS[s].color).concat(['#f3d27a']));
  const s = state.stats;
  o.insertAdjacentHTML('beforeend', `
    <div class="end-card">
      <div class="end-kicker">${won ? 'THE GREAT WORK IS DONE' : 'YOUR FLASK SHATTERS'}</div>
      <h2 class="end-title">${won ? 'VICTORY' : 'DEFEAT'}</h2>
      <div class="end-score">
        <div class="side you"><span>YOU</span><b>${state.player.life}</b></div>
        <div class="vs">vs</div>
        <div class="side rival"><span>GRUE</span><b>${state.rival.life}</b></div>
      </div>
      <div class="end-stats">
        <div><em>Turns</em><b>${state.turn}</b></div>
        <div><em>Biggest hit</em><b>${s.biggestHit}</b></div>
        <div><em>Best recipe</em><b>${s.bestCombo}</b></div>
      </div>
      <div class="end-line">${won ? 'Abbess Grue is transmuted to ash. The guild is yours.' : 'Grue\'s brew burns through your wards. Study the recipes and return.'}</div>
      <button class="btn start" data-action="restart">${won ? 'DUEL AGAIN' : 'TRY AGAIN'} <kbd>Enter</kbd></button>
    </div>`);
  root.append(o);
  return o;
}
