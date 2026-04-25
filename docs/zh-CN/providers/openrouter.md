---
read_when:
    - 你希望用一个 API key 访问多个 LLM
    - 你希望在 OpenClaw 中通过 OpenRouter 运行模型
    - 你希望使用 OpenRouter 进行图像生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T17:31:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter 提供一个**统一 API**，可通过单个端点和 API key 将请求路由到多种模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建一个 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（可选）切换到特定模型">
    新手引导默认使用 `openrouter/auto`。你之后可以选择一个具体模型：

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 配置示例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 模型引用

<Note>
模型引用遵循 `openrouter/<provider>/<model>` 模式。完整的可用 provider 和模型列表，请参见 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用 | 说明 |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto` | OpenRouter 自动路由 |
| `openrouter/moonshotai/kimi-k2.6` | 通过 Moonshot AI 使用 Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha 路由 |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha 路由 |

## 图像生成

OpenRouter 也可以作为 `image_generate` 工具的后端。请在 `agents.defaults.imageGenerationModel` 下使用一个 OpenRouter 图像模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw 会将图像请求发送到 OpenRouter 的 chat completions 图像 API，并使用 `modalities: ["image", "text"]`。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对于较慢的 OpenRouter 图像模型，请使用 `agents.defaults.imageGenerationModel.timeoutMs`；但 `image_generate` 工具的每次调用 `timeoutMs` 参数仍然具有更高优先级。

## 文本转语音

OpenRouter 也可以通过其兼容 OpenAI 的 `/audio/speech` 端点用作 TTS 提供商。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会复用 `models.providers.openrouter.apiKey`，然后再回退到 `OPENROUTER_API_KEY`。

## 认证与请求头

OpenRouter 在底层使用你的 API key 作为 Bearer token。

对于真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`），OpenClaw 还会添加 OpenRouter 文档中说明的应用归因请求头：

| Header | 值 |
| ------------------------- | --------------------- |
| `HTTP-Referer` | `https://openclaw.ai` |
| `X-OpenRouter-Title` | `OpenClaw` |
| `X-OpenRouter-Categories` | `cli-agent` |

<Warning>
如果你将 OpenRouter provider 重新指向其他代理或 base URL，OpenClaw **不会**注入这些 OpenRouter 特有的请求头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenRouter 专用的 Anthropic `cache_control` 标记，这是 OpenClaw 为了更好地复用 system/developer prompt 块的提示缓存而使用的。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将所选的 thinking 级别映射到 OpenRouter 代理推理负载。不受支持的模型提示和 `openrouter/auto` 会跳过这种 reasoning 注入。
  </Accordion>

  <Accordion title="仅 OpenAI 的请求整形">
    OpenRouter 仍然通过代理风格的 OpenAI 兼容路径运行，因此原生仅 OpenAI 的请求整形，例如 `serviceTier`、Responses `store`、OpenAI reasoning 兼容负载以及提示缓存提示，都不会被转发。
  </Accordion>

  <Accordion title="Gemini 支持的路由">
    由 Gemini 支持的 OpenRouter 引用会保持在代理 Gemini 路径上：OpenClaw 会继续在那里保留 Gemini thought-signature 清理，但不会启用原生 Gemini 重放校验或 bootstrap 重写。
  </Accordion>

  <Accordion title="Provider 路由元数据">
    如果你在模型参数下传递 OpenRouter provider 路由信息，OpenClaw 会在共享流包装器运行之前，将其作为 OpenRouter 路由元数据进行转发。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
