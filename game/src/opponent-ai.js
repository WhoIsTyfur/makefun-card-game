// Abbess Grue, the rival: weighs every possible brew in her hand and announces
// the one she will throw next turn, so the player can read it and ward against it.
import { allBrews, evaluateBrew } from "./combos.js";
import { START_LIFE } from "./rules.js";

const KEEP_CARD_COST = 1.6;

export function scoreRivalBrew(brew, rival, player) {
  const lethal = brew.damage >= player.life + player.ward;
  if (lethal) return 1000 + brew.damage;
  const hurt = START_LIFE - rival.life;
  const wardWeight = rival.life < 30 ? 0.95 : rival.life < 50 ? 0.65 : 0.35;
  const healWeight = hurt > 18 ? 1.1 : hurt > 8 ? 0.6 : 0.1;
  const usefulHeal = Math.min(brew.heal, hurt);
  const pressure = player.life < 30 ? 1.25 : 1;
  return brew.damage * pressure + brew.ward * wardWeight + usefulHeal * healWeight + brew.draw * 1.5
    - brew.cards.length * KEEP_CARD_COST + brew.chain * 1.2;
}

/** Picks the rival's next brew and labels it as an intent the table shows. */
export function planRivalBrew(state) {
  const { rival, player } = state;
  if (rival.hand.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const cards of allBrews(rival.hand)) {
    const brew = evaluateBrew(cards, rival.lastSuit, rival.chain);
    const score = scoreRivalBrew(brew, rival, player);
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
