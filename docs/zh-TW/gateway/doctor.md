---
read_when:
    - 新增或修改 doctor 遷移作業
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-07-12T14:29:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復與遷移工具。它會修正過時的設定與狀態、檢查健康狀態，並提供可執行的修復步驟。

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

    不提示並接受預設值（適用時包括重新啟動、服務及沙箱修復步驟）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    不提示並套用建議的修復（`--repair` 是別名）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    執行用於 CI 或前置自動化的結構化健康檢查。唯讀：不會
    提示、修復、遷移、重新啟動或寫入狀態。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    同時套用積極修復（會覆寫自訂的監督程序設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不提示執行，僅套用安全的遷移（設定正規化 +
    磁碟上狀態移動）。略過需要人工
    確認的重新啟動、服務及沙箱動作。偵測到舊版狀態時，仍會自動執行遷移。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務中的額外閘道安裝（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

若要在寫入前檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 唯讀 lint 模式

`openclaw doctor --lint` 是
`openclaw doctor --fix` 適合自動化使用的同系工具。兩者共用相同的 Doctor 規則登錄庫，但
選取及執行規則的方式不同：

| 模式                     | 提示      | 寫入設定／狀態          | 輸出                 | 用途                            |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是        | 否                      | 易讀的健康報告         | 人工檢查狀態                    |
| `openclaw doctor --fix`  | 有時      | 是，依修復政策執行      | 易讀的修復記錄         | 套用已核准的修復                |
| `openclaw doctor --lint` | 否        | 否                      | 結構化發現             | CI、前置檢查及審查關卡          |

預設的 `doctor --lint` 會執行廣泛且安全的自動化設定檔：檢查項目為
靜態、本機執行，且適合用於 CI 或前置檢查輸出。它會略過需選擇加入的檢查，包括
建議性質、對環境敏感、依賴即時服務、帳號／工作區
盤點或歷史清理的項目。若要執行完整的已登錄 lint 稽核（包括這些選擇加入的檢查），請使用 `doctor --lint --all`；若要
執行特定檢查，請使用 `--only <id>`。

`doctor --fix` 不使用 lint 的預設設定檔，也不接受
`--all`。它會執行 Doctor 的依序修復路徑：新式健康檢查可提供
選用的 `repair()` 實作，而較舊的區域仍使用其舊版
Doctor 修復流程。部分 lint 發現刻意僅供診斷，因此某項檢查出現在 `--lint --all` 中，並不代表 `--fix` 會修改該區域。
此契約將 `detect()`（回報發現）與 `repair()`（回報
變更／差異／副作用）分離，讓未來可加入
`doctor --fix --dry-run`，而不必將 lint 檢查轉為修改規劃器。

部分內建檢查在內部預設為停用，因此仍可供
`--all`、`--only` 及 Doctor 修復流程使用，而不會成為預設
`doctor --lint` 自動化設定檔的一部分。每項發現仍會輸出其嚴重性
（`info`、`warning` 或 `error`）；預設選取條件不是嚴重性
層級。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 輸出欄位：

- `ok`：是否有任何發現達到所選的嚴重性門檻
- `checksRun` / `checksSkipped`：數量（因設定檔、`--only` 或 `--skip` 而略過）
- `findings`：結構化診斷，包含 `checkId`、`severity`、`message`，以及選用的 `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint`

結束代碼：

| 代碼 | 意義                                                     |
| ---- | -------------------------------------------------------- |
| `0`  | 沒有發現達到或超過所選門檻                              |
| `1`  | 一項或多項發現達到所選門檻                              |
| `2`  | 尚未能輸出發現前，命令／執行階段便失敗                  |

旗標：

- `--severity-min info|warning|error`（預設為 `warning`）：同時控制輸出內容，以及哪些情況會導致非零結束代碼。
- `--all`：執行每個已登錄的 lint 檢查，包括不在預設自動化集合內、需選擇加入的檢查。
- `--only <id>`（可重複）：僅執行指定 ID 的檢查；未知 ID 會回報為錯誤發現。
- `--skip <id>`（可重複）：排除某項檢查，同時繼續執行其餘檢查。
- `--json`、`--severity-min`、`--all`、`--only` 及 `--skip` 必須搭配 `--lint`；單獨執行 `openclaw doctor` 或搭配 `--fix` 時會拒絕這些旗標。

## 功能摘要

