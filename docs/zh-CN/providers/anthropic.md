---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你想在 Gateway 网关主机上复用 Claude CLI 订阅认证
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T10:05:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic（Claude）

Anthropic 构建了 **Claude** 模型家族，并通过 API 提供访问。
在 OpenClaw 中，新的 Anthropic 设置应使用 API 密钥或本地 Claude CLI
后端。如果现有的旧版 Anthropic token 配置文件已经配置好，运行时仍会继续支持。

<Warning>
Anthropic 公开的 Claude Code 文档明确记录了非交互式 CLI
用法，例如 `claude -p`。基于这些文档，我们认为本地、由用户管理的 Claude Code CLI 回退方案很可能是被允许的。

另外，Anthropic 在 **2026 年 4 月 4 日下午 12:00 PT / 晚上 8:00 BST** 通知 OpenClaw 用户，
**OpenClaw 被视为第三方 harness**。他们声明的政策是，由 OpenClaw 驱动的 Claude 登录流量不再使用包含在内的 Claude 订阅配额池，而是需要 **Extra Usage**
（按量付费，与订阅分开计费）。

这一政策区分针对的是**由 OpenClaw 驱动的 Claude CLI 复用**，而不是你在自己的终端中直接运行 `claude`。尽管如此，Anthropic 关于第三方 harness 的政策对于在外部产品中使用订阅支持的方式仍然存在足够多的不确定性，因此我们不建议在生产环境中使用这一路径。

