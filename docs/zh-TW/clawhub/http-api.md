---
read_when:
    - 新增/變更端點
    - 偵錯 CLI ↔ 登錄庫請求
summary: HTTP API 參考（公開 + CLI 端點 + 身分驗證）。
x-i18n:
    generated_at: "2026-05-13T05:32:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基底 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 下。
舊版 `/api/...` 與 `/api/cli/...` 仍保留以維持相容性（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重用

第三方目錄可以使用公開讀取端點列出或搜尋 ClawHub Skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回標準 ClawHub 列表（`https://clawhub.ai/<owner>/<slug>`），並避免暗示 ClawHub 認可該第三方網站。請勿嘗試在公開 API 介面之外鏡像隱藏、私密或被審核封鎖的內容。

Web slug 捷徑會跨 registry family 解析，但 API 用戶端應使用讀取端點傳回的標準 URL，而不是自行重建路由優先順序。

## 速率限制

執行模型：

- 匿名請求：依 IP 執行。
- 已驗證請求（有效的 Bearer token）：依使用者 bucket 執行。
- 如果 token 缺失或無效，行為會退回 IP 執行。
- 已驗證的寫入端點在伺服器知道原因時，不應只傳回單純的 `Unauthorized`。缺少 token、無效或已撤銷的 token，以及已刪除、被封鎖或已停用的帳號，都應取得可採取行動的文字，讓 CLI 用戶端可以告知使用者遭阻擋的原因。

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
- `Retry-After`：在 `429` 時重試前應等待的秒數（延遲）

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
- 使用帶抖動的 backoff，以避免同步重試。
- 如果缺少 `Retry-After`，請退回使用 `RateLimit-Reset`（或從 `X-RateLimit-Reset` 計算）。

IP 來源：

- 預設使用 `cf-connecting-ip`（Cloudflare）作為用戶端 IP。
- ClawHub 使用受信任的 forwarding headers 在邊緣識別用戶端 IP。
- 如果沒有可用的受信任用戶端 IP，匿名下載請求會使用端點範圍的 fallback bucket，而不是單一全域 `ip:unknown` bucket。匿名讀取/寫入請求仍使用共用的 unknown bucket，讓缺少 IP 的路由維持可見且保守。

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

注意事項：

- 結果會依相關性順序傳回（embedding 相似度 + 精確 slug/name token 加權 + 下載量的熱門度先驗）。
- 相關性比熱門度更重要。精確的 slug 或顯示名稱 token 符合，可以超越下載量多得多但符合較寬鬆的結果。
- ASCII 文字會依字詞和標點邊界進行 tokenization。例如，`personal-map` 包含獨立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜尋 `map` 會讓 `personal-map` 比 `amap-jsapi-skill` 取得更強的詞彙符合。
- 下載量會作為小幅的 log-scaled 先驗與同分決勝因素，而不是主要排名訊號。當查詢文字符合較弱時，高下載量 Skills 可能排名較低。
- 可疑或隱藏的審核狀態可能會依呼叫者篩選器與目前審核狀態，將某個 Skill 從公開搜尋中移除。

發布者可發現性指引：

