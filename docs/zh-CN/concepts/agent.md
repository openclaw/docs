---
read_when:
    - 更改智能体运行时、工作区引导启动或会话行为
summary: 智能体运行时、工作区契约和会话引导
title: 智能体运行时
x-i18n:
    generated_at: "2026-06-27T01:46:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 运行一个**单一嵌入式智能体运行时** - 每个 Gateway 网关对应一个智能体进程，并拥有自己的工作区、引导文件和会话存储。本页介绍该运行时契约：工作区必须包含哪些内容、会注入哪些文件，以及会话如何基于它启动。

## 工作区（必需）

OpenClaw 使用单个智能体工作区目录（`agents.defaults.workspace`）作为智能体用于工具和上下文的**唯一**工作目录（`cwd`）。

推荐：使用 `openclaw setup` 在缺失时创建 `~/.openclaw/openclaw.json`，并初始化工作区文件。

完整工作区布局 + 备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以通过 `agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖此设置（参见 [Gateway 配置](/zh-CN/gateway/configuration)）。

## 引导文件（已注入）

在 `agents.defaults.workspace` 中，OpenClaw 预期存在这些可由用户编辑的文件：

- `AGENTS.md` - 操作指令 + “记忆”
- `SOUL.md` - 人设、边界、语气
- `TOOLS.md` - 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` - 一次性首次运行仪式（完成后删除）
- `IDENTITY.md` - 智能体名称/风格/emoji
- `USER.md` - 用户资料 + 偏好的称呼方式

在新会话的第一轮中，OpenClaw 会把这些文件的内容注入到系统提示词的项目上下文中。

空白文件会被跳过。大型文件会被裁剪并带标记截断，以保持提示词精简（请阅读文件以获取完整内容）。

如果文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 会创建安全的默认模板）。

`BOOTSTRAP.md` 只会为**全新工作区**创建（不存在其他引导文件）。当它处于待处理状态时，OpenClaw 会将其保留在项目上下文中，并为初始仪式添加系统提示词引导，而不是把它复制到用户消息中。如果你在完成仪式后删除它，后续重启时不应重新创建。

在观察到某个工作区后，OpenClaw 还会为该工作区路径保留一个状态目录证明标记。如果最近证明过的工作区消失或被清空，启动过程会拒绝静默重新播种 `BOOTSTRAP.md`；请恢复该工作区，或使用完整新手引导重置，让工作区和标记一起清除。

要完全禁用引导文件创建（适用于预先播种的工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 以及相关系统工具）始终可用，受工具策略约束。`apply_patch` 是可选的，并由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不会**控制存在哪些工具；它只是关于你希望如何使用这些工具的指导。

## Skills

OpenClaw 会从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置（随安装提供）
- 额外 Skill 文件夹：`skills.load.extraDirs`

Skill 根目录可以包含分组文件夹，例如 `<workspace>/skills/personal/foo/SKILL.md`；该 Skill 仍会通过其扁平 frontmatter 名称暴露，例如 `foo`。

Skills 可以由配置/环境控制（参见 [Gateway 配置](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

嵌入式智能体运行时由 OpenClaw 拥有：模型发现、工具接线、提示词组装、会话管理和渠道投递共享同一个集成运行时表面。

## 会话

会话转录以 JSONL 存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，并由 OpenClaw 选择。
不会读取来自其他工具的旧版会话文件夹。

## 流式传输期间的 Steering

默认情况下，运行中途到达的入站提示会被 Steer 到当前运行中。
Steering 会在**当前 assistant 轮次完成执行其工具调用之后**、下一次 LLM 调用之前投递，并且不再跳过当前 assistant 消息中剩余的工具调用。

`/queue steer` 是默认的活动运行行为。`/queue followup` 和 `/queue collect` 会让消息等待后续轮次，而不是执行 Steering。`/queue interrupt` 则会中止活动运行。有关队列和边界行为，请参见 [Queue](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

分块流式传输会在 assistant 块完成后立即发送；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
可通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` vs `message_end`；默认是 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制软分块切分（默认 800-1200 个字符；优先段落分隔，其次换行；最后才是句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合并流式传输块，以减少单行刷屏（发送前基于空闲时间合并）。非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才能启用块回复。
详细工具摘要会在工具开始时发出（无防抖）；Control UI 会在可用时通过智能体事件流式传输工具输出。
更多详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）会按**第一个** `/` 拆分解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 匹配的唯一已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露一个已移除提供商的过期默认值。

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
