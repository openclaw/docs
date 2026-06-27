---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 认证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-06-27T17:10:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw 内置了用于 Grok 模型的 `xai` 提供商插件。对大多数
用户，推荐路径是使用符合条件的 SuperGrok 或 X Premium 订阅进行 Grok OAuth
登录。OpenClaw 保持本地优先：Gateway 网关、配置、路由和
工具在你的机器上运行，而 Grok 模型请求通过 xAI 进行身份验证
并发送到 xAI 的 API。

OAuth 不需要 xAI API key，也不需要 Grok Build
应用。xAI 仍可能在同意屏幕上显示 Grok Build，因为 OpenClaw 使用
xAI 的共享 OAuth 客户端。

## 选择你的设置路径

使用与你的 OpenClaw 安装状态匹配的路径：

<Steps>
  <Step title="新的 OpenClaw 安装">
    设置新的本地 Gateway 网关时，使用 daemon 安装运行新手引导，
    然后在模型/凭证步骤中选择 xAI/Grok OAuth 选项：

    ```bash
    openclaw onboard --install-daemon
    ```

    在 VPS 或通过 SSH 使用时，直接选择 xAI OAuth；OpenClaw 使用设备代码
    验证，不需要 localhost 回调：

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth 不需要 xAI API key。OpenClaw 不需要 Grok
    Build 应用。xAI 仍可能将同意应用标记为 Grok Build，因为
    OpenClaw 使用 xAI 的共享 OAuth 客户端。

  </Step>
  <Step title="现有 OpenClaw 安装">
    如果 OpenClaw 已配置，只登录 xAI。不要仅为了连接 Grok
    而重新运行完整新手引导或重新安装 daemon：

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    登录后要将 Grok 设为默认模型，请单独应用：

    ```bash
    openclaw models set xai/grok-4.3
    ```

    只有在你确实想更改 Gateway 网关、daemon、渠道、工作区或其他设置选择时，
    才重新运行完整新手引导。

  </Step>
  <Step title="API key 路径">
    API key 设置仍适用于 xAI Console 密钥，以及需要基于密钥的提供商配置的
    媒体表面：

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
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输协议。来自
`openclaw models auth login --provider xai --method oauth` 或
`openclaw models auth login --provider xai --method api-key` 的同一凭据也可以支持一等
`web_search`、`x_search`、远程 `code_execution`，以及 xAI 图像/视频生成。
语音和转录目前需要 `XAI_API_KEY` 或提供商配置。
由 Grok 支持的 `web_search` 优先使用 xAI OAuth，并回退到 `XAI_API_KEY` 或
插件 Web 搜索配置。
如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，
内置 xAI 模型提供商也会将该密钥作为回退复用。
设置 `plugins.entries.xai.config.webSearch.baseUrl`，即可将 Grok `web_search`
以及默认情况下的 `x_search` 路由到操作方 xAI Responses 代理。
`code_execution` 调优位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## OAuth 故障排除

- 对于 SSH、Docker、VPS 或其他远程设置，使用
  `openclaw models auth login --provider xai --method oauth`；xAI OAuth 使用
  设备代码验证，而不是 localhost 回调。
- 如果登录成功但 Grok 不是默认模型，请运行
  `openclaw models set xai/grok-4.3`。
- 要检查已保存的 xAI 凭证配置文件，请运行：

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI 决定哪些账户可以接收 OAuth API 令牌。如果账户不符合
  条件，请尝试 API key 路径，或检查 xAI 侧的订阅。

<Tip>
从 SSH、Docker 或 VPS 登录时使用 `xai-oauth`。OpenClaw 会打印一个
xAI URL 和短代码；在远程进程轮询 xAI 以完成令牌交换期间，在任意本地浏览器中完成登录。
</Tip>

## 内置目录

OpenClaw 默认包含当前 xAI 聊天模型，在模型选择器中按最新优先
排序：

| 系列         | 模型 ID                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

该插件仍会为现有配置向前解析较旧的 Grok 3、Grok 4、Grok 4 Fast、Grok 4.1
Fast 和 Grok Code slug。官方 Grok Code Fast 别名会规范化为 `grok-build-0.1`；OpenClaw 不再在可选目录中显示其他已退役的
上游 slug。

