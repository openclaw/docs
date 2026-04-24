---
read_when:
    - 了解智能体首次运行时会发生什么
    - 解释引导文件位于何处
    - 调试新手引导身份设置
sidebarTitle: Bootstrapping
summary: 为工作区和身份文件植入初始内容的智能体引导流程
title: 智能体引导
x-i18n:
    generated_at: "2026-04-24T19:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

智能体引导是首次运行时的准备流程，用于准备智能体工作区并收集身份信息。它发生在新手引导之后，也就是智能体第一次启动时。

## 智能体引导会做什么

在智能体首次运行时，OpenClaw 会对工作区执行智能体引导（默认是 `~/.openclaw/workspace`）：

- 初始化 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`。
- 运行一个简短的问答流程（每次一个问题）。
- 将身份信息和偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后删除 `BOOTSTRAP.md`，以确保它只运行一次。

## 跳过智能体引导

如果要跳过这一过程并使用预先填充好的工作区，请运行 `openclaw onboard --skip-bootstrap`。

## 在哪里运行

智能体引导始终在 **Gateway 网关主机** 上运行。如果 macOS 应用连接到远程 Gateway 网关，则工作区和智能体引导文件位于那台远程机器上。

<Note>
当 Gateway 网关运行在另一台机器上时，请在 Gateway 网关主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[智能体工作区](/zh-CN/concepts/agent-workspace)
