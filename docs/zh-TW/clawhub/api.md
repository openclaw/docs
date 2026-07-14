---
read_when:
    - 建置 API 用戶端
    - 新增端點或結構描述
summary: 公開 REST API（v1）概觀與慣例。
x-i18n:
    generated_at: "2026-07-14T13:29:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

基底：`https://clawhub.ai`

OpenAPI：`/api/v1/openapi.json`

## 公開目錄重用

你可以在 ClawHub 的公開唯讀 API 之上建置第三方目錄、索引或搜尋介面。公開的 Skill 中繼資料和 Skill 檔案會依照 ClawHub 的 Skill 授權規則發布，而 API 本身設有速率限制，應以負責任的方式使用。

準則：

- 使用 `GET /api/v1/skills`、`GET /api/v1/search` 和 `GET /api/v1/skills/{slug}` 等公開唯讀端點取得目錄清單。
- 快取回應，並遵守 `429`、`Retry-After` 和速率限制標頭，而非頻繁輪詢。
- 顯示清單時，連結回 ClawHub 的標準 Skill URL，讓使用者可以檢視來源登錄記錄。
- 使用格式為 `https://clawhub.ai/<owner>/skills/<slug>` 的標準頁面 URL。
- 不得暗示 ClawHub 背書、驗證或營運該第三方網站。
- 不得繞過公開 API 篩選器或驗證邊界，以鏡像隱藏、私人或遭管理封鎖的內容。

## 驗證

- 公開讀取：不需要權杖。
- 寫入與帳戶：`Authorization: Bearer clh_...`。

## 速率限制

依驗證狀態執行限制：

- 匿名請求：依 IP。
- 已驗證的請求（有效的 Bearer 權杖）：依使用者配額區。
- 缺少或無效的權杖會退回使用 IP 限制。

- 讀取：每個 IP 每分鐘 3000 次，每個金鑰每分鐘 12000 次
- 寫入：每個 IP 每分鐘 300 次，每個金鑰每分鐘 3000 次
- 下載：每個 IP 每分鐘 1200 次，每個金鑰每分鐘 6000 次

標頭：`X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`；
`X-RateLimit-Remaining`、`RateLimit-Remaining` 和 `Retry-After` 會包含在 `429` 中。

語意：

- `X-RateLimit-Reset`：Unix 紀元秒數（絕對重設時間）
- `RateLimit-Reset`：距離重設的延遲秒數
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：存在時表示確切的剩餘配額；分片處理的成功請求會省略此值，而不會傳回近似的
  全域值
- `Retry-After`：收到 `429` 時應等待的延遲秒數

`429` 範例：

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

- 若有 `Retry-After`，優先使用它。
- 否則使用 `RateLimit-Reset`，或從 `X-RateLimit-Reset` 推算延遲時間。
- 在重試時間中加入隨機抖動。

## 錯誤

- v1 錯誤為純文字（`text/plain; charset=utf-8`），包括 `400`、
  `401`、`403`、`404`、`429` 和遭封鎖的下載回應。
- 為了相容性，未知的查詢參數會被忽略。
- 已知查詢參數若含有無效值，會傳回 `400`。

## 端點

公開讀取：

- `GET /api/v1/search?q=...`
  - 選用篩選器：`highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 舊版別名：`nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`：`updated`（預設）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`），舊版安裝別名 `installsCurrent`/`installs`/`installsAllTime` 會對應至 `downloads`、`trending`
  - 無效的 `sort` 值會傳回 `400`
  - `cursor` 適用於非 `trending` 排序
  - 選用篩選器：`nonSuspiciousOnly=true`
  - 舊版別名：`nonSuspicious=true`
  - 使用 `nonSuspiciousOnly=true` 時，以游標為基礎的頁面可能少於 `limit` 個項目；請使用 `nextCursor` 繼續。
  - `recommended` 會使用互動度和時效性訊號。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - 託管的 Skill 會傳回具確定性的 ZIP 位元組。
  - 目前由 GitHub 支援，且掃描結果為 `clean` 或 `suspicious` 的 Skill，會傳回
    JSON `public-github` 交接描述元，而非 ClawHub 位元組。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - 託管的 Skill 會以儲存的檔案形式匯出。
  - 目前由 GitHub 支援，且掃描結果為 `clean` 或 `suspicious` 的 Skill，會匯出為
    `public-github` 交接描述元。
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`：`updated`（預設）、`recommended`、`downloads`，舊版別名 `installs`
  - 無效的 `sort` 值會傳回 `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`：`recommended`（預設）、`downloads`、`updated`，舊版別名 `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

需要驗證：

- `POST /api/v1/skills`（發布，建議使用 multipart）
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

僅限管理員：

- `POST /api/v1/users/reserve` 會為擁有者代號保留根 slug 和沒有發行版本的私人套件預留位置。

## 舊版

舊版 `/api/*` 和 `/api/cli/*` 仍可使用。請參閱 `DEPRECATIONS.md`。
