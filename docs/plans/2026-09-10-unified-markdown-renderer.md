# myBlog Test — Unified Markdown Renderer Repair

状态：Plan Ready for Implementation  
日期：2026-09-10  
实施仓库：`myBlog-test`（仅 Test）

## 决策与目标

当前 `app.js` 的 `window.blogMarkdown()` 是简易自研 regex renderer；`reader.js` 对 article 的 `body`、note/topic 的 `text` 共用该输出并写入详情页 `innerHTML`。它不能完整表达通用 Markdown，也没有独立安全边界。因此，**废弃继续扩展该 regex renderer 的长期方案**。

后续以一条统一、受控的静态链路取代它：

```text
Markdown source (article.body / note.text / topic.text)
  -> marked.parse() (GFM enabled, raw HTML disabled)
  -> DOMPurify.sanitize() (明确 allow-list 与 URL policy)
  -> controlled HTML
  -> reader.js
  -> #post-body.innerHTML
```

目标是在不引入 React/Vue、服务器、CDN 运行依赖、npm build 或改动数据协议的前提下，修复三种详情内容共用 renderer 的 Markdown 能力与安全边界。

## 依赖选择、交付与升级

最终组合：**marked v18.0.7 + DOMPurify v3.4.14**；两者均提供浏览器可直接加载的发行构建。`marked` 负责 GFM Markdown 解析，DOMPurify 负责将 parser 输出置于独立的 XSS safety boundary。前者为 MIT 许可；后者按其双许可证说明采用 Apache-2.0（并保留上游随发行物提供的许可证文本）。两者适合随静态 GitHub Pages 文件部署。

不选继续自研 regex：其块级与嵌套语法、围栏代码、链接、转义和安全 URL 规则会持续形成不完整且难以测试的语法/安全实现；修补单个缺口不能给出完整协议保证。

不选运行时 CDN：离线/网络可用性、版本漂移、CSP 与供应链边界均不可由仓库版本控制；不选完整 npm/build 工程，因为本站仍是浏览器可直接打开的零构建静态站。

实施时新增 `vendor/`：

- `vendor/marked-18.0.7.umd.js`
- `vendor/purify-3.4.14.min.js`
- `vendor/THIRD_PARTY_NOTICES.md`（上游名称、版本、下载的 release/tag URL、许可证、SHA-256、获取日期）

页面须先加载本地 vendor 脚本，再加载 `app.js` 与 `reader.js`；不得留下可工作的 CDN fallback。实际获取时须从上游带签名/tag 的 release artifact 下载，复算 SHA-256 后写入 notices；若该精确版本或适用许可证/构建文件无法核验，停止实施并先更新本 Plan/Review，而不是静默改用浮动版本。

升级是单独的依赖维护变更：审阅上游安全公告与变更日志，固定目标版本，重新下载并复核完整性/许可证，更新 notices 与 HTML 缓存版本，运行本 Plan 的完整测试和 Test Pages 验收。不得用 `latest`、范围版本或 CDN URL 替代固定文件。

## Markdown 正式支持协议

本轮正式支持（`marked` 的 GFM 配置）：

| 类别 | 支持 |
| --- | --- |
| 标题 | ATX `#` 至 `######`，分别输出 h1–h6 |
| 基础块 | 段落、空行、水平线 |
| 行内 | `**strong**`、`*em*`、`~~del~~`、inline code |
| 结构 | 无序/有序列表、blockquote |
| 链接与媒体 | Markdown link、Markdown image（均经过 URL policy） |
| 代码 | fenced code block，输出 `pre > code`，只显示不执行 |

本轮明确不承诺：原始 HTML、内嵌 HTML 样式/脚本、iframe、音视频嵌入、表格、任务列表、脚注、数学公式、Mermaid、自动链接扩展、HTML 锚点与自定义属性。即使 parser 可解析其中部分，也不得视为公开内容协议；需另立 Plan 扩展。

## HTML 与 URL 安全边界

1. `marked` 必须配置为不解释原始 HTML；原始 HTML 以文本呈现或被转义，不能作为标签进入 DOM。
2. parser 输出一律再经 DOMPurify，再赋给 `innerHTML`；禁止绕过该函数的第二条 Markdown→HTML 路径。
3. DOMPurify 使用严格、最小 allow-list，仅保留本轮 Markdown 标签/属性（例如 headings、p、strong/em/del、ul/ol/li、blockquote、a、code/pre、hr、img、`href`/`src`/`alt`/`title` 与受控 `id`/`class`）。显式禁止 `script`、`style`、`iframe`、`form`、SVG/MathML、所有 `on*` 事件属性及危险 URI 属性。
4. 链接 `href` 仅允许规范化后为 `https:`, `http:`, `mailto:` 或相对/站内 fragment URL；图片 `src` 仅允许规范化后为 `https:`, `http:` 或相对站内资源 URL。两者均拒绝 `javascript:`、`data:`、`vbscript:`，包括混合大小写、前导/控制空白、HTML entity/百分号编码等绕过形态；不能明确判定为允许的 URL 时删除 URL 属性。
5. 外部 HTTP(S) 链接在实现时统一补 `target="_blank" rel="noopener noreferrer"`；图片不加载 data URI。URL policy 需在 DOMPurify 后对真实 DOM 属性再做一次规范化验证，而非只在 Markdown 原文上 regex 判断。

## 标题、锚点与目录协议

