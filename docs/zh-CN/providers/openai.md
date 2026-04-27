---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-27T11:00:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ef019ca3d8ed1de0e4ac8da02fec781e71e1ced551034383d7f4d306795193
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API，而 Codex 也可以通过 OpenAI 的 Codex 客户端，作为 ChatGPT 套餐中的编程智能体使用。OpenClaw 将这些 surface 分开处理，以保持配置可预测。

OpenClaw 支持三种 OpenAI 系列路线。模型前缀用于选择
provider/认证路线；单独的运行时设置用于选择由谁执行嵌入式
Agent loop：

- **API 密钥** — 通过按量计费直接访问 OpenAI Platform（`openai/*` 模型）
- **通过 PI 使用 Codex 订阅** — 使用 ChatGPT/Codex 登录并通过订阅访问（`openai-codex/*` 模型）
- **Codex app-server harness** — 原生 Codex app-server 执行（`openai/*` 模型，外加 `agents.defaults.agentRuntime.id: "codex"`）

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用基于订阅的 OAuth。

provider、model、运行时和渠道是相互独立的层。如果你把这些标签混在一起了，请在修改配置之前先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 快速选择

| 目标                                          | 使用方式                                         | 说明                                                                       |
| --------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| 直接使用 API 密钥计费                         | `openai/gpt-5.5`                                 | 设置 `OPENAI_API_KEY` 或运行 OpenAI API 密钥新手引导。                    |
| 使用 ChatGPT/Codex 订阅认证的 GPT-5.5         | `openai-codex/gpt-5.5`                           | Codex OAuth 的默认 PI 路线。是订阅配置的首选方案。                        |
| 使用原生 Codex app-server 行为的 GPT-5.5      | `openai/gpt-5.5` 加 `agentRuntime.id: "codex"`   | 为该模型引用强制使用 Codex app-server harness。                           |
| 图像生成或编辑                                | `openai/gpt-image-2`                             | 可与 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 一起使用。                    |
| 透明背景图像                                  | `openai/gpt-image-1.5`                           | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

## 命名映射

这些名称看起来相似，但不能互换：

| 你看到的名称                       | 层级              | 含义                                                                                   |
| ---------------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `openai`                           | provider 前缀     | 直接的 OpenAI Platform API 路线。                                                      |
| `openai-codex`                     | provider 前缀     | 通过普通 OpenClaw PI 运行器走 OpenAI Codex OAuth/订阅路线。                           |
| `codex` plugin                     | 插件              | OpenClaw 内置插件，提供原生 Codex app-server 运行时和 `/codex` 聊天控制。             |
| `agentRuntime.id: codex`           | Agent 运行时      | 为嵌入式轮次强制使用原生 Codex app-server harness。                                   |
| `/codex ...`                       | 聊天命令集        | 从会话中绑定/控制 Codex app-server 线程。                                             |
| `runtime: "acp", agentId: "codex"` | ACP 会话路线      | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                             |

这意味着一个配置可以有意同时包含 `openai-codex/*` 和
`codex` 插件。当你想通过 PI 使用 Codex OAuth，同时还希望
原生 `/codex` 聊天控制可用时，这是有效的。`openclaw doctor` 会对这种
组合发出警告，以便你确认这是有意为之；它不会改写该配置。

<Note>
GPT-5.5 同时支持通过直接 OpenAI Platform API 密钥访问以及
订阅/OAuth 路线使用。对直接 `OPENAI_API_KEY`
流量，请使用 `openai/gpt-5.5`；对通过 PI 的 Codex OAuth，请使用
`openai-codex/gpt-5.5`；对原生 Codex
app-server harness，请使用带 `agentRuntime.id: "codex"` 的 `openai/gpt-5.5`。
</Note>

