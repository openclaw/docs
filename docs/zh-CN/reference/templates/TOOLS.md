---
read_when:
    - 手动引导初始化工作区
summary: TOOLS.md 的工作空间模板
title: TOOLS.md 模板
x-i18n:
    generated_at: "2026-07-05T11:43:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - 本地备注

Skills 定义工具_如何_工作。此文件用于记录_你的_具体信息，也就是你的设置中独有的内容：摄像头名称和位置、SSH 主机和别名、偏好的 TTS 语音、扬声器/房间名称、设备昵称，以及任何特定于环境的信息。

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

## 为什么分开？

Skills 是共享的。你的设置属于你自己。将它们分开意味着你可以更新 Skills 而不会丢失你的备注，也可以共享 Skills 而不会泄露你的基础设施。

---

添加任何能帮助你完成工作的内容。这是你的速查表。

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
