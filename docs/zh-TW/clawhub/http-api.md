---
read_when:
    - 新增/變更端點
    - 偵錯 CLI ↔ 登錄庫請求
summary: HTTP API 參考（公開 + CLI 端點 + 身分驗證）。
x-i18n:
    generated_at: "2026-05-12T04:09:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基底 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 之下。
舊版 `/api/...` 和 `/api/cli/...` 仍保留以維持相容性（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重用

第三方目錄可以使用公開讀取端點來列出或搜尋 ClawHub skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回標準 ClawHub 清單（`https://clawhub.ai/<owner>/<slug>`），並避免暗示 ClawHub 為第三方網站背書。請勿嘗試在公開 API 介面之外鏡像隱藏、私有或遭審核封鎖的內容。

網頁 slug 捷徑會跨 registry 家族解析，但 API 用戶端應使用
讀取端點回傳的標準 URL，而不是自行重建路由
優先順序。

## 速率限制

執行模型：

- 匿名請求：依 IP 強制執行。
- 已驗證請求（有效 Bearer token）：依使用者 bucket 強制執行。
- 如果 token 缺失/無效，行為會退回到 IP 強制執行。
- 已驗證的寫入端點在伺服器知道原因時，不應回傳單純的 `Unauthorized`。
  缺失 token、無效/已撤銷 token，以及已刪除/封鎖/停用的帳號，都應取得可採取行動的文字，讓 CLI
  用戶端可以告知使用者被阻擋的原因。

- 讀取：每 IP 600/min，每 key 2400/min
- 寫入：每 IP 45/min，每 key 180/min
- 下載：每 IP 30/min，每 key 180/min（`/api/v1/download`）

標頭：

- 舊版相容性：`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`
- 標準化：`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`
- 發生 `429` 時：`Retry-After`

標頭語意：

- `X-RateLimit-Reset`：絕對 Unix epoch 秒數
- `RateLimit-Reset`：距離重設的秒數（延遲）
- `Retry-After`：在 `429` 時重試前要等待的秒數（延遲）

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

- 如果存在 `Retry-After`，請等待該秒數後再重試。
- 使用加入 jitter 的 backoff，以避免同步重試。
- 如果缺少 `Retry-After`，請退回使用 `RateLimit-Reset`（或從 `X-RateLimit-Reset` 計算）。

IP 來源：

- 預設使用 `cf-connecting-ip`（Cloudflare）作為用戶端 IP。
- ClawHub 使用受信任的轉送標頭，在邊緣識別用戶端 IP。
- 如果沒有可用的受信任用戶端 IP，匿名下載請求會使用端點範圍的 fallback bucket，而不是單一全域 `ip:unknown` bucket。匿名讀取/寫入請求仍使用共享的未知 bucket，讓缺少 IP 的路由保持可見且保守。

## 公開端點（無需驗證）

### `GET /api/v1/search`

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數
- `highlightedOnly`（選填）：`true` 可篩選為 highlighted skills
- `nonSuspiciousOnly`（選填）：`true` 可隱藏可疑（`flagged.suspicious`）skills
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

注意事項：

- 結果會依相關性順序回傳（embedding 相似度 + 精確 slug/name token 加權 + 來自下載數的人氣先驗）。
- 相關性比人氣更強。精確的 slug 或顯示名稱 token 符合，可以排在下載數多得多但符合較寬鬆的結果之前。
- ASCII 文字會依單字和標點邊界 token 化。例如，`personal-map` 包含獨立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜尋 `map` 時，`personal-map` 會比 `amap-jsapi-skill` 取得更強的詞彙符合。
- 下載數會作為小型對數縮放先驗和同分判定依據，而不是主要排名訊號。當查詢文字符合較弱時，高下載量 skills 可能排名較低。
- 可疑或隱藏的審核狀態，可能會根據呼叫者篩選器和目前審核狀態，將 skill 從公開搜尋中移除。

發布者可發現性指引：

