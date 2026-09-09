# AGENTS.md — myBlog Test

## 仓库角色
本仓库是博客前台代码的唯一常规开发与验收入口。对应正式仓库为 `myBlog-prod`；独立内容维护台为 `myBlog-admin`。

## 基本原则
- 常规功能开发、样式调整、重构和缺陷修复先在 Test 完成。
- 不直接在 Prod 独立重新实现已经在 Test 完成的功能。
- Test 通过 ChatGPT Review 与人工验收后，才进入代码发布流程。
- 代码发布与内容发布是两条独立流程，不要混在同一个任务中。
- 不把正式库数据、凭据、PAT、Cookie、token 写入 Test 或提交到 Git。

## Codex 工作方式
开始任何任务前先读取：
1. `AGENTS.md`
2. `docs/ACTIVE_TASK.md`
3. 与当前任务相关的 `docs/plans/`
4. 若涉及发布，再读取 `docs/RELEASE.md`

只执行 `docs/ACTIVE_TASK.md` 当前明确授权的范围。任务未授权时，不自行创建功能、同步 Prod 或扩大修改范围。

## 分支与提交
- 功能任务使用独立分支，分支名以 `codex/` 开头。
- 完成一个功能阶段后集中提交并 push，等待 ChatGPT Review。
- Review 未通过时只做 Review Fix；Review 通过后再由用户决定合并/验收。
- 未明确授权不得直接修改 Prod。

## 博客特殊规则
- 前台代码发布：Test → Review → 人工验收 → Release Ready → Prod 控制发布。
- 内容发布：文章、短记、专题、图片由 `myBlog-admin` 管理，先发布 Test 内容，再核对后提升 Prod。
- 不要为了发布文章而启动整套前台代码发布。
- Test 环境可以显示测试环境标识；Prod 不得继承 `测试库 / TEST`、`Chance（测试库）` 等测试文案。

## 技术约束
当前项目为静态前端。除非 ACTIVE_TASK 明确授权：
- 不引入框架、构建系统或新的部署体系。
- 不大规模改写现有页面结构。
- 不改变 `content.js` 的数据协议。
- 不改变 Admin 的内容发布协议。

## 完成报告
Codex 完成后用中文报告：
- 分支名
- commit SHA
- 修改文件
- 做了什么
- 自测结果
- 是否已 push
- 明确说明“未合并 main”或实际合并状态
