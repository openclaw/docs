---
read_when:
    - 針對 OpenClaw 錯誤建置或執行即時視覺 QA
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取權的 QA 執行
summary: Mantis 是一套視覺化端到端驗證系統，用於在即時傳輸通道上重現 OpenClaw 錯誤、擷取前後證據，並將成品附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-05-06T09:06:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端對端驗證系統，適用於需要真實執行環境、真實傳輸，以及可見證明的錯誤。它會針對已知有問題的 ref 執行情境、擷取證據，針對候選 ref 執行相同情境，並將比較結果發布為成品，讓維護者可以從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供了高價值的第一條通道：真實機器人驗證、真實 guild 頻道、反應、討論串、原生命令，以及人類可以視覺確認傳輸內容的瀏覽器 UI。

## 目標

- 從 GitHub issue 或 PR 重現錯誤，並使用與使用者所見相同的傳輸形態。
- 在套用修正前，於基準 ref 擷取 **before** 成品。
- 在套用修正後，於候選 ref 擷取 **after** 成品。
- 盡可能使用確定性的判定器，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當錯誤具有可見 UI 表面時擷取截圖。
- 從代理可控制的 CLI 在本機執行，並從 GitHub 遠端執行。
- 保留足夠的機器狀態，讓登入、瀏覽器自動化或供應商驗證卡住時可以透過 VNC 救援。
- 當執行受阻、需要手動 VNC 協助，或完成時，將精簡狀態發布到操作員 Discord 頻道。

## 非目標

- Mantis 不是單元測試的替代品。理解修正後，Mantis 執行通常應轉化為較小的回歸測試。
- Mantis 不是一般快速 CI gate。它較慢、使用即時憑證，並保留給即時環境很重要的錯誤。
- Mantis 不應要求人類進行一般操作。手動 VNC 是救援路徑，不是順利路徑。
- Mantis 不會在成品、日誌、截圖、Markdown 報告或 PR 留言中儲存原始秘密。

## 歸屬

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有情境執行環境、傳輸配接器、證據 schema，以及 `pnpm openclaw qa mantis` 下的本機 CLI。
- QA Lab 擁有即時傳輸 harness 組件、瀏覽器擷取輔助工具，以及成品寫入器。
- Crabbox 在需要遠端 VM 時擁有已暖機的 Linux 機器。
- GitHub Actions 擁有遠端 workflow 進入點與成品保留。
- ClawSweeper 擁有 GitHub 留言路由：解析維護者命令、派送 workflow，以及發布最終 PR 留言。
- 當情境需要代理式設定、偵錯或卡住狀態回報時，OpenClaw 代理會透過 Codex 驅動 Mantis。

這個邊界讓傳輸知識留在 OpenClaw、機器排程留在 Crabbox，並讓維護者 workflow 黏合邏輯留在 ClawSweeper。

## 命令形式

第一個本機命令會驗證 Discord 機器人、guild、頻道、訊息傳送、反應傳送，以及成品路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機 before 和 after runner 接受此形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 會在輸出目錄下建立分離的基準與候選 worktree、安裝相依項、建置每個 ref、使用 `--allow-failures` 執行情境，然後寫入 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。對第一個 Discord 情境而言，成功的驗證表示基準狀態是 `fail`，候選狀態是 `pass`。

第二個 Discord before/after 探測以討論串附件為目標：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

該情境會使用 driver bot 發布父訊息、建立真實 Discord 討論串，使用 repo-local `filePath` 呼叫 OpenClaw 的 `message.thread-reply` 動作，然後輪詢討論串以尋找 SUT 回覆與附件檔名。基準截圖會顯示沒有附件的回覆；候選截圖會顯示預期的 `mantis-thread-report.md` 附件。

