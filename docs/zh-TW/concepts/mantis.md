---
read_when:
    - 為 OpenClaw 錯誤建置或執行即時視覺 QA
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行
summary: Mantis 是一套視覺化端對端驗證系統，用於在即時傳輸上重現 OpenClaw 錯誤、擷取修正前後的證據，並將成品附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-05-03T21:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端到端驗證系統，適用於需要真實
runtime、真實傳輸，以及可視證據的錯誤。它會針對已知
錯誤的 ref 執行情境、擷取證據，再針對候選 ref 執行相同情境，並將
比較結果發布為 artifacts，讓維護者可從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供高價值的第一條路徑：
真實機器人驗證、真實 guild 頻道、反應、threads、原生命令，以及
人類可視覺確認傳輸所顯示內容的瀏覽器 UI。

## 目標

- 從 GitHub issue 或 PR 重現錯誤，且使用者看到的是相同的傳輸形態。
- 在套用修正前，於基準 ref 擷取 **before** artifact。
- 在套用修正後，於候選 ref 擷取 **after** artifact。
- 盡可能使用確定性的 oracle，例如 Discord REST 反應讀取或頻道轉錄檢查。
- 當錯誤有可見 UI 表面時擷取螢幕截圖。
- 從 agent 控制的 CLI 在本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化或提供者驗證卡住時，保留足夠的機器狀態以供 VNC 救援。
- 當執行被封鎖、需要手動 VNC 協助或完成時，將精簡狀態發布到操作員 Discord 頻道。

## 非目標

- Mantis 不是單元測試的替代品。修正被理解後，Mantis 執行通常應轉為較小的回歸測試。
- Mantis 不是一般快速 CI gate。它較慢、使用即時憑證，且保留給即時環境很重要的錯誤。
- Mantis 不應要求人類介入一般操作。手動 VNC 是救援路徑，不是理想路徑。
- Mantis 不會在 artifacts、日誌、螢幕截圖、Markdown 報告或 PR 留言中儲存原始秘密。

## 擁有權

Mantis 位於 OpenClaw QA stack。

- OpenClaw 擁有 `pnpm openclaw qa mantis` 下的情境 runtime、傳輸配接器、證據 schema，以及本機 CLI。
- QA Lab 擁有即時傳輸 harness 元件、瀏覽器擷取 helpers，以及 artifact writers。
- 需要遠端 VM 時，Crabbox 擁有已預熱的 Linux 機器。
- GitHub Actions 擁有遠端 workflow 進入點與 artifact 保留。
- ClawSweeper 擁有 GitHub 留言路由：解析維護者命令、派發 workflow，以及發布最終 PR 留言。
- 當情境需要 agentic 設定、除錯或卡住狀態回報時，OpenClaw agents 會透過 Codex 驅動 Mantis。

這個邊界讓傳輸知識保留在 OpenClaw、機器排程保留在
Crabbox，並讓維護者 workflow 膠合邏輯保留在 ClawSweeper。

## 命令形式

第一個本機命令會驗證 Discord 機器人、guild、頻道、訊息傳送、
反應傳送，以及 artifact 路徑：

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

runner 會在輸出目錄下建立 detached baseline 和 candidate worktrees、
安裝相依性、建置每個 ref、以 `--allow-failures` 執行情境，接著寫入
`baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md`。
對第一個 Discord 情境而言，成功驗證代表 baseline 狀態為 `fail`，
candidate 狀態為 `pass`。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一個真實情境的
before 和 after GitHub workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期重現 queued-only 行為的 ref。
- `candidate_ref`：預期顯示 `queued -> thinking -> done` 的 ref。

