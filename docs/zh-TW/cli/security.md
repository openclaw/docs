---
read_when:
    - 你想要對設定／狀態執行快速安全性稽核
    - 你想要套用安全的「修正」建議（權限、收緊預設值）
summary: '`openclaw security` 的命令列介面參考（稽核並修正常見的安全性陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-07-12T14:26:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全工具：稽核以及選用的安全修正。相關內容：[安全性](/zh-TW/gateway/security)。

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

一般的 `security audit` 會維持在冷態設定／檔案系統／唯讀路徑：它不會探索外掛執行階段的安全性收集器，因此例行稽核不會載入每個已安裝外掛的執行階段。`--deep` 會加入盡力而為的即時閘道探測，以及由外掛擁有的安全性稽核收集器（明確的內部呼叫端若已具備適當的執行階段範圍，也可選擇啟用這些收集器）。

如果只在啟動時提供閘道密碼驗證，請透過 `--auth password --password <password>` 傳入相同值，讓稽核能將其與 `hooks.token` 比對。

## 檢查項目

**私訊／信任模型**

- 當多個私訊傳送者共用主要工作階段時發出警告，並針對共用收件匣建議使用安全私訊模式：`session.dmScope="per-channel-peer"`（多帳號頻道則使用 `per-account-channel-peer`）。這是合作式／共用收件匣的強化措施，並非針對彼此不受信任操作者的隔離；若有此需求，請使用不同的閘道（或不同的作業系統使用者／主機）分隔信任邊界。
- 當設定顯示可能有多位使用者共用的流量入口時（例如開放式私訊／群組政策、已設定的群組目標或萬用字元傳送者規則），會發出 `security.trust_model.multi_user_heuristic`——OpenClaw 的預設信任模型是個人助理（一位操作者），而非具敵意的多租戶隔離。若刻意採用多使用者共用設定：請對所有工作階段使用沙箱、將檔案系統存取限制在工作區範圍內，並避免在該執行階段中使用個人／私人身分或認證資訊。
- 當使用小型模型（參數 `<=300B`），未啟用沙箱，且已啟用網頁／瀏覽器工具時發出警告。

**網路鉤子／鉤子**

啟動記錄會顯示非致命的安全性警告，而稽核會標示 `hooks.token` 重複使用中的閘道共用密鑰驗證值（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。在下列情況也會發出警告：

- `hooks.token` 過短
- `hooks.path="/"`
- 未設定 `hooks.defaultSessionKey`
- `hooks.allowedAgentIds` 未受限制
- 已啟用請求的 `sessionKey` 覆寫
- 已啟用覆寫，但未設定 `hooks.allowedSessionKeyPrefixes`

執行 `openclaw doctor --fix` 以輪替已持久化且重複使用的 `hooks.token`，然後更新外部鉤子傳送端以使用新權杖。

**沙箱／工具**

- 當沙箱模式關閉但已設定沙箱 Docker 設定時發出警告。
- 當 `gateway.nodes.denyCommands` 使用無效的類模式／未知項目時發出警告（比對僅針對精確的節點命令名稱，而非篩選 shell 文字）。
- 當 `gateway.nodes.allowCommands` 明確啟用危險的節點命令時發出警告。
- 當代理程式工具設定檔覆寫全域 `tools.profile="minimal"` 時發出警告。
- 當寫入／編輯工具已停用，但 `exec` 仍可使用，且缺少具約束力的沙箱檔案系統邊界時發出警告。
- 當開放式私訊或群組在缺少沙箱／工作區防護的情況下公開執行階段／檔案系統工具時發出警告。
- 當已安裝的外掛工具可能在寬鬆的工具政策下可供存取時發出警告。

**沙箱瀏覽器**

- 當沙箱瀏覽器使用 Docker `bridge` 網路，但未設定 `sandbox.browser.cdpSourceRange` 時發出警告。
- 標示危險的沙箱 Docker 網路模式，包括 `host` 與加入 `container:*` 命名空間。
- 當現有沙箱瀏覽器 Docker 容器的雜湊標籤遺失／過時時發出警告（例如遷移前的容器缺少 `openclaw.browserConfigEpoch`），並建議執行 `openclaw sandbox recreate --browser --all`。

