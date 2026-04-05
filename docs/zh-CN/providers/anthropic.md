---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你想在 Gateway 网关主机上复用 Claude CLI 订阅认证
summary: 在 OpenClaw 中通过 API key 或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T08:41:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16152e6c53bac71f72154bd320ca82bbde7d3d89bd248d7ea9a34dfd60cd9fe3
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic（Claude）

Anthropic 构建了 **Claude** 模型家族，并通过 API 提供访问。
在 OpenClaw 中，新的 Anthropic 设置应使用 API key 或本地 Claude CLI
后端。如果现有的旧版 Anthropic token 配置文件已经配置好，运行时仍会继续支持。

<Warning>
Anthropic 的公开 Claude Code 文档称，直接使用 Claude Code 已包含在
Claude 订阅中。另行地，Anthropic 于 **2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时晚上 8:00**
通知 OpenClaw 用户，**OpenClaw 被视为第三方 harness**。根据他们说明的政策，由 OpenClaw 驱动的 Claude 登录流量将不再使用随附的 Claude 订阅额度池，而是需要 **Extra Usage**（按量付费，与订阅分开计费）。

这一区分针对的是**由 OpenClaw 驱动的 Claude CLI 复用**，而不是你在自己的终端中直接运行 `claude`。

Anthropic 当前关于直接使用 Claude Code 套餐的文档：

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

如果你想要更清晰的计费路径，请改用 Anthropic API key。OpenClaw
还支持其他订阅式选项，包括 [OpenAI
Codex](/providers/openai)、[Qwen Cloud Coding
Plan](/providers/qwen)、[MiniMax Coding Plan](/providers/minimax)
和 [Z.AI / GLM Coding Plan](/providers/glm)。
</Warning>

## 选项 A：Anthropic API key

**最适合：** 标准 API 访问和按量计费。
请在 Anthropic Console 中创建你的 API key。

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

