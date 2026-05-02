---
read_when:
    - 您想要對設定/狀態執行快速安全稽核
    - 您想要套用安全的「修正」建議（權限、收緊預設值）
summary: '`openclaw security` 的 CLI 參考（稽核並修正常見安全性陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-05-02T02:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

單純的 `security audit` 會停留在冷設定/檔案系統/唯讀路徑。它預設不會探索 Plugin 執行階段安全性收集器，因此例行稽核不會載入每個已安裝的 Plugin 執行階段。使用 `--deep` 可納入盡力而為的即時 Gateway 探查與 Plugin 擁有的安全性稽核收集器；明確的內部呼叫端在已有適當執行階段範圍時，也可以選擇加入這些 Plugin 擁有的收集器。

當多個私訊傳送者共用主要工作階段時，稽核會發出警告，並建議使用**安全私訊模式**：`session.dmScope="per-channel-peer"`（多帳號通道則使用 `per-account-channel-peer`）來處理共用收件匣。
這是用於合作式/共用收件匣的強化。不建議讓彼此不信任或對抗性的操作者共用單一 Gateway；請用個別 gateway（或個別作業系統使用者/主機）拆分信任邊界。
當設定顯示可能有共用使用者入口時（例如開放私訊/群組政策、已設定的群組目標，或萬用字元傳送者規則），它也會發出 `security.trust_model.multi_user_heuristic`，並提醒你 OpenClaw 預設是個人助理信任模型。
對於有意的共用使用者設定，稽核建議是沙箱化所有工作階段、將檔案系統存取限制在工作區範圍內，並讓個人/私密身分或憑證遠離該執行階段。
當小型模型（`<=300B`）在未沙箱化且已啟用網頁/瀏覽器工具的情況下使用時，它也會警告。
對於 Webhook 入口，當 `hooks.token` 重複使用 Gateway token、`hooks.token` 太短、`hooks.path="/"`、`hooks.defaultSessionKey` 未設定、`hooks.allowedAgentIds` 未受限制、請求 `sessionKey` 覆寫已啟用，以及覆寫已啟用但未設定 `hooks.allowedSessionKeyPrefixes` 時，它會警告。
當沙箱 Docker 設定已設定但沙箱模式關閉、`gateway.nodes.denyCommands` 使用無效的類似模式/未知項目（僅精確比對 node 命令名稱，不是 shell 文字篩選）、`gateway.nodes.allowCommands` 明確啟用危險的 node 命令、全域 `tools.profile="minimal"` 被 agent 工具設定檔覆寫、開放群組在沒有沙箱/工作區防護的情況下暴露執行階段/檔案系統工具，以及已安裝的 Plugin 工具在寬鬆工具政策下可能可被觸達時，它也會警告。
它也會標記 `gateway.allowRealIpFallback=true`（代理設定錯誤時有標頭偽造風險）和 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄洩漏中繼資料）。
當沙箱瀏覽器使用 Docker `bridge` 網路但沒有 `sandbox.browser.cdpSourceRange` 時，它也會警告。
它也會標記危險的沙箱 Docker 網路模式（包括 `host` 和 `container:*` 命名空間加入）。
當現有沙箱瀏覽器 Docker 容器缺少或使用過期的雜湊標籤時（例如遷移前容器缺少 `openclaw.browserConfigEpoch`），它也會警告，並建議執行 `openclaw sandbox recreate --browser --all`。
當以 npm 為基礎的 Plugin/hook 安裝記錄未釘選、缺少完整性中繼資料，或與目前已安裝的套件版本不一致時，它也會警告。
當通道允許清單依賴可變動的名稱/電子郵件/標籤，而不是穩定 ID 時，它會警告（適用範圍包括 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC）。
當 `gateway.auth.mode="none"` 讓 Gateway HTTP API 在沒有共享密鑰的情況下可被觸達時（`/tools/invoke` 加上任何已啟用的 `/v1/*` 端點），它會警告。
以 `dangerous`/`dangerously` 為前綴的設定是明確的緊急操作者覆寫；啟用其中一項本身並不構成安全性漏洞報告。
完整的危險參數清單請參閱[安全性](/zh-TW/gateway/security)中的「不安全或危險旗標摘要」章節。

SecretRef 行為：

- `security audit` 會以唯讀模式解析其目標路徑中支援的 SecretRefs。
- 如果目前命令路徑中無法使用某個 SecretRef，稽核會繼續並回報 `secretDiagnostics`（而不是當機）。
- `--token` 和 `--password` 只會覆寫該次命令呼叫的深度探查驗證；它們不會改寫設定或 SecretRef 對應。

## JSON 輸出

使用 `--json` 進行 CI/政策檢查：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果合併使用 `--fix` 和 `--json`，輸出會同時包含修正動作與最終報告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 會變更的內容

`--fix` 會套用安全且決定性的修復：

- 將常見的 `groupPolicy="open"` 切換為 `groupPolicy="allowlist"`（包括支援通道中的帳號變體）
- 當 WhatsApp 群組政策切換為 `allowlist` 時，如果已儲存的 `allowFrom` 檔案存在且設定尚未定義 `allowFrom`，則從該檔案植入 `groupAllowFrom`
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊狀態/設定與常見敏感檔案的權限
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、工作階段
  `*.jsonl`）
- 也會收緊從 `openclaw.json` 參照的設定 include 檔案
- 在 POSIX 主機上使用 `chmod`，在 Windows 上使用 `icacls` 重設

`--fix` **不會**：

- 輪替 token/密碼/API key
- 停用工具（`gateway`、`cron`、`exec` 等）
- 變更 gateway 綁定/驗證/網路暴露選擇
- 移除或改寫 Plugin/Skills

## 相關

- [CLI 參考](/zh-TW/cli)
- [安全性稽核](/zh-TW/gateway/security)
