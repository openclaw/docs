---
read_when:
    - 集成支持 OpenResponses API 的客户端
    - 你想要基于条目的输入、客户端工具调用或 SSE 事件
summary: 从 Gateway 网关暴露一个兼容 OpenResponses 的 /v1/responses HTTP 端点
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-05T11:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway 网关可以提供兼容 OpenResponses 的 `POST /v1/responses` 端点。它**默认禁用**，并与 Gateway 网关共享端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`。

请求会作为普通 Gateway 网关 agent 运行来执行（与 `openclaw agent` 使用相同代码路径），因此路由、权限和配置与你的 Gateway 网关一致。

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用。启用后，同一兼容性表面还会提供 `GET /v1/models`、`GET /v1/models/{id}`、`POST /v1/embeddings` 和 `POST /v1/chat/completions`。

## 认证、安全和路由

运行行为与 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api) 一致：

- 认证路径与 `gateway.auth.mode` 匹配：共享密钥（`token`/`password`）使用 `Authorization: Bearer <token-or-password>`；可信代理使用带身份信息的代理标头（同主机 loopback 代理需要 `gateway.auth.trustedProxy.allowLoopback = true`，当不存在 `Forwarded`/`X-Forwarded-*`/`X-Real-IP` 标头时，可通过 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 使用同主机直连回退）；私有入口上的 `none` 不需要认证标头。参见[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。
- 将该端点视为对 Gateway 网关实例的完整操作员访问权限。
- 共享密钥认证模式会忽略范围更窄的承载方声明 `x-openclaw-scopes`，并恢复完整的默认操作员权限范围集合：`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。此端点上的聊天轮次会被视为所有者发送者轮次。
- 带可信身份的 HTTP 模式（可信代理，或 `gateway.auth.mode="none"`）在存在 `x-openclaw-scopes` 时会遵循它，否则回退到操作员默认权限范围集合。只有当调用方显式缩小权限范围并省略 `operator.admin` 时，所有者语义才会丢失。
- 使用 `model: "openclaw"`、`"openclaw/default"`、`"openclaw/<agentId>"` 或 `x-openclaw-agent-id` 标头选择 agent。
- 使用 `x-openclaw-model` 覆盖所选 agent 的后端模型（在带身份信息的认证路径上需要 `operator.admin`）。
- 使用 `x-openclaw-session-key` 进行显式会话路由（如果使用保留命名空间：`subagent:`、`cron:`、`acp:`，则会以 `400 invalid_request_error` 拒绝）。
- 使用 `x-openclaw-message-channel` 设置非默认的合成入口渠道上下文。

有关 agent 目标模型、`openclaw/default`、embeddings 透传和后端模型覆盖的规范说明，请参见 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api#agent-first-model-contract)。

参见[操作员权限范围](/zh-CN/gateway/operator-scopes)和[安全](/zh-CN/gateway/security)。

## 会话行为

默认情况下，该端点**每个请求无状态**（每次调用都会生成新的会话键）。

如果请求包含 OpenResponses `user` 字符串，Gateway 网关会从中派生稳定的会话键，以便重复调用可以共享 agent 会话。

当请求保持在同一 agent/user/requested-session 权限范围内（按认证主体、agent id 和 `x-openclaw-session-key` 匹配）时，`previous_response_id` 会复用较早响应的会话。

## 请求形状

| 字段                                                            | 支持                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | 字符串或条目对象数组。                                                                                               |
| `instructions`                                                   | 合并到系统提示中。                                                                                                 |
| `tools`                                                          | 客户端工具定义（函数工具）。                                                                                      |
| `tool_choice`                                                    | `"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "name": "..." }`，用于筛选或要求客户端工具。                |
| `stream`                                                         | 启用 SSE 流式传输。                                                                                                         |
| `max_output_tokens`                                              | 尽力输出限制（取决于提供商）。                                                                                 |
| `temperature`                                                    | 尽力采样温度。基于 ChatGPT 的 Codex Responses 后端会忽略它，因为该后端使用固定的服务器端采样。 |
| `top_p`                                                          | 尽力 nucleus sampling。与 `temperature` 相同，适用 Codex Responses 注意事项。                                                    |
| `user`                                                           | 稳定会话路由。                                                                                                        |
| `previous_response_id`                                           | 会话连续性（见上文）。                                                                                                |
| `max_tool_calls`、`reasoning`、`metadata`、`store`、`truncation` | 接受但目前会忽略。                                                                                                |

