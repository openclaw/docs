---
read_when:
    - 建置或執行針對 OpenClaw 錯誤的即時視覺品質保證
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 除錯需要螢幕截圖、瀏覽器自動化或 VNC 存取權的 QA 執行
summary: Mantis 是視覺化端對端驗證系統，用於在實際傳輸通道上重現 OpenClaw 錯誤、擷取修復前後的證據，並將產物附加到拉取請求。
title: 螳螂
x-i18n:
    generated_at: "2026-05-06T02:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bba09cf1c3b4e16fc1e8ca84ce0d9c8284969c82e56f1f7083fc54f238924e9
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端對端驗證系統，用於需要真實
runtime、真實傳輸層，以及可見證明的錯誤。它會針對已知有問題的
ref 執行情境、擷取證據，再針對候選 ref 執行相同情境，並將比較結果
發布為 artifacts，讓維護者可以從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供了一條高價值的第一條路徑：
真實 bot 驗證、真實 guild 頻道、反應、討論串、原生命令，以及人類可以
視覺確認傳輸層所顯示內容的瀏覽器 UI。

## 目標

- 以使用者看到的相同傳輸形態，重現 GitHub issue 或 PR 中的錯誤。
- 在套用修正前，於基準 ref 擷取 **修正前** artifact。
- 在套用修正後，於候選 ref 擷取 **修正後** artifact。
- 盡可能使用確定性的 oracle，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當錯誤具有可見 UI 表面時擷取螢幕截圖。
- 從 agent 控制的 CLI 在本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化或供應商驗證卡住時，保留足夠的機器狀態供 VNC 救援。
- 當執行受阻、需要手動 VNC 協助或完成時，將精簡狀態發布到操作員 Discord 頻道。

## 非目標

- Mantis 不是單元測試的替代品。修正被理解後，Mantis 執行通常應該轉化為
  較小的回歸測試。
- Mantis 不是一般快速 CI 閘門。它較慢、使用即時憑證，並保留給即時環境重要的錯誤。
- Mantis 的正常運作不應需要人類介入。手動 VNC 是救援路徑，不是理想路徑。
- Mantis 不會在 artifacts、日誌、螢幕截圖、Markdown 報告或 PR 留言中儲存原始密鑰。

## 擁有權

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有情境 runtime、傳輸轉接器、證據 schema，以及 `pnpm openclaw qa mantis` 下的本機 CLI。
- QA Lab 擁有即時傳輸 harness 元件、瀏覽器擷取 helper，以及 artifact 寫入器。
- 當需要遠端 VM 時，Crabbox 擁有已預熱的 Linux 機器。
- GitHub Actions 擁有遠端工作流程進入點與 artifact 保留。
- ClawSweeper 擁有 GitHub 留言路由：解析維護者命令、派送工作流程，並發布最終 PR 留言。
- 當情境需要 agentic 設定、除錯或卡住狀態回報時，OpenClaw agents 會透過 Codex 驅動 Mantis。

此邊界將傳輸知識保留在 OpenClaw、機器排程保留在
Crabbox，並將維護者工作流程黏合邏輯保留在 ClawSweeper。

## 命令形態

第一個本機命令會驗證 Discord bot、guild、頻道、訊息傳送、
反應傳送，以及 artifact 路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機修正前與修正後 runner 接受此形態：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 會在輸出目錄下建立 detached 的基準與候選 worktree、安裝相依項、
建置每個 ref、使用 `--allow-failures` 執行情境，接著寫入 `baseline/`、
`candidate/`、`comparison.json` 和 `mantis-report.md`。對第一個 Discord
情境而言，成功驗證表示基準狀態為 `fail`，候選狀態為 `pass`。

第二個 Discord 修正前/修正後探針以討論串附件為目標：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

