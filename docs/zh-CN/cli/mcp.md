---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到由 OpenClaw 支持的渠道
    - 正在运行 `openclaw mcp serve`
    - 管理 OpenClaw 保存的 MCP 服务器定义
sidebarTitle: MCP
summary: 通过 MCP 公开 OpenClaw 渠道对话并管理已保存的 MCP 服务器定义
title: MCP
x-i18n:
    generated_at: "2026-07-12T14:22:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` 有两项职责：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 管理由 OpenClaw 管理的出站 MCP 服务器定义

使用 `serve` 时，OpenClaw 充当 MCP 服务器。使用其他子命令时，OpenClaw 充当 MCP 客户端侧的服务器注册表，供其自身运行时稍后使用。

<Note>
  `list`、`show`、`set` 和 `unset` 只会读取和写入 OpenClaw 配置中由 OpenClaw 管理的 `mcp.servers` 条目。它们不包括 `config/mcporter.json` 中的 mcporter 服务器；请使用 `mcporter list` 查看该注册表。
</Note>

当需要由 OpenClaw 自行托管编码 harness 会话，并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/zh-CN/cli/acp)。

## 选择正确的 MCP 路径

| 目标                                                                | 使用                                                                  | 原因                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 让外部 MCP 客户端读取/发送 OpenClaw 渠道对话 | `openclaw mcp serve`                                                 | OpenClaw 充当 MCP 服务器，并通过 stdio 公开由 Gateway 网关支持的对话。                                 |
| 保存第三方 MCP 服务器，供 OpenClaw 管理的智能体运行使用        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw 充当 MCP 客户端侧注册表，之后会将这些服务器投射到符合条件的运行时中。               |
| 在不运行智能体轮次的情况下检查已保存的服务器                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` 和 `doctor` 检查配置；`probe` 会打开实时 MCP 连接并列出能力。               |
| 从浏览器编辑 MCP 配置                                      | Control UI `/settings/mcp`（`/mcp` 别名）                            | 该页面显示服务器清单、启用状态、OAuth/筛选器摘要、命令提示，以及限定范围的 `mcp` 编辑器。         |
| 为 Codex app-server 提供限定范围的原生 MCP 服务器                    | `mcp.servers.<name>.codex`                                           | `codex` 块仅影响 Codex app-server 线程投射，并会在交接原生配置前被移除。 |
| 运行由 ACP 托管的 harness 会话                                     | [`openclaw acp`](/zh-CN/cli/acp) 和 [ACP 智能体](/zh-CN/tools/acp-agents-setup) | ACP 桥接模式不接受按会话注入 MCP 服务器；请改为配置 Gateway 网关/插件桥接。     |

<Tip>
如果不确定需要哪条路径，请从 `openclaw mcp status --verbose` 开始。它会显示 OpenClaw 已保存的内容，而不会启动任何 MCP 服务器。
</Tip>

## 将 OpenClaw 用作 MCP 服务器

这是 `openclaw mcp serve` 路径。

### 何时使用 serve

在以下情况下使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端需要直接与由 OpenClaw 支持的渠道对话交互
- 你已有包含已路由会话的本地或远程 OpenClaw Gateway 网关
- 你希望使用一个可跨 OpenClaw 渠道后端工作的 MCP 服务器，而不是为每个渠道运行单独的桥接

当需要由 OpenClaw 自行托管编码运行时，并将智能体会话保留在 OpenClaw 内部时，请改用 [`openclaw acp`](/zh-CN/cli/acp)。

### 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。该进程由 MCP 客户端所有。客户端保持 stdio 会话打开期间，桥接会通过 WebSocket 连接本地或远程 OpenClaw Gateway 网关，并通过 MCP 公开已路由的渠道对话。

<Steps>
  <Step title="客户端生成桥接进程">
    MCP 客户端生成 `openclaw mcp serve` 进程。
  </Step>
  <Step title="桥接连接到 Gateway 网关">
    桥接通过 WebSocket 连接到 OpenClaw Gateway 网关。
  </Step>
  <Step title="会话成为 MCP 对话">
    已路由的会话会成为 MCP 对话及转录记录/历史记录工具。
  </Step>
  <Step title="实时事件进入队列">
    桥接保持连接期间，实时事件会在内存中排队。
  </Step>
  <Step title="可选的 Claude 推送">
    如果启用了 Claude 渠道模式，同一会话还可以接收 Claude 专用推送通知。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要行为">
    - 实时队列状态在桥接连接时开始
    - 使用 `messages_read` 读取较早的转录记录历史
    - Claude 推送通知仅在 MCP 会话存续期间存在
    - 客户端断开连接时，桥接会退出，实时队列也会消失
    - `openclaw agent` 和 `openclaw infer model run` 等一次性智能体入口点会在回复完成时停用它们打开的所有内置 MCP 运行时，因此重复的脚本化运行不会不断累积 stdio MCP 子进程
    - OpenClaw 启动的 stdio MCP 服务器（无论是内置还是用户配置）会在关闭时以进程树形式终止，因此服务器启动的子进程不会在父级 stdio 客户端退出后继续存活
    - 删除或重置会话时，会通过共享运行时清理路径释放该会话的 MCP 客户端，因此不会留下与已移除会话关联的 stdio 连接

  </Accordion>
</AccordionGroup>

### 选择客户端模式

<Tabs>
  <Tab title="通用 MCP 客户端">
    仅提供标准 MCP 工具。使用 `conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send` 和审批工具。
  </Tab>
  <Tab title="Claude Code">
    提供标准 MCP 工具以及 Claude 专用渠道适配器。启用 `--claude-channel-mode on`，或保留默认值 `auto`。
  </Tab>
</Tabs>

<Note>
目前，`auto` 的行为与 `on` 相同。当前尚未实现客户端能力检测。
</Note>

### serve 公开的内容

桥接使用现有 Gateway 网关会话路由元数据来公开由渠道支持的对话。当 OpenClaw 已具有包含已知路由的会话状态时，对话便会出现，例如：

- `channel`
- 接收者或目标位置元数据
- 可选的 `accountId`
- 可选的 `threadId`

这样，MCP 客户端便可在一个位置完成以下操作：

- 列出最近已路由的对话
- 读取最近的转录记录历史
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
    列出 Gateway 网关会话状态中已有路由元数据的近期会话型对话。

    筛选器：`limit`（最大值 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    使用直接 Gateway 网关会话查找，按 `session_key` 返回一个对话。
  </Accordion>
  <Accordion title="messages_read">
    读取一个会话型对话的近期转录记录消息。`limit` 默认值为 20，最大值为 200。
  </Accordion>
  <Accordion title="attachments_fetch">
    从一条转录记录消息中提取非文本消息内容块。这是转录记录内容的元数据视图，而不是独立的持久化附件 Blob 存储。
  </Accordion>
  <Accordion title="events_poll">
    读取从某个数字游标开始的队列实时事件。`limit` 最大值为 200。
  </Accordion>
  <Accordion title="events_wait">
    长轮询，直到下一个匹配的队列事件到达或超时（默认 30s，最大 300s）。

    当通用 MCP 客户端需要近实时传送，但不使用 Claude 专用推送协议时，请使用此工具。

  </Accordion>
  <Accordion title="messages_send">
    通过会话中已记录的同一路由发回文本。

    当前行为：

    - 要求存在现有对话路由
    - 使用会话的渠道、接收者、账号 ID 和线程 ID
    - 仅发送文本

  </Accordion>
  <Accordion title="permissions_list_open">
    列出桥接连接到 Gateway 网关后观察到的待处理 Exec/插件审批请求。
  </Accordion>
  <Accordion title="permissions_respond">
    使用以下响应之一处理待处理的 Exec/插件审批请求：

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### 事件模型

桥接连接期间会维护一个内存事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- 该队列仅包含实时事件；它在 MCP 桥接启动时开始
- `events_poll` 和 `events_wait` 本身不会重放较早的 Gateway 网关历史记录
- 应使用 `messages_read` 读取持久化积压消息

</Warning>

### Claude 渠道通知

桥接还可以公开 Claude 专用渠道通知。这相当于 OpenClaw 中的 Claude Code 渠道适配器：标准 MCP 工具仍然可用，但实时入站消息也可以 Claude 专用 MCP 通知的形式到达。

<Tabs>
  <Tab title="关闭">
    `--claude-channel-mode off`：仅提供标准 MCP 工具。
  </Tab>
  <Tab title="开启">
    `--claude-channel-mode on`：启用 Claude 渠道通知。
  </Tab>
  <Tab title="自动（默认）">
    `--claude-channel-mode auto`：当前默认值；桥接行为与 `on` 相同。
  </Tab>
</Tabs>

启用 Claude 渠道模式后，服务器会公布 Claude 实验性能力，并可发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站 `user` 转录记录消息会作为 `notifications/claude/channel` 转发
- 通过 MCP 接收的 Claude 权限请求会在内存中跟踪
- 如果关联对话中的命令所有者之后发送 `yes <id>` 或 `no <id>`（`<id>` 是不含 `l` 的 5 字母请求 ID），桥接会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅在实时会话期间有效；如果 MCP 客户端断开连接，则不存在推送目标

这是有意为特定客户端设计的行为。通用 MCP 客户端应依赖标准轮询工具。

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

对于大多数通用 MCP 客户端，请先使用标准工具界面，并忽略 Claude 模式。仅对真正理解 Claude 专用通知方法的客户端启用 Claude 模式。

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
如果可以，请优先使用 `--token-file` 或 `--password-file`，而不是内联密钥。
</Tip>

### 安全和信任边界

该桥接不会自行创建路由。它只公开 Gateway 网关已知道如何路由的对话。

这意味着：

- 发送者允许列表、配对和渠道级信任仍由底层 OpenClaw 渠道配置负责
- `messages_send` 只能通过现有的已存储路由进行回复
- 审批状态仅在当前桥接会话期间实时存于内存中
- 桥接身份验证应使用你信任的、与其他任何远程 Gateway 网关客户端相同的 Gateway 网关令牌或密码控制措施

如果 `conversations_list` 中缺少某个对话，通常不是由 MCP 配置导致的，而是底层 Gateway 网关会话中缺少路由元数据或路由元数据不完整。

### 测试

OpenClaw 为此桥接提供了确定性的 Docker 冒烟测试：

```bash
pnpm test:docker:mcp-channels
```

该冒烟测试运行单个容器：它预置对话状态、启动 Gateway 网关，然后将 `openclaw mcp serve` 作为 stdio 子进程启动，并以 MCP 客户端方式驱动它。它通过真实的 stdio MCP 桥接验证对话发现、转录读取、附件元数据读取、实时事件队列行为，以及 Claude 风格的渠道和权限通知。出站发送路由（`messages_send` 复用已存储的对话路由）由 `src/mcp/channel-server.test.ts` 中的单元测试单独覆盖。

无需在测试运行中接入真实的 Telegram、Discord 或 iMessage 账号，这是验证桥接正常工作的最快方式。

有关更广泛的测试背景，请参阅[测试](/zh-CN/help/testing)。

### 故障排查

<AccordionGroup>
  <Accordion title="未返回任何对话">
    通常表示 Gateway 网关会话尚不可路由。请确认底层会话已存储渠道/提供商、接收者，以及可选的账号/线程路由元数据。
  </Accordion>
  <Accordion title="events_poll 或 events_wait 遗漏较早的消息">
    这是预期行为。实时队列在桥接连接时启动。请使用 `messages_read` 读取较早的转录历史记录。
  </Accordion>
  <Accordion title="未显示 Claude 通知">
    请检查以下所有项目：

    - 客户端是否保持 stdio MCP 会话处于打开状态
    - `--claude-channel-mode` 是否为 `on` 或 `auto`
    - 客户端是否确实支持 Claude 专用的通知方法
    - 入站消息是否发生在桥接连接之后

  </Accordion>
  <Accordion title="缺少审批">
    `permissions_list_open` 仅显示桥接连接期间观察到的审批请求。它不是持久化的审批历史 API。
  </Accordion>
</AccordionGroup>

## 将 OpenClaw 用作 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload` 和 `unset` 路径。

