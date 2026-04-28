---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到由 OpenClaw 支持的渠道
    - 正在运行 `openclaw mcp serve`
    - 管理 OpenClaw 保存的 MCP 服务器定义
sidebarTitle: MCP
summary: 通过 MCP 暴露 OpenClaw 渠道对话，并管理已保存的 MCP 服务器定义
title: MCP
x-i18n:
    generated_at: "2026-04-28T11:48:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有两个职责：

- 通过 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、`set` 和 `unset` 管理 OpenClaw 拥有的出站 MCP 服务器定义

换句话说：

- `serve` 是 OpenClaw 作为 MCP 服务器运行
- `list` / `show` / `set` / `unset` 是 OpenClaw 作为 MCP 客户端侧注册表运行，用于其运行时之后可能使用的其他 MCP 服务器

当 OpenClaw 应该自行托管一个编码 harness 会话并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/zh-CN/cli/acp)。

## OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

### 何时使用 `serve`

在以下情况下使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端应直接与 OpenClaw 支持的渠道对话通信
- 你已有一个带路由会话的本地或远程 OpenClaw Gateway 网关
- 你想要一个可跨 OpenClaw 渠道后端工作的 MCP 服务器，而不是运行单独的按渠道桥接器

当 OpenClaw 应该自行托管编码运行时并将智能体会话保留在 OpenClaw 内部时，请改用 [`openclaw acp`](/zh-CN/cli/acp)。

### 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。MCP 客户端拥有该进程。只要客户端保持 stdio 会话打开，桥接器就会通过 WebSocket 连接到本地或远程 OpenClaw Gateway 网关，并通过 MCP 暴露已路由的渠道对话。

<Steps>
  <Step title="客户端生成桥接器">
    MCP 客户端生成 `openclaw mcp serve`。
  </Step>
  <Step title="桥接器连接到 Gateway 网关">
    桥接器通过 WebSocket 连接到 OpenClaw Gateway 网关。
  </Step>
  <Step title="会话变为 MCP 对话">
    已路由的会话变为 MCP 对话以及转录/历史工具。
  </Step>
  <Step title="实时事件队列">
    当桥接器已连接时，实时事件会排入内存队列。
  </Step>
  <Step title="可选 Claude 推送">
    如果启用了 Claude 渠道模式，同一会话也可以接收 Claude 专用推送通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行为">
    - 实时队列状态从桥接器连接时开始
    - 较旧的转录历史通过 `messages_read` 读取
    - Claude 推送通知仅在 MCP 会话存活时存在
    - 当客户端断开连接时，桥接器会退出，实时队列也会消失
    - 一次性智能体入口点，例如 `openclaw agent` 和 `openclaw infer model run`，会在回复完成时停用它们打开的任何内置 MCP 运行时，因此重复的脚本化运行不会累积 stdio MCP 子进程
    - 由 OpenClaw 启动的 stdio MCP 服务器（内置或用户配置）会在关闭时作为进程树被拆除，因此服务器启动的子进程不会在父 stdio 客户端退出后继续存活
    - 删除或重置会话会通过共享运行时清理路径释放该会话的 MCP 客户端，因此不会有与已移除会话绑定的残留 stdio 连接

  </Accordion>
</AccordionGroup>

### 选择客户端模式

以两种不同方式使用同一个桥接器：

<Tabs>
  <Tab title="通用 MCP 客户端">
    仅标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和审批工具。
  </Tab>
  <Tab title="Claude Code">
    标准 MCP 工具加上 Claude 专用渠道适配器。启用 `--claude-channel-mode on`，或保留默认的 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行为与 `on` 相同。尚无客户端能力检测。
</Note>

### `serve` 暴露的内容

桥接器使用现有的 Gateway 网关会话路由元数据来暴露由渠道支持的对话。当 OpenClaw 已有带已知路由的会话状态时，对话会出现，例如：

