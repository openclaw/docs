---
read_when:
    - 新增或修改 doctor 遷移
    - 引入破壞性的設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-07-05T11:17:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f949b29dcede364149aead58b4117f1e0f16461de155061c0697abd823b95733
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

    不提示即接受預設值（適用時包括重新啟動/服務/沙箱修復步驟）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    不提示即套用建議修復（`--repair` 是別名）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    為 CI 或預檢自動化執行結構化健康檢查。唯讀：不會
    提示、修復、遷移、重新啟動或寫入狀態。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    也套用積極修復（覆寫自訂監督器設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不提示執行，只套用安全遷移（設定正規化 +
    磁碟上狀態搬移）。略過需要人工確認的重新啟動/服務/沙箱動作。
    偵測到舊版狀態遷移時，仍會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外的閘道安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

若要在寫入前檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 唯讀 lint 模式

`openclaw doctor --lint` 是 `openclaw doctor --fix` 適合自動化的同層命令。兩者執行相同的健康檢查；只有處理姿態不同：

| 模式                     | 提示      | 寫入設定/狀態           | 輸出                 | 用途                            |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是        | 否                      | 友善的健康報告 | 人工檢查狀態         |
| `openclaw doctor --fix`  | 有時      | 是，依修復政策 | 友善的修復記錄    | 套用已核准的修復       |
| `openclaw doctor --lint` | 否        | 否                      | 結構化發現    | CI、預檢和審查閘門 |

健康檢查可以提供選用的 `repair()` 實作；`doctor --fix` 會在存在時套用它，否則退回舊版 doctor 修復流程。這個契約將 `detect()`（回報發現）與 `repair()`（回報變更/diff/副作用）分開，為未來的 `doctor --fix --dry-run` 保留路徑，而不會把 lint 檢查變成變更規劃器。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 輸出欄位：

- `ok`：是否有任何發現達到所選嚴重性門檻
- `checksRun` / `checksSkipped`：計數（因設定檔、`--only` 或 `--skip` 略過）
- `findings`：結構化診斷，包含 `checkId`、`severity`、`message`，以及選用的 `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint`

結束碼：

| 代碼 | 含義                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | 沒有達到或高於所選門檻的發現           |
| `1`  | 一個或多個發現達到所選門檻          |
| `2`  | 在發出發現前發生命令/執行階段失敗 |

旗標：

