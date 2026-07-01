---
read_when:
    - 新增/變更端點
    - 偵錯命令列介面 ↔ 登錄檔請求
summary: HTTP API 參考（公開 + 命令列介面端點 + 身分驗證）。
x-i18n:
    generated_at: "2026-07-01T12:47:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基礎 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 之下。
舊版 `/api/...` 和 `/api/cli/...` 會保留以維持相容性（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重用

第三方目錄可使用公開讀取端點來列出或搜尋 ClawHub Skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回正式的 ClawHub 列表（`https://clawhub.ai/<owner>/skills/<slug>`），並避免暗示 ClawHub 為第三方網站背書。請勿嘗試在公開 API 介面之外鏡像隱藏、私密或遭審核封鎖的內容。

網頁 slug 捷徑會跨登錄系列解析，但 API 用戶端應使用讀取端點傳回的正式 URL，而不是自行重建路由優先順序。

## 速率限制

強制執行模型：

- 匿名請求：依 IP 強制執行。
- 已驗證請求（有效的 Bearer token）：依使用者 bucket 強制執行。
- 如果 token 缺失或無效，行為會退回以 IP 強制執行。
- 已驗證的寫入端點在伺服器知道原因時，不應只回傳單純的 `Unauthorized`。缺少 token、無效/已撤銷的 token，以及已刪除/遭禁止/停用的帳號，都應取得可操作的文字，讓命令列介面用戶端能告知使用者被封鎖的原因。

- 讀取：每 IP 3000/min，每 key 12000/min
- 寫入：每 IP 300/min，每 key 3000/min
- 下載：每 IP 1200/min，每 key 6000/min（下載端點）

標頭：

- 舊版相容性：`X-RateLimit-Limit`、`X-RateLimit-Reset`
- 標準化：`RateLimit-Limit`、`RateLimit-Reset`
- 在 `429` 時：`X-RateLimit-Remaining: 0` 和 `RateLimit-Remaining: 0`
- 在 `429` 時：`Retry-After`

標頭語意：

- `X-RateLimit-Reset`：絕對 Unix epoch 秒數
- `RateLimit-Reset`：距離重設的秒數（延遲）
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：存在時表示精確的剩餘額度。
  分片的成功請求會省略此標頭，而不是回傳近似的全域值。
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
- 使用加入 jitter 的 backoff，以避免同步重試。
- 如果缺少 `Retry-After`，請退回使用 `RateLimit-Reset`（或從 `X-RateLimit-Reset` 計算）。

IP 來源：

- 只有在部署明確啟用受信任的 forwarded headers 時，才會使用受信任的用戶端 IP 標頭，包括 `cf-connecting-ip`。
- ClawHub 使用受信任的 forwarding headers 在邊緣識別用戶端 IP。
- 如果沒有可用的受信任用戶端 IP，匿名請求會使用僅依速率限制種類限定範圍的 fallback buckets。這些 fallback buckets 不包含呼叫者提供的路徑、slug、套件名稱、版本、查詢字串或其他 artifact 參數。

## 錯誤回應

公開 v1 錯誤回應是純文字，且 `content-type: text/plain; charset=utf-8`。
這包括驗證失敗（`400`）、缺少公開資源（`404`）、驗證與權限失敗（`401`/`403`）、速率限制（`429`），以及遭封鎖的下載。用戶端應將回應本文讀取為人類可讀的字串。未知查詢參數會因相容性而被忽略，但已識別的查詢參數若值無效，會回傳 `400`。

## 公開端點（無需驗證）

### `GET /api/v1/search`

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數
- `highlightedOnly`（選填）：`true` 可篩選為精選 Skills
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

注意事項：

- 結果會依相關性順序傳回（embedding 相似度 + 精確 slug/name token 加權 + 少量熱門度先驗）。
- 相關性比熱門度更強。精確的 slug 或 display-name token 符合，可能會排在互動量高得多但匹配較寬鬆的結果之前。
- ASCII 文字會依單字與標點邊界 tokenized。例如，`personal-map` 包含獨立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜尋 `map` 時，`personal-map` 會比 `amap-jsapi-skill` 取得更強的詞彙匹配。
- 熱門度採 log 縮放並設有上限。當查詢文字的匹配較弱時，高互動量的 Skills 可能排名較低。
- 可疑或隱藏的審核狀態可能會根據呼叫者篩選器與目前審核狀態，將某個 Skill 從公開搜尋中移除。

發布者可發現性指引：

