---
read_when:
    - 了解智能体首次运行时会发生什么
    - 说明引导文件位于何处
    - 调试新手引导身份设置
sidebarTitle: Bootstrapping
summary: 用于初始化工作区和身份文件的智能体引导仪式
title: 智能体引导
x-i18n:
    generated_at: "2026-04-05T10:09:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# 智能体引导

引导是 **首次运行** 时执行的仪式，用于准备智能体工作区并收集身份信息。它发生在新手引导之后，也就是智能体第一次启动时。

## 引导会做什么

在智能体首次运行时，OpenClaw 会初始化工作区（默认是
`~/.openclaw/workspace`）：

- 生成 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`。
- 运行一个简短的问答仪式（一次一个问题）。
- 将身份和偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后删除 `BOOTSTRAP.md`，以确保它只运行一次。

## 它在哪里运行

引导始终在 **Gateway 网关主机** 上运行。如果 macOS 应用连接到远程 Gateway 网关，则工作区和引导文件位于那台远程机器上。

<Note>
当 Gateway 网关运行在另一台机器上时，请在 Gateway 网关主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[智能体工作区](/zh-CN/concepts/agent-workspace)
