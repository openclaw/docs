---
read_when:
    - 你需要 `openclaw onboard` 的詳細行為
    - 你正在偵錯入門設定結果或整合入門設定用戶端
sidebarTitle: CLI reference
summary: 命令列介面設定流程、驗證/模型設定、輸出與內部機制的完整參考
title: 命令列介面設定參考
x-i18n:
    generated_at: "2026-06-30T22:06:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

此頁是 `openclaw onboard` 的完整參考。
短版指南請參閱[導覽（命令列介面）](/zh-TW/start/wizard)。

## 精靈會做什麼

本機模式（預設）會引導你完成：

- 模型與驗證設定（OpenAI Code subscription OAuth、Anthropic Claude 命令列介面或 API 金鑰，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI 閘道選項）
- 工作區位置與啟動檔案
- 閘道設定（連接埠、繫結、驗證、Tailscale）
- 頻道與提供者（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage，以及其他內建頻道外掛）
- 常駐程式安裝（LaunchAgent、systemd 使用者單元，或原生 Windows 排程工作，並以啟動資料夾作為後備）
- 健康檢查
- Skills 設定

遠端模式會設定此機器連線到其他位置的閘道。
它不會在遠端主機上安裝或修改任何內容。

## 本機流程詳細資料

<Steps>
  <Step title="現有設定偵測">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇保留、修改或重設。
    - 重新執行精靈不會清除任何內容，除非你明確選擇重設（或傳入 `--reset`）。
    - 命令列介面 `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也會移除工作區。
    - 如果設定無效或包含舊版金鑰，精靈會停止並要求你先執行 `openclaw doctor` 再繼續。
    - 重設會使用 `trash`，並提供範圍：
      - 僅設定
      - 設定 + 認證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型與驗證">
    - 完整選項矩陣位於[驗證與模型選項](#auth-and-model-options)。

  </Step>
  <Step title="工作區">
    - 預設為 `~/.openclaw/workspace`（可設定）。
    - 會植入首次執行啟動儀式所需的工作區檔案。
    - 工作區配置：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="閘道">
    - 會提示輸入連接埠、繫結、驗證模式，以及 Tailscale 曝露設定。
    - 建議：即使是迴路介面，也保持權杖驗證啟用，讓本機 WS 用戶端必須驗證。
    - 在權杖模式中，互動式設定會提供：
      - **產生/儲存純文字權杖**（預設）
      - **使用 SecretRef**（選用）
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求導覽程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時，才停用驗證。
    - 非迴路繫結仍然需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖
    - [Discord](/zh-TW/channels/discord)：機器人權杖
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子受眾
    - [Mattermost](/zh-TW/channels/mattermost)：機器人權杖 + 基底 URL
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages DB 存取；當閘道在 Mac 以外執行時，請使用 SSH 包裝器
    - 私訊安全性：預設為配對。第一則私訊會傳送代碼；透過
      `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。
  </Step>
  <Step title="常駐程式安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux 和透過 WSL2 的 Windows：systemd 使用者單元
      - 精靈會嘗試 `loginctl enable-linger <user>`，讓閘道在登出後仍保持執行。
      - 可能提示使用 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排程工作
      - 如果建立工作遭拒，OpenClaw 會後備為每位使用者的啟動資料夾登入項目，並立即啟動閘道。
      - 排程工作仍然是首選，因為它們提供較好的監督狀態。
    - 執行階段選擇：節點（建議；WhatsApp 和 Telegram 必需）。不建議使用 Bun。

  </Step>
  <Step title="健康檢查">
    - 啟動閘道（如有需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時閘道健康探測加入狀態輸出，包含支援時的頻道探測。

  </Step>
  <Step title="Skills">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇節點管理器：npm、pnpm 或 bun。
    - 安裝選用相依項（部分會在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要與後續步驟，包含 iOS、Android 和 macOS 應用程式選項。

  </Step>
</Steps>

