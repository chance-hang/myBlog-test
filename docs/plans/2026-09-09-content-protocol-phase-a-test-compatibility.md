# Blog 内容协议 Phase A — Test 前台只读兼容层

状态：Ready for Codex
日期：2026-09-09

## 背景

独立 `myBlog-admin` 已完成内容协议与安全发布设计：未来以版本化严格 `content.json` 作为内容源，稳定 ID 替代数组下标作为长期链接标识；legacy `content.js` 在迁移期只作为只读兼容源。

本阶段只在 `myBlog-test` 建立最小、可回退的前台兼容基础。**不改 Admin 写入，不碰 Prod，不退役 `content.js`。**

## 目标

1. 为当前 Test legacy 内容生成一个严格 JSON 的候选 `content.json`，保持现有文章、短记、专题内容语义和顺序。
2. 为所有现有条目分配稳定、不可变 ID；ID 必须可重复生成/固定保存，不能每次运行变化。
3. 前台加载逻辑优先读取并校验 `content.json`；当 JSON 不存在、读取失败或协议校验失败时，安全回退到现有 `content.js`，不得把空数据当成功。
4. 文章/短记/专题详情解析新增稳定 ID 路径，同时保留现有数组下标/旧 URL 行为，保证旧链接继续可用。
5. 不改变页面视觉设计、Test 标签、内容文本和正常排序。
6. 为协议校验和 legacy→JSON 转换提供可重复执行的静态验证方式；不得依赖线上执行 legacy JS、`eval` 或 `Function`。

## 协议边界

候选 `content.json` 顶层：

```json
{
  "schemaVersion": 1,
  "articles": [],
  "notes": [],
  "topics": []
}
```

字段以已通过 Review 的 Admin 设计为准。迁移时不得为了满足新协议擅自改写正文；缺失的新元数据应采用明确、可审查的迁移规则，并在完成报告中列出。

稳定 ID 采用 `<kind>_<ULID>` 形式并写入数据文件；既有内容的 ID 一经本阶段合并后即视为冻结，不因排序、标题或日期变化重新生成。

## 实施边界

允许修改 Test 前台为完成兼容所必需的文件，例如：
- `content.json`（新增）
- `app.js`
- `reader.js`
- 必要的最小 HTML 引用/启动调整
- 与本阶段直接相关的测试/验证脚本或文档

原则：优先最小改动，不为了本任务重构现有健康结构。

禁止：
- 修改 `myBlog-prod`
- 修改 `myBlog-admin`
- 修改历史 `admin/`
- 删除或改成可写的 `content.js`
- 改视觉样式/品牌文案
- 引入框架或构建系统
- 使用真实 PAT / GitHub 内容发布

## 必须验证

至少覆盖：
1. `content.json` 严格 JSON + schemaVersion/字段/重复 ID 基础校验。
2. JSON 中三类内容数量、顺序、正文关键字段与 legacy 来源一致。
3. 正常情况下前台使用 `content.json`。
4. 模拟 JSON 读取/校验失败时仍可回退 legacy 内容，且不显示空站。
5. 新稳定 ID 详情链接可打开正确条目。
6. 现有旧链接/数组下标入口仍指向原条目。
7. `node --check` 覆盖修改后的 JS。
8. `git diff --check` 通过。

如果无法在纯静态 GitHub Pages 环境中可靠实现“fetch JSON 失败后再加载 legacy script”，应停止并报告，不得通过 `eval`/`Function` 或复制两套业务逻辑绕过。

## 分支与提交

- Branch：`codex/content-protocol-phase-a-test-compatibility`
- 建议一个功能阶段内完成；必要时可分多个本地 commit，但只在整个 Phase A 可 Review 时 push。
- Commit message 可按实际变更概括，不要求机械固定。

完成后 push 分支并停止，等待 ChatGPT Review；不要合并 main，不要同步 Prod。

## 人工验收

ChatGPT Review 通过后，需要用户在 Test 页面做一次实际视觉/链接验收；验收通过前不得进入 Prod 兼容发布。
