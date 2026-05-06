---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: 智能体运行时、工作区契约和会话启动引导
title: 智能体运行时
x-i18n:
    generated_at: "2026-05-06T03:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 运行一个**单一嵌入式智能体运行时** - 每个 Gateway 网关一个智能体进程，拥有自己的工作区、引导文件和会话存储。本页介绍该运行时契约：工作区必须包含什么、哪些文件会被注入，以及会话如何基于它进行引导。

## 工作区（必需）

OpenClaw 使用单一智能体工作区目录（`agents.defaults.workspace`）作为智能体用于工具和上下文的**唯一**工作目录（`cwd`）。

推荐：如果缺少 `~/.openclaw/openclaw.json`，请使用 `openclaw setup` 创建它并初始化工作区文件。

完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下的按会话工作区来覆盖此设置（参见 [Gateway 网关配置](/zh-CN/gateway/configuration)）。

## 引导文件（已注入）

在 `agents.defaults.workspace` 内，OpenClaw 需要这些用户可编辑文件：

- `AGENTS.md` - 操作说明 + “记忆”
- `SOUL.md` - 人设、边界、语气
- `TOOLS.md` - 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` - 一次性的首次运行仪式（完成后删除）
- `IDENTITY.md` - 智能体名称/气质/emoji
- `USER.md` - 用户档案 + 首选称呼

在新会话的第一轮中，OpenClaw 会将这些文件的内容注入到系统提示词的项目上下文中。

空白文件会被跳过。大文件会被裁剪并用标记截断，使提示词保持精简（阅读文件可查看完整内容）。

如果某个文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 会创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅会为**全新工作区**创建（不存在其他引导文件）。当它待处理时，OpenClaw 会将其保留在项目上下文中，并为初始仪式添加系统提示词引导，而不是把它复制到用户消息中。如果你在完成仪式后删除它，后续重启时不应重新创建。

要完全禁用引导文件创建（用于预置工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（读取/执行/编辑/写入及相关系统工具）始终可用，但受工具策略约束。`apply_patch` 是可选的，并由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不**控制哪些工具存在；它只是说明 _你_ 希望如何使用它们。

## Skills

OpenClaw 会从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置（随安装包提供）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 可以由配置/环境变量控制（参见 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

嵌入式智能体运行时基于 Pi 智能体核心构建（模型、工具和提示词管线）。会话管理、设备发现、工具接线和渠道投递是在该核心之上的 OpenClaw 自有层。

## 会话

会话转录以 JSONL 形式存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，并由 OpenClaw 选择。
不会读取来自其他工具的旧版会话文件夹。

## 流式传输期间 Steering

当队列模式为 `steer` 时，入站消息会被注入当前运行中。排队的 Steering 会在**当前助手轮次完成执行其工具调用后**、下一次 LLM 调用前送达。Pi 会为 `steer` 一起排空所有待处理的 Steering 消息；旧版 `queue` 会在每个模型边界排空一条消息。Steering 不再跳过当前助手消息中剩余的工具调用。

当队列模式为 `followup` 或 `collect` 时，入站消息会保留到当前轮次结束，然后用排队的载荷启动新的智能体轮次。有关模式和边界行为，请参见 [队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

分块流式传输会在已完成的助手块结束后立即发送；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 与 `message_end`；默认为 text_end）。
用 `agents.defaults.blockStreamingChunk` 控制软性块分块（默认为 800-1200 个字符；优先段落断点，其次换行，最后句子）。
用 `agents.defaults.blockStreamingCoalesce` 合并流式分块以减少单行刷屏（发送前基于空闲时间合并）。非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才能启用分块回复。
详细工具摘要会在工具开始时发出（无防抖）；Control UI 会在可用时通过智能体事件流式传输工具输出。
更多详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过按**第一个** `/` 分割来解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 匹配的唯一已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露一个已移除提供商的过期默认值。

## 配置（最小）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈推荐）

---

_下一步：[群聊](/zh-CN/channels/group-messages)_ 🦞

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [会话管理](/zh-CN/concepts/session)
