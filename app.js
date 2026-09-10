const contentKinds = { articles: 'article', notes: 'note', topics: 'topic' };
const contentFields = {
  articles: { required: ['id', 'date', 'type', 'category', 'reading', 'title', 'summary', 'body'], optional: ['cover', 'imageRefs'] },
  notes: { required: ['id', 'date', 'label', 'category', 'text'], optional: ['imageRefs'] },
  topics: { required: ['id', 'title', 'status', 'date', 'text'], optional: ['category', 'imageRefs'] }
};
const isContentRecord = (record, schema, kind, allowLegacy = false) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  const required = allowLegacy ? schema.required.filter(field => field !== 'id') : schema.required;
  const allowed = new Set([...required, ...schema.optional]);
  if (!Object.keys(record).every(field => allowed.has(field)) || !required.every(field => typeof record[field] === 'string' && record[field])) return false;
  if (Object.hasOwn(record, 'cover') && (typeof record.cover !== 'string' || !record.cover)) return false;
  if (Object.hasOwn(record, 'category') && (typeof record.category !== 'string' || !record.category)) return false;
  if (Object.hasOwn(record, 'imageRefs') && !Array.isArray(record.imageRefs)) return false;
  return allowLegacy || new RegExp(`^${kind}_[0-7][0-9A-HJKMNP-TV-Z]{25}$`).test(record.id);
};
const validateContent = (candidate, allowLegacy = false) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Invalid content payload');
  if (!allowLegacy && (candidate.schemaVersion !== 1 || Object.keys(candidate).length !== 4)) throw new Error('Unsupported content schema');
  const ids = new Set();
  Object.entries(contentKinds).forEach(([collection, kind]) => {
    const records = candidate[collection];
    if (!Array.isArray(records) || !records.length) throw new Error(`Invalid ${collection}`);
    records.forEach(record => {
      if (!isContentRecord(record, contentFields[collection], kind, allowLegacy)) throw new Error(`Invalid ${kind} record`);
      if (!allowLegacy && (ids.has(record.id) || ids.add(record.id) === false)) throw new Error('Duplicate content ID');
    });
  });
  return candidate;
};
const legacyStableIds = {
  articles: ['article_01J00000000000000000000001', 'article_01J00000000000000000000002', 'article_01J00000000000000000000003', 'article_01J00000000000000000000004', 'article_01J00000000000000000000005', 'article_01J00000000000000000000006', 'article_01J00000000000000000000007', 'article_01J00000000000000000000008', 'article_01J00000000000000000000009'],
  notes: ['note_01J00000000000000000000001', 'note_01J00000000000000000000002', 'note_01J00000000000000000000003', 'note_01J00000000000000000000004', 'note_01J00000000000000000000005', 'note_01J00000000000000000000006', 'note_01J00000000000000000000007', 'note_01J00000000000000000000008', 'note_01J00000000000000000000009', 'note_01J0000000000000000000000A'],
  topics: ['topic_01J00000000000000000000001', 'topic_01J00000000000000000000002', 'topic_01J00000000000000000000003', 'topic_01J00000000000000000000004']
};
const hydrateLegacyContent = candidate => {
  const hydrated = { ...candidate };
  Object.entries(contentKinds).forEach(([collection]) => {
    const ids = legacyStableIds[collection];
    if (!Array.isArray(ids) || ids.length !== candidate[collection].length) throw new Error(`Missing legacy ID mapping for ${collection}`);
    hydrated[collection] = candidate[collection].map((entry, index) => ({ ...entry, id: ids[index] }));
  });
  return hydrated;
};
const resolveBlogContentItem = (candidate, id) => {
  const legacyMatch = id.match(/^(article|topic|note)-(\d+)$/);
  const stableMatch = id.match(/^(article|topic|note)_[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
  const collections = { article: candidate.articles, topic: candidate.topics, note: candidate.notes };
  return stableMatch
    ? collections[stableMatch[1]]?.find(entry => entry.id === id)
    : legacyMatch && collections[legacyMatch[1]]?.[Number(legacyMatch[2])];
};
window.resolveBlogContentItem = resolveBlogContentItem;
const loadLegacyContent = () => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = './content.js?v=cover-1';
  script.onload = () => {
    try { resolve(hydrateLegacyContent(validateContent(window.blogContent, true))); } catch (error) { reject(error); }
  };
  script.onerror = () => reject(new Error('Legacy content unavailable'));
  document.head.append(script);
});
window.blogContentReady = fetch('./content.json', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error(`content.json request failed: ${response.status}`);
    return response.json();
  })
  .then(payload => {
    window.blogContent = validateContent(payload);
    window.blogContentSource = 'json';
    return window.blogContent;
  })
  .catch(() => loadLegacyContent().then(payload => {
    window.blogContent = payload;
    window.blogContentSource = 'legacy';
    return payload;
  }));

