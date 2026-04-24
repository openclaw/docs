---
read_when:
    - 手动引导工作区
summary: TOOLS.md 的工作区模板
title: TOOLS.md 模板
x-i18n:
    generated_at: "2026-04-24T04:07:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - 本地说明

Skills 定义工具_如何_工作。这个文件用于保存_你的_具体信息——也就是那些只属于你环境的内容。

## 这里应该写什么

例如：

- 摄像头名称和位置
- SSH 主机和别名
- 偏好的 TTS 语音
- 扬声器 / 房间名称
- 设备昵称
- 任何环境特定的信息

## 示例

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

## 为什么要分开？

Skills 是共享的。你的环境是你自己的。将它们分开，意味着你可以在不丢失自己说明的情况下更新 Skills，也可以在不泄露你基础设施信息的情况下共享 Skills。

---

添加任何能帮助你完成工作的内容。这是你的速查表。

## 相关内容

- [Agent workspace](/zh-CN/concepts/agent-workspace)
