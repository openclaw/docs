---
read_when:
    - 你想用一个 API key 访问多个 LLM
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
    - 你想将 OpenRouter 用于图像生成
summary: 在 OpenClaw 中使用 OpenRouter 的统一 API 访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-27T12:55:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fcbad5f5b303d3e5eb8a855cd8b3234e7d4a5460e07c7b27c407524ea9540fc
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter 提供了一个**统一 API**，可通过单个
端点和 API key 将请求路由到多种模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

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
    新手引导默认使用 `openrouter/auto`。之后你可以选择具体模型：

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
模型引用遵循 `openrouter/<provider>/<model>` 模式。完整的
可用提供商和模型列表，请参见 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| Model ref                         | 说明                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由          |
| `openrouter/moonshotai/kimi-k2.6` | 通过 Moonshot AI 使用 Kimi K2.6 |

## 图像生成

OpenRouter 也可作为 `image_generate` 工具的后端。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 图像模型：

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

OpenClaw 会将图像请求发送到 OpenRouter 的 chat completions 图像 API，并使用 `modalities: ["image", "text"]`。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对于较慢的 OpenRouter 图像模型，请使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具的单次调用 `timeoutMs` 参数仍然优先生效。

## 文本转语音

OpenRouter 也可以通过其兼容 OpenAI 的
`/audio/speech` 端点用作 TTS 提供商。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会复用
`models.providers.openrouter.apiKey`，然后回退到 `OPENROUTER_API_KEY`。

## 身份验证和标头

OpenRouter 底层使用携带你的 API key 的 Bearer token。

对于真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`），OpenClaw 还会添加
OpenRouter 文档中说明的应用归因标头：

| Header                    | 值                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
如果你将 OpenRouter provider 重新指向其他代理或 base URL，OpenClaw
**不会**注入这些 OpenRouter 专用标头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留
    OpenRouter 专用的 Anthropic `cache_control` 标记，这是 OpenClaw 为了
    更好地复用 system/developer prompt 块上的 prompt cache 而使用的。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    在受支持且非 `auto` 的路由上，OpenClaw 会将所选 thinking 级别映射为
    OpenRouter 代理 reasoning 负载。对于不受支持的模型提示以及
    `openrouter/auto`，则会跳过该 reasoning 注入。Hunter Alpha 也会对过时的已配置模型引用跳过
    代理 reasoning，因为在该已退役路由上，OpenRouter 可能会在 reasoning 字段中返回最终答案文本。
  </Accordion>

  <Accordion title="仅适用于 OpenAI 的请求整形">
    OpenRouter 仍然走代理式 OpenAI 兼容路径，因此
    原生仅适用于 OpenAI 的请求整形，例如 `serviceTier`、Responses `store`、
    OpenAI reasoning 兼容负载和 prompt cache 提示，不会被转发。
  </Accordion>

  <Accordion title="Gemini 支持的路由">
    由 Gemini 支持的 OpenRouter 引用仍然走代理 Gemini 路径：OpenClaw 会在该路径上保留
    Gemini thought-signature 清理，但不会启用原生 Gemini
    重放验证或引导重写。
  </Accordion>

  <Accordion title="Provider 路由元数据">
    如果你在模型参数下传递 OpenRouter provider 路由信息，OpenClaw 会在共享流包装器运行之前
    将其作为 OpenRouter 路由元数据转发。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
