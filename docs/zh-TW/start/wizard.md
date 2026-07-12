---
read_when:
    - 執行或設定命令列介面引導流程
    - 設定新機器
sidebarTitle: 'Onboarding: CLI'
summary: 命令列介面初始設定：驗證推論，然後將其餘設定交給 Crestodian 處理
title: 初始設定（命令列介面）
x-i18n:
    generated_at: "2026-07-11T21:51:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

命令列介面引導設定是在 macOS、Linux 和 Windows（原生或 WSL2）上建議使用的終端機設定方式。預設情況下，它會偵測電腦上已有的 AI 存取方式、使用實際補全進行驗證，然後啟動 Crestodian，以設定工作區、閘道和選用功能。`openclaw setup` 會執行相同流程（[設定](/zh-TW/cli/setup)涵蓋僅設定組態的 `--baseline` 變體）。Windows 桌面使用者也可以從 [Windows Hub](/zh-TW/platforms/windows) 開始。

引導式初始設定會先建立推論能力。它會偵測可用的 AI 存取方式、要求完成一次實際補全，之後才會啟動 [Crestodian](/zh-TW/cli/crestodian) 來設定 OpenClaw 的其餘部分。引導式流程不提供推論前的 Crestodian，也不能略過 AI。

傳統精靈仍可用於供應商登入、遠端閘道設定、頻道配對、常駐程式控制、Skills 和匯入。請使用 `openclaw onboard --classic` 明確執行；引導式推論候選項目畫面不會將流程轉交給它。推論通過後，Crestodian 可以使用 `open channel wizard for <channel>`，將需要秘密資訊的頻道設定交給遮罩輸入的終端機精靈。若要變更模型供應商或其驗證方式，請退出 Crestodian 並執行 `openclaw onboard`；Crestodian 不會開啟引導式或傳統供應商流程。

<Info>
最快開始第一次聊天的方式：完成引導式設定、執行 `openclaw dashboard`，然後透過控制介面在瀏覽器中聊天。文件：[儀表板](/zh-TW/web/dashboard)。
</Info>

## 語系

精靈會將固定的初始設定文字本地化。解析順序為：`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`，最後是英文。支援的語系：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

無論語系為何，產品名稱、命令、組態鍵、URL、供應商 ID、模型 ID，以及外掛／頻道標籤都會維持英文。

若稍後要重新設定非推論相關設定：

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動模式。若用於指令碼，請使用 `--non-interactive`（請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)）。
</Note>

<Tip>
傳統精靈包含網頁搜尋步驟，你可以在其中選擇供應商：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily。部分供應商需要 API 金鑰，其他則不需要。稍後可使用 `openclaw configure --section web` 進行設定。文件：[網頁工具](/zh-TW/tools/web)。
</Tip>

## 預設引導式流程

直接執行 `openclaw onboard` 會依循以下流程：

1. 接受安全性通知。
2. 偵測已設定的模型、API 金鑰環境變數，以及受支援的本機 AI 命令列介面。
3. 使用實際補全測試第一個偵測到的候選項目。若失敗，顯示原因並繼續嘗試下一個可用候選項目。
4. 若已嘗試完所有偵測結果，則重試偵測到的候選項目，或在遮罩輸入提示中輸入供應商 API 金鑰。在推論正常運作之前，引導式初始設定不會提供 Crestodian，也不允許略過 AI 後退出。
5. 僅保存已驗證的模型路由，以及其所需的任何憑證／外掛狀態。工作區和閘道設定不會變更。
6. 使用已驗證的模型啟動 Crestodian，使其能設定工作區、閘道、頻道、代理程式、外掛，以及其餘選用設定。

在已設定的安裝環境中重新執行此命令時，會先測試目前的預設模型，使引導式流程成為驗證與修復程序。檢查失敗時絕不會自動取代已設定的模型；初始設定會停止並詢問如何繼續。若稍後要新增非推論項目，請執行 `openclaw channels add` 或 `openclaw configure`；若要變更供應商或驗證路由，請使用 `openclaw onboard`。

## 傳統精靈：快速開始與進階設定

執行 `openclaw onboard --classic` 以開啟完整精靈。精靈一開始會讓你選擇**快速開始**（使用預設值）或**進階設定**（完整控制）。傳入 `--flow quickstart` 或 `--flow advanced`（別名為 `manual`）可選擇傳統流程並略過該提示。

<Tabs>
  <Tab title="快速開始（預設值）">
    - 本機閘道，繫結至 local loopback
    - 預設工作區（或現有工作區）
    - 閘道連接埠 **18789**
    - 閘道驗證方式為**權杖**（即使在 local loopback 上也會自動產生）
    - 工具原則：新設定使用 `tools.profile: "coding"`（會保留現有的明確設定檔）
    - 私訊隔離：新設定使用 `session.dmScope: "per-channel-peer"`。詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開存取**關閉**
    - Telegram 和 WhatsApp 私訊預設使用**允許清單**：Telegram 會要求輸入數字格式的 Telegram 使用者 ID，WhatsApp 會要求輸入電話號碼

  </Tab>
  <Tab title="進階設定（完整控制）">
    - 顯示每個步驟：模式、工作區、閘道、頻道、常駐程式、Skills

  </Tab>
