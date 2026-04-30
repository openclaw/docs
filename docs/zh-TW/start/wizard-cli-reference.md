---
read_when:
    - 您需要 `openclaw onboard` 的詳細行為
    - 你正在偵錯上手流程結果或整合上手流程用戶端
sidebarTitle: CLI reference
summary: CLI 設定流程、身分驗證/模型設定、輸出與內部機制的完整參考
title: CLI 設定參考
x-i18n:
    generated_at: "2026-04-30T03:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

此頁是 `openclaw onboard` 的完整參考。
短版指南請見 [入門設定 (CLI)](/zh-TW/start/wizard)。

## 精靈會做什麼

本機模式（預設）會引導你完成：

- 模型與驗證設定（OpenAI Code 訂閱 OAuth、Anthropic Claude CLI 或 API 金鑰，加上 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 選項）
- 工作區位置與啟動檔案
- Gateway 設定（連接埠、繫結、驗證、Tailscale）
- 頻道與供應商（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles，以及其他內建頻道 Plugin）
- Daemon 安裝（LaunchAgent、systemd 使用者單元，或原生 Windows Scheduled Task，並以 Startup 資料夾作為後備）
- 健康檢查
- Skills 設定

遠端模式會設定此機器連線到其他位置的 Gateway。
它不會在遠端主機上安裝或修改任何內容。

## 本機流程詳細資料

<Steps>
  <Step title="偵測既有設定">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇保留、修改或重設。
    - 重新執行精靈不會清除任何內容，除非你明確選擇重設（或傳入 `--reset`）。
    - CLI `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也會移除工作區。
    - 如果設定無效或包含舊版鍵，精靈會停止並要求你先執行 `openclaw doctor`，再繼續。
    - 重設使用 `trash` 並提供範圍：
      - 僅設定
      - 設定 + 認證資料 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型與驗證">
    - 完整選項矩陣在[驗證與模型選項](#auth-and-model-options)。

  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 植入首次執行啟動儀式所需的工作區檔案。
    - 工作區版面配置：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - 提示輸入連接埠、繫結、驗證模式與 Tailscale 暴露。
    - 建議：即使是 loopback 也保持 token 驗證啟用，讓本機 WS 用戶端必須驗證。
    - 在 token 模式下，互動式設定會提供：
      - **產生/儲存明文 token**（預設）
      - **使用 SecretRef**（選擇加入）
    - 在密碼模式下，互動式設定也支援明文或 SecretRef 儲存。
    - 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 需要 onboarding 程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時才停用驗證。
    - 非 loopback 繫結仍然需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：機器人 token
    - [Discord](/zh-TW/channels/discord)：機器人 token
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + Webhook 對象
    - [Mattermost](/zh-TW/channels/mattermost)：機器人 token + 基底 URL
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定
    - [BlueBubbles](/zh-TW/channels/bluebubbles)：建議用於 iMessage；伺服器 URL + 密碼 + Webhook
    - [iMessage](/zh-TW/channels/imessage)：舊版 `imsg` CLI 路徑 + DB 存取
    - DM 安全性：預設為配對。第一則 DM 會傳送代碼；透過
      `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。
  </Step>
  <Step title="Daemon 安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux 與透過 WSL2 的 Windows：systemd 使用者單元
      - 精靈會嘗試 `loginctl enable-linger <user>`，讓 Gateway 在登出後保持執行。
      - 可能會提示 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用 Scheduled Task
      - 如果工作建立遭拒，OpenClaw 會改用每位使用者的 Startup 資料夾登入項目，並立即啟動 Gateway。
      - Scheduled Tasks 仍然是偏好的方式，因為它們提供更好的監督狀態。
    - 執行階段選擇：Node（建議；WhatsApp 和 Telegram 需要）。不建議使用 Bun。

  </Step>
  <Step title="健康檢查">
    - 啟動 Gateway（如有需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時 Gateway 健康探測加入狀態輸出，支援時也包含頻道探測。

  </Step>
  <Step title="Skills">
    - 讀取可用 Skills 並檢查需求。
    - 讓你選擇 Node 管理器：npm、pnpm 或 bun。
    - 安裝選用相依項（有些會在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要與後續步驟，包括 iOS、Android 和 macOS 應用程式選項。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，精靈會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，精靈會嘗試建置它們；後備方式是 `pnpm ui:build`（會自動安裝 UI 相依項）。
</Note>

## 遠端模式詳細資料

遠端模式會設定此機器連線到其他位置的 Gateway。

<Info>
遠端模式不會在遠端主機上安裝或修改任何內容。
</Info>

你要設定的內容：

- 遠端 Gateway URL (`ws://...`)
- 如果遠端 Gateway 需要驗證，請設定 token（建議）

<Note>
- 如果 Gateway 僅限 loopback，請使用 SSH 通道或 tailnet。
- 探索提示：
  - macOS：Bonjour (`dns-sd`)
  - Linux：Avahi (`avahi-browse`)

</Note>

