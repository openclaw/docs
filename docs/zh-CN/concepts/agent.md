---
read_when:
    - 更改 Agent 运行时、工作区引导或会话行为
summary: Agent 运行时、工作区契约和会话引导流程
title: Agent 运行时
x-i18n:
    generated_at: "2026-07-12T14:25:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 内置了一个**嵌入式智能体运行时**：包括内置的 Agent loop、工具接线和提示词组装，这与将轮次委派给外部 harness 进程不同。每个已配置的智能体（如需运行多个智能体，请参阅[多智能体路由](/zh-CN/concepts/multi-agent)）都有自己的工作区、引导文件和会话存储。本页介绍该运行时契约：工作区必须包含哪些内容、会注入哪些文件，以及会话如何基于工作区进行引导。

## 工作区（必需）

每个智能体使用单个工作区目录（`agents.defaults.workspace`，或每个智能体的 `agents.list[].workspace`）作为工具和上下文的**唯一**工作目录（`cwd`）。

建议：使用 `openclaw setup` 在 `~/.openclaw/openclaw.json` 不存在时创建该文件，并初始化工作区文件。

完整的工作区布局和备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖此设置（参阅 [Gateway 配置](/zh-CN/gateway/configuration)）。

## 引导文件（注入）

在工作区内，OpenClaw 要求存在以下可由用户编辑的文件：

| 文件           | 用途                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作指令 + “记忆”                    |
| `SOUL.md`      | 人格、边界、语气                            |
| `TOOLS.md`     | 用户维护的工具说明和约定           |
| `IDENTITY.md`  | 智能体名称/风格/表情符号                                |
| `USER.md`      | 用户资料 + 首选称呼                     |
| `HEARTBEAT.md` | Heartbeat 专用指令                      |
| `BOOTSTRAP.md` | 仅首次运行一次的初始化流程（完成后删除） |
| `MEMORY.md`    | 根级长期记忆文件（如果存在）               |

在新会话的第一个轮次中，OpenClaw 会将这些文件的内容注入系统提示词的 Project Context。只有工作区根目录中存在 `MEMORY.md` 时，才会注入该文件。

空白文件会被跳过。大型文件会经过裁剪和截断，并附加标记，以保持提示词精简（可读取文件以获取完整内容）。文件缺失时（`MEMORY.md` 除外），会改为注入一行“文件缺失”标记；`openclaw setup` 会为其创建安全的默认模板。

仅当工作区**全新**（不存在其他引导文件）时，才会创建 `BOOTSTRAP.md`。在该文件仍待处理期间，OpenClaw 会将其保留在 Project Context 中，并在系统提示词中添加首次初始化流程的引导，而不是将其复制到用户消息中。如果你在完成该流程后删除此文件，后续重启时不会重新创建。

观察到工作区后，OpenClaw 还会在状态目录中保留该工作区路径的认证标记。如果近期认证过的工作区消失或被清空，启动时会拒绝静默地重新播种 `BOOTSTRAP.md`；请恢复工作区，或执行完整的新手引导重置，以便同时清除工作区和标记。

要完全禁用引导文件创建（适用于预先填充的工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，但受工具策略约束。对于 OpenAI 模型，`apply_patch` 默认启用，并由 `tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）控制。`TOOLS.md` **不**控制存在哪些工具；它只是关于你希望如何使用这些工具的指导。

## Skills

OpenClaw 从以下位置加载 Skills（按优先级从高到低排列）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置（随安装包提供）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 根目录可以包含分组文件夹，例如
`<workspace>/skills/personal/foo/SKILL.md`；该 Skills 仍以其扁平化的 frontmatter 名称公开，例如 `foo`。

Skills 可以受配置/环境变量限制（参阅 [Gateway 配置](/zh-CN/gateway/configuration)中的 `skills`）。

## 运行时边界

嵌入式智能体运行时由 OpenClaw 所有：模型发现、工具接线、提示词组装、会话管理和渠道交付共享同一个集成式运行时表面。

## 会话

会话行存储在每个智能体的 SQLite 数据库中：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

转录 JSONL 文件仍可位于
`~/.openclaw/agents/<agentId>/sessions/` 下，用作旧版迁移输入、已删除或已重置的归档、导入、导出和支持工件。活跃智能体历史记录与会话行一起存储在 SQLite 中。会话 ID 稳定且由 OpenClaw 选择。OpenClaw 不会读取其他工具的会话文件夹。

## 流式传输期间的 Steering

默认情况下，运行过程中收到的入站提示词会通过 Steering 注入当前运行。Steering 会在**当前助手轮次执行完其工具调用后**、下一次 LLM 调用前交付，并且不再跳过当前助手消息中剩余的工具调用。

`/queue steer` 是活跃运行的默认行为。`/queue followup` 和
`/queue collect` 会让消息等待后续轮次，而不是进行 Steering。
`/queue interrupt` 则会中止活跃运行。有关队列和边界行为，请参阅[队列](/zh-CN/concepts/queue)
和 [Steering queue](/zh-CN/concepts/queue-steering)。

分块流式传输会在已完成的助手内容块结束时立即发送；此功能**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 与 `message_end`；默认为 `text_end`）。
使用 `agents.defaults.blockStreamingChunk` 控制软分块（默认
800-1200 个字符；优先在段落边界处拆分，其次是换行，最后是句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合并流式传输的分块，以减少
单行刷屏（发送前基于空闲时间进行合并）。非 Telegram 渠道需要显式设置
`*.blockStreaming: true` 才能启用分块回复。
详细工具摘要会在工具启动时发出（无防抖）；Control UI
会在可用时通过智能体事件流式传输工具输出。
更多详情：[流式传输和分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过在**第一个** `/` 处分割来解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先尝试别名，再查找与该确切模型 ID 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再提供已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露已经失效的已移除提供商默认值。

## 配置（最低要求）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

## 相关内容

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [会话管理](/zh-CN/concepts/session)
- [群聊](/zh-CN/channels/group-messages)