这些命令不会通过 MCP 公开 OpenClaw。它们管理 OpenClaw 配置中 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器定义。它们不会从 `config/mcporter.json` 读取 mcporter 服务器。

这些保存的定义供 OpenClaw 之后启动或配置的运行时使用，例如嵌入式 OpenClaw 和其他运行时适配器。OpenClaw 集中存储这些定义，因此这些运行时无需维护各自重复的 MCP 服务器列表。

<AccordionGroup>
  <Accordion title="重要行为">
    - 这些命令只读取或写入 OpenClaw 配置
    - `status`、`list`、`show`、不带 `--probe` 的 `doctor`、`set`、`configure`、`tools`、`logout`、`reload` 和 `unset` 不会连接目标 MCP 服务器
    - `login` 为已配置的 HTTP 服务器执行 MCP OAuth 网络流程，并保存生成的本地凭据
    - `status --verbose` 会输出解析后的传输、身份验证、超时、过滤器和并行工具调用提示，而不建立连接
    - `doctor` 检查已保存的定义是否存在本地设置问题，例如缺少 stdio 命令、工作目录无效、缺少 TLS 文件、服务器已禁用、直接写入敏感标头/环境变量值，以及 OAuth 授权不完整
    - `doctor --probe` 会在静态检查通过后，添加与 `probe` 相同的实时连接验证
    - `probe` 连接所选服务器或所有已配置的服务器，列出工具，并报告能力/诊断信息
    - `add` 根据标志构建定义，并在保存前进行探测，除非设置了 `--no-probe`，或需要先完成 OAuth 授权
    - 运行时适配器在执行时决定它们实际支持哪些传输形式
    - `enabled: false` 会保留服务器定义，但将其排除在嵌入式运行时发现之外
    - `timeout` 和 `connectTimeout` 分别设置每台服务器的请求超时和连接超时，单位为秒
    - `supportsParallelToolCalls: true` 标记适配器可并发调用的服务器
    - HTTP 服务器可以使用静态标头、OAuth 登录、TLS 验证控制以及 mTLS 证书/密钥路径
    - 嵌入式 OpenClaw 会在常规 `coding` 和 `messaging` 工具配置中公开已配置的 MCP 工具；`minimal` 仍会隐藏它们，而 `tools.deny: ["bundle-mcp"]` 会显式禁用它们
    - 每台服务器的 `toolFilter.include` 和 `toolFilter.exclude` 会在发现的 MCP 工具成为 OpenClaw 工具前对其进行过滤
    - 声明资源或提示词的服务器还会公开用于列出/读取资源和列出/获取提示词的实用工具；这些生成的实用工具名称（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）使用相同的包含/排除过滤器
    - MCP 工具列表的动态变化会使该会话的缓存目录失效；下一次发现/使用时会从服务器刷新
    - 重复发生的 MCP 工具请求/协议故障会使该服务器短暂停用，防止单个故障服务器占用整个轮次
    - 会话范围的内置 MCP 运行时在空闲 `mcp.sessionIdleTtlMs` 毫秒后被回收（默认 10 分钟；设置为 `0` 可禁用），一次性嵌入式运行则会在运行结束时将其清理

  </Accordion>
