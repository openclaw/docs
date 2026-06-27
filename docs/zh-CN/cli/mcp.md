---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到 OpenClaw 支持的渠道
    - 正在运行 `openclaw mcp serve`
    - 管理 OpenClaw 保存的 MCP 服务器定义
sidebarTitle: MCP
summary: 通过 MCP 暴露 OpenClaw 渠道对话，并管理已保存的 MCP 服务器定义
title: MCP
x-i18n:
    generated_at: "2026-06-27T01:38:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有两个职责：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 管理由 OpenClaw 管理的出站 MCP 服务器定义

换句话说：

- `serve` 是 OpenClaw 作为 MCP 服务器运行
- 其他子命令是 OpenClaw 作为 MCP 服务器的 MCP 客户端侧注册表运行，供它的运行时之后使用

<Note>
  `list`、`show`、`set` 和 `unset` 只读取和写入 OpenClaw 配置中由 OpenClaw 管理的 `mcp.servers` 条目。它们不包含来自 `config/mcporter.json` 的 mcporter 服务器；请使用 `mcporter list` 查看该注册表。
</Note>

当 OpenClaw 应自行托管编码 harness 会话并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/zh-CN/cli/acp)。

## 选择正确的 MCP 路径

OpenClaw 有多个 MCP 表面。请选择与智能体运行时所有者和工具所有者匹配的路径。

