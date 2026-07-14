---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到由 OpenClaw 支持的渠道
    - 正在运行 `openclaw mcp serve`
    - 管理 OpenClaw 保存的 MCP 服务器定义
sidebarTitle: MCP
summary: 通过 MCP 公开 OpenClaw 渠道对话，并管理已保存的 MCP 服务器定义
title: MCP
x-i18n:
    generated_at: "2026-07-14T13:31:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有两个作用：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 管理由 OpenClaw 管理的出站 MCP 服务器定义

`serve` 表示 OpenClaw 作为 MCP 服务器运行。其他子命令则表示 OpenClaw 充当 MCP 客户端侧注册表，供其自身运行时稍后使用其中的服务器。

<Note>
  `list`、`show`、`set` 和 `unset` 仅在 OpenClaw 配置中读写由 OpenClaw 管理的 `mcp.servers` 条目。它们不包含 `config/mcporter.json` 中的 mcporter 服务器；对于该注册表，请使用 `mcporter list`。
</Note>

当 OpenClaw 应自行托管编码工具链会话，并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/zh-CN/cli/acp)。

## 选择正确的 MCP 路径

| 目标                                                                | 使用                                                                  | 原因                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 让外部 MCP 客户端读取/发送 OpenClaw 渠道会话 | `openclaw mcp serve`                                                 | OpenClaw 是 MCP 服务器，通过 stdio 公开由 Gateway 网关支持的会话。                                 |
| 保存第三方 MCP 服务器，供 OpenClaw 管理的智能体运行使用        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw 是 MCP 客户端侧注册表，稍后会将这些服务器投射到符合条件的运行时中。               |
| 在不运行智能体轮次的情况下检查已保存的服务器                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` 和 `doctor` 检查配置；`probe` 会建立实时 MCP 连接并列出能力。               |
| 从浏览器编辑 MCP 配置                                      | Control UI `/settings/mcp`（`/mcp` 别名）                            | 该页面显示清单、启用状态、OAuth/过滤器摘要、命令提示，以及作用域限定的 `mcp` 编辑器。         |
| 为 Codex app-server 提供作用域限定的原生 MCP 服务器                    | `mcp.servers.<name>.codex`                                           | `codex` 块仅影响 Codex app-server 线程投射，并会在移交原生配置之前被移除。 |
| 运行由 ACP 托管的工具链会话                                     | [`openclaw acp`](/zh-CN/cli/acp) 和 [ACP 智能体](/zh-CN/tools/acp-agents-setup) | ACP 桥接模式不接受按会话注入 MCP 服务器；请改为配置 Gateway 网关/插件桥接。     |

<Tip>
如果不确定需要哪条路径，请从 `openclaw mcp status --verbose` 开始。它会显示 OpenClaw 已保存的内容，而不会启动任何 MCP 服务器。
</Tip>

## 将 OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

### 何时使用 serve

在以下情况下使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端需要直接与由 OpenClaw 支持的渠道会话通信
- 已经有一个具备路由会话的本地或远程 OpenClaw Gateway 网关
- 希望使用一个适用于 OpenClaw 各渠道后端的 MCP 服务器，而不是为每个渠道分别运行桥接

当 OpenClaw 应自行托管编码运行时，并将智能体会话保留在 OpenClaw 内部时，请改用 [`openclaw acp`](/zh-CN/cli/acp)。

### 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。该进程由 MCP 客户端所有。当客户端保持 stdio 会话打开时，桥接器会通过 WebSocket 连接到本地或远程 OpenClaw Gateway 网关，并通过 MCP 公开经过路由的渠道会话。

<Steps>
  <Step title="客户端生成桥接器">
    MCP 客户端生成 `openclaw mcp serve`。
  </Step>
  <Step title="桥接器连接到 Gateway 网关">
    桥接器通过 WebSocket 连接到 OpenClaw Gateway 网关。
  </Step>
  <Step title="会话成为 MCP 对话">
    经过路由的会话会成为 MCP 对话及转录记录/历史记录工具。
  </Step>
  <Step title="实时事件进入队列">
    桥接器保持连接时，实时事件会在内存中排队。
  </Step>
  <Step title="可选的 Claude 推送">
    如果启用了 Claude 渠道模式，同一会话还可以接收 Claude 专用的推送通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行为">
    - 实时队列状态从桥接器连接时开始
    - 使用 `messages_read` 读取较早的转录历史记录
    - Claude 推送通知仅在 MCP 会话存续期间存在
    - 客户端断开连接后，桥接器会退出，实时队列也会消失
    - 单次智能体入口点（例如 `openclaw agent` 和 `openclaw infer model run`）会在回复完成时终止其打开的所有内置 MCP 运行时，因此重复执行脚本不会累积 stdio MCP 子进程
    - OpenClaw 启动的 stdio MCP 服务器（无论是内置服务器还是用户配置的服务器）会在关闭时作为进程树整体终止，因此服务器启动的子进程不会在父 stdio 客户端退出后继续运行
    - 删除或重置会话时，会通过共享运行时清理路径释放该会话的 MCP 客户端，因此不会遗留与已移除会话关联的 stdio 连接

  </Accordion>
</AccordionGroup>

### 选择客户端模式

<Tabs>
  <Tab title="通用 MCP 客户端">
    仅使用标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和审批工具。
  </Tab>
  <Tab title="Claude Code">
    标准 MCP 工具加 Claude 专用渠道适配器。启用 `--claude-channel-mode on`，或保留默认值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行为与 `on` 相同。尚未实现客户端能力检测。
</Note>

### serve 公开的内容

桥接器使用现有的 Gateway 网关会话路由元数据来公开由渠道支持的对话。当 OpenClaw 已具有包含已知路由的会话状态时，对话就会出现，例如：

- `channel`
- 接收方或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这使 MCP 客户端可以在一个位置执行以下操作：

- 列出最近经过路由的对话
- 读取最近的转录历史记录
- 等待新的入站事件
- 通过同一路由发回回复
- 查看桥接器连接期间收到的审批请求

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
  <Tab title="详细输出/关闭 Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### 桥接工具

<AccordionGroup>
  <Accordion title="conversations_list">
    列出 Gateway 网关会话状态中已具有路由元数据的近期会话支持型对话。

    过滤器：`limit`（最大值 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    使用 Gateway 网关会话直接查找，按 `session_key` 返回一个对话。
  </Accordion>
  <Accordion title="messages_read">
    读取一个会话支持型对话的近期转录消息。`limit` 默认为 20，最大值为 200。
  </Accordion>
  <Accordion title="attachments_fetch">
    从一条转录消息中提取非文本消息内容块。这是基于转录内容的元数据视图，而非独立的持久附件 Blob 存储。
  </Accordion>
  <Accordion title="events_poll">
    读取从某个数字游标开始排队的实时事件。`limit` 最大值为 200。
  </Accordion>
  <Accordion title="events_wait">
    长轮询，直到下一条匹配的队列事件到达或超时（默认 30s，最大 300s）。

    当通用 MCP 客户端需要近实时传送，但不使用 Claude 专用推送协议时，请使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    通过会话中已记录的同一路由发回文本。

    当前行为：

    - 需要现有的对话路由
    - 使用会话的渠道、接收方、账户 ID 和线程 ID
    - 仅发送文本

  </Accordion>
  <Accordion title="permissions_list_open">
    列出桥接器自连接到 Gateway 网关以来观察到的待处理 Exec/插件审批请求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下值之一处理一项待处理的 Exec/插件审批请求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

桥接器在连接期间会维护一个内存事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 该队列仅用于实时事件；它会在 MCP 桥接器启动时开始
- `events_poll` 和 `events_wait` 本身不会重放较早的 Gateway 网关历史记录
- 应使用 `messages_read` 读取持久积压消息

</Warning>

### Claude 渠道通知

桥接器还可以公开 Claude 专用渠道通知。这相当于 OpenClaw 中的 Claude Code 渠道适配器：标准 MCP 工具仍然可用，但实时入站消息也可以作为 Claude 专用 MCP 通知到达。

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

启用 Claude 渠道模式后，服务器会公布 Claude 实验性能力，并且可以发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站 `user` 转录消息会作为 `notifications/claude/channel` 转发
- 通过 MCP 收到的 Claude 权限请求会在内存中跟踪
- 如果关联对话中的命令所有者稍后发送 `yes <id>` 或 `no <id>`（`<id>` 是 5 个字母的请求 ID，不包括 `l`），桥接器会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅在实时会话期间存在；如果 MCP 客户端断开连接，则不存在推送目标

这是有意设计为客户端专用的行为。通用 MCP 客户端应依赖标准轮询工具。

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

对于大多数通用 MCP 客户端，请从标准工具界面开始，并忽略 Claude 模式。仅对真正理解 Claude 专用通知方法的客户端启用 Claude 模式。

### 选项

`openclaw mcp serve` 支持：

<ParamField path="--url" type="string">
  Gateway 网关 WebSocket URL。配置后默认为 `gateway.remote.url`。
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
  Claude 通知模式。默认为 `auto`。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  在 stderr 上输出详细日志。
</ParamField>

<Tip>
尽可能优先使用 `--token-file` 或 `--password-file`，而不是内联密钥。
</Tip>

### 安全和信任边界

此桥接器不会自行创建路由。它只公开 Gateway 网关已经知道如何路由的对话。

这意味着：

- 发送者允许列表、配对和渠道级信任仍由底层 OpenClaw 渠道配置负责
- `messages_send` 只能通过已有的已存储路由回复
- 审批状态仅在当前桥接会话中实时保存在内存里
- 桥接身份验证应使用你信任的、适用于任何其他远程 Gateway 网关客户端的相同 Gateway 网关令牌或密码控制

如果 `conversations_list` 中缺少某个对话，通常原因并非 MCP 配置，而是底层 Gateway 网关会话中的路由元数据缺失或不完整。

### 测试

OpenClaw 为此桥接器提供了确定性的 Docker 冒烟测试：

```bash
pnpm test:docker:mcp-channels
```

该冒烟测试运行单个容器：它会植入对话状态，启动 Gateway 网关，然后将 `openclaw mcp serve` 作为 stdio 子进程生成，并以 MCP 客户端身份驱动它。它会通过真实的 stdio MCP 桥接器验证对话发现、转录读取、附件元数据读取、实时事件队列行为，以及 Claude 风格的渠道和权限通知。出站发送路由（`messages_send` 重用已存储的对话路由）由 `src/mcp/channel-server.test.ts` 中的单元测试单独覆盖。

这是在测试运行中无需接入真实 Telegram、Discord 或 iMessage 账户即可验证桥接器是否正常工作的最快方式。

有关更广泛的测试背景，请参阅[测试](/zh-CN/help/testing)。

### 故障排除

<AccordionGroup>
  <Accordion title="未返回任何对话">
    通常表示 Gateway 网关会话尚不可路由。请确认底层会话已存储渠道/提供商、接收者以及可选的账户/线程路由元数据。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 遗漏较早的消息">
    这是预期行为。实时队列在桥接器连接时启动。使用 `messages_read` 读取较早的转录历史记录。
  </Accordion>
  <Accordion title="未显示 Claude 通知">
    请检查以下各项：

    - 客户端保持 stdio MCP 会话处于打开状态
    - `--claude-channel-mode` 为 `on` 或 `auto`
    - 客户端确实理解 Claude 专用通知方法
    - 入站消息发生在桥接器连接之后

  </Accordion>
  <Accordion title="缺少审批">
    `permissions_list_open` 仅显示桥接器连接期间观察到的审批请求。它不是持久化的审批历史 API。
  </Accordion>
</AccordionGroup>

## 将 OpenClaw 用作 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 路径。

这些命令不会通过 MCP 公开 OpenClaw。它们管理 OpenClaw 配置中 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器定义。它们不会从 `config/mcporter.json` 读取 mcporter 服务器。

这些已保存的定义用于 OpenClaw 稍后启动或配置的运行时，例如嵌入式 OpenClaw 和其他运行时适配器。OpenClaw 集中存储这些定义，因此这些运行时不必各自维护重复的 MCP 服务器列表。

<AccordionGroup>
  <Accordion title="重要行为">
    - 这些命令仅读取或写入 OpenClaw 配置
    - `status`、`list`、`show`、不带 `--probe` 的 `doctor`、`set`、`configure`、`tools`、`logout`、`reload` 和 `unset` 不会连接目标 MCP 服务器
    - `login` 为已配置的 HTTP 服务器执行 MCP OAuth 网络流程，并保存由此生成的本地凭据
    - `status --verbose` 输出解析后的传输、身份验证、超时、筛选器和并行工具调用提示，而不建立连接
    - `doctor` 检查已保存定义中的本地设置问题，例如缺少 stdio 命令、工作目录无效、缺少 TLS 文件、服务器已禁用、敏感标头/环境变量使用字面值，以及 OAuth 授权不完整
    - `doctor --probe` 在静态检查通过后，添加与 `probe` 相同的实时连接验证
    - `probe` 连接所选服务器或所有已配置服务器，列出工具，并报告能力/诊断信息
    - `add` 根据标志构建定义并在保存前进行探测，除非设置了 `--no-probe`，或需要先完成 OAuth 授权
    - 运行时适配器在执行时决定其实际支持哪些传输形式
    - `enabled: false` 保留已保存的服务器，但将其排除在嵌入式运行时发现之外
    - `timeout` 和 `connectTimeout` 以秒为单位设置各服务器的请求和连接超时
    - `supportsParallelToolCalls: true` 标记适配器可以并发调用的服务器
    - HTTP 服务器可以使用静态标头、OAuth 登录、TLS 验证控制以及 mTLS 证书/密钥路径
    - 嵌入式 OpenClaw 在常规 `coding` 和 `messaging` 工具配置中公开已配置的 MCP 工具；`minimal` 仍会隐藏它们，而 `tools.deny: ["bundle-mcp"]` 会明确禁用它们
    - 各服务器的 `toolFilter.include` 和 `toolFilter.exclude` 会在发现的 MCP 工具成为 OpenClaw 工具之前对其进行筛选
    - 声明资源或提示词的服务器还会公开实用工具，用于列出/读取资源以及列出/获取提示词；这些生成的实用工具名称（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）使用相同的包含/排除筛选器
    - 动态 MCP 工具列表变更会使该会话的缓存目录失效；下次发现/使用时将从服务器刷新
    - 重复的 MCP 工具请求/协议失败会使该服务器短暂停用，以免一个故障服务器耗尽整个轮次
    - 会话范围的内置 MCP 运行时在空闲 `mcp.sessionIdleTtlMs` 毫秒后被回收（默认为 10 分钟；设置 `0` 可禁用），一次性嵌入式运行则在运行结束时将其清理

  </Accordion>
</AccordionGroup>

运行时适配器可以将此共享注册表规范化为其下游客户端所需的形式。例如，嵌入式 OpenClaw 直接使用 OpenClaw `transport` 值，而 Claude Code 和 Gemini 接收 CLI 原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

Codex app-server 还支持每个服务器上的可选 `codex` 块。这是
仅用于 Codex app-server 线程的 OpenClaw 投影元数据；它不会
更改 ACP 会话、通用 Codex harness 配置或其他运行时适配器。
使用非空的 `codex.agents`，仅将服务器投影到特定 OpenClaw
智能体 ID。空白、仅含空格或无效的智能体列表会被配置
验证拒绝，并由运行时投影路径省略，而不会变为
全局配置。使用 `codex.defaultToolsApprovalMode`（`auto`、`prompt` 或 `approve`）
为受信任的服务器生成 Codex 原生的 `default_tools_approval_mode`。
OpenClaw 在将原生 `mcp_servers` 配置交给 Codex 之前，
会移除 `codex` 元数据。

### 已保存的 MCP 服务器定义

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

- `list` 对服务器名称排序。
- 不带名称的 `show` 会输出完整的已配置 MCP 服务器对象。
- `status` 在不建立连接的情况下对已配置的传输进行分类。`--verbose` 包含解析后的启动、超时、OAuth、筛选器和并行调用详细信息。
- `doctor` 在不建立连接的情况下执行静态检查。如果该命令还应验证已启用服务器能否连接，请添加 `--probe`。
- `probe` 建立连接，并报告工具数量、资源/提示词支持、列表变更支持和诊断信息。
- `add` 接受 stdio 标志，例如 `--command`、`--arg`、`--env` 和 `--cwd`；也接受 HTTP 标志，例如 `--url`、`--transport`、`--header`、`--auth oauth`、TLS、超时和工具选择标志。
- `set` 要求命令行中提供一个 JSON 对象值。
- `configure` 更新启用状态、工具筛选器、超时、OAuth、TLS 和并行工具调用提示，而不替换整个服务器定义。添加 `--probe` 可在保存前验证更新后的服务器。
- `tools` 更新各服务器的工具筛选器。包含/排除条目是 MCP 工具名称和简单的 `*` glob 模式。
- `login` 为使用 `auth: "oauth"` 配置的 HTTP 服务器运行 OAuth 流程。首次运行会输出授权 URL；批准后使用 `--code` 重新运行。
- `logout` 清除指定服务器已存储的 OAuth 凭据，但不移除已保存的服务器定义。
- `reload` 仅释放当前 CLI 进程中缓存的进程内 MCP 运行时。另一个进程中的 Gateway 网关或智能体进程仍需执行各自的重新加载或重启流程。
- 对 Streamable HTTP MCP 服务器使用 `transport: "streamable-http"`。为实现兼容性，`openclaw mcp set` 还会将 CLI 原生的 `type: "http"` 规范化为相同的标准配置形式。
- 如果指定服务器不存在，`unset` 将失败。

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

### 常用服务器配置示例

这些示例仅保存服务器定义。之后运行 `openclaw mcp doctor --probe`，以确认服务器能够启动并公开工具。

<Tabs>
  <Tab title="文件系统">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    将文件系统服务器的作用域限制在智能体应读取或编辑的最小目录树内。

  </Tab>
  <Tab title="记忆">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    如果服务器公开了不应向普通智能体提供的写入工具，请使用工具筛选器。

  </Tab>
  <Tab title="本地脚本">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` 会检查 `cwd` 是否存在，以及是否可以从配置的环境中解析该命令。

  </Tab>
  <Tab title="远程 HTTP">
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

    远程服务器支持 OAuth 时，请使用 OAuth。如果服务器需要静态标头，请避免提交明文 bearer token。

  </Tab>
  <Tab title="桌面/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接控制桌面的服务器会继承其启动进程的权限。请使用严格的工具筛选器和操作系统级权限提示。

  </Tab>