<Note>
如果偵測不到 GUI，精靈會列印控制 UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少控制 UI 資產，精靈會嘗試建置它們；後備為 `pnpm ui:build`（會自動安裝 UI 相依項）。
</Note>

## 遠端模式詳細資料

遠端模式會設定此機器連線到其他位置的閘道。

<Info>
遠端模式不會在遠端主機上安裝或修改任何內容。
</Info>

你會設定：

- 遠端閘道 URL (`ws://...`)
- 如果遠端閘道需要驗證，請設定權杖（建議）

<Note>
- 如果閘道僅限迴路介面，請使用 SSH 通道或 tailnet。
- 探索提示：
  - macOS：Bonjour (`dns-sd`)
  - Linux：Avahi (`avahi-browse`)

</Note>

## 驗證與模型選項

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰">
    如果存在，會使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供常駐程式使用。
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    瀏覽器流程；貼上 `code#state`。

    當模型未設定或已是 OpenAI 系列時，會透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    使用短效裝置代碼的瀏覽器配對流程。

    當模型未設定或已是 OpenAI 系列時，會透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API 金鑰">
    如果存在，會使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將認證儲存在驗證設定檔中。

    當模型未設定、為 `openai/*`，或為舊版 Codex 模型參照時，會將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    供符合資格的 SuperGrok 或 X Premium 帳戶使用的瀏覽器登入。這是
    大多數使用者建議的 xAI 路徑。OpenClaw 會儲存產生的驗證
    設定檔，用於 Grok 模型、Grok `web_search`、`x_search` 和 `code_execution`。
  </Accordion>
  <Accordion title="xAI (Grok) 裝置代碼">
    適合遠端環境的瀏覽器登入，使用短代碼而不是 localhost
    回呼。可從 SSH、Docker 或 VPS 主機使用。
  </Accordion>
  <Accordion title="xAI (Grok) API 金鑰">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型提供者。當你想使用
    xAI Console API 金鑰，而不是訂閱 OAuth 時使用。
  </Accordion>
  <Accordion title="OpenCode">
    提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），並讓你選擇 Zen 或 Go 目錄。
    設定 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 金鑰（通用）">
    為你儲存金鑰。
  </Accordion>
  <Accordion title="Vercel AI 閘道">
    提示輸入 `AI_GATEWAY_API_KEY`。
    更多詳細資料：[Vercel AI 閘道](/zh-TW/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI 閘道">
    提示輸入帳戶 ID、閘道 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多詳細資料：[Cloudflare AI 閘道](/zh-TW/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定會自動寫入。託管預設值為 `MiniMax-M3`；API 金鑰設定會使用
    `minimax/...`，而 OAuth 設定會使用 `minimax-portal/...`。
    更多詳細資料：[MiniMax](/zh-TW/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    會為中國或全球端點上的 StepFun standard 或 Step Plan 自動寫入設定。
    Standard 目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    更多詳細資料：[StepFun](/zh-TW/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 相容）">
    提示輸入 `SYNTHETIC_API_KEY`。
    更多詳細資料：[Synthetic](/zh-TW/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloud 與本機開放模型）">
    先提示選擇 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 搭配 `https://ollama.com`。
    主機支援的模式會提示輸入基底 URL（預設 `http://127.0.0.1:11434`）、探索可用模型，並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取權。
    更多詳細資料：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot (Kimi K2) 和 Kimi Coding 設定會自動寫入。
    更多詳細資料：[Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="自訂提供者">
    可搭配 OpenAI 相容與 Anthropic 相容端點使用。

    互動式導覽支援與其他提供者 API 金鑰流程相同的 API 金鑰儲存選項：
    - **立即貼上 API 金鑰**（純文字）
    - **使用祕密參照**（環境變數參照或已設定的提供者參照，並進行預檢驗證）

    非互動式旗標：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（選用；後備為 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（選用）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（選用；預設 `openai`）
    - `--custom-image-input` / `--custom-text-input`（選用；覆寫推斷的模型輸入能力）

  </Accordion>
  <Accordion title="跳過">
    保持驗證未設定。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項中挑選預設模型，或手動輸入提供者與模型。
- 自訂提供者導覽會為常見模型 ID 推斷圖片支援，且只有在模型名稱未知時才詢問。
- 當導覽從提供者驗證選項開始時，模型選擇器會自動偏好
  該提供者。對於 Volcengine 和 BytePlus，相同偏好
  也會比對其 coding-plan 變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果該偏好提供者篩選結果為空，選擇器會後備為
  完整目錄，而不是不顯示任何模型。
- 精靈會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。

認證與設定檔路徑：

- 驗證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

認證儲存模式：

- 預設入門設定行為會將 API 金鑰以純文字值形式持久保存於驗證設定檔中。
- `--secret-input-mode ref` 會啟用參照模式，而不是以純文字儲存金鑰。
  在互動式設定中，你可以選擇以下任一項：
  - 環境變數參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的提供者參照（`file` 或 `exec`），搭配提供者別名 + id
- 互動式參照模式會在儲存前執行快速預檢驗證。
  - 環境變數參照：驗證目前入門設定環境中的變數名稱 + 非空值。
  - 提供者參照：驗證提供者設定並解析要求的 id。
  - 如果預檢失敗，入門設定會顯示錯誤並讓你重試。
- 在非互動模式中，`--secret-input-mode ref` 只支援環境變數。
  - 在入門設定程序環境中設定提供者環境變數。
  - 內嵌金鑰旗標（例如 `--openai-api-key`）要求必須設定該環境變數；否則入門設定會快速失敗。
  - 對於自訂提供者，非互動 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在該自訂提供者情境中，`--custom-api-key` 要求必須設定 `CUSTOM_API_KEY`；否則入門設定會快速失敗。
- 閘道驗證認證在互動式設定中支援純文字和 SecretRef 選項：
  - 權杖模式：**產生/儲存純文字權杖**（預設）或**使用 SecretRef**。
  - 密碼模式：純文字或 SecretRef。
- 非互動權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 現有純文字設定會繼續照常運作。

<Note>
無頭與伺服器提示：在有瀏覽器的機器上完成 OAuth，然後複製
該代理的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或對應的
`$OPENCLAW_STATE_DIR/...` 路徑）到閘道主機。`credentials/oauth.json`
僅是舊版匯入來源。
</Note>

## 輸出與內部項目

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（本機入門設定在未設定時預設為 `"coding"`；現有明確值會被保留）
- `gateway.*`（模式、繫結、驗證、tailscale）
- `session.dmScope`（本機入門設定在未設定時預設為 `per-channel-peer`；現有明確值會被保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 你在提示期間選擇加入時的頻道允許清單（Slack、Discord、Matrix、Microsoft Teams）（可行時名稱會解析為 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定稍後仍可設定 `skills.install.nodeManager: "yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 認證位於 `~/.openclaw/credentials/whatsapp/<accountId>/` 之下。
工作階段儲存在 `~/.openclaw/agents/<agentId>/sessions/` 之下。

<Note>
部分頻道會以外掛形式交付。在設定期間選取時，精靈會在頻道設定之前
提示安裝外掛（npm 或本機路徑）。
</Note>

閘道精靈 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

用戶端（macOS app 和控制介面）可以呈現步驟，而不必重新實作入門設定邏輯。

Signal 設定行為：

- 下載適當的發行資產
- 將其儲存在 `~/.openclaw/tools/signal-cli/<version>/` 之下
- 在設定中寫入 `channels.signal.cliPath`
- JVM 建置需要 Java 21
- 可用時會使用原生建置
- Windows 使用 WSL2，並在 WSL 內遵循 Linux signal-cli 流程

## 相關文件

- 入門設定中心：[入門設定（命令列介面）](/zh-TW/start/wizard)
- 自動化與指令碼：[命令列介面自動化](/zh-TW/start/wizard-cli-automation)
- 指令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
