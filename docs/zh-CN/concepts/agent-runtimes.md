---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生智能体运行时之间进行选择
    - 你对 Status 或配置中的提供商/模型/运行时标签感到困惑
    - 你正在为原生 harness 的支持一致性编写文档
summary: OpenClaw 如何区分模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-04-25T03:42:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ccfdd0ac9e53f7196ff1884016b4bd890978de0c41a661f9264d2dde4c899b3
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**智能体运行时**是负责管理一个已准备好的模型循环的组件：它接收提示词，驱动模型输出，处理原生工具调用，并将完成的轮次返回给 OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型配置附近。它们是不同的层级：

| 层级 | 示例 | 含义 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供商 | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何进行身份验证、发现模型并命名模型引用。 |
| 模型 | `gpt-5.5`, `claude-opus-4-6` | 为智能体轮次选择的模型。 |
| Agent Runtimes | `pi`, `codex`, 由 ACP 支持的运行时 | 执行已准备轮次的底层循环。 |
| 渠道 | Telegram、Discord、Slack、WhatsApp | 消息进入和离开 OpenClaw 的位置。 |

你还会在代码和配置中看到 **harness** 这个词。harness 是提供智能体运行时的实现。例如，内置的 Codex harness 实现了 `codex` 运行时。出于兼容性原因，配置键仍然命名为 `embeddedHarness`，但面向用户的文档和 Status 输出通常应使用“运行时”。

常见的 Codex 设置使用 `openai` 提供商和 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

这意味着 OpenClaw 选择一个 OpenAI 模型引用，然后请求 Codex app-server 运行时来运行嵌入式智能体轮次。这并不意味着渠道、模型提供商目录或 OpenClaw 会话存储会变成 Codex。

关于 OpenAI 系列前缀拆分，请参见 [OpenAI](/zh-CN/providers/openai) 和[模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持契约，请参见 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## 运行时归属

不同的运行时负责循环中的不同部分。

| 界面 | OpenClaw PI embedded | Codex app-server |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者 | OpenClaw，通过 PI embedded runner | Codex app-server |
| 规范线程状态 | OpenClaw transcript | Codex 线程，以及 OpenClaw transcript 镜像 |
| OpenClaw 动态工具 | 原生 OpenClaw 工具循环 | 通过 Codex 适配器桥接 |
| 原生 shell 和文件工具 | PI/OpenClaw 路径 | Codex 原生工具，在支持时通过原生钩子桥接 |
| 上下文引擎 | 原生 OpenClaw 上下文组装 | OpenClaw projects 将上下文组装进 Codex 轮次 |
| 压缩 | OpenClaw 或所选上下文引擎 | Codex 原生压缩，带有 OpenClaw 通知和镜像维护 |
| 渠道投递 | OpenClaw | OpenClaw |

这种归属划分是主要的设计规则：

- 如果某个界面由 OpenClaw 负责，OpenClaw 就可以提供常规的插件钩子行为。
- 如果某个界面由原生运行时负责，OpenClaw 就需要运行时事件或原生钩子。
- 如果原生运行时负责规范线程状态，OpenClaw 应该镜像并投射上下文，而不是重写不受支持的内部机制。

## 运行时选择

OpenClaw 会在提供商和模型解析之后选择一个嵌入式运行时：

1. 会话中记录的运行时优先生效。配置更改不会将现有 transcript 热切换到不同的原生线程系统。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会强制新会话或已重置会话使用该运行时。
3. `agents.defaults.embeddedHarness.runtime` 或 `agents.list[].embeddedHarness.runtime` 可以设置为 `auto`、`pi` 或已注册的运行时 id，例如 `codex`。
4. 在 `auto` 模式下，已注册的插件运行时可以声明支持的提供商/模型对。
5. 如果在 `auto` 模式下没有运行时声明某个轮次，且设置了 `fallback: "pi"`（默认值），OpenClaw 会使用 PI 作为兼容性回退。将 `fallback: "none"` 设置为不匹配的 `auto` 模式选择直接失败。

显式插件运行时默认会以封闭失败方式处理。例如，`runtime: "codex"` 表示要么使用 Codex，要么返回明确的选择错误，除非你在同一覆盖作用域中设置 `fallback: "pi"`。运行时覆盖不会继承更广泛的回退设置，因此，智能体级别的 `runtime: "codex"` 不会仅仅因为默认值使用了 `fallback: "pi"` 就被静默路由回 PI。

## 兼容性契约

当运行时不是 PI 时，它应当说明自己支持哪些 OpenClaw 界面。运行时文档应使用以下结构：

| 问题 | 重要原因 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁负责模型循环？ | 这决定了重试、工具续接和最终答案判断发生在哪里。 |
| 谁负责规范线程历史？ | 这决定了 OpenClaw 是可以编辑历史，还是只能镜像历史。 |
| OpenClaw 动态工具是否可用？ | 消息、会话、cron 和 OpenClaw 自有工具依赖这一点。 |
| 动态工具钩子是否可用？ | 插件期望在 OpenClaw 自有工具周围使用 `before_tool_call`、`after_tool_call` 和中间件。 |
| 原生工具钩子是否可用？ | shell、patch 和运行时自有工具需要原生钩子来实现策略与观测。 |
| 上下文引擎生命周期是否运行？ | Memory 和上下文插件依赖 assemble、ingest、after-turn 和 compaction 生命周期。 |
| 暴露了哪些压缩数据？ | 有些插件只需要通知，而有些则需要保留/丢弃元数据。 |
| 哪些内容是有意不支持的？ | 当原生运行时拥有更多状态时，用户不应假设它与 PI 等价。 |

Codex 运行时支持契约记录在 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。应将它们理解为诊断信息，而不是提供商名称。

- 类似 `openai/gpt-5.5` 这样的模型引用会告诉你所选的提供商/模型。
- 类似 `codex` 这样的运行时 id 会告诉你哪个循环正在执行该轮次。
- 类似 Telegram 或 Discord 这样的渠道标签会告诉你对话发生在哪里。

如果在更改运行时配置后，会话仍然显示 PI，请使用 `/new` 开始新会话，或使用 `/reset` 清除当前会话。现有会话会保留其记录的运行时，这样 transcript 就不会通过两个不兼容的原生会话系统被重新播放。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [Status](/zh-CN/cli/status)
