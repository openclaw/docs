---
read_when:
    - 解释令牌用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示词上下文并报告 token 用量和成本
title: 词元使用量和费用
x-i18n:
    generated_at: "2026-04-28T12:04:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# 词元使用与成本

OpenClaw 跟踪的是**词元**，不是字符。词元因模型而异，但大多数
OpenAI 风格模型处理英文文本时，平均约 4 个字符对应 1 个词元。

## 系统提示是如何构建的

OpenClaw 每次运行时都会组装自己的系统提示。它包括：

- 工具列表 + 简短说明
- Skills 列表（仅元数据；指令会按需通过 `read` 加载）。
  紧凑 Skills 块受 `skills.limits.maxSkillsPromptChars` 限制，
  也可以通过
  `agents.list[].skillsLimits.maxSkillsPromptChars`
  为每个智能体设置可选覆盖。
- 自我更新指令
- 工作区 + 引导文件（新建时包括 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，存在时还包括 `MEMORY.md`）。小写根目录 `memory.md` 不会被注入；当它与 `MEMORY.md` 配对时，它只是 `openclaw doctor --fix` 的旧版修复输入。大文件会按 `agents.defaults.bootstrapMaxChars` 截断（默认：12000），引导注入总量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认：60000）。`memory/*.md` 每日文件不是常规引导提示的一部分；在普通轮次中，它们仍然通过记忆工具按需使用，但重置/启动模型运行可以为第一轮预置一次性的启动上下文块，其中包含最近的每日记忆。裸聊天 `/new` 和 `/reset` 命令会在不调用模型的情况下被确认。启动前导由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + 心跳行为
- 运行时元数据（主机/OS/模型/思考）

完整拆解见[系统提示](/zh-CN/concepts/system-prompt)。

## 上下文窗口中计入什么

模型收到的所有内容都会计入上下文限制：

- 系统提示（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图像、音频、文件）
- 压缩摘要和修剪产物
- 提供商包装层或安全标头（不可见，但仍会计入）

一些运行时负载较重的表面有自己的显式上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每个智能体的覆盖位于 `agents.list[].contextLimits` 下。这些开关用于
有界运行时摘录和运行时拥有的注入块。它们与引导限制、启动上下文限制和 Skills 提示
限制是分开的。

对于图像，OpenClaw 会在调用提供商前缩小转录/工具图像载荷。
使用 `agents.defaults.imageMaxDimensionPx`（默认：`1200`）调整此行为：

- 较低的值通常会减少视觉词元用量和载荷大小。
- 较高的值会为 OCR/UI 密集型截图保留更多视觉细节。

如需实际拆解（按注入文件、工具、Skills 和系统提示大小），请使用 `/context list` 或 `/context detail`。见[上下文](/zh-CN/concepts/context)。

## 如何查看当前词元用量

在聊天中使用：

- `/status` → **富表情 Status 卡片**，包含会话模型、上下文用量、
  上一次响应的输入/输出词元，以及**估算成本**（仅 API key）。
- `/usage off|tokens|full` → 为每条回复追加**逐响应用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 凭证**隐藏成本**（仅显示词元）。
- `/usage cost` → 显示来自 OpenClaw 会话日志的本地成本摘要。

其他表面：

- **TUI/Web TUI：**支持 `/status` + `/usage`。
- **CLI：**`openclaw status --usage` 和 `openclaw channels list` 显示
  规范化的提供商配额窗口（`X% left`，不是逐响应成本）。
  当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面在显示前会规范化常见的提供商原生字段别名。
