---
read_when:
    - 你需要瞭解特定 `openclaw onboard` 步驟的詳細行為
    - 你正在偵錯新手引導結果或整合新手引導用戶端
sidebarTitle: CLI reference
summary: openclaw onboard 的逐步行為：每個步驟的作用、寫入的設定及其內部機制
title: 命令列介面設定參考資料
x-i18n:
    generated_at: "2026-07-12T14:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56b318b3c5fbaeb37e99871e10b35eae38b209f3a2f683ff85816aca87a4ee6e
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

本頁涵蓋逐步的新手引導行為、輸出與內部機制。
如需操作指南，請參閱[新手引導（命令列介面）](/zh-TW/start/wizard)。如需完整的命令列介面旗標
參考資料（每個 `--flag`、非互動式範例、供應商專屬
命令），請參閱 [`openclaw onboard`](/zh-TW/cli/onboard)。

## 精靈的功能

本機模式（預設）會引導你完成：

- 模型與驗證設定（Anthropic、OpenAI Code 訂閱 OAuth、xAI、OpenCode、自訂端點，以及更多由供應商管理的驗證流程）
- 工作區位置與啟動檔案
- 閘道設定（連接埠、繫結、驗證、Tailscale）
- 頻道與供應商（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp，以及其他隨附或外掛頻道）
- 網頁搜尋供應商（選用）
- 常駐程式安裝（LaunchAgent、systemd 使用者單元，或原生 Windows 排程工作；失敗時改用「啟動」資料夾）
- 健康狀態檢查
- Skills 設定

遠端模式會設定此機器，使其連線至其他位置的閘道。它不會
在遠端主機上安裝或修改任何內容。

## 本機流程詳細資訊

<Steps>
  <Step title="偵測現有設定">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇**保留目前值**、**檢閱並更新**或**設定前重設**。
    - 除非你明確選擇「重設」（或傳入 `--reset`），否則重新執行精靈不會清除任何內容。
    - 命令列介面的 `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也可移除工作區。
    - 如果設定無效或包含舊版鍵值，精靈會停止，並要求你先執行 `openclaw doctor` 再繼續。
    - 重設會將狀態移至垃圾桶（絕不直接刪除），並提供以下範圍：
      - 僅設定
      - 設定 + 認證資訊 + 工作階段
      - 完全重設（也會移除工作區）

  </Step>
  <Step title="模型與驗證">
    - 完整的選項矩陣請參閱[驗證與模型選項](#auth-and-model-options)。

  </Step>
  <Step title="工作區">
    - 預設為 `~/.openclaw/workspace`（可設定）。
    - 建立首次執行啟動程序所需的工作區檔案。
    - 工作區配置：[代理程式工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="閘道">
    - 提示你設定連接埠、繫結、驗證模式與 Tailscale 公開方式。
    - 建議：即使使用回送介面，也應保持啟用權杖驗證，讓本機 WS 用戶端必須通過驗證。
    - 在權杖模式下，互動式設定提供：
      - **產生／儲存純文字權杖**（預設）
      - **使用 SecretRef**（選用）
    - 在密碼模式下，互動式設定也支援純文字或 SecretRef 儲存方式。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 新手引導程序的環境中必須有非空白的環境變數。
      - 無法與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時，才停用驗證。
    - 非回送介面的繫結仍然需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用的 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖
    - [Discord](/zh-TW/channels/discord)：機器人權杖
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子受眾
    - [Mattermost](/zh-TW/channels/mattermost)：機器人權杖 + 基底 URL
    - [Signal](/zh-TW/channels/signal)：選用的 `signal-cli` 安裝 + 帳戶設定
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages 資料庫存取權；當閘道在 Mac 以外的機器上執行時，請使用 SSH 包裝程式
    - 私訊安全性：預設為配對。第一則私訊會傳送代碼；請透過
      `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。
  </Step>
  <Step title="網頁搜尋">
    - 選擇供應商（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）或略過。
    - 使用 `--skip-search` 略過此步驟；之後可使用 `openclaw configure --section web` 重新設定。

  </Step>
  <Step title="安裝常駐程式">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux 與透過 WSL2 執行的 Windows：systemd 使用者單元
      - 精靈會嘗試執行 `loginctl enable-linger <user>`，讓閘道在登出後仍持續運作。
      - 可能會提示輸入 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排程工作
      - 如果建立工作遭到拒絕，OpenClaw 會改用每位使用者的「啟動」資料夾登入項目，並立即啟動閘道。
      - 排程工作仍是首選，因為它們能提供更完善的監督程式狀態。
    - 執行階段選擇：互動模式僅提供節點。Bun 可能在 WhatsApp/Telegram 重新連線時損毀記憶體，且不支援作為這些頻道的常駐程式執行階段；只有在不採用此組合時，才可傳入 `--daemon-runtime bun`。

  </Step>
  <Step title="健康狀態檢查">
    - 啟動閘道（如有需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時閘道健康狀態探測新增至狀態輸出，包括受支援頻道的探測。

  </Step>
  <Step title="Skills">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇節點管理工具：npm、pnpm 或 bun。
    - 當所需的安裝程式可用時，為受信任的隨附 Skills 安裝選用
      相依套件。
    - 略過不可用的 Homebrew、uv 與 Go 安裝程式，接著將受影響的
      Skills 分組並提供手動設定指引。安裝缺少的必要元件後，請執行
      `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 摘要與後續步驟，包括 iOS、Android 與 macOS 應用程式選項。

  </Step>
</Steps>

<Note>
如果未偵測到圖形使用者介面，精靈會顯示用於控制介面的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少控制介面資產，精靈會嘗試建置它們；備援方式為 `pnpm ui:build`（會自動安裝 UI 相依套件）。
</Note>

## 遠端模式詳細資訊

遠端模式會設定此機器連線到其他位置的閘道。它不會在遠端主機上安裝或修改任何項目。

你需要設定：

- 遠端閘道 URL（`ws://...` 或 `wss://...`）
- 權杖、密碼或不使用驗證，須與遠端閘道的設定相符

