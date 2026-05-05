---
read_when:
    - 建置或執行 OpenClaw 錯誤的即時視覺 QA
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行作業
summary: Mantis 是用於在即時傳輸通道上重現 OpenClaw 錯誤、擷取修正前後證據，並將產物附加到 PR 的視覺化端對端驗證系統。
title: 螳螂
x-i18n:
    generated_at: "2026-05-05T06:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端對端驗證系統，適用於需要真實
運行時、真實傳輸，以及可見證明的錯誤。它會針對已知
有問題的 ref 執行情境、擷取證據，再針對候選 ref 執行相同情境，並將
比較結果發布為成品，讓維護者可從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供高價值的第一條驗證路徑：
真實 bot 驗證、真實 guild 頻道、反應、討論串、原生命令，以及一個
可讓人員目視確認傳輸顯示內容的瀏覽器 UI。

## 目標

- 使用使用者所見的相同傳輸形態，重現 GitHub issue 或 PR 中的錯誤。
- 在套用修正前，於基準 ref 上擷取 **before** 成品。
- 在套用修正後，於候選 ref 上擷取 **after** 成品。
- 盡可能使用確定性的判定器，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當錯誤具有可見 UI 表面時擷取螢幕截圖。
- 從代理程式控制的 CLI 在本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化，或提供者驗證卡住時，保留足夠的機器狀態以供 VNC 救援。
- 當執行被阻塞、需要手動 VNC 協助，或完成時，將精簡狀態發布到操作員 Discord 頻道。

## 非目標

- Mantis 不是單元測試的替代品。在理解修正後，Mantis 執行通常應轉成較小的迴歸測試。
- Mantis 不是一般快速 CI 閘門。它較慢、使用即時憑證，並保留給即時環境重要的錯誤。
- Mantis 的一般操作不應需要人員介入。手動 VNC 是救援路徑，而不是正常路徑。
- Mantis 不會在成品、日誌、螢幕截圖、Markdown 報告或 PR 留言中儲存原始秘密。

## 權責

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有情境運行時、傳輸配接器、證據結構描述，以及 `pnpm openclaw qa mantis` 下的本機 CLI。
- QA Lab 擁有即時傳輸測試工具組件、瀏覽器擷取輔助工具，以及成品寫入器。
- 需要遠端 VM 時，Crabbox 擁有已預熱的 Linux 機器。
- GitHub Actions 擁有遠端工作流程進入點與成品保留。
- ClawSweeper 擁有 GitHub 留言路由：解析維護者命令、分派工作流程，以及發布最終 PR 留言。
- 當情境需要代理式設定、偵錯，或卡住狀態回報時，OpenClaw 代理程式會透過 Codex 驅動 Mantis。

這個邊界會將傳輸知識保留在 OpenClaw、機器排程保留在
Crabbox，並將維護者工作流程黏合邏輯保留在 ClawSweeper。

## 命令形式

第一個本機命令會驗證 Discord bot、guild、頻道、訊息傳送、
反應傳送，以及成品路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機 before 與 after 執行器接受這種形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

執行器會在輸出目錄下建立分離的基準與候選 worktree、安裝相依性、建置每個 ref、使用
`--allow-failures` 執行情境，然後寫入 `baseline/`、`candidate/`、`comparison.json`
和 `mantis-report.md`。對第一個 Discord 情境而言，成功的驗證表示基準狀態是 `fail`，候選狀態是 `pass`。

第一個 VM/瀏覽器原語是桌面冒煙測試：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox 桌面機器，在 VNC 工作階段內啟動可見瀏覽器、
擷取桌面、將成品拉回本機輸出目錄，並將重新連線命令寫入報告。此命令預設使用
Hetzner 提供者，因為它是 Mantis 路徑中第一個具備可用桌面/VNC
涵蓋的提供者。針對另一個 Crabbox 叢集執行時，可使用 `--provider`、`--crabbox-bin` 或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的桌面冒煙測試旗標：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用已預熱的桌面。
- `--browser-url <url>` 會變更可見瀏覽器中開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中呈現 repo 本機 HTML 成品。Mantis 會用它透過真實 Crabbox 桌面擷取產生的 Discord 狀態反應時間軸。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的租用保持開啟，以便 VNC 檢查。失敗的執行在已建立租用時預設會保留租用，讓操作員可以重新連線。
- `--class`、`--idle-timeout` 和 `--ttl` 會調整機器大小與租用生命週期。

