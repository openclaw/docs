---
read_when:
    - 你想通过缓存保留来降低提示词 token 成本
    - 你需要在多智能体设置中使用按智能体区分的缓存行为
    - 你正在同时调优 Heartbeat 和 cache-ttl 清理
summary: 提示缓存调节项、合并顺序、提供商行为和调优模式
title: 提示缓存
x-i18n:
    generated_at: "2026-07-01T18:07:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示缓存是指模型提供商可以跨轮次复用未变化的提示前缀（通常是 system/developer 指令和其他稳定上下文），而不是每次都重新处理。OpenClaw 会把提供商用量规范化为 `cacheRead` 和 `cacheWrite`，前提是上游 API 直接公开这些计数器。

当实时会话快照缺少缓存计数器时，状态界面也可以从最近的 transcript
用量日志中恢复这些计数器，因此 `/status` 可以在部分会话元数据丢失后继续
显示缓存行。现有的非零实时缓存值仍优先于 transcript 回退值。

这很重要的原因：更低的 token 成本、更快的响应，以及长时间运行会话中更可预测的性能。没有缓存时，即使大部分输入没有变化，重复提示也会在每个轮次支付完整的提示成本。

以下各节覆盖影响提示复用和 token 成本的所有缓存相关开关。

提供商参考：

- Anthropic 提示缓存：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示缓存：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 标头和请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 和错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要开关

### `cacheRetention`（全局默认值、模型和按 Agent 配置）

为所有模型设置缓存保留的全局默认值：

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

按 Agent 覆盖：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

配置合并顺序：