<Steps>
  <Step title="探索（選用）">
    如果 `dns-sd`（macOS）或 `avahi-browse`（Linux）可用，新手設定會先提供搜尋 Bonjour/mDNS 閘道信標的選項，再改為手動輸入 URL。若已設定，也會嘗試進行廣域 DNS-SD 探索。文件：[閘道探索](/zh-TW/gateway/discovery)、[Bonjour](/zh-TW/gateway/bonjour)。
  </Step>
  <Step title="連線方式">
    選取信標後，請選擇直接 WebSocket 或 SSH 通道：
    - **直接連線**：透過 `wss://` 連線，並提示你信任探索到的 TLS 指紋（首次使用時信任並固定；僅在你接受後才會固定）。
    - **SSH 通道**：顯示要先執行的 `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>` 命令，接著連線至本機通道端點。

  </Step>
  <Step title="驗證">
    選擇權杖（建議）、密碼或不使用驗證，然後可以選擇將其儲存為 SecretRef，而非純文字。
  </Step>
</Steps>

<Note>
如果閘道僅限回送介面且無法探索，請手動使用 SSH 通道或 tailnet。
純文字 `ws://` 可用於回送位址、私有 IP 常值、`.local` 和 Tailnet `*.ts.net` URL；其他私有 DNS 名稱需要設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
</Note>

## 驗證與模型選項

