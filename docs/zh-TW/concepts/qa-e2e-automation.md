---
read_when:
    - 了解 QA 堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增以儲存庫為後盾的 QA 情境
    - 圍繞 Gateway 儀表板建構更高真實度的 QA 自動化
summary: QA 堆疊概觀：qa-lab、qa-channel、以儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: 品質保證概觀
x-i18n:
    generated_at: "2026-05-04T02:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更貼近真實情境、具通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、執行緒、反應、編輯與刪除介面。
- `extensions/qa-lab`：除錯器 UI 與 QA 匯流排，用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的執行器 Plugin：即時傳輸配接器，會在子 QA gateway 內驅動真實通道。
- `qa/`：由 repo 支援的 kickoff 任務與基準 QA 情境種子資產。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、VM 狀態與 PR 證據的錯誤，進行修正前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*` script 別名；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                    |
| `qa suite`                                          | 對 QA gateway lane 執行由 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性的 Linux VM。                                                     |
| `qa coverage`                                       | 列印 Markdown 情境覆蓋率清冊（`--json` 用於機器輸出）。                                                                                                                    |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，並寫入 agentic 對等報告。                                                                                                           |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                            |
| `qa manual`                                         | 對選取的 provider/model lane 執行一次性提示。                                                                                                                             |
| `qa ui`                                             | 啟動 QA 除錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                             |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                           |
| `qa docker-scaffold`                                | 寫入 QA 儀表板 + gateway lane 的 docker-compose 腳手架。                                                                                                                   |
| `qa up`                                             | 建置 QA 站台、啟動 Docker 支援的堆疊並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                     |
| `qa aimock`                                         | 只啟動 AIMock provider 伺服器。                                                                                                                                           |
| `qa mock-openai`                                    | 只啟動具情境感知能力的 `mock-openai` provider 伺服器。                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 憑證池。                                                                                                                                                |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                  |
| `qa telegram`                                       | 針對真實私人 Telegram 群組的即時傳輸 lane。                                                                                                                               |
| `qa discord`                                        | 針對真實私人 Discord guild 頻道的即時傳輸 lane。                                                                                                                          |
| `qa slack`                                          | 針對真實私人 Slack 頻道的即時傳輸 lane。                                                                                                                                  |
| `qa mantis`                                         | 針對即時傳輸錯誤的修正前後驗證執行器，包含 Discord 狀態反應證據與 Crabbox 桌面/瀏覽器 smoke。請參閱 [Mantis](/zh-TW/concepts/mantis)。                                         |

## 操作員流程

目前的 QA 操作員流程是雙窗格 QA 站台：

- 左側：含 agent 的 Gateway 儀表板（控制 UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿與情境計畫。

執行方式：

```bash
pnpm qa:lab:up
```

這會建置 QA 站台、啟動 Docker 支援的 gateway lane，並公開 QA Lab 頁面，讓操作員或自動化迴圈可以給 agent 一個 QA 任務、觀察真實通道行為，並記錄哪些項目成功、失敗或仍遭阻塞。

若要更快速地迭代 QA Lab UI，而不必每次都重建 Docker 映像，請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像，並將 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch` 會在變更時重建該 bundle，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

若要進行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該 script 會啟動本機 OTLP/HTTP trace 接收器，在啟用 `diagnostics-otel` Plugin 的情況下執行 `otel-trace-smoke` QA 情境，接著解碼匯出的 protobuf spans，並斷言 release-critical 形狀：必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 與 `openclaw.message.delivery`；成功回合中的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 與 `openclaw.content.*` 屬性必須留在 trace 之外。它會在 QA suite artifact 旁寫入 `otel-smoke-summary.json`。

Observability QA 僅適用於原始碼 checkout。npm tarball 會有意省略 QA Lab，因此套件 Docker release lane 不會執行 `qa` 命令。變更診斷 instrumentation 時，請從已建置的原始碼 checkout 執行 `pnpm qa:otel:smoke`。