- 將使用者會實際搜尋的詞放在顯示名稱、摘要和標籤中。只有當獨立的 slug token 同時也是你想保留的穩定身分時，才使用它。
- 不要只為追逐某個查詢而重新命名 slug，除非新的 slug 是更好的長期正式名稱。舊 slug 會成為重新導向別名，但正式 URL、顯示的 slug，以及未來搜尋摘要會使用新 slug。
- 重新命名別名會保留舊 URL，以及透過登錄解析之安裝的解析能力，但搜尋排名會根據重新命名已建立索引後的正式 Skill metadata。既有統計資料會留在該 Skill 上。
- 如果某個 Skill 意外不可見，請先在登入狀態下使用 `clawhub inspect @owner/slug` 檢查審核狀態，再變更與排名相關的 metadata。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選填）：整數（1–200）
- `cursor`（選填）：任何非 `trending` 排序的分頁游標
- `sort`（選填）：`updated`（預設）、`recommended`（別名：`default`）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）、舊版安裝別名 `installsCurrent`/`installs`/`installsAllTime` 對應至 `downloads`、`trending`
- `nonSuspiciousOnly`（選填）：`true` 可隱藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（選填）：`nonSuspiciousOnly` 的舊版別名

無效的 `sort` 值會回傳 `400`。

注意事項：

- `recommended` 使用互動量與時效性訊號。
- `trending` 依過去 7 天的安裝量排名（基於 telemetry）。
- `createdAt` 對新 Skill crawl 是穩定的；`updated` 會在既有 Skills 重新發布時變更。
- 當 `nonSuspiciousOnly=true` 時，游標式排序可能會在某頁回傳少於 `limit` 的項目，因為可疑 Skills 會在取回頁面後被篩除。
- 當存在 `nextCursor` 時，請使用它繼續分頁。短頁本身不代表已到結果結尾。

回應：

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- 由 owner 重新命名/合併流程建立的舊 slug 會解析至正式 Skill。
- `metadata.os`：Skill frontmatter 中宣告的 OS 限制（例如 `["macos"]`、`["linux"]`）。未宣告時為 `null`。
- `metadata.systems`：Nix system targets（例如 `["aarch64-darwin", "x86_64-linux"]`）。未宣告時為 `null`。
- 如果該 Skill 沒有平台 metadata，`metadata` 會是 `null`。
- 只有當該 Skill 被標記，或 owner 正在檢視時，才會包含 `moderation`。

### `GET /api/v1/skills/{slug}/moderation`

傳回結構化的審核狀態。

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

- Owners 與 moderators 可存取隱藏 Skills 的審核詳細資料。
- 公開呼叫者只會針對已標記且可見的 Skills 取得 `200`。
- 公開呼叫者的 evidence 會經過遮蔽，且只有 owners/moderators 會包含原始片段。

### `POST /api/v1/skills/{slug}/report`

回報 Skill 以供 moderator 審查。回報屬於 Skill 層級，可選擇性連結至某個版本，並會送入 Skill report queue。

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

供 moderator/admin 接收 Skill report 的端點。

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

供 moderator/admin 解決或重新開啟 Skill report 的端點。

請求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` 對 `confirmed` 和 `dismissed` 為必填；將 `status` 設回 `open` 時可省略。請將 `finalAction: "hide"` 搭配已 triage 的 report 傳入，以便在同一個可稽核工作流程中隱藏該 Skill。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選填）：整數
- `cursor`（選填）：分頁游標

### `GET /api/v1/skills/{slug}/versions/{version}`

傳回版本 metadata + 檔案清單。

- `version.security` 在可用時，會包含正規化的掃描驗證狀態與掃描器詳細資料（VirusTotal + LLM）。

### `GET /api/v1/skills/{slug}/scan`

傳回 Skill 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選填）：特定版本字串。
- `tag`（選填）：解析已標記的版本（例如 `latest`）。

注意事項：

- 如果未提供 `version` 或 `tag`，則使用最新版本。
- 包含正規化的驗證狀態，以及掃描器特定的詳細資訊。
- 只有當掃描器產生明確判定（`clean`、`suspicious` 或 `malicious`）時，`security.hasScanResult` 才會是 `true`。
- `moderation` 是從最新版本衍生出的目前技能層級審核快照。
- 查詢歷史版本時，請先檢查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`，再將 `moderation` 與 `security` 視為相同版本脈絡。

### `POST /api/v1/skills/-/scan`

已驗證的新 ClawScan 工作提交端點。

不再支援本機上傳掃描。使用
`multipart/form-data` 或 `{ "source": { "kind": "upload" } }` 的請求會回傳 `410`。

