---
read_when:
    - 建置或執行 OpenClaw 錯誤的即時視覺 QA
    - 為 Pull Request 新增變更前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行
summary: Mantis 是視覺化端對端驗證系統，用於在即時傳輸上重現 OpenClaw 錯誤、擷取前後對照證據，並將成品附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-07-05T11:13:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9900316f179fbb42fb8cef603bd6719b55a8fb769409980ff7b17cf3e562ae70
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 會在真實傳輸上，針對已知有問題的基準 ref 與候選 ref 重新執行錯誤情境，接著將前後比較發布為 CI 成品與 PR 留言。Discord 最先推出：真實機器人驗證、真實 guild 頻道、反應、討論串，以及人類可檢查的瀏覽器見證。Slack 與 Telegram 路線也已存在；WhatsApp 和 Matrix 尚未實作。

## 所有權

- OpenClaw (`extensions/qa-lab/src/mantis/*`)：情境執行階段、`pnpm openclaw qa mantis <command>` 命令列介面、證據結構描述。
- QA Lab (`extensions/qa-lab/src/live-transports/*`)：即時傳輸測試框架、驅動程式/SUT 機器人、報告/證據寫入器。
- Crabbox (`openclaw/crabbox`)：已暖機的 Linux 機器、租約、VNC、`crabbox media preview`。
- GitHub Actions (`.github/workflows/mantis-*.yml`)：遠端進入點、成品保留。
- ClawSweeper：解析維護者 PR 命令、派送工作流程、發布最終 PR 留言。

## 命令列介面命令

所有命令都是 `pnpm openclaw qa mantis <command>`，定義於
`extensions/qa-lab/src/mantis/cli.ts`。需要在建置/執行時間設定 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
（內建工作流程會在建置前設定 `OPENCLAW_BUILD_PRIVATE_QA=1` 與
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`）。

| 命令                            | 用途                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | 驗證 Mantis Discord 機器人可以看到 guild/頻道、發文並加入反應。                                                                                           |
| `run`                           | 針對基準與候選 ref 執行前後情境（僅限 Discord）。                                                                                                         |
| `desktop-browser-smoke`         | 租用/重用 Crabbox 桌面、開啟可見瀏覽器、擷取螢幕截圖 + 影片。                                                                                             |
| `slack-desktop-smoke`           | 租用/重用 Crabbox 桌面、在其中執行 Slack QA、開啟 Slack Web、擷取證據。                                                                                    |
| `telegram-desktop-builder`      | 租用/重用 Crabbox 桌面、安裝 Telegram Desktop、可選擇設定 OpenClaw 閘道。                                                                                 |
| `visual-task` / `visual-driver` | 一般 Crabbox 桌面擷取，支援選用的影像理解斷言；`visual-driver` 是在 `crabbox record --while` 下啟動的驅動程式半部。                                      |

每個命令都接受 `--repo-root <path>` 與 `--output-dir <path>`；Crabbox
命令也接受 `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl` 與 `--keep-lease`。本機命令列介面預設
provider/class 為 `hetzner`/`beast`，除非另有註明；CI 工作流程通常會覆寫兩者。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

呼叫 Discord REST API (`https://discord.com/api/v10`) 以擷取機器人
使用者、guild、guild 的頻道，以及目標頻道，斷言該
頻道屬於該 guild，接著（除非使用 `--skip-post`）發布訊息並
加入 `👀` 反應。寫入 `mantis-discord-smoke-summary.json` 與
`mantis-discord-smoke-report.md`。

權杖解析順序：`--token-file` 值，接著是 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（以 `--token-env` 覆寫），接著是由 `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
命名的檔案（以 `--token-file-env` 覆寫）。Guild/頻道 ID 來自
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（以
`--guild-id` / `--channel-id` 覆寫），而且必須是 17-20 位數的 Discord snowflake。設定
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 可在發布的摘要與報告中，將機器人/guild/頻道/訊息 ID
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

`--transport` 目前只接受 `discord`。`--scenario` 是兩個
內建 ID 之一，各自有自己的預設基準 ref 與預期前後
標籤（`extensions/qa-lab/src/mantis/run.runtime.ts`）：

| 情境                                       | 預設基準                                   | 基準預期                                 | 候選預期                     |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | 討論串回覆省略 `filePath` 附件           | 討論串回覆包含它             |

`--candidate` 預設為 `HEAD`。其他旗標：`--credential-source`
（預設 `convex`）、`--credential-role`（預設 `ci`）、`--provider-mode`
（預設 `live-frontier`）、`--fast`（預設開啟）、`--skip-install`、`--skip-build`。

執行器會在 `<output-dir>/worktrees/` 下，為基準與
候選建立分離的 `git worktree` checkout，在
各自內執行 `pnpm install`/`pnpm build`（除非略過），接著對每個 worktree 執行
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`。
每條路線會寫入 `discord-qa-reaction-timelines.json`
以及一組 `<scenario-id>-timeline.html`/`.png`；執行器會把此
證據複製回 `baseline/`/`candidate/` 下，在輸出目錄中寫入 `comparison.json`、
`mantis-report.md` 與 `mantis-evidence.json`，並且在比較未通過（基準 `fail` 且候選
`pass`）時以非零狀態結束。

