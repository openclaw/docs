---
read_when:
    - 你需要 `openclaw onboard` 的詳細行為
    - 你正在偵錯入門設定結果或整合入門設定用戶端
sidebarTitle: CLI reference
summary: 命令列介面設定流程、驗證/模型設定、輸出與內部機制的完整參考
title: 命令列介面設定參考
x-i18n:
    generated_at: "2026-07-04T06:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

本頁是 `openclaw onboard` 的完整參考。
如需簡短指南，請參閱 [入門設定（命令列介面）](/zh-TW/start/wizard)。

## 精靈會做什麼

本機模式（預設）會引導你完成：

- 模型與驗證設定（OpenAI Code 訂閱 OAuth、Anthropic Claude 命令列介面或 API 金鑰，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI 閘道選項）
- 工作區位置與啟動檔案
- 閘道設定（連接埠、綁定位址、驗證、Tailscale）
- 頻道與供應商（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage，以及其他內建頻道外掛）
- 常駐程式安裝（LaunchAgent、systemd 使用者單元，或原生 Windows 排程工作，並以啟動資料夾作為後援）
- 健康檢查
- Skills 設定

遠端模式會將這台機器設定為連線到其他地方的閘道。
它不會在遠端主機上安裝或修改任何內容。

## 本機流程詳細資料

