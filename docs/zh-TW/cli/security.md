---
read_when:
    - 你想要對設定/狀態執行快速安全稽核
    - 你想要套用安全的「修復」建議（權限、收緊預設值）
summary: '`openclaw security` 的 CLI 參考（稽核並修正常見的安全性陷阱）'
title: 安全性
x-i18n:
    generated_at: "2026-04-30T02:56:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

安全工具（稽核 + 選用修正）。

相關：

- 安全指南：[安全](/zh-TW/gateway/security)

## 稽核

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

當多個 DM 傳送者共用主要工作階段時，稽核會發出警告，並建議使用**安全 DM 模式**：共享收件匣使用 `session.dmScope="per-channel-peer"`（多帳號通道則使用 `per-account-channel-peer`）。
這是為了強化協作式/共享收件匣。由互不信任或具對抗性的操作者共用單一 Gateway 並非建議的設定；請使用個別 Gateway（或個別 OS 使用者/主機）分隔信任邊界。
當設定顯示可能有共享使用者入口時（例如開放 DM/群組政策、已設定的群組目標，或萬用字元傳送者規則），它也會發出 `security.trust_model.multi_user_heuristic`，並提醒你 OpenClaw 預設是個人助理信任模型。
對於刻意的共享使用者設定，稽核指引是將所有工作階段沙盒化、將檔案系統存取限制在工作區範圍內，並讓個人/私人身分或憑證遠離該執行環境。
當小型模型（`<=300B`）在未沙盒化且啟用 Web/瀏覽器工具的情況下使用時，它也會發出警告。
對於 Webhook 入口，當 `hooks.token` 重複使用 Gateway 權杖、`hooks.token` 過短、`hooks.path="/"`、`hooks.defaultSessionKey` 未設定、`hooks.allowedAgentIds` 不受限制、啟用請求 `sessionKey` 覆寫，以及在未設定 `hooks.allowedSessionKeyPrefixes` 的情況下啟用覆寫時，它會發出警告。
當沙盒 Docker 設定已設定但沙盒模式關閉、`gateway.nodes.denyCommands` 使用無效的類模式/未知項目（僅精確比對節點命令名稱，不做 shell 文字過濾）、`gateway.nodes.allowCommands` 明確啟用危險節點命令、全域 `tools.profile="minimal"` 被代理工具設定檔覆寫、開放群組在沒有沙盒/工作區防護的情況下暴露執行環境/檔案系統工具，以及已安裝的 Plugin 工具可能在寬鬆工具政策下可被存取時，它也會發出警告。
它也會標記 `gateway.allowRealIpFallback=true`（若代理設定錯誤，會有標頭偽造風險）和 `discovery.mdns.mode="full"`（透過 mDNS TXT 記錄洩漏中繼資料）。
當沙盒瀏覽器使用 Docker `bridge` 網路但未設定 `sandbox.browser.cdpSourceRange` 時，它也會發出警告。
它也會標記危險的沙盒 Docker 網路模式（包括 `host` 和 `container:*` 命名空間加入）。
當既有的沙盒瀏覽器 Docker 容器缺少/過期的雜湊標籤時（例如遷移前容器缺少 `openclaw.browserConfigEpoch`），它也會發出警告，並建議執行 `openclaw sandbox recreate --browser --all`。
當 npm 型 Plugin/鉤子安裝記錄未釘選、缺少完整性中繼資料，或與目前已安裝套件版本偏離時，它也會發出警告。
當通道允許清單依賴可變的名稱/電子郵件/標籤，而不是穩定 ID 時（Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC 範圍，視適用情況而定），它會發出警告。
當 `gateway.auth.mode="none"` 讓 Gateway HTTP API 在沒有共享密鑰的情況下可被存取時（`/tools/invoke` 加上任何已啟用的 `/v1/*` 端點），它會發出警告。
以 `dangerous`/`dangerously` 為前綴的設定是明確的緊急操作者覆寫；啟用其中一項本身並不構成安全漏洞報告。
如需完整的危險參數清單，請參閱[安全](/zh-TW/gateway/security)中的「不安全或危險旗標摘要」章節。

SecretRef 行為：

- `security audit` 會以唯讀模式解析其目標路徑中支援的 SecretRefs。
- 如果目前命令路徑中無法使用某個 SecretRef，稽核會繼續並回報 `secretDiagnostics`（而不是當機）。
- `--token` 和 `--password` 只會覆寫該次命令叫用的深度探測驗證；它們不會重寫設定或 SecretRef 對應。

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

`--fix` 會套用安全且決定性的修復：

- 將常見的 `groupPolicy="open"` 翻轉為 `groupPolicy="allowlist"`（包含受支援通道中的帳號變體）
- 當 WhatsApp 群組政策翻轉為 `allowlist` 時，若儲存的 `allowFrom` 檔案存在且設定尚未定義 `allowFrom`，則從該檔案植入 `groupAllowFrom`
- 將 `logging.redactSensitive` 從 `"off"` 設為 `"tools"`
- 收緊狀態/設定和常見敏感檔案的權限
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- 也會收緊從 `openclaw.json` 參照的設定 include 檔案
- 在 POSIX 主機上使用 `chmod`，並在 Windows 上使用 `icacls` 重設

`--fix` **不會**：

- 輪替權杖/密碼/API 金鑰
- 停用工具（`gateway`、`cron`、`exec` 等）
- 變更 Gateway 繫結/驗證/網路暴露選擇
- 移除或重寫 Plugin/Skills

## 相關

- [CLI 參考](/zh-TW/cli)
- [安全稽核](/zh-TW/gateway/security)
