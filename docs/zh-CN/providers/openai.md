---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你希望使用 Codex 订阅身份验证，而不是 API key
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API key 或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-12T14:43:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc433abdf4fb8984430054acecdda3ba01b9795ad52cc89b19e10b09c6bcc8c3
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw 使用同一个提供商 ID `openai` 来支持直接 API key 身份验证和
ChatGPT/Codex 订阅身份验证。`openai/*` 是规范的模型路由。
对于未设置运行时策略或策略为 `auto` 的嵌入式智能体轮次，OpenAI 的路由
事实决定 OpenClaw 是否可以隐式选择内置的 Codex app-server 运行时。
仅有 `openai/*` 前缀并不会选择运行时。

- **智能体模型** - `openai/*` 使用由显式 `agentRuntime` 配置或 OpenAI
  的隐式路由策略选定的运行时。使用 Codex 身份验证登录，以使用
  ChatGPT/Codex 订阅；如果需要基于密钥计费，则配置 API key 身份验证
  配置文件。
- **非智能体 OpenAI API** - 通过 `OPENAI_API_KEY` 或 `openai` API key
  身份验证配置文件直接访问 OpenAI Platform，并按使用量计费。
- **旧版配置** - `openclaw doctor --fix` 会将旧 Codex 模型引用和配置文件
  ID 修复为 `openai/*`。

OpenAI 明确支持在 OpenClaw 等外部工具和工作流中使用订阅 OAuth。

## 使用量和成本跟踪

OpenClaw 将订阅配额与 Platform API 计费分开处理：

- ChatGPT/Codex OAuth 显示订阅方案、配额窗口和信用余额。
- `OPENAI_ADMIN_KEY` 会在 Control UI 的 **使用量** 中显示提供商报告的 30 天组织成本和补全使用量，包括每日支出、请求/令牌总数、热门模型和成本类别。
- `OPENAI_PROJECT_ID` 可选择将 Admin API 历史记录限定到一个项目。
- OpenClaw 绝不会将 `OPENAI_API_KEY` 或 `openai` 推理配置文件发送给组织 API；这些凭据可能属于自定义、Azure 或智能体本地端点。

显式 Admin key 的优先级高于 OAuth。提供商报告的历史记录不会与 OpenClaw 根据会话得出的估算成本合并；其中可能包含来自其他客户端的 API 活动和提供商侧的计费调整。

OpenAI 的 [API 使用量仪表板](https://help.openai.com/en/articles/10478918)文档介绍了访问使用量数据所需的组织所有者权限和显式 Usage Dashboard 权限。

提供商、模型、运行时和渠道是彼此独立的层。如果这些标签混淆在一起，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)，再更改配置。

## 快速选择

| 目标                                              | 使用                                                               | 说明                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex 订阅、原生 Codex 运行时             | `openai/gpt-5.6-sol`                                               | 全新订阅设置；使用 Codex 身份验证登录。                             |
| 智能体轮次使用直接 API key 计费                   | `openai/gpt-5.6` 加有序的 API key 身份验证配置文件                 | 全新 API key 设置；不带后缀的直接 API ID 会解析为 Sol。             |
| 选择确切的 GPT-5.6 层级                           | `openai/gpt-5.6-sol`、`-terra` 或 `-luna`                          | 使用 `models list` 检查此账户可用的层级。                           |
| 无 GPT-5.6 访问权限的账户                         | `openai/gpt-5.5`                                                   | 显式恢复选项；OpenClaw 不会静默降级。                               |
| 直接 API key 计费、显式 OpenClaw 运行时           | `openai/gpt-5.6` 加提供商/模型 `agentRuntime.id: "openclaw"`       | 选择普通的 `openai` API key 配置文件。                              |
| 最新 ChatGPT Instant 模型别名                     | `openai/chat-latest`                                               | 仅限直接 API key；这是动态别名，而非稳定默认值。                    |
| 图像生成或编辑                                    | `openai/gpt-image-2`                                               | 可配合 `OPENAI_API_KEY` 或 Codex OAuth 使用。                       |
| 透明背景图像                                      | `openai/gpt-image-1.5`                                             | 将 `outputFormat` 设置为 `png` 或 `webp`，并设置 `background=transparent`。 |

## 命名映射

| 你看到的名称                            | 层                | 含义                                                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | 提供商前缀        | 规范的 OpenAI 模型路由；路由事实决定隐式运行时。                                         |
| `codex` 插件                            | 插件              | 提供原生 Codex app-server 运行时和 `/codex` 聊天控制功能的内置插件。                     |
| 提供商/模型 `agentRuntime.id: codex`    | 智能体运行时      | 强制匹配的嵌入式轮次使用原生 Codex app-server harness。                                  |
| `/codex ...`                            | 聊天命令集        | 从对话中绑定/控制 Codex app-server 线程。                                                |
| `runtime: "acp", agentId: "codex"`      | ACP 会话路由      | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                                |

## 隐式智能体运行时

当未设置提供商/模型 `agentRuntime` 策略或策略为 `auto` 时，OpenAI
由提供商所有的路由策略会根据有效端点和适配器选择隐式运行时：

