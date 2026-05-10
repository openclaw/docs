---
read_when:
    - 為 OpenClaw 錯誤建置或執行即時視覺 QA
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行
summary: Mantis 是視覺化端對端驗證系統，用於在即時傳輸上重現 OpenClaw 錯誤、擷取修復前後的證據，並將成品附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-05-10T19:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端對端驗證系統，用於需要真實
runtime、真實傳輸與可見證據的錯誤。它會針對已知不良
ref 執行情境、擷取證據，針對候選 ref 執行相同情境，並將比較結果
發布為成品，讓維護者可從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供了高價值的第一條驗證路徑：
真實機器人驗證、真實公會頻道、反應、討論串、原生命令，以及一個
瀏覽器 UI，讓人類可以視覺確認傳輸所呈現的內容。

## 目標

- 使用與使用者所見相同的傳輸形態，重現 GitHub issue 或 PR 中的錯誤。
- 在套用修正之前，於基準 ref 擷取 **before** 成品。
- 在套用修正之後，於候選 ref 擷取 **after** 成品。
- 盡可能使用確定性的判定準則，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當錯誤有可見 UI 表面時擷取螢幕截圖。
- 從代理控制的 CLI 於本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化或提供者驗證卡住時，保留足夠的機器狀態供 VNC 救援。
- 當執行被阻擋、需要手動 VNC 協助或完成時，向操作員 Discord 頻道發布簡潔狀態。

## 非目標

- Mantis 不是單元測試的替代品。理解修正後，Mantis 執行通常應該轉化為
  較小的迴歸測試。
- Mantis 不是一般快速 CI 關卡。它較慢、使用即時憑證，且保留給即時環境很重要的錯誤。
- Mantis 不應在一般操作中需要人類介入。手動 VNC 是救援路徑，不是理想路徑。
- Mantis 不會在成品、日誌、螢幕截圖、Markdown 報告或 PR 留言中儲存原始秘密。

## 擁有權

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有情境 runtime、傳輸配接器、證據結構描述，以及
  `pnpm openclaw qa mantis` 下的本機 CLI。
- QA Lab 擁有即時傳輸測試工具片段、瀏覽器擷取輔助工具與成品寫入器。
- 需要遠端 VM 時，Crabbox 擁有已暖機的 Linux 機器。
- GitHub Actions 擁有遠端工作流程進入點與成品保留。
- ClawSweeper 擁有 GitHub 留言路由：解析維護者命令、
  分派工作流程，並發布最終 PR 留言。
- 當情境需要代理式設定、偵錯或卡住狀態回報時，OpenClaw 代理會透過 Codex 驅動 Mantis。

此邊界將傳輸知識保留在 OpenClaw，機器排程保留在
Crabbox，維護者工作流程黏合層保留在 ClawSweeper。

## 命令形態

第一個本機命令會驗證 Discord 機器人、公會、頻道、訊息傳送、
反應傳送與成品路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機前後對照執行器接受此形態：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

執行器會在輸出目錄下建立分離的基準與候選 worktree、安裝相依項、
建置各個 ref、使用 `--allow-failures` 執行情境，接著寫入 `baseline/`、
`candidate/`、`comparison.json` 與 `mantis-report.md`。對第一個 Discord
情境而言，成功驗證表示基準狀態為 `fail`，候選狀態為 `pass`。

第二個 Discord 前後對照探測針對討論串附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

該情境會使用驅動機器人發布父訊息、建立真實 Discord
討論串、使用 repo 本機 `filePath` 呼叫 OpenClaw 的 `message.thread-reply`
動作，然後輪詢討論串以取得 SUT 回覆與附件檔名。基準螢幕截圖會顯示
沒有附件的回覆；候選螢幕截圖會顯示預期的 `mantis-thread-report.md` 附件。

