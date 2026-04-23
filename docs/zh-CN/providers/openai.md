---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅身份验证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中使用 OpenAI 的 API 密钥或 Codex 订阅
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T21:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25d8fb540af37366c84380feca3dae43e8b206ff77d6a22af3cdddc1cf0373fc
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API。OpenClaw 在同一套规范的 OpenAI 模型引用后支持两种身份验证路径：

- **API 密钥** — 直接访问 OpenAI Platform，并按使用量计费（`openai/*` 模型）
- **Codex 订阅** — 使用 ChatGPT/Codex 登录并通过订阅访问。内部 auth/provider id 为 `openai-codex`，但新的模型引用仍应使用 `openai/*`。

OpenAI 明确支持在 OpenClaw 这样的外部工具和工作流中使用订阅 OAuth。

## OpenClaw 功能覆盖范围

| OpenAI 能力 | OpenClaw 界面 | 状态 |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
| Codex 订阅模型 | `openai/<model>` 搭配 `openai-codex` 身份验证 | 是 |
| 服务端 Web 搜索 | 原生 OpenAI Responses 工具 | 是，在启用 Web 搜索且未固定 provider 时 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
| 实时语音 | Voice Call `realtime.provider: "openai"` | 是 |
| Embeddings | memory embedding provider | 是 |

## 入门指南

