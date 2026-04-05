---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证而不是 API 密钥
summary: 在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T10:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI 为 GPT 模型提供开发者 API。Codex 支持使用 **ChatGPT 登录**进行订阅访问，或使用 **API 密钥**进行按量计费访问。Codex cloud 需要 ChatGPT 登录。
OpenAI 明确支持在 OpenClaw 这样的外部工具/工作流中使用订阅 OAuth。

## 默认交互风格

OpenClaw 默认会为 `openai/*` 和 `openai-codex/*` 运行添加一个小型的 OpenAI 专用提示词覆盖层。这个覆盖层会让助手保持热情、协作、简洁和直接，同时不会替换 OpenClaw 的基础系统提示词。

配置键：

`plugins.entries.openai.config.personalityOverlay`

允许的值：

- `"friendly"`：默认；启用 OpenAI 专用覆盖层。
- `"off"`：禁用该覆盖层，仅使用 OpenClaw 基础提示词。

作用范围：

- 适用于 `openai/*` 模型。
- 适用于 `openai-codex/*` 模型。
- 不影响其他提供商。

此行为默认启用：

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### 禁用 OpenAI 提示词覆盖层

如果你更喜欢未修改的 OpenClaw 基础提示词，请关闭该覆盖层：

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

你也可以直接使用配置 CLI 进行设置：

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## 选项 A：OpenAI API 密钥（OpenAI Platform）

**最适合：** 直接 API 访问和按量计费。
请从 OpenAI 控制台获取你的 API 密钥。

### CLI 设置

