// VITRIOL hand-in: copies the game and its screenshots to the output folder
// and writes the dossier the gate rebuilds byte for byte.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyFolder(name: string): void {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ in the repository`);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, dereference: false });
}

/** Fails early, with a clear message, on screenshots the gate would refuse. */
function checkScreenshots(): void {
  const dir = join(repoRoot, 'screenshots');
  const shots = readdirSync(dir).filter((name) => !name.startsWith('.')).sort();
  if (shots.length < 3 || shots.length > 4) throw new Error(`screenshots/ holds ${shots.length} images; the gate wants 3 or 4`);
  for (const name of shots) {
    if (!/^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/.test(name)) throw new Error(`screenshot name not allowed: ${name}`);
    const bytes = readFileSync(join(dir, name));
    if (bytes.length > 256 * 1024) throw new Error(`${name} is ${bytes.length} bytes; the cap is 256 KiB`);
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    if (!isJpeg && !isPng) throw new Error(`${name} is neither PNG nor JPEG`);
  }
}

checkScreenshots();
mkdirSync(outputDir, { recursive: true });
copyFolder('game');
copyFolder('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`vitriol: wrote game/, screenshots/ and dossier.json (${dossier.length} bytes) to ${outputDir}`);
