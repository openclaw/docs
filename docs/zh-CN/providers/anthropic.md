---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API keys 或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-06T21:53:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c19e88b2461e5d98a02044867625a2d508821a4ab43aeb3e10a7a493efbcca22
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 构建 **Claude** 模型系列。OpenClaw 支持两种凭证路径：

- **API 密钥** - 通过按用量计费直接访问 Anthropic API（`anthropic/*` 模型）
- **Claude CLI** - 复用同一主机上现有的 Claude Code 登录

## 用量和成本跟踪

OpenClaw 会检测可用的 Anthropic 凭证，并选择匹配的用量界面：

- Claude 订阅/设置凭证会显示配额窗口和可选的额外用量预算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 会在 Control UI **用量**中显示提供商报告的 30 天组织成本和 Messages API 用量，包括每日花费、token/缓存总量、热门模型和成本类别。
- 存储在 Anthropic 提供商配置文件中的 `sk-ant-admin...` 凭证会自动检测为 Admin API 密钥。

Admin API 成本历史来自 Anthropic 的[用量和成本 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。这是实际的提供商账单，独立于 OpenClaw 基于会话推导的预估成本。

<Warning>
OpenClaw 的 Claude CLI 后端会以非交互式打印模式（`claude -p`）运行已安装的 Claude Code CLI。Anthropic 当前的 Claude Code 文档将该模式描述为 Agent SDK/程序化用法。Anthropic 于 2026 年 6 月 15 日发布的支持更新暂停了此前宣布的独立 Agent SDK 计费变更：Claude Agent SDK、`claude -p` 和第三方应用用量仍会消耗已登录订阅的用量限制，并且在 Anthropic 修订该计划期间，此前宣布的每月 Agent SDK 额度不可用。

交互式 Claude Code 仍会消耗已登录 Claude 套餐的限制。API 密钥凭证是直接按量付费计费，不依赖该套餐。对于长期运行的 Gateway 网关主机、共享自动化和可预测的生产支出，请使用 Anthropic API 密钥。

Anthropic 当前的支持文章可能会在没有 OpenClaw 发布的情况下改变此行为：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-usage)
- [将 Claude Agent SDK 与你的 Claude 套餐配合使用](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [将 Claude Code 与你的 Pro 或 Max 套餐配合使用](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [将 Claude Code 与你的 Team 或 Enterprise 套餐配合使用](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API 密钥">
    **最适合：** 标准 API 访问和按用量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API 密钥。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或者直接传入密钥：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最适合：** 复用现有 Claude CLI 登录，而不需要单独的 API 密钥。

    <Steps>
      <Step title="确保 Claude CLI 已安装并已登录">
        用以下命令验证：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 会检测并复用现有的 Claude CLI 凭证。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时详情见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude CLI 复用要求 OpenClaw 进程与 Claude CLI 登录运行在同一台主机上。Docker 安装可以持久化容器 home，并在其中登录 Claude Code；请参阅 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。其他容器安装（例如 [Podman](/zh-CN/install/podman)）不会在设置或运行时将主机 `~/.claude` 挂载进去；请在其中使用 Anthropic API 密钥，或者选择带 OpenClaw 托管 OAuth 的提供商，例如 [OpenAI Codex](/zh-CN/providers/openai)。
    </Warning>

    ### 配置示例

    优先使用规范的 Anthropic 模型引用，并加上 CLI 运行时覆盖：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    旧版 `claude-cli/claude-opus-4-7` 模型引用仍可用于兼容性，但新配置应将提供商/模型选择保持为 `anthropic/*`，并把执行后端放在提供商/模型运行时策略中。

    ### 计费和 `claude -p`

    OpenClaw 会使用 Claude Code 的非交互式 `claude -p` 路径来运行 Claude CLI。Anthropic 当前将该路径视为 Agent SDK/程序化用法：

    - Anthropic 于 2026 年 6 月 15 日发布的支持更新暂停了此前宣布的独立 Agent SDK 额度计划。
    - 订阅套餐中的 Claude Agent SDK、`claude -p` 和第三方应用用量仍会消耗已登录订阅的用量限制。
    - 在 Anthropic 修订该计划期间，此前宣布的每月 Agent SDK 额度不可用。
    - Console/API 密钥登录使用按量付费 API 计费，不会获得订阅的 Agent SDK 额度。

    请参阅 Anthropic 的 [Agent SDK 套餐文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)了解暂停通知，并参阅 Claude Code 套餐文章了解 [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 订阅行为。

    Anthropic 可以在没有 OpenClaw 发布的情况下改变 Claude Code 计费和速率限制行为。当计费可预测性很重要时，请检查 `claude auth status`、`/status` 和 Anthropic 链接的文档。

    <Tip>
    对于共享生产自动化，请使用 Anthropic API 密钥，而不是 Claude CLI。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/zai) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## 思考默认值（Claude Fable 5、4.8 和 4.6）

`anthropic/claude-fable-5` 始终使用自适应思考，并默认使用 `high` effort。Anthropic 不允许为此模型禁用思考，因此 `/think off` 和 `/think minimal` 会改为映射到 `low` effort。OpenClaw 还会在 Fable 5 请求中省略自定义 temperature 值，因为 Anthropic 会拒绝任何启用思考的请求上的 temperature 覆盖。

Claude Opus 4.8 在 OpenClaw 中默认保持思考关闭。当你用 `/think high|xhigh|max` 显式启用自适应思考时，OpenClaw 会发送 Anthropic 的 Opus 4.8 effort 值；Claude 4.6 模型（Opus 4.6 和 Sonnet 4.6）默认使用 `adaptive`。

可用 `/think:<level>` 按消息覆盖，或在模型参数中覆盖：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
相关 Anthropic 文档：
- [自适应思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [扩展思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全拒绝回退（Claude Fable 5）

<Warning>
使用 Claude Fable 5 也意味着会使用 Claude Opus 4.8。Fable 5 随附的安全分类器可能会拒绝请求，而 Anthropic 认可的恢复方式是让 `claude-opus-4-8` 处理该轮次。OpenClaw 会为直接 API 密钥请求自动选择启用此行为，因此某些 Fable 轮次会由 Claude Opus 4.8 回答并计费。如果你的策略或预算无法接受由 Opus 处理的轮次，请不要选择 `anthropic/claude-fable-5`。
</Warning>

### 为什么存在此机制

Fable 5 分类器会在受限领域的请求上返回 `stop_reason: "refusal"`，并且也会对相邻的良性工作产生误报（安全工具、生命科学，甚至要求模型复现其原始推理）。没有回退时，即使另一个 Claude 模型可以正常处理，轮次也会以错误结束；Anthropic 自己的拒绝消息会告知 API 集成方配置回退模型。

### 工作方式

1. 对每个发往 `anthropic/claude-fable-5` 的直接 API 密钥请求，OpenClaw 会发送 Anthropic 的服务端回退选择启用：`server-side-fallback-2026-06-01` beta 头加上 `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 允许用于 Fable 5 的唯一回退目标。
2. 只有安全分类器拒绝会触发回退。速率限制、过载和服务器错误的行为与以前完全相同，并走 OpenClaw 正常的[模型故障转移](/zh-CN/concepts/model-failover)。
3. 救援发生在同一次调用内。任何输出之前的拒绝除了延迟之外不可见；整个答案来自 Opus 4.8。流中拒绝时，已生成的部分文本会保留为回退模型继续生成的前缀，而被拒绝模型的推理和工具调用会按照 Anthropic 的重放规则丢弃（不得回显或执行）。
4. 如果 Claude Opus 4.8 也拒绝，该轮次会像此功能之前一样将拒绝作为错误暴露。

回退发生在 Anthropic API 层，因此 `claude-opus-4-8` 不需要在你配置的模型列表或回退链中；具备 Fable 能力的 API 密钥始终可以调用 Opus。

### 可观测性和计费

- 由回退处理的轮次会在 assistant 消息上记录一个 `provider_fallback` 诊断，命名 `fromModel` 和 `toModel`，并且消息的 `responseModel` 会报告 `claude-opus-4-8`。
- Anthropic 按尝试计费：输出前拒绝免费，救援按 Claude Opus 4.8 费率计费（当前为 Fable 5 费率的一半）。OpenClaw 的单轮次成本预估会按 Opus 费率为回退处理的轮次定价，以保持匹配。
- 流中拒绝还会在 Anthropic 侧对已经流式输出的 Fable 部分计费；该部分会在 API 的每次尝试用量中报告，但不会并入 OpenClaw 的单轮次预估。

### 范围

适用于使用 API 密钥凭证、面向 `api.anthropic.com` 的 `anthropic/claude-fable-5`。OAuth（Claude CLI 订阅复用）、代理基础 URL、Bedrock、Vertex 和 Foundry 请求保持不变，并且仍会在那里将拒绝作为错误暴露。

实时验证：一个要求 Fable 5 复现其原始思维链的良性提示，在不带回退发送时会以 `category: "reasoning_extraction"` 被拒绝，而同一提示通过 OpenClaw 发送时会返回一个由 Opus 处理的正常答案，并附带 `provider_fallback` 诊断。

请参阅 Anthropic 的[拒绝和回退指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)了解底层行为。

## 提示缓存

OpenClaw 支持 Anthropic 面向 API 密钥凭证的提示缓存功能。

| 值                  | 缓存时长 | 描述                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（默认） | 5 分钟      | 自动应用于 API key 凭证 |
| `"long"`            | 1 小时         | 扩展缓存                         |
| `"none"`            | 不缓存     | 禁用 prompt 缓存                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="按 Agent 配置的缓存覆盖">
    使用模型级 params 作为基线，然后通过 `agents.list[].params` 覆盖特定 agent：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    配置合并顺序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（匹配 `id`，按键覆盖）

    这让一个 agent 可以保持长生命周期缓存，同时让同一模型上的另一个 agent 为突发型/低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 说明">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic Bedrock 模型会在运行时被强制设为 `cacheRetention: "none"`。
    - 当没有设置显式值时，API key 智能默认值也会为 Claude-on-Bedrock refs 播种 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共享 `/fast` 开关会为发往 `api.anthropic.com` 的直接 API key 流量设置 Anthropic 的 `service_tier` 字段。

    | 命令 | 映射到 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 仅适用于使用 API key 发出的直接 `api.anthropic.com` 请求。OAuth/subscription-token 请求和代理路由永远不会获得 `service_tier` 字段。
    - 显式 `serviceTier` 或 `service_tier` params 会在两者都设置时覆盖 `/fast`。
    - 在没有 Priority Tier 容量的账户上，`service_tier: "auto"` 可能解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic 插件会注册图像和 PDF 理解。OpenClaw
    会从配置的 Anthropic 凭证自动解析媒体能力；无需
    额外配置。

    | 属性        | 值                 |
    | --------------- | --------------------- |
    | 默认模型   | `claude-opus-4-8`     |
    | 支持的输入 | 图像、PDF 文档 |

    当图像或 PDF 附加到对话时，OpenClaw 会自动
    通过 Anthropic 媒体理解提供商路由它。

  </Accordion>

  <Accordion title="1M 上下文窗口">
    Anthropic 的 1M 上下文窗口已在带 adaptive
    thinking 的 Claude 4.x 模型上 GA：Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 会自动将这些
    模型大小设为 1,048,576 tokens，无需 `params.context1m`：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    较旧配置可以保留 `params.context1m: true`；对
    这些模型来说它是无害的空操作，并且 OpenClaw 不再发送已退役的
    `context-1m-2025-08-07` beta header。包含该值的较旧 `anthropicBeta` 配置
    条目会在请求 header 解析期间被丢弃，而
    不受支持的较旧 Claude 模型会继续使用其正常上下文窗口。

    `params.context1m: true` 对 Claude CLI 后端
    （`claude-cli/*`）的行为相同：符合条件且具备 GA 能力的 Opus 和 Sonnet 模型已经会自动获得
    1M 窗口，因此该 param 在那里也是可选的。

    <Warning>
    需要你的 Anthropic 凭证具备长上下文访问权限。OAuth/subscription token 凭证会保留其必需的 Anthropic beta header，但如果已退役的 1M beta header 仍在旧配置中，OpenClaw 会将其剥离。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 变体默认具有 1M 上下文
    窗口；无需 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排查

<AccordionGroup>
  <Accordion title="401 错误 / token 突然无效">
    Anthropic token 凭证会过期，也可能被撤销。对于新设置，请改用 Anthropic API key。
  </Accordion>

  <Accordion title='未找到 provider "anthropic" 的 API key'>
    Anthropic 凭证是**按 agent**配置的；新 agent 不会继承主 agent 的 key。为该 agent 重新运行新手引导（或在 gateway 主机上配置 API key），然后用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到 profile "anthropic:default" 的凭证'>
    运行 `openclaw models status` 查看哪个凭证 profile 处于活动状态。重新运行新手引导，或为该 profile 路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的凭证 profile（全部处于 cooldown）">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制 cooldown 可能按模型限定，因此同级 Anthropic 模型仍可能可用。添加另一个 Anthropic profile，或等待 cooldown 结束。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排查](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 refs 和故障转移行为。
  </Card>
  <Card title="CLI 后端" href="/zh-CN/gateway/cli-backends" icon="terminal">
    Claude CLI 后端设置和运行时细节。
  </Card>
  <Card title="Prompt 缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    prompt 缓存在不同提供商上的工作方式。
  </Card>
  <Card title="OAuth 和凭证" href="/zh-CN/gateway/authentication" icon="key">
    凭证细节和凭证复用规则。
  </Card>
</CardGroup>
