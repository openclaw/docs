---
read_when:
    - 你需要特定 `openclaw onboard` 步驟的詳細行為說明
    - 你正在偵錯新手引導結果或整合新手引導用戶端
sidebarTitle: CLI reference
summary: openclaw onboard 的逐步行為：每個步驟的作用、寫入的設定，以及內部運作方式
title: 命令列介面設定參考指南
x-i18n:
    generated_at: "2026-07-19T14:03:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0f8a8dd4a7a02ea36ca12a258f88d50fe6f3198f79637ea1495d263c59d92a13
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

此頁面涵蓋逐步導入的行為、輸出與內部機制。
如需逐步操作說明，請參閱[導入（命令列介面）](/zh-TW/start/wizard)。如需完整的命令列介面旗標
參考（每個 `--flag`、非互動式範例、供應商專用
命令），請參閱 [`openclaw onboard`](/zh-TW/cli/onboard)。

## 精靈的功能

本機模式（預設）會引導你完成：

- 模型與驗證設定（Anthropic、OpenAI Code 訂閱 OAuth、xAI、OpenCode、自訂端點，以及更多由供應商擁有的驗證流程）
- 工作區位置與啟動檔案
- 閘道設定（連接埠、繫結、驗證、Tailscale）
- 頻道與供應商（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp，以及其他內建或外掛頻道）
- 網頁搜尋供應商（選用）
- 常駐程式安裝（LaunchAgent、systemd 使用者單元，或原生 Windows Scheduled Task，並以 Startup 資料夾作為備援）
- 健康狀態檢查
- Skills 設定

遠端模式會設定此機器，使其連線至其他位置的閘道。此模式
不會在遠端主機上安裝或修改任何項目。

## 本機流程詳細資訊

<Steps>
  <Step title="偵測現有設定">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇**保留目前值**、**檢視並更新**或**設定前重設**。
    - 除非你明確選擇「重設」（或傳入 `--reset`），否則再次執行精靈不會清除任何項目。
    - 命令列介面 `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也會移除工作區。
    - 如果設定無效或包含舊版鍵值，精靈會停止，並要求你在繼續前執行 `openclaw doctor`。
    - 重設會將狀態移至垃圾桶（絕不直接刪除），並提供以下範圍：
      - 僅設定
      - 設定 + 認證資訊 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型與驗證">
    - 完整選項矩陣位於[驗證與模型選項](#auth-and-model-options)。

  </Step>
  <Step title="工作區">
    - 預設為 `~/.openclaw/workspace`（可設定）。
    - 植入首次執行啟動程序所需的工作區檔案。
    - 工作區配置：[代理程式工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="閘道">
    - 提示輸入連接埠、繫結、驗證模式與 Tailscale 公開設定。
    - 建議：即使使用回送位址，也請保持權杖驗證啟用，讓本機 WS 用戶端必須通過驗證。
    - 在權杖模式下，互動式設定提供：
      - **產生／儲存純文字權杖**（預設）
      - **使用 SecretRef**（選用）
    - 在密碼模式下，互動式設定也支援純文字或 SecretRef 儲存方式。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 導入程序的環境中必須有非空白的環境變數。
      - 無法與 `--gateway-token` 搭配使用。
    - 只有在你完全信任每個本機程序時，才能停用驗證。
    - 非回送位址繫結仍需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用的 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖
    - [Discord](/zh-TW/channels/discord)：機器人權杖
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子受眾
    - [Mattermost](/zh-TW/channels/mattermost)：機器人權杖 + 基底 URL
    - [Signal](/zh-TW/channels/signal)：選用的 `signal-cli` 安裝 + 帳戶設定
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages 資料庫存取權；閘道在非 Mac 主機上執行時，請使用 SSH 包裝程式
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
      - 精靈會嘗試執行 `loginctl enable-linger <user>`，讓閘道在登出後繼續執行。
      - 可能會提示使用 sudo（寫入 `/var/lib/systemd/linger`）；會先嘗試不使用 sudo。
    - 原生 Windows：優先使用 Scheduled Task
      - 如果建立工作遭拒，OpenClaw 會改用每位使用者的 Startup 資料夾登入項目，並立即啟動閘道。
      - Scheduled Tasks 仍為首選，因為它們能提供更完善的監督程式狀態。
    - 執行階段選擇：必須使用節點，因為 OpenClaw 的標準執行階段狀態儲存區使用 `node:sqlite`。

  </Step>
  <Step title="健康狀態檢查">
    - 啟動閘道（如有需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時閘道健康狀態探測加入狀態輸出，並在支援時包含頻道探測。

  </Step>
  <Step title="Skills">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇節點管理器：npm、pnpm 或 bun。
    - 當所需的安裝程式可用時，為受信任的內建 Skills 安裝選用
      相依套件。
    - 略過不可用的 Homebrew、uv 與 Go 安裝程式，然後將受影響的
      Skills 分組並提供手動設定指引。安裝缺少的
      必要元件後，請執行 `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 摘要與後續步驟，包括 iOS、Android 與 macOS 應用程式選項。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，精靈會列印控制介面的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少控制介面資產，精靈會嘗試建置；備援方式為 `pnpm ui:build`（自動安裝 UI 相依套件）。
