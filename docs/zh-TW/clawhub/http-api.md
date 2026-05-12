---
read_when:
    - 新增/變更端點
    - 偵錯 CLI ↔ 登錄庫請求
summary: HTTP API 參考（公開 + CLI 端點 + 驗證）。
x-i18n:
    generated_at: "2026-05-12T00:56:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基礎 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 底下。
舊版 `/api/...` 與 `/api/cli/...` 仍保留以維持相容性（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重用

第三方目錄可以使用公開讀取端點來列出或搜尋 ClawHub Skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回標準 ClawHub 列表（`https://clawhub.ai/<owner>/<slug>`），並避免暗示 ClawHub 為第三方網站背書。請勿嘗試在公開 API 介面之外鏡像隱藏、私有或遭審核封鎖的內容。

Web slug 捷徑會跨 registry family 解析，但 API 用戶端應使用讀取端點回傳的標準 URL，而不是自行重建路由優先順序。

## 速率限制

執行模型：

- 匿名請求：依 IP 執行。
- 已驗證請求（有效的 Bearer token）：依使用者 bucket 執行。
- 如果 token 遺失或無效，行為會退回到 IP 執行。
- 當伺服器知道原因時，已驗證寫入端點不應回傳單純的 `Unauthorized`。遺失 token、無效/已撤銷 token，以及已刪除/遭封鎖/停用帳戶，都應取得可操作的文字，讓 CLI 用戶端能告知使用者被什麼阻擋。

- 讀取：每 IP 600/分鐘，每 key 2400/分鐘
- 寫入：每 IP 45/分鐘，每 key 180/分鐘
- 下載：每 IP 30/分鐘，每 key 180/分鐘（`/api/v1/download`）

標頭：

- 舊版相容性：`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`
- 標準化：`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`
- 在 `429` 時：`Retry-After`

標頭語意：

- `X-RateLimit-Reset`：絕對 Unix epoch 秒數
- `RateLimit-Reset`：距離重設的秒數（延遲）
- `Retry-After`：在 `429` 時重試前需等待的秒數（延遲）

範例 `429` 回應：

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

用戶端指引：

- 如果 `Retry-After` 存在，請等待該秒數後再重試。
- 使用加入抖動的退避，以避免同步重試。
- 如果缺少 `Retry-After`，請退回使用 `RateLimit-Reset`（或從 `X-RateLimit-Reset` 計算）。

IP 來源：

- 預設使用 `cf-connecting-ip`（Cloudflare）作為用戶端 IP。
- ClawHub 使用可信任的轉送標頭在邊緣識別用戶端 IP。
- 如果沒有可用的可信任用戶端 IP，匿名下載請求會使用端點範圍的備用 bucket，而不是單一全域 `ip:unknown` bucket。匿名讀取/寫入請求仍使用共用的 unknown bucket，因此缺少 IP 的路由仍保持可見且保守。

## 公開端點（無需驗證）

### `GET /api/v1/search`

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數
- `highlightedOnly`（選填）：`true` 可篩選為醒目顯示的 Skills
- `nonSuspiciousOnly`（選填）：`true` 可隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選填）：`nonSuspiciousOnly` 的舊版別名

回應：

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

備註：

- 結果會依相關性順序回傳（embedding 相似度 + 精確 slug/name token 加權 + 來自下載量的人氣先驗）。
- 相關性比人氣更強。精確的 slug 或顯示名稱 token 相符，可以勝過下載量多很多但相符較鬆散的結果。
- ASCII 文字會依單字和標點邊界 token 化。例如，`personal-map` 包含獨立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜尋 `map` 時，`personal-map` 會比 `amap-jsapi-skill` 有更強的詞彙相符。
- 下載量會作為小幅 log 縮放先驗和同分判定依據，而不是主要排名訊號。當查詢文字相符較弱時，高下載量 Skills 可能排名較低。
- 視呼叫者篩選條件與目前審核狀態而定，可疑或隱藏的審核狀態可能會將某個 Skill 從公開搜尋中移除。