該情境會用驅動 bot 發布父訊息、建立真實 Discord 討論串、
呼叫 OpenClaw 的 `message.thread-reply` action 並傳入 repo-local
`filePath`，接著輪詢討論串中的 SUT 回覆與附件檔名。基準螢幕截圖顯示
沒有附件的回覆；候選螢幕截圖顯示預期的 `mantis-thread-report.md` 附件。

第一個 VM/瀏覽器 primitive 是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox 桌面機器、在 VNC session 內啟動可見瀏覽器、
擷取桌面、將 artifacts 拉回本機輸出目錄，並把重新連線命令寫入報告。
該命令預設使用 Hetzner provider，因為它是 Mantis 路徑中第一個具有可用
桌面/VNC 覆蓋的 provider。對另一個 Crabbox fleet 執行時，可使用
`--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的桌面 smoke 旗標：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用已預熱的桌面。
- `--browser-url <url>` 會變更可見瀏覽器中開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中算繪 repo-local HTML artifact。Mantis 使用此方式，透過真實 Crabbox 桌面擷取產生的 Discord 狀態反應時間軸。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome user-data-dir，讓持久化 Mantis 桌面可在多次執行之間保持登入。對長期存在的 Discord Web 檢視器 profile 使用此選項。
- `--browser-profile-archive-env <name>` 會從指定環境變數還原 base64 `.tgz` Chrome user-data-dir archive，再啟動瀏覽器。對已登入的見證者使用此選項，例如 Discord Web。預設 env var 是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 擷取長度。對需要時間穩定下來的慢速已登入 web app，使用較長時間。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的 lease 保持開啟，供 VNC 檢查。失敗執行在建立 lease 時預設會保留，讓操作員可以重新連線。
- `--class`、`--idle-timeout` 和 `--ttl` 會調整機器大小與 lease 存續時間。

對 Discord Web 證據，Mantis 使用專用檢視器帳號，而不是
bot token。即時 Discord API 情境仍然是 oracle：它會建立真實
討論串、傳送 SUT `thread-reply`，並透過 Discord REST 檢查附件。
設定 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，該情境也會寫入
Discord Web URL artifact。設定 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 時，
它會讓該討論串保留足夠久，讓已登入瀏覽器可以開啟並錄製。

GitHub 工作流程會在 Discord Web 中開啟候選討論串 URL、擷取螢幕截圖、
錄製 MP4，並在 Crabbox media tooling 可用時產生裁剪過的 GIF 預覽。
偏好使用透過 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 設定的持久化
檢視器 profile 路徑，因為完整 Chrome profile archive 可能超過 GitHub
的 secret 大小限制。對小型/bootstrap profile，工作流程也可以從
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原 base64 `.tgz` archive。
如果兩種 profile 來源都未設定，工作流程仍會發布確定性的基準/候選
附件螢幕截圖，並記錄通知說已略過已登入的 Discord Web 見證者。

第一個完整桌面傳輸 primitive 是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會租用或重用 Crabbox 桌面機器、將目前 checkout 同步到
VM、在該 VM 內執行 `pnpm openclaw qa slack`、在 VNC 瀏覽器中開啟
Slack Web、擷取可見桌面，並將 Slack QA artifacts 與 VNC 螢幕截圖
複製回本機輸出目錄。這是第一個 SUT OpenClaw gateway 和瀏覽器都位於
同一台 Linux 桌面 VM 內的 Mantis 形態。

使用 `--gateway-setup` 時，該命令會在 `$HOME/.openclaw-mantis/slack-openclaw`
準備持久化的一次性 OpenClaw home、針對所選頻道修補 Slack Socket Mode
設定、在連接埠 `38973` 啟動 `openclaw gateway run`，並讓 Chrome 持續在
VNC session 中執行。這是「留給我一個執行 Slack 和 claw 的 Linux
桌面」模式；省略 `--gateway-setup` 時，bot 對 bot Slack QA 路徑仍為預設。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型路徑需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本機只設定了
  `OPENAI_API_KEY`，Mantis 會在叫用 Crabbox 前將它映射到 `OPENCLAW_LIVE_OPENAI_KEY`，
  讓 Crabbox 的 `OPENCLAW_*` env 轉送可以把它帶入 VM。

使用 `--gateway-setup --credential-source convex` 時，Mantis 會先從共享池租用
Slack SUT 憑證，再建立 VM，並將租用的頻道 id、Socket Mode app token
和 bot token 作為桌面內部的 `OPENCLAW_MANTIS_SLACK_*` runtime env 轉送。
這讓 GitHub 工作流程保持精簡：它們只需要 Convex broker secret，而不需要
原始 Slack bot 或 app token。

實用的 Slack 桌面旗標：

- `--lease-id <cbx_...>` 會針對操作員已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久化 OpenClaw Slack gateway，而不是只執行 bot 對 bot QA 路徑。
- `--keep-lease` 會在成功後保持 gateway VM 開啟供 VNC 檢查；`--no-keep-lease` 會在收集 artifacts 後停止它。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未指定，當 SUT bot token 可用時，Mantis 會從 Slack `auth.test` 推導出 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway setup 使用的 Slack 頻道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久化 Chrome profile。預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入可在同一 lease 的重新執行中保留。
- `--credential-source convex --credential-role ci` 會使用共享憑證池，而不是直接 Slack env token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 會傳遞到 Slack 即時路徑。

GitHub smoke 工作流程是 `Mantis Discord Smoke`。第一個真實情境的修正前與修正後
GitHub 工作流程是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現 only queued 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout 工作流程 harness ref、建置分開的基準與候選 worktree、
對每個 worktree 執行 `discord-status-reactions-tool-only`，並將 `baseline/`、
`candidate/`、`comparison.json` 和 `mantis-report.md` 作為 Actions artifacts
上傳。它也會在 Crabbox 桌面瀏覽器中算繪每條路徑的時間軸 HTML，並在 PR
留言中將那些 VNC 螢幕截圖發布於確定性時間軸 PNG 旁。相同 PR 留言會嵌入
由 `crabbox media preview` 產生的輕量 motion-trimmed GIF 預覽、連結到相符的
motion-trimmed MP4 片段，並保留完整桌面 MP4 檔案供深入檢查。螢幕截圖會保持
inline，方便快速審查。工作流程會從 `openclaw/crabbox` main 建置 Crabbox CLI，
以便在下一個 Crabbox binary release 完成前使用目前的桌面/瀏覽器 lease 旗標。

`Mantis Scenario` 是通用手動進入點。它接受 `scenario_id`、`candidate_ref`、
選用的 `baseline_ref`，以及選用的 `pr_number`，接著派送情境擁有的工作流程。
該 wrapper 刻意保持精簡：情境工作流程仍然擁有自己的傳輸設定、憑證、VM class、
預期 oracle，以及 artifact manifest。

`Mantis Slack Desktop Smoke` 是第一個 Slack VM 工作流程。它會在獨立 worktree 中 checkout 受信任的候選 ref、租用 Crabbox Linux 桌面、針對該候選版本執行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`、在 VNC 瀏覽器中開啟 Slack Web、錄製桌面、使用 `crabbox media preview` 產生經動態裁切的預覽、上傳完整成品目錄，並可選擇在目標 PR 上發布內嵌證據留言。它預設使用 AWS 租用桌面，並提供手動 provider 輸入，讓操作者在 AWS 容量緩慢或不可用時切換到 Hetzner。當你想要的是「一個執行 Slack 和 claw 的 Linux 桌面」，而不只是 bot 對 bot 的 Slack transcript 時，請使用此通道。

