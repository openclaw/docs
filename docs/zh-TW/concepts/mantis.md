---
read_when:
    - 建立或執行 OpenClaw 錯誤的即時視覺品質保證測試
    - 為提取要求加入變更前後的驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 針對候選參照執行聚焦的 Control UI 瀏覽器驗證
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行作業
summary: Mantis 會擷取即時傳輸比較的視覺端對端證據，以及僅針對候選版本的瀏覽器驗證證據，然後將這些成品附加至 PR。
title: Mantis
x-i18n:
    generated_at: "2026-07-11T21:14:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 會發布 OpenClaw 行為的視覺化 CI 證據與 PR 留言。
即時傳輸情境會將已知有問題的基準版本與候選參照進行比較；
聚焦的瀏覽器執行管道則可改為使用確定性的模擬傳輸，證明單一候選版本。
Discord 最先支援，包含真實機器人驗證、伺服器頻道、
表情回應、討論串與瀏覽器見證。Slack、Telegram，以及聚焦的控制
介面聊天執行管道也已存在；WhatsApp 與 Matrix 尚未實作。

## 所有權

- OpenClaw (`extensions/qa-lab/src/mantis/*`)：情境執行環境、`pnpm openclaw qa mantis <command>` 命令列介面、證據結構描述。
- QA Lab (`extensions/qa-lab/src/live-transports/*`)：即時傳輸測試框架、驅動程式／受測系統機器人、報告／證據寫入器。
- Crabbox (`openclaw/crabbox`)：已預熱的 Linux 機器、租約、VNC、`crabbox media preview`。
- GitHub Actions (`.github/workflows/mantis-*.yml`)：遠端進入點、成品保留。
- ClawSweeper：解析維護者 PR 命令、分派工作流程、發布最終 PR 留言。

## 命令列介面命令

所有命令皆為 `pnpm openclaw qa mantis <command>`，定義於
`extensions/qa-lab/src/mantis/cli.ts`。建置／執行時需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（隨附的工作流程會在建置前設定 `OPENCLAW_BUILD_PRIVATE_QA=1` 與
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 驗證 Mantis Discord 機器人可以看到伺服器／頻道、發布訊息並加入表情回應。                                                                                  |
| `run`                           | 針對基準與候選參照執行前後情境比較（僅限 Discord）。                                                                                                     |
| `desktop-browser-smoke`         | 租用／重用 Crabbox 桌面、開啟可見的瀏覽器，並擷取螢幕截圖與影片。                                                                                         |
| `slack-desktop-smoke`           | 租用／重用 Crabbox 桌面、在其中執行 Slack QA、開啟 Slack Web 並擷取證據。                                                                                 |
| `telegram-desktop-builder`      | 租用／重用 Crabbox 桌面、安裝 Telegram Desktop，並可選擇設定 OpenClaw 閘道。                                                                              |
| `visual-task` / `visual-driver` | 通用 Crabbox 桌面擷取，可選擇加入影像理解斷言；`visual-driver` 是在 `crabbox record --while` 下啟動的驅動端。                                              |

每個命令都接受 `--repo-root <path>` 與 `--output-dir <path>`；Crabbox
命令也接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 與 `--keep-lease`。除非另有註明，本機命令列介面對
供應商／機器類別的預設值為 `hetzner`/`beast`；CI 工作流程
通常會覆寫兩者。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

呼叫 Discord REST API (`https://discord.com/api/v10`) 以取得機器人
使用者、伺服器、伺服器頻道與目標頻道，斷言該
頻道屬於該伺服器，然後（除非指定 `--skip-post`）發布訊息並
加入 `👀` 表情回應。寫入 `mantis-discord-smoke-summary.json` 與
`mantis-discord-smoke-report.md`。

權杖解析順序：`--token-file` 的值，接著是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（可用 `--token-env` 覆寫），最後是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
指定的檔案（可用 `--token-file-env` 覆寫）。伺服器／頻道 ID 來自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（可用
`--guild-id` / `--channel-id` 覆寫），且必須是 17 至 20 位數的 Discord snowflake。設定
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，即可在發布的摘要與報告中將機器人／伺服器／頻道／訊息 ID
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
內建 ID 之一，每個 ID 都有自己的預設基準參照與預期的前後
標籤（`extensions/qa-lab/src/mantis/run.runtime.ts`）：