發布者可發現性指引：

- 將使用者實際會搜尋的詞放在顯示名稱、摘要和標籤中。只有當獨立 slug token 也是你想保留的穩定身分時，才使用它。
- 不要只是為了追逐某個查詢而重新命名 slug，除非新 slug 是更好的長期標準名稱。舊 slug 會變成重新導向別名，但標準 URL、顯示的 slug，以及未來搜尋摘要會使用新 slug。
- 重新命名別名會保留舊 URL，以及透過 registry 解析的安裝解析能力，但搜尋排名會以重新命名建立索引後的標準 Skill metadata 為準。既有統計會保留在該 Skill 上。
- 如果某個 Skill 意外不可見，請先在登入狀態下使用 `clawhub inspect <slug>` 檢查審核狀態，再變更與排名相關的 metadata。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選填）：整數（1–200）
- `cursor`（選填）：任何非 `trending` 排序的分頁游標
- `sort`（選填）：`updated`（預設）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）、`installsCurrent`（別名：`installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（選填）：`true` 可隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選填）：`nonSuspiciousOnly` 的舊版別名

備註：

- `trending` 依最近 7 天的安裝數排名（基於遙測）。
- `createdAt` 對新 Skill 爬取是穩定的；`updated` 會在既有 Skills 重新發布時變更。
- 當 `nonSuspiciousOnly=true` 時，基於游標的排序可能會在某一頁回傳少於 `limit` 的項目，因為可疑 Skills 會在頁面擷取後被篩除。
- 當存在 `nextCursor` 時，請使用它繼續分頁。頁面較短本身不代表已到結果結尾。

回應：

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

回應：

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

備註：

- 由擁有者重新命名/合併流程建立的舊 slug 會解析到標準 Skill。
- `metadata.os`：Skill frontmatter 中宣告的 OS 限制（例如 `["macos"]`、`["linux"]`）。若未宣告則為 `null`。
- `metadata.systems`：Nix system 目標（例如 `["aarch64-darwin", "x86_64-linux"]`）。若未宣告則為 `null`。
- 如果 Skill 沒有平台 metadata，`metadata` 會是 `null`。
- 只有當 Skill 被標記，或擁有者正在查看它時，才會包含 `moderation`。

### `GET /api/v1/skills/{slug}/moderation`

回傳結構化審核狀態。

回應：

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

備註：

- 擁有者與審核者可以存取隱藏 Skills 的審核詳細資料。
- 公開呼叫者只會對已標記且可見的 Skills 取得 `200`。
- 證據會對公開呼叫者遮蔽，且只有對擁有者/審核者包含原始片段。

### `POST /api/v1/skills/{slug}/report`

回報 Skill 以供審核者審查。回報屬於 Skill 層級，可選擇連結到某個版本，並會送入 Skill 回報佇列。

驗證：

- 需要 API token。

請求：

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

回應：

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

供審核者/管理員使用的 Skill 回報接收端點。

查詢參數：

- `status`（選填）：`open`（預設）、`confirmed`、`dismissed` 或 `all`
- `limit`（選填）：整數（1-200）
- `cursor`（選填）：分頁游標

回應：

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

供審核者/管理員使用，用於解決或重新開啟 Skill 回報的端點。

請求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` 和 `dismissed` 需要 `note`；將 `status` 設回 `open` 時可以省略它。傳入 `finalAction: "hide"` 搭配已 triage 的回報，可在同一個可稽核工作流程中隱藏該 Skill。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選填）：整數
- `cursor`（選填）：分頁游標

### `GET /api/v1/skills/{slug}/versions/{version}`

回傳版本 metadata + 檔案清單。

- `version.security` 會在可用時包含正規化掃描驗證狀態與掃描器詳細資料（VirusTotal + LLM）。

### `GET /api/v1/skills/{slug}/scan`

回傳 Skill 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選填）：特定版本字串。
- `tag`（選填）：解析已標記版本（例如 `latest`）。

備註：

