---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅凭证而不是 API keys
    - 你需要更严格的 GPT-5 agent 执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-06T21:53:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70d1f583ce1ddaed9a4f394847e697a0b1ff21d5fd90ba7e0b837206db52659b
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw 对直接 API 密钥认证和 ChatGPT/Codex 订阅认证都使用同一个提供商 ID：`openai`。`openai/*` 是规范模型路由。默认情况下，`openai/*` 上的嵌入式智能体轮次会通过内置 Codex app-server 运行时运行；直接 API 密钥认证仍可用于非智能体 OpenAI 表面（图像、视频、嵌入、语音、实时），也可作为智能体轮次的显式兼容性路由。

- **智能体模型** - 通过 Codex 运行时使用 `openai/*`。若要使用 ChatGPT/Codex 订阅，请用 Codex 认证登录；若要基于密钥计费，请配置 API 密钥认证配置文件。
- **非智能体 OpenAI API** - 通过 `OPENAI_API_KEY` 或 `openai` API 密钥认证配置文件直接访问 OpenAI Platform，并按使用量计费。
- **旧版配置** - 旧 Codex 模型引用和配置文件 ID 会由 `openclaw doctor --fix` 修复为 `openai/*`。

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

## 使用量和成本跟踪

OpenClaw 将订阅配额和 Platform API 计费分开处理：

- ChatGPT/Codex OAuth 会显示订阅计划、配额窗口和积分余额。
- `OPENAI_ADMIN_KEY` 会在 Control UI **使用量** 中显示提供商报告的 30 天组织成本和 completions 使用量，包括每日支出、请求/token 总量、热门模型和成本类别。
- `OPENAI_PROJECT_ID` 可选地将 Admin API 历史范围限定到一个项目。
- OpenClaw 永远不会把 `OPENAI_API_KEY` 或 `openai` 推理配置文件发送给组织 API；这些凭证可能属于自定义、Azure 或智能体本地端点。

显式 Admin 密钥优先于 OAuth。提供商报告的历史不会与 OpenClaw 根据会话估算的成本合并；它可能包含其他客户端的 API 活动和提供商侧的计费调整。

