---
read_when:
    - 建置或執行 OpenClaw 錯誤的即時視覺 QA
    - 為拉取請求新增前後驗證
    - 新增 Discord、Slack、WhatsApp 或其他即時傳輸情境
    - 偵錯需要螢幕截圖、瀏覽器自動化或 VNC 存取的 QA 執行
summary: Mantis 是視覺化端對端驗證系統，用於在即時傳輸通道上重現 OpenClaw 錯誤、擷取前後證據，並將產物附加到 PR。
title: 螳螂
x-i18n:
    generated_at: "2026-06-27T19:11:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis 是 OpenClaw 端對端驗證系統，適用於需要真實執行階段、真實傳輸與可見證據的錯誤。它會針對已知有問題的 ref 執行情境、擷取證據，再針對候選 ref 執行相同情境，並將比較結果發布為成品，讓維護者可從 PR 或本機命令檢查。

Mantis 從 Discord 開始，因為 Discord 提供高價值的第一條驗證通道：真實機器人驗證、真實伺服器頻道、反應、討論串、原生命令，以及人類可用來視覺確認傳輸顯示內容的瀏覽器 UI。

## 目標

- 從 GitHub issue 或 PR 重現錯誤，並使用與使用者看到的相同傳輸形態。
- 在套用修正前，於基準 ref 擷取 **before** 成品。
- 在套用修正後，於候選 ref 擷取 **after** 成品。
- 盡可能使用確定性的判定器，例如 Discord REST 反應讀取或頻道逐字稿檢查。
- 當錯誤有可見 UI 表面時擷取螢幕截圖。
- 從代理控制的命令列介面在本機執行，並從 GitHub 遠端執行。
- 當登入、瀏覽器自動化或供應者驗證卡住時，保留足夠的機器狀態以便 VNC 救援。
- 當執行受阻、需要手動 VNC 協助或完成時，將精簡狀態發布到操作員 Discord 頻道。

## 非目標

- Mantis 不是單元測試的替代品。修正被理解後，Mantis 執行通常應轉化為較小的迴歸測試。
- Mantis 不是一般快速 CI 閘門。它較慢、使用即時憑證，並保留給即時環境很重要的錯誤。
- Mantis 不應要求人類進行一般操作。手動 VNC 是救援路徑，不是理想路徑。
- Mantis 不會在成品、記錄、螢幕截圖、Markdown 報告或 PR 留言中儲存原始祕密。

## 所有權

Mantis 位於 OpenClaw QA 堆疊中。

- OpenClaw 擁有情境執行階段、傳輸配接器、證據結構描述，以及 `pnpm openclaw qa mantis` 下的本機命令列介面。
- QA Lab 擁有即時傳輸測試工具組件、瀏覽器擷取協助程式與成品寫入器。
- 需要遠端 VM 時，Crabbox 擁有已暖機的 Linux 機器。
- GitHub Actions 擁有遠端工作流程進入點與成品保留。
- ClawSweeper 擁有 GitHub 留言路由：剖析維護者命令、分派工作流程，以及發布最終 PR 留言。
- 當情境需要代理式設定、除錯或卡住狀態回報時，OpenClaw 代理會透過 Codex 驅動 Mantis。

此邊界將傳輸知識保留在 OpenClaw，將機器排程保留在 Crabbox，並將維護者工作流程黏合邏輯保留在 ClawSweeper。

## 命令形態

第一個本機命令會驗證 Discord 機器人、伺服器、頻道、訊息傳送、反應傳送與成品路徑：

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

本機 before 和 after 執行器接受此形態：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

執行器會在輸出目錄下建立分離的基準與候選 worktree、安裝相依項、建置每個 ref、使用 `--allow-failures` 執行情境，然後寫入 `baseline/`、`candidate/`、`comparison.json` 與 `mantis-report.md`。對第一個 Discord 情境而言，成功驗證表示基準狀態是 `fail`，候選狀態是 `pass`。

第二個 Discord before/after 探測以討論串附件為目標：

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

該情境會使用驅動程式機器人發布父訊息、建立真實 Discord 討論串、以 repo 本機 `filePath` 呼叫 OpenClaw 的 `message.thread-reply` 動作，然後輪詢討論串中的 SUT 回覆與附件檔名。基準螢幕截圖顯示沒有附件的回覆；候選螢幕截圖顯示預期的 `mantis-thread-report.md` 附件。