<Steps>
  <Step title="現有設定偵測">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇保留、修改或重設。
    - 重新執行精靈不會清除任何內容，除非你明確選擇重設（或傳入 `--reset`）。
    - 命令列介面 `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full` 也會移除工作區。
    - 如果設定無效或包含舊版鍵，精靈會停止並要求你先執行 `openclaw doctor` 再繼續。
    - 重設會使用 `trash`，並提供下列範圍：
      - 僅設定
      - 設定 + 憑證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型與驗證">
    - 完整選項矩陣在 [驗證與模型選項](#auth-and-model-options)。

  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 播種首次執行啟動儀式所需的工作區檔案。
    - 工作區配置：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Step>
  <Step title="閘道">
    - 提示設定連接埠、綁定位址、驗證模式與 Tailscale 暴露。
    - 建議：即使是 loopback 也保持啟用權杖驗證，讓本機 WS 用戶端必須驗證。
    - 在權杖模式中，互動式設定會提供：
      - **產生/儲存明文權杖**（預設）
      - **使用 SecretRef**（選擇啟用）
    - 在密碼模式中，互動式設定也支援明文或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 需要在入門設定程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時才停用驗證。
    - 非 loopback 綁定仍然需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖
    - [Discord](/zh-TW/channels/discord)：機器人權杖
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子受眾
    - [Mattermost](/zh-TW/channels/mattermost)：機器人權杖 + 基礎 URL
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages DB 存取；當閘道在 Mac 之外執行時，請使用 SSH 包裝器
    - DM 安全性：預設為配對。第一則 DM 會傳送代碼；透過
      `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。
  </Step>
  <Step title="常駐程式安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux 和透過 WSL2 的 Windows：systemd 使用者單元
      - 精靈會嘗試 `loginctl enable-linger <user>`，讓閘道在登出後保持執行。
      - 可能提示使用 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排程工作
      - 如果建立工作被拒絕，OpenClaw 會退回到每位使用者的啟動資料夾登入項目，並立即啟動閘道。
      - 排程工作仍是偏好的方式，因為它們提供更好的監督器狀態。
    - 執行階段選擇：Node（建議；WhatsApp 和 Telegram 必要）。不建議使用 Bun。

  </Step>
  <Step title="健康檢查">
    - 啟動閘道（如有需要）並執行 `openclaw health`。
    - `openclaw status --deep` 會將即時閘道健康探測加入狀態輸出，包含支援時的頻道探測。

  </Step>
  <Step title="Skills">
    - 讀取可用 Skills 並檢查需求。
    - 讓你選擇 Node 管理器：npm、pnpm 或 bun。
    - 當必要安裝程式可用時，為受信任的內建 Skills 安裝選用相依項。
    - 略過不可用的 Homebrew、uv 和 Go 安裝程式，然後將受影響的
      Skills 分組並提供手動設定指引。安裝缺少的先決條件後，請執行 `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 摘要與後續步驟，包含 iOS、Android 和 macOS 應用程式選項。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，精靈會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，精靈會嘗試建置它們；後援為 `pnpm ui:build`（自動安裝 UI 相依項）。
</Note>

## 遠端模式詳細資料

遠端模式會將這台機器設定為連線到其他地方的閘道。

<Info>
遠端模式不會在遠端主機上安裝或修改任何內容。
</Info>

你要設定的內容：

- 遠端閘道 URL (`ws://...`)
- 如果遠端閘道需要驗證，請設定權杖（建議）

<Note>
- 如果閘道僅限 loopback，請使用 SSH 通道或 tailnet。
- 探索提示：
  - macOS：Bonjour (`dns-sd`)
  - Linux：Avahi (`avahi-browse`)

</Note>

## 驗證與模型選項

<AccordionGroup>
  <Accordion title="Anthropic API 金鑰">
    如果存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供常駐程式使用。
  </Accordion>
  <Accordion title="OpenAI Code 訂閱（OAuth）">
    瀏覽器流程；貼上 `code#state`。

    當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI Code 訂閱（裝置配對）">
    使用短效裝置代碼的瀏覽器配對流程。

    當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="OpenAI API 金鑰">
    如果存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將憑證儲存在驗證設定檔中。

    當模型未設定、為 `openai/*`，或為舊版 Codex 模型參照時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    符合資格的 SuperGrok 或 X Premium 帳戶可使用瀏覽器登入。這是大多數使用者
    建議的 xAI 路徑。OpenClaw 會儲存產生的驗證
    設定檔，用於 Grok 模型、Grok `web_search`、`x_search` 和 `code_execution`。
  </Accordion>
  <Accordion title="xAI (Grok) 裝置代碼">
    適合遠端使用的瀏覽器登入，使用短代碼而非 localhost
    回呼。請在 SSH、Docker 或 VPS 主機上使用此方式。
  </Accordion>
  <Accordion title="xAI (Grok) API 金鑰">
    提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型供應商。當你想使用
    xAI Console API 金鑰而非訂閱 OAuth 時，請使用此方式。
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
    設定會自動寫入。託管預設值為 `MiniMax-M3`；API 金鑰設定使用
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
    `Cloud only` 會搭配 `https://ollama.com` 使用 `OLLAMA_API_KEY`。
    主機支援模式會提示輸入基礎 URL（預設 `http://127.0.0.1:11434`）、探索可用模型，並建議預設值。
    `Cloud + Local` 也會檢查該 Ollama 主機是否已登入雲端存取。
    更多詳細資料：[Ollama](/zh-TW/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot (Kimi K2) 和 Kimi Coding 設定會自動寫入。
    更多詳細資料：[Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)。
  </Accordion>
  <Accordion title="自訂供應商">
    可搭配 OpenAI 相容和 Anthropic 相容端點使用。

    互動式入門設定支援與其他供應商 API 金鑰流程相同的 API 金鑰儲存選項：
    - **立即貼上 API 金鑰**（明文）
    - **使用祕密參照**（環境變數參照或已設定的供應商參照，並含預檢驗證）

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
    保持驗證未設定。
  </Accordion>
</AccordionGroup>

模型行為：

- 從偵測到的選項中選擇預設模型，或手動輸入供應商和模型。
- 自訂供應商入門設定會為常見模型 ID 推斷圖片支援，且只在模型名稱未知時詢問。
- 當入門設定從供應商驗證選項開始時，模型選擇器會自動偏好
  該供應商。對於 Volcengine 和 BytePlus，相同偏好
  也會匹配它們的 coding-plan 變體（`volcengine-plan/*`、
  `byteplus-plan/*`）。
- 如果該偏好供應商篩選結果為空，選擇器會退回到
  完整目錄，而不是不顯示任何模型。
- 精靈會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。

憑證與設定檔路徑：

- 驗證設定檔（API 金鑰 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版 OAuth 匯入：`~/.openclaw/credentials/oauth.json`

憑證儲存模式：

- 預設的 onboarding 行為會將 API key 以純文字值保存於 auth profiles。
- `--secret-input-mode ref` 會啟用參照模式，而不是純文字 key 儲存。
  在互動式設定中，你可以選擇：
  - 環境變數參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 已設定的提供者參照（`file` 或 `exec`），搭配提供者別名 + ID
- 互動式參照模式會在儲存前執行快速的預檢驗證。
  - Env refs：驗證目前 onboarding 環境中的變數名稱 + 非空值。
  - Provider refs：驗證提供者設定並解析要求的 ID。
  - 如果預檢失敗，onboarding 會顯示錯誤並讓你重試。
- 在非互動模式中，`--secret-input-mode ref` 只支援 env 後端。
  - 在 onboarding 程序環境中設定提供者環境變數。
  - 內嵌 key 旗標（例如 `--openai-api-key`）要求該環境變數必須已設定；否則 onboarding 會快速失敗。
  - 對於自訂提供者，非互動式 `ref` 模式會將 `models.providers.<id>.apiKey` 儲存為 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在該自訂提供者案例中，`--custom-api-key` 要求必須設定 `CUSTOM_API_KEY`；否則 onboarding 會快速失敗。
- 閘道 auth credentials 在互動式設定中支援純文字與 SecretRef 選項：
  - Token 模式：**產生/儲存純文字 token**（預設）或 **使用 SecretRef**。
  - Password 模式：純文字或 SecretRef。
- 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
- 現有的純文字設定會繼續維持不變。

<Note>
Headless 與伺服器提示：請在有瀏覽器的機器上完成 OAuth，然後複製
該 agent 的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或對應的
`$OPENCLAW_STATE_DIR/...` 路徑）到 gateway 主機。`credentials/oauth.json`
僅作為舊版匯入來源。
</Note>

## 輸出與內部

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（本機 onboarding 在未設定時預設為 `"coding"`；現有明確值會保留）
- `gateway.*`（模式、綁定、auth、tailscale）
- `session.dmScope`（本機 onboarding 在未設定時預設為 `per-channel-peer`；現有明確值會保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 當你在提示中選擇加入時的 channel allowlists（Slack、Discord、Matrix、Microsoft Teams）（可行時名稱會解析為 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 旗標接受 `npm`、`pnpm` 或 `bun`。
  - 之後仍可透過手動設定將 `skills.install.nodeManager: "yarn"` 設定為 config。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp credentials 位於 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
Sessions 儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
有些 channels 會以外掛形式交付。在設定期間選取時，精靈會
在 channel 設定前提示安裝外掛（npm 或本機路徑）。
</Note>

閘道 wizard RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients（macOS app 與 Control UI）可以轉譯步驟，而不必重新實作 onboarding 邏輯。

Signal 設定行為：

- 下載適當的 release asset
- 將它儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在 config 中寫入 `channels.signal.cliPath`
- JVM builds 需要 Java 21
- 可用時會使用 Native builds
- Windows 使用 WSL2，並在 WSL 內遵循 Linux signal-cli flow

## 相關文件

- Onboarding 中樞：[Onboarding（命令列介面）](/zh-TW/start/wizard)
- 自動化與腳本：[命令列介面自動化](/zh-TW/start/wizard-cli-automation)
- 命令參考：[`openclaw onboard`](/zh-TW/cli/onboard)