</AccordionGroup>

运行时适配器可以将此共享注册表规范化为其下游客户端所需的形式。例如，嵌入式 OpenClaw 直接使用 OpenClaw 的 `transport` 值，而 Claude Code 和 Gemini 接收 CLI 原生的 `type` 值，例如 `http`、`sse` 或 `stdio`。

Codex app-server 还会处理每台服务器上可选的 `codex` 块。这些是仅用于 Codex app-server 线程的
OpenClaw 投影元数据；它不会更改
ACP 会话、通用 Codex harness 配置或其他运行时适配器。
使用非空的 `codex.agents` 可仅将服务器投影到特定的 OpenClaw
智能体 ID。配置验证会拒绝空列表、仅含空白项的列表或无效的智能体列表，
运行时投影路径也会将其省略，而不会使其变为
全局配置。使用 `codex.defaultToolsApprovalMode`（`auto`、`prompt` 或 `approve`）
可为受信任的服务器生成 Codex 原生的 `default_tools_approval_mode`。
OpenClaw 会在将原生 `mcp_servers`
配置交给 Codex 之前移除 `codex` 元数据。

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

- `list` 对服务器名称进行排序。
- 不带名称的 `show` 会输出完整的已配置 MCP 服务器对象。
- `status` 在不连接的情况下对已配置的传输进行分类。`--verbose` 包含解析后的启动、超时、OAuth、过滤器和并行调用详细信息。
- `doctor` 在不连接的情况下执行静态检查。如果该命令还应验证已启用的服务器能否连接，请添加 `--probe`。
- `probe` 会连接并报告工具数量、资源/提示词支持、列表变更支持和诊断信息。
- `add` 接受 `--command`、`--arg`、`--env` 和 `--cwd` 等 stdio 标志，或 `--url`、`--transport`、`--header`、`--auth oauth`、TLS、超时和工具选择标志等 HTTP 标志。
- `set` 要求在命令行中提供一个 JSON 对象值。
- `configure` 可更新启用状态、工具过滤器、超时、OAuth、TLS 和并行工具调用提示，而无需替换整个服务器定义。添加 `--probe` 可在保存前验证更新后的服务器。
- `tools` 更新每台服务器的工具过滤器。包含/排除条目为 MCP 工具名称和简单的 `*` glob。
- `login` 为配置了 `auth: "oauth"` 的 HTTP 服务器运行 OAuth 流程。首次运行会输出授权 URL；审批后使用 `--code` 重新运行。
- `logout` 清除指定服务器已存储的 OAuth 凭据，但不会移除已保存的服务器定义。
- `reload` 仅释放当前 CLI 进程中缓存的进程内 MCP 运行时。另一进程中的 Gateway 网关或智能体进程仍需使用各自的重新加载或重启路径。
- 对于 Streamable HTTP MCP 服务器，请使用 `transport: "streamable-http"`。为兼容起见，`openclaw mcp set` 还会将 CLI 原生的 `type: "http"` 规范化为相同的规范配置形式。
- 如果指定的服务器不存在，`unset` 会失败。

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