- `channel`
- 接收方或目标元数据
- 可选 `accountId`
- 可选 `threadId`

这让 MCP 客户端可以在一个位置：

- 列出最近的已路由对话
- 读取最近的转录历史
- 等待新的入站事件
- 通过同一路由发回回复
- 查看桥接器连接期间到达的审批请求

### 用法

<Tabs>
  <Tab title="本地 Gateway 网关">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="远程 Gateway 网关（令牌）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="远程 Gateway 网关（密码）">
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

### 桥接器工具

当前桥接器暴露这些 MCP 工具：

<AccordionGroup>
  <Accordion title="conversations_list">
    列出最近的、已有 Gateway 网关会话状态中的路由元数据的、由会话支持的对话。

    有用的过滤器：

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    按 `session_key` 返回一个对话。
  </Accordion>
  <Accordion title="messages_read">
    读取一个由会话支持的对话的最近转录消息。
  </Accordion>
  <Accordion title="attachments_fetch">
    从一个转录消息中提取非文本消息内容块。这是对转录内容的元数据视图，不是独立的持久附件 blob 存储。
  </Accordion>
  <Accordion title="events_poll">
    读取自数字游标以来排队的实时事件。
  </Accordion>
  <Accordion title="events_wait">
    长轮询，直到下一个匹配的排队事件到达或超时到期。

    当通用 MCP 客户端需要接近实时的投递且不使用 Claude 专用推送协议时，请使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    通过会话上已记录的同一路由发回文本。

    当前行为：

    - 需要现有对话路由
    - 使用会话的渠道、接收方、账号 ID 和线程 ID
    - 仅发送文本

  </Accordion>
  <Accordion title="permissions_list_open">
    列出桥接器连接到 Gateway 网关后观察到的待处理 exec/plugin 审批请求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下选项解析一个待处理 exec/plugin 审批请求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

桥接器在连接期间保留一个内存中的事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 队列仅限实时；它从 MCP 桥接器启动时开始
- `events_poll` 和 `events_wait` 本身不会重放较旧的 Gateway 网关历史
- 持久积压应通过 `messages_read` 读取

</Warning>

### Claude 渠道通知

桥接器也可以暴露 Claude 专用渠道通知。这是 Claude Code 渠道适配器在 OpenClaw 中的等价物：标准 MCP 工具仍然可用，但实时入站消息也可以作为 Claude 专用 MCP 通知到达。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`：仅标准 MCP 工具。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`：启用 Claude 渠道通知。
  </Tab>
  <Tab title="auto（默认）">
    `--claude-channel-mode auto`：当前默认值；桥接器行为与 `on` 相同。
  </Tab>
</Tabs>

启用 Claude 渠道模式后，服务器会声明 Claude 实验性能力，并且可以发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接器行为：

- 入站 `user` 转录消息会作为 `notifications/claude/channel` 转发
- 通过 MCP 收到的 Claude 权限请求会在内存中跟踪
- 如果关联的对话稍后发送 `yes abcde` 或 `no abcde`，桥接器会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅限实时会话；如果 MCP 客户端断开连接，就没有推送目标

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

对于大多数通用 MCP 客户端，请从标准工具表面开始，并忽略 Claude 模式。仅为真正理解 Claude 专用通知方法的客户端开启 Claude 模式。

### 选项

`openclaw mcp serve` 支持：

<ParamField path="--url" type="string">
  Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token" type="string">
  Gateway 网关令牌。
</ParamField>
<ParamField path="--token-file" type="string">
  从文件读取令牌。
</ParamField>
<ParamField path="--password" type="string">
  Gateway 网关密码。
</ParamField>
<ParamField path="--password-file" type="string">
  从文件读取密码。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 通知模式。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  在 stderr 上输出详细日志。
</ParamField>

<Tip>
尽可能优先使用 `--token-file` 或 `--password-file`，而不是内联密钥。
</Tip>

### 安全和信任边界

