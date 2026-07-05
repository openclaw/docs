---
read_when:
    - 執行或設定命令列介面入門流程
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: 命令列介面入門導引：閘道、工作區、頻道與 Skills 的引導式設定
title: 入門設定（命令列介面）
x-i18n:
    generated_at: "2026-07-05T11:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd88690ba0b2be207299afece73eac465b528f4e97f4f5a0f889f69a97fb0e47
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

命令列介面上手流程是在 macOS、Linux 和 Windows（原生或 WSL2）上建議使用的終端設定路徑。它會在一個引導式流程中設定本機閘道（或連線到遠端閘道），以及通道、Skills 和工作區預設值。`openclaw setup` 會執行相同流程（[設定](/zh-TW/cli/setup) 說明僅設定組態的 `--baseline` 變體）。Windows 桌面使用者也可以從 [Windows Hub](/zh-TW/platforms/windows) 開始。

提供者登入、通道配對、常駐程式安裝和 Skills 下載可能會延長快速設定時間；可選步驟可以略過，稍後再使用 `openclaw configure` 重新進行。

<Info>
最快開始第一次聊天：完全略過通道設定。執行 `openclaw dashboard`，並透過 Control UI 在瀏覽器中聊天。文件：[Dashboard](/zh-TW/web/dashboard)。
</Info>

## 語言環境

精靈會本地化固定的上手流程文字。解析順序：`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`，然後是英文。支援的語言環境：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

產品名稱、命令、組態鍵、URL、提供者 ID、模型 ID，以及外掛/通道標籤，不論語言環境為何都會保留英文。

若要稍後重新設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。若用於腳本，請使用 `--non-interactive`（請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)）。
</Note>

<Tip>
上手流程包含一個網頁搜尋步驟，你可以選擇提供者：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily。有些需要 API 金鑰；其他則不需要金鑰。稍後可使用 `openclaw configure --section web` 設定。文件：[網頁工具](/zh-TW/tools/web)。
</Tip>

## QuickStart 與進階

上手流程一開始會讓你在 **QuickStart**（預設值）和 **進階**（完整控制）之間選擇。傳入 `--flow quickstart` 或 `--flow advanced`（別名 `manual`）可略過提示。

<Tabs>
  <Tab title="QuickStart（預設值）">
    - 本機閘道，local loopback 繫結
    - 工作區預設值（或既有工作區）
    - 閘道連接埠 **18789**
    - 閘道驗證 **Token**（自動產生，即使在 loopback 上也是如此）
    - 工具政策：新設定使用 `tools.profile: "coding"`（會保留既有的明確設定檔）
    - 私訊隔離：新設定使用 `session.dmScope: "per-channel-peer"`。詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 暴露 **關閉**
    - Telegram 和 WhatsApp 私訊預設為 **允許清單**：Telegram 會要求數字 Telegram 使用者 ID，WhatsApp 會要求電話號碼

  </Tab>
  <Tab title="進階（完整控制）">
    - 顯示每個步驟：模式、工作區、閘道、通道、常駐程式、Skills

  </Tab>
</Tabs>

遠端模式（`--mode remote`）一律使用進階流程；它只會設定這台機器連線到其他位置的閘道，絕不會在遠端主機上安裝或變更任何內容。

## 上手流程會設定的內容

本機模式（預設）會逐步完成以下步驟：

1. **模型/驗證** - 選擇提供者驗證流程（API 金鑰、OAuth，或提供者特定的手動驗證），包括自訂提供者（OpenAI 相容、OpenAI Responses 相容、Anthropic 相容，或未知自動偵測）。選擇預設模型。
   安全性注意事項：如果此代理將執行工具或處理 webhook/hook 內容，請偏好可用的最強最新世代模型，並保持嚴格的工具政策；較弱或較舊的層級更容易遭受提示注入。
   對於非互動式執行，`--secret-input-mode ref` 會儲存由環境變數支援的參照，而不是純文字 API 金鑰值；參照的環境變數必須已設定，否則上手流程會快速失敗。互動式密鑰參照模式可以指向環境變數或已設定的提供者參照（`file` 或 `exec`），並在儲存前執行快速預檢。
2. **工作區** - 代理檔案的目錄（預設為 `~/.openclaw/workspace`）。會植入啟動檔案。
3. **閘道** - 連接埠、繫結位址、驗證模式、Tailscale 暴露。在互動式 token 模式中，選擇純文字 token 儲存（預設）或選用 SecretRef。非互動式 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **通道** - 內建和官方外掛聊天通道，包括 Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **常駐程式** - 安裝 LaunchAgent（macOS）、systemd 使用者單元（Linux/WSL2），或原生 Windows Scheduled Task，並提供每位使用者 Startup 資料夾備援。
   如果需要 token 驗證且 `gateway.auth.token` 由 SecretRef 管理，常駐程式安裝會驗證它，但不會將已解析的 token 持久化到監督服務環境中繼資料；未解析的 SecretRef 會阻止安裝並提供指引。如果在 `gateway.auth.mode` 未設定時同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，安裝會被阻止，直到你明確設定模式。
6. **健康檢查** - 啟動閘道並驗證其可連線。
7. **Skills** - 安裝建議的 Skills 及其可選相依項。

<Note>
重新執行上手流程**不會**清除任何內容，除非你明確選擇**重設**（或傳入 `--reset`）。命令列介面 `--reset` 預設會重設組態、憑證和工作階段；使用 `--reset-scope full` 也會移除工作區。如果組態無效或包含舊版鍵，上手流程會要求你先執行 `openclaw doctor`。
</Note>

`--flow import` 會執行偵測到的遷移流程（例如 Hermes），而不是全新設定；請參閱[遷移](/zh-TW/cli/migrate)以及[安裝](/zh-TW/install/migrating-hermes)下的遷移指南。`openclaw onboard --modern` 會啟動 [Crestodian](/zh-TW/cli/crestodian)，這是一個對話式設定/修復助手，用來取代傳統精靈。

## 新增另一個代理

使用 `openclaw agents add <name>` 建立一個獨立代理，擁有自己的工作區、工作階段和驗證設定檔。不使用 `--workspace` 執行時，會啟動互動式流程來設定名稱、工作區、驗證、通道和繫結；這不是完整的 `openclaw onboard` 精靈。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區：`~/.openclaw/workspace-<agentId>`（或如果已設定，則位於 `agents.defaults.workspace` 下）。
- 新增 `bindings` 可將傳入訊息路由到此代理（上手流程可以替你完成）。
- 非互動式旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步行為和組態輸出，請參閱[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動式範例，請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。
如需完整旗標參考，請參閱 [`openclaw onboard`](/zh-TW/cli/onboard)。

## 相關文件

- 命令列介面命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- 上手流程總覽：[上手流程總覽](/zh-TW/start/onboarding-overview)
- macOS app 上手流程：[上手流程](/zh-TW/start/onboarding)
- 代理首次執行儀式：[代理啟動](/zh-TW/start/bootstrapping)
