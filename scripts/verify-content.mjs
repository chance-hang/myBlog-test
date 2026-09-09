import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const collections = { articles: 'article', notes: 'note', topics: 'topic' };
const fields = {
  articles: ['date', 'type', 'category', 'reading', 'title', 'summary', 'body', 'cover'],
  notes: ['date', 'label', 'category', 'text'],
  topics: ['title', 'status', 'date', 'text']
};
const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');
const match = source.match(/window\.blogContent\s*=\s*({[\s\S]*})\s*;/);
assert(match, 'content.js must retain its legacy content object');
const legacyJson = match[1]
  .replace(/([{,]\s*)([A-Za-z]\w*)\s*:/g, (_, prefix, key) => `${prefix}"${key}":`)
  .replace(/\x27((?:\\.|[^\x27\\])*)\x27/g, (_, value) => `"${value}"`);
const legacy = JSON.parse(legacyJson);
const content = JSON.parse(await readFile(new URL('../content.json', import.meta.url), 'utf8'));

assert.equal(content.schemaVersion, 1, 'schemaVersion must be 1');
assert.deepEqual(Object.keys(content).sort(), ['articles', 'notes', 'schemaVersion', 'topics']);
const seenIds = new Set();
for (const [collection, kind] of Object.entries(collections)) {
  assert.equal(content[collection].length, legacy[collection].length, `${collection} count changed`);
  content[collection].forEach((entry, index) => {
    assert.match(entry.id, new RegExp(`^${kind}_[0-7][0-9A-HJKMNP-TV-Z]{25}$`), `${collection}[${index}] has invalid ID`);
    assert(!seenIds.has(entry.id), `duplicate ID: ${entry.id}`);
    seenIds.add(entry.id);
    assert.deepEqual(Object.keys(entry).sort(), ['id', ...fields[collection]].sort(), `${collection}[${index}] fields changed`);
    const { id, ...migrated } = entry;
    assert.deepEqual(migrated, legacy[collection][index], `${collection}[${index}] differs from legacy`);
  });
}
console.log(`content.json verified: ${content.articles.length} articles, ${content.notes.length} notes, ${content.topics.length} topics`);
