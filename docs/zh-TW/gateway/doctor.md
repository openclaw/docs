---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 指令：健康檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-05-03T21:33:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
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

    不提示而接受預設值（包含適用時的重啟/服務/sandbox 修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示而套用建議修復（安全時包含修復與重啟）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用積極修復（會覆寫自訂 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不顯示提示並且只套用安全遷移（設定正規化與磁碟上的狀態搬移）。略過需要人工確認的重啟/服務/sandbox 動作。偵測到舊版狀態遷移時會自動執行。

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
    - git 安裝可選的預先更新（僅互動模式）。
    - UI 協定新鮮度檢查（當協定 schema 較新時重建 Control UI）。
    - 健康檢查與重啟提示。
    - Skills 狀態摘要（符合資格/缺少/受阻）與 Plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - 將舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 設定遷移。
    - 舊版 Chrome extension 設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider override 警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth shadowing 警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth profiles 的 OAuth TLS 先決條件檢查。
    - 當 `plugins.allow` 具有限制但工具政策仍要求萬用字元或 Plugin 擁有的工具時，顯示 Plugin/tool allowlist 警告。
    - 舊版磁碟狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 Plugin manifest contract key 遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 Cron store 遷移（`jobId`, `schedule.cron`, top-level delivery/payload fields, payload `provider`, simple `notify: true` webhook fallback jobs）。
    - 舊版 agent runtime-policy 遷移到 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 plugins 時清理過時的 Plugin 設定；當 `plugins.enabled=false` 時，過時的 Plugin 參照會被視為惰性 containment config 並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - Session lock file 檢查與過時 lock 清理。
    - 修復受影響 2026.4.24 build 所建立之重複 prompt-rewrite 分支的 session transcript。
    - 偵測卡住的 subagent restart-recovery tombstone，並支援使用 `--fix` 清除過時的 aborted recovery flags，讓啟動時不會持續將 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（sessions, transcripts, state dir）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - Model auth 健康狀態：檢查 OAuth 過期、可重新整理即將過期的 token，並回報 auth-profile cooldown/disabled 狀態。
    - 額外 workspace dir 偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisor">
    - 啟用 sandboxing 時修復 sandbox image。
    - 舊版服務遷移與額外 gateway 偵測。
    - Matrix channel 舊版狀態遷移（於 `--fix` / `--repair` 模式）。
    - Gateway runtime 檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從執行中的 gateway 探測）。
    - Supervisor 設定稽核（launchd/systemd/schtasks）與選用修復。
    - 清理由 gateway 服務在安裝或更新期間捕捉到的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所造成的嵌入式 proxy 環境。
    - Gateway runtime 最佳實務檢查（Node vs Bun、version-manager paths）。
    - Gateway port collision 診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="Auth、安全性與配對">
    - 開放 DM policies 的安全性警告。
    - local token mode 的 Gateway auth 檢查（沒有 token source 時提供 token 產生；不會覆寫 token SecretRef configs）。
    - 裝置配對問題偵測（pending first-time pair requests、pending role/scope upgrades、stale local device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace 與 shell">
    - Linux 上的 systemd linger 檢查。
    - Workspace bootstrap file size 檢查（context files 的截斷/接近限制警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報缺少 bins、env、config 或 OS requirements 的 allowed skills，且 `--fix` 可以停用 `skills.entries` 中無法使用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding provider 就緒狀態檢查（local model、remote API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace mismatch、missing UI assets、missing tsx binary）。
    - 寫入更新後的設定與 wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含 **Backfill**、**Reset** 與 **Clear Grounded** 動作，用於 grounded dreaming workflow。這些動作會使用 gateway doctor 風格的 RPC 方法，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做的事：

