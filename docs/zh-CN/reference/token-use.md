---
read_when:
    - 说明 token 使用量、费用或上下文窗口
    - 调试上下文增长或压缩行为
summary: OpenClaw 如何构建提示上下文并报告 token 用量和成本
title: 令牌使用量和费用
x-i18n:
    generated_at: "2026-07-01T18:07:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw 跟踪的是 **token**，不是字符。token 因模型而异，但大多数 OpenAI 风格模型处理英文文本时，平均约 4 个字符对应 1 个 token。

## 系统提示词如何构建

OpenClaw 会在每次运行时组装自己的系统提示词。它包括：

- 工具列表 + 简短描述
- Skills 列表（仅元数据；指令会按需通过 `read` 加载）。
  原生 Codex 轮次会接收紧凑 Skills 块，作为轮次作用域的协作开发者指令；其他 harness 会在常规提示词表面接收它。它受 `skills.limits.maxSkillsPromptChars` 限制，并可通过 `agents.list[].skillsLimits.maxSkillsPromptChars` 配置可选的按 Agent 覆盖。
- 自更新指令
- 工作区 + 引导文件（新建时包含 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，存在时还包含 `MEMORY.md`）。当该工作区可用记忆工具时，原生 Codex 轮次不会从已配置的 Agent 工作区粘贴原始 `MEMORY.md`；它们会在轮次作用域的协作开发者指令中包含一个小型记忆指针，并按需使用记忆工具。如果工具被禁用、记忆搜索不可用，或活跃工作区不同于 Agent 记忆工作区，`MEMORY.md` 会使用常规的有界轮次上下文路径。小写根目录 `memory.md` 不会被注入；当它与 `MEMORY.md` 配对时，只是 `openclaw doctor --fix` 的旧版修复输入。大型注入文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认：20000），引导注入总量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认：60000）。`memory/*.md` 每日文件不是常规引导提示词的一部分；在普通轮次中，它们仍可通过记忆工具按需访问，但重置/启动模型运行可以为第一个轮次前置一个一次性的启动上下文块，其中包含最近的每日记忆。裸聊天 `/new` 和 `/reset` 命令会被确认，但不会调用模型。启动前导由 `agents.defaults.startupContext` 控制。压缩后的 AGENTS.md 摘录是独立机制，并且需要显式通过 `agents.defaults.compaction.postCompactionSections` 选择启用。
- 时间（UTC + 用户时区）
- 回复标签 + Heartbeat 行为
- 运行时元数据（主机/操作系统/模型/thinking）

完整拆解见 [系统提示词](/zh-CN/concepts/system-prompt)。

记录凭证或认证片段时，请使用
[密钥占位符约定](/zh-CN/reference/secret-placeholder-conventions)，以避免仅文档变更触发密钥扫描误报。

## 上下文窗口中计入哪些内容

模型接收的一切都会计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/转录（图片、音频、文件）
- 压缩摘要和剪枝产物
- 提供商包装层或安全标头（不可见，但仍会计入）

一些运行时较重的表面有自己的显式上限：

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

按 Agent 覆盖位于 `agents.list[].contextLimits` 下。这些旋钮用于有界运行时摘录和注入的运行时拥有块。它们独立于引导限制、启动上下文限制和 Skills 提示词限制。

`toolResultMaxChars` 是高级上限（最高 `1000000` 个字符）。未设置时，OpenClaw 会从有效模型上下文窗口选择实时工具结果上限：低于 100K token 时为 `16000` 个字符，100K+ token 时为 `32000` 个字符，200K+ token 时为 `64000` 个字符，同时仍受运行时上下文占比保护限制。

对于图片，OpenClaw 会在调用提供商前缩小转录/工具图片载荷。
使用 `agents.defaults.imageMaxDimensionPx`（默认：`1200`）调节：

- 较低的值通常会减少视觉 token 使用量和载荷大小。
- 较高的值会为 OCR/UI 密集截图保留更多视觉细节。

如需实用拆解（按注入文件、工具、Skills 和系统提示词大小），请使用 `/context list` 或 `/context detail`。见 [上下文](/zh-CN/concepts/context)。

## 如何查看当前 token 使用量

在聊天中使用这些命令：

- `/status` → **富 emoji 状态卡**，显示会话模型、上下文使用量、上一次响应的输入/输出 token，以及当活跃模型配置了本地定价时显示的 **估算成本**。
- `/usage off|tokens|full` → 在每条回复后追加 **每响应用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - `/usage reset`（别名：`inherit`、`clear`、`default`）— 清除会话覆盖，使会话重新继承已配置的默认值。
  - `/usage tokens` 显示轮次 token/缓存详情。
  - `/usage full` 显示紧凑的模型/上下文/成本详情；只有在 OpenClaw 拥有活跃模型的用量元数据和本地定价时，才会显示估算成本。
    自定义 `messages.usageTemplate` 布局可以包含 token/缓存字段。
- `/usage cost` → 从 OpenClaw 会话日志显示本地成本摘要。

其他表面：

- **TUI/Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 显示
  规范化的提供商配额窗口（`X% left`，不是每响应成本）。
  当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

