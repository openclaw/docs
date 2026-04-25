---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T22:38:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 524f07dbe30a78a5a4e2ddc373dc6600c07eae4381a1e1b38b8999e27ed932e2
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API。OpenClaw 支持三种 OpenAI 系列路由。模型前缀决定所选路由：

- **API 密钥** — 通过直接 OpenAI Platform 访问并按使用量计费（`openai/*` 模型）
- **通过 PI 的 Codex 订阅** — 使用 ChatGPT/Codex 登录并通过订阅访问（`openai-codex/*` 模型）
- **Codex app-server harness** — 原生 Codex app-server 执行（`openai/*` 模型加上 `agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAI 明确支持在 OpenClaw 这样的外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是相互独立的层。如果这些标签
开始混淆，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再
修改配置。

## 快速选择

| 目标 | 使用方式 | 说明 |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 直接按 API 密钥计费 | `openai/gpt-5.5` | 设置 `OPENAI_API_KEY` 或运行 OpenAI API 密钥新手引导。 |
| 使用 ChatGPT/Codex 订阅认证的 GPT-5.5 | `openai-codex/gpt-5.5` | Codex OAuth 的默认 PI 路由。对于订阅配置，这是最佳首选。 |
| 使用原生 Codex app-server 行为的 GPT-5.5 | `openai/gpt-5.5` 加上 `embeddedHarness.runtime: "codex"` | 为该模型引用强制启用 Codex app-server harness。 |
| 图像生成或编辑 | `openai/gpt-image-2` | 可配合 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。 |
| 透明背景图像 | `openai/gpt-image-1.5` | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

<Note>
GPT-5.5 同时支持直接 OpenAI Platform API 密钥访问和
订阅 / OAuth 路由。对直接 `OPENAI_API_KEY`
流量使用 `openai/gpt-5.5`，对通过 PI 的 Codex OAuth 使用 `openai-codex/gpt-5.5`，或
对原生 Codex
app-server harness 使用带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-5.5`。
</Note>

<Note>
启用 OpenAI 插件，或选择 `openai-codex/*` 模型，并不会
启用内置的 Codex app-server 插件。OpenClaw 只有在你显式选择
原生 Codex harness 并设置
`embeddedHarness.runtime: "codex"`，或使用旧版 `codex/*` 模型引用时，才会启用该插件。
</Note>

## OpenClaw 功能覆盖范围

| OpenAI 功能 | OpenClaw 界面 | Status |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
| Codex 订阅模型 | 带有 `openai-codex` OAuth 的 `openai-codex/<model>` | 是 |
| Codex app-server harness | 带有 `embeddedHarness.runtime: codex` 的 `openai/<model>` | 是 |
| 服务器端网页搜索 | 原生 OpenAI Responses 工具 | 是，在启用网页搜索且未固定提供商时 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
| 实时语音 | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是 |
| Embeddings | Memory Wiki 嵌入提供商 | 是 |

## 入门指南

