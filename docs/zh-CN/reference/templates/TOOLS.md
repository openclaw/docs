---
read_when:
    - 手动初始化工作区
summary: TOOLS.md 的工作区模板
title: TOOLS.md 模板
x-i18n:
    generated_at: "2026-07-11T20:57:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - 本地备注

Skills 定义工具_如何_工作。此文件用于记录_你的_具体信息——你的设置中独有的内容：摄像头名称和位置、SSH 主机和别名、偏好的 TTS 语音、扬声器/房间名称、设备昵称，以及任何特定于环境的信息。

## 示例

```markdown
### 摄像头

- living-room → 主要区域，180° 广角
- front-door → 入口，运动触发

### SSH

- home-server → 192.168.1.100，用户：admin

### TTS

- 偏好语音："Nova"（温暖、略带英式口音）
- 默认扬声器：厨房 HomePod
```

## 为什么要分开？

Skills 是共享的。你的设置归你所有。将它们分开意味着你可以更新 Skills 而不会丢失备注，也可以共享 Skills 而不会泄露你的基础设施信息。

---

添加任何有助于你完成工作的内容。这是你的速查表。

## 相关内容

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