</Tabs>

遠端模式（`--mode remote`）一律使用進階流程；它只會設定此電腦，使其連線至其他位置的閘道，絕不會在遠端主機上安裝或變更任何內容。

## 傳統初始設定會設定哪些項目

本機模式（預設）會依序進行以下步驟：

1. **模型／驗證** - 選擇供應商驗證流程（API 金鑰、OAuth 或供應商專用的手動驗證），包括自訂供應商（相容於 OpenAI、相容於 OpenAI Responses、相容於 Anthropic，或未知類型自動偵測）。選擇預設模型。
   全新的 OpenAI API 金鑰設定預設使用 `openai/gpt-5.6`（不含前綴的直接 API ID 會解析為 Sol）；全新的 ChatGPT/Codex 設定預設使用 `openai/gpt-5.6-sol`。重新執行設定會保留現有的明確模型設定，包括 `openai/gpt-5.5`。如果帳戶未提供 GPT-5.6，請明確選擇 `openai/gpt-5.5`。
   安全性注意事項：如果此代理程式會執行工具或處理網路鉤子／掛鉤內容，請優先使用可用的最強新一代模型，並維持嚴格的工具原則；較弱或較舊的模型層級更容易遭受提示詞注入。
   對於非互動執行，`--secret-input-mode ref` 會儲存由環境變數支援的參照，而不是純文字 API 金鑰值；被參照的環境變數必須已經設定，否則初始設定會立即失敗。互動式秘密資訊參照模式可以指向環境變數或已設定的供應商參照（`file` 或 `exec`），並會在儲存前快速進行預檢。完成模型／驗證設定後，精靈會提供選用的即時補全測試；若失敗，可以返回模型／驗證設定一次，也可以忽略而不阻擋傳統精靈的其餘流程。忽略失敗不會解鎖 Crestodian；對話式設定仍需要通過推論檢查。
2. **工作區** - 代理程式檔案所在目錄（預設為 `~/.openclaw/workspace`）。建立初始啟動檔案。
3. **閘道** - 連接埠、繫結位址、驗證模式、Tailscale 公開存取。在互動式權杖模式中，可選擇純文字權杖儲存方式（預設），或改用 SecretRef。非互動式 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
4. **頻道** - 內建與官方外掛聊天頻道，包括 Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
5. **常駐程式** - 安裝 LaunchAgent（macOS）、systemd 使用者單元（Linux／WSL2），或原生 Windows 排程工作，並以每位使用者的啟動資料夾作為後備方案。
   如果需要權杖驗證，而且 `gateway.auth.token` 由 SecretRef 管理，常駐程式安裝程序會驗證它，但不會將解析後的權杖保存至監督服務的環境中繼資料；無法解析的 SecretRef 會阻止安裝並顯示處理指引。如果 `gateway.auth.token` 和 `gateway.auth.password` 都已設定，但 `gateway.auth.mode` 未設定，則安裝會被阻止，直到你明確設定模式。
6. **健康狀態檢查** - 啟動閘道並確認其可連線。
7. **Skills** - 安裝建議的 Skills 及其選用相依套件。

<Note>
除非你明確選擇**重設**（或傳入 `--reset`），否則重新執行初始設定**不會**清除任何內容。命令列介面的 `--reset` 預設會重設組態、憑證和工作階段；若也要移除工作區，請使用 `--reset-scope full`。如果組態無效或包含舊版組態鍵，初始設定會先要求你執行 `openclaw doctor`。
</Note>

`--flow import` 會在傳統精靈中執行偵測到的遷移流程（例如 Hermes），而不是進行全新設定；請參閱[遷移](/zh-TW/cli/migrate)及[安裝](/zh-TW/install/migrating-hermes)下的遷移指南。`openclaw onboard --modern` 是 [Crestodian](/zh-TW/cli/crestodian) 的相容性別名。它使用與 `openclaw crestodian` 相同的推論閘門：驗證推論成功後會啟動助理，而互動式驗證失敗時則會返回引導式推論設定。

## 新增另一個代理程式

使用 `openclaw agents add <name>` 建立獨立代理程式，使其擁有自己的工作區、工作階段和驗證設定檔。未指定 `--workspace` 執行時，會啟動名稱、工作區、驗證、頻道和繫結的互動式流程，而不是完整的 `openclaw onboard` 精靈。

它會設定：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項：

- 預設工作區：`~/.openclaw/workspace-<agentId>`（如果已設定 `agents.defaults.workspace`，則位於該路徑下）。
- 新增 `bindings`，將傳入訊息路由至此代理程式（初始設定可以替你完成）。
- 非互動式旗標：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完整參考

如需詳細的逐步行為和組態輸出，請參閱[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。
如需非互動式範例，請參閱[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。
如需完整旗標參考，請參閱 [`openclaw onboard`](/zh-TW/cli/onboard)。

## 相關文件

- 命令列介面命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
- 初始設定概覽：[初始設定概覽](/zh-TW/start/onboarding-overview)
- macOS 應用程式初始設定：[初始設定](/zh-TW/start/onboarding)
- 代理程式首次執行程序：[代理程式初始啟動](/zh-TW/start/bootstrapping)
