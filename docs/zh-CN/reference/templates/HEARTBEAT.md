---
read_when:
    - 手动引导工作区
summary: HEARTBEAT.md 的工作空间模板
title: HEARTBEAT.md 模板
x-i18n:
    generated_at: "2026-07-05T11:43:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 模板

`HEARTBEAT.md` 位于 Agent 工作区中，用于保存周期性 Heartbeat 清单。保持为空，或仅包含空白、Markdown 注释、ATX 标题、空列表占位（`- `、`* [ ]`）或围栏标记，即可让 OpenClaw 完全跳过 Heartbeat 模型调用（`reason=empty-heartbeat-file`）。

随附的默认内容：

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

只有在你想要周期性检查时，才在注释行下方添加简短任务。保持精简：Heartbeat 运行会在每个 tick 读取此文件（默认每 30 分钟一次），因此臃肿的说明会在每次唤醒时消耗 token。

如果要进行仅到期检查，而不是普通清单，请使用结构化的 `tasks:` 块，并为每个任务设置 `interval` 和 `prompt` 字段；格式和行为见 [HEARTBEAT.md](/zh-CN/gateway/heartbeat#heartbeatmd-optional)。

## 相关

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [Heartbeat 配置](/zh-CN/gateway/config-agents)
