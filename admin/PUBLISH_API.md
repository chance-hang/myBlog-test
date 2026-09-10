# Publish API Contract

> 本目录是 Legacy / 备用维护台实现；独立 `myBlog-admin` 是当前正式维护入口。

维护台前端只接受同源、受登录会话保护的发布服务。

## GET /api/health

成功返回 HTTP 200：

```json
{"ok":true,"authenticated":true}
```

未登录必须返回 401。前端仅在接口成功时显示“发布服务已连接”。

## POST /api/publish

请求体：

```json
{
  "target":"test",
  "contentType":"articles",
  "item":{},
  "allContent":{}
}
```

服务端必须：

1. 验证 HttpOnly、Secure、SameSite 会话 Cookie。
2. 校验 CSRF、Origin 和 Content-Type。
3. 仅允许 `target=test|production`。
4. 将目标硬映射为 `chance-hang/myBlog-test` 或 `chance-hang/myBlog-prod`，禁止接受客户端仓库名。
5. 使用分别受限的服务端 Token，权限仅为目标仓库 Contents: write。
6. 从 `allContent` 生成博客内容文件，先读取远端 SHA，再写入。
7. 记录发布账号、目标、提交 SHA、时间和可回滚版本，但不记录 Token、登录密钥或正文之外的本地数据。
8. 正式发布前再次检查服务端确认令牌，不只依赖前端的“正式发布”文字。
9. 对登录、发布和失败请求限流。

成功返回：

```json
{"ok":true,"commit":"abc12345","siteUrl":"https://example/"}
```

失败返回非 2xx 和安全的错误说明，不回显密钥或 GitHub 原始响应头。
