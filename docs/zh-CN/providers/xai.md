---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 身份验证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-07-16T11:55:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 内置了一个用于 Grok 模型的 `xai` 提供商插件。推荐使用符合条件的 SuperGrok 或 X Premium 订阅，通过 Grok OAuth 进行身份验证。Gateway 网关、配置、路由和工具均保留在本地；只有 Grok 请求会发送到 xAI 的 API。

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

    仅当你有意更改 Gateway 网关、守护进程、渠道、工作区或其他设置选项时，才重新运行完整的新手引导。

  </Step>
  <Step title="API key 路径">
    对于 xAI Console 密钥以及需要基于密钥的提供商配置的媒体功能，API key 设置仍然有效：

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
OpenClaw 使用 xAI Responses API 作为内置的 xAI 传输方式。来自 `openclaw models auth login --provider xai --method oauth` 或
`--method api-key` 的同一凭据也可用于 `web_search`（提供商 ID 为 `grok`）、`x_search`、
`code_execution`、语音/转录以及 xAI 图像/视频生成。如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，内置的 xAI 模型提供商也会将其作为回退凭据复用。
</Note>

## OAuth 故障排查

- 对于 SSH、Docker、VPS 或其他远程设置，请使用
  `openclaw models auth login --provider xai --method oauth`；它使用设备代码验证，而不是 localhost 回调。
- 如果登录成功但 Grok 不是默认模型，请运行
  `openclaw models set xai/grok-4.3`。
- 检查已保存的 xAI 身份验证配置文件：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 决定哪些账户可以获取 OAuth API 令牌。如果账户不符合条件，请使用 API key 路径，或在 xAI 侧检查订阅。

<Tip>
通过 SSH、Docker 或 VPS 登录时，请使用 `xai-oauth`。OpenClaw 会输出一个 URL 和短代码；远程进程轮询 xAI 等待令牌交换完成期间，可在任意本地浏览器中完成登录。
</Tip>

## 内置目录

