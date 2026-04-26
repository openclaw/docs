---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到由 OpenClaw 支持的渠道
    - 运行 `openclaw mcp serve`
    - 管理 OpenClaw 保存的 MCP 服务器定义
sidebarTitle: MCP
summary: 通过 MCP 暴露 OpenClaw 渠道会话并管理已保存的 MCP 服务器定义
title: MCP
x-i18n:
    generated_at: "2026-04-26T07:11:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` 有两项职责：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、`set` 和 `unset` 管理由 OpenClaw 拥有的出站 MCP 服务器定义

换句话说：

- `serve` 表示 OpenClaw 充当 MCP 服务器
- `list` / `show` / `set` / `unset` 表示 OpenClaw 充当面向其他 MCP 服务器的 MCP 客户端侧注册表，供其运行时稍后使用

当 OpenClaw 应自行托管一个编码 harness 会话并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/zh-CN/cli/acp)。

## OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

### 何时使用 `serve`

在以下情况下使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端需要直接与由 OpenClaw 支持的渠道会话通信
- 你已经有一个本地或远程的 OpenClaw Gateway 网关，并且已有已路由的会话
- 你希望使用一个可跨 OpenClaw 渠道后端工作的 MCP 服务器，而不是为每个渠道分别运行桥接器

当 OpenClaw 应自行托管编码运行时并将智能体会话保留在 OpenClaw 内部时，请改用 [`openclaw acp`](/zh-CN/cli/acp)。

### 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。该进程由 MCP 客户端持有。只要客户端保持 stdio 会话开启，桥接器就会通过 WebSocket 连接到本地或远程的 OpenClaw Gateway 网关，并通过 MCP 暴露已路由的渠道会话。

<Steps>
  <Step title="客户端启动桥接器">
    MCP 客户端会启动 `openclaw mcp serve`。
  </Step>
  <Step title="桥接器连接到 Gateway 网关">
    桥接器通过 WebSocket 连接到 OpenClaw Gateway 网关。
  </Step>
  <Step title="会话变为 MCP 会话">
    已路由的会话会变成 MCP 会话以及 transcript/history 工具。
  </Step>
  <Step title="实时事件排队">
    当桥接器保持连接时，实时事件会在内存中排队。
  </Step>
  <Step title="可选的 Claude 推送">
    如果启用了 Claude 渠道模式，同一个会话还可以接收 Claude 专用的推送通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行为">
    - 实时队列状态会在桥接器连接时开始
    - 更早的 transcript 历史记录通过 `messages_read` 读取
    - Claude 推送通知仅在 MCP 会话存活期间存在
    - 当客户端断开连接时，桥接器会退出，实时队列也会消失
    - 像 `openclaw agent` 和 `openclaw infer model run` 这样的单次智能体入口点，会在回复完成后关闭它们打开的任何内置 MCP 运行时，因此重复的脚本运行不会累积 stdio MCP 子进程
    - 由 OpenClaw 启动的 stdio MCP 服务器（内置或用户配置）会在关闭时按进程树清理，因此服务器启动的子进程在父 stdio 客户端退出后不会继续存活
    - 删除或重置会话会通过共享运行时清理路径释放该会话的 MCP 客户端，因此不会有与已移除会话绑定的残留 stdio 连接
  </Accordion>
</AccordionGroup>

### 选择客户端模式

可以用两种不同方式使用同一个桥接器：

<Tabs>
  <Tab title="通用 MCP 客户端">
    仅使用标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和审批工具。
  </Tab>
  <Tab title="Claude Code">
    标准 MCP 工具加上 Claude 专用渠道适配器。启用 `--claude-channel-mode on`，或保留默认值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行为与 `on` 相同。尚未实现客户端能力检测。
</Note>

### `serve` 暴露的内容

桥接器使用现有的 Gateway 网关会话路由元数据来暴露由渠道支持的会话。当 OpenClaw 已经拥有带有已知路由的会话状态时，会出现一个会话，例如：

- `channel`
- 收件人或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这让 MCP 客户端可以在同一个地方：

- 列出最近的已路由会话
- 读取最近的 transcript 历史记录
- 等待新的入站事件
- 通过同一路由发送回复
- 查看桥接器连接期间到达的审批请求

### 用法

<Tabs>
  <Tab title="本地 Gateway 网关">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="远程 Gateway 网关（token）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="远程 Gateway 网关（password）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="详细日志 / 关闭 Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 桥接工具

当前桥接器暴露以下 MCP 工具：

