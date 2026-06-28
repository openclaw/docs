---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 构建 **Claude** 模型家族。OpenClaw 支持两种认证路径：

- **API 密钥** — 使用按量计费的直接 Anthropic API 访问（`anthropic/*` 模型）
- **Claude CLI** — 复用同一主机上现有的 Claude Code 登录

<Warning>
OpenClaw 的 Claude CLI 后端会以非交互式 print 模式运行已安装的 Claude Code CLI。Anthropic 当前的 Claude Code 文档将 `claude -p` 描述为 Agent SDK/程序化使用。Anthropic 在 2026 年 6 月 15 日的支持更新中暂停了此前宣布的 Agent SDK 计费变更。目前，Anthropic 表示 Claude Agent SDK、`claude -p` 和第三方应用使用仍会消耗订阅的使用额度。在 Anthropic 修订该计划期间，此前宣布的每月 Agent SDK 额度不可用。

交互式 Claude Code 仍会消耗已登录 Claude 计划的额度。API 密钥认证仍采用直接按量付费的 API 计费。对于长期运行的 Gateway 网关主机、共享自动化和可预测的生产支出，请使用 Anthropic API 密钥。

在依赖订阅计费行为之前，请查看 Anthropic 当前的支持文章：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-usage)
- [将 Claude Agent SDK 与你的 Claude 计划一起使用](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [将 Claude Code 与你的 Pro 或 Max 计划一起使用](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [将 Claude Code 与你的 Team 或 Enterprise 计划一起使用](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API 密钥">
    **最适合：** 标准 API 访问和按量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API 密钥。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或直接传入密钥：

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
    **最适合：** 复用现有 Claude CLI 登录，而无需单独的 API 密钥。

    <Steps>
      <Step title="确保 Claude CLI 已安装并已登录">
        使用以下命令验证：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 会检测并复用现有 Claude CLI 凭据。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时细节见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude CLI 复用要求 OpenClaw 进程与 Claude CLI 登录运行在同一主机上。Docker 安装可以持久化容器 home，并在那里登录 Claude Code；参见 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。其他容器安装方式（例如 [Podman](/zh-CN/install/podman)）不会在设置或运行时挂载主机 `~/.claude`；请在那里使用 Anthropic API 密钥，或选择带有 OpenClaw 托管 OAuth 的提供商，例如 [OpenAI Codex](/zh-CN/providers/openai)。
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

    旧版 `claude-cli/claude-opus-4-7` 模型引用仍可用于兼容，但新配置应将提供商/模型选择保持为 `anthropic/*`，并把执行后端放入提供商/模型运行时策略中。

    ### 计费和 `claude -p`

    OpenClaw 对 Claude CLI 运行使用 Claude Code 的非交互式 `claude -p` 路径。Anthropic 当前将该路径视为 Agent SDK/程序化使用：

    - Anthropic 在 2026 年 6 月 15 日的支持更新中暂停了此前宣布的独立 Agent SDK 额度计划。
    - 目前，订阅计划中的 Claude Agent SDK、`claude -p` 和第三方应用使用仍会消耗已登录订阅的使用额度。
    - 在 Anthropic 修订该计划期间，此前宣布的每月 Agent SDK 额度不可用。
    - Console/API 密钥登录使用按量付费的 API 计费，且不会获得订阅的 Agent SDK 额度。

    暂停通知见 Anthropic 的 [Agent SDK 计划文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)，Claude Code 计划文章中也说明了 [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 的订阅行为。

    Anthropic 可以在不发布 OpenClaw 版本的情况下更改 Claude Code 的计费和速率限制行为。当计费可预测性很重要时，请查看 `claude auth status`、`/status` 和 Anthropic 链接的文档。

    <Tip>
    对于共享的生产自动化，请使用 Anthropic API 密钥，而不是 Claude CLI。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/zai) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## 思考默认设置（Claude Fable 5、4.8 和 4.6）

`anthropic/claude-fable-5` 始终使用自适应思考，并默认使用 `high` effort。由于 Anthropic 不允许为此模型禁用思考，`/think off` 和 `/think minimal` 会使用 `low` effort。OpenClaw 也会在 Fable 5 请求中省略自定义 temperature 值。

Claude Opus 4.8 在 OpenClaw 中默认保持关闭思考。当你使用 `/think high|xhigh|max` 显式启用自适应思考时，OpenClaw 会发送 Anthropic 的 Opus 4.8 effort 值；Claude 4.6 模型默认使用 `adaptive`。

可通过 `/think:<level>` 或在模型参数中按消息覆盖：

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

## 提示缓存

OpenClaw 支持 Anthropic 的提示缓存功能，用于 API 密钥认证。

| 值                  | 缓存时长 | 描述                           |
| ------------------- | -------- | ------------------------------ |
| `"short"`（默认）   | 5 分钟   | 为 API 密钥认证自动应用        |
| `"long"`            | 1 小时   | 扩展缓存                       |
| `"none"`            | 不缓存   | 禁用提示缓存                   |

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
  <Accordion title="按 Agent 覆盖缓存">
    使用模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定 Agent：

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

    这样，一个 Agent 可以保留长生命周期缓存，而同一模型上的另一个 Agent 可以针对突发性/低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 说明">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic 的 Bedrock 模型会在运行时被强制设为 `cacheRetention: "none"`。
    - 未设置显式值时，API 密钥智能默认值也会为 Claude-on-Bedrock 引用填充 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
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
    - 仅为直连 `api.anthropic.com` 请求注入。代理路由会保持 `service_tier` 不变。
    - 当两者同时设置时，显式的 `serviceTier` 或 `service_tier` 参数会覆盖 `/fast`。
    - 在没有 Priority Tier 容量的账户上，`service_tier: "auto"` 可能解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic 插件会注册图像和 PDF 理解。OpenClaw
    会根据已配置的 Anthropic 认证自动解析媒体能力，无需
    额外配置。

    | 属性         | 值                    |
    | ------------ | --------------------- |
    | 默认模型     | `claude-opus-4-8`     |
    | 支持的输入   | 图像、PDF 文档        |

    当图像或 PDF 附加到对话时，OpenClaw 会自动
    将其路由到 Anthropic 媒体理解提供商。

  </Accordion>

  <Accordion title="1M 上下文窗口">
    Anthropic 的 1M 上下文窗口可用于支持 GA 的 Claude 4.x 模型，
    例如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 会自动将这些模型的大小设为
    1M：

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

    旧配置可以保留 `params.context1m: true`，但 OpenClaw 不再发送
    已退役的 `context-1m-2025-08-07` beta 头。带有该值的旧版 `anthropicBeta` 配置
    条目会在请求头解析期间被忽略，并且
    不受支持的旧版 Claude 模型会继续使用其正常上下文窗口。

    `params.context1m: true` 也适用于 Claude CLI 后端
    （`claude-cli/*`），面向符合条件且支持 GA 的 Opus 和 Sonnet 模型，以保留
    这些 CLI 会话的运行时上下文窗口，使其与直连 API
    行为一致。

    <Warning>
    需要你的 Anthropic 凭据具备长上下文访问权限。OAuth/订阅令牌认证会保留其所需的 Anthropic beta 头，但如果旧配置中仍有已退役的 1M beta 头，OpenClaw 会将其剥离。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 变体默认都有 1M 上下文窗口，无需 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / 令牌突然无效">
    Anthropic 令牌认证会过期，也可能被撤销。对于新设置，请改用 Anthropic API key。
  </Accordion>

  <Accordion title='未找到 provider "anthropic" 的 API key'>
    Anthropic 凭证是**按智能体**配置的，新智能体不会继承主智能体的密钥。请为该智能体重新运行新手引导（或在 Gateway 网关主机上配置 API key），然后用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到 profile "anthropic:default" 的凭据'>
    运行 `openclaw models status` 查看当前处于活动状态的认证 profile。重新运行新手引导，或为该 profile 路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的认证 profile（全部处于冷却中）">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷却可能限定到模型，因此同级的 Anthropic 模型可能仍可使用。添加另一个 Anthropic profile，或等待冷却结束。
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
  <Card title="提示词缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    提示词缓存在不同提供商之间的工作方式。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭据复用规则。
  </Card>
</CardGroup>
