---
read_when:
    - 建置或執行 OpenClaw 錯誤的即時視覺品質保證測試
    - 為提取要求新增變更前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 為候選參照執行聚焦的 Control UI 瀏覽器驗證
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行作業
summary: Mantis 擷取即時傳輸比較的視覺端對端證據，以及僅針對候選項目的瀏覽器驗證，然後將產出附加至 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-16T11:36:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 會發布 OpenClaw 行為的視覺化 CI 證據與 PR 留言。
即時傳輸情境會比較已知有問題的基準與候選 ref；
聚焦的瀏覽器執行路徑則可改為使用確定性的
模擬傳輸，驗證單一候選版本。Discord 最先推出，支援真實機器人驗證、伺服器頻道、
反應、討論串及瀏覽器見證。Slack、Telegram 與聚焦的 Control
UI 聊天執行路徑也已存在；WhatsApp 與 Matrix 尚未實作。

## 所有權

- OpenClaw（`extensions/qa-lab/src/mantis/*`）：情境執行階段、`pnpm openclaw qa mantis <command>` 命令列介面、證據結構描述。
- QA Lab（`extensions/qa-lab/src/live-transports/*`）：即時傳輸測試框架、驅動程式／受測系統機器人、報告／證據寫入器。
- Crabbox（`openclaw/crabbox`）：已預熱的 Linux 機器、租約、VNC、`crabbox media preview`。
- GitHub Actions（`.github/workflows/mantis-*.yml`）：遠端進入點、成品保留。
- ClawSweeper：剖析維護者 PR 命令、分派工作流程、發布最終 PR 留言。

## 命令列介面命令

所有命令皆為 `pnpm openclaw qa mantis <command>`，定義於
`extensions/qa-lab/src/mantis/cli.ts`。建置／執行時需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（隨附的工作流程會在建置前設定 `OPENCLAW_BUILD_PRIVATE_QA=1` 與
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 驗證 Mantis Discord 機器人可以看見伺服器／頻道、發文及加入反應。                                                                                          |
| `run`                           | 針對基準與候選 ref 執行前後情境（僅限 Discord）。                                                                                                         |
| `desktop-browser-smoke`         | 租用／重用 Crabbox 桌面、開啟可見的瀏覽器，並擷取螢幕截圖與影片。                                                                                         |
| `slack-desktop-smoke`           | 租用／重用 Crabbox 桌面、在其中執行 Slack QA、開啟 Slack Web，並擷取證據。                                                                                |
| `telegram-desktop-builder`      | 租用／重用 Crabbox 桌面、安裝 Telegram Desktop，並可選擇設定 OpenClaw 閘道。                                                                              |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面擷取，可選擇加入影像理解判定；`visual-driver` 是在 `crabbox record --while` 下啟動的驅動程式端。 |

每個命令皆接受 `--repo-root <path>` 與 `--output-dir <path>`；Crabbox
命令也接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 與 `--keep-lease`。除非另有說明，本機命令列介面的提供者／類別預設值
為 `hetzner`/`beast`；CI 工作流程
通常會覆寫兩者。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

呼叫 Discord REST API（`https://discord.com/api/v10`）以擷取機器人
使用者、伺服器、伺服器的頻道與目標頻道，判定該
頻道屬於此伺服器，接著（除非 `--skip-post`）發布訊息並
加入 `👀` 反應。寫入 `mantis-discord-smoke-summary.json` 與
`mantis-discord-smoke-report.md`。

權杖解析順序：`--token-file` 值，接著是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（使用 `--token-env` 覆寫），再接著是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` 指定名稱的檔案
（使用 `--token-file-env` 覆寫）。伺服器／頻道 ID 來自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（使用
`--guild-id` / `--channel-id` 覆寫），且必須是 17-20 位數的 Discord snowflake。設定
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，即可在發布的摘要與報告中，將機器人／伺服器／頻道／訊息 ID
與名稱替換為 `<redacted>`。

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` 目前僅接受 `discord`。`--scenario` 是兩個
內建 ID 之一，各自具有預設基準 ref 與預期的前後
標籤（`extensions/qa-lab/src/mantis/run.runtime.ts`）：

