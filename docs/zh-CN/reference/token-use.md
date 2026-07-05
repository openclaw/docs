---
read_when:
    - 解释 token 使用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示上下文并报告 token 用量和成本
title: Token 使用量和费用
x-i18n:
    generated_at: "2026-07-05T11:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 跟踪的是 **token**，而不是字符。token 因模型而异，但大多数
OpenAI 风格模型在英文文本中平均约为每个 token 4 个字符。

## 系统提示词的构建方式

OpenClaw 会在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；指令会按需通过 `read` 加载）。原生
  Codex 轮次会将紧凑 Skills 块作为该轮次范围内的协作
  developer instructions；其他 harness 会把它放在普通提示词表面。
  受 `skills.limits.maxSkillsPromptChars` 限制，并可在每个 Agent
  的 `agents.list[].skillsLimits.maxSkillsPromptChars` 中选择性覆盖。
- 自更新指令
- 工作区 + 引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、
  `IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，如果是新的，
  还包括存在时的 `MEMORY.md`）。大型注入文件会按
  `agents.defaults.bootstrapMaxChars` 截断（默认值：`20000`）；总引导
  注入受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：
  `60000`）。
  - 当某个工作区可用记忆工具时，原生 Codex 轮次不会粘贴原始
    `MEMORY.md`；它们会在该轮次范围内的协作 developer instructions
    中获得一个小型记忆指针，并按需使用记忆工具。如果工具被禁用、
    记忆搜索不可用，或活动工作区不同于 Agent 记忆工作区，`MEMORY.md`
    会回退到普通的有界轮次上下文路径。
  - 小写根目录 `memory.md` 永远不会被注入。它是
    `openclaw doctor --fix` 的旧版修复输入，会被迁移到 `MEMORY.md`。
  - `memory/*.md` 每日文件不是普通引导提示词的一部分；它们在普通轮次中
    通过记忆工具按需保留。重置/启动模型运行可以为第一轮预置一个一次性
    启动上下文块，其中包含最近的每日记忆，由
    `agents.defaults.startupContext` 控制。纯聊天 `/new` 和 `/reset`
    会在不调用模型的情况下得到确认。
  - 压缩后的 `AGENTS.md` 摘录是独立的，并且需要显式选择加入
    `agents.defaults.compaction.postCompactionSections`。
- 时间（UTC + 用户时区）
- 回复标签 + Heartbeat 行为
- 运行时元数据（主机/OS/模型/thinking）

完整拆解见 [System Prompt](/zh-CN/concepts/system-prompt)。

记录凭据或认证片段时，请使用
[Secret Placeholder Conventions](/zh-CN/reference/secret-placeholder-conventions)，
以避免仅文档变更触发 secret-scanner 误报。

## 上下文窗口中包含哪些内容

模型收到的所有内容都会计入上下文限制：

- 系统提示词（上面的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图像、音频、文件）
- 压缩摘要和剪枝产物
- 提供商包装器或安全头（不可见，但仍会计入）

运行时较重的表面在 `agents.defaults.contextLimits` 下有自己的显式上限
（每个 Agent 的覆盖项在 `agents.list[].contextLimits` 下）：

| 键                       | 用途                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | `memory_get` 在截断前返回的最大字符数。                                  |
| `memoryGetDefaultLines`  | 请求省略 `lines` 时，`memory_get` 的默认行窗口。                         |
| `toolResultMaxChars`     | 单个实时工具结果的高级上限（最高 `1000000` 个字符）。                    |
| `postCompactionMaxChars` | 压缩后刷新期间从 `AGENTS.md` 保留的最大字符数。                         |

这些是有界运行时摘录和运行时拥有的注入块，独立于引导限制、启动上下文限制
和 Skills 提示词限制。

`toolResultMaxChars` 默认未设置，因此 OpenClaw 会根据有效模型上下文窗口推导
实时工具结果上限：低于 100K token 时为 `16000` 个字符，100K+ token 时为
`32000` 个字符，200K+ token 时为 `64000` 个字符。即使配置了更大的显式上限，
运行时上下文份额保护仍会将单个工具结果限制为上下文窗口的 30%。

对于图像，OpenClaw 会在调用提供商之前缩小转录/工具图像载荷。可通过
`agents.defaults.imageMaxDimensionPx` 调整（默认值：`1200`）：

- 较低值会减少视觉 token 用量和载荷大小。
- 较高值会为 OCR/UI 密集型截图保留更多视觉细节。

如需实用拆解（按注入文件、工具、Skills 和系统提示词大小），请使用
`/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 如何查看当前 token 用量

在聊天中：

- `/status` -> 带丰富表情的状态卡片，包含会话模型、上下文用量、
  上次响应的输入/输出 token，以及当活动模型配置了本地定价时的估算成本。
- `/usage off|tokens|full` -> 为每条回复追加每次响应的用量页脚。
  按会话持久化（存储为 `responseUsage`）。
  - `/usage reset`（别名：`inherit`、`clear`、`default`）会清除会话覆盖项，
    使其重新继承已配置的默认值。
  - `/usage tokens` 显示轮次 token/缓存详情。
  - `/usage full` 显示紧凑的模型/上下文/成本详情；估算成本只会在
    OpenClaw 拥有活动模型的用量元数据和本地定价时出现。自定义
    `messages.usageTemplate` 布局可以包含 token/缓存字段。
- `/usage cost` -> 来自 OpenClaw 会话日志的本地成本摘要。

其他表面：

- **TUI/Web TUI：** 支持 `/status` 和 `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  标准化的提供商配额窗口（`X% left`，而不是每次响应成本）。
  当前用量窗口提供商：Claude（Anthropic）、ClawRouter、Copilot
  （GitHub）、DeepSeek、Gemini（Google Gemini CLI）、MiniMax、OpenAI、Xiaomi、
  Xiaomi Token Plan 和 z.ai。

用量表面会在显示前标准化常见的提供商原生字段别名。对于 OpenAI 系列
Responses 流量，这包括 `input_tokens`/`output_tokens` 和
`prompt_tokens`/`completion_tokens`，因此传输特定字段名不会改变
`/status`、`/usage` 或会话摘要。Gemini CLI 用量也会被标准化：默认的
`stream-json` 解析器读取助手 `message` 事件，并将 `stats.cached` 映射到
`cacheRead`；当 CLI 省略显式 `stats.input` 字段时，会使用
`stats.input_tokens - stats.cached`。旧版 JSON 覆盖仍会从 `response`
读取回复文本。

对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量别名会以相同方式
标准化，并且当 `total_tokens` 缺失或为 `0` 时，总量会回退为标准化后的输入
+ 输出。

当当前会话快照较稀疏时，`/status` 和 `session_status` 可以从最近的转录用量
日志恢复 token/缓存计数器和活动运行时模型标签。现有非零实时值仍优先于
转录回退值；当已存储总量缺失或较小时，较大的面向提示词的转录总量可以胜出。

提供商配额窗口的用量认证会首先来自提供商特定钩子；如果某个提供商没有钩子
（或该钩子未解析出 token），OpenClaw 会回退到从认证配置、环境或配置中匹配
OAuth/API-key 凭据。

助手转录条目会持久化相同的标准化用量形状，包括当活动模型配置了定价且提供商
返回用量元数据时的 `usage.cost`。这为 `/usage cost` 和基于转录的会话状态提供了
稳定来源，即使实时运行时状态已经消失。

OpenClaw 会将提供商用量统计与当前上下文快照分开。提供商 `usage.total` 可以包含
缓存输入、输出和多次工具循环模型调用，因此它对成本和遥测有用，但可能夸大实时
上下文窗口。上下文显示和诊断会使用最新提示词快照（`promptTokens`，或在没有提示词
快照时使用最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```text
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和 `cacheWrite` 的 **每 1M token 美元**。
如果缺少定价，`/usage full` 会省略成本；当你需要在每条回复中查看 token/缓存
详情时，请使用 `/usage tokens` 或自定义 `messages.usageTemplate`。成本显示不限于
API-key 认证：当 `aws-sdk` 等非 API-key 提供商的已配置模型条目包含本地定价且
提供商返回用量元数据时，也可以显示估算成本。

在 sidecar 和渠道到达 Gateway 网关 ready 路径后，OpenClaw 会为已配置但尚无本地
定价的模型引用启动可选的后台定价引导。该引导会获取远程 OpenRouter 和 LiteLLM
定价目录。在离线或受限网络中，可设置 `models.pricing.enabled: false` 跳过这些
目录获取；显式 `models.providers.*.models[].cost` 条目仍会驱动本地成本估算。

## 缓存 TTL 和剪枝影响

提供商提示词缓存只会在缓存 TTL 窗口内生效。OpenClaw 可以选择运行
**cache-ttl 剪枝**：它会在缓存 TTL 过期后剪枝会话，然后重置缓存窗口，使后续请求
复用新缓存的上下文，而不是重新缓存完整历史。这样可以在会话空闲超过 TTL 后降低
缓存写入成本。

在 [Gateway 配置](/zh-CN/gateway/configuration) 中配置它，并在
[Session pruning](/zh-CN/concepts/session-pruning) 中查看行为详情。

Heartbeat 可以在空闲间隔期间保持缓存 **warm**。如果你的模型缓存 TTL 是 `1h`，
将 Heartbeat 间隔设置得略低于它（例如 `55m`）可以避免重新缓存完整提示词，从而
降低缓存写入成本。

在多 Agent 设置中，你可以保留一个共享模型配置，并通过
`agents.list[].params.cacheRetention` 按 Agent 调整缓存行为。

完整的逐项旋钮指南见 [Prompt Caching](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取明显比输入 token 便宜，而缓存写入会按更高倍率
计费。最新费率和 TTL 倍率请参见 Anthropic 的提示词缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：用 Heartbeat 保持 1h 缓存 warm

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 示例：使用按 Agent 缓存策略的混合流量

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以只覆盖
`cacheRetention`，并保持其他模型默认值不变。

### Anthropic 1M 上下文

OpenClaw 会为 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6 等支持 GA 的 Claude
4.x 模型设置 Anthropic 的 1M 上下文窗口。你不需要为这些模型设置
`params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

旧配置可以保留 `context1m: true`，但 OpenClaw 不再为此设置发送 Anthropic 已退役的
`context-1m-2025-08-07` beta 头，也不会将不受支持的旧版 Claude 模型扩展到 1M。

要求：凭证必须符合长上下文使用资格。否则，Anthropic 会针对该请求返回提供商侧的速率限制错误。

如果你使用 OAuth/订阅令牌（`sk-ant-oat-*`）对 Anthropic 进行身份验证，OpenClaw 会保留 OAuth 所需的 Anthropic beta 标头，同时移除已停用的 `context-1m-*` beta（如果它仍存在于旧配置中）。

## 降低 token 压力的技巧

- 使用 `/compact` 总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图密集型会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能描述简短（技能列表会注入到提示中）。
- 对冗长的探索性工作，优先使用较小的模型。

查看 [Skills](/zh-CN/tools/skills) 了解精确的技能列表开销公式。

## 相关内容

- [API 使用量和费用](/zh-CN/reference/api-usage-costs)
- [提示缓存](/zh-CN/reference/prompt-caching)
- [使用量跟踪](/zh-CN/concepts/usage-tracking)
