---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T12:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6af35571debf5889b63e3b4f6a05aa4e046f39740287e6e1c492916ca00df44b
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic（Claude）

Anthropic 构建了 **Claude** 模型家族，并通过 API 提供访问。
在 OpenClaw 中，新的 Anthropic 设置应使用 API 密钥。现有的旧版
Anthropic token 配置文件如果已经完成配置，运行时仍会继续支持。

<Warning>
对于 OpenClaw 中的 Anthropic，计费拆分如下：

- **Anthropic API 密钥**：标准 Anthropic API 计费。
- **OpenClaw 内的 Claude 订阅凭证**：Anthropic 于
  **2026 年 4 月 4 日 PT 时间中午 12:00 / BST 时间晚上 8:00**
  告知 OpenClaw 用户，这会被视为
  第三方 harness 使用，并需要 **Extra Usage**（按量计费，
  与订阅分开计费）。

我们的本地复现结果也符合这一拆分：

- 直接执行 `claude -p` 可能仍然可用
- `claude -p --append-system-prompt ...` 在提示词标识出 OpenClaw 时，
  可能触发 Extra Usage 保护
- 在 Anthropic SDK + `ANTHROPIC_API_KEY` 路径上，相同的类 OpenClaw
  系统提示词**不会**复现该拦截

因此，实际规则是：**Anthropic API 密钥，或启用了
Extra Usage 的 Claude 订阅**。如果你想要最清晰的生产环境路径，请使用 Anthropic API
密钥。

Anthropic 当前的公开文档：

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

如果你想要最清晰的计费路径，请改用 Anthropic API 密钥。
OpenClaw 也支持其他订阅式选项，包括 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding Plan](/zh-CN/providers/qwen)、
[MiniMax Coding Plan](/zh-CN/providers/minimax) 和 [Z.AI / GLM Coding
Plan](/zh-CN/providers/glm)。
</Warning>

## 选项 A：Anthropic API 密钥

**最适合：** 标准 API 访问和按量计费。
请在 Anthropic Console 中创建你的 API 密钥。

### CLI 设置

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Anthropic 配置片段

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Thinking 默认值（Claude 4.6）

