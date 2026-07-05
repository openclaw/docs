---
read_when:
    - 你想用一个 API key 访问多个 LLMs
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
    - 你想使用 OpenRouter 生成图像
    - 你想使用 OpenRouter 进行音乐生成
    - 你想使用 OpenRouter 进行视频生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多个模型
title: OpenRouter
x-i18n:
    generated_at: "2026-07-05T11:38:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e500fa78c096a5d16d7099d12a4e96659f15e44be09c3ad6dfcbafdb5f6827fb
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter 将请求路由到一个 API 和一个密钥背后的多个模型。它兼容 OpenAI，因此 OpenClaw 通过与其他代理提供商相同的 `openai-completions` 风格传输与它通信。

## 入门指南

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="运行 OAuth 新手引导">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw 会打开 OpenRouter 的浏览器登录流程（PKCE），将代码交换为 OpenRouter API 密钥，并将其存储在默认的 OpenRouter 凭证配置文件中。在远程/无头主机上，OpenClaw 会打印登录 URL，并要求你在登录后粘贴重定向 URL。
      </Step>
      <Step title="（可选）切换到特定模型">
        新手引导默认使用 `openrouter/auto`。稍后选择一个具体模型：

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API 密钥">
    <Steps>
      <Step title="获取你的 API 密钥">
        在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API 密钥。
      </Step>
      <Step title="运行 API 密钥新手引导">
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
模型引用遵循 `openrouter/<provider>/<model>` 模式。可用提供商和模型的完整列表，请参见 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

当实时目录发现不可用时使用的内置回退模型：

| 模型引用                          | 说明                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由          |
| `openrouter/moonshotai/kimi-k2.6` | 通过 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 通过 MoonshotAI 使用 Kimi K2.5 |

