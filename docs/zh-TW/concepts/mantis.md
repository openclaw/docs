---
read_when:
    - 建置或執行 OpenClaw 錯誤的即時視覺品質保證
    - 新增拉取請求的前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行作業
summary: Mantis 是一套視覺化端對端驗證系統，用於在即時傳輸通道上重現 OpenClaw 錯誤、擷取修正前後證據，並將成品附加到提取請求。
title: 螳螂
x-i18n:
    generated_at: "2026-05-05T08:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端到端驗證系統，適用於需要真實
runtime、真實傳輸，以及可見證據的 bug。它會針對已知
有問題的 ref 執行情境、擷取證據，再針對候選 ref 執行相同情境，並將
比較結果發布為 artifacts，讓維護者能從 PR 或
本機指令檢查。

Mantis 從 Discord 開始，因為 Discord 提供高價值的第一條驗證線：
真實 bot 驗證、真實 guild channels、reactions、threads、原生命令，以及
讓人類能以視覺確認傳輸顯示內容的 browser UI。

## 目標

- 使用者所見的相同傳輸形態，重現 GitHub issue 或 PR 中的 bug。
- 在套用修正前，於 baseline ref 擷取 **before** artifact。
- 在套用修正後，於 candidate ref 擷取 **after** artifact。
- 盡可能使用確定性的 oracle，例如 Discord REST reaction
  讀取或 channel transcript 檢查。
- 當 bug 有可見 UI 表面時擷取 screenshots。
- 從 agent 控制的 CLI 本機執行，並從 GitHub 遠端執行。
- 保留足夠的機器狀態，以便在 login、browser automation 或
  provider auth 卡住時進行 VNC rescue。
- 當執行被阻擋、需要手動 VNC 協助，或完成時，向 operator Discord channel
  發布精簡狀態。

## 非目標

- Mantis 不是 unit tests 的替代品。Mantis 執行通常應在理解修正後
  轉化為較小的 regression test。
- Mantis 不是一般快速 CI gate。它較慢、使用 live credentials，且
  保留給 live environment 確實重要的 bug。
- Mantis 正常運作不應需要人類介入。手動 VNC 是 rescue
  path，不是 happy path。
- Mantis 不會在 artifacts、logs、screenshots、Markdown
  reports 或 PR comments 中儲存 raw secrets。

## 所有權

Mantis 位於 OpenClaw QA stack。

- OpenClaw 擁有 scenario runtime、transport adapters、evidence schema，以及
  `pnpm openclaw qa mantis` 下的 local CLI。
- QA Lab 擁有 live transport harness pieces、browser capture helpers，以及
  artifact writers。
- Crabbox 在需要 remote VM 時擁有 warmed Linux machines。
- GitHub Actions 擁有 remote workflow entrypoint 和 artifact retention。
- ClawSweeper 擁有 GitHub comment routing：解析 maintainer commands、
  dispatch workflow，以及發布最終 PR comment。
- 當 scenario 需要 agentic setup、debugging 或 stuck-state reporting 時，
  OpenClaw agents 會透過 Codex 驅動 Mantis。

這個邊界讓 transport knowledge 保持在 OpenClaw、machine scheduling 保持在
Crabbox，而 maintainer workflow glue 保持在 ClawSweeper。

## 指令形式

第一個 local command 會驗證 Discord bot、guild、channel、message send、
reaction send，以及 artifact path：

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

runner 會在 output directory 下建立 detached baseline 和 candidate worktrees，
安裝 dependencies、建置每個 ref，使用
`--allow-failures` 執行 scenario，然後寫入 `baseline/`、`candidate/`、`comparison.json`
以及 `mantis-report.md`。對第一個 Discord scenario 而言，成功驗證
表示 baseline status 為 `fail`，candidate status 為 `pass`。

