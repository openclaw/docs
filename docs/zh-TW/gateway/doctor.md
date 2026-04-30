---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: 診斷命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-04-30T09:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
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

    不提示即接受預設值（包含適用時的重新啟動/服務/沙箱修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示即套用建議的修復（在安全時進行修復與重新啟動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用積極修復（會覆寫自訂監督程式設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    在沒有提示的情況下執行，且只套用安全遷移（設定標準化與磁碟上的狀態移動）。略過需要人工確認的重新啟動/服務/沙箱動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務，尋找額外的 Gateway 安裝項目（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在寫入前檢視變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 功能摘要

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝項目的選用預檢更新（僅限互動模式）。
    - UI 協定新鮮度檢查（當協定結構描述較新時，重新建置 Control UI）。
    - 健康狀態檢查與重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/遭封鎖）與 Plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定標準化。
    - Talk 設定從舊版扁平 `talk.*` 欄位遷移至 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode 提供者覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 先決條件檢查。
    - 舊版磁碟狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 Plugin manifest 合約鍵遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 Cron 儲存區遷移（`jobId`, `schedule.cron`, 頂層 delivery/payload 欄位、payload `provider`、簡單的 `notify: true` webhook 後援工作）。
    - 舊版代理執行階段政策遷移至 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 Plugin 時清理過時的 Plugin 設定；當 `plugins.enabled=false` 時，過時的 Plugin 參照會被視為惰性隔離設定並予以保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 工作階段鎖定檔檢查與過時鎖定清理。
    - 修復受影響 2026.4.24 建置所建立的重複提示重寫分支的工作階段 transcript。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期、可重新整理即將到期的權杖，並回報驗證設定檔冷卻/停用狀態。
    - 偵測額外工作區目錄（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與監督程式">
    - 啟用沙箱時修復沙箱映像。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix 頻道舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway 執行階段檢查（服務已安裝但未執行；快取的 launchd 標籤）。
    - 頻道狀態警告（從執行中的 Gateway 探測）。
    - 監督程式設定稽核（launchd/systemd/schtasks），並可選擇修復。
    - 清理 Gateway 服務在安裝或更新期間擷取的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值所形成的嵌入式代理環境。
    - Gateway 執行階段最佳實務檢查（Node 與 Bun、版本管理器路徑）。
    - Gateway 連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放 DM 政策的安全性警告。
    - 本機權杖模式的 Gateway 驗證檢查（沒有權杖來源時提供權杖產生；不會覆寫權杖 SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對要求、待處理的角色/範圍升級、過時本機裝置權杖快取漂移，以及配對記錄驗證漂移）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區啟動檔案大小檢查（內容檔案的截斷/接近上限警告）。
    - Shell completion 狀態檢查與自動安裝/升級。
    - 記憶體搜尋嵌入提供者就緒狀態檢查（本機模型、遠端 API 金鑰或 QMD 二進位檔）。
    - 原始碼安裝檢查（pnpm 工作區不符、缺少 UI 資產、缺少 tsx 二進位檔）。
    - 寫入更新後的設定與精靈中繼資料。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含針對 grounded dreaming 工作流程的 **回填**、**重設** 與 **清除 Grounded** 動作。這些動作使用 Gateway doctor 風格的 RPC 方法，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會執行的動作：

- **回填** 會掃描作用中工作區內的歷史 `memory/YYYY-MM-DD.md` 檔案、執行 grounded REM diary pass，並將可還原的回填項目寫入 `DREAMS.md`。
- **重設** 只會從 `DREAMS.md` 移除那些已標記的回填日記項目。
- **清除 Grounded** 只會移除來自歷史重播、尚未累積 live recall 或每日支援的已暫存 grounded-only 短期項目。

它們本身**不會**執行的動作：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你先明確執行暫存 CLI 路徑，否則它們不會自動將 grounded 候選項暫存至即時短期提升儲存區

