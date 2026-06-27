---
read_when:
    - 你需要 openclaw onboard 的詳細行為
    - 你正在偵錯上手流程結果，或整合上手流程用戶端
sidebarTitle: CLI reference
summary: 命令列介面設定流程、驗證/模型設定、輸出與內部機制的完整參考
title: 命令列介面設定參考
x-i18n:
    generated_at: "2026-06-27T20:04:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

本頁是 `openclaw onboard` 的完整參考。
簡短指南請參閱[入門設定（命令列介面）](/zh-TW/start/wizard)。

## 精靈會做什麼

本機模式（預設）會引導你完成：

- 模型與認證設定（OpenAI Code 訂閱 OAuth、Anthropic Claude 命令列介面或 API 金鑰，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 與 AI Gateway 選項）
- 工作區位置與啟動檔案
- 閘道設定（連接埠、繫結、認證、Tailscale）
- 頻道與提供者（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage，以及其他內建頻道外掛）
- 常駐程式安裝（LaunchAgent、systemd 使用者單元，或原生 Windows 排程工作，並以啟動資料夾作為備援）
- 健康檢查
- Skills 設定

遠端模式會將這台機器設定為連線到其他位置的閘道。
它不會在遠端主機上安裝或修改任何內容。

## 本機流程詳細資訊

<Steps>
  <Step title="現有設定偵測">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇保留、修改或重設。
    - 重新執行精靈不會清除任何內容，除非你明確選擇重設（或傳入 `--reset`）。
    - 命令列介面 `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也會移除工作區。
    - 如果設定無效或包含舊版鍵，精靈會停止並要求你先執行 `openclaw doctor` 再繼續。
    - 重設會使用 `trash`，並提供範圍：
      - 僅設定
      - 設定 + 憑證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型與認證">
    - 完整選項矩陣位於[認證與模型選項](#auth-and-model-options)。

  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 植入首次執行啟動儀式所需的工作區檔案。
    - 工作區版面配置：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="閘道">
    - 提示設定連接埠、繫結、認證模式與 Tailscale 暴露。
    - 建議：即使是 loopback，也保持啟用權杖認證，讓本機 WS 用戶端必須通過認證。
    - 在權杖模式中，互動式設定提供：
      - **產生/儲存純文字權杖**（預設）
      - **使用 SecretRef**（選用）
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求入門設定程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時，才停用認證。
    - 非 loopback 繫結仍然需要認證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：Bot 權杖
    - [Discord](/zh-TW/channels/discord)：Bot 權杖
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子受眾
    - [Mattermost](/zh-TW/channels/mattermost)：Bot 權杖 + 基底 URL
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages DB 存取；當閘道在 Mac 以外執行時，請使用 SSH 包裝器
    - DM 安全性：預設為配對。第一則 DM 會傳送代碼；透過
      `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。
  </Step>
  <Step title="常駐程式安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux 和透過 WSL2 的 Windows：systemd 使用者單元
      - 精靈會嘗試 `loginctl enable-linger <user>`，讓閘道在登出後保持運作。
      - 可能提示 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排程工作
      - 如果工作建立遭拒，OpenClaw 會退回到每位使用者啟動資料夾的登入項目，並立即啟動閘道。
      - 排程工作仍為首選，因為它們提供更好的監督器狀態。
    - 執行環境選擇：節點（建議；WhatsApp 和 Telegram 必需）。不建議使用 Bun。

  </Step>
  <Step title="健康檢查">
    - 啟動閘道（如需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時閘道健康探測加入狀態輸出，支援時也包含頻道探測。

  </Step>
  <Step title="Skills">
    - 讀取可用 Skills 並檢查需求。
    - 讓你選擇節點管理器：npm、pnpm 或 bun。
    - 安裝選用相依項（有些在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要與後續步驟，包含 iOS、Android 和 macOS App 選項。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，精靈會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果 Control UI 資產缺失，精靈會嘗試建置它們；備援為 `pnpm ui:build`（自動安裝 UI 相依項）。
</Note>

## 遠端模式詳細資訊

遠端模式會將這台機器設定為連線到其他位置的閘道。

<Info>
遠端模式不會在遠端主機上安裝或修改任何內容。
</Info>

你要設定的項目：

- 遠端閘道 URL（`ws://...`）
- 如果遠端閘道需要認證，設定權杖（建議）

<Note>
- 如果閘道僅限 loopback，請使用 SSH 通道或 tailnet。
- 探索提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）

</Note>

