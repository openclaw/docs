---
read_when:
    - 了解 QA 堆疊如何整合運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞 Gateway 儀表板建置更高擬真度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸轉接器與報告。
title: QA 概觀
x-i18n:
    generated_at: "2026-05-05T01:45:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以更貼近真實、通道形態的方式測試 OpenClaw，這是單一單元測試無法做到的。

目前組成：

- `extensions/qa-channel`：合成訊息通道，包含 DM、頻道、執行緒、反應、編輯與刪除介面。
- `extensions/qa-lab`：用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告的除錯器 UI 與 QA 匯流排。
- `extensions/qa-matrix`、未來的執行器 Plugin：即時傳輸配接器，會在子 QA Gateway 內驅動真實通道。
- `qa/`：由 repo 支援的啟動任務種子資產與基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的錯誤，進行修復前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多都有 `pnpm qa:*` 指令碼別名；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                                      |
| `qa suite`                                          | 針對 QA Gateway 跑道執行 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性 Linux VM。                                                                          |
| `qa coverage`                                       | 列印 markdown 情境涵蓋率清單（`--json` 用於機器輸出）。                                                                                                                                     |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案並寫入代理式一致性報告。                                                                                                                               |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                                              |
| `qa manual`                                         | 針對所選 provider/model 跑道執行一次性提示。                                                                                                                                                |
| `qa ui`                                             | 啟動 QA 除錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                              |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                             |
| `qa docker-scaffold`                                | 寫入 QA 儀表板 + Gateway 跑道的 docker-compose 鷹架。                                                                                                                                       |
| `qa up`                                             | 建置 QA 站台、啟動 Docker 支援的堆疊，並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                     |
| `qa aimock`                                         | 只啟動 AIMock provider 伺服器。                                                                                                                                                             |
| `qa mock-openai`                                    | 只啟動具備情境感知能力的 `mock-openai` provider 伺服器。                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用 Convex 憑證池。                                                                                                                                                                    |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸跑道。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                      |
| `qa telegram`                                       | 針對真實私有 Telegram 群組的即時傳輸跑道。                                                                                                                                                  |
| `qa discord`                                        | 針對真實私有 Discord guild 頻道的即時傳輸跑道。                                                                                                                                             |
| `qa slack`                                          | 針對真實私有 Slack 頻道的即時傳輸跑道。                                                                                                                                                     |
| `qa mantis`                                         | 用於即時傳輸錯誤的修復前後驗證執行器，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis)。 |

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA 站台：

- 左側：帶有代理的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 站台、啟動 Docker 支援的 Gateway 跑道，並公開 QA Lab 頁面，讓操作者或自動化迴圈可以給代理一個 QA 任務、觀察真實通道行為，並記錄哪些成功、失敗或仍被阻擋。

若要在每次不重新建置 Docker 映像的情況下更快迭代 QA Lab UI，請使用繫結掛載的 QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像，並將 `extensions/qa-lab/web/dist` 繫結掛載到 `qa-lab` 容器中。`qa:lab:watch` 會在變更時重建該 bundle，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該指令碼會啟動本機 OTLP/HTTP trace 接收器，在啟用 `diagnostics-otel` Plugin 的情況下執行 `otel-trace-smoke` QA 情境，接著解碼匯出的 protobuf spans，並斷言 release 關鍵形狀：必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 與 `openclaw.message.delivery`；模型呼叫在成功輪次中不得匯出 `StreamAbandoned`；原始診斷 ID 與 `openclaw.content.*` 屬性必須留在 trace 之外。它會在 QA suite artifacts 旁寫入 `otel-smoke-summary.json`。

Observability QA 僅限 source checkout。npm tarball 會刻意省略 QA Lab，因此 package Docker release 跑道不會執行 `qa` 命令。變更 diagnostics instrumentation 時，請從已建置的 source checkout 執行 `pnpm qa:otel:smoke`。

若要執行真實傳輸的 Matrix smoke 跑道，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此跑道的完整 CLI 參考、profile/情境目錄、env vars 與 artifact 配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡而言之：它會在 Docker 中佈建一次性的 Tuwunel homeserver、註冊暫時的 driver/SUT/observer 使用者、在限定於該傳輸的子 QA Gateway 內執行真實 Matrix Plugin（沒有 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、觀察到的事件 artifact，以及合併輸出 log。