已發布掃描使用 JSON：

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

注意事項：

- 掃描請求酬載和可下載報告會在保留期限後從掃描請求儲存區過期。
- 已發布掃描需要擁有者/發布者管理存取權，或平台審核者/管理員權限。
- 只有在 `update: true` 且掃描成功完成時，已發布掃描才會寫回。
- 回應為 `202`，內容為 `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`。
- 掃描工作是非同步的。手動掃描請求會優先於一般發布/回填工作，但完成時間仍取決於工作處理器可用性。

### `GET /api/v1/skills/-/scan/{scanId}`

已驗證的已提交掃描輪詢端點。

- 回傳已排隊/執行中/成功/失敗狀態。
- 排隊時會回傳 `queue.queuedAhead` 和 `queue.position`，讓用戶端可顯示請求前方有多少優先手動掃描。非常大的佇列會受限並以 `queuedAheadIsEstimate: true` 回報。
- 可用時，`report` 會包含 `clawscan`、`skillspector`、`staticAnalysis` 和 `virustotal` 區段。
- 失敗的掃描工作會回傳 `status: "failed"` 並附上 `lastError`。

### `GET /api/v1/skills/-/scan/{scanId}/download`

已驗證的報告封存端點。

- 需要成功完成的掃描；非終止狀態的掃描會回傳 `409`。
- 回傳一個 ZIP，內含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

已驗證的已提交版本儲存報告封存端點。

- 需要技能或外掛的擁有者/發布者管理存取權，或平台審核者/管理員權限。
- 回傳精確提交版本的已儲存掃描結果，包括遭封鎖或隱藏的版本。
- `kind` 預設為 `skill`；外掛/套件掃描請使用 `kind=plugin`。
- 回傳與掃描請求下載相同的 ZIP 形狀。

### `POST /api/v1/skills/-/scan/batch`

僅限管理員使用的標準批次重新掃描路由。它接受與舊版 `POST /api/v1/skills/-/rescan-batch` 相同的酬載形狀。

### `POST /api/v1/skills/-/scan/batch/status`

僅限管理員使用的標準批次狀態路由。它接受 `{ "jobIds": ["..."] }`，並回傳與舊版 `POST /api/v1/skills/-/rescan-batch/status` 相同的彙總計數器。

### `GET /api/v1/skills/{slug}/verify`

回傳 `clawhub skill verify` 使用的技能卡驗證信封。

查詢參數：

- `version`（選用）：特定版本字串。
- `tag`（選用）：解析已標記版本（例如 `latest`）。

注意事項：