### 常用服务器配置方法

这些示例只保存服务器定义。之后请运行 `openclaw mcp doctor --probe`，以验证服务器能够启动并公开工具。

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

    将文件系统服务器的范围限制为智能体应读取或编辑的最小目录树。

  </Tab>
  <Tab title="记忆">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    如果服务器公开了不应供普通智能体使用的写入工具，请使用工具过滤器。

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

    `doctor` 会检查 `cwd` 是否存在，以及能否从已配置的环境中解析该命令。

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

    当远程服务器支持 OAuth 时，请使用 OAuth。如果服务器要求静态标头，请避免提交明文不记名令牌。

  </Tab>
  <Tab title="桌面/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接控制桌面的服务器会继承其所启动进程的权限。请使用范围严格的工具筛选器和操作系统级权限提示。

  </Tab>
</Tabs>

### JSON 输出结构

在脚本和仪表板中使用 `--json`。字段集合可能会随时间扩展，因此使用方应忽略未知键。

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
              "message": "OAuth 凭据尚未获得授权；请运行 openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    当任何已启用且经过检查的服务器存在 `error` 级别的问题时，`doctor --json` 会以非零状态退出。系统会报告 `warning` 和 `info` 问题，但它们本身不会导致命令失败。

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

    `probe --json` 会打开一个实时 MCP 客户端会话并直接输出结果；与 `status`/`doctor` 不同，其输出没有顶层 `path` 字段。仅当服务器实际声明相应能力时，才会出现 `resources` 和 `prompts` 键（没有提示词能力的服务器会省略 `prompts` 键，而不是将其报告为 `false`）。使用 `probe` 证明可达性和能力，不要将其用于静态配置审计。

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

