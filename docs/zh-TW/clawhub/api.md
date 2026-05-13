---
read_when:
    - 建構 API 用戶端
    - 新增端點或結構描述
summary: 公開 REST API (v1) 概覽與慣例。
x-i18n:
    generated_at: "2026-05-13T02:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

基底：`https://clawhub.ai`

OpenAPI：`/api/v1/openapi.json`

## 公開目錄重用

你可以在 ClawHub 的公開讀取 API 之上建置第三方目錄、清單或搜尋介面。公開技能中繼資料和技能檔案會依據 ClawHub 的技能授權規則發布，而 API 本身有速率限制，應負責任地使用。

指南：

- 使用公開讀取端點，例如 `GET /api/v1/skills`、`GET /api/v1/search` 和 `GET /api/v1/skills/{slug}` 來取得目錄清單。
- 快取回應，並尊重 `429`、`Retry-After` 和速率限制標頭，而不是激進地輪詢。
- 顯示清單時連回標準 ClawHub 技能 URL，讓使用者可以檢查來源登錄記錄。
- 使用格式為 `https://clawhub.ai/<owner>/<slug>` 的標準頁面 URL。
- 不要暗示 ClawHub 認可、驗證或營運該第三方網站。
- 不要透過繞過公開 API 篩選器或驗證邊界來鏡像隱藏、私人或被審核封鎖的內容。

## 驗證

- 公開讀取：不需要權杖。
- 寫入 + 帳戶：`Authorization: Bearer clh_...`。

## 速率限制

感知驗證狀態的執行方式：

- 匿名請求：依 IP。
- 已驗證請求（有效的 Bearer 權杖）：依使用者儲存桶。
- 缺少/無效權杖會退回 IP 執行方式。

- 讀取：每個 IP 600/分鐘，每個金鑰 2400/分鐘
- 寫入：每個 IP 45/分鐘，每個金鑰 180/分鐘

標頭：`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`、`Retry-After`（於 429 時）。

語意：

- `X-RateLimit-Reset`：Unix epoch 秒數（絕對重設時間）
- `RateLimit-Reset`：重設前的延遲秒數
- `Retry-After`：遇到 `429` 時要等待的延遲秒數

範例 `429`：

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

用戶端處理方式：

- 存在 `Retry-After` 時優先使用。
- 否則使用 `RateLimit-Reset`，或從 `X-RateLimit-Reset` 推導延遲。
- 在重試中加入抖動。

## 端點

公開讀取：

- `GET /api/v1/search?q=...`
  - 選用篩選器：`highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 舊版別名：`nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`：`updated`（預設）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、`installsCurrent`（`installs`）、`installsAllTime`、`trending`
  - `cursor` 適用於非 `trending` 排序
  - 選用篩選器：`nonSuspiciousOnly=true`
  - 舊版別名：`nonSuspicious=true`
  - 使用 `nonSuspiciousOnly=true` 時，基於游標的頁面包含的項目數可能少於 `limit`；使用 `nextCursor` 繼續。
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

需要驗證：

- `POST /api/v1/skills`（發布，偏好 multipart）
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

僅限管理員：

- `POST /api/v1/users/reserve` 會為擁有者控制代碼保留根 slug 和私人無發布套件佔位符。

## 舊版

舊版 `/api/*` 和 `/api/cli/*` 仍可使用。請參閱 `DEPRECATIONS.md`。
