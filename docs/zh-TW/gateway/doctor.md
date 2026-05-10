---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-05-10T19:35:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復與遷移工具。它會修正過時的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

## 快速開始

```bash
openclaw doctor
```

### 無介面與自動化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    不提示即接受預設值（包含適用時的重新啟動/服務/沙盒修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示即套用建議修復（安全時執行修復與重新啟動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用較積極的修復（覆寫自訂 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不提示執行，且只套用安全的遷移（設定正規化與磁碟上狀態搬移）。略過需要人工確認的重新啟動/服務/沙盒動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務中的額外 gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在寫入前檢視變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 它會做什麼（摘要）

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - git 安裝的選用預先更新（僅限互動模式）。
    - UI 協定新鮮度檢查（當協定 schema 較新時重建 Control UI）。
    - 健康檢查與重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/被封鎖）與 Plugin 狀態。

  </Accordion>
  <Accordion title="Config and migrations">
    - 舊版值的設定正規化。
    - 將 Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode 供應商覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 前置需求檢查。
    - 當 `plugins.allow` 具限制性但工具政策仍要求萬用字元或 Plugin 擁有工具時的 Plugin/工具允許清單警告。
    - 舊版磁碟上狀態遷移（工作階段/agent 目錄/WhatsApp 驗證）。
    - 舊版 Plugin manifest contract key 遷移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 舊版 cron 儲存遷移（`jobId`、`schedule.cron`、頂層 delivery/payload 欄位、payload `provider`、簡單 `notify: true` webhook fallback jobs）。
    - 舊版整體 agent runtime-policy 清理；供應商/模型 runtime policy 是有效的 route selector。
    - 啟用 Plugin 時清理過時的 Plugin 設定；當 `plugins.enabled=false` 時，過時的 Plugin 參照會被視為惰性隔離設定並保留。

  </Accordion>
  <Accordion title="State and integrity">
    - 工作階段鎖定檔檢查與過時鎖定清理。
    - 修復受影響的 2026.4.24 組建建立的重複 prompt-rewrite 分支工作階段 transcript。
    - 偵測卡住的 subagent 重新啟動復原 tombstone，並支援以 `--fix` 清除過時的中止復原旗標，讓啟動不會持續將子項視為 restart-aborted。
    - 狀態完整性與權限檢查（工作階段、transcript、狀態目錄）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期、可重新整理即將到期的 token，並回報 auth-profile cooldown/disabled 狀態。
    - 額外工作區目錄偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - 啟用沙盒時修復沙盒映像。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway 執行階段檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從正在執行的 Gateway 探測）。
    - Channel 專屬權限檢查位於 `openclaw channels capabilities`；例如，Discord 語音頻道權限會用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核。
    - 對於 Gateway event-loop 健康狀態降級且本機 TUI clients 仍在執行的 WhatsApp 回應性檢查；`--fix` 只會停止已驗證的本機 TUI clients。
    - 修復 primary models、fallbacks、heartbeat/subagent/compaction overrides、hooks、channel model overrides 與 session route pins 中舊版 `openai-codex/*` model refs 的 Codex route；`--fix` 會將它們重寫為 `openai/*`、移除過時的 session/whole-agent runtime pins，並將 canonical OpenAI agent refs 留在預設 Codex harness 上。
    - Supervisor 設定稽核（launchd/systemd/schtasks）與選用修復。
    - 清理 Gateway 服務在安裝或更新期間擷取的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所形成的內嵌 proxy 環境。
    - Gateway 執行階段最佳實務檢查（Node vs Bun、版本管理器路徑）。
    - Gateway 連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - 開放 DM 政策的安全警告。
    - local token mode 的 Gateway 驗證檢查（沒有 token source 時提供 token 產生；不會覆寫 token SecretRef 設定）。
    - 裝置 pairing 問題偵測（待處理的首次 pair 請求、待處理的 role/scope upgrades、過時的本機 device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區 bootstrap 檔案大小檢查（context files 的截斷/接近上限警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報缺少 bins、env、config 或 OS requirements 的允許 Skills，且 `--fix` 可停用 `skills.entries` 中無法使用的 Skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - 記憶搜尋 embedding 供應商就緒狀態檢查（本機模型、遠端 API key，或 QMD binary）。
    - 原始碼安裝檢查（pnpm workspace 不相符、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定與 wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含 grounded Dreaming 工作流程的 **Backfill**、**Reset** 與 **Clear Grounded** 動作。這些動作使用 Gateway doctor-style RPC 方法，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做什麼：

