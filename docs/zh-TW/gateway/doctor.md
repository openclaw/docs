---
read_when:
    - 新增或修改 doctor 遷移
    - 導入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移和修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-05-07T13:18:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復 + 遷移工具。它會修正過時的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

## 快速開始

```bash
openclaw doctor
```

### Headless 與自動化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    不提示而接受預設值（包含適用時的重新啟動/服務/沙盒修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示而套用建議修復（安全時包含修復 + 重新啟動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用較積極的修復（會覆寫自訂 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不提示執行，且只套用安全遷移（設定標準化 + 磁碟上的狀態移動）。略過需要人工確認的重新啟動/服務/沙盒動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外的 Gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果想在寫入前先檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 它會做什麼（摘要）

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝的選用預檢更新（僅限互動模式）。
    - UI 協定新鮮度檢查（當協定 schema 較新時重建 Control UI）。
    - 健康狀態檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/受阻）與 Plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定標準化。
    - Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome extension 設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth shadowing 警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth profiles 的 OAuth TLS 前置條件檢查。
    - 當 `plugins.allow` 具限制性，但工具政策仍要求萬用字元或 Plugin 擁有的工具時發出 Plugin/tool allowlist 警告。
    - 舊版磁碟狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 Plugin manifest contract key 遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 Cron store 遷移（`jobId`, `schedule.cron`, 頂層 delivery/payload 欄位、payload `provider`、簡單的 `notify: true` webhook fallback jobs）。
    - 舊版 agent runtime-policy 遷移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
    - Plugin 啟用時清理過時的 Plugin 設定；當 `plugins.enabled=false` 時，過時的 Plugin 參照會視為非作用中的 containment 設定並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - Session lock file 檢查與過時 lock 清理。
    - 修復受影響 2026.4.24 組建建立的重複 prompt-rewrite branches 的 session transcript。
    - 卡住的 subagent restart-recovery tombstone 偵測，並支援用 `--fix` 清除過時的 aborted recovery flags，避免啟動時持續將 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 本機執行時檢查設定檔權限（chmod 600）。
    - Model auth 健康狀態：檢查 OAuth 到期、可重新整理即將到期的 token，並回報 auth-profile cooldown/disabled 狀態。
    - 額外 workspace dir 偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisors">
    - 啟用沙盒時的 sandbox image 修復。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway runtime 檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從執行中的 Gateway 探測）。
    - Channel 專屬權限檢查位於 `openclaw channels capabilities`；例如，Discord voice channel 權限會用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核。
    - 針對 Gateway event-loop 健康狀態下降且本機 TUI clients 仍在執行時，執行 WhatsApp 回應性檢查；`--fix` 只會停止已驗證的本機 TUI clients。
    - 修復舊版 `openai-codex/*` model refs 的 Codex route，涵蓋 primary models、fallbacks、heartbeat/subagent/compaction overrides、hooks、channel model overrides 和 session route pins；`--fix` 會將其重寫為 `openai/*`，且只有在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，並有可用 OAuth 時，才會選取 `agentRuntime.id: "codex"`。否則會選取 `agentRuntime.id: "pi"`。
    - Supervisor 設定稽核（launchd/systemd/schtasks），可選擇修復。
    - 清理 Gateway services 在安裝或更新期間擷取 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所留下的 embedded proxy environment。
    - Gateway runtime 最佳實務檢查（Node vs Bun、version-manager paths）。
    - Gateway port 衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放 DM 政策的安全性警告。
    - local token mode 的 Gateway auth 檢查（沒有 token source 時提供 token 產生；不會覆寫 token SecretRef configs）。
    - 裝置配對問題偵測（待處理的首次 pair requests、待處理的 role/scope upgrades、過時的 local device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace 與 shell">
    - Linux 上的 systemd linger 檢查。
    - Workspace bootstrap file size 檢查（context files 的截斷/接近上限警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報 allowed skills 中缺少 bins、env、config 或 OS requirements 的項目，且 `--fix` 可停用 `skills.entries` 中不可用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding provider 就緒狀態檢查（local model、remote API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace mismatch、missing UI assets、missing tsx binary）。
    - 寫入更新後的設定 + wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含 grounded Dreaming 工作流程的 **Backfill**、**Reset** 和 **Clear Grounded** 動作。這些動作使用 Gateway doctor-style RPC methods，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做的事：

