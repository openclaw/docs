---
read_when:
    - 新增/變更端點
    - 偵錯 CLI ↔ 登錄庫請求
summary: HTTP API 參考（公開 + CLI 端點 + 身分驗證）。
x-i18n:
    generated_at: "2026-05-10T19:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基本 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 之下。
舊版 `/api/...` 與 `/api/cli/...` 仍保留以維持相容性（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重用

第三方目錄可以使用公開讀取端點來列出或搜尋 ClawHub Skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回標準 ClawHub 清單（`https://clawhub.ai/<owner>/<slug>`），並避免暗示 ClawHub 為該第三方網站背書。請勿嘗試在公開 API 表面之外鏡像隱藏、私有或遭審核封鎖的內容。

網頁 slug 捷徑會跨登錄系列解析，但 API 用戶端應使用讀取端點傳回的標準 URL，而不是自行重建路由優先順序。

## 速率限制

強制執行模型：

- 匿名請求：依 IP 強制執行。
- 已驗證請求（有效 Bearer 權杖）：依使用者 bucket 強制執行。
- 如果權杖缺失或無效，行為會退回到 IP 強制執行。
- 已驗證的寫入端點在伺服器知道原因時，不應只傳回裸露的 `Unauthorized`。缺失權杖、無效/已撤銷權杖，以及已刪除/遭禁用/停用的帳號，都應取得可採取行動的文字，讓 CLI 用戶端能告知使用者是什麼阻擋了他們。

- 讀取：每 IP 600/min，每金鑰 2400/min
- 寫入：每 IP 45/min，每金鑰 180/min
- 下載：每 IP 30/min，每金鑰 180/min（`/api/v1/download`）

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
- 使用帶抖動的退避，以避免同步重試。
- 如果缺少 `Retry-After`，退回使用 `RateLimit-Reset`（或從 `X-RateLimit-Reset` 計算）。

IP 來源：

- 預設使用 `cf-connecting-ip`（Cloudflare）作為用戶端 IP。
- ClawHub 使用受信任的轉送標頭，在邊緣識別用戶端 IP。
- 如果沒有可用的受信任用戶端 IP，匿名下載請求會使用端點範圍的備援 bucket，而不是單一全域 `ip:unknown` bucket。匿名讀取/寫入請求仍會使用共用 unknown bucket，讓缺失 IP 的路由保持可見且保守。

## 公開端點（無需驗證）

### `GET /api/v1/search`

查詢參數：

- `q`（必要）：查詢字串
- `limit`（選用）：整數
- `highlightedOnly`（選用）：`true` 表示篩選為精選 Skills
- `nonSuspiciousOnly`（選用）：`true` 表示隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選用）：`nonSuspiciousOnly` 的舊版別名

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

- 結果會依相關性順序傳回（嵌入相似度 + 精確 slug/name token 加權 + 來自下載次數的人氣先驗）。
- 相關性比人氣更強。精確的 slug 或顯示名稱 token 相符，可以排名高於下載次數多得多但相符較寬鬆的結果。
- ASCII 文字會依單字與標點邊界分詞。例如，`personal-map` 包含獨立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜尋 `map` 時，`personal-map` 的詞彙相符會比 `amap-jsapi-skill` 更強。
- 下載次數會作為小幅對數縮放先驗與同分裁決因素，而不是主要排名訊號。當查詢文字相符較弱時，高下載量 Skills 的排名可能較低。
- 視呼叫者篩選條件與目前審核狀態而定，可疑或隱藏的審核狀態可能會將某個 Skill 從公開搜尋移除。

發布者可探索性指引：

