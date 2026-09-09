# Blog Test — 结构与架构健康审计

状态：Ready for Codex
日期：2026-09-09

## 目的

本任务只做审计，不做结构优化。目标是判断 `myBlog-test` 当前多文件结构是否已经足够健康，以及后续是否真的值得拆分/重构。

不要因为个人工作台曾经做过单文件拆分，就假设博客也必须继续拆。

## 已知事实

当前 Test 已经是多文件静态前端，根目录至少包含多个页面 HTML、`style.css`、`app.js`、`reader.js`、`content.js`、`assets/`，并保留一个历史 `admin/` 目录。

独立内容维护工具已经迁移为另一个仓库 `myBlog-admin`。本任务需要识别 Test 中历史 `admin/` 的现状和依赖，但禁止直接删除、迁移或用它覆盖新 Admin。

## 审计范围

Codex 只读检查并形成 Markdown 报告，至少覆盖：

1. 当前前台文件结构与各文件职责。
2. HTML 页面之间的重复结构/导航/脚本引用是否已经造成明显维护风险。
3. `app.js`、`reader.js`、`style.css` 的体量与职责是否需要进一步按领域拆分；必须给出“现在拆 / 暂不拆”的理由。
4. `content.js` 的角色、数据结构耦合点，以及哪些代码依赖其协议；本任务禁止修改协议。
5. `admin/` 历史目录：当前文件、功能、是否仍被前台页面/README/部署流程引用；与独立 `myBlog-admin` 的关系和潜在混淆风险。
6. Test-only 环境标识所在位置，以及未来 Test → Prod 发布时需要保护的环境差异。
7. 静态 GitHub Pages / 无构建体系下的实际约束。
8. 明显的死代码、重复代码、硬编码环境信息或跨 Test/Prod 易误同步点。
9. 是否存在值得立即处理的 P0/P1 风险；若无，明确写“无”。
10. 给出下一阶段建议，按：保持现状 / 小型整理 / 专项重构 三档判断，不直接实施。

## 允许修改

仅允许新增：
`docs/audits/2026-09-09-test-structure-health-audit.md`

如 `docs/audits/` 不存在可创建。

## 禁止修改

- 所有 HTML/CSS/JS 业务文件
- `content.js`
- `assets/**`
- 历史 `admin/**`
- RELEASE / AGENTS / ACTIVE_TASK
- Prod / Admin 仓库

## 分支与提交

- Branch：`codex/test-structure-health-audit`
- Commit：`docs: 审计博客 Test 结构健康度`

## 完成标准

报告必须基于当前真实代码，不只罗列文件名；需要引用具体文件/函数/引用关系作为依据。完成后 commit + push 分支，停止等待 ChatGPT Review，不合并 main。
