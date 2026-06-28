---
read_when:
    - 變更選單列圖示行為
summary: OpenClaw 在 macOS 上的選單列圖示狀態與動畫
title: 選單列圖示
x-i18n:
    generated_at: "2026-05-06T09:14:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 選單列圖示狀態

作者：steipete · 更新日期：2025-12-06 · 範圍：macOS 應用程式 (`apps/macos`)

- **閒置：** 一般圖示動畫（眨眼、偶爾擺動）。
- **已暫停：** 狀態項目使用 `appearsDisabled`；沒有動作。
- **語音觸發（大耳朵）：** 語音喚醒偵測器在聽到喚醒詞時呼叫 `AppState.triggerVoiceEars(ttl: nil)`，在擷取語句期間保持 `earBoostActive=true`。耳朵會放大（1.9x），加入圓形耳孔以提升可讀性，接著在靜音 1 秒後透過 `stopVoiceEars()` 收回。只會從應用程式內的語音管線觸發。
- **工作中（代理正在執行）：** `AppState.isWorking=true` 會驅動「尾巴/腿部快跑」微動作：工作進行中時腿部擺動更快，並有輕微偏移。目前會在 WebChat 代理執行前後切換；當你接線其他長時間任務時，也請在其前後加入相同切換。

接線點

- 語音喚醒：執行階段/測試器在觸發時呼叫 `AppState.triggerVoiceEars(ttl: nil)`，並在靜音 1 秒後呼叫 `stopVoiceEars()`，以符合擷取視窗。
- 代理活動：在工作區段前後設定 `AppStateStore.shared.setWorking(true/false)`（WebChat 代理呼叫中已完成）。保持區段簡短，並在 `defer` 區塊中重設，以避免動畫卡住。

形狀與大小

- 基本圖示繪製於 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`。
- 耳朵縮放預設為 `1.0`；語音增強會設定 `earScale=1.9` 並切換 `earHoles=true`，且不改變整體框架（18×18 pt 範本影像會算繪到 36×36 px Retina 背板儲存區）。
- 快跑會使用最高約 ~1.0 的腿部擺動，並加入小幅水平抖動；它會加到任何既有閒置擺動上。

行為備註

- 耳朵/工作中沒有外部 CLI/broker 切換；請讓它維持在應用程式自身訊號的內部範圍，以避免意外反覆切換。
- 保持 TTL 簡短（&lt;10 秒），如此當工作停住時，圖示能快速回到基準狀態。

## 相關

- [選單列](/zh-TW/platforms/mac/menu-bar)
- [macOS 應用程式](/zh-TW/platforms/macos)