它會 checkout workflow harness ref、建置分離的 baseline 和 candidate
worktrees、針對每個 worktree 執行 `discord-status-reactions-tool-only`，並將
`baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上傳為
Actions artifacts。

你也可以直接從 PR 留言觸發 status-reactions 執行：

```text
@Mantis discord status reactions
```

留言觸發刻意保持狹窄。它只會在具備 write、maintain 或 admin 存取權的使用者所發出的 pull request
留言上執行，且只辨識 Discord status-reaction 請求。預設會使用已知錯誤的 baseline ref
和目前 PR head SHA 作為 candidate。維護者可以覆寫任一 ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令是明確且以情境為中心的。第二個稍後可從 labels、變更檔案和
ClawSweeper 審查發現，將 PR 或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 為 baseline ref 準備乾淨的 checkout。
4. 安裝相依性，並只建置情境需要的內容。
5. 以隔離的狀態目錄啟動子 OpenClaw Gateway。
6. 設定即時傳輸、提供者、模型和瀏覽器 profile。
7. 執行情境並擷取 baseline 證據。
8. 停止 gateway 並保留日誌。
9. 在相同 VM 中準備 candidate ref。
10. 執行相同情境並擷取 candidate 證據。
11. 比較 oracle 結果與視覺證據。
12. 寫入 Markdown、JSON、日誌、螢幕截圖，以及選用 trace artifacts。
13. 上傳 GitHub Actions artifacts。
14. 發布精簡的 PR 或 Discord 狀態訊息。

情境應能以兩種不同方式失敗：

- **錯誤已重現**：baseline 以預期方式失敗。
- **Harness 失敗**：環境設定、憑證、Discord API、瀏覽器或提供者在錯誤 oracle 具備意義前失敗。

最終報告必須區分這些情況，讓維護者不會將不穩定環境與產品行為混淆。

## Discord 最小可行產品

第一個情境應鎖定 guild 頻道中的 Discord status reactions，其中
source reply delivery mode 是 `message_tool_only`。

它是良好 Mantis 種子的原因：

- 它會在 Discord 中以觸發訊息上的反應顯示。
- 它透過 Discord 訊息反應狀態具備強大的 REST oracle。
- 它會行經真實 OpenClaw Gateway、Discord 機器人驗證、訊息派發、
  source reply delivery mode、status reaction 狀態，以及模型 turn 生命週期。
- 它足夠狹窄，可讓第一個實作保持誠實。

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

Baseline 證據應顯示 queued acknowledgement reaction，但在 tool-only 模式中沒有
生命週期轉換。Candidate 證據應顯示當 `messages.statusReactions.enabled` 明確為
true 時，lifecycle status reactions 會執行。

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

它會以 always-on guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 和明確的 status reactions 設定 SUT。oracle
會輪詢真實 Discord 觸發訊息，並期望觀察到的序列為
`👀 -> 🤔 -> 👍`。Artifacts 包含 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 和
`discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 元件

Mantis 應建立在現有私有 QA stack 上，而不是從零開始：

- `pnpm openclaw qa discord` 已經以 driver 和 SUT bots 執行即時 Discord lane。
- 即時傳輸 runner 已經會在 `.artifacts/qa-e2e/` 下寫入報告和 observed-message artifacts。
- Convex credential leases 已經提供對共用即時傳輸憑證的獨佔存取。
- 瀏覽器控制服務已經支援螢幕截圖、snapshots、headless managed profiles，以及遠端 CDP profiles。
- QA Lab 已經有用於 transport-shaped 測試的 debugger UI 和 bus。

第一個 Mantis 實作可以是在這些元件之上的薄 before/after runner，
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

`mantis-summary.json` 應是機器可讀的事實來源。Markdown 報告則供 PR 留言和人工審查使用。

摘要必須包含：

- 已測試的 refs 和 SHAs
- 傳輸和情境 id
- 機器提供者和機器 id 或 lease id
- 不含秘密值的憑證來源
- baseline 結果
- candidate 結果
- 錯誤是否在 baseline 上重現
- candidate 是否修正它
- artifact 路徑
- 已清理的設定或清理問題

螢幕截圖是證據，不是秘密。但它們仍需要遵守遮蔽紀律：
私人頻道名稱、使用者名稱或訊息內容可能會出現。對公開 PR，
在遮蔽故事更完善前，偏好 GitHub Actions artifact 連結，而非內嵌圖片。

## 瀏覽器與 VNC

瀏覽器 lane 有兩種模式：

- **Headless automation**：CI 的預設值。Chrome 會以啟用 CDP 的方式執行，且
  Playwright 或 OpenClaw 瀏覽器控制會擷取螢幕截圖。
- **VNC rescue**：當登入、MFA、Discord anti-automation 或視覺除錯需要人類時，會在相同 VM 上啟用。

Discord observer browser profile 應足夠持久，以避免每次執行都登入，
但需與個人瀏覽器狀態隔離。profile 屬於 Mantis 機器池，而不是開發者筆電。

當 Mantis 卡住時，它會發布 Discord 狀態訊息，包含：

- run id
- scenario id
- 機器提供者
- artifact 目錄
- 可用時的 VNC 或 noVNC 連線指示
- 簡短的 blocker 文字

第一個私有部署可以將這些訊息發布到現有操作員頻道，之後再移至專用 Mantis 頻道。

## 機器

第一個遠端實作中，Mantis 應偏好透過 Crabbox 使用 AWS。
Crabbox 提供已預熱機器、lease 追蹤、hydration、日誌、結果和清理。
如果 AWS 容量太慢或不可用，請在相同機器介面後方新增 Hetzner provider。

最低 VM 需求：

