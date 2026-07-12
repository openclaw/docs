---
read_when:
    - 從 GitHub 或本機執行 Mantis Slack 桌面版品質保證測試
    - 偵錯緩慢的 Mantis Slack 桌面版執行作業
    - 選擇原始碼、預先準備或暖租約模式
    - 將螢幕截圖與影片證據發布至 PR
summary: Mantis Slack 桌面版品質保證的操作手冊：GitHub 派送、本機命令列介面、預熱的 VNC 租用環境、環境注入模式、時間判讀、成品與失敗處理。
title: Mantis Slack 桌面版操作手冊
x-i18n:
    generated_at: "2026-07-11T21:17:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面版品質保證是針對 Slack 類型錯誤的真實介面測試管道，適用於需要
Linux 桌面、VNC 救援、Slack Web、真實 OpenClaw 閘道、螢幕截圖、
影片及 PR 證據留言的情況。當單元測試或無頭模式的
Slack 即時測試管道無法證明錯誤時，請使用此管道。

## 儲存模型

Mantis 使用三個儲存層：

- **供應商映像檔** - 由 Crabbox 擁有，儲存於雲端供應商帳戶中。
  包含機器功能（Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生建置工具）及空白快取目錄。
- **暖租約狀態** - 由目前的操作者工作階段擁有。在租約有效期間，可以保存
  已登入的瀏覽器設定檔、`/var/cache/crabbox/pnpm`，以及已準備好的原始碼
  簽出目錄。
- **Mantis 成品** - 由 OpenClaw 執行作業擁有。位於
  `.artifacts/qa-e2e/mantis/...` 下；GitHub Actions 會上傳這些成品，而 Mantis
  GitHub App 會在 PR 上留言附上內嵌證據。

絕不可將秘密、瀏覽器 Cookie、Slack 登入狀態、儲存庫簽出目錄、
`node_modules` 或 `dist/` 烘焙至供應商映像檔中。

## GitHub 分派

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

由於工作流程會使用即時憑證，因此 `candidate_ref` 受到限制：它
必須解析至目前 `main` 的祖先、發行標籤，或
`openclaw/openclaw` 中開啟中 PR 的最新提交。

工作流程會產生：

- 已上傳的成品 `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- 由 Mantis GitHub App 發布的內嵌 PR 留言
- `slack-desktop-smoke.png`、`slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`、`slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`、`mantis-slack-desktop-smoke-report.md`
- 遠端日誌：`slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log`、`ffmpeg.log`

PR 留言會透過隱藏的 `<!-- mantis-slack-desktop-smoke -->` 標記原地更新。

## 本機命令列介面

冷啟動原始碼證明：

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

保留虛擬機器以進行 VNC 救援：

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

重複使用暖租約：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

僅當重複使用的遠端工作區已經
具有 `node_modules` 和建置完成的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；否則 Mantis 會採取失敗關閉策略。

證明原生 Slack 核准介面：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` 與 `--gateway-setup` 互斥。除非你傳入明確的核准檢查點 `--scenario`，否則它會執行
選擇加入的 `slack-approval-exec-native` 和 `slack-approval-plugin-native`
情境；其他 Slack 情境會在虛擬機器啟動前遭拒。Slack 品質保證執行器會根據觀察到的真實 Slack API 訊息，
寫入每個檢查點 JSON 檔案，之後
遠端監看程式會將該訊息轉譯成
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`。如果任何
檢查點 JSON、訊息證據、確認 JSON 或轉譯後的螢幕截圖遺失
或為空，執行作業即告失敗。

冷啟動 GitHub Actions 租約沒有 Slack Web Cookie，因此其瀏覽器擷取畫面
可能會停在 Slack 登入畫面。針對核准檢查點證明，應信任
轉譯後的檢查點影像和 Slack 品質保證成品，而不是
`slack-desktop-smoke.png`。只有在瀏覽器螢幕截圖本身必須顯示
Slack Web 時，才使用已保留且已手動
登入 Slack Web 設定檔的暖租約。

## 補水模式

| 模式          | 使用時機                                  | 遠端行為                                                                       | 取捨                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 一般 PR 證明、冷啟動機器、持續整合        | 在虛擬機器內執行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但能提供最強的原始碼簽出證明                 |
| `prehydrated` | 你刻意準備了重複使用的租約 | 要求既有的 `node_modules` 和 `dist/`；略過安裝／建置                     | 快速，但僅適用於由操作者控制的暖租約 |

GitHub Actions 一律會在虛擬機器執行前準備候選簽出目錄。其
pnpm 儲存區會依作業系統、Node 版本及鎖定檔進行快取。虛擬機器的 `source` 執行作業
也會在 `/var/cache/crabbox/pnpm` 存在時重複使用它。

## 時間判讀

`mantis-slack-desktop-smoke-report.md` 包含各階段耗時：

- `crabbox.warmup` - 雲端供應商啟動、桌面／瀏覽器就緒、SSH。
- `crabbox.inspect` - 租約中繼資料查詢。
- `credentials.prepare` - 取得 Convex 憑證租約。
- `crabbox.remote_run` - 同步、啟動瀏覽器、安裝／建置 OpenClaw 或
  驗證補水狀態、啟動閘道、擷取螢幕截圖及影片。
- `artifacts.copy` - 從虛擬機器 rsync 回來。

當 Crabbox 傳回非零的
遠端狀態，但 Mantis 已複製可證明 OpenClaw 閘道
設定完成，或 Slack 品質保證命令本身成功結束的中繼資料時，`crabbox.remote_run` 可能會顯示 `accepted`。請將
`accepted` 視為附帶說明的通過，而不是失敗的情境。

如果執行作業很慢：

- 暖機耗時占比最高：預先烘焙或提升更好的 Crabbox 供應商映像檔。
- `source` 模式中的 `remote_run` 耗時占比最高：使用暖租約、改善 pnpm 儲存區
  重複使用，或將機器先決條件移入供應商映像檔。
- `prehydrated` 模式中的 `remote_run` 耗時占比最高：遠端工作區並未
  真正準備就緒，或閘道／瀏覽器／Slack 設定速度緩慢。
- 成品複製耗時占比最高：檢查影片大小及成品目錄內容。

## 證據檢查清單

良好的 PR 留言會顯示：

- 情境識別碼及候選 SHA
- GitHub Actions 執行作業網址及成品網址
- 內嵌的核准檢查點螢幕截圖，或來自
  已登入暖租約的 Slack Web 螢幕截圖
- 可用時的內嵌動畫預覽
- 完整 MP4 及裁剪後 MP4 的連結
- 通過／失敗狀態及報告的耗時摘要

不要將螢幕截圖或影片提交至儲存庫。請將它們保留在 GitHub
Actions 成品或 PR 留言中。

## 失敗處理

如果工作流程在虛擬機器執行前失敗，請先檢查 Actions 工作。
常見原因：不受信任的 `candidate_ref`、缺少環境秘密，或
候選項目的安裝／建置失敗。

如果虛擬機器執行失敗，但螢幕截圖已複製回來，請檢查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果執行作業保留了租約，請使用報告中的 `crabbox vnc ...`
命令開啟 VNC，完成後再停止租約：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登入已過期，請在保留的租約上透過 VNC 修復，並使用
`--lease-id` 重新執行。不要將該瀏覽器設定檔烘焙至供應商映像檔中。

## 相關內容

- [品質保證概覽](/zh-TW/concepts/qa-e2e-automation)
- [Slack 頻道](/zh-TW/channels/slack)
- [測試](/zh-TW/help/testing)
