---
read_when:
    - 了解品質保證堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞 Gateway 儀表板建立更高擬真度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由 repo 支援的情境、即時傳輸通道、傳輸轉接器，以及報告。
title: QA 概觀
x-i18n:
    generated_at: "2026-05-03T21:31:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更接近真實、通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、執行緒、
  反應、編輯與刪除表面。
- `extensions/qa-lab`：偵錯器 UI 與 QA 匯流排，用於觀察逐字稿、
  注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的 runner plugins：即時傳輸介面卡，
  會在子 QA gateway 內驅動真實通道。
- `qa/`：由 repo 支援的啟動任務種子資產與基準 QA
  情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的錯誤，
  進行修正前後的即時驗證。

## 指令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多都有 `pnpm qa:*`
script 別名；兩種形式都受支援。

| 指令                                                | 用途                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 綁定的 QA 自我檢查；寫入 Markdown 報告。                                                                                                                             |
| `qa suite`                                          | 對 QA gateway lane 執行由 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性 Linux VM。                                                   |
| `qa coverage`                                       | 印出 markdown 情境涵蓋率清單（`--json` 用於機器輸出）。                                                                                                               |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案並寫入代理式同等性報告。                                                                                                         |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生評審報告。請參閱[報告](#reporting)。                                                                                         |
| `qa manual`                                         | 對選取的 provider/model lane 執行一次性提示。                                                                                                                        |
| `qa ui`                                             | 啟動 QA 偵錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                        |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                      |
| `qa docker-scaffold`                                | 寫入 QA dashboard + gateway lane 的 docker-compose scaffold。                                                                                                         |
| `qa up`                                             | 建置 QA site、啟動 Docker 支援的 stack、印出 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                |
| `qa aimock`                                         | 只啟動 AIMock provider server。                                                                                                                                      |
| `qa mock-openai`                                    | 只啟動具情境感知的 `mock-openai` provider server。                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用 Convex credential pool。                                                                                                                                     |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                               |
| `qa telegram`                                       | 針對真實私有 Telegram 群組的即時傳輸 lane。                                                                                                                          |
| `qa discord`                                        | 針對真實私有 Discord guild channel 的即時傳輸 lane。                                                                                                                  |
| `qa mantis`                                         | 用於即時傳輸錯誤修正前後驗證的 runner，包含第一個 Discord 狀態反應情境。請參閱 [Mantis](/zh-TW/concepts/mantis)。                                                          |

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA site：

- 左側：帶有代理程式的 Gateway dashboard（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿與情境計畫。

使用以下指令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker 支援的 gateway lane，並公開
QA Lab 頁面，讓操作者或自動化迴圈可以給代理程式 QA
任務、觀察真實通道行為，並記錄哪些成功、失敗或
仍受阻。

若要更快反覆開發 QA Lab UI，而不必每次都重建 Docker 映像，
請使用 bind-mounted QA Lab bundle 啟動 stack：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像，並將
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` container。`qa:lab:watch`
會在變更時重建該 bundle，而當 QA Lab
資產 hash 變更時，瀏覽器會自動重新載入。

若要進行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該 script 會啟動本機 OTLP/HTTP trace receiver，在啟用
`diagnostics-otel` plugin 的情況下執行 `otel-trace-smoke` QA 情境，然後
解碼匯出的 protobuf spans，並斷言發布關鍵形狀：
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled` 與 `openclaw.message.delivery` 必須存在；
模型呼叫在成功回合中不得匯出 `StreamAbandoned`；原始診斷 ID 與
`openclaw.content.*` attributes 必須留在 trace 之外。它會在 QA suite artifacts 旁寫入
`otel-smoke-summary.json`。

可觀測性 QA 僅限 source checkout。npm tarball 會刻意省略
QA Lab，因此 package Docker release lanes 不會執行 `qa` 指令。變更 diagnostics
instrumentation 時，請從已建置的 source checkout 使用
`pnpm qa:otel:smoke`。

若要執行 transport-real Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/scenario 目錄、env vars 與 artifact 版面配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。概略來說：它會在 Docker 中佈建一次性 Tuwunel homeserver、註冊臨時 driver/SUT/observer 使用者、在範圍限定於該傳輸的子 QA gateway 內執行真實 Matrix plugin（沒有 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events artifact 與合併輸出記錄。

針對 transport-real Telegram 與 Discord smoke lanes：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

兩者都以既有真實通道為目標，並使用兩個 bots（driver + SUT）。必要 env vars、情境清單、輸出 artifacts 與 Convex credential pool 記錄於下方的 [Telegram 與 Discord QA 參考](#telegram-and-discord-qa-reference)。

使用 pooled live credentials 前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證 endpoint 設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會回報 secret 的已設定/缺漏狀態。

## 即時傳輸涵蓋率

即時傳輸 lanes 共用一份契約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，不屬於即時傳輸涵蓋率矩陣。

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

這會讓 `qa-channel` 保持作為廣泛的產品行為 suite，同時 Matrix、
Telegram 與未來即時傳輸共用一份明確的傳輸契約
檢查清單。

若要在不將 Docker 帶入 QA 路徑的情況下執行一次性 Linux VM lane，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝 dependencies、在 guest 內建置 OpenClaw、
執行 `qa suite`，然後將正常 QA 報告與
摘要複製回 host 上的 `.artifacts/qa-e2e/...`。
它會重用與 host 上 `qa suite` 相同的情境選取行為。
Host 與 Multipass suite runs 預設會使用隔離的 gateway workers 平行執行多個選取情境。
`qa-channel` 預設 concurrency 為
4，並受選取的情境數量限制。使用 `--concurrency <count>` 調整
worker 數量，或使用 `--concurrency 1` 進行序列執行。
當任何情境失敗時，指令會以非零碼結束。若你想要 artifacts 但不想要失敗的 exit code，
請使用 `--allow-failures`。
Live runs 會轉送對 guest 實用且受支援的 QA auth inputs：
env-based provider keys、QA live provider config path，以及
`CODEX_HOME`（若存在）。請將 `--output-dir` 保持在 repo root 下，讓 guest
可以透過掛載的 workspace 寫回。

## Telegram 與 Discord QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量與 Docker-backed homeserver 佈建較多。Telegram 與 Discord 較小型，每個只有少數情境、沒有 profile system，並針對既有真實通道，因此它們的參考放在這裡。

### 共用 CLI flags

兩個 lanes 都透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同 flags：

| Flag                                  | Default                                                   | Description                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | 只執行此情境。可重複指定。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 寫入報告、摘要、觀察到的訊息與輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                           | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 設定內的暫時帳號 ID。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可運作）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | 提供者預設值                                          | 主要/替代模型參照。                                                                                         |
| `--fast`                              | 關閉                                                       | 支援時使用提供者快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | 請參閱 [Convex 憑證池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                        | 使用 `--credential-source convex` 時採用的角色。                                                                          |

任何情境失敗時，兩者都會以非零狀態結束。`--allow-failures` 會寫入成品，但不會設定失敗的結束代碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的 Bot（driver + SUT）。SUT Bot 必須有 Telegram 使用者名稱；當兩個 Bot 都在 `@BotFather` 啟用 **Bot-to-Bot Communication Mode** 時，Bot 對 Bot 觀察的效果最佳。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 數字 chat id（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

選用：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留訊息本文（預設會遮蔽）。

情境（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

輸出成品：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 包含從 canary 開始的每則回覆 RTT（driver 傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild 頻道，並使用兩個 Bot：由測試框架控制的 driver Bot，以及由子 OpenClaw Gateway 透過內建 Discord Plugin 啟動的 SUT Bot。會驗證頻道提及處理、SUT Bot 已向 Discord 註冊原生 `/help` 指令，以及選擇啟用的 Mantis 證據情境。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必須符合 Discord 回傳的 SUT Bot 使用者 ID（否則該通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 選擇啟用的 Mantis 情境。因為它會將 SUT 切換為永遠開啟、僅工具的 guild 回覆，並設定 `messages.statusReactions.enabled=true`，接著擷取 REST reaction 時間軸以及 HTML/PNG 視覺成品，所以會單獨執行。

明確執行 Mantis status-reaction 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

輸出成品：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。
- 執行 status-reaction 情境時，會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Convex 憑證池

Telegram 和 Discord 通道都可以從共用的 Convex 池租用憑證，而不是讀取上方 env vars。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨佔租約、在執行期間對租約送出 Heartbeat，並在關閉時釋放租約。池種類為 `"telegram"` 和 `"discord"`。

Broker 在 `admin/add` 驗證的 payload 形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必須是數字 chat-id 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作用 env vars 與 Convex broker 端點合約位於 [測試 → 透過 Convex 共用 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該區段名稱早於 Discord 支援；兩種種類的 broker 語義相同）。

## Repo 支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些刻意放在 git 中，讓 QA 計畫對人類與代理都可見。

`qa-lab` 應保持為通用 markdown 執行器。每個情境 markdown 檔案都是一次測試執行的事實來源，並應定義：

- 情境中繼資料
- 選用的分類、能力、通道與風險中繼資料
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定 patch
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用 runtime 介面可以維持通用且跨領域。例如，markdown 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，透過 Gateway `browser.request` seam 驅動內嵌 Control UI，而不需要加入特殊案例執行器。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 追蹤實作。

基準清單應保持足夠廣泛，以涵蓋：

- DM 與頻道聊天
- thread 行為
- 訊息動作生命週期
- cron callback
- 記憶回想
- 模型切換
- 子代理交接
- 儲存庫讀取與文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## 提供者模擬通道

`qa suite` 有兩個本機提供者模擬通道：

- `mock-openai` 是具備情境感知能力的 OpenClaw 模擬。它仍是 repo 支援 QA 與 parity gate 的預設決定性模擬通道。
- `aimock` 會啟動 AIMock 支援的提供者伺服器，用於實驗性協定、fixture、record/replay 與 chaos 覆蓋。它是加成項，不會取代 `mock-openai` 情境分派器。

提供者通道實作位於 `extensions/qa-lab/src/providers/`。每個提供者都擁有自己的預設值、本機伺服器啟動、Gateway 模型設定、auth-profile 暫存需求，以及 live/mock 能力旗標。共用 suite 與 Gateway 程式碼應透過提供者登錄路由，而不是依提供者名稱分支。

## 傳輸配接器

`qa-lab` 擁有用於 markdown QA 情境的通用傳輸 seam。`qa-channel` 是該 seam 上的第一個配接器，但設計目標更廣：未來真實或合成頻道應接入同一個 suite 執行器，而不是新增傳輸專用 QA 執行器。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、worker 並行、成品寫入與報告。
- 傳輸配接器擁有 Gateway 設定、就緒狀態、輸入與輸出觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用 runtime 介面。

### 新增頻道

將頻道加入 markdown QA 系統只需要兩件事：

1. 該頻道的傳輸配接器。
2. 測試該頻道合約的情境包。

當共用 `qa-lab` host 可以擁有流程時，請勿新增頂層 QA 指令根。

`qa-lab` 擁有共用 host 機制：

- `openclaw qa` 指令根
- suite 啟動與拆卸
- worker 並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容 alias

執行器 Plugin 擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共用 `qa` 根底下
- 如何為該傳輸設定 Gateway
- 如何檢查就緒狀態
- 如何注入輸入事件
- 如何觀察輸出訊息
- 如何公開 transcript 與正規化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸專用 reset 或清理

新頻道的最低採用門檻：

1. 讓 `qa-lab` 繼續作為共用 `qa` 根的擁有者。
2. 在共用 `qa-lab` host seam 上實作傳輸執行器。
3. 將傳輸專用機制保留在執行器 Plugin 或頻道測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊競爭的根指令。執行器 Plugin 應在 `openclaw.plugin.json` 宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；lazy CLI 與執行器執行應留在個別進入點後方。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或改寫 markdown 情境。
6. 為新情境使用通用情境輔助工具。
7. 除非儲存庫正在進行有意的遷移，否則保持既有相容 alias 可運作。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為取決於單一頻道傳輸，就保留在該執行器 Plugin 或 Plugin 測試框架中。
- 如果某個情境需要多個頻道都能使用的新能力，請新增通用輔助工具，而不是在 `suite.ts` 中加入頻道專用分支。
- 如果某個行為只對單一傳輸有意義，請讓情境維持傳輸專用，並在情境合約中明確表示。

### 情境輔助工具名稱

新情境偏好的通用輔助工具：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

相容性別名仍可用於現有情境 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但新的情境撰寫應使用通用名稱。這些別名的存在是為了避免一次性遷移，而不是未來的模式。

## 回報

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些項目正常運作
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得加入

若要取得可用情境的清單 — 在評估後續工作規模或接入新傳輸時很有用 — 請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。

若要進行角色與風格檢查，請在多個即時模型
refs 上執行相同情境，並寫出經評審的 Markdown 報告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

此命令會執行本機 QA Gateway 子程序，而不是 Docker。角色評估
情境應透過 `SOUL.md` 設定 persona，然後執行一般使用者回合，
例如聊天、工作區協助，以及小型檔案任務。不應告知候選模型
它正在被評估。此命令會保留每份完整
transcript，記錄基本執行統計資料，然後在支援時以快速模式搭配
`xhigh` reasoning 詢問評審模型，依自然度、氛圍和幽默感為執行結果排名。
比較不同提供者時請使用 `--blind-judge-models`：評審提示仍會取得
每份 transcript 和執行狀態，但候選 refs 會被替換為中性的
標籤，例如 `candidate-01`；報告會在解析後將排名對應回真實 refs。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，較舊且支援的 OpenAI 評估 refs 使用 `xhigh`。可用
`--model provider/model,thinking=<level>` 內嵌覆寫特定候選。`--thinking <level>` 仍會設定
全域備援，而較舊的 `--model-thinking <provider/model=level>` 形式會
保留以維持相容性。
OpenAI 候選 refs 預設使用快速模式，因此在提供者支援時會使用
優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在你想要
強制所有候選模型開啟快速模式時，才傳入 `--fast`。候選與評審的耗時會
記錄在報告中供基準分析使用，但評審提示會明確說明
不要依速度排名。
候選與評審模型執行預設並行度皆為 16。當提供者限制或本機 Gateway
壓力使執行過於嘈雜時，請降低
`--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設會使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`，以及
`google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA 通道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
