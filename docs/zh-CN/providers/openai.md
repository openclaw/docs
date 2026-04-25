---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T03:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API。OpenClaw 支持三种 OpenAI 系列路由。模型前缀决定所使用的路由：

- **API 密钥** — 直接访问 OpenAI Platform，按使用量计费（`openai/*` 模型）
- **通过 PI 的 Codex 订阅** — 使用 ChatGPT/Codex 登录并通过订阅访问（`openai-codex/*` 模型）
- **Codex app-server harness** — 原生 Codex app-server 执行（`openai/*` 模型，加上 `agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAI 明确支持在 OpenClaw 之类的外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是彼此独立的层。如果这些标签混淆了，请在修改配置前先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 快速选择

| 目标 | 使用方式 | 说明 |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 直接使用 API 密钥计费 | `openai/gpt-5.4` | 设置 `OPENAI_API_KEY` 或运行 OpenAI API 密钥新手引导。 |
| 使用 ChatGPT/Codex 订阅认证的 GPT-5.5 | `openai-codex/gpt-5.5` | Codex OAuth 的默认 PI 路由。是订阅场景的首选。 |
| 使用原生 Codex app-server 行为的 GPT-5.5 | `openai/gpt-5.5` 加 `embeddedHarness.runtime: "codex"` | 使用 Codex app-server harness，而不是公开的 OpenAI API 路由。 |
| 图像生成或编辑 | `openai/gpt-image-2` | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。 |

<Note>
GPT-5.5 当前在 OpenClaw 中可通过订阅 / OAuth 路由使用：使用 PI 运行器的 `openai-codex/gpt-5.5`，或配合 Codex app-server harness 的 `openai/gpt-5.5`。当 OpenAI 在公开 API 上启用 GPT-5.5 后，才会支持通过 API 密钥直接访问 `openai/gpt-5.5`；在此之前，`OPENAI_API_KEY` 场景请使用已启用 API 的模型，例如 `openai/gpt-5.4`。
</Note>

<Note>
启用 OpenAI 插件，或选择 `openai-codex/*` 模型，并不会启用内置的 Codex app-server 插件。只有当你显式选择原生 Codex harness，并设置 `embeddedHarness.runtime: "codex"`，或使用旧版 `codex/*` 模型引用时，OpenClaw 才会启用该插件。
</Note>

## OpenClaw 功能覆盖范围

| OpenAI 能力 | OpenClaw 对应界面 | Status |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
| Codex 订阅模型 | 搭配 `openai-codex` OAuth 的 `openai-codex/<model>` | 是 |
| Codex app-server harness | 搭配 `embeddedHarness.runtime: codex` 的 `openai/<model>` | 是 |
| 服务端网页搜索 | 原生 OpenAI Responses 工具 | 是，在启用网页搜索且未固定提供商时 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
| 实时语音 | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是 |
| Embeddings | 记忆嵌入提供商 | 是 |

## 入门指南

选择你偏好的认证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接访问 API 和按使用量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 中创建或复制一个 API 密钥。
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 路由 | 认证 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | 当 OpenAI 在 API 上启用 GPT-5.5 后的未来直接 API 路由 | `OPENAI_API_KEY` |

    <Note>
    `openai/*` 默认是直接 OpenAI API 密钥路由，除非你显式强制使用 Codex app-server harness。GPT-5.5 本身当前仅支持订阅 / OAuth；如需通过默认 PI 运行器使用 Codex OAuth，请使用 `openai-codex/*`；如需原生 Codex app-server 执行，请使用带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-5.5`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **不**提供 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，当前 Codex 目录也未提供它。
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 路由 | 认证 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | 通过 PI 的 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server 认证 |

    <Note>
    认证 / 配置文件命令仍然使用 `openai-codex` provider id。`openai-codex/*` 模型前缀也是 Codex OAuth 的显式 PI 路由。它不会选择或自动启用内置的 Codex app-server harness。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上述设备码流程登录——OpenClaw 会在自己的智能体认证存储中管理生成的凭证。
    </Note>

    ### Status 指示器

    聊天中的 `/status` 会显示当前会话正在使用的模型运行时。默认 PI harness 会显示为 `Runtime: OpenClaw Pi Default`。当选择内置的 Codex app-server harness 时，`/status` 会显示 `Runtime: OpenAI Codex`。现有会话会保留其记录的 harness id，因此如果你在修改 `embeddedHarness` 后希望 `/status` 反映新的 PI/Codex 选择，请使用 `/new` 或 `/reset`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。你可以通过 `contextTokens` 覆盖它：

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
    使用 `contextWindow` 声明模型原生元数据。使用 `contextTokens` 限制运行时上下文预算。
    </Note>

    ### 目录恢复

    当上游 Codex 目录元数据中存在 `gpt-5.5` 时，OpenClaw 会使用它。如果实时 Codex 发现结果在账户已认证的情况下遗漏了 `openai-codex/gpt-5.5` 这一行，OpenClaw 会合成该 OAuth 模型行，以避免 cron、子智能体和已配置默认模型的运行因 `Unknown model` 而失败。

  </Tab>
</Tabs>

## 图像生成

内置的 `openai` 插件通过 `image_generate` 工具注册图像生成功能。
它同时支持 OpenAI API 密钥图像生成，以及通过同一个 `openai/gpt-image-2` 模型引用进行的 Codex OAuth 图像生成。

| 能力 | OpenAI API 密钥 | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 认证 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登录 |
| 传输 | OpenAI Images API | Codex Responses 后端 |
| 每次请求最大图像数 | 4 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图） | 已启用（最多 5 张参考图） |
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
有关共享工具参数、提供商选择和故障转移行为，请参阅 [Image Generation](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像编辑的默认模型。`gpt-image-1` 仍可作为显式模型覆盖使用，但新的 OpenAI 图像工作流应使用 `openai/gpt-image-2`。

对于 Codex OAuth 安装，保持使用同一个 `openai/gpt-image-2` 引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会解析已存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY`，也不会在该请求中静默回退到 API 密钥。如果你想改用直接 OpenAI Images API 路由，请显式为 `models.providers.openai` 配置 API 密钥、自定义 base URL 或 Azure 端点。
如果该自定义图像端点位于受信任的局域网 / 私有地址上，还需设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非显式启用此选项，否则 OpenClaw 会继续阻止私有 / 内部的 OpenAI 兼容图像端点。

生成：

```text
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

编辑：

```text
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置的 `openai` 插件通过 `video_generate` 工具注册视频生成功能。

| 能力 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文生视频、图生视频、单视频编辑 |
| 参考输入 | 1 张图片或 1 个视频 |
| 尺寸覆盖 | 支持 |
| 其他覆盖项 | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并显示工具警告 |

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
有关共享工具参数、提供商选择和故障转移行为，请参阅 [Video Generation](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词贡献层

OpenClaw 会为跨提供商的 GPT-5 系列运行添加一个共享的 GPT-5 提示词贡献层。它按模型 id 生效，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.4`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的叠加层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳叠加层，因此即使 Codex 接管了 harness 提示词的其余部分，强制通过 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-5.x` 会话仍会保留相同的后续执行与主动心跳指导。

GPT-5 贡献层增加了一个带标签的行为契约，涵盖人设持久性、执行安全、工具纪律、输出结构、完成检查和验证。特定渠道的回复行为和静默消息行为仍保留在共享的 OpenClaw 系统提示词和出站传递策略中。对于匹配的模型，GPT-5 指导始终启用。友好的交互风格层是独立的，并且可配置。

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
这些值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音与语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 界面注册语音合成功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音色 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便笺使用 `opus`，文件使用 `mp3` |
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
    设置 `OPENAI_TTS_BASE_URL` 可以覆盖 TTS 的 base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过
    OpenClaw 的媒体理解转录界面注册批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用
      `tools.media.audio`，就支持该功能，包括 Discord 语音频道片段和渠道音频附件

    如需强制入站音频转录使用 OpenAI：

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

    当共享音频媒体配置或按次转录请求提供语言和提示信息时，这些信息会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册实时转录功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，以及 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。这一流式提供商用于 Voice Call 的实时转录路径；Discord 语音当前仍是录制短片段，并使用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音色 | `...openai.voice` | `alloy` |
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

内置的 `openai` 提供商可以通过覆盖 base URL，将图像生成请求发送到 Azure OpenAI 资源。在图像生成路径上，OpenClaw 会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到 Azure 的请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 的影响。其 Azure 设置请参阅 [语音与语音识别](#voice-and-speech) 下的 **实时语音** 折叠项。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内部

### 配置

如需通过内置 `openai` 提供商使用 Azure 图像生成，请将
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

OpenClaw 会将以下 Azure 主机后缀识别为 Azure 图像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发送到已识别 Azure 主机的图像生成请求，OpenClaw 会：

- 发送 `api-key` 请求头，而不是 `Authorization: Bearer`
- 使用按部署划分的路径（`/openai/deployments/{deployment}/...`）
- 在每个请求后追加 `?api-version=...`

其他 base URL（公开 OpenAI、OpenAI 兼容代理）会继续使用标准 OpenAI 图像请求格式。

<Note>
`openai` 提供商图像生成路径的 Azure 路由要求 OpenClaw 版本为 2026.4.22 或更高。更早版本会将任何自定义 `openai.baseUrl` 视为公开 OpenAI 端点，因此会在 Azure 图像部署上失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 以固定 Azure 图像生成路径使用的特定 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

当该变量未设置时，默认值为 `2024-12-01-preview`。

### 模型名称就是部署名称

Azure OpenAI 会将模型绑定到部署。对于通过内置 `openai` 提供商路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的 **Azure 部署名称**，而不是公开的 OpenAI 模型 id。

如果你创建了一个名为 `gpt-image-2-prod` 的部署，并让它提供 `gpt-image-2`：

```text
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则也适用于通过内置 `openai` 提供商路由的图像生成调用。

### 区域可用性

Azure 图像生成当前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。在创建部署前，请先检查 Microsoft 当前的区域列表，并确认你的区域提供该具体模型。

### 参数差异

Azure OpenAI 和公开 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公开 OpenAI 允许的选项（例如 `gpt-image-2` 上某些
`background` 值），或者仅在特定模型版本上提供这些选项。这些差异来自
Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误而失败，请在
Azure 门户中检查你的具体部署和 API 版本所支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因请求头——请参阅 [Advanced configuration](#advanced-configuration) 下
**Native vs OpenAI-compatible routes** 折叠项。

对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用
新手引导流程或专用的 Azure 提供商配置——仅设置 `openai.baseUrl`
并不会自动采用 Azure 的 API / 认证格式。另有一个单独的
`azure-openai-responses/*` 提供商；请参阅下方的
服务端压缩折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输方式（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 和 `openai-codex/*` 都默认使用 WebSocket 优先并在失败时回退到 SSE（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前，重试一次早期 WebSocket 失败
    - 在失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次身份请求头
    - 在不同传输变体之间规范化使用量计数器（`input_tokens` / `prompt_tokens`）

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
            "openai/gpt-5.4": {
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
    OpenClaw 默认对 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以降低首轮延迟。

    ```json5
    // 禁用预热
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
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

    启用后，OpenClaw 会将快速模式映射为 OpenAI 优先处理（`service_tier = "priority"`）。已有的 `service_tier` 值会被保留，快速模式不会重写 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    会话级覆盖优先于配置。在 Sessions UI 中清除会话覆盖后，会话会恢复为配置中的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 提供优先处理能力。你可以在 OpenClaw 中按模型设置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支持的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 仅会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，OpenClaw 会保留 `service_tier` 原样不处理。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 Pi-harness 流包装器会自动启用服务端压缩：

    - 强制设置 `store: true`（除非模型兼容配置将 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（若不可用则为 `80000`）

    这适用于内置 Pi harness 路径，也适用于嵌入式运行使用的 OpenAI provider 钩子。原生 Codex app-server harness 通过 Codex 管理自身上下文，并通过 `agents.defaults.embeddedHarness.runtime` 单独配置。

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
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制设置 `store: true`，除非兼容配置将 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 模式">
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

    在 `strict-agentic` 下，OpenClaw 会：
    - 当工具动作可用时，不再将仅制定计划的一轮视为成功推进
    - 通过“立即行动”的引导重试该轮
    - 对于较大的工作，自动启用 `update_plan`
    - 如果模型持续规划而不执行操作，则显式显示阻塞状态

    <Note>
    仅适用于 OpenAI 和 Codex 的 GPT-5 系列运行。其他提供商和较旧模型系列仍保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI-compatible 路由">
    OpenClaw 会以不同方式处理直接 OpenAI、Codex 和 Azure OpenAI 端点，与通用 OpenAI-compatible `/v1` 代理不同：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用推理设置
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因请求头
    - 保留 OpenAI 专属的请求整形（`service_tier`、`store`、reasoning 兼容、提示缓存提示）

    **代理 / 兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中移除 Completions `store`
    - 接受用于 OpenAI-compatible Completions 代理的高级 `params.extra_body` / `params.extraBody` 直通 JSON
    - 不强制严格工具 schema 或原生专用请求头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因请求头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
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