- 如果未提供 `version` 或 `tag`，會使用最新版本。
- 包含正規化驗證狀態，以及掃描器特定詳細資料。
- `security.capabilityTags` 會在偵測到時包含確定性的 capability/風險標籤，例如 `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、`requires-oauth-token` 和 `posts-externally`。
- `security.hasScanResult` 只有在掃描器產生明確 verdict（`clean`、`suspicious` 或 `malicious`）時才會是 `true`。
- `moderation` 是目前 Skill 層級的審核快照，衍生自最新版本。
- 查詢歷史版本時，請先檢查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`，再將 `moderation` 與 `security` 視為相同版本情境。

### `GET /api/v1/skills/{slug}/file`

回傳原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

備註：

- 預設使用最新版本。
- 檔案大小限制：200KB。

### `GET /api/v1/packages`

統一目錄端點，適用於：

- Skills
- code plugins
- bundle plugins

查詢參數：

- `limit`（選填）：整數（1–100）
- `cursor`（選填）：分頁游標
- `family`（選填）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選填）：`official`、`community` 或 `private`
- `isOfficial`（選填）：`true` 或 `false`
- `executesCode`（選填）：`true` 或 `false`
- `capabilityTag`（選填）：Plugin 套件的功能篩選器
- `target` / `hostTarget`（選填）：`host:<target>` 的簡寫
- `os`、`arch`、`libc`（選填）：主機功能篩選器的簡寫
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  （選填）：環境需求標籤的 `true`/`1` 簡寫
- `externalService`、`binary`、`osPermission`（選填）：具名
  環境需求標籤的簡寫
- `artifactKind`（選填）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（選填）：`true`/`1`，顯示可透過 npm 鏡像取得的
  ClawPack 支援套件版本

注意事項：

- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定 family 的別名。
- Skill 項目仍由 Skill 登錄檔支援，且仍只能透過 `POST /api/v1/skills` 發布。
- `POST /api/v1/packages` 仍僅用於 code-plugin 和 bundle-plugin 版本發布。
- 匿名呼叫者只能看到公開套件通道。
- 已驗證呼叫者可在清單/搜尋結果中看到其所屬發布者的私人套件。
- `channel=private` 只會回傳已驗證呼叫者可讀取的套件。

### `GET /api/v1/packages/search`

跨 Skills + Plugin 套件的統一目錄搜尋。

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數（1–100）
- `family`（選填）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選填）：`official`、`community` 或 `private`
- `isOfficial`（選填）：`true` 或 `false`
- `executesCode`（選填）：`true` 或 `false`
- `capabilityTag`（選填）：Plugin 套件的功能篩選器
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary` 和
  `osPermission` 可作為常見功能標籤的簡寫
- `artifactKind`（選填）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（選填）：`true`/`1`，搜尋可透過 npm 鏡像取得的
  ClawPack 支援套件版本

注意事項：

- 匿名呼叫者只能看到公開套件通道。
- 已驗證呼叫者可搜尋其所屬發布者的私人套件。
- `channel=private` 只會回傳已驗證呼叫者可讀取的套件。
- 成品篩選器由已建立索引的功能標籤支援：
  `artifact:legacy-zip`、`artifact:npm-pack` 和 `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

回傳套件詳細中繼資料。

注意事項：

- Skills 也可以在統一目錄中透過此路由解析。
- 私人套件會回傳 `404`，除非呼叫者可讀取所屬發布者。

### `DELETE /api/v1/packages/{name}`

軟刪除套件及其所有版本發布。

注意事項：

- 需要套件擁有者、組織發布者擁有者/管理員、平台仲裁者或平台管理員的 API 權杖。

### `GET /api/v1/packages/{name}/versions`

回傳版本歷程。

查詢參數：

- `limit`（選填）：整數（1–100）
- `cursor`（選填）：分頁游標

注意事項：

- 私人套件會回傳 `404`，除非呼叫者可讀取所屬發布者。

### `GET /api/v1/packages/{name}/versions/{version}`

回傳單一套件版本，包含檔案中繼資料、相容性、
功能、驗證、成品中繼資料和掃描資料。