- 將使用者會實際搜尋的詞放在顯示名稱、摘要與標籤中。只有當獨立 slug token 也是你想保留的穩定識別時，才使用它。
- 不要只為了追逐某個查詢而重新命名 slug，除非新的 slug 是更好的長期標準名稱。舊 slug 會成為重新導向別名，但標準 URL、顯示的 slug 與未來搜尋摘要會使用新 slug。
- 重新命名別名會保留舊 URL 與透過登錄解析的安裝解析能力，但重新命名完成索引後，搜尋排名會以標準 Skill 中繼資料為依據。既有統計會留在該 Skill 上。
- 如果某個 Skill 意外不可見，登入後請先使用 `clawhub inspect <slug>` 檢查審核狀態，再變更與排名相關的中繼資料。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選用）：整數（1–200）
- `cursor`（選用）：任何非 `trending` 排序的分頁游標
- `sort`（選用）：`updated`（預設）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）、`installsCurrent`（別名：`installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（選用）：`true` 表示隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選用）：`nonSuspiciousOnly` 的舊版別名

注意事項：

- `trending` 依過去 7 天的安裝次數排名（以遙測為基礎）。
- `createdAt` 對新 Skill 爬取是穩定的；`updated` 會在既有 Skills 重新發布時變更。
- 當 `nonSuspiciousOnly=true` 時，以游標為基礎的排序可能會在某一頁傳回少於 `limit` 的項目，因為可疑 Skills 會在頁面擷取後被篩除。
- 當存在 `nextCursor` 時，使用它繼續分頁。短頁面本身不代表結果已結束。

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

- 由 owner 重新命名/合併流程建立的舊 slug 會解析到標準 Skill。
- `metadata.os`：在 Skill frontmatter 中宣告的 OS 限制（例如 `["macos"]`、`["linux"]`）。如果未宣告則為 `null`。
- `metadata.systems`：Nix 系統目標（例如 `["aarch64-darwin", "x86_64-linux"]`）。如果未宣告則為 `null`。
- 如果 Skill 沒有平台中繼資料，`metadata` 為 `null`。
- `moderation` 只會在 Skill 被標記，或 owner 正在檢視時包含。

### `GET /api/v1/skills/{slug}/moderation`

傳回結構化審核狀態。

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

- Owners 與 moderators 可以存取隱藏 Skills 的審核詳細資料。
- 公開呼叫者只會對已標記且可見的 Skills 取得 `200`。
- 公開呼叫者的證據會被遮蔽，且只有 owners/moderators 會包含原始片段。

### `POST /api/v1/skills/{slug}/report`

回報某個 Skill 以供 moderator 審查。回報是 Skill 層級，可選擇連結到某個版本，並會送入 Skill 回報佇列。

驗證：

- 需要 API 權杖。

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

### `POST /api/v1/skills/{slug}/appeal`

Skill owner/publisher 端點，用於對 Skill 的審核結果提出申訴。

驗證：

- 需要 Skill owner 或 publisher 成員的 API 權杖。

請求：

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

隱藏、移除、可疑、惡意或掃描器標記的 Skill 結果都可以提出申訴。ClawHub 會為每個 Skill 保留一個未結申訴。

回應：

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

請求對最新發布的 Skill 版本進行安全重新掃描。

驗證：

- 需要 Skill owner、publisher admin、platform moderator 或 platform admin 的 API 權杖。
- Owners 與 publisher admins 受每版本 owner 復原限制約束。Platform moderators 與 admins 不受此限制，但 ClawHub 仍只允許每個版本有一個作用中的重新掃描。

回應：

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

moderator/admin 端點，用於 Skill 回報接收。

查詢參數：

- `status`（選用）：`open`（預設）、`confirmed`、`dismissed` 或 `all`
- `limit`（選用）：整數（1-200）
- `cursor`（選用）：分頁游標

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

moderator/admin 端點，用於解決或重新開啟 Skill 回報。

請求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` 與 `dismissed` 需要 `note`；將 `status` 設回 `open` 時可以省略。傳入 `finalAction: "hide"` 搭配已分類處理的回報，以在同一個可稽核工作流程中隱藏該 Skill。

### `GET /api/v1/skills/-/appeals`

moderator/admin 端點，用於 Skill 申訴接收。

查詢參數：

- `status`（選用）：`open`（預設）、`accepted`、`rejected` 或 `all`
- `limit`（選用）：整數（1-200）
- `cursor`（選用）：分頁游標

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

