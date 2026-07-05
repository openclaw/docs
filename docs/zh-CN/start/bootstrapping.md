---
read_when:
    - 了解首次智能体运行时会发生什么
    - 说明引导启动文件所在位置
    - 调试新手引导身份设置
sidebarTitle: Bootstrapping
summary: 种子化工作区和身份文件的智能体引导初始化流程
title: Agent 引导启动
x-i18n:
    generated_at: "2026-07-05T11:42:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

引导初始化是首次运行时的流程，用于填充新的智能体工作区，并引导智能体选择身份。它只运行一次，在新手引导之后、智能体的第一个真实轮次中立即运行。

## 会发生什么

首次针对全新工作区（默认 `~/.openclaw/workspace`）运行时，OpenClaw 会：

- 填充 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 让智能体遵循 `BOOTSTRAP.md`：通过自由形式的对话（不是固定的问答表单）确定名称、性格和氛围。
- 将学到的内容写入 `IDENTITY.md`、`USER.md` 和 `SOUL.md`。
- 工作区看起来已配置后删除 `BOOTSTRAP.md`，因此该流程只运行一次。

一旦 `SOUL.md`、`IDENTITY.md` 或 `USER.md` 偏离其起始模板，或者存在 `memory/` 文件夹，工作区就会被视为已配置。

<Note>
`BOOTSTRAP.md` 覆盖完整的身份对话。查看其内容：
[BOOTSTRAP.md 模板](/zh-CN/reference/templates/BOOTSTRAP)。
</Note>

## 嵌入式和本地模型运行

对于嵌入式或本地模型运行，OpenClaw 会将 `BOOTSTRAP.md` 排除在特权系统上下文之外。在主要交互式首次运行中，它仍会通过用户提示传递文件内容，因此即使模型无法可靠调用 `read` 工具，也仍能完成该流程。如果当前运行无法安全访问工作区，智能体会收到一条简短的受限引导初始化说明，而不是通用问候语。

## 跳过引导初始化

要在预先填充的工作区上跳过此步骤，请运行：

```bash
openclaw onboard --skip-bootstrap
```

## 运行位置

引导初始化始终在 Gateway 网关主机上运行。如果 macOS 应用连接到远程 Gateway 网关，工作区及其引导初始化文件会位于该远程机器上，而不是 Mac 上。

<Note>
当 Gateway 网关在另一台机器上运行时，请在 Gateway 网关主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)
- 模板内容：[BOOTSTRAP.md 模板](/zh-CN/reference/templates/BOOTSTRAP)