第一個 VM/瀏覽器基礎功能是桌面 smoke：

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

它會租用或重用 Crabbox 桌面機器、在 VNC 工作階段中啟動可見瀏覽器、擷取桌面、將成品拉回本機輸出目錄，並將重新連線命令寫入報告。命令預設使用 Hetzner 供應者，因為它是 Mantis 通道中第一個具備可用桌面/VNC 覆蓋的供應者。針對其他 Crabbox 機群執行時，可使用 `--provider`、`--crabbox-bin` 或 `OPENCLAW_MANTIS_CRABBOX_PROVIDER` 覆寫。

實用的桌面 smoke 旗標：

- `--lease-id <cbx_...>` 或 `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` 會重用已暖機的桌面。
- `--browser-url <url>` 會變更在可見瀏覽器中開啟的頁面。
- `--html-file <path>` 會在可見瀏覽器中呈現 repo 本機 HTML 成品。Mantis 使用此功能透過真實 Crabbox 桌面擷取產生的 Discord 狀態反應時間軸。
- `--browser-profile-dir <remote-path>` 會重用遠端 Chrome user-data-dir，使持久 Mantis 桌面可在多次執行之間保持登入。長期存在的 Discord Web 檢視器設定檔請使用此選項。
- `--browser-profile-archive-env <name>` 會在啟動瀏覽器前，從具名環境變數還原 base64 `.tgz` Chrome user-data-dir 封存。請將此用於已登入的見證者，例如 Discord Web。預設 env var 是 `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`。
- `--video-duration <seconds>` 控制 MP4 擷取長度。對需要時間穩定下來的緩慢已登入網頁應用程式，請使用較長時間。
- `--keep-lease` 或 `OPENCLAW_MANTIS_KEEP_VM=1` 會讓新建立且通過的租用保持開啟，以供 VNC 檢查。當執行失敗且建立了租用時，預設會保留租用，讓操作員可以重新連線。
- `--class`、`--idle-timeout` 與 `--ttl` 會調整機器大小與租用生命週期。

對於 Discord Web 證據，Mantis 使用專用檢視器帳號，而不是機器人權杖。即時 Discord API 情境仍是判定器：它會建立真實討論串、傳送 SUT `thread-reply`，並透過 Discord REST 檢查附件。設定 `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` 時，情境也會寫入 Discord Web URL 成品。設定 `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` 時，會讓該討論串保留足夠久，以便已登入的瀏覽器開啟並錄製。

GitHub 工作流程會在 Discord Web 中開啟候選討論串 URL、擷取螢幕截圖、錄製 MP4，並在 Crabbox 媒體工具可用時產生裁剪過動態的 GIF 預覽。偏好使用透過 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 設定的持久檢視器設定檔路徑，因為完整 Chrome 設定檔封存可能超過 GitHub 的祕密大小限制。對於小型/啟動設定檔，工作流程也可從 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 還原 base64 `.tgz` 封存。若兩種設定檔來源都未設定，工作流程仍會發布確定性的基準/候選附件螢幕截圖，並記錄通知表示已跳過已登入的 Discord Web 見證者。

第一個完整桌面傳輸基礎功能是 Slack 桌面 smoke：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

它會租用或重用 Crabbox 桌面機器、將目前 checkout 同步到 VM、在該 VM 內執行 `pnpm openclaw qa slack`、在 VNC 瀏覽器中開啟 Slack Web、擷取可見桌面，並將 Slack QA 成品與 VNC 螢幕截圖都複製回本機輸出目錄。這是第一個 Mantis 形態，其中 SUT OpenClaw 閘道與瀏覽器都位於同一部 Linux 桌面 VM 內。

使用 `--gateway-setup` 時，命令會在 `$HOME/.openclaw-mantis/slack-openclaw` 準備持久的一次性 OpenClaw home、為所選頻道修補 Slack Socket Mode 設定、在連接埠 `38973` 啟動 `openclaw gateway run`，並讓 Chrome 在 VNC 工作階段中保持執行。這是「留給我一個執行 Slack 和 claw 的 Linux 桌面」模式；省略 `--gateway-setup` 時，機器人對機器人的 Slack QA 通道仍是預設值。

