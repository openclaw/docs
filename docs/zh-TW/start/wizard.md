---
read_when:
    - 執行或設定 CLI 入門流程
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: CLI 入門導引：Gateway、工作區、通道與 Skills 的引導式設定
title: 初始設定 (CLI)
x-i18n:
    generated_at: "2026-04-30T03:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding 是在 macOS、Linux 或 Windows（透過 WSL2；強烈建議）上設定 OpenClaw 的**建議**方式。
它會在同一個引導流程中設定本機 Gateway 或遠端 Gateway 連線，以及通道、Skills
和工作區預設值。

```bash
openclaw onboard
```

<Info>
最快開始首次聊天：開啟 Control UI（不需要設定通道）。執行
`openclaw dashboard`，並在瀏覽器中聊天。文件：[Dashboard](/zh-TW/web/dashboard)。
</Info>

稍後若要重新設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。腳本請使用 `--non-interactive`。
</Note>

<Tip>
CLI onboarding 包含一個網頁搜尋步驟，你可以選擇 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG 或 Tavily 等提供者。部分提供者需要
API 金鑰，其他則不需要金鑰。你也可以稍後用
`openclaw configure --section web` 設定。文件：[網頁工具](/zh-TW/tools/web)。
</Tip>

## 快速開始與進階

Onboarding 會先讓你選擇**快速開始**（預設值）或**進階**（完整控制）。

<Tabs>
  <Tab title="快速開始（預設值）">
    - 本機 Gateway（迴路）
    - 工作區預設值（或現有工作區）
    - Gateway 連接埠 **18789**
    - Gateway 驗證 **權杖**（自動產生，即使在迴路上也是如此）
    - 新本機設定的工具政策預設值：`tools.profile: "coding"`（會保留現有的明確設定檔）
    - DM 隔離預設值：本機 onboarding 會在未設定時寫入 `session.dmScope: "per-channel-peer"`。詳細資訊：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露**關閉**
    - Telegram + WhatsApp DM 預設為**允許清單**（系統會提示你輸入電話號碼）

  </Tab>
  <Tab title="進階（完整控制）">
    - 顯示每個步驟（模式、工作區、Gateway、通道、daemon、Skills）。

  </Tab>
</Tabs>

## Onboarding 會設定什麼

**本機模式（預設）**會引導你完成以下步驟：

1. **模型/驗證** — 選擇任何支援的提供者/驗證流程（API 金鑰、OAuth 或提供者專屬的手動驗證），包括自訂提供者
   （相容 OpenAI、相容 Anthropic，或 Unknown 自動偵測）。選擇預設模型。
   安全注意事項：如果這個 agent 會執行工具或處理 webhook/hooks 內容，請優先使用可用的最強最新世代模型，並保持嚴格的工具政策。較弱/較舊的層級更容易遭到提示注入。
   對於非互動執行，`--secret-input-mode ref` 會在驗證設定檔中儲存由 env 支援的參照，而不是純文字 API 金鑰值。
   在非互動 `ref` 模式中，必須設定提供者 env var；如果只傳入行內金鑰旗標但沒有該 env var，會立即失敗。
   在互動執行中，選擇密鑰參照模式可讓你指向環境變數或已設定的提供者 ref（`file` 或 `exec`），並在儲存前快速預先驗證。
   對於 Anthropic，互動式 onboarding/configure 會提供 **Anthropic Claude CLI** 作為偏好的本機路徑，並提供 **Anthropic API 金鑰** 作為建議的正式環境路徑。Anthropic setup-token 也仍可作為受支援的 token-auth 路徑使用。
2. **工作區** — agent 檔案的位置（預設 `~/.openclaw/workspace`）。會植入 bootstrap 檔案。
3. **Gateway** — 連接埠、綁定位址、驗證模式、Tailscale 暴露。
   在互動式權杖模式中，選擇預設純文字權杖儲存，或選擇使用 SecretRef。
   非互動權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **通道** — 內建與隨附的聊天通道，例如 BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **Daemon** — 安裝 LaunchAgent（macOS）、systemd 使用者單元（Linux/WSL2），或原生 Windows Scheduled Task，並搭配每位使用者的 Startup 資料夾備援。
   如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將解析後的權杖持久化到 supervisor 服務環境中繼資料。
   如果權杖驗證需要權杖，而已設定的權杖 SecretRef 無法解析，daemon 安裝會被封鎖並提供可操作的指引。
   如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，daemon 安裝會被封鎖，直到明確設定模式為止。
6. **健康檢查** — 啟動 Gateway 並確認它正在執行。
7. **Skills** — 安裝建議的 Skills 和選用相依項。

<Note>
重新執行 onboarding **不會**清除任何內容，除非你明確選擇**重設**（或傳入 `--reset`）。
CLI `--reset` 預設會重設設定、憑證和工作階段；使用 `--reset-scope full` 可包含工作區。
如果設定無效或包含舊版金鑰，onboarding 會要求你先執行 `openclaw doctor`。
</Note>

**遠端模式**只會設定本機用戶端連線到其他位置的 Gateway。
它**不會**在遠端主機上安裝或變更任何內容。

## 新增另一個 agent

使用 `openclaw agents add <name>` 建立一個擁有自己工作區、
工作階段和驗證設定檔的獨立 agent。不帶 `--workspace` 執行會啟動 onboarding。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區遵循 `~/.openclaw/workspace-<agentId>`。
- 新增 `bindings` 以路由傳入訊息（onboarding 可以執行此操作）。
- 非互動旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步拆解和設定輸出，請參閱
[CLI 設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動範例，請參閱 [CLI 自動化](/zh-TW/start/wizard-cli-automation)。
如需更深入的技術參考，包括 RPC 詳細資訊，請參閱
[Onboarding 參考](/zh-TW/reference/wizard)。

## 相關文件

- CLI 命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- Onboarding 概觀：[Onboarding 概觀](/zh-TW/start/onboarding-overview)
- macOS app onboarding：[Onboarding](/zh-TW/start/onboarding)
- Agent 首次執行儀式：[Agent Bootstrapping](/zh-TW/start/bootstrapping)
