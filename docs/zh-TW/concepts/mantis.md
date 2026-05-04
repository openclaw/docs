---
read_when:
    - 針對 OpenClaw 錯誤建置或執行即時視覺 QA
    - 為拉取請求加入前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行
summary: Mantis 是一套視覺化端對端驗證系統，用於在即時傳輸上重現 OpenClaw 錯誤、擷取修復前後的證據，並將產物附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-05-04T02:23:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 的端對端驗證系統，適用於需要真實
runtime、真實傳輸，以及可見證據的 bug。它會針對已知
有問題的 ref 執行情境、擷取證據，針對候選 ref 執行相同情境，並將
比較結果發布為 artifacts，讓維護者可從 PR 或
本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供高價值的第一條路徑：
真實 bot 驗證、真實伺服器頻道、反應、討論串、原生命令，以及一個
讓人類能以視覺確認傳輸顯示內容的瀏覽器 UI。

## 目標

- 使用使用者看到的相同傳輸形態，重現 GitHub issue 或 PR 中的 bug。
- 在套用修正前，於基準 ref 擷取 **before** artifact。
- 在套用修正後，於候選 ref 擷取 **after** artifact。
- 盡可能使用決定性的 oracle，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當 bug 具有可見 UI 表面時擷取螢幕截圖。
- 從代理控制的 CLI 在本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化或提供者驗證卡住時，保留足夠的機器狀態以便 VNC 救援。
- 當執行受阻、需要手動 VNC 協助或完成時，向操作員 Discord 頻道發布精簡狀態。

## 非目標

- Mantis 不是單元測試的替代品。Mantis 執行通常應在理解修正後，轉成較小的回歸測試。
- Mantis 不是一般快速 CI gate。它較慢、使用即時憑證，並保留給即時環境很重要的 bug。
- Mantis 不應在正常操作中需要人類介入。手動 VNC 是救援路徑，不是理想路徑。
- Mantis 不會在 artifacts、日誌、螢幕截圖、Markdown 報告或 PR 留言中儲存原始秘密。

## 擁有權

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有情境 runtime、傳輸配接器、證據 schema，以及 `pnpm openclaw qa mantis` 底下的本機 CLI。
- QA Lab 擁有即時傳輸 harness 元件、瀏覽器擷取輔助工具，以及 artifact 寫入器。
- Crabbox 在需要遠端 VM 時擁有已暖機的 Linux 機器。
- GitHub Actions 擁有遠端工作流程進入點與 artifact 保留。
- ClawSweeper 擁有 GitHub 留言路由：解析維護者命令、派送工作流程，以及發布最終 PR 留言。
- 當情境需要代理式設定、偵錯或卡住狀態回報時，OpenClaw agents 會透過 Codex 驅動 Mantis。

這個邊界讓傳輸知識留在 OpenClaw、機器排程留在
Crabbox，而維護者工作流程黏合邏輯留在 ClawSweeper。

## 命令形式

第一個本機命令會驗證 Discord bot、伺服器、頻道、訊息傳送、
反應傳送，以及 artifact 路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機 before 與 after runner 接受這種形式：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 會在輸出目錄底下建立分離的基準與候選 worktree、安裝相依套件、建置每個 ref、使用
`--allow-failures` 執行情境，然後寫入 `baseline/`、`candidate/`、`comparison.json`
與 `mantis-report.md`。對第一個 Discord 情境而言，成功驗證表示
基準狀態為 `fail`，候選狀態為 `pass`。

第一個 VM/瀏覽器 primitive 是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox 桌面機器、在 VNC 工作階段中啟動可見瀏覽器、擷取桌面、將 artifacts 拉回本機輸出目錄，並把重新連線命令寫入報告。此命令預設使用 Hetzner 提供者，因為它是 Mantis 路徑中第一個具有可用桌面/VNC 覆蓋的提供者。針對其他 Crabbox fleet 執行時，可用 `--provider`、`--crabbox-bin` 或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的桌面 smoke 旗標：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用已暖機的桌面。
- `--browser-url <url>` 會變更可見瀏覽器中開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中呈現 repo 本機 HTML artifact。Mantis 會用它透過真實 Crabbox 桌面擷取產生的 Discord 狀態反應時間軸。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的租用保持開啟，以便 VNC 檢查。失敗的執行若建立了租用，預設會保留租用，讓操作員可重新連線。
- `--class`、`--idle-timeout` 與 `--ttl` 會調整機器大小與租用生命週期。