如果你希望 grounded 歷史重播影響一般 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates 暫存至 short-term dreaming store，同時保留 `DREAMS.md` 作為檢視介面。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝項目）">
    如果這是 git checkout，且 doctor 以互動方式執行，它會在執行 doctor 之前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定標準化">
    如果設定包含舊版值形狀（例如 `messages.ackReaction` 沒有特定頻道覆寫），doctor 會將它們標準化為目前的結構描述。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫至提供者對應表。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含已棄用的鍵時，其他命令會拒絕執行，並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版鍵。
    - 顯示它套用的遷移。
    - 使用更新後的結構描述重寫 `~/.openclaw/openclaw.json`。

    Gateway 也會在啟動時偵測到舊版設定格式後自動執行 doctor 遷移，因此過時設定可在無需人工介入的情況下修復。Cron 工作儲存區遷移由 `openclaw doctor --fix` 處理。

    目前遷移：

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
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 與 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 與 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 與 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 與 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 對於具有命名 `accounts` 但仍殘留單一帳戶頂層頻道值的頻道，將這些帳戶範圍值移入該頻道所選的提升帳戶（多數頻道為 `accounts.default`；Matrix 可保留現有相符的命名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；針對緩慢提供者/模型逾時使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版擴充功能中繼設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知列舉值的提供者，而不是封閉式失敗）

    Doctor 警告也包含多帳戶頻道的帳戶預設值指引：

    - 如果設定了兩個或更多 `channels.<channel>.accounts` 項目，但未設定 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後援路由可能選到非預期帳戶。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳戶 ID，doctor 會警告並列出已設定的帳戶 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會迫使模型使用錯誤的 API，或將成本歸零。Doctor 會發出警告，讓你移除該覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將其正規化為目前主機本機的 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或設定好的 `existing-session` 設定檔時，Doctor 也會稽核主機本機的 Chrome MCP 路徑：

    - 檢查預設自動連線設定檔所用的同一台主機上是否已安裝 Google Chrome
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面中啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法代你啟用 Chrome 端的設定。主機本機 Chrome MCP 仍需要：

    - gateway/node 主機上有 Chromium 系瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只關於本機附加前置需求。Existing-session 會保留目前的 Chrome MCP 路由限制；`responsebody`、PDF 匯出、下載攔截與批次動作等進階路由仍需要受管理的瀏覽器或原始 CDP 設定檔。

    此檢查**不**適用於 Docker、sandbox、remote-browser 或其他無頭流程。那些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置需求">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以確認本機 Node/OpenSSL TLS 堆疊能驗證憑證鏈。若探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），doctor 會列印平台專屬的修復指引。在使用 Homebrew Node 的 macOS 上，修復通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 Gateway 狀態正常也會執行探測。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI 傳輸設定，它們可能會遮蔽新版發行版本自動使用的內建 Codex OAuth 提供者路徑。當 Doctor 在 Codex OAuth 旁看到這些舊傳輸設定時會發出警告，讓你移除或改寫過時的傳輸覆寫，並取回內建的路由/後援行為。自訂 Proxy 與僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex Plugin 路由警告">
    啟用內建 Codex Plugin 時，doctor 也會檢查 `openai-codex/*` 主要模型參照是否仍透過預設 PI runner 解析。當你想透過 PI 使用 Codex OAuth/訂閱驗證時，這個組合是有效的，但很容易與原生 Codex app-server harness 混淆。Doctor 會警告並指出明確的 app-server 形狀：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不會自動修復，因為兩種路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw runner 使用 Codex OAuth/訂閱驗證。」
    - `openai/*` + `runtime: "codex"` 表示「透過原生 Codex app-server 執行嵌入式回合。」
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話。」
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx adapter。」

    如果出現警告，請選擇你原本想使用的路由並手動編輯設定。當 PI Codex OAuth 是刻意設定時，請保持警告原樣。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟版面配置）">
    Doctor 可以將較舊的磁碟版面配置遷移到目前結構：

    - 工作階段儲存區 + 逐字稿：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳戶 ID：`default`）

    這些遷移採盡力而為且具冪等性；當 doctor 將任何舊版資料夾保留為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版工作階段與 agent 目錄，讓歷史、驗證與模型進入每個 agent 的路徑，不必手動執行 doctor。WhatsApp 驗證則刻意只透過 `openclaw doctor` 遷移。對話提供者/provider-map 正規化現在會以結構相等性比較，因此只有鍵順序差異的變更不再觸發重複的無作用 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝的 Plugin manifest，尋找已棄用的頂層能力鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將這些鍵移入 `contracts` 物件，並就地改寫 manifest 檔案。此遷移具冪等性；如果 `contracts` 鍵已有相同值，舊版鍵會被移除而不會重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 Cron 儲存區遷移">
    Doctor 也會檢查 cron 工作儲存區（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時的 `cron.store`），尋找排程器仍為相容性而接受的舊工作形狀。

    目前的 cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery aliases → 明確的 `delivery.channel`
    - 簡單的舊版 `notify: true` webhook fallback 工作 → 明確的 `delivery.mode="webhook"` 搭配 `delivery.to=cron.webhook`

    Doctor 只有在不改變行為時，才會自動遷移 `notify: true` 工作。如果某個工作將舊版 notify fallback 與既有非 webhook delivery mode 組合在一起，doctor 會發出警告並保留該工作供手動審查。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個 agent 工作階段目錄中的過期寫入鎖定檔，也就是工作階段異常結束後留下的檔案。對於每個找到的鎖定檔，它會回報：路徑、PID、該 PID 是否仍存活、鎖定年齡，以及是否視為過期（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過期鎖定檔；否則會列印註記並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描 agent 工作階段 JSONL 檔案，尋找由 2026.4.24 提示逐字稿改寫錯誤建立的重複分支形狀：一個含有 OpenClaw 內部執行階段內容的已放棄使用者回合，以及一個包含相同可見使用者提示的作用中同層節點。在 `--fix` / `--repair` 模式中，doctor 會在原始檔旁備份每個受影響檔案，並將逐字稿改寫到作用中分支，讓 gateway 歷史與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是作業的核心中樞。如果它消失，你會失去工作階段、憑證、記錄與設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失、提示重新建立目錄，並提醒你它無法復原遺失資料。
    - **狀態目錄權限**：驗證可寫入性；提議修復權限（並在偵測到擁有者/群組不符時發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 與鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 在工作階段與憑證寫入下可能較慢且磨耗更快。
    - **工作階段目錄遺失**：`sessions/` 與工作階段儲存目錄是保存歷史並避免 `ENOENT` 當機所必需的。
    - **逐字稿不符**：當近期工作階段項目缺少逐字稿檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要逐字稿只有一行時標記（歷史沒有累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於各個家目錄，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史可能在不同安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/全世界讀取，則發出警告並提議收緊為 `600`。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在 token 即將到期/已到期時發出警告，並在安全時重新整理。如果 Anthropic OAuth/token 設定檔已過期，它會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者要求你重新登入），doctor 會回報需要重新驗證，並列印要執行的精確 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因以下原因暫時不可用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長停用（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果設定了 `hooks.gmail.model`，doctor 會根據目錄與允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. Sandbox 映像修復">
    啟用 sandboxing 時，doctor 會檢查 Docker 映像，並在目前映像遺失時提議建置或切換到舊版名稱。
  </Accordion>
  <Accordion title="7b. 內建 Plugin 執行階段依賴項">
    Doctor 只會為目前設定中作用中的內建 Plugin，或由其內建 manifest 預設啟用的 Plugin 驗證執行階段依賴項，例如 `plugins.entries.discord.enabled: true`、舊版 `channels.discord.enabled: true`、已設定的 `models.providers.*` / agent 模型參照，或沒有提供者所有權的預設啟用內建 Plugin。如果有任何依賴項遺失，doctor 會回報套件，並在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中安裝它們。外部 Plugin 仍使用 `openclaw plugins install` / `openclaw plugins update`；doctor 不會為任意 Plugin 路徑安裝依賴項。

    在 doctor 修復期間，內建執行階段依賴項的 npm 安裝會在 TTY 工作階段回報 spinner 進度，並在管線/無頭輸出中定期逐行回報進度。Gateway 和本機 CLI 也可以在匯入內建 Plugin 前，依需求修復作用中的內建 Plugin 執行階段依賴項。這些安裝範圍限於 Plugin 執行階段安裝根目錄，會在停用 scripts 的情況下執行，不會寫入 package lock，並由安裝根目錄鎖保護，讓並行的 CLI 或 Gateway 啟動不會同時變更同一個 `node_modules` 樹。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提議移除它們，然後使用目前的 Gateway 連接埠安裝 OpenClaw 服務。它也可以掃描額外類似 Gateway 的服務，並印出清理提示。以 profile 命名的 OpenClaw Gateway 服務會被視為一等服務，不會標記為「額外」。

    在 Linux 上，如果使用者層級的 Gateway 服務不存在，但系統層級的 OpenClaw Gateway 服務存在，doctor 不會自動安裝第二個使用者層級服務。請用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統 supervisor 擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動時 Matrix 遷移">
    當 Matrix 頻道帳號有待處理或可執行的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。這兩個步驟都不是致命錯誤；錯誤會被記錄，啟動也會繼續。在唯讀模式（沒有 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會在一般健康檢查中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理 scope 升級
    - 裝置 id 仍相符但裝置身分不再符合已核准記錄的公開金鑰不相符修復
    - 缺少已核准角色作用中 token 的配對記錄
    - scope 漂移到已核准配對 baseline 之外的配對 token
    - 目前機器上早於 Gateway 端 token 輪替，或帶有過期 scope 中繼資料的本機快取裝置 token 項目

    Doctor 不會自動核准配對請求或自動輪替裝置 token。它會改為印出精確的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准精確請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的 token
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這修補了常見的「已配對但仍收到需要配對」缺口：doctor 現在會區分首次配對、待處理角色/scope 升級，以及過期 token/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當 provider 對 DM 開放但沒有 allowlist，或 policy 以危險方式設定時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 Gateway 在登出後保持存活。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、Plugin 與舊版目錄）">
    Doctor 會印出預設 agent 的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及遭 allowlist 封鎖的 skills 數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/錯誤的 plugins；列出任何錯誤的 Plugin ID；回報 bundle Plugin capabilities。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 plugins。
    - **Plugin 診斷**：顯示 Plugin registry 在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的 context 檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元佔總預算的比例。當檔案被截斷或接近限制時，doctor 會印出調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過期頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除缺失的頻道 Plugin 時，也會移除參照該 Plugin 的懸空頻道範圍設定：`channels.<id>` 項目、指定該頻道的 Heartbeat targets，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止頻道執行階段已消失，但設定仍要求 Gateway 綁定到它而造成的 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 tab 補全：

    - 如果 shell profile 使用較慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將它升級為較快的快取檔案變體。
    - 如果補全已在 profile 中設定但快取檔案不存在，doctor 會自動重新產生快取。
    - 如果完全沒有設定補全，doctor 會提示安裝它（僅互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機 token）">
    Doctor 會檢查本機 Gateway token 驗證就緒狀態。

    - 如果 token 模式需要 token 且不存在 token 來源，doctor 會提議產生一個。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會警告且不會用明文覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定 token SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的唯讀修復">
    某些修復流程需要檢查已設定的認證，而不削弱執行階段快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與 status 類命令相同的唯讀 SecretRef 摘要模型，進行目標式設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 認證。
    - 如果 Telegram bot token 透過 SecretRef 設定，但在目前命令路徑中無法使用，doctor 會回報該認證已設定但無法使用，並略過自動解析，而不是當機或誤報 token 缺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查與重新啟動">
    Doctor 會執行健康檢查，並在 Gateway 看起來不健康時提議重新啟動。
  </Accordion>
  <Accordion title="13b. Memory 搜尋就緒狀態">
    Doctor 會檢查設定的 memory search embedding provider 對預設 agent 是否就緒。行為取決於設定的 backend 與 provider：

    - **QMD backend**：探測 `qmd` binary 是否可用且可啟動。如果不是，會印出修復指引，包括 npm package 與手動 binary path 選項。
    - **明確本機 provider**：檢查本機 model 檔案，或可辨識的遠端/可下載 model URL。如果缺失，建議切換到遠端 provider。
    - **明確遠端 provider**（`openai`、`voyage` 等）：確認環境或 auth store 中存在 API key。若缺失，印出可執行的修復提示。
    - **自動 provider**：先檢查本機 model 可用性，然後依自動選擇順序嘗試各個遠端 provider。

    當有可用的快取 Gateway 探測結果（Gateway 在檢查時健康）時，doctor 會將其結果與 CLI 可見設定交叉參照，並標註任何差異。Doctor 不會在預設路徑啟動新的 embedding ping；需要即時 provider 檢查時，請使用深度 memory status 命令。

    使用 `openclaw memory status --deep` 在執行階段驗證 embedding 就緒狀態。

  </Accordion>
  <Accordion title="14. 頻道狀態警告">
    如果 Gateway 健康，doctor 會執行頻道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. Supervisor 設定稽核與修復">
    Doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks）是否缺少預設值或使用過期預設值（例如 systemd network-online 依賴項與重新啟動延遲）。當它發現不相符時，會建議更新，並可將服務檔案/task 重寫為目前預設值。

    注意：

    - `openclaw doctor` 會在重寫 supervisor 設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會套用建議修復且不提示。
    - `openclaw doctor --repair --force` 會覆寫自訂 supervisor 設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 Gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap、supervisor 設定重寫，以及舊版服務清理，因為外部 supervisor 擁有該生命週期。
    - 在 Linux 上，當相符的 systemd Gateway unit 作用中時，doctor 不會重寫 command/entrypoint metadata。它也會在重複服務掃描期間忽略非作用中的非舊版額外類似 Gateway 的 units，讓伴隨服務檔案不會產生清理雜訊。
    - 如果 token auth 需要 token 且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝/修復會驗證 SecretRef，但不會將解析後的明文 token 值保存到 supervisor 服務環境 metadata。
    - Doctor 會偵測較舊的 LaunchAgent、systemd 或 Windows Scheduled Task 安裝曾內嵌 inline 的受管理 `.env`/SecretRef-backed 服務環境值，並重寫服務 metadata，讓這些值從執行階段來源載入，而不是從 supervisor 定義載入。
    - Doctor 會偵測服務命令是否在 `gateway.port` 變更後仍固定舊的 `--port`，並將服務 metadata 重寫為目前連接埠。
    - 如果 token auth 需要 token 且設定的 token SecretRef 未解析，doctor 會以可執行的指引封鎖安裝/修復路徑。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會封鎖安裝/修復，直到明確設定 mode。
    - 對 Linux user-systemd units，doctor token drift 檢查現在會在比較服務 auth metadata 時，同時包含 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後由較新版本寫入時，Doctor 服務修復會拒絕從較舊的 OpenClaw binary 重寫、停止或重新啟動 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + 連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    當 Gateway 服務在 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，Doctor 會發出警告。WhatsApp + Telegram 頻道需要 Node，而版本管理器路徑在升級後可能會中斷，因為服務不會載入你的 shell 初始化。可用時，Doctor 會提議遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或修復的服務會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者 bin 目錄，但猜測的版本管理器備用目錄只有在那些目錄存在於磁碟上時，才會寫入服務 PATH。這可讓產生的 supervisor PATH 與 Doctor 稍後執行的相同最小 PATH 稽核保持一致。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會保存任何設定變更，並加上精靈中繼資料戳記以記錄這次 Doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶系統）">
    當缺少工作區記憶系統時，Doctor 會建議加入；如果工作區尚未納入 git 管理，則會列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得工作區結構與 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
