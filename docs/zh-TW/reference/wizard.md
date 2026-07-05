---
read_when:
    - 查找特定的入門設定步驟或旗標
    - 使用非互動模式自動化入門設定
    - 偵錯入門設定行為
sidebarTitle: Onboarding Reference
summary: 命令列介面入門設定完整參考：每個步驟、旗標和設定欄位
title: 入門設定參考
x-i18n:
    generated_at: "2026-07-05T11:42:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1f85ca510c55ad572ce7595faebe4461567785b18851914a5f7818615c517a3
    source_path: reference/wizard.md
    workflow: 16
---

這是 `openclaw onboard` 的完整參考。
如需高階概覽，請參閱 [入門設定（命令列介面）](/zh-TW/start/wizard)。如需逐步
行為與輸出，請參閱 [命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。

## 流程詳細資料（本機模式）

<Steps>
  <Step title="重設（選用）">
    - `--reset` 會在設定執行前重設狀態；若未使用，重新執行入門設定
      會保留既有設定並將其重用為預設值。
    - `--reset-scope` 控制 `--reset` 移除的內容：`config`（僅設定檔）、
      `config+creds+sessions`（預設），或 `full`（也會移除工作區）。
    - 如果設定檔無效，入門設定會停止，並要求你先執行
      `openclaw doctor`，再重新執行設定。
    - 重設會將狀態移到垃圾桶（絕不直接刪除）。

  </Step>
  <Step title="風險確認">
    - 首次執行（或在設定 `wizard.securityAcknowledgedAt` 前的任何執行）
      會要求你確認已了解代理程式能力強大，且完整系統存取權具有風險。
    - `--non-interactive` 必須明確搭配 `--accept-risk`；若未提供，
      入門設定會以錯誤結束，而不是顯示提示。
    - 互動式執行會顯示確認提示，而不是使用旗標；拒絕會取消設定。

  </Step>
  <Step title="模型/驗證">
    - **Anthropic API 金鑰**：若存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供常駐程式使用。
    - **Anthropic Claude 命令列介面**：當已存在 Claude 命令列介面登入時，這是偏好的本機路徑；OpenClaw 仍支援 Anthropic 設定權杖驗證作為替代方案。
    - **OpenAI Code (Codex) 訂閱（OAuth）**：瀏覽器流程；貼上 `code#state`。
      - 當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **OpenAI Code (Codex) 訂閱（裝置配對）**：使用短效裝置碼的瀏覽器配對流程。
      - 當模型未設定或已是 OpenAI 系列時，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **OpenAI API 金鑰**：若存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後將其儲存在驗證設定檔中。
      - 當模型未設定、為 `openai/*`，或為舊版 Codex 模型參照時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **xAI OAuth**：裝置碼瀏覽器登入，不需要 localhost 回呼，因此也可透過 SSH/Docker/VPS 使用（`--auth-choice xai-oauth`）。
    - **xAI API 金鑰**：提示輸入 `XAI_API_KEY`（`--auth-choice xai-api-key`）。
    - `--auth-choice xai-device-code` 仍可作為相同 xAI OAuth 裝置碼流程的僅手動相容性別名使用；新腳本請使用 `xai-oauth`。
    - **OpenCode**：提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 取得），並讓你選擇 Zen 或 Go 目錄。
    - **Ollama**：會先提供 **Cloud + Local**、**Cloud only** 或 **Local only**。`Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並使用 `https://ollama.com`；主機支援模式會提示輸入 Ollama 基底 URL（預設 `http://127.0.0.1:11434`）、探索可用模型，並在需要時自動拉取所選本機模型；`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以使用雲端存取。
    - 更多詳細資料：[Ollama](/zh-TW/providers/ollama)
    - **API 金鑰**：替你儲存金鑰。
    - **Vercel AI 閘道（多模型代理）**：提示輸入 `AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Vercel AI 閘道](/zh-TW/providers/vercel-ai-gateway)
    - **Cloudflare AI 閘道**：提示輸入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Cloudflare AI 閘道](/zh-TW/providers/cloudflare-ai-gateway)
    - **MiniMax**：設定會自動寫入；託管預設值為 `MiniMax-M3`。
      API 金鑰設定會使用 `minimax/...`，OAuth 設定會使用
      `minimax-portal/...`。
    - 更多詳細資料：[MiniMax](/zh-TW/providers/minimax)
    - **StepFun**：會為中國或全球端點上的 StepFun standard 或 Step Plan 自動寫入設定。
    - Standard 目前預設為 `step-3.5-flash`；Step Plan 也包含 `step-3.5-flash-2603`。
    - 更多詳細資料：[StepFun](/zh-TW/providers/stepfun)
    - **Synthetic（Anthropic 相容）**：提示輸入 `SYNTHETIC_API_KEY`。
    - 更多詳細資料：[Synthetic](/zh-TW/providers/synthetic)
    - **Moonshot (Kimi K2)**：設定會自動寫入。
    - **Kimi Coding**：設定會自動寫入。
    - 更多詳細資料：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)
    - **自訂提供者**：可搭配 OpenAI 相容、OpenAI Responses 相容或 Anthropic 相容端點使用。非互動式旗標：`--auth-choice custom-api-key`、`--custom-base-url`、`--custom-model-id`、`--custom-api-key`（選用；會退回使用 `CUSTOM_API_KEY`）、`--custom-provider-id`（選用；會從基底 URL 自動衍生）、`--custom-compatibility openai|openai-responses|anthropic`（預設 `openai`）、`--custom-image-input` / `--custom-text-input`（覆寫推斷出的視覺模型偵測）。
    - **略過**：尚未設定驗證。
    - 從偵測到的選項中挑選預設模型（或手動輸入提供者/模型）。為了最佳品質並降低提示注入風險，請選擇提供者堆疊中可用的最強新世代模型。
    - 入門設定會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。
    - API 金鑰儲存模式預設為純文字驗證設定檔值。請使用 `--secret-input-mode ref` 改為儲存環境變數支援的參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）；參照的環境變數必須已設定，否則入門設定會快速失敗。
    - 驗證設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 金鑰 + OAuth）。`~/.openclaw/credentials/oauth.json` 僅供舊版匯入。
    - 更多詳細資料：[OAuth](/zh-TW/concepts/oauth)
    <Note>
    無頭/伺服器提示：在有瀏覽器的機器上完成 OAuth，然後將
    該代理程式的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
    `$OPENCLAW_STATE_DIR/...` 路徑）複製到閘道主機。`credentials/oauth.json`
    僅是舊版匯入來源。
    </Note>
  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 植入代理程式啟動儀式所需的工作區檔案。
    - 完整工作區版面 + 備份指南：[代理程式工作區](/zh-TW/concepts/agent-workspace)

  </Step>
  <Step title="閘道">
    - 連接埠（預設 **18789**）、繫結、驗證模式、tailscale 曝露。
    - 驗證建議：即使是 loopback 也保留 **權杖**，讓本機 WS 用戶端必須驗證。
    - 在權杖模式中，互動式設定提供：
      - **產生/儲存純文字權杖**（預設）
      - **使用 SecretRef**（選擇加入）
      - Quickstart 會跨 `env`、`file` 和 `exec` 提供者重用既有的 `gateway.auth.token` SecretRef，用於入門設定探測/儀表板啟動。
      - 如果已設定該 SecretRef 但無法解析，入門設定會提前失敗並顯示清楚的修正訊息，而不是悄悄降低執行階段驗證強度。
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求入門設定處理程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機處理程序時，才停用驗證。
    - 非 loopback 繫結仍需要驗證。

  </Step>
  <Step title="通道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用 QR 登入。
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖。
    - [Discord](/zh-TW/channels/discord)：機器人權杖。
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + webhook audience。
    - [Mattermost](/zh-TW/channels/mattermost)（外掛）：機器人權杖 + 基底 URL。
    - [Signal](/zh-TW/channels/signal)（外掛）：選用 `signal-cli` 安裝 + 帳戶設定。
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages 資料庫存取；當閘道在 Mac 之外執行時，請使用 SSH 包裝器。
    - Discord、Feishu、Microsoft Teams、QQ Bot、Slack 和其他通道會以
      外掛形式提供，入門設定可替你安裝。完整目錄：[通道](/zh-TW/channels)。
    - 私訊安全性：預設為配對。第一則私訊會傳送代碼；透過 `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。

  </Step>
  <Step title="網頁搜尋">
    - 選擇支援的提供者，例如 Brave、Codex（Hosted Search）、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Parallel、Perplexity、SearXNG 或 Tavily（或略過）。
    - API 支援的提供者可使用環境變數或既有設定來快速設定；免金鑰提供者則使用其提供者專屬前置需求。
    - 使用 `--skip-search` 略過。
    - 稍後設定：`openclaw configure --section web`。

  </Step>
  <Step title="常駐程式安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux（以及透過 WSL2 的 Windows）：systemd 使用者單元
      - 入門設定會嘗試透過 `loginctl enable-linger <user>` 啟用 lingering，讓閘道在登出後仍維持執行。
      - 可能提示 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排程工作；如果建立工作被拒絕，OpenClaw 會退回到每使用者 Startup 資料夾登入項目，並立即啟動閘道。
    - **執行階段選擇：**節點（建議；WhatsApp/Telegram 必要，Bun 在重新連線時可能損毀記憶體）。互動式只提供節點；`--daemon-runtime bun` 僅限命令列介面使用。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，常駐程式安裝會驗證它，但不會將已解析的純文字權杖值持久化到監督服務環境中繼資料。
    - 如果權杖驗證需要權杖，且設定的權杖 SecretRef 未解析，常駐程式安裝會被封鎖並提供可操作的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，常駐程式安裝會被封鎖，直到明確設定模式。

  </Step>
  <Step title="健康檢查">
    - 啟動閘道（如需要）並執行 `openclaw health`。
    - 提示：`openclaw status --deep` 會將即時閘道健康探測加入狀態輸出，包括支援時的通道探測（需要可連線的閘道）。

  </Step>
  <Step title="Skills（建議）">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇節點管理器：**npm / pnpm / bun**。
    - 自動安裝受信任隨附 Skills 的選用相依項（有些會在 macOS 上使用 Homebrew）。
    - 略過 Homebrew、uv 或 Go 安裝程式前置需求不可用的 Skills，將其與手動設定指引分組，並在安裝前置需求後引導你使用 `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 摘要 + 後續步驟，包括用於 Terminal、Browser 或稍後的 **你想如何孵化你的代理程式？** 提示。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，入門設定會印出 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，入門設定會嘗試建置它們；退回方案是 `pnpm ui:build`（會自動安裝 UI 相依項）。
</Note>

## 非互動式模式

使用 `--non-interactive --accept-risk` 來自動化或編寫入門設定腳本（該
旗標是必要的風險確認；若未提供，入門設定會以錯誤
結束）：

```bash
openclaw onboard --non-interactive --accept-risk \
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

非互動式模式中的閘道權杖 SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 與 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不會**隱含非互動模式。請在腳本中使用 `--non-interactive --accept-risk`（以及 `--workspace`）。
</Note>

提供者專屬命令範例位於 [命令列介面自動化](/zh-TW/start/wizard-cli-automation#provider-specific-examples)。
請使用此參考頁面了解旗標語義與步驟順序。

### 新增代理程式（非互動）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` 是保留的代理程式 ID，不能用於 `openclaw agents add`。

## 閘道精靈 RPC

閘道透過 RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）公開入門設定流程。
用戶端（macOS 應用程式、控制介面）可以呈現步驟，而不必重新實作入門設定邏輯。

## Signal 設定（signal-cli）

入門設定會偵測 `signal-cli` 是否位於 `PATH`，如果缺少，會提議安裝：

- Linux x86-64：從 `signal-cli` GitHub 發行版本下載官方原生 GraalVM 建置，並儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- macOS 和其他架構：改用 Homebrew 安裝。
- 原生 Windows：尚未支援；請在 WSL2 內執行入門設定，以取得 Linux 安裝路徑。
- 無論哪種方式，都會將 `channels.signal.cliPath` 寫入你的設定。

## 精靈會寫入什麼

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（本機入門設定在未設定時預設為 `"coding"`；既有的明確值會保留）
- `gateway.*`（模式、繫結、驗證、tailscale）
- `session.dmScope`（本機入門設定在未設定時預設為 `"per-channel-peer"`；既有的明確值會保留。詳細資訊：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 在頻道提示中選擇加入時的頻道 DM 允許清單。Discord、Matrix、Microsoft Teams 和 Slack 會盡可能將名稱解析為 ID；其他頻道則直接使用 ID（例如數字 Telegram 傳送者 ID 或 WhatsApp 電話號碼）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定仍可透過直接設定 `skills.install.nodeManager` 來使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 認證資料位於 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
工作階段儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

有些頻道是以外掛形式提供。當你在設定期間選擇其中一個時，入門設定
會先提示你安裝它（npm 或本機路徑），然後才能進行設定。

## 相關文件

- 入門設定概觀：[入門設定（命令列介面）](/zh-TW/start/wizard)
- 命令列介面設定參考：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)
- macOS 應用程式入門設定：[入門設定](/zh-TW/start/onboarding)
- 設定參考：[閘道設定](/zh-TW/gateway/configuration)
- 提供者：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)、[Google Chat](/zh-TW/channels/googlechat)、[Signal](/zh-TW/channels/signal)、[iMessage](/zh-TW/channels/imessage)
- Skills：[Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)
