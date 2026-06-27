---
read_when:
    - 解释 token 用量、成本或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示词上下文并报告 token 用量和成本
title: Token 用量和成本
x-i18n:
    generated_at: "2026-06-27T03:19:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 跟踪的是 **token**，而不是字符。token 与模型相关，但大多数
OpenAI 风格模型在英文文本中平均约每个 token 4 个字符。

## 系统提示词如何构建

OpenClaw 会在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；说明会按需通过 `read` 加载）。
  Native Codex 轮次会接收紧凑的 Skills 块，作为轮次级
  协作 developer instructions；其他执行框架会在普通
  提示词表面中接收它。它受 `skills.limits.maxSkillsPromptChars` 限制，
  也可以通过 `agents.list[].skillsLimits.maxSkillsPromptChars` 按智能体覆盖。
- 自更新说明
- 工作区 + 引导文件（新建时包含 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，以及存在时的 `MEMORY.md`）。当该工作区可用记忆工具时，Native Codex 轮次不会从已配置的智能体工作区粘贴原始 `MEMORY.md`；它们会在轮次级协作 developer instructions 中包含一个小型记忆指针，并按需使用记忆工具。如果工具被禁用、记忆搜索不可用，或当前活动工作区不同于智能体记忆工作区，`MEMORY.md` 会使用普通的有界轮次上下文路径。小写根目录 `memory.md` 不会被注入；当它与 `MEMORY.md` 配对时，它是 `openclaw doctor --fix` 的旧版修复输入。大型注入文件会按 `agents.defaults.bootstrapMaxChars` 截断（默认值：20000），总引导注入受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。`memory/*.md` 每日文件不是普通引导提示词的一部分；它们在常规轮次中仍通过记忆工具按需提供，但重置/启动模型运行可以为第一个轮次预置一个一次性启动上下文块，其中包含最近的每日记忆。纯聊天 `/new` 和 `/reset` 命令会被确认，但不会调用模型。启动前导由 `agents.defaults.startupContext` 控制。压缩后的 AGENTS.md 摘录是独立的，并且需要显式选择启用 `agents.defaults.compaction.postCompactionSections`。
- 时间（UTC + 用户时区）
- 回复标签 + Heartbeat 行为
- 运行时元数据（主机/操作系统/模型/思考）

完整拆解见 [系统提示词](/zh-CN/concepts/system-prompt)。

记录凭据或认证片段时，请使用
[密钥占位符约定](/zh-CN/reference/secret-placeholder-conventions)，以避免仅文档变更触发密钥扫描误报。

## 上下文窗口中计入哪些内容

模型接收的所有内容都会计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图片、音频、文件）
- 压缩摘要和裁剪产物
- 提供商包装层或安全标头（不可见，但仍会计入）

一些运行时较重的表面有自己的显式上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

按智能体覆盖项位于 `agents.list[].contextLimits` 下。这些旋钮用于
有界运行时摘录和注入的运行时拥有块。它们独立于引导限制、启动上下文限制和 Skills 提示词限制。

`toolResultMaxChars` 是一个高级上限（最高 `1000000` 个字符）。未设置时，OpenClaw 会根据有效模型上下文窗口选择实时工具结果上限：低于 100K token 时为 `16000` 字符，100K+ token 时为 `32000` 字符，200K+ token 时为 `64000` 字符，同时仍受运行时上下文份额保护限制。

对于图片，OpenClaw 会在调用提供商之前缩小转录/工具图片负载。
使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）来调整：

- 较低的值通常会减少视觉 token 使用量和负载大小。
- 较高的值会为 OCR/UI 密集型截图保留更多视觉细节。

如需实用拆解（按注入文件、工具、Skills 和系统提示词大小），请使用 `/context list` 或 `/context detail`。见 [上下文](/zh-CN/concepts/context)。

## 如何查看当前 token 使用量

在聊天中使用这些命令：

- `/status` → **富含表情符号的状态卡**，包含会话模型、上下文使用量、
  上一次响应的输入/输出 token，以及在为活动模型配置本地定价时的 **估算成本**。
- `/usage off|tokens|full` → 为每条回复追加 **单响应使用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - `/usage reset`（别名：`inherit`、`clear`、`default`）— 清除会话
    覆盖项，让会话重新继承已配置的默认值。
  - `/usage full` 仅在 OpenClaw 同时拥有使用量元数据和
    活动模型的本地定价时显示估算成本。否则只显示 token。
- `/usage cost` → 从 OpenClaw 会话日志显示本地成本摘要。

其他表面：

- **TUI/Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  规范化的提供商配额窗口（`X% left`，而不是单响应成本）。
  当前使用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量表面会在显示前规范化常见的提供商原生字段别名。