moderator/admin 端點，用於接受、拒絕或重新開啟 Skill 申訴。
`accepted` 與 `rejected` 需要 `note`；將 `status` 設回 `open` 時可以省略。傳入 `finalAction: "restore"` 搭配已接受的申訴，以讓該 Skill 再次可用。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選用）：整數
- `cursor`（選用）：分頁游標

### `GET /api/v1/skills/{slug}/versions/{version}`

傳回版本中繼資料 + 檔案清單。

- `version.security` 會包含標準化的掃描驗證狀態與掃描器詳細資料
  （VirusTotal + LLM），如果可用。

### `GET /api/v1/skills/{slug}/scan`

傳回 Skills 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選用）：特定版本字串。
- `tag`（選用）：解析已加標籤的版本（例如 `latest`）。

備註：

- 如果未提供 `version` 或 `tag`，會使用最新版本。
- 包含標準化驗證狀態以及掃描器特定詳細資料。
- `security.capabilityTags` 會在偵測到時包含確定性的能力/風險標籤，例如
  `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、
  `requires-oauth-token` 和 `posts-externally`。
- `security.hasScanResult` 只有在掃描器產生明確判定（`clean`、`suspicious` 或 `malicious`）時才會是 `true`。
- `moderation` 是目前由最新版本衍生的 Skills 層級審核快照。
- 查詢歷史版本時，請先檢查 `moderation.matchesRequestedVersion` 與 `moderation.sourceVersion`，再將 `moderation` 和 `security` 視為相同的版本情境。

### `GET /api/v1/skills/{slug}/file`

傳回原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選用）
- `tag`（選用）

備註：

- 預設為最新版本。
- 檔案大小限制：200KB。

### `GET /api/v1/packages`

統一目錄端點，適用於：

- Skills
- 程式碼 Plugin
- bundle Plugin

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
- `npmMirror`（選用）：`true`/`1`，用於顯示可透過 npm mirror
  取得、由 ClawPack 支援的套件版本

備註：

- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定 family 的別名。
- Skills 項目仍由 Skills registry 支援，且仍只能透過 `POST /api/v1/skills` 發布。
- `POST /api/v1/packages` 仍只適用於 code-plugin 和 bundle-plugin 發行版本。
- 匿名呼叫者只能看到公開套件 channel。
- 已驗證呼叫者可在清單/搜尋結果中看到其所屬發布者的私人套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。

### `GET /api/v1/packages/search`

跨 Skills + Plugin 套件的統一目錄搜尋。

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選用）：整數（1–100）
- `family`（選用）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選用）：`official`、`community` 或 `private`
- `isOfficial`（選用）：`true` 或 `false`
- `executesCode`（選用）：`true` 或 `false`
- `capabilityTag`（選用）：Plugin 套件的能力篩選器
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary` 和
  `osPermission` 會被接受作為常見能力標籤的簡寫
- `artifactKind`（選用）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（選用）：`true`/`1`，用於搜尋可透過 npm mirror
  取得、由 ClawPack 支援的套件版本

備註：

- 匿名呼叫者只能看到公開套件 channel。
- 已驗證呼叫者可搜尋其所屬發布者的私人套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。
- 成品篩選器由已索引的能力標籤支援：
  `artifact:legacy-zip`、`artifact:npm-pack` 和 `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

傳回套件詳細中繼資料。

備註：

- Skills 也可在統一目錄中透過此路由解析。
- 私人套件會傳回 `404`，除非呼叫者可讀取擁有的發布者。

### `DELETE /api/v1/packages/{name}`

軟刪除一個套件及其所有發行版本。

備註：

- 需要套件擁有者、組織發布者擁有者/管理員、
  平台審核員或平台管理員的 API 權杖。

### `GET /api/v1/packages/{name}/versions`

傳回版本歷史。

查詢參數：

- `limit`（選用）：整數（1–100）
- `cursor`（選用）：分頁游標

備註：

- 私人套件會傳回 `404`，除非呼叫者可讀取擁有的發布者。

### `GET /api/v1/packages/{name}/versions/{version}`

傳回一個套件版本，包含檔案中繼資料、相容性、
能力、驗證、成品中繼資料和掃描資料。

備註：

- `version.artifact.kind` 對舊世界套件封存為 `legacy-zip`，或
  對 ClawPack 支援的發行版本為 `npm-pack`。
- ClawPack 發行版本包含與 npm 相容的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 欄位。
- 存在掃描資料時，會包含 `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 私人套件會傳回 `404`，除非呼叫者可讀取擁有的發布者。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

