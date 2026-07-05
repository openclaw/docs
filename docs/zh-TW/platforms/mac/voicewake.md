---
read_when:
    - 正在處理語音喚醒或 PTT 路徑
summary: Mac 應用程式中的語音喚醒與按住說話模式，以及路由詳細資訊
title: 語音喚醒 (macOS)
x-i18n:
    generated_at: "2026-07-05T11:29:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# 語音喚醒與按住說話

## 需求

語音喚醒和按住說話需要 macOS 26 或更新版本。在較舊的 macOS 上，這些控制項會從語音設定頁面隱藏，並改為顯示 macOS 26 需求。

## 模式

- **喚醒詞模式**（預設）：常駐的 Speech 辨識器會等待觸發詞元（`swabbleTriggerWords`）。符合時會開始擷取、顯示含有部分文字的浮層，並在靜音後自動傳送。
- **按住說話（按住右 Option）**：按住右 Option 鍵即可立即擷取，不需要觸發詞。按住期間會顯示浮層；放開後會完成並在短暫延遲後轉送，讓你可以編輯文字。

## 執行階段行為（喚醒詞）

- 辨識器位於 `VoiceWakeRuntime`。
- 只有在喚醒詞與下一個詞之間有有意義的停頓時才會觸發（`triggerPauseWindow` = 0.55 秒）。即使指令尚未開始，浮層／提示音也可以在停頓時開始。
- 靜音視窗：語音持續時為 2.0 秒（`silenceWindow`），如果只聽到觸發詞則為 5.0 秒（`triggerOnlySilenceWindow`）。
- 硬停止：120 秒（`captureHardStop`），避免工作階段失控。
- 工作階段之間的防彈跳：傳送後 350 毫秒（`debounceAfterSend`）。
- 浮層透過 `VoiceWakeOverlayController` 驅動，並以已提交／暫存文字著色。
- 傳送後，辨識器會乾淨地重新啟動，以聆聽下一個觸發詞。

## 生命週期不變條件

- 如果語音喚醒已啟用且權限已授予，喚醒詞辨識器會持續聆聽，除非正在進行按住說話擷取。
- 浮層關閉，包括透過 X 按鈕手動關閉，一律會恢復辨識器：`VoiceSessionCoordinator.overlayDidDismiss` 會在每個關閉路徑呼叫 `VoiceWakeRuntime.refresh(state:)`。工作階段／權杖模型請參閱[語音浮層](/zh-TW/platforms/mac/voice-overlay)。

## 按住說話細節

- 熱鍵偵測使用右 Option（`keyCode 61` + `.option`）的全域 `.flagsChanged` 監視器。它只觀察事件，絕不攔截事件。
- 擷取位於 `VoicePushToTalk`：立即啟動 Speech，將部分結果串流到浮層，並在放開時呼叫 `VoiceWakeForwarder`。
- 啟動按住說話會暫停喚醒詞執行階段，以避免音訊 tap 互相衝突；放開後會自動重新啟動。
- 權限：需要麥克風 + Speech；接收按鍵事件需要核准輔助使用／輸入監控。
- 外接鍵盤：有些鍵盤不會如預期公開右 Option。如果使用者回報漏判，請提供備用快捷鍵。

## 使用者可見設定

- **語音喚醒**切換：啟用喚醒詞執行階段。
- **按住右 Option 說話**：啟用按住說話監視器。
- 語言與麥克風選擇器、即時音量計、觸發詞表格，以及測試器（僅限本機，絕不轉送）。
- 麥克風選擇器會在裝置中斷連線時保留最後選擇、顯示中斷連線提示，並暫時退回系統預設值，直到裝置恢復。
- **音效**：在偵測到觸發詞和傳送時播放提示音，預設為 macOS「Glass」系統音效。可為每個事件選擇任何可由 `NSSound` 載入的檔案（例如 MP3/WAV/AIFF），或選擇**無音效**。

## 轉送行為

- 轉送時，如果已設定作用中的 WebChat 工作階段金鑰，`VoiceWakeForwarder.selectedSessionOptions` 會選取它，否則選取閘道的主要工作階段金鑰。
- 它會透過 `sessions.list` 查找該工作階段，並從工作階段的傳遞內容衍生傳遞頻道和目標（退回到其最後的頻道／目標，再退回到已剖析的工作階段金鑰）；如果無法解析任何內容，則預設為 WebChat。
- 如果傳遞失敗，錯誤會被記錄（`voicewake.forward` 類別），且執行仍可透過 WebChat／工作階段記錄檢視。

## 轉送承載

- `VoiceWakeForwarder.prefixedTranscript(_:)` 會在逐字稿前加上機器提示行（已解析的主機名稱，退回為「這台 Mac」），並在喚醒詞與按住說話路徑之間共用。

## 快速驗證

- 開啟按住說話，按住右 Option，說話，放開：浮層應顯示部分結果，然後傳送。
- 按住期間，選單列耳朵應保持放大（`triggerVoiceEars(ttl: nil)`）；放開後會恢復。

## 相關

- [語音喚醒](/zh-TW/nodes/voicewake)
- [語音浮層](/zh-TW/platforms/mac/voice-overlay)
- [macOS app](/zh-TW/platforms/macos)
