---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:22:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 构建 **Claude** 模型家族。OpenClaw 支持两种凭证方式：

- **API key** — 使用基于用量计费的 Anthropic API 直接访问（`anthropic/*` 模型）
- **Claude CLI** — 复用同一主机上已有的 Claude CLI 登录

<Warning>
Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此
OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为已获认可，除非
Anthropic 发布新的策略。

对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是最清晰且
最可预测的生产路径。

Anthropic 当前公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概览](https://platform.claude.com/docs/en/agent-sdk/overview)
- [将 Claude Code 与你的 Pro 或 Max 计划一起使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [将 Claude Code 与你的 Team 或 Enterprise 计划一起使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API key">
    **最适合：** 标准 API 访问和基于用量计费。

    <Steps>
      <Step title="获取你的 API key">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建 API key。
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最适合：** 在不使用单独 API key 的情况下复用已有 Claude CLI 登录。

    <Steps>
      <Step title="确保已安装 Claude CLI 并已登录">
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

        OpenClaw 会检测并复用已有的 Claude CLI 凭证。
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时详情见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    ### 配置示例

    优先使用规范的 Anthropic 模型引用，并添加 CLI 运行时覆盖：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    旧版 `claude-cli/claude-opus-4-7` 模型引用仍可用于
    兼容性，但新的配置应将提供商/模型选择保持为
    `anthropic/*`，并将执行后端放在 `agentRuntime.id` 中。

    <Tip>
    如果你想要最清晰的计费路径，请改用 Anthropic API key。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/glm) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## 思考默认值（Claude 4.6）

在 OpenClaw 中，如果没有显式设置思考级别，Claude 4.6 模型默认使用 `adaptive` 思考。

可通过 `/think:<level>` 按消息覆盖，或在模型参数中覆盖：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
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

OpenClaw 支持用于 API key 凭证的 Anthropic 提示缓存功能。

| 值                  | 缓存时长 | 说明                                 |
| ------------------- | -------- | ------------------------------------ |
| `"short"`（默认）   | 5 分钟   | 对 API key 凭证自动应用              |
| `"long"`            | 1 小时   | 扩展缓存                             |
| `"none"`            | 不缓存   | 禁用提示缓存                         |

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
  <Accordion title="按 agent 覆盖缓存">
    使用模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定 agent：

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

    这样可以让一个 agent 保持长生命周期缓存，同时让同一模型上的另一个 agent 针对突发/低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事项">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic Bedrock 模型在运行时会被强制设为 `cacheRetention: "none"`。
    - 当未设置显式值时，API key 智能默认值也会为 Claude-on-Bedrock 引用填充 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共享 `/fast` 开关支持直连 Anthropic 流量（API key 和到 `api.anthropic.com` 的 OAuth）。

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
    - 对于没有 Priority Tier 容量的账号，`service_tier: "auto"` 可能会解析为 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic 插件会注册图像和 PDF 理解。OpenClaw
    会从已配置的 Anthropic 凭证中自动解析媒体能力，无需
    额外配置。

    | 属性 | 值 |
    | --------------- | --------------------- |
    | 默认模型 | `claude-opus-4-7` |
    | 支持的输入 | 图像、PDF 文档 |

    当图像或 PDF 附加到对话时，OpenClaw 会自动
    通过 Anthropic 媒体理解提供商路由它。

  </Accordion>

  <Accordion title="1M 上下文窗口（beta）">
    Anthropic 的 1M 上下文窗口受 beta 门控。可按模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw 会在请求中将其映射为 `anthropic-beta: context-1m-2025-08-07`。

    `params.context1m: true` 也适用于符合条件的 Opus 和 Sonnet 模型的 Claude CLI 后端
    （`claude-cli/*`），会扩展这些 CLI 会话的运行时
    上下文窗口，使其与 direct-API 行为一致。

    <Warning>
    需要你的 Anthropic 凭证具备长上下文访问权限。旧版 token 凭证（`sk-ant-oat-*`）会被 1M 上下文请求拒绝，OpenClaw 会记录警告并回退到标准上下文窗口。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 上下文">
    `anthropic/claude-opus-4.7` 及其 `claude-cli` 变体默认拥有 1M 上下文
    窗口，无需 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / token 突然失效">
    Anthropic token 凭证会过期，也可能被撤销。对于新设置，请改用 Anthropic API key。
  </Accordion>

  <Accordion title='未找到 provider "anthropic" 的 API key'>
    Anthropic 凭证是**按 agent**配置的，新 agent 不会继承主 agent 的密钥。为该 agent 重新运行新手引导（或在 Gateway 网关主机上配置 API key），然后使用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到 profile "anthropic:default" 的凭证'>
    运行 `openclaw models status` 查看当前处于活动状态的凭证配置档案。重新运行新手引导，或为该配置档案路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的凭证配置档案（全部处于冷却中）">
    查看 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷却可能限定到模型范围，因此同级 Anthropic 模型可能仍然可用。添加另一个 Anthropic 配置档案，或等待冷却结束。
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
    Claude CLI 后端设置和运行时详情。
  </Card>
  <Card title="提示缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    提示缓存如何跨提供商工作。
  </Card>
  <Card title="OAuth 和凭证" href="/zh-CN/gateway/authentication" icon="key">
    凭证详情和凭证复用规则。
  </Card>
</CardGroup>
