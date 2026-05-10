---
read_when:
    - 了解 QA 堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞 Gateway 儀表板建構更高擬真度的品質保證自動化
summary: QA 堆疊概觀：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸路徑、傳輸配接器與報告功能。
title: QA 概覽
x-i18n:
    generated_at: "2026-05-10T19:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊旨在以比單一單元測試更真實、更貼近通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，包含 DM、頻道、討論串、反應、編輯與刪除介面。
- `extensions/qa-lab`：偵錯工具 UI 與 QA 匯流排，用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的執行器 plugins：即時傳輸配接器，會在子 QA gateway 內驅動真實通道。
- `qa/`：由 repo 支援的起始任務種子資產與基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、VM 狀態與 PR 證據的 bug，進行修正前與修正後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程都有 `pnpm qa:*` script 別名；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | 內建 QA 自我檢查；寫出 Markdown 報告。                                                                                                                                                                                                                                   |
| `qa suite`                                          | 針對 QA gateway lane 執行由 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性的 Linux VM。                                                                                                                                                  |
| `qa coverage`                                       | 印出 markdown 情境覆蓋率清單（`--json` 用於機器輸出）。                                                                                                                                                                                                                  |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，並寫出 agentic parity 報告。                                                                                                                                                                                                       |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                                                                                                                           |
| `qa manual`                                         | 針對選定的 provider/model lane 執行一次性 prompt。                                                                                                                                                                                                                       |
| `qa ui`                                             | 啟動 QA 偵錯工具 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                         |
| `qa docker-build-image`                             | 建置預先製作的 QA Docker 映像。                                                                                                                                                                                                                                          |
| `qa docker-scaffold`                                | 寫出 QA 儀表板 + gateway lane 的 docker-compose scaffold。                                                                                                                                                                                                               |
| `qa up`                                             | 建置 QA site、啟動由 Docker 支援的堆疊，並印出 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                 |
| `qa aimock`                                         | 只啟動 AIMock provider server。                                                                                                                                                                                                                                          |
| `qa mock-openai`                                    | 只啟動具情境感知能力的 `mock-openai` provider server。                                                                                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 憑證集區。                                                                                                                                                                                                                                               |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                                  |
| `qa telegram`                                       | 針對真實私有 Telegram 群組的即時傳輸 lane。                                                                                                                                                                                                                              |
| `qa discord`                                        | 針對真實私有 Discord guild 頻道的即時傳輸 lane。                                                                                                                                                                                                                         |
| `qa slack`                                          | 針對真實私有 Slack 頻道的即時傳輸 lane。                                                                                                                                                                                                                                 |
| `qa mantis`                                         | 用於即時傳輸 bug 的修正前與修正後驗證執行器，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

## 操作者流程

目前的 QA 操作者流程是雙窗格 QA site：

- 左側：含 agent 的 Gateway 儀表板（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動由 Docker 支援的 gateway lane，並公開 QA Lab 頁面，讓操作者或自動化迴圈可以給 agent 一項 QA 任務、觀察真實通道行為，並記錄哪些有效、失敗或仍然受阻。

若要在不每次重建 Docker 映像的情況下更快迭代 QA Lab UI，請以 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預建映像，並將 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器。`qa:lab:watch` 會在變更時重建該 bundle，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry trace smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該 script 會啟動本機 OTLP/HTTP trace receiver，啟用 `diagnostics-otel` plugin 後執行 `otel-trace-smoke` QA 情境，接著解碼匯出的 protobuf spans，並斷言 release-critical 結構：必須存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 與 `openclaw.message.delivery`；成功回合中的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 與 `openclaw.content.*` 屬性必須保持在 trace 之外。它會在 QA suite artifacts 旁寫入 `otel-smoke-summary.json`。

可觀測性 QA 僅保留於 source checkout。npm tarball 會刻意省略 QA Lab，因此 package Docker release lanes 不會執行 `qa` 命令。變更診斷 instrumentation 時，請從已建置的 source checkout 執行 `pnpm qa:otel:smoke`。