第一個 VM/browser primitive 是 desktop smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會 lease 或重用 Crabbox desktop machine，在 VNC session 內啟動可見 browser，
擷取 desktop，將 artifacts 拉回本機 output
directory，並把 reconnect command 寫入 report。此指令預設使用
Hetzner provider，因為它是 Mantis lane 中第一個具備可用 desktop/VNC
coverage 的 provider。對其他 Crabbox fleet 執行時，可用 `--provider`、`--crabbox-bin` 或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的 desktop smoke flags：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用 warmed desktop。
- `--browser-url <url>` 會變更 visible browser 開啟的頁面。
- `--html-file <path>` 會在 visible browser 中 render repo-local HTML artifact。Mantis 使用它透過真實 Crabbox desktop 擷取產生的 Discord status-reaction timeline。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的 lease 保持開啟，以便 VNC inspection。失敗的執行在建立 lease 時預設會保留 lease，讓 operator 可以重新連線。
- `--class`、`--idle-timeout` 和 `--ttl` 會調整 machine size 和 lease lifetime。

第一個完整 desktop transport primitive 是 Slack desktop smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會 lease 或重用 Crabbox desktop machine、將目前 checkout sync 到
VM、在該 VM 內執行 `pnpm openclaw qa slack`、於 VNC
browser 中開啟 Slack Web、擷取 visible desktop，並將 Slack QA artifacts 與
VNC screenshot 複製回本機 output directory。這是第一個 Mantis
形式，其中 SUT OpenClaw gateway 和 browser 都位於同一個
Linux desktop VM 內。

使用 `--gateway-setup` 時，此指令會準備 persistent disposable OpenClaw
home 於 `$HOME/.openclaw-mantis/slack-openclaw`，為選定 channel 修補 Slack Socket Mode
configuration，在 port
`38973` 啟動 `openclaw gateway run`，並讓 Chrome 保持在 VNC session 中執行。這是「留給我一個
有 Slack 和 claw 正在執行的 Linux desktop」模式；省略 `--gateway-setup` 時，
bot-to-bot Slack QA lane 仍為預設。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- remote model lane 的 `OPENCLAW_LIVE_OPENAI_KEY`。若本機只設定
  `OPENAI_API_KEY`，Mantis 會在 invoking Crabbox 前將它映射為 `OPENCLAW_LIVE_OPENAI_KEY`，
  讓 Crabbox 的 `OPENCLAW_*` env forwarding 能將它帶入
  VM。

實用的 Slack desktop flags：

- `--lease-id <cbx_...>` 會針對 operator 已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動 persistent OpenClaw Slack gateway，而不是只執行 bot-to-bot QA lane。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未提供，當 SUT bot token 可用時，Mantis 會從 Slack `auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 gateway setup 使用的 Slack channel allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的 persistent Chrome profile。預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web login 會在同一 lease 的 reruns 中保留。
- `--credential-source convex --credential-role ci` 使用 shared credential pool，而不是直接 Slack env tokens。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 會傳遞給 Slack live lane。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一個真實 scenario 的 before 和 after GitHub
workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期可重現 queued-only behavior 的 ref。
- `candidate_ref`：預期顯示 `queued -> thinking -> done` 的 ref。

它會 checkout workflow harness ref、建置獨立的 baseline 和 candidate
worktrees、針對每個 worktree 執行 `discord-status-reactions-tool-only`，並
將 `baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 作為
Actions artifacts 上傳。它也會在 Crabbox
desktop browser 中 render 每個 lane 的 timeline HTML，並在 PR comment 中將這些 VNC screenshots 與 deterministic
timeline PNGs 一併發布。同一個 PR comment 會嵌入由 `crabbox media preview` 產生的 lightweight
motion-trimmed GIF previews，連結到相符的 motion-trimmed MP4 clips，並保留完整 desktop MP4 files 供深入
inspection。Screenshots 會保持 inline 以便快速 review。workflow 會從
`openclaw/crabbox` main 建置
Crabbox CLI，讓它能在下一個 Crabbox binary release cut 之前使用目前的 desktop/browser lease flags。

`Mantis Scenario` 是 generic manual entrypoint。它接受 `scenario_id`、
`candidate_ref`、optional `baseline_ref` 和 optional `pr_number`，然後
dispatches scenario-owned workflow。wrapper 刻意保持精簡：
scenario workflows 仍擁有自己的 transport setup、credentials、VM class、
expected oracle，以及 artifact manifest。

