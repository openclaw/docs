---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
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

    不提示即套用建議的修復（安全時包含修復與重新啟動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用更積極的修復（會覆寫自訂 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不顯示提示執行，且只套用安全遷移（設定標準化與磁碟上的狀態搬移）。略過需要人工確認的重新啟動/服務/沙盒動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外的 gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

若想在寫入前檢視變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 它會做什麼（摘要）

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝的選用預先更新（僅限互動模式）。
    - UI 協定新鮮度檢查（當協定結構描述較新時重建 Control UI）。
    - 健康檢查與重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/受阻）與 plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定標準化。
    - 將舊版扁平 `talk.*` 欄位遷移至 `talk.provider` + `talk.providers.<provider>` 的 Talk 設定遷移。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth profile 的 OAuth TLS 前置條件檢查。
    - 當 `plugins.allow` 具限制性但工具政策仍要求萬用字元或 plugin 擁有工具時的 Plugin/工具允許清單警告。
    - 舊版磁碟狀態遷移（工作階段/agent 目錄/WhatsApp auth）。
    - 舊版 plugin manifest contract key 遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 cron store 遷移（`jobId`, `schedule.cron`, 最上層 delivery/payload 欄位、payload `provider`、簡單的 `notify: true` webhook fallback jobs）。
    - 舊版 agent runtime-policy 遷移至 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 plugins 時清理過時的 plugin 設定；當 `plugins.enabled=false` 時，過時的 plugin 參照會被視為非作用中的 containment config 並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 工作階段鎖定檔檢查與過時鎖定清理。
    - 修復受影響 2026.4.24 組建建立的重複 prompt-rewrite 分支工作階段轉錄。
    - 卡住的 subagent 重新啟動復原 tombstone 偵測，並支援以 `--fix` 清除過時的 aborted recovery flags，讓啟動時不再持續把 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（工作階段、轉錄、狀態目錄）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - 模型 auth 健康狀態：檢查 OAuth 到期、可重新整理即將到期的 token，並回報 auth-profile 冷卻/停用狀態。
    - 額外工作區目錄偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisors">
    - 啟用沙盒時的沙盒映像修復。
    - 舊版服務遷移與額外 gateway 偵測。
    - Matrix 頻道舊版狀態遷移（於 `--fix` / `--repair` 模式）。
    - Gateway 執行階段檢查（服務已安裝但未執行；快取的 launchd label）。
    - 頻道狀態警告（從執行中的 gateway 探測）。
    - 當本機 TUI clients 仍在執行時，針對 degraded Gateway event-loop 健康狀態的 WhatsApp 回應性檢查；`--fix` 只會停止已驗證的本機 TUI clients。
    - Supervisor 設定稽核（launchd/systemd/schtasks），並提供選用修復。
    - 清理 gateway 服務在安裝或更新期間擷取的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所造成的嵌入式 proxy 環境。
    - Gateway 執行階段最佳實務檢查（Node vs Bun、version-manager paths）。
    - Gateway 連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="Auth、安全性與配對">
    - 開放 DM 政策的安全性警告。
    - local token mode 的 Gateway auth 檢查（當沒有 token source 時提供 token 產生；不會覆寫 token SecretRef configs）。
    - 裝置配對問題偵測（待處理的首次配對要求、待處理的 role/scope 升級、過時的本機 device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區 bootstrap 檔案大小檢查（context files 的截斷/接近限制警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報缺少 bins、env、config 或 OS requirements 的允許 skills，且 `--fix` 可停用 `skills.entries` 中無法使用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - 記憶體搜尋 embedding provider 就緒狀態檢查（本機模型、遠端 API key 或 QMD binary）。
    - 原始碼安裝檢查（pnpm workspace 不相符、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定與 wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI 的 Dreams 場景包含 **回填**、**重設** 與 **清除 Grounded** 動作，用於 grounded Dreaming 工作流程。這些動作使用 gateway doctor 風格的 RPC methods，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做的事：

