---
read_when:
    - 瞭解 QA 堆疊如何整合運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞 Gateway 儀表板建置更高真實度的 QA 自動化
summary: QA 堆疊概觀：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-05-02T20:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更接近真實、
更貼近頻道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息頻道，具備 DM、頻道、討論串、
  回應、編輯與刪除介面。
- `extensions/qa-lab`：偵錯器 UI 與 QA 匯流排，用於觀察逐字記錄、
  注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的 runner Plugin：即時傳輸介面卡，
  會在子 QA gateway 內驅動真實頻道。
- `qa/`：由 repo 支援的種子資產，用於啟動任務與基準 QA
  情境。

## 命令介面

每個 QA 流程都會在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*`
指令碼別名；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 綁定的 QA 自我檢查；寫入 Markdown 報告。                                                                                                                              |
| `qa suite`                                          | 針對 QA Gateway lane 執行由 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass` 用於一次性 Linux VM。                                                  |
| `qa coverage`                                       | 列印 markdown 情境涵蓋率清單（`--json` 用於機器輸出）。                                                                                                                |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案並寫入代理式一致性報告。                                                                                                          |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                      |
| `qa manual`                                         | 針對選取的提供者/模型 lane 執行一次性提示。                                                                                                                           |
| `qa ui`                                             | 啟動 QA 偵錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                         |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                       |
| `qa docker-scaffold`                                | 寫入 QA 儀表板 + Gateway lane 的 docker-compose 腳手架。                                                                                                               |
| `qa up`                                             | 建置 QA site、啟動 Docker 支援的堆疊、列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                  |
| `qa aimock`                                         | 只啟動 AIMock 提供者伺服器。                                                                                                                                          |
| `qa mock-openai`                                    | 只啟動具備情境感知能力的 `mock-openai` 提供者伺服器。                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用 Convex 認證集區。                                                                                                                                            |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                               |
| `qa telegram`                                       | 針對真實私有 Telegram 群組的即時傳輸 lane。                                                                                                                           |
| `qa discord`                                        | 針對真實私有 Discord guild 頻道的即時傳輸 lane。                                                                                                                       |

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA site：

- 左側：含代理的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字記錄與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker 支援的 Gateway lane，並公開
QA Lab 頁面，讓操作者或自動化迴圈可以指派 QA
任務給代理、觀察真實頻道行為，並記錄哪些運作正常、失敗或
仍遭封鎖。

若要更快反覆開發 QA Lab UI，而不需每次都重新建置 Docker 映像，
請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像，並將
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch`
會在變更時重建該 bundle，而當 QA Lab
資產雜湊變更時，瀏覽器會自動重新載入。

若要進行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該指令碼會啟動本機 OTLP/HTTP trace 接收器，在啟用
`diagnostics-otel` Plugin 的情況下執行 `otel-trace-smoke` QA 情境，接著
解碼匯出的 protobuf spans，並斷言對發行至關重要的形狀：
必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled` 與 `openclaw.message.delivery`；
成功回合中的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 與
`openclaw.content.*` 屬性必須留在 trace 之外。它會將
`otel-smoke-summary.json` 寫在 QA suite 成品旁邊。

可觀測性 QA 僅限來源 checkout。npm tarball 會刻意省略
QA Lab，因此套件 Docker 發行 lane 不會執行 `qa` 命令。變更診斷
檢測時，請從已建置的來源 checkout 執行
`pnpm qa:otel:smoke`。

若要執行傳輸真實的 Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/情境目錄、env vars 與成品配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡要來說：它會在 Docker 中佈建一次性 Tuwunel homeserver、註冊暫時的 driver/SUT/observer 使用者、在限定於該傳輸的子 QA Gateway 中執行真實 Matrix Plugin（沒有 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events 成品與合併輸出日誌。

若要執行傳輸真實的 Telegram 與 Discord smoke lane：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

