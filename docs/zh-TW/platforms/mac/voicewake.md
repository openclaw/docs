---
read_when:
    - 處理語音喚醒或按鍵通話路徑
summary: Mac 應用程式中的語音喚醒、按住說話模式及路由詳細資訊
title: 語音喚醒（macOS）
x-i18n:
    generated_at: "2026-07-11T21:30:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# 語音喚醒與按住說話

## 系統需求

語音喚醒與按住說話需要 macOS 26 或更新版本。在較舊的 macOS 上，相關控制項會從「語音」設定頁面隱藏，並改為顯示需要 macOS 26。

## 模式

- **喚醒詞模式**（預設）：持續啟用的語音辨識器會等待觸發詞元（`swabbleTriggerWords`）。匹配時會開始擷取、顯示含有部分文字的浮層，並在靜音後自動傳送。
- **按住說話（按住右側 Option 鍵）**：按住右側 Option 鍵即可立即擷取，不需要觸發詞。按住期間會顯示浮層；放開後會完成擷取，並在短暫延遲後轉送，讓你可以編輯文字。

## 執行階段行為（喚醒詞）

- 辨識器位於 `VoiceWakeRuntime`。
- 只有在喚醒詞與下一個詞之間出現明顯停頓時，才會觸發（`triggerPauseWindow` = 0.55 秒）。即使指令尚未開始，浮層／提示音也可在停頓時啟動。
- 靜音時間窗：語音持續輸入時為 2.0 秒（`silenceWindow`）；若只聽到觸發詞，則為 5.0 秒（`triggerOnlySilenceWindow`）。
- 強制停止：120 秒（`captureHardStop`），以防止工作階段失控。
- 工作階段之間的防彈跳時間：傳送後 350 毫秒（`debounceAfterSend`）。
- 浮層由 `VoiceWakeOverlayController` 驅動，並以不同顏色呈現已確認／暫定文字。
- 傳送後，辨識器會正常重新啟動，以聆聽下一個觸發詞。

## 生命週期不變條件

- 若已啟用語音喚醒且授予權限，喚醒詞辨識器會持續聆聽，但進行中的按住說話擷取期間除外。
- 關閉浮層時（包括使用 X 按鈕手動關閉），一律會恢復辨識器：`VoiceSessionCoordinator.overlayDidDismiss` 會在每條關閉路徑上呼叫 `VoiceWakeRuntime.refresh(state:)`。工作階段／權杖模型請參閱[語音浮層](/zh-TW/platforms/mac/voice-overlay)。

## 按住說話的詳細行為

- 快速鍵偵測使用全域 `.flagsChanged` 監聽器來偵測右側 Option 鍵（`keyCode 61` + `.option`）。它只會觀察事件，絕不攔截事件。
- 擷取功能位於 `VoicePushToTalk`：立即啟動語音辨識、將部分結果串流至浮層，並在放開按鍵時呼叫 `VoiceWakeForwarder`。
- 開始按住說話時，會暫停喚醒詞執行階段，以避免音訊擷取互相衝突；放開後會自動重新啟動。
- 權限：需要麥克風與語音辨識權限；接收按鍵事件則需要核准輔助使用／輸入監控權限。
- 外接鍵盤：部分鍵盤可能不會如預期公開右側 Option 鍵。若使用者回報無法偵測，請提供備用快速鍵。

## 使用者設定

- **語音喚醒**切換開關：啟用喚醒詞執行階段。
- **按住右側 Option 鍵說話**：啟用按住說話監聽器。
- 語言與麥克風選擇器、即時音量計、觸發詞表格，以及測試器（僅在本機執行，絕不轉送）。
- 若裝置中斷連線，麥克風選擇器會保留上次的選擇、顯示中斷連線提示，並暫時改用系統預設裝置，直到該裝置重新連線。
- **音效**：偵測到觸發詞與傳送時播放提示音，預設使用 macOS 的「Glass」系統音效。每個事件都可選擇任何能由 `NSSound` 載入的檔案（例如 MP3/WAV/AIFF），或選擇 **無音效**。

## 轉送行為

- 轉送時，若已設定作用中的 WebChat 工作階段金鑰，`VoiceWakeForwarder.selectedSessionOptions` 會選用該金鑰；否則會選用閘道的主要工作階段金鑰。
- 它會透過 `sessions.list` 查詢該工作階段，並從工作階段的傳遞內容推導傳遞頻道與目標（依序回退至其上一個頻道／目標，再回退至解析後的工作階段金鑰）；若皆無法解析，則預設使用 WebChat。
- 若傳遞失敗，系統會記錄錯誤（`voicewake.forward` 類別），且仍可透過 WebChat／工作階段記錄查看該次執行。

## 轉送承載資料

- `VoiceWakeForwarder.prefixedTranscript(_:)` 會在逐字稿前加上機器提示行（解析後的主機名稱，若無法解析則回退為「這台 Mac」）；喚醒詞與按住說話路徑共用此行為。

## 快速驗證

- 開啟按住說話、按住右側 Option 鍵、說話後放開：浮層應先顯示部分結果，接著傳送。
- 按住期間，選單列的耳朵圖示應維持放大（`triggerVoiceEars(ttl: nil)`）；放開後則會縮小。

## 相關內容

- [語音喚醒](/zh-TW/nodes/voicewake)
- [語音浮層](/zh-TW/platforms/mac/voice-overlay)
- [macOS 應用程式](/zh-TW/platforms/macos)