| 目标                                                                | 使用                                                                  | 原因                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 让外部 MCP 客户端读取/发送 OpenClaw 渠道对话 | `openclaw mcp serve`                                                 | OpenClaw 是 MCP 服务器，并通过 stdio 暴露由 Gateway 网关支持的对话。                                 |
| 为 OpenClaw 管理的智能体运行保存第三方 MCP 服务器        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw 是 MCP 客户端侧注册表，之后会把这些服务器投射到符合条件的运行时中。               |
| 不运行智能体轮次就检查已保存的服务器                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` 和 `doctor` 检查配置；`probe` 打开实时 MCP 连接并列出能力。               |
| 从浏览器编辑 MCP 配置                                      | Control UI `/mcp`                                                    | 该页面显示清单、启用状态、OAuth/过滤器摘要、命令提示，以及限定范围的 `mcp` 编辑器。         |
| 给 Codex app-server 一个限定范围的原生 MCP 服务器                    | `mcp.servers.<name>.codex`                                           | `codex` 块只影响 Codex app-server 线程投射，并会在原生配置交接前被剥离。 |
| 运行由 ACP 托管的 harness 会话                                     | [`openclaw acp`](/zh-CN/cli/acp) 和 [ACP 智能体](/zh-CN/tools/acp-agents-setup) | ACP 桥接模式不接受按会话注入 MCP 服务器；请改为配置 gateway/plugin 桥接。     |

<Tip>
如果你不确定需要哪条路径，请从 `openclaw mcp status --verbose` 开始。它会显示 OpenClaw 已保存的内容，而不会启动任何 MCP 服务器。
</Tip>

## OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

### 何时使用 `serve`

在以下情况使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端应直接与由 OpenClaw 支持的渠道对话通信
- 你已经有一个带有已路由会话的本地或远程 OpenClaw Gateway 网关
- 你想要一个可跨 OpenClaw 渠道后端工作的 MCP 服务器，而不是运行单独的按渠道桥接

当 OpenClaw 应自行托管编码运行时并将智能体会话保留在 OpenClaw 内部时，请改用 [`openclaw acp`](/zh-CN/cli/acp)。

### 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。MCP 客户端拥有该进程。当客户端保持 stdio 会话打开时，桥接会通过 WebSocket 连接到本地或远程 OpenClaw Gateway 网关，并通过 MCP 暴露已路由的渠道对话。

<Steps>
  <Step title="客户端生成桥接">
    MCP 客户端生成 `openclaw mcp serve`。
  </Step>
  <Step title="桥接连接到 Gateway 网关">
    桥接通过 WebSocket 连接到 OpenClaw Gateway 网关。
  </Step>
  <Step title="会话变为 MCP 对话">
    已路由的会话会变为 MCP 对话和转录/历史工具。
  </Step>
  <Step title="实时事件队列">
    桥接连接期间，实时事件会在内存中排队。
  </Step>
  <Step title="可选 Claude 推送">
    如果启用 Claude 渠道模式，同一个会话也可以接收 Claude 专用推送通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行为">
    - 实时队列状态在桥接连接时开始
    - 使用 `messages_read` 读取较早的转录历史
    - Claude 推送通知只在 MCP 会话存活时存在
    - 客户端断开连接时，桥接会退出，实时队列也会消失
    - `openclaw agent` 和 `openclaw infer model run` 等一次性智能体入口点会在回复完成时回收它们打开的任何内置 MCP 运行时，因此重复的脚本运行不会累积 stdio MCP 子进程
    - OpenClaw 启动的 stdio MCP 服务器（内置或用户配置）会在关闭时作为进程树被拆除，因此服务器启动的子子进程不会在父 stdio 客户端退出后继续存活
    - 删除或重置会话会通过共享运行时清理路径释放该会话的 MCP 客户端，因此不会留下绑定到已移除会话的 stdio 连接

  </Accordion>
</AccordionGroup>

### 选择客户端模式

以两种不同方式使用同一个桥接：

<Tabs>
  <Tab title="通用 MCP 客户端">
    仅使用标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和审批工具。
  </Tab>
  <Tab title="Claude Code">
    标准 MCP 工具加上 Claude 专用渠道适配器。启用 `--claude-channel-mode on`，或保留默认值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行为与 `on` 相同。尚无客户端能力检测。
</Note>

### `serve` 暴露的内容

桥接使用现有 Gateway 网关会话路由元数据来暴露由渠道支持的对话。当 OpenClaw 已有带有已知路由的会话状态时，会出现一个对话，例如：

- `channel`
- 接收方或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这为 MCP 客户端提供了一个位置，用于：

- 列出最近已路由的对话
- 读取最近的转录历史
- 等待新的入站事件
- 通过同一路由发回回复
- 查看桥接连接期间到达的审批请求

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
  <Tab title="详细输出 / 关闭 Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 桥接工具

当前桥接暴露这些 MCP 工具：

<AccordionGroup>
  <Accordion title="conversations_list">
    列出最近的、由会话支持且 Gateway 网关会话状态中已有路由元数据的对话。

    有用的过滤器：

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    使用直接 Gateway 网关会话查找，按 `session_key` 返回一个对话。
  </Accordion>
  <Accordion title="messages_read">
    读取一个由会话支持的对话的最近转录消息。
  </Accordion>
  <Accordion title="attachments_fetch">
    从一个转录消息中提取非文本消息内容块。这是转录内容上的元数据视图，不是独立的持久附件 blob 存储。
  </Accordion>
  <Accordion title="events_poll">
    读取自某个数字游标以来排队的实时事件。
  </Accordion>
  <Accordion title="events_wait">
    长轮询，直到下一个匹配的排队事件到达或超时过期。

    当通用 MCP 客户端需要近实时投递且不使用 Claude 专用推送协议时，请使用它。

  </Accordion>
  <Accordion title="messages_send">
    通过会话上已记录的同一路由发回文本。

    当前行为：

    - 需要现有对话路由
    - 使用会话的渠道、接收方、账户 id 和线程 id
    - 仅发送文本

  </Accordion>
  <Accordion title="permissions_list_open">
    列出桥接连接到 Gateway 网关后观察到的待处理 exec/plugin 审批请求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下值解决一个待处理的 exec/plugin 审批请求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

桥接在连接期间保留一个内存事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 队列仅限实时；它在 MCP 桥接启动时开始
- `events_poll` 和 `events_wait` 本身不会重放较早的 Gateway 网关历史
- 持久积压应使用 `messages_read` 读取

</Warning>

### Claude 渠道通知

桥接也可以暴露 Claude 专用渠道通知。这相当于 OpenClaw 中的 Claude Code 渠道适配器：标准 MCP 工具仍然可用，但实时入站消息也可以作为 Claude 专用 MCP 通知到达。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`：仅使用标准 MCP 工具。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`：启用 Claude 渠道通知。
  </Tab>
  <Tab title="auto（默认）">
    `--claude-channel-mode auto`：当前默认值；桥接行为与 `on` 相同。
  </Tab>
</Tabs>

启用 Claude 渠道模式时，服务器会通告 Claude 实验能力，并可以发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站 `user` 转录消息会作为 `notifications/claude/channel` 转发
- 通过 MCP 收到的 Claude 权限请求会在内存中跟踪
- 如果关联的对话之后发送 `yes abcde` 或 `no abcde`，桥接会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅限实时会话；如果 MCP 客户端断开连接，则没有推送目标

这是有意针对特定客户端的。通用 MCP 客户端应依赖标准轮询工具。

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

对于大多数通用 MCP 客户端，请从标准工具表面开始，并忽略 Claude 模式。仅对真正理解 Claude 专用通知方法的客户端开启 Claude 模式。

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

这个桥接器不会发明路由。它只公开 Gateway 网关已经知道如何路由的会话。

这意味着：

- 发送者允许列表、配对和渠道级信任仍属于底层 OpenClaw 频道配置
- `messages_send` 只能通过已有的已存储路由回复
- 审批状态仅对当前桥接器会话实时保存在内存中
- 桥接器认证应使用你会信任给任何其他远程 Gateway 网关客户端的相同 Gateway 网关令牌或密码控制

如果 `conversations_list` 中缺少某个会话，通常原因不是 MCP 配置，而是底层 Gateway 网关会话中缺少或不完整的路由元数据。

### 测试

OpenClaw 为这个桥接器提供一个确定性的 Docker 冒烟测试：

```bash
pnpm test:docker:mcp-channels
```

这个冒烟测试会：

- 启动一个已植入数据的 Gateway 网关容器
- 启动第二个容器，并在其中生成 `openclaw mcp serve`
- 验证会话设备发现、转录读取、附件元数据读取、实时事件队列行为以及出站发送路由
- 通过真实的 stdio MCP 桥接器验证 Claude 风格的渠道和权限通知

这是在不把真实 Telegram、Discord 或 iMessage 账号接入测试运行的情况下，证明桥接器可工作的最快方式。

有关更广泛的测试背景，请参阅 [测试](/zh-CN/help/testing)。

### 故障排除

<AccordionGroup>
  <Accordion title="No conversations returned">
    通常表示 Gateway 网关会话尚不可路由。确认底层会话已存储渠道/提供商、接收者，以及可选的账号/线程路由元数据。
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    这是预期行为。实时队列在桥接器连接时开始。使用 `messages_read` 读取更早的转录历史。
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    检查以下所有事项：

    - 客户端保持 stdio MCP 会话打开
    - `--claude-channel-mode` 为 `on` 或 `auto`
    - 客户端实际理解 Claude 专用通知方法
    - 入站消息发生在桥接器连接之后

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` 只显示桥接器已连接期间观察到的审批请求。它不是持久的审批历史 API。
  </Accordion>
