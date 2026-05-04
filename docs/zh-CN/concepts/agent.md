---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: Agent 运行时、工作区契约和会话启动
title: 智能体运行时
x-i18n:
    generated_at: "2026-05-04T00:38:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 运行一个**单一嵌入式智能体运行时** — 每个
Gateway 网关对应一个智能体进程，拥有自己的工作区、引导文件和会话存储。本页
介绍该运行时契约：工作区必须包含什么、会注入哪些文件，以及会话如何基于它进行引导。

## 工作区（必需）

OpenClaw 使用单一智能体工作区目录（`agents.defaults.workspace`）作为智能体在工具和上下文中的**唯一**工作目录（`cwd`）。

推荐：使用 `openclaw setup` 创建缺失的 `~/.openclaw/openclaw.json`，并初始化工作区文件。

完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以使用
`agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖此设置（参见
[Gateway 网关配置](/zh-CN/gateway/configuration)）。

## 引导文件（已注入）

在 `agents.defaults.workspace` 内，OpenClaw 预期存在这些可由用户编辑的文件：

- `AGENTS.md` — 操作说明 + “记忆”
- `SOUL.md` — 人设、边界、语气
- `TOOLS.md` — 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` — 一次性首次运行仪式（完成后删除）
- `IDENTITY.md` — 智能体名称/风格/emoji
- `USER.md` — 用户画像 + 偏好的称呼

在新会话的第一轮中，OpenClaw 会把这些文件的内容注入系统提示词的 Project Context。

空白文件会被跳过。大型文件会被裁剪和截断，并带有标记，以保持提示词精简（阅读文件可获取完整内容）。

如果文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 会创建一个安全的默认模板）。

`BOOTSTRAP.md` 只会为**全新工作区**创建（没有其他引导文件存在）。当它处于待处理状态时，OpenClaw 会把它保留在 Project Context 中，并为初始仪式添加系统提示词引导，而不是把它复制到用户消息中。如果你在完成仪式后删除它，后续重启时不应重新创建。

若要完全禁用引导文件创建（用于预置工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，
但受工具策略约束。`apply_patch` 是可选的，并由
`tools.exec.applyPatch` 控制。`TOOLS.md` **不会**控制存在哪些工具；它是
关于你希望如何使用这些工具的指导。

## Skills

OpenClaw 会从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置（随安装一起发布）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 可以通过配置/环境进行门控（参见 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

嵌入式智能体运行时构建在 Pi 智能体核心（模型、工具和
提示词流水线）之上。会话管理、设备发现、工具接线和渠道
投递是 OpenClaw 在该核心之上的自有层。

## 会话

会话转录以 JSONL 形式存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，由 OpenClaw 选择。
不会读取其他工具的旧版会话文件夹。

## 流式传输时的 Steering

当队列模式为 `steer` 时，入站消息会被注入当前运行。
排队的 Steering 会在**当前助手轮次完成其工具调用执行之后**、
下一次 LLM 调用之前投递。Pi 会为 `steer` 一次性排空所有待处理的
Steering 消息；旧版 `queue` 会在每个模型边界排空一条消息。
Steering 不再跳过当前助手消息中剩余的工具调用。

当队列模式为 `followup` 或 `collect` 时，入站消息会被保留到
当前轮次结束，然后使用排队的载荷启动新的智能体轮次。有关模式
和边界行为，请参见[队列](/zh-CN/concepts/queue)和 [Steering queue](/zh-CN/concepts/queue-steering)。

分块流式传输会在助手块完成后立即发送；默认情况下
**关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 与 `message_end`；默认为 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制软性块分块（默认
800–1200 个字符；优先段落断点，其次换行，最后句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合并流式分块，以减少
单行刷屏（发送前基于空闲时间合并）。非 Telegram 渠道需要
显式设置 `*.blockStreaming: true` 才能启用分块回复。
详细工具摘要会在工具启动时发出（无防抖）；Control UI
会在可用时通过智能体事件流式传输工具输出。
更多详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）会按**第一个** `/` 分割解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 匹配的唯一
  已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再公开
  已配置的默认模型，OpenClaw 会回退到第一个已配置的
  提供商/模型，而不是暴露已移除提供商的过期默认值。

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
