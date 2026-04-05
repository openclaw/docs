---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到由 OpenClaw 支持的渠道
    - 运行 `openclaw mcp serve`
    - 管理 OpenClaw 保存的 MCP 服务器定义
summary: 通过 MCP 暴露 OpenClaw 渠道会话，并管理已保存的 MCP 服务器定义
title: mcp
x-i18n:
    generated_at: "2026-04-05T08:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` 有两个职责：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、
  `set` 和 `unset` 管理由 OpenClaw 持有的出站 MCP 服务器定义

换句话说：

- `serve` 表示 OpenClaw 作为 MCP 服务器运行
- `list` / `show` / `set` / `unset` 表示 OpenClaw 作为其他 MCP 服务器的 MCP 客户端侧
  注册表，这些服务器可能会在其运行时中稍后被使用

当 OpenClaw 应该自行托管一个编码 harness
会话并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/cli/acp)。

## OpenClaw 作为 MCP 服务器

这对应 `openclaw mcp serve` 路径。

## 何时使用 `serve`

在以下情况下使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端应直接与
  由 OpenClaw 支持的渠道会话通信
- 你已经有一个带有已路由会话的本地或远程 OpenClaw Gateway 网关
- 你希望使用一个可跨 OpenClaw 渠道后端工作的 MCP 服务器，
  而不是为每个渠道分别运行桥接

如果 OpenClaw 应该自行托管编码
运行时并将智能体会话保留在 OpenClaw 内部，请改用 [`openclaw acp`](/cli/acp)。

## 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。该
进程由 MCP 客户端持有。只要客户端保持 stdio 会话打开，桥接就会通过 WebSocket 连接到
本地或远程 OpenClaw Gateway 网关，并通过 MCP 暴露已路由的渠道
会话。

生命周期：

1. MCP 客户端启动 `openclaw mcp serve`
2. 桥接连接到 Gateway 网关
3. 已路由会话会变成 MCP 会话以及转录/历史工具
4. 在桥接连接期间，实时事件会在内存中排队
5. 如果启用了 Claude 渠道模式，同一个会话还可以接收
   Claude 专用推送通知

重要行为：

- 实时队列状态从桥接连接开始
- 较旧的转录历史通过 `messages_read` 读取
- Claude 推送通知仅在 MCP 会话存活期间存在
- 当客户端断开连接时，桥接退出，实时队列也会消失

## 选择客户端模式

以两种不同方式使用同一个桥接：

- 通用 MCP 客户端：仅使用标准 MCP 工具。使用 `conversations_list`、
  `messages_read`、`events_poll`、`events_wait`、`messages_send` 以及
  审批工具。
- Claude Code：标准 MCP 工具加上 Claude 专用渠道适配器。
  启用 `--claude-channel-mode on`，或保留默认值 `auto`。

目前，`auto` 的行为与 `on` 相同。尚无客户端能力检测
功能。

## `serve` 暴露了什么

该桥接使用现有 Gateway 网关会话路由元数据来暴露由渠道支持的
会话。当 OpenClaw 已经拥有带有已知路由的会话状态时，会出现一个会话，例如：

- `channel`
- 收件人或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这让 MCP 客户端可以在一个位置完成以下操作：

- 列出最近的已路由会话
- 读取最近的转录历史
- 等待新的入站事件
- 通过相同路由发回回复
- 查看桥接连接期间到达的审批请求

## 用法

```bash
# 本地 Gateway 网关
openclaw mcp serve

# 远程 Gateway 网关
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 使用密码认证的远程 Gateway 网关
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 启用详细桥接日志
openclaw mcp serve --verbose

# 禁用 Claude 专用推送通知
openclaw mcp serve --claude-channel-mode off
```

## 桥接工具

当前桥接暴露以下 MCP 工具：

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

列出最近的、已由会话状态支持且在
Gateway 网关会话状态中已具有路由元数据的会话。

有用的过滤器：

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

通过 `session_key` 返回一个会话。

### `messages_read`

读取一个由会话状态支持的会话中的最近转录消息。

### `attachments_fetch`

