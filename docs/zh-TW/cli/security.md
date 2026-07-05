---
read_when:
    - 你想對設定/狀態執行快速安全性稽核
    - 你想要套用安全的「修正」建議（權限、收緊預設值）
summary: '`openclaw security` 的命令列介面參考（稽核並修正常見安全性陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-07-05T11:10:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49b80cc444995556a657798e62f4547acd2360e5feb5fe15e547933bbef98c4e
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全性工具：稽核加上可選的安全修復。相關：[安全性](/zh-TW/gateway/security)。

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

一般 `security audit` 會停留在冷 config/檔案系統/唯讀路徑：它不會探索外掛執行階段安全性收集器，因此例行稽核不會載入每個已安裝的外掛執行階段。`--deep` 會加入盡力而為的即時閘道探測，以及外掛擁有的安全性稽核收集器（明確的內部呼叫端若已經有適當的執行階段範圍，也可以選擇加入這些收集器）。

如果閘道密碼驗證只在啟動時提供，請用 `--auth password --password <password>` 傳入相同值，讓稽核可以拿它與 `hooks.token` 比對。

## 檢查內容

**私訊/信任模型**

- 當多個私訊傳送者共用主工作階段時發出警告，並建議安全私訊模式：共享收件匣使用 `session.dmScope="per-channel-peer"`（多帳戶頻道則使用 `per-account-channel-peer`）。這是合作式/共享收件匣強化，不是針對彼此不信任操作者的隔離；對於這種情況，請用獨立閘道（或獨立 OS 使用者/主機）分隔信任邊界。
- 當 config 顯示可能有共享使用者入口（例如開放私訊/群組政策、已設定的群組目標，或萬用字元傳送者規則）時，發出 `security.trust_model.multi_user_heuristic`，OpenClaw 的預設信任模型是個人助理（一位操作者），不是敵意多租戶隔離。對於有意的共享使用者設定：將所有工作階段沙箱化、將檔案系統存取限制在工作區範圍內，並讓個人/私人身分或憑證遠離該執行階段。
- 當小型模型（`<=300B` 參數）在未沙箱化且啟用網頁/瀏覽器工具的情況下使用時發出警告。

**網路鉤子/hooks**

啟動時會記錄非致命安全性警告，稽核也會標記 `hooks.token` 重複使用有效閘道共享密鑰驗證值（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）。也會在下列情況發出警告：

- `hooks.token` 太短
- `hooks.path="/"`
- `hooks.defaultSessionKey` 未設定
- `hooks.allowedAgentIds` 未受限制
- 已啟用請求 `sessionKey` 覆寫
- 已啟用覆寫但未設定 `hooks.allowedSessionKeyPrefixes`

執行 `openclaw doctor --fix` 來輪替已持久化且重複使用的 `hooks.token`，然後更新外部 hook 傳送端以使用新 token。

**沙箱/工具**

- 當沙箱 Docker 設定已設定但沙箱模式關閉時發出警告。
- 當 `gateway.nodes.denyCommands` 使用無效的類模式/未知項目時發出警告（比對只針對精確的節點命令名稱，不是 shell 文字篩選）。
- 當 `gateway.nodes.allowCommands` 明確啟用危險節點命令時發出警告。
- 當全域 `tools.profile="minimal"` 被代理工具設定檔覆寫時發出警告。
- 當寫入/編輯工具被停用，但 `exec` 仍可在沒有約束性沙箱檔案系統邊界的情況下使用時發出警告。
- 當開放私訊或群組在沒有沙箱/工作區防護的情況下暴露執行階段/檔案系統工具時發出警告。
- 當已安裝的外掛工具可能在寬鬆工具政策下可被觸及時發出警告。

**沙箱瀏覽器**

