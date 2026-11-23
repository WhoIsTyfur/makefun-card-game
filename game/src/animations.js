// Motion: cards slide, flip and snap between renders (FLIP), deals fan in with weight,
// and hits, combos and wins burst with particles.
const EASE_SNAP = 'cubic-bezier(.2,1.25,.35,1)';
const EASE_OUT = 'cubic-bezier(.16,.84,.3,1)';

function stageScale(root) {
  return root.getBoundingClientRect().width / 1280 || 1;
}

function rotOf(e) {
  return parseFloat(e.style.getPropertyValue('--rot')) || 0;
}

/** Remembers where every card is before the table is redrawn. */
export function captureCards(root) {
  const k = stageScale(root);
  const box = root.getBoundingClientRect();
  const map = new Map();
  root.querySelectorAll('.card[data-id]').forEach((e) => {
    const r = e.getBoundingClientRect();
    map.set(e.dataset.id, { x: (r.left - box.left) / k, y: (r.top - box.top) / k, rot: rotOf(e), back: e.classList.contains('back') });
  });
  return map;
}

/** Animates every card from where it was to where it now sits; new cards are dealt from a pile. */
export function animateFromCapture(root, before, { dealFrom = { x: 268, y: 470 }, stagger = 70 } = {}) {
  const k = stageScale(root);
  const box = root.getBoundingClientRect();
  let dealt = 0;
  root.querySelectorAll('.card[data-id]').forEach((e) => {
    const r = e.getBoundingClientRect();
    const now = { x: (r.left - box.left) / k, y: (r.top - box.top) / k };
    const rot = rotOf(e);
    const was = before.get(e.dataset.id);
    if (was) {
      const dx = was.x - now.x;
      const dy = was.y - now.y;
      const flips = was.back && e.classList.contains('face');
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !flips) return;
      const frames = flips
        ? [
          { transform: `translate(${dx}px,${dy}px) rotate(${was.rot}deg) rotateY(180deg) scale(.8)`, filter: 'brightness(.4)' },
          { transform: `translate(${dx * 0.4}px,${dy * 0.4 - 40}px) rotate(${rot}deg) rotateY(90deg) scale(1.15)`, filter: 'brightness(1.6)', offset: 0.55 },
          { transform: `translate(0,0) rotate(${rot}deg) rotateY(0deg) scale(1)`, filter: 'brightness(1)' },
        ]
        : [
          { transform: `translate(${dx}px,${dy}px) rotate(${was.rot}deg)` },
          { transform: `translate(0,0) rotate(${rot}deg)` },
        ];
      e.animate(frames, { duration: flips ? 620 : 420, easing: EASE_SNAP, fill: 'backwards' });
    } else {
      const dx = dealFrom.x - now.x;
      const dy = dealFrom.y - now.y;
      const isBack = e.classList.contains('back');
      const fromY = isBack ? -180 : dy;
      const fromX = isBack ? 0 : dx;
      e.animate([
        { transform: `translate(${fromX}px,${fromY}px) rotate(-25deg) rotateY(${isBack ? 0 : 180}deg) scale(.7)`, opacity: 0.2 },
        { transform: `translate(0,-18px) rotate(${rot}deg) rotateY(0deg) scale(1.06)`, opacity: 1, offset: 0.8 },
        { transform: `translate(0,0) rotate(${rot}deg) scale(1)`, opacity: 1 },
      ], { duration: 560, delay: dealt * stagger, easing: EASE_OUT, fill: 'backwards' });
      dealt += 1;
    }
  });
  return dealt;
}

export function shake(target, strength = 10) {
  target.animate([
    { transform: 'translate(0,0)' }, { transform: `translate(${-strength}px,${strength / 2}px)` },
    { transform: `translate(${strength}px,${-strength / 2}px)` }, { transform: `translate(${-strength / 2}px,0)` }, { transform: 'translate(0,0)' },
  ], { duration: 360, easing: 'ease-out' });
}

/** Sparks flying out of a point on the stage. */
export function burst(root, x, y, colors, count = 26, spread = 220) {
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  root.append(layer);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'spark';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = colors[i % colors.length];
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const d = spread * (0.45 + Math.random() * 0.55);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1.4)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 40}px) scale(.2)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 500, easing: EASE_OUT, fill: 'forwards' });
    layer.append(p);
  }
  setTimeout(() => layer.remove(), 1400);
}

/** A rising number over a life total. */
export function floatText(root, x, y, text, cls) {
  const e = document.createElement('div');
  e.className = `pop ${cls}`;
  e.textContent = text;
  e.style.left = `${x}px`;
  e.style.top = `${y}px`;
  root.append(e);
  e.animate([
    { transform: 'translateY(20px) scale(.4)', opacity: 0 },
    { transform: 'translateY(-10px) scale(1.25)', opacity: 1, offset: 0.25 },
    { transform: 'translateY(-60px) scale(1)', opacity: 0 },
  ], { duration: 1300, easing: EASE_OUT, fill: 'forwards' });
  setTimeout(() => e.remove(), 1400);
}

/** Pulses the combo callout so it lands with a snap. */
export function slamCallout(root) {
  const c = root.querySelector('.callout');
  if (!c) return;
  c.animate([
    { transform: 'scale(2.2)', opacity: 0, filter: 'blur(6px)' },
    { transform: 'scale(.94)', opacity: 1, filter: 'blur(0)', offset: 0.6 },
    { transform: 'scale(1)', opacity: 1 },
  ], { duration: 520, easing: EASE_SNAP });
}

/** Endless confetti of suit shapes behind the victory screen. */
export function confetti(layer, colors, count = 70) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = `confetto s${i % 4}`;
    p.style.left = `${(i * 37) % 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${-(i % 17) * 0.23}s`;
    p.style.animationDuration = `${2.6 + (i % 5) * 0.4}s`;
    layer.append(p);
  }
}
