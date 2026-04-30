---
read_when:
    - 新增或修改診斷遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷
x-i18n:
    generated_at: "2026-04-30T03:06:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347ce9a2f87632292319aa740389dca8763bd26dd398fb0edeb5b70cc16b949a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復 + 遷移工具。它會修正過期的設定/狀態、檢查健康狀態，並提供可執行的修復步驟。

## 快速開始

```bash
openclaw doctor
```

### 無頭模式與自動化模式

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    不提示即接受預設值（包含適用時的重新啟動/服務/sandbox 修復步驟）。

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

    也套用積極修復（覆寫自訂 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不顯示提示並只套用安全遷移（設定正規化 + 磁碟上的狀態移動）。跳過需要人工確認的重新啟動/服務/sandbox 動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外的 gateway 安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果想在寫入前檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 功能摘要

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - git 安裝的選用預檢更新（僅限互動模式）。
    - UI 通訊協定新鮮度檢查（當通訊協定 schema 較新時重建 Control UI）。
    - 健康檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合條件/缺少/受阻）與 Plugin 狀態。

  </Accordion>
  <Accordion title="Config and migrations">
    - 舊版值的設定正規化。
    - 將舊版扁平 `talk.*` 欄位遷移為 `talk.provider` + `talk.providers.<provider>` 的 Talk 設定遷移。
    - 舊版 Chrome extension 設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth 遮蔽警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth profiles 的 OAuth TLS 先決條件檢查。
    - 舊版磁碟狀態遷移（sessions/agent dir/WhatsApp auth）。
    - 舊版 Plugin manifest contract key 遷移（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 舊版 cron store 遷移（`jobId`, `schedule.cron`, 頂層 delivery/payload 欄位、payload `provider`、簡單的 `notify: true` webhook fallback jobs）。
    - 舊版 agent runtime-policy 遷移至 `agents.defaults.agentRuntime` 與 `agents.list[].agentRuntime`。
    - 啟用 plugins 時清理過期 Plugin 設定；當 `plugins.enabled=false` 時，過期的 Plugin 參照會被視為惰性 containment config 並保留。

  </Accordion>
  <Accordion title="State and integrity">
    - Session lock file 檢查與過期 lock 清理。
    - 修復受影響 2026.4.24 builds 建立的重複 prompt-rewrite 分支 session transcript。
    - 狀態完整性與權限檢查（sessions、transcripts、state dir）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - Model auth 健康狀態：檢查 OAuth 到期、可重新整理即將到期的 tokens，並回報 auth-profile cooldown/disabled 狀態。
    - 偵測額外 workspace dir（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - 啟用 sandboxing 時修復 sandbox image。
    - 舊版 service 遷移與額外 gateway 偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - Gateway runtime 檢查（服務已安裝但未執行；快取的 launchd label）。
    - Channel 狀態警告（從執行中的 gateway 探測）。
    - Supervisor 設定稽核（launchd/systemd/schtasks），可選擇修復。
    - 清理 gateway services 的 embedded proxy environment，這些服務在安裝或更新時擷取了 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值。
    - Gateway runtime 最佳實務檢查（Node vs Bun、version-manager paths）。
    - Gateway port collision 診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - 開放 DM policies 的安全警告。
    - local token mode 的 Gateway auth 檢查（沒有 token source 時提供 token generation；不會覆寫 token SecretRef configs）。
    - 裝置配對問題偵測（pending first-time pair requests、pending role/scope upgrades、過期 local device-token cache drift，以及 paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux 上的 systemd linger 檢查。
    - Workspace bootstrap file size 檢查（context files 的 truncation/near-limit 警告）。
    - Shell completion 狀態檢查與自動安裝/升級。
    - Memory search embedding provider 就緒狀態檢查（local model、remote API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace mismatch、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定 + wizard metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含 grounded dreaming workflow 的 **Backfill**、**Reset** 與 **Clear Grounded** 動作。這些動作使用 gateway doctor-style RPC methods，但它們**不是** `openclaw doctor` CLI 修復/遷移的一部分。

它們會做什麼：

- **Backfill** 會掃描 active workspace 中的歷史 `memory/YYYY-MM-DD.md` 檔案，執行 grounded REM diary pass，並將可回復的 backfill entries 寫入 `DREAMS.md`。
- **Reset** 只會從 `DREAMS.md` 移除那些標記的 backfill diary entries。
- **Clear Grounded** 只會移除 staged grounded-only short-term entries，這些 entries 來自 historical replay，且尚未累積 live recall 或 daily support。