GitHub smoke 工作流程是 `Mantis Discord Smoke`。第一個真實情境的 before 與 after GitHub
工作流程是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現僅 queued 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout 工作流程 harness ref、建置個別的基準與候選
worktree、對每個 worktree 執行 `discord-status-reactions-tool-only`，並將
`baseline/`、`candidate/`、`comparison.json` 與 `mantis-report.md` 上傳為
Actions artifacts。它也會在 Crabbox 桌面瀏覽器中呈現每條路徑的時間軸 HTML，並在 PR 留言中將那些 VNC 螢幕截圖與決定性
時間軸 PNG 一起發布。此工作流程會從
`openclaw/crabbox` main 建置 Crabbox CLI，以便在下一個 Crabbox 二進位 release 製作前使用目前的桌面/瀏覽器租用旗標。

你也可以直接從 PR 留言觸發狀態反應執行：

```text
@Mantis discord status reactions
```

留言觸發刻意保持狹窄。它只會在具有 write、maintain 或 admin 存取權的使用者於 pull request
留言時執行，且只辨識
Discord 狀態反應請求。預設會使用已知有問題的基準 ref
與目前 PR head SHA 作為候選。維護者可以覆寫任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令是明確且以情境為中心。第二個之後可依據標籤、變更的檔案與
ClawSweeper review 發現，將 PR
或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 當情境需要 UI 證據時，準備桌面/瀏覽器 profile。
4. 為基準 ref 準備乾淨的 checkout。
5. 安裝相依套件，且只建置情境所需內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定即時傳輸、提供者、模型與瀏覽器 profile。
8. 執行情境並擷取基準證據。
9. 停止 Gateway 並保留日誌。
10. 在相同 VM 中準備候選 ref。
11. 執行相同情境並擷取候選證據。
12. 比較 oracle 結果與視覺證據。
13. 寫入 Markdown、JSON、日誌、螢幕截圖，以及選用的 trace artifacts。
14. 上傳 GitHub Actions artifacts。
15. 發布精簡 PR 或 Discord 狀態訊息。

情境應能以兩種不同方式失敗：

- **已重現 bug**：基準以預期方式失敗。
- **Harness 失敗**：環境設定、憑證、Discord API、瀏覽器或提供者在 bug oracle 具意義前失敗。

最終報告必須區分這些情況，讓維護者不會把不穩定環境誤認為產品行為。

## Discord MVP

第一個情境應以伺服器頻道中的 Discord 狀態反應為目標，其中
來源回覆交付模式是 `message_tool_only`。

它是良好 Mantis 種子的原因：

- 它在 Discord 中可見，會顯示為觸發訊息上的反應。
- 它透過 Discord 訊息反應狀態具有強力 REST oracle。
- 它會演練真實 OpenClaw Gateway、Discord bot 驗證、訊息派送、
  來源回覆交付模式、狀態反應狀態，以及模型回合生命週期。
- 它足夠狹窄，可讓第一個實作保持扎實。

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
生命週期轉換。候選證據應顯示當 `messages.statusReactions.enabled` 明確為
true 時，生命週期狀態反應會執行。

可執行的第一個切片是選擇啟用的 Discord 即時 QA 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會使用 always-on 伺服器處理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 與明確狀態反應來設定 SUT。oracle
會輪詢真實 Discord 觸發訊息，並預期觀察到序列
`👀 -> 🤔 -> 👍`。Artifacts 包含 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 與
`discord-status-reactions-tool-only-timeline.png`。

## 既有 QA 元件

Mantis 應建立在既有私有 QA 堆疊之上，而不是從零開始：

