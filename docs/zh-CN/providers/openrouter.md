---
read_when:
    - 你想用一个 API 密钥访问多种大语言模型
    - 你想通过 OpenRouter 在 OpenClaw 中运行模型
    - 你想使用 OpenRouter 进行图像生成
    - 你想使用 OpenRouter 进行视频生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问众多模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T09:53:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一个**统一 API**，可通过单一端点和 API key 将请求路由到多个模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 入门指南

<Steps>
  <Step title="Get your API key">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API key。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    新手引导默认使用 `openrouter/auto`。之后可以选择一个具体模型：

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
模型引用遵循 `openrouter/<provider>/<model>` 模式。如需可用提供商和模型的完整列表，请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用                          | 备注                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由          |
| `openrouter/moonshotai/kimi-k2.6` | 通过 MoonshotAI 使用 Kimi K2.6 |

## 图像生成

OpenRouter 也可以作为 `image_generate` 工具的后端。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 图像模型：

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

OpenClaw 会使用 `modalities: ["image", "text"]` 将图像请求发送到 OpenRouter 的 chat completions 图像 API。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对于较慢的 OpenRouter 图像模型，请使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具的单次调用 `timeoutMs` 参数仍然优先。

## 视频生成

OpenRouter 也可以通过其异步 `/videos` API 作为 `video_generate` 工具的后端。在 `agents.defaults.videoGenerationModel` 下使用 OpenRouter 视频模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw 会向 OpenRouter 提交文本转视频和图像转视频任务，轮询返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或文档化的任务内容端点下载完成的视频。参考图像默认作为首帧/末帧图像发送；带有 `reference_image` 标记的图像会作为 OpenRouter 输入引用发送。内置的 `google/veo-3.1-fast` 默认值声明了当前支持的 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及 `16:9`/`9:16` 宽高比。OpenRouter 未注册视频转视频，因为上游视频生成 API 当前接受文本和图像引用。

## 文本转语音

OpenRouter 还可以通过其 OpenAI 兼容的 `/audio/speech` 端点用作 TTS 提供商。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会复用 `models.providers.openrouter.apiKey`，然后再使用 `OPENROUTER_API_KEY`。

## 身份验证和标头

OpenRouter 底层使用带有你的 API key 的 Bearer token。

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）中，OpenClaw 还会添加 OpenRouter 文档化的应用归因标头：

| 标头                      | 值                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
如果你将 OpenRouter 提供商重新指向其他代理或 base URL，OpenClaw **不会**注入这些 OpenRouter 专用标头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    在经过验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenRouter 专用的 Anthropic `cache_control` 标记，OpenClaw 会用它们在 system/developer prompt 块上更好地复用 prompt cache。
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    在经过验证的 OpenRouter 路由上，启用 reasoning 的 Anthropic 模型引用会在请求到达 OpenRouter 之前丢弃末尾的 assistant prefill 轮次，以符合 Anthropic 要求 reasoning 对话以 user 轮次结束的规则。
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    在受支持的非 `auto` 路由上，OpenClaw 会将所选 thinking 级别映射到 OpenRouter 代理 reasoning 载荷。不受支持的模型提示和 `openrouter/auto` 会跳过该 reasoning 注入。Hunter Alpha 也会对过期配置的模型引用跳过代理 reasoning，因为 OpenRouter 可能会在该退役路由的 reasoning 字段中返回最终答案文本。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    在经过验证的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 会为重放的 assistant 轮次填充缺失的 `reasoning_content`，从而让 thinking/tool 对话保持 DeepSeek V4 所需的后续形态。
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter 仍然走代理式 OpenAI 兼容路径，因此不会转发仅原生 OpenAI 支持的请求整理，例如 `serviceTier`、Responses `store`、OpenAI reasoning 兼容载荷和 prompt cache 提示。
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Gemini 后端的 OpenRouter 引用会留在 proxy-Gemini 路径上：OpenClaw 会在那里保留 Gemini thought-signature 清理，但不会启用原生 Gemini 重放验证或 bootstrap 重写。
  </Accordion>

  <Accordion title="Provider routing metadata">
    如果你在模型参数下传递 OpenRouter 提供商路由，OpenClaw 会在共享 stream 包装器运行之前将其作为 OpenRouter 路由元数据转发。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
