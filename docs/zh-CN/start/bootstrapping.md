---
read_when:
    - 了解智能体首次运行时会发生什么
    - 说明引导文件的存放位置
    - 调试新手引导身份设置
sidebarTitle: Bootstrapping
summary: 用于初始化工作区和身份文件的 Agent 引导流程
title: 智能体引导启动
x-i18n:
    generated_at: "2026-07-11T20:58:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

引导初始化是首次运行时的初始化流程，它会为新的智能体工作区植入初始文件，并引导智能体选择身份。它只运行一次，即在新手引导完成后、智能体第一次真正交互时运行。

## 具体过程

首次使用全新工作区（默认路径为 `~/.openclaw/workspace`）运行时，OpenClaw 会：

- 植入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 让智能体按照 `BOOTSTRAP.md` 进行操作：通过自由形式的对话（而非固定的问答表单）确定名称、性格和风格。
- 将了解到的信息写入 `IDENTITY.md`、`USER.md` 和 `SOUL.md`。
- 工作区看起来已配置完成后删除 `BOOTSTRAP.md`，确保该流程只运行一次。

当 `SOUL.md`、`IDENTITY.md` 或 `USER.md` 与其初始模板不再相同，或者存在 `memory/` 文件夹时，工作区即视为已配置完成。

<Note>
`BOOTSTRAP.md` 涵盖完整的身份设定对话。其内容请参阅
[BOOTSTRAP.md 模板](/zh-CN/reference/templates/BOOTSTRAP)。
</Note>

## 嵌入式模型和本地模型运行

对于嵌入式模型或本地模型运行，OpenClaw 不会将 `BOOTSTRAP.md` 放入特权系统上下文中。在主要的首次交互运行中，它仍会通过用户提示词传递该文件的内容，因此即使模型无法可靠调用 `read` 工具，也仍能完成此流程。如果当前运行无法安全访问工作区，智能体会收到一则简短的受限引导初始化说明，而不是通用问候语。

## 跳过引导初始化

要在已预先植入内容的工作区中跳过此流程，请运行：

```bash
openclaw onboard --skip-bootstrap
```

## 运行位置

引导初始化始终在 Gateway 网关主机上运行。如果 macOS 应用连接到远程 Gateway 网关，工作区及其引导初始化文件位于该远程计算机上，而不是 Mac 上。

<Note>
当 Gateway 网关在另一台计算机上运行时，请在 Gateway 网关主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 相关文档

- macOS 应用新手引导：[新手引导](/zh-CN/start/onboarding)
- 工作区布局：[Agent 工作区](/zh-CN/concepts/agent-workspace)
- 模板内容：[BOOTSTRAP.md 模板](/zh-CN/reference/templates/BOOTSTRAP)