- 只有當所選版本具有已產生的技能卡、未被審核標記為惡意軟體封鎖，且 ClawScan 驗證為乾淨時，`ok` 才會是 `true`。
- 技能身分、發布者身分和所選版本中繼資料是頂層信封欄位（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`），因此 shell 自動化可在不解開巢狀包裝的情況下讀取它們。
- `security` 是頂層 ClawScan/安全判定。自動化應以 `ok`、`decision`、`reasons` 和 `security.status` 為依據。
- `security.signals` 包含支援掃描器證據，例如 `staticScan`、`virusTotal` 和 `skillSpector`。
- `security.signals.dependencyRegistry` 保留供 v1 回應相容性使用，但相依性登錄存在性掃描器已退役，且此鍵一律為 `null`。
- 只有當 ClawHub 在發布或匯入期間解析並儲存 GitHub repo/ref/commit/path 時，`provenance` 才會是 `server-resolved-github-import`；否則為 `unavailable`。

### `POST /api/v1/skills/-/security-verdicts`

回傳精確技能版本目前的精簡安全判定。此
集合端點適用於已知道需要顯示哪些已安裝
ClawHub 技能版本的用戶端，例如 OpenClaw Control UI。

請求：

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

注意事項：

- `items` 必須包含 1-100 組唯一的 `{ slug, version }` 配對。
- 結果依項目分開；單一缺少的技能或版本不會讓整個回應失敗。
- 回應僅包含安全資訊。它不包含技能卡資料、已產生卡片狀態、成品檔案清單或詳細掃描器酬載。
- `security.signals` 僅包含狀態層級的支援證據；完整掃描器詳細資訊請使用 `/scan` 或 ClawHub security-audit 頁面。
- `security.signals.dependencyRegistry` 保留供 v1 回應相容性使用，但相依性登錄存在性掃描器已退役，且此鍵一律為 `null`。
- 技能卡缺少不會影響此端點的 `ok`、`decision` 或 `reasons`；需要卡片內容時，用戶端應在本機讀取已安裝的 `skill-card.md`。
- 當你需要單一技能的技能卡驗證信封時使用 `/verify`，需要已產生卡片 Markdown 時使用 `/card`，需要詳細掃描器資料時使用 `/scan`。

回應：

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

傳回原始文字內容。

查詢參數：

- `path`（必要）
- `version`（選用）
- `tag`（選用）

注意事項：

- 預設為最新版本。
- 檔案大小限制：200KB。

### `GET /api/v1/packages`

統一目錄端點，適用於：

- skills
- 程式碼外掛
- 組合包外掛

查詢參數：

- `limit`（選用）：整數（1–100）
- `cursor`（選用）：分頁游標
- `family`（選用）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選用）：`official`、`community` 或 `private`
- `isOfficial`（選用）：`true` 或 `false`
- `sort`（選用）：`updated`（預設）、`recommended`、`trending`、`downloads`、舊版別名 `installs`
- `category`（選用）：外掛類別篩選器。僅在請求範圍限定為外掛套件（`/api/v1/plugins`、`/api/v1/code-plugins`、`/api/v1/bundle-plugins`，或帶有 `family=code-plugin`/`family=bundle-plugin` 的套件端點）時支援。受控類別與舊版 v1 篩選器別名記錄於 `GET /api/v1/plugins`。

注意事項：

- `family`、`channel`、`isOfficial`、`featured`、`highlightedOnly` 或 `sort` 的無效值會傳回 `400`。未知的查詢參數會被忽略。
- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定 family 的別名。
- 技能項目仍由技能登錄檔支援，且仍只能透過 `POST /api/v1/skills` 發布。
- `POST /api/v1/packages` 仍僅用於 code-plugin 和 bundle-plugin 發行版本。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證呼叫者可以在清單/搜尋結果中看到其所屬發布者的私有套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。

### `GET /api/v1/packages/search`

跨 skills 與外掛套件的統一目錄搜尋。

查詢參數：

- `q`（必要）：查詢字串
- `limit`（選用）：整數（1–100）
- `family`（選用）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選用）：`official`、`community` 或 `private`
- `isOfficial`（選用）：`true` 或 `false`
- `category`（選用）：外掛類別篩選器。僅在請求範圍限定為外掛套件時支援。受控類別與舊版 v1 篩選器別名記錄於 `GET /api/v1/plugins`。

注意事項：

- `family`、`channel`、`isOfficial`、`featured` 或 `highlightedOnly` 的無效值會傳回 `400`。未知的查詢參數會被忽略。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證呼叫者可以搜尋其所屬發布者的私有套件。
- `channel=private` 只會傳回已驗證呼叫者可讀取的套件。

### `GET /api/v1/plugins`

僅限外掛的目錄瀏覽，涵蓋 code-plugin 與 bundle-plugin 套件。

查詢參數：

- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標
- `isOfficial`（選用）：`true` 或 `false`
- `sort`（選用）：`recommended`（預設）、`trending`、`downloads`、`updated`、舊版別名 `installs`
- `category`（選用）：外掛類別篩選器。目前值為：
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

舊版 v1 篩選器別名在讀取端點上仍可接受：

- `mcp-tooling`、`data` 和 `automation` 解析為 `tools`。
- `observability` 和 `deployment` 解析為 `gateway`。
- `dev-tools` 解析為 `runtime`。

`trending` 是七天安裝/下載排行榜，不使用歷來總數。
在統一的 `/api/v1/packages` 端點上，它僅適用於外掛；技能目錄請使用
`/api/v1/skills?sort=trending`。

舊版別名不接受作為已儲存或作者宣告的類別值。

### `GET /api/v1/skills/export`

批次匯出最新公開技能，以供離線分析。

驗證：

- 需要 API 權杖。

查詢參數：

- `startDate`（必要）：技能 `updatedAt` 的 Unix 毫秒下限。
- `endDate`（必要）：技能 `updatedAt` 的 Unix 毫秒上限。
- `limit`（選用）：整數（1-250），預設 `250`。
- `cursor`（選用）：上一個回應中的分頁游標。

回應：

- 內文：ZIP 封存檔。
- 每個匯出的技能都以 `{publisher}/{slug}/` 為根目錄。
- 託管技能包含最新儲存版本檔案，並會在 `_manifest.json` 中以 `sourceRef: "public-clawhub"` 列出。
- 目前由 GitHub 支援且掃描結果為 `clean` 或 `suspicious` 的技能，會包含 `_source_handoff.json`，其中含有 `sourceRef: "public-github"`、repo、commit、path、content hash 和 archive URL。它們不包含 ClawHub 託管的原始檔案。
- 每個技能都包含 `_export_skill_meta.json`。
- `_manifest.json` 一律包含在 ZIP 根目錄。
- 當個別技能或檔案無法匯出時，會包含 `_errors.json`。

標頭：

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

批次匯出最新公開外掛版本，以供離線分析。

驗證：

- 需要 API 權杖。

查詢參數：

- `startDate`（必填）：外掛 `updatedAt` 的 Unix 毫秒下限。
- `endDate`（必填）：外掛 `updatedAt` 的 Unix 毫秒上限。
- `limit`（選填）：整數（1-250），預設為 `250`。
- `cursor`（選填）：上一個回應中的分頁游標。
- `family`（選填）：`code-plugin` 或 `bundle-plugin`。省略表示兩種
  外掛家族都包含。

回應：

- 主體：ZIP 封存檔。
- 每個匯出的外掛都以 `{family}/{packageName}/` 為根目錄。
- 每個匯出的外掛都包含最新版本的已儲存檔案。
- 每個外掛的匯出中繼資料儲存在
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`。
- `_manifest.json` 一律包含在 ZIP 根目錄。
- 當個別外掛或檔案無法匯出時，會包含 `_errors.json`。

