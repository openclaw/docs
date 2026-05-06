---
read_when:
    - 修改媒體管線或附件
summary: 傳送、Gateway 和代理回覆的圖片與媒體處理規則
title: 圖片與媒體支援
x-i18n:
    generated_at: "2026-05-06T02:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# 影像與媒體支援 (2025-12-05)

WhatsApp 通道透過 **Baileys Web** 執行。本文記錄目前針對傳送、Gateway 與代理回覆的媒體處理規則。

## 目標

- 透過 `openclaw message send --media` 傳送媒體，並可選擇附上說明文字。
- 允許來自網頁收件匣的自動回覆在文字旁包含媒體。
- 讓各類型限制保持合理且可預期。

## CLI 介面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 為選用；若只傳送媒體，說明文字可以為空。
  - `--dry-run` 會印出解析後的 payload；`--json` 會輸出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 通道行為

- 輸入：本機檔案路徑**或** HTTP(S) URL。
- 流程：載入為 Buffer、偵測媒體種類，並建立正確的 payload：
  - **影像：** 調整大小並重新壓縮為 JPEG（最長邊 2048px），目標為 `channels.whatsapp.mediaMaxMb`（預設：50 MB）。
  - **音訊/語音/影片：** 最高 16 MB 直接傳遞；音訊會以語音訊息傳送（`ptt: true`）。
  - **文件：** 其他任何項目，最高 100 MB，並在可用時保留檔名。
- WhatsApp GIF 樣式播放：傳送帶有 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），讓行動用戶端可內嵌循環播放。
- MIME 偵測優先使用魔術位元組，其次為標頭，最後為副檔名。
- 說明文字來自 `--message` 或 `reply.text`；允許空白說明文字。
- 記錄：非詳細模式顯示 `↩️`/`✅`；詳細模式包含大小與來源路徑/URL。

## 自動回覆流程

- `getReplyFromConfig` 會回傳 `{ text?, mediaUrl?, mediaUrls? }`。
- 當存在媒體時，網頁傳送端會使用與 `openclaw message send` 相同的流程解析本機路徑或 URL。
- 若提供多個媒體項目，會依序傳送。

## 傳入媒體至命令 (Pi)

- 當傳入的網頁訊息包含媒體時，OpenClaw 會下載到暫存檔案，並公開樣板變數：
  - `{{MediaUrl}}` 傳入媒體的偽 URL。
  - `{{MediaPath}}` 執行命令前寫入的本機暫存路徑。
- 啟用每個工作階段的 Docker 沙盒時，傳入媒體會被複製到沙盒工作區，且 `MediaPath`/`MediaUrl` 會重寫為類似 `media/inbound/<filename>` 的相對路徑。
- 媒體理解（若透過 `tools.media.*` 或共用的 `tools.media.models` 設定）會在樣板化之前執行，並可將 `[Image]`、`[Audio]` 與 `[Video]` 區塊插入 `Body`。
  - 音訊會設定 `{{Transcript}}`，並使用轉錄內容進行命令解析，因此斜線命令仍可運作。
  - 影片與影像描述會保留任何說明文字以供命令解析。
  - 如果作用中的主要影像模型已原生支援視覺能力，OpenClaw 會略過 `[Image]` 摘要區塊，改將原始影像傳給模型。
- 預設只會處理第一個符合的影像/音訊/影片附件；設定 `tools.media.<cap>.attachments` 可處理多個附件。

## 限制與錯誤

**傳出傳送上限（WhatsApp 網頁傳送）**

- 影像：重新壓縮後最高為 `channels.whatsapp.mediaMaxMb`（預設：50 MB）。
- 音訊/語音/影片：16 MB 上限；文件：100 MB 上限。
- 過大或無法讀取的媒體 → 在記錄中顯示明確錯誤，並略過該回覆。

**媒體理解上限（轉錄/描述）**

- 影像預設：10 MB（`tools.media.image.maxBytes`）。
- 音訊預設：20 MB（`tools.media.audio.maxBytes`）。
- 影片預設：50 MB（`tools.media.video.maxBytes`）。
- 過大的媒體會略過理解，但回覆仍會使用原始內文送出。

## 測試注意事項

- 涵蓋影像/音訊/文件案例的傳送與回覆流程。
- 驗證影像重新壓縮（大小界限）與音訊的語音訊息旗標。
- 確保多媒體回覆會展開為依序傳送。

## 相關

- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊與語音訊息](/zh-TW/nodes/audio)