</Tabs>

### JSON 输出结构

脚本和仪表板请使用 `--json`。字段集可能随时间增加，因此使用方应忽略未知键。

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth 凭据尚未授权；请运行 openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    只要任何已启用且接受检查的服务器存在 `error` 级别的问题，`doctor --json` 就会以非零状态退出。系统会报告 `warning` 和 `info` 问题，但它们本身不会使命令失败。

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` 会打开实时 MCP 客户端会话并直接输出结果；与 `status`/`doctor` 不同，其输出没有顶层 `path` 字段。只有当服务器实际声明相应能力时，才会出现 `resources` 和 `prompts` 键（没有 prompts 的服务器会省略 `prompts` 键，而不是报告 `false`）。请使用 `probe` 验证可访问性和能力，不要用它进行静态配置审计。

  </Accordion>
</AccordionGroup>

配置结构示例：

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

启动本地子进程，并通过 stdin/stdout 进行通信。

| 字段                      | 说明                       |
| -------------------------- | --------------------------------- |
| `command`                  | 要启动的可执行文件（必需）    |
| `args`                     | 命令行参数数组   |
| `env`                      | 额外环境变量       |
| `cwd` / `workingDirectory` | 进程的工作目录 |

<Warning>
**Stdio 环境变量安全筛选器**

OpenClaw 在启动 stdio MCP 服务器之前会拒绝解释器启动、加载器劫持和 shell 初始化环境变量键，即使它们出现在服务器的 `env` 块中也是如此。此机制使用与 OpenClaw 启动的其他进程相同的主机环境安全策略：它会阻止已知的解释器启动钩子（例如 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共享库和函数注入前缀（`DYLD_*`、`LD_*`、`BASH_FUNC_*`）以及类似的运行时控制变量。启动时会静默丢弃这些变量并记录警告，以防止它们向 stdio 进程注入隐式前置代码、替换解释器、启用调试器或劫持动态链接器。显式允许列表会保留常规 MCP 凭据环境变量（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`），以及常规代理和服务器专用环境变量（`HTTP_PROXY`、自定义 `*_API_KEY` 等）。其他 `AWS_*` 键（如 `AWS_CONFIG_FILE` 和 `AWS_SHARED_CREDENTIALS_FILE`）仍会被阻止，因为它们指向凭据文件，而不是直接包含凭据值。

