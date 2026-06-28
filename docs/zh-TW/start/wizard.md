---
read_when:
    - 執行或設定命令列介面入門設定
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: 命令列介面入門：閘道、工作區、頻道與 Skills 的引導式設定
title: 入門設定（命令列介面）
x-i18n:
    generated_at: "2026-06-28T20:45:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

命令列介面入門設定是在 macOS、Linux 或 Windows 上設定 OpenClaw 的**建議**終端路徑。Windows 桌面使用者也可以從
[Windows Hub](/zh-TW/platforms/windows) 開始。
它會在一個引導式流程中設定本機閘道或遠端閘道連線，以及頻道、Skills
和工作區預設值。

```bash
openclaw onboard
```

快速入門通常只需幾分鐘，但完整入門設定可能需要更久，當提供者登入、頻道配對、守護程式安裝、網路下載、Skills 或選用外掛需要額外設定時尤其如此。精靈會一開始就顯示這個時間軸，選用步驟可以略過，之後再用
`openclaw configure` 重新處理。

## 語言環境

命令列介面精靈會本地化固定的入門設定文案。它會依序從
`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG` 解析語言環境，並在找不到時退回英文。支援的精靈語言環境為 `en`、`zh-CN` 和 `zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

名稱和穩定識別碼會保留字面值：`OpenClaw`、`Gateway`、`Tailscale`、命令、設定鍵、URL、提供者 ID、模型 ID，以及外掛/頻道標籤不會翻譯。

<Info>
最快開始第一次聊天：開啟 Control UI（不需要設定頻道）。執行
`openclaw dashboard` 並在瀏覽器中聊天。文件：[Dashboard](/zh-TW/web/dashboard)。
</Info>

稍後重新設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。對於指令碼，請使用 `--non-interactive`。
</Note>

<Tip>
命令列介面入門設定包含一個網頁搜尋步驟，你可以選擇 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily 等提供者。有些提供者需要 API 金鑰，有些則不需要金鑰。你也可以之後用
`openclaw configure --section web` 設定。文件：[Web tools](/zh-TW/tools/web)。
</Tip>

## 快速入門與進階

入門設定會從**快速入門**（預設值）與**進階**（完整控制）開始。

<Tabs>
  <Tab title="快速入門（預設值）">
    - 本機閘道（loopback）
    - 工作區預設值（或現有工作區）
    - 閘道連接埠 **18789**
    - 閘道驗證 **Token**（自動產生，即使在 loopback 上也是如此）
    - 新本機設定的工具政策預設值：`tools.profile: "coding"`（會保留現有明確設定的設定檔）
    - 私訊隔離預設值：未設定時，本機入門設定會寫入 `session.dmScope: "per-channel-peer"`。詳細資訊：[CLI Setup Reference](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **關閉**
    - Telegram + WhatsApp 私訊預設為**允許清單**（系統會提示你輸入電話號碼）

  </Tab>
  <Tab title="進階（完整控制）">
    - 顯示每個步驟（模式、工作區、閘道、頻道、守護程式、Skills）。

  </Tab>
</Tabs>

## 入門設定會設定什麼

**本機模式（預設）**會引導你完成這些步驟：

1. **模型/驗證** — 選擇任何支援的提供者/驗證流程（API 金鑰、OAuth 或提供者特定手動驗證），包括 Custom Provider
   （OpenAI 相容、Anthropic 相容或 Unknown 自動偵測）。選擇預設模型。
   安全性注意事項：如果此代理程式會執行工具或處理網路鉤子/hooks 內容，請偏好使用可用的最強最新世代模型，並保持嚴格的工具政策。較弱/較舊的層級較容易遭到提示注入。
   對於非互動執行，`--secret-input-mode ref` 會在驗證設定檔中儲存由環境支援的 ref，而不是純文字 API 金鑰值。
   在非互動 `ref` 模式中，必須設定提供者環境變數；若傳入行內金鑰旗標但沒有該環境變數，會快速失敗。
   在互動執行中，選擇秘密參照模式可讓你指向環境變數或已設定的提供者 ref（`file` 或 `exec`），並在儲存前進行快速預檢驗證。
   對於 Anthropic，互動式入門設定/設定會提供 **Anthropic Claude CLI** 作為偏好的本機路徑，並提供 **Anthropic API key** 作為建議的正式環境路徑。Anthropic setup-token 也仍可作為支援的 token 驗證路徑。
2. **工作區** — 代理程式檔案的位置（預設 `~/.openclaw/workspace`）。植入啟動檔案。
3. **閘道** — 連接埠、繫結位址、驗證模式、Tailscale 暴露。
   在互動式 token 模式中，選擇預設純文字 token 儲存，或選擇使用 SecretRef。
   非互動 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **頻道** — 內建與官方外掛聊天頻道，例如 iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **守護程式** — 安裝 LaunchAgent（macOS）、systemd 使用者單元（Linux/WSL2），或原生 Windows 排程工作，並提供每位使用者的 Startup 資料夾備援。
   如果 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，守護程式安裝會驗證它，但不會將解析後的 token 持久化到 supervisor 服務環境中繼資料。
   如果 token 驗證需要 token，且設定的 token SecretRef 未解析，守護程式安裝會被封鎖並提供可操作的指引。
   如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，守護程式安裝會被封鎖，直到明確設定模式。
6. **健康檢查** — 啟動閘道並確認它正在執行。
7. **Skills** — 安裝建議的 Skills 和選用相依項。

<Note>
重新執行入門設定**不會**清除任何內容，除非你明確選擇**重設**（或傳入 `--reset`）。
命令列介面 `--reset` 預設會重設設定、憑證和工作階段；使用 `--reset-scope full` 可包含工作區。
如果設定無效或包含舊版鍵，入門設定會要求你先執行 `openclaw doctor`。
</Note>

**遠端模式**只會設定本機用戶端連線到其他位置的閘道。
它**不會**在遠端主機上安裝或變更任何內容。

## 新增另一個代理程式

使用 `openclaw agents add <name>` 建立一個具有自己工作區、工作階段和驗證設定檔的獨立代理程式。未使用 `--workspace` 執行時會啟動入門設定。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區遵循 `~/.openclaw/workspace-<agentId>`。
- 新增 `bindings` 以路由傳入訊息（入門設定可以執行此操作）。
- 非互動旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步分解和設定輸出，請參閱
[CLI Setup Reference](/zh-TW/start/wizard-cli-reference)。
如需非互動範例，請參閱 [CLI Automation](/zh-TW/start/wizard-cli-automation)。
如需更深入的技術參考（包括 RPC 詳細資訊），請參閱
[Onboarding Reference](/zh-TW/reference/wizard)。

## 相關文件

- 命令列介面命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- 入門設定概觀：[Onboarding Overview](/zh-TW/start/onboarding-overview)
- macOS app 入門設定：[Onboarding](/zh-TW/start/onboarding)
- 代理程式首次執行儀式：[Agent Bootstrapping](/zh-TW/start/bootstrapping)