第一個 VM/瀏覽器原語是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox 桌面機器、在 VNC 工作階段內啟動可見瀏覽器、
擷取桌面、將成品拉回本機輸出目錄，並將重新連線命令寫入報告。此命令預設
使用 Hetzner 提供者，因為它是 Mantis 驗證路徑中第一個具有可用桌面/VNC
覆蓋的提供者。針對其他 Crabbox 機群執行時，可使用 `--provider`、
`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的桌面 smoke 旗標：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用已暖機的桌面。
- `--browser-url <url>` 會變更可見瀏覽器中開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中呈現 repo 本機 HTML 成品。Mantis 使用此項透過真實 Crabbox 桌面擷取產生的 Discord 狀態反應時間軸。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome user-data-dir，讓持久的 Mantis 桌面可在多次執行之間保持登入。將此用於長期存在的 Discord Web 檢視器設定檔。
- `--browser-profile-archive-env <name>` 會在啟動瀏覽器前，從指定環境變數還原 base64 `.tgz` Chrome user-data-dir 封存。將此用於已登入的見證者，例如 Discord Web。預設環境變數為 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 擷取長度。對需要時間穩定下來的緩慢已登入網頁應用程式，請使用較長持續時間。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的租約保持開啟，以供 VNC 檢查。失敗執行若建立了租約，預設會保留租約，讓操作員可重新連線。
- `--class`、`--idle-timeout` 與 `--ttl` 會調整機器大小與租約生命週期。

對於 Discord Web 證據，Mantis 使用專用檢視器帳號，而不是機器人權杖。
即時 Discord API 情境仍然是判定準則：它會建立真實討論串、傳送 SUT
`thread-reply`，並透過 Discord REST 檢查附件。設定
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，情境也會寫入 Discord Web
URL 成品。設定 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 時，它會保留該討論串一段足夠長的時間，讓已登入瀏覽器可開啟並錄製。

GitHub 工作流程會在 Discord Web 中開啟候選討論串 URL、擷取螢幕截圖、
錄製 MP4，並在 Crabbox 媒體工具可用時產生裁剪動態的 GIF 預覽。建議使用
透過 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 設定的持久檢視器設定檔路徑，
因為完整 Chrome 設定檔封存可能會超過 GitHub 的秘密大小限制。對於小型/啟動用
設定檔，工作流程也可從 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原
base64 `.tgz` 封存。如果兩種設定檔來源都未設定，工作流程仍會發布確定性的
基準/候選附件螢幕截圖，並記錄通知說明已略過已登入的 Discord Web 見證者。

第一個完整桌面傳輸原語是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會租用或重用 Crabbox 桌面機器、將目前 checkout 同步到 VM 中、
在該 VM 內執行 `pnpm openclaw qa slack`、於 VNC 瀏覽器中開啟 Slack Web、
擷取可見桌面，並將 Slack QA 成品與 VNC 螢幕截圖都複製回本機輸出目錄。
這是第一個讓 SUT OpenClaw Gateway 與瀏覽器同時位於同一台 Linux 桌面 VM
內的 Mantis 形態。

使用 `--gateway-setup` 時，此命令會在 `$HOME/.openclaw-mantis/slack-openclaw`
準備一個持久的一次性 OpenClaw home、針對選取的頻道修補 Slack Socket Mode
設定、在連接埠 `38973` 啟動 `openclaw gateway run`，並讓 Chrome 在 VNC
工作階段中保持執行。這是「留給我一個有 Slack 與正在執行 claw 的 Linux
桌面」模式；省略 `--gateway-setup` 時，機器人對機器人的 Slack QA 驗證路徑仍是預設值。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型驗證路徑需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本機只設定了
  `OPENAI_API_KEY`，Mantis 會在叫用 Crabbox 前將其對應到 `OPENCLAW_LIVE_OPENAI_KEY`，
  讓 Crabbox 的 `OPENCLAW_*` 環境轉送可將它帶入 VM。

使用 `--gateway-setup --credential-source convex` 時，Mantis 會在建立 VM 前
從共享集區租用 Slack SUT 憑證，並將租用的頻道 id、Socket Mode 應用程式權杖
與機器人權杖作為桌面內的 `OPENCLAW_MANTIS_SLACK_*` runtime 環境轉送。這讓
GitHub 工作流程保持精簡：它們只需要 Convex broker 秘密，而不是原始 Slack
機器人或應用程式權杖。

實用的 Slack 桌面旗標：

- `--lease-id <cbx_...>` 會針對操作員已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久的 OpenClaw Slack Gateway，而不只是執行機器人對機器人的 QA 驗證路徑。
- `--keep-lease` 會在成功後讓 Gateway VM 保持開啟，以供 VNC 檢查；`--no-keep-lease` 會在收集成品後停止它。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未提供，且 SUT 機器人權杖可用，Mantis 會從 Slack `auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 設定使用的 Slack 頻道允許清單。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久 Chrome 設定檔。預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入可在同一租約上的多次重新執行間保留。
- `--credential-source convex --credential-role ci` 使用共享憑證集區，而不是直接使用 Slack 環境權杖。
- `--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會傳遞給 Slack 即時驗證路徑。

GitHub smoke 工作流程是 `Mantis Discord Smoke`。第一個真實情境的前後對照 GitHub
工作流程是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期重現僅 queued 行為的 ref。
- `candidate_ref`：預期顯示 `queued -> thinking -> done` 的 ref。

它會 checkout 工作流程測試工具 ref、建置分離的基準與候選 worktree、
針對各個 worktree 執行 `discord-status-reactions-tool-only`，並將 `baseline/`、
`candidate/`、`comparison.json` 與 `mantis-report.md` 作為 Actions 成品上傳。
它也會在 Crabbox 桌面瀏覽器中呈現各驗證路徑的時間軸 HTML，並在 PR 留言中
將那些 VNC 螢幕截圖與確定性的時間軸 PNG 一起發布。同一個 PR 留言會嵌入由
`crabbox media preview` 產生的輕量裁剪動態 GIF 預覽、連結到對應的裁剪動態
MP4 片段，並保留完整桌面 MP4 檔案供深入檢查。螢幕截圖會保持內嵌以便快速檢閱。
工作流程會從 `openclaw/crabbox` main 建置 Crabbox CLI，讓它能在下一個 Crabbox
二進位版本發布前使用目前的桌面/瀏覽器租約旗標。

`Mantis Scenario` 是通用手動進入點。它接受 `scenario_id`、`candidate_ref`、
選用的 `baseline_ref` 與選用的 `pr_number`，然後分派情境擁有的工作流程。
此包裝器刻意保持精簡：情境工作流程仍然擁有自己的傳輸設定、憑證、VM 類別、
預期判定準則與成品清單。

`Mantis Slack Desktop Smoke` 是第一個 Slack VM 工作流程。它會在獨立 worktree 中簽出受信任的候選 ref、租用 Crabbox Linux 桌面、針對該候選執行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`、在 VNC 瀏覽器中開啟 Slack Web、錄製桌面、使用 `crabbox media preview` 產生動作裁剪預覽、上傳完整 artifact 目錄，並可選擇在目標 PR 上發布內嵌證據留言。它預設使用 AWS 租用桌面，並公開手動 provider 輸入，讓操作者在 AWS 容量緩慢或無法使用時可切換到 Hetzner。當你想要的是「一個 Linux 桌面，上面有 Slack 和正在執行的 claw」，而不只是 bot 對 bot 的 Slack transcript 時，請使用這條 lane。

