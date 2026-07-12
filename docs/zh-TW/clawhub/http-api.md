---
read_when:
    - 新增／變更端點
    - 偵錯命令列介面 ↔ 登錄檔要求
summary: HTTP API 參考文件（公開端點 + 命令列介面端點 + 驗證）。
x-i18n:
    generated_at: "2026-07-12T14:20:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基礎 URL：`https://clawhub.ai`（預設）。

所有 v1 路徑都位於 `/api/v1/...` 之下。
舊版 `/api/...` 與 `/api/cli/...` 會保留以維持相容性（請參閱 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公開目錄重複利用

第三方目錄可使用公開讀取端點列出或搜尋 ClawHub skills。請快取結果、遵守 `429`/`Retry-After`、將使用者連回標準 ClawHub 列表頁面（`https://clawhub.ai/<owner>/skills/<slug>`），並避免暗示 ClawHub 為該第三方網站背書。請勿嘗試在公開 API 範圍之外鏡像隱藏、私人或遭內容審核封鎖的內容。

網頁 slug 捷徑可跨登錄檔系列解析，但 API 用戶端應使用讀取端點傳回的標準 URL，而非自行重建路由優先順序。

## 速率限制

強制執行模型：

- 匿名請求：依 IP 強制執行。
- 已驗證請求（有效的 Bearer 權杖）：依使用者配額強制執行。
- 若權杖缺失或無效，行為會退回依 IP 強制執行。
- 當伺服器知道原因時，已驗證的寫入端點不應只傳回 `Unauthorized`。權杖缺失、權杖無效或已撤銷，以及帳號已刪除、封禁或停用，都應各自取得可採取行動的文字，讓命令列介面用戶端能告知使用者遭到阻擋的原因。

- 讀取：每個 IP 每分鐘 3000 次，每個金鑰每分鐘 12000 次
- 寫入：每個 IP 每分鐘 300 次，每個金鑰每分鐘 3000 次
- 下載：每個 IP 每分鐘 1200 次，每個金鑰每分鐘 6000 次（下載端點）

標頭：

- 舊版相容性：`X-RateLimit-Limit`、`X-RateLimit-Reset`
- 標準化：`RateLimit-Limit`、`RateLimit-Reset`
- 發生 `429` 時：`X-RateLimit-Remaining: 0` 與 `RateLimit-Remaining: 0`
- 發生 `429` 時：`Retry-After`

標頭語意：

- `X-RateLimit-Reset`：絕對 Unix 紀元秒數
- `RateLimit-Reset`：距離重設的秒數（延遲）
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：若存在，表示確切的剩餘配額。
  分片處理的成功請求會省略此標頭，而非傳回近似的全域值。
- `Retry-After`：發生 `429` 時，重試前應等待的秒數（延遲）

`429` 回應範例：

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