標頭：

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

僅限外掛的搜尋，跨 code-plugin 與 bundle-plugin 套件。

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數（1-100）
- `isOfficial`（選填）：`true` 或 `false`
- `category`（選填）：外掛分類篩選器。目前的值：
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

注意事項：

- `GET /api/v1/plugins` 底下記錄的舊版 v1 篩選別名也會被接受。
- 分類篩選是真正的 API 篩選器，由外掛分類摘要資料列支援，
  不是搜尋查詢重寫。
- 結果會依相關性順序傳回，目前不分頁。
- 外掛搜尋的瀏覽器介面排序控制項會重新排序已載入的相關性結果，
  與目前的 `/skills` 瀏覽行為相符。

### `GET /api/v1/packages/{name}`

傳回套件詳細中繼資料。

注意事項：

- Skills 也可以透過統一目錄中的此路由解析。
- 私有套件會傳回 `404`，除非呼叫端可以讀取擁有它的發布者。

### `DELETE /api/v1/packages/{name}`

軟刪除套件及所有版本。

注意事項：

- 需要套件擁有者、組織發布者擁有者/管理員、平台仲裁者或平台管理員的 API 權杖。

### `GET /api/v1/packages/{name}/versions`

傳回版本歷史。

查詢參數：

- `limit`（選填）：整數（1–100）
- `cursor`（選填）：分頁游標

注意事項：

- 私有套件會傳回 `404`，除非呼叫端可以讀取擁有它的發布者。

### `GET /api/v1/packages/{name}/versions/{version}`

傳回一個套件版本，包含檔案中繼資料、相容性、
驗證、成品中繼資料與掃描資料。

注意事項：

- `version.artifact.kind` 對舊世界套件封存檔是 `legacy-zip`，
  對 ClawPack 支援的版本是 `npm-pack`。
- ClawPack 版本包含與 npm 相容的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 欄位。
- `version.sha256hash` 是供舊用戶端使用的已棄用相容性中繼資料。它會
  對 `/api/v1/packages/{name}/download` 傳回的精確 ZIP 位元組進行雜湊。
  現代用戶端應使用 `version.artifact.sha256`，它會識別
  標準版本成品。
- 當掃描資料存在時，會包含 `version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 私有套件會傳回 `404`，除非呼叫端可以讀取擁有它的發布者。

### `GET /api/v1/packages/{name}/versions/{version}/security`

傳回安裝用戶端所需的精確套件版本安全性與信任摘要。這是公開的 OpenClaw 消費介面，用於判斷
已解析版本是否可以安裝。

驗證：

- 公開讀取端點。不需要擁有者、發布者、仲裁者或管理員權杖。

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

- `package.name`、`package.displayName` 和 `package.family` 識別
  已解析的登錄套件。
- `release.releaseId`、`release.version` 和 `release.createdAt` 識別
  已評估的精確版本。
- `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、
  `release.npmShasum` 和 `release.npmTarballName` 會在該版本成品已知時出現。
