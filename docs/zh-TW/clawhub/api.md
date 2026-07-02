---
read_when:
    - 建構 API 用戶端
    - 新增端點或結構描述
summary: Public REST API (v1) 概觀與慣例。
x-i18n:
    generated_at: "2026-07-02T17:29:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

基底：`https://clawhub.ai`

OpenAPI：`/api/v1/openapi.json`

## 公開目錄重用

你可以在 ClawHub 的公開讀取 API 之上建構第三方目錄、索引或搜尋介面。公開技能中繼資料與技能檔案會依 ClawHub 的技能授權規則發布，而 API 本身有速率限制，應負責任地取用。

指南：

- 使用公開讀取端點，例如 `GET /api/v1/skills`、`GET /api/v1/search` 和 `GET /api/v1/skills/{slug}` 來產生目錄清單。
- 快取回應，並遵守 `429`、`Retry-After` 與速率限制標頭，而不是激進輪詢。
- 顯示清單時連回標準 ClawHub 技能 URL，讓使用者可以檢視來源登錄紀錄。
- 使用格式為 `https://clawhub.ai/<owner>/skills/<slug>` 的標準頁面 URL。
- 不要暗示 ClawHub 認可、驗證或營運該第三方網站。
- 不要透過繞過公開 API 篩選器或驗證邊界來鏡像隱藏、私有或遭審核封鎖的內容。

## 驗證

- 公開讀取：不需要權杖。
- 寫入 + 帳戶：`Authorization: Bearer clh_...`。

## 速率限制

可感知驗證狀態的強制執行：

- 匿名要求：依 IP。
- 已驗證要求（有效 Bearer 權杖）：依使用者配額桶。
- 缺少/無效權杖會退回依 IP 強制執行。

- 讀取：每 IP 3000/分鐘，每金鑰 12000/分鐘
- 寫入：每 IP 300/分鐘，每金鑰 3000/分鐘
- 下載：每 IP 1200/分鐘，每金鑰 6000/分鐘

標頭：`X-RateLimit-Limit`、`X-RateLimit-Reset`、`RateLimit-Limit`、`RateLimit-Reset`；
`X-RateLimit-Remaining`、`RateLimit-Remaining` 和 `Retry-After` 會包含在 `429` 中。

語意：

- `X-RateLimit-Reset`：Unix epoch 秒數（絕對重設時間）
- `RateLimit-Reset`：距離重設的延遲秒數
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：存在時為精確剩餘配額；分片處理的成功要求會省略它，而不是回傳近似的全域值
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

用戶端處理：

- 存在 `Retry-After` 時優先使用。
- 否則使用 `RateLimit-Reset`，或從 `X-RateLimit-Reset` 推導延遲。
- 在重試中加入抖動。

## 錯誤

- v1 錯誤是純文字（`text/plain; charset=utf-8`），包括 `400`、`401`、`403`、`404`、`429` 以及遭封鎖下載的回應。
- 未知查詢參數會因相容性而被忽略。
- 已知查詢參數若值無效，會回傳 `400`。

## 端點

公開讀取：

- `GET /api/v1/search?q=...`
  - 選用篩選器：`highlightedOnly=true`、`nonSuspiciousOnly=true`
  - 舊版別名：`nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`：`updated`（預設）、`recommended`（`default`）、`createdAt`（`newest`）、`downloads`、`stars`（`rating`）、舊版安裝別名 `installsCurrent`/`installs`/`installsAllTime` 對應到 `downloads`、`trending`
  - 無效的 `sort` 值會回傳 `400`
  - `cursor` 適用於非 `trending` 排序
  - 選用篩選器：`nonSuspiciousOnly=true`
  - 舊版別名：`nonSuspicious=true`
  - 使用 `nonSuspiciousOnly=true` 時，基於游標的頁面包含的項目數可能少於 `limit`；使用 `nextCursor` 繼續。
  - `recommended` 使用互動與近期性訊號。
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - 託管技能會回傳確定性的 ZIP 位元組。
  - 目前以 GitHub 為後端且掃描結果為 `clean` 或 `suspicious` 的技能，會回傳 JSON `public-github` 交接描述元，而不是 ClawHub 位元組。
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - 託管技能會以已儲存檔案匯出。
  - 目前以 GitHub 為後端且掃描結果為 `clean` 或 `suspicious` 的技能，會以 `public-github` 交接描述元匯出。
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`：`updated`（預設）、`recommended`、`downloads`、舊版別名 `installs`
  - 無效的 `sort` 值會回傳 `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`：`recommended`（預設）、`downloads`、`updated`、舊版別名 `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

需要驗證：

- `POST /api/v1/skills`（發布，建議 multipart）
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

- `POST /api/v1/users/reserve` 會為擁有者帳號保留根 slug 和私有未發布套件佔位符。

## 舊版

舊版 `/api/*` 和 `/api/cli/*` 仍可使用。請參閱 `DEPRECATIONS.md`。