从一条转录消息中提取非文本消息内容块。这是一个
针对转录内容的元数据视图，而不是独立的持久化附件 blob
存储。

### `events_poll`

从一个数字游标开始读取已排队的实时事件。

### `events_wait`

长轮询，直到下一个匹配的已排队事件到达或超时。

当通用 MCP 客户端需要近实时交付，而又不使用
Claude 专用推送协议时，请使用它。

### `messages_send`

通过会话中已记录的相同路由发回文本。

当前行为：

- 需要现有的会话路由
- 使用会话的渠道、收件人、账户 id 和线程 id
- 仅发送文本

### `permissions_list_open`

列出桥接自连接到 Gateway 网关以来观察到的待处理 exec/plugin 审批请求。

### `permissions_respond`

以以下方式之一处理一条待处理的 exec/plugin 审批请求：

- `allow-once`
- `allow-always`
- `deny`

## 事件模型

桥接在连接期间会在内存中维护一个事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要限制：

- 队列仅限实时；它从 MCP 桥接启动时开始
- `events_poll` 和 `events_wait` 本身不会重放较旧的 Gateway 网关历史
- 持久化积压内容应通过 `messages_read` 读取

## Claude 渠道通知

桥接还可以暴露 Claude 专用渠道通知。这是
OpenClaw 对应的 Claude Code 渠道适配器：标准 MCP 工具仍然可用，但实时入站消息也可以作为 Claude 专用 MCP 通知到达。

标志：

- `--claude-channel-mode off`：仅标准 MCP 工具
- `--claude-channel-mode on`：启用 Claude 渠道通知
- `--claude-channel-mode auto`：当前默认值；桥接行为与 `on` 相同

启用 Claude 渠道模式时，服务器会声明 Claude 实验性
能力，并可发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站的 `user` 转录消息会被转发为
  `notifications/claude/channel`
- 通过 MCP 接收到的 Claude 权限请求会在内存中跟踪
- 如果关联会话后来发送 `yes abcde` 或 `no abcde`，桥接
  会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅限实时会话；如果 MCP 客户端断开连接，
  就不会有推送目标

这是有意设计为客户端专用的。通用 MCP 客户端应依赖
标准轮询工具。

## MCP 客户端配置

示例 stdio 客户端配置：

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

对于大多数通用 MCP 客户端，建议先从标准工具表面开始，并忽略
Claude 模式。仅当客户端确实理解 Claude 专用通知方法时，再启用 Claude 模式。

## 选项

