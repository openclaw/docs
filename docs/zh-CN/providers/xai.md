---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 身份验证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-07-11T20:55:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 内置了一个面向 Grok 模型的 `xai` 提供商插件。推荐使用符合条件的 SuperGrok 或 X Premium 订阅通过 Grok OAuth 进行身份验证。Gateway 网关、配置、路由和工具均保留在本地；只有 Grok 请求会发送到 xAI 的 API。

OAuth 不需要 xAI API key，也不需要 Grok Build 应用。由于 OpenClaw 使用 xAI 的共享 OAuth 客户端，xAI 仍可能在授权页面上显示 Grok Build。

## 设置

<Steps>
  <Step title="全新安装">
    运行新手引导并安装守护进程，然后在模型/身份验证步骤选择 xAI/Grok OAuth：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 上或通过 SSH 操作时，直接选择 xAI OAuth；它使用设备代码验证，不需要 localhost 回调：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="现有安装">
    仅登录 xAI；不要只是为了连接 Grok 而重新运行完整的新手引导：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    另行将 Grok 设置为默认模型：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    仅当你确实想更改 Gateway 网关、守护进程、渠道、工作区或其他设置选项时，才重新运行完整的新手引导。

  </Step>
  <Step title="API key 路径">
    API key 设置仍适用于 xAI Console 密钥，以及需要密钥支持的提供商配置的媒体功能：

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
OpenClaw 使用 xAI Responses API 作为内置的 xAI 传输方式。通过 `openclaw models auth login --provider xai --method oauth` 或 `--method api-key` 获取的同一凭据，也可用于 `web_search`（提供商 ID 为 `grok`）、`x_search`、`code_execution`、语音/转录以及 xAI 图像/视频生成。如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，内置的 xAI 模型提供商也会将其用作回退凭据。
</Note>

## OAuth 故障排查

- 对于 SSH、Docker、VPS 或其他远程设置，请使用 `openclaw models auth login --provider xai --method oauth`；它使用设备代码验证，而不是 localhost 回调。
- 如果登录成功，但 Grok 不是默认模型，请运行 `openclaw models set xai/grok-4.3`。
- 检查已保存的 xAI 身份验证配置：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 决定哪些账户可以获得 OAuth API 令牌。如果账户不符合条件，请使用 API key 路径，或在 xAI 端检查订阅状态。

<Tip>
通过 SSH、Docker 或 VPS 登录时，请使用 `xai-oauth`。OpenClaw 会输出一个 URL 和短代码；远程进程轮询 xAI 以等待令牌交换完成期间，你可以在任意本地浏览器中完成登录。
</Tip>

## 内置目录

