---
read_when:
    - 建置或執行 OpenClaw 錯誤的即時視覺品質保證測試
    - 為提取要求新增變更前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 針對候選參照執行聚焦的控制介面瀏覽器驗證
    - 對需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行進行偵錯
summary: Mantis 擷取視覺化的端對端證據，用於即時傳輸比較與僅針對候選版本的瀏覽器驗證，然後將產出附加至 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-12T14:25:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 會發布 OpenClaw 行為的視覺化 CI 證據與 PR 留言。
即時傳輸情境會比較已知有問題的基準版本與候選 ref；
聚焦的瀏覽器執行線則可改為針對確定性的模擬傳輸，驗證單一候選版本。
Discord 最先推出，支援真實 Bot 驗證、伺服器頻道、
表情回應、討論串與瀏覽器見證。Slack、Telegram 與聚焦的 Control
UI 聊天執行線也已存在；WhatsApp 與 Matrix 尚未實作。

## 所有權

- OpenClaw (`extensions/qa-lab/src/mantis/*`)：情境執行階段、`pnpm openclaw qa mantis <command>` 命令列介面、證據結構描述。
- QA Lab (`extensions/qa-lab/src/live-transports/*`)：即時傳輸測試框架、驅動程式／受測系統 Bot、報告／證據寫入器。
- Crabbox (`openclaw/crabbox`)：已預熱的 Linux 機器、租約、VNC、`crabbox media preview`。
- GitHub Actions (`.github/workflows/mantis-*.yml`)：遠端進入點、成品保留。
- ClawSweeper：解析維護者 PR 命令、分派工作流程，並發布最終 PR 留言。

## 命令列介面命令

所有命令皆為 `pnpm openclaw qa mantis <command>`，定義於
`extensions/qa-lab/src/mantis/cli.ts`。建置／執行時需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（隨附的工作流程會在建置前設定 `OPENCLAW_BUILD_PRIVATE_QA=1` 與
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 驗證 Mantis Discord Bot 能看見伺服器／頻道、發文並新增表情回應。                                                                                          |
| `run`                           | 針對基準與候選 ref 執行前後對照情境（僅限 Discord）。                                                                                                     |
| `desktop-browser-smoke`         | 租用／重複使用 Crabbox 桌面、開啟可見的瀏覽器，並擷取螢幕截圖與影片。                                                                                     |
| `slack-desktop-smoke`           | 租用／重複使用 Crabbox 桌面、在其中執行 Slack QA、開啟 Slack Web，並擷取證據。                                                                            |
| `telegram-desktop-builder`      | 租用／重複使用 Crabbox 桌面、安裝 Telegram Desktop，並可選擇設定 OpenClaw 閘道。                                                                           |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面擷取，可選擇加入影像理解判定；`visual-driver` 是在 `crabbox record --while` 下啟動的驅動程式部分。                                        |

每個命令皆接受 `--repo-root <path>` 與 `--output-dir <path>`；Crabbox
命令也接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 與 `--keep-lease`。除非另有註明，本機命令列介面對
供應商／類別的預設值為 `hetzner`/`beast`；CI 工作流程通常會覆寫兩者。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

呼叫 Discord REST API (`https://discord.com/api/v10`) 取得 Bot
使用者、伺服器、伺服器頻道與目標頻道，判定該
頻道屬於此伺服器，然後（除非使用 `--skip-post`）發布訊息並
新增 `👀` 表情回應。寫入 `mantis-discord-smoke-summary.json` 與
`mantis-discord-smoke-report.md`。

權杖解析順序：`--token-file` 的值，接著是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（使用 `--token-env` 覆寫），再接著是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
指定的檔案（使用 `--token-file-env` 覆寫）。伺服器／頻道 ID 取自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（使用
`--guild-id` / `--channel-id` 覆寫），且必須是 17-20 位數的 Discord snowflake。設定
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，即可在發布的摘要與報告中將 Bot／伺服器／頻道／訊息 ID
及名稱替換為 `<redacted>`。

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
內建 ID 之一，每個都有自己的預設基準 ref 與預期的前後標籤
(`extensions/qa-lab/src/mantis/run.runtime.ts`)：

