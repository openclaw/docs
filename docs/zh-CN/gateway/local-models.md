---
read_when:
    - 你想从你自己的 GPU 主机提供模型服务
    - 你正在连接 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型使用指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-27T08:18:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6d44f451e14e74f49b8fb23c7c890c8a13a76c56ef82e5d271cfbb7d90f7c81
    source_path: gateway/local-models.md
    workflow: 15
---

本地部署是可行的，但 OpenClaw 需要大上下文窗口 + 强大的提示注入防御能力。小显卡会截断上下文并削弱安全性。建议尽量提高配置：**≥2 台满配 Mac Studio 或同等级 GPU 主机（约 3 万美元以上）**。单张 **24 GB** GPU 只适合较轻量的提示，且延迟更高。请使用**你能运行的最大 / 完整尺寸模型变体**；激进量化或“small”检查点会提高提示注入风险（参见 [Security](/zh-CN/gateway/security)）。

如果你想要最低摩擦的本地部署方式，请从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 开始，并运行 `openclaw onboard`。本页是面向更高端本地技术栈和自定义兼容 OpenAI 的本地服务器的主观推荐指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

这是当前最好的本地技术栈。在 LM Studio 中加载一个大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理内容与最终文本分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**设置清单**

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大模型构建**（避免 “small”/重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 能列出该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使在运行本地模型时，也请保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

### 混合配置：托管模型作为主模型，本地模型作为回退

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

### 本地优先，同时保留托管安全网

交换主模型与回退模型的顺序；保留相同的 provider 配置块和 `models.mode: "merge"`，这样当本地主机不可用时，你仍然可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax/Kimi/GLM 变体也可通过 OpenRouter 的区域固定端点提供（例如美国托管）。你可以在那里选择区域变体，将流量限制在你指定的司法辖区内，同时仍然使用 `models.mode: "merge"` 来保留 Anthropic/OpenAI 回退。
- 纯本地仍然是隐私最强的方案；当你需要提供商功能但又希望控制数据流向时，区域托管路由是折中方案。

## 其他兼容 OpenAI 的本地代理

如果 vLLM、LiteLLM、OAI-proxy 或自定义网关暴露的是 OpenAI 风格的 `/v1` 端点，它们都可以工作。将上面的 provider 配置块替换为你的端点和模型 ID：

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

保留 `models.mode: "merge"`，这样托管模型仍可作为回退使用。
对于较慢的本地或远程模型服务器，请优先使用 `models.providers.<id>.timeoutSeconds`，再考虑提高 `agents.defaults.timeoutSeconds`。provider 超时仅适用于模型 HTTP 请求，包括连接、响应头、body 流式传输，以及整个受保护获取流程的中止控制。

关于本地 / 代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的兼容 OpenAI 路由，而不是原生 OpenAI 端点
- 仅适用于原生 OpenAI 的请求整形不会在这里生效：没有 `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容负载整形，也没有提示缓存提示
- 隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）不会注入到这些自定义代理 URL 中

对更严格的兼容 OpenAI 后端的兼容性说明：

- 某些服务器在 Chat Completions 中只接受字符串类型的 `messages[].content`，不接受结构化的内容片段数组。对于这些端点，请设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型会以文本形式输出独立的方括号工具请求，例如 `[tool_name]`，后接 JSON 和 `[END_TOOL_REQUEST]`。只有当该名称与当前轮次已注册工具完全匹配时，OpenClaw 才会将其提升为真正的工具调用；否则，该块会被视为不受支持的文本，并从用户可见回复中隐藏。
- 如果某个模型输出看起来像工具调用的 JSON、XML 或 ReAct 风格文本，但 provider 并未输出结构化调用，OpenClaw 会将其保留为文本，并记录一条警告日志，其中包含运行 ID、provider/模型、检测到的模式，以及可用时的工具名称。应将这视为 provider/模型的工具调用不兼容问题，而不是工具已成功运行。
- 某些更小型或更严格的本地后端在处理 OpenClaw 完整的智能体运行时提示形状时并不稳定，尤其是在包含工具 schema 时。如果后端能够处理很小的直接 `/v1/chat/completions` 调用，但在正常的 OpenClaw 智能体轮次中失败，请先尝试设置 `agents.defaults.experimental.localModelLean: true`，以移除像 `browser`、`cron` 和 `message` 这样的重量级默认工具；这是一个实验性标志，不是稳定的默认模式设置。参见 [Experimental Features](/zh-CN/concepts/experimental-features)。如果这样仍然失败，再尝试 `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只在更大的 OpenClaw 运行中失败，剩余问题通常是上游模型/服务器容量不足或后端 bug，而不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`
- LM Studio 模型未加载？重新加载；冷启动是常见的“卡住”原因。
- 当检测到的上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你触发了该预检，请提高服务器/模型的上下文限制，或选择更大的模型。
- 上下文错误？降低 `contextWindow` 或提高你的服务器限制。
- 兼容 OpenAI 的服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 调用可用，但 `openclaw infer model run`
  在 Gemma 或其他本地模型上失败？先用
  `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在更大的 OpenClaw 提示上崩溃，应将其视为上游服务器/模型的限制。
- 安全性：本地模型会跳过提供商侧过滤；请保持智能体范围收窄并启用压缩，以限制提示注入的影响范围。

## 相关内容

- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [Model failover](/zh-CN/concepts/model-failover)
