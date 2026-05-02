---
read_when:
    - 解释 token 使用量、费用或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示词上下文并报告词元用量和成本
title: Token 使用量和费用
x-i18n:
    generated_at: "2026-05-02T10:12:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Token 使用与成本

OpenClaw 跟踪的是 **token**，不是字符。token 因模型而异，但大多数
OpenAI 风格模型在英文文本中平均约为每个 token 4 个字符。

## 系统提示如何构建

OpenClaw 会在每次运行时组装自己的系统提示。它包括：

- 工具列表 + 简短说明
- Skills 列表（仅元数据；说明会按需用 `read` 加载）。
  紧凑的 Skills 区块受 `skills.limits.maxSkillsPromptChars` 限制，
  也可以在每个智能体上通过
  `agents.list[].skillsLimits.maxSkillsPromptChars` 覆盖。
- 自更新说明
- 工作区 + 引导文件（新建时的 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。小写根目录 `memory.md` 不会注入；当它与 `MEMORY.md` 配对时，它是 `openclaw doctor --fix` 的旧版修复输入。大型文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认值：12000），总引导注入量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 每日文件不是普通引导提示的一部分；在普通轮次中，它们仍通过记忆工具按需使用，但重置/启动模型运行可以为第一个轮次前置一个一次性启动上下文区块，其中包含最近的每日记忆。裸聊天 `/new` 和 `/reset` 命令会被确认，而不会调用模型。启动前奏由 `agents.defaults.startupContext` 控制。
- 时间（UTC + 用户时区）
- 回复标签 + Heartbeat 行为
- 运行时元数据（主机/操作系统/模型/思考）

完整拆解见 [System Prompt](/zh-CN/concepts/system-prompt)。

## 上下文窗口中计入什么

模型收到的一切都会计入上下文限制：

- 系统提示（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录内容（图片、音频、文件）
- 压缩摘要和剪枝产物
- 提供商包装器或安全头（不可见，但仍会计入）

一些运行时占用较重的表面有自己的显式上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

每个智能体的覆盖项位于 `agents.list[].contextLimits` 下。这些旋钮用于有界运行时摘录和注入的运行时自有区块。它们与引导限制、启动上下文限制和 Skills 提示限制相互独立。

对于图片，OpenClaw 会在调用提供商之前缩小转录/工具图片载荷。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）来调优：

- 较低的值通常会减少视觉 token 用量和载荷大小。
- 较高的值会为 OCR/UI 密集型截图保留更多视觉细节。

如需实用拆解（按注入文件、工具、Skills 和系统提示大小），请使用 `/context list` 或 `/context detail`。见 [Context](/zh-CN/concepts/context)。

## 如何查看当前 token 用量

在聊天中使用这些命令：

- `/status` → 带有丰富表情的 **Status 卡片**，包含会话模型、上下文用量、
  上一次响应的输入/输出 token，以及 **估算成本**（仅 API key）。
- `/usage off|tokens|full` → 为每次回复追加 **单响应用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 凭证 **会隐藏成本**（仅显示 token）。
- `/usage cost` → 从 OpenClaw 会话日志显示本地成本摘要。

其他表面：

- **TUI/Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  规范化的提供商配额窗口（`X% left`，不是单响应成本）。
  当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面会在显示前规范化常见的提供商原生字段别名。
对于 OpenAI 系列 Responses 流量，这包括 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此传输专用字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 用量也会被规范化：回复文本来自 `response`，并且
`stats.cached` 会映射到 `cacheRead`；当 CLI 省略显式 `stats.input` 字段时，会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量别名会以相同方式规范化，并且当 `total_tokens` 缺失或为 `0` 时，总量会回退为规范化的输入 + 输出。
当当前会话快照稀疏时，`/status` 和 `session_status` 也可以从最近的转录用量日志中恢复 token/缓存计数器和活动运行时模型标签。现有的非零实时值仍优先于转录回退值，并且当已存储总量缺失或更小时，更大的、面向提示的转录总量可以胜出。
提供商配额窗口的用量凭证在可用时来自提供商特定钩子；否则，OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API key 凭证。
助手转录条目会持久化相同的规范化用量形状，包括当活动模型已配置价格且提供商返回用量元数据时的 `usage.cost`。即使实时运行时状态已经消失，这也会为 `/usage cost` 和基于转录的会话状态提供稳定来源。

OpenClaw 将提供商用量计量与当前上下文快照分开。提供商 `usage.total` 可以包括缓存输入、输出和多个工具循环模型调用，因此它对成本和遥测有用，但可能夸大实时上下文窗口。上下文显示和诊断会使用最新提示快照（`promptTokens`，或没有提示快照时的最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和 `cacheWrite` 的 **每 100 万 token 美元价格**。如果缺少定价，OpenClaw 只显示 token。OAuth token 永远不会显示美元成本。

当 sidecar 和渠道到达 Gateway 网关就绪路径后，OpenClaw 会为尚无本地定价的已配置模型引用启动可选的后台定价引导。该引导会获取远程 OpenRouter 和 LiteLLM 定价目录。在离线或受限网络中，将 `models.pricing.enabled: false` 设为跳过这些目录获取；显式
`models.providers.*.models[].cost` 条目会继续驱动本地成本估算。

## 缓存 TTL 和剪枝影响

提供商提示缓存只会在缓存 TTL 窗口内适用。OpenClaw 可以选择运行 **cache-ttl 剪枝**：它会在缓存 TTL 过期后剪枝会话，然后重置缓存窗口，这样后续请求可以复用新缓存的上下文，而不是重新缓存完整历史。当会话空闲时间超过 TTL 时，这会降低缓存写入成本。

在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中配置它，并在 [Session pruning](/zh-CN/concepts/session-pruning) 中查看行为细节。

Heartbeat 可以让缓存在空闲间隔中保持 **温热**。如果你的模型缓存 TTL 是 `1h`，将 Heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示，从而降低缓存写入成本。

在多智能体设置中，你可以保留一个共享模型配置，并通过 `agents.list[].params.cacheRetention` 为每个智能体调优缓存行为。

完整逐项旋钮指南见 [Prompt Caching](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取比输入 token 便宜得多，而缓存写入会按更高倍数计费。最新费率和 TTL 倍数见 Anthropic 的提示缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：用 Heartbeat 保持 1 小时缓存温热

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

### 示例：按智能体缓存策略处理混合流量

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

### 示例：启用 Anthropic 100 万上下文 beta 头

Anthropic 的 100 万上下文窗口目前受 beta 门控。OpenClaw 可以在受支持的 Opus 或 Sonnet 模型上启用 `context1m` 时，注入所需的 `anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这会映射到 Anthropic 的 `context-1m-2025-08-07` beta 头。

这只会在该模型条目上设置了 `context1m: true` 时适用。

要求：凭证必须有资格使用长上下文。否则，Anthropic 会针对该请求返回提供商侧速率限制错误。

如果你使用 OAuth/订阅 token（`sk-ant-oat-*`）认证 Anthropic，OpenClaw 会跳过 `context-1m-*` beta 头，因为 Anthropic 目前会以 HTTP 401 拒绝该组合。

## 降低 token 压力的提示

- 使用 `/compact` 总结长会话。
- 在你的工作流中修剪大型工具输出。
- 对截图密集型会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skills 说明简短（Skills 列表会注入提示）。
- 对冗长的探索性工作，优先使用更小的模型。

精确的 Skills 列表开销公式见 [Skills](/zh-CN/tools/skills)。

## 相关

- [API 用量和成本](/zh-CN/reference/api-usage-costs)
- [提示缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
