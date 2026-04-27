---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中使用 OpenAI 的 API 密钥或 Codex 订阅
title: OpenAI
x-i18n:
    generated_at: "2026-04-27T23:52:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9cce8535a4ed5991fc931783daa8908fd2ba1e6e183ea5bcbbcffcfad9f76bd
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API，而 Codex 也可通过 OpenAI 的 Codex 客户端作为 ChatGPT 计划中的编程智能体使用。OpenClaw 将这些能力面分开处理，以便让配置保持可预测。

OpenClaw 支持三种 OpenAI 家族路由。模型前缀会选择提供商 / 认证路由；单独的运行时设置会选择由谁执行嵌入式 Agent loop：

- **API 密钥** — 通过直接 OpenAI Platform 访问并按用量计费（`openai/*` 模型）
- **通过 PI 使用 Codex 订阅** — 使用 ChatGPT/Codex 登录并通过订阅访问（`openai-codex/*` 模型）
- **Codex app-server harness** — 原生 Codex app-server 执行（`openai/*` 模型，加上 `agents.defaults.agentRuntime.id: "codex"`）

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是彼此独立的层。如果你把这些标签混在了一起，请在修改配置前先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 快速选择

| 目标 | 使用方式 | 说明 |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| 直接使用 API 密钥计费 | `openai/gpt-5.5` | 设置 `OPENAI_API_KEY` 或运行 OpenAI API 密钥新手引导。 |
| 使用 ChatGPT/Codex 订阅认证的 GPT-5.5 | `openai-codex/gpt-5.5` | 适用于 Codex OAuth 的默认 PI 路由。是订阅配置的首选。 |
| 使用原生 Codex app-server 行为的 GPT-5.5 | `openai/gpt-5.5` 加上 `agentRuntime.id: "codex"` | 为该模型引用强制使用 Codex app-server harness。 |
| 图像生成或编辑 | `openai/gpt-image-2` | 可配合 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。 |
| 透明背景图像 | `openai/gpt-image-1.5` | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

## 命名映射

这些名称看起来相似，但不能互换：

