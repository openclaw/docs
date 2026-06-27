---
read_when:
    - 手动初始化工作区
summary: HEARTBEAT.md 的工作空间模板
title: HEARTBEAT.md 模板
x-i18n:
    generated_at: "2026-06-27T03:19:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 模板

`HEARTBEAT.md` 位于智能体工作区中。当你希望 OpenClaw 跳过 Heartbeat 模型调用时，请保持该文件为空，或仅包含 Markdown 注释和标题。

默认运行时模板是：

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

只有当你希望智能体定期检查某些内容时，才在注释下方添加简短任务。保持 Heartbeat 指令简短，因为它们会在重复唤醒期间被读取。

## 相关

- [Heartbeat 配置](/zh-CN/gateway/config-agents)
