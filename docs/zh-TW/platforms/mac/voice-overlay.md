---
read_when:
    - 調整語音覆蓋層行為
summary: 喚醒詞和按鍵通話重疊時的語音疊加層生命週期
title: 語音覆蓋層
x-i18n:
    generated_at: "2026-05-06T09:14:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 語音覆蓋層生命週期（macOS）

對象：macOS app 貢獻者。目標：在喚醒詞與按住說話重疊時，讓語音覆蓋層保持可預測。

## 目前意圖

- 如果覆蓋層已因喚醒詞而顯示，且使用者按下快捷鍵，快捷鍵工作階段會_採用_現有文字，而不是重設文字。按住快捷鍵期間覆蓋層會保持顯示。當使用者放開時：若有修剪後的文字就送出，否則關閉。
- 單獨使用喚醒詞時，仍會在靜音後自動送出；按住說話會在放開時立即送出。

## 已實作（2025 年 12 月 9 日）

- 覆蓋層工作階段現在會為每次擷取（喚醒詞或按住說話）攜帶一個權杖。當權杖不相符時，partial/final/send/dismiss/level 更新會被捨棄，以避免過期回呼。
- 按住說話會採用任何可見的覆蓋層文字作為前綴（因此在喚醒覆蓋層顯示時按下快捷鍵，會保留文字並附加新的語音）。它會等待最多 1.5 秒取得最終轉錄稿，之後才退回使用目前文字。
- 鈴聲/覆蓋層記錄會以 `info` 等級發出，分類為 `voicewake.overlay`、`voicewake.ptt` 和 `voicewake.chime`（工作階段開始、部分、最終、送出、關閉、鈴聲原因）。

## 後續步驟

1. **VoiceSessionCoordinator（actor）**
   - 一次只擁有一個 `VoiceSession`。
   - API（以權杖為基礎）：`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 捨棄攜帶過期權杖的回呼（防止舊辨識器重新開啟覆蓋層）。
2. **VoiceSession（模型）**
   - 欄位：`token`、`source`（wakeWord|pushToTalk）、已提交/暫時文字、鈴聲旗標、計時器（自動送出、閒置）、`overlayMode`（display|editing|sending）、冷卻期限。
3. **覆蓋層繫結**
   - `VoiceSessionPublisher`（`ObservableObject`）會將作用中的工作階段鏡像到 SwiftUI。
   - `VoiceWakeOverlayView` 只透過 publisher 轉譯；它永遠不會直接變更全域 singleton。
   - 覆蓋層使用者動作（`sendNow`、`dismiss`、`edit`）會帶著工作階段權杖回呼 coordinator。
4. **統一送出路徑**
   - 在 `endCapture` 時：如果修剪後的文字為空 → 關閉；否則 `performSend(session:)`（播放一次送出鈴聲、轉送、關閉）。
   - 按住說話：無延遲；喚醒詞：可選擇為自動送出加入延遲。
   - 在按住說話結束後，對喚醒執行階段套用短暫冷卻，讓喚醒詞不會立即再次觸發。
5. **記錄**
   - Coordinator 會在 subsystem `ai.openclaw`、分類 `voicewake.overlay` 和 `voicewake.chime` 中發出 `.info` 記錄。
   - 關鍵事件：`session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## 偵錯檢查清單

- 重現卡住的覆蓋層時串流記錄：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 確認只有一個作用中的工作階段權杖；過期回呼應由 coordinator 捨棄。
- 確保按住說話放開時一律使用作用中權杖呼叫 `endCapture`；如果文字為空，應該會出現沒有鈴聲或送出的 `dismiss`。

## 遷移步驟（建議）

1. 新增 `VoiceSessionCoordinator`、`VoiceSession` 和 `VoiceSessionPublisher`。
2. 重構 `VoiceWakeRuntime`，改為建立/更新/結束工作階段，而不是直接觸碰 `VoiceWakeOverlayController`。
3. 重構 `VoicePushToTalk`，讓它採用現有工作階段並在放開時呼叫 `endCapture`；套用執行階段冷卻。
4. 將 `VoiceWakeOverlayController` 接到 publisher；移除來自 runtime/PTT 的直接呼叫。
5. 為工作階段採用、冷卻和空文字關閉新增整合測試。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [語音喚醒（macOS）](/zh-TW/platforms/mac/voicewake)
- [說話模式](/zh-TW/nodes/talk)