| 情境                                       | 預設基準                                   | 基準預期                                 | 候選版本預期                 |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 討論串回覆省略 `filePath` 附件           | 討論串回覆包含該附件         |

`--candidate` 預設為 `HEAD`。其他旗標：`--credential-source`
（預設為 `convex`）、`--credential-role`（預設為 `ci`）、`--provider-mode`
（預設為 `live-frontier`）、`--fast`（預設啟用）、`--skip-install`、`--skip-build`。

執行器會在 `<output-dir>/worktrees/` 下為基準與
候選版本建立分離的 `git worktree` 簽出，在
各自的工作樹中執行 `pnpm install`/`pnpm build`（除非略過），然後針對每個工作樹執行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每個執行管道會寫入 `discord-qa-reaction-timelines.json`
以及一組 `<scenario-id>-timeline.html`/`.png`；執行器會將這些
證據複製回 `baseline/`/`candidate/` 下，在輸出目錄中寫入
`comparison.json`、`mantis-report.md` 與 `mantis-evidence.json`，並在比較未通過（基準為 `fail` 且候選版本為
`pass`）時以非零狀態碼結束。

第二個 Discord 情境（`discord-thread-reply-filepath-attachment`）會使用
驅動機器人發布一則上層訊息、建立真實討論串、以儲存庫內的 `filePath`
呼叫受測系統的 `message.thread-reply` 動作，然後輪詢
討論串以取得回覆與附件檔名。它預期有一個名為
`mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或重用 Crabbox 桌面，在 VNC 工作階段中啟動瀏覽器，
開啟 `--browser-url`（預設為 `https://openclaw.ai`）或已轉譯的
`--html-file`，等待後以 `scrot` 擷取螢幕截圖，選擇性地使用
`ffmpeg` 錄製 MP4，並透過 rsync 將 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
同步回 `--output-dir`。

旗標：

- `--lease-id <cbx_...>` 會重用已預熱的桌面，而不建立新桌面。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome 使用者資料目錄，讓持續運作的桌面在各次執行之間保持登入狀態（用於長期存在的 Discord Web 檢視者設定檔）。
- `--browser-profile-archive-env <name>` 會在啟動前，從該環境變數還原以 base64 編碼的 `.tgz` Chrome 設定檔封存檔（預設為 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用於 Discord Web 等已登入的見證環境。
- `--video-duration <seconds>` 控制 MP4 擷取長度（預設為 10 秒）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）會讓本次執行建立的租約保持開啟，以供 VNC 檢查；若失敗的執行建立了租約，預設也會保留該租約。

對於 Discord Web 證據，Mantis 使用專用檢視者帳號，而非機器人
權杖。Discord REST 判定來源（透過 `qa discord`）仍具權威性；設定
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，情境也會寫入
Discord Web URL 成品，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 會讓
討論串保持開啟足夠長的時間，以便瀏覽器開啟它。

GitHub 工作流程偏好透過
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持續存在的檢視者設定檔（完整設定檔封存檔可能超過
GitHub 的密鑰大小限制）；對於較小型／引導用的設定檔，則可改為從
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原以 base64 編碼的 `.tgz`。若
兩種來源都未設定，工作流程仍會發布確定性的
基準／候選版本螢幕截圖，並記錄已略過登入狀態的見證程序。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或重用 Crabbox 桌面、將簽出內容同步至虛擬機器、在其中執行
`pnpm openclaw qa slack`、於 VNC 瀏覽器中開啟 Slack Web、
擷取桌面，並將 Slack QA 成品（`slack-qa/`）以及
VNC 螢幕截圖／影片複製回本機。這是唯一一種受測系統
閘道與瀏覽器都在同一部虛擬機器內執行的 Mantis 形式。

