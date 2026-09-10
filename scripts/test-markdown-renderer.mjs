import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const reader = await readFile(new URL('../reader.js', import.meta.url), 'utf8');
const vendor = await readFile(new URL('../vendor/THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');
for (const token of ['window.marked.parse', 'DOMPurify.sanitize', 'safeUrl', 'javascript', 'data', 'vbscript']) assert.ok(app.includes(token), token);
for (const token of ['h1,h2,h3,h4,h5,h6', 'h2,h3,h4', 'resolveBlogContentItem']) assert.ok((reader + app).includes(token), token);
assert.match(vendor, /marked \| 18\.0\.7/); assert.match(vendor, /DOMPurify \| 3\.4\.14/);
console.log('markdown renderer static security and compatibility contract: OK');
