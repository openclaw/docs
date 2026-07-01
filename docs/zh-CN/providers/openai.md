---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅凭证而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T07:51:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 提供用于 GPT 模型的开发者 API，Codex 也可通过 OpenAI 的 Codex 客户端作为
ChatGPT 套餐内的代码智能体使用。OpenClaw 对两种凭证形态使用同一个
提供商 ID：`openai`。

OpenClaw 使用 `openai/*` 作为规范的 OpenAI 模型路由。OpenAI 模型上的嵌入式智能体
轮次默认通过原生 Codex app-server 运行时执行；直接的 OpenAI API-key 凭证仍可用于非智能体
OpenAI 表面，例如图像、嵌入、语音和实时功能。

- **智能体模型** - 通过 Codex 运行时使用 `openai/*` 模型；使用
  Codex 凭证登录以使用 ChatGPT/Codex 订阅，或在你明确需要 API-key 凭证时配置兼容 Codex 的
  OpenAI API-key 备用配置。
- **非智能体 OpenAI API** - 通过 `OPENAI_API_KEY` 或 OpenAI API-key 新手引导直接访问
  OpenAI Platform，并按用量计费。
- **旧版配置** - 旧版 Codex 模型引用会由
  `openclaw doctor --fix` 修复为 `openai/*` 加 Codex 运行时。

OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

提供商、模型、运行时和渠道是相互独立的层。如果这些标签被混在一起，
请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再修改配置。

## 快速选择

| 目标                                                 | 使用                                                      | 备注                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅 | `openai/gpt-5.5`                                         | 默认 OpenAI 智能体设置。使用 Codex 凭证登录。                  |
| GPT-5.6 限量预览                              | `openai/gpt-5.6-sol`, `-terra`, 或 `-luna`               | 需要 OpenAI 批准的 API 组织或 Codex 工作区。      |
| 智能体模型的直接 API-key 计费              | `openai/gpt-5.5` 加一个兼容 Codex 的 API-key 配置文件 | 使用 `auth.order.openai` 将备用配置放在订阅凭证之后。  |
| 通过显式 OpenClaw 进行直接 API-key 计费     | `openai/gpt-5.5` 加提供商/模型运行时 `openclaw`  | 选择一个普通的 `openai` API-key 配置文件。                             |
| 最新 ChatGPT Instant API 别名                     | `openai/chat-latest`                                     | 仅限直接 API-key。用于实验的移动别名，不是默认值。   |
| 通过 OpenClaw 使用 ChatGPT/Codex 订阅凭证     | `openai/gpt-5.5` 加提供商/模型运行时 `openclaw`  | 为兼容路由选择一个 `openai` OAuth 配置文件。         |
| 图像生成或编辑                          | `openai/gpt-image-2`                                     | 可配合 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。             |
| 透明背景图像                        | `openai/gpt-image-1.5`                                   | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

## 命名映射

这些名称相似，但不能互换：

| 你会看到的名称                            | 层             | 含义                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | 提供商前缀   | 规范的 OpenAI 模型路由；智能体轮次使用 Codex 运行时。                                  |
| 旧版 OpenAI Codex 前缀              | 旧版前缀     | 较旧的模型/配置文件命名空间。`openclaw doctor --fix` 会将其迁移到 `openai`。                   |
| `codex` 插件                          | 插件            | 内置 OpenClaw 插件，提供原生 Codex app-server 运行时和 `/codex` 聊天控制。 |
| 提供商/模型 `agentRuntime.id: codex` | Agent Runtimes     | 强制对匹配的嵌入式轮次使用原生 Codex app-server harness。                            |
| `/codex ...`                            | 聊天命令集  | 从会话中绑定/控制 Codex app-server 线程。                                        |
| `runtime: "acp", agentId: "codex"`      | ACP 会话路由 | 通过 ACP/acpx 运行 Codex 的显式备用路径。                                          |

这意味着配置可以有意包含 `openai/*` 模型引用，而凭证配置文件
可以指向 API-key 或 ChatGPT/Codex OAuth 凭据。配置中使用
`auth.order.openai`；`openclaw doctor --fix` 会将旧版
旧版 Codex 模型引用、旧版 Codex 凭证配置文件 ID，以及
旧版 Codex 凭证顺序重写到规范的 OpenAI 路由。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API-key 访问和订阅/OAuth 路由使用。
对于 ChatGPT/Codex 订阅加原生 Codex 执行，请使用 `openai/gpt-5.5`；
现在未设置运行时配置时，OpenAI 智能体轮次会选择 Codex harness。仅当你想为
OpenAI 智能体模型使用直接 API-key 凭证时，才使用 OpenAI API-key 配置文件。
</Note>

