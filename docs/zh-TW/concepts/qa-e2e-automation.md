---
read_when:
    - 了解品質保證堆疊如何相互配合
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的品質保證情境
    - 圍繞 Gateway 儀表板建構更高擬真度的 QA 自動化
summary: QA 堆疊概觀：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告功能。
title: 品質保證概覽
x-i18n:
    generated_at: "2026-04-30T03:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更貼近真實、具通道形態的方式測試 OpenClaw。

目前組件：

- `extensions/qa-channel`：合成訊息通道，具備私訊、頻道、執行緒、反應、編輯和刪除介面。
- `extensions/qa-lab`：用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告的偵錯器 UI 與 QA 匯流排。
- `extensions/qa-matrix`、未來的 runner Plugin：即時傳輸配接器，可在子 QA Gateway 內驅動真實通道。
- `qa/`：由 repo 支援的種子資產，用於啟動任務與基準 QA 情境。

## 指令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*` 指令碼別名；兩種形式都受支援。

| 指令                                                | 用途                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                    |
| `qa suite`                                          | 對 QA Gateway 路徑執行 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性的 Linux VM。                                                       |
| `qa coverage`                                       | 列印 Markdown 情境涵蓋率清單（`--json` 用於機器輸出）。                                                                                                                   |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，並寫入代理式同等性閘道報告。                                                                                                       |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生評審報告。請參閱[報告](#reporting)。                                                                                                |
| `qa manual`                                         | 針對選定的提供者/模型路徑執行一次性提示。                                                                                                                                 |
| `qa ui`                                             | 啟動 QA 偵錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                            |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像檔。                                                                                                                                         |
| `qa docker-scaffold`                                | 為 QA 儀表板 + Gateway 路徑寫入 docker-compose 鷹架。                                                                                                                     |
| `qa up`                                             | 建置 QA 網站、啟動 Docker 支援的堆疊、列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                      |
| `qa aimock`                                         | 只啟動 AIMock 提供者伺服器。                                                                                                                                              |
| `qa mock-openai`                                    | 只啟動具情境感知的 `mock-openai` 提供者伺服器。                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 認證集區。                                                                                                                                              |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸路徑。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                    |
| `qa telegram`                                       | 針對真實私人 Telegram 群組的即時傳輸路徑。                                                                                                                                |
| `qa discord`                                        | 針對真實私人 Discord guild 頻道的即時傳輸路徑。                                                                                                                           |

## 操作員流程

目前的 QA 操作員流程是雙窗格 QA 網站：

- 左側：含代理的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿與情境計畫。

使用以下指令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動 Docker 支援的 Gateway 路徑，並公開 QA Lab 頁面，讓操作員或自動化迴圈可以給代理一項 QA 任務、觀察真實通道行為，並記錄哪些有效、失敗或仍受阻。

若要在不每次重建 Docker 映像檔的情況下更快地迭代 QA Lab UI，請使用繫結掛載的 QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像檔，並將 `extensions/qa-lab/web/dist` 繫結掛載到 `qa-lab` 容器中。`qa:lab:watch` 會在變更時重建該 bundle，而瀏覽器會在 QA Lab 資產雜湊變更時自動重新載入。

若要執行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該指令碼會啟動本機 OTLP/HTTP trace 接收器，在啟用 `diagnostics-otel` Plugin 的情況下執行 `otel-trace-smoke` QA 情境，接著解碼匯出的 protobuf spans，並斷言發布關鍵形狀：必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功回合中的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 和 `openclaw.content.*` 屬性必須留在 trace 之外。它會在 QA suite 成果物旁寫入 `otel-smoke-summary.json`。

可觀測性 QA 僅保留於原始碼 checkout。npm tarball 會刻意省略 QA Lab，因此 package Docker 發布路徑不會執行 `qa` 指令。變更診斷儀表化時，請從已建置的原始碼 checkout 使用 `pnpm qa:otel:smoke`。

若要執行傳輸真實的 Matrix smoke 路徑，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此路徑的完整 CLI 參考、設定檔/情境目錄、環境變數和成果物配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡言之：它會在 Docker 中佈建一次性 Tuwunel homeserver、註冊暫時的 driver/SUT/observer 使用者、在限定於該傳輸的子 QA Gateway 內執行真實 Matrix Plugin（沒有 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、觀察事件成果物，以及合併輸出記錄。

若要執行傳輸真實的 Telegram 與 Discord smoke 路徑：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

兩者都以預先存在的真實通道與兩個 bot（driver + SUT）為目標。必要的環境變數、情境清單、輸出成果物，以及 Convex 認證集區，都記錄於下方的 [Telegram 與 Discord QA 參考](#telegram-and-discord-qa-reference)。

使用集區中的即時認證之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境、驗證端點設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會報告 secret 的已設定/缺少狀態。

## 即時傳輸涵蓋範圍

即時傳輸路徑共用一份合約，而不是各自發明情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，並不屬於即時傳輸涵蓋矩陣的一部分。

| 路徑     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

這會讓 `qa-channel` 保持作為廣泛的產品行為 suite，同時讓 Matrix、Telegram 和未來的即時傳輸共用一份明確的傳輸合約檢查清單。

若要在不把 Docker 帶入 QA 路徑的情況下執行一次性 Linux VM 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝相依套件、在 guest 內建置 OpenClaw、執行 `qa suite`，接著將一般 QA 報告與摘要複製回 host 上的 `.artifacts/qa-e2e/...`。
它會重用與 host 上 `qa suite` 相同的情境選擇行為。
Host 和 Multipass suite 執行預設會使用隔離的 Gateway worker 平行執行多個已選情境。`qa-channel` 預設並行度為 4，並受已選情境數量限制。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
當任何情境失敗時，指令會以非零狀態結束。當你想要成果物但不想要失敗結束碼時，請使用 `--allow-failures`。
即時執行會轉送對 guest 實用且受支援的 QA 驗證輸入：基於環境的提供者金鑰、QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo 根目錄下，讓 guest 能透過掛載的工作區寫回。

## Telegram 與 Discord QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它有較多情境數量，以及 Docker 支援的 homeserver 佈建。Telegram 和 Discord 較小，每個只有少數情境、沒有設定檔系統，並且針對預先存在的真實通道，因此它們的參考位於此處。

### 共用 CLI 旗標

兩個路徑都透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同的旗標：

| 旗標                                  | 預設值                                                   | 說明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | 只執行此情境。可重複指定。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 寫入報告、摘要、觀察到的訊息與輸出日誌的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                           | 從中性 cwd 呼叫時的儲存庫根目錄。                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 設定內的暫時帳號 ID。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | 提供者預設值                                          | 主要／替代模型參照。                                                                                         |
| `--fast`                              | 關閉                                                       | 在支援時使用提供者快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | 請參閱 [Convex 憑證池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                        | 使用 `--credential-source convex` 時採用的角色。                                                                          |

任何情境失敗時，兩者都會以非零狀態碼結束。`--allow-failures` 會寫入成品，但不會設定失敗的退出碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的機器人（驅動程式 + SUT）。SUT 機器人必須有 Telegram 使用者名稱；當兩個機器人都在 `@BotFather` 啟用 **Bot-to-Bot Communication Mode** 時，機器人對機器人的觀察效果最佳。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 數字聊天 ID（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

選用：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文（預設會遮蔽）。

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
- `telegram-qa-summary.json` — 包含從 canary 開始的每則回覆 RTT（驅動程式傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild 頻道，並使用兩個機器人：由測試框架控制的驅動程式機器人，以及由子 OpenClaw Gateway 透過隨附的 Discord Plugin 啟動的 SUT 機器人。驗證頻道提及處理，以及 SUT 機器人已向 Discord 註冊原生 `/help` 指令。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必須符合 Discord 傳回的 SUT 機器人使用者 ID（否則該 lane 會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

輸出成品：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 憑證池

Telegram 與 Discord 兩個 lane 都可以從共享的 Convex 池租用憑證，而不是讀取上述環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨占租約，在執行期間送出 Heartbeat，並在關閉時釋放租約。池種類為 `"telegram"` 與 `"discord"`。

broker 會在 `admin/add` 驗證的酬載形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必須是數字聊天 ID 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作用環境變數與 Convex broker 端點合約位於 [測試 → 透過 Convex 共享 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該章節名稱早於 Discord 支援；兩種種類的 broker 語意相同）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些內容有意納入 git，讓 QA 計畫可同時被人類與
代理程式看見。

`qa-lab` 應保持為通用 Markdown runner。每個情境 Markdown 檔案都是
單次測試執行的真實來源，並應定義：

- 情境中繼資料
- 選用的類別、能力、lane 與風險中繼資料
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支撐 `qa-flow` 的可重用執行階段介面可保持通用且跨領域。例如，Markdown 情境可以結合傳輸端
輔助工具與瀏覽器端輔助工具，透過
Gateway `browser.request` seam 驅動嵌入式 Control UI，而不需加入特殊案例 runner。

情境檔案應依產品能力分組，而不是依原始碼樹
資料夾分組。移動檔案時保持情境 ID 穩定；使用 `docsRefs` 與 `codeRefs`
追蹤實作可追溯性。

基準清單應保持足夠廣泛，以涵蓋：

- DM 與頻道聊天
- thread 行為
- 訊息動作生命週期
- Cron 回呼
- 記憶回想
- 模型切換
- 子代理程式交接
- 讀取儲存庫與讀取文件
- 一個小型建置任務，例如 Lobster Invaders

## 提供者模擬 lane

`qa suite` 有兩個本機提供者模擬 lane：

- `mock-openai` 是具情境感知的 OpenClaw 模擬。它仍是儲存庫支援 QA 與一致性 gate 的預設
  確定性模擬 lane。
- `aimock` 會啟動 AIMock 支援的提供者伺服器，用於實驗性通訊協定、
  fixture、record/replay 與混沌涵蓋。它是增補性的，不會
  取代 `mock-openai` 情境 dispatcher。

提供者 lane 實作位於 `extensions/qa-lab/src/providers/` 下。
每個提供者擁有自己的預設值、本機伺服器啟動、Gateway 模型設定、
auth-profile 暫存需求，以及 live/mock 能力旗標。共享 suite 與
Gateway 程式碼應透過提供者登錄路由，而不是依提供者名稱分支。

## 傳輸配接器

`qa-lab` 擁有用於 Markdown QA 情境的通用傳輸 seam。`qa-channel` 是該 seam 上的第一個配接器，但設計目標更廣：未來的真實或合成頻道應接入同一個 suite runner，而不是加入傳輸專用 QA runner。

在架構層級，拆分如下：

- `qa-lab` 擁有通用情境執行、worker 並行、成品寫入與報告。
- 傳輸配接器擁有 Gateway 設定、就緒狀態、入站與出站觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 Markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用執行階段介面。

### 新增頻道

將頻道加入 Markdown QA 系統只需要兩件事：

1. 該頻道的傳輸配接器。
2. 驗證頻道合約的情境套件。

當共享的 `qa-lab` host 能擁有流程時，不要新增新的頂層 QA 指令根。

`qa-lab` 擁有共享 host 機制：

- `openclaw qa` 指令根
- suite 啟動與拆卸
- worker 並行
- 成品寫入
- 報告產生
- 情境執行
- 較舊 `qa-channel` 情境的相容別名

Runner Plugin 擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共享 `qa` 根底下
- Gateway 如何為該傳輸設定
- 如何檢查就緒狀態
- 如何注入入站事件
- 如何觀察出站訊息
- 如何公開 transcript 與正規化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸專用重設或清理

新頻道的最低採用門檻：

1. 保持 `qa-lab` 作為共享 `qa` 根的擁有者。
2. 在共享 `qa-lab` host seam 上實作傳輸 runner。
3. 將傳輸專用機制保留在 runner Plugin 或頻道測試框架內。
4. 將 runner 掛載為 `openclaw qa <runner>`，而不是註冊競爭性的根指令。Runner Plugin 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲 CLI 與 runner 執行應留在獨立進入點後方。
5. 在主題化的 `qa/scenarios/` 目錄下撰寫或改寫 Markdown 情境。
6. 對新情境使用通用情境輔助工具。
7. 除非儲存庫正在進行有意的遷移，否則保持現有相容別名可用。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，請放在 `qa-lab`。
- 如果行為取決於單一頻道傳輸，請保留在該 runner Plugin 或 Plugin 測試框架中。
- 如果某個情境需要超過一個頻道可使用的新能力，請新增通用輔助工具，而不是在 `suite.ts` 中加入頻道專用分支。
- 如果某個行為只對單一傳輸有意義，請保持情境為傳輸專用，並在情境合約中明確說明。

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

相容別名仍可供既有情境使用 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但新情境撰寫應使用通用名稱。這些別名存在是為了避免一次性遷移，而不是作為往後的模型。

## 報告

`qa-lab` 會從觀察到的 bus 時間軸匯出 Markdown 通訊協定報告。
報告應回答：

- 哪些項目正常運作
- 哪些項目失敗
- 哪些項目仍被阻擋
- 哪些後續情境值得新增

若要查看可用情境的清單，這在估算後續工作或接入新傳輸層時很有用，請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。

若要進行角色與風格檢查，請在多個即時模型參照上執行相同情境，
並寫入一份經評審的 Markdown 報告：

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
情境應透過 `SOUL.md` 設定人物設定，然後執行一般使用者回合，
例如聊天、工作區協助，以及小型檔案任務。不應告訴候選模型
它正在接受評估。此命令會保留每份完整對話記錄，記錄基本執行統計，
然後要求評審模型以快速模式，並在支援處使用 `xhigh` 推理，
依自然度、氛圍和幽默感排列執行結果。
比較供應商時請使用 `--blind-judge-models`：評審提示仍會取得
每份對話記錄和執行狀態，但候選參照會替換為中性標籤，
例如 `candidate-01`；報告會在剖析後將排名映射回真實參照。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，
較舊且支援的 OpenAI 評估參照使用 `xhigh`。可使用
`--model provider/model,thinking=<level>` 針對特定候選內嵌覆寫。
`--thinking <level>` 仍會設定全域後援，而較舊的
`--model-thinking <provider/model=level>` 形式會為了相容性保留。
OpenAI 候選參照預設使用快速模式，因此供應商支援時會使用
優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast`
或 `,fast=false`。只有在你想強制每個候選模型都啟用快速模式時，
才傳入 `--fast`。候選與評審的耗時會記錄在報告中以供基準分析，
但評審提示會明確要求不要依速度排名。
候選與評審模型執行的預設並行度都是 16。當供應商限制或本機 Gateway
壓力讓執行結果過於嘈雜時，請降低 `--concurrency` 或
`--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設會使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
