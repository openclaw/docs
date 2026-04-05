---
read_when:
    - 你想通过缓存保留来降低提示词 token 成本
    - 你需要在多智能体设置中为每个智能体配置缓存行为
    - 你正在同时调优 heartbeat 和 cache-ttl 修剪
summary: 提示词缓存调节项、合并顺序、提供商行为和调优模式
title: Prompt Caching
x-i18n:
    generated_at: "2026-04-05T10:08:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Prompt Caching

提示词缓存意味着模型提供商可以在多轮之间复用未变化的提示词前缀（通常是 system/developer 指令和其他稳定上下文），而不是每次都重新处理它们。当上游 API 直接公开这些计数器时，OpenClaw 会将提供商使用情况统一规范化为 `cacheRead` 和 `cacheWrite`。

当实时会话快照中缺少缓存计数器时，状态表面还可以从最近的转录使用日志中恢复这些计数器，因此即使发生部分会话元数据丢失，`/status` 仍可继续显示缓存行。现有的非零实时缓存值仍优先于转录回退值。

这为什么重要：更低的 token 成本、更快的响应速度，以及对长时间运行会话而言更可预测的性能。没有缓存时，即使大部分输入没有变化，重复提示词在每一轮也都要支付完整的提示词成本。

本页涵盖所有会影响提示词复用和 token 成本的缓存相关调节项。

提供商参考：

- Anthropic prompt caching：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API headers and request IDs：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request IDs and errors：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要调节项

### `cacheRetention`（全局默认值、模型和每个智能体）

将缓存保留设置为适用于所有模型的全局默认值：

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

按模型覆盖：

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

按智能体覆盖：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

配置合并顺序：

