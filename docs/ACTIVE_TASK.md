# ACTIVE TASK — myBlog Test

## Status
Ready for Codex

## 当前任务
执行 Blog 内容协议 Phase A：在 Test 前台建立 `content.json` + 稳定 ID + legacy `content.js` 安全回退的只读兼容层。

完整计划：
`docs/plans/2026-09-09-content-protocol-phase-a-test-compatibility.md`

## Codex 执行要求
1. 先确认当前 Workspace / 仓库为 `myBlog-test`，工作区干净并位于 `main`。
2. 执行 `git pull --ff-only origin main`；pull 成功后重新读取最新 `AGENTS.md`、本文件和上述 Plan。
3. 从最新 main 创建 `codex/content-protocol-phase-a-test-compatibility`。
4. 只修改 Test；不得触碰 Prod / 独立 Admin / 历史 `admin/`。
5. 新增严格 `content.json`，把当前 legacy 内容按既定协议迁移并为现有条目分配冻结稳定 ID。
6. 前台优先读取/校验 `content.json`，失败时安全回退现有 `content.js`；禁止 `eval` / `Function`。
7. 新稳定 ID 链接与旧数组下标链接必须同时可用。
8. 保持现有视觉、内容语义、顺序、Test 品牌文案，不做结构重构或无关清理。
9. 完成 Plan 中静态/回退/链接验证，push 分支后停止，不合并 main，不同步 Prod。

## 完成报告
中文报告：
- 分支、base SHA、最终 commit SHA
- 修改文件
- legacy→JSON 的内容数量与迁移规则
- 稳定 ID 方案及旧链接兼容结果
- JSON 正常加载与失败回退验证结果
- `node --check` / `git diff --check` 等验证
- push 状态、工作区状态
- 明确说明未触碰 Prod/Admin、未使用 PAT、未合并 main

## 后续门禁
ChatGPT Review 通过后仍需要 Test 页面人工验收；人工验收通过前不得开始 Prod 兼容发布。