| 情境                                       | 預設基準                                   | 基準預期                                 | 候選版本預期                 |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 討論串回覆省略 `filePath` 附件           | 討論串回覆包含該附件         |

`--candidate` 預設為 `HEAD`。其他旗標：`--credential-source`
（預設為 `convex`）、`--credential-role`（預設為 `ci`）、`--provider-mode`
（預設為 `live-frontier`）、`--fast`（預設開啟）、`--skip-install`、`--skip-build`。

執行器會在 `<output-dir>/worktrees/` 下為基準與
候選版本建立分離的 `git worktree` 檢出，在
每個檢出中執行 `pnpm install`/`pnpm build`（除非略過），然後分別針對各個 worktree 執行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每條執行線都會寫入 `discord-qa-reaction-timelines.json`
以及一組 `<scenario-id>-timeline.html`/`.png`；執行器會將此
證據複製回 `baseline/`/`candidate/` 下，在輸出目錄寫入
`comparison.json`、`mantis-report.md` 與 `mantis-evidence.json`，並在
比較未通過（基準為 `fail` 且候選版本為
`pass`）時以非零狀態結束。

第二個 Discord 情境 (`discord-thread-reply-filepath-attachment`) 會使用
驅動 Bot 發布父訊息、建立真實討論串，並使用儲存庫內的 `filePath`
呼叫受測系統的 `message.thread-reply` 動作，接著輪詢
討論串以取得回覆與附件檔名。它預期附件
名稱為 `mantis-thread-report.md`。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或重複使用 Crabbox 桌面，在 VNC 工作階段內啟動瀏覽器，
並指向 `--browser-url`（預設為 `https://openclaw.ai`）或已轉譯的
`--html-file`，等待後使用 `scrot` 擷取螢幕截圖，可選擇以
`ffmpeg` 錄製 MP4，並透過 rsync 將 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
同步回 `--output-dir`。

旗標：

- `--lease-id <cbx_...>` 會重複使用已預熱的桌面，而非建立新桌面。
- `--browser-profile-dir <remote-path>` 會重複使用遠端 Chrome user-data-dir，讓持續運作的桌面在不同執行之間保持登入狀態（用於長期運作的 Discord Web 檢視器設定檔）。
- `--browser-profile-archive-env <name>` 會在啟動前，從該環境變數還原 base64 `.tgz` Chrome 設定檔封存（預設為 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用於 Discord Web 等已登入的見證。
- `--video-duration <seconds>` 控制 MP4 擷取長度（預設 10s）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）會保留本次執行建立的租約，以供 VNC 檢查；由失敗執行所建立的租約，預設也會保留。

針對 Discord Web 證據，Mantis 使用專用檢視器帳號，而非 Bot
權杖。Discord REST 預言機（透過 `qa discord`）仍是權威依據；設定
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，該情境也會寫入
Discord Web URL 成品，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 會讓
討論串保持開啟足夠久，以便瀏覽器開啟。

GitHub 工作流程優先透過
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持續性檢視器設定檔（完整設定檔封存可能超出
GitHub 的密鑰大小限制）；若是小型／啟動用設定檔，則可改從
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原 base64 `.tgz`。若
兩種來源皆未設定，工作流程仍會發布確定性的
基準／候選版本螢幕截圖，並記錄已略過登入後見證。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或重複使用 Crabbox 桌面、將檢出同步到虛擬機器、在其中執行
`pnpm openclaw qa slack`、在 VNC 瀏覽器中開啟 Slack Web、
擷取桌面，並將 Slack QA 成品 (`slack-qa/`) 與
VNC 螢幕截圖／影片一併複製回本機。這是唯一一種受測系統
閘道與瀏覽器都在同一部虛擬機器內執行的 Mantis 形式。