`Mantis Telegram Live` 會將現有的 Telegram 即時 QA lane 包裝到相同的 PR 證據 pipeline 中。它會在獨立 worktree 中簽出受信任的候選 ref、執行 `pnpm openclaw qa telegram --credential-source convex --credential-role ci`、從 Telegram QA 摘要與 observed-message artifact 寫入 `mantis-evidence.json` manifest、透過 Crabbox 桌面瀏覽器渲染已遮蔽的 transcript HTML、使用 `crabbox media preview` 產生動作裁剪 GIF，並在有 PR 編號時發布內嵌 PR 證據留言。這條 lane 是 transcript 視覺化，而不是已登入的 Telegram Web 證明：Telegram Bot API 提供穩定的即時訊息證據，但一般 Mantis 自動化不需要 Telegram Web 登入狀態。

若要進行 human-in-the-loop 的 Telegram 桌面設定，請使用 scenario builder：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder 會租用或重用 Crabbox 桌面、安裝原生 Linux Telegram Desktop binary、選擇性還原使用者工作階段封存、使用租用的 Telegram SUT bot token 設定 OpenClaw、在連接埠 `38974` 啟動 `openclaw gateway run`、向租用的私人群組發布 driver-bot 就緒訊息，然後從可見的 VNC 桌面擷取截圖與 MP4。bot token 永遠不會登入 Telegram Desktop；它只會設定 OpenClaw。桌面 viewer 是獨立的 Telegram 使用者工作階段，會從 `--telegram-profile-archive-env <name>` 還原，或透過 VNC 手動建立，並以 `--keep-lease` 保持存活。

實用的 Telegram desktop builder 旗標：