指定 `--gateway-setup` 時，命令會在虛擬機器的
`$HOME/.openclaw-mantis/slack-openclaw` 建立持續存在但可丟棄的 OpenClaw
主目錄、修補目標頻道的 Slack
Socket Mode 設定、啟動
`openclaw gateway run --dev --allow-unconfigured --port 38973`，並讓
Chrome 在 VNC 工作階段中持續執行；省略 `--gateway-setup` 則會改為執行一般的
機器人對機器人 Slack QA 執行管道。

`--credential-source env` 所需的環境變數（本機預設為 `env`；角色
預設為 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型執行管道使用的 `OPENCLAW_LIVE_OPENAI_KEY`（若本機僅設定 `OPENAI_API_KEY`，
  Mantis 會在叫用 Crabbox 前將其複製至 `OPENCLAW_LIVE_OPENAI_KEY`）

指定 `--credential-source convex` 時，Mantis 會先從
共用集區租用 Slack 受測系統憑證，再建立虛擬機器，並將頻道 ID、應用程式權杖與
機器人權杖以 `OPENCLAW_MANTIS_SLACK_*` 環境變數轉送至虛擬機器，因此 GitHub
工作流程只需要 Convex 代理密鑰，而不需要原始 Slack 權杖。

其他旗標：`--slack-url <url>` 會開啟特定 URL（否則 Mantis 會從 `auth.test`
推導出 `https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 設定閘道允許清單中的頻道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制虛擬機器內持續存在的 Chrome
設定檔（預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 會執行原生 Slack 核准情境
（`slack-approval-exec-native`、`slack-approval-plugin-native`），並轉譯
待處理／已解決的檢查點螢幕截圖，而非設定閘道（與
`--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會傳遞至
Slack 即時執行管道。

核准檢查點螢幕截圖是根據情境觀察到的 Slack API 訊息
轉譯，而非即時 Slack 使用者介面；只有在租約的瀏覽器設定檔已登入時，
`slack-desktop-smoke.png` 才能作為 Slack Web 本身的證明。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或重複使用 Crabbox 桌面環境、安裝原生 Linux Telegram Desktop，並可選擇還原使用者工作階段封存檔；接著使用租用的 Telegram 待測系統機器人權杖設定 OpenClaw、啟動
`openclaw gateway run --dev --allow-unconfigured --port 38974`、將驅動機器人就緒訊息張貼至租用的私人群組，然後擷取螢幕截圖與 MP4。機器人權杖只會設定 OpenClaw；絕不會用來登入 Telegram Desktop。桌面檢視器是獨立的 Telegram 使用者工作階段，會從 `--telegram-profile-archive-env <name>` 還原，或透過 VNC 手動登入，並以 `--keep-lease` 維持運作。

旗標：`--lease-id <cbx_...>` 會在已登入 Telegram Desktop 的虛擬機器上重新執行；`--telegram-profile-archive-env <name>` 會在啟動前還原 base64 編碼的 `.tgz` 設定檔封存檔；`--telegram-profile-dir <remote-path>` 會設定遠端設定檔目錄（預設為 `$HOME/.local/share/TelegramDesktop`）；`--no-gateway-setup` 僅安裝並開啟 Telegram Desktop；`--credential-source`/`--credential-role` 預設為 `convex`/`maintainer`。

## 證據資訊清單

每個發佈至 PR 的情境，都會在其報告旁寫入 `mantis-evidence.json`：

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

成品的 `path` 是相對於資訊清單目錄的路徑；`targetPath` 是相對於已設定 R2/S3 成品前綴的路徑。`scripts/mantis/publish-pr-evidence.mjs` 會拒絕路徑遍歷，並在檔案遺失時略過 `"required": false` 的項目。

成品種類：`timeline`（具確定性的變更前後螢幕截圖）、`desktopScreenshot`（VNC／瀏覽器螢幕截圖）、`motionPreview`（由錄影產生的內嵌動態 GIF）、`motionClip`（經動態裁剪的 MP4）、`fullVideo`（完整錄影）、`metadata`（JSON／記錄附屬檔）、`report`（Markdown 報告）。

一次執行在磁碟上的成品配置：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

