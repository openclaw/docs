---
read_when:
    - 你希望通过缓存保留降低提示词 token 成本
    - 你需要在多 Agent 设置中实现按 Agent 划分的缓存行为
    - 你正在同时调整 Heartbeat 和缓存 TTL 清理策略
summary: 提示词缓存调节项、合并顺序、提供商行为和调优模式
title: 提示词缓存
x-i18n:
    generated_at: "2026-07-11T20:56:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示缓存允许模型提供商跨多个轮次复用未更改的提示前缀（系统/开发者指令、工具定义及其他稳定上下文），而不必在每次请求时重新处理。这可以降低长期运行且上下文重复的会话中的 token 成本和延迟。

只要上游 API 提供相应计数器，OpenClaw 就会将提供商用量统一为 `cacheRead` 和 `cacheWrite`。当实时会话快照缺少缓存计数器时，用量摘要（`/status` 及类似功能）会回退到最后一条转录用量记录；非零的实时值始终优先于回退值。

提供商参考资料：

- [Anthropic 提示缓存](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI 提示缓存](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要调节项

### `cacheRetention`

可选值：`"none" | "short" | "long"`。可配置为全局默认值，也可按模型和按智能体配置。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overrides the global default for this model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overrides both defaults for this agent
```

合并顺序（后者优先）：

1. `agents.defaults.params` - 所有模型的全局默认值
2. `agents.defaults.models["provider/model"].params` - 按模型覆盖
3. `agents.list[].params` - 按智能体覆盖，通过智能体 ID 匹配

来源：`src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

缓存 TTL 窗口到期后剪除旧的工具结果上下文，使空闲后的请求不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为请参阅[会话剪枝](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以使缓存窗口保持活跃，并减少空闲间隔后的重复缓存写入。可全局配置（`agents.defaults.heartbeat`），也可按智能体配置（`agents.list[].heartbeat`）。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## 提供商行为

### Anthropic（直接 API 和 Vertex AI）

- `anthropic` 和 `anthropic-vertex` 提供商支持 `cacheRetention`；当显式设置 `cacheRetention` 时，`amazon-bedrock` 上的 Claude 模型以及与自定义 `anthropic-messages` 兼容的端点也支持它。
- 未设置时，OpenClaw 会为直接 Anthropic 设置初始值 `cacheRetention: "short"`（仅限 `anthropic` 和 `anthropic-vertex` 提供商；其他 Anthropic 系列路由需要显式指定值）。
- 原生 Anthropic Messages 响应会公开 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，分别映射到 `cacheRead` 和 `cacheWrite`。
- `cacheRetention: "short"` 映射到默认的 5 分钟临时缓存。显式设置 `cacheRetention: "long"` 时，请求 1 小时 TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）。隐式或由环境驱动的长期保留（`OPENCLAW_CACHE_RETENTION=long` 且未显式设置 `cacheRetention`）仅在 `api.anthropic.com` 或 Vertex AI（`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`）主机上升级为 1 小时 TTL；其他主机仍使用 5 分钟缓存。

来源：`src/agents/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- 在受支持的较新模型上，提示缓存会自动启用；OpenClaw 不会注入块级缓存标记。
- OpenClaw 发送 `prompt_cache_key`，使多个轮次之间的缓存路由保持稳定。直接使用 `api.openai.com` 的主机会自动获得此字段。与 OpenAI 兼容的代理（oMLX、llama.cpp、自定义端点）需要在模型配置中设置 `compat.supportsPromptCacheKey: true` 才能启用；OpenClaw 永远不会为代理自动检测此能力。
- 只有选择 `cacheRetention: "long"`，且解析后的端点同时支持缓存键和长期保留时，才会添加 `prompt_cache_retention: "24h"`（`compat.supportsLongCacheRetention`，默认为 true；Together AI 和 Cloudflare 兼容性配置会禁用它）。`cacheRetention: "none"` 会阻止发送这两个字段。
- 缓存命中通过 `usage.prompt_tokens_details.cached_tokens`（Chat Completions）或 `input_tokens_details.cached_tokens`（Responses API）公开，并映射到 `cacheRead`。
- Responses API 载荷还可能公开 `input_tokens_details.cache_write_tokens`，该字段会映射到 `cacheWrite`，并按模型的缓存写入费率计价；省略该字段的 Responses 载荷会使 `cacheWrite` 保持为 `0`。OpenAI 的 Chat Completions API 未记录也不会发出 `cache_write_tokens` 计数器，但 OpenClaw 仍会从中读取 `prompt_tokens_details.cache_write_tokens`，以支持报告独立写入计数的 OpenRouter 兼容代理和 DeepSeek 风格代理。
- 实际上，与 Anthropic 的移动式完整历史复用相比，OpenAI 的行为更接近初始前缀缓存——请参阅下方的 [OpenAI 实时预期](#openai-live-expectations)。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`，以及 AWS 系统推理配置文件前缀 `us.`/`eu.`/`global.anthropic.claude*`）支持显式透传 `cacheRetention`。
- 非 Anthropic Bedrock 模型（例如 `amazon.nova-*`）在运行时不会解析出缓存保留设置，无论配置了何种 `cacheRetention` 值。
- 不透明的 Bedrock 应用推理配置文件 ARN（配置文件 ID 不含 `claude`）也不会解析出缓存保留设置，除非显式设置 `cacheRetention`，因为无法仅从 ARN 推断模型系列。

### OpenRouter

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在系统/开发者提示块中注入 Anthropic `cache_control` 标记，但前提是请求仍指向经过验证的 OpenRouter 路由（使用默认端点的 `openrouter`，或任何解析到 `openrouter.ai` 的提供商/基础 URL）。将模型重新指向任意 OpenAI 兼容代理 URL 后，将停止注入这些标记。

`openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*` 和 `openrouter/zai/*` 模型引用允许使用 `contextPruning.mode: "cache-ttl"`，因为这些路由可以处理提供商侧提示缓存，无需 OpenClaw 注入标记。

来源：`extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

OpenRouter 上的 DeepSeek 缓存构建采用尽力而为的方式，可能需要几秒；立即发起的后续请求仍可能显示 `cached_tokens: 0`。短暂等待后，使用相同前缀重复请求进行验证，并将 `usage.prompt_tokens_details.cached_tokens` 作为缓存命中信号。

### Google Gemini（直接 API）

- 直接 Gemini 传输（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount` 报告缓存命中，并映射到 `cacheRead`。
- 符合条件的模型系列：`gemini-2.5*` 和 `gemini-3*`（不包括未匹配这些前缀的 Live/预览变体，例如 `gemini-live-2.5-flash-preview`）。
- 在符合条件的模型上设置 `cacheRetention` 后，OpenClaw 会自动为系统提示创建、复用和刷新 `cachedContents` 资源，无需手动提供缓存内容句柄。`cacheRetention: "short"` 的 TTL 为 `300s`，`"long"` 的 TTL 为 `3600s`。
- 你仍可通过 `params.cachedContent`（或旧版 `params.cached_content`）传入已有的 Gemini 缓存内容句柄；显式提供句柄会完全跳过自动缓存管理路径。
- 这与 Anthropic/OpenAI 的提示前缀缓存不同：OpenClaw 为 Gemini 管理提供商原生的 `cachedContents` 资源，而不是注入内联缓存标记。

来源：`src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### CLI harness 提供商（Claude Code、Gemini CLI）

发出 JSONL 用量事件（`jsonlDialect: "claude-stream-json"` 或 `"gemini-stream-json"`）的 CLI 后端会经过共享用量解析器，该解析器可识别多种字段名称变体，包括映射到 `cacheRead` 的普通 `cached` 计数器。当 CLI 的 JSON 载荷省略直接输入 token 字段时，OpenClaw 会将其推导为 `input_tokens - cached`。这仅用于统一用量数据，不会为这些由 CLI 驱动的模型创建 Anthropic/OpenAI 风格的提示缓存标记。

来源：`src/agents/cli-output.ts`（`toCliUsage`）。

### 其他提供商

如果提供商不支持上述任何缓存模式，`cacheRetention` 不会产生任何效果。

## 系统提示缓存边界

OpenClaw 在内部缓存前缀边界处将系统提示拆分为**稳定前缀**和**易变后缀**。边界上方的内容（工具定义、Skills 元数据、工作区文件）会按固定顺序排列，以便在多个轮次之间保持字节完全一致。边界下方的内容（例如 `HEARTBEAT.md`、运行时时间戳和其他按轮次变化的元数据）可以发生变化，而不会使已缓存的前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件排列在 `HEARTBEAT.md` 之前，因此 Heartbeat 变化不会破坏稳定前缀。
- 该边界适用于 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输的载荷整形，因此所有受支持的提供商都能受益于相同的前缀稳定性。
- Codex Responses 和 Anthropic Vertex 请求会经过感知边界的缓存整形，使缓存复用与提供商实际收到的内容保持一致。
- 系统提示指纹会进行规范化处理（空白、换行符、钩子添加的上下文、运行时能力顺序），因此语义未发生变化的提示可以跨轮次共享缓存。

如果在配置或工作区变更后看到意外的 `cacheWrite` 峰值，请检查变更位于缓存边界上方还是下方。将易变内容移至边界下方（或使其稳定）通常可以解决问题。

## OpenClaw 缓存稳定性保护措施

- 内置 MCP 工具目录会在注册工具前进行确定性排序（先按服务器名称，再按工具名称），因此 `listTools()` 顺序变化不会导致工具块发生变化并破坏提示缓存前缀。
- 包含持久化图像块的旧版会话会完整保留**最近 3 个已完成轮次**（统计所有已完成轮次，而不仅是包含图像的轮次）。更早且已处理的图像块会替换为文本标记，因此包含大量图像的后续请求不会持续重新发送庞大的陈旧载荷。

## 调优模式

### 混合流量（推荐的默认设置）

在主要智能体上保持长期基线，并为突发式通知智能体禁用缓存：

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
- 仅对能从热缓存中获益的智能体，将 Heartbeat 间隔保持在 TTL 以内。

## 实时回归测试

OpenClaw 运行一个综合实时缓存回归门禁，涵盖重复前缀、工具轮次、图像轮次、MCP 风格工具转录，以及一个 Anthropic 无缓存对照组。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

运行命令：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件保存最近观测到的实时数值，以及测试所检查的提供商专用回归下限。每次运行都使用全新的单次运行会话 ID 和提示命名空间，因此以前的缓存状态不会污染当前样本。Anthropic 和 OpenAI 采用不同的强制策略：Anthropic 未达到下限会被视为硬性回归（测试失败），而 OpenAI 未达到下限仅用于观察（记录为警告，但不会导致运行失败）。它们不共享统一的跨提供商阈值。

### Anthropic 实时预期

- 预期通过 `cacheWrite` 进行显式预热写入。
- 预期在重复轮次中复用近乎完整的历史记录，因为 Anthropic 的缓存控制会在整个对话过程中推进缓存断点。
- 稳定、工具、图像和 MCP 风格通道的基准下限是严格的回归门槛。

### OpenAI 实时预期

- 仅预期出现 `cacheRead`；在 Chat Completions 中，`cacheWrite` 保持为 `0`。
- 将重复轮次的缓存复用视为提供商特有的平台期，而不是 Anthropic 式移动的完整历史记录复用。
- 下限仅用于监控（未达到时记录警告，而不会导致测试失败），根据 `gpt-5.4-mini` 上观测到的实时行为得出：

| 场景                 | `cacheRead` 下限 | 命中率下限 |
| -------------------- | ----------------: | ---------: |
| 稳定前缀             |             4,608 |       0.90 |
| 工具转录记录         |             4,096 |       0.85 |
| 图像转录记录         |             3,840 |       0.82 |
| MCP 风格转录记录     |             4,096 |       0.85 |

最近观测到的基准数值（来自 `live-cache-regression-baseline.ts`）为：稳定前缀 `cacheRead=4864`，命中率 `0.966`；工具转录记录 `cacheRead=4608`，命中率 `0.896`；图像转录记录 `cacheRead=4864`，命中率 `0.954`；MCP 风格转录记录 `cacheRead=4608`，命中率 `0.891`。

断言不同的原因：Anthropic 会公开显式缓存断点和移动式对话历史复用，而在实时流量中，OpenAI 的实际可复用前缀可能会在完整提示词之前进入平台期。使用单一的跨提供商百分比阈值比较这两个提供商，会产生错误的回归判断。

## `diagnostics.cacheTrace` 配置

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 可选
    includeMessages: false # 默认为 true
    includePrompt: false # 默认为 true
    includeSystem: false # 默认为 true
```

默认值：

| 键                | 默认值                                       |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 环境变量开关（一次性调试）

| 变量                                 | 效果                       |
| ------------------------------------ | -------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | 启用缓存跟踪               |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 覆盖输出路径               |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 切换完整消息负载捕获       |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | 切换提示词文本捕获         |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | 切换系统提示词捕获         |

### 检查内容

- 缓存跟踪事件采用 JSONL 格式，其中包含 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等分阶段快照。
- 每轮缓存令牌的影响可在常规用量界面中查看：`cacheRead` 和 `cacheWrite` 会显示在 `/usage tokens`、`/status`、会话用量摘要和自定义 `messages.usageTemplate` 布局中。
- 对于 Anthropic，启用缓存时应同时出现 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，缓存命中时应出现 `cacheRead`；仅当 Responses API 负载中包含 `cacheWrite` 时才会填充该字段（请参阅上方的 [OpenAI](#openai-direct-api)）。
- OpenAI 还会返回 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*` 等跟踪及速率限制标头；可使用这些标头跟踪请求，但缓存命中统计仍应取自用量负载，而不是标头。

## 快速故障排查

- **大多数轮次的 `cacheWrite` 较高**：检查系统提示词中是否包含易变输入；确认模型/提供商支持你的缓存设置。
- **Anthropic 上的 `cacheWrite` 较高**：通常意味着缓存断点落在了每次请求都会变化的内容上。
- **OpenAI 的 `cacheRead` 较低**：确认稳定前缀位于最前端、重复前缀至少包含 1024 个令牌，并且应共享缓存的轮次复用了相同的 `prompt_cache_key`。
- **`cacheRetention` 未产生效果**：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- **带有缓存设置的 Bedrock Nova 请求**：这是预期行为——这些请求在运行时会解析为不保留缓存。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [令牌用量和成本](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)

## 相关内容

- [令牌用量和成本](/zh-CN/reference/token-use)
- [API 用量和成本](/zh-CN/reference/api-usage-costs)
