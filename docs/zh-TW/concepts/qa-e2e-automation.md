---
read_when:
    - 了解 QA 堆疊如何相互配合
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增儲存庫支援的 QA 情境
    - 圍繞 Gateway 儀表板建置更高擬真度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器，以及報告。
title: 品質保證概覽
x-i18n:
    generated_at: "2026-05-07T13:15:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊的目的，是以比單一單元測試更真實、
更貼近通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、討論串、
  reaction、編輯和刪除介面。
- `extensions/qa-lab`：除錯器 UI 和 QA 匯流排，用於觀察逐字稿、
  注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的 runner plugins：live-transport 配接器，
  用於在子 QA gateway 內驅動真實通道。
- `qa/`：由 repo 支援的種子資產，用於啟動任務和基準 QA
  情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實 transport、瀏覽器截圖、
  VM 狀態和 PR 證據的錯誤，執行前後 live verification。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多都有 `pnpm qa:*`
script aliases；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                                                                                                                  |
| `qa suite`                                          | 針對 QA gateway lane 執行由 repo 支援的情境。Aliases：`pnpm openclaw qa suite --runner multipass` 用於一次性的 Linux VM。                                                                                                                                                |
| `qa coverage`                                       | 列印 markdown 情境涵蓋率清單（`--json` 用於機器輸出）。                                                                                                                                                                                                                  |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，並寫入代理式一致性報告。                                                                                                                                                                                                          |
| `qa character-eval`                                 | 跨多個 live models 執行角色 QA 情境，並產生評判報告。請參閱[回報](#reporting)。                                                                                                                                                                                         |
| `qa manual`                                         | 針對選定的 provider/model lane 執行一次性 prompt。                                                                                                                                                                                                                      |
| `qa ui`                                             | 啟動 QA debugger UI 和本機 QA 匯流排（alias：`pnpm qa:lab:ui`）。                                                                                                                                                                                                       |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                         |
| `qa docker-scaffold`                                | 為 QA dashboard + gateway lane 寫入 docker-compose scaffold。                                                                                                                                                                                                           |
| `qa up`                                             | 建置 QA site、啟動 Docker 支援的堆疊、列印 URL（alias：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                   |
| `qa aimock`                                         | 只啟動 AIMock provider server。                                                                                                                                                                                                                                         |
| `qa mock-openai`                                    | 只啟動具備情境感知的 `mock-openai` provider server。                                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 憑證池。                                                                                                                                                                                                                                              |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的 live transport lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                         |
| `qa telegram`                                       | 針對真實私有 Telegram 群組的 live transport lane。                                                                                                                                                                                                                      |
| `qa discord`                                        | 針對真實私有 Discord guild channel 的 live transport lane。                                                                                                                                                                                                             |
| `qa slack`                                          | 針對真實私有 Slack channel 的 live transport lane。                                                                                                                                                                                                                     |
| `qa mantis`                                         | 針對 live transport bugs 的前後驗證 runner，包含 Discord 狀態 reaction 證據、Crabbox desktop/browser smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 和 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。                     |

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA site：

- 左側：帶有 agent 的 Gateway dashboard（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿和情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker 支援的 gateway lane，並公開
QA Lab 頁面，讓操作者或自動化迴圈可以給 agent 一個 QA
任務、觀察真實通道行為，並記錄哪些可運作、失敗或
仍遭封鎖。

若要更快速迭代 QA Lab UI，而不必每次重建 Docker 映像，
請用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker services 使用預先建置的映像，並將
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` container。`qa:lab:watch`
會在變更時重建該 bundle，而當 QA Lab
asset hash 變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該 script 會啟動本機 OTLP/HTTP trace receiver，並在啟用
`diagnostics-otel` plugin 的情況下執行 `otel-trace-smoke` QA 情境，接著
解碼匯出的 protobuf spans，並斷言 release-critical 形狀：
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled` 和 `openclaw.message.delivery` 必須存在；
model calls 在成功 turns 上不得匯出 `StreamAbandoned`；原始 diagnostic IDs 和
`openclaw.content.*` attributes 必須留在 trace 外。它會在 QA suite artifacts 旁寫入
`otel-smoke-summary.json`。

Observability QA 僅保留在 source checkout 中。npm tarball 有意省略
QA Lab，因此 package Docker release lanes 不會執行 `qa` commands。變更 diagnostics
instrumentation 時，請從已建置的 source checkout 使用
`pnpm qa:otel:smoke`。

若要執行 transport-real Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/scenario 目錄、env vars 和 artifact 配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。概略來說：它會在 Docker 中佈建一次性的 Tuwunel homeserver，註冊臨時 driver/SUT/observer users，在限定於該 transport 的子 QA gateway 中執行真實 Matrix plugin（無 `qa-channel`），接著在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON summary、observed-events artifact，以及合併輸出 log。

這些情境涵蓋單元測試無法端到端證明的 transport 行為：mention gating、allow-bot policies、allowlists、top-level 和 threaded replies、DM routing、reaction handling、inbound edit suppression、restart replay dedupe、homeserver interruption recovery、approval metadata delivery、media handling，以及 Matrix E2EE bootstrap/recovery/verification flows。E2EE CLI profile 也會透過同一個一次性 homeserver 驅動 `openclaw matrix encryption setup` 和 verification commands，然後再檢查 gateway replies。

Discord 也有僅供 Mantis 使用的 opt-in 情境，用於 bug reproduction。使用
`--scenario discord-status-reactions-tool-only` 取得明確的狀態 reaction
timeline，或使用 `--scenario discord-thread-reply-filepath-attachment` 建立
真實 Discord thread，並驗證 `message.thread-reply` 會保留
`filePath` attachment。這些情境不在預設 live Discord lane 中，
因為它們是 before/after repro probes，而不是廣泛的 smoke coverage。
當 QA 環境中設定 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis workflow
也可以加入已登入 Discord Web 的 witness video。該 viewer profile 僅用於視覺擷取；
pass/fail 判定仍來自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程和預設手動執行會使用 live frontier 憑證、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 執行 fast Matrix profile。手動 `matrix_profile=all` 會展開成五個 profile shards，讓完整目錄可平行執行，同時每個 shard 保持一個 artifact directory。

若要執行 transport-real Telegram、Discord 和 Slack smoke lanes：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們以預先存在的真實通道為目標，並使用兩個 bots（driver + SUT）。Required env vars、scenario lists、output artifacts，以及 Convex credential pool 記錄於下方的 [Telegram、Discord 和 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

如需執行完整的 Slack 桌面 VM 並使用 VNC 救援，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用一台 Crabbox 桌面/瀏覽器機器，在 VM 內執行 Slack live lane，在 VNC 瀏覽器中開啟 Slack Web，擷取桌面，並在可使用影片擷取時，將 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 複製回 Mantis 成品目錄。Crabbox 桌面/瀏覽器租約會預先提供擷取工具與瀏覽器/原生建置輔助套件，因此此情境應只會在較舊的租約上安裝備援項目。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中報告總耗時與各階段耗時，因此較慢的執行可看出時間花在租約暖機、憑證取得、遠端設定或成品複製。透過 VNC 手動登入 Slack Web 後，可重複使用 `--lease-id <cbx_...>`；重用的租約也會讓 Crabbox 的 pnpm store 快取保持暖機。預設的 `--hydrate-mode source` 會從原始碼 checkout 驗證，並在 VM 內執行安裝/建置。只有在重用的遠端工作區已經有 `node_modules` 和已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；該模式會略過昂貴的安裝/建置步驟，並在工作區尚未就緒時以封閉方式失敗。使用 `--gateway-setup` 時，Mantis 會在 VM 內的 `38973` 連接埠留下持久執行的 OpenClaw Slack Gateway；未使用時，該命令會執行一般的 bot-to-bot Slack QA lane，並在成品擷取後結束。

操作員檢查清單、GitHub workflow dispatch 命令、證據留言合約、hydrate-mode 決策表、耗時解讀，以及失敗處理步驟，位於 [Mantis Slack 桌面 Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。

如需執行 agent/CV 風格的桌面工作，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 會租用或重用一台 Crabbox 桌面/瀏覽器機器，啟動 `crabbox record --while`，透過巢狀的 `visual-driver` 驅動可見的瀏覽器，擷取 `visual-task.png`，在選取 `--vision-mode image-describe` 時針對螢幕截圖執行 `openclaw infer image describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。設定 `--expect-text` 時，vision prompt 會要求結構化 JSON 判定，且只有在模型回報正向的可見證據時才會通過；僅引用目標文字的負向回應會讓斷言失敗。使用 `--vision-mode metadata` 可執行不使用模型的 smoke，以證明桌面、瀏覽器、螢幕截圖與影片管線正常，而不呼叫影像理解提供者。錄影是 `visual-task` 的必要成品；如果 Crabbox 沒有錄到非空的 `visual-task.mp4`，即使 visual driver 已通過，工作也會失敗。失敗時，除非工作已經通過且未設定 `--keep-lease`，否則 Mantis 會保留租約以供 VNC 使用。

使用 pooled live credentials 前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境、驗證端點設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會回報 secret 的已設定/缺少狀態。

## 即時傳輸涵蓋範圍

live transport lanes 共用一份合約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為套件，並不屬於 live transport coverage matrix。

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

這會讓 `qa-channel` 保持為廣泛的產品行為套件，同時 Matrix、Telegram 和未來的 live transports 共用一份明確的 transport-contract 檢查清單。

如需執行不將 Docker 帶入 QA 路徑的一次性 Linux VM lane，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動一個全新的 Multipass guest、安裝依賴項、在 guest 內建置 OpenClaw、執行 `qa suite`，然後將一般 QA 報告與摘要複製回 host 上的 `.artifacts/qa-e2e/...`。
它會重用與 host 上 `qa suite` 相同的情境選擇行為。
Host 與 Multipass suite 執行預設會以隔離的 Gateway workers 平行執行多個已選情境。`qa-channel` 預設並行數為 4，並受所選情境數量上限限制。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
任何情境失敗時，該命令會以非零狀態碼結束。當你想取得成品但不想要失敗的結束碼時，請使用 `--allow-failures`。
Live runs 會轉送 guest 可實際使用的受支援 QA auth inputs：基於 env 的 provider keys、QA live provider config path，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓 guest 可以透過掛載的工作區寫回。

## Telegram、Discord 與 Slack QA 參考

Matrix 有一個[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量較多，且需要 Docker-backed homeserver 佈建。Telegram、Discord 和 Slack 較小，每個只有少數情境，沒有 profile system，並針對既有的真實 channel，因此它們的參考資料放在這裡。

### 共用 CLI flags

這些 lanes 透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同的 flags：

| Flag                                  | 預設值                                                          | 說明                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | 只執行此情境。可重複使用。                                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 報告/摘要/已觀察訊息和輸出記錄的寫入位置。相對路徑會相對於 `--repo-root` 解析。                                      |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中立 cwd 呼叫時的 repository root。                                                                                |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway config 內的臨時 account id。                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                     |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | 主要/替代 model refs。                                                                                               |
| `--fast`                              | off                                                             | 支援時啟用 provider fast mode。                                                                                      |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex credential pool](#convex-credential-pool)。                                                           |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                               | `--credential-source convex` 時使用的角色。                                                                          |

任何情境失敗時，各 lane 會以非零狀態結束。`--allow-failures` 會寫入成品，但不設定失敗的結束碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私有 Telegram 群組，搭配兩個不同的 bots（driver + SUT）。SUT bot 必須有 Telegram username；當兩個 bots 都在 `@BotFather` 啟用 **Bot-to-Bot Communication Mode** 時，bot-to-bot 觀察效果最好。

使用 `--credential-source env` 時的必要 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字 chat id（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可選：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 會在 observed-message artifacts 中保留訊息本文（預設會遮蔽）。

情境（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

輸出成品：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - 包含每次回覆的 RTT（driver 傳送 → 觀察到 SUT 回覆），從 canary 開始。
- `telegram-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私有 Discord guild channel，搭配兩個 bots：由 harness 控制的 driver bot，以及由 child OpenClaw Gateway 透過 bundled Discord Plugin 啟動的 SUT bot。驗證 channel mention handling、SUT bot 已向 Discord 註冊原生 `/help` command，以及 opt-in Mantis evidence scenarios。

使用 `--credential-source env` 時的必要 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT bot user id（否則 lane 會快速失敗）。

可選：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在 observed-message artifacts 中保留訊息本文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為 `discord-voice-autojoin` 選取語音/舞台 channel；未設定時，該情境會選取 SUT bot 可見的第一個語音/舞台 channel。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選擇加入的語音情境。會單獨執行、啟用 `channels.discord.voice.autoJoin`，並驗證 SUT 機器人目前的 Discord 語音狀態是目標語音/舞台頻道。Convex Discord 認證可包含選用的 `voiceChannelId`；否則執行器會在公會中探索第一個可見的語音/舞台頻道。
- `discord-status-reactions-tool-only` - 選擇加入的 Mantis 情境。會單獨執行，因為它會將 SUT 切換為永遠開啟、僅工具的公會回覆，並設定 `messages.statusReactions.enabled=true`，然後擷取 REST 反應時間軸以及 HTML/PNG 視覺成品。Mantis 前後報告也會將情境提供的 MP4 成品保留為 `baseline.mp4` 和 `candidate.mp4`。

明確執行 Discord 語音自動加入情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會經過遮蔽。
- 執行狀態反應情境時會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個真實的 Slack 私人頻道為目標，並使用兩個不同的機器人：一個由測試框架控制的驅動機器人，以及一個由子 OpenClaw Gateway 透過內建 Slack Plugin 啟動的 SUT 機器人。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

輸出成品：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則本文會經過遮蔽。

#### 設定 Slack 工作區

此通道需要在一個工作區中有兩個不同的 Slack 應用程式，以及一個兩個機器人都已加入的頻道：

- `channelId` - 兩個機器人都已受邀加入之頻道的 `Cxxxxxxxxxx` ID。請使用專用頻道；此通道每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人權杖（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖（`xoxb-...`），它必須是與驅動程式不同的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - 具有 `connections:write` 的 SUT 應用程式層級權杖（`xapp-...`），Socket Mode 會使用它讓 SUT 應用程式接收事件。

建議使用專供 QA 的 Slack 工作區，不要重複使用正式環境工作區。

以下 SUT manifest 會刻意將內建 Slack Plugin 的正式安裝（`extensions/slack/src/setup-shared.ts:10`）縮窄到即時 Slack QA 套件涵蓋的權限與事件。如需使用者所見的正式頻道設定，請參閱 [Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 配對刻意分開，因為此通道需要在同一個工作區中有兩個不同的機器人使用者 ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 選擇 QA 工作區、貼上下列 manifest，然後 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

複製 _Bot User OAuth Token_（`xoxb-...`）- 這會成為 `driverBotToken`。驅動程式只需要張貼訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一個工作區中重複 _Create New App → From a manifest_。這個 QA 應用程式刻意使用內建 Slack Plugin 正式 manifest（`extensions/slack/src/setup-shared.ts:10`）的較窄版本：省略反應範圍與事件，因為即時 Slack QA 套件尚未涵蓋反應處理。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack 建立應用程式後，在其設定頁面執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個權杖呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。執行階段會依使用者 ID 區分驅動程式與 SUT；兩者重複使用同一個應用程式會讓提及門控立即失敗。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個機器人：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID - 這會成為 `channelId`。公開頻道可正常運作；如果使用私人頻道，兩個應用程式已具備 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 註冊認證**

有兩個選項。單機偵錯可使用環境變數（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入共用 Convex 集區，讓 CI 與其他維護者可以租用。

對於 Convex 集區，將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，註冊並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 驗證端到端**

在本機執行通道，確認兩個機器人可以透過代理彼此對話：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功執行會在遠少於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果通道停滯約 90 秒並以 `Convex credential pool exhausted for kind "slack"` 結束，表示集區為空或每列都已被租用 - `qa credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### Convex 認證集區

Telegram、Discord 和 Slack 通道可以從共用 Convex 集區租用認證，而不是讀取上述環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨占租約、在執行期間對它傳送 Heartbeat，並在關閉時釋放。集區種類為 `"telegram"`、`"discord"` 和 `"slack"`。

代理在 `admin/add` 上驗證的承載形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必須是數字聊天 ID 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` 必須符合 `^[A-Z][A-Z0-9]+$`（像 `Cxxxxxxxxxx` 這樣的 Slack ID）。請參閱 [設定 Slack 工作區](#setting-up-the-slack-workspace) 以了解應用程式與範圍佈建。

作業用環境變數與 Convex 代理端點合約位於 [測試 → 透過 Convex 共用 Telegram 認證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（章節名稱早於 Discord 支援；這兩種種類的代理語意相同）。

## 由 repo 支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些內容刻意放在 git 中，讓 QA 計畫對人類和 agent 都可見。

`qa-lab` 應維持為通用的 Markdown 執行器。每個情境 Markdown 檔案都是一次測試執行的事實來源，並應定義：

- 情境中繼資料
- 選用的分類、能力、通道和風險中繼資料
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用執行階段表面可維持通用且橫跨多個領域。例如，Markdown 情境可以將傳輸端輔助工具與瀏覽器端輔助工具結合，透過 Gateway `browser.request` seam 驅動嵌入式 Control UI，而不需要加入特殊案例執行器。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 進行實作可追溯性。

基準清單應維持足夠廣泛，以涵蓋：

- DM 和頻道聊天
- 執行緒行為
- 訊息動作生命週期
- Cron 回呼
- 記憶回想
- 模型切換
- 子 agent 交接
- repo 讀取與文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## 供應商模擬通道

`qa suite` 有兩個本機供應商模擬通道：

- `mock-openai` 是具情境感知能力的 OpenClaw 模擬。它仍是 repo 支援 QA 與同等性 gate 的預設確定性模擬通道。
- `aimock` 會啟動 AIMock 支援的供應商伺服器，用於實驗性協定、fixture、錄製/重播和混沌覆蓋。它是附加項，不會取代 `mock-openai` 情境分派器。

供應商通道實作位於 `extensions/qa-lab/src/providers/` 下。每個供應商都擁有自己的預設值、本機伺服器啟動、Gateway 模型設定、auth-profile 暫存需求，以及即時/模擬能力旗標。共用套件與 Gateway 程式碼應透過供應商登錄路由，而不是依供應商名稱分支。

## 傳輸配接器

`qa-lab` 擁有用於 Markdown QA 情境的通用傳輸抽象介面。`qa-channel` 是該抽象介面上的第一個配接器，但設計目標更廣：未來的真實或合成通道應該接入相同的套件執行器，而不是新增特定於傳輸的 QA 執行器。

在架構層級，分工如下：

- `qa-lab` 負責通用情境執行、worker 並行、成品寫入與報告。
- 傳輸配接器負責 Gateway 設定、就緒狀態、傳入與傳出觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 Markdown 情境檔定義測試執行；`qa-lab` 提供可重用的執行階段介面來執行它們。

### 新增通道

將通道新增到 Markdown QA 系統只需要兩件事：

1. 該通道的傳輸配接器。
2. 驗證通道合約的情境套件。

當共用的 `qa-lab` 主機可以擁有流程時，不要新增新的頂層 QA 命令根。

`qa-lab` 負責共用的主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆除
- worker 並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容別名

執行器 Plugin 負責傳輸合約：

- `openclaw qa <runner>` 如何掛載在共用的 `qa` 根之下
- 如何為該傳輸設定 Gateway
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字稿與正規化的傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理特定於傳輸的重設或清理

新通道的最低採用門檻：

1. 讓 `qa-lab` 繼續擔任共用 `qa` 根的擁有者。
2. 在共用的 `qa-lab` 主機抽象介面上實作傳輸執行器。
3. 將特定於傳輸的機制保留在執行器 Plugin 或通道測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊競爭性的根命令。執行器 Plugin 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲 CLI 與執行器執行應留在獨立進入點後方。
5. 在主題化的 `qa/scenarios/` 目錄下撰寫或改寫 Markdown 情境。
6. 對新情境使用通用情境輔助工具。
7. 除非 repo 正在進行刻意的遷移，否則保持現有相容別名可用。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就把它放在 `qa-lab`。
- 如果行為依賴某個通道傳輸，就將它保留在該執行器 Plugin 或 Plugin 測試框架中。
- 如果情境需要一個可供多個通道使用的新能力，請新增通用輔助工具，而不是在 `suite.ts` 中加入特定於通道的分支。
- 如果某個行為只對一種傳輸有意義，請讓情境保持特定於傳輸，並在情境合約中明確說明。

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

現有情境仍可使用相容別名 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但撰寫新情境時應使用通用名稱。這些別名是為了避免一次性遷移，而不是未來的模型。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些可正常運作
- 哪些失敗
- 哪些仍被阻塞
- 哪些後續情境值得新增

若要取得可用情境清單 - 在評估後續工作規模或接入新傳輸時很有用 - 請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。

若要進行角色與風格檢查，請在多個即時模型
ref 上執行相同情境，並寫出經評審的 Markdown 報告：

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
情境應透過 `SOUL.md` 設定 persona，然後執行一般使用者回合，
例如聊天、workspace 協助與小型檔案任務。不應告知候選模型
它正在接受評估。此命令會保留每份完整
逐字稿、記錄基本執行統計，然後以 fast 模式要求評審模型，並在
支援時使用 `xhigh` reasoning，依自然度、氛圍與幽默感為各次執行排名。
比較提供者時使用 `--blind-judge-models`：評審提示仍會取得
每份逐字稿與執行狀態，但候選 ref 會替換為中性
標籤，例如 `candidate-01`；報告會在解析後將排名對應回真實 ref。
候選執行預設為 `high` thinking，GPT-5.5 使用 `medium`，而支援它的
舊版 OpenAI 評估 ref 使用 `xhigh`。使用
`--model provider/model,thinking=<level>` 內嵌覆寫特定候選。`--thinking <level>` 仍會設定
全域 fallback，而舊版 `--model-thinking <provider/model=level>` 形式
會保留以維持相容性。
OpenAI 候選 ref 預設使用 fast 模式，以便在提供者支援時使用
優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在想要
強制每個候選模型都啟用 fast 模式時，才傳入 `--fast`。候選與評審耗時會
記錄在報告中供基準分析使用，但評審提示會明確要求
不要依速度排名。
候選與評審模型執行都預設為並行 16。當提供者限制或本機 Gateway
壓力讓執行結果過於嘈雜時，請降低
`--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估會預設為
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`，以及
未傳入 `--model` 時的 `google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審會預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA Channel](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [Dashboard](/zh-TW/web/dashboard)
