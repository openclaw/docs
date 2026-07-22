---
read_when:
    - 你想要快速對設定／狀態執行安全性稽核
    - 你想要套用安全的「修正」建議（權限、收緊預設值）
summary: '`openclaw security` 的命令列介面參考（稽核並修正常見的安全性陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-07-22T10:29:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b5f9ea5cb746bfd29ff4d096062e81595abe99a883fc3b1113b45a3527d42d9
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全性工具：稽核以及選用的安全修正。相關資訊：[安全性](/zh-TW/gateway/security)。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## 稽核模式

一般的 `security audit` 會維持在冷態設定／檔案系統／唯讀路徑上：它不會探索外掛執行階段的安全性收集器，因此例行稽核不會載入每個已安裝外掛的執行階段。`--deep` 會加入盡力而為的即時閘道探測，以及由外掛擁有的安全性稽核收集器（明確的內部呼叫端若已有適當的執行階段範圍，也可以選擇使用這些收集器）。

如果只在啟動時提供閘道密碼驗證，請透過 `--auth password --password <password>` 傳入相同的值，讓稽核能針對 `hooks.token` 檢查該值。

## 檢查項目

**私訊／信任模型**

- 當多位私訊傳送者共用主要工作階段時發出警告，並針對共用收件匣建議使用安全私訊模式：`session.dmScope="per-channel-peer"`（多帳號頻道則使用 `per-account-channel-peer`）。這是針對協作／共用收件匣的強化措施，不是用來隔離彼此不信任的操作人員；在這種情況下，請使用個別閘道（或個別作業系統使用者／主機）來分隔信任邊界。
- 當設定顯示可能有多位共用使用者的輸入來源時（例如開放式私訊／群組政策、已設定的群組目標，或萬用字元傳送者規則），會發出 `security.trust_model.multi_user_heuristic`——OpenClaw 的預設信任模型是個人助理（單一操作人員），而不是具敵意的多租戶隔離。若刻意設定為多位共用使用者：請將所有工作階段置於沙箱中、將檔案系統存取限制在工作區範圍內，並避免在該執行階段放置個人／私有身分或認證資訊。
- 當使用小型模型（`<=300B` 個參數）、未啟用沙箱，且已啟用網頁／瀏覽器工具時發出警告。

**網路鉤子／掛鉤**

啟動時會記錄非致命的安全性警告，而稽核會標示 `hooks.token` 重複使用有效閘道共用密鑰驗證值的情況（`gateway.auth.token`／`OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password`／`OPENCLAW_GATEWAY_PASSWORD`）。以下情況也會發出警告：

- `hooks.token` 太短
- `hooks.path="/"`
- 未設定 `hooks.defaultSessionKey`
- `hooks.allowedAgentIds` 未受限制
- 已啟用請求 `sessionKey` 覆寫
- 已啟用覆寫，但未設定 `hooks.allowedSessionKeyPrefixes`

執行 `openclaw doctor --fix` 以輪替已持久化且重複使用的 `hooks.token`，接著更新外部掛鉤傳送端以使用新權杖。

**沙箱／工具**

- 當已設定沙箱 Docker 設定，但沙箱模式為關閉時發出警告。
- 當 `gateway.nodes.commands.deny` 使用無效的類模式／未知項目時發出警告（比對僅針對節點命令名稱進行完全相符比對，而非篩選 shell 文字）。
- 當 `gateway.nodes.commands.allow` 明確啟用危險的節點命令時發出警告。
- 當全域 `tools.profile="minimal"` 被代理程式工具設定檔覆寫時發出警告。
- 當寫入／編輯工具已停用，但 `exec` 仍可使用，且沒有具限制性的沙箱檔案系統邊界時發出警告。
- 當開放式私訊或群組在缺少沙箱／工作區防護措施的情況下暴露執行階段／檔案系統工具時發出警告。
- 當已安裝的外掛工具可能在寬鬆的工具政策下可供存取時發出警告。

**沙箱瀏覽器**

