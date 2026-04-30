---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-04-30T16:28:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復 + 遷移工具。它會修正過期的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

## 快速開始

```bash
openclaw doctor
```

### Headless 和自動化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    不提示而接受預設值（適用時包含重新啟動/服務/沙盒修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示而套用建議的修復（在安全情況下進行修復 + 重新啟動）。

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

    在沒有提示的情況下執行，且只套用安全遷移（設定正規化 + 磁碟上的狀態移動）。跳過需要人工確認的重新啟動/服務/沙盒動作。偵測到舊版狀態遷移時會自動執行。

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

## 它會做什麼（摘要）

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝的選用預先更新（僅互動模式）。
    - UI 協定新鮮度檢查（當協定 schema 較新時重建 Control UI）。
    - 健康狀態檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/已阻擋）和 Plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - 將 Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode 提供者覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 前置條件檢查。
    - 舊版磁碟上狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 Plugin manifest 合約鍵遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 cron 儲存區遷移（`jobId`, `schedule.cron`, 頂層 delivery/payload 欄位、payload `provider`、簡單的 `notify: true` webhook fallback jobs）。
    - 舊版 agent runtime-policy 遷移到 `agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。
    - 啟用 plugins 時清理過期 Plugin 設定；當 `plugins.enabled=false` 時，過期 Plugin 參照會被視為惰性 containment config 並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - Session lock file 檢查與過期 lock 清理。
    - 修復受影響 2026.4.24 建置建立的重複 prompt-rewrite 分支之 session transcript。
    - 卡住的 subagent restart-recovery tombstone 偵測，支援用 `--fix` 清除過期 aborted recovery 旗標，使啟動時不會持續將 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 在本機執行時檢查設定檔權限（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期、可重新整理即將到期的 token，並回報 auth-profile cooldown/disabled 狀態。
    - 額外工作區目錄偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與 supervisor">
    - 啟用沙盒時進行沙盒映像修復。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix 頻道舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway 執行階段檢查（服務已安裝但未執行；快取的 launchd label）。
    - 頻道狀態警告（從正在執行的 Gateway 探測）。
    - Supervisor 設定稽核（launchd/systemd/schtasks），可選擇修復。
    - 針對安裝或更新期間擷取 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的 Gateway 服務，清理嵌入式 proxy 環境。
    - Gateway 執行階段最佳實務檢查（Node vs Bun、版本管理器路徑）。
    - Gateway 連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全與配對">
    - 開放 DM 政策的安全警告。
    - 本機 token 模式的 Gateway 驗證檢查（沒有 token 來源時提供 token 產生；不會覆寫 token SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對請求、待處理的角色/範圍升級、過期的本機 device-token 快取漂移，以及 paired-record auth 漂移）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區 bootstrap 檔案大小檢查（context 檔案的截斷/接近上限警告）。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding 提供者就緒狀態檢查（本機模型、遠端 API key 或 QMD binary）。
    - 原始碼安裝檢查（pnpm workspace 不相符、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定 + wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含用於 grounded dreaming 工作流程的 **回填**、**重設** 和 **清除 Grounded** 動作。這些動作使用 Gateway doctor-style RPC 方法，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做的事：

- **回填** 會掃描作用中工作區內的歷史 `memory/YYYY-MM-DD.md` 檔案，執行 grounded REM diary pass，並將可逆的回填項目寫入 `DREAMS.md`。
- **重設** 只會從 `DREAMS.md` 移除那些已標記的回填日記項目。
- **清除 Grounded** 只會移除來自歷史 replay、且尚未累積 live recall 或 daily support 的 staged grounded-only short-term 項目。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你先明確執行 staged CLI 路徑，否則它們不會自動將 grounded candidates stage 到 live short-term promotion store

如果想讓 grounded historical replay 影響一般 deep promotion lane，請改用 CLI flow：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates stage 到 short-term dreaming store，同時讓 `DREAMS.md` 作為 review surface。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 正以互動模式執行，它會在執行 doctor 前提出更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化為目前的 schema。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到 provider map。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含已棄用的鍵時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版鍵。
    - 顯示已套用的遷移。
    - 使用更新後的 schema 重寫 `~/.openclaw/openclaw.json`。

    Gateway 在啟動時若偵測到舊版設定格式，也會自動執行 doctor 遷移，因此過期設定無需手動介入即可修復。Cron job store 遷移由 `openclaw doctor --fix` 處理。

    目前的遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 頂層 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - 對於具有具名 `accounts` 但仍殘留單帳號頂層頻道值的頻道，將那些 account-scoped 值移到為該頻道選定的 promoted account（多數頻道為 `accounts.default`；Matrix 可保留現有相符的 named/default target）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；慢速 provider/model timeouts 請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版 extension relay 設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知 enum 值的 providers，而不是 fail closed）

    Doctor 警告也包含 multi-account 頻道的 account-default 指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，卻沒有設定 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後援路由可能選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設成未知的帳號 ID，doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動加入了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或讓成本歸零。doctor 會發出警告，讓你移除該覆寫並還原各模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將它正規化為目前主機本機的 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，doctor 也會稽核主機本機的 Chrome MCP 路徑：

    - 檢查同一台主機上是否已安裝 Google Chrome，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    doctor 無法替你啟用 Chrome 端的設定。主機本機的 Chrome MCP 仍需要：

    - Gateway/Node 主機上有 Chromium 系瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只涵蓋本機附加的前置條件。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理的瀏覽器或原始 CDP 設定檔。

    這項檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless 流程。那些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以確認本機 Node/OpenSSL TLS 堆疊能驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），doctor 會列印特定平台的修復指引。在 macOS 上使用 Homebrew Node 時，修復方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 gateway 健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 底下加入舊版 OpenAI 傳輸設定，它們可能會遮蔽較新版本自動使用的內建 Codex OAuth 提供者路徑。doctor 在看到這些舊傳輸設定與 Codex OAuth 並存時會警告，讓你移除或改寫過時的傳輸覆寫，並取回內建路由/後援行為。自訂代理和僅標頭的覆寫仍受支援，且不會觸發這項警告。
  </Accordion>
  <Accordion title="2f. Codex plugin 路由警告">
    啟用內建 Codex plugin 時，doctor 也會檢查 `openai-codex/*` 主要模型參照是否仍透過預設 PI runner 解析。當你想透過 PI 使用 Codex OAuth/訂閱驗證時，這個組合是有效的，但很容易與原生 Codex app-server harness 混淆。doctor 會警告並指向明確的 app-server 形狀：`openai/*` 搭配 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    doctor 不會自動修復這點，因為兩條路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw runner 使用 Codex OAuth/訂閱驗證。」
    - `openai/*` + `runtime: "codex"` 表示「透過原生 Codex app-server 執行嵌入式回合。」
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話。」
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器。」

    如果出現警告，請選擇你原本想使用的路由並手動編輯設定。當 PI Codex OAuth 是刻意設定時，請保持警告原樣。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    doctor 可以將較舊的磁碟布局遷移到目前結構：

    - 工作階段儲存區 + 逐字稿：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移採最佳努力且具冪等性；doctor 將任何舊資料夾留下作為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版工作階段與 agent 目錄，讓歷史記錄/驗證/模型落在各 agent 的路徑中，而不需要手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk 提供者/提供者對應表正規化現在會以結構相等性比較，因此只有鍵順序不同的差異不再觸發重複的無作用 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 plugin manifest 遷移">
    doctor 會掃描所有已安裝的 plugin manifest，尋找已棄用的頂層功能鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將它們移到 `contracts` 物件中，並就地改寫 manifest 檔案。這項遷移具冪等性；如果 `contracts` 鍵已經有相同值，舊版鍵會被移除，而不會複製資料。
  </Accordion>
  <Accordion title="3b. 舊版 Cron 儲存區遷移">
    doctor 也會檢查 cron job 儲存區（預設為 `~/.openclaw/cron/jobs.json`，或在覆寫時使用 `cron.store`），尋找排程器為了相容性仍接受的舊 job 形狀。

    目前的 cron 清理項目包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery 別名 → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` webhook 後援 jobs → 明確的 `delivery.mode="webhook"` 搭配 `delivery.to=cron.webhook`

    doctor 只會在不改變行為的情況下自動遷移 `notify: true` jobs。如果某個 job 同時使用舊版通知後援與既有非 webhook delivery mode，doctor 會警告並保留該 job 供手動審查。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    doctor 會掃描每個 agent 工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束後留下的檔案。對每個找到的鎖定檔案，它會回報：路徑、PID、PID 是否仍存活、鎖定存在時間，以及是否被視為過時（PID 已死或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過時的鎖定檔案；否則會列印備註並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    doctor 會掃描 agent 工作階段 JSONL 檔案，尋找由 2026.4.24 prompt 逐字稿重寫錯誤建立的重複分支形狀：一個含有 OpenClaw 內部 runtime context 的已放棄使用者回合，加上一個含有相同可見使用者 prompt 的作用中同層分支。在 `--fix` / `--repair` 模式中，doctor 會在原檔旁備份每個受影響檔案，並將逐字稿改寫為作用中分支，讓 gateway 歷史記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是操作上的腦幹。如果它消失，你會失去工作階段、憑證、記錄與設定（除非你在別處有備份）。

    doctor 會檢查：

    - **狀態目錄遺失**：警告毀滅性的狀態遺失、提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫性；提議修復權限（並在偵測到擁有者/群組不符時發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 與鎖定/同步競態。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 在工作階段與憑證寫入下可能較慢且磨耗更快。
    - **工作階段目錄遺失**：`sessions/` 與工作階段儲存目錄是持久保存歷史記錄並避免 `ENOENT` 當機所必需。
    - **逐字稿不一致**：當近期工作階段項目缺少逐字稿檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要逐字稿只有一行時標記（歷史記錄未累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於不同 home 目錄，或 `OPENCLAW_STATE_DIR` 指向別處時發出警告（歷史記錄可能分散到不同安裝）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可被群組/全世界讀取，會發出警告並提議收緊為 `600`。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    doctor 會檢查驗證儲存區中的 OAuth 設定檔，在 token 即將到期/已到期時警告，並在安全時重新整理它們。如果 Anthropic OAuth/token 設定檔已過期，它會建議 Anthropic API key 或 Anthropic setup-token 路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者要求你重新登入），doctor 會回報需要重新驗證，並列印要執行的確切 `openclaw models auth login --provider ...` 指令。

    doctor 也會回報因以下原因暫時無法使用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長時間停用（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. 掛鉤模型驗證">
    如果設定了 `hooks.gmail.model`，診斷工具會依據目錄與允許清單驗證模型參照，並在無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙盒映像檔修復">
    啟用沙盒時，診斷工具會檢查 Docker 映像檔，並在目前映像檔遺失時提供建置或切換到舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. 內建 Plugin 執行階段相依套件">
    診斷工具只會驗證目前設定中啟用，或由其內建資訊清單預設啟用的內建 Plugin 的執行階段相依套件，例如 `plugins.entries.discord.enabled: true`、舊版 `channels.discord.enabled: true`、已設定的 `models.providers.*` / 代理模型參照，或沒有提供者擁有權但預設啟用的內建 Plugin。如果有任何相依套件遺失，診斷工具會回報套件，並在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中安裝它們。外部 Plugin 仍使用 `openclaw plugins install` / `openclaw plugins update`；診斷工具不會為任意 Plugin 路徑安裝相依套件。

    在診斷工具修復期間，內建執行階段相依套件的 npm 安裝會在 TTY 工作階段中回報旋轉器進度，並在管線/無頭輸出中定期回報行進度。Gateway 與本機 CLI 也可以在匯入內建 Plugin 前，依需求修復作用中的內建 Plugin 執行階段相依套件。這些安裝限定於 Plugin 執行階段安裝根目錄、以停用 scripts 的方式執行、不寫入 package lock，並由安裝根目錄鎖保護，避免並行的 CLI 或 Gateway 啟動同時變更同一個 `node_modules` 樹。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    診斷工具會偵測舊版 gateway 服務（launchd/systemd/schtasks），並提供移除它們、使用目前 gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外類 gateway 服務並列印清理提示。具設定檔名稱的 OpenClaw gateway 服務會被視為一等服務，不會標記為「額外」。

    在 Linux 上，如果使用者層級的 gateway 服務遺失，但系統層級的 OpenClaw gateway 服務存在，診斷工具不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複服務，或在系統監督程式擁有 gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳號有待處理或可執行的舊版狀態遷移時，診斷工具（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。兩個步驟都是非致命的；錯誤會被記錄，啟動會繼續。在唯讀模式（不含 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    診斷工具現在會把裝置配對狀態納入一般健康檢查。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 id 仍相符但裝置身分不再符合已核准記錄的公開金鑰不相符修復
    - 缺少已核准角色作用中權杖的已配對記錄
    - 範圍漂移到已核准配對基準之外的已配對權杖
    - 目前機器上的本機快取裝置權杖項目早於 gateway 端權杖輪替，或帶有過期範圍中繼資料

    診斷工具不會自動核准配對請求或自動輪替裝置權杖。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准確切請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這會補上常見的「已配對但仍收到需要配對」漏洞：診斷工具現在會區分首次配對、待處理的角色/範圍升級，以及過期權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當提供者在沒有允許清單的情況下對私訊開放，或原則以危險方式設定時，診斷工具會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，診斷工具會確保已啟用 lingering，讓 gateway 在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、Plugin 和舊版目錄）">
    診斷工具會列印預設代理的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、需求缺失與被允許清單封鎖的 Skills 數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 Plugin；列出任何錯誤的 Plugin ID；回報套件 Plugin 功能。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 Plugin。
    - **Plugin 診斷**：顯示 Plugin 登錄在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. 啟動檔案大小">
    診斷工具會檢查工作區啟動檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過已設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元數占總預算的比例。當檔案被截斷或接近限制時，診斷工具會列印調整 `agents.defaults.bootstrapMaxChars` 與 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過期頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除遺失的頻道 Plugin 時，它也會移除參照該 Plugin 的懸空頻道範圍設定：`channels.<id>` 項目、命名該頻道的 Heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可避免頻道執行階段已不存在，但設定仍要求 gateway 繫結至它而造成 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    診斷工具會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝定位鍵補全：

    - 如果 shell 設定檔使用緩慢的動態補全模式（`source <(openclaw completion ...)`），診斷工具會將它升級為較快的快取檔案變體。
    - 如果設定檔中已設定補全但快取檔案遺失，診斷工具會自動重新產生快取。
    - 如果完全未設定補全，診斷工具會提示安裝它（僅互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 以手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機權杖）">
    診斷工具會檢查本機 gateway 權杖驗證就緒狀態。

    - 如果權杖模式需要權杖且沒有權杖來源，診斷工具會提供產生權杖的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，診斷工具會發出警告，且不會以純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只有在沒有設定權杖 SecretRef 時才會強制產生。

  </Accordion>
  <Accordion title="12b. 感知唯讀 SecretRef 的修復">
    某些修復流程需要在不削弱執行階段快速失敗行為的情況下檢查已設定的憑證。

    - `openclaw doctor --fix` 現在會針對目標設定修復，使用與 status 系列指令相同的唯讀 SecretRef 摘要模型。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的機器人憑證。
    - 如果 Telegram 機器人權杖透過 SecretRef 設定，但在目前指令路徑中無法使用，診斷工具會回報憑證已設定但無法使用，並略過自動解析，而不是崩潰或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    診斷工具會執行健康檢查，並在 gateway 看起來不健康時提供重新啟動的選項。
  </Accordion>
  <Accordion title="13b. 記憶體搜尋就緒狀態">
    診斷工具會檢查已設定的記憶體搜尋嵌入提供者是否已為預設代理就緒。行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。如果不是，會列印修復指引，包括 npm 套件與手動二進位路徑選項。
    - **明確的本機提供者**：檢查本機模型檔案或可辨識的遠端/可下載模型 URL。如果遺失，建議切換到遠端提供者。
    - **明確的遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。如果遺失，列印可執行的修復提示。
    - **自動提供者**：先檢查本機模型可用性，然後依自動選取順序嘗試每個遠端提供者。

    當有快取的 gateway 探測結果可用時（gateway 在檢查時健康），診斷工具會將其結果與 CLI 可見設定交叉參照，並註記任何差異。診斷工具不會在預設路徑上啟動新的嵌入 ping；當你想要即時提供者檢查時，請使用深度記憶體狀態指令。

    使用 `openclaw memory status --deep` 驗證執行階段的嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 頻道狀態警告">
    如果 gateway 健康，診斷工具會執行頻道狀態探測，並回報警告與建議修復。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核 + 修復">
    診斷工具會檢查已安裝的監督程式設定（launchd/systemd/schtasks）是否缺少或使用過期預設值（例如 systemd network-online 相依性與重新啟動延遲）。當發現不相符時，它會建議更新，並可將服務檔案/工作重寫為目前預設值。

    注意事項：

    - `openclaw doctor` 會在重寫監督程式設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會在不提示的情況下套用建議的修正。
    - `openclaw doctor --repair --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 Gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序、監督程式設定重寫，以及舊版服務清理，因為外部監督程式擁有該生命週期。
    - 在 Linux 上，當相符的 systemd Gateway 單元處於啟用狀態時，doctor 不會重寫命令/進入點中繼資料。它也會在重複服務掃描期間忽略停用中的非舊版額外 Gateway 類似單元，讓伴隨服務檔案不會產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝/修復會驗證 SecretRef，但不會將解析後的純文字權杖值持久化到監督程式服務環境中繼資料中。
    - Doctor 會偵測較舊的 LaunchAgent、systemd 或 Windows 排程工作安裝中以內嵌方式嵌入的受管理 `.env`/SecretRef 支援服務環境值，並重寫服務中繼資料，讓這些值改從執行階段來源載入，而不是從監督程式定義載入。
    - Doctor 會偵測服務命令在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且設定的權杖 SecretRef 無法解析，doctor 會阻止安裝/修復路徑並提供可採取行動的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會阻止安裝/修復，直到明確設定模式。
    - 對於 Linux 使用者 systemd 單元，doctor 權杖漂移檢查現在會在比較服務驗證中繼資料時，同時包含 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後是由較新版本寫入時，Doctor 服務修復會拒絕使用較舊 OpenClaw 二進位檔重寫、停止或重新啟動 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + 連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    當 Gateway 服務執行於 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）時，Doctor 會發出警告。WhatsApp + Telegram 頻道需要 Node，而版本管理器路徑在升級後可能會中斷，因為服務不會載入你的 shell 初始化。當可用時，Doctor 會提供遷移到系統 Node 安裝的選項（Homebrew/apt/choco）。

    新安裝或修復的服務會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者 bin 目錄，但推測的版本管理器後援目錄只有在這些目錄存在於磁碟上時，才會寫入服務 PATH。這會讓產生的監督程式 PATH 與 doctor 稍後執行的相同最小 PATH 稽核保持一致。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會持久化任何設定變更，並標記精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶系統）">
    當缺少工作區記憶系統時，Doctor 會建議使用一個；如果工作區尚未由 git 管理，則會列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，了解工作區結構和 git 備份的完整指南（建議使用私人 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
