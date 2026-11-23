// Abbess Grue, the rival: weighs every possible brew in her hand and announces
// the one she will throw next turn, so the player can read it and ward against it.
// Difficulty: Novice brews sloppily, Adept weighs her own state, Magister also reads
// the threat in your hand and wards up when you could finish her.
import { allBrews, evaluateBrew } from "./combos.js";
import { START_LIFE } from "./rules.js";

export const DIFFICULTIES = {
  novice: { name: 'Novice', keepCost: 0.4, noise: 14, readsThreat: false },
  adept: { name: 'Adept', keepCost: 1.6, noise: 0, readsThreat: false },
  magister: { name: 'Magister', keepCost: 4.0, noise: 0, readsThreat: true },
};

/** The most damage the opponent could deal next turn from their hand (Magister peeks at it). */
export function threatFrom(side) {
  let most = 0;
  for (const cards of allBrews(side.hand)) {
    const b = evaluateBrew(cards, side.lastSuit, side.chain);
    if (b.damage > most) most = b.damage;
  }
  return most;
}

export function scoreRivalBrew(brew, rival, player, level = DIFFICULTIES.adept, threat = 0) {
  const lethal = brew.damage >= player.life + player.ward;
  if (lethal) return 1000 + brew.damage;
  const hurt = START_LIFE - rival.life;
  let wardWeight = rival.life < 30 ? 0.95 : rival.life < 50 ? 0.65 : 0.35;
  if (level.readsThreat && threat >= rival.life) wardWeight = 1.6;
  const healWeight = hurt > 18 ? 1.1 : hurt > 8 ? 0.6 : 0.1;
  const usefulHeal = Math.min(brew.heal, hurt);
  const usefulWard = level.readsThreat ? Math.min(brew.ward, Math.max(threat, 6)) : brew.ward;
  const pressure = player.life < 30 ? 1.25 : 1;
  return brew.damage * pressure + usefulWard * wardWeight + usefulHeal * healWeight + brew.draw * 1.5
    - brew.cards.length * level.keepCost + brew.chain * 1.2;
}

/** Picks the rival's next brew and labels it as an intent the table shows. */
export function planRivalBrew(state) {
  const { rival, player } = state;
  if (rival.hand.length === 0) return null;
  const level = DIFFICULTIES[state.difficulty] || DIFFICULTIES.adept;
  const threat = level.readsThreat ? threatFrom(player) : 0;
  let best = null;
  let bestScore = -Infinity;
  for (const cards of allBrews(rival.hand)) {
    const brew = evaluateBrew(cards, rival.lastSuit, rival.chain);
    let score = scoreRivalBrew(brew, rival, player, level, threat);
    if (level.noise) score += state.rng.next() * level.noise;
    if (score > bestScore) { bestScore = score; best = brew; }
  }
  return { cards: best.cards, brew: best, mood: intentMood(best) };
}

export function intentMood(brew) {
  if (brew.damage >= 25) return 'Savage strike';
  if (brew.ward > brew.damage) return 'Warding up';
  if (brew.heal > brew.damage) return 'Mending';
  return 'Attack';
}