使用 `--gateway-setup` 時，該命令會在虛擬機器內的
`$HOME/.openclaw-mantis/slack-openclaw` 建立持續性的拋棄式 OpenClaw
主目錄、修補目標頻道的 Slack
Socket Mode 設定、啟動
`openclaw gateway run --dev --allow-unconfigured --port 38973`，並讓
Chrome 繼續在 VNC 工作階段中執行；省略 `--gateway-setup` 則改為執行一般的
Bot 對 Bot Slack QA 執行線。

`--credential-source env` 所需的環境變數（本機預設為 `env`；角色
預設為 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型執行線所需的 `OPENCLAW_LIVE_OPENAI_KEY`（若本機僅設定 `OPENAI_API_KEY`，
  Mantis 會先將其複製到 `OPENCLAW_LIVE_OPENAI_KEY`，再
  叫用 Crabbox）

使用 `--credential-source convex` 時，Mantis 會在建立虛擬機器前，從
共用集區租用 Slack 受測系統認證資訊，並將頻道 ID、應用程式權杖與
Bot 權杖以 `OPENCLAW_MANTIS_SLACK_*` 環境變數形式轉送至虛擬機器，因此 GitHub
工作流程只需要 Convex 代理密鑰，不需要原始 Slack 權杖。

其他旗標：`--slack-url <url>` 會開啟特定 URL（否則 Mantis 會根據
`auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 設定閘道允許清單頻道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制虛擬機器內的持續性 Chrome
設定檔（預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 會執行原生 Slack 核准情境
(`slack-approval-exec-native`, `slack-approval-plugin-native`)，並轉譯
待處理／已解決的檢查點螢幕截圖，而非設定閘道（與
`--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會直接傳遞給
Slack 即時執行線。

核准檢查點螢幕截圖是根據情境觀察到的 Slack API 訊息
轉譯而成，而非即時 Slack UI；只有在租約的瀏覽器設定檔已登入時，
`slack-desktop-smoke.png` 才能作為 Slack Web 本身的證明。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或重複使用 Crabbox 桌面環境、安裝原生 Linux Telegram Desktop、選擇性還原使用者工作階段封存檔、使用租用的 Telegram SUT 機器人權杖設定 OpenClaw、啟動
`openclaw gateway run --dev --allow-unconfigured --port 38974`、將驅動程式機器人就緒訊息傳送至租用的私人群組，然後擷取螢幕截圖與 MP4。機器人權杖只會設定 OpenClaw，絕不會登入 Telegram Desktop。桌面檢視器是獨立的 Telegram 使用者工作階段，可從 `--telegram-profile-archive-env <name>` 還原，或透過 VNC 手動登入並使用 `--keep-lease` 保持運作。

旗標：`--lease-id <cbx_...>` 會在已登入 Telegram Desktop 的 VM 上重新執行；`--telegram-profile-archive-env <name>` 會在啟動前還原 base64 `.tgz` 設定檔封存檔；`--telegram-profile-dir <remote-path>` 設定遠端設定檔目錄（預設為 `$HOME/.local/share/TelegramDesktop`）；`--no-gateway-setup` 僅安裝並開啟 Telegram Desktop；`--credential-source`/`--credential-role` 預設為 `convex`/`maintainer`。

## 證據清單

每個發佈至 PR 的情境都會在其報告旁寫入 `mantis-evidence.json`：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord 狀態反應 QA",
  "summary": "供 PR 留言使用、便於閱讀的頂層摘要。",
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

成品的 `path` 是相對於清單所在目錄的路徑；`targetPath` 是相對於已設定 R2/S3 成品前綴的路徑。`scripts/mantis/publish-pr-evidence.mjs` 會拒絕路徑遍歷，且當檔案遺失時，略過含有 `"required": false` 的項目。

成品種類：`timeline`（確定性的前後對照螢幕截圖）、`desktopScreenshot`（VNC／瀏覽器螢幕截圖）、`motionPreview`（由錄影產生的內嵌動畫 GIF）、`motionClip`（經動態裁剪的 MP4）、`fullVideo`（完整錄影）、`metadata`（JSON／記錄附屬檔）、`report`（Markdown 報告）。