## 認證與模型選項

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰">
    如果存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供常駐程式使用。
  </Accordion>
  <Accordion title="OpenAI Code 訂閱（OAuth）">
    瀏覽器流程；貼上 `code#state`。

    當模型未設定或已屬於 OpenAI 系列時，會透過 Codex 執行環境將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code 訂閱（裝置配對）">
    使用短期裝置代碼的瀏覽器配對流程。

    當模型未設定或已屬於 OpenAI 系列時，會透過 Codex 執行環境將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API 金鑰">
    如果存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將憑證儲存在認證設定檔中。

    當模型未設定、為 `openai/*`，或為舊版 Codex 模型參照時，會將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI（Grok）OAuth">
    為符合資格的 SuperGrok 或 X Premium 帳戶進行瀏覽器登入。這是多數使用者建議的 xAI 路徑。OpenClaw 會儲存產生的 Grok 模型認證設定檔，以及 Grok `web_search`、`x_search` 和 `code_execution`。
  </Accordion>
  <Accordion title="xAI（Grok）裝置代碼">
    使用短代碼而非 localhost 回呼的遠端友善瀏覽器登入。可從 SSH、Docker 或 VPS 主機使用此方式。
  </Accordion>
  <Accordion title="xAI（Grok）API 金鑰">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型提供者。當你想使用 xAI Console API 金鑰而非訂閱 OAuth 時使用此方式。
  </Accordion>
  <Accordion title="OpenCode">
    提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），並讓你選擇 Zen 或 Go 目錄。
    設定 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 金鑰（通用）">
    為你儲存金鑰。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示輸入 `AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示輸入帳戶 ID、閘道 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定會自動寫入。託管預設為 `MiniMax-M3`；API 金鑰設定使用
    `minimax/...`，OAuth 設定使用 `minimax-portal/...`。
    更多詳細資訊：[MiniMax](/zh-TW/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    設定會自動寫入 StepFun standard 或 Step Plan，適用於中國或全球端點。
    Standard 目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    更多詳細資訊：[StepFun](/zh-TW/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 相容）">
    提示輸入 `SYNTHETIC_API_KEY`。
    更多詳細資訊：[Synthetic](/zh-TW/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（雲端與本機開放模型）">
    先提示選擇 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 與 `https://ollama.com`。
    主機支援模式會提示輸入基底 URL（預設 `http://127.0.0.1:11434`）、探索可用模型，並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取。
    更多詳細資訊：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 設定會自動寫入。
    更多詳細資訊：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="自訂提供者">
    可搭配 OpenAI 相容與 Anthropic 相容端點使用。

    互動式入門設定支援與其他提供者 API 金鑰流程相同的 API 金鑰儲存選擇：
    - **立即貼上 API 金鑰**（純文字）
    - **使用祕密參照**（環境參照或已設定的提供者參照，並含預檢驗證）

    非互動式旗標：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（選用；退回使用 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（選用）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（選用；預設 `openai`）
    - `--custom-image-input` / `--custom-text-input`（選用；覆寫推斷出的模型輸入能力）

  </Accordion>
  <Accordion title="略過">
    保持認證未設定。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項中挑選預設模型，或手動輸入提供者與模型。
- 自訂提供者入門設定會為常見模型 ID 推斷影像支援，且只在模型名稱未知時詢問。
- 當入門設定從提供者認證選項開始時，模型選擇器會自動偏好
  該提供者。對於 Volcengine 和 BytePlus，相同偏好
  也會符合它們的 coding-plan 變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果該偏好提供者篩選會變成空的，選擇器會退回到
  完整目錄，而不是顯示沒有模型。
- 精靈會執行模型檢查，並在已設定模型未知或缺少認證時警告。

憑證與設定檔路徑：

- 認證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

憑證儲存模式：

- 預設初始設定行為會將 API 金鑰以明文值持久儲存在驗證設定檔中。
- `--secret-input-mode ref` 會啟用參照模式，而不是明文金鑰儲存。
  在互動式設定中，你可以選擇：
  - 環境變數參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的提供者參照（`file` 或 `exec`），搭配提供者別名 + ID
- 互動式參照模式會在儲存前執行快速預檢驗證。
  - 環境變數參照：驗證目前初始設定環境中的變數名稱 + 非空值。
  - 提供者參照：驗證提供者設定並解析要求的 ID。
  - 如果預檢失敗，初始設定會顯示錯誤並讓你重試。
- 在非互動式模式中，`--secret-input-mode ref` 僅由環境變數支援。
  - 在初始設定程序環境中設定提供者環境變數。
  - 內嵌金鑰旗標（例如 `--openai-api-key`）要求必須設定該環境變數；否則初始設定會快速失敗。
  - 對於自訂提供者，非互動式 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在該自訂提供者情況下，`--custom-api-key` 要求必須設定 `CUSTOM_API_KEY`；否則初始設定會快速失敗。
- 閘道驗證憑證在互動式設定中支援明文和 SecretRef 選項：
  - Token 模式：**產生/儲存明文 token**（預設）或 **使用 SecretRef**。
  - 密碼模式：明文或 SecretRef。
- 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 現有明文設定會繼續維持不變。

<Note>
無介面與伺服器提示：在有瀏覽器的機器上完成 OAuth，然後將該代理程式的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
`$OPENCLAW_STATE_DIR/...` 路徑）複製到閘道主機。`credentials/oauth.json`
僅是舊版匯入來源。
</Note>

## 輸出與內部細節

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（本機初始設定在未設定時預設為 `"coding"`；會保留現有明確值）
- `gateway.*`（模式、綁定、驗證、tailscale）
- `session.dmScope`（本機初始設定在未設定時會將此預設為 `per-channel-peer`；會保留現有明確值）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 在提示期間選擇加入時的頻道允許清單（Slack、Discord、Matrix、Microsoft Teams）（可行時會將名稱解析為 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定之後仍可設定 `skills.install.nodeManager: "yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 憑證會放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 底下。
工作階段會儲存在 `~/.openclaw/agents/<agentId>/sessions/` 底下。

<Note>
部分頻道以外掛形式交付。在設定期間選取時，精靈會在頻道設定前提示安裝外掛（npm 或本機路徑）。
</Note>

閘道精靈 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

用戶端（macOS app 和控制介面）可以呈現步驟，而不必重新實作初始設定邏輯。

Signal 設定行為：

- 下載適當的發行版本資產
- 將其儲存在 `~/.openclaw/tools/signal-cli/<version>/` 底下
- 在設定中寫入 `channels.signal.cliPath`
- JVM 建置需要 Java 21
- 可用時會使用原生建置
- Windows 使用 WSL2，並在 WSL 內遵循 Linux signal-cli 流程

## 相關文件

- 初始設定中心：[初始設定（命令列介面）](/zh-TW/start/wizard)
- 自動化與指令碼：[命令列介面自動化](/zh-TW/start/wizard-cli-automation)
- 命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