如果你的 MCP 服务器确实需要某个被阻止的变量，请在 Gateway 网关主机进程上设置，而不要在 stdio 服务器的 `env` 下设置。
</Warning>

### SSE / HTTP 传输

通过 HTTP 服务器发送事件连接到远程 MCP 服务器。

| 字段                          | 说明                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | 远程服务器的 HTTP 或 HTTPS URL（必需）                |
| `headers`                      | 可选的 HTTP 标头键值映射（例如身份验证 token） |
| `connectionTimeoutMs`          | 每台服务器的连接超时，单位为 ms（可选）                   |
| `connectTimeout`               | 每台服务器的连接超时，单位为秒（可选）              |
| `timeout` / `requestTimeoutMs` | 每台服务器的 MCP 请求超时，单位为秒或 ms                  |
| `auth: "oauth"`                | 使用由 `openclaw mcp login` 保存的 MCP OAuth 凭据          |
| `sslVerify`                    | 仅对明确受信任的私有 HTTPS 端点设为 false    |
| `clientCert` / `clientKey`     | mTLS 客户端证书和密钥路径                            |
| `supportsParallelToolCalls`    | 表明此服务器可安全执行并发调用              |

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

日志和状态输出会遮盖 `url`（用户信息）和 `headers` 中的敏感值。当看似敏感的 `headers` 或 `env` 条目包含明文值时，`openclaw mcp doctor` 会发出警告，以便操作员将这些值移出已提交的配置。