`--credential-source env` 所需輸入：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- 遠端模型通道需要 `OPENCLAW_LIVE_OPENAI_KEY`。如果本機只設定了
  `OPENAI_API_KEY`，Mantis 會在叫用 Crabbox 前將其對應到 `OPENCLAW_LIVE_OPENAI_KEY`，讓 Crabbox 的 `OPENCLAW_*` env 轉送可以將其帶入 VM。

使用 `--gateway-setup --credential-source convex` 時，Mantis 會在建立 VM 前從共用集區租用 Slack SUT 憑證，並將租用的頻道 id、Socket Mode app token 與 bot token 作為桌面內部的 `OPENCLAW_MANTIS_SLACK_*` 執行階段 env 轉送。這讓 GitHub 工作流程保持精簡：它們只需要 Convex broker 祕密，而不需要原始 Slack bot 或 app token。

實用的 Slack 桌面旗標：

- `--lease-id <cbx_...>` 會針對操作員已透過 VNC 登入 Slack Web 的機器重新執行。
- `--gateway-setup` 會在 VM 中啟動持久 OpenClaw Slack 閘道，而不是只執行機器人對機器人的 QA 通道。
- `--keep-lease` 會在成功後保留閘道 VM 以供 VNC 檢查；`--no-keep-lease` 會在收集成品後停止它。
- `--slack-url <url>` 會開啟特定 Slack Web URL。若未提供，且 SUT bot token 可用，Mantis 會從 Slack `auth.test` 推導 `https://app.slack.com/client/<team>/<channel>`。
- `--slack-channel-id <id>` 控制閘道設定使用的 Slack 頻道允許清單。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` 控制 VM 內的持久 Chrome 設定檔。預設值是 `$HOME/.config/openclaw-mantis/slack-chrome-profile`，因此手動 Slack Web 登入可在同一租用上的重新執行中保留下來。
- `--credential-source convex --credential-role ci` 使用共用憑證集區，而不是直接 Slack env token。
- `--provider-mode`、`--model`、`--alt-model` 與 `--fast` 會傳遞到 Slack 即時通道。

核准檢查點執行會將 Slack API 訊息快照呈現為檢查點 PNG，作為 CI 安全的視覺證據。只有當租用使用已登入的暖瀏覽器設定檔時，`slack-desktop-smoke.png` 才是 Slack Web 的證據。

GitHub smoke 工作流程是 `Mantis Discord Smoke`。第一個真實情境的 before 和 after GitHub 工作流程是 `Mantis Discord Status Reactions`。它接受：

- `baseline_ref`：預期會重現僅 queued 行為的 ref。
- `candidate_ref`：預期會顯示 `queued -> thinking -> done` 的 ref。

它會 checkout 工作流程測試工具 ref、建置分離的基準與候選 worktree、針對每個 worktree 執行 `discord-status-reactions-tool-only`，並將 `baseline/`、`candidate/`、`comparison.json` 與 `mantis-report.md` 上傳為 Actions 成品。它也會在 Crabbox 桌面瀏覽器中呈現每條通道的時間軸 HTML，並在 PR 留言中將那些 VNC 螢幕截圖發布在確定性時間軸 PNG 旁邊。同一則 PR 留言會嵌入由 `crabbox media preview` 產生的輕量裁剪過動態 GIF 預覽、連結到相符的裁剪過動態 MP4 片段，並保留完整桌面 MP4 檔案以供深入檢查。螢幕截圖會保持內嵌，方便快速審閱。工作流程會從 `openclaw/crabbox` main 建置 Crabbox 命令列介面，以便在下一個 Crabbox 二進位版本發布前使用目前的桌面/瀏覽器租用旗標。

`Mantis Scenario` 是通用的手動進入點。它接受 `scenario_id`、
`candidate_ref`、可選的 `baseline_ref`，以及可選的 `pr_number`，然後
分派由情境擁有的工作流程。這個包裝器刻意保持精簡：
情境工作流程仍然擁有其傳輸設定、憑證、VM 類別、
預期判定器，以及成品清單。

`Mantis Slack Desktop Smoke` 是第一個 Slack VM 工作流程。它會在獨立工作樹中
簽出受信任的候選參照，租用 Crabbox Linux 桌面，
針對該候選版本執行 `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`，
在 VNC 瀏覽器中開啟 Slack Web、錄製桌面，使用 `crabbox media preview`
產生經動作裁剪的預覽，上傳完整成品目錄，並可選擇在目標 PR 上張貼行內證據留言。
它預設使用 AWS 來租用桌面，並提供手動供應商輸入，讓操作員在 AWS 容量緩慢或無法使用時
切換到 Hetzner。當你想要的是「一個執行 Slack 與 claw 的 Linux 桌面」，
而不只是機器人對機器人的 Slack 記錄時，請使用此通道。

`Mantis Telegram Live` 會將現有的 Telegram 即時 QA 通道包裝進相同的 PR
證據管線。它會在獨立工作樹中簽出受信任的候選參照，執行
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`，從 Telegram QA 摘要、`qa-evidence.json` 與報告成品寫入
`mantis-evidence.json` 清單，透過 Crabbox 桌面瀏覽器呈現經遮罩的證據 HTML，
使用 `crabbox media preview` 產生經動作裁剪的 GIF，並在可取得 PR 編號時
張貼行內 PR 證據留言。這個通道是 QA 證據視覺化，而不是登入狀態的
Telegram Web 證明：Telegram Bot API 提供穩定的即時訊息證據，但一般 Mantis
自動化不需要 Telegram Web 登入狀態。

