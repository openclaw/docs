---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T02:38:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7e98179f5a7d90289ed6cdad1c4dd03834f42e3fcc747d24c7d29a47e103392
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 为 GPT 模型提供开发者 API，Codex 也可以通过 OpenAI 的 Codex 客户端作为
ChatGPT 计划的编码智能体使用。OpenClaw 将这些
界面分开，以便配置保持可预测。

OpenClaw 支持三条 OpenAI 系列路线。大多数希望获得 Codex 行为的 ChatGPT/Codex 订阅用户
应使用原生 Codex 应用服务器运行时。
模型前缀选择提供商/模型名称；单独的运行时设置选择
由谁执行嵌入式 Agent loop：

- **API key** - 使用按量计费的直接 OpenAI Platform 访问（`openai/*` 模型）
- **带原生 Codex 运行时的 Codex 订阅** - ChatGPT/Codex 登录加 Codex 应用服务器执行（`openai/*` 模型加 `agents.defaults.agentRuntime.id: "codex"`）
- **通过 PI 的 Codex 订阅** - ChatGPT/Codex 登录并使用常规 OpenClaw PI 运行器（`openai-codex/*` 模型）

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是不同层。如果这些标签
混在一起，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再
更改配置。

## 快速选择

| 目标                                                 | 使用                                             | 备注                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| 带原生 Codex 运行时的 ChatGPT/Codex 订阅 | `openai/gpt-5.5` 加 `agentRuntime.id: "codex"` | 推荐给大多数用户的 Codex 设置。使用 `openai-codex` 凭证登录。 |
| 直接 API-key 计费                               | `openai/gpt-5.5`                                 | 设置 `OPENAI_API_KEY` 或运行 OpenAI API-key 新手引导。                    |
| 通过 PI 使用 ChatGPT/Codex 订阅凭证           | `openai-codex/gpt-5.5`                           | 仅在你有意使用常规 PI 运行器时使用。                |
| 图像生成或编辑                          | `openai/gpt-image-2`                             | 可配合 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。                 |
| 透明背景图像                        | `openai/gpt-image-1.5`                           | 使用 `outputFormat=png` 或 `webp` 以及 `openai.background=transparent`。     |

## 命名映射

这些名称相似，但不可互换：

| 你看到的名称                       | 层级             | 含义                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | 提供商前缀   | 直接 OpenAI Platform API 路线。                                                                 |
| `openai-codex`                     | 提供商前缀   | 通过常规 OpenClaw PI 运行器使用的 OpenAI Codex OAuth/订阅路线。                      |
| `codex` plugin                     | 插件            | 内置 OpenClaw 插件，提供原生 Codex 应用服务器运行时和 `/codex` 聊天控制。 |
| `agentRuntime.id: codex`           | Agent runtime     | 强制嵌入式回合使用原生 Codex 应用服务器 harness。                                     |
| `/codex ...`                       | 聊天命令集  | 从对话中绑定/控制 Codex 应用服务器线程。                                        |
| `runtime: "acp", agentId: "codex"` | ACP 会话路线 | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                          |

这意味着配置可以有意同时包含 `openai-codex/*` 和
`codex` 插件。当你希望通过 PI 使用 Codex OAuth，同时也希望
原生 `/codex` 聊天控制可用时，这是有效的。`openclaw doctor` 会警告
该组合，以便你确认这是有意为之；它不会重写该配置。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API-key 访问和
订阅/OAuth 路线使用。对于 ChatGPT/Codex 订阅加原生 Codex
执行，请使用带 `agentRuntime.id: "codex"` 的 `openai/gpt-5.5`。仅在通过 PI 使用 Codex OAuth 时使用
`openai-codex/gpt-5.5`，或者在不使用 Codex 运行时覆盖的情况下使用 `openai/gpt-5.5`
来处理直接 `OPENAI_API_KEY` 流量。
</Note>

<Note>
启用 OpenAI 插件，或选择 `openai-codex/*` 模型，并不会
启用内置 Codex 应用服务器插件。OpenClaw 只会在你显式选择原生 Codex harness，
即使用 `agentRuntime.id: "codex"`，或使用旧版 `codex/*` 模型引用时
启用该插件。
如果内置 `codex` 插件已启用，但 `openai-codex/*` 仍通过
PI 解析，`openclaw doctor` 会发出警告并保持路线不变。
</Note>

