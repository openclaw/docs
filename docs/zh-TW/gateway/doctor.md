---
read_when:
    - 新增或修改診斷遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-05-11T20:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復 + 遷移工具。它會修復過時的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

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

    不提示並接受預設值（適用時包含重新啟動/服務/sandbox 修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示並套用建議修復（在安全情況下包含修復 + 重新啟動）。

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

    不提示執行，且只套用安全遷移（設定正規化 + 磁碟上的狀態移動）。跳過需要人工確認的重新啟動/服務/sandbox 動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外的 gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在寫入前檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 它會做什麼（摘要）

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝的選用預檢更新（僅互動模式）。
    - UI 通訊協定新鮮度檢查（當通訊協定 schema 較新時重建 Control UI）。
    - 健康檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/封鎖）與 plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - 將 Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth profile 的 OAuth TLS 先決條件檢查。
    - 當 `plugins.allow` 有限制但工具政策仍要求萬用字元或 plugin 擁有的工具時，顯示 Plugin/tool 允許清單警告。
    - 舊版磁碟上狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 plugin manifest 合約鍵遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 cron store 遷移（`jobId`, `schedule.cron`, 最上層 delivery/payload 欄位、payload `provider`、簡單 `notify: true` webhook 後援 jobs）。
    - 舊版 whole-agent runtime-policy 清理；provider/model runtime policy 是作用中的 route selector。
    - 啟用 plugin 時清理過時的 plugin 設定；當 `plugins.enabled=false` 時，過時的 plugin 參照會被視為非作用中的 containment config 並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - Session lock file 檢查與過時 lock 清理。
    - 修復受影響的 2026.4.24 組建所建立之重複 prompt-rewrite 分支的 session transcript。
    - 偵測卡住的 subagent 重新啟動復原 tombstone，並支援以 `--fix` 清除過時的 aborted recovery flags，避免啟動時持續將 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - Model auth 健康狀態：檢查 OAuth 到期、可重新整理即將到期的 tokens，並回報 auth-profile cooldown/disabled 狀態。
    - 額外 workspace dir 偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisors">
    - 啟用 sandboxing 時的 sandbox 映像修復。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway runtime 檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從正在執行的 gateway 探測）。
    - Channel 特定權限檢查位於 `openclaw channels capabilities` 下；例如，Discord voice channel 權限會用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核。
    - WhatsApp 回應性檢查，用於在 local TUI clients 仍在執行時偵測退化的 Gateway event-loop 健康狀態；`--fix` 只會停止已驗證的 local TUI clients。
    - 修復主要 models、fallbacks、heartbeat/subagent/compaction overrides、hooks、channel model overrides 與 session route pins 中舊版 `openai-codex/*` model refs 的 Codex route；`--fix` 會將它們重寫為 `openai/*`、移除過時的 session/whole-agent runtime pins，並將標準 OpenAI agent refs 留在預設 Codex harness 上。
    - Supervisor 設定稽核（launchd/systemd/schtasks），並提供選用修復。
    - 清理 gateway 服務在安裝或更新期間擷取到 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的嵌入式 proxy 環境。
    - Gateway runtime 最佳實務檢查（Node vs Bun、version-manager paths）。
    - Gateway port 衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="認證、安全性與配對">
    - 開放 DM 政策的安全性警告。
    - local token mode 的 Gateway auth 檢查（當沒有 token source 時提供 token 產生；不覆寫 token SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對請求、待處理的角色/範圍升級、過時 local device-token cache 漂移，以及 paired-record auth 漂移）。

  </Accordion>
  <Accordion title="Workspace 與 shell">
    - Linux 上的 systemd linger 檢查。
    - Workspace bootstrap 檔案大小檢查（context files 的截斷/接近限制警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報缺少 bins、env、config 或 OS 要求的已允許 skills，且 `--fix` 可在 `skills.entries` 中停用無法使用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding provider 就緒狀態檢查（local model、remote API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace 不相符、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定 + wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含用於 grounded dreaming 工作流程的 **Backfill**、**Reset** 和 **Clear Grounded** 動作。這些動作使用 gateway doctor-style RPC methods，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做什麼：

- **Backfill** 掃描作用中 workspace 裡的歷史 `memory/YYYY-MM-DD.md` 檔案，執行 grounded REM diary pass，並將可逆的 backfill entries 寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些已標記的 backfill diary entries。
- **Clear Grounded** 只會移除 staged grounded-only short-term entries，這些項目來自歷史 replay，且尚未累積 live recall 或 daily support。

