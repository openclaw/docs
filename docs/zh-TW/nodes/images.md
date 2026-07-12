---
read_when:
    - 修改媒體管線或附件
summary: 傳送、閘道及代理回覆的圖片與媒體處理規則
title: 圖片與媒體支援
x-i18n:
    generated_at: "2026-07-11T21:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 頻道透過 Baileys Web 運作。本頁說明傳送、閘道與代理回覆的媒體處理規則。

## 目標

- 透過 `openclaw message send --media` 傳送媒體，並可選擇附加說明文字。
- 允許來自網頁收件匣的自動回覆同時包含媒體與文字。
- 讓各類型的限制合理且可預期。

## 命令列介面介面

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — 附加媒體（圖片／音訊／影片／文件）；接受本機路徑或 URL。此項為選填；僅傳送媒體時，說明文字可留空。
- `--gif-playback` — 將影片媒體視為 GIF 播放（僅限 WhatsApp）。
- `--force-document` — 將媒體以文件形式傳送，以避免頻道壓縮（Telegram、WhatsApp）；適用於圖片、GIF 與影片。
- `--reply-to <id>`、`--thread-id <id>`、`--pin`、`--silent` — 與純文字傳送共用的遞送／討論串選項。
- `--dry-run` — 印出解析後的承載資料並略過傳送。
- `--json` — 以 JSON 印出結果：`{ action, channel, dryRun, handledBy, messageId?, payload }`（`payload` 包含頻道特定的傳送結果，包括任何媒體參照）。

## WhatsApp Web 頻道行為

- 輸入：本機檔案路徑**或** HTTP(S) URL。
- 流程：載入至緩衝區、偵測媒體類型，然後依類型建立外送承載資料：
  - **圖片：**最佳化至低於 `channels.whatsapp.mediaMaxMb`（預設 50MB）。不透明圖片會重新壓縮為 JPEG（預設邊長階梯從 2048px 開始，若反覆未達大小限制則逐步降低）；含透明度的圖片則保留為 PNG。如果來源已是符合大小與邊長預算的可接受 JPEG／PNG／WebP，則會原封不動保留原始位元組，而不重新壓縮。動畫 GIF 絕不重新編碼，只檢查大小。
  - **音訊／語音：**除非已是原生語音音訊（`.ogg`／`.opus`，或 `audio/ogg`／`audio/opus`），否則外送音訊會在傳送前透過 `ffmpeg` 轉碼為 Opus／OGG（48kHz 單聲道、64kbps、最長 20 分鐘），並以語音訊息（`ptt: true`）傳送。
  - **影片：**不經處理直接傳送，上限為 16MB。
  - **文件：**其他所有內容，上限為 100MB；若有檔名則予以保留。
- WhatsApp GIF 樣式播放：傳送含 `gifPlayback: true` 的 MP4（命令列介面：`--gif-playback`），讓行動用戶端在行內循環播放。
- MIME 偵測會優先採用從魔術位元組識別出的結果，其次為副檔名，最後才是回應標頭；一般性的容器識別結果（`application/octet-stream`、`zip`）絕不會覆寫更明確的副檔名對應（例如 XLSX 與 ZIP）。
- 說明文字來自 `--message` 或 `reply.text`；允許空白說明文字。
- 記錄：非詳細模式顯示 `↩️`／`✅`；詳細模式包含大小與來源路徑／URL。

<Note>
上述 16MB 音訊／影片與 100MB 文件數值，是未傳入明確位元組上限時，依媒體類型共用的預設值。WhatsApp 傳送會使用 `channels.whatsapp.mediaMaxMb` 設定明確上限（預設 50MB），並針對該帳號一致套用至所有媒體類型。
</Note>

## 自動回覆管線

- `getReplyFromConfig` 會傳回回覆承載資料（或承載資料陣列），其中包含 `text?`、`mediaUrl?`、`mediaUrls?` 等欄位。
- 存在媒體時，網頁傳送端會使用與 `openclaw message send` 相同的管線解析本機路徑或 URL。
- 若提供多個媒體項目，會依序傳送。

## 將傳入媒體提供給命令

- 當傳入的網頁訊息包含媒體時，OpenClaw 會將其下載至暫存檔案，並公開以下範本變數：
  - `{{MediaUrl}}` — 傳入媒體的虛擬 URL。
  - `{{MediaPath}}` — 執行命令前寫入的本機暫存路徑。
- 啟用個別工作階段的 Docker 沙箱時，傳入媒體會複製到沙箱工作區，且 `MediaPath`／`MediaUrl` 會改寫為沙箱相對路徑，例如 `media/inbound/<filename>`。
- 媒體理解（透過 `tools.media.*` 或共用的 `tools.media.models` 設定）會在套用範本前執行，並可將 `[Image]`、`[Audio]` 與 `[Video]` 區塊插入 `Body`。
  - 音訊會設定 `{{Transcript}}`，並使用逐字稿進行命令解析，讓斜線命令仍可運作。
  - 影片與圖片描述會保留任何說明文字，以供命令解析使用。
  - 如果目前使用的主要模型已原生支援視覺功能，OpenClaw 會略過 `[Image]` 摘要區塊，改為直接將原始圖片傳給模型。
- 預設只處理第一個符合的圖片／音訊／影片附件；設定 `tools.media.<capability>.attachments` 可處理多個附件。

## 限制與錯誤

**外送傳送上限（WhatsApp Web 傳送）**

- 圖片：最佳化後，上限為 `channels.whatsapp.mediaMaxMb`（預設 50MB）。
- 音訊／影片：上限 16MB（共用預設值；透過 WhatsApp 傳送時由 `mediaMaxMb` 覆寫）。
- 文件：上限 100MB（共用預設值；透過 WhatsApp 傳送時由 `mediaMaxMb` 覆寫）。
- 過大或無法讀取的媒體會在記錄中產生明確錯誤，並略過該回覆。

**媒體理解上限（轉錄／描述）**

- 圖片預設值：10MB（`tools.media.image.maxBytes`）。
- 音訊預設值：20MB（`tools.media.audio.maxBytes`）。
- 影片預設值：50MB（`tools.media.video.maxBytes`）。
- 過大的媒體會略過理解處理，但仍會使用原始本文送出回覆。

## 測試注意事項

- 涵蓋圖片／音訊／文件案例的傳送與回覆流程。
- 驗證圖片最佳化後的大小界限，以及音訊的語音訊息旗標。
- 確保含多個媒體的回覆會展開為依序傳送。

## 相關內容

- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊與語音訊息](/zh-TW/nodes/audio)
