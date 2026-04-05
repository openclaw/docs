---
read_when:
    - 你想从自己的 GPU 服务器提供模型服务
    - 你正在接入 LM Studio 或 OpenAI 兼容代理
    - 你需要最安全的本地模型使用指导
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-05T08:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# 本地模型

本地部署是可行的，但 OpenClaw 需要大上下文窗口以及对 prompt injection 的强防护。小显存卡会截断上下文，并削弱安全性。目标尽量拉高：**至少 2 台满配 Mac Studio，或同等 GPU 设备（约 3 万美元以上）**。单张 **24 GB** GPU 只适合更轻量的提示词，并且延迟更高。请使用**你能运行的最大 / 完整尺寸模型变体**；激进量化或 “small” 检查点会提高 prompt injection 风险（参见 [Security](/gateway/security)）。

如果你想要摩擦最小的本地部署方式，请从 [Ollama](/providers/ollama) 和 `openclaw onboard` 开始。本页是针对更高端本地栈和自定义 OpenAI 兼容本地服务器的偏好型指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

这是当前最推荐的本地方案。在 LM Studio 中加载一个大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理过程与最终文本分离。

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
- 在 LM Studio 中，下载**可用的最大模型构建**（避免 “small”/重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 能列出该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型处于已加载状态；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使你在本地运行模型，也请保留托管模型配置；使用 `models.mode: "merge"`，以便在需要时仍可使用回退模型。

### 混合配置：托管主模型，本地回退

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

### 本地优先，并保留托管安全网

交换主模型和回退模型的顺序；保留相同的 providers 配置块和 `models.mode: "merge"`，这样在本地机器不可用时，你仍可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管版 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，并提供区域固定端点（例如美国托管）。你可以在那里选择区域变体，以便让流量保持在你选择的司法辖区内，同时仍通过 `models.mode: "merge"` 使用 Anthropic/OpenAI 回退。
- 纯本地仍然是隐私最强的路径；当你需要提供商功能但又希望控制数据流时，托管区域路由是折中方案。

## 其他 OpenAI 兼容本地代理

如果 vLLM、LiteLLM、OAI-proxy 或自定义 Gateway 网关暴露的是 OpenAI 风格的 `/v1` 端点，它们也可以使用。将上面的 provider 配置块替换为你的端点和模型 ID：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
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

请保留 `models.mode: "merge"`，这样托管模型仍可作为回退使用。

关于本地/代理 `/v1` 后端的行为说明：

- OpenClaw 会将这些后端视为代理风格的 OpenAI 兼容路由，而不是原生
  OpenAI 端点
- 这里不会应用仅适用于原生 OpenAI 的请求塑形：没有
  `service_tier`，没有 Responses `store`，没有 OpenAI reasoning 兼容负载
  塑形，也没有 prompt-cache 提示
- 不会在这些自定义代理 URL 上注入隐藏的 OpenClaw 归属头（`originator`、`version`、`User-Agent`）

## 故障排除

- Gateway 网关能访问代理吗？`curl http://127.0.0.1:1234/v1/models`
- LM Studio 模型未加载？请重新加载；冷启动是常见的“卡住”原因。
- 上下文错误？降低 `contextWindow`，或提高服务器限制。
- 安全性：本地模型会跳过提供商侧过滤；请保持智能体范围狭窄，并启用 Compaction，以限制 prompt injection 的影响半径。