- 当未设置显式 thinking 级别时，Anthropic Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` thinking。
- 你可以按消息覆盖（`/think:<level>`），或在模型参数中覆盖：
  `agents.defaults.models["anthropic/<model>"].params.thinking`。
- 相关 Anthropic 文档：
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## 快速模式（Anthropic API）

OpenClaw 的共享 `/fast` 开关也支持直连公开 Anthropic 流量，包括发送到 `api.anthropic.com` 的 API 密钥和 OAuth 认证请求。

- `/fast on` 映射到 `service_tier: "auto"`
- `/fast off` 映射到 `service_tier: "standard_only"`
- 配置默认值：

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

重要限制：

- OpenClaw 只会为直连 `api.anthropic.com` 的请求注入 Anthropic service tier。如果你通过代理或 Gateway 网关路由 `anthropic/*`，`/fast` 不会修改 `service_tier`。
- 如果同时设置了显式的 Anthropic `serviceTier` 或 `service_tier` 模型参数，它们会覆盖 `/fast` 默认值。
- Anthropic 会在响应中的 `usage.service_tier` 返回实际生效的 tier。对于没有 Priority Tier 容量的账户，`service_tier: "auto"` 仍可能解析为 `standard`。

## 提示词缓存（Anthropic API）

OpenClaw 支持 Anthropic 的提示词缓存功能。这是**仅 API** 功能；旧版 Anthropic token 凭证不会应用缓存设置。

### 配置

在你的模型配置中使用 `cacheRetention` 参数：

| Value   | Cache Duration | Description        |
| ------- | -------------- | ------------------ |
| `none`  | 不缓存         | 禁用提示词缓存     |
| `short` | 5 分钟         | API 密钥凭证的默认值 |
| `long`  | 1 小时         | 扩展缓存           |

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

### 默认值

当使用 Anthropic API 密钥认证时，OpenClaw 会自动为所有 Anthropic 模型应用 `cacheRetention: "short"`（5 分钟缓存）。你可以在配置中显式设置 `cacheRetention` 来覆盖此行为。

### 按智能体覆盖 cacheRetention

请将模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体。

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // 大多数智能体的基线
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // 仅覆盖这个智能体
    ],
  },
}
```

与缓存相关参数的配置合并顺序：

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（匹配 `id`，按键覆盖）

这样，你就可以让一个智能体保留长期缓存，同时让同一模型上的另一个智能体禁用缓存，以避免在突发 / 低复用流量下产生写入成本。

### Bedrock Claude 说明

- Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置时接受 `cacheRetention` 透传。
- 非 Anthropic 的 Bedrock 模型在运行时会被强制设置为 `cacheRetention: "none"`。
- 当未设置显式值时，Anthropic API 密钥的智能默认值也会为 Claude-on-Bedrock 模型引用填充 `cacheRetention: "short"`。

## 1M 上下文窗口（Anthropic beta）

Anthropic 的 1M 上下文窗口仍处于 beta 限制阶段。在 OpenClaw 中，
请通过 `params.context1m: true` 为受支持的 Opus/Sonnet 模型逐个启用。

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

OpenClaw 会将其映射为 Anthropic 请求上的
`anthropic-beta: context-1m-2025-08-07`。

只有在该模型的 `params.context1m` 被显式设置为 `true` 时，
此功能才会激活。

要求：Anthropic 必须允许该凭证使用长上下文
（通常是 API 密钥计费，或启用了 Extra Usage 的 OpenClaw Claude 登录路径 / 旧版 token 凭证）。
否则 Anthropic 会返回：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意：Anthropic 当前会在使用
旧版 Anthropic token 凭证（`sk-ant-oat-*`）时拒绝 `context-1m-*` beta 请求。如果你在该旧版凭证模式下配置了
`context1m: true`，OpenClaw 会记录一条警告，并通过跳过 context1m beta
header 回退到标准上下文窗口，同时保留必需的 OAuth beta。

## 已移除：Claude CLI 后端

内置 Anthropic `claude-cli` 后端已被移除。

- Anthropic 在 2026 年 4 月 4 日的通知中表示，由 OpenClaw 驱动的 Claude 登录流量属于
  第三方 harness 使用，并需要 **Extra Usage**。
- 我们的本地复现也表明，直接执行
  `claude -p --append-system-prompt ...` 在附加的提示词标识出 OpenClaw 时，
  也可能触发相同保护。
- 在 Anthropic SDK + `ANTHROPIC_API_KEY` 路径上，相同的类 OpenClaw 提示词
  不会触发该保护。
- 在 OpenClaw 中处理 Anthropic 流量时，请使用 Anthropic API 密钥。
- 如果你需要本地 CLI 回退运行时，请使用其他受支持的 CLI 后端，
  例如 Codex CLI。请参阅 [/gateway/cli-backends](/gateway/cli-backends)。

## 说明

- Anthropic 的公开 Claude Code 文档仍然记录了诸如
  `claude -p` 之类的直接 CLI 用法，但 Anthropic 单独发给 OpenClaw 用户的通知指出，
  **OpenClaw** 的 Claude 登录路径属于第三方 harness 使用，并要求
  **Extra Usage**（按量计费，与订阅分开计费）。
  我们的本地复现也表明，直接执行
  `claude -p --append-system-prompt ...` 在附加提示词标识出 OpenClaw 时
  也可能触发相同保护，而相同的提示词形式在 Anthropic SDK + `ANTHROPIC_API_KEY`
  路径上不会复现该问题。对于生产环境，我们
  改为推荐使用 Anthropic API 密钥。
- Anthropic setup-token 现已在 OpenClaw 中重新提供，作为旧版 / 手动路径。Anthropic 针对 OpenClaw 的专用计费通知仍然适用，因此请在预期 Anthropic 会对此路径要求 **Extra Usage** 的前提下使用它。
- 凭证详情和复用规则请参阅 [/concepts/oauth](/zh-CN/concepts/oauth)。

## 故障排除

**401 错误 / token 突然失效**

- 旧版 Anthropic token 凭证可能会过期或被撤销。
- 对于新的设置，请迁移到 Anthropic API 密钥。

**提供商 “anthropic” 未找到 API 密钥**

- 凭证是**按智能体**区分的。新智能体不会继承主智能体的密钥。
- 请重新为该智能体运行新手引导，或在 gateway host 上配置 API 密钥，
  然后使用 `openclaw models status` 进行验证。

**未找到配置文件 `anthropic:default` 的凭证**

- 运行 `openclaw models status` 以查看当前激活的是哪个凭证配置文件。
- 重新运行新手引导，或为该配置文件路径配置 API 密钥。

**没有可用的凭证配置文件（全部处于冷却 / 不可用）**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- Anthropic 的速率限制冷却可能是按模型生效的，因此即使当前模型正在冷却，
  同级的其他 Anthropic 模型仍可能可用。
- 添加另一个 Anthropic 配置文件，或等待冷却结束。

更多内容：[/gateway/troubleshooting](/zh-CN/gateway/troubleshooting) 和 [/help/faq](/zh-CN/help/faq)。
