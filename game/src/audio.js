// Every sound is synthesised here with WebAudio: no audio files.
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() { muted = !muted; return muted; }

function tone(freq, dur, { type = 'sine', gain = 0.18, at = 0, slide = 0 } = {}) {
  const a = ac();
  if (!a || muted) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { at = 0, gain = 0.2, from = 3000, to = 400 } = {}) {
  const a = ac();
  if (!a || muted) return;
  const t = a.currentTime + at;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  deal: (i = 0) => noise(0.07, { at: i * 0.07, gain: 0.25, from: 4200, to: 1800 }),
  pick: () => tone(660, 0.08, { type: 'triangle', gain: 0.12 }),
  unpick: () => tone(440, 0.08, { type: 'triangle', gain: 0.1 }),
  brew: () => { noise(0.35, { gain: 0.22, from: 600, to: 3200 }); tone(180, 0.3, { type: 'sawtooth', gain: 0.06, slide: 240 }); },
  combo: (steps = 3) => { [523, 659, 784, 1046, 1318].slice(0, Math.min(5, steps + 1)).forEach((f, i) => tone(f, 0.22, { type: 'triangle', at: i * 0.07, gain: 0.14 })); },
  hit: () => { tone(110, 0.32, { type: 'square', gain: 0.12, slide: -70 }); noise(0.18, { gain: 0.3, from: 900, to: 120 }); },
  ward: () => tone(880, 0.4, { type: 'sine', gain: 0.1, slide: -300 }),
  heal: () => { tone(523, 0.3, { gain: 0.08 }); tone(784, 0.4, { gain: 0.08, at: 0.1 }); },
  distill: () => { tone(300, 0.25, { type: 'triangle', gain: 0.1, slide: 500 }); noise(0.2, { gain: 0.12, from: 2000, to: 5000 }); },
  win: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, { type: 'triangle', at: i * 0.12, gain: 0.16 })),
  lose: () => [392, 349, 311, 262].forEach((f, i) => tone(f, 0.55, { type: 'sawtooth', at: i * 0.22, gain: 0.07, slide: -20 })),
};