| 情境                                       | 預設基準                                   | 基準預期                                 | 候選版本預期                   |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 討論串回覆省略 `filePath` 附件 | 討論串回覆包含該附件     |

`--candidate` 預設為 `HEAD`。其他旗標：`--credential-source`
（預設 `convex`）、`--credential-role`（預設 `ci`）、`--provider-mode`
（預設 `live-frontier`）、`--fast`（預設開啟）、`--skip-install`、`--skip-build`。

執行器會在 `<output-dir>/worktrees/` 下，為基準與
候選版本建立分離的 `git worktree` 簽出，並在
各自的簽出中執行 `pnpm install`/`pnpm build`（除非略過），接著針對每個工作樹執行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每條執行路徑都會寫入 `discord-qa-reaction-timelines.json`
及一組 `<scenario-id>-timeline.html`/`.png`；執行器會將這些
證據複製回 `baseline/`/`candidate/` 下，在輸出目錄中寫入 `comparison.json`、
`mantis-report.md` 與 `mantis-evidence.json`，且若比較未通過（基準
`fail` 且候選版本 `pass`），便會以非零狀態結束。

第二個 Discord 情境（`discord-thread-reply-filepath-attachment`）會使用
驅動機器人發布父訊息、建立真實討論串、以存放庫本機的 `filePath` 呼叫受測系統的
`message.thread-reply` 動作，接著輪詢
討論串以取得回覆與附件檔名。它預期會有一個
名為 `mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或重用 Crabbox 桌面，在 VNC 工作階段內啟動瀏覽器，
並指向 `--browser-url`（預設 `https://openclaw.ai`）或已轉譯的
`--html-file`，等待後使用 `scrot` 擷取螢幕截圖，可選擇使用
`ffmpeg` 錄製 MP4，並透過 rsync 將 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
同步回 `--output-dir`。

旗標：

- `--lease-id <cbx_...>` 會重用已預熱的桌面，而非建立新桌面。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome user-data-dir，讓持久化桌面在多次執行之間保持登入狀態（用於長期存在的 Discord Web 檢視器設定檔）。
- `--browser-profile-archive-env <name>` 會在啟動前，從該環境變數還原 base64 `.tgz` Chrome 設定檔封存檔（預設 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用於 Discord Web 等已登入的見證。
- `--video-duration <seconds>` 控制 MP4 擷取時間長度（預設 10s）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）會讓本次執行所建立的租約保持開啟，以供 VNC 檢查；建立了租約但執行失敗時，預設也會保留租約。

對於 Discord Web 證據，Mantis 使用專用檢視器帳號，而非機器人
權杖。Discord REST 依據（透過 `qa discord`）仍具權威性；設定
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，情境也會寫入
Discord Web URL 成品，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 會讓
討論串保持開啟足夠長的時間，供瀏覽器開啟。

GitHub 工作流程偏好透過
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持久化檢視器設定檔（完整設定檔封存檔可能超出
GitHub 的密鑰大小限制）；對於小型／啟動設定檔，則可改從 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原
base64 `.tgz`。若兩種來源都未設定，工作流程仍會發布確定性的
基準／候選版本螢幕截圖，並記錄已略過登入見證。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或重用 Crabbox 桌面、將簽出同步至 VM、在其中執行
`pnpm openclaw qa slack`、在 VNC 瀏覽器中開啟 Slack Web、
擷取桌面，並將 Slack QA 成品（`slack-qa/`）及
VNC 螢幕截圖／影片複製回本機。這是唯一讓
受測系統閘道與瀏覽器都在同一個 VM 內執行的 Mantis 形式。

使用 `--gateway-setup` 時，此命令會在 VM 的 `$HOME/.openclaw-mantis/slack-openclaw`
建立持久化的拋棄式 OpenClaw
主目錄，針對目標頻道修補 Slack
Socket Mode 設定、啟動
`openclaw gateway run --dev --allow-unconfigured --port 38973`，並讓
Chrome 繼續在 VNC 工作階段中執行；省略 `--gateway-setup` 則會改為執行一般的
機器人對機器人 Slack QA 執行路徑。

