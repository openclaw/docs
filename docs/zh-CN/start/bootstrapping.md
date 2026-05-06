---
read_when:
    - 了解首次智能体运行时会发生什么
    - 说明引导文件的存放位置
    - 调试新手引导身份设置
sidebarTitle: Bootstrapping
summary: 用于初始化工作区和身份文件的智能体启动引导流程
title: 智能体启动引导
x-i18n:
    generated_at: "2026-05-06T06:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping 是准备智能体工作区并收集身份详情的**首次运行**流程。它发生在新手引导之后，也就是智能体第一次启动时。

## Bootstrapping 会做什么

在首次运行智能体时，OpenClaw 会 bootstrap 工作区（默认
`~/.openclaw/workspace`）：

- 生成 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`。
- 运行一段简短的问答流程（一次一个问题）。
- 将身份 + 偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后移除 `BOOTSTRAP.md`，因此它只会运行一次。

对于嵌入式/本地模型运行，OpenClaw 会将 `BOOTSTRAP.md` 排除在
特权系统上下文之外。在主要的交互式首次运行中，它仍会在用户提示中传入
文件内容，以便那些不能可靠调用 `read` 工具的模型也能完成该流程。如果当前运行无法安全访问
工作区，智能体会收到一条受限的 bootstrap 说明，而不是通用问候语。

## 跳过 bootstrapping

要为预先填充好的工作区跳过此步骤，请运行 `openclaw onboard --skip-bootstrap`。

## 运行位置

Bootstrapping 始终在 **Gateway 网关主机**上运行。如果 macOS 应用连接到
远程 Gateway 网关，工作区和 bootstrapping 文件就位于那台远程
机器上。

<Note>
当 Gateway 网关运行在另一台机器上时，请在 Gateway 网关
主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)