- 當沙箱瀏覽器使用 Docker `bridge` 網路，但未設定 `sandbox.browser.cdpSourceRange` 時發出警告。
- 標示危險的沙箱 Docker 網路模式，包括 `host` 和 `container:*` 命名空間加入。
- 當現有沙箱瀏覽器 Docker 容器缺少雜湊標籤或標籤已過期時（例如遷移前的容器缺少 `openclaw.browserConfigEpoch`），發出警告並建議執行 `openclaw sandbox recreate --browser --all`。

**網路／探索**

- 標示 `gateway.allowRealIpFallback=true`（若 Proxy 設定錯誤，會有標頭偽造風險）。
- 標示 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄洩漏中繼資料）。
- 當 `gateway.auth.mode="none"` 使閘道 HTTP API 在沒有共用密鑰的情況下可供存取時發出警告（`/tools/invoke` 加上任何已啟用的 `/v1/*` 端點）。

**外掛／頻道**

- 當以 npm 為基礎的外掛／掛鉤安裝記錄未鎖定版本、缺少完整性中繼資料，或與目前安裝的套件版本不一致時發出警告。
- 當頻道允許清單依賴可變動的名稱／電子郵件／標籤，而非穩定 ID 時發出警告（適用時包括 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 範圍）。

以 `dangerous`／`dangerously` 為前綴的設定，是操作人員明確使用的緊急破例覆寫；啟用其中一項本身不構成安全性漏洞報告。如需完整的危險參數清單，請參閱[安全性](/zh-TW/gateway/security)中的「不安全或危險旗標摘要」。

## SecretRef 行為

`security audit` 會以唯讀模式解析其目標路徑支援的 SecretRef。如果目前命令路徑中無法使用某個 SecretRef，稽核會繼續執行並回報 `secretDiagnostics`，而不會當機。`--token` 和 `--password` 只會針對該次命令叫用覆寫深度探測驗證；它們不會重寫設定或 SecretRef 對應。

## 抑制項目

使用 `security.audit.suppressions` 接受刻意保留的現有發現。每個抑制項目會與確切的 `checkId` 相符，並可透過不區分大小寫的 `titleIncludes` 和／或 `detailIncludes` 子字串縮小範圍：

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

受抑制的發現會從作用中的 `summary` 和 `findings` 清單移除。JSON 輸出仍會將其保留在 `suppressedFindings` 下，以便稽核。設定抑制項目後，作用中輸出也會保留一項不可抑制的 `security.audit.suppressions.active` 資訊發現，讓讀者得知稽核結果已經過篩選。危險設定旗標會以每個旗標一項發現的方式發出，因此接受某個危險旗標，不會隱藏共用相同 `config.insecure_or_dangerous_flags` checkId 的其他已啟用旗標。

由於抑制項目可能隱藏現有風險，透過代理程式執行的 shell 命令新增或移除抑制項目時，需要取得 exec 核准；除非 exec 已使用 `security="full"` 和 `ask="off"` 執行受信任的本機自動化。

## JSON 輸出

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

使用 `--fix --json` 時，輸出會同時包含修正動作與最終報告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 會變更的項目

套用安全且具確定性的修正：

- 將常見的 `groupPolicy="open"` 切換為 `groupPolicy="allowlist"`（包括支援頻道中的帳號變體）
- 當 WhatsApp 群組政策切換為 `allowlist` 時，若儲存的 `allowFrom` 檔案中存在清單，且設定尚未定義 `allowFrom`，則使用該清單填入 `groupAllowFrom` 的初始值
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊狀態／設定和常見敏感檔案的權限（`credentials/*.json`、`auth-profiles.json`、`openclaw-agent.sqlite`，以及舊版工作階段成品）
- 也會收緊 `openclaw.json` 所參照的設定引入檔案權限
- 在 POSIX 主機上使用 `chmod`，在 Windows 上使用 `icacls` 重設

`--fix` **不會**：

- 輪替權杖／密碼／API 金鑰
- 停用工具（`gateway`、`cron`、`exec` 等）
- 變更閘道繫結／驗證／網路暴露選項
- 移除或重寫外掛／Skills

## 相關資訊

- [命令列介面參考](/zh-TW/cli)
- [安全性稽核](/zh-TW/gateway/security)
