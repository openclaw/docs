---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 凭证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-06-27T03:11:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70bffda0e91a409d5bd7c7887ab0369b6d70c23c4b6194fc706c78a0d2dd6ddb
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 内置提供一个用于 Grok 模型的 `xai` 提供商插件。对大多数用户来说，推荐路径是使用符合条件的 SuperGrok 或 X Premium 订阅进行 Grok OAuth。OpenClaw 保持本地优先：Gateway 网关、配置、路由和工具在你的机器上运行，而 Grok 模型请求通过 xAI 进行身份验证并发送到 xAI 的 API。

OAuth 不需要 xAI API key，也不需要 Grok Build 应用。xAI 可能仍会在授权同意页面上显示 Grok Build，因为 OpenClaw 使用 xAI 的共享 OAuth 客户端。

## 选择你的设置路径

使用与你的 OpenClaw 安装状态匹配的路径：

<Steps>
  <Step title="新的 OpenClaw 安装">
    当你正在设置新的本地 Gateway 网关时，使用守护进程安装运行新手引导，然后在模型/凭证步骤中选择 xAI/Grok OAuth 选项：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 上或通过 SSH 使用时，在新手引导期间使用设备码：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-device-code
    ```

    OAuth 不需要 xAI API key。OpenClaw 不需要 Grok
    Build 应用。xAI 可能仍会将授权同意应用标记为 Grok Build，因为
    OpenClaw 使用 xAI 的共享 OAuth 客户端。

  </Step>
  <Step title="已有 OpenClaw 安装">
    如果 OpenClaw 已经配置好，只需登录 xAI。不要仅为了连接 Grok 而重新运行完整新手引导或重新安装守护进程：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    当 Gateway 网关通过 SSH、Docker 或 VPS 运行，并且 localhost 浏览器回调不方便时，改用设备码流程：

    ```bash
    openclaw models auth login --provider xai --device-code
    ```

    登录后如需将 Grok 设为默认模型，请单独应用它：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有当你有意更改 Gateway 网关、守护进程、渠道、工作区或其他设置选择时，才重新运行完整新手引导。

  </Step>
  <Step title="API key 路径">
    API key 设置仍适用于 xAI Console key，以及需要由 key 支持的提供商配置的媒体表面：

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输协议。来自 `openclaw models auth login --provider xai --method oauth`、`openclaw models auth login --provider xai --device-code` 或 `openclaw models auth login --provider xai --method api-key` 的同一凭证，也可以驱动一等的 `web_search`、`x_search`、远程 `code_execution` 以及 xAI 图像/视频生成。
语音和转写目前需要 `XAI_API_KEY` 或提供商配置。
由 Grok 支持的 `web_search` 优先使用 xAI OAuth，并回退到 `XAI_API_KEY` 或插件 Web 搜索配置。
如果你在 `plugins.entries.xai.config.webSearch.apiKey` 下存储 xAI key，内置 xAI 模型提供商也会将该 key 作为回退复用。
设置 `plugins.entries.xai.config.webSearch.baseUrl` 可将 Grok `web_search`，以及默认情况下的 `x_search`，路由到操作者的 xAI Responses 代理。
`code_execution` 调优位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## OAuth 故障排除

- 如果浏览器 OAuth 无法访问 `127.0.0.1:56121`，请使用
  `openclaw models auth login --provider xai --device-code`。
- 如果登录成功但 Grok 不是默认模型，请运行
  `openclaw models set xai/grok-4.3`。
- 要检查保存的 xAI 凭证配置文件，请运行：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 决定哪些账户可以接收 OAuth API 令牌。如果某个账户不符合条件，请尝试 API key 路径，或在 xAI 侧检查订阅。

<Tip>
从 SSH、Docker 或 VPS 登录时，请使用 `xai-device-code`。OpenClaw 会打印一个 xAI URL 和短码；在远程进程轮询 xAI 等待完成令牌交换的同时，在任意本地浏览器中完成登录。
</Tip>

## 内置目录

OpenClaw 开箱即包含当前 xAI 聊天模型，并在模型选择器中按最新优先排序：

| 系列           | 模型 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

该插件仍会为现有配置向前解析较旧的 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 和 Grok Code slug。官方 Grok Code Fast 别名会规范化为 `grok-build-0.1`；OpenClaw 不再在可选目录中显示其他已退役的上游 slug。

<Tip>
除非你明确需要 Grok 4.20 beta 别名，否则请将 `grok-4.3` 用于通用聊天，将 `grok-build-0.1` 用于偏构建/编码的工作负载。
</Tip>

## OpenClaw 功能覆盖范围

内置插件将 xAI 当前的公共 API 表面映射到 OpenClaw 的共享提供商和工具契约上。不适合共享契约的能力（例如流式 TTS 和实时语音）不会暴露，见下表。

| xAI 能力                   | OpenClaw 表面                            | 状态                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供商                  | 是                                                                  |
| 服务端 Web 搜索            | `web_search` 提供商 `grok`                | 是                                                                  |
| 服务端 X 搜索              | `x_search` 工具                           | 是                                                                  |
| 服务端代码执行             | `code_execution` 工具                     | 是                                                                  |
| 图像                       | `image_generate`                          | 是                                                                  |
| 视频                       | `video_generate`                          | 是                                                                  |
| 批量文本转语音             | `messages.tts.provider: "xai"` / `tts`    | 是                                                                  |
| 流式 TTS                   | -                                         | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区                     |
| 批量语音转文本             | `tools.media.audio` / 媒体理解            | 是                                                                  |
| 流式语音转文本             | 语音通话 `streaming.provider: "xai"`      | 是                                                                  |
| 实时语音                   | -                                         | 尚未暴露；使用不同的会话/WebSocket 契约                            |
| 文件 / 批处理              | 仅通用模型 API 兼容性                     | 不是一等 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成、语音和批量转写，使用 xAI 的流式 STT WebSocket 进行实时语音通话转写，并使用 Responses API 进行模型、搜索和代码执行工具。需要不同 OpenClaw 契约的功能，例如实时语音会话，会在此记录为上游能力，而不是隐藏的插件行为。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true` 会按如下方式重写原生 xAI 请求：