选择你偏好的认证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接 API 访问和按使用量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [OpenAI Platform 控制台](https://platform.openai.com/api-keys) 创建或复制一个 API 密钥。
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

    ### 路由摘要

    | Model ref | 路由 | 认证 |
    |-----------|-------|------|
    | `openai/gpt-5.5` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` 是直接 OpenAI API 密钥路由，除非你显式强制启用
    Codex app-server harness。对通过
    默认 PI 运行器的 Codex OAuth 使用 `openai-codex/*`，或使用带有
    `embeddedHarness.runtime: "codex"` 的 `openai/gpt-5.5` 进行原生 Codex app-server 执行。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不**提供 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，当前 Codex 目录也同样不提供它。
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

        对于无头环境或不适合回调的设置，可添加 `--device-code`，通过 ChatGPT 设备码流程登录，而不是使用 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | Model ref | 路由 | 认证 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | 通过 PI 的 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server 认证 |

    <Note>
    对认证 / 配置文件命令请继续使用 `openai-codex` 提供商 id。
    `openai-codex/*` 模型前缀也是用于 Codex OAuth 的显式 PI 路由。
    它不会选择或自动启用内置的 Codex app-server harness。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备码流程登录——OpenClaw 会在自己的智能体认证存储中管理生成的凭证。
    </Note>

    ### Status 指示器

    聊天中的 `/status` 会显示当前会话正在使用的模型运行时。
    默认 PI harness 显示为 `Runtime: OpenClaw Pi Default`。当选择
    内置 Codex app-server harness 时，`/status` 会显示
    `Runtime: OpenAI Codex`。现有会话会保留其记录的 harness id，因此如果你在更改 `embeddedHarness` 后希望 `/status` 反映新的 PI / Codex 选择，请使用
    `/new` 或 `/reset`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`: `1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    实践中，这个较小的默认上限通常具有更好的延迟和质量表现。你可以用 `contextTokens` 覆盖它：

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
    使用 `contextWindow` 声明模型的原生元数据。使用 `contextTokens` 限制运行时上下文预算。
    </Note>

    ### 目录恢复

    OpenClaw 会在上游 Codex 目录元数据存在时，使用其中的 `gpt-5.5`
    元数据。如果实时 Codex 发现阶段在账户已认证的情况下遗漏了 `openai-codex/gpt-5.5` 这一行，
    OpenClaw 会合成该 OAuth 模型条目，这样 cron、子智能体以及已配置默认模型的运行就不会因
    `Unknown model` 而失败。

  </Tab>
</Tabs>

## 图像生成

内置的 `openai` 插件通过 `image_generate` 工具注册图像生成。
它同时支持 OpenAI API 密钥图像生成和通过同一个 `openai/gpt-image-2` 模型引用进行的 Codex OAuth 图像
生成。

| 功能 | OpenAI API 密钥 | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 认证 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登录 |
| 传输 | OpenAI Images API | Codex Responses 后端 |
| 每次请求的最大图像数 | 4 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图） | 已启用（最多 5 张参考图） |
| 尺寸覆盖 | 支持，包括 2K / 4K 尺寸 | 支持，包括 2K / 4K 尺寸 |
| 宽高比 / 分辨率 | 不会转发到 OpenAI Images API | 在安全时映射为受支持的尺寸 |

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
有关共享工具参数、提供商选择和故障切换行为，请参阅 [图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图生成和图像
编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为
显式模型覆盖使用。对于透明背景
PNG/WebP 输出，请使用 `openai/gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝
`background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并设置
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；旧版 `openai.background` 提供商选项
仍然可用。OpenClaw 还会通过将默认的 `openai/gpt-image-2` 透明
请求重写为 `gpt-image-1.5` 来保护公共 OpenAI 和
OpenAI Codex OAuth 路由；Azure 和自定义的 OpenAI 兼容端点则保留
其已配置的 deployment / model 名称。

同样的设置也适用于无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，对
`openclaw infer image edit` 也使用相同的 `--output-format` 和 `--background` 标志。
`--openai-background` 仍然作为 OpenAI 专用别名保留。

对于 Codex OAuth 安装，继续使用相同的 `openai/gpt-image-2` 引用。当
配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会解析该存储的 OAuth
访问令牌，并通过 Codex Responses 后端发送图像请求。它
不会先尝试 `OPENAI_API_KEY`，也不会在该请求中静默回退到 API 密钥。
当你希望改为使用直接 OpenAI Images API
路由时，请使用 API 密钥、
自定义 base URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图像端点位于受信任的局域网 / 私有地址上，还需同时设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；若未显式启用此选项，
OpenClaw 会继续阻止访问私有 / 内部的 OpenAI 兼容图像端点。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置的 `openai` 插件通过 `video_generate` 工具注册视频生成。

| 功能 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文本生成视频、图像生成视频、单视频编辑 |
| 参考输入 | 1 张图像或 1 个视频 |
| 尺寸覆盖 | 支持 |
| 其他覆盖项 | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并给出工具警告 |

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
有关共享工具参数、提供商选择和故障切换行为，请参阅 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词贡献

OpenClaw 会为跨提供商的 GPT-5 系列运行添加共享的 GPT-5 提示词贡献。它按模型 id 应用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的覆盖层。较早的 GPT-4.x 模型则不会。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳覆盖层，因此即使 Codex 接管了其余 harness 提示词，通过 `embeddedHarness.runtime: "codex"` 强制使用的 `openai/gpt-5.x` 会话也会保留相同的后续执行和主动心跳指导。

GPT-5 贡献添加了一个带标签的行为契约，用于规范人格持续性、执行安全、工具纪律、输出形状、完成检查和验证。特定于渠道的回复和静默消息行为仍保留在共享的 OpenClaw 系统提示词和出站传递策略中。对于匹配的模型，GPT-5 指导始终启用。友好交互风格层是独立的，并且可配置。

| 值 | 效果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（默认） | 启用友好交互风格层 |
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
运行时值不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 配置时，旧版 `plugins.entries.openai.config.personality` 仍会作为兼容性回退继续读取。
</Note>

## 语音与语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件会为 `messages.tts` 界面注册语音合成功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便笺使用 `opus`，文件使用 `mp3` |
    | API 密钥 | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过
    OpenClaw 的媒体理解转录界面注册批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转录使用
      `tools.media.audio` 的地方都支持，包括 Discord 语音频道片段和渠道
      音频附件

    如需为入站音频转录强制使用 OpenAI：

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

    当共享音频媒体配置或每次调用的转录请求中提供了
    language 和 prompt 提示时，OpenClaw 会将它们转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件会为 Voice Call 插件注册实时转录功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | Prompt | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。这个流式提供商用于 Voice Call 的实时转录路径；Discord 语音目前仍会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件会为 Voice Call 插件注册实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 语音 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` 提供商可以通过覆盖 base URL，将图像
生成请求指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw
会检测 `models.providers.openai.baseUrl` 中的 Azure 主机名，并自动切换到
Azure 的请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不会受到 `models.providers.openai.baseUrl` 的影响。请参阅 [语音与语音识别](#voice-and-speech) 下 **实时
语音** 折叠项中的 Azure
设置。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内部

### 配置

要通过内置 `openai` 提供商使用 Azure 图像生成，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为
Azure OpenAI 密钥（而不是 OpenAI Platform 密钥）：

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

OpenClaw 会识别以下 Azure 主机后缀，并用于 Azure 图像生成
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于识别出的 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 请求头，而不是 `Authorization: Bearer`
- 使用以 deployment 为作用域的路径（`/openai/deployments/{deployment}/...`）
- 为每个请求附加 `?api-version=...`
- 对 Azure 图像生成调用使用默认 600 秒请求超时。
  每次调用的 `timeoutMs` 值仍会覆盖该默认值。

其他 base URL（公共 OpenAI、OpenAI 兼容代理）仍保留标准的
OpenAI 图像请求格式。

<Note>
`openai` 提供商图像生成路径的 Azure 路由要求
OpenClaw 2026.4.22 或更高版本。更早版本会将任何自定义
`openai.baseUrl` 视为公共 OpenAI 端点，并且在 Azure
图像 deployment 上失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可固定 Azure 图像生成路径所使用的特定 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

当该变量未设置时，默认值为 `2024-12-01-preview`。

### 模型名称就是 deployment 名称

Azure OpenAI 会将模型绑定到 deployment。对于通过内置 `openai` 提供商路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段
必须是你在 Azure 门户中配置的**Azure deployment 名称**，而不是
公共 OpenAI 模型 id。

如果你创建了一个名为 `gpt-image-2-prod`、用于提供 `gpt-image-2` 的 deployment：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的 deployment 名称规则也适用于通过
内置 `openai` 提供商路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域
可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。在创建
deployment 之前，请先查看 Microsoft 当前的区域列表，并确认你的区域提供该特定模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的某些选项（例如
`gpt-image-2` 上的某些 `background` 值），或仅在特定模型版本中提供这些选项。这些差异来自 Azure 和底层模型，而不是
OpenClaw。如果 Azure 请求因验证错误而失败，请在
Azure 门户中检查你的特定 deployment 和 API 版本所支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因请求头——请参阅 [高级配置](#advanced-configuration) 下的 **原生与 OpenAI 兼容
路由** 折叠项。

对于 Azure 上的聊天或 Responses 流量（不仅限于图像生成），请使用
新手引导流程或专用 Azure 提供商配置——仅靠 `openai.baseUrl` 并不会自动采用 Azure 的 API / 认证格式。另有一个独立的
`azure-openai-responses/*` 提供商；请参阅
下方的服务器端压缩折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 和 `openai-codex/*` 都采用 WebSocket 优先，并在失败时回退到 SSE（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级状态约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话和轮次标识请求头
    - 在不同传输变体之间规范化使用计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | WebSocket 优先，SSE 回退 |
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
            "openai-codex/gpt-5.5": {
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
    OpenClaw 默认对 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以降低首次轮次延迟。

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
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 提供共享的快速模式开关：

    - **聊天 / UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，快速模式不会重写 `reasoning` 或 `text.verbosity`。

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
    会话级覆盖优先于配置。在 Sessions UI 中清除会话覆盖后，该会话会恢复为配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 提供优先处理能力。可在 OpenClaw 中按模型设置：

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
    `serviceTier` 仅会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由这两个提供商之一，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务器端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 Pi-harness 流包装器会自动启用服务器端压缩：

    - 强制设置 `store: true`（除非模型兼容层设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi harness 路径，以及嵌入式运行使用的 OpenAI 提供商钩子。原生 Codex app-server harness 通过 Codex 管理自己的上下文，并使用 `agents.defaults.embeddedHarness.runtime` 单独配置。

    <Tabs>
      <Tab title="显式启用">
        适用于 Azure OpenAI Responses 之类的兼容端点：

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
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制设置 `store: true`，除非兼容层设置了 `supportsStore: false`。
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
    - 当有工具操作可用时，不再将“仅计划”的轮次视为成功推进
    - 通过“立即行动”引导重试该轮
    - 在重大工作中自动启用 `update_plan`
    - 如果模型持续规划而不执行操作，则显示显式的阻塞状态

    <Note>
    仅适用于 OpenAI 和 Codex 的 GPT-5 系列运行。其他提供商和较旧模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生与 OpenAI 兼容路由">
    OpenClaw 会将直接 OpenAI、Codex 和 Azure OpenAI 端点与通用 OpenAI 兼容 `/v1` 代理区别对待：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用式 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因请求头
    - 保留 OpenAI 专用请求整形（`service_tier`、`store`、reasoning 兼容、prompt-cache 提示）

    **代理 / 兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中移除 Completions `store`
    - 接受用于 OpenAI 兼容 Completions 代理的高级 `params.extra_body` / `params.extraBody` 透传 JSON
    - 不强制严格工具 schema 或原生专用请求头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因请求头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="OAuth 与认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