- `--lease-id <cbx_...>` 會針對操作者已登入 Telegram Desktop 的 VM 重新執行。
- `--telegram-profile-archive-env <name>` 會從該 env var 讀取 base64 `.tgz` Telegram Desktop profile archive，並在啟動前還原。
- `--telegram-profile-dir <remote-path>` 控制遠端 Telegram Desktop profile 目錄。預設為 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 會安裝並開啟 Telegram Desktop，但不設定 OpenClaw。
- `--credential-source convex --credential-role ci` 會使用共用的 credential broker，而不是直接使用 Telegram env token。

每個會發布到 PR 的 scenario 都會在報告旁寫入 `mantis-evidence.json`。此 schema 是 scenario 程式碼與 GitHub 留言之間的交接：

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

Artifact `path` 值是相對於 manifest 目錄的路徑。`targetPath` 值是 `qa-artifacts` branch 發布目錄底下的相對路徑。publisher 會拒絕路徑穿越，並在選用的預覽或影片無法使用時略過標記為 `"required": false` 的項目。

支援的 artifact 種類：

- `timeline`：確定性的 scenario 截圖，通常是前後對照。
- `desktopScreenshot`：VNC/瀏覽器桌面截圖。
- `motionPreview`：從桌面錄製產生的內嵌動畫 GIF。
- `motionClip`：移除靜態前導與尾端的動作裁剪 MP4。
- `fullVideo`：用於深入檢查的完整 MP4 錄影。
- `metadata`：JSON/log sidecar。
- `report`：Markdown 報告。

可重用的 publisher 是 `scripts/mantis/publish-pr-evidence.mjs`。工作流程會使用 manifest、目標 PR、`qa-artifacts` 目標 root、留言 marker、Actions artifact URL、run URL 和 request source 呼叫它。它會將宣告的 artifacts 複製到 `qa-artifacts` branch、建立以摘要為先的 PR 留言，內含內嵌圖片/預覽與連結影片，然後更新現有的 marker 留言或建立新留言。

你也可以直接從 PR 留言觸發 status-reactions 執行：

```text
@Mantis discord status reactions
```

留言觸發器刻意保持狹窄。它只會在來自具備 write、maintain 或 admin 權限使用者的 pull request 留言上執行，且只辨識 Discord status-reaction 請求。預設會使用已知有問題的 baseline ref，並使用目前 PR head SHA 作為 candidate。maintainer 可以覆寫任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 即時 QA 也可以從 PR 留言觸發：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

預設會使用目前 PR head SHA 作為 candidate，並執行 `telegram-status-command`。maintainer 在需要特定 ref 或預熱的 Crabbox 桌面時，可以覆寫 `candidate=...`、`provider=aws|hetzner` 和 `lease=<cbx_...>`。

ClawSweeper 指令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個指令是明確且以 scenario 為中心的。第二個之後可以從 label、變更的檔案和 ClawSweeper review 發現，將 PR 或 issue 對應到建議的 Mantis scenario。

## 執行生命週期

1. 取得 credentials。
2. 配置或重用 VM。
3. 當 scenario 需要 UI 證據時，準備桌面/瀏覽器 profile。
4. 為 baseline ref 準備乾淨的 checkout。
5. 安裝相依項目，並只建置 scenario 需要的內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定即時 transport、provider、model 和瀏覽器 profile。
8. 執行 scenario 並擷取 baseline 證據。
9. 停止 Gateway 並保留 log。
10. 在同一個 VM 中準備 candidate ref。
11. 執行相同的 scenario 並擷取 candidate 證據。
12. 比較 oracle 結果與視覺證據。
13. 寫入 Markdown、JSON、log、截圖和選用的 trace artifacts。
14. 上傳 GitHub Actions artifacts。
15. 發布精簡的 PR 或 Discord status 訊息。

scenario 應該能以兩種不同方式失敗：

- **重現 bug**：baseline 以預期方式失敗。
- **Harness 失敗**：環境設定、credentials、Discord API、瀏覽器或 provider 在 bug oracle 具有意義前失敗。

最終報告必須區分這些情況，讓 maintainer 不會把不穩定環境誤認為產品行為。

## Discord MVP

第一個 scenario 應以 guild channel 中的 Discord status reactions 為目標，其中 source reply delivery mode 是 `message_tool_only`。

它是良好 Mantis 起點的原因：

- 它會在 Discord 中顯示為觸發訊息上的 reactions。
- 它透過 Discord message reaction state 具備強力的 REST oracle。
- 它會演練真實的 OpenClaw Gateway、Discord bot auth、message dispatch、source reply delivery mode、status reaction state 和 model turn lifecycle。
- 它足夠狹窄，可以讓第一個實作保持務實。

