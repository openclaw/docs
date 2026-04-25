---
read_when:
    - 你想通过缓存保留来降低提示词 Token 成本
    - 你需要在多智能体设置中为每个智能体提供缓存行为
    - 你正在同时调优心跳和 `cache-ttl` 清理策略
summary: 提示缓存控制项、合并顺序、提供商行为和调优模式
title: 提示缓存
x-i18n:
    generated_at: "2026-04-25T02:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a37a4283b9f45e0575bbe69ad27830b4c1c434193f0b3795208cdda37c49526
    source_path: reference/prompt-caching.md
    workflow: 15
---

提示缓存意味着模型提供商可以在多轮之间复用未变化的提示前缀（通常是 system/developer 指令和其他稳定上下文），而不是每次都重新处理这些内容。只要上游 API 直接暴露这些计数器，OpenClaw 就会将提供商的用量统一规范为 `cacheRead` 和 `cacheWrite`。

当实时会话快照缺少这些缓存计数器时，状态界面也可以从最近一次转录记录的 usage 日志中恢复缓存计数，因此即使发生部分会话元数据丢失，`/status` 仍能继续显示缓存相关行。现有的非零实时缓存值仍然优先于转录回退值。

这为什么重要：更低的 Token 成本、更快的响应速度，以及对长时间运行会话而言更可预测的性能。如果没有缓存，即使大部分输入没有变化，重复提示也会在每一轮都支付完整的提示成本。

本页介绍所有会影响提示复用和 Token 成本的缓存相关控制项。

提供商参考：

- Anthropic 提示缓存：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示缓存：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 标头和请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 和错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要控制项

### `cacheRetention`（全局默认、模型级和每个智能体）

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

1. `agents.defaults.params`（全局默认值——适用于所有模型）
2. `agents.defaults.models["provider/model"].params`（按模型覆盖）
3. `agents.list[].params`（匹配的智能体 id；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口之后清理旧的工具结果上下文，这样在空闲后发起请求时就不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为请参见[会话清理](/zh-CN/concepts/session-pruning)。

### 心跳保温

心跳可以保持缓存窗口处于“热”状态，并减少空闲间隔后重复发生的缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

也支持在 `agents.list[].heartbeat` 中为每个智能体设置心跳。

## 提供商行为

### Anthropic（直连 API）

- 支持 `cacheRetention`。
- 对于 Anthropic API 密钥认证配置文件，当未设置时，OpenClaw 会为 Anthropic 模型引用预设 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会同时暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 会映射为默认的 5 分钟临时缓存，而 `cacheRetention: "long"` 仅会在直连 `api.anthropic.com` 主机时升级为 1 小时 TTL。

### OpenAI（直连 API）

- 在受支持的较新模型上，提示缓存是自动的。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来保持多轮之间的缓存路由稳定，并且只有在直连 OpenAI 主机上选择 `cacheRetention: "long"` 时，才会使用 `prompt_cache_retention: "24h"`。
- 对于 OpenAI 兼容的 Completions 提供商，只有当其模型配置显式设置 `compat.supportsPromptCacheKey: true` 时，才会接收 `prompt_cache_key`；`cacheRetention: "none"` 仍会抑制它。
- OpenAI 通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件中的 `input_tokens_details.cached_tokens`）暴露缓存的提示 Token。OpenClaw 会将其映射为 `cacheRead`。
- OpenAI 不会暴露单独的缓存写入 Token 计数器，因此即使提供商正在预热缓存，在 OpenAI 路径上 `cacheWrite` 仍保持为 `0`。
- OpenAI 会返回有用的追踪和限速标头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自 usage 负载，而不是标头。
- 在实践中，OpenAI 的行为通常更像是初始前缀缓存，而不是 Anthropic 那种可移动的完整历史复用。对于稳定的长前缀文本轮次，在当前实时探测中，缓存 Token 常常会停留在接近 `4864` 的平台值；而对工具密集型或 MCP 风格的转录，即使完全重复，也常常停留在接近 `4608` 个缓存 Token。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）对 `cacheRetention` 的支持方式与直连 Anthropic 相同。
- `cacheRetention: "long"` 会在 Vertex AI 端点上映射为真实的 1 小时提示缓存 TTL。
- `anthropic-vertex` 的默认缓存保留策略与直连 Anthropic 的默认值一致。
- Vertex 请求会经过具备边界感知能力的缓存整形流程，因此缓存复用会与提供商实际接收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式透传 `cacheRetention`。
- 非 Anthropic 的 Bedrock 模型会在运行时被强制设置为 `cacheRetention: "none"`。

