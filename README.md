# VITRIOL — an alchemists' card duel

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/WhoIsTyfur/makefun-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/WhoIsTyfur/makefun-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A browser card game made for make.fun's "Make the best card game" bounty. You are an apprentice alchemist duelling
Abbess Grue across a candlelit bench. Each turn you **brew** 1–5 reagent cards from your hand. Poker-style
recipes add power, and each of the four suits routes its cards somewhere different:

| Suit | Shape & colour | What its cards do |
| --- | --- | --- |
| Brimstone | ▲ red triangle | value + 2 burn as damage |
| Quicksilver | ● cyan circle | value as damage, draw 1 card each |
| Salt | ■ violet square | value becomes Ward (absorbs the next hit) |
| Verdigris | ◆ green diamond | half value heals you |

Recipes stack: Pair +4, Two Pair +9, Triple +11, Full House +18, Quad +22, Run of 3/4/5 +6/10/14,
Pure suit 3/4/5 +7/10/13, Run + Pure (4+) **Grand Elixir** +15, and a **Chain** of +3 per step when you keep
brewing your last brew's main suit. You draw only 2 a turn (hand max 10), so you choose between a big
combo now and a bigger one later. Distill swaps up to 3 cards once a turn.

The rival announces its next brew on the table (recipe, suits, damage, ward), so you can read it and ward
against it with Salt or race it down. Both start at 80 vitality; reach 0 and the flask shatters.

Mouse: click cards, BREW, DISTILL. Keys: `1`–`0` pick cards, `Enter` brew, `D` distill, `Esc` clear, `M` mute.
All art is CSS and inline SVG (cards, suit shapes, both duellists' portraits), and all sound and music is synthesised
with WebAudio (`audio.js` effects, `music.js` a generative D-dorian score): no image, sound or font files and no network.

## How it is scored

make.fun's house AI judge compares entries two at a time by their screenshots (`screenshots/`, the first is the cover)
and an outline of the source, on completeness, depth, feel, look and originality, and structure.
`main.ts` hands the entry in: it copies `game/` and `screenshots/` to the output folder and writes `dossier.json`
with the kit's `vendor/makefun-game.ts`.

## Run it

```sh
node serve.ts                 # play at http://localhost:8080/
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the hand-in
node tools/capture-shots.mjs  # retake screenshots (needs serve.ts running and Chrome)
```

Screenshot mode: `?shot=title|table|win|loss&seed=N` plays the real rules forward from a seed to a staged moment.

### Source layout (`game/src/`)

`rng.js` seeded random · `deck.js` suits and satchels · `combos.js` recipe scoring · `rules.js` duel and turn flow ·
`opponent-ai.js` the rival's planner and intent · `card-art.js` SVG card faces · `table-render.js` table layout ·
`animations.js` slide/flip/deal and bursts · `audio.js` synthesised sound · `screens.js` title, victory, defeat ·
`portraits.js` duellist portraits · `music.js` generative score · `input.js` mouse and keys ·
`shots.js` staged screenshot moments · `main.js` boot and turn sequencing.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