对于 OpenAI 系列 Responses 流量，这包括 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此传输层特定的
字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 用量也会被规范化：回复文本来自 `response`，并且
`stats.cached` 映射到 `cacheRead`；当 CLI 省略显式 `stats.input` 字段时，
使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量别名会以同样方式
规范化，并且当 `total_tokens` 缺失或为 `0` 时，总量会回退到规范化后的输入 + 输出。
当当前会话快照较稀疏时，`/status` 和 `session_status` 也可以从最近的
转录用量日志中恢复词元/缓存计数器和活跃运行时模型标签。现有非零实时值仍然
优先于转录回退值；当已存储总量缺失或更小时，面向提示的较大
转录总量可以胜出。
提供商配额窗口的用量认证在可用时来自提供商特定钩子；否则 OpenClaw 会回退到
从认证配置、环境变量或配置中匹配 OAuth/API-key 凭证。
助手转录条目会持久化相同的规范化用量形状，包括
在活跃模型已配置价格且提供商返回用量元数据时的 `usage.cost`。
这让 `/usage cost` 和基于转录的会话状态在实时运行时状态消失后仍有稳定来源。

OpenClaw 将提供商用量计量与当前上下文快照分开。提供商 `usage.total` 可以包括缓存输入、输出和多次
工具循环模型调用，因此它对成本和遥测很有用，但可能会高估
实时上下文窗口。上下文显示和诊断会使用最新的提示快照（`promptTokens`，或者在没有提示快照时使用最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 万词元美元价格**。如果缺少定价，OpenClaw 只显示词元。OAuth token
永不显示美元成本。

Gateway 网关启动时还会对尚无本地定价的已配置模型引用执行可选的后台定价引导。
该引导会拉取远程 OpenRouter 和 LiteLLM 定价目录。在离线
或受限网络上，将 `models.pricing.enabled: false` 设为跳过这些启动目录拉取；显式的 `models.providers.*.models[].cost` 条目
仍会继续驱动本地成本估算。

## 缓存 TTL 和修剪影响

提供商提示缓存只在缓存 TTL 窗口内适用。OpenClaw 可以
选择性运行**缓存 TTL 修剪**：缓存 TTL 过期后修剪会话，然后重置缓存窗口，
以便后续请求可以复用新缓存的上下文，而不是重新缓存完整历史。这会在会话空闲超过 TTL 时
降低缓存写入成本。

在 [Gateway 网关配置](/zh-CN/gateway/configuration)中配置它，并在
[会话修剪](/zh-CN/concepts/session-pruning)中查看行为详情。

心跳可以跨空闲间隔保持缓存**预热**。如果你的模型缓存 TTL
是 `1h`，将心跳间隔设置为略低于该值（例如 `55m`）可以避免
重新缓存完整提示，从而减少缓存写入成本。

在多智能体设置中，你可以保持一个共享模型配置，并用 `agents.list[].params.cacheRetention`
为每个智能体调整缓存行为。

完整的逐项开关指南见[提示缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取显著低于输入
词元价格，而缓存写入按更高倍数计费。最新费率和 TTL 倍数见 Anthropic 的
提示缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：用心跳保持 1h 缓存预热

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

### 示例：使用按智能体缓存策略的混合流量

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

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以
只覆盖 `cacheRetention`，并保持其他模型默认值不变。

### 示例：启用 Anthropic 1M 上下文 beta 标头

Anthropic 的 1M 上下文窗口目前受 beta 门控。OpenClaw 可以在受支持的 Opus
或 Sonnet 模型上启用 `context1m` 时注入所需的
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

要求：凭证必须有资格使用长上下文。如果没有，
Anthropic 会对该请求返回提供商侧速率限制错误。

如果你使用 OAuth/订阅 token（`sk-ant-oat-*`）认证 Anthropic，
OpenClaw 会跳过 `context-1m-*` beta 标头，因为 Anthropic 当前
会以 HTTP 401 拒绝该组合。

## 降低词元压力的提示

- 使用 `/compact` 总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图密集型会话降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能描述简短（技能列表会注入到提示中）。
- 对冗长的探索性工作优先使用较小模型。

精确的技能列表开销公式见 [Skills](/zh-CN/tools/skills)。

## 相关

- [API 用量和成本](/zh-CN/reference/api-usage-costs)
- [提示缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
