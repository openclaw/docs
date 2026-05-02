---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-05-02T02:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
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

    不提示即接受預設值（包括適用時的重新啟動、服務、沙盒修復步驟）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    不提示即套用建議的修復（在安全情況下執行修復 + 重新啟動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    也套用積極修復（覆寫自訂監督程式設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不顯示提示並且只套用安全遷移（設定正規化 + 磁碟上狀態搬移）。略過需要人工確認的重新啟動、服務、沙盒動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務中額外的 Gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在寫入前檢視變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 功能摘要

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - git 安裝的選用前置更新（僅互動模式）。
    - UI 通訊協定是否為最新的檢查（當通訊協定結構描述較新時重建 Control UI）。
    - 健康狀態檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/已封鎖）與 Plugin 狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - 將舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>` 的 Talk 設定遷移。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 準備狀態的瀏覽器遷移檢查。
    - OpenCode 提供者覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 先決條件檢查。
    - 當 `plugins.allow` 具限制性但工具政策仍要求萬用字元或 Plugin 擁有的工具時，顯示 Plugin/工具允許清單警告。
    - 舊版磁碟上狀態遷移（工作階段/代理目錄/WhatsApp 驗證）。
    - 舊版 Plugin manifest 合約鍵遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 cron 儲存區遷移（`jobId`, `schedule.cron`, 最上層 delivery/payload 欄位、payload `provider`, 簡單的 `notify: true` Webhook 後援工作）。
    - 舊版代理執行階段政策遷移到 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 Plugin 時清理過時的 Plugin 設定；當 `plugins.enabled=false` 時，過時的 Plugin 參照會被視為惰性的隔離設定並予以保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 工作階段鎖定檔檢查與過時鎖定清理。
    - 修復受影響的 2026.4.24 建置所建立的重複提示重寫分支工作階段 transcript。
    - 卡住的子代理重新啟動復原 tombstone 偵測，並支援透過 `--fix` 清除過時的已中止復原旗標，讓啟動時不會持續將子項視為重新啟動已中止。
    - 狀態完整性與權限檢查（工作階段、transcript、狀態目錄）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期時間，可重新整理即將到期的 token，並回報 auth-profile 冷卻/停用狀態。
    - 額外工作區目錄偵測（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、服務與監督程式">
    - 啟用沙盒時的沙盒映像修復。
    - 舊版服務遷移與額外 Gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway 執行階段檢查（服務已安裝但未執行；快取的 launchd 標籤）。
    - Channel 狀態警告（從執行中的 Gateway 探測）。
    - 監督程式設定稽核（launchd/systemd/schtasks）與選用修復。
    - 清理嵌入式 proxy 環境，適用於在安裝或更新期間擷取 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的 Gateway 服務。
    - Gateway 執行階段最佳實務檢查（Node 與 Bun、版本管理器路徑）。
    - Gateway 連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放 DM 政策的安全性警告。
    - local token 模式的 Gateway 驗證檢查（沒有 token 來源時提供 token 產生；不覆寫 token SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對請求、待處理的角色/範圍升級、過時的本機裝置 token 快取漂移，以及已配對記錄驗證漂移）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區啟動檔案大小檢查（內容檔案的截斷/接近限制警告）。
    - Shell 補全狀態檢查與自動安裝/升級。
    - Memory 搜尋嵌入提供者準備狀態檢查（本機模型、遠端 API key 或 QMD binary）。
    - 原始碼安裝檢查（pnpm 工作區不相符、缺少 UI 資產、缺少 tsx binary）。
    - 寫入更新後的設定 + 精靈中繼資料。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI 的 Dreams 場景包含用於有依據 Dreaming 工作流程的 **回填**、**重設** 與 **清除有依據項目** 動作。這些動作使用 Gateway doctor 風格的 RPC 方法，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們的作用：

- **回填**會掃描作用中工作區內歷史的 `memory/YYYY-MM-DD.md` 檔案，執行有依據 REM 日記流程，並將可復原的回填項目寫入 `DREAMS.md`。
- **重設**只會從 `DREAMS.md` 移除那些標記的回填日記項目。
- **清除有依據項目**只會移除來自歷史重播、且尚未累積即時召回或每日支援的已暫存、有依據限定的短期項目。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整的 doctor 遷移
- 除非你先明確執行暫存用的 CLI 路徑，否則它們不會自動將有依據的候選項暫存到即時短期晉升儲存區

如果你希望有依據的歷史重播影響正常的深層晉升流程，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將有依據的持久候選項暫存到短期 Dreaming 儲存區，同時保留 `DREAMS.md` 作為審閱介面。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout，且 doctor 正在互動模式執行，它會在執行 doctor 前提供更新選項（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有 channel 專屬覆寫的 `messages.ackReaction`），doctor 會將它們正規化為目前的結構描述。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到提供者 map 中。

    當 `plugins.allow` 非空且工具政策使用
    萬用字元或 Plugin 擁有的工具項目時，doctor 也會警告。`tools.allow: ["*"]` 只會比對
    實際載入的 Plugin 中的工具；它不會繞過專屬的 Plugin
    允許清單。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含已棄用的鍵時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版鍵。
    - 顯示它套用的遷移。
    - 使用更新後的結構描述重寫 `~/.openclaw/openclaw.json`。

    Gateway 也會在啟動時偵測到舊版設定格式時自動執行 doctor 遷移，因此過時設定會在不需要手動介入的情況下修復。Cron 工作儲存區遷移由 `openclaw doctor --fix` 處理。

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
    - 對於有命名 `accounts`、但仍殘留單一帳號頂層 channel 值的 channel，將那些帳號範圍值移入為該 channel 選定的提升帳號（多數 channel 使用 `accounts.default`；Matrix 可保留現有相符的命名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；對慢速 provider/model 逾時使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版 extension relay 設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 啟動時也會略過 `api` 設為未來或未知 enum 值的 providers，而不是封閉失敗）

    Doctor 警告也包含多帳號 channel 的帳號預設指引：

    - 如果設定了兩個以上 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告備援路由可能選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳號 ID，doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode provider 覆寫">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode catalog。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會警告，讓你可以移除覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome extension 路徑，doctor 會將它正規化為目前的主機本機 Chrome MCP attach 模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` profile 時，doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查同一主機上是否已安裝 Google Chrome，以供預設自動連線 profiles 使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時警告
    - 提醒你在瀏覽器 inspect 頁面啟用遠端除錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - Gateway/Node 主機上的 Chromium-based browser 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端除錯
    - 在瀏覽器中核准第一次 attach 同意提示

    這裡的就緒狀態只關於本機 attach 前置需求。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理的瀏覽器或原始 CDP profile。

    此檢查**不**適用於 Docker、sandbox、remote-browser 或其他 headless flows。那些仍會使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置需求">
    設定 OpenAI Codex OAuth profile 時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊能否驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定的修正指引。在使用 Homebrew Node 的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 gateway 健康也會執行探測。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider 覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI transport 設定，它們可能會遮蔽新版會自動使用的內建 Codex OAuth provider 路徑。Doctor 看到那些舊 transport 設定與 Codex OAuth 並存時會警告，讓你可以移除或重寫過時的 transport 覆寫，取回內建的路由/備援行為。自訂 proxy 和僅 header 的覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex Plugin 路由警告">
    啟用內建 Codex Plugin 時，doctor 也會檢查 `openai-codex/*` primary model refs 是否仍透過預設 PI runner 解析。當你想透過 PI 使用 Codex OAuth/subscription auth 時，這個組合是有效的，但很容易與原生 Codex app-server harness 混淆。Doctor 會警告並指向明確的 app-server 形狀：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不會自動修復，因為兩條路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw runner 使用 Codex OAuth/subscription auth」。
    - `openai/*` + `agentRuntime.id: "codex"` 表示「透過原生 Codex app-server 執行內嵌 turn」。
    - `/codex ...` 表示「從 chat 控制或繫結原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx adapter」。

    如果出現警告，請選擇你原本想要的路由並手動編輯 config。當 PI Codex OAuth 是刻意設定時，請保持警告原樣。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟版面配置）">
    Doctor 可以將較舊的磁碟版面配置遷移到目前結構：

    - Sessions store + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent dir：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp auth state（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（除了 `oauth.json`）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移是盡力而為且冪等的；當 doctor 留下任何舊版資料夾作為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版 sessions + agent dir，讓 history/auth/models 落在每個 agent 的路徑下，無需手動執行 doctor。WhatsApp auth 則刻意只透過 `openclaw doctor` 遷移。Talk provider/provider-map 正規化現在會以結構相等性比較，因此只有 key 順序差異不再觸發重複的無作用 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝的 plugin manifests，尋找已棄用的頂層 capability keys（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提出將它們移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移是冪等的；如果 `contracts` key 已有相同值，舊版 key 會被移除而不會複製資料。
  </Accordion>
  <Accordion title="3b. 舊版 cron store 遷移">
    Doctor 也會檢查 cron job store（預設為 `~/.openclaw/cron/jobs.json`，或覆寫時的 `cron.store`），尋找 scheduler 仍為相容性接受的舊 job 形狀。

    目前的 cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload fields（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery fields（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery aliases → 明確的 `delivery.channel`
    - 簡單的舊版 `notify: true` webhook fallback jobs → 明確的 `delivery.mode="webhook"` 搭配 `delivery.to=cron.webhook`

    Doctor 只會在不改變行為的情況下自動遷移 `notify: true` jobs。如果某個 job 同時包含舊版 notify fallback 和現有的非 webhook delivery mode，doctor 會警告並保留該 job 供手動審查。

    在 Linux 上，當使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會警告。該主機本機腳本不由目前的 OpenClaw 維護，且當 cron 無法連到 systemd user bus 時，可能會把錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理工作階段目錄中過時的寫入鎖定檔案，即工作階段異常結束後遺留的檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍存活、鎖定存在時間，以及是否被視為過時（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過時的鎖定檔案；否則會列印一則提示，並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段文字記錄分支修復">
    Doctor 會掃描代理工作階段 JSONL 檔案，尋找由 2026.4.24 提示文字記錄重寫錯誤所建立的重複分支形狀：一個遭棄用、帶有 OpenClaw 內部執行階段內容的使用者回合，加上一個包含相同可見使用者提示的作用中同層項目。在 `--fix` / `--repair` 模式中，doctor 會在原始檔旁備份每個受影響的檔案，並將文字記錄重寫為作用中分支，讓 Gateway 歷史記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是操作上的中樞。如果它消失，你會失去工作階段、認證、記錄和設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性的狀態遺失、提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提供修復權限的選項（並在偵測到擁有者/群組不符時輸出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 之下時發出警告，因為同步支援的路徑可能導致較慢的 I/O 與鎖定/同步競態。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 在工作階段與認證寫入下可能較慢且磨耗較快。
    - **工作階段目錄遺失**：`sessions/` 與工作階段儲存目錄是持久保存歷史記錄並避免 `ENOENT` 當機所必需的。
    - **文字記錄不符**：當近期工作階段項目缺少文字記錄檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要文字記錄只有一行時標記（表示歷史記錄未累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於各家目錄中，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能在安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可被群組/所有人讀取，則發出警告並提供收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存中的 OAuth 設定檔，於權杖即將到期/已到期時發出警告，並在安全時重新整理它們。如果 Anthropic OAuth/權杖設定檔已過期，它會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式（TTY）執行時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗（例如 `refresh_token_reused`、`invalid_grant`，或提供者要求你重新登入）時，doctor 會回報需要重新驗證，並列印要執行的完整 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因下列原因暫時不可用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長停用（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果已設定 `hooks.gmail.model`，doctor 會依照目錄與允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙盒映像修復">
    啟用沙盒時，doctor 會檢查 Docker 映像，並在目前映像遺失時提供建置或切換到舊名稱的選項。
  </Accordion>
  <Accordion title="7b. Plugin 安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中移除舊版 OpenClaw 產生的 Plugin 相依性暫存狀態。這涵蓋過時的產生相依性根目錄、舊的安裝階段目錄，以及早期內建 Plugin 相依性修復程式碼留下的套件本機殘留。

    當設定參照可下載 Plugin 但本機 Plugin 登錄找不到它們時，Doctor 也可以重新安裝已設定的可下載 Plugin。Gateway 啟動與設定重新載入不會執行套件管理器；Plugin 安裝仍然是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除它們以及使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 Gateway 服務並列印清理提示。以設定檔命名的 OpenClaw Gateway 服務會被視為一級項目，不會標記為「額外」。

    在 Linux 上，如果使用者層級 Gateway 服務遺失，但系統層級 OpenClaw Gateway 服務存在，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統監督器負責 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳戶有待處理或可執行的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。這兩個步驟都不是致命錯誤；錯誤會被記錄，啟動會繼續。在唯讀模式（不帶 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會將裝置配對狀態納入一般健康檢查。

    它會回報：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 ID 仍相符但裝置身分不再符合已核准記錄的公開金鑰不符修復
    - 缺少已核准角色作用中權杖的配對記錄
    - 範圍漂移到已核准配對基準之外的配對權杖
    - 目前機器的本機快取裝置權杖項目，早於 Gateway 端權杖輪替或帶有過時的範圍中繼資料

    Doctor 不會自動核准配對請求或自動輪替裝置權杖。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准確切請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過時記錄

    這補上了常見的「已配對但仍然收到需要配對」漏洞：doctor 現在會區分首次配對、待處理角色/範圍升級，以及過時權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當提供者在沒有允許清單的情況下對私訊開放，或政策以危險方式設定時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 gateway 在登出後保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、plugins 與舊版目錄）">
    Doctor 會列印預設代理的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及被允許清單封鎖的 skills。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 plugins；列出任何錯誤的 Plugin ID；回報套件 Plugin 功能。
    - **Plugin 相容性警告**：標記與目前執行階段有相容性問題的 plugins。
    - **Plugin 診斷**：顯示 Plugin 登錄在載入時輸出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元占總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 與 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過時頻道 Plugin 清理">
    當 `openclaw doctor --fix` 移除遺失的頻道 Plugin 時，它也會移除參照該 Plugin 的懸空頻道範圍設定：`channels.<id>` 項目、命名該頻道的 Heartbeat 目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止頻道執行階段已消失但設定仍要求 gateway 繫結到它時造成 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 補全：

    - 如果 shell 設定檔使用緩慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將它升級為較快的快取檔案變體。
    - 如果補全已在設定檔中設定但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全沒有設定補全，doctor 會提示安裝它（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機權杖）">
    Doctor 會檢查本機 Gateway 權杖驗證就緒狀態。

    - 如果權杖模式需要權杖且不存在權杖來源，doctor 會提供產生一個權杖的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但不可用，doctor 會發出警告且不會以明文覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定權杖 SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. SecretRef 感知的唯讀修復">
    某些修復流程需要檢查已設定的認證，而不削弱執行階段快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與狀態類命令相同的唯讀 SecretRef 摘要模型，進行目標設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 認證。
    - 如果 Telegram bot 權杖透過 SecretRef 設定，但在目前命令路徑中不可用，doctor 會回報認證已設定但不可用，並略過自動解析，而不是當機或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在 gateway 看起來不健康時提供重新啟動的選項。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    Doctor 會檢查設定的記憶搜尋嵌入提供者是否已為預設代理就緒。行為取決於設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若否，會列印修正指引，包括 npm 套件和手動二進位路徑選項。
    - **明確本機提供者**：檢查是否有本機模型檔案，或可辨識的遠端／可下載模型 URL。若缺少，建議切換到遠端提供者。
    - **明確遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否有 API 金鑰。若缺少，會列印可操作的修正提示。
    - **自動提供者**：先檢查本機模型可用性，然後依自動選取順序嘗試每個遠端提供者。

    當有快取的 gateway 探測結果可用時（檢查當下 gateway 狀態健康），doctor 會將其結果與 CLI 可見的設定交叉比對，並註明任何差異。Doctor 在預設路徑上不會啟動新的嵌入 ping；若你需要即時提供者檢查，請使用深度記憶體狀態命令。

    使用 `openclaw memory status --deep` 在執行時驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. Channel 狀態警告">
    如果 Gateway 狀態健康，doctor 會執行 channel 狀態探測，並回報警告與建議修正方式。
  </Accordion>
  <Accordion title="15. Supervisor 設定稽核 + 修復">
    Doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks）是否缺少或使用過時的預設值（例如 systemd network-online 相依性和重新啟動延遲）。當找到不一致時，會建議更新，並可將服務檔案／工作重寫為目前預設值。

    注意：

    - `openclaw doctor` 會在重寫 supervisor 設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會在不提示的情況下套用建議修正。
    - `openclaw doctor --repair --force` 會覆寫自訂 supervisor 設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 gateway 服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝／啟動／重新啟動／bootstrap、supervisor 設定重寫，以及舊版服務清理，因為該生命週期由外部 supervisor 擁有。
    - 在 Linux 上，當相符的 systemd gateway 單元為啟用中時，doctor 不會重寫命令／進入點中繼資料。它也會在重複服務掃描期間忽略未啟用的非舊版額外 gateway-like 單元，避免伴隨服務檔案產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝／修復會驗證 SecretRef，但不會將解析後的明文權杖值持久化到 supervisor 服務環境中繼資料。
    - Doctor 會偵測較舊的 LaunchAgent、systemd 或 Windows Scheduled Task 安裝內嵌的受管 `.env`／SecretRef 後援服務環境值，並重寫服務中繼資料，讓這些值從執行時來源載入，而不是從 supervisor 定義載入。
    - Doctor 會偵測在 `gateway.port` 變更後，服務命令是否仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且設定的權杖 SecretRef 無法解析，doctor 會以可操作的指引封鎖安裝／修復路徑。
    - 如果同時設定 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，doctor 會封鎖安裝／修復，直到模式明確設定為止。
    - 對於 Linux user-systemd 單元，doctor 權杖漂移檢查現在會在比較服務驗證中繼資料時，同時包含 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後是由較新版本寫入時，Doctor 服務修復會拒絕從較舊的 OpenClaw 二進位檔重寫、停止或重新啟動 gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. Gateway 執行時 + 連接埠診斷">
    Doctor 會檢查服務執行時（PID、上次結束狀態），並在服務已安裝但實際未執行時發出警告。它也會檢查 gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（gateway 已在執行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. Gateway 執行時最佳實務">
    Doctor 會在 gateway 服務執行於 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）時發出警告。WhatsApp + Telegram channels 需要 Node，而版本管理器路徑可能會在升級後失效，因為服務不會載入你的 shell init。Doctor 會在可用時提供遷移到系統 Node 安裝（Homebrew/apt/choco）的選項。

    新安裝或修復的服務會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者 bin 目錄，但推測的版本管理器後援目錄只有在磁碟上存在時，才會寫入服務 PATH。這會讓產生的 supervisor PATH 與 doctor 稍後執行的同一個最小 PATH 稽核保持一致。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會持久化任何設定變更，並標記精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶體系統）">
    Doctor 會在缺少時建議工作區記憶體系統，並在工作區尚未納入 git 時列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得工作區結構和 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
