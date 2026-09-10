# ACTIVE TASK — myBlog Test

## Status
Plan Ready for Implementation

## 当前状态
Blog 内容协议 Phase A 已完成并通过 Test 真实 GitHub Pages 人工验收；其 Release Ready 记录继续有效，且仍由 `myBlog-prod` 独立 Workspace 按 `docs/RELEASE.md` 执行。

本仓库现进入新的 Test-only Markdown Renderer 修复阶段，当前仅冻结实施计划，尚未修改前台业务代码或内容数据。

## 当前任务
执行计划：`docs/plans/2026-09-10-unified-markdown-renderer.md`

阶段：**Plan Ready for Implementation**。

后续实现必须严格遵守该 Plan：在一个完整功能阶段内以本地固定版本的 `marked` 与 `DOMPurify` 替换共用详情路径中的自研 regex renderer，并完成测试、Review 与 Test GitHub Pages 人工验收。未完成这些门槛前，不得将此 renderer 变更进入 Prod。

## 本地注意
此前百度同步曾在本地生成未跟踪的 `*.baiduyun.uploading.cfg`。在下一次 Test Codex 任务开始前，必须先处理工作区干净问题；不要擅自删除/提交临时文件。可后续单独评估 `.gitignore` 治理。