- **Backfill** 會掃描有效工作區中的歷史 `memory/YYYY-MM-DD.md` 檔案、執行 grounded REM diary pass，並將可逆回填項目寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些已標記的回填 diary entries。
- **Clear Grounded** 只會移除來自歷史 replay、且尚未累積 live recall 或 daily support 的暫存 grounded-only short-term entries。

它們本身**不會**做什麼：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你先明確執行 staged CLI path，否則它們不會自動將 grounded candidates 暫存到 live short-term promotion store

如果你想讓 grounded 歷史 replay 影響一般 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates 暫存到 short-term Dreaming store，同時讓 `DREAMS.md` 作為 review surface。

## 詳細行為與設計理由

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    如果這是 git checkout 且 doctor 正以互動模式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. Config normalization">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化到目前 schema。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk speech 設定是 `talk.provider` + `talk.providers.<provider>`，而 realtime voice 設定是 `talk.realtime.*`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到供應商 map，並將舊版頂層 realtime selectors（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重寫到 `talk.realtime`。

    當 `plugins.allow` 非空且工具政策使用萬用字元或 Plugin 擁有的工具項目時，Doctor 也會警告。`tools.allow: ["*"]` 只會符合實際載入之 Plugin 的工具；它不會繞過互斥的 Plugin allowlist。Doctor 會為已遷移的舊版 allowlist 設定寫入 `plugins.bundledDiscovery: "compat"`，以保留既有的 bundled provider 行為，然後指向較嚴格的 `"allowlist"` 設定。

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    當設定包含已淘汰的 key 時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 key。
    - 顯示已套用的遷移。
    - 使用更新後的 schema 重寫 `~/.openclaw/openclaw.json`。

    Gateway 啟動會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；它不會在啟動時重寫 `openclaw.json`。Cron job store 遷移也由 `openclaw doctor --fix` 處理。

    目前遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 缺少可見回覆政策的已設定頻道設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 最上層 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 舊版最上層即時 Talk 選擇器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 對於具有具名 `accounts`、但仍殘留單一帳戶最上層頻道值的頻道，將那些帳戶範圍的值移入該頻道選定的提升帳戶（大多數頻道為 `accounts.default`；Matrix 可以保留現有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；針對較慢提供者/模型的逾時，請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版擴充功能 relay 設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知 enum 值的提供者，而不是封閉失敗）
    - 移除 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律讓 Codex 原生工作區工具保持原生

    Doctor 警告也包含多帳戶頻道的帳戶預設值指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後援路由可能選到非預期帳戶。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳戶 ID，doctor 會發出警告並列出已設定的帳戶 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動加入了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會警告，讓你可以移除覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將其標準化為目前的主機本機 Chrome MCP attach 模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` profile 時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查預設自動連線 profile 在同一台主機上是否已安裝 Google Chrome
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - Gateway/Node 主機上有 Chromium-based browser 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次 attach 同意提示

    這裡的就緒狀態只涉及本機 attach 前置條件。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理瀏覽器或 raw CDP profile。

    這項檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。那些流程會繼續使用 raw CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置條件">
    設定 OpenAI Codex OAuth profile 時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS stack 能否驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台專屬修正指引。在使用 Homebrew Node 的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 Gateway 健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下加入了舊版 OpenAI transport 設定，它們可能會遮蔽新版會自動使用的內建 Codex OAuth 提供者路徑。當 Doctor 看到那些舊 transport 設定與 Codex OAuth 同時存在時，會發出警告，讓你可以移除或改寫過時的 transport 覆寫，並取回內建的路由/後援行為。自訂 proxy 和僅 header 的覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex harness 路由使用 canonical `openai/*` 模型參照；OpenAI agent 回合會透過 Codex app-server harness，而不是 OpenClaw PI OpenAI 路徑。

    在 `--fix` / `--repair` 模式中，doctor 會改寫受影響的 default-agent 和 per-agent 參照，包括 primary models、fallbacks、heartbeat/subagent/compaction 覆寫、hooks、channel model 覆寫，以及過時的 persisted session route state：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - Codex 意圖會移到已修復 agent model refs 的 provider/model-scoped `agentRuntime.id: "codex"` 項目，因此模型參照變成 `openai/*` 後，仍可選取 `openai-codex:...` auth profiles。
    - 過時的 whole-agent runtime config 和 persisted session runtime pins 會被移除，因為 runtime 選擇是 provider/model-scoped。
    - 除非修復後的舊版模型參照需要 Codex 路由以保留舊 auth path，否則會保留現有 provider/model runtime policy。
    - 現有 model fallback lists 會保留，並改寫其中的舊版項目；複製的 per-model settings 會從舊版 key 移到 canonical `openai/*` key。
    - Persisted session `modelProvider`/`providerOverride`、`model`/`modelOverride`、fallback notices 和 auth-profile pins 會在所有已發現的 agent session stores 中修復。
    - `/codex ...` 表示「從聊天控制或綁定原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx adapter」。

  </Accordion>
  <Accordion title="2g. Session 路由清理">
    將已設定模型或 runtime 從 Plugin 擁有的路由（例如 Codex）移走後，Doctor 也會掃描已發現的 agent session stores，尋找過時的自動建立路由狀態。

    `openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` model pins、runtime model metadata、pinned harness ids、CLI session bindings，以及 auto auth-profile overrides，前提是它們所屬的路由已不再設定。明確的使用者或舊版 session 模型選擇會回報供手動檢閱，且保持不變；當不再打算使用該路由時，請用 `/model ...`、`/new` 切換它們，或重設 session。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可以將較舊的磁碟配置遷移到目前結構：

    - Sessions store + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent dir：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp auth state（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設 account id：`default`）

    這些遷移採 best-effort 且具冪等性；當 doctor 留下任何舊版資料夾作為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版 sessions + agent dir，讓歷史記錄/auth/models 進入 per-agent path，而不需要手動執行 doctor。WhatsApp auth 有意只透過 `openclaw doctor` 遷移。Talk provider/provider-map normalization 現在會依結構相等性比較，因此只有 key 順序不同的差異不再觸發重複的 no-op `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝 Plugin manifests，尋找已棄用的最上層 capability keys（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將它們移入 `contracts` object，並就地改寫 manifest file。此遷移具冪等性；如果 `contracts` key 已有相同值，就會移除舊版 key，而不重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 cron store 遷移">
    Doctor 也會檢查 cron job store（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時使用 `cron.store`），尋找 scheduler 仍為相容性而接受的舊 job shapes。

    目前的 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 最上層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 最上層遞送欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` 遞送別名 → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` Webhook 後援工作 → 明確的 `delivery.mode="webhook"`，並設定 `delivery.to=cron.webhook`

    Doctor 只會在不改變行為的情況下，自動遷移 `notify: true` 工作。如果工作同時結合舊版通知後援與現有非 Webhook 遞送模式，doctor 會警告並保留該工作供手動審查。

    在 Linux 上，當使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會警告。目前的 OpenClaw 不維護這個主機本機腳本，而且當 cron 無法連到 systemd 使用者匯流排時，它可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor 會掃描每個代理程式工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束後遺留的檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍存活、鎖定存在時間，以及是否被視為過時（PID 已死亡、超過 30 分鐘，或可證明存活的 PID 屬於非 OpenClaw 行程）。在 `--fix` / `--repair` 模式中，它會自動移除過時的鎖定檔案；否則會列印註記並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor 會掃描代理程式工作階段 JSONL 檔案，尋找由 2026.4.24 提示詞轉錄重寫錯誤所建立的重複分支形狀：一個被放棄的使用者回合，包含 OpenClaw 內部執行階段情境，並且有一個作用中的同層分支，包含相同的可見使用者提示詞。在 `--fix` / `--repair` 模式中，doctor 會在每個受影響檔案旁備份原檔，並將轉錄重寫為作用中分支，讓 Gateway 歷史記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    狀態目錄是操作上的腦幹。如果它消失，你會失去工作階段、認證、日誌與設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告發生災難性狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（偵測到擁有者/群組不符時會發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能導致較慢的 I/O 以及鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為在工作階段與認證寫入下，SD 或 eMMC 支援的隨機 I/O 可能較慢且磨耗更快。
    - **工作階段目錄遺失**：需要 `sessions/` 與工作階段儲存目錄，才能保留歷史記錄並避免 `ENOENT` 當機。
    - **轉錄不相符**：當近期工作階段項目缺少轉錄檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要轉錄只有一行時標記（歷史記錄未累積）。
    - **多個狀態目錄**：當多個主目錄中存在多個 `~/.openclaw` 資料夾，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能分散在不同安裝之間）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於該處）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/所有人讀取，則發出警告並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor 會檢查認證儲存區中的 OAuth 設定檔，在權杖即將到期/已到期時發出警告，並可在安全時重新整理它們。如果 Anthropic OAuth/權杖設定檔過期，它會建議使用 Anthropic API 金鑰或 Anthropic 設定權杖路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者告知你必須重新登入），doctor 會回報需要重新認證，並列印要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因以下原因暫時無法使用的認證設定檔：

    - 短暫冷卻（速率限制/逾時/認證失敗）
    - 較長時間停用（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks model validation">
    如果已設定 `hooks.gmail.model`，doctor 會對照目錄與允許清單驗證模型參照，並在無法解析或不允許時發出警告。
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    啟用沙箱時，doctor 會檢查 Docker 映像，並在目前映像遺失時提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中，移除舊版 OpenClaw 產生的 Plugin 相依性暫存狀態。這涵蓋過時的已產生相依性根目錄、舊安裝階段目錄、早期內建 Plugin 相依性修復程式碼留下的套件本機殘留物，以及可能遮蔽目前內建清單的孤立或復原受管 npm 版內建 `@openclaw/*` Plugin。

    當設定參照了可下載 Plugin，但本機 Plugin 登錄找不到它們時，doctor 也可以重新安裝遺失的可下載 Plugin。範例包括實質的 `plugins.entries`、已設定的頻道/提供者/搜尋設定，以及已設定的代理程式執行階段。在套件更新期間，doctor 會避免在核心套件被替換時執行套件管理器 Plugin 修復；如果更新後已設定的 Plugin 仍需要復原，請再次執行 `openclaw doctor --fix`。Gateway 啟動與設定重新載入不會執行套件管理器；Plugin 安裝仍屬於明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 gateway 服務（launchd/systemd/schtasks），並提供移除它們、使用目前 gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 gateway 服務並列印清理提示。以設定檔命名的 OpenClaw gateway 服務會被視為一等服務，不會被標記為「額外」。

    在 Linux 上，如果使用者層級的 gateway 服務遺失，但系統層級的 OpenClaw gateway 服務存在，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統監督器負責 gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳戶有待處理或可執行的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。兩個步驟都不是致命錯誤；錯誤會被記錄，而啟動會繼續。在唯讀模式（不含 `--fix` 的 `openclaw doctor`）中，這項檢查會被完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會在一般健康檢查流程中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 公開金鑰不符修復，其中裝置 id 仍相符，但裝置身分已不再符合核准記錄
    - 已配對記錄缺少核准角色的作用中權杖
    - 已配對權杖的範圍漂移到核准配對基準之外
    - 目前機器的本機快取裝置權杖項目早於 gateway 端權杖輪替，或帶有過時的範圍中繼資料

    Doctor 不會自動核准配對請求，也不會自動輪替裝置權杖。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理的請求
    - 使用 `openclaw devices approve <requestId>` 核准確切的請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這會補上常見的「已配對但仍收到需要配對」缺口：doctor 現在會區分首次配對、待處理的角色/範圍升級，以及過期權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當 provider 對私訊開放卻沒有允許清單，或 policy 以危險方式設定時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd 駐留（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 gateway 在登出後仍維持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、Plugin 和舊版目錄）">
    Doctor 會列印預設 agent 的工作區狀態摘要：

    - **Skills 狀態**：統計符合資格、缺少需求，以及遭允許清單封鎖的 Skills。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：統計已啟用/已停用/發生錯誤的 Plugin；列出任何錯誤的 Plugin ID；回報 bundled Plugin capabilities。
    - **Plugin 相容性警告**：標記與目前 runtime 有相容性問題的 Plugin。
    - **Plugin 診斷**：顯示 Plugin registry 在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的 context 檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元占總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 清理過期的 channel Plugin">
    當 `openclaw doctor --fix` 移除缺失的 channel Plugin 時，也會移除參照該 Plugin 的懸空 channel 範圍設定：`channels.<id>` 項目、指名該 channel 的 heartbeat targets，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止 channel runtime 已不存在，但 config 仍要求 Gateway 綁定到它而造成 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 補全：

    - 如果 shell profile 使用緩慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案變體。
    - 如果補全已在 profile 中設定，但快取檔案缺失，doctor 會自動重新產生快取。
    - 如果完全未設定補全，doctor 會提示安裝（僅限互動模式；使用 `--non-interactive` 時會略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機權杖）">
    Doctor 會檢查本機 Gateway 權杖驗證是否就緒。

    - 如果權杖模式需要權杖但沒有權杖來源，Doctor 會提供產生權杖的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，Doctor 會發出警告，且不會以純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只有在未設定權杖 SecretRef 時才會強制產生權杖。

  </Accordion>
  <Accordion title="12b. 感知唯讀 SecretRef 的修復">
    某些修復流程需要檢查已設定的憑證，同時不弱化執行階段快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與狀態類命令相同的唯讀 SecretRef 摘要模型，來進行目標式設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的機器人憑證。
    - 如果 Telegram 機器人權杖是透過 SecretRef 設定，但在目前命令路徑中無法使用，Doctor 會回報該憑證已設定但無法使用，並略過自動解析，而不是當機或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在 Gateway 看起來不健康時提供重新啟動選項。
  </Accordion>
  <Accordion title="13b. 記憶體搜尋就緒狀態">
    Doctor 會檢查預設代理程式已設定的記憶體搜尋嵌入提供者是否就緒。行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。如果不可用，會列印修復指引，包括 npm 套件與手動二進位路徑選項。
    - **明確的本機提供者**：檢查本機模型檔案，或可識別的遠端/可下載模型 URL。如果遺失，會建議切換到遠端提供者。
    - **明確的遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。如果遺失，會列印可採取行動的修復提示。
    - **自動提供者**：先檢查本機模型可用性，然後依自動選取順序嘗試每個遠端提供者。

    當有快取的 Gateway 探測結果可用時（Gateway 在檢查時是健康的），Doctor 會將其結果與 CLI 可見的設定交叉比對，並註記任何差異。Doctor 不會在預設路徑上啟動新的嵌入 ping；需要即時提供者檢查時，請使用深度記憶體狀態命令。

    使用 `openclaw memory status --deep` 在執行階段驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 通道狀態警告">
    如果 Gateway 健康，Doctor 會執行通道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核 + 修復">
    Doctor 會檢查已安裝的監督程式設定（launchd/systemd/schtasks）是否缺少預設值或使用過時預設值（例如 systemd network-online 相依性與重新啟動延遲）。發現不相符時，它會建議更新，並可將服務檔案/工作重寫為目前預設值。

    注意：

    - `openclaw doctor` 會在重寫監督程式設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會在不提示的情況下套用建議修復。
    - `openclaw doctor --repair --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 Doctor 對 Gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序、監督程式設定重寫，以及舊版服務清理，因為外部監督程式擁有該生命週期。
    - 在 Linux 上，當相符的 systemd Gateway 單元處於作用中時，Doctor 不會重寫命令/進入點中繼資料。它也會在重複服務掃描期間忽略非作用中的非舊版額外類 Gateway 單元，因此伴隨服務檔案不會造成清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，Doctor 服務安裝/修復會驗證 SecretRef，但不會將已解析的純文字權杖值保存到監督程式服務環境中繼資料中。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows 排程工作安裝中內嵌行內值的受管理 `.env`/SecretRef 支援服務環境值，並重寫服務中繼資料，讓這些值從執行階段來源載入，而不是從監督程式定義載入。
    - Doctor 會偵測服務命令是否在 `gateway.port` 變更後仍固定舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且已設定的權杖 SecretRef 無法解析，Doctor 會阻擋安裝/修復路徑，並提供可採取行動的指引。
    - 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，但未設定 `gateway.auth.mode`，Doctor 會阻擋安裝/修復，直到明確設定模式。
    - 對於 Linux 使用者 systemd 單元，Doctor 權杖漂移檢查現在會在比較服務驗證中繼資料時，同時包含 `Environment=` 與 `EnvironmentFile=` 來源。
    - 當設定最後是由較新版本寫入時，Doctor 服務修復會拒絕從較舊的 OpenClaw 二進位檔重寫、停止或重新啟動 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你永遠可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + 連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳做法">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，Doctor 會發出警告。WhatsApp + Telegram 通道需要 Node，而版本管理器路徑可能在升級後中斷，因為服務不會載入你的 shell 初始化設定。Doctor 會在可用時提供遷移到系統 Node 安裝（Homebrew/apt/choco）的選項。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Homebrew 管理的系統二進位檔仍然可用，同時 Volta、asdf、fnm、pnpm 與其他版本管理器目錄不會改變 Node 子程序解析到的項目。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）與穩定的使用者二進位目錄，但推測的版本管理器備援目錄只有在那些目錄實際存在於磁碟上時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會保存任何設定變更，並加上精靈中繼資料戳記以記錄 Doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶體系統）">
    Doctor 會在缺少工作區記憶體系統時建議設定，並在工作區尚未受 git 管理時列印備份提示。

    如需工作區結構與 git 備份（建議使用私人 GitHub 或 GitLab）的完整指南，請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
