---
read_when:
    - 你希望在另一个应用程序中复用 OpenClaw 的模型传输层
    - 你正在更改 `packages/ai` 或 AI 传输主机端口
    - 你正在审查 OpenClaw 发布版本除根软件包之外还向 npm 发布了哪些内容
summary: '@openclaw/ai npm 包：可复用的模型传输、隔离运行时和宿主策略端口'
title: '@openclaw/ai 软件包'
x-i18n:
    generated_at: "2026-07-11T20:55:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` 是 OpenClaw 模型执行层的可发布库形态：提供商无关的消息、工具和流式传输契约，以及验证、诊断、事件流、隔离的运行时注册表，并为八个内置 API 系列提供延迟加载的适配器（Anthropic Messages、OpenAI Completions、OpenAI Responses、Azure OpenAI Responses、ChatGPT/Codex Responses、Google Generative AI、Google Vertex、Mistral Conversations）。

它在每次发布时与根 `openclaw` 包一同发布，并固定为相同版本；同时拥有自己的 `npm-shrinkwrap.json`，以便在安装时锁定其传递依赖树。安装 `openclaw` 会自动安装匹配的 `@openclaw/ai`；库使用者也可以直接依赖它，而无需任何 OpenClaw 应用代码。

## 快速开始

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

可运行的版本位于仓库中的 `examples/ai-chat`。

## 设计契约

- **默认限定于实例。** 导入该包不会进行任何全局注册。`createApiRegistry()` / `createLlmRuntime()` 返回相互隔离的实例；`registerBuiltInApiProviders(registry)` 可选择为某个注册表启用内置传输层。提供商 SDK 模块会在首次使用时延迟加载。
- **宿主策略通过注入提供，而非内置。** 请求 fetch 防护（例如 SSRF 策略）、工具结果重放文本中的敏感信息遮盖、OpenAI 严格工具默认设置以及诊断日志，都是通过 `configureAiTransportHost` 配置的 `AiTransportHost` 端口。该库的默认实现不执行任何操作；OpenClaw 会在其流式传输门面中安装实际实现。
- **统一的事件流标识。** `@openclaw/ai/event-stream` 是 OpenClaw 核心、agent-core 和外部使用者共享的规范 `EventStream` 构造函数。
- **`internal/*` 子路径不是 API。** 它们仅供 OpenClaw 应用本身使用，不提供任何语义化版本兼容性保证。
- 提供商 ID、凭据、模型目录、重试和故障转移仍由应用负责。OpenClaw 在此包外围提供这些能力；库使用者则直接提供 `Model` 对象和选项。

## 子路径导出

| 子路径           | 内容                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | 契约、`createApiRegistry`、`createLlmRuntime`、`configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`、`resetApiProviders`                             |
| `./types`        | 模型、消息、工具和流式传输类型                                                 |
| `./validation`   | 工具参数验证                                                                   |
| `./diagnostics`  | 诊断契约                                                                       |
| `./event-stream` | 共享的 `EventStream` 实现                                                      |
| `./internal/*`   | OpenClaw 内部使用，不提供语义化版本兼容性保证                                  |
