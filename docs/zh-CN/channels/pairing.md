---
read_when:
    - 设置私信访问控制
    - 配对新的 iOS/Android 节点
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以向你发送私信，以及哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-07-12T14:19:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

“配对”是 OpenClaw 明确的访问批准步骤。
它用于两个地方：

1. **私信配对**（允许谁与 Bot 对话）
2. **节点配对**（允许哪些设备/节点加入 Gateway 网关网络）

安全上下文：[安全](/zh-CN/gateway/security)

## 1）私信配对（入站聊天访问）

当渠道配置的私信策略为 `pairing` 时，未知发送者会收到一个短代码，并且在你批准之前，其消息**不会被处理**。

默认私信策略记录于：[安全](/zh-CN/gateway/security)

仅当有效的私信允许列表包含 `"*"` 时，`dmPolicy: "open"` 才会公开访问。
公开开放配置的设置和验证要求使用该通配符。如果现有状态包含 `open`
以及具体的 `allowFrom` 条目，运行时仍只允许这些发送者，而配对存储中的批准
不会扩大 `open` 的访问范围。

配对代码：

- 8 个字符、大写、不含易混淆字符（`0O1I`）。
- **1 小时后过期**。仅当创建新请求时，Bot 才会发送配对消息（大约每个发送者每小时一次）。
- 待处理的私信配对请求上限为**每个渠道账号 3 个**；在其中一个请求过期或获批之前，额外请求会被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

在批准命令中添加 `--notify`，即可在同一渠道通知请求者。多账号渠道需使用 `--account <id>`。

如果尚未配置命令所有者，批准私信配对代码还会将
`commands.ownerAllowFrom` 初始化为获批发送者，例如 `telegram:123456789`。
这样，首次设置就会拥有一个明确的所有者，用于特权命令和 Exec
批准提示。存在所有者后，后续配对批准仅授予私信
访问权限，不会添加更多所有者。

支持的渠道（任何声明支持配对的已安装渠道插件；`openclaw-weixin` 等外部插件可以添加更多渠道）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用的发送者组

当同一组可信发送者需要应用于多个消息渠道，或者同时应用于私信和群组允许列表时，
请使用顶层 `accessGroups`。

静态组使用 `type: "message.senders"`，并通过渠道允许列表中的
`accessGroup:<name>` 引用：

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

访问组的详细说明请参阅：[访问组](/zh-CN/channels/access-groups)

### 状态的存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准的允许列表存储：`<channel>-<accountId>-allowFrom.json`（默认账号的批准使用
  `<channel>-default-allowFrom.json`）

账号范围行为：

- 非默认账号仅在其范围对应的允许列表文件中读写。
- 默认账号还会继续使用旧版安装中的无范围 `<channel>-allowFrom.json`
  文件；读取时会合并两个文件中的条目。

请将这些文件视为敏感信息（它们控制对你的助手的访问权限）。

<Note>
配对允许列表存储用于私信访问。群组授权是独立的。
批准私信配对代码不会自动允许该发送者执行群组
命令或在群组中控制 Bot。首位所有者初始化是
`commands.ownerAllowFrom` 中独立的配置状态，而群聊消息传递仍遵循
渠道的群组允许列表（例如 `groupAllowFrom`、`groups`，或根据渠道使用的
按群组或按话题覆盖）。
</Note>

## 2）节点设备配对（iOS/Android/macOS/无界面节点）

节点以 `role: node` 的**设备**身份连接到 Gateway 网关。Gateway 网关
会创建设备配对请求，该请求必须获得批准。

### 从 Control UI 配对（推荐）

使用已连接且具有 `operator.admin` 访问权限的 Control UI 会话：

1. 打开 Control UI 并选择**节点**。
2. 在**设备**页面上，点击**配对移动设备**。
3. 在手机上打开 OpenClaw 应用 → **设置** → **Gateway 网关**。
4. 扫描二维码或粘贴设置代码，然后连接。

如果官方 OpenClaw iOS 和 Android 应用的设置代码元数据匹配，它们会自动获批。
如果**待批准**显示了请求（例如来自非官方客户端或元数据不匹配），请先检查其角色和
权限范围，再批准请求。

如果当前 Control UI 会话没有管理员访问权限，该按钮将被禁用。
在这种情况下，请在 Gateway 网关主机上使用下面的 CLI 批准流程。

### 通过 Telegram 配对

如果使用 `device-pair` 插件，你可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中向你的 Bot 发送消息：`/pair`
2. Bot 会回复两条消息：一条说明消息，以及另一条独立的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在手机上打开 OpenClaw iOS 应用 → 设置 → Gateway 网关。
4. 扫描二维码（`/pair qr`）或粘贴设置代码并连接。
5. 官方移动应用会自动连接。如果 `/pair pending` 显示了
   请求，请先检查其角色和权限范围，再批准请求。

