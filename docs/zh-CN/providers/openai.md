---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅身份验证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API key 或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T03:07:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 为 GPT 模型提供开发者 API，Codex 也可以通过 OpenAI 的 Codex 客户端作为 ChatGPT 计划的代码智能体使用。OpenClaw 对两种凭证形态都使用同一个提供商 ID：`openai`。

OpenClaw 使用 `openai/*` 作为规范的 OpenAI 模型路由。OpenAI 模型上的嵌入式智能体轮次默认通过原生 Codex app-server 运行时运行；直接 OpenAI API key 凭证仍可用于图片、嵌入、语音和 realtime 等非智能体 OpenAI 表面。

- **智能体模型** - 通过 Codex 运行时使用 `openai/*` 模型；如需使用 ChatGPT/Codex 订阅，请用 Codex 凭证登录；或者在你明确想使用 API key 凭证时，配置与 Codex 兼容的 OpenAI API key 备用项。
- **非智能体 OpenAI API** - 通过 `OPENAI_API_KEY` 或 OpenAI API key 新手引导，直接访问 OpenAI Platform，并按用量计费。
- **旧版配置** - 旧版 Codex 模型引用会由 `openclaw doctor --fix` 修复为 `openai/*` 加 Codex 运行时。

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是彼此独立的层。如果这些标签被混在一起，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再修改配置。

## 快速选择

| 目标                                                 | 使用方式                                                      | 说明                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅 | `openai/gpt-5.5`                                         | 默认 OpenAI 智能体设置。用 Codex 凭证登录。                  |
| 智能体模型的直接 API key 计费              | `openai/gpt-5.5` 加与 Codex 兼容的 API key 配置文件 | 使用 `auth.order.openai` 将备用项放在订阅凭证之后。  |
| 通过显式 OpenClaw 进行直接 API key 计费     | `openai/gpt-5.5` 加提供商/模型运行时 `openclaw`  | 选择普通的 `openai` API key 配置文件。                             |
| 最新 ChatGPT Instant API 别名                     | `openai/chat-latest`                                     | 仅直接 API key。用于实验的移动别名，不是默认值。   |
| 通过 OpenClaw 使用 ChatGPT/Codex 订阅凭证     | `openai/gpt-5.5` 加提供商/模型运行时 `openclaw`  | 为兼容路由选择一个 `openai` OAuth 配置文件。         |
| 图片生成或编辑                          | `openai/gpt-image-2`                                     | 可与 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 一起使用。             |
| 透明背景图片                        | `openai/gpt-image-1.5`                                   | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

## 命名映射

这些名称相似，但不能互换：

| 你看到的名称                            | 层级             | 含义                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | 提供商前缀   | 规范的 OpenAI 模型路由；智能体轮次使用 Codex 运行时。                                  |
| 旧版 OpenAI Codex 前缀              | 旧版前缀     | 较旧的模型/配置文件命名空间。`openclaw doctor --fix` 会将它迁移到 `openai`。                   |
| `codex` 插件                          | 插件            | 内置 OpenClaw 插件，提供原生 Codex app-server 运行时和 `/codex` 聊天控制。 |
| 提供商/模型 `agentRuntime.id: codex` | Agent Runtimes     | 为匹配的嵌入式轮次强制使用原生 Codex app-server harness。                            |
| `/codex ...`                            | 聊天命令集  | 从对话中绑定/控制 Codex app-server 线程。                                        |
| `runtime: "acp", agentId: "codex"`      | ACP 会话路由 | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                          |

这意味着配置可以有意包含 `openai/*` 模型引用，而凭证配置文件可以指向 API key 或 ChatGPT/Codex OAuth 凭证。配置请使用 `auth.order.openai`；`openclaw doctor --fix` 会将旧版 Codex 模型引用、旧版 Codex 凭证配置文件 ID 和旧版 Codex 凭证顺序重写为规范的 OpenAI 路由。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API key 访问和订阅/OAuth 路由使用。对于 ChatGPT/Codex 订阅加原生 Codex 执行，请使用 `openai/gpt-5.5`；现在未设置运行时配置时，会为 OpenAI 智能体轮次选择 Codex harness。仅当你希望对 OpenAI 智能体模型使用直接 API key 凭证时，才使用 OpenAI API key 配置文件。
</Note>