<AccordionGroup>
  <Accordion title="conversations_list">
    列出最近的、基于会话的会话，这些会话在 Gateway 网关会话状态中已具有路由元数据。

    常用筛选项：

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    通过 `session_key` 返回一个会话。
  </Accordion>
  <Accordion title="messages_read">
    读取一个基于会话的会话中的最近 transcript 消息。
  </Accordion>
  <Accordion title="attachments_fetch">
    从一条 transcript 消息中提取非文本消息内容块。这是针对 transcript 内容的元数据视图，不是独立的持久化附件 blob 存储。
  </Accordion>
  <Accordion title="events_poll">
    从数字游标开始读取已排队的实时事件。
  </Accordion>
  <Accordion title="events_wait">
    长轮询，直到下一个匹配的已排队事件到达，或者超时到期。

    当通用 MCP 客户端需要近实时传递、但没有 Claude 专用推送协议时，请使用它。

  </Accordion>
  <Accordion title="messages_send">
    通过会话上已记录的同一路由回发文本。

    当前行为：

    - 需要现有的会话路由
    - 使用会话的渠道、收件人、账户 id 和线程 id
    - 仅发送文本

  </Accordion>
  <Accordion title="permissions_list_open">
    列出桥接器自连接到 Gateway 网关以来观察到的待处理 exec/plugin 审批请求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下选项之一解决一个待处理的 exec/plugin 审批请求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

桥接器在连接期间会在内存中保留一个事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 队列仅用于实时事件；它会在 MCP 桥接器启动时开始
- `events_poll` 和 `events_wait` 本身不会重放更早的 Gateway 网关历史记录
- 持久化积压消息应通过 `messages_read` 读取
</Warning>

### Claude 渠道通知

桥接器还可以暴露 Claude 专用的渠道通知。这是 OpenClaw 对 Claude Code 渠道适配器的等价实现：标准 MCP 工具仍然可用，但实时入站消息也可以作为 Claude 专用 MCP 通知到达。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`：仅标准 MCP 工具。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`：启用 Claude 渠道通知。
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`：当前默认值；桥接行为与 `on` 相同。
  </Tab>
</Tabs>

启用 Claude 渠道模式后，服务器会声明 Claude 实验性能力，并可发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站的 `user` transcript 消息会被转发为 `notifications/claude/channel`
- 通过 MCP 接收到的 Claude 权限请求会在内存中跟踪
- 如果关联会话之后发送 `yes abcde` 或 `no abcde`，桥接器会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅存在于实时会话中；如果 MCP 客户端断开连接，就没有可推送的目标

这是有意设计为客户端专用的。通用 MCP 客户端应依赖标准轮询工具。

### MCP 客户端配置

stdio 客户端配置示例：

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

对于大多数通用 MCP 客户端，先从标准工具接口开始，并忽略 Claude 模式。只有在客户端确实理解 Claude 专用通知方法时，才开启 Claude 模式。

### 选项

`openclaw mcp serve` 支持：

<ParamField path="--url" type="string">
  Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token" type="string">
  Gateway 网关 token。
</ParamField>
<ParamField path="--token-file" type="string">
  从文件读取 token。
</ParamField>
<ParamField path="--password" type="string">
  Gateway 网关 password。
</ParamField>
<ParamField path="--password-file" type="string">
  从文件读取 password。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 通知模式。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  在 stderr 输出详细日志。
</ParamField>

<Tip>
如果可能，优先使用 `--token-file` 或 `--password-file`，而不是内联密钥。
</Tip>

### 安全性与信任边界

桥接器不会发明路由。它只会暴露 Gateway 网关已经知道如何路由的会话。

这意味着：

- 发送方允许列表、配对和渠道级信任仍归属于底层 OpenClaw 渠道配置
- `messages_send` 只能通过现有的已存储路由进行回复
- 审批状态仅对当前桥接会话实时存在于内存中
- 桥接认证应使用与你信任任何其他远程 Gateway 网关客户端时相同的 Gateway 网关 token 或 password 控制

如果某个会话没有出现在 `conversations_list` 中，通常原因不是 MCP 配置，而是底层 Gateway 网关会话中缺少路由元数据，或者该元数据不完整。

### 测试

OpenClaw 为该桥接器提供了一个确定性的 Docker smoke 测试：

```bash
pnpm test:docker:mcp-channels
```

该 smoke 测试会：

- 启动一个带种子数据的 Gateway 网关容器
- 启动第二个容器，并在其中启动 `openclaw mcp serve`
- 验证会话发现、transcript 读取、附件元数据读取、实时事件队列行为以及出站发送路由
- 通过真实的 stdio MCP 桥接验证 Claude 风格的渠道通知和权限通知

这是在不将真实 Telegram、Discord 或 iMessage 账户接入测试运行的情况下，证明桥接器正常工作的最快方式。

有关更广泛的测试背景，请参见[测试](/zh-CN/help/testing)。

### 故障排除

<AccordionGroup>
  <Accordion title="没有返回任何会话">
    这通常意味着 Gateway 网关会话本身还不可路由。请确认底层会话已存储渠道/提供商、收件人，以及可选的账户/线程路由元数据。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 漏掉较早的消息">
    这是预期行为。实时队列从桥接器连接时开始。请使用 `messages_read` 读取更早的 transcript 历史记录。
  </Accordion>
  <Accordion title="Claude 通知没有显示">
    请检查以下所有事项：

    - 客户端保持了 stdio MCP 会话开启
    - `--claude-channel-mode` 为 `on` 或 `auto`
    - 客户端确实理解 Claude 专用通知方法
    - 入站消息发生在桥接器连接之后

  </Accordion>
  <Accordion title="审批缺失">
    `permissions_list_open` 只显示桥接器连接期间观察到的审批请求。它不是持久化的审批历史 API。
  </Accordion>
</AccordionGroup>

## OpenClaw 作为 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`set` 和 `unset` 路径。

这些命令不会通过 MCP 暴露 OpenClaw。它们用于管理 OpenClaw 配置中 `mcp.servers` 下由 OpenClaw 拥有的 MCP 服务器定义。

这些已保存的定义供 OpenClaw 稍后启动或配置的运行时使用，例如嵌入式 Pi 和其他运行时适配器。OpenClaw 会集中存储这些定义，这样这些运行时就不需要各自维护重复的 MCP 服务器列表。

<AccordionGroup>
  <Accordion title="重要行为">
    - 这些命令只会读取或写入 OpenClaw 配置
    - 它们不会连接到目标 MCP 服务器
    - 它们不会验证命令、URL 或远程传输当前是否可达
    - 运行时适配器会在执行时决定它们实际支持哪些传输形式
    - 嵌入式 Pi 会在常规 `coding` 和 `messaging` 工具配置中暴露已配置的 MCP 工具；`minimal` 仍会隐藏它们，而 `tools.deny: ["bundle-mcp"]` 会显式禁用它们
    - 会话范围的内置 MCP 运行时会在空闲 `mcp.sessionIdleTtlMs` 毫秒后被回收（默认 10 分钟；设为 `0` 可禁用），而单次嵌入式运行会在运行结束时清理它们
  </Accordion>
</AccordionGroup>

运行时适配器可能会将这个共享注册表规范化为其下游客户端所期望的形式。例如，嵌入式 Pi 直接使用 OpenClaw 的 `transport` 值，而 Claude Code 和 Gemini 则接收 CLI 原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

### 已保存的 MCP 服务器定义

OpenClaw 还会在配置中存储一个轻量级的 MCP 服务器注册表，供希望使用 OpenClaw 管理的 MCP 定义的界面使用。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

说明：

- `list` 会对服务器名称排序。
- 不带名称的 `show` 会打印完整的已配置 MCP 服务器对象。
- `set` 期望在命令行上接收一个 JSON 对象值。
- 如果指定名称的服务器不存在，`unset` 会失败。

示例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

示例配置形式：

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

启动一个本地子进程，并通过 stdin/stdout 进行通信。

| Field                      | 描述                          |
| -------------------------- | ----------------------------- |
| `command`                  | 要启动的可执行文件（必填）    |
| `args`                     | 命令行参数数组                |
| `env`                      | 额外的环境变量                |
| `cwd` / `workingDirectory` | 进程的工作目录                |

<Warning>
**Stdio 环境变量安全过滤器**

OpenClaw 会拒绝那些可能在第一次 RPC 之前改变 stdio MCP 服务器启动方式的解释器启动环境变量键，即使它们出现在服务器的 `env` 块中也是如此。被拦截的键包括 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4` 以及类似的运行时控制变量。启动时会因配置错误而拒绝这些键，从而防止它们注入隐式前导代码、替换解释器或对 stdio 进程启用调试器。普通的凭证、代理和服务器专用环境变量（`GITHUB_TOKEN`、`HTTP_PROXY`、自定义 `*_API_KEY` 等）不受影响。

