---
read_when:
    - 變更選單列圖示行為
summary: macOS 上 OpenClaw 的選單列圖示狀態與動畫
title: 選單列圖示
x-i18n:
    generated_at: "2026-07-05T11:29:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7a096ad148e83f368624e750c1e50c965d8a34a6255a09a19c568e7e88a5868
    source_path: platforms/mac/icon.md
    workflow: 16
---

# 選單列圖示狀態

範圍：macOS 應用程式（`apps/macos`）。渲染：`CritterIconRenderer.makeIcon(...)`。動畫/狀態接線：`CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`。

## 狀態

| 狀態                  | 觸發條件                                  | 視覺效果                                                                                            |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 閒置                  | 預設                                      | 一般眨眼/擺動動畫                                                                                  |
| 已暫停                | `isPaused=true`                           | 狀態項目使用 `appearsDisabled`；沒有動作                                                           |
| 語音喚醒（大耳朵）    | 聽到喚醒詞                                | 耳朵縮放至 `1.9x`，並啟用 `earHoles=true`（圓形孔洞以提高可讀性）；靜音後恢復                    |
| 工作中                | `isWorking=true` 或有效的 `IconState`     | 腿部擺動更快（`legWiggle` 最高到 `1.0`），加上小幅水平偏移；會疊加在閒置擺動上                   |

當工作階段有作用中的工作或工具時，工具活動徽章（SF Symbol 圓片，例如 exec 使用的 `chevron.left.slash.chevron.right`）可以渲染在同一個小動物圖示上方。該徽章來自 `IconState`/`ActivityKind`；完整狀態模型請參閱[選單列](/zh-TW/platforms/mac/menu-bar)。

## 語音喚醒耳朵

- 觸發：`AppStateStore.shared.triggerVoiceEars(ttl: nil)`，由語音喚醒擷取管線（`VoiceWakeRuntime`）以及語音喚醒偵錯/測試工具（`VoiceWakeTester`、`VoiceWakeOverlayController`）呼叫。
- 停止：`stopVoiceEars()`，在擷取完成時呼叫。
- 完成前的靜音視窗：通常為 `2.0s`；如果只聽到觸發詞且後續沒有語音，則為 `5.0s`（`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`）。
- 加強期間，閒置眨眼/擺動/腿部/耳朵計時器會暫停（`earBoostActive` 會閘控 `CritterStatusLabel+Behavior` 中的動畫任務）。

## 形狀與尺寸

- 畫布：18x18pt 樣板影像，渲染到 36x36px 點陣圖後備儲存區（2x），讓圖示在 Retina 上保持清晰。
- 耳朵縮放預設為 `1.0`；語音加強會設定 `earScale=1.9` 和 `earHoles=true`，且不改變整體框架。
- 腿部小跑使用最高到 `1.0` 的 `legWiggle`，並帶有小幅水平抖動。

## 行為備註

- 耳朵或工作中狀態沒有外部命令列介面/broker 切換；兩者都由應用程式訊號（`AppState.setWorking`、`AppState.triggerVoiceEars`）在內部驅動，以避免意外反覆切換。
- 任何新的 TTL 都應保持短暫（遠低於 10s），讓圖示在工作卡住時能快速回到基準狀態。

## 相關

- [選單列](/zh-TW/platforms/mac/menu-bar)
- [macOS 應用程式](/zh-TW/platforms/macos)
