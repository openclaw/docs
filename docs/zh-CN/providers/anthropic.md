---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:08:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 构建 **Claude** 模型家族。OpenClaw 支持两种凭证路径：

- **API 密钥** — 直接访问 Anthropic API，并按用量计费（`anthropic/*` 模型）
- **Claude CLI** — 复用同一主机上现有的 Claude Code 登录

<Warning>
OpenClaw 的 Claude CLI 后端会以非交互式打印模式运行已安装的 Claude Code CLI。Anthropic 当前的 Claude Code 文档将 `claude -p` 描述为 Agent SDK/程序化用法。Anthropic 2026 年 6 月 15 日的支持更新暂停了此前公布的 Agent SDK 计费变更。目前，Anthropic 表示 Claude Agent SDK、`claude -p` 和第三方应用用法仍会消耗订阅的用量限制。在 Anthropic 修订该计划期间，先前公布的每月 Agent SDK 额度不可用。

交互式 Claude Code 仍会消耗已登录 Claude 套餐的限制。API 密钥凭证仍是直接的按需付费 API 计费。对于长期运行的 Gateway 网关主机、共享自动化和可预测的生产支出，请使用 Anthropic API 密钥。

在依赖订阅计费行为之前，请查看 Anthropic 当前的支持文章：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-usage)
- [通过你的 Claude 套餐使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [通过你的 Pro 或 Max 套餐使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [通过你的 Team 或 Enterprise 套餐使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API key">
    **最适合：** 标准 API 访问和按用量计费。

    <Steps>
      <Step title="Get your API key">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API 密钥。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或者直接传入密钥：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
    **最适合：** 在没有单独 API 密钥的情况下复用现有 Claude CLI 登录。

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        使用以下命令验证：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 会检测并复用现有的 Claude CLI 凭证。
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时细节见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude CLI 复用要求 OpenClaw 进程与 Claude CLI 登录运行在同一主机上。Docker 安装可以持久化容器 home 并在那里登录 Claude Code；参见 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。其他容器安装（例如 [Podman](/zh-CN/install/podman)）不会在设置或运行时挂载主机的 `~/.claude`；请在那里使用 Anthropic API 密钥，或选择带有 OpenClaw 托管 OAuth 的提供商，例如 [OpenAI Codex](/zh-CN/providers/openai)。
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

    为了兼容性，旧版 `claude-cli/claude-opus-4-7` 模型引用仍然可用，但新配置应将提供商/模型选择保持为 `anthropic/*`，并把执行后端放在提供商/模型运行时策略中。

    ### 计费和 `claude -p`

    OpenClaw 对 Claude CLI 运行使用 Claude Code 的非交互式 `claude -p` 路径。Anthropic 当前将该路径视为 Agent SDK/程序化用法：

    - Anthropic 2026 年 6 月 15 日的支持更新暂停了此前公布的单独 Agent SDK 额度计划。
    - 目前，订阅套餐下的 Claude Agent SDK、`claude -p` 和第三方应用用法仍会消耗已登录订阅的用量限制。
    - 在 Anthropic 修订该计划期间，先前公布的每月 Agent SDK 额度不可用。
    - Console/API 密钥登录使用按需付费 API 计费，并且不会获得订阅 Agent SDK 额度。

    请参阅 Anthropic 的 [Agent SDK 套餐文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)了解暂停通知，并参阅 Claude Code 套餐文章了解 [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 订阅行为。

    Anthropic 可以在没有 OpenClaw 发布的情况下更改 Claude Code 计费和速率限制行为。当计费可预测性很重要时，请检查 `claude auth status`、`/status` 和 Anthropic 链接的文档。

    <Tip>
    对于共享的生产自动化，请使用 Anthropic API 密钥，而不是 Claude CLI。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/zai) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## 思考默认值（Claude Fable 5、4.8 和 4.6）

`anthropic/claude-fable-5` 始终使用自适应思考，并默认使用 `high` 强度。由于 Anthropic 不允许为此模型禁用思考，`/think off` 和 `/think minimal` 会使用 `low` 强度。OpenClaw 还会在 Fable 5 请求中省略自定义 temperature 值。

Claude Opus 4.8 在 OpenClaw 中默认关闭思考。当你使用 `/think high|xhigh|max` 明确启用自适应思考时，OpenClaw 会发送 Anthropic 的 Opus 4.8 强度值；Claude 4.6 模型默认使用 `adaptive`。

使用 `/think:<level>` 或在模型参数中按消息覆盖：

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
使用 Claude Fable 5 也意味着使用 Claude Opus 4.8。Fable 5 随附的安全分类器可能会拒绝请求，而 Anthropic 批准的恢复方式是让 `claude-opus-4-8` 处理该轮次。OpenClaw 会为直接 API 密钥请求自动启用此行为，因此部分 Fable 轮次会由 Claude Opus 4.8 回答并按其计费。如果你的策略或预算无法接受由 Opus 处理的轮次，请不要选择 `anthropic/claude-fable-5`。
</Warning>

### 为什么存在此机制

Fable 5 分类器会对受限领域中的请求返回 `stop_reason: "refusal"`，并且也会对接近但无害的工作误报（安全工具、生命科学，甚至要求模型复现其原始推理）。如果没有回退，即使另一个 Claude 模型本可以正常处理，该轮次也会以错误结束；Anthropic 自己的拒绝消息会告知 API 集成方配置回退模型。

### 工作方式

1. 对每个发送到 `anthropic/claude-fable-5` 的直接 API 密钥请求，OpenClaw 会发送 Anthropic 的服务端回退启用项：`server-side-fallback-2026-06-01` beta 标头以及 `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 允许 Fable 5 使用的唯一回退目标。
2. 只有安全分类器拒绝才会触发回退。速率限制、过载和服务器错误的行为与之前完全相同，并通过 OpenClaw 的常规[模型故障转移](/zh-CN/concepts/model-failover)。
3. 救援发生在同一个调用内。任何输出之前的拒绝除了延迟外不可见；整个答案都来自 Opus 4.8。对于流中途拒绝，部分文本会被保留为回退模型继续生成的前缀，而被拒绝模型的推理和工具调用会按 Anthropic 的重放规则丢弃（不得回显或执行）。
4. 如果 Claude Opus 4.8 也拒绝，该轮次会像此功能之前一样将拒绝作为错误暴露。

回退发生在 Anthropic API 层，因此 `claude-opus-4-8` 不需要在你配置的模型列表或回退链中；具备 Fable 能力的 API 密钥始终可以调用 Opus。

### 可观测性和计费

- 由回退处理的轮次会在助手消息上记录一个 `provider_fallback` 诊断，命名 `fromModel` 和 `toModel`，并且该消息的 `responseModel` 会报告 `claude-opus-4-8`。
- Anthropic 按尝试计费：输出前拒绝免费，救援按 Claude Opus 4.8 费率计费（目前为 Fable 5 费率的一半）。OpenClaw 的单轮成本估算会按 Opus 费率为回退处理的轮次定价，以保持一致。
- 流中途拒绝还会在 Anthropic 侧对已经流式输出的 Fable 部分计费；该部分会在 API 的每次尝试用量中报告，但不会计入 OpenClaw 的单轮估算。

### 范围

适用于使用 API 密钥凭证访问 `api.anthropic.com` 的 `anthropic/claude-fable-5`。OAuth（Claude CLI 订阅复用）、代理基础 URL、Bedrock、Vertex 和 Foundry 请求保持不变，并且在那里仍会将拒绝作为错误暴露。

实时验证：一个要求 Fable 5 复现其原始思维链的无害提示，在未发送回退时会以 `category: "reasoning_extraction"` 被拒绝，而通过 OpenClaw 发送的相同提示会返回一个由 Opus 处理的正常答案，并附带 `provider_fallback` 诊断。

底层行为请参阅 Anthropic 的[拒绝和回退指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)。

## 提示缓存

OpenClaw 支持 Anthropic 的提示缓存功能，适用于 API 密钥凭证。

| 值                  | 缓存时长 | 描述                         |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（默认） | 5 分钟      | 自动应用于 API 密钥凭证 |
| `"long"`            | 1 小时         | 扩展缓存                         |
| `"none"`            | 不缓存     | 禁用提示缓存                 |

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
  <Accordion title="Per-agent cache overrides">
    使用模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体：

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

    这让一个 agent 可以保留长生命周期缓存，同时同一模型上的另一个 agent 可以为突发、低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 说明">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic Bedrock 模型会在运行时强制设为 `cacheRetention: "none"`。
    - 当未设置显式值时，API key 智能默认值也会为 Claude-on-Bedrock 引用填入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共享 `/fast` 开关支持直连 Anthropic 流量（API key 和 OAuth 到 `api.anthropic.com`）。

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
    - 仅注入到直连 `api.anthropic.com` 请求。代理路由会保持 `service_tier` 不变。
    - 同时设置时，显式 `serviceTier` 或 `service_tier` 参数会覆盖 `/fast`。
    - 在没有 Priority Tier 容量的账号上，`service_tier: "auto"` 可能会解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic 插件注册了图像和 PDF 理解。OpenClaw 会根据已配置的 Anthropic 凭证自动解析媒体能力，无需额外配置。

    | 属性        | 值                 |
    | --------------- | --------------------- |
    | 默认模型   | `claude-opus-4-8`     |
    | 支持的输入 | 图像、PDF 文档 |

    当图像或 PDF 附加到对话时，OpenClaw 会自动通过 Anthropic 媒体理解提供商进行路由。

  </Accordion>

  <Accordion title="1M 上下文窗口">
    Anthropic 的 1M 上下文窗口可用于具备 GA 能力的 Claude 4.x 模型，例如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 会自动将这些模型设定为 1M：

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

    旧配置可以保留 `params.context1m: true`，但 OpenClaw 不再发送已退役的 `context-1m-2025-08-07` beta 标头。带有该值的旧 `anthropicBeta` 配置项会在请求标头解析期间被忽略，不受支持的较旧 Claude 模型会保持其正常上下文窗口。

    `params.context1m: true` 也适用于 Claude CLI 后端（`claude-cli/*`）中符合条件、具备 GA 能力的 Opus 和 Sonnet 模型，从而保留这些 CLI 会话的运行时上下文窗口，使其与直连 API 行为一致。

    <Warning>
    需要你的 Anthropic 凭证具备长上下文访问权限。OAuth/订阅令牌认证会保留其所需的 Anthropic beta 标头，但如果已退役的 1M beta 标头仍存在于旧配置中，OpenClaw 会将其剥离。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 变体默认具备 1M 上下文窗口，无需 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / 令牌突然无效">
    Anthropic 令牌认证会过期，也可能被撤销。对于新设置，请改用 Anthropic API key。
  </Accordion>

  <Accordion title='未找到 provider "anthropic" 的 API key'>
    Anthropic 凭证是**按 agent**配置的，新 agent 不会继承主 agent 的密钥。为该 agent 重新运行新手引导（或在 Gateway 网关主机上配置 API key），然后用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到 profile "anthropic:default" 的凭证'>
    运行 `openclaw models status` 查看当前处于活动状态的认证配置文件。重新运行新手引导，或为该配置文件路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的认证配置文件（全部处于冷却中）">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷却可以限定到模型范围，因此同级 Anthropic 模型可能仍可使用。添加另一个 Anthropic 配置文件，或等待冷却结束。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="CLI 后端" href="/zh-CN/gateway/cli-backends" icon="terminal">
    Claude CLI 后端设置和运行时细节。
  </Card>
  <Card title="提示缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    提示缓存如何跨提供商工作。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
