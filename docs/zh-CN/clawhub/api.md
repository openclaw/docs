---
read_when:
    - 构建 API 客户端
    - 添加端点或架构
summary: 公共 REST API（v1）概览和约定。
x-i18n:
    generated_at: "2026-07-05T11:07:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## 公共目录复用

你可以基于 ClawHub 的公共读取 API 构建第三方目录、索引或搜索界面。公共 skill 元数据和 skill 文件按照 ClawHub 的 skill 许可规则发布，而 API 本身受速率限制，应负责任地使用。

指南：

- 使用公共读取端点，例如 `GET /api/v1/skills`、`GET /api/v1/search` 和 `GET /api/v1/skills/{slug}` 来获取目录列表。
- 缓存响应，并遵守 `429`、`Retry-After` 和速率限制标头，而不是激进轮询。
- 展示列表时链接回规范的 ClawHub skill URL，以便用户检查源注册表记录。
- 使用形如 `https://clawhub.ai/<owner>/skills/<slug>` 的规范页面 URL。
- 不要暗示 ClawHub 认可、验证或运营该第三方站点。
- 不要通过绕过公共 API 过滤器或认证边界来镜像隐藏、私有或被审核拦截的内容。

## 认证

- 公共读取：不需要令牌。
- 写入 + 账户：`Authorization: Bearer clh_...`。

## 速率限制

感知认证的强制执行：

- 匿名请求：按 IP。
- 已认证请求（有效 Bearer token）：按用户桶。
- 缺失/无效令牌会回退到 IP 强制执行。

- 读取：每 IP 3000/min，每 key 12000/min
- 写入：每 IP 300/min，每 key 3000/min
- 下载：每 IP 1200/min，每 key 6000/min

标头：`X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`；
`X-RateLimit-Remaining`、`RateLimit-Remaining` 和 `Retry-After` 会包含在 `429` 中。

语义：

- `X-RateLimit-Reset`：Unix epoch 秒（绝对重置时间）
- `RateLimit-Reset`：距离重置的延迟秒数
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：存在时表示精确的剩余额度；分片的成功请求会省略它，而不是返回近似的全局值
- `Retry-After`：在 `429` 上等待的延迟秒数

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

## 错误

- v1 错误是纯文本（`text/plain; charset=utf-8`），包括 `400`、`401`、`403`、`404`、`429` 和被拦截下载的响应。
- 未知查询参数会被忽略，以保持兼容性。
- 已知查询参数的值无效时返回 `400`。

## 端点

公共读取：

- `GET /api/v1/search?q=...`
  - 可选过滤器：`highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 旧版别名：`nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`：`updated`（默认）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`），旧版安装别名 `installsCurrent`/`installs`/`installsAllTime` 映射到 `downloads`，`trending`
  - 无效的 `sort` 值返回 `400`
  - `cursor` 适用于非 `trending` 排序
  - 可选过滤器：`nonSuspiciousOnly=true`
  - 旧版别名：`nonSuspicious=true`
  - 使用 `nonSuspiciousOnly=true` 时，基于游标的页面可能包含少于 `limit` 的项目；使用 `nextCursor` 继续。
  - `recommended` 使用参与度和新近度信号。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - 托管 skill 返回确定性的 ZIP 字节。
  - 当前由 GitHub 支持且扫描结果为 `clean` 或 `suspicious` 的 skill 会返回 JSON `public-github` 交接描述符，而不是 ClawHub 字节。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - 托管 skill 会以已存储文件的形式导出。
  - 当前由 GitHub 支持且扫描结果为 `clean` 或 `suspicious` 的 skill 会导出为 `public-github` 交接描述符。
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`：`updated`（默认）、`recommended`、`downloads`，旧版别名 `installs`
  - 无效的 `sort` 值返回 `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`：`recommended`（默认）、`downloads`、`updated`，旧版别名 `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

仅限管理员：

- `POST /api/v1/users/reserve` 会为所有者 handle 保留根 slug 和私有未发布包占位符。

## 旧版

旧版 `/api/*` 和 `/api/cli/*` 仍然可用。请参阅 `DEPRECATIONS.md`。