`Mantis Telegram Desktop Proof` 是代理式原生 Telegram Desktop 前後對照包裝器。
維護者可以透過 PR 留言中的 `@openclaw-mantis telegram desktop proof`、
從 Actions UI 搭配自由格式指示，或透過通用的 `Mantis Scenario` 分派器觸發它。
工作流程會把 PR、基準參照、候選參照與維護者指示交給 Codex。
代理會閱讀 PR、決定哪些 Telegram 可見行為能證明此變更、針對基準與候選版本
執行真實使用者 Crabbox Telegram Desktop 證明通道、反覆調整直到原生 GIF 有用，
將成對的 `motionPreview` 成品寫入 `mantis-evidence.json`、上傳套件，並在可取得
PR 編號時張貼 2 欄 PR 證據表格。

若要進行需要人員介入的 Telegram 桌面設定，請使用情境建置器：

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

建置器會租用或重用 Crabbox 桌面、安裝原生 Linux Telegram Desktop 二進位檔、
可選擇還原使用者工作階段封存、使用租用的 Telegram SUT 機器人權杖設定 OpenClaw、
在連接埠 `38974` 啟動 `openclaw gateway run`、將驅動機器人的就緒訊息張貼到
租用的私人群組，然後從可見的 VNC 桌面擷取螢幕截圖與 MP4。機器人權杖永遠不會登入
Telegram Desktop；它只會設定 OpenClaw。桌面檢視器是獨立的 Telegram 使用者工作階段，
可從 `--telegram-profile-archive-env <name>` 還原，或透過 VNC 手動建立並使用
`--keep-lease` 保持存活。

實用的 Telegram 桌面建置器旗標：

- `--lease-id <cbx_...>` 會針對操作員已登入 Telegram Desktop 的 VM 重新執行。
- `--telegram-profile-archive-env <name>` 會從該環境變數讀取 base64 `.tgz` Telegram Desktop 設定檔封存，並在啟動前還原。
- `--telegram-profile-dir <remote-path>` 會控制遠端 Telegram Desktop 設定檔目錄。預設為 `$HOME/.local/share/TelegramDesktop`。
- `--no-gateway-setup` 會安裝並開啟 Telegram Desktop，而不設定 OpenClaw。
- `--credential-source convex --credential-role ci` 會使用共享憑證代理，而不是直接使用 Telegram 環境權杖。

每個會發布到 PR 的情境都會在其報告旁寫入 `mantis-evidence.json`。
此結構描述是情境程式碼與 GitHub 留言之間的交接格式：

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

成品 `path` 值是相對於清單目錄的路徑。`targetPath`
值是設定的 Mantis R2/S3 成品前綴下的相對路徑。發布器會拒絕路徑穿越，
並在可選預覽或影片無法使用時略過標示為 `"required": false` 的項目。

支援的成品種類：