傳回套件版本的明確成品解析器中繼資料。

備註：

- 舊版套件版本會傳回 `legacy-zip` 成品與舊版 ZIP
  `downloadUrl`。
- ClawPack 版本會傳回 `npm-pack` 成品、npm integrity 欄位、
  `tarballUrl`，以及舊版 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它避免從共用 URL
  猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確解析器路徑下載版本成品。

備註：

- ClawPack 版本會串流精確上傳的 npm-pack `.tgz` 位元組。
- 舊版 ZIP 版本會重新導向至 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率 bucket。

### `GET /api/v1/packages/{name}/readiness`

傳回供未來 OpenClaw 使用的計算就緒狀態。

就緒檢查涵蓋：

- 官方 channel 狀態
- 最新版本可用性
- ClawPack npm-pack 成品可用性
- 成品 digest
- 來源 repo 與 commit 來源證明
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

審核員端點，用於列出官方 OpenClaw Plugin 遷移列。

驗證：

- 需要審核員或管理員使用者的 API 權杖。

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

管理員端點，用於建立或更新官方 Plugin 遷移列。

驗證：

- 需要管理員使用者的 API 權杖。

請求本文：

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

- `bundledPluginId` 會標準化為小寫，且是穩定的 upsert key。
- `packageName` 會進行 npm-name 標準化；規劃中的
  遷移可以缺少套件。
- 這只追蹤遷移就緒狀態。它不會改動 OpenClaw 或產生
  ClawPacks。

### `GET /api/v1/packages/moderation/queue`

審核員/管理員端點，用於套件發行版本審查佇列。

驗證：

- 需要審核員或管理員使用者的 API 權杖。

查詢參數：

- `status`（選用）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、隔離、已撤銷或已回報的發行版本。
- `blocked`：隔離、已撤銷或惡意的發行版本。
- `manual`：任何具有手動審核覆寫的發行版本。
- `all`：任何具有手動覆寫、非乾淨掃描狀態或套件回報的發行版本。

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

回報套件以供審核員審查。回報屬於套件層級，可選擇
連結到某個版本。它們會進入審核佇列，但本身不會自動隱藏或
封鎖下載；審核員應使用發行版本審核來
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

### `POST /api/v1/packages/{name}/appeal`

套件擁有者/發布者端點，用於對發行版本的審核提出申訴。

驗證：

- 需要套件擁有者或發布者成員的 API 權杖。

請求：

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

只有遭隔離、撤銷、
可疑或惡意的發行版本才接受申訴。ClawHub 會為每個發行版本保留一個開放申訴。

回應：

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

要求對最新發布的套件版本進行安全性重新掃描。

驗證：

- 需要套件擁有者、發布者管理員、平台版主或平台管理員的 API token。
- 擁有者和發布者管理員受每個版本的擁有者復原限制約束。平台版主和管理員不受此限制，但 ClawHub 仍只允許每個版本有一個作用中的重新掃描。

回應：

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

用於套件申訴受理的版主/管理員端點。

驗證：

- 需要版主或管理員使用者的 API token。

查詢參數：

- `status`（選用）：`open`（預設）、`accepted`、`rejected` 或 `all`
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

回應：

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

用於接受、拒絕或重新開啟申訴的版主/管理員端點。

