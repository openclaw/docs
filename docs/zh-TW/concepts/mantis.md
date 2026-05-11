---
read_when:
    - 為 OpenClaw 錯誤建置或執行即時視覺品質保證
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸場景
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的品質保證執行作業
summary: Mantis 是視覺化端對端驗證系統，用於在即時傳輸上重現 OpenClaw 錯誤、擷取修復前後的證據，並將成品附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-05-11T20:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端對端驗證系統，適用於需要真實
runtime、真實傳輸與可見證據的錯誤。它會針對已知有問題的 ref 執行情境、
擷取證據，對候選 ref 執行相同情境，並將比較結果發布為 artifacts，
讓維護者能從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供了高價值的第一條 lane：
真實 bot 驗證、真實 guild 頻道、反應、討論串、原生命令，以及一個
瀏覽器 UI，讓人類可以目視確認傳輸顯示的內容。

## 目標

- 使用與使用者看到相同的傳輸形態，重現 GitHub issue 或 PR 中的錯誤。
- 在套用修正前，於基準 ref 上擷取 **before** artifact。
- 在套用修正後，於候選 ref 上擷取 **after** artifact。
- 盡可能使用確定性的 oracle，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當錯誤有可見 UI 表面時擷取螢幕截圖。
- 從代理控制的 CLI 於本機執行，並從 GitHub 遠端執行。
- 保留足夠的機器狀態，以便在登入、瀏覽器自動化或
  provider 驗證卡住時進行 VNC 救援。
- 當執行受阻、需要手動 VNC 協助或完成時，將精簡狀態發布到操作者 Discord 頻道。

## 非目標

- Mantis 不是單元測試的替代品。修正被理解後，Mantis 執行通常應轉成
  較小的迴歸測試。
- Mantis 不是一般快速 CI gate。它較慢、使用 live credentials，
  且保留給 live 環境很重要的錯誤。
- Mantis 在正常運作時不應需要人類介入。手動 VNC 是救援路徑，
  不是理想路徑。
- Mantis 不會在 artifacts、記錄、螢幕截圖、Markdown
  報告或 PR 留言中儲存原始 secrets。

## 所有權

Mantis 位於 OpenClaw QA stack。

- OpenClaw 擁有 scenario runtime、transport adapters、evidence schema，
  以及 `pnpm openclaw qa mantis` 底下的本機 CLI。
- QA Lab 擁有 live transport harness 組件、browser capture helpers，
  以及 artifact writers。
- 需要遠端 VM 時，Crabbox 擁有預熱的 Linux 機器。
- GitHub Actions 擁有遠端 workflow entrypoint 與 artifact retention。
- ClawSweeper 擁有 GitHub comment routing：解析維護者命令、
  dispatch workflow，並發布最終 PR comment。
- 當情境需要 agentic 設定、除錯或卡住狀態回報時，
  OpenClaw agents 會透過 Codex 驅動 Mantis。

這個邊界將傳輸知識保留在 OpenClaw、機器排程保留在
Crabbox，並將維護者 workflow glue 保留在 ClawSweeper。

## 命令形態

第一個本機命令會驗證 Discord bot、guild、頻道、訊息傳送、
反應傳送，以及 artifact 路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機 before 和 after runner 接受以下形態：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 會在輸出目錄底下建立分離的 baseline 與 candidate worktrees、
安裝相依套件、建置每個 ref、使用 `--allow-failures` 執行情境，
然後寫入 `baseline/`、`candidate/`、`comparison.json`
與 `mantis-report.md`。對第一個 Discord 情境而言，成功驗證表示
baseline 狀態為 `fail`，candidate 狀態為 `pass`。

第二個 Discord before/after probe 針對討論串附件：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

該情境會用 driver bot 發布父訊息、建立真實 Discord 討論串、
以 repo-local `filePath` 呼叫 OpenClaw 的 `message.thread-reply`
動作，然後輪詢討論串中的 SUT 回覆與附件檔名。baseline 螢幕截圖會顯示
沒有附件的回覆；candidate 螢幕截圖會顯示預期的
`mantis-thread-report.md` 附件。

