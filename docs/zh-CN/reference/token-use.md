---
read_when:
    - 解释 token 使用量、成本或上下文窗口时
    - 调试上下文增长或压缩行为时
summary: OpenClaw 如何构建提示词上下文，以及如何报告 token 使用量和成本
title: Token 使用量和成本
x-i18n:
    generated_at: "2026-04-05T10:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Token 使用量和成本

OpenClaw 跟踪的是 **token**，而不是字符。token 因模型而异，但大多数
OpenAI 风格模型对英文文本的平均值约为每个 token 4 个字符。

## 系统提示词是如何构建的

OpenClaw 会在每次运行时组装自己的系统提示词。其中包括：

- 工具列表 + 简短说明
- Skills 列表（仅元数据；说明会按需通过 `read` 加载）
- 自更新说明
- 工作区 + bootstrap 文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、新建时的 `BOOTSTRAP.md`，以及存在时的 `MEMORY.md` 或作为小写回退的 `memory.md`）。大文件会被 `agents.defaults.bootstrapMaxChars` 截断（默认值：20000），而 bootstrap 注入总量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：150000）。`memory/*.md` 文件通过 memory 工具按需加载，不会自动注入。
- 时间（UTC + 用户时区）
- 回复标签 + heartbeat 行为
- 运行时元数据（主机/操作系统/模型/thinking）

完整拆解请参见 [System Prompt](/zh-CN/concepts/system-prompt)。

## 什么会计入上下文窗口

模型接收到的所有内容都会计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- 工具调用和工具结果
- 附件/transcript（图像、音频、文件）
- 压缩摘要和剪枝产物
- 提供商包装层或安全标头（不可见，但仍会计入）

对于图像，OpenClaw 会在调用提供商之前下采样 transcript/工具图像载荷。
请使用 `agents.defaults.imageMaxDimensionPx`（默认值：`1200`）进行调节：

- 较低的值通常会减少视觉 token 用量和载荷大小。
- 较高的值会保留更多视觉细节，适用于 OCR/UI 密集型截图。

如需查看实用拆解（按每个注入文件、工具、Skills 和系统提示词大小），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 如何查看当前 token 使用量

在聊天中使用以下命令：

- `/status` → **富含 emoji 的状态卡片**，显示会话模型、上下文使用量、
  上次响应的输入/输出 token，以及**估算成本**（仅 API 密钥）。
- `/usage off|tokens|full` → 在每条回复后附加一个**按响应统计的使用量页脚**。
  - 按会话持久化（存储为 `responseUsage`）。
  - OAuth 认证**会隐藏成本**（仅显示 token）。
- `/usage cost` → 从 OpenClaw 会话日志中显示本地成本汇总。

其他界面：

- **TUI/Web TUI：** 支持 `/status` + `/usage`。
- **CLI：** `openclaw status --usage` 和 `openclaw channels list` 会显示
  规范化后的提供商配额窗口（`X% left`，而不是按响应成本）。
  当前支持使用量窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

使用量界面在显示前会规范化常见的提供商原生字段别名。
对于 OpenAI 系列 Responses 流量，这包括 `input_tokens` /
`output_tokens` 以及 `prompt_tokens` / `completion_tokens`，因此传输层特定的
字段名不会改变 `/status`、`/usage` 或会话摘要。
Gemini CLI JSON 使用量也会被规范化：回复文本来自 `response`，而
`stats.cached` 会映射到 `cacheRead`；当 CLI 省略显式的 `stats.input`
字段时，会使用 `stats.input_tokens - stats.cached`。
对于原生 OpenAI 系列 Responses 流量，WebSocket/SSE 的使用量别名也会以相同方式规范化，并且当
`total_tokens` 缺失或为 `0` 时，总量会回退到规范化后的输入 + 输出。
当当前会话快照较为稀疏时，`/status` 和 `session_status` 还可以
从最近的 transcript 使用日志中恢复 token/cache 计数器和当前运行时模型标签。现有的非零实时值仍优先于 transcript 回退值，而当存储总量缺失或更小时，较大的面向提示词的 transcript
总量可以胜出。
提供商配额窗口的使用量认证在可用时来自提供商专用 hook；否则 OpenClaw 会回退到从认证配置文件、环境或配置中匹配 OAuth/API 密钥凭据。

## 成本估算（显示时）

成本根据你的模型定价配置进行估算：

```
models.providers.<provider>.models[].cost
```

这些值表示 `input`、`output`、`cacheRead` 和
`cacheWrite` 的**每 100 万 token 美元价格**。如果缺少定价信息，OpenClaw 只显示 token。OAuth token
永远不会显示美元成本。

## 缓存 TTL 和剪枝影响

提供商提示词缓存仅在缓存 TTL 窗口内生效。OpenClaw 可选运行**cache-ttl 剪枝**：当缓存 TTL 过期后，它会剪枝会话，然后重置缓存窗口，这样后续请求就可以复用刚刚重新缓存的上下文，而不必对完整历史重新缓存。这样在会话空闲超过 TTL 后，可以保持较低的缓存写入成本。

请在 [Gateway 网关配置](/zh-CN/gateway/configuration) 中进行配置，并在
[Session pruning](/zh-CN/concepts/session-pruning) 中查看行为细节。

Heartbeat 可以在空闲间隔之间保持缓存**温热**。如果你的模型缓存 TTL
是 `1h`，将 heartbeat 间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示词，从而降低缓存写入成本。

在多智能体设置中，你可以保留一个共享模型配置，并通过
`agents.list[].params.cacheRetention` 按智能体调节缓存行为。

如需查看逐项配置指南，请参见 [Prompt Caching](/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取显著便宜于输入
token，而缓存写入则按更高倍数计费。最新费率和 TTL 倍率请参见 Anthropic 的提示词缓存定价：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：使用 heartbeat 保持 1 小时缓存温热

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

### 示例：按智能体使用不同缓存策略的混合流量

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
        every: "55m" # 为深度会话保持长期缓存温热
    - id: "alerts"
      params:
        cacheRetention: "none" # 避免为突发通知写入缓存
```

`agents.list[].params` 会合并到所选模型的 `params` 之上，因此你可以
只覆盖 `cacheRetention`，并保持其他模型默认值不变。

### 示例：启用 Anthropic 1M 上下文 beta 标头

Anthropic 的 1M 上下文窗口当前受 beta 限制。在受支持的 Opus
或 Sonnet 模型上启用 `context1m` 后，OpenClaw 可以注入所需的
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

仅当该模型条目上设置了 `context1m: true` 时，这一行为才会生效。

要求：该凭据必须有资格使用长上下文（API 密钥
计费，或启用了 Extra Usage 的 OpenClaw Claude 登录路径）。否则，
Anthropic 会响应
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

如果你使用 OAuth/订阅 token（`sk-ant-oat-*`）对 Anthropic 进行认证，
OpenClaw 会跳过 `context-1m-*` beta 标头，因为 Anthropic 当前
会以 HTTP 401 拒绝这种组合。

## 减少 token 压力的建议

- 使用 `/compact` 总结长会话。
- 在你的工作流中裁剪大型工具输出。
- 对于截图较多的会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 skill 描述简短（skill 列表会被注入到提示词中）。
- 对于冗长、探索性的工作，优先使用较小模型。

确切的 skill 列表开销公式请参见 [Skills](/zh-CN/tools/skills)。
