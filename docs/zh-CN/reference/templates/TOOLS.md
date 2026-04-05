---
read_when:
    - 手动初始化工作区
summary: 用于 TOOLS.md 的工作区模板
title: TOOLS.md 模板
x-i18n:
    generated_at: "2026-04-05T10:08:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - 本地说明

Skills 定义工具_如何_工作。这个文件用于记录_你自己的_具体信息——也就是你的设置中独有的内容。

## 这里放什么

例如：

- 摄像头名称和位置
- SSH 主机和别名
- TTS 的首选语音
- 扬声器/房间名称
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

Skills 是共享的。你的设置是你自己的。将它们分开意味着你可以在不丢失自己笔记的情况下更新 Skills，也可以在不泄露自己基础设施信息的情况下共享 Skills。

---

添加任何能帮助你完成工作的内容。这是你的速查表。