| 源模型        | 快速模式目标       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容别名

旧版别名仍会规范化为规范内置 ID：

| 旧版别名                  | 规范 ID                               |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置 `grok` Web 搜索提供商优先使用 xAI OAuth，然后回退到 `XAI_API_KEY` 或插件 Web 搜索 key：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置 `xai` 插件通过共享 `video_generate` 工具注册视频生成。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文本转视频、图像转视频、参考图像生成、远程视频编辑和远程视频扩展
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图像转视频为 1-15 秒，使用 `reference_image` 角色时为 1-10 秒，扩展为 2-10 秒
    - 参考图像生成：为每张提供的图像将 `imageRoles` 设置为 `reference_image`；xAI 最多接受 7 张此类图像
    - 默认操作超时：600 秒，除非设置了 `video_generate.timeoutMs` 或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本地视频缓冲区。视频编辑/扩展输入请使用远程 `http(s)` URL。图像转视频接受本地图像缓冲区，因为 OpenClaw 可以将其编码为 xAI 的数据 URL。
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
    参见[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置 `xai` 插件通过共享 `image_generate` 工具注册图像生成。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文本转图像和参考图像编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像
    - 默认操作超时：600 秒，除非设置了 `image_generate.timeoutMs` 或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 向 xAI 请求 `b64_json` 图像响应，以便生成的媒体可以通过常规渠道附件路径存储和传递。本地参考图像会转换为数据 URL；远程 `http(s)` 参考会直接传递。

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
    共享的跨提供商图像控制项；不支持的仅原生旋钮
    被有意不通过 `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    内置的 `xai` 插件通过共享的 `tts`
    提供商表面注册文本转语音。

    - 语音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认语音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：提供商原生速度覆盖
    - 不支持原生 Opus 语音便笺格式

    要将 xAI 用作默认 TTS 提供商：

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也提供通过 WebSocket
    的流式 TTS，但 OpenClaw 语音提供商契约目前要求在发送回复前
    获得完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    内置的 `xai` 插件通过 OpenClaw 的
    媒体理解转写表面注册批量语音转文本。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转写使用
      `tools.media.audio` 的地方都支持，包括 Discord 语音频道片段和
      渠道音频附件

    要为入站音频转写强制使用 xAI：

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

    语言可以通过共享音频媒体配置或逐次调用的
    转写请求提供。共享 OpenClaw
    表面接受提示词提示，但 xAI REST STT 集成只转发文件、模型和
    语言，因为这些可以清晰映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    内置的 `xai` 插件还为实时语音通话音频注册了实时转写提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 临时转写：默认启用

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

    提供商拥有的配置位于
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的
    键名包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此流式提供商用于 Voice Call 的实时转写路径。
    Discord 语音目前会录制短片段，并改用批量
    `tools.media.audio` 转写路径。
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    内置 xAI 插件将 `x_search` 作为 OpenClaw 工具暴露，用于通过 Grok
    搜索 X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键名               | 类型    | 默认值             | 描述                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | 启用或停用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用于 x_search 请求的模型             |
    | `baseUrl`          | string  | -                  | xAI Responses 基础 URL 覆盖          |
    | `inlineCitations`  | boolean | -                  | 在结果中包含内联引用                 |
    | `maxTurns`         | number  | -                  | 最大对话轮次                         |
    | `timeoutSeconds`   | number  | -                  | 请求超时秒数                         |
    | `cacheTtlMinutes`  | number  | -                  | 缓存生存时间，单位为分钟             |

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

  <Accordion title="Code execution configuration">
    内置 xAI 插件将 `code_execution` 作为 OpenClaw 工具暴露，用于
    在 xAI 的沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键名              | 类型    | 默认值                   | 描述                                 |
    | ----------------- | ------- | ------------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true`（如果键可用）     | 启用或停用代码执行                   |
    | `model`           | string  | `grok-4-1-fast`          | 用于代码执行请求的模型               |
    | `maxTurns`        | number  | -                        | 最大对话轮次                         |
    | `timeoutSeconds`  | number  | -                        | 请求超时秒数                         |

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

  <Accordion title="Known limits">
    - xAI 认证可以使用 API key、环境变量、插件配置回退、
      浏览器 OAuth，或带有符合条件 xAI 账号的设备码 OAuth。浏览器
      OAuth 使用 `127.0.0.1:56121` 上的本地回调；对于远程主机，请使用
      `xai-device-code`，除非你想在打开登录 URL 前转发该端口。
      xAI 决定哪些账号可以接收 OAuth API 令牌，并且
      同意页面可能显示 Grok Build，尽管 OpenClaw 不需要
      Grok Build 应用。
    - OpenClaw 目前不暴露 xAI 多智能体模型系列。xAI
      通过 Responses API 提供这些模型，但它们不接受
      OpenClaw 共享 Agent loop 使用的客户端侧工具或自定义工具。请参阅
      [xAI 多智能体限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 语音尚未注册为 OpenClaw 提供商。它
      需要一种不同于批量 STT 或流式转写的双向语音会话契约。
    - xAI 图像 `quality`、图像 `mask` 和额外的仅原生宽高比
      在共享 `image_generate` 工具拥有对应的跨提供商控制项之前
      不会暴露。
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 专用的工具架构和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false` 可
      停用它。
    - 内置 xAI 包装器会在发送原生 xAI 请求前剥离不支持的严格工具架构标志和
      推理 *effort* 负载键。只有
      `grok-4.3` / `grok-4.3-*` 声明支持可配置推理 effort；所有
      其他具备推理能力的 xAI 模型仍会请求
      `include: ["reasoning.encrypted_content"]`，以便在后续轮次中重放之前的加密推理。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw
      工具暴露。OpenClaw 会在每个工具请求内启用所需的特定 xAI 内置能力，
      而不是把所有原生工具附加到每个聊天轮次。
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

xAI 媒体路径由单元测试和选择性启用的实时套件覆盖。在运行实时探测前，
请在进程环境中导出 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用实时文件会合成普通 TTS、适合电话场景的 PCM
TTS，通过 xAI 批量 STT 转写音频，通过 xAI
实时 STT 流式传输相同的 PCM，生成文生图输出，并编辑参考图像。共享图像实时文件会通过 OpenClaw 的
运行时选择、回退、规范化和媒体附件路径验证同一个 xAI 提供商。

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="All providers" href="/zh-CN/providers/index" icon="grid-2">
    更广泛的提供商概览。
  </Card>
  <Card title="Troubleshooting" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
