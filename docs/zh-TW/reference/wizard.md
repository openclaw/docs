---
read_when:
    - 查詢特定的入門引導步驟或旗標
    - 使用非互動模式自動化入門設定
    - 偵錯入門流程行為
sidebarTitle: Onboarding Reference
summary: CLI 入門設定的完整參考：每個步驟、旗標與設定欄位
title: 入門參考
x-i18n:
    generated_at: "2026-05-06T09:19:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

這是 `openclaw onboard` 的完整參考。
如需高階概覽，請參閱 [入門設定（CLI）](/zh-TW/start/wizard)。

## 流程詳情（本機模式）

<Steps>
  <Step title="現有設定偵測">
    - 如果 `~/.openclaw/openclaw.json` 存在，請選擇 **保留 / 修改 / 重設**。
    - 重新執行入門設定**不會**清除任何內容，除非你明確選擇 **重設**
      （或傳入 `--reset`）。
    - CLI `--reset` 預設為 `config+creds+sessions`；使用 `--reset-scope full`
      也會移除工作區。
    - 如果設定無效或包含舊版鍵，精靈會停止並要求你先執行
      `openclaw doctor` 再繼續。
    - 重設會使用 `trash`（絕不使用 `rm`），並提供以下範圍：
      - 僅設定
      - 設定 + 認證資料 + 工作階段
      - 完整重設（也會移除工作區）

  </Step>
  <Step title="模型/驗證">
    - **Anthropic API 金鑰**：如果存在則使用 `ANTHROPIC_API_KEY`，否則提示輸入金鑰，然後儲存供 daemon 使用。
    - **Anthropic API 金鑰**：入門設定/設定中的 Anthropic 助理偏好選項。
    - **Anthropic setup-token**：仍可在入門設定/設定中使用，但 OpenClaw 現在會在可用時優先重用 Claude CLI。
    - **OpenAI Code (Codex) 訂閱（OAuth）**：瀏覽器流程；貼上 `code#state`。
      - 當模型未設定或已是 OpenAI 系列時，將 `agents.defaults.model` 設為 `openai-codex/gpt-5.5`。
    - **OpenAI Code (Codex) 訂閱（裝置配對）**：使用短效裝置代碼的瀏覽器配對流程。
      - 當模型未設定或已是 OpenAI 系列時，將 `agents.defaults.model` 設為 `openai-codex/gpt-5.5`。
    - **OpenAI API 金鑰**：如果存在則使用 `OPENAI_API_KEY`，否則提示輸入金鑰，然後儲存在驗證設定檔中。
      - 當模型未設定、為 `openai/*`，或為 `openai-codex/*` 時，將 `agents.defaults.model` 設為 `openai/gpt-5.5`。
    - **xAI (Grok) API 金鑰**：提示輸入 `XAI_API_KEY`，並將 xAI 設定為模型供應者。
    - **OpenCode**：提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可在 https://opencode.ai/auth 取得），並讓你選擇 Zen 或 Go 型錄。
    - **Ollama**：先提供 **Cloud + Local**、**僅 Cloud** 或 **僅 Local**。`Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並使用 `https://ollama.com`；由主機支援的模式會提示輸入 Ollama 基底 URL、探索可用模型，並在需要時自動拉取選取的本機模型；`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取權。
    - 更多詳情：[Ollama](/zh-TW/providers/ollama)
    - **API 金鑰**：為你儲存金鑰。
    - **Vercel AI Gateway（多模型代理）**：提示輸入 `AI_GATEWAY_API_KEY`。
    - 更多詳情：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示輸入帳戶 ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多詳情：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
    - **MiniMax**：會自動寫入設定；託管預設值為 `MiniMax-M2.7`。
      API 金鑰設定使用 `minimax/...`，OAuth 設定使用
      `minimax-portal/...`。
    - 更多詳情：[MiniMax](/zh-TW/providers/minimax)
    - **StepFun**：會自動寫入 StepFun 標準或 Step Plan 設定，可使用中國或全球端點。
    - 標準目前包含 `step-3.5-flash`，Step Plan 也包含 `step-3.5-flash-2603`。
    - 更多詳情：[StepFun](/zh-TW/providers/stepfun)
    - **Synthetic（相容 Anthropic）**：提示輸入 `SYNTHETIC_API_KEY`。
    - 更多詳情：[Synthetic](/zh-TW/providers/synthetic)
    - **Moonshot (Kimi K2)**：會自動寫入設定。
    - **Kimi Coding**：會自動寫入設定。
    - 更多詳情：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)
    - **略過**：尚未設定驗證。
    - 從偵測到的選項中挑選預設模型（或手動輸入供應者/模型）。為了最佳品質並降低提示注入風險，請選擇你的供應者堆疊中可用的最強最新世代模型。
    - 入門設定會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。
    - API 金鑰儲存模式預設為純文字驗證設定檔值。改用 `--secret-input-mode ref` 可儲存由環境支援的參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 驗證設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 金鑰 + OAuth）。`~/.openclaw/credentials/oauth.json` 僅供舊版匯入使用。
    - 更多詳情：[/concepts/oauth](/zh-TW/concepts/oauth)
    <Note>
    無介面/伺服器提示：在有瀏覽器的機器上完成 OAuth，然後將
    該 agent 的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
    `$OPENCLAW_STATE_DIR/...` 路徑）複製到 Gateway 主機。`credentials/oauth.json`
    僅是舊版匯入來源。
    </Note>
  </Step>
  <Step title="工作區">
    - 預設 `~/.openclaw/workspace`（可設定）。
    - 植入 agent 啟動儀式所需的工作區檔案。
    - 完整工作區配置 + 備份指南：[Agent 工作區](/zh-TW/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - 連接埠、繫結、驗證模式、Tailscale 暴露。
    - 驗證建議：即使是迴圈位址也保留 **Token**，讓本機 WS 用戶端必須驗證。
    - 在權杖模式中，互動式設定提供：
      - **產生/儲存純文字權杖**（預設）
      - **使用 SecretRef**（選擇啟用）
      - 快速入門會在 `env`、`file` 和 `exec` 供應者之間，重用現有的 `gateway.auth.token` SecretRef，用於入門設定探測/儀表板啟動。
      - 如果該 SecretRef 已設定但無法解析，入門設定會提早失敗並顯示明確修正訊息，而不是悄悄降低執行階段驗證等級。
    - 在密碼模式中，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 需要入門設定程序環境中有非空的環境變數。
      - 不能與 `--gateway-token` 合併使用。
    - 只有在你完全信任每個本機程序時，才停用驗證。
    - 非迴圈位址繫結仍需要驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：可選 QR 登入。
    - [Telegram](/zh-TW/channels/telegram)：bot 權杖。
    - [Discord](/zh-TW/channels/discord)：bot 權杖。
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + webhook audience。
    - [Mattermost](/zh-TW/channels/mattermost)（Plugin）：bot 權杖 + 基底 URL。
    - [Signal](/zh-TW/channels/signal)：可選 `signal-cli` 安裝 + 帳戶設定。
    - [BlueBubbles](/zh-TW/channels/bluebubbles)：**建議用於 iMessage**；伺服器 URL + 密碼 + Webhook。
    - [iMessage](/zh-TW/channels/imessage)：舊版 `imsg` CLI 路徑 + DB 存取權。
    - DM 安全性：預設為配對。第一則 DM 會傳送代碼；透過 `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。

  </Step>
  <Step title="網頁搜尋">
    - 選擇支援的供應者，例如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily（或略過）。
    - API 支援的供應者可使用環境變數或現有設定快速設定；不需要金鑰的供應者則使用其供應者專屬先決條件。
    - 使用 `--skip-search` 略過。
    - 稍後設定：`openclaw configure --section web`。

  </Step>
  <Step title="Daemon 安裝">
    - macOS：LaunchAgent
      - 需要已登入的使用者工作階段；無介面環境請使用自訂 LaunchDaemon（未隨附）。
    - Linux（以及透過 WSL2 的 Windows）：systemd 使用者單元
      - 入門設定會嘗試透過 `loginctl enable-linger <user>` 啟用 lingering，讓 Gateway 在登出後仍保持運作。
      - 可能提示使用 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - **執行階段選擇：**Node（建議；WhatsApp/Telegram 必要）。不建議使用 Bun。
    - 如果權杖驗證需要權杖且 `gateway.auth.token` 由 SecretRef 管理，daemon 安裝會驗證它，但不會將解析後的純文字權杖值持久化到 supervisor 服務環境中繼資料。
    - 如果權杖驗證需要權杖且設定的權杖 SecretRef 未解析，daemon 安裝會遭封鎖並提供可執行的指引。
    - 如果同時設定 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，daemon 安裝會遭封鎖，直到明確設定模式。

  </Step>
  <Step title="健康檢查">
    - 啟動 Gateway（如有需要）並執行 `openclaw health`。
    - 提示：`openclaw status --deep` 會將即時 Gateway 健康探測新增到狀態輸出，包括支援時的頻道探測（需要可連線的 Gateway）。

  </Step>
  <Step title="Skills（建議）">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇 node 管理器：**npm / pnpm**（不建議使用 bun）。
    - 安裝可選相依項（有些在 macOS 上使用 Homebrew）。

  </Step>
  <Step title="完成">
    - 摘要 + 後續步驟，包括用於額外功能的 iOS/Android/macOS app。

  </Step>
</Steps>

<Note>
如果未偵測到 GUI，入門設定會印出 Control UI 的 SSH 連接埠轉送指示，而不是開啟瀏覽器。
如果缺少 Control UI 資產，入門設定會嘗試建置它們；備援為 `pnpm ui:build`（會自動安裝 UI 相依項）。
</Note>

## 非互動式模式

使用 `--non-interactive` 自動化或腳本化入門設定：

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

新增 `--json` 可取得機器可讀摘要。

非互動式模式中的 Gateway 權杖 SecretRef：

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

供應者專屬命令範例位於 [CLI 自動化](/zh-TW/start/wizard-cli-automation#provider-specific-examples)。
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

Gateway 透過 RPC 暴露入門設定流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
用戶端（macOS app、Control UI）可以呈現步驟，而不需要重新實作入門設定邏輯。

## Signal 設定（signal-cli）

入門設定可以從 GitHub releases 安裝 `signal-cli`：

- 下載適當的 release 資產。
- 將它儲存在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 將 `channels.signal.cliPath` 寫入你的設定。

注意事項：

- JVM 建置需要 **Java 21**。
- 可用時會使用原生建置。
- Windows 使用 WSL2；signal-cli 安裝會遵循 WSL 內的 Linux 流程。

## 精靈寫入的內容

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果選擇 Minimax）
- `tools.profile`（未設定時，本機入門設定預設為 `"coding"`；既有明確值會保留）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（行為詳細資訊：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 頻道允許清單（Slack/Discord/Matrix/Microsoft Teams），當你在提示中選擇加入時使用（可行時名稱會解析為 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定仍可透過直接設定 `skills.install.nodeManager` 使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 會寫入 `agents.list[]` 和選用的 `bindings`。

WhatsApp 認證資料會放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
工作階段儲存在 `~/.openclaw/agents/<agentId>/sessions/` 下。

有些頻道是以 Plugin 形式提供。當你在設定期間選擇其中一個時，入門設定會提示先安裝它（npm 或本機路徑），之後才能進行設定。

## 相關文件

- 入門設定概覽：[入門設定（CLI）](/zh-TW/start/wizard)
- macOS 應用程式入門設定：[入門設定](/zh-TW/start/onboarding)
- 設定參考：[Gateway 設定](/zh-TW/gateway/configuration)
- 提供者：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)、[Google Chat](/zh-TW/channels/googlechat)、[Signal](/zh-TW/channels/signal)、[BlueBubbles](/zh-TW/channels/bluebubbles)（iMessage）、[iMessage](/zh-TW/channels/imessage)（舊版）
- Skills：[Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)