注意事項：

- `version.artifact.kind` 對舊式套件封存檔為 `legacy-zip`，
  對 ClawPack 支援的版本發布為 `npm-pack`。
- ClawPack 版本發布包含相容於 npm 的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 欄位。
- `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan` 會在掃描資料存在時包含。
- 私人套件會回傳 `404`，除非呼叫者可讀取所屬發布者。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

回傳套件版本的明確成品解析器中繼資料。

注意事項：

- 舊版套件版本會回傳 `legacy-zip` 成品和舊式 ZIP
  `downloadUrl`。
- ClawPack 版本會回傳 `npm-pack` 成品、npm 完整性欄位、
  `tarballUrl`，以及舊式 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它避免從共用 URL 猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確解析器路徑下載版本成品。

注意事項：

- ClawPack 版本會串流確切上傳的 npm-pack `.tgz` 位元組。
- 舊式 ZIP 版本會重新導向至 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率儲存桶。

### `GET /api/v1/packages/{name}/readiness`

回傳為未來 OpenClaw 使用所計算的就緒狀態。

就緒檢查涵蓋：

- 官方通道狀態
- 最新版本可用性
- ClawPack npm-pack 成品可用性
- 成品摘要
- 原始碼儲存庫與提交來源
- OpenClaw 相容性中繼資料
- 主機目標
- 掃描狀態

回應：

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

列出官方 OpenClaw Plugin 遷移列的仲裁者端點。

驗證：

- 需要仲裁者或管理員使用者的 API 權杖。

查詢參數：

- `phase`（選填）：`planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw` 或
  `all`（預設）。
- `limit`（選填）：整數（1-100）
- `cursor`（選填）：分頁游標

回應：

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

建立或更新官方 Plugin 遷移列的管理員端點。

驗證：

- 需要管理員使用者的 API 權杖。

請求主體：

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

注意事項：

- `bundledPluginId` 會正規化為小寫，並且是穩定的 upsert 鍵。
- `packageName` 會進行 npm 名稱正規化；規劃中的遷移可以缺少套件。
- 這只追蹤遷移就緒狀態。不會變更 OpenClaw 或產生
  ClawPacks。

### `GET /api/v1/packages/moderation/queue`

套件版本發布審查佇列的仲裁者/管理員端點。

驗證：

- 需要仲裁者或管理員使用者的 API 權杖。

查詢參數：

- `status`（選填）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（選填）：整數（1-100）
- `cursor`（選填）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、隔離、撤銷或已回報的版本發布。
- `blocked`：已隔離、已撤銷或惡意版本發布。
- `manual`：任何有手動仲裁覆寫的版本發布。
- `all`：任何有手動覆寫、非乾淨掃描狀態或套件回報的版本發布。

回應：

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

回報套件以供仲裁者審查。回報屬於套件層級，可選擇性
連結至版本。它們會匯入仲裁佇列，但本身不會自動隱藏或
封鎖下載；仲裁者應使用版本發布仲裁來
核准、隔離或撤銷成品。

驗證：

- 需要 API 權杖。

請求：

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

回應：

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

套件回報收件的仲裁者/管理員端點。

驗證：

- 需要仲裁者或管理員使用者的 API 權杖。

查詢參數：

- `status`（選填）：`open`（預設）、`confirmed`、`dismissed` 或 `all`
- `limit`（選填）：整數（1-100）
- `cursor`（選填）：分頁游標

回應：

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

套件仲裁可見性的擁有者/仲裁者端點。

驗證：

- 需要套件擁有者、發布者成員、仲裁者或
  管理員使用者的 API 權杖。

回應：

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

解析或重新開啟套件回報的仲裁者/管理員端點。

