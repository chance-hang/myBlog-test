import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import vm from 'node:vm';

const collections = { articles: 'article', notes: 'note', topics: 'topic' };
const fields = {
  articles: { required: ['id', 'date', 'type', 'category', 'reading', 'title', 'summary', 'body'], optional: ['cover', 'imageRefs'] },
  notes: { required: ['id', 'date', 'label', 'category', 'text'], optional: ['imageRefs'] },
  topics: { required: ['id', 'title', 'status', 'date', 'text'], optional: ['category', 'imageRefs'] }
};
const validateRecord = (entry, schema, kind, allowLegacy = false) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  const required = allowLegacy ? schema.required.filter(field => field !== 'id') : schema.required;
  const allowed = new Set([...required, ...schema.optional]);
  if (!Object.keys(entry).every(field => allowed.has(field)) || !required.every(field => typeof entry[field] === 'string' && entry[field])) return false;
  if (Object.hasOwn(entry, 'cover') && (typeof entry.cover !== 'string' || !entry.cover)) return false;
  if (Object.hasOwn(entry, 'category') && (typeof entry.category !== 'string' || !entry.category)) return false;
  if (Object.hasOwn(entry, 'imageRefs') && !Array.isArray(entry.imageRefs)) return false;
  return allowLegacy || new RegExp(`^${kind}_[0-7][0-9A-HJKMNP-TV-Z]{25}$`).test(entry.id);
};
const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');
const match = source.match(/window\.blogContent\s*=\s*({[\s\S]*})\s*;/);
assert(match, 'content.js must retain its legacy content object');
const legacyJson = match[1]
  .replace(/([{,]\s*)([A-Za-z]\w*)\s*:/g, (_, prefix, key) => `${prefix}"${key}":`)
  .replace(/\x27((?:\\.|[^\x27\\])*)\x27/g, (_, value) => `"${value}"`);
const legacy = JSON.parse(legacyJson);
const content = JSON.parse(await readFile(new URL('../content.json', import.meta.url), 'utf8'));
const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const resolverSource = appSource.slice(0, appSource.indexOf('const loadLegacyContent'));
assert(resolverSource.includes('window.resolveBlogContentItem'), 'app.js must expose the shared detail resolver');
const resolverContext = { window: {} };
vm.runInNewContext(resolverSource, resolverContext);
const { hydrateLegacyContent, resolveBlogContentItem } = vm.runInNewContext('({ hydrateLegacyContent, resolveBlogContentItem })', resolverContext);

assert.equal(content.schemaVersion, 1, 'schemaVersion must be 1');
assert.deepEqual(Object.keys(content).sort(), ['articles', 'notes', 'schemaVersion', 'topics']);
const seenIds = new Set();
for (const [collection, kind] of Object.entries(collections)) {
  assert.equal(content[collection].length, legacy[collection].length, `${collection} count changed`);
  content[collection].forEach((entry, index) => {
    assert(validateRecord(legacy[collection][index], fields[collection], kind, true), `${collection}[${index}] legacy fallback violates the compatibility protocol`);
    assert.match(entry.id, new RegExp(`^${kind}_[0-7][0-9A-HJKMNP-TV-Z]{25}$`), `${collection}[${index}] has invalid ID`);
    assert(!seenIds.has(entry.id), `duplicate ID: ${entry.id}`);
    seenIds.add(entry.id);
    assert(validateRecord(entry, fields[collection], kind), `${collection}[${index}] violates the content protocol`);
    const { id, ...migrated } = entry;
    assert.deepEqual(migrated, legacy[collection][index], `${collection}[${index}] differs from legacy`);
  });
}
const optionalVariant = structuredClone(content);
delete optionalVariant.articles[0].cover;
optionalVariant.articles[0].imageRefs = [];
optionalVariant.notes[0].imageRefs = [];
optionalVariant.topics[0].imageRefs = [];
optionalVariant.topics[0].category = 'ai';
for (const [collection, kind] of Object.entries(collections)) {
  optionalVariant[collection].forEach(entry => assert(validateRecord(entry, fields[collection], kind), `${collection} optional-field variant rejected`));
}
const unknownFieldVariant = structuredClone(content);
unknownFieldVariant.articles[0].unexpected = 'reject me';
assert(!validateRecord(unknownFieldVariant.articles[0], fields.articles, 'article'), 'unknown fields must be rejected');
const legacyFallback = hydrateLegacyContent(legacy);
for (const [collection, kind] of Object.entries(collections)) {
  content[collection].forEach((entry, index) => {
    const legacyUrl = `${kind}-${index}`;
    assert.equal(resolveBlogContentItem(content, legacyUrl), entry, `${legacyUrl} must resolve through JSON`);
    assert.equal(resolveBlogContentItem(legacyFallback, legacyUrl).id, entry.id, `${legacyUrl} must resolve through legacy fallback`);
    assert.equal(resolveBlogContentItem(content, entry.id), entry, `${entry.id} must resolve through JSON`);
    assert.equal(resolveBlogContentItem(legacyFallback, entry.id).id, entry.id, `${entry.id} must resolve through legacy fallback`);
  });
}
console.log(`content.json verified: ${content.articles.length} articles, ${content.notes.length} notes, ${content.topics.length} topics`);
