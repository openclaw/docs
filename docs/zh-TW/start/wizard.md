---
read_when:
    - 執行或設定 CLI 入門流程
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: CLI 入門設定：Gateway、工作區、頻道和 Skills 的引導式設定
title: 入門設定 (CLI)
x-i18n:
    generated_at: "2026-05-06T09:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI 新手設定是在 macOS、Linux 或 Windows（透過 WSL2；強烈建議）上設定 OpenClaw 的**建議**方式。
它會在一個引導流程中設定本機 Gateway 或遠端 Gateway 連線，以及通道、skills
和工作區預設值。

```bash
openclaw onboard
```

<Info>
最快的首次聊天方式：開啟 Control UI（不需要設定通道）。執行
`openclaw dashboard`，並在瀏覽器中聊天。文件：[Dashboard](/zh-TW/web/dashboard)。
</Info>

若要稍後重新設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。若用於腳本，請使用 `--non-interactive`。
</Note>

<Tip>
CLI 新手設定包含一個網頁搜尋步驟，你可以在其中選擇提供者，
例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、
Ollama Web Search、Perplexity、SearXNG 或 Tavily。有些提供者需要
API key，有些則不需要 key。你也可以稍後使用
`openclaw configure --section web` 進行設定。文件：[網頁工具](/zh-TW/tools/web)。
</Tip>

## 快速開始與進階

新手設定會從**快速開始**（預設值）與**進階**（完整控制）開始。

<Tabs>
  <Tab title="快速開始（預設值）">
    - 本機 Gateway（loopback）
    - 工作區預設值（或現有工作區）
    - Gateway 連接埠 **18789**
    - Gateway 驗證 **Token**（自動產生，即使在 loopback 上也是如此）
    - 新本機設定的工具政策預設值：`tools.profile: "coding"`（會保留現有的明確 profile）
    - DM 隔離預設值：本機新手設定會在未設定時寫入 `session.dmScope: "per-channel-peer"`。詳情：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **關閉**
    - Telegram + WhatsApp DM 預設為**允許清單**（系統會提示你輸入電話號碼）

  </Tab>
  <Tab title="進階（完整控制）">
    - 顯示每個步驟（模式、工作區、gateway、通道、daemon、skills）。

  </Tab>
</Tabs>

## 新手設定會設定什麼

**本機模式（預設）**會引導你完成這些步驟：

1. **模型/驗證** — 選擇任何支援的提供者/驗證流程（API key、OAuth 或提供者特定的手動驗證），包含自訂提供者
   （OpenAI 相容、Anthropic 相容或未知自動偵測）。選擇預設模型。
   安全注意事項：如果此 agent 會執行工具或處理 webhook/hooks 內容，請優先選用可用的最強最新世代模型，並保持工具政策嚴格。較弱/較舊的等級較容易遭到 prompt injection。
   對於非互動執行，`--secret-input-mode ref` 會在 auth profiles 中儲存由環境變數支援的 refs，而不是純文字 API key 值。
   在非互動 `ref` 模式中，必須設定提供者環境變數；若只傳入行內 key 旗標而未設定該環境變數，會快速失敗。
   在互動執行中，選擇秘密參照模式可讓你指向環境變數或已設定的提供者 ref（`file` 或 `exec`），並在儲存前進行快速預檢驗證。
   對於 Anthropic，互動式新手設定/設定會提供 **Anthropic Claude CLI** 作為偏好的本機路徑，並提供 **Anthropic API key** 作為建議的生產路徑。Anthropic setup-token 也仍可作為受支援的 token 驗證路徑。
2. **工作區** — agent 檔案的位置（預設 `~/.openclaw/workspace`）。會植入啟動檔案。
3. **Gateway** — 連接埠、綁定位址、驗證模式、Tailscale 暴露。
   在互動 token 模式中，選擇預設純文字 token 儲存，或選擇使用 SecretRef。
   非互動 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **通道** — 內建和 bundled 聊天通道，例如 BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **Daemon** — 安裝 LaunchAgent（macOS）、systemd 使用者單元（Linux/WSL2），或原生 Windows 排程工作，並提供每位使用者的 Startup 資料夾 fallback。
   如果 token 驗證需要 token 且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將解析後的 token 持久化到 supervisor 服務環境 metadata。
   如果 token 驗證需要 token 且已設定的 token SecretRef 無法解析，daemon 安裝會被封鎖，並提供可執行的指引。
   如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，但未設定 `gateway.auth.mode`，daemon 安裝會被封鎖，直到明確設定 mode。
6. **健康檢查** — 啟動 Gateway 並確認它正在執行。
7. **Skills** — 安裝建議的 skills 和選用相依項。

<Note>
重新執行新手設定**不會**清除任何內容，除非你明確選擇**重設**（或傳入 `--reset`）。
CLI `--reset` 預設會重設 config、credentials 和 sessions；使用 `--reset-scope full` 可包含 workspace。
如果 config 無效或包含 legacy keys，新手設定會要求你先執行 `openclaw doctor`。
</Note>

**遠端模式**只會設定本機 client 以連線到其他位置的 Gateway。
它**不會**在遠端主機上安裝或變更任何內容。

## 新增另一個 agent

使用 `openclaw agents add <name>` 建立具有自己工作區、
sessions 和 auth profiles 的獨立 agent。不帶 `--workspace` 執行會啟動新手設定。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區遵循 `~/.openclaw/workspace-<agentId>`。
- 加入 `bindings` 可路由傳入訊息（新手設定可以執行此操作）。
- 非互動旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步分解和 config 輸出，請參閱
[CLI 設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動範例，請參閱 [CLI 自動化](/zh-TW/start/wizard-cli-automation)。
如需更深入的技術參考，包括 RPC 詳情，請參閱
[新手設定參考](/zh-TW/reference/wizard)。

## 相關文件

- CLI 指令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- 新手設定概覽：[新手設定概覽](/zh-TW/start/onboarding-overview)
- macOS app 新手設定：[新手設定](/zh-TW/start/onboarding)
- Agent 首次執行流程：[Agent Bootstrapping](/zh-TW/start/bootstrapping)
