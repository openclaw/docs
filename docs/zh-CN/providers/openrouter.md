---
read_when:
    - 你想用一个 API 密钥访问多个大语言模型
    - 你想通过 OpenRouter 在 OpenClaw 中运行模型
    - 你想使用 OpenRouter 进行图像生成
    - 你想使用 OpenRouter 进行视频生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T21:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一个**统一 API**，可以通过单一端点和 API key 将请求路由到多个模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

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
模型引用遵循 `openrouter/<provider>/<model>` 模式。如需查看可用提供商和模型的完整列表，请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用                          | 说明                         |
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

OpenClaw 会将图像请求发送到 OpenRouter 的聊天补全图像 API，并带上 `modalities: ["image", "text"]`。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对于较慢的 OpenRouter 图像模型，请使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具的单次调用 `timeoutMs` 参数仍然优先。

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

OpenClaw 会向 OpenRouter 提交文生视频和图生视频任务，轮询返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或已记录的任务内容端点下载已完成的视频。参考图像默认会作为首帧/末帧图像发送；标记为 `reference_image` 的图像会作为 OpenRouter 输入引用发送。内置的 `google/veo-3.1-fast` 默认值声明当前支持 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及 `16:9`/`9:16` 宽高比。OpenRouter 未注册视频到视频，因为上游视频生成 API 目前接受文本和图像引用。

## 文本转语音

OpenRouter 也可以通过其与 OpenAI 兼容的 `/audio/speech` 端点用作 TTS 提供商。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会复用 `models.providers.openrouter.apiKey`，然后使用 `OPENROUTER_API_KEY`。

## 身份验证和标头

OpenRouter 底层使用带有你的 API key 的 Bearer token。

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）中，OpenClaw 还会添加 OpenRouter 文档中记录的应用归因标头：

| 标头                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你将 OpenRouter provider 指向其他代理或 base URL，OpenClaw **不会**注入这些 OpenRouter 特定标头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="响应缓存">
    OpenRouter 响应缓存需要显式启用。使用模型参数为每个 OpenRouter 模型启用：

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

    OpenClaw 会发送 `X-OpenRouter-Cache: true`，并在配置后发送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 会强制刷新当前请求并存储替换后的响应。也接受 snake_case 别名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    这独立于提供商提示词缓存，也独立于 OpenRouter 的 Anthropic `cache_control` 标记。它只会应用于已验证的 `openrouter.ai` 路由，而不会应用于自定义代理 base URL。

  </Accordion>

  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenClaw 用于在系统/开发者提示词块上更好复用提示词缓存的 OpenRouter 特定 Anthropic `cache_control` 标记。
  </Accordion>

  <Accordion title="Anthropic reasoning 预填充">
    在已验证的 OpenRouter 路由上，启用 reasoning 的 Anthropic 模型引用会在请求到达 OpenRouter 之前丢弃末尾的 assistant 预填充轮次，以符合 Anthropic 要求 reasoning 对话以 user 轮次结束的规则。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将选定的 thinking 级别映射到 OpenRouter 代理 reasoning 载荷。不受支持的模型提示和 `openrouter/auto` 会跳过该 reasoning 注入。Hunter Alpha 也会对过时配置的模型引用跳过代理 reasoning，因为 OpenRouter 可能会在该已退役路由的 reasoning 字段中返回最终答案文本。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning 重放">
    在已验证的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 会在重放的 assistant 轮次上填充缺失的 `reasoning_content`，让 thinking/tool 对话保持 DeepSeek V4 所需的后续形态。OpenClaw 会为这些路由发送 OpenRouter 支持的 `reasoning_effort` 值；`xhigh` 是声明的最高级别，过时的 `max` 覆盖值会映射到 `xhigh`。
  </Accordion>

  <Accordion title="仅限 OpenAI 的请求塑形">
    OpenRouter 仍然通过代理式的 OpenAI 兼容路径运行，因此不会转发原生仅限 OpenAI 的请求塑形，例如 `serviceTier`、Responses `store`、OpenAI reasoning 兼容载荷和提示词缓存提示。
  </Accordion>

  <Accordion title="Gemini 后端路由">
    Gemini 后端的 OpenRouter 引用会保留在代理 Gemini 路径上：OpenClaw 会在那里保留 Gemini 思维签名清理，但不会启用原生 Gemini 重放验证或 bootstrap 重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    如果你在模型参数下传入 OpenRouter 提供商路由，OpenClaw 会在共享流包装器运行前将其作为 OpenRouter 路由元数据转发。
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
