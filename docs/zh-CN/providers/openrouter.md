---
read_when:
    - 你想用一个 API key 访问多个 LLMs
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
    - 你想使用 OpenRouter 进行图像生成
    - 你想使用 OpenRouter 进行音乐生成
    - 你想使用 OpenRouter 进行视频生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多个模型
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T03:08:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 提供一个**统一 API**，可通过单个端点和 API key 将请求路由到许多模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 入门指南

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="运行 OAuth 新手引导">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw 会打开 OpenRouter 的浏览器登录流程，将 PKCE
        代码交换为 OpenRouter API key，并将该 key 存储到默认的
        OpenRouter 凭证配置文件中。在远程或无头主机上，OpenClaw 会打印
        登录 URL，并要求你在登录后粘贴重定向 URL。
      </Step>
      <Step title="（可选）切换到特定模型">
        新手引导默认使用 `openrouter/auto`。之后可以选择一个具体模型：

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="获取你的 API key">
        在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API key。
      </Step>
      <Step title="运行 API key 新手引导">
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

  </Tab>
</Tabs>

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
模型引用遵循 `openrouter/<provider>/<model>` 模式。有关可用
提供商和模型的完整列表，请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用                          | 说明                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由          |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion 路由器     |
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

OpenClaw 会使用 `modalities: ["image", "text"]` 将图像请求发送到 OpenRouter 的 chat completions 图像 API。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。对较慢的 OpenRouter 图像模型，请使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具每次调用的 `timeoutMs` 参数仍然优先生效。

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

OpenClaw 会向 OpenRouter 提交文生视频和图生视频任务，轮询
返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或已记录的任务内容端点下载完成的视频。
默认情况下，参考图像会作为首帧或末帧图像发送；标记为
`reference_image` 的图像会作为 OpenRouter 输入引用发送。内置的
`google/veo-3.1-fast` 默认项声明当前支持 4/6/8
秒时长、`720P`/`1080P` 分辨率，以及 `16:9`/`9:16` 宽高比。
OpenRouter 未注册视频转视频，因为上游视频生成 API 目前接受文本和图像引用。

## 音乐生成

OpenRouter 也可以通过 chat completions
音频输出作为 `music_generate` 工具的后端。在
`agents.defaults.musicGenerationModel` 下使用 OpenRouter 音频模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

内置 OpenRouter 音乐提供商默认使用
`google/lyria-3-pro-preview`，并且还公开
`google/lyria-3-clip-preview`。OpenClaw 会发送 `modalities: ["text",
"audio"]`，启用流式传输，收集流式音频分块，并将
结果保存为生成媒体以便渠道投递。Lyria 模型可通过共享的
`music_generate image=...` 参数接受参考图像。

## 文本转语音

OpenRouter 也可以通过其 OpenAI 兼容的
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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会复用
`models.providers.openrouter.apiKey`，然后再使用 `OPENROUTER_API_KEY`。

## 语音转文本（入站音频）

OpenRouter 可以通过共享的 `tools.media.audio` 路径，使用其 STT 端点（`/audio/transcriptions`）转写入站语音或音频附件。
这适用于任何会将入站语音或音频转发到媒体理解预检的渠道插件。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw 会以 JSON 发送 OpenRouter STT 请求，并在
`input_audio` 下携带 base64 音频（OpenRouter STT 合约），而不是作为 multipart OpenAI 表单上传。

## Fusion 路由器

当你希望一个 OpenClaw 模型引用并行询问多个
OpenRouter 模型，让 OpenRouter 评判它们的答案，并通过普通 OpenRouter 提供商端点返回
单个最终响应时，请使用 OpenRouter Fusion。由于
上游模型 slug 是 `openrouter/fusion`，OpenClaw 模型引用同时包含
OpenClaw 提供商前缀和上游 OpenRouter 命名空间：

```bash
openclaw models set openrouter/openrouter/fusion
```