每個 PR 發布場景都會在報告旁寫入 `mantis-evidence.json`。此 schema 是場景程式碼與 GitHub 留言之間的交接：

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

成品 `path` 值是相對於 manifest 目錄的路徑。`targetPath` 值是 `qa-artifacts` 分支發布目錄下的相對路徑。發布器會拒絕路徑穿越，並在可選預覽或影片不可用時略過標記為 `"required": false` 的項目。

支援的成品種類：

- `timeline`：決定性的場景螢幕截圖，通常是前後對照。
- `desktopScreenshot`：VNC/瀏覽器桌面螢幕截圖。
- `motionPreview`：從桌面錄影產生的內嵌動畫 GIF。
- `motionClip`：經動態裁切的 MP4，移除靜態開頭和結尾。
- `fullVideo`：用於深入檢查的完整 MP4 錄影。
- `metadata`：JSON/log 附帶檔。
- `report`：Markdown 報告。

可重用的發布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流程會使用 manifest、目標 PR、`qa-artifacts` 目標根目錄、留言標記、Actions 成品 URL、run URL 和請求來源來呼叫它。它會將宣告的成品複製到 `qa-artifacts` 分支，建立以摘要為優先的 PR 留言，其中包含內嵌圖片/預覽和連結影片，然後更新現有的標記留言或建立新留言。

