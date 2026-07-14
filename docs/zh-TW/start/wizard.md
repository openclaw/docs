---
read_when:
    - 執行或設定命令列介面引導流程
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: 命令列介面新手引導：驗證推論，然後將其餘設定交給 Crestodian
title: 新手引導（命令列介面）
x-i18n:
    generated_at: "2026-07-14T14:11:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: d95e2a0803d2af9ac1f0d3790f023aad4371c6c86c2387ddc17e52e8774de9e8
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

命令列介面的新手引導是在 macOS、Linux 與 Windows（原生或 WSL2）上建議使用的終端機設定方式。預設情況下，它會偵測機器上已可用的 AI 存取方式、透過實際補全進行驗證，然後啟動 Crestodian 來設定工作區、閘道與選用功能。`openclaw setup` 會執行相同流程（[設定](/zh-TW/cli/setup)涵蓋僅設定 `--baseline` 的變體）。Windows 桌面使用者也可以從 [Windows Hub](/zh-TW/platforms/windows) 開始。

引導式新手引導會先建立推論能力。它會偵測可用的 AI 存取方式、要求完成一次實際補全，之後才會啟動 [Crestodian](/zh-TW/cli/crestodian) 來設定 OpenClaw 的其餘部分。選擇**暫時略過**會結束新手引導，而不啟動 Crestodian。

傳統精靈仍可用於自訂提供者、遠端閘道設定、頻道配對、常駐程式控制、Skills 與匯入。請使用 `openclaw onboard --classic` 明確執行；引導式推論選擇器不會將流程委派給它。推論通過後，Crestodian 可以使用 `open channel wizard for
<channel>`，將需要密鑰的頻道設定交給會遮蔽輸入內容的終端機精靈。若要變更模型提供者或其驗證方式，請結束 Crestodian 並執行 `openclaw onboard`；Crestodian 不會開啟引導式或傳統提供者流程。

<Info>
最快開始第一次聊天的方式：完成引導式設定、執行 `openclaw dashboard`，然後透過控制介面在瀏覽器中聊天。文件：[儀表板](/zh-TW/web/dashboard)。
</Info>

## 語言地區

精靈會將固定的新手引導文字本地化。解析順序為：`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`，最後是英文。支援的語言地區：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

無論語言地區為何，產品名稱、命令、設定鍵、URL、提供者 ID、模型 ID，以及外掛／頻道標籤都會維持英文。

若之後要重新設定非推論相關設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。若用於指令碼，請使用 `--non-interactive`（請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)）。
</Note>

<Tip>
傳統精靈包含網路搜尋步驟，你可以在其中選擇提供者：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily。部分提供者需要 API 金鑰，其他則不需要金鑰。稍後可使用 `openclaw configure --section web` 進行設定。文件：[網路工具](/zh-TW/tools/web)。
</Tip>

## 引導式預設流程

直接執行 `openclaw onboard` 會依循此流程：

1. 接受安全性通知。
2. 偵測已設定的模型、API 金鑰環境變數，以及支援的本機 AI 命令列介面。
3. 使用實際補全測試第一個偵測到的候選項目。若失敗，顯示原因並繼續測試下一個可用的候選項目。
4. 若所有偵測選項皆已用盡，請選擇 OpenAI、Anthropic、xAI (Grok)、Google 或 OpenRouter，或選擇**更多…**查看其餘提供者。每個提供者的地區、方案，以及支援的瀏覽器、裝置、API 金鑰或權杖方式都會顯示在第二個選單中，並使用相同的實際補全進行測試。選擇**暫時略過**可直接結束，而不啟動 Crestodian。
5. 僅保存已驗證的模型路由，以及它所需的任何認證資訊／外掛狀態。工作區與閘道設定不會變更。
6. 使用已驗證的模型啟動 Crestodian，使其能夠設定工作區、閘道、頻道、代理程式、外掛，以及其餘選用設定。

在已完成設定的安裝環境中重新執行此命令時，會先測試目前的預設模型，使引導式流程成為一次驗證與修復程序。檢查失敗時絕不會自動取代已設定的模型；新手引導會停止並詢問如何繼續。若之後要新增非推論項目，請執行 `openclaw channels add` 或 `openclaw configure`；若要變更提供者或驗證路由，請使用 `openclaw onboard`。

## 傳統精靈：快速開始與進階

執行 `openclaw onboard --classic` 以開啟完整精靈。首先會讓你選擇**快速開始**（預設值）或**進階**（完整控制）。傳入 `--flow quickstart` 或 `--flow advanced`（別名 `manual`）可選取傳統流程並略過該提示。

<Tabs>
  <Tab title="快速開始（預設值）">
    - 本機閘道，繫結至回送介面
    - 預設工作區（或現有工作區）
    - 閘道連接埠 **18789**
    - 閘道驗證**權杖**（即使在回送介面上也會自動產生）
    - 工具原則：新設定使用 `tools.profile: "coding"`（會保留現有的明確設定檔）
    - 私訊隔離：新設定使用 `session.dmScope: "per-channel-peer"`。詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開存取**關閉**
    - Telegram 與 WhatsApp 私訊預設使用**允許清單**：Telegram 會要求輸入數字形式的 Telegram 使用者 ID，WhatsApp 則會要求輸入電話號碼

  </Tab>
  <Tab title="進階（完整控制）">
    - 顯示所有步驟：模式、工作區、閘道、頻道、常駐程式、Skills

  </Tab>
