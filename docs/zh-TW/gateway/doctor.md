---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-05-04T09:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復與遷移工具。它會修正過時的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

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

    不提示就接受預設值（包含適用時的重新啟動/服務/沙盒修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示就套用建議的修復（安全時包含修復與重新啟動）。

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

    在不提示的情況下執行，且只套用安全遷移（設定正規化 + 磁碟狀態搬移）。略過需要人工確認的重新啟動/服務/沙盒動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以找出額外的 gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在寫入前檢視變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 它會做什麼（摘要）

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝的選用前置更新（僅限互動模式）。
    - UI 通訊協定新鮮度檢查（當通訊協定 schema 較新時重建 Control UI）。
    - 健康狀態檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/已封鎖）與 plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 先決條件檢查。
    - 當 `plugins.allow` 具限制性，但工具政策仍要求萬用字元或 plugin 擁有的工具時，發出 Plugin/工具允許清單警告。
    - 舊版磁碟狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 plugin manifest contract key 遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 cron store 遷移（`jobId`, `schedule.cron`, 頂層 delivery/payload 欄位、payload `provider`、簡單 `notify: true` webhook 後援 jobs）。
    - 舊版 agent runtime-policy 遷移到 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 plugins 時清理過時 plugin 設定；當 `plugins.enabled=false` 時，過時 plugin 參照會被視為惰性的隔離設定並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - Session lock file 檢查與過時 lock 清理。
    - 修復受影響的 2026.4.24 建置建立的重複 prompt-rewrite 分支 session transcript。
    - 卡住的 subagent 重新啟動復原 tombstone 偵測，支援用 `--fix` 清除過時的 aborted recovery flags，讓啟動不會持續把 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - Model auth 健康狀態：檢查 OAuth 到期、可重新整理即將到期的 tokens，並回報 auth-profile cooldown/disabled 狀態。
    - 額外 workspace dir 偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisors">
    - 啟用 sandboxing 時的 sandbox image 修復。
    - 舊版服務遷移與額外 gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway runtime 檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從執行中的 gateway 探測）。
    - Supervisor 設定稽核（launchd/systemd/schtasks），並可選擇修復。
    - 清理 Gateway 服務的嵌入式 proxy 環境，這些服務在安裝或更新期間擷取了 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway runtime 最佳實務檢查（Node vs Bun、version-manager 路徑）。
    - Gateway port 衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="Auth、安全性與 pairing">
    - 開放 DM 政策的安全性警告。
    - 本機 token 模式的 Gateway auth 檢查（沒有 token source 時提供 token 產生；不會覆寫 token SecretRef 設定）。
    - 裝置 pairing 問題偵測（待處理的首次 pair 請求、待處理的 role/scope 升級、過時的本機 device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace 與 shell">
    - Linux 上的 systemd linger 檢查。
    - Workspace bootstrap file 大小檢查（context files 的截斷/接近上限警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報允許但缺少 bins、env、config 或 OS 需求的 skills，且 `--fix` 可在 `skills.entries` 中停用不可用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding provider 就緒狀態檢查（本機 model、遠端 API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace 不相符、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定 + wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI backfill 與 reset

Control UI Dreams 場景包含 grounded dreaming workflow 的 **Backfill**、**Reset** 與 **Clear Grounded** 動作。這些動作使用 gateway doctor-style RPC 方法，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做的事：

- **Backfill** 會掃描 active workspace 中歷史的 `memory/YYYY-MM-DD.md` 檔案、執行 grounded REM diary pass，並將可逆的 backfill entries 寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些已標記的 backfill diary entries。
- **Clear Grounded** 只會移除來自歷史 replay、且尚未累積 live recall 或 daily support 的 staged grounded-only short-term entries。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor migrations
- 除非你先明確執行 staged CLI path，否則它們不會自動將 grounded candidates stage 到 live short-term promotion store