<Tip>
除非你明确需要 Grok 4.20 beta 别名，否则一般聊天使用 `grok-4.3`，
构建/编码型工作负载使用 `grok-build-0.1`。
</Tip>

## OpenClaw 功能覆盖

内置插件将 xAI 当前的公共 API 表面映射到 OpenClaw 的共享
提供商和工具合约。不适合共享合约的能力
（例如流式 TTS 和实时语音）不会暴露 - 请参见下表。

| xAI 能力             | OpenClaw 表面                          | 状态                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses           | `xai/<model>` 模型提供商              | 是                                                                 |
| 服务端 Web 搜索     | `web_search` 提供商 `grok`              | 是                                                                 |
| 服务端 X 搜索       | `x_search` 工具                           | 是                                                                 |
| 服务端代码执行 | `code_execution` 工具                     | 是                                                                 |
| 图像                     | `image_generate`                          | 是                                                                 |
| 视频                     | `video_generate`                          | 是                                                                 |
| 批量文本转语音       | `messages.tts.provider: "xai"` / `tts`    | 是                                                                 |
| 流式 TTS              | -                                         | 未暴露；OpenClaw 的 TTS 合约返回完整音频缓冲区 |
| 批量语音转文本       | `tools.media.audio` / 媒体理解 | 是                                                                 |
| 流式语音转文本   | Voice Call `streaming.provider: "xai"`    | 是                                                                 |
| 实时语音             | -                                         | 尚未暴露；不同的会话/WebSocket 合约               |
| 文件 / 批处理            | 仅通用模型 API 兼容性      | 不是一等 OpenClaw 工具                                     |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成、
语音和批量转录，使用 xAI 的流式 STT WebSocket 进行实时
语音通话转录，并使用 Responses API 进行模型、搜索和
代码执行工具。需要不同 OpenClaw 合约的功能，例如
Realtime 语音会话，在此记录为上游能力，而不是隐藏的插件行为。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会按如下方式重写原生 xAI 请求：

| 源模型  | 快速模式目标   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容别名

旧版别名仍会规范化为规范的内置 ID：

