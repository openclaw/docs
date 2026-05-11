---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 为 GPT 模型提供开发者 API，Codex 也可通过 OpenAI 的 Codex 客户端作为
ChatGPT 计划中的编码智能体使用。OpenClaw 将这些接入面保持分离，让配置保持可预测。

OpenClaw 使用 `openai/*` 作为规范的 OpenAI 模型路由。OpenAI 模型上的嵌入式智能体
轮次默认通过原生 Codex 应用服务器运行时执行；直接的 OpenAI API key 凭证仍可用于图像、嵌入、语音和 realtime 等非智能体 OpenAI
接入面。

- **智能体模型** - 通过 Codex 运行时使用 `openai/*` 模型；如果要使用 ChatGPT/Codex 订阅，请用
  Codex 凭证登录；如果你有意使用 API key 凭证，请配置一个兼容 Codex 的
  OpenAI API key 备用项。
- **非智能体 OpenAI API** - 通过 `OPENAI_API_KEY` 或 OpenAI API key 新手引导，直接访问 OpenAI Platform，并按用量计费。
- **旧版配置** - `openai-codex/*` 模型引用会由
  `openclaw doctor --fix` 修复为 `openai/*` 加 Codex 运行时。

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是彼此独立的层。如果这些标签混在一起，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再更改配置。

## 快速选择

| 目标                                                 | 使用                                                      | 备注                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅 | `openai/gpt-5.5`                                         | 默认 OpenAI 智能体设置。使用 Codex 凭证登录。                  |
| 智能体模型的直接 API key 计费              | `openai/gpt-5.5` 加一个兼容 Codex 的 API key 配置文件 | 使用 `auth.order.openai` 将备用项放在订阅凭证之后。  |
| 通过显式 PI 进行直接 API key 计费           | `openai/gpt-5.5` 加提供商/模型运行时 `pi`        | 选择普通的 `openai` API key 配置文件。                             |
| 最新 ChatGPT Instant API 别名                     | `openai/chat-latest`                                     | 仅限直接 API key。用于实验的移动别名，不是默认值。   |
| 通过显式 PI 使用 ChatGPT/Codex 订阅凭证  | `openai/gpt-5.5` 加提供商/模型运行时 `pi`        | 为兼容性路由选择一个 `openai-codex` 凭证配置文件。    |
| 图像生成或编辑                          | `openai/gpt-image-2`                                     | 可配合 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。             |
| 透明背景图像                        | `openai/gpt-image-1.5`                                   | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

## 命名映射

这些名称相似，但不能互换：

| 你看到的名称                            | 层                      | 含义                                                                                                              |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | 提供商前缀            | 规范 OpenAI 模型路由；智能体轮次使用 Codex 运行时。                                                     |
| `openai-codex`                          | 旧版凭证/配置文件前缀 | 较旧的 OpenAI Codex OAuth/订阅配置文件命名空间。现有配置文件和 `auth.order.openai-codex` 仍然可用。 |
| `codex` 插件                          | 插件                     | 内置 OpenClaw 插件，提供原生 Codex 应用服务器运行时和 `/codex` 聊天控制。                    |
| 提供商/模型 `agentRuntime.id: codex` | Agent Runtimes              | 强制对匹配的嵌入式轮次使用原生 Codex 应用服务器 harness。                                               |
| `/codex ...`                            | 聊天命令集           | 从会话中绑定/控制 Codex 应用服务器线程。                                                           |
| `runtime: "acp", agentId: "codex"`      | ACP 会话路由          | 通过 ACP/acpx 运行 Codex 的显式备用路径。                                                             |

这意味着配置可以有意包含 `openai/*` 模型引用，同时凭证配置文件仍指向兼容 Codex 的凭据。新配置优先使用 `auth.order.openai`；现有 `openai-codex:*` 配置文件和 `auth.order.openai-codex`
仍受支持。`openclaw doctor --fix` 会将旧版 `openai-codex/*` 模型引用重写为规范 OpenAI 模型路由。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API key 访问和订阅/OAuth 路由两种方式使用。对于 ChatGPT/Codex 订阅加原生 Codex
执行，请使用 `openai/gpt-5.5`；未设置的运行时配置现在会为 OpenAI 智能体轮次选择 Codex
harness。只有在你需要为 OpenAI 智能体模型使用直接 API key 凭证时，才使用 OpenAI API key 配置文件。
</Note>