| 有效路由事实                                                                                                                                                           | 隐式运行时            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 使用 `openai-responses` 的完全匹配官方 Platform HTTPS 端点，或使用 `openai-chatgpt-responses` 的完全匹配官方 ChatGPT HTTPS 端点；无自定义请求覆盖 | 可以选择 Codex        |
| 自定义的 `openai-completions` 适配器                                                                                                                                   | OpenClaw              |
| 自定义端点                                                                                                                                                             | OpenClaw              |
| 显式使用 HTTP 的完全匹配官方端点                                                                                                                                       | 拒绝                  |
| 包含自定义提供商/模型请求覆盖的路由                                                                                                                                    | OpenClaw              |

显式的非默认提供商/模型 `agentRuntime.id` 仍具有最终决定权。
例如，`agentRuntime.id: "openclaw"` 会让原本符合 Codex 条件的路由继续使用
OpenClaw，而 `agentRuntime.id: "codex"` 则要求使用 Codex；如果有效路由未声明为
兼容 Codex，将以失败关闭方式处理。
运行时选择不会更改凭据类型或计费方式：Platform API key 身份验证与
ChatGPT/Codex 订阅身份验证仍然彼此独立。

`openclaw doctor --fix` 会将旧版 Codex 模型引用、旧版 Codex 身份验证
配置文件 ID 和旧版 Codex 身份验证顺序条目迁移到规范的 `openai`
路由。新身份验证顺序配置请使用 `auth.order.openai`。

<Note>
仅当未配置主模型时，全新的 OpenAI 设置才会应用 GPT-5.6 主模型。
添加或刷新 OpenAI 身份验证时，会保留现有的显式选择，包括
`openai/gpt-5.5`，除非你明确使用 `models auth login --set-default`
或 `models set`。仅当你希望智能体模型使用 API key 身份验证时，
才使用 API key 身份验证配置文件。
</Note>

## GPT-5.6 有限预览

