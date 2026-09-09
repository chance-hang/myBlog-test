# RELEASE — myBlog Test

## Status
Idle

当前没有代码 Release Candidate。

## Release Ready 条件
只有同时满足以下条件，状态才能改为 `Release Ready`：
1. 功能已完成并进入 Test main。
2. ChatGPT Review 通过。
3. 用户完成 Test 人工验收并明确通过。

## Release Ready 必须记录
- Source Test commit
- Source branch / main 状态
- 本次代码发布内容
- 允许同步到 Prod 的文件或代码区域
- 禁止覆盖的 Prod 文件/环境行为
- 是否影响 `content.js` 数据协议
- 是否影响 Admin 内容发布
- Prod 发布分支名
- Prod 验证清单
- 回滚参考点

## Test → Prod 代码发布原则
Prod 是独立 Workspace。Prod 本地应配置：
- `origin` → `myBlog-prod`
- `test` → `myBlog-test`

发布时由 Prod Workspace 执行 `git fetch test` 获取这里指定的 Test commit。

禁止：
- `git merge test/main` 作为常规发布方式
- 默认整库覆盖 Prod
- 把 Test 环境文案同步进 Prod
- 在 Prod 重新实现一次功能

应采用受控同步：只引入本次 Release Ready 明确批准的变化，同时保留 Prod 环境差异。

## 与内容发布的边界
文章、短记、专题、图片的日常发布属于 `myBlog-admin` 内容流程，不需要把本文件改成 Release Ready。

内容流程：Admin → Test 内容 → 人工核对 → 提升 Prod 内容。

代码流程：Test 代码 → Review → 人工验收 → Release Ready → Prod 代码发布。

两者必须分开记录。
