---
read_when:
    - 集成使用 OpenResponses API 的客户端
    - 你需要基于条目的输入、客户端工具调用或 SSE 事件
summary: 从 Gateway 网关暴露兼容 OpenResponses 的 /v1/responses HTTP 端点
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-27T02:04:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw 的 Gateway 网关可以提供与 OpenResponses 兼容的 `POST /v1/responses` 端点。

此端点**默认禁用**。请先在配置中启用它。

- `POST /v1/responses`
- 与 Gateway 网关相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`

在底层，请求会作为普通 Gateway 网关智能体运行来执行（与
`openclaw agent` 相同的代码路径），因此路由/权限/配置与你的 Gateway 网关一致。

## 身份验证、安全性和路由

运行行为与 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api) 一致：

- 使用匹配的 Gateway 网关 HTTP 身份验证路径：
  - shared-secret auth（`gateway.auth.mode="token"` 或 `"password"`）：`Authorization: Bearer <token-or-password>`
  - trusted-proxy auth（`gateway.auth.mode="trusted-proxy"`）：来自已配置可信代理源的身份感知代理标头；同主机 local loopback 代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`
  - trusted-proxy 本地直接回退：同主机调用方在没有 `Forwarded`、`X-Forwarded-*` 或 `X-Real-IP` 标头时，可以使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - private-ingress open auth（`gateway.auth.mode="none"`）：无身份验证标头
- 将该端点视为对该 Gateway 网关实例的完整操作员访问权限
- 对于 shared-secret auth 模式（`token` 和 `password`），忽略更窄的 bearer 声明的 `x-openclaw-scopes` 值，并恢复正常的完整操作员默认值
- 对于承载可信身份的 HTTP 模式（例如 trusted proxy auth 或 `gateway.auth.mode="none"`），存在 `x-openclaw-scopes` 时遵循它，否则回退到正常的操作员默认作用域集
- 使用 `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"` 或 `x-openclaw-agent-id` 选择智能体
- 想要覆盖所选智能体的后端模型时，使用 `x-openclaw-model`
- 使用 `x-openclaw-session-key` 进行显式会话路由
- 想要非默认的合成入口渠道上下文时，使用 `x-openclaw-message-channel`

身份验证矩阵：

- `gateway.auth.mode="token"` 或 `"password"` + `Authorization: Bearer ...`
  - 证明持有共享 Gateway 网关操作员密钥
  - 忽略更窄的 `x-openclaw-scopes`
  - 恢复完整的默认操作员作用域集：
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - 将此端点上的聊天轮次视为 owner-sender 轮次
- 承载可信身份的 HTTP 模式（例如 trusted proxy auth，或 private ingress 上的 `gateway.auth.mode="none"`）
  - 当标头存在时遵循 `x-openclaw-scopes`
  - 当标头不存在时回退到正常的操作员默认作用域集
  - 仅当调用方显式缩窄作用域并省略 `operator.admin` 时，才会失去 owner 语义

使用 `gateway.http.endpoints.responses.enabled` 启用或禁用此端点。

同一兼容性表面还包括：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