已超過速率限制
```

用戶端指引：

- 若 `Retry-After` 存在，請等待該秒數後再重試。
- 使用帶有隨機抖動的退避機制，以避免同步重試。
- 若缺少 `Retry-After`，請退回使用 `RateLimit-Reset`（或根據 `X-RateLimit-Reset` 計算）。

IP 來源：

- 僅當部署明確啟用受信任的轉送標頭時，才會使用受信任的用戶端 IP 標頭，包括 `cf-connecting-ip`。
- ClawHub 在邊緣使用受信任的轉送標頭識別用戶端 IP。
- 若無法取得受信任的用戶端 IP，匿名請求會使用僅依速率限制種類劃分的備援配額。這些備援配額不包含呼叫端提供的路徑、slug、套件名稱、版本、查詢字串或其他成品參數。

## 錯誤回應

公開 v1 錯誤回應為純文字，且 `content-type: text/plain; charset=utf-8`。
其中包括驗證失敗（`400`）、缺少公開資源（`404`）、驗證與權限失敗（`401`/`403`）、速率限制（`429`），以及遭封鎖的下載。用戶端應將回應本文讀取為人類可讀的字串。為維持相容性，未知的查詢參數會被忽略，但已辨識且值無效的查詢參數會傳回 `400`。

## 公開端點（無須驗證）

### `GET /api/v1/search`

查詢參數：

- `q`（必要）：查詢字串
- `limit`（選用）：整數
- `highlightedOnly`（選用）：設為 `true` 以僅篩選精選 skills
- `nonSuspiciousOnly`（選用）：設為 `true` 以隱藏可疑的（`flagged.suspicious`）skills
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

- 結果依相關性排序傳回（嵌入相似度 + 完全相符的 slug/名稱詞元加權 + 小幅熱門度先驗）。
- 相關性的權重高於熱門度。精確符合 slug 或顯示名稱詞元的結果，排名可能高於互動量大幅更高但符合程度較寬鬆的結果。
- ASCII 文字會依單字與標點符號邊界切分為詞元。例如，`personal-map` 包含獨立的 `map` 詞元，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 與 `skill`；因此搜尋 `map` 時，`personal-map` 的詞彙符合度會高於 `amap-jsapi-skill`。
- 熱門度會以對數縮放並設定上限。查詢文字符合度較弱時，高互動量的 skills 排名仍可能較低。
- 視呼叫端篩選條件與目前的內容審核狀態而定，可疑或隱藏的內容審核狀態可能會使 skill 從公開搜尋中移除。

發布者可搜尋性指引：

- 將使用者會實際搜尋的詞彙放入顯示名稱、摘要與標籤。只有當獨立的 slug 詞元同時也是你希望保留的穩定識別名稱時，才使用該詞元。
- 除非新 slug 是更適合長期使用的標準名稱，否則不要只為了迎合單一查詢而重新命名 slug。舊 slug 會成為重新導向別名，但標準 URL、顯示的 slug，以及未來的搜尋摘要都會使用新 slug。
- 重新命名別名會維持舊 URL 與透過登錄檔解析之安裝作業的解析能力，但重新命名完成索引後，搜尋排名會以標準 skill 中繼資料為依據。現有統計資料會保留在該 skill 上。
- 若 skill 意外不可見，請先在登入狀態下使用 `clawhub inspect @owner/slug` 檢查內容審核狀態，再變更與排名相關的中繼資料。

### `GET /api/v1/skills`

查詢參數：

- `limit`（選用）：整數（1–200）
- `cursor`（選用）：任何非 `trending` 排序的分頁游標
- `sort`（選用）：`updated`（預設）、`recommended`（別名：`default`）、`createdAt`（別名：`newest`）、`downloads`、`stars`（別名：`rating`）；舊版安裝別名 `installsCurrent`/`installs`/`installsAllTime` 會對應至 `downloads`；`trending`
- `nonSuspiciousOnly`（選用）：設為 `true` 以隱藏可疑的（`flagged.suspicious`）skills
- `nonSuspicious`（選用）：`nonSuspiciousOnly` 的舊版別名

無效的 `sort` 值會傳回 `400`。

注意事項：

- `recommended` 使用互動量與近期性訊號。
- `trending` 依過去 7 天內的安裝次數排名（以遙測資料為依據）。
- `createdAt` 對新 skill 的檢索作業而言是穩定的；現有 skills 重新發布時，`updated` 會變更。
- 當 `nonSuspiciousOnly=true` 時，因為可疑的 skills 會在擷取頁面後才被篩除，所以以游標為基礎的排序可能在某一頁傳回少於 `limit` 個項目。
- 當 `nextCursor` 存在時，使用它繼續分頁。單一頁面項目較少，本身不表示已到達結果結尾。

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

- 由擁有者重新命名或合併流程所建立的舊 slug 會解析至標準 skill。
- `metadata.os`：skill frontmatter 中宣告的作業系統限制（例如 `["macos"]`、`["linux"]`）。若未宣告則為 `null`。
- `metadata.systems`：Nix 系統目標（例如 `["aarch64-darwin", "x86_64-linux"]`）。若未宣告則為 `null`。
- 若 skill 沒有平台中繼資料，`metadata` 會是 `null`。
- 僅當 skill 已被標記，或擁有者正在檢視它時，才會包含 `moderation`。

### `GET /api/v1/skills/{slug}/moderation`

傳回結構化的內容審核狀態。

回應：

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "偵測到：suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "偵測到動態程式碼執行。",
        "evidence": ""
      }
    ]
  }
}
```

注意事項：

- 擁有者與內容審核員可存取隱藏 skills 的內容審核詳細資料。
- 公開呼叫端只會對已標記且可見的 skills 取得 `200`。
- 對公開呼叫端，證據會經過遮蔽；只有擁有者與內容審核員可取得原始程式碼片段。

### `POST /api/v1/skills/{slug}/report`

回報 skill 以供內容審核員審查。回報以 skill 為單位，可選擇連結至某個版本，並會送入 skill 回報佇列。

驗證：

- 需要 API 權杖。

請求：

```json
{ "reason": "可疑的安裝步驟", "version": "1.2.3" }
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

供內容審核員／管理員接收 skill 回報的端點。

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
      "reason": "可疑的安裝步驟",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "回報者"
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

供內容審核員／管理員解決或重新開啟 skill 回報的端點。

請求：

```json
{ "status": "confirmed", "note": "已審查並隱藏受影響的版本。", "finalAction": "hide" }
```

`confirmed` 與 `dismissed` 狀態需要 `note`；將 `status` 設回 `open` 時可以省略。若要在同一個可稽核的工作流程中隱藏 skill，請對已分流處理的回報傳入 `finalAction: "hide"`。

### `GET /api/v1/skills/{slug}/versions`

查詢參數：

- `limit`（選用）：整數
- `cursor`（選用）：分頁游標

### `GET /api/v1/skills/{slug}/versions/{version}`

傳回版本中繼資料與檔案清單。

- 若可用，`version.security` 會包含正規化的掃描驗證狀態與掃描器詳細資料（VirusTotal + LLM）。

### `GET /api/v1/skills/{slug}/scan`

傳回 skill 版本的安全掃描驗證詳細資料。

查詢參數：

- `version`（選用）：特定版本字串。
- `tag`（選用）：解析已加上標籤的版本（例如 `latest`）。

注意事項：

- 若未提供 `version` 或 `tag`，則使用最新版本。
- 包含正規化的驗證狀態，以及掃描器特定的詳細資訊。
- 僅當掃描器產生明確判定（`clean`、`suspicious` 或 `malicious`）時，`security.hasScanResult` 才會是 `true`。
- `moderation` 是從最新版本衍生的目前 Skill 層級內容審核快照。
- 查詢歷史版本時，請先檢查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`，再將 `moderation` 與 `security` 視為相同的版本脈絡。

