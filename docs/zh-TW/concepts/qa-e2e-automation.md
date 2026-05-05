---
read_when:
    - 了解 QA 堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞 Gateway 儀表板建置更高擬真度的品質保證自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、以儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-05-05T06:17:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更真實、更貼近通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、執行緒、反應、編輯與刪除介面。
- `extensions/qa-lab`：用於觀察轉錄稿、注入傳入訊息，以及匯出 Markdown 報告的偵錯 UI 與 QA 匯流排。
- `extensions/qa-matrix`、未來的 runner plugins：即時傳輸配接器，會在子 QA gateway 內驅動真實通道。
- `qa/`：由 repo 支援的 kickoff 任務與基準 QA 情境種子資產。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的 bug，進行修正前與修正後的即時驗證。

## 指令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*` script 別名；兩種形式都支援。

| 指令                                                | 用途                                                                                                                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                                          |
| `qa suite`                                          | 對 QA gateway lane 執行由 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性的 Linux VM。                                                                            |
| `qa coverage`                                       | 列印 Markdown 情境涵蓋率清單（`--json` 用於機器輸出）。                                                                                                                                          |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，並寫入 agentic parity 報告。                                                                                                                              |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                                                   |
| `qa manual`                                         | 對選取的 provider/model lane 執行一次性提示。                                                                                                                                                    |
| `qa ui`                                             | 啟動 QA 偵錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                   |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                  |
| `qa docker-scaffold`                                | 為 QA 儀表板 + gateway lane 寫入 docker-compose scaffold。                                                                                                                                       |
| `qa up`                                             | 建置 QA site、啟動 Docker 支援的堆疊、列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                             |
| `qa aimock`                                         | 僅啟動 AIMock provider server。                                                                                                                                                                  |
| `qa mock-openai`                                    | 僅啟動具情境感知能力的 `mock-openai` provider server。                                                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 憑證池。                                                                                                                                                                       |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                         |
| `qa telegram`                                       | 針對真實私人 Telegram 群組的即時傳輸 lane。                                                                                                                                                      |
| `qa discord`                                        | 針對真實私人 Discord guild 頻道的即時傳輸 lane。                                                                                                                                                 |
| `qa slack`                                          | 針對真實私人 Slack 頻道的即時傳輸 lane。                                                                                                                                                         |
| `qa mantis`                                         | 即時傳輸 bug 的修正前與修正後驗證 runner，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis)。 |

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA site：

- 左側：含 agent 的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 的轉錄稿與情境計畫。

使用以下指令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker 支援的 gateway lane，並公開 QA Lab 頁面，讓操作者或自動化迴圈可以交付 QA 任務給 agent、觀察真實通道行為，並記錄哪些成功、失敗或仍受阻。

若要在不每次重建 Docker 映像的情況下更快迭代 QA Lab UI，請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像，並將 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器。`qa:lab:watch` 會在變更時重建該 bundle，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該 script 會啟動本機 OTLP/HTTP trace receiver，並在啟用 `diagnostics-otel` plugin 的情況下執行 `otel-trace-smoke` QA 情境，接著解碼匯出的 protobuf spans，並斷言 release-critical 形狀：必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 與 `openclaw.message.delivery`；成功回合中的 model calls 不得匯出 `StreamAbandoned`；原始 diagnostic IDs 與 `openclaw.content.*` 屬性必須留在 trace 之外。它會在 QA suite artifacts 旁寫入 `otel-smoke-summary.json`。

Observability QA 僅限 source-checkout。npm tarball 會刻意省略 QA Lab，因此套件 Docker release lanes 不會執行 `qa` 指令。變更 diagnostics instrumentation 時，請從已建置的 source checkout 執行 `pnpm qa:otel:smoke`。

若要執行傳輸真實的 Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/情境目錄、env vars 與 artifact 配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。概略來說：它會在 Docker 中佈建一次性的 Tuwunel homeserver、註冊暫時的 driver/SUT/observer 使用者、在限定於該傳輸的子 QA gateway 內執行真實 Matrix plugin（不使用 `qa-channel`），接著在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events artifact 與合併輸出記錄。