預期的 scenario 形狀：

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Baseline 證據應顯示 queued acknowledgement reaction，但在 tool-only mode 中沒有 lifecycle transition。Candidate 證據應顯示當 `messages.statusReactions.enabled` 明確為 true 時，lifecycle status reactions 會執行。

可執行的第一個切片是 opt-in Discord 即時 QA scenario：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會設定 SUT，包含 always-on guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和明確的 status reactions。oracle 會輪詢真實的 Discord 觸發訊息，並預期觀察到序列 `👀 -> 🤔 -> 👍`。Artifacts 包含 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 元件

Mantis 應建立在現有的 private QA stack 之上，而不是從零開始：

- `pnpm openclaw qa discord` 已經使用 driver 和 SUT bots 執行即時 Discord lane。
- 即時 transport runner 已經在 `.artifacts/qa-e2e/` 底下寫入報告與 observed-message artifacts。
- Convex credential leases 已經提供對共用即時 transport credentials 的獨占存取。
- 瀏覽器控制服務已經支援截圖、snapshots、headless managed profiles 和 remote CDP profiles。
- QA Lab 已經具備 debugger UI 和 bus，可用於 transport-shaped testing。

第一個 Mantis 實作可以是在這些元件上方做一個精簡的前後對照 runner，再加上一層視覺證據。

## 證據模型

每次執行都會寫入穩定的 artifact 目錄：

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` 應是機器可讀的事實來源。Markdown 報告則供 PR 留言與人工 review 使用。

摘要必須包含：

- 測試的 refs 和 SHAs
- transport 和 scenario id
- 機器 provider 和 machine id 或 lease id
- 不含 secret values 的 credential source
- baseline 結果
- candidate 結果
- bug 是否在 baseline 上重現
- candidate 是否修復它
- artifact 路徑
- 已清理的 setup 或 cleanup 問題

截圖是證據，不是 secrets。它們仍需要遵守遮蔽紀律：私人 channel 名稱、user name 或 message content 可能出現。對於公開 PR，在遮蔽策略更成熟前，偏好使用 GitHub Actions artifact 連結，而不是內嵌圖片。

## 瀏覽器和 VNC

瀏覽器 lane 有兩種模式：

- **Headless automation**：CI 的預設模式。Chrome 會啟用 CDP 執行，並由 Playwright 或 OpenClaw browser control 擷取截圖。
- **VNC rescue**：在登入、MFA、Discord anti-automation 或視覺除錯需要人工介入時，在同一個 VM 上啟用。

Discord observer browser profile 應足夠持久，以避免每次執行都要登入，但要與個人瀏覽器狀態隔離。profile 屬於 Mantis machine pool，而不是開發者 laptop。

當 Mantis 卡住時，它會發布一則 Discord status 訊息，其中包含：

- 執行 ID
- 情境 ID
- 機器提供者
- 成品目錄
- VNC 或 noVNC 連線指示（如果可用）
- 簡短的封鎖原因文字

第一次私有部署可以將這些訊息發布到現有的操作者頻道，之後再移至專用的 Mantis 頻道。

## 機器

Mantis 的第一個遠端實作應優先透過 Crabbox 使用 AWS。Crabbox 提供已暖機的機器、租用追蹤、環境準備、日誌、結果和清理。如果 AWS 容量太慢或不可用，請在相同的機器介面後方新增 Hetzner 提供者。

最低 VM 需求：

- 安裝具備桌面能力的 Chrome 或 Chromium 的 Linux
- 用於瀏覽器自動化的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和相依性快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足以執行一個 OpenClaw Gateway、一個瀏覽器和一次模型執行的 CPU 與記憶體
- 可連出至 Discord、GitHub、模型提供者和憑證代理程式

VM 不應在預期的憑證或瀏覽器設定檔儲存區以外保留長期原始密鑰。

## 密鑰

遠端執行的密鑰存放於 GitHub 組織或儲存庫密鑰；本機執行的密鑰則存放於由本機操作者控制的密鑰檔案。

建議的密鑰名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`，用於公開 GitHub 成品上傳
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期來看，Convex 憑證池應維持作為即時傳輸憑證的正常來源。GitHub 密鑰會啟動代理程式和備援通道。Discord 狀態反應工作流程會將 Mantis Crabbox 密鑰對應回 Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 環境變數。純 `CRABBOX_*` GitHub 密鑰名稱仍會作為相容性備援被接受。