设置代码是一个使用 base64 编码的 JSON 载荷，其中包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `urls`：可用时，移动应用可以依次尝试的 LAN/Tailnet 路由
- `bootstrapToken`：用于初始配对握手的一次性引导令牌；Gateway 网关会在 10 分钟后使其过期

配对完成后，运行 `/pair cleanup` 使未使用的设置代码失效。

该引导令牌携带内置的配对引导配置：

- 内置设置配置仅允许新的二维码/设置代码基线：
  `node` 加受限的 `operator` 移交
- 移交的 `node` 令牌保持为 `scopes: []`
- 移交的 `operator` 令牌仅限于 `operator.approvals`、
  `operator.read`、`operator.talk.secrets` 和 `operator.write`
- 二维码/设置代码引导不会授予 `operator.admin`；它需要
  单独获批的操作员配对或令牌流程
- 后续令牌轮换/撤销仍同时受设备获批的
  角色契约和调用方会话的操作员权限范围约束

设置代码有效期间，请像对待密码一样保护它。

对于 Tailscale、公共网络或其他远程移动设备配对，请使用 Tailscale Serve/Funnel
或其他 `wss://` Gateway 网关 URL。明文 `ws://` 设置代码仅适用于
loopback、私有 LAN 地址、`.local` Bonjour 主机和 Android
模拟器主机。Tailnet CGNAT 地址、`.ts.net` 名称和公共主机仍会
在签发二维码/设置代码之前采用故障关闭策略。

对于 `gateway.bind=lan` 设置 URL，OpenClaw 会检测将流量代理到当前 Gateway 网关
loopback 端口的持久 Tailscale Serve HTTPS 根地址，并将其与
LAN 路由一同发布。设置命令仅为 `lan` 添加此回退；
`custom` 和 `tailnet` 会保留其明确发布的路由。iOS 应用会按顺序探测
已发布的路由，并保存第一个可访问的端点。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果明确批准因为执行批准的已配对设备会话仅以配对权限范围打开而被拒绝，
CLI 会使用 `operator.admin` 重试同一请求。这样，已有且具备管理员能力的
已配对设备便可恢复新的 Control UI/浏览器配对，而无须手动编辑配对存储。
Gateway 网关仍会验证重试的连接；无法使用 `operator.admin` 完成身份验证的
令牌仍会被阻止。

如果同一设备使用不同的身份验证详细信息重试（例如不同的
角色/权限范围/公钥），之前的待处理请求会被取代，并创建新的
`requestId`。

<Note>
已配对设备不会在没有提示的情况下获得更广泛的访问权限。如果它重新连接并请求更多权限范围或更广泛的角色，OpenClaw 会保持现有批准不变，并创建新的待处理升级请求。在批准之前，请使用 `openclaw devices list` 比较当前获批的访问权限与新请求的访问权限。
</Note>

### 可选的可信 CIDR 节点自动批准

默认情况下，设备配对仍需手动完成。对于严格控制的节点网络，
你可以通过明确的 CIDR 或精确 IP 地址，选择启用首次节点自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

这仅适用于未请求权限范围的全新 `role: node` 配对请求。
操作员、浏览器、Control UI 和 WebChat 客户端仍需手动
批准。角色、权限范围、元数据和公钥变更仍需手动
批准。

### 节点配对状态存储

存储在 `~/.openclaw/state/openclaw.sqlite` 的共享 SQLite 状态数据库中：

- 待处理的设备配对请求（生命周期很短；5 分钟后过期）
- 已配对设备和令牌

旧版 Gateway 网关将此状态保存在 `~/.openclaw/devices/*.json` 中；这些文件会在
Gateway 网关启动时导入 SQLite，并使用 `.migrated` 后缀归档。

### 注意事项

- `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）管理
  存储在同一已配对设备记录中的节点能力批准。WS 节点
  仍需设备配对；请参阅[节点配对](/zh-CN/gateway/pairing)。
- 配对记录是已批准角色的持久事实来源。有效的
  设备令牌仍受该已批准角色集合约束；已批准角色之外的零散令牌条目
  不会创建新的访问权限。

## 相关文档

- 安全模型和提示词注入：[安全](/zh-CN/gateway/security)
- 安全更新（运行 Doctor）：[更新](/zh-CN/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/zh-CN/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-CN/channels/whatsapp)
  - Signal：[Signal](/zh-CN/channels/signal)
  - iMessage：[iMessage](/zh-CN/channels/imessage)
  - Discord：[Discord](/zh-CN/channels/discord)
  - Slack：[Slack](/zh-CN/channels/slack)