- 当未设置显式 thinking 等级时，Anthropic Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` thinking。
- 你可以按消息覆盖（`/think:<level>`），或在模型参数中设置：
  `agents.defaults.models["anthropic/<model>"].params.thinking`。
- 相关 Anthropic 文档：
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## 快速模式（Anthropic API）

OpenClaw 的共享 `/fast` 开关也支持直接的公开 Anthropic 流量，包括发送到 `api.anthropic.com` 的 API key 和 OAuth 认证请求。

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

- OpenClaw 只会为直接发往 `api.anthropic.com` 的请求注入 Anthropic service tier。如果你通过代理或 Gateway 网关转发 `anthropic/*`，`/fast` 将不会修改 `service_tier`。
- 如果显式设置了 Anthropic `serviceTier` 或 `service_tier` 模型参数，则当二者同时存在时，它们会覆盖 `/fast` 默认值。
- Anthropic 会在响应中的 `usage.service_tier` 下报告实际生效的 tier。对于没有 Priority Tier 容量的账户，`service_tier: "auto"` 仍可能解析为 `standard`。

## Prompt 缓存（Anthropic API）

OpenClaw 支持 Anthropic 的 prompt 缓存功能。这是**仅限 API**的；旧版 Anthropic token 认证不会遵循缓存设置。

### 配置

在你的模型配置中使用 `cacheRetention` 参数：

| 值      | 缓存时长 | 描述                    |
| ------- | -------- | ----------------------- |
| `none`  | 不缓存   | 禁用 prompt 缓存        |
| `short` | 5 分钟   | API Key 认证的默认值    |
| `long`  | 1 小时   | 扩展缓存                |

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

当使用 Anthropic API Key 认证时，OpenClaw 会自动为所有 Anthropic 模型应用 `cacheRetention: "short"`（5 分钟缓存）。你可以在配置中显式设置 `cacheRetention` 来覆盖此行为。

### 按智能体覆盖 cacheRetention

使用模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体。

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
      { id: "alerts", params: { cacheRetention: "none" } }, // 仅对此智能体覆盖
    ],
  },
}
```

与缓存相关参数的配置合并顺序：

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（匹配 `id`，按键覆盖）

这样，一个智能体可以保留长期缓存，而另一个使用相同模型的智能体可以禁用缓存，以避免在突发/低复用流量上产生写入成本。

### Bedrock Claude 说明

- 配置后，Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）会接受 `cacheRetention` 透传。
- 非 Anthropic 的 Bedrock 模型会在运行时被强制设置为 `cacheRetention: "none"`。
- 当未设置显式值时，Anthropic API key 的智能默认值也会为 Claude-on-Bedrock 模型引用填入 `cacheRetention: "short"`。

## 100 万上下文窗口（Anthropic beta）

Anthropic 的 100 万上下文窗口属于 beta 限制功能。在 OpenClaw 中，可通过
为受支持的 Opus/Sonnet 模型设置 `params.context1m: true` 按模型启用。

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

仅当该模型的 `params.context1m` 被显式设置为 `true` 时，此功能才会激活。

要求：Anthropic 必须允许该凭证使用长上下文
（通常是 API key 计费，或 OpenClaw 的 Claude 登录路径 / 启用了 Extra Usage 的旧版 token 认证）。
否则 Anthropic 会返回：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注意：Anthropic 当前会在使用
旧版 Anthropic token 认证（`sk-ant-oat-*`）时拒绝 `context-1m-*` beta 请求。
如果你在该旧版认证模式下配置了
`context1m: true`，OpenClaw 会记录警告，并通过跳过 context1m beta
header、同时保留所需 OAuth beta 的方式回退到标准上下文窗口。

## 选项 B：将 Claude CLI 作为消息 provider

**最适合：** 已经安装 Claude CLI 并使用 Claude 订阅登录的单用户 Gateway 网关主机。

计费说明：Anthropic 的公开 Claude Code 文档覆盖的是
在 Pro/Max 或 Team/Enterprise 套餐下**直接**使用 Claude Code。另行地，Anthropic 告知
OpenClaw 用户，**由 OpenClaw 驱动**的 Claude CLI 使用会被视为
第三方 harness 流量。截至 **2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时晚上 8:00**，
Anthropic 表示这条 OpenClaw 路径需要 **Extra Usage**，而不是使用随附的 Claude 订阅额度。

这一路径使用本地 `claude` 二进制进行模型推理，而不是直接调用
Anthropic API。OpenClaw 将其视为一个 **CLI 后端 provider**，其模型引用如下：

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

工作方式：

1. OpenClaw 在**Gateway 网关主机**上启动 `claude -p --output-format stream-json --include-partial-messages ...`，
   并通过 stdin 发送 prompt。
2. 第一轮发送 `--session-id <uuid>`。
3. 后续轮次通过 `--resume <sessionId>` 复用已存储的 Claude 会话。
4. 你的聊天消息仍会经过正常的 OpenClaw 消息管线，但
   实际模型回复由 Claude CLI 生成。

### 要求

- 在 Gateway 网关主机上安装 Claude CLI，并且位于 PATH 中，或已配置
  为绝对命令路径。
- Claude CLI 已经在同一主机上完成认证：

```bash
claude auth status
```

- 当你的配置显式引用 `claude-cli/...` 或 `claude-cli` 后端配置时，OpenClaw 会在 Gateway 网关启动时自动加载内置 Anthropic 插件。

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

- 从本地 CLI 复用 Claude 订阅认证
- 正常的 OpenClaw 消息/会话路由
- 跨轮次保持的 Claude CLI 会话连续性

### 从 Anthropic 认证迁移到 Claude CLI

如果你当前对 `anthropic/...` 使用旧版 token 配置文件或 API key，并希望将同一 Gateway 网关主机切换到 Claude CLI，OpenClaw 支持将其作为常规的 provider 认证迁移路径。

前提条件：

- 在运行 OpenClaw 的**同一 Gateway 网关主机**上安装 Claude CLI
- Claude CLI 已在那里完成登录：`claude auth login`

然后运行：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

或在新手引导中运行：

```bash
openclaw onboard --auth-choice anthropic-cli
```

交互式 `openclaw onboard` 和 `openclaw configure` 现在会优先显示 **Anthropic（API + Claude CLI）**，其中 **Anthropic Claude CLI** 在前，**Anthropic API key** 在后。

这会执行以下操作：

- 验证 Claude CLI 是否已在 Gateway 网关主机上登录
- 将默认模型切换为 `claude-cli/...`
- 将 Anthropic 默认模型回退项（如 `anthropic/claude-opus-4-6`）重写为 `claude-cli/claude-opus-4-6`
- 在 `agents.defaults.models` 中添加对应的 `claude-cli/...` 条目

快速验证：

```bash
openclaw models status
```

你应当会看到解析后的主模型位于 `claude-cli/...` 下。

它**不会**执行以下操作：

- 删除你现有的 Anthropic 认证配置文件
- 移除主默认模型/允许列表路径之外的所有旧 `anthropic/...` 配置引用

这样做可以让回滚变得简单：如果你需要，只需将默认模型改回 `anthropic/...`。

### 重要限制

- 这**不是** Anthropic API provider，而是本地 CLI 运行时。
- 对于 CLI 后端运行，OpenClaw 侧会禁用工具。
- 仅支持文本输入、文本输出。不支持 OpenClaw 流式交接。
- 更适合个人 Gateway 网关主机，而不适合共享的多用户计费场景。

更多细节：[/gateway/cli-backends](/gateway/cli-backends)

## 说明

- Anthropic 的公开 Claude Code 套餐文档仍然适用于
  在 Claude 订阅下直接在终端中使用 Claude Code。Anthropic 另行向
  OpenClaw 用户发出的通知则说明，**OpenClaw** 的 Claude 登录路径属于第三方 harness
  使用，并需要 **Extra Usage**（按量付费，与订阅分开计费）。
- Anthropic setup-token 现已在 OpenClaw 中重新作为旧版/手动路径提供。Anthropic 面向 OpenClaw 的特定计费通知仍然适用，因此使用此路径时应预期 Anthropic 会要求 **Extra Usage**。
- 认证细节和复用规则见 [/concepts/oauth](/concepts/oauth)。

## 故障排除

**401 错误 / token 突然失效**

- 旧版 Anthropic token 认证可能会过期或被撤销。
- 对于新设置，请迁移到 Anthropic API key，或在 Gateway 网关主机上使用本地 Claude CLI 路径。

**No API key found for provider "anthropic"**

- 认证是**按智能体**管理的。新智能体不会继承主智能体的 key。
- 请为该智能体重新运行新手引导，或在 Gateway 网关主机上配置 API key，
  然后使用 `openclaw models status` 进行验证。

**No credentials found for profile `anthropic:default`**

- 运行 `openclaw models status` 查看当前激活的是哪个认证配置文件。
- 重新运行新手引导，或为该配置文件路径配置 API key 或 Claude CLI。

**No available auth profile (all in cooldown/unavailable)**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- Anthropic 限流冷却可能按模型作用域生效，因此即使当前模型处于冷却中，同级的其他 Anthropic
  模型仍可能可用。
- 添加另一个 Anthropic 配置文件，或等待冷却结束。

更多内容：[/gateway/troubleshooting](/gateway/troubleshooting) 和 [/help/faq](/help/faq)。
