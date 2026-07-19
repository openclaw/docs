---
read_when:
    - 你希望代理程式要求取得經過篩選的 1Password 機密資訊
    - 你需要針對每個祕密設定核准政策與稽核記錄
    - 你正在為 OpenClaw 設定 1Password 服務帳號
summary: 使用選用的 1Password 外掛作為經稽核的代理程式機密資訊中介服務
title: 1Password 密鑰代理服務
x-i18n:
    generated_at: "2026-07-19T13:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 255ab4fd2c63754fef29d3ea87dcedc9ca2bd2f34bec1f81139e2ce5b6acdba2
    source_path: plugins/onepassword.md
    workflow: 16
---

# 1Password 密鑰代理程式

隨附的 `onepassword` 外掛提供代理程式一項受政策控制的工具，用於
讀取經篩選的一組 1Password 欄位。此工具預設為停用，且在
`plugins.entries.onepassword.config` 存在之前不會執行任何動作。

這是代理程式工具，而非 SecretRef 提供者。它不會注入環境
變數，也不會解析 OpenClaw 設定中的密鑰。

## 安全性模型

- 僅限服務帳戶驗證。權杖會保留在本機認證資訊
  檔案中，且絕不接受在 `openclaw.json` 中提供。
- 僅限經篩選的登錄。代理程式可以列出已設定的 slug，但此外掛絕不會
  列舉 1Password 保存庫。
- 每個 slug 採用 `auto`、`approve` 或 `deny` 政策。
- 核准授權會到期。快取值絕不會略過目前的政策。
- 每次存取嘗試都會記錄在 OpenClaw 的共用 SQLite 狀態中。稽核
  資料列包含提供的理由；請勿在理由中包含敏感資訊。代理程式
  絕不會將擷取的值或服務權杖複製到稽核資料列中。
- 目前的工具執行結束後，OpenClaw 所擁有的逐字稿持久化機制
  會將成功取得的 `get` 值替換為遮蔽後的中繼資料。
- 該次執行期間，模型可看見此值。如果模型將其複製到
  後續工具呼叫或回覆中，該筆個別記錄不在此外掛的
  持久化掛鉤範圍內。請將政策限制在狹窄範圍內，且不要要求模型覆述
  該值。
- 每次快取未命中時，外掛會叫用 `op` 一次。它不會在遇到速率限制或
  其他失敗時重試。
- 每次 `op` 呼叫都會在停用 1Password
  桌面應用程式整合的最小環境中執行（`OP_LOAD_DESKTOP_APP_SETTINGS=false`、
  `OP_BIOMETRIC_UNLOCK_ENABLED=false`），因此安裝在
  閘道主機上的 1Password 應用程式絕不會觸發生物辨識或 macOS 權限對話框。

僅授予服務帳戶對外掛設定中已登錄保存庫和項目的讀取權限。

## 開始之前

你需要：

- 在閘道主機上安裝 1Password 命令列介面（`op`）
- 可存取所選項目的 1Password 服務帳戶
- 專用的服務帳戶權杖檔案

啟用隨附的外掛：

```bash
openclaw plugins enable onepassword
```

在 OpenClaw 狀態目錄下建立權杖目錄和檔案：

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

設定 `OPENCLAW_STATE_DIR` 時，請將 `~/.openclaw` 替換為該目錄。
當群組或其他使用者可讀取或寫入權杖檔案時，外掛會警告一次。

## 設定已登錄的密鑰

將外掛設定新增至 `openclaw.json`：

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

slug 僅能使用小寫字母、數字和連字號，必須以字母或
數字開頭，且最多包含 64 個字元。一個登錄最多可包含 32 個
slug；描述最多可包含 200 個字元。`field` 接受一個欄位
標籤或 ID，不得包含逗號，且預設為 `credential`。
項目層級的 `vault` 會覆寫預設保存庫。`opBin` 可設定 `op` 執行檔的絕對
路徑；否則，外掛會從 `PATH` 解析 `op`。
項目標題不得以連字號開頭。

## 使用代理程式工具

工具名稱是 `onepassword`。

列出已登錄的 slug：

```json
{ "action": "list" }
```

結果僅包含 slug、描述、政策，以及常設
授權是否有效。它絕不包含密鑰值，也不會查詢 1Password。