### `POST /api/v1/skills/-/scan`

用於提交新 ClawScan 工作的已驗證端點。

已不再支援本機上傳掃描。使用
`multipart/form-data` 或 `{ "source": { "kind": "upload" } }` 的請求會傳回 `410`。

已發布的掃描使用 JSON：

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

備註：

- 掃描請求酬載與可下載的報告會在保留期限過後，從掃描請求儲存區中移除。
- 已發布的掃描需要擁有者／發布者管理存取權，或平台版主／管理員權限。
- 只有在 `update: true` 且掃描成功完成時，已發布的掃描才會回寫。
- 回應為 `202`，並包含 `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`。
- 掃描工作採非同步執行。手動掃描請求的優先順序高於一般發布／回填工作，但完成時間仍取決於工作程序是否可用。

### `GET /api/v1/skills/-/scan/{scanId}`

已提交掃描的需驗證輪詢端點。

- 傳回已排入佇列／執行中／成功／失敗狀態。
- 排入佇列時傳回 `queue.queuedAhead` 和 `queue.position`，讓用戶端能顯示有多少個優先處理的手動掃描排在該請求之前。對於非常大的佇列，回報值會設有上限，並以 `queuedAheadIsEstimate: true` 表示為估計值。
- 若可用，`report` 會包含 `clawscan`、`skillspector`、`staticAnalysis` 和 `virustotal` 區段。
- 失敗的掃描作業會傳回 `status: "failed"`，並附上 `lastError`。

### `GET /api/v1/skills/-/scan/{scanId}/download`

需驗證的報告封存檔端點。

- 掃描必須已成功；尚未進入終止狀態的掃描會傳回 `409`。
- 傳回包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md` 的 ZIP 檔案。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

已提交版本之已儲存報告封存檔的需驗證端點。

- 必須具備該 Skills 或外掛的擁有者／發布者管理存取權，或擁有平台版主／管理員權限。
- 傳回所提交確切版本的已儲存掃描結果，包括已封鎖或隱藏的版本。
- `kind` 預設為 `skill`；外掛／套件掃描請使用 `kind=plugin`。
- 傳回與掃描請求下載項目相同結構的 ZIP 檔案。

### `POST /api/v1/skills/-/scan/batch`

僅限管理員使用的標準批次重新掃描路由。它接受與舊版 `POST /api/v1/skills/-/rescan-batch` 相同的酬載格式。

### `POST /api/v1/skills/-/scan/batch/status`

僅限管理員使用的標準批次狀態路由。它接受 `{ "jobIds": ["..."] }`，並傳回與舊版 `POST /api/v1/skills/-/rescan-batch/status` 相同的彙總計數器。

### `GET /api/v1/skills/{slug}/verify`

傳回 `clawhub skill verify` 使用的 Skill Card 驗證封裝。

查詢參數：

- `version`（選填）：特定版本字串。
- `tag`（選填）：解析加上標籤的版本（例如 `latest`）。

注意事項：

- 僅當所選版本已有產生的 Skill Card、未因惡意軟體而遭內容審核封鎖，且 ClawScan 驗證結果為安全時，`ok` 才會是 `true`。
- Skill 身分、發布者身分及所選版本的中繼資料是封裝的頂層欄位（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`），因此 Shell 自動化作業無須解開巢狀包裝即可讀取。
- `security` 是頂層的 ClawScan／安全性裁定。自動化作業應以 `ok`、`decision`、`reasons` 及 `security.status` 為判斷依據。
- `security.signals` 包含掃描器的佐證，例如 `staticScan`、`virusTotal` 及 `skillSpector`。
- 為了維持 v1 回應相容性，會保留 `security.signals.dependencyRegistry`，但相依套件登錄存在性掃描器已停用，因此此鍵一律為 `null`。
- 僅當 ClawHub 在發布或匯入期間解析並儲存了 GitHub 儲存庫／參照／提交／路徑時，`provenance` 才會是 `server-resolved-github-import`；否則為 `unavailable`。

### `POST /api/v1/skills/-/security-verdicts`

傳回指定 Skill 確切版本目前的精簡安全性裁定。此集合端點供已知需要顯示哪些已安裝 ClawHub Skill 版本的用戶端使用，例如 OpenClaw Control UI。

請求：

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

注意事項：