- 將使用者會實際搜尋的詞放在顯示名稱、摘要和標籤中。只有當獨立 slug token 同時也是你想保留的穩定身分時，才使用它。
- 不要只為了追逐某個查詢而重新命名 slug，除非新 slug 是更好的長期標準名稱。舊 slug 會成為重新導向別名，但標準 URL、顯示的 slug，以及未來搜尋摘要會使用新 slug。
- 重新命名別名會保留舊 URL 和透過 registry 解析的安裝解析能力，但搜尋排名會以重新命名已建立索引後的標準 skill 中繼資料為基礎。既有統計資料會保留在該 skill 上。
- 如果 skill 意外不可見，請先在登入狀態下使用 `clawhub inspect <slug>` 檢查審核狀態，再變更排名相關中繼資料。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選填）：整數（1–200）
- `cursor`（選填）：任何非 `trending` 排序的分頁游標
- `sort`（選填）：`updated`（預設）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）、`installsCurrent`（別名：`installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（選填）：`true` 可隱藏可疑（`flagged.suspicious`）skills
- `nonSuspicious`（選填）：`nonSuspiciousOnly` 的舊版別名

注意事項：

- `trending` 依最近 7 天的安裝數排名（基於遙測）。
- `createdAt` 對新 skill 爬取是穩定的；`updated` 會在既有 skills 重新發布時變更。
- 當 `nonSuspiciousOnly=true` 時，基於游標的排序可能會在某頁回傳少於 `limit` 個項目，因為可疑 skills 是在頁面擷取後才被篩除。
- 當存在 `nextCursor` 時，使用它繼續分頁。短頁本身不代表結果結束。

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

注意事項：

- 由擁有者重新命名/合併流程建立的舊 slug 會解析到標準 skill。
- `metadata.os`：skill frontmatter 中宣告的 OS 限制（例如 `["macos"]`、`["linux"]`）。未宣告時為 `null`。
- `metadata.systems`：Nix 系統目標（例如 `["aarch64-darwin", "x86_64-linux"]`）。未宣告時為 `null`。
- 如果 skill 沒有平台中繼資料，`metadata` 為 `null`。
- `moderation` 只有在 skill 已被標記，或擁有者正在檢視時才會包含。

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

注意事項：

- 擁有者和審核員可以存取隱藏 skills 的審核詳細資料。
- 公開呼叫者只會對已標記且可見的 skills 取得 `200`。
- 公開呼叫者的證據會被遮蔽，且只有擁有者/審核員會包含原始片段。

### `POST /api/v1/skills/{slug}/report`

回報 skill 以供審核員檢閱。回報屬於 skill 層級，可選擇連結
到某個版本，並會進入 skill 回報佇列。

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

審核員/管理員用的 skill 回報接收端點。

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

審核員/管理員用於解決或重新開啟 skill 回報的端點。

請求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` 對 `confirmed` 和 `dismissed` 是必填；將
`status` 設回 `open` 時可以省略。傳入 `finalAction: "hide"` 搭配已分流的
回報，即可在同一個可稽核工作流程中隱藏該 skill。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選填）：整數
- `cursor`（選填）：分頁游標

### `GET /api/v1/skills/{slug}/versions/{version}`

回傳版本中繼資料 + 檔案清單。

- `version.security` 會在可用時包含標準化掃描驗證狀態和掃描器詳細資料
  （VirusTotal + LLM）。

### `GET /api/v1/skills/{slug}/scan`

回傳 skill 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選填）：特定版本字串。
- `tag`（選填）：解析已加標籤的版本（例如 `latest`）。

注意事項：

- 如果未提供 `version` 或 `tag`，則使用最新版本。
- 包含標準化驗證狀態以及掃描器特定詳細資料。
- `security.capabilityTags` 會在偵測到時包含確定性的 capability/風險標籤，例如
  `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、
  `requires-oauth-token` 和 `posts-externally`。
- `security.hasScanResult` 只有在掃描器產生確定判定（`clean`、`suspicious` 或 `malicious`）時才為 `true`。
- `moderation` 是從最新版本衍生出的目前 skill 層級審核快照。
- 查詢歷史版本時，請先檢查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`，再將 `moderation` 和 `security` 視為相同版本脈絡。

### `GET /api/v1/skills/{slug}/file`

回傳原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新版本。
- 檔案大小限制：200KB。

### `GET /api/v1/packages`

統一目錄端點，用於：

- skills
- 程式碼 plugins
- bundle plugins

查詢參數：

- `limit`（選用）：整數（1–100）
- `cursor`（選用）：分頁游標
- `family`（選用）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選用）：`official`、`community` 或 `private`
- `isOfficial`（選用）：`true` 或 `false`
- `executesCode`（選用）：`true` 或 `false`
- `capabilityTag`（選用）：Plugin 套件的能力篩選器
- `target` / `hostTarget`（選用）：`host:<target>` 的簡寫
- `os`、`arch`、`libc`（選用）：主機能力篩選器的簡寫
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  （選用）：環境需求標籤的 `true`/`1` 簡寫
- `externalService`、`binary`、`osPermission`（選用）：具名
  環境需求標籤的簡寫