第一個 VM/瀏覽器 primitive 是桌面煙霧測試：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox 桌面機器，在 VNC 工作階段內啟動可見瀏覽器，擷取桌面，將成品拉回本機輸出目錄，並將重新連線命令寫入報告。此命令預設使用 Hetzner 供應商，因為它是 Mantis 通道中第一個具備可用桌面/VNC 覆蓋的供應商。針對另一個 Crabbox fleet 執行時，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

有用的桌面煙霧測試旗標：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用已暖機的桌面。
- `--browser-url <url>` 會變更可見瀏覽器開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中轉譯 repo-local HTML 成品。Mantis 使用此功能透過真實 Crabbox 桌面擷取產生的 Discord 狀態反應時間軸。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome user-data-dir，讓持久 Mantis 桌面可在多次執行之間保持登入。將此用於長期存在的 Discord Web 檢視器 profile。
- `--browser-profile-archive-env <name>` 會在啟動瀏覽器前，從指定的環境變數還原 base64 `.tgz` Chrome user-data-dir 封存。將此用於已登入的見證者，例如 Discord Web。預設 env var 是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 擷取長度。對於需要時間穩定的慢速已登入 Web app，請使用較長的持續時間。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的 lease 保持開啟，以供 VNC 檢查。失敗的執行在建立了 lease 時預設會保留 lease，讓操作員可以重新連線。
- `--class`、`--idle-timeout` 和 `--ttl` 會調整機器大小與 lease 存活時間。

對於 Discord Web 證據，Mantis 使用專用檢視器帳號，而不是機器人 token。即時 Discord API 情境仍是判定器：它會建立真實討論串、傳送 SUT `thread-reply`，並透過 Discord REST 檢查附件。設定 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，情境也會寫入 Discord Web URL 成品。設定 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 時，它會讓該討論串保留足夠長的時間，供已登入的瀏覽器開啟並錄製。

GitHub workflow 會在 Discord Web 中開啟候選討論串 URL、擷取截圖、錄製 MP4，並在 Crabbox 媒體工具可用時產生裁剪過的 GIF 預覽。建議使用透過 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 設定的持久檢視器 profile 路徑，因為完整 Chrome profile 封存可能超過 GitHub 的 secret 大小限制。對於小型/bootstrap profile，workflow 也可以從 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原 base64 `.tgz` 封存。若兩種 profile 來源都未設定，workflow 仍會發布確定性的基準/候選附件截圖，並記錄一則通知，說明已略過已登入的 Discord Web 見證者。

第一個完整桌面傳輸 primitive 是 Slack 桌面煙霧測試：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會租用或重用 Crabbox 桌面機器、將目前 checkout 同步到 VM、在該 VM 內執行 `pnpm openclaw qa slack`、在 VNC 瀏覽器中開啟 Slack Web、擷取可見桌面，並將 Slack QA 成品與 VNC 截圖複製回本機輸出目錄。這是第一種 Mantis 形式，其中 SUT OpenClaw Gateway 與瀏覽器都位於同一台 Linux 桌面 VM 內。

使用 `--gateway-setup` 時，命令會在 `$HOME/.openclaw-mantis/slack-openclaw` 準備持久的一次性 OpenClaw home、為所選頻道修補 Slack Socket Mode 設定、在連接埠 `38973` 上啟動 `openclaw gateway run`，並讓 Chrome 在 VNC 工作階段中持續執行。這是「留給我一個已執行 Slack 和 claw 的 Linux 桌面」模式；當省略 `--gateway-setup` 時，bot-to-bot Slack QA 通道仍是預設。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型通道的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本機只設定了 `OPENAI_API_KEY`，Mantis 會在叫用 Crabbox 前將其映射到 `OPENCLAW_LIVE_OPENAI_KEY`，讓 Crabbox 的 `OPENCLAW_*` env 轉送可以將它帶入 VM。

