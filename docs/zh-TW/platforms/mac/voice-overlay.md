---
read_when:
    - 調整語音浮層行為
summary: 喚醒詞與按住說話重疊時的語音覆蓋層生命週期
title: 語音覆疊層
x-i18n:
    generated_at: "2026-07-11T21:32:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 語音浮層生命週期（macOS）

對象：macOS 應用程式貢獻者。目標：當喚醒詞與按住說話功能重疊時，讓語音浮層的行為保持可預期。

## 行為

- 如果浮層已因喚醒詞而顯示，且使用者按下快速鍵，快速鍵工作階段會沿用現有文字，而不會將其重設。按住快速鍵期間，浮層會持續顯示。放開時：若有去除前後空白的文字則傳送，否則關閉浮層。
- 僅使用喚醒詞時，仍會在偵測到靜音後自動傳送；按住說話則會在放開時立即傳送。

## 實作

- `VoiceSessionCoordinator`（`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`）是作用中語音工作階段的唯一擁有者。它是 `@MainActor @Observable` 單例，而非 actor。API：`startSession`、`updatePartial`、`finalize`、`sendNow`、`dismiss`、`updateLevel`、`snapshot`。每個工作階段都帶有一個 `UUID` 權杖；使用過期或不相符權杖的呼叫會被捨棄。
- `VoiceWakeOverlayController`（`VoiceWakeOverlayController+Session.swift`）負責呈現浮層，並透過工作階段權杖，將使用者動作（`requestSend`、`dismiss`）轉送回協調器。它本身絕不擁有工作階段狀態。
- 按住說話（`VoicePushToTalk.begin()`）會將任何可見浮層文字沿用為 `adoptedPrefix`（透過 `VoiceSessionCoordinator.shared.snapshot()`），因此在喚醒浮層顯示時按下快速鍵，會保留現有文字並附加新的語音內容。放開時，它最多等待 1.5 秒以取得最終轉錄文字，若未取得，則改用目前文字。
- 在 `dismiss` 時，浮層會呼叫 `VoiceSessionCoordinator.overlayDidDismiss`，進而觸發 `VoiceWakeRuntime.refresh(state:)`，讓手動按 X 關閉、空白文字關閉，以及傳送後關閉等情況都能恢復喚醒詞監聽。
- 統一傳送路徑：如果去除前後空白後的文字為空，則關閉浮層；否則 `sendNow` 會播放一次傳送提示音、透過 `VoiceWakeForwarder` 轉送，然後關閉浮層。

## 記錄

語音子系統為 `ai.openclaw`；每個元件都會在各自的類別下記錄：

| 類別                    | 元件                                            |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | 按住說話快速鍵與擷取                            |
| `voicewake.runtime`     | 喚醒詞執行階段                                  |
| `voicewake.chime`       | 提示音播放                                      |
| `voicewake.sync`        | 全域設定同步                                    |
| `voicewake.forward`     | 轉錄文字轉送                                    |
| `voicewake.meter`       | 麥克風音量監視器                                |

## 偵錯檢查清單

- 重現浮層無法關閉的問題時，以串流方式檢視記錄：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 確認只有一個作用中的工作階段權杖；過期的回呼會由協調器捨棄。
- 確認放開按住說話快速鍵時，一律會使用作用中權杖呼叫 `end()`；如果文字為空，應關閉浮層，而不播放提示音或傳送。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [語音喚醒（macOS）](/zh-TW/platforms/mac/voicewake)
- [對話模式](/zh-TW/nodes/talk)
