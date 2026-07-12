---
read_when:
    - 添加 BOOT.md 检查清单
summary: BOOT.md 的工作空间模板
title: BOOT.md 模板
x-i18n:
    generated_at: "2026-07-11T20:56:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

在此处添加简短、明确的启动说明。如果此文件存在且包含非空白内容，则每次 Gateway 网关启动时，内置的 `boot-md` 钩子都会在每个 Agent 工作区中运行一次。共享同一工作区的多个智能体只会触发一次运行。

该钩子默认禁用。请先启用它：

```bash
openclaw hooks enable boot-md
```

如果某个清单项需要发送消息，请使用消息工具，然后使用完全一致的静默令牌 `NO_REPLY` 回复（不区分大小写）。

## 相关内容

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Hooks](/zh-CN/automation/hooks#boot-md)
