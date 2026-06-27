---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T03:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 构建 **Claude** 模型家族。OpenClaw 支持两种凭证路径：

- **API 密钥** — 直接访问 Anthropic API，并按用量计费（`anthropic/*` 模型）
- **Claude CLI** — 复用同一主机上现有的 Claude Code 登录

<Warning>
OpenClaw 的 Claude CLI 后端会以非交互式打印模式运行已安装的 Claude Code CLI。Anthropic 当前的 Claude Code 文档将 `claude -p` 描述为 Agent SDK/程序化用法。从 2026 年 6 月 15 日起，Anthropic 表示订阅计划中的 `claude -p` 用量不再从普通 Claude 计划额度中扣除；它会先从单独的每月 Agent SDK 额度中扣除，随后在启用用量额度时按标准 API 费率从用量额度中扣除。

交互式 Claude Code 仍会从已登录 Claude 计划额度中扣除。API 密钥凭证仍是直接按需付费的 API 计费。对于长期运行的 Gateway 网关主机、共享自动化和可预测的生产支出，请使用 Anthropic API 密钥。

Anthropic 当前的公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-usage)
- [通过你的 Claude 计划使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [通过你的 Pro 或 Max 计划使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [通过你的 Team 或 Enterprise 计划使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API key">
    **适合：** 标准 API 访问和按用量计费。

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
    **适合：** 在没有单独 API 密钥的情况下复用现有 Claude CLI 登录。

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

        OpenClaw 会检测并复用现有 Claude CLI 凭证。
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时详情见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude CLI 复用要求 OpenClaw 进程与 Claude CLI 登录运行在同一主机上。Docker 安装可以持久化容器主目录，并在那里登录 Claude Code；请参阅 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。其他容器安装（如 [Podman](/zh-CN/install/podman)）不会在设置或运行时挂载主机的 `~/.claude`；请在那里使用 Anthropic API 密钥，或选择具有 OpenClaw 托管 OAuth 的提供商，例如 [OpenAI Codex](/zh-CN/providers/openai)。
    </Warning>

    ### 配置示例

    优先使用规范的 Anthropic 模型引用，并添加 CLI 运行时覆盖：

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

    为了兼容性，旧版 `claude-cli/claude-opus-4-7` 模型引用仍然可用，但新配置应将提供商/模型选择保持为 `anthropic/*`，并将执行后端放在提供商/模型运行时策略中。

    ### 计费与 `claude -p`

    OpenClaw 对 Claude CLI 运行使用 Claude Code 的非交互式 `claude -p` 路径。Anthropic 当前将该路径视为 Agent SDK/程序化用法：

    - 在 2026 年 6 月 15 日之前，订阅计划处理遵循 Anthropic 针对已登录账户生效的 Claude Code 规则。
    - 从 2026 年 6 月 15 日起，订阅计划中的 `claude -p` 用量会先从用户的每月 Agent SDK 额度中扣除，随后在启用用量额度时按标准 API 费率从用量额度中扣除。
    - Console/API 密钥登录使用按需付费 API 计费，并且不会获得订阅 Agent SDK 额度。

    Anthropic 可以在没有 OpenClaw 发布的情况下更改 Claude Code 的计费和速率限制行为。当计费可预测性很重要时，请检查 `claude auth status`、`/status` 和 Anthropic 链接的文档。

    <Tip>
    对于共享生产自动化，请使用 Anthropic API 密钥，而不是 Claude CLI。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/zai) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## Thinking 默认值（Claude Fable 5、4.8 和 4.6）

`anthropic/claude-fable-5` 始终使用自适应 thinking，并默认使用 `high` effort。由于 Anthropic 不允许对该模型禁用 thinking，`/think off` 和 `/think minimal` 会使用 `low` effort。OpenClaw 也会在 Fable 5 请求中省略自定义 temperature 值。

Claude Opus 4.8 在 OpenClaw 中默认关闭 thinking。当你通过 `/think high|xhigh|max` 明确启用自适应 thinking 时，OpenClaw 会发送 Anthropic 的 Opus 4.8 effort 值；Claude 4.6 模型默认使用 `adaptive`。

使用 `/think:<level>` 按消息覆盖，或在模型参数中覆盖：

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
- [自适应 thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [扩展 thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Prompt caching

OpenClaw 对 API 密钥凭证支持 Anthropic 的 prompt caching 功能。

| 值                  | 缓存时长 | 描述                                 |
| ------------------- | -------- | ------------------------------------ |
| `"short"`（默认）   | 5 分钟   | 对 API 密钥凭证自动应用              |
| `"long"`            | 1 小时   | 扩展缓存                             |
| `"none"`            | 不缓存   | 禁用 prompt caching                  |

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
    将模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体：

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

    这让一个智能体可以保留长生命周期缓存，而同一模型上的另一个智能体可以为突发/低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic Bedrock 模型会在运行时强制设为 `cacheRetention: "none"`。
    - 当没有设置显式值时，API 密钥智能默认值也会为 Claude-on-Bedrock 引用填充 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw 的共享 `/fast` 开关支持直连 Anthropic 流量（API 密钥和到 `api.anthropic.com` 的 OAuth）。

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
    - 只会注入到直连 `api.anthropic.com` 请求。代理路由会保持 `service_tier` 不变。
    - 同时设置时，显式 `serviceTier` 或 `service_tier` 参数会覆盖 `/fast`。
    - 在没有 Priority Tier 容量的账户上，`service_tier: "auto"` 可能会解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    内置 Anthropic 插件会注册图像和 PDF 理解能力。OpenClaw 会根据已配置的 Anthropic 凭证自动解析媒体能力，不需要额外配置。

    | 属性           | 值                    |
    | -------------- | --------------------- |
    | 默认模型       | `claude-opus-4-8`     |
    | 支持的输入     | 图像、PDF 文档        |

    当图像或 PDF 附加到对话时，OpenClaw 会自动通过 Anthropic 媒体理解提供商路由它。

  </Accordion>

  <Accordion title="1M context window">
    Anthropic 的 1M 上下文窗口适用于具备 GA 能力的 Claude 4.x 模型，例如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 会自动将这些模型设置为 1M：

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

    旧配置可以保留 `params.context1m: true`，但 OpenClaw 不再发送已停用的 `context-1m-2025-08-07` beta 头。带有该值的旧版 `anthropicBeta` 配置项会在请求头解析期间被忽略，并且不受支持的旧 Claude 模型会保持其正常上下文窗口。

    `params.context1m: true` 也适用于 Claude CLI 后端（`claude-cli/*`），面向符合条件且具备 GA 能力的 Opus 和 Sonnet 模型，为这些 CLI 会话保留运行时上下文窗口，使其匹配直接 API 行为。

    <Warning>
    需要你的 Anthropic 凭证具备长上下文访问权限。OAuth/订阅令牌凭证会保留其所需的 Anthropic beta 头，但如果旧配置中仍保留已停用的 1M beta 头，OpenClaw 会将其剥离。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 变体默认具有 1M 上下文窗口，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic 令牌凭证会过期，也可能被撤销。对于新设置，请改用 Anthropic API 密钥。
  </Accordion>

  <Accordion title='未找到提供商 "anthropic" 的 API key'>
    Anthropic 凭证是**按智能体配置的**——新智能体不会继承主智能体的密钥。为该智能体重新运行新手引导（或在 Gateway 网关主机上配置 API key），然后用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到配置文件 "anthropic:default" 的凭据'>
    运行 `openclaw models status` 查看当前启用的凭证配置文件。重新运行新手引导，或为该配置文件路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的凭证配置文件（全部处于冷却中）">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷却可以按模型限定，因此同级 Anthropic 模型可能仍可使用。添加另一个 Anthropic 配置文件，或等待冷却结束。
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
    提示缓存如何在不同提供商之间工作。
  </Card>
  <Card title="OAuth 和凭证" href="/zh-CN/gateway/authentication" icon="key">
    凭证细节和凭据复用规则。
  </Card>
</CardGroup>
