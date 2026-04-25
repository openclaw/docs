---
read_when:
    - 你想通过保留缓存来降低提示词 token 成本。
    - 你需要在多智能体设置中为每个智能体配置缓存行为。
    - 你正在同时调优 heartbeat 和 cache-ttl 修剪。
summary: 提示词缓存控制项、合并顺序、提供商行为和调优模式
title: 提示词缓存
x-i18n:
    generated_at: "2026-04-25T05:56:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

提示词缓存意味着模型提供商可以在多轮之间复用未变化的提示词前缀（通常是 system/developer 指令和其他稳定上下文），而不是每次都重新处理它们。只要上游 API 直接暴露这些计数器，OpenClaw 就会将提供商的使用量标准化为 `cacheRead` 和 `cacheWrite`。

Status 表面在实时会话快照缺少缓存计数器时，也可以从最近的 transcript 使用日志中恢复这些计数，因此即使发生了部分会话元数据丢失，`/status` 仍然可以继续显示缓存行。已有的非零实时缓存值仍然优先于 transcript 回退值。

这为什么重要：更低的 token 成本、更快的响应，以及对长时间运行会话来说更可预测的性能。如果没有缓存，即使大部分输入没有变化，重复的提示词在每一轮也都要支付完整的提示词成本。

下面的章节涵盖了所有会影响提示词复用和 token 成本的缓存相关控制项。

提供商参考：

- Anthropic prompt caching：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API headers and request IDs：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request IDs and errors：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要控制项

### `cacheRetention`（全局默认、模型级和按智能体）

为所有模型设置全局默认的缓存保留：

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

1. `agents.defaults.params`（全局默认 —— 适用于所有模型）
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