你也可以直接從 PR 留言觸發 status-reactions 執行：

```text
@Mantis discord status reactions
```

留言觸發器刻意保持範圍狹窄。它只會針對具有 write、maintain 或 admin 存取權限使用者在 pull request 上的留言執行，且只辨識 Discord status-reaction 請求。預設情況下，它會使用已知不良的基準 ref，並使用目前 PR head SHA 作為候選版本。維護者可以覆寫任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 指令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個指令明確且聚焦於場景。第二個之後可以依據標籤、變更檔案和 ClawSweeper review 發現，將 PR 或 issue 對應到建議的 Mantis 場景。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 當場景需要 UI 證據時，準備桌面/瀏覽器 profile。
4. 為基準 ref 準備乾淨的 checkout。
5. 安裝依賴項，並只建置場景需要的內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定 live transport、provider、model 和瀏覽器 profile。
8. 執行場景並擷取基準證據。
9. 停止 gateway 並保留 logs。
10. 在同一部 VM 中準備候選 ref。
11. 執行相同場景並擷取候選證據。
12. 比較判定器結果和視覺證據。
13. 寫入 Markdown、JSON、logs、螢幕截圖和可選 trace 成品。
14. 上傳 GitHub Actions 成品。
15. 發布簡潔的 PR 或 Discord 狀態訊息。

場景應該能以兩種不同方式失敗：

- **重現 bug**：基準以預期方式失敗。
- **Harness 失敗**：環境設定、憑證、Discord API、瀏覽器或 provider 在 bug 判定器具有意義前失敗。

最終報告必須區分這些情況，讓維護者不會把不穩定環境和產品行為混淆。

## Discord MVP

第一個場景應以 guild channels 中的 Discord status reactions 為目標，其中來源回覆傳遞模式是 `message_tool_only`。

它是良好 Mantis 種子的原因：

- 它在 Discord 中以觸發訊息上的 reactions 顯示。
- 它透過 Discord message reaction state 擁有強大的 REST 判定器。
- 它會測試真實的 OpenClaw Gateway、Discord bot auth、message dispatch、source reply delivery mode、status reaction state 和 model turn lifecycle。
- 它範圍夠窄，可以讓第一個實作保持誠實。

預期場景形狀：

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

基準證據應顯示 queued acknowledgement reaction，但在 tool-only 模式中沒有 lifecycle transition。候選證據應顯示當 `messages.statusReactions.enabled` 明確為 true 時，lifecycle status reactions 正在執行。

可執行的第一個切片是 opt-in Discord live QA 場景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會使用 always-on guild handling、`visibleReplies: "message_tool"`、`ackReaction: "👀"` 和明確的 status reactions 設定 SUT。判定器會輪詢真實的 Discord 觸發訊息，並預期觀察到序列 `👀 -> 🤔 -> 👍`。成品包含 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 組件