請求：

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`accepted` 和 `rejected` 需要 `note`；將 `status` 設回 `open` 時可以省略。傳入 `finalAction: "approve"` 搭配已接受的申訴，可在同一個可稽核工作流程中核准受影響的版本。

回應：

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

用於套件檢舉受理的版主/管理員端點。

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

用於查看套件審核可見性的擁有者/版主端點。

驗證：

- 需要套件擁有者、發布者成員、版主或管理員使用者的 API token。

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

用於解決或重新開啟套件檢舉的版主/管理員端點。

請求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` 和 `dismissed` 需要 `note`；將 `status` 設回 `open` 時可以省略。傳入 `finalAction: "quarantine"` 或 `finalAction: "revoke"` 搭配已確認的檢舉，可在同一個可稽核工作流程中套用版本審核。

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

用於套件版本審查的版主/管理員端點。

請求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支援的狀態：

- `approved`：已手動審查並允許。
- `quarantined`：已封鎖，等待後續處理。
- `revoked`：在版本先前受信任後封鎖。

已隔離和已撤銷的版本會從成品下載路由傳回 `403`。每次變更都會寫入稽核記錄項目。

### `POST /api/v1/packages/backfill/artifacts`

僅限管理員使用的維護端點，用於為較舊的套件版本標記明確的成品種類中繼資料。

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

- 預設為 dry-run。
- 沒有 ClawPack 儲存體的版本會標記為 `legacy-zip`。
- 缺少 `artifactKind` 的既有 ClawPack 支援資料列會修復為 `npm-pack`。
- 這不會產生 ClawPack 或變更成品位元組。

### `GET /api/v1/packages/{name}/file`

傳回套件檔案的原始文字內容。

查詢參數：

- `path`（必要）
- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新版本。
- 使用讀取速率 bucket，而不是下載 bucket。
- 二進位檔案會傳回 `415`。
- 檔案大小限制：200KB。
- 待處理的 VirusTotal 掃描不會阻止讀取；惡意版本仍可能在其他地方被保留。
- 私有套件會傳回 `404`，除非呼叫者可以讀取擁有該套件的發布者。

### `GET /api/v1/packages/{name}/download`

下載套件版本的舊版決定性 ZIP 封存。

查詢參數：

- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新版本。
- Skills 會重新導向至 `GET /api/v1/download`。
- Plugin/套件封存是包含 `package/` 根目錄的 zip 檔案，因此舊版 OpenClaw 用戶端可持續運作。
- 此路由維持僅限 ZIP。它不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和 `X-ClawHub-Artifact-Sha256` 標頭，用於解析器完整性檢查。
- 僅限登錄的中繼資料不會注入下載的封存中。
- 待處理的 VirusTotal 掃描不會阻止下載；惡意版本會傳回 `403`。
- 私有套件會傳回 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

傳回 ClawPack 支援套件版本的 npm 相容 packument。

注意事項：

- 只列出已上傳 ClawPack npm-pack tarball 的版本。
- 舊版僅限 ZIP 的版本會刻意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用 npm 相容欄位，因此使用者可選擇將 npm 指向該鏡像。
- Scoped 套件 packument 同時支援 `/api/npm/@scope/name` 和 npm 的編碼 `/api/npm/@scope%2Fname` 請求路徑。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流確切上傳的 ClawPack tarball 位元組。

注意事項：

- 使用下載速率 bucket。
- 下載標頭包含 ClawHub SHA-256 以及 npm integrity/shasum 中繼資料。
- 審核和私有套件存取檢查仍會套用。

### `GET /api/v1/resolve`

CLI 用於將本機指紋對應到已知版本。

查詢參數：

- `slug`（必要）
- `hash`（必要）：bundle 指紋的 64 字元十六進位 sha256

回應：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下載 Skills 版本的 zip。

查詢參數：

- `slug`（必要）
- `version`（選用）：semver 字串
- `tag`（選用）：標籤名稱（例如 `latest`）

注意事項：

- 如果未提供 `version` 或 `tag`，會使用最新版本。
- 軟刪除版本會傳回 `410`。
- 下載統計會以每小時唯一身分計算（API token 有效時為 `userId`，否則為 IP）。

## 驗證端點（Bearer token）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證 token 並傳回使用者 handle。

### `POST /api/v1/skills`

發布新版本。

- 偏好：`multipart/form-data`，包含 `payload` JSON + `files[]` blob。
- 也接受包含 `files`（以 storageId 為基礎）的 JSON 主體。
- 選用 payload 欄位：`ownerHandle`。存在時，API 會在伺服器端解析該發布者，並要求操作者具有發布者存取權。
- 選用 payload 欄位：`migrateOwner`。當與 `ownerHandle` 一起為 `true` 時，如果操作者同時是目前和目標發布者的管理員/擁有者，既有 Skills 可移至該擁有者。若沒有此選擇加入，擁有者變更會被拒絕。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 版本。

- 需要 Bearer token 驗證。
- 偏好：`multipart/form-data`，包含 `payload` JSON + `files[]` blob。
- 也接受包含 `files`（以 storageId 為基礎）的 JSON 主體。
- 選用 payload 欄位：`ownerHandle`。存在時，只有管理員可代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- Plugin 套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳必須在 `package/openclaw.plugin.json` 包含它。
- Code Plugin 需要 `package.json`、來源 repo 中繼資料、來源 commit 中繼資料、設定 schema 中繼資料、`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
- 只有受信任的發布者可發布到 `official` channel。
- 代表他人發布時，仍會根據目標擁有者帳號驗證 official-channel 資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除 / 還原 Skills（擁有者、版主或管理員）。