單次執行的磁碟成品配置：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

螢幕截圖是證據，不是機密，但仍需遵守遮蔽規範：其中可能出現私人頻道名稱、使用者名稱或訊息內容。公開上傳成品時請設定 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；Discord／Slack／Telegram GitHub 工作流程預設會啟用此設定。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` 是可重複使用的發佈程式。工作流程會以清單、目標 PR、成品目標根目錄、留言標記、成品 URL、執行 URL 和請求來源呼叫它。它會將宣告的成品上傳至 Mantis R2 儲存貯體、建立摘要優先的 PR 留言，其中包含內嵌圖片／預覽與影片連結，然後更新現有的標記留言或建立新留言。必要環境變數：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流程設為 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流程設為 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流程設為 `https://artifacts.openclaw.ai`）

留言會透過 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`）發佈，而非 `github-actions[bot]`，並使用隱藏的標記留言作為 upsert 鍵。

| 工作流程                          | 觸發方式                                                                                    | 執行內容                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動分派                                                                            | 對所選 ref 執行 `discord-smoke`。                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR 留言或手動分派                                                              | 建立獨立的基準／候選工作樹、分別對兩者執行 `discord-status-reactions-tool-only`、在 Crabbox 桌面瀏覽器中呈現各路徑的時間軸、使用 `crabbox media preview` 產生經動態裁剪的 GIF／MP4 預覽、上傳成品，並發佈內嵌 PR 證據。                                 |
| `Mantis Scenario`                 | 手動分派                                                                            | 通用分派器：接受 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，並轉送至相符的情境工作流程。 |
| `Mantis Slack Desktop Smoke`      | 手動分派                                                                            | 租用 Crabbox Linux 桌面環境（預設為 `aws`，可選擇 `hetzner`）、針對候選版本執行 `slack-desktop-smoke --gateway-setup`、錄製桌面畫面、產生動態預覽、上傳成品，並在提供 PR 編號時發佈 PR 證據。                                                      |
| `Mantis Telegram Live`            | PR 留言或手動分派                                                              | 執行機器人 API Telegram 即時 QA 路徑（`openclaw qa telegram`）、根據 QA 摘要寫入 `mantis-evidence.json`、透過 Crabbox 桌面瀏覽器呈現經遮蔽的證據 HTML、產生動態 GIF，並發佈 PR 證據。此路徑不需要登入 Telegram Web。                               |
| `Mantis Telegram Desktop Proof`   | 維護者 PR 標籤（`mantis: telegram-visible-proof`）加上 PR 留言，或手動分派 | 代理式原生 Telegram Desktop 前後對照證據。將 PR、基準／候選 ref 和維護者指示交給 Codex，由其針對兩個 ref 執行真實使用者 Crabbox Telegram Desktop 證據路徑，並發佈 2 欄式 PR 證據表格。                                                              |
| `Mantis Web UI Chat Proof`        | PR 留言或手動分派                                                              | 針對候選版本執行聚焦的 OpenClaw Control UI 聊天 Playwright 證據、驗證瀏覽器透過模擬閘道傳送訊息、擷取螢幕截圖／影片成品，並發佈 PR 證據。此路徑僅用於網頁聊天證據，不適用於 WinUI／原生應用程式或任意視覺證據。                           |

`Mantis Discord Status Reactions` 和 `Mantis Telegram Live` 都接受 `baseline_ref`/`candidate_ref`（或 PR 留言中的 `baseline=`/`candidate=`），並在使用含機密認證資訊執行前，驗證解析出的 SHA 是 `origin/main` 的祖先、發行標籤（`v*`），或開啟中 PR 的 head。

具備 write/maintain/admin 存取權的 PR 留言觸發方式：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 留言觸發方式預設會將 PR head SHA 作為候選版本，並將 `telegram-status-command` 作為情境；它們接受 `provider=aws|hetzner` 和 `lease=<cbx_...>`，以指定特定 Crabbox 提供者或預先暖機的桌面環境。只有當 PR 已帶有 `mantis: telegram-visible-proof` 標籤時，`Mantis Telegram Desktop Proof` 才會回應 PR 留言。

Web UI 聊天留言觸發方式預設會將 PR head SHA 作為候選版本。它們會執行 Control UI 模擬閘道聊天證據並發佈瀏覽器成品；其他網頁和原生應用程式介面請使用一般 Playwright／瀏覽器證據、維護者螢幕截圖、Crabbox 或本機成品。

ClawSweeper 也可以直接分派情境：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 機器與機密

本機命令列介面 Crabbox 的預設值為 `--provider hetzner --class beast`；可使用 `--provider`、`--class`/`--machine-class`，或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` 覆寫。GitHub 工作流程通常會覆寫兩者（例如 `--class standard`，以及 Slack 工作流程的 `aws`/`hetzner` 提供者選擇輸入）。若提供者速度太慢或無法使用，請將其他提供者加入同一個 Crabbox 介面，而非寫死備援方案。