`--credential-source env` 所需的環境變數（本機預設為 `env`；角色
預設為 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY`，用於遠端模型執行路徑（若本機僅設定 `OPENAI_API_KEY`，
  Mantis 會在叫用 Crabbox 前，將其複製至 `OPENCLAW_LIVE_OPENAI_KEY`）

使用 `--credential-source convex` 時，Mantis 會在建立 VM 前，從
共用集區租用 Slack 受測系統認證資訊，並將頻道 ID、應用程式權杖及
機器人權杖以 `OPENCLAW_MANTIS_SLACK_*` 環境變數形式轉送至 VM，因此 GitHub
工作流程只需要 Convex 代理密鑰，不需要原始 Slack 權杖。

其他旗標：`--slack-url <url>` 會開啟特定 URL（否則 Mantis 會從
`auth.test` 衍生 `https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 設定閘道允許清單頻道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久化 Chrome
設定檔（預設 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 執行原生 Slack 核准情境
（`slack-approval-exec-native`、`slack-approval-plugin-native`），並轉譯
待處理／已解決的檢查點螢幕截圖，而非進行閘道設定（與
`--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會傳遞至
Slack 即時執行路徑。

核准檢查點螢幕截圖是根據情境所觀察到的 Slack API 訊息
轉譯而成，而非即時 Slack UI；只有當租約的瀏覽器設定檔已經登入時，`slack-desktop-smoke.png`
才是 Slack Web 本身的證據。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或重用 Crabbox 桌面、安裝原生 Linux Telegram Desktop、
可選擇還原使用者工作階段封存檔、使用租用的 Telegram 受測系統機器人權杖設定 OpenClaw、
啟動
`openclaw gateway run --dev --allow-unconfigured --port 38974`、將
驅動機器人就緒訊息發布至租用的私人群組，接著擷取
螢幕截圖與 MP4。機器人權杖只會設定 OpenClaw；絕不會登入
Telegram Desktop。桌面檢視器是獨立的 Telegram 使用者工作階段，
可從 `--telegram-profile-archive-env <name>` 還原，或
透過 VNC 手動登入並使用 `--keep-lease` 保持運作。

旗標：`--lease-id <cbx_...>` 會針對已登入
Telegram Desktop 的 VM 重新執行；`--telegram-profile-archive-env <name>` 會在啟動前還原 base64
`.tgz` 設定檔封存檔；`--telegram-profile-dir <remote-path>`
設定遠端設定檔目錄（預設 `$HOME/.local/share/TelegramDesktop`）；
`--no-gateway-setup` 僅安裝並開啟 Telegram Desktop；
`--credential-source`/`--credential-role` 預設為 `convex`/`maintainer`。

## 證據資訊清單

每個發布到 PR 的情境都會在其報告旁寫入 `mantis-evidence.json`：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord 狀態回應 QA",
  "summary": "供 PR 留言使用、方便人員閱讀的頂層摘要。",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "僅排入佇列" },
    "candidate": { "sha": "...", "status": "pass", "expected": "已排入佇列 -> 思考中 -> 完成" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "基準僅排入佇列",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "基準 Discord 時間軸",
      "width": 420
    }
  ]
}
```

成品 `path` 是相對於資訊清單目錄的路徑；`targetPath` 是相對於已設定 R2/S3 成品前綴的路徑。`scripts/mantis/publish-pr-evidence.mjs` 會拒絕路徑遍歷，並在檔案遺失時略過含有 `"required": false` 的項目。

成品種類：`timeline`（確定性的前後比較螢幕截圖）、`desktopScreenshot`（VNC／瀏覽器螢幕截圖）、`motionPreview`（來自錄影的內嵌動畫 GIF）、`motionClip`（移除無動作片段的 MP4）、`fullVideo`（完整錄影）、`metadata`（JSON／記錄附屬檔案）、`report`（Markdown 報告）。

一次執行在磁碟上的成品配置：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

螢幕截圖是證據，不是機密，但仍須遵守遮蔽規範：其中可能會出現私人頻道名稱、使用者名稱或訊息內容。公開上傳成品時請設定 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；Discord／Slack／Telegram GitHub 工作流程預設會啟用此設定。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` 是可重複使用的發布程式。工作流程會使用資訊清單、目標 PR、成品目標根目錄、留言標記、成品 URL、執行 URL 與要求來源來呼叫它。它會將宣告的成品上傳至 Mantis R2 儲存貯體、建立摘要優先的 PR 留言並內嵌圖片／預覽及連結影片，接著更新現有的標記留言或建立新留言。必要的環境變數：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流程會設定 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流程會設定 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流程會設定 `https://artifacts.openclaw.ai`）