<Note>
OpenAI 智能体模型轮次需要内置 Codex app-server 插件。显式 OpenClaw 运行时配置仍可作为选择性启用的兼容路由。当使用 `openai` OAuth 配置文件显式选择 OpenClaw 时，OpenClaw 会将公开模型引用保持为 `openai/*`，并在内部通过 Codex 凭证传输路由。运行 `openclaw doctor --fix` 以修复陈旧的旧版 Codex 模型引用、`codex-cli/*`，或并非来自显式运行时配置的旧运行时会话固定项。
</Note>

## OpenClaw 功能覆盖

| OpenAI 能力         | OpenClaw 表面                                                                              | 状态                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` 模型提供商                                                               | 是                                                                    |
| Codex 订阅模型 | 带 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                                    |
| 旧版 Codex 模型引用   | 旧版 Codex 模型引用或 `codex-cli/<model>`                                                | 由 Doctor 修复为 `openai/<model>`                                 |
| Codex app-server harness  | 省略运行时的 `openai/<model>`，或提供商/模型 `agentRuntime.id: codex`              | 是                                                                    |
| 服务端 Web 搜索    | 原生 OpenAI Responses 工具                                                                  | 是，当 Web 搜索已启用且未固定提供商时                 |
| 图片                    | `image_generate`                                                                              | 是                                                                    |
| 视频                    | `video_generate`                                                                              | 是                                                                    |
| 文本转语音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                                    |
| 批量语音转文本      | `tools.media.audio` / 媒体理解                                                     | 是                                                                    |
| 流式语音转文本  | Voice Call `streaming.provider: "openai"`                                                     | 是                                                                    |
| Realtime 语音            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（需要 OpenAI Platform 点数，而不是 Codex/ChatGPT 订阅） |
| 嵌入                | 记忆嵌入提供商                                                                     | 是                                                                    |

<Note>
  OpenAI Realtime 语音（由 Voice Call 的 `realtime.provider: "openai"` 和
  Control UI Talk 的 `talk.realtime.provider: "openai"` 使用）通过
  公开的 **OpenAI Platform Realtime API**，按 OpenAI Platform 点数计费，
  而不是使用 Codex/ChatGPT 订阅额度。即使某个账号的 OpenAI OAuth 状态正常，
  可以无问题运行 Codex 支持的聊天模型，Realtime 语音仍然需要 OpenAI API key
  凭证配置文件，或一个已为 Platform 计费充值的 Platform API key。

修复：在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
为支持你的 realtime 凭证的组织充值 Platform 点数。Realtime 语音接受由
`openclaw onboard --auth-choice openai-api-key` 创建的 `openai` API key 凭证配置文件、
通过 `talk.realtime.providers.openai.apiKey` 为 Control UI Talk 配置的 Platform `OPENAI_API_KEY`、
通过 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
为 Voice Call 配置的 Platform `OPENAI_API_KEY`，或 `OPENAI_API_KEY` 环境变量。OpenAI OAuth
配置文件仍可在同一个 OpenClaw 安装中运行 Codex 支持的 `openai/*` 聊天模型，
但它们不会配置 Realtime 语音。
</Note>

## 记忆嵌入

OpenClaw 可以使用 OpenAI，或 OpenAI 兼容的嵌入端点，来进行
`memory_search` 索引和查询嵌入：

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

对于需要非对称嵌入标签的 OpenAI 兼容端点，请在 `memorySearch` 下设置
`queryInputType` 和 `documentInputType`。OpenClaw 会将它们作为提供商特定的
`input_type` 请求字段转发：查询嵌入使用 `queryInputType`；已索引的记忆分块和批量索引使用
`documentInputType`。完整示例见 [记忆配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

选择你偏好的凭证方法，并按照设置步骤操作。

<Tabs>
  <Tab title="API key（OpenAI Platform）">
    **最适合：** 直接 API 访问和按用量计费。

    <Steps>
      <Step title="获取你的 API key">
        从 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 创建或复制 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或者直接传入 key：

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

    | 模型引用              | 运行时配置             | 路由                       | 凭证             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | Codex app-server harness | 与 Codex 兼容的 OpenAI 配置文件 |
    | `openai/gpt-5.4-mini` | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | Codex app-server harness | 与 Codex 兼容的 OpenAI 配置文件 |
    | `openai/gpt-5.5`      | 提供商/模型 `agentRuntime.id: "openclaw"`              | OpenClaw 嵌入式运行时      | 选定的 `openai` 配置文件 |

    <Note>
    `openai/*` 智能体模型使用 Codex app-server harness。要为智能体模型使用 API-key
    凭证，请创建一个兼容 Codex 的 API-key profile，并通过
    `auth.order.openai` 对它排序；`OPENAI_API_KEY` 仍然是
    非智能体 OpenAI API surface 的直接回退。运行 `openclaw doctor --fix` 以迁移较旧的
    旧版 Codex 凭证排序条目。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    要从 OpenAI API 试用 ChatGPT 当前的 Instant 模型，请将模型
    设置为 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是一个会变化的别名。OpenAI 文档将其定义为 ChatGPT 中使用的最新 Instant
    模型，并建议在生产 API 使用中采用 `gpt-5.5`，因此除非你明确想要该
    别名行为，否则请保持 `openai/gpt-5.5` 作为稳定默认值。该别名目前仅接受 `medium` 文本详细程度，因此
    OpenClaw 会为此模型规范化不兼容的 OpenAI 文本详细程度覆盖项。

    <Warning>
    OpenClaw **不会** 在直接 OpenAI API-key 路由上暴露 `gpt-5.3-codex-spark`。只有当你已登录的账号暴露它时，它才可通过 Codex 订阅目录条目使用。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，通过原生 Codex app-server 执行，而不是单独的 API key。Codex cloud 需要登录 ChatGPT。

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或者直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        对于无头或不便使用回调的设置，请添加 `--device-code`，使用 ChatGPT device-code 流程登录，而不是 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        默认路径不需要运行时配置。OpenAI 智能体轮次
        会自动选择原生 Codex app-server 运行时，并且当选择此路由时，OpenClaw
        会安装或修复内置的 Codex 插件。
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway 网关运行后，在聊天中发送 `/codex status` 或 `/codex models`
        以验证原生 app-server 运行时。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 运行时配置 | 路由 | 凭证 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | 原生 Codex app-server harness | Codex 登录或已排序的 `openai` 凭证 profile |
    | `openai/gpt-5.5` | 提供商/模型 `agentRuntime.id: "openclaw"` | 使用内部 Codex-auth 传输的 OpenClaw 嵌入式运行时 | 已选择的 `openai` OAuth profile |
    | 旧版 Codex GPT-5.5 引用 | 由 Doctor 修复 | 旧版路由改写为 `openai/gpt-5.5` | 已迁移的 OpenAI OAuth profile |
    | `codex-cli/gpt-5.5` | 由 Doctor 修复 | 旧版 CLI 路由改写为 `openai/gpt-5.5` | Codex app-server 凭证 |

    <Warning>
    对于新的订阅支持的智能体配置，优先使用 `openai/gpt-5.5`。较旧的
    旧版 Codex GPT 引用是旧版 OpenClaw 路由，而不是原生 Codex runtime
    路径；当你想把它们迁移到规范的
    `openai/*` 引用时，请运行 `openclaw doctor --fix`。`gpt-5.3-codex-spark` 仍仅限于
    Codex 订阅目录公布该模型的账号；它的直接 OpenAI API-key 和
    Azure 引用仍会被抑制。
    </Warning>

    <Note>
    旧版 Codex 模型前缀是由 Doctor 修复的旧版配置。对于
    常见的“订阅 + 原生运行时”设置，请使用 Codex 凭证登录，
    但将模型引用保持为 `openai/gpt-5.5`。新配置应将 OpenAI
    智能体凭证顺序放在 `auth.order.openai` 下；Doctor 会迁移较旧的
    旧版 Codex 凭证排序条目。
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

    如果有 API-key 备用项，请保持模型为 `openai/gpt-5.5`，并将
    凭证顺序放在 `openai` 下。OpenClaw 会先尝试订阅，然后
    尝试 API key，同时继续使用 Codex harness：

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的 device-code 流程登录，OpenClaw 会在自己的智能体凭证存储中管理生成的凭据。
    </Note>

    ### 检查和恢复 Codex OAuth 路由

    使用这些命令查看你的默认智能体正在使用哪个模型、运行时和凭证路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    对于特定智能体，请添加 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果较旧的配置仍包含旧版 Codex GPT 引用，或存在没有显式运行时配置的过时 OpenAI 运行时
    会话固定项，请修复它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 未显示可用 profile，请
    重新登录：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    当你想在同一智能体中使用多个 Codex OAuth 登录，并且之后想通过凭证排序或 `/model ...@<profileId>` 控制它们时，请使用 `--profile-id`：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` 是通过 Codex 进行 OpenAI 智能体轮次的模型路由。请先运行
    `openclaw doctor --fix`，迁移较旧的旧版 OpenAI Codex 前缀 profile id 和
    排序条目，然后再依赖 profile 排序。

    ### 状态指示器

    聊天 `/status` 会显示当前会话处于活动状态的模型运行时。
    对于 OpenAI 智能体模型轮次，内置 Codex app-server harness 显示为 `Runtime: OpenAI Codex`。
    除非配置明确固定到 OpenClaw，否则过时的 OpenAI 运行时会话固定项会被修复为 Codex。

    ### Doctor 警告

    如果配置或会话状态中仍存在旧版 Codex 模型引用或过时的 OpenAI 运行时固定项，
    `openclaw doctor --fix` 会将它们改写为使用 Codex 运行时的 `openai/*`，
    除非已显式配置 OpenClaw。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立值。

    对于通过 Codex OAuth 目录使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特征。用 `contextTokens` 覆盖它：

    ```json5
    {
      models: {
        providers: {
          openai: {
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

    当存在 `gpt-5.5` 时，OpenClaw 会使用上游 Codex 目录元数据。
    如果实时 Codex 设备发现遗漏了 `gpt-5.5` 行，但
    账号已通过凭证验证，OpenClaw 会合成该 OAuth 模型行，以便
    cron、子智能体和已配置的默认模型运行不会因
    `Unknown model` 而失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 凭证

原生 Codex app-server harness 使用 `openai/*` 模型引用，并省略
运行时配置，或使用提供商/模型 `agentRuntime.id: "codex"`，但其凭证
仍基于账号。OpenClaw 按以下顺序选择凭证：

1. 智能体的已排序 OpenAI 凭证 profile，最好位于
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的
   旧版 Codex 凭证 profile id 和旧版 Codex 凭证顺序。
2. app-server 的现有账号，例如本地 Codex CLI ChatGPT 登录。
3. 仅对于本地 stdio app-server 启动，当 app-server 报告没有账号且仍需要
   OpenAI 凭证时，使用 `CODEX_API_KEY`，然后
   `OPENAI_API_KEY`。

这意味着，本地 ChatGPT/Codex 订阅登录不会仅仅因为
Gateway 网关进程也为直接 OpenAI 模型或嵌入配置了 `OPENAI_API_KEY`
而被替换。环境 API-key 回退仅适用于本地 stdio 无账号路径；
它不会发送到 WebSocket app-server 连接。当选择订阅式 Codex
profile 时，OpenClaw 还会将 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
排除在生成的 stdio app-server 子进程之外，并通过 app-server 登录 RPC
发送所选凭据。当该订阅 profile 被 Codex 使用限制阻止时，
OpenClaw 可以轮换到下一个已排序的 `openai:*` API-key
profile，而无需更改所选模型或离开 Codex
harness。订阅重置时间过去后，该订阅 profile
会再次符合条件。

## 图像生成

内置的 `openai` 插件通过 `image_generate` 工具注册图像生成。
它通过同一个 `openai/gpt-image-2` 模型引用，同时支持 OpenAI API-key 图像生成和 Codex OAuth 图像
生成。

| 能力                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 凭证                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录           |
| 传输                 | OpenAI Images API                  | Codex Responses 后端              |
| 每次请求的最大图像数    | 4                                  | 4                                    |
| 编辑模式                 | 已启用（最多 5 张参考图像） | 已启用（最多 5 张参考图像）   |
| 尺寸覆盖            | 支持，包括 2K/4K 尺寸   | 支持，包括 2K/4K 尺寸     |
| 宽高比 / 分辨率 | 不转发到 OpenAI Images API | 在安全时映射到受支持尺寸 |

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
请参阅[图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

`gpt-image-2` 是 OpenAI 文生图生成和图像
编辑的默认值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为
显式模型覆盖使用。使用 `openai/gpt-image-1.5` 生成透明背景
PNG/WebP 输出；当前的 `gpt-image-2` API 会拒绝
`background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并设置
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；旧的 `openai.background` 提供商选项仍然被接受。OpenClaw 还会保护公开的 OpenAI 和
OpenAI Codex OAuth 路由：将默认的 `openai/gpt-image-2` 透明背景请求重写为
`gpt-image-1.5`；Azure 和自定义 OpenAI 兼容端点会保留其已配置的部署/模型名称。

同一设置也暴露给无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始使用 `openclaw infer image edit` 时，请使用相同的
`--output-format` 和 `--background` 标志。
`--openai-background` 仍可作为 OpenAI 专用别名使用。
需要控制 OpenAI Images 质量和成本时，请使用 `--quality low|medium|high|auto`。请使用 `--openai-moderation low|auto` 从 `image generate` 或 `image edit` 传递 OpenAI 的提供商专用审核提示。

对于 ChatGPT/Codex OAuth 安装，保留相同的 `openai/gpt-image-2` 引用。配置了
`openai` OAuth 配置档案时，OpenClaw 会解析该存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY`，也不会为该请求静默回退到 API key。需要改用直接的 OpenAI Images API 路由时，请使用 API key、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图像端点位于受信任的 LAN/私有地址，也请设置
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点，除非存在此显式选择。

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

| 能力             | 值                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型         | `openai/sora-2`                                                                   |
| 模式             | 文本转视频、图像转视频、单视频编辑                                                |
| 参考输入         | 1 张图像或 1 个视频                                                               |
| 尺寸覆盖         | 支持文本转视频和图像转视频                                                        |
| 其他覆盖         | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略并显示工具警告 |

OpenAI 图像转视频请求使用带图像
`input_reference` 的 `POST /v1/videos`。单视频编辑使用
`POST /v1/videos/edits`，并将上传的视频放在 `video` 字段中。

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
参见 [视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

## GPT-5 提示贡献

OpenClaw 会为 OpenClaw 组装的提示表面上的 GPT-5 系列运行添加共享 GPT-5 提示贡献。它按模型 ID 应用，因此 OpenClaw/提供商路由，例如旧版预修复引用（旧版 Codex GPT-5.5 引用）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容 GPT-5 引用，都会收到相同的覆盖层。旧版 GPT-4.x 模型不会收到。

内置 Native Codex plugins 不会通过 Codex 应用服务器开发者指令接收此 OpenClaw GPT-5 覆盖层。Native Codex 会保留 Codex 拥有的基础、模型和项目文档行为，而 OpenClaw 会为原生线程禁用 Codex 的内置人格，使 Agent 工作区人格文件保持权威。OpenClaw 只贡献运行时上下文，例如频道投递、OpenClaw 动态工具、ACP 委派、工作区上下文和 OpenClaw Skills。

GPT-5 贡献会为人格持久性、执行安全、工具纪律、输出形态、完成检查，以及匹配 OpenClaw 组装提示上的验证添加带标签的行为契约。特定频道的回复和静默消息行为保留在共享 OpenClaw 系统提示和出站投递策略中。友好的交互风格层是独立且可配置的。

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
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 设置时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音和语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 表面注册语音合成。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` |（未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` |（未设置，仅限 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便笺使用 `opus`，文件使用 `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | 基础 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 额外正文 | `messages.tts.providers.openai.extraBody` / `extra_body` |（未设置） |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成的字段之后合并到 `/audio/speech` 请求 JSON 中，因此可将其用于需要 `lang` 等额外键的 OpenAI 兼容端点。原型键会被忽略。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不影响聊天 API 端点。OpenAI TTS 和 Realtime 语音都通过 OpenAI Platform API key 配置；仅 OAuth 的安装仍可使用 Codex 支持的聊天模型，但不能使用 OpenAI 实时语音回话。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过
    OpenClaw 的媒体理解转录表面注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用
      `tools.media.audio`，就受到支持，包括 Discord 语音频道片段和频道音频附件

    要为入站音频转录强制使用 OpenAI：

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

    当共享音频媒体配置或按调用转录请求提供语言和提示提示时，它们会被转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册实时转录。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` |（未设置） |
    | 提示 | `...openai.prompt` |（未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 凭证 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` OAuth | API keys 直接连接；OAuth 会签发实时转录客户端密钥 |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。当仅配置 `openai` OAuth 时，Gateway 网关 会在打开 WebSocket 前签发临时实时转录客户端密钥。此流式提供商用于 Voice Call 的实时转录路径；Discord 语音目前会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册实时语音。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 语音 | `...openai.voice` | `alloy` |
    | 温度（Azure 部署桥接） | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | 前缀填充 | `...openai.prefixPaddingMs` | `300` |
    | 推理强度 | `...openai.reasoningEffort` |（未设置） |
    | 凭证 | `openai` API-key 凭证配置档案、`...openai.apiKey` 或 `OPENAI_API_KEY` | 需要 OpenAI Platform API key；OpenAI OAuth 不会配置实时语音 |

    `gpt-realtime-2` 的可用内置 Realtime 语音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 推荐使用 `marin` 和 `cedar` 以获得最佳 Realtime 质量。这
    与上面的文本转语音语音是不同的集合；不要假设 `fable`、`nova` 或 `onyx` 等 TTS
    语音可用于 Realtime 会话。

    <Note>
    后端 OpenAI realtime 桥接使用 GA Realtime WebSocket 会话形态，该形态不接受 `session.temperature`。Azure OpenAI 部署仍可通过 `azureEndpoint` 和 `azureDeployment` 使用，并保留与部署兼容的会话形态。支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    创建会话时会选择实时语音。OpenAI 允许稍后更改大多数
    会话字段，但在模型已在该会话中发出音频后，语音无法更改。OpenClaw 目前将
    内置 Realtime 语音 ID 作为字符串暴露。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器实时会话，通过 Gateway 网关签发的
    临时客户端密钥，以及浏览器直接与
    OpenAI Realtime API 进行的 WebRTC SDP 交换。Gateway 网关使用所选的
    `openai` API-key 凭证配置或已配置的 OpenAI Platform API key
    签发该客户端密钥。Gateway 网关中继和 Voice Call 后端实时 WebSocket
    桥接对原生 OpenAI 端点使用相同的仅 API-key 凭证路径。维护者可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    进行实时验证；OpenAI 路径会同时验证后端 WebSocket 桥接和浏览器
    WebRTC SDP 交换，且不会记录密钥。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` 提供商可以通过覆盖基础 URL，将图像生成目标指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw
会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到
Azure 的请求形态。

<Note>
实时语音使用单独的配置路径
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影响。其 Azure
设置请参见 [Voice and speech](#voice-and-speech) 下的 **实时语音** 折叠项。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你想将流量保留在现有 Azure 租户内

### 配置

要通过内置 `openai` 提供商使用 Azure 图像生成，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为
Azure OpenAI 密钥（不是 OpenAI Platform 密钥）：

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

OpenClaw 会为 Azure 图像生成路由识别这些 Azure 主机后缀：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于已识别 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用按部署限定的路径（`/openai/deployments/{deployment}/...`）
- 向每个请求追加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。
  单次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）会保留标准
OpenAI 图像请求形态。

<Note>
`openai` 提供商的图像生成路径中的 Azure 路由需要
OpenClaw 2026.4.22 或更高版本。早期版本会将任何自定义
`openai.baseUrl` 当作公共 OpenAI 端点处理，并且会在访问 Azure
图像部署时失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION`，为 Azure 图像生成路径固定特定的 Azure
预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置该变量时，默认值为 `2024-12-01-preview`。

### 模型名称就是部署名称

Azure OpenAI 将模型绑定到部署。对于通过内置 `openai` 提供商路由的
Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure
门户中配置的 **Azure 部署名称**，而不是公共 OpenAI 模型 ID。

如果你创建了名为 `gpt-image-2-prod`、用于提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名称规则也适用于通过内置 `openai` 提供商路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。创建部署前，请查看 Microsoft 当前的区域列表，并确认你的区域提供对应的具体模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些
`background` 值），或仅在特定模型版本上公开这些选项。这些差异来自
Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误失败，请在
Azure 门户中检查你的具体部署和 API 版本支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因标头 —— 请参见 [Advanced configuration](#advanced-configuration)
下的 **原生与 OpenAI 兼容路由** 折叠项。

对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用
新手引导流程或专用 Azure 提供商配置 —— 仅设置 `openai.baseUrl`
不会采用 Azure API/凭证形态。另有单独的
`azure-openai-responses/*` 提供商；请参见下方的服务器端压缩折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 优先使用 WebSocket，并以 SSE 作为回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重新连接附加稳定的会话与轮次身份标头
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

  <Accordion title="快速模式">
    OpenClaw 为 `openai/*` 公开共享的快速模式开关：

    - **聊天/UI：** `/fast status|auto|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先处理（`service_tier = "priority"`）。现有 `service_tier` 值会保留，快速模式不会重写 `reasoning` 或 `text.verbosity`。`fastMode: "auto"` 会让新的模型调用在自动截止前使用快速模式启动，然后让后续重试、回退、工具结果或续接调用在不使用快速模式的情况下启动。截止时间默认为 60 秒；可在活动模型上设置 `params.fastAutoOnSeconds` 来更改。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    会话覆盖优先于配置。在会话 UI 中清除会话覆盖会让该会话回到已配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 公开优先处理。在 OpenClaw 中按模型设置：

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
    `serviceTier` 只会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，OpenClaw 会保留 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务器端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 OpenClaw 流包装器会自动启用服务器端压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 OpenClaw 运行时路径，也适用于嵌入式运行使用的 OpenAI provider 钩子。原生 Codex 应用服务器 harness 通过 Codex 管理自己的上下文，并由 OpenAI 的默认智能体路由或提供商/模型运行时策略配置。

    <Tabs>
      <Tab title="显式启用">
        适用于兼容端点，例如 Azure OpenAI Responses：

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
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 模式">
    对于 `openai/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的嵌入式执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 时，OpenClaw 会：
    - 对实质性工作自动启用 `update_plan`
    - 对结构上为空或仅包含推理的轮次，使用可见答案续接进行重试
    - 在所选 harness 提供计划事件时使用显式 harness 计划事件

    OpenClaw 不会对助手文本进行分类来判断某个轮次是计划、进度更新还是最终答案。

    <Note>
    仅限 OpenAI 和 Codex GPT-5 系列运行。其他提供商和较旧模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生与 OpenAI 兼容路由">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理不同于通用 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略已禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头
    - 保留仅 OpenAI 使用的请求形态（`service_tier`、`store`、reasoning 兼容性、prompt-cache 提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中移除 Completions `store`
    - 接受用于 OpenAI 兼容 Completions 代理的高级 `params.extra_body`/`params.extraBody` 透传 JSON
    - 接受用于 vLLM 等 OpenAI 兼容 Completions 代理的 `params.chat_template_kwargs`
    - 不强制使用严格工具 schema 或仅限原生的标头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏的归因标头。

  </Accordion>
</AccordionGroup>

## 相关

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
    认证详情和凭证复用规则。
  </Card>
</CardGroup>