- `artifactKind`（選用）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（選用）：`true`/`1`，用來顯示可透過 npm 鏡像取得、
  由 ClawPack 支援的套件版本

備註：

- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定 family 的別名。
- Skill 項目仍由 Skill 登錄檔支援，且仍只能透過 `POST /api/v1/skills` 發布。
- `POST /api/v1/packages` 仍僅適用於 code-plugin 和 bundle-plugin 發行版本。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證呼叫者可以在清單/搜尋結果中看到其所屬發布者的私人套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。

### `GET /api/v1/packages/search`

跨 Skills + Plugin 套件的統一目錄搜尋。

查詢參數：

- `q`（必要）：查詢字串
- `limit`（選用）：整數（1–100）
- `family`（選用）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選用）：`official`、`community` 或 `private`
- `isOfficial`（選用）：`true` 或 `false`
- `executesCode`（選用）：`true` 或 `false`
- `capabilityTag`（選用）：Plugin 套件的能力篩選器
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary` 和
  `osPermission` 會被接受為常見能力標籤的簡寫
- `artifactKind`（選用）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（選用）：`true`/`1`，用來搜尋可透過 npm 鏡像取得、
  由 ClawPack 支援的套件版本

備註：

- 匿名呼叫者只能看到公開套件頻道。
- 已驗證呼叫者可以搜尋其所屬發布者的私人套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。
- 成品篩選器由已索引的能力標籤支援：
  `artifact:legacy-zip`、`artifact:npm-pack` 和 `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

傳回套件詳細中繼資料。

備註：

- Skills 也可以在統一目錄中透過此路由解析。
- 除非呼叫者可讀取擁有者發布者，否則私人套件會傳回 `404`。

### `DELETE /api/v1/packages/{name}`

軟刪除套件及其所有發行版本。

備註：

- 需要套件擁有者、組織發布者擁有者/管理員、
  平台版主或平台管理員的 API token。

### `GET /api/v1/packages/{name}/versions`

傳回版本歷史記錄。

查詢參數：

- `limit`（選用）：整數（1–100）
- `cursor`（選用）：分頁游標

備註：

- 除非呼叫者可讀取擁有者發布者，否則私人套件會傳回 `404`。

### `GET /api/v1/packages/{name}/versions/{version}`

傳回單一套件版本，包括檔案中繼資料、相容性、
能力、驗證、成品中繼資料和掃描資料。

備註：

- `version.artifact.kind` 對舊世界套件封存為 `legacy-zip`，或對
  ClawPack 支援的發行版本為 `npm-pack`。
- ClawPack 發行版本包含與 npm 相容的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 欄位。
- 當掃描資料存在時，會包含 `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 除非呼叫者可讀取擁有者發布者，否則私人套件會傳回 `404`。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

傳回套件版本的明確成品解析器中繼資料。

備註：

- 舊版套件版本會傳回 `legacy-zip` 成品和舊版 ZIP
  `downloadUrl`。
- ClawPack 版本會傳回 `npm-pack` 成品、npm 完整性欄位、
  `tarballUrl`，以及舊版 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它避免從共用 URL 猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確解析器路徑下載版本成品。

備註：

- ClawPack 版本會串流確切上傳的 npm-pack `.tgz` 位元組。
- 舊版 ZIP 版本會重新導向到 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率桶。

### `GET /api/v1/packages/{name}/readiness`

傳回供未來 OpenClaw 使用的計算就緒狀態。

就緒檢查涵蓋：

- official 頻道狀態
- 最新版本可用性
- ClawPack npm-pack 成品可用性
- 成品摘要
- 來源 repo 和提交來源證明
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

列出官方 OpenClaw Plugin 遷移列的版主端點。

驗證：

- 需要版主或管理員使用者的 API token。

查詢參數：

- `phase`（選用）：`planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw` 或
  `all`（預設）。
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

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

- 需要管理員使用者的 API token。

要求本文：

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

備註：

- `bundledPluginId` 會正規化為小寫，並作為穩定的 upsert key。
- `packageName` 會進行 npm 名稱正規化；對於已規劃的
  遷移，套件可以不存在。
- 這只追蹤遷移就緒狀態。它不會變更 OpenClaw 或產生
  ClawPack。

### `GET /api/v1/packages/moderation/queue`

套件發行版本審查佇列的版主/管理員端點。

驗證：

- 需要版主或管理員使用者的 API token。

查詢參數：

- `status`（選用）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、隔離、撤銷或已回報的發行版本。
- `blocked`：已隔離、已撤銷或惡意的發行版本。
- `manual`：具有手動審核覆寫的任何發行版本。
- `all`：具有手動覆寫、非乾淨掃描狀態或套件回報的任何發行版本。

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

回報套件以供版主審查。回報屬於套件層級，可選擇性地
連結到版本。它們會送入審核佇列，但本身不會自動隱藏或
封鎖下載；版主應使用發行版本審核來
核准、隔離或撤銷成品。

驗證：

- 需要 API token。

要求：

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

套件回報接收的版主/管理員端點。

驗證：

- 需要版主或管理員使用者的 API token。

查詢參數：

- `status`（選用）：`open`（預設）、`confirmed`、`dismissed` 或 `all`
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

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

套件審核可見性的擁有者/版主端點。

驗證：

- 需要套件擁有者、發布者成員、版主或
  管理員使用者的 API token。

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

解析或重新開啟套件回報的版主/管理員端點。

要求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` 對於 `confirmed` 與 `dismissed` 為必填；將
`status` 設回 `open` 時可省略。對已確認的報告傳入 `finalAction: "quarantine"` 或
`finalAction: "revoke"`，即可在同一個可稽核工作流程中套用發布審查。

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