若要執行使用真實傳輸的 Matrix smoke lane，請執行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 參考、profile/情境目錄、env vars 與 artifact 版面配置，位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡要來說：它會在 Docker 中佈建一次性的 Tuwunel homeserver、註冊臨時 driver/SUT/observer users，在範圍限定於該傳輸的子 QA gateway 中執行真實 Matrix plugin（不使用 `qa-channel`），接著在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events artifact 與合併輸出記錄。

這些情境涵蓋單元測試無法端到端證明的傳輸行為：mention gating、allow-bot policies、allowlists、頂層與 threaded replies、DM routing、reaction handling、inbound edit suppression、restart replay dedupe、homeserver interruption recovery、approval metadata delivery、media handling，以及 Matrix E2EE bootstrap/recovery/verification flows。E2EE CLI profile 也會透過相同的一次性 homeserver 驅動 `openclaw matrix encryption setup` 與驗證命令，然後檢查 gateway 回覆。

Discord 也有僅限 Mantis 的 opt-in 情境，用於 bug 重現。使用 `--scenario discord-status-reactions-tool-only` 可取得明確的狀態反應時間線，或使用 `--scenario discord-thread-reply-filepath-attachment` 建立真實 Discord thread，並驗證 `message.thread-reply` 會保留 `filePath` attachment。這些情境不屬於預設的即時 Discord lane，因為它們是修正前/修正後重現探針，而不是廣泛的 smoke 覆蓋率。當 QA 環境中設定 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis workflow 也可以加入已登入 Discord Web 的見證影片。該 viewer profile 僅用於視覺擷取；pass/fail 判定仍來自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程與預設手動執行會使用即時 frontier 憑證、`--fast` 與 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 執行 fast Matrix profile。手動 `matrix_profile=all` 會展開為五個 profile shards，讓完整目錄可以平行執行，同時為每個 shard 保留一個 artifact 目錄。

