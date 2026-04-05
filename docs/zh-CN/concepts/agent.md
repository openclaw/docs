---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: 智能体运行时、工作区契约与会话引导
title: 智能体运行时
x-i18n:
    generated_at: "2026-04-05T08:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# 智能体运行时

OpenClaw 运行一个单一的内置智能体运行时。

## 工作区（必需）

OpenClaw 使用单个智能体工作区目录（`agents.defaults.workspace`）作为智能体工具和上下文的**唯一**工作目录（`cwd`）。

建议：如果 `~/.openclaw/openclaw.json` 不存在，请使用 `openclaw setup` 创建它并初始化工作区文件。

完整的工作区布局和备份指南： [智能体工作区](/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以通过
`agents.defaults.sandbox.workspaceRoot` 下的按会话划分工作区覆盖此设置（参见
[Gateway 网关配置](/gateway/configuration)）。

## 引导文件（注入）

在 `agents.defaults.workspace` 内，OpenClaw 期望存在以下可由用户编辑的文件：

- `AGENTS.md` — 操作说明 + “记忆”
- `SOUL.md` — 人设、边界、语气
- `TOOLS.md` — 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` — 一次性的首次运行仪式（完成后删除）
- `IDENTITY.md` — 智能体名称/风格/emoji
- `USER.md` — 用户资料 + 偏好的称呼方式

在新会话的第一轮中，OpenClaw 会将这些文件的内容直接注入到智能体上下文中。

空白文件会被跳过。大文件会被裁剪并附带截断标记，以保持提示精简（如需完整内容，请直接读取文件）。

如果某个文件缺失，OpenClaw 会注入一行“文件缺失”标记（并且 `openclaw setup` 会创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅会为**全新的工作区**创建（即不存在其他引导文件时）。如果你在完成仪式后将其删除，之后重启时不应重新创建。

如需完全禁用引导文件创建（用于预置工作区），请设置：

```json5
{ agent: { skipBootstrap: true } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，
但受工具策略约束。`apply_patch` 是可选的，并受
`tools.exec.applyPatch` 控制。`TOOLS.md` **不**控制哪些工具存在；它只是
指导你希望如何使用这些工具。

## Skills

OpenClaw 会从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置项（随安装提供）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 可以通过配置/环境变量进行控制（参见 [Gateway 网关配置](/gateway/configuration) 中的 `skills`）。

## 运行时边界

内置智能体运行时构建在 Pi 智能体核心之上（模型、工具和
提示管线）。会话管理、发现、工具接线和渠道投递则是 OpenClaw 在该核心之上拥有的分层。

## 会话

会话转录以 JSONL 格式存储在以下位置：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，由 OpenClaw 选择。
不会读取来自其他工具的旧版会话文件夹。

## 流式传输期间的引导控制

当队列模式为 `steer` 时，入站消息会被注入到当前运行中。
排队的引导控制消息会在**当前 assistant 轮完成其工具调用执行之后**、下一次 LLM 调用之前送达。引导控制不再跳过当前 assistant 消息中剩余的工具调用；而是在下一个模型边界注入排队消息。

当队列模式为 `followup` 或 `collect` 时，入站消息会被保留到
当前轮结束，然后用排队负载启动一个新的智能体轮。参见
[队列](/concepts/queue) 了解模式以及 debounce/cap 行为。

分块流式传输会在 assistant 块完成后立即发送；它
**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
可通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 或 `message_end`；默认为 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制软性分块（默认
800–1200 个字符；优先按段落分隔，其次是换行，最后是句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合并流式分块，以减少
单行刷屏（发送前基于空闲时间进行合并）。非 Telegram 渠道需要
显式设置 `*.blockStreaming: true` 才能启用分块回复。
详细工具摘要会在工具启动时发出（无 debounce）；Control UI
会在可用时通过智能体事件流式传输工具输出。
更多细节： [流式传输 + 分块](/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）会通过在**第一个** `/` 处分割来解析。

- 配置模型时请使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先尝试别名，然后尝试对该确切模型 id 的唯一
  已配置提供商匹配，最后才回退到已配置的默认提供商。如果该提供商不再提供
  已配置的默认模型，OpenClaw 会回退到第一个已配置的
  提供商/模型，而不是暴露一个陈旧的、已移除提供商默认值。

## 配置（最小）

至少设置以下项：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

---

_下一步： [群聊](/channels/group-messages)_ 🦞
