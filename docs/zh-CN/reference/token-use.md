---
read_when:
    - 说明令牌用量、费用或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示词上下文并报告 token 用量和费用
title: Token 用量和费用
x-i18n:
    generated_at: "2026-05-06T05:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 跟踪的是**词元**，不是字符。词元因模型而异，但大多数 OpenAI 风格模型在英文文本中平均约为每个词元 4 个字符。

## 系统提示词是如何构建的

OpenClaw 会在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；指令会按需通过 `read` 加载）。
  紧凑 Skills 块受 `skills.limits.maxSkillsPromptChars` 限制，
  可在 `agents.list[].skillsLimits.maxSkillsPromptChars` 处按智能体覆盖。
- 自更新指令
- 工作区 + 引导文件（新建时包括 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，存在时还包括 `MEMORY.md`）。小写的根目录 `memory.md` 不会被注入；当它与 `MEMORY.md` 配对时，它是 `openclaw doctor --fix` 的旧版修复输入。大文件会按 `agents.defaults.bootstrapMaxChars` 截断（默认值：12000），总引导注入量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 每日文件不是常规引导提示词的一部分；在普通轮次中它们仍通过记忆工具按需使用，但重置/启动模型运行可以为第一轮预置一个一次性的启动上下文块，其中包含最近的每日记忆。裸聊天 `/new` 和 `/reset` 命令会被确认，但不会调用模型。启动前导由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + Heartbeat 行为
- 运行时元数据（主机/OS/模型/thinking）

完整拆解见[系统提示词](/zh-CN/concepts/system-prompt)。

## 上下文窗口中会计入什么

模型收到的所有内容都会计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录内容（图像、音频、文件）
- 压缩摘要和剪枝产物
- 提供商包装器或安全标头（不可见，但仍会计入）

一些运行时较重的表面有自己的显式上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

按智能体覆盖项位于 `agents.list[].contextLimits` 下。这些旋钮用于有界运行时摘录和运行时拥有的注入块。它们独立于引导限制、启动上下文限制和 Skills 提示词限制。

对于图像，OpenClaw 会在调用提供商前下采样转录/工具图像载荷。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）进行调优：

- 较低的值通常会减少视觉词元用量和载荷大小。
- 较高的值会为 OCR/UI 密集型截图保留更多视觉细节。

如需实用拆解（按注入文件、工具、Skills 和系统提示词大小），使用 `/context list` 或 `/context detail`。见[上下文](/zh-CN/concepts/context)。

## 如何查看当前词元用量

在聊天中使用这些命令：

- `/status` → **带有丰富 emoji 的状态卡片**，显示会话模型、上下文用量、上次响应的输入/输出词元，以及**估算成本**（仅 API key）。
- `/usage off|tokens|full` → 为每条回复附加**逐响应用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 凭证**隐藏成本**（仅显示词元）。
- `/usage cost` → 从 OpenClaw 会话日志显示本地成本摘要。

其他表面：

- **TUI/Web TUI：**支持 `/status` + `/usage`。
- **CLI：**`openclaw status --usage` 和 `openclaw channels list` 会显示
  规范化的提供商配额窗口（`X% left`，不是逐响应成本）。
  当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面会在显示前规范化常见的提供商原生字段别名。
对于 OpenAI 系列 Responses 流量，这包括 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此传输特定的字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 用量也会被规范化：回复文本来自 `response`，并且
`stats.cached` 映射到 `cacheRead`；当 CLI 省略显式的 `stats.input` 字段时，会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量别名会以相同方式规范化；当 `total_tokens` 缺失或为 `0` 时，总量会回退到规范化输入 + 输出。
当当前会话快照较稀疏时，`/status` 和 `session_status` 还可以从最近的转录用量日志中恢复词元/缓存计数器和当前活动运行时模型标签。现有的非零实时值仍优先于转录回退值；当存储总量缺失或更小时，较大的面向提示词的转录总量可以胜出。
提供商配额窗口的用量凭证在可用时来自提供商特定钩子；否则 OpenClaw 会回退到从 auth profiles、环境变量或配置中匹配 OAuth/API-key 凭证。
助手转录条目会持久化相同的规范化用量形状，包括当活动模型已配置价格且提供商返回用量元数据时的 `usage.cost`。这让 `/usage cost` 和基于转录的会话状态在实时运行时状态消失后仍有稳定来源。

OpenClaw 将提供商用量计量与当前上下文快照分开。提供商 `usage.total` 可以包含缓存输入、输出和多次工具循环模型调用，因此它适合成本和遥测，但可能会高估实时上下文窗口。上下文显示和诊断使用最新提示词快照（`promptTokens`，或没有提示词快照时的最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型价格配置估算：

```
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和 `cacheWrite` 的**每 100 万词元美元价格**。如果缺少价格，OpenClaw 只显示词元。OAuth 词元从不显示美元成本。

当 sidecar 和渠道到达 Gateway 网关就绪路径后，OpenClaw 会为尚无本地价格的已配置模型引用启动可选后台价格引导。该引导会获取远程 OpenRouter 和 LiteLLM 价格目录。在离线或受限网络上，将 `models.pricing.enabled: false` 设为跳过这些目录获取；显式的 `models.providers.*.models[].cost` 条目会继续驱动本地成本估算。

## 缓存 TTL 和剪枝影响

提供商提示词缓存只在缓存 TTL 窗口内生效。OpenClaw 可以选择运行**缓存 TTL 剪枝**：它会在缓存 TTL 过期后剪枝会话，然后重置缓存窗口，使后续请求可以复用新缓存的上下文，而不是重新缓存完整历史记录。当会话空闲超过 TTL 时，这可以降低缓存写入成本。

在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中配置它，并在[会话剪枝](/zh-CN/concepts/session-pruning)中查看行为详情。

Heartbeat 可以在空闲间隔期间让缓存保持**温热**。如果你的模型缓存 TTL 是 `1h`，将 Heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示词，从而减少缓存写入成本。

在多智能体设置中，你可以保留一个共享模型配置，并用 `agents.list[].params.cacheRetention` 按智能体调优缓存行为。

如需完整的逐旋钮指南，见[提示词缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 价格，缓存读取明显便宜于输入词元，而缓存写入会按更高倍数计费。最新费率和 TTL 倍数见 Anthropic 的提示词缓存价格：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：用 Heartbeat 保持 1h 缓存温热

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

### 示例：按智能体缓存策略混合流量

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

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以只覆盖 `cacheRetention`，并继承其他模型默认值且保持不变。

### 示例：启用 Anthropic 1M 上下文 beta 标头

Anthropic 的 1M 上下文窗口目前受 beta 门控。OpenClaw 可以在受支持的 Opus 或 Sonnet 模型上启用 `context1m` 时，注入所需的 `anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这会映射到 Anthropic 的 `context-1m-2025-08-07` beta 标头。

这仅在该模型条目上设置 `context1m: true` 时适用。

要求：凭证必须有资格使用长上下文。否则，Anthropic 会为该请求返回提供商侧速率限制错误。

如果你使用 OAuth/订阅词元（`sk-ant-oat-*`）向 Anthropic 认证，OpenClaw 会跳过 `context-1m-*` beta 标头，因为 Anthropic 目前会以 HTTP 401 拒绝该组合。

## 减少词元压力的提示

- 使用 `/compact` 汇总长会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图密集型会话降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能描述简短（技能列表会被注入提示词）。
- 对冗长的探索性工作优先使用较小模型。

准确的技能列表开销公式见 [Skills](/zh-CN/tools/skills)。

## 相关

- [API 用量和成本](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