- `timeline`：確定性的情境螢幕截圖，通常用於前後對照。
- `desktopScreenshot`：VNC/瀏覽器桌面螢幕截圖。
- `motionPreview`：從桌面錄影產生的行內動畫 GIF。
- `motionClip`：移除靜態開頭與結尾的動作裁剪 MP4。
- `fullVideo`：用於深入檢查的完整 MP4 錄影。
- `metadata`：JSON/記錄側邊檔。
- `report`：Markdown 報告。

可重用的發布器是 `scripts/mantis/publish-pr-evidence.mjs`。工作流程會以清單、
目標 PR、成品目標根目錄、留言標記、Actions 成品 URL、執行 URL 與請求來源呼叫它。
它會將宣告的成品上傳到設定的 Mantis R2/S3 bucket，建立以摘要優先的 PR 留言，
其中包含行內圖片/預覽與連結影片，然後更新現有標記留言或建立新留言。
工作流程會發布到 `openclaw-crabbox-artifacts`，公開 URL 位於
`https://artifacts.openclaw.ai` 之下。它們會直接提供 bucket、區域與公開 URL 值。
可重用發布器需要：

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

你也可以直接從 PR 留言觸發狀態反應執行：

```text
@openclaw-mantis discord status reactions
```

留言觸發刻意保持狹窄。它只會在具備 write、maintain 或 admin 存取權的使用者
於 pull request 留言時執行，且只辨識 Discord 狀態反應請求。
預設情況下，它會使用已知有問題的基準參照，以及目前 PR head SHA 作為候選版本。
維護者可以覆寫任一參照：

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram 即時 QA 也可以從 PR 留言觸發：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

預設情況下，它會使用目前 PR head SHA 作為候選版本，並執行
`telegram-status-command`。當維護者需要特定參照或已預熱的 Crabbox 桌面時，
可以覆寫 `candidate=...`、`provider=aws|hetzner` 與 `lease=<cbx_...>`。

ClawSweeper 命令範例：

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

第一個命令是明確且聚焦於情境的命令。第二個命令之後可以根據標籤、變更檔案與
ClawSweeper 審查發現，將 PR 或 issue 對應到建議的 Mantis 情境。

## 執行生命週期

1. 取得憑證。
2. 配置或重用 VM。
3. 當情境需要 UI 證據時，準備桌面/瀏覽器設定檔。
4. 為基準參照準備乾淨的簽出。
5. 安裝相依性，並只建置情境需要的內容。
6. 使用隔離的狀態目錄啟動子 OpenClaw Gateway。
7. 設定即時傳輸、供應商、模型與瀏覽器設定檔。
8. 執行情境並擷取基準證據。
9. 停止閘道並保留記錄。
10. 在同一個 VM 中準備候選參照。
11. 執行相同情境並擷取候選證據。
12. 比較判定器結果與視覺證據。
13. 寫入 Markdown、JSON、記錄、螢幕截圖與可選追蹤成品。
14. 上傳 GitHub Actions 成品。
15. 張貼簡潔的 PR 或 Discord 狀態訊息。

情境應該能以兩種不同方式失敗：

- **已重現錯誤**：基準以預期方式失敗。
- **測試框架失敗**：環境設定、憑證、Discord API、瀏覽器或供應商在錯誤判定器有意義之前失敗。

最終報告必須區分這些情況，讓維護者不會把不穩定的環境與產品行為混淆。

## Discord MVP

第一個情境應鎖定公會頻道中的 Discord 狀態反應，其中來源回覆傳遞模式為
`message_tool_only`。

它是良好 Mantis 種子的原因：

- 它在 Discord 中會顯示為觸發訊息上的反應。
- 它透過 Discord 訊息反應狀態具備強力的 REST 判定器。
- 它會演練真實的 OpenClaw Gateway、Discord 機器人驗證、訊息分派、
  來源回覆傳遞模式、狀態反應狀態，以及模型回合生命週期。
- 它範圍足夠狹窄，能讓第一個實作保持可靠。

預期的情境形狀：

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

基準證據應顯示已排隊的確認反應，但在僅工具模式中沒有生命週期轉換。
候選證據應顯示在明確啟用 `messages.statusReactions.enabled` 時執行生命週期
狀態反應。

第一個可執行切片是選擇啟用的 Discord 即時 QA 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