</AccordionGroup>

## OpenClaw 作为 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 路径。

这些命令不会通过 MCP 公开 OpenClaw。它们管理 OpenClaw 配置中 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器定义。它们不会从 `config/mcporter.json` 读取 mcporter 服务器。

这些已保存的定义供 OpenClaw 稍后启动或配置的运行时使用，例如嵌入式 OpenClaw 和其他运行时适配器。OpenClaw 集中存储这些定义，因此这些运行时不需要维护自己的重复 MCP 服务器列表。

<AccordionGroup>
  <Accordion title="Important behavior">
    - 这些命令只读取或写入 OpenClaw 配置
    - 没有 `--probe` 的 `status`、`list`、`show`、`doctor`，以及 `set`、`configure`、`tools`、`logout`、`reload` 和 `unset` 不会连接目标 MCP 服务器
    - `login` 会为已配置的 HTTP 服务器执行 MCP OAuth 网络流程，并保存生成的本地凭证
    - `status --verbose` 会在不连接的情况下打印解析后的传输、认证、超时、过滤器和并行工具调用提示
    - `doctor` 会检查已保存定义中的本地设置问题，例如缺少 stdio 命令、无效工作目录、缺少 TLS 文件、已禁用的服务器、字面量敏感标头/环境值，以及不完整的 OAuth 授权
    - `doctor --probe` 会在静态检查通过后，添加与 `probe` 相同的实时连接证明
    - `probe` 会连接所选服务器或所有已配置服务器，列出工具，并报告能力/诊断
    - `add` 会从标志构建定义，并在保存前探测，除非已设置 `--no-probe` 或必须先完成 OAuth 授权
    - 运行时适配器会在执行时决定它们实际支持哪些传输形态
    - `enabled: false` 会保留服务器，但将其排除在嵌入式运行时设备发现之外
    - `timeout` 和 `connectTimeout` 以秒为单位设置每台服务器的请求和连接超时
    - `supportsParallelToolCalls: true` 标记适配器可以并发调用的服务器
    - HTTP 服务器可以使用静态标头、OAuth 登录、TLS 验证控制以及 mTLS 证书/密钥路径
    - 嵌入式 OpenClaw 会在普通 `coding` 和 `messaging` 工具配置文件中公开已配置的 MCP 工具；`minimal` 仍会隐藏它们，而 `tools.deny: ["bundle-mcp"]` 会显式禁用它们
    - 每台服务器的 `toolFilter.include` 和 `toolFilter.exclude` 会在发现的 MCP 工具成为 OpenClaw 工具之前过滤它们
    - 公告资源或提示词的服务器也会公开用于列出/读取资源以及列出/获取提示词的实用工具；这些生成的实用工具名称（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）使用相同的 include/exclude 过滤器
    - 动态 MCP 工具列表变更会使该会话的缓存目录失效；下一次发现/使用会从服务器刷新
    - 重复的 MCP 工具请求/协议失败会短暂暂停该服务器，避免一个损坏的服务器消耗整个轮次
    - 会话范围内的内置 MCP 运行时会在空闲 `mcp.sessionIdleTtlMs` 毫秒后被回收（默认 10 分钟；设置为 `0` 可禁用），一次性嵌入式运行会在运行结束时清理它们

  </Accordion>
