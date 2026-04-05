---
read_when:
    - 你想让 OpenClaw 连接到本地 SGLang 服务器运行
    - 你想通过自己的模型使用 OpenAI 兼容的 `/v1` 端点
summary: 通过 SGLang（OpenAI 兼容的自托管服务器）运行 OpenClaw
title: SGLang
x-i18n:
    generated_at: "2026-04-05T10:06:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang 可以通过 **OpenAI 兼容**的 HTTP API 提供开源模型服务。
OpenClaw 可以使用 `openai-completions` API 连接到 SGLang。

当你通过 `SGLANG_API_KEY` 选择启用时，OpenClaw 还可以从 SGLang **自动发现**
可用模型（如果你的服务器不强制认证，任意值都可以），前提是你没有定义显式的
`models.providers.sglang` 条目。

## 快速开始

1. 使用 OpenAI 兼容服务器启动 SGLang。

你的基础 URL 应暴露 `/v1` 端点（例如 `/v1/models`、
`/v1/chat/completions`）。SGLang 常见运行地址为：

- `http://127.0.0.1:30000/v1`

2. 选择启用它（如果未配置认证，任意值都可以）：

```bash
export SGLANG_API_KEY="sglang-local"
```

3. 运行新手引导并选择 `SGLang`，或直接设置模型：

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## 模型发现（隐式 provider）

当设置了 `SGLANG_API_KEY`（或存在认证配置文件），并且你**没有**
定义 `models.providers.sglang` 时，OpenClaw 将查询：

- `GET http://127.0.0.1:30000/v1/models`

并将返回的 ID 转换为模型条目。

如果你显式设置了 `models.providers.sglang`，则会跳过自动发现，
你必须手动定义模型。

## 显式配置（手动模型）

在以下情况下使用显式配置：

- SGLang 运行在其他主机或端口上。
- 你想固定 `contextWindow`/`maxTokens` 的值。
- 你的服务器需要真实 API 密钥（或你想控制请求头）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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
curl http://127.0.0.1:30000/v1/models
```

- 如果请求因认证错误而失败，请设置与你的服务器配置匹配的真实 `SGLANG_API_KEY`，
  或在 `models.providers.sglang` 下显式配置该 provider。

## 代理式行为

SGLang 被视为一种代理式 OpenAI 兼容 `/v1` 后端，而不是
原生 OpenAI 端点。

- 这里不适用仅限原生 OpenAI 的请求塑形
- 不支持 `service_tier`、Responses `store`、提示缓存提示，也不支持
  OpenAI 推理兼容负载塑形
- 在自定义 SGLang 基础 URL 上，不会注入隐藏的 OpenClaw 归因请求头
  （`originator`、`version`、`User-Agent`）