## OpenClaw 功能覆盖

| OpenAI 能力         | OpenClaw 界面                                           | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses          | `openai/<model>` 模型提供商                            | 是                                                    |
| Codex 订阅模型 | 带 `openai-codex` OAuth 的 `openai-codex/<model>`           | 是                                                    |
| Codex 应用服务器 harness  | 带 `agentRuntime.id: codex` 的 `openai/<model>`             | 是                                                    |
| 服务端网页搜索    | 原生 OpenAI Responses 工具                               | 是，在网页搜索已启用且未固定提供商时 |
| 图像                    | `image_generate`                                           | 是                                                    |
| 视频                    | `video_generate`                                           | 是                                                    |
| 文本转语音            | `messages.tts.provider: "openai"` / `tts`                  | 是                                                    |
| 批量语音转文本      | `tools.media.audio` / 媒体理解                  | 是                                                    |
| 流式语音转文本  | Voice Call `streaming.provider: "openai"`                  | 是                                                    |
| 实时语音            | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是                                                    |
| 嵌入                | 记忆嵌入提供商                                  | 是                                                    |

## 记忆嵌入

OpenClaw 可以使用 OpenAI 或 OpenAI 兼容的嵌入端点，为
`memory_search` 索引和查询嵌入提供支持：

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