- 將使用者會實際搜尋的詞放在顯示名稱、摘要與標籤中。只有在獨立 slug token 也是你想保留的穩定身分時才使用它。
- 不要只為了追逐某個查詢而重新命名 slug，除非新的 slug 是更好的長期標準名稱。舊 slug 會成為重新導向別名，但標準 URL、顯示的 slug，以及未來的搜尋摘要會使用新 slug。
- 重新命名別名會保留舊 URL 和透過 registry 解析的安裝解析能力，但搜尋排名會以重新命名索引後的標準 Skill metadata 為準。既有統計資料會保留在該 Skill 上。
- 如果某個 Skill 意外不可見，請先在登入狀態下使用 `clawhub inspect <slug>` 檢查審核狀態，再變更與排名相關的 metadata。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選填）：整數（1–200）
- `cursor`（選填）：任何非 `trending` 排序的分頁 cursor
- `sort`（選填）：`updated`（預設）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）、`installsCurrent`（別名：`installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（選填）：`true` 表示隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選填）：`nonSuspiciousOnly` 的舊版別名

注意事項：

- `trending` 依最近 7 天的安裝數排名（基於 telemetry）。
- `createdAt` 對新 Skill 爬取是穩定的；`updated` 會在既有 Skills 重新發布時變更。
- 當 `nonSuspiciousOnly=true` 時，基於 cursor 的排序在頁面擷取後會篩除可疑 Skills，因此某頁可能回傳少於 `limit` 的項目。
- 當存在 `nextCursor` 時，使用它繼續分頁。短頁本身並不代表結果已結束。

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

- 由 owner rename/merge 流程建立的舊 slug 會解析到標準 Skill。
- `metadata.os`：Skill frontmatter 中宣告的 OS 限制（例如 `["macos"]`、`["linux"]`）。未宣告時為 `null`。
- `metadata.systems`：Nix system 目標（例如 `["aarch64-darwin", "x86_64-linux"]`）。未宣告時為 `null`。
- 如果 Skill 沒有平台 metadata，`metadata` 為 `null`。
- 只有在 Skill 被標記，或 owner 正在查看時，才會包含 `moderation`。

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
- 公開呼叫者只有對已標記且可見的 Skills 會取得 `200`。
- 公開呼叫者的證據會經過遮蔽，且只有 owners/moderators 才包含原始片段。

### `POST /api/v1/skills/{slug}/report`

回報 Skill 以供 moderator 審查。回報屬於 Skill 層級，可選擇連結到某個版本，並會進入 Skill 回報佇列。

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

用於 Skill 回報接收的 moderator/admin 端點。

查詢參數：

- `status`（選填）：`open`（預設）、`confirmed`、`dismissed` 或 `all`
- `limit`（選填）：整數（1-200）
- `cursor`（選填）：分頁 cursor

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

用於解決或重新開啟 Skill 回報的 moderator/admin 端點。

請求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` 在 `confirmed` 和 `dismissed` 時為必填；將 `status` 設回 `open` 時可省略。傳入 `finalAction: "hide"` 搭配已 triage 的回報，可在同一個可稽核工作流程中隱藏該 Skill。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選填）：整數
- `cursor`（選填）：分頁 cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

傳回版本 metadata + 檔案清單。

- `version.security` 會在可用時包含正規化的掃描驗證狀態與掃描器詳細資料（VirusTotal + LLM）。

### `GET /api/v1/skills/{slug}/scan`

傳回 Skill 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選填）：特定版本字串。
- `tag`（選填）：解析標記版本（例如 `latest`）。

注意事項：

- 如果未提供 `version` 或 `tag`，則使用最新版本。
- 包含正規化的驗證狀態，以及掃描器特定詳細資料。
- `security.capabilityTags` 會在偵測到時包含決定性的 capability/risk labels，例如 `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、`requires-oauth-token` 和 `posts-externally`。
- 只有當掃描器產生明確 verdict（`clean`、`suspicious` 或 `malicious`）時，`security.hasScanResult` 才為 `true`。
- `moderation` 是從最新版本衍生出的目前 Skill 層級審核快照。
- 查詢歷史版本時，在將 `moderation` 和 `security` 視為相同版本脈絡前，請先檢查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`。

### `GET /api/v1/skills/{slug}/file`

傳回原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新版本。
- 檔案大小限制：200KB。

### `GET /api/v1/packages`

統一目錄端點，適用於：

- Skills
- code plugins
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
- `npmMirror`（選用）：`true`/`1`，用來顯示可透過 npm 鏡像取得、由 ClawPack 支援的套件版本

注意事項：

- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定系列的別名。
- Skills 項目仍由 Skills 登錄檔支援，且仍只能透過 `POST /api/v1/skills` 發佈。
- `POST /api/v1/packages` 仍僅用於 code-plugin 和 bundle-plugin 發行版本。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證呼叫者可在清單/搜尋結果中看到其所屬發佈者的私有套件。
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
  `osPermission` 會被接受作為常見能力標籤的簡寫