第二個 Discord 情境（`discord-thread-reply-filepath-attachment`）會使用
驅動機器人發布父訊息、建立真實討論串、以 repo-local `filePath` 呼叫 SUT 的
`message.thread-reply` 動作，接著輪詢
討論串以取得回覆與附件檔名。它預期會有名為
`mantis-thread-report.md` 的附件。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

租用或重用 Crabbox 桌面，在 VNC 工作階段中啟動瀏覽器，
指向 `--browser-url`（預設 `https://openclaw.ai`）或渲染後的
`--html-file`，等待後以 `scrot` 截圖，可選擇用
`ffmpeg` 錄製 MP4，並將 `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
rsync 回 `--output-dir`。

旗標：

- `--lease-id <cbx_...>` 重用已暖機的桌面，而不是建立新的桌面。
- `--browser-profile-dir <remote-path>` 重用遠端 Chrome user-data-dir，讓持久桌面在執行之間保持登入（用於長期存在的 Discord Web 檢視器設定檔）。
- `--browser-profile-archive-env <name>` 在啟動前，從該環境變數還原 base64 `.tgz` Chrome 設定檔封存（預設 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）；用於已登入的見證者，例如 Discord Web。
- `--video-duration <seconds>` 控制 MP4 擷取長度（預設 10s）。
- `--keep-lease`（或 `OPENCLAW_MANTIS_KEEP_VM=1`）保留本次執行建立的租約以供 VNC 檢查；建立租約的失敗執行也會預設保留。

對於 Discord Web 證據，Mantis 使用專用檢視器帳號，而不是機器人
權杖。Discord REST oracle（透過 `qa discord`）仍是權威來源；當
設定 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，情境也會寫入
Discord Web URL 成品，而 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 會讓
討論串保持開啟足夠久，以便瀏覽器開啟它。

GitHub 工作流程偏好透過
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 使用持久檢視器設定檔（完整設定檔封存可能超過
GitHub 的 secret 大小限制）；對於小型/啟動設定檔，它也可以改為從
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原 base64 `.tgz`。若兩種來源都未設定，
工作流程仍會發布確定性的
基準/候選螢幕截圖，並記錄已略過已登入見證者。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

租用或重用 Crabbox 桌面、將 checkout 同步到 VM 內、在其中執行
`pnpm openclaw qa slack`、於 VNC 瀏覽器中開啟 Slack Web，
擷取桌面，並將 Slack QA 成品（`slack-qa/`）與
VNC 螢幕截圖/影片複製回本機。這是唯一一種 SUT 閘道
與瀏覽器都在同一個 VM 內執行的 Mantis 形態。

使用 `--gateway-setup` 時，此命令會在 VM 的 `$HOME/.openclaw-mantis/slack-openclaw`
建立持久的一次性 OpenClaw home，為目標頻道修補 Slack
Socket Mode 設定，啟動
`openclaw gateway run --dev --allow-unconfigured --port 38973`，並讓
Chrome 在 VNC 工作階段中保持執行；省略 `--gateway-setup` 會改為執行一般
機器人對機器人的 Slack QA 路線。

`--credential-source env` 所需環境變數（本機預設為 `env`；角色
預設為 `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型路線所需的 `OPENCLAW_LIVE_OPENAI_KEY`（若本機只設定 `OPENAI_API_KEY`，
  Mantis 會在呼叫 Crabbox 前將其複製到 `OPENCLAW_LIVE_OPENAI_KEY`）

使用 `--credential-source convex` 時，Mantis 會在建立 VM 前，從
共用集區租用 Slack SUT 憑證，並將頻道 ID、app token 與
bot token 作為 `OPENCLAW_MANTIS_SLACK_*` 環境變數轉送到 VM，所以 GitHub
工作流程只需要 Convex broker secret，不需要原始 Slack token。

