---
read_when:
    - 说明 Token 使用量、费用或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示词上下文并报告 token 用量和费用
title: 令牌用量和费用
x-i18n:
    generated_at: "2026-07-11T20:57:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 跟踪的是 **token**，而不是字符。token 因模型而异，但对于英文文本，大多数 OpenAI 风格的模型平均每个 token 约为 4 个字符。

## 系统提示词的构建方式

OpenClaw 每次运行时都会组装自己的系统提示词，其中包括：

- 工具列表及简短说明
- Skills 列表（仅元数据；指令在需要时通过 `read` 加载）。原生 Codex 轮次会将精简的 Skills 块作为仅作用于当前轮次的协作开发者指令；其他 harness 则会将其放入常规提示词界面。其大小受 `skills.limits.maxSkillsPromptChars` 限制，并可通过 `agents.list[].skillsLimits.maxSkillsPromptChars` 为每个智能体单独覆盖。
- 自我更新指令
- 工作区及引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新建时的 `BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。较大的注入文件会根据 `agents.defaults.bootstrapMaxChars` 截断（默认值：`20000`）；引导内容的总注入量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：`60000`）。
  - 当该工作区可以使用记忆工具时，原生 Codex 轮次不会直接粘贴原始 `MEMORY.md`；它们会改为在仅作用于当前轮次的协作开发者指令中获得一条简短的记忆指引，并按需使用记忆工具。如果工具被禁用、记忆搜索不可用，或当前工作区与智能体记忆工作区不同，`MEMORY.md` 会回退到常规的受限轮次上下文路径。
  - 根目录中的小写 `memory.md` 永远不会被注入。它是 `openclaw doctor --fix` 的旧版修复输入，该命令会将其迁移到 `MEMORY.md`。
  - `memory/*.md` 每日文件不属于常规引导提示词；在普通轮次中，它们仍通过记忆工具按需访问。重置或启动时的模型运行可以为首个轮次预置一次性的启动上下文块，其中包含近期的每日记忆，该行为由 `agents.defaults.startupContext` 控制。纯聊天命令 `/new` 和 `/reset` 会直接得到确认，而不会调用模型。
  - 压缩后的 `AGENTS.md` 摘录属于独立内容，必须通过 `agents.defaults.compaction.postCompactionSections` 显式启用。
- 时间（UTC + 用户时区）
- 回复标签及 Heartbeat 行为
- 运行时元数据（主机/操作系统/模型/思考模式）

完整明细请参阅[系统提示词](/zh-CN/concepts/system-prompt)。

在记录凭据或身份验证片段时，请使用[密钥占位符约定](/zh-CN/reference/secret-placeholder-conventions)，以避免仅涉及文档的更改触发密钥扫描器误报。

## 上下文窗口中包含哪些内容

模型接收到的所有内容都会计入上下文限制：

- 系统提示词（上述所有部分）
- 对话历史记录（用户消息和助手消息）
- 工具调用及工具结果
- 附件/转录内容（图像、音频、文件）
- 压缩摘要及裁剪产物
- 提供商包装内容或安全标头（不可见，但仍会计入）

运行时负载较高的界面在 `agents.defaults.contextLimits` 下有各自明确的限制（可在 `agents.list[].contextLimits` 下按智能体覆盖）：

| 键                       | 用途                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `memoryGetMaxChars`      | `memory_get` 在截断前可返回的最大字符数。                                |
| `memoryGetDefaultLines`  | 请求省略 `lines` 时，`memory_get` 默认使用的行窗口。                     |
| `toolResultMaxChars`     | 单个实时工具结果的高级上限（最多 `1000000` 个字符）。                    |
| `postCompactionMaxChars` | 压缩后刷新期间从 `AGENTS.md` 保留的最大字符数。                          |

这些是受限的运行时摘录和由运行时所有的注入块，与引导限制、启动上下文限制和 Skills 提示词限制相互独立。

默认情况下未设置 `toolResultMaxChars`，因此 OpenClaw 会根据模型的实际上下文窗口推导实时工具结果上限：低于 100K token 时为 `16000` 个字符，达到 100K 及以上时为 `32000` 个字符，达到 200K 及以上时为 `64000` 个字符。即使配置了更大的显式上限，运行时上下文占比保护仍会将单个工具结果限制在上下文窗口的 30% 以内。

对于图像，OpenClaw 会在调用提供商之前缩小转录内容和工具中的图像载荷。可通过 `agents.defaults.imageMaxDimensionPx` 调整（默认值：`1200`）：

- 较低的值可减少视觉 token 用量和载荷大小。
- 较高的值可为大量使用 OCR/UI 的屏幕截图保留更多视觉细节。

如需查看实用明细（包括每个注入文件、工具、Skills 和系统提示词的大小），请使用 `/context list` 或 `/context detail`。请参阅[上下文](/zh-CN/concepts/context)。

## 如何查看当前 token 用量

在聊天中：

- `/status` -> 显示包含丰富表情符号的状态卡片，其中列出会话模型、上下文用量、上次回复的输入/输出 token，以及为当前模型配置了本地定价时的预估费用。
- `/usage off|tokens|full` -> 在每条回复后附加单次回复用量页脚。该设置会在每个会话中持久保存（存储为 `responseUsage`）。
  - `/usage reset`（别名：`inherit`、`clear`、`default`）会清除会话覆盖值，使其重新继承已配置的默认值。
  - `/usage tokens` 显示当前轮次的 token/缓存详情。
  - `/usage full` 显示精简的模型/上下文/费用详情；仅当 OpenClaw 具有用量元数据及当前模型的本地定价时，才会显示预估费用。自定义 `messages.usageTemplate` 布局可以包含 token/缓存字段。
- `/usage cost` -> 根据 OpenClaw 会话日志生成本地费用摘要。

其他界面：

- **TUI/Web TUI：**支持 `/status` 和 `/usage`。
- **CLI：**`openclaw status --usage` 和 `openclaw channels list` 显示标准化的提供商配额窗口（`X% left`，而不是单次回复费用）。当前支持用量窗口的提供商包括：Claude（Anthropic）、ClawRouter、Copilot（GitHub）、DeepSeek、Gemini（Google Gemini CLI）、MiniMax、OpenAI、小米、小米 Token Plan 和 z.ai。

用量界面会在显示前标准化常见的提供商原生字段别名。对于 OpenAI 系列的 Responses 流量，这同时包括 `input_tokens`/`output_tokens` 和 `prompt_tokens`/`completion_tokens`，因此不同传输方式的字段名称不会改变 `/status`、`/usage` 或会话摘要。Gemini CLI 用量也会进行标准化：默认的 `stream-json` 解析器读取助手的 `message` 事件，`stats.cached` 会映射为 `cacheRead`；当 CLI 省略显式的 `stats.input` 字段时，则使用 `stats.input_tokens - stats.cached`。旧版 JSON 覆盖仍会从 `response` 读取回复文本。

对于原生 OpenAI 系列的 Responses 流量，WebSocket/SSE 用量别名会以相同方式标准化；当 `total_tokens` 缺失或为 `0` 时，总量会回退为标准化后的输入与输出之和。

当当前会话快照信息不完整时，`/status` 和 `session_status` 可以从最近的转录用量日志中恢复 token/缓存计数器和当前运行时模型标签。现有的非零实时值仍优先于转录回退值；当已存储总量缺失或更小时，面向提示词的较大转录总量可以优先使用。

提供商配额窗口的用量身份验证会优先使用提供商专用钩子；如果提供商没有钩子，或钩子无法解析出 token，OpenClaw 会回退到身份验证配置文件、环境变量或配置中匹配的 OAuth/API 密钥凭据。

助手转录条目会持久保存相同的标准化用量结构；当当前模型配置了定价且提供商返回用量元数据时，其中也包括 `usage.cost`。即使实时运行时状态已经消失，这也能为 `/usage cost` 和基于转录内容的会话状态提供稳定的数据来源。

OpenClaw 会将提供商用量统计与当前上下文快照分开保存。提供商的 `usage.total` 可能包括缓存输入、输出及多次工具循环模型调用，因此适合用于费用和遥测，但可能高估实时上下文窗口。上下文显示和诊断使用最新的提示词快照（`promptTokens`；若没有提示词快照，则使用最后一次模型调用）作为 `context.used`。

## 费用估算（显示时）

费用根据你的模型定价配置估算：

```text
models.providers.<provider>.models[].cost
```

这些值表示 `input`、`output`、`cacheRead` 和 `cacheWrite` **每 100 万 token 的美元费用**。如果缺少定价，`/usage full` 会省略费用；当你需要在每条回复中查看 token/缓存详情时，请使用 `/usage tokens` 或自定义 `messages.usageTemplate`。费用显示并不限于 API 密钥身份验证：`aws-sdk` 等非 API 密钥提供商也可以显示预估费用，前提是其已配置的模型条目包含本地定价，且提供商返回用量元数据。

当边车进程和渠道进入 Gateway 网关就绪路径后，OpenClaw 会为尚未配置本地定价的模型引用启动可选的后台定价引导流程。该引导流程会获取远程 OpenRouter 和 LiteLLM 定价目录。在离线或受限网络中，可设置 `models.pricing.enabled: false` 以跳过这些目录获取操作；显式的 `models.providers.*.models[].cost` 条目仍会用于本地费用估算。

## 缓存 TTL 和裁剪的影响

提供商提示词缓存仅在缓存 TTL 窗口内生效。OpenClaw 可以选择运行 **缓存 TTL 裁剪**：缓存 TTL 过期后裁剪会话，然后重置缓存窗口，使后续请求复用新缓存的上下文，而不是重新缓存完整历史记录。当会话空闲时间超过 TTL 时，这可以降低缓存写入费用。

请在 [Gateway 配置](/zh-CN/gateway/configuration)中进行配置，并在[会话裁剪](/zh-CN/concepts/session-pruning)中查看行为详情。

Heartbeat 可以让缓存在空闲间隔期间保持**热状态**。如果模型缓存 TTL 为 `1h`，将 Heartbeat 间隔设置为略短于该值（例如 `55m`），可以避免重新缓存完整提示词，从而降低缓存写入费用。

在多智能体设置中，你可以共用一份模型配置，并通过 `agents.list[].params.cacheRetention` 为每个智能体调整缓存行为。

如需逐项了解所有配置选项，请参阅[提示词缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取比输入 token 便宜得多，而缓存写入则按更高的倍数计费。有关最新费率和 TTL 倍数，请参阅 Anthropic 的提示词缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：通过 Heartbeat 让 1 小时缓存保持热状态

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

### 示例：针对混合流量使用按智能体配置的缓存策略

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

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以只覆盖 `cacheRetention`，并原样继承其他模型默认值。

### Anthropic 100 万上下文

OpenClaw 会为支持正式发布版能力的 Claude 4.x 模型（如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6）采用 Anthropic 的 100 万上下文窗口。这些模型不需要设置 `params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

旧配置可以继续保留 `context1m: true`，但 OpenClaw 不再为此设置发送 Anthropic 已停用的 `context-1m-2025-08-07` 测试版标头，也不会将不受支持的旧版 Claude 模型扩展到 100 万上下文。

要求：凭据必须有资格用于长上下文。如果不符合要求，Anthropic 会针对该请求返回提供商侧的速率限制错误。

如果你使用 OAuth/订阅令牌（`sk-ant-oat-*`）对 Anthropic 进行身份验证，OpenClaw 会保留 OAuth 所需的 Anthropic beta 标头，同时移除旧配置中可能仍然存在的已停用 `context-1m-*` beta。

## 减少令牌压力的技巧

- 使用 `/compact` 总结较长的会话。
- 在工作流中精简较大的工具输出。
- 对于大量使用屏幕截图的会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能描述简短（技能列表会注入提示词）。
- 对于输出冗长的探索性工作，优先使用较小的模型。

有关确切的技能列表开销计算公式，请参阅 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [API 使用情况和费用](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
