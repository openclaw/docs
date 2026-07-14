---
read_when:
    - 你希望代理程式要求存取經過篩選的 1Password 密鑰
    - 你需要針對個別祕密設定核准政策與稽核歷程
    - 你正在為 OpenClaw 設定 1Password 服務帳號
summary: 使用選用的 1Password 外掛，作為經稽核的代理程式機密代理服務
title: 1Password 祕密代理服務
x-i18n:
    generated_at: "2026-07-14T13:52:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0b199fcb582739dff5d0f7583482ced8e30dfc7e20b62b984391ad7bb92f67e1
    source_path: plugins/onepassword.md
    workflow: 16
---

# 1Password 機密資訊代理程式

內建的 `onepassword` 外掛為代理程式提供一個受政策控制的工具，用於
讀取經篩選的一組 1Password 欄位。此工具預設為停用，且在
`plugins.entries.onepassword.config` 存在之前不會執行任何操作。

這是代理程式工具，而非 SecretRef 提供者。它不會注入環境
變數，也不會解析 OpenClaw 設定中的機密資訊。

## 安全性模型

- 僅限服務帳戶驗證。權杖會保留在本機認證資訊
  檔案中，且絕不接受將其放在 `openclaw.json` 中。
- 僅限經篩選的登錄項目。代理程式可以列出已設定的 slug，但此外掛絕不會
  列舉 1Password 保存庫。
- 每個 slug 各自套用 `auto`、`approve` 或 `deny` 政策。
- 核准授權會過期。快取值絕不會繞過目前的政策。
- 每次存取嘗試都會記錄在 OpenClaw 的共用 SQLite 狀態中。稽核
  資料列包含提供的理由；理由中請勿包含敏感資訊。此代理程式
  絕不會將擷取的值或服務權杖複製到稽核資料列中。
- 目前的工具執行完成後，OpenClaw 所擁有的對話記錄持久化機制
  會以遮蔽後的中繼資料取代成功取得的 `get` 值。
- 在該次執行期間，模型可看到此值。如果模型將其複製到
  後續的工具呼叫或回覆中，該筆獨立記錄不在此外掛的
  持久化掛鉤範圍內。請嚴格限制政策範圍，且不要要求模型覆述
  此值。
- 每次快取未命中時，此外掛會叫用一次 `op`。它不會因速率限制或
  其他失敗而重試。

僅授予服務帳戶對外掛設定中已登錄保存庫及項目的讀取權限。

## 開始之前

你需要：

- 在閘道主機上安裝 1Password 命令列介面（`op`）
- 可存取所選項目的 1Password 服務帳戶
- 專用的服務帳戶權杖檔案

啟用內建外掛：

```bash
openclaw plugins enable onepassword
```

在 OpenClaw 狀態目錄下建立權杖目錄與檔案：

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

設定 `OPENCLAW_STATE_DIR` 時，請將 `~/.openclaw` 替換為該目錄。
若群組或其他使用者可讀取或寫入權杖檔案，此外掛會警告一次。

## 設定已登錄的機密資訊

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

Slug 可使用小寫字母、數字和連字號，必須以字母或
數字開頭，且最多包含 64 個字元。登錄中最多可包含 32 個
slug；描述最多可包含 200 個字元。`field` 接受一個欄位
標籤或 ID，不得包含逗號，預設為 `credential`。
項目層級的 `vault` 會覆寫預設保存庫。`opBin` 可設定 `op` 可執行檔的絕對
路徑；否則此外掛會從 `PATH` 解析 `op`。
項目標題不得以連字號開頭。

## 使用代理程式工具

工具名稱為 `onepassword`。

列出已登錄的 slug：

```json
{ "action": "list" }
```

結果僅包含 slug、描述、政策，以及常駐
授權是否有效。它絕不包含機密值，也不會查詢 1Password。

要求一項機密資訊：

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` 為必填、不得為空，且最多包含 300 個字元。
成功的 `get` 會傳回此值，以及設定的 slug、項目標題和
欄位標籤。

## 政策層級與核准

- `auto`：立即擷取並稽核該要求。
- `deny`：封鎖並稽核該要求。
- `approve`：使用尚未過期的常駐授權，或請真人選擇允許一次、
  永遠允許或拒絕。

允許一次僅授權目前的工具呼叫。永遠允許會將該代理程式與 slug 的常駐
授權寫入 SQLite；其他代理程式必須分別取得
核准。僅當呼叫者具備明確的代理程式身分時，OpenClaw 才會提供永遠允許
選項。授權會在 `grantTtlHours` 後過期，其預設值為 720 小時。
未解決或逾時的核准會拒絕該要求；核准的最長
等待時間為 600 秒。此外掛最多保留 1,024 筆常駐授權；達到
上限時，最舊的授權會遭移除，而其代理程式下次存取時必須再次取得核准。

記憶體內快取預設為 300 秒，其上限由已設定的
slug 登錄決定。將 `cacheTtlSeconds` 設為 `0` 即可停用快取。每次查詢快取前都會評估
政策，且快取命中也會納入稽核。執行階段設定重新載入會在每個政策與執行
邊界生效；停用外掛，或移除、拒絕或重新指定 slug，會使待處理的授權與
快取值失效。

## 檢查狀態與稽核記錄

顯示就緒狀態與登錄數量：

```bash
openclaw onepassword status
```

此命令會回報權杖檔案是否存在、`op` 是否已解析及其路徑、
已登錄的項目數量，以及各政策的數量。它絕不會讀取或輸出
權杖或機密值。

顯示最近 50 筆稽核資料列：

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

資料列依新至舊排列，並顯示時間戳記、代理程式、slug、結果與截斷後的
理由。理由會依原樣儲存；此代理程式絕不會將擷取的
值新增至稽核記錄。

## 1Password 命令列介面行為

每次快取未命中時，都會使用設定的項目、保存庫和精確
欄位選取器、JSON 輸出、受限逾時，以及 `--cache=false` 執行 `op item get`。子程序
只會接收該欄位，而非完整項目。子程序環境中僅有
`OP_SERVICE_ACCOUNT_TOKEN` 和 `HOME`。

此外掛只會嘗試一次。處理 `RATE_LIMITED` 錯誤時，應先等待，
再由代理程式於稍後提出要求；此外掛不會建立自動重試
迴圈。其他穩定的錯誤代碼會區分權杖或執行檔遺失、項目或欄位遺失、
驗證失敗、逾時，以及其他 `op` 失敗。