- `artifactKind`（選用）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（選用）：`true`/`1`，用來搜尋可透過 npm 鏡像取得、由 ClawPack 支援的套件版本

注意事項：

- 匿名呼叫者只能看到公開套件頻道。
- 已驗證呼叫者可搜尋其所屬發佈者的私有套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。
- 成品篩選器由已索引的能力標籤支援：
  `artifact:legacy-zip`、`artifact:npm-pack` 和 `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

傳回套件詳細中繼資料。

注意事項：

- Skills 也可以透過統一目錄中的這個路由解析。
- 私有套件會傳回 `404`，除非呼叫者可讀取擁有該套件的發佈者。

### `DELETE /api/v1/packages/{name}`

軟刪除套件及其所有發行版本。

注意事項：

- 需要套件擁有者、組織發佈者擁有者/管理員、平台仲裁員或平台管理員的 API 權杖。

### `GET /api/v1/packages/{name}/versions`

傳回版本歷程。

查詢參數：

- `limit`（選用）：整數（1–100）
- `cursor`（選用）：分頁游標

注意事項：

- 私有套件會傳回 `404`，除非呼叫者可讀取擁有該套件的發佈者。

### `GET /api/v1/packages/{name}/versions/{version}`

傳回一個套件版本，包含檔案中繼資料、相容性、
能力、驗證、成品中繼資料和掃描資料。

注意事項：

- 舊世界套件封存檔的 `version.artifact.kind` 為 `legacy-zip`，由 ClawPack 支援的發行版本則為
  `npm-pack`。
- ClawPack 發行版本包含 npm 相容的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 欄位。
- 有掃描資料時，會包含 `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 私有套件會傳回 `404`，除非呼叫者可讀取擁有該套件的發佈者。

### `GET /api/v1/packages/{name}/versions/{version}/security`

傳回安裝用戶端的確切套件發行版本安全性與信任摘要。這是 OpenClaw 用來判斷已解析發行版本是否可安裝的公開取用介面。

驗證：

- 公開讀取端點。不需要擁有者、發佈者、仲裁員或管理員權杖。

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

- `package.name`、`package.displayName` 和 `package.family` 識別已解析的登錄檔套件。
- `release.releaseId`、`release.version` 和 `release.createdAt` 識別已評估的確切發行版本。
- 若發行版本成品已知，會包含 `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum` 和 `release.npmTarballName`。
- `trust.scanStatus` 是由掃描器輸入和手動發行版本仲裁推導出的有效信任狀態。
- `trust.moderationState` 可為 null。沒有手動發行版本仲裁時為 `null`。
- `trust.blockedFromDownload` 是安裝封鎖訊號。當此值為 `true` 時，OpenClaw 和其他安裝用戶端應封鎖安裝，而不是從掃描器或仲裁欄位重新推導封鎖規則。
- `trust.reasons` 是面向使用者和稽核的說明清單。原因代碼是穩定且精簡的字串，例如 `manual:quarantined`、`scan:malicious`、
  `static:malicious`、`vt:suspicious` 和 `package:malicious`。
- `trust.pending` 表示一個或多個信任輸入仍在等待完成。
- `trust.stale` 表示信任摘要是根據過期輸入計算而來，在做出高信心允許決策前，應視為需要重新整理。

注意事項：

- 此端點精確到版本。用戶端應在解析出打算安裝的套件版本後呼叫它，而不只是讀取最新套件中繼資料後呼叫。
- 私有套件會傳回 `404`，除非呼叫者可讀取擁有該套件的發佈者。
- 此端點刻意比擁有者/仲裁員仲裁端點更窄。它公開安裝決策和公開說明，而不是回報者身分、回報本文、私有證據或內部審查時程。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

傳回套件版本的明確成品解析器中繼資料。

注意事項：

- 舊版套件版本會傳回 `legacy-zip` 成品和舊版 ZIP
  `downloadUrl`。
- ClawPack 版本會傳回 `npm-pack` 成品、npm 完整性欄位、
  `tarballUrl`，以及舊版 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它會避免從共用 URL 猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確的解析器路徑下載版本成品。

