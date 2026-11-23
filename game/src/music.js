// A generative score for the duel, written in code: a low two-voice drone under a plucked
// arpeggio in D dorian that wanders slowly. Starts with the duel; M mutes it with the sound effects.
import { audioContext, isMuted } from './audio.js';

const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const ROOT_HZ = 146.83; // D3
const STEP_SEC = 0.42;
let running = null;

const hz = (degree, octave = 0) => {
  const d = ((degree % 7) + 7) % 7;
  const o = Math.floor(degree / 7) + octave;
  return ROOT_HZ * 2 ** ((DORIAN[d] + 12 * o) / 12);
};

function pluck(a, out, freq, at, gain) {
  const o = a.createOscillator();
  const g = a.createGain();
  const f = a.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.value = freq;
  f.type = 'lowpass';
  f.frequency.setValueAtTime(2400, at);
  f.frequency.exponentialRampToValueAtTime(500, at + 0.6);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
  o.connect(f).connect(g).connect(out);
  o.start(at);
  o.stop(at + 1.2);
}

function drone(a, out) {
  const g = a.createGain();
  g.gain.value = 0.035;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 320;
  const voices = [hz(0, -1), hz(0, -1) * 1.006, hz(4, -1)].map((freq) => {
    const o = a.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.connect(f);
    o.start();
    return o;
  });
  f.connect(g).connect(out);
  return voices;
}

/** Starts the score (once); safe to call on every duel start. */
export function startMusic() {
  const a = audioContext();
  if (!a || running) return;
  const out = a.createGain();
  out.gain.value = isMuted() ? 0 : 0.8;
  out.connect(a.destination);
  const voices = drone(a, out);
  let step = 0;
  let degree = 0;
  let next = a.currentTime + 0.1;
  const timer = setInterval(() => {
    while (next < a.currentTime + 0.5) {
      const phrase = Math.floor(step / 16) % 4;
      const shape = [0, 2, 4, 2, 0, 4, 6, 4][step % 8];
      if (step % 8 === 0) degree = [0, 3, 5, 4][phrase];
      if (step % 2 === 0 || step % 8 === 5) pluck(a, out, hz(degree + shape, 1), next, step % 8 === 0 ? 0.09 : 0.05);
      next += STEP_SEC;
      step += 1;
    }
    out.gain.value = isMuted() ? 0 : 0.8;
  }, 120);
  running = { timer, voices, out };
}
