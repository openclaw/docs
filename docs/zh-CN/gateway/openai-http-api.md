---
read_when:
    - 集成需要 OpenAI Chat Completions 的工具
summary: 从 Gateway 网关公开兼容 OpenAI 的 `/v1/chat/completions` HTTP 端点
title: OpenAI 聊天补全
x-i18n:
    generated_at: "2026-07-11T20:32:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway 网关可以提供一个精简的、与 OpenAI 兼容的 Chat Completions 接口。该接口**默认禁用**。

启用后，它会在与 Gateway 网关相同的端口上提供以下所有接口（WS + HTTP 多路复用）：

| 方法 | 路径                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

请求会作为普通的 Gateway 网关智能体运行来执行（代码路径与 `openclaw agent` 相同），因此路由、权限和配置均与你的 Gateway 网关一致。

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

设置 `enabled: false`（或省略该配置）即可禁用。

## 安全边界（重要）

应将此端点视为对 Gateway 网关实例拥有**完整操作员访问权限**：

- 此端点的有效 Gateway 网关令牌/密码等同于所有者/操作员凭据，而不是范围受限的单用户权限。
- 请求通过与受信任操作员操作相同的控制平面智能体路径运行，因此如果目标智能体的策略允许使用敏感工具，此端点也可以使用这些工具。
- 仅允许通过回环地址、tailnet 或私有入口访问。不要将其暴露到公共互联网。

身份验证矩阵：

| 身份验证路径                                                                                            | 行为                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`                            | 证明调用方持有共享的 Gateway 网关密钥。忽略任何 `x-openclaw-scopes` 标头，并恢复完整的默认操作员权限范围集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。将聊天轮次视为所有者发送方的轮次。 |
| 携带受信任身份的 HTTP（受信任代理身份验证，或在私有入口上使用 `gateway.auth.mode="none"`） | 如果存在 `x-openclaw-scopes`，则遵循其设置；如果不存在，则回退到默认操作员权限范围集合。只有当调用方明确缩小权限范围并省略 `operator.admin` 时，才会失去所有者语义。使用 `x-openclaw-model` 等所有者级控制需要 `operator.admin`。                        |

请参阅[操作员权限范围](/zh-CN/gateway/operator-scopes)、[安全性](/zh-CN/gateway/security)和[远程访问](/zh-CN/gateway/remote)。

## 身份验证

使用 Gateway 网关身份验证配置（有关该模式的详细信息，请参阅[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）：

| 模式                                | 身份验证方式                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`。通过 `gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN` 设置。                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`。通过 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD` 设置。                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | 通过已配置的身份感知代理进行路由；该代理会注入所需的身份标头。同一主机上的回环代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。 |
| `gateway.auth.mode="none"`          | 无需身份验证标头（仅限私有入口）。                                                                                                                                         |

注意：

- 在 `trusted-proxy` Gateway 网关上绕过代理的同一主机调用方，可以直接回退到 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。任何 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头证据都会使请求继续使用受信任代理路径。
- 如果已配置 `gateway.auth.rateLimit`，且身份验证失败尝试次数过多，端点将返回 `429`，并附带 `Retry-After` 标头。

## 何时使用此端点

- 如果你的集成只是同一 Gateway 网关的另一种操作员/客户端接口，应优先使用此端点，而不是添加新的内置渠道。
- 对于直接连接到远程 Gateway 网关的原生移动客户端，优先使用 [WebChat](/zh-CN/web/webchat) 或 [Gateway 网关协议](/zh-CN/gateway/protocol)，并采用已配对设备的引导启动/设备令牌流程，这样设备便不需要共享的 HTTP 令牌/密码。
- 如果要集成拥有自己的用户、房间、Webhook 交付或出站传输的外部消息网络，则应改为构建渠道插件。请参阅[构建插件](/zh-CN/plugins/building-plugins)。

## 智能体优先的模型契约

OpenClaw 将 OpenAI 的 `model` 字段视为**智能体目标**，而不是原始的提供商模型 ID。

| `model` 值                                | 路由到                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | 已配置的默认智能体                                                                                                 |
| `openclaw/default`                           | 已配置的默认智能体（稳定别名；即使实际的默认智能体 ID 在不同环境之间发生变化，也可以安全地硬编码） |
| `openclaw/<agentId>` 或 `openclaw:<agentId>` | 指定智能体                                                                                                           |
| `agent:<agentId>`                            | 指定智能体（兼容性别名）                                                                                     |