注意事項：

- ClawPack 版本會串流確切已上傳的 npm-pack `.tgz` 位元組。
- 舊版 ZIP 版本會重新導向至 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率配額桶。

### `GET /api/v1/packages/{name}/readiness`

傳回供未來 OpenClaw 取用的計算後就緒狀態。

就緒檢查涵蓋：

- 官方頻道狀態
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

用於列出官方 OpenClaw Plugin 遷移列的仲裁員端點。

驗證：

- 需要仲裁員或管理員使用者的 API 權杖。

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

用於建立或更新官方 Plugin 遷移列的管理員端點。

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

注意事項：

- `bundledPluginId` 會正規化為小寫，且是穩定的 upsert 鍵。
- `packageName` 會正規化為 npm 名稱；規劃中的遷移可以缺少套件。
- 這僅追蹤遷移就緒狀態。它不會變更 OpenClaw 或產生 ClawPack。

### `GET /api/v1/packages/moderation/queue`

套件發行版本審查佇列的仲裁員/管理員端點。

驗證：

- 需要仲裁員或管理員使用者的 API 權杖。

查詢參數：

- `status`（選用）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、隔離、撤銷或已回報的發行版本。
- `blocked`：隔離、撤銷或惡意的發行版本。
- `manual`：具有手動仲裁覆寫的任何發行版本。
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

回報套件以供版主審查。回報以套件為層級，可選擇連結至某個版本。它們會進入審核佇列，但本身不會自動隱藏或封鎖下載；版主應使用發行版審核來核准、隔離或撤銷成品。

身分驗證：

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

供版主/管理員接收套件回報的端點。

身分驗證：

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

供擁有者/版主查看套件審核可見性的端點。

身分驗證：

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

供版主/管理員解決或重新開啟套件回報的端點。

