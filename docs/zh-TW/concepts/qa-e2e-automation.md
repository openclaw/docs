---
read_when:
    - 了解 QA 堆疊如何整合運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的品質保證情境
    - 圍繞 Gateway 儀表板建構更高真實度的品質保證自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器，以及報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-05-04T07:04:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更貼近真實、通道形態的方式演練 OpenClaw。

目前組件：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、執行緒、反應、編輯與刪除介面。
- `extensions/qa-lab`：除錯器 UI 與 QA 匯流排，用於觀察文字記錄、注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的 runner Plugin：即時傳輸配接器，用於在子 QA Gateway 內驅動真實通道。
- `qa/`：由 repo 支援的啟動任務種子資產與基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的錯誤，進行修復前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多命令有 `pnpm qa:*` 指令碼別名；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                                               |
| `qa suite`                                          | 針對 QA Gateway lane 執行 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass` 用於一次性的 Linux VM。                                                                                  |
| `qa coverage`                                       | 列印 Markdown 情境覆蓋清單（`--json` 用於機器輸出）。                                                                                                                                                 |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，並寫入代理式對等報告。                                                                                                                                         |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生評審報告。請參閱[報告](#reporting)。                                                                                                                           |
| `qa manual`                                         | 針對所選 provider/model lane 執行一次性 prompt。                                                                                                                                                     |
| `qa ui`                                             | 啟動 QA 除錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                        |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像檔。                                                                                                                                                                    |
| `qa docker-scaffold`                                | 寫入 QA 儀表板 + Gateway lane 的 docker-compose scaffold。                                                                                                                                            |
| `qa up`                                             | 建置 QA site、啟動 Docker 支援的堆疊，並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                               |
| `qa aimock`                                         | 僅啟動 AIMock provider 伺服器。                                                                                                                                                                      |
| `qa mock-openai`                                    | 僅啟動可感知情境的 `mock-openai` provider 伺服器。                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 憑證集區。                                                                                                                                                                        |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                             |
| `qa telegram`                                       | 針對真實私人 Telegram 群組的即時傳輸 lane。                                                                                                                                                          |
| `qa discord`                                        | 針對真實私人 Discord guild 頻道的即時傳輸 lane。                                                                                                                                                     |
| `qa slack`                                          | 針對真實私人 Slack 頻道的即時傳輸 lane。                                                                                                                                                             |
| `qa mantis`                                         | 用於即時傳輸錯誤的修復前後驗證 runner，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis)。                                           |

## 操作員流程

目前的 QA 操作員流程是一個雙窗格 QA site：

- 左側：包含代理的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 的文字記錄與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker 支援的 Gateway lane，並公開 QA Lab 頁面，讓操作員或自動化迴圈可以給代理一個 QA 任務、觀察真實通道行為，並記錄哪些運作正常、失敗或仍受阻。

若要更快迭代 QA Lab UI，而不必每次都重新建置 Docker 映像檔，請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 讓 Docker 服務使用預建映像檔，並將 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch` 會在變更時重新建置該 bundle，而當 QA Lab 資產 hash 變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該指令碼會啟動本機 OTLP/HTTP trace 接收器，在啟用 `diagnostics-otel` Plugin 的情況下執行 `otel-trace-smoke` QA 情境，然後解碼匯出的 protobuf spans，並斷言發行關鍵形狀：`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 與 `openclaw.message.delivery` 必須存在；成功回合中的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 與 `openclaw.content.*` 屬性必須留在 trace 之外。它會在 QA suite artifacts 旁寫入 `otel-smoke-summary.json`。

可觀測性 QA 僅保留於來源 checkout。npm tarball 會刻意省略 QA Lab，因此套件 Docker release lane 不會執行 `qa` 命令。變更診斷檢測時，請從已建置的來源 checkout 執行 `pnpm qa:otel:smoke`。

若要執行 transport-real Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/情境目錄、env vars 與 artifact 版面配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。概覽如下：它會在 Docker 中佈建一次性 Tuwunel homeserver，註冊臨時 driver/SUT/observer 使用者，在限定於該傳輸的子 QA Gateway 內執行真實 Matrix Plugin（不含 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events artifact 與合併輸出 log。

若要執行 transport-real Telegram、Discord 與 Slack smoke lane：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們會以預先存在且真實的通道為目標，並使用兩個 bot（driver + SUT）。必要 env vars、情境清單、輸出 artifacts 與 Convex 憑證集區記錄在下方的 [Telegram、Discord 與 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

若要執行包含 VNC 救援的完整 Slack 桌面 VM 執行，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox 桌面/瀏覽器機器，在 VM 內執行 Slack 即時 lane，在 VNC 瀏覽器中開啟 Slack Web，擷取桌面，並將 `slack-qa/` 與 `slack-desktop-smoke.png` 複製回 Mantis artifact 目錄。透過 VNC 手動登入 Slack Web 後，請重複使用 `--lease-id <cbx_...>`。使用 `--gateway-setup` 時，Mantis 會在 VM 內留下持久執行的 OpenClaw Slack Gateway，連接埠為 `38973`；未使用時，該命令會執行一般 bot-to-bot Slack QA lane，並在擷取 artifact 後結束。

使用集區中的即時憑證前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證 endpoint 設定，並在存在 maintainer secret 時確認 admin/list 可連線性。它只會回報 secret 的已設定/缺漏狀態。

## 即時傳輸覆蓋範圍

即時傳輸 lane 共用同一份合約，而不是各自發明情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，不屬於即時傳輸覆蓋矩陣。

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

這會將 `qa-channel` 保留為廣泛的產品行為 suite，同時讓 Matrix、Telegram 與未來的即時傳輸共用一份明確的傳輸合約檢查清單。

若要執行一次性 Linux VM lane，且不將 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動新的 Multipass 客體、安裝相依套件、在客體內建置 OpenClaw，執行 `qa suite`，然後將一般 QA 報告和摘要複製回主機上的 `.artifacts/qa-e2e/...`。
它會重用與主機上 `qa suite` 相同的情境選擇行為。
主機和 Multipass 套件執行預設會使用隔離的 gateway workers 並行執行多個已選情境。`qa-channel` 預設並行數為 4，並受限於已選情境數。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
當任何情境失敗時，命令會以非零狀態結束。當你需要產物但不想要失敗結束碼時，請使用 `--allow-failures`。
Live 執行會轉送對客體實用且受支援的 QA 驗證輸入：以 env 為基礎的 provider keys、QA live provider config path，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓客體能透過已掛載的工作區寫回。

## Telegram、Discord 和 Slack QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量和 Docker-backed homeserver 佈建較多。Telegram、Discord 和 Slack 較小型，每個只有少數情境、沒有 profile system，並針對預先存在的真實 channels，因此它們的參考資料放在這裡。

### 共用 CLI 旗標

這些 lanes 透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                          | 說明                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 只執行此情境。可重複。                                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 寫入 reports/summary/observed messages 和 output log 的位置。相對路徑會依 `--repo-root` 解析。                       |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中立 cwd 呼叫時的 repository root。                                                                                |
| `--sut-account <id>`                  | `sut`                                                           | QA gateway config 內的暫時 account id。                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                     |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                                 | 主要/替代 model refs。                                                                                               |
| `--fast`                              | 關閉                                                            | 支援時的 provider fast mode。                                                                                        |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex credential pool](#convex-credential-pool)。                                                           |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                               | `--credential-source convex` 時使用的角色。                                                                          |

任何情境失敗時，各 lane 都會以非零狀態結束。`--allow-failures` 會寫入產物，而不設定失敗結束碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私有 Telegram 群組，並使用兩個不同的 bot（driver + SUT）。SUT bot 必須有 Telegram 使用者名稱；當兩個 bot 都在 `@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，bot-to-bot 觀察效果最佳。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 數值 chat id（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可選：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 會在 observed-message 產物中保留訊息本文（預設會遮蔽）。