<AccordionGroup>
  <Accordion title="健康狀態、UI 與更新">
    - 可選的 git 安裝前置更新（僅限互動模式）。
    - UI 協定新鮮度檢查（當協定結構描述較新時，重新建置控制 UI）。
    - 健康檢查 + 重新啟動提示。
    - Skills 狀態摘要（符合資格／缺少／遭封鎖）及外掛狀態。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值結構的設定正規化。
    - 將舊版扁平 `talk.*` 欄位遷移至 `talk.provider` + `talk.providers.<provider>` 的 Talk 設定遷移。
    - 舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode 提供者覆寫警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - 舊版 OpenAI Codex 提供者／設定檔遷移（`openai-codex` → `openai`），以及過時的 `models.providers.openai-codex` 遮蔽警告。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 必要條件檢查。
    - 當 `plugins.allow` 具有限制性，但工具政策仍要求萬用字元或外掛擁有的工具時，顯示外掛／工具允許清單警告。
    - 舊版磁碟上狀態遷移（工作階段／代理程式目錄／WhatsApp 驗證）。
    - 舊版外掛資訊清單契約鍵遷移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 舊版排程儲存區遷移（`jobId`、`schedule.cron`、頂層傳送／承載資料欄位、承載資料 `provider`、`notify: true` 網路鉤子備援工作）。
    - 在 `agents.defaults`、`agents.list[]` 及 `models.providers.*`（包括每個模型項目）中修復 Codex 命令列介面執行階段固定值（`agentRuntime.id: "codex-cli"` → `"codex"`）。
    - 啟用外掛時清理過時的外掛設定；當 `plugins.enabled=false` 時，過時的外掛參照會保留為非作用中的隔離設定。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 檢查工作階段鎖定檔並清理過時鎖定。
    - 修復受影響的 2026.4.24 組建所建立、含重複提示重寫分支的工作階段逐字稿。
    - 偵測卡住的子代理程式重新啟動復原墓碑，並支援使用 `--fix` 清除過時且已中止的復原旗標，避免啟動時持續將子代理程式視為重新啟動已中止。
    - 狀態完整性與權限檢查（工作階段、逐字稿、狀態目錄）。
    - 在本機執行時檢查設定檔權限（chmod 600）。
    - 模型驗證健康狀態：檢查 OAuth 到期時間、可重新整理即將到期的權杖，並回報驗證設定檔的冷卻／停用狀態。

  </Accordion>
  <Accordion title="閘道、服務與監督程序">
    - 啟用沙箱時修復沙箱映像。
    - 舊版服務遷移及額外閘道偵測。
    - Matrix 頻道舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - 閘道執行階段檢查（服務已安裝但未執行；快取的 launchd 標籤）。
    - 頻道狀態警告（從執行中的閘道探查）。
    - 頻道特定權限檢查位於 `openclaw channels capabilities`；例如，Discord 語音頻道權限可透過 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核。
    - 當閘道事件迴圈健康狀態降級且本機終端介面用戶端仍在執行時，進行 WhatsApp 回應能力檢查；`--fix` 僅會停止經驗證的本機終端介面用戶端。
    - 修復主要模型、備援、圖片／影片生成模型、心跳偵測／子代理程式／壓縮覆寫、鉤子、頻道模型覆寫及工作階段路由固定值中的舊版 `openai-codex/*` 模型參照；`--fix` 會將其重寫為 `openai/*`、把 `openai-codex:*` 驗證設定檔／順序遷移至 `openai:*`、移除過時的工作階段／整個代理程式執行階段固定值，並由修復後的有效路由判定是否與 Codex 相容。
    - 監督程序設定稽核（launchd/systemd/schtasks），可選擇修復。
    - 清理閘道服務在安裝或更新期間擷取的 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值，以移除內嵌 Proxy 環境設定。
    - 閘道執行階段最佳實務檢查（Node 與 Bun、版本管理器路徑）。
    - 閘道連接埠衝突診斷（預設為 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放式私訊政策的安全性警告。
    - 本機權杖模式的閘道驗證檢查（沒有權杖來源時會提議產生權杖；不會覆寫權杖 SecretRef 設定）。
    - 裝置配對問題偵測（待處理的首次配對要求、待處理的角色／範圍升級、過時的本機裝置權杖快取偏移，以及已配對記錄的驗證偏移）。

  </Accordion>
  <Accordion title="工作區與 shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區啟動程序檔案大小檢查（內容檔案的截斷／接近上限警告）。
    - 預設代理程式的 Skills 就緒狀態檢查；回報缺少二進位檔、環境、設定或作業系統需求的允許 Skills，而 `--fix` 可在 `skills.entries` 中停用不可用的 Skills。
    - Shell 自動補全狀態檢查及自動安裝／升級。
    - 記憶搜尋嵌入提供者就緒狀態檢查（本機模型、遠端 API 金鑰或 QMD 二進位檔）。
    - 原始碼安裝檢查（pnpm 工作區不符、缺少 UI 資產、缺少 tsx 二進位檔）。
    - 寫入更新後的設定 + 精靈中繼資料。

  </Accordion>
</AccordionGroup>

## 夢境 UI 回填與重設

控制 UI 的夢境場景包含 **回填**、**重設** 及 **清除落地項目** 動作，用於落地夢境整理工作流程。這些動作使用閘道的 Doctor 風格 RPC 方法，但**不**屬於 `openclaw doctor` 命令列介面的修復／遷移功能。

