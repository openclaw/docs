---
read_when:
    - 為 OpenClaw 錯誤建置或執行即時視覺 QA
    - 為拉取請求加入前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行
summary: Mantis 是視覺端對端驗證系統，用於在即時傳輸上重現 OpenClaw 錯誤、擷取修正前後的證據，並將成品附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-05-04T07:03:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端對端驗證系統，用於需要真實
執行階段、真實傳輸，以及可見證據的錯誤。它會針對已知
有問題的 ref 執行情境、擷取證據，針對候選 ref 執行相同情境，並
將比較結果發布為 artifacts，供維護者從 PR 或
本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供高價值的第一條驗證路徑：
真實 bot auth、真實 guild 頻道、反應、threads、原生命令，以及
人類可視覺確認傳輸顯示內容的瀏覽器 UI。

## 目標

- 從 GitHub issue 或 PR 重現錯誤，並使用使用者
  看到的相同傳輸形態。
- 在套用修正前，於基準 ref 擷取 **before** artifact。
- 在套用修正後，於候選 ref 擷取 **after** artifact。
- 盡可能使用確定性的 oracle，例如 Discord REST 反應
  讀取或頻道 transcript 檢查。
- 當錯誤有可見 UI 表面時擷取螢幕截圖。
- 從 agent 控制的 CLI 在本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化，或
  provider auth 卡住時，保留足夠的機器狀態以供 VNC 救援。
- 當執行被阻擋、
  需要手動 VNC 協助，或完成時，向操作員 Discord 頻道發布精簡狀態。

## 非目標

- Mantis 不是單元測試的替代品。修正被理解後，Mantis 執行通常應該成為
  較小的迴歸測試。
- Mantis 不是一般的快速 CI gate。它較慢、使用 live 憑證，並且
  保留給 live 環境很重要的錯誤。
- Mantis 的正常運作不應該需要人類。手動 VNC 是救援
  路徑，不是理想路徑。
- Mantis 不會在 artifacts、logs、screenshots、Markdown
  報告，或 PR comments 中儲存原始 secret。

## 擁有權

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有 `pnpm openclaw qa mantis` 下的情境執行階段、傳輸 adapters、證據 schema，以及
  本機 CLI。
- QA Lab 擁有 live 傳輸 harness 元件、瀏覽器擷取 helpers，以及
  artifact writers。
- 當需要遠端 VM 時，Crabbox 擁有 warmed Linux machines。
- GitHub Actions 擁有遠端 workflow 進入點與 artifact 保留。
- ClawSweeper 擁有 GitHub comment routing：解析維護者命令、
  dispatch workflow，以及發布最終 PR comment。
- 當情境需要 agentic setup、
  debugging，或 stuck-state reporting 時，OpenClaw agents 透過 Codex 驅動 Mantis。

這個邊界讓傳輸知識留在 OpenClaw、機器排程留在
Crabbox，並讓維護者 workflow glue 留在 ClawSweeper。

## 命令形態

第一個本機命令會驗證 Discord bot、guild、channel、message send、
reaction send，以及 artifact path：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機 before 和 after runner 接受此形態：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner 會在輸出
目錄下建立 detached baseline 和 candidate worktrees、安裝 dependencies、建置每個 ref、使用
`--allow-failures` 執行情境，然後寫入 `baseline/`、`candidate/`、`comparison.json`，
以及 `mantis-report.md`。對於第一個 Discord 情境，成功驗證
表示 baseline status 是 `fail`，candidate status 是 `pass`。

第一個 VM/browser primitive 是 desktop smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會 lease 或重用 Crabbox desktop machine，在
VNC session 內啟動可見瀏覽器，擷取 desktop，將 artifacts 拉回本機輸出
目錄，並把 reconnect command 寫入報告。此命令預設使用
Hetzner provider，因為它是 Mantis lane 中第一個具有可運作 desktop/VNC
coverage 的 provider。針對另一個 Crabbox fleet 執行時，可用 `--provider`、`--crabbox-bin`，或
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的 desktop smoke flags：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用 warmed desktop。
- `--browser-url <url>` 會變更可見瀏覽器開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中 render repo-local HTML artifact。Mantis 使用它透過真實 Crabbox desktop 擷取產生的 Discord status-reaction timeline。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的 lease 保持開啟，以供 VNC 檢查。當執行失敗且已建立 lease 時，預設會保留 lease，讓操作員可重新連線。
- `--class`、`--idle-timeout` 和 `--ttl` 會調整機器大小與 lease lifetime。