它會使用永遠開啟的公會處理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"` 與明確的狀態反應來設定 SUT。判定器會輪詢真實的
Discord 觸發訊息，並預期觀察到的序列為 `👀 -> 🤔 -> 👍`。成品包含
`discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html` 與
`discord-status-reactions-tool-only-timeline.png`。

## 現有 QA 元件

Mantis 應建立在現有的私人 QA 堆疊之上，而不是從零開始：

- `pnpm openclaw qa discord` 已經使用驅動與 SUT 機器人執行即時 Discord 通道。
- 即時傳輸執行器已經在 `.artifacts/qa-e2e/` 下寫入報告、QA 證據與傳輸專屬成品。
- Convex 憑證租約已經提供對共享即時傳輸憑證的獨占存取。
- 瀏覽器控制服務已經支援螢幕截圖、快照、無頭管理設定檔，以及遠端 CDP 設定檔。
- QA Lab 已經具備用於傳輸形狀測試的除錯 UI 與匯流排。

第一個 Mantis 實作可以是在這些元件之上的精簡前後對照執行器，再加上一層視覺證據。

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

`mantis-summary.json` 應是機器可讀的事實來源。Markdown 報告用於 PR 留言和人工審閱。

摘要必須包含：

- 測試的 refs 和 SHA
- 傳輸和情境 ID
- 機器提供者與機器 ID 或租約 ID
- 不含秘密值的憑證來源
- baseline 結果
- candidate 結果
- bug 是否在 baseline 上重現
- candidate 是否修復了它
- artifact 路徑
- 已清理的設定或清除問題

螢幕截圖是證據，不是秘密。它們仍需要遵守遮蔽規範：可能會出現私人頻道名稱、使用者名稱或訊息內容。對於公開 PR，在遮蔽流程更完善之前，優先使用 GitHub Actions artifact 連結，而不是內嵌圖片。

## 瀏覽器與 VNC

瀏覽器路徑有兩種模式：

- **無頭自動化**：CI 的預設模式。Chrome 以啟用 CDP 的方式執行，並由 Playwright 或 OpenClaw 瀏覽器控制擷取螢幕截圖。
- **VNC 救援**：在同一台 VM 上啟用，用於登入、MFA、Discord 反自動化，或需要人工進行視覺偵錯時。

Discord 觀察者瀏覽器設定檔應該足夠持久，避免每次執行都要登入，但要與個人瀏覽器狀態隔離。設定檔屬於 Mantis 機器池，而不是開發者筆電。

當 Mantis 卡住時，它會發布 Discord 狀態訊息，內容包括：

- 執行 ID
- 情境 ID
- 機器提供者
- artifact 目錄
- VNC 或 noVNC 連線指示（如可用）
- 簡短的阻礙文字

第一個私人部署可以先將這些訊息發布到現有的操作員頻道，之後再移到專用的 Mantis 頻道。

## 機器

Mantis 的第一個遠端實作應優先透過 Crabbox 使用 AWS。Crabbox 提供已預熱的機器、租約追蹤、hydration、日誌、結果和清理。如果 AWS 容量太慢或不可用，請在相同的機器介面後方新增 Hetzner 提供者。

最低 VM 需求：

- Linux，並安裝可支援桌面的 Chrome 或 Chromium
- 瀏覽器自動化的 CDP 存取
- 用於救援的 VNC 或 noVNC
- Node 22 和 pnpm
- OpenClaw checkout 和相依項快取
- 使用 Playwright 時的 Playwright Chromium 瀏覽器快取
- 足以執行一個 OpenClaw 閘道、一個瀏覽器和一次模型執行的 CPU 與記憶體
- 可對外連線至 Discord、GitHub、模型提供者和憑證代理

VM 不應在預期的憑證或瀏覽器設定檔儲存區以外保留長期原始秘密。

## 秘密

遠端執行的秘密存放在 GitHub 組織或儲存庫秘密中，本機執行的秘密存放在由本機操作員控制的秘密檔案中。

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

長期而言，Convex 憑證池應維持作為即時傳輸憑證的一般來源。GitHub secrets 用於啟動代理和 fallback 路徑。Discord 狀態反應工作流程會將 Mantis Crabbox secrets 對應回 Crabbox 命令列介面預期的 `CRABBOX_COORDINATOR` 和 `CRABBOX_COORDINATOR_TOKEN` 環境變數。純 `CRABBOX_*` GitHub secret 名稱仍會作為相容性 fallback 被接受。

