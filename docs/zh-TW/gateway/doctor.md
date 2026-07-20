---
read_when:
    - 新增或修改 doctor 遷移作業
    - 引入破壞性設定變更
sidebarTitle: Doctor
summary: Doctor 命令：健康狀態檢查、設定遷移與修復步驟
title: 診斷工具
x-i18n:
    generated_at: "2026-07-20T00:48:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b33c4ae538f8aa8b8049012a788261f3b9051b006f84b17c0e10fe94dc0fdc
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` 是 OpenClaw 的修復與遷移工具。它會修正過時的設定／狀態、檢查健康狀況，並提供可採取行動的修復步驟。

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

    不提示並接受預設值（適用時包括重新啟動／服務／沙箱修復步驟）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    不提示並套用建議的修復（`--repair` 是其別名）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    執行適用於 CI 或前置檢查自動化的結構化健康檢查。唯讀：不進行
    提示、修復、遷移、重新啟動或狀態寫入。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    也套用積極的修復（會覆寫自訂的監督程式設定）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    不提示執行，且僅套用安全的遷移（設定正規化 +
    磁碟上的狀態移動）。略過需要人工
    確認的重新啟動／服務／沙箱操作。偵測到舊版狀態遷移時，仍會自動執行。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    掃描系統服務以尋找額外安裝的閘道（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

若要在寫入前檢閱變更，請先開啟設定檔：

```bash
cat ~/.openclaw/openclaw.json
```

## 唯讀 lint 模式

`openclaw doctor --lint` 是
`openclaw doctor --fix` 適合自動化的同類模式。兩者共用同一個 Doctor 規則登錄檔，但
選取及處理規則的方式不同：

| 模式                     | 提示   | 寫入設定／狀態     | 輸出                 | 用途                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 是       | 否                      | 易讀的健康狀況報告 | 由人工檢查狀態         |
| `openclaw doctor --fix`  | 有時 | 是，依照修復政策 | 易讀的修復記錄    | 套用已核准的修復       |
| `openclaw doctor --lint` | 否        | 否                      | 結構化發現項目    | CI、前置檢查及審查關卡 |

預設的 `doctor --lint` 會執行廣泛且安全的自動化設定檔：檢查
靜態、本機，以及對 CI 或前置檢查輸出有用的項目。它會略過需要選擇啟用，且屬於
建議性質、受環境影響、依賴即時服務、帳號／工作區
清單或歷史清理的檢查。若要執行
完整的已登錄 lint 稽核（包括這些選擇啟用的檢查），請使用 `doctor --lint --all`；若要
執行特定檢查，請使用 `--only <id>`。

`doctor --fix` 不使用 lint 預設設定檔，也不接受
`--all`。它會執行 Doctor 的依序修復路徑：現代健康檢查可提供
選用的 `repair()` 實作，而較舊的區域仍使用其舊版
Doctor 修復流程。有些 lint 發現項目刻意僅供診斷，因此
檢查出現在 `--lint --all` 中，不代表 `--fix` 會修改該區域。
此合約將 `detect()`（回報發現項目）與 `repair()`（回報
變更／差異／副作用）分開，為未來的
`doctor --fix --dry-run` 保留發展空間，而不會將 lint 檢查變成修改規劃器。

某些內建檢查在內部預設為停用，讓它們仍可供
`--all`、`--only` 及 Doctor 修復流程使用，而不會成為預設
`doctor --lint` 自動化設定檔的一部分。每個發現項目仍會輸出其嚴重性
（`info`、`warning` 或 `error`）；預設選取並非嚴重性
等級。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 輸出欄位：

- `ok`：是否有任何發現項目達到所選的嚴重性門檻
- `checksRun` / `checksSkipped`：計數（因設定檔、`--only` 或 `--skip` 而略過）
- `findings`：包含 `checkId`、`severity`、`message`，以及選用的 `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint` 的結構化診斷

結束代碼：

| 代碼 | 含義                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | 沒有任何發現項目達到或超過所選門檻           |
| `1`  | 一或多個發現項目達到所選門檻          |
| `2`  | 在輸出發現項目前發生命令／執行階段失敗 |

旗標：

- `--severity-min info|warning|error`（預設為 `warning`）：同時控制輸出的內容，以及導致非零結束代碼的條件。
- `--all`：執行每個已登錄的 lint 檢查，包括預設自動化集合排除的選擇啟用檢查。
- `--only <id>`（可重複）：僅執行指定的檢查 ID；未知的 ID 會回報為錯誤發現項目。
- `--skip <id>`（可重複）：排除某項檢查，同時讓其餘檢查繼續執行。
- `--json`、`--severity-min`、`--all`、`--only` 及 `--skip` 需要 `--lint`；單純的 `openclaw doctor` 與 `--fix` 執行會拒絕這些項目。

## 功能摘要

<AccordionGroup>
  <Accordion title="健康狀況、使用者介面與更新">
    - Git 安裝的選用前置更新（僅限互動模式）。
    - 使用者介面通訊協定新鮮度檢查（當通訊協定結構描述較新時，重新建置控制使用者介面）。
    - 健康檢查 + 重新啟動提示。
    - 僅顯示有問題的 Skill 與外掛備註；正常的清單仍保留在 `openclaw skills check` 和 `openclaw plugins list` 中。

  </Accordion>
  <Accordion title="設定與遷移">
    - 舊版值格式的設定正規化。
    - 將 Talk 設定從舊版扁平的 `talk.*` 欄位遷移至 `talk.provider` + `talk.providers.<provider>`。
    - 針對舊版 Chrome 擴充功能設定與 Chrome MCP 就緒狀態的瀏覽器遷移檢查。
    - OpenCode 提供者覆寫警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - 舊版 OpenAI Codex 提供者／設定檔遷移（`openai-codex` → `openai`），以及過時 `models.providers.openai-codex` 的遮蔽警告。
    - OpenAI Codex OAuth 設定檔的 OAuth TLS 必要條件檢查。
    - 當 `plugins.allow` 具有限制性，但工具政策仍要求萬用字元或外掛所擁有的工具時，顯示外掛／工具允許清單警告。
    - 舊版磁碟狀態遷移（工作階段／代理程式目錄／WhatsApp 驗證）。
    - 舊版外掛資訊清單合約鍵遷移（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - 舊版排程儲存區遷移（`jobId`、`schedule.cron`、頂層傳遞／承載資料欄位、承載資料 `provider`、`notify: true` 網路鉤子備援工作）。
    - 在 `agents.defaults`、`agents.list[]` 與 `models.providers.*` 中修復 Codex 命令列介面執行階段固定版本（`agentRuntime.id: "codex-cli"` → `"codex"`），包括各模型項目。
    - 啟用外掛時清理過時的外掛設定；當 `plugins.enabled=false` 時，過時的外掛參照會保留為非作用中的圍堵設定。

  </Accordion>
  <Accordion title="狀態與完整性">
    - 檢查工作階段鎖定檔案，並清理過時的鎖定。
    - 修復受影響的 2026.4.24 組建所建立之重複提示詞重寫分支的工作階段文字記錄。
    - 偵測卡住的主要工作階段與子代理程式重新啟動復原墓碑。Doctor 會回報遭封鎖的工作階段，且只修復與現有墓碑衝突的過時中止旗標；不會重新啟用自動復原。
    - 狀態完整性與權限檢查（工作階段、文字記錄、狀態目錄）。
    - 在本機執行時檢查設定檔權限（chmod 600）。
    - 模型驗證健康狀況：檢查 OAuth 到期時間、可重新整理即將到期的權杖，並回報驗證設定檔的冷卻／停用狀態。

  </Accordion>
  <Accordion title="閘道、服務與監督程式">
    - 啟用沙箱時修復沙箱映像檔。
    - 遷移舊版服務並偵測額外的閘道。
    - Matrix 頻道舊版狀態遷移（在 `--fix` / `--repair` 模式中）。
    - 閘道執行階段檢查（服務已安裝但未執行；快取的 launchd 標籤）。
    - 頻道狀態警告（從執行中的閘道探測）。
    - 頻道專屬權限檢查位於 `openclaw channels capabilities` 下；例如，使用 `openclaw channels capabilities --channel discord --target channel:<channel-id>` 稽核 Discord 語音頻道權限。
    - 當本機終端介面用戶端仍在執行，且閘道事件迴圈健康狀況劣化時，進行 WhatsApp 回應能力檢查；`--fix` 僅停止經驗證的本機終端介面用戶端。
    - 修復主要模型、備援模型、影像／影片生成模型、心跳偵測／子代理程式／壓縮覆寫、掛鉤、頻道模型覆寫及工作階段路由固定項目中的舊版 `openai-codex/*` 模型參照 Codex 路由；`--fix` 會將它們重寫為 `openai/*`、將 `openai-codex:*` 驗證設定檔／順序遷移至 `openai:*`、移除過時的工作階段／整個代理程式執行階段固定項目，並由修復後的有效路由判定 Codex 是否相容。
    - 監督程式設定稽核（launchd/systemd/schtasks），可選擇進行修復。
    - 清理安裝或更新期間擷取到 Shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 值之閘道服務的內嵌 Proxy 環境。
    - 閘道執行階段檢查（不受支援的舊版 Bun 服務、版本管理器路徑）。
    - 閘道連接埠衝突診斷（預設 `18789`）。

  </Accordion>
  <Accordion title="驗證、安全性與配對">
    - 開放私訊政策的安全性警告。
    - 本機權杖模式的閘道驗證檢查（沒有權杖來源時，會提供產生權杖的選項；不會覆寫權杖 SecretRef 設定）。
    - 偵測裝置配對問題（待處理的首次配對要求、待處理的角色／範圍升級、過時的本機裝置權杖快取偏移，以及已配對記錄的驗證偏移）。

  </Accordion>
  <Accordion title="工作區與 Shell">
    - Linux 上的 systemd linger 檢查。
    - 工作區啟動檔案大小檢查（內容檔案的截斷／接近上限警告）。
    - 預設代理程式的 Skills 就緒狀態檢查；回報缺少執行檔、環境、設定或作業系統要求的已允許 Skills，且 `--fix` 可停用 `skills.entries` 中無法使用的 Skills。
    - Shell 自動完成狀態檢查及自動安裝／升級。
    - 記憶搜尋嵌入提供者就緒狀態檢查（本機模型、遠端 API 金鑰或 QMD 執行檔）。
    - 原始碼安裝檢查（pnpm 工作區不相符、缺少使用者介面資產、缺少 tsx 執行檔）。
    - 寫入已更新的設定 + 精靈中繼資料。

  </Accordion>
</AccordionGroup>

## 夢境使用者介面回填與重設

  Control UI 的夢境場景包含 **回填**、**重設**和**清除基準項目**動作，用於基準夢境整理工作流程。這些動作使用閘道的 doctor 風格 RPC 方法，但**不**屬於 `openclaw doctor` 命令列介面的修復／遷移。

  | 動作           | 功能                                                                                                                                                                  |
  | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | 回填           | 掃描作用中工作區內的歷史 `memory/YYYY-MM-DD.md` 檔案、執行基準 REM 日記處理，並將可逆的回填項目寫入 `DREAMS.md`。 |
  | 重設           | 僅從 `DREAMS.md` 移除已標記的回填日記項目。                                                                                                  |
  | 清除基準項目   | 僅移除歷史重播中已暫存、僅限基準且尚未累積即時回想或每日支援的短期項目。                           |

  這些動作都不會編輯 `MEMORY.md`、執行完整的 doctor 遷移，或自行將基準候選項目暫存到即時短期晉升儲存區。若要將基準歷史重播送入一般深度晉升管道，請改用命令列介面流程：

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  這會將基準耐久候選項目暫存到短期夢境整理儲存區，同時讓 `DREAMS.md` 維持作為審查介面。

  ## 詳細行為與理由

  <AccordionGroup>
  <Accordion title="0. 選用更新（git 安裝）">
    如果這是 git 簽出，且 doctor 以互動方式執行，則會在執行 doctor 前提供更新選項（fetch/rebase/build）。
  </Accordion>
  <Accordion title="1. 設定正規化">
    Doctor 會將舊版值格式正規化為目前的結構描述。目前的 Talk 語音設定為 `talk.provider` + `talk.providers.<provider>`，即時語音設定則位於 `talk.realtime.*` 下。Doctor 會將舊版 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 格式重寫至提供者對應表，並將舊版頂層即時選擇器（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）重寫至 `talk.realtime`。

    當 `plugins.allow` 非空，且工具原則使用萬用字元或由外掛擁有的工具項目時，Doctor 也會發出警告。`tools.allow: ["*"]` 僅會比對實際載入之外掛所提供的工具；它不會略過專屬外掛允許清單。

  </Accordion>
  <Accordion title="2. 舊版設定鍵遷移">
    當設定包含具有有效遷移的已淘汰鍵時，其他命令會拒絕執行，並要求你執行 `openclaw doctor`。Doctor 會說明找到哪些舊版鍵、顯示已套用的遷移，並使用更新後的結構描述重寫 `~/.openclaw/openclaw.json`。閘道啟動時會拒絕舊版設定格式，並要求你執行 `openclaw doctor --fix`；啟動時不會重寫 `openclaw.json`。排程工作儲存區遷移也由 `openclaw doctor --fix` 處理。

    <Note>
      Doctor 僅會在設定鍵退役後約兩個月內提供自動遷移。
      更舊的舊版鍵（例如最初的
      `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、
      `routing.transcribeAudio`、頂層 `agent.*`，或多代理程式設定格式推出前的頂層 `identity`）
      已不再有遷移路徑；使用這些鍵的設定現在會驗證失敗，而不會被重寫。
      請依照目前的設定參考資料手動修正這些鍵，doctor 才能繼續執行。
    </Note>

    有效遷移：

    | 舊版鍵                                                                                    | 目前的鍵                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`、`gateway.webchat`                                                            | 已移除（WebChat 已退役）                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`、`channels.<id>.threadBindings.ttlHours`（以及每個帳號）      | `...threadBindings.idleHours`                                               |
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
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（閘道啟動時也會略過 `api` 為未來／未知列舉值的提供者，而非採取失敗關閉） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 已移除（舊版 Chrome 擴充功能轉送設定）                             |
    | `mcp.servers.*.type`（命令列介面原生別名）                                                        | `mcp.servers.*.transport`                                                    |
    | MCP 逾時別名 `connectTimeout`/`connect_timeout`/`timeout`                                 | `connectionTimeoutMs`/`requestTimeoutMs`                                    |
    | 頂層 `defaultModel`                                                                         | `agents.defaults.model`                                                      |
    | `messages.messagePrefix`                                                                         | `channels.whatsapp.messagePrefix`                                            |
    | `session.maintenance.pruneDays`、`session.resetByType.dm`                                        | `session.maintenance.pruneAfter`、`session.resetByType.direct`               |
    | 頂層 `tui`                                                                                  | 已移除（終端介面頁尾使用精簡預設值）                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 已移除（Codex app-server 一律將 Codex 原生工作區工具保留為原生工具） |
    | `commands.modelsWrite`                                                                           | 已移除（`/models add` 已淘汰）                                       |
    | `agents.defaults/list[].silentReplyRewrite`、`surfaces.*.silentReplyRewrite`                     | 已移除（完全相符的 `NO_REPLY` 不再重寫為可見的備援文字）  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 已移除（OpenClaw 擁有產生的系統提示）                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 已移除（對於緩慢的模型／提供者逾時，請使用 `models.providers.<id>.timeoutSeconds`，並保持低於代理程式／執行逾時上限） |
    | 頂層 `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任何層級）                                                            | 已移除（記憶索引位於各代理程式的資料庫中）                       |
    | 頂層 `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` 原則 ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`、`session.parentForkMaxTokens`                                 | 已移除（已淘汰）                                                        |
    | 於 2026.7 退役的執行階段與頻道調校選項                                               | 已移除（套用內建的正式環境預設值）                               |

    <Note>
      上述 `plugins.entries.voice-call.config.*` 資料列會在每次載入設定時由
      Voice Call 外掛本身正規化，而非由 `openclaw
      doctor` 處理。外掛也會記錄一則指向 `openclaw
      doctor --fix` 的啟動警告，但 doctor 目前不會針對這些鍵重寫
      `openclaw.json`；實際在執行階段套用變更的是外掛本身的正規化。
    </Note>

    多帳號頻道的帳號預設值指引：

    - 如果設定了兩個以上的 `channels.<channel>.accounts` 項目，但未設定 `channels.<channel>.defaultAccount` 或 `accounts.default`，doctor 會警告備援路由可能選到非預期的帳號。
    - 如果 `channels.<channel>.defaultAccount` 設為未知的帳號 ID，doctor 會發出警告並列出已設定的帳號 ID。

  </Accordion>
  <Accordion title="2b. OpenCode 提供者覆寫">
    如果你手動新增了 `models.providers.opencode`、`opencode-zen` 或 `opencode-go`，它會覆寫來自 `openclaw/plugin-sdk/llm` 的內建 OpenCode 目錄。這可能會強制模型使用錯誤的 API，或將成本歸零。Doctor 會發出警告，讓你移除該覆寫並還原各模型的 API 路由與成本。
  </Accordion>
  <Accordion title="2c. 瀏覽器遷移與 Chrome MCP 就緒狀態">
    如果你的瀏覽器設定仍指向已移除的 Chrome 擴充功能路徑，doctor 會將其正規化為目前主機本機的 Chrome MCP 附加模型（`browser.profiles.*.driver: "extension"` → `"existing-session"`；移除 `browser.relayBindHost`）。

    當你使用 `defaultProfile: "user"` 或已設定的 `existing-session` 設定檔時，doctor 也會稽核主機本機的 Chrome MCP 路徑：

    - 針對預設自動連線設定檔，檢查同一主機上是否已安裝 Google Chrome
    - 檢查偵測到的 Chrome 版本，並在低於 Chrome 144 時發出警告
    - 提醒你在瀏覽器檢查頁面中啟用遠端偵錯（例如 `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging` 或 `edge://inspect/#remote-debugging`）

    Doctor 無法代你啟用 Chrome 端的設定。主機本機的 Chrome MCP 仍需要在閘道／節點主機上本機執行 Chromium 架構的 144+ 瀏覽器、啟用遠端偵錯，並在瀏覽器中核准首次附加的同意提示。

    此處的就緒狀態僅涵蓋本機附加的先決條件。Existing-session 仍受目前 Chrome MCP 的路由限制；`responsebody`、PDF 匯出、下載攔截和批次動作等進階路由，仍需要受管理的瀏覽器或原始 CDP 設定檔。此檢查不適用於 Docker、沙箱、遠端瀏覽器或其他無頭流程；這些流程會繼續使用原始 CDP。

  </Accordion>
  <Accordion title="2d. OAuth TLS 先決條件">
    設定 OpenAI Codex OAuth 設定檔後，doctor 會探測 OpenAI 授權端點，以確認本機 Node/OpenSSL TLS 堆疊能驗證憑證鏈。如果探測因憑證錯誤而失敗（例如 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、憑證過期或自簽憑證），doctor 會輸出平台專屬的修正指引。在使用 Homebrew Node 的 macOS 上，修正方式通常是 `brew postinstall ca-certificates`。使用 `--deep` 時，即使閘道狀態正常，也會執行探測。
  </Accordion>
  <Accordion title="2e. Codex OAuth 提供者覆寫">
    如果你先前在 `models.providers.openai-codex` 下新增了舊版 OpenAI 傳輸設定，它們可能會遮蔽內建的 Codex OAuth 提供者路徑。Doctor 看到這些舊傳輸設定與 Codex OAuth 並存時會發出警告，讓你移除或重寫過時的傳輸覆寫，並還原目前的路由行為。自訂 Proxy 和僅標頭覆寫仍受支援，且不會觸發此警告，但這些自行定義的請求路由不符合隱含 Codex 選取的資格。
  </Accordion>
  <Accordion title="2f. Codex 路由修復">
    Doctor 會檢查舊版 `openai-codex/*` 模型參照。原生 Codex 執行框架路由使用標準的 `openai/*` 模型參照，但僅有前綴絕不會選取 Codex。當執行階段原則未設定或為 `auto` 時，只有完全符合官方 HTTPS Platform Responses 或 ChatGPT Responses、且沒有自行定義請求覆寫的路由才符合資格。請參閱 [OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

    在 `--fix` / `--repair` 模式下，doctor 會重寫受影響的預設代理程式與個別代理程式參照，包括主要模型、備援模型、影像／影片生成模型、心跳偵測／子代理程式／壓縮覆寫、鉤子、頻道模型覆寫，以及過時的持久化工作階段路由狀態：

    - `openai-codex/gpt-*` 會變成 `openai/gpt-*`。
    - Codex 意圖會移至提供者／模型範圍的 `agentRuntime.id: "codex"` 項目，供修復後的代理程式模型參照使用。
    - 系統會移除過時的整體代理程式執行階段設定和持久化工作階段執行階段固定項目，因為執行階段選取是以提供者／模型為範圍。
    - 除非修復後的舊版模型參照需要 Codex 路由才能保留舊的驗證路徑，否則會保留現有的提供者／模型執行階段原則。
    - 會保留現有的模型備援清單，並重寫其中的舊版項目；複製的個別模型設定會從舊版鍵移至標準的 `openai/*` 鍵。
    - 會在所有找到的代理程式工作階段儲存區中修復持久化工作階段的 `modelProvider`/`providerOverride`、`model`/`modelOverride`、備援通知和驗證設定檔固定項目。
    - Doctor 會另外在 `agents.defaults`、`agents.list[]` 和 `models.providers.*` 模型項目中，將過時的 `agentRuntime.id: "codex-cli"` 固定項目（一個不同的舊版執行階段 ID）修復為 `"codex"`。
    - `/codex ...` 表示「從聊天中控制原生 Codex 對話或與其繫結」。
    - `/acp ...` 或 `runtime: "acp"` 表示「使用外部 ACP/acpx 轉接器」。

  </Accordion>
  <Accordion title="2g. 工作階段路由清理">
    當你將設定的模型或執行階段從 Codex 等由外掛擁有的路由移開後，doctor 也會掃描找到的代理程式工作階段儲存區，尋找過時的自動建立路由狀態。

    當所屬路由已不再設定時，`openclaw doctor --fix` 可清除自動建立的過時狀態，例如 `modelOverrideSource: "auto"` 模型固定項目、執行階段模型中繼資料、固定的執行框架 ID、命令列介面工作階段繫結，以及自動驗證設定檔覆寫。明確的使用者或舊版工作階段模型選擇會列出供手動檢閱，並保持不變；請使用 `/model ...`、`/new` 切換它們，或在不再需要該路由時重設工作階段。

  </Accordion>
  <Accordion title="3. 舊版狀態遷移（磁碟配置）">
    Doctor 可將較舊的磁碟配置遷移至目前的結構：

    - 工作階段儲存區與文字記錄：從 `~/.openclaw/sessions/` 移至 `~/.openclaw/agents/<agentId>/sessions/`
    - 代理程式目錄：從 `~/.openclaw/agent/` 移至 `~/.openclaw/agents/<agentId>/agent/`
    - WhatsApp 驗證狀態（Baileys）：從舊版 `~/.openclaw/credentials/*.json`（`oauth.json` 除外）移至 `~/.openclaw/credentials/whatsapp/<accountId>/...`（預設帳號 ID：`default`）
    - 已簽署的裝置身分：從 `~/.openclaw/identity/device.json` 移至 `state/openclaw.sqlite` 中的 `primary` `device_identities` 資料列；獨立的裝置驗證檔案保持不變

    這些遷移會盡力執行且具備冪等性；當 doctor 將任何舊版資料夾保留為備份時，會發出警告。閘道／命令列介面也會在啟動時自動遷移舊版工作階段與代理程式目錄，讓歷程記錄／驗證／模型進入個別代理程式路徑，不必手動執行 doctor。WhatsApp 驗證刻意只透過 `openclaw doctor` 遷移。Talk 提供者／提供者對應表的正規化會以結構相等性比較，因此僅鍵順序不同的差異不再觸發重複且無實際變更的 `doctor --fix` 變更。

  </Accordion>
  <Accordion title="3a. 舊版外掛資訊清單遷移">
    Doctor 會掃描所有已安裝外掛的資訊清單，尋找已棄用的頂層功能鍵（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）。找到後，它會提議將這些鍵移至 `contracts` 物件，並就地重寫資訊清單檔案。此遷移具備冪等性；如果 `contracts` 已有相同值，便會移除舊版鍵，而不會重複資料。
  </Accordion>
  <Accordion title="3b. 舊版排程儲存區遷移">
    Doctor 也會檢查排程工作儲存區（預設為 `~/.openclaw/cron/jobs.json`，覆寫時則為 `cron.store`），尋找排程器為維持相容性而仍接受的舊工作結構。

    目前的排程清理包括：

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 頂層承載資料欄位（`message`、`model`、`thinking`，……）→ `payload`
    - 頂層傳遞欄位（`deliver`、`channel`、`to`、`provider`，……）→ `delivery`
    - 承載資料 `provider` 傳遞別名 → 明確的 `delivery.channel`
    - 舊版 `notify: true` 網路鉤子備援工作 → 若已淘汰的原始 `cron.webhook` 值有效，便改為明確的網路鉤子傳遞；公告工作會保留其聊天傳遞並取得 `delivery.completionDestination`。接著 doctor 會移除舊設定鍵。如果沒有可用的舊版網路鉤子，對於沒有目標的工作，會移除無作用的頂層 `notify` 標記（保留現有傳遞，包括公告），因為執行階段傳遞從不讀取它。

    閘道也會在載入時清理格式錯誤的排程資料列，讓有效工作繼續執行。系統會先將原始格式錯誤的資料列複製到作用中儲存區旁的 `jobs-quarantine.json`，再從 `jobs.json` 移除；doctor 會回報隔離的資料列，讓你手動檢閱或修復。

    閘道啟動時會正規化執行階段投影並忽略頂層 `notify` 標記，但會保留持久化排程狀態供 doctor 修復。Doctor 會針對沒有遷移目標的工作（`delivery.mode` 為無／不存在、舊版網路鉤子目標不可用，或已有公告／聊天傳遞）移除無作用的標記，同時保持現有傳遞不變，因此重複執行 `doctor --fix` 不會再針對同一工作發出警告。

    在 Linux 上，當使用者的 crontab 仍叫用舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 也會發出警告。這個主機本機指令碼不再由目前的 OpenClaw 維護，且當排程無法連線至 systemd 使用者匯流排時，可能會將錯誤的 `Gateway inactive` 訊息寫入 `~/.openclaw/logs/whatsapp-health.log`。請使用 `crontab -e` 移除過時的 crontab 項目；目前的健康狀態檢查請使用 `openclaw channels status --probe`、`openclaw doctor` 和 `openclaw gateway status`。

  </Accordion>
  <Accordion title="3c. 工作階段鎖定清理">
    Doctor 會掃描每個代理程式工作階段目錄，尋找工作階段異常結束時遺留的過期寫入鎖定檔案。針對找到的每個鎖定檔案，它會回報：路徑、PID、該 PID 是否仍在執行、鎖定存在時間，以及是否視為過期（PID 已終止、擁有者中繼資料格式錯誤、超過 30 分鐘，或已證實仍在執行的 PID 屬於非 OpenClaw 程序）。在 `--fix` / `--repair` 模式下，它會自動移除擁有者已終止、孤立、遭重複使用、中繼資料格式錯誤且過舊，或非 OpenClaw 的鎖定。若舊鎖定仍由執行中的 OpenClaw 程序持有，則只會回報而保留原狀，避免 Doctor 中斷作用中的逐字稿寫入程式。
  </Accordion>
  <Accordion title="3d. 工作階段逐字稿分支修復">
    Doctor 會掃描代理程式工作階段 JSONL 檔案，尋找由 2026.4.24 提示詞逐字稿重寫錯誤所建立的重複分支結構：一個包含 OpenClaw 內部執行階段內容的已放棄使用者回合，以及一個包含相同可見使用者提示詞的作用中同層分支。在 `--fix` / `--repair` 模式下，Doctor 會在每個受影響檔案的原始檔案旁建立備份，並將逐字稿重寫為作用中分支，使閘道歷程記錄與記憶讀取器不再看到重複回合。
  </Accordion>
  <Accordion title="4. 狀態完整性檢查（工作階段持久性、路由與安全性）">
    狀態目錄是運作中樞。如果它消失，除非你在其他位置有備份，否則將失去工作階段、認證資訊、記錄與設定。

    Doctor 會檢查：

    - **狀態目錄遺失**：警告災難性的狀態遺失、提示重新建立目錄，並提醒你它無法復原遺失的資料。
    - **狀態目錄權限**：驗證是否可寫入；提供修復權限的選項（偵測到擁有者／群組不符時，也會顯示 `chown` 提示）。
    - **macOS 雲端同步狀態目錄**：當狀態解析至 iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）或 `~/Library/CloudStorage/...` 之下時發出警告，因為同步支援的路徑可能造成較慢的 I/O，以及鎖定／同步競爭。
    - **Linux SD 或 eMMC 狀態目錄**：當狀態解析至 `mmcblk*` 掛載來源時發出警告，因為在工作階段與認證資訊寫入期間，以 SD/eMMC 為基礎的隨機 I/O 可能較慢且磨損得更快。
    - **Linux 揮發性狀態目錄**：當狀態解析至 `tmpfs` 或 `ramfs` 時發出警告，因為重新開機後，工作階段、認證資訊、設定與 SQLite 狀態（連同 WAL／日誌附屬檔案）都會消失。Docker `overlay` 掛載刻意不會被標記，因為只要容器仍存在，其可寫入層便會在主機重新開機後持續保留。
    - **工作階段目錄遺失**：必須有 `sessions/` 與工作階段儲存區目錄，才能保留歷程記錄並避免 `ENOENT` 當機。
    - **逐字稿不符**：當近期工作階段項目缺少逐字稿檔案時發出警告。
    - **主要工作階段「單行 JSONL」**：當主要逐字稿只有一行時加以標記（歷程記錄未持續累積）。
    - **多個狀態目錄**：當多個家目錄中存在多個 `~/.openclaw` 資料夾，或 `OPENCLAW_STATE_DIR` 指向其他位置時發出警告（歷程記錄可能分散於不同安裝之間）。
    - **遠端模式提醒**：若為 `gateway.mode=remote`，Doctor 會提醒你在遠端主機上執行（狀態位於該處）。
    - **設定檔權限**：若 `~/.openclaw/openclaw.json` 可由群組／所有人讀取，則發出警告，並提供將權限收緊至 `600` 的選項。

  </Accordion>
  <Accordion title="5. 模型驗證健康狀態（OAuth 到期）">
    Doctor 會檢查驗證儲存區中的 OAuth 設定檔，在權杖即將到期／已到期時發出警告，並可在安全的情況下重新整理權杖。若 Anthropic OAuth／權杖設定檔已過期，它會建議使用 Anthropic API 金鑰或 Anthropic 設定權杖路徑。重新整理提示只會在互動式執行（TTY）時出現；`--non-interactive` 會略過重新整理嘗試。

    當 OAuth 重新整理永久失敗時（例如 `refresh_token_reused`、`invalid_grant`，或供應商要求你重新登入），Doctor 會回報需要重新驗證，並顯示要執行的確切 `openclaw models auth login --provider ...` 命令。

    Doctor 也會回報因短暫冷卻期（速率限制／逾時／驗證失敗）或較長時間停用（帳務／點數失敗）而暫時無法使用的驗證設定檔。

    權杖位於 macOS Keychain 的舊版 Codex OAuth 設定檔（採用檔案式附屬檔案配置之前的舊版初始設定）只能由 Doctor 修復。請從互動式終端機執行一次 `openclaw doctor --fix`，將由 Keychain 支援的舊版權杖就地移轉至 `auth-profiles.json`；之後，內嵌回合（Telegram、排程、子代理程式分派）會將其解析為標準 OpenAI OAuth 設定檔。

  </Accordion>
  <Accordion title="6. 鉤子模型驗證">
    若已設定 `hooks.gmail.model`，Doctor 會根據目錄與允許清單驗證模型參照，並在無法解析或不允許該模型時發出警告。
  </Accordion>
  <Accordion title="7. 沙箱映像修復">
    啟用沙箱時，Doctor 會檢查 Docker 映像；若目前的映像遺失，則提供建置映像或切換至舊版名稱的選項。
  </Accordion>
  <Accordion title="7b. 外掛安裝清理">
    在 `openclaw doctor --fix` / `openclaw doctor --repair` 模式下，Doctor 會移除由 OpenClaw 產生的舊版外掛相依套件暫存狀態：過期的已產生相依套件根目錄、舊安裝暫存目錄、先前內建外掛相依套件修復程式碼留下的套件區域殘留物，以及內建 `@openclaw/*` 外掛的孤立或已復原受管理 npm 副本，這些副本可能遮蔽目前的內建資訊清單。Doctor 也會將主機的 `openclaw` 套件重新連結至宣告 `peerDependencies.openclaw` 的受管理 npm 外掛，使 `openclaw/plugin-sdk/*` 等套件區域執行階段匯入在更新或 npm 修復後仍可解析。

    當設定參照可下載的外掛，但本機外掛登錄找不到它們時，Doctor 也可以重新安裝遺失的外掛（實質 `plugins.entries`、已設定的頻道／供應商／搜尋設定、已設定的代理程式執行階段）。套件更新期間，核心套件正在替換時，Doctor 會避免重新安裝外掛套件；若更新後已設定的外掛仍需復原，請再次執行 `openclaw doctor --fix`。除了下述容器映像啟動例外，閘道啟動與設定重新載入不會執行套件修復；外掛安裝仍是明確的 Doctor／安裝／更新工作。

    容器化閘道啟動有一項範圍狹窄的升級例外：當 `openclaw gateway run` 在新的 OpenClaw 版本上啟動時，它會在就緒之前執行安全狀態移轉及現有的核心更新後外掛收斂程序，然後記錄每個版本的檢查點。此啟動程序可以清理過期的內建外掛記錄、修復本機外掛連結、在收斂路徑需要時重新安裝已設定的外掛套件，並檢查作用中的外掛承載內容。若啟動程序無法安全修復，請先以 `openclaw doctor --fix` 對相同的已掛載狀態／設定執行一次相同映像，再正常重新啟動容器。

  </Accordion>
  <Accordion title="8. 閘道服務移轉與清理提示">
    Doctor 會偵測舊版閘道服務（launchd/systemd/schtasks），並提供移除這些服務及使用目前閘道連接埠安裝 OpenClaw 服務的選項。它也可以掃描額外的類閘道服務並顯示清理提示。以設定檔命名的 OpenClaw 閘道服務會視為一級服務，不會被標記為「額外」。

    在 Linux 上，若缺少使用者層級閘道服務，但存在系統層級 OpenClaw 閘道服務，Doctor 不會自動再安裝第二個使用者層級服務。請使用 `openclaw gateway status --deep` 或 `openclaw doctor --deep` 檢查，然後移除重複服務；若閘道生命週期由系統監督程式管理，則設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Accordion>
  <Accordion title="8b. 啟動時 Matrix 移轉">
    當 Matrix 頻道帳戶有待處理或可執行的舊版狀態移轉時，Doctor（在 `--fix` / `--repair` 模式下）會建立移轉前快照，然後執行盡力而為的移轉步驟：舊版 Matrix 狀態移轉與舊版加密狀態準備。這兩個步驟都不會造成致命錯誤；錯誤會記錄下來，且啟動會繼續。在唯讀模式下（`openclaw doctor`，且未使用 `--fix`），會完全略過此檢查。
  </Accordion>
  <Accordion title="8c. 裝置配對與驗證偏移">
    Doctor 會在一般健康狀態檢查中檢查裝置配對狀態，並回報：

    - 待處理的首次配對要求
    - 已配對裝置待處理的角色或範圍升級
    - 裝置 ID 仍相符，但裝置身分已不再符合核准記錄時的公開金鑰不符修復
    - 缺少核准角色作用中權杖的已配對記錄
    - 範圍偏離核准配對基準的已配對權杖
    - 目前機器上早於閘道端權杖輪替，或帶有過期範圍中繼資料的本機快取裝置權杖項目

    Doctor 不會自動核准配對要求或自動輪替裝置權杖。它會顯示確切的後續步驟：

    - 使用 `openclaw devices list` 檢查待處理要求
    - 使用 `openclaw devices approve <requestId>` 核准確切要求
    - 使用 `openclaw devices rotate --device <deviceId> --role <role>` 輪替新的權杖
    - 使用 `openclaw devices remove <deviceId>` 移除過期記錄並重新核准

    這會區分首次配對、待處理的角色／範圍升級，以及過期的權杖／裝置身分偏移，從而修正常見的「已配對但仍收到需要配對提示」漏洞。

  </Accordion>
  <Accordion title="9. 安全性警告">
    Doctor 只會在找到警告時顯示安全性注意事項，例如供應商未設定允許清單卻開放接收私訊，或原則設定具有危險性。使用 `openclaw security audit` 可取得完整的安全性清冊。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    若以 systemd 使用者服務執行，Doctor 會確保已啟用 linger，使閘道在登出後仍持續執行。
  </Accordion>
  <Accordion title="11. 工作區狀態（Skills、外掛與 TaskFlow）">
    Doctor 會顯示預設代理程式的問題與處理方式，而非健康狀態清冊：

    - **Skills**：列出允許但無法使用的 Skill 名稱；使用 `openclaw skills check` 可取得需求詳細資料與完整計數。
    - **外掛**：只回報發生錯誤的外掛 ID；使用 `openclaw plugins list` 可取得已載入、已匯入、已停用及套件外掛清冊。
    - **外掛相容性警告**：標記與目前執行階段有相容性問題的外掛。
    - **外掛診斷**：顯示外掛登錄在載入期間發出的所有警告或錯誤。
    - **TaskFlow 復原**：顯示需要手動檢查或取消的可疑受管理 TaskFlow。
    - **Claude 命令列介面**：只回報二進位檔、驗證、設定檔、工作區或專案目錄問題；省略健康探測的詳細資料。

  </Accordion>
  <Accordion title="11b. 啟動載入檔案大小">
    Doctor 會檢查工作區啟動載入檔案（例如 `AGENTS.md`、`CLAUDE.md` 或其他注入的內容檔案）是否接近或超過已設定的字元預算。它會回報每個檔案的原始字元數與注入字元數、截斷百分比、截斷原因（`max/file` 或 `max/total`），以及注入字元總數占總預算的比例。當檔案遭到截斷或接近限制時，Doctor 會顯示調整 `agents.defaults.bootstrapMaxChars` 與 `agents.defaults.bootstrapTotalMaxChars` 的提示。
  </Accordion>
  <Accordion title="11c. Shell 自動補全">
    Doctor 會檢查目前的 Shell（zsh、bash、fish 或 PowerShell）是否已安裝 Tab 鍵自動補全：

    - 如果 shell 設定檔使用較慢的動態補全模式（`source <(openclaw completion ...)`），doctor 會將其升級為較快的快取檔案版本。
    - 如果設定檔已設定補全，但快取檔案遺失，doctor 會自動重新產生快取。
    - 如果完全未設定補全，doctor 會提示安裝（僅限互動模式；使用 `--non-interactive` 時略過）。

    執行 `openclaw completion --write-state` 可手動重新產生快取。

  </Accordion>
  <Accordion title="11d. 清理過時的頻道外掛">
    當 `openclaw doctor --fix` 移除遺失的頻道外掛時，也會移除參照該外掛且懸空的頻道範圍設定：`channels.<id>` 項目、指定該頻道的心跳偵測目標，以及 `agents.*.models["<channel>/*"]` 覆寫。這可避免頻道執行階段已不存在，但設定仍要求閘道繫結至該頻道所造成的閘道啟動迴圈。
  </Accordion>
  <Accordion title="12. 閘道驗證檢查（本機權杖）">
    Doctor 會檢查本機閘道權杖驗證是否就緒。

    - 如果權杖模式需要權杖，但不存在任何權杖來源，doctor 會詢問是否產生權杖。
    - 如果 `gateway.auth.token` 由 SecretRef 管理但無法使用，doctor 會發出警告，且不會以純文字覆寫它。
    - `openclaw doctor --generate-gateway-token` 僅在未設定權杖 SecretRef 時才會強制產生權杖。

  </Accordion>
  <Accordion title="12b. 可感知 SecretRef 的唯讀修復">
    某些修復流程需要檢查已設定的認證資訊，同時不削弱執行階段快速失敗的行為。

    - `openclaw doctor --fix` 會使用與狀態系列命令相同的唯讀 SecretRef 摘要模型，以進行針對性的設定修復。
    - 範例：Telegram `allowFrom` / `groupAllowFrom` `@username` 修復會嘗試使用可用的已設定機器人認證資訊。
    - 如果 Telegram 機器人權杖透過 SecretRef 設定，但在目前的命令路徑中無法使用，doctor 會回報該認證資訊已設定但無法使用，並略過自動解析，而不是當機或誤報權杖遺失。

  </Accordion>
  <Accordion title="13. 閘道健康狀態檢查與重新啟動">
    Doctor 會執行健康狀態檢查，並在閘道看似不健康時詢問是否重新啟動。
  </Accordion>
  <Accordion title="13b. 記憶搜尋就緒狀態">
    Doctor 會檢查已設定的記憶搜尋嵌入提供者是否已為預設代理程式就緒。其行為取決於已設定的後端與提供者：

    - **QMD 後端**：探測 `qmd` 二進位檔是否可用且可啟動。若否，會列印修正指引，包括 `npm install -g @tobilu/qmd`（或 Bun 對應命令）以及手動指定二進位檔路徑的選項。
    - **明確指定的本機提供者**：檢查本機模型檔案或可辨識的遠端／可下載模型 URL。若遺失，會建議切換至遠端提供者。
    - **明確指定的遠端提供者**（`openai`、`voyage` 等）：驗證環境或驗證儲存區中是否存在 API 金鑰。若遺失，會列印可執行的修正提示。
    - **舊版自動提供者**：將 `memorySearch.provider: "auto"` 視為 OpenAI、檢查 OpenAI 就緒狀態，且 `doctor --fix` 會將其改寫為 `provider: "openai"`。

    如果有快取的閘道探測結果可用（檢查時閘道健康狀態正常），doctor 會將其結果與命令列介面可見的設定交叉比對，並註明任何不一致之處。Doctor 不會在預設路徑上啟動新的嵌入連線測試；若要即時檢查提供者，請使用深度記憶狀態命令。

    使用 `openclaw memory status --deep` 可在執行階段驗證嵌入就緒狀態。

  </Accordion>
  <Accordion title="14. 頻道狀態警告">
    如果閘道健康狀態正常，doctor 會執行頻道狀態探測，並回報警告及建議的修正方式。
  </Accordion>
  <Accordion title="15. 監督程式設定稽核與修復">
    Doctor 會檢查已安裝的監督程式設定（launchd/systemd/schtasks）是否缺少預設值或使用過時的預設值（例如 systemd 的 network-online 相依性與重新啟動延遲）。發現不符時，它會建議更新，並可將服務檔案／工作改寫為目前的預設值。

    注意事項：

    - `openclaw doctor` 會在改寫監督程式設定前提示確認。
    - `openclaw doctor --yes` 會接受預設的修復提示。
    - `openclaw doctor --fix` 會直接套用建議的修正而不提示（`--repair` 是別名）。
    - `openclaw doctor --fix --force` 會覆寫自訂監督程式設定。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` 會讓 doctor 對閘道服務生命週期保持唯讀。它仍會回報服務健康狀態並執行非服務修復，但會略過服務安裝／啟動／重新啟動／啟動程序、監督程式設定改寫，以及舊版服務清理，因為該生命週期由外部監督程式負責。
    - 在 Linux 上，當相符的 systemd 閘道單元處於作用中時，doctor 不會改寫命令／進入點中繼資料。它也會在重複服務掃描期間忽略非作用中且非舊版的額外類閘道單元，避免配套服務檔案產生清理雜訊。
    - 如果權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，doctor 的服務安裝／修復會驗證 SecretRef，但不會將解析後的純文字權杖值保存至監督程式服務環境中繼資料。
    - Doctor 會偵測舊版 LaunchAgent、systemd 或 Windows 排程工作安裝中以内嵌方式寫入的受管理 `.env`／SecretRef 支援服務環境值，並改寫服務中繼資料，使這些值改從執行階段來源載入，而非從監督程式定義載入。
    - Doctor 會偵測服務命令是否在 `gateway.port` 變更後仍固定使用舊的 `--port`，並將服務中繼資料改寫為目前的連接埠。
    - 如果權杖驗證需要權杖，而已設定的權杖 SecretRef 無法解析，doctor 會封鎖安裝／修復路徑並提供可執行的指引。
    - 如果 `gateway.auth.token` 與 `gateway.auth.password` 均已設定，而 `gateway.auth.mode` 未設定，doctor 會封鎖安裝／修復，直到明確設定模式為止。
    - 對於 Linux 使用者 systemd 單元，doctor 在比較服務驗證中繼資料時，權杖偏移檢查會同時納入 `Environment=` 與 `EnvironmentFile=` 來源。
    - 當設定最後由較新版本寫入時，doctor 的服務修復會拒絕使用較舊的 OpenClaw 二進位檔改寫、停止或重新啟動閘道服務。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)。
    - 你隨時可以透過 `openclaw gateway install --force` 強制完整改寫。

  </Accordion>
  <Accordion title="16. 閘道執行階段與連接埠診斷">
    Doctor 會檢查服務執行階段（PID、上次結束狀態），並在服務已安裝但實際未執行時發出警告。它也會檢查閘道連接埠（預設為 `18789`）是否發生連接埠衝突，並回報可能原因（閘道已在執行、SSH 通道）。
  </Accordion>
  <Accordion title="17. 閘道執行階段最佳實務">
    當閘道服務在 Bun 或版本管理工具所管理的 Node 路徑（`nvm`、`fnm`、`volta`、`asdf` 等）上執行時，doctor 會發出警告。Bun 無法開啟 OpenClaw 的 `node:sqlite` 狀態儲存區，因此修復會將舊版 Bun 服務移轉至 Node。版本管理工具路徑可能會在升級後失效，因為服務不會載入你的 shell 初始化設定。若有可用的系統 Node 安裝（Homebrew/apt/choco），doctor 會詢問是否移轉至該安裝。

    新安裝或修復的 macOS LaunchAgent 會使用標準系統 PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`），而不是複製互動式 shell 的 PATH，讓 Homebrew 管理的系統二進位檔維持可用，同時避免 Volta、asdf、fnm、pnpm 及其他版本管理工具目錄改變 Node 子程序所解析到的版本。Linux 服務仍會保留明確的環境根目錄（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）與穩定的使用者二進位檔目錄，但推測出的版本管理工具備援目錄只有在磁碟上實際存在時，才會寫入服務 PATH。

  </Accordion>
  <Accordion title="18. 寫入設定與精靈中繼資料">
    Doctor 會保存所有設定變更，並加上精靈中繼資料戳記以記錄這次 doctor 執行。
  </Accordion>
  <Accordion title="19. 工作區提示（備份與記憶系統）">
    當工作區缺少記憶系統時，doctor 會建議使用工作區記憶系統；如果工作區尚未納入 git 管理，則會顯示備份提示。

    如需工作區結構與 git 備份的完整指南，請參閱 [/concepts/agent-workspace](/zh-TW/concepts/agent-workspace)（建議使用私有 GitHub 或 GitLab）。

  </Accordion>
</AccordionGroup>

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