可选请求标头：

| 标头                                          | 效果                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 覆盖所选智能体的后端模型。使用共享密钥 Bearer 凭据的调用方可以直接使用此标头；携带身份的调用方（受信任代理，或通过带有 `x-openclaw-scopes` 的私有免身份验证入口）需要 `operator.admin`，否则返回 `403 missing scope: operator.admin`。 |
| `x-openclaw-agent-id: <agentId>`                | 用于选择智能体的兼容性覆盖项。                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | 显式会话路由。如果使用了保留的内部命名空间（`subagent:`、`cron:`、`acp:`），则以 `400 invalid_request_error` 拒绝请求。                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | 为能够感知渠道的提示词/策略设置合成入口渠道上下文。                                                                                                                                                                                              |

`/v1/models` 列出顶层智能体目标（`openclaw`、`openclaw/default`、`openclaw/<agentId>`），而不是后端提供商模型，也不包括子智能体；子智能体仍属于内部执行拓扑。如果省略 `x-openclaw-model`，所选智能体将使用其正常配置的模型运行。

`/v1/embeddings` 使用相同的智能体目标 `model` ID。发送 `x-openclaw-model`（由共享密钥调用方发送，或由拥有 `operator.admin` 的携带身份调用方发送）可选择特定的嵌入模型；否则，请求将使用所选智能体的常规嵌入配置。

## 会话行为

默认情况下，该端点的每个请求都是**无状态的**（每次调用都会生成新的会话键）。

如果请求包含 OpenAI `user` 字符串，Gateway 网关会根据它派生一个稳定的会话键，使重复调用可以共享一个智能体会话。对于自定义应用，请为每个对话线程复用相同的 `user` 值；除非你希望多个对话/设备共享同一个 OpenClaw 会话，否则应避免使用账户级标识符。仅当你需要跨多个客户端/线程进行显式路由控制时，才使用 `x-openclaw-session-key`，并使用由应用拥有且避开上述保留命名空间的键。

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
| `maxImageParts`       | 8（从最新用户消息中读取的 `image_url` 部分数量上限）                 |
| `maxTotalImageBytes`  | 20MB（单个请求中所有 `image_url` 部分的累计解码字节数） |
| `images.allowUrl`     | `false`（除非启用，否则拒绝来源为 URL 的 `image_url` 部分）         |
| `images.maxBytes`     | 每张图片 10MB                                                              |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10 秒                                                                         |

HEIC/HEIF `image_url` 来源会被接受，并在通过共享的 OpenClaw 图像处理器（Rastermill）交付给提供商之前标准化为 JPEG。对于需要外部编解码器支持的格式，该处理器会回退到系统转换器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全提示：将主机名加入允许列表并不会绕过对私有/内部 IP 的阻止。对于暴露在互联网中的 Gateway 网关，除了应用层防护外，还应实施网络出站控制。请参阅[安全](/zh-CN/gateway/security)。

## 聊天工具契约

`/v1/chat/completions` 支持与常见 OpenAI Chat 客户端兼容的函数工具子集。

### 支持的请求字段