- Linux，且安裝具備桌面能力的 Chrome 或 Chromium
- 用於瀏覽器自動化的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和相依性快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足夠的 CPU 和記憶體，可供一個 OpenClaw Gateway、一個瀏覽器和一次模型執行使用
- 對 Discord、GitHub、模型提供者和憑證 broker 的 outbound 存取

VM 不應在預期的憑證或瀏覽器 profile stores 之外保留長期存在的原始秘密。

## 秘密

遠端執行的秘密位於 GitHub organization 或 repository secrets，本機執行則位於本機操作員控制的秘密檔案中。

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

長期而言，Convex 憑證池應維持作為 live 傳輸憑證的一般來源。GitHub secrets 會啟動 broker 與 fallback lanes。

Mantis runner 絕不能列印：

- Discord bot token
- 供應商 API 金鑰
- 瀏覽器 Cookie
- auth profile 內容
- VNC 密碼
- 原始憑證 payload

公開 artifact 上傳也應遮蔽 Discord 目標中繼資料，例如 bot、guild、channel 和 message id。GitHub smoke workflow 因此啟用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 意外貼到 issue、PR、聊天或 log 中，請在新 secret 儲存後輪替它。

## GitHub Artifacts 與 PR 留言

Mantis workflow 應將完整證據 bundle 上傳為短期 Actions artifact。當 workflow 是為 bug report 或 fix PR 執行時，也應將已遮蔽的 PNG 螢幕截圖發布到 `qa-artifacts` 分支，並在該 bug 或 fix PR 上 upsert 一則留言，內含 before/after 內嵌螢幕截圖。不要只將主要證據發布在通用的 QA automation PR 上。原始 log、觀察到的訊息，以及其他大型證據應保留在 Actions artifact 中。

Production workflow 應使用 Mantis GitHub App 發布這些留言，而不是使用 `github-actions[bot]`。請將 app id 和 private key 儲存為 `MANTIS_GITHUB_APP_ID` 與 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets。workflow 使用隱藏 marker 作為 upsert key，當 token 可編輯留言時更新該留言；如果較舊的 bot 擁有的 marker 無法編輯，則建立新的 Mantis 擁有的留言。

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

當 run 因 harness 失敗而失敗時，留言必須說明這一點，而不是暗示 candidate 失敗。

## 私有部署注意事項

私有部署可能已經有 Mantis Discord 應用程式。當該應用程式具備正確的 bot 權限且可安全輪替時，請重用該應用程式，而不是建立另一個 app。

透過 secrets 或部署設定設置初始操作員通知 channel。它可以先指向現有的 maintainer 或 operations channel，等到專用 Mantis channel 存在後再移動過去。

請勿將 guild id、channel id、bot token、瀏覽器 Cookie 或 VNC 密碼放入此文件。請將它們儲存在 GitHub secrets、憑證 broker，或操作員的本機 secret store 中。

## 新增 Scenario

Mantis scenario 應宣告：

- id 與 title
- transport
- 必要憑證
- baseline ref 政策
- candidate ref 政策
- OpenClaw config patch
- setup steps
- stimulus
- 預期 baseline oracle
- 預期 candidate oracle
- visual capture targets
- timeout budget
- cleanup steps

Scenario 應偏好小型、具型別的 oracle：

- 反應 bug 使用 Discord reaction state
- threading bug 使用 Discord message reference
- Slack bug 使用 Slack thread ts 與 reaction API state
- email bug 使用 email message id 與 header
- UI 是唯一可靠可觀測項時使用瀏覽器螢幕截圖

Vision check 應為 additive。如果 platform API 可以證明 bug，請使用 API 作為 pass/fail oracle，並保留螢幕截圖供人工建立信心。

## 供應商擴充

Discord 之後，同一個 runner 可以新增：

- Slack：reaction、thread、app mention、modal、file upload。
- Email：在 connector 不足時，使用 `gog` 進行 Gmail auth 與 message threading。
- WhatsApp：QR login、re-identification、message delivery、media、reaction。
- Telegram：group mention gating、command、可用時的 reaction。
- Matrix：encrypted room、thread 或 reply relation、restart resume。

每種 transport 都應有一個低成本 smoke scenario，以及一個或多個 bug-class scenario。昂貴的 visual scenario 應保持 opt-in。

## 未決問題

- 重用現有 Mantis bot 時，哪個 Discord bot 應作為 driver，哪個應作為 SUT？
- 第一階段的 observer browser login 應使用真人 Discord 帳號、測試帳號，還是只使用 bot 可讀取的 REST 證據？
- GitHub 應為 PR 保留 Mantis artifact 多久？
- ClawSweeper 應在何時自動建議使用 Mantis，而不是等待 maintainer command？
- 公開 PR 的螢幕截圖在上傳前是否應遮蔽或裁切？
