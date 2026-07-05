---
read_when:
    - 你想在另一个应用程序中复用 OpenClaw 的模型传输机制
    - 你正在更改 packages/ai 或 AI 传输主机端口
    - 你正在审核 OpenClaw 版本除了根包之外还会发布哪些内容到 npm
summary: '@openclaw/ai npm 包：可复用的模型传输、隔离运行时和主机策略端口'
title: '@openclaw/ai 包'
x-i18n:
    generated_at: "2026-07-05T11:40:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` 是 OpenClaw 模型执行层的可发布库形态：提供商中立的消息/工具/流式传输契约、验证、诊断、事件流、隔离的运行时注册表，以及面向八个内置 API 系列的懒加载适配器（Anthropic Messages、OpenAI Completions、OpenAI Responses、Azure OpenAI Responses、ChatGPT/Codex Responses、Google Generative AI、Google Vertex、Mistral Conversations）。

它会在每次发布时随根 `openclaw` 包一起发布，固定为相同版本，并带有自己的 `npm-shrinkwrap.json`，因此其传递依赖树会在安装时锁定。安装 `openclaw` 会自动安装匹配的 `@openclaw/ai`；库消费者可以直接依赖它，而无需任何 OpenClaw 应用代码。

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

可运行版本位于仓库中的 `examples/ai-chat`。

## 设计契约

- **默认按实例限定作用域。** 导入该包不会在全局注册任何内容。`createApiRegistry()` / `createLlmRuntime()` 返回隔离实例；`registerBuiltInApiProviders(registry)` 会将一个注册表选择加入内置传输协议。提供商 SDK 模块会在首次使用时懒加载。
- **宿主策略是注入的，不是内置绑定的。** 请求 fetch 防护（例如 SSRF 策略）、工具结果重放文本的密钥脱敏、OpenAI 严格工具默认值，以及诊断日志，都是通过 `configureAiTransportHost` 配置的 `AiTransportHost` 端口。库默认值是惰性的；OpenClaw 会在它的流式传输门面中安装真实实现。
- **一个事件流身份。** `@openclaw/ai/event-stream` 是 OpenClaw 核心、agent-core 和外部消费者共享的规范 `EventStream` 构造函数。
- **`internal/*` 子路径不是 API。** 它们仅供 OpenClaw 应用自身使用，不提供任何 semver 保证。
- 提供商 ID、凭证、模型目录、重试和故障转移仍然是应用关注点。OpenClaw 会围绕此包叠加这些能力；库消费者则直接提供 `Model` 对象和选项。

## 子路径导出

| 子路径          | 内容                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | 契约、`createApiRegistry`、`createLlmRuntime`、`configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`、`resetApiProviders`                             |
| `./types`        | 模型/消息/工具/流式传输类型                                                |
| `./validation`   | 工具参数验证                                                       |
| `./diagnostics`  | 诊断契约                                                          |
| `./event-stream` | 共享的 `EventStream` 实现                                            |
| `./internal/*`   | OpenClaw 内部使用，无 semver 保证                                         |