| 你看到的名称 | 层级 | 含义 |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai` | 提供商前缀 | 直接 OpenAI Platform API 路由。 |
| `openai-codex` | 提供商前缀 | 通过标准 OpenClaw PI 运行器使用 OpenAI Codex OAuth / 订阅的路由。 |
| `codex` plugin | 插件 | OpenClaw 内置插件，提供原生 Codex app-server 运行时和 `/codex` 聊天控制。 |
| `agentRuntime.id: codex` | Agent 运行时 | 为嵌入式轮次强制使用原生 Codex app-server harness。 |
| `/codex ...` | 聊天命令集 | 在对话中绑定 / 控制 Codex app-server 线程。 |
| `runtime: "acp", agentId: "codex"` | ACP 会话路由 | 通过 ACP/acpx 运行 Codex 的显式回退路径。 |

这意味着一个配置中可以有意同时包含 `openai-codex/*` 和 `codex` plugin。当你希望通过 PI 使用 Codex OAuth，同时也希望原生 `/codex` 聊天控制可用时，这是有效的。`openclaw doctor` 会对这种组合发出警告，以便你确认这是有意为之；它不会重写该配置。

<Note>
GPT-5.5 同时支持直接 OpenAI Platform API 密钥访问和订阅 / OAuth 路由。对直接 `OPENAI_API_KEY` 流量使用 `openai/gpt-5.5`，对通过 PI 使用 Codex OAuth 使用 `openai-codex/gpt-5.5`，或者将 `openai/gpt-5.5` 与 `agentRuntime.id: "codex"` 一起使用以启用原生 Codex app-server harness。
</Note>

<Note>
启用 OpenAI plugin，或选择 `openai-codex/*` 模型，并不会启用内置的 Codex app-server plugin。只有当你显式选择原生 Codex harness（使用 `agentRuntime.id: "codex"`）或使用旧版 `codex/*` 模型引用时，OpenClaw 才会启用该插件。
如果内置的 `codex` plugin 已启用，但 `openai-codex/*` 仍然通过 PI 解析，`openclaw doctor` 会发出警告并保持该路由不变。
</Note>

## OpenClaw 功能覆盖范围

| OpenAI 能力 | OpenClaw 能力面 | Status |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
| Codex 订阅模型 | 带 `openai-codex` OAuth 的 `openai-codex/<model>` | 是 |
| Codex app-server harness | 带 `agentRuntime.id: codex` 的 `openai/<model>` | 是 |
| 服务端 Web 搜索 | 原生 OpenAI Responses 工具 | 是，启用 Web 搜索且未固定提供商时可用 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
| 实时语音 | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是 |
| Embeddings | Memory Wiki 嵌入提供商 | 是 |

## Memory embeddings

OpenClaw 可以将 OpenAI 或与 OpenAI 兼容的嵌入端点用于 `memory_search` 的索引和查询嵌入：

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

对于需要非对称嵌入标签的 OpenAI 兼容端点，请在 `memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw 会将它们作为提供商特定的 `input_type` 请求字段转发：查询嵌入使用 `queryInputType`；索引后的内存分块和批量索引使用 `documentInputType`。完整示例请参阅 [Memory 配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

选择你偏好的认证方式，并按步骤完成设置。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接 API 访问和按用量计费。

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
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 运行时配置 | 路由 | 认证 |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5` | 省略 / `agentRuntime.id: "pi"` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 省略 / `agentRuntime.id: "pi"` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server |

    <Note>
    `openai/*` 默认是直接 OpenAI API 密钥路由，除非你显式强制使用 Codex app-server harness。通过默认 PI 运行器使用 Codex OAuth 时，请使用 `openai-codex/*`；若要原生 Codex app-server 执行，则使用 `openai/gpt-5.5` 并设置 `agentRuntime.id: "codex"`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
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

        对于无头环境或不适合回调的环境，可以添加 `--device-code`，通过 ChatGPT 设备码流程登录，而不是使用 localhost 浏览器回调：

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

    | 模型引用 | 运行时配置 | 路由 | 认证 |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | 通过 PI 使用 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍然是 PI，除非某个插件显式接管 `openai-codex` | Codex 登录 |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server 认证 |

    <Note>
    认证 / 配置文件命令仍应使用 `openai-codex` 提供商 id。`openai-codex/*` 模型前缀也是通过 PI 使用 Codex OAuth 的显式路由。
    它不会选择或自动启用内置的 Codex app-server harness。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上述设备码流程登录——OpenClaw 会在它自己的智能体认证存储中管理生成的凭据。
    </Note>

    ### Status 指示器

    聊天中的 `/status` 会显示当前会话正在使用的模型运行时。
    默认的 PI harness 会显示为 `Runtime: OpenClaw Pi Default`。选择内置 Codex app-server harness 时，`/status` 会显示
    `Runtime: OpenAI Codex`。现有会话会保留其记录的 harness id，因此如果你在更改 `agentRuntime` 后希望 `/status` 反映新的 PI / Codex 选择，请使用
    `/new` 或 `/reset`。

    ### Doctor 警告

    如果启用了内置 `codex` plugin，同时本标签页中选择了
    `openai-codex/*` 路由，`openclaw doctor` 会警告该模型
    仍然通过 PI 解析。如果这正是你想要的订阅认证路由，请保持配置不变。只有当你想要原生 Codex
    app-server 执行时，才切换为 `openai/<model>` 加上
    `agentRuntime.id: "codex"`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    在实际使用中，较小的默认上限通常具有更好的延迟和质量表现。你可以使用 `contextTokens` 覆盖它：

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
    使用 `contextWindow` 来声明模型的原生元数据。使用 `contextTokens` 来限制运行时上下文预算。
    </Note>

    ### 目录恢复

    当存在时，OpenClaw 会对 `gpt-5.5` 使用上游 Codex 目录元数据。如果实时 Codex 发现结果中缺少 `openai-codex/gpt-5.5` 这一行，而账户又已完成认证，OpenClaw 会合成这一 OAuth 模型条目，以避免 cron、子智能体和已配置默认模型的运行因 `Unknown model` 而失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 认证

原生 Codex app-server harness 使用 `openai/*` 模型引用加上
`agentRuntime.id: "codex"`，但其认证仍然基于账户。OpenClaw
按以下顺序选择认证方式：

1. 绑定到该智能体的显式 OpenClaw `openai-codex` 认证配置文件。
2. app-server 的现有账户，例如本地 Codex CLI 的 ChatGPT 登录。
3. 仅对于本地 stdio app-server 启动，若 app-server 报告没有账户且仍需要 OpenAI 认证，则依次使用 `CODEX_API_KEY`，然后是
   `OPENAI_API_KEY`。

这意味着，本地 ChatGPT/Codex 订阅登录不会仅仅因为 Gateway 网关进程也为直接 OpenAI 模型或嵌入配置了 `OPENAI_API_KEY` 而被替换。环境变量 API 密钥回退仅适用于本地 stdio 无账户路径；它不会发送到 WebSocket app-server 连接。当选择订阅式 Codex 配置文件时，OpenClaw 还会将 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 排除在生成的 stdio app-server 子进程之外，并通过 app-server 登录 RPC 发送所选凭据。

## 图像生成

内置的 `openai` plugin 通过 `image_generate` 工具注册图像生成。
它同时支持使用 OpenAI API 密钥进行图像生成，以及通过同一个 `openai/gpt-image-2` 模型引用进行 Codex OAuth 图像生成。

| 能力 | OpenAI API 密钥 | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 认证 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登录 |
| 传输 | OpenAI Images API | Codex Responses 后端 |
| 每次请求的最大图像数 | 4 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图） | 已启用（最多 5 张参考图） |
| 尺寸覆盖 | 支持，包括 2K/4K 尺寸 | 支持，包括 2K/4K 尺寸 |
| 宽高比 / 分辨率 | 不会转发到 OpenAI Images API | 在安全情况下映射到受支持的尺寸 |

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
有关共享工具参数、提供商选择和故障转移行为，请参阅 [图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。对于透明背景的 PNG/WebP 输出，请使用 `openai/gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝
`background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并使用
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；较旧的 `openai.background` 提供商选项仍然受支持。OpenClaw 还会通过将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5` 来保护公共 OpenAI 和
OpenAI Codex OAuth 路由；Azure 和自定义 OpenAI 兼容端点会保留其已配置的部署 / 模型名称。

相同设置也适用于无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，对 `openclaw infer image edit` 也使用相同的 `--output-format` 和 `--background` 标志。
`--openai-background` 仍可作为 OpenAI 专用别名使用。

对于 Codex OAuth 安装，继续使用相同的 `openai/gpt-image-2` 引用。当配置了
`openai-codex` OAuth 配置文件时，OpenClaw 会解析已存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求。对于该请求，它不会先尝试 `OPENAI_API_KEY`，也不会静默回退到 API 密钥。如果你希望改为直接 OpenAI Images API 路由，请使用 API 密钥、自定义 base URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图像端点位于受信任的局域网 / 私有地址上，还需设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；若没有此显式启用项，OpenClaw 会继续阻止私有 / 内部的 OpenAI 兼容图像端点。

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

内置的 `openai` plugin 通过 `video_generate` 工具注册视频生成。

| 能力 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文本生成视频、图像生成视频、单视频编辑 |
| 参考输入 | 1 张图像或 1 个视频 |
| 尺寸覆盖 | 支持 |
| 其他覆盖项 | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并附带工具警告 |

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
有关共享工具参数、提供商选择和故障转移行为，请参阅 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示贡献

OpenClaw 会为跨提供商的 GPT-5 家族运行添加一个共享的 GPT-5 提示贡献。它按模型 id 应用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会获得相同的叠加层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳叠加层，因此即使 Codex 接管了其余的 harness 提示，被强制通过 `agentRuntime.id: "codex"` 运行的 `openai/gpt-5.x` 会话仍会保留相同的后续执行和主动心跳指引。

GPT-5 提示贡献为人格持续性、执行安全、工具纪律、输出形状、完成检查和验证添加了带标签的行为契约。渠道特定的回复和静默消息行为则保留在共享的 OpenClaw 系统提示和出站传递策略中。GPT-5 指引始终对匹配模型启用。友好交互风格层是独立的，并且可配置。

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
当共享设置 `agents.defaults.promptOverlays.gpt5.personality` 未设置时，旧版 `plugins.entries.openai.config.personality` 仍会作为兼容性回退被读取。
</Note>

## 语音与语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` plugin 为 `messages.tts` 能力面注册了语音合成功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音色 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 的 base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` plugin 通过
    OpenClaw 的媒体理解转录能力面注册了批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转录使用
      `tools.media.audio` 的地方都受支持，包括 Discord 语音频道片段和渠道音频附件

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

    当通过共享音频媒体配置或按次转录请求提供语言和提示时，OpenAI 会接收并使用这些提示信息。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` plugin 为 Voice Call plugin 注册了实时转录功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，并采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。此流式提供商用于 Voice Call 的实时转录路径；Discord 语音当前则会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` plugin 为 Voice Call plugin 注册了实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音色 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI，用于后端实时桥接。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器实时会话、由 Gateway 网关签发的临时客户端密钥，以及直接面向 OpenAI Realtime API 的浏览器 WebRTC SDP 交换。维护者可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    进行实时验证；其中 OpenAI 这一侧会在 Node 中签发客户端密钥，使用伪造的麦克风媒体生成浏览器 SDP offer，将其发送给 OpenAI，并在不记录密钥的情况下应用 SDP answer。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` 提供商可以通过覆盖 base URL，将图像生成请求定向到 Azure OpenAI 资源。在图像生成路径上，OpenClaw 会检测 `models.providers.openai.baseUrl` 中的 Azure 主机名，并自动切换到 Azure 的请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 影响。其 Azure 设置请参阅 [语音与语音识别](#voice-and-speech) 下的 **实时语音** 折叠项。
</Note>

在以下情况下可使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内

### 配置

若要通过内置 `openai` 提供商使用 Azure 进行图像生成，请将
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

OpenClaw 会识别以下 Azure 主机后缀，并将其用于 Azure 图像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发送到已识别 Azure 主机的图像生成请求，OpenClaw 会：

- 发送 `api-key` 请求头，而不是 `Authorization: Bearer`
- 使用按部署作用域划分的路径（`/openai/deployments/{deployment}/...`）
- 为每个请求附加 `?api-version=...`
- 对 Azure 图像生成调用使用默认 600 秒请求超时。
  按次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他 base URL（公共 OpenAI、OpenAI 兼容代理）会继续使用标准的
OpenAI 图像请求格式。

<Note>
`openai` 提供商图像生成路径的 Azure 路由要求
OpenClaw 2026.4.22 或更高版本。更早版本会将任何自定义
`openai.baseUrl` 按公共 OpenAI 端点处理，因此无法用于 Azure
图像部署。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可为 Azure 图像生成路径固定某个 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

当该变量未设置时，默认值为 `2024-12-01-preview`。

### 模型名称就是部署名称

Azure OpenAI 会将模型绑定到部署。对于通过内置 `openai` 提供商路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的 **Azure 部署名称**，而不是公共 OpenAI 模型 id。

如果你创建了一个名为 `gpt-image-2-prod` 的部署，用于提供 `gpt-image-2`：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则也适用于通过内置 `openai` 提供商路由的图像生成调用。

### 区域可用性

Azure 图像生成当前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。在创建部署前，请先查看 Microsoft 当前的区域列表，并确认你的区域提供所需的具体模型。

### 参数差异

Azure OpenAI 与公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的某些选项（例如在 `gpt-image-2` 上的某些
`background` 值），或者仅在特定模型版本上提供这些选项。这些差异来自 Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误而失败，请在
Azure 门户中检查你的具体部署和 API 版本所支持的参数集合。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因请求头——请参阅 [高级配置](#advanced-configuration) 下 **原生与 OpenAI 兼容路由** 折叠项。

若要在 Azure 上使用聊天或 Responses 流量（除图像生成外），请使用新手引导流程或专用的 Azure 提供商配置——仅设置 `openai.baseUrl` 并不会自动采用 Azure 的 API / 认证格式。另有单独的
`azure-openai-responses/*` 提供商；请参阅下方的服务端压缩折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    对于 `openai/*` 和 `openai-codex/*`，OpenClaw 都采用 WebSocket 优先并带 SSE 回退（`"auto"`）的方式。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前，对一次早期 WebSocket 失败进行重试
    - 在发生失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次身份请求头
    - 在不同传输变体之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

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
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 提供共享的快速模式开关：

    - **聊天 / UI：** `/fast status|on|off`
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
    OpenAI 的 API 通过 `service_tier` 提供优先处理能力。在 OpenClaw 中可按模型设置：

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
    `serviceTier` 仅会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，OpenClaw 会保留 `service_tier` 原样，不做处理。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI plugin 的 Pi harness 流包装器会自动启用服务端压缩：

    - 强制设置 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi harness 路径，也适用于嵌入式运行所使用的 OpenAI 提供商钩子。原生 Codex app-server harness 则通过 Codex 管理自己的上下文，并通过 `agents.defaults.agentRuntime.id` 单独配置。

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
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制设置 `store: true`，除非兼容性配置将 `supportsStore` 设为 `false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体式 GPT 模式">
    对于 `openai/*` 上的 GPT-5 家族运行，OpenClaw 可以使用更严格的嵌入式执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    在 `strict-agentic` 模式下，OpenClaw 会：
    - 当工具操作可用时，不再将仅有计划的轮次视为成功进展
    - 使用“立即行动”的引导重试该轮次
    - 对于实质性工作自动启用 `update_plan`
    - 如果模型持续只做计划而不执行操作，则显示明确的阻塞状态

    <Note>
    仅适用于 OpenAI 和 Codex 的 GPT-5 家族运行。其他提供商和较旧的模型家族会保留默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 会区别对待直接 OpenAI、Codex 和 Azure OpenAI 端点，以及通用的 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对会拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因请求头
    - 保留 OpenAI 专用请求整形（`service_tier`、`store`、reasoning 兼容性、提示缓存提示）

    **代理 / 兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中移除 Completions `store`
    - 接受面向 OpenAI 兼容 Completions 代理的高级 `params.extra_body` / `params.extraBody` 透传 JSON
    - 接受面向 OpenAI 兼容 Completions 代理（如 vLLM）的 `params.chat_template_kwargs`
    - 不强制使用严格工具 schema 或原生专用请求头

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
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭据复用规则。
  </Card>
</CardGroup>
