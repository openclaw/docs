---
read_when:
    - 你想要對設定/狀態執行快速安全性稽核
    - 你想套用安全的「修復」建議（權限、收緊預設值）
summary: '`openclaw security` 的命令列介面參考（稽核並修正常見的安全性陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-06-27T19:07:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全性工具（稽核 + 選用修正）。

相關：

- 安全性指南：[安全性](/zh-TW/gateway/security)

## 稽核

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

普通的 `security audit` 會停留在冷態設定/檔案系統/唯讀路徑。預設不會探索外掛執行階段安全性收集器，因此例行稽核不會載入每個已安裝的外掛執行階段。使用 `--deep` 可納入盡力而為的即時閘道探測，以及外掛自有的安全性稽核收集器；明確的內部呼叫端若已具備合適的執行階段範圍，也可以選擇加入這些外掛自有的收集器。

當多個 DM 傳送者共用主要工作階段時，稽核會發出警告並建議使用 **安全 DM 模式**：共用收件匣使用 `session.dmScope="per-channel-peer"`（多帳號頻道則使用 `per-account-channel-peer`）。
這是為了強化協作式/共用收件匣。由互不信任/對抗性操作者共用單一閘道不是建議的設定；請使用獨立閘道（或獨立 OS 使用者/主機）分離信任邊界。
當設定顯示可能有共用使用者入口（例如開放 DM/群組政策、已設定的群組目標，或萬用字元傳送者規則）時，它也會發出 `security.trust_model.multi_user_heuristic`，並提醒你 OpenClaw 預設是個人助理信任模型。
若是有意的共用使用者設定，稽核指引是沙箱化所有工作階段、將檔案系統存取限制在工作區範圍內，並讓個人/私人身分或憑證遠離該執行階段。
它也會在小型模型（`<=300B`）未使用沙箱且啟用 Web/瀏覽器工具時發出警告。
對於網路鉤子入口，啟動時會記錄非致命安全性警告，且稽核會標記 `hooks.token` 重複使用作用中閘道共用祕密驗證值，包括 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 與 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。它也會在以下情況發出警告：

- `hooks.token` 太短
- `hooks.path="/"`
- 未設定 `hooks.defaultSessionKey`
- `hooks.allowedAgentIds` 未受限制
- 已啟用請求 `sessionKey` 覆寫
- 已啟用覆寫但未設定 `hooks.allowedSessionKeyPrefixes`

如果閘道密碼驗證只在啟動時提供，請將相同值傳給 `openclaw security audit --auth password --password <password>`，讓稽核可以檢查它是否與 `hooks.token` 相同。
執行 `openclaw doctor --fix` 以輪替已持久化且重複使用的 `hooks.token`，然後更新外部鉤子傳送者以使用新的鉤子權杖。

當沙箱模式關閉但已設定沙箱 Docker 設定時、`gateway.nodes.denyCommands` 使用無效的類模式/未知項目時（只會精確比對節點命令名稱，不會過濾 shell 文字）、`gateway.nodes.allowCommands` 明確啟用危險節點命令時、全域 `tools.profile="minimal"` 被代理工具設定檔覆寫時、寫入/編輯工具已停用但 `exec` 仍可在沒有約束性沙箱檔案系統邊界的情況下使用時、開放 DM 或群組在沒有沙箱/工作區防護的情況下暴露執行階段/檔案系統工具時，以及已安裝的外掛工具可能在寬鬆工具政策下可被存取時，它也會發出警告。
它也會標記 `gateway.allowRealIpFallback=true`（若代理設定錯誤會有標頭偽造風險）與 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄外洩中繼資料）。
當沙箱瀏覽器使用 Docker `bridge` 網路但未設定 `sandbox.browser.cdpSourceRange` 時，它也會發出警告。
它也會標記危險的沙箱 Docker 網路模式（包括 `host` 與 `container:*` 命名空間加入）。
當現有沙箱瀏覽器 Docker 容器缺少/具有過期的雜湊標籤時（例如遷移前容器缺少 `openclaw.browserConfigEpoch`），它也會發出警告並建議執行 `openclaw sandbox recreate --browser --all`。
當基於 npm 的外掛/鉤子安裝記錄未釘選、缺少完整性中繼資料，或與目前已安裝套件版本不同步時，它也會發出警告。
當頻道允許清單依賴可變名稱/電子郵件/標籤，而不是穩定 ID 時，它會發出警告（適用於 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 範圍等）。
當 `gateway.auth.mode="none"` 讓閘道 HTTP API 可在沒有共用祕密的情況下被存取時（`/tools/invoke` 加上任何已啟用的 `/v1/*` 端點），它會發出警告。
以 `dangerous`/`dangerously` 為前綴的設定是明確的緊急操作者覆寫；啟用其中一項本身並不是安全性漏洞回報。
如需完整危險參數清單，請參閱 [安全性](/zh-TW/gateway/security) 中的「不安全或危險旗標摘要」一節。

有意保留的常駐發現項目可以使用 `security.audit.suppressions` 接受。
每個抑制項目會比對精確的 `checkId`，並可使用
`titleIncludes` 和/或 `detailIncludes` 不分大小寫子字串縮小範圍：

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

已抑制的發現項目會從作用中的 `summary` 與 `findings` 清單移除。
JSON 輸出會將它們保留在 `suppressedFindings` 下，以便稽核。
設定抑制項目時，作用中輸出也會保留一個不可抑制的
`security.audit.suppressions.active` 資訊發現項目，讓讀者知道稽核
已被篩選。危險設定旗標會以每個發現項目一個旗標的方式發出，因此
接受一個危險旗標不會隱藏其他共用相同
`config.insecure_or_dangerous_flags` checkId 的已啟用旗標。
因為抑制項目可能隱藏常駐風險，透過代理執行 shell 命令新增或移除它們
需要 exec 核准，除非 exec 已為受信任的本機自動化以
`security="full"` 與 `ask="off"` 執行。

SecretRef 行為：

- `security audit` 會以唯讀模式解析其目標路徑中支援的 SecretRef。
- 如果目前命令路徑無法使用 SecretRef，稽核會繼續並回報 `secretDiagnostics`（而不是當機）。
- `--token` 與 `--password` 只會覆寫該次命令叫用的深度探測驗證；它們不會重寫設定或 SecretRef 對應。

## JSON 輸出

使用 `--json` 進行 CI/政策檢查：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果合併使用 `--fix` 與 `--json`，輸出會同時包含修正動作與最終報告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 會變更什麼

`--fix` 會套用安全且確定性的補救措施：

- 將常見的 `groupPolicy="open"` 切換為 `groupPolicy="allowlist"`（包括支援頻道中的帳號變體）
- 當 WhatsApp 群組政策切換為 `allowlist` 時，如果儲存的 `allowFrom` 檔案存在且設定尚未
  定義 `allowFrom`，就會從該檔案植入 `groupAllowFrom`
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊狀態/設定與常見敏感檔案的權限
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- 也會收緊從 `openclaw.json` 參照的設定 include 檔案
- 在 POSIX 主機上使用 `chmod`，在 Windows 上使用 `icacls` 重設

`--fix` **不會**：

- 輪替權杖/密碼/API 金鑰
- 停用工具（`gateway`、`cron`、`exec` 等）
- 變更閘道繫結/驗證/網路暴露選擇
- 移除或重寫外掛/Skills

## 相關

- [命令列介面參考](/zh-TW/cli)
- [安全性稽核](/zh-TW/gateway/security)
