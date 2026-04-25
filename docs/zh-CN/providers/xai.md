---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 认证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-04-25T17:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw 内置了一个用于 Grok 模型的 `xai` 提供商插件。

## 入门指南

<Steps>
  <Step title="创建 API 密钥">
    在 [xAI 控制台](https://console.x.ai/) 中创建一个 API 密钥。
  </Step>
  <Step title="设置你的 API 密钥">
    设置 `XAI_API_KEY`，或运行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="选择一个模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 将 xAI Responses API 用作内置 xAI 传输层。同一个
`XAI_API_KEY` 也可以为由 Grok 支持的 `web_search`、一等公民的 `x_search`
以及远程 `code_execution` 提供能力。
如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，
内置的 xAI 模型提供商也会将该密钥复用为回退密钥。
`code_execution` 的调优配置位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## 内置目录

OpenClaw 开箱即用包含以下 xAI 模型家族：

| Family         | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

当新的 `grok-4*` 和 `grok-code-fast*` ID 遵循相同的 API 形状时，
该插件也会转发解析这些较新的 ID。

<Tip>
`grok-4-fast`、`grok-4-1-fast` 和 `grok-4.20-beta-*` 变体是内置目录中
当前支持图像能力的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖范围

内置插件将 xAI 当前公开的 API 表面映射到 OpenClaw 的共享提供商和工具 contract 上。不适合共享 contract 的能力
（例如流式 TTS 和实时语音）不会暴露出来 —— 见下表。

| xAI capability             | OpenClaw surface                          | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` model provider              | 是                                                                  |
| Server-side web search     | `web_search` provider `grok`              | 是                                                                  |
| Server-side X search       | `x_search` tool                           | 是                                                                  |
| Server-side code execution | `code_execution` tool                     | 是                                                                  |
| Images                     | `image_generate`                          | 是                                                                  |
| Videos                     | `video_generate`                          | 是                                                                  |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| Streaming TTS              | —                                         | 未暴露；OpenClaw 的 TTS contract 会返回完整音频缓冲区 |
| Batch speech-to-text       | `tools.media.audio` / media understanding | 是                                                                  |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | 是                                                                  |
| Realtime voice             | —                                         | 尚未暴露；需要不同的 session/WebSocket contract |
| Files / batches            | Generic model API compatibility only      | 不是 OpenClaw 的一等工具 |

<Note>
OpenClaw 将 xAI 的 REST 图像/视频/TTS/STT API 用于媒体生成、
语音和批量转写，将 xAI 的流式 STT WebSocket 用于实时语音通话转写，
并将 Responses API 用于模型、搜索和代码执行工具。那些需要不同 OpenClaw
contract 的功能，例如 Realtime 语音会话，会在这里作为上游能力记录，
而不是作为隐藏的插件行为。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会按如下方式重写原生 xAI 请求：

| Source model  | Fast-mode target   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容别名

旧版别名仍会规范化为标准的内置 ID：

| Legacy alias              | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索提供商也使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` 插件通过共享的
    `video_generate` 工具注册视频生成功能。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：text-to-video、image-to-video、reference-image generation、remote
      video edit 和 remote video extension
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：generation/image-to-video 为 1-15 秒，使用
      `reference_image` 角色时为 1-10 秒，extension 为 2-10 秒
    - 参考图像生成：对每张提供的图像都将 `imageRoles` 设置为 `reference_image`；
      xAI 最多接受 7 张此类图像

    <Warning>
    不接受本地视频缓冲区。对于视频编辑/扩展输入，请使用远程 `http(s)` URL。
    image-to-video 接受本地图像缓冲区，因为 OpenClaw 可以将其编码为 xAI 可用的 data URL。
    </Warning>

    要将 xAI 用作默认视频提供商：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    共享工具参数、提供商选择和故障转移行为请参见
    [视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置的 `xai` 插件通过共享的
    `image_generate` 工具注册图像生成功能。

    - 默认图像模型：`xai/grok-imagine-image`
    - 额外模型：`xai/grok-imagine-image-pro`
    - 模式：text-to-image 和 reference-image edit
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 会向 xAI 请求 `b64_json` 图像响应，以便生成的媒体可以通过正常的渠道附件路径存储和发送。
    本地参考图像会被转换为 data URL；远程 `http(s)` 参考会直接透传。

    要将 xAI 用作默认图像提供商：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI 还记录了 `quality`、`mask`、`user` 以及其他原生比例，
    例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 当前只转发
    跨提供商共享的图像控制项；不受支持的原生专属旋钮有意不通过
    `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享的 `tts`
    提供商表面注册文本转语音功能。

    - 语音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认语音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：提供商原生速度覆盖项
    - 不支持原生 Opus 语音便笺格式

    要将 xAI 用作默认 TTS 提供商：

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也提供基于 WebSocket 的流式 TTS，
    但 OpenClaw 的语音提供商 contract 当前要求在回复发送前先得到完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的
    media-understanding 转写表面注册批量语音转文本功能。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转写使用
      `tools.media.audio` 的地方都支持，包括 Discord 语音频道片段
      和渠道音频附件

    要强制对入站音频转写使用 xAI：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    语言可以通过共享音频媒体配置或按调用的转写请求提供。提示词提示也被共享的 OpenClaw
    表面接受，但 xAI REST STT 集成目前只会转发 file、model 和
    language，因为这些能与当前公开的 xAI 端点清晰对应。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时语音通话音频注册了一个 realtime
    转写提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认断句：`800ms`
    - 默认启用中间转写结果

    Voice Call 的 Twilio 媒体流会发送 G.711 µ-law 音频帧，因此
    xAI 提供商可以直接转发这些帧而无需转码：

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    提供商自有配置位于
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的
    键包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    这个流式提供商用于 Voice Call 的实时转写路径。
    Discord 语音当前会记录短片段，并改用批量
    `tools.media.audio` 转写路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置的 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，用于通过 Grok 搜索
    X（前身为 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | 启用或禁用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用于 x_search 请求的模型             |
    | `inlineCitations`  | boolean | —                  | 在结果中包含内联引用                 |
    | `maxTurns`         | number  | —                  | 最大对话轮数                         |
    | `timeoutSeconds`   | number  | —                  | 请求超时秒数                         |
    | `cacheTtlMinutes`  | number  | —                  | 缓存存活时间（分钟）                 |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="代码执行配置">
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，用于在 xAI 的
    沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default            | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (if key available) | 启用或禁用代码执行               |
    | `model`           | string  | `grok-4-1-fast`    | 用于代码执行请求的模型                   |
    | `maxTurns`        | number  | —                  | 最大对话轮数                             |
    | `timeoutSeconds`  | number  | —                  | 请求超时秒数                             |

    <Note>
    这是远程 xAI 沙箱执行，不是本地 [`exec`](/zh-CN/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - 当前认证仅支持 API 密钥。OpenClaw 目前还不支持 xAI OAuth 或 device-code 流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 在常规 xAI 提供商路径中不受支持，
      因为它需要与标准 OpenClaw xAI 传输不同的上游 API 表面。
    - xAI Realtime 语音尚未注册为 OpenClaw 提供商。它需要与批量 STT 或
      流式转写不同的双向语音会话 contract。
    - xAI 图像 `quality`、图像 `mask` 以及额外的原生专属宽高比
      目前尚未公开，需等共享 `image_generate` 工具具备相应的跨提供商控制项后才会支持。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享 runner 路径上自动应用 xAI 专用的工具 schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。设置
      `agents.defaults.models["xai/<model>"].params.tool_stream` 为 `false` 可禁用它。
    - 内置的 xAI 包装器会在发送原生 xAI 请求之前，移除不受支持的严格工具 schema 标志和
      reasoning 负载键。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw
      工具公开。OpenClaw 会在每个工具请求中启用其所需的特定 xAI 内置能力，
      而不是在每次聊天轮次都附加全部原生工具。
    - `x_search` 和 `code_execution` 由内置 xAI 插件负责，
      而不是硬编码到 core 模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和按需启用的实时测试套件覆盖。实时命令会在探测
`XAI_API_KEY` 之前，从你的登录 shell 中加载密钥，包括 `~/.profile`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

特定提供商的实时测试文件会合成常规 TTS、适用于电话的 PCM
TTS、通过 xAI 批量 STT 转写音频、通过 xAI realtime STT
流式传输相同的 PCM、生成 text-to-image 输出，并编辑参考图像。共享图像实时测试文件会通过 OpenClaw 的
运行时选择、故障转移、规范化和媒体附件路径，验证同一个 xAI 提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="所有提供商" href="/zh-CN/providers/index" icon="grid-2">
    更广泛的提供商概览。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题与修复方法。
  </Card>
</CardGroup>