第一個完整 desktop 傳輸 primitive 是 Slack desktop smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會 lease 或重用 Crabbox desktop machine，將目前 checkout 同步到
VM 中，在該 VM 內執行 `pnpm openclaw qa slack`，在 VNC
瀏覽器中開啟 Slack Web，擷取可見 desktop，並將 Slack QA artifacts 與
VNC screenshot 複製回本機輸出目錄。這是第一個 Mantis
形態，其中 SUT OpenClaw Gateway 與瀏覽器都位於同一個
Linux desktop VM 內。

使用 `--gateway-setup` 時，命令會在 `$HOME/.openclaw-mantis/slack-openclaw` 準備持久性的 disposable OpenClaw
home，為所選頻道 patch Slack Socket Mode
configuration，在 port
`38973` 啟動 `openclaw gateway run`，並讓 Chrome 持續在 VNC session 中執行。這是「留下一個
已開啟 Slack 和 claw 的 Linux desktop 給我」模式；當省略 `--gateway-setup` 時，
bot-to-bot Slack QA lane 仍是預設值。

`--credential-source env` 的必要輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型 lane 的 `OPENCLAW_LIVE_OPENAI_KEY`。如果本機只設定了
  `OPENAI_API_KEY`，Mantis 會在叫用 Crabbox 前將它對應到 `OPENCLAW_LIVE_OPENAI_KEY`，
  使 Crabbox 的 `OPENCLAW_*` env forwarding 能將它帶入
  VM。

實用的 Slack desktop flags：