</AccordionGroup>

运行时适配器可以将这个共享注册表规范化为其下游客户端期望的形态。例如，嵌入式 OpenClaw 直接消费 OpenClaw `transport` 值，而 Claude Code 和 Gemini 会收到 CLI 原生 `type` 值，例如 `http`、`sse` 或 `stdio`。

Codex app-server 还会遵循每个服务器上可选的 `codex` 块。这仅是 Codex app-server 线程的 OpenClaw 投影元数据；它不会更改 ACP 会话、通用 Codex harness 配置或其他运行时适配器。使用非空 `codex.agents` 可仅将服务器投影到特定 OpenClaw 智能体 ID。空、空白或无效的智能体列表会被配置验证拒绝，并由运行时投影路径省略，而不会变成全局配置。使用 `codex.defaultToolsApprovalMode`（`auto`、`prompt` 或 `approve`）可为受信任服务器发出 Codex 原生的 `default_tools_approval_mode`。OpenClaw 会在将原生 `mcp_servers` 配置交给 Codex 之前剥离 `codex` 元数据。

### 已保存的 MCP 服务器定义

OpenClaw 还会在配置中为需要 OpenClaw 管理的 MCP 定义的界面存储一个轻量级 MCP 服务器注册表。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

说明：

- `list` 会对服务器名称排序。
- 没有名称的 `show` 会打印完整的已配置 MCP 服务器对象。
- `status` 会在不连接的情况下分类已配置的传输。`--verbose` 包括解析后的启动、超时、OAuth、过滤器和并行调用详情。
- `doctor` 会在不连接的情况下执行静态检查。当命令还应验证已启用服务器能连接时，添加 `--probe`。
- `probe` 会连接并报告工具数量、资源/提示词支持、列表变更支持和诊断。
- `add` 接受 stdio 标志，例如 `--command`、`--arg`、`--env` 和 `--cwd`，或 HTTP 标志，例如 `--url`、`--transport`、`--header`、`--auth oauth`、TLS、超时和工具选择标志。
- `set` 期望命令行上有一个 JSON 对象值。
- `configure` 会更新启用状态、工具过滤器、超时、OAuth、TLS 和并行工具调用提示，而不会替换整个服务器定义。
- `tools` 会更新每台服务器的工具过滤器。include/exclude 条目是 MCP 工具名称和简单的 `*` glob。
- `login` 会为配置了 `auth: "oauth"` 的 HTTP 服务器运行 OAuth 流程。第一次运行会打印授权 URL；审批后使用 `--code` 重新运行。
- `logout` 会清除指定服务器已存储的 OAuth 凭证，而不会移除已保存的服务器定义。
- `reload` 会释放已缓存的进程内 MCP 运行时。另一个进程中的 Gateway 网关或智能体进程仍需要自己的重新加载或重启路径。
- 对 Streamable HTTP MCP 服务器使用 `transport: "streamable-http"`。`openclaw mcp set` 也会将 CLI 原生的 `type: "http"` 规范化为相同的规范配置形态，以保持兼容性。
- 如果指定服务器不存在，`unset` 会失败。

