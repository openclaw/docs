---
read_when:
    - 构建 API 客户端
    - 添加端点或模式
summary: 公共 REST API（v1）概览和约定。
x-i18n:
    generated_at: "2026-05-12T23:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

基础地址：`https://clawhub.ai`

OpenAPI：`/api/v1/openapi.json`

## 公共目录复用

你可以基于 ClawHub 的公共读取 API 构建第三方目录、索引或搜索界面。公共 Skills 元数据和 Skills 文件会按 ClawHub 的 Skills 许可规则发布，而 API 本身有速率限制，应负责任地使用。

指南：

- 使用公共读取端点，例如 `GET /api/v1/skills`、`GET /api/v1/search` 和 `GET /api/v1/skills/{slug}` 来获取目录列表。
- 缓存响应，并遵守 `429`、`Retry-After` 和速率限制标头，避免激进轮询。
- 展示列表时链接回规范的 ClawHub Skills URL，以便用户检查源注册表记录。
- 使用形如 `https://clawhub.ai/<owner>/<slug>` 的规范页面 URL。
- 不要暗示 ClawHub 认可、验证或运营该第三方网站。
- 不要通过绕过公共 API 过滤器或认证边界来镜像隐藏、私有或被审核拦截的内容。

## 认证

- 公共读取：不需要令牌。
- 写入 + 账号：`Authorization: Bearer clh_...`。

## 速率限制

感知认证的执行方式：

- 匿名请求：按 IP。
- 已认证请求（有效 Bearer 令牌）：按用户桶。
- 缺失/无效令牌会回退到按 IP 执行。

- 读取：每 IP 600/分钟，每 key 2400/分钟
- 写入：每 IP 45/分钟，每 key 180/分钟

标头：`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`、`Retry-After`（在 429 时）。

语义：

- `X-RateLimit-Reset`：Unix epoch 秒（绝对重置时间）
- `RateLimit-Reset`：距离重置的延迟秒数
- `Retry-After`：在 `429` 时等待的延迟秒数

示例 `429`：

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

## 端点

公共读取：

- `GET /api/v1/search?q=...`
  - 可选过滤器：`highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 旧版别名：`nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`：`updated`（默认）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、`installsCurrent`（`installs`）、`installsAllTime`、`trending`
  - `cursor` 适用于非 `trending` 排序
  - 可选过滤器：`nonSuspiciousOnly=true`
  - 旧版别名：`nonSuspicious=true`
  - 使用 `nonSuspiciousOnly=true` 时，基于 cursor 的页面包含的条目可能少于 `limit`；使用 `nextCursor` 继续。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

需要认证：

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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

仅限管理员：

- `POST /api/v1/users/reserve` 为所有者 handle 保留根 slug 和私有的无发布包占位符。

## 旧版

旧版 `/api/*` 和 `/api/cli/*` 仍可用。参见 `DEPRECATIONS.md`。
