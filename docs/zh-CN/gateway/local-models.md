---
read_when:
    - 你希望从你自己的 GPU 主机提供模型服务
    - 你正在配置 LM Studio 或与 OpenAI 兼容的代理
    - 你需要最安全的本地模型指引
summary: 在本地 LLM（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）上运行 OpenClaw
title: 本地模型
x-i18n:
    generated_at: "2026-04-27T04:33:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b6c3952f6384038fef3b2afd5cf623b6a1744072b789240f394dc7552751f2b
    source_path: gateway/local-models.md
    workflow: 15
---

本地部署是可行的，但 OpenClaw 需要大上下文窗口，以及对提示注入的强防护。小显存显卡会截断上下文，并削弱安全性。目标配置要尽可能高：**≥ 2 台满配 Mac Studio 或同等级 GPU 设备（约 3 万美元以上）**。单张 **24 GB** GPU 只适合较轻量的提示词场景，而且延迟会更高。使用**你能运行的最大 / 全尺寸模型变体**；激进量化或“small”检查点会提高提示注入风险（参见 [Security](/zh-CN/gateway/security)）。

如果你想要摩擦最小的本地部署方案，从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 配合 `openclaw onboard` 开始。此页面是面向更高端本地堆栈和自定义 OpenAI 兼容本地服务器的主观推荐指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

这是当前最好的本地方案。在 LM Studio 中加载一个大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理内容与最终文本分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**设置清单**

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大模型构建**（避免使用 “small”/重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 能列出该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使你在本地运行，也建议保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

### 混合配置：托管模型为主，本地模型回退

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 本地优先，托管模型作安全兜底

交换主模型和回退模型的顺序；保留相同的 provider 配置块和 `models.mode: "merge"`，这样当本地主机不可用时，你仍然可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax/Kimi/GLM 变体也可通过 OpenRouter 的区域固定端点提供（例如美国托管）。在那里选择区域变体，可以在继续使用 `models.mode: "merge"` 为 Anthropic/OpenAI 提供回退的同时，将流量限制在你选定的司法辖区内。
- 纯本地仍然是隐私最强的路径；如果你需要 provider 功能，但又想控制数据流向，那么区域托管路由就是折中方案。

## 其他 OpenAI 兼容本地代理

如果 vLLM、LiteLLM、OAI-proxy 或自定义 Gateway 网关公开了 OpenAI 风格的 `/v1` 端点，也可以使用。将上面的 provider 配置块替换为你的端点和模型 ID：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

保留 `models.mode: "merge"`，这样托管模型仍可作为回退选项。
对于较慢的本地或远程模型服务器，请先使用 `models.providers.<id>.timeoutSeconds`，再考虑提高 `agents.defaults.timeoutSeconds`。provider 超时仅适用于模型 HTTP 请求，包括连接、响应头、流式响应体，以及整个受保护获取请求的中止控制。

关于本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生 OpenAI 端点
- 仅适用于原生 OpenAI 的请求整形在这里不会生效：没有 `service_tier`、没有 Responses `store`、没有 OpenAI 推理兼容负载整形，也没有提示缓存提示
- 隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）不会注入到这些自定义代理 URL 中

针对更严格的 OpenAI 兼容后端的兼容性说明：

- 某些服务器在 Chat Completions 中只接受字符串形式的 `messages[].content`，不接受结构化内容片段数组。对于这些端点，请设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些更小型或更严格的本地后端在处理 OpenClaw 完整的 Agent Runtimes 提示词结构时不稳定，尤其是在包含工具 schema 时。如果该后端可以处理极小的直接 `/v1/chat/completions` 调用，但在正常的 OpenClaw 智能体轮次中失败，请先尝试设置 `agents.defaults.experimental.localModelLean: true`，以去掉 `browser`、`cron` 和 `message` 等重量级默认工具；这是一个实验性标志，不是稳定的默认模式设置。参见 [Experimental Features](/zh-CN/concepts/experimental-features)。如果这样仍然失败，再尝试设置 `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只在更大的 OpenClaw 运行中失败，剩余问题通常是上游模型/服务器容量不足或后端 bug，而不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 网关能连接到代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型被卸载了吗？重新加载；冷启动是常见的“卡住”原因。
- 当检测到的上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你触发了这个预检，请提高服务器/模型的上下文限制，或选择更大的模型。
- 出现上下文错误？降低 `contextWindow` 或提高服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在对应模型条目上添加 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 调用可以工作，但 `openclaw infer model run` 在 Gemma 或其他本地模型上失败？
  先用 `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在较大的 OpenClaw 提示词下崩溃，就应将其视为上游服务器/模型限制。
- 安全性：本地模型会跳过 provider 侧过滤；请保持智能体范围尽量窄，并启用压缩，以限制提示注入的影响范围。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [模型故障切换](/zh-CN/concepts/model-failover)