- `items` 必須包含 1-100 組不重複的 `{ slug, version }` 配對。
- 結果會依項目分別回傳；缺少一個 Skill 或版本不會導致整個回應失敗。
- 回應僅包含安全性資訊，不包含 Skill Card 資料、已產生卡片的狀態、成品檔案清單或詳細的掃描器酬載。
- `security.signals` 僅包含狀態層級的佐證；如需完整的掃描器詳細資料，請使用 `/scan` 或 ClawHub 安全性稽核頁面。
- 為了維持 v1 回應相容性，會保留 `security.signals.dependencyRegistry`，但相依套件登錄存在性掃描器已停用，因此此鍵一律為 `null`。
- 缺少 Skill Card 不會影響此端點的 `ok`、`decision` 或 `reasons`；用戶端需要卡片內容時，應在本機讀取已安裝的 `skill-card.md`。
- 如需單一 Skill 的 Skill Card 驗證封裝，請使用 `/verify`；如需產生的卡片 Markdown，請使用 `/card`；如需詳細的掃描器資料，請使用 `/scan`。

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
      "error": { "code": "version_not_found", "message": "找不到版本" },
      "security": null
    }
  ]
}
```

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

以下項目的統一目錄端點：

- Skills
- 程式碼外掛
- 組合包外掛

查詢參數：

- `limit`（選填）：整數（1–100）
- `cursor`（選填）：分頁游標
- `family`（選填）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選填）：`official`、`community` 或 `private`
- `isOfficial`（選填）：`true` 或 `false`
- `sort`（選填）：`updated`（預設）、`recommended`、`trending`、`downloads`，舊版別名 `installs`
- `category`（選填）：外掛類別篩選器。僅當請求範圍限定於外掛套件（`/api/v1/plugins`、`/api/v1/code-plugins`、`/api/v1/bundle-plugins`，或使用 `family=code-plugin`/`family=bundle-plugin` 的套件端點）時支援。受控類別與舊版 v1 篩選器別名記載於 `GET /api/v1/plugins`。

注意事項：

- `family`、`channel`、`isOfficial`、`featured`、`highlightedOnly` 或 `sort` 的值無效時，會傳回 `400`。未知的查詢參數會被忽略。
- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍為固定套件系列的別名。
- Skill 項目仍由 Skill 登錄檔提供支援，且仍只能透過 `POST /api/v1/skills` 發布。
- `POST /api/v1/packages` 仍僅供程式碼外掛與組合包外掛版本發布使用。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證身分的呼叫者可在清單／搜尋結果中看到其所屬發布者的私人套件。
- `channel=private` 僅傳回已驗證身分的呼叫者可讀取的套件。

### `GET /api/v1/packages/search`

跨 Skills 與外掛套件的統一目錄搜尋。

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數（1–100）
- `family`（選填）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（選填）：`official`、`community` 或 `private`
- `isOfficial`（選填）：`true` 或 `false`
- `category`（選填）：外掛類別篩選器。僅當請求範圍限定於外掛套件時支援。受控類別與舊版 v1 篩選器別名記載於 `GET /api/v1/plugins`。

注意事項：

- `family`、`channel`、`isOfficial`、`featured` 或 `highlightedOnly` 的值無效時，會傳回 `400`。未知的查詢參數會被忽略。
- 匿名呼叫者只能看到公開套件頻道。
- 已驗證身分的呼叫者可搜尋其所屬發布者的私人套件。
- `channel=private` 僅傳回已驗證身分的呼叫者可讀取的套件。

### `GET /api/v1/plugins`

僅限外掛的目錄瀏覽，涵蓋程式碼外掛與組合包外掛套件。

查詢參數：

- `limit`（選填）：整數（1-100）
- `cursor`（選填）：分頁游標
- `isOfficial`（選填）：`true` 或 `false`
- `sort`（選填）：`recommended`（預設）、`trending`、`downloads`、`updated`，舊版別名 `installs`
- `category`（選填）：外掛類別篩選器。目前的值：
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

讀取端點仍接受舊版 v1 篩選器別名：

- `mcp-tooling`、`data` 和 `automation` 會解析為 `tools`。
- `observability` 和 `deployment` 會解析為 `gateway`。
- `dev-tools` 會解析為 `runtime`。

`trending` 是七天內的安裝／下載排行榜，不使用歷來累計總數。
在統一的 `/api/v1/packages` 端點上，此排序僅適用於外掛；Skill 目錄請使用
`/api/v1/skills?sort=trending`。

儲存或作者宣告的類別值不接受舊版別名。

### `GET /api/v1/skills/export`

大量匯出最新的公開 Skills，以供離線分析。

驗證：

- 需要 API 權杖。

查詢參數：

- `startDate`（必填）：Skill `updatedAt` 的 Unix 毫秒下限。
- `endDate`（必填）：Skill `updatedAt` 的 Unix 毫秒上限。
- `limit`（選填）：整數（1-250），預設為 `250`。
- `cursor`（選填）：前一個回應中的分頁游標。

回應：

- 主體：ZIP 封存檔。
- 每個匯出的 Skill 均以 `{publisher}/{slug}/` 為根目錄。
- 託管的 Skills 包含最新儲存版本的檔案，並列於 `_manifest.json` 中，且含有 `sourceRef: "public-clawhub"`。
- 目前由 GitHub 支援且掃描結果為 `clean` 或 `suspicious` 的 Skills 包含 `_source_handoff.json`，其中含有 `sourceRef: "public-github"`、儲存庫、提交、路徑、內容雜湊及封存檔 URL。這些 Skills 不包含由 ClawHub 託管的原始檔案。
- 每個 Skill 都包含 `_export_skill_meta.json`。
- ZIP 根目錄一律包含 `_manifest.json`。
- 當個別 Skills 或檔案無法匯出時，會包含 `_errors.json`。

標頭：

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

大量匯出最新的公開外掛版本，以供離線分析。

驗證：

- 需要 API 權杖。

查詢參數：

- `startDate`（必要）：外掛 `updatedAt` 的 Unix 毫秒下限。
- `endDate`（必要）：外掛 `updatedAt` 的 Unix 毫秒上限。
- `limit`（選用）：整數（1-250），預設為 `250`。
- `cursor`（選用）：來自上一個回應的分頁游標。
- `family`（選用）：`code-plugin` 或 `bundle-plugin`。省略時表示同時包含兩個外掛
  系列。

回應：

- 主體：ZIP 封存檔。
- 每個匯出的外掛均以 `{family}/{packageName}/` 為根目錄。
- 每個匯出的外掛都包含最新版本已儲存的檔案。
- 各外掛的匯出中繼資料儲存於
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`。
- ZIP 根目錄一律包含 `_manifest.json`。
- 當個別外掛或檔案無法
  匯出時，會包含 `_errors.json`。

