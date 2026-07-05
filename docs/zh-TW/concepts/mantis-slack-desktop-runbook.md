---
read_when:
    - 從 GitHub 或本機執行 Mantis Slack 桌面 QA
    - 偵錯緩慢的 Mantis Slack 桌面版執行
    - 選擇 source、prehydrated 或 warm-lease 模式
    - 將螢幕截圖與影片證據發布到 PR
summary: Mantis Slack 桌面 QA 的操作員執行手冊：GitHub dispatch、本機命令列介面、暖機 VNC 租約、hydrate 模式、時間解讀、成品，以及故障處理。
title: Mantis Slack 桌面版執行手冊
x-i18n:
    generated_at: "2026-07-05T11:13:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是針對 Slack 類錯誤的真實 UI 路徑，適用於需要
Linux 桌面、VNC 救援、Slack Web、真實 OpenClaw 閘道、螢幕截圖、
影片，以及 PR 證據留言的情境。當單元測試或無頭 Slack 即時路徑無法
證明錯誤時，請使用它。

## 儲存模型

Mantis 使用三層儲存：

- **提供者映像** - 由 Crabbox 擁有，儲存在雲端提供者帳戶中。
  保存機器能力（Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生建置工具）和空的快取目錄。
- **暖租約狀態** - 由目前的操作者工作階段擁有。可在租約存活期間保存
  已登入的瀏覽器設定檔、`/var/cache/crabbox/pnpm`，以及已準備好的原始碼
  checkout。
- **Mantis 成果物** - 由 OpenClaw 執行擁有。位於
  `.artifacts/qa-e2e/mantis/...`；GitHub Actions 會上傳它們，而 Mantis
  GitHub App 會在 PR 上留言內嵌證據。

絕不要將秘密、瀏覽器 Cookie、Slack 登入狀態、儲存庫 checkout、
`node_modules` 或 `dist/` 烘焙進提供者映像。

## GitHub 派發

從 `main` 執行工作流程：

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` 受到限制，因為此工作流程會使用即時憑證：它必須解析為目前
`main` 的祖先、發行標籤，或 `openclaw/openclaw` 中開啟中 PR 的 head。

此工作流程會產生：

- 已上傳成果物 `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- 來自 Mantis GitHub App 的內嵌 PR 留言
- `slack-desktop-smoke.png`、`slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`、`slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`、`mantis-slack-desktop-smoke-report.md`
- 遠端記錄：`slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log`、`ffmpeg.log`

PR 留言會透過隱藏的 `<!-- mantis-slack-desktop-smoke -->` 標記原地更新。

## 本機命令列介面

冷原始碼證明：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

保留 VM 以進行 VNC 救援：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

開啟 VNC：

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

重用暖租約：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

只有在重用的遠端工作區已經有 `node_modules` 和已建置的 `dist/` 時，才使用
`--hydrate-mode prehydrated`；否則 Mantis 會關閉式失敗。

證明原生 Slack 核准 UI：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` 與 `--gateway-setup` 互斥。除非你傳入明確的
approval-checkpoint `--scenario`，否則它會執行選用的
`slack-approval-exec-native` 和 `slack-approval-plugin-native` 情境；其他
Slack 情境會在 VM 啟動前被拒絕。Slack QA 執行器會根據它觀察到的真實
Slack API 訊息寫入每個 checkpoint JSON 檔案，接著遠端 watcher 會將該訊息
轉譯為 `approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`。若任何 checkpoint JSON、訊息證據、
ack JSON 或已轉譯螢幕截圖遺失或為空，執行就會失敗。

冷 GitHub Actions 租約沒有 Slack Web Cookie，因此其瀏覽器擷取可能會停在
Slack 登入畫面。對於 approval-checkpoint 證明，請信任已轉譯的 checkpoint
圖片和 Slack QA 成果物，而不是 `slack-desktop-smoke.png`。只有在瀏覽器截圖
本身必須顯示 Slack Web 時，才使用保留且手動登入 Slack Web 設定檔的暖租約。

## Hydrate 模式

| 模式          | 使用時機                                  | 遠端行為                                                                              | 取捨                                                     |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 一般 PR 證明、冷機器、CI                 | 在 VM 內執行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build`        | 最慢、最強的原始碼 checkout 證明                        |
| `prehydrated` | 你刻意準備了重用租約                     | 需要既有 `node_modules` 和 `dist/`；略過安裝/建置                                     | 快速，但只對操作者控制的暖租約有效                      |

GitHub Actions 一律會在 VM 執行前準備候選 checkout。其 pnpm store 會依 OS、
Node 版本和 lockfile 快取。VM 的 `source` 執行在存在
`/var/cache/crabbox/pnpm` 時也會重用它。

## 時間解讀

`mantis-slack-desktop-smoke-report.md` 包含階段時間：

- `crabbox.warmup` - 雲端提供者啟動、桌面/瀏覽器就緒、SSH。
- `crabbox.inspect` - 租約中繼資料查詢。
- `credentials.prepare` - Convex 憑證租約取得。
- `crabbox.remote_run` - 同步、瀏覽器啟動、OpenClaw 安裝/建置或
  hydrate 驗證、閘道啟動、螢幕截圖與影片擷取。
- `artifacts.copy` - 從 VM rsync 回來。

當 Crabbox 回傳非零遠端狀態，但 Mantis 複製的中繼資料證明 OpenClaw 閘道
設定已完成，或 Slack QA 命令本身已成功結束時，`crabbox.remote_run` 可能顯示
`accepted`。請將 `accepted` 視為帶有說明的通過，而不是失敗情境。

如果執行很慢：

- Warmup 佔主要時間：預先烘焙或提升更好的 Crabbox 提供者映像。
- `remote_run` 在 `source` 中佔主要時間：使用暖租約、改善 pnpm store
  重用，或將機器前置需求移入提供者映像。
- `remote_run` 在 `prehydrated` 中佔主要時間：遠端工作區實際上尚未就緒，
  或閘道/瀏覽器/Slack 設定很慢。
- 成果物複製佔主要時間：檢查影片大小和成果物目錄內容。

## 證據檢查清單

良好的 PR 留言會顯示：

- 情境 ID 和候選 SHA
- GitHub Actions 執行 URL 和成果物 URL
- 內嵌 approval-checkpoint 螢幕截圖，或來自已登入暖租約的 Slack Web 螢幕截圖
- 可用時的內嵌動畫預覽
- 完整 MP4 和裁切後 MP4 連結
- 通過/失敗狀態和報告的時間摘要

不要將螢幕截圖或影片提交到儲存庫。請將它們保存在 GitHub Actions 成果物或
PR 留言中。

## 失敗處理

如果工作流程在 VM 執行前失敗，請先檢查 Actions job。
常見原因：不受信任的 `candidate_ref`、缺少環境秘密，或候選安裝/建置失敗。

如果 VM 執行失敗但螢幕截圖已複製回來，請檢查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果執行保留了租約，請用報告中的 `crabbox vnc ...` 命令開啟 VNC，完成後停止租約：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登入過期，請在保留租約的 VNC 中修復，並使用 `--lease-id` 重新執行。
不要將該瀏覽器設定檔烘焙進提供者映像。

## 相關

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation)
- [Slack 頻道](/zh-TW/channels/slack)
- [測試](/zh-TW/help/testing)
