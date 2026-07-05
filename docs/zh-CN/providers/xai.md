---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 凭证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-07-05T11:39:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9dedad8793a7c54a4f46371e72095ff70e74886fc05d7321035bd09cadbf0efd
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 内置了一个用于 Grok 模型的 `xai` 提供商插件。推荐路径是使用符合条件的 SuperGrok 或 X Premium 订阅进行 Grok OAuth。Gateway 网关、配置、路由和工具都会保留在本地；只有 Grok 请求会发送到 xAI 的 API。

OAuth 不需要 xAI API key 或 Grok Build 应用。xAI 仍可能在同意屏幕上显示 Grok Build，因为 OpenClaw 使用的是 xAI 的共享 OAuth 客户端。

## 设置

<Steps>
  <Step title="新安装">
    使用 daemon 安装运行新手引导，然后在模型/凭证步骤选择 xAI/Grok OAuth：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 或通过 SSH 使用时，直接选择 xAI OAuth；它使用设备码验证，不需要 localhost 回调：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="现有安装">
    只登录 xAI；不要仅仅为了连接 Grok 而重新运行完整新手引导：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    单独将 Grok 应用为默认模型：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有当你有意更改 Gateway 网关、daemon、渠道、工作区或其他设置选项时，才重新运行完整新手引导。

  </Step>
  <Step title="API-key 路径">
    API-key 设置仍适用于 xAI Console key，以及需要由密钥支持的提供商配置的媒体表面：

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
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输。来自 `openclaw models auth login --provider xai --method oauth` 或 `--method api-key` 的同一凭据也会驱动 `web_search`（提供商 id `grok`）、`x_search`、`code_execution`、语音/转录，以及 xAI 图像/视频生成。如果你在 `plugins.entries.xai.config.webSearch.apiKey` 下存储 xAI key，内置 xAI 模型提供商也会将其作为备用。
</Note>

## OAuth 故障排查

- 对于 SSH、Docker、VPS 或其他远程设置，请使用 `openclaw models auth login --provider xai --method oauth`；它使用设备码验证，而不是 localhost 回调。
- 如果登录成功但 Grok 不是默认模型，请运行 `openclaw models set xai/grok-4.3`。
- 检查保存的 xAI 凭证配置：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 决定哪些账户可以接收 OAuth API tokens。如果账户不符合条件，请使用 API-key 路径，或在 xAI 侧检查订阅。

<Tip>
从 SSH、Docker 或 VPS 登录时，请使用 `xai-oauth`。OpenClaw 会打印一个 URL 和短代码；在远程进程轮询 xAI 以完成令牌交换时，在任何本地浏览器中完成登录。
</Tip>

## 内置目录

