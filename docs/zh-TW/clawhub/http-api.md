---
read_when:
    - 新增/變更端點
    - 偵錯 CLI ↔ 註冊表請求
summary: HTTP API 參考（公開 + CLI 端點 + 驗證）。
x-i18n:
    generated_at: "2026-05-13T04:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基底 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 之下。
舊版 `/api/...` 與 `/api/cli/...` 會為了相容性保留（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重用

第三方目錄可以使用公開讀取端點來列出或搜尋 ClawHub Skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回正式的 ClawHub 條目（`https://clawhub.ai/<owner>/<slug>`），並避免暗示 ClawHub 背書該第三方網站。請勿嘗試在公開 API 表面之外鏡像隱藏、私有或因審核而封鎖的內容。

Web slug 捷徑會跨 registry 系列解析，但 API 用戶端應使用讀取端點傳回的正式 URL，而不是自行重建路由優先順序。

## 速率限制

強制執行模型：

- 匿名請求：依 IP 強制執行。
- 已驗證請求（有效的 Bearer token）：依使用者 bucket 強制執行。
- 如果 token 遺失或無效，行為會退回到依 IP 強制執行。
- 已驗證的寫入端點不應在伺服器知道原因時只傳回裸露的 `Unauthorized`。缺少 token、無效/已撤銷 token，以及已刪除/已封鎖/已停用的帳號，都應取得可採取行動的文字，讓 CLI 用戶端能告訴使用者被阻擋的原因。

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
- `Retry-After`：在 `429` 時，重試前需等待的秒數（延遲）

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
- 使用帶 jitter 的 backoff，以避免同步重試。
- 如果缺少 `Retry-After`，請退回使用 `RateLimit-Reset`（或從 `X-RateLimit-Reset` 計算）。

IP 來源：

- 預設使用 `cf-connecting-ip`（Cloudflare）作為用戶端 IP。
- ClawHub 使用受信任的轉送標頭，在邊緣識別用戶端 IP。
- 如果沒有可用的受信任用戶端 IP，匿名下載請求會使用端點範圍的備援 bucket，而不是單一全域 `ip:unknown` bucket。匿名讀取/寫入請求仍使用共用的 unknown bucket，讓缺少 IP 的路由保持可見且保守。

## 公開端點（無需驗證）

### `GET /api/v1/search`

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數
- `highlightedOnly`（選填）：`true` 表示篩選為精選 Skills
- `nonSuspiciousOnly`（選填）：`true` 表示隱藏可疑（`flagged.suspicious`）Skills
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

- 結果會依相關性順序傳回（embedding 相似度 + 精確 slug/name token 加權 + 來自下載量的熱門度先驗）。
- 相關性比熱門度更強。精確的 slug 或顯示名稱 token 符合，可以排在下載量多得多但符合較寬鬆的結果之前。
- ASCII 文字會依單字與標點邊界切分為 token。例如，`personal-map` 包含獨立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 與 `skill`；因此搜尋 `map` 時，`personal-map` 會比 `amap-jsapi-skill` 取得更強的詞彙符合。
- 下載量會作為小幅 log 縮放的先驗與平手判定因素，而不是主要排名訊號。當查詢文字符合較弱時，高下載量 Skills 可能排名較低。
- 視呼叫者篩選條件與目前審核狀態而定，可疑或隱藏的審核狀態可能會使 Skill 從公開搜尋中移除。

發布者可探索性指引：