### OAuth 工作流程

OAuth 适用于声明支持 MCP OAuth 流程的 HTTP MCP 服务器。当服务器启用 `auth: "oauth"` 时，会忽略静态 `Authorization` 标头。由 `openclaw mcp login` 保存的凭据可用于嵌入式 MCP、CLI 运行程序和本地 Codex app-server。

在凭据可用之前，OpenClaw 只会从 Agent Runtimes 中省略该 MCP 服务器，而不会导致智能体轮次失败。之后，操作员或具有 shell 访问权限的智能体可以运行 `openclaw mcp login <name>`，并在后续轮次中使用该服务器。

当远程 MCP 服务已由另一个支持刷新的 OpenClaw 身份验证配置文件提供支持时，可以选择设置 `oauth.authProfileId`。OpenClaw 会在运行时投影之前刷新任一凭据来源，并且仅将当前 access token 传递给下游 MCP 客户端。

<Steps>
  <Step title="保存服务器">
    使用 `auth: "oauth"` 和任何可选的 OAuth 元数据添加或更新服务器。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    对于由身份验证配置文件支持的 bearer，请保存配置文件绑定：

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="开始登录">
    运行登录以创建授权请求。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw 会输出授权 URL，并将临时 OAuth 验证器状态存储在 OpenClaw 状态目录下。

  </Step>
  <Step title="使用代码完成">
    在浏览器中批准后，将返回的代码传回 OpenClaw。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="检查授权">
    使用 status 或 doctor 确认令牌已存在。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="清除凭据">
    注销会删除已存储的 OAuth 凭据，但保留已保存的服务器定义。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

