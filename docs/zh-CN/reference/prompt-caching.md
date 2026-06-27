---
read_when:
    - 你想通过缓存保留来降低提示词 token 成本
    - 你需要在多 Agent 设置中使用按 Agent 配置的缓存行为
    - 你正在一起调优 Heartbeat 和 cache-ttl 清理
summary: 提示缓存调节项、合并顺序、提供商行为和调优模式
title: 提示缓存
x-i18n:
    generated_at: "2026-06-27T03:16:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示缓存意味着模型提供商可以跨轮次复用未变化的提示前缀（通常是系统/开发者指令和其他稳定上下文），而不是每次都重新处理它们。OpenClaw 会在上游 API 直接暴露这些计数器时，将提供商用量规范化为 `cacheRead` 和 `cacheWrite`。

当实时会话快照缺少缓存计数器时，状态界面也可以从最近的 transcript
用量日志中恢复缓存计数器，因此 `/status` 可以在部分会话元数据丢失后继续
显示缓存行。现有的非零实时缓存值仍优先于 transcript 回退值。

为什么这很重要：更低的 token 成本、更快的响应，以及长时间运行会话中更可预测的性能。如果没有缓存，即使大部分输入没有变化，重复提示也会在每一轮支付完整的提示成本。

下面的章节涵盖影响提示复用和 token 成本的每一个缓存相关开关。

提供商参考：

- Anthropic 提示缓存：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示缓存：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 标头和请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 和错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要开关

### `cacheRetention`（全局默认值、模型和按智能体）

为所有模型设置缓存保留作为全局默认值：

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