- **Backfill** 會掃描 active workspace 中歷史的 `memory/YYYY-MM-DD.md` 檔案，執行 grounded REM diary pass，並將可還原的 backfill entries 寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些有標記的 backfill diary entries。
- **Clear Grounded** 只會移除由 historical replay 產生、且尚未累積 live recall 或 daily support 的 staged grounded-only short-term entries。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你先明確執行 staged CLI path，否則它們不會自動將 grounded candidates stage 到 live short-term promotion store

如果你想讓 grounded historical replay 影響一般 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates stage 到 short-term dreaming store，同時保留 `DREAMS.md` 作為 review surface。

## 詳細行為與原因

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout，且 doctor 以互動模式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化為目前的 schema。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀改寫到 provider map。

    當 `plugins.allow` 非空且工具政策使用萬用字元或 Plugin 擁有的工具項目時，Doctor 也會警告。`tools.allow: ["*"]` 只會比對實際載入之 Plugin 的工具；它不會繞過專屬 Plugin allowlist。

  </Accordion>
  <Accordion title="2. 舊版設定 key 遷移">
    當設定包含已棄用的 key 時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 key。
    - 顯示它套用的遷移。
    - 使用更新後的 schema 改寫 `~/.openclaw/openclaw.json`。

    Gateway 也會在啟動時偵測到舊版設定格式時自動執行 doctor 遷移，因此過時設定會在無需手動介入的情況下被修復。Cron job store 遷移由 `openclaw doctor --fix` 處理。

    目前的遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - 已設定頻道的設定缺少可見回覆政策 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 對於有具名 `accounts` 但仍殘留單一帳號頂層頻道值的頻道，將那些帳號範圍的值移入為該頻道升級選定的帳號（大多數頻道為 `accounts.default`；Matrix 可保留現有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；慢速提供者/模型逾時請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版 extension relay 設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知列舉值的提供者，而不是封閉式失敗）

    Doctor 警告也包含多帳號頻道的帳號預設指引：

    - 如果設定了兩個以上 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告備援路由可能選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳號 ID，doctor 會發出警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動加入了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 型錄。這可能強制模型使用錯誤的 API，或將成本歸零。Doctor 會警告，讓你移除覆寫並還原逐模型 API 路由 + 成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome extension 路徑，doctor 會將它正規化為目前主機本機的 Chrome MCP attach 模型：

    - `browser.profiles.*.driver: "extension"` 變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查同一台主機上是否已安裝 Google Chrome，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法代你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - Gateway/Node 主機上有 Chromium-based 瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次 attach 同意提示

    這裡的就緒狀態只關於本機 attach 前置條件。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由仍需要受管理的瀏覽器或原始 CDP 設定檔。

    這項檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。那些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊是否能驗證憑證鏈。如果探測因憑證錯誤失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定修復指引。在 macOS 搭配 Homebrew Node 時，修復方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 Gateway 健康，探測仍會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下加入舊版 OpenAI 傳輸設定，它們可能遮蔽新版發行版會自動使用的內建 Codex OAuth 提供者路徑。Doctor 在看到那些舊傳輸設定與 Codex OAuth 並存時會發出警告，讓你移除或改寫過時的傳輸覆寫，並取回內建路由/備援行為。自訂代理和僅標頭覆寫仍受支援，而且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex Plugin 路由警告">
    啟用內建 Codex Plugin 時，doctor 也會檢查 `openai-codex/*` 主要模型參照是否仍透過預設 PI runner 解析。當你想透過 PI 使用 Codex OAuth/訂閱驗證時，這個組合是有效的，但它很容易與原生 Codex app-server harness 混淆。Doctor 會發出警告，並指向明確的 app-server 形狀：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不會自動修復此項，因為兩條路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw runner 使用 Codex OAuth/訂閱驗證。」
    - `openai/*` + `agentRuntime.id: "codex"` 表示「透過原生 Codex app-server 執行嵌入式 turn。」
    - `/codex ...` 表示「從聊天控制或綁定原生 Codex 對話。」
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx adapter。」

    如果出現警告，請選擇你原本想要的路由並手動編輯設定。當 PI Codex OAuth 是有意設定時，請保持警告原樣。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可將較舊的磁碟布局遷移到目前結構：

    - Sessions 儲存 + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移是盡力而為且冪等的；當 doctor 將任何舊資料夾留下作為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版 sessions + agent 目錄，讓歷史記錄/驗證/模型落在逐 agent 路徑中，不需要手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk 提供者/provider-map 正規化現在會依結構相等性比較，因此僅金鑰順序不同的差異不再觸發重複的無作用 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝 Plugin manifest，尋找已棄用的頂層 capability key（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提供將它們移入 `contracts` 物件，並就地改寫 manifest 檔案。此遷移是冪等的；如果 `contracts` key 已有相同值，舊版 key 會被移除，而不會重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 Cron 儲存遷移">
    Doctor 也會檢查 cron job 儲存（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時為 `cron.store`），尋找排程器仍為相容性接受的舊 job 形狀。

    目前 Cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery aliases → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` webhook 備援 jobs → 明確的 `delivery.mode="webhook"` 搭配 `delivery.to=cron.webhook`

    Doctor 只會在不改變行為的情況下自動遷移 `notify: true` jobs。如果某個 job 將舊版 notify 備援與現有非 webhook delivery mode 組合使用，doctor 會發出警告並將該 job 留待手動審查。

    在 Linux 上，當使用者的 crontab 仍叫用舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會發出警告。該主機本機 script 不再由目前的 OpenClaw 維護，而且當 cron 無法連到 systemd user bus 時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理程式工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束時遺留下來的檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍在執行、鎖定存在時間，以及是否被視為過時（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式下，它會自動移除過時的鎖定檔案；否則會列印提示，並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描代理程式工作階段 JSONL 檔案，尋找由 2026.4.24 提示逐字稿重寫錯誤所建立的重複分支形狀：一個包含 OpenClaw 內部執行階段內容的已放棄使用者回合，以及一個包含相同可見使用者提示的作用中同層分支。在 `--fix` / `--repair` 模式下，doctor 會在原始檔案旁備份每個受影響的檔案，並將逐字稿重寫到作用中分支，讓 Gateway 歷史記錄和記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是作業上的腦幹。如果它消失，你會失去工作階段、憑證、記錄和設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性的狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（偵測到擁有者/群組不符時會發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 和鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為由 SD 或 eMMC 支援的隨機 I/O 在工作階段和憑證寫入期間可能較慢且磨耗更快。
    - **工作階段目錄遺失**：`sessions/` 和工作階段儲存目錄是持久保存歷史記錄並避免 `ENOENT` 當機所必需的。
    - **逐字稿不符**：當近期工作階段項目缺少逐字稿檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要逐字稿只有一行時標記（歷史記錄沒有累積）。
    - **多個狀態目錄**：當多個主目錄中存在多個 `~/.openclaw` 資料夾，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能在安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可被群組/所有人讀取，則發出警告並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存中的 OAuth 設定檔，在權杖即將到期/已到期時發出警告，並可在安全時重新整理它們。如果 Anthropic OAuth/權杖設定檔已過時，它會建議使用 Anthropic API 金鑰或 Anthropic 設定權杖路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或供應商要求你重新登入），doctor 會回報需要重新驗證，並列印要執行的精確 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因以下原因而暫時無法使用的驗證設定檔：

    - 短暫冷卻時間（速率限制/逾時/驗證失敗）
    - 較長停用時間（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果設定了 `hooks.gmail.model`，doctor 會根據目錄和允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，doctor 會檢查 Docker 映像，並在目前映像遺失時提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下移除舊版 OpenClaw 產生的 Plugin 依賴項暫存狀態。這涵蓋過時的已產生依賴項根目錄、舊的安裝階段目錄，以及先前內建 Plugin 依賴項修復程式碼留下的套件本機殘留物。

    當設定參照可下載 Plugin 但本機 Plugin 登錄找不到它們時，doctor 也可以重新安裝已設定的可下載 Plugin。針對 2026.5.2 內建 Plugin 外部化，doctor 會自動安裝現有設定已使用的可下載 Plugin，然後依賴 `meta.lastTouchedVersion` 讓該發行版本通行只執行一次。Gateway 啟動和設定重新載入不會執行套件管理器；Plugin 安裝仍然是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除它們以及使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 Gateway 服務並列印清理提示。以設定檔命名的 OpenClaw Gateway 服務被視為一級項目，不會被標記為「額外」。

    在 Linux 上，如果使用者層級 Gateway 服務遺失但系統層級 OpenClaw Gateway 服務存在，doctor 不會自動安裝第二個使用者層級服務。使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項，或在系統監督器擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳號有待處理或可執行的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式下）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移和舊版加密狀態準備。兩個步驟都不是致命的；錯誤會被記錄，啟動會繼續。在唯讀模式（不帶 `--fix` 的 `openclaw doctor`）下，此檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會將裝置配對狀態作為正常健康狀態通行的一部分進行檢查。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 id 仍相符，但裝置身分已不再符合已核准記錄的公開金鑰不相符修復
    - 已核准角色缺少有效 token 的已配對記錄
    - 範圍偏離已核准配對基準的已配對 token
    - 目前機器上的本機快取裝置 token 項目，其時間早於 Gateway 端 token 輪替，或帶有過期的範圍中繼資料

    Doctor 不會自動核准配對請求，也不會自動輪替裝置 token。它會改為印出精確的下一步：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准精確的請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的 token
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這會補上常見的「已配對但仍收到需要配對」缺口：doctor 現在會區分首次配對、待處理的角色/範圍升級，以及過期 token/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當某個提供者在沒有允許清單的情況下對私訊開放，或某個政策以危險方式設定時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 gateway 在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、plugins 和舊版目錄）">
    Doctor 會印出預設代理程式的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及被允許清單封鎖的 skills 數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 plugins；列出任何錯誤的 plugin ID；回報套件 plugin 能力。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 plugins。
    - **Plugin 診斷**：顯示 plugin 登錄檔在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. 啟動檔案大小">
    Doctor 會檢查工作區啟動檔案（例如 `AGENTS.md`、`CLAUDE.md`，或其他注入的脈絡檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元占總預算的比例。當檔案被截斷或接近限制時，doctor 會印出調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過期通道 plugin 清理">
    當 `openclaw doctor --fix` 移除缺失的通道 plugin 時，也會移除參照該 plugin 的懸空通道範圍設定：`channels.<id>` 項目、指名該通道的 heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可避免通道執行階段已消失，但設定仍要求 Gateway 綁定到它而造成 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 自動完成">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 自動完成：

    - 如果 shell 設定檔使用緩慢的動態完成模式（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案變體。
    - 如果完成已在設定檔中設定，但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全沒有設定完成，doctor 會提示安裝（僅互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機 token）">
    Doctor 會檢查本機 gateway token 驗證是否就緒。

    - 如果 token 模式需要 token 且不存在 token 來源，doctor 會提供產生 token 的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告，且不會用純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只有在未設定 token SecretRef 時才會強制產生。

  </Accordion>
  <Accordion title="12b. SecretRef 感知的唯讀修復">
    某些修復流程需要檢查已設定的憑證，同時不削弱執行階段的快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與狀態系列命令相同的唯讀 SecretRef 摘要模型，來進行目標式設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 憑證。
    - 如果 Telegram bot token 是透過 SecretRef 設定，但在目前命令路徑中無法使用，doctor 會回報該憑證已設定但不可用，並略過自動解析，而不是當機或誤報 token 遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    診斷工具會執行健康檢查，並在 Gateway 看起來不健康時提議重新啟動。
  </Accordion>
  <Accordion title="13b. 記憶體搜尋就緒狀態">
    診斷工具會檢查設定的記憶體搜尋嵌入提供者是否已為預設代理程式就緒。行為取決於設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若不可用，會列印修復指引，包括 npm 套件與手動二進位檔路徑選項。
    - **明確的本機提供者**：檢查本機模型檔案，或可辨識的遠端/可下載模型 URL。若缺少，建議切換到遠端提供者。
    - **明確的遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。若缺少，會列印可操作的修復提示。
    - **自動提供者**：先檢查本機模型可用性，接著依自動選擇順序嘗試每個遠端提供者。

    當可用快取的 Gateway 探測結果時（檢查當下 Gateway 為健康狀態），診斷工具會將其結果與 CLI 可見的設定交叉比對，並註記任何差異。診斷工具不會在預設路徑上啟動新的嵌入 ping；當你需要即時提供者檢查時，請使用深度記憶體狀態指令。

    使用 `openclaw memory status --deep` 以驗證執行時的嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 頻道狀態警告">
    如果 Gateway 健康，診斷工具會執行頻道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核 + 修復">
    診斷工具會檢查已安裝的監督程式設定（launchd/systemd/schtasks）是否缺少預設值或使用過時預設值（例如 systemd network-online 相依性與重新啟動延遲）。當找到不相符項目時，它會建議更新，並可將服務檔案/工作重寫為目前預設值。

    注意：

    - `openclaw doctor` 會在重寫監督程式設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會在不提示的情況下套用建議修復。
    - `openclaw doctor --repair --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓診斷工具對 Gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序、監督程式設定重寫，以及舊版服務清理，因為該生命週期由外部監督程式擁有。
    - 在 Linux 上，當相符的 systemd Gateway 單元處於啟用狀態時，診斷工具不會重寫指令/進入點中繼資料。它也會在重複服務掃描期間忽略非作用中且非舊版的額外類 Gateway 單元，避免伴隨服務檔案造成清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，診斷工具服務安裝/修復會驗證 SecretRef，但不會將已解析的純文字權杖值持久化到監督程式服務環境中繼資料中。
    - 診斷工具會偵測較舊的 LaunchAgent、systemd 或 Windows 排定工作安裝中內嵌行內的受管理 `.env`/SecretRef 後援服務環境值，並重寫服務中繼資料，讓這些值從執行時來源載入，而不是從監督程式定義載入。
    - 診斷工具會偵測服務指令是否在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且設定的權杖 SecretRef 無法解析，診斷工具會封鎖安裝/修復路徑並提供可操作的指引。
    - 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且未設定 `gateway.auth.mode`，診斷工具會封鎖安裝/修復，直到明確設定模式。
    - 對於 Linux 使用者 systemd 單元，診斷工具權杖漂移檢查現在會在比較服務驗證中繼資料時，同時包含 `Environment=` 與 `EnvironmentFile=` 來源。
    - 當設定最後由較新版本寫入時，診斷工具服務修復會拒絕重寫、停止或重新啟動來自較舊 OpenClaw 二進位檔的 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你永遠可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行時 + 連接埠診斷">
    診斷工具會檢查服務執行時（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. Gateway 執行時最佳實務">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，診斷工具會發出警告。WhatsApp + Telegram 頻道需要 Node，而版本管理器路徑可能在升級後中斷，因為服務不會載入你的 shell 初始化設定。當系統 Node 安裝可用時（Homebrew/apt/choco），診斷工具會提議遷移到該安裝。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Volta、asdf、fnm、pnpm 與其他版本管理器目錄不會改變 Node 子程序的解析結果。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）與穩定的使用者二進位目錄，但推測的版本管理器備援目錄只有在這些目錄實際存在於磁碟上時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    診斷工具會持久化任何設定變更，並加蓋精靈中繼資料以記錄診斷工具執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶體系統）">
    當工作區缺少記憶體系統時，診斷工具會提出建議；如果工作區尚未置於 git 下，則會列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得工作區結構與 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