</Note>

## 遠端模式詳細資訊

遠端模式會設定此機器，使其連線至其他位置的閘道。此模式
不會在遠端主機上安裝或修改任何項目。

你要設定的項目：

- 遠端閘道 URL（`ws://...` 或 `wss://...`）
- 權杖、密碼或不使用驗證，需與遠端閘道的設定相符

<Steps>
  <Step title="探索（選用）">
    如果 `dns-sd`（macOS）或 `avahi-browse`（Linux）可用，導入流程
    會先讓你搜尋 Bonjour/mDNS 閘道信標，再改用
    手動輸入 URL。若已設定，也會嘗試廣域 DNS-SD 探索。
    文件：[閘道探索](/zh-TW/gateway/discovery)、[Bonjour](/zh-TW/gateway/bonjour)。
  </Step>
  <Step title="連線方式">
    選取信標後，請選擇直接 WebSocket 或 SSH 通道：
    - **直接連線**：透過 `wss://` 連線，並提示你信任探索到的
      TLS 指紋（首次使用時信任並固定；只有在你接受時才會固定）。
    - **SSH 通道**：列印要先執行的 `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      命令，然後連線至本機通道端點。
  </Step>
  <Step title="驗證">
    選擇權杖（建議）、密碼或不使用驗證，然後可選擇將其
    儲存為 SecretRef，而非純文字。
  </Step>
</Steps>

<Note>
如果閘道僅限回送位址且無法探索，請手動使用 SSH 通道或 tailnet。
純文字 `ws://` 可用於回送位址、私有 IP 常值、`.local` 與 Tailnet `*.ts.net` URL；其他私有 DNS 名稱需要 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
</Note>

## 驗證與模型選項