- 將使用者會實際搜尋的詞放在顯示名稱、摘要與標籤中。只有當獨立 slug token 也是你想保留的穩定身分時，才使用它。
- 除非新 slug 是更好的長期正式名稱，否則不要只為了追逐某個查詢而重新命名 slug。舊 slug 會變成重新導向別名，但正式 URL、顯示的 slug，以及未來的搜尋摘要會使用新 slug。
- 重新命名別名會保留舊 URL 與透過 registry 解析安裝的解析能力，但在重新命名完成索引後，搜尋排名會基於正式 Skill 中繼資料。既有統計資料會留在該 Skill 上。
- 如果某個 Skill 意外不可見，請先在登入狀態下用 `clawhub inspect <slug>` 檢查審核狀態，再變更與排名相關的中繼資料。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選填）：整數（1–200）
- `cursor`（選填）：任何非 `trending` 排序的分頁游標
- `sort`（選填）：`updated`（預設）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）、`installsCurrent`（別名：`installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（選填）：`true` 表示隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選填）：`nonSuspiciousOnly` 的舊版別名

備註：

- `trending` 依過去 7 天的安裝數排名（基於遙測）。
- `createdAt` 對新 Skill 爬取是穩定的；當既有 Skills 重新發布時，`updated` 會變更。
- 當 `nonSuspiciousOnly=true` 時，基於游標的排序可能會在某一頁傳回少於 `limit` 的項目，因為可疑 Skills 會在頁面擷取後被篩掉。
- 當存在 `nextCursor` 時，使用它繼續分頁。短頁面本身不代表已到結果結尾。

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

- 由 owner 重新命名/合併流程建立的舊 slug 會解析到正式 Skill。
- `metadata.os`：在 Skill frontmatter 中宣告的 OS 限制（例如 `["macos"]`、`["linux"]`）。若未宣告則為 `null`。
- `metadata.systems`：Nix system 目標（例如 `["aarch64-darwin", "x86_64-linux"]`）。若未宣告則為 `null`。
- 如果 Skill 沒有平台中繼資料，`metadata` 為 `null`。
- `moderation` 只會在 Skill 被標記或 owner 正在檢視時包含。

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

備註：

- Owner 與 moderator 可以存取隱藏 Skills 的審核詳細資料。
- 公開呼叫者只會對已標記且可見的 Skills 取得 `200`。
- 對公開呼叫者，證據會經過遮蔽；只有 owner/moderator 會包含原始片段。

### `POST /api/v1/skills/{slug}/report`

回報 Skill 以供 moderator 審查。回報屬於 Skill 層級，可選擇連結到某個版本，並會送入 Skill 回報佇列。

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

供 moderator/admin 使用的 Skill 回報接收端點。

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

供 moderator/admin 用來解決或重新開啟 Skill 回報的端點。

請求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` 對 `confirmed` 與 `dismissed` 是必填；將 `status` 設回 `open` 時可以省略。對已分流的回報傳入 `finalAction: "hide"`，可在同一個可稽核工作流程中隱藏該 Skill。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選填）：整數
- `cursor`（選填）：分頁游標

### `GET /api/v1/skills/{slug}/versions/{version}`

傳回版本中繼資料 + 檔案清單。

- `version.security` 會在可用時包含正規化掃描驗證狀態與掃描器詳細資料（VirusTotal + LLM）。

### `GET /api/v1/skills/{slug}/scan`

傳回 Skill 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選填）：特定版本字串。
- `tag`（選填）：解析已加標籤的版本（例如 `latest`）。

備註：

