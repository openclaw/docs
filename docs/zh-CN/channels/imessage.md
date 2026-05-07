---
read_when:
    - 设置 iMessage 支持
    - 调试 iMessage 发送/接收
summary: 通过 imsg 提供原生 iMessage 支持（通过 stdio 的 JSON-RPC）。当满足主机要求时，这是新 OpenClaw iMessage 设置的首选方式。
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
对于新的 OpenClaw iMessage 部署，如果你可以在已登录的 macOS Messages 主机上运行 `imsg`，请从这里开始。对于依赖其 HTTP 服务器、webhooks 或更丰富私有 API 操作的现有设置，BlueBubbles 仍可作为旧版回退方案使用。
</Note>

Status：原生外部 CLI 集成。Gateway 网关会生成 `imsg rpc`，并通过 stdio 上的 JSON-RPC 通信（没有单独的守护进程/端口）。

<CardGroup cols={3}>
  <Card title="BlueBubbles (legacy fallback)" icon="message-circle" href="/zh-CN/channels/bluebubbles">
    对于现有由 BlueBubbles 支撑的路由，请继续使用它；如果 imsg 适合新设置，请避免使用它。
  </Card>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/zh-CN/gateway/config-channels#imessage">
    完整的 iMessage 字段参考。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配对请求会在 1 小时后过期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw 只需要一个兼容 stdio 的 `cliPath`，因此你可以将 `cliPath` 指向一个包装脚本，该脚本通过 SSH 连接到远程 Mac 并运行 `imsg`。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    启用附件时的推荐配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本来自动检测它。
    `remoteHost` 必须是 `host` 或 `user@host`（不能包含空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会按允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

  </Tab>
</Tabs>

## 要求和权限（macOS）

- 运行 `imsg` 的 Mac 必须已登录 Messages。
- 运行 OpenClaw/`imsg` 的进程上下文需要完整磁盘访问权限（用于访问 Messages 数据库）。
- 通过 Messages.app 发送消息需要自动化权限。

<Tip>
权限按进程上下文授予。如果 Gateway 网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    允许名单字段：`channels.imessage.allowFrom`。

    允许名单条目可以是句柄或聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（已配置时默认）
    - `open`
    - `disabled`

    群组发送者允许名单：`channels.imessage.groupAllowFrom`。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查会在可用时回退到 `allowFrom`。
    运行时说明：如果 `channels.imessage` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 如果没有配置模式，则无法强制执行提及门控

    来自授权发送者的控制命令可以绕过群组中的提及门控。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main` 时，iMessage 私信会折叠到智能体主会话中。
    - 群组会话会被隔离（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复会使用来源渠道/目标元数据路由回 iMessage。

    类群组线程行为：

    一些多参与者 iMessage 线程可能会以 `is_group=false` 到达。
    如果该 `chat_id` 在 `channels.imessage.groups` 下明确配置，OpenClaw 会将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

旧版 iMessage 聊天也可以绑定到 ACP 会话。

快速操作流程：

- 在私信或允许的群组聊天中运行 `/acp spawn codex --bind here`。
- 该同一 iMessage 对话中的后续消息会路由到生成的 ACP 会话。
- `/new` 和 `/reset` 会在原处重置同一个已绑定 ACP 会话。
- `/acp close` 会关闭 ACP 会话并移除绑定。

通过顶层 `bindings[]` 条目支持配置的持久绑定，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 规范化的私信句柄，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（推荐用于稳定群组绑定）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

参见 [ACP Agents](/zh-CN/tools/acp-agents)，了解共享 ACP 绑定行为。

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    使用专用 Apple ID 和 macOS 用户，使 bot 流量与你的个人 Messages 资料隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用 bot Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装脚本，使 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户资料。

    首次运行可能需要在该 bot 用户会话中进行 GUI 批准（自动化 + 完整磁盘访问权限）。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    常见拓扑：

    - Gateway 网关在 Linux/VM 上运行
    - iMessage + `imsg` 在你的 tailnet 中的一台 Mac 上运行
    - `cliPath` 包装脚本使用 SSH 运行 `imsg`
    - `remoteHost` 启用 SCP 附件获取

    示例：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    使用 SSH 密钥，使 SSH 和 SCP 都可以非交互运行。
    请先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以填充 `known_hosts`。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage 支持在 `channels.imessage.accounts` 下进行按账号配置。

    每个账号都可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置和附件根目录允许名单等字段。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 入站附件摄取是可选的：`channels.imessage.includeAttachments`
    - 设置 `remoteHost` 后，可通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 默认根目录模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用严格的主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

  </Accordion>

  <Accordion title="Outbound chunking">
    - 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 分块模式：`channels.imessage.chunkMode`
      - `length`（默认）
      - `newline`（优先按段落拆分）

  </Accordion>

  <Accordion title="Addressing formats">
    首选显式目标：

    - `chat_id:123`（推荐用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支持句柄目标：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许由渠道发起的配置写入（当 `commands.config: true` 时用于 `/config set|unset`）。

禁用：

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    验证二进制文件和 RPC 支持：

```bash
imsg rpc --help
openclaw channels status --probe
```

    如果探测报告不支持 RPC，请更新 `imsg`。

  </Accordion>

  <Accordion title="DMs are ignored">
    检查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配对批准（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="Group messages are ignored">
    检查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 允许名单行为
    - 提及模式配置（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="Remote attachments fail">
    检查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 来自 Gateway 网关主机的 SSH/SCP 密钥认证
    - Gateway 网关主机上的 `~/.ssh/known_hosts` 中存在主机密钥
    - 运行 Messages 的 Mac 上远程路径的可读性

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    在相同用户/会话上下文中的交互式 GUI 终端里重新运行，并批准提示：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    确认为运行 OpenClaw/`imsg` 的进程上下文授予了完整磁盘访问权限 + 自动化权限。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [配置参考 - iMessage](/zh-CN/gateway/config-channels#imessage)
- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [Pairing](/zh-CN/channels/pairing)
- [BlueBubbles](/zh-CN/channels/bluebubbles)

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
