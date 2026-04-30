---
read_when:
    - 修改媒體管線或附件
summary: 傳送、Gateway 和代理程式回覆的影像與媒體處理規則
title: 圖片與媒體支援
x-i18n:
    generated_at: "2026-04-30T03:17:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# 圖片與媒體支援 (2025-12-05)

WhatsApp 頻道透過 **Baileys Web** 執行。本文件記錄傳送、Gateway 與代理回覆目前的媒體處理規則。

## 目標

- 透過 `openclaw message send --media` 傳送可選附註說明的媒體。
- 允許來自網頁收件匣的自動回覆在文字旁包含媒體。
- 讓各類型限制保持合理且可預測。

## CLI 介面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 為可選；純媒體傳送時附註說明可以為空。
  - `--dry-run` 會列印解析後的 payload；`--json` 會輸出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 頻道行為

- 輸入：本機檔案路徑**或** HTTP(S) URL。
- 流程：載入到 Buffer、偵測媒體種類，並建構正確的 payload：
  - **圖片：**調整大小並重新壓縮為 JPEG（最長邊 2048px），目標為 `channels.whatsapp.mediaMaxMb`（預設：50 MB）。
  - **音訊/語音/影片：**原樣傳送，最高 16 MB；音訊會以語音訊息傳送（`ptt: true`）。
  - **文件：**其他任何內容，最高 100 MB，可用時保留檔名。
- WhatsApp GIF 風格播放：傳送帶有 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），讓行動用戶端在行內循環播放。
- MIME 偵測優先使用 magic bytes，然後是標頭，最後是副檔名。
- 附註說明來自 `--message` 或 `reply.text`；允許空附註說明。
- 記錄：非詳細模式顯示 `↩️`/`✅`；詳細模式包含大小與來源路徑/URL。

## 自動回覆管線

- `getReplyFromConfig` 回傳 `{ text?, mediaUrl?, mediaUrls? }`。
- 存在媒體時，網頁傳送端會使用與 `openclaw message send` 相同的管線解析本機路徑或 URL。
- 如果提供多個媒體項目，會依序傳送。

## 傳入媒體至命令 (Pi)

- 當傳入的網頁訊息包含媒體時，OpenClaw 會下載到暫存檔，並公開樣板變數：
  - `{{MediaUrl}}` 傳入媒體的虛擬 URL。
  - `{{MediaPath}}` 執行命令前寫入的本機暫存路徑。
- 啟用每工作階段 Docker 沙箱時，傳入媒體會複製到沙箱工作區，且 `MediaPath`/`MediaUrl` 會改寫為像 `media/inbound/<filename>` 這樣的相對路徑。
- 媒體理解（如果透過 `tools.media.*` 或共用的 `tools.media.models` 設定）會在樣板處理前執行，並可將 `[Image]`、`[Audio]` 與 `[Video]` 區塊插入 `Body`。
  - 音訊會設定 `{{Transcript}}`，並使用逐字稿進行命令解析，因此斜線命令仍可運作。
  - 影片和圖片描述會保留任何附註文字，以供命令解析。
  - 如果作用中的主要圖片模型已原生支援視覺，OpenClaw 會略過 `[Image]` 摘要區塊，改為將原始圖片傳遞給模型。
- 預設只會處理第一個符合的圖片/音訊/影片附件；設定 `tools.media.<cap>.attachments` 可處理多個附件。

## 限制與錯誤

**對外傳送上限（WhatsApp 網頁傳送）**

- 圖片：重新壓縮後最高為 `channels.whatsapp.mediaMaxMb`（預設：50 MB）。
- 音訊/語音/影片：16 MB 上限；文件：100 MB 上限。
- 過大或無法讀取的媒體 → 記錄中顯示明確錯誤，並略過該回覆。

**媒體理解上限（轉錄/描述）**

- 圖片預設：10 MB (`tools.media.image.maxBytes`)。
- 音訊預設：20 MB (`tools.media.audio.maxBytes`)。
- 影片預設：50 MB (`tools.media.video.maxBytes`)。
- 過大的媒體會略過理解，但回覆仍會以原始本文送出。

## 測試注意事項

- 涵蓋圖片/音訊/文件案例的傳送與回覆流程。
- 驗證圖片重新壓縮（大小界限）與音訊語音訊息旗標。
- 確保多媒體回覆會展開為依序傳送。

## 相關

- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊與語音訊息](/zh-TW/nodes/audio)