对于需要非对称嵌入标签的 OpenAI 兼容端点，请在
`memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw 会将
它们作为提供商特定的 `input_type` 请求字段转发：查询嵌入使用
`queryInputType`；已索引的记忆片段和批量索引使用
`documentInputType`。完整示例见 [记忆配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

选择你偏好的凭证方法，并按照设置步骤操作。

<Tabs>
  <Tab title="API key（OpenAI Platform）">
    **最适合：** 直接 API 访问和按量计费。

    <Steps>
      <Step title="获取你的 API key">
        从 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 创建或复制 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接传入 key：

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

    | 模型引用              | 运行时配置             | 路线                       | 凭证             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex 应用服务器 harness    | Codex 应用服务器 |

    <Note>
    `openai/*` 是直接 OpenAI API-key 路线，除非你显式强制
    使用 Codex 应用服务器 harness。通过默认 PI 运行器使用 Codex OAuth 时请使用 `openai-codex/*`，
    或使用带 `agentRuntime.id: "codex"` 的 `openai/gpt-5.5`
    进行原生 Codex 应用服务器执行。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不**公开 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，当前 Codex 目录也不公开它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅并通过原生 Codex 应用服务器执行，而不是使用单独的 API key。Codex 云端需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头或不便使用回调的设置，请添加 `--device-code`，改用 ChatGPT 设备码流程登录，而不是 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用原生 Codex 运行时">
        ```bash
        openclaw config set plugins.entries.codex '{ enabled: true }' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{ id: "codex", fallback: "none" }' --strict-json
        ```
      </Step>
      <Step title="验证 Codex 凭证可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 网关运行后，在聊天中发送 `/codex status` 或 `/codex models`
        来验证原生应用服务器运行时。
      </Step>
    </Steps>

    ### 路线摘要

    | 模型引用 | 运行时配置 | 路线 | 凭证 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | 原生 Codex 应用服务器 harness | Codex 登录或所选 `openai-codex` 配置文件 |
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | 通过 PI 使用 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.4-mini` | 省略 / `runtime: "pi"` | 通过 PI 使用 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍是 PI，除非某个插件显式声明 `openai-codex` | Codex 登录 |

    <Note>
    继续将 `openai-codex` provider id 用于凭证/profile 命令。
    `openai-codex/*` 模型前缀也是 Codex OAuth 的显式 PI 路由。
    它不会选择或自动启用内置的 Codex app-server harness。对于常见的订阅加原生运行时设置，请使用
    `openai-codex` 登录，但将模型引用保持为 `openai/gpt-5.5`，并设置
    `agentRuntime.id: "codex"`。
    </Note>

    ### 配置示例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    若要改为在普通 PI runner 上保留 Codex OAuth，请使用
    `openai-codex/gpt-5.5`，并省略 Codex 运行时覆盖。

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备代码流程登录，OpenClaw 会在自己的智能体凭证存储中管理生成的凭证。
    </Note>

    ### Status 指示器

    聊天 `/status` 会显示当前会话正在使用哪个模型运行时。
    默认 PI harness 会显示为 `Runtime: OpenClaw Pi Default`。选择内置的
    Codex app-server harness 时，`/status` 会显示
    `Runtime: OpenAI Codex`。现有会话会保留其记录的 harness id，因此如果你希望
    `/status` 反映新的 PI/Codex 选择，请在更改 `agentRuntime` 后使用
    `/new` 或 `/reset`。

    ### Doctor 警告

    如果在已启用内置 `codex` 插件的同时选择了 `openai-codex/*` 路由，
    `openclaw doctor` 会警告该模型仍通过 PI 解析。只有在有意使用该 PI 订阅凭证路由时，才保持配置不变。当你需要原生 Codex app-server 执行时，请切换到
    `openai/<model>` 加 `agentRuntime.id: "codex"`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。可使用 `contextTokens` 覆盖它：

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

    ### 目录恢复

    当存在上游 Codex 目录元数据时，OpenClaw 会将其用于 `gpt-5.5`。如果 live Codex 设备发现遗漏了 `openai-codex/gpt-5.5` 行，而账户已通过身份验证，OpenClaw 会合成该 OAuth 模型行，避免 cron、子智能体和配置的默认模型运行因
    `Unknown model` 失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 凭证

原生 Codex app-server harness 使用 `openai/*` 模型引用加
`agentRuntime.id: "codex"`，但其凭证仍基于账户。OpenClaw 按以下顺序选择凭证：

1. 绑定到智能体的显式 OpenClaw `openai-codex` 凭证 profile。
2. app-server 的现有账户，例如本地 Codex CLI ChatGPT 登录。
3. 仅对于本地 stdio app-server 启动，当 app-server 报告没有账户但仍需要 OpenAI 凭证时，依次使用 `CODEX_API_KEY`、`OPENAI_API_KEY`。

这意味着本地 ChatGPT/Codex 订阅登录不会仅因为 Gateway 网关进程也为直接 OpenAI 模型或嵌入提供了 `OPENAI_API_KEY` 就被替换。环境变量 API 密钥回退仅适用于本地 stdio 无账户路径；它不会发送到 WebSocket app-server 连接。选择订阅风格的 Codex profile 时，OpenClaw 还会避免将 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 放入生成的 stdio app-server 子进程，并通过 app-server 登录 RPC 发送所选凭证。

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成。
它通过同一个 `openai/gpt-image-2` 模型引用同时支持 OpenAI API 密钥图像生成和 Codex OAuth 图像生成。

| 能力                      | OpenAI API 密钥                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 凭证                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录              |
| 传输协议                  | OpenAI Images API                  | Codex Responses 后端                 |
| 每个请求的最大图像数      | 4                                  | 4                                    |
| 编辑模式                  | 已启用（最多 5 张参考图像）        | 已启用（最多 5 张参考图像）          |
| 尺寸覆盖                  | 支持，包括 2K/4K 尺寸              | 支持，包括 2K/4K 尺寸                |
| 宽高比 / 分辨率           | 不转发到 OpenAI Images API         | 在安全时映射到受支持的尺寸          |

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
请参阅 [图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

`gpt-image-2` 是 OpenAI 文本到图像生成和图像编辑的默认值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。对于透明背景
PNG/WebP 输出，请使用 `openai/gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝
`background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并设置
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；较旧的 `openai.background` 提供商选项仍会被接受。OpenClaw 还会保护公开 OpenAI 和
OpenAI Codex OAuth 路由，将默认 `openai/gpt-image-2` 透明请求改写为 `gpt-image-1.5`；Azure 和自定义 OpenAI 兼容端点会保留其配置的部署/模型名称。

同一设置也暴露给无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，请对 `openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 标志。
`--openai-background` 仍可作为 OpenAI 专用别名使用。

对于 Codex OAuth 安装，请保留相同的 `openai/gpt-image-2` 引用。配置了
`openai-codex` OAuth profile 时，OpenClaw 会解析该已存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY`，也不会为该请求静默回退到 API 密钥。当你需要改用直接 OpenAI Images API 路由时，请使用 API 密钥、自定义 base URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图像端点位于可信 LAN/专用地址上，还需设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此选择加入项，否则 OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点。

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

| 能力         | 值                                                                                |
| ------------ | --------------------------------------------------------------------------------- |
| 默认模型     | `openai/sora-2`                                                                   |
| 模式         | 文本到视频、图像到视频、单视频编辑                                               |
| 参考输入     | 1 张图像或 1 个视频                                                               |
| 尺寸覆盖     | 支持                                                                              |
| 其他覆盖     | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并显示工具警告        |

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
请参阅 [视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

## GPT-5 提示贡献

OpenClaw 为各提供商上的 GPT-5 系列运行添加共享的 GPT-5 提示贡献。它按模型 id 应用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 和其他兼容 GPT-5 引用都会收到同一叠加层。较旧的 GPT-4.x 模型不会收到。

内置原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和 Heartbeat 叠加层，因此强制通过 `agentRuntime.id: "codex"` 运行的 `openai/gpt-5.x` 会话会保留相同的跟进执行和主动 Heartbeat 指引，即使 Codex 拥有 harness 提示的其余部分。

GPT-5 贡献会为 persona 持久性、执行安全、工具纪律、输出形态、完成检查和验证添加带标签的行为契约。特定渠道的回复和静默消息行为仍保留在共享 OpenClaw 系统提示和出站投递策略中。匹配模型始终启用 GPT-5 指引。友好的交互风格层是独立且可配置的。

| 值                     | 效果                         |
| ---------------------- | ---------------------------- |
| `"friendly"`（默认）   | 启用友好的交互风格层         |
| `"on"`                 | `"friendly"` 的别名          |
| `"off"`                | 仅禁用友好风格层             |

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
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 设置时，旧版 `plugins.entries.openai.config.personality` 仍会作为兼容性回退读取。
</Note>

## 语音和语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置 `openai` 插件为 `messages.tts` surface 注册语音合成。

    | 设置项 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音消息为 `opus`，文件为 `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | 基础 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 额外正文 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未设置） |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成字段之后合并到 `/audio/speech` 请求 JSON 中，因此可将它用于需要额外键（如 `lang`）的 OpenAI 兼容端点。原型键会被忽略。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `openai` 插件会通过 OpenClaw 的媒体理解转写表面注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中凡是入站音频转写使用 `tools.media.audio` 的地方都受支持，包括 Discord 语音频道片段和渠道音频附件

    若要强制入站音频转写使用 OpenAI：

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

    当共享音频媒体配置或逐次调用的转写请求提供语言和提示词提示时，它们会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转写">
    内置 `openai` 插件会为 Voice Call 插件注册实时转写。

    | 设置项 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。此流式提供商用于 Voice Call 的实时转写路径；Discord 语音目前会录制短片段，并改用批量 `tools.media.audio` 转写路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置 `openai` 插件会为 Voice Call 插件注册实时语音。

    | 设置项 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 语音 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI，用于后端实时桥接。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器实时会话，通过 Gateway 网关签发的临时客户端密钥，以及浏览器直接针对 OpenAI Realtime API 的 WebRTC SDP 交换。维护者可使用 `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 进行实时验证；OpenAI 分支会在 Node 中签发客户端密钥，使用虚拟麦克风媒体生成浏览器 SDP offer，将其发布到 OpenAI，并应用 SDP answer，且不记录密钥。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置 `openai` 提供商可以通过覆盖基础 URL，将图像生成指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw 会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到 Azure 的请求形态。

<Note>
实时语音使用单独的配置路径（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 影响。有关它的 Azure 设置，请参阅 [语音与语音处理](#voice-and-speech) 下的 **实时语音** 折叠项。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户中

### 配置

若要通过内置 `openai` 提供商使用 Azure 图像生成，请将 `models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为 Azure OpenAI key（而不是 OpenAI Platform key）：

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

OpenClaw 会为 Azure 图像生成路由识别以下 Azure 主机后缀：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于识别出的 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用 deployment 范围路径（`/openai/deployments/{deployment}/...`）
- 为每个请求追加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。逐次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）会保留标准 OpenAI 图像请求形态。

<Note>
`openai` 提供商图像生成路径的 Azure 路由需要 OpenClaw 2026.4.22 或更高版本。更早版本会像处理公共 OpenAI 端点一样处理任何自定义 `openai.baseUrl`，并且会在访问 Azure 图像 deployment 时失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION`，为 Azure 图像生成路径固定特定 Azure preview 或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置该变量时，默认值为 `2024-12-01-preview`。

### 模型名称就是 deployment 名称

Azure OpenAI 会将模型绑定到 deployment。对于通过内置 `openai` 提供商路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的 **Azure deployment 名称**，而不是公共 OpenAI 模型 ID。

如果你创建了名为 `gpt-image-2-prod` 的 deployment 来提供 `gpt-image-2`：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的 deployment 名称规则也适用于通过内置 `openai` 提供商路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。创建 deployment 前请查看 Microsoft 当前区域列表，并确认你的区域提供该特定模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。Azure 可能会拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些 `background` 值），或仅在特定模型版本上公开它们。这些差异来自 Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误而失败，请在 Azure 门户中检查你的特定 deployment 和 API 版本支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收 OpenClaw 的隐藏归因标头——请参阅 [高级配置](#advanced-configuration) 下的 **原生路由与 OpenAI 兼容路由** 折叠项。

对于 Azure 上的聊天或 Responses 流量（超出图像生成范围），请使用 新手引导 流程或专用 Azure 提供商配置——仅设置 `openai.baseUrl` 不会启用 Azure API/鉴权形态。存在一个单独的 `azure-openai-responses/*` 提供商；请参阅下面的服务器端压缩折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    对 `openai/*` 和 `openai-codex/*`，OpenClaw 都采用 WebSocket 优先，并以 SSE 作为回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 之前重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重新连接附加稳定的会话与轮次身份标头
    - 在传输变体之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

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
    - [Streaming API responses（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 预热">
    OpenClaw 默认为 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以降低首轮延迟。

    ```json5
    // Disable warm-up
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
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 公开共享的快速模式开关：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI priority processing（`service_tier = "priority"`）。现有 `service_tier` 值会被保留，且快速模式不会重写 `reasoning` 或 `text.verbosity`。

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
    会话覆盖优先于配置。在 Sessions UI 中清除会话覆盖会让会话回到已配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 公开优先处理。在 OpenClaw 中按模型设置它：

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
    `serviceTier` 只会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 Pi harness 流包装器会自动启用服务端压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi harness 路径，以及嵌入式运行使用的 OpenAI provider 钩子。原生 Codex 应用服务器 harness 通过 Codex 管理自己的上下文，并通过 `agents.defaults.agentRuntime.id` 单独配置。

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
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

    使用 `strict-agentic` 时，OpenClaw：
    - 当工具操作可用时，不再将仅计划的轮次视为成功进展
    - 使用立即行动引导重试该轮次
    - 对实质性工作自动启用 `update_plan`
    - 如果模型持续规划而不行动，则呈现明确的受阻状态

    <Note>
    仅限 OpenAI 和 Codex GPT-5 系列运行。其他提供商和较旧的模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理不同于通用 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对会拒绝 `reasoning.effort: "none"` 的模型或代理省略已禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头
    - 保留仅 OpenAI 使用的请求整形（`service_tier`、`store`、reasoning 兼容性、提示缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` payload 中移除 Completions `store`
    - 接受高级 `params.extra_body`/`params.extraBody` 透传 JSON，用于 OpenAI 兼容的 Completions 代理
    - 接受 `params.chat_template_kwargs`，用于 vLLM 等 OpenAI 兼容的 Completions 代理
    - 不强制使用严格工具 schema 或仅原生使用的标头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因标头。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="OAuth and auth" href="/zh-CN/gateway/authentication" icon="key">
    认证详情和凭证复用规则。
  </Card>
</CardGroup>
