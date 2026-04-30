---
read_when:
    - 調整語音覆疊行為
summary: 喚醒詞與按鍵通話重疊時的語音覆蓋層生命週期
title: 語音疊加層
x-i18n:
    generated_at: "2026-04-30T03:21:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 語音覆蓋層生命週期 (macOS)

對象：macOS app 貢獻者。目標：在喚醒詞和按鍵通話重疊時，讓語音覆蓋層保持可預期。

## 目前意圖

- 如果覆蓋層已因喚醒詞而顯示，且使用者按下快捷鍵，快捷鍵工作階段會_採用_現有文字，而不是重設它。按住快捷鍵時，覆蓋層會維持顯示。使用者放開時：如果有修剪後的文字就傳送，否則關閉。
- 喚醒詞單獨使用時仍會在靜音時自動傳送；按鍵通話會在放開時立即傳送。

## 已實作（2025 年 12 月 9 日）

- 覆蓋層工作階段現在會為每次擷取（喚醒詞或按鍵通話）攜帶一個 token。當 token 不符合時，partial/final/send/dismiss/level 更新會被捨棄，避免過期回呼。
- 按鍵通話會採用任何可見的覆蓋層文字作為前綴（因此在喚醒覆蓋層顯示時按下快捷鍵，會保留文字並附加新的語音）。它最多等待 1.5 秒取得最終轉錄，然後才退回使用目前文字。
- 鈴聲/覆蓋層記錄會以 `info` 發出，分類為 `voicewake.overlay`、`voicewake.ptt` 和 `voicewake.chime`（工作階段開始、partial、final、send、dismiss、鈴聲原因）。

## 後續步驟

1. **VoiceSessionCoordinator (actor)**
   - 一次只擁有一個 `VoiceSession`。
   - API（以 token 為基礎）：`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 捨棄攜帶過期 token 的回呼（防止舊辨識器重新開啟覆蓋層）。
2. **VoiceSession (model)**
   - 欄位：`token`、`source` (wakeWord|pushToTalk)、已提交/暫存文字、鈴聲旗標、計時器（自動傳送、閒置）、`overlayMode` (display|editing|sending)、冷卻期限。
3. **覆蓋層繫結**
   - `VoiceSessionPublisher` (`ObservableObject`) 將作用中的工作階段鏡像到 SwiftUI。
   - `VoiceWakeOverlayView` 只透過 publisher 轉譯；它絕不直接變更全域單例。
   - 覆蓋層使用者動作（`sendNow`、`dismiss`、`edit`）會使用工作階段 token 回呼 coordinator。
4. **統一傳送路徑**
   - 在 `endCapture`：如果修剪後的文字為空 → 關閉；否則 `performSend(session:)`（播放一次傳送鈴聲、轉送、關閉）。
   - 按鍵通話：無延遲；喚醒詞：自動傳送可選擇延遲。
   - 按鍵通話結束後，對喚醒 runtime 套用短暫冷卻，讓喚醒詞不會立即再次觸發。
5. **記錄**
   - Coordinator 在 subsystem `ai.openclaw`、分類 `voicewake.overlay` 和 `voicewake.chime` 中發出 `.info` 記錄。
   - 關鍵事件：`session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## 偵錯檢查清單

- 重現卡住的覆蓋層時串流記錄：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 驗證只有一個作用中的工作階段 token；過期回呼應由 coordinator 捨棄。
- 確保按鍵通話放開時一律使用作用中的 token 呼叫 `endCapture`；如果文字為空，預期會 `dismiss`，不會有鈴聲或傳送。

## 遷移步驟（建議）

1. 加入 `VoiceSessionCoordinator`、`VoiceSession` 和 `VoiceSessionPublisher`。
2. 重構 `VoiceWakeRuntime`，讓它建立/更新/結束工作階段，而不是直接觸碰 `VoiceWakeOverlayController`。
3. 重構 `VoicePushToTalk`，讓它採用現有工作階段，並在放開時呼叫 `endCapture`；套用 runtime 冷卻。
4. 將 `VoiceWakeOverlayController` 接到 publisher；移除 runtime/PTT 的直接呼叫。
5. 為工作階段採用、冷卻和空文字關閉加入整合測試。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [語音喚醒 (macOS)](/zh-TW/platforms/mac/voicewake)
- [對話模式](/zh-TW/nodes/talk)