- `trust.scanStatus` 是由掃描器輸入與手動版本仲裁推導出的有效信任狀態。
- `trust.moderationState` 可為 null。沒有手動版本仲裁時為 `null`。
- `trust.blockedFromDownload` 是安裝封鎖訊號。OpenClaw 和其他
  安裝用戶端應在此值為 `true` 時封鎖安裝，而不是
  從掃描器或仲裁欄位重新推導封鎖規則。
- `trust.reasons` 是面向使用者與稽核用的說明清單。原因代碼
  是穩定、精簡的字串，例如 `manual:quarantined`、`scan:malicious`
  和 `package:malicious`。
- `trust.pending` 表示一個或多個信任輸入仍在等待完成。
- `trust.stale` 表示信任摘要是從過期輸入計算而來，
  在做出高信心允許決策前，應視為需要重新整理。

注意事項：

- 此端點精確到版本。用戶端應在解析出
  打算安裝的套件版本後呼叫它，而不只是讀取最新
  套件中繼資料後呼叫。
- 私有套件會傳回 `404`，除非呼叫端可以讀取擁有它的發布者。
- 此端點刻意比擁有者/仲裁者仲裁端點更窄。
  它公開安裝決策與公開說明，而非
  回報者身分、回報內容、私有證據或內部審查
  時間軸。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

傳回套件版本的明確成品解析器中繼資料。

注意事項：

- 舊版套件版本會傳回 `legacy-zip` 成品與舊版 ZIP
  `downloadUrl`。
- ClawPack 版本會傳回 `npm-pack` 成品、npm 完整性欄位、
  `tarballUrl` 和舊版 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它避免從
  共用 URL 猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確解析器路徑下載版本成品。

注意事項：

- ClawPack 版本會串流精確上傳的 npm-pack `.tgz` 位元組。
- 舊版 ZIP 版本會重新導向到 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率桶。

### `GET /api/v1/packages/{name}/readiness`

傳回為未來 OpenClaw 消費計算出的就緒度。

就緒度檢查涵蓋：

- 官方通道狀態
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

用於列出官方 OpenClaw 外掛遷移資料列的仲裁者端點。

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

用於建立或更新官方外掛遷移資料列的管理員端點。

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

- `bundledPluginId` 會正規化為小寫，且是穩定的 upsert 鍵。
- `packageName` 會依 npm 名稱正規化；規劃中的
  遷移可以沒有套件。
- 這只追蹤遷移就緒度。它不會變更 OpenClaw 或產生
  ClawPack。

### `GET /api/v1/packages/moderation/queue`

用於套件版本審查佇列的仲裁者/管理員端點。

驗證：

- 需要仲裁者或管理員使用者的 API 權杖。

查詢參數：

- `status`（選填）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（選填）：整數（1-100）
- `cursor`（選填）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、隔離、撤銷或已回報的版本。
- `blocked`：隔離、撤銷或惡意版本。
- `manual`：任何具有手動仲裁覆寫的版本。
- `all`：任何具有手動覆寫、非乾淨掃描狀態或套件回報的版本。

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

回報套件以供仲裁者審查。回報屬於套件層級，可選擇性地
連結到某個版本。它們會進入仲裁佇列，但本身不會自動隱藏或
封鎖下載；仲裁者應使用版本仲裁來
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

套件檢舉收件用的版主/管理員端點。

驗證：

- 需要版主或管理員使用者的 API 權杖。

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

套件審核可見性用的擁有者/版主端點。

驗證：

- 需要套件擁有者、發布者成員、版主或管理員使用者的 API 權杖。

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

`confirmed` 和 `dismissed` 必須提供 `note`；將 `status` 設回 `open` 時可以省略。對已確認的檢舉傳入 `finalAction: "quarantine"` 或 `finalAction: "revoke"`，即可在同一個可稽核的工作流程中套用版本審核。

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

套件版本審核用的版主/管理員端點。

請求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支援的狀態：

- `approved`：已人工審查並允許。
- `quarantined`：封鎖並等待後續處理。
- `revoked`：先前受信任的版本之後被封鎖。

已隔離和已撤銷的版本會從成品下載路由傳回 `403`。
每次變更都會寫入稽核日誌項目。

### `GET /api/v1/packages/{name}/file`

傳回套件檔案的原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新版本。
- 使用讀取速率桶，而不是下載速率桶。
- 二進位檔案傳回 `415`。
- 檔案大小限制：200KB。
- 待處理的 VirusTotal 掃描不會封鎖讀取；惡意版本仍可能在其他地方被保留不提供。
- 私有套件會傳回 `404`，除非呼叫者可以讀取所屬發布者。

### `GET /api/v1/packages/{name}/download`

