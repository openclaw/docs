---
read_when:
    - 從 GitHub 或本機執行 Mantis Slack 桌面版 QA
    - 偵錯緩慢的 Mantis Slack 桌面版執行
    - 選擇來源、預先水合或暖租約模式
    - 將螢幕截圖和影片證據發布到 PR
summary: Mantis Slack 桌面版 QA 的操作員執行手冊：GitHub 派發、本機 CLI、已預熱的 VNC 租約、水合模式、時序解讀、產物，以及失敗處理。
title: Mantis Slack 桌面版作業手冊
x-i18n:
    generated_at: "2026-05-06T02:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a8046e30cb348a7edf01845216f97f67dc3b3695f2484b7e883d3b862ffad81
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是針對 Slack 類錯誤的真實 UI 通道，這些錯誤需要
Linux 桌面、VNC 救援、Slack Web、真實的 OpenClaw gateway、截圖、
影片，以及 PR 證據留言。

當單元測試或無頭 Slack 即時通道無法證明錯誤時使用它。

## 儲存模型

Mantis 使用三個不同的儲存層：

- 提供者映像檔：由 Crabbox 擁有，並儲存在雲端提供者帳戶中。
  它包含機器能力，例如 Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生建置工具，以及空的快取目錄。
- 暖租用狀態：由目前的操作者工作階段擁有。只要租用仍有效，它可以包含
  已登入的瀏覽器設定檔、`/var/cache/crabbox/pnpm`，以及已準備的原始碼
  checkout。
- Mantis 成品：由 OpenClaw 執行擁有。它們位於
  `.artifacts/qa-e2e/mantis/...` 底下，接著 GitHub Actions 會上傳它們，
  Mantis GitHub App 會在 PR 上留言行內證據。

絕不要把秘密、瀏覽器 Cookie、Slack 登入狀態、儲存庫 checkout、
`node_modules` 或 `dist/` 放進預先烘焙的提供者映像檔。

## GitHub 派發

從 `main` 執行 workflow：

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

允許的 `candidate_ref` 值刻意保持狹窄，因為 workflow
會使用即時憑證：目前 `main` 的祖先、release 標籤，或來自
`openclaw/openclaw` 的開放 PR head。

workflow 會寫入：

- 已上傳成品：`mantis-slack-desktop-smoke-<run-id>-<attempt>`；
- 來自 Mantis GitHub App 的行內 PR 留言；
- `slack-desktop-smoke.png`；
- `slack-desktop-smoke.mp4`；
- `slack-desktop-smoke-preview.gif`；
- `slack-desktop-smoke-change.mp4`；
- `mantis-slack-desktop-smoke-summary.json`；
- `mantis-slack-desktop-smoke-report.md`；
- 遠端記錄，例如 `slack-desktop-command.log`、`openclaw-gateway.log`、
  `chrome.log` 和 `ffmpeg.log`。

PR 留言會透過隱藏的
`<!-- mantis-slack-desktop-smoke -->` 標記原地更新。

## 本機 CLI

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

保留 VM 以便 VNC 救援：

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

重複使用暖租用：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

只有當重複使用的遠端工作區已經有 `node_modules` 和已建置的 `dist/`
時，才使用 `--hydrate-mode prehydrated`。如果缺少這些項目，Mantis 會封閉失敗。

## Hydrate 模式

| 模式          | 使用時機                                  | 遠端行為                                                                       | 取捨                                                     |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 一般 PR 證明、冷機器、CI                  | 在 VM 內執行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但提供最強的原始碼 checkout 證明                  |
| `prehydrated` | 你刻意準備了重複使用的租用                | 需要既有的 `node_modules` 和 `dist/`；略過安裝/建置                     | 快，但只適用於操作者控制的暖租用 |

GitHub Actions 一律會在 VM 執行前準備候選 checkout。它的
pnpm store 會依 OS、Node 版本和 lockfile 快取。VM 原始碼執行在存在時也會
使用 `/var/cache/crabbox/pnpm`。

## 時間判讀

`mantis-slack-desktop-smoke-report.md` 包含階段時間：

- `crabbox.warmup`：雲端提供者開機、桌面/瀏覽器就緒，以及 SSH。
- `crabbox.inspect`：租用中繼資料查詢。
- `credentials.prepare`：Convex 憑證租用取得。
- `crabbox.remote_run`：同步、瀏覽器啟動、OpenClaw 安裝/建置或
  hydrate 驗證、Gateway 啟動、截圖，以及影片擷取。
- `artifacts.copy`：從 VM rsync 回來。

當 Crabbox 在 Mantis 已複製證明 OpenClaw gateway 已存活且設定已完成的
中繼資料後回傳非零遠端狀態時，`crabbox.remote_run` 可能會標示為
`accepted`。請將 `accepted` 視為帶有說明的通過，
而不是失敗的情境。

如果執行很慢：

- warmup 佔主要時間：預先烘焙或提升更好的 Crabbox 提供者映像檔；
- `source` 中 remote_run 佔主要時間：使用暖租用、改善 pnpm store 重用，
  或將機器先決條件移進提供者映像檔；
- `prehydrated` 中 remote_run 佔主要時間：遠端工作區其實尚未就緒，
  或 Gateway/瀏覽器/Slack 設定很慢；
- 成品複製佔主要時間：檢查影片大小和成品目錄內容。

## 證據檢查清單

良好的 PR 留言應顯示：

- 情境 id 和候選 SHA；
- GitHub Actions 執行 URL；
- 成品 URL；
- 行內截圖；
- 可用時的行內動畫預覽；
- 完整 MP4 和修剪後 MP4 連結；
- 通過/失敗狀態；
- 附加報告中的時間摘要。

不要將截圖或影片提交進儲存庫。請將它們保留在 GitHub
Actions 成品或 PR 留言中。

## 失敗處理

如果 workflow 在 VM 執行前失敗，請先檢查 Actions job。典型原因包括
不受信任的 `candidate_ref`、缺少環境秘密，或候選安裝/建置失敗。

如果 VM 執行失敗但截圖已複製回來，請檢查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果執行保留了租用，請使用報告中的 `crabbox vnc ...` 命令開啟 VNC。
完成後停止租用：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登入已過期，請在保留租用的 VNC 中修復它，並使用
`--lease-id` 重新執行。不要把該瀏覽器設定檔烘焙進提供者映像檔。

相關文件：

- [QA 概覽](qa-e2e-automation.md)
- [Slack 頻道](../channels/slack.md)
- [測試](../help/testing.md)
