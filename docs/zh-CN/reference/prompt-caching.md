---
read_when:
    - 你想通过缓存保留来降低提示词词元成本
    - 多 Agent 设置中需要按 Agent 配置的缓存行为
    - 你正在同时调优 Heartbeat 和 cache-ttl 清理
summary: 提示缓存旋钮、合并顺序、提供商行为和调优模式
title: 提示缓存
x-i18n:
    generated_at: "2026-07-01T07:51:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

提示词缓存意味着模型提供商可以跨轮次复用未变化的提示词前缀（通常是 system/developer 指令和其他稳定上下文），而不是每次都重新处理它们。在上游 API 直接暴露这些计数器时，OpenClaw 会把提供商用量规范化为 `cacheRead` 和 `cacheWrite`。

当实时会话快照缺少缓存计数器时，状态界面也可以从最近的 transcript
用量日志中恢复缓存计数器，因此 `/status` 可以在部分会话元数据丢失后继续
显示缓存行。已有的非零实时缓存值仍优先于 transcript 回退值。

这很重要：降低 token 成本、更快响应，并让长时间运行的会话拥有更可预测的性能。没有缓存时，即使大部分输入没有变化，重复提示词也会在每一轮支付完整的提示词成本。

以下章节涵盖所有影响提示词复用和 token 成本的缓存相关调节项。

提供商参考：

- Anthropic 提示词缓存：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 提示词缓存：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 标头和请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 和错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要调节项

### `cacheRetention`（全局默认值、模型和按 Agent 配置）

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

按 Agent 覆盖：

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
3. `agents.list[].params`（匹配 Agent ID；按键覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口后修剪旧工具结果上下文，使空闲后的请求不会重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为请参阅 [Session Pruning](/zh-CN/concepts/session-pruning)。

### Heartbeat 保温

Heartbeat 可以让缓存窗口保持温热，并减少空闲间隔后的重复缓存写入。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

按 Agent 配置的 heartbeat 支持在 `agents.list[].heartbeat` 中设置。

## 提供商行为

### Anthropic（直连 API）

- 支持 `cacheRetention`。
- 使用 Anthropic API 密钥凭证配置时，如果未设置，OpenClaw 会为 Anthropic 模型引用播种 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应会同时暴露 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 映射到默认的 5 分钟临时缓存，而 `cacheRetention: "long"` 仅在直连 `api.anthropic.com` 主机上升级为 1 小时 TTL。

### OpenAI（直连 API）

- 支持的近期模型会自动进行提示词缓存。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 来让跨轮次缓存路由保持稳定。选择 `cacheRetention: "long"` 时，直连 OpenAI 主机会使用 `prompt_cache_retention: "24h"`。
- OpenAI 兼容的 Completions 提供商只有在其模型配置显式设置 `compat.supportsPromptCacheKey: true` 时才会收到 `prompt_cache_key`。长保留转发是一项独立能力：只有当该兼容条目也支持长缓存保留时，显式的 `cacheRetention: "long"` 才会发送 `prompt_cache_retention: "24h"`。Mistral 等提供商可以选择加入缓存键，同时设置 `compat.supportsLongCacheRetention: false` 来抑制长保留字段。`cacheRetention: "none"` 会抑制两个字段。
- OpenAI 响应通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件上的 `input_tokens_details.cached_tokens`）暴露已缓存的提示词 token。OpenClaw 会将其映射到 `cacheRead`。
- GPT-5.6 Responses 用量也可以暴露 `input_tokens_details.cache_write_tokens`。OpenClaw 会将其映射到 `cacheWrite`，并按模型的缓存写入费率计价；省略该字段的 Responses 会保持 `cacheWrite` 为 `0`。
- OpenAI 会返回有用的追踪和速率限制标头，例如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中核算应来自用量载荷，而不是标头。
- 实践中，OpenAI 的行为通常更像初始前缀缓存，而不是 Anthropic 风格的移动式全历史复用。在当前实时探测中，稳定的长前缀文本轮次可能落在接近 `4864` 的已缓存 token 平台，而工具密集或 MCP 风格 transcript 即使完全重复，也常在接近 `4608` 已缓存 token 处进入平台。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）以与直连 Anthropic 相同的方式支持 `cacheRetention`。
- `cacheRetention: "long"` 映射到 Vertex AI 端点上的真实 1 小时提示词缓存 TTL。
- `anthropic-vertex` 的默认缓存保留与直连 Anthropic 默认值一致。
- Vertex 请求会通过边界感知缓存整形进行路由，使缓存复用与提供商实际收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式 `cacheRetention` 透传。
- 非 Anthropic Bedrock 模型会在运行时被强制为 `cacheRetention: "none"`。