- **回填**會掃描目前工作區中的歷史 `memory/YYYY-MM-DD.md` 檔案，執行 grounded REM diary pass，並將可復原的回填項目寫入 `DREAMS.md`。
- **重設**只會從 `DREAMS.md` 移除那些已標記的回填 diary entries。
- **清除 Grounded**只會移除來自歷史 replay、尚未累積 live recall 或 daily support 的 staged grounded-only short-term entries。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你先明確執行 staged CLI path，否則它們不會自動將 grounded candidates stage 到 live short-term promotion store

若要讓 grounded historical replay 影響一般 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates stage 到 short-term Dreaming store，同時保留 `DREAMS.md` 作為 review surface。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 以互動方式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定標準化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將其標準化為目前的結構描述。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到 provider map。

    當 `plugins.allow` 非空且工具政策使用
    萬用字元或 plugin 擁有的工具項目時，Doctor 也會警告。`tools.allow: ["*"]` 只會比對
    實際載入的 plugins 所提供的工具；它不會繞過排他的 plugin
    允許清單。Doctor 會為已遷移的舊版 allowlist configs 寫入 `plugins.bundledDiscovery: "compat"`，
    以保留既有 bundled provider 行為，接著指向更嚴格的 `"allowlist"` 設定。

  </Accordion>
  <Accordion title="2. 舊版設定 key 遷移">
    當設定包含已棄用的 keys 時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 keys。
    - 顯示已套用的遷移。
    - 使用更新後的結構描述重寫 `~/.openclaw/openclaw.json`。

    Gateway 在啟動時偵測到舊版設定格式時，也會自動執行 doctor 遷移，因此過時的設定會在無需手動介入的情況下修復。Cron job store 遷移由 `openclaw doctor --fix` 處理。

    目前的遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 已設定頻道設定缺少可見回覆政策 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 頂層 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 對於具有具名 `accounts` 但仍殘留單帳戶頂層頻道值的頻道，將那些帳戶範圍值移入為該頻道選定的提升帳戶（多數頻道為 `accounts.default`；Matrix 可以保留既有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；對緩慢的提供者/模型逾時請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版 extension relay 設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（gateway 啟動時也會略過 `api` 設為未來或未知 enum 值的提供者，而不是關閉失敗）

    Doctor 警告也包含多帳戶頻道的帳戶預設值指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，卻沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告備援路由可能選到非預期帳戶。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳戶 ID，doctor 會警告並列出已設定的帳戶 ID。

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會迫使模型使用錯誤的 API，或將成本歸零。Doctor 會警告，讓你可以移除覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    如果你的瀏覽器設定仍指向已移除的 Chrome extension 路徑，doctor 會將它正規化為目前的主機本機 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` profile 時，doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查同一主機上是否已安裝 Google Chrome，以供預設自動連線 profile 使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - gateway/node 主機上有 Chromium 架構瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只關於本機附加先決條件。Existing-session 會保留目前的 Chrome MCP 路由限制；`responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理的瀏覽器或原始 CDP profile。

    此檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。那些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    設定 OpenAI Codex OAuth profile 時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊能否驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），doctor 會列印平台特定的修正指引。在使用 Homebrew Node 的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 gateway 健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    如果你先前在 `models.providers.openai-codex` 底下新增了舊版 OpenAI 傳輸設定，它們可能遮蔽新版會自動使用的內建 Codex OAuth 提供者路徑。Doctor 在看到那些舊傳輸設定與 Codex OAuth 同時存在時會警告，讓你可以移除或改寫過時的傳輸覆寫，並取回內建路由/備援行為。仍支援自訂 proxy 與僅標頭覆寫，而且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    啟用內建 Codex Plugin 時，doctor 也會檢查 `openai-codex/*` 主要模型參照是否仍透過預設 PI runner 解析。當你想透過 PI 使用 Codex OAuth/訂閱驗證時，這個組合是有效的，但很容易與原生 Codex app-server harness 混淆。Doctor 會警告並指向明確的 app-server 形狀：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不會自動修復，因為兩條路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw runner 使用 Codex OAuth/訂閱驗證。」
    - `openai/*` + `agentRuntime.id: "codex"` 表示「透過原生 Codex app-server 執行嵌入式回合。」
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話。」
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx adapter。」

    如果出現警告，請選擇你原本預期的路由並手動編輯設定。當 PI Codex OAuth 是有意使用時，請保留警告不變。

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    在你將已設定的預設/備援模型或 runtime 從 Plugin 擁有的路由（例如 Codex）移開後，doctor 也會掃描作用中的 sessions store，尋找過時的自動建立路由狀態。

    `openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型釘選、runtime 模型中繼資料、釘選的 harness ID、CLI session 繫結，以及當擁有路由已不再設定時的自動 auth-profile 覆寫。明確的使用者或舊版 session 模型選擇會回報供手動審查並保持不變；當該路由不再是預期路由時，請使用 `/model ...`、`/new` 切換它們，或重設 session。

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor 可以將較舊的磁碟版面配置遷移到目前結構：

    - Sessions store + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent dir：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp auth state (Baileys)：
      - 從舊版 `~/.openclaw/credentials/*.json`（不含 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳戶 ID：`default`）

    這些遷移是盡力而為且具冪等性；當 doctor 將任何舊版資料夾留作備份時，會發出警告。Gateway/CLI 在啟動時也會自動遷移舊版 sessions + agent dir，讓歷史記錄/auth/模型落在每個 agent 的路徑中，而不需要手動執行 doctor。WhatsApp auth 有意只透過 `openclaw doctor` 遷移。Talk provider/provider-map 正規化現在會依結構相等性比較，因此只有 key 順序不同的 diff 不再觸發重複的空操作 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor 會掃描所有已安裝的 Plugin manifest，尋找已淘汰的頂層 capability key（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將它們移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移具冪等性；如果 `contracts` key 已經有相同值，舊版 key 會被移除，而不會重複資料。
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor 也會檢查 cron job store（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時的 `cron.store`），尋找排程器仍為相容性接受的舊 job 形狀。

    目前的 cron 清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery alias → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` webhook fallback job → 明確的 `delivery.mode="webhook"`，並帶有 `delivery.to=cron.webhook`

    Doctor 只有在不改變行為的情況下，才會自動遷移 `notify: true` job。如果某個 job 將舊版 notify fallback 與既有非 webhook delivery mode 結合，doctor 會警告並保留該 job 供手動審查。

    在 Linux 上，doctor 也會在使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時發出警告。這個主機本機腳本不由目前的 OpenClaw 維護，且當 cron 無法連到 systemd 使用者匯流排時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束後留下的檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍存活、鎖定存在多久，以及是否被視為過時（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過時的鎖定檔案；否則會列印提示，並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描代理工作階段 JSONL 檔案，找出由 2026.4.24 提示逐字稿重寫錯誤所建立的重複分支形狀：一個被棄用的使用者回合，含有 OpenClaw 內部執行階段脈絡，以及一個含有相同可見使用者提示的作用中同層項目。在 `--fix` / `--repair` 模式中，doctor 會在原檔旁備份每個受影響的檔案，並將逐字稿重寫為作用中分支，讓 Gateway 歷史記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是操作上的核心中樞。如果它消失，你會遺失工作階段、憑證、日誌與設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失、提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（並在偵測到擁有者/群組不相符時輸出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 以及鎖定/同步競態。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 在工作階段與憑證寫入下可能較慢且磨耗較快。
    - **工作階段目錄遺失**：`sessions/` 與工作階段儲存目錄是持久保存歷史記錄並避免 `ENOENT` 當機所必需。
    - **逐字稿不相符**：當最近的工作階段項目缺少逐字稿檔案時發出警告。
    - **主工作階段「1 行 JSONL」**：當主要逐字稿只有一行時標記（歷史記錄沒有累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於不同家目錄，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能在不同安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可被群組/全世界讀取，則發出警告並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在權杖即將到期/已到期時發出警告，並在安全時重新整理權杖。如果 Anthropic OAuth/權杖設定檔已過時，它會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式（TTY）執行時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或供應商要求你重新登入），doctor 會回報需要重新驗證，並列印要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因下列原因暫時無法使用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長時間停用（帳單/點數失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果已設定 `hooks.gmail.model`，doctor 會根據目錄與允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙盒映像修復">
    啟用沙盒時，doctor 會檢查 Docker 映像，並在目前映像遺失時提供建置或切換至舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中，移除舊版 OpenClaw 產生的 Plugin 相依性暫存狀態。這涵蓋過時的產生相依性根目錄、舊的安裝階段目錄、早期內建 Plugin 相依性修復程式碼留下的套件本機殘留物，以及可遮蔽目前內建資訊清單的孤立或已復原的受管 npm 內建 `@openclaw/*` plugins 副本。

    當設定參照可下載 plugins，但本機 Plugin 登錄找不到它們時，Doctor 也可以重新安裝遺失的可下載 plugins。範例包括實際的 `plugins.entries`、已設定的頻道/供應商/搜尋設定，以及已設定的代理執行階段。在套件更新期間，doctor 會在核心套件替換中避免執行套件管理器 Plugin 修復；如果更新後已設定的 Plugin 仍需復原，請再次執行 `openclaw doctor --fix`。Gateway 啟動與設定重新載入不會執行套件管理器；Plugin 安裝仍是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除它們以及使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 Gateway 服務並列印清理提示。具設定檔名稱的 OpenClaw Gateway 服務會被視為一等服務，不會被標記為「額外」。

    在 Linux 上，如果使用者層級的 Gateway 服務遺失，但系統層級的 OpenClaw Gateway 服務存在，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項，或在系統監督器擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳號有待處理或可採取動作的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行最佳努力的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。兩個步驟都不是致命錯誤；錯誤會被記錄，啟動會繼續。在唯讀模式（未加 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會在一般健康檢查流程中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 id 仍相符但裝置身分不再符合已核准記錄的公開金鑰不相符修復
    - 已配對記錄缺少已核准角色的作用中權杖
    - 範圍漂移到已核准配對基準外的已配對權杖
    - 目前機器上的本機快取裝置權杖項目，早於 Gateway 端權杖輪替，或帶有過時的範圍中繼資料

    Doctor 不會自動核准配對請求或自動輪替裝置權杖。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准確切請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過時記錄

    這會補上常見的「已配對但仍收到需要配對」漏洞：doctor 現在會區分首次配對、待處理的角色/範圍升級，以及過時權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    當供應商在沒有允許清單的情況下對私訊開放，或政策以危險方式設定時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 Gateway 在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、plugins 與舊版目錄）">
    Doctor 會列印預設代理的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及被允許清單封鎖的 skills 數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 plugins 數量；列出任何錯誤的 Plugin ID；回報套件 Plugin 功能。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 plugins。
    - **Plugin 診斷**：顯示 Plugin 登錄在載入期間輸出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的脈絡檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始與注入後字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及注入字元總數占總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 與 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過時頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除遺失的頻道 Plugin 時，它也會移除參照該 Plugin 的懸空頻道範圍設定：`channels.<id>` 項目、命名該頻道的 Heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止頻道執行階段已消失但設定仍要求 Gateway 綁定到它時造成 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 補全：

    - 如果 shell 設定檔使用較慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將它升級為較快的快取檔案變體。
    - 如果設定檔中已設定補全但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全沒有設定補全，doctor 會提示安裝（僅互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機權杖）">
    Doctor 會檢查本機 Gateway 權杖驗證就緒狀態。

    - 如果權杖模式需要權杖且沒有權杖來源，doctor 會提供產生權杖的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告且不會以純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只有在未設定權杖 SecretRef 時才會強制產生。

  </Accordion>
  <Accordion title="12b. SecretRef 感知的唯讀修復">
    某些修復流程需要在不削弱執行階段快速失敗行為的情況下檢查已設定的憑證。

    - `openclaw doctor --fix` 現在針對目標設定修復，會使用與 status 系列命令相同的唯讀 SecretRef 摘要模型。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 憑證。
    - 如果 Telegram bot token 是透過 SecretRef 設定，但在目前命令路徑中無法取得，doctor 會回報該憑證已設定但不可用，並略過自動解析，而不是當機或誤報 token 缺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    doctor 會執行健康檢查，並在 Gateway 看起來不健康時提議重新啟動。
  </Accordion>
  <Accordion title="13b. 記憶體搜尋就緒狀態">
    doctor 會檢查已設定的記憶體搜尋嵌入提供者是否已為預設代理程式準備就緒。行為取決於設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若否，會列印修復指引，包括 npm 套件與手動二進位檔路徑選項。
    - **明確本機提供者**：檢查本機模型檔案，或可辨識的遠端/可下載模型 URL。若缺失，會建議切換到遠端提供者。
    - **明確遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API key。若缺失，會列印可執行的修復提示。
    - **自動提供者**：先檢查本機模型可用性，然後依自動選擇順序嘗試每個遠端提供者。

    當有快取的 Gateway 探測結果可用時（Gateway 在檢查時是健康的），doctor 會將其結果與 CLI 可見設定交叉比對，並註明任何差異。doctor 不會在預設路徑上啟動新的嵌入 ping；當你想要即時提供者檢查時，請使用深度記憶體狀態命令。

    使用 `openclaw memory status --deep` 在執行階段驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 通道狀態警告">
    如果 Gateway 健康，doctor 會執行通道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. supervisor 設定稽核 + 修復">
    doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks）是否缺少或使用過時預設值（例如 systemd network-online 相依性與重新啟動延遲）。當發現不相符時，它會建議更新，並可將服務檔案/任務重寫為目前預設值。

    注意事項：

    - `openclaw doctor` 會在重寫 supervisor 設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會套用建議修復而不提示。
    - `openclaw doctor --repair --force` 會覆寫自訂 supervisor 設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 Gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序、supervisor 設定重寫，以及舊版服務清理，因為外部 supervisor 擁有該生命週期。
    - 在 Linux 上，當相符的 systemd Gateway unit 為作用中時，doctor 不會重寫命令/進入點中繼資料。它也會在重複服務掃描期間忽略非作用中的非舊版額外 Gateway 類似 unit，以免伴隨服務檔案產生清理雜訊。
    - 如果 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝/修復會驗證 SecretRef，但不會將已解析的純文字 token 值持久化到 supervisor 服務環境中繼資料中。
    - doctor 會偵測較舊 LaunchAgent、systemd 或 Windows 排程工作安裝曾內嵌行內的受管 `.env`/SecretRef 支援服務環境值，並重寫服務中繼資料，讓這些值從執行階段來源載入，而不是從 supervisor 定義載入。
    - doctor 會偵測服務命令是否在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果 token 驗證需要 token，且已設定的 token SecretRef 未解析，doctor 會封鎖安裝/修復路徑，並提供可執行的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會封鎖安裝/修復，直到明確設定 mode。
    - 對於 Linux 使用者 systemd unit，doctor token 漂移檢查現在會在比較服務驗證中繼資料時，同時包含 `Environment=` 與 `EnvironmentFile=` 來源。
    - 當設定最後是由較新版本寫入時，doctor 服務修復會拒絕從較舊的 OpenClaw 二進位檔重寫、停止或重新啟動 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你一律可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + 連接埠診斷">
    doctor 會檢查服務執行階段（PID、最後結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 會發出警告。WhatsApp + Telegram 通道需要 Node，而版本管理器路徑可能在升級後中斷，因為服務不會載入你的 shell init。doctor 會在可用時提議遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或修復的 macOS LaunchAgents 會使用標準系統 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Volta、asdf、fnm、pnpm 與其他版本管理器目錄不會改變 Node 子程序解析的位置。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）與穩定的使用者 bin 目錄，但推測的版本管理器備援目錄只會在這些目錄存在於磁碟上時寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    doctor 會持久化任何設定變更，並標記精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶體系統）">
    doctor 會在缺少時建議工作區記憶體系統，並在工作區尚未置於 git 底下時列印備份提示。

    如需工作區結構與 git 備份（建議使用私人 GitHub 或 GitLab）的完整指南，請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