若要執行傳輸真實的 Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/情境目錄、環境變數與 artifact 版面配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡而言之：它會在 Docker 中佈建一次性的 Tuwunel homeserver、註冊臨時 driver/SUT/observer 使用者、在限定於該傳輸的子 QA gateway 內執行真實 Matrix Plugin（不使用 `qa-channel`），接著在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events artifact 與合併輸出日誌。

針對傳輸真實的 Telegram、Discord 與 Slack smoke lane：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們會以含兩個 bot（driver + SUT）的既有真實通道為目標。必要環境變數、情境清單、輸出 artifact 與 Convex 憑證池記錄於下方的 [Telegram、Discord 與 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

使用集區化即時憑證之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境、驗證 endpoint 設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會回報 secret 的已設定/缺漏狀態。

## 即時傳輸覆蓋率

即時傳輸 lane 共用一份合約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，不屬於即時傳輸覆蓋率矩陣的一部分。

| Lane     | Canary | 提及閘控 | Bot 對 Bot | Allowlist 封鎖 | 頂層回覆 | 重新啟動續接 | 執行緒後續追蹤 | 執行緒隔離 | 反應觀察 | Help 命令 | 原生命令註冊 |
| -------- | ------ | -------- | ---------- | --------------- | -------- | ------------ | ---------------- | ------------ | -------- | --------- | ------------ |
| Matrix   | x      | x        | x          | x               | x        | x            | x                | x            | x        |           |              |
| Telegram | x      | x        | x          |                 |          |              |                  |              |          | x         |              |
| Discord  | x      | x        | x          |                 |          |              |                  |              |          |           | x            |
| Slack    | x      | x        | x          |                 |          |              |                  |              |          |           |              |

這會讓 `qa-channel` 保持作為廣泛的產品行為 suite，同時讓 Matrix、Telegram 與未來的即時傳輸共用一份明確的傳輸合約檢查清單。

若要在不把 Docker 帶入 QA 路徑的情況下執行一次性 Linux VM lane，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝相依性、在 guest 內建置 OpenClaw、執行 `qa suite`，接著將一般 QA 報告與摘要複製回 host 上的 `.artifacts/qa-e2e/...`。
它會重用與 host 上 `qa suite` 相同的情境選取行為。
Host 與 Multipass suite run 預設會以隔離的 gateway workers 平行執行多個選取的情境。`qa-channel` 預設 concurrency 為 4，並受選取的情境數量上限限制。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
當任何情境失敗時，命令會以非零狀態結束。當你想要 artifact 而不要失敗的結束碼時，請使用 `--allow-failures`。
即時 run 會轉送對 guest 實用的受支援 QA auth 輸入：以環境為基礎的 provider key、QA live provider 設定路徑，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓 guest 能透過掛載的 workspace 寫回。

## Telegram、Discord 與 Slack QA 參考

Matrix 有一個[專屬頁面](/zh-TW/concepts/qa-matrix)，因為其情境數量與 Docker 支援的 homeserver 佈建。Telegram、Discord 與 Slack 較小，每個只有少數情境、沒有 profile 系統，並針對既有真實通道，因此它們的參考位於此處。

### 共享 CLI 旗標

這些 lane 透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                         | 說明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 只執行此情境。可重複指定。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 寫入報告、摘要、觀察到的訊息和輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定內的暫時帳號 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | 主要／替代模型參照。                                                                                         |
| `--fast`                              | off                                                             | 支援時啟用供應商快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex 憑證池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                              | 使用 `--credential-source convex` 時使用的角色。                                                                          |

任何情境失敗時，各通道都會以非零狀態結束。`--allow-failures` 會寫入成品，但不會設定失敗的退出碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，搭配兩個不同的 bot（driver + SUT）。SUT bot 必須有 Telegram 使用者名稱；當兩個 bot 都在 `@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，bot 對 bot 觀察效果最佳。

使用 `--credential-source env` 時所需的 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 數值聊天 id（字串）。
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
- `telegram-qa-summary.json` — 從 canary 開始，包含每則回覆的 RTT（driver 傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild 頻道，搭配兩個 bot：由測試框架控制的 driver bot，以及由子 OpenClaw Gateway 透過 bundled Discord plugin 啟動的 SUT bot。驗證頻道提及處理、SUT bot 已向 Discord 註冊原生 `/help` 命令，以及選擇啟用的 Mantis 證據情境。

使用 `--credential-source env` 時所需的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必須符合 Discord 傳回的 SUT bot 使用者 id（否則該通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 選擇啟用的 Mantis 情境。因為它會將 SUT 切換為一律啟用、僅工具的 guild 回覆，並設定 `messages.statusReactions.enabled=true`，接著擷取 REST 反應時間軸以及 HTML/PNG 視覺成品，所以會單獨執行。

明確執行 Mantis 狀態反應情境：

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
- 執行狀態反應情境時，會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack 頻道，搭配兩個不同的 bot：由測試框架控制的 driver bot，以及由子 OpenClaw Gateway 透過 bundled Slack plugin 啟動的 SUT bot。

使用 `--credential-source env` 時所需的 env：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`

輸出成品：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 憑證池

Telegram、Discord 和 Slack 通道可以從共享的 Convex 池租用憑證，而不是讀取上述 env vars。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得一個獨佔租約，在執行期間傳送 Heartbeat，並在關閉時釋放租約。池種類為 `"telegram"`、`"discord"` 和 `"slack"`。

Broker 會在 `admin/add` 驗證的 payload 形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必須是數值聊天 id 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作用 env vars 和 Convex broker 端點合約位於 [測試 → 透過 Convex 共享 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該章節名稱早於 Discord 支援；兩種種類的 broker 語意相同）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些檔案刻意放在 git 中，讓 QA 計畫對人員與 agent 都可見。

`qa-lab` 應保持為通用 markdown runner。每個情境 markdown 檔案都是一次測試執行的真實來源，且應定義：

- 情境中繼資料
- 選用的類別、能力、通道和風險中繼資料
- 文件與程式碼參照
- 選用的 plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用執行階段介面可以保持通用且跨面向。例如，markdown 情境可以結合傳輸端 helper 與瀏覽器端 helper，透過 Gateway `browser.request` seam 驅動內嵌的 Control UI，而不需要加入特殊案例 runner。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 進行實作可追溯性。

基準清單應保持足夠廣泛，以涵蓋：

- DM 和頻道聊天
- thread 行為
- 訊息動作生命週期
- cron callbacks
- 記憶回想
- 模型切換
- subagent handoff
- 讀取儲存庫與讀取文件
- 一個小型建置任務，例如 Lobster Invaders

## 供應商 mock 通道

`qa suite` 有兩個本機供應商 mock 通道：

- `mock-openai` 是具情境感知的 OpenClaw mock。它仍是儲存庫支援 QA 和 parity gates 的預設決定性 mock 通道。
- `aimock` 會啟動由 AIMock 支援的供應商伺服器，用於實驗性通訊協定、fixture、record/replay 和 chaos 覆蓋。它是加成性質，且不會取代 `mock-openai` 情境 dispatcher。

供應商通道實作位於 `extensions/qa-lab/src/providers/` 之下。每個供應商都擁有自己的預設值、本機伺服器啟動、Gateway 模型設定、auth-profile staging 需求，以及 live/mock 能力旗標。共享 suite 和 Gateway 程式碼應透過供應商 registry 路由，而不是依供應商名稱分支。

## 傳輸配接器

`qa-lab` 擁有一個供 markdown QA 情境使用的通用傳輸 seam。`qa-channel` 是該 seam 上的第一個配接器，但設計目標更廣：未來真實或合成頻道應接入相同的 suite runner，而不是加入傳輸專屬 QA runner。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、worker 並行、成品寫入與報告。
- 傳輸配接器擁有 Gateway 設定、就緒狀態、入站與出站觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用執行階段介面。

### 新增頻道

將頻道加入 markdown QA 系統時，只需要兩件事：

1. 該頻道的傳輸配接器。
2. 測試該頻道合約的情境套件。

當共享的 `qa-lab` host 可以擁有流程時，不要新增新的頂層 QA 命令根。

`qa-lab` 擁有共享 host 機制：

- `openclaw qa` 命令根
- suite 啟動與拆除
- worker 並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容別名

Runner plugins 擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共享 `qa` 根之下
- Gateway 如何針對該傳輸進行設定
- 如何檢查就緒狀態
- 如何注入入站事件
- 如何觀察出站訊息
- 如何公開 transcripts 和正規化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸專屬重設或清理

新頻道的最低採用門檻：

1. 保留 `qa-lab` 作為共用 `qa` 根的擁有者。
2. 在共用的 `qa-lab` 主機銜接層上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器 Plugin 或通道測試工具中。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊互相競爭的根命令。執行器 Plugin 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。讓 `runtime-api.ts` 保持輕量；延遲 CLI 和執行器執行應保留在獨立進入點後方。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或調整 Markdown 情境。
6. 對新情境使用通用情境輔助工具。
7. 除非 repo 正在進行有意的遷移，否則保持現有相容性別名可用。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為依賴單一通道傳輸，就將它保留在該執行器 Plugin 或 Plugin 測試工具中。
- 如果情境需要多個通道都能使用的新能力，請新增通用輔助工具，而不是在 `suite.ts` 中加入通道專屬分支。
- 如果某個行為只對單一傳輸有意義，請讓情境保持傳輸專屬，並在情境契約中明確說明。

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

相容性別名仍可供現有情境使用 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但撰寫新情境時應使用通用名稱。這些別名存在是為了避免一次性遷移，而不是未來的模型。

## 回報

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些正常運作
- 哪些失敗
- 哪些仍受阻
- 哪些後續情境值得加入

若要查看可用情境清單 — 在評估後續工作規模或接線新傳輸時很有用 — 請執行 `pnpm openclaw qa coverage`（加入 `--json` 取得機器可讀輸出）。

若要進行角色與風格檢查，請跨多個即時模型
refs 執行相同情境，並撰寫經評審的 Markdown 報告：

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
例如聊天、workspace 協助，以及小型檔案任務。不應告知候選模型
它正在接受評估。此命令會保留每份完整
transcript、記錄基本執行統計，然後請評審模型以快速模式搭配
支援時的 `xhigh` reasoning，依自然度、氛圍和幽默感對執行結果排名。
比較供應商時使用 `--blind-judge-models`：評審提示仍會取得
每份 transcript 與執行狀態，但候選 refs 會替換成中性
標籤，例如 `candidate-01`；報告會在解析後將排名對應回真實 refs。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，而支援它的
較舊 OpenAI 評估 refs 使用 `xhigh`。用
`--model provider/model,thinking=<level>` 內聯覆寫特定候選。`--thinking <level>` 仍會設定
全域 fallback，且較舊的 `--model-thinking <provider/model=level>` 形式
會保留以維持相容性。
OpenAI 候選 refs 預設使用快速模式，因此在供應商支援時會使用
優先處理。當單一候選或評審需要覆寫時，請內聯加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在想要
強制所有候選模型開啟快速模式時才傳入 `--fast`。候選和評審耗時會
記錄在報告中以供基準分析，但評審提示會明確要求
不要依速度排名。
候選與評審模型執行都預設使用並行度 16。當供應商限制或本機 Gateway
壓力讓執行過於嘈雜時，請降低
`--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`，以及
未傳入 `--model` 時的 `google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA 通道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [Dashboard](/zh-TW/web/dashboard)
