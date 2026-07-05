---
read_when:
    - 集成需要 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关暴露一个兼容 OpenAI 的 /v1/chat/completions HTTP 端点
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-07-05T11:19:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway 网关可以提供一个小型的 OpenAI 兼容 Chat Completions 接口面。它**默认禁用**。

启用后，它会在与 Gateway 网关相同的端口上提供以下所有端点（WS + HTTP 多路复用）：

| 方法 | 路径                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

请求会作为普通 Gateway 网关智能体运行执行（与 `openclaw agent` 相同的代码路径），因此路由、权限和配置都与你的 Gateway 网关一致。

## 启用端点

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

设置 `enabled: false`（或省略它）即可禁用。

## 安全边界（重要）

将此端点视为对 gateway 实例的**完整操作员访问权限**：

- 此端点的有效 Gateway 网关令牌/密码等同于所有者/操作员凭证，而不是狭窄的按用户权限范围。
- 请求会通过与受信任操作员操作相同的控制平面智能体路径运行，因此如果目标智能体的策略允许敏感工具，此端点就可以使用它们。
- 仅将其保留在 loopback/tailnet/私有入口上。不要将其暴露到公网。

认证矩阵：

| 认证路径                                                                                            | 行为                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`                            | 证明持有共享 gateway 密钥。忽略任何 `x-openclaw-scopes` 标头，并恢复完整的默认操作员权限范围集：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。将聊天轮次视为所有者发送方轮次。 |
| 带有受信任身份的 HTTP（trusted-proxy 认证，或私有入口上的 `gateway.auth.mode="none"`） | 存在 `x-openclaw-scopes` 时遵循它；不存在时回退到默认操作员权限范围集。只有当调用方显式缩小权限范围并省略 `operator.admin` 时，才会失去所有者语义。对于 `x-openclaw-model` 等所有者级控制，需要 `operator.admin`。                        |

参见 [操作员权限范围](/zh-CN/gateway/operator-scopes)、[安全](/zh-CN/gateway/security) 和 [远程访问](/zh-CN/gateway/remote)。

## 认证

使用 Gateway 网关认证配置（有关该模式的详细信息，请参见 [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)）：

| 模式                                | 如何认证                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`。通过 `gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN` 设置。                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`。通过 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD` 设置。                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | 通过已配置的身份感知代理路由；它会注入所需的身份标头。同主机 loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。 |
| `gateway.auth.mode="none"`          | 不需要认证标头（仅限私有入口）。                                                                                                                                         |

说明：

- 在 `trusted-proxy` gateway 上绕过代理的同主机调用方，可以直接回退到 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头证据都会让请求改为保持在 trusted-proxy 路径上。
- 如果配置了 `gateway.auth.rateLimit` 且认证失败尝试过多，端点会返回带有 `Retry-After` 标头的 `429`。

## 何时使用此端点

- 当你的集成只是同一个 gateway 的另一个操作员/客户端接口面时，优先使用此端点，而不是添加新的内置渠道。
- 对于直接连接到远程 gateway 的原生移动客户端，优先使用 [WebChat](/zh-CN/web/webchat) 或带有已配对设备引导/device-token 流程的 [Gateway 协议](/zh-CN/gateway/protocol)，这样设备就不需要共享 HTTP 令牌/密码。
- 当你要集成具有自身用户、房间、webhook 投递或出站传输的外部消息网络时，请改为构建渠道插件。参见 [构建插件](/zh-CN/plugins/building-plugins)。

## 智能体优先的模型契约

OpenClaw 将 OpenAI `model` 字段视为**智能体目标**，而不是原始提供商模型 ID。

| `model` 值                                | 路由到                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | 已配置的默认智能体                                                                                                 |
| `openclaw/default`                           | 已配置的默认智能体（稳定别名；即使真实默认智能体 ID 在不同环境之间变化，也可以安全硬编码） |
| `openclaw/<agentId>` 或 `openclaw:<agentId>` | 特定智能体                                                                                                           |
| `agent:<agentId>`                            | 特定智能体（兼容性别名）                                                                                     |