兩者都以預先存在的真實頻道為目標，並使用兩個 bot（driver + SUT）。必要 env vars、情境清單、輸出成品與 Convex 認證集區都記錄於下方的 [Telegram 與 Discord QA 參考](#telegram-and-discord-qa-reference)。

使用集區中的即時認證前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證 endpoint 設定，並在 maintainer secret 存在時確認 admin/list 可達性。它只會回報密鑰的已設定/缺少狀態。

## 即時傳輸涵蓋範圍

即時傳輸 lane 共用一份合約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，不屬於即時傳輸涵蓋矩陣。

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

這會讓 `qa-channel` 保持作為廣泛的產品行為 suite，同時讓 Matrix、
Telegram 與未來的即時傳輸共用一份明確的傳輸合約
檢查清單。

若要使用一次性 Linux VM lane，而不把 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝相依項目、在 guest 內建置 OpenClaw、
執行 `qa suite`，接著將一般 QA 報告與
摘要複製回 host 上的 `.artifacts/qa-e2e/...`。
它會重用與 host 上 `qa suite` 相同的情境選取行為。
Host 與 Multipass suite 執行預設會透過隔離的 Gateway worker
平行執行多個已選情境。`qa-channel` 預設 concurrency
為 4，並受限於選取的情境數量上限。使用 `--concurrency <count>` 調整
worker 數量，或使用 `--concurrency 1` 進行序列執行。
當任何情境失敗時，命令會以非零狀態結束。若你希望取得成品但不要失敗結束碼，
請使用 `--allow-failures`。
即時執行會轉送對 guest 來說實用且受支援的 QA auth 輸入：
以 env 為基礎的提供者金鑰、QA 即時提供者設定路徑，以及
存在時的 `CODEX_HOME`。請讓 `--output-dir` 位於 repo root 之下，讓 guest
可以透過掛載的工作區寫回。

## Telegram 與 Discord QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量與 Docker 支援的 homeserver 佈建較多。Telegram 與 Discord 較小，每個只有少數情境、沒有 profile 系統，且針對預先存在的真實頻道，因此其參考資料放在這裡。

### 共用 CLI 旗標

兩個 lane 都透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                    | 說明                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | 只執行這個情境。可重複使用。                                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 寫入報告/摘要/觀察到的訊息與輸出記錄的位置。相對路徑會依 `--repo-root` 解析。                                        |
| `--repo-root <path>`                  | `process.cwd()`                                           | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                                    |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 設定內的暫時帳戶 ID。                                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                     |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                          | 主要/替代模型參照。                                                                                                  |
| `--fast`                              | 關閉                                                      | 支援時的 provider 快速模式。                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                                     | 請參閱 [Convex 憑證集區](#convex-credential-pool)。                                                                  |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                         | `--credential-source convex` 時使用的角色。                                                                           |

任一情境失敗時，兩者都會以非零代碼結束。`--allow-failures` 會寫入成品，但不設定失敗結束代碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私有 Telegram 群組，內含兩個不同的機器人（驅動器 + SUT）。SUT 機器人必須有 Telegram 使用者名稱；當兩個機器人都在 `@BotFather` 啟用**機器人對機器人通訊模式**時，機器人對機器人觀察的效果最佳。

使用 `--credential-source env` 時必要的 env：

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
- `telegram-qa-summary.json` — 從 canary 開始，包含每次回覆的 RTT（驅動器傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` — 除非 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私有 Discord guild 頻道，內含兩個機器人：由測試工具控制的驅動器機器人，以及由子 OpenClaw Gateway 透過內建 Discord Plugin 啟動的 SUT 機器人。會驗證頻道提及處理，以及 SUT 機器人已向 Discord 註冊原生 `/help` 指令。

使用 `--credential-source env` 時必要的 env：

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
- `discord-qa-observed-messages.json` — 除非 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 憑證集區

Telegram 和 Discord lane 都可以從共用 Convex 集區租用憑證，而不是讀取上述 env vars。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨占租約，在執行期間持續傳送 Heartbeat，並在關機時釋放租約。集區種類為 `"telegram"` 和 `"discord"`。

broker 在 `admin/add` 驗證的 payload 形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必須是數字聊天 ID 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作 env vars 與 Convex broker 端點合約位於 [測試 → 透過 Convex 共用 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（章節名稱早於 Discord 支援；兩種種類的 broker 語意相同）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些檔案刻意放在 git 中，因此 QA 計畫對人類與 agent 都可見。

`qa-lab` 應維持為通用 Markdown 執行器。每個情境 Markdown 檔案都是一次測試執行的真實來源，並應定義：

- 情境中繼資料
- 選用的類別、能力、lane 與風險中繼資料
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用 runtime 表面可以保持通用且橫跨多處。舉例來說，Markdown 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，透過 Gateway `browser.request` seam 驅動嵌入式 Control UI，而不必新增特殊情況 runner。

情境檔案應依產品能力分組，而不是依來源樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 與 `codeRefs` 追蹤實作。

基準清單應保持足夠廣泛，以涵蓋：

- DM 與頻道聊天
- thread 行為
- 訊息動作生命週期
- Cron callback
- 記憶回想
- 模型切換
- subagent handoff
- 讀取儲存庫與讀取文件
- 一個小型建置工作，例如 Lobster Invaders

## Provider mock lanes

`qa suite` 有兩個本機 provider mock lane：

- `mock-openai` 是具備情境感知的 OpenClaw mock。它仍然是儲存庫支援 QA 與 parity gate 的預設確定性 mock lane。
- `aimock` 會啟動 AIMock 支援的 provider server，用於實驗性 protocol、fixture、record/replay 與 chaos 覆蓋。它是附加的，不會取代 `mock-openai` 情境 dispatcher。

Provider lane 實作位於 `extensions/qa-lab/src/providers/` 下。每個 provider 擁有自己的預設值、本機 server 啟動、Gateway 模型設定、auth-profile staged 需求，以及 live/mock 能力旗標。共用 suite 與 Gateway 程式碼應透過 provider registry 路由，而不是依 provider 名稱分支。

## 傳輸配接器

`qa-lab` 擁有 Markdown QA 情境的通用傳輸 seam。`qa-channel` 是該 seam 上的第一個配接器，但設計目標更廣：未來真實或合成頻道應接入同一個 suite runner，而不是新增特定傳輸的 QA runner。

在架構層級，拆分如下：

- `qa-lab` 擁有通用情境執行、worker concurrency、成品寫入與報告。
- 傳輸配接器擁有 Gateway 設定、readiness、入站與出站觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 Markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用 runtime 表面。

### 新增頻道

將頻道新增到 Markdown QA 系統只需要兩件事：

1. 該頻道的傳輸配接器。
2. 演練該頻道合約的情境套件。

當共用 `qa-lab` host 可以擁有流程時，不要新增新的頂層 QA 指令根。

`qa-lab` 擁有共用 host 機制：

- `openclaw qa` 指令根
- suite 啟動與拆除
- worker concurrency
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容別名

Runner plugins 擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共用 `qa` 根之下
- Gateway 如何針對該傳輸設定
- readiness 如何檢查
- 入站事件如何注入
- 出站訊息如何觀察
- transcripts 與正規化傳輸狀態如何公開
- 傳輸支援的動作如何執行
- 特定傳輸的 reset 或 cleanup 如何處理

新頻道的最低採用門檻：

1. 讓 `qa-lab` 保持為共用 `qa` 根的擁有者。
2. 在共用 `qa-lab` host seam 上實作傳輸 runner。
3. 將特定傳輸機制保留在 runner plugin 或頻道 harness 內。
4. 將 runner 掛載為 `openclaw qa <runner>`，而不是註冊互相競爭的根指令。Runner plugins 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；lazy CLI 與 runner 執行應留在獨立進入點之後。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或調整 Markdown 情境。
6. 對新情境使用通用情境輔助工具。
7. 除非儲存庫正在進行有意的 migration，否則保持現有相容別名可運作。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，請放在 `qa-lab`。
- 如果行為依賴一個頻道傳輸，請保留在該 runner plugin 或 plugin harness 中。
- 如果情境需要多個頻道可使用的新能力，請新增通用輔助工具，而不是在 `suite.ts` 中新增特定頻道分支。
- 如果某個行為只對一種傳輸有意義，請保持情境為特定傳輸，並在情境合約中明確說明。

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

現有情境仍可使用相容別名 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但撰寫新情境時應使用通用名稱。這些別名的存在是為了避免一次性 migration，而不是未來的模型。

## 報告

`qa-lab` 會從觀察到的 bus timeline 匯出 Markdown protocol 報告。
報告應回答：

- 哪些正常運作
- 哪些失敗
- 哪些仍被阻擋
- 哪些後續情境值得新增

如需取得可用情境的清單（在評估後續工作規模或接入新的傳輸層時很有用），請執行 `pnpm openclaw qa coverage`（加入 `--json` 可輸出機器可讀格式）。

如需進行角色與風格檢查，請在多個即時模型參照上執行相同情境，並寫出一份經評審的 Markdown 報告：

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

此命令會執行本機 QA Gateway 子程序，而不是 Docker。角色評估情境應透過 `SOUL.md` 設定 persona，然後執行一般使用者回合，例如聊天、工作區協助和小型檔案任務。不應告知候選模型它正在接受評估。此命令會保留每份完整 transcript、記錄基本執行統計資料，然後以快速模式詢問評審模型，並在支援時使用 `xhigh` 推理，依自然度、氛圍和幽默感排列各次執行。比較提供者時請使用 `--blind-judge-models`：評審提示仍會取得每份 transcript 和執行狀態，但候選參照會替換為中性標籤，例如 `candidate-01`；報告會在剖析後將排名對應回真實參照。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，支援的較舊 OpenAI 評估參照使用 `xhigh`。可用 `--model provider/model,thinking=<level>` 內嵌覆寫特定候選。`--thinking <level>` 仍會設定全域後備值，較舊的 `--model-thinking <provider/model=level>` 形式則保留以維持相容性。
OpenAI 候選參照預設使用快速模式，因此會在提供者支援時使用優先處理。單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在你想強制每個候選模型都開啟快速模式時，才傳入 `--fast`。報告會記錄候選與評審的持續時間，以供基準分析使用，但評審提示會明確要求不要依速度排名。
候選與評審模型執行的預設並行度皆為 16。當提供者限制或本機 Gateway 壓力使執行結果過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA Channel](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
