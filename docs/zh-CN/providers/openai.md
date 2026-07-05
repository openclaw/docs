---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅身份验证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 通过 API 密钥或 Codex 订阅在 OpenClaw 中使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-05T11:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cfb010354b98f0d5a40db27abda2e51f0e7c0b7098e643b16ec8a6adfc3d668
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw 使用一个提供商 ID `openai`，同时用于直接 API key 凭证和
ChatGPT/Codex 订阅凭证。`openai/*` 是规范模型路由。
默认情况下，`openai/*` 上的嵌入式 Agent 轮次会通过内置 Codex app-server
运行时运行；直接 API key 凭证仍可用于非 Agent OpenAI
表面（图像、视频、嵌入、语音、实时），也可作为 Agent 轮次的显式
兼容性路由。

- **Agent 模型** - 通过 Codex 运行时使用 `openai/*`。使用 Codex
  凭证登录以使用 ChatGPT/Codex 订阅，或在需要基于 key 的计费时配置 API key
  凭证配置文件。
- **非 Agent OpenAI API** - 直接 OpenAI Platform 访问，按使用量计费，
  通过 `OPENAI_API_KEY` 或 `openai` API key 凭证配置文件。
- **旧版配置** - 旧的 Codex 模型引用和配置文件 ID 会由
  `openclaw doctor --fix` 修复为 `openai/*`。

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是分离的层。如果这些标签被混在一起，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再更改配置。

## 快速选择

| 目标                                              | 使用                                                               | 说明                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| ChatGPT/Codex 订阅，原生 Codex 运行时             | `openai/gpt-5.5`                                                   | 默认设置。使用 Codex 凭证登录。                                         |
| GPT-5.6 limited preview                           | `openai/gpt-5.6-sol`、`-terra` 或 `-luna`                          | 需要 OpenAI 批准的 API 组织或 Codex 工作区 allowlist 条目。             |
| Agent 轮次的直接 API key 计费                     | `openai/gpt-5.5` 加一个有序的 API key 凭证配置文件                 | 设置 `auth.order.openai`，将 key 配置文件放在订阅凭证之后。             |
| 直接 API key 计费，显式 OpenClaw 运行时           | `openai/gpt-5.5` 加提供商/模型 `agentRuntime.id: "openclaw"`       | 选择普通的 `openai` API key 配置文件。                                  |
| 最新 ChatGPT Instant 模型别名                     | `openai/chat-latest`                                               | 仅直接 API key；移动别名，不是稳定默认值。                              |
| 图像生成或编辑                                    | `openai/gpt-image-2`                                               | 可与 `OPENAI_API_KEY` 或 Codex OAuth 一起使用。                          |
| 透明背景图像                                      | `openai/gpt-image-1.5`                                             | 将 `outputFormat` 设为 `png` 或 `webp`，并设置 `background=transparent`。 |

## 命名映射

| 你看到的名称                            | 层                | 含义                                                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | 提供商前缀        | 规范 OpenAI 模型路由；Agent 轮次默认使用 Codex 运行时。                                  |
| `codex` 插件                            | 插件              | 提供原生 Codex app-server 运行时和 `/codex` 聊天控制的内置插件。                         |
| 提供商/模型 `agentRuntime.id: codex`    | Agent 运行时      | 为匹配的嵌入式轮次强制使用原生 Codex app-server harness。                                |
| `/codex ...`                            | 聊天命令集        | 从会话绑定/控制 Codex app-server 线程。                                                  |
| `runtime: "acp", agentId: "codex"`      | ACP 会话路由      | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                                |

`openclaw doctor --fix` 会将旧版 Codex 模型引用、旧版 Codex 凭证
配置文件 ID，以及旧版 Codex 凭证顺序条目迁移到规范 `openai`
路由。新的凭证顺序配置请使用 `auth.order.openai`。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API key 访问和订阅/OAuth
路由使用。对于使用原生 Codex 执行的 ChatGPT/Codex 订阅，请使用
`openai/gpt-5.5` 并保持运行时配置未设置；这已经会选择 Codex harness。仅在你想为 Agent 模型使用直接 API key 凭证时，才使用 API key 凭证配置文件。
</Note>

