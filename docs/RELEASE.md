# RELEASE — myBlog Test

## Status
Release Ready

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