关于面向智能体的模型、`openclaw/default`、embeddings 透传以及后端模型覆盖如何组合在一起的规范说明，请参阅 [OpenAI Chat Completions](/zh-CN/gateway/openai-http-api#agent-first-model-contract) 和 [模型列表与智能体路由](/zh-CN/gateway/openai-http-api#model-list-and-agent-routing)。

## 会话行为

默认情况下，该端点**按请求无状态**（每次调用都会生成新的会话键）。

如果请求包含 OpenResponses `user` 字符串，Gateway 网关会从中派生稳定的会话键，
因此重复调用可以共享智能体会话。

## 请求形状（支持）

请求遵循 OpenResponses API，使用基于条目的输入。当前支持：

- `input`：字符串或条目对象数组。
- `instructions`：合并到系统提示中。
- `tools`：客户端工具定义（函数工具）。
- `tool_choice`：`"auto"`、`"none"`、`"required"`，或 `{ "type": "function", "name": "..." }`，用于筛选或要求客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力而为的输出限制（取决于提供商）。
- `temperature`：转发给提供商的尽力而为采样温度。基于 ChatGPT 的 Codex Responses 后端会忽略它，该后端使用固定的服务器端采样。
- `top_p`：转发给提供商的尽力而为 nucleus 采样。与 `temperature` 相同，存在 Codex Responses 注意事项。
- `user`：稳定会话路由。

接受但**当前忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

支持：

- `previous_response_id`：当请求保持在同一智能体/用户/请求会话作用域内时，OpenClaw 会复用较早的响应会话。

## 条目（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 会追加到系统提示中。
- 最近的 `user` 或 `function_call_output` 条目会成为“当前消息”。
- 较早的用户/assistant 消息会作为上下文历史包含进来。

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

为 schema 兼容性而接受，但构建提示时会忽略。

## 工具（客户端函数工具）

使用 `tools: [{ type: "function", name, description?, parameters? }]` 提供工具。

如果智能体决定调用工具，响应会返回一个 `function_call` 输出条目。
然后你发送包含 `function_call_output` 的后续请求，以继续该轮次。

对于 `tool_choice: "required"` 和固定到函数的 `tool_choice`，该端点会缩窄暴露的客户端函数工具集，指示运行时在响应前调用客户端工具，并在该轮次不包含匹配的结构化客户端工具调用时拒绝该轮次。此契约适用于调用方提供的 HTTP `tools` 列表，而不是每个 OpenClaw 内部智能体工具。非流式请求返回带有 `api_error` 的 `502`；流式请求会发出 `response.failed` 事件。这与 `/v1/chat/completions` 契约一致。

## 图像（`input_image`）

支持 base64 或 URL 来源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型（当前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大大小（当前）：10MB。

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

允许的 MIME 类型（当前）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

最大大小（当前）：5MB。

当前行为：

- 文件内容会被解码并添加到**系统提示**，而不是用户消息中，
  因此它保持临时性（不会持久化到会话历史中）。
- 解码后的文件文本在添加前会被包装为**不受信任的外部内容**，
  因此文件字节会被视为数据，而不是可信指令。
- 注入的块使用显式边界标记，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含一行
  `Source: External` 元数据。
- 此文件输入路径有意省略较长的 `SECURITY NOTICE:` 横幅，以
  保留提示预算；边界标记和元数据仍会保留。
- PDF 会先解析文本。如果找到的文本很少，首页会被
  栅格化为图像并传递给模型，注入的文件块会使用
  占位符 `[PDF content rendered to images]`。

PDF 解析由内置的 `document-extract` 插件提供，它使用
`clawpdf` 及其打包的 PDFium WebAssembly 运行时进行文本提取和
页面渲染。

URL 获取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每个请求中基于 URL 的 `input_file` + `input_image` 部分总数）
- 请求受到保护（DNS 解析、私有 IP 阻断、重定向上限、超时）。
- 每种输入类型都支持可选的主机名允许列表（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精确主机：`"cdn.example.com"`
  - 通配子域名：`"*.assets.example.com"`（不匹配顶级域）
  - 空的或省略的允许列表表示没有主机名允许列表限制。
- 要完全禁用基于 URL 的获取，请设置 `files.allowUrl: false` 和/或 `images.allowUrl: false`。

## 文件 + 图像限制（配置）

可以在 `gateway.http.endpoints.responses` 下调整默认值：

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
            maxChars: 200000,
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

- `maxBodyBytes`：20MB
- `maxUrlParts`：8
- `files.maxBytes`：5MB
- `files.maxChars`：200k
- `files.maxRedirects`：3
- `files.timeoutMs`：10s
- `files.pdf.maxPages`：4
- `files.pdf.maxPixels`：4,000,000
- `files.pdf.minTextChars`：200
- `images.maxBytes`：10MB
- `images.maxRedirects`：3
- `images.timeoutMs`：10s
- 当系统转换器可用时，会接受 HEIC/HEIF `input_image` 来源，并在交付给提供商之前规范化为 JPEG。支持的转换器包括 macOS `sips`、ImageMagick、GraphicsMagick 或 ffmpeg。

安全说明：

- URL 允许列表会在获取前和重定向跳转时执行。
- 允许列出某个主机名并不会绕过私有/内部 IP 阻断。
- 对于暴露到互联网的 Gateway 网关，除了应用级保护外，还应应用网络出站控制。
  请参阅 [安全](/zh-CN/gateway/security)。

## 流式传输（SSE）

设置 `stream: true` 以接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行是 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型：

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（出错时）

## 用量

当底层提供商报告 token 计数时，会填充 `usage`。
OpenClaw 会在这些计数器到达下游状态/会话表面之前，规范化常见的 OpenAI 风格别名，
包括 `input_tokens` / `output_tokens`
和 `prompt_tokens` / `completion_tokens`。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：

- `401` 缺少/无效身份验证
- `400` 无效请求体
- `405` 方法错误

## 示例

非流式：

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

流式：

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
- [OpenAI](/zh-CN/providers/openai)