如果供應商設定步驟在互動式導入期間失敗（例如在本機尚未登入時使用命令列介面重用選項），
精靈會顯示錯誤並返回供應商選擇器，而不會結束。明確執行
`--auth-choice` 時，仍會為了自動化而快速失敗。

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰">
    如果存在 `ANTHROPIC_API_KEY`，便會使用它；否則提示輸入金鑰，然後儲存供常駐程式使用。
  </Accordion>
  <Accordion title="Anthropic Claude 命令列介面">
    互動式導入／設定中的首選本機路徑；若有現有的 Claude 命令列介面登入，便會重複使用。
  </Accordion>
  <Accordion title="OpenAI Code 訂閱（OAuth）">
    瀏覽器流程；貼上 `code#state`。

    在沒有主要模型的全新設定中，透過 Codex 執行階段將 `agents.defaults.model` 設為
    `openai/gpt-5.6-sol`。

  </Accordion>
  <Accordion title="OpenAI Code 訂閱（裝置配對）">
    使用短效裝置代碼的瀏覽器配對流程。

    在沒有主要模型的全新設定中，透過 Codex 執行階段將 `agents.defaults.model` 設為
    `openai/gpt-5.6-sol`。

  </Accordion>
  <Accordion title="OpenAI API 金鑰">
    如果存在 `OPENAI_API_KEY`，便會使用它；否則提示輸入金鑰，然後將認證資訊儲存在驗證設定檔中。

    在沒有主要模型的全新設定中，將 `agents.defaults.model` 設為
    `openai/gpt-5.6`；未加修飾的直接 API 模型 ID 會解析至 Sol 層級。

    新增 OpenAI 或重新驗證時，會保留現有的明確主要
    模型，包括 `openai/gpt-5.5`。如果帳戶未提供 GPT-5.6，
    請明確選擇 `openai/gpt-5.5`；OpenClaw 不會在未告知的情況下將其降級。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    適用於符合資格的 SuperGrok 或 X Premium 帳號，透過瀏覽器登入。對多數使用者而言，這是
    建議的 xAI 使用方式。OpenClaw 會儲存產生的驗證
    設定檔，供 Grok 模型、Grok `web_search`、`x_search` 和 `code_execution` 使用。
  </Accordion>
  <Accordion title="xAI (Grok) 裝置代碼">
    使用簡短代碼而非 localhost
    回呼，透過瀏覽器登入，適合遠端環境。可從 SSH、Docker 或 VPS 主機使用此方式。
  </Accordion>
  <Accordion title="xAI (Grok) API 金鑰">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型提供者。若你想使用
    xAI Console API 金鑰，而非訂閱 OAuth，請使用此方式。
  </Accordion>
  <Accordion title="OpenCode">
    提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），並讓你選擇 Zen 或 Go 目錄（一組 API 金鑰可同時用於兩者）。
    設定網址：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 金鑰（通用）">
    為你儲存金鑰。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示輸入 `AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示輸入帳號 ID、閘道 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    系統會自動寫入設定。託管服務預設為 `MiniMax-M3`；API 金鑰設定使用
    `minimax/...`，OAuth 設定則使用 `minimax-portal/...`。
    更多詳細資訊：[MiniMax](/zh-TW/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    系統會針對中國或全球端點的 StepFun 標準方案或 Step Plan 自動寫入設定。
    標準方案目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    更多詳細資訊：[StepFun](/zh-TW/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 相容）">
    提示輸入 `SYNTHETIC_API_KEY`。
    更多詳細資訊：[Synthetic](/zh-TW/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（雲端與本機開放模型）">
    首先提示輸入 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 搭配 `https://ollama.com`。
    由主機支援的模式會提示輸入基礎 URL（預設為 `http://127.0.0.1:11434`）、探索可用模型並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入以使用雲端存取。
    更多詳細資訊：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 與 Kimi Coding">
    系統會自動寫入 Moonshot（Kimi K2）與 Kimi Coding 設定。
    更多詳細資訊：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="自訂提供者">
    適用於 OpenAI 相容、OpenAI Responses 相容及 Anthropic 相容的端點。

    互動式初始設定支援與其他提供者 API 金鑰流程相同的 API 金鑰儲存選項：
    - **立即貼上 API 金鑰**（純文字）
    - **使用秘密參照**（環境變數參照或已設定的提供者參照，並進行預檢驗證）

    初始設定會根據常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）推斷圖片支援，只有在模型名稱未知時才會詢問。

    非互動式旗標：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（選用；若未設定則退回使用 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（選用）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（選用；預設為 `openai`）
    - `--custom-image-input` / `--custom-text-input`（選用；覆寫推斷的模型輸入能力）

  </Accordion>
  <Accordion title="略過">
    不設定驗證。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項中選取預設模型，或手動輸入提供者與模型。
- 當初始設定從提供者驗證選項開始時，模型選擇器會自動優先顯示
  該提供者。對於 Volcengine 和 BytePlus，相同的偏好設定
  也會比對其程式設計方案變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果該偏好提供者篩選結果為空，選擇器會退回顯示
  完整目錄，而不會顯示沒有模型。
- 精靈會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。

認證資訊與設定檔路徑：

- 驗證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

認證資訊儲存模式：

- 初始設定的預設行為會將 API 金鑰以純文字值持久儲存在驗證設定檔中。
- `--secret-input-mode ref` 會啟用參照模式，取代純文字金鑰儲存。
  在互動式設定中，你可以選擇：
  - 環境變數參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的提供者參照（`file` 或 `exec`），搭配提供者別名 + ID
- 互動式參照模式會在儲存前執行快速預檢驗證。
  - 環境變數參照：驗證目前初始設定環境中的變數名稱及非空值。
  - 提供者參照：驗證提供者設定並解析要求的 ID。
  - 如果預檢失敗，初始設定會顯示錯誤並讓你重試。
