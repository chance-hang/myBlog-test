# AGENTS.md — myBlog Test

## 仓库角色
本仓库是博客前台代码的唯一常规开发与验收入口。对应正式仓库为 `myBlog-prod`；独立内容维护台为 `myBlog-admin`。

## 基本原则
- 常规功能开发、样式调整、重构和缺陷修复先在 Test 完成。
- 不直接在 Prod 独立重新实现已经在 Test 完成的功能。
- Test 通过 ChatGPT Review 与人工验收后，才进入代码发布流程。
- 代码发布与内容发布是两条独立流程，不要混在同一个任务中。
- 不把正式库数据、凭据、PAT、Cookie、token 写入 Test 或提交到 Git。

## Codex 启动任务前必须先同步 GitHub
GitHub 是规则、任务状态和计划的权威来源，本地文件可能过期。

每次用户要求执行当前任务时，Codex 必须先：
1. 确认当前 Workspace / Git 仓库是 `myBlog-test`。
2. 执行 `git status`；若工作区存在未知未提交修改，停止并中文报告，不直接 pull。
3. 确认处于适合更新基线的状态；常规新任务从 `main` 开始。
4. 执行 `git pull --ff-only origin main`。
5. pull 成功后重新读取最新 `AGENTS.md`、`docs/ACTIVE_TASK.md`、ACTIVE_TASK 引用的 Plan；涉及发布时再读取 `docs/RELEASE.md`。
6. 只执行重新读取后的最新 ACTIVE_TASK，不得依据 pull 前缓存或旧任务文件行动。

若 fast-forward 失败、remote 异常、分支状态有歧义或工作区不干净：停止并报告，不自行 reset/clean/force/rebase 覆盖。

## Codex 工作方式
只执行 `docs/ACTIVE_TASK.md` 当前明确授权的范围。任务未授权时，不自行创建功能、同步 Prod 或扩大修改范围。

## 分支与提交
- 功能任务使用独立分支，分支名以 `codex/` 开头。
- 完成一个功能阶段后集中提交并 push，等待 ChatGPT Review。
- Review 未通过时只做 Review Fix；Review 通过后再由用户决定合并/验收。
- 未明确授权不得直接修改 Prod。
- 活跃任务分支建立后，原则上不要在 Review 前无关推进 `main`；若 `main` 必须前进，Review 前必须先把最新 main 安全同步到任务分支并重新验证，禁止因此扩大业务修改范围。

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

### Markdown 渲染长期治理
- 不得以继续叠加自研 regex 的方式实现通用 Markdown parser；需要扩展协议时应采用已审查的成熟 parser。
- 任意 Markdown 到 `innerHTML` 的链路必须在同一功能阶段经过显式 sanitization；parser 输出不是可信 HTML。
- 第三方前端运行依赖不得依赖 CDN，必须固定版本、连同许可证与来源/完整性记录以本地静态资源发布。
- renderer 改动必须同时覆盖 article、note、topic 的共用详情链路，不得只修其中一种内容类型。

## 完成报告
Codex 完成后用中文报告：
- 分支名
- commit SHA
- 修改文件
- 做了什么
- 自测结果
- 是否已 push
- 明确说明"未合并 main"或实际合并状态

## Workflow 3.0 跨项目同步（2026-09-10）

