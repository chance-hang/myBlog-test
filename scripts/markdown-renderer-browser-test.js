/* myBlog-test — Markdown renderer behavior fixtures (test-only, no real content).
 * This file is loaded as an external script so literal HTML tags in fixtures are
 * never parsed by the HTML parser. It must not touch content.json / content.js. */

const FIXTURE_BODY = [
  '# 一级标题',
  '',
  '正文段落。',
  '',
  '## 二级标题',
  '',
  '### 三级标题',
  '',
  '#### 四级标题',
  '',
  '##### 五级标题',
  '',
  '###### 六级标题',
  '',
  '## 二级标题'
].join('\n');

const FIXTURE_ARTICLE_ID = 'article_01J00000000000000000000001';
const FIXTURE_NOTE_ID = 'note_01J00000000000000000000001';
const FIXTURE_TOPIC_ID = 'topic_01J00000000000000000000001';

/* Minimal payload that passes app.js validateContent, used to boot app.js without
 * reading real content.json. */
window.markdownRendererFixtureContent = {
  schemaVersion: 1,
  articles: [{
    id: FIXTURE_ARTICLE_ID,
    date: '2026-09-10',
    type: '项目',
    category: 'project',
    reading: '3 分钟',
    title: 'Fixture 标题',
    summary: 'Fixture 摘要',
    body: FIXTURE_BODY
  }],
  notes: [{
    id: FIXTURE_NOTE_ID,
    date: '2026-09-10',
    label: 'Fixture 短记',
    category: 'life',
    text: FIXTURE_BODY
  }],
  topics: [{
    id: FIXTURE_TOPIC_ID,
    title: 'Fixture 专题',
    status: '进行中',
    date: '2026-09-10',
    text: FIXTURE_BODY
  }]
};

/* Renderer behavior cases: input Markdown -> asserts on the final HTML string.
 * contains: literal substrings that must appear.
 * forbids: regexp sources that must NOT match (case-insensitive). */
window.markdownRendererRenderCases = [
  { name: 'heading h1-h6', input: '# a\n## b\n### c\n#### d\n##### e\n###### f', contains: ['<h1>a</h1>', '<h2>b</h2>', '<h3>c</h3>', '<h4>d</h4>', '<h5>e</h5>', '<h6>f</h6>'], forbids: [] },
  { name: 'paragraph', input: 'first\n\nsecond', contains: ['<p>first</p>', '<p>second</p>'], forbids: [] },
  { name: 'strong', input: '**b**', contains: ['<strong>b</strong>'], forbids: [] },
  { name: 'emphasis', input: '*e*', contains: ['<em>e</em>'], forbids: [] },
  { name: 'strikethrough', input: '~~d~~', contains: ['<del>d</del>'], forbids: [] },
  { name: 'unordered list', input: '- u1\n- u2', contains: ['<ul>', '<li>u1</li>', '<li>u2</li>'], forbids: [] },
  { name: 'ordered list', input: '1. o1\n2. o2', contains: ['<ol>', '<li>o1</li>', '<li>o2</li>'], forbids: [] },
  { name: 'blockquote', input: '> q', contains: ['<blockquote>', '<p>q</p>'], forbids: [] },
  { name: 'inline code', input: '`c`', contains: ['<code>c</code>'], forbids: [] },
  { name: 'fenced code block', input: '```js\nconst a = 1;\n```', contains: ['<pre><code', 'language-js'], forbids: [] },
  { name: 'horizontal rule', input: 'a\n\n---\n\nb', contains: ['<hr>'], forbids: [] },
  { name: 'image (relative asset)', input: '![rel](./assets/covers/cover-0.png)', contains: ['<img', 'src="./assets/covers/cover-0.png"', 'alt="rel"'], forbids: [] },
  { name: 'external link gets target + rel', input: '[ok](https://example.com/a?b=1)', contains: ['href="https://example.com/a?b=1"', 'target="_blank"', 'rel="noopener noreferrer"'], forbids: [] },
  { name: 'http link allowed', input: '[ok](http://example.com/a)', contains: ['href="http://example.com/a"', 'rel="noopener noreferrer"'], forbids: [] },
  { name: 'mailto allowed for link only', input: '[mail](mailto:a@b.example)', contains: ['href="mailto:a@b.example"'], forbids: ['target="_blank"'] },
  { name: 'relative link allowed', input: '[rel](./post.html?id=1)', contains: ['href="./post.html?id=1"'], forbids: ['target="_blank"'] },
  { name: 'root-relative link allowed', input: '[root](/assets/a.png)', contains: ['href="/assets/a.png"'], forbids: [] },
  { name: 'anchor link allowed', input: '[anchor](#overview)', contains: ['href="#overview"'], forbids: [] },

  { name: 'raw <script> rejected', input: '<script>alert(1)</script>', contains: [], forbids: ['<script', 'alert(1)'] },
  { name: 'event handler attribute rejected', input: '<a href="/localx" onclick="alert(1)">y</a>', contains: ['<a', 'href="/localx"'], forbids: ['onclick', 'alert(1)'] },
  { name: 'img onerror rejected', input: '<img src=x onerror=alert(1)>', contains: ['<img'], forbids: ['onerror', 'alert(1)'] },
  { name: 'iframe rejected', input: '<iframe src="https://evil.example.com"></iframe>', contains: [], forbids: ['<iframe', 'evil.example.com'] },
  { name: 'svg rejected', input: '<svg><script>alert(1)</script></svg>', contains: [], forbids: ['<svg', '<script', 'alert(1)'] },
  { name: 'style rejected', input: '<style>body{display:none}</style>', contains: [], forbids: ['<style', 'display:none'] },
  { name: 'form rejected', input: '<form action="/steal"><input name=a></form>', contains: [], forbids: ['<form', '<input', 'action='] },
  { name: 'javascript: link rejected', input: '[click](javascript:alert(1))', contains: ['click'], forbids: ['javascript', 'href='] },
  { name: 'javascript: mixed case rejected', input: '[click](JaVaScRiPt:alert(1))', contains: ['click'], forbids: ['javascript', 'href='] },
  { name: 'javascript: leading whitespace rejected', input: '[click](   javascript:alert(1))', contains: ['click'], forbids: ['javascript', 'href='] },
  { name: 'javascript: percent encoded rejected', input: '[click](%6a%61%76%61%73%63%72%69%70%74:alert(1))', contains: ['click'], forbids: ['javascript', 'href='] },
  { name: 'javascript: html entity rejected', input: '[click](&#106;avascript:alert(1))', contains: ['click'], forbids: ['javascript', 'href='] },
  { name: 'data: link rejected', input: '[click](data:text/html,x)', contains: ['click'], forbids: ['data:', 'href='] },
  { name: 'vbscript: link rejected', input: '[click](vbscript:msgbox(1))', contains: ['click'], forbids: ['vbscript', 'href='] },
  { name: 'file: link rejected', input: '[f](file:///C:/Windows/win.ini)', contains: [], forbids: ['file:', 'href='] },
  { name: 'javascript: image rejected', input: '![x](javascript:alert(1))', contains: [], forbids: ['<img', 'javascript'] },
  { name: 'data: image rejected', input: '![x](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)', contains: [], forbids: ['<img', 'data:'] },
  { name: 'mailto image rejected', input: '![x](mailto:a@b.example)', contains: [], forbids: ['<img', 'mailto'] }
];