- 在非互動式模式中，`--secret-input-mode ref` 僅由環境變數支援。
  - 在初始設定程序環境中設定提供者環境變數。
  - 行內金鑰旗標（例如 `--openai-api-key`）要求必須設定該環境變數；否則初始設定會快速失敗。
  - 對於自訂提供者，非互動式 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在該自訂提供者情況下，`--custom-api-key` 要求必須設定 `CUSTOM_API_KEY`；否則初始設定會快速失敗。
- 閘道驗證認證資訊在互動式設定中支援純文字與 SecretRef 選項：
  - 權杖模式：**產生／儲存純文字權杖**（預設）或**使用 SecretRef**。
  - 密碼模式：純文字或 SecretRef。
- 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 現有的純文字設定會繼續運作，不受影響。

<Note>
無介面與伺服器提示：在有瀏覽器的機器上完成 OAuth，然後將
該代理程式的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或對應的
`$OPENCLAW_STATE_DIR/...` 路徑）複製到閘道主機。`credentials/oauth.json`
僅為舊版匯入來源。
</Note>

## 輸出與內部機制

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（若選擇 Minimax）
- `tools.profile`（未設定時，本機初始設定預設為 `"coding"`；保留現有的明確值）
- `gateway.*`（模式、繫結、驗證、Tailscale）
- `session.dmScope`（初始設定會保留明確值，否則維持未設定，因此 `main` 預設值會將跨頻道的所有私人訊息保留在代理程式持續輪替的主要工作階段中——這是個人代理程式的預設值。對於共用或多使用者收件匣，請使用 `per-channel-peer`；`openclaw security audit` 在偵測到多使用者私人訊息流量時會建議隔離）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 在提示期間選擇加入時設定頻道允許清單（Discord、iMessage、Signal、Slack、Telegram、WhatsApp）；Discord 和 Slack 也會將輸入的名稱解析為 ID
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 之後仍可透過手動設定來設定 `skills.install.nodeManager: "yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 認證資訊會存放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
使用中的工作階段與文字記錄儲存在
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。`~/.openclaw/agents/<agentId>/sessions/`
目錄用於舊版移轉輸入，以及封存／支援成品。

<Note>
部分頻道以外掛形式提供。在設定期間選取時，精靈會先提示安裝外掛（npm 或本機路徑），再進行頻道設定。
</Note>

### 已安裝應用程式建議

模型存取檢查成功後，macOS 上的傳統互動式初始設定會掃描應用程式名稱與套件 ID，而不要求 macOS 隱私權權限。它會搜尋官方外掛目錄和 ClawHub，然後要求已設定的模型排除錯誤的名稱比對，並建議相關的外掛或 Skills。建議的相符項目預設會被選取；選用的相符項目則需要明確選取。

結果畫面會列出偵測到的應用程式，並顯示：“應用程式名稱已使用你設定的模型與 ClawHub 搜尋進行比對。”將 `wizard.appRecommendations` 設為 `false`，即可停用此初始設定步驟以及閘道對節點應用程式清單的存取。快速入門或非 macOS 初始設定不會使用此掃描。

## 非互動式設定

`--non-interactive` 需要 `--accept-risk`（確認代理程式功能強大，授予完整系統存取權限存在風險）：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

完整旗標參考與提供者特定範例：[`openclaw onboard`](/zh-TW/cli/onboard)、[命令列介面自動化](/zh-TW/start/wizard-cli-automation)。

## 閘道精靈 RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

用戶端（macOS 應用程式與 Control UI）無須重新實作初始設定邏輯，即可呈現各步驟。

## Signal 設定行為

- 從官方 `signal-cli` GitHub 發行版本下載適當的發行資產（原生組建，僅限 Linux x86-64）
- 在其他平台（macOS、非 x64 Linux）上，改透過 Homebrew 安裝
- 將發行資產安裝內容儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在設定中寫入 `channels.signal.cliPath`
- 尚不支援原生 Windows；請在 WSL2 內執行初始設定，以取得 Linux 安裝路徑

## 相關文件

- 初始設定中心：[初始設定（命令列介面）](/zh-TW/start/wizard)
- 自動化與指令碼：[命令列介面自動化](/zh-TW/start/wizard-cli-automation)
- 命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
