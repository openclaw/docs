---
read_when:
    - 手动引导工作区
summary: HEARTBEAT.md 的工作空间模板
title: HEARTBEAT.md 模板
x-i18n:
    generated_at: "2026-07-11T20:57:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 模板

`HEARTBEAT.md` 位于 Agent 工作区中，用于保存定期 Heartbeat 检查清单。将其留空，或仅包含空白字符、Markdown 注释、ATX 标题、空列表占位项（`- `、`* [ ]`）或围栏标记，即可让 OpenClaw 完全跳过 Heartbeat 模型调用（`reason=empty-heartbeat-file`）。

随附的默认内容：

```markdown
<!-- Heartbeat 模板；仅含注释的内容可防止定时调用 Heartbeat API。 -->

# 将此文件留空（或仅包含注释）以跳过 Heartbeat API 调用。

# 当你希望智能体定期检查某些事项时，请在下方添加任务。
```

仅当你需要定期检查时，才在注释行下方添加简短任务。保持内容精简：Heartbeat 每次触发时都会读取此文件（默认每 30 分钟一次），因此冗长的指令会在每次唤醒时消耗令牌。

如果需要仅在任务到期时执行检查，而不是使用普通检查清单，请使用结构化的 `tasks:` 块，并为每个任务设置 `interval` 和 `prompt` 字段；格式和行为请参阅 [HEARTBEAT.md](/zh-CN/gateway/heartbeat#heartbeatmd-optional)。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [Heartbeat 配置](/zh-CN/gateway/config-agents)