## 条目（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 会追加到系统提示中。
- 最近的 `user` 或 `function_call_output` 条目会成为“当前消息”。
- 更早的 user/assistant 消息会作为历史记录纳入，用于提供上下文。

### `function_call_output`（基于轮次的工具）

将工具结果发回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

为 schema 兼容性而接受，但在构建提示时会忽略。

## 工具（客户端函数工具）

使用 `tools: [{ type: "function", name, description?, parameters? }]` 提供工具。

如果 agent 调用工具，响应会返回一个 `function_call` 输出条目。发送包含 `function_call_output` 的后续请求以继续该轮次。

对于 `tool_choice: "required"` 和固定函数的 `tool_choice`，该端点会缩小暴露的客户端函数工具集合，指示运行时在响应前调用客户端工具，并在轮次不包含匹配的结构化客户端工具调用时拒绝该轮次，与 `/v1/chat/completions` 契约一致。非流式请求会返回带有 `api_error` 的 `502`；流式请求会发出 `response.failed` 事件。

## 图片（`input_image`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型（默认）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。最大大小（默认）：10MB。

## 文件（`input_file`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

允许的 MIME 类型（默认）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、`application/json`、`application/pdf`。最大大小（默认）：5MB。

当前行为：

- 文件内容会被解码并添加到**系统提示**，而不是用户消息，因此它保持临时状态（不会持久化到会话历史中）。
- 解码后的文件文本在添加前会被包装为**不可信外部内容**，因此文件字节会被视为数据，而不是可信指令。注入的块使用显式边界标记（`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`）和一行 `Source: External` 元数据。它会有意省略较长的 `SECURITY NOTICE:` 横幅以保留提示预算；边界标记和元数据仍然适用。
- PDF 会先解析文本。如果找到的文本很少，前几页会被栅格化为图片并传给模型，注入的文件块会使用占位符 `[PDF content rendered to images]`。

PDF 解析由内置 `document-extract` 插件提供，该插件使用 `clawpdf` 及其打包的 PDFium WebAssembly 运行时进行文本提取和页面渲染。

URL 获取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每个请求中基于 URL 的 `input_file` + `input_image` 部分总数）
- 请求会受到防护（DNS 解析、私有 IP 阻断、重定向上限、超时）。
- 支持按输入类型配置可选主机名允许列表（`files.urlAllowlist`、`images.urlAllowlist`）：精确主机（`"cdn.example.com"`）或通配符子域名（`"*.assets.example.com"`，不匹配 apex 域）。空的或省略的允许列表表示没有主机名允许列表限制。
- 若要完全禁用基于 URL 的获取，请设置 `files.allowUrl: false` 和/或 `images.allowUrl: false`。

## 文件 + 图片限制（配置）

默认值可在 `gateway.http.endpoints.responses` 下调整：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 60000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

| 键                      | 默认值   |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

HEIC/HEIF `input_image` 来源会通过共享 OpenClaw 图片处理器（Rastermill）在交付给提供商前规范化为 JPEG；对于需要外部编解码器支持的格式，它会回退到系统转换器（`sips`、ImageMagick、GraphicsMagick 或 ffmpeg）。

安全说明：URL 允许列表会在获取前以及重定向跳转时强制执行。将主机名加入允许列表不会绕过私有/内部 IP 阻断。对于暴露在互联网的 Gateway 网关，除了应用级防护外，还应应用网络出口控制。参见[安全](/zh-CN/gateway/security)。

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events：

- `Content-Type: text/event-stream`
- 每个事件行都是 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型：`response.created`、`response.in_progress`、`response.output_item.added`、`response.content_part.added`、`response.output_text.delta`、`response.output_text.done`、`response.content_part.done`、`response.output_item.done`、`response.completed`、`response.failed`（出错时）。

## 用法

当底层提供商报告 token 计数时，会填充 `usage`。OpenClaw 会先规范化常见的 OpenAI 风格别名，再让这些计数器到达下游状态/会话表面，包括 `input_tokens` / `output_tokens` 和 `prompt_tokens` / `completion_tokens`。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：`400` 请求正文无效，`401` 缺少/无效凭证，`403` 缺少操作员权限范围，`405` 方法错误，`429` 凭证验证失败次数过多（带有 `Retry-After`）。

## 示例

非流式传输：

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

流式传输：

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## 相关

- [OpenAI 聊天补全](/zh-CN/gateway/openai-http-api)
- [操作员权限范围](/zh-CN/gateway/operator-scopes)
- [OpenAI](/zh-CN/providers/openai)