`Mantis Slack Desktop Smoke` 是第一個 Slack VM workflow。它會在獨立 worktree 中 checkout
trusted candidate ref、lease Crabbox Linux desktop、
針對該 candidate 執行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`、
在 VNC browser 中開啟 Slack Web、record desktop、使用 `crabbox media preview` 產生
motion-trimmed preview、上傳完整 artifact
directory，並可選擇性地在目標 PR 上發布 inline evidence comment。
當你想要「有 Slack 和 claw 正在執行的 Linux desktop」而不只是
bot-to-bot Slack transcript 時，請使用此 lane。

每個 PR-publishing scenario 都會在 report 旁寫入 `mantis-evidence.json`。
此 schema 是 scenario code 與 GitHub comments 之間的 handoff：

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

Artifact `path` values 相對於 manifest directory。`targetPath`
values 是 `qa-artifacts` branch publish directory 下的 relative paths。
publisher 會拒絕 path traversal，並在 optional previews 或 videos 不可用時，略過標記為
`"required": false` 的 entries。

支援的 artifact kinds：

- `timeline`：deterministic scenario screenshot，通常是 before/after。
- `desktopScreenshot`：VNC/browser desktop screenshot。
- `motionPreview`：從 desktop recording 產生的 inline animated GIF。
- `motionClip`：移除 static lead-in 和 tail 的 motion-trimmed MP4。
- `fullVideo`：供深入 inspection 的完整 MP4 recording。
- `metadata`：JSON/log sidecar。
- `report`：Markdown report。

reusable publisher 是 `scripts/mantis/publish-pr-evidence.mjs`。Workflows
會以 manifest、target PR、`qa-artifacts` target root、comment marker、
Actions artifact URL、run URL，以及 request source 呼叫它。它會將宣告的 artifacts
複製到 `qa-artifacts` branch、建立 summary-first PR comment，其中包含 inline
images/previews 和 linked videos，然後更新現有 marker comment 或
建立新的 comment。

你也可以直接從 PR comment 觸發 status-reactions run：

```text
@Mantis discord status reactions
```

comment trigger 刻意保持 narrow。它只會在具有 write、maintain 或 admin access 的使用者所發出的 pull request
comments 上執行，且只辨識
Discord status-reaction requests。預設會使用 known bad baseline ref
和目前 PR head SHA 作為 candidate。Maintainers 可以覆寫任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 指令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令是明確且聚焦於情境的。第二個稍後可以根據標籤、變更的檔案與
ClawSweeper 審查發現，將 PR 或議題對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 當情境需要 UI 證據時，準備桌面/瀏覽器設定檔。
4. 為基準參照準備乾淨的 checkout。
5. 安裝相依性，並只建置情境需要的部分。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定即時傳輸、提供者、模型與瀏覽器設定檔。
8. 執行情境並擷取基準證據。
9. 停止 Gateway 並保留記錄。
10. 在同一台 VM 中準備候選參照。
11. 執行相同情境並擷取候選證據。
12. 比較判準結果與視覺證據。
13. 寫入 Markdown、JSON、記錄、截圖與選用的追蹤成品。
14. 上傳 GitHub Actions 成品。
15. 發布精簡的 PR 或 Discord 狀態訊息。

情境應該能以兩種不同方式失敗：

- **重現錯誤**：基準以預期方式失敗。
- **測試框架失敗**：在錯誤判準有意義之前，環境設定、憑證、Discord API、瀏覽器或
  提供者失敗。

最終報告必須區分這些情況，避免維護者將不穩定的環境與產品行為混淆。

## Discord 最小可行產品

第一個情境應該鎖定公會頻道中的 Discord 狀態反應，其中來源回覆傳遞模式為 `message_tool_only`。

為什麼它是良好的 Mantis 起點：

- 它會以觸發訊息上的反應形式顯示在 Discord 中。
- 它透過 Discord 訊息反應狀態具備強判準的 REST 驗證。
- 它會測試真實的 OpenClaw Gateway、Discord 機器人驗證、訊息派送、
  來源回覆傳遞模式、狀態反應狀態與模型回合生命週期。
- 它足夠狹窄，能讓第一個實作保持準確。

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

基準證據應顯示已排隊的確認反應，但在僅工具模式中沒有生命週期轉換。候選證據應顯示當 `messages.statusReactions.enabled` 明確為
true 時，生命週期狀態反應正在執行。

第一個可執行切片是選擇啟用的 Discord 即時品質保證情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會以一律啟用的公會處理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 與明確的狀態反應來設定被測系統。判準會輪詢真實的 Discord 觸發訊息，並預期觀察到的序列為
`👀 -> 🤔 -> 👍`。成品包括 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 與
`discord-status-reactions-tool-only-timeline.png`。

## 既有品質保證組件

Mantis 應建基於既有的私有品質保證堆疊，而不是從零開始：

- `pnpm openclaw qa discord` 已經使用驅動程式與被測系統機器人執行即時 Discord 路徑。
- 即時傳輸執行器已經會在 `.artifacts/qa-e2e/` 下寫入報告與觀察到的訊息成品。
- Convex 憑證租約已經提供共享即時傳輸憑證的獨占存取。
- 瀏覽器控制服務已經支援截圖、快照、無頭受管理設定檔與遠端 CDP 設定檔。
- 品質保證實驗室已經有用於傳輸形狀測試的偵錯 UI 與匯流排。

第一個 Mantis 實作可以是在這些組件之上的精簡前後對照執行器，再加上一層視覺證據。

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

`mantis-summary.json` 應該是機器可讀的事實來源。Markdown 報告用於 PR 評論與人工審查。

摘要必須包含：

- 測試的參照與 SHA
- 傳輸與情境 ID
- 機器提供者與機器 ID 或租約 ID
- 不含秘密值的憑證來源
- 基準結果
- 候選結果
- 錯誤是否在基準上重現
- 候選是否修復它
- 成品路徑
- 已清理的設定或清理問題

截圖是證據，不是秘密。它們仍然需要遵守修訂紀律：
可能會出現私人頻道名稱、使用者名稱或訊息內容。對於公開 PR，
在修訂流程更完善之前，偏好使用 GitHub Actions 成品連結，而不是行內圖片。

## 瀏覽器與 VNC

瀏覽器路徑有兩種模式：

- **無頭自動化**：CI 的預設值。Chrome 以啟用 CDP 的方式執行，且
  Playwright 或 OpenClaw 瀏覽器控制會擷取截圖。
- **VNC 救援**：當登入、MFA、Discord 反自動化或視覺偵錯需要人工介入時，在同一台 VM 上啟用。

Discord 觀察者瀏覽器設定檔應足夠持久，以避免每次執行都要登入，
但需與個人瀏覽器狀態隔離。設定檔屬於 Mantis 機器池，而不是開發者筆電。

當 Mantis 卡住時，它會發布 Discord 狀態訊息，包含：

- 執行 ID
- 情境 ID
- 機器提供者
- 成品目錄
- 可用時的 VNC 或 noVNC 連線指示
- 簡短的阻礙文字

第一個私有部署可以將這些訊息發布到既有的操作員頻道，之後再移至專用的 Mantis 頻道。

## 機器

Mantis 的第一個遠端實作應優先透過 Crabbox 使用 AWS。
Crabbox 提供已預熱的機器、租約追蹤、環境補齊、記錄、結果與清理。
如果 AWS 容量太慢或無法使用，請在相同的機器介面後方加入 Hetzner 提供者。

最低 VM 需求：

- Linux，並安裝可支援桌面的 Chrome 或 Chromium
- 用於瀏覽器自動化的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 與 pnpm
- OpenClaw checkout 與相依性快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足夠的 CPU 與記憶體，可支援一個 OpenClaw Gateway、一個瀏覽器與一次模型執行
- 對 Discord、GitHub、模型提供者與憑證代理的輸出存取

VM 不應在預期的憑證或瀏覽器設定檔儲存區之外保留長期存在的原始秘密。

## 秘密

遠端執行的秘密位於 GitHub 組織或儲存庫秘密中，本機執行則位於由操作員控制的本機秘密檔案中。

建議的秘密名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用於公開 GitHub 成品上傳
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期而言，Convex 憑證池應繼續作為即時傳輸憑證的正常來源。
GitHub 秘密會啟動代理與備援路徑。
Discord 狀態反應工作流程會將 Mantis Crabbox 秘密對應回
Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 與 `CRABBOX_COORDINATOR_TOKEN` 環境變數。純 `CRABBOX_*` GitHub 秘密名稱仍作為相容備援接受。

Mantis 執行器絕不能列印：

- Discord 機器人權杖
- 提供者 API 金鑰
- 瀏覽器 Cookie
- 驗證設定檔內容
- VNC 密碼
- 原始憑證酬載

公開成品上傳也應修訂 Discord 目標中繼資料，例如機器人、公會、頻道與訊息 ID。GitHub 煙霧測試工作流程會因此啟用
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果權杖意外貼到議題、PR、聊天或記錄中，請在新秘密儲存後輪替它。

## GitHub 成品與 PR 評論

Mantis 工作流程應將完整證據套件上傳為短期 Actions 成品。
當工作流程針對錯誤回報或修復 PR 執行時，也應將已修訂的 PNG 截圖發布到 `qa-artifacts` 分支，並在該錯誤或修復 PR 上 upsert 一則包含行內前後對照截圖的評論。不要只把主要證明發布在通用的品質保證自動化 PR 上。原始記錄、觀察到的訊息與其他大型證據會保留在 Actions 成品中。

生產工作流程應使用 Mantis GitHub App 發布這些評論，而不是
`github-actions[bot]`。將應用程式 ID 與私密金鑰儲存為
`MANTIS_GITHUB_APP_ID` 與 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
秘密。工作流程使用隱藏標記作為 upsert 鍵，在權杖可編輯時更新該評論，並在較舊的機器人擁有標記無法編輯時，建立新的 Mantis 擁有評論。

PR 評論應簡短且視覺化：

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

當執行失敗是因為測試框架失敗時，評論必須說明這一點，而不是暗示候選失敗。

## 私有部署注意事項

私有部署可能已經有 Mantis Discord 應用程式。當該應用程式具備正確的機器人權限且能安全輪替時，請重用該應用程式，而不是建立另一個應用程式。

透過秘密或部署設定來設定初始操作員通知頻道。它可以先指向既有維護者或營運頻道，之後在專用 Mantis 頻道存在後再移過去。

不要將公會 ID、頻道 ID、機器人權杖、瀏覽器 Cookie 或 VNC 密碼放入此文件。
請將它們儲存在 GitHub 秘密、憑證代理或操作員的本機秘密儲存區中。

## 新增情境

Mantis 情境應宣告：

- ID 與標題
- 傳輸
- 必要憑證
- 基準參照政策
- 候選參照政策
- OpenClaw 設定修補
- 設定步驟
- 刺激
- 預期基準判準
- 預期候選判準
- 視覺擷取目標
- 逾時預算
- 清理步驟

情境應偏好小型、型別化的判準：

- 反應錯誤使用 Discord 反應狀態
- 串接錯誤使用 Discord 訊息參照
- Slack 錯誤使用 Slack 執行緒時間戳與反應 API 狀態
- 電子郵件錯誤使用電子郵件訊息 ID 與標頭
- 當 UI 是唯一可靠可觀察項時使用瀏覽器截圖

視覺檢查應為加法。如果平台 API 能證明錯誤，請使用
API 作為通過/失敗判準，並保留截圖供人工建立信心。

## 提供者擴充

在 Discord 之後，相同執行器可以加入：

- Slack：回應、討論串、應用程式提及、模態視窗、檔案上傳。
- 電子郵件：在連接器不足時，使用 `gog` 進行 Gmail 驗證與訊息討論串處理。
- WhatsApp：QR 登入、重新識別、訊息傳送、媒體、回應。
- Telegram：群組提及閘控、命令、可用時的回應。
- Matrix：加密聊天室、討論串或回覆關聯、重新啟動後續接。

每個傳輸都應有一個低成本的煙霧測試情境，以及一個或多個錯誤類別情境。昂貴的視覺情境應保持為選用。

## 未決問題

- 重用現有的 Mantis 機器人時，哪個 Discord 機器人應作為驅動程式，哪個應作為 SUT？
- 觀察者瀏覽器登入在第一階段應使用人類 Discord 帳號、測試帳號，還是只使用機器人可讀取的 REST 證據？
- GitHub 應為 PR 保留 Mantis 成品多久？
- ClawSweeper 何時應自動建議使用 Mantis，而不是等待維護者命令？
- 在上傳至公開 PR 前，截圖是否應先遮蔽或裁切？
