# myBlog Test 结构与架构健康审计

日期：2026-09-09
范围：仅审阅 `myBlog-test` 当前 `main` 基线 `b5818da28eedb6add2759c417b628af18d3d23ba` 的受 Git 管理文件；未修改前台、`content.js`、`admin/` 或其他业务代码。

## 结论

**前台核心建议保持现状，暂不做专项重构。** 当前已经是与 GitHub Pages 相称的多文件静态站：页面职责、内容源、通用行为和文章阅读增强均有清晰边界。`app.js` 约 201 行、`reader.js` 约 51 行，尚未达到为了“拆而拆”引入模块加载、构建或跨文件状态复杂度的程度。

下一阶段若要投入时间，建议归入**小型整理**，且只处理治理与环境防误用：决定历史 `admin/` 的保留/下线方式，并为 Test → Prod 的环境文字做一次可复核的发布检查。它们不是需要立即改写前台结构的理由。

## 当前结构与职责

| 层级 | 文件/目录 | 当前职责与证据 |
| --- | --- | --- |
| 页面壳 | `index.html`、`content.html`、`articles.html`、`topics.html`、`notes.html`、`about.html`、`post.html` | 静态语义结构、导航和页面专有挂载点；分类页分别提供 `#all-articles`、`#all-topics`、`#all-notes`，文章页提供 `#post-heading`、`#post-body`、`#post-toc`。 |
| 内容协议 | `content.js` | 以唯一全局 `window.blogContent` 提供 `articles`、`notes`、`topics` 三个集合。文章对象被 `app.js` 和 `reader.js` 读取 `date`、`title`、`summary`、`body`、`category`、`cover` 等字段；短记和专题使用各自的 `label`/`text` 形态。 |
| 通用前台行为 | `app.js` | 加载动画/星空、环境标签、导航激活、三类内容标准化和卡片渲染（`cardMarkup`、`renderCardGrid`）、筛选、抽屉和摘要展开。 |
| 文章页增强 | `reader.js` | 读取 `post.html?id=article|topic|note-<index>`，渲染正文、目录和移动端目录行为；依赖 `app.js` 定义的 `content`、`esc`、`markdown`。 |
| 展示样式与资源 | `style.css`、`assets/` | 共享视觉规则和本地封面/指引/上传资源；无外部构建产物或包依赖。 |
| 历史维护台 | `admin/` | 仍是一套独立静态应用（`index.html`、`admin.js`、`admin.css` 与说明），不是前台运行时依赖。 |

所有前台页面都以相对路径加载 `content.js` 和 `app.js`；仅 `post.html` 再加载 `reader.js`。这符合无构建静态站的最小依赖模型，加载顺序也保证 `window.blogContent` 先于消费代码可用。

## 重复、体量与拆分判断

分类页的顶栏、分类导航和参考页脚有明显的 HTML 重复；它们目前是少量静态标记，且不同页的活动状态与文案很直观。由于 GitHub Pages 无服务端 include、项目也没有构建体系，抽成模板会带来新的生成步骤或运行时拼装，收益不足。因此**暂不拆页面壳**。

`app.js` 同时包含视觉交互、导航、列表转换和卡片渲染，但这些逻辑围绕同一份只读内容和同一页面族，函数边界已可辨认。`reader.js` 保持为文章页专属文件且体量很小；现在拆分 `app.js` 或抽通用模块会额外制造脚本顺序与全局依赖管理。**暂不按领域拆分 JS。**

`style.css` 约 40 KB、90 个物理行（大量长行规则），是可读性和代码审查上的小型维护成本，但未发现其导致跨页架构耦合的证据。若后续进入小型整理，可只做无行为变化的格式化和按页面区块分段；本审计不实施。

## `content.js` 协议与耦合点

`content.js` 既是前台的内容数据源，也是历史维护台发布时的写入目标：`admin/admin.js` 的 `publishContentToRepository()` 固定向两个仓库的根目录 `content.js` 写入生成结果。前台中，`app.js` 将集合转换为带 `kind`/`sourceIndex` 的卡片链接，`reader.js` 再按该索引回查集合。由此可见，集合名称、数组顺序与字段形态均是实际协议的一部分。

结论：该协议虽然采用全局变量而非模块，但对当前无构建站是简单、可直接检查的选择；任何字段重命名、排序语义变化或发布格式变化都必须同时验证列表、链接和文章页。本次未改动协议。