### OpenRouter Anthropic 模型

对于 `openrouter/anthropic/*` 模型引用，只有当请求仍指向已验证的 OpenRouter 路由（默认端点上的 `openrouter`，或任何解析到 `openrouter.ai` 的提供商 / base URL）时，OpenClaw 才会在 system/developer 提示块上注入 Anthropic 的 `cache_control`，以提高提示缓存复用。

如果你将模型改为指向任意 OpenAI 兼容代理 URL，OpenClaw 就会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持这种缓存模式，`cacheRetention` 将不会生效。

### Google Gemini 直连 API

- 直连 Gemini 传输（`api: "google-generative-ai"`）会通过上游 `cachedContentTokenCount` 报告缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 当在直连 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会在 Google AI Studio 运行中自动创建、复用并刷新用于 system 提示的 `cachedContents` 资源。这意味着你不再需要手动预先创建缓存内容句柄。
- 你仍然可以通过已配置模型中的 `params.cachedContent`（或旧版 `params.cached_content`）传入一个预先存在的 Gemini 缓存内容句柄。
- 这与 Anthropic/OpenAI 的提示前缀缓存不同。对于 Gemini，OpenClaw 管理的是提供商原生的 `cachedContents` 资源，而不是在请求中注入缓存标记。

### Gemini CLI JSON 用量

- Gemini CLI JSON 输出也可以通过 `stats.cached` 暴露缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 如果 CLI 省略了直接的 `stats.input` 值，OpenClaw 会通过 `stats.input_tokens - stats.cached` 推导输入 Token。
- 这只是用量规范化。它并不意味着 OpenClaw 正在为 Gemini CLI 创建 Anthropic/OpenAI 风格的提示缓存标记。

## 系统提示缓存边界

OpenClaw 会将 system 提示拆分为**稳定前缀**和**易变后缀**，两者之间通过一个内部缓存前缀边界分隔。边界之上的内容（工具定义、Skills 元数据、工作区文件和其他相对静态的上下文）会按顺序组织，以便在多轮之间保持字节级一致。边界之下的内容（例如 `HEARTBEAT.md`、运行时时间戳和其他每轮元数据）则允许发生变化，而不会使已缓存的前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排列在 `HEARTBEAT.md` 之前，因此心跳抖动不会破坏稳定前缀。
- 该边界会应用于 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输整形，因此所有受支持的提供商都能从同样的前缀稳定性中受益。
- Codex Responses 和 Anthropic Vertex 请求会经过具备边界感知能力的缓存整形流程，因此缓存复用会与提供商实际接收到的内容保持一致。
- system 提示指纹会进行规范化处理（空白、换行符、hook 添加的上下文、运行时能力排序），因此在语义未变化的情况下，多轮之间可以共享 KV/缓存。

如果你在配置或工作区变更之后看到意外的 `cacheWrite` 峰值，请检查该变更是落在缓存边界之上还是之下。将易变内容移到边界之下（或使其稳定）通常可以解决这个问题。

## OpenClaw 的缓存稳定性保护机制

在请求到达提供商之前，OpenClaw 还会让若干对缓存敏感的负载形态保持确定性：

- Bundle MCP 工具目录会在工具注册之前按确定性顺序排序，因此 `listTools()` 顺序变化不会扰动工具块，也不会破坏提示缓存前缀。
- 旧版会话中带有持久化图片块的内容会保留**最近 3 个已完成轮次**的完整内容；更早且已经处理过的图片块可能会被替换为一个标记，这样后续以图片为主的跟进就不会重复发送大量陈旧负载。

## 调优模式

### 混合流量（推荐默认值）

