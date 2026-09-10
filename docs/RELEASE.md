# RELEASE — myBlog Test

## Status
Release Ready（当前 2 个候选：Phase A 前台协议兼容、Markdown Renderer P0；均仅 Test 验收，均未执行 Prod 发布）

## Release Candidate
Blog 内容协议 Phase A 已完成 Test main、ChatGPT Review 和用户真实 GitHub Pages 人工验收。

- Source Test commit：`cba2f83406a7d0230786461218fe51d8b80b60c3`
- Source branch：`main`
- Test 人工验收：2026-09-10 通过
- 内容：前台支持严格 `content.json`、稳定 ID、旧数组下标链接兼容、legacy `content.js` 安全回退，并完成静态资源 cache-bust 修复。

## 本次允许发布到 Prod 的代码范围
仅允许把经过 Test 验收的**兼容能力**受控同步到 Prod：
- `app.js` 中与内容加载、协议校验、legacy 稳定 ID hydration、详情解析直接相关的变化
- `reader.js` 中与共享详情解析直接相关的变化
- 前台 HTML 中为上述 JS 更新所必需的脚本版本参数
- `scripts/verify-content.mjs` 或等价验证能力（若 Prod 需要）
- Prod 自己的严格 `content.json` 可作为本次迁移产物，但必须从 **Prod 当前内容基线**生成，不得直接复制 Test 内容数据覆盖 Prod

## 禁止覆盖 / 保护项
- 禁止把 Test `content.json` 整份复制到 Prod。
- 禁止用 Test `content.js` 覆盖 Prod `content.js`。
- 禁止改变 Prod 当前文章、短记、专题内容、顺序或 Prod-only 内容。
- 禁止把 `测试库 / TEST` 等 Test-only branding 带入 Prod。
- 禁止整库覆盖、`git merge test/main`、Admin 内容发布、PAT 操作。
- Prod 当前正式环境差异继续以 Prod `docs/RELEASE.md` 为准。

## 稳定 ID 迁移要求
Prod `content.json` 必须从 Prod 当前 legacy 内容生成。与 Test 中可明确判定为同一逻辑条目的内容应复用 Test 已冻结稳定 ID；Prod-only 条目必须获得新的不可变 `<kind>_<ULID>`，不得为了凑齐数组位置错误复用 Test ID。若同一条目判定存在歧义，停止并报告，不能猜测。

## Prod 发布分支
`codex/prod-content-protocol-phase-a-compatibility`

## Prod 验证清单
1. Prod 当前内容数量、顺序、正文语义保持不变。
2. 正常路径使用 Prod 自己的 `content.json`。
3. JSON 404/校验失败时安全回退 Prod 当前 `content.js`。
4. 旧链接 `article-0` / `topic-0` / `note-0` 继续指向原 Prod 条目。
5. 稳定 ID 链接正确。
6. Prod 正式环境文案不出现 Test 标识。
7. `node --check`、内容验证脚本、`git diff --check` 通过。
8. 不执行 Admin 内容发布，不使用 PAT。

## 回滚参考
Prod 发布开始前必须记录当时 `origin/main` 精确 SHA，作为 rollback baseline；不得预先假定仍是历史 Stage C SHA。

## 与内容发布的边界
本次是**前台代码/读取协议兼容发布**，不是 Admin 日常内容提升。文章、短记、专题和图片后续仍走独立 Admin 内容流程。

## Release Candidate 2 — Unified Markdown Renderer P0（仅 Test 验收）

Markdown Renderer P0 已完成 Test 全部门槛并合并到 Test `main`；本记录仅表示该能力在 Test 侧已达 Release Ready 候选状态。**本记录不代表、也不执行任何 Prod 发布。**

- Source Test commit：`7523fb9f38e4ad3dc2802c5a19460d745bccadbf`
- Source branch：`main`
- Test 验收：ChatGPT 第二轮 Review PASS、自动化行为测试 45/45 PASS、本地人工测试页 PASS、Test GitHub Pages 真实人工验收 PASS（2026-09-10）
- 内容：前台统一 Markdown 渲染链路（`marked` + `DOMPurify` + 受控 URL policy），替换原自研 regex renderer；article/note/topic 共用 `window.blogMarkdown()` 与安全边界；新增 `vendor/`（marked 18.0.7 / purify 3.4.14，SHA-256 见 `vendor/THIRD_PARTY_NOTICES.md`）、renderer 行为测试与独立人工测试页。

### 本次允许晋级到 Prod 的代码范围
仅允许把经过 Test 验收的**渲染/安全能力**受控同步到 Prod：
- `app.js` 中统一 `window.blogMarkdown()`（marked + DOMPurify + URL policy）相关变化
- `reader.js` 中接入该 API 及 headings/TOC 兼容相关变化
- `vendor/`（marked-18.0.7.umd.js、purify-3.4.14.min.js、THIRD_PARTY_NOTICES.md）
- `style.css` 中 `.post-body` Markdown 正文样式补充
- 实际加载上述资源的前台 HTML 的 `?v=` 版本参数更新
- `scripts/test-markdown-renderer.mjs` 及 `scripts/markdown-renderer-browser-test.html` / `.js`（若 Prod 需要回归能力）

### 禁止覆盖 / 保护项
- 禁止把 Test `content.json` 整份复制到 Prod（本 P0 未改动 Test `content.json`/`content.js`，更不得改动 Prod 内容数据）。
- 禁止用 Test `content.js` 覆盖 Prod `content.js`。
- 禁止改变 Prod 当前文章、短记、专题内容、顺序或 Prod-only 内容。
- 禁止把 `测试库 / TEST` 等 Test-only branding 带入 Prod。
- 禁止整库覆盖、`git merge test/main`、Admin 内容发布、PAT 操作。
- Prod 当前正式环境差异继续以 Prod `docs/RELEASE.md` 为准。

### Prod 晋级边界
- 任何 Prod 同步仍须由 `myBlog-prod` 独立 Workspace、独立计划与用户明确授权执行。
- 晋级前必须记录当时 `origin/main` 精确 SHA 作为 rollback baseline。
- 验证清单至少包含：Prod 当前 23 条内容数量/顺序/正文语义不变；renderer 行为测试在 Prod 侧可复现；外部链接 `target="_blank" rel="noopener noreferrer"`；危险 URL（`javascript:` / `data:` / `vbscript:` 及其大小写、前导空白、实体/百分号编码变体）被净化；`node --check`、`git diff --check` 通过；不执行 Admin 内容发布，不使用 PAT。

### 与内容发布的边界
本次是**前台渲染/安全能力发布**，不是 Admin 日常内容提升。文章、短记、专题和图片后续仍走独立 Admin 内容流程。
