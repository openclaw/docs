---
read_when:
    - 了解 QA 堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 場景
    - 圍繞 Gateway 儀表板建置更貼近真實情境的品質保證自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、儲存庫支援的情境、即時傳輸通道、傳輸配接器和報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-05-06T02:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更貼近真實、通道形態的方式測試 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，包含 DM、頻道、討論串、反應、編輯與刪除介面。
- `extensions/qa-lab`：偵錯 UI 與 QA 匯流排，用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的執行器 Plugin：即時傳輸配接器，會在子 QA gateway 中驅動真實通道。
- `qa/`：由儲存庫支援的啟動任務與基準 QA 情境種子資產。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的錯誤，進行修正前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多命令都有 `pnpm qa:*` 指令別名；兩種形式都受支援。

| 命令                                                | 用途                                                                                                                                                                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 內建 QA 自我檢查；寫入 Markdown 報告。                                                                                                                                                                                                                                  |
| `qa suite`                                          | 對 QA gateway 跑道執行由儲存庫支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性 Linux VM。                                                                                                                                                      |
| `qa coverage`                                       | 列印 markdown 情境覆蓋率清單（`--json` 用於機器輸出）。                                                                                                                                                                                                                 |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案並寫入代理式同等性報告。                                                                                                                                                                                                           |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                                                                                                                       |
| `qa manual`                                         | 對選取的供應商/模型跑道執行一次性提示。                                                                                                                                                                                                                                |
| `qa ui`                                             | 啟動 QA 偵錯 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                            |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                        |
| `qa docker-scaffold`                                | 寫入 QA 儀表板 + gateway 跑道的 docker-compose 腳手架。                                                                                                                                                                                                                |
| `qa up`                                             | 建置 QA 網站、啟動由 Docker 支援的堆疊，並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加上 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                               |
| `qa aimock`                                         | 僅啟動 AIMock 供應商伺服器。                                                                                                                                                                                                                                           |
| `qa mock-openai`                                    | 僅啟動具情境感知能力的 `mock-openai` 供應商伺服器。                                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 認證集區。                                                                                                                                                                                                                                             |
| `qa matrix`                                         | 對一次性 Tuwunel homeserver 執行即時傳輸跑道。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                                |
| `qa telegram`                                       | 對真實私有 Telegram 群組執行即時傳輸跑道。                                                                                                                                                                                                                             |
| `qa discord`                                        | 對真實私有 Discord guild 頻道執行即時傳輸跑道。                                                                                                                                                                                                                        |
| `qa slack`                                          | 對真實私有 Slack 頻道執行即時傳輸跑道。                                                                                                                                                                                                                                |
| `qa mantis`                                         | 針對即時傳輸錯誤的修正前後驗證執行器，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器煙霧測試，以及 Slack-in-VNC 煙霧測試。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

## 操作員流程

目前的 QA 操作員流程是一個雙窗格 QA 網站：

- 左側：包含 agent 的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 逐字稿與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動由 Docker 支援的 gateway 跑道，並公開 QA Lab 頁面，讓操作員或自動化迴圈可以給 agent 一個 QA 任務、觀察真實通道行為，並記錄哪些有效、失敗或仍受阻。

若要在不每次重建 Docker 映像的情況下更快速迭代 QA Lab UI，請使用繫結掛載的 QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預建映像，並將 `extensions/qa-lab/web/dist` 繫結掛載到 `qa-lab` 容器。`qa:lab:watch` 會在變更時重建該 bundle，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

若要進行本機 OpenTelemetry trace 煙霧測試，請執行：

```bash
pnpm qa:otel:smoke
```

該腳本會啟動本機 OTLP/HTTP trace 接收器，在啟用 `diagnostics-otel` Plugin 的情況下執行 `otel-trace-smoke` QA 情境，然後解碼匯出的 protobuf spans，並斷言發布關鍵形狀：必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 與 `openclaw.message.delivery`；成功回合中的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 與 `openclaw.content.*` 屬性必須留在 trace 之外。它會在 QA suite 成果旁寫入 `otel-smoke-summary.json`。