可选请求标头：

| 标头                                          | 作用                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 覆盖所选智能体的后端模型。共享密钥 bearer 调用方可以直接使用；带有身份的调用方（trusted-proxy，或带有 `x-openclaw-scopes` 的私有无认证入口）需要 `operator.admin`，否则返回 `403 missing scope: operator.admin`。 |
| `x-openclaw-agent-id: <agentId>`                | 用于智能体选择的兼容性覆盖。                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | 显式会话路由。如果使用保留的内部命名空间（`subagent:`、`cron:`、`acp:`），则会以 `400 invalid_request_error` 拒绝。                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | 为渠道感知提示词/策略设置合成入口渠道上下文。                                                                                                                                                                                              |

`/v1/models` 列出顶层智能体目标（`openclaw`、`openclaw/default`、`openclaw/<agentId>`），而不是后端提供商模型，也不是子智能体；子智能体仍然是内部执行拓扑。如果省略 `x-openclaw-model`，所选智能体会使用其正常配置的模型运行。

`/v1/embeddings` 使用相同的智能体目标 `model` ID。发送 `x-openclaw-model`（来自共享密钥调用方，或具有 `operator.admin` 的带身份调用方）即可选择特定嵌入模型；否则请求会使用所选智能体的正常嵌入设置。

## 会话行为

默认情况下，端点**每个请求都是无状态的**（每次调用都会生成新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会从中派生稳定会话键，以便重复调用可以共享一个智能体会话。对于自定义应用，请为每个对话线程复用相同的 `user` 值；除非你希望多个对话/设备共享一个 OpenClaw 会话，否则应避免使用账号级标识符。只有在你需要跨多个客户端/线程进行显式路由控制时，才使用 `x-openclaw-session-key`，并使用应用自有的键来避开上面的保留命名空间。

## 请求限制（配置）

可以在 `gateway.http.endpoints.chatCompletions` 下调整默认值：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略时的默认值：

| 键                   | 默认值                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                        |
| `maxImageParts`       | 8（从最新用户消息读取的最大 `image_url` 部分数量）                 |
| `maxTotalImageBytes`  | 20MB（单个请求中所有 `image_url` 部分的累计解码字节数） |
| `images.allowUrl`     | `false`（除非启用，否则会拒绝 URL 来源的 `image_url` 部分）         |
| `images.maxBytes`     | 每张图片 10MB                                                              |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10s                                                                         |

HEIC/HEIF `image_url` 来源会被接受，并在通过共享 OpenClaw 图像处理器（Rastermill）投递给提供商之前规范化为 JPEG；对于需要外部编解码器支持的格式，该处理器会回退到系统转换器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全说明：将主机名加入允许列表不会绕过对私有/内部 IP 的阻止。对于暴露在互联网的 Gateway 网关，除应用级防护外，还应应用网络出口控制。参见 [安全](/zh-CN/gateway/security)。

## 聊天工具契约

`/v1/chat/completions` 支持与常见 OpenAI Chat 客户端兼容的函数工具子集。

### 支持的请求字段

| 字段                       | 说明                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` 的数组                                                                                         |
| `tool_choice`              | `"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "function": { "name": "..." } }`                                                  |
| `messages[*].role: "tool"` | 后续轮次                                                                                                                                     |
| `messages[*].tool_call_id` | 将工具结果绑定回之前的工具调用                                                                                                               |
| `max_completion_tokens`    | 数字；每次调用的总补全 token 上限（包括推理 token）。当前字段名；当它和 `max_tokens` 同时发送时使用它。                                      |
| `max_tokens`               | 数字；旧版别名，当同时存在 `max_completion_tokens` 时会被忽略。                                                                              |
| `temperature`              | 数字 0-2；尽力而为，转发给上游提供商。超出范围时返回 `400 invalid_request_error`。                                                           |
| `top_p`                    | 数字 0-1；尽力而为。超出范围时返回 `400 invalid_request_error`。                                                                             |
| `frequency_penalty`        | 数字 -2.0 到 2.0；尽力而为。超出范围时返回 `400 invalid_request_error`。                                                                     |
| `presence_penalty`         | 数字 -2.0 到 2.0；尽力而为。超出范围时返回 `400 invalid_request_error`。                                                                     |
| `seed`                     | 整数；尽力而为。非整数值会返回 `400 invalid_request_error`。                                                                                 |
| `stop`                     | 字符串或最多 4 个字符串的数组；尽力而为。超过 4 个序列，或存在非字符串/空条目时返回 `400 invalid_request_error`。                            |