以下 ID 可在模型选择器中选择。对于现有配置，该插件仍会解析旧版 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 和 Grok Code ID；请参阅[旧版兼容性和动态别名](#legacy-compatibility-and-moving-aliases)。

| 系列           | 模型 ID                                                      |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5`（别名：`grok-4.5-latest`、`grok-build-latest`）   |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3`（别名：`grok-4.3-latest`、`grok-latest`）         |
| Grok 4.20      | `grok-4.20-0309-reasoning`、`grok-4.20-0309-non-reasoning`   |

<Tip>
在可用的情况下，建议使用 `grok-4.5` 进行常规聊天、编码和智能体式工作。Grok 4.3 仍是区域安全的默认设置；`grok-build-0.1` 和两个带日期的 Grok 4.20 变体仍可选择。
</Tip>

## 功能覆盖范围

内置插件将受支持的 xAI API 映射到 OpenClaw 的共享提供商和工具契约。无法适配共享契约的能力会列在下方或已知限制部分。

| xAI 能力                   | OpenClaw 功能界面                       | 状态                                                        |
| -------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供商                | 支持                                                        |
| 服务端 Web 搜索            | `web_search` 提供商 `grok`              | 支持                                                        |
| 服务端 X 搜索              | `x_search` 工具                         | 支持                                                        |
| 服务端代码执行             | `code_execution` 工具                   | 支持                                                        |
| 图像                       | `image_generate`                        | 支持                                                        |
| 视频                       | `video_generate`                        | 经典完整工作流；Video 1.5 图生视频                          |
| 批量文本转语音             | `messages.tts.provider: "xai"` / `tts`  | 支持                                                        |
| 流式 TTS                   | -                                       | xAI 提供商尚未实现                                          |
| 批量语音转文本             | `tools.media.audio` 媒体理解            | 支持                                                        |
| 流式语音转文本             | Voice Call `streaming.provider: "xai"`  | 支持                                                        |
| 实时语音                   | -                                       | 尚未公开；需要不同的会话/WebSocket 契约                     |
| 文件 / 批处理              | 仅通用模型 API 兼容性                   | 不是一等 OpenClaw 工具                                      |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成和批量转录，使用 xAI 的流式 STT WebSocket 进行实时语音通话转录，并使用 Responses API 处理聊天、搜索和代码执行工具。
</Note>

### 旧版快速模式兼容性

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true` 仍会按以下方式重写旧版 xAI 配置。这些目标 ID 仅为兼容性而保留；新配置请使用当前可选择的模型。

| 源模型        | 快速模式目标       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容性和动态别名

旧版别名按以下方式规范化：

| 旧版别名                                                      | 规范化后的 ID   |
| ------------------------------------------------------------- | --------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

带日期的 0309 ID 是可选择的目录条目。OpenClaw 会原样发送所有其他当前 Grok 4.20 别名，以便 xAI 保留对稳定版、最新版、测试版、实验版和带日期别名语义的控制权。全局 `grok-latest` 别名也会原样保留。

xAI 已停用以下确切 ID。OpenClaw 将其保留为面向已发布配置的隐藏兼容性条目，并采用其当前重定向目标的限制和定价：

| 已停用的 ID                                                         | 当前行为                       |
| ------------------------------------------------------------------- | ------------------------------ |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`   | Grok 4.3，推理级别为 `low`     |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3，禁用推理             |
| `grok-code-fast-1`                                                  | Grok Build 0.1                 |
| `grok-imagine-image-pro`                                            | Grok Imagine Image Quality     |

`openclaw doctor --fix` 会更新持久化的 xAI 服务端工具默认值和已停用的高质量图像 slug，移除过期的生成目录条目，并修复有效 4.20 条目中过期的上下文元数据。它不会将有效的 4.20 `beta-latest` 别名固定到某个带日期的快照。

## 功能

<Warning>
  `x_search` 和 `code_execution` 在 xAI 的服务器上运行。xAI 对每 1,000 次工具调用收取 5 美元，另加模型的输入和输出令牌费用。如果省略各工具的 `enabled` 设置，OpenClaw 仅在当前使用 xAI 模型时公开该工具。已知的非 xAI 模型提供商需要为每个工具显式设置 `enabled: true`；缺失或无法解析的提供商会以关闭状态安全失败。始终需要 xAI 身份验证，而 `enabled: false` 会为所有提供商禁用该工具。
</Warning>

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索提供商优先使用 xAI OAuth，然后回退到 `XAI_API_KEY` 或插件 Web 搜索密钥：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` 插件通过共享的 `video_generate` 工具注册视频生成功能。

    - 默认模型：`xai/grok-imagine-video`
    - 其他模型：`xai/grok-imagine-video-1.5`
    - 经典模式：文生视频、图生视频、参考图像生成、远程视频编辑和远程视频扩展
    - Video 1.5 模式：仅支持图生视频，且必须恰好提供一张首帧图像
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`；省略时，经典模式和 Video 1.5 的图生视频会继承源图像的比例
    - 分辨率：经典模式支持 `480P`/`720P`；Video 1.5 还支持 `1080P`；所有生成模式均默认为 `480P`
    - 时长：生成/图生视频为 1–15 秒；使用经典模式的 `reference_image` 角色时为 1–10 秒；经典扩展为 2–10 秒
    - 参考图像生成：将每张提供的图像的 `imageRoles` 设置为 `reference_image`；xAI 最多接受 7 张此类图像
    - 视频编辑/扩展会继承输入视频的宽高比和分辨率；这些操作不接受几何参数覆盖
    - 默认操作超时时间：600 秒，除非设置了 `video_generate.timeoutMs` 或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本地视频缓冲区。视频编辑/扩展输入请使用远程 `http(s)` URL。图生视频接受本地图像缓冲区，因为 OpenClaw 会将其编码为供 xAI 使用的数据 URL。
    </Warning>

    Video 1.5 还可识别 xAI 的 `grok-imagine-video-1.5-preview` 和 `grok-imagine-video-1.5-2026-05-30` 标识符。OpenClaw 会原样转发所选标识符，但会应用相同的仅图像验证。

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
    内置的 `xai` 插件通过共享的 `image_generate` 工具注册图像生成功能。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文生图和参考图像编辑
    - 参考输入：一个 `image` 或最多三个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像
    - 默认操作超时：600 秒，除非设置了 `image_generate.timeoutMs`
      或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 请求 xAI 返回 `b64_json` 图像响应，以便通过常规渠道附件路径
    存储和传送生成的媒体。本地参考图像会转换为数据 URL；远程 `http(s)`
    参考地址保持不变直接传递。

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
    xAI 还记录了 `quality`、`mask`、`user` 和 `auto` 宽高比。
    OpenClaw 目前仅转发各提供商共用的图像控制项；
    这些仅限原生接口的选项尚未通过 `image_generate` 提供。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享的 `tts` 提供商接口注册文本转语音功能。

    - 语音：来自 xAI 的需身份验证实时目录；使用
      `openclaw infer tts voices --provider xai` 列出
    - 离线后备语音：`ara`、`eve`、`leo`、`rex`、`sal`
    - 默认语音：`eve`
    - 即使账户自定义语音 ID 不在内置目录响应中，也会予以转发
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 语速：提供商原生语速覆盖值
    - 不支持原生 Opus 语音消息格式

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
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点和需身份验证的
    `/v1/tts/voices` 目录。xAI 还通过 WebSocket 提供流式 TTS，但
    内置的 xAI 提供商尚未实现该流式钩子。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的媒体理解转录接口注册批量语音转文本功能。

    - 端点：xAI REST `/v1/stt`
    - 输入路径：以 multipart 方式上传音频文件
    - 模型选择：xAI 在内部选择转录模型；该端点没有模型选择器
    - 用于所有读取 `tools.media.audio` 的入站音频转录场景，
      包括 Discord 语音频道片段和渠道音频附件

    要强制使用 xAI 进行入站音频转录：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    可通过共享音频媒体配置或每次调用的转录请求提供语言。
    共享 OpenClaw 接口接受提示词提示，但 xAI REST STT 集成仅转发文件和语言，
    因为只有这些参数可映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时语音通话音频注册了实时转录提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测时长：`800ms`
    - 临时转录结果：默认启用

    Voice Call 的 Twilio 媒体流会发送 G.711 mu-law 音频帧，因此
    xAI 提供商无需转码即可直接转发这些帧：

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
    键包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`
    或 `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此流式提供商用于 Voice Call 的实时转录路径。
    Discord 会录制短片段，改用批量
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置的 xAI 插件将 `x_search` 作为 OpenClaw 工具提供，
    用于通过 Grok 搜索 X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键                | 类型    | 默认值                    | 说明                                           |
    | ----------------- | ------- | ------------------------- | ---------------------------------------------- |
    | `enabled`         | boolean | 对 xAI 模型自动启用       | 禁用，或为已知的非 xAI 提供商选择启用         |
    | `model`           | string  | `grok-4.3`                | 用于 x_search 请求的模型                       |
    | `baseUrl`         | string  | -                         | xAI Responses 基础 URL 覆盖值                  |
    | `inlineCitations` | boolean | -                         | 在结果中包含内联引用                           |
    | `maxTurns`        | number  | -                         | 最大对话轮数                                   |
    | `timeoutSeconds`  | number  | `30`                      | 请求超时时间（秒）                             |
    | `cacheTtlMinutes` | number  | `15`                      | 缓存存活时间（分钟）                           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具提供，
    用于在 xAI 的沙箱环境中远程执行代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键               | 类型    | 默认值                   | 说明                                           |
    | ---------------- | ------- | ------------------------ | ---------------------------------------------- |
    | `enabled`        | boolean | 对 xAI 模型自动启用      | 禁用，或为已知的非 xAI 提供商选择启用         |
    | `model`          | string  | `grok-4.3`               | 用于代码执行请求的模型                         |
    | `maxTurns`       | number  | -                        | 最大对话轮数                                   |
    | `timeoutSeconds` | number  | `30`                     | 请求超时时间（秒）                             |

    <Note>
    这是远程 xAI 沙箱执行，而不是本地 [`exec`](/zh-CN/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - xAI 身份验证可使用 API 密钥、环境变量、插件配置后备方案，
      或使用符合条件的 xAI 账户通过 OAuth 完成。OAuth 使用设备代码验证，
      不需要 localhost 回调。xAI 决定哪些账户可以获得 OAuth API 令牌，
      并且即使 OpenClaw 不需要 Grok Build 应用，同意页面也可能显示 Grok Build。
    - OpenClaw 目前不提供 xAI 多智能体模型系列。xAI
      通过 Responses API 提供这些模型，但它们不接受 OpenClaw 共享 Agent loop
      使用的客户端工具或自定义工具。请参阅
      [xAI 多智能体限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 语音尚未注册为 OpenClaw 提供商。它需要不同于批量 STT
      或流式转录的双向语音会话契约。
    - 在共享的 `image_generate` 工具具备对应的跨提供商控制项之前，
      不会提供 xAI 图像 `quality`、图像 `mask` 和原生 `auto` 宽高比。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 特有的工具架构和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false`
      可将其禁用。
    - 内置的 xAI 封装器会先移除不受支持的包含数量架构边界和不受支持的推理
      *强度* 负载键，再发送原生 xAI 请求。Grok 4.5 支持低、中、高
      三种强度（默认为高）。Grok 4.3 支持无、低、中、高
      四种强度（默认为低）。其他具备推理能力的 xAI 模型不提供可配置的强度控制，
      但仍会请求 `include: ["reasoning.encrypted_content"]`，
      以便在后续轮次中重放先前的加密推理。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw
      工具提供。OpenClaw 仅将每个工具所需的特定 xAI 内置工具附加到其请求，
      而不是在每轮聊天中附加所有原生工具。
    - Grok `web_search` 读取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 读取 `plugins.entries.xai.config.xSearch.baseUrl`，然后
      后备使用 Grok Web 搜索的基础 URL。
    - `x_search` 和 `code_execution` 由内置的 xAI 插件负责，
      而不是硬编码到核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，而不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和选择启用的实时测试套件覆盖。运行实时探测前，
请在进程环境中导出 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

特定提供商的实时测试文件会合成普通 TTS、适合电话场景的 PCM TTS，通过 xAI 批量 STT 转录音频，通过 xAI 实时 STT 流式传输相同的 PCM，生成文生图输出，并编辑参考图像。共享图像实时测试文件通过 OpenClaw 的运行时选择、故障转移、规范化和媒体附件路径，验证同一个 xAI 提供商。可选启用的 Video 1.5 用例会提交一张生成的 1080P 首帧图像，并验证已完成视频的下载。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="所有提供商" href="/zh-CN/providers/index" icon="grid-2">
    更全面的提供商概览。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及修复方法。
  </Card>
</CardGroup>