- 如果未提供 `version` 或 `tag`，則使用最新版本。
- 包含正規化驗證狀態，以及掃描器特定詳細資料。
- `security.capabilityTags` 會在偵測到時包含決定性的能力/風險標籤，例如 `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、`requires-oauth-token` 與 `posts-externally`。
- 只有當掃描器產生明確判定（`clean`、`suspicious` 或 `malicious`）時，`security.hasScanResult` 才會是 `true`。
- `moderation` 是從最新版本衍生出的目前 Skill 層級審核快照。
- 查詢歷史版本時，在將 `moderation` 與 `security` 視為相同版本脈絡前，請檢查 `moderation.matchesRequestedVersion` 與 `moderation.sourceVersion`。

### `GET /api/v1/skills/{slug}/file`

傳回原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

備註：

- 預設為最新版本。
- 檔案大小限制：200KB。

### `GET /api/v1/packages`

以下項目的統一目錄端點：

- Skills
- code Plugins
- bundle Plugins

查詢參數：

- `limit`（可選）：整數（1–100）
- `cursor`（可選）：分頁游標
- `family`（可選）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（可選）：`official`、`community` 或 `private`
- `isOfficial`（可選）：`true` 或 `false`
- `executesCode`（可選）：`true` 或 `false`
- `capabilityTag`（可選）：Plugin 套件的能力篩選器
- `target` / `hostTarget`（可選）：`host:<target>` 的簡寫
- `os`、`arch`、`libc`（可選）：主機能力篩選器的簡寫
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  （可選）：環境需求標籤的 `true`/`1` 簡寫
- `externalService`、`binary`、`osPermission`（可選）：具名
  環境需求標籤的簡寫
- `artifactKind`（可選）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（可選）：`true`/`1`，用來顯示可透過 npm 鏡像取得的
  ClawPack 支援套件版本

注意事項：

- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定系列別名。
- Skill 項目仍由 Skill 登錄檔支援，且仍只能透過 `POST /api/v1/skills` 發布。
- `POST /api/v1/packages` 仍只適用於 code-plugin 和 bundle-plugin 發行版。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證的呼叫者可以在清單/搜尋結果中看到其所屬發布者的私有套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。

### `GET /api/v1/packages/search`

跨 Skills + Plugin 套件的統一目錄搜尋。

查詢參數：

- `q`（必填）：查詢字串
- `limit`（可選）：整數（1–100）
- `family`（可選）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（可選）：`official`、`community` 或 `private`
- `isOfficial`（可選）：`true` 或 `false`
- `executesCode`（可選）：`true` 或 `false`
- `capabilityTag`（可選）：Plugin 套件的能力篩選器
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary` 和
  `osPermission` 會作為常見能力標籤的簡寫被接受
- `artifactKind`（可選）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（可選）：`true`/`1`，用來搜尋可透過 npm 鏡像取得的
  ClawPack 支援套件版本

注意事項：

- 匿名呼叫者只能看到公開套件頻道。
- 已驗證的呼叫者可以搜尋其所屬發布者的私有套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。
- 成品篩選器由已索引的能力標籤支援：
  `artifact:legacy-zip`、`artifact:npm-pack` 和 `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

傳回套件詳細中繼資料。

注意事項：

- Skills 也可以透過統一目錄中的此路由解析。
- 私有套件會傳回 `404`，除非呼叫者可以讀取所屬發布者。

### `DELETE /api/v1/packages/{name}`

軟刪除套件和所有發行版。

注意事項：

- 需要套件擁有者、組織發布者擁有者/管理員、
  平台版主或平台管理員的 API 權杖。

### `GET /api/v1/packages/{name}/versions`

傳回版本歷程。

查詢參數：

- `limit`（可選）：整數（1–100）
- `cursor`（可選）：分頁游標

注意事項：

- 私有套件會傳回 `404`，除非呼叫者可以讀取所屬發布者。

### `GET /api/v1/packages/{name}/versions/{version}`

傳回一個套件版本，包含檔案中繼資料、相容性、
能力、驗證、成品中繼資料和掃描資料。

注意事項：

- `version.artifact.kind` 對舊式套件封存檔為 `legacy-zip`，
  對 ClawPack 支援發行版為 `npm-pack`。
- ClawPack 發行版包含與 npm 相容的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 欄位。
- 當掃描資料存在時，會包含 `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 私有套件會傳回 `404`，除非呼叫者可以讀取所屬發布者。

### `GET /api/v1/packages/{name}/versions/{version}/security`

傳回安裝用戶端所需的精確套件發行版安全性與信任摘要。
這是 OpenClaw 用於判斷已解析發行版是否可安裝的公開取用介面。

驗證：

- 公開讀取端點。不需要擁有者、發布者、版主或管理員權杖。

回應：

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

回應欄位：

