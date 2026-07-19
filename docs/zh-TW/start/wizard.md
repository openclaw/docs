---
read_when:
    - 執行或設定命令列介面的新手引導
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: 命令列介面初始設定：驗證推論，然後將剩餘設定交由 OpenClaw 處理
title: 新手引導（命令列介面）
x-i18n:
    generated_at: "2026-07-19T14:08:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c02990a37465578ec8153ffff880455b437fa8cf1e8796b89944289e0543982
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

命令列介面初始設定是在 macOS、Linux 和 Windows（原生或 WSL2）上建議使用的終端機設定方式。預設情況下，它會偵測機器上已有的 AI 存取方式、以實際完成回應加以驗證，然後啟動 OpenClaw 以設定工作區、閘道和選用功能。`openclaw setup` 會執行相同流程（[設定](/zh-TW/cli/setup)涵蓋僅設定組態的 `--baseline` 變體）。Windows 桌面使用者也可以從 [Windows 中心](/zh-TW/platforms/windows)開始。

引導式初始設定會先建立推論能力。它會偵測可用的 AI 存取方式、要求實際完成回應，之後才會啟動 [OpenClaw](/zh-TW/cli/openclaw) 來設定 OpenClaw 的其餘部分。選擇 **Skip for now** 會結束初始設定，而不啟動 OpenClaw。

傳統精靈仍可用於自訂供應商、遠端閘道設定、頻道配對、常駐程式控制、Skills 和匯入。請使用 `openclaw onboard --classic` 明確執行；引導式推論選擇器不會轉交給它。推論通過後，OpenClaw 可以使用 `open channel wizard for
<channel>`，將需要祕密的頻道設定交給會遮罩輸入的終端機精靈。
若要變更模型供應商或其驗證方式，請結束 OpenClaw 並執行 `openclaw onboard`；OpenClaw 不會開啟引導式或傳統供應商流程。

<Info>
最快開始第一次聊天的方式：完成引導式設定、執行 `openclaw dashboard`，然後透過控制介面在瀏覽器中聊天。文件：[儀表板](/zh-TW/web/dashboard)。
</Info>

## 語系

