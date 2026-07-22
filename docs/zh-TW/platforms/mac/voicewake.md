---
read_when:
    - 處理語音喚醒或 PTT 路徑
summary: Mac App 中的語音喚醒、按住說話模式與路由詳細資訊
title: 語音喚醒（macOS）
x-i18n:
    generated_at: "2026-07-21T22:40:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d3b2a01ee997b4158bf88b9ef54b1e523503722620f943d594323516619e7502
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# 語音喚醒與按住說話

## 系統需求

語音喚醒與按住說話需要 macOS 26 或更新版本。在較舊的 macOS 上，這些控制項會從語音設定頁面隱藏，改為顯示 macOS 26 的系統需求。

語音喚醒需要 Apple Speech 支援所選語言的裝置端辨識。當無法使用此僅限本機的功能時，應用程式會拒絕啟動被動喚醒詞監聽，且絕不會改用網路辨識。按住說話、對話模式與快速聊天聽寫都是明確的使用者操作，因此可能會使用 Apple Speech 網路服務，以涵蓋更多語言。

## 模式

- **喚醒詞模式**（預設）：持續開啟的裝置端 Speech 辨識器會等待觸發詞元（`swabbleTriggerWords`）。比對成功後，它會開始擷取、顯示含有部分文字的浮動視窗，並在靜音後自動傳送。
- **按住說話（按住右側 Option 鍵）**：按住右側 Option 鍵即可立即擷取，不需要觸發詞。按住期間會顯示浮動視窗；放開後會完成擷取，並在短暫延遲後轉送，讓你可以編輯文字。

## 執行階段行為（喚醒詞）

- 辨識器位於 `VoiceWakeRuntime`。
- 只有在喚醒詞與下一個詞之間出現明顯停頓時才會觸發（`triggerPauseWindow` = 0.55 秒）。即使命令尚未開始，浮動視窗／提示音也可以在停頓時啟動。
- 靜音時間範圍：語音持續時為 2.0 秒（`silenceWindow`）；如果只聽到觸發詞，則為 5.0 秒（`triggerOnlySilenceWindow`）。
- 強制停止：120 秒（`captureHardStop`），以防工作階段失控。
- 工作階段之間的防彈跳時間：傳送後 350 毫秒（`debounceAfterSend`）。
- 浮動視窗透過 `VoiceWakeOverlayController` 驅動，並以不同顏色顯示已確認／暫時文字。
- 傳送後，辨識器會重新乾淨啟動，以監聽下一個觸發詞。

## 生命週期不變條件

- 如果已啟用語音喚醒並授予權限，喚醒詞辨識器會持續監聽，但進行中的按住說話擷取期間除外。
- 關閉浮動視窗（包括透過 X 按鈕手動關閉）一律會恢復辨識器：`VoiceSessionCoordinator.overlayDidDismiss` 會在每條關閉路徑上呼叫 `VoiceWakeRuntime.refresh(state:)`。工作階段／權杖模型請參閱[語音浮動視窗](/zh-TW/platforms/mac/voice-overlay)。

## 按住說話的詳細資訊

- 快速鍵偵測使用全域 `.flagsChanged` 監視器來偵測右側 Option 鍵（`keyCode 61` + `.option`）。它只會觀察事件，絕不會攔截事件。
- 擷取功能位於 `VoicePushToTalk`：立即啟動 Speech、將部分結果串流至浮動視窗，並在放開按鍵時呼叫 `VoiceWakeForwarder`。
- 開始按住說話時會暫停喚醒詞執行階段，以避免音訊擷取互相衝突；放開後會自動重新啟動。
- 權限：需要麥克風與語音辨識權限；接收按鍵事件則需要輔助使用／輸入監控核准。
- 外接鍵盤：部分鍵盤不會如預期提供右側 Option 鍵。如果使用者回報偵測不到，請提供備用快速鍵。

## 使用者可見設定

- **語音喚醒**切換開關：啟用喚醒詞執行階段。
- **按住右側 Option 鍵以說話**：啟用按住說話監視器。
- 如果這台 Mac 不支援所選語言的裝置端辨識，語音喚醒會維持停用，但按住說話與對話模式仍可使用。
- 語言與麥克風選擇器、即時音量計、觸發詞表格，以及測試器（僅限本機，絕不轉送）。
- 如果裝置中斷連線，麥克風選擇器會保留上次的選項、顯示中斷連線提示，並暫時改用系統預設值，直到該裝置恢復連線。
- **音效**：偵測到觸發詞及傳送時播放提示音，預設使用 macOS 的 "Glass" 系統音效。每個事件都可以選擇任何 `NSSound` 可載入的檔案（例如 MP3／WAV／AIFF），或選擇 **No Sound**。

## 轉送行為

- 轉送時，如果已設定作用中的 WebChat 工作階段金鑰，`VoiceWakeForwarder.selectedSessionOptions` 會選擇該金鑰，否則會選擇閘道的主要工作階段金鑰。
- 它會透過 `sessions.list` 查詢該工作階段，並從工作階段的傳遞內容中取得傳遞頻道與目標（依序改用其上一個頻道／目標，再改用剖析後的工作階段金鑰）；如果無法解析任何項目，則預設使用 WebChat。
- 如果傳遞失敗，系統會記錄錯誤（`voicewake.forward` 類別），而且仍可透過 WebChat／工作階段記錄查看該次執行。

## 轉送承載資料

- `VoiceWakeForwarder.prefixedTranscript(_:)` 會在逐字稿之前加上機器提示行（解析出的主機名稱，若無法取得則使用 "this Mac"），且喚醒詞與按住說話路徑共用此格式。

## 快速驗證

- 開啟按住說話、按住右側 Option 鍵、說話，然後放開：浮動視窗應先顯示部分結果，再進行傳送。
- 按住期間，選單列的耳朵圖示應維持放大（`triggerVoiceEars(ttl: nil)`）；放開後會恢復原狀。

## 相關內容

- [語音喚醒](/zh-TW/nodes/voicewake)
- [語音浮動視窗](/zh-TW/platforms/mac/voice-overlay)
- [macOS 應用程式](/zh-TW/platforms/macos)
