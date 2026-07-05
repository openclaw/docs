---
read_when:
    - 你想通过缓存保留来降低提示词 token 成本
    - 你需要多 Agent 设置中的按 Agent 缓存行为
    - 你正在同时调整 Heartbeat 和 cache-ttl 修剪
summary: 提示缓存调节项、合并顺序、提供商行为和调优模式
title: Prompt caching
x-i18n:
    generated_at: "2026-07-05T11:42:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示缓存让模型提供商能够在多个轮次中复用未变化的提示前缀（system/developer 指令、工具定义、其他稳定上下文），而不是在每次请求时都重新处理它。这会降低长时间运行会话中重复上下文的 token 成本和延迟。

只要上游 API 暴露相应计数器，OpenClaw 就会将提供商用量规范化为 `cacheRead` 和 `cacheWrite`。当实时会话快照缺少缓存计数器时，用量摘要（`/status` 及类似项）会回退到最后一条转录用量条目；非零的实时值始终优先于回退值。

提供商参考：

- [Anthropic 提示缓存](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI 提示缓存](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要旋钮

### `cacheRetention`

取值：`"none" | "short" | "long"`。可配置为全局默认值、按模型配置，以及按智能体配置。

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
3. `agents.list[].params` - 按智能体覆盖，通过智能体 id 匹配

来源：`src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口过期后修剪旧的工具结果上下文，这样空闲后的请求就不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为见 [会话修剪](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以保持缓存窗口温热，并减少空闲间隔后的重复缓存写入。可全局配置（`agents.defaults.heartbeat`）或按智能体配置（`agents.list[].heartbeat`）。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## 提供商行为

### Anthropic（直接 API 和 Vertex AI）

- `anthropic` 和 `anthropic-vertex` 提供商支持 `cacheRetention`；当显式设置 `cacheRetention` 时，`amazon-bedrock` 上的 Claude 模型以及自定义 `anthropic-messages` 兼容端点也支持它。
- 未设置时，OpenClaw 会为直接 Anthropic（仅 `anthropic` 和 `anthropic-vertex` 提供商；其他 Anthropic 系列路由需要显式值）种入 `cacheRetention: "short"`。
- 原生 Anthropic Messages 响应会暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，映射为 `cacheRead` 和 `cacheWrite`。
- `cacheRetention: "short"` 映射到默认的 5 分钟临时缓存。显式设置 `cacheRetention: "long"` 时，请求 1 小时 TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）。隐式/环境驱动的长保留（`OPENCLAW_CACHE_RETENTION=long` 且没有显式 `cacheRetention`）仅会在 `api.anthropic.com` 或 Vertex AI（`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`）主机上升级到 1 小时 TTL；其他主机保持 5 分钟缓存。

来源：`src/agents/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- 支持的近期模型会自动使用提示缓存；OpenClaw 不会注入块级缓存标记。
- OpenClaw 会发送 `prompt_cache_key`，以在多个轮次中保持缓存路由稳定。直接 `api.openai.com` 主机会自动获得此字段。OpenAI 兼容代理（oMLX、llama.cpp、自定义端点）需要在模型配置中设置 `compat.supportsPromptCacheKey: true` 才能选择启用，此项绝不会对代理自动检测。
- 只有在选择 `cacheRetention: "long"` 且解析后的端点同时支持缓存键和长保留（`compat.supportsLongCacheRetention`，默认 true；Together AI 和 Cloudflare 兼容配置会禁用它）时，才会添加 `prompt_cache_retention: "24h"`。`cacheRetention: "none"` 会抑制这两个字段。
- 缓存命中通过 `usage.prompt_tokens_details.cached_tokens`（Chat Completions）或 `input_tokens_details.cached_tokens`（Responses API）呈现，并映射为 `cacheRead`。
- Responses API 载荷也可能暴露 `input_tokens_details.cache_write_tokens`，映射为 `cacheWrite`，并按模型的缓存写入费率计价；省略该字段的 Responses 载荷会让 `cacheWrite` 保持为 `0`。OpenAI 的 Chat Completions API 未记录或发出 `cache_write_tokens` 计数器，但 OpenClaw 仍会在那里读取 `prompt_tokens_details.cache_write_tokens`，以支持报告独立写入计数的 OpenRouter 兼容和 DeepSeek 风格代理。
- 实际上，OpenAI 的行为更像初始前缀缓存，而不是 Anthropic 的移动式完整历史复用，见下方 [OpenAI 实时预期](#openai-live-expectations)。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`，以及 AWS 系统推理配置文件前缀 `us.`/`eu.`/`global.anthropic.claude*`）支持显式 `cacheRetention` 透传。
- 非 Anthropic Bedrock 模型（例如 `amazon.nova-*`）在运行时会解析为无缓存保留，无论配置了什么 `cacheRetention` 值。
- 不透明的 Bedrock 应用推理配置文件 ARN（不包含 `claude` 的配置文件 ID）也会解析为无缓存保留，除非显式设置 `cacheRetention`，因为无法仅从 ARN 推断模型系列。

### OpenRouter

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在 system/developer 提示块上注入 Anthropic `cache_control` 标记，但仅当请求仍然指向已验证的 OpenRouter 路由时（默认端点上的 `openrouter`，或任何解析为 `openrouter.ai` 的提供商/base URL）。将模型重新指向任意 OpenAI 兼容代理 URL 会停止这种注入。

`contextPruning.mode: "cache-ttl"` 允许用于 `openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*` 和 `openrouter/zai/*` 模型引用，因为这些路由会处理提供商侧提示缓存，不需要 OpenClaw 注入标记。

来源：`extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

OpenRouter 上的 DeepSeek 缓存构建是尽力而为的，可能需要几秒；立即发起的后续请求仍可能显示 `cached_tokens: 0`。请在短暂延迟后用重复的相同前缀请求验证，并使用 `usage.prompt_tokens_details.cached_tokens` 作为缓存命中信号。

### Google Gemini（直接 API）

- 直接 Gemini 传输（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount` 报告缓存命中，并映射为 `cacheRead`。
- 符合条件的模型系列：`gemini-2.5*` 和 `gemini-3*`（不包括该前缀匹配之外的 Live/preview 变体，例如 `gemini-live-2.5-flash-preview`）。
- 在符合条件的模型上设置 `cacheRetention` 时，OpenClaw 会自动为 system prompt 创建、复用并刷新 `cachedContents` 资源，无需手动 cached-content 句柄。`cacheRetention: "short"` 的 TTL 是 `300s`，`"long"` 的 TTL 是 `3600s`。
- 你仍然可以通过 `params.cachedContent`（或旧版 `params.cached_content`）传入已有的 Gemini cached-content 句柄；显式句柄会完全跳过自动缓存管理路径。
- 这与 Anthropic/OpenAI 的提示前缀缓存不同：OpenClaw 会为 Gemini 管理提供商原生的 `cachedContents` 资源，而不是注入内联缓存标记。

来源：`src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### CLI-harness 提供商（Claude Code、Gemini CLI）

发出 JSONL 用量事件的 CLI 后端（`jsonlDialect: "claude-stream-json"` 或 `"gemini-stream-json"`）会通过共享用量解析器，该解析器可识别多种字段名变体，包括映射为 `cacheRead` 的普通 `cached` 计数器。当 CLI 的 JSON 载荷省略直接输入 token 字段时，OpenClaw 会将其推导为 `input_tokens - cached`。这只是用量规范化，不会为这些 CLI 驱动模型创建 Anthropic/OpenAI 风格的提示缓存标记。

来源：`src/agents/cli-output.ts`（`toCliUsage`）。

### 其他提供商

如果某个提供商不支持上述任何缓存模式，`cacheRetention` 不会产生效果。

## system prompt 缓存边界

OpenClaw 会在内部缓存前缀边界处将 system prompt 拆分为**稳定前缀**和**易变后缀**。边界以上的内容（工具定义、Skills 元数据、工作区文件）会被排序，以在多个轮次中保持字节级一致。边界以下的内容（例如 `HEARTBEAT.md`、运行时时间戳、其他逐轮元数据）可以变化，而不会使已缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，这样 Heartbeat 变动不会破坏稳定前缀。
- 该边界适用于 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输整形，因此所有受支持的提供商都能受益于相同的前缀稳定性。
- Codex Responses 和 Anthropic Vertex 请求会通过边界感知的缓存整形路由，使缓存复用与提供商实际收到的内容保持一致。
- system prompt 指纹会被规范化（空白、行尾、钩子添加的上下文、运行时能力排序），因此语义未变化的提示可以跨轮次共享缓存。

如果你在配置或工作区变更后看到意外的 `cacheWrite` 峰值，请检查该变更落在缓存边界之上还是之下。将易变内容移到边界以下（或使其稳定）通常可以解决问题。

## OpenClaw 缓存稳定性保护

- 内置 MCP 工具目录会在工具注册前确定性排序（先按服务器名称，再按工具名称），因此 `listTools()` 顺序变化不会搅动工具块并破坏提示缓存前缀。
- 带有持久化图片块的旧版会话会保留**最近 3 个已完成轮次**的完整内容（统计所有已完成轮次，而不仅是包含图片的轮次）。更早且已处理过的图片块会替换为文本标记，因此图片密集型后续请求不会持续重新发送大型过期载荷。

## 调优模式

### 混合流量（推荐默认值）

在主智能体上保持长期基线，对突发型通知智能体禁用缓存：

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

- 设置基线 `cacheRetention: "short"`。
- 启用 `contextPruning.mode: "cache-ttl"`。
- 仅对受益于温热缓存的智能体，将 Heartbeat 保持在你的 TTL 以下。

## 实时回归测试

OpenClaw 运行一个组合式实时缓存回归门禁，覆盖重复前缀、工具轮次、图片轮次、MCP 风格工具转录，以及一个 Anthropic 无缓存对照。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

运行方式：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件会存储最近一次观测到的实时数字，以及测试用来检查的提供商特定回归下限。每次运行都会使用全新的逐运行会话 ID 和提示命名空间，因此之前的缓存状态不会污染当前样本。Anthropic 和 OpenAI 使用不同的执行方式：Anthropic 低于下限是硬性回归（测试失败），而 OpenAI 低于下限仅观察（记录为警告，不会使运行失败）。它们不共享单一的跨提供商阈值。

### Anthropic 实时预期

- 预期通过 `cacheWrite` 发生显式预热写入。
- 预期在重复轮次中复用接近完整的历史，因为 Anthropic 的缓存控制会在对话中推进缓存断点。
- 稳定、工具、图像和 MCP 风格通道的基线下限是硬性回归门禁。

### OpenAI 实时预期

- 仅预期 `cacheRead`；在 Chat Completions 上 `cacheWrite` 保持为 `0`。
- 将重复轮次的缓存复用视为提供商特定的平台期，而不是 Anthropic 风格的移动式完整历史复用。
- 下限仅用于观察（未命中会记录为警告，而不是测试失败），基于在 `gpt-5.4-mini` 上观察到的实时行为得出：

| 场景                 | `cacheRead` 下限 | 命中率下限 |
| -------------------- | ----------------: | -------------: |
| 稳定前缀             |             4,608 |           0.90 |
| 工具对话记录         |             4,096 |           0.85 |
| 图像对话记录         |             3,840 |           0.82 |
| MCP 风格对话记录     |             4,096 |           0.85 |

最近观察到的基线数字（来自 `live-cache-regression-baseline.ts`）为：稳定前缀 `cacheRead=4864`，命中率 `0.966`；工具对话记录 `cacheRead=4608`，命中率 `0.896`；图像对话记录 `cacheRead=4864`，命中率 `0.954`；MCP 风格对话记录 `cacheRead=4608`，命中率 `0.891`。

断言不同的原因：Anthropic 暴露显式缓存断点和移动式对话历史复用，而 OpenAI 在实时流量中的有效可复用前缀可能比完整提示更早进入平台期。用单一跨提供商百分比阈值比较两个提供商会产生误报回归。

## `diagnostics.cacheTrace` 配置

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

| 键                | 默认值                                       |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 环境变量开关（一次性调试）

| 变量                                 | 效果                                 |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | 启用缓存追踪                         |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 覆盖输出路径                         |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 切换完整消息载荷捕获                 |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | 切换提示文本捕获                     |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | 切换系统提示捕获                     |

### 要检查的内容

- 缓存追踪事件是 JSONL，包含 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等分阶段快照。
- 每轮缓存 token 影响可在常规使用界面中看到：`cacheRead` 和 `cacheWrite` 会出现在 `/usage tokens`、`/status`、会话用量摘要以及自定义 `messages.usageTemplate` 布局中。
- 对 Anthropic，缓存处于活动状态时预期同时看到 `cacheRead` 和 `cacheWrite`。
- 对 OpenAI，缓存命中时预期看到 `cacheRead`；`cacheWrite` 仅在包含它的 Responses API 载荷中填充（见上方 [OpenAI](#openai-direct-api)）。
- OpenAI 还会返回追踪和速率限制标头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`；可使用这些标头进行请求追踪，但缓存命中统计仍应来自用量载荷，而不是标头。

## 快速故障排除

- **大多数轮次都有较高 `cacheWrite`**：检查是否存在易变的系统提示输入；确认模型/提供商支持你的缓存设置。
- **Anthropic 上 `cacheWrite` 较高**：通常意味着缓存断点落在每次请求都会变化的内容上。
- **OpenAI `cacheRead` 较低**：确认稳定前缀位于开头，重复前缀至少有 1024 个 token，并且应共享缓存的轮次复用了同一个 `prompt_cache_key`。
- **`cacheRetention` 没有效果**：确认模型键匹配 `agents.defaults.models["provider/model"]`。
- **带缓存设置的 Bedrock Nova 请求**：符合预期，这些请求会在运行时解析为无缓存保留。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和成本](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 配置参考](/zh-CN/gateway/configuration-reference)

## 相关

- [Token 使用和成本](/zh-CN/reference/token-use)
- [API 使用和成本](/zh-CN/reference/api-usage-costs)