桥接器不会自行发明路由。它只暴露 Gateway 网关已经知道如何路由的对话。

这意味着：

- 发送方 allowlist、配对以及渠道级信任仍属于底层 OpenClaw 渠道配置
- `messages_send` 只能通过现有存储路由回复
- 审批状态仅对当前桥接器会话实时/内存可用
- 桥接器身份验证应使用你会信任任何其他远程 Gateway 网关客户端使用的同一 Gateway 网关令牌或密码控制

如果某个对话未出现在 `conversations_list` 中，通常原因不是 MCP 配置，而是底层 Gateway 网关会话中的路由元数据缺失或不完整。

### 测试

OpenClaw 为此桥接器提供了确定性的 Docker 冒烟测试：

```bash
pnpm test:docker:mcp-channels
```

该冒烟测试会：

- 启动一个带种子数据的 Gateway 网关容器
- 启动第二个容器并生成 `openclaw mcp serve`
- 验证对话发现、转录读取、附件元数据读取、实时事件队列行为和出站发送路由
- 通过真实的 stdio MCP 桥接器验证 Claude 风格的渠道和权限通知

这是在不把真实 Telegram、Discord 或 iMessage 账号接入测试运行的情况下证明桥接器工作的最快方式。

如需更广泛的测试背景，请参阅 [测试](/zh-CN/help/testing)。

### 故障排除

<AccordionGroup>
  <Accordion title="没有返回对话">
    通常表示 Gateway 网关会话尚不可路由。确认底层会话已存储渠道/提供商、接收方，以及可选账号/线程路由元数据。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 漏掉较旧消息">
    这是预期行为。实时队列从桥接器连接时开始。使用 `messages_read` 读取较旧的转录历史。
  </Accordion>
  <Accordion title="Claude 通知未显示">
    检查以下所有项：

    - 客户端保持 stdio MCP 会话打开
    - `--claude-channel-mode` 为 `on` 或 `auto`
    - 客户端确实理解 Claude 专用通知方法
    - 入站消息发生在桥接器连接之后

  </Accordion>
  <Accordion title="审批缺失">
    `permissions_list_open` 仅显示桥接器连接期间观察到的审批请求。它不是持久审批历史 API。
  </Accordion>
</AccordionGroup>

## OpenClaw 作为 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`set` 和 `unset` 路径。

这些命令不会通过 MCP 暴露 OpenClaw。它们管理 OpenClaw 配置中 `mcp.servers` 下由 OpenClaw 拥有的 MCP 服务器定义。

这些已保存的定义供 OpenClaw 后续启动或配置的运行时使用，例如嵌入式 Pi 和其他运行时适配器。OpenClaw 会集中存储这些定义，因此这些运行时不需要维护自己的重复 MCP 服务器列表。

<AccordionGroup>
  <Accordion title="Important behavior">
    - 这些命令只读取或写入 OpenClaw 配置
    - 它们不会连接到目标 MCP 服务器
    - 它们不会验证命令、URL 或远程传输协议当前是否可达
    - 运行时适配器会在执行时决定它们实际支持哪些传输形态
    - 嵌入式 Pi 会在普通 `coding` 和 `messaging` 工具配置文件中暴露已配置的 MCP 工具；`minimal` 仍会隐藏它们，而 `tools.deny: ["bundle-mcp"]` 会显式禁用它们
    - 会话范围的内置 MCP 运行时会在空闲 `mcp.sessionIdleTtlMs` 毫秒后被回收（默认 10 分钟；设为 `0` 可禁用），一次性嵌入式运行会在运行结束时清理它们

  </Accordion>
</AccordionGroup>

运行时适配器可以将这个共享注册表规范化为其下游客户端期望的形状。例如，嵌入式 Pi 会直接使用 OpenClaw 的 `transport` 值，而 Claude Code 和 Gemini 会接收 CLI 原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

### 已保存的 MCP 服务器定义