第一個 VM/browser primitive 是 desktop smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox desktop 機器、在 VNC session 中啟動可見瀏覽器、
擷取桌面、將 artifacts 拉回本機輸出目錄，並把重新連線命令寫入報告。
此命令預設使用 Hetzner provider，因為它是 Mantis lane 中第一個具備可用
desktop/VNC 覆蓋的 provider。對其他 Crabbox fleet 執行時，可用
`--provider`、`--crabbox-bin` 或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的 desktop smoke flags：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用預熱的 desktop。
- `--browser-url <url>` 會變更可見瀏覽器開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中呈現 repo-local HTML artifact。Mantis 用它透過真實 Crabbox desktop 擷取產生的 Discord status-reaction timeline。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome user-data-dir，讓持久性 Mantis desktop 能在執行之間維持登入狀態。請將它用於長期存在的 Discord Web viewer profile。
- `--browser-profile-archive-env <name>` 會在啟動瀏覽器前，從指定環境變數還原 base64 `.tgz` Chrome user-data-dir archive。請將它用於已登入的見證者，例如 Discord Web。預設 env var 是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 擷取長度。對需要時間穩定的慢速已登入 web apps，請使用較長時間。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的 lease 保持開啟，以供 VNC 檢查。失敗執行若建立了 lease，預設會保留它，讓操作者可以重新連線。
- `--class`、`--idle-timeout` 與 `--ttl` 會調整機器大小與 lease 生命週期。

對 Discord Web 證據而言，Mantis 使用專用 viewer account，而不是
bot token。live Discord API 情境仍然是 oracle：它會建立真實討論串、
傳送 SUT `thread-reply`，並透過 Discord REST 檢查附件。設定
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，該情境也會寫入
Discord Web URL artifact。設定 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
時，它會讓該討論串保留足夠久，以便已登入的瀏覽器開啟並錄製。

GitHub workflow 會在 Discord Web 中開啟 candidate 討論串 URL、
擷取螢幕截圖、錄製 MP4，並在 Crabbox media tooling 可用時產生裁切過的
GIF 預覽。偏好使用透過 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`
設定的持久性 viewer profile 路徑，因為完整 Chrome profile archive
可能超出 GitHub 的 secret-size 限制。對小型/bootstrap profiles，
workflow 也可以從 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`
還原 base64 `.tgz` archive。若兩種 profile source 都未設定，
workflow 仍會發布確定性的 baseline/candidate 附件螢幕截圖，並記錄通知表示
已略過已登入的 Discord Web witness。

第一個完整 desktop transport primitive 是 Slack desktop smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會租用或重用 Crabbox desktop 機器、將目前 checkout 同步到 VM、
在該 VM 內執行 `pnpm openclaw qa slack`、在 VNC 瀏覽器中開啟
Slack Web、擷取可見桌面，並將 Slack QA artifacts 與 VNC 螢幕截圖
都複製回本機輸出目錄。這是第一個 SUT OpenClaw gateway 與瀏覽器
都位於同一個 Linux desktop VM 內的 Mantis 形態。

使用 `--gateway-setup` 時，命令會在
`$HOME/.openclaw-mantis/slack-openclaw` 準備持久性 disposable
OpenClaw home、為選取的頻道修補 Slack Socket Mode 設定、
在 port `38973` 啟動 `openclaw gateway run`，並讓 Chrome 在
VNC session 中持續執行。這是「留給我一個有 Slack 和正在執行 claw 的
Linux desktop」模式；省略 `--gateway-setup` 時，bot-to-bot Slack QA
lane 仍是預設值。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端 model lane 需要 `OPENCLAW_LIVE_OPENAI_KEY`。若本機只設定了
  `OPENAI_API_KEY`，Mantis 會在呼叫 Crabbox 前將它映射到
  `OPENCLAW_LIVE_OPENAI_KEY`，讓 Crabbox 的 `OPENCLAW_*` env forwarding
  能將它帶入 VM。

使用 `--gateway-setup --credential-source convex` 時，Mantis 會在建立
VM 前，從共享 pool 租用 Slack SUT credential，並將租用的 channel id、
Socket Mode app token 與 bot token 作為 desktop 內的
`OPENCLAW_MANTIS_SLACK_*` runtime env 轉發。這讓 GitHub workflows 保持精簡：
它們只需要 Convex broker secret，而不需要原始 Slack bot 或 app tokens。

實用的 Slack desktop flags：

