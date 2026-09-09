# ACTIVE TASK — myBlog Test

## Status
Human Acceptance Fix

## 当前任务
修复 Blog 内容协议 Phase A 合并后的人工作站验收失败。只修复链接兼容问题，不进入 Prod。

原计划：
`docs/plans/2026-09-09-content-protocol-phase-a-test-compatibility.md`

## 人工验收失败证据
2026-09-09，Test GitHub Pages 实际访问：
`post.html?id=article-0`

页面显示“没有找到这篇记录”。因此 Phase A **验收不通过**，禁止进入 Prod。

## 已定位原因
当前 `reader.js` 的 legacy URL 正则是：
`/^(article|topic|note)-(\d+)$/`

但随后却用 `collections[legacyMatch[1]]` 取集合；`collections` 的键是 `article/topic/note`，所以这一点本身可取到对应集合。请不要凭描述直接改代码，先在最新 main 上复现并检查实际运行数据。

重点检查：Phase A 的 JSON 加载成功后，`content` 条目带稳定 ID；旧 URL `article-0` 理论上仍应按数组下标读取 `content.articles[0]`。实际 GitHub Pages 显示未找到，说明本地浏览器验证与真实部署存在差异，必须查清真实根因（包括缓存/脚本版本、加载时序、实际部署文件、URL 解析），不能只做猜测修补。

## Codex 修复要求
1. 当前仓库必须为 `myBlog-test`，工作区干净并位于最新 `main`。
2. `git pull --ff-only origin main` 后重新读取 `AGENTS.md`、本文件和原 Plan。
3. 从最新 main 创建 `codex/content-protocol-phase-a-human-acceptance-fix`。
4. 先以真实失败 URL `post.html?id=article-0` 为基准复现/定位；同时检查 `topic-0`、`note-0` 和稳定 ID URL。
5. 修复必须保证：
   - `article-0` / `topic-0` / `note-0` 等旧数组下标链接继续正确打开原条目；
   - 稳定 ID 链接继续正常；
   - JSON 正常加载和 JSON 失败后的 legacy 回退都兼容上述两种链接；
   - 不改变内容、排序、视觉和协议数据。
6. 检查并处理 GitHub Pages 静态资源缓存版本问题：如果 HTML 仍引用旧 `app.js?v=...` / `reader.js?v=...`，本阶段应采用最小、明确的版本参数更新，确保部署后浏览器不会继续执行 Phase A 前的缓存脚本。不要引入构建系统。
7. 增加可重复验证，至少覆盖真实旧 URL 形式 `article-0`、`topic-0`、`note-0`，避免再次只验证新链接。
8. 不碰 Prod、独立 Admin、历史 `admin/`；不使用 PAT；不做无关重构。
9. 完成后 push 分支并停止，等待 ChatGPT Review；不要合并 main。

## 必须报告
- 根因，不得只说“已修复”
- 分支、base SHA、最终 commit SHA
- 修改文件
- `article-0` / `topic-0` / `note-0` 真实兼容验证
- 至少一个稳定 ID 链接验证
- JSON 正常路径与 legacy 回退路径验证
- 是否更新静态资源版本参数及原因
- `node --check` / `git diff --check` 等结果
- push、工作区状态

## 门禁
本修复经 ChatGPT Review、合并 Test main，并由用户重新完成 Test GitHub Pages 人工验收之前，**不得开始任何 Prod 兼容发布**。