Mantis 應建立在現有 private QA stack 之上，而不是從零開始：

- `pnpm openclaw qa discord` 已經使用 driver 和 SUT bots 執行 live Discord 通道。
- live transport runner 已經會在 `.artifacts/qa-e2e/` 下寫入報告和 observed-message 成品。
- Convex credential leases 已經提供對 shared live transport credentials 的獨佔存取。
- browser control service 已經支援 screenshots、snapshots、headless managed profiles 和 remote CDP profiles。
- QA Lab 已經有用於 transport-shaped testing 的 debugger UI 和 bus。

第一個 Mantis 實作可以是在這些組件上建立一層薄的 before/after runner，再加上一個視覺證據層。

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

`mantis-summary.json` 應是機器可讀的單一真實來源。Markdown 報告用於 PR 留言和人工 review。

摘要必須包含：

- 測試的 refs 和 SHAs
- transport 和 scenario id
- machine provider 和 machine id 或 lease id
- 不含 secret values 的 credential source
- 基準結果
- 候選結果
- bug 是否在基準上重現
- 候選是否修復它
- 成品路徑
- 經清理的 setup 或 cleanup 問題

螢幕截圖是證據，不是 secrets。它們仍需要遵守遮蔽紀律：private channel names、user names 或 message content 可能會出現。對於 public PRs，在 redaction story 更完善之前，優先使用 GitHub Actions 成品連結，而不是內嵌圖片。

## 瀏覽器與 VNC

瀏覽器通道有兩種模式：

- **Headless automation**：CI 的預設值。Chrome 會啟用 CDP 執行，而 Playwright 或 OpenClaw browser control 會擷取 screenshots。
- **VNC rescue**：當 login、MFA、Discord anti-automation 或 visual debugging 需要人工時，在同一部 VM 上啟用。

Discord observer browser profile 應具有足夠持久性，以避免每次執行都需要登入，但要與個人瀏覽器狀態隔離。profile 屬於 Mantis machine pool，而不是開發者筆電。

當 Mantis 卡住時，它會發布 Discord 狀態訊息，內容包括：

- run id
- scenario id
- machine provider
- 成品目錄
- VNC 或 noVNC 連線指示，如果可用
- 簡短 blocker 文字

第一個 private deployment 可以將這些訊息發布到現有 operator channel，之後再移到專用 Mantis channel。

## 機器

第一個 remote 實作中，Mantis 應優先透過 Crabbox 使用 AWS。Crabbox 為我們提供 warmed machines、lease tracking、hydration、logs、results 和 cleanup。如果 AWS 容量太慢或不可用，請在相同的 machine interface 後加入 Hetzner provider。

最低 VM 需求：

- Linux，並安裝可用於桌面的 Chrome 或 Chromium
- 用於 browser automation 的 CDP access
- 用於 rescue 的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和 dependency cache
- 使用 Playwright 時的 Playwright Chromium browser cache
- 足夠 CPU 和記憶體，可支援一個 OpenClaw Gateway、一個瀏覽器和一次 model run
- 對 Discord、GitHub、model providers 和 credential broker 的 outbound access

VM 不應在預期的 credential 或 browser profile stores 之外保留長期 raw secrets。

## Secrets

遠端執行的 secrets 存放於 GitHub organization 或 repository secrets，本機執行則存放於本機 operator-controlled secret file。

