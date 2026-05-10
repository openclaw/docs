---
read_when:
    - 查詢特定的入門設定步驟或旗標
    - 使用非互動模式自動化入門流程
    - 偵錯入門流程行為
sidebarTitle: Onboarding Reference
summary: CLI 初始設定完整參考：每個步驟、旗標與設定欄位
title: 入門參考
x-i18n:
    generated_at: "2026-05-10T19:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

這是 `openclaw onboard` 的完整參考。
如需高階概觀，請參閱[入門設定（CLI）](/zh-TW/start/wizard)。

## 流程詳細資料（本機模式）

<Steps>
  <Step title="現有設定偵測">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇**保留目前值**、**檢閱並更新**或**設定前重設**。
    - 重新執行入門設定**不會**清除任何內容，除非你明確選擇**重設**
      （或傳入 `--reset`）。
    - CLI `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full`
      也會移除工作區。
    - 如果設定無效或包含舊版金鑰，精靈會停止並要求
      你先執行 `openclaw doctor` 再繼續。
    - 重設使用 `trash`（絕不使用 `rm`），並提供以下範圍：
      - 僅設定
      - 設定 + 憑證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型/驗證">
    - **Anthropic API 金鑰**：如果存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供 daemon 使用。
    - **Anthropic API 金鑰**：入門設定/設定中的偏好 Anthropic 助理選項。
    - **Anthropic setup-token**：仍可在入門設定/設定中使用，不過 OpenClaw 現在會在可用時優先重用 Claude CLI。
    - **OpenAI Code (Codex) 訂閱（OAuth）**：瀏覽器流程；貼上 `code#state`。
      - 當模型未設定或已是 OpenAI 系列時，透過 Codex runtime 將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **OpenAI Code (Codex) 訂閱（裝置配對）**：使用短效裝置碼的瀏覽器配對流程。
      - 當模型未設定或已是 OpenAI 系列時，透過 Codex runtime 將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **OpenAI API 金鑰**：如果存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將其儲存在驗證設定檔中。
      - 當模型未設定、為 `openai/*` 或 `openai-codex/*` 時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **xAI (Grok) API 金鑰**：提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型提供者。
    - **OpenCode**：提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 取得），並讓你選擇 Zen 或 Go 目錄。
    - **Ollama**：先提供**雲端 + 本機**、**僅雲端**或**僅本機**。`Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並使用 `https://ollama.com`；由主機支援的模式會提示輸入 Ollama 基底 URL、探索可用模型，並在需要時自動拉取所選本機模型；`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以使用雲端存取。
    - 更多詳細資料：[Ollama](/zh-TW/providers/ollama)
    - **API 金鑰**：為你儲存金鑰。
    - **Vercel AI Gateway（多模型代理）**：提示輸入 `AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示輸入帳戶 ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
    - **MiniMax**：設定會自動寫入；託管預設值為 `MiniMax-M2.7`。
      API 金鑰設定使用 `minimax/...`，OAuth 設定使用
      `minimax-portal/...`。
    - 更多詳細資料：[MiniMax](/zh-TW/providers/minimax)
    - **StepFun**：會為中國或全球端點上的 StepFun 標準版或 Step Plan 自動寫入設定。
    - 標準版目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    - 更多詳細資料：[StepFun](/zh-TW/providers/stepfun)
    - **Synthetic（Anthropic 相容）**：提示輸入 `SYNTHETIC_API_KEY`。
    - 更多詳細資料：[Synthetic](/zh-TW/providers/synthetic)
    - **Moonshot (Kimi K2)**：設定會自動寫入。
    - **Kimi Coding**：設定會自動寫入。
    - 更多詳細資料：[Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)
    - **略過**：尚未設定驗證。
    - 從偵測到的選項中挑選預設模型（或手動輸入提供者/模型）。為獲得最佳品質並降低提示注入風險，請選擇你的提供者堆疊中可用的最強最新世代模型。
    - 入門設定會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。
    - API 金鑰儲存模式預設為純文字驗證設定檔值。使用 `--secret-input-mode ref` 可改為儲存由環境支援的參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 驗證設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 金鑰 + OAuth）。`~/.openclaw/credentials/oauth.json` 是舊版僅匯入來源。
    - 更多詳細資料：[/concepts/oauth](/zh-TW/concepts/oauth)
    <Note>
    無介面/伺服器提示：在有瀏覽器的機器上完成 OAuth，然後複製
    該 agent 的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或對應的
    `$OPENCLAW_STATE_DIR/...` 路徑）到 Gateway 主機。`credentials/oauth.json`
    只是舊版匯入來源。
    </Note>
  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 植入 agent bootstrap ritual 所需的工作區檔案。
    - 完整工作區配置 + 備份指南：[Agent 工作區](/zh-TW/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - 連接埠、繫結、驗證模式、Tailscale 暴露。
    - 驗證建議：即使是 loopback 也保留 **Token**，讓本機 WS 用戶端必須驗證。
    - 在 token 模式中，互動式設定提供：
      - **產生/儲存純文字 token**（預設）
      - **使用 SecretRef**（選擇加入）
      - 快速入門會重用跨 `env`、`file` 和 `exec` 提供者的現有 `gateway.auth.token` SecretRefs，用於入門設定探測/儀表板 bootstrap。
      - 如果該 SecretRef 已設定但無法解析，入門設定會及早失敗並顯示清楚的修正訊息，而不是默默降低 runtime 驗證等級。
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 需要入門設定程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 搭配使用。
    - 只有在你完全信任每個本機程序時，才停用驗證。
    - 非 loopback 繫結仍需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入。
    - [Telegram](/zh-TW/channels/telegram)：bot token。
    - [Discord](/zh-TW/channels/discord)：bot token。
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + webhook audience。
    - [Mattermost](/zh-TW/channels/mattermost) (plugin)：bot token + 基底 URL。
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定。
    - [iMessage](/zh-TW/channels/imessage)：`imsg` CLI 路徑 + Messages DB 存取權；當 Gateway 在非 Mac 上執行時，請使用 SSH 包裝器。
    - DM 安全性：預設為配對。第一則 DM 會傳送一組代碼；透過 `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。

  </Step>
  <Step title="網頁搜尋">
    - 選擇支援的提供者，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily（或略過）。
    - API 支援的提供者可使用環境變數或現有設定進行快速設定；免金鑰提供者則使用其提供者特定的先決條件。
    - 使用 `--skip-search` 略過。
    - 稍後設定：`openclaw configure --section web`。

  </Step>
  <Step title="Daemon 安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無介面環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux（以及透過 WSL2 的 Windows）：systemd 使用者單元
      - 入門設定會嘗試透過 `loginctl enable-linger <user>` 啟用 lingering，讓 Gateway 在登出後保持執行。
      - 可能提示 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - **Runtime 選擇：**Node（建議；WhatsApp/Telegram 必要）。不建議使用 Bun。
    - 如果 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將解析後的純文字 token 值保存到 supervisor 服務環境中繼資料。
    - 如果 token 驗證需要 token，且設定的 token SecretRef 未解析，daemon 安裝會被封鎖並提供可操作的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，daemon 安裝會被封鎖，直到明確設定模式為止。

  </Step>
  <Step title="健康檢查">
    - 啟動 Gateway（如有需要）並執行 `openclaw health`。
    - 提示：`openclaw status --deep` 會將即時 Gateway 健康探測加入狀態輸出，包括支援時的頻道探測（需要可連線的 Gateway）。

  </Step>
  <Step title="Skills（建議）">
    - 讀取可用 Skills 並檢查需求。
    - 讓你選擇 Node 管理器：**npm / pnpm**（不建議 bun）。
    - 安裝選用相依套件（有些會在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要 + 後續步驟，包括 **How do you want to hatch your agent?** 提示，可選 Terminal、Browser 或稍後。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，入門設定會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，入門設定會嘗試建置它們；備援方式是 `pnpm ui:build`（會自動安裝 UI 相依套件）。