標頭：

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

僅限外掛的搜尋，涵蓋程式碼外掛與套件組合外掛套件。

查詢參數：

- `q`（必填）：查詢字串
- `limit`（選填）：整數（1-100）
- `isOfficial`（選填）：`true` 或 `false`
- `category`（選填）：外掛類別篩選條件。目前的值：
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

注意事項：

- 也接受 `GET /api/v1/plugins` 下記載的舊版 v1 篩選條件別名。
- 類別篩選是由外掛類別摘要資料列支援的實際 API 篩選條件，而非改寫搜尋查詢。
- 結果會依相關性排序傳回，目前不支援分頁。
- 瀏覽器 UI 中的外掛搜尋排序控制項會重新排列已載入的相關性搜尋結果，
  與目前的 `/skills` 瀏覽行為一致。

### `GET /api/v1/packages/{name}`

傳回套件詳細中繼資料。

注意事項：

- 在統一目錄中，也可以透過此路由解析 Skills。
- 除非呼叫端可以讀取所屬發布者的內容，否則私有套件會傳回 `404`。

### `DELETE /api/v1/packages/{name}`

將套件及其所有版本標記為刪除。

注意事項：

- 需要套件擁有者、組織發布者擁有者／管理員、平台版主或平台管理員的 API 權杖。

### `GET /api/v1/packages/{name}/versions`

傳回版本歷程記錄。

查詢參數：

- `limit`（選用）：整數（1–100）
- `cursor`（選用）：分頁游標

注意事項：

- 除非呼叫者可以讀取所屬發布者，否則私人套件會傳回 `404`。

### `GET /api/v1/packages/{name}/versions/{version}`

傳回單一套件版本，包括檔案中繼資料、相容性、驗證、成品中繼資料及掃描資料。

注意事項：

- 對於舊式套件封存檔，`version.artifact.kind` 為 `legacy-zip`；對於由 ClawPack 支援的版本，則為 `npm-pack`。
- ClawPack 版本包含與 npm 相容的 `npmIntegrity`、`npmShasum` 和 `npmTarballName` 欄位。
- `version.sha256hash` 是供舊版用戶端使用的已棄用相容性中繼資料。它會雜湊 `/api/v1/packages/{name}/download` 傳回的確切 ZIP 位元組。現代用戶端應使用 `version.artifact.sha256`，其可識別標準版本成品。
- 若掃描資料存在，則會包含 `version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 除非呼叫者可以讀取所屬發布者，否則私人套件會傳回 `404`。

### `GET /api/v1/packages/{name}/versions/{version}/security`

傳回供安裝用戶端使用的確切套件版本安全性與信任摘要。這是 OpenClaw 的公開取用介面，用於判斷解析後的版本是否可以安裝。

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

- `package.name`、`package.displayName` 和 `package.family` 用於識別解析後的登錄套件。
- `release.releaseId`、`release.version` 和 `release.createdAt` 用於識別受評估的確切版本。
- 若版本成品的相關資訊已知，則會提供 `release.artifactKind`、`release.artifactSha256`、`release.npmIntegrity`、`release.npmShasum` 和 `release.npmTarballName`。
- `trust.scanStatus` 是從掃描器輸入和手動版本審核衍生出的有效信任狀態。
- `trust.moderationState` 可為 null。若不存在手動版本審核，其值為 `null`。
- `trust.blockedFromDownload` 是安裝封鎖訊號。當此值為 `true` 時，OpenClaw 和其他安裝用戶端應封鎖安裝，而非根據掃描器或審核欄位重新推導封鎖規則。
- `trust.reasons` 是面向使用者及供稽核使用的說明清單。原因代碼是穩定、精簡的字串，例如 `manual:quarantined`、`scan:malicious` 和 `package:malicious`。
- `trust.pending` 表示一項或多項信任輸入仍在等待完成。
- `trust.stale` 表示信任摘要是根據過時的輸入計算而得；在做出高可信度的允許決策前，應將其視為需要重新整理。

注意事項：

- 此端點精確對應特定版本。用戶端應在解析出預計安裝的套件版本後呼叫此端點，而不應只在讀取最新套件中繼資料後呼叫。
- 除非呼叫者可以讀取所屬發布者，否則私人套件會傳回 `404`。
- 此端點刻意比擁有者／版主的審核端點更精簡。它會公開安裝決策和公開說明，但不會公開檢舉者身分、檢舉內容、私人證據或內部審查時間軸。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

傳回套件版本的明確成品解析器中繼資料。

注意事項：

- 舊版套件版本會傳回 `legacy-zip` 成品和舊版 ZIP
  `downloadUrl`。
- ClawPack 版本會傳回 `npm-pack` 成品、npm 完整性欄位、
  `tarballUrl`，以及舊版 ZIP 相容性 URL。
- 這是 OpenClaw 解析器介面；它避免從共用 URL
  猜測封存格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

透過明確的解析器路徑下載版本成品。

注意事項：

- ClawPack 版本會串流傳輸上傳時完全相同的 npm-pack `.tgz` 位元組。
- 舊版 ZIP 版本會重新導向至 `/api/v1/packages/{name}/download?version=`。
- 使用下載速率限制配額。

### `GET /api/v1/packages/{name}/readiness`

傳回計算出的就緒狀態，供 OpenClaw 未來使用。

就緒狀態檢查涵蓋：

- 官方通道狀態
- 最新版本可用性
- ClawPack npm-pack 成品可用性
- 成品摘要
- 來源儲存庫和提交來源資訊
- OpenClaw 相容性中繼資料
- 主機目標
- 掃描狀態

回應：

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "範例外掛",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack 成品",
      "status": "fail",
      "message": "最新版本僅提供舊版 ZIP。"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

列出官方 OpenClaw 外掛遷移資料列的版主端點。

驗證：

- 需要版主或管理員使用者的 API 權杖。

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
      "blockers": ["缺少 ClawPack"],
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

建立或更新官方外掛遷移資料列的管理員端點。

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
  "blockers": ["缺少 ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "正在等待發布者上傳"
}
```

