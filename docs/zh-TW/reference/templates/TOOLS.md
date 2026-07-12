---
read_when:
    - 手動建立工作區的初始環境
summary: TOOLS.md 的工作區範本
title: TOOLS.md 範本
x-i18n:
    generated_at: "2026-07-11T21:47:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - 本機備註

Skills 定義工具的_運作方式_。此檔案用於記錄_您的_具體設定，也就是您環境中的獨有資訊：攝影機名稱與位置、SSH 主機與別名、偏好的 TTS 語音、喇叭／房間名稱、裝置暱稱，以及任何環境特定資訊。

## 範例

```markdown
### 攝影機

- living-room → 主要區域，180° 廣角
- front-door → 入口，動作觸發

### SSH

- home-server → 192.168.1.100，使用者：admin

### TTS

- 偏好語音："Nova"（溫暖、略帶英國口音）
- 預設喇叭：廚房 HomePod
```

## 為何要分開？

Skills 可供共用，而您的設定專屬於您。將兩者分開，可讓您在更新 Skills 時不會遺失備註，也能分享 Skills 而不洩漏您的基礎設施資訊。

---

加入任何能協助您完成工作的資訊。這是您的速查表。

## 相關內容

- [代理程式工作區](/zh-TW/concepts/agent-workspace)
