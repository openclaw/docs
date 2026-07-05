---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: 智能体运行时、工作区契约和会话引导
title: Agent runtime
x-i18n:
    generated_at: "2026-07-05T11:11:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c2468239d94e393246af28a38b1db602a5d665f0fb43e80def19acb5985093f
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 提供一个**嵌入式智能体运行时**：内置的智能体循环、工具接线和提示词组装，不同于把轮次委托给外部 harness 进程。每个已配置的智能体（如需运行多个，请参见[多智能体路由](/zh-CN/concepts/multi-agent)）都有自己的工作区、引导文件和会话存储。本页说明该运行时契约：工作区必须包含什么、会注入哪些文件，以及会话如何基于它引导启动。

## 工作区（必需）

每个智能体使用单个工作区目录（`agents.defaults.workspace`，或每个智能体的 `agents.list[].workspace`）作为工具和上下文的**唯一**工作目录（`cwd`）。

建议：使用 `openclaw setup` 在缺失时创建 `~/.openclaw/openclaw.json`，并初始化工作区文件。

完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖它（参见 [Gateway 配置](/zh-CN/gateway/configuration)）。

## 引导文件（注入）

在工作区内，OpenClaw 需要这些用户可编辑文件：

| 文件           | 用途                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作指令 + “记忆”                    |
| `SOUL.md`      | 人设、边界、语气                            |
| `TOOLS.md`     | 用户维护的工具说明和约定           |
| `IDENTITY.md`  | 智能体名称/氛围/emoji                                |
| `USER.md`      | 用户资料 + 首选称呼                     |
| `HEARTBEAT.md` | Heartbeat 专用指令                      |
| `BOOTSTRAP.md` | 一次性的首次运行仪式（完成后删除） |
| `MEMORY.md`    | 根长期记忆文件（如果存在）               |

在新会话的第一个轮次中，OpenClaw 会把这些文件的内容注入到系统提示词的 Project Context 中。只有当 `MEMORY.md` 存在于工作区根目录时才会注入。

空白文件会被跳过。大型文件会被修剪并带标记截断，以保持提示词精简（如需完整内容，请读取文件）。缺失文件（`MEMORY.md` 除外）会改为注入单行“缺失文件”标记；`openclaw setup` 会为它创建安全的默认模板。

`BOOTSTRAP.md` 只会为**全新的工作区**创建（不存在其他引导文件）。当它待处理时，OpenClaw 会把它保留在 Project Context 中，并为初始仪式添加系统提示词引导，而不是把它复制到用户消息中。如果你在完成仪式后删除它，后续重启时不会重新创建。

工作区被观察到后，OpenClaw 还会为工作区路径保留一个状态目录证明标记。如果最近已证明的工作区消失或被清空，启动会拒绝静默重新播种 `BOOTSTRAP.md`；请恢复工作区，或使用完整的新手引导重置，让工作区和标记一起清除。

如需完全禁用引导文件创建（用于预先播种的工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，但受工具策略约束。`apply_patch` 对 OpenAI 模型默认开启，并由 `tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）控制。`TOOLS.md` **不**控制哪些工具存在；它是关于你希望这些工具如何使用的指导。

## Skills

OpenClaw 从这些位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置（随安装提供）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 根目录可以包含分组文件夹，例如
`<workspace>/skills/personal/foo/SKILL.md`；该 Skills 仍会按其扁平 frontmatter 名称公开，例如 `foo`。

Skills 可以由配置/环境变量控制（参见 [Gateway 配置](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

嵌入式智能体运行时由 OpenClaw 拥有：模型发现、工具接线、提示词组装、会话管理和渠道投递共享一个集成的运行时表面。

## 会话

会话转录以 JSONL 存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 稳定，并由 OpenClaw 选择。OpenClaw 不会读取其他工具的会话文件夹。

## 流式传输期间的 Steer

运行中到达的入站提示词默认会被 Steer 到当前运行中。Steer 会在**当前助手轮次完成执行其工具调用之后**、下一次 LLM 调用之前投递，并且不再跳过当前助手消息中剩余的工具调用。

`/queue steer` 是默认的活动运行行为。`/queue followup` 和
`/queue collect` 会让消息等待后续轮次，而不是 Steer。
`/queue interrupt` 则会中止活动运行。有关队列和边界行为，请参见[队列](/zh-CN/concepts/queue)和 [Steering queue](/zh-CN/concepts/queue-steering)。

分块流式传输会在完成助手块后立即发送；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 与 `message_end`；默认为 `text_end`）。
用 `agents.defaults.blockStreamingChunk` 控制软块分块（默认为 800-1200 个字符；优先段落断点，然后换行，最后句子）。
用 `agents.defaults.blockStreamingCoalesce` 合并流式块，以减少单行刷屏（发送前基于空闲时间合并）。非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才能启用分块回复。
详细工具摘要会在工具启动时发出（无防抖）；Control UI 在可用时会通过智能体事件流式传输工具输出。
更多详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）会按**第一个** `/` 分割解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先尝试别名，然后为该精确模型 ID 尝试唯一的已配置提供商匹配，最后才回退到已配置的默认提供商。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露过时的已移除提供商默认值。

## 配置（最小）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [会话管理](/zh-CN/concepts/session)
- [群聊](/zh-CN/channels/group-messages)
