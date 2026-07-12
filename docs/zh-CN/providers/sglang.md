---
read_when:
    - 你想让 OpenClaw 连接本地 SGLang 服务器运行
    - 你希望通过 OpenAI 兼容的 /v1 端点使用自己的模型
summary: 使用 SGLang 运行 OpenClaw（兼容 OpenAI 的自托管服务器）
title: SGLang
x-i18n:
    generated_at: "2026-07-11T20:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang 通过兼容 OpenAI 的 HTTP API 提供开放权重模型。OpenClaw 使用 `openai-completions` 提供商系列连接到 SGLang，并自动发现可用模型。

| 属性                      | 值                                                           |
| ------------------------- | ------------------------------------------------------------ |
| 提供商 ID                 | `sglang`                                                     |
| 插件                      | 内置，`enabledByDefault: true`                               |
| 身份验证环境变量          | `SGLANG_API_KEY`（如果服务器未启用身份验证，可使用任意非空值） |
| 新手引导标志              | `--auth-choice sglang`                                       |
| API                       | 兼容 OpenAI（`openai-completions`）                          |
| 默认基础 URL              | `http://127.0.0.1:30000/v1`                                  |
| 默认模型占位符            | `sglang/Qwen/Qwen3-8B`                                       |
| 流式用量信息              | 是（`supportsStreamingUsage: true`）                         |
| 定价                      | 标记为外部免费（`modelPricing.external: false`）             |

当你通过 `SGLANG_API_KEY` 选择启用 SGLang 时，OpenClaw 还会**自动发现**其中的可用模型。如果你还配置了自定义 SGLang 基础 URL，请在 `agents.defaults.models` 中使用 `sglang/*`，以保持动态发现。请参阅下文的[模型发现（隐式提供商）](#model-discovery-implicit-provider)。

## 入门指南

<Steps>
  <Step title="启动 SGLang">
    启动带有兼容 OpenAI 服务器的 SGLang。你的基础 URL 应公开
    `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。SGLang
    通常运行于：

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="设置 API 密钥">
    如果你的服务器未配置身份验证，可使用任意值：

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

当已设置 `SGLANG_API_KEY`（或存在身份验证配置文件），并且你**没有**
定义 `models.providers.sglang` 时，OpenClaw 会查询：

- `GET http://127.0.0.1:30000/v1/models`

并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.sglang`，OpenClaw 默认使用你声明的
模型。如果你希望 OpenClaw 查询该已配置提供商的 `/models` 端点，并包含
所有公开的 SGLang 模型，请将 `"sglang/*": {}` 添加到 `agents.defaults.models`。
</Note>

## 显式配置（手动指定模型）

以下情况请使用显式配置：

- SGLang 运行在其他主机或端口上。
- 你希望固定 `contextWindow`/`maxTokens` 的值。
- 你的服务器要求使用真实的 API 密钥（或者你希望控制请求头）。

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
    SGLang 被视为代理式、兼容 OpenAI 的 `/v1` 后端，而非
    原生 OpenAI 端点。

    | 行为 | SGLang |
    |----------|--------|
    | 仅适用于 OpenAI 的请求结构调整 | 不应用 |
    | `service_tier`、Responses 的 `store`、提示词缓存提示 | 不发送 |
    | 推理兼容性载荷结构调整 | 不应用 |
    | 隐藏的归属信息请求头（`originator`、`version`、`User-Agent`） | 不注入自定义 SGLang 基础 URL 的请求 |

  </Accordion>

  <Accordion title="故障排查">
    **无法访问服务器**

    验证服务器正在运行并能够响应：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **身份验证错误**

    如果请求因身份验证错误而失败，请设置与服务器配置相符的真实
    `SGLANG_API_KEY`，或在 `models.providers.sglang` 下显式配置提供商。

    <Tip>
    如果你运行的 SGLang 未启用身份验证，为 `SGLANG_API_KEY`
    设置任意非空值即可选择启用模型发现。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置架构，包括提供商条目。
  </Card>
</CardGroup>