若要執行使用真實傳輸的 Telegram、Discord 與 Slack smoke lanes：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它們會以已存在的真實通道為目標，並使用兩個 bots（driver + SUT）。必要 env vars、情境清單、輸出 artifacts 與 Convex 憑證集區，皆記錄於下方的 [Telegram、Discord 與 Slack QA 參考](#telegram-discord-and-slack-qa-reference)。

若要進行完整的 Slack 桌面 VM 執行並具備 VNC 救援，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用一台 Crabbox 桌面/瀏覽器機器，在 VM 內執行 Slack 即時測試線，在 VNC 瀏覽器中開啟 Slack Web，擷取桌面，並在可用視訊擷取時，將 `slack-qa/`、`slack-desktop-smoke.png` 與 `slack-desktop-smoke.mp4` 複製回 Mantis 成品目錄。Crabbox 桌面/瀏覽器租約會預先提供擷取工具與瀏覽器/native-build 輔助套件，因此此情境應該只會在較舊的租約上安裝備援項目。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中回報總耗時與各階段耗時，因此較慢的執行可顯示時間是花在租約暖機、憑證取得、遠端設定或成品複製。透過 VNC 手動登入 Slack Web 後，請重複使用 `--lease-id <cbx_...>`；重複使用的租約也會讓 Crabbox 的 pnpm 儲存快取保持暖機狀態。預設的 `--hydrate-mode source` 會從原始碼 checkout 驗證，並在 VM 內執行安裝/建置。只有在重複使用的遠端工作區已經有 `node_modules` 與建置好的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；該模式會略過昂貴的安裝/建置步驟，並在工作區尚未就緒時保守失敗。使用 `--gateway-setup` 時，Mantis 會在 VM 內的 `38973` 連接埠留下持續執行的 OpenClaw Slack Gateway；若未使用，該命令會執行一般的機器人對機器人 Slack QA 測試線，並在擷取成品後結束。

操作員檢查清單、GitHub 工作流程派送命令、證據留言合約、hydrate 模式決策表、耗時解讀與失敗處理步驟，都位於 [Mantis Slack 桌面執行手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行代理/CV 風格的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 會租用或重複使用一台 Crabbox 桌面/瀏覽器機器，啟動 `crabbox record --while`，透過巢狀的 `visual-driver` 驅動可見瀏覽器，擷取 `visual-task.png`，在選取 `--vision-mode image-describe` 時針對螢幕截圖執行 `openclaw infer image describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 與 `mantis-visual-task-report.md`。設定 `--expect-text` 時，視覺提示會要求結構化 JSON 判定，而且只有當模型回報正向的可見證據時才會通過；如果負面回應只是引用目標文字，斷言會失敗。使用 `--vision-mode metadata` 可進行不呼叫影像理解提供者的無模型 smoke，證明桌面、瀏覽器、螢幕截圖與視訊管線可運作。錄影是 `visual-task` 的必要成品；如果 Crabbox 沒有錄到非空的 `visual-task.mp4`，即使視覺驅動器已通過，任務仍會失敗。失敗時，Mantis 會保留租約供 VNC 使用，除非任務已經通過且未設定 `--keep-lease`。

在使用集區化即時憑證之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境、驗證端點設定，並在維護者密鑰存在時驗證管理/list 可達性。它只會回報密鑰的已設定/缺失狀態。

## 即時傳輸涵蓋範圍

即時傳輸測試線共用同一份合約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為套件，不屬於即時傳輸涵蓋矩陣。

| 測試線   | Canary | 提及閘控 | 機器人對機器人 | 允許清單封鎖 | 頂層回覆 | 重新啟動續接 | 執行緒後續回覆 | 執行緒隔離 | 反應觀察 | 說明命令 | 原生命令註冊 |
| -------- | ------ | -------- | -------------- | ------------ | -------- | ------------ | -------------- | ---------- | -------- | -------- | ------------ |
| Matrix   | x      | x        | x              | x            | x        | x            | x              | x          | x        |          |              |
| Telegram | x      | x        | x              |              |          |              |                |            |          | x        |              |
| Discord  | x      | x        | x              |              |          |              |                |            |          |          | x            |
| Slack    | x      | x        | x              | x            | x        | x            | x              | x          |          |          |              |

這會讓 `qa-channel` 保持為廣泛的產品行為套件，同時讓 Matrix、Telegram 與未來的即時傳輸共用一份明確的傳輸合約檢查清單。

若要執行不將 Docker 帶入 QA 路徑的一次性 Linux VM 測試線，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest，安裝相依項，在 guest 內建置 OpenClaw，執行 `qa suite`，然後將一般 QA 報告與摘要複製回主機上的 `.artifacts/qa-e2e/...`。
它會重複使用與主機上 `qa suite` 相同的情境選取行為。
主機與 Multipass 套件執行預設會使用隔離的 Gateway worker 平行執行多個已選情境。`qa-channel` 預設並行度為 4，並受所選情境數量限制。使用 `--concurrency <count>` 可調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
任何情境失敗時，命令會以非零狀態結束。當你想要成品但不想要失敗結束碼時，請使用 `--allow-failures`。
即時執行會轉送對 guest 實用且受支援的 QA 驗證輸入：基於環境變數的提供者金鑰、QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo 根目錄下，讓 guest 可透過掛載的工作區寫回。

## Telegram、Discord 與 Slack QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量較多，且需要以 Docker 支援的 homeserver 佈建。Telegram、Discord 與 Slack 規模較小，每個只有少量情境，沒有設定檔系統，並針對既有真實頻道執行，因此它們的參考資料放在這裡。

### 共用 CLI 旗標

這些測試線透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                                          | 說明                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | 只執行此情境。可重複指定。                                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 報告/摘要/觀察到的訊息與輸出日誌寫入的位置。相對路徑會依據 `--repo-root` 解析。                                    |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                                   |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定中的暫時帳戶 ID。                                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                    |
| `--model <ref>` / `--alt-model <ref>` | 提供者預設值                                                    | 主要/替代模型 ref。                                                                                                  |
| `--fast`                              | 關閉                                                            | 支援時使用提供者快速模式。                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                                           | 請參閱 [Convex 憑證池](#convex-credential-pool)。                                                                   |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                               | 使用 `--credential-source convex` 時使用的角色。                                                                     |

任何情境失敗時，每個測試線都會以非零狀態結束。`--allow-failures` 會寫入成品，但不設定失敗結束碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私有 Telegram 群組，並使用兩個不同的機器人（driver + SUT）。SUT 機器人必須有 Telegram 使用者名稱；當兩個機器人都在 `@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，機器人對機器人的觀察效果最佳。

使用 `--credential-source env` 時的必要環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字聊天 ID（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

選用：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文（預設會遮蔽）。

情境（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隱含的預設集合一律涵蓋 canary、提及閘控、原生命令回覆、命令定址，以及機器人對機器人群組回覆。`mock-openai` 預設也包含確定性的回覆鏈與最終訊息串流檢查。`telegram-current-session-status-tool` 保持為選用，因為它只有在 canary 之後直接接續執行時才穩定，而不是在任意原生命令回覆之後。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` 可列印目前的預設/選用拆分與回歸 ref。

輸出成品：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - 包含從 canary 開始的每次回覆 RTT（driver 傳送 → 觀察到 SUT 回覆）。
- `telegram-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私有 Discord guild 頻道，並使用兩個機器人：由 harness 控制的 driver 機器人，以及由子 OpenClaw Gateway 透過隨附 Discord Plugin 啟動的 SUT 機器人。驗證頻道提及處理、SUT 機器人是否已向 Discord 註冊原生 `/help` 命令，以及選用的 Mantis 證據情境。

使用 `--credential-source env` 時的必要環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT 機器人使用者 ID（否則該通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留訊息本文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為 `discord-voice-autojoin` 選取語音/舞台通道；若未設定，情境會為 SUT 機器人選取第一個可見的語音/舞台通道。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選用的語音情境。會單獨執行，啟用 `channels.discord.voice.autoJoin`，並驗證 SUT 機器人目前的 Discord 語音狀態是目標語音/舞台通道。Convex Discord 認證可包含選用的 `voiceChannelId`；否則執行器會在公會中探索第一個可見的語音/舞台通道。
- `discord-status-reactions-tool-only` - 選用的 Mantis 情境。會單獨執行，因為它會將 SUT 切換為永遠開啟、僅工具的公會回覆，並設定 `messages.statusReactions.enabled=true`，接著擷取 REST 反應時間軸以及 HTML/PNG 視覺成品。Mantis 前後比較報告也會將情境提供的 MP4 成品保留為 `baseline.mp4` 和 `candidate.mp4`。

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
- `discord-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。
- 狀態反應情境執行時，會產生 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack 通道，並使用兩個不同的機器人：由測試框架控制的 driver 機器人，以及由子 OpenClaw Gateway 透過內建 Slack Plugin 啟動的 SUT 機器人。

使用 `--credential-source env` 時必要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留訊息本文。

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
- `slack-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

#### 設定 Slack 工作區

此通道需要同一個工作區中的兩個不同 Slack 應用程式，外加一個兩個機器人都是成員的通道：

- `channelId` - 兩個機器人都已受邀加入之通道的 `Cxxxxxxxxxx` ID。請使用專用通道；此通道每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人 Token（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人 Token（`xoxb-...`），它必須是與 driver 不同的 Slack 應用程式，讓它的機器人使用者 ID 不同。
- `sutAppToken` - SUT 應用程式具備 `connections:write` 的應用程式層級 Token（`xapp-...`），由 Socket Mode 使用，讓 SUT 應用程式可以接收事件。

建議使用專供 QA 的 Slack 工作區，而不是重複使用正式環境工作區。

下方 SUT manifest 會刻意將內建 Slack Plugin 的正式安裝（`extensions/slack/src/setup-shared.ts:10`）縮小到即時 Slack QA 套件涵蓋的權限和事件。使用者看到的正式通道設定，請參閱 [Slack 通道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 組合刻意分開，因為此通道需要同一個工作區中的兩個不同機器人使用者 ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _建立新應用程式_ → _從 manifest_ → 選擇 QA 工作區，貼上下列 manifest，然後 _安裝到工作區_：

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

複製 _機器人使用者 OAuth Token_（`xoxb-...`）- 這會成為 `driverBotToken`。driver 只需要發佈訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一個工作區中重複 _建立新應用程式 → 從 manifest_。此 QA 應用程式刻意使用內建 Slack Plugin 正式 manifest（`extensions/slack/src/setup-shared.ts:10`）的較窄版本：反應 scope 和事件已省略，因為即時 Slack QA 套件尚未涵蓋反應處理。

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

Slack 建立應用程式後，請在其設定頁面執行兩件事：

- _安裝到工作區_ → 複製 _機器人使用者 OAuth Token_ → 這會成為 `sutBotToken`。
- _基本資訊 → 應用程式層級 Token → 產生 Token 和 scope_ → 加入 scope `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個 Token 呼叫 `auth.test`，驗證兩個機器人有不同的使用者 ID。執行階段會依使用者 ID 區分 driver 和 SUT；兩者重複使用同一個應用程式會導致提及閘控立即失敗。

**3. 建立通道**

在 QA 工作區中建立一個通道（例如 `#openclaw-qa`），並從通道內邀請兩個機器人：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _通道資訊 → 關於 → 通道 ID_ 複製 `Cxxxxxxxxxx` ID - 這會成為 `channelId`。公開通道可用；如果使用私人通道，兩個應用程式已具備 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 註冊認證**

有兩個選項。單機除錯時使用環境變數（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入共享 Convex 池，讓 CI 和其他維護者可租用它們。

對於 Convex 池，將四個欄位寫入 JSON 檔案：

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

**5. 端對端驗證**

在本機執行此通道，確認兩個機器人都能透過 broker 彼此通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

綠燈執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態都是 `pass`。如果通道停住約 90 秒並以 `Convex credential pool exhausted for kind "slack"` 結束，表示池是空的，或每一列都已被租用 - `qa credentials list --kind slack --status all --json` 會告訴你是哪一種。

### Convex 認證池

Telegram、Discord、Slack 和 WhatsApp 通道可以從共享 Convex 池租用認證，而不是讀取上述環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨占租用、在執行期間對其送出 Heartbeat，並在關閉時釋放它。池種類為 `"telegram"`、`"discord"`、`"slack"` 和 `"whatsapp"`。

broker 在 `admin/add` 驗證的酬載形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必須是數字聊天 ID 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - 由 TDLib CLI driver 和 Telegram Desktop 視覺見證者共同使用的一個獨占一次性帳號租用。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話號碼必須是不同的 E.164 字串。

對於視覺真實使用者 Telegram 證明，建議使用保留的 Crabbox 工作階段：

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` 會為 TDLib CLI driver 和 Telegram Desktop 見證者持有一個獨占 Convex `telegram-user` 租用，啟動桌面錄影，並讓 Crabbox 保持存活，以便執行任意由代理驅動的重現步驟。代理可以使用 `send`、`run`、`screenshot` 和 `status`，直到滿意為止，接著 `finish` 會在釋放認證前收集螢幕截圖、影片、動作裁剪後的影片/GIF、TDLib 探測輸出和日誌。`publish --session <file> --pr <number>` 預設只會留言動作 GIF；`--full-artifacts` 是對日誌和 JSON 輸出的明確選用。預設的 `probe` 命令仍是快速 `/status` 煙霧檢查的一行命令簡寫。

使用 `--mock-response-file <path>`，當 PR 需要確定性的視覺差異時：
同一個模擬模型回覆可以在 `main` 與 PR head 上執行，同時變更
Telegram 格式化器或傳遞層。擷取預設值已針對 PR
留言調整：標準 Crabbox 類別、24fps 桌面錄影、24fps 動態 GIF，以及
1920px 預覽寬度。前後對照留言應發布乾淨的套件組合，
其中只包含預期的 GIF。

Slack 執行通道也可以使用集區。Slack payload 形狀檢查目前位於 Slack QA runner，而不是 broker；請使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配像 `Cxxxxxxxxxx` 這樣的 Slack 頻道 ID。請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)，了解應用程式與 scope 佈建。

操作用環境變數與 Convex broker 端點合約位於[測試 → 透過 Convex 共用 Telegram 認證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該章節名稱早於多頻道集區；租約語意在各種類型之間共用）。

## 由儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

這些刻意放在 git 中，讓 QA 計畫對人類與
代理程式都可見。

`qa-lab` 應維持為通用的 Markdown runner。每個情境 Markdown 檔案都是
單次測試執行的真實來源，且應定義：

- 情境 metadata
- 選用的 category、capability、lane 與 risk metadata
- 文件與程式碼參照
- 選用的 Plugin 需求
- 選用的 Gateway 設定修補
- 可執行的 `qa-flow`

支援 `qa-flow` 的可重用 runtime 介面允許維持通用
且跨領域。例如，Markdown 情境可以結合傳輸端
helper 與瀏覽器端 helper，後者透過
Gateway `browser.request` 接縫驅動內嵌的 Control UI，而不必新增特殊案例 runner。

情境檔案應依產品能力分組，而不是依原始碼樹
資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs`
進行實作可追溯性。

基準清單應維持足夠廣泛，以涵蓋：

- 私訊與頻道聊天
- thread 行為
- 訊息動作生命週期
- Cron 回呼
- 記憶回想
- 模型切換
- subagent handoff
- 讀取儲存庫與讀取文件
- 一個小型建置任務，例如 Lobster Invaders

## 提供者模擬執行通道

`qa suite` 有兩個本機提供者模擬執行通道：

- `mock-openai` 是具備情境感知的 OpenClaw mock。它仍然是由儲存庫支援的 QA 與 parity gate 的預設
  確定性模擬執行通道。
- `aimock` 會啟動由 AIMock 支援的提供者伺服器，用於實驗性 protocol、
  fixture、record/replay 與 chaos 覆蓋。它是加成項目，不會
  取代 `mock-openai` 情境 dispatcher。

提供者執行通道實作位於 `extensions/qa-lab/src/providers/` 底下。
每個提供者擁有自己的預設值、本機伺服器啟動、Gateway 模型設定、
auth-profile staging 需求，以及 live/mock capability 旗標。共享 suite 與
gateway 程式碼應透過提供者 registry 路由，而不是依
提供者名稱分支。

## 傳輸配接器

`qa-lab` 擁有供 Markdown QA 情境使用的通用傳輸接縫。`qa-channel` 是該接縫上的第一個配接器，但設計目標更廣：未來真實或合成的頻道應接入同一個 suite runner，而不是新增傳輸專用 QA runner。

在架構層級，切分如下：

- `qa-lab` 擁有通用情境執行、worker concurrency、artifact 寫入與報告。
- 傳輸配接器擁有 Gateway 設定、readiness、inbound 與 outbound 觀測、傳輸動作，以及標準化傳輸狀態。
- `qa/scenarios/` 底下的 Markdown 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用 runtime 介面。

### 新增頻道

將頻道新增到 Markdown QA 系統正好需要兩件事：

1. 該頻道的傳輸配接器。
2. 驗證該頻道合約的情境套件。

當共享的 `qa-lab` host 可以擁有流程時，不要新增新的頂層 QA command root。

`qa-lab` 擁有共享 host 機制：

- `openclaw qa` command root
- suite startup 與 teardown
- worker concurrency
- artifact 寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

Runner plugins 擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共享的 `qa` root 底下
- Gateway 如何為該傳輸設定
- readiness 如何檢查
- inbound events 如何注入
- outbound messages 如何觀測
- transcripts 與標準化傳輸狀態如何公開
- transport-backed actions 如何執行
- transport-specific reset 或 cleanup 如何處理

新頻道的最低採用門檻：

1. 保持 `qa-lab` 作為共享 `qa` root 的擁有者。
2. 在共享的 `qa-lab` host seam 上實作 transport runner。
3. 將傳輸專用機制保留在 runner plugin 或 channel harness 內。
4. 將 runner 掛載為 `openclaw qa <runner>`，而不是註冊競爭的 root command。Runner plugins 應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；lazy CLI 與 runner 執行應保留在個別 entrypoints 後方。
5. 在依主題分類的 `qa/scenarios/` 目錄下撰寫或改寫 Markdown 情境。
6. 對新情境使用通用情境 helper。
7. 除非儲存庫正在進行有意的遷移，否則保持現有相容性別名可運作。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，請放在 `qa-lab`。
- 如果行為取決於單一頻道傳輸，請保留在該 runner plugin 或 plugin harness 中。
- 如果情境需要多個頻道都可使用的新能力，請新增通用 helper，而不是在 `suite.ts` 中新增頻道專用分支。
- 如果行為只對單一傳輸有意義，請讓情境保持傳輸專用，並在情境合約中明確表示。

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

相容性別名仍可供現有情境使用 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新情境撰寫應使用通用名稱。這些別名存在是為了避免一次性全面遷移，而不是未來的模型。

## 報告

`qa-lab` 會從觀測到的 bus timeline 匯出 Markdown protocol report。
報告應回答：

- 哪些有效
- 哪些失敗
- 哪些仍被阻擋
- 哪些後續情境值得新增

若要取得可用情境清單 - 在評估後續工作規模或接線新傳輸時很有用 - 請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得 machine-readable output）。

對於 character 與 style 檢查，請跨多個 live model
refs 執行相同情境，並寫入經評審的 Markdown 報告：

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

該命令會執行本機 QA gateway 子處理程序，而不是 Docker。Character eval
情境應透過 `SOUL.md` 設定 persona，然後執行一般使用者回合，
例如聊天、workspace help 與小型檔案任務。不應告知候選模型
它正在被評估。該命令會保留每個完整
transcript，記錄基本執行統計，然後要求 judge models 在 fast mode 下使用
支援時的 `xhigh` reasoning，依自然度、vibe 與幽默感對執行結果排名。
比較提供者時使用 `--blind-judge-models`：judge prompt 仍會取得
每個 transcript 與執行狀態，但候選 refs 會被替換成中性的
標籤，例如 `candidate-01`；報告會在解析後將排名對回真實 refs。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，而支援的較舊 OpenAI eval refs 使用 `xhigh`。使用
`--model provider/model,thinking=<level>` 內嵌覆寫特定候選。`--thinking <level>` 仍會設定
全域 fallback，且較舊的 `--model-thinking <provider/model=level>` 形式會
保留作為相容性用途。
OpenAI 候選 refs 預設使用 fast mode，因此在
提供者支援時會使用 priority processing。當單一
候選或 judge 需要覆寫時，內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在想要
強制每個候選模型都啟用 fast mode 時，才傳入 `--fast`。候選與 judge 持續時間會
記錄在報告中供 benchmark 分析，但 judge prompts 會明確說明
不要依速度排名。
候選與 judge model 執行都預設 concurrency 16。當 provider limits 或本機 gateway
壓力使執行過於嘈雜時，降低
`--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，character eval 預設為
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 與
`google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，judge 預設為
`openai/gpt-5.5,thinking=xhigh,fast` 與
`anthropic/claude-opus-4-6,thinking=high`。

## 相關文件

- [Matrix QA](/zh-TW/concepts/qa-matrix)
- [QA Channel](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [Dashboard](/zh-TW/web/dashboard)