注意事項：

- `bundledPluginId` 會正規化為小寫，並作為穩定的更新插入鍵。
- `packageName` 會依 npm 名稱正規化；規劃中的遷移可以缺少套件。
- 這只會追蹤遷移就緒狀態，不會修改 OpenClaw 或產生
  ClawPack。

### `GET /api/v1/packages/moderation/queue`

套件版本審查佇列的版主／管理員端點。

驗證：

- 需要版主或管理員使用者的 API 權杖。

查詢參數：

- `status`（選用）：`open`（預設）、`blocked`、`manual` 或 `all`
- `limit`（選用）：整數（1-100）
- `cursor`（選用）：分頁游標

狀態含義：

- `open`：可疑、惡意、待處理、已隔離、已撤銷或遭檢舉的版本。
- `blocked`：已隔離、已撤銷或惡意的版本。
- `manual`：任何具有手動審核覆寫的版本。
- `all`：任何具有手動覆寫、非乾淨掃描狀態或套件檢舉的版本。

回應：

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "範例外掛",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "手動審查",
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

檢舉套件以供版主審查。檢舉以套件為單位，也可選擇連結至某個版本。
檢舉會進入審核佇列，但本身不會自動隱藏套件或封鎖下載；
版主應使用版本審核來核准、隔離或撤銷成品。

驗證：

- 需要 API 權杖。

要求：

```json
{ "reason": "可疑的原生二進位檔", "version": "1.2.3" }
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

套件回報受理的版主／管理員端點。

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

供擁有者／版主查看套件審核狀態的端點。

驗證：

- 需要套件擁有者、發布者成員、版主或
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

供版主／管理員解決或重新開啟套件回報的端點。

請求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` 和 `dismissed` 必須提供 `note`；將 `status`
設回 `open` 時可以省略。對已確認的回報傳入 `finalAction: "quarantine"`
或 `finalAction: "revoke"`，即可在同一個可稽核工作流程中套用發行版本審核處置。

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

供版主／管理員審查套件發行版本的端點。

請求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支援的狀態：

- `approved`：已手動審查並允許。
- `quarantined`：封鎖並等待後續處理。
- `revoked`：先前信任某個發行版本後予以封鎖。

隔離和撤銷的發行版本，其成品下載路由會傳回 `403`。
每次變更都會寫入稽核記錄項目。

### `GET /api/v1/packages/{name}/file`

傳回套件檔案的原始文字內容。

查詢參數：

- `path`（必填）
- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新發行版本。
- 使用讀取速率配額，而不是下載速率配額。
- 二進位檔案會傳回 `415`。
- 檔案大小限制：200KB。
- 等待中的 VirusTotal 掃描不會封鎖讀取；惡意發行版本仍可能在其他地方遭到扣留。
- 私人套件會傳回 `404`，除非呼叫者可以讀取所屬發布者的內容。

### `GET /api/v1/packages/{name}/download`

下載套件發行版本的舊版確定性 ZIP 封存檔。

查詢參數：

- `version`（選填）
- `tag`（選填）

注意事項：

- 預設為最新發行版本。
- Skills 會重新導向至 `GET /api/v1/download`。
- 外掛／套件封存檔是以 `package/` 為根目錄的 zip 檔案，讓舊版 OpenClaw
  用戶端能繼續運作。
- 此路由僅維持 ZIP 格式，不會串流 ClawPack `.tgz` 檔案。
- 回應包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和
  `X-ClawHub-Artifact-Sha256` 標頭，供解析器進行完整性檢查。
- 僅限登錄檔的中繼資料不會注入下載的封存檔。
- 等待中的 VirusTotal 掃描不會封鎖下載；惡意發行版本會傳回 `403`。
- 私人套件會傳回 `404`，除非呼叫者是擁有者。