它們本身**不會**做什麼：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你先明確執行 staged CLI path，否則它們不會自動將 grounded candidates staged 到 live short-term promotion store

如果你想讓 grounded historical replay 影響一般 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates staged 到 short-term dreaming store，同時讓 `DREAMS.md` 保持為檢閱介面。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 以互動方式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）選項。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化為目前 schema。

    這包含舊版 Talk 扁平欄位。目前公開 Talk speech config 是 `talk.provider` + `talk.providers.<provider>`，realtime voice config 是 `talk.realtime.*`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫進 provider map，並將舊版最上層 realtime selectors（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）重寫到 `talk.realtime`。

    當 `plugins.allow` 非空且工具政策使用萬用字元或 plugin 擁有的工具項目時，Doctor 也會發出警告。`tools.allow: ["*"]` 只會比對實際載入的 plugin 所提供的工具；它不會繞過專屬 plugin 允許清單。Doctor 會為已遷移的舊版 allowlist 設定寫入 `plugins.bundledDiscovery: "compat"`，以保留既有 bundled provider 行為，然後指向更嚴格的 `"allowlist"` 設定。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含已棄用的鍵時，其他指令會拒絕執行，並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版鍵。
    - 顯示已套用的遷移。
    - 以更新後的 schema 重寫 `~/.openclaw/openclaw.json`。

    Gateway 啟動會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；它不會在啟動時重寫 `openclaw.json`。Cron job store 遷移也由 `openclaw doctor --fix` 處理。

    目前遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 缺少可見回覆政策的已設定頻道設定 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 對於具有具名 `accounts` 但仍殘留單一帳號頂層頻道值的頻道，將這些帳號範圍的值移入為該頻道選定的提升帳號（多數頻道為 `accounts.default`；Matrix 可以保留既有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；慢速提供者/模型逾時請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版擴充功能轉送設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知列舉值的提供者，而不是封閉式失敗）
    - 移除 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律保留 Codex 原生工作區工具為原生

    Doctor 警告也包含多帳號頻道的帳號預設指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告備援路由可能選到非預期帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳號 ID，doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你已手動加入 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@earendil-works/pi-ai` 的內建 OpenCode 目錄。這可能會迫使模型使用錯誤 API 或將成本歸零。Doctor 會警告，讓你移除覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. Browser 遷移與 Chrome MCP 就緒狀態">
    如果你的 browser 設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將其正規化為目前的主機本機 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查同一主機上是否已安裝 Google Chrome，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時警告
    - 提醒你在瀏覽器檢查頁面啟用遠端除錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - gateway/node 主機上的 Chromium 型瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端除錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只涵蓋本機附加先決條件。Existing-session 會保留目前的 Chrome MCP 路由限制；`responsebody`、PDF 匯出、下載攔截、批次動作等進階路由仍需要受管理瀏覽器或原始 CDP 設定檔。

    這項檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。那些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先決條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊是否能驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定的修正指引。在使用 Homebrew Node 的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 gateway 健康也會執行探測。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下加入舊版 OpenAI 傳輸設定，它們可能會遮蔽新版會自動使用的內建 Codex OAuth 提供者路徑。Doctor 看到這些舊傳輸設定與 Codex OAuth 同時存在時會警告，讓你移除或重寫過時的傳輸覆寫，並恢復內建路由/備援行為。自訂 proxy 和僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex harness 路由使用標準 `openai/*` 模型參照；OpenAI agent 回合會透過 Codex app-server harness，而不是 OpenClaw PI OpenAI 路徑。

    在 `--fix` / `--repair` 模式中，doctor 會重寫受影響的預設 agent 與逐 agent 參照，包括主要模型、備援、heartbeat/subagent/compaction 覆寫、hook、頻道模型覆寫，以及過時的持久化 session 路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - Codex 意圖會移至提供者/模型範圍的 `agentRuntime.id: "codex"` 項目，用於已修復的 agent 模型參照，因此模型參照變成 `openai/*` 後，仍可選取 `openai-codex:...` auth 設定檔。
    - 過時的整個 agent runtime 設定和持久化 session runtime pin 會被移除，因為 runtime 選擇是提供者/模型範圍。
    - 除非修復後的舊版模型參照需要 Codex 路由來保留舊 auth 路徑，否則既有提供者/模型 runtime 政策會被保留。
    - 既有模型備援清單會保留，且其舊版項目會被重寫；複製的逐模型設定會從舊版 key 移至標準 `openai/*` key。
    - 在所有已發現的 agent session store 中，會修復持久化 session 的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、備援通知，以及 auth-profile pin。
    - `/codex ...` 表示「從聊天控制或綁定原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx adapter」。

  </Accordion>
  <Accordion title="2g. Session 路由清理">
    在你將已設定模型或 runtime 從 Plugin 擁有的路由（例如 Codex）移走後，Doctor 也會掃描已發現的 agent session store，尋找過時的自動建立路由狀態。

    `openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型 pin、runtime 模型中繼資料、已 pin 的 harness id、CLI session 綁定，以及當其擁有路由不再設定時的自動 auth-profile 覆寫。明確的使用者或舊版 session 模型選擇會被回報以供手動檢閱並保持不變；當該路由不再預期使用時，請用 `/model ...`、`/new` 切換，或重設 session。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟版面配置）">
    Doctor 可以將較舊的磁碟版面配置遷移到目前結構：

    - Sessions store + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent dir：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp auth 狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 id：`default`）

    這些遷移採 best-effort 且具冪等性；doctor 留下任何舊資料夾作為備份時會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版 sessions + agent dir，讓歷史/auth/模型落在逐 agent 路徑中，而不需要手動執行 doctor。WhatsApp auth 刻意只透過 `openclaw doctor` 遷移。Talk provider/provider-map 正規化現在會依結構相等性比較，因此只有 key 順序差異的 diff 不再觸發重複的無操作 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝 Plugin manifest 中是否有已棄用的頂層 capability key（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將它們移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移具冪等性；如果 `contracts` key 已有相同值，舊版 key 會被移除而不重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 cron store 遷移">
    Doctor 也會檢查 cron job store（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時為 `cron.store`），尋找排程器為了相容性仍接受的舊 job 形狀。

    目前的 cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery 別名 → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` Webhook 後援工作 → 明確的 `delivery.mode="webhook"`，並設定 `delivery.to=cron.webhook`

    Doctor 只有在不會改變行為時，才會自動遷移 `notify: true` 工作。如果某個工作同時結合舊版 notify 後援與現有的非 Webhook delivery 模式，doctor 會發出警告，並將該工作留待手動審查。

    在 Linux 上，當使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會發出警告。該主機本機腳本不由目前的 OpenClaw 維護，且當 cron 無法連上 systemd 使用者 bus 時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個 agent 工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束時留下的檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍存活、鎖定存在多久，以及它是否被視為過時（已死亡的 PID、超過 30 分鐘，或可證明屬於非 OpenClaw 程序的存活 PID）。在 `--fix` / `--repair` 模式中，它會自動移除過時的鎖定檔案；否則會印出說明，並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段 transcript 分支修復">
    Doctor 會掃描 agent 工作階段 JSONL 檔案，尋找由 2026.4.24 prompt transcript 重寫 bug 建立的重複分支形狀：一個被放棄的使用者回合，其中包含 OpenClaw 內部 runtime context，另有一個作用中的 sibling 包含相同的可見使用者提示。在 `--fix` / `--repair` 模式中，doctor 會在原始檔案旁備份每個受影響檔案，並將 transcript 重寫為作用中分支，讓 Gateway history 和記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    state 目錄是操作上的腦幹。如果它消失，你會失去工作階段、憑證、日誌和設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **state dir missing**：警告災難性狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失資料。
    - **state dir permissions**：驗證可寫入性；提供修復權限的選項（偵測到擁有者/群組不符時，會發出 `chown` 提示）。
    - **macOS cloud-synced state dir**：當 state 解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能導致較慢的 I/O 以及鎖定/同步競爭。
    - **Linux SD or eMMC state dir**：當 state 解析到 `mmcblk*` 掛載來源時發出警告，因為在工作階段與憑證寫入下，SD 或 eMMC 支援的隨機 I/O 可能較慢且磨耗較快。
    - **Session dirs missing**：`sessions/` 和工作階段儲存目錄是持久保存 history 並避免 `ENOENT` 當機所必需。
    - **Transcript mismatch**：當近期工作階段項目缺少 transcript 檔案時發出警告。
    - **Main session "1-line JSONL"**：當主要 transcript 只有一行時標記（history 未累積）。
    - **Multiple state dirs**：當多個 `~/.openclaw` 資料夾存在於不同 home 目錄，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（history 可能在不同安裝之間分裂）。
    - **Remote mode reminder**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（state 位於那裡）。
    - **Config file permissions**：如果 `~/.openclaw/openclaw.json` 可被群組/全世界讀取，則發出警告，並提供收緊至 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查 auth store 中的 OAuth profiles，在 token 即將到期/已到期時發出警告，並在安全時重新整理它們。如果 Anthropic OAuth/token profile 已過時，它會建議使用 Anthropic API key 或 Anthropic setup-token 路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會跳過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或 provider 要求你再次登入），doctor 會回報需要重新驗證，並印出要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因下列原因暫時無法使用的 auth profiles：

    - 短暫冷卻（速率限制/逾時/auth 失敗）
    - 較長時間停用（帳務/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果設定了 `hooks.gmail.model`，doctor 會對照 catalog 和 allowlist 驗證模型參照，並在無法解析或被禁止時發出警告。
  </Accordion>
  <Accordion title="7. Sandbox 映像修復">
    啟用 sandboxing 時，doctor 會檢查 Docker images，並在目前 image 遺失時提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中，移除舊版 OpenClaw 產生的 Plugin 相依 staging 狀態。這涵蓋過時的產生相依根目錄、舊的安裝階段目錄、早期 bundled-plugin 相依修復程式碼留下的 package-local 碎屑，以及可能遮蔽目前 bundled manifest 的孤立或復原 managed npm bundled `@openclaw/*` plugins 副本。

    當設定參照 downloadable plugins，但本機 Plugin registry 找不到它們時，Doctor 也可以重新安裝缺少的 plugins。範例包括實體 `plugins.entries`、已設定的 channel/provider/search 設定，以及已設定的 agent runtimes。在 package 更新期間，doctor 會避免在核心 package 正在被替換時執行 package-manager Plugin 修復；如果更新後某個已設定的 Plugin 仍需要復原，請再次執行 `openclaw doctor --fix`。Gateway 啟動與 config reload 不會執行 package managers；Plugin 安裝仍然是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    診斷工具會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除這些服務、使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 Gateway 服務並列印清理提示。以設定檔命名的 OpenClaw Gateway 服務會被視為一級服務，不會被標記為「額外」。

    在 Linux 上，如果缺少使用者層級 Gateway 服務，但存在系統層級 OpenClaw Gateway 服務，診斷工具不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，接著移除重複項目，或在系統監督程式擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 通道帳戶有待處理或可操作的舊版狀態遷移時，診斷工具（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。這兩個步驟都不是致命錯誤；錯誤會被記錄，啟動會繼續。在唯讀模式（不帶 `--fix` 的 `openclaw doctor`）中，會完全略過這項檢查。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    診斷工具現在會在一般健康狀態檢查中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 公開金鑰不符修復，其中裝置 id 仍相符，但裝置身分不再符合已核准的記錄
    - 缺少已核准角色之有效權杖的配對記錄
    - 範圍漂移到已核准配對基準外的配對權杖
    - 目前機器的本機快取裝置權杖項目，早於 Gateway 端權杖輪替，或帶有過時的範圍中繼資料

    診斷工具不會自動核准配對請求，也不會自動輪替裝置權杖。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准確切的請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這會補上常見的「已配對但仍顯示需要配對」漏洞：doctor 現在會區分首次配對、待處理的角色/範圍升級，以及過期權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當提供者未設定允許清單卻開放 DM，或政策以危險方式設定時，doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 linger，讓 Gateway 在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（skills、plugins 和舊版目錄）">
    doctor 會列印預設代理的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及被允許清單封鎖的 skills 數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 plugins 數量；列出任何錯誤的 plugin ID；回報套件 plugin 功能。
    - **Plugin 相容性警告**：標記與目前執行階段存在相容性問題的 plugins。
    - **Plugin 診斷**：顯示 plugin 登錄在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過已設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元數占總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 清理過期通道 Plugin">
    當 `openclaw doctor --fix` 移除缺失的通道 plugin 時，也會移除參照該 plugin 的懸空通道範圍設定：`channels.<id>` 項目、命名該通道的 heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可避免通道執行階段已不存在，但設定仍要求 Gateway 綁定到它所造成的 Gateway 開機迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 補全：

    - 如果 shell 設定檔使用較慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案變體。
    - 如果設定檔中已設定補全但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全未設定補全，doctor 會提示安裝（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機權杖）">
    doctor 會檢查本機 Gateway 權杖驗證是否就緒。

    - 如果權杖模式需要權杖但沒有權杖來源，doctor 會提議產生一個。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告，且不會用純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只有在未設定權杖 SecretRef 時才會強制產生。

  </Accordion>
  <Accordion title="12b. 支援唯讀 SecretRef 的修復">
    有些修復流程需要檢查已設定的憑證，同時不削弱執行階段快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與狀態類命令相同的唯讀 SecretRef 摘要模型，用於目標明確的設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 憑證。
    - 如果 Telegram bot 權杖透過 SecretRef 設定，但在目前命令路徑中無法使用，doctor 會回報該憑證已設定但無法使用，並略過自動解析，而不是當機或誤報權杖缺失。

  </Accordion>
  <Accordion title="13. Gateway 健全狀態檢查 + 重新啟動">
    doctor 會執行健全狀態檢查，並在 Gateway 看起來不健康時提議重新啟動。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    doctor 會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理就緒。行為取決於已設定的後端和提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若否，會列印修復指引，包括 npm 套件與手動二進位檔路徑選項。
    - **明確的本機提供者**：檢查本機模型檔案，或可識別的遠端／可下載模型 URL。若缺失，會建議切換到遠端提供者。
    - **明確的遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。若缺失，會列印可執行的修復提示。
    - **自動提供者**：先檢查本機模型可用性，然後依自動選取順序嘗試每個遠端提供者。

    當快取的 Gateway 探測結果可用時（Gateway 在檢查時是健康的），doctor 會將其結果與 CLI 可見設定交叉比對，並註記任何差異。doctor 不會在預設路徑上啟動新的嵌入 ping；需要即時提供者檢查時，請使用深度記憶狀態命令。

    使用 `openclaw memory status --deep` 在執行階段驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 通道狀態警告">
    如果 Gateway 健康，doctor 會執行通道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核 + 修復">
    doctor 會檢查已安裝的監督程式設定（launchd/systemd/schtasks），確認是否缺少預設值或預設值過舊（例如 systemd network-online 相依性和重新啟動延遲）。當發現不相符時，它會建議更新，並可將服務檔案／工作重寫為目前預設值。

    注意事項：

    - `openclaw doctor` 會在重寫監督程式設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會在沒有提示的情況下套用建議修復。
    - `openclaw doctor --repair --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 Gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝／啟動／重新啟動／bootstrap、監督程式設定重寫，以及舊版服務清理，因為該生命週期由外部監督程式擁有。
    - 在 Linux 上，當相符的 systemd Gateway 單元處於作用中時，doctor 不會重寫命令／進入點中繼資料。它也會在重複服務掃描期間忽略非作用中的非舊版額外 Gateway 類單元，因此配套服務檔案不會產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝／修復會驗證 SecretRef，但不會將已解析的純文字權杖值持久化到監督程式服務環境中繼資料。
    - doctor 會偵測舊版 LaunchAgent、systemd 或 Windows 排程工作安裝中嵌入行內的受管理 `.env`／SecretRef 支援服務環境值，並重寫服務中繼資料，使這些值從執行階段來源載入，而不是從監督程式定義載入。
    - doctor 會偵測服務命令是否在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且已設定的權杖 SecretRef 無法解析，doctor 會封鎖安裝／修復路徑並提供可執行的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會封鎖安裝／修復，直到明確設定模式為止。
    - 對於 Linux 使用者 systemd 單元，doctor 權杖漂移檢查現在會在比較服務驗證中繼資料時同時納入 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後由較新版寫入時，doctor 服務修復會拒絕從較舊的 OpenClaw 二進位檔重寫、停止或重新啟動 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你永遠可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + 連接埠診斷">
    doctor 會檢查服務執行階段（PID、上次退出狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 會發出警告。WhatsApp + Telegram 通道需要 Node，而版本管理器路徑可能在升級後中斷，因為服務不會載入你的 shell 初始化。doctor 會在可用時提議遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Homebrew 管理的系統二進位檔仍可用，同時 Volta、asdf、fnm、pnpm 和其他版本管理器目錄不會改變 Node 子行程解析方式。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者二進位檔目錄，但推測出的版本管理器後援目錄只有在這些目錄存在於磁碟上時才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    doctor 會持久化任何設定變更，並標記精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶系統）">
    doctor 會在缺少工作區記憶系統時建議設定，並在工作區尚未置於 git 下時列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得工作區結構與 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