示例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### 常见服务器配方

这些示例只保存服务器定义。之后运行 `openclaw mcp doctor --probe`，以证明服务器能启动并公开工具。

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    将文件系统服务器的范围限制到智能体应读取或编辑的最小目录树。

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    如果服务器公开了不应提供给普通智能体的写入工具，请使用工具过滤器。

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` 会检查 `cwd` 是否存在，以及命令是否能从已配置环境中解析。

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    当远程服务器支持 OAuth 时使用 OAuth。如果服务器需要静态标头，请避免提交字面量 bearer token。

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接桌面控制服务器会继承其启动进程的权限。使用窄范围工具过滤器和操作系统级权限提示。

  </Tab>
</Tabs>

### JSON 输出形状

对脚本和仪表盘使用 `--json`。字段集合可能会随时间增长，因此消费者应忽略未知键。

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    当任何已启用且已检查的服务器存在错误时，`doctor --json` 会以非零状态退出。警告会被报告，但它们本身不会导致命令失败。

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` 会打开一个实时 MCP 客户端会话。将它用于可达性和能力证明，而不是用于静态配置审计。

  </Accordion>
</AccordionGroup>

配置形状示例：

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio 传输

启动本地子进程，并通过 stdin/stdout 通信。

| 字段                       | 描述                              |
| -------------------------- | --------------------------------- |
| `command`                  | 要生成的可执行文件（必填）        |
| `args`                     | 命令行参数数组                    |
| `env`                      | 额外环境变量                      |
| `cwd` / `workingDirectory` | 进程的工作目录                    |

<Warning>
**Stdio env 安全过滤器**

OpenClaw 会拒绝可改变 stdio MCP 服务器在第一次 RPC 之前启动方式的解释器启动环境变量键，即使它们出现在服务器的 `env` 块中也是如此。被阻止的键包括 `BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH` 以及类似的运行时控制变量。启动会以配置错误拒绝这些键，以避免它们向 stdio 进程注入隐式前置代码、替换解释器、启用调试器，或重定向运行时输出。普通凭证、代理和服务器专用环境变量（`GITHUB_TOKEN`、`HTTP_PROXY`、自定义 `*_API_KEY` 等）不受影响。

如果你的 MCP 服务器确实需要某个被阻止的变量，请在 Gateway 网关主机进程上设置它，而不是放在 stdio 服务器的 `env` 下。
</Warning>

### SSE / HTTP 传输

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| 字段                           | 描述                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `url`                          | 远程服务器的 HTTP 或 HTTPS URL（必填）                     |
| `headers`                      | 可选的 HTTP 标头键值映射（例如认证 token）                 |
| `connectionTimeoutMs`          | 每个服务器的连接超时时间，单位 ms（可选）                  |
| `connectTimeout`               | 每个服务器的连接超时时间，单位秒（可选）                   |
| `timeout` / `requestTimeoutMs` | 每个服务器的 MCP 请求超时时间，单位秒或 ms                 |
| `auth: "oauth"`                | 使用 MCP OAuth token 存储和 `openclaw mcp login`           |
| `sslVerify`                    | 仅对明确受信任的私有 HTTPS 端点设为 false                  |
| `clientCert` / `clientKey`     | mTLS 客户端证书和密钥路径                                  |
| `supportsParallelToolCalls`    | 提示并发调用对该服务器是安全的                             |

示例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（userinfo）和 `headers` 中的敏感值会在日志和状态输出中被遮盖。当看起来敏感的 `headers` 或 `env` 条目包含字面量值时，`openclaw mcp doctor` 会发出警告，以便操作者将这些值移出已提交的配置。

### OAuth 工作流

OAuth 用于通告 MCP OAuth 流程的 HTTP MCP 服务器。当服务器启用 `auth: "oauth"` 时，静态 `Authorization` 标头会被忽略。

<Steps>
  <Step title="Save the server">
    使用 `auth: "oauth"` 和任何可选 OAuth 元数据添加或更新服务器。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    运行 login 以创建授权请求。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw 会打印授权 URL，并将临时 OAuth verifier 状态存储在 OpenClaw 状态目录下。

  </Step>
  <Step title="Finish with the code">
    在浏览器中批准后，将返回的 code 传回 OpenClaw。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    使用 status 或 doctor 确认 token 已存在。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout 会移除已存储的 OAuth 凭证，但保留已保存的服务器定义。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