**網路／探索**

- 標示 `gateway.allowRealIpFallback=true`（若 Proxy 設定錯誤，會有標頭偽造風險）。
- 標示 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄洩漏中繼資料）。
- 當 `gateway.auth.mode="none"` 使閘道 HTTP API 無需共用密鑰即可存取時發出警告（`/tools/invoke` 以及任何已啟用的 `/v1/*` 端點）。

**外掛／頻道**

- 當以 npm 為基礎的外掛／掛鉤安裝記錄未鎖定版本、缺少完整性中繼資料，或與目前安裝的套件版本不一致時發出警告。
- 當頻道允許清單依賴可變動的名稱／電子郵件／標籤，而非穩定 ID 時發出警告（適用時涵蓋 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 範圍）。

以 `dangerous`／`dangerously` 為前綴的設定，是操作員明確用於緊急例外處置的覆寫；啟用其中任何一項本身並不構成安全漏洞報告。如需完整的危險參數清單，請參閱[安全性](/zh-TW/gateway/security)中的「不安全或危險旗標摘要」。

## SecretRef 行為

`security audit` 會以唯讀模式解析其目標路徑中支援的 SecretRef。如果目前的命令路徑無法使用某個 SecretRef，稽核會繼續執行並回報 `secretDiagnostics`，而不會當機。`--token` 和 `--password` 只會覆寫該次命令叫用的深度探測驗證；不會重寫設定或 SecretRef 對應。

## 抑制項目

使用 `security.audit.suppressions` 接受刻意保留的既有發現。每個抑制項目會比對完全相符的 `checkId`，並可透過不區分大小寫的 `titleIncludes` 和／或 `detailIncludes` 子字串進一步縮小範圍：

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "已啟用的擴充外掛：gbrain",
          "reason": "受信任的本機操作員外掛"
        }
      ]
    }
  }
}
```

已抑制的發現會從作用中的 `summary` 和 `findings` 清單中移除。為便於稽核，JSON 輸出會將其保留在 `suppressedFindings` 下。設定抑制項目後，作用中的輸出也會保留一項不可抑制的 `security.audit.suppressions.active` 資訊發現，讓讀者能判斷稽核結果已經過篩選。危險設定旗標會以每個旗標一項發現的方式輸出，因此接受某個危險旗標，不會隱藏其他共用相同 `config.insecure_or_dangerous_flags` checkId 的已啟用旗標。

由於抑制項目可能隱藏既有風險，透過代理程式執行的 shell 命令新增或移除抑制項目時，必須取得 exec 核准；但若 exec 已針對受信任的本機自動化以 `security="full"` 和 `ask="off"` 執行，則不在此限。

## JSON 輸出

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

搭配 `--fix --json` 時，輸出會同時包含修正動作和最終報告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 會變更的內容

套用安全且具確定性的修正：

- 將常見的 `groupPolicy="open"` 改為 `groupPolicy="allowlist"`（包括支援頻道中的帳號變體）
- 當 WhatsApp 群組政策改為 `allowlist` 時，若已儲存的 `allowFrom` 檔案中存在清單，且設定尚未定義 `allowFrom`，便會以該清單填入 `groupAllowFrom`
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊狀態／設定與常見敏感檔案的權限（`credentials/*.json`、`auth-profiles.json`、`openclaw-agent.sqlite`，以及舊版工作階段成品）
- 也會收緊 `openclaw.json` 所參照的設定引入檔案權限
- 在 POSIX 主機上使用 `chmod`，在 Windows 上使用 `icacls` 重設權限

`--fix` **不會**：

- 輪替權杖／密碼／API 金鑰
- 停用工具（`gateway`、`cron`、`exec` 等）
- 變更閘道的繫結／驗證／網路暴露選項
- 移除或重寫外掛／Skills

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [安全性稽核](/zh-TW/gateway/security)