1. `agents.defaults.params`（全局默认值 — 应用于所有模型）
2. `agents.defaults.models["provider/model"].params`（按模型覆盖）
3. `agents.list[].params`（匹配的智能体 id；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口之后剪除旧的工具结果上下文，使空闲后的请求不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为见[会话剪枝](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以让缓存窗口保持温热，并减少空闲间隔后的重复缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

在 `agents.list[].heartbeat` 支持按智能体配置 heartbeat。

## 提供商行为

### Anthropic（直接 API）

- 支持 `cacheRetention`。
- 对于 Anthropic API-key 凭证配置文件，当未设置时，OpenClaw 会为 Anthropic 模型引用播种 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会同时暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 映射到默认的 5 分钟短暂缓存，且只有在直接 `api.anthropic.com` 主机上，`cacheRetention: "long"` 才会升级到 1 小时 TTL。

### OpenAI（直接 API）

- 在受支持的近期模型上，提示缓存是自动的。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来让跨轮次缓存路由保持稳定。直接 OpenAI 主机会在选择 `cacheRetention: "long"` 时使用 `prompt_cache_retention: "24h"`。
- OpenAI 兼容的 Completions 提供商仅在其模型配置显式设置 `compat.supportsPromptCacheKey: true` 时接收 `prompt_cache_key`。长保留转发是一项单独能力：显式 `cacheRetention: "long"` 仅在该 compat 条目也支持长缓存保留时发送 `prompt_cache_retention: "24h"`。Mistral 等提供商可以选择启用缓存键，同时设置 `compat.supportsLongCacheRetention: false` 来抑制长保留字段。`cacheRetention: "none"` 会抑制这两个字段。
- OpenAI 响应通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件上的 `input_tokens_details.cached_tokens`）暴露已缓存的提示 token。OpenClaw 将其映射到 `cacheRead`。
- OpenAI 不暴露单独的缓存写入 token 计数器，因此即使提供商正在预热缓存，在 OpenAI 路径上 `cacheWrite` 也保持为 `0`。
- OpenAI 返回有用的追踪和速率限制标头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中统计应来自用量载荷，而不是标头。
- 实践中，OpenAI 通常表现得更像初始前缀缓存，而不是 Anthropic 风格的移动式完整历史复用。在当前实时探测中，稳定的长前缀文本轮次可能接近 `4864` 个已缓存 token 的平台期，而工具密集或 MCP 风格的 transcript 即使在完全重复时，也通常在约 `4608` 个已缓存 token 附近达到平台期。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）支持 `cacheRetention`，方式与直接 Anthropic 相同。
- `cacheRetention: "long"` 映射到 Vertex AI 端点上真实的 1 小时提示缓存 TTL。
- `anthropic-vertex` 的默认缓存保留与直接 Anthropic 默认值一致。
- Vertex 请求通过边界感知的缓存塑形路由，因此缓存复用会与提供商实际收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式 `cacheRetention` 透传。
- 非 Anthropic Bedrock 模型在运行时会被强制为 `cacheRetention: "none"`。

### OpenRouter 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在系统/开发者提示块上注入 Anthropic
`cache_control`，以改善提示缓存复用，但仅当请求仍然指向已验证的 OpenRouter 路由
（默认端点上的 `openrouter`，或任何解析为 `openrouter.ai` 的提供商/base URL）时才这样做。

对于 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 和 `openrouter/zai/*`
模型引用，允许使用 `contextPruning.mode: "cache-ttl"`，因为 OpenRouter
会自动处理提供商侧提示缓存。OpenClaw 不会向这些请求中注入
Anthropic `cache_control` 标记。

DeepSeek 缓存构建是尽力而为的，并且可能需要几秒钟。一次
立即跟进仍可能显示 `cached_tokens: 0`；请在短暂延迟后用重复的
相同前缀请求验证，并使用 `usage.prompt_tokens_details.cached_tokens`
作为缓存命中信号。

如果你将模型重新指向任意 OpenAI 兼容代理 URL，OpenClaw
会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持此缓存模式，`cacheRetention` 不会产生效果。

### Google Gemini 直接 API

- 直接 Gemini 传输（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount`
  报告缓存命中；OpenClaw 将其映射到 `cacheRead`。
- 当在直接 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会在 Google AI Studio 运行中
  自动为系统提示创建、复用并刷新 `cachedContents` 资源。这意味着你不再需要手动
  预创建 cached-content 句柄。
- 你仍然可以通过配置模型上的 `params.cachedContent`（或旧版 `params.cached_content`）
  传入已有的 Gemini cached-content 句柄。
- 这与 Anthropic/OpenAI 提示前缀缓存不同。对于 Gemini，
  OpenClaw 管理提供商原生的 `cachedContents` 资源，而不是
  向请求中注入缓存标记。

### Gemini CLI 用量

- Gemini CLI `stream-json` 输出可以通过 `stats.cached` 暴露缓存命中；
  OpenClaw 将其映射到 `cacheRead`。旧版 `--output-format json` 覆盖使用
  相同的用量规范化。
- 如果 CLI 省略直接的 `stats.input` 值，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是用量规范化。它并不意味着 OpenClaw 正在为 Gemini CLI 创建
  Anthropic/OpenAI 风格的提示缓存标记。

## 系统提示缓存边界

OpenClaw 会将系统提示拆分为由内部缓存前缀边界分隔的**稳定前缀**和**易变
后缀**。边界之上的内容（工具定义、Skills 元数据、工作区文件和其他
相对静态的上下文）会被排序，以便跨轮次保持字节完全相同。
边界之下的内容（例如 `HEARTBEAT.md`、运行时时间戳和
其他按轮次变化的元数据）允许变化，而不会使已缓存的
前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件排在 `HEARTBEAT.md` 之前，因此
  heartbeat 抖动不会破坏稳定前缀。
- 该边界应用于 Anthropic 系列、OpenAI 系列、Google 和
  CLI 传输塑形，因此所有受支持的提供商都能受益于相同的前缀
  稳定性。
- Codex Responses 和 Anthropic Vertex 请求通过
  边界感知的缓存塑形路由，因此缓存复用会与提供商
  实际收到的内容保持一致。
- 系统提示指纹会被规范化（空白、换行符、钩子添加的上下文、
  运行时能力排序），因此语义未变化的提示会跨轮次共享 KV/缓存。

如果你在配置或工作区更改后看到意外的 `cacheWrite` 峰值，
请检查该更改落在缓存边界之上还是之下。将
易变内容移动到边界之下（或使其稳定）通常可以解决
该问题。

## OpenClaw 缓存稳定性防护

OpenClaw 还会在请求到达提供商之前，让若干缓存敏感的载荷形状保持确定性：

- Bundle MCP 工具目录在工具注册前会按确定性顺序排序，因此
  `listTools()` 顺序变化不会扰动工具块，也不会破坏提示缓存前缀。
- 带有持久化图片块的旧会话会保持**最近 3 个已完成轮次**
  完整；更早的已处理图片块可能会被替换为标记，因此图片密集的跟进
  不会持续重复发送大量陈旧载荷。

## 调优模式

### 混合流量（推荐默认值）

在你的主智能体上保持长生命周期基线，禁用突发型通知智能体的缓存：

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
- 仅对受益于温热缓存的智能体，让 heartbeat 低于你的 TTL。

## 缓存诊断

OpenClaw 为嵌入式智能体运行暴露专用缓存追踪诊断。

对于普通的面向用户诊断，当实时会话条目没有这些计数器时，`/status` 和其他用量摘要可以使用
最新的 transcript 用量条目作为 `cacheRead` /
`cacheWrite` 的回退来源。

## 实时回归测试

OpenClaw 为重复前缀、工具轮次、图片轮次、MCP 风格工具 transcript，以及 Anthropic 无缓存对照保留了一个组合式实时缓存回归门禁。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行窄范围实时门禁：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件存储最近一次观察到的实时数值，以及测试使用的提供商专用回归下限。
运行器还使用全新的按运行会话 ID 和提示命名空间，因此先前缓存状态不会污染当前回归样本。

这些测试有意不在不同提供商之间使用相同的成功标准。

### Anthropic 实时预期

- 预期通过 `cacheWrite` 进行显式预热写入。
- 预期在重复轮次中复用接近完整的历史，因为 Anthropic 缓存控制会在对话中推进缓存断点。
- 当前实时断言仍然对稳定、工具和图像路径使用较高命中率阈值。

### OpenAI 实时预期

- 仅预期 `cacheRead`。`cacheWrite` 保持为 `0`。
- 将重复轮次缓存复用视为提供商特定的平台期，而不是 Anthropic 风格的移动式完整历史复用。
- 当前实时断言使用从 `gpt-5.4-mini` 上观察到的实时行为派生出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具转录：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像转录：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格转录：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新组合实时验证结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具转录：`cacheRead=4608`，命中率 `0.896`
- 图像转录：`cacheRead=4864`，命中率 `0.954`
- MCP 风格转录：`cacheRead=4608`，命中率 `0.891`

组合门禁最近的本地实际耗时约为 `88s`。

断言不同的原因：

- Anthropic 会暴露显式缓存断点和移动式对话历史复用。
- OpenAI 提示缓存仍然对精确前缀敏感，但在实时 Responses 流量中，有效可复用前缀可能比完整提示更早进入平台期。
- 因此，用单一的跨提供商百分比阈值比较 Anthropic 和 OpenAI 会造成误报回归。

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

- `OPENCLAW_CACHE_TRACE=1` 启用缓存跟踪。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` 覆盖输出路径。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切换完整消息载荷捕获。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换提示文本捕获。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换系统提示捕获。

### 要检查的内容

- 缓存跟踪事件是 JSONL，并包含类似 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 的分阶段快照。
- 每轮缓存令牌影响可通过正常使用界面中的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和会话用量摘要）。
- 对于 Anthropic，启用缓存时预期同时出现 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，缓存命中时预期出现 `cacheRead`，且 `cacheWrite` 保持为 `0`；OpenAI 不发布单独的缓存写入令牌字段。
- 如果需要请求跟踪，请将请求 ID 和速率限制标头与缓存指标分开记录。OpenClaw 当前的缓存跟踪输出侧重于提示/会话形态和归一化令牌用量，而不是原始提供商响应标头。

## 快速故障排除

- 大多数轮次上 `cacheWrite` 很高：检查易变的系统提示输入，并验证模型/提供商是否支持你的缓存设置。
- Anthropic 上 `cacheWrite` 很高：通常意味着缓存断点落在了每个请求都会变化的内容上。
- OpenAI `cacheRead` 较低：验证稳定前缀位于开头、重复前缀至少为 1024 个令牌，并且应共享缓存的轮次复用了相同的 `prompt_cache_key`。
- `cacheRetention` 没有效果：确认模型键匹配 `agents.defaults.models["provider/model"]`。
- 带缓存设置的 Bedrock Nova/Mistral 请求：预期运行时强制设为 `none`。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [令牌使用和成本](/zh-CN/reference/token-use)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference)

## 相关

- [令牌使用和成本](/zh-CN/reference/token-use)
- [API 使用和成本](/zh-CN/reference/api-usage-costs)