Anthropic 当前的公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概览](https://platform.claude.com/docs/en/agent-sdk/overview)

- [在你的 Pro 或 Max 套餐中使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [在你的 Team 或 Enterprise 套餐中使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

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

### Claude CLI 配置片段

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

- `/fast on` 映射为 `service_tier: "auto"`
- `/fast off` 映射为 `service_tier: "standard_only"`
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

- OpenClaw 仅会为直连 `api.anthropic.com` 的请求注入 Anthropic service tier。如果你通过代理或 Gateway 网关转发 `anthropic/*`，`/fast` 不会改动 `service_tier`。
- 当同时设置时，显式的 Anthropic `serviceTier` 或 `service_tier` 模型参数会覆盖 `/fast` 默认值。
- Anthropic 会在响应中的 `usage.service_tier` 下报告实际生效的 tier。对于没有 Priority Tier 容量的账户，`service_tier: "auto"` 仍可能解析为 `standard`。

## 提示词缓存（Anthropic API）

OpenClaw 支持 Anthropic 的提示词缓存功能。这是**仅限 API** 的；旧版 Anthropic token 认证不会遵循缓存设置。

### 配置

在你的模型配置中使用 `cacheRetention` 参数：

| 值      | 缓存时长 | 说明                   |
| ------- | -------- | ---------------------- |
| `none`  | 不缓存   | 禁用提示词缓存         |
| `short` | 5 分钟   | API Key 认证的默认值   |
| `long`  | 1 小时   | 扩展缓存               |

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

使用 Anthropic API Key 认证时，OpenClaw 会自动为所有 Anthropic 模型应用 `cacheRetention: "short"`（5 分钟缓存）。你可以在配置中显式设置 `cacheRetention` 来覆盖此默认值。

### 按智能体覆盖 cacheRetention

将模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体。

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
      { id: "alerts", params: { cacheRetention: "none" } }, // 仅对这个智能体覆盖
    ],
  },
}
```

与缓存相关参数的配置合并顺序：

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（匹配的 `id`，按键覆盖）

这使得一个智能体可以保留长期缓存，而同一模型上的另一个智能体则可以禁用缓存，以避免在突发性/低复用流量上产生写入成本。

### Bedrock Claude 说明

- Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置时接受 `cacheRetention` 透传。
- 非 Anthropic 的 Bedrock 模型在运行时会被强制设为 `cacheRetention: "none"`。
- 当未设置显式值时，Anthropic API-key 智能默认值也会为 Bedrock 上的 Claude 模型引用填充 `cacheRetention: "short"`。

## 1M 上下文窗口（Anthropic beta）

Anthropic 的 1M 上下文窗口受 beta 限制。在 OpenClaw 中，可通过为支持的 Opus/Sonnet 模型按模型启用
`params.context1m: true` 来开启。

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

OpenClaw 会将其映射为 Anthropic 请求中的
`anthropic-beta: context-1m-2025-08-07`。

仅当该模型显式设置 `params.context1m` 为 `true` 时，此功能才会启用。

要求：Anthropic 必须允许该凭据使用长上下文
（通常是 API 密钥计费，或启用了 Extra Usage 的 OpenClaw Claude 登录路径 / 旧版 token 认证）。
否则 Anthropic 会返回：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意：Anthropic 当前在使用
旧版 Anthropic token 认证（`sk-ant-oat-*`）时会拒绝 `context-1m-*` beta 请求。如果你在该旧版认证模式下配置
`context1m: true`，OpenClaw 会记录一条警告，并通过跳过 context1m beta
header、同时保留必需的 OAuth beta，回退到标准上下文窗口。

## 选项 B：将 Claude CLI 作为消息提供商

**最适合：** 已安装并登录 Claude CLI 的单用户 Gateway 网关主机，作为本地回退方案，而不是推荐的生产路径。

计费说明：基于 Anthropic 公开的 CLI 文档，我们认为 Claude Code CLI 回退对于本地、由用户管理的自动化很可能是被允许的。尽管如此，Anthropic 的第三方 harness 政策对在外部产品中使用订阅支持的方式仍带来足够多的不确定性，因此我们不建议在生产环境中使用。Anthropic 还告知 OpenClaw 用户，**由 OpenClaw 驱动的** Claude
CLI 使用会被视为第三方 harness 流量，并且自 **2026 年 4 月 4 日下午 12:00 PT / 晚上 8:00 BST**
起，需要 **Extra Usage**，而不再使用包含在内的 Claude 订阅额度。

这一路径使用本地 `claude` 二进制进行模型推理，而不是直接调用
Anthropic API。OpenClaw 将其视为一个**CLI 后端提供商**，
模型引用形式如下：

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

工作方式：

1. OpenClaw 在**Gateway 网关主机**上启动 `claude -p --output-format stream-json --include-partial-messages ...`，
   并通过 stdin 发送提示词。
2. 第一轮会发送 `--session-id <uuid>`。
3. 后续轮次会通过 `--resume <sessionId>` 复用已存储的 Claude 会话。
4. 你的聊天消息仍然会经过正常的 OpenClaw 消息管道，但实际的模型回复由 Claude CLI 生成。

### 要求

- Claude CLI 已安装在 Gateway 网关主机上，并且在 PATH 中可用，或已配置为绝对命令路径。
- Claude CLI 已在同一台主机上完成认证：

```bash
claude auth status
```

- 当你的配置显式引用 `claude-cli/...` 或 `claude-cli` 后端配置时，OpenClaw 会在 Gateway 网关启动时自动加载内置的 Anthropic 插件。

### 配置片段

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

如果 `claude` 二进制不在 Gateway 网关主机的 PATH 中：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### 你将获得什么

- 从本地 CLI 复用 Claude 订阅认证（运行时读取，不持久化）
- 正常的 OpenClaw 消息/会话路由
- 跨轮次保持的 Claude CLI 会话连续性（认证变化时会失效）
- 通过 loopback MCP bridge 向 Claude CLI 暴露 Gateway 网关工具
- 带实时部分消息进度的 JSONL 流式传输

### 从 Anthropic 认证迁移到 Claude CLI

如果你当前对 `anthropic/...` 使用旧版 token 配置文件或 API 密钥，并且想将同一台 Gateway 网关主机切换到 Claude CLI，OpenClaw 支持将其作为常规的 provider-auth 迁移路径。

前提条件：

- Claude CLI 已安装在运行 OpenClaw 的**同一台 Gateway 网关主机**上
- Claude CLI 已在那里登录：`claude auth login`

然后运行：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

或者在新手引导中运行：

```bash
openclaw onboard --auth-choice anthropic-cli
```

交互式 `openclaw onboard` 和 `openclaw configure` 现在会优先显示 **Anthropic
Claude CLI**，其次才是 **Anthropic API key**。

这会执行以下操作：

- 验证 Claude CLI 是否已在 Gateway 网关主机上登录
- 将默认模型切换为 `claude-cli/...`
- 将默认的 Anthropic 模型回退，例如 `anthropic/claude-opus-4-6`
  重写为 `claude-cli/claude-opus-4-6`
- 向 `agents.defaults.models` 添加匹配的 `claude-cli/...` 条目

快速验证：

```bash
openclaw models status
```

你应该会在 `claude-cli/...` 下看到解析后的主模型。

它**不会**执行的操作：

- 删除你现有的 Anthropic 认证配置文件
- 移除主默认模型/允许列表路径之外的所有旧 `anthropic/...` 配置引用

这让回滚非常简单：如果需要，只需将默认模型改回 `anthropic/...`。

### 重要限制

- 这**不是** Anthropic API 提供商。这是本地 CLI 运行时。
- OpenClaw 不会直接注入工具调用。Claude CLI 通过 loopback MCP bridge
  接收 Gateway 网关工具（`bundleMcp: true`，默认行为）。
- Claude CLI 通过 JSONL 进行流式回复（`stream-json` 配合
  `--include-partial-messages`）。提示词通过 stdin 发送，而不是 argv。
- 认证会在运行时从实时的 Claude CLI 凭据中读取，不会持久化
  到 OpenClaw 配置文件中。在非交互式上下文中会抑制钥匙串提示。
- 会话复用通过 `cliSessionBinding` 元数据跟踪。当 Claude CLI
  登录状态变化时（重新登录、令牌轮换），已存储的会话会失效，并启动一个新的会话。
- 更适合个人 Gateway 网关主机，而不适合共享的多用户计费设置。

更多详情：[/gateway/cli-backends](/zh-CN/gateway/cli-backends)

## 说明

- Anthropic 公开的 Claude Code 文档仍然记录了直接 CLI 用法，例如
  `claude -p`。我们认为本地、由用户管理的回退方案很可能是被允许的，但
  Anthropic 向 OpenClaw 用户发出的单独通知指出，**OpenClaw**
  Claude 登录路径属于第三方 harness 使用，并需要 **Extra Usage**
  （按量付费，与订阅分开计费）。对于生产环境，我们建议改用 Anthropic API 密钥。
- Anthropic setup-token 现已在 OpenClaw 中重新作为旧版/手动路径提供。Anthropic 针对 OpenClaw 的计费通知仍然适用，因此使用这一路径时，应预期 Anthropic 会要求 **Extra Usage**。
- 认证细节与复用规则见 [/concepts/oauth](/zh-CN/concepts/oauth)。

## 故障排除

**401 错误 / token 突然失效**

- 旧版 Anthropic token 认证可能会过期或被撤销。
- 对于新设置，请迁移到 Anthropic API 密钥，或使用 Gateway 网关主机上的本地 Claude CLI 路径。

**未找到提供商 “anthropic” 的 API 密钥**

- 认证是**按智能体**划分的。新智能体不会继承主智能体的密钥。
- 为该智能体重新运行新手引导，或在 Gateway 网关主机上配置 API 密钥，然后使用 `openclaw models status` 验证。

**未找到配置文件 `anthropic:default` 的凭据**

- 运行 `openclaw models status` 查看当前活动的认证配置文件。
- 重新运行新手引导，或为该配置文件路径配置 API 密钥或 Claude CLI。

**没有可用的认证配置文件（全部处于冷却/不可用状态）**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- Anthropic 的速率限制冷却可能是按模型生效的，因此即使当前模型处于冷却中，同级的其他 Anthropic
  模型仍可能可用。
- 添加另一个 Anthropic 配置文件，或等待冷却结束。

更多内容：[/gateway/troubleshooting](/zh-CN/gateway/troubleshooting) 和 [/help/faq](/zh-CN/help/faq)。
