---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: 智能体运行时、工作区约定和会话引导
title: 智能体运行时
x-i18n:
    generated_at: "2026-04-24T19:56:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw 运行一个**单一的嵌入式智能体运行时**——每个 Gateway 网关对应一个智能体进程，并拥有自己的工作区、引导文件和会话存储。此页面介绍该运行时约定：工作区必须包含什么、会注入哪些文件，以及会话如何基于它进行引导。

## 工作区（必需）

OpenClaw 使用单一的智能体工作区目录（`agents.defaults.workspace`），作为智能体工具和上下文的**唯一**工作目录（`cwd`）。

建议：使用 `openclaw setup` 在缺失时创建 `~/.openclaw/openclaw.json`，并初始化工作区文件。

完整的工作区布局和备份指南： [Agent workspace](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以通过 `agents.defaults.sandbox.workspaceRoot` 下的每会话工作区覆盖此设置（参见 [Gateway configuration](/zh-CN/gateway/configuration)）。

## 引导文件（已注入）

在 `agents.defaults.workspace` 内，OpenClaw 期望存在以下可由用户编辑的文件：

- `AGENTS.md` —— 操作说明 + “记忆”
- `SOUL.md` —— 人设、边界、语气
- `TOOLS.md` —— 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` —— 一次性的首次运行仪式（完成后删除）
- `IDENTITY.md` —— 智能体名称 / 氛围 / emoji
- `USER.md` —— 用户资料 + 偏好的称呼方式

在新会话的第一轮中，OpenClaw 会将这些文件的内容直接注入智能体上下文中。

空白文件会被跳过。大文件会被裁剪并以标记截断，以保持提示精简（读取文件可查看完整内容）。

如果某个文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 会创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅会为**全新的工作区**创建（即不存在其他引导文件）。如果你在完成仪式后将其删除，则后续重启时不应重新创建。

要完全禁用引导文件创建（适用于预先填充好的工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read / exec / edit / write 以及相关系统工具）始终可用，但受工具策略约束。`apply_patch` 是可选的，并由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不会**控制哪些工具存在；它只是关于_你_希望如何使用这些工具的说明。

## Skills

OpenClaw 按以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管 / 本地：`~/.openclaw/skills`
- 内置包（随安装一同提供）
- 额外 Skill 文件夹：`skills.load.extraDirs`

Skills 可由配置 / 环境变量控制启用（参见 [Gateway configuration](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

该嵌入式智能体运行时构建于 Pi 智能体核心之上（模型、工具和提示词流水线）。会话管理、设备发现、工具接线和渠道投递则是 OpenClaw 在该核心之上拥有的层。

## 会话

会话转录以 JSONL 格式存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，并由 OpenClaw 选择。
不会读取来自其他工具的旧版会话文件夹。

## 流式传输期间的引导

当队列模式为 `steer` 时，入站消息会被注入到当前运行中。
排队的引导消息会在**当前助手轮次完成其工具调用执行之后**、下一次 LLM 调用之前投递。引导不再跳过当前助手消息中剩余的工具调用；而是在下一个模型边界注入排队消息。

当队列模式为 `followup` 或 `collect` 时，入站消息会被保留到当前轮次结束，然后以排队的负载启动新的智能体轮次。有关模式以及 debounce / cap 行为，请参见 [Queue](/zh-CN/concepts/queue)。

分块流式传输会在助手完成某个完整块后立即发送；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
你可以通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 或 `message_end`；默认为 `text_end`）。
你可以通过 `agents.defaults.blockStreamingChunk` 控制软性分块（默认为 800–1200 个字符；优先按段落分割，其次按换行，最后按句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合并流式分块，以减少单行刷屏（基于空闲时间在发送前合并）。非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才能启用分块回复。
详细工具摘要会在工具启动时发出（无 debounce）；Control UI 会在可用时通过智能体事件流式传输工具输出。
更多详情： [Streaming + chunking](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）会通过在**第一个** `/` 处分割来解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该确切模型 ID 唯一匹配的已配置提供商，只有在那之后才会回退到已配置的默认提供商。如果该提供商不再提供已配置的默认模型，OpenClaw 会回退到第一个已配置的 provider / model，而不是暴露一个陈旧的、已移除提供商的默认值。

## 配置（最小）

至少需要设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

---

_下一步： [Group Chats](/zh-CN/channels/group-messages)_ 🦞

## 相关内容

- [Agent workspace](/zh-CN/concepts/agent-workspace)
- [Multi-agent routing](/zh-CN/concepts/multi-agent)
- [Session management](/zh-CN/concepts/session)