任何其他 `openrouter/<provider>/<model>` 引用，包括 `openrouter/openrouter/fusion`（见 [Fusion 路由器](#fusion-router)），都会根据 OpenRouter 的实时模型目录动态解析。

## 图像生成

OpenRouter 可以支持 `image_generate` 工具。在 `agents.defaults.imageGenerationModel` 下设置一个 OpenRouter 图像模型：

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

OpenClaw 使用 `modalities: ["image", "text"]` 将图像请求发送到 OpenRouter 的 chat-completions 图像 API。Gemini 图像模型还会通过 OpenRouter 的 `image_config` 接收 `aspectRatio` 和 `resolution` 提示；其他图像模型不会。对较慢的模型使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具的单次调用 `timeoutMs` 仍然优先生效。

## 视频生成

OpenRouter 可以通过它的异步 `/videos` API 支持 `video_generate` 工具。在 `agents.defaults.videoGenerationModel` 下设置一个 OpenRouter 视频模型：

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

OpenClaw 提交文生视频和图生视频任务，轮询返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或任务内容端点下载完成的视频。参考图像默认作为首帧/末帧图像；标记为 `reference_image` 的图像会改作为输入参考发送。内置的 `google/veo-3.1-fast` 默认支持 4/6/8 秒时长、`720P`/`1080P` 分辨率，以及 `16:9`/`9:16` 宽高比。不支持视频转视频：上游 API 只接受文本和图像参考。

## 音乐生成

OpenRouter 可以通过 chat-completions 音频输出支持 `music_generate` 工具。在 `agents.defaults.musicGenerationModel` 下设置一个 OpenRouter 音频模型：

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

内置 OpenRouter 音乐提供商默认使用 `google/lyria-3-pro-preview`，并且还公开 `google/lyria-3-clip-preview`。OpenClaw 发送 `modalities:
["text", "audio"]`，流式接收响应，收集音频分块，并将结果保存为生成媒体以供渠道交付。Lyria 模型通过共享的 `music_generate image=...` 参数接受一张参考图像。

## 文本转语音

OpenRouter 可以通过兼容 OpenAI 的 `/audio/speech` 端点充当 TTS 提供商。

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

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会回退到 `models.providers.openrouter.apiKey`，然后是 `OPENROUTER_API_KEY`。

## 语音转文本（入站音频）

OpenRouter 可以通过共享的 `tools.media.audio` 路径，使用它的 STT 端点（`/audio/transcriptions`）转录入站语音/音频附件。这适用于任何会将入站语音/音频转发到媒体理解预检的渠道插件。

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

OpenClaw 将 OpenRouter STT 请求作为 JSON 发送，并在 `input_audio` 下放置 base64 音频（OpenRouter 的 STT 合约），而不是作为 multipart OpenAI 表单上传。

## Fusion 路由器

OpenRouter Fusion 将一个 OpenClaw 模型引用并行发送到多个 OpenRouter 模型，让 OpenRouter 评判它们的答案，并通过正常的 OpenRouter 端点返回一个最终响应。上游模型 slug 是 `openrouter/fusion`，因此 OpenClaw 模型引用同时带有 OpenClaw 提供商前缀和上游 OpenRouter 命名空间：

```bash
openclaw models set openrouter/openrouter/fusion
```

通过模型的 `params.extraBody` 配置 Fusion 的面板和评判模型；这些字段会直接转发到 OpenRouter chat-completions 请求正文中。Fusion 可配合 OAuth 或 API 密钥新手引导使用；如果你使用 OAuth，请省略下面的 `env.OPENROUTER_API_KEY` 行。

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

`analysis_models` 是并行面板；Fusion 插件配置中的 `model` 是评判模型。不要在普通智能体/聊天轮次中将顶层 `tool_choice` 设置为 `"required"` 来尝试强制使用 Fusion：OpenClaw 轮次可能包含自己的工具定义，而顶层必选工具选择可能会选择这些工具之一，而不是 Fusion 路由器。当存在此 Fusion 插件配置时，OpenClaw 会添加一条经过清理的系统提示说明，列出已配置的分析模型和评判模型，使智能体能够回答关于自身 Fusion 面板的问题。其他 `extraBody` 字段不会复制到提示中。

Fusion 设计上更慢：OpenRouter 会将提示分发给多个分析模型，然后运行评判/综合步骤，因此延迟高于直接的单模型请求。将它用于需要审慎、高质量答案或升级路径的场景，而不是作为对延迟敏感的默认值。保持面板较小，并选择更快的分析/评判模型以获得更快响应。

使用一次性本地调用测试已配置的引用：

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 身份验证和请求头

OpenRouter 使用来自你的 API 密钥的 Bearer 令牌。OpenRouter OAuth 是一个会颁发 OpenRouter API 密钥的 PKCE 登录流程，因此 OpenClaw 会将结果存储在手动 API 密钥设置使用的同一个 `openrouter:default` API 密钥凭证配置文件中。

若要在现有安装上登录或轮换已存储的密钥，而不重新运行完整新手引导：

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

在已验证的 OpenRouter 请求（`https://openrouter.ai/api/v1`）上，OpenClaw 会添加 OpenRouter 文档化的应用归属请求头：

| 请求头                    | 值                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果你将 OpenRouter 提供商指向其他代理或基础 URL，OpenClaw **不会** 注入这些 OpenRouter 专用请求头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="响应缓存">
    OpenRouter 响应缓存是选择启用的。按模型启用它：

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

    OpenClaw 会发送 `X-OpenRouter-Cache: true`，并在配置时发送 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 会强制刷新当前请求并存储替换响应。接受 snake_case 别名（`response_cache`、`response_cache_ttl_seconds`、`response_cache_clear`），也接受不带 `Seconds` 后缀的 `responseCacheTtl` / `response_cache_ttl`。

    这与提供商提示缓存以及 OpenRouter 的 Anthropic `cache_control` 标记是分开的。它只适用于已验证的 `openrouter.ai` 路由，不适用于自定义代理基础 URL。

  </Accordion>

  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenRouter 的 Anthropic `cache_control` 标记，以便在系统/开发者提示块上更好地复用提示缓存。
  </Accordion>

  <Accordion title="Anthropic reasoning 预填充">
    在已验证的 OpenRouter 路由上，启用 reasoning 的 Anthropic 模型引用会在请求到达 OpenRouter 之前删除尾随的 assistant 预填充轮次，以匹配 Anthropic 关于 reasoning 对话必须以用户轮次结束的要求。
  </Accordion>

  <Accordion title="思考 / 推理注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将选定的思考级别映射到
    OpenRouter 代理推理载荷。`openrouter/auto` 和不受支持的
    模型提示会跳过该注入。过时的 `openrouter/hunter-alpha` 引用也会
    跳过它，因为 OpenRouter 可能会在该已停用路由的推理
    字段中返回最终答案文本。
  </Accordion>

  <Accordion title="DeepSeek V4 推理重放">
    在已验证的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和
    `openrouter/deepseek/deepseek-v4-pro` 会在重放的助手轮次中填充缺失的 `reasoning_content`，
    从而保持思考/工具对话符合 DeepSeek
    V4 所需的后续形态。OpenClaw 会为这些路由发送 OpenRouter 支持的
    `reasoning.effort` 值：`xhigh`/`max` 映射到 `xhigh`，
    其他所有非关闭级别都映射到 `high`。
  </Accordion>

  <Accordion title="仅限 OpenAI 的请求成形">
    OpenRouter 通过代理式 OpenAI 兼容路径运行，因此不会转发
    仅限原生 OpenAI 的请求成形，例如 `serviceTier`、Responses `store`、
    OpenAI 推理兼容载荷和提示缓存提示。
  </Accordion>

  <Accordion title="Gemini 支持的路由">
    Gemini 支持的 OpenRouter 引用会停留在代理 Gemini 路径上：OpenClaw 会在那里保留
    Gemini 思考签名清理，但不会启用原生
    Gemini 重放验证或引导重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    OpenRouter 支持用于底层提供商
    路由的 `provider` 请求对象。使用 `models.providers.openrouter.params.provider`
    为所有 OpenRouter 文本模型请求配置默认策略：

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

    OpenClaw 会将该对象作为请求 `provider`
    载荷转发给 OpenRouter。使用 OpenRouter 文档中记录的 snake_case 字段，包括 `sort`、
    `only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr` 和 `enforce_distillable_text`。

    每模型参数会覆盖提供商范围的路由对象：

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

    这只适用于 OpenRouter chat-completions 路由。直接 Anthropic、
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
