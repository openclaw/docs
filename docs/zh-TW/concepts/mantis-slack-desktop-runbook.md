---
read_when:
    - 從 GitHub 或本機執行 Mantis Slack 桌面 QA
    - 偵錯緩慢的 Mantis Slack 桌面執行流程
    - 選擇來源、預先水合或暖租用模式
    - 將螢幕截圖與影片證據發布到 PR
summary: Mantis Slack 桌面 QA 的操作員執行手冊：GitHub 派發、本機命令列介面、暖啟 VNC 租約、hydrate 模式、時序解讀、成品與失敗處理。
title: Mantis Slack 桌面版作業手冊
x-i18n:
    generated_at: "2026-06-27T19:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是用於 Slack 類錯誤的真實 UI 路徑，這類錯誤需要
Linux 桌面、VNC 救援、Slack Web、真實的 OpenClaw 閘道、螢幕截圖、
影片，以及 PR 證據留言。

當單元測試或無頭 Slack 即時路徑無法證明錯誤時使用它。

## 儲存模型

Mantis 使用三種不同的儲存層：

- 供應者映像檔：由 Crabbox 擁有，並儲存在雲端供應者帳戶中。
  它包含機器能力，例如 Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生建置工具，以及空的快取目錄。
- 暖租約狀態：由目前的操作者工作階段擁有。租約存活期間，它可以包含
  已登入的瀏覽器設定檔、`/var/cache/crabbox/pnpm`，以及準備好的原始碼
  checkout。
- Mantis 成品：由 OpenClaw 執行擁有。它們位於
  `.artifacts/qa-e2e/mantis/...` 底下，接著 GitHub Actions 會上傳它們，
  而 Mantis GitHub App 會在 PR 上留言行內證據。

絕不要把秘密、瀏覽器 Cookie、Slack 登入狀態、儲存庫 checkout、
`node_modules` 或 `dist/` 放入預先烘焙的供應者映像檔。

## GitHub 派送

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

允許的 `candidate_ref` 值刻意設得很窄，因為工作流程會使用即時憑證：
目前 `main` 的祖先、發布標籤，或來自 `openclaw/openclaw` 的開放 PR head。

工作流程會寫入：

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
`<!-- mantis-slack-desktop-smoke -->` 標記就地更新。

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

保留 VM 以供 VNC 救援：

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

只有在重用的遠端工作區已經有 `node_modules` 和建置完成的 `dist/` 時，
才使用 `--hydrate-mode prehydrated`。如果缺少這些項目，Mantis 會直接拒絕並失敗。

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

核准檢查點模式與 `--gateway-setup` 互斥。除非你傳入明確的核准檢查點
`--scenario` 旗標，否則它會執行選擇加入的 `slack-approval-exec-native` 和
`slack-approval-plugin-native` 情境；其他 Slack 情境會在 VM 啟動前被拒絕。
Slack QA 執行器會從它觀察到的真實 Slack API 訊息寫入每個檢查點 JSON 檔案，
接著遠端 watcher 會將該訊息快照渲染到
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`。如果任何檢查點 JSON、
訊息證據、ack JSON 或渲染出的螢幕截圖缺少或為空，執行就會失敗。

冷 GitHub Actions 租約沒有 Slack Web Cookie，因此瀏覽器擷取可能會停在 Slack 登入。
對於核准檢查點證明，請信任渲染出的檢查點影像和 Slack QA 成品，而不是
`slack-desktop-smoke.png`。只有在瀏覽器螢幕截圖本身必須顯示 Slack Web 時，
才使用手動登入 Slack Web 設定檔的已保留暖租約。

## Hydrate 模式

| 模式          | 使用時機                                  | 遠端行為                                                                       | 取捨                                                     |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 一般 PR 證明、冷機器、CI                 | 在 VM 內執行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但原始碼 checkout 證明最強                        |
| `prehydrated` | 你刻意準備了重用租約                     | 需要既有的 `node_modules` 和 `dist/`；略過安裝/建置                    | 快速，但只適用於操作者控制的暖租約 |

GitHub Actions 一律會在 VM 執行前準備候選 checkout。其 pnpm store 會依 OS、
Node 版本和 lockfile 快取。VM 原始碼執行在存在時也會使用
`/var/cache/crabbox/pnpm`。

## 時間解讀

`mantis-slack-desktop-smoke-report.md` 包含階段時間：

- `crabbox.warmup`：雲端供應者開機、桌面/瀏覽器就緒，以及 SSH。
- `crabbox.inspect`：租約中繼資料查詢。
- `credentials.prepare`：Convex 憑證租約取得。
- `crabbox.remote_run`：同步、瀏覽器啟動、OpenClaw 安裝/建置或
  hydrate 驗證、閘道啟動、螢幕截圖，以及影片擷取。
- `artifacts.copy`：從 VM rsync 回來。

當 Crabbox 在 Mantis 已複製中繼資料，證明 OpenClaw 閘道設定已完成或 Slack QA
命令本身已成功退出後，回傳非零遠端狀態時，`crabbox.remote_run` 可以標記為
`accepted`。請將 `accepted` 視為附帶說明的通過，而不是失敗的情境。

如果執行很慢：

- warmup 佔主因：預先烘焙或提升更好的 Crabbox 供應者映像檔；
- remote_run 在 `source` 中佔主因：使用暖租約、改善 pnpm store 重用，
  或將機器先決條件移入供應者映像檔；
- remote_run 在 `prehydrated` 中佔主因：遠端工作區其實尚未就緒，
  或閘道/瀏覽器/Slack 設定很慢；
- 成品複製佔主因：檢查影片大小和成品目錄內容。

## 證據檢查清單

良好的 PR 留言應顯示：

- 情境 ID 和候選 SHA；
- GitHub Actions 執行 URL；
- 成品 URL；
- 行內核准檢查點螢幕截圖，或來自已登入暖租約的 Slack Web 螢幕截圖；
- 可用時的行內動畫預覽；
- 完整 MP4 和裁剪後 MP4 連結；
- 通過/失敗狀態；
- 附加報告中的時間摘要。

不要將螢幕截圖或影片提交到儲存庫。請將它們保留在 GitHub Actions 成品或 PR 留言中。

## 失敗處理

如果工作流程在 VM 執行前失敗，請先檢查 Actions 作業。常見原因包括
不受信任的 `candidate_ref`、缺少環境秘密，或候選項目安裝/建置失敗。

如果 VM 執行失敗但螢幕截圖已複製回來，請檢查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果執行保留了租約，請使用報告中的 `crabbox vnc ...` 命令開啟 VNC。
完成後停止租約：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登入已過期，請在保留租約上的 VNC 中修復，並使用
`--lease-id` 重新執行。不要將該瀏覽器設定檔烘焙進供應者映像檔。

## 相關

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation)
- [Slack 頻道](/zh-TW/channels/slack)
- [測試](/zh-TW/help/testing)
