---
read_when:
    - 您需要 openclaw onboard 的詳細行為
    - 你正在偵錯導入結果或整合導入用戶端
sidebarTitle: CLI reference
summary: CLI 設定流程、驗證/模型設定、輸出與內部機制的完整參考
title: CLI 設定參考
x-i18n:
    generated_at: "2026-05-10T19:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

此頁是 `openclaw onboard` 的完整參考。
如需簡短指南，請參閱[入門設定（CLI）](/zh-TW/start/wizard)。

## 精靈會做什麼

本機模式（預設）會引導你完成：

- 模型和驗證設定（OpenAI Code 訂閱 OAuth、Anthropic Claude CLI 或 API 金鑰，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 選項）
- 工作區位置和啟動檔案
- Gateway 設定（連接埠、繫結、驗證、tailscale）
- 通道和提供者（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage，以及其他內建通道 Plugin）
- 常駐程式安裝（LaunchAgent、systemd 使用者單元，或原生 Windows 排程工作，並以啟動資料夾作為備援）
- 健康檢查
- Skills 設定

遠端模式會設定這台機器連線到其他位置的 Gateway。
它不會在遠端主機上安裝或修改任何內容。

## 本機流程詳細資訊

<Steps>
  <Step title="Existing config detection">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇保留、修改或重設。
    - 重新執行精靈不會清除任何內容，除非你明確選擇重設（或傳入 `--reset`）。
    - CLI `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也會移除工作區。
    - 如果設定無效或包含舊版鍵值，精靈會停止並要求你先執行 `openclaw doctor` 再繼續。
    - 重設會使用 `trash`，並提供以下範圍：
      - 僅設定
      - 設定 + 憑證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="Model and auth">
    - 完整選項矩陣在[驗證和模型選項](#auth-and-model-options)。

  </Step>
  <Step title="Workspace">
    - 預設為 `~/.openclaw/workspace`（可設定）。
    - 植入首次執行啟動儀式所需的工作區檔案。
    - 工作區配置：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - 提示輸入連接埠、繫結、驗證模式和 tailscale 暴露設定。
    - 建議：即使是 loopback 也保持啟用權杖驗證，讓本機 WS 用戶端必須驗證。
    - 在權杖模式中，互動式設定提供：
      - **產生/儲存純文字權杖**（預設）
      - **使用 SecretRef**（選用）
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 需要入門設定程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 搭配使用。
    - 只有在你完全信任每個本機程序時才停用驗證。
    - 非 loopback 繫結仍然需要驗證。

  </Step>
  <Step title="Channels">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖
    - [Discord](/zh-TW/channels/discord)：機器人權杖
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + webhook audience
    - [Mattermost](/zh-TW/channels/mattermost)：機器人權杖 + 基底 URL
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定
    - [iMessage](/zh-TW/channels/imessage)：`imsg` CLI 路徑 + Messages DB 存取權；當 Gateway 在非 Mac 上執行時，請使用 SSH 包裝器
    - 私訊安全性：預設為配對。第一則私訊會傳送代碼；透過
      `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。
  </Step>
  <Step title="Daemon install">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux 和透過 WSL2 的 Windows：systemd 使用者單元
      - 精靈會嘗試 `loginctl enable-linger <user>`，讓 gateway 在登出後仍保持執行。
      - 可能會提示 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排程工作
      - 如果建立工作遭拒，OpenClaw 會退回到每位使用者啟動資料夾中的登入項目，並立即啟動 gateway。
      - 排程工作仍是偏好的方式，因為它們提供更好的監督程式狀態。
    - 執行階段選擇：Node（建議；WhatsApp 和 Telegram 必需）。不建議使用 Bun。

  </Step>
  <Step title="Health check">
    - 啟動 gateway（如有需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時 gateway 健康探測加入狀態輸出，支援時也包含通道探測。

  </Step>
  <Step title="Skills">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇 node 管理器：npm、pnpm 或 bun。
    - 安裝選用相依套件（部分在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="Finish">
    - 摘要和下一步，包括 iOS、Android 和 macOS 應用程式選項。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，精靈會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，精靈會嘗試建置它們；備援是 `pnpm ui:build`（會自動安裝 UI 相依套件）。
</Note>

## 遠端模式詳細資訊

遠端模式會設定這台機器連線到其他位置的 Gateway。

<Info>
遠端模式不會在遠端主機上安裝或修改任何內容。
</Info>

你要設定的內容：

- 遠端 Gateway URL（`ws://...`）
- 如果遠端 Gateway 需要驗證，則設定權杖（建議）

<Note>
- 如果 gateway 僅限 loopback，請使用 SSH 通道或 tailnet。
- 探索提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）

</Note>

## 驗證和模型選項

