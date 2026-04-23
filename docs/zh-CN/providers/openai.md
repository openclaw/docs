---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T23:39:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3445cab47caa324314c115fb968f13c2910954b685b68a17ab9228e3184fa14
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API。OpenClaw 支持三种 OpenAI 系列接入路径。模型前缀决定所用路径：

- **API 密钥** — 直接访问 OpenAI Platform，并按使用量计费（`openai/*` 模型）
- **通过 PI 的 Codex 订阅** — 使用 ChatGPT/Codex 登录并通过订阅访问（`openai-codex/*` 模型）
- **Codex app-server harness** — 原生 Codex app-server 执行（`openai/*` 模型，外加 `agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

<Note>
GPT-5.5 当前可通过订阅 / OAuth 路径在 OpenClaw 中使用：
通过 PI runner 使用 `openai-codex/gpt-5.5`，或通过
Codex app-server harness 使用 `openai/gpt-5.5`。对 `openai/gpt-5.5` 的直接 API 密钥访问
会在 OpenAI 为公共 API 启用 GPT-5.5 后得到支持；在此之前，请在
`OPENAI_API_KEY` 配置中使用已启用 API 的模型，例如 `openai/gpt-5.4`。
</Note>

## OpenClaw 功能覆盖范围

| OpenAI 能力 | OpenClaw 表面 | 状态 |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
| Codex 订阅模型 | 带 `openai-codex` OAuth 的 `openai-codex/<model>` | 是 |
| Codex app-server harness | 带 `embeddedHarness.runtime: codex` 的 `openai/<model>` | 是 |
| 服务端 Web 搜索 | 原生 OpenAI Responses 工具 | 是，在启用 Web 搜索且未固定 provider 时 |
| 图片 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
| 实时语音 | Voice Call `realtime.provider: "openai"` | 是 |
| Embeddings | memory embedding provider | 是 |

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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路径摘要

    | 模型引用 | 路径 | 认证 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAI 在 API 上启用 GPT-5.5 后的未来直接 API 路径 | `OPENAI_API_KEY` |

    <Note>
    `openai/*` 是直接 OpenAI API 密钥路径，除非你显式强制使用
    Codex app-server harness。GPT-5.5 本身当前仅支持订阅 / OAuth；
    如需通过默认 PI runner 使用 Codex OAuth，请使用 `openai-codex/*`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **不**提供 `openai/gpt-5.3-codex-spark`。实际的 OpenAI API 请求会拒绝该模型，当前 Codex 目录也同样未提供它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，而不是单独的 API 密钥。Codex cloud 需要使用 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头环境或不适合回调主机的设置，可添加 `--device-code`，通过 ChatGPT 设备码流程登录，而不是使用 localhost 浏览器回调：

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

    ### 路径摘要

    | 模型引用 | 路径 | 认证 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | 通过 PI 的 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server 认证 |

    <Note>
    对认证 / 配置文件命令，请继续使用 `openai-codex` provider id。
    `openai-codex/*` 模型前缀也是 Codex OAuth 的显式 PI 路径。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备码流程登录——OpenClaw 会在它自己的智能体认证存储中管理生成的凭证。
    </Note>

    ### 状态指示器

    聊天中的 `/status` 会显示当前
    会话所使用的 embedded harness。默认的 PI harness 显示为 `Runner: pi (embedded)`，且
    不会额外添加单独标记。选中内置的 Codex app-server harness 时，
    `/status` 会在 `Fast` 旁追加非 PI harness id，例如
    `Fast · codex`。已有会话会保留其记录的 harness id，因此如果你在更改 `embeddedHarness` 后希望 `/status`
    反映新的 PI/Codex 选择，请使用 `/new` 或 `/reset`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据与运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    在实践中，较小的默认上限通常具有更好的延迟和质量表现。你可以使用 `contextTokens` 覆盖它：

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

  </Tab>
</Tabs>

## 图片生成

内置的 `openai` 插件通过 `image_generate` 工具注册图片生成功能。
它同时支持 OpenAI API 密钥图片生成，以及通过同一个 `openai/gpt-image-2` 模型引用进行的
Codex OAuth 图片生成。

| 能力 | OpenAI API 密钥 | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 认证 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登录 |
| 传输 | OpenAI Images API | Codex Responses 后端 |
| 每次请求的最大图片数 | 4 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图片） | 已启用（最多 5 张参考图片） |
| 尺寸覆盖 | 支持，包括 2K/4K 尺寸 | 支持，包括 2K/4K 尺寸 |
| 宽高比 / 分辨率 | 不会转发到 OpenAI Images API | 在安全可行时映射为受支持的尺寸 |

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
有关共享工具参数、provider 选择和故障切换行为，请参见 [图片生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图与图片编辑的默认模型。
`gpt-image-1` 仍可作为显式模型覆盖来使用，但新的
OpenAI 图片工作流应使用 `openai/gpt-image-2`。

对于 Codex OAuth 安装，请保持使用同一个 `openai/gpt-image-2` 引用。当
配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会解析该存储的 OAuth
访问令牌，并通过 Codex Responses 后端发送图片请求。它不会先尝试 `OPENAI_API_KEY`，也不会在该
请求中静默回退到 API 密钥。如果你想使用直接 OpenAI Images API
路径，请使用 API 密钥、自定义 base URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图片端点位于受信任的局域网 / 私有地址上，还要设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；若没有这个显式启用项，
OpenClaw 会继续阻止私有 / 内部的 OpenAI 兼容图片端点。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

编辑：

```
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
有关共享工具参数、provider 选择和故障切换行为，请参见 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词贡献

OpenClaw 会为跨 provider 的 GPT-5 系列运行添加共享的 GPT-5 提示词贡献。它按模型 id 应用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.4`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的覆盖层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和 heartbeat 覆盖层，因此，即使 Codex 接管了 harness 提示词的其余部分，通过 `embeddedHarness.runtime: "codex"` 强制使用的 `openai/gpt-5.x` 会话，仍会保留相同的后续执行与主动 heartbeat 指导。

GPT-5 提示词贡献增加了一个带标签的行为契约，涵盖 persona 持续性、执行安全性、工具纪律、输出结构、完成检查和验证。渠道特定的回复和静默消息行为仍保留在共享的 OpenClaw 系统提示词和出站投递策略中。GPT-5 指导对匹配的模型始终启用。友好的交互风格层则是独立且可配置的。

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
运行时对值大小写不敏感，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 配置时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音与音频

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 表面注册了语音合成功能。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 的 base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过
    OpenClaw 的媒体理解转写表面注册了批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转写使用
      `tools.media.audio`，就支持该功能，包括 Discord 语音频道片段和渠道
      音频附件

    要为入站音频转写强制使用 OpenAI：

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

    当共享音频媒体配置或每次调用的转写请求提供了语言和提示信息时，这些信息会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转写">
    内置的 `openai` 插件为 Voice Call 插件注册了实时转写功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，并采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。这一流式 provider 用于 Voice Call 的实时转写路径；Discord 语音当前仍会录制短片段，并改用批量 `tools.media.audio` 转写路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册了实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 语音 | `...openai.voice` | `alloy` |
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

内置的 `openai` provider 可通过覆盖 base URL 将图片生成请求定向到 Azure OpenAI 资源。在图片生成路径中，OpenClaw 会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到 Azure 的请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影响。其 Azure
设置请参见 [语音与音频](#voice-and-speech) 下 **实时语音**
折叠面板。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内部

### 配置

对于通过内置 `openai` provider 进行的 Azure 图片生成，请将
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

OpenClaw 会将以下 Azure 主机后缀识别为 Azure 图片生成
路径：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发往已识别 Azure 主机的图片生成请求，OpenClaw 会：

- 发送 `api-key` 头，而不是 `Authorization: Bearer`
- 使用按 deployment 划分的路径（`/openai/deployments/{deployment}/...`）
- 为每个请求追加 `?api-version=...`

其他 base URL（公共 OpenAI、OpenAI 兼容代理）会继续使用标准的
OpenAI 图片请求格式。

<Note>
`openai` provider 的 Azure 图片生成路径需要
OpenClaw 2026.4.22 或更高版本。更早版本会将任何自定义
`openai.baseUrl` 视为公共 OpenAI 端点处理，因此在 Azure
图片 deployment 上会失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可为 Azure 图片生成路径固定特定的 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

当该变量未设置时，默认值为 `2024-12-01-preview`。

### 模型名称就是 deployment 名称

Azure OpenAI 会将模型绑定到 deployment。对于通过内置 `openai` provider 路由的 Azure 图片生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的 **Azure deployment 名称**，而不是公共 OpenAI 模型 id。

如果你创建了一个名为 `gpt-image-2-prod`、服务于 `gpt-image-2` 的 deployment：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的 deployment 名称规则也适用于通过内置 `openai` provider 路由的图片生成调用。

### 区域可用性

Azure 图片生成当前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。在创建 deployment 之前，请先检查 Microsoft 当前的
区域列表，并确认你的区域提供了相应的特定模型。

### 参数差异

Azure OpenAI 与公共 OpenAI 并不总是接受相同的图片参数。
Azure 可能会拒绝公共 OpenAI 允许的某些选项（例如在 `gpt-image-2` 上的某些
`background` 值），或者只在特定模型版本上提供这些选项。这些差异来自 Azure 和底层模型本身，而不是
OpenClaw。如果 Azure 请求因验证错误失败，请在
Azure 门户中检查你的特定 deployment 和 API 版本所支持的
参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因头——请参见 [高级配置](#advanced-configuration) 下
**原生与 OpenAI 兼容路径**
折叠面板。

如果你要在 Azure 上处理聊天或 Responses 流量（不仅仅是图片生成），请使用
新手引导流程或专用的 Azure provider 配置——仅设置 `openai.baseUrl`
并不会启用 Azure 的 API / 认证格式。另有单独的
`azure-openai-responses/*` provider；请参见
下面的“服务端压缩”折叠面板。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    对于 `openai/*` 和 `openai-codex/*`，OpenClaw 默认都使用 WebSocket 优先、SSE 回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前，重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级状态约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次标识头
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
    OpenClaw 默认对 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以减少首轮延迟。

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

  <Accordion title="Fast 模式">
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 提供了共享的 Fast 模式切换：

    - **聊天 / UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将 Fast 模式映射为 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，Fast 模式不会重写 `reasoning` 或 `text.verbosity`。

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
    会话覆盖的优先级高于配置。在 Sessions UI 中清除会话覆盖后，会话会恢复为配置中的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 提供优先处理能力。你可以在 OpenClaw 中按模型设置它：

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
    `serviceTier` 只会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一 provider，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（位于 `api.openai.com` 的 `openai/*`），OpenClaw 会自动启用服务端压缩：

    - 强制设置 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（如不可用则为 `80000`）

    <Tabs>
      <Tab title="显式启用">
        对 Azure OpenAI Responses 这类兼容端点很有用：

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
    `responsesServerCompaction` 只控制 `context_management` 的注入。直接 OpenAI Responses 模型仍会强制设置 `store: true`，除非兼容性设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体 GPT 模式">
    对于运行在 `openai/*` 上的 GPT-5 系列，OpenClaw 可以使用更严格的嵌入式执行契约：

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
    - 当工具操作可用时，不再将仅规划的轮次视为成功进展
    - 通过“立即行动”的引导重试该轮
    - 为实质性工作自动启用 `update_plan`
    - 如果模型持续规划而不行动，则显示明确的阻塞状态

    <Note>
    仅作用于 OpenAI 和 Codex 的 GPT-5 系列运行。其他 provider 和较旧模型系列会保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生与 OpenAI 兼容路径">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理方式，与通用 OpenAI 兼容 `/v1` 代理不同：

    **原生路径**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用推理设置
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因头
    - 保留 OpenAI 专属的请求整形（`service_tier`、`store`、reasoning 兼容性、提示词缓存提示）

    **代理 / 兼容路径：**
    - 使用更宽松的兼容行为
    - 不强制严格工具 schema，也不附加原生专用头

    Azure OpenAI 使用原生传输与兼容行为，但不会接收隐藏归因头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障切换行为。
  </Card>
  <Card title="图片生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图片工具参数与 provider 选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数与 provider 选择。
  </Card>
  <Card title="OAuth 与认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节与凭证复用规则。
  </Card>
</CardGroup>