用於套件發布審查的版主/管理員端點。

請求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支援的狀態：

- `approved`：已手動審查並允許。
- `quarantined`：已封鎖，等待後續處理。
- `revoked`：在先前信任某個發布後將其封鎖。

遭隔離與撤銷的發布會從成品下載路由回傳 `403`。
每次變更都會寫入一筆稽核記錄項目。

### `POST /api/v1/packages/backfill/artifacts`

僅限管理員使用的維護端點，用於為較舊的套件發布標記明確的成品種類中繼資料。

請求主體：

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
- 沒有 ClawPack 儲存體的發布會標記為 `legacy-zip`。
- 缺少 `artifactKind` 的既有 ClawPack 支援資料列會修復為
  `npm-pack`。
- 這不會產生 ClawPack，也不會變更成品位元組。

### `GET /api/v1/packages/{name}/file`

回傳套件檔案的原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新發布。
- 使用讀取速率桶，而不是下載桶。
- 二進位檔案會回傳 `415`。
- 檔案大小限制：200KB。
- 等待中的 VirusTotal 掃描不會封鎖讀取；惡意發布仍可能在其他地方被扣留。
- 私有套件會回傳 `404`，除非呼叫者可以讀取擁有該套件的發布者。

### `GET /api/v1/packages/{name}/download`

下載套件發布的舊版確定性 ZIP 封存。

查詢參數：

- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新發布。
- Skills 會重新導向至 `GET /api/v1/download`。
- Plugin/套件封存是 zip 檔案，並以 `package/` 作為根目錄，讓舊版 OpenClaw
  用戶端繼續運作。
- 此路由維持僅限 ZIP。它不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 與
  `X-ClawHub-Artifact-Sha256` 標頭，用於解析器完整性檢查。
- 僅屬於 Registry 的中繼資料不會注入下載的封存。
- 等待中的 VirusTotal 掃描不會封鎖下載；惡意發布會回傳 `403`。
- 私有套件會回傳 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

回傳 ClawPack 支援套件版本的 npm 相容 packument。

注意事項：

- 只會列出已上傳 ClawPack npm-pack tarball 的版本。
- 舊版僅 ZIP 版本會刻意省略。
- `dist.tarball`、`dist.integrity` 與 `dist.shasum` 使用 npm 相容欄位，
  讓使用者可在選擇時將 npm 指向該鏡像。
- Scoped package packument 同時支援 `/api/npm/@scope/name` 與 npm 的
  編碼 `/api/npm/@scope%2Fname` 請求路徑。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流確切上傳的 ClawPack tarball 位元組。

注意事項：

- 使用下載速率桶。
- 下載標頭包含 ClawHub SHA-256，以及 npm integrity/shasum 中繼資料。
- 審查與私有套件存取檢查仍會套用。

### `GET /api/v1/resolve`

由 CLI 用來將本機指紋對應至已知版本。

查詢參數：

- `slug`（必填）
- `hash`（必填）：套件指紋的 64 字元十六進位 sha256

回應：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下載某個技能版本的 zip。

