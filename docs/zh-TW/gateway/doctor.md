---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-06-27T19:17:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
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

    接受預設值而不提示（包含適用時的重啟/服務/沙箱修復步驟）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    套用建議的修復而不提示（在安全情況下執行修復與重啟）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    為 CI 或預檢自動化執行結構化健康檢查。此模式為
    唯讀：不會提示、修復、遷移設定、重啟服務，或
    觸碰狀態。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    也套用侵入性修復（覆寫自訂的 supervisor 設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不顯示提示並只套用安全遷移（設定正規化 + 磁碟上狀態移動）。略過需要人工確認的重啟/服務/沙箱動作。偵測到舊版狀態遷移時會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以找出額外的閘道安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

如果你想在寫入前檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 唯讀 lint 模式

`openclaw doctor --lint` 是 `openclaw doctor --fix` 的自動化友善姊妹命令。兩者都使用 doctor 健康檢查，但姿態不同：

| 模式                     | 提示      | 寫入設定/狀態           | 輸出                 | 用途                            |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是        | 否                      | 友善的健康報告       | 由人員檢查狀態                  |
| `openclaw doctor --fix`  | 有時      | 是，依修復政策          | 友善的修復記錄       | 套用已核准的修復                |
| `openclaw doctor --lint` | 否        | 否                      | 結構化發現項目       | CI、預檢與審查閘門              |

現代化健康檢查可提供選用的 `repair()` 實作。`doctor --fix` 會在這些修復存在時套用它們，並對尚未遷移的檢查繼續使用既有的 doctor 修復流程。結構化修復合約也會將修復報告與偵測分離：`detect()` 回報目前的發現項目，而 `repair()` 可以回報變更、設定/檔案差異，以及非檔案副作用。這會保留未來 `doctor --fix --dry-run` 與差異輸出的遷移路徑，而不讓 lint 檢查規劃變更。

範例：

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 輸出包含：

- `ok`：是否有任何可見發現項目達到所選嚴重性門檻
- `checksRun`：已執行的健康檢查數量
- `checksSkipped`：因所選設定檔、`--only` 或 `--skip` 而略過的檢查
- `findings`：具有 `checkId`、`severity`、`message`，以及選用 `path`、`line`、`column`、`ocPath` 和 `fixHint` 的結構化診斷

結束代碼：

- `0`：沒有達到或高於所選門檻的發現項目
- `1`：一個或多個發現項目達到所選門檻
- `2`：在可輸出 lint 發現項目前發生命令/執行階段失敗