window.blogContentReady.then(content => {
const loader = document.querySelector('.site-loader');
if (loader) {
  let loaderRemovalTimer;
  const dismissLoader = (skip = false) => {
    if (!loader.isConnected) return;
    if (skip) loader.classList.add('is-skipped');
    document.body.classList.remove('is-loading');
    window.clearTimeout(loaderRemovalTimer);
    loaderRemovalTimer = window.setTimeout(() => {
      loader.setAttribute('aria-hidden', 'true');
      loader.remove();
    }, skip ? 480 : 2800);
  };
  loader.querySelector('.loader-skip')?.addEventListener('click', () => dismissLoader(true));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) dismissLoader(true);
  else if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', () => dismissLoader(), { once: true });
}

document.querySelectorAll('.star-field').forEach((starCanvas, canvasIndex) => {
  const starContext = starCanvas.getContext('2d');
  const reduceStars = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const starRgb = getComputedStyle(document.documentElement).getPropertyValue('--star-rgb').trim() || '244,244,241';
  const stars = Array.from({ length: 24 }, (_, index) => ({
    x: ((index * 37 + 11 + canvasIndex * 17) % 97) / 97,
    y: ((index * 53 + 7 + canvasIndex * 23) % 89) / 89,
    radius: index % 6 === 0 ? 1.7 : index % 3 === 0 ? 1.05 : .7,
    phase: index * 1.73 + canvasIndex * .61,
    glow: index % 5 === 0 ? 1 : .5
  }));
  let starWidth = 0;
  let starHeight = 0;
  let lastStarFrame = 0;
  const drawStars = time => {
    starContext.clearRect(0, 0, starWidth, starHeight);
    stars.forEach(star => {
      const x = star.x * starWidth + Math.sin(time * .00055 + star.phase) * 20;
      const y = star.y * starHeight + Math.cos(time * .0004 + star.phase) * 15;
      const alpha = .3 + star.glow * (.25 + Math.sin(time * .0017 + star.phase) * .1);
      starContext.beginPath();
      starContext.arc(x, y, star.radius, 0, Math.PI * 2);
      starContext.fillStyle = `rgba(${starRgb},${alpha})`;
      starContext.shadowColor = `rgba(${starRgb},.58)`;
      starContext.shadowBlur = star.glow ? 7 : 0;
      starContext.fill();
    });
    starContext.shadowBlur = 0;
  };
  const sizeStars = () => {
    const bounds = starCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    starWidth = bounds.width;
    starHeight = bounds.height;
    starCanvas.width = Math.round(starWidth * ratio);
    starCanvas.height = Math.round(starHeight * ratio);
    starContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawStars(0);
  };
  const animateStars = time => {
    if (time - lastStarFrame > 32) {
      drawStars(time);
      lastStarFrame = time;
    }
    requestAnimationFrame(animateStars);
  };
  sizeStars();
  new ResizeObserver(sizeStars).observe(starCanvas);
  if (!reduceStars) requestAnimationFrame(animateStars);
});
const isProductionHost = /myblog-prod/i.test(location.hostname + location.pathname);
if (isProductionHost) {
  document.title = document.title.replace('（测试库）', '');
  const envLabel = document.querySelector('.env-label');
  if (envLabel) envLabel.textContent = 'LIVE';
}
const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const inline = value => esc(value)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    if (/^(javascript|data|vbscript):/i.test(src)) return esc(`![${alt}](${src})`);
    return `<img src="${src.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" class="post-image">`;
  })
  .replace(/`([^`]+)`/g, '<code>$1</code>');
const markdown = (value = '') => value.split(/\n{2,}/).map(block => {
  if (/^[-*] /m.test(block)) return `<ul>${block.split('\n').filter(Boolean).map(line => `<li>${inline(line.replace(/^[-*] /, ''))}</li>`).join('')}</ul>`;
  if (/^\d+\. /m.test(block)) return `<ol>${block.split('\n').filter(Boolean).map(line => `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
  if (/^> /.test(block)) return `<blockquote>${inline(block.replace(/^> /, ''))}</blockquote>`;
  const heading = block.match(/^##\s+(.+)/);
  if (heading) return `<h3>${inline(heading[1])}</h3>${block.split('\n').slice(1).filter(Boolean).map(line => `<p>${inline(line)}</p>`).join('')}`;
  return block.split('\n').filter(Boolean).map(line => `<p>${inline(line)}</p>`).join('');
}).join('');
window.blogEsc = esc;
window.blogMarkdown = markdown;

document.querySelectorAll('.inner-header nav a').forEach(link => {
  const page = document.body.dataset.page;
  const navLabels = { './articles.html': '项目 <small>Projects</small>', './topics.html': 'AI <small>Notes</small>', './notes.html': '生活 <small>Life</small>', './about.html': '关于 <small>About</small>' };
  link.innerHTML = navLabels[link.getAttribute('href')] || link.textContent;
  if (link.getAttribute('href') === `./${page}.html`) link.setAttribute('aria-current', 'page');
});

const categoryNames = { project: '项目', ai: 'AI', life: '生活' };
const articleItems = content.articles.map((item, sourceIndex) => ({ ...item, sourceIndex, kind: 'article', excerpt: item.summary || '' }));
const topicItems = content.topics.map((item, sourceIndex) => ({ ...item, sourceIndex, kind: 'topic', category: 'ai', excerpt: (item.text || '').split('\n')[0] }));
const noteItems = content.notes.map((item, sourceIndex) => ({ ...item, sourceIndex, kind: 'note', title: item.label, excerpt: (item.text || '').split('\n')[0], reading: '片刻' }));
const newestFirst = items => [...items].sort((a, b) => String(b.date).replace(/\D/g, '').localeCompare(String(a.date).replace(/\D/g, '')));
const cardMarkup = (item, index) => {
  const meta = `<span class="journal-meta"><time>${esc(item.date)}</time><b>${esc(item.reading || item.status || item.type || '记录')}</b><em>${esc(categoryNames[item.category] || '记录')}</em></span>`;
  const art = item.cover
    ? `<span class="journal-art journal-art-cover"><img class="journal-cover" src="${esc(item.cover)}" alt="">${meta}</span>`
    : `<span class="journal-art journal-art-${esc(item.category)} journal-art-${index % 4}"><i aria-hidden="true"></i>${meta}</span>`;
  return `<article class="journal-card journal-card-${index + 1}${item.cover ? ' has-cover' : ''}">
  <a href="./post.html?id=${item.id || `${item.kind}-${item.sourceIndex}`}">
    ${art}
    <strong>${esc(item.title || item.label)}</strong>
    <span class="journal-excerpt">${esc(item.excerpt)}</span>
    <span class="journal-arrow" aria-hidden="true">↗</span>
  </a>
</article>`;
};
const renderCardGrid = (root, items, limit = Infinity) => {
  root.innerHTML = items.slice(0, limit).map(cardMarkup).join('');
  root.classList.remove('is-refreshing');
  requestAnimationFrame(() => root.classList.add('is-refreshing'));
};

const articleRoot = document.querySelector('#all-articles');
if (articleRoot) renderCardGrid(articleRoot, newestFirst([...articleItems.filter(item => item.category === 'project'), ...noteItems.filter(item => item.category === 'project')]));
const topicRoot = document.querySelector('#all-topics');
if (topicRoot) renderCardGrid(topicRoot, newestFirst([...topicItems, ...articleItems.filter(item => item.category === 'ai'), ...noteItems.filter(item => item.category === 'ai')]));
const noteRoot = document.querySelector('#all-notes');
if (noteRoot) renderCardGrid(noteRoot, newestFirst([...articleItems.filter(item => item.category === 'life'), ...noteItems.filter(item => item.category === 'life')]));

const journalRoot = document.querySelector('#journal-posts');
if (journalRoot) {
  const sortedItems = newestFirst([...articleItems, ...topicItems, ...noteItems]);
  const featuredItem = articleItems[0];
  const journalItems = [featuredItem, ...sortedItems.filter(item => item !== featuredItem)];
  const renderJournal = (filter = 'all') => renderCardGrid(journalRoot, journalItems.filter(item => filter === 'all' || item.category === filter), 9);
  renderJournal();
  document.querySelectorAll('[data-journal-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-journal-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderJournal(button.dataset.journalFilter);
  }));
}

});

document.querySelectorAll('.entry').forEach(item => item.addEventListener('toggle', () => {
  const mark = item.querySelector('summary b');
  if (mark) mark.textContent = item.open ? '−' : '＋';
}));

if (/^#entry-(article|topic|note)-\d+$/.test(location.hash)) {
  location.replace(`./post.html?id=${location.hash.slice(7)}`);
} else if (location.hash) {
  const targetEntry = document.getElementById(location.hash.slice(1));
  if (targetEntry instanceof HTMLDetailsElement) {
    targetEntry.open = true;
    targetEntry.querySelector('summary b')?.replaceChildren('−');
    requestAnimationFrame(() => targetEntry.scrollIntoView({ block: 'start' }));
  }
}

const drawers = [...document.querySelectorAll('.home-drawer')];
let drawerOpener = null;
const closeDrawer = drawer => {
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.inert = true;
  document.body.classList.remove('drawer-open');
  if (drawerOpener) drawerOpener.focus();
};
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  const drawer = document.getElementById(button.dataset.open);
  if (!drawer) return;
  drawerOpener = button;
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
  requestAnimationFrame(() => {
    drawer.classList.add('is-open');
    drawer.querySelector('[data-close]')?.focus();
  });
}));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDrawer(button.closest('.home-drawer'))));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer(drawers.find(drawer => drawer.classList.contains('is-open')));
});

const rotatingWord = document.querySelector('.rotating-word');
if (rotatingWord && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const words = ['项目现场', 'AI 实践', '生活片段'];
  let wordIndex = 0;
  setInterval(() => {
    rotatingWord.classList.add('is-changing');
    setTimeout(() => {
      wordIndex = (wordIndex + 1) % words.length;
      rotatingWord.textContent = words[wordIndex];
      rotatingWord.classList.remove('is-changing');
    }, 220);
  }, 2800);
}