用量表面会在显示前规范化常见的提供商原生字段别名。
对于 OpenAI 系列 Responses 流量，这包括 `input_tokens` /
`output_tokens` 和 `prompt_tokens` / `completion_tokens`，因此特定传输的字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI 用量也会被规范化：默认 `stream-json` 解析器读取助手 `message` 事件，并且 `stats.cached` 会映射到 `cacheRead`；当 CLI 省略显式 `stats.input` 字段时，会使用 `stats.input_tokens - stats.cached`。旧版 JSON 覆盖仍从 `response` 读取回复文本。
对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 用量别名会以相同方式规范化，并且当 `total_tokens` 缺失或为 `0` 时，总量会回退到规范化输入 + 输出。
当当前会话快照稀疏时，`/status` 和 `session_status` 还可以从最近的转录用量日志中恢复 token/缓存计数器以及活跃运行时模型标签。现有的非零实时值仍优先于转录回退值；当存储总量缺失或更小时，更大的偏提示词转录总量可以胜出。
提供商配额窗口的用量认证在可用时来自提供商特定钩子；否则 OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API key 凭证。
助手转录条目会持久化同一个规范化用量形状，包括当活跃模型已配置定价且提供商返回用量元数据时的 `usage.cost`。这让 `/usage cost` 和基于转录的会话状态即使在实时运行时状态消失后，也有稳定来源。

OpenClaw 将提供商用量统计与当前上下文快照分开。提供商 `usage.total` 可以包含缓存输入、输出以及多次工具循环模型调用，因此它对成本和遥测有用，但可能高估实时上下文窗口。上下文显示和诊断会使用最新的提示词快照（`promptTokens`，或当没有提示词快照可用时使用最后一次模型调用）作为 `context.used`。

## 成本估算（显示时）

成本根据你的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和
`cacheWrite` 的 **每 100 万 token 美元价格**。如果缺少定价，`/usage full` 会省略成本；当你需要在每条回复中查看 token/缓存详情时，请使用 `/usage tokens` 或自定义 `messages.usageTemplate`。成本显示不限于 API key 认证：`aws-sdk` 等非 API key 提供商也可以在其已配置模型条目包含本地定价且提供商返回用量元数据时显示估算成本。

当 sidecar 和渠道到达 Gateway 网关就绪路径后，OpenClaw 会为尚未具备本地定价的已配置模型引用启动一个可选的后台定价引导。该引导会获取远程 OpenRouter 和 LiteLLM 定价目录。在离线或受限网络上，可设置 `models.pricing.enabled: false` 跳过这些目录获取；显式的 `models.providers.*.models[].cost` 条目会继续驱动本地成本估算。

## 缓存 TTL 和剪枝影响

提供商提示词缓存只在缓存 TTL 窗口内生效。OpenClaw 可以选择运行 **缓存 TTL 剪枝**：它会在缓存 TTL 过期后剪枝会话，然后重置缓存窗口，使后续请求可以复用刚刚缓存的新上下文，而不是重新缓存完整历史。这样可以在会话空闲超过 TTL 后降低缓存写入成本。

在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中配置它，并在 [会话剪枝](/zh-CN/concepts/session-pruning) 中查看行为详情。

Heartbeat 可以在空闲间隔中让缓存保持 **温热**。如果你的模型缓存 TTL 是 `1h`，将 Heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示词，从而降低缓存写入成本。

在多 Agent 设置中，你可以保留一个共享模型配置，并通过 `agents.list[].params.cacheRetention` 按 Agent 调节缓存行为。

完整逐项旋钮指南见 [提示词缓存](/zh-CN/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取明显比输入 token 便宜，而缓存写入会按更高倍率计费。最新费率和 TTL 倍率请参阅 Anthropic 的提示词缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：用 Heartbeat 让 1h 缓存保持温热

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

### 示例：按 Agent 缓存策略处理混合流量

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

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以只覆盖 `cacheRetention`，并保持其他模型默认值不变。

### Anthropic 1M 上下文

OpenClaw 会将 Opus 4.8、Opus 4.7、Opus 4.6 和
Sonnet 4.6 等具备 GA 能力的 Claude 4.x 模型按 Anthropic 的 1M 上下文窗口设定大小。你不需要为这些模型设置 `params.context1m: true`。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

较旧配置可以保留 `context1m: true`，但 OpenClaw 不再为此设置发送 Anthropic 已退役的 `context-1m-2025-08-07` beta 标头，也不会将不受支持的较旧 Claude 模型扩展到 1M。

要求：凭证必须有资格使用长上下文。否则，Anthropic 会针对该请求返回提供商侧速率限制错误。

如果你使用 OAuth/订阅 token（`sk-ant-oat-*`）认证 Anthropic，OpenClaw 会保留 OAuth 所需的 Anthropic beta 标头，同时在旧配置中仍存在时移除已退役的 `context-1m-*` beta。

## 减少 token 压力的技巧

- 使用 `/compact` 总结较长的会话。
- 在你的工作流中裁剪大型工具输出。
- 对截图密集的会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持技能描述简短（技能列表会注入到提示中）。
- 对冗长的探索性工作，优先使用较小的模型。

有关精确的技能列表开销公式，请参阅 [Skills](/zh-CN/tools/skills)。

## 相关

- [API 用量和费用](/zh-CN/reference/api-usage-costs)
- [提示缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)