建議的 secret names：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` for public GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期而言，Convex credential pool 應保持為 live transport credentials 的一般來源。GitHub secrets 會啟動 broker 和 fallback lanes。Discord status-reactions 工作流程會將 Mantis Crabbox secrets 對應回 Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 環境變數。一般的 `CRABBOX_*` GitHub secret names 仍會作為相容性 fallback 被接受。

Mantis runner 絕不能印出：

- Discord bot tokens
- provider API keys
- browser cookies
- auth profile contents
- VNC passwords
- raw credential payloads

Public artifact uploads 也應遮蔽 Discord target metadata，例如 bot、guild、channel 和 message ids。GitHub smoke workflow 因此啟用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 意外貼到 issue、PR、chat 或 log 中，請在新 secret 儲存後輪換該 token。

## GitHub 成品與 PR 留言

Mantis 工作流程應將完整證據包上傳為短期有效的 Actions
成品。當工作流程針對錯誤回報或修復 PR 執行時，也應將已遮蔽的 PNG
螢幕截圖發布到 `qa-artifacts` 分支，並在該錯誤或修復 PR 上更新插入一則
包含行內前後對照螢幕截圖的留言。不要只把主要證明發布在一般 QA 自動化 PR 上。
原始記錄、觀察到的訊息和其他大型證據應保留在 Actions 成品中。

生產工作流程應使用 Mantis GitHub App 發布這些留言，而不是使用
`github-actions[bot]`。將 app id 和私鑰儲存為
`MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
secret。工作流程使用隱藏標記作為更新插入鍵，當 token 可以編輯留言時更新該
留言；當較舊的 bot 擁有的標記無法編輯時，則建立一則由 Mantis 擁有的新留言。

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

當執行因測試工具失敗而失敗時，留言必須說明這一點，而不是暗示候選修復失敗。

## 私有部署備註

私有部署可能已經有 Mantis Discord 應用程式。當該應用程式具備正確的 bot
權限且可以安全輪換時，請重用該應用程式，而不是建立另一個 app。

透過 secret 或部署設定來設定初始操作員通知頻道。它可以先指向現有的維護者或
操作頻道，等專用的 Mantis 頻道建立後再移過去。

不要將 guild id、channel id、bot token、瀏覽器 cookie 或 VNC 密碼放入
此文件。請將它們儲存在 GitHub secrets、憑證代理程式或操作員的本機 secret
儲存區中。

## 新增情境

Mantis 情境應宣告：

- id 和標題
- 傳輸
- 必要憑證
- 基準參照政策
- 候選參照政策
- OpenClaw 設定修補
- 設定步驟
- 刺激
- 預期基準 oracle
- 預期候選 oracle
- 視覺擷取目標
- 逾時預算
- 清理步驟

情境應優先使用小型、具型別的 oracle：

- 用於反應錯誤的 Discord 反應狀態
- 用於串接錯誤的 Discord 訊息參照
- 用於 Slack 錯誤的 Slack thread ts 和反應 API 狀態
- 用於 email 錯誤的 email message id 和 header
- 當 UI 是唯一可靠可觀察項時使用瀏覽器螢幕截圖

視覺檢查應作為加成。如果平台 API 能證明錯誤，請使用 API 作為通過/失敗
oracle，並保留螢幕截圖供人員建立信心。

## 提供者擴充

在 Discord 之後，同一個執行器可以新增：

- Slack：反應、thread、app 提及、modal、檔案上傳。
- Email：在 connector 不足時，使用 `gog` 進行 Gmail auth 和訊息串接。
- WhatsApp：QR 登入、重新識別、訊息傳遞、媒體、反應。
- Telegram：群組提及閘控、指令、可用時的反應。
- Matrix：加密聊天室、thread 或回覆關係、重啟後續接。

每種傳輸都應有一個低成本的 smoke 情境，以及一個或多個錯誤類別情境。
昂貴的視覺情境應保持為選擇性啟用。

## 未決問題

- 重用現有 Mantis bot 時，哪個 Discord bot 應作為驅動程式，哪個應作為 SUT？
- 觀察者瀏覽器登入在第一階段應使用真人 Discord 帳號、測試帳號，
  還是只使用 bot 可讀的 REST 證據？
- GitHub 應該為 PR 保留 Mantis 成品多久？
- ClawSweeper 應在何時自動建議 Mantis，而不是等待維護者指令？
- 公開 PR 上傳前，螢幕截圖是否應遮蔽或裁切？