- `package.name`、`package.displayName` 和 `package.family` 識別已解析的
  登錄檔套件。
- `release.releaseId`、`release.version` 和 `release.createdAt` 識別
  已評估的精確發行版。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum` 和 `release.npmTarballName` 會在發行版成品已知時出現。
- `trust.scanStatus` 是由掃描器輸入和手動發行版審核推導出的有效信任狀態。
- `trust.moderationState` 可為 null。當沒有手動發行版審核時，它是 `null`。
- `trust.blockedFromDownload` 是安裝封鎖訊號。當此值為 `true` 時，OpenClaw 和其他
  安裝用戶端應封鎖安裝，而不是從掃描器或審核欄位重新推導封鎖規則。
- `trust.reasons` 是面向使用者和稽核用的說明清單。原因代碼是穩定、精簡的字串，
  例如 `manual:quarantined`、`scan:malicious`、
  `static:malicious`、`vt:suspicious` 和 `package:malicious`。
- `trust.pending` 表示一個或多個信任輸入仍在等待完成。
- `trust.stale` 表示信任摘要是根據過期輸入計算而成，
  在做出高信心允許決策前，應視為需要重新整理。

注意事項：

- 此端點精確到版本。用戶端應在解析出打算安裝的套件版本後呼叫它，
  而不只是讀取最新套件中繼資料後呼叫。
- 私有套件會傳回 `404`，除非呼叫者可以讀取所屬發布者。
- 此端點刻意比擁有者/版主審核端點更窄。它公開安裝決策和公開說明，
  不公開回報者身分、回報內容、私有證據或內部審查時間線。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

傳回套件版本的明確成品解析器中繼資料。

注意事項：

- 舊式套件版本會傳回 `legacy-zip` 成品和舊式 ZIP
  `downloadUrl`。
- ClawPack 版本會傳回 `npm-pack` 成品、npm integrity 欄位、
  `tarballUrl` 和舊式 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它避免從共用 URL 猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確解析器路徑下載版本成品。

注意事項：

- ClawPack 版本會串流精確上傳的 npm-pack `.tgz` 位元組。
- 舊式 ZIP 版本會重新導向至 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率桶。

### `GET /api/v1/packages/{name}/readiness`

傳回供未來 OpenClaw 取用的計算後就緒狀態。

就緒狀態檢查涵蓋：

- 官方頻道狀態
- 最新版本可用性
- ClawPack npm-pack 成品可用性
- 成品摘要
- 來源儲存庫與提交來源證明
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

用於列出官方 OpenClaw Plugin 遷移列的版主端點。

驗證：

- 需要版主或管理員使用者的 API 權杖。

查詢參數：

- `phase`（可選）：`planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw` 或
  `all`（預設）。
- `limit`（可選）：整數（1-100）
- `cursor`（可選）：分頁游標

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

用於建立或更新官方 Plugin 遷移列的管理員端點。

驗證：

- 需要管理員使用者的 API 權杖。

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

注意事項：

- `bundledPluginId` 會正規化為小寫，並且是穩定的 upsert 鍵。
- `packageName` 會按 npm 名稱正規化；規劃中的遷移可以缺少套件。
- 這只追蹤遷移就緒狀態。它不會變更 OpenClaw 或產生 ClawPack。

### `GET /api/v1/packages/moderation/queue`

用於套件發行版審查佇列的版主/管理員端點。

驗證：

- 需要版主或管理員使用者的 API 權杖。

查詢參數：

- `status`（可選）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（可選）：整數（1-100）
- `cursor`（可選）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、已隔離、已撤銷或已回報的發行版。
- `blocked`：已隔離、已撤銷或惡意的發行版。
- `manual`：任何具有手動審核覆寫的發行版。
- `all`：任何具有手動覆寫、非乾淨掃描狀態或套件回報的發行版。

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
連結到某個版本。它們會進入審核佇列，但本身不會自動隱藏或
封鎖下載；版主應使用發布審核來核准、隔離或撤銷成品。

驗證：

- 需要 API token。

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

用於套件回報受理的版主/管理員端點。

驗證：

- 需要版主或管理員使用者的 API token。

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

用於套件審核可見性的擁有者/版主端點。

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

用於解決或重新開啟套件回報的版主/管理員端點。

請求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` 在 `confirmed` 和 `dismissed` 時為必填；將
`status` 設回 `open` 時可省略。傳入 `finalAction: "quarantine"` 或
`finalAction: "revoke"` 搭配已確認的回報，即可在同一個可稽核工作流程中套用發布審核。

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
- `quarantined`：封鎖並等待後續處理。
- `revoked`：在發布先前受信任後封鎖。