OpenClaw 可识别确切的 `openai/gpt-5.6-sol`、
`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna` 模型 ID。在当前目录中，
这三个模型均提供 `xhigh` 和 `max` 推理级别。OpenAI 将 Sol 描述为
旗舰层级，将 Terra 描述为均衡层级，将 Luna 描述为速度更快、
成本更低的层级。请参阅
[GPT-5.6 发布公告](https://openai.com/index/previewing-gpt-5-6-sol/)
和[访问指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

使用直接 OpenAI API key 身份验证时，不带后缀的 `openai/gpt-5.6` ID 是
Sol 的别名，也是全新设置的默认值。原生 Codex 目录不会在客户端应用该直接
API 别名；根据工作区访问权限，它可能会显示确切的 Sol、Terra 和 Luna ID。
因此，全新的 ChatGPT/Codex OAuth 设置使用 `openai/gpt-5.6-sol`。
使用以下命令检查当前账户：

```bash
openclaw models list --provider openai
```

API 组织和 Codex 工作区的访问权限可能不同。如果 GPT-5.6 不可用，
请显式选择 GPT-5.5：

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw 会显示上游访问错误，不会静默地将 GPT-5.6 选择替换为 GPT-5.5。

<Note>
当未设置运行时策略或策略为 `auto` 时，符合条件且完全匹配的官方 HTTPS
路由可能会选择内置 Codex app-server 插件；自定义 Completions 路由、
自定义端点和请求传输覆盖仍使用 OpenClaw。官方明文 HTTP 端点会被拒绝。
显式提供商/模型运行时配置仍具有最终决定权。运行 `openclaw doctor --fix`
可修复过时的旧版 Codex 模型引用、`codex-cli/*` 引用，或并非由显式运行时
配置设置的旧运行时会话固定项。
</Note>

## OpenClaw 功能覆盖范围

| OpenAI 能力         | OpenClaw 表面                                                                              | 状态                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供商                                                               | 是                                                             |
| Codex 订阅模型 | 使用 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                             |
| 旧版 Codex 模型引用   | 旧 Codex 模型引用、`codex-cli/<model>`                                                     | 由 Doctor 修复为 `openai/<model>`                          |
| Codex app-server harness  | 运行时未设置/为 `auto` 的 Codex 兼容 HTTPS 路由，或显式设置 `agentRuntime.id: codex`  | 是                                                             |
| 服务端 Web 搜索    | 原生 OpenAI Responses 工具                                                                  | 是，前提是已启用 Web 搜索且未固定其他提供商 |
| 图像                    | `image_generate`                                                                              | 是                                                             |
| 视频                    | `video_generate`                                                                              | 是                                                             |
| 文本转语音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                             |
| 批量语音转文本      | `tools.media.audio` / 媒体理解                                                     | 是                                                             |
| 流式语音转文本  | Voice Call `streaming.provider: "openai"`                                                     | 是                                                             |
| 实时语音            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（OpenAI Platform API key）                                   |
| 嵌入                | 记忆嵌入提供商                                                                     | 是                                                             |

<Note>
OpenAI 实时语音通过公共 **OpenAI Platform Realtime
API**，并且需要 Platform API key。Codex OAuth 令牌则用于验证
ChatGPT Codex 后端；它们不能与公共 Realtime 端点所需的 Platform API
key 互换使用。

如果使用 API-key 身份验证时报告缺少计费，请在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
为实时凭据所属的组织充值 Platform 额度。实时语音接受由
`openclaw onboard --auth-choice openai-api-key` 创建的 `openai` API-key 身份验证配置文件、通过
`talk.realtime.providers.openai.apiKey` 为 Control UI Talk 设置的 Platform API key，或
通过 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` 为 Voice
Call 设置的 Platform API key，也可使用 `OPENAI_API_KEY` 环境变量。
</Note>

## 记忆嵌入

OpenClaw 可以使用 OpenAI 或兼容 OpenAI 的嵌入端点，为
`memory_search` 建立索引并生成查询嵌入：

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
会将它们作为提供商特定的 `input_type` 请求字段转发：查询
嵌入使用 `queryInputType`；已建立索引的记忆分块和批量索引使用
`documentInputType`。完整示例请参阅
[记忆配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 入门指南

<Tabs>
  <Tab title="API key（OpenAI Platform）">
    **最适合：** 直接访问 API 并按使用量计费。

    <Steps>
      <Step title="获取 API key">
        从 [OpenAI Platform 仪表板](https://platform.openai.com/api-keys)创建或复制 API key。
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

    | 模型引用        | 运行时策略或路由事实                                 | 路由                     | 身份验证                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | 未设置/`auto`、精确的官方 HTTPS 原生路由、无请求覆盖 | 可能选择 Codex     | 按顺序排列的 API-key 身份验证配置文件      |
    | `openai/gpt-5.6` | 提供商/模型 `agentRuntime.id: "openclaw"`                  | OpenClaw 嵌入式运行时 | 选定的 `openai` API-key 配置文件 |
    | `openai/gpt-5.5` | 显式的提供商/模型 `agentRuntime.id`                     | 选定的智能体运行时    | 选定的 OpenAI API-key 配置文件   |
    | `openai/*`       | 显式配置的 Completions、自定义配置或请求覆盖 | OpenClaw 嵌入式运行时 | 凭据类型保持不变 |
    | `openai/*`       | 明文官方 HTTP 端点                  | 拒绝                 | 不发送凭据             |

    <Note>
    当运行时未设置或为 `auto` 时，只有符合条件的精确官方 HTTPS 原生
    路由才可能隐式选择 Codex app-server harness。对于智能体模型上的 API-key 身份验证，
    请创建 `openai` API-key 身份验证配置文件，并使用
    `auth.order.openai` 对其排序；对于非智能体 OpenAI API 表面，
    `OPENAI_API_KEY` 仍是直接回退选项。运行 `openclaw doctor --fix` 可迁移旧版
    Codex 身份验证顺序条目。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    裸的直接 API `gpt-5.6` ID 会解析为 Sol 层级。如果此 API
    组织未开放 GPT-5.6，请将主模型显式设置为
    `openai/gpt-5.5`。

    要通过 OpenAI API 尝试 ChatGPT 当前的 Instant 模型，请将模型
    设置为 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是一个动态别名。全新的 OpenAI API-key 设置改为使用
    `openai/gpt-5.6`，其裸的直接 API ID 会解析为 Sol。现有的
    显式主模型（包括 `openai/gpt-5.5`）保持不变。
    `chat-latest` 别名仅接受 `medium` 文本详细程度；对于此模型，OpenClaw 会强制将
    其他任何请求的详细程度设为 `medium`。

    <Warning>
    OpenClaw **不会**在直接 OpenAI
    API-key 路由上提供 `gpt-5.3-codex-spark`。只有当已登录账户开放该模型时，才能通过 Codex 订阅目录
    条目使用它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，通过原生 Codex
    app-server 执行，而无需单独的 API key。Codex 云端需要
    登录 ChatGPT。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        对于无头环境或不便使用回调的设置，请添加 `--device-code`，通过 ChatGPT 设备代码流程
        登录，而不是使用 localhost 浏览器
        回调：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用规范的 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        这个精确的官方 HTTPS 原生路由不需要运行时配置。
        它可能自动选择 Codex app-server 运行时，并且在选择该运行时时，
        OpenClaw 会安装或修复内置的 Codex 插件。
      </Step>
      <Step title="验证 Codex 身份验证可用">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway 网关运行后，在聊天中发送 `/codex status` 或 `/codex models`
        以验证原生 app-server 运行时。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用                | 运行时策略或路由事实                                 | 路由                                                    | 身份验证                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | 未设置/`auto`、精确的官方 HTTPS 原生路由、无请求覆盖 | 可能选择 Codex                                    | Codex 登录，或按顺序排列的 `openai` 身份验证配置文件 |
    | `openai/gpt-5.6-terra`   | 未设置/`auto`、精确的官方 HTTPS 原生路由、无请求覆盖 | 可能选择 Codex                                    | 当目录提供 Terra 时使用 Codex 登录       |
    | `openai/gpt-5.6-luna`    | 未设置/`auto`、精确的官方 HTTPS 原生路由、无请求覆盖 | 可能选择 Codex                                    | 当目录提供 Luna 时使用 Codex 登录        |
    | `openai/gpt-5.6-sol`     | 提供商/模型 `agentRuntime.id: "openclaw"`                  | OpenClaw 嵌入式运行时、内部 Codex 身份验证传输 | 选定的 `openai` OAuth 配置文件                    |
    | `openai/gpt-5.5`         | 显式的提供商/模型 `agentRuntime.id`                     | 选定的智能体运行时                                   | 选定的 OpenAI 身份验证配置文件                       |
    | `openai/*`               | 显式配置的 Completions、自定义配置或请求覆盖 | OpenClaw 嵌入式运行时                                | 凭据要求仍取决于具体路由      |
    | `openai/*`               | 明文官方 HTTP 端点                  | 拒绝                                                 | 不发送凭据                              |
    | 旧版 Codex GPT-5.5 引用 | 由 Doctor 修复                                            | 重写为 `openai/gpt-5.5`                            | 已迁移的 OpenAI OAuth 配置文件                      |
    | `codex-cli/gpt-5.5`      | 由 Doctor 修复                                            | 重写为 `openai/gpt-5.5`                            | Codex app-server 身份验证                              |

    <Warning>
    全新订阅支持的设置使用精确的 `openai/gpt-5.6-sol`；原生 Codex 目录也可能提供精确的 Terra 或 Luna 引用。如果账户未提供 GPT-5.6，请显式选择 `openai/gpt-5.5`。较旧的 Codex GPT 引用是 OpenClaw 的旧版路由，并非原生 Codex 运行时路径；运行 `openclaw doctor --fix` 可迁移这些引用，同时不会升级现有的显式 GPT-5.5 选择。`gpt-5.3-codex-spark` 仍仅限 Codex 订阅目录中标明支持它的账户；其直接 OpenAI API 密钥和 Azure 引用仍会被隐藏。
    </Warning>

    <Note>
    新配置应将 OpenAI 智能体身份验证顺序放在 `auth.order.openai` 下；Doctor 会迁移较旧的旧版 Codex 身份验证顺序条目。
    </Note>

    ### 配置示例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    使用 API 密钥作为备用方式时，请将所选模型保留在 `openai/*` 下，并将身份验证顺序放在 `openai` 下。OpenClaw 会先尝试订阅，再尝试 API 密钥，同时继续使用 Codex harness：

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    新手引导不再从 `~/.codex` 导入 OAuth 资料。请使用浏览器 OAuth（默认）或上面的设备代码流程登录；OpenClaw 会在自己的智能体身份验证存储中管理生成的凭据。
    </Note>

    ### 检查并恢复 Codex OAuth 路由

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

    如果较旧的配置仍包含旧版 Codex GPT 引用，或者存在未配置显式运行时的过期 OpenAI 运行时会话固定项，请进行修复：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 未显示可用的配置文件，请重新登录：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    要在同一智能体中使用多个 Codex OAuth 登录，请使用 `--profile-id`，然后通过身份验证顺序或 `/model ...@<profileId>` 控制它们：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    在依赖配置文件顺序之前，请运行 `openclaw doctor --fix`，迁移较旧的旧版 OpenAI Codex 前缀配置文件 ID 和顺序条目。

    ### 状态指示器

    聊天中的 `/status` 会显示当前会话正在使用哪个模型运行时。当符合条件的隐式路由或显式提供商/模型运行时策略选中内置 Codex app-server harness 时，它会显示为 `Runtime: OpenAI Codex`。

    ### Doctor 警告

    如果配置或会话状态中仍存在旧版 Codex 模型引用或过期的 OpenAI 运行时固定项，除非已显式配置 OpenClaw，否则 `openclaw doctor --fix` 会将它们重写为使用 Codex 运行时的 `openai/*`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立值。对于通过 Codex OAuth 目录使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`400000`
    - 默认运行时 `contextTokens` 上限：`272000`

    实际使用中，较小的默认上限具有更好的延迟和质量特性。可使用 `contextTokens` 覆盖它：

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
    使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens` 限制运行时上下文预算。直接 OpenAI API 密钥路由为 `gpt-5.5` 报告更大的原生 `contextWindow`（`1000000`）；由于上游目录不同，这两条路由会分别跟踪。
    </Note>

    ### 目录恢复

    当上游 Codex 目录中存在 `gpt-5.5` 时，OpenClaw 会使用其目录元数据。如果账户已通过身份验证，但实时 Codex 发现中缺少 `gpt-5.5` 行，OpenClaw 会合成该 OAuth 模型行，避免 cron、子智能体和已配置默认模型的运行因 `Unknown model` 而失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 身份验证

当符合条件的精确官方 HTTPS 路由隐式选择原生 Codex app-server harness，或提供商/模型的 `agentRuntime.id: "codex"` 显式选择它时，该 harness 使用 `openai/*` 模型引用。其身份验证仍以账户为基础。OpenClaw 按以下顺序选择身份验证方式：

1. 智能体的有序 OpenAI 身份验证配置文件，最好位于 `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的旧版 Codex 身份验证配置文件 ID 和身份验证顺序。
2. app-server 的现有账户，例如本地 Codex CLI ChatGPT 登录。对于默认的隔离智能体主目录，OpenClaw 会通过登录 RPC 将该原生 CLI 账户桥接到 app-server；它不会共享 CLI 的配置、插件或线程存储。
3. 仅对于本地 stdio app-server 启动，且仅当 app-server 报告没有账户时：先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

本地 ChatGPT/Codex 订阅登录不会仅因为 Gateway 网关进程还为直接 OpenAI 模型或嵌入配置了 `OPENAI_API_KEY` 而被替换。环境变量 API 密钥回退仅适用于本地 stdio 无账户路径；它绝不会通过 WebSocket app-server 连接发送。选择订阅型 Codex 配置文件后，OpenClaw 还会阻止生成的 stdio app-server 子进程获取 `CODEX_API_KEY` 和 `OPENAI_API_KEY`，改为通过 app-server 登录 RPC 发送所选凭据。

当该订阅配置文件因 Codex 使用量限制而被阻止时，OpenClaw 会将此配置文件标记为阻止状态，直到 Codex 公布的重置时间，并允许身份验证顺序轮换到下一个 `openai:*` 配置文件，而不更改所选模型或退出 Codex harness。重置时间到达后，该订阅配置文件将重新可用。

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成。它通过同一个 `openai/gpt-image-2` 模型引用支持 OpenAI API 密钥和 Codex OAuth 图像生成。

| 能力                      | OpenAI API 密钥                      | Codex OAuth                           |
| ------------------------- | ------------------------------------ | ------------------------------------- |
| 模型引用                  | `openai/gpt-image-2`                 | `openai/gpt-image-2`                  |
| 身份验证                  | `OPENAI_API_KEY`                     | OpenAI Codex OAuth 登录               |
| 传输方式                  | OpenAI Images API                    | Codex Responses 后端                  |
| 每次请求的最大图像数      | 4                                    | 4                                     |
| 编辑模式                  | 已启用（最多 5 张参考图像）          | 已启用（最多 5 张参考图像）           |
| 尺寸覆盖                  | 支持，包括 2K/4K 尺寸                | 支持，包括 2K/4K 尺寸                 |
| 宽高比/分辨率             | 不转发到 OpenAI Images API           | 在安全时映射到支持的尺寸              |

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。透明背景 PNG/WebP 输出请使用 `openai/gpt-image-1.5`；当前 `gpt-image-2` API 会拒绝 `background: "transparent"`。

对于透明背景请求，请调用 `image_generate`，并设置 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；较旧的 `openai.background` 提供商选项仍可使用。OpenClaw 还会通过将默认的 `openai/gpt-image-2` 透明背景请求重写为 `gpt-image-1.5`，保护公共 OpenAI 和 OpenAI Codex OAuth 路由；Azure 和自定义 OpenAI 兼容端点会保留其已配置的部署/模型名称。

无头 CLI 运行也提供相同设置：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "透明背景上的简洁红色圆形贴纸" \
  --json
```

从输入文件开始时，请将相同的 `--output-format` 和 `--background` 标志用于 `openclaw infer image edit`。`--openai-background` 仍可用作 OpenAI 专用别名。使用 `--quality low|medium|high|auto` 控制 OpenAI Images 的质量和成本。使用 `--openai-moderation low|auto` 从 `image generate` 或 `image edit` 传递 OpenAI 的审核提示。

对于 ChatGPT/Codex OAuth 安装，请继续使用相同的 `openai/gpt-image-2` 引用。配置 `openai` OAuth 配置文件后，OpenClaw 会解析已存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求；它不会先尝试 `OPENAI_API_KEY`，也不会静默回退到 API 密钥。如果要改用直接 OpenAI Images API 路由，请使用 API 密钥、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。如果该自定义图像端点位于可信 LAN/私有地址，还需设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此显式选择，否则 OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="为 macOS 上的 OpenClaw 制作一张精美的发布海报" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="透明背景上的简洁红色圆形贴纸" outputFormat=png background=transparent
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="保留物体形状，将材质更改为半透明玻璃" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置 `openai` 插件通过 `video_generate` 工具注册视频生成。

| 能力           | 值                                                                                 |
| -------------- | ---------------------------------------------------------------------------------- |
| 默认模型       | `openai/sora-2`                                                                    |
| 模式           | 文生视频、图生视频、单视频编辑                                                     |
| 参考输入       | 1 张图像或 1 个视频                                                                |
| 尺寸覆盖       | 支持文生视频和图生视频                                                             |
| 宽高比         | 转换为最接近的受支持尺寸，不直接转发原始值                                         |
| 其他覆盖       | 不支持 `resolution`、`audio`、`watermark`，并会丢弃且显示工具警告                  |

OpenAI 图生视频请求使用 `POST /v1/videos`，并通过图像 `input_reference` 提交。单视频编辑使用 `POST /v1/videos/edits`，并将上传的视频放入 `video` 字段。

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

OpenAI provider 声明了 `supportsSize`，但未声明 `supportsAspectRatio` 或
`supportsResolution`。OpenClaw 的共享规范化层会在请求到达提供商之前，将请求的
`aspectRatio` 转换为最接近的 OpenAI `size`，因此宽高比请求通常仍可正常工作。
`resolution` 没有尺寸回退机制，会被丢弃，并向调用方显示
`Ignored unsupported overrides for openai/<model>: resolution=<value>`。
</Note>

## GPT-5 提示词贡献

OpenClaw 会为 `openai` 提供商上的 GPT-5 系列模型添加共享的 GPT-5 提示词贡献
（包括修复前的旧版 Codex 引用，它们会规范化为 `openai/*`）。其他同样提供
GPT-5 系列模型 ID 的提供商（例如 OpenRouter 或 opencode 路由）不会收到此叠加层；
它由提供商 ID `openai` 控制，而不是仅由模型 ID 控制。较旧的 GPT-4.x 模型绝不会
收到此叠加层。

原生 Codex app-server harness 不会通过开发者指令接收角色设定/工具纪律行为契约
或友好的交互风格叠加层；原生 Codex 会保留由 Codex 所有的基础行为、模型行为和
项目文档行为，并且 OpenClaw 会为原生线程禁用 Codex 的内置个性，使 Agent 工作区
中的个性文件保持权威。OpenClaw 仅向原生 Codex 线程贡献运行时上下文：渠道投递、
OpenClaw 动态工具、ACP 委派、工作区上下文和 OpenClaw Skills。来自同一贡献的
Heartbeat 指导文本是唯一例外：原生 Codex 的 Heartbeat 轮次确实会收到它，但它会
作为专用协作指令注入，而不是通过共享提示词贡献钩子注入。

GPT-5 贡献会为匹配的 OpenClaw 组装提示词添加带标签的行为契约，涵盖角色设定持久性、
执行安全、工具纪律、输出形式、完成检查和验证。渠道特定的回复和静默消息行为仍由
共享的 OpenClaw 系统提示词和出站投递策略负责。友好的交互风格层相互独立且可配置。

| 值                     | 效果                         |
| ---------------------- | ---------------------------- |
| `"friendly"`（默认）   | 启用友好的交互风格层         |
| `"on"`                 | `"friendly"` 的别名          |
| `"off"`                | 仅禁用友好的风格层           |

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
运行时值不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好的风格层。
</Tip>

<Note>
当共享设置 `agents.defaults.promptOverlays.gpt5.personality` 未设置时，仍会读取
旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音与话音

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 接口注册语音合成功能。

    | 设置     | 配置路径                                              | 默认值                                  |
    | -------- | ----------------------------------------------------- | --------------------------------------- |
    | 模型     | `messages.tts.providers.openai.model`                 | `gpt-4o-mini-tts`                       |
    | 音色     | `messages.tts.providers.openai.speakerVoice`          | `coral`                                 |
    | 速度     | `messages.tts.providers.openai.speed`                 | （未设置）                              |
    | 指令     | `messages.tts.providers.openai.instructions`          | （未设置，仅限 `gpt-4o-mini-tts`）      |
    | 格式     | `messages.tts.providers.openai.responseFormat`        | 语音消息使用 `opus`，文件使用 `mp3`     |
    | API 密钥 | `messages.tts.providers.openai.apiKey`                | 回退到 `OPENAI_API_KEY`                 |
    | 基础 URL | `messages.tts.providers.openai.baseUrl`               | `https://api.openai.com/v1`             |
    | 额外正文 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未设置）                           |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用音色：
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 会在 OpenClaw 生成的字段之后合并到 `/audio/speech` 请求 JSON 中，
    因此可将它用于需要 `lang` 等额外键的 OpenAI 兼容端点。原型键会被忽略。

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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 基础 URL，而不影响聊天 API 端点。
    OpenAI TTS 和 Realtime 语音都通过 OpenAI Platform API 密钥配置；仅使用 OAuth
    的安装仍可使用由 Codex 支持的聊天模型，但无法使用 OpenAI 实时语音回复。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过 OpenClaw 的媒体理解转录接口注册批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：多部分音频文件上传
    - 用于所有读取 `tools.media.audio` 的入站音频转录场景，包括 Discord
      语音频道片段和渠道音频附件

    要强制使用 OpenAI 进行入站音频转录：

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

    如果共享音频媒体配置或单次调用的转录请求提供了语言和提示词提示，
    它们会被转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册实时转录功能。

    | 设置         | 配置路径                                                             | 默认值                  |
    | ------------ | -------------------------------------------------------------------- | ----------------------- |
    | 模型         | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe`     |
    | 语言         | `...openai.language`                                                 | （未设置）              |
    | 提示词       | `...openai.prompt`                                                   | （未设置）              |
    | 静音持续时间 | `...openai.silenceDurationMs`                                        | `800`                   |
    | VAD 阈值     | `...openai.vadThreshold`                                             | `0.5`                   |
    | 身份验证     | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` API 密钥配置文件    | 需要 Platform API 密钥  |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并采用 G.711 u-law
    （`g711_ulaw` / `audio/pcmu`）音频。对于 `openai` API 密钥配置文件，Gateway 网关
    会在打开 WebSocket 之前签发临时 Realtime 转录客户端密钥。此流式提供商用于
    Voice Call 的实时转录路径；Discord 语音目前会录制短片段，并改用批量
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册实时语音功能。

    | 设置                                  | 配置路径                                                               | 默认值                           |
    | ------------------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
    | 模型                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`    | `gpt-realtime-2.1`               |
    | 音色                                  | `...openai.voice`                                                      | `alloy`                          |
    | 温度（Azure 部署桥接）                | `...openai.temperature`                                                | `0.8`                            |
    | VAD 阈值                              | `...openai.vadThreshold`                                               | `0.5`                            |
    | 静音持续时间                          | `...openai.silenceDurationMs`                                          | `500`                            |
    | 前缀填充                              | `...openai.prefixPaddingMs`                                            | `300`                            |
    | 推理强度                              | `...openai.reasoningEffort`                                            | （未设置）                       |
    | 身份验证                              | `openai` API 密钥配置文件、`...openai.apiKey` 或 `OPENAI_API_KEY`      | 需要 OpenAI Platform API 密钥    |

    `gpt-realtime-2.1` 可用的内置 Realtime 音色：`alloy`、`ash`、`ballad`、
    `coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 推荐使用 `marin` 和 `cedar` 以获得最佳 Realtime 质量。这与上面的
    文本转语音音色是两套不同的集合；`fable`、`nova` 或 `onyx` 等仅限 TTS 的音色
    不适用于 Realtime 会话。如果你倾向使用更小、成本更低的 Realtime 2.1 变体，
    请将模型显式设置为 `gpt-realtime-2.1-mini`。

    <Note>
    **GPT-Live（即将推出）。** OpenAI 的全双工 `gpt-live-1` 和
    `gpt-live-1-mini` 模型已于 2026 年 7 月取代 ChatGPT 语音模式；开发者 API
    正在向早期访问组织逐步推出。OpenClaw 能够识别该模型系列，但尚不能运行它：
    GPT-Live 会话仅支持 WebRTC，自行管理轮次切换（无 VAD），并通过交接事件协议
    委派智能体工作，而 OpenClaw 的实时传输目前尚未实现该协议。配置
    `gpt-live-*` 模型时，WebSocket 桥接和 Talk 浏览器会话都会以故障关闭方式失败
    并提供指导，而不是在智能体无法访问的情况下静默连接音频。在早期访问期间，
    API 访问权限也按 OpenAI 组织进行限制。在 GPT-Live 支持落地之前，请继续使用
    `gpt-realtime-2.1`（默认值）。
    </Note>

    <Note>
    后端 OpenAI 实时桥接使用正式发布版 Realtime WebSocket 会话结构，该结构不接受
    `session.temperature`。Azure OpenAI 部署仍可通过 `azureEndpoint` 和
    `azureDeployment` 使用，并保留与部署兼容的会话结构（包括 `temperature`）。
    支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    实时语音在创建会话时选定。OpenAI 允许稍后更改大多数会话字段，但在模型已于
    该会话中发出音频后，音色将无法更改。OpenClaw 目前以字符串形式公开内置的
    Realtime 音色 ID。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器实时会话，通过 Gateway 网关签发的
    临时客户端密钥，直接在浏览器中与 OpenAI Realtime API 进行 WebRTC SDP
    交换。Gateway 网关使用选定的 `openai` 凭据签发该客户端密钥。已配置的
    密钥、API 密钥配置文件和 `OPENAI_API_KEY` 优先；`openai` OAuth
    配置文件或外部 Codex 登录作为回退。Gateway 网关中继和 Voice Call
    后端实时 WebSocket 桥接对原生 OpenAI 端点使用相同的凭据顺序。
    维护者可以使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    进行实时验证；OpenAI 测试环节会验证后端 WebSocket 桥接和浏览器
    WebRTC SDP 交换，且不会记录密钥。
    传入 `--openai-only` 可在没有 Google 凭据的情况下运行这两个测试环节。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` 提供商可以通过覆盖基础 URL，将图像生成请求定向到 Azure
OpenAI 资源。在图像生成路径中，OpenClaw 会检测
`models.providers.openai.baseUrl` 上的 Azure 主机名，并自动切换为 Azure
请求格式。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影响。有关其 Azure 设置，请参阅
[语音和语音合成](#voice-and-speech) 下的 **实时语音** 折叠面板。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内

### 配置

要通过内置的 `openai` 提供商使用 Azure 生成图像，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey`
设置为 Azure OpenAI 密钥（而不是 OpenAI Platform 密钥）：

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

OpenClaw 可识别以下用于 Azure 图像生成路由的 Azure 主机后缀：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发送到已识别 Azure 主机的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用部署范围路径（`/openai/deployments/{deployment}/...`）
- 在每个请求后附加 `?api-version=...`
- 对 Azure 图像生成调用使用默认的 600s 请求超时。
  每次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他基础 URL（公共 OpenAI、OpenAI 兼容代理）继续使用标准 OpenAI 图像请求格式。

<Note>
`openai` 提供商图像生成路径的 Azure 路由要求 OpenClaw 2026.4.22
或更高版本。更早的版本会将任何自定义 `openai.baseUrl` 视为公共 OpenAI
端点，因此无法用于 Azure 图像部署。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION`，可为 Azure 图像生成路径固定特定的 Azure
预览版或正式发布版：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置该变量时，默认值为 `2024-12-01-preview`。

### 模型名称即部署名称

Azure OpenAI 将模型绑定到部署。对于通过内置 `openai` 提供商路由的 Azure
图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的
**Azure 部署名称**，而不是公共 OpenAI 模型 ID。

如果你创建了名为 `gpt-image-2-prod`、用于提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="简洁的海报" size=1024x1024 count=1
```

相同的部署名称规则适用于通过内置 `openai` 提供商路由的任何图像生成调用。

### 区域可用性

Azure 图像生成功能目前仅在部分区域可用（例如 `eastus2`、
`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。创建部署前，
请查看 Microsoft 当前的区域列表，并确认你的区域提供所需的特定模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。Azure 可能会拒绝
公共 OpenAI 允许的选项（例如 `gpt-image-2` 的某些 `background` 值），
或仅在特定模型版本中提供这些选项。这些差异来自 Azure 和底层模型，而不是
OpenClaw。如果 Azure 请求因验证错误而失败，请在 Azure 门户中查看你的特定
部署和 API 版本所支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收 OpenClaw 的隐藏归因标头；
请参阅[高级配置](#advanced-configuration)下的 **原生路由与 OpenAI 兼容路由**
折叠面板。

对于 Azure 上的聊天或 Responses 流量（图像生成以外），请使用新手引导流程
或专用 Azure 提供商配置；仅设置 `openai.baseUrl` 不会启用 Azure API/身份验证
格式。另有独立的 `azure-openai-responses/*` 提供商；请参阅下方的服务端压缩
折叠面板。
</Note>

## 高级配置

以下每个模型的 `params` 示例会决定 OpenClaw 嵌入式提供商请求的格式。
配置这些参数属于显式编写请求行为，因此原本符合条件的 `auto` 路由仍会留在
OpenClaw 上，而不会隐式选择 Codex。原生 Codex app-server harness 自行管理
传输和请求设置；当有效路由未声明为与 Codex 兼容时，显式设置
`agentRuntime.id: "codex"` 会以关闭方式失败。

<AccordionGroup>
  <Accordion title="传输方式（WebSocket 与 SSE）">
    对于 `openai/*`，OpenClaw 优先使用 WebSocket，并以 SSE 作为回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 前，重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级 60 秒，并在冷却期间使用 SSE
    - 为重试和重新连接附加稳定的会话及轮次身份标头
    - 在不同传输方式之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

    | 值                   | 行为                              |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（默认）     | 优先使用 WebSocket，回退到 SSE    |
    | `"sse"`              | 强制仅使用 SSE                    |
    | `"websocket"`        | 强制仅使用 WebSocket              |

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
    OpenClaw 为 `openai/*` 提供共享的快速模式开关：

    - **聊天/UI：** `/fast status|auto|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先处理
    （`service_tier = "priority"`）。现有 `service_tier` 值会保留，并且快速模式
    不会重写 `reasoning` 或 `text.verbosity`。`fastMode: "auto"` 会让新的模型
    调用在达到自动截止时间前使用快速模式，之后的重试、回退、工具结果或继续
    调用则不使用快速模式。截止时间默认为 60 秒；可在当前模型上设置
    `params.fastAutoOnSeconds` 进行更改。

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
    会话覆盖项优先于配置。在会话 UI 中清除会话覆盖项后，该会话将恢复为已配置
    的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI API 通过 `service_tier` 提供优先处理。在 OpenClaw 中为每个模型
    进行设置：

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
    `serviceTier` 仅转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex
    端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，
    OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接使用 OpenAI Responses 的模型（`api.openai.com` 上的
    `openai/*`），OpenAI 插件的 OpenClaw 流包装器会自动启用服务端压缩：

    - 强制设置 `store: true`（除非模型兼容配置设置 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 OpenClaw 运行时路径，以及嵌入式运行所使用的 OpenAI 提供商
    钩子。原生 Codex app-server harness 通过 Codex 管理自身上下文，不受此设置
    影响。

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
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接使用
    OpenAI Responses 的模型仍会强制设置 `store: true`，除非兼容配置设置
    `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体式 GPT 模式">
    对于通过 OpenClaw 嵌入式运行时运行的 `openai` 提供商 GPT-5 系列模型，
    OpenClaw 已默认采用一种名为 `strict-agentic` 的更严格执行契约。只要解析后
    的提供商为 `openai` 且模型 ID 与 GPT-5 系列匹配，它就会自动激活，除非配置
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

    在支持的通道上显式设置 `"strict-agentic"` 不会产生任何变化（它已是默认值），
    在不受支持的提供商/模型组合上则不会生效。

    启用 `strict-agentic` 后，OpenClaw 会：
    - 对实质性工作自动启用 `update_plan`
    - 对结构上为空或仅含推理的轮次进行重试，并继续生成用户可见的回答
    - 当所选 harness 提供显式计划事件时使用这些事件

    OpenClaw 不会通过对助手文本进行分类来判断某个轮次是
    计划、进度更新还是最终答案。

    <Note>
    此契约完全存在于 OpenClaw 的嵌入式智能体运行器中。它不
    适用于原生 Codex app-server harness，后者管理自己的
    轮次和计划行为；对于原生 Codex 运行，harness 的选择比
    执行契约设置更重要。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 对待 OpenAI、Codex 和 Azure OpenAI 直连端点的方式
    不同于通用的 OpenAI 兼容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` 推理强度的模型保留
      `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理，
      省略已禁用的推理设置
    - 默认对工具 schema 使用严格模式
    - 仅在经过验证的原生主机上附加隐藏的归因标头（Azure
      OpenAI 即使属于原生路由，也不会获得这些标头）
    - 保留仅适用于 OpenAI 的请求整形（`service_tier`、`store`、
      推理兼容、提示缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 载荷中移除 Completions `store`
    - 接受高级 `params.extra_body`/`params.extraBody` 透传 JSON，
      用于 OpenAI 兼容的 Completions 代理
    - 接受用于 OpenAI 兼容 Completions 代理（例如 vLLM）的
      `params.chat_template_kwargs`
    - 不强制使用严格工具 schema 或仅限原生路由的标头

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享的图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数和提供商选择。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
</CardGroup>