使用 `--gateway-setup --credential-source convex` 時，Mantis 會先從共享 pool 租用 Slack SUT 憑證，再建立 VM，並將租用的頻道 id、Socket Mode app token 和 bot token 作為桌面內的 `OPENCLAW_MANTIS_SLACK_*` 執行環境 env 轉送。這讓 GitHub workflow 維持精簡：它們只需要 Convex broker secret，而不需要原始 Slack bot 或 app token。

有用的 Slack 桌面旗標：

- `--lease-id <cbx_...>` 會針對操作員已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久 OpenClaw Slack Gateway，而不是只執行 bot-to-bot QA 通道。
- `--keep-lease` 會在成功後讓 Gateway VM 保持開啟以供 VNC 檢查；`--no-keep-lease` 會在收集成品後停止它。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未提供，Mantis 會在 SUT bot token 可用時，從 Slack `auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway 設定使用的 Slack 頻道 allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久 Chrome profile。預設是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入可在同一 lease 上的重新執行中保留。
- `--credential-source convex --credential-role ci` 使用共享憑證 pool，而不是直接 Slack env token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 會傳遞到 Slack 即時通道。

GitHub 煙霧測試 workflow 是 `Mantis Discord Smoke`。第一個真實情境的 before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現 queued-only 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout workflow harness ref、建置分離的基準與候選 worktree，針對每個 worktree 執行 `discord-status-reactions-tool-only`，並將 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作為 Actions 成品上傳。它也會在 Crabbox 桌面瀏覽器中轉譯每條通道的時間軸 HTML，並在 PR 留言中將那些 VNC 截圖發布於確定性時間軸 PNG 旁。相同 PR 留言會嵌入由 `crabbox media preview` 產生的輕量 motion-trimmed GIF 預覽、連結到相符的 motion-trimmed MP4 片段，並保留完整桌面 MP4 檔案以供深入檢查。截圖會維持行內顯示，以利快速審查。workflow 會從 `openclaw/crabbox` main 建置 Crabbox CLI，讓它能在下一個 Crabbox binary release cut 之前使用目前的桌面/瀏覽器 lease 旗標。

`Mantis Scenario` 是通用手動進入點。它接受 `scenario_id`、`candidate_ref`、選用的 `baseline_ref`，以及選用的 `pr_number`，然後派送情境擁有的 workflow。此 wrapper 刻意保持精簡：情境 workflow 仍擁有自己的傳輸設定、憑證、VM class、預期判定器，以及成品 manifest。

`Mantis Slack Desktop Smoke` 是第一個 Slack VM 工作流程。它會在獨立 worktree 中簽出受信任的候選 ref、租用 Crabbox Linux 桌面、針對該候選版本執行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`、在 VNC 瀏覽器中開啟 Slack Web、錄製桌面、使用 `crabbox media preview` 產生經動作裁切的預覽、上傳完整 artifact 目錄，並可選擇在目標 PR 上發布行內證據留言。它預設使用 AWS 進行桌面租用，並公開手動 provider 輸入，讓操作員在 AWS 容量緩慢或無法使用時切換到 Hetzner。當你想要「一個執行 Slack 和一個 claw 的 Linux 桌面」，而不只是 bot 對 bot 的 Slack transcript 時，請使用這個 lane。

每個 PR 發布情境都會在報告旁邊寫入 `mantis-evidence.json`。此 schema 是情境程式碼與 GitHub 留言之間的交接格式：

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

Artifact `path` 值是相對於 manifest 目錄。`targetPath` 值是 `qa-artifacts` 分支發布目錄底下的相對路徑。發布器會拒絕路徑遍歷，並在選用預覽或影片無法使用時略過標示為 `"required": false` 的項目。

支援的 artifact 種類：

- `timeline`：確定性的情境螢幕截圖，通常是之前/之後。
- `desktopScreenshot`：VNC/瀏覽器桌面螢幕截圖。
- `motionPreview`：從桌面錄影產生的行內動畫 GIF。
- `motionClip`：移除靜態開頭與結尾、經動作裁切的 MP4。
- `fullVideo`：供深入檢查使用的完整 MP4 錄影。
- `metadata`：JSON/log sidecar。
- `report`：Markdown 報告。