Mantis runner 絕不能印出：

- Discord bot token
- 提供者 API key
- 瀏覽器 cookie
- auth 設定檔內容
- VNC 密碼
- 原始憑證 payload

公開 artifact 上傳也應遮蔽 Discord 目標中繼資料，例如 bot、guild、channel 和 message ID。GitHub smoke 工作流程會因此啟用 `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`。

如果 token 不小心貼到 issue、PR、聊天或日誌中，請在新的 secret 儲存完成後輪換它。

## GitHub artifacts 和 PR 留言

Mantis 工作流程應將完整證據包上傳為短期 Actions artifact。當工作流程針對 bug 報告或修復 PR 執行時，它也應將已遮蔽的內嵌媒體發布到已設定的 Mantis R2/S3 bucket，並在該 bug 或修復 PR 上 upsert 一則留言，包含內嵌的前後對照螢幕截圖。不要只在通用 QA 自動化 PR 上發布主要證據。原始日誌、觀察到的訊息和其他大型證據保留在 Actions artifact 中。

Production 工作流程應使用 Mantis GitHub App 發布這些留言，而不是使用 `github-actions[bot]`。將 app id 和 private key 作為 `MANTIS_GITHUB_APP_ID` 和 `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets 儲存。工作流程使用隱藏標記作為 upsert key，在 token 可以編輯時更新該留言，並在較舊的 bot-owned 標記無法編輯時建立新的 Mantis-owned 留言。

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

當執行失敗是因為 harness 失敗時，留言必須明確說明這一點，而不是暗示 candidate 失敗。

## 私人部署注意事項

私人部署可能已經有 Mantis Discord application。當它具備正確的 bot 權限且可以安全輪換時，請重用該 application，而不是建立另一個 app。

透過 secrets 或部署設定設定初始操作員通知頻道。它一開始可以指向現有的維護者或 operations 頻道，等專用 Mantis 頻道建立後再移過去。

不要在本文件中放入 guild ID、channel ID、bot token、瀏覽器 cookie 或 VNC 密碼。請將它們存放在 GitHub secrets、憑證代理，或操作員的本機 secret store 中。

## 新增情境

Mantis 情境應宣告：

- ID 和標題
- 傳輸
- 必要憑證
- baseline ref policy
- candidate ref policy
- OpenClaw config patch
- 設定步驟
- stimulus
- 預期 baseline oracle
- 預期 candidate oracle
- 視覺擷取目標
- timeout budget
- 清理步驟

情境應優先使用小型且 typed 的 oracle：

- 用於 reaction bug 的 Discord reaction 狀態
- 用於 threading bug 的 Discord message references
- 用於 Slack bug 的 Slack thread ts 和 reaction API state
- 用於 email bug 的 email message ID 和 headers
- 當 UI 是唯一可靠可觀察項時的瀏覽器螢幕截圖

Vision checks 應是 additive。如果平台 API 可以證明 bug，請使用 API 作為 pass/fail oracle，並保留螢幕截圖以增強人工信心。

## 提供者擴展

在 Discord 之後，相同 runner 可以新增：

- Slack：reactions、threads、app mentions、modals、file uploads。
- Email：在 connectors 不足時，使用 `gog` 進行 Gmail auth 和 message threading。
- WhatsApp：QR login、re-identification、message delivery、media、reactions。
- Telegram：group mention gating、commands、reactions（如可用）。
- Matrix：encrypted rooms、thread 或 reply relations、restart resume。

每個傳輸都應有一個便宜的 smoke 情境，以及一個或多個 bug-class 情境。昂貴的視覺情境應維持 opt-in。

## 開放問題

- 重用現有 Mantis bot 時，哪個 Discord bot 應作為 driver，哪個應作為 SUT？
- 觀察者瀏覽器登入在第一階段應使用人工 Discord 帳號、測試帳號，還是只使用 bot-readable REST 證據？
- GitHub 應為 PR 保留 Mantis artifacts 多久？
- ClawSweeper 何時應自動建議 Mantis，而不是等待維護者命令？
- 公開 PR 上傳前，螢幕截圖是否應先遮蔽或裁切？
