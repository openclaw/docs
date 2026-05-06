---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-05-06T02:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復與遷移工具。它會修復過時的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

## 快速開始

```bash
openclaw doctor
```

### 無頭與自動化模式

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

    不提示即套用建議修復（可安全執行時包含修復與重新啟動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用積極修復（覆寫自訂 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    在不提示的情況下執行，且只套用安全遷移（設定正規化與磁碟上狀態移動）。跳過需要人工確認的重新啟動/服務/沙盒動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外的 Gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果想在寫入前檢視變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 作用摘要

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - 針對 git 安裝的選用執行前更新（僅限互動模式）。
    - UI 協定新鮮度檢查（當協定 schema 較新時重建 Control UI）。
    - 健康檢查與重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/被封鎖）與 Plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - 將舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 設定遷移。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth profile 的 OAuth TLS 前置需求檢查。
    - 當 `plugins.allow` 具限制性但工具政策仍要求萬用字元或 Plugin 擁有的工具時，發出 Plugin/工具允許清單警告。
    - 舊版磁碟上狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 Plugin manifest contract key 遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 Cron store 遷移（`jobId`, `schedule.cron`, 頂層 delivery/payload 欄位、payload `provider`、簡單 `notify: true` webhook fallback jobs）。
    - 舊版 agent runtime-policy 遷移到 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 plugins 時清理過時的 Plugin 設定；當 `plugins.enabled=false` 時，過時的 Plugin 參照會被視為惰性的 containment config 並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - Session lock file 檢查與過時 lock 清理。
    - 修復受影響 2026.4.24 建置所建立之重複 prompt-rewrite 分支的 session transcript。
    - 卡住的 subagent 重新啟動復原 tombstone 偵測，支援使用 `--fix` 清除過時的中止復原旗標，讓啟動不再持續將 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 在本機執行時的設定檔權限檢查（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期、可重新整理即將到期的權杖，並回報 auth-profile 冷卻/停用狀態。
    - 額外 workspace dir 偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisors">
    - 啟用沙盒時的 sandbox image 修復。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式）。
    - Gateway runtime 檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從執行中的 Gateway 探測）。
    - 當本機 TUI clients 仍在執行時，檢查 WhatsApp 回應能力以偵測退化的 Gateway event-loop 健康狀態；`--fix` 只會停止已驗證的本機 TUI clients。
    - 修復主要模型、fallbacks、heartbeat/subagent/compaction 覆寫、hooks、channel model overrides 與 session route pins 中舊版 `openai-codex/*` model refs 的 Codex route；`--fix` 會將它們改寫為 `openai/*`，且只有在 Codex plugin 已安裝、已啟用、提供 `codex` harness，並且有可用 OAuth 時，才會選取 `agentRuntime.id: "codex"`。否則會選取 `agentRuntime.id: "pi"`。
    - Supervisor 設定稽核（launchd/systemd/schtasks）與選用修復。
    - 清理 Gateway 服務在安裝或更新期間擷取的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所造成的嵌入式 proxy 環境。
    - Gateway runtime 最佳實務檢查（Node 與 Bun、version-manager paths）。
    - Gateway port collision 診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放 DM policies 的安全性警告。
    - 本機 token mode 的 Gateway 驗證檢查（沒有 token source 時提供 token 產生；不覆寫 token SecretRef configs）。
    - 裝置配對問題偵測（等待中的首次配對要求、等待中的 role/scope 升級、過時的本機 device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace 與 shell">
    - Linux 上的 systemd linger 檢查。
    - Workspace bootstrap file size 檢查（context files 的截斷/接近上限警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報缺少 bins、env、config 或 OS requirements 的允許 skills，且 `--fix` 可以在 `skills.entries` 中停用不可用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding provider 就緒狀態檢查（本機模型、遠端 API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace mismatch、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定與 wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI backfill 與 reset

Control UI 的 Dreams 場景包含 **Backfill**、**Reset** 與 **Clear Grounded** 動作，用於 grounded dreaming 工作流程。這些動作使用 Gateway doctor-style RPC methods，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做的事：

- **Backfill** 掃描 active workspace 中歷史的 `memory/YYYY-MM-DD.md` 檔案、執行 grounded REM diary pass，並將可逆的 backfill entries 寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些標記的 backfill diary entries。
- **Clear Grounded** 只會移除來自歷史 replay、且尚未累積 live recall 或 daily support 的 staged grounded-only short-term entries。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整的 doctor 遷移
- 除非你明確先執行 staged CLI path，否則它們不會自動將 grounded candidates 暫存到 live short-term promotion store