可重複使用的發布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流程會以 manifest、目標 PR、`qa-artifacts` 目標根目錄、留言標記、Actions artifact URL、執行 URL 和請求來源呼叫它。它會將宣告的 artifact 複製到 `qa-artifacts` 分支，建立以摘要優先的 PR 留言，包含行內圖片/預覽與連結影片，然後更新現有標記留言或建立新留言。

你也可以直接從 PR 留言觸發 status-reactions 執行：

```text
@Mantis discord status reactions
```

留言觸發器刻意保持範圍狹窄。它只會在具有 write、maintain 或 admin 存取權的使用者於 pull request 上留言時執行，且只辨識 Discord status-reaction 請求。預設情況下，它會使用已知的不良 baseline ref，並以目前 PR head SHA 作為候選版本。維護者可以覆寫任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令明確且聚焦於情境。第二個命令之後可以根據標籤、變更檔案和 ClawSweeper review 發現，將 PR 或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 在情境需要 UI 證據時準備桌面/瀏覽器 profile。
4. 為 baseline ref 準備乾淨的 checkout。
5. 安裝依賴項，並只建置情境所需內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定 live transport、provider、model 和瀏覽器 profile。
8. 執行情境並擷取 baseline 證據。
9. 停止 gateway 並保留 log。
10. 在同一個 VM 中準備 candidate ref。
11. 執行相同情境並擷取 candidate 證據。
12. 比較 oracle 結果與視覺證據。
13. 寫入 Markdown、JSON、log、螢幕截圖和選用 trace artifact。
14. 上傳 GitHub Actions artifact。
15. 發布簡潔的 PR 或 Discord 狀態訊息。

情境應該能以兩種不同方式失敗：

- **Bug reproduced**：baseline 以預期方式失敗。
- **Harness failure**：環境設定、憑證、Discord API、瀏覽器或 provider 在 bug oracle 具有意義之前失敗。

最終報告必須區分這些情況，讓維護者不會把不穩定環境與產品行為混淆。

## Discord MVP

第一個情境應該以 guild channel 中的 Discord status reactions 為目標，其中來源回覆 delivery mode 是 `message_tool_only`。

它是良好 Mantis 種子的原因：

- 它在 Discord 中會以觸發訊息上的 reaction 顯示。
- 它透過 Discord message reaction state 具有強力的 REST oracle。
- 它會測試真實的 OpenClaw Gateway、Discord bot auth、message dispatch、source reply delivery mode、status reaction state 和 model turn lifecycle。
- 它的範圍夠窄，能讓第一個實作保持可靠。

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

Baseline 證據應顯示 queued acknowledgement reaction，但在 tool-only mode 中沒有 lifecycle transition。Candidate 證據應顯示在 `messages.statusReactions.enabled` 明確為 true 時，lifecycle status reactions 正在執行。