若要執行傳輸真實的 Telegram、Discord 與 Slack smoke lanes：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們會以包含兩個 bots（driver + SUT）的既有真實通道為目標。必要 env vars、情境清單、輸出 artifacts 與 Convex 憑證池記錄在下方的 [Telegram、Discord 與 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

若要執行具有 VNC rescue 的完整 Slack desktop VM run，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該指令會租用 Crabbox desktop/browser machine、在 VM 內執行 Slack live lane、在 VNC 瀏覽器中開啟 Slack Web、擷取桌面，並在可用影片擷取時，將 `slack-qa/`、`slack-desktop-smoke.png` 與 `slack-desktop-smoke.mp4` 複製回 Mantis artifact 目錄。透過 VNC 手動登入 Slack Web 後，可使用 `--lease-id <cbx_...>` 重用 lease。使用 `--gateway-setup` 時，Mantis 會在 VM 內的 port `38973` 留下一個持久的 OpenClaw Slack gateway；不使用時，該指令會執行一般 bot-to-bot Slack QA lane，並在擷取 artifact 後結束。

若要執行 agent/CV 風格的 desktop task，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 會租用或重用 Crabbox desktop/browser machine、啟動 `crabbox record --while`、透過巢狀 `visual-driver` 驅動可見瀏覽器、擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時對截圖執行 `openclaw infer image describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 與 `mantis-visual-task-report.md`。設定 `--expect-text` 時，vision prompt 會要求結構化 JSON verdict，且只有在模型回報正面的可見證據時才通過；若負面回應只是引用目標文字，斷言會失敗。使用 `--vision-mode metadata` 可在不呼叫影像理解 provider 的情況下，進行證明 desktop、browser、screenshot 與 video plumbing 的 no-model smoke。Recording 是 `visual-task` 的必要 artifact；如果 Crabbox 沒有錄到非空的 `visual-task.mp4`，即使 visual driver 通過，task 仍會失敗。失敗時，除非 task 已通過且未設定 `--keep-lease`，否則 Mantis 會保留 lease 以供 VNC 使用。

使用 pooled live credentials 前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證 endpoint 設定，並在存在 maintainer secret 時驗證 admin/list 可達性。它只會回報 secrets 的已設定/缺漏狀態。

## 即時傳輸涵蓋率

即時傳輸 lanes 共用一份 contract，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，並不是即時傳輸涵蓋率矩陣的一部分。

| 通道     | 金絲雀 | 提及閘控 | 機器人對機器人 | 允許清單封鎖 | 頂層回覆 | 重新啟動後恢復 | 討論串追蹤回覆 | 討論串隔離 | 反應觀察 | 說明指令 | 原生指令註冊 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

這會讓 `qa-channel` 保持作為涵蓋範圍較廣的產品行為套件，同時 Matrix、Telegram 和未來的即時傳輸共用一份明確的傳輸合約檢查清單。

若要使用一次性的 Linux VM 通道，而不把 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動新的 Multipass guest、安裝相依套件、在 guest 內建置 OpenClaw、執行 `qa suite`，然後把一般 QA 報告與摘要複製回 host 上的 `.artifacts/qa-e2e/...`。
它會重用與 host 上 `qa suite` 相同的情境選擇行為。
Host 和 Multipass 套件執行預設會以隔離的 Gateway worker 平行執行多個選取的情境。`qa-channel` 預設並行數為 4，並受選取情境數量限制。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
當任何情境失敗時，指令會以非零狀態結束。若你想要產出 artifacts 但不要失敗的結束碼，請使用 `--allow-failures`。
即時執行會轉送 guest 可實用支援的 QA 驗證輸入：以 env 為基礎的 provider keys、QA 即時 provider 設定路徑，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓 guest 能透過掛載的 workspace 寫回。

## Telegram、Discord 和 Slack QA 參考

Matrix 因為情境數量與 Docker 支援的 homeserver 佈建，擁有[專屬頁面](/zh-TW/concepts/qa-matrix)。Telegram、Discord 和 Slack 較小，分別只有少數情境、沒有 profile 系統，並針對既有的真實 channel 執行，因此它們的參考內容放在這裡。

### 共用 CLI 旗標

這些通道透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                         | 說明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 只執行此情境。可重複指定。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 寫入報告、摘要、觀察到的訊息和輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中立 cwd 呼叫時的 repository root。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定內的暫時帳號 ID。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                                | 主要/替代模型 ref。                                                                                         |
| `--fast`                              | 關閉                                                             | 支援時使用 provider 快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex 憑證集區](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                              | `--credential-source convex` 時使用的角色。                                                                          |

每個通道在任何情境失敗時都會以非零狀態結束。`--allow-failures` 會寫入 artifacts，但不設定失敗的結束碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的 bot（driver + SUT）。SUT bot 必須有 Telegram 使用者名稱；當兩個 bot 都在 `@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，機器人對機器人觀察效果最佳。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 數值 chat ID（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

選用：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 會在觀察訊息 artifacts 中保留訊息本文（預設會遮蔽）。

情境 (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`)：

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

輸出 artifacts：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 從金絲雀開始，包含每則回覆的 RTT（driver 傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` — 除非 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild channel，並使用兩個 bot：由 harness 控制的 driver bot，以及由 child OpenClaw Gateway 透過隨附的 Discord Plugin 啟動的 SUT bot。驗證 channel 提及處理、SUT bot 已向 Discord 註冊原生 `/help` 指令，以及 opt-in Mantis 證據情境。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必須符合 Discord 回傳的 SUT bot 使用者 ID（否則此通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息 artifacts 中保留訊息本文。

情境 (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`)：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in Mantis 情境。它會單獨執行，因為它會把 SUT 切換為 always-on、tool-only 的 guild 回覆，並設定 `messages.statusReactions.enabled=true`，接著擷取 REST reaction timeline 以及 HTML/PNG 視覺 artifacts。Mantis 前後對照報告也會把情境提供的 MP4 artifacts 保留為 `baseline.mp4` 和 `candidate.mp4`。

明確執行 Mantis 狀態反應情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

輸出 artifacts：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。
- 執行狀態反應情境時會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack channel，並使用兩個不同的 bot：由 harness 控制的 driver bot，以及由 child OpenClaw Gateway 透過隨附的 Slack Plugin 啟動的 SUT bot。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察訊息 artifacts 中保留訊息本文。

情境 (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`)：

- `slack-canary`
- `slack-mention-gating`

輸出 artifacts：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

#### 設定 Slack workspace

此通道需要同一個 workspace 中有兩個不同的 Slack app，並且有一個兩個 bot 都是成員的 channel：

- `channelId` — 兩個 bot 都已受邀加入的 channel 的 `Cxxxxxxxxxx` ID。使用專用 channel；此通道每次執行都會發文。
- `driverBotToken` — **Driver** app 的 bot token (`xoxb-...`)。
- `sutBotToken` — **SUT** app 的 bot token (`xoxb-...`)，它必須是與 driver 分開的 Slack app，讓其 bot 使用者 ID 不同。
- `sutAppToken` — SUT app 的 app-level token (`xapp-...`)，具備 `connections:write`，Socket Mode 會用它讓 SUT app 接收事件。

建議使用專供 QA 的 Slack workspace，而不是重用 production workspace。

下方的 SUT manifest 對應隨附 Slack Plugin 的 production install (`extensions/slack/src/setup-shared.ts:10`)。若要查看使用者所見的 production-channel 設定，請參閱 [Slack channel 快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 配對刻意分開，因為此通道需要同一個 workspace 中有兩個不同的 bot 使用者 ID。

**1. 建立 Driver app**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 選擇 QA workspace，貼上下列 manifest，然後 _Install to Workspace_：

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

複製 _Bot User OAuth Token_ (`xoxb-...`) — 它會成為 `driverBotToken`。driver 只需要發送訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT app**

在相同 workspace 中重複 _Create New App → From a manifest_。scope 集合對應隨附 Slack Plugin 的 production install (`extensions/slack/src/setup-shared.ts:10`)：

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Slack 建立應用程式後，請在其設定頁面執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個權杖呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。執行階段會依使用者 ID 區分驅動端和 SUT；若兩者重用同一個應用程式，提及閘控會立即失敗。

**3. 建立頻道**

在 QA 工作區中建立一個頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個機器人：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID，這會成為 `channelId`。公開頻道可正常運作；如果使用私人頻道，兩個應用程式都已具有 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 註冊憑證**

有兩種選項。單機偵錯時使用環境變數（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或將共享 Convex 集區植入初始資料，讓 CI 和其他維護者能夠租用。

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

預期為 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 驗證端到端流程**

在本機執行該執行線，確認兩個機器人都能透過代理彼此通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功的執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果該執行線停滯約 90 秒並以 `Convex credential pool exhausted for kind "slack"` 結束，表示集區是空的，或每一列都已被租用；`qa credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### Convex 憑證集區

Telegram、Discord 和 Slack 執行線可以從共享 Convex 集區租用憑證，而不是讀取上述環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨占租約，在執行期間為其發送 Heartbeat，並在關閉時釋放。集區種類為 `"telegram"`、`"discord"` 和 `"slack"`。

代理會在 `admin/add` 驗證的承載內容形狀：

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必須是數字聊天 ID 字串。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` 必須符合 `^[A-Z][A-Z0-9]+$`（像 `Cxxxxxxxxxx` 這樣的 Slack ID）。請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)，了解應用程式與範圍佈建。

操作用環境變數與 Convex 代理端點契約位於[測試 → 透過 Convex 共享 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該章節名稱早於 Discord 支援；兩種種類的代理語意相同）。

## 由儲存庫支援的種子資料

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些內容刻意納入 git，讓 QA 計畫對人類與代理都可見。

`qa-lab` 應保持為通用 Markdown 執行器。每個情境 Markdown 檔案都是單次測試執行的事實來源，並應定義：

- 情境中繼資料
- 選用的類別、能力、執行線與風險中繼資料
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用執行階段介面允許保持通用且跨領域。例如，Markdown 情境可以結合傳輸端輔助程式與瀏覽器端輔助程式，透過 Gateway `browser.request` 接縫驅動內嵌的 Control UI，而不需要新增特例執行器。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 進行實作可追溯性追蹤。

基準清單應保持足夠廣泛，以涵蓋：

- 私訊與頻道聊天
- 執行緒行為
- 訊息動作生命週期
- Cron 回呼
- 記憶回想
- 模型切換
- 子代理交接
- 儲存庫讀取與文件讀取
- 一項小型建置工作，例如 Lobster Invaders

## 提供者模擬執行線

`qa suite` 有兩條本機提供者模擬執行線：

- `mock-openai` 是具情境感知能力的 OpenClaw 模擬。它仍是由儲存庫支援的 QA 與對等閘門的預設確定性模擬執行線。
- `aimock` 會啟動由 AIMock 支援的提供者伺服器，用於實驗性協定、固定資料、錄製/重播與混沌涵蓋。它是附加項目，不會取代 `mock-openai` 情境分派器。

提供者執行線實作位於 `extensions/qa-lab/src/providers/`。每個提供者擁有其預設值、本機伺服器啟動、Gateway 模型設定、驗證設定檔暫存需求，以及即時/模擬能力旗標。共享套件與 Gateway 程式碼應透過提供者登錄路由，而不是依提供者名稱分支。

## 傳輸配接器

`qa-lab` 為 Markdown QA 情境擁有通用傳輸接縫。`qa-channel` 是該接縫上的第一個配接器，但設計目標更廣：未來的真實或合成頻道應插入同一個套件執行器，而不是新增傳輸專屬的 QA 執行器。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、工作者並行、成品寫入與報告。
- 傳輸配接器擁有 Gateway 設定、就緒狀態、傳入與傳出觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 Markdown 情境檔案會定義測試執行；`qa-lab` 提供執行它們的可重用執行階段介面。

### 新增頻道

將頻道新增至 Markdown QA 系統只需要兩件事：

1. 該頻道的傳輸配接器。
2. 一組涵蓋頻道契約的情境套件。

當共享的 `qa-lab` 主機可以擁有流程時，不要新增新的頂層 QA 命令根。

`qa-lab` 擁有共享主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆除
- 工作者並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容別名

執行器 Plugin 擁有傳輸契約：

- `openclaw qa <runner>` 如何掛載於共享 `qa` 根之下
- Gateway 如何為該傳輸設定
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字稿與正規化傳輸狀態
- 如何執行由傳輸支援的動作
- 如何處理傳輸專屬的重設或清理

新頻道的最低採用門檻：

1. 保持 `qa-lab` 作為共享 `qa` 根的擁有者。
2. 在共享 `qa-lab` 主機接縫上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器 Plugin 或頻道測試框架中。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊競爭性的根命令。執行器 Plugin 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲 CLI 與執行器執行應保留在獨立進入點之後。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或調整 Markdown 情境。
6. 對新情境使用通用情境輔助程式。
7. 除非儲存庫正在進行刻意遷移，否則保持現有相容別名可用。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就將它放在 `qa-lab` 中。
- 如果行為依賴單一頻道傳輸，請將它保留在該執行器 Plugin 或 Plugin 測試框架中。
- 如果某個情境需要可供多個頻道使用的新能力，請新增通用輔助程式，而不是在 `suite.ts` 中新增頻道專屬分支。
- 如果某個行為只對單一傳輸有意義，請保持情境的傳輸專屬性，並在情境契約中明確表示。

### 情境輔助程式名稱

新情境偏好的通用輔助程式：

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

相容別名仍可供現有情境使用：`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`，但新情境撰寫應使用通用名稱。這些別名的存在是為了避免一次性遷移，而不是作為未來的模型。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
該報告應回答：

- 哪些項目成功
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要取得可用情境的清單，這在評估後續工作規模或接線新傳輸時很有用，請執行 `pnpm openclaw qa coverage`（加上 `--json` 可取得機器可讀輸出）。

若要進行字元與風格檢查，請在多個即時模型參照上執行相同情境，並寫出經評審的 Markdown 報告：

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
情境應透過 `SOUL.md` 設定人格，然後執行一般使用者回合，
例如聊天、工作區協助和小型檔案任務。候選模型不應被告知它正在接受評估。
此命令會保留每份完整逐字稿、記錄基本執行統計資料，然後要求評審模型以快速模式，
並在支援時使用 `xhigh` 推理，依自然度、氛圍和幽默感排名各次執行。
比較提供者時請使用 `--blind-judge-models`：評審提示仍會取得
每份逐字稿和執行狀態，但候選參照會被替換為中性標籤，
例如 `candidate-01`；報告會在剖析後將排名對應回真實參照。
候選執行預設使用 `high` 推理，GPT-5.5 使用 `medium`，而支援的較舊 OpenAI 評估參照使用 `xhigh`。
可使用 `--model provider/model,thinking=<level>` 內嵌覆寫特定候選。
`--thinking <level>` 仍會設定全域備援，而較舊的 `--model-thinking <provider/model=level>` 形式會保留以維持相容性。
OpenAI 候選參照預設使用快速模式，因此在提供者支援時會使用優先處理。
當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。
只有在想要強制每個候選模型都啟用快速模式時，才傳入 `--fast`。
候選和評審持續時間會記錄在報告中供基準分析使用，但評審提示會明確說明不要依速度排名。
候選和評審模型執行都預設並行度為 16。當提供者限制或本機 Gateway
壓力使執行結果過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