遭隔離與遭撤銷的發布會從成品下載路由回傳 `403`。
每次變更都會寫入稽核記錄項目。

### `POST /api/v1/packages/backfill/artifacts`

僅限管理員的維護端點，用於為較舊的套件發布標記
明確的成品種類中繼資料。

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

備註：

- 預設為 dry-run。
- 沒有 ClawPack 儲存的發布會標記為 `legacy-zip`。
- 既有以 ClawPack 為基礎、但缺少 `artifactKind` 的資料列會修復為
  `npm-pack`。
- 這不會產生 ClawPack 或修改成品位元組。

### `GET /api/v1/packages/{name}/file`

回傳套件檔案的原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

備註：

- 預設為最新發布。
- 使用讀取速率 bucket，而非下載 bucket。
- 二進位檔案回傳 `415`。
- 檔案大小限制：200KB。
- 待處理的 VirusTotal 掃描不會封鎖讀取；惡意發布仍可能在其他地方被保留不提供。
- 私有套件會回傳 `404`，除非呼叫者可讀取擁有它的發布者。

### `GET /api/v1/packages/{name}/download`

下載套件發布的舊版決定性 ZIP 封存檔。

查詢參數：

- `version`（選填）
- `tag`（選填）

備註：

- 預設為最新發布。
- Skills 會重新導向到 `GET /api/v1/download`。
- Plugin/套件封存檔是具有 `package/` 根目錄的 zip 檔，讓舊版 OpenClaw
  用戶端能持續運作。
- 此路由維持僅限 ZIP。它不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和
  `X-ClawHub-Artifact-Sha256` 標頭，供解析器完整性檢查使用。
- 僅存在於登錄檔的中繼資料不會注入下載的封存檔。
- 待處理的 VirusTotal 掃描不會封鎖下載；惡意發布會回傳 `403`。
- 私有套件會回傳 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

回傳以 ClawPack 為基礎的套件版本所用、相容 npm 的 packument。

備註：

- 只會列出具有已上傳 ClawPack npm-pack tarball 的版本。
- 僅限舊版 ZIP 的版本會刻意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用相容 npm 的
  欄位，讓使用者可選擇將 npm 指向該鏡像。
- Scoped 套件 packument 同時支援 `/api/npm/@scope/name` 和 npm 的
  編碼請求路徑 `/api/npm/@scope%2Fname`。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流確切已上傳的 ClawPack tarball 位元組。

備註：

- 使用下載速率 bucket。
- 下載標頭包含 ClawHub SHA-256，以及 npm integrity/shasum 中繼資料。
- 審核與私有套件存取檢查仍然適用。

### `GET /api/v1/resolve`

由 CLI 用於將本機指紋對應到已知版本。

查詢參數：

- `slug`（必填）
- `hash`（必填）：bundle 指紋的 64 字元十六進位 sha256

回應：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下載技能版本的 zip。

查詢參數：

- `slug`（必填）
- `version`（選填）：semver 字串
- `tag`（選填）：標籤名稱（例如 `latest`）

備註：

- 若未提供 `version` 或 `tag`，會使用最新版本。
- 軟刪除的版本會回傳 `410`。
- 下載統計會按每小時唯一身分計算（API token 有效時為 `userId`，否則為 IP）。