留言會透過 Mantis GitHub App（`MANTIS_GITHUB_APP_ID`／`MANTIS_GITHUB_APP_PRIVATE_KEY`）發布，而非 `github-actions[bot]`，並以隱藏的標記留言作為更新或插入的鍵。

| 工作流程                          | 觸發條件                                                                                    | 執行內容                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動分派                                                                            | 對選定的 ref 執行 `discord-smoke`。                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR 留言或手動分派                                                              | 建立獨立的基準／候選工作樹、分別對兩者執行 `discord-status-reactions-tool-only`、在 Crabbox 桌面瀏覽器中呈現各執行線的時間軸、使用 `crabbox media preview` 產生移除無動作片段的 GIF／MP4 預覽、上傳成品，並發布內嵌的 PR 證據。                                 |
| `Mantis Scenario`                 | 手動分派                                                                            | 通用分派程式：接收 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，並轉送至相符的情境工作流程。 |
| `Mantis Slack Desktop Smoke`      | 手動分派                                                                            | 租用 Crabbox Linux 桌面（預設為 `aws`，可選擇 `hetzner`）、對候選版本執行 `slack-desktop-smoke --gateway-setup`、錄製桌面、產生動態預覽、上傳成品，並在提供 PR 編號時發布 PR 證據。                                                      |
| `Mantis Telegram Live`            | PR 留言或手動分派                                                              | 執行機器人 API Telegram 即時 QA 執行線（`openclaw qa telegram`）、依據 QA 摘要寫入 `mantis-evidence.json`、透過 Crabbox 桌面瀏覽器呈現已遮蔽的證據 HTML、產生動態 GIF，並發布 PR 證據。此執行線不需要登入 Telegram Web。                               |
| `Mantis Telegram Desktop Proof`   | 維護者 PR 標籤（`mantis: telegram-visible-proof`）加上 PR 留言，或手動分派 | 由代理執行原生 Telegram Desktop 前後比較證明。將 PR、基準／候選 ref 及維護者指示交給 Codex；Codex 會對兩個 ref 執行真實使用者 Crabbox Telegram Desktop 證明執行線，並發布 2 欄式 PR 證據表格。                                                              |
| `Mantis Web UI Chat Proof`        | PR 留言或手動分派                                                              | 對候選版本執行聚焦的 OpenClaw Control UI 聊天 Playwright 證明、驗證瀏覽器透過模擬閘道傳送、擷取螢幕截圖／影片成品，並發布 PR 證據。此執行線僅證明網頁聊天，不涵蓋 WinUI／原生應用程式或任意視覺證明。                           |

`Mantis Discord Status Reactions` 與 `Mantis Telegram Live` 都接受 `baseline_ref`／`candidate_ref`（或 PR 留言中的 `baseline=`／`candidate=`），並在使用含機密認證資訊執行前，驗證解析出的 SHA 是 `origin/main` 的祖先、發布標籤（`v*`），或開放 PR 的 head。

來自具備 write／maintain／admin 存取權限之 PR 的留言觸發指令：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 留言觸發指令預設使用 PR head SHA 作為候選版本，並以 `telegram-status-command` 作為情境；它們接受 `provider=aws|hetzner` 與 `lease=<cbx_...>`，以指定特定 Crabbox 提供者或預先暖機的桌面。`Mantis Telegram Desktop Proof` 僅會在 PR 已具有 `mantis: telegram-visible-proof` 標籤時回應 PR 留言。

Web UI 聊天留言觸發指令預設使用 PR head SHA 作為候選版本。它們會執行 Control UI 模擬閘道聊天證明並發布瀏覽器成品；其他網頁與原生應用程式介面請使用一般 Playwright／瀏覽器證明、維護者螢幕截圖、Crabbox 或本機成品。

ClawSweeper 也可以直接分派情境：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 機器與機密

