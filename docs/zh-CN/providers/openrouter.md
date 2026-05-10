---
read_when:
    - 你想为多个 LLM 使用同一个 API 密钥
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
    - 你想使用 OpenRouter 进行图像生成
    - 你想使用 OpenRouter 进行视频生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:47:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一个**统一 API**，可将请求通过单一端点和 API key 路由到多个模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

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
模型引用遵循 `openrouter/<provider>/<model>` 模式。可用提供商和模型的完整列表见 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用                          | 备注                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由          |
| `openrouter/moonshotai/kimi-k2.6` | 通过 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 通过 MoonshotAI 使用 Kimi K2.5 |

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

OpenClaw 会使用 `modalities: ["image", "text"]` 将图像请求发送到 OpenRouter 的 chat completions image API。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对于较慢的 OpenRouter 图像模型，使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次调用的 `timeoutMs` 参数仍然优先生效。

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

OpenClaw 会向 OpenRouter 提交文生视频和图生视频任务，轮询返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或已文档化的任务内容端点下载完成的视频。默认情况下，参考图像会作为第一帧/最后一帧图像发送；标记为 `reference_image` 的图像会作为 OpenRouter 输入引用发送。内置的 `google/veo-3.1-fast` 默认值声明当前支持 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及 `16:9`/`9:16` 宽高比。OpenRouter 未注册视频到视频，因为上游视频生成 API 目前接受文本和图像引用。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会复用 `models.providers.openrouter.apiKey`，然后再使用 `OPENROUTER_API_KEY`。

## 身份验证和标头

OpenRouter 底层使用携带你的 API key 的 Bearer token。

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）中，OpenClaw 还会添加 OpenRouter 文档中说明的应用归因标头：

| 标头                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你将 OpenRouter 提供商重新指向其他代理或 base URL，OpenClaw **不会**注入这些 OpenRouter 专用标头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="响应缓存">
    OpenRouter 响应缓存需要显式启用。通过模型参数为每个 OpenRouter 模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 会发送 `X-OpenRouter-Cache: true`，并在配置时发送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 会强制刷新当前请求并存储替换响应。也接受 snake_case 别名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    这独立于提供商提示缓存，也独立于 OpenRouter 的 Anthropic `cache_control` 标记。它只应用于已验证的 `openrouter.ai` 路由，而不是自定义代理 base URL。

  </Accordion>

  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenRouter 专用的 Anthropic `cache_control` 标记，OpenClaw 使用这些标记在 system/developer 提示块上更好地复用提示缓存。
  </Accordion>

  <Accordion title="Anthropic 推理预填充">
    在已验证的 OpenRouter 路由上，启用推理的 Anthropic 模型引用会在请求到达 OpenRouter 之前删除尾随的 assistant 预填充轮次，以匹配 Anthropic 要求推理对话以用户轮次结束的规定。
  </Accordion>

  <Accordion title="Thinking / 推理注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将所选 thinking 级别映射到 OpenRouter 代理推理负载。不受支持的模型提示和 `openrouter/auto` 会跳过该推理注入。Hunter Alpha 也会对过时配置的模型引用跳过代理推理，因为 OpenRouter 可能会在该已弃用路由的推理字段中返回最终答案文本。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重放">
    在已验证的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 会在重放的 assistant 轮次上填充缺失的 `reasoning_content`，使 thinking/工具对话保持 DeepSeek V4 要求的后续形态。OpenClaw 会为这些路由发送 OpenRouter 支持的 `reasoning_effort` 值；`xhigh` 是声明的最高级别，过时的 `max` 覆盖会映射到 `xhigh`。
  </Accordion>

  <Accordion title="仅 OpenAI 请求整形">
    OpenRouter 仍会走代理风格、兼容 OpenAI 的路径，因此不会转发原生仅 OpenAI 的请求整形，例如 `serviceTier`、Responses `store`、OpenAI 推理兼容负载和提示缓存提示。
  </Accordion>

  <Accordion title="Gemini 后端路由">
    Gemini 后端的 OpenRouter 引用会保留在代理 Gemini 路径上：OpenClaw 会在那里保留 Gemini thought-signature 清理，但不会启用原生 Gemini 重放验证或引导重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    如果你在模型参数下传入 OpenRouter 提供商路由，OpenClaw 会在共享流包装器运行之前，将其作为 OpenRouter 路由元数据转发。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
