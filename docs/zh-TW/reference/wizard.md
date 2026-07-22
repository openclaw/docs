---
read_when:
    - 查找特定的引導設定步驟或旗標
    - 使用非互動模式自動化新手設定
    - 偵錯新手引導行為
sidebarTitle: Onboarding Reference
summary: 命令列介面初始設定完整參考：每個步驟、旗標與設定欄位
title: 新手引導參考資料
x-i18n:
    generated_at: "2026-07-22T10:48:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9535e27db7cbc151a81935b6d4242b2517483f1486dce6e900fe632eecd90576
    source_path: reference/wizard.md
    workflow: 16
---

這是 `openclaw onboard` 的完整參考資料。
如需概略說明，請參閱[初始設定（命令列介面）](/zh-TW/start/wizard)。如需逐步行為與輸出，
請參閱[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)。

## 流程詳細資料（本機模式）

<Steps>
  <Step title="重設（選用）">
    - `--reset` 會在設定執行前重設狀態；若未使用，重新執行初始設定
      會保留現有設定，並將其重複用作預設值。
    - `--reset-scope` 控制 `--reset` 移除的內容：`config`（僅設定檔）、
      `config+creds+sessions`（預設），或 `full`（也會移除
      工作區）。
    - 如果設定檔無效，初始設定會停止並指示你先執行
      `openclaw doctor`，然後重新執行設定。
    - 重設會將狀態移至垃圾桶（絕不直接刪除）。

  </Step>
  <Step title="風險確認">
    - 第一次執行（或在設定 `wizard.securityAcknowledgedAt` 前的任何一次執行）
      會要求你確認已了解代理程式功能強大，而且完整的
      系統存取權存在風險。
    - `--non-interactive` 明確要求使用 `--accept-risk`；若未使用，
      初始設定會以錯誤結束，而不會顯示提示。
    - 互動式執行會顯示確認提示，而非使用旗標；拒絕確認
      會取消設定。

  </Step>
  <Step title="模型／驗證">
    - **Anthropic API 金鑰**：若有 `ANTHROPIC_API_KEY` 則使用它，否則提示輸入金鑰，接著儲存供常駐程式使用。
    - **Anthropic Claude 命令列介面**：若已有 Claude 命令列介面登入，這是偏好的本機路徑；OpenClaw 仍支援 Anthropic 設定權杖驗證作為替代方案。
    - **OpenAI Code (Codex) 訂閱（OAuth）**：瀏覽器流程；貼上 `code#state`。
      - 在沒有主要模型的全新設定中，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.6-sol`。
    - **OpenAI Code (Codex) 訂閱（裝置配對）**：使用短效裝置代碼的瀏覽器配對流程。
      - 在沒有主要模型的全新設定中，透過 Codex 執行階段將 `agents.defaults.model` 設為 `openai/gpt-5.6-sol`。
    - **OpenAI API 金鑰**：若有 `OPENAI_API_KEY` 則使用它，否則提示輸入金鑰，接著將其儲存在驗證設定檔中。
      - 在沒有主要模型的全新設定中，將 `agents.defaults.model` 設為 `openai/gpt-5.6`；不含前綴的直接 API 模型 ID 會解析為 Sol 層級。
    - 新增或重新驗證 OpenAI 時，會保留現有的明確主要模型，包括 `openai/gpt-5.5`。如果帳戶未提供 GPT-5.6，請明確選取 `openai/gpt-5.5`；OpenClaw 不會在未告知的情況下降級模型。
    - **xAI OAuth**：使用裝置代碼的瀏覽器登入，不需要 localhost 回呼，因此也能透過 SSH／Docker／VPS 使用（`--auth-choice xai-oauth`）。
    - **xAI API 金鑰**：提示輸入 `XAI_API_KEY`（`--auth-choice xai-api-key`）。
    - `--auth-choice xai-device-code` 仍可作為相同 xAI OAuth 裝置代碼流程的僅限手動使用相容別名；新指令碼請使用 `xai-oauth`。
    - **OpenCode**：提示輸入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，可至 https://opencode.ai/auth 取得），並讓你選擇 Zen 或 Go 目錄。
    - **Ollama**：會先提供**雲端與本機**、**僅雲端**或**僅本機**。`Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並使用 `https://ollama.com`；由主機支援的模式會提示輸入 Ollama 基底 URL（預設為 `http://127.0.0.1:11434`）、探索可用模型，並在需要時自動拉取所選的本機模型；`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以存取雲端。
    - 更多詳細資料：[Ollama](/zh-TW/providers/ollama)
    - **API 金鑰**：代你儲存金鑰。
    - **Vercel AI Gateway（多模型代理）**：提示輸入 `AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示輸入 Account ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多詳細資料：[Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
    - **MiniMax**：會自動寫入設定；託管服務的預設值為 `MiniMax-M3`。
      API 金鑰設定使用 `minimax/...`，OAuth 設定則使用
      `minimax-portal/...`。
    - 更多詳細資料：[MiniMax](/zh-TW/providers/minimax)
    - **StepFun**：會針對中國或全球端點上的 StepFun 標準方案或 Step Plan 自動寫入設定。
    - 標準方案目前預設為 `step-3.5-flash`；Step Plan 也包含 `step-3.5-flash-2603`。
    - 更多詳細資料：[StepFun](/zh-TW/providers/stepfun)
    - **Synthetic（Anthropic 相容）**：提示輸入 `SYNTHETIC_API_KEY`。
    - 更多詳細資料：[Synthetic](/zh-TW/providers/synthetic)
    - **Moonshot (Kimi K2)**：會自動寫入設定。
    - **Kimi Coding**：會自動寫入設定。
    - 更多詳細資料：[Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)
    - **自訂供應商**：適用於與 OpenAI、OpenAI Responses 或 Anthropic 相容的端點。非互動式旗標：`--auth-choice custom-api-key`、`--custom-base-url`、`--custom-model-id`、`--custom-api-key`（選用；若未設定則回退至 `CUSTOM_API_KEY`）、`--custom-provider-id`（選用；從基底 URL 自動衍生）、`--custom-compatibility openai|openai-responses|anthropic`（預設為 `openai`）、`--custom-image-input`／`--custom-text-input`（覆寫推斷的視覺模型偵測）。
    - **略過**：尚未設定驗證。
    - 從偵測到的選項中選擇預設模型（或手動輸入供應商／模型）。為取得最佳品質並降低提示詞注入風險，請選擇供應商堆疊中可用的最強最新世代模型。
    - 初始設定會執行模型檢查，並在設定的模型未知或缺少驗證時發出警告。
    - API 金鑰儲存模式預設使用純文字驗證設定檔值。改用 `--secret-input-mode ref` 可儲存由環境變數支援的參照（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）；所參照的環境變數必須已設定，否則初始設定會立即失敗。
    - 驗證設定檔位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 金鑰 + OAuth）。`~/.openclaw/credentials/oauth.json` 僅供舊版匯入使用。
    - 更多詳細資料：[OAuth](/zh-TW/concepts/oauth)
    <Note>
    無頭／伺服器提示：請在有瀏覽器的電腦上完成 OAuth，然後將
    該代理程式的 `auth-profiles.json`（例如
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或相符的
    `$OPENCLAW_STATE_DIR/...` 路徑）複製到閘道主機。`credentials/oauth.json`
    僅是舊版匯入來源。
    </Note>
  </Step>
  <Step title="工作區">
    - 預設為 `~/.openclaw/workspace`（可設定）。
    - 植入代理程式啟動程序所需的工作區檔案。
    - 完整工作區配置 + 備份指南：[代理程式工作區](/zh-TW/concepts/agent-workspace)

  </Step>
  <Step title="閘道">
    - 連接埠（預設為 **18789**）、繫結、驗證模式、Tailscale 公開方式。
    - 驗證建議：即使是迴路介面也請保留**權杖**，讓本機 WS 用戶端必須通過驗證。
    - 在權杖模式下，互動式設定提供：
      - **產生／儲存純文字權杖**（預設）
      - **使用 SecretRef**（選用）
      - 快速入門會重複使用 `env`、`file` 和 `exec` 供應商中現有的 `gateway.auth.token` SecretRef，以進行初始設定探測／儀表板啟動。
      - 如果已設定該 SecretRef 但無法解析，初始設定會提早失敗並顯示清楚的修正訊息，而不會在未告知的情況下降級執行階段驗證。
    - 在密碼模式下，互動式設定也支援純文字或 SecretRef 儲存。
    - 非互動式權杖 SecretRef 路徑：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求初始設定程序環境中具有非空白的環境變數。
      - 不能與 `--gateway-token` 結合使用。
    - 只有在你完全信任每個本機程序時，才可停用驗證。
    - 非迴路介面繫結仍要求驗證。

  </Step>
  <Step title="頻道">
    - [WhatsApp](/zh-TW/channels/whatsapp)：選用的 QR 登入。
    - [Telegram](/zh-TW/channels/telegram)：機器人權杖。
    - [Discord](/zh-TW/channels/discord)：機器人權杖。
    - [Google Chat](/zh-TW/channels/googlechat)：服務帳戶 JSON + 網路鉤子受眾。
    - [Mattermost](/zh-TW/channels/mattermost)（外掛）：機器人權杖 + 基底 URL。
    - [Signal](/zh-TW/channels/signal)（外掛）：選用的 `signal-cli` 安裝 + 帳戶設定。
    - [iMessage](/zh-TW/channels/imessage)：`imsg` 命令列介面路徑 + Messages 資料庫存取權；當閘道不在 Mac 上執行時，請使用 SSH 包裝器。
    - Discord、Feishu、Microsoft Teams、QQ Bot、Slack 和其他頻道皆以
      外掛形式提供，初始設定可代你安裝。完整目錄：[頻道](/zh-TW/channels)。
    - 私訊安全性：預設為配對。第一則私訊會傳送代碼；透過 `openclaw pairing approve <channel> <code>` 核准，或使用允許清單。

  </Step>
  <Step title="網頁搜尋">
    - 選擇支援的供應商，例如 Brave、Codex（託管搜尋）、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Parallel、Perplexity、SearXNG 或 Tavily（也可略過）。
    - 由 API 支援的供應商可使用環境變數或現有設定進行快速設定；免金鑰供應商則改用其供應商專屬的先決條件。
    - 使用 `--skip-search` 略過。
    - 稍後設定：`openclaw configure --section web`。

  </Step>
  <Step title="安裝常駐程式">
    - macOS：LaunchAgent
      - 要求已登入的使用者工作階段；若為無頭環境，請使用自訂 LaunchDaemon（未隨附）。
    - Linux（以及透過 WSL2 執行的 Windows）：systemd 使用者單元
      - 初始設定會嘗試透過 `loginctl enable-linger <user>` 啟用 lingering，讓閘道在登出後保持執行。
      - 可能會提示輸入 sudo（寫入 `/var/lib/systemd/linger`）；它會先嘗試不使用 sudo。
    - 原生 Windows：優先使用排定的工作；如果建立工作遭拒，OpenClaw 會回退至每位使用者的「啟動」資料夾登入項目，並立即啟動閘道。
    - **執行階段選擇：**需要節點，因為標準執行階段狀態儲存區使用 `node:sqlite`。修復期間會將舊版 Bun 服務遷移至節點。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，常駐程式安裝會驗證它，但不會將解析出的純文字權杖值持久化至監督程式的服務環境中繼資料。
    - 如果權杖驗證需要權杖，但設定的權杖 SecretRef 無法解析，常駐程式安裝會遭到封鎖，並提供可採取行動的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，而 `gateway.auth.mode` 未設定，常駐程式安裝會遭到封鎖，直到明確設定模式為止。

  </Step>
  <Step title="健康狀態檢查">
    - 啟動閘道（如有需要）並執行 `openclaw health`。
    - 提示：`openclaw status --deep` 會將即時閘道健康狀態探測加入狀態輸出，包括支援時的頻道探測（需要可連線的閘道）。

  </Step>
  <Step title="Skills（建議）">
    - 讀取可用的 Skills 並檢查需求。
    - 讓你選擇節點管理器：**npm / pnpm / bun**。
    - 自動為受信任的隨附 Skills 安裝選用相依套件（部分在 macOS 上使用 Homebrew）。
    - 略過無法滿足 Homebrew、uv 或 Go 安裝程式先決條件的 Skills，將它們與手動設定指引分組，並在安裝先決條件後引導你前往 `openclaw doctor`。

  </Step>
  <Step title="完成">
    - 摘要 + 後續步驟，包括供你選擇終端機、瀏覽器或稍後處理的**你想要如何孵化代理程式？**提示。

  </Step>
</Steps>

<Note>
如果未偵測到圖形使用者介面，初始設定會顯示用於控制介面的 SSH 連接埠轉送指示，而不會開啟瀏覽器。
如果缺少控制介面資產，初始設定會嘗試建置；備援方式為 `pnpm ui:build`（自動安裝 UI 相依套件）。
</Note>

## 非互動模式

使用 `--non-interactive --accept-risk` 自動化初始設定或撰寫初始設定指令碼（此
旗標是必要的風險確認；若未提供，初始設定會以錯誤
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

加入 `--json` 以取得機器可讀的摘要。

非互動模式中的閘道權杖 SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 和 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不**代表非互動模式。指令碼請使用 `--non-interactive --accept-risk`（以及 `--workspace`）。
</Note>

供應商專用的命令範例位於[命令列介面自動化](/zh-TW/start/wizard-cli-automation#provider-specific-examples)。
旗標語意和步驟順序請參閱此參考頁面。

### 新增代理程式（非互動）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` 是保留的代理程式 ID，不能用於 `openclaw agents add`。

## 閘道精靈 RPC

閘道透過 RPC 公開初始設定流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。
用戶端（macOS 應用程式、控制介面）無須重新實作初始設定邏輯即可呈現步驟。

## Signal 設定（signal-cli）

初始設定會偵測 `signal-cli` 是否位於 `PATH`，若不存在，則會提供安裝選項：

- Linux x86-64：從 `signal-cli` GitHub 發行版下載官方原生 GraalVM 組建，並儲存於 `~/.openclaw/tools/signal-cli/<version>/` 下。
- macOS 和其他架構：改為透過 Homebrew 安裝。
- 原生 Windows：尚未支援；請在 WSL2 內執行初始設定，以使用 Linux 安裝路徑。
- 無論採用何種方式，都會將 `channels.signal.cliPath` 寫入你的設定。

## 精靈寫入的內容

`~/.openclaw/openclaw.json` 中的典型欄位：

- `agents.defaults.workspace`
- 傳入 `--skip-bootstrap` 時的 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（若選擇 Minimax）
- `tools.profile`（未設定時，本機初始設定預設為 `"coding"`；既有的明確值會保留）
- `gateway.*`（模式、繫結、驗證、Tailscale）
- `session.dmScope`（初始設定會保留明確值，否則維持未設定，讓 `"main"` 預設值將所有頻道的私訊保留在代理程式持續輪替的主要工作階段中——這是個人代理程式的預設值。共用或多使用者收件匣請使用 `"per-channel-peer"`；偵測到多使用者私訊流量時，`openclaw security audit` 會建議隔離。詳情：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- 當你在頻道提示中選擇加入時的頻道私訊允許清單。Discord、Matrix、Microsoft Teams 和 Slack 會盡可能將名稱解析為 ID；其他頻道則直接使用 ID（例如數字格式的 Telegram 傳送者 ID 或 WhatsApp 電話號碼）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手動設定仍可透過直接設定 `skills.install.nodeManager` 來使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` 會寫入 `agents.entries.*` 和選用的 `bindings`。

WhatsApp 認證資訊位於 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
作用中的工作階段和逐字稿儲存於
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。 
`~/.openclaw/agents/<agentId>/sessions/` 目錄用於舊版移轉
輸入以及封存／支援成品。

部分頻道以外掛形式提供。當你在設定期間選擇其中一個頻道時，初始設定
會先提示安裝該外掛（npm 或本機路徑），之後才能進行設定。

## 相關文件

- 初始設定概觀：[初始設定（命令列介面）](/zh-TW/start/wizard)
- 命令列介面設定參考：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference)
- macOS 應用程式初始設定：[初始設定](/zh-TW/start/onboarding)
- 設定參考：[閘道設定](/zh-TW/gateway/configuration)
- 供應商：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)、[Google Chat](/zh-TW/channels/googlechat)、[Signal](/zh-TW/channels/signal)、[iMessage](/zh-TW/channels/imessage)
- Skills：[Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)