| 字段                       | 说明                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` 数组                                                                                                         |
| `tool_choice`              | `"auto"`、`"none"`、`"required"` 或 `{ "type": "function", "function": { "name": "..." } }`                                                               |
| `messages[*].role: "tool"` | 后续轮次                                                                                                                                                   |
| `messages[*].tool_call_id` | 将工具结果关联回之前的工具调用                                                                                                                             |
| `max_completion_tokens`    | 数值；单次调用的总补全 token 上限（包括推理 token）。这是当前字段名；当它与 `max_tokens` 同时发送时使用此字段。                                             |
| `max_tokens`               | 数值；旧版别名，当 `max_completion_tokens` 同时存在时忽略。                                                                                                |
| `temperature`              | 0–2 之间的数值；尽力支持，并转发给上游提供商。超出范围时返回 `400 invalid_request_error`。                                                                 |
| `top_p`                    | 0–1 之间的数值；尽力支持。超出范围时返回 `400 invalid_request_error`。                                                                                     |
| `frequency_penalty`        | -2.0 到 2.0 之间的数值；尽力支持。超出范围时返回 `400 invalid_request_error`。                                                                              |
| `presence_penalty`         | -2.0 到 2.0 之间的数值；尽力支持。超出范围时返回 `400 invalid_request_error`。                                                                              |
| `seed`                     | 整数；尽力支持。非整数值会返回 `400 invalid_request_error`。                                                                                               |
| `stop`                     | 字符串或最多包含 4 个字符串的数组；尽力支持。序列超过 4 个，或存在非字符串/空条目时返回 `400 invalid_request_error`。                                        |

所有采样字段和 token 上限字段都通过同一个智能体流参数通道传递，并以尽力而为的方式转发：

- token 上限：传输层字段名由提供商传输协议决定：OpenAI 系列端点使用 `max_completion_tokens`，仅接受旧字段名的提供商（Mistral、Chutes）使用 `max_tokens`。
- `stop` 映射到传输协议的停止字段：Chat Completions 后端使用 `stop`，Anthropic 使用 `stop_sequences`。OpenAI Responses API 没有停止参数，因此基于 Responses 的模型不会应用 `stop`。
- 基于 ChatGPT 的 Codex Responses 后端使用服务端固定采样，并在请求到达该后端前移除 `temperature`/`top_p`（以及 `max_output_tokens`、`metadata`、`prompt_cache_retention`、`service_tier`）。

### 不支持的变体

以下情况返回 `400 invalid_request_error`：

- `tools` 不是数组、包含非函数工具条目，或缺少 `tool.function.name`
- `tool_choice` 使用 `allowed_tools`、`custom` 等变体
- `tool_choice.function.name` 的值与所提供的任何工具都不匹配

对于 `tool_choice: "required"` 和固定函数的 `tool_choice`，该端点会缩小向客户端公开的函数工具集合，指示运行时在响应前调用客户端工具；如果智能体响应中没有匹配的结构化客户端工具调用，则返回错误。这适用于调用方提供的 HTTP `tools` 列表，而不是 OpenClaw 智能体的所有内部工具。

### 非流式工具响应结构

当智能体调用工具时，响应使用：

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` 条目，包含 `id`、`type: "function"`、`function.name`、`function.arguments`（JSON 字符串）
- 工具调用前的助手说明，位于 `choices[0].message.content` 中（可能为空）

### 流式工具响应结构

当 `stream: true` 时，工具调用以增量 SSE 分块到达：首先是助手角色增量，然后是可选的助手说明增量，再然后是一个或多个携带工具标识和参数片段的 `delta.tool_calls` 分块，最后是包含 `finish_reason: "tool_calls"` 和 `data: [DONE]` 的分块。

如果 `stream_options.include_usage=true`，则会在 `[DONE]` 之前发送最后一个用量分块。

### 工具后续循环

收到 `tool_calls` 后，执行请求的函数，并发送后续请求，其中包含之前的助手工具调用消息，以及一条或多条具有匹配 `tool_call_id` 的 `role: "tool"` 消息。这会继续同一个智能体推理循环，以生成最终答案。

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件：

- `Content-Type: text/event-stream`
- 每个事件行的格式为 `data: <json>`
- 流以 `data: [DONE]` 结束

## Open WebUI 快速设置

- 基础 URL：`http://127.0.0.1:18789/v1`
- macOS 上 Docker 的基础 URL：`http://host.docker.internal:18789/v1`
- API 密钥：你的 Gateway 网关持有者 token
- 模型：`openclaw/default`

预期行为：`GET /v1/models` 会列出 `openclaw/default`，Open WebUI 将它用作聊天模型 ID。要指定特定的后端提供商/模型，请设置智能体的常规默认模型，或发送 `x-openclaw-model`（使用共享密钥的调用方，或具有身份信息且拥有 `operator.admin` 的调用方）。

快速冒烟测试：

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

如果返回 `openclaw/default`，大多数 Open WebUI 设置都可以使用相同的基础 URL 和 token 进行连接。

## 示例

为一次应用对话使用稳定会话：

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

在该对话的后续调用中复用相同的 `user` 值，以继续同一个智能体会话。

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

流式：

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

获取单个模型：

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

`/v1/embeddings` 支持将 `input` 设置为字符串或字符串数组。

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [操作员权限范围](/zh-CN/gateway/operator-scopes)
- [OpenAI](/zh-CN/providers/openai)