## GPT-5.6 限量预览

OpenClaw 识别三个公开的 GPT-5.6 模型 ID：

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

这三个模型在当前 Codex app-server 目录中都暴露 `max` 推理级别。
OpenAI 发布公告将 Sol 描述为旗舰层级，Terra 描述为平衡层级，
Luna 描述为快速、较低成本层级。请参阅
[GPT-5.6 发布公告](https://openai.com/index/previewing-gpt-5-6-sol/)
和[预览访问指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

预览期间访问权限采用 allowlist，并且 API 和 Codex 可分别授予访问权限。
仅有付费 ChatGPT 套餐并不会授予访问权限。OpenClaw 将
`openai/gpt-5.5` 保持为默认值；如果在没有访问权限的情况下选择 GPT-5.6 引用，
会返回上游访问错误，而不是静默回退。

<Note>
OpenAI 智能体模型轮次需要内置的 Codex app-server 插件。显式
OpenClaw 运行时配置仍可作为可选的兼容路由使用。当使用 `openai` OAuth 配置文件
显式选择 OpenClaw 时，OpenClaw 会将公开模型引用保留为
`openai/*`，并在内部通过 Codex-auth 传输路由。运行 `openclaw doctor --fix`
以修复陈旧的旧版 Codex 模型引用、`codex-cli/*`，或并非来自
显式运行时配置的旧运行时会话固定配置。
</Note>

## OpenClaw 功能覆盖

| OpenAI 能力         | OpenClaw 表面                                                                              | 状态                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供商                                                               | 是                                                                    |
| Codex 订阅模型 | 带 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                                    |
| 旧版 Codex 模型引用   | 旧版 Codex 模型引用或 `codex-cli/<model>`                                                | 由 Doctor 修复为 `openai/<model>`                                 |
| Codex app-server harness  | 省略运行时的 `openai/<model>`，或提供商/模型 `agentRuntime.id: codex`              | 是                                                                    |
| 服务端 Web 搜索    | 原生 OpenAI Responses 工具                                                                  | 是，当启用 Web 搜索且未固定提供商时                 |
| 图像                    | `image_generate`                                                                              | 是                                                                    |
| 视频                    | `video_generate`                                                                              | 是                                                                    |
| 文本转语音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                                    |
| 批量语音转文本      | `tools.media.audio` / 媒体理解                                                     | 是                                                                    |
| 流式语音转文本  | 语音通话 `streaming.provider: "openai"`                                                     | 是                                                                    |
| 实时语音            | 语音通话 `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（需要 OpenAI Platform 额度，而不是 Codex/ChatGPT 订阅） |
| 嵌入                | 记忆嵌入提供商                                                                     | 是                                                                    |

<Note>
  OpenAI Realtime 语音（由语音通话的 `realtime.provider: "openai"` 和
  使用 `talk.realtime.provider: "openai"` 的 Control UI Talk 使用）通过
  公开的 **OpenAI Platform Realtime API**，其费用从 OpenAI
  Platform 额度中扣除，而不是从 Codex/ChatGPT 订阅配额中扣除。即使某个账号拥有健康的
  OpenAI OAuth，并且可以正常运行 Codex 支持的聊天模型，
  Realtime 语音仍需要 OpenAI API-key 凭证配置文件，或需要一个启用了付费
  Platform 计费的 Platform API key。

修复方法：在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
为支持你的实时凭据的组织充值 Platform 额度。Realtime 语音接受
由 `openclaw onboard --auth-choice openai-api-key` 创建的 `openai` API-key 凭证配置文件、
通过 `talk.realtime.providers.openai.apiKey` 为 Control UI Talk 配置的 Platform `OPENAI_API_KEY`、
通过 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
为语音通话配置的 Platform `OPENAI_API_KEY`，或 `OPENAI_API_KEY` 环境变量。OpenAI OAuth
配置文件仍可在同一个 OpenClaw 安装中运行 Codex 支持的 `openai/*` 聊天模型，
但它们不会配置 Realtime 语音。
</Note>

## 记忆嵌入

OpenClaw 可以使用 OpenAI，或兼容 OpenAI 的嵌入端点，来为
`memory_search` 建立索引和查询嵌入：

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
`documentInputType`。完整示例请参阅[记忆配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

选择你偏好的凭证方式并按照设置步骤操作。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最适合：** 直接 API 访问和按用量计费。

    <Steps>
      <Step title="获取你的 API key">
        从 [OpenAI Platform 仪表板](https://platform.openai.com/api-keys) 创建或复制 API key。
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

    | 模型引用              | 运行时配置             | 路由                       | 凭证             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | Codex app-server harness | 兼容 Codex 的 OpenAI 配置档案 |
    | `openai/gpt-5.4-mini` | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | Codex app-server harness | 兼容 Codex 的 OpenAI 配置档案 |
    | `openai/gpt-5.5`      | 提供商/模型 `agentRuntime.id: "openclaw"`              | OpenClaw 嵌入式运行时      | 已选择的 `openai` 配置档案 |

    <Note>
    `openai/*` Agent 模型使用 Codex app-server harness。若要对 Agent 模型使用 API key
    凭证，请创建一个兼容 Codex 的 API-key 配置档案，并通过 `auth.order.openai`
    排序；`OPENAI_API_KEY` 仍是非 Agent OpenAI API 表面的直接回退。
    运行 `openclaw doctor --fix` 以迁移较旧的旧版 Codex 凭证排序条目。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要从 OpenAI API 尝试 ChatGPT 当前的 Instant 模型，请将模型
    设置为 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是一个会变动的别名。OpenAI 将其记录为 ChatGPT 中使用的最新 Instant
    模型，并建议生产 API 用法使用 `gpt-5.5`，因此除非你明确需要该
    别名行为，否则请将 `openai/gpt-5.5` 保持为稳定默认值。该别名目前仅接受
    `medium` 文本详细程度，因此 OpenClaw 会为此
    模型规范化不兼容的 OpenAI 文本详细程度覆盖项。

    <Warning>
    OpenClaw **不会**在直接 OpenAI API-key 路由上公开 `gpt-5.3-codex-spark`。只有在你的已登录账户公开它时，它才可通过 Codex 订阅目录条目使用。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，通过原生 Codex app-server 执行，而不是单独的 API key。Codex cloud 需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        对于无头或不适合回调的设置，添加 `--device-code`，以使用 ChatGPT 设备代码流程登录，而不是 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用规范 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        默认路径不需要运行时配置。OpenAI Agent 轮次会
        自动选择原生 Codex app-server 运行时，并且 OpenClaw
        会在选择此路由时安装或修复内置 Codex 插件。
      </Step>
      <Step title="验证 Codex 凭证可用">
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
    | `openai/gpt-5.5` | 省略 / 提供商/模型 `agentRuntime.id: "codex"` | 原生 Codex app-server harness | Codex 登录或已排序的 `openai` 凭证配置档案 |
    | `openai/gpt-5.5` | 提供商/模型 `agentRuntime.id: "openclaw"` | 带内部 Codex 凭证传输的 OpenClaw 嵌入式运行时 | 已选择的 `openai` OAuth 配置档案 |
    | 旧版 Codex GPT-5.5 引用 | 由 Doctor 修复 | 旧版路由重写为 `openai/gpt-5.5` | 已迁移的 OpenAI OAuth 配置档案 |
    | `codex-cli/gpt-5.5` | 由 Doctor 修复 | 旧版 CLI 路由重写为 `openai/gpt-5.5` | Codex app-server 凭证 |

    <Warning>
    新的订阅支持的 Agent 配置请优先使用 `openai/gpt-5.5`。较旧的
    旧版 Codex GPT 引用是旧版 OpenClaw 路由，而不是原生 Codex 运行时
    路径；当你想将它们迁移到规范 `openai/*` 引用时，请运行 `openclaw doctor --fix`。
    `gpt-5.3-codex-spark` 仍仅限于其 Codex 订阅目录公布该模型的账户；
    直接 OpenAI API-key 和 Azure 引用仍会被抑制。
    </Warning>

    <Note>
    旧版 Codex 模型前缀是由 Doctor 修复的旧版配置。对于
    常见的订阅加原生运行时设置，请使用 Codex 凭证登录，
    但将模型引用保持为 `openai/gpt-5.5`。新配置应将 OpenAI
    Agent 凭证排序放在 `auth.order.openai` 下；Doctor 会迁移较旧的
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

    如果有 API-key 备份，请将模型保持在 `openai/gpt-5.5`，并将
    凭证排序放在 `openai` 下。OpenClaw 会先尝试订阅，然后
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
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的设备代码流程登录，OpenClaw 会在自己的 Agent 凭证存储中管理生成的凭据。
    </Note>

    ### 检查并恢复 Codex OAuth 路由

    使用这些命令查看你的默认
    Agent 正在使用哪个模型、运行时和凭证路由：

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

    如果较旧的配置仍有旧版 Codex GPT 引用，或没有显式运行时配置的陈旧 OpenAI 运行时
    会话固定，请修复它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 未显示可用配置档案，请
    重新登录：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    当你希望在同一个
    Agent 中有多个 Codex OAuth 登录，并稍后想通过凭证排序或 `/model ...@<profileId>` 控制它们时，请使用 `--profile-id`：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` 是 OpenAI Agent 轮次通过 Codex 使用的模型路由。请运行
    `openclaw doctor --fix`，以在依赖配置档案排序之前迁移较旧的旧版 OpenAI Codex 前缀配置档案 ID 和
    排序条目。

    ### 状态指示器

    聊天 `/status` 会显示当前会话中哪个模型运行时处于活动状态。
    对于 OpenAI Agent 模型轮次，内置 Codex app-server harness 显示为 `Runtime: OpenAI Codex`。
    除非配置明确固定为 OpenClaw，否则陈旧的 OpenAI 运行时会话固定会被修复为 Codex。

    ### Doctor 警告

    如果配置或会话状态中仍存在旧版 Codex 模型引用或陈旧的 OpenAI 运行时固定，
    `openclaw doctor --fix` 会将它们重写为带 Codex 运行时的 `openai/*`，
    除非 OpenClaw 已被显式配置。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立的值。

    对于通过 Codex OAuth 目录使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。用 `contextTokens` 覆盖它：

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

    当上游 Codex 目录元数据中存在 `gpt-5.5` 时，OpenClaw 会使用它。
    如果实时 Codex 发现省略了 `gpt-5.5` 行，而
    账户已通过身份验证，OpenClaw 会合成该 OAuth 模型行，以便
    cron、子智能体和已配置的默认模型运行不会因
    `Unknown model` 而失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 凭证

原生 Codex app-server harness 使用 `openai/*` 模型引用加省略的
运行时配置，或提供商/模型 `agentRuntime.id: "codex"`，但其凭证
仍基于账户。OpenClaw 按以下顺序选择凭证：

1. Agent 的已排序 OpenAI 凭证配置档案，最好位于
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的
   旧版 Codex 凭证配置档案 ID 和旧版 Codex 凭证排序。
2. app-server 的现有账户，例如本地 Codex CLI ChatGPT 登录。
3. 仅对于本地 stdio app-server 启动，当 app-server 报告没有账户且仍需要
   OpenAI 凭证时，使用 `CODEX_API_KEY`，然后
   `OPENAI_API_KEY`。

这意味着本地 ChatGPT/Codex 订阅登录不会仅仅因为
Gateway 网关进程也有用于直接 OpenAI 模型或嵌入的 `OPENAI_API_KEY`
而被替换。环境变量 API-key 回退仅适用于本地 stdio 无账户路径；它
不会发送到 WebSocket app-server 连接。当选择订阅式 Codex
配置档案时，OpenClaw 还会让 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
不进入生成的 stdio app-server 子进程，并通过 app-server 登录 RPC
发送所选凭据。当该订阅配置档案因
Codex 用量限制被阻止时，OpenClaw 可以轮换到下一个已排序的 `openai:*` API-key
配置档案，而不更改所选模型，也不会脱离 Codex
harness。一旦订阅重置时间过去，该订阅配置档案
会再次符合使用条件。

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成。
它支持 OpenAI API-key 图像生成，也支持通过同一个 `openai/gpt-image-2` 模型引用进行 Codex OAuth 图像
生成。

| 能力                      | OpenAI API 密钥                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 凭证                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录              |
| 传输                      | OpenAI Images API                  | Codex Responses 后端                 |
| 每次请求的最大图片数      | 4                                  | 4                                    |
| 编辑模式                  | 已启用（最多 5 张参考图片）        | 已启用（最多 5 张参考图片）          |
| 尺寸覆盖                  | 支持，包括 2K/4K 尺寸              | 支持，包括 2K/4K 尺寸                |
| 宽高比 / 分辨率           | 不转发给 OpenAI Images API         | 在安全时映射到受支持的尺寸          |

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
请参阅 [图片生成](/zh-CN/tools/image-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

`gpt-image-2` 是 OpenAI 文本生成图片和图片编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。使用 `openai/gpt-image-1.5` 生成透明背景的 PNG/WebP 输出；当前的 `gpt-image-2` API 会拒绝 `background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并设置 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；较旧的 `openai.background` 提供商选项仍会被接受。OpenClaw 还会保护公共 OpenAI 和 OpenAI Codex OAuth 路由，将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5`；Azure 和自定义 OpenAI 兼容端点会保留其已配置的部署 / 模型名称。

同一设置也可用于无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

从输入文件开始时，请对 `openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 标志。`--openai-background` 仍作为 OpenAI 专用别名可用。当你需要控制 OpenAI Images 的质量和成本时，请使用 `--quality low|medium|high|auto`。使用 `--openai-moderation low|auto` 可从 `image generate` 或 `image edit` 传递 OpenAI 的提供商专用审核提示。

对于 ChatGPT/Codex OAuth 安装，请保留相同的 `openai/gpt-image-2` 引用。当配置了 `openai` OAuth 配置文件时，OpenClaw 会解析存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图片请求。它不会先尝试 `OPENAI_API_KEY`，也不会为该请求静默回退到 API 密钥。当你想改用直接的 OpenAI Images API 路由时，请使用 API 密钥、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。
如果该自定义图片端点位于受信任的 LAN/私有地址上，还需设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此显式启用项，否则 OpenClaw 会继续阻止私有 / 内部 OpenAI 兼容图片端点。

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

内置的 `openai` 插件通过 `video_generate` 工具注册视频生成功能。

| 能力           | 值                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型       | `openai/sora-2`                                                                   |
| 模式           | 文本生成视频、图片生成视频、单视频编辑                                           |
| 参考输入       | 1 张图片或 1 个视频                                                               |
| 尺寸覆盖       | 支持文本生成视频和图片生成视频                                                   |
| 其他覆盖       | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略并产生工具警告          |

OpenAI 图片生成视频请求使用带图片 `input_reference` 的 `POST /v1/videos`。单视频编辑使用 `POST /v1/videos/edits`，并将上传的视频放在 `video` 字段中。

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

## GPT-5 prompt 贡献

OpenClaw 会为 OpenClaw 组装的 prompt 表面上的 GPT-5 系列运行添加共享的 GPT-5 prompt 贡献。它按模型 ID 应用，因此 OpenClaw/提供商路由，例如旧版修复前引用（旧版 Codex GPT-5.5 引用）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 和其他兼容的 GPT-5 引用，都会接收同一覆盖层。较旧的 GPT-4.x 模型不会接收。

内置的原生 Codex harness 不会通过 Codex app-server 开发者指令接收此 OpenClaw GPT-5 覆盖层。原生 Codex 会保留 Codex 拥有的基础、模型和项目文档行为，而 OpenClaw 会为原生线程禁用 Codex 的内置人格，以便 Agent 工作区人格文件保持权威。OpenClaw 仅贡献运行时上下文，例如渠道投递、OpenClaw 动态工具、ACP 委派、工作区上下文和 OpenClaw Skills。

GPT-5 贡献会为匹配的 OpenClaw 组装 prompt 添加一个带标签的行为契约，涵盖 persona 持久性、执行安全、工具纪律、输出形态、完成检查和验证。特定渠道的回复和静默消息行为仍位于共享 OpenClaw 系统 prompt 和出站投递策略中。友好的交互风格层是独立且可配置的。

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
    内置的 `openai` 插件会为 `messages.tts` 表面注册语音合成。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 声音 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便签为 `opus`，文件为 `mp3` |
    | API 密钥 | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | 基础 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 额外正文 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未设置） |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用声音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成的字段之后合并到 `/audio/speech` 请求 JSON 中，因此可将它用于需要额外键（例如 `lang`）的 OpenAI 兼容端点。原型键会被忽略。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不影响聊天 API 端点。OpenAI TTS 和 Realtime 语音都通过 OpenAI Platform API 密钥配置；仅 OAuth 安装仍可使用 Codex 支持的聊天模型，但不能使用 OpenAI 实时回话。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件会通过 OpenClaw 的媒体理解转录表面注册批量语音转文本。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用 `tools.media.audio`，均受支持，包括 Discord 语音频道片段和渠道音频附件

    要强制为入站音频转录使用 OpenAI：

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

    当共享音频媒体配置或单次调用转录请求提供语言和 prompt 提示时，它们会被转发给 OpenAI。

  </Accordion>

  <Accordion title="Realtime 转录">
    内置的 `openai` 插件会为 Voice Call 插件注册 realtime 转录。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | Prompt | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 凭证 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` OAuth | API 密钥直接连接；OAuth 会签发一个 Realtime 转录客户端密钥 |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，音频格式为 G.711 u-law（`g711_ulaw` / `audio/pcmu`）。当仅配置 `openai` OAuth 时，Gateway 网关会在打开 WebSocket 前签发一个短期 Realtime 转录客户端密钥。此流式提供商用于 Voice Call 的 realtime 转录路径；Discord 语音目前会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="Realtime 语音">
    内置的 `openai` 插件会为 Voice Call 插件注册 realtime 语音。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 语音 | `...openai.voice` | `alloy` |
    | 温度（Azure 部署桥接） | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音持续时间 | `...openai.silenceDurationMs` | `500` |
    | 前缀填充 | `...openai.prefixPaddingMs` | `300` |
    | 推理强度 | `...openai.reasoningEffort` |（未设置）|
    | 凭证 | `openai` API key 凭证配置文件、`...openai.apiKey` 或 `OPENAI_API_KEY` | 需要 OpenAI Platform API key；OpenAI OAuth 不会配置 Realtime 语音 |

    `gpt-realtime-2` 可用的内置 Realtime 语音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建议使用 `marin` 和 `cedar` 以获得最佳 Realtime 质量。这
    与上面的文本转语音语音是独立集合；不要假设 `fable`、
    `nova` 或 `onyx` 等 TTS 语音可用于 Realtime 会话。

    <Note>
    后端 OpenAI Realtime 桥接使用 GA Realtime WebSocket 会话形状，该形状不接受 `session.temperature`。Azure OpenAI 部署仍可通过 `azureEndpoint` 和 `azureDeployment` 使用，并保留与部署兼容的会话形状。支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    创建会话时会选择 Realtime 语音。OpenAI 允许稍后更改大多数
    会话字段，但一旦模型在该会话中发出音频，就无法更改语音。
    OpenClaw 目前将内置 Realtime 语音 ID 以字符串形式公开。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器 Realtime 会话，通过 Gateway 网关签发的
    临时客户端密钥，以及浏览器直接与 OpenAI Realtime API 进行 WebRTC SDP 交换。
    Gateway 网关会使用所选 `openai` API key 凭证配置文件或已配置的 OpenAI Platform API key
    签发该客户端密钥。Gateway 网关中继和 Voice Call 后端 Realtime WebSocket 桥接
    对原生 OpenAI 端点使用相同的仅 API key 凭证路径。维护者实时验证可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`；
    OpenAI 分支会验证后端 WebSocket 桥接和浏览器
    WebRTC SDP 交换，且不会记录密钥。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置 `openai` 提供商可以通过覆盖基础 URL，面向 Azure OpenAI 资源进行图像
生成。在图像生成路径上，OpenClaw 会检测 `models.providers.openai.baseUrl` 上的
Azure 主机名，并自动切换到 Azure 的请求形状。

<Note>
Realtime 语音使用单独的配置路径
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影响。其 Azure
设置请参阅 [语音和朗读](#voice-and-speech) 下的 **Realtime
语音** 折叠项。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你想将流量保留在现有 Azure 租户内

### 配置

若要通过内置 `openai` 提供商使用 Azure 图像生成，请将
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

对于位于已识别 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用部署作用域路径（`/openai/deployments/{deployment}/...`）
- 为每个请求追加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。
  每次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）会保留标准
OpenAI 图像请求形状。

<Note>
`openai` 提供商图像生成路径的 Azure 路由需要
OpenClaw 2026.4.22 或更高版本。更早版本会将任何自定义
`openai.baseUrl` 当作公共 OpenAI 端点处理，并会在访问 Azure
图像部署时失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可为 Azure 图像生成路径固定特定 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置该变量时，默认值为 `2024-12-01-preview`。

### 模型名称就是部署名称

Azure OpenAI 会将模型绑定到部署。对于通过内置 `openai` 提供商
路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段
必须是你在 Azure 门户中配置的 **Azure 部署名称**，而不是
公共 OpenAI 模型 ID。

如果你创建了一个名为 `gpt-image-2-prod`、用于提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则适用于通过内置 `openai` 提供商路由的
图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。创建部署前请检查 Microsoft 当前的区域列表，
并确认你的区域提供具体模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些
`background` 值），或仅在特定模型版本上公开这些选项。这些差异来自 Azure
和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误失败，请在
Azure 门户中检查你的具体部署和 API 版本支持的
参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会收到
OpenClaw 的隐藏归因标头 — 请参阅 [高级配置](#advanced-configuration) 下的
**原生路由与 OpenAI 兼容路由** 折叠项。

对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用
新手引导流程或专用 Azure 提供商配置 — 仅使用 `openai.baseUrl`
不会采用 Azure API/凭证形状。另有一个单独的
`azure-openai-responses/*` 提供商；请参阅下面的服务器端压缩折叠项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 优先使用 WebSocket，并以 SSE 作为回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 前重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重新连接附加稳定的会话和轮次身份标头
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
    - [通过 WebSocket 使用 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [流式 API 响应（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 为 `openai/*` 公开共享的快速模式开关：

    - **聊天/UI：** `/fast status|auto|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先级处理（`service_tier = "priority"`）。现有 `service_tier` 值会被保留，快速模式不会重写 `reasoning` 或 `text.verbosity`。`fastMode: "auto"` 会让新的模型调用在自动截止时间前使用快速模式，然后让后续重试、回退、工具结果或续接调用不使用快速模式。截止时间默认是 60 秒；可在活动模型上设置 `params.fastAutoOnSeconds` 来更改。

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
    会话覆盖优先于配置。在 Sessions UI 中清除会话覆盖会让该会话回到已配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先级处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 公开优先级处理。在 OpenClaw 中按模型设置它：

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
    `serviceTier` 只会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，OpenClaw 会让 `service_tier` 保持不变。
    </Warning>

  </Accordion>

  <Accordion title="服务器端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 OpenClaw 流包装器会自动启用服务器端压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 OpenClaw 运行时路径，也适用于嵌入式运行使用的 OpenAI 提供商钩子。原生 Codex 应用服务器 harness 通过 Codex 管理自己的上下文，并由 OpenAI 的默认 Agent 路由或提供商/模型运行时策略配置。

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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
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
    - 为实质性工作自动启用 `update_plan`
    - 对结构上为空或仅含推理的轮次，使用可见答案续写进行重试
    - 在所选 harness 提供显式 harness 计划事件时使用它们

    OpenClaw 不会对助手正文进行分类来判断某一轮是计划、进度更新还是最终答案。

    <Note>
    仅限 OpenAI 和 Codex GPT-5 系列运行。其他提供商和更早的模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw 会区别处理直接的 OpenAI、Codex 和 Azure OpenAI 端点，以及通用的兼容 OpenAI 的 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对会拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头
    - 保留仅 OpenAI 使用的请求整形（`service_tier`、`store`、reasoning 兼容、prompt-cache 提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` payload 中剥离 Completions `store`
    - 接受面向兼容 OpenAI 的 Completions 代理的高级 `params.extra_body`/`params.extraBody` 透传 JSON
    - 接受面向兼容 OpenAI 的 Completions 代理（例如 vLLM）的 `params.chat_template_kwargs`
    - 不强制使用严格工具 schema 或仅原生路由使用的标头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因标头。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    共享的图像工具参数和提供商选择。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数和提供商选择。
  </Card>
  <Card title="OAuth and auth" href="/zh-CN/gateway/authentication" icon="key">
    凭证详情和凭据复用规则。
  </Card>
</CardGroup>