- **Backfill** 會掃描作用中 workspace 裡的歷史 `memory/YYYY-MM-DD.md` 檔案、執行 grounded REM diary pass，並將可還原的 backfill entries 寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些已標記的 backfill diary entries。
- **Clear Grounded** 只會移除來自歷史 replay、尚未累積 live recall 或 daily support 的 staged grounded-only short-term entries。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你明確先執行 staged CLI path，否則它們不會自動將 grounded candidates staged 到 live short-term promotion store

如果想讓 grounded historical replay 影響一般的 deep promotion lane，請改用 CLI flow：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates staged 到 short-term dreaming store，同時保留 `DREAMS.md` 作為 review surface。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 以互動方式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）選項。
  </Accordion>
  <Accordion title="1. 設定標準化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將其標準化為目前 schema。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk speech config 是 `talk.provider` + `talk.providers.<provider>`，realtime voice config 則是 `talk.realtime.*`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫進 provider map，並將舊版頂層 realtime selectors（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）重寫到 `talk.realtime`。

    當 `plugins.allow` 非空且工具政策使用萬用字元或 Plugin 擁有的工具項目時，Doctor 也會發出警告。`tools.allow: ["*"]` 只會匹配實際載入的 Plugin 所提供的工具；它不會繞過專屬 Plugin allowlist。Doctor 會為已遷移的舊版 allowlist configs 寫入 `plugins.bundledDiscovery: "compat"` 以保留既有 bundled provider 行為，接著指向更嚴格的 `"allowlist"` 設定。

  </Accordion>
  <Accordion title="2. 舊版設定 key 遷移">
    當設定包含已棄用的 keys 時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 keys。
    - 顯示已套用的遷移。
    - 使用更新後的 schema 重寫 `~/.openclaw/openclaw.json`。

    Gateway 啟動會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；它不會在啟動時重寫 `openclaw.json`。Cron job store 遷移也由 `openclaw doctor --fix` 處理。

    目前遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 已設定通道的設定缺少可見回覆政策 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 頂層 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 舊版頂層即時 Talk 選擇器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
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
    - 對於具有具名 `accounts` 但仍殘留單一帳戶頂層通道值的通道，將這些帳戶範圍的值移到為該通道選定的提升帳戶中（多數通道使用 `accounts.default`；Matrix 可保留現有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；針對慢速提供者/模型逾時，請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版 extension relay 設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（gateway 啟動時也會略過 `api` 設為未來或未知列舉值的提供者，而不是封閉式失敗）

    Doctor 警告也包含多帳戶通道的帳戶預設指引：

    - 如果設定了兩個或更多 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後援路由可能選到非預期帳戶。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳戶 ID，doctor 會警告並列出已設定的帳戶 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動加入了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會警告，讓你可以移除該覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome extension 路徑，doctor 會將它正規化為目前的主機本機 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查 Google Chrome 是否安裝在同一台主機上，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面中啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - Gateway/Node 主機上有 Chromium-based browser 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只涉及本機附加前置條件。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理瀏覽器或原始 CDP 設定檔。

    這項檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置條件">
    當設定了 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊可以驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定的修正指引。在使用 Homebrew Node 的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 gateway 健康，也會執行探測。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下加入了舊版 OpenAI 傳輸設定，它們可能會遮蔽新版會自動使用的內建 Codex OAuth 提供者路徑。當 doctor 在 Codex OAuth 旁看到這些舊傳輸設定時會發出警告，讓你可以移除或重寫過時的傳輸覆寫，並取回內建路由/後援行為。自訂代理和僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex harness 路由使用標準 `openai/*` 模型參照；OpenAI agent 回合會透過 Codex app-server harness，而不是 OpenClaw PI OpenAI 路徑。

    在 `--fix` / `--repair` 模式中，doctor 會重寫受影響的預設 agent 和逐 agent 參照，包括主要模型、後援、heartbeat/subagent/compaction 覆寫、hooks、通道模型覆寫，以及過時的持久化工作階段路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - 只有在 Codex 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時，相符的 agent runtime 才會變成 `agentRuntime.id: "codex"`。
    - 否則，相符的 agent runtime 會變成 `agentRuntime.id: "pi"`。
    - 現有模型後援清單會保留，並重寫其中的舊版項目；複製的逐模型設定會從舊版 key 移到標準 `openai/*` key。
    - 持久化工作階段的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、後援通知、auth-profile 釘選和 Codex harness 釘選，會在所有找到的 agent session store 中修復。
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器」。

  </Accordion>
  <Accordion title="2g. 工作階段路由清理">
    當你將已設定模型或 runtime 從 Codex 這類 Plugin 擁有的路由移開後，Doctor 也會掃描找到的 agent session store，尋找過時的自動建立路由狀態。

    `openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型釘選、runtime 模型中繼資料、釘選的 harness ID、CLI session 繫結，以及當其擁有路由不再設定時的自動 auth-profile 覆寫。明確的使用者或舊版工作階段模型選擇會回報供手動檢閱並保持不變；當不再打算使用該路由時，請用 `/model ...`、`/new` 切換它們，或重設工作階段。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟版面配置）">
    Doctor 可以將較舊的磁碟版面配置遷移到目前結構：

    - Sessions store + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent dir：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp auth state（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（不含 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳戶 ID：`default`）

    這些遷移採最佳努力且具冪等性；當 doctor 留下任何舊版資料夾作為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版 sessions + agent dir，讓歷史記錄/auth/models 無需手動執行 doctor 就能落在逐 agent 路徑中。WhatsApp auth 有意只透過 `openclaw doctor` 遷移。Talk provider/provider-map 正規化現在會以結構相等性比較，因此只因 key 順序不同的差異，不再觸發重複的無效 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝的 Plugin manifest，尋找已淘汰的頂層 capability key（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提出將它們移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移具冪等性；如果 `contracts` key 已有相同值，舊版 key 會被移除而不會重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 cron store 遷移">
    Doctor 也會檢查 cron job store（預設為 `~/.openclaw/cron/jobs.json`，或在覆寫時使用 `cron.store`），尋找 scheduler 仍為相容性接受的舊 job 形狀。

    目前的 Cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery aliases → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` webhook 後援 jobs → 帶有 `delivery.to=cron.webhook` 的明確 `delivery.mode="webhook"`

    Doctor 只會在不改變行為的情況下，自動遷移 `notify: true` 作業。如果某個作業同時結合舊版 notify fallback 和現有的非 Webhook 傳遞模式，Doctor 會發出警告，並保留該作業供手動檢閱。

    在 Linux 上，當使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，Doctor 也會發出警告。該主機本機腳本不由目前的 OpenClaw 維護，且在 cron 無法連線到 systemd 使用者匯流排時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。使用 `crontab -e` 移除過時的 crontab 項目；使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status` 進行目前的健康檢查。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理程式工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束後留下的檔案。對於找到的每個鎖定檔案，Doctor 會回報：路徑、PID、PID 是否仍存活、鎖定存在時間，以及是否被視為過時（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，Doctor 會自動移除過時的鎖定檔案；否則會列印提示，並指示你以 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段轉錄分支修復">
    Doctor 會掃描代理程式工作階段 JSONL 檔案，尋找 2026.4.24 提示轉錄重寫錯誤所建立的重複分支形狀：一個已放棄的使用者回合，其中包含 OpenClaw 內部執行階段內容，另有一個作用中的同層分支包含相同的可見使用者提示。在 `--fix` / `--repair` 模式中，Doctor 會將每個受影響的檔案備份到原檔旁邊，並將轉錄重寫為作用中分支，讓 Gateway 歷史和記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由和安全性）">
    狀態目錄是作業上的腦幹。如果它消失，你會失去工作階段、憑證、記錄和設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（偵測到擁有者/群組不相符時，會發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能導致較慢的 I/O，以及鎖定/同步競態。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 在工作階段和憑證寫入期間可能較慢，且磨耗較快。
    - **工作階段目錄遺失**：`sessions/` 和工作階段儲存目錄是持久保存歷史並避免 `ENOENT` 當機所必需的。
    - **轉錄不相符**：當最近的工作階段項目缺少轉錄檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要轉錄只有一行時標記（歷史未累積）。
    - **多個狀態目錄**：當多個主目錄中存在多個 `~/.openclaw` 資料夾，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史可能在不同安裝之間分散）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，Doctor 會提醒你在遠端主機上執行它（狀態位於該處）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/全世界讀取，則發出警告，並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存中的 OAuth 設定檔，在 Token 即將到期/已到期時發出警告，並在安全時重新整理它們。如果 Anthropic OAuth/Token 設定檔已過時，會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式（TTY）執行時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者要求你重新登入），Doctor 會回報需要重新驗證，並列印要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因下列原因而暫時無法使用的驗證設定檔：

    - 短暫冷卻時間（速率限制/逾時/驗證失敗）
    - 較長停用時間（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hook 模型驗證">
    如果設定了 `hooks.gmail.model`，Doctor 會根據目錄和允許清單驗證模型參照，並在無法解析或不允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，Doctor 會檢查 Docker 映像，並在目前映像遺失時，提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中，移除舊版 OpenClaw 產生的 Plugin 相依性暫存狀態。這涵蓋過時的產生相依性根目錄、舊的安裝階段目錄、早期內建 Plugin 相依性修復程式碼留下的套件本機殘留物，以及可能遮蔽目前內建資訊清單的孤立或已復原受管理 npm 副本（內建 `@openclaw/*` Plugin）。

    當設定參照可下載 Plugin，但本機 Plugin 登錄找不到它們時，Doctor 也可以重新安裝遺失的可下載 Plugin。範例包括實際的 `plugins.entries`、已設定的頻道/提供者/搜尋設定，以及已設定的代理程式執行階段。在套件更新期間，Doctor 會避免在核心套件被替換時執行套件管理器 Plugin 修復；如果更新後仍有已設定的 Plugin 需要復原，請再次執行 `openclaw doctor --fix`。Gateway 啟動和設定重新載入不會執行套件管理器；Plugin 安裝仍然是明確的 Doctor/安裝/更新工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移和清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除它們且使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 Gateway 服務並列印清理提示。以設定檔命名的 OpenClaw Gateway 服務會被視為第一級項目，不會標記為「額外」。

    在 Linux 上，如果使用者層級 Gateway 服務遺失，但系統層級 OpenClaw Gateway 服務存在，Doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統監督程式擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. Startup Matrix 遷移">
    當 Matrix 頻道帳戶有待處理或可執行的舊版狀態遷移時，Doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移和舊版加密狀態準備。這兩個步驟都不是致命的；錯誤會被記錄，啟動會繼續。在唯讀模式（不含 `--fix` 的 `openclaw doctor`）中，會完全略過這項檢查。
  </Accordion>
  <Accordion title="8c. 裝置配對和驗證漂移">
    Doctor 現在會在一般健康檢查流程中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對要求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 ID 仍相符但裝置身分不再符合已核准記錄的公開金鑰不相符修復
    - 已配對記錄缺少已核准角色的作用中 Token
    - 範圍漂移到已核准配對基準之外的已配對 Token
    - 目前機器的本機快取裝置 Token 項目，其早於 Gateway 端 Token 輪替，或帶有過時的範圍中繼資料

    Doctor 不會自動核准配對要求，也不會自動輪替裝置 Token。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理要求
    - 使用 `openclaw devices approve <requestId>` 核准確切要求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的 Token
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過時記錄

    這會補上常見的「已經配對但仍收到需要配對」缺口：Doctor 現在能區分首次配對、待處理的角色/範圍升級，以及過時 Token/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當提供者在沒有允許清單的情況下對私訊開放，或原則以危險方式設定時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，Doctor 會確保已啟用 lingering，讓 Gateway 在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、Plugin 和舊版目錄）">
    Doctor 會列印預設代理程式的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求和被允許清單封鎖的 Skills 數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/錯誤的 Plugin 數量；列出任何錯誤的 Plugin ID；回報套件組合 Plugin 功能。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 Plugin。
    - **Plugin 診斷**：呈現 Plugin 登錄在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 Bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過已設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元相對於總預算的比例。當檔案被截斷或接近限制時，Doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過時頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除遺失的頻道 Plugin 時，它也會移除參照該 Plugin 的懸空頻道範圍設定：`channels.<id>` 項目、命名該頻道的 Heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止頻道執行階段已消失但設定仍要求 Gateway 綁定到它所造成的 Gateway 開機迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 補全：

    - 如果 shell 設定檔使用較慢的動態補全模式（`source <(openclaw completion ...)`），Doctor 會將它升級為較快的快取檔案變體。
    - 如果補全已在設定檔中設定，但快取檔案遺失，Doctor 會自動重新產生快取。
    - 如果完全沒有設定補全，Doctor 會提示安裝它（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機 Token）">
    Doctor 會檢查本機 Gateway Token 驗證就緒狀態。

    - 如果 Token 模式需要 Token，且不存在 Token 來源，Doctor 會提供產生一個的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，Doctor 會發出警告，且不會以明文覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定 Token SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. 支援唯讀 SecretRef 的修復">
    有些修復流程需要檢查已設定的認證，而不削弱執行階段快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與狀態類命令相同的唯讀 SecretRef 摘要模型，以進行目標式設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 認證。
    - 如果 Telegram bot token 是透過 SecretRef 設定，但在目前命令路徑中無法使用，doctor 會報告該認證已設定但不可用，並略過自動解析，而不是當機或誤報 token 遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在 Gateway 看起來不健康時提議重新啟動 Gateway。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    Doctor 會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理程式就緒。行為取決於已設定的後端和提供者：

    - **QMD 後端**：探測 `qmd` binary 是否可用且可啟動。若不可用，會列印修復指引，包括 npm package 和手動 binary 路徑選項。
    - **明確的本機提供者**：檢查本機模型檔案或可辨識的遠端/可下載模型 URL。若遺失，會建議切換到遠端提供者。
    - **明確的遠端提供者**（`openai`、`voyage` 等）：驗證環境或 auth store 中是否存在 API key。若遺失，會列印可執行的修復提示。
    - **自動提供者**：先檢查本機模型可用性，接著依自動選擇順序嘗試每個遠端提供者。

    當有快取的 Gateway 探測結果可用時（Gateway 在檢查當下是健康的），doctor 會將其結果與 CLI 可見設定交叉比對，並註記任何差異。Doctor 不會在預設路徑上啟動新的嵌入 ping；當你需要即時提供者檢查時，請使用深度記憶狀態命令。

    使用 `openclaw memory status --deep` 來驗證執行階段的嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 通道狀態警告">
    如果 Gateway 健康，doctor 會執行通道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. Supervisor 設定稽核 + 修復">
    Doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks）是否遺漏或使用過時的預設值（例如 systemd network-online 相依性和重新啟動延遲）。當發現不一致時，它會建議更新，並可將 service file/task 重寫為目前預設值。

    注意事項：

    - `openclaw doctor` 會在重寫 supervisor 設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會不經提示套用建議修復。
    - `openclaw doctor --repair --force` 會覆寫自訂 supervisor 設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 Gateway service 生命週期保持唯讀。它仍會回報 service 健康狀態並執行非 service 修復，但會略過 service 安裝/啟動/重新啟動/bootstrap、supervisor 設定重寫，以及舊版 service 清理，因為外部 supervisor 擁有該生命週期。
    - 在 Linux 上，當相符的 systemd Gateway unit 處於啟用狀態時，doctor 不會重寫命令/entrypoint metadata。它也會在重複 service 掃描期間忽略未啟用且非舊版的額外 Gateway-like unit，讓伴隨的 service file 不會產生清理雜訊。
    - 如果 token auth 需要 token，且 `gateway.auth.token` 由 SecretRef 管理，doctor service 安裝/修復會驗證 SecretRef，但不會將已解析的明文 token 值持久化到 supervisor service environment metadata 中。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows Scheduled Task 安裝曾內嵌 inline 的受管理 `.env`/SecretRef 支援的 service environment 值，並重寫 service metadata，讓這些值從執行階段來源載入，而不是從 supervisor 定義載入。
    - Doctor 會偵測 service 命令是否在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將 service metadata 重寫為目前 port。
    - 如果 token auth 需要 token，且已設定的 token SecretRef 未解析，doctor 會阻擋安裝/修復路徑，並提供可執行的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會阻擋安裝/修復，直到明確設定 mode。
    - 對於 Linux user-systemd unit，doctor token drift 檢查現在會在比較 service auth metadata 時同時納入 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後是由較新版本寫入時，doctor service 修復會拒絕從較舊 OpenClaw binary 重寫、停止或重新啟動 Gateway service。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你永遠可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + port 診斷">
    Doctor 會檢查 service 執行階段（PID、上次結束狀態），並在 service 已安裝但實際上未執行時發出警告。它也會檢查 Gateway port（預設 `18789`）上的 port 衝突，並回報可能原因（Gateway 已在執行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    當 Gateway service 在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 會發出警告。WhatsApp + Telegram 通道需要 Node，而版本管理器路徑可能在升級後中斷，因為 service 不會載入你的 shell init。Doctor 會在可用時提議遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或已修復的 macOS LaunchAgent 會使用標準系統 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Volta、asdf、fnm、pnpm 和其他版本管理器目錄不會改變 Node child process 解析的位置。Linux services 仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的 user-bin 目錄，但推測的版本管理器 fallback 目錄只會在這些目錄實際存在於磁碟上時寫入 service PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + wizard metadata">
    Doctor 會持久化任何設定變更，並加上 wizard metadata 戳記以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. Workspace 提示（備份 + 記憶系統）">
    Doctor 會在缺少 workspace 記憶系統時提出建議，並在 workspace 尚未置於 git 下時列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得 workspace 結構與 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