選用 JSON 主體：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在時，`reason` 會儲存為 Skills 審核備註，並複製到稽核記錄。
擁有者發起的軟刪除會保留 slug 30 天，之後該 slug 可由另一個發布者認領。當此到期情況適用時，刪除回應會包含 `slugReservedUntil`。
版主/管理員隱藏和安全性移除不會以此方式到期。

刪除回應：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

狀態碼：

- `200`：ok
- `401`：未授權
- `403`：禁止
- `404`：找不到 Skills/使用者
- `500`：內部伺服器錯誤

### `POST /api/v1/users/publisher`

僅限管理員使用。確保某個 handle 存在組織發布者。如果該 handle 仍指向舊版共用使用者/個人發布者，端點會先將其遷移為組織發布者。

- 主體：`{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

僅限管理員。為正當擁有者保留根代稱與套件名稱，而不發布發行版本。套件名稱會成為沒有發行列的私有預留套件，因此同一位擁有者之後可以將真正的程式碼 Plugin 或套件組合 Plugin 發行版本發布到該名稱。

- 內文：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 回應：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 擁有者代稱管理端點

- `POST /api/v1/skills/{slug}/rename`
  - 內文：`{ "newSlug": "new-canonical-slug" }`
  - 回應：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 內文：`{ "targetSlug": "canonical-target-slug" }`
  - 回應：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注意事項：

- 兩個端點都需要 API 權杖驗證，且僅適用於 Skills 擁有者。
- `rename` 會保留先前的代稱作為重新導向別名。
- `merge` 會隱藏來源列表，並將來源代稱重新導向至目標列表。

### 移轉擁有權端點

- `POST /api/v1/skills/{slug}/transfer`
  - 內文：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - 回應：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 回應（接受/拒絕/取消）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 回應形狀：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

封鎖使用者並硬刪除其擁有的 Skills（僅限版主/管理員）。

內文：

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

解除封鎖使用者並還原符合資格的 Skills（僅限管理員）。

內文：

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

內文：

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
- `limit`（選用）：結果數量上限（預設 20，最大 200）

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

新增/移除星標（精選標記）。兩個端點都是冪等的。

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

## Registry 探索（`/.well-known/clawhub.json`）

CLI 可以從網站探索 Registry/驗證設定：

- `/.well-known/clawhub.json`（JSON，建議）
- `/.well-known/clawdhub.json`（舊版）

結構描述：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版為 `CLAWDHUB_REGISTRY`）。