| 旧版别名              | 规范 ID                          |
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
    内置 `grok` Web 搜索提供商优先使用 xAI OAuth，然后回退到
    `XAI_API_KEY` 或插件 Web 搜索密钥：

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置 `xai` 插件通过共享
    `video_generate` 工具注册视频生成。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文生视频、图生视频、参考图像生成、远程
      视频编辑和远程视频扩展
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图生视频为 1-15 秒，使用
      `reference_image` 角色时为 1-10 秒，扩展为 2-10 秒
    - 参考图像生成：为每个提供的图像将 `imageRoles` 设为 `reference_image`；
      xAI 最多接受 7 张此类图像
    - 默认操作超时：600 秒，除非设置了 `video_generate.timeoutMs`
      或 `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    不接受本地视频缓冲区。视频编辑/扩展输入请使用远程 `http(s)` URL。
    图生视频接受本地图像缓冲区，因为 OpenClaw 可以将其编码为 xAI 的 data URL。
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
    请参见 [视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、
    提供商选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置 `xai` 插件通过共享
    `image_generate` 工具注册图像生成。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-quality`
    - 模式：文生图和参考图像编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像
    - 默认操作超时：600 秒，除非设置了 `image_generate.timeoutMs`
      或 `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw 会向 xAI 请求 `b64_json` 图像响应，以便生成的媒体可以
    通过常规渠道附件路径存储和交付。本地
    参考图像会转换为 data URL；远程 `http(s)` 引用会
    直接传递。

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
    共享的跨提供商图像控制项；不受支持的原生专用旋钮有意不通过
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
    - 不支持原生 Opus 语音备注格式

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
    OpenClaw 使用 xAI 的批处理 `/v1/tts` 端点。xAI 也通过 WebSocket
    提供流式 TTS，但 OpenClaw 语音提供商契约目前要求在回复送达前
    先获得完整的音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的
    媒体理解转录表面注册批处理语音转文本。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - OpenClaw 中凡是入站音频转录使用 `tools.media.audio` 的地方均支持，
      包括 Discord 语音频道片段和
      渠道音频附件

    要强制使用 xAI 处理入站音频转录：

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

    语言可以通过共享音频媒体配置或按调用传入的
    转录请求提供。共享的 OpenClaw
    表面接受提示词提示，但 xAI REST STT 集成只转发文件、模型和
    语言，因为这些能清晰映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时语音通话音频注册了实时转录提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 临时转录：默认启用

    Voice Call 的 Twilio 媒体流发送 G.711 µ-law 音频帧，因此
    xAI 提供商可以不经转码直接转发这些帧：

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
    键包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此流式提供商用于 Voice Call 的实时转录路径。
    Discord 语音目前会录制短片段，并改用批处理
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置的 xAI 插件将 `x_search` 作为 OpenClaw 工具暴露，用于通过 Grok
    搜索 X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键                 | 类型    | 默认值             | 描述                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | 启用或禁用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用于 x_search 请求的模型             |
    | `baseUrl`          | string  | -                  | xAI Responses 基础 URL 覆盖          |
    | `inlineCitations`  | boolean | -                  | 在结果中包含内联引用                 |
    | `maxTurns`         | number  | -                  | 最大对话轮数                         |
    | `timeoutSeconds`   | number  | -                  | 请求超时时间，单位为秒               |
    | `cacheTtlMinutes`  | number  | -                  | 缓存存活时间，单位为分钟             |

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
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具暴露，用于
    在 xAI 的沙箱环境中远程执行代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键                | 类型    | 默认值             | 描述                                     |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true`（如果密钥可用） | 启用或禁用代码执行                  |
    | `model`           | string  | `grok-4-1-fast`    | 用于代码执行请求的模型                   |
    | `maxTurns`        | number  | -                  | 最大对话轮数                             |
    | `timeoutSeconds`  | number  | -                  | 请求超时时间，单位为秒                   |

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
    - xAI 凭证可以使用 API key、环境变量、插件配置回退，
      或使用符合条件的 xAI 账号进行 OAuth。OAuth 使用设备代码验证，
      不需要 localhost 回调。xAI 决定哪些账号可以接收 OAuth
      API 令牌，并且同意页面可能显示 Grok Build，尽管 OpenClaw
      不要求使用 Grok Build 应用。
    - OpenClaw 目前不暴露 xAI 多 Agent 模型系列。xAI
      通过 Responses API 提供这些模型，但它们不接受
      OpenClaw 共享 Agent loop 使用的客户端侧工具或自定义工具。请参阅
      [xAI 多 Agent 限制](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)。
    - xAI Realtime 语音尚未注册为 OpenClaw 提供商。它
      需要与批处理 STT 或流式转录不同的双向语音会话契约。
    - xAI 图像 `quality`、图像 `mask` 以及额外的原生专用宽高比
      尚未暴露，直到共享的 `image_generate` 工具拥有对应的
      跨提供商控制项。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享 runner 路径上自动应用 xAI 专用的工具架构和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false`
      可禁用它。
    - 内置 xAI 包装器会在发送原生 xAI 请求前移除不受支持的严格工具架构标志和
      reasoning *effort* 载荷键。只有
      `grok-4.3` / `grok-4.3-*` 宣称支持可配置的 reasoning effort；所有
      其他具备推理能力的 xAI 模型仍会请求
      `include: ["reasoning.encrypted_content"]`，以便在后续轮次重放先前的加密推理。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw
      工具暴露。OpenClaw 会在每个工具请求内启用所需的特定 xAI 内置工具，
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

xAI 媒体路径由单元测试和可选启用的实时套件覆盖。运行实时探测前，
请在进程环境中导出 `XAI_API_KEY`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用实时文件会合成普通 TTS、适合电话场景的 PCM
TTS，通过 xAI 批处理 STT 转录音频，通过 xAI
实时 STT 流式传输同一段 PCM，生成文本到图像输出，并编辑一张参考图像。共享的
图像实时文件通过 OpenClaw 的
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
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