## GPT-5.6 limited preview

OpenClaw 识别三个公开 GPT-5.6 模型 ID：`openai/gpt-5.6-sol`、
`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna`。当前目录中，三者都公开 `xhigh` 和
`max` 推理。OpenAI 将 Sol 描述为旗舰层级，
Terra 描述为平衡层级，Luna 描述为快速、低成本层级。请参阅
[GPT-5.6 发布公告](https://openai.com/index/previewing-gpt-5-6-sol/)
和 [preview 访问指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

preview 期间访问权限通过 allowlist 授予，并且 API 和 Codex 可以分别授予；
仅有付费 ChatGPT 计划并不会授予访问权限。OpenClaw 保持
`openai/gpt-5.5` 作为默认值，并且不会对访问错误做特殊处理，因此在没有访问权限时选择 GPT-5.6 引用会直接暴露上游错误，而不是静默回退。

<Note>
默认情况下，`openai/*` 上的 Agent 模型轮次需要内置 Codex app-server 插件。
显式 OpenClaw 运行时配置仍作为可选的兼容性路由可用：当 OpenClaw 通过 `openai`
OAuth 配置文件被显式选择时，模型引用保持为 `openai/*`，但请求会在内部通过
Codex 凭证传输路由。运行 `openclaw doctor --fix` 以修复陈旧的
旧版 Codex 模型引用、`codex-cli/*` 引用，或不是由显式运行时配置设置的旧运行时会话固定项。
</Note>

## OpenClaw 功能覆盖

| OpenAI 能力              | OpenClaw 表面                                                                                | 状态                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供商                                                                   | 是                                                                  |
| Codex 订阅模型            | 使用 OpenAI OAuth 的 `openai/<model>`                                                         | 是                                                                  |
| 旧版 Codex 模型引用       | 旧 Codex 模型引用、`codex-cli/<model>`                                                        | 由 doctor 修复为 `openai/<model>`                                   |
| Codex app-server harness  | 运行时未设置的 `openai/<model>`，或提供商/模型 `agentRuntime.id: codex`                       | 是                                                                  |
| 服务端 Web 搜索           | 原生 OpenAI Responses 工具                                                                    | 是，在启用 Web 搜索且未固定其他提供商时                            |
| 图像                      | `image_generate`                                                                              | 是                                                                  |
| 视频                      | `video_generate`                                                                              | 是                                                                  |
| 文本转语音                | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                                  |
| 批量语音转文本            | `tools.media.audio` / 媒体理解                                                                | 是                                                                  |
| 流式语音转文本            | Voice Call `streaming.provider: "openai"`                                                     | 是                                                                  |
| 实时语音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（需要 OpenAI Platform credits，不是 Codex/ChatGPT 订阅）         |
| 嵌入                      | 记忆嵌入提供商                                                                                | 是                                                                  |

<Note>
OpenAI Realtime 语音通过公开的 **OpenAI Platform Realtime
API**，按 OpenAI Platform credits 计费，而不是 Codex/ChatGPT
订阅配额。使用 OAuth 能正常运行 Codex 支持的聊天模型的账号，仍然需要一个已充值计费的 Platform API key 才能使用 Realtime 语音。

修复：在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
为支持你的实时凭证的组织充值 Platform credits。Realtime 语音接受由
`openclaw onboard --auth-choice openai-api-key` 创建的 `openai` API key 凭证配置文件、通过 `talk.realtime.providers.openai.apiKey` 为 Control UI Talk 设置的 Platform `OPENAI_API_KEY`、通过 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` 为 Voice Call 设置的 Platform `OPENAI_API_KEY`，或 `OPENAI_API_KEY` 环境变量。OpenAI OAuth 配置文件仍可在同一安装中运行 Codex 支持的 `openai/*` 聊天模型，但它们不会配置 Realtime 语音。
</Note>

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
`memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw
会将这些作为提供商特定的 `input_type` 请求字段转发：查询
嵌入使用 `queryInputType`；已索引的记忆片段和批量索引使用
`documentInputType`。完整示例见
[Memory 配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最适合：** 直接 API 访问和按用量计费。

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

    ### 路由摘要

    | 模型引用               | 运行时配置                                             | 路由                      | 凭证                                 |
    | ----------------------- | ------------------------------------------------------ | ------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`        | 未设置，或提供商/模型 `agentRuntime.id: "codex"`      | Codex app-server harness  | 有序 API key 凭证配置文件            |
    | `openai/gpt-5.4-mini`   | 未设置，或提供商/模型 `agentRuntime.id: "codex"`      | Codex app-server harness  | 有序 API key 凭证配置文件            |
    | `openai/gpt-5.5`        | 提供商/模型 `agentRuntime.id: "openclaw"`             | OpenClaw 嵌入式运行时     | 选定的 `openai` API key 配置文件     |

    <Note>
    `openai/*` 上的 Agent 轮次默认使用 Codex app-server harness。对于
    Agent 模型上的 API-key 认证，请创建一个 `openai` API-key 认证配置文件，并
    用 `auth.order.openai` 对它排序；`OPENAI_API_KEY` 仍然是非 Agent OpenAI API
    表面的直接兜底。运行 `openclaw doctor --fix` 以迁移较旧的旧版 Codex 认证顺序条目。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    要从 OpenAI API 试用 ChatGPT 当前的 Instant 模型，请将模型设置为
    `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是一个会变化的别名。OpenAI 建议生产 API 使用 `gpt-5.5`，
    因此除非你想要该别名行为，否则请保留 `openai/gpt-5.5` 作为稳定默认值。
    该别名只接受 `medium` 文本详细程度；对于此模型，OpenClaw 会把任何其他请求的详细程度强制为
    `medium`。

    <Warning>
    OpenClaw **不会** 在直接 OpenAI API-key 路由上暴露 `gpt-5.3-codex-spark`。
    只有当你的已登录账户暴露它时，才能通过 Codex 订阅目录条目使用它。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，并通过原生 Codex
    app-server 执行，而不是单独的 API key。Codex 云需要 ChatGPT 登录。

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        对于无头或不适合回调的设置，添加 `--device-code`，改用 ChatGPT 设备码流程登录，
        而不是 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        默认路径不需要运行时配置。OpenAI Agent 轮次会自动选择原生 Codex
        app-server 运行时，并且 OpenClaw 会在选择此路由时安装或修复内置的 Codex 插件。
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway 网关运行后，在聊天中发送 `/codex status` 或 `/codex models`，
        以验证原生 app-server 运行时。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用                | 运行时配置                                | 路由                                                  | 认证                                            |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | 未设置，或提供商/模型 `agentRuntime.id: "codex"` | 原生 Codex app-server harness                        | Codex 登录，或已排序的 `openai` 认证配置文件 |
    | `openai/gpt-5.5`         | 提供商/模型 `agentRuntime.id: "openclaw"`  | OpenClaw 嵌入式运行时，内部 Codex 认证传输 | 选定的 `openai` OAuth 配置文件                 |
    | 旧版 Codex GPT-5.5 引用 | 由 Doctor 修复                            | 重写为 `openai/gpt-5.5`                            | 已迁移的 OpenAI OAuth 配置文件                   |
    | `codex-cli/gpt-5.5`      | 由 Doctor 修复                            | 重写为 `openai/gpt-5.5`                            | Codex app-server 认证                           |

    <Warning>
    对于新的订阅支持 Agent 配置，优先使用 `openai/gpt-5.5`。较旧的
    Codex GPT 引用是旧版 OpenClaw 路由，而不是原生 Codex 运行时路径；
    运行 `openclaw doctor --fix` 迁移它们。`gpt-5.3-codex-spark`
    仍仅限于其 Codex 订阅目录公布该模型的账户；它的直接 OpenAI API-key 和 Azure 引用仍会被抑制。
    </Warning>

    <Note>
    新配置应将 OpenAI Agent 认证顺序放在 `auth.order.openai` 下；
    Doctor 会迁移较旧的旧版 Codex 认证顺序条目。
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

    如果有 API-key 备份，请保持模型为 `openai/gpt-5.5`，并将
    认证顺序放在 `openai` 下。OpenClaw 会先尝试订阅，然后尝试
    API key，同时保持在 Codex harness 上：

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
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备码流程登录；
    OpenClaw 会在自己的 Agent 认证存储中管理生成的凭据。
    </Note>

    ### 检查并恢复 Codex OAuth 路由

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    对于特定 Agent，添加 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果较旧的配置仍有旧版 Codex GPT 引用，或有未显式配置运行时的陈旧 OpenAI
    运行时会话固定项，请修复它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 没有显示可用的配置文件，请重新登录：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    对同一 Agent 中的多个 Codex OAuth 登录使用 `--profile-id`，然后
    通过认证顺序或 `/model ...@<profileId>` 控制它们：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    在依赖配置文件排序之前，运行 `openclaw doctor --fix` 以迁移较旧的旧版 OpenAI Codex 前缀
    配置文件 ID 和顺序条目。

    ### 状态指示器

    聊天中的 `/status` 会显示当前会话正在使用哪个模型运行时。对于 `openai/*`
    Agent 轮次，内置的 Codex app-server harness 会显示为
    `Runtime: OpenAI Codex`。陈旧的 OpenAI 运行时会话固定项会被修复为 Codex，除非配置显式固定为 OpenClaw。

    ### Doctor 警告

    如果配置或会话状态中仍保留旧版 Codex 模型引用或陈旧 OpenAI 运行时固定项，
    `openclaw doctor --fix` 会将它们重写为带 Codex 运行时的 `openai/*`，
    除非显式配置了 OpenClaw。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为不同的值。对于通过 Codex OAuth 目录使用的
    `openai/gpt-5.5`：

    - 原生 `contextWindow`：`400000`
    - 默认运行时 `contextTokens` 上限：`272000`

    在实践中，较小的默认上限具有更好的延迟和质量特性。使用 `contextTokens` 覆盖它：

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
    使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens`
    限制运行时上下文预算。直接 OpenAI API-key 路由会为 `gpt-5.5`
    报告更大的原生 `contextWindow`（`1000000`）；由于上游目录不同，这两个路由会分别跟踪。
    </Note>

    ### 目录恢复

    当存在 `gpt-5.5` 的上游 Codex 目录元数据时，OpenClaw 会使用它。
    如果实时 Codex 发现遗漏了 `gpt-5.5` 行，但账户已通过认证，OpenClaw 会合成该
    OAuth 模型行，以便 cron、子智能体和已配置默认模型的运行不会因
    `Unknown model` 失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 认证

原生 Codex app-server harness 使用 `openai/*` 模型引用，且运行时
配置未设置或提供商/模型 `agentRuntime.id: "codex"`，但其认证
仍然基于账户。OpenClaw 会按以下顺序选择认证：

1. Agent 的已排序 OpenAI 认证配置文件，优先放在
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的旧版
   Codex 认证配置文件 ID 和认证顺序。
2. app-server 的现有账户，例如本地 Codex CLI ChatGPT
   登录。
3. 仅适用于本地 stdio app-server 启动，并且仅当 app-server
   报告没有账户时：先 `CODEX_API_KEY`，再 `OPENAI_API_KEY`。

本地 ChatGPT/Codex 订阅登录不会仅因为 Gateway 网关进程也为直接 OpenAI 模型或
嵌入设置了 `OPENAI_API_KEY` 而被替换。环境 API-key 兜底仅适用于本地 stdio 无账户
路径；它绝不会通过 WebSocket app-server 连接发送。选择订阅风格的 Codex 配置文件时，
OpenClaw 还会让 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 不进入派生的 stdio app-server 子进程，
并通过 app-server 登录 RPC 发送选定凭据。

当该订阅配置文件被 Codex 使用限制阻止时，OpenClaw 会将该配置文件标记为阻止状态，直到
Codex 公布的重置时间，并允许认证顺序轮转到下一个 `openai:*` 配置文件，
同时不改变所选模型，也不退出 Codex harness。重置时间过后，该订阅配置文件会再次符合条件。

## 图像生成

内置的 `openai` 插件通过 `image_generate` 工具注册图像生成。它通过同一个
`openai/gpt-image-2` 模型引用，同时支持 OpenAI API-key 和 Codex OAuth 图像生成。

| 能力                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 认证                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录           |
| 传输                 | OpenAI Images API                  | Codex Responses 后端              |
| 每次请求最大图像数    | 4                                  | 4                                    |
| 编辑模式                 | 已启用（最多 5 张参考图像） | 已启用（最多 5 张参考图像）   |
| 尺寸覆盖            | 支持，包括 2K/4K 尺寸   | 支持，包括 2K/4K 尺寸     |
| 宽高比 / 分辨率 | 不转发到 OpenAI Images API | 在安全时映射到受支持的尺寸 |

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
参见 [图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、
提供商选择和故障转移行为。
</Note>

`gpt-image-2` 是 OpenAI 文本到图像生成和图像编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。透明背景的 PNG/WebP 输出请使用 `openai/gpt-image-1.5`；当前的 `gpt-image-2` API 会拒绝 `background: "transparent"`。

对于透明背景请求，请调用 `image_generate`，并设置 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；旧的 `openai.background` 提供商选项仍会被接受。OpenClaw 还会保护公共 OpenAI 和 OpenAI Codex OAuth 路由，将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5`；Azure 和自定义 OpenAI 兼容端点会保留它们配置的部署/模型名称。

同一设置也暴露给无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始使用 `openclaw infer image edit` 时，请使用相同的 `--output-format` 和 `--background` 标志。`--openai-background` 仍可作为 OpenAI 专用别名使用。使用 `--quality low|medium|high|auto` 控制 OpenAI Images 的质量和成本。使用 `--openai-moderation low|auto` 从 `image generate` 或 `image edit` 传递 OpenAI 的审核提示。

对于 ChatGPT/Codex OAuth 安装，请保留相同的 `openai/gpt-image-2` 引用。当配置了 `openai` OAuth 配置文件时，OpenClaw 会解析存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求；它不会先尝试 `OPENAI_API_KEY`，也不会静默回退到 API key。如果你想改用直接的 OpenAI Images API 路由，请显式配置 `models.providers.openai`，并提供 API key、自定义基础 URL 或 Azure 端点。如果该自定义图像端点位于受信任的 LAN/私有地址上，还需要设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此选择加入项，OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点。

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

| 能力 | 值 |
| ---------------- | ---------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文本到视频、图像到视频、单视频编辑 |
| 参考输入 | 1 张图像或 1 个视频 |
| 尺寸覆盖 | 支持文本到视频和图像到视频 |
| 宽高比 | 转换为最接近的受支持尺寸，而不是原样转发 |
| 其他覆盖 | `resolution`、`audio`、`watermark` 不受支持，会被丢弃并伴随工具警告 |

OpenAI 图像到视频请求使用 `POST /v1/videos`，并带有图像 `input_reference`。单视频编辑使用 `POST /v1/videos/edits`，上传的视频位于 `video` 字段中。

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

OpenAI provider 声明了 `supportsSize`，但未声明 `supportsAspectRatio` 或 `supportsResolution`。OpenClaw 的共享规范化层会在请求到达提供商之前，将请求的 `aspectRatio` 转换为最接近的 OpenAI `size`，因此宽高比请求通常仍可工作。`resolution` 没有尺寸回退，会被丢弃，并以 `Ignored unsupported overrides for openai/<model>: resolution=<value>` 的形式向调用方呈现。
</Note>

## GPT-5 提示贡献

OpenClaw 会为 `openai` 提供商上的 GPT-5 系列模型添加共享 GPT-5 提示贡献（包括规范化为 `openai/*` 的旧版修复前 Codex 引用）。其他同样提供 GPT-5 系列模型 ID 的提供商，例如 OpenRouter 或 opencode 路由，不会收到此覆盖；它由提供商 ID `openai` 作为门控，而不仅仅由模型 ID 决定。较旧的 GPT-4.x 模型永远不会收到它。

原生 Codex app-server harness 不会通过开发者指令接收 persona/tool-discipline 行为契约或友好的交互风格覆盖；原生 Codex 会保留 Codex 自有的基础、模型和项目文档行为，并且 OpenClaw 会为原生线程禁用 Codex 的内置 personality，使 Agent 工作区 personality 文件保持权威。OpenClaw 只向原生 Codex 线程贡献运行时上下文：渠道交付、OpenClaw 动态工具、ACP 委派、工作区上下文和 OpenClaw Skills。同一贡献中的 heartbeat-guidance 文本是唯一例外：原生 Codex Heartbeat 轮次确实会获得它，并且它会作为专用协作指令注入，而不是通过共享提示贡献钩子注入。

GPT-5 贡献会为匹配的 OpenClaw 组装提示添加带标签的行为契约，涵盖 persona 持久性、执行安全、工具纪律、输出形态、完成检查和验证。特定渠道的回复和静默消息行为仍保留在共享 OpenClaw 系统提示和出站交付策略中。友好的交互风格层是独立且可配置的。

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
值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当共享的 `agents.defaults.promptOverlays.gpt5.personality` 设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音和语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 表面注册语音合成。

    | 设置 | 配置路径 | 默认值 |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便签为 `opus`，文件为 `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | 基础 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 额外正文 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未设置） |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成的字段之后合并到 `/audio/speech` 请求 JSON 中，因此可用于需要额外键（例如 `lang`）的 OpenAI 兼容端点。原型键会被忽略。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不影响聊天 API 端点。OpenAI TTS 和 Realtime 语音都通过 OpenAI Platform API key 配置；仅 OAuth 安装仍可使用 Codex 支持的聊天模型，但不能使用 OpenAI 实时语音回复。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过 OpenClaw 的媒体理解转录表面注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 用于所有入站音频转录读取 `tools.media.audio` 的位置，包括 Discord 语音频道片段和渠道音频附件

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

    当共享音频媒体配置或每次调用的转录请求提供语言和提示提示时，它们会被转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册实时转录。

    | 设置 | 配置路径 | 默认值 |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示 | `...openai.prompt` | （未设置） |
    | 静默时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 凭证 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` OAuth | API key 直接连接；OAuth 会铸造 Realtime 转录客户端密钥 |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。当仅配置了 `openai` OAuth 时，Gateway 网关会在打开 WebSocket 之前铸造临时 Realtime 转录客户端密钥。此流式提供商用于 Voice Call 的实时转录路径；Discord 语音目前会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置 `openai` 插件为 Voice Call 插件注册实时语音。

    | 设置                               | 配置路径                                                              | 默认值             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | 模型                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2`    |
    | 语音                                  | `...openai.voice`                                                       | `alloy`             |
    | 温度（Azure 部署桥接）  | `...openai.temperature`                                                 | `0.8`               |
    | VAD 阈值                          | `...openai.vadThreshold`                                                | `0.5`                |
    | 静音时长                       | `...openai.silenceDurationMs`                                           | `500`                |
    | 前缀填充                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | 推理强度                       | `...openai.reasoningEffort`                                             | （未设置）              |
    | 凭证                                   | `openai` API key 凭证配置文件、`...openai.apiKey` 或 `OPENAI_API_KEY`  | 需要 OpenAI Platform API key；OpenAI OAuth 不会配置实时语音 |

    `gpt-realtime-2` 可用的内置实时语音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 推荐使用 `marin` 和 `cedar` 以获得最佳实时质量。这
    与上面的文本转语音音色是不同集合；仅用于 TTS 的音色
    例如 `fable`、`nova` 或 `onyx` 对实时会话无效。

    <Note>
    后端 OpenAI 实时桥接使用 GA Realtime WebSocket 会话
    形态，该形态不接受 `session.temperature`。Azure OpenAI
    部署仍可通过 `azureEndpoint` 和 `azureDeployment` 使用，并
    保持与部署兼容的会话形态（包括 `temperature`）。
    支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    创建会话时会选择实时语音。OpenAI 允许多数
    会话字段稍后更改，但在该会话中模型已经发出音频后，语音不能再更改。
    OpenClaw 目前将内置实时语音 ID 作为字符串公开。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器实时会话，通过 Gateway 网关
    签发的临时客户端密钥，以及浏览器直接与 OpenAI Realtime API 进行
    WebRTC SDP 交换。Gateway 网关会使用所选 `openai` API key 凭证配置文件或已配置的 OpenAI Platform
    API key 签发该客户端密钥。Gateway 网关中继和 Voice Call 后端实时 WebSocket 桥接
    对原生 OpenAI 端点使用相同的仅 API key 凭证路径。
    维护者可通过
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    进行实时验证；
    OpenAI 分支会同时验证后端 WebSocket 桥接和浏览器
    WebRTC SDP 交换，且不会记录密钥。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置 `openai` 提供商可以通过覆盖基础 URL，将图像
生成目标指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw
会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换为
Azure 的请求形态。

<Note>
实时语音使用单独的配置路径
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影响。请参阅 [语音和语音合成](#voice-and-speech) 下的 **实时语音**
折叠项了解其 Azure
设置。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业
  协议
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

对于识别出的 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用部署范围路径（`/openai/deployments/{deployment}/...`）
- 向每个请求追加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。
  每次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）保留标准
OpenAI 图像请求形态。

<Note>
`openai` 提供商图像生成路径的 Azure 路由要求
OpenClaw 2026.4.22 或更高版本。较早版本会把任何自定义
`openai.baseUrl` 当作公共 OpenAI 端点处理，并在访问 Azure 图像
部署时失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION`，为 Azure 图像生成路径固定特定 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置该变量时，默认值为 `2024-12-01-preview`。

### 模型名称就是部署名称

Azure OpenAI 将模型绑定到部署。对于通过内置 `openai` 提供商
路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段
必须是你在 Azure 门户中配置的 **Azure 部署名称**，而不是
公共 OpenAI 模型 ID。

如果你创建了一个名为 `gpt-image-2-prod` 的部署来服务 `gpt-image-2`：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同一部署名称规则适用于通过内置 `openai` 提供商
路由的任何图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。创建
部署前请查看 Microsoft 当前的区域列表，并确认你的区域提供特定模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些
`background` 值），或只在特定模型
版本上公开这些选项。这些差异来自 Azure 和底层模型，而不是
OpenClaw。如果 Azure 请求因验证错误失败，请在
Azure 门户中检查你的特定部署和 API 版本支持的
参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因标头 - 请参阅 [高级配置](#advanced-configuration) 下的 **原生与 OpenAI 兼容
路由** 折叠项。

对于 Azure 上的聊天或 Responses 流量（图像生成以外），请使用
新手引导流程或专用 Azure 提供商配置；仅设置 `openai.baseUrl`
不会启用 Azure API/凭证形态。存在单独的
`azure-openai-responses/*` 提供商；请参阅下面的服务端压缩
折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 优先使用 WebSocket，并以 SSE 作为回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 前重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级 60 秒，并在
      冷却期间使用 SSE
    - 为重试和
      重连附加稳定的会话和轮次身份标头
    - 在
      传输变体之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

    | 值                | 行为                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（默认）   | WebSocket 优先，SSE 回退     |
    | `"sse"`              | 仅强制使用 SSE                    |
    | `"websocket"`        | 仅强制使用 WebSocket              |

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

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先处理
    （`service_tier = "priority"`）。现有 `service_tier` 值会
    保留，并且快速模式不会重写 `reasoning` 或
    `text.verbosity`。`fastMode: "auto"` 会让新的模型调用以快速模式启动，直到
    自动截止时间，之后的重试、回退、工具结果或
    续接调用则不使用快速模式。截止时间默认为 60 秒；
    在活动模型上设置 `params.fastAutoOnSeconds` 可更改它。

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
    会话覆盖优先于配置。在
    Sessions UI 中清除会话覆盖后，会话会返回已配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 公开优先处理。可在 OpenClaw 中按
    模型设置：

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
    `serviceTier` 只会转发到原生 OpenAI 端点
    （`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。
    如果你通过代理路由任一提供商，OpenClaw 会保持
    `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），
    OpenAI 插件的 OpenClaw 流包装器会自动启用服务端
    压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（或不可用时为
      `80000`）

    这适用于内置 OpenClaw 运行时路径，以及嵌入式运行使用的 OpenAI 提供商
    钩子。原生 Codex 应用服务器 harness 通过 Codex 管理
    自己的上下文，不受此设置影响。

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
    `responsesServerCompaction` 只控制 `context_management` 注入。
    直接 OpenAI Responses 模型仍会强制使用 `store: true`，除非 compat
    设置 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体式 GPT 模式">
    对于通过 OpenClaw 内置运行时运行的 `openai` provider GPT-5 系列模型，
    OpenClaw 已默认使用更严格的执行契约，称为
    `strict-agentic`。只要解析后的提供商是
    `openai` 且模型 ID 匹配 GPT-5 系列，它就会自动激活，除非配置
    明确选择退出：

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    显式设置 `"strict-agentic"` 在受支持通道上是无操作（它
    已经是默认值），在不受支持的提供商/模型组合上也不会生效。

    启用 `strict-agentic` 后，OpenClaw 会：
    - 对实质性工作自动启用 `update_plan`
    - 使用可见答案续写来重试结构为空或仅含推理的轮次
    - 当所选 harness 提供显式计划事件时使用它们

    OpenClaw 不会对助手正文进行分类来判断某个轮次是
    计划、进度更新还是最终答案。

    <Note>
    此契约完全存在于 OpenClaw 的内置 Agent 运行器中。它不适用于原生 Codex
    app-server harness，后者管理自己的轮次和计划行为；对于原生 Codex 运行，
    harness 选择比执行契约设置更重要。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 对待直接 OpenAI、Codex 和 Azure OpenAI 端点的方式，
    不同于通用 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对会拒绝 `reasoning.effort: "none"` 的模型或代理省略已禁用的推理
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头（Azure
      OpenAI 不会获得这些标头，即使它是原生路由）
    - 保留仅 OpenAI 使用的请求整形（`service_tier`、`store`、
      reasoning-compat、prompt-cache hints）

    **代理/兼容路由：**
    - 使用更宽松的 compat 行为
    - 从非原生 `openai-completions` 负载中剥离 Completions `store`
    - 接受用于 OpenAI 兼容 Completions 代理的高级 `params.extra_body`/`params.extraBody` 透传 JSON
    - 接受用于 OpenAI 兼容 Completions
      代理（例如 vLLM）的 `params.chat_template_kwargs`
    - 不强制使用严格工具 schema 或仅原生使用的标头

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