可執行的第一個切片是 opt-in Discord live QA 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會使用 always-on guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和明確的 status reactions 設定 SUT。Oracle 會輪詢真實 Discord 觸發訊息，並預期觀察到序列 `👀 -> 🤔 -> 👍`。Artifacts 包含 `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html` 和 `discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 組件

Mantis 應建立在現有私有 QA stack 之上，而不是從零開始：

- `pnpm openclaw qa discord` 已經使用 driver 和 SUT bots 執行 live Discord lane。
- Live transport runner 已經在 `.artifacts/qa-e2e/` 底下寫入報告與 observed-message artifacts。
- Convex credential leases 已經提供對共享 live transport credentials 的獨占存取。
- Browser control service 已經支援 screenshots、snapshots、headless managed profiles 和 remote CDP profiles。
- QA Lab 已經有 debugger UI 和 bus，可用於 transport-shaped testing。

第一個 Mantis 實作可以是在這些組件上加上一個薄的 before/after runner，再加上一層視覺證據。

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

`mantis-summary.json` 應該是機器可讀的事實來源。Markdown 報告用於 PR 留言和人工 review。

摘要必須包含：

- 測試的 refs 和 SHAs
- transport 和 scenario id
- machine provider 和 machine id 或 lease id
- 不含 secret values 的 credential source
- baseline 結果
- candidate 結果
- bug 是否在 baseline 上重現
- candidate 是否修復它
- artifact paths
- 已清理的 setup 或 cleanup issues

螢幕截圖是證據，不是 secrets。它們仍然需要遵守遮蔽紀律：private channel names、user names 或 message content 可能會出現。對於 public PRs，在遮蔽方案更成熟之前，優先使用 GitHub Actions artifact links，而不是行內圖片。

## 瀏覽器與 VNC

瀏覽器 lane 有兩種模式：

- **Headless automation**：CI 預設。Chrome 會以 CDP 啟用執行，且 Playwright 或 OpenClaw browser control 會擷取螢幕截圖。
- **VNC rescue**：當 login、MFA、Discord anti-automation 或視覺偵錯需要人類介入時，在同一個 VM 上啟用。

Discord observer browser profile 應該足夠持久，以避免每次執行都要登入，但要與個人瀏覽器狀態隔離。Profile 屬於 Mantis machine pool，而不是開發者 laptop。

當 Mantis 卡住時，它會發布 Discord 狀態訊息，內容包含：

- run id
- scenario id
- machine provider
- artifact directory
- 如果可用，提供 VNC 或 noVNC connection instructions
- 簡短 blocker text

第一個私有部署可以將這些訊息發布到現有 operator channel，之後再移至專用 Mantis channel。

## 機器

Mantis 第一個遠端實作應優先透過 Crabbox 使用 AWS。Crabbox 提供已暖機的 machines、lease tracking、hydration、logs、results 和 cleanup。如果 AWS 容量太慢或無法使用，請在相同 machine interface 後方加入 Hetzner provider。

最低 VM 需求：

- 安裝了支援桌面的 Chrome 或 Chromium 的 Linux
- 用於瀏覽器 automation 的 CDP access
- 用於 rescue 的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和 dependency cache
- 使用 Playwright 時的 Playwright Chromium browser cache
- 足夠的 CPU 和記憶體，可執行一個 OpenClaw Gateway、一個瀏覽器和一次 model run
- 可對外存取 Discord、GitHub、model providers 和 credential broker

VM 不應在預期的 credential 或 browser profile stores 之外保留長期 raw secrets。

## Secrets

Secrets 會存放在 GitHub organization 或 repository secrets 中供遠端執行使用，並存放在本機 operator 控制的 secret file 中供本機執行使用。

建議的 secret names：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用於 public GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期而言，Convex credential pool 應維持作為 live transport credentials 的一般來源。GitHub secrets 會 bootstrap broker 和 fallback lanes。Discord status-reactions workflow 會將 Mantis Crabbox secrets 對應回 Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` environment variables。純 `CRABBOX_*` GitHub secret names 仍會作為相容 fallback 被接受。

Mantis runner 絕不能列印：

- Discord bot tokens
- provider API keys
- browser cookies
- auth profile contents
- VNC passwords
- raw credential payloads

Public artifact uploads 也應遮蔽 Discord target metadata，例如 bot、guild、channel 和 message ids。GitHub smoke workflow 因此啟用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 意外貼到 issue、PR、chat 或 log 中，請在新 secret 儲存完成後輪換它。

## GitHub artifacts 和 PR comments

Mantis 工作流程應將完整證據套件上傳為短期保存的 Actions 成品。當工作流程針對錯誤回報或修正 PR 執行時，也應將經遮蔽的 PNG 螢幕截圖發布到 `qa-artifacts` 分支，並在該錯誤或修正 PR 上插入或更新一則留言，內嵌修正前/後的螢幕截圖。不要只把主要證明發布到一般 QA 自動化 PR。原始記錄、觀察到的訊息，以及其他大量證據保留在 Actions 成品中。

