---
read_when:
    - 构建 API 客户端
    - 添加端点或模式
summary: 公共 REST API（v1）概览和约定。
x-i18n:
    generated_at: "2026-06-30T13:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

基础地址：`https://clawhub.ai`

OpenAPI：`/api/v1/openapi.json`

## 公共目录复用

你可以基于 ClawHub 的公共读取 API 构建第三方目录、索引或搜索界面。公共技能元数据和技能文件会按 ClawHub 的技能许可规则发布，而 API 本身受速率限制，应负责任地使用。

指南：

- 使用公共读取端点，例如 `GET /api/v1/skills`、`GET /api/v1/search` 和 `GET /api/v1/skills/{slug}` 来生成目录列表。
- 缓存响应，并遵守 `429`、`Retry-After` 和速率限制标头，而不是高频轮询。
- 显示列表时链接回规范的 ClawHub 技能 URL，以便用户检查源注册表记录。
- 使用形如 `https://clawhub.ai/<owner>/skills/<slug>` 的规范页面 URL。
- 不要暗示 ClawHub 背书、验证或运营该第三方站点。
- 不要通过绕过公共 API 过滤器或身份验证边界来镜像隐藏、私有或被审核屏蔽的内容。

## 身份验证

- 公共读取：不需要令牌。
- 写入 + 账户：`Authorization: Bearer clh_...`。

## 速率限制

感知身份验证的强制执行：

- 匿名请求：按 IP。
- 已身份验证请求（有效 Bearer 令牌）：按用户桶。
- 缺失/无效令牌会回退到 IP 强制执行。

- 读取：每 IP 3000/分钟，每密钥 12000/分钟
- 写入：每 IP 300/分钟，每密钥 3000/分钟
- 下载：每 IP 1200/分钟，每密钥 6000/分钟

标头：`X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`；
`X-RateLimit-Remaining`、`RateLimit-Remaining` 和 `Retry-After` 会在 `429` 中包含。

语义：

- `X-RateLimit-Reset`：Unix 纪元秒（绝对重置时间）
- `RateLimit-Reset`：距离重置的延迟秒数
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：存在时表示精确剩余额度；分片的成功请求会省略它，而不是返回近似的全局值
- `Retry-After`：遇到 `429` 时需要等待的延迟秒数

`429` 示例：

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

客户端处理：

- 存在 `Retry-After` 时优先使用它。
- 否则使用 `RateLimit-Reset`，或从 `X-RateLimit-Reset` 推导延迟。
- 为重试添加抖动。

## 错误

- v1 错误是纯文本（`text/plain; charset=utf-8`），包括 `400`、`401`、`403`、`404`、`429` 和被阻止的下载响应。
- 未知查询参数会被忽略以保持兼容性。
- 已知查询参数若值无效会返回 `400`。

## 端点

公共读取：

- `GET /api/v1/search?q=...`
  - 可选过滤器：`highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 旧版别名：`nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`：`updated`（默认）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`），旧版安装别名 `installsCurrent`/`installs`/`installsAllTime` 映射到 `downloads`，`trending`
  - 无效的 `sort` 值会返回 `400`
  - `cursor` 适用于非 `trending` 排序
  - 可选过滤器：`nonSuspiciousOnly=true`
  - 旧版别名：`nonSuspicious=true`
  - 使用 `nonSuspiciousOnly=true` 时，基于游标的页面包含的条目可能少于 `limit`；使用 `nextCursor` 继续。
  - `recommended` 使用互动和近期性信号。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - 托管技能返回确定性的 ZIP 字节。
  - 当前由 GitHub 支持且扫描结果为 `clean` 或 `suspicious` 的技能会返回 JSON `public-github` 交接描述符，而不是 ClawHub 字节。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - 托管技能会导出为已存储文件。
  - 当前由 GitHub 支持且扫描结果为 `clean` 或 `suspicious` 的技能会导出为 `public-github` 交接描述符。
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`：`updated`（默认）、`recommended`、`downloads`，旧版别名 `installs`
  - 无效的 `sort` 值会返回 `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`：`recommended`（默认）、`downloads`、`updated`，旧版别名 `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

需要身份验证：

- `POST /api/v1/skills`（发布，首选 multipart）
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

仅管理员：

- `POST /api/v1/users/reserve` 会为所有者 handle 保留根 slug 和私有未发布包占位符。

## 旧版

旧版 `/api/*` 和 `/api/cli/*` 仍然可用。参见 `DEPRECATIONS.md`。