- 當沙箱瀏覽器使用 Docker `bridge` 網路且未設定 `sandbox.browser.cdpSourceRange` 時發出警告。
- 標記危險的沙箱 Docker 網路模式，包括 `host` 和 `container:*` 命名空間加入。
- 當現有沙箱瀏覽器 Docker 容器缺少/過期 hash 標籤（例如遷移前容器缺少 `openclaw.browserConfigEpoch`）時發出警告，並建議 `openclaw sandbox recreate --browser --all`。

**網路/探索**

- 標記 `gateway.allowRealIpFallback=true`（若 proxy 設定錯誤，會有 header 偽造風險）。
- 標記 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄洩漏中繼資料）。
- 當 `gateway.auth.mode="none"` 讓閘道 HTTP API 可在沒有共享密鑰的情況下觸及時發出警告（`/tools/invoke` 加上任何已啟用的 `/v1/*` endpoint）。

**外掛/頻道**

- 當以 npm 為基礎的外掛/hook 安裝記錄未釘選、缺少完整性中繼資料，或與目前已安裝套件版本偏離時發出警告。
- 當頻道允許清單依賴可變名稱/email/標籤，而不是穩定 ID 時發出警告（Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 範圍在適用時）。

以 `dangerous`/`dangerously` 為前綴的設定是明確的破窗式操作者覆寫；啟用其中一項本身並不是安全性漏洞回報。如需完整危險參數清單，請參閱[安全性](/zh-TW/gateway/security)中的「不安全或危險旗標摘要」。

## SecretRef 行為

`security audit` 會以唯讀模式解析其目標路徑中支援的 SecretRef。如果 SecretRef 在目前命令路徑中無法使用，稽核會繼續並回報 `secretDiagnostics`，而不是當機。`--token` 和 `--password` 只會覆寫該命令呼叫的深度探測驗證；它們不會重寫 config 或 SecretRef 對應。

## 抑制

使用 `security.audit.suppressions` 接受有意的長期存在發現項目。每個抑制都會比對精確的 `checkId`，並可使用不區分大小寫的 `titleIncludes` 和/或 `detailIncludes` 子字串縮小範圍：

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

被抑制的發現項目會從作用中的 `summary` 和 `findings` 清單移除。JSON 輸出會將它們保留在 `suppressedFindings` 下，以利稽核。設定抑制時，作用中輸出也會保留不可抑制的 `security.audit.suppressions.active` 資訊發現項目，讓讀者知道稽核已被篩選。危險 config 旗標會以每個旗標一個發現項目的方式發出，因此接受一個危險旗標不會隱藏其他共用相同 `config.insecure_or_dangerous_flags` checkId 的已啟用旗標。

因為抑制可能隱藏長期存在的風險，除非 exec 已經在可信本機自動化的 `security="full"` 和 `ask="off"` 下執行，否則透過代理執行的 shell 命令新增或移除抑制需要 exec 核准。

## JSON 輸出

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

搭配 `--fix --json` 時，輸出會同時包含修復動作與最終報告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 變更內容

套用安全且決定性的修復：

- 將常見的 `groupPolicy="open"` 翻轉為 `groupPolicy="allowlist"`（包含受支援頻道中的帳戶變體）
- 當 WhatsApp 群組政策翻轉為 `allowlist` 時，若已儲存的 `allowFrom` 檔案存在且 config 尚未定義 `allowFrom`，就從該檔案植入 `groupAllowFrom`
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊 state/config 和常見敏感檔案（`credentials/*.json`、`auth-profiles.json`、`sessions.json`、工作階段 `*.jsonl`）的權限
- 也會收緊從 `openclaw.json` 參照的 config include 檔案
- 在 POSIX 主機上使用 `chmod`，在 Windows 上使用 `icacls` 重設

`--fix` **不會**：

- 輪替 token/密碼/API key
- 停用工具（`gateway`、`cron`、`exec` 等）
- 變更閘道 bind/auth/network exposure 選擇
- 移除或重寫外掛/Skills

## 相關

- [命令列介面參考](/zh-TW/cli)
- [安全性稽核](/zh-TW/gateway/security)