- `pnpm openclaw qa discord` 已經會以 driver 與 SUT bots 執行即時 Discord 路徑。
- 即時傳輸 runner 已經會在 `.artifacts/qa-e2e/` 底下寫入報告與 observed-message
  artifacts。
- Convex 憑證租用已經提供對共享即時
  傳輸憑證的獨占存取。
- 瀏覽器控制服務已經支援螢幕截圖、快照、
  headless 受管 profiles，以及遠端 CDP profiles。
- QA Lab 已經有用於傳輸形態測試的 debugger UI 與 bus。

第一個 Mantis 實作可以是覆蓋這些元件的輕量 before/after runner，
再加上一層視覺證據。

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

`mantis-summary.json` 應是機器可讀的事實來源。
Markdown 報告用於 PR 留言與人工 review。

摘要必須包含：

- 測試的 refs 與 SHAs
- 傳輸與情境 id
- 機器提供者與機器 id 或租用 id
- 不含秘密值的憑證來源
- 基準結果
- 候選結果
- bug 是否在基準上重現
- 候選是否修正它
- artifact 路徑
- 已清理的設定或清理問題

螢幕截圖是證據，不是秘密。它們仍需要遵守遮罩紀律：
可能會出現私人頻道名稱、使用者名稱或訊息內容。對於公開 PR，
在遮罩策略更強之前，偏好使用 GitHub Actions artifact 連結，而不是內嵌圖片。

## 瀏覽器與 VNC

瀏覽器路徑有兩種模式：

- **Headless 自動化**：CI 的預設模式。Chrome 會以啟用 CDP 的方式執行，而
  Playwright 或 OpenClaw 瀏覽器控制會擷取螢幕截圖。
- **VNC 救援**：當登入、MFA、Discord 反自動化
  或視覺偵錯需要人類時，會在相同 VM 上啟用。

Discord 觀察者瀏覽器設定檔應該足夠持久，以避免每次執行都需要登入，但也應與個人瀏覽器狀態隔離。設定檔屬於 Mantis 機器池，而不是開發者筆電。

當 Mantis 卡住時，它會發布一則 Discord 狀態訊息，其中包含：

- 執行 id
- 情境 id
- 機器提供者
- 成品目錄
- VNC 或 noVNC 連線指示（如果可用）
- 簡短的阻塞原因文字

第一次私有部署可以將這些訊息發布到現有的操作員頻道，之後再移至專用的 Mantis 頻道。

## 機器

Mantis 的第一個遠端實作應優先透過 Crabbox 使用 AWS。Crabbox 提供已暖機的機器、租約追蹤、環境補齊、日誌、結果與清理。如果 AWS 容量太慢或無法使用，請在相同機器介面後方加入 Hetzner 提供者。

最低 VM 需求：

- Linux，且已安裝具備桌面能力的 Chrome 或 Chromium
- 用於瀏覽器自動化的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 與相依項快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足夠的 CPU 與記憶體，可支援一個 OpenClaw Gateway、一個瀏覽器，以及一次模型執行
- 可對 Discord、GitHub、模型提供者與憑證 broker 進行出站存取

VM 不應在預期的憑證或瀏覽器設定檔儲存區之外保留長期存活的原始機密資料。

## 機密資料

遠端執行的機密資料存放在 GitHub 組織或儲存庫機密資料中，本機執行的機密資料則存放在操作員控制的本機機密檔案中。

建議的機密資料名稱：

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

長期而言，Convex 憑證池應維持為即時傳輸憑證的一般來源。GitHub 機密資料會啟動 broker 與後援路徑。Discord 狀態反應工作流程會將 Mantis Crabbox 機密資料對應回 Crabbox CLI 預期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 環境變數。一般的 `CRABBOX_*` GitHub 機密資料名稱仍會被接受，作為相容性後援。

Mantis runner 絕不能列印：

- Discord bot token
- 提供者 API 金鑰
- 瀏覽器 cookie
- 驗證設定檔內容
- VNC 密碼
- 原始憑證 payload