<Note>
OpenAI 智能体模型轮次需要内置 Codex 应用服务器插件。显式 PI 运行时配置仍可作为可选兼容性路由使用。当使用 `openai-codex` 凭证配置文件显式选择 PI 时，OpenClaw 会将公开模型引用保持为 `openai/*`，并在内部通过旧版
Codex 凭证传输路由 PI。运行 `openclaw doctor --fix`，以修复陈旧的
`openai-codex/*` 模型引用，或并非来自显式运行时配置的旧 PI 会话固定项。
</Note>

## OpenClaw 功能覆盖

| OpenAI 能力         | OpenClaw 接入面                                                                 | Status                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses          | `openai/<model>` 模型提供商                                                  | 是                                                    |
| Codex 订阅模型 | 带 `openai-codex` OAuth 的 `openai/<model>`                                       | 是                                                    |
| 旧版 Codex 模型引用   | `openai-codex/<model>`                                                           | 由 Doctor 修复为 `openai/<model>`                 |
| Codex 应用服务器 harness  | 省略运行时或使用提供商/模型 `agentRuntime.id: codex` 的 `openai/<model>` | 是                                                    |
| 服务端 Web 搜索    | 原生 OpenAI Responses 工具                                                     | 是，当 Web 搜索已启用且未固定提供商时 |
| 图像                    | `image_generate`                                                                 | 是                                                    |
| 视频                    | `video_generate`                                                                 | 是                                                    |
| 文本转语音            | `messages.tts.provider: "openai"` / `tts`                                        | 是                                                    |
| 批量语音转文本      | `tools.media.audio` / 媒体理解                                        | 是                                                    |
| 流式语音转文本  | Voice Call `streaming.provider: "openai"`                                        | 是                                                    |
| Realtime 语音            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | 是                                                    |
| 嵌入                | 记忆嵌入提供商                                                        | 是                                                    |

## 记忆嵌入

OpenClaw 可以为 `memory_search` 索引和查询嵌入使用 OpenAI，或兼容 OpenAI 的嵌入端点：

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

