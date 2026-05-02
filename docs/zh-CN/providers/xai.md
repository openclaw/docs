---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 凭证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-05-02T02:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 随附内置的 `xai` 提供商插件，用于 Grok 模型。

## 入门指南

<Steps>
  <Step title="创建 API key">
    在 [xAI 控制台](https://console.x.ai/)中创建 API key。
  </Step>
  <Step title="设置你的 API key">
    设置 `XAI_API_KEY`，或运行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="选择模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输协议。同一个
`XAI_API_KEY` 还可以驱动基于 Grok 的 `web_search`、一等 `x_search`
和远程 `code_execution`。
如果你在 `plugins.entries.xai.config.webSearch.apiKey` 下存储 xAI key，
内置 xAI 模型提供商也会将该 key 作为回退复用。
设置 `plugins.entries.xai.config.webSearch.baseUrl`，可将 Grok `web_search`
以及默认情况下的 `x_search` 路由到操作方的 xAI Responses 代理。
`code_execution` 调优位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## 内置目录

OpenClaw 开箱即包含这些 xAI 模型系列：

| 系列           | 模型 id                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

当新的 `grok-4*` 和 `grok-code-fast*` id 遵循相同 API 形态时，
该插件也会前向解析这些 id。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast` 和 `grok-4.20-beta-*`
变体是内置目录中当前支持图像的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖范围

内置插件会将 xAI 当前的公开 API 表面映射到 OpenClaw 的共享
提供商和工具契约。不适配共享契约的能力
（例如流式 TTS 和实时语音）不会暴露；见下表。

| xAI 能力                  | OpenClaw 表面                             | Status                                                              |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses          | `xai/<model>` 模型提供商                  | 是                                                                  |
| 服务端 Web 搜索           | `web_search` 提供商 `grok`                | 是                                                                  |
| 服务端 X 搜索             | `x_search` 工具                           | 是                                                                  |
| 服务端代码执行            | `code_execution` 工具                     | 是                                                                  |
| 图像                      | `image_generate`                          | 是                                                                  |
| 视频                      | `video_generate`                          | 是                                                                  |
| 批量文本转语音            | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| 流式 TTS                  | —                                         | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区                      |
| 批量语音转文本            | `tools.media.audio` / 媒体理解            | 是                                                                  |
| 流式语音转文本            | Voice Call `streaming.provider: "xai"`    | 是                                                                  |
| 实时语音                  | —                                         | 暂未暴露；使用不同的会话/WebSocket 契约                             |
| 文件 / 批处理             | 仅通用模型 API 兼容性                     | 不是一等 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成、
语音和批量转录，使用 xAI 的流式 STT WebSocket 进行实时
语音通话转录，并使用 Responses API 进行模型、搜索和
代码执行工具。需要不同 OpenClaw 契约的功能，例如
实时语音会话，在此作为上游能力记录，而不是隐藏的插件行为。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会按如下方式重写原生 xAI 请求：

| 源模型        | 快速模式目标       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容别名

旧版别名仍会归一化为规范的内置 id：

| 旧版别名                  | 规范 id                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置 `grok` Web 搜索提供商也使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置 `xai` 插件通过共享的
    `video_generate` 工具注册视频生成。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文本转视频、图像转视频、参考图像生成、远程
      视频编辑和远程视频扩展
    - 纵横比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图像转视频为 1-15 秒，使用
      `reference_image` 角色时为 1-10 秒，扩展为 2-10 秒
    - 参考图像生成：将每个提供的图像的 `imageRoles` 设置为
      `reference_image`；xAI 最多接受 7 张此类图像

    <Warning>
    不接受本地视频缓冲区。视频编辑/扩展输入请使用远程 `http(s)` URL。
    图像转视频接受本地图像缓冲区，因为 OpenClaw 可以将其编码为
    xAI 的数据 URL。
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
    有关共享工具参数、提供商选择和故障转移行为，请参阅[视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置 `xai` 插件通过共享的
    `image_generate` 工具注册图像生成。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-pro`
    - 模式：文本转图像和参考图像编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 纵横比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 向 xAI 请求 `b64_json` 图像响应，以便生成的媒体可以通过
    常规渠道附件路径存储和交付。本地参考图像会转换为数据 URL；远程
    `http(s)` 引用会原样传递。

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
    xAI 还记录了 `quality`、`mask`、`user`，以及其他原生比例，
    例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 目前只转发
    共享的跨提供商图像控制项；不受支持的原生专用旋钮会有意不通过
    `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置 `xai` 插件通过共享的 `tts`
    提供商表面注册文本转语音。

    - 语音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认语音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 语速：提供商原生语速覆盖
    - 不支持原生 Opus 语音备注格式

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
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也通过 WebSocket
    提供流式 TTS，但 OpenClaw 语音提供商契约目前要求在交付回复前
    获得完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `xai` 插件通过 OpenClaw 的
    媒体理解转录表面注册批量语音转文本。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - OpenClaw 中凡是入站音频转录使用 `tools.media.audio` 的地方都支持，
      包括 Discord 语音渠道片段和渠道音频附件

    要强制 xAI 用于入站音频转录：

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

    语言可以通过共享音频媒体配置或逐次调用的转录请求提供。共享的 OpenClaw
    表面接受提示词提示，但 xAI REST STT 集成只转发文件、模型和
    语言，因为这些可以清晰映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置 `xai` 插件还为实时语音通话音频注册了实时转录提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 临时转录：默认启用

    Voice Call 的 Twilio 媒体流发送 G.711 µ-law 音频帧，因此
    xAI 提供商可以直接转发这些帧，无需转码：

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

    Provider 拥有的配置位于
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的
    键名包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    这个流式 provider 用于 Voice Call 的实时转录路径。
    Discord 语音目前会录制短片段，并改用批处理
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，用于通过 Grok 搜索
    X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键名               | 类型    | 默认值             | 描述                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | 启用或禁用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用于 x_search 请求的模型             |
    | `baseUrl`          | string  | —                  | xAI Responses 基础 URL 覆盖值        |
    | `inlineCitations`  | boolean | —                  | 在结果中包含内联引用                 |
    | `maxTurns`         | number  | —                  | 最大对话轮数                         |
    | `timeoutSeconds`   | number  | —                  | 请求超时时间（秒）                   |
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
                baseUrl: "https://api.x.ai/v1",
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
    内置 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，用于在 xAI 的沙箱环境中进行
    远程代码执行。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键名              | 类型    | 默认值                   | 描述                                 |
    | ----------------- | ------- | ------------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true`（如果键可用）     | 启用或禁用代码执行                   |
    | `model`           | string  | `grok-4-1-fast`          | 用于代码执行请求的模型               |
    | `maxTurns`        | number  | —                        | 最大对话轮数                         |
    | `timeoutSeconds`  | number  | —                        | 请求超时时间（秒）                   |

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
    - 目前 Auth 仅支持 API key。OpenClaw 尚未提供 xAI OAuth 或设备代码流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 在常规 xAI provider 路径上不受支持，因为它需要的上游 API
      表面不同于标准 OpenClaw xAI 传输协议。
    - xAI Realtime 语音尚未注册为 OpenClaw provider。它需要一种不同于批处理 STT 或
      流式转录的双向语音会话契约。
    - xAI 图像 `quality`、图像 `mask` 和额外的仅原生纵横比
      在共享 `image_generate` 工具具备相应的跨 provider 控制项之前不会公开。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享 runner 路径上自动应用 xAI 专用的工具 schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false` 可将其禁用。
    - 内置 xAI wrapper 会在发送原生 xAI 请求之前移除不受支持的严格工具 schema 标志和
      reasoning payload 键。
    - `web_search`、`x_search` 和 `code_execution` 会作为 OpenClaw
      工具公开。OpenClaw 会在每个工具请求中启用它所需的特定 xAI 内置能力，而不是将所有原生工具附加到每一轮聊天。
    - Grok `web_search` 读取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 读取 `plugins.entries.xai.config.xSearch.baseUrl`，然后
      回退到 Grok Web 搜索基础 URL。
    - `x_search` 和 `code_execution` 由内置 xAI 插件拥有，
      而不是硬编码到核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和可选择启用的实时测试套件覆盖。实时
命令会先从你的登录 shell（包括 `~/.profile`）加载密钥，然后再
探测 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

provider 专用实时文件会合成常规 TTS、适合电话语音的 PCM
TTS，通过 xAI 批处理 STT 转录音频，通过 xAI
实时 STT 流式传输同一段 PCM，生成文生图输出，并编辑参考图像。共享图像实时文件会通过 OpenClaw 的
运行时选择、回退、规范化和媒体附件路径验证同一个 xAI provider。

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和 provider 选择。
  </Card>
  <Card title="所有 provider" href="/zh-CN/providers/index" icon="grid-2">
    更广泛的 provider 概览。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
