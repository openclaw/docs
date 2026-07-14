---
read_when:
    - 你想要將 API 金鑰移出 openclaw.json，並存放在 1Password 中
    - 你以無頭模式執行閘道，並需要 op 的服務帳戶驗證
    - 你想要代理程式透過 `op` 命令列介面讀取或注入機密資訊
summary: 使用 1Password 命令列介面解析閘道密鑰，並讓代理程式使用內建的 1password skill
title: 1Password
x-i18n:
    generated_at: "2026-07-14T13:39:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw 以兩種彼此獨立的方式搭配 **1Password**：

- **設定檔密鑰：** `openclaw.json` 中的任何 [SecretRef](/zh-TW/gateway/secrets) 欄位都能在執行階段透過 `op` 命令列介面解析，因此 API 金鑰永遠不會存在設定檔中。
- **代理工作流程：** 內建的 `1password` skill 會教導代理使用 `op` 登入，以及讀取或注入密鑰來完成自己的任務。

## 需求

- 在閘道主機上安裝 [1Password CLI](https://developer.1password.com/docs/cli/get-started/)（`op`；macOS 上為 `brew install 1password-cli`）。
- 設定 `op` 的驗證模式：
  - **服務帳戶**（建議用於無頭閘道）：在閘道服務環境中匯出 `OP_SERVICE_ACCOUNT_TOKEN`。不需要桌面應用程式，也不需要互動式登入。
  - **桌面應用程式整合**：1Password 應用程式在同一台機器上執行，且已啟用命令列介面整合。首次呼叫可能會觸發 Touch ID 或系統驗證。
  - **獨立登入**：`op signin` 會在每個工作階段提示登入。代理可透過 skill 使用此方式，但不適合在無頭閘道上解析設定檔密鑰。

## 使用 op 解析設定檔密鑰

宣告一個執行 `op read` 並帶有 `op://vault/item/field` 參照的 exec 密鑰提供者，接著將任何支援 SecretRef 的欄位指向它：

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew 的符號連結執行檔需要此設定
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

各部分的搭配方式：

- `command` 必須是絕對路徑；`trustedDirs` 會將其目錄標記為受信任，而由於 Homebrew 會以符號連結形式安裝 `op`，因此需要 `allowSymlinkCommand`。
- `args` 會逐字傳遞 `op://vault/item/field` 參照。OpenClaw 本身不會剖析 `op://` 配置；由 `op` 執行檔進行解析。
- `passEnv` 會從閘道環境轉送列出的變數。桌面應用程式整合需要 `HOME`；服務帳戶也需要閘道服務環境中存在 `OP_SERVICE_ACCOUNT_TOKEN`（將它加入 `passEnv`；只有在你接受權杖可從設定檔中讀取的情況下，才透過 `env` 設定）。
- 若輸出單一值，請保留 `id: "value"`。若使用 `jsonOnly: true` 與 JSON 承載資料，則改用 JSON 指標 ID 指定欄位。
- 每個密鑰各使用一個提供者項目，可讓參照便於稽核；請依使用者為提供者命名（`onepassword_openai`、`onepassword_telegram`）。

如需解析順序、快取與失敗語意，請參閱[閘道密鑰](/zh-TW/gateway/secrets)；如需所有接受 SecretRef 的欄位，請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## 無頭閘道的服務帳戶設定

1. 在你的 1Password 帳戶中建立服務帳戶，且僅授予其讀取閘道所需保管庫項目的權限。
2. 將 `OP_SERVICE_ACCOUNT_TOKEN` 提供給閘道服務（launchd plist、systemd unit 或容器環境變數）。
3. 將 `"OP_SERVICE_ACCOUNT_TOKEN"` 加入提供者的 `passEnv` 清單。
4. 從閘道主機環境進行驗證：`op whoami` 應在不提示登入的情況下輸出服務帳戶。

服務帳戶的讀取操作要求在 `op://` 參照中明確指定保管庫名稱。請嚴格限制帳戶範圍；它是持有者認證資訊。

## 供代理使用的 1password skill

OpenClaw 內建一個 `1password` skill，可讓代理熟練操作 `op`：它會偵測可用的驗證模式（服務帳戶、桌面應用程式整合或獨立登入），在讀取任何內容之前先使用 `op whoami` 驗證存取權，並優先使用 `op run` / `op inject`，而非將密鑰值寫入磁碟。此 skill 需要 `op` 執行檔，若缺少該執行檔，則會提供 Homebrew 安裝選項。

代理會將它用於自己的工作流程，例如在任務進行期間讀取部署權杖，或將環境變數注入命令。它與設定檔密鑰解析彼此獨立；閘道不需任何 skill 介入即可解析 SecretRef。

## 安全性注意事項

- 透過 exec 提供者解析的密鑰值會保留在閘道記憶體中；設定快照與 `config.get` 回應會遮蔽 SecretRef 欄位。
- 切勿將密鑰值放入 `openclaw.json`、記錄或聊天中。項目名稱保留在設定檔，值則保留在 1Password。
- 1Password 稽核軌跡會顯示每一次服務帳戶讀取，讓金鑰輪替與事件檢討更切實可行。

## 疑難排解

- `command not found` 或衍生程序錯誤：使用 `op` 的絕對路徑，並將其目錄納入 `trustedDirs`。
- `op` 可解析，但讀取因符號連結錯誤而失敗：若透過 Homebrew 安裝，請設定 `allowSymlinkCommand: true`。
- `account is not signed in`：若使用服務帳戶，請確認 `OP_SERVICE_ACCOUNT_TOKEN` 能傳入閘道服務，且已列於 `passEnv`；若使用桌面整合，請確認應用程式正在執行且已解鎖。
- 首次讀取緩慢：提高提供者的 `timeoutMs`；在繁忙主機上，`op` 的冷啟動時間可能超過嚴格的逾時限制。