### OpenRouter 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在 system/developer
提示词块上注入 Anthropic `cache_control`，以改进提示词缓存
复用，但前提是请求仍然指向经过验证的 OpenRouter 路由
（默认端点上的 `openrouter`，或任何解析到 `openrouter.ai` 的提供商/base URL）。

对于 `openrouter/deepseek/*`、`openrouter/moonshot*/*` 和 `openrouter/zai/*`
模型引用，允许使用 `contextPruning.mode: "cache-ttl"`，因为 OpenRouter
会自动处理提供商侧提示词缓存。OpenClaw 不会向这些请求注入
Anthropic `cache_control` 标记。

DeepSeek 缓存构建是尽力而为的，可能需要几秒钟。紧随其后的
后续请求仍可能显示 `cached_tokens: 0`；请在短暂延迟后通过重复
同前缀请求进行验证，并使用 `usage.prompt_tokens_details.cached_tokens`
作为缓存命中信号。

如果你将模型重新指向任意 OpenAI 兼容代理 URL，OpenClaw
会停止注入这些 OpenRouter 专用的 Anthropic 缓存标记。

### 其他提供商

如果提供商不支持此缓存模式，`cacheRetention` 不会产生效果。

### Google Gemini 直连 API

- 直连 Gemini 传输（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount`
  报告缓存命中；OpenClaw 会将其映射到 `cacheRead`。
- 在直连 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会自动
  为 Google AI Studio 运行中的 system prompts 创建、复用并刷新 `cachedContents`
  资源。这意味着你不再需要手动预先创建
  cached-content 句柄。
- 你仍然可以通过已配置模型上的
  `params.cachedContent`（或旧版 `params.cached_content`）传入预先存在的 Gemini cached-content 句柄。
- 这与 Anthropic/OpenAI 提示词前缀缓存不同。对于 Gemini，
  OpenClaw 管理的是提供商原生的 `cachedContents` 资源，而不是
  向请求中注入缓存标记。

### Gemini CLI 用量

- Gemini CLI `stream-json` 输出可以通过 `stats.cached` 暴露缓存命中；
  OpenClaw 会将其映射到 `cacheRead`。旧版 `--output-format json` 覆盖使用
  相同的用量规范化。
- 如果 CLI 省略直接的 `stats.input` 值，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。
- 这只是用量规范化。它不表示 OpenClaw 正在为 Gemini CLI 创建
  Anthropic/OpenAI 风格的提示词缓存标记。

## System-prompt 缓存边界

OpenClaw 将 system prompt 拆分为一个**稳定前缀**和一个**易变
后缀**，二者由内部缓存前缀边界分隔。边界以上的内容
（工具定义、Skills 元数据、工作区文件以及其他
相对静态的上下文）会被排序，以便跨轮次保持字节完全一致。
边界以下的内容（例如 `HEARTBEAT.md`、运行时时间戳和
其他按轮次变化的元数据）允许变化，而不会使已缓存
前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件会排在 `HEARTBEAT.md` 之前，因此
  heartbeat 抖动不会破坏稳定前缀。
- 该边界会应用于 Anthropic 系列、OpenAI 系列、Google 和
  CLI 传输整形，因此所有支持的提供商都能受益于相同的前缀
  稳定性。
- Codex Responses 和 Anthropic Vertex 请求会通过
  边界感知缓存整形进行路由，使缓存复用与提供商
  实际收到的内容保持一致。
- System-prompt 指纹会被规范化（空白、换行符、
  钩子添加的上下文、运行时能力排序），因此语义未变化的
  提示词可以跨轮次共享 KV/缓存。

如果你在配置或工作区变更后看到意外的 `cacheWrite` 峰值，
请检查该变更落在缓存边界之上还是之下。将
易变内容移动到边界之下（或使其稳定）通常可以解决
该问题。

## OpenClaw 缓存稳定性保护

OpenClaw 还会在请求到达提供商之前，让多个对缓存敏感的载荷形状保持确定性：

- Bundle MCP 工具目录会在工具
  注册前确定性排序，因此 `listTools()` 顺序变化不会扰动工具块并
  破坏提示词缓存前缀。
- 带有持久化图片块的旧版会话会保持**最近 3 个
  已完成轮次**完整；较旧且已处理的图片块可能会被
  替换为标记，因此图片密集的后续请求不会持续重新发送大型
  陈旧载荷。

## 调优模式

### 混合流量（推荐默认值）

在你的主 Agent 上保持长生命周期基线，在突发型通知 Agent 上禁用缓存：

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
- 仅对受益于温热缓存的 Agent，将 heartbeat 保持在你的 TTL 以下。

## 缓存诊断

OpenClaw 为嵌入式 Agent 运行暴露专用的缓存追踪诊断。

对于普通面向用户的诊断，当实时会话条目没有这些计数器时，
`/status` 和其他用量摘要可以使用最新 transcript 用量条目作为
`cacheRead` / `cacheWrite` 的回退来源。

## 实时回归测试

OpenClaw 为重复前缀、工具轮次、图片轮次、MCP 风格工具 transcript 和 Anthropic 无缓存对照保留一个组合式实时缓存回归门禁。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行窄范围实时门禁：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件存储最近观测到的实时数值，以及测试使用的提供商专用回归下限。
运行器还会为每次运行使用新的会话 ID 和 prompt 命名空间，避免之前的缓存状态污染当前回归样本。

这些测试有意不在不同提供商之间使用相同的成功标准。

### Anthropic 实时预期

- 预期通过 `cacheWrite` 显式进行预热写入。
- 预期重复轮次几乎可以复用完整历史，因为 Anthropic 缓存控制会在对话中推进缓存断点。
- 当前实时断言仍对稳定路径、工具路径和图片路径使用较高的命中率阈值。

### OpenAI 实时预期

- 只预期 `cacheRead`。`cacheWrite` 保持为 `0`。
- 将重复轮次的缓存复用视为提供商特定的平台期，而不是 Anthropic 风格的移动式完整历史复用。
- 当前实时断言使用基于 `gpt-5.4-mini` 观测实时行为得出的保守下限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图片 transcript：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格 transcript：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的最新组合实时验证结果为：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具 transcript：`cacheRead=4608`，命中率 `0.896`
- 图片 transcript：`cacheRead=4864`，命中率 `0.954`
- MCP 风格 transcript：`cacheRead=4608`，命中率 `0.891`

组合 gate 最近的本地实际耗时约为 `88s`。

断言存在差异的原因：

- Anthropic 暴露显式缓存断点和移动式对话历史复用。
- OpenAI prompt 缓存仍然对精确前缀敏感，但实时 Responses 流量中的有效可复用前缀可能比完整 prompt 更早进入平台期。
- 因此，用单一的跨提供商百分比阈值比较 Anthropic 和 OpenAI 会产生误报回归。

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
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` 切换完整消息 payload 捕获。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` 切换 prompt 文本捕获。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` 切换系统 prompt 捕获。

