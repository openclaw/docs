---
read_when:
    - 執行或設定命令列介面入門流程
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: 命令列介面上手設定：針對閘道、工作區、頻道與 Skills 的引導式設定
title: 入門設定（命令列介面）
x-i18n:
    generated_at: "2026-06-27T20:04:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding 是在 macOS、Linux 或 Windows 上設定 OpenClaw 的**建議**終端機路徑。Windows 桌面使用者也可以從
[Windows Hub](/zh-TW/platforms/windows) 開始。
它會在一個引導流程中設定本機閘道或遠端閘道連線，以及通道、Skills
和工作區預設值。

```bash
openclaw onboard
```

## 語言環境

命令列介面精靈會將固定的 onboarding 文字本地化。它會依序從
`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG` 解析語言環境，並在無法解析時
回退為英文。支援的精靈語言環境為 `en`、`zh-CN` 和 `zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

名稱與穩定識別碼會保持字面值：`OpenClaw`、`Gateway`、`Tailscale`、
命令、設定鍵、URL、提供者 ID、模型 ID，以及外掛/通道標籤
都不會翻譯。

<Info>
最快開始第一次聊天：開啟 Control UI（不需要設定通道）。執行
`openclaw dashboard`，並在瀏覽器中聊天。文件：[Dashboard](/zh-TW/web/dashboard)。
</Info>

稍後重新設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。腳本請使用 `--non-interactive`。
</Note>

<Tip>
命令列介面 onboarding 包含一個網路搜尋步驟，你可以選擇提供者，
例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG 或 Tavily。有些提供者需要
API 金鑰，其他則不需要金鑰。你也可以稍後使用
`openclaw configure --section web` 進行設定。文件：[網路工具](/zh-TW/tools/web)。
</Tip>

## QuickStart 與進階

Onboarding 會從 **QuickStart**（預設值）與**進階**（完整控制）開始。

<Tabs>
  <Tab title="QuickStart (defaults)">
    - 本機閘道（loopback）
    - 工作區預設值（或既有工作區）
    - 閘道連接埠 **18789**
    - 閘道驗證 **Token**（即使在 loopback 上也會自動產生）
    - 新本機設定的工具政策預設值：`tools.profile: "coding"`（會保留既有的明確 profile）
    - DM 隔離預設值：未設定時，本機 onboarding 會寫入 `session.dmScope: "per-channel-peer"`。詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **關閉**
    - Telegram + WhatsApp DM 預設為**允許清單**（系統會提示你輸入電話號碼）

  </Tab>
  <Tab title="Advanced (full control)">
    - 顯示每個步驟（模式、工作區、閘道、通道、daemon、Skills）。

  </Tab>
</Tabs>

## Onboarding 會設定什麼

**本機模式（預設）**會引導你完成以下步驟：

1. **模型/驗證** — 選擇任何支援的提供者/驗證流程（API 金鑰、OAuth 或提供者專屬的手動驗證），包含自訂提供者
   （OpenAI 相容、Anthropic 相容或 Unknown 自動偵測）。選擇預設模型。
   安全性注意事項：如果此 agent 會執行工具或處理 webhook/hooks 內容，請優先使用可用的最強最新世代模型，並保持嚴格的工具政策。較弱/較舊的層級更容易受到提示注入。
   對於非互動執行，`--secret-input-mode ref` 會在驗證 profile 中儲存由環境變數支援的 ref，而不是純文字 API 金鑰值。
   在非互動 `ref` 模式中，必須設定提供者環境變數；若在沒有該環境變數的情況下傳入內嵌金鑰旗標，會快速失敗。
   在互動執行中，選擇秘密參照模式可讓你指向環境變數或已設定的提供者 ref（`file` 或 `exec`），並在儲存前進行快速預檢驗證。
   對於 Anthropic，互動式 onboarding/configure 會提供 **Anthropic Claude CLI** 作為偏好的本機路徑，並提供 **Anthropic API key** 作為建議的正式環境路徑。Anthropic setup-token 也仍可作為支援的 token 驗證路徑。
2. **工作區** — agent 檔案的位置（預設為 `~/.openclaw/workspace`）。會植入 bootstrap 檔案。
3. **閘道** — 連接埠、繫結位址、驗證模式、Tailscale 暴露。
   在互動 token 模式中，選擇預設純文字 token 儲存，或選擇使用 SecretRef。
   非互動 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **通道** — 內建與官方外掛聊天通道，例如 iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **Daemon** — 安裝 LaunchAgent（macOS）、systemd 使用者 unit（Linux/WSL2），或原生 Windows 排程工作，並使用每位使用者的 Startup 資料夾作為後備。
   如果 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將解析後的 token 持久化到 supervisor 服務環境中繼資料。
   如果 token 驗證需要 token，且設定的 token SecretRef 無法解析，daemon 安裝會被阻擋，並提供可操作的指引。
   如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，daemon 安裝會被阻擋，直到明確設定模式。
6. **健康檢查** — 啟動閘道並驗證它正在執行。
7. **Skills** — 安裝建議的 Skills 與可選依賴項。

<Note>
除非你明確選擇**重設**（或傳入 `--reset`），否則重新執行 onboarding **不會**清除任何內容。
命令列介面 `--reset` 預設會重設設定、憑證與工作階段；使用 `--reset-scope full` 可包含工作區。
如果設定無效或包含舊版鍵，onboarding 會要求你先執行 `openclaw doctor`。
</Note>

**遠端模式**只會設定本機用戶端連線到其他位置的閘道。
它**不會**在遠端主機上安裝或變更任何內容。

## 新增另一個 agent

使用 `openclaw agents add <name>` 建立具有自己工作區、
工作階段與驗證 profile 的獨立 agent。不帶 `--workspace` 執行會啟動 onboarding。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區遵循 `~/.openclaw/workspace-<agentId>`。
- 新增 `bindings` 以路由傳入訊息（onboarding 可以處理此項）。
- 非互動旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步分解與設定輸出，請參閱
[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動範例，請參閱 [命令列介面自動化](/zh-TW/start/wizard-cli-automation)。
如需更深入的技術參考，包括 RPC 詳細資訊，請參閱
[Onboarding 參考](/zh-TW/reference/wizard)。

## 相關文件

- 命令列介面命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- Onboarding 概覽：[Onboarding 概覽](/zh-TW/start/onboarding-overview)
- macOS app onboarding：[Onboarding](/zh-TW/start/onboarding)
- Agent 首次執行儀式：[Agent Bootstrapping](/zh-TW/start/bootstrapping)
