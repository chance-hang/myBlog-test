/* myBlog-test — Markdown renderer verification.
 *
 * Phase 1 (Node, static contract): pinned vendor versions and the single renderer entry point.
 * Phase 2 (real browser, behavior): a local static server + the standalone fixture page
 *   `scripts/markdown-renderer-browser-test.html` really execute `window.blogMarkdown()`
 *   and `reader.js`; the page posts its assertions back to the server, so this script never
 *   depends on a browser CLI writing results to stdout.
 *
 * If no Chromium based browser can be launched, the command FAILS (never silently passes)
 * and points at the fixture page for manual acceptance.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, rm } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_PATH = '/scripts/markdown-renderer-browser-test.html';
const REPORT_PATH = '/__markdown-renderer-report';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8' };
const BROWSERS = [
  process.env.MYBLOG_TEST_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].filter(Boolean);

/* ---------- Phase 1: static contract ---------- */
const [appSource, readerSource, notices] = await Promise.all([
  readFile(join(ROOT, 'app.js'), 'utf8'),
  readFile(join(ROOT, 'reader.js'), 'utf8'),
  readFile(join(ROOT, 'vendor', 'THIRD_PARTY_NOTICES.md'), 'utf8')
]);
assert.match(notices, /marked \| 18\.0\.7/, 'vendor notices must pin marked 18.0.7');
assert.match(notices, /DOMPurify \| 3\.4\.14/, 'vendor notices must pin DOMPurify 3.4.14');
assert.ok(appSource.includes('window.marked.parse'), 'app.js must use marked.parse');
assert.ok(appSource.includes('DOMPurify.sanitize'), 'app.js must sanitize parser output');
assert.ok(appSource.includes('safeUrl'), 'app.js must apply a URL policy');
assert.equal((appSource.match(/window\.blogMarkdown\s*=/g) || []).length, 1, 'exactly one shared Markdown entry point');
assert.ok(readerSource.includes('window.blogMarkdown'), 'reader.js must use the shared renderer');
assert.ok(/h1\s*,\s*h2\s*,\s*h3\s*,\s*h4\s*,\s*h5\s*,\s*h6/.test(readerSource), 'reader.js anchors h1-h6');
assert.ok(/['"]h2,h3,h4['"]|h2\s*,\s*h3\s*,\s*h4/.test(readerSource), 'TOC collects h2-h4 only');
console.log('markdown renderer static contract: OK');

/* ---------- Phase 2: real browser behavior ---------- */
const server = createServer(async (request, response) => {
  const url = decodeURIComponent(request.url.split('?')[0]);
  if (request.method === 'POST') {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
      if (url === REPORT_PATH) settle({ ok: true, body });
    });
    return;
  }
  const clean = posix.normalize(url).replace(/^(\.\.(\/|$))+/, '');
  const file = resolve(ROOT, '.' + clean);
  if (!file.startsWith(ROOT)) { response.writeHead(403); response.end(); return; }
  try {
    const data = await readFile(file);
    response.writeHead(200, { 'content-type': TYPES[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
});

let settle;
const reported = new Promise(done => { settle = done; });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const port = server.address().port;
const pageUrl = `http://127.0.0.1:${port}${PAGE_PATH}`;

let browser = null;
for (const candidate of BROWSERS) {
  try { await readFile(candidate); browser = candidate; break; } catch { /* try next */ }
}
if (!browser) {
  server.close();
  console.error('markdown renderer browser behavior tests: FAIL');
  console.error('未找到可启动的 Chromium 浏览器。请手动用浏览器打开以下页面完成人工验收：');
  console.error(`  ${join(ROOT, 'scripts', 'markdown-renderer-browser-test.html')}`);
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'myblog-md-test-'));
const child = spawn(browser, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-extensions',
  `--user-data-dir=${profile}`,
  pageUrl
], { stdio: 'ignore', windowsHide: true });

const timer = setTimeout(() => settle({ ok: false, body: 'TIMEOUT' }), 30000);
const outcome = await reported;
clearTimeout(timer);
try { spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch { /* best effort */ }
await rm(profile, { recursive: true, force: true }).catch(() => {});
server.close();

if (!outcome.ok || outcome.body === 'TIMEOUT') {
  console.error('markdown renderer browser behavior tests: FAIL');
  console.error('浏览器未返回结果（可能启动失败或页面未上报）。请用浏览器手动打开以下页面完成人工验收：');
  console.error(`  ${join(ROOT, 'scripts', 'markdown-renderer-browser-test.html')}`);
  process.exit(1);
}

const payload = JSON.parse(outcome.body);
if (!payload.pass) {
  console.error(`markdown renderer browser behavior tests: FAIL (${payload.failedCount}/${payload.total})`);
  payload.failed.forEach(line => console.error('  - ' + line));
  process.exit(1);
}
console.log(`markdown renderer browser behavior tests: PASS (${payload.total}/${payload.total} assertions, real window.blogMarkdown + reader.js)`);