其他旗標：`--slack-url <url>` 會開啟特定 URL（否則 Mantis 會從 `auth.test` 推導
`https://app.slack.com/client/<team>/<channel>`）；
`--slack-channel-id <id>` 設定閘道允許清單頻道；
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久 Chrome
設定檔（預設 `$HOME/.config/openclaw-mantis/slack-chrome-profile`）；
`--approval-checkpoints` 執行原生 Slack 核准情境
（`slack-approval-exec-native`、`slack-approval-plugin-native`），並渲染
待處理/已解決的檢查點螢幕截圖，而不是設定閘道（與
`--gateway-setup` 互斥）；`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會傳遞給
Slack 即時路線。

核准檢查點螢幕截圖是根據情境觀察到的 Slack API 訊息渲染，
不是即時 Slack UI；只有在租約的瀏覽器設定檔已登入時，`slack-desktop-smoke.png`
才是 Slack Web 本身的證明。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

租用或重用 Crabbox 桌面、安裝原生 Linux Telegram Desktop、
可選擇還原使用者工作階段封存、使用租用的 Telegram SUT 機器人權杖設定 OpenClaw，
啟動
`openclaw gateway run --dev --allow-unconfigured --port 38974`，向
租用的私人群組發布驅動機器人就緒訊息，接著擷取
螢幕截圖與 MP4。機器人權杖只會設定 OpenClaw；它絕不會讓
Telegram Desktop 登入。桌面檢視器是獨立的 Telegram 使用者工作階段，
可從 `--telegram-profile-archive-env <name>` 還原，或透過 VNC 手動登入
並以 `--keep-lease` 保持運作。

Flags：`--lease-id <cbx_...>` 會對已登入 Telegram Desktop 的 VM 重新執行；`--telegram-profile-archive-env <name>` 會在啟動前還原 base64 `.tgz` 個人檔案封存；`--telegram-profile-dir <remote-path>` 會設定遠端個人檔案目錄（預設為 `$HOME/.local/share/TelegramDesktop`）；`--no-gateway-setup` 只會安裝並開啟 Telegram Desktop；`--credential-source`/`--credential-role` 預設為 `convex`/`maintainer`。

## 證據 manifest

每個發布到 PR 的情境都會在其報告旁寫入 `mantis-evidence.json`：

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

Artifact `path` 是相對於 manifest 目錄的路徑；`targetPath` 是相對於已設定 R2/S3 artifact 前綴的路徑。`scripts/mantis/publish-pr-evidence.mjs` 會拒絕路徑穿越，並在檔案遺失時略過含有 `"required": false` 的項目。

Artifact 類型：`timeline`（確定性的前後對照截圖）、`desktopScreenshot`（VNC/瀏覽器截圖）、`motionPreview`（來自錄影的內嵌動畫 GIF）、`motionClip`（經動作裁剪的 MP4）、`fullVideo`（完整錄影）、`metadata`（JSON/記錄檔 sidecar）、`report`（Markdown 報告）。

一次執行的磁碟 artifact 配置：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

截圖是證據，不是秘密，但仍需要遵守遮蔽紀律：私人頻道名稱、使用者名稱或訊息內容可能會出現。公開 artifact 上傳時設定 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`；它在 Discord/Slack/Telegram GitHub workflows 中預設啟用。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` 是可重用的發布器。Workflows 會以 manifest、目標 PR、artifact 目標根目錄、留言標記、artifact URL、執行 URL 與請求來源呼叫它。它會將宣告的 artifacts 上傳到 Mantis R2 bucket，建立摘要優先的 PR 留言，內含行內圖片/預覽與連結影片，接著更新既有標記留言或建立新的留言。必要 env：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（workflows 設定為 `openclaw-crabbox-artifacts`）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（workflows 設定為 `auto`）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（workflows 設定為 `https://artifacts.openclaw.ai`）

留言會透過 Mantis GitHub App（`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`）發布，而不是 `github-actions[bot]`，並使用隱藏標記留言作為 upsert key。

| Workflow                          | 觸發條件                                                                                   | 執行內容                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動派送                                                                                   | 針對所選 ref 執行 `discord-smoke`。                                                                                                                                                                                                                                                         |
| `Mantis Discord Status Reactions` | PR 留言或手動派送                                                                          | 建立分開的 baseline/candidate worktrees，分別執行 `discord-status-reactions-tool-only`，在 Crabbox 桌面瀏覽器中渲染各 lane 的 timeline，使用 `crabbox media preview` 產生經動作裁剪的 GIF/MP4 預覽，上傳 artifacts，發布行內 PR 證據。                                                       |
| `Mantis Scenario`                 | 手動派送                                                                                   | 通用派送器：接受 `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`）、`baseline_ref`、`candidate_ref`、`pr_number`，並轉送到符合的情境 workflow。                              |
| `Mantis Slack Desktop Smoke`      | 手動派送                                                                                   | 租用 Crabbox Linux 桌面（預設為 `aws`，可選 `hetzner`），針對 candidate 執行 `slack-desktop-smoke --gateway-setup`，錄製桌面，產生動作預覽，上傳 artifacts，並在提供 PR 編號時發布 PR 證據。                                                                                                  |
| `Mantis Telegram Live`            | PR 留言或手動派送                                                                          | 執行 bot-API Telegram live QA lane（`openclaw qa telegram`），從 QA 摘要寫入 `mantis-evidence.json`，透過 Crabbox 桌面瀏覽器渲染已遮蔽的證據 HTML，產生動作 GIF，發布 PR 證據。此 lane 不需要 Telegram Web 登入。                                                                                |
| `Mantis Telegram Desktop Proof`   | maintainer PR label（`mantis: telegram-visible-proof`）加上 PR 留言，或手動派送           | Agentic 原生 Telegram Desktop 前後對照證明。將 PR、baseline/candidate refs 與 maintainer 指示交給 Codex，由它對兩個 refs 執行真實使用者 Crabbox Telegram Desktop 證明 lane，並發布 2 欄 PR 證據表。                                                                                           |