## 驗證端點（Bearer token）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證 token 並回傳使用者 handle。

### `POST /api/v1/skills`

發布新版本。

- 建議使用：`multipart/form-data`，其中包含 `payload` JSON + `files[]` blobs。
- 也接受具有 `files`（以 storageId 為基礎）的 JSON 本文。
- 選填 payload 欄位：`ownerHandle`。提供時，API 會在伺服器端解析該
  發布者，並要求行動者具有發布者存取權。
- 選填 payload 欄位：`migrateOwner`。當它與 `ownerHandle` 一起為 `true` 時，若
  行動者同時是目前與目標發布者的管理員/擁有者，既有技能可移至該擁有者。
  若沒有此選擇加入，擁有者變更會遭拒。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 版本。

- 需要 Bearer token 驗證。
- 建議使用：`multipart/form-data`，其中包含 `payload` JSON + `files[]` blobs。
- 也接受具有 `files`（以 storageId 為基礎）的 JSON 本文。
- 選填 payload 欄位：`ownerHandle`。提供時，只有管理員可代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- Plugin 套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳必須
  在 `package/openclaw.plugin.json` 包含它。
- 程式碼 Plugin 需要 `package.json`、原始碼儲存庫中繼資料、來源 commit
  中繼資料、設定結構描述中繼資料、`openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選填中繼資料。
- 只有受信任的發布者可發布到 `official` channel。
- 代表他人發布仍會以目標擁有者帳號驗證 official-channel 資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除/還原技能（擁有者、版主或管理員）。

選填 JSON 本文：

```json
{ "reason": "Held for moderation pending legal review." }
```

提供時，`reason` 會儲存為技能審核備註，並複製到稽核記錄。
由擁有者發起的軟刪除會保留 slug 30 天，之後該 slug 可由
另一個發布者認領。當此到期情況適用時，刪除回應會包含 `slugReservedUntil`。
版主/管理員隱藏與安全性移除不會以這種方式到期。

刪除回應：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

狀態碼：

- `200`：ok
- `401`：未授權
- `403`：禁止
- `404`：找不到技能/使用者
- `500`：內部伺服器錯誤

### `POST /api/v1/users/publisher`

僅限管理員。確保某個 handle 存在組織發布者。若該 handle 仍指向
舊版共用使用者/個人發布者，端點會先將其遷移為組織發布者。

- 本文：`{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

僅限管理員。為合法擁有者保留根 slug 和套件名稱，而不發布
release。套件名稱會成為沒有 release 資料列的私有 placeholder 套件，讓同一
擁有者之後可將真正的 code-plugin 或 bundle-plugin release 發布到該名稱。

- 本文：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 回應：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 擁有者 slug 管理端點

- `POST /api/v1/skills/{slug}/rename`
  - 本文：`{ "newSlug": "new-canonical-slug" }`
  - 回應：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文：`{ "targetSlug": "canonical-target-slug" }`
  - 回應：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

備註：

- 兩個端點都需要 API token 驗證，且僅適用於技能擁有者。
- `rename` 會將先前的 slug 保留為重新導向別名。
- `merge` 會隱藏來源列表，並將來源 slug 重新導向至目標列表。

### 轉移所有權端點

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

封鎖使用者並硬刪除其擁有的 Skills（僅限版主/管理員）。

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

解除封鎖使用者並還原符合資格的 Skills（僅限管理員）。

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

- `q`（選用）：搜尋查詢
- `query`（選用）：`q` 的別名
- `limit`（選用）：結果數上限（預設 20，最大 200）

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

新增/移除星標（重點標示）。兩個端點皆為冪等。

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

## 登錄庫探索（`/.well-known/clawhub.json`）

CLI 可以從網站探索登錄庫/驗證設定：

- `/.well-known/clawhub.json`（JSON，建議使用）
- `/.well-known/clawdhub.json`（舊版）

結構描述：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版為 `CLAWDHUB_REGISTRY`）。