对于需要非对称嵌入标签的兼容 OpenAI 端点，请在 `memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw 会将它们作为提供商特定的 `input_type` 请求字段转发：查询嵌入使用
`queryInputType`；已索引的记忆分块和批量索引使用
`documentInputType`。完整示例见 [记忆配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

选择你偏好的凭证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最适合：** 直接 API 访问和按用量计费。

    <Steps>
      <Step title="获取你的 API key">
        从 [OpenAI Platform 控制台](https://platform.openai.com/api-keys)创建或复制 API key。
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用              | 运行时配置             | 路由                       | 凭证             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | Codex 应用服务器 harness | 兼容 Codex 的 OpenAI 配置文件 |
    | `openai/gpt-5.4-mini` | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | Codex 应用服务器 harness | 兼容 Codex 的 OpenAI 配置文件 |
    | `openai/gpt-5.5`      | 提供商/模型 `agentRuntime.id: "pi"`              | PI 嵌入式运行时      | `openai` 配置文件或选定的 `openai-codex` 配置文件 |

    <Note>
    `openai/*` 智能体模型使用 Codex 应用服务器 harness。若要为智能体模型使用 API key
    凭证，请创建一个兼容 Codex 的 API key 配置文件，并用 `auth.order.openai` 对其排序；`OPENAI_API_KEY` 仍是非智能体 OpenAI API 接入面的直接备用项。较旧的 `auth.order.openai-codex` 条目仍然可用。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要通过 OpenAI API 试用 ChatGPT 当前的 Instant 模型，请将模型设置为
    `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是一个移动别名。OpenAI 将其记录为 ChatGPT 中使用的最新 Instant
    模型，并建议生产 API 使用 `gpt-5.5`，因此除非你明确需要该别名行为，否则请将 `openai/gpt-5.5` 保持为稳定默认值。该别名目前仅接受 `medium` 文本详细程度，因此 OpenClaw 会为此
    模型规范化不兼容的 OpenAI 文本详细程度覆盖项。

    <Warning>
    OpenClaw **不会** 暴露 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，当前 Codex 目录也不会暴露它。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，通过原生 Codex app-server 执行，而不是单独的 API key。Codex cloud 需要 ChatGPT 登录。

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头或不便使用回调的设置，添加 `--device-code`，通过 ChatGPT 设备码流程登录，而不是使用 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        默认路径不需要运行时配置。OpenAI 智能体轮次会自动选择原生 Codex app-server 运行时，并且 OpenClaw 会在选择此路由时安装或修复内置的 Codex 插件。
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 网关运行后，在聊天中发送 `/codex status` 或 `/codex models`，以验证原生 app-server 运行时。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型 ref | 运行时配置 | 路由 | 凭证 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | 原生 Codex app-server harness | Codex 登录或有序 `openai` 凭证配置文件 |
    | `openai/gpt-5.5` | 提供商/模型 `agentRuntime.id: "pi"` | 带内部 Codex-auth 传输的 PI 嵌入式运行时 | 选定的 `openai-codex` 配置文件 |
    | `openai-codex/gpt-5.5` | 由 doctor 修复 | 旧版路由重写为 `openai/gpt-5.5` | 现有 `openai-codex` 配置文件 |

    <Warning>
    不要配置较旧的 `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*` 或
    `openai-codex/gpt-5.3*` 模型 ref。ChatGPT/Codex OAuth 账号现在会拒绝这些模型。请使用 `openai/gpt-5.5`；OpenAI 智能体轮次现在默认选择 Codex 运行时。
    </Warning>

    <Note>
    `openai-codex/*` 模型前缀是由 doctor 修复的旧版配置。对于常见的订阅加原生运行时设置，请使用 Codex 凭证登录，但将模型 ref 保持为 `openai/gpt-5.5`。新配置应将 OpenAI 智能体凭证顺序放在 `auth.order.openai` 下；较旧的 `auth.order.openai-codex` 条目仍然有效。
    </Note>

    ### 配置示例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    使用 API-key 备份时，将模型保持为 `openai/gpt-5.5`，并将凭证顺序放在 `openai` 下。OpenClaw 会先尝试订阅，然后尝试 API key，同时保持使用 Codex harness：

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备码流程登录，OpenClaw 会在自己的智能体凭证存储中管理生成的凭证。
    </Note>

    ### 检查并恢复 Codex OAuth 路由

    使用这些命令查看默认智能体正在使用哪个模型、运行时和凭证路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    对于特定智能体，添加 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    如果较旧的配置仍有 `openai-codex/gpt-*`，或存在没有显式运行时配置的陈旧 OpenAI PI 会话固定，请修复它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai-codex` 未显示可用配置文件，请重新登录：

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` 是 OpenAI 智能体轮次通过 Codex 使用的模型路由。`openai-codex` 凭证/配置文件提供商 id 仍被现有配置文件和 CLI 列表接受。

    ### 状态指示器

    聊天 `/status` 会显示当前会话使用的模型运行时。对于 OpenAI 智能体模型轮次，内置 Codex app-server harness 显示为 `Runtime: OpenAI Codex`。陈旧的 PI 会话固定会被修复为 Codex，除非配置显式固定 PI。

    ### Doctor 警告

    如果配置或会话状态中仍保留 `openai-codex/*` 路由或陈旧 OpenAI PI 固定，`openclaw doctor --fix` 会将它们重写为带 Codex 运行时的 `openai/*`，除非显式配置了 PI。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立值。

    对于通过 Codex OAuth 目录使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。使用 `contextTokens` 覆盖它：

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

    当上游 Codex 目录元数据中存在 `gpt-5.5` 时，OpenClaw 会使用它。如果账号已完成身份验证，但实时 Codex 发现缺少 `gpt-5.5` 行，OpenClaw 会合成该 OAuth 模型行，使 cron、子智能体和已配置默认模型运行不会因 `Unknown model` 失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 凭证

原生 Codex app-server harness 使用 `openai/*` 模型 ref 加省略的运行时配置，或提供商/模型 `agentRuntime.id: "codex"`，但其凭证仍基于账号。OpenClaw 按以下顺序选择凭证：

1. 智能体的有序 OpenAI 凭证配置文件，最好放在
   `auth.order.openai` 下。现有 `openai-codex:*` 配置文件和
   `auth.order.openai-codex` 对较旧安装仍然有效。
2. app-server 的现有账号，例如本地 Codex CLI ChatGPT 登录。
3. 仅对于本地 stdio app-server 启动，当 app-server 报告没有账号且仍需要 OpenAI 凭证时，依次使用 `CODEX_API_KEY`，然后
   `OPENAI_API_KEY`。

这意味着本地 ChatGPT/Codex 订阅登录不会仅因为 Gateway 网关进程同时拥有用于直接 OpenAI 模型或嵌入的 `OPENAI_API_KEY` 就被替换。环境 API-key fallback 仅用于本地 stdio 无账号路径；它不会发送到 WebSocket app-server 连接。选择订阅风格的 Codex 配置文件时，OpenClaw 还会避免将 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 放入派生的 stdio app-server 子进程，并通过 app-server login RPC 发送选定凭证。当该订阅配置文件被 Codex 用量限制阻止时，OpenClaw 可以轮换到下一个有序的 `openai:*` API-key 配置文件，而无需更改选定模型或退出 Codex harness。订阅重置时间经过后，该订阅配置文件会再次可用。

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成。
它通过相同的 `openai/gpt-image-2` 模型 ref 同时支持 OpenAI API-key 图像生成和 Codex OAuth 图像生成。

| 能力                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型 ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 凭证                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录           |
| 传输                 | OpenAI Images API                  | Codex Responses 后端              |
| 每个请求的最大图像数    | 4                                  | 4                                    |
| 编辑模式                 | 已启用（最多 5 张参考图像） | 已启用（最多 5 张参考图像）   |
| 尺寸覆盖            | 支持，包括 2K/4K 尺寸   | 支持，包括 2K/4K 尺寸     |
| 宽高比 / 分辨率 | 不转发到 OpenAI Images API | 在安全时映射到支持的尺寸 |

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
参见 [图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

`gpt-image-2` 是 OpenAI 文本生成图像和图像编辑的默认值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。对于透明背景 PNG/WebP 输出，请使用 `openai/gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝 `background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并设置 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；较旧的 `openai.background` 提供商选项仍被接受。OpenClaw 还会保护公共 OpenAI 和 OpenAI Codex OAuth 路由，将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5`；Azure 和自定义 OpenAI 兼容端点会保留其配置的部署/模型名称。

同一设置也暴露给无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，将相同的 `--output-format` 和 `--background` 标志用于
`openclaw infer image edit`。
`--openai-background` 仍可作为 OpenAI 专用别名使用。

对于 Codex OAuth 安装，保持相同的 `openai/gpt-image-2` ref。配置 `openai-codex` OAuth 配置文件后，OpenClaw 会解析该存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY`，也不会对该请求静默回退到 API key。当你想改用直接 OpenAI Images API 路由时，请使用 API key、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图像端点位于受信任的 LAN/私有地址，还要设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此显式选择加入，OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点。

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
| 模式             | 文本转视频、图像转视频、单视频编辑                                               |
| 参考输入         | 1 张图像或 1 个视频                                                               |
| 尺寸覆盖         | 支持                                                                              |
| 其他覆盖         | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并显示工具警告 |

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词贡献

OpenClaw 为跨提供商的 GPT-5 系列运行添加共享的 GPT-5 提示词贡献。它按模型 id 应用，因此 `openai/gpt-5.5`、旧版修复前引用（例如 `openai-codex/gpt-5.5`）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同覆盖层。较旧的 GPT-4.x 模型不会收到。

内置的原生 Codex harness 通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和 Heartbeat 覆盖层，因此通过 Codex 路由的 `openai/gpt-5.x` 会话会保留相同的跟进和主动 Heartbeat 指引，尽管 Codex 拥有 harness 提示词的其余部分。

GPT-5 贡献会为人格持续性、执行安全、工具纪律、输出形态、完成检查和验证添加带标签的行为契约。特定渠道的回复和静默消息行为保留在共享的 OpenClaw 系统提示词和出站投递策略中。GPT-5 指引始终对匹配模型启用。友好的交互风格层是独立的，并且可配置。

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

## 语音与音频

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置 `openai` 插件会为 `messages.tts` 表面注册语音合成。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` |（未设置）|
    | 指令 | `messages.tts.providers.openai.instructions` |（未设置，仅 `gpt-4o-mini-tts`）|
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便签为 `opus`，文件为 `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | 基础 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 额外主体 | `messages.tts.providers.openai.extraBody` / `extra_body` |（未设置）|

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成的字段之后合并到 `/audio/speech` 请求 JSON 中，因此可将其用于需要额外键（例如 `lang`）的 OpenAI 兼容端点。原型键会被忽略。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不会影响聊天 API 端点。OpenAI TTS 仍通过 API key 配置；对于仅 OAuth 的实时语音回复，请使用 Realtime 语音路径，而不是智能体模式的 STT -> TTS 语音。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `openai` 插件通过 OpenClaw 的媒体理解转写表面注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - OpenClaw 中任何使用 `tools.media.audio` 的入站音频转写位置都支持该能力，包括 Discord 语音频道片段和渠道音频附件

    要强制为入站音频转写使用 OpenAI：

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

    当共享音频媒体配置或逐调用转写请求提供语言和提示词提示时，它们会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册实时转录。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 认证 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth | API key 直接连接；OAuth 会签发 Realtime 转录客户端密钥 |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。当仅配置了 `openai-codex` OAuth 时，Gateway 网关会在打开 WebSocket 之前签发一个临时 Realtime 转录客户端密钥。此流式传输提供商用于 Voice Call 的实时转录路径；Discord 语音目前会录制短片段，并改用批处理 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册实时语音。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 语音 | `...openai.voice` | `alloy` |
    | Temperature（Azure 部署桥接） | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | 前缀填充 | `...openai.prefixPaddingMs` | `300` |
    | 推理强度 | `...openai.reasoningEffort` | （未设置） |
    | 认证 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth | 浏览器 Talk 和非 Azure 后端桥接可以使用 Codex OAuth |

    `gpt-realtime-2` 可用的内置 Realtime 语音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 推荐使用 `marin` 和 `cedar` 以获得最佳 Realtime 质量。这
    与上面的 Text-to-speech 语音是不同集合；不要假设像 `fable`、
    `nova` 或 `onyx` 这样的 TTS 语音适用于 Realtime 会话。

    <Note>
    后端 OpenAI realtime 桥接使用 GA Realtime WebSocket 会话形态，该形态不接受 `session.temperature`。Azure OpenAI 部署仍可通过 `azureEndpoint` 和 `azureDeployment` 使用，并保留与部署兼容的会话形态。支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    实时语音会在创建会话时选定。OpenAI 允许大多数
    会话字段之后更改，但一旦该会话中的模型已经输出音频，
    语音就无法再更改。OpenClaw 目前将内置 Realtime 语音 ID 以字符串形式暴露。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器 realtime 会话，配合 Gateway 网关签发的
    临时客户端密钥，并通过浏览器直接与
    OpenAI Realtime API 进行 WebRTC SDP 交换。当未配置直接 OpenAI API key 时，
    Gateway 网关可以使用所选的 `openai-codex` OAuth
    配置签发该客户端密钥。Gateway 网关中继和 Voice Call 后端 realtime WebSocket 桥接会对
    原生 OpenAI 端点使用相同的 OAuth 回退。维护者可通过
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    进行实时验证；
    OpenAI 分支会在不记录密钥的情况下验证后端 WebSocket 桥接和浏览器
    WebRTC SDP 交换。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` 提供商可以通过覆盖基础 URL，将图像
生成指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw
会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到
Azure 的请求形态。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影响。其 Azure
设置请参阅 [Voice and speech](#voice-and-speech) 下的 **实时语音**
折叠面板。
</Note>

在以下情况使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内

### 配置

要通过内置 `openai` 提供商使用 Azure 图像生成，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为
Azure OpenAI key（不是 OpenAI Platform key）：

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
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于已识别 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用部署作用域路径（`/openai/deployments/{deployment}/...`）
- 在每个请求后追加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。
  每次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）会保留标准
OpenAI 图像请求形态。

<Note>
`openai` 提供商图像生成路径的 Azure 路由需要
OpenClaw 2026.4.22 或更高版本。早期版本会将任何自定义
`openai.baseUrl` 当作公共 OpenAI 端点处理，并且在 Azure
图像部署上会失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION`，为 Azure 图像生成路径固定特定的 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置该变量时，默认值为 `2024-12-01-preview`。

### 模型名称是部署名称

Azure OpenAI 会将模型绑定到部署。对于通过内置 `openai` provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的 **Azure 部署名称**，而不是公开的 OpenAI 模型 ID。

如果你创建了一个名为 `gpt-image-2-prod`、提供 `gpt-image-2` 服务的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则也适用于通过内置 `openai` provider 路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。创建部署前，请查看 Microsoft 当前的区域列表，并确认你的区域提供了特定模型。

### 参数差异

Azure OpenAI 和公开 OpenAI 并不总是接受相同的图像参数。Azure 可能会拒绝公开 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些 `background` 值），或仅在特定模型版本上公开这些选项。这些差异来自 Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误而失败，请在 Azure 门户中查看你的特定部署和 API 版本支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收 OpenClaw 的隐藏归因标头——请参阅 [高级配置](#advanced-configuration) 下的 **Native vs OpenAI-compatible routes** 折叠项。

对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用新手引导流程或专用的 Azure provider 配置——仅设置 `openai.baseUrl` 不会自动采用 Azure API/认证形态。另有一个单独的 `azure-openai-responses/*` provider；请参阅下面的 Server-side compaction 折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    对于 `openai/*`，OpenClaw 优先使用 WebSocket，并以 SSE 作为回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 之前，会重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话和轮次身份标头
    - 在不同传输变体之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | 优先 WebSocket，SSE 回退 |
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

  <Accordion title="Fast mode">
    OpenClaw 为 `openai/*` 公开共享的快速模式开关：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先级处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，快速模式不会改写 `reasoning` 或 `text.verbosity`。

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
    会话覆盖优先于配置。在会话 UI 中清除会话覆盖后，会话会回到已配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI 的 API 通过 `service_tier` 公开优先级处理。在 OpenClaw 中按模型设置：

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
    `serviceTier` 仅转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一 provider，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 Pi harness 流包装器会自动启用服务端压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi harness 路径，也适用于嵌入式运行使用的 OpenAI provider 钩子。原生 Codex 应用服务器 harness 通过 Codex 管理自己的上下文，并由 OpenAI 的默认 agent 路由或 provider/model 运行时策略配置。

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
    - 使用立即行动的 Steer 重试该轮次
    - 对实质性工作自动启用 `update_plan`
    - 如果模型持续规划而不行动，则显式暴露阻塞状态

    <Note>
    仅限 OpenAI 和 Codex GPT-5 系列运行。其他 provider 和较旧模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw 对待直接 OpenAI、Codex 和 Azure OpenAI 端点的方式，与通用 OpenAI 兼容 `/v1` 代理不同：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅为支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对会拒绝 `reasoning.effort: "none"` 的模型或代理，省略已禁用的 reasoning
    - 默认将工具架构设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头
    - 保留 OpenAI 专用请求塑形（`service_tier`、`store`、reasoning 兼容性、提示缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 载荷中移除 Completions `store`
    - 接受用于 OpenAI 兼容 Completions 代理的高级 `params.extra_body`/`params.extraBody` 透传 JSON
    - 接受用于 vLLM 等 OpenAI 兼容 Completions 代理的 `params.chat_template_kwargs`
    - 不强制严格工具架构或仅原生使用的标头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因标头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和 provider 选择。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和 provider 选择。
  </Card>
  <Card title="OAuth and auth" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭据复用规则。
  </Card>
</CardGroup>