模型选择器中的可选 id。插件仍会为现有配置解析较旧的 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast 和 Grok Code id；请参阅[旧版兼容别名](#legacy-compatibility-aliases)。

| 系列           | 模型 id                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

<Tip>
除非需要 Grok 4.20 beta 别名，否则请将 `grok-4.3` 用于通用聊天，将 `grok-build-0.1` 用于构建/编码侧重的工作负载。
</Tip>

## 功能覆盖

内置插件会将 xAI 当前的公共 API 表面映射到 OpenClaw 的共享提供商和工具契约。不符合共享契约的能力，例如流式 TTS 和实时语音，不会暴露。

| xAI 能力                   | OpenClaw 表面                          | 状态                                                                |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` 模型提供商                | 是                                                                  |
| 服务端 Web 搜索            | `web_search` 提供商 `grok`              | 是                                                                  |
| 服务端 X 搜索              | `x_search` 工具                         | 是                                                                  |
| 服务端代码执行             | `code_execution` 工具                   | 是                                                                  |
| 图像                       | `image_generate`                        | 是                                                                  |
| 视频                       | `video_generate`                        | 是                                                                  |
| 批量文本转语音             | `messages.tts.provider: "xai"` / `tts`  | 是                                                                  |
| 流式 TTS                   | -                                       | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区                     |
| 批量语音转文本             | `tools.media.audio` 媒体理解            | 是                                                                  |
| 流式语音转文本             | Voice Call `streaming.provider: "xai"`  | 是                                                                  |
| 实时语音                   | -                                       | 尚未暴露；需要不同的会话/WebSocket 契约                            |
| 文件 / 批处理              | 仅通用模型 API 兼容性                   | 不是一等 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成和批量转录，使用 xAI 的流式 STT WebSocket 进行实时语音通话转录，并使用 Responses API 进行聊天、搜索和代码执行工具。
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

旧版别名会规范化为内置规范 id：

| 旧版别名                                                                    | 规范 id                               |
| --------------------------------------------------------------------------- | ------------------------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`               | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`                                                     | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`                                                   | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`, `grok-4.20-experimental-beta-0304-reasoning`         | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`, `grok-4.20-experimental-beta-0304-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索提供商优先使用 xAI OAuth，然后回退到 `XAI_API_KEY` 或插件 Web 搜索密钥：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` 插件通过共享的 `video_generate` 工具注册视频生成。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文生视频、图生视频、参考图像生成、远程视频编辑和远程视频扩展
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图生视频为 1-15 秒，使用 `reference_image` role 时为 1-10 秒，扩展为 2-10 秒
    - 参考图像生成：为每张提供的图像将 `imageRoles` 设置为 `reference_image`；xAI 最多接受 7 张此类图像
    - 默认操作超时：600 秒，除非设置了 `video_generate.timeoutMs` 或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本地视频缓冲区。请对视频编辑/扩展输入使用远程 `http(s)` URL。图生视频接受本地图像缓冲区，因为 OpenClaw 会将这些图像编码为 xAI 的 data URL。
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
    请参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置的 `xai` 插件通过共享的 `image_generate` 工具注册图像生成。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文生图和参考图像编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像
    - 默认操作超时：600 秒，除非设置了 `image_generate.timeoutMs` 或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 会向 xAI 请求 `b64_json` 图像响应，以便生成的媒体可以通过正常的渠道附件路径存储和发送。本地参考图像会转换为 data URL；远程 `http(s)` 参考会原样传递。

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
    xAI 还记录了 `quality`、`mask`、`user` 以及额外原生比例，例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 目前只转发共享的跨提供商图像控制；这些仅原生支持的旋钮不会通过 `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享 `tts` 提供商表面注册文本转语音。

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
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也提供通过 WebSocket 的流式 TTS，但 OpenClaw 语音提供商契约目前要求在回复发送前得到完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的媒体理解转录表面注册批量语音转文本。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 用于所有入站音频转录读取 `tools.media.audio` 的位置，
      包括 Discord 语音频道片段和渠道音频附件

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

    语言可以通过共享音频媒体配置或每次调用的
    转录请求提供。共享的 OpenClaw
    表面接受提示词提示，但 xAI REST STT 集成只转发文件、模型和
    语言，因为这些能清晰映射到当前公开的 xAI
    端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还会为实时语音通话音频注册一个实时转录提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 临时转录文本：默认启用

    Voice Call 的 Twilio 媒体流会发送 G.711 mu-law 音频帧，因此
    xAI 提供商会直接转发这些帧，无需转码：

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
    键为 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此流式传输提供商用于 Voice Call 的实时转录路径。
    Discord 语音会录制短片段，并改用批处理
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置的 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，用于
    通过 Grok 搜索 X（以前称为 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键               | 类型    | 默认值                       | 描述                          |
    | ----------------- | ------- | ------------------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true`（如果密钥可用）     | 启用或禁用 x_search           |
    | `model`           | string  | `grok-4-1-fast-non-reasoning` | 用于 x_search 请求的模型     |
    | `baseUrl`         | string  | -                              | xAI Responses 基础 URL 覆盖      |
    | `inlineCitations` | boolean | -                              | 在结果中包含内联引用  |
    | `maxTurns`        | number  | -                              | 最大对话轮数            |
    | `timeoutSeconds`  | number  | `30`                           | 请求超时时间（秒）            |
    | `cacheTtlMinutes` | number  | `15`                           | 缓存存活时间（分钟）         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast-non-reasoning",
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
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，用于
    在 xAI 的沙箱环境中远程执行代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键              | 类型    | 默认值                  | 描述                            |
    | ---------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`        | boolean | `true`（如果密钥可用） | 启用或禁用代码执行        |
    | `model`          | string  | `grok-4-1-fast`           | 用于代码执行请求的模型  |
    | `maxTurns`       | number  | -                           | 最大对话轮数              |
    | `timeoutSeconds` | number  | `30`                        | 请求超时时间（秒）              |

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
    - xAI 凭证可以使用 API 密钥、环境变量、插件配置
      回退，或使用符合条件的 xAI 账户进行 OAuth。OAuth 使用设备码
      验证，不需要 localhost 回调。xAI 决定哪些账户
      可以接收 OAuth API 令牌，并且同意页面可能显示 Grok Build，
      即使 OpenClaw 不需要 Grok Build 应用。
    - OpenClaw 当前不公开 xAI 多智能体模型系列。xAI
      通过 Responses API 提供这些模型，但它们不接受
      OpenClaw 共享 Agent loop 使用的客户端侧或自定义工具。
      请参阅
      [xAI 多智能体限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 语音尚未注册为 OpenClaw 提供商。它
      需要与批处理 STT 或流式转录不同的双向语音会话合约。
    - xAI 图像 `quality`、图像 `mask` 和额外的仅原生宽高比
      在共享 `image_generate` 工具具备
      对应的跨提供商控件之前不会公开。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 专用的工具 schema 和工具调用兼容性
      修复。
    - 原生 xAI 请求默认 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false`
      可禁用它。
    - 内置的 xAI 包装器会在发送原生 xAI 请求前剥离不支持的严格工具 schema 标志和
      reasoning *effort* 载荷键。只有
      `grok-4.3` / `grok-4.3-*` 声明支持可配置 reasoning effort；所有
      其他具备 reasoning 能力的 xAI 模型仍会请求
      `include: ["reasoning.encrypted_content"]`，以便在后续轮次中重放之前加密的 reasoning。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw
      工具公开。OpenClaw 只会把每个工具所需的特定 xAI 内置项附加到
      该工具的请求，而不是把每个原生工具附加到每个
      聊天轮次。
    - Grok `web_search` 读取 `plugins.entries.xai.config.webSearch.baseUrl`。
      `x_search` 读取 `plugins.entries.xai.config.xSearch.baseUrl`，然后
      回退到 Grok Web 搜索基础 URL。
    - `x_search` 和 `code_execution` 由内置的 xAI 插件拥有，
      而不是硬编码到核心模型运行时。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和可选启用的实时套件覆盖。运行实时探测前，请在进程环境中导出
`XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用的实时文件会合成普通 TTS、适合电话场景的 PCM
TTS，通过 xAI 批处理 STT 转录音频，通过 xAI
实时 STT 流式传输同一段 PCM，生成文生图输出，并编辑参考图像。
共享图像实时文件会通过 OpenClaw 的
运行时选择、回退、规范化和媒体附件路径验证同一个 xAI 提供商。

## 相关

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
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
