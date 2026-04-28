---
read_when:
    - 了解首次智能体运行时会发生什么
    - 说明引导文件的存放位置
    - 调试新手引导身份设置
sidebarTitle: Bootstrapping
summary: 用于初始化工作区和身份文件的智能体引导流程
title: 智能体启动引导
x-i18n:
    generated_at: "2026-04-28T19:51:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping 是**首次运行**流程，用于准备智能体工作区并
收集身份详情。它发生在新手引导之后，也就是智能体首次启动时。

## Bootstrapping 会做什么

在首次智能体运行时，OpenClaw 会引导初始化工作区（默认
`~/.openclaw/workspace`）：

- 植入 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`。
- 运行一个简短的问答流程（一次一个问题）。
- 将身份 + 偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后移除 `BOOTSTRAP.md`，因此它只会运行一次。

对于嵌入式/本地模型运行，OpenClaw 会避免将 `BOOTSTRAP.md` 放入
特权系统上下文。在主要的交互式首次运行中，它仍会通过用户提示传入
文件内容，以便那些不会可靠调用 `read` 工具的模型也能完成该流程。如果当前运行无法安全访问
工作区，智能体会收到一条受限的 bootstrap 说明，而不是通用问候语。

## 跳过 bootstrapping

要对预先植入内容的工作区跳过此步骤，请运行 `openclaw onboard --skip-bootstrap`。

## 运行位置

Bootstrapping 始终在 **Gateway 网关主机**上运行。如果 macOS app 连接到
远程 Gateway 网关，则工作区和 bootstrapping 文件都位于那台远程
机器上。

<Note>
当 Gateway 网关运行在另一台机器上时，请在 Gateway 网关
主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS app 新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)