請求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` 和 `dismissed` 需要 `note`；將 `status` 設回 `open` 時可以省略。對已確認的報告傳入 `finalAction: "quarantine"` 或
`finalAction: "revoke"`，即可在同一個可稽核工作流程中套用發行審核管制。

回應：

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

供審核員/管理員使用的套件發行版本審查端點。

請求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支援的狀態：

- `approved`：已手動審查並允許。
- `quarantined`：已封鎖，等待後續處理。
- `revoked`：先前受信任的發行版本之後被封鎖。

隔離與撤銷的發行版本會讓成品下載路由回傳 `403`。
每次變更都會寫入一筆稽核日誌項目。

### `POST /api/v1/packages/backfill/artifacts`

僅限管理員使用的維護端點，用於替較舊的套件發行版本標記明確的成品類型中繼資料。

請求本文：

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

回應：

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

注意事項：

- 預設為試跑。
- 沒有 ClawPack 儲存空間的發行版本會標記為 `legacy-zip`。
- 缺少 `artifactKind` 的既有 ClawPack-backed 資料列會修復為
  `npm-pack`。
- 這不會產生 ClawPack，也不會變更成品位元組。

### `GET /api/v1/packages/{name}/file`

回傳套件檔案的原始文字內容。

查詢參數：

- `path`（必要）
- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新發行版本。
- 使用讀取速率桶，而不是下載速率桶。
- 二進位檔案會回傳 `415`。
- 檔案大小限制：200KB。
- 等待中的 VirusTotal 掃描不會封鎖讀取；惡意發行版本仍可能在其他地方被保留不提供。
- 私有套件會回傳 `404`，除非呼叫者可以讀取擁有該套件的發布者。

### `GET /api/v1/packages/{name}/download`

下載套件發行版本的舊版確定性 ZIP 封存檔。

查詢參數：

- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新發行版本。
- Skills 會重新導向至 `GET /api/v1/download`。
- Plugin/套件封存檔是具有 `package/` 根目錄的 zip 檔案，讓舊版 OpenClaw
  用戶端維持可用。
- 此路由維持僅支援 ZIP。它不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和
  `X-ClawHub-Artifact-Sha256` 標頭，供解析器完整性檢查使用。
- 純登錄中繼資料不會注入到下載的封存檔中。
- 等待中的 VirusTotal 掃描不會封鎖下載；惡意發行版本會回傳 `403`。
- 私有套件會回傳 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

回傳 ClawPack-backed 套件版本的 npm 相容 packument。

注意事項：

- 只列出已上傳 ClawPack npm-pack tarball 的版本。
- 舊版僅 ZIP 版本會有意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用 npm 相容欄位，讓使用者可依需要將 npm 指向鏡像。
- Scoped 套件 packument 同時支援 `/api/npm/@scope/name` 和 npm 的已編碼 `/api/npm/@scope%2Fname` 請求路徑。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流精確的已上傳 ClawPack tarball 位元組。

注意事項：

- 使用下載速率桶。
- 下載標頭包含 ClawHub SHA-256，加上 npm integrity/shasum 中繼資料。
- 審核管制與私有套件存取檢查仍會套用。

### `GET /api/v1/resolve`

CLI 用來將本機指紋對應到已知版本。

查詢參數：

- `slug`（必要）
- `hash`（必要）：套件指紋的 64 字元十六進位 sha256

回應：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下載技能版本的 zip。

查詢參數：

- `slug`（必要）
- `version`（選用）：semver 字串
- `tag`（選用）：標籤名稱（例如 `latest`）

注意事項：

- 如果未提供 `version` 或 `tag`，會使用最新版本。
- 軟刪除版本會回傳 `410`。
- 下載統計會依每小時不重複身分計算（API 權杖有效時使用 `userId`，否則使用 IP）。

## 驗證端點（Bearer 權杖）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證權杖並回傳使用者 handle。

### `POST /api/v1/skills`

發布新版本。

- 偏好：使用 `multipart/form-data`，搭配 `payload` JSON + `files[]` blob。
- 也接受含有 `files`（storageId-based）的 JSON 本文。
- 選用 payload 欄位：`ownerHandle`。存在時，API 會在伺服器端解析該發布者，並要求動作者具備發布者存取權。
- 選用 payload 欄位：`migrateOwner`。當它與 `ownerHandle` 同時為 `true` 時，如果動作者在目前與目標發布者上都是管理員/擁有者，既有技能可以移至該擁有者。沒有此明確選擇時，擁有者變更會被拒絕。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 發行版本。

- 需要 Bearer 權杖驗證。
- 偏好：使用 `multipart/form-data`，搭配 `payload` JSON + `files[]` blob。
- 也接受含有 `files`（storageId-based）的 JSON 本文。
- 選用 payload 欄位：`ownerHandle`。存在時，只有管理員可以代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- Plugin 套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳必須在 `package/openclaw.plugin.json` 包含它。
- Code plugin 需要 `package.json`、原始碼 repo 中繼資料、來源 commit
  中繼資料、設定 schema 中繼資料、`openclaw.compat.pluginApi`，以及
  `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