- `--lease-id <cbx_...>` 會對操作者已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久性 OpenClaw Slack gateway，而不是只執行 bot-to-bot QA lane。
- `--keep-lease` 會在成功後保持 gateway VM 開啟以供 VNC 檢查；`--no-keep-lease` 會在收集 artifacts 後停止它。
- `--slack-url <url>` 會開啟指定 Slack Web URL。若未提供，且 SUT bot token 可用，Mantis 會從 Slack `auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway setup 使用的 Slack channel allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久性 Chrome profile。預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入可在同一個 lease 的重新執行間保留。
- `--credential-source convex --credential-role ci` 會使用共享 credential pool，而不是直接使用 Slack env tokens。
- `--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會傳遞給 Slack live lane。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一個真實情境的 before
和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現 queued-only 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout workflow harness ref、建置分離的 baseline 與 candidate
worktrees、針對每個 worktree 執行 `discord-status-reactions-tool-only`，
並將 `baseline/`、`candidate/`、`comparison.json` 與
`mantis-report.md` 上傳為 Actions artifacts。它也會在 Crabbox
desktop browser 中呈現每個 lane 的 timeline HTML，並在 PR comment 中把那些
VNC 螢幕截圖發布在確定性 timeline PNGs 旁邊。同一個 PR comment 會嵌入由
`crabbox media preview` 產生的輕量 motion-trimmed GIF 預覽、連結到
對應的 motion-trimmed MP4 clips，並保留完整 desktop MP4 檔案供深入檢查。
螢幕截圖會維持 inline 以利快速 review。workflow 會從
`openclaw/crabbox` main 建置 Crabbox CLI，讓它能在下一個 Crabbox binary
release 發布前使用目前的 desktop/browser lease flags。

`Mantis Scenario` 是通用手動 entrypoint。它接受 `scenario_id`、
`candidate_ref`、可選的 `baseline_ref` 與可選的 `pr_number`，
然後 dispatch scenario-owned workflow。wrapper 刻意保持精簡：
scenario workflows 仍然擁有其 transport setup、credentials、VM class、
預期 oracle 與 artifact manifest。