OpenClaw 还会在配置中存储一个轻量级 MCP 服务器注册表，供需要 OpenClaw 托管 MCP 定义的界面使用。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

说明：

- `list` 会按服务器名称排序。
- 不带名称的 `show` 会打印完整的已配置 MCP 服务器对象。
- `set` 期望命令行上有一个 JSON 对象值。
- 对于 Streamable HTTP MCP 服务器，请使用 `transport: "streamable-http"`。为兼容起见，`openclaw mcp set` 也会将 CLI 原生的 `type: "http"` 规范化为同一个规范配置形状。
- 如果指定名称的服务器不存在，`unset` 会失败。

示例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

示例配置形状：

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio 传输协议

启动本地子进程，并通过 stdin/stdout 通信。

| 字段                       | 描述                         |
| -------------------------- | ---------------------------- |
| `command`                  | 要启动的可执行文件（必填）   |
| `args`                     | 命令行参数数组               |
| `env`                      | 额外环境变量                 |
| `cwd` / `workingDirectory` | 进程的工作目录               |

<Warning>
**Stdio 环境变量安全过滤器**

OpenClaw 会拒绝可能在第一次 RPC 之前改变 stdio MCP 服务器启动方式的解释器启动环境变量键名，即使它们出现在服务器的 `env` 块中。被阻止的键名包括 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4` 以及类似的运行时控制变量。启动会以配置错误拒绝这些键名，避免它们注入隐式前置脚本、替换解释器，或对 stdio 进程启用调试器。普通凭据、代理和服务器专用环境变量（`GITHUB_TOKEN`、`HTTP_PROXY`、自定义 `*_API_KEY` 等）不受影响。

如果你的 MCP 服务器确实需要其中一个被阻止的变量，请在 Gateway 网关主机进程上设置它，而不是放在 stdio 服务器的 `env` 下。
</Warning>

### SSE / HTTP 传输协议

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| 字段                  | 描述                                                   |
| --------------------- | ------------------------------------------------------ |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL（必填）                 |
| `headers`             | 可选的 HTTP 标头键值映射（例如身份验证令牌）           |
| `connectionTimeoutMs` | 每个服务器的连接超时时间，单位为毫秒（可选）           |

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

`url`（userinfo）和 `headers` 中的敏感值会在日志和 Status 输出中被脱敏。

### Streamable HTTP 传输协议

`streamable-http` 是与 `sse` 和 `stdio` 并列的额外传输协议选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| 字段                  | 描述                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | 远程服务器的 HTTP 或 HTTPS URL（必填）                                               |
| `transport`           | 设为 `"streamable-http"` 以选择此传输协议；省略时，OpenClaw 使用 `sse`              |
| `headers`             | 可选的 HTTP 标头键值映射（例如身份验证令牌）                                         |
| `connectionTimeoutMs` | 每个服务器的连接超时时间，单位为毫秒（可选）                                         |

OpenClaw 配置使用 `transport: "streamable-http"` 作为规范写法。通过 `openclaw mcp set` 保存时会接受 CLI 原生 MCP `type: "http"` 值，并且现有配置中可由 `openclaw doctor --fix` 修复，但嵌入式 Pi 会直接使用 `transport`。

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
这些命令只管理已保存的配置。它们不会启动渠道桥接、打开实时 MCP 客户端会话，或证明目标服务器可达。
</Note>

## 当前限制

此页面记录的是当前已发布的桥接。

当前限制：

- 对话发现依赖现有 Gateway 网关会话路由元数据
- 除 Claude 专用适配器之外，没有通用推送协议
- 还没有消息编辑或回应工具
- HTTP/SSE/streamable-http 传输协议会连接到单个远程服务器；尚不支持多路复用上游
- `permissions_list_open` 仅包含桥接连接期间观察到的批准

## 相关

- [CLI 参考](/zh-CN/cli)
- [插件](/zh-CN/cli/plugins)