如果提供商轮换 token，或授权状态卡住，请运行 `openclaw mcp logout <name>`，然后重复 `login`。只要服务器名称和 URL 仍能识别凭证存储条目，即使 `auth: "oauth"` 已从配置中移除，`logout` 也可以清除已保存 HTTP 服务器的凭证。

### Streamable HTTP 传输

`streamable-http` 是除 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| 字段                           | 描述                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `url`                          | 远程服务器的 HTTP 或 HTTPS URL（必填）                                              |
| `transport`                    | 设为 `"streamable-http"` 以选择此传输；省略时，OpenClaw 使用 `sse`                  |
| `headers`                      | 可选的 HTTP 标头键值映射（例如认证 token）                                          |
| `connectionTimeoutMs`          | 每个服务器的连接超时时间，单位 ms（可选）                                           |
| `connectTimeout`               | 每个服务器的连接超时时间，单位秒（可选）                                            |
| `timeout` / `requestTimeoutMs` | 每个服务器的 MCP 请求超时时间，单位秒或 ms                                          |
| `auth: "oauth"`                | 使用 MCP OAuth token 存储和 `openclaw mcp login`                                    |
| `sslVerify`                    | 仅对明确受信任的私有 HTTPS 端点设为 false                                           |
| `clientCert` / `clientKey`     | mTLS 客户端证书和密钥路径                                                           |
| `supportsParallelToolCalls`    | 提示并发调用对该服务器是安全的                                                      |

OpenClaw 配置使用 `transport: "streamable-http"` 作为规范拼写。通过 `openclaw mcp set` 保存时会接受 CLI 原生 MCP `type: "http"` 值，并且 `openclaw doctor --fix` 会在现有配置中修复它们，但嵌入式 OpenClaw 直接消费的是 `transport`。

示例：

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
注册表命令不会启动频道桥接器。只有 `probe` 和 `doctor --probe` 会打开实时 MCP 客户端会话，以证明目标服务器可达。
</Note>

## Control UI

浏览器 Control UI 在 `/mcp` 提供专用的 MCP 设置页面。它显示已配置服务器数量、启用/OAuth/过滤器摘要、每个服务器的传输行、启用/停用控件、常用 CLI 命令，以及用于 `mcp` 配置部分的限定范围编辑器。

将该页面用于操作者编辑和快速清单。当你需要实时服务器证明时，使用 `openclaw mcp doctor --probe` 或 `openclaw mcp probe`。

操作者工作流：

1. 打开 Control UI 并选择 **MCP**。
2. 查看总数、已启用、OAuth 和已过滤服务器的摘要卡片。
3. 使用每个服务器行查看传输协议、凭证、过滤器、超时和命令提示。
4. 当你想保留定义但将其排除在运行时设备发现之外时，切换启用状态。
5. 编辑限定范围的 `mcp` 配置章节，用于新服务器、标头、TLS、OAuth 元数据或工具过滤器等结构性变更。
6. 选择 **保存** 仅持久化配置，或选择 **保存并发布** 通过 Gateway 网关配置路径应用。
7. 当你需要实时证明已编辑的服务器可以启动并列出工具时，运行 `openclaw mcp doctor --probe`。

说明：

- 命令片段会引用服务器名称，因此不常见的名称在 shell 中仍可复制
- 显示的类似 URL 的值如果包含嵌入式凭据，会在渲染前被遮盖
- 该页面不会自行启动 MCP 传输协议
- 活跃运行时可能需要 `openclaw mcp reload`、Gateway 网关配置发布或进程重启，具体取决于哪个进程拥有 MCP 客户端

## 当前限制

本页面记录的是当前已发布的桥接能力。

当前限制：

- 会话设备发现依赖现有 Gateway 网关会话路由元数据
- 除 Claude 专用适配器外，没有通用推送协议
- 目前还没有消息编辑或回应工具
- HTTP/SSE/streamable-http 传输协议会连接到单个远程服务器；目前尚无多路复用上游
- `permissions_list_open` 仅包含桥接已连接期间观察到的审批

## 相关

- [CLI 参考](/zh-CN/cli)
- [插件](/zh-CN/cli/plugins)