如果提供商轮换令牌或授权状态卡住，请运行 `openclaw mcp logout <name>`，然后重复 `login`。即使 `auth: "oauth"` 已从配置中移除，只要服务器名称和 URL 仍可标识凭据存储条目，`logout` 仍可清除已保存 HTTP 服务器的凭据。

### 可流式 HTTP 传输

`streamable-http` 是除 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| 字段                           | 描述                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | 远程服务器的 HTTP 或 HTTPS URL（必填）                                      |
| `transport`                    | 设置为 `"streamable-http"` 以选择此传输方式；省略时，OpenClaw 使用 `sse` |
| `headers`                      | 可选的 HTTP 标头键值映射（例如身份验证令牌）                       |
| `connectionTimeoutMs`          | 每台服务器的连接超时时间，单位为毫秒（可选）                                         |
| `connectTimeout`               | 每台服务器的连接超时时间，单位为秒（可选）                                    |
| `timeout` / `requestTimeoutMs` | 每台服务器的 MCP 请求超时时间，单位为秒或毫秒                                        |
| `auth: "oauth"`                | 使用由 `openclaw mcp login` 保存的 MCP OAuth 凭据                                |
| `sslVerify`                    | 仅对明确受信任的私有 HTTPS 端点设置为 false                          |
| `clientCert` / `clientKey`     | mTLS 客户端证书和密钥路径                                                  |
| `supportsParallelToolCalls`    | 表明此服务器可安全进行并发调用的提示                                    |