- `--severity-min info|warning|error`（預設 `warning`）：控制列印內容，以及哪些項目會導致非零結束碼。
- `--all`：執行每個已註冊的檢查，包括從預設自動化集合中排除的選用檢查。
- `--only <id>`（可重複）：只執行具名檢查 ID；未知 ID 會回報為錯誤發現。
- `--skip <id>`（可重複）：排除某項檢查，同時保持其餘執行有效。
- `--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 需要 `--lint`；一般 `openclaw doctor` 和 `--fix` 執行會拒絕它們。

## 功能摘要

<AccordionGroup>
  <Accordion title="健康狀態、使用者介面與更新">
    - git 安裝的選用預檢更新（僅互動式）。
    - 使用者介面協定新鮮度檢查（當協定 schema 較新時重建 Control UI）。
    - 健康檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格/缺少/受阻）與外掛狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值形狀的設定正規化。
    - 將 Talk 設定從舊版扁平 `talk.*` 欄位遷移到 `talk.provider` + `talk.providers.<provider>`。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode provider 覆寫警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - 舊版 OpenAI Codex provider/profile 遷移（`openai-codex` → `openai`）以及過時 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth profiles 的 OAuth TLS 先決條件檢查。
    - 當 `plugins.allow` 具限制性，但工具政策仍要求萬用字元或外掛擁有工具時的外掛/工具允許清單警告。
    - 舊版磁碟上狀態遷移（工作階段/agent 目錄/WhatsApp 驗證）。
    - 舊版外掛 manifest 契約鍵遷移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 舊版排程儲存區遷移（`jobId`、`schedule.cron`、頂層 delivery/payload 欄位、payload `provider`、`notify: true` 網路鉤子後援工作）。
    - Codex 命令列介面執行階段 pin 修復（`agentRuntime.id: "codex-cli"` → `"codex"`），涵蓋 `agents.defaults`、`agents.list[]` 和 `models.providers.*`（包括個別模型項目）。
    - 啟用外掛時清理過時外掛設定；當 `plugins.enabled=false` 時，過時外掛參照會保留為惰性隔離設定。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 工作階段鎖定檔檢查與過時鎖定清理。
    - 修復受影響的 2026.4.24 組建建立的重複 prompt-rewrite 分支工作階段 transcript。
    - 卡住的 subagent 重新啟動復原 tombstone 偵測，支援以 `--fix` 清除過時的已中止復原旗標，讓啟動不會持續將 child 視為 restart-aborted。
    - 狀態完整性與權限檢查（工作階段、transcripts、state 目錄）。
    - 本機執行時的設定檔權限檢查（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期、可重新整理即將到期的 token，並回報 auth-profile 冷卻/停用狀態。

  </Accordion>
  <Accordion title="閘道、服務與監督器">
    - 啟用沙箱時修復沙箱映像。
    - 舊版服務遷移與額外閘道偵測。
    - Matrix channel 舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - 閘道執行階段檢查（服務已安裝但未執行；快取的 launchd 標籤）。
    - Channel 狀態警告（從執行中的閘道探測）。
    - Channel 專屬權限檢查位於 `openclaw channels capabilities` 下；例如，Discord 語音 channel 權限會透過 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核。
    - 對本機終端介面用戶端仍在執行時，因閘道 event-loop 健康狀態降級造成的 WhatsApp 回應性檢查；`--fix` 只會停止已驗證的本機終端介面用戶端。
    - 修復舊版 `openai-codex/*` model refs 的 Codex 路由，涵蓋 primary models、fallbacks、image/video generation models、心跳偵測/subagent/壓縮 overrides、hooks、channel model overrides 和 session route pins；`--fix` 會將它們改寫為 `openai/*`、將 `openai-codex:*` auth profiles/order 遷移到 `openai:*`、移除過時 session/whole-agent runtime pins，並將 canonical OpenAI agent refs 留在預設 Codex harness。
    - 監督器設定稽核（launchd/systemd/schtasks），可選擇修復。
    - 清理安裝或更新期間擷取 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值的閘道服務嵌入式 proxy 環境。
    - 閘道執行階段最佳實務檢查（節點 vs Bun、version-manager 路徑）。
    - 閘道連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放 DM 政策的安全性警告。
    - local token mode 的閘道驗證檢查（沒有 token source 時提供 token 產生；不會覆寫 token SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對要求、待處理的 role/scope 升級、過時的 local device-token cache 漂移，以及 paired-record auth 漂移）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區 bootstrap 檔案大小檢查（context files 的截斷/接近限制警告）。
    - 預設 agent 的 Skills 就緒狀態檢查；回報缺少 bins、env、config 或 OS requirements 的 allowed skills，且 `--fix` 可在 `skills.entries` 中停用不可用的 skills。
    - Shell completion 狀態檢查與自動安裝/升級。
    - 記憶搜尋 embedding provider 就緒狀態檢查（本機模型、遠端 API key 或 QMD binary）。
    - Source install 檢查（pnpm workspace 不符、缺少 UI assets、缺少 tsx binary）。
    - 寫入更新後的設定 + 精靈 metadata。

  </Accordion>
</AccordionGroup>

## 夢境使用者介面回填與重設

Control UI 夢境場景包含針對 grounded 夢境整理工作流程的 **Backfill**、**Reset** 和 **Clear Grounded** 動作。這些動作使用閘道 doctor-style RPC 方法，但**不是** `openclaw doctor` 命令列介面修復/遷移的一部分。

| 動作         | 功能                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | 掃描作用中工作區的歷史 `memory/YYYY-MM-DD.md` 檔案，執行 grounded REM diary pass，並將可逆的 backfill entries 寫入 `DREAMS.md`。 |
| Reset          | 只從 `DREAMS.md` 移除已標記的 backfill diary entries。                                                                                                  |
| Clear Grounded | 只移除歷史 replay 中尚未累積 live recall 或 daily support 的 staged grounded-only short-term entries。                           |

這些動作都不會編輯 `MEMORY.md`、執行完整 doctor 遷移，或自行將 grounded candidates 暫存到 live short-term promotion store。若要將 grounded historical replay 饋入一般 deep promotion lane，請改用命令列介面流程：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

這會將 grounded durable candidates 暫存到 short-term dreaming store，同時 `DREAMS.md` 保持為 review surface。

## 詳細行為與設計理由

  <AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git checkout，且 doctor 以互動方式執行，則在執行 doctor 前會提供更新（fetch/rebase/build）選項。
  </Accordion>
  <Accordion title="1. 設定正規化">
    Doctor 會將舊版值形狀正規化為目前的結構描述。目前的 Talk 語音設定是 `talk.provider` + `talk.providers.<provider>`，即時語音設定位於 `talk.realtime.*` 下。Doctor 會將舊的 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形狀重寫到提供者對應表，並將舊版頂層即時選擇器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重寫到 `talk.realtime`。

    當 `plugins.allow` 非空，且工具政策使用萬用字元或外掛擁有的工具項目時，Doctor 也會發出警告。`tools.allow: ["*"]` 只會符合實際載入的外掛中的工具；它不會繞過專屬外掛允許清單。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含具有啟用中遷移的已淘汰鍵時，其他命令會拒絕執行，並要求你執行 `openclaw doctor`。Doctor 會說明找到哪些舊版鍵、顯示套用的遷移，並以更新後的結構描述重寫 `~/.openclaw/openclaw.json`。閘道啟動會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；它不會在啟動時重寫 `openclaw.json`。排程作業儲存遷移也由 `openclaw doctor --fix` 處理。

    <Note>
      Doctor 只會在鍵退役後約兩個月內保留自動遷移。較舊的舊版鍵（例如原始的 `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、`routing.transcribeAudio`、頂層 `agent.*`，或多代理前設定形狀中的頂層 `identity`）已不再有遷移路徑；使用這些鍵的設定現在會驗證失敗，而不是被重寫。請先依照目前的設定參考手動修正這些鍵，Doctor 才能繼續。
    </Note>

    啟用中的遷移：

    | 舊版鍵                                                                                    | 目前鍵                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | 已移除（WebChat 已退役）                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`（以及每帳號）      | `...threadBindings.idleHours`                                               |
    | 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | 舊版頂層即時 Talk 選擇器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`） | `talk.realtime`                                                              |
    | `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS 說話者欄位 `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`（Discord 以外的所有頻道）                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`（所有頻道，包括 Discord）                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（閘道啟動也會略過其 `api` 是未來/未知列舉值的提供者，而不是封閉失敗） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 已移除（舊版 Chrome 擴充功能中繼設定）                             |
    | `mcp.servers.*.type`（命令列介面原生別名）                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 已移除（Codex app-server 一律將 Codex 原生工作區工具保留為原生） |
    | `commands.modelsWrite`                                                                           | 已移除（`/models add` 已淘汰）                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | 已移除（精確的 `NO_REPLY` 不再被重寫為可見的備援文字）  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 已移除（OpenClaw 擁有所產生的系統提示）                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 已移除（針對慢速模型/提供者逾時使用 `models.providers.<id>.timeoutSeconds`，並保持低於代理/執行逾時上限） |
    | 頂層 `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任何層級）                                                            | 已移除（記憶索引存在於各代理資料庫中）                       |
    | 頂層 `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` 政策 ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | 已移除（已淘汰）                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      上方的 `plugins.entries.voice-call.config.*` 列由 Voice Call 外掛本身在每次設定載入時正規化，而不是由 `openclaw doctor` 正規化。該外掛也會記錄一則啟動警告，指向 `openclaw doctor --fix`，但 Doctor 目前不會為這些鍵重寫 `openclaw.json`；實際在執行時套用變更的是外掛自己的正規化。
    </Note>

    多帳號頻道的帳號預設指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，但沒有 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 會警告備援路由可能選到非預期帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知帳號 ID，Doctor 會警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `openclaw/plugin-sdk/llm` 的內建 OpenCode 目錄。這可能會迫使模型使用錯誤的 API，或將成本歸零。Doctor 會發出警告，讓你可以移除該覆寫並還原每模型 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，Doctor 會將其正規化為目前的主機本機 Chrome MCP 附加模型（`browser.profiles.*.driver: "extension"` → `"existing-session"`；移除 `browser.relayBindHost`）。

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機 Chrome MCP 路徑：

    - 檢查同一主機上是否已安裝 Google Chrome，以供預設自動連線設定檔使用
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面中啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端的設定。主機本機 Chrome MCP 仍需要在閘道/節點主機上本機執行 Chromium 系瀏覽器 144+，並啟用遠端偵錯，且已在瀏覽器中核准第一次附加同意提示。

    這裡的就緒狀態只涵蓋本機附加前置條件。既有工作階段會保留目前的 Chrome MCP 路由限制；像 `responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理的瀏覽器或原始 CDP 設定檔。此檢查不適用於 Docker、沙盒、遠端瀏覽器或其他 headless 流程，這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前置條件">
    設定 OpenAI Codex OAuth 設定檔時，doctor 會探測 OpenAI 授權端點，以確認本機 Node/OpenSSL TLS 堆疊可以驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），doctor 會列印平台專屬的修正指引。在使用 Homebrew 節點的 macOS 上，修正通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使閘道健康，探測也會執行。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下加入舊版 OpenAI 傳輸設定，它們可能會遮蔽新版發行版會自動使用的內建 Codex OAuth 提供者路徑。Doctor 會在看到這些舊傳輸設定與 Codex OAuth 同時存在時發出警告，讓你可以移除或重寫過時的傳輸覆寫，並取回內建的路由/後援行為。自訂代理和僅標頭覆寫仍受支援，且不會觸發此警告。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex harness 路由使用標準 `openai/*` 模型參照；OpenAI agent 回合會透過 Codex app-server harness，而不是 OpenClaw OpenAI 提供者路徑。

    在 `--fix` / `--repair` 模式中，doctor 會重寫受影響的預設 agent 與個別 agent 參照，包括主要模型、後援、影像/影片生成模型、心跳偵測/subagent/壓縮覆寫、hooks、頻道模型覆寫，以及過時的持久化工作階段路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - Codex 意圖會移至提供者/模型範圍的 `agentRuntime.id: "codex"` 項目，用於修復後的 agent 模型參照。
    - 過時的整個 agent runtime 設定和持久化工作階段 runtime pin 會被移除，因為 runtime 選擇是提供者/模型範圍。
    - 既有提供者/模型 runtime 政策會被保留，除非修復後的舊版模型參照需要 Codex 路由才能保留舊的驗證路徑。
    - 既有模型後援清單會被保留，並重寫其中的舊版項目；複製的個別模型設定會從舊版鍵移至標準 `openai/*` 鍵。
    - 持久化工作階段的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、後援通知和 auth-profile pin，會在所有已發現的 agent 工作階段儲存區中修復。
    - Doctor 會另外修復過時的 `agentRuntime.id: "codex-cli"` pin（不同的舊版 runtime id），在 `agents.defaults`、`agents.list[]` 和 `models.providers.*` 模型項目中改為 `"codex"`。
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 配接器」。

  </Accordion>
  <Accordion title="2g. 工作階段路由清理">
    在你將已設定模型或 runtime 從 Codex 這類外掛擁有的路由移走後，Doctor 也會掃描已發現的 agent 工作階段儲存區，找出過時的自動建立路由狀態。

    當擁有路由不再設定時，`openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型 pin、runtime 模型中繼資料、pinned harness ids、命令列介面工作階段繫結，以及自動 auth-profile 覆寫。明確的使用者或舊版工作階段模型選擇會回報供手動檢閱並保持不變；當該路由不再預期使用時，請使用 `/model ...`、`/new` 切換，或重設工作階段。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可以將較舊的磁碟上配置遷移到目前結構：

    - 工作階段儲存區 + transcripts：從 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
    - Agent 目錄：從 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳戶 id：`default`）

    這些遷移是盡力而為且具冪等性；當 doctor 將任何舊版資料夾留下作為備份時，會發出警告。閘道/命令列介面也會在啟動時自動遷移舊版工作階段 + agent 目錄，讓歷史記錄/驗證/模型落在個別 agent 路徑中，而不需要手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk 提供者/provider-map 正規化會依結構相等性比較，因此只有鍵順序差異的 diff 不再觸發重複的無效 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版外掛 manifest 遷移">
    Doctor 會掃描所有已安裝外掛 manifest，尋找已棄用的頂層 capability 鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將它們移入 `contracts` 物件，並就地重寫 manifest 檔案。此遷移具冪等性；如果 `contracts` 已有相同值，舊版鍵會被移除且不會複製資料。
  </Accordion>
  <Accordion title="3b. 舊版排程儲存區遷移">
    Doctor 也會檢查排程工作儲存區（預設為 `~/.openclaw/cron/jobs.json`，或在覆寫時使用 `cron.store`），找出排程器仍因相容性而接受的舊工作形狀。

    目前的排程清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層 payload 欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層 delivery 欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload `provider` 傳遞別名 → 明確的 `delivery.channel`
    - 舊版 `notify: true` 網路鉤子後援工作 → 設定 `cron.webhook` 時使用其中的明確網路鉤子傳遞；announce 工作會保留其聊天傳遞，並取得 `delivery.completionDestination`。當未設定 `cron.webhook` 時，對於沒有目標的工作，會移除不作用的頂層 `notify` 標記（保留既有傳遞，包括 announce），因為 runtime 傳遞從不讀取它。

    閘道也會在載入時清理格式錯誤的排程列，讓有效工作繼續執行。原始格式錯誤列會在從 `jobs.json` 移除前，複製到作用中儲存區旁的 `jobs-quarantine.json`；doctor 會回報隔離的列，讓你可以手動檢閱或修復。

    閘道啟動會正規化 runtime 投影並忽略頂層 `notify` 標記，但會留下持久化排程設定供 doctor 修復。當未設定 `cron.webhook` 時，doctor 會移除沒有遷移目標的工作中不作用的標記（`delivery.mode` none/不存在、無法使用的網路鉤子目標，或既有 announce/chat 傳遞），並保留既有傳遞不變，因此重複執行 `doctor --fix` 不會再對同一工作重複警告。如果已設定 `cron.webhook` 但不是有效的 HTTP(S) URL，doctor 仍會警告並保留標記，讓你可以修正 URL。

    在 Linux 上，當使用者的 crontab 仍呼叫舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會發出警告。這個主機本機腳本不由目前的 OpenClaw 維護，且在 cron 無法連到 systemd 使用者 bus 時，可能將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請用 `crontab -e` 移除過時的 crontab 項目；目前的健康檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個 agent 工作階段目錄，尋找工作階段異常結束時留下的過時寫入鎖定檔。對於找到的每個鎖定檔，它會回報：路徑、PID、PID 是否仍存活、鎖定存在時間，以及它是否被視為過時（死亡 PID、格式錯誤的擁有者中繼資料、超過 30 分鐘，或已證明屬於非 OpenClaw 程序的存活 PID）。在 `--fix` / `--repair` 模式中，它會自動移除死亡、孤立、重用、格式錯誤且舊的，或非 OpenClaw 擁有者的鎖定。仍由存活 OpenClaw 程序擁有的舊鎖定會被回報但保留原處，避免 doctor 中斷作用中的 transcript 寫入器。
  </Accordion>
  <Accordion title="3d. 工作階段 transcript 分支修復">
    Doctor 會掃描 agent 工作階段 JSONL 檔案，找出由 2026.4.24 prompt transcript 重寫 bug 建立的重複分支形狀：一個含 OpenClaw 內部 runtime context 的已放棄使用者回合，加上一個包含相同可見使用者提示的作用中 sibling。在 `--fix` / `--repair` 模式中，doctor 會將每個受影響檔案備份到原檔旁，並將 transcript 重寫為作用中分支，讓閘道歷史記錄和記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是營運上的中樞。如果它消失，除非你在其他地方有備份，否則會遺失工作階段、認證、記錄和設定。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性狀態遺失，提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證可寫入性；提議修復權限（並在偵測到擁有者/群組不相符時發出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析到 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下時發出警告，因為同步支援的路徑可能造成較慢的 I/O 和鎖定/同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析到 `mmcblk*` 掛載來源時發出警告，因為 SD/eMMC 支援的隨機 I/O 在工作階段和認證寫入下可能較慢且磨耗較快。
    - **Linux volatile 狀態目錄**：當狀態解析到 `tmpfs` 或 `ramfs` 時發出警告，因為工作階段、認證、設定和 SQLite 狀態（含 WAL/journal sidecars）會在重新啟動時消失。Docker `overlay` 掛載刻意不會被標記，因為只要容器保留，其可寫入層會在主機重新啟動後持續存在。
    - **工作階段目錄遺失**：`sessions/` 和工作階段儲存區目錄是持久保存歷史記錄並避免 `ENOENT` 當機所必需。
    - **Transcript 不相符**：當最近的工作階段項目缺少 transcript 檔案時發出警告。
    - **主要工作階段「1-line JSONL」**：當主要 transcript 只有一行時標記（歷史記錄未累積）。
    - **多個狀態目錄**：當多個 `~/.openclaw` 資料夾存在於不同家目錄，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷史記錄可能分散在多個安裝之間）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行它（狀態位於該處）。
    - **設定檔權限**：如果 `~/.openclaw/openclaw.json` 可由群組/所有人讀取，會發出警告並提議收緊為 `600`。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在權杖即將到期/已到期時發出警告，並可在安全時重新整理權杖。如果 Anthropic OAuth/權杖設定檔過期，它會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動式（TTY）執行時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或提供者要求你重新登入），doctor 會報告需要重新驗證，並印出要執行的精確 `openclaw models auth login --provider ...` 命令。

    Doctor 也會報告因短暫冷卻時間（速率限制/逾時/驗證失敗）或較長停用狀態（帳單/額度失敗）而暫時無法使用的驗證設定檔。

    權杖位於 macOS Keychain 的舊版 Codex OAuth 設定檔（檔案型 sidecar 版面配置之前的舊版導引流程）只會由 doctor 修復。從互動式終端執行一次 `openclaw doctor --fix`，即可將 Keychain 支援的舊版權杖內嵌遷移到 `auth-profiles.json`；之後，嵌入式回合（Telegram、排程、子代理分派）會將它們解析為標準 OpenAI OAuth 設定檔。

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果已設定 `hooks.gmail.model`，doctor 會根據型錄與允許清單驗證模型參照，並在它無法解析或不被允許時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，doctor 會檢查 Docker 映像，並在目前映像遺失時提議建置或切換到舊版名稱。
  </Accordion>
  <Accordion title="7b. 外掛安裝清理">
    Doctor 會在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式中移除舊版 OpenClaw 產生的外掛相依性暫存狀態：過期的已產生相依性根目錄、舊的 install-stage 目錄、早期 bundled-plugin 相依性修復程式碼留下的套件本機殘留物，以及孤立或復原的受管理 npm bundled `@openclaw/*` 外掛副本，這些副本可能遮蔽目前的 bundled manifest。Doctor 也會將主機 `openclaw` 套件重新連結到宣告 `peerDependencies.openclaw` 的受管理 npm 外掛中，讓套件本機執行階段匯入（例如 `openclaw/plugin-sdk/*`）在更新或 npm 修復後仍可繼續解析。

    當設定參照可下載外掛但本機外掛登錄找不到它們時，doctor 也可以重新安裝遺失的可下載外掛（實質 `plugins.entries`、已設定的通道/提供者/搜尋設定、已設定的代理執行階段）。套件更新期間，doctor 會避免在核心套件替換中執行套件管理器外掛修復；如果更新後已設定外掛仍需復原，請再次執行 `openclaw doctor --fix`。閘道啟動與設定重新載入不會執行套件管理器；外掛安裝仍是明確的 doctor/install/update 工作。

  </Accordion>
  <Accordion title="8. 閘道服務遷移與清理提示">
    Doctor 會偵測舊版閘道服務（launchd/systemd/schtasks），並提議移除它們，再使用目前的閘道連接埠安裝 OpenClaw 服務。它也可以掃描額外的類閘道服務並印出清理提示。以設定檔命名的 OpenClaw 閘道服務視為第一級成員，不會標記為「額外」。

    在 Linux 上，如果使用者層級的閘道服務遺失，但系統層級的 OpenClaw 閘道服務存在，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目，或在系統監督程式擁有閘道生命週期時設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. Startup Matrix 遷移">
    當 Matrix 通道帳戶有待處理或可操作的舊版狀態遷移時，doctor（在 `--fix` / `--repair` 模式中）會建立遷移前快照，然後執行盡力而為的遷移步驟：舊版 Matrix 狀態遷移與舊版加密狀態準備。兩個步驟都不會造成致命失敗；錯誤會記錄下來，啟動會繼續。在唯讀模式（不含 `--fix` 的 `openclaw doctor`）中，這項檢查會完全略過。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證漂移">
    Doctor 會在一般健康狀態檢查中檢查裝置配對狀態，報告：

    - 待處理的首次配對請求
    - 已配對裝置的待處理角色或範圍升級
    - 裝置 ID 仍相符但裝置身分不再符合已核准記錄的公開金鑰不符修復
    - 缺少已核准角色有效權杖的配對記錄
    - 範圍漂移到已核准配對基準之外的配對權杖
    - 目前機器上早於閘道端權杖輪替或帶有過期範圍中繼資料的本機快取裝置權杖項目

    Doctor 不會自動核准配對請求或自動輪替裝置權杖。它會印出精確的下一步：

    - 使用 `openclaw devices list` 檢查待處理請求
    - 使用 `openclaw devices approve <requestId>` 核准精確的請求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新權杖
    - 使用 `openclaw devices remove <deviceId>` 移除並重新核准過期記錄

    這會區分首次配對、待處理角色/範圍升級，以及過期權杖/裝置身分漂移，補上常見「已配對但仍要求配對」的缺口。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當提供者在沒有允許清單的情況下對 DM 開放，或策略以危險方式設定時，doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 linger，讓閘道在登出後仍保持執行。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、外掛與 TaskFlows）">
    Doctor 會列印預設代理的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少需求，以及被允許清單封鎖的 skills。
    - **外掛狀態**：計算啟用/停用/錯誤的外掛；列出任何錯誤的外掛 ID；報告 bundled 外掛功能。
    - **外掛相容性警告**：標記與目前執行階段有相容性問題的外掛。
    - **外掛診斷**：顯示外掛登錄在載入時發出的任何警告或錯誤。
    - **TaskFlow 復原**：顯示需要手動檢查或取消的可疑受管理 TaskFlows。

  </Accordion>
  <Accordion title="11b. Bootstrap 檔案大小">
    Doctor 會檢查工作區 bootstrap 檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過已設定的字元預算。它會報告每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及總注入字元占總預算的比例。當檔案遭截斷或接近限制時，doctor 會印出調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11c. Shell 補全">
    Doctor 會檢查目前 shell（zsh、bash、fish 或 PowerShell）是否已安裝 tab 補全：

    - 如果 shell 設定檔使用緩慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案變體。
    - 如果補全已在設定檔中設定但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全未設定補全，doctor 會提示安裝（僅互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="11d. 過期通道外掛清理">
    當 `openclaw doctor --fix` 移除遺失的通道外掛時，也會移除參照該外掛的懸空通道範圍設定：`channels.<id>` 項目、命名該通道的心跳偵測目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止通道執行階段已消失但設定仍要求閘道繫結到它所造成的閘道啟動迴圈。
  </Accordion>
  <Accordion title="12. 閘道驗證檢查（本機權杖）">
    Doctor 會檢查本機閘道權杖驗證就緒狀態。

    - 如果權杖模式需要權杖且不存在權杖來源，doctor 會提議產生一個。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告，且不會以純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 只會在未設定權杖 SecretRef 時強制產生。

  </Accordion>
  <Accordion title="12b. 感知 SecretRef 的唯讀修復">
    某些修復流程需要檢查已設定的認證，而不削弱執行階段快速失敗行為。

    - `openclaw doctor --fix` 使用與 status 系列命令相同的唯讀 SecretRef 摘要模型，進行目標設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會在可用時嘗試使用已設定的 Bot 認證。
    - 如果 Telegram Bot 權杖透過 SecretRef 設定，但在目前命令路徑中無法使用，doctor 會報告認證已設定但無法使用，並略過自動解析，而不是當機或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. 閘道健康檢查 + 重新啟動">
    Doctor 會執行健康檢查，並在閘道看起來不健康時提議重新啟動。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    Doctor 會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理就緒。行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。如果不可用，會印出修復指引，包括 `npm install -g @tobilu/qmd`（或 Bun 等效命令）以及手動二進位檔路徑選項。
    - **明確本機提供者**：檢查本機模型檔案或可辨識的遠端/可下載模型 URL。如果遺失，會建議切換到遠端提供者。
    - **明確遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。如果遺失，會印出可操作的修復提示。
    - **舊版自動提供者**：將 `memorySearch.provider: "auto"` 視為 OpenAI，檢查 OpenAI 就緒狀態，且 `doctor --fix` 會將其重寫為 `provider: "openai"`。

    當有快取的閘道探測結果可用時（檢查當時閘道健康），doctor 會將其結果與命令列介面可見設定交叉比對，並記錄任何差異。Doctor 不會在預設路徑上啟動新的嵌入 ping；若需要即時提供者檢查，請使用深度記憶體狀態命令。

    使用 `openclaw memory status --deep` 驗證執行階段的嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 通道狀態警告">
    如果閘道健康，doctor 會執行通道狀態探測，並回報警告與建議修復方式。
  </Accordion>
  <Accordion title="15. Supervisor 設定稽核 + 修復">
    Doctor 會檢查已安裝的 supervisor 設定（launchd/systemd/schtasks）是否有遺失或過期的預設值（例如 systemd network-online 相依性與重新啟動延遲）。當找到不相符時，它會建議更新，並可將服務檔案/工作重寫為目前預設值。

    備註:

    - `openclaw doctor` 會在重寫監督程式設定前提示。
    - `openclaw doctor --yes` 會接受預設的修復提示。
    - `openclaw doctor --fix` 會套用建議修復且不顯示提示（`--repair` 是別名）。
    - `openclaw doctor --fix --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對閘道服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序、監督程式設定重寫，以及舊版服務清理，因為該生命週期由外部監督程式負責。
    - 在 Linux 上，當相符的 systemd 閘道單元正在作用中時，doctor 不會重寫命令/進入點中繼資料。它也會在重複服務掃描期間忽略非作用中的非舊版額外閘道類似單元，因此伴隨服務檔案不會產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 服務安裝/修復會驗證 SecretRef，但不會把解析後的純文字權杖值持久化到監督程式服務環境中繼資料。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows 排程工作安裝內嵌行內的受管理 `.env`/SecretRef 支援服務環境值，並重寫服務中繼資料，讓這些值從執行階段來源載入，而不是從監督程式定義載入。
    - Doctor 會偵測服務命令在 `gateway.port` 變更後是否仍固定使用舊的 `--port`，並將服務中繼資料重寫為目前連接埠。
    - 如果權杖驗證需要權杖，且設定的權杖 SecretRef 無法解析，doctor 會封鎖安裝/修復路徑並提供可執行的指引。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，但未設定 `gateway.auth.mode`，doctor 會封鎖安裝/修復，直到明確設定模式。
    - 對於 Linux 使用者 systemd 單元，doctor 權杖漂移檢查在比較服務驗證中繼資料時，會同時包含 `Environment=` 和 `EnvironmentFile=` 來源。
    - 當設定最後是由較新版本寫入時，Doctor 服務修復會拒絕從較舊的 OpenClaw 二進位檔重寫、停止或重新啟動閘道服務。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整重寫。

  </Accordion>
  <Accordion title="16. 閘道執行階段 + 連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查閘道連接埠（預設 `18789`）上的連接埠衝突，並回報可能原因（閘道已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. 閘道執行階段最佳做法">
    當閘道服務在 Bun 或版本管理的節點路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，Doctor 會發出警告。WhatsApp 和 Telegram 頻道需要節點，而版本管理器路徑可能在升級後中斷，因為服務不會載入你的 shell 初始化設定。Doctor 會在可用時提議遷移到系統節點安裝（Homebrew/apt/choco）。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell PATH，因此 Homebrew 管理的系統二進位檔仍可用，同時 Volta、asdf、fnm、pnpm 和其他版本管理器目錄不會改變節點子程序解析的位置。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）和穩定的使用者二進位目錄，但推測的版本管理器後援目錄只有在這些目錄實際存在於磁碟上時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入 + 精靈中繼資料">
    Doctor 會持久化任何設定變更，並標記精靈中繼資料以記錄 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份 + 記憶系統）">
    Doctor 會在缺少工作區記憶系統時提出建議，並在工作區尚未置於 git 管理下時印出備份提示。

    如需工作區結構和 git 備份的完整指南（建議使用私有 GitHub 或 GitLab），請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)。

  </Accordion>
</AccordionGroup>

## 相關

- [閘道執行手冊](/zh-TW/gateway)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