OpenAI 的 [API 使用量仪表板](https://help.openai.com/en/articles/10478918)文档说明了使用量数据所需的组织所有者权限和显式 Usage Dashboard 权限。

提供商、模型、运行时和渠道是分开的层。如果这些标签被混在一起，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再更改配置。

## 快速选择

| 目标                                              | 使用                                                               | 备注                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| ChatGPT/Codex 订阅，原生 Codex 运行时             | `openai/gpt-5.5`                                                   | 默认设置。使用 Codex 认证登录。                                         |
| GPT-5.6 受限预览                                  | `openai/gpt-5.6-sol`、`-terra` 或 `-luna`                          | 需要 OpenAI 批准的 API 组织或 Codex 工作区 allowlist 条目。             |
| 智能体轮次的直接 API 密钥计费                     | `openai/gpt-5.5` 加上有序 API 密钥认证配置文件                    | 设置 `auth.order.openai`，将密钥配置文件放在订阅认证之后。              |
| 直接 API 密钥计费，显式 OpenClaw 运行时           | `openai/gpt-5.5` 加提供商/模型 `agentRuntime.id: "openclaw"`       | 选择普通的 `openai` API 密钥配置文件。                                  |
| 最新 ChatGPT Instant 模型别名                     | `openai/chat-latest`                                               | 仅直接 API 密钥；这是会移动的别名，不是稳定默认值。                     |
| 图像生成或编辑                                    | `openai/gpt-image-2`                                               | 可配合 `OPENAI_API_KEY` 或 Codex OAuth 使用。                           |
| 透明背景图像                                      | `openai/gpt-image-1.5`                                             | 将 `outputFormat` 设为 `png` 或 `webp`，并设置 `background=transparent`。 |

## 命名映射

| 你看到的名称                            | 层                | 含义                                                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | 提供商前缀        | 规范 OpenAI 模型路由；智能体轮次默认使用 Codex 运行时。                                  |
| `codex` 插件                            | 插件              | 提供原生 Codex app-server 运行时和 `/codex` 聊天控制的内置插件。                         |
| 提供商/模型 `agentRuntime.id: codex`    | Agent 运行时      | 为匹配的嵌入式轮次强制使用原生 Codex app-server harness。                                |
| `/codex ...`                            | 聊天命令集        | 从对话中绑定/控制 Codex app-server 线程。                                                |
| `runtime: "acp", agentId: "codex"`      | ACP 会话路由      | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                                |

`openclaw doctor --fix` 会将旧版 Codex 模型引用、旧版 Codex 认证配置文件 ID 和旧版 Codex 认证顺序条目迁移到规范 `openai` 路由。新的认证顺序配置请使用 `auth.order.openai`。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API 密钥访问和订阅/OAuth 路由使用。对于使用原生 Codex 执行的 ChatGPT/Codex 订阅，请使用 `openai/gpt-5.5` 并保持运行时配置未设置；这样已经会选择 Codex harness。只有在需要为智能体模型使用直接 API 密钥认证时，才使用 API 密钥认证配置文件。
</Note>

## GPT-5.6 受限预览

OpenClaw 识别三个公开 GPT-5.6 模型 ID：`openai/gpt-5.6-sol`、`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna`。当前目录中，这三者都暴露 `xhigh` 和 `max` 推理。OpenAI 将 Sol 描述为旗舰层级，Terra 描述为平衡层级，Luna 描述为快速且成本较低的层级。请参阅 [GPT-5.6 发布公告](https://openai.com/index/previewing-gpt-5-6-sol/)和[预览访问指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

预览期间访问权限采用 allowlist，并且 API 和 Codex 可以分别授予；仅有付费 ChatGPT 计划并不会授予访问权限。OpenClaw 保持 `openai/gpt-5.5` 作为默认值，并且不会对访问错误做特殊处理，因此在没有访问权限时选择 GPT-5.6 引用会直接暴露上游错误，而不是静默回退。

<Note>
默认情况下，`openai/*` 上的智能体模型轮次需要内置 Codex app-server 插件。显式 OpenClaw 运行时配置仍可作为可选择启用的兼容性路由：当使用 `openai` OAuth 配置文件显式选择 OpenClaw 时，模型引用保持为 `openai/*`，但请求会在内部通过 Codex 认证传输路由。运行 `openclaw doctor --fix` 以修复陈旧的旧版 Codex 模型引用、`codex-cli/*` 引用，或不是由显式运行时配置设置的旧运行时会话固定项。
</Note>

## OpenClaw 功能覆盖

| OpenAI 能力              | OpenClaw 表面                                                                                 | 状态                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供商                                                                   | 是                                                              |
| Codex 订阅模型            | 使用 OpenAI OAuth 的 `openai/<model>`                                                         | 是                                                              |
| 旧版 Codex 模型引用       | 旧 Codex 模型引用、`codex-cli/<model>`                                                        | 由 Doctor 修复为 `openai/<model>`                               |
| Codex app-server harness  | 运行时未设置的 `openai/<model>`，或提供商/模型 `agentRuntime.id: codex`                       | 是                                                              |
| 服务端 Web 搜索           | 原生 OpenAI Responses 工具                                                                    | 是，在启用 Web 搜索且未固定其他提供商时                         |
| 图像                      | `image_generate`                                                                              | 是                                                              |
| 视频                      | `video_generate`                                                                              | 是                                                              |
| 文本转语音                | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                              |
| 批量语音转文本            | `tools.media.audio` / 媒体理解                                                                | 是                                                              |
| 流式语音转文本            | Voice Call `streaming.provider: "openai"`                                                     | 是                                                              |
| 实时语音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（OpenAI API 密钥或 Codex OAuth）                             |
| 嵌入                      | 记忆嵌入提供商                                                                                | 是                                                              |

<Note>
OpenAI 实时语音通过公共 **OpenAI Platform Realtime API**。它接受 Platform API 密钥或 `openai` OAuth 配置文件，包括自动发现的外部 Codex 登录。API 密钥会话使用该密钥的 Platform 计费；OAuth 可用性和计费遵循已认证账号的 Realtime 权益。

如果 API 密钥认证报告缺少计费，请在使用 API 密钥认证时，为支持你的实时凭证的组织在 [platform.openai.com/account/billing](https://platform.openai.com/account/billing) 充值 Platform 积分。实时语音接受由 `openclaw onboard --auth-choice openai-api-key` 创建的 `openai` API 密钥认证配置文件、`openai` OAuth 配置文件或外部 Codex 登录、通过 `talk.realtime.providers.openai.apiKey` 为 Control UI Talk 设置的 Platform `OPENAI_API_KEY`，或通过 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` 为 Voice Call 设置的 Platform `OPENAI_API_KEY`，或 `OPENAI_API_KEY` 环境变量。
</Note>

## 记忆嵌入

OpenClaw 可以为 `memory_search` 索引和查询嵌入使用 OpenAI，或使用兼容 OpenAI 的嵌入端点：

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

对于需要非对称嵌入标签的兼容 OpenAI 端点，请在 `memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw 会将这些作为提供商特定的 `input_type` 请求字段转发：查询嵌入使用 `queryInputType`；已索引的记忆片段和批量索引使用 `documentInputType`。完整示例请参阅[记忆配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接 API 访问和按使用量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        从 [OpenAI Platform 仪表板](https://platform.openai.com/api-keys)创建或复制 API 密钥。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或者直接传入密钥：

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

    | 模型引用              | 运行时配置                                       | 路由                     | 凭证                              |
    | ----------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`       | 未设置，或 provider/model `agentRuntime.id: "codex"`   | Codex app-server harness   | 有序 API key 凭证配置文件       |
    | `openai/gpt-5.4-mini`  | 未设置，或 provider/model `agentRuntime.id: "codex"`   | Codex app-server harness   | 有序 API key 凭证配置文件       |
    | `openai/gpt-5.5`       | provider/model `agentRuntime.id: "openclaw"`          | OpenClaw 嵌入式运行时  | 选定的 `openai` API key 配置文件  |

    <Note>
    `openai/*` 上的智能体轮次默认使用 Codex app-server harness。对于
    智能体模型上的 API key 凭证，请创建一个 `openai` API key 凭证配置文件，并
    用 `auth.order.openai` 排序；`OPENAI_API_KEY` 仍然是非智能体 OpenAI API
    表面的直接回退。运行 `openclaw doctor --fix` 可迁移较旧的遗留 Codex
    凭证顺序条目。
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

    `chat-latest` 是一个动态别名。OpenAI 建议生产 API 使用
    `gpt-5.5`，因此除非你需要该别名行为，否则请将 `openai/gpt-5.5`
    保持为稳定默认值。该别名只接受 `medium` 文本详细程度；
    对于此模型，OpenClaw 会将任何其他请求的详细程度强制为 `medium`。

    <Warning>
    OpenClaw **不会**在直接 OpenAI API key 路由上公开
    `gpt-5.3-codex-spark`。只有当你登录的账号公开它时，它才可通过
    Codex 订阅目录条目使用。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，通过原生 Codex
    app-server 执行，而不是单独的 API key。Codex 云需要
    ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        对于无头环境或不适合回调的设置，添加 `--device-code` 以使用
        ChatGPT 设备码流程登录，而不是 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用规范 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        默认路径不需要运行时配置。OpenAI 智能体轮次会自动选择原生
        Codex app-server 运行时，并且当选择此路由时，OpenClaw 会安装或修复
        内置 Codex 插件。
      </Step>
      <Step title="验证 Codex 凭证可用">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway 网关运行后，在聊天中发送 `/codex status` 或 `/codex models`
        来验证原生 app-server 运行时。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用                | 运行时配置                                | 路由                                                  | 凭证                                            |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | 未设置，或 provider/model `agentRuntime.id: "codex"` | 原生 Codex app-server harness                        | Codex 登录，或有序 `openai` 凭证配置文件 |
    | `openai/gpt-5.5`         | provider/model `agentRuntime.id: "openclaw"`  | OpenClaw 嵌入式运行时，内部 Codex 凭证传输 | 选定的 `openai` OAuth 配置文件                 |
    | 遗留 Codex GPT-5.5 引用 | 由 Doctor 修复                            | 重写为 `openai/gpt-5.5`                            | 已迁移的 OpenAI OAuth 配置文件                   |
    | `codex-cli/gpt-5.5`      | 由 Doctor 修复                            | 重写为 `openai/gpt-5.5`                            | Codex app-server 凭证                           |

    <Warning>
    新的订阅支持智能体配置应优先使用 `openai/gpt-5.5`。较旧的
    Codex GPT 引用是遗留 OpenClaw 路由，不是原生 Codex 运行时
    路径；运行 `openclaw doctor --fix` 可迁移它们。`gpt-5.3-codex-spark`
    仍然仅限于其 Codex 订阅目录发布该模型的账号；
    它的直接 OpenAI API key 和 Azure 引用仍会被隐藏。
    </Warning>

    <Note>
    新配置应将 OpenAI 智能体凭证顺序放在 `auth.order.openai` 下；
    Doctor 会迁移较旧的遗留 Codex 凭证顺序条目。
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

    使用 API key 备用时，请将模型保持在 `openai/gpt-5.5`，并将
    凭证顺序放在 `openai` 下。OpenClaw 会先尝试订阅，再尝试
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
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth
    （默认）或上面的设备码流程登录；OpenClaw 会在自己的智能体凭证存储中
    管理生成的凭据。
    </Note>

    ### 检查和恢复 Codex OAuth 路由

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    对于特定智能体，添加 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果较旧配置仍有遗留 Codex GPT 引用，或有没有显式运行时配置的陈旧 OpenAI
    运行时会话固定，请修复它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 没有显示可用配置文件，请重新登录：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    对于同一智能体中的多个 Codex OAuth 登录，请使用 `--profile-id`，然后
    通过凭证排序或 `/model ...@<profileId>` 控制它们：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    在依赖配置文件排序之前，运行 `openclaw doctor --fix` 以迁移较旧的遗留
    OpenAI Codex 前缀配置文件 ID 和顺序条目。

    ### 状态指示器

    聊天中的 `/status` 会显示当前会话使用的模型运行时。对于 `openai/*`
    智能体轮次，内置 Codex app-server harness 显示为
    `Runtime: OpenAI Codex`。除非配置显式固定到 OpenClaw，否则陈旧 OpenAI
    运行时会话固定会被修复为 Codex。

    ### Doctor 警告

    如果配置或会话状态中仍有遗留 Codex 模型引用或陈旧 OpenAI 运行时固定，
    `openclaw doctor --fix` 会将它们重写为带 Codex 运行时的 `openai/*`，
    除非已显式配置 OpenClaw。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为不同的值。
    对于通过 Codex OAuth 目录使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`400000`
    - 默认运行时 `contextTokens` 上限：`272000`

    实践中，较小的默认上限具有更好的延迟和质量特性。
    可用 `contextTokens` 覆盖它：

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
    限制运行时上下文预算。直接 OpenAI API key 路由会为 `gpt-5.5`
    报告更大的原生 `contextWindow`（`1000000`）；由于上游目录不同，
    这两条路由会分别跟踪。
    </Note>

    ### 目录恢复

    当存在上游 Codex 目录元数据时，OpenClaw 会将其用于 `gpt-5.5`。
    如果账号已认证但实时 Codex 发现遗漏了 `gpt-5.5` 行，OpenClaw 会合成
    该 OAuth 模型行，以便 cron、子智能体和已配置默认模型的运行不会因
    `Unknown model` 而失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 凭证

原生 Codex app-server harness 使用 `openai/*` 模型引用，并且运行时
配置未设置，或 provider/model `agentRuntime.id: "codex"`，但其凭证
仍然基于账号。OpenClaw 按以下顺序选择凭证：

1. 智能体的有序 OpenAI 凭证配置文件，最好位于
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的遗留
   Codex 凭证配置文件 ID 和凭证顺序。
2. app-server 的现有账号，例如本地 Codex CLI ChatGPT 登录。
3. 仅限本地 stdio app-server 启动，并且仅当 app-server 报告无账号时：
   `CODEX_API_KEY`，然后是 `OPENAI_API_KEY`。

本地 ChatGPT/Codex 订阅登录不会仅仅因为 Gateway 网关进程也有用于
直接 OpenAI 模型或 embeddings 的 `OPENAI_API_KEY` 而被替换。环境变量
API key 回退仅适用于本地 stdio 无账号路径；它绝不会通过 WebSocket
app-server 连接发送。选择订阅风格的 Codex 配置文件时，OpenClaw 还会阻止
`CODEX_API_KEY` 和 `OPENAI_API_KEY` 进入生成的 stdio app-server 子进程，
并改为通过 app-server 登录 RPC 发送所选凭据。

当该订阅配置文件因 Codex 使用限制而被阻止时，OpenClaw 会将该配置文件
标记为阻止，直到 Codex 发布的重置时间，并允许凭证排序轮换到下一个
`openai:*` 配置文件，而不更改所选模型，也不退出 Codex harness。
重置时间过后，该订阅配置文件会重新可用。

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成。它通过同一个
`openai/gpt-image-2` 模型引用，同时支持 OpenAI API key 和 Codex OAuth
图像生成。

| 能力                      | OpenAI API 密钥                    | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 身份验证                  | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录              |
| 传输                      | OpenAI Images API                  | Codex Responses 后端                 |
| 每次请求的最大图像数      | 4                                  | 4                                    |
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
参阅 [图像生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

`gpt-image-2` 是 OpenAI 文本转图像生成和图像编辑的默认值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。使用 `openai/gpt-image-1.5` 输出透明背景 PNG/WebP；当前 `gpt-image-2` API 会拒绝 `background: "transparent"`。

对于透明背景请求，调用 `image_generate` 时使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；较旧的 `openai.background` 提供商选项仍被接受。OpenClaw 还会保护公开 OpenAI 和 OpenAI Codex OAuth 路由，方法是将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5`；Azure 和自定义 OpenAI 兼容端点会保留其配置的部署/模型名称。

同一设置也暴露给无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，对 `openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 标志。`--openai-background` 仍可作为 OpenAI 专用别名使用。使用 `--quality low|medium|high|auto` 控制 OpenAI Images 的质量和成本。使用 `--openai-moderation low|auto` 从 `image generate` 或 `image edit` 传递 OpenAI 的审核提示。

对于 ChatGPT/Codex OAuth 安装，保留相同的 `openai/gpt-image-2` 引用。配置 `openai` OAuth 配置文件后，OpenClaw 会解析已存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求；它不会先尝试 `OPENAI_API_KEY`，也不会静默回退到 API 密钥。当你想改用直接 OpenAI Images API 路由时，请使用 API 密钥、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。如果该自定义图像端点位于受信任的 LAN/私有地址，还要设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此选择加入设置，否则 OpenClaw 会保持阻止私有/内部 OpenAI 兼容图像端点。

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

| 能力             | 值                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| 默认模型         | `openai/sora-2`                                                                    |
| 模式             | 文本转视频、图像转视频、单视频编辑                                                 |
| 参考输入         | 1 张图像或 1 个视频                                                                |
| 尺寸覆盖         | 文本转视频和图像转视频均支持                                                       |
| 宽高比           | 转换为最接近的受支持尺寸，不原样转发                                               |
| 其他覆盖         | 不支持 `resolution`、`audio`、`watermark`，并会随工具警告一起丢弃                  |

OpenAI 图像转视频请求使用 `POST /v1/videos` 和图像 `input_reference`。单视频编辑使用 `POST /v1/videos/edits`，上传的视频位于 `video` 字段。

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
参阅 [视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。

OpenAI provider 声明 `supportsSize`，但不声明 `supportsAspectRatio` 或 `supportsResolution`。OpenClaw 的共享规范化层会在请求到达提供商之前，将请求的 `aspectRatio` 转换为最接近匹配的 OpenAI `size`，因此宽高比请求通常仍可工作。`resolution` 没有尺寸回退，会被丢弃，并以 `Ignored unsupported overrides for openai/<model>: resolution=<value>` 的形式呈现给调用方。
</Note>

## GPT-5 提示贡献

OpenClaw 会为 `openai` 提供商上的 GPT-5 系列模型添加共享 GPT-5 提示贡献（包括规范化为 `openai/*` 的旧版修复前 Codex 引用）。其他也提供 GPT-5 系列模型 ID 的提供商，例如 OpenRouter 或 opencode 路由，不会收到此覆盖；它受提供商 ID `openai` 限制，而不仅仅受模型 ID 限制。较旧的 GPT-4.x 模型永远不会收到它。

原生 Codex 应用服务器 harness 不会通过开发者指令接收角色/工具纪律行为契约或友好的交互风格覆盖；原生 Codex 保留 Codex 自有的基础、模型和项目文档行为，并且 OpenClaw 会为原生线程禁用 Codex 的内置个性，以便 Agent 工作区个性文件保持权威。OpenClaw 只向原生 Codex 线程贡献运行时上下文：渠道投递、OpenClaw 动态工具、ACP 委派、工作区上下文和 OpenClaw skills。来自同一贡献的心跳指导文本是唯一例外：原生 Codex 心跳轮次确实会获得它，并作为专用协作指令注入，而不是通过共享提示贡献钩子注入。

GPT-5 贡献会为匹配的 OpenClaw 组装提示添加带标签的行为契约，涵盖角色持久性、执行安全、工具纪律、输出形态、完成检查和验证。特定渠道的回复和静默消息行为保留在共享 OpenClaw 系统提示和出站投递策略中。友好的交互风格层是独立且可配置的。

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
值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当共享 `agents.defaults.promptOverlays.gpt5.personality` 设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音和语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置 `openai` 插件为 `messages.tts` 表面注册语音合成。

    | 设置         | 配置路径                                             | 默认值                              |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | 模型         | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | 语音         | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | 速度         | `messages.tts.providers.openai.speed`                  | （未设置）                       |
    | 指令         | `messages.tts.providers.openai.instructions`           | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式         | `messages.tts.providers.openai.responseFormat`         | 语音便笺使用 `opus`，文件使用 `mp3` |
    | API 密钥     | `messages.tts.providers.openai.apiKey`                 | 回退到 `OPENAI_API_KEY`          |
    | 基础 URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | 额外正文     | `messages.tts.providers.openai.extraBody` / `extra_body` | （未设置）                        |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成的字段之后合并进 `/audio/speech` 请求 JSON，因此可将其用于需要额外键（例如 `lang`）的 OpenAI 兼容端点。原型键会被忽略。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不影响聊天 API 端点。OpenAI TTS 和 Realtime 语音都通过 OpenAI Platform API 密钥配置；仅 OAuth 的安装仍可使用 Codex 支持的聊天模型，但不能使用 OpenAI 实时语音回复。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `openai` 插件通过 OpenClaw 的媒体理解转录表面注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 使用位置：任何入站音频转录读取 `tools.media.audio` 的地方，包括 Discord 语音频道片段和渠道音频附件

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

    当共享音频媒体配置或逐次调用转录请求提供语言和提示时，它们会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置 `openai` 插件为 Voice Call 插件注册实时转录。

    | 设置          | 配置路径                                                          | 默认值 |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | 模型            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言         | `...openai.language`                                                 | （未设置） |
    | 提示词           | `...openai.prompt`                                                   | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD 阈值    | `...openai.vadThreshold`                                             | `0.5`   |
    | 凭证             | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` OAuth              | API key 直接连接；OAuth 签发 Realtime 转录客户端密钥 |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，并使用
    G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。当仅配置了 `openai` OAuth 时，
    Gateway 网关会在打开 WebSocket 之前签发一个临时 Realtime 转录客户端密钥。
    此流式传输提供商用于 Voice Call 的实时转录路径；Discord 语音目前会录制短片段，
    并改用批处理 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
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
    | 凭证                                   | `openai` API-key/OAuth 配置文件、外部 Codex 登录、`...openai.apiKey` 或 `OPENAI_API_KEY` | API-key 来源优先；Codex OAuth 作为回退 |

    `gpt-realtime-2` 可用的内置 Realtime 语音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 推荐使用 `marin` 和 `cedar` 以获得最佳 Realtime 质量。这
    与上面的文本转语音语音是不同集合；仅用于 TTS 的语音
    例如 `fable`、`nova` 或 `onyx` 对 Realtime 会话无效。

    <Note>
    后端 OpenAI realtime 桥接使用 GA Realtime WebSocket 会话形态，
    该形态不接受 `session.temperature`。Azure OpenAI
    部署仍可通过 `azureEndpoint` 和 `azureDeployment` 使用，并
    保留部署兼容的会话形态（包括 `temperature`）。
    支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    Realtime 语音在会话创建时选择。OpenAI 允许之后更改大多数
    会话字段，但模型在该会话中发出音频后，语音就无法更改。
    OpenClaw 目前以字符串形式公开内置 Realtime 语音 ID。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器 realtime 会话，配合由 Gateway 网关
    签发的临时客户端密钥，并针对 OpenAI Realtime API 进行直接浏览器 WebRTC SDP 交换。
    Gateway 网关使用选定的 `openai` 凭证签发该客户端密钥。
    已配置的密钥、API-key 配置文件和 `OPENAI_API_KEY` 优先；`openai` OAuth 配置文件或外部
    Codex 登录作为回退。Gateway 网关中继和 Voice Call 后端 realtime
    WebSocket 桥接对原生 OpenAI 端点使用相同的凭证顺序。
    维护者实时验证可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`；
    OpenAI 分支会验证后端 WebSocket 桥接和浏览器
    WebRTC SDP 交换，且不会记录密钥。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置 `openai` 提供商可以通过覆盖基础 URL，将图像
生成指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw
会检测 `models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换到
Azure 的请求形态。

<Note>
Realtime voice 使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影响。有关其 Azure
设置，请参阅 [Voice and speech](#voice-and-speech) 下的 **Realtime
voice** 折叠项。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业
  协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内

### 配置

要通过内置 `openai` 提供商进行 Azure 图像生成，请将
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

OpenClaw 会为 Azure 图像生成
路由识别以下 Azure 主机后缀：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于已识别 Azure 主机上的图像生成请求，OpenClaw：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用部署作用域路径（`/openai/deployments/{deployment}/...`）
- 向每个请求追加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。
  单次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）保留标准
OpenAI 图像请求形态。

<Note>
`openai` 提供商图像生成路径的 Azure 路由需要
OpenClaw 2026.4.22 或更高版本。早期版本会将任何自定义
`openai.baseUrl` 当作公共 OpenAI 端点处理，并在 Azure 图像
部署上失败。
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

如果你创建了名为 `gpt-image-2-prod`、用于提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则适用于通过内置 `openai` 提供商
路由的任何图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。创建部署前请查看 Microsoft 当前的区域列表，
并确认你的区域提供该具体模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些
`background` 值），或只在特定模型
版本上公开这些选项。这些差异来自 Azure 和底层模型，而不是
OpenClaw。如果 Azure 请求因验证错误失败，请在
Azure 门户中检查你的具体部署和 API 版本支持的
参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收
OpenClaw 的隐藏归因标头 - 请参阅 [Advanced configuration](#advanced-configuration) 下的 **Native vs OpenAI-compatible
routes** 折叠项。

对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用
新手引导流程或专用 Azure 提供商配置；仅设置 `openai.baseUrl`
不会采用 Azure API/凭证形态。另有一个
`azure-openai-responses/*` 提供商；请参阅下面的服务器端压缩
折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 优先使用 WebSocket，并使用 SSE 回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 前重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级 60 秒，并在
      冷却期间使用 SSE
    - 为重试和重新连接附加稳定的会话和轮次身份标头
    - 在传输变体之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

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
    OpenClaw 为 `openai/*` 暴露共享快速模式开关：

    - **聊天/UI：** `/fast status|auto|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先处理
    （`service_tier = "priority"`）。已有的 `service_tier` 值会被
    保留，快速模式不会重写 `reasoning` 或
    `text.verbosity`。`fastMode: "auto"` 会让新的模型调用在自动
    截止前以快速模式启动，然后让后续重试、回退、工具结果或
    续写调用不使用快速模式。截止时间默认为 60 秒；
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
    Sessions UI 中清除会话覆盖会让会话恢复到已配置默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 暴露优先处理。可在 OpenClaw 中按
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
    `serviceTier` 仅转发到原生 OpenAI 端点
    (`api.openai.com`) 和原生 Codex 端点 (`chatgpt.com/backend-api`)。
    如果你通过代理路由任一提供商，OpenClaw 会保持
    `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务器端压缩（Responses API）">
    对于直接的 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），
    OpenAI 插件的 OpenClaw 流包装器会自动启用服务器端
    压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为
      `80000`）

    这适用于内置的 OpenClaw 运行时路径，以及嵌入式运行使用的 OpenAI provider
    钩子。原生 Codex 应用服务器 harness 通过 Codex 管理自己的上下文，不受此设置影响。

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
    直接的 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性
    设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 模式">
    对于通过 OpenClaw 嵌入式运行时运行的 `openai` provider GPT-5 系列模型，
    OpenClaw 已默认使用一个更严格的执行合约，称为
    `strict-agentic`。只要解析出的提供商是
    `openai` 且模型 ID 匹配 GPT-5 系列，它就会自动激活，除非配置
    显式选择退出：

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    显式设置 `"strict-agentic"` 在受支持的路径上是无操作（它
    已经是默认值），在不受支持的提供商/模型组合上则不起作用。

    启用 `strict-agentic` 后，OpenClaw 会：
    - 对实质性工作自动启用 `update_plan`
    - 对结构上为空或仅包含推理的轮次，用可见答案
      continuation 重试
    - 在所选 harness 提供显式计划事件时使用它们

    OpenClaw 不会对助手正文进行分类，以判断某个轮次是
    计划、进度更新还是最终答案。

    <Note>
    此合约完全存在于 OpenClaw 的嵌入式智能体运行器中。它不
    适用于原生 Codex 应用服务器 harness，后者会自行管理
    轮次和计划行为；对于原生 Codex 运行，harness 选择比
    执行合约设置更重要。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理
    不同于通用 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留
      `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理
      省略已禁用的推理
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头（Azure
      OpenAI 不会获得这些标头，即使它是原生路由）
    - 保留仅 OpenAI 使用的请求整形（`service_tier`、`store`、
      reasoning 兼容性、prompt-cache 提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` payload 中移除 Completions `store`
    - 接受高级 `params.extra_body`/`params.extraBody` 透传 JSON，
      用于 OpenAI 兼容的 Completions 代理
    - 接受用于 vLLM 等 OpenAI 兼容 Completions
      代理的 `params.chat_template_kwargs`
    - 不强制使用严格工具 schema 或仅原生标头

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
    凭证详情和凭证复用规则。
  </Card>
</CardGroup>