查詢參數：

- `slug`（必填）
- `version`（選填）：semver 字串
- `tag`（選填）：標籤名稱（例如 `latest`）

注意事項：

- 若未提供 `version` 或 `tag`，會使用最新版本。
- 軟刪除版本會回傳 `410`。
- 下載統計會計算每小時的唯一身分（API 權杖有效時為 `userId`，否則為 IP）。

## 驗證端點（Bearer 權杖）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證權杖並回傳使用者 handle。

### `POST /api/v1/skills`

發布新版本。

- 建議：使用 `multipart/form-data`，包含 `payload` JSON + `files[]` blob。
- 也接受含有 `files`（基於 storageId）的 JSON 主體。
- 選填 payload 欄位：`ownerHandle`。存在時，API 會在伺服器端解析該
  發布者，並要求動作者具備發布者存取權。
- 選填 payload 欄位：`migrateOwner`。當它與 `ownerHandle` 一起為 `true` 時，
  如果動作者同時是目前與目標發布者的管理員/擁有者，既有技能可移轉至該擁有者。
  若未選擇加入，擁有者變更會遭拒。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 發布。

- 需要 Bearer 權杖驗證。
- 建議：使用 `multipart/form-data`，包含 `payload` JSON + `files[]` blob。
- 也接受含有 `files`（基於 storageId）的 JSON 主體。
- 選填 payload 欄位：`ownerHandle`。存在時，只有管理員可以代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- Plugin 套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳必須在
  `package/openclaw.plugin.json` 包含它。
- Code plugins 需要 `package.json`、原始碼儲存庫中繼資料、原始碼 commit
  中繼資料、設定 schema 中繼資料、`openclaw.compat.pluginApi` 與
  `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 與 `openclaw.environment` 是選填中繼資料。
- 只有受信任的發布者可以發布至 `official` channel。
- 代表發布仍會針對目標擁有者帳號驗證 official-channel 資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除 / 還原技能（擁有者、版主或管理員）。

選填 JSON 主體：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在時，`reason` 會儲存為技能審查備註，並複製到稽核記錄。
擁有者發起的軟刪除會保留 slug 30 天，之後該 slug 可由
另一個發布者認領。刪除回應在此到期適用時會包含 `slugReservedUntil`。
版主/管理員隱藏與安全移除不會以這種方式到期。

刪除回應：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

狀態碼：

- `200`：成功
- `401`：未授權
- `403`：禁止
- `404`：找不到技能/使用者
- `500`：內部伺服器錯誤

### `POST /api/v1/users/publisher`

僅限管理員。確保某個 handle 的組織發布者存在。如果該 handle 仍指向
舊版共用使用者/個人發布者，端點會先將其遷移成組織發布者。

- 主體：`{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

僅限管理員。為合法擁有者保留根 slug 與套件名稱，而不發布
發布版本。套件名稱會成為沒有發布資料列的私有預留位置套件，因此同一個
擁有者稍後可以將真正的 code-plugin 或 bundle-plugin 發布到該名稱。

- 主體：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 回應：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 擁有者 slug 管理端點

- `POST /api/v1/skills/{slug}/rename`
  - 主體：`{ "newSlug": "new-canonical-slug" }`
  - 回應：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 主體：`{ "targetSlug": "canonical-target-slug" }`
  - 回應：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注意事項：

- 兩個端點都需要 API 權杖驗證，且只適用於技能擁有者。
- `rename` 會保留先前的 slug 作為重新導向別名。
- `merge` 會隱藏來源列表，並將來源 slug 重新導向至目標列表。

### 移轉擁有權端點

- `POST /api/v1/skills/{slug}/transfer`
  - 主體：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - 回應：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 回應（accept/reject/cancel）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 回應格式：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

封鎖使用者並硬刪除其擁有的技能（僅限版主/管理員）。

主體：

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

主體：

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

主體：

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

- `q`（選填）：搜尋查詢
- `query`（選填）：`q` 的別名
- `limit`（選填）：結果上限（預設 20，最高 200）

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

新增/移除星號（亮點）。兩個端點都是冪等的。

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

請參閱 `DEPRECATIONS.md` 以了解移除計畫。

## Registry 探索（`/.well-known/clawhub.json`）

CLI 可以從網站探索 Registry/驗證設定：

- `/.well-known/clawhub.json`（JSON，建議）
- `/.well-known/clawdhub.json`（舊版）

Schema：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版為 `CLAWDHUB_REGISTRY`）。