下載套件版本的舊版確定性 ZIP 封存。

查詢參數：

- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新版本。
- Skills 會重新導向至 `GET /api/v1/download`。
- 外掛/套件封存是帶有 `package/` 根目錄的 zip 檔案，因此舊版 OpenClaw
  用戶端可以繼續運作。
- 此路由維持僅支援 ZIP。它不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和
  `X-ClawHub-Artifact-Sha256` 標頭，供解析器完整性檢查使用。
- 純登錄中繼資料不會注入到下載的封存中。
- 待處理的 VirusTotal 掃描不會封鎖下載；惡意版本會傳回 `403`。
- 私有套件會傳回 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

傳回由 ClawPack 支援的套件版本的 npm 相容 packument。

注意事項：

- 只會列出已上傳 ClawPack npm-pack tarball 的版本。
- 舊版僅 ZIP 版本會刻意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用 npm 相容欄位，
  因此使用者若選擇，可以將 npm 指向該鏡像。
- 有作用域的套件 packument 同時支援 `/api/npm/@scope/name` 和 npm 的
  編碼 `/api/npm/@scope%2Fname` 請求路徑。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流確切已上傳的 ClawPack tarball 位元組。

注意事項：

- 使用下載速率桶。
- 下載標頭包含 ClawHub SHA-256 加上 npm integrity/shasum 中繼資料。
- 審核和私有套件存取檢查仍然適用。

### `GET /api/v1/resolve`

由命令列介面用來將本機指紋對應到已知版本。

查詢參數：

- `slug`（必填）
- `hash`（必填）：套件組合指紋的 64 字元十六進位 sha256

回應：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下載託管的技能版本 ZIP，或針對目前 GitHub 支援、掃描結果為 `clean` 或 `suspicious` 且沒有託管版本的技能，傳回 GitHub 原始碼交接。

查詢參數：

- `slug`（必填）
- `version`（選填）：semver 字串
- `tag`（選填）：標籤名稱（例如 `latest`）

注意事項：

- 如果未提供 `version` 或 `tag`，會使用最新版本。
- 軟刪除版本會傳回 `410`。
- GitHub 支援的技能交接不會代理或鏡像位元組。JSON 回應包含
  `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`
  和 `archiveUrl`；掃描/目前狀態是閘門，不會包含為成功酬載中繼資料。
- 下載統計會按 UTC 日計為唯一身分（API 權杖有效時使用 `userId`，否則使用 IP）。

## 驗證端點（Bearer 權杖）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證權杖並傳回使用者 handle。

### `POST /api/v1/skills`

發布新版本。

- 偏好：使用帶有 `payload` JSON + `files[]` blob 的 `multipart/form-data`。
- 也接受帶有 `files`（基於 storageId）的 JSON 主體。
- 選填酬載欄位：`ownerHandle`。存在時，API 會在伺服器端解析該發布者，
  並要求執行者具有發布者存取權。
- 選填酬載欄位：`migrateOwner`。當與 `ownerHandle` 一起為 `true` 時，
  如果執行者同時是目前和目標發布者的管理員/擁有者，現有技能可以移至該擁有者。
  若未明確選擇此選項，擁有者變更會被拒絕。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 版本。

- 需要 Bearer 權杖驗證。
- 需要 `multipart/form-data`。
- 允許的表單欄位為 `payload`、重複的 `files` blob，或一個 `clawpack`
  tarball 參照。`clawpack` 可以是 `.tgz` blob，或上傳 URL 流程傳回的儲存 id。
  分段 storage-id 發布也必須包含該上傳 URL 一併傳回的
  `clawpackUploadTicket`。
- 使用 `files` 或 `clawpack` 其中之一，同一個請求中不得同時使用。
- JSON 主體和呼叫者提供的 `payload.files` / `payload.artifact`
  中繼資料會被拒絕。
- 直接 multipart 發布請求上限為 18MB。ClawPack tarball 可使用上傳 URL
  流程，最高可達 120MB tarball 上限。
- 選填酬載欄位：`ownerHandle`。存在時，只有管理員可以代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- 外掛套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳必須在
  `package/openclaw.plugin.json` 包含它。
