---
read_when:
    - 解释令牌用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示上下文并报告令牌用量 + 成本
title: 令牌用量和成本
x-i18n:
    generated_at: "2026-04-25T19:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# 令牌用量和成本

OpenClaw 跟踪的是 **令牌**，而不是字符。令牌因模型而异，但大多数 OpenAI 风格的模型对英文文本的平均换算约为每个令牌 4 个字符。

## 系统提示如何构建

OpenClaw 会在每次运行时组装自己的系统提示。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；说明按需通过 `read` 加载）。
  紧凑的 Skills 块受 `skills.limits.maxSkillsPromptChars` 限制，
  并且可按智能体通过
  `agents.list[].skillsLimits.maxSkillsPromptChars` 覆盖。
- 自我更新说明
- 工作区 + 引导文件（新的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。根目录的小写 `memory.md` 不会被注入；当与 `MEMORY.md` 配对时，它是 `openclaw doctor --fix` 的旧版修复输入。大文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认值：12000），引导注入总量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 每日文件不属于常规引导提示的一部分；在普通轮次中，它们仍然通过 memory 工具按需访问，但裸 `/new` 和 `/reset` 可以在首次轮次前附加一个一次性的启动上下文块，其中包含最近的每日记忆。该启动前导由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + heartbeat 行为
- 运行时元数据（主机 / OS / 模型 / 思考）

完整细分请参见 [System Prompt](/zh-CN/concepts/system-prompt)。

## 什么会计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件 / 转录内容（图像、音频、文件）
- 压缩摘要和裁剪产物
- 提供商包装层或安全头（不可见，但仍会计入）

一些运行时较重的表面有各自明确的上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

按智能体的覆盖项位于 `agents.list[].contextLimits` 下。这些旋钮
用于受限的运行时摘录和由运行时注入的内容块。它们
与引导限制、启动上下文限制和 Skills 提示限制是分开的。

对于图像，OpenClaw 会在调用提供商之前缩小转录 / 工具图像载荷的尺寸。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）来调整：

- 较低的值通常会减少视觉令牌用量和载荷大小。
- 较高的值会保留更多视觉细节，适用于 OCR / UI 密集型截图。

如需实际细分（按每个注入文件、工具、Skills 和系统提示大小），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 如何查看当前令牌用量

在聊天中使用以下命令：

- `/status` → **富含表情符号的状态卡片**，显示会话模型、上下文用量、
  上次响应的输入 / 输出令牌，以及 **估算成本**（仅 API 密钥）。
- `/usage off|tokens|full` → 为每条回复附加一个 **按响应统计的用量页脚**。
  - 按会话持久保存（存储为 `responseUsage`）。
  - OAuth 认证 **隐藏成本**（仅显示令牌）。
- `/usage cost` → 从 OpenClaw 会话日志中显示本地成本摘要。

其他表面：

- **TUI / Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 显示
  标准化后的提供商配额窗口（`X% left`，而不是按响应成本）。
  当前支持用量窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面在显示前会标准化常见的提供商原生字段别名。
对于 OpenAI 系列的 Responses 流量，这包括 `input_tokens` /
`output_tokens` 以及 `prompt_tokens` / `completion_tokens`，因此传输层特定的
字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 用量也会被标准化：回复文本来自 `response`，并且
`stats.cached` 会映射到 `cacheRead`，当 CLI 省略明确的 `stats.input` 字段时，
会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket / SSE 用量别名也会以相同方式标准化，并且当
`total_tokens` 缺失或为 `0` 时，总量会回退为标准化后的输入 + 输出。
当当前会话快照较为稀疏时，`/status` 和 `session_status` 还可以
从最近的转录用量日志中恢复令牌 / 缓存计数器以及活动运行时模型标签。
现有的非零实时值仍然优先于转录回退值，并且当存储总量缺失或更小时，
更大的、偏向提示的转录总量可以胜出。
提供商配额窗口的用量认证会在可用时来自提供商特定钩子；
否则 OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配的 OAuth / API 密钥凭证。
助手转录条目会持久化相同的标准化用量结构，包括
当活动模型已配置定价且提供商返回用量元数据时的 `usage.cost`。
这使 `/usage cost` 和基于转录的会话状态即使在实时运行时状态消失后
仍有稳定的数据来源。

OpenClaw 将提供商用量计费与当前上下文
快照分开保留。提供商 `usage.total` 可能包括缓存输入、输出以及多个
工具循环模型调用，因此它对成本和遥测很有用，但可能会高估实时
上下文窗口。上下文显示和诊断使用最新的提示快照
（`promptTokens`，或者当没有提示快照时使用最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些值表示 `input`、`output`、`cacheRead` 和
`cacheWrite` 的 **每 100 万令牌的美元价格**。如果缺少定价，OpenClaw 仅显示令牌。OAuth 令牌
永不显示美元成本。

## 缓存 TTL 和裁剪的影响

提供商提示缓存仅在缓存 TTL 窗口内生效。OpenClaw 可以
选择运行 **cache-ttl pruning**：当缓存 TTL
过期后，它会裁剪会话，然后重置缓存窗口，以便后续请求能够重用
刚刚重新缓存的上下文，而不是重新缓存完整历史。这样可以在会话空闲超过 TTL 时
降低缓存写入成本。

请在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中配置它，并在
[会话裁剪](/zh-CN/concepts/session-pruning) 中查看行为细节。

Heartbeat 可以在空闲间隔期间让缓存保持 **热状态**。如果你的模型缓存 TTL
是 `1h`，将 heartbeat 间隔设置得略低一些（例如 `55m`）可以避免
重新缓存完整提示，从而减少缓存写入成本。

在多智能体设置中，你可以保留一个共享的模型配置，并通过
`agents.list[].params.cacheRetention` 按智能体调整缓存行为。

如需完整的逐项参数指南，请参见 [Prompt Caching](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取比输入
令牌便宜得多，而缓存写入按更高倍数计费。最新费率和 TTL 倍数
请参见 Anthropic 的提示缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：使用 heartbeat 保持 1h 缓存热状态

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

### 示例：混合流量与按智能体划分的缓存策略

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 大多数智能体的默认基线
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 为深度会话保持长缓存热状态
    - id: "alerts"
      params:
        cacheRetention: "none" # 避免为突发通知写入缓存
```

`agents.list[].params` 会在所选模型的 `params` 之上合并，因此你可以
只覆盖 `cacheRetention`，并保持其他模型默认值不变。

### 示例：启用 Anthropic 1M 上下文 beta 标头

Anthropic 的 1M 上下文窗口目前仍受 beta 限制。OpenClaw 可以在你对受支持的 Opus
或 Sonnet 模型启用 `context1m` 时注入所需的
`anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这会映射到 Anthropic 的 `context-1m-2025-08-07` beta 标头。

这仅在该模型条目上设置了 `context1m: true` 时适用。

要求：凭证必须具备长上下文用量资格。如果不具备，
Anthropic 会针对该请求返回提供商侧限流错误。

如果你使用 OAuth / 订阅令牌（`sk-ant-oat-*`）认证 Anthropic，
OpenClaw 会跳过 `context-1m-*` beta 标头，因为 Anthropic 当前
会以 HTTP 401 拒绝这种组合。

## 减少令牌压力的提示

- 使用 `/compact` 来总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图密集型会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skills 描述简短（Skills 列表会被注入提示中）。
- 对冗长的探索性工作，优先选择较小的模型。

有关精确的 Skills 列表开销公式，请参见 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [API 用量和成本](/zh-CN/reference/api-usage-costs)
- [提示缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