所有采样和 token 上限字段都走同一个智能体流参数通道，并以尽力而为方式转发：

- Token 上限：线路字段名由提供商传输层选择：OpenAI 系列端点使用 `max_completion_tokens`，只接受旧版名称的提供商（Mistral、Chutes）使用 `max_tokens`。
- `stop` 会映射到传输层的停止字段：Chat Completions 后端使用 `stop`，Anthropic 使用 `stop_sequences`。OpenAI Responses API 没有 stop 参数，因此 `stop` 不会应用到由 Responses 支持的模型。
- 基于 ChatGPT 的 Codex Responses 后端使用固定的服务端采样，并在请求到达该后端前移除 `temperature`/`top_p`（以及 `max_output_tokens`、`metadata`、`prompt_cache_retention`、`service_tier`）。

### 不支持的变体

以下情况返回 `400 invalid_request_error`：

- 非数组 `tools`、非函数工具条目，或缺少 `tool.function.name`
- `tool_choice` 的变体，例如 `allowed_tools` 和 `custom`
- 与已提供工具不匹配的 `tool_choice.function.name` 值

对于 `tool_choice: "required"` 和固定到函数的 `tool_choice`，端点会收窄暴露的客户端函数工具集，指示运行时在响应前调用客户端工具，并在智能体响应没有匹配的结构化客户端工具调用时返回错误。这适用于调用方提供的 HTTP `tools` 列表，而不是每个 OpenClaw 内部智能体工具。

### 非流式工具响应形状

当智能体调用工具时，响应使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 条目，包含 `id`、`type: "function"`、`function.name`、`function.arguments`（JSON 字符串）
- 工具调用前的助手说明，位于 `choices[0].message.content`（可能为空）

### 流式工具响应形状

当 `stream: true` 时，工具调用会作为增量 SSE 分块到达：先是初始助手角色 delta，然后是可选的助手说明 delta，一个或多个携带工具标识和参数片段的 `delta.tool_calls` 分块，最后是带有 `finish_reason: "tool_calls"` 的最终分块和 `data: [DONE]`。

如果 `stream_options.include_usage=true`，会在 `[DONE]` 之前发出一个尾随的用量分块。

### 工具后续循环

收到 `tool_calls` 后，执行请求的函数，并发送一个后续请求，其中包括之前的助手工具调用消息，以及一条或多条带有匹配 `tool_call_id` 的 `role: "tool"` 消息。这会继续同一个智能体推理循环，以生成最终答案。

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events：

- `Content-Type: text/event-stream`
- 每个事件行是 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

- 基础 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基础 URL：`http://host.docker.internal:18789/v1`
- API key：你的 Gateway 网关 bearer token
- 模型：`openclaw/default`

预期行为：`GET /v1/models` 会列出 `openclaw/default`，Open WebUI 会将其用作聊天模型 ID。对于特定后端提供商/模型，请设置智能体的普通默认模型，或发送 `x-openclaw-model`（共享密钥调用方，或带身份且拥有 `operator.admin` 的调用方）。

快速冒烟测试：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回 `openclaw/default`，大多数 Open WebUI 设置都可以使用相同的基础 URL 和 token 连接。

## 示例

一个应用对话的稳定会话：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

在该对话之后的调用中复用相同的 `user` 值，以继续同一个智能体会话。

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式传输：

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

列出模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

获取一个模型：

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

创建嵌入：

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` 支持将 `input` 作为字符串或字符串数组。

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference)
- [操作员权限范围](/zh-CN/gateway/operator-scopes)
- [OpenAI](/zh-CN/providers/openai)