螢幕截圖是證據，不是秘密，但仍需遵守遮蔽規範：其中可能會出現私人頻道名稱、使用者名稱或訊息內容。公開上傳成品時，請設定 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；Discord／Slack／Telegram 的 GitHub 工作流程預設已啟用此設定。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` 是可重複使用的發佈器。工作流程會使用資訊清單、目標 PR、成品目標根目錄、留言標記、成品 URL、執行 URL，以及請求來源來呼叫它。它會將宣告的成品上傳至 Mantis R2 儲存貯體、建立先顯示摘要的 PR 留言，其中包含內嵌圖片／預覽與連結影片，然後更新現有的標記留言或建立新留言。必要的環境變數：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（工作流程設定為 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（工作流程設定為 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（工作流程設定為 `https://artifacts.openclaw.ai`）

留言會透過 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`）張貼，而不是透過 `github-actions[bot]`；並使用隱藏的標記留言作為新增或更新鍵。

| 工作流程                          | 觸發方式                                                                                    | 執行內容                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動分派                                                                            | 對選定的參照執行 `discord-smoke`。                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR 留言或手動分派                                                              | 建立獨立的基準／候選工作樹、分別對其執行 `discord-status-reactions-tool-only`、在 Crabbox 桌面瀏覽器中呈現各路徑的時間軸、使用 `crabbox media preview` 產生經動態裁剪的 GIF／MP4 預覽、上傳成品，並張貼內嵌 PR 證據。                                 |
| `Mantis Scenario`                 | 手動分派                                                                            | 通用分派器：接受 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，並轉送至相符的情境工作流程。 |
| `Mantis Slack Desktop Smoke`      | 手動分派                                                                            | 租用 Crabbox Linux 桌面環境（預設為 `aws`，可選擇 `hetzner`）、對候選版本執行 `slack-desktop-smoke --gateway-setup`、錄製桌面、產生動態預覽、上傳成品，並在提供 PR 編號時張貼 PR 證據。                                                      |
| `Mantis Telegram Live`            | PR 留言或手動分派                                                              | 執行基於機器人 API 的 Telegram 即時 QA 路徑（`openclaw qa telegram`）、根據 QA 摘要寫入 `mantis-evidence.json`、透過 Crabbox 桌面瀏覽器呈現經遮蔽的證據 HTML、產生動態 GIF，並張貼 PR 證據。此路徑不需要登入 Telegram Web。                               |
| `Mantis Telegram Desktop Proof`   | 維護者 PR 標籤（`mantis: telegram-visible-proof`）加上 PR 留言，或手動分派 | 由代理執行的原生 Telegram Desktop 變更前後證明。將 PR、基準／候選參照及維護者指示交給 Codex，由其針對兩個參照執行真實使用者 Crabbox Telegram Desktop 證明路徑，並張貼雙欄 PR 證據表格。                                                              |
| `Mantis Web UI Chat Proof`        | PR 留言或手動分派                                                              | 對候選版本執行聚焦於 OpenClaw Control UI 聊天功能的 Playwright 證明、驗證瀏覽器是否透過模擬閘道傳送、擷取螢幕截圖／影片成品，並張貼 PR 證據。此路徑僅證明網頁聊天功能，不涵蓋 WinUI／原生應用程式或任意視覺證明。                           |

`Mantis Discord Status Reactions` 和 `Mantis Telegram Live` 都接受
`baseline_ref`/`candidate_ref`（或 PR 留言中的 `baseline=`/`candidate=`），並在使用含秘密的憑證執行前，驗證解析出的 SHA 是否為 `origin/main` 的祖先、發行標籤（`v*`），或開放中 PR 的最新提交。

具有寫入／維護／管理員存取權的 PR 留言觸發方式：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram 留言觸發方式預設將 PR 最新提交的 SHA 作為候選版本，並將
`telegram-status-command` 作為情境；可接受 `provider=aws|hetzner` 和
`lease=<cbx_...>`，以指定特定 Crabbox 提供者或預先暖機的桌面環境。`Mantis Telegram Desktop Proof` 僅會在 PR 已具有 `mantis: telegram-visible-proof` 標籤時回應 PR 留言。

Web UI 聊天留言觸發方式預設將 PR 最新提交的 SHA 作為候選版本。它們會執行 Control UI 的模擬閘道聊天證明並發佈瀏覽器成品；其他網頁與原生應用程式介面請使用一般 Playwright／瀏覽器證明、維護者螢幕截圖、Crabbox 或本機成品。

ClawSweeper 也可以直接分派情境：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 機器與秘密

本機命令列介面的 Crabbox 預設值為 `--provider hetzner --class beast`；可使用 `--provider`、`--class`/`--machine-class`，或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` 覆寫。GitHub
工作流程通常會同時覆寫兩者（例如 `--class standard`，以及 Slack 工作流程的 `aws`/`hetzner` 提供者選擇輸入）。如果某個提供者速度過慢或無法使用，請透過相同的 Crabbox 介面加入該提供者，而非硬編碼備援機制。