OpenClaw 配置使用 `transport: "streamable-http"` 作为规范拼写。通过 `openclaw mcp set` 保存时，会接受 CLI 原生 MCP `type: "http"` 值，并由 `openclaw doctor --fix` 修复现有配置，但嵌入式 OpenClaw 直接使用的是 `transport`。

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
注册表命令不会启动渠道桥接。只有 `probe` 和 `doctor --probe` 会打开实时 MCP 客户端会话，以验证目标服务器是否可访问。
</Note>

## Control UI

浏览器 Control UI 在 `/settings/mcp` 提供专用的 MCP 设置页面；此前的 `/mcp` 路径仍作为别名保留。该页面会显示已配置服务器数量、启用/OAuth/筛选摘要、各服务器的传输方式行、启用/禁用控件、常用 CLI 命令，以及用于编辑 `mcp` 配置部分的范围限定编辑器。

使用该页面进行操作员编辑和快速清点。当需要实时服务器验证时，请使用 `openclaw mcp doctor --probe` 或 `openclaw mcp probe`。

操作员工作流程：

1. 打开 Control UI 并选择 **MCP**。
2. 查看服务器总数、已启用、OAuth 和已筛选的摘要卡片。
3. 使用每个服务器行查看传输方式、身份验证、筛选器、超时和命令提示。
4. 如果希望保留定义但将其排除在运行时发现之外，请切换启用状态。
5. 编辑范围限定的 `mcp` 配置部分，以进行新增服务器、标头、TLS、OAuth 元数据或工具筛选器等结构性更改。
6. 选择 **Save** 仅持久化配置，或选择 **Save & Publish** 通过 Gateway 网关配置路径应用配置。
7. 如果需要实时验证编辑后的服务器能够启动并列出工具，请运行 `openclaw mcp doctor --probe`。