如果你的 MCP 服务器确实需要其中某个被拦截的变量，请将其设置在 Gateway 网关宿主进程上，而不是设置在 stdio 服务器的 `env` 下。
</Warning>

### SSE / HTTP 传输

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| Field                 | 描述                                                   |
| --------------------- | ------------------------------------------------------ |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL（必填）                 |
| `headers`             | 可选的 HTTP 标头键值映射（例如认证 token）             |
| `connectionTimeoutMs` | 每个服务器的连接超时时间（毫秒，可选）                 |

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

`url` 中的敏感值（userinfo）和 `headers` 会在日志和状态输出中被脱敏。

### Streamable HTTP 传输

`streamable-http` 是除 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| Field                 | 描述                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL（必填）                                                 |
| `transport`           | 设为 `"streamable-http"` 以选择此传输；省略时，OpenClaw 会使用 `sse`                  |
| `headers`             | 可选的 HTTP 标头键值映射（例如认证 token）                                             |
| `connectionTimeoutMs` | 每个服务器的连接超时时间（毫秒，可选）                                                 |

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

<Note>
这些命令只管理已保存的配置。它们不会启动渠道桥接器、打开实时 MCP 客户端会话，也不能证明目标服务器可达。
</Note>

## 当前限制

本页记录的是当前已发布桥接器的行为。

当前限制：

- 会话发现依赖于现有的 Gateway 网关会话路由元数据
- 除 Claude 专用适配器外，尚无通用推送协议
- 目前还没有消息编辑或回应工具
- HTTP/SSE/streamable-http 传输连接到单个远程服务器；尚不支持多路复用上游
- `permissions_list_open` 只包含桥接器连接期间观察到的审批

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [插件](/zh-CN/cli/plugins)
