---
read_when:
    - 你想为多个 LLM 使用一个 API 密钥
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
    - 你想使用 OpenRouter 进行图像生成
    - 你想使用 OpenRouter 进行视频生成
summary: 在 OpenClaw 中使用 OpenRouter 的统一 API 访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-28T12:02:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一个**统一 API**，可通过单个端点和 API key 将请求路由到许多模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（可选）切换到特定模型">
    新手引导默认使用 `openrouter/auto`。稍后选择一个具体模型：

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
模型引用遵循 `openrouter/<provider>/<model>` 模式。如需查看可用提供商和模型的完整列表，请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用                          | 说明                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由          |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 通过 MoonshotAI    |

## 图像生成

OpenRouter 也可以支持 `image_generate` 工具。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 图像模型：

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

OpenClaw 会使用 `modalities: ["image", "text"]` 将图像请求发送到 OpenRouter 的 chat completions 图像 API。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对于较慢的 OpenRouter 图像模型，请使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次调用的 `timeoutMs` 参数仍然优先。

## 视频生成

OpenRouter 也可以通过其异步 `/videos` API 支持 `video_generate` 工具。在 `agents.defaults.videoGenerationModel` 下使用 OpenRouter 视频模型：

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

OpenClaw 会向 OpenRouter 提交文本转视频和图像转视频作业，轮询返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或已记录的作业内容端点下载完成的视频。默认情况下，参考图像会作为首帧/末帧图像发送；标记为 `reference_image` 的图像会作为 OpenRouter 输入引用发送。内置的 `google/veo-3.1-fast` 默认值声明当前支持 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及 `16:9`/`9:16` 宽高比。OpenRouter 未注册视频转视频，因为上游视频生成 API 当前接受文本和图像引用。

## 文本转语音

OpenRouter 也可以通过其 OpenAI 兼容的 `/audio/speech` 端点用作 TTS 提供商。

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

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）中，OpenClaw 还会添加 OpenRouter 文档中说明的应用归因标头：

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
  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenRouter 专用的 Anthropic `cache_control` 标记，OpenClaw 使用这些标记来更好地复用系统/开发者 prompt 块的 prompt 缓存。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将选定的思考级别映射到 OpenRouter 代理推理载荷。不受支持的模型提示和 `openrouter/auto` 会跳过该推理注入。Hunter Alpha 也会针对陈旧配置的模型引用跳过代理推理，因为 OpenRouter 可能会在该已退役路由的推理字段中返回最终答案文本。
  </Accordion>

  <Accordion title="仅 OpenAI 的请求整形">
    OpenRouter 仍然通过代理式 OpenAI 兼容路径运行，因此不会转发原生仅 OpenAI 的请求整形，例如 `serviceTier`、Responses `store`、OpenAI 推理兼容载荷和 prompt 缓存提示。
  </Accordion>

  <Accordion title="Gemini 支持的路由">
    Gemini 支持的 OpenRouter 引用会停留在代理 Gemini 路径上：OpenClaw 会在那里保留 Gemini thought-signature 清理，但不会启用原生 Gemini 重放验证或 bootstrap 重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    如果你在模型参数下传入 OpenRouter 提供商路由，OpenClaw 会在共享流包装器运行之前将其作为 OpenRouter 路由元数据转发。
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