## 驗證與模型選項

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰">
    如果存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供 daemon 使用。
  </Accordion>
  <Accordion title="OpenAI Code 訂閱 (OAuth)">
    瀏覽器流程；貼上 `code#state`。

    當模型未設定或已是 OpenAI 家族時，將 `agents.defaults.model` 設為 `openai-codex/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code 訂閱（裝置配對）">
    具短效裝置代碼的瀏覽器配對流程。

    當模型未設定或已是 OpenAI 家族時，將 `agents.defaults.model` 設為 `openai-codex/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API 金鑰">
    如果存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將認證資料儲存在驗證設定檔中。

    當模型未設定、為 `openai/*` 或 `openai-codex/*` 時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI (Grok) API 金鑰">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型供應商。
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
    更多詳細資料：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示輸入帳戶 ID、Gateway ID 與 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多詳細資料：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定會自動寫入。託管預設為 `MiniMax-M2.7`；API 金鑰設定使用
    `minimax/...`，OAuth 設定使用 `minimax-portal/...`。
    更多詳細資料：[MiniMax](/zh-TW/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    設定會針對中國或全球端點上的 StepFun 標準版或 Step Plan 自動寫入。
    標準版目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    更多詳細資料：[StepFun](/zh-TW/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 相容）">
    提示輸入 `SYNTHETIC_API_KEY`。
    更多詳細資料：[Synthetic](/zh-TW/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（雲端與本機開放模型）">
    先提示選擇 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 搭配 `https://ollama.com`。
    主機支援模式會提示輸入基底 URL（預設 `http://127.0.0.1:11434`）、探索可用模型，並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取權。
    更多詳細資料：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 與 Kimi Coding">
    Moonshot (Kimi K2) 與 Kimi Coding 設定會自動寫入。
    更多詳細資料：[Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="自訂供應商">
    可搭配 OpenAI 相容與 Anthropic 相容端點使用。

    互動式 onboarding 支援與其他供應商 API 金鑰流程相同的 API 金鑰儲存選擇：
    - **立即貼上 API 金鑰**（明文）
    - **使用祕密參照**（env ref 或已設定的 provider ref，並含預檢驗證）

    非互動式旗標：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（選用；後備為 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（選用）
    - `--custom-compatibility <openai|anthropic>`（選用；預設 `openai`）
    - `--custom-image-input` / `--custom-text-input`（選用；覆寫推斷出的模型輸入能力）

  </Accordion>
  <Accordion title="略過">
    保持驗證未設定。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項選擇預設模型，或手動輸入供應商與模型。
- 自訂供應商 onboarding 會為常見模型 ID 推斷影像支援，並只在模型名稱未知時詢問。
- 當 onboarding 從供應商驗證選項開始時，模型選擇器會自動偏好
  該供應商。對於 Volcengine 與 BytePlus，同樣的偏好
  也會符合其 coding-plan 變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果該偏好供應商篩選器會是空的，選擇器會改為退回
  完整目錄，而不是不顯示任何模型。
- 精靈會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。

認證資料與設定檔路徑：

- 驗證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

認證資料儲存模式：

- 預設 onboarding 行為會將 API 金鑰以明文值保存在驗證設定檔中。
- `--secret-input-mode ref` 會啟用參照模式，而不是明文金鑰儲存。
  在互動式設定中，你可以選擇：
  - 環境變數參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的供應商參照（`file` 或 `exec`），搭配供應商別名 + id
- 互動式參照模式會在儲存前執行快速預檢驗證。
  - Env refs：驗證目前 onboarding 環境中的變數名稱 + 非空值。
  - Provider refs：驗證供應商設定並解析要求的 id。
  - 如果預檢失敗，onboarding 會顯示錯誤並讓你重試。
- 在非互動式模式中，`--secret-input-mode ref` 僅由 env 支援。
  - 在 onboarding 程序環境中設定供應商環境變數。
  - 內嵌金鑰旗標（例如 `--openai-api-key`）要求該環境變數已設定；否則 onboarding 會快速失敗。
  - 對於自訂供應商，非互動式 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在該自訂供應商案例中，`--custom-api-key` 要求 `CUSTOM_API_KEY` 已設定；否則 onboarding 會快速失敗。
- Gateway 驗證認證資料在互動式設定中支援明文與 SecretRef 選擇：
  - Token 模式：**產生/儲存明文 token**（預設）或 **使用 SecretRef**。
  - 密碼模式：明文或 SecretRef。
- 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 既有明文設定會繼續維持不變。

<Note>
無頭與伺服器提示：在有瀏覽器的機器上完成 OAuth，然後將
該代理程式的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
`$OPENCLAW_STATE_DIR/...` 路徑）複製到 Gateway 主機。`credentials/oauth.json`
僅是舊版匯入來源。
</Note>

## 輸出與內部機制

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（未設定時，本機導覽預設為 `"coding"`；會保留現有的明確值）
- `gateway.*`（模式、繫結、驗證、Tailscale）
- `session.dmScope`（未設定時，本機導覽會將此預設為 `per-channel-peer`；會保留現有的明確值）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 在提示期間選擇加入時的頻道允許清單（Slack、Discord、Matrix、Microsoft Teams）（可行時名稱會解析為 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 之後仍可透過手動設定將 `skills.install.nodeManager: "yarn"` 設定進去。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 與選用的 `bindings`。

WhatsApp 認證會放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
工作階段會儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
部分頻道會以 plugins 形式提供。在設定期間選取時，精靈會先提示安裝 plugin（npm 或本機路徑），再進行頻道設定。
</Note>

Gateway 精靈 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

用戶端（macOS 應用程式與 Control UI）可以呈現步驟，而不必重新實作導覽邏輯。

Signal 設定行為：

- 下載適當的發行資產
- 將其儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在設定中寫入 `channels.signal.cliPath`
- JVM 建置需要 Java 21
- 可用時會使用原生建置
- Windows 使用 WSL2，並在 WSL 內遵循 Linux signal-cli 流程

## 相關文件

- 導覽中心：[導覽（CLI）](/zh-TW/start/wizard)
- 自動化與指令碼：[CLI 自動化](/zh-TW/start/wizard-cli-automation)
- 命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