1. `agents.defaults.params`（全局默认值——应用于所有模型）
2. `agents.defaults.models["provider/model"].params`（按模型覆盖）
3. `agents.list[].params`（匹配的智能体 id；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口之后修剪旧的工具结果上下文，这样空闲后的请求就不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为请参见[会话修剪](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以让缓存窗口保持温热，并减少空闲间隔后的重复缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

也支持在 `agents.list[].heartbeat` 中为每个智能体设置 heartbeat。

## 提供商行为

### Anthropic（直接 API）

- 支持 `cacheRetention`。
- 使用 Anthropic API 密钥认证配置文件时，如果未设置，OpenClaw 会为 Anthropic 模型引用预设 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会同时公开 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 会映射为默认的 5 分钟临时缓存，而 `cacheRetention: "long"` 仅在直接 `api.anthropic.com` 主机上升级为 1 小时 TTL。

### OpenAI（直接 API）

- 在受支持的较新模型上，提示词缓存是自动的。OpenClaw 无需注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来保持跨轮缓存路由稳定，并且仅当在直接 OpenAI 主机上选择 `cacheRetention: "long"` 时，才使用 `prompt_cache_retention: "24h"`。
- OpenAI 通过 `usage.prompt_tokens_details.cached_tokens`（或在 Responses API 事件中的 `input_tokens_details.cached_tokens`）公开缓存的提示词 token。OpenClaw 会将其映射为 `cacheRead`。
- OpenAI 不会公开单独的缓存写入 token 计数器，因此即使提供商正在预热缓存，OpenAI 路径上的 `cacheWrite` 也始终为 `0`。
- OpenAI 会返回有用的追踪和速率限制请求头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自使用情况负载，而不是请求头。
- 在实践中，OpenAI 的行为通常更像是初始前缀缓存，而不是像 Anthropic 那样移动并复用完整历史记录。稳定的长前缀文本轮次在当前实时探测中通常会停留在接近 `4864` 的缓存 token 平台，而工具密集型或 MCP 风格的转录即使在完全重复时，也常常停留在接近 `4608` 个缓存 token。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）以与直接 Anthropic 相同的方式支持 `cacheRetention`。
- `cacheRetention: "long"` 会在 Vertex AI 端点上映射到真实的 1 小时提示词缓存 TTL。
- `anthropic-vertex` 的默认缓存保留与直接 Anthropic 默认值一致。
- Vertex 请求会通过感知边界的缓存整形进行路由，因此缓存复用会与提供商实际接收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式透传 `cacheRetention`。
- 非 Anthropic 的 Bedrock 模型会在运行时被强制设为 `cacheRetention: "none"`。

### OpenRouter Anthropic 模型

对于 `openrouter/anthropic/*` 模型引用，只有当请求仍然指向已验证的 OpenRouter 路由时（默认端点上的 `openrouter`，或解析到 `openrouter.ai` 的任意提供商/base URL），OpenClaw 才会在 system/developer prompt 区块上注入 Anthropic `cache_control`，以改进提示词缓存复用。

如果你将模型重新指向任意 OpenAI 兼容代理 URL，OpenClaw 就会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持这种缓存模式，`cacheRetention` 就不会产生任何效果。

### Google Gemini 直接 API

- 直接 Gemini 传输层（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount` 报告缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 当在直接 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会在 Google AI Studio 运行中自动为系统提示词创建、复用和刷新 `cachedContents` 资源。这意味着你不再需要手动预创建 cached-content handle。
- 你仍然可以通过已配置模型中的 `params.cachedContent`（或旧版 `params.cached_content`）传入一个现有的 Gemini cached-content handle。
- 这与 Anthropic/OpenAI 的提示词前缀缓存不同。对于 Gemini，OpenClaw 管理的是提供商原生的 `cachedContents` 资源，而不是在请求中注入缓存标记。

### Gemini CLI JSON 使用情况

- Gemini CLI JSON 输出也可以通过 `stats.cached` 暴露缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 如果 CLI 省略了直接的 `stats.input` 值，OpenClaw 会根据 `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是使用情况规范化。它并不意味着 OpenClaw 正在为 Gemini CLI 创建 Anthropic/OpenAI 风格的提示词缓存标记。

## System prompt 缓存边界

OpenClaw 会将 system prompt 拆分为**稳定前缀**和**易变后缀**，两者之间由内部缓存前缀边界分隔。边界上方的内容（工具定义、Skills 元数据、工作区文件和其他相对静态的上下文）会按顺序排列，以便在各轮之间保持字节级一致。边界下方的内容（例如 `HEARTBEAT.md`、运行时时间戳和其他每轮元数据）则允许发生变化，而不会使缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，因此 heartbeat 变化不会破坏稳定前缀。
- 该边界会应用于 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输整形，因此所有受支持的提供商都能从同样的前缀稳定性中受益。
- Codex Responses 和 Anthropic Vertex 请求会通过感知边界的缓存整形进行路由，因此缓存复用会与提供商实际接收到的内容保持一致。
- System prompt 指纹会被规范化（空白、换行符、hook 添加的上下文、运行时能力排序），因此语义未变的提示词可以在多轮之间共享 KV/cache。

如果你在配置或工作区更改后看到意外的 `cacheWrite` 峰值，请检查更改内容落在缓存边界的上方还是下方。将易变内容移到边界下方（或使其稳定）通常可以解决问题。

## OpenClaw 缓存稳定性保护

在请求到达提供商之前，OpenClaw 还会保持若干对缓存敏感的负载形状具有确定性：

- 内置 MCP 工具目录会在工具注册前进行确定性排序，因此 `listTools()` 顺序变化不会扰动工具区块并破坏提示词缓存前缀。
- 带有持久化图像区块的旧版会话会保留**最近 3 个已完成轮次**不变；更早的、已经处理过的图像区块可能会被替换为标记，这样图像密集型后续请求就不会反复发送过大的旧负载。

## 调优模式

### 混合流量（推荐默认值）

在主智能体上保留长期基线，而在突发型通知智能体上禁用缓存：

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### 成本优先基线

- 将基线设置为 `cacheRetention: "short"`。
- 启用 `contextPruning.mode: "cache-ttl"`。
- 仅对能从热缓存中受益的智能体，将 heartbeat 保持在 TTL 以下。

## 缓存诊断

OpenClaw 为嵌入式智能体运行公开了专用的缓存追踪诊断。

对于常规的面向用户的诊断，当实时会话条目没有这些计数器时，`/status` 和其他使用情况摘要可以将最新转录使用条目作为 `cacheRead` / `cacheWrite` 的回退来源。

## 实时回归测试

OpenClaw 为重复前缀、工具轮次、图像轮次、MCP 风格工具转录以及 Anthropic 无缓存对照保留了一个组合式实时缓存回归门禁。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行狭义实时门禁：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件会存储最近观测到的实时数字，以及测试使用的提供商专用回归下限。
运行器还会使用每次运行都全新的会话 ID 和提示词命名空间，因此之前的缓存状态不会污染当前回归样本。

这些测试刻意不对不同提供商使用完全相同的成功标准。

### Anthropic 实时期望

- 预期通过 `cacheWrite` 看到显式预热写入。
- 预期在重复轮次中接近完全复用历史记录，因为 Anthropic 缓存控制会在整个对话过程中推进缓存断点。
- 当前实时断言仍对稳定路径、工具路径和图像路径使用高命中率阈值。

### OpenAI 实时期望

- 预期只有 `cacheRead`。`cacheWrite` 始终为 `0`。
- 将重复轮次缓存复用视为提供商特有的平台现象，而不是 Anthropic 式移动完整历史复用。
- 当前实时断言使用从 `gpt-5.4-mini` 观测到的实时行为推导出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具转录：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像转录：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格转录：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新组合实时验证结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具转录：`cacheRead=4608`，命中率 `0.896`
- 图像转录：`cacheRead=4864`，命中率 `0.954`
- MCP 风格转录：`cacheRead=4608`，命中率 `0.891`

该组合门禁最近的本地墙钟时间约为 `88s`。

这些断言之所以不同，是因为：

- Anthropic 公开了显式缓存断点以及移动式对话历史复用。
- OpenAI 提示词缓存仍然对精确前缀敏感，但在实时 Responses 流量中，可有效复用的前缀可能会比完整提示词更早进入平台期。
- 因此，如果用单一的跨提供商百分比阈值来比较 Anthropic 和 OpenAI，就会产生误报回归。

### `diagnostics.cacheTrace` 配置

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

默认值：

- `filePath`：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`：`true`
- `includePrompt`：`true`
- `includeSystem`：`true`

### 环境变量开关（一次性调试）

- `OPENCLAW_CACHE_TRACE=1` 启用缓存追踪。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 覆盖输出路径。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切换是否捕获完整消息负载。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换是否捕获提示词文本。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换是否捕获 system prompt。

### 要检查的内容

- 缓存追踪事件采用 JSONL 格式，并包含如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等分阶段快照。
- 每轮缓存 token 影响可通过常规使用情况表面中的 `cacheRead` 和 `cacheWrite` 看到（例如 `/usage full` 和会话使用情况摘要）。
- 对于 Anthropic，在缓存启用时，预期同时看到 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，在缓存命中时预期看到 `cacheRead`，而 `cacheWrite` 将保持为 `0`；OpenAI 不公开单独的缓存写入 token 字段。
- 如果你需要请求追踪，请将请求 ID 和速率限制请求头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出主要聚焦于提示词/会话形状和规范化 token 使用情况，而不是原始提供商响应请求头。

## 快速故障排除

- 大多数轮次中 `cacheWrite` 都很高：检查易变的 system prompt 输入，并确认模型/提供商支持你的缓存设置。
- Anthropic 上 `cacheWrite` 很高：通常意味着缓存断点落在了每次请求都会变化的内容上。
- OpenAI `cacheRead` 很低：确认稳定前缀位于最前面、重复前缀至少有 1024 个 token，并且在应共享缓存的各轮之间复用了相同的 `prompt_cache_key`。
- `cacheRetention` 没有效果：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- 带缓存设置的 Bedrock Nova/Mistral 请求：运行时强制为 `none` 属于预期行为。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和成本](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)