可觀測性 QA 僅限原始碼 checkout。npm tarball 會刻意省略 QA Lab，因此套件 Docker 發布跑道不會執行 `qa` 命令。變更診斷檢測時，請從已建置的原始碼 checkout 使用 `pnpm qa:otel:smoke`。

若要執行真實傳輸 Matrix 煙霧跑道，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此跑道的完整 CLI 參考、設定檔/情境目錄、環境變數與成果配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡要來說：它會在 Docker 中佈建一次性 Tuwunel homeserver、註冊臨時 driver/SUT/observer 使用者、在限定於該傳輸的子 QA gateway 中執行真實 Matrix Plugin（沒有 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、觀察到的事件成果，以及合併輸出日誌。

這些情境涵蓋單元測試無法端到端證明的傳輸行為：提及閘控、allow-bot 政策、允許清單、頂層與討論串回覆、DM 路由、反應處理、傳入編輯抑制、重新啟動重播去重、homeserver 中斷復原、核准中繼資料傳遞、媒體處理，以及 Matrix E2EE 啟動/復原/驗證流程。E2EE CLI 設定檔也會透過同一個一次性 homeserver 驅動 `openclaw matrix encryption setup` 與驗證命令，然後檢查 gateway 回覆。

Discord 也有僅供 Mantis 使用的選擇性情境，用於錯誤重現。使用 `--scenario discord-status-reactions-tool-only` 取得明確的狀態反應時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment` 建立真實 Discord 討論串，並驗證 `message.thread-reply` 會保留 `filePath` 附件。這些情境不屬於預設即時 Discord 跑道，因為它們是修正前後的重現探針，而非廣泛的煙霧覆蓋。當 QA 環境中設定 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，討論串附件 Mantis 工作流程也可以加入已登入 Discord Web 的見證影片。該 viewer 設定檔僅用於視覺擷取；通過/失敗判定仍來自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程與預設手動執行會使用即時 frontier 認證、`--fast` 與 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 執行快速 Matrix 設定檔。手動 `matrix_profile=all` 會展開為五個設定檔 shard，使完整目錄可平行執行，同時為每個 shard 保留一個成果目錄。

若要執行真實傳輸 Telegram、Discord 與 Slack 煙霧跑道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們會以預先存在的真實通道為目標，並使用兩個 bot（driver + SUT）。必要環境變數、情境清單、輸出成果與 Convex 認證集區記錄於下方的 [Telegram、Discord 與 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

如需執行完整且具備 VNC 救援的 Slack 桌面 VM，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用一台 Crabbox 桌面／瀏覽器機器，在 VM 內執行 Slack 即時通道，在 VNC 瀏覽器中開啟 Slack Web、擷取桌面畫面，並在可用視訊擷取時，將 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 複製回 Mantis 成品目錄。Crabbox 桌面／瀏覽器租約會預先提供擷取工具和瀏覽器／原生建置輔助套件，因此情境只應在較舊的租約上安裝備援項目。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中回報總耗時與各階段耗時，因此較慢的執行會顯示時間是花在租約暖機、認證取得、遠端設定，還是成品複製。透過 VNC 手動登入 Slack Web 後，可重複使用 `--lease-id <cbx_...>`；重複使用的租約也會讓 Crabbox 的 pnpm store 快取保持暖機。預設的 `--hydrate-mode source` 會從原始碼 checkout 驗證，並在 VM 內執行安裝／建置。只有在重複使用的遠端工作區已經有 `node_modules` 和已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；該模式會跳過耗時的安裝／建置步驟，並在工作區尚未就緒時封閉式失敗。搭配 `--gateway-setup` 時，Mantis 會在 VM 內的連接埠 `38973` 留下一個持久執行的 OpenClaw Slack Gateway；若未搭配，該命令會執行一般的機器人對機器人 Slack QA 通道，並在擷取成品後結束。

操作員檢查清單、GitHub workflow 派送命令、證據留言契約、hydrate-mode 決策表、耗時解讀與失敗處理步驟，位於 [Mantis Slack 桌面執行手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。

如需執行 agent／CV 風格的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 會租用或重複使用一台 Crabbox 桌面／瀏覽器機器、啟動 `crabbox record --while`、透過巢狀 `visual-driver` 驅動可見瀏覽器、擷取 `visual-task.png`，在選取 `--vision-mode image-describe` 時對螢幕截圖執行 `openclaw infer image describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。設定 `--expect-text` 時，視覺提示會要求結構化 JSON 判定，而且只有在模型回報正向可見證據時才會通過；僅引用目標文字的否定回應會使斷言失敗。使用 `--vision-mode metadata` 可進行不呼叫影像理解 provider 的無模型煙霧測試，用來證明桌面、瀏覽器、螢幕截圖和視訊管線。錄影是 `visual-task` 的必要成品；如果 Crabbox 沒有錄到非空的 `visual-task.mp4`，即使視覺 driver 通過，任務仍會失敗。失敗時，除非任務已通過且未設定 `--keep-lease`，否則 Mantis 會保留租約以供 VNC 使用。

