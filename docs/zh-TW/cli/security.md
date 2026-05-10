---
read_when:
    - 你想要對設定/狀態執行快速安全稽核
    - 你想要套用安全的「修復」建議（權限、收緊預設值）
summary: '`openclaw security` 的 CLI 參考（稽核並修正常見安全陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-05-10T19:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全工具（稽核 + 選用修正）。

相關：

- 安全指南：[安全性](/zh-TW/gateway/security)

## 稽核

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

一般的 `security audit` 會維持在冷態設定/檔案系統/唯讀路徑。它預設不會探索 Plugin 執行階段安全收集器，因此例行稽核不會載入每個已安裝的 Plugin 執行階段。使用 `--deep` 可納入盡力而為的即時 Gateway 探測，以及由 Plugin 擁有的安全稽核收集器；明確的內部呼叫端若已具備適當的執行階段範圍，也可以選擇加入這些由 Plugin 擁有的收集器。

當多個私訊傳送者共用主要工作階段時，稽核會發出警告，並建議使用**安全私訊模式**：針對共用收件匣使用 `session.dmScope="per-channel-peer"`（或針對多帳號頻道使用 `per-account-channel-peer`）。
這是用於合作式/共用收件匣強化。由彼此不信任/敵對的操作者共用單一 Gateway 不是建議的設定；請使用個別 Gateway（或個別作業系統使用者/主機）分隔信任邊界。
當設定顯示可能有共用使用者入口時（例如開放私訊/群組政策、已設定的群組目標或萬用字元傳送者規則），它也會發出 `security.trust_model.multi_user_heuristic`，並提醒你 OpenClaw 預設是個人助理信任模型。
對於有意的共用使用者設定，稽核指引是將所有工作階段沙箱化、將檔案系統存取限制在工作區範圍內，並讓個人/私人身分或憑證遠離該執行階段。
當小型模型（`<=300B`）在未使用沙箱且已啟用網頁/瀏覽器工具的情況下使用時，它也會發出警告。
對於 Webhook 入口，當 `hooks.token` 重複使用 Gateway 權杖、`hooks.token` 太短、`hooks.path="/"`、`hooks.defaultSessionKey` 未設定、`hooks.allowedAgentIds` 未受限制、請求 `sessionKey` 覆寫已啟用，以及覆寫已啟用但未設定 `hooks.allowedSessionKeyPrefixes` 時，它會發出警告。
當沙箱 Docker 設定已配置但沙箱模式關閉時、當 `gateway.nodes.denyCommands` 使用無效的類樣式/未知項目時（僅比對精確的節點命令名稱，而非 shell 文字篩選）、當 `gateway.nodes.allowCommands` 明確啟用危險的節點命令時、當全域 `tools.profile="minimal"` 被代理工具設定檔覆寫時、當寫入/編輯工具已停用但 `exec` 仍可在沒有受限制沙箱檔案系統邊界的情況下使用時、當開放群組在沒有沙箱/工作區防護的情況下暴露執行階段/檔案系統工具時，以及當已安裝的 Plugin 工具可能在寬鬆工具政策下可被觸及時，它也會發出警告。
它也會標示 `gateway.allowRealIpFallback=true`（若代理設定錯誤會有標頭偽造風險）和 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄洩漏中繼資料）。
當沙箱瀏覽器使用 Docker `bridge` 網路但未設定 `sandbox.browser.cdpSourceRange` 時，它也會發出警告。
它也會標示危險的沙箱 Docker 網路模式（包括 `host` 和 `container:*` 命名空間加入）。
當既有沙箱瀏覽器 Docker 容器缺少或使用過期的雜湊標籤時（例如遷移前容器缺少 `openclaw.browserConfigEpoch`），它也會發出警告，並建議執行 `openclaw sandbox recreate --browser --all`。
當以 npm 為基礎的 Plugin/hook 安裝記錄未鎖定版本、缺少完整性中繼資料，或與目前已安裝套件版本出現漂移時，它也會發出警告。
當頻道允許清單依賴可變名稱/電子郵件/標籤，而不是穩定 ID 時，它會發出警告（適用時包含 Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 範圍）。
當 `gateway.auth.mode="none"` 讓 Gateway HTTP API 在沒有共享密鑰的情況下可被存取時（`/tools/invoke` 加上任何已啟用的 `/v1/*` 端點），它會發出警告。
以 `dangerous`/`dangerously` 為前綴的設定是明確的緊急操作者覆寫；啟用其中一項本身並不是安全漏洞報告。
如需完整的危險參數清單，請參閱[安全性](/zh-TW/gateway/security)中的「不安全或危險旗標摘要」章節。

SecretRef 行為：

- `security audit` 會以唯讀模式解析其目標路徑中支援的 SecretRefs。
- 如果目前命令路徑中無法使用 SecretRef，稽核會繼續並回報 `secretDiagnostics`（而不是當機）。
- `--token` 和 `--password` 只會覆寫該次命令呼叫的深度探測驗證；它們不會重寫設定或 SecretRef 對應。

## JSON 輸出

使用 `--json` 進行 CI/政策檢查：

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

如果合併使用 `--fix` 和 `--json`，輸出會同時包含修正動作和最終報告：

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 會變更什麼

`--fix` 會套用安全、確定性的補救措施：

- 將常見的 `groupPolicy="open"` 切換為 `groupPolicy="allowlist"`（包括支援頻道中的帳號變體）
- 當 WhatsApp 群組政策切換為 `allowlist` 時，若該清單存在且設定尚未
  定義 `allowFrom`，會從已儲存的 `allowFrom` 檔案植入 `groupAllowFrom`
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊狀態/設定與常見敏感檔案的權限
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, 工作階段
  `*.jsonl`)
- 也會收緊從 `openclaw.json` 參照的設定 include 檔案
- 在 POSIX 主機上使用 `chmod`，並在 Windows 上使用 `icacls` 重設

`--fix` **不會**：

- 輪替權杖/密碼/API 金鑰
- 停用工具（`gateway`, `cron`, `exec` 等）
- 變更 gateway 繫結/驗證/網路暴露選項
- 移除或重寫 plugins/Skills

## 相關

- [CLI 參考](/zh-TW/cli)
- [安全性稽核](/zh-TW/gateway/security)