- 只有受信任的發布者可以發布到 `official` channel。
- 代表發布仍會依目標擁有者帳戶驗證 official-channel 資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除/還原技能（擁有者、審核員或管理員）。

選用 JSON 本文：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在時，`reason` 會儲存為技能審核備註，並複製到稽核日誌。
由擁有者發起的軟刪除會保留 slug 30 天，之後其他發布者可以宣告該 slug。
當此到期機制適用時，刪除回應會包含 `slugReservedUntil`。
審核員/管理員隱藏與安全移除不會以這種方式到期。

刪除回應：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

狀態碼：

- `200`：ok
- `401`：unauthorized
- `403`：forbidden
- `404`：找不到技能/使用者
- `500`：內部伺服器錯誤

### `POST /api/v1/users/publisher`

僅限管理員。確保 handle 存在一個組織發布者。如果該 handle 仍指向舊版共享使用者/個人發布者，此端點會先將其遷移到組織發布者。

- 本文：`{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

僅限管理員。為合法擁有者保留根 slug 和套件名稱，而不發布發行版本。套件名稱會變成沒有發行資料列的私有預留位置套件，讓同一擁有者之後可以將真正的 code-plugin 或 bundle-plugin 發行版本發布到該名稱。

- 本文：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 回應：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 擁有者 slug 管理端點

- `POST /api/v1/skills/{slug}/rename`
  - 本文：`{ "newSlug": "new-canonical-slug" }`
  - 回應：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文：`{ "targetSlug": "canonical-target-slug" }`
  - 回應：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注意事項：

- 這兩個端點都需要 API 權杖驗證，且只適用於技能擁有者。
- `rename` 會保留先前的 slug 作為重新導向別名。
- `merge` 會隱藏來源列表，並將來源 slug 重新導向至目標列表。

### 轉移擁有權端點

- `POST /api/v1/skills/{slug}/transfer`
  - 本文：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - 回應：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 回應（accept/reject/cancel）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 回應形狀：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

封鎖使用者並硬刪除其擁有的技能（僅限審核員/管理員）。

本文：

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

或

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

回應：

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

解除封鎖使用者並還原符合資格的技能（僅限管理員）。

本文：

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

或

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

回應：

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

變更使用者角色（僅限管理員）。

本文：

```json
{ "handle": "user_handle", "role": "moderator" }
```

或

```json
{ "userId": "users_...", "role": "admin" }
```

回應：

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

列出或搜尋使用者（僅限管理員）。

查詢參數：

- `q`（選用）：搜尋查詢
- `query`（選用）：`q` 的別名
- `limit`（選用）：結果上限（預設 20，最大 200）

回應：

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

新增/移除星號（highlight）。這兩個端點都是冪等的。

回應：

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 舊版 CLI 端點（已棄用）

仍支援較舊的 CLI 版本：

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

請參閱 `DEPRECATIONS.md` 了解移除計畫。

## 登錄探索（`/.well-known/clawhub.json`）

CLI 可以從網站探索登錄/驗證設定：

- `/.well-known/clawhub.json`（JSON，偏好）
- `/.well-known/clawdhub.json`（舊版）

Schema：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版 `CLAWDHUB_REGISTRY`）。