注意：

- 命令片段会为服务器名称添加引号，以便名称特殊时仍可在 shell 中复制使用
- 类似 URL 的显示值如果包含嵌入式凭据，会在渲染前进行脱敏
- 该页面本身不会启动 MCP 传输
- 根据 MCP 客户端由哪个进程管理，活动运行时可能需要 `openclaw mcp reload`、发布 Gateway 网关配置或重启进程

## MCP Apps

OpenClaw 可以渲染实现稳定版 [MCP Apps 扩展](https://modelcontextprotocol.io/extensions/apps)的工具。Apps 需要主动启用，因为其 HTML 来自已配置的 MCP 服务器，并且可以向同一服务器请求 App 可见的工具或资源。

启用主机桥接：

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

更改此设置后，请重启 Gateway 网关。启用后，OpenClaw 会在 Gateway 网关端口加一的端口上启动一个仅用于沙箱的 HTTP(S) 监听器（对于默认 Gateway 网关，即 `18790`）。Control UI 从该独立源加载 Apps；此监听器绝不会提供 Control UI、经过身份验证的 Gateway 网关路由或用户数据。

直接连接 Gateway 网关时需要能够访问这两个端口。如果反向代理或 TLS 终止器公开 Control UI，请为 Apps 分配专用公共源，并仅将该源代理到沙箱监听器：

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

沙箱源必须与 Control UI 源不同。不要在其中托管其他经过身份验证或敏感的内容。

例如，可按如下方式配置官方基础 React 演示：

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

行为和安全边界：

- OpenClaw 仅在启用 Apps 时声明 `io.modelcontextprotocol/ui` 扩展。
- 仅渲染具有完全匹配 `text/html;profile=mcp-app` MIME 类型的 `ui://` 资源。
- UI 资源上限为 2 MiB，通过专用外层源上的双 iframe 代理提供，加载到不透明的内层 App 源中，并受根据资源元数据生成的 CSP 约束。
- 仅供 App 使用的工具（`_meta.ui.visibility: ["app"]`）不会出现在模型工具列表中。Apps 只能调用其所属服务器上 App 可见的工具，并且这些工具还必须通过创建该视图的运行所采用的有效 OpenClaw 工具策略。
- 当内层 App 文档使用不透明源实现跨 App 隔离时，不会授予与源绑定的 App 权限，例如摄像头、麦克风和地理位置权限。
- App HTML、完整工具参数和原始结果保存在有界的十分钟内存视图租约中，不会写入磁盘或复制到转录预览元数据中。转录仅存储与原始工具调用 ID 绑定的有界服务器/工具/资源描述符。Gateway 网关重启后，Control UI 可以根据经过身份验证的会话转录验证该描述符并重新获取 `ui://` 资源；在新的运行建立当前工具权限之前，重建的视图为只读。
- 启用桥接时，`openclaw security audit` 会发出警告。不需要时，请使用 `openclaw config set mcp.apps.enabled false --strict-json` 将其禁用。

## 当前限制

本页记录该桥接目前发布版本的行为。

当前限制：

- 对话发现依赖现有的 Gateway 网关会话路由元数据
- 除 Claude 专用适配器外，没有通用推送协议
- 尚无消息编辑或表情回应工具
- HTTP/SSE/streamable-http 传输连接到单个远程服务器；尚不支持多路复用上游
- `permissions_list_open` 仅包含桥接连接期间观察到的审批

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [插件](/zh-CN/cli/plugins)