### `GET /api/npm/{package}`

傳回 ClawPack 支援之套件版本的 npm 相容 packument。

注意事項：

- 僅列出已上傳 ClawPack npm-pack tarball 的版本。
- 刻意省略只有舊版 ZIP 的版本。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用 npm 相容
  欄位，讓使用者能在需要時將 npm 指向此鏡像。
- 有範圍套件的 packument 同時支援 `/api/npm/@scope/name` 和 npm
  編碼後的 `/api/npm/@scope%2Fname` 請求路徑。

### `GET /api/npm/{package}/-/{tarball}.tgz`

為 npm 鏡像用戶端串流實際上傳的 ClawPack tarball 位元組。

注意事項：

- 使用下載速率配額。
- 下載標頭包含 ClawHub SHA-256，以及 npm 完整性／shasum 中繼資料。
- 審核和私人套件存取檢查仍然適用。

### `GET /api/v1/resolve`

命令列介面用此端點將本機指紋對應至已知版本。

查詢參數：

- `slug`（必填）
- `hash`（必填）：套件指紋的 64 字元十六進位 sha256

回應：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下載託管 Skills 版本 ZIP；或者，針對目前由 GitHub 支援、掃描結果為
`clean` 或 `suspicious`，且沒有託管版本的 Skills，傳回 GitHub 來源移交資訊。

查詢參數：

- `slug`（必填）
- `version`（選填）：semver 字串
- `tag`（選填）：標籤名稱（例如 `latest`）

注意事項：

- 若未提供 `version` 或 `tag`，則使用最新版本。
- 軟刪除的版本會傳回 `410`。
- GitHub 支援的 Skills 移交不會代理或鏡像位元組。JSON 回應
  包含 `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`
  和 `archiveUrl`；掃描／目前狀態是閘門條件，不會納入成功
  承載資料的中繼資料。
- 下載統計以 UTC 每日的唯一身分計算（API 權杖有效時使用 `userId`，否則使用 IP）。

## 驗證端點（Bearer 權杖）

所有端點都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

驗證權杖並傳回使用者代稱。

### `POST /api/v1/skills`

發布新版本。

- 建議使用：包含 `payload` JSON 與 `files[]` blob 的 `multipart/form-data`。
- 也接受包含 `files`（以 storageId 為基礎）的 JSON 主體。
- 選用承載欄位：`ownerHandle`。提供時，API 會在伺服器端解析該
  發布者，並要求執行者具有發布者存取權限。
- 選用承載欄位：`migrateOwner`。與 `ownerHandle` 一起設為 `true` 時，若
  執行者同時是目前和目標發布者的管理員／擁有者，現有 Skills 可移轉給該
  擁有者。若未選擇加入此行為，將拒絕變更擁有者。

### `POST /api/v1/packages`

發布 code-plugin 或 bundle-plugin 發行版本。

- 需要 Bearer 權杖驗證。
- 需要 `multipart/form-data`。
- 允許的表單欄位為 `payload`、重複的 `files` blob，或一個 `clawpack`
  tarball 參照。`clawpack` 可以是 `.tgz` blob，或上傳網址流程傳回的 storage id。
  使用暫存 storage-id 發布時，也必須包含該上傳網址所傳回的
  `clawpackUploadTicket`。
- 請使用 `files` 或 `clawpack`，絕不可在同一請求中同時使用兩者。
- JSON 主體和呼叫者提供的 `payload.files`／`payload.artifact`
  中繼資料會遭到拒絕。
- 直接 multipart 發布請求上限為 18MB。ClawPack tarball 可
  使用上傳網址流程，最高可達 120MB tarball 上限。
- 選用承載欄位：`ownerHandle`。提供時，只有管理員能代表該擁有者發布。

驗證重點：

- `family` 必須是 `code-plugin` 或 `bundle-plugin`。
- 外掛套件需要 `openclaw.plugin.json`。ClawPack `.tgz` 上傳內容必須
  在 `package/openclaw.plugin.json` 包含此檔案。