情境（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

輸出產物：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 包含從 canary 開始的每則回覆 RTT（driver send → observed SUT reply）。
- `telegram-qa-observed-messages.json` — 除非 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私有 Discord guild channel，並使用兩個 bot：由 harness 控制的 driver bot，以及由子 OpenClaw gateway 透過 bundled Discord plugin 啟動的 SUT bot。驗證 channel mention 處理、SUT bot 已向 Discord 註冊原生 `/help` 命令，以及 opt-in Mantis 證據情境。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必須與 Discord 回傳的 SUT bot user id 相符（否則該 lane 會快速失敗）。

可選：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在 observed-message 產物中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis 情境。它會單獨執行，因為它會將 SUT 切換為 always-on、tool-only guild replies，並設定 `messages.statusReactions.enabled=true`，接著擷取 REST reaction timeline 加上 HTML/PNG 視覺產物。

明確執行 Mantis status-reaction 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

輸出產物：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。
- status-reaction 情境執行時會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私有 Slack channel，並使用兩個不同的 bot：由 harness 控制的 driver bot，以及由子 OpenClaw gateway 透過 bundled Slack plugin 啟動的 SUT bot。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可選：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在 observed-message 產物中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`

輸出產物：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex credential pool

Telegram、Discord 和 Slack lanes 可以從共用 Convex pool 租用 credentials，而不是讀取上述 env vars。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨占 lease，在執行期間對其傳送 Heartbeat，並在關閉時釋放。Pool kinds 為 `"telegram"`、`"discord"` 和 `"slack"`。

Broker 在 `admin/add` 上驗證的 payload shapes：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必須是數值 chat-id 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

Operational env vars 和 Convex broker endpoint contract 位於 [Testing → Shared Telegram credentials via Convex](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（此章節名稱早於 Discord 支援；兩種 kinds 的 broker semantics 相同）。

## Repo-backed seeds

Seed assets 位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些內容刻意放在 git 中，讓 QA plan 對人類和 agent 都可見。

`qa-lab` 應維持為通用 markdown runner。每個 scenario markdown file 都是一個 test run 的真實來源，並應定義：

- scenario metadata
- 可選的 category、capability、lane 和 risk metadata
- docs 和 code refs
- 可選的 plugin requirements
- 可選的 gateway config patch
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用 runtime surface 可保持通用且跨領域。例如，markdown scenarios 可以結合 transport-side helpers 與 browser-side helpers，透過 Gateway `browser.request` seam 驅動嵌入式 Control UI，而不需要新增特殊案例 runner。

Scenario files 應依 product capability 分組，而不是依 source tree folder 分組。移動檔案時請保持 scenario IDs 穩定；使用 `docsRefs` 和 `codeRefs` 來追蹤實作。

Baseline list 應維持足夠廣泛，以涵蓋：

- DM 和 channel chat
- thread behavior
- message action lifecycle
- Cron callbacks
- memory recall
- model switching
- subagent handoff
- repo-reading 和 docs-reading
- 一個小型 build task，例如 Lobster Invaders

## Provider mock lanes

`qa suite` 有兩個本機 provider mock lanes：

- `mock-openai` 是 scenario-aware OpenClaw mock。它仍是 repo-backed QA 和 parity gates 的預設 deterministic mock lane。
- `aimock` 會啟動 AIMock-backed provider server，用於實驗性 protocol、fixture、record/replay 和 chaos coverage。它是附加項目，並不取代 `mock-openai` scenario dispatcher。

Provider-lane implementation 位於 `extensions/qa-lab/src/providers/` 底下。每個 provider 都擁有自己的 defaults、local server startup、gateway model config、auth-profile staging needs，以及 live/mock capability flags。Shared suite 和 gateway code 應透過 provider registry 路由，而不是依 provider names 分支。

## Transport adapters

`qa-lab` 為 markdown QA scenarios 擁有通用 transport seam。`qa-channel` 是該 seam 上的第一個 adapter，但設計目標更廣：未來的真實或 synthetic channels 應接入同一個 suite runner，而不是新增 transport-specific QA runner。

在架構層級，分工如下：

- `qa-lab` 擁有 generic scenario execution、worker concurrency、artifact writing 和 reporting。
- Transport adapter 擁有 gateway config、readiness、inbound and outbound observation、transport actions，以及 normalized transport state。
- `qa/scenarios/` 底下的 Markdown scenario files 定義 test run；`qa-lab` 提供執行它們的可重用 runtime surface。

### 新增 channel

將 channel 新增到 markdown QA system 只需要兩件事：

1. 該 channel 的 transport adapter。
2. 驗證 channel contract 的 scenario pack。

當共用 `qa-lab` host 能擁有 flow 時，不要新增新的 top-level QA command root。

`qa-lab` 負責共用主機機制：

- `openclaw qa` 命令根
- 套件啟動與清理
- worker 並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容別名

執行器 Plugin 負責傳輸契約：

- `openclaw qa <runner>` 如何掛載在共用 `qa` 根底下
- Gateway 如何針對該傳輸進行設定
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字稿與正規化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸特定的重設或清理

新通道的最低採用門檻：

1. 讓 `qa-lab` 繼續作為共用 `qa` 根的擁有者。
2. 在共用 `qa-lab` 主機銜接面上實作傳輸執行器。
3. 將傳輸特定機制保留在執行器 Plugin 或通道 harness 內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊競爭性的根命令。執行器 Plugin 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲 CLI 和執行器執行應留在獨立進入點後面。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或改寫 Markdown 情境。
6. 新情境使用通用情境 helper。
7. 除非 repo 正在進行有意的遷移，否則保持既有相容別名可用。

判斷規則很嚴格：

- 如果行為可以在 `qa-lab` 中一次表達，放在 `qa-lab`。
- 如果行為依賴單一通道傳輸，保留在該執行器 Plugin 或 Plugin harness 中。
- 如果某個情境需要一個可供多個通道使用的新能力，加入通用 helper，而不是在 `suite.ts` 中加入通道特定分支。
- 如果某個行為只對單一傳輸有意義，保持情境為傳輸特定，並在情境契約中明確說明。

### 情境 helper 名稱

新情境偏好的通用 helper：

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

既有情境仍可使用相容別名：`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`，但新的情境撰寫應使用通用名稱。這些別名是為了避免一次性遷移，而不是未來的模型。

## 報告

`qa-lab` 會從觀察到的 bus 時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些有效
- 哪些失敗
- 哪些仍受阻
- 哪些後續情境值得加入

若要查看可用情境清單，這在估算後續工作或接線新傳輸時很有用，請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。

若要進行角色與風格檢查，請在多個即時模型 ref 上執行相同情境，
並寫出經評審的 Markdown 報告：

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

此命令會執行本機 QA Gateway 子行程，而不是 Docker。角色評估
情境應透過 `SOUL.md` 設定 persona，接著執行一般使用者回合，
例如聊天、workspace 協助，以及小型檔案任務。不應告知候選模型
它正在被評估。此命令會保留每份完整逐字稿，記錄基本執行統計，
接著以 fast mode 要求評審模型在支援時使用 `xhigh` reasoning，
依自然度、vibe 與幽默感排序各次執行。
比較 provider 時使用 `--blind-judge-models`：評審提示仍會取得
每份逐字稿與執行狀態，但候選 ref 會替換為中性標籤，
例如 `candidate-01`；報告會在解析後將排名對應回真實 ref。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，
支援的舊版 OpenAI eval ref 使用 `xhigh`。使用
`--model provider/model,thinking=<level>` 內嵌覆寫特定候選。
`--thinking <level>` 仍會設定全域 fallback，而較舊的
`--model-thinking <provider/model=level>` 形式會保留以維持相容性。
OpenAI 候選 ref 預設使用 fast mode，因此在 provider 支援時
會使用優先處理。當單一候選或評審需要覆寫時，內嵌加入
`,fast`、`,no-fast` 或 `,fast=false`。只有在想強制所有候選模型
都啟用 fast mode 時，才傳入 `--fast`。候選與評審耗時會記錄在
報告中以供基準分析，但評審提示會明確要求不要依速度排名。
候選與評審模型執行的並行預設皆為 16。當 provider 限制或本機
Gateway 壓力讓執行結果過於嘈雜時，降低 `--concurrency` 或
`--judge-concurrency`。
當未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`，以及
`google/gemini-3.1-pro-preview`。
當未傳入 `--judge-model` 時，評審預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA 通道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [Dashboard](/zh-TW/web/dashboard)