- `--lease-id <cbx_...>` 會針對操作員已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久性 OpenClaw Slack Gateway，而不只是執行 bot-to-bot QA lane。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未提供，當 SUT bot token 可用時，Mantis 會從 Slack `auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制 Gateway setup 使用的 Slack channel allowlist。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久 Chrome profile。預設為 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入會在同一個 lease 上的重新執行中保留。
- `--credential-source convex --credential-role ci` 使用 shared credential pool，而不是直接的 Slack env tokens。
- `--provider-mode`、`--model`、`--alt-model` 和 `--fast` 會傳遞給 Slack live lane。

GitHub smoke workflow 是 `Mantis Discord Smoke`。第一個真實情境的 before 和 after GitHub
workflow 是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現 queued-only 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout workflow harness ref、建置獨立的 baseline 和 candidate
worktrees、針對每個 worktree 執行 `discord-status-reactions-tool-only`，並將
`baseline/`、`candidate/`、`comparison.json` 和 `mantis-report.md` 上傳為
Actions artifacts。它也會在 Crabbox
desktop browser 中 render 每個 lane 的 timeline HTML，並在 PR comment 中將這些 VNC screenshots 與確定性的
timeline PNGs 一起發布。workflow 會從
`openclaw/crabbox` main 建置 Crabbox CLI，因此它可以在下一個 Crabbox binary release cut 前使用目前的 desktop/browser lease flags。

你也可以直接從 PR comment 觸發 status-reactions 執行：

```text
@Mantis discord status reactions
```

comment trigger 刻意保持狹窄。它只會在具有 write、maintain，或 admin access 的使用者於 pull request
comments 中觸發，且只會辨識
Discord status-reaction requests。預設使用已知有問題的 baseline ref
以及目前 PR head SHA 作為 candidate。維護者可以覆寫任一
ref：

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper 命令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令是明確且以情境為焦點。第二個之後可以從 labels、changed files，以及
ClawSweeper review findings，將 PR
或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得 credentials。
2. 配置或重用 VM。
3. 當情境需要 UI 證據時，準備 desktop/browser profile。
4. 為 baseline ref 準備乾淨的 checkout。
5. 安裝 dependencies，並只建置情境需要的內容。
6. 使用 isolated state directory 啟動 child OpenClaw Gateway。
7. 設定 live transport、provider、model，以及 browser profile。
8. 執行情境並擷取 baseline evidence。
9. 停止 Gateway 並保留 logs。
10. 在同一個 VM 中準備 candidate ref。
11. 執行相同情境並擷取 candidate evidence。
12. 比較 oracle results 與 visual evidence。
13. 寫入 Markdown、JSON、logs、screenshots，以及 optional trace artifacts。
14. 上傳 GitHub Actions artifacts。
15. 發布精簡的 PR 或 Discord status message。

情境應能以兩種不同方式失敗：

- **已重現錯誤**：baseline 以預期方式失敗。
- **Harness failure**：environment setup、credentials、Discord API、browser，或
  provider 在錯誤 oracle 有意義前失敗。

最終報告必須區分這些情況，讓維護者不會把不穩定的
環境與產品行為混淆。

## Discord MVP

第一個情境應該針對 guild channels 中的 Discord status reactions，其中
source reply delivery mode 是 `message_tool_only`。

它是好的 Mantis seed 的原因：

- 它在 Discord 中以觸發 message 上的 reactions 呈現。
- 它透過 Discord message reaction state 提供強 REST oracle。
- 它會執行真實 OpenClaw Gateway、Discord bot auth、message dispatch、
  source reply delivery mode、status reaction state，以及 model turn lifecycle。
- 它足夠狹窄，能讓第一個實作保持務實。

預期情境形態：

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

Baseline evidence 應顯示 queued acknowledgement reaction，但在 tool-only mode 中沒有
lifecycle transition。Candidate evidence 應顯示當 `messages.statusReactions.enabled` 明確為
true 時，lifecycle
status reactions 會執行。

第一個可執行 slice 是 opt-in Discord live QA scenario：

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
"message_tool"`、`ackReaction: "👀"`，以及明確的狀態 reaction 來設定 SUT。oracle
會輪詢真實的 Discord 觸發訊息，並預期觀察到的序列為
`👀 -> 🤔 -> 👍`。artifact 包含 `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html`，以及
`discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 元件

Mantis 應建基於現有的私有 QA 堆疊，而不是從零開始：

- `pnpm openclaw qa discord` 已經會執行含有 driver 與 SUT bot 的即時 Discord lane。
- 即時 transport runner 已經會在 `.artifacts/qa-e2e/` 下寫入報告與觀察到的訊息 artifact。
- Convex credential lease 已經提供對共用即時 transport credential 的獨占存取。
- 瀏覽器控制服務已經支援 screenshot、snapshot、headless managed profile，以及遠端 CDP profile。
- QA Lab 已經有用於 transport-shaped 測試的 debugger UI 與 bus。

第一個 Mantis 實作可以是這些元件之上的薄層 before/after runner，再加上一層視覺證據。

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

`mantis-summary.json` 應該是機器可讀的權威來源。
Markdown 報告用於 PR comment 與人工 review。

摘要必須包含：

- 測試的 ref 與 SHA
- transport 與 scenario id
- machine provider 與 machine id 或 lease id
- 不含 secret 值的 credential 來源
- baseline 結果
- candidate 結果
- bug 是否在 baseline 上重現
- candidate 是否修復它
- artifact 路徑
- 已清理的 setup 或 cleanup 問題

screenshot 是證據，不是 secret。不過它們仍需要 redaction 紀律：
可能會出現 private channel 名稱、user 名稱或 message 內容。對於 public PR，
在 redaction 方案更完善前，優先使用 GitHub Actions artifact 連結，而不是 inline image。

## 瀏覽器與 VNC

瀏覽器 lane 有兩種模式：

- **Headless automation**：CI 的預設值。Chrome 會啟用 CDP 執行，並由 Playwright 或 OpenClaw browser control 擷取 screenshot。
- **VNC rescue**：當 login、MFA、Discord anti-automation，或 visual debugging 需要人工介入時，在同一台 VM 上啟用。

Discord observer browser profile 應該足夠持久，以避免每次執行都登入，但要與個人瀏覽器狀態隔離。profile 屬於 Mantis machine pool，不屬於開發者筆電。

當 Mantis 卡住時，它會發布一則 Discord status message，包含：

- run id
- scenario id
- machine provider
- artifact 目錄
- 如可用，提供 VNC 或 noVNC 連線指示
- 簡短的 blocker 文字

第一個私有部署可以將這些 message 發布到現有 operator channel，之後再移到專用的 Mantis channel。

## 機器

第一個遠端實作中，Mantis 應優先透過 Crabbox 使用 AWS。
Crabbox 會提供已預熱的 machine、lease tracking、hydration、log、result，以及 cleanup。
如果 AWS 容量太慢或不可用，請在同一個 machine interface 後方加入 Hetzner provider。

最低 VM 需求：

- Linux，並安裝具備 desktop 能力的 Chrome 或 Chromium
- 用於 browser automation 的 CDP 存取
- 用於 rescue 的 VNC 或 noVNC
- Node 22 與 pnpm
- OpenClaw checkout 與 dependency cache
- 使用 Playwright 時的 Playwright Chromium browser cache
- 足以執行一個 OpenClaw Gateway、一個 browser，以及一次 model run 的 CPU 與 memory
- 可連出到 Discord、GitHub、model provider，以及 credential broker

VM 不應在預期的 credential 或 browser profile store 之外保留長期有效的原始 secret。

## Secret

Secret 存放在遠端執行用的 GitHub organization 或 repository secret，以及本機執行用、由 operator 控制的本機 secret file。

建議的 secret 名稱：

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 用於 public GitHub artifact upload
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期而言，Convex credential pool 應維持為即時 transport credential 的一般來源。
GitHub secret 會 bootstrap broker 與 fallback lane。
Discord status-reactions workflow 會把 Mantis Crabbox secret 對應回 Crabbox CLI 預期的
`CRABBOX_COORDINATOR` 與 `CRABBOX_COORDINATOR_TOKEN` 環境變數。
純 `CRABBOX_*` GitHub secret 名稱仍接受作為相容性 fallback。

Mantis runner 絕不能印出：

- Discord bot token
- provider API key
- browser cookie
- auth profile 內容
- VNC password
- 原始 credential payload

Public artifact upload 也應 redact Discord target metadata，例如 bot、guild、channel 與 message id。GitHub smoke workflow 因此會啟用
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 被意外貼到 issue、PR、chat 或 log 中，請在新的 secret 已儲存後輪替它。

## GitHub Artifact 與 PR Comment

Mantis workflow 應將完整 evidence bundle 上傳為短期 Actions artifact。當 workflow 是針對 bug report 或 fix PR 執行時，也應將已 redacted 的 PNG screenshot 發布到 `qa-artifacts` branch，並在該 bug 或 fix PR 上 upsert 一則 comment，內含 inline before/after screenshot。不要只把主要 proof 發布在 generic QA automation PR 上。Raw log、observed message，以及其他大型 evidence 保留在 Actions artifact 中。

Production workflow 應使用 Mantis GitHub App 發布這些 comment，而不是使用 `github-actions[bot]`。將 app id 與 private key 儲存為
`MANTIS_GITHUB_APP_ID` 與 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secret。workflow 會使用 hidden marker 作為 upsert key，在 token 可編輯時更新該 comment，並在較舊的 bot-owned marker 無法編輯時建立新的 Mantis-owned comment。

PR comment 應簡短且視覺化：

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

當執行失敗是因為 harness 失敗時，comment 必須如此說明，而不是暗示 candidate 失敗。

## 私有部署備註

私有部署可能已經有 Mantis Discord application。當該 application 具備正確的 bot permission，且可以安全輪替時，請重用它，而不是建立另一個 app。

透過 secret 或 deployment configuration 設定初始 operator notification channel。它一開始可以指向現有的 maintainer 或 operations channel，等專用的 Mantis channel 存在後再移過去。

不要把 guild id、channel id、bot token、browser cookie 或 VNC password 放進本文件。請將它們儲存在 GitHub secret、credential broker，或 operator 的本機 secret store。

## 新增 Scenario

Mantis scenario 應宣告：

- id 與 title
- transport
- required credential
- baseline ref policy
- candidate ref policy
- OpenClaw config patch
- setup step
- stimulus
- expected baseline oracle
- expected candidate oracle
- visual capture target
- timeout budget
- cleanup step

Scenario 應優先使用小型、具型別的 oracle：

- reaction bug 使用 Discord reaction state
- threading bug 使用 Discord message reference
- Slack bug 使用 Slack thread ts 與 reaction API state
- email bug 使用 email message id 與 header
- 當 UI 是唯一可靠 observable 時，使用 browser screenshot

Vision check 應是附加性的。如果 platform API 可以證明 bug，請使用 API 作為 pass/fail oracle，並保留 screenshot 供人工建立信心。

## Provider 擴充

Discord 之後，同一個 runner 可以加入：

- Slack：reaction、thread、app mention、modal、file upload。
- Email：當 connector 不足時，使用 `gog` 進行 Gmail auth 與 message threading。
- WhatsApp：QR login、re-identification、message delivery、media、reaction。
- Telegram：group mention gating、command，以及可用時的 reaction。
- Matrix：encrypted room、thread 或 reply relation、restart resume。

每個 transport 都應有一個便宜的 smoke scenario，以及一個或多個 bug-class scenario。昂貴的 visual scenario 應維持 opt-in。

## 未解問題

- 重用現有 Mantis bot 時，哪個 Discord bot 應作為 driver，哪個應作為 SUT？
- 第一階段的 observer browser login 應使用人類 Discord 帳號、test account，還是只使用 bot-readable REST evidence？
- GitHub 應為 PR 保留 Mantis artifact 多久？
- ClawSweeper 應在什麼時候自動建議使用 Mantis，而不是等待 maintainer command？
- Public PR 的 screenshot 是否應在上傳前 redact 或 crop？