- 程式碼外掛需要 `package.json`、原始碼儲存庫中繼資料、原始碼提交
  中繼資料、設定結構描述中繼資料、`openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是選用中繼資料。
- 只有 `openclaw` 組織發布者，以及目前 `openclaw` 組織成員的
  個人發布者，可以發布至 `official` 頻道。
- 代表他人發布時，仍會依照目標擁有者帳號驗證 official 頻道資格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

軟刪除／還原 Skills（擁有者、版主或管理員）。

選用 JSON 主體：

```json
{ "reason": "Held for moderation pending legal review." }
```

提供時，`reason` 會儲存為 Skills 審核備註，並複製到稽核記錄中。
擁有者發起的軟刪除會保留 slug 30 天，之後其他發布者即可
取得該 slug。此到期規則適用時，刪除回應會包含 `slugReservedUntil`。
版主／管理員隱藏和安全性移除不會以此方式到期。

刪除回應：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

狀態碼：

- `200`：成功
- `401`：未經驗證
- `403`：禁止存取
- `404`：找不到 Skills／使用者
- `500`：內部伺服器錯誤

### `POST /api/v1/users/publisher`

僅限管理員。確保某個代稱已有組織發布者。若該代稱仍指向
舊版共用使用者／個人發布者，此端點會先將其移轉為組織發布者。
若是新建立的組織，請提供 `memberHandle`；執行操作的管理員不會加入為成員。
`memberRole` 預設為 `owner`。

- 主體：`{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

已驗證使用者自行建立組織發布者。建立新的組織發布者，並將
呼叫者加入為擁有者。此端點不會移轉現有的使用者／個人代稱，也
不會將發布者標示為可信任／官方。

- 主體：`{ "handle": "opik", "displayName": "Opik" }`
- 回應：`{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- 當代稱已由發布者、使用者或個人發布者使用時，傳回 `409`。

### `POST /api/v1/users/reserve`

僅限管理員。在不發布發行版本的情況下，為合法擁有者保留根 slug 和套件名稱。
套件名稱會成為沒有發行版本資料列的私人預留位置套件，讓同一
擁有者之後能將實際的 code-plugin 或 bundle-plugin 發行版本發布至該名稱。

- 主體：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 回應：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

僅限管理員。為已驗證的替代 GitHub OAuth 主體復原個人發布者，
不必編輯 Convex Auth 帳號資料列。請求必須指定兩個不可變的 GitHub
提供者帳號 ID；可變的代稱僅作為面向操作人員的防護條件。

此端點預設為試執行。若要套用復原，工作人員必須先獨立驗證兩個
GitHub 主體之間的延續性，之後需設定 `dryRun: false` 和
`confirmIdentityVerified: true`。當目的地使用者目前的個人
發布者擁有 Skills、套件或 GitHub Skill 來源時，復原會以失敗關閉方式處理。
復原也會遷移已復原發布者之 Skills、Skill slug 別名、套件、套件檢查器警告及衍生搜尋摘要資料列中的舊版 `ownerUserId` 欄位，使
直接擁有者路徑與新的發布者權限一致。已復原控制代碼的有效受保護控制代碼
保留項目也會重新指派給替代使用者，使後續的
個人檔案同步無法還原前一位使用者的競爭權限。每個主要資料表在每次套用交易中以
100 筆資料列為上限；較大型的復原必須先使用可續行的擁有者遷移。
GitHub Skill 來源的範圍限定於發布者，且會回報為已檢查，而不會重寫。

- 主體：`{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- 回應：`{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 擁有者 slug 管理端點

- `POST /api/v1/skills/{slug}/rename`
  - 主體：`{ "newSlug": "new-canonical-slug" }`
  - 回應：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 主體：`{ "targetSlug": "canonical-target-slug" }`
  - 回應：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

注意事項：

- 兩個端點都需要 API 權杖驗證，且僅適用於 Skill 擁有者。
- `rename` 會將先前的 slug 保留為重新導向別名。
- `merge` 會隱藏來源清單，並將來源 slug 重新導向至目標清單。

### 轉移擁有權端點

- `POST /api/v1/skills/{slug}/transfer`
  - 主體：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - 回應：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 回應（接受／拒絕／取消）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 回應結構：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

封鎖使用者並永久刪除其擁有的 Skills（僅限版主／管理員）。

主體：

```json
{ "handle": "user_handle", "reason": "選填的封鎖原因" }
```

或

```json
{ "userId": "users_...", "reason": "選填的封鎖原因" }
```

回應：

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

解除封鎖使用者並還原符合資格的 Skills（僅限管理員）。

本文：

```json
{ "handle": "user_handle", "reason": "選填的解除封鎖原因" }
```

或

```json
{ "userId": "users_...", "reason": "選填的解除封鎖原因" }
```

回應：

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

變更現有封鎖所儲存的原因，但不解除封鎖或還原內容（僅限管理員）。除非 `dryRun` 為 `false`，否則預設為試執行。

本文：

```json
{ "handle": "user_handle", "reason": "大量發布垃圾內容", "dryRun": true }
```

或

```json
{ "userId": "users_...", "reason": "大量發布垃圾內容", "dryRun": false }
```

回應：

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "惡意軟體自動封鎖",
  "nextReason": "大量發布垃圾內容",
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

- `q`（選填）：搜尋查詢
- `query`（選填）：`q` 的別名
- `limit`（選填）：結果數上限（預設 20，最大 200）

回應：

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "使用者",
      "name": "使用者",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

新增／移除星號（醒目標示）。兩個端點皆具冪等性。

回應：

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 舊版命令列介面端點（已淘汰）

仍支援較舊的命令列介面版本：

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

移除計畫請參閱 `DEPRECATIONS.md`。

`POST /api/cli/upload-url` 會傳回 `uploadUrl` 和 `uploadTicket`。發布套件時，若暫存了 ClawPack tarball，必須將產生的儲存空間 ID 以 `clawpack` 傳送，並將傳回的票證以 `clawpackUploadTicket` 傳送。

## 登錄檔探索（`/.well-known/clawhub.json`）

命令列介面可以從網站探索登錄檔／驗證設定：

- `/.well-known/clawhub.json`（JSON，建議使用）
- `/.well-known/clawdhub.json`（舊版）

結構描述：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

若你自行託管，請提供此檔案（或明確設定 `CLAWHUB_REGISTRY`；舊版為 `CLAWDHUB_REGISTRY`）。