精靈會將固定的初始設定文案本地化。它會依序使用 `OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES` 和 `LANG` 中第一個非空白值，若皆無則回退為英文。支援的語系：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # 明確覆寫為英文
```

無論語系為何，產品名稱、命令、組態鍵、URL、供應商 ID、模型 ID，以及外掛/頻道標籤都會保留英文。

若稍後要重新設定非推論相關設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。若用於指令碼，請使用 `--non-interactive`（請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)）。
</Note>

<Tip>
傳統精靈包含網頁搜尋步驟，你可以在其中選擇供應商：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily。有些需要 API 金鑰，其他則不需要金鑰。稍後可使用 `openclaw configure --section web` 進行設定。文件：[網頁工具](/zh-TW/tools/web)。
</Tip>

## 引導式預設流程

直接執行 `openclaw onboard` 會遵循此流程：

1. 接受安全性通知。
2. 偵測已設定的模型、API 金鑰環境變數、支援的本機 AI
   命令列介面，以及閘道主機上可連線的 Ollama 或 LM
   Studio 伺服器中已安裝且具工具能力的模型。此唯讀檢查絕不會下載
   模型。若已安裝 Gemini CLI、Antigravity、Pi 和 OpenCode，但無法
   作為引導式設定可重複使用的推論路徑，也會列出它們。
   Gemini 和 Antigravity 無法強制執行無工具探測；Pi 和 OpenCode
   是完整代理程式框架，而非設定用的推論路徑。
3. 使用實際完成回應測試第一個偵測到的候選項目。若失敗，顯示
   原因並繼續測試下一個可用候選項目。
4. 若已用盡偵測結果，請選擇 OpenAI、Anthropic、xAI (Grok)、Google 或
   OpenRouter，或選擇 **More…** 以查看其餘供應商。每個供應商的
   區域、方案，以及支援的瀏覽器、裝置、API 金鑰或權杖方式
   會顯示於第二層選單中，並以相同的實際完成回應進行測試。
   選擇 **Skip for now** 可結束流程而不啟動 OpenClaw。
5. 僅保存已驗證的模型路徑及其所需的任何認證資訊/外掛狀態。
   工作區和閘道設定保持不變。
6. 使用已驗證的模型啟動 OpenClaw，讓它設定工作區、
   閘道、頻道、代理程式、外掛，以及其餘選用設定。

在已設定的安裝環境中重新執行此命令時，會先測試目前的預設模型，使引導式流程同時成為驗證與修復流程。檢查失敗絕不會自動取代已設定的模型；初始設定會停止並詢問如何繼續。若稍後要新增非推論項目，請執行 `openclaw channels add` 或 `openclaw configure`；若要變更供應商或驗證路徑，請使用 `openclaw onboard`。

## 傳統精靈：QuickStart 與 Advanced

執行 `openclaw onboard --classic` 以開啟完整精靈。首先會要求在 **QuickStart**（預設值）與 **Advanced**（完整控制）之間選擇。傳入 `--flow quickstart` 或 `--flow advanced`（別名 `manual`）可選擇傳統流程並略過該提示。

<Tabs>
  <Tab title="QuickStart（預設值）">
    - 本機閘道，繫結至迴送位址
    - 預設工作區（或現有工作區）
    - 閘道連接埠 **18789**
    - 閘道驗證 **Token**（即使繫結至迴送位址也會自動產生）
    - 工具原則：新設定使用 `tools.profile: "coding"`（會保留現有的明確設定檔）
    - 私訊工作階段：初始設定會保留明確的 `session.dmScope`，否則不設定此值，因此 `"main"` 預設值會將所有頻道的直接訊息保留在代理程式持續運作的主要工作階段中——這是個人代理程式的預設值。對於共用或多使用者收件匣，請使用 `"per-channel-peer"`；當 `openclaw security audit` 偵測到多使用者私訊流量時，會建議進行隔離。詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開存取 **Off**
    - Telegram 和 WhatsApp 私訊預設為 **allowlist**：Telegram 會要求輸入數字形式的 Telegram 使用者 ID，WhatsApp 則會要求輸入電話號碼

  </Tab>
  <Tab title="Advanced（完整控制）">
    - 顯示所有步驟：模式、工作區、閘道、頻道、常駐程式、Skills

  </Tab>
</Tabs>

遠端模式（`--mode remote`）一律使用進階流程；它只會設定此機器以連線至其他位置的閘道，絕不會在遠端主機上安裝或變更任何內容。

## 傳統初始設定會設定的項目

本機模式（預設）會依序進行下列步驟：

1. **模型/驗證** - 選擇供應商驗證流程（API 金鑰、OAuth 或
   供應商專用的手動驗證），包括自訂供應商
   （OpenAI 相容、OpenAI Responses 相容、Anthropic 相容或
   未知自動偵測）。選擇預設模型。
   全新的 OpenAI API 金鑰設定預設使用 `openai/gpt-5.6`（不含修飾的直接 API
   ID 會解析為 Sol）；全新的 ChatGPT/Codex 設定預設使用
   `openai/gpt-5.6-sol`。重新執行設定會保留現有的明確模型，
   包括 `openai/gpt-5.5`。如果帳戶未提供 GPT-5.6，
   請明確選擇 `openai/gpt-5.5`。
   安全性注意事項：如果此代理程式將執行工具或處理網路鉤子/hook
   內容，請優先使用最新世代中可用的最強模型，並維持嚴格的
   工具原則——較弱或較舊的層級更容易受到提示注入攻擊。
   對於非互動式執行，`--secret-input-mode ref` 會儲存以環境變數為基礎的參照，
   而不是明文 API 金鑰值；參照的環境變數必須已設定，
   否則初始設定會立即失敗。互動式祕密參照模式可以指向
   環境變數或已設定的供應商參照（`file` 或
   `exec`），並在儲存前進行快速預先檢查。完成模型/驗證設定後，
   精靈會提供選用的即時完成回應測試；如果失敗，可以返回
   模型/驗證設定一次，或忽略失敗而不阻止傳統精靈的其餘步驟。
   忽略失敗不會解鎖 OpenClaw；對話式設定仍要求推論檢查通過。
2. **工作區** - 代理程式檔案的目錄（預設為 `~/.openclaw/workspace`）。植入啟動檔案。
3. **閘道** - 連接埠、繫結位址、驗證模式、Tailscale 公開存取。在
   互動式權杖模式中，選擇明文權杖儲存（預設），或選擇
   使用 SecretRef。非互動式 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **頻道** - 內建與官方外掛聊天頻道，包括
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **常駐程式** - 安裝 LaunchAgent (macOS)、systemd 使用者單元
   (Linux/WSL2)，或原生 Windows 排程工作，並提供每位使用者的
   啟動資料夾作為回退方式。
   如果需要權杖驗證且 `gateway.auth.token` 由 SecretRef 管理，
   常駐程式安裝會驗證它，但不會將解析後的權杖保存至
   監督程式服務的環境中繼資料；未解析的 SecretRef 會阻止
   安裝並提供指引。如果 `gateway.auth.token` 和
   `gateway.auth.password` 均已設定，而 `gateway.auth.mode` 未設定，
   安裝會遭到阻止，直到你明確設定模式為止。
6. **健康狀態檢查** - 啟動閘道並驗證其可連線。
7. **Skills** - 安裝建議的 Skills 及其選用相依套件。

<Note>
除非你明確選擇 **Reset**（或傳入 `--reset`），否則重新執行初始設定**不會**清除任何內容。命令列介面 `--reset` 預設會移除組態、認證資訊和工作階段；使用 `--reset-scope full` 還可移除工作區。如果組態無效或包含舊版鍵，初始設定會要求你先執行 `openclaw doctor`。
</Note>

`--flow import` 會在傳統精靈中執行偵測到的遷移流程（例如 Hermes），而非全新設定；請參閱[遷移](/zh-TW/cli/migrate)以及[安裝](/zh-TW/install/migrating-hermes)下的遷移指南。`openclaw onboard --modern` 是 [OpenClaw](/zh-TW/cli/openclaw) 的相容性別名。它使用與 `openclaw setup` 相同的推論閘門：已驗證的推論會啟動助理，而互動式失敗則會返回引導式推論設定。

## 新增另一個代理程式

使用 `openclaw agents add <name>` 建立具有獨立工作區、工作階段和驗證設定檔的代理程式。不使用 `--workspace` 執行時，會啟動名稱、工作區、驗證、頻道和繫結的互動式流程——這不是完整的 `openclaw onboard` 精靈。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區：`~/.openclaw/workspace-<agentId>`（若已設定
  `agents.defaults.workspace`，則位於其下）。
- 新增 `bindings`，將傳入訊息路由至此代理程式（初始設定可以替你完成）。
- 非互動式旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步行為和組態輸出，請參閱
[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動式範例，請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。
如需完整旗標參考，請參閱 [`openclaw onboard`](/zh-TW/cli/onboard)。

## 相關文件

- 命令列介面命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- 初始設定概覽：[初始設定概覽](/zh-TW/start/onboarding-overview)
- macOS 應用程式初始設定：[初始設定](/zh-TW/start/onboarding)
- 代理程式首次執行程序：[代理程式啟動設定](/zh-TW/start/bootstrapping)
