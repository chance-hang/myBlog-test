# ACTIVE TASK — myBlog Test

## Status
Implementation Complete / Awaiting ChatGPT Review

## 当前状态
Blog 内容协议 Phase A 已完成并通过 Test 真实 GitHub Pages 人工验收；其 Release Ready 记录继续有效，且仍由 `myBlog-prod` 独立 Workspace 按 `docs/RELEASE.md` 执行。

本仓库现进入新的 Test-only Markdown Renderer 修复阶段，当前仅冻结实施计划，尚未修改前台业务代码或内容数据。

## 当前任务
执行计划：`docs/plans/2026-09-10-unified-markdown-renderer.md`

阶段：**Plan Ready for Implementation**。

后续实现必须严格遵守该 Plan：在一个完整功能阶段内以本地固定版本的 `marked` 与 `DOMPurify` 替换共用详情路径中的自研 regex renderer，并完成测试、Review 与 Test GitHub Pages 人工验收。未完成这些门槛前，不得将此 renderer 变更进入 Prod。

## Review 修正（2026-09-10）
第一轮 Review 指出旧测试只检查源码字符串，未验证真实渲染行为。本轮修正：

- `scripts/test-markdown-renderer.mjs` 改为两段：Node 侧静态契约检查（vendor 固定版本、唯一 renderer 入口）+ 真实浏览器行为测试。
- 行为测试用本地静态 HTTP server 提供测试页，页面真实执行 `window.blogMarkdown()` 与 `reader.js`，并把断言结果回传给 Node 运行器；不依赖浏览器 CLI 输出（Edge `--dump-dom` 在本机不可靠）。
- 新增 `scripts/markdown-renderer-browser-test.html`（页面同时是人工验收入口，直接用浏览器打开即显示 PASS/FAIL）与 `scripts/markdown-renderer-browser-test.js`（用例数据；独立文件避免 HTML 解析器截断样例中的结束标签）。
- 覆盖：h1–h6、段落、strong/em/strike、ul/ol、blockquote、link、inline code、fenced code、hr、image；`<script>`、事件属性、iframe、svg、style、form；`javascript:` / `data:` / `vbscript:` / `file:` 及其大小写、前导空白、百分号编码、HTML 实体变体；mailto 仅允许 link；外部链接 `target="_blank" rel="noopener noreferrer"`；相对/根相对/锚点 URL；article、note、topic 共用渲染与 h1–h6 锚点、TOC 仅收录 h2–h4；stable ID 与 legacy `article-0` / `note-0` / `topic-0` 解析。
- 结果：45/45 PASS；`node --check app.js`、`node --check reader.js`、`node scripts/verify-content.mjs`（9 articles / 10 notes / 4 topics）、`git diff --check` 均通过；`content.json`、`content.js` 未修改；未合并 main，未触碰 Admin / Prod。

## 本地注意
此前百度同步曾在本地生成未跟踪的 `*.baiduyun.uploading.cfg`。在下一次 Test Codex 任务开始前，必须先处理工作区干净问题；不要擅自删除/提交临时文件。可后续单独评估 `.gitignore` 治理。