`openclaw mcp serve` 支持：

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--token-file <path>`：从文件读取令牌
- `--password <password>`：Gateway 网关密码
- `--password-file <path>`：从文件读取密码
- `--claude-channel-mode <auto|on|off>`：Claude 通知模式
- `-v`, `--verbose`：在 stderr 输出详细日志

如果可能，优先使用 `--token-file` 或 `--password-file`，而不是内联密钥。

## 安全性和信任边界

桥接不会自行发明路由。它只会暴露 Gateway 网关
已经知道如何路由的会话。

这意味着：

- 发送者允许列表、配对和渠道级信任仍属于底层
  OpenClaw 渠道配置
- `messages_send` 只能通过已存储的现有路由回复
- 审批状态仅对当前桥接会话实时/内存中可见
- 桥接认证应使用与你愿意信任任何其他远程 Gateway 网关客户端时相同的 Gateway 网关令牌或密码控制

如果某个会话没有出现在 `conversations_list` 中，通常原因并不是
MCP 配置问题，而是底层 Gateway 网关会话中缺少或不完整的路由元数据。

## 测试

OpenClaw 为此桥接提供了一个确定性的 Docker smoke 测试：

```bash
pnpm test:docker:mcp-channels
```

该 smoke 测试会：

- 启动一个已预置数据的 Gateway 网关容器
- 启动第二个容器，并在其中启动 `openclaw mcp serve`
- 验证会话发现、转录读取、附件元数据读取、
  实时事件队列行为以及出站发送路由
- 通过真实的 stdio MCP 桥接验证 Claude 风格的渠道和权限通知

这是在无需接入真实
Telegram、Discord 或 iMessage 账户的情况下，证明桥接可正常工作的最快方式。

如需更广泛的测试背景，请参阅[测试](/help/testing)。

## 故障排除

### 没有返回任何会话

通常表示 Gateway 网关会话尚不可路由。请确认底层
会话已存储渠道/提供商、收件人，以及可选的
账户/线程路由元数据。

### `events_poll` 或 `events_wait` 漏掉较早的消息

这是预期行为。实时队列从桥接连接时开始。较早的转录
历史请通过 `messages_read` 读取。

### Claude 通知未显示

请检查以下所有项：

- 客户端保持了 stdio MCP 会话处于打开状态
- `--claude-channel-mode` 为 `on` 或 `auto`
- 客户端确实理解 Claude 专用通知方法
- 入站消息发生在桥接连接之后

### 审批缺失

`permissions_list_open` 仅显示桥接
连接期间观察到的审批请求。它不是持久化的审批历史 API。

## OpenClaw 作为 MCP 客户端注册表

这对应 `openclaw mcp list`、`show`、`set` 和 `unset` 路径。

这些命令不会通过 MCP 暴露 OpenClaw。它们会管理 OpenClaw
配置中 `mcp.servers` 下由 OpenClaw 持有的 MCP
服务器定义。

这些已保存的定义用于 OpenClaw 稍后启动或配置的运行时，
例如内置 Pi 和其他运行时适配器。OpenClaw 会集中存储这些
定义，这样这些运行时就不需要各自维护重复的
MCP 服务器列表。

重要行为：

- 这些命令只读取或写入 OpenClaw 配置
- 它们不会连接到目标 MCP 服务器
- 它们不会验证命令、URL 或远程传输
  当前是否可达
- 运行时适配器会在
  执行时决定它们实际支持哪些传输形态

## 已保存的 MCP 服务器定义

OpenClaw 还会在配置中存储一个轻量级 MCP 服务器注册表，用于那些
希望使用 OpenClaw 管理的 MCP 定义的表面。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

说明：

- `list` 会对服务器名称排序。
- 不带名称的 `show` 会打印完整的已配置 MCP 服务器对象。
- `set` 要求在命令行上传入一个 JSON 对象值。
- 如果指定名称的服务器不存在，`unset` 会失败。

示例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

示例配置结构：

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio 传输

启动本地子进程，并通过 stdin/stdout 通信。

| Field                      | Description                    |
| -------------------------- | ------------------------------ |
| `command`                  | 要启动的可执行文件（必填）     |
| `args`                     | 命令行参数数组                 |
| `env`                      | 额外环境变量                   |
| `cwd` / `workingDirectory` | 进程的工作目录                 |

### SSE / HTTP 传输

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| Field                 | Description                                |
| --------------------- | ------------------------------------------ |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL（必填）     |
| `headers`             | 可选的 HTTP 请求头键值映射（例如认证令牌） |
| `connectionTimeoutMs` | 每个服务器的连接超时时间（毫秒，可选）     |

示例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（userinfo）和 `headers` 中的敏感值会在日志和
状态输出中被脱敏。

### Streamable HTTP 传输

`streamable-http` 是除 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| Field                 | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL（必填）                                      |
| `transport`           | 设置为 `"streamable-http"` 以选择此传输；省略时，OpenClaw 使用 `sse`        |
| `headers`             | 可选的 HTTP 请求头键值映射（例如认证令牌）                                  |
| `connectionTimeoutMs` | 每个服务器的连接超时时间（毫秒，可选）                                      |

示例：

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

这些命令仅管理已保存的配置。它们不会启动渠道桥接、
打开实时 MCP 客户端会话，或证明目标服务器当前可达。

## 当前限制

本页记录的是当前已发布的桥接能力。

当前限制：

- 会话发现依赖现有的 Gateway 网关会话路由元数据
- 除 Claude 专用适配器外，没有通用推送协议
- 尚无消息编辑或回应工具
- HTTP/SSE/streamable-http 传输连接到单个远程服务器；尚不支持上游多路复用
- `permissions_list_open` 仅包含桥接
  连接期间观察到的审批