如果供應商設定步驟在互動式新手設定中失敗（例如選擇重複使用命令列介面，但本機尚未登入），精靈會顯示錯誤並返回供應商選擇器，而不是結束。明確指定 `--auth-choice` 的執行仍會快速失敗，以便用於自動化。

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰">
    如果存在 `ANTHROPIC_API_KEY`，則使用該值，否則提示輸入金鑰，接著儲存供常駐程式使用。
  </Accordion>
  <Accordion title="Anthropic Claude 命令列介面">
    互動式新手設定／設定中的首選本機路徑；可用時會重複使用現有的 Claude 命令列介面登入。
  </Accordion>
  <Accordion title="OpenAI Code 訂閱（OAuth）">
    瀏覽器流程；貼上 `code#state`。

    在全新設定且沒有主要模型時，會透過 Codex 執行環境將 `agents.defaults.model` 設為
    `openai/gpt-5.6-sol`。

  </Accordion>
  <Accordion title="OpenAI Code 訂閱（裝置配對）">
    使用短效裝置代碼的瀏覽器配對流程。

    在全新設定且沒有主要模型時，會透過 Codex 執行環境將 `agents.defaults.model` 設為
    `openai/gpt-5.6-sol`。

  </Accordion>
  <Accordion title="OpenAI API 金鑰">
    如果存在 `OPENAI_API_KEY`，則使用該值，否則提示輸入金鑰，接著將認證資訊儲存在驗證設定檔中。

    在全新設定且沒有主要模型時，會將 `agents.defaults.model` 設為
    `openai/gpt-5.6`；不含前綴的直接 API 模型 ID 會解析為 Sol 層級。

    新增或重新驗證 OpenAI 時，會保留現有且明確指定的主要模型，包括
    `openai/gpt-5.5`。如果帳戶未提供 GPT-5.6，請明確選取 `openai/gpt-5.5`；OpenClaw 不會在未告知的情況下將其降級。

  </Accordion>
  <Accordion title="xAI（Grok）OAuth">
    適用於符合資格的 SuperGrok 或 X Premium 帳戶的瀏覽器登入。對大多數使用者而言，這是建議的 xAI 方式。OpenClaw 會儲存產生的驗證設定檔，供 Grok 模型以及 Grok `web_search`、`x_search` 和 `code_execution` 使用。
  </Accordion>
  <Accordion title="xAI（Grok）裝置代碼">
    適合遠端環境的瀏覽器登入，使用短代碼而非 localhost 回呼。請從 SSH、Docker 或 VPS 主機使用此方式。
  </Accordion>
  <Accordion title="xAI（Grok）API 金鑰">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型供應商。當你想使用 xAI Console API 金鑰，而非訂閱 OAuth 時，請使用此方式。
  </Accordion>
  <Accordion title="OpenCode">
    提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），並讓你選擇 Zen 或 Go 目錄（一個 API 金鑰可同時涵蓋兩者）。
    設定 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 金鑰（通用）">
    為你儲存金鑰。
  </Accordion>
  <Accordion title="Vercel AI 閘道">
    提示輸入 `AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Vercel AI 閘道](/zh-TW/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI 閘道">
    提示輸入帳戶 ID、閘道 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Cloudflare AI 閘道](/zh-TW/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    系統會自動寫入設定。託管服務的預設值為 `MiniMax-M3`；API 金鑰設定使用 `minimax/...`，OAuth 設定則使用 `minimax-portal/...`。
    更多詳細資訊：[MiniMax](/zh-TW/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    系統會自動寫入 StepFun 標準方案或 Step Plan 的設定，適用於中國或全球端點。
    標準方案目前包含 `step-3.5-flash`，Step Plan 另包含 `step-3.5-flash-2603`。
    更多詳細資訊：[StepFun](/zh-TW/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（與 Anthropic 相容）">
    提示輸入 `SYNTHETIC_API_KEY`。
    更多詳細資訊：[Synthetic](/zh-TW/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（雲端與本機開放模型）">
    首先提示選擇 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 會搭配 `https://ollama.com` 使用 `OLLAMA_API_KEY`。
    由主機支援的模式會提示輸入基礎 URL（預設為 `http://127.0.0.1:11434`）、探索可用模型並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入以存取雲端。
    更多詳細資訊：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 與 Kimi Coding">
    系統會自動寫入 Moonshot（Kimi K2）和 Kimi Coding 設定。
    更多詳細資訊：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="自訂供應商">
    適用於與 OpenAI、OpenAI Responses 及 Anthropic 相容的端點。

    互動式初始設定支援與其他供應商 API 金鑰流程相同的 API 金鑰儲存選項：
    - **立即貼上 API 金鑰**（純文字）
    - **使用祕密參照**（環境變數參照或已設定的供應商參照，並進行預檢驗證）

    初始設定會針對常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）推斷圖片支援能力，只有在模型名稱未知時才會詢問。

    非互動式旗標：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（選用；若未提供則改用 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（選用）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（選用；預設為 `openai`）
    - `--custom-image-input` / `--custom-text-input`（選用；覆寫推斷出的模型輸入能力）

  </Accordion>
  <Accordion title="略過">
    保持驗證未設定。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項中挑選預設模型，或手動輸入供應商與模型。
- 當初始設定從供應商驗證選項開始時，模型選擇器會自動優先顯示
  該供應商。對於 Volcengine 和 BytePlus，相同的偏好設定
  也會比對其程式設計方案變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果套用該偏好供應商篩選條件後沒有任何結果，選擇器會改用
  完整目錄，而不會顯示沒有任何模型。
