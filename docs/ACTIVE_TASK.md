# ACTIVE TASK — myBlog Test

最后更新：2026-09-10（Workflow 3.0 Phase 2 同步）

## Status
`Completed / Accepted`（Markdown Renderer P0，仅 Test）

## 当前优先级

- **没有 `P0 Active`**：当前没有进行中的 Implementation。
- **没有 `P1 Queued`**：本仓库没有下一级任务。跨仓协作任务由各自仓库的 `ACTIVE_TASK.md` 管理，不列在本 repo 队列里。
- **`P2 Backlog`**：等待 ChatGPT 为本仓库派发新需求；新需求到达前 Executor 不主动实施任何变更。

> 注：`myBlog-admin` 仓库的 Phase C（安全 Prod Publisher）由 `myBlog-admin/docs/ACTIVE_TASK.md` 自己管理；本仓库不为其代持状态，也不得据此在本 repo 启动相关 Implementation。

## STOP 状态机

按 `GLOBAL_RULES.md §10`：

- `Awaiting ChatGPT Review`：commit / push 完成后等 ChatGPT Review diff。
- `Awaiting User Acceptance`：Review 通过后等用户人工验收。
- `Blocked`：缺信息 / 冲突 / 依赖未到位。
- `Completed / Accepted`：用户人工验收通过，ChatGPT 派发下一 Task 或执行发布。

Markdown Renderer P0 当前停在 `Completed / Accepted`，等待 ChatGPT 在适当时机派发下一 P0 任务或进入 Prod 发布流程。

## 当前状态
Markdown Renderer P0 已完成全部门槛并合并到 Test `main`（`7523fb9f38e4ad3dc2802c5a19460d745bccadbf`）：ChatGPT 第二轮 Review PASS、自动化行为测试 45/45 PASS、本地人工测试页 PASS、Test GitHub Pages 真实人工验收 PASS。计划见 `docs/plans/2026-09-10-unified-markdown-renderer.md` 的「完成与验收记录」。

Blog 内容协议 Phase A 的 Release Ready 记录继续有效；Markdown Renderer P0 的 Release Ready 候选已按要求记入 `docs/RELEASE.md`。两者均须由 `myBlog-prod` 独立 Workspace、独立计划和明确授权执行，Test 不得直接发布 Prod。

本仓库当前没有进行中的 Implementation 任务。

## 当前任务
无进行中的 Implementation。

队列（按 Workflow 3.0 P0/P1/P2 模型，已在"当前优先级"段固化）：

- `P1`：（本仓库无）。
- 跨仓参考（不构成本 repo 队列项）：`myBlog-admin` 仓库的 Phase C 由其自己的 `docs/ACTIVE_TASK.md` 管理，详见该文件；本仓库不得据此在本 repo 启动 Implementation。

## Review 修正（2026-09-10）
第一轮 Review 指出旧测试只检查源码字符串，未验证真实渲染行为。本轮修正：

- `scripts/test-markdown-renderer.mjs` 改为两段：Node 侧静态契约检查（vendor 固定版本、唯一 renderer 入口）+ 真实浏览器行为测试。
- 行为测试用本地静态 HTTP server 提供测试页，页面真实执行 `window.blogMarkdown()` 与 `reader.js`，并把断言结果回传给 Node 运行器；不依赖浏览器 CLI 输出（Edge `--dump-dom` 在本机不可靠）。
- 新增 `scripts/markdown-renderer-browser-test.html`（页面同时是人工验收入口，直接用浏览器打开即显示 PASS/FAIL）与 `scripts/markdown-renderer-browser-test.js`（用例数据；独立文件避免 HTML 解析器截断样例中的结束标签）。
- 覆盖：h1–h6、段落、strong/em/strike、ul/ol、blockquote、link、inline code、fenced code、hr、image；`<script>`、事件属性、iframe、svg、style、form；`javascript:` / `data:` / `vbscript:` / `file:` 及其大小写、前导空白、百分号编码、HTML 实体变体；mailto 仅允许 link；外部链接 `target="_blank" rel="noopener noreferrer"`；相对/根相对/锚点 URL；article、note、topic 共用渲染与 h1–h6 锚点、TOC 仅收录 h2–h4；stable ID 与 legacy `article-0` / `note-0` / `topic-0` 解析。
- 结果：45/45 PASS；`node --check app.js`、`node --check reader.js`、`node scripts/verify-content.mjs`（9 articles / 10 notes / 4 topics）、`git diff --check` 均通过；`content.json`、`content.js` 未修改；未触碰 Admin / Prod。后续该分支已合并并 push 到 Test `main`。

## 验收记录（2026-09-10）

- ChatGPT 第二轮 Review：PASS。
- 自动化行为测试：45/45 PASS（`node scripts/test-markdown-renderer.mjs`）。
- 本地人工测试页：PASS（`scripts/markdown-renderer-browser-test.html`）。
- Test GitHub Pages 真实人工验收：PASS。
- 合并与推送：已合并并 push 到 Test `main`，基线 `7523fb9f38e4ad3dc2802c5a19460d745bccadbf`。
- 未执行 Prod 发布；Release Ready 候选按现有规则记入 `docs/RELEASE.md`。

## 本地注意
此前百度同步曾在本地生成未跟踪的 `*.baiduyun.uploading.cfg`。在下一次 Test Codex 任务开始前，必须先处理工作区干净问题；不要擅自删除/提交临时文件。可后续单独评估 `.gitignore` 治理。