本機命令列介面的 Crabbox 預設值為 `--provider hetzner --class beast`；可使用 `--provider`、`--class`／`--machine-class`，或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER`／`OPENCLAW_MANTIS_CRABBOX_CLASS` 覆寫。GitHub 工作流程通常會同時覆寫兩者（例如 `--class standard`，以及 Slack 工作流程的 `aws`／`hetzner` 提供者選擇輸入）。如果某個提供者速度過慢或無法使用，請將其加入相同的 Crabbox 介面後方，而非將後備方案寫死。

虛擬機器基準：具備支援桌面的 Chrome／Chromium、CDP 存取權、VNC／noVNC、Node 22.22.3+、24.15+ 或 25.9+ 與 pnpm 的 Linux、OpenClaw 簽出版本，以及對目標傳輸服務、GitHub、模型提供者和認證資訊代理程式的對外存取權。

Mantis 命令與工作流程所使用的認證資訊及環境名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 本機 `qa mantis run --credential-source env` 還需要
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  與 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。GitHub 工作流程通常使用
  `--credential-source convex` 及下列代理程式認證資訊，而非原始
  Discord 機器人權杖。
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用於公開上傳成品
- `OPENCLAW_QA_CONVEX_SITE_URL`、`OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY`（或 Telegram Desktop 證明專用的
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`）
- `CRABBOX_COORDINATOR`／`CRABBOX_COORDINATOR_TOKEN`（工作流程也接受
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`／`_TOKEN` 作為後備，並在叫用 Crabbox 前
  將其對應至不含前綴的名稱）
- `CRABBOX_ACCESS_CLIENT_ID`、`CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`、`MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 執行程式絕不可輸出 Discord／Slack／Telegram 機器人權杖、提供者 API 金鑰、瀏覽器 Cookie、驗證設定檔內容、VNC 密碼或原始認證資訊酬載。如果權杖洩漏至議題、PR、聊天或記錄中，請在儲存替代機密後輪替該權杖。

## 執行結果

前後比較傳輸情境會區分下列結果，避免不穩定的環境被誤判為產品迴歸：

- **已重現錯誤**：基準版本以情境預期的方式失敗。
- **測試框架失敗**：環境設定、認證資訊、傳輸 API、瀏覽器或提供者在判定條件具有效力之前失敗。

僅針對候選版本的瀏覽器證明會回報候選版本是否通過模擬閘道與可見 UI 判定；它不會宣稱已重現基準版本。

## 新增情境

即時傳輸情境會依各傳輸服務使用 TypeScript 定義（Discord 前後比較形式請參閱 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），而非使用獨立的宣告式檔案格式。每個情境都需要：識別碼與標題、傳輸服務、必要認證資訊、基準 ref 政策、候選 ref 政策、OpenClaw 設定修補、設定／刺激步驟、預期的基準與候選判定條件、視覺擷取目標、逾時預算及清理步驟。

聚焦且僅針對候選版本的瀏覽器證明可以使用專用、確定性的 E2E 測試與工作流程。請明確限定其範圍、在執行前驗證候選 ref、隔離使用機密的發布作業，並輸出相同的證據資訊清單合約。

相較於視覺檢查，應優先使用小型且具型別的判定條件：Discord 回應狀態或訊息參照、Slack 討論串 `ts`／回應 API 狀態、電子郵件訊息 ID 與標頭。當 UI 是唯一可靠的可觀測項目時，請使用瀏覽器螢幕截圖；若平台 API 判定條件存在，視覺檢查應僅作為其附加項目。

在 Discord、Slack 與 Telegram 之後，相同的執行程式形式可擴充至 WhatsApp（QR 登入、重新識別、傳送、媒體、回應）和 Matrix（加密聊天室、討論串／回覆關係、重新啟動後繼續）；兩者目前都尚未實作。

## 待解問題

- 重複使用現有的 Mantis 機器人時，哪個 Discord 機器人應作為驅動端，哪個應作為受測系統？
- GitHub 應為 PR 保留 Mantis 成品多久？
- ClawSweeper 應在何時自動建議 Mantis 情境，而不是等待維護者下達命令？
- 針對公開 PR，上傳前是否應遮蔽或裁切螢幕截圖？
