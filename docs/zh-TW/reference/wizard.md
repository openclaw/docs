---
read_when:
    - 查詢特定的入門設定步驟或旗標
    - 使用非互動模式自動化入門設定
    - 偵錯入門流程行為
sidebarTitle: Onboarding Reference
summary: CLI 入門導覽的完整參考：每個步驟、旗標和設定欄位
title: 入門導覽參考
x-i18n:
    generated_at: "2026-04-30T03:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

這是 `openclaw onboard` 的完整參考。
如需高層次概觀，請參閱[上手導覽（CLI）](/zh-TW/start/wizard)。

## 流程詳細資料（本機模式）

<Steps>
  <Step title="偵測現有設定">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇**保留 / 修改 / 重設**。
    - 重新執行上手導覽**不會**清除任何內容，除非你明確選擇**重設**
      （或傳入 `--reset`）。
    - CLI `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full`
      也會移除工作區。
    - 如果設定無效或包含舊版鍵，精靈會停止並要求你先執行
      `openclaw doctor` 再繼續。
    - 重設使用 `trash`（絕不使用 `rm`）並提供範圍：
      - 僅設定
      - 設定 + 認證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型/Auth">
    - **Anthropic API key**：如果存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供 daemon 使用。
    - **Anthropic API key**：上手導覽/設定中的偏好 Anthropic 助理選項。
    - **Anthropic setup-token**：仍可在上手導覽/設定中使用，不過 OpenClaw 現在會在可用時優先重用 Claude CLI。
    - **OpenAI Code (Codex) subscription (OAuth)**：瀏覽器流程；貼上 `code#state`。
      - 當模型未設定或已是 OpenAI 系列時，將 `agents.defaults.model` 設為 `openai-codex/gpt-5.5`。
    - **OpenAI Code (Codex) subscription (device pairing)**：使用短期裝置代碼的瀏覽器配對流程。
      - 當模型未設定或已是 OpenAI 系列時，將 `agents.defaults.model` 設為 `openai-codex/gpt-5.5`。
    - **OpenAI API key**：如果存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將其儲存在 auth profiles 中。
      - 當模型未設定、為 `openai/*` 或 `openai-codex/*` 時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **xAI (Grok) API key**：提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型供應商。
    - **OpenCode**：提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 取得），並讓你選擇 Zen 或 Go catalog。
    - **Ollama**：先提供 **Cloud + Local**、**Cloud only** 或 **Local only**。`Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並使用 `https://ollama.com`；主機支援模式會提示輸入 Ollama base URL、探索可用模型，並在需要時自動拉取選定的本機模型；`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以使用雲端存取。
    - 更多詳細資料：[Ollama](/zh-TW/providers/ollama)
    - **API key**：為你儲存金鑰。
    - **Vercel AI Gateway（多模型代理）**：提示輸入 `AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示輸入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
    - **MiniMax**：設定會自動寫入；託管預設值為 `MiniMax-M2.7`。
      API-key 設定使用 `minimax/...`，OAuth 設定使用
      `minimax-portal/...`。
    - 更多詳細資料：[MiniMax](/zh-TW/providers/minimax)
    - **StepFun**：會針對中國或全球端點上的 StepFun standard 或 Step Plan 自動寫入設定。
    - Standard 目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    - 更多詳細資料：[StepFun](/zh-TW/providers/stepfun)
    - **Synthetic（Anthropic 相容）**：提示輸入 `SYNTHETIC_API_KEY`。
    - 更多詳細資料：[Synthetic](/zh-TW/providers/synthetic)
    - **Moonshot (Kimi K2)**：設定會自動寫入。
    - **Kimi Coding**：設定會自動寫入。
    - 更多詳細資料：[Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)
    - **略過**：尚未設定 auth。
    - 從偵測到的選項中挑選預設模型（或手動輸入供應商/模型）。為了最佳品質並降低 prompt-injection 風險，請選擇供應商堆疊中可用的最強最新世代模型。
    - 上手導覽會執行模型檢查，並在設定的模型未知或缺少 auth 時發出警告。
    - API key 儲存模式預設為純文字 auth-profile 值。使用 `--secret-input-mode ref` 可改為儲存 env 支援的參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - Auth profiles 位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API keys + OAuth）。`~/.openclaw/credentials/oauth.json` 僅為舊版匯入來源。
    - 更多詳細資料：[/concepts/oauth](/zh-TW/concepts/oauth)
    <Note>
    無頭/伺服器提示：在有瀏覽器的機器上完成 OAuth，然後複製
    該 agent 的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
    `$OPENCLAW_STATE_DIR/...` 路徑）到 gateway 主機。`credentials/oauth.json`
    僅是舊版匯入來源。
    </Note>
  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 植入 agent bootstrap ritual 所需的工作區檔案。
    - 完整工作區配置 + 備份指南：[Agent workspace](/zh-TW/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - 連接埠、繫結、auth 模式、tailscale 暴露。
    - Auth 建議：即使是 loopback，也保留 **Token**，讓本機 WS 用戶端必須驗證。
    - 在 token 模式中，互動式設定提供：
      - **產生/儲存純文字 token**（預設）
      - **使用 SecretRef**（選擇加入）
      - Quickstart 會重用跨 `env`、`file` 和 `exec` 供應商的既有 `gateway.auth.token` SecretRefs，用於上手導覽探測/dashboard bootstrap。
      - 如果該 SecretRef 已設定但無法解析，上手導覽會及早失敗並顯示清楚的修正訊息，而不是靜默降低執行階段 auth。
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求上手導覽程序環境中有非空的 env var。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時才停用 auth。
    - 非 loopback 繫結仍需要 auth。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用的 QR 登入。
    - [Telegram](/zh-TW/channels/telegram)：bot token。
    - [Discord](/zh-TW/channels/discord)：bot token。
    - [Google Chat](/zh-TW/channels/googlechat)：service account JSON + webhook audience。
    - [Mattermost](/zh-TW/channels/mattermost)（plugin）：bot token + base URL。
    - [Signal](/zh-TW/channels/signal)：選用的 `signal-cli` 安裝 + 帳號設定。
    - [BlueBubbles](/zh-TW/channels/bluebubbles)：**建議用於 iMessage**；server URL + password + webhook。
    - [iMessage](/zh-TW/channels/imessage)：舊版 `imsg` CLI path + DB 存取。
    - DM 安全性：預設為配對。第一則 DM 會傳送代碼；透過 `openclaw pairing approve <channel> <code>` 核准，或使用 allowlists。

  </Step>
  <Step title="網頁搜尋">
    - 挑選受支援的供應商，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily（或略過）。
    - API 支援的供應商可使用 env vars 或既有設定快速設定；無需金鑰的供應商則使用其供應商特定的先決條件。
    - 使用 `--skip-search` 略過。
    - 稍後設定：`openclaw configure --section web`。

  </Step>
  <Step title="Daemon 安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux（以及透過 WSL2 的 Windows）：systemd 使用者單元
      - 上手導覽會嘗試透過 `loginctl enable-linger <user>` 啟用 lingering，讓 Gateway 在登出後仍維持執行。
      - 可能提示使用 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - **Runtime 選擇：** Node（建議；WhatsApp/Telegram 必需）。不建議使用 Bun。
    - 如果 token auth 需要 token，且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將已解析的純文字 token 值保存到 supervisor service environment metadata。
    - 如果 token auth 需要 token，且設定的 token SecretRef 未解析，daemon 安裝會被封鎖並提供可操作的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，daemon 安裝會被封鎖，直到明確設定模式。

  </Step>
  <Step title="健康檢查">
    - 啟動 Gateway（如需要）並執行 `openclaw health`。
    - 提示：`openclaw status --deep` 會將即時 gateway 健康探測加入狀態輸出，包括支援時的頻道探測（需要可連線的 gateway）。

  </Step>
  <Step title="Skills（建議）">
    - 讀取可用的 skills 並檢查需求。
    - 讓你選擇 node manager：**npm / pnpm**（不建議 bun）。
    - 安裝選用相依項（有些在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要 + 後續步驟，包括提供額外功能的 iOS/Android/macOS 應用程式。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，上手導覽會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI assets，上手導覽會嘗試建置它們；備援為 `pnpm ui:build`（會自動安裝 UI deps）。
</Note>

## 非互動式模式

使用 `--non-interactive` 自動化或編寫上手導覽腳本：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

加入 `--json` 以取得機器可讀的摘要。

非互動式模式中的 Gateway token SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 和 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不**表示非互動式模式。腳本請使用 `--non-interactive`（以及 `--workspace`）。
</Note>

供應商特定的命令範例位於 [CLI Automation](/zh-TW/start/wizard-cli-automation#provider-specific-examples)。
此參考頁可用於旗標語意和步驟順序。

### 新增 agent（非互動式）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 精靈 RPC

Gateway 透過 RPC 暴露上手導覽流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
用戶端（macOS 應用程式、Control UI）可以呈現步驟，而不必重新實作上手導覽邏輯。

## Signal 設定（signal-cli）

上手導覽可以從 GitHub releases 安裝 `signal-cli`：

- 下載適當的 release asset。
- 將其儲存在 `~/.openclaw/tools/signal-cli/<version>/`。
- 將 `channels.signal.cliPath` 寫入你的設定。

備註：

- JVM builds 需要 **Java 21**。
- 可用時會使用 Native builds。
- Windows 使用 WSL2；signal-cli 安裝會遵循 WSL 內部的 Linux 流程。

## 精靈會寫入什麼

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（未設定時，本機入門設定預設為 `"coding"`；既有的明確值會保留）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（行為詳細資訊：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 當你在提示中選擇加入時的頻道允許清單（Slack/Discord/Matrix/Microsoft Teams）（可行時，名稱會解析為 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定仍可透過直接設定 `skills.install.nodeManager` 來使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 認證資料位於 `~/.openclaw/credentials/whatsapp/<accountId>/`。
工作階段會儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

部分頻道會以 plugins 形式提供。當你在設定期間選擇其中一個時，入門設定會提示你先安裝它（npm 或本機路徑），之後才能進行設定。

## 相關文件

- 入門設定概覽：[入門設定 (CLI)](/zh-TW/start/wizard)
- macOS 應用程式入門設定：[入門設定](/zh-TW/start/onboarding)
- 設定參考：[Gateway 設定](/zh-TW/gateway/configuration)
- 供應商：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)、[Google Chat](/zh-TW/channels/googlechat)、[Signal](/zh-TW/channels/signal)、[BlueBubbles](/zh-TW/channels/bluebubbles) (iMessage)、[iMessage](/zh-TW/channels/imessage)（舊版）
- Skills：[Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)
