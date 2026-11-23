// Takes the entry's screenshots with headless Chrome over the DevTools protocol.
// Usage: node tools/capture-shots.mjs [baseUrl] [outDir]   (serve game/ first with node serve.ts)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = process.argv[2] || 'http://localhost:8080/';
const outDir = process.argv[3] || 'screenshots';
const SHOTS = [
  { file: '1-duel-table.jpg', query: 'shot=table&seed=1961' },
  { file: '2-title.jpg', query: 'shot=title' },
  { file: '3-victory.jpg', query: 'shot=win&seed=3' },
  { file: '4-defeat.jpg', query: 'shot=loss&seed=5' },
];
const MAX_BYTES = 250 * 1024;
const port = 9333;
const profile = join(tmpdir(), `vitriol-chrome-${Date.now()}`);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,800',
  '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageSocket() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('chrome did not start');
}

const ws = new WebSocket(await pageSocket());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const waiting = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const id = nextId++;
  waiting.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
mkdirSync(outDir, { recursive: true });
for (const shot of SHOTS) {
  await send('Page.navigate', { url: `${base}?${shot.query}` });
  await sleep(1800);
  const errs = await send('Runtime.evaluate', { expression: 'document.getElementById("stage").children.length' });
  let quality = 92;
  let bytes;
  for (;;) {
    const res = await send('Page.captureScreenshot', { format: 'jpeg', quality, clip: { x: 0, y: 0, width: 1280, height: 800, scale: 1 } });
    bytes = Buffer.from(res.result.data, 'base64');
    if (bytes.length <= MAX_BYTES || quality <= 40) break;
    quality -= 6;
  }
  writeFileSync(join(outDir, shot.file), bytes);
  console.log(`${shot.file}: ${bytes.length} bytes, q${quality}, stage children ${errs.result?.result?.value}`);
}
ws.close();
chrome.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* chrome may still hold it */ }
