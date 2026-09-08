(() => {
  const match = new URLSearchParams(location.search).get('id')?.match(/^(article|topic|note)-(\d+)$/);
  const collections = { article: content.articles, topic: content.topics, note: content.notes };
  const item = match && collections[match[1]]?.[Number(match[2])];
  const heading = document.getElementById('post-heading');
  const body = document.getElementById('post-body');
  if (!item) {
    heading.innerHTML = '<h1>没有找到这篇记录</h1><p>这条链接可能已失效，你可以返回全部记录继续浏览。</p>';
    document.querySelector('.post-layout').hidden = true;
    return;
  }
  const title = item.title || item.label || '记录';
  document.title = `${title} · Chance`;
  heading.innerHTML = `<p class="post-meta">${esc(item.date)} <span>·</span> ${esc(item.type || item.status || '随记')}</p><h1>${esc(title)}</h1><p class="post-byline">Chance <span>·</span> ${esc(item.reading || '随笔')}</p>`;
  body.innerHTML = `${item.summary ? `<p class="post-lead" id="overview">${esc(item.summary)}</p>` : ''}${markdown(item.body || item.text || '')}`;
  const sections = [...body.querySelectorAll('h2,h3,h4')];
  if (!sections.length) {
    const first = body.firstElementChild;
    if (first) { first.id = 'section-1'; sections.push(first); }
  }
  const toc = document.getElementById('post-toc');
  toc.innerHTML = `${item.summary ? '<a href="#overview">内容提要</a>' : ''}` + sections.map((section, index) => {
    section.id = `section-${index + 1}`;
    return `<a href="#${section.id}">${esc(/^H[2-4]$/.test(section.tagName) ? section.textContent : '正文')}</a>`;
  }).join('');
  const links = [...toc.querySelectorAll('a')];
  const setActive = id => links.forEach(link => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  setActive(links[0]?.hash.slice(1));
  const targets = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  let queued = false;
  const update = () => {
    queued = false;
    let current = targets[0];
    for (const target of targets) if (target.getBoundingClientRect().top <= 160) current = target;
    if (current) setActive(current.id);
  };
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  const disclosure = document.querySelector('.post-toc');
  const mobile = matchMedia('(max-width:760px)');
  disclosure.open = !mobile.matches;
  mobile.addEventListener('change', () => { disclosure.open = !mobile.matches; });
  toc.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (mobile.matches) disclosure.open = false;
    setActive(link.hash.slice(1));
  });
})();