虛擬機器基準：具備可執行桌面版 Chrome／Chromium 的 Linux、CDP 存取、VNC／
noVNC、Node 22+ 和 pnpm、OpenClaw 簽出版本，以及對目標傳輸服務、GitHub、模型提供者與憑證代理服務的對外存取能力。

Mantis 工作流程使用的秘密名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 公開上傳成品時使用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（工作流程也接受
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作為備援，並在叫用 Crabbox 前將它們對應至無前綴的名稱）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis 執行器絕不可列印 Discord／Slack／Telegram 機器人權杖、提供者 API 金鑰、瀏覽器 Cookie、驗證設定檔內容、VNC 密碼或原始憑證承載資料。如果權杖洩漏至議題、PR、聊天或記錄中，請在儲存替代秘密後輪替該權杖。

## 執行結果

變更前後的傳輸情境會區分下列結果，避免將不穩定的環境誤判為產品迴歸：

- **已重現錯誤**：基準版本依情境預期的方式失敗。
- **測試框架失敗**：環境設定、憑證、傳輸 API、瀏覽器或提供者在判定條件具有效力前即告失敗。

僅候選版本的瀏覽器證明會報告候選版本是否通過模擬閘道與可見介面斷言；不會宣稱已在基準版本重現問題。

## 新增情境

即時傳輸情境是針對各傳輸方式以 TypeScript 定義（如需 Discord 變更前後的結構，請參閱
`extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），而不是獨立的宣告式檔案格式。
每個情境都需要：識別碼與標題、傳輸方式、必要憑證、基準參照原則、候選參照原則、OpenClaw 設定修補、設定／刺激步驟、預期的基準與候選判定條件、視覺擷取目標、逾時預算，以及清理步驟。

針對候選版本的瀏覽器驗證，可使用專用且具確定性的端對端測試與工作流程。應明確限定其範圍，在執行前驗證候選版本參照，隔離由機密支援的發布作業，並產生符合相同證據資訊清單契約的輸出。

相較於視覺檢查，應優先採用小型且具型別的判定器：Discord 的回應狀態或訊息參照、Slack 討論串的 `ts`／回應 API 狀態，以及電子郵件訊息 ID 與標頭。僅在使用者介面是唯一可靠的可觀測來源時使用瀏覽器螢幕截圖；若平台提供 API 判定器，視覺檢查應僅作為其附加驗證。

繼 Discord、Slack 和 Telegram 之後，相同的執行器架構可擴充至 WhatsApp（QR 登入、重新識別、傳遞、媒體、回應）與 Matrix（加密聊天室、討論串／回覆關聯、重新啟動後續接）；但目前兩者皆尚未實作。

## 待釐清問題

- 重複使用現有的 Mantis 機器人時，哪個 Discord 機器人應作為驅動程式，哪個應作為受測系統？
- GitHub 應為 PR 保留 Mantis 成品多久？
- ClawSweeper 應在何時自動建議 Mantis 情境，而非等待維護者下達命令？
- 為公開 PR 上傳螢幕截圖前，是否應先遮蔽敏感資訊或裁切？