在使用集區即時憑證之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證端點設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會回報秘密的已設定／缺少狀態。

## 即時傳輸覆蓋範圍

即時傳輸通道共用一個契約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為套件，不屬於即時傳輸覆蓋矩陣。

| 通道     | Canary | 提及閘控 | 機器人對機器人 | Allowlist 封鎖 | 頂層回覆 | 重新啟動恢復 | 對話串後續追蹤 | 對話串隔離 | Reaction 觀察 | Help 命令 | 原生命令註冊 |
| -------- | ------ | -------- | -------------- | -------------- | -------- | ------------ | ---------------- | ---------- | ------------- | --------- | ------------ |
| Matrix   | x      | x        | x              | x              | x        | x            | x                | x          | x             |           |              |
| Telegram | x      | x        | x              |                |          |              |                  |            |               | x         |              |
| Discord  | x      | x        | x              |                |          |              |                  |            |               |           | x            |
| Slack    | x      | x        | x              | x              | x        | x            | x                | x          |               |           |              |

這會讓 `qa-channel` 保持作為廣泛的產品行為套件，同時讓 Matrix、Telegram 和未來的即時傳輸共用一份明確的傳輸契約檢查清單。

如需執行一次性 Linux VM 通道，且不把 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動一台全新的 Multipass guest、安裝相依項目、在 guest 內建置 OpenClaw、執行 `qa suite`，然後將一般 QA 報告和摘要複製回主機上的 `.artifacts/qa-e2e/...`。
它會重複使用與主機上 `qa suite` 相同的情境選取行為。
主機與 Multipass 套件執行預設會以隔離的 Gateway worker 平行執行多個已選情境。`qa-channel` 預設並行度為 4，並受所選情境數量限制。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
任何情境失敗時，該命令會以非零狀態結束。若想取得成品但不讓結束碼失敗，請使用 `--allow-failures`。
即時執行會轉送對 guest 實用的受支援 QA auth 輸入：以 env 為基礎的 provider key、QA 即時 provider 設定路徑，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓 guest 可以透過掛載的工作區寫回。

## Telegram、Discord 與 Slack QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為其情境數量多，且需要以 Docker 支援的 homeserver 佈建。Telegram、Discord 和 Slack 較小型，各自只有少量情境、沒有 profile 系統，並針對既有的真實 channel，因此它們的參考資訊放在這裡。

### 共用 CLI 旗標