| 動作           | 功能                                                                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 回填           | 掃描使用中工作區內的歷史 `memory/YYYY-MM-DD.md` 檔案、執行落地 REM 日誌處理，並將可還原的回填項目寫入 `DREAMS.md`。                                                |
| 重設           | 僅從 `DREAMS.md` 移除已標記的回填日誌項目。                                                                                                                       |
| 清除落地項目   | 僅移除歷史重播中已暫存、僅供落地使用，且尚未累積即時回想或每日支援的短期項目。                                                                                     |

  這些操作都不會自行編輯 `MEMORY.md`、執行完整的 doctor 遷移，或將有依據的候選項目暫存至即時短期提升儲存區。若要將有依據的歷史重播資料送入一般的深度提升流程，請改用命令列介面流程：

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  這會將有依據的持久候選項目暫存至短期夢境整理儲存區，而 `DREAMS.md` 仍作為審查介面。

  ## 詳細行為與原理

  <AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git 簽出目錄，且 doctor 以互動模式執行，則會在執行 doctor 前詢問是否要更新（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    Doctor 會將舊版值的形態正規化為目前的綱要。目前的 Talk 語音設定為 `talk.provider` + `talk.providers.<provider>`，即時語音設定則位於 `talk.realtime.*` 下。Doctor 會將舊版 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形態改寫至供應商對應表，並將舊版頂層即時選擇器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）改寫至 `talk.realtime`。

    當 `plugins.allow` 非空白，且工具政策使用萬用字元或外掛擁有的工具項目時，Doctor 也會發出警告。`tools.allow: ["*"]` 只會比對實際載入之外掛所提供的工具；它不會繞過外掛專用允許清單。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含具有有效遷移的已淘汰鍵時，其他命令會拒絕執行，並要求你執行 `openclaw doctor`。Doctor 會說明找到哪些舊版鍵、顯示所套用的遷移，並以更新後的綱要改寫 `~/.openclaw/openclaw.json`。閘道啟動時會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；它不會在啟動時改寫 `openclaw.json`。排程工作儲存區遷移也由 `openclaw doctor --fix` 處理。

    <Note>
      Doctor 只會在設定鍵停用後約兩個月內提供自動遷移。
      更舊的舊版鍵（例如多代理程式設定形態之前的原始
      `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、
      `routing.transcribeAudio`、頂層 `agent.*` 或頂層 `identity`）
      已不再有遷移路徑；使用這些鍵的設定現在會驗證失敗，而不會被改寫。
      請依照目前的設定參考資料手動修正這些鍵，Doctor
      才能繼續執行。
    </Note>

    有效的遷移：

    | 舊版鍵                                                                                    | 目前的鍵                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | 已移除（WebChat 已停用）                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`（以及個別帳號）      | `...threadBindings.idleHours`                                               |
    | 舊版 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | 舊版頂層即時 Talk 選擇器（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`） | `talk.realtime`                                                              |
    | `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS 說話者欄位 `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`（除 Discord 外的所有頻道）                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`（所有頻道，包括 Discord）                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（閘道啟動時也會略過 `api` 為未來／未知列舉值的供應商，而不是以關閉方式失敗） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 已移除（舊版 Chrome 擴充功能轉送設定）                             |
    | `mcp.servers.*.type`（命令列介面原生別名）                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 已移除（Codex app-server 一律保留 Codex 原生工作區工具的原生形式） |
    | `commands.modelsWrite`                                                                           | 已移除（`/models add` 已淘汰）                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | 已移除（不再將完全相符的 `NO_REPLY` 改寫為可見的後備文字）  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 已移除（OpenClaw 擁有所產生的系統提示詞）                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 已移除（對於緩慢的模型／供應商逾時，請使用 `models.providers.<id>.timeoutSeconds`，並維持低於代理程式／執行逾時上限） |
    | 頂層 `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任何層級）                                                            | 已移除（記憶索引位於各代理程式資料庫中）                       |
    | 頂層 `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` 政策 ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | 已移除（已淘汰）                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      上述 `plugins.entries.voice-call.config.*` 各列會由
      Voice Call 外掛本身在每次載入設定時正規化，而不是由 `openclaw
      doctor` 處理。該外掛也會在啟動時記錄一則警告，指向 `openclaw
      doctor --fix`，但 Doctor 目前不會針對這些鍵改寫
      `openclaw.json`；在執行階段套用變更的是外掛本身的正規化。
    </Note>

    多帳號頻道的帳號預設值指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，卻未設定 `channels.<channel>.defaultAccount` 或 `accounts.default`，Doctor 會警告後備路由可能選到非預期的帳號。
    - 如果將 `channels.<channel>.defaultAccount` 設為未知的帳號 ID，Doctor 會發出警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 供應商覆寫">
    如果你曾手動新增 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `openclaw/plugin-sdk/llm` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會發出警告，讓你移除覆寫並還原個別模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，Doctor 會將其正規化為目前主機本機的 Chrome MCP 附加模型（`browser.profiles.*.driver: "extension"` → `"existing-session"`；`browser.relayBindHost` 已移除）。

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，Doctor 也會稽核主機本機的 Chrome MCP 路徑：

    - 針對預設自動連線設定檔，檢查同一主機上是否已安裝 Google Chrome
    - 檢查偵測到的 Chrome 版本，若低於 Chrome 144 則發出警告
    - 提醒你在瀏覽器檢查頁面中啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法替你啟用 Chrome 端設定。主機本機的 Chrome MCP 仍需要在閘道／節點主機上於本機執行 Chromium 核心瀏覽器 144+、啟用遠端偵錯，並在瀏覽器中核准首次附加的同意提示。

    此處的就緒狀態僅涵蓋本機附加的必要條件。Existing-session 會維持目前 Chrome MCP 的路由限制；`responsebody`、PDF 匯出、下載攔截與批次動作等進階路由仍需要受管理的瀏覽器或原始 CDP 設定檔。此檢查不適用於 Docker、沙箱、遠端瀏覽器或其他無頭流程，這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 必要條件">
    設定 OpenAI Codex OAuth 設定檔後，Doctor 會探測 OpenAI 授權端點，以確認本機 Node/OpenSSL TLS 堆疊能驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），Doctor 會顯示平台特定的修正指引。在使用 Homebrew Node 的 macOS 上，通常可透過 `brew postinstall ca-certificates` 修正。使用 `--deep` 時，即使閘道運作正常，也會執行此探測。
  </Accordion>
  <Accordion title="2e. Codex OAuth 供應商覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI 傳輸設定，它們可能會遮蔽內建的 Codex OAuth 供應商路徑。當 Doctor 在 Codex OAuth 旁發現這些舊傳輸設定時會發出警告，讓你移除或重寫過時的傳輸覆寫，並還原目前的路由行為。仍支援自訂 Proxy 與僅限標頭的覆寫，且不會觸發此警告，但這些自行建立的請求路由不符合隱式 Codex 選取資格。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex 控制框架路由使用標準的 `openai/*` 模型參照，但僅有此前綴絕不會選取 Codex。當執行階段政策未設定或為 `auto` 時，只有完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有自行建立的請求覆寫，才符合資格。請參閱 [OpenAI 隱式代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

    在 `--fix` / `--repair` 模式中，Doctor 會重寫受影響的預設代理程式與個別代理程式參照，包括主要模型、後援模型、圖片／影片生成模型、心跳偵測／子代理程式／壓縮覆寫、掛鉤、頻道模型覆寫，以及過時的持久化工作階段路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - 對於已修復的代理程式模型參照，Codex 意圖會移至供應商／模型範圍的 `agentRuntime.id: "codex"` 項目。
    - 過時的整體代理程式執行階段設定與持久化工作階段執行階段釘選會被移除，因為執行階段選取採用供應商／模型範圍。
    - 除非修復後的舊版模型參照需要 Codex 路由才能保留舊驗證路徑，否則會保留現有的供應商／模型執行階段政策。
    - 現有模型後援清單會保留，其中的舊版項目將被重寫；複製的個別模型設定會從舊版鍵移至標準的 `openai/*` 鍵。
    - 系統會修復所有已探索代理程式工作階段儲存區中的持久化工作階段 `modelProvider`/`providerOverride`、`model`/`modelOverride`、後援通知與驗證設定檔釘選。
    - Doctor 會另外修復過時的 `agentRuntime.id: "codex-cli"` 釘選（另一個不同的舊版執行階段 ID），將 `agents.defaults`、`agents.list[]` 與 `models.providers.*` 模型項目中的值改為 `"codex"`。
    - `/codex ...` 表示「從聊天控制或繫結原生 Codex 對話」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器」。

  </Accordion>
  <Accordion title="2g. 工作階段路由清理">
    當你將已設定的模型或執行階段移離 Codex 等由外掛擁有的路由後，Doctor 也會掃描已探索的代理程式工作階段儲存區，找出過時的自動建立路由狀態。

    當擁有這些狀態的路由不再設定時，`openclaw doctor --fix` 可以清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型釘選、執行階段模型中繼資料、釘選的控制框架 ID、命令列介面工作階段繫結，以及自動驗證設定檔覆寫。明確的使用者或舊版工作階段模型選擇會回報供人工檢閱，且保持不變；當不再打算使用該路由時，請使用 `/model ...`、`/new` 切換，或重設工作階段。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可以將較舊的磁碟配置遷移至目前的結構：

    - 工作階段儲存區與逐字稿：從 `~/.openclaw/sessions/` 移至 `~/.openclaw/agents/<agentId>/sessions/`
    - 代理程式目錄：從 `~/.openclaw/agent/` 移至 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）移至 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）

    這些遷移會盡力而為且具冪等性；如果 Doctor 留下任何舊版資料夾作為備份，會發出警告。閘道／命令列介面也會在啟動時自動遷移舊版工作階段與代理程式目錄，因此無須手動執行 Doctor，歷史記錄／驗證／模型就會移至個別代理程式路徑。WhatsApp 驗證資訊刻意僅透過 `openclaw doctor` 遷移。Talk 供應商／供應商對應正規化會依結構相等性進行比較，因此僅鍵順序不同的差異不再觸發重複且無實際變更的 `doctor --fix` 修改。

  </Accordion>
  <Accordion title="3a. 舊版外掛資訊清單遷移">
    Doctor 會掃描所有已安裝的外掛資訊清單，找出已淘汰的頂層功能鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到時，它會提議將這些鍵移入 `contracts` 物件，並直接重寫資訊清單檔案。此遷移具冪等性；如果 `contracts` 已有相同的值，舊版鍵會被移除，且不會複製資料。
  </Accordion>
  <Accordion title="3b. 舊版排程儲存區遷移">
    Doctor 也會檢查排程工作儲存區（預設為 `~/.openclaw/cron/jobs.json`，或覆寫後的 `cron.store`）是否包含排程器為維持相容性而仍接受的舊版工作結構。

    目前的排程清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層承載資料欄位（`message`、`model`、`thinking`、...）→ `payload`
    - 頂層傳遞欄位（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - 承載資料中的 `provider` 傳遞別名 → 明確的 `delivery.channel`
    - 舊版 `notify: true` 網路鉤子後援工作 → 在已設定 `cron.webhook` 時改為明確的網路鉤子傳遞；公告工作會保留其聊天傳遞，並取得 `delivery.completionDestination`。未設定 `cron.webhook` 時，沒有目標的工作會移除不起作用的頂層 `notify` 標記（包括公告在內的現有傳遞會保留），因為執行階段傳遞絕不會讀取它。

    閘道也會在載入時清理格式錯誤的排程資料列，讓有效工作繼續執行。原始的格式錯誤資料列會先複製到有效儲存區旁的 `jobs-quarantine.json`，再從 `jobs.json` 移除；Doctor 會回報已隔離的資料列，讓你可以手動檢閱或修復。

    閘道啟動時會正規化執行階段投影並忽略頂層 `notify` 標記，但會保留持久化排程設定以供 Doctor 修復。未設定 `cron.webhook` 時，Doctor 會針對沒有遷移目標的工作（`delivery.mode` 為 none／不存在、無法使用的網路鉤子目標，或現有的公告／聊天傳遞）移除不起作用的標記，且不變更現有傳遞，因此重複執行 `doctor --fix` 時不會再針對同一工作發出警告。如果已設定 `cron.webhook`，但不是有效的 HTTP(S) URL，Doctor 仍會發出警告並保留標記，讓你可以修正 URL。

    在 Linux 上，如果使用者的 crontab 仍會叫用舊版 `~/.openclaw/bin/ensure-whatsapp.sh`，Doctor 也會發出警告。目前的 OpenClaw 不維護此主機本機指令碼，且當排程無法連線至 systemd 使用者匯流排時，它可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康狀態檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 與 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理程式工作階段目錄，找出工作階段異常結束後遺留的過時寫入鎖定檔案。對於找到的每個鎖定檔案，它會回報：路徑、PID、PID 是否仍在執行、鎖定時間，以及是否視為過時（PID 已終止、擁有者中繼資料格式錯誤、超過 30 分鐘，或已證實仍在執行的 PID 屬於非 OpenClaw 程序）。在 `--fix` / `--repair` 模式下，它會自動移除擁有者已終止、已成為孤兒、已回收、格式錯誤且過舊，或屬於非 OpenClaw 程序的鎖定。仍由執行中的 OpenClaw 程序擁有的舊鎖定會被回報但保留，避免 Doctor 中斷作用中的逐字稿寫入程序。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描代理程式工作階段 JSONL 檔案，找出由 2026.4.24 提示逐字稿重寫錯誤所建立的重複分支結構：一個包含 OpenClaw 內部執行階段內容的已放棄使用者回合，以及一個包含相同可見使用者提示的作用中同層分支。在 `--fix` / `--repair` 模式下，Doctor 會在原始檔案旁備份每個受影響的檔案，並將逐字稿重寫為作用中分支，使閘道歷史記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久化、路由與安全性）">
    狀態目錄是作業中樞。如果它消失，而你又沒有在其他位置建立備份，就會遺失工作階段、認證資訊、日誌與設定。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告可能發生災難性的狀態遺失、提示重新建立目錄，並提醒你無法復原遺失的資料。
    - **狀態目錄權限**：驗證是否可寫入；提供修復權限的選項（偵測到擁有者／群組不符時，會輸出 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態目錄解析至 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 下時發出警告，因為由同步機制支援的路徑可能導致較慢的 I/O，以及鎖定／同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態目錄解析至 `mmcblk*` 掛載來源時發出警告，因為使用 SD/eMMC 的隨機 I/O 速度可能較慢，且在寫入工作階段與認證資訊時耗損得更快。
    - **Linux 揮發性狀態目錄**：當狀態目錄解析至 `tmpfs` 或 `ramfs` 時發出警告，因為工作階段、認證資訊、設定和 SQLite 狀態（包括 WAL／日誌附屬檔案）會在重新開機時消失。Docker `overlay` 掛載刻意不會被標示，因為只要容器仍存在，其可寫入層就會在主機重新開機後保留。
    - **工作階段目錄遺失**：必須有 `sessions/` 和工作階段儲存目錄，才能保存歷程並避免 `ENOENT` 當機。
    - **文字記錄不符**：近期工作階段項目缺少文字記錄檔案時發出警告。
    - **主要工作階段「單行 JSONL」**：主要文字記錄只有一行時加以標示（歷程未持續累積）。
    - **多個狀態目錄**：當不同主目錄中存在多個 `~/.openclaw` 資料夾，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷程可能分散於不同安裝之間）。
    - **遠端模式提醒**：如果 `gateway.mode=remote`，doctor 會提醒你在遠端主機上執行（狀態儲存在該處）。
    - **設定檔權限**：如果群組或所有人都可讀取 `~/.openclaw/openclaw.json`，則發出警告，並提供將權限收緊為 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在權杖即將到期／已到期時發出警告，並可在安全的情況下重新整理權杖。如果 Anthropic OAuth／權杖設定檔已過時，則會建議使用 Anthropic API 金鑰或 Anthropic setup-token 路徑。重新整理提示只會在互動模式（TTY）下執行時顯示；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或供應商要求你再次登入），doctor 會回報必須重新驗證，並印出應執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因短暫冷卻期（速率限制／逾時／驗證失敗）或較長時間停用（帳務／額度失敗）而暫時無法使用的驗證設定檔。

    權杖儲存在 macOS Keychain 中的舊版 Codex OAuth 設定檔（採用檔案式附屬配置之前的舊版初始設定）只能由 doctor 修復。請從互動式終端機執行一次 `openclaw doctor --fix`，將由 Keychain 支援的舊版權杖直接遷移至 `auth-profiles.json`；之後，嵌入式執行（Telegram、排程、子代理分派）會將其解析為標準 OpenAI OAuth 設定檔。

  </Accordion>
  <Accordion title="6. Hooks 模型驗證">
    如果已設定 `hooks.gmail.model`，doctor 會根據目錄和允許清單驗證模型參照，並在其無法解析或不允許使用時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，doctor 會檢查 Docker 映像；如果目前映像遺失，則提供建置映像或切換至舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. 外掛安裝清理">
    在 `openclaw doctor --fix`／`openclaw doctor --repair` 模式下，Doctor 會移除由 OpenClaw 舊版產生的外掛相依套件暫存狀態：過時的已產生相依套件根目錄、舊的安裝暫存目錄、先前內建外掛相依套件修復程式碼留下的套件本機殘留物，以及可能遮蔽目前內建資訊清單、孤立或已復原且由系統管理的內建 `@openclaw/*` 外掛 npm 副本。Doctor 也會將主機的 `openclaw` 套件重新連結至宣告 `peerDependencies.openclaw` 的受管理 npm 外掛，讓 `openclaw/plugin-sdk/*` 等套件本機執行階段匯入在更新或 npm 修復後仍能正常解析。

    當設定參照可下載的外掛，但本機外掛登錄找不到這些外掛時，Doctor 也可以重新安裝遺失的外掛（實質的 `plugins.entries`、已設定的頻道／供應商／搜尋設定、已設定的代理執行階段）。在套件更新期間，當核心套件正在替換時，doctor 會避免重新安裝外掛套件；如果更新後仍需復原已設定的外掛，請再次執行 `openclaw doctor --fix`。除了下述容器映像啟動例外之外，閘道啟動和設定重新載入不會執行套件修復；外掛安裝仍必須透過明確的 doctor／install／update 作業進行。

    容器化閘道啟動有一項範圍嚴格的升級例外：當 `openclaw gateway run` 在新版 OpenClaw 上啟動時，會在就緒前執行安全的狀態遷移和既有的核心更新後外掛收斂，然後記錄每個版本的檢查點。此啟動流程可以清理過時的內建外掛記錄、修復本機外掛連結、在收斂路徑需要時重新安裝已設定的外掛套件，並檢查作用中的外掛承載內容。如果啟動時無法安全修復，請先使用相同映像，針對相同的已掛載狀態／設定執行一次 `openclaw doctor --fix`，再正常重新啟動容器。

  </Accordion>
  <Accordion title="8. 閘道服務遷移與清理提示">
    Doctor 會偵測舊版閘道服務（launchd/systemd/schtasks），並提供移除這些服務，以及使用目前閘道連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類閘道服務並印出清理提示。具有設定檔名稱的 OpenClaw 閘道服務會被視為一級服務，不會標示為「額外」。

    在 Linux 上，如果使用者層級的閘道服務遺失，但系統層級的 OpenClaw 閘道服務存在，doctor 不會自動安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複項目；如果閘道生命週期由系統監督程式負責，則設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動時的 Matrix 遷移">
    當 Matrix 頻道帳號有待處理或可執行的舊版狀態遷移時，doctor 會在 `--fix`／`--repair` 模式下建立遷移前快照，接著以盡力而為的方式執行遷移步驟：舊版 Matrix 狀態遷移和舊版加密狀態準備。這兩個步驟都不會造成致命錯誤；錯誤會記錄至日誌，而啟動會繼續。在唯讀模式（不含 `--fix` 的 `openclaw doctor`）下，會完全略過此檢查。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證偏移">
    Doctor 會在一般健康檢查流程中檢查裝置配對狀態，並回報：

    - 待處理的首次配對要求
    - 已配對裝置待處理的角色或範圍升級
    - 裝置 ID 仍相符，但裝置身分已不再符合核准記錄時的公開金鑰不符修復
    - 已配對記錄缺少核准角色的有效權杖
    - 已配對權杖的範圍偏離核准的配對基準
    - 目前機器的本機快取裝置權杖項目早於閘道端權杖輪替，或帶有過時的範圍中繼資料

    Doctor 不會自動核准配對要求，也不會自動輪替裝置權杖。它會印出確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理要求
    - 使用 `openclaw devices approve <requestId>` 核准確切要求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的權杖
    - 使用 `openclaw devices remove <deviceId>` 移除過時記錄並重新核准

    這能區分首次配對、待處理的角色／範圍升級，以及過時的權杖／裝置身分偏移，從而補上常見的「已配對但仍收到需要配對」缺口。

  </Accordion>
  <Accordion title="9. 安全性警告">
    當供應商允許未受允許清單限制的私訊，或原則設定方式具有危險性時，Doctor 會發出警告。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    如果以 systemd 使用者服務執行，doctor 會確保已啟用 linger，讓閘道在登出後繼續運作。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、外掛和 TaskFlow）">
    Doctor 會印出預設代理的工作區狀態摘要：

    - **Skills 狀態**：計算符合資格、缺少必要條件，以及遭允許清單封鎖的 Skills 數量。
    - **外掛狀態**：計算已啟用／已停用／發生錯誤的外掛數量；列出所有錯誤的外掛 ID；回報套件外掛功能。
    - **外掛相容性警告**：標示與目前執行階段存在相容性問題的外掛。
    - **外掛診斷**：顯示外掛登錄在載入期間輸出的任何警告或錯誤。
    - **TaskFlow 復原**：顯示需要手動檢查或取消的可疑受管理 TaskFlow。

  </Accordion>
  <Accordion title="11b. 啟動載入檔案大小">
    Doctor 會檢查工作區啟動載入檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的上下文檔案）是否接近或超出設定的字元預算。它會回報每個檔案的原始與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及注入字元總數占總預算的比例。檔案遭截斷或接近限制時，doctor 會印出調整 `agents.defaults.bootstrapMaxChars` 和 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11c. Shell 自動完成">
    Doctor 會檢查目前的 shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 自動完成：

    - 如果 shell 設定檔使用速度較慢的動態自動完成模式（`source <(openclaw completion ...)`），doctor 會將其升級為速度較快的快取檔案版本。
    - 如果設定檔已設定自動完成，但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全未設定自動完成，doctor 會提示安裝（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="11d. 過時頻道外掛清理">
    當 `openclaw doctor --fix` 移除遺失的頻道外掛時，也會移除參照該外掛而懸空的頻道範圍設定：`channels.<id>` 項目、以該頻道為名的心跳偵測目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可防止頻道執行階段已不存在，但設定仍要求閘道繫結至該執行階段所造成的閘道啟動迴圈。
  </Accordion>
  <Accordion title="12. 閘道驗證檢查（本機權杖）">
    Doctor 會檢查本機閘道權杖驗證的就緒狀態。

    - 如果權杖模式需要權杖，但不存在任何權杖來源，doctor 會提供產生權杖的選項。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告，且不會以純文字覆寫。
    - `openclaw doctor --generate-gateway-token` 只會在未設定權杖 SecretRef 時強制產生權杖。

  </Accordion>
  <Accordion title="12b. 可感知 SecretRef 的唯讀修復">
    某些修復流程需要檢查已設定的認證資訊，同時不削弱執行階段快速失敗的行為。

    - `openclaw doctor --fix` 會使用與狀態系列命令相同的唯讀 SecretRef 摘要模型，進行特定設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` 的 `@username` 修復會在可用時嘗試使用已設定的機器人認證資訊。
    - 如果 Telegram 機器人權杖是透過 SecretRef 設定，但在目前的命令路徑中無法使用，doctor 會回報該認證資訊已設定但無法使用，並略過自動解析，而不會當機或將權杖誤報為缺少。

  </Accordion>
  <Accordion title="13. 閘道健康情況檢查與重新啟動">
    Doctor 會執行健康情況檢查，並在閘道看起來不健康時提供重新啟動選項。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    Doctor 會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理程式做好準備。行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且能夠啟動。若否，會顯示修復指引，包括 `npm install -g @tobilu/qmd`（或對應的 Bun 命令）以及手動指定二進位檔路徑的選項。
    - **明確指定的本機提供者**：檢查本機模型檔案，或可辨識的遠端／可下載模型 URL。若缺少，會建議切換至遠端提供者。
    - **明確指定的遠端提供者**（`openai`、`voyage` 等）：確認環境或驗證儲存區中存在 API 金鑰。若缺少，會顯示可操作的修復提示。
    - **舊版自動提供者**：將 `memorySearch.provider: "auto"` 視為 OpenAI、檢查 OpenAI 的就緒狀態，且 `doctor --fix` 會將其改寫為 `provider: "openai"`。

    當快取的閘道探測結果可用時（閘道在檢查當下健康），doctor 會將其結果與命令列介面可見的設定交叉比對，並註明任何差異。Doctor 不會在預設路徑中發起新的嵌入連線測試；若你需要即時提供者檢查，請使用深度記憶狀態命令。

    使用 `openclaw memory status --deep` 在執行階段驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 頻道狀態警告">
    如果閘道健康，doctor 會執行頻道狀態探測，並回報警告及建議的修復方式。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核與修復">
    Doctor 會檢查已安裝的監督程式設定（launchd/systemd/schtasks）是否缺少預設值或使用過時的預設值（例如 systemd 的網路連線就緒相依性與重新啟動延遲）。發現不一致時，會建議更新，並可將服務檔案／工作改寫為目前的預設值。

    注意事項：

    - `openclaw doctor` 會在改寫監督程式設定前提示你確認。
    - `openclaw doctor --yes` 會接受預設的修復提示。
    - `openclaw doctor --fix` 會直接套用建議的修復而不提示（`--repair` 是別名）。
    - `openclaw doctor --fix --force` 會覆寫自訂的監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對閘道服務生命週期保持唯讀。它仍會回報服務健康情況並執行非服務修復，但會略過服務安裝／啟動／重新啟動／啟動程序、監督程式設定改寫，以及舊版服務清理，因為該生命週期由外部監督程式負責。
    - 在 Linux 上，當相符的 systemd 閘道單元處於作用中時，doctor 不會改寫命令／進入點中繼資料。它也會在重複服務掃描期間忽略非作用中、非舊版的額外類閘道單元，避免配套服務檔案產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 的服務安裝／修復會驗證 SecretRef，但不會將解析後的明文權杖值永久儲存至監督程式服務的環境中繼資料。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows 排定的工作安裝中內嵌的受管理 `.env`／SecretRef 支援服務環境值，並改寫服務中繼資料，讓這些值改從執行階段來源載入，而非從監督程式定義載入。
    - Doctor 會偵測在 `gateway.port` 變更後，服務命令是否仍固定使用舊的 `--port`，並將服務中繼資料改寫為目前的連接埠。
    - 如果權杖驗證需要權杖，而已設定的權杖 SecretRef 尚未解析，doctor 會封鎖安裝／修復路徑，並提供可操作的指引。
    - 如果 `gateway.auth.token` 與 `gateway.auth.password` 皆已設定，但 `gateway.auth.mode` 尚未設定，doctor 會封鎖安裝／修復，直到明確設定模式為止。
    - 對於 Linux 使用者 systemd 單元，doctor 在比較服務驗證中繼資料時，會同時檢查 `Environment=` 與 `EnvironmentFile=` 來源的權杖差異。
    - 如果設定最後是由較新版本寫入，Doctor 的服務修復會拒絕使用較舊的 OpenClaw 二進位檔來改寫、停止或重新啟動閘道服務。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整改寫。

  </Accordion>
  <Accordion title="16. 閘道執行階段與連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際上未執行時發出警告。它也會檢查閘道連接埠（預設為 `18789`）是否發生連接埠衝突，並回報可能的原因（閘道已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. 閘道執行階段最佳實務">
    當閘道服務在 Bun 或版本管理工具管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 會發出警告。WhatsApp 與 Telegram 頻道需要 Node，而版本管理工具的路徑可能在升級後失效，因為服務不會載入你的 shell 初始化設定。當系統 Node 安裝可用時（Homebrew/apt/choco），doctor 會提供遷移至該安裝的選項。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而非複製互動式 shell 的 PATH，因此由 Homebrew 管理的系統二進位檔仍可使用，同時 Volta、asdf、fnm、pnpm 與其他版本管理工具目錄不會改變 Node 子程序解析到的版本。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）及穩定的使用者二進位檔目錄，但推測出的版本管理工具備援目錄只有在磁碟上確實存在時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 設定寫入與精靈中繼資料">
    Doctor 會永久儲存所有設定變更，並標記精靈中繼資料以記錄此次 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份與記憶系統）">
    當工作區缺少記憶系統時，doctor 會提出建議；如果工作區尚未由 git 管理，則會顯示備份提示。

    如需工作區結構與 git 備份的完整指南，請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)（建議使用私人 GitHub 或 GitLab 儲存庫）。

  </Accordion>
</AccordionGroup>

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