要求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` 和 `dismissed` 需要 `note`；將 `status` 設回 `open` 時可省略。傳入 `finalAction: "quarantine"` 或 `finalAction: "revoke"` 搭配已確認的回報，可在同一個可稽核工作流程中套用發行版審核。

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

供版主/管理員審查套件發行版的端點。

要求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支援的狀態：

- `approved`：已人工審查並允許。
- `quarantined`：已封鎖，等待後續處理。
- `revoked`：發行版先前受信任後遭封鎖。

已隔離和已撤銷的發行版會從成品下載路由回傳 `403`。每次變更都會寫入稽核記錄項目。

### `POST /api/v1/packages/backfill/artifacts`

僅限管理員的維護端點，用於為較舊的套件發行版標記明確的成品類型中繼資料。

要求本文：

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
- 沒有 ClawPack 儲存的發行版會標記為 `legacy-zip`。
- 缺少 `artifactKind` 的既有 ClawPack 支援資料列會修復為 `npm-pack`。
- 這不會產生 ClawPack，也不會變更成品位元組。

### `GET /api/v1/packages/{name}/file`

回傳套件檔案的原始文字內容。

查詢參數：

- `path`（必要）
- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新發行版。
- 使用讀取速率 bucket，而非下載 bucket。
- 二進位檔案會回傳 `415`。
- 檔案大小限制：200KB。
- 待處理的 VirusTotal 掃描不會封鎖讀取；惡意發行版仍可能在其他地方被保留。
- 私有套件會回傳 `404`，除非呼叫者可讀取擁有該套件的發布者。

### `GET /api/v1/packages/{name}/download`

下載套件發行版的舊版確定性 ZIP 封存檔。

查詢參數：

- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新發行版。
- Skills 會重新導向至 `GET /api/v1/download`。
- Plugin/套件封存檔是 zip 檔案，並具有 `package/` 根目錄，讓舊版 OpenClaw 用戶端持續運作。
- 此路由維持僅支援 ZIP。它不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和 `X-ClawHub-Artifact-Sha256` 標頭，供解析器完整性檢查使用。
- 純登錄中繼資料不會注入下載的封存檔。
- 待處理的 VirusTotal 掃描不會封鎖下載；惡意發行版會回傳 `403`。
- 私有套件會回傳 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

回傳 ClawPack 支援的套件版本之 npm 相容 packument。

注意事項：

- 只會列出已上傳 ClawPack npm-pack tarball 的版本。
- 舊版 ZIP-only 版本會刻意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用 npm 相容欄位，讓使用者可在選擇時將 npm 指向鏡像。
- 具範圍的套件 packument 同時支援 `/api/npm/@scope/name` 和 npm 的編碼請求路徑 `/api/npm/@scope%2Fname`。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流確切已上傳的 ClawPack tarball 位元組。

注意事項：

- 使用下載速率 bucket。
- 下載標頭包含 ClawHub SHA-256 以及 npm integrity/shasum 中繼資料。
- 仍會套用審核和私有套件存取檢查。

### `GET /api/v1/resolve`

CLI 用於將本機指紋對應至已知版本。

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
- 下載統計會以每小時唯一身分計算（API token 有效時使用 `userId`，否則使用 IP）。

## 身分驗證端點（Bearer token）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證 token 並回傳使用者 handle。

### `POST /api/v1/skills`

發布新版本。

- 建議：使用 `multipart/form-data` 搭配 `payload` JSON + `files[]` blob。
- 也接受含 `files`（storageId-based）的 JSON 本文。
- 選用 payload 欄位：`ownerHandle`。存在時，API 會在伺服器端解析該發布者，並要求動作者具有發布者存取權。
- 選用 payload 欄位：`migrateOwner`。當它與 `ownerHandle` 一起為 `true` 時，如果動作者在目前與目標發布者上都是管理員/擁有者，既有技能可移至該擁有者。若沒有此明確同意，擁有者變更會被拒絕。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 發行版。

- 需要 Bearer token 身分驗證。
- 建議：使用 `multipart/form-data` 搭配 `payload` JSON + `files[]` blob。
- 也接受含 `files`（storageId-based）的 JSON 本文。
- 選用 payload 欄位：`ownerHandle`。存在時，只有管理員可代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- Plugin 套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳必須在 `package/openclaw.plugin.json` 包含它。
- Code Plugin 需要 `package.json`、原始碼 repo 中繼資料、原始碼 commit 中繼資料、設定 schema 中繼資料、`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
- 只有受信任的發布者可發布至 `official` 頻道。
- 代理發布仍會依目標擁有者帳戶驗證 official-channel 資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除 / 還原技能（擁有者、版主或管理員）。

選用 JSON 本文：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在時，`reason` 會儲存為技能審核備註，並複製到稽核記錄。
由擁有者發起的軟刪除會保留 slug 30 天，之後該 slug 可由另一個發布者宣告。
刪除回應會在此到期適用時包含 `slugReservedUntil`。
版主/管理員隱藏和安全性移除不會以這種方式到期。

刪除回應：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

狀態碼：

- `200`：正常
- `401`：未授權
- `403`：禁止
- `404`：找不到技能/使用者
- `500`：內部伺服器錯誤

### `POST /api/v1/users/publisher`

僅限管理員。確保某個 handle 存在組織發布者。如果該 handle 仍指向舊版共用使用者/個人發布者，端點會先將其遷移為組織發布者。

- 本文：`{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

僅限管理員。為正當擁有者保留根 slug 和套件名稱，而不發布發行版。套件名稱會變成沒有發行版資料列的私有佔位套件，因此同一位擁有者之後可將真正的 code-plugin 或 bundle-plugin 發行版發布到該名稱。

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

- 兩個端點都需要 API token 身分驗證，且只對技能擁有者有效。
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

封鎖使用者並永久刪除其擁有的 Skills（僅限版主/管理員）。

請求本文：

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

請求本文：

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

請求本文：

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
- `limit`（選用）：結果數上限（預設 20，最高 200）

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

新增/移除星號（醒目標示）。兩個端點都具備冪等性。

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

CLI 可以從網站探索 registry/驗證設定：

- `/.well-known/clawhub.json`（JSON，建議）
- `/.well-known/clawdhub.json`（舊版）

結構描述：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版為 `CLAWDHUB_REGISTRY`）。