<AccordionGroup>
  <Accordion title="Anthropic API key">
    如果存在，使用 `ANTHROPIC_API_KEY`；否則提示輸入金鑰，然後儲存供常駐程式使用。
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    瀏覽器流程；貼上 `code#state`。

    當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    使用短期裝置代碼的瀏覽器配對流程。

    當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API key">
    如果存在，使用 `OPENAI_API_KEY`；否則提示輸入金鑰，然後將憑證儲存在驗證設定檔中。

    當模型未設定、為 `openai/*` 或 `openai-codex/*` 時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型提供者。
  </Accordion>
  <Accordion title="OpenCode">
    提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），並讓你選擇 Zen 或 Go 目錄。
    設定 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key (generic)">
    為你儲存金鑰。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示輸入 `AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示輸入帳戶 ID、gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多詳細資訊：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定會自動寫入。託管預設值為 `MiniMax-M2.7`；API 金鑰設定使用
    `minimax/...`，OAuth 設定使用 `minimax-portal/...`。
    更多詳細資訊：[MiniMax](/zh-TW/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    會自動寫入 StepFun standard 或 Step Plan 在中國或全球端點上的設定。
    Standard 目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    更多詳細資訊：[StepFun](/zh-TW/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    提示輸入 `SYNTHETIC_API_KEY`。
    更多詳細資訊：[Synthetic](/zh-TW/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    先提示選擇 `Cloud + Local`、`Cloud only` 或 `Local only`。
    `Cloud only` 使用 `OLLAMA_API_KEY` 搭配 `https://ollama.com`。
    主機支援的模式會提示輸入基底 URL（預設 `http://127.0.0.1:11434`）、探索可用模型，並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取權。
    更多詳細資訊：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 設定會自動寫入。
    更多詳細資訊：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="Custom provider">
    可搭配 OpenAI 相容和 Anthropic 相容端點使用。

    互動式入門設定支援與其他提供者 API 金鑰流程相同的 API 金鑰儲存選擇：
    - **現在貼上 API 金鑰**（純文字）
    - **使用秘密參照**（env ref 或已設定的 provider ref，並進行預檢驗證）

    非互動式旗標：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（選用；退回使用 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（選用）
    - `--custom-compatibility <openai|anthropic>`（選用；預設 `openai`）
    - `--custom-image-input` / `--custom-text-input`（選用；覆寫推斷的模型輸入能力）

  </Accordion>
  <Accordion title="Skip">
    保持未設定驗證。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項中選擇預設模型，或手動輸入提供者和模型。
- 自訂提供者入門設定會為常見模型 ID 推斷影像支援，只有在模型名稱未知時才詢問。
- 當入門設定從提供者驗證選項開始時，模型選擇器會自動偏好
  該提供者。對於 Volcengine 和 BytePlus，同一偏好
  也會符合它們的 coding-plan 變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果該偏好提供者篩選器會是空的，選擇器會退回到
  完整目錄，而不是顯示沒有模型。
- 精靈會執行模型檢查，並在已設定的模型未知或缺少驗證時發出警告。

憑證和設定檔路徑：

- 驗證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

憑證儲存模式：

- 預設入門設定行為會將 API 金鑰以純文字值保存在驗證設定檔中。
- `--secret-input-mode ref` 會啟用參照模式，而不是純文字金鑰儲存。
  在互動式設定中，你可以選擇：
  - 環境變數 ref（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的 provider ref（`file` 或 `exec`），搭配提供者別名 + id
- 互動式參照模式會在儲存前執行快速預檢驗證。
  - Env refs：驗證目前入門設定環境中的變數名稱 + 非空值。
  - Provider refs：驗證提供者設定並解析要求的 id。
  - 如果預檢失敗，入門設定會顯示錯誤並讓你重試。
- 在非互動式模式中，`--secret-input-mode ref` 僅以 env 作為後端。
  - 在入門設定程序環境中設定提供者環境變數。
  - 行內金鑰旗標（例如 `--openai-api-key`）要求設定該環境變數；否則入門設定會快速失敗。
  - 對於自訂提供者，非互動式 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在該自訂提供者情況中，`--custom-api-key` 要求設定 `CUSTOM_API_KEY`；否則入門設定會快速失敗。
- Gateway 驗證憑證在互動式設定中支援純文字和 SecretRef 選擇：
  - 權杖模式：**產生/儲存純文字權杖**（預設）或 **使用 SecretRef**。
  - 密碼模式：純文字或 SecretRef。
- 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 現有純文字設定會繼續照常運作。

<Note>
無頭式與伺服器提示：請在有瀏覽器的機器上完成 OAuth，然後將該代理程式的 `auth-profiles.json`（例如 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或對應的 `$OPENCLAW_STATE_DIR/...` 路徑）複製到 Gateway 主機。`credentials/oauth.json` 只是舊版匯入來源。
</Note>

## 輸出與內部細節

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（未設定時，本機上手流程預設為 `"coding"`；既有的明確值會保留）
- `gateway.*`（模式、繫結、驗證、tailscale）
- `session.dmScope`（未設定時，本機上手流程預設為 `per-channel-peer`；既有的明確值會保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 在提示期間選擇加入時的頻道允許清單（Slack、Discord、Matrix、Microsoft Teams）（可行時名稱會解析為 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 稍後手動設定仍可將 `skills.install.nodeManager` 設為 `"yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 憑證會放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
工作階段儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
部分頻道是以 plugins 交付。在設定期間選取時，精靈會先提示安裝 plugin（npm 或本機路徑），再進行頻道設定。
</Note>

Gateway 精靈 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

用戶端（macOS App 和 Control UI）可以呈現步驟，而不必重新實作上手邏輯。

Signal 設定行為：

- 下載適當的發行資產
- 將其儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在設定中寫入 `channels.signal.cliPath`
- JVM 建置需要 Java 21
- 可用時會使用原生建置
- Windows 使用 WSL2，並在 WSL 內遵循 Linux signal-cli 流程

## 相關文件

- 上手中心：[上手（CLI）](/zh-TW/start/wizard)
- 自動化與指令碼：[CLI 自動化](/zh-TW/start/wizard-cli-automation)
- 指令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