为主智能体保持长期基线缓存，而对突发型通知智能体禁用缓存：

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
- 仅对那些能从热缓存中受益的智能体，将心跳保持在你的 TTL 之下。

## 缓存诊断

OpenClaw 为嵌入式智能体运行提供了专用的缓存追踪诊断。

对于常规的面向用户诊断，当实时会话条目中没有 `cacheRead` / `cacheWrite` 计数器时，`/status` 和其他 usage 汇总可以使用最新的转录 usage 条目作为回退来源。

## 实时回归测试

OpenClaw 保留了一个统一的实时缓存回归门禁，用于覆盖重复前缀、工具轮次、图片轮次、MCP 风格工具转录，以及一个 Anthropic 无缓存对照组。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行窄范围实时门禁：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件会存储最近一次观察到的实时数值，以及测试使用的提供商特定回归下限。
运行器还会使用每次运行全新的会话 ID 和提示命名空间，因此先前的缓存状态不会污染当前的回归样本。

这些测试有意不在所有提供商之间使用完全相同的成功标准。

### Anthropic 实时期望

- 预期通过 `cacheWrite` 看到显式的预热写入。
- 由于 Anthropic 缓存控制会在整个对话过程中推进缓存断点，因此在重复轮次中预期可以复用几乎完整的历史记录。
- 当前实时断言仍然对稳定、工具和图片路径使用较高的命中率阈值。

### OpenAI 实时期望

- 仅预期有 `cacheRead`。`cacheWrite` 保持为 `0`。
- 将重复轮次中的缓存复用视为提供商特定的平台值，而不是 Anthropic 式的可移动完整历史复用。
- 当前实时断言对 `gpt-5.4-mini` 上观察到的实时行为使用保守的下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具转录：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图片转录：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格转录：`cacheRead >= 4096`，命中率 `>= 0.85`

在 2026-04-04 的最新一次合并实时验证中，结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具转录：`cacheRead=4608`，命中率 `0.896`
- 图片转录：`cacheRead=4864`，命中率 `0.954`
- MCP 风格转录：`cacheRead=4608`，命中率 `0.891`

该合并门禁最近一次本地墙钟时间约为 `88s`。

这些断言之所以不同，原因在于：

- Anthropic 会暴露明确的缓存断点，以及可移动的会话历史复用。
- OpenAI 的提示缓存仍然对精确前缀敏感，但在实时 Responses 流量中，可有效复用的前缀可能会比完整提示更早进入平台期。
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
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换是否捕获提示文本。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换是否捕获 system 提示。

### 要检查的内容

- 缓存追踪事件采用 JSONL 格式，并包含诸如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 之类的分阶段快照。
- 每轮缓存 Token 的影响可以通过常规 usage 界面中的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和会话 usage 汇总）。
- 对于 Anthropic，当缓存处于激活状态时，预期会看到 `cacheRead` 和 `cacheWrite` 两者。
- 对于 OpenAI，缓存命中时预期会看到 `cacheRead`，而 `cacheWrite` 保持为 `0`；OpenAI 不会发布单独的缓存写入 Token 字段。
- 如果你需要请求追踪，请将请求 ID 和限速标头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出侧重于提示 / 会话形态和规范化的 Token usage，而不是原始提供商响应标头。

## 快速故障排除

- 大多数轮次都出现较高的 `cacheWrite`：检查 system 提示输入中是否包含易变内容，并确认模型 / 提供商支持你的缓存设置。
- Anthropic 上 `cacheWrite` 较高：通常意味着缓存断点落在了每次请求都会变化的内容上。
- OpenAI 的 `cacheRead` 偏低：确认稳定前缀位于最前面，重复前缀至少有 1024 个 Token，并且对于应共享缓存的轮次复用了同一个 `prompt_cache_key`。
- `cacheRetention` 没有效果：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- 带有缓存设置的 Bedrock Nova/Mistral 请求：运行时强制设为 `none` 属于预期行为。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和成本](/zh-CN/reference/token-use)
- [会话清理](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)

## 相关内容

- [Token 使用和成本](/zh-CN/reference/token-use)
- [API 使用和成本](/zh-CN/reference/api-usage-costs)