`Mantis Discord Status Reactions` 與 `Mantis Telegram Live` 都接受 `baseline_ref`/`candidate_ref`（或 PR 留言中的 `baseline=`/`candidate=`），並在使用含有秘密的憑證執行前，驗證解析出的 SHA 是 `origin/main` 的祖先、release tag（`v*`），或開放 PR 的 head。

來自具備 write/maintain/admin 存取權 PR 的留言觸發：

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Telegram 留言觸發預設使用 PR head SHA 作為 candidate，並使用 `telegram-status-command` 作為情境；它們接受 `provider=aws|hetzner` 與 `lease=<cbx_...>`，以指定特定 Crabbox provider 或預熱過的桌面。`Mantis Telegram Desktop Proof` 只有在 PR 已帶有 `mantis: telegram-visible-proof` label 時才會回應 PR 留言。

ClawSweeper 也可以直接派送情境：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## 機器與秘密

本機命令列介面 Crabbox 預設為 `--provider hetzner --class beast`；可用 `--provider`、`--class`/`--machine-class`，或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` 覆寫。GitHub workflows 通常會覆寫兩者（例如 `--class standard`，以及 Slack workflow 的 `aws`/`hetzner` provider 選擇輸入）。如果 provider 太慢或無法使用，請將它加在同一個 Crabbox 介面後方，而不是硬編碼 fallback。

VM baseline：Linux，具備可用於桌面的 Chrome/Chromium、CDP 存取、VNC/noVNC、Node 22+ 與 pnpm、OpenClaw checkout，以及到目標 transport、GitHub、模型 provider 與憑證 broker 的對外存取。

Mantis workflows 中使用的秘密名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用於公開 artifact 上傳
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（workflows 也接受 `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` 作為 fallback，並在呼叫 Crabbox 前將它們對應到純名稱）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis runner 絕不能列印 Discord/Slack/Telegram bot tokens、provider API keys、瀏覽器 cookies、auth profile 內容、VNC 密碼或原始憑證 payloads。如果 token 外洩到 issue、PR、聊天或記錄檔，請在替換秘密儲存後輪替它。

## 執行結果

情境會以兩種可區分的方式之一失敗，報告會分開呈現它們，避免不穩定的環境看起來像產品 regression：

- **重現 bug**：baseline 以情境預期的方式失敗。
- **Harness 失敗**：環境設定、憑證、transport API、瀏覽器或 provider 在 oracle 具有意義之前失敗。

## 新增情境

情境是依 transport 以 TypeScript 定義（Discord 前後對照形狀請參閱 `extensions/qa-lab/src/mantis/run.runtime.ts` 中的 `MANTIS_SCENARIO_CONFIGS`），不是獨立的宣告式檔案格式。每個情境都需要：id 與標題、transport、必要憑證、baseline ref 政策、candidate ref 政策、OpenClaw config patch、設定/刺激步驟、預期 baseline 與 candidate oracle、視覺擷取目標、timeout 預算，以及清理步驟。

偏好小型、typed oracles，而不是 vision 檢查：Discord reaction state 或 message references、Slack thread `ts`/reaction API state、email message ids 與 headers。當 UI 是唯一可靠可觀察項目時才使用瀏覽器截圖，且在存在 platform-API oracle 時，讓 vision 檢查作為附加項目。

在 Discord、Slack 與 Telegram 之後，相同的 runner 形狀可延伸到 WhatsApp（QR 登入、重新識別、傳遞、媒體、reactions）與 Matrix（加密房間、thread/reply 關係、restart resume）；兩者都尚未實作。

## 未決問題

- 重用既有 Mantis bot 時，哪個 Discord bot 應該作為 driver，哪個作為 SUT？
- GitHub 應該為 PR 保留 Mantis artifacts 多久？
- ClawSweeper 應在何時自動建議 Mantis 情境，而不是等待 maintainer 指令？
- 公開 PR 上傳前，截圖是否應遮蔽或裁剪？