VM 基準環境：Linux、支援桌面的 Chrome/Chromium、CDP 存取權、VNC／noVNC、Node 22+ 與 pnpm、OpenClaw checkout，以及可對目標傳輸服務、GitHub、模型提供者和認證資訊代理程式進行輸出存取。

Mantis 工作流程中使用的機密名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 公開上傳成品時使用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（工作流程也接受
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作為備援，並在叫用 Crabbox 前將它們對應至一般名稱）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 執行器絕不可輸出 Discord／Slack／Telegram 機器人權杖、提供者 API 金鑰、瀏覽器 Cookie、驗證設定檔內容、VNC 密碼或原始認證資訊承載資料。若權杖洩漏至 issue、PR、聊天或記錄中，請在儲存替代機密後輪替該權杖。

## 執行結果

前後對照傳輸情境會區分以下結果，避免將不穩定的環境誤判為產品迴歸：

- **已重現錯誤**：基準版本以情境預期的方式失敗。
- **測試框架失敗**：環境設定、認證資訊、傳輸 API、瀏覽器或提供者在判定準則具有意義之前即告失敗。

僅針對候選版本的瀏覽器證據會報告候選版本是否通過模擬閘道和可見 UI 判定；它不宣稱已重現基準版本行為。

## 新增情境

即時傳輸情境會依傳輸方式使用 TypeScript 定義（Discord 前後對照形式請參閱 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），而不是使用獨立的宣告式檔案格式。每個情境需要：識別碼與標題、傳輸方式、必要認證資訊、基準 ref 原則、候選 ref 原則、OpenClaw 設定修補、設定／刺激步驟、預期的基準與候選判定準則、視覺擷取目標、逾時預算，以及清理步驟。

針對候選版本的瀏覽器驗證，可以使用專用且具決定性的端對端測試
與工作流程。請明確限定其範圍，在執行前驗證候選版本的 ref，
隔離使用機密資訊的發布作業，並產生相同證據資訊清單合約。

相較於視覺檢查，應優先使用小型且具型別的判定依據：Discord 的回應狀態或
訊息參照、Slack 討論串的 `ts`／回應 API 狀態、電子郵件訊息 ID
與標頭。只有在 UI 是唯一可靠的可觀察項目時才使用瀏覽器螢幕截圖；
若平台 API 判定依據存在，視覺檢查應僅作為其附加驗證。

繼 Discord、Slack 和 Telegram 之後，相同的執行器架構可擴充至 WhatsApp
（QR 登入、重新識別、傳遞、媒體、回應）與 Matrix
（加密聊天室、討論串／回覆關聯、重新啟動後續接）；兩者目前都
尚未實作。

## 待釐清問題

- 重複使用現有的 Mantis 機器人時，哪個 Discord 機器人應作為驅動程式，哪個應作為受測系統？
- GitHub 應為 PR 保留 Mantis 成果物多久？
- ClawSweeper 應在何時自動建議 Mantis 情境，而不是
  等待維護者命令？
- 上傳至公開 PR 前，是否應遮蔽或裁切螢幕截圖？
