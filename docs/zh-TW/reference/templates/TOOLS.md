---
read_when:
    - 手動初始化工作區
summary: TOOLS.md 的工作區範本
title: TOOLS.md 範本
x-i18n:
    generated_at: "2026-04-30T03:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - 本機備註

Skills 定義工具_如何_運作。這個檔案用於記錄_你的_具體設定 — 也就是你的設定中特有的內容。

## 這裡該放什麼

例如：

- 攝影機名稱和位置
- SSH 主機和別名
- TTS 的偏好語音
- 喇叭/房間名稱
- 裝置暱稱
- 任何特定環境相關內容

## 範例

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## 為什麼要分開？

Skills 是共享的。你的設定屬於你自己。將兩者分開，代表你可以更新 Skills 而不會遺失自己的備註，也能分享 Skills 而不洩漏你的基礎架構。

---

加入任何能幫助你完成工作的內容。這是你的速查表。

## 相關

- [Agent 工作區](/zh-TW/concepts/agent-workspace)
