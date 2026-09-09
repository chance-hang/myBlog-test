# ACTIVE TASK — myBlog Test

## Status
Review Fix

## 当前任务
对 Blog 内容协议 Phase A 做一次 Review 修正，不扩大范围。

原计划：
`docs/plans/2026-09-09-content-protocol-phase-a-test-compatibility.md`

## Review 发现
当前 `app.js` 与 `scripts/verify-content.mjs` 把每类条目的字段集合写死为“精确相等”，并把文章 `cover` 视为必填。这与已通过 Review 的 Admin 内容协议设计不一致：
- `cover` 是文章可选字段；
- `imageRefs` 是文章 / 短记 / 专题可选字段；
- 写入协议允许这些可选字段存在，但未知字段仍应拒绝。

如果现在直接合并，当前这批迁移数据虽然能通过，但下一阶段一旦合法出现无 `cover` 的文章或加入 `imageRefs`，前台校验和验证脚本都会把合法 `content.json` 判为无效并回退 legacy，形成协议漂移。

## Codex 修正要求
1. 保持当前分支 `codex/content-protocol-phase-a-test-compatibility`，不要新建分支。
2. 先 `git pull --ff-only origin codex/content-protocol-phase-a-test-compatibility`，随后重新读取本文件与原 Plan。
3. 仅修正协议校验：区分 required / optional / unknown fields。
4. 文章 required：`id,date,type,category,reading,title,summary,body`；optional：`cover,imageRefs`。
5. 短记 required：`id,date,label,category,text`；optional：`imageRefs`。
6. 专题 required：`id,date,title,status,text`；optional：`category,imageRefs`。
7. 未知字段仍必须拒绝；required 字段仍必须存在且满足现有基本类型/非空约束。
8. `imageRefs` 如出现，应至少校验为数组；本阶段不必实现完整图片路径/哈希语义校验，避免范围扩大。
9. legacy 回退校验必须继续兼容现有 `content.js`，不得要求 legacy 出现 `id` 或新可选字段。
10. 同步修正 `scripts/verify-content.mjs`，使静态验证与前台协议一致；当前迁移内容与顺序不得改变。
11. 重新运行 `node scripts/verify-content.mjs`、`node --check app.js`、`node --check reader.js`、`git diff --check`；如已有浏览器验证脚本/步骤，复查 JSON 正常路径与 legacy 回退。
12. commit + push 当前分支后停止，不合并 main，不碰 Prod/Admin。

## 完成报告
中文报告：
- 修正 commit SHA
- 修改文件
- required / optional / unknown 字段校验结果
- `cover` 缺失与 `imageRefs` 合法存在时的验证结果
- 原有 JSON / legacy 回退 / 新旧链接是否仍正常
- 静态验证结果
- push 与工作区状态