</Tabs>

遠端模式（`--mode remote`）一律使用進階流程；它只會設定此機器以連線至其他位置的閘道，絕不會在遠端主機上安裝或變更任何內容。

## 傳統新手引導的設定項目

本機模式（預設）會逐步執行以下設定：

1. **模型／驗證** - 選擇提供者驗證流程（API 金鑰、OAuth 或提供者特定的手動驗證），包括自訂提供者（OpenAI 相容、OpenAI Responses 相容、Anthropic 相容或未知自動偵測）。選擇預設模型。
   全新的 OpenAI API 金鑰設定預設為 `openai/gpt-5.6`（不含其他限定的直接 API ID 會解析為 Sol）；全新的 ChatGPT／Codex 設定預設為 `openai/gpt-5.6-sol`。重新執行設定會保留現有的明確模型，包括 `openai/gpt-5.5`。如果帳戶未提供 GPT-5.6，請明確選取 `openai/gpt-5.5`。
   安全性注意事項：如果此代理程式將執行工具或處理網路鉤子／掛鉤內容，請優先選用可用的最強最新世代模型，並維持嚴格的工具原則；較弱或較舊的模型層級更容易受到提示詞注入攻擊。
   對於非互動式執行，`--secret-input-mode ref` 會儲存由環境變數支援的參照，而不是明文 API 金鑰值；所參照的環境變數必須已設定，否則新手引導會立即失敗。互動式密鑰參照模式可以指向環境變數或已設定的提供者參照（`file` 或 `exec`），並在儲存前執行快速預檢。完成模型／驗證設定後，精靈會提供選用的即時補全測試；若測試失敗，可以返回模型／驗證設定一次，或忽略失敗而不阻擋傳統精靈的其餘流程。忽略失敗不會解鎖 Crestodian；對話式設定仍要求推論檢查通過。
2. **工作區** - 代理程式檔案的目錄（預設為 `~/.openclaw/workspace`）。植入啟動檔案。
3. **閘道** - 連接埠、繫結位址、驗證模式、Tailscale 公開存取。在互動式權杖模式中，選擇明文權杖儲存（預設），或選擇使用 SecretRef。非互動式 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **頻道** - 內建與官方外掛聊天頻道，包括 Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **常駐程式** - 安裝 LaunchAgent (macOS)、systemd 使用者單元 (Linux/WSL2)，或原生 Windows 排程工作，並提供每位使用者的啟動資料夾作為備援。
   如果需要權杖驗證，且 `gateway.auth.token` 由 SecretRef 管理，安裝常駐程式時會驗證它，但不會將解析後的權杖保存至監督程式服務的環境中繼資料；未解析的 SecretRef 會阻止安裝並提供指引。如果 `gateway.auth.token` 與 `gateway.auth.password` 均已設定，而 `gateway.auth.mode` 未設定，安裝會遭到阻止，直到你明確設定模式為止。
6. **健康狀態檢查** - 啟動閘道並驗證其可連線。
7. **Skills** - 安裝建議的 Skills 及其選用相依套件。

<Note>
除非你明確選擇**重設**（或傳入 `--reset`），否則重新執行新手引導**不會**清除任何內容。命令列介面 `--reset` 預設會清除設定、認證資訊與工作階段；使用 `--reset-scope full` 可一併移除工作區。如果設定無效或包含舊版設定鍵，新手引導會要求你先執行 `openclaw doctor`。
</Note>

`--flow import` 會在傳統精靈中執行偵測到的遷移流程（例如 Hermes），而非全新設定；請參閱[遷移](/zh-TW/cli/migrate)以及[安裝](/zh-TW/install/migrating-hermes)下的遷移指南。`openclaw onboard --modern` 是 [Crestodian](/zh-TW/cli/crestodian) 的相容性別名。它使用與 `openclaw crestodian` 相同的推論閘門：通過驗證的推論會啟動助理，而互動式失敗則會返回引導式推論設定。

## 新增另一個代理程式

使用 `openclaw agents add <name>` 建立具有獨立工作區、工作階段與驗證設定檔的代理程式。不使用 `--workspace` 執行時，會啟動名稱、工作區、驗證、頻道與繫結的互動式流程；這並非完整的 `openclaw onboard` 精靈。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區：`~/.openclaw/workspace-<agentId>`（若已設定 `agents.defaults.workspace`，則位於其下）。
- 新增 `bindings`，將傳入訊息路由至此代理程式（新手引導可以代你完成）。
- 非互動式旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步行為與設定輸出，請參閱[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動式範例，請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。
如需完整旗標參考，請參閱 [`openclaw onboard`](/zh-TW/cli/onboard)。

## 相關文件

- 命令列介面命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- 新手引導概覽：[新手引導概覽](/zh-TW/start/onboarding-overview)
- macOS 應用程式新手引導：[新手引導](/zh-TW/start/onboarding)
- 代理程式首次執行程序：[代理程式啟動設定](/zh-TW/start/bootstrapping)