- 页面 `#post-heading > h1` 是条目标题，**不**属于正文目录；正文 Markdown h1–h6 均为正文标题。
- TOC 正式收录正文 h2、h3、h4；h1 不自动收录，以避免与页面标题并列，h5/h6 不收录以控制目录密度。它们仍保留可访问锚点与正常视觉层级。
- renderer/reader 在 sanitized DOM 上为 h1–h6 生成稳定 slug id：以标题纯文本 Unicode（中文保留）为基底，去首尾空白、归一化连字符；空结果使用 `section`；按出现顺序追加 `-2`、`-3`，确保重复标题不冲突且同一内容重复渲染得到相同 id。
- 原有 `section-1` 等顺序 id 不再强行覆盖标题 id。TOC、点击定位、滚动高亮和阅读进度均改为使用生成的 heading id；无正文标题时仍保留当前“首个正文元素作为 `section-1`”的兼容 fallback。摘要继续是 `#overview`。

## CSS 与缓存范围

只为 `.post-body` 补充 h1–h6、p、a、ul/ol、blockquote、inline code、`pre > code`、hr、img 的必要样式，沿用既有字体、间距、色彩和响应式体系；不进行全站视觉重构。

实施时改动 vendor、`app.js`、`reader.js` 或 `style.css`，须同步更新所有实际加载它们的前台 HTML 的明确 `?v=` 版本参数，避免 GitHub Pages/CDN/浏览器缓存继续使用旧资源。Test 验收须在桌面与窄屏设备/模拟视口各验证一次，并用硬刷新或新的版本参数确认 Network/页面加载的是新 vendor 与 JS。

## 数据与环境边界

本阶段严禁修改 `content.json` 的 23 条真实内容、legacy `content.js` 内容数据、`schemaVersion`、stable ID 协议、Admin 发布协议、`myBlog-admin`、`myBlog-prod`、Test/Prod 发布流程、列表卡片的纯文本摘要策略、品牌及无关 UI。列表卡片继续只显示安全纯文本摘要，绝不渲染 Markdown。

`content.json` 正常加载与 legacy `content.js` fallback 必须把相同正文传给**同一个** `window.blogMarkdown`/统一 renderer；不得复制为两套 parser 逻辑。

## 实施顺序与预期文件

在一个完整功能阶段执行：

1. vendor 固定版本 parser/sanitizer 与 notices；调整详情页脚本加载顺序。
2. 在 `app.js` 建立唯一 Markdown render + sanitize + URL policy API，移除旧 regex renderer 的职责。
3. 在 `reader.js` 接入该 API，并按本 Plan 更新 headings/TOC 兼容逻辑。
4. 在 `style.css` 加入必要、局部的 Markdown 正文样式。
5. 新增轻量 Node 可执行测试与独立人工 fixture；执行协议/回归验证。
6. Test GitHub Pages 发布后完成桌面、移动端人工验收，再进入 Review；不在本阶段合并 main 或触碰 Prod/Admin。

预计修改/新增范围仅限：`app.js`、`reader.js`、`style.css`、实际详情页加载的 HTML、`vendor/**`、`scripts/test-markdown-renderer.mjs`（或同等轻量测试）、独立 fixture/test page 与本 Plan/ACTIVE_TASK。实际实施前若发现需要超出此范围，应停止并更新 Plan/取得授权。

## 自动化与人工验收设计

新增不依赖大型框架的 Node 可执行测试（可用 Node 内置 `assert`，测试所需 browser DOM 由受控、最小的本地测试适配提供；不得因测试引入完整构建系统）。至少覆盖：

1. Markdown 功能：h1–h6、段落/空行、strong、em、strike、ul、ol、blockquote、link、inline code、fenced code、hr、image。
2. 内容类型：同一 renderer 对 article `body`、note `text`、topic `text` 都产生预期安全 HTML。
3. 安全样本：`<script>alert(1)</script>`、`<img src=x onerror=alert(1)>`、`[bad](javascript:alert(1))`、`![bad](javascript:alert(1))`、大小写 scheme、前导空白 scheme、`data:`、`vbscript:`；断言最终 HTML/DOM 没有 script、事件属性、危险 URL 或可执行载荷。
4. 数据源一致性：模拟 JSON 与 legacy fallback 的同一正文，断言均调用并获得同一 renderer 结果。
5. 历史兼容：stable ID 与 `article-0`、`note-0`、`topic-0` 仍解析到正确条目；三类详情页均能正常加载。
6. 回归检查：`node --check app.js`、`node --check reader.js`、现有 `node scripts/verify-content.mjs`、新增 renderer 测试与 `git diff --check`。

人工验收不改动真实 23 条内容。新增独立、非生产内容的 fixture 或专用测试页/模块，包含标题、强调、列表、引用、链接、inline/fenced code、图片和安全转义样本；它不得进入 `content.json`、`content.js` 或卡片数据源。若实现证明只能临时写真实内容，必须先停止：提出最小变更、明确恢复 commit/文件、人工验收完成即回滚，并重新验证 23 条内容未变化；默认优先 fixture。

## 完成门槛与发布边界

完成实现不等于可发布。实施分支须通过上述自动化检查、ChatGPT Review、Test GitHub Pages 桌面/移动端人工验收；随后才可单独评估 Release Ready。任何 Prod 同步仍须由 `myBlog-prod` 独立 Workspace、独立计划和明确授权执行。