針對真實傳輸的 Telegram、Discord 與 Slack smoke 跑道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們會以預先存在、帶有兩個 bot（driver + SUT）的真實通道為目標。必要的 env vars、情境清單、輸出 artifacts 與 Convex 憑證池，記錄在下方的 [Telegram、Discord 與 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

若要執行含 VNC 救援的完整 Slack 桌面 VM 執行，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用一台 Crabbox 桌面/瀏覽器機器，在 VM 內執行 Slack 即時跑道，在 VNC 瀏覽器中開啟 Slack Web、擷取桌面，並將 `slack-qa/` 加上 `slack-desktop-smoke.png` 複製回 Mantis artifact 目錄。透過 VNC 手動登入 Slack Web 後，可重用 `--lease-id <cbx_...>`。使用 `--gateway-setup` 時，Mantis 會在 VM 內的 `38973` 連接埠留下持久執行的 OpenClaw Slack Gateway；不使用時，該命令會執行一般 bot-to-bot Slack QA 跑道，並在擷取 artifact 後結束。

使用 pooled 即時憑證之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證 endpoint 設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會回報 secrets 的已設定/缺失狀態。

## 即時傳輸涵蓋率

即時傳輸跑道共用同一份合約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為 suite，並不是即時傳輸涵蓋率矩陣的一部分。

| 跑道     | Canary | 提及門控       | Bot-to-bot | Allowlist block | 頂層回覆        | 重新啟動續接   | 執行緒後續追蹤   | 執行緒隔離       | 反應觀察             | 說明命令     | 原生命令註冊                |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

這會讓 `qa-channel` 維持為廣泛的產品行為 suite，同時讓 Matrix、Telegram 與未來的即時傳輸共用一份明確的傳輸合約檢查清單。

若要執行一次性 Linux VM 跑道，且不將 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass 客體、安裝相依套件、在客體內建置 OpenClaw
、執行 `qa suite`，然後將一般 QA 報告與
摘要複製回主機上的 `.artifacts/qa-e2e/...`。
它會重用與主機上 `qa suite` 相同的情境選擇行為。
主機與 Multipass suite 執行預設會以隔離的 Gateway worker
平行執行多個選取的情境。`qa-channel` 預設並行數為
4，並受選取情境數量限制。使用 `--concurrency <count>` 來調整
worker 數量，或使用 `--concurrency 1` 進行序列執行。
任何情境失敗時，命令都會以非零狀態結束。當你
想取得成品但不想要失敗結束碼時，使用 `--allow-failures`。
即時執行會轉送客體可實際使用的受支援 QA 驗證輸入：
以 env 為基礎的 provider keys、QA live provider config 路徑，以及
存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓客體
可以透過掛載的 workspace 寫回。

## Telegram、Discord 與 Slack QA 參考

Matrix 有一個[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量較多，且需要以 Docker 支援的 homeserver 佈建。Telegram、Discord 與 Slack 較小型，每個只有少數情境，沒有 profile 系統，並針對既有的真實頻道，因此它們的參考資料放在這裡。

### 共用 CLI 旗標

這些 lane 會透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                         | 說明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 只執行此情境。可重複指定。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 報告、摘要、觀察到的訊息與輸出日誌寫入的位置。相對路徑會相對於 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中性 cwd 呼叫時的 repository root。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway config 內的臨時帳戶 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                                | 主要/替代 model refs。                                                                                         |
| `--fast`                              | 關閉                                                             | provider 支援時的快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex credential pool](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                              | 使用 `--credential-source convex` 時的角色。                                                                          |

任何情境失敗時，每個 lane 都會以非零狀態結束。`--allow-failures` 會寫入成品，但不設定失敗結束碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同 bot（driver + SUT）。SUT bot 必須有 Telegram 使用者名稱；當兩個 bot 都在 `@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，bot 對 bot 觀察效果最好。

使用 `--credential-source env` 時必要 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 數字 chat id（字串）。
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
- `telegram-qa-summary.json` — 包含從 canary 開始的每次回覆 RTT（driver 傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` — 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild channel，並使用兩個 bot：由 harness 控制的 driver bot，以及由 child OpenClaw Gateway 透過隨附的 Discord Plugin 啟動的 SUT bot。驗證頻道 mention 處理、SUT bot 已向 Discord 註冊原生 `/help` 命令，以及選擇性啟用的 Mantis 證據情境。

使用 `--credential-source env` 時必要 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必須符合 Discord 回傳的 SUT bot user id（否則此 lane 會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 選擇性啟用的 Mantis 情境。它會單獨執行，因為它會將 SUT 切換為 always-on、tool-only 的 guild 回覆，並設定 `messages.statusReactions.enabled=true`，接著擷取 REST reaction timeline 以及 HTML/PNG 視覺成品。

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
- 執行 status-reaction 情境時會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack channel，並使用兩個不同 bot：由 harness 控制的 driver bot，以及由 child OpenClaw Gateway 透過隨附的 Slack Plugin 啟動的 SUT bot。

使用 `--credential-source env` 時必要 env：

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

#### 設定 Slack workspace

此 lane 需要在同一個 workspace 中有兩個不同 Slack app，以及一個兩個 bot 都是成員的 channel：

- `channelId` — 兩個 bot 都已受邀加入的 channel 的 `Cxxxxxxxxxx` id。請使用專用 channel；此 lane 每次執行都會發文。
- `driverBotToken` — **Driver** app 的 bot token（`xoxb-...`）。
- `sutBotToken` — **SUT** app 的 bot token（`xoxb-...`），它必須是與 driver 分開的 Slack app，讓其 bot user id 不同。
- `sutAppToken` — SUT app 具備 `connections:write` 的 app-level token（`xapp-...`），由 Socket Mode 使用，讓 SUT app 可以接收事件。

建議使用專供 QA 的 Slack workspace，而不是重用 production workspace。

以下 SUT manifest 對應隨附 Slack Plugin 的 production install（`extensions/slack/src/setup-shared.ts:10`）。若要查看使用者看到的 production-channel 設定，請參閱 [Slack channel quick setup](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 組合刻意分開，因為此 lane 需要同一個 workspace 中有兩個不同的 bot user id。

**1. 建立 Driver app**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 選取 QA workspace，貼上以下 manifest，然後 _Install to Workspace_：

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

複製 _Bot User OAuth Token_（`xoxb-...`）— 這會成為 `driverBotToken`。driver 只需要發佈訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT app**

在同一個 workspace 中重複 _Create New App → From a manifest_。scope 集合對應隨附 Slack Plugin 的 production install（`extensions/slack/src/setup-shared.ts:10`）：

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

Slack 建立 app 後，請在其 settings page 上執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增 scope `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個 token 呼叫 `auth.test`，驗證兩個 bot 具有不同的使用者 ID。runtime 會依使用者 ID 區分 driver 與 SUT；重複使用同一個 app 會讓提及閘控立即失敗。

**3. 建立頻道**

在 QA 工作區中建立一個頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID，那會成為 `channelId`。公開頻道可用；如果使用私人頻道，兩個 app 已經都有 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 註冊憑證**

有兩種選項。單機除錯時使用環境變數（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入共用的 Convex 集區，讓 CI 和其他維護者可以租用。

對於 Convex 集區，將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在你的 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，註冊並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 端對端驗證**

在本機執行該通道，確認兩個 bot 可透過 broker 彼此通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

綠燈執行會在遠少於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果通道停滯約 90 秒後以 `Convex credential pool exhausted for kind "slack"` 結束，表示集區為空，或每一列都已被租用；`qa credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### Convex 憑證集區

Telegram、Discord 和 Slack 通道可以從共用 Convex 集區租用憑證，而不是讀取上述環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得專屬租約，在執行期間送出 Heartbeat，並在關閉時釋放。集區種類為 `"telegram"`、`"discord"` 和 `"slack"`。

broker 會在 `admin/add` 驗證的 payload 形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }`，`groupId` 必須是數字 chat-id 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，`channelId` 必須符合 `^[A-Z][A-Z0-9]+$`（例如 `Cxxxxxxxxxx` 的 Slack ID）。請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)，了解 app 與 scope 佈建。

操作用環境變數與 Convex broker 端點合約位於[測試 → 透過 Convex 共用 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該章節名稱早於 Discord 支援；兩種種類的 broker 語意相同）。

## repo 支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些內容刻意放在 git 中，讓 QA 計畫可供人類與 agent 查看。

`qa-lab` 應維持為通用 Markdown 執行器。每個情境 Markdown 檔案都是一次測試執行的事實來源，並應定義：

- 情境中繼資料
- 選用的類別、能力、通道與風險中繼資料
- 文件與程式碼參照
- 選用 Plugin 需求
- 選用 Gateway 設定補丁
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用 runtime 介面可以維持通用且橫切。例如，Markdown 情境可以結合傳輸端 helper 與瀏覽器端 helper，透過 Gateway `browser.request` seam 驅動嵌入式 Control UI，而不需要加入特殊案例 runner。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 追蹤實作。

基準清單應保持足夠廣泛，以涵蓋：

- DM 和頻道聊天
- thread 行為
- 訊息動作生命週期
- cron 回呼
- 記憶回想
- 模型切換
- subagent 交接
- repo 讀取與文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## Provider 模擬通道

`qa suite` 有兩個本機 provider 模擬通道：

- `mock-openai` 是情境感知的 OpenClaw 模擬。它仍是 repo 支援 QA 與 parity gate 的預設確定性模擬通道。
- `aimock` 會啟動 AIMock 支援的 provider 伺服器，用於實驗性 protocol、fixture、record/replay 與 chaos 覆蓋。它是加成項目，不會取代 `mock-openai` 情境 dispatcher。

Provider 通道實作位於 `extensions/qa-lab/src/providers/`。每個 provider 都擁有自己的預設值、本機伺服器啟動、Gateway 模型設定、auth-profile staging 需求，以及 live/mock 能力旗標。共用 suite 與 Gateway 程式碼應透過 provider registry 路由，而不是依 provider 名稱分支。

## 傳輸配接器

`qa-lab` 為 Markdown QA 情境擁有通用傳輸 seam。`qa-channel` 是該 seam 上的第一個配接器，但設計目標更廣：未來的真實或合成頻道應接入同一個 suite runner，而不是新增傳輸專用 QA runner。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、worker 並行、artifact 寫入與回報。
- 傳輸配接器擁有 Gateway 設定、就緒狀態、入站與出站觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 Markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用 runtime 介面。

### 新增頻道

將頻道新增至 Markdown QA 系統只需要兩件事：

1. 該頻道的傳輸配接器。
2. 測試頻道合約的情境套件。

當共用 `qa-lab` host 可以擁有流程時，不要新增新的頂層 QA 命令根。

`qa-lab` 擁有共用 host 機制：

- `openclaw qa` 命令根
- suite 啟動與拆除
- worker 並行
- artifact 寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容別名

Runner plugin 擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共用 `qa` 根底下
- Gateway 如何針對該傳輸設定
- 如何檢查就緒狀態
- 如何注入入站事件
- 如何觀察出站訊息
- 如何公開 transcript 與正規化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸專用 reset 或 cleanup

新頻道的最低採用門檻：

1. 保持 `qa-lab` 作為共用 `qa` 根的擁有者。
2. 在共用 `qa-lab` host seam 上實作傳輸 runner。
3. 將傳輸專用機制保留在 runner plugin 或頻道測試框架內。
4. 將 runner 掛載為 `openclaw qa <runner>`，而不是註冊競爭的根命令。Runner plugin 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；lazy CLI 與 runner 執行應保留在獨立進入點後方。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或調整 Markdown 情境。
6. 對新情境使用通用情境 helper。
7. 除非 repo 正在進行刻意遷移，否則保持現有相容別名可用。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中一次表達，請放在 `qa-lab`。
- 如果行為取決於單一頻道傳輸，請保留在該 runner plugin 或 Plugin 測試框架中。
- 如果情境需要一項可供多個頻道使用的新能力，請新增通用 helper，而不是在 `suite.ts` 中加入頻道專用分支。
- 如果某個行為只對單一傳輸有意義，請保持情境為傳輸專用，並在情境合約中明確表示。

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

現有情境仍可使用相容別名：`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`，但撰寫新情境應使用通用名稱。這些別名的存在是為了避免一次性大遷移，而不是未來的模型。

## 回報

`qa-lab` 會從觀察到的 bus 時間軸匯出 Markdown protocol 報告。
報告應回答：

- 哪些項目正常運作
- 哪些項目失敗
- 哪些項目仍被阻塞
- 哪些後續情境值得新增

若要查看可用情境清單，用於評估後續工作規模或串接新傳輸，請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。

對於角色與風格檢查，請使用多個 live 模型 ref 執行相同情境，並寫出經評審的 Markdown 報告：

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
例如聊天、工作區協助和小型檔案任務。不應告知候選模型
它正在接受評估。此命令會保留每份完整逐字稿，
記錄基本執行統計，接著以快速模式要求評審模型在支援時使用
`xhigh` 推理，依自然度、氛圍和幽默感為執行結果排名。
比較供應商時請使用 `--blind-judge-models`：評審提示仍會取得
每份逐字稿與執行狀態，但候選參照會替換為中性標籤，
例如 `candidate-01`；報告會在解析後將排名映射回真實參照。
候選執行預設使用 `high` 思考，GPT-5.5 使用 `medium`，
而支援的較舊 OpenAI 評估參照使用 `xhigh`。可使用
`--model provider/model,thinking=<level>` 內嵌覆寫特定候選。
`--thinking <level>` 仍會設定全域後援，而較舊的
`--model-thinking <provider/model=level>` 形式會保留以維持相容性。
OpenAI 候選參照預設使用快速模式，因此在供應商支援時會使用
優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、
`,no-fast` 或 `,fast=false`。只有在想要強制每個候選模型都啟用
快速模式時，才傳入 `--fast`。報告會記錄候選與評審的耗時以供
基準分析，但評審提示會明確要求不要依速度排名。
候選與評審模型執行的預設並行數皆為 16。當供應商限制或本機 Gateway
壓力導致執行過於嘈雜時，請降低 `--concurrency` 或
`--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`，以及
`google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [Matrix QA](/zh-TW/concepts/qa-matrix)
- [QA Channel](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [Dashboard](/zh-TW/web/dashboard)
