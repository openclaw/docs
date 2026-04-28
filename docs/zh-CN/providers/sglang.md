---
read_when:
- 你想让 OpenClaw 连接到本地 SGLang 服务器运行
- 你想使用 OpenAI 兼容的 `/v1` 端点和自己的模型
summary: 通过 SGLang（OpenAI 兼容的自托管服务器）运行 OpenClaw
title: SGLang
x-i18n:
  generated_at: '2026-04-23T21:02:02Z'
  model: gpt-5.4
  provider: openai
  source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
  source_path: providers/sglang.md
  workflow: 15
---
SGLang 可以通过 **OpenAI 兼容**的 HTTP API 提供开源模型服务。
OpenClaw 可以使用 `openai-completions` API 连接到 SGLang。

当你选择启用 `SGLANG_API_KEY` 时（如果你的服务器未启用认证，则任意值都可用），且你未显式定义 `models.providers.sglang` 条目，OpenClaw 还可以**自动发现** SGLang 上可用的模型。

OpenClaw 将 `sglang` 视为一个本地的 OpenAI 兼容提供商，并支持
流式使用量统计，因此状态/上下文 token 计数可以根据
`stream_options.include_usage` 响应进行更新。

## 入门指南

<Steps>
  <Step title="启动 SGLang">
    使用 OpenAI 兼容服务器启动 SGLang。你的 base URL 应暴露
    `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。SGLang
    通常运行在：

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="设置 API key">
    如果你的服务器未配置认证，任意值都可用：

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="运行新手引导或直接设置模型">
    ```bash
    openclaw onboard
    ```

    或手动配置模型：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 模型发现（隐式提供商）

当设置了 `SGLANG_API_KEY`（或存在 auth profile），并且你**没有**
定义 `models.providers.sglang` 时，OpenClaw 会查询：

- `GET http://127.0.0.1:30000/v1/models`

并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.sglang`，则会跳过自动发现，
你必须手动定义模型。
</Note>

## 显式配置（手动模型）

在以下情况下请使用显式配置：

- SGLang 运行在不同的主机/端口上。
- 你希望固定 `contextWindow`/`maxTokens` 值。
- 你的服务器需要真实 API key（或你希望控制 headers）。

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

## 高级配置

<AccordionGroup>
  <Accordion title="代理式行为">
    SGLang 会被视为代理式 OpenAI 兼容 `/v1` 后端，而不是
    原生 OpenAI 端点。

    | 行为 | SGLang |
    |----------|--------|
    | 仅 OpenAI 的请求整形 | 不应用 |
    | `service_tier`、Responses `store`、提示缓存提示 | 不发送 |
    | Reasoning 兼容负载整形 | 不应用 |
    | 隐式归属请求头（`originator`、`version`、`User-Agent`） | 不会注入到自定义 SGLang base URL 上 |

  </Accordion>

  <Accordion title="故障排除">
    **服务器不可达**

    请验证服务器正在运行并且有响应：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **认证错误**

    如果请求因认证错误失败，请设置与你服务器配置匹配的真实 `SGLANG_API_KEY`，
    或在 `models.providers.sglang` 下显式配置该提供商。

    <Tip>
    如果你在无认证模式下运行 SGLang，只需为
    `SGLANG_API_KEY` 设置任意非空值，即可选择启用模型发现。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    如何选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    包括提供商条目在内的完整配置 schema。
  </Card>
</CardGroup>
