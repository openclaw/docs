---
read_when:
    - 查詢特定的入門設定步驟或旗標
    - 使用非互動模式自動化入門設定
    - 偵錯入門設定行為
sidebarTitle: Onboarding Reference
summary: 命令列介面入門設定完整參考：每個步驟、旗標和設定欄位
title: 入門設定參考
x-i18n:
    generated_at: "2026-06-27T20:02:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

這是 `openclaw onboard` 的完整參考。
如需高階概觀，請參閱[入門設定（命令列介面）](/zh-TW/start/wizard)。

## 流程詳細資訊（本機模式）

<Steps>
  <Step title="現有設定偵測">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇**保留目前值**、**檢閱並更新**，或**設定前重設**。
    - 重新執行入門設定**不會**清除任何內容，除非你明確選擇**重設**
      （或傳入 `--reset`）。
    - 命令列介面 `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full`
      也會移除工作區。
    - 如果設定無效或包含舊版鍵，精靈會停止並要求
      你先執行 `openclaw doctor` 再繼續。
    - 重設會使用 `trash`（絕不使用 `rm`），並提供以下範圍：
      - 僅設定
      - 設定 + 認證 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型/驗證">
    - **Anthropic API 金鑰**：若存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供 daemon 使用。
    - **Anthropic API 金鑰**：入門設定/配置中偏好的 Anthropic 助理選擇。
    - **Anthropic setup-token**：入門設定/配置中仍可使用，不過 OpenClaw 現在會在可用時偏好重用 Claude CLI。
    - **OpenAI Code (Codex) 訂閱（OAuth）**：瀏覽器流程；貼上 `code#state`。
      - 當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **OpenAI Code (Codex) 訂閱（裝置配對）**：使用短效裝置代碼的瀏覽器配對流程。
      - 當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **OpenAI API 金鑰**：若存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將它儲存在驗證設定檔中。
      - 當模型未設定、為 `openai/*`，或為舊版 Codex 模型參照時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **xAI (Grok) OAuth / API 金鑰**：選擇時使用 xAI OAuth 登入，或在 API 金鑰路徑提示輸入 `XAI_API_KEY`，並將 xAI 配置為模型提供者。
    - **OpenCode**：提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 取得），並讓你挑選 Zen 或 Go 目錄。
    - **Ollama**：先提供 **Cloud + Local**、**Cloud only** 或 **Local only**。`Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並使用 `https://ollama.com`；由主機支援的模式會提示輸入 Ollama 基底 URL、探索可用模型，並在需要時自動拉取選取的本機模型；`Cloud + Local` 也會檢查該 Ollama 主機是否已登入雲端存取。
    - 更多詳細資訊：[Ollama](/zh-TW/providers/ollama)
    - **API 金鑰**：為你儲存金鑰。
    - **Vercel AI 閘道（多模型代理）**：提示輸入 `AI_GATEWAY_API_KEY`。
    - 更多詳細資訊：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
    - **Cloudflare AI 閘道**：提示輸入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多詳細資訊：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
    - **MiniMax**：設定會自動寫入；託管預設值為 `MiniMax-M3`。
      API 金鑰設定使用 `minimax/...`，OAuth 設定使用
      `minimax-portal/...`。
    - 更多詳細資訊：[MiniMax](/zh-TW/providers/minimax)
    - **StepFun**：會針對中國或全球端點上的 StepFun standard 或 Step Plan 自動寫入設定。
    - Standard 目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    - 更多詳細資訊：[StepFun](/zh-TW/providers/stepfun)
    - **Synthetic（Anthropic 相容）**：提示輸入 `SYNTHETIC_API_KEY`。
    - 更多詳細資訊：[Synthetic](/zh-TW/providers/synthetic)
    - **Moonshot (Kimi K2)**：設定會自動寫入。
    - **Kimi Coding**：設定會自動寫入。
    - 更多詳細資訊：[Moonshot AI (Kimi + Kimi Coding)](/zh-TW/providers/moonshot)
    - **略過**：尚未配置驗證。
    - 從偵測到的選項中挑選預設模型（或手動輸入提供者/模型）。為了最佳品質與較低的提示注入風險，請選擇你的提供者堆疊中可用的最強最新世代模型。
    - 入門設定會執行模型檢查，並在已配置模型未知或缺少驗證時提出警告。
    - API 金鑰儲存模式預設為明文驗證設定檔值。使用 `--secret-input-mode ref` 可改為儲存由環境支援的參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 驗證設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 金鑰 + OAuth）。`~/.openclaw/credentials/oauth.json` 是僅供匯入的舊版來源。
    - 更多詳細資訊：[/concepts/oauth](/zh-TW/concepts/oauth)
    <Note>
    無頭/伺服器提示：在有瀏覽器的機器上完成 OAuth，然後複製
    該代理的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
    `$OPENCLAW_STATE_DIR/...` 路徑）到閘道主機。`credentials/oauth.json`
    只是舊版匯入來源。
    </Note>
  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可配置）。
    - 植入代理啟動儀式所需的工作區檔案。
    - 完整工作區版面 + 備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

  </Step>
  <Step title="閘道">
    - 連接埠、繫結、驗證模式、Tailscale 暴露。
    - 驗證建議：即使是回送也保留 **Token**，讓本機 WS 用戶端必須驗證。
    - 在 token 模式下，互動式設定提供：
      - **產生/儲存明文 token**（預設）
      - **使用 SecretRef**（選擇加入）
      - Quickstart 會重用跨 `env`、`file` 和 `exec` 提供者的現有 `gateway.auth.token` SecretRefs，用於入門設定探測/儀表板啟動。
      - 如果該 SecretRef 已配置但無法解析，入門設定會提早失敗並顯示清楚的修復訊息，而不是悄悄降級執行階段驗證。
    - 在密碼模式下，互動式設定也支援明文或 SecretRef 儲存。
    - 非互動式 token SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 需要入門設定程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時才停用驗證。
    - 非回送繫結仍需要驗證。

  </Step>
  <Step title="通道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入。
    - [Telegram](/zh-TW/channels/telegram)：Bot token。
    - [Discord](/zh-TW/channels/discord)：Bot token。
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子 audience。
    - [Mattermost](/zh-TW/channels/mattermost)（外掛）：Bot token + 基底 URL。
    - [Signal](/zh-TW/channels/signal)：選用 `signal-cli` 安裝 + 帳戶設定。
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages DB 存取；當閘道不在 Mac 上執行時，請使用 SSH 包裝器。
    - DM 安全性：預設為配對。第一則 DM 會傳送代碼；透過 `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。

  </Step>
  <Step title="網頁搜尋">
    - 挑選支援的提供者，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily（或略過）。
    - API 支援的提供者可使用環境變數或現有設定快速設定；免金鑰提供者則使用其提供者特定的先決條件。
    - 使用 `--skip-search` 略過。
    - 稍後配置：`openclaw configure --section web`。

  </Step>
  <Step title="Daemon 安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux（以及透過 WSL2 的 Windows）：systemd 使用者單元
      - 入門設定會嘗試透過 `loginctl enable-linger <user>` 啟用 lingering，讓閘道在登出後仍保持執行。
      - 可能提示使用 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - **執行階段選擇：** 節點（建議；WhatsApp/Telegram 必要）。Bun **不建議**。
    - 如果 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將已解析的明文 token 值持久化到 supervisor 服務環境中繼資料。
    - 如果 token 驗證需要 token，且已配置的 token SecretRef 未解析，daemon 安裝會被阻擋並提供可操作的指引。
    - 如果同時配置 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，daemon 安裝會被阻擋，直到明確設定模式。

  </Step>
  <Step title="健康檢查">
    - 啟動閘道（如需要）並執行 `openclaw health`。
    - 提示：`openclaw status --deep` 會將即時閘道健康探測新增到狀態輸出，支援時也包含通道探測（需要可連線的閘道）。

  </Step>
  <Step title="Skills（建議）">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇節點管理器：**npm / pnpm**（不建議 bun）。
    - 安裝選用相依套件（部分在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要 + 後續步驟，包括針對 Terminal、Browser 或稍後的 **How do you want to hatch your agent?** 提示。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，入門設定會列印 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，入門設定會嘗試建置它們；後備為 `pnpm ui:build`（自動安裝 UI 相依套件）。
</Note>

## 非互動式模式

使用 `--non-interactive` 自動化或撰寫入門設定腳本：

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

加入 `--json` 以取得機器可讀摘要。

非互動式模式中的閘道 token SecretRef：

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
`--json` **不**代表非互動式模式。腳本請使用 `--non-interactive`（以及 `--workspace`）。
</Note>

提供者特定命令範例位於[命令列介面自動化](/zh-TW/start/wizard-cli-automation#provider-specific-examples)。
請使用此參考頁了解旗標語意與步驟順序。

### 新增代理（非互動式）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## 閘道精靈 RPC

閘道透過 RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）公開入門設定流程。
用戶端（macOS app、Control UI）可以呈現步驟，而不必重新實作入門設定邏輯。

## Signal 設定（signal-cli）

入門設定可以從 GitHub releases 安裝 `signal-cli`：

- 下載適當的 release 資產。
- 將它儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 將 `channels.signal.cliPath` 寫入你的設定。

注意事項：

- JVM 建置需要 **Java 21**。
- 可用時會使用原生建置。
- Windows 使用 WSL2；signal-cli 安裝會在 WSL 內遵循 Linux 流程。

## 精靈寫入的內容

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（未設定時，本機入門設定預設為 `"coding"`；會保留現有的明確值）
- `gateway.*`（模式、繫結、驗證、tailscale）
- `session.dmScope`（行為詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 當你在提示中選擇加入時的頻道允許清單（Slack/Discord/Matrix/Microsoft Teams）（可行時名稱會解析為 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定仍可透過直接設定 `skills.install.nodeManager` 使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 憑證會放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
工作階段會儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

部分頻道會以外掛形式交付。當你在設定期間選擇其中一個時，入門設定
會提示你先安裝它（npm 或本機路徑），然後才能設定。

## 相關文件

- 入門設定概覽：[入門設定（命令列介面）](/zh-TW/start/wizard)
- macOS 應用程式入門設定：[入門設定](/zh-TW/start/onboarding)
- 設定參考：[閘道設定](/zh-TW/gateway/configuration)
- 供應商：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)、[Google Chat](/zh-TW/channels/googlechat)、[Signal](/zh-TW/channels/signal)、[iMessage](/zh-TW/channels/imessage)
- Skills：[Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)