本节把总控仓库 [`chance-hang/AI-Coding-Control-Center`](https://github.com/chance-hang/AI-Coding-Control-Center) 的跨项目规则同步到本仓库。它**不替代**本仓库既有规则；冲突时本节服从上文"博客特殊规则"、"Markdown 渲染长期治理"、"技术约束"与"分支与提交"，最终由 ChatGPT 按 `GLOBAL_RULES.md §19` 恢复权威顺序裁决。

权威来源：

- [GLOBAL_RULES.md](https://github.com/chance-hang/AI-Coding-Control-Center/blob/main/GLOBAL_RULES.md)
- [docs/WORKFLOW.md](https://github.com/chance-hang/AI-Coding-Control-Center/blob/main/docs/WORKFLOW.md)
- [docs/EXECUTOR_HANDOFF.md](https://github.com/chance-hang/AI-Coding-Control-Center/blob/main/docs/EXECUTOR_HANDOFF.md)
- [docs/MULTI_DEVICE.md](https://github.com/chance-hang/AI-Coding-Control-Center/blob/main/docs/MULTI_DEVICE.md)
- [docs/DISASTER_RECOVERY.md](https://github.com/chance-hang/AI-Coding-Control-Center/blob/main/docs/DISASTER_RECOVERY.md)

### 角色与执行器抽象

- 用户：提出需求、批准高风险操作、执行关键人工验收。
- ChatGPT：总控。读取 GitHub 事实、维护治理文件、Review Executor 推送结果。
- Executor：在真实本地仓库中执行明确任务的工程层。**Codex 与 Workbuddy 都是可替换 Executor**；本仓库当前任务的执行不绑定单一 Executor。
- GitHub：对 Executor 中立的长期共享状态中心。
- myBlog 三仓（Test / Prod / Admin）是三套独立 Workspace，不视为单一项目仓库。

### ACTIVE_TASK / Task Queue 优先级模型

本仓库 `docs/ACTIVE_TASK.md` 必须为每条任务标注优先级：

| 优先级 | 含义 | Executor 允许行为 |
| --- | --- | --- |
| `P0 Active` | 当前唯一允许实施的任务 | Implementation、测试、commit、push |
| `P1 Queued` | 下一任务 | 读取、规划、写文档；**不得提前 Implementation** |
| `P2 Backlog` | 未来任务 | 不主动执行 |

Executor 不得自行把 P1 / P2 提升为 P0。当前 myBlog-admin Phase C 标记为 `P1 Queued`，Executor 不得在没有显式升级到 `P0 Active` 之前启动其 Implementation。

### STOP 状态机

| 状态 | 后续推进必须由谁激活 |
| --- | --- |
| `Awaiting ChatGPT Review` | ChatGPT |
| `Awaiting User Acceptance` | 用户 |
| `Blocked` | ChatGPT + 用户 |
| `Completed / Accepted` | ChatGPT 派发下一 Task 或执行发布 |

当前 Markdown Renderer P0 处于 `Completed / Accepted`，等待 ChatGPT 在适当时机派发下一 P0 任务或进入 Prod 发布流程。

### 上下文高效指令与汇报

- ChatGPT → Executor 默认指令只给三件事：仓库绝对路径、动作、读取入口（`AGENTS.md` / `docs/ACTIVE_TASK.md` / Plan / `docs/RELEASE.md`）。
- Executor 默认完成汇报只四件事：`commit SHA` / 测试验证 / `push 成功/失败` / `blocker`。
- 仅当新需求尚未进入 GitHub、高风险操作、异常恢复、需要用户决策时才展开长指令。

### 多电脑 / Executor 接管 / 云同步盘

- 每台电脑使用独立 Git clone；GitHub 负责跨设备同步。
- 同一个仓库同一时间只能有一个写入 Executor。
- dirty worktree 接管必须先保护前一执行器遗留工作；禁止直接 `reset --hard` / `clean -fd` / `checkout --`。
- 百度同步盘**不能视为 Git 状态同步机制**；不得让两个 Executor / 设备同时写同一 clone。
- 遇到 ref 异常先停止、检查 `git reflog` 与 `git fsck`，**不得** reset / clean / 重写历史。详细恢复流程见 [docs/DISASTER_RECOVERY.md §场景 E](https://github.com/chance-hang/AI-Coding-Control-Center/blob/main/docs/DISASTER_RECOVERY.md)。
- 本地百度同步产生的 `*.baiduyun.uploading.cfg` 等临时文件按上文"本地注意"规则处理；不得在本任务中擅自清理。

### 与本仓库既有规则的关系

- 上文"博客特殊规则"、"Markdown 渲染长期治理"、"技术约束"、"分支与提交"等仍然有效且优先。
- 本节只在不冲突的范围内补充跨项目同步要求；冲突时按权威顺序由 ChatGPT 显式裁决。