- 精靈會執行模型檢查，若已設定的模型未知或缺少驗證，便會發出警告。

認證資訊與設定檔路徑：

- 驗證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

認證資訊儲存模式：

- 預設的初始設定行為會將 API 金鑰以純文字值形式持久儲存在驗證設定檔中。
- `--secret-input-mode ref` 會啟用參照模式，而非以純文字儲存金鑰。
  在互動式設定中，你可以選擇：
  - 環境變數參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的提供者參照（`file` 或 `exec`），搭配提供者別名 + ID
- 互動式參照模式會在儲存前執行快速的預檢驗證。
  - 環境變數參照：驗證目前初始設定環境中的變數名稱 + 非空值。
  - 提供者參照：驗證提供者設定，並解析所要求的 ID。
  - 如果預檢失敗，初始設定會顯示錯誤並讓你重試。
- 在非互動模式中，`--secret-input-mode ref` 僅支援由環境變數提供。
  - 在初始設定程序的環境中設定提供者環境變數。
  - 內嵌金鑰旗標（例如 `--openai-api-key`）要求必須設定該環境變數；否則初始設定會立即失敗。
  - 對於自訂提供者，非互動式 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在此自訂提供者情況下，`--custom-api-key` 要求必須設定 `CUSTOM_API_KEY`；否則初始設定會立即失敗。
- 閘道驗證認證資訊在互動式設定中支援純文字和 SecretRef 選項：
  - 權杖模式：**產生／儲存純文字權杖**（預設）或 **使用 SecretRef**。
  - 密碼模式：純文字或 SecretRef。
- 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 現有的純文字設定可繼續運作，無須變更。

<Note>
無頭與伺服器提示：請在配有瀏覽器的機器上完成 OAuth，然後將該代理程式的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
`$OPENCLAW_STATE_DIR/...` 路徑）複製到閘道主機。`credentials/oauth.json`
僅是舊版匯入來源。
</Note>

## 輸出與內部資訊

`~/.openclaw/openclaw.json` 中的常見欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（未設定時，本機初始設定預設為 `"coding"`；既有的明確值會予以保留）
- `gateway.*`（模式、繫結、驗證、Tailscale）
- `session.dmScope`（未設定時，本機初始設定會將此項預設為 `per-channel-peer`；既有的明確值會予以保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 當你在提示中選擇加入時的頻道允許清單（Discord、iMessage、Signal、Slack、Telegram、WhatsApp）；Discord 和 Slack 也會將輸入的名稱解析為 ID
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 之後仍可透過手動設定將 `skills.install.nodeManager: "yarn"` 設為指定值。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 會寫入 `agents.list[]` 與選用的 `bindings`。

WhatsApp 認證資訊位於 `~/.openclaw/credentials/whatsapp/<accountId>/`。
作用中的工作階段與逐字記錄儲存在
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。 
`~/.openclaw/agents/<agentId>/sessions/` 目錄用於舊版遷移
輸入以及封存／支援成品。

<Note>
部分頻道會以外掛形式提供。在設定期間選取這些頻道時，精靈會先
提示安裝外掛（npm 或本機路徑），再進行頻道設定。
</Note>

## 非互動式設定

`--non-interactive` 需要搭配 `--accept-risk`（確認代理程式功能
強大，且完整系統存取權限具有風險）：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

完整旗標參考與供應商特定範例：[`openclaw onboard`](/zh-TW/cli/onboard)、[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。

## 閘道精靈 RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

用戶端（macOS 應用程式與控制介面）無須重新實作初始設定邏輯，即可呈現各個步驟。

## Signal 設定行為

- 從官方 `signal-cli` GitHub 發行版本下載適當的發行資產（原生建置，僅限 Linux x86-64）
- 在其他平台（macOS、非 x64 Linux）上，則改透過 Homebrew 安裝
- 將發行資產安裝內容儲存在 `~/.openclaw/tools/signal-cli/<version>/`
- 將 `channels.signal.cliPath` 寫入設定
- 目前尚不支援原生 Windows；請在 WSL2 內執行初始設定，以取得 Linux 安裝路徑

## 相關文件

- 初始設定中心：[初始設定（命令列介面）](/zh-TW/start/wizard)
- 自動化與指令碼：[命令列介面自動化](/zh-TW/start/wizard-cli-automation)
- 指令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