以下 ID 可在模型选择器中选择。对于现有配置，插件仍可解析旧版 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 和 Grok Code ID；请参阅[旧版兼容性和动态别名](#legacy-compatibility-and-moving-aliases)。

| 系列           | 模型 ID                                                      |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5`（别名：`grok-4.5-latest`、`grok-build-latest`） |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3`（别名：`grok-4.3-latest`、`grok-latest`）       |
| Grok 4.20      | `grok-4.20-0309-reasoning`、`grok-4.20-0309-non-reasoning`   |

<Tip>
在可用的情况下，使用 `grok-4.5` 进行常规聊天、编码和智能体任务。
Grok 4.3 仍是适用于各区域的安全设置默认值；`grok-build-0.1` 和两个带日期的 Grok 4.20 变体仍可选择。
</Tip>

## 功能覆盖范围

内置插件将受支持的 xAI API 映射到 OpenClaw 的共享提供商和工具契约。不符合共享契约的能力列在下方或已知限制中。

| xAI 能力                    | OpenClaw 功能                           | 状态                                                 |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供商            | 支持                                                  |
| 服务端 Web 搜索            | `web_search` 提供商 `grok`            | 支持                                                  |
| 服务端 X 搜索              | `x_search` 工具                         | 支持                                                  |
| 服务端代码执行             | `code_execution` 工具                   | 支持                                                  |
| 图像                       | `image_generate`                        | 支持                                                  |
| 视频                       | `video_generate`                        | 支持                                                  |
| 批量文本转语音             | `messages.tts.provider: "xai"` / `tts`  | 支持                                                  |
| 流式 TTS                   | `textToSpeechStream`                    | 通过 `wss://api.x.ai/v1/tts` 支持（非实时语音） |
| 批量语音转文本             | `tools.media.audio` 媒体理解 | 支持                                                  |
| 流式语音转文本             | 语音通话 `streaming.provider: "xai"`  | 支持                                                  |
| 实时语音                   | Talk `talk.realtime.provider: "xai"`    | 支持；原生 Talk 节点通过 Gateway 网关中继             |
| 文件 / 批处理              | 仅通用模型 API 兼容性                    | 不是 OpenClaw 的一等工具                              |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成和批量转录，使用 xAI 的流式 STT WebSocket 进行实时语音通话转录，使用 xAI 的 Grok Voice Agent WebSocket 进行 Talk 实时会话，并使用 Responses API 提供聊天、搜索和代码执行工具。
</Note>

### 旧版快速模式兼容性

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
仍会按以下方式重写旧版 xAI 配置。这些目标 ID 仅为兼容性而保留；新配置应使用当前可选择的模型。

| 源模型        | 快速模式目标       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容性和动态别名

旧版别名按以下方式规范化：

| 旧版别名                                                      | 规范化 ID       |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`、`grok-code-fast`、`grok-code-fast-1-0825` | `grok-build-0.1` |

带日期的 0309 ID 是可选择的目录条目。OpenClaw 会原样发送所有其他当前 Grok 4.20 别名，以便 xAI 保留对稳定版、最新版、测试版、实验版和带日期别名语义的控制权。全局 `grok-latest` 别名也会原样保留。

xAI 已停用以下确切 ID。OpenClaw 将它们作为隐藏兼容性条目保留，以支持已发布的配置，并采用其当前重定向目标的限制和定价：

| 已停用的 ID                                                          | 当前行为                         |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`、`grok-4-fast-reasoning`、`grok-4-0709`    | Grok 4.3，使用 `low` 推理    |
| `grok-4-1-fast-non-reasoning`、`grok-4-fast-non-reasoning`、`grok-3` | Grok 4.3，禁用推理 |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine 图像质量       |

`openclaw doctor --fix` 会更新持久化的 xAI 服务端工具默认值和已停用的高质量图像 slug，移除过时的生成目录条目，并修复活跃 4.20 条目中过时的上下文元数据。它不会将活跃的 4.20 `beta-latest` 别名固定到某个带日期的快照。

## 功能

<Warning>
  `x_search` 和 `code_execution` 在 xAI 的服务器上运行。xAI 对每 1,000 次工具调用收取 $5，另加模型的输入和输出令牌费用。当省略每个工具的 `enabled` 设置时，OpenClaw 仅在使用活跃的 xAI 模型时公开该工具。已知的非 xAI 模型提供商需要为每个工具显式设置 `enabled: true`；提供商缺失或无法解析时将以关闭状态失败。始终需要 xAI 身份验证，且 `enabled: false` 会为所有提供商禁用该工具。
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
    - 经典模式：文本转视频、图像转视频、参考图像生成、远程视频编辑和远程视频扩展
    - Video 1.5 模式：仅支持图像转视频，且必须恰好提供一张首帧图像
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`；
      如果省略，经典模式和 Video 1.5 图像转视频会继承源图像的宽高比
    - 分辨率：经典模式为 `480P`/`720P`；Video 1.5 还支持 `1080P`；所有生成模式默认使用 `480P`
    - 时长：生成/图像转视频为 1-15 秒；使用经典 `reference_image` 角色时为 1-10 秒；经典扩展为 2-10 秒
    - 参考图像生成：将每张提供的图像的 `imageRoles` 设置为 `reference_image`；xAI 最多接受 7 张此类图像
    - 视频编辑/扩展会继承输入视频的宽高比和分辨率；这些操作不接受几何参数覆盖
    - 默认操作超时时间：600 秒，除非设置了 `video_generate.timeoutMs` 或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本地视频缓冲区。视频编辑/扩展输入必须使用远程 `http(s)` URL。图像转视频接受本地图像缓冲区，因为 OpenClaw 会将其编码为供 xAI 使用的数据 URL。
    </Warning>

    Video 1.5 还可识别 xAI 的 `grok-imagine-video-1.5-preview` 和 `grok-imagine-video-1.5-2026-05-30` 标识符。OpenClaw 会原样转发所选标识符，但应用相同的仅图像验证。

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
    - 参考输入：一张 `image` 或最多三张 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像
    - 默认操作超时时间：600 秒，除非设置了 `image_generate.timeoutMs`
      或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 请求 xAI 返回 `b64_json` 图像响应，以便生成的媒体可以
    通过常规渠道附件路径存储和传递。本地
    参考图像会转换为数据 URL；远程 `http(s)` 引用
    将原样传递。

    将 xAI 用作默认图像提供商：

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
    OpenClaw 目前仅转发各提供商通用的图像控制项；
    这些仅限原生接口的选项未通过 `image_generate` 公开。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享的 `tts`
    提供商接口注册文本转语音功能。

    - 语音：来自 xAI 的已认证实时目录；使用
      `openclaw infer tts voices --provider xai` 列出
    - 离线备用语音：`ara`、`eve`、`leo`、`rex`、`sal`
    - 默认语音：`eve`
    - 即使账户自定义语音 ID 不在
      内置目录响应中，也会转发
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：提供商原生速度覆盖设置
    - 不支持原生 Opus 语音消息格式

    将 xAI 用作默认 TTS 提供商：

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
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点进行缓冲合成，
    使用已认证的 `/v1/tts/voices` 目录进行发现，并使用原生
    `wss://api.x.ai/v1/tts` 进行流式合成。流式传输仅限于
    原生 `api.x.ai` 主机，因此此路径会拒绝自定义 `baseUrl` 值。
    它使用现有的语言、语音、编解码器和速度控制项；采样率和比特率
    采用 xAI 默认值。音频文件合成遵循所有
    已配置的编解码器。语音消息目标在流式传输和缓冲
    回退时使用 MP3，因为 xAI 的原始编解码器不携带编解码器/采样率元数据。
    数据流先发送 `text.delta`，然后发送
    `text.done`，接收 `audio.delta`、`audio.done` 或 `error`，并应用
    `timeoutMs` 空闲超时，每收到一个音频分块都会刷新。此功能与
    实时语音会话相互独立。请参阅 xAI 的 [流式 TTS API](https://docs.x.ai/developers/rest-api-reference/inference/voice) 契约。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的
    媒体理解转录接口注册批量语音转文本功能。

    - 端点：xAI REST `/v1/stt`
    - 输入路径：多部分音频文件上传
    - 模型选择：xAI 在内部选择转录模型；
      该端点没有模型选择器
    - 用于入站音频转录读取 `tools.media.audio` 的所有位置，
      包括 Discord 语音频道片段和渠道音频附件

    强制使用 xAI 进行入站音频转录：

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

    可以通过共享音频媒体配置或每次调用的
    转录请求提供语言。共享 OpenClaw
    接口接受提示词提示，但 xAI REST STT 集成仅转发文件和语言，
    因为只有这两项映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时语音通话音频
    注册实时转录提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 中间转录文本：默认启用

    Voice Call 的 Twilio 媒体流发送 G.711 mu-law 音频帧，因此
    xAI 提供商会直接转发这些帧而不进行转码：

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
    此流式提供商用于 Voice Call 的实时转录路径。
    Discord 语音会录制短片段，并改用批量
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音（Talk）">
    内置的 `xai` 插件通过共享的 `registerRealtimeVoiceProvider` 契约，
    为 Talk 模式注册 Grok Voice Agent 实时会话。

    - 端点：`wss://api.x.ai/v1/realtime?model=<voice-model>`
    - 默认模型：`grok-voice-latest`
    - 默认语音：`eve`
    - 传输方式：`gateway-relay`（iOS、Android 和 Control UI 中继路径）
    - 音频：PCM16 24 kHz 或 G.711 µ-law 8 kHz
    - 插话：xAI 服务器 VAD 会中断响应；OpenClaw 会清除排队的播放内容
      并截断提供商历史记录中未播放的部分

    在 Gateway 网关上配置 Talk：

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // 仅当提供商侧会话重放可接受时才选择启用。
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    当 Voice Call
    或共享实时选择器复用同一提供商映射时，提供商自有配置也会从
    `plugins.entries.voice-call.config.realtime.providers.xai` 解析。支持的键包括
    `apiKey`、`baseUrl`、`model`、`voice`、`vadThreshold`、`silenceDurationMs`、
    `prefixPaddingMs`、`reasoningEffort` 和 `sessionResumption`。
    `reasoningEffort` 仅接受 `high` 或 `none`，与 xAI Voice Agent API 一致。

    xAI 的服务器 VAD 始终会创建响应并处理音频中断。
    请使用 `consultRouting: "provider-direct"`；xAI Voice Agent 协议不支持强制转录文本路由和
    禁用输入音频中断。

    <Note>
    xAI OAuth 或 `XAI_API_KEY` 可以对实时语音进行身份验证。此提供商接口
    尚不支持浏览器自有的 WebRTC；请在原生节点上使用 gateway-relay Talk，
    或使用 Control UI 中继路径。
    </Note>

    <Note>
    `sessionResumption` 默认为 `false`。设置为 `true` 时，OpenClaw 会请求
    xAI 保留足够的会话状态，以便在重新连接后恢复同一对话，
    然后使用返回的对话 ID 重新连接。如果无法接受提供商侧
    的重放/保留，请保持禁用；此时中断的
    套接字会以失败关闭，而不是静默启动新对话。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置的 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，
    用于通过 Grok 搜索 X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键                | 类型    | 默认值                    | 描述                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | 布尔值  | 对 xAI 模型自动启用         | 禁用，或为已知的非 xAI 提供商选择启用            |
    | `model`           | 字符串  | `grok-4.3`                | 用于 x_search 请求的模型                         |
    | `baseUrl`         | 字符串  | -                         | xAI Responses 基础 URL 覆盖设置                  |
    | `inlineCitations` | 布尔值  | -                         | 在结果中包含内联引用                             |
    | `maxTurns`        | 数字    | -                         | 最大对话轮数                                     |
    | `timeoutSeconds`  | 数字    | `30`                      | 请求超时时间（秒）                               |
    | `cacheTtlMinutes` | 数字    | `15`                      | 缓存生存时间（分钟）                             |

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
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，
    用于在 xAI 的沙箱环境中远程执行代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键               | 类型    | 默认值                   | 描述                                             |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | 布尔值  | 对 xAI 模型自动启用        | 禁用，或为已知的非 xAI 提供商选择启用            |
    | `model`          | 字符串  | `grok-4.3`               | 用于代码执行请求的模型                           |
    | `maxTurns`       | 数字    | -                        | 最大对话轮数                                     |
    | `timeoutSeconds` | 数字    | `30`                     | 请求超时时间（秒）                               |

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
    - xAI 身份验证可使用 API key、环境变量、插件配置回退，或通过符合条件的 xAI 账户使用 OAuth。OAuth 使用设备代码验证，无需 localhost 回调。xAI 决定哪些账户可以接收 OAuth API token，并且同意页面可能会显示 Grok Build，尽管 OpenClaw 不要求使用 Grok Build 应用。
    - OpenClaw 目前不公开 xAI 多智能体模型系列。xAI 通过 Responses API 提供这些模型，但它们不接受 OpenClaw 共享 Agent loop 使用的客户端工具或自定义工具。请参阅
      [xAI 多智能体限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI 实时语音目前仅提供 Gateway 网关中继的 Talk 传输。Control UI 尚未接入由浏览器持有的提供商 WebSocket 会话。
    - 在共享 `image_generate` 工具具备相应的跨提供商控制之前，xAI 图像 `quality`、图像 `mask` 以及其他仅原生支持的宽高比不会公开。

  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 特有的工具架构和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false`
      可将其禁用。
    - 内置 xAI 包装器会先移除不受支持的 contains-count 架构边界和不受支持的推理 *effort* 载荷键，再发送原生 xAI 请求。Grok 4.5 支持 low、medium 和 high effort（默认为 high）。Grok 4.3 支持 none、low、medium 和 high effort（默认为 low）。其他具备推理能力的 xAI 模型不提供可配置的 effort 控制，但仍会请求
      `include: ["reasoning.encrypted_content"]`，以便在后续轮次中重放先前加密的推理。
    - `web_search`、`x_search` 和 `code_execution` 以 OpenClaw 工具的形式公开。OpenClaw 只会将每个工具所需的特定 xAI 内置工具附加到该工具的请求，而不会将所有原生工具附加到每个聊天轮次。
    - Grok `web_search` 读取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 读取 `plugins.entries.xai.config.xSearch.baseUrl`，然后
      回退到 Grok Web 搜索基础 URL。
    - `x_search` 和 `code_execution` 归内置 xAI 插件所有，而不是硬编码到核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，而非本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和选择性启用的实时测试套件覆盖。运行实时探测前，请在进程环境中导出
`XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用实时测试文件会合成普通 TTS 和适合电话通信的 PCM TTS，通过 xAI 批量 STT 转录音频，通过 xAI 实时 STT 流式传输相同的 PCM，生成文生图输出，并编辑参考图像。
共享图像实时测试文件通过 OpenClaw 的运行时选择、回退、规范化和媒体附件路径验证同一个 xAI 提供商。
选择性启用的 Video 1.5 用例会提交一张生成的 1080P 首帧图像，并验证已完成视频的下载。

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
