/**
 * Browser end-to-end test for the example app (web export).
 *
 * Drives the real swiper with mouse drags and button clicks in headless
 * Chromium, and asserts on the callbacks the example logs to the console.
 *
 *   bun run example expo export --platform web   # builds example/dist
 *   bun run test:e2e [distDir]
 *
 * Environment:
 *   E2E_SCREENSHOTS  directory to write a screenshot per step (optional)
 *   E2E_CHROMIUM     path to a Chromium binary (optional; defaults to
 *                    the one installed by `playwright install chromium`)
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.resolve(
  process.argv[2] ?? path.join(root, 'example/dist')
);
const screenshotDir = process.env.E2E_SCREENSHOTS;

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};
const SETTLE_MS = 2600; // default spring takes ~2s to finish
const STEP_TIMEOUT_MS = 10_000;
const CARD = { x: 200, y: 330 };

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error(`No web export found in ${distDir}. Run the web export first.`);
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = http.createServer((req, res) => {
  const requested = path.join(
    distDir,
    decodeURIComponent(req.url.split('?')[0])
  );
  const safe = requested.startsWith(distDir) ? requested : distDir;
  const file =
    fs.existsSync(safe) && fs.statSync(safe).isFile()
      ? safe
      : path.join(distDir, 'index.html');
  res.writeHead(200, {
    'Content-Type':
      CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
  });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({
  executablePath: process.env.E2E_CHROMIUM || undefined,
});
const page = await browser.newPage({ viewport: { width: 400, height: 800 } });

const logs = [];
const errors = [];
page.on('console', (message) => {
  const text = message.text();
  // onSwipeActive fires on every frame of a drag
  if (!text.includes('onSwipeActive')) logs.push(text);
  if (message.type() === 'error') errors.push(text);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

const results = [];
// Anything that means "the deck moved"
const MOVED =
  /onSwipe(Left|Right|Top|Bottom) |Current Active index|onSwipedAll/;

async function step(name, action, expected = []) {
  const from = logs.length;
  await action();

  let got;
  if (expected.length === 0) {
    // Nothing should happen: wait for any (wrong) animation to finish
    await sleep(SETTLE_MS);
    got = logs.slice(from);
  } else {
    const deadline = Date.now() + STEP_TIMEOUT_MS;
    do {
      await sleep(100);
      got = logs.slice(from);
    } while (
      Date.now() < deadline &&
      !expected.every((text) => got.some((line) => line.includes(text)))
    );
  }

  const missing = expected.filter(
    (text) => !got.some((line) => line.includes(text))
  );
  const unexpected =
    expected.length === 0 ? got.filter((line) => MOVED.test(line)) : [];
  results.push({
    name,
    ok: !missing.length && !unexpected.length,
    missing,
    unexpected,
    got,
  });

  if (screenshotDir) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const file = `${String(results.length).padStart(2, '0')}-${name.replace(/\W+/g, '_')}.png`;
    await page.screenshot({ path: path.join(screenshotDir, file) });
  }
  // Let the card/index animations finish before the next step
  await sleep(expected.length ? SETTLE_MS : 0);
}

async function drag(dx, dy, steps = 25, from = CARD) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    await sleep(16);
  }
  await page.mouse.up();
}

async function load() {
  await page.goto(url);
  await page.waitForSelector('[role="button"]', { timeout: STEP_TIMEOUT_MS });
  await sleep(1500);
}

let buttons = [];
async function findButtons() {
  // Action row, left to right: flip, back, left, bottom, top, right
  buttons = await page.$$eval('[role="button"],[tabindex="0"]', (elements) =>
    elements
      .map((el) => el.getBoundingClientRect())
      .map((r) => ({
        x: r.x + r.width / 2,
        y: r.y + r.height / 2,
        w: r.width,
        h: r.height,
      }))
      .filter((b) => b.w > 30 && b.w < 80 && b.y > 600)
      .sort((a, b) => a.x - b.x)
  );
  if (buttons.length !== 6) {
    throw new Error(`Expected 6 action buttons, found ${buttons.length}`);
  }
}
const [FLIP, BACK, LEFT, BOTTOM, TOP, RIGHT] = [0, 1, 2, 3, 4, 5];
const press = (i) => page.mouse.click(buttons[i].x, buttons[i].y);

let fatal;
try {
  await load();
  await findButtons();

  await step('tap card -> onPress', () => page.mouse.click(CARD.x, CARD.y), [
    'onPress',
  ]);
  await step('short drag below threshold springs back', () => drag(40, 0));
  await step('drag right -> onSwipeRight', () => drag(180, 7), [
    'cardIndex 3',
    'Current Active index 4',
  ]);
  await step('drag left -> onSwipeLeft', () => drag(-180, 7), [
    'onSwipeLeft 4',
    'Current Active index 5',
  ]);
  await step('swipeBack button -> index 4', () => press(BACK), [
    'Current Active index 4',
  ]);
  await step('drag up -> onSwipeTop', () => drag(0, -320), [
    'onSwipeTop 4',
    'Current Active index 5',
  ]);
  await step('swipeBack button -> index 4 again', () => press(BACK), [
    'Current Active index 4',
  ]);
  await step('flip button', () => press(FLIP));
  await step('flip button back', () => press(FLIP));
  await step('right button -> onSwipeRight', () => press(RIGHT), [
    'cardIndex 4',
    'Current Active index 5',
  ]);
  await step(
    'swipeBack x2 -> index 3',
    async () => {
      await press(BACK);
      await sleep(900);
      await press(BACK);
    },
    ['Current Active index 3']
  );
  await step(
    'swipeBack through restored swipes -> 2, 1, 0',
    async () => {
      for (let i = 0; i < 3; i++) {
        await press(BACK);
        await sleep(900);
      }
    },
    [
      'Current Active index 2',
      'Current Active index 1',
      'Current Active index 0',
    ]
  );
  await step('swipeBack at the first card is a no-op', () => press(BACK));
  await step('drag down -> onSwipeBottom', () => drag(0, 330), [
    'onSwipeBottom 0',
    'Current Active index 1',
  ]);
  await step(
    'left/bottom/top/right buttons -> cards 1-4',
    async () => {
      for (const i of [LEFT, BOTTOM, TOP, RIGHT]) {
        await press(i);
        await sleep(900);
      }
    },
    ['onSwipeLeft 1', 'onSwipeBottom 2', 'onSwipeTop 3', 'cardIndex 4']
  );
  await step('drag right on the last card -> onSwipedAll', () => drag(180, 7), [
    'cardIndex 5',
    'onSwipedAll',
  ]);

  // Regression: perfectly horizontal drags (mouse/trackpad, dy === 0)
  await load();
  await step(
    'exact horizontal drag right -> onSwipeRight',
    () => drag(180, 0),
    ['cardIndex 3']
  );
  await step('fast short flick without a velocity threshold springs back', () =>
    drag(60, 0, 3)
  );
  // Swipe card 4 left, then grab card 5 while card 4 is still flying off
  // over it: the outgoing card must not swallow the touch.
  await step(
    'exact horizontal drag left, then grab the next card mid-fly-off',
    async () => {
      await drag(-180, 0);
      await sleep(50);
      await drag(180, 0, 25, { x: CARD.x - 120, y: CARD.y });
    },
    ['onSwipeLeft 4', 'cardIndex 5']
  );
} catch (error) {
  fatal = error;
} finally {
  await browser.close();
  server.close();
}

for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}`);
  if (!r.ok) {
    if (r.missing.length)
      console.log(`     missing: ${JSON.stringify(r.missing)}`);
    if (r.unexpected.length)
      console.log(`     unexpected: ${JSON.stringify(r.unexpected)}`);
    console.log(`     logs: ${JSON.stringify(r.got)}`);
  }
}
if (errors.length)
  console.log(`Console errors:\n${errors.map((e) => `  ${e}`).join('\n')}`);
if (fatal) console.error(fatal);

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} steps passed`);
process.exit(fatal || errors.length || passed !== results.length ? 1 : 0);