</Note>

## 非互動式模式

使用 `--non-interactive` 自動化或編寫入門設定腳本：

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

加入 `--json` 可取得機器可讀的摘要。

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
`--json` **不**代表非互動式模式。腳本請使用 `--non-interactive`（和 `--workspace`）。
</Note>

提供者特定的命令範例位於 [CLI 自動化](/zh-TW/start/wizard-cli-automation#provider-specific-examples)。
使用此參考頁了解旗標語意和步驟順序。

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

Gateway 透過 RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）公開入門設定流程。
用戶端（macOS app、Control UI）可以呈現步驟，而不需要重新實作入門設定邏輯。

## Signal 設定（signal-cli）

入門設定可以從 GitHub releases 安裝 `signal-cli`：

- 下載適當的 release 資產。
- 將其儲存在 `~/.openclaw/tools/signal-cli/<version>/`。
- 將 `channels.signal.cliPath` 寫入你的設定。

注意事項：

- JVM 建置需要 **Java 21**。
- 可用時會使用原生建置。
- Windows 使用 WSL2；signal-cli 安裝會在 WSL 內依照 Linux 流程進行。

## 精靈會寫入什麼

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（若選擇 Minimax）
- `tools.profile`（未設定時，本機導覽設定預設為 `"coding"`；會保留現有的明確值）
- `gateway.*`（模式、繫結、驗證、tailscale）
- `session.dmScope`（行為詳細資訊：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 在提示期間選擇加入時的頻道允許清單（Slack/Discord/Matrix/Microsoft Teams）（名稱會在可行時解析為 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定仍可透過直接設定 `skills.install.nodeManager` 來使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 憑證會放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
工作階段會儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

有些頻道會以 Plugin 形式提供。當你在設定期間選取其中一個時，導覽設定會提示你先安裝它（npm 或本機路徑），之後才能設定。

## 相關文件

- 導覽設定總覽：[導覽設定 (CLI)](/zh-TW/start/wizard)
- macOS 應用程式導覽設定：[導覽設定](/zh-TW/start/onboarding)
- 設定參考：[Gateway 設定](/zh-TW/gateway/configuration)
- 提供者：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)、[Google Chat](/zh-TW/channels/googlechat)、[Signal](/zh-TW/channels/signal)、[iMessage](/zh-TW/channels/imessage)
- Skills：[Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)