如果你想讓 grounded historical replay 影響一般的 deep promotion lane，請改用 CLI flow：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates stage 到 short-term dreaming store，同時讓 `DREAMS.md` 保持作為 review surface。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 正以互動方式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化為目前的 schema。

    這包含舊版 Talk 扁平欄位。目前公開 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會把舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到 provider map。

    當 `plugins.allow` 非空且工具政策使用萬用字元或 plugin-owned tool entries 時，Doctor 也會警告。`tools.allow: ["*"]` 只會符合實際載入的 plugins 中的工具；它不會繞過專屬 plugin 允許清單。

  </Accordion>
  <Accordion title="2. 舊版設定 key 遷移">
    當設定包含已棄用的 keys 時，其他 commands 會拒絕執行，並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 keys。
    - 顯示它套用的遷移。
    - 使用更新後的 schema 重寫 `~/.openclaw/openclaw.json`。

    Gateway 在啟動時偵測到舊版設定格式，也會自動執行 doctor migrations，因此過時設定不需人工介入就會被修復。Cron job store migrations 由 `openclaw doctor --fix` 處理。

    目前遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - 已設定的頻道設定缺少可見回覆政策 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 對於具有具名 `accounts` 但仍殘留單一帳號頂層頻道值的頻道，將這些帳號範圍值移入為該頻道選定的已提升帳號（多數頻道為 `accounts.default`；Matrix 可以保留既有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；針對較慢的供應商/模型逾時，請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版擴充功能轉送設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知列舉值的供應商，而不是以關閉失敗）

    Doctor 警告也包含多帳號頻道的帳號預設值指引：

    - 如果設定了兩個或更多 `channels.<channel>.accounts` 項目，但未設定 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後援路由可能選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知的帳號 ID，doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 供應商覆寫">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會警告，讓你可以移除覆寫並恢復每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將其正規化為目前的主機本機 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查 Google Chrome 是否安裝在同一台主機上，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時警告
    - 提醒你在瀏覽器檢查頁面中啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - Gateway/Node 主機上的 Chromium 型瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只關於本機附加先決條件。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由仍需要受管理瀏覽器或原始 CDP 設定檔。

    此檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先決條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊能否驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定的修復指引。在使用 Homebrew Node 的 macOS 上，修復通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 Gateway 健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 供應商覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI 傳輸設定，它們可能會遮蔽較新版本自動使用的內建 Codex OAuth 供應商路徑。Doctor 看到這些舊傳輸設定與 Codex OAuth 並存時會警告，讓你可以移除或改寫過時的傳輸覆寫，取回內建的路由/後援行為。自訂代理和僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex Plugin 路由警告">
    啟用隨附的 Codex Plugin 時，doctor 也會檢查 `openai-codex/*` 主要模型參照是否仍透過預設 PI 執行器解析。當你想透過 PI 使用 Codex OAuth/訂閱驗證時，這個組合是有效的，但很容易與原生 Codex app-server harness 混淆。Doctor 會警告並指向明確的 app-server 形狀：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不會自動修復此項，因為兩種路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw 執行器使用 Codex OAuth/訂閱驗證。」
    - `openai/*` + `agentRuntime.id: "codex"` 表示「透過原生 Codex app-server 執行嵌入式回合。」
    - `/codex ...` 表示「從聊天控制或綁定原生 Codex 對話。」
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器。」

    如果出現警告，請選擇你原本想要的路由並手動編輯設定。當 PI Codex OAuth 是刻意設定時，請保留警告不變。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟布局）">
    Doctor 可以將較舊的磁碟布局遷移到目前結構：

    - 工作階段儲存區 + 轉錄：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（除了 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移會盡力執行且具冪等性；當 doctor 留下任何舊版資料夾作為備份時，會發出警告。Gateway/CLI 在啟動時也會自動遷移舊版工作階段 + agent 目錄，讓歷史記錄/驗證/模型落在每個 agent 的路徑中，而不需要手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk 供應商/供應商對應正規化現在會以結構相等比較，因此只有鍵順序不同的差異不再觸發重複的無操作 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝 Plugin manifest，尋找已棄用的頂層功能鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提出將這些鍵移入 `contracts` 物件，並就地改寫 manifest 檔案。此遷移具冪等性；如果 `contracts` 鍵已經有相同值，舊版鍵會被移除而不重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 Cron 儲存區遷移">
    Doctor 也會檢查 Cron 工作儲存區（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時的 `cron.store`），尋找排程器仍為相容性而接受的舊工作形狀。

    目前的 Cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery 別名 → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` Webhook 後援工作 → 明確的 `delivery.mode="webhook"` 搭配 `delivery.to=cron.webhook`

    Doctor 只會在不改變行為時自動遷移 `notify: true` 工作。如果某個工作結合了舊版通知後援與既有的非 Webhook delivery 模式，doctor 會警告並保留該工作供手動審查。

    在 Linux 上，當使用者的 crontab 仍叫用舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會警告。該主機本機腳本不由目前的 OpenClaw 維護，且當 cron 無法連到 systemd 使用者匯流排時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    doctor 會掃描每個代理程式工作階段目錄中的過時寫入鎖定檔，也就是工作階段異常結束後遺留下來的檔案。對於找到的每個鎖定檔，它會回報：路徑、PID、該 PID 是否仍在執行、鎖定存在時間，以及是否被視為過時（PID 已死或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過時的鎖定檔；否則會列印一則提示，指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段轉錄分支修復">
    doctor 會掃描代理程式工作階段 JSONL 檔案，尋找由 2026.4.24 提示轉錄重寫錯誤所建立的重複分支形狀：一個被棄用的使用者回合包含 OpenClaw 內部執行階段內容，旁邊還有一個作用中的同層分支，含有相同的可見使用者提示。在 `--fix` / `--repair` 模式中，doctor 會在原始檔旁備份每個受影響的檔案，並將轉錄重寫為作用中的分支，使 gateway 歷程與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是作業上的腦幹。如果它消失，你會失去工作階段、憑證、日誌與設定（除非你在其他地方有備份）。

    doctor 會檢查：

    - **狀態目錄遺失**：警告災難性的狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（偵測到擁有者/群組不相符時，會發出 `chown` 提示）。
    - **macOS 雲端同步的狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能導致較慢的 I/O 以及鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 可能較慢，且在工作階段與憑證寫入下磨耗更快。
    - **工作階段目錄遺失**：需要 `sessions/` 與工作階段儲存目錄，才能持久保存歷程並避免 `ENOENT` 當機。
    - **轉錄不相符**：當近期工作階段項目缺少轉錄檔時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要轉錄只有一行時標記（表示歷程沒有累積）。
    - **多個狀態目錄**：當多個 home 目錄中存在多個 `~/.openclaw` 資料夾，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷程可能在不同安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可被群組/所有人讀取，則發出警告並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    doctor 會檢查驗證儲存區中的 OAuth profile，在 token 即將到期/已到期時發出警告，並可在安全時重新整理它們。如果 Anthropic OAuth/token profile 已過時，它會建議使用 Anthropic API key 或 Anthropic setup-token 路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者要求你重新登入），doctor 會回報需要重新驗證，並列印要執行的精確 `openclaw models auth login --provider ...` 指令。

    doctor 也會回報因下列原因而暫時無法使用的 auth profile：

    - 短暫冷卻時間（速率限制/逾時/驗證失敗）
    - 較長時間的停用（帳單/點數失敗）

  </Accordion>
  <Accordion title="6. hooks 模型驗證">
    如果已設定 `hooks.gmail.model`，doctor 會根據 catalog 與 allowlist 驗證模型參照，並在無法解析或不允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，doctor 會檢查 Docker 映像，並在目前映像遺失時提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中移除舊版 OpenClaw 產生的 Plugin 依賴 staging 狀態。這涵蓋過時的已產生依賴根目錄、舊的 install-stage 目錄、早期 bundled-plugin 依賴修復程式碼留下的 package-local 雜物，以及可能遮蔽目前 bundled manifest 的孤立或已復原的託管 bundled `@openclaw/*` plugins npm 副本。

    當 config 參照已設定的可下載 plugins，但本機 plugin registry 找不到它們時，doctor 也可以重新安裝這些 plugins。對於 2026.5.2 bundled-plugin externalization，doctor 會自動安裝既有 config 已使用的可下載 plugins，然後依賴 `meta.lastTouchedVersion` 確保該發行版本處理只執行一次。Gateway 啟動與 config 重新載入不會執行 package manager；plugin 安裝仍是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    doctor 會偵測舊版 gateway 服務（launchd/systemd/schtasks），並提供移除它們以及使用目前 gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的 gateway 類服務並列印清理提示。以 profile 命名的 OpenClaw gateway 服務會被視為一級項目，不會被標記為「額外」。

    在 Linux 上，如果使用者層級 gateway 服務遺失但系統層級 OpenClaw gateway 服務存在，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項，或在系統 supervisor 擁有 gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳戶有待處理或可執行的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行 best-effort 遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。這兩個步驟都不是致命錯誤；錯誤會被記錄，啟動會繼續。在唯讀模式（不帶 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    doctor 現在會在一般健康檢查中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置待處理的角色升級
    - 已配對裝置待處理的範圍升級
    - 裝置 id 仍相符但裝置身分已不再符合已核准記錄的公開金鑰不相符修復
    - 缺少已核准角色作用中 token 的已配對記錄
    - 範圍漂移到已核准配對基準之外的已配對 token
    - 目前機器上的本機快取裝置 token 項目，其早於 gateway 端 token 輪替，或帶有過時的範圍中繼資料

    doctor 不會自動核准配對請求，也不會自動輪替裝置 token。它會改為列印精確的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准精確請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的 token
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過時記錄

    這會補上常見的「已配對但仍然收到需要配對」缺口：doctor 現在會區分首次配對、待處理角色/範圍升級，以及過時 token/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當 provider 對 DM 開放但沒有 allowlist，或 policy 以危險方式設定時，doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 gateway 在登出後仍保持執行。
  </Accordion>
  <Accordion title="11. 工作區狀態（skills、plugins 與舊版目錄）">
    doctor 會列印預設代理程式的工作區狀態摘要：

    - **Skills 狀態**：計算 eligible、missing-requirements 與 allowlist-blocked skills 的數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/錯誤 plugins；列出任何錯誤的 plugin ID；回報 bundle plugin capabilities。
    - **Plugin 相容性警告**：標記與目前 runtime 有相容性問題的 plugins。
    - **Plugin 診斷**：顯示 plugin registry 在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元數佔總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 與 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過時頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除遺失的頻道 Plugin 時，它也會移除參照該 Plugin 的懸空頻道範圍 config：`channels.<id>` 項目、命名該頻道的 Heartbeat targets，以及 `agents.*.models["<channel>/*"]` overrides。這能避免頻道 runtime 已消失但 config 仍要求 gateway 綁定到它所造成的 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 tab 補全：

    - 如果 shell profile 使用較慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案變體。
    - 如果 profile 中已設定補全但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全沒有設定補全，doctor 會提示安裝（僅互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機 token）">
    doctor 會檢查本機 gateway token 驗證就緒狀態。

    - 如果 token 模式需要 token 但不存在 token 來源，doctor 會提供產生一個的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告，且不會以純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定 token SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. 可感知 SecretRef 的唯讀修復">
    某些修復流程需要檢查已設定的憑證，同時不削弱 runtime fail-fast 行為。

    - `openclaw doctor --fix` 現在會使用與 status-family commands 相同的唯讀 SecretRef 摘要模型，來進行目標 config 修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 憑證。
    - 如果 Telegram bot token 是透過 SecretRef 設定，但在目前指令路徑中無法使用，doctor 會回報憑證為已設定但無法使用，並略過自動解析，而不是當機或誤報 token 遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在 Gateway 看起來不健康時提議重新啟動 Gateway。
  </Accordion>
  <Accordion title="13b. 記憶體搜尋就緒狀態">
    Doctor 會檢查已設定的記憶體搜尋嵌入提供者是否已為預設代理程式就緒。行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若不可用，會列印修復指引，包括 npm 套件與手動二進位檔路徑選項。
    - **明確本機提供者**：檢查本機模型檔案或可辨識的遠端/可下載模型 URL。若缺少，建議切換到遠端提供者。
    - **明確遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。若缺少，會列印可操作的修復提示。
    - **自動提供者**：先檢查本機模型可用性，接著依自動選擇順序嘗試每個遠端提供者。

    當快取的 Gateway 探測結果可用時（Gateway 在檢查當下是健康的），doctor 會將其結果與 CLI 可見的設定交叉比對，並註記任何差異。Doctor 不會在預設路徑上啟動新的嵌入 ping；若要即時提供者檢查，請使用深度記憶體狀態命令。

    使用 `openclaw memory status --deep` 在執行時驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 通道狀態警告">
    如果 Gateway 健康，doctor 會執行通道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. Supervisor 設定稽核 + 修復">
    Doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks）是否缺少預設值或預設值過時（例如 systemd network-online 相依性與重新啟動延遲）。當發現不一致時，會建議更新，並可將服務檔案/工作重寫為目前預設值。

    注意：

    - `openclaw doctor` 會在重寫 supervisor 設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會在不提示的情況下套用建議修復。
    - `openclaw doctor --repair --force` 會覆寫自訂 supervisor 設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 在 Gateway 服務生命週期中保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap、supervisor 設定重寫，以及舊版服務清理，因為該生命週期由外部 supervisor 擁有。
    - 在 Linux 上，當相符的 systemd Gateway unit 為作用中時，doctor 不會重寫命令/進入點中繼資料。它也會在重複服務掃描期間忽略非作用中的非舊版額外類 Gateway unit，因此輔助服務檔案不會產生清理雜訊。
    - 如果 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝/修復會驗證 SecretRef，但不會將解析後的純文字 token 值持久化到 supervisor 服務環境中繼資料中。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows 排程工作安裝中內嵌行內的受管理 `.env`/SecretRef 支援服務環境值，並重寫服務中繼資料，讓這些值從執行時來源載入，而非從 supervisor 定義載入。
    - Doctor 會偵測服務命令在 `gateway.port` 變更後是否仍固定舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果 token 驗證需要 token，且已設定的 token SecretRef 無法解析，doctor 會封鎖安裝/修復路徑並提供可操作的指引。
    - 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會封鎖安裝/修復，直到明確設定模式為止。
    - 對於 Linux 使用者 systemd unit，doctor token 漂移檢查現在會在比較服務驗證中繼資料時包含 `Environment=` 與 `EnvironmentFile=` 來源。
    - 當設定最後由較新版本寫入時，Doctor 服務修復會拒絕重寫、停止或重新啟動來自較舊 OpenClaw 二進位檔的 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你一律可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行時 + 連接埠診斷">
    Doctor 會檢查服務執行時（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. Gateway 執行時最佳實務">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，Doctor 會發出警告。WhatsApp + Telegram 通道需要 Node，而版本管理器路徑在升級後可能失效，因為服務不會載入你的 shell init。Doctor 會在可用時提議遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Volta、asdf、fnm、pnpm 與其他版本管理器目錄不會改變 Node 子程序解析的位置。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）與穩定的使用者 bin 目錄，但推測的版本管理器後援目錄只會在那些目錄存在於磁碟上時寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會持久化任何設定變更，並標記精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶體系統）">
    Doctor 會在缺少時建議工作區記憶體系統，並在工作區尚未納入 git 時列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得工作區結構與 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