启动本地子进程，并通过 stdin/stdout 通信。

| 字段                       | 说明                         |
| -------------------------- | ---------------------------- |
| `command`                  | 要启动的可执行文件（必需）   |
| `args`                     | 命令行参数数组               |
| `env`                      | 额外的环境变量               |
| `cwd` / `workingDirectory` | 进程的工作目录               |

<Warning>
**Stdio 环境变量安全筛选器**

在启动 stdio MCP 服务器之前，OpenClaw 会拒绝解释器启动、加载器劫持和 shell 初始化环境变量键，即使它们出现在服务器的 `env` 块中也是如此。此机制使用与 OpenClaw 启动的其他进程相同的宿主环境安全策略：它会阻止已知的解释器启动钩子（例如 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共享库和函数注入前缀（`DYLD_*`、`LD_*`、`BASH_FUNC_*`），以及类似的运行时控制变量。启动时会静默丢弃这些变量并记录警告，从而防止它们针对 stdio 进程注入隐式前导代码、替换解释器、启用调试器或劫持动态链接器。显式允许列表确保普通 MCP 凭据环境变量仍可使用（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`），普通代理和服务器专用环境变量也可使用（`HTTP_PROXY`、自定义 `*_API_KEY` 等）。其他 `AWS_*` 键（例如 `AWS_CONFIG_FILE` 和 `AWS_SHARED_CREDENTIALS_FILE`）仍会被阻止，因为它们指向凭据文件，而不是直接携带凭据值。

如果你的 MCP 服务器确实需要某个被阻止的变量，请在 Gateway 网关宿主进程上设置，而不要在 stdio 服务器的 `env` 下设置。
</Warning>

### SSE / HTTP 传输

通过 HTTP 服务器发送事件连接到远程 MCP 服务器。

| 字段                           | 说明                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| `url`                          | 远程服务器的 HTTP 或 HTTPS URL（必需）                       |
| `headers`                      | 可选的 HTTP 标头键值映射（例如身份验证令牌）                 |
| `connectionTimeoutMs`          | 每台服务器的连接超时时间，以毫秒为单位（可选）               |
| `connectTimeout`               | 每台服务器的连接超时时间，以秒为单位（可选）                 |
| `timeout` / `requestTimeoutMs` | 每台服务器的 MCP 请求超时时间，以秒或毫秒为单位              |
| `auth: "oauth"`                | 使用由 `openclaw mcp login` 保存的 MCP OAuth 凭据             |
| `sslVerify`                    | 仅对明确受信任的私有 HTTPS 端点设置为 false                  |
| `clientCert` / `clientKey`     | mTLS 客户端证书和密钥路径                                    |
| `supportsParallelToolCalls`    | 表明此服务器可安全执行并发调用的提示                         |

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

日志和状态输出中会遮盖 `url`（用户信息）及 `headers` 中的敏感值。当疑似敏感的 `headers` 或 `env` 条目包含明文值时，`openclaw mcp doctor` 会发出警告，以便操作员将这些值移出已提交的配置。

### OAuth 工作流

OAuth 适用于声明支持 MCP OAuth 流程的 HTTP MCP 服务器。当启用 `auth: "oauth"` 时，该服务器的静态 `Authorization` 标头会被忽略。由 `openclaw mcp login` 保存的凭据可用于嵌入式 MCP、CLI 运行器和本地 Codex 应用服务器。

在凭据可用之前，OpenClaw 只会从 Agent Runtimes 中省略该 MCP 服务器，而不会导致智能体轮次失败。之后，操作员或具有 shell 访问权限的智能体可以运行 `openclaw mcp login <name>`，并在后续轮次中使用该服务器。

当远程 MCP 服务已由另一个支持刷新的 OpenClaw 身份验证配置文件提供支持时，你可以选择设置 `oauth.authProfileId`。OpenClaw 会在运行时投影之前刷新任一凭据来源，并且只将当前访问令牌传递给下游 MCP 客户端。

<Steps>
  <Step title="保存服务器">
    使用 `auth: "oauth"` 和任何可选的 OAuth 元数据添加或更新服务器。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    对于由身份验证配置文件支持的不记名令牌，请保存配置文件绑定：

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="开始登录">
    运行登录命令以创建授权请求。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw 会输出授权 URL，并将临时 OAuth 验证器状态存储在 OpenClaw 状态目录下。

  </Step>
  <Step title="使用代码完成登录">
    在浏览器中批准后，将返回的代码传回 OpenClaw。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="检查授权">
    使用状态或 Doctor 确认令牌存在。

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

如果提供商轮换了令牌或授权状态卡住，请运行 `openclaw mcp logout <name>`，然后重新执行 `login`。即使已从配置中删除 `auth: "oauth"`，只要服务器名称和 URL 仍能标识凭据存储条目，`logout` 也可以清除已保存 HTTP 服务器的凭据。

### 可流式传输的 HTTP 传输

`streamable-http` 是除 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| 字段                           | 描述                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | 远程服务器的 HTTP 或 HTTPS URL（必填）                                                 |
| `transport`                    | 设为 `"streamable-http"` 以选择此传输方式；省略时，OpenClaw 使用 `sse`                 |
| `headers`                      | 可选的 HTTP 标头键值映射（例如身份验证令牌）                                           |
| `connectionTimeoutMs`          | 每个服务器的连接超时时间，以 ms 为单位（可选）                                         |
| `connectTimeout`               | 每个服务器的连接超时时间，以秒为单位（可选）                                           |
| `timeout` / `requestTimeoutMs` | 每个服务器的 MCP 请求超时时间，以秒或 ms 为单位                                        |
| `auth: "oauth"`                | 使用由 `openclaw mcp login` 保存的 MCP OAuth 凭据                                      |
| `sslVerify`                    | 仅对明确受信任的私有 HTTPS 端点设为 false                                              |
| `clientCert` / `clientKey`     | mTLS 客户端证书和密钥路径                                                              |
| `supportsParallelToolCalls`    | 提示此服务器可安全处理并发调用                                                         |

OpenClaw 配置使用 `transport: "streamable-http"` 作为规范写法。通过 `openclaw mcp set` 保存时接受 CLI 原生 MCP 的 `type: "http"` 值，并且 `openclaw doctor --fix` 会修复现有配置中的此类值，但嵌入式 OpenClaw 直接使用的是 `transport`。

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
注册表命令不会启动渠道桥接。只有 `probe` 和 `doctor --probe` 会打开实时 MCP 客户端会话，以验证目标服务器可访问。
</Note>

## Control UI

浏览器 Control UI 在 `/settings/mcp` 提供了专用的 MCP 设置页面；之前的 `/mcp` 路径仍作为别名保留。该页面会显示已配置的服务器数量、已启用/OAuth/筛选器摘要、各服务器的传输方式行、启用/禁用控件、常用 CLI 命令，以及用于编辑 `mcp` 配置部分的限定范围编辑器。

使用此页面进行操作员编辑和快速清点。当你需要实时服务器验证时，请使用 `openclaw mcp doctor --probe` 或 `openclaw mcp probe`。

操作员工作流：

1. 打开 Control UI 并选择 **MCP**。
2. 查看摘要卡片，了解服务器总数、已启用服务器、OAuth 服务器和已筛选服务器。
3. 使用每个服务器行查看传输方式、身份验证、筛选器、超时和命令提示。
4. 如果你希望保留定义但将其排除在运行时发现之外，请切换启用状态。
5. 编辑限定范围的 `mcp` 配置部分，以进行新增服务器、标头、TLS、OAuth 元数据或工具筛选器等结构性更改。
6. 选择 **Save** 仅持久化配置，或选择 **Save & Publish** 通过 Gateway 网关配置路径应用配置。
7. 当你需要实时验证编辑后的服务器能够启动并列出工具时，请运行 `openclaw mcp doctor --probe`。

注意：

- 命令片段会为服务器名称加引号，因此名称特殊时仍可复制到 shell 中使用
- 如果显示的类 URL 值包含嵌入式凭据，会在渲染前对其进行遮盖
- 该页面本身不会启动 MCP 传输
- 根据 MCP 客户端所属的进程，活跃运行时可能需要执行 `openclaw mcp reload`、发布 Gateway 网关配置或重启进程

## MCP Apps

OpenClaw 可以渲染实现稳定版 [MCP Apps 扩展](https://modelcontextprotocol.io/extensions/apps)的工具。Apps 需要显式启用，因为其 HTML 来自已配置的 MCP 服务器，并且可以请求同一服务器上对 App 可见的工具或资源。

启用主机桥接：

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

更改此设置后，请重启 Gateway 网关。启用后，OpenClaw 会在 Gateway 网关端口加一的端口上启动仅限沙箱使用的 HTTP(S) 监听器（对于默认 Gateway 网关，该端口为 `18790`）。Control UI 从这个独立源加载 Apps；该监听器绝不会提供 Control UI、已通过身份验证的 Gateway 网关路由或用户数据。

直接连接 Gateway 网关时需要能够访问这两个端口。如果通过反向代理或 TLS 终止器公开 Control UI，请为 Apps 提供专用公共源，并且仅将该源代理到沙箱监听器：

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

沙箱源必须与 Control UI 源不同。不要在该源上托管其他已通过身份验证或敏感的内容。

例如，官方基础 React 演示可以配置为：

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

- 仅当 Apps 已启用时，OpenClaw 才会通告 `io.modelcontextprotocol/ui` 扩展。
- 仅渲染 MIME 类型严格为 `text/html;profile=mcp-app` 的 `ui://` 资源。
- UI 资源大小上限为 2 MiB，它们会置于专用外层源上的双 iframe 代理之后，加载到不透明的内层 App 源中，并受根据资源元数据生成的 CSP 约束。
- 仅限 App 使用的工具（`_meta.ui.visibility: ["app"]`）不会出现在模型工具列表中。Apps 只能调用其所属服务器上对 App 可见的工具。
- 当内层 App 文档使用不透明源实现跨 App 隔离时，不会授予与源绑定的 App 权限，例如摄像头、麦克风和地理位置权限。
- App HTML、完整工具参数和原始结果会保存在有界的十分钟内存视图租约中。它们不会写入磁盘，也不会复制到会话记录预览元数据中，并且过期的视图不会重启其 MCP 运行时。
- 桥接启用时，`openclaw security audit` 会发出警告。不需要桥接时，请使用 `openclaw config set mcp.apps.enabled false --strict-json` 将其禁用。

## 当前限制

本页面记录当前已发布桥接的行为。

当前限制：

- 对话发现依赖现有的 Gateway 网关会话路由元数据
- 除 Claude 专用适配器外，暂无通用推送协议
- 尚无消息编辑或表情回应工具
- HTTP/SSE/streamable-http 传输连接到单个远程服务器；尚不支持上游多路复用
- `permissions_list_open` 仅包含桥接连接期间观察到的审批

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [插件](/zh-CN/cli/plugins)
