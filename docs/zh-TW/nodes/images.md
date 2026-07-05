---
read_when:
    - 修改媒體管線或附件
summary: 傳送、閘道和代理回覆的圖片與媒體處理規則
title: 影像與媒體支援
x-i18n:
    generated_at: "2026-07-05T11:28:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 通道執行於 Baileys Web。本頁說明傳送、閘道與代理回覆的媒體處理規則。

## 目標

- 透過 `openclaw message send --media` 傳送媒體並可附上選用標題。
- 允許來自 Web 收件匣的自動回覆在文字旁包含媒體。
- 保持各類型限制合理且可預期。

## 命令列介面介面

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — 附加媒體（圖片/音訊/影片/文件）；接受本機路徑或 URL。選用；純媒體傳送時標題可為空。
- `--gif-playback` — 將影片媒體視為 GIF 播放（僅 WhatsApp）。
- `--force-document` — 將媒體作為文件傳送，以避免通道壓縮（Telegram、WhatsApp）；適用於圖片、GIF 和影片。
- `--reply-to <id>`、`--thread-id <id>`、`--pin`、`--silent` — 與純文字傳送共用的傳遞/討論串選項。
- `--dry-run` — 列印解析後的承載內容並略過傳送。
- `--json` — 將結果列印為 JSON：`{ action, channel, dryRun, handledBy, messageId?, payload }`（`payload` 帶有通道特定的傳送結果，包含任何媒體參照）。

## WhatsApp Web 通道行為

- 輸入：本機檔案路徑**或** HTTP(S) URL。
- 流程：載入至緩衝區、偵測媒體種類，然後依種類建立外送承載內容：
  - **圖片：** 最佳化以符合 `channels.whatsapp.mediaMaxMb` 以下（預設 50MB）。不透明圖片會重新壓縮為 JPEG（預設邊長階梯從 2048px 開始，重複超過大小時向下遞減）；具透明度的圖片會保留為 PNG。如果來源已是符合大小與邊長預算的可接受 JPEG/PNG/WebP，原始位元組會保持不變，而不是重新壓縮。動畫 GIF 絕不會重新編碼，只會檢查大小。
  - **音訊/語音：** 除非已是原生語音音訊（`.ogg`/`.opus`，或 `audio/ogg`/`audio/opus`），否則外送音訊會先透過 `ffmpeg` 轉碼為 Opus/OGG（48kHz 單聲道、64kbps、上限 20 分鐘），再作為語音備忘（`ptt: true`）傳送。
  - **影片：** 16MB 以內直通。
  - **文件：** 其他任何內容，上限 100MB，可用時保留檔名。
- WhatsApp GIF 樣式播放：傳送帶有 `gifPlayback: true` 的 MP4（命令列介面：`--gif-playback`），讓行動用戶端在行內循環播放。
- MIME 偵測優先使用嗅探到的魔術位元組，其次是副檔名，再其次是回應標頭；一般性的嗅探容器（`application/octet-stream`、`zip`）絕不會覆蓋更具體的副檔名對應（例如 XLSX 與 ZIP）。
- 標題來自 `--message` 或 `reply.text`；允許空標題。
- 記錄：非詳細模式顯示 `↩️`/`✅`；詳細模式包含大小與來源路徑/URL。

<Note>
上述 16MB 音訊/影片與 100MB 文件數值，是未傳入明確位元組上限時使用的共用各類型媒體預設值。WhatsApp 傳送會從 `channels.whatsapp.mediaMaxMb` 設定明確上限（預設 50MB），並對該帳號的各種類型一律套用。
</Note>

## 自動回覆管線

- `getReplyFromConfig` 會傳回回覆承載內容（或承載內容陣列），其中包含 `text?`、`mediaUrl?` 和 `mediaUrls?` 等欄位。
- 媒體存在時，Web 傳送器會使用與 `openclaw message send` 相同的管線解析本機路徑或 URL。
- 若提供多個媒體項目，會依序傳送。

## 傳入媒體轉命令

- 當傳入 Web 訊息包含媒體時，OpenClaw 會將其下載至暫存檔，並公開範本變數：
  - `{{MediaUrl}}` — 傳入媒體的偽 URL。
  - `{{MediaPath}}` — 執行命令前寫入的本機暫存路徑。
- 啟用每工作階段 Docker 沙箱時，傳入媒體會複製到沙箱工作區，且 `MediaPath`/`MediaUrl` 會重寫為沙箱相對路徑，例如 `media/inbound/<filename>`。
- 媒體理解（透過 `tools.media.*` 或共用 `tools.media.models` 設定）會在範本處理前執行，並可將 `[Image]`、`[Audio]` 和 `[Video]` 區塊插入 `Body`。
  - 音訊會設定 `{{Transcript}}`，並使用轉錄稿進行命令解析，因此斜線命令仍可運作。
  - 影片和圖片描述會保留任何標題文字供命令解析。
  - 如果使用中的主要模型已原生支援視覺，OpenClaw 會略過 `[Image]` 摘要區塊，改將原始圖片傳給模型。
- 預設只會處理第一個符合的圖片/音訊/影片附件；設定 `tools.media.<capability>.attachments` 可處理多個附件。

## 限制與錯誤

**外送傳送上限（WhatsApp Web 傳送）**

- 圖片：最佳化後最高 `channels.whatsapp.mediaMaxMb`（預設 50MB）。
- 音訊/影片：16MB 上限（共用預設；透過 WhatsApp 傳送時由 `mediaMaxMb` 覆寫）。
- 文件：100MB 上限（共用預設；透過 WhatsApp 傳送時由 `mediaMaxMb` 覆寫）。
- 過大或無法讀取的媒體會在記錄中產生清楚錯誤，且略過該回覆。

**媒體理解上限（轉錄/描述）**

- 圖片預設：10MB（`tools.media.image.maxBytes`）。
- 音訊預設：20MB（`tools.media.audio.maxBytes`）。
- 影片預設：50MB（`tools.media.video.maxBytes`）。
- 過大的媒體會略過理解，但回覆仍會以原始本文送出。

## 測試注意事項

- 涵蓋圖片/音訊/文件案例的傳送與回覆流程。
- 驗證圖片最佳化後的大小界限，以及音訊的語音備忘旗標。
- 確保多媒體回覆會展開為依序傳送。

## 相關

- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊與語音備忘](/zh-TW/nodes/audio)
