---
read_when:
    - 手動啟動工作區
summary: TOOLS.md 的工作區範本
title: TOOLS.md 範本
x-i18n:
    generated_at: "2026-07-05T11:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - 本機備註

Skills 定義工具運作的_方式_。這個檔案用於記錄_你_的具體設定，也就是你的設定中獨有的內容：相機名稱與位置、SSH 主機與別名、偏好的 TTS 語音、喇叭/房間名稱、裝置暱稱，以及任何環境特定資訊。

## 範例

```markdown
### 相機

- living-room → 主要區域，180° 廣角
- front-door → 入口，動作觸發

### SSH

- home-server → 192.168.1.100，使用者：admin

### TTS

- 偏好語音："Nova"（溫暖，略帶英式口音）
- 預設喇叭：Kitchen HomePod
```

## 為什麼要分開？

Skills 是共享的。你的設定則屬於你自己。將兩者分開，代表你可以更新 Skills 而不會遺失自己的備註，也可以分享 Skills 而不會洩漏你的基礎架構資訊。

---

加入任何能幫助你完成工作的內容。這是你的速查表。

## 相關

- [Agent 工作區](/zh-TW/concepts/agent-workspace)
