# 博客三仓库架构与发布机制

状态：Audited / 待实施
日期：2026-09-09

## 目标

将博客项目明确为三个独立 Git 仓库、三个独立 Codex Workspace，并把“前台代码发布”和“博客内容发布”拆成两条独立流程。

- `myBlog-test`：博客前台唯一常规开发、测试、验收入口。
- `myBlog-prod`：正式博客发布源，不作为第二开发区。
- `myBlog-admin`：独立博客内容维护工具，不属于 Test → Prod 的代码环境链。

## 审计结论

### 1. 前台 Test / Prod

Test 与 Prod 当前核心前台文件高度接近，多个文件 blob SHA 相同，包括 `index.html`、`app.js`、`content.js`、`style.css` 等。

但 Prod 当前 `index.html` 仍带有 Test 环境文案：
- `<title>Chance（测试库）</title>`
- `测试库 / TEST`

这证明未来不能再把 Test 文件无差别覆盖到 Prod。正式发布必须使用 allowlist，并保护 Prod 环境文案。

### 2. 旧 Test admin

`myBlog-test/admin/` 是一套较完整的旧维护台，包含：
- 内容编辑：文章、短记、专题；
- 本地草稿；
- Gist 账号与同步；
- PBKDF2 + AES-GCM；
- Test / Production 发布目标；
- 正式发布二次确认；
- `/api/publish` 服务端发布契约。

它不能立即删除。需要先确认新 Admin 是否完整覆盖真正需要的能力，再做迁移/退役。

### 3. 新 myBlog-admin

新仓库已经不是空仓库。当前实现是纯前端 GitHub Pages 维护台：
- 浏览器 PAT 直连 GitHub API；
- `content.js` 写入 Test；
- 图片写入 Test `assets/uploads/`；
- 一键提升时用 Test `content.js` 覆盖 Prod，并补齐 Test 中 Prod 尚无的上传图片。

因此新 Admin 与旧 Test admin 是两套不同架构，不应直接机械搬迁旧目录。

### 4. 两条发布链必须分开

#### 代码发布
需求 → ChatGPT 规划 → Test Codex 开发 → GitHub push → ChatGPT Review → 人工验收 → Test Release Ready → Prod Workspace `git fetch test` → 受控发布 → Review → 人工验收。

禁止 `git merge test/main` 和整库覆盖。

#### 内容发布
Admin → 写作/图片 → 发布到 Test → 在测试博客核对 → 内容提升到 Prod。

内容发布不走完整的前台代码 Release 流程，但必须限制到内容文件和内容资产，不能借 Admin 修改前台程序代码。

## 关键设计决定

1. 一个 Git repo = 一个 Codex Workspace。
2. Prod 本地增加 `test` remote，指向 `myBlog-test`。
3. Admin 暂不增加 `test` / `prod` Git remote；其当前发布通道是 GitHub API。
4. Admin 的 PAT 方案按当前仓库既有设计保留，但后续应优先使用细粒度、仅限目标仓库/Contents 的权限；不把 Token 写入源码。
5. Test 旧 `admin/` 暂不删除。
6. 先建立治理文档和发布协议，再做 Admin 能力迁移/退役决策。
7. Prod 的“测试库 / TEST”文案属于明确缺陷，后续单独修复并作为 Prod 保护项。
8. Admin 的“一键提升”只属于内容发布，不得演变为 Test → Prod 代码同步工具。

## 实施阶段

### Stage B — 建立治理骨架
- Test：`AGENTS.md`、`docs/ACTIVE_TASK.md`、`docs/RELEASE.md`
- Prod：`AGENTS.md`、`docs/ACTIVE_TASK.md`、`docs/RELEASE.md`、`docs/RELEASE_HISTORY.md`
- Admin：`AGENTS.md`、`docs/ACTIVE_TASK.md`
- Prod 本地配置 `test` remote。

### Stage C — 修复 Prod 环境边界
- 修正正式站 Test 文案泄漏。
- 明确 Prod protected areas。
- 验证正式站页面。

### Stage D — Admin 独立化收口
- 对比旧 Test admin 与新 Admin 能力。
- 确定保留能力与迁移项。
- 验证新 Admin 的 Test 内容发布与 Prod 内容提升。
- 验收通过后再决定删除/归档 Test 旧 `admin/`。

## 当前原则

在 Stage D 验收完成之前：
- 不删除 `myBlog-test/admin/`；
- 不把旧 admin 机械复制进新 Admin；
- 不让 Admin 执行前台代码发布；
- 不直接 merge Test main 到 Prod main。