对于 OpenAI 系列 Responses 流量，这包括 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此特定传输的字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI 使用量也会被规范化：默认 `stream-json` 解析器会读取
助手 `message` 事件，而 `stats.cached` 会映射到 `cacheRead`，当 CLI 省略显式
`stats.input` 字段时使用 `stats.input_tokens - stats.cached`。旧版 JSON 覆盖项仍会从
`response` 读取回复文本。
对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 使用量别名会以相同方式规范化，并且当
`total_tokens` 缺失或为 `0` 时，总量会回退到规范化输入 + 输出。
当当前会话快照稀疏时，`/status` 和 `session_status` 也可以从
最近的转录使用量日志恢复 token/缓存计数器和活动运行时模型标签。现有非零实时值仍优先于转录回退值；当已存储总量缺失或更小时，较大的面向提示词的转录总量可以胜出。
提供商配额窗口的使用量认证在可用时来自提供商专用钩子；否则 OpenClaw 会回退到从认证配置、环境变量或配置中匹配 OAuth/API-key 凭据。
助手转录条目会持久化相同的规范化使用量形状，包括在活动模型已配置定价且提供商返回使用量元数据时的
`usage.cost`。这为 `/usage cost` 和基于转录的会话状态提供了稳定来源，即使实时运行时状态已经消失。

OpenClaw 将提供商使用量记账与当前上下文
快照分开。提供商 `usage.total` 可以包含缓存输入、输出和多个
工具循环模型调用，因此它适合用于成本和遥测，但可能夸大实时上下文窗口。上下文显示和诊断会使用最新提示词快照（`promptTokens`，或者在没有提示词快照时使用最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和 `cacheWrite` 的**每 100 万 tokens 的 USD 价格**。如果缺少定价，OpenClaw 只显示 tokens。费用显示不限于 API 密钥认证：`aws-sdk` 等非 API 密钥提供商也可以在其配置的模型条目包含本地定价且提供商返回用量元数据时显示估算费用。

在 sidecars 和渠道到达 Gateway 网关就绪路径后，OpenClaw 会为尚未已有本地定价的已配置模型引用启动可选的后台定价引导流程。该引导流程会获取远程 OpenRouter 和 LiteLLM 定价目录。在离线或受限网络上，将 `models.pricing.enabled: false` 设置为跳过这些目录获取；显式的 `models.providers.*.models[].cost` 条目会继续驱动本地费用估算。

## 缓存 TTL 和修剪影响

提供商提示词缓存只在缓存 TTL 窗口内适用。OpenClaw 可以选择运行 **cache-ttl 修剪**：它会在缓存 TTL 过期后修剪会话，然后重置缓存窗口，使后续请求可以复用刚缓存的上下文，而不是重新缓存完整历史。这样能在会话空闲超过 TTL 时降低缓存写入成本。

在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中配置它，并在 [会话修剪](/zh-CN/concepts/session-pruning) 中查看行为详情。

Heartbeat 可以让缓存跨空闲间隔保持**温热**。如果你的模型缓存 TTL 是 `1h`，将 Heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示词，从而降低缓存写入成本。

在多智能体设置中，你可以保留一个共享模型配置，并用 `agents.list[].params.cacheRetention` 为每个智能体调优缓存行为。

如需逐项参数的完整指南，请参阅 [提示词缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取比输入 tokens 便宜得多，而缓存写入会按更高倍数计费。请查看 Anthropic 的提示词缓存定价，以获取最新费率和 TTL 倍数：
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

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以只覆盖 `cacheRetention`，并原样继承其他模型默认值。

### Anthropic 1M 上下文

OpenClaw 会为 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6 等支持 GA 的 Claude 4.x 模型设置 Anthropic 的 1M 上下文窗口。你不需要为这些模型设置 `params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

较旧的配置可以保留 `context1m: true`，但 OpenClaw 不再为此设置发送 Anthropic 已退役的 `context-1m-2025-08-07` beta 头，也不会将不受支持的较旧 Claude 模型扩展到 1M。

要求：凭证必须有资格使用长上下文。如果没有，Anthropic 会对该请求返回提供商侧的速率限制错误。

如果你使用 OAuth/订阅 tokens（`sk-ant-oat-*`）认证 Anthropic，OpenClaw 会保留 OAuth 所需的 Anthropic beta 头，同时在较旧配置中仍存在已退役的 `context-1m-*` beta 时将其剥离。

## 降低 token 压力的提示

- 使用 `/compact` 总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对大量截图的会话降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 描述简短（skill 列表会被注入到提示词中）。
- 对冗长的探索性工作优先使用较小模型。

请参阅 [Skills](/zh-CN/tools/skills) 了解精确的 skill 列表开销公式。

## 相关

- [API 用量和费用](/zh-CN/reference/api-usage-costs)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