/* Stable-id / legacy-id resolution cases (pure functions from app.js). */
window.markdownRendererResolveCases = [
  { name: 'legacy article-0 resolves to first article', id: 'article-0', expectId: FIXTURE_ARTICLE_ID },
  { name: 'legacy note-0 resolves to first note', id: 'note-0', expectId: FIXTURE_NOTE_ID },
  { name: 'legacy topic-0 resolves to first topic', id: 'topic-0', expectId: FIXTURE_TOPIC_ID },
  { name: 'stable article id resolves', id: FIXTURE_ARTICLE_ID, expectId: FIXTURE_ARTICLE_ID },
  { name: 'stable note id resolves', id: FIXTURE_NOTE_ID, expectId: FIXTURE_NOTE_ID },
  { name: 'stable topic id resolves', id: FIXTURE_TOPIC_ID, expectId: FIXTURE_TOPIC_ID }
];

/* reader.js cases: one per content kind, all sharing the same renderer output
 * and the same heading/TOC protocol. */
window.markdownRendererReaderCases = [
  {
    kind: 'article',
    id: FIXTURE_ARTICLE_ID,
    headingIds: ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题', '二级标题-2'],
    toc: ['overview', '二级标题', '三级标题', '四级标题', '二级标题-2'],
    contains: ['<h2 id="二级标题">二级标题</h2>', '<h6 id="六级标题">六级标题</h6>']
  },
  {
    kind: 'note',
    id: FIXTURE_NOTE_ID,
    headingIds: ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题', '二级标题-2'],
    toc: ['二级标题', '三级标题', '四级标题', '二级标题-2'],
    contains: ['<h2 id="二级标题">二级标题</h2>', '<h6 id="六级标题">六级标题</h6>']
  },
  {
    kind: 'topic',
    id: FIXTURE_TOPIC_ID,
    headingIds: ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题', '二级标题-2'],
    toc: ['二级标题', '三级标题', '四级标题', '二级标题-2'],
    contains: ['<h2 id="二级标题">二级标题</h2>', '<h6 id="六级标题">六级标题</h6>']
  }
];

window.markdownRendererFixtureBody = FIXTURE_BODY;