第一個完整桌面傳輸原語是 Slack 桌面冒煙測試：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會租用或重用 Crabbox 桌面機器、將目前 checkout 同步到
VM、在該 VM 中執行 `pnpm openclaw qa slack`、在 VNC
瀏覽器中開啟 Slack Web、擷取可見桌面，並將 Slack QA 成品與
VNC 螢幕截圖複製回本機輸出目錄。這是第一種 SUT OpenClaw gateway 與瀏覽器都位於同一個
Linux 桌面 VM 內的 Mantis 形式。

使用 `--gateway-setup` 時，命令會在 `$HOME/.openclaw-mantis/slack-openclaw` 準備持久的拋棄式 OpenClaw
home、為選取的頻道修補 Slack Socket Mode
設定、在連接埠 `38973` 啟動 `openclaw gateway run`，並讓 Chrome 持續在 VNC 工作階段中執行。這是「留給我一個有 Slack 且有 claw 執行中的 Linux 桌面」模式；省略 `--gateway-setup` 時，bot 對 bot 的 Slack QA 路徑仍是預設值。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型路徑所需的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本機只設定了
  `OPENAI_API_KEY`，Mantis 會在叫用 Crabbox 前將它對應到 `OPENCLAW_LIVE_OPENAI_KEY`，讓 Crabbox 的 `OPENCLAW_*` env 轉送能將其帶入 VM。

實用的 Slack 桌面旗標：

- `--lease-id <cbx_...>` 會針對操作員已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久的 OpenClaw Slack gateway，而不是只執行 bot 對 bot QA 路徑。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未提供，當 SUT bot token 可用時，Mantis 會從 Slack `auth.test` 衍生 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 會控制 gateway 設定使用的 Slack 頻道允許清單。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 會控制 VM 內的持久 Chrome 設定檔。預設值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入會在同一個租用的重新執行中保留。
- `--credential-source convex --credential-role ci` 會使用共用憑證集區，而不是直接的 Slack env token。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 會傳遞給 Slack 即時路徑。