它們本身**不會**做什麼：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor migrations
- 它們不會自動將 grounded candidates 暫存到 live short-term promotion store，除非你先明確執行 staged CLI path

如果想讓 grounded historical replay 影響正常的 deep promotion lane，請改用 CLI 流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates 暫存到 short-term dreaming store，同時讓 `DREAMS.md` 保持作為 review surface。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    如果這是 git checkout 且 doctor 以互動方式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. Config normalization">
    如果設定包含舊版值形狀（例如沒有 channel-specific override 的 `messages.ackReaction`），doctor 會將它們正規化為目前的 schema。

    這包含舊版 Talk 扁平欄位。目前公開的 Talk 設定是 `talk.provider` + `talk.providers.<provider>`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到 provider map。

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    當設定包含已棄用 keys 時，其他命令會拒絕執行並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版 keys。
    - 顯示已套用的遷移。
    - 使用更新後的 schema 重寫 `~/.openclaw/openclaw.json`。

    Gateway 在啟動時偵測到舊版設定格式，也會自動執行 doctor migrations，因此過期設定會在不需手動介入的情況下修復。Cron job store 遷移由 `openclaw doctor --fix` 處理。

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
    - `messages.tts.provider: "edge"` 與 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 與 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 與 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 與 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 對於具有具名 `accounts` 但仍殘留單帳號頂層 channel 值的 channels，將那些 account-scoped values 移入為該 channel 選定的 promoted account（多數 channels 使用 `accounts.default`；Matrix 可保留現有相符的 named/default target）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；slow provider/model timeouts 請使用 `models.providers.<id>.timeoutSeconds`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版 extension relay setting）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（gateway startup 也會略過 `api` 設為未來或未知 enum value 的 providers，而不是封閉式失敗）

    Doctor 警告也包含 multi-account channels 的 account-default 指引：

    - 如果設定了兩個以上 `channels.<channel>.accounts` entries，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告 fallback routing 可能選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知的 account ID，doctor 會警告並列出已設定的 account IDs。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你已手動新增 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `@mariozechner/pi-ai` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會發出警告，讓你可以移除覆寫並還原每個模型各自的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將它標準化為目前的主機本機 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查預設自動連線設定檔是否已在同一台主機上安裝 Google Chrome
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - gateway/node 主機上有 Chromium 系瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只關乎本機附加的先決條件。Existing-session 會保留目前的 Chrome MCP 路由限制；`responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理的瀏覽器或原始 CDP 設定檔。

    此檢查**不**適用於 Docker、沙箱、遠端瀏覽器或其他 headless 流程。這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先決條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以驗證本機 Node/OpenSSL TLS 堆疊能否驗證憑證鏈。如果探測因憑證錯誤失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），doctor 會列印平台專屬的修復指引。在使用 Homebrew Node 的 macOS 上，修復方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使 Gateway 健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI 傳輸設定，這些設定可能會遮蔽較新版本自動使用的內建 Codex OAuth 提供者路徑。當 Doctor 看到這些舊傳輸設定與 Codex OAuth 並存時會發出警告，讓你可以移除或重寫過時的傳輸覆寫，並取回內建路由/備援行為。自訂代理和僅限標頭的覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex Plugin 路由警告">
    啟用隨附的 Codex Plugin 時，doctor 也會檢查 `openai-codex/*` 主要模型參照是否仍透過預設 PI runner 解析。當你想透過 PI 使用 Codex OAuth/訂閱驗證時，這個組合是有效的，但很容易與原生 Codex app-server harness 混淆。Doctor 會發出警告並指向明確的 app-server 形態：`openai/*` 加上 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor 不會自動修復此問題，因為兩種路由都有效：

    - `openai-codex/*` + PI 表示「透過一般 OpenClaw runner 使用 Codex OAuth/訂閱驗證。」
    - `openai/*` + `runtime: "codex"` 表示「透過原生 Codex app-server 執行嵌入式 turn。」
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話。」
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器。」

    如果出現警告，請選擇你原本想要的路由並手動編輯設定。當 PI Codex OAuth 是刻意設定時，保留警告原樣即可。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可以將較舊的磁碟配置遷移到目前結構：

    - 工作階段儲存區 + 逐字稿：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳戶 ID：`default`）

    這些遷移採盡力而為且具冪等性；當 doctor 將任何舊版資料夾保留為備份時，會發出警告。Gateway/CLI 也會在啟動時自動遷移舊版工作階段與 Agent 目錄，讓歷史記錄/驗證/模型進入各 Agent 路徑，而不需要手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。通話提供者/提供者對應標準化現在會依結構相等性比較，因此只有鍵順序差異的 diff 不再觸發重複的無效 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版 Plugin manifest 遷移">
    Doctor 會掃描所有已安裝 Plugin manifest 中已棄用的頂層能力鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將它們移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移具冪等性；如果 `contracts` 鍵已經有相同值，舊版鍵會被移除，而不會重複資料。
  </Accordion>
  <Accordion title="3b. 舊版 Cron 儲存區遷移">
    Doctor 也會檢查 cron 工作儲存區（預設為 `~/.openclaw/cron/jobs.json`，或在覆寫時使用 `cron.store`），尋找排程器仍為相容性接受的舊工作形態。

    目前 cron 清理包含：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` delivery 別名 → 明確的 `delivery.channel`
    - 簡單舊版 `notify: true` webhook 備援工作 → 明確的 `delivery.mode="webhook"`，並設定 `delivery.to=cron.webhook`

    Doctor 只會在不改變行為的情況下自動遷移 `notify: true` 工作。如果某個工作將舊版 notify 備援與既有的非 webhook delivery 模式結合，doctor 會發出警告，並將該工作留待手動審查。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個 Agent 工作階段目錄，尋找過期的寫入鎖定檔案，也就是工作階段異常結束時留下的檔案。對於找到的每個鎖定檔，它會回報：路徑、PID、PID 是否仍存活、鎖定時間長度，以及是否視為過期（PID 已死亡或超過 30 分鐘）。在 `--fix` / `--repair` 模式中，它會自動移除過期的鎖定檔；否則會列印註記並指示你使用 `--fix` 重新執行。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描 Agent 工作階段 JSONL 檔案，尋找由 2026.4.24 prompt 逐字稿重寫 bug 建立的重複分支形態：一個被棄用的使用者 turn，包含 OpenClaw 內部執行時期脈絡，旁邊還有一個作用中的 sibling，包含相同的可見使用者 prompt。在 `--fix` / `--repair` 模式中，doctor 會將每個受影響檔案備份到原檔旁邊，並將逐字稿重寫到作用中分支，讓 gateway 歷史和記憶讀取器不再看到重複 turn。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是操作上的腦幹。如果它消失，你會失去工作階段、認證、記錄和設定（除非你在其他地方有備份）。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失、提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫性；提議修復權限（偵測到擁有者/群組不符時，會發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 和鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為在工作階段與認證寫入下，SD 或 eMMC 支援的隨機 I/O 可能較慢且磨耗較快。
    - **工作階段目錄遺失**：`sessions/` 和工作階段儲存區目錄是持久保存歷史記錄並避免 `ENOENT` 當機所必需的。
    - **逐字稿不相符**：當近期工作階段項目缺少逐字稿檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：當主要逐字稿只有一行時標記（歷史記錄未累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於各 home 目錄，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能會在不同安裝之間分散）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於那裡）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/全域讀取，會發出警告並提議收緊為 `600`。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在 token 即將到期/已到期時發出警告，並在安全時重新整理它們。如果 Anthropic OAuth/token 設定檔已過期，它會建議使用 Anthropic API key 或 Anthropic setup-token 路徑。重新整理提示只會在互動模式（TTY）執行時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者告訴你需要重新登入），doctor 會回報需要重新驗證，並列印要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因下列原因暫時不可用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長時間停用（帳單/額度失敗）

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果已設定 `hooks.gmail.model`，doctor 會根據目錄和允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，doctor 會檢查 Docker 映像，並在目前映像遺失時提議建置或切換到舊版名稱。
  </Accordion>
  <Accordion title="7b. 隨附 Plugin 執行時期依賴">
    Doctor 只會驗證目前設定中啟用、或由其隨附 manifest 預設啟用的隨附 Plugin 的執行時期依賴，例如 `plugins.entries.discord.enabled: true`、舊版 `channels.discord.enabled: true`，或預設啟用的隨附提供者。如果有任何缺漏，doctor 會回報套件，並在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中安裝它們。外部 Plugin 仍使用 `openclaw plugins install` / `openclaw plugins update`；doctor 不會為任意 Plugin 路徑安裝依賴。

    在 doctor 修復期間，內建 runtime-dependency npm 安裝會在 TTY 工作階段回報 spinner 進度，並在管線/無介面輸出中定期回報行進度。Gateway 與本機 CLI 也可以在匯入內建 Plugin 之前，按需修復作用中的內建 Plugin runtime 相依性。這些安裝限縮在 Plugin runtime 安裝根目錄中執行，會停用 scripts、不寫入 package lock，並由安裝根目錄鎖保護，因此並行的 CLI 或 Gateway 啟動不會同時變更同一棵 `node_modules` 樹。

  </Accordion>
  <Accordion title="8. Gateway 服務遷移與清理提示">
    Doctor 會偵測舊版 Gateway 服務（launchd/systemd/schtasks），並提供移除它們、使用目前 Gateway 連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類 Gateway 服務並列印清理提示。以設定檔命名的 OpenClaw Gateway 服務會視為一級服務，不會被標記為「額外」。

    在 Linux 上，如果缺少使用者層級 Gateway 服務，但存在系統層級 OpenClaw Gateway 服務，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統 supervisor 擁有 Gateway 生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix channel 帳戶有待處理或可執行的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。這兩個步驟都是非致命的；錯誤會被記錄，且啟動會繼續。在唯讀模式（不帶 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 現在會在一般健康檢查流程中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對要求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理 scope 升級
    - 裝置 id 仍相符但裝置身分不再符合已核准紀錄時的公開金鑰不符修復
    - 已配對紀錄缺少已核准角色的作用中 token
    - scope 漂移到已核准配對基準之外的已配對 token
    - 目前機器上早於 Gateway 端 token 輪替，或帶有過時 scope 中繼資料的本機快取裝置 token 項目

    Doctor 不會自動核准配對要求或自動輪替裝置 token。它會改為列印確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理要求
    - 使用 `openclaw devices approve <requestId>` 核准確切要求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的 token
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過時紀錄

    這補上了常見的「已配對但仍收到需要配對」漏洞：doctor 現在會區分首次配對、待處理角色/scope 升級，以及過時 token/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當 provider 對 DM 開放但沒有 allowlist，或 policy 以危險方式設定時，doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓 Gateway 在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、plugins 與舊版目錄）">
    Doctor 會列印預設 agent 的工作區狀態摘要：

    - **Skills 狀態**：計算 eligible、missing-requirements 與 allowlist-blocked skills 的數量。
    - **舊版工作區目錄**：當 `~/openclaw` 或其他舊版工作區目錄與目前工作區並存時發出警告。
    - **Plugin 狀態**：計算已啟用/已停用/發生錯誤的 plugins；列出任何錯誤的 Plugin ID；回報 bundle Plugin capabilities。
    - **Plugin 相容性警告**：標記與目前 runtime 有相容性問題的 plugins。
    - **Plugin 診斷**：顯示 Plugin registry 在載入期間發出的任何警告或錯誤。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的 context 檔案）是否接近或超過設定的字元預算。它會回報各檔案原始與注入後的字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及注入字元總數占總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 與 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過時 channel Plugin 清理">
    當 `openclaw doctor --fix` 移除缺失的 channel Plugin 時，它也會移除參照該 Plugin 的懸空 channel-scoped config：`channels.<id>` 項目、命名該 channel 的 Heartbeat 目標，以及 `agents.*.models["<channel>/*"]` overrides。這能防止 channel runtime 已不存在，但 config 仍要求 Gateway 綁定到它而造成 Gateway 啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 tab completion：

    - 如果 shell profile 使用較慢的動態 completion pattern（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案變體。
    - 如果 completion 已在 profile 中設定，但 cache file 缺失，doctor 會自動重新產生 cache。
    - 如果完全沒有設定 completion，doctor 會提示安裝它（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生 cache。

  </Accordion>
  <Accordion title="12. Gateway 驗證檢查（本機 token）">
    Doctor 會檢查本機 Gateway token 驗證就緒狀態。

    - 如果 token 模式需要 token 且沒有 token 來源，doctor 會提供產生 token 的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會警告，且不會用 plaintext 覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定 token SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的唯讀修復">
    某些修復流程需要檢查已設定的憑證，同時不削弱 runtime fail-fast 行為。

    - `openclaw doctor --fix` 現在會使用與 status-family commands 相同的唯讀 SecretRef 摘要模型，進行目標式 config 修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 bot 憑證。
    - 如果 Telegram bot token 透過 SecretRef 設定，但在目前 command path 中無法使用，doctor 會回報該憑證已設定但不可用，並略過自動解析，而不是崩潰或誤報 token 缺失。

  </Accordion>
  <Accordion title="13. Gateway 健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在 Gateway 看起來不健康時提供重新啟動選項。
  </Accordion>
  <Accordion title="13b. Memory 搜尋就緒狀態">
    Doctor 會檢查已設定的 memory search embedding provider 是否已為預設 agent 就緒。行為取決於已設定的 backend 與 provider：

    - **QMD backend**：探測 `qmd` binary 是否可用且可啟動。如果不可用，會列印修復指引，包括 npm package 與手動 binary path 選項。
    - **明確本機 provider**：檢查本機 model file 或可辨識的遠端/可下載 model URL。若缺失，會建議切換到遠端 provider。
    - **明確遠端 provider**（`openai`、`voyage` 等）：驗證環境或 auth store 中是否存在 API key。若缺失，會列印可執行的修復提示。
    - **自動 provider**：先檢查本機 model 可用性，然後依 auto-selection 順序嘗試每個遠端 provider。

    當有快取的 Gateway probe result 可用時（Gateway 在檢查當下健康），doctor 會將其結果與 CLI 可見 config 交叉參照，並註記任何差異。Doctor 不會在預設路徑上啟動新的 embedding ping；若要即時 provider 檢查，請使用 deep memory status command。

    使用 `openclaw memory status --deep` 在 runtime 驗證 embedding 就緒狀態。

  </Accordion>
  <Accordion title="14. Channel 狀態警告">
    如果 Gateway 健康，doctor 會執行 channel status probe，並回報帶有建議修復方式的警告。
  </Accordion>
  <Accordion title="15. Supervisor config 稽核 + 修復">
    Doctor 會檢查已安裝的 supervisor config（launchd/systemd/schtasks）是否缺少預設值或使用過時預設值（例如 systemd network-online 相依性與重新啟動延遲）。當它發現不一致時，會建議更新，且可以將 service file/task 改寫為目前預設值。

    注意事項：

    - `openclaw doctor` 會在改寫 supervisor config 前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --repair` 會不提示直接套用建議修復。
    - `openclaw doctor --repair --force` 會覆寫自訂 supervisor configs。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對 Gateway 服務生命週期維持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap、supervisor config 改寫，以及舊版服務清理，因為外部 supervisor 擁有該生命週期。
    - 在 Linux 上，當相符的 systemd Gateway unit 處於作用中時，doctor 不會改寫 command/entrypoint metadata。它也會在 duplicate-service scan 期間忽略非作用中的非舊版額外類 Gateway units，因此 companion service files 不會產生清理雜訊。
    - 如果 token 驗證需要 token 且 `gateway.auth.token` 由 SecretRef 管理，doctor service install/repair 會驗證 SecretRef，但不會將解析出的 plaintext token 值保存到 supervisor service environment metadata。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows Scheduled Task 安裝曾內嵌 inline 的受管理 `.env`/SecretRef-backed service environment 值，並改寫 service metadata，使這些值從 runtime source 載入，而不是從 supervisor definition 載入。
    - Doctor 會偵測 `gateway.port` 變更後 service command 是否仍固定使用舊 `--port`，並將 service metadata 改寫為目前連接埠。
    - 如果 token 驗證需要 token 且已設定的 token SecretRef 未解析，doctor 會封鎖 install/repair path，並提供可執行的指引。
    - 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，但未設定 `gateway.auth.mode`，doctor 會封鎖安裝/修復，直到明確設定模式。
    - 對於 Linux user-systemd units，doctor token drift checks 現在在比較 service auth metadata 時，會同時包含 `Environment=` 與 `EnvironmentFile=` 來源。
    - 當 config 最後由較新版本寫入時，doctor service repairs 會拒絕從舊版 OpenClaw binary 改寫、停止或重新啟動 Gateway 服務。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整改寫。

  </Accordion>
  <Accordion title="16. Gateway 執行階段 + 連接埠診斷">
    醫生會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上沒有執行時發出警告。它也會檢查 Gateway 連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（Gateway 已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. Gateway 執行階段最佳實務">
    醫生會在 Gateway 服務於 Bun 或版本管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時發出警告。WhatsApp + Telegram 頻道需要 Node，而版本管理器路徑可能會在升級後失效，因為服務不會載入你的 shell 初始化設定。可用時，醫生會提議遷移到系統 Node 安裝（Homebrew/apt/choco）。

    新安裝或修復的服務會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者 bin 目錄，但推測出的版本管理器後援目錄只會在那些目錄存在於磁碟上時寫入服務 PATH。這會讓產生的監督程式 PATH 與醫生稍後執行的相同最小 PATH 稽核保持一致。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    醫生會持久化任何設定變更，並標記精靈中繼資料以記錄醫生執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶體系統）">
    缺少工作區記憶體系統時，醫生會建議使用；如果工作區尚未納入 git，也會列印備份提示。

    請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)，取得工作區結構與 git 備份的完整指南（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
