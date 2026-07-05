---
read_when:
    - 調整語音覆蓋層行為
summary: 喚醒詞與按鍵通話重疊時的語音覆蓋層生命週期
title: 語音疊加層
x-i18n:
    generated_at: "2026-07-05T11:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 語音浮層生命週期 (macOS)

對象：macOS 應用程式貢獻者。目標：在喚醒詞與按鍵通話重疊時，讓語音浮層保持可預期。

## 行為

- 如果浮層已因喚醒詞而顯示，且使用者按下熱鍵，熱鍵工作階段會沿用現有文字，而不是重設。按住熱鍵期間，浮層會持續顯示。放開時：若有修剪後的文字就傳送，否則關閉。
- 單獨使用喚醒詞時，仍會在靜音後自動傳送；按鍵通話會在放開時立即傳送。

## 實作

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) 是作用中語音工作階段的唯一擁有者。它是 `@MainActor @Observable` 單例，不是 actor。API：`startSession`、`updatePartial`、`finalize`、`sendNow`、`dismiss`、`updateLevel`、`snapshot`。每個工作階段都帶有一個 `UUID` token；使用過期或不相符 token 的呼叫會被丟棄。
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) 會呈現浮層，並透過工作階段 token 將使用者動作 (`requestSend`、`dismiss`) 轉回協調器。它永遠不會自行擁有工作階段狀態。
- 按鍵通話 (`VoicePushToTalk.begin()`) 會將任何可見浮層文字沿用為 `adoptedPrefix`（透過 `VoiceSessionCoordinator.shared.snapshot()`），因此在喚醒浮層顯示時按下熱鍵，會保留文字並附加新的語音。放開時，它會等待最多 1.5 秒取得最終逐字稿，然後才退回使用目前文字。
- 在 `dismiss` 時，浮層會呼叫 `VoiceSessionCoordinator.overlayDidDismiss`，這會觸發 `VoiceWakeRuntime.refresh(state:)`，因此手動按 X 關閉、空文字關閉，以及傳送後關閉，都會恢復喚醒詞監聽。
- 統一傳送路徑：如果修剪後的文字為空，則關閉；否則 `sendNow` 會播放一次傳送提示音，透過 `VoiceWakeForwarder` 轉送，然後關閉。

## 記錄

語音子系統是 `ai.openclaw`；每個元件都會在自己的分類下記錄：

| 分類                    | 元件                                            |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | 按鍵通話熱鍵與擷取                              |
| `voicewake.runtime`     | 喚醒詞執行階段                                  |
| `voicewake.chime`       | 提示音播放                                      |
| `voicewake.sync`        | 全域設定同步                                    |
| `voicewake.forward`     | 逐字稿轉送                                      |
| `voicewake.meter`       | 麥克風音量監控                                  |

## 偵錯檢查清單

- 在重現卡住的浮層時串流記錄：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 確認只有一個作用中的工作階段 token；過期回呼會由協調器丟棄。
- 確認按鍵通話放開時一律使用作用中 token 呼叫 `end()`；如果文字為空，預期會關閉，而不播放提示音或傳送。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [語音喚醒 (macOS)](/zh-TW/platforms/mac/voicewake)
- [通話模式](/zh-TW/nodes/talk)