要求一個密鑰：

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` 為必填、不得為空，且限制為 300 個字元。
成功的 `get` 會傳回該值，以及已設定的 slug、項目標題和
欄位標籤。

工具結構描述也宣告了內部 `authorizationNonce` 參數。
政策層會在評估要求後注入此參數，將授權
交給執行中的工具呼叫。絕不應手動設定：政策掛鉤會覆寫
任何提供的值，而未知值會導致要求失敗。

## 政策層級與核准

- `auto`：立即擷取並稽核要求。
- `deny`：封鎖並稽核要求。
- `approve`：使用尚未到期的常設授權，或要求人工選擇允許一次、
  一律允許或拒絕。

允許一次僅授權目前的工具呼叫。一律允許會將該代理程式和 slug 的常設
授權寫入 SQLite；其他代理程式必須各自取得
核准。只有在呼叫端具有具體代理程式
身分時，OpenClaw 才會提供一律允許選項。授權會在 `grantTtlHours` 後到期，預設為 720 小時。
未解決或逾時的核准會拒絕要求；核准等待時間上限
為 600 秒。外掛最多保留 1,024 個常設授權；達到該
上限時，會淘汰最舊的授權，其代理程式下次存取時必須取得核准。

每次經評估的授權都只能使用一次，並透過共用 SQLite 狀態交給執行中的工具
呼叫，因此即使閘道處理程序中有多個
外掛執行個體處於作用中，此交接仍可運作。未使用的授權會在
600 秒的核准時間窗口後到期。

記憶體內快取預設為 300 秒，且受已設定的
slug 登錄限制。將 `cacheTtlSeconds` 設為 `0` 可停用快取。每次查詢快取前都會評估政策，且快取命中也會接受稽核。執行階段設定重新載入會在每個政策與執行邊界生效；停用外掛，或移除、拒絕或重新指定 slug，都會使待處理的授權和
快取值失效。

## 檢查狀態與稽核記錄

顯示就緒狀態和登錄計數：

```bash
openclaw onepassword status
```

此命令會報告權杖檔案是否存在、`op` 是否已解析及其路徑、
已登錄項目數量，以及各政策的計數。它絕不會讀取或印出
權杖或密鑰值。

顯示最近 50 筆稽核資料列：

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

資料列依時間由新至舊排列，並顯示時間戳記、代理程式、slug、結果、嘗試失敗時的 `errorCode`
以及截短的理由。理由會依原樣儲存；
代理程式絕不會將擷取的值新增至稽核記錄。

## 1Password 命令列介面行為

每次快取未命中時，都會使用已設定的項目、保存庫、精確的
欄位選取器、JSON 輸出、有限的逾時時間，以及 `--cache=false` 執行 `op item get`。子處理程序
只會收到該欄位，而非完整項目。子處理程序環境中僅有
`OP_SERVICE_ACCOUNT_TOKEN` 和 `HOME`。

外掛只會嘗試一次。遇到 `RATE_LIMITED` 錯誤時，應先等待，
再於稍後提出代理程式要求；外掛不會建立自動重試
迴圈。

## 錯誤代碼

失敗的嘗試會在工具結果和稽核
資料列中帶有一個封閉集合內的錯誤代碼。

1Password 存取錯誤：

| 代碼              | 含義                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `TOKEN_MISSING`   | 權杖檔案遺失或為空                                   |
| `OP_NOT_FOUND`    | 無法解析 `op` 二進位檔                                |
| `ITEM_NOT_FOUND`  | 已設定的項目不在保存庫中                              |
| `FIELD_NOT_FOUND` | 項目中沒有已設定的欄位；會列出可用標籤 |
| `RATE_LIMITED`    | 已達 1Password 服務帳戶速率限制                     |
| `AUTH_FAILED`     | 服務帳戶驗證失敗                            |
| `TIMEOUT`         | `op` 超過 `opTimeoutMs`                                      |
| `OP_ERROR`        | 任何其他 `op` 失敗或無效輸出                         |

政策與驗證錯誤：

| 代碼                                               | 含義                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `INVALID_ACTION`、`INVALID_REASON`、`INVALID_SLUG` | 要求未通過輸入驗證                                              |
| `UNKNOWN_SLUG`                                     | slug 不在已設定的登錄中                                       |
| `TOOL_CALL_ID_MISSING`                             | 呼叫抵達時未附帶工具呼叫 ID                                          |
| `POLICY_NOT_EVALUATED`                             | 此呼叫沒有相符的授權；要求未獲政策核准 |
| `POLICY_CHANGED`                                   | 設定在核准與執行之間發生變更                                |
| `GRANT_EXPIRED`                                    | 常設授權在執行前失效                                       |
| `APPROVAL_CANCELLED`                               | 執行在核准待處理期間遭到中止                           |
