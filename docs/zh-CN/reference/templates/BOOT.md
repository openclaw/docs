---
read_when:
    - 添加 BOOT.md 检查清单
summary: BOOT.md 的工作空间模板
title: BOOT.md 模板
x-i18n:
    generated_at: "2026-07-05T11:40:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

在这里添加简短、明确的启动说明。如果该文件存在且包含非空白内容，内置的 `boot-md` 钩子会在每次 Gateway 网关启动时，为每个 Agent 工作区运行一次此文件。共享同一工作区的多个智能体只会触发一次运行。

该钩子默认禁用。先启用它：

```bash
openclaw hooks enable boot-md
```

如果清单项会发送消息，请使用消息工具，然后用精确的静默令牌 `NO_REPLY` 回复（不区分大小写）。

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Hooks](/zh-CN/automation/hooks#boot-md)