`Mantis Slack Desktop Smoke` 是第一個 Slack VM 工作流程。它會在獨立 worktree 中簽出受信任的候選 ref、租用 Crabbox Linux 桌面、針對該候選項執行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`、在 VNC 瀏覽器中開啟 Slack Web、錄製桌面、使用 `crabbox media preview` 產生動作裁切後的預覽、上傳完整成品目錄，並可選擇性地在目標 PR 上發布行內證據留言。它預設使用 AWS 進行桌面租用，並公開手動提供者輸入，讓操作員在 AWS 容量緩慢或無法使用時切換到 Hetzner。當你需要「一個已執行 Slack 和 claw 的 Linux 桌面」，而不只是機器人對機器人的 Slack 文字記錄時，請使用此通道。

`Mantis Telegram Live` 會將現有的 Telegram 即時 QA 通道包裝在相同的 PR 證據管線中。它會在獨立 worktree 中簽出受信任的候選 ref，執行 `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`，從 Telegram QA 摘要和觀察到的訊息成品寫入 `mantis-evidence.json` manifest，透過 Crabbox 桌面瀏覽器轉譯已遮蔽的文字記錄 HTML，使用 `crabbox media preview` 產生動作裁切後的 GIF，並在可取得 PR 編號時發布行內 PR 證據留言。此通道是文字記錄視覺化，而不是已登入的 Telegram Web 證明：Telegram Bot API 提供穩定的即時訊息證據，但正常 Mantis 自動化不需要 Telegram Web 登入狀態。

`Mantis Telegram Desktop Proof` 是 agentic 原生 Telegram Desktop 前後對照包裝器。維護者可以透過 PR 留言中的 `@Mantis telegram desktop proof`、Actions UI 中的自由格式指示，或透過通用 `Mantis Scenario` dispatcher 觸發它。此工作流程會將 PR、基準 ref、候選 ref 和維護者指示交給 Codex。代理會讀取 PR，決定哪些 Telegram 可見行為能證明變更，針對基準與候選執行真實使用者 Crabbox Telegram Desktop 證明通道，反覆調整直到原生 GIF 可用，將成對的 `motionPreview` 成品寫入 `mantis-evidence.json`，上傳 bundle，並在可取得 PR 編號時發布 2 欄 PR 證據表。

若要進行 human-in-the-loop Telegram 桌面設定，請使用情境建構器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

建構器會租用或重用 Crabbox 桌面、安裝原生 Linux Telegram Desktop binary、選擇性還原使用者工作階段封存、使用租用的 Telegram SUT bot token 設定 OpenClaw、在連接埠 `38974` 上啟動 `openclaw gateway run`、將 driver-bot 就緒訊息發布到租用的私人群組，然後從可見的 VNC 桌面擷取螢幕截圖和 MP4。bot token 永遠不會登入 Telegram Desktop；它只會設定 OpenClaw。桌面檢視器是獨立的 Telegram 使用者工作階段，會從 `--telegram-profile-archive-env <name>` 還原，或透過 VNC 手動建立，並使用 `--keep-lease` 維持存活。

實用的 Telegram 桌面建構器旗標：

- `--lease-id <cbx_...>` 會針對操作員已登入 Telegram Desktop 的 VM 重新執行。
- `--telegram-profile-archive-env <name>` 會從該環境變數讀取 base64 `.tgz` Telegram Desktop profile 封存，並在啟動前還原。
- `--telegram-profile-dir <remote-path>` 控制遠端 Telegram Desktop profile 目錄。預設值是 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 會安裝並開啟 Telegram Desktop，但不設定 OpenClaw。
- `--credential-source convex --credential-role ci` 使用共享認證 broker，而不是直接 Telegram 環境 token。

每個 PR 發布情境都會在其報告旁寫入 `mantis-evidence.json`。此 schema 是情境程式碼與 GitHub 留言之間的交接：

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

成品 `path` 值相對於 manifest 目錄。`targetPath` 值是 `qa-artifacts` 分支發布目錄下的相對路徑。發布器會拒絕路徑穿越，並在選用預覽或影片無法使用時略過標記為 `"required": false` 的項目。

支援的成品類型：

- `timeline`：決定性的情境螢幕截圖，通常是前後對照。
- `desktopScreenshot`：VNC/瀏覽器桌面螢幕截圖。
- `motionPreview`：從桌面錄影產生的行內動畫 GIF。
- `motionClip`：移除靜態開頭與結尾的動作裁切 MP4。
- `fullVideo`：用於深入檢查的完整 MP4 錄影。
- `metadata`：JSON/log sidecar。
- `report`：Markdown 報告。

可重用的發布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流程會使用 manifest、目標 PR、`qa-artifacts` 目標根目錄、留言標記、Actions 成品 URL、執行 URL 和請求來源呼叫它。它會將宣告的成品複製到 `qa-artifacts` 分支，建立以摘要為先的 PR 留言，其中包含行內圖片/預覽和連結影片，然後更新現有標記留言或建立新留言。

你也可以直接從 PR 留言觸發 status-reactions 執行：

```text
@Mantis discord status reactions
```

留言觸發器刻意保持狹窄。它只會在具有 write、maintain 或 admin 存取權的使用者於 pull request 留言時執行，且只會辨識 Discord status-reaction 請求。預設情況下，它會使用已知不良的基準 ref，以及目前 PR head SHA 作為候選。維護者可以覆寫任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 即時 QA 也可以從 PR 留言觸發：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

預設情況下，它會使用目前 PR head SHA 作為候選，並執行 `telegram-status-command`。當維護者需要特定 ref 或預熱過的 Crabbox 桌面時，可以覆寫 `candidate=...`、`provider=aws|hetzner` 和 `lease=<cbx_...>`。

ClawSweeper 指令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個指令是明確且聚焦於情境的指令。第二個稍後可以從標籤、變更檔案和 ClawSweeper review 發現，將 PR 或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得認證。
2. 配置或重用 VM。
3. 當情境需要 UI 證據時，準備桌面/瀏覽器 profile。
4. 為基準 ref 準備乾淨的 checkout。
5. 安裝相依項並只建置情境所需的內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定即時傳輸、提供者、模型和瀏覽器 profile。
8. 執行情境並擷取基準證據。
9. 停止 gateway 並保留日誌。
10. 在同一個 VM 中準備候選 ref。
11. 執行相同情境並擷取候選證據。
12. 比較 oracle 結果與視覺證據。
13. 寫入 Markdown、JSON、日誌、螢幕截圖和選用 trace 成品。
14. 上傳 GitHub Actions 成品。
15. 發布簡潔的 PR 或 Discord 狀態訊息。

情境應該能以兩種不同方式失敗：

- **已重現錯誤**：基準以預期方式失敗。
- **Harness 失敗**：環境設定、認證、Discord API、瀏覽器或提供者在 bug oracle 具有意義之前失敗。

最終報告必須區分這些情況，讓維護者不會將不穩定環境與產品行為混淆。

## Discord MVP

第一個情境應該以 guild channel 中的 Discord status reactions 為目標，其中來源回覆傳遞模式為 `message_tool_only`。

它是良好 Mantis 種子的原因：

- 它在 Discord 中顯示為觸發訊息上的 reactions。
- 它透過 Discord 訊息 reaction 狀態具備強大的 REST oracle。
- 它會演練真實的 OpenClaw Gateway、Discord bot auth、訊息 dispatch、來源回覆傳遞模式、status reaction 狀態和模型 turn 生命週期。
- 它足夠狹窄，可以讓第一個實作保持務實。

預期情境形狀：

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

基準證據應顯示 queued acknowledgement reaction，但在 tool-only 模式中沒有生命週期 transition。候選證據應顯示當 `messages.statusReactions.enabled` 明確為 true 時，生命週期 status reactions 會執行。

可執行的第一個切片是 opt-in Discord 即時 QA 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會將 SUT 設定為 always-on guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和明確 status reactions。oracle 會輪詢真實的 Discord 觸發訊息，並預期觀察到的序列為 `👀 -> 🤔 -> 👍`。成品包含 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 元件

Mantis 應該建基於現有私有 QA stack，而不是從零開始：

- `pnpm openclaw qa discord` 已經執行包含 driver 和 SUT bots 的即時 Discord 通道。
- 即時傳輸 runner 已經在 `.artifacts/qa-e2e/` 下寫入報告和觀察到的訊息成品。
- Convex 認證租約已經提供共享即時傳輸認證的獨佔存取。
- 瀏覽器控制服務已經支援螢幕截圖、snapshots、headless managed profiles 和遠端 CDP profiles。
- QA Lab 已經具備用於 transport-shaped testing 的 debugger UI 和 bus。

第一個 Mantis 實作可以是在這些元件上的薄型前後對照 runner，再加上一層視覺證據。

## 證據模型

每次執行都會寫入穩定的成品目錄：

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

`mantis-summary.json` 應該是機器可讀的事實來源。Markdown 報告供 PR 留言和人工 review 使用。

摘要必須包含：

- 測試的 refs 和 SHAs
- transport 和情境 id
- 機器提供者和機器 id 或租約 id
- 不含 secret 值的認證來源
- 基準結果
- 候選結果
- bug 是否在基準上重現
- 候選是否修復它
- 成品路徑
- 已清理的設定或清理問題

螢幕截圖是證據，不是秘密。不過它們仍需要嚴謹的遮蔽紀律：
可能會出現私人頻道名稱、使用者名稱或訊息內容。對於公開 PR，
在遮蔽流程更完善之前，請優先使用 GitHub Actions artifact 連結，而不是內嵌圖片。

## 瀏覽器與 VNC

瀏覽器流程有兩種模式：

- **Headless automation**：CI 的預設模式。Chrome 會啟用 CDP 執行，
  並由 Playwright 或 OpenClaw 瀏覽器控制擷取螢幕截圖。
- **VNC rescue**：在同一台 VM 上啟用，用於登入、MFA、Discord 反自動化，
  或視覺除錯需要人工介入時。

Discord 觀察者瀏覽器設定檔應該足夠持久，以避免每次執行都要登入，
但要與個人瀏覽器狀態隔離。設定檔屬於 Mantis 機器池，而不是開發者筆電。

當 Mantis 卡住時，會發布一則 Discord 狀態訊息，內容包含：

- 執行 id
- 情境 id
- 機器提供者
- artifact 目錄
- 可用時的 VNC 或 noVNC 連線指示
- 簡短的阻塞原因文字

第一次私人部署可以先將這些訊息發布到現有的操作員頻道，
之後再移到專用的 Mantis 頻道。

## 機器

Mantis 的第一個遠端實作應優先透過 Crabbox 使用 AWS。
Crabbox 提供預熱機器、租約追蹤、hydration、日誌、結果與清理。
如果 AWS 容量太慢或不可用，請在相同機器介面後方加入 Hetzner 提供者。

最低 VM 需求：

- Linux，且安裝具備桌面能力的 Chrome 或 Chromium
- 用於瀏覽器自動化的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 與相依套件快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足夠執行一個 OpenClaw Gateway、一個瀏覽器與一次模型執行的 CPU 和記憶體
- 可對 Discord、GitHub、模型提供者與憑證 broker 進行對外存取

VM 不應在預期的憑證或瀏覽器設定檔儲存區之外保留長期存活的原始秘密。

## 秘密

遠端執行的秘密存放於 GitHub 組織或儲存庫秘密；
本機執行的秘密則存放於由本機操作員控制的秘密檔案。

建議的秘密名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用於公開 GitHub artifact 上傳
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期而言，Convex 憑證池應維持作為即時傳輸憑證的正常來源。
GitHub secrets 用於啟動 broker 和備援流程。
Discord 狀態反應工作流程會將 Mantis Crabbox secrets 對應回
Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 與 `CRABBOX_COORDINATOR_TOKEN` 環境變數。
純 `CRABBOX_*` GitHub secret 名稱仍會作為相容性備援接受。

Mantis runner 絕不可列印：

- Discord bot token
- 提供者 API key
- 瀏覽器 cookie
- auth profile 內容
- VNC 密碼
- 原始憑證 payload

公開 artifact 上傳也應遮蔽 Discord 目標中繼資料，例如 bot、
guild、channel 和 message id。GitHub smoke 工作流程因此啟用
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外貼到 issue、PR、chat 或 log 中，請在新的秘密已儲存後輪換它。

## GitHub artifacts 與 PR 留言

Mantis 工作流程應將完整證據 bundle 上傳為短期存活的 Actions artifact。
當工作流程針對錯誤回報或修復 PR 執行時，也應將遮蔽後的 PNG 螢幕截圖發布到
`qa-artifacts` 分支，並在該錯誤或修復 PR 上 upsert 一則包含內嵌前後對照螢幕截圖的留言。
不要只把主要證據發布在泛用的 QA 自動化 PR 上。原始日誌、觀察到的訊息，
以及其他大型證據保留在 Actions artifact 中。

正式工作流程應使用 Mantis GitHub App 發布這些留言，而不是
`github-actions[bot]`。將 app id 和 private key 儲存為
`MANTIS_GITHUB_APP_ID` 與 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
secrets。工作流程使用隱藏標記作為 upsert key，當 token 可編輯留言時更新該留言；
當較舊的 bot 擁有標記無法編輯時，則建立新的 Mantis 擁有留言。

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

當執行失敗是因為 harness 失敗時，留言必須明確說明這點，
而不是暗示 candidate 失敗。

## 私人部署注意事項

私人部署可能已經有 Mantis Discord application。
如果該 application 具備正確的 bot 權限，且可以安全輪換，請重複使用它，
不要建立另一個 app。

透過 secrets 或部署設定配置初始操作員通知頻道。
它一開始可以指向現有的維護者或 operations 頻道，
之後在專用 Mantis 頻道建立後再移過去。

不要把 guild id、channel id、bot token、瀏覽器 cookie 或 VNC 密碼放進這份文件。
請將它們儲存在 GitHub secrets、憑證 broker，或操作員的本機秘密儲存區中。

## 新增情境

Mantis 情境應宣告：

- id 和標題
- 傳輸
- 所需憑證
- baseline ref 政策
- candidate ref 政策
- OpenClaw 設定 patch
- 設定步驟
- 刺激
- 預期 baseline oracle
- 預期 candidate oracle
- 視覺擷取目標
- timeout 預算
- 清理步驟

情境應優先採用小型且具型別的 oracle：

- 反應錯誤使用 Discord reaction state
- threading 錯誤使用 Discord message reference
- Slack 錯誤使用 Slack thread ts 與 reaction API state
- email 錯誤使用 email message id 與 header
- UI 是唯一可靠可觀察項時使用瀏覽器螢幕截圖

視覺檢查應作為加成項。如果平台 API 可以證明錯誤，
請使用 API 作為通過/失敗 oracle，並保留螢幕截圖以提供人工信心。

## 提供者擴充

Discord 之後，相同 runner 可以加入：

- Slack：reactions、threads、app mentions、modals、file uploads。
- Email：在 connectors 不足時，使用 `gog` 進行 Gmail auth 與 message threading。
- WhatsApp：QR login、re-identification、message delivery、media、reactions。
- Telegram：group mention gating、commands、可用時的 reactions。
- Matrix：encrypted rooms、thread 或 reply relations、restart resume。

每個傳輸都應有一個低成本 smoke 情境，以及一個或多個 bug-class 情境。
昂貴的視覺情境應維持 opt-in。

## 未解問題

- 重複使用現有 Mantis bot 時，哪個 Discord bot 應作為 driver，哪個應作為 SUT？
- 第一階段的觀察者瀏覽器登入應使用真人 Discord 帳號、測試帳號，
  還是只使用 bot 可讀的 REST 證據？
- GitHub 應保留 Mantis PR artifacts 多久？
- ClawSweeper 何時應自動建議 Mantis，而不是等待維護者命令？
- 公開 PR 的螢幕截圖在上傳前是否應遮蔽或裁切？