## 历史 `admin/` 与独立 `myBlog-admin`

前台 HTML、根 `README.md` 和当前前台脚本中未发现到 `admin/` 的引用；它不参与公开前台的正常渲染。`admin/index.html` 仍可作为独立入口打开，`admin/admin.js` 中的 `REPOS` 明确包含 `myBlog-test` 和 `myBlog-prod`，并实现 Gist 同步、Token 验证、`content.js` 发布及上传 `assets/uploads/` 的能力。

因此它不是死文件，也不能在没有迁移/回退方案时删除；但在独立 `myBlog-admin` 已承担内容维护的治理前提下，它构成两个维护入口并存的混淆风险。后续应由单独的治理任务确认其是否只读归档、展示弃用提示或在已验证迁移后移除；不能用历史目录覆盖独立 Admin，也不能将其视为当前发布流程的一部分。

## Test → Prod 环境边界

测试标识是显式硬编码的：`index.html` 有 `.env-label` 的“测试库 / TEST”，各前台页面的 `<title>` 含“（测试库）”。`app.js` 的 `isProductionHost` 仅在 URL 含 `myblog-prod` 时运行时移除标题中的“（测试库）”，并将首页标签改为 `LIVE`。

这提供了运行时兜底，但不是发布替换的充分证明：Prod 若保留测试文案、Prod URL 命名变化，或新页面未接入这段逻辑，仍可能暴露测试标识。反之，历史 `admin/` 的 `REPOS` 允许一个已授权 Token 直接选择正式库。Test 发布流程应继续保持为 Test → Review → 人工验收 → Release Ready → Prod 控制发布，且发布前应人工核对目标仓库、环境文字、`content.js` 内容及部署后的真实页面。

## 静态站约束与发现

- GitHub Pages 直接托管文件，没有模板 include、打包器或模块解析；当前相对路径和脚本加载顺序是可靠且低复杂度的实现方式。
- 页面通过 `?v=...` 查询串控制静态资源缓存。更新 CSS/JS 或发布后仍需检查实际渲染，不能只以 HTTP 成功或仓库提交作为验收。
- 文章详情 URL 使用数据数组索引。内容维护或发布若重排集合，旧的 `post.html?id=...-<index>` 链接可能指向不同文章；这是当前协议的已知耦合点，应在未来内容迁移时专项评估稳定 ID。
- `admin/` 与根前台共处同一 Test 仓库，且其旧工具能访问两个仓库目标；它不是前台死代码，却是治理边界容易被误解的位置。

## 风险分级与建议

| 级别 | 结论 | 依据与建议 |
| --- | --- | --- |
| P0 | **无** | 审计范围内没有发现明文凭据、前台对历史 `admin/` 的运行时依赖、或会阻断静态站加载的结构性错误。 |
| P1 | 历史 `admin/` 双入口与可选 Prod 写入 | `admin/admin.js` 同时配置 Test/Prod 并能直接发布；独立 `myBlog-admin` 已存在。单列治理任务确认唯一维护入口和历史工具处置，不在本任务删除。 |
| P1 | Test/Prod 文字保护依赖运行时主机名 | `app.js` 的 `/myblog-prod/i` 规则只能覆盖当前命名和已挂载页面。Release Ready 前以真实 Prod URL 和渲染结果检查环境文案。 |
| P2 | 文章链接依赖数组索引 | 内容重排可能改变旧链接含义。仅在未来需要稳定外链或内容大规模整理时评估稳定 ID 迁移。 |
| P2 | CSS 长行可读性 | 影响维护体验而非当前功能。若安排小型整理，做纯格式化并进行渲染回归。 |

## 审计验证

- 已枚举受 Git 管理的前台、资源与 `admin/` 文件，并核查 HTML 的脚本/样式引用。
- 已搜索前台与根 README 对历史 `admin/` 的引用；未发现前台运行时引用。
- 已用 Node 的 `--check` 验证 `app.js`、`reader.js`、`content.js`、`admin/admin.js` 语法通过。
- 已运行 `git diff --check`；在新增报告前无输出。

本报告不等同于发布验收：没有访问 Prod、没有使用 Token、没有触发 Admin 发布，也没有进行 GitHub Pages 的在线或浏览器渲染检查。