1. `agents.defaults.params`（全局默认值 — 适用于所有模型）
2. `agents.defaults.models["provider/model"].params`（按模型覆盖）
3. `agents.list[].params`（匹配的 Agent id；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口之后裁剪旧工具结果上下文，避免空闲后的请求重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为见 [Session Pruning](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以让缓存窗口保持温热，并减少空闲间隔后的重复缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

按 Agent 配置的 Heartbeat 支持 `agents.list[].heartbeat`。

## 提供商行为

### Anthropic（直连 API）

- 支持 `cacheRetention`。
- 使用 Anthropic API key 凭证配置时，如果未设置，OpenClaw 会为 Anthropic 模型引用注入 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会公开 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 映射到默认的 5 分钟临时缓存，而 `cacheRetention: "long"` 仅在直连 `api.anthropic.com` 主机时升级到 1 小时 TTL。

### OpenAI（直连 API）

- 受支持的近期模型会自动进行提示缓存。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 让跨轮次缓存路由保持稳定。选择 `cacheRetention: "long"` 时，直连 OpenAI 主机会使用 `prompt_cache_retention: "24h"`。
- OpenAI 兼容的 Completions 提供商只有在其模型配置显式设置 `compat.supportsPromptCacheKey: true` 时才会收到 `prompt_cache_key`。长保留转发是一项单独能力：显式设置 `cacheRetention: "long"` 时，只有该 compat 条目也支持长缓存保留，才会发送 `prompt_cache_retention: "24h"`。Mistral 等提供商可以启用缓存键，同时设置 `compat.supportsLongCacheRetention: false` 来抑制长保留字段。`cacheRetention: "none"` 会抑制这两个字段。
- OpenAI 响应通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件中的 `input_tokens_details.cached_tokens`）公开已缓存的提示 token。OpenClaw 会将其映射为 `cacheRead`。
- GPT-5.6 Responses 用量也可以公开 `input_tokens_details.cache_write_tokens`。OpenClaw 会将其映射为 `cacheWrite`，并按模型的缓存写入费率计价；省略该字段的 Responses 会让 `cacheWrite` 保持为 `0`。
- OpenAI 会返回有用的跟踪和速率限制标头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自用量 payload，而不是标头。
- 实际上，OpenAI 通常表现得更像初始前缀缓存，而不是 Anthropic 风格的移动式完整历史复用。在当前实时探测中，稳定的长前缀文本轮次可能接近 `4864` 个已缓存 token 的平台期，而工具密集或 MCP 风格的 transcript 即使精确重复，也常接近 `4608` 个已缓存 token 的平台期。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）支持与直连 Anthropic 相同的 `cacheRetention`。
- `cacheRetention: "long"` 会映射到 Vertex AI 端点上真实的 1 小时提示缓存 TTL。
- `anthropic-vertex` 的默认缓存保留与直连 Anthropic 默认值一致。
- Vertex 请求会通过边界感知的缓存整形进行路由，因此缓存复用会与提供商实际接收的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式透传 `cacheRetention`。
- 非 Anthropic Bedrock 模型在运行时会被强制设为 `cacheRetention: "none"`。

### OpenRouter 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在 system/developer
提示块上注入 Anthropic `cache_control`，以改进提示缓存复用；这只会在请求仍然
指向已验证的 OpenRouter 路由时发生（默认端点上的 `openrouter`，或任何解析到
`openrouter.ai` 的提供商/base URL）。

对于 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 和 `openrouter/zai/*`
模型引用，允许使用 `contextPruning.mode: "cache-ttl"`，因为 OpenRouter
会自动处理提供商侧提示缓存。OpenClaw 不会向这些请求注入 Anthropic
`cache_control` 标记。

DeepSeek 缓存构建是尽力而为的，可能需要几秒钟。立即跟进的请求仍可能显示
`cached_tokens: 0`；请在短暂延迟后用重复的相同前缀请求验证，并使用
`usage.prompt_tokens_details.cached_tokens` 作为缓存命中信号。

如果你把模型重新指向任意 OpenAI 兼容代理 URL，OpenClaw
会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持此缓存模式，`cacheRetention` 不会产生效果。

### Google Gemini 直连 API

- 直连 Gemini 传输（`api: "google-generative-ai"`）通过上游
  `cachedContentTokenCount` 报告缓存命中；OpenClaw 会将其映射为 `cacheRead`。
- 在直连 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会自动为 Google AI Studio
  运行中的 system prompts 创建、复用并刷新 `cachedContents` 资源。这意味着你不再需要手动预创建
  cached-content 句柄。
- 你仍然可以在已配置模型上通过 `params.cachedContent`（或旧版 `params.cached_content`）
  传入已有的 Gemini cached-content 句柄。
- 这与 Anthropic/OpenAI 的提示前缀缓存不同。对于 Gemini，
  OpenClaw 管理的是提供商原生的 `cachedContents` 资源，而不是
  向请求注入缓存标记。

### Gemini CLI 用量

- Gemini CLI `stream-json` 输出可以通过 `stats.cached` 暴露缓存命中；
  OpenClaw 会将其映射为 `cacheRead`。旧版 `--output-format json` 覆盖使用
  相同的用量规范化。
- 如果 CLI 省略直接的 `stats.input` 值，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是用量规范化，并不意味着 OpenClaw 正在为 Gemini CLI 创建
  Anthropic/OpenAI 风格的提示缓存标记。

## System prompt 缓存边界

OpenClaw 会将 system prompt 拆分为一个**稳定前缀**和一个**易变后缀**，
二者由内部缓存前缀边界分隔。边界以上的内容（工具定义、Skills 元数据、
工作区文件以及其他相对静态的上下文）会被排序，以便跨轮次保持字节级一致。
边界以下的内容（例如 `HEARTBEAT.md`、运行时戳以及其他按轮次变化的元数据）
允许变化，且不会使已缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，因此
  Heartbeat 抖动不会破坏稳定前缀。
- 该边界会应用于 Anthropic 系、OpenAI 系、Google 和
  CLI 传输整形，因此所有受支持的提供商都能受益于相同的前缀稳定性。
- Codex Responses 和 Anthropic Vertex 请求会通过
  边界感知的缓存整形进行路由，因此缓存复用会与提供商实际接收的内容保持一致。
- System prompt 指纹会被规范化（空白、换行符、
  hook 添加的上下文、运行时能力排序），因此语义未变化的提示可以跨轮次共享 KV/缓存。

如果你在配置或工作区变更后看到意外的 `cacheWrite` 峰值，
请检查该变更落在缓存边界之上还是之下。将易变内容移到边界以下
（或让它稳定）通常可以解决问题。

## OpenClaw 缓存稳定性保护

OpenClaw 还会在请求到达提供商之前，让几个缓存敏感的 payload 形状保持确定性：

- Bundle MCP 工具目录会在工具注册之前确定性排序，因此 `listTools()`
  顺序变化不会搅动工具块并破坏提示缓存前缀。
- 带有持久化图像块的旧版会话会保持**最近 3 个已完成轮次**完整；
  更旧的已处理图像块可能会替换为标记，因此图像密集的后续请求不会持续重新发送大型陈旧 payload。

## 调优模式

### 混合流量（推荐默认值）

在主 Agent 上保持长期基线，对突发通知类 Agent 禁用缓存：

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

- 将基线设为 `cacheRetention: "short"`。
- 启用 `contextPruning.mode: "cache-ttl"`。
- 只为受益于温热缓存的 Agent 将 Heartbeat 保持在你的 TTL 以下。

## 缓存诊断

OpenClaw 为嵌入式 Agent 运行公开专用的缓存跟踪诊断。

对于普通面向用户的诊断，当实时会话条目没有 `cacheRead` /
`cacheWrite` 计数器时，`/status` 和其他用量摘要可以使用最新的 transcript
用量条目作为回退来源。

## 实时回归测试

OpenClaw 为重复前缀、工具轮次、图像轮次、MCP 风格工具 transcript，以及 Anthropic 无缓存对照保留了一个合并的实时缓存回归门禁。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行窄范围实时门禁：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件存储最近一次观测到的实时数值，以及测试使用的特定提供商回归下限。
运行器还会为每次运行使用新的会话 ID 和提示词命名空间，因此之前的缓存状态不会污染当前的回归样本。

这些测试有意不对各提供商使用相同的成功标准。

### Anthropic 实时预期

- 预期通过 `cacheWrite` 进行显式预热写入。
- 预期在重复轮次中几乎复用完整历史，因为 Anthropic 缓存控制会随着对话推进缓存断点。
- 当前实时断言仍对稳定路径、工具路径和图像路径使用高命中率阈值。

### OpenAI 实时预期

- 仅预期 `cacheRead`。`cacheWrite` 保持为 `0`。
- 将重复轮次的缓存复用视为特定提供商的平台期，而不是 Anthropic 风格的移动式完整历史复用。
- 当前实时断言使用根据 `gpt-5.4-mini` 上观测到的实时行为得出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具转录：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像转录：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格转录：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新组合实时验证结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具转录：`cacheRead=4608`，命中率 `0.896`
- 图像转录：`cacheRead=4864`，命中率 `0.954`
- MCP 风格转录：`cacheRead=4608`，命中率 `0.891`

最近组合门禁的本地墙钟耗时约为 `88s`。

断言不同的原因：

- Anthropic 暴露显式缓存断点和移动式对话历史复用。
- OpenAI 提示词缓存仍然对精确前缀敏感，但在实时 Responses 流量中，有效可复用前缀可能早于完整提示词达到平台期。
- 因此，用单一跨提供商百分比阈值比较 Anthropic 和 OpenAI 会产生误报回归。

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
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切换完整消息载荷捕获。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换提示词文本捕获。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换系统提示词捕获。

### 检查内容

- 缓存追踪事件是 JSONL，并包含 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等分阶段快照。
- 每轮缓存 token 影响可通过 `cacheRead` 和 `cacheWrite` 在常规使用界面中查看（例如 `/usage tokens`、`/status`、会话用量摘要，以及自定义 `messages.usageTemplate` 布局）。
- 对于 Anthropic，缓存启用时预期同时出现 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，缓存命中时预期出现 `cacheRead`。GPT-5.6 Responses 在写入提示词片段时也可以报告 `cacheWrite`；其他省略写入计数器的 Responses 载荷会将其保持为 `0`。
- 如果你需要请求追踪，请将请求 ID 和速率限制标头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出侧重于提示词/会话形态和归一化 token 用量，而不是原始提供商响应标头。

## 快速故障排除

- 大多数轮次出现高 `cacheWrite`：检查是否存在易变的系统提示词输入，并确认模型/提供商支持你的缓存设置。
- Anthropic 上出现高 `cacheWrite`：通常意味着缓存断点落在了每次请求都会变化的内容上。
- OpenAI `cacheRead` 较低：确认稳定前缀位于开头、重复前缀至少有 1024 个 token，并且应共享缓存的轮次复用了相同的 `prompt_cache_key`。
- `cacheRetention` 无效果：确认模型键与 `agents.defaults.models["provider/model"]` 匹配。
- 带缓存设置的 Bedrock Nova/Mistral 请求：预期运行时会强制设为 `none`。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用量和费用](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)

## 相关内容

- [Token 使用量和费用](/zh-CN/reference/token-use)
- [API 使用量和费用](/zh-CN/reference/api-usage-costs)