### 检查内容

- 缓存追踪事件是 JSONL，并包含 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after` 等阶段性快照。
- 每轮缓存 token 影响可通过普通使用界面中的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和会话用量摘要）。
- 对于 Anthropic，缓存处于活动状态时预期同时出现 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，缓存命中时预期出现 `cacheRead`。GPT-5.6 Responses 在写入 prompt 片段时也可能报告 `cacheWrite`；其他省略写入计数器的 Responses payload 会将其保持为 `0`。
- 如果你需要请求追踪，请将请求 ID 和速率限制标头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出聚焦于 prompt/会话形状和规范化 token 用量，而不是原始提供商响应标头。

## 快速故障排除

- 大多数轮次都有较高的 `cacheWrite`：检查易变的系统 prompt 输入，并确认模型/提供商支持你的缓存设置。
- Anthropic 上 `cacheWrite` 较高：通常意味着缓存断点落在每次请求都会变化的内容上。
- OpenAI `cacheRead` 较低：确认稳定前缀位于开头、重复前缀至少有 1024 个 token，并且应共享缓存的轮次复用了相同的 `prompt_cache_key`。
- `cacheRetention` 无效：确认模型键匹配 `agents.defaults.models["provider/model"]`。
- 带有缓存设置的 Bedrock Nova/Mistral 请求：预期运行时强制为 `none`。

相关文档：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token use and costs](/zh-CN/reference/token-use)
- [Session pruning](/zh-CN/concepts/session-pruning)
- [Gateway configuration reference](/zh-CN/gateway/configuration-reference)

## 相关

- [Token use and costs](/zh-CN/reference/token-use)
- [API usage and costs](/zh-CN/reference/api-usage-costs)