Production 工作流程應使用 Mantis GitHub App 發布這些留言，而不是使用 `github-actions[bot]`。將 App ID 和私鑰儲存為 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets。工作流程會使用隱藏標記作為插入或更新鍵，當權杖可以編輯該留言時更新該留言，並在較舊的 bot 擁有標記無法編輯時建立新的 Mantis 擁有留言。

PR 留言應簡短且以視覺為主：

```md
Mantis Discord 狀態反應 QA

摘要：Mantis 針對已知不良基準線和候選修正，重新執行已回報的 Discord 狀態反應錯誤。基準線重現了錯誤，而候選修正顯示了預期的 queued -> thinking -> done 序列。

- 情境：`discord-status-reactions-tool-only`
- 執行：<workflow run link>
- 成品：<artifact link>
- 基準線：`<status>` 於 `<sha>`
- 候選：`<status>` 於 `<sha>`

| 基準線              | 候選                |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

當執行因測試框架失敗而失敗時，留言必須說明此情況，而不是暗示候選修正失敗。

## 私有部署備註

私有部署可能已經有 Mantis Discord 應用程式。當該應用程式具備正確的 bot 權限且可以安全輪替時，請重複使用該應用程式，而不是建立另一個 App。

透過 secrets 或部署設定來設定初始操作員通知頻道。它可以先指向現有的維護者或營運頻道，之後在專用 Mantis 頻道存在後再移動到該頻道。

不要將 guild ID、channel ID、bot token、瀏覽器 Cookie 或 VNC 密碼放入此文件。將它們儲存在 GitHub secrets、憑證代理程式或操作員的本機祕密儲存區中。

## 新增情境

Mantis 情境應宣告：

- ID 和標題
- 傳輸
- 必要憑證
- 基準線 ref 政策
- 候選 ref 政策
- OpenClaw 設定修補
- 設定步驟
- 刺激
- 預期基準線判定器
- 預期候選判定器
- 視覺擷取目標
- 逾時預算
- 清理步驟

情境應偏好小型、具型別的判定器：

- 反應錯誤的 Discord 反應狀態
- 串接錯誤的 Discord 訊息參照
- Slack 錯誤的 Slack thread ts 和反應 API 狀態
- 電子郵件錯誤的電子郵件訊息 ID 和標頭
- 當 UI 是唯一可靠可觀察項目時使用瀏覽器螢幕截圖

視覺檢查應作為附加項目。如果平台 API 可以證明錯誤，請使用 API 作為通過/失敗判定器，並保留螢幕截圖以增加人工信心。

## Provider 擴充

在 Discord 之後，同一個執行器可以新增：

- Slack：反應、串接、App 提及、互動視窗、檔案上傳。
- 電子郵件：在連接器不足時，使用 `gog` 進行 Gmail 驗證和訊息串接。
- WhatsApp：QR 登入、重新識別、訊息傳遞、媒體、反應。
- Telegram：群組提及閘控、命令、可用時的反應。
- Matrix：加密房間、串接或回覆關係、重新啟動後恢復。

每種傳輸都應有一個低成本煙霧測試情境，以及一個或多個錯誤類別情境。昂貴的視覺情境應保持為選擇性啟用。

## 未解問題

- 重複使用現有 Mantis bot 時，哪個 Discord bot 應作為驅動程式，哪個應作為 SUT？
- 觀察者瀏覽器登入在第一階段應使用真人 Discord 帳號、測試帳號，還是只使用 bot 可讀的 REST 證據？
- GitHub 應為 PR 保留 Mantis 成品多久？
- ClawSweeper 何時應自動建議 Mantis，而不是等待維護者命令？
- 公開 PR 的螢幕截圖上傳前是否應遮蔽或裁剪？