完整行为请参见 [会话修剪](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以让缓存窗口保持温热，并减少空闲间隔后的重复缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

也支持通过 `agents.list[].heartbeat` 为每个智能体设置 heartbeat。

## 提供商行为

### Anthropic（直连 API）

- 支持 `cacheRetention`。
- 对于 Anthropic API-key auth profiles，当未设置时，OpenClaw 会为 Anthropic 模型引用预填 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会同时暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 会映射到默认的 5 分钟 ephemeral cache，而 `cacheRetention: "long"` 仅在直连 `api.anthropic.com` 主机时升级为 1 小时 TTL。

### OpenAI（直连 API）

- 支持的较新模型会自动启用提示词缓存。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来让缓存路由在多轮之间保持稳定，并且仅当在直连 OpenAI 主机上选择 `cacheRetention: "long"` 时，才使用 `prompt_cache_retention: "24h"`。
- OpenAI-compatible Completions 提供商只有在其模型配置显式设置 `compat.supportsPromptCacheKey: true` 时才会收到 `prompt_cache_key`；`cacheRetention: "none"` 仍会抑制它。
- OpenAI 响应通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件中的 `input_tokens_details.cached_tokens`）暴露缓存的提示词 token。OpenClaw 将其映射为 `cacheRead`。
- OpenAI 不暴露单独的缓存写入 token 计数器，因此在 OpenAI 路径上，即使提供商正在预热缓存，`cacheWrite` 也仍然保持为 `0`。
- OpenAI 会返回有用的追踪和限流头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自使用量负载，而不是响应头。
- 实际上，OpenAI 的行为通常更像初始前缀缓存，而不是 Anthropic 式的移动全历史复用。在当前实时探测中，稳定的长前缀文本轮次通常会停在接近 `4864` 的 cached token 平台，而工具密集型或 MCP 风格的 transcript 即使完全重复，也通常停在接近 `4608` cached token。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）对 `cacheRetention` 的支持方式与直连 Anthropic 相同。
- `cacheRetention: "long"` 会在 Vertex AI 端点上映射为真实的 1 小时提示词缓存 TTL。
- `anthropic-vertex` 的默认缓存保留策略与直连 Anthropic 的默认值一致。
- Vertex 请求会通过具备边界感知的缓存塑形进行路由，以便缓存复用与提供商实际收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式透传 `cacheRetention`。
- 非 Anthropic 的 Bedrock 模型会在运行时被强制设置为 `cacheRetention: "none"`。

### OpenRouter 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在 system/developer 提示词块上注入 Anthropic 的 `cache_control`，以改进提示词缓存复用，但前提是请求仍然指向已验证的 OpenRouter 路由（默认端点上的 `openrouter`，或任何解析到 `openrouter.ai` 的 provider/base URL）。

对于 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 和 `openrouter/zai/*` 模型引用，允许使用 `contextPruning.mode: "cache-ttl"`，因为 OpenRouter 会自动处理提供商侧的提示词缓存。OpenClaw 不会向这些请求注入 Anthropic `cache_control` 标记。

DeepSeek 的缓存构建是尽力而为的，可能需要几秒钟。紧接着的后续请求仍可能显示 `cached_tokens: 0`；请在短暂延迟后，用相同前缀重复请求来验证，并使用 `usage.prompt_tokens_details.cached_tokens` 作为缓存命中信号。

如果你把模型重新指向任意一个 OpenAI-compatible 代理 URL，OpenClaw 就会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持这种缓存模式，`cacheRetention` 就不会产生效果。

### Google Gemini 直连 API

- 直连 Gemini 传输（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount` 报告缓存命中；OpenClaw 将其映射为 `cacheRead`。
- 当在直连 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会自动为 Google AI Studio 运行创建、复用和刷新 system prompt 的 `cachedContents` 资源。这意味着你不再需要手动预先创建 cached-content handle。
- 你仍然可以通过已配置模型上的 `params.cachedContent`（或旧键 `params.cached_content`）传入一个已存在的 Gemini cached-content handle。
- 这与 Anthropic/OpenAI 的提示词前缀缓存不同。对于 Gemini，OpenClaw 管理的是提供商原生的 `cachedContents` 资源，而不是向请求中注入缓存标记。

### Gemini CLI JSON 使用量

- Gemini CLI JSON 输出也可以通过 `stats.cached` 暴露缓存命中；OpenClaw 将其映射为 `cacheRead`。
- 如果 CLI 省略了直接的 `stats.input` 值，OpenClaw 会用 `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是使用量标准化。这并不意味着 OpenClaw 正在为 Gemini CLI 创建 Anthropic/OpenAI 风格的提示词缓存标记。

## 系统提示词缓存边界

OpenClaw 会将 system prompt 拆分为一个**稳定前缀**和一个**易变后缀**，两者之间由一个内部缓存前缀边界分隔。边界之上的内容（工具定义、Skills 元数据、工作区文件以及其他相对静态的上下文）会按顺序组织，以便在多轮之间保持字节级一致。边界之下的内容（例如 `HEARTBEAT.md`、运行时时间戳和其他按轮次变化的元数据）允许变化，而不会使缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，因此 heartbeat 抖动不会破坏稳定前缀。
- 这个边界会应用到 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输塑形中，因此所有受支持的提供商都能从同样的前缀稳定性中受益。
- Codex Responses 和 Anthropic Vertex 请求会通过具备边界感知的缓存塑形进行路由，以便缓存复用与提供商实际收到的内容保持一致。
- system prompt 指纹会被标准化（空白、换行、hook 添加的上下文、运行时能力排序），因此语义上未变化的提示词可以在多轮之间共享 KV/cache。

如果你在某次配置或工作区变更后看到意外的 `cacheWrite` 激增，请检查该变更落在缓存边界的上方还是下方。将易变内容移到边界下方（或让它变稳定）通常可以解决这个问题。

## OpenClaw 的缓存稳定性保护

在请求到达提供商之前，OpenClaw 还会让几种对缓存敏感的负载形态保持确定性：

- Bundle MCP 工具目录会在工具注册前按确定性顺序排序，因此 `listTools()` 顺序变化不会扰动工具块，也不会破坏提示词缓存前缀。
- 带有已持久化图像块的旧会话会保留**最近 3 个已完成轮次**不变；更早且已经处理过的图像块可能会被替换为一个标记，这样高图像密度的后续轮次就不会反复重新发送体积庞大的旧负载。

## 调优模式

### 混合流量（推荐默认）

让主智能体保持长期基线，对突发型通知智能体禁用缓存：

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

- 将基线 `cacheRetention` 设为 `short`。
- 启用 `contextPruning.mode: "cache-ttl"`。
- 仅为真正能从温热缓存中受益的智能体，将 heartbeat 保持在 TTL 以下。

## 缓存诊断

OpenClaw 为嵌入式智能体运行公开了专用的缓存追踪诊断。

对于普通的面向用户诊断，当实时会话条目中没有 `cacheRead` / `cacheWrite` 计数器时，`/status` 和其他使用量摘要可以使用最新的 transcript 使用量条目作为回退来源。

## 实时回归测试

OpenClaw 维护了一个组合式的实时缓存回归门控，用于覆盖重复前缀、工具轮次、图像轮次、MCP 风格工具 transcript，以及一个 Anthropic 无缓存对照组。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行这个窄范围的实时门控：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件保存最近观察到的实时数值，以及测试所使用的按提供商划分的回归下限。
运行器还会使用每次运行全新的会话 ID 和提示词命名空间，这样之前的缓存状态就不会污染当前的回归样本。

这些测试有意不对所有提供商使用完全相同的成功标准。

### Anthropic 实时预期

- 预期通过 `cacheWrite` 看到显式的预热写入。
- 预期在重复轮次中能复用接近完整历史，因为 Anthropic 的缓存控制会沿着对话推进缓存断点。
- 当前实时断言仍然对稳定、工具和图像路径使用较高的命中率阈值。

### OpenAI 实时预期

- 预期只有 `cacheRead`。`cacheWrite` 会保持为 `0`。
- 应将重复轮次的缓存复用视为提供商特定的平台值，而不是 Anthropic 式的移动全历史复用。
- 当前实时断言使用基于 `gpt-5.4-mini` 实际实时行为得出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像 transcript：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新组合式实时验证结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具 transcript：`cacheRead=4608`，命中率 `0.896`
- 图像 transcript：`cacheRead=4864`，命中率 `0.954`
- MCP 风格 transcript：`cacheRead=4608`，命中率 `0.891`

该组合门控最近一次本地墙钟时间约为 `88s`。

这些断言为何不同：

- Anthropic 暴露了显式缓存断点和移动式对话历史复用。
- OpenAI 提示词缓存仍然对精确前缀敏感，但在实时 Responses 流量中，可复用的有效前缀可能会比完整提示词更早进入平台值。
- 因此，如果用一个跨提供商的统一百分比阈值去比较 Anthropic 和 OpenAI，就会产生误报回归。

### `diagnostics.cacheTrace` 配置

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 可选
    includeMessages: false # 默认 true
    includePrompt: false # 默认 true
    includeSystem: false # 默认 true
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

### 检查什么

- 缓存追踪事件是 JSONL，包含诸如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 这样的分阶段快照。
- 每轮缓存 token 的影响可以通过常规使用量表面中的 `cacheRead` 和 `cacheWrite` 看见（例如 `/usage full` 和会话使用量摘要）。
- 对于 Anthropic，在缓存生效时，预期同时看到 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，预期在缓存命中时看到 `cacheRead`，而 `cacheWrite` 保持为 `0`；OpenAI 不公布单独的缓存写入 token 字段。
- 如果你需要请求追踪，请将请求 ID 和限流响应头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出聚焦于提示词/会话形态和标准化 token 使用量，而不是原始提供商响应头。

## 快速故障排除

- 大多数轮次上 `cacheWrite` 很高：检查 system prompt 输入中是否有易变内容，并确认模型/提供商支持你的缓存设置。
- Anthropic 上 `cacheWrite` 很高：通常意味着缓存断点落在每次请求都会变化的内容上。
- OpenAI 上 `cacheRead` 很低：确认稳定前缀位于最前面、重复前缀至少有 1024 个 token，并且应该共享缓存的轮次复用了相同的 `prompt_cache_key`。
- `cacheRetention` 没有效果：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- 带缓存设置的 Bedrock Nova/Mistral 请求：预期会在运行时被强制设为 `none`。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和成本](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)

## 相关内容

- [Token 使用和成本](/zh-CN/reference/token-use)
- [API 使用量和成本](/zh-CN/reference/api-usage-costs)