GitHub 冒煙測試工作流程是 `Mantis Discord Smoke`。第一個真實情境的 before 與 after GitHub
工作流程是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現僅 queued 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout 工作流程測試工具 ref、建置獨立的基準與候選
worktree、針對每個 worktree 執行 `discord-status-reactions-tool-only`，並將
`baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上傳為
Actions 成品。它也會在 Crabbox 桌面瀏覽器中呈現每個路徑的時間軸 HTML，並在 PR 留言中將那些 VNC 螢幕截圖與確定性
時間軸 PNG 一併發布。同一則 PR 留言會連結到 VNC 瀏覽器呈現期間擷取的桌面 MP4
錄影，而螢幕截圖會保持內嵌以供快速審查。此工作流程會從
`openclaw/crabbox` main 建置 Crabbox CLI，這樣它就能在下一個 Crabbox 二進位版本切出前使用目前的桌面/瀏覽器租用旗標。

你也可以直接從 PR 留言觸發狀態反應執行：

```text
@Mantis discord status reactions
```

留言觸發器刻意保持狹窄。它只會在具有 write、maintain 或 admin 存取權的使用者所發出的 pull request
留言上執行，且只會辨識
Discord 狀態反應請求。預設情況下，它會使用已知有問題的基準 ref
和目前 PR head SHA 作為候選。維護者可以覆寫任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令明確且聚焦於情境。第二個之後可以根據標籤、變更的檔案，以及
ClawSweeper 審查發現，將 PR
或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 當情境需要 UI 證據時，準備桌面/瀏覽器設定檔。
4. 為基準 ref 準備乾淨的 checkout。
5. 安裝相依性，並只建置情境需要的內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定即時傳輸、提供者、模型，以及瀏覽器設定檔。
8. 執行情境並擷取基準證據。
9. 停止 gateway 並保留日誌。
10. 在同一個 VM 中準備候選 ref。
11. 執行相同情境並擷取候選證據。
12. 比較判定器結果與視覺證據。
13. 寫入 Markdown、JSON、日誌、螢幕截圖，以及選用的 trace 成品。
14. 上傳 GitHub Actions 成品。
15. 發布精簡的 PR 或 Discord 狀態訊息。

情境應能以兩種不同方式失敗：

- **錯誤已重現**：基準以預期方式失敗。
- **測試工具失敗**：環境設定、憑證、Discord API、瀏覽器，或
  提供者在錯誤判定器有意義之前失敗。

最終報告必須區分這些情況，讓維護者不會將不穩定的
環境與產品行為混淆。

## Discord MVP

第一個情境應針對 guild 頻道中的 Discord 狀態反應，其中
來源回覆傳遞模式是 `message_tool_only`。

它是良好 Mantis 種子的原因：

- 它會以觸發訊息上的反應形式顯示在 Discord 中。
- 它透過 Discord 訊息反應狀態具備強大的 REST 判定器。
- 它會演練真實的 OpenClaw Gateway、Discord bot 驗證、訊息分派、
  來源回覆傳遞模式、狀態反應狀態，以及模型回合生命週期。
- 它足夠狹窄，能讓第一個實作保持務實。

預期情境形式：

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

基準證據應顯示 queued 確認反應，但在 tool-only 模式中沒有
生命週期轉換。候選證據應顯示當 `messages.statusReactions.enabled` 明確
為 true 時，生命週期狀態反應會執行。

第一個可執行切片是 opt-in Discord 即時 QA 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會以永遠啟用的 guild 處理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`，以及明確的狀態反應來設定 SUT。判定器會輪詢真實的 Discord 觸發訊息，並預期觀察到的序列為
`👀 -> 🤔 -> 👍`。成品包含 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html`，以及
`discord-status-reactions-tool-only-timeline.png`。

## 既有 QA 元件

Mantis 應建立在既有的私有 QA 堆疊之上，而不是從零開始：

- `pnpm openclaw qa discord` 已經會執行含有 driver 與 SUT bot 的即時 Discord lane。
- 即時傳輸執行器已經會在 `.artifacts/qa-e2e/` 下寫入報告與觀察到的訊息成品。
- Convex 憑證租約已經會提供共享即時傳輸憑證的獨占存取權。
- 瀏覽器控制服務已經支援螢幕截圖、快照、headless 受管設定檔，以及遠端 CDP 設定檔。
- QA Lab 已經有用於傳輸形狀測試的偵錯 UI 與匯流排。

第一版 Mantis 實作可以是在這些元件之上的輕量 before/after 執行器，再加上一層視覺證據。

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

`mantis-summary.json` 應該是機器可讀的事實來源。Markdown 報告則供 PR 留言與人工審查使用。

摘要必須包含：

- 測試的 ref 與 SHA
- 傳輸與情境 ID
- 機器供應商與機器 ID 或租約 ID
- 不含秘密值的憑證來源
- baseline 結果
- candidate 結果
- bug 是否在 baseline 上重現
- candidate 是否修復了它
- 成品路徑
- 已清理的設定或清理問題

螢幕截圖是證據，不是秘密。它們仍然需要遵守遮蔽規範：
可能會出現私人頻道名稱、使用者名稱或訊息內容。對於公開 PR，在遮蔽方案更完善之前，優先使用 GitHub Actions 成品連結，而不是內嵌圖片。

## 瀏覽器與 VNC

瀏覽器 lane 有兩種模式：

- **Headless 自動化**：CI 的預設模式。Chrome 會啟用 CDP，並由 Playwright 或 OpenClaw 瀏覽器控制擷取螢幕截圖。
- **VNC 救援**：在相同 VM 上啟用，供登入、MFA、Discord 反自動化，或需要人工視覺偵錯時使用。

Discord 觀察者瀏覽器設定檔應該足夠持久，避免每次執行都要登入，但也要與個人瀏覽器狀態隔離。設定檔屬於 Mantis 機器池，而不是開發者筆電。

當 Mantis 卡住時，它會張貼一則 Discord 狀態訊息，包含：

- 執行 ID
- 情境 ID
- 機器供應商
- 成品目錄
- 若可用，VNC 或 noVNC 連線指示
- 簡短的阻礙文字

第一個私有部署可以把這些訊息張貼到既有的操作員頻道，之後再移到專用的 Mantis 頻道。

## 機器

Mantis 的第一個遠端實作應優先透過 Crabbox 使用 AWS。Crabbox 提供已暖機機器、租約追蹤、hydration、日誌、結果與清理。如果 AWS 容量太慢或無法使用，請在相同機器介面後方新增 Hetzner 供應商。

最低 VM 需求：

- Linux，並安裝可支援桌面的 Chrome 或 Chromium
- 可供瀏覽器自動化使用的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 與 pnpm
- OpenClaw checkout 與依賴快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足夠 CPU 與記憶體，可執行一個 OpenClaw Gateway、一個瀏覽器，以及一次模型執行
- 對 Discord、GitHub、模型供應商與憑證 broker 的 outbound 存取

VM 不應在預期的憑證或瀏覽器設定檔儲存區之外保留長期原始秘密。

## 秘密

秘密會存在遠端執行用的 GitHub 組織或儲存庫秘密中，以及本機執行用的操作員控管本機秘密檔案中。

建議秘密名稱：

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

長期而言，Convex 憑證池應維持作為即時傳輸憑證的正常來源。GitHub 秘密則用於啟動 broker 與備援 lane。
Discord 狀態反應工作流程會將 Mantis Crabbox 秘密映射回 Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 與 `CRABBOX_COORDINATOR_TOKEN` 環境變數。純 `CRABBOX_*` GitHub 秘密名稱仍會被接受作為相容性備援。

Mantis 執行器絕不能印出：

- Discord bot token
- 供應商 API key
- 瀏覽器 cookie
- auth profile 內容
- VNC 密碼
- 原始憑證 payload

公開成品上傳也應遮蔽 Discord 目標 metadata，例如 bot、guild、channel 與 message ID。GitHub smoke 工作流程會因此啟用
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 不小心貼到 issue、PR、chat 或 log，請在新秘密已儲存後輪換它。

## GitHub 成品與 PR 留言

Mantis 工作流程應將完整證據套件上傳為短期 Actions 成品。當工作流程是為 bug 報告或修復 PR 執行時，也應將已遮蔽的 PNG 螢幕截圖發布到 `qa-artifacts` 分支，並在該 bug 或修復 PR 上 upsert 一則含有內嵌 before/after 螢幕截圖的留言。不要只把主要證明張貼在通用 QA 自動化 PR 上。原始日誌、觀察到的訊息，以及其他大型證據會留在 Actions 成品中。

正式工作流程應使用 Mantis GitHub App 張貼這些留言，而不是使用 `github-actions[bot]`。將 app id 與 private key 分別存成
`MANTIS_GITHUB_APP_ID` 與 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 秘密。工作流程會使用隱藏 marker 作為 upsert key，當 token 可以編輯時更新該留言；若較舊的 bot 擁有 marker 無法被編輯，則建立新的 Mantis 擁有留言。

PR 留言應簡短且視覺化：

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

當執行失敗是因為 harness 失敗時，留言必須明確說明這點，而不是暗示 candidate 失敗。

## 私有部署注意事項

私有部署可能已經有一個 Mantis Discord 應用程式。當該應用程式具備正確的 bot 權限且可以安全輪換時，請重用該應用程式，而不是建立另一個 app。

透過秘密或部署設定來設定初始操作員通知頻道。它一開始可以指向既有的維護者或營運頻道，之後在專用 Mantis 頻道存在時再移過去。

請勿將 guild ID、channel ID、bot token、瀏覽器 cookie 或 VNC 密碼放入本文件。請將它們存放在 GitHub 秘密、憑證 broker，或操作員的本機秘密儲存區。

## 新增情境

Mantis 情境應宣告：

- ID 與標題
- 傳輸
- 必要憑證
- baseline ref 政策
- candidate ref 政策
- OpenClaw 設定 patch
- 設定步驟
- stimulus
- 預期 baseline 判定器
- 預期 candidate 判定器
- 視覺擷取目標
- timeout 預算
- 清理步驟

情境應優先使用小型、具型別的判定器：

- 反應 bug 使用 Discord 反應狀態
- threading bug 使用 Discord 訊息參照
- Slack bug 使用 Slack thread ts 與反應 API 狀態
- email bug 使用 email 訊息 ID 與標頭
- 當 UI 是唯一可靠可觀察項時使用瀏覽器螢幕截圖

視覺檢查應為附加性質。如果平台 API 可以證明 bug，請使用 API 作為 pass/fail 判定器，並保留螢幕截圖供人工建立信心。

## 供應商擴充

Discord 之後，相同執行器可以新增：

- Slack：反應、thread、app mention、modal、檔案上傳。
- Email：在 connector 不足時，使用 `gog` 進行 Gmail auth 與訊息 threading。
- WhatsApp：QR 登入、重新識別、訊息傳遞、媒體、反應。
- Telegram：group mention gating、command，以及可用時的反應。
- Matrix：加密 room、thread 或 reply relation、重新啟動 resume。

每個傳輸都應有一個便宜的 smoke 情境，以及一個或多個 bug 類別情境。昂貴的視覺情境應維持 opt-in。

## 未決問題

- 當重用既有 Mantis bot 時，哪個 Discord bot 應作為 driver，哪個應作為 SUT？
- 第一階段中，觀察者瀏覽器登入應使用人類 Discord 帳號、測試帳號，還是只使用 bot 可讀的 REST 證據？
- GitHub 應該為 PR 保留 Mantis 成品多久？
- ClawSweeper 應該在什麼時候自動建議使用 Mantis，而不是等待維護者命令？
- 公開 PR 的螢幕截圖在上傳前是否應該遮蔽或裁切？