使用 `--severity-min info|warning|error` 同時控制列印內容，以及造成非零 lint 結束代碼的條件。使用 `--all` 執行完整 lint 清單，包含預設自動化集合中排除、需要明確選用的較深入檢查。使用 `--only <id>` 作為狹窄的預檢閘門，並使用 `--skip <id>` 暫時排除嘈雜檢查，同時保持其餘 lint 執行有效。
`--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 等 lint 輸出選項必須與 `--lint` 搭配；一般 doctor 與修復執行會拒絕它們。

## 它的作用（摘要）

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - 對 git 安裝執行選用的預先更新（僅互動模式）。
    - UI 協定新鮮度檢查（當協定結構描述較新時重新建置 Control UI）。
    - 健康檢查 + 重啟提示。
    - Skills 狀態摘要（符合資格/缺少/遭封鎖）與外掛狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值的設定正規化。
    - 將 Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 針對舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode 提供者覆寫警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - 舊版 OpenAI Codex 提供者/設定檔遷移（`openai-codex` → `openai`）與過時 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 先決條件檢查。
    - 當 `plugins.allow` 具限制性，但工具政策仍要求萬用字元或外掛擁有的工具時，發出外掛/工具允許清單警告。
    - 舊版磁碟上狀態遷移（工作階段/代理目錄/WhatsApp 驗證）。
    - 舊版外掛 manifest 合約鍵遷移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 舊版排程儲存區遷移（`jobId`、`schedule.cron`、頂層 delivery/payload 欄位、payload `provider`、`notify: true` 網路鉤子後援工作）。
    - 舊版整個代理執行階段政策清理；提供者/模型執行階段政策是有效的路由選擇器。
    - 啟用外掛時清理過時外掛設定；當 `plugins.enabled=false` 時，過時外掛參照會被視為惰性隔離設定並保留。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 工作階段鎖定檔檢查與過時鎖定清理。
    - 修復受影響 2026.4.24 建置建立的重複提示重寫分支工作階段逐字稿。
    - 卡住的子代理重啟復原 tombstone 偵測，並支援 `--fix` 清除過時的已中止復原旗標，避免啟動時持續將子項視為重啟中止。
    - 狀態完整性與權限檢查（工作階段、逐字稿、狀態目錄）。
    - 本機執行時檢查設定檔權限（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期、可重新整理即將到期的 token，並回報驗證設定檔冷卻/停用狀態。

  </Accordion>
  <Accordion title="閘道、服務與 supervisor">
    - 啟用沙箱時修復沙箱映像。
    - 舊版服務遷移與額外閘道偵測。
    - Matrix 頻道舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - 閘道執行階段檢查（服務已安裝但未執行；快取的 launchd 標籤）。
    - 頻道狀態警告（從執行中的閘道探測）。
    - 頻道特定權限檢查位於 `openclaw channels capabilities` 下；例如，Discord 語音頻道權限會使用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核。
    - 對本機終端介面用戶端仍在執行時降級的閘道事件迴圈健康狀態進行 WhatsApp 回應性檢查；`--fix` 只會停止已驗證的本機終端介面用戶端。
    - 針對主要模型、後援、圖片/影片生成模型、心跳偵測/子代理/壓縮覆寫、hook、頻道模型覆寫，以及工作階段路由固定中的舊版 `openai-codex/*` 模型參照進行 Codex 路由修復；`--fix` 會將它們重寫為 `openai/*`、將 `openai-codex:*` 驗證設定檔/順序遷移至 `openai:*`、移除過時的工作階段/整個代理執行階段固定，並讓標準 OpenAI 代理參照保留在預設 Codex harness 上。
    - supervisor 設定稽核（launchd/systemd/schtasks）與選用修復。
    - 清理安裝或更新期間擷取 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的閘道服務內嵌 proxy 環境。
    - 閘道執行階段最佳實務檢查（節點 vs Bun、版本管理器路徑）。
    - 閘道連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 對開放 DM 政策發出安全性警告。
    - 本機 token 模式的閘道驗證檢查（沒有 token 來源時提供 token 生成；不會覆寫 token SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對要求、待處理的角色/範圍升級、過時的本機裝置 token 快取漂移，以及已配對記錄驗證漂移）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區 bootstrap 檔案大小檢查（內容檔案截斷/接近限制警告）。
    - 預設代理的 Skills 就緒狀態檢查；回報缺少 bin、env、config 或 OS 需求的已允許 skill，且 `--fix` 可在 `skills.entries` 中停用無法使用的 skill。
    - Shell 補全狀態檢查與自動安裝/升級。
    - 記憶搜尋 embedding 提供者就緒狀態檢查（本機模型、遠端 API 金鑰或 QMD 二進位檔）。
    - 原始碼安裝檢查（pnpm 工作區不符、缺少 UI 資產、缺少 tsx 二進位檔）。
    - 寫入更新後的設定 + 精靈 metadata。

  </Accordion>
</AccordionGroup>

## Dreams UI 回填與重設

Control UI Dreams 場景包含針對 grounded dreaming 工作流程的 **回填**、**重設** 和 **清除 Grounded** 動作。這些動作使用閘道 doctor 風格的 RPC 方法，但它們**不是** `openclaw doctor` 命令列介面修復/遷移的一部分。

它們的作用：

- **回填** 會掃描作用中工作區內的歷史 `memory/YYYY-MM-DD.md` 檔案、執行 grounded REM 日誌 pass，並將可還原的回填項目寫入 `DREAMS.md`。
- **重設** 只會從 `DREAMS.md` 移除那些已標記的回填日誌項目。
- **清除 Grounded** 只會移除來自歷史重放、且尚未累積即時 recall 或每日支援的暫存 grounded-only 短期項目。

它們本身**不會**做的事：

- 它們不會編輯 `MEMORY.md`
- 它們不會執行完整 doctor 遷移
- 除非你明確先執行暫存命令列介面路徑，否則它們不會自動將 grounded 候選項目暫存到即時短期提升儲存區

如果你想讓 grounded 歷史重放影響一般深度提升 lane，請改用命令列介面流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded 耐久候選項目暫存到短期夢境整理儲存區，同時讓 `DREAMS.md` 作為審查介面。

## 詳細行為與理由

<AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout 且 doctor 正以互動方式執行，它會在執行 doctor 前提供更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    如果設定包含舊版值形狀（例如沒有頻道特定覆寫的 `messages.ackReaction`），doctor 會將它們正規化為目前結構描述。

    這包含舊版 Talk 扁平欄位。目前公開 Talk 語音設定是 `talk.provider` + `talk.providers.<provider>`，即時語音設定是 `talk.realtime.*`。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到提供者對應，並將舊版頂層即時選擇器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重寫到 `talk.realtime`。

    Doctor 也會在 `plugins.allow` 非空，且工具政策使用萬用字元或外掛擁有的工具項目時發出警告。`tools.allow: ["*"]` 只會比對實際載入的外掛所提供的工具；它不會繞過專屬外掛允許清單。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含已棄用的鍵時，其他命令會拒絕執行，並要求你執行 `openclaw doctor`。

    Doctor 會：

    - 說明找到哪些舊版鍵。
    - 顯示它套用的遷移。
    - 使用更新後的結構描述重寫 `~/.openclaw/openclaw.json`。

    閘道啟動會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；它不會在啟動時重寫 `openclaw.json`。排程作業儲存區遷移也由 `openclaw doctor --fix` 處理。

    目前的遷移：

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 移除已退役的 `channels.webchat` 和 `gateway.webchat`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 頂層 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 舊版頂層即時 Talk 選擇器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 和 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 和 `messages.tts.providers.microsoft`
    - TTS 說話者選擇欄位（`voice`/`voiceName`/`voiceId`）→ `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 和 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 和 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 對於具名 `accounts` 但仍有殘留單一帳號頂層頻道值的頻道，將這些帳號範圍值移入該頻道所選的提升帳號（多數頻道為 `accounts.default`；Matrix 可保留現有相符的具名/預設目標）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - 移除 `agents.defaults.llm`；對較慢的提供者/模型逾時使用 `models.providers.<id>.timeoutSeconds`，並在整個執行必須持續更久時，讓 agent/執行逾時高於該值
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - 移除 `browser.relayBindHost`（舊版擴充功能中繼設定）
    - 舊版 `models.providers.*.api: "openai"` → `"openai-completions"`（閘道啟動也會略過 `api` 設為未來或未知列舉值的提供者，而不是失敗關閉）
    - 移除 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律保留 Codex 原生工作區工具為原生

    Doctor 警告也包含多帳號頻道的帳號預設指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，卻沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告後備路由可能會選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳號 ID，doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `openclaw/plugin-sdk/llm` 的內建 OpenCode 目錄。這可能會迫使模型使用錯誤的 API，或將成本歸零。Doctor 會發出警告，讓你移除覆寫並還原每個模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將其正規化為目前的主機本機 Chrome MCP 附加模型：

    - `browser.profiles.*.driver: "extension"` 會變成 `"existing-session"`
    - `browser.relayBindHost` 會被移除

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查同一台主機是否已安裝 Google Chrome，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機 Chrome MCP 仍需要：

    - 閘道/節點主機上有 Chromium-based 瀏覽器 144+
    - 瀏覽器在本機執行
    - 該瀏覽器已啟用遠端偵錯
    - 在瀏覽器中核准第一次附加同意提示

    這裡的就緒狀態只與本機附加先決條件有關。Existing-session 會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理瀏覽器或原始 CDP 設定檔。

    此檢查**不**適用於 Docker、沙箱、remote-browser 或其他無頭流程。這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先決條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以驗證本機節點/OpenSSL TLS 堆疊能否驗證憑證鏈。如果探測因憑證錯誤失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、過期憑證或自簽憑證），doctor 會列印平台特定修正指引。在使用 Homebrew 節點的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使閘道健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI 傳輸設定，這些設定可能會遮蔽新版發行版本自動使用的內建 Codex OAuth 提供者路徑。Doctor 看到這些舊傳輸設定與 Codex OAuth 同時存在時會發出警告，讓你移除或重寫過時的傳輸覆寫，並恢復內建路由/後備行為。自訂代理和僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex harness 路由使用標準 `openai/*` 模型參照；OpenAI agent 回合會透過 Codex app-server harness，而不是 OpenClaw OpenAI 提供者路徑。

    在 `--fix` / `--repair` 模式中，doctor 會重寫受影響的預設 agent 和每個 agent 參照，包括主要模型、後備、影像/影片生成模型、心跳偵測/subagent/壓縮覆寫、hooks、頻道模型覆寫，以及過時的持久化 session 路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - Codex 意圖會移至提供者/模型範圍的 `agentRuntime.id: "codex"` 項目，用於已修復的 agent 模型參照。
    - 過時的整體 agent runtime 設定和持久化 session runtime pin 會被移除，因為 runtime 選擇是提供者/模型範圍。
    - 除非已修復的舊版模型參照需要 Codex 路由來保留舊的驗證路徑，否則會保留現有提供者/模型 runtime 政策。
    - 現有模型後備清單會保留，並重寫其中的舊版項目；複製的每模型設定會從舊版鍵移至標準 `openai/*` 鍵。
    - 持久化 session `modelProvider`/`providerOverride`、`model`/`modelOverride`、後備通知和 auth-profile pin 會在所有已發現的 agent session 儲存區中修復。
    - `/codex ...` 表示「從聊天控制或綁定原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器」。

  </Accordion>
  <Accordion title="2g. Session 路由清理">
    在你將已設定模型或 runtime 從外掛擁有的路由（例如 Codex）移開後，Doctor 也會掃描已發現的 agent session 儲存區，尋找過時的自動建立路由狀態。

    `openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型 pin、runtime 模型中繼資料、已 pin 的 harness id、命令列介面 session 綁定，以及當所屬路由不再設定時的自動 auth-profile 覆寫。明確的使用者或舊版 session 模型選擇會被回報以供手動審查，並保持不變；當該路由不再是預期路由時，請使用 `/model ...`、`/new` 切換，或重設 session。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可以將較舊的磁碟配置遷移到目前結構：

    - Sessions 儲存區 + transcripts：
      - 從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：
      - 從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：
      - 從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）
      - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移是最佳努力且冪等的；當 doctor 將任何舊版資料夾留下作為備份時，會發出警告。閘道/命令列介面也會在啟動時自動遷移舊版 sessions + agent 目錄，讓歷史記錄/驗證/模型落在每個 agent 路徑中，無需手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk 提供者/提供者對應正規化現在會依結構相等性比較，因此只有鍵順序差異不再觸發重複的無操作 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版外掛資訊清單遷移">
    診斷器會掃描所有已安裝的外掛資訊清單，尋找已淘汰的頂層能力鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到後，它會提出將它們移入 `contracts` 物件，並就地重寫資訊清單檔案。此遷移具冪等性；如果 `contracts` 鍵已經有相同值，就會移除舊版鍵，而不會重複資料。
  </Accordion>
  <Accordion title="3b. 舊版排程儲存區遷移">
    診斷器也會檢查排程作業儲存區（預設為 `~/.openclaw/cron/jobs.json`，覆寫時則為 `cron.store`），尋找排程器為了相容性仍接受的舊作業形狀。

    目前的排程清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層承載欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層傳遞欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - 承載中的 `provider` 傳遞別名 → 明確的 `delivery.channel`
    - 舊版 `notify: true` 網路鉤子後援作業 → 在已設定 `cron.webhook` 時，轉為明確的網路鉤子傳遞；announce 作業會保留其聊天傳遞，並取得 `delivery.completionDestination`。未設定 `cron.webhook` 時，沒有目標的作業會移除無作用的頂層 `notify` 標記（既有傳遞，包括 announce，會被保留），因為執行階段傳遞從不讀取它

    閘道也會在載入時清理格式錯誤的排程列，讓有效作業持續執行。原始格式錯誤的列會先複製到作用中儲存區旁邊的 `jobs-quarantine.json`，再從 `jobs.json` 移除；診斷器會回報已隔離的列，讓你可以手動檢閱或修復。

    閘道啟動時會正規化執行階段投影並忽略頂層 `notify` 標記，但會保留持久化的排程設定供診斷器修復。未設定 `cron.webhook` 時，診斷器會移除沒有遷移目標作業上的無作用標記（`delivery.mode` 為 none/不存在、無法使用的網路鉤子目標，或既有 announce/聊天傳遞），並保持既有傳遞不變，因此重複執行 `doctor --fix` 不會再針對同一個作業發出警告。如果已設定 `cron.webhook` 但不是有效的 HTTP(S) URL，診斷器仍會發出警告並保留該標記，讓你可以修正 URL。

    在 Linux 上，如果使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh`，診斷器也會發出警告。該主機本機指令碼不由目前的 OpenClaw 維護，且在排程無法連到 systemd 使用者匯流排時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    診斷器會掃描每個代理工作階段目錄，尋找過時的寫入鎖定檔案，也就是工作階段異常結束後留下的檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、該 PID 是否仍存活、鎖定年齡，以及是否視為過時（PID 已死亡、擁有者中繼資料格式錯誤、超過 30 分鐘，或可證明存活 PID 屬於非 OpenClaw 程序）。在 `--fix` / `--repair` 模式中，它會自動移除擁有者已死亡、孤立、已重用、格式錯誤且老舊，或非 OpenClaw 的鎖定。仍由存活 OpenClaw 程序擁有的舊鎖定會被回報但保留原位，避免診斷器中斷作用中的逐字稿寫入器。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    診斷器會掃描代理工作階段 JSONL 檔案，尋找由 2026.4.24 提示逐字稿重寫錯誤建立的重複分支形狀：一個被放棄的使用者回合，帶有 OpenClaw 內部執行階段內容，以及一個包含相同可見使用者提示的作用中同層項目。在 `--fix` / `--repair` 模式中，診斷器會將每個受影響的檔案備份到原檔旁邊，並將逐字稿重寫為作用中分支，讓閘道歷史記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是操作上的腦幹。如果它消失，你會失去工作階段、憑證、記錄與設定（除非你在其他地方有備份）。

    診斷器會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提出修復權限（偵測到擁有者/群組不符時會輸出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 底下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 與鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD 或 eMMC 支援的隨機 I/O 在工作階段與憑證寫入下可能較慢且磨耗較快。
    - **Linux 易失性狀態目錄**：當狀態解析到 `tmpfs` 或 `ramfs` 時發出警告，因為工作階段、憑證、設定，以及帶有 WAL/日誌 sidecar 的 SQLite 狀態會在重新開機時消失。Docker `overlay` 掛載不會被標記，這是有意為之，因為只要容器仍存在，其可寫層會跨主機重新開機持續存在。
    - **工作階段目錄遺失**：`sessions/` 和工作階段儲存目錄是持久化歷史記錄並避免 `ENOENT` 當機所必需。
    - **逐字稿不符**：當近期工作階段項目缺少逐字稿檔案時發出警告。
    - **主要工作階段「1 行 JSONL」**：在主要逐字稿只有一行時標記（歷史記錄未累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於不同家目錄，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能在安裝之間分裂）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，診斷器會提醒你在遠端主機上執行它（狀態位於該處）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/所有人讀取，會發出警告並提出收緊為 `600`。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    診斷器會檢查驗證儲存區中的 OAuth 設定檔，在權杖即將到期/已到期時發出警告，並在安全時重新整理它們。如果 Anthropic OAuth/權杖設定檔已過期，它會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或供應商要求你重新登入），診斷器會回報需要重新驗證，並列印要執行的精確 `openclaw models auth login --provider ...` 命令。

    診斷器也會回報因下列原因暫時無法使用的驗證設定檔：

    - 短暫冷卻（速率限制/逾時/驗證失敗）
    - 較長停用（計費/額度失敗）

    權杖位於 macOS Keychain 的舊版 Codex OAuth 設定檔（檔案型 sidecar 版面之前的舊式上線流程）只能由診斷器修復。請從互動式終端機執行一次 `openclaw doctor --fix`，將 Keychain 支援的舊版權杖就地遷移到 `auth-profiles.json`；之後，嵌入式回合（Telegram、排程、子代理派送）會將它們解析為標準 OpenAI OAuth 設定檔。

  </Accordion>
  <Accordion title="6. 鉤子模型驗證">
    如果已設定 `hooks.gmail.model`，診斷器會根據目錄與允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙盒映像修復">
    啟用沙盒時，診斷器會檢查 Docker 映像，並在目前映像遺失時提出建置或切換到舊版名稱。
  </Accordion>
  <Accordion title="7b. 外掛安裝清理">
    診斷器會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中，移除舊版 OpenClaw 產生的外掛相依性暫存狀態。這涵蓋過時的產生相依性根目錄、舊安裝階段目錄、早期內建外掛相依性修復程式碼留下的套件本機殘留物，以及可能遮蔽目前內建資訊清單的孤立或復原受管理 npm 內建 `@openclaw/*` 外掛副本。診斷器也會將主機 `openclaw` 套件重新連結到宣告 `peerDependencies.openclaw` 的受管理 npm 外掛中，讓像 `openclaw/plugin-sdk/*` 這類套件本機執行階段匯入在更新或 npm 修復後仍可解析。

    當設定參照可下載外掛但本機外掛登錄找不到它們時，診斷器也可以重新安裝遺失的可下載外掛。範例包括具體的 `plugins.entries`、已設定的頻道/供應商/搜尋設定，以及已設定的代理執行階段。套件更新期間，診斷器會在核心套件被替換時避免執行套件管理器外掛修復；如果更新後仍有已設定外掛需要復原，請再次執行 `openclaw doctor --fix`。閘道啟動與設定重新載入不會執行套件管理器；外掛安裝仍是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. 閘道服務遷移與清理提示">
    診斷器會偵測舊版閘道服務（launchd/systemd/schtasks），並提出移除它們，再使用目前的閘道連接埠安裝 OpenClaw 服務。它也可以掃描額外的類閘道服務並列印清理提示。以設定檔命名的 OpenClaw 閘道服務會被視為一等公民，不會被標記為「額外」。

    在 Linux 上，如果使用者層級的閘道服務遺失，但存在系統層級的 OpenClaw 閘道服務，診斷器不會自動安裝第二個使用者層級服務。請用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項，或在系統 supervisor 擁有閘道生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動 Matrix 遷移">
    當 Matrix 頻道帳號有待處理或可執行的舊版狀態遷移時，診斷器（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。兩個步驟都不是致命錯誤；錯誤會被記錄，而啟動會繼續。在唯讀模式（不帶 `--fix` 的 `openclaw doctor`）中，此檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    診斷器現在會在一般健康檢查流程中檢查裝置配對狀態。

    它會回報：

    - 待處理的首次配對要求
    - 已配對裝置的待處理角色升級
    - 已配對裝置的待處理範圍升級
    - 裝置 id 仍相符但裝置身分不再符合已核准記錄時的公開金鑰不符修復
    - 已配對記錄缺少已核准角色的作用中權杖
    - 已配對權杖的範圍漂移到已核准配對基準之外
    - 目前機器的本機快取裝置權杖項目早於閘道端權杖輪替，或帶有過時範圍中繼資料

    診斷器不會自動核准配對要求，也不會自動輪替裝置權杖。它會改為列印精確的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理要求
    - 使用 `openclaw devices approve <requestId>` 核准精確要求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過時記錄

    這補上了常見的「已經配對但仍收到需要配對」漏洞：doctor 現在會區分首次配對、待處理的角色/範圍升級，以及過期權杖/裝置身分漂移。

  </Accordion>
  <Accordion title="9. 安全警告">
    當某個提供者對 DM 開放但沒有 allowlist，或某項政策以危險方式設定時，doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 lingering，讓閘道在登出後仍保持運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（skills、plugins 和 TaskFlows）">
    Doctor 會列印預設代理程式的工作區狀態摘要：

    - **Skills 狀態**：統計符合資格、缺少需求，以及被 allowlist 封鎖的 skills。
    - **外掛狀態**：統計已啟用/已停用/發生錯誤的外掛；列出任何錯誤的外掛 ID；回報套件組合外掛能力。
    - **外掛相容性警告**：標示與目前執行階段有相容性問題的外掛。
    - **外掛診斷**：顯示外掛登錄檔在載入期間發出的任何警告或錯誤。
    - **TaskFlow 復原**：顯示需要手動檢查或取消的可疑受管理 TaskFlows。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過已設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元占總預算的比例。當檔案被截斷或接近限制時，doctor 會列印調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11d. 過期頻道外掛清理">
    當 `openclaw doctor --fix` 移除缺少的頻道外掛時，也會移除參照該外掛的懸空頻道範圍設定：`channels.<id>` 項目、命名該頻道的心跳偵測目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可避免頻道執行階段已不存在，但設定仍要求閘道繫結到它而造成的閘道啟動迴圈。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 tab 補全：

    - 如果 shell 設定檔使用緩慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將其升級為更快的快取檔案變體。
    - 如果設定檔已設定補全但缺少快取檔案，doctor 會自動重新產生快取。
    - 如果完全沒有設定補全，doctor 會提示安裝（僅限互動模式；搭配 `--non-interactive` 時會略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="12. 閘道驗證檢查（本機權杖）">
    Doctor 會檢查本機閘道權杖驗證是否就緒。

    - 如果權杖模式需要權杖但不存在權杖來源，doctor 會提議產生一個。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會警告，且不會用明文覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定權杖 SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. 感知唯讀 SecretRef 的修復">
    某些修復流程需要檢查已設定的憑證，而不削弱執行階段快速失敗行為。

    - `openclaw doctor --fix` 現在會使用與 status 系列命令相同的唯讀 SecretRef 摘要模型，進行目標式設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 Bot 憑證。
    - 如果 Telegram Bot 權杖透過 SecretRef 設定，但在目前命令路徑中無法使用，doctor 會回報該憑證已設定但不可用，並略過自動解析，而不是當機或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. 閘道健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在閘道看起來不健康時提議重新啟動閘道。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    Doctor 會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理程式就緒。行為取決於已設定的後端和提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。如果不可用，會列印修復指引，包括 npm 套件和手動二進位檔路徑選項。
    - **明確本機提供者**：檢查本機模型檔案或可辨識的遠端/可下載模型 URL。如果缺少，會建議切換到遠端提供者。
    - **明確遠端提供者**（`openai`、`voyage` 等）：確認環境或驗證儲存區中是否存在 API 金鑰。若缺少，會列印可執行的修復提示。
    - **舊版自動提供者**：將 `memorySearch.provider: "auto"` 視為 OpenAI，檢查 OpenAI 就緒狀態，且 `doctor --fix` 會將其改寫為 `provider: "openai"`。

    當可用快取的閘道探測結果時（檢查當下閘道健康），doctor 會將其結果與命令列介面可見設定交叉參照，並註記任何差異。Doctor 不會在預設路徑上啟動新的嵌入 ping；當你想要即時提供者檢查時，請使用深度記憶狀態命令。

    使用 `openclaw memory status --deep` 可在執行階段驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 頻道狀態警告">
    如果閘道健康，doctor 會執行頻道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. Supervisor 設定稽核 + 修復">
    Doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks），確認是否缺少或使用過期的預設值（例如 systemd network-online 相依性和重新啟動延遲）。當發現不一致時，它會建議更新，並可將服務檔案/工作改寫為目前預設值。

    注意：

    - `openclaw doctor` 會在改寫 supervisor 設定前提示。
    - `openclaw doctor --yes` 會接受預設修復提示。
    - `openclaw doctor --fix` 會在不提示的情況下套用建議修復（`--repair` 是別名）。
    - `openclaw doctor --fix --force` 會覆寫自訂 supervisor 設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對閘道服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap、supervisor 設定改寫，以及舊版服務清理，因為該生命週期由外部 supervisor 擁有。
    - 在 Linux 上，當相符的 systemd 閘道單元處於作用中時，doctor 不會改寫命令/進入點中繼資料。它也會在重複服務掃描期間忽略非作用中的非舊版額外閘道類單元，讓伴隨服務檔案不會產生清理雜訊。
    - 如果權杖驗證需要權杖且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝/修復會驗證 SecretRef，但不會將已解析的明文權杖值持久化到 supervisor 服務環境中繼資料中。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows Scheduled Task 安裝內嵌行內的受管理 `.env`/SecretRef 支援服務環境值，並改寫服務中繼資料，讓這些值從執行階段來源載入，而不是從 supervisor 定義載入。
    - Doctor 會偵測服務命令是否在 `gateway.port` 變更後仍釘選舊的 `--port`，並將服務中繼資料改寫為目前連接埠。
    - 如果權杖驗證需要權杖且已設定的權杖 SecretRef 未解析，doctor 會以可執行的指引封鎖安裝/修復路徑。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，doctor 會封鎖安裝/修復，直到明確設定模式。
    - 對於 Linux 使用者 systemd 單元，doctor 權杖漂移檢查現在會在比較服務驗證中繼資料時，同時納入 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後由較新版本寫入時，doctor 服務修復會拒絕改寫、停止或重新啟動來自較舊 OpenClaw 二進位檔的閘道服務。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整改寫。

  </Accordion>
  <Accordion title="16. 閘道執行階段 + 連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查閘道連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（閘道已在執行、SSH tunnel）。
  </Accordion>
  <Accordion title="17. 閘道執行階段最佳做法">
    當閘道服務在 Bun 或版本管理的 節點 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 會發出警告。WhatsApp + Telegram 頻道需要 節點，而版本管理器路徑在升級後可能會中斷，因為服務不會載入你的 shell 初始化設定。Doctor 會在可用時提議遷移到系統 節點 安裝（Homebrew/apt/choco）。

    新安裝或已修復的 macOS LaunchAgents 會使用標準系統 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Homebrew 管理的系統二進位檔仍可使用，而 Volta、asdf、fnm、pnpm 和其他版本管理器目錄不會改變 節點 子行程解析的目標。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者二進位檔目錄，但猜測的版本管理器備援目錄只有在這些目錄存在於磁碟上時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會持久化任何設定變更，並加蓋精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶系統）">
    Doctor 會在缺少工作區記憶系統時建議設定，並在工作區尚未納入 git 管理時列印備份提示。

    如需工作區結構和 git 備份（建議使用私人 GitHub 或 GitLab）的完整指南，請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相關

- [閘道 runbook](/zh-TW/gateway)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
