---
read_when:
    - 你想让 OpenClaw 连接到本地 SGLang 服务器运行
    - 你想使用兼容 OpenAI 的 `/v1` 端点，并接入你自己的模型
summary: 使用 SGLang（兼容 OpenAI 的自托管服务器）运行 OpenClaw
title: SGLang
x-i18n:
    generated_at: "2026-04-23T02:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang 可以通过 **兼容 OpenAI** 的 HTTP API 提供开源模型服务。
OpenClaw 可以使用 `openai-completions` API 连接到 SGLang。

当你通过 `SGLANG_API_KEY` 选择启用时，OpenClaw 还可以从 SGLang **自动发现** 可用模型
（如果你的服务器未强制要求认证，任意值都可以），前提是你没有定义显式的 `models.providers.sglang` 条目。

OpenClaw 将 `sglang` 视为支持流式用量统计的本地兼容 OpenAI 的提供商，因此状态/上下文令牌计数可以根据 `stream_options.include_usage` 响应进行更新。

## 入门指南

<Steps>
  <Step title="启动 SGLang">
    使用兼容 OpenAI 的服务器启动 SGLang。你的基础 URL 应暴露
    `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。SGLang
    通常运行在：

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="设置 API 密钥">
    如果你的服务器未配置认证，任意值都可以：

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

当设置了 `SGLANG_API_KEY`（或存在认证配置文件），并且你**没有**
定义 `models.providers.sglang` 时，OpenClaw 将查询：

- `GET http://127.0.0.1:30000/v1/models`

并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.sglang`，则会跳过自动发现，
你必须手动定义模型。
</Note>

## 显式配置（手动模型）

在以下情况下使用显式配置：

- SGLang 运行在不同的主机/端口上。
- 你想固定 `contextWindow`/`maxTokens` 值。
- 你的服务器需要真实的 API 密钥（或者你想控制标头）。

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
    SGLang 被视为代理式的兼容 OpenAI 的 `/v1` 后端，而不是原生
    OpenAI 端点。

    | Behavior | SGLang |
    |----------|--------|
    | 仅 OpenAI 的请求整形 | 不应用 |
    | `service_tier`、Responses `store`、提示缓存提示 | 不发送 |
    | 推理兼容载荷整形 | 不应用 |
    | 隐藏归因标头（`originator`、`version`、`User-Agent`） | 在自定义 SGLang 基础 URL 上不注入 |

  </Accordion>

  <Accordion title="故障排除">
    **无法连接到服务器**

    验证服务器正在运行并有响应：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **认证错误**

    如果请求因认证错误而失败，请设置与你的服务器配置匹配的真实 `SGLANG_API_KEY`，
    或在 `models.providers.sglang` 下显式配置该提供商。

    <Tip>
    如果你在无认证的情况下运行 SGLang，`SGLANG_API_KEY`
    只要是任意非空值，就足以启用模型发现。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    包括提供商条目在内的完整配置模式。
  </Card>
</CardGroup>
