---
read_when:
    - 更改 Agent 运行时、工作区引导或会话行为
summary: Agent 运行时、工作区契约和会话引导启动
title: Agent 运行时
x-i18n:
    generated_at: "2026-07-14T13:33:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 9f9050092650ecfd894eff837fa6fec49042347134ec7e2dbfa02afda518a47d
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 提供一个**内置 Agent 运行时**：它包含内置 Agent loop、工具连接和提示词组装，与将轮次委托给外部 harness 进程不同。每个已配置的 Agent（如需运行多个 Agent，请参阅[多 Agent 路由](/zh-CN/concepts/multi-agent)）都有自己的工作区、引导文件和会话存储。本页介绍该运行时契约：工作区必须包含哪些内容、会注入哪些文件，以及会话如何基于工作区进行引导。

## 工作区（必需）

每个 Agent 使用一个工作区目录（`agents.defaults.workspace`，或每个 Agent 对应的
`agents.list[].workspace`）作为工具和上下文的**唯一**工作目录（`cwd`）。

建议：使用 `openclaw setup` 在 `~/.openclaw/openclaw.json` 不存在时创建它，并初始化工作区文件。

完整工作区布局和备份指南：[Agent 工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以使用
`agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖此设置（参阅
[Gateway 配置](/zh-CN/gateway/configuration)）。

## 引导文件（已注入）

在工作区中，OpenClaw 需要以下可由用户编辑的文件：

| 文件           | 用途                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作说明 + “记忆”                    |
| `SOUL.md`      | 人设、边界、语气                            |
| `TOOLS.md`     | 用户维护的工具注释和约定           |
| `IDENTITY.md`  | Agent 名称/风格/表情符号                                |
| `USER.md`      | 用户资料 + 偏好的称呼方式                     |
| `HEARTBEAT.md` | Heartbeat 专用说明                      |
| `BOOTSTRAP.md` | 一次性的首次运行仪式（完成后删除） |
| `MEMORY.md`    | 根级长期记忆文件（如果存在）               |

在新会话的第一个轮次中，OpenClaw 会将这些文件的内容注入系统提示词的 Project Context。仅当 `MEMORY.md` 存在于工作区根目录时才会注入它。

空文件会被跳过。大文件会经过裁剪和截断，并附加标记，以保持提示词精简（如需完整内容，请读取文件）。缺失的文件（`MEMORY.md` 除外）会改为注入一行“文件缺失”标记；`openclaw setup` 会为其创建安全的默认模板。

仅会为**全新工作区**（不存在任何其他引导文件）创建 `BOOTSTRAP.md`。在它处于待处理状态时，OpenClaw 会将其保留在 Project Context 中，并在系统提示词中添加用于初始仪式的引导说明，而不是将其复制到用户消息中。如果在完成仪式后将其删除，则后续重启时不会重新创建。

观察到工作区后，OpenClaw 还会为该工作区路径在状态目录中保留一个认证标记。如果近期已认证的工作区消失或被清空，启动时会拒绝静默重新生成 `BOOTSTRAP.md`；请恢复工作区，或执行完整的新手引导重置，以同时清除工作区和标记。

若要完全禁用引导文件创建（适用于预先填充的工作区），请设置：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，但受工具策略约束。对于 OpenAI 模型，`apply_patch` 默认开启，并由
`tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）控制。`TOOLS.md` **不**控制存在哪些工具；它用于指导工具按照_你_期望的方式使用。

## Skills

OpenClaw 从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目 Agent Skills：`<workspace>/.agents/skills`
- 个人 Agent Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置（随安装提供）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 根目录可以包含分组文件夹，例如
`<workspace>/skills/personal/foo/SKILL.md`；该 Skill 仍会按其扁平化的 frontmatter 名称公开，例如 `foo`。

Skills 可以通过配置/环境变量进行控制（参阅 [Gateway 配置](/zh-CN/gateway/configuration)中的 `skills`）。

## 运行时边界

内置 Agent 运行时由 OpenClaw 所有：模型发现、工具连接、提示词组装、会话管理和渠道交付共享一个集成的运行时界面。

## 会话

会话行存储在每个 Agent 的 SQLite 数据库中：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

转录记录 JSONL 文件仍可存放在
`~/.openclaw/agents/<agentId>/sessions/` 下，用作旧版迁移输入、已删除或重置的归档、导入、导出和支持工件。活跃的 Agent 历史记录与会话行一起存储在 SQLite 中。会话 ID 保持稳定，并由 OpenClaw 选择。OpenClaw 不会读取其他工具的会话文件夹。

## 流式传输期间的 Steering

默认情况下，运行期间收到的入站提示词会被 Steer 到当前运行中。
Steering 会在**当前助手轮次完成其工具调用之后**、下一次 LLM 调用之前传递，并且不再跳过当前助手消息中剩余的工具调用。

`/queue steer` 是默认的活跃运行行为。`/queue followup` 和
`/queue collect` 会让消息等待后续轮次，而不是执行 Steering。
`/queue interrupt` 则会中止活跃运行。有关队列和边界行为，请参阅[队列](/zh-CN/concepts/queue)
和 [Steering queue](/zh-CN/concepts/queue-steering)。

分块流式传输会在助手内容块完成后立即发送；它
**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 与 `message_end`；默认为 `text_end`）。
使用 `agents.defaults.blockStreamingChunk` 控制软分块（默认
800-1200 个字符；优先按段落分隔，其次按换行符，最后按句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合并流式传输的数据块，以减少
单行刷屏（发送前基于空闲时间合并）。非 Telegram 渠道需要
显式设置 `*.streaming.block.enabled: true` 才能启用分块回复（QQ Bot
则会流式传输分块回复，除非 `channels.qqbot.streaming.mode` 为 `"off"`）。
详细工具摘要会在工具启动时发出（不进行防抖）；如果可用，Control UI
会通过 Agent 事件流式传输工具输出。
更多详情：[流式传输和分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过在**第一个** `/` 处拆分进行解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 会先尝试别名，然后查找与该精确模型 ID 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露已移除提供商的陈旧默认设置。

## 配置（最低要求）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

## 相关内容

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [多 Agent 路由](/zh-CN/concepts/multi-agent)
- [会话管理](/zh-CN/concepts/session)
- [群聊](/zh-CN/channels/group-messages)