這些通道透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                          | 說明                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | 只執行此情境。可重複。                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 報告／摘要／觀察到的訊息與輸出記錄寫入的位置。相對路徑會依 `--repo-root` 解析。                                      |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定內的暫時帳戶 id。                                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                     |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                                 | 主要／替代模型 ref。                                                                                                  |
| `--fast`                              | 關閉                                                            | provider 支援時的快速模式。                                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex 憑證集區](#convex-credential-pool)。                                                                   |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                               | `--credential-source convex` 時使用的角色。                                                                           |

任何情境失敗時，各通道會以非零狀態結束。`--allow-failures` 會寫入成品，而不設定失敗結束碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的機器人（driver + SUT）。SUT 機器人必須有 Telegram 使用者名稱；當兩個機器人都在 `@BotFather` 中啟用**機器人對機器人通訊模式**時，機器人對機器人觀察效果最佳。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字 chat id（字串）。
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
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

輸出成品：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - 包含從 canary 開始的每次回覆 RTT（driver 傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild channel，並使用兩個機器人：由 harness 控制的 driver 機器人，以及由子 OpenClaw Gateway 透過隨附 Discord Plugin 啟動的 SUT 機器人。會驗證 channel 提及處理、SUT 機器人已向 Discord 註冊原生 `/help` 命令，以及選用的 Mantis 證據情境。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 回傳的 SUT 機器人使用者 id（否則通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - 選用的 Mantis 情境。它會單獨執行，因為它會將 SUT 切換為永遠開啟、僅工具的 guild 回覆，並設定 `messages.statusReactions.enabled=true`，然後擷取 REST reaction 時間軸以及 HTML/PNG 視覺成品。Mantis 前後比較報告也會將情境提供的 MP4 成品保留為 `baseline.mp4` 和 `candidate.mp4`。

明確執行 Mantis 狀態 reaction 情境：

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
- `discord-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則內文會被遮蔽。
- 當狀態反應情境執行時，會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個真實的私人 Slack 頻道為目標，並使用兩個不同的機器人：由測試框架控制的驅動程式機器人，以及由子 OpenClaw Gateway 透過內建 Slack Plugin 啟動的 SUT 機器人。

使用 `--credential-source env` 時必要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留訊息內文。

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
- `slack-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則內文會被遮蔽。

#### 設定 Slack 工作區

此通道需要在同一個工作區中有兩個不同的 Slack 應用程式，以及一個兩個機器人都已加入的頻道：

- `channelId` - 兩個機器人都已受邀加入的頻道 `Cxxxxxxxxxx` ID。請使用專用頻道；此通道每次執行都會發文。
- `driverBotToken` - **驅動程式**應用程式的機器人權杖（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖（`xoxb-...`），此應用程式必須與驅動程式分屬不同的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - SUT 應用程式具有 `connections:write` 的應用程式層級權杖（`xapp-...`），由 Socket Mode 使用，讓 SUT 應用程式能接收事件。

建議使用專用於 QA 的 Slack 工作區，而不是重用生產工作區。

下方的 SUT manifest 特意將內建 Slack Plugin 的生產安裝（`extensions/slack/src/setup-shared.ts:10`）縮小到即時 Slack QA 套件涵蓋的權限與事件。使用者看到的生產頻道設定請參閱 [Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA 驅動程式/SUT 組合刻意分開，因為此通道需要同一個工作區中的兩個不同機器人使用者 ID。

**1. 建立驅動程式應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _建立新的應用程式_ → _從 manifest_ → 選擇 QA 工作區，貼上下列 manifest，然後 _安裝到工作區_：

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

複製 _機器人使用者 OAuth 權杖_（`xoxb-...`）- 這會成為 `driverBotToken`。驅動程式只需要發布訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一個工作區中重複 _建立新的應用程式 → 從 manifest_。此 QA 應用程式刻意使用內建 Slack Plugin 生產 manifest（`extensions/slack/src/setup-shared.ts:10`）的較窄版本：反應範圍與事件會省略，因為即時 Slack QA 套件尚未涵蓋反應處理。

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

Slack 建立應用程式後，在其設定頁面做兩件事：

- _安裝到工作區_ → 複製 _機器人使用者 OAuth 權杖_ → 這會成為 `sutBotToken`。
- _基本資訊 → 應用程式層級權杖 → 產生權杖和範圍_ → 新增範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個權杖呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。執行階段會透過使用者 ID 區分驅動程式和 SUT；兩者重用同一個應用程式會讓提及閘控立即失敗。

**3. 建立頻道**

在 QA 工作區中建立一個頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個機器人：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _頻道資訊 → 關於 → 頻道 ID_ 複製 `Cxxxxxxxxxx` ID - 這會成為 `channelId`。公開頻道可行；如果使用私人頻道，兩個應用程式都已具有 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 登錄憑證**

有兩個選項。單機除錯時使用環境變數（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或為共享 Convex 池建立種子，讓 CI 和其他維護者可租用它們。

對於 Convex 池，將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，登錄並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 端對端驗證**

在本機執行此通道，確認兩個機器人可以透過代理彼此交談：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態都是 `pass`。如果此通道停滯約 90 秒並以 `Convex credential pool exhausted for kind "slack"` 結束，表示池是空的，或每一列都已被租用 - `qa credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### Convex 憑證池

Telegram、Discord 和 Slack 通道可以從共享 Convex 池租用憑證，而不是讀取上方的環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨佔租用，在執行期間傳送 Heartbeat，並在關閉時釋放它。池種類為 `"telegram"`、`"discord"` 和 `"slack"`。

代理在 `admin/add` 驗證的承載形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必須是數字聊天 ID 字串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` 必須符合 `^[A-Z][A-Z0-9]+$`（像 `Cxxxxxxxxxx` 這樣的 Slack ID）。應用程式與範圍佈建請參閱 [設定 Slack 工作區](#setting-up-the-slack-workspace)。

操作環境變數與 Convex 代理端點合約位於 [測試 → 透過 Convex 共享 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（此章節名稱早於 Discord 支援；兩種種類的代理語意相同）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些內容刻意放在 git 中，讓 QA 計畫同時對人類和代理可見。

`qa-lab` 應維持為通用 Markdown 執行器。每個情境 Markdown 檔案都是一次測試執行的事實來源，並應定義：

- 情境中繼資料
- 選用的類別、能力、通道和風險中繼資料
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用執行階段介面可以維持通用且跨領域。例如，Markdown 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，透過 Gateway `browser.request` seam 驅動內嵌 Control UI，而不需要新增特殊情況執行器。

情境檔案應依產品能力分組，而不是依來源樹資料夾分組。檔案移動時保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 進行實作可追溯性。

基準清單應維持足夠廣泛，以涵蓋：

- DM 與頻道聊天
- 對話串行為
- 訊息動作生命週期
- Cron 回呼
- 記憶回想
- 模型切換
- 子代理交接
- 讀取儲存庫與讀取文件
- 一個小型建置工作，例如 Lobster Invaders

## 提供者模擬通道

`qa suite` 有兩個本機提供者模擬通道：

- `mock-openai` 是情境感知的 OpenClaw 模擬。它仍是儲存庫支援 QA 與同等性閘門的預設確定性模擬通道。
- `aimock` 會啟動 AIMock 支援的提供者伺服器，用於實驗性協定、夾具、錄製/重播和混沌涵蓋。它是附加項，不會取代 `mock-openai` 情境分派器。

提供者通道實作位於 `extensions/qa-lab/src/providers/` 下。每個提供者擁有其預設值、本機伺服器啟動、Gateway 模型設定、驗證設定檔暫存需求，以及即時/模擬能力旗標。共享套件與 Gateway 程式碼應透過提供者登錄路由，而不是依提供者名稱分支。

## 傳輸配接器

`qa-lab` 擁有一個通用傳輸 seam，用於 Markdown QA 情境。`qa-channel` 是該 seam 上的第一個配接器，但設計目標更廣：未來的真實或合成頻道應插入同一個套件執行器，而不是新增傳輸特定的 QA 執行器。

在架構層級，切分如下：

- `qa-lab` 擁有通用情境執行、工作者並行、成品寫入和報告。
- 傳輸配接器擁有 Gateway 設定、就緒狀態、輸入與輸出觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 Markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用執行階段介面。

### 新增頻道

將頻道新增到 Markdown QA 系統只需要兩件事：

1. 該頻道的傳輸配接器。
2. 演練頻道合約的情境包。

當共享 `qa-lab` 主機可以擁有流程時，不要新增新的頂層 QA 命令根。

`qa-lab` 擁有共享主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆卸
- worker 並行度
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器 Plugin 擁有傳輸契約：

- `openclaw qa <runner>` 如何掛載在共用的 `qa` 根底下
- Gateway 如何針對該傳輸進行設定
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字稿與正規化的傳輸狀態
- 如何執行由傳輸支援的動作
- 如何處理傳輸專屬的重設或清理

新通道的最低採用門檻：

1. 保持 `qa-lab` 作為共用 `qa` 根的擁有者。
2. 在共用的 `qa-lab` 主機接縫上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器 Plugin 或通道測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊競爭性的根命令。執行器 Plugin 應在 `openclaw.plugin.json` 宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲 CLI 和執行器執行應留在獨立進入點後方。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或改寫 Markdown 情境。
6. 新情境使用通用情境 helper。
7. 除非 repo 正在進行有意的遷移，否則保持現有相容性別名可用。

判斷規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為依賴單一通道傳輸，就保留在該執行器 Plugin 或 Plugin 測試框架中。
- 如果情境需要一項可由多個通道使用的新能力，請新增通用 helper，而不是在 `suite.ts` 中加入通道專屬分支。
- 如果某個行為只對單一傳輸有意義，請保持該情境為傳輸專屬，並在情境契約中明確說明。

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

現有情境仍可使用相容性別名 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新情境撰寫應使用通用名稱。這些別名的存在是為了避免一次性強制遷移，而不是未來的模型。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些可正常運作
- 哪些失敗
- 哪些仍受阻
- 哪些後續情境值得新增

若要查看可用情境清單 - 在評估後續工作規模或接線新傳輸時很有用 - 請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。

若要進行角色與風格檢查，請跨多個即時模型 ref 執行同一個情境，並撰寫經評審的 Markdown 報告：

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

此命令會執行本機 QA Gateway 子行程，而不是 Docker。角色評估情境應透過 `SOUL.md` 設定人格，然後執行一般使用者回合，例如聊天、工作區協助和小型檔案任務。不應告知候選模型其正在接受評估。此命令會保留每份完整逐字稿、記錄基本執行統計，然後以 fast 模式要求評審模型，並在支援時使用 `xhigh` reasoning，依自然度、氛圍和幽默感為執行結果排名。
比較提供者時使用 `--blind-judge-models`：評審提示仍會取得每份逐字稿與執行狀態，但候選 ref 會替換成中性標籤，例如 `candidate-01`；報告會在解析後將排名映射回真實 ref。
候選執行預設為 `high` thinking，GPT-5.5 使用 `medium`，支援 `xhigh` 的較舊 OpenAI 評估 ref 則使用 `xhigh`。可使用 `--model provider/model,thinking=<level>` 內嵌覆寫特定候選。`--thinking <level>` 仍會設定全域備援，而較舊的 `--model-thinking <provider/model=level>` 形式會保留以維持相容性。
OpenAI 候選 ref 預設為 fast 模式，因此在提供者支援時會使用優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在你想對每個候選模型強制啟用 fast 模式時，才傳入 `--fast`。候選與評審耗時會記錄在報告中供基準分析使用，但評審提示會明確要求不要依速度排名。
候選與評審模型執行預設並行度皆為 16。當提供者限制或本機 Gateway 壓力導致執行過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設為 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設為 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [Matrix QA](/zh-TW/concepts/qa-matrix)
- [QA Channel](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [Dashboard](/zh-TW/web/dashboard)