如果希望 grounded historical replay 影響一般的 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates 暫存到 short-term dreaming store，同時讓 `DREAMS.md` 作為 review surface。

## 詳細行為與設計理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 正在互動模式下執行，它會在執行 doctor 前提議更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化為目前的 schema。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk speech config 是 `talk.provider` + `talk.providers.<provider>`，realtime voice config 是 `talk.realtime.*`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀改寫進 provider map，並將舊版頂層 realtime selectors（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）改寫到 `talk.realtime`。

    當 `plugins.allow` 非空且工具政策使用
    萬用字元或 Plugin 擁有的工具項目時，doctor 也會發出警告。`tools.allow: ["*"]` 只會比對
    實際載入的 plugins 所提供的工具；它不會繞過專屬的 Plugin
    allowlist。Doctor 會為已遷移的
    舊版 allowlist configs 寫入 `plugins.bundledDiscovery: "compat"`，以保留既有 bundled provider 行為，然後
    指向更嚴格的 `"allowlist"` 設定。

  </Accordion>
  <Accordion title="2. 舊版設定 key 遷移">
    當設定包含已棄用的 keys 時，其他命令會拒絕執行，並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 keys。
    - 顯示它套用的遷移。
    - 使用更新後的 schema 改寫 `~/.openclaw/openclaw.json`。

    Gateway 在啟動時偵測到舊版設定格式，也會自動執行 doctor 遷移，因此過時設定會在無需手動介入的情況下修復。Cron job store 遷移由 `openclaw doctor --fix` 處理。

    目前的遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 已設定頻道的設定缺少可見回覆政策 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 對於具有具名 `accounts` 但仍殘留單一帳號頂層頻道值的頻道，將這些帳號範圍值移入為該頻道選定的提升帳號（多數頻道為 `accounts.default`；Matrix 可以保留現有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；慢速供應商/模型逾時請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版擴充功能中繼設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知列舉值的供應商，而不是以關閉方式失敗）

    Doctor 警告也會包含多帳號頻道的帳號預設指引：

    - 如果設定了兩個以上 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後援路由可能選到非預期帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳號 ID，doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    如果你已手動加入 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫 `@mariozechner/pi-ai` 內建的 OpenCode 目錄。這可能強制模型使用錯誤 API，或將成本歸零。Doctor 會警告，讓你移除覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將它標準化為目前主機本機的 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查預設自動連線設定檔的同一主機上是否已安裝 Google Chrome
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - Gateway/Node 主機上的 Chromium 系瀏覽器 144+
    - 瀏覽器在本機執行
    - 在該瀏覽器中啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只涵蓋本機附加前置條件。Existing-session 會保留目前 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截與批次動作等進階路由仍需要受管理的瀏覽器或原始 CDP 設定檔。

    此檢查**不**適用於 Docker、沙箱、遠端瀏覽器或其他無頭流程。那些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以確認本機 Node/OpenSSL TLS 堆疊可以驗證憑證鏈。如果探測因憑證錯誤失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定的修正指引。在搭配 Homebrew Node 的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 gateway 健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    如果你先前在 `models.providers.openai-codex` 下加入舊版 OpenAI 傳輸設定，它們可能遮蔽新版會自動使用的內建 Codex OAuth 供應商路徑。Doctor 看到這些舊傳輸設定與 Codex OAuth 並存時會警告，讓你移除或重寫過期傳輸覆寫，恢復內建路由/後援行為。自訂代理與僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex harness 路由使用標準 `openai/*` 模型參照加上 `agentRuntime.id: "codex"`，讓該輪次經由 Codex app-server harness，而不是 OpenClaw PI OpenAI 路徑。

    在 `--fix` / `--repair` 模式中，doctor 會重寫受影響的預設代理與每個代理參照，包括主要模型、後援、Heartbeat/subagent/compaction 覆寫、hook、頻道模型覆寫，以及過期的持久化工作階段路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - 只有在 Codex 已安裝、已啟用、提供 `codex` harness，且具有可用 OAuth 時，相符的代理執行階段才會變成 `agentRuntime.id: "codex"`。
    - 否則，相符的代理執行階段會變成 `agentRuntime.id: "pi"`。
    - 現有模型後援清單會保留，並重寫其中的舊版項目；複製的每模型設定會從舊版鍵移到標準 `openai/*` 鍵。
    - 持久化工作階段的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、後援通知、auth-profile 釘選，以及 Codex harness 釘選，會在所有已發現的代理工作階段存放區中修復。
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 介面卡」。

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor 也會掃描已發現的代理工作階段存放區，檢查你將已設定模型或執行階段移離 Codex 等 Plugin 擁有路由後，留下的過期自動建立路由狀態。

    `openclaw doctor --fix` 可以清除自動建立的過期狀態，例如 `modelOverrideSource: "auto"` 模型釘選、執行階段模型中繼資料、釘選的 harness ID、CLI 工作階段繫結，以及當其擁有路由已不再設定時的自動 auth-profile 覆寫。明確使用者或舊版工作階段模型選擇會回報供手動檢閱並保持不變；當該路由不再打算使用時，請用 `/model ...`、`/new` 切換，或重設工作階段。

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor 可以將較舊的磁碟上版面配置遷移到目前結構：

    - 工作階段存放區 + 逐字稿：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - 代理目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移採盡力而為且具冪等性；doctor 將任何舊版資料夾留下作為備份時會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版工作階段與代理目錄，讓歷史記錄/驗證/模型落在每代理路徑下，不需要手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk provider/provider-map 標準化現在會依結構相等性比較，因此只有鍵順序差異不再觸發重複的無作用 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor 會掃描所有已安裝 Plugin manifest，尋找已棄用的頂層 capability 鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將其移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移具冪等性；如果 `contracts` 鍵已具有相同值，舊版鍵會被移除而不複製資料。
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor 也會檢查 Cron 工作存放區（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時為 `cron.store`），尋找排程器仍為相容性接受的舊工作形狀。

    目前的 Cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery 別名 → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` webhook 後援工作 → 明確的 `delivery.mode="webhook"` 搭配 `delivery.to=cron.webhook`

    Doctor 只有在不改變行為的情況下，才會自動遷移 `notify: true` 作業。如果某個作業同時結合舊版 notify 後援與現有的非 Webhook 傳遞模式，doctor 會提出警告，並保留該作業供手動檢閱。

    在 Linux 上，當使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會警告。這個主機本機指令碼不再由目前的 OpenClaw 維護，而且當 cron 無法連到 systemd 使用者匯流排時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。使用 `crontab -e` 移除過期的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理程式工作階段目錄，尋找過期的寫入鎖定檔案，也就是工作階段異常結束後留下的檔案。針對找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍存活、鎖定時間，以及是否被視為過期（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過期的鎖定檔案；否則會列印提示，並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描代理程式工作階段 JSONL 檔案，尋找由 2026.4.24 提示逐字稿重寫錯誤所建立的重複分支形狀：一個已被棄用的使用者回合，其中包含 OpenClaw 內部執行階段上下文，並且有一個作用中的同層分支，包含相同的可見使用者提示。在 `--fix` / `--repair` 模式中，doctor 會在每個受影響檔案旁邊備份原始檔案，並將逐字稿重寫為作用中分支，讓 Gateway 歷史和記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是作業的中樞。如果它消失，你會失去工作階段、憑證、記錄和設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（偵測到擁有者/群組不相符時，會發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時提出警告，因為同步支援的路徑可能造成較慢的 I/O 和鎖定/同步競態。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時提出警告，因為以 SD 或 eMMC 為後端的隨機 I/O 在工作階段與憑證寫入時可能較慢且磨耗更快。
    - **工作階段目錄遺失**：`sessions/` 和工作階段儲存目錄是持久化歷史並避免 `ENOENT` 當機所必需的。
    - **逐字稿不相符**：當最近的工作階段項目缺少逐字稿檔案時提出警告。
    - **主要工作階段「1 行 JSONL」**：當主要逐字稿只有一行時標記（歷史未累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於不同家目錄中，或 `OPENCLAW_STATE_DIR` 指向其他位置時提出警告（歷史可能在不同安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/所有人讀取，會提出警告並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在權杖即將到期/已到期時提出警告，並在安全時重新整理它們。如果 Anthropic OAuth/權杖設定檔已過期，它會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或供應商要求你重新登入），doctor 會回報需要重新驗證，並列印要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因下列原因而暫時無法使用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長時間停用（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果設定了 `hooks.gmail.model`，doctor 會根據目錄和允許清單驗證模型參照，並在無法解析或不允許時提出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，doctor 會檢查 Docker 映像，並在目前映像遺失時提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中移除舊版 OpenClaw 產生的 Plugin 相依性暫存狀態。這涵蓋過期的產生相依性根目錄、舊的安裝階段目錄、先前 bundled-plugin 相依性修復程式碼留下的套件本機殘留，以及可能遮蔽目前 bundled manifest 的孤立或復原後受管理 npm 副本 bundled `@openclaw/*` Plugin。

    當設定參照可下載 Plugin，但本機 Plugin 登錄找不到它們時，doctor 也可以重新安裝遺失的可下載 Plugin。範例包括實際的 `plugins.entries`、已設定的頻道/供應商/搜尋設定，以及已設定的代理程式執行階段。在套件更新期間，doctor 會避免在核心套件正在替換時執行套件管理器 Plugin 修復；如果更新後已設定的 Plugin 仍需要復原，請再次執行 `openclaw doctor --fix`。Gateway 啟動和設定重新載入不會執行套件管理器；Plugin 安裝仍然是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除它們及使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的 Gateway 類服務並列印清理提示。以設定檔命名的 OpenClaw Gateway 服務會被視為第一級服務，不會被標記為「額外」。

    在 Linux 上，如果使用者層級 Gateway 服務遺失，但存在系統層級的 OpenClaw Gateway 服務，doctor 不會自動安裝第二個使用者層級服務。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統監督程式擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳戶有待處理或可操作的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移和舊版加密狀態準備。這兩個步驟都不是致命的；錯誤會被記錄，啟動會繼續。在唯讀模式（未使用 `--fix` 的 `openclaw doctor`）中，此檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會將裝置配對狀態納入一般健康檢查。

    它會回報：

    - 待處理的首次配對要求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 ID 仍相符但裝置身分不再符合已核准記錄時的公開金鑰不相符修復
    - 已配對記錄缺少已核准角色的有效權杖
    - 已配對權杖的範圍漂移到已核准配對基準之外
    - 目前機器的本機快取裝置權杖項目早於 Gateway 端權杖輪換，或帶有過期的範圍中繼資料

    Doctor 不會自動核准配對要求或自動輪換裝置權杖。它會改為列印確切的下一步：

    - 使用 `openclaw devices list` 檢查待處理要求
    - 使用 `openclaw devices approve <requestId>` 核准確切要求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪換新權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這會修補常見的「已經配對但仍收到需要配對」漏洞：doctor 現在會區分首次配對、待處理角色/範圍升級，以及過期權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當供應商在沒有允許清單的情況下對 DM 開放，或原則以危險方式設定時，doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd lingering（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 Gateway 在登出後保持存活。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、Plugin 與舊版目錄）">
    Doctor 會列印預設代理程式的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及被允許清單封鎖的 Skills。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時提出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 Plugin；列出任何錯誤的 Plugin ID；回報 bundle Plugin capabilities。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 Plugin。
    - **Plugin 診斷**：呈現 Plugin 登錄在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始字元數與注入後字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元數佔總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過期頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除遺失的頻道 Plugin 時，它也會移除參照該 Plugin 的懸空頻道範圍設定：`channels.<id>` 項目、命名該頻道的 Heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可避免頻道執行階段已消失但設定仍要求 Gateway 綁定它而造成的 Gateway 開機迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補完">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 tab 補完：

    - 如果 shell 設定檔使用緩慢的動態補完模式（`source <(openclaw completion ...)`），doctor 會將它升級為較快的快取檔案變體。
    - 如果補完已在設定檔中設定但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全未設定補完，doctor 會提示安裝它（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機權杖）">
    Doctor 會檢查本機 Gateway 權杖驗證就緒狀態。

    - 如果權杖模式需要權杖且不存在權杖來源，doctor 會提供產生一個的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會提出警告，且不會用明文覆寫它。
    - `openclaw doctor --generate-gateway-token` 只有在未設定權杖 SecretRef 時才會強制產生。

  </Accordion>
  <Accordion title="12b. 唯讀、可感知 SecretRef 的修復">
    某些修復流程需要檢查已設定的認證，同時不削弱執行階段快速失敗的行為。

    - `openclaw doctor --fix` 現在會使用與 status 系列命令相同的唯讀 SecretRef 摘要模型，來進行目標式設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的機器人認證。
    - 如果 Telegram 機器人權杖透過 SecretRef 設定，但在目前命令路徑中不可用，doctor 命令會回報該認證已設定但不可用，並略過自動解析，而不是當機或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查與重新啟動">
    doctor 命令會執行健康檢查，並在 Gateway 看起來不健康時提示重新啟動。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    doctor 命令會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理程式準備就緒。其行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若否，會印出修復指引，包括 npm 套件與手動二進位檔路徑選項。
    - **明確本機提供者**：檢查本機模型檔案，或可辨識的遠端／可下載模型 URL。若缺少，建議切換到遠端提供者。
    - **明確遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。若缺少，會印出可操作的修復提示。
    - **自動提供者**：先檢查本機模型可用性，然後依自動選擇順序嘗試每個遠端提供者。

    當有快取的 Gateway 探測結果可用時（Gateway 在檢查時是健康的），doctor 命令會將其結果與 CLI 可見的設定交叉比對，並標示任何差異。doctor 命令不會在預設路徑上啟動新的嵌入 ping；當你想要即時提供者檢查時，請使用深度記憶狀態命令。

    使用 `openclaw memory status --deep` 來驗證執行階段的嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. Channel 狀態警告">
    如果 Gateway 健康，doctor 命令會執行 Channel 狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核與修復">
    doctor 命令會檢查已安裝的監督程式設定（launchd/systemd/schtasks），找出缺少或過時的預設值（例如 systemd network-online 相依性與重新啟動延遲）。找到不相符時，會建議更新，並可將服務檔案／工作重寫為目前預設值。

    注意事項：

    - `openclaw doctor` 會在重寫監督程式設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會套用建議修復而不提示。
    - `openclaw doctor --repair --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 命令在 Gateway 服務生命週期上保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝／啟動／重新啟動／bootstrap、監督程式設定重寫，以及舊版服務清理，因為該生命週期由外部監督程式擁有。
    - 在 Linux 上，當相符的 systemd Gateway 單元處於啟用狀態時，doctor 命令不會重寫命令／進入點中繼資料。它也會在重複服務掃描期間忽略未啟用的非舊版額外類 Gateway 單元，因此輔助服務檔案不會產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 命令的服務安裝／修復會驗證 SecretRef，但不會將已解析的明文權杖值持久化到監督程式服務環境中繼資料中。
    - doctor 命令會偵測舊版 LaunchAgent、systemd 或 Windows 排程工作安裝中內嵌行內的受管理 `.env`／SecretRef 後援服務環境值，並重寫服務中繼資料，使這些值從執行階段來源載入，而不是從監督程式定義載入。
    - doctor 命令會偵測服務命令是否在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且已設定的權杖 SecretRef 無法解析，doctor 命令會封鎖安裝／修復路徑，並提供可操作的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 命令會封鎖安裝／修復，直到明確設定模式為止。
    - 對於 Linux 使用者 systemd 單元，doctor 命令的權杖漂移檢查現在會在比較服務驗證中繼資料時，同時包含 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後由較新版本寫入時，doctor 命令的服務修復會拒絕重寫、停止或重新啟動來自較舊 OpenClaw 二進位檔的 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段與連接埠診斷">
    doctor 命令會檢查服務執行階段（PID、最後結束狀態），並在服務已安裝但實際未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 命令會發出警告。WhatsApp 與 Telegram Channel 需要 Node，而版本管理器路徑可能在升級後中斷，因為服務不會載入你的 shell 初始化。doctor 命令會在可用時提示遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Volta、asdf、fnm、pnpm 和其他版本管理器目錄不會改變 Node 子程序的解析結果。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）與穩定的使用者二進位目錄，但推測的版本管理器備援目錄只有在這些目錄存在於磁碟上時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入與精靈中繼資料">
    doctor 命令會持久化任何設定變更，並標記精靈中繼資料以記錄該次 doctor 命令執行。
  </Accordion>
  <Accordion title="19. Workspace 提示（備份與記憶系統）">
    doctor 命令會在缺少時建議 Workspace 記憶系統，並在 Workspace 尚未置於 git 下時印出備份提示。

    如需 Workspace 結構與 git 備份（建議使用私有 GitHub 或 GitLab）的完整指南，請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway Runbook](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