公開成品上傳也應遮蔽 Discord 目標中繼資料，例如 bot、guild、channel 和 message id。GitHub smoke 工作流程會因此啟用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 不小心貼到 issue、PR、聊天或日誌中，請在新機密資料已儲存後輪替它。

## GitHub 成品與 PR 留言

Mantis 工作流程應將完整證據 bundle 上傳為短期保存的 Actions 成品。當工作流程是針對錯誤報告或修復 PR 執行時，也應將遮蔽後的 PNG 螢幕截圖發布到 `qa-artifacts` 分支，並在該錯誤或修復 PR 上 upsert 一則含有行內前後對照螢幕截圖的留言。不要只在一般 QA 自動化 PR 上發布主要證明。原始日誌、觀察到的訊息與其他大型證據保留在 Actions 成品中。

生產工作流程應使用 Mantis GitHub App 發布這些留言，而不是使用 `github-actions[bot]`。將 app id 和私鑰儲存為 `MANTIS_GITHUB_APP_ID` 與 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions 機密資料。工作流程會使用隱藏標記作為 upsert 鍵，在 token 可以編輯時更新該留言，並在較舊的 bot 所有標記無法編輯時建立新的 Mantis 所有留言。

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

當執行失敗是因為 harness 失敗時，留言必須說明這一點，而不是暗示候選修復失敗。

## 私有部署注意事項

私有部署可能已經有 Mantis Discord 應用程式。當該應用程式具備正確的 bot 權限且可以安全輪替時，請重複使用該應用程式，而不是建立另一個 app。

透過機密資料或部署設定來設定初始操作員通知頻道。它一開始可以指向現有的維護者或營運頻道，等專用 Mantis 頻道存在後再移過去。

不要將 guild id、channel id、bot token、瀏覽器 cookie 或 VNC 密碼放入這份文件。請將它們儲存在 GitHub 機密資料、憑證 broker 或操作員的本機機密資料儲存區中。

## 新增情境

Mantis 情境應宣告：

- id 和標題
- 傳輸
- 必要憑證
- baseline ref 政策
- candidate ref 政策
- OpenClaw 設定 patch
- 設定步驟
- 刺激
- 預期的 baseline oracle
- 預期的 candidate oracle
- 視覺擷取目標
- 逾時預算
- 清理步驟

情境應優先使用小型、具型別的 oracle：

- 反應錯誤的 Discord 反應狀態
- threading 錯誤的 Discord 訊息參照
- Slack 錯誤的 Slack thread ts 和反應 API 狀態
- email 錯誤的 email message id 與 header
- 當 UI 是唯一可靠可觀察項目時的瀏覽器螢幕截圖

視覺檢查應該是附加性的。如果平台 API 可以證明錯誤，請使用 API 作為通過/失敗 oracle，並保留螢幕截圖供人類確認。

## 提供者擴充

在 Discord 之後，同一個 runner 可以加入：

- Slack：反應、thread、app 提及、modal、檔案上傳。
- Email：在 connector 不足時，使用 `gog` 進行 Gmail 驗證與訊息 threading。
- WhatsApp：QR 登入、重新識別、訊息傳遞、媒體、反應。
- Telegram：群組提及 gating、命令、可用時的反應。
- Matrix：加密聊天室、thread 或 reply 關係、重新啟動後恢復。

每個傳輸都應有一個低成本 smoke 情境，以及一個或多個錯誤類別情境。昂貴的視覺情境應維持為選用。

## 未解問題

- 重複使用現有 Mantis bot 時，哪個 Discord bot 應作為 driver，哪個應作為 SUT？
- 觀察者瀏覽器登入在第一階段應使用人類 Discord 帳號、測試帳號，還是只使用 bot 可讀的 REST 證據？
- GitHub 應為 PR 保留 Mantis 成品多久？
- ClawSweeper 何時應自動建議 Mantis，而不是等待維護者命令？
- 公開 PR 上傳前，螢幕截圖是否應遮蔽或裁切？