选择你偏好的身份验证方式，并按照设置步骤进行。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接 API 访问和按使用量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        从 [OpenAI Platform 控制台](https://platform.openai.com/api-keys) 创建或复制一个 API 密钥。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路径摘要

    | 模型引用 | 路径 | 身份验证 |
    |-----------|-------|------|
    | `openai/gpt-5.5` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    `openai-codex/*` 仍可作为旧版兼容别名使用，但新的配置应使用 `openai/*`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不**提供 `openai/gpt-5.3-codex-spark`。实际的 OpenAI API 请求会拒绝该模型，而当前 Codex 目录也未提供它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，而不是单独的 API 密钥。Codex cloud 需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头环境或不适合回调的设置，可以添加 `--device-code`，通过 ChatGPT 设备码流程登录，而不是使用 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路径摘要

    | 模型引用 | 路径 | 身份验证 |
    |-----------|-------|------|
    | `openai/gpt-5.5` | ChatGPT/Codex OAuth | Codex 登录 |

    <Note>
    `openai-codex/*` 和 `codex/*` 模型引用是旧版兼容别名。对于身份验证/配置文件命令，请继续使用 `openai-codex` provider id。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上述设备码流程登录——OpenClaw 会在自己的智能体身份验证存储中管理生成的凭证。
    </Note>

    ### 状态指示器

    聊天 `/status` 会显示当前
    会话正在使用哪个嵌入式 harness。默认的 PI harness 显示为 `Runner: pi (embedded)`，并且
    不会添加单独的标记。当选择内置的 Codex app-server harness 时，
    `/status` 会在 `Fast` 后附加非 PI harness id，例如
    `Fast · codex`。现有会话会保留其记录的 harness id，因此如果你在更改 `embeddedHarness` 后希望 `/status`
    反映新的 PI/Codex 选择，请使用 `/new` 或 `/reset`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    实际使用中，较小的默认上限通常具有更好的延迟和质量表现。你可以使用 `contextTokens` 进行覆盖：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens` 限制运行时上下文预算。
    </Note>

  </Tab>
</Tabs>

## 图像生成

内置的 `openai` 插件通过 `image_generate` 工具注册图像生成功能。
它通过同一个 `openai/gpt-image-2` 模型引用，同时支持基于 OpenAI API 密钥的图像生成和基于 Codex OAuth 的图像生成。

| 能力 | OpenAI API 密钥 | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 身份验证 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登录 |
| 传输 | OpenAI Images API | Codex Responses 后端 |
| 每次请求的最大图像数 | 4 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图像） | 已启用（最多 5 张参考图像） |
| 尺寸覆盖 | 支持，包括 2K/4K 尺寸 | 支持，包括 2K/4K 尺寸 |
| 宽高比 / 分辨率 | 不会转发到 OpenAI Images API | 在安全情况下映射为受支持的尺寸 |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
参见 [Image Generation](/zh-CN/tools/image-generation)，了解共享工具参数、provider 选择和故障切换行为。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像编辑的默认模型。`gpt-image-1` 仍可作为显式模型覆盖使用，但新的 OpenAI 图像工作流应使用 `openai/gpt-image-2`。

对于 Codex OAuth 安装，请继续使用相同的 `openai/gpt-image-2` 引用。如果没有
`OPENAI_API_KEY`，OpenClaw 会解析为 `openai-codex` auth profile 存储的 OAuth 访问令牌，
并通过 Codex Responses 后端发送图像请求，因此这一路径无需公开的 OpenAI Images API 密钥也可使用。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="为 macOS 上的 OpenClaw 制作一张精美的发布海报" size=3840x2160 count=1
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="保留物体形状，将材质改为半透明玻璃" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置的 `openai` 插件通过 `video_generate` 工具注册视频生成功能。

| 能力 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文生视频、图生视频、单视频编辑 |
| 参考输入 | 1 张图像或 1 个视频 |
| 尺寸覆盖 | 支持 |
| 其他覆盖 | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并给出工具警告 |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
参见 [Video Generation](/zh-CN/tools/video-generation)，了解共享工具参数、provider 选择和故障切换行为。
</Note>

## GPT-5 提示词贡献

OpenClaw 会为跨 provider 的 GPT-5 系列运行添加共享的 GPT-5 提示词贡献。它按模型 id 生效，因此 `openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的覆盖层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳覆盖层，因此即使其余 harness 提示词由 Codex 接管，强制通过 `embeddedHarness.runtime: "codex"` 运行的 `openai/gpt-5.x` 会话仍会保留相同的后续执行和主动心跳指导。

GPT-5 贡献为人格持续性、执行安全、工具纪律、输出结构、完成检查和验证添加了带标签的行为契约。特定渠道的回复和静默消息行为仍保留在共享的 OpenClaw 系统提示词和出站传递策略中。对于匹配的模型，GPT-5 指导始终启用。友好的交互风格层是独立且可配置的。

| 值 | 效果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（默认） | 启用友好的交互风格层 |
| `"on"` | `"friendly"` 的别名 |
| `"off"` | 仅禁用友好风格层 |

<Tabs>
  <Tab title="配置">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
这些值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
旧版 `plugins.entries.openai.config.personality` 仍会作为兼容性回退项读取，当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 配置时会使用它。
</Note>

## 语音与音频

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 界面注册了语音合成功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音色 | `messages.tts.providers.openai.voice` | `coral` |
    | 语速 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts` 支持） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便笺为 `opus`，文件为 `mp3` |
    | API 密钥 | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用音色：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS Base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过
    OpenClaw 的媒体理解转录界面注册了批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用
      `tools.media.audio`，就支持该功能，包括 Discord 语音频道片段和渠道
      音频附件

    要强制对入站音频转录使用 OpenAI：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    当由共享音频媒体配置或按次转录请求提供语言和提示词时，
    这些提示会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册了实时转录功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，音频格式为 G.711 u-law（`g711_ulaw` / `audio/pcmu`）。此流式 provider 用于 Voice Call 的实时转录路径；Discord 语音当前仍会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册了实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音色 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` provider 可通过覆盖 base URL，将图像生成请求定向到 Azure OpenAI 资源。在图像生成路径上，OpenClaw
会检测 `models.providers.openai.baseUrl` 中的 Azure 主机名，并自动切换为
Azure 的请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影响。有关其实时语音的 Azure
设置，请参见 [语音与音频](#voice-and-speech) 下的 **实时语音**
折叠面板。
</Note>

以下情况适合使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有的 Azure 租户内

### 配置

若要通过内置 `openai` provider 使用 Azure 图像生成，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为
Azure OpenAI 密钥（而非 OpenAI Platform 密钥）：

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw 会为 Azure 图像生成
路径识别以下 Azure 主机后缀：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发送到已识别 Azure 主机的图像生成请求，OpenClaw 会：

- 发送 `api-key` 请求头，而不是 `Authorization: Bearer`
- 使用以部署为范围的路径（`/openai/deployments/{deployment}/...`）
- 为每个请求附加 `?api-version=...`

其他 base URL（公共 OpenAI、兼容 OpenAI 的代理）将继续使用标准
OpenAI 图像请求格式。

<Note>
`openai` provider 的图像生成路径的 Azure 路由要求
OpenClaw 2026.4.22 或更高版本。更早版本会将任何自定义
`openai.baseUrl` 视为公共 OpenAI 端点，因此在 Azure
图像部署上会失败。
</Note>

  ### API 版本

  设置 `AZURE_OPENAI_API_VERSION` 以为 Azure 图像生成路径固定特定的 Azure 预览版或 GA 版本：

  ```bash
  export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
  ```

  当该变量未设置时，默认值为 `2024-12-01-preview`。

  ### 模型名称就是部署名称

  Azure OpenAI 将模型绑定到部署。对于通过内置 `openai` provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段
  必须是你在 Azure 门户中配置的**Azure 部署名称**，而不是公共 OpenAI 模型 id。

  如果你创建了一个名为 `gpt-image-2-prod` 的部署来提供 `gpt-image-2`：

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="一张简洁的海报" size=1024x1024 count=1
  ```

  同样的部署名称规则也适用于通过内置 `openai` provider 路由的图像生成调用。

  ### 区域可用性

  Azure 图像生成目前仅在部分区域可用
  （例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
  `uaenorth`）。在创建部署之前，请先查看 Microsoft 最新的区域列表，
  并确认你的区域提供了特定模型。

  ### 参数差异

  Azure OpenAI 与公共 OpenAI 并不总是接受相同的图像参数。
  Azure 可能会拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些
  `background` 值），或者仅在特定模型版本中提供这些选项。这些差异来自 Azure 和底层模型，而不是
  OpenClaw。如果 Azure 请求因验证错误而失败，请在
  Azure 门户中检查你的特定部署和 API 版本所支持的参数集。

  <Note>
  Azure OpenAI 使用原生传输和兼容行为，但不会接收
  OpenClaw 的隐藏归因请求头——参见 [Advanced configuration](#advanced-configuration) 下 **原生路由与 OpenAI 兼容路由**
  折叠面板。

  对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用
  新手引导流程或专用的 Azure provider 配置——仅设置 `openai.baseUrl`
  不会自动采用 Azure 的 API/身份验证格式。存在一个单独的
  `azure-openai-responses/*` provider；请参见下方的
  服务端压缩折叠面板。
  </Note>

  ## 高级配置

  <AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    对于 `openai/*` 和 `openai-codex/*`，OpenClaw 都采用 WebSocket 优先并在失败时回退到 SSE（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前，重试一次早期 WebSocket 失败
    - 发生失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次身份标头
    - 在不同传输变体之间规范化使用量计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | WebSocket 优先，失败时回退到 SSE |
    | `"sse"` | 仅强制使用 SSE |
    | `"websocket"` | 仅强制使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    相关 OpenAI 文档：
    - [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [流式 API 响应（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 预热">
    OpenClaw 默认对 `openai/*` 启用 WebSocket 预热，以减少首轮延迟。

    ```json5
    // 禁用预热
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 为 `openai/*` 提供共享的快速模式切换：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射为 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，快速模式不会重写 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    会话级覆盖优先于配置。在 Sessions UI 中清除会话覆盖后，会话将恢复为配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 提供优先处理。你可以在 OpenClaw 中按模型设置它：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支持的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 仅会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一 provider，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接的 OpenAI Responses 模型（位于 `api.openai.com` 的 `openai/*`），OpenClaw 会自动启用服务端压缩：

    - 强制设置 `store: true`（除非模型兼容性将 `supportsStore` 设为 `false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    <Tabs>
      <Tab title="显式启用">
        适用于 Azure OpenAI Responses 等兼容端点：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="自定义阈值">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="禁用">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制使用 `store: true`，除非兼容性将 `supportsStore` 设为 `false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体 GPT 模式">
    对于 `openai/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的嵌入式执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 时，OpenClaw 会：
    - 当存在可用工具操作时，不再将仅有计划的轮次视为成功进展
    - 使用“立即行动”的引导重试该轮次
    - 对于较大工作自动启用 `update_plan`
    - 如果模型持续规划而不执行操作，则明确显示阻塞状态

    <Note>
    仅适用于 OpenAI 和 Codex 的 GPT-5 系列运行。其他 provider 和较旧的模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 会区别对待直接 OpenAI、Codex 和 Azure OpenAI 端点，以及通用的 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对于拒绝 `reasoning.effort: "none"` 的模型或代理，省略禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因请求头
    - 保留 OpenAI 专用的请求格式（`service_tier`、`store`、reasoning 兼容性、提示词缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 不强制严格工具 schema 或原生专用请求头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因请求头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障切换行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和 provider 选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和 provider 选择。
  </Card>
  <Card title="OAuth 与身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证详情和凭证复用规则。
  </Card>
</CardGroup>