Mantis runner 絕不能列印：

- Discord 機器人權杖
- 提供者 API 金鑰
- 瀏覽器 Cookie
- 驗證設定檔內容
- VNC 密碼
- 原始憑證承載

公開成品上傳也應遮蔽 Discord 目標中繼資料，例如機器人、伺服器、頻道和訊息 ID。GitHub smoke 工作流程因此啟用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果權杖意外貼到 issue、PR、聊天或日誌中，請在新密鑰已儲存後輪換該權杖。

## GitHub 成品和 PR 留言

Mantis 工作流程應將完整證據組合作為短期 Actions 成品上傳。當工作流程針對 bug 報告或修復 PR 執行時，也應將已遮蔽的 PNG 截圖發布到 `qa-artifacts` 分支，並在該 bug 或修復 PR 上以行內 before/after 截圖更新或插入留言。不要只將主要證據發布到通用 QA 自動化 PR。原始日誌、觀察到的訊息和其他大型證據保留在 Actions 成品中。

正式環境工作流程應使用 Mantis GitHub App 發布這些留言，而不是使用 `github-actions[bot]`。將 App ID 和私密金鑰分別儲存為 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 密鑰。工作流程會使用隱藏標記作為更新或插入鍵；當權杖可以編輯該留言時更新該留言，若較舊的機器人擁有標記無法編輯，則建立新的 Mantis 擁有留言。

PR 留言應簡短且以視覺為主：

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

當執行失敗是因為 harness 失敗時，留言必須說明這一點，而不是暗示 candidate 失敗。

## 私有部署注意事項

私有部署可能已經有 Mantis Discord 應用程式。若該應用程式具備正確的機器人權限且可以安全輪換，請重複使用該應用程式，而不是建立另一個 App。

透過密鑰或部署設定來設定初始操作者通知頻道。它可以先指向現有的維護者或維運頻道，等專用的 Mantis 頻道存在後再移過去。

不要將伺服器 ID、頻道 ID、機器人權杖、瀏覽器 Cookie 或 VNC 密碼放入此文件。請將它們儲存在 GitHub 密鑰、憑證代理程式或操作者的本機密鑰儲存區中。

## 新增情境

Mantis 情境應宣告：

- ID 和標題
- 傳輸
- 必要憑證
- 基準參照原則
- candidate 參照原則
- OpenClaw 設定修補
- 設定步驟
- 刺激
- 預期的基準 oracle
- 預期的 candidate oracle
- 視覺擷取目標
- 逾時預算
- 清理步驟

情境應優先使用小型、具型別的 oracle：

- 反應 bug 的 Discord 反應狀態
- 串接 bug 的 Discord 訊息參照
- Slack bug 的 Slack thread ts 和反應 API 狀態
- 電子郵件 bug 的電子郵件訊息 ID 和標頭
- 當 UI 是唯一可靠可觀測項時的瀏覽器截圖

視覺檢查應作為加成。如果平台 API 可以證明 bug，請使用 API 作為通過/失敗 oracle，並保留截圖供人工確認信心使用。

## 提供者擴充

在 Discord 之後，相同 runner 可以新增：

- Slack：反應、對話串、App 提及、modal、檔案上傳。
- 電子郵件：在 connector 不足時，使用 `gog` 進行 Gmail 驗證和訊息串接。
- WhatsApp：QR 登入、重新識別、訊息傳遞、媒體、反應。
- Telegram：群組提及閘控、命令、可用時的反應。
- Matrix：加密房間、對話串或回覆關係、重新啟動後恢復。

每個傳輸都應有一個便宜的 smoke 情境，以及一個或多個 bug 類別情境。昂貴的視覺情境應維持選擇性啟用。

## 未決問題

- 重複使用現有 Mantis 機器人時，哪個 Discord 機器人應作為 driver，哪個應作為 SUT？
- 第一階段的觀察者瀏覽器登入應使用真人 Discord 帳號、測試帳號，還是只使用機器人可讀取的 REST 證據？
- GitHub 應保留 PR 的 Mantis 成品多久？
- ClawSweeper 應何時自動建議 Mantis，而不是等待維護者命令？
- 公開 PR 上傳前是否應遮蔽或裁切截圖？
