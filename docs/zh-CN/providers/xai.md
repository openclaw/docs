---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 身份验证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-05-02T01:45:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9366d6a053fb515d843bbb984ee0fce2eb342a022a6d9aa60df983fc0f8d5745
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 内置了一个用于 Grok 模型的 `xai` 提供商插件。

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
OpenClaw 使用 xAI Responses API 作为内置的 xAI 传输协议。同一个
`XAI_API_KEY` 也可以驱动由 Grok 支持的 `web_search`、一等 `x_search`
以及远程 `code_execution`。
如果你在 `plugins.entries.xai.config.webSearch.apiKey` 下存储 xAI key，
内置的 xAI 模型提供商也会复用该 key 作为回退。
`code_execution` 调优位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## 内置目录

OpenClaw 开箱即包含这些 xAI 模型系列：

| 系列           | 模型 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

当较新的 `grok-4*` 和 `grok-code-fast*` ID 遵循相同 API 形态时，该插件也会
向前解析它们。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast` 以及 `grok-4.20-beta-*`
变体是内置目录中当前支持图像能力的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖范围

内置插件会将 xAI 当前的公开 API 表面映射到 OpenClaw 共享的
提供商和工具契约上。不适合共享契约的能力
（例如流式 TTS 和实时语音）不会暴露，请参见下表。

| xAI 能力                   | OpenClaw 表面                             | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供商                  | 是                                                                  |
| 服务端网页搜索             | `web_search` 提供商 `grok`               | 是                                                                  |
| 服务端 X 搜索              | `x_search` 工具                           | 是                                                                  |
| 服务端代码执行             | `code_execution` 工具                     | 是                                                                  |
| 图像                       | `image_generate`                          | 是                                                                  |
| 视频                       | `video_generate`                          | 是                                                                  |
| 批量文本转语音             | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| 流式 TTS                   | —                                         | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区                     |
| 批量语音转文本             | `tools.media.audio` / 媒体理解            | 是                                                                  |
| 流式语音转文本             | Voice Call `streaming.provider: "xai"`    | 是                                                                  |
| 实时语音                   | —                                         | 尚未暴露；使用不同的会话/WebSocket 契约                            |
| 文件 / 批处理              | 仅通用模型 API 兼容性                     | 不是一等 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成、
语音和批量转录，使用 xAI 的流式 STT WebSocket 进行实时
语音通话转录，并使用 Responses API 处理模型、搜索和
代码执行工具。需要不同 OpenClaw 契约的功能，例如
实时语音会话，在此记录为上游能力，而不是隐藏的插件行为。
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

旧版别名仍会规范化为内置的规范 ID：

| 旧版别名                  | 规范 ID                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="网页搜索">
    内置的 `grok` 网页搜索提供商也使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` 插件通过共享的
    `video_generate` 工具注册视频生成。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文本转视频、图像转视频、参考图像生成、远程
      视频编辑和远程视频延展
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图像转视频为 1-15 秒，使用 `reference_image` 角色时为 1-10 秒，
      延展为 2-10 秒
    - 参考图像生成：为每张提供的图像将 `imageRoles` 设置为 `reference_image`；
      xAI 最多接受 7 张此类图像

    <Warning>
    不接受本地视频缓冲区。视频编辑/延展输入请使用远程 `http(s)` URL。
    图像转视频接受本地图像缓冲区，因为 OpenClaw 可以将它们编码为供 xAI 使用的数据 URL。
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
    参见[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、
    提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置的 `xai` 插件通过共享的
    `image_generate` 工具注册图像生成。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-pro`
    - 模式：文生图和参考图像编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 会向 xAI 请求 `b64_json` 图像响应，以便生成的媒体可以通过
    常规渠道附件路径存储和投递。本地参考图像会转换为 data URL；远程
    `http(s)` 参考会原样传递。

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
    例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 目前只转发
    跨提供商共享的图像控制项；不支持的仅原生旋钮会有意不通过
    `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享的 `tts`
    提供商表面注册文本转语音。

    - 语音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认语音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：提供商原生速度覆盖
    - 不支持原生 Opus 语音留言格式

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
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也提供通过 WebSocket
    进行的流式 TTS，但 OpenClaw 语音提供商契约目前要求在投递回复前
    获得完整的音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的
    媒体理解转写表面注册批量语音转文本。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转写使用
      `tools.media.audio`，就支持该功能，包括 Discord 语音渠道片段和
      渠道音频附件

    要强制将 xAI 用于入站音频转写：

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

    语言可以通过共享音频媒体配置或按调用的转写请求提供。共享的 OpenClaw
    表面接受提示提示词，但 xAI REST STT 集成只转发文件、模型和语言，
    因为这些可以清晰映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时语音通话音频注册了实时转写提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 临时转写结果：默认启用

    Voice Call 的 Twilio 媒体流会发送 G.711 µ-law 音频帧，因此
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

    提供商自有配置位于
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的
    键为 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此流式传输提供商用于语音通话的实时转录路径。
    Discord 语音目前会录制短片段，并改用批量
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，用于通过 Grok 搜索
    X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键                | 类型    | 默认值            | 描述                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | 启用或停用 x_search           |
    | `model`            | string  | `grok-4-1-fast`    | 用于 x_search 请求的模型     |
    | `inlineCitations`  | boolean | —                  | 在结果中包含内联引用  |
    | `maxTurns`         | number  | —                  | 最大对话轮数           |
    | `timeoutSeconds`   | number  | —                  | 请求超时时间（秒）           |
    | `cacheTtlMinutes`  | number  | —                  | 缓存生存时间（分钟）        |

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
    内置 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，用于在 xAI 的沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键               | 类型    | 默认值            | 描述                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true`（如果密钥可用） | 启用或停用代码执行  |
    | `model`           | string  | `grok-4-1-fast`    | 用于代码执行请求的模型   |
    | `maxTurns`        | number  | —                  | 最大对话轮数               |
    | `timeoutSeconds`  | number  | —                  | 请求超时时间（秒）               |

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
    - 目前身份验证仅支持 API key。OpenClaw 尚无 xAI OAuth 或设备代码流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 不支持普通 xAI 提供商路径，因为它需要与标准 OpenClaw xAI 传输不同的上游 API 表面。
    - xAI Realtime 语音尚未注册为 OpenClaw 提供商。它需要与批量 STT 或流式转录不同的双向语音会话契约。
    - 在共享 `image_generate` 工具具备对应的跨提供商控制项之前，不会公开 xAI 图像 `quality`、图像 `mask` 以及额外的仅原生宽高比。

  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享 runner 路径上自动应用 xAI 专用的工具 schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false` 可停用它。
    - 内置 xAI 包装器会在发送原生 xAI 请求之前，移除不支持的严格工具 schema 标志和推理载荷键。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw 工具公开。OpenClaw 会在每个工具请求中启用所需的具体 xAI 内置能力，而不是把所有原生工具附加到每一轮聊天。
    - `x_search` 和 `code_execution` 归内置 xAI 插件所有，而不是硬编码到核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和可选择启用的实时套件覆盖。实时命令会先从你的登录 shell 加载密钥，包括 `~/.profile`，然后再探测 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用实时文件会合成普通 TTS、适合电话场景的 PCM TTS，通过 xAI 批量 STT 转录音频，通过 xAI 实时 STT 流式传输同一份 PCM，生成文生图输出，并编辑一张参考图像。共享图像实时文件会通过 OpenClaw 的运行时选择、回退、归一化和媒体附件路径验证同一个 xAI 提供商。

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
    常见问题和修复方法。
  </Card>
</CardGroup>