- 程式碼外掛需要 `package.json`、原始碼儲存庫中繼資料、來源提交中繼資料、
  設定結構描述中繼資料、`openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選填中繼資料。
- 只有 `openclaw` 組織發布者和目前 `openclaw` 組織成員的個人發布者
  可以發布到 `official` 頻道。
- 代表發布仍會針對目標擁有者帳戶驗證 official-channel 資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除 / 還原技能（擁有者、版主或管理員）。

選填 JSON 主體：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在時，`reason` 會儲存為技能審核備註，並複製到稽核日誌。
擁有者發起的軟刪除會保留 slug 30 天，之後另一個發布者可以宣告該 slug。
當此到期適用時，刪除回應會包含 `slugReservedUntil`。
版主/管理員隱藏和安全性移除不會以這種方式到期。

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

僅限管理員。確保某個 handle 存在組織發布者。如果該 handle 仍指向舊版共用使用者/個人發布者，此端點會先將其遷移為組織發布者。
對於新建立的組織，請提供 `memberHandle`；執行操作的管理員不會被加入為成員。
`memberRole` 預設為 `owner`。

- 主體：`{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

已驗證的自助式組織發布者建立。建立新的組織發布者，並將呼叫者加入為擁有者。此端點不會遷移現有使用者/個人 handle，也不會將發布者標記為受信任/官方。

- 主體：`{ "handle": "opik", "displayName": "Opik" }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- 當 handle 已被發布者、使用者或個人發布者使用時，傳回 `409`。

### `POST /api/v1/users/reserve`

僅限管理員。為正當擁有者保留根 slug 和套件名稱，而不發布版本。
套件名稱會成為沒有版本列的私有預留套件，因此同一個擁有者之後可以將真正的 code-plugin 或 bundle-plugin 版本發布到該名稱。

- 主體：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 回應：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

僅限管理員。為已驗證的替代 GitHub OAuth 主體復原個人發布者，而不編輯 Convex Auth 帳戶列。請求必須命名兩個不可變的 GitHub 提供者帳戶 id；可變的 handle 僅作為面向操作員的防護。

端點預設為模擬執行。套用復原需要在工作人員獨立驗證兩個
GitHub 主體之間的連續性後，設定 `dryRun: false` 和
`confirmIdentityVerified: true`。當目的地使用者目前的個人發布者擁有技能、套件或 GitHub 技能來源時，復原會失敗並關閉。
復原也會遷移已復原發布者技能、技能 slug 別名、套件、套件檢查器警告，以及衍生搜尋摘要資料列中的舊版 `ownerUserId` 欄位，讓直接擁有者路徑與新的發布者授權一致。已復原 handle 的有效受保護 handle 保留也會重新指派給替代使用者，這樣後續的個人檔案同步就無法還原前使用者的競爭授權。每個主要資料表在每次套用交易中限制為
100 列；較大的復原必須先使用可恢復的擁有者遷移。
GitHub 技能來源以發布者為範圍，並回報為已檢查，而不是被重寫。

- 本文：`{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- 回應：`{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 擁有者 slug 管理端點

- `POST /api/v1/skills/{slug}/rename`
  - 本文：`{ "newSlug": "new-canonical-slug" }`
  - 回應：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 本文：`{ "targetSlug": "canonical-target-slug" }`
  - 回應：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注意事項：

- 兩個端點都需要 API 權杖驗證，且僅適用於技能擁有者。
- `rename` 會將先前的 slug 保留為重新導向別名。
- `merge` 會隱藏來源清單，並將來源 slug 重新導向至目標清單。

### 轉移所有權端點

- `POST /api/v1/skills/{slug}/transfer`
  - 本文：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - 回應：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 回應（接受/拒絕/取消）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 回應形狀：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

封鎖使用者並硬刪除其擁有的技能（僅限版主/管理員）。

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

### `POST /api/v1/users/reclassify-ban`

變更現有封鎖儲存的原因，而不解除封鎖或還原
內容（僅限管理員）。除非 `dryRun` 為 `false`，否則預設為模擬執行。

本文：

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

或

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

回應：

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
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

新增/移除星號（精選）。兩個端點都是冪等的。

回應：

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 舊版命令列介面端點（已棄用）

仍支援較舊的命令列介面版本：

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

請參閱 `DEPRECATIONS.md` 了解移除計畫。

`POST /api/cli/upload-url` 會傳回 `uploadUrl` 和 `uploadTicket`。暫存 ClawPack tarball 的套件發布必須將產生的儲存空間 ID 作為
`clawpack` 傳送，並將傳回的票證作為 `clawpackUploadTicket` 傳送。

## 登錄探索（`/.well-known/clawhub.json`）

命令列介面可以從網站探索登錄/驗證設定：

- `/.well-known/clawhub.json`（JSON，建議）
- `/.well-known/clawdhub.json`（舊版）

架構：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版為 `CLAWDHUB_REGISTRY`）。