通过模型的 `params.extraBody` 配置 Fusion 的评审组和裁判。这些
字段会转发到 OpenRouter chat-completions 请求体中。Fusion
可配合 OpenRouter OAuth 新手引导或 API key 新手引导使用；如果你使用
OAuth，请从下面的示例中省略 `env.OPENROUTER_API_KEY` 行。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` 列表是并行评审组，Fusion
插件配置中的 `model` 是裁判模型。不要在普通 OpenClaw 智能体或聊天轮次中将顶层 `tool_choice` 设为
`"required"` 来尝试强制使用 Fusion；
OpenClaw 轮次可能包含 OpenClaw 工具定义，而顶层 required
工具选择可能会要求使用其中一个工具，而不是 Fusion 路由器。当
存在此 Fusion 插件配置时，OpenClaw 还会添加一条经过净化的
系统提示说明，其中包含已配置的分析模型和裁判模型，以便
智能体可以回答关于当前 Fusion 评审组的问题。其他 `extraBody`
字段不会复制到提示中。

Fusion 的设计目标就是更慢。OpenRouter 可能会将同一条 OpenClaw 提示发送给
多个分析模型，然后运行最终裁判或综合步骤，因此延迟
通常高于直接的单模型请求。请将 Fusion 用于审慎的
高质量回答或升级路径，而不是作为对延迟敏感聊天的默认选择。若要获得更快响应，请保持评审组规模较小，并选择
更快的分析模型和裁判模型。

使用一次性本地模型调用测试已配置的引用：

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 身份验证和标头

OpenRouter 底层使用带有你的 API key 的 Bearer token。OpenRouter
OAuth 是一种 PKCE 登录流程，会签发 OpenRouter API key，因此 OpenClaw 会将
结果存储为与手动 API key 设置路径相同的 `openrouter:default` API key 凭证配置文件。

对于现有安装，可以登录或轮换已存储的 OpenRouter key，而无需
重新运行完整新手引导：

```bash
openclaw models auth login --provider openrouter --method oauth
```

当你想粘贴在 OpenRouter 手动创建的 key 时，请使用 `openclaw models auth login --provider openrouter --method api-key`。

在真实 OpenRouter 请求（`https://openrouter.ai/api/v1`）中，OpenClaw 还会添加
OpenRouter 文档记录的应用归因标头：

| 标头                      | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你将 OpenRouter 提供商重新指向其他代理或 base URL，OpenClaw
**不会**注入这些 OpenRouter 专用标头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="响应缓存">
    OpenRouter 响应缓存是可选启用的。使用
    模型参数按 OpenRouter 模型启用：

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

    OpenClaw 会发送 `X-OpenRouter-Cache: true`，并在配置后发送
    `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 会强制刷新
    当前请求并存储替换响应。也接受 snake_case 别名
    （`response_cache`、`response_cache_ttl_seconds` 和
    `response_cache_clear`）。

    这与提供商提示缓存以及 OpenRouter 的
    Anthropic `cache_control` 标记相互独立。它仅应用于已验证的
    `openrouter.ai` 路由，而不是自定义代理 base URL。

  </Accordion>

  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留
    OpenRouter 专用的 Anthropic `cache_control` 标记，OpenClaw 使用这些标记来
    更好地复用系统或开发者提示块的提示缓存。
  </Accordion>

  <Accordion title="Anthropic 推理预填充">
    在已验证的 OpenRouter 路由上，启用推理的 Anthropic 模型引用会在请求到达 OpenRouter
    之前丢弃尾随的 assistant 预填充轮次，以匹配 Anthropic 要求推理对话以 user
    轮次结束的要求。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将所选思考级别映射到
    OpenRouter 代理推理载荷。不受支持的模型提示和
    `openrouter/auto` 会跳过该推理注入。Hunter Alpha 也会对过期配置的模型引用跳过
    代理推理，因为 OpenRouter 可能会在该退役路由的推理字段中返回最终答案文本。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重放">
    在已验证的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和
    `openrouter/deepseek/deepseek-v4-pro` 会在重放的 assistant 轮次中填充缺失的 `reasoning_content`，
    使思考/工具对话保持 DeepSeek V4 所需的后续形状。OpenClaw 会为这些路由发送 OpenRouter 支持的
    `reasoning_effort` 值；`xhigh` 是最高的已公布级别，过期的 `max` 覆盖会映射为 `xhigh`。
  </Accordion>

  <Accordion title="仅 OpenAI 的请求成形">
    OpenRouter 仍然走代理风格的 OpenAI 兼容路径，因此不会转发原生 OpenAI 专用的请求成形，
    例如 `serviceTier`、Responses `store`、OpenAI 推理兼容载荷以及提示缓存提示。
  </Accordion>

  <Accordion title="Gemini 后端路由">
    Gemini 后端的 OpenRouter 引用会保持在代理 Gemini 路径上：OpenClaw 会在那里保留
    Gemini 思考签名清理，但不会启用原生 Gemini 重放验证或引导重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    OpenRouter 支持用于底层提供商路由的 `provider` 请求对象。
    使用 `models.providers.openrouter.params.provider` 为所有 OpenRouter 文本模型请求
    配置默认策略：

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 会将该对象作为请求 `provider` 载荷转发给 OpenRouter。
    使用 OpenRouter 文档中记录的 snake_case 字段，包括 `sort`、`only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr` 和 `enforce_distillable_text`。

    单模型参数仍会覆盖提供商范围的路由对象：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    这仅适用于 OpenRouter chat-completions 路由。直接的 Anthropic、
    Google、OpenAI 或自定义提供商路由会忽略 OpenRouter 路由参数。

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