```bash
openclaw onboard --auth-choice openai-api-key
# or non-interactive
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 配置片段

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI 当前的 API 模型文档列出了 `gpt-5.4` 和 `gpt-5.4-pro`，用于直接
OpenAI API 访问。OpenClaw 会通过 `openai/*` Responses 路径转发这两者。
OpenClaw 会刻意隐藏过时的 `openai/gpt-5.3-codex-spark` 条目，
因为直接 OpenAI API 调用在实际流量中会拒绝它。

OpenClaw **不会**在直接 OpenAI
API 路径上暴露 `openai/gpt-5.3-codex-spark`。`pi-ai` 仍然内置了该模型的一条记录，但实时 OpenAI API
请求当前会拒绝它。在 OpenClaw 中，Spark 被视为仅限 Codex。

## 选项 B：OpenAI Code（Codex）订阅

**最适合：** 使用 ChatGPT/Codex 订阅访问，而不是 API 密钥。
Codex cloud 需要 ChatGPT 登录，而 Codex CLI 支持使用 ChatGPT 或 API 密钥登录。

### CLI 设置（Codex OAuth）

```bash
# Run Codex OAuth in the wizard
openclaw onboard --auth-choice openai-codex

# Or run OAuth directly
openclaw models auth login --provider openai-codex
```

### 配置片段（Codex 订阅）

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAI 当前的 Codex 文档将 `gpt-5.4` 列为当前的 Codex 模型。OpenClaw
将其映射为 `openai-codex/gpt-5.4`，用于 ChatGPT/Codex OAuth 访问。

如果新手引导复用了现有的 Codex CLI 登录，这些凭据仍由 Codex CLI 管理。在过期时，OpenClaw 会优先重新读取外部 Codex 来源；当提供商可以刷新它时，会将刷新的凭据写回 Codex 存储，而不是在单独的 OpenClaw 专用副本中接管它。

如果你的 Codex 账户有权使用 Codex Spark，OpenClaw 还支持：

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw 将 Codex Spark 视为仅限 Codex。它不会暴露直接的
`openai/gpt-5.3-codex-spark` API 密钥路径。

当 `pi-ai`
发现 `openai-codex/gpt-5.3-codex-spark` 时，OpenClaw 也会保留它。请将其视为依赖权限且带有实验性质：Codex Spark 与 GPT-5.4 的 `/fast` 分离，是否可用取决于已登录的 Codex /
ChatGPT 账户。

### Codex 上下文窗口上限

OpenClaw 将 Codex 模型元数据和运行时上下文上限视为两个独立的值。

对于 `openai-codex/gpt-5.4`：

- 原生 `contextWindow`：`1050000`
- 默认运行时 `contextTokens` 上限：`272000`

这样可以在保持模型元数据真实的同时，保留实际中在延迟和质量方面表现更好的较小默认运行时窗口。

如果你想使用不同的实际上限，请设置 `models.providers.<provider>.models[].contextTokens`：

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

仅当你要声明或覆盖原生模型元数据时，才使用 `contextWindow`。如果你想限制运行时上下文预算，请使用 `contextTokens`。

### 传输默认值

OpenClaw 使用 `pi-ai` 进行模型流式传输。对于 `openai/*` 和
`openai-codex/*`，默认传输方式是 `"auto"`（优先 WebSocket，其次回退到 SSE）。

在 `"auto"` 模式下，OpenClaw 也会在回退到 SSE 之前，对一次早期且可重试的 WebSocket 失败进行重试。强制 `"websocket"` 模式仍会直接暴露传输错误，而不是通过回退来隐藏它们。

在 `"auto"` 模式下，当连接或早期轮次发生 WebSocket 失败后，OpenClaw 会将该会话的 WebSocket 路径标记为降级状态，大约持续 60 秒，并在冷却期间通过 SSE 发送后续轮次，而不是在不同传输方式之间反复切换。

对于原生 OpenAI 系列端点（`openai/*`、`openai-codex/*` 和 Azure
OpenAI Responses），OpenClaw 还会为请求附加稳定的会话和轮次身份状态，以便重试、重连和 SSE 回退始终对齐到同一个对话身份。在原生 OpenAI 系列路由上，这包括稳定的会话/轮次请求身份标头以及匹配的传输元数据。

在使用计数到达会话/状态表面之前，OpenClaw 还会对不同传输变体下的 OpenAI 使用计数器进行规范化。原生 OpenAI/Codex Responses 流量可能将使用量报告为 `input_tokens` / `output_tokens` 或
`prompt_tokens` / `completion_tokens`；对于 `/status`、`/usage` 和会话日志，OpenClaw 将它们视为相同的输入和输出计数器。当原生 WebSocket 流量省略 `total_tokens`（或报告为 `0`）时，OpenClaw 会回退到规范化后的输入 + 输出总量，以便会话/状态显示保持有值。

你可以设置 `agents.defaults.models.<provider/model>.params.transport`：

- `"sse"`：强制使用 SSE
- `"websocket"`：强制使用 WebSocket
- `"auto"`：先尝试 WebSocket，然后回退到 SSE

对于 `openai/*`（Responses API），当使用 WebSocket 传输时，OpenClaw 还会默认启用 WebSocket warm-up（`openaiWsWarmup: true`）。

相关 OpenAI 文档：

- [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
- [流式 API 响应（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket warm-up

OpenAI 文档将 warm-up 描述为可选项。OpenClaw 默认对
`openai/*` 启用它，以便在使用 WebSocket 传输时降低首轮延迟。

### 禁用 warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### 显式启用 warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI 和 Codex 优先处理

OpenAI 的 API 通过 `service_tier=priority` 提供优先处理能力。在
OpenClaw 中，设置 `agents.defaults.models["<provider>/<model>"].params.serviceTier`
即可在原生 OpenAI/Codex Responses 端点上透传该字段。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

支持的值为 `auto`、`default`、`flex` 和 `priority`。

当这些模型指向原生 OpenAI/Codex 端点时，OpenClaw 会将 `params.serviceTier` 同时转发到直接的 `openai/*` Responses
请求和 `openai-codex/*` Codex Responses 请求。

重要行为：

- 直接 `openai/*` 必须指向 `api.openai.com`
- `openai-codex/*` 必须指向 `chatgpt.com/backend-api`
- 如果你通过其他 base URL 或代理路由任一提供商，OpenClaw 会保持 `service_tier` 不变

### OpenAI 快速模式

OpenClaw 为 `openai/*` 和
`openai-codex/*` 会话都提供了共享的快速模式开关：

- 聊天/UI：`/fast status|on|off`
- 配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`

启用快速模式后，OpenClaw 会将其映射为 OpenAI 优先处理：

- 发送到 `api.openai.com` 的直接 `openai/*` Responses 调用会发送 `service_tier = "priority"`
- 发送到 `chatgpt.com/backend-api` 的 `openai-codex/*` Responses 调用也会发送 `service_tier = "priority"`
- 现有载荷中的 `service_tier` 值会被保留
- 快速模式不会重写 `reasoning` 或 `text.verbosity`

示例：

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

会话覆盖优先于配置。清除 Sessions UI 中的会话覆盖后，会话将恢复为配置中的默认值。

### 原生 OpenAI 路由与 OpenAI-compatible 路由

OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理方式不同于通用的 OpenAI-compatible `/v1` 代理：

- 原生 `openai/*`、`openai-codex/*` 和 Azure OpenAI 路由会在你显式禁用 reasoning 时保留
  `reasoning: { effort: "none" }`
- 原生 OpenAI 系列路由默认将工具 schema 设为严格模式
- 隐藏的 OpenClaw 归因标头（`originator`、`version` 和
  `User-Agent`）只会附加到已验证的原生 OpenAI 主机
  （`api.openai.com`）和原生 Codex 主机（`chatgpt.com/backend-api`）上
- 原生 OpenAI/Codex 路由会保留 OpenAI 专有的请求整形，例如
  `service_tier`、Responses `store`、OpenAI reasoning 兼容载荷以及提示词缓存提示
- 代理式的 OpenAI-compatible 路由会保留更宽松的兼容行为，并且不会强制严格工具 schema、原生专用请求整形或隐藏的
  OpenAI/Codex 归因标头

Azure OpenAI 在传输和兼容行为方面仍属于原生路由类别，但它不会接收隐藏的 OpenAI/Codex 归因标头。

这样可以在不把旧版 OpenAI-compatible shim 强加到第三方 `/v1` 后端的前提下，保留当前原生 OpenAI Responses 的行为。

### OpenAI Responses 服务端压缩

对于直接 OpenAI Responses 模型（`openai/*` 使用 `api: "openai-responses"` 且
`baseUrl` 指向 `api.openai.com`），OpenClaw 现在会自动启用 OpenAI 服务端压缩载荷提示：

- 强制 `store: true`（除非模型兼容性设置 `supportsStore: false`）
- 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`

默认情况下，`compact_threshold` 为模型 `contextWindow` 的 `70%`（如果不可用则为 `80000`）。

### 显式启用服务端压缩

当你想在兼容的 Responses 模型上强制注入 `context_management` 时使用此选项（例如 Azure OpenAI Responses）：

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### 使用自定义阈值启用

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
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

### 禁用服务端压缩

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` 只控制 `context_management` 的注入。
直接 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性设置
`supportsStore: false`。

## 说明

- 模型引用始终使用 `provider/model`（参见 [/concepts/models](/zh-CN/concepts/models)）。
- 认证详情和复用规则见 [/concepts/oauth](/zh-CN/concepts/oauth)。
