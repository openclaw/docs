---
read_when:
    - 你想让 OpenClaw 连接到本地 vLLM 服务器运行
    - 你想通过自己的模型使用 OpenAI 兼容的 `/v1` 端点
summary: 通过 vLLM（OpenAI 兼容的本地服务器）运行 OpenClaw
title: vLLM
x-i18n:
    generated_at: "2026-04-05T10:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM 可以通过 **OpenAI 兼容**的 HTTP API 提供开源模型（以及某些自定义模型）服务。OpenClaw 可以使用 `openai-completions` API 连接到 vLLM。

当你通过 `VLLM_API_KEY` 选择启用时，OpenClaw 还可以从 vLLM **自动发现**可用模型（如果你的服务器不强制认证，任意值都可以），前提是你没有定义显式的 `models.providers.vllm` 条目。

## 快速开始

1. 使用 OpenAI 兼容服务器启动 vLLM。

你的基础 URL 应暴露 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 常见运行地址为：

- `http://127.0.0.1:8000/v1`

2. 选择启用它（如果未配置认证，任意值都可以）：

```bash
export VLLM_API_KEY="vllm-local"
```

3. 选择一个模型（替换为你的 vLLM 模型 ID 之一）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## 模型发现（隐式 provider）

当设置了 `VLLM_API_KEY`（或存在认证配置文件），并且你**没有**定义 `models.providers.vllm` 时，OpenClaw 将查询：

- `GET http://127.0.0.1:8000/v1/models`

……并将返回的 ID 转换为模型条目。

如果你显式设置了 `models.providers.vllm`，则会跳过自动发现，你必须手动定义模型。

## 显式配置（手动模型）

在以下情况下使用显式配置：

- vLLM 运行在其他主机或端口上。
- 你想固定 `contextWindow`/`maxTokens` 的值。
- 你的服务器需要真实 API 密钥（或你想控制请求头）。

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 故障排除

- 检查服务器是否可达：

```bash
curl http://127.0.0.1:8000/v1/models
```

- 如果请求因认证错误而失败，请设置与你的服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置该 provider。

## 代理式行为

vLLM 被视为一种代理式 OpenAI 兼容 `/v1` 后端，而不是原生
OpenAI 端点。

- 这里不适用仅限原生 OpenAI 的请求塑形
- 不支持 `service_tier`、Responses `store`、提示缓存提示，也不支持
  OpenAI 推理兼容负载塑形
- 在自定义 vLLM 基础 URL 上，不会注入隐藏的 OpenClaw 归因请求头
  （`originator`、`version`、`User-Agent`）