<Note>
启用 OpenAI 插件，或选择 `openai-codex/*` 模型，
并不会启用内置 Codex app-server 插件。OpenClaw 仅在
你显式选择原生 Codex harness（`agentRuntime.id: "codex"`）或使用旧版 `codex/*` 模型引用时，
才会启用该插件。
如果内置 `codex` 插件已启用，但 `openai-codex/*` 仍然通过 PI 解析，
`openclaw doctor` 会发出警告，并保持该路线不变。
</Note>

## OpenClaw 功能覆盖范围

| OpenAI 能力               | OpenClaw surface                                           | 状态                                                |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` model provider                            | 是                                                  |
| Codex 订阅模型            | 带 `openai-codex` OAuth 的 `openai-codex/<model>`          | 是                                                  |
| Codex app-server harness  | 带 `agentRuntime.id: codex` 的 `openai/<model>`            | 是                                                  |
| 服务端 Web 搜索           | 原生 OpenAI Responses 工具                                 | 是，启用 Web 搜索且未固定 provider 时可用           |
| 图像                      | `image_generate`                                           | 是                                                  |
| 视频                      | `video_generate`                                           | 是                                                  |
| 文本转语音                | `messages.tts.provider: "openai"` / `tts`                  | 是                                                  |
| 批量语音转文本            | `tools.media.audio` / 媒体理解                             | 是                                                  |
| 流式语音转文本            | Voice Call `streaming.provider: "openai"`                  | 是                                                  |
| 实时语音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是                                                  |
| Embeddings                | memory embedding provider                                  | 是                                                  |

## Memory 嵌入

OpenClaw 可以使用 OpenAI，或兼容 OpenAI 的嵌入端点，来为
`memory_search` 提供索引和查询嵌入：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

对于要求非对称嵌入标签的 OpenAI 兼容端点，请在
`memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw 会将
它们作为 provider 专属的 `input_type` 请求字段转发：查询嵌入使用
`queryInputType`；已索引的 memory 分块和批量索引使用
`documentInputType`。完整示例参见[Memory 配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

选择你偏好的认证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接 API 访问和按量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [OpenAI Platform 控制台](https://platform.openai.com/api-keys) 中创建或复制一个 API 密钥。
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

    ### 路线摘要

    | 模型引用               | 运行时配置                                 | 路线                       | 认证             |
    | ---------------------- | ------------------------------------------ | -------------------------- | ---------------- |
    | `openai/gpt-5.5`       | 省略 / `agentRuntime.id: "pi"`             | 直接 OpenAI Platform API   | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 省略 / `agentRuntime.id: "pi"`             | 直接 OpenAI Platform API   | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`                 | Codex app-server harness   | Codex app-server |

    <Note>
    除非你显式强制使用 Codex app-server harness，否则 `openai/*`
    就是直接的 OpenAI API 密钥路线。对通过
    默认 PI 运行器使用的 Codex OAuth，请使用 `openai-codex/*`；或者使用带
    `agentRuntime.id: "codex"` 的 `openai/gpt-5.5` 进行原生 Codex
    app-server 执行。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不会**暴露 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，而当前 Codex 目录也没有暴露它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，而不是单独的 API 密钥。Codex 云要求使用 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头环境或不适合回调主机的配置，可添加 `--device-code`，改用 ChatGPT 设备码流程登录，而不是本地主机浏览器回调：

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

    ### 路线摘要

    | 模型引用 | 运行时配置 | 路线 | 认证 |
    |-----------|------------|------|------|
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | 通过 PI 使用 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍然走 PI，除非插件显式声明 `openai-codex` | Codex 登录 |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server 认证 |

    <Note>
    对认证/profile 命令，继续使用 `openai-codex` provider id。
    `openai-codex/*` 模型前缀也是通过 PI 使用 Codex OAuth 的显式路线。
    它不会选择或自动启用内置 Codex app-server harness。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备码流程登录 —— OpenClaw 会在自己的智能体认证存储中管理生成的凭证。
    </Note>

    ### 状态指示器

    聊天中的 `/status` 会显示当前会话激活的是哪个模型运行时。
    默认 PI harness 会显示为 `Runtime: OpenClaw Pi Default`。当
    选择内置 Codex app-server harness 时，`/status` 会显示
    `Runtime: OpenAI Codex`。现有会话会保留其记录的 harness id，因此如果你在更改 `agentRuntime` 后希望 `/status`
    反映新的 PI/Codex 选择，请使用 `/new` 或 `/reset`。

    ### Doctor 警告

    如果在选择本标签页中的
    `openai-codex/*` 路线时启用了内置 `codex` 插件，`openclaw doctor` 会警告该模型
    仍然通过 PI 解析。如果这正是你想要的订阅认证路线，请保持配置不变。仅当你想要原生 Codex
    app-server 执行时，才切换到 `openai/<model>` 加
    `agentRuntime.id: "codex"`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    这个更小的默认上限在实践中具有更好的延迟和质量特性。可通过 `contextTokens` 覆盖：

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

    当上游 Codex 目录中存在 `gpt-5.5` 元数据时，OpenClaw 会使用它。
    如果实时 Codex 发现结果中缺少 `openai-codex/gpt-5.5` 这一行，而账户
    已通过认证，OpenClaw 会合成这一 OAuth 模型条目，这样
    cron、子智能体和已配置的默认模型运行就不会因
    `Unknown model` 而失败。

  </Tab>
</Tabs>

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成。
它通过同一个 `openai/gpt-image-2` 模型引用，同时支持基于 OpenAI API 密钥的图像生成和基于 Codex OAuth 的图像
生成。

| 能力                    | OpenAI API 密钥                    | Codex OAuth                           |
| ----------------------- | ---------------------------------- | ------------------------------------- |
| 模型引用                | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| 认证                    | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录               |
| 传输                    | OpenAI Images API                  | Codex Responses 后端                  |
| 每次请求最大图像数      | 4                                  | 4                                     |
| 编辑模式                | 已启用（最多 5 张参考图像）        | 已启用（最多 5 张参考图像）           |
| 尺寸覆盖                | 支持，包括 2K/4K 尺寸              | 支持，包括 2K/4K 尺寸                 |
| 宽高比 / 分辨率         | 不会转发给 OpenAI Images API       | 安全时映射到受支持的尺寸              |

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
共享工具参数、provider 选择和故障转移行为，参见[图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像
编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为
显式模型覆盖项使用。对透明背景
PNG/WebP 输出，请使用 `openai/gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝
`background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并设置
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；旧版的 `openai.background` provider 选项
仍然可用。OpenClaw 还会通过将默认的 `openai/gpt-image-2` 透明背景请求
重写为 `gpt-image-1.5`，来保护公开的 OpenAI 和
OpenAI Codex OAuth 路线；Azure 和自定义 OpenAI 兼容端点会保留
其已配置的 deployment/model 名称。

这个设置也可用于无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，对
`openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 标志。
`--openai-background` 仍然作为 OpenAI 专属别名可用。

对于 Codex OAuth 安装，保持使用同一个 `openai/gpt-image-2` 引用。当
配置了 `openai-codex` OAuth profile 时，OpenClaw 会解析该已存储的 OAuth
访问令牌，并通过 Codex Responses 后端发送图像请求。它
不会先尝试 `OPENAI_API_KEY`，也不会为该请求静默回退到 API 密钥。如果你想使用直接的 OpenAI Images API
路线，请显式配置 `models.providers.openai`，并提供 API 密钥、
自定义 base URL 或 Azure 端点。
如果该自定义图像端点位于受信任的 LAN/私有地址上，还请设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；如果没有这个显式启用项，
OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点。

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

内置 `openai` 插件通过 `video_generate` 工具注册视频生成。

| 能力             | 值                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型         | `openai/sora-2`                                                                   |
| 模式             | 文本生成视频、图像生成视频、单视频编辑                                            |
| 参考输入         | 1 张图像或 1 段视频                                                               |
| 尺寸覆盖         | 支持                                                                              |
| 其他覆盖         | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并附带工具警告        |

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
共享工具参数、provider 选择和故障转移行为，参见[视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词贡献

OpenClaw 会为跨 provider 的 GPT-5 系列运行添加一个共享 GPT-5 提示词贡献。它按模型 id 应用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的覆盖层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和 heartbeat 覆盖层，因此即使 Codex 接管了 harness 提示词的其余部分，那些通过 `agentRuntime.id: "codex"` 强制使用的 `openai/gpt-5.x` 会话，仍会保留相同的后续执行和主动 heartbeat 指导。

GPT-5 贡献会为 persona 持续性、执行安全、工具纪律、输出形态、完成检查和验证添加一个带标签的行为契约。渠道专属的回复和静默消息行为仍保留在共享的 OpenClaw 系统提示词和出站投递策略中。GPT-5 指导对匹配模型始终启用。友好交互风格层是独立且可配置的。

| 值                     | 效果                                  |
| ---------------------- | ------------------------------------- |
| `"friendly"`（默认）   | 启用友好交互风格层                    |
| `"on"`                 | `"friendly"` 的别名                   |
| `"off"`                | 仅禁用友好风格层                      |

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
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 配置时，旧版 `plugins.entries.openai.config.personality` 仍会作为兼容性回退项读取。
</Note>

## 语音和语音处理

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置 `openai` 插件为 `messages.tts` surface 注册语音合成。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便笺为 `opus`，文件为 `mp3` |
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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS base URL，而不影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `openai` 插件通过
    OpenClaw 的媒体理解转录 surface 注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用
      `tools.media.audio`，就支持该能力，包括 Discord 语音频道片段和渠道
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

    当共享音频媒体配置或按调用转录请求
    提供语言和提示词提示时，它们会被转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置 `openai` 插件为 Voice Call 插件注册实时转录。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静默时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，以及 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。这个流式 provider 用于 Voice Call 的实时转录路径；Discord 语音目前仍是录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置 `openai` 插件为 Voice Call 插件注册实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 语音 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静默时长 | `...openai.silenceDurationMs` | `500` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置 `openai` provider 可以通过覆盖 base URL 来定位 Azure OpenAI 资源以进行图像
生成。在图像生成路径上，OpenClaw 会
检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到
Azure 的请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影响。其 Azure
设置参见[语音和语音处理](#voice-and-speech)下的**实时
语音**折叠面板。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有的 Azure 租户内

### 配置

对于通过内置 `openai` provider 使用 Azure 图像生成，请将
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

OpenClaw 会识别以下 Azure 主机后缀，用于 Azure 图像生成
路线：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发往已识别 Azure 主机的图像生成请求，OpenClaw 会：

- 发送 `api-key` 请求头，而不是 `Authorization: Bearer`
- 使用以 deployment 为作用域的路径（`/openai/deployments/{deployment}/...`）
- 为每个请求追加 `?api-version=...`
- 对 Azure 图像生成调用使用默认 600 秒请求超时。
  按调用设置的 `timeoutMs` 仍会覆盖这个默认值。

其他 base URL（公开 OpenAI、OpenAI 兼容代理）会保留标准的
OpenAI 图像请求格式。

<Note>
`openai` provider 图像生成路径的 Azure 路由要求
OpenClaw 2026.4.22 或更高版本。更早版本会把任何自定义
`openai.baseUrl` 当作公开 OpenAI 端点处理，并且会在 Azure
图像 deployment 上失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可为 Azure 图像生成路径固定特定的 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

当该环境变量未设置时，默认值为 `2024-12-01-preview`。

### 模型名称就是 deployment 名称

Azure OpenAI 会将模型绑定到 deployment。对于通过内置 `openai` provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段
必须是你在 Azure 门户中配置的**Azure deployment 名称**，而不是
公开 OpenAI 模型 id。

如果你创建了一个名为 `gpt-image-2-prod`、服务于 `gpt-image-2` 的 deployment：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的 deployment 名称规则也适用于通过内置 `openai` provider 路由的
图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域
可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。在创建
deployment 之前，请查看 Microsoft 当前的区域列表，并确认你的区域提供特定模型。

### 参数差异

Azure OpenAI 和公开 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公开 OpenAI 允许的选项（例如某些
`background` 在 `gpt-image-2` 上的取值），或者仅在特定模型版本上提供这些选项。这些差异来自 Azure 和底层模型，而不是
OpenClaw。如果 Azure 请求因验证错误而失败，请在
Azure 门户中检查你的特定 deployment 和 API 版本所支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因请求头——参见[高级配置](#advanced-configuration)下的**原生与 OpenAI 兼容
路线**折叠面板。

对于 Azure 上的聊天或 Responses 流量（除图像生成之外），请使用
新手引导流程或专用 Azure provider 配置——仅设置 `openai.baseUrl`
不会自动采用 Azure 的 API/认证格式。另有一个独立的
`azure-openai-responses/*` provider；参见
下方的“服务端压缩”折叠面板。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 和 `openai-codex/*` 都采用 WebSocket 优先并回退到 SSE（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前，对一次早期 WebSocket 失败进行重试
    - 失败后，将 WebSocket 标记为降级状态约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次身份请求头
    - 在不同传输变体之间标准化用量计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | WebSocket 优先，回退到 SSE |
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
    OpenClaw 默认对 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以减少首轮延迟。

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
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 暴露了一个共享的快速模式开关：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射为 OpenAI 优先处理（`service_tier = "priority"`）。现有 `service_tier` 值会被保留，快速模式不会改写 `reasoning` 或 `text.verbosity`。

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
    会话覆盖优先于配置。在会话 UI 中清除会话覆盖后，会话将恢复到配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 暴露优先处理。你可以在 OpenClaw 中按模型设置它：

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
    `serviceTier` 仅会被转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一 provider，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 Pi-harness 流封装器会自动启用服务端压缩：

    - 强制 `store: true`（除非模型兼容层设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi harness 路径，也适用于嵌入式运行所使用的 OpenAI provider 钩子。原生 Codex app-server harness 通过 Codex 管理自己的上下文，并通过 `agents.defaults.agentRuntime.id` 单独配置。

    <Tabs>
      <Tab title="显式启用">
        对 Azure OpenAI Responses 之类的兼容端点很有用：

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
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制 `store: true`，除非兼容层将 `supportsStore` 设为 `false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体式 GPT 模式">
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
    - 不再将仅有计划的轮次视为在有可用工具操作时的成功进展
    - 使用“立即行动”的引导重试该轮
    - 对于实质性工作自动启用 `update_plan`
    - 如果模型持续只做计划而不行动，则显式暴露阻塞状态

    <Note>
    仅作用于 OpenAI 和 Codex GPT-5 系列运行。其他 provider 和较早模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生与 OpenAI 兼容路线">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理方式，与通用 OpenAI 兼容 `/v1` 代理不同：

    **原生路线**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对会拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因请求头
    - 保留 OpenAI 专属请求格式（`service_tier`、`store`、reasoning 兼容层、提示词缓存提示）

    **代理/兼容路线：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中移除 Completions `store`
    - 接受面向 OpenAI 兼容 Completions 代理的高级 `params.extra_body`/`params.extraBody` 透传 JSON
    - 接受适用于 vLLM 等 OpenAI 兼容 Completions 代理的 `params.chat_template_kwargs`
    - 不强制严格工具 schema 或原生专用请求头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏的归因请求头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和 provider 选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和 provider 选择。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
