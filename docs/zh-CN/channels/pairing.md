---
read_when:
    - 设置私信访问控制
    - 配对新的 iOS/Android 节点
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以向你发送私信，以及哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-07-14T13:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

“配对”是 OpenClaw 明确的访问审批步骤。
它用于两个方面：

1. **私信配对**（允许谁与机器人对话）
2. **节点配对**（允许哪些设备/节点加入 Gateway 网关网络）

安全上下文：[安全](/zh-CN/gateway/security)

## 1）私信配对（入站聊天访问）

当渠道配置了私信策略 `pairing` 时，未知发送者会收到一个短代码，在你批准之前，其消息**不会被处理**。

默认私信策略记录于：[安全](/zh-CN/gateway/security)

仅当有效私信允许列表包含 `"*"` 时，`dmPolicy: "open"` 才是公开的。
公开开放配置的设置和验证要求使用该通配符。如果现有
状态包含带有具体 `allowFrom` 条目的 `open`，运行时仍然仅允许
这些发送者，且配对存储中的批准不会扩大 `open` 访问权限。

配对代码：

- 8 个字符、大写、不含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人仅在创建新请求时发送配对消息（每位发送者大约每小时一次）。
- 待处理的私信配对请求上限为**每个渠道账户 3 个**；在其中一个请求过期或获批之前，其他请求将被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

在批准命令中添加 `--notify`，可通过同一渠道通知请求者。多账户渠道接受 `--account <id>`。

如果尚未配置命令所有者，批准私信配对代码还会将
`commands.ownerAllowFrom` 引导设置为已批准的发送者，例如 `telegram:123456789`。
这会为首次设置明确指定一位所有者，用于特权命令和 Exec
审批提示。所有者存在后，后续配对批准仅授予私信
访问权限；不会添加更多所有者。

支持的渠道（任何声明配对功能的已安装渠道插件；`openclaw-weixin` 等外部插件可以添加更多渠道）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用的发送者组

当同一组受信任发送者需要应用于
多个消息渠道，或同时应用于私信和群组允许列表时，请使用顶层 `accessGroups`。

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

访问组的详细文档见：[访问组](/zh-CN/channels/access-groups)

### 状态存储位置

存储在共享 SQLite 状态数据库
`~/.openclaw/state/openclaw.sqlite` 中：

- `channel_pairing_requests` 中的待处理请求
- `channel_pairing_allow_entries` 中的已批准发送者

账户范围行为：

- 每个请求和已批准发送者均按渠道和账户作为键
- 运行时仅读取规范 SQLite 行；不会合并旧文件

旧版 Gateway 网关会在 `~/.openclaw/credentials/` 下写入
`<channel>-pairing.json` 和 `<channel>-<accountId>-allowFrom.json`。
启动迁移和 `openclaw doctor --fix` 会将这些文件导入 SQLite，并在
成功导入后移除每个源文件。请将 SQLite 数据库视为
敏感数据，因为这些行控制着对你的助手的访问权限。

<Note>
配对允许列表存储用于私信访问。群组授权与之独立。
批准私信配对代码不会自动允许该发送者在群组中运行
命令或控制机器人。首位所有者引导设置是 `commands.ownerAllowFrom` 中单独的配置
状态，群聊投递仍遵循渠道的群组允许列表（例如 `groupAllowFrom`、`groups`，或者根据渠道使用按群组
或按话题的覆盖设置）。
</Note>

## 2）节点设备配对（iOS/Android/macOS/无头节点）

节点以具有 `role: node` 的**设备**身份连接到 Gateway 网关。Gateway 网关
会创建设备配对请求，必须批准该请求。

### 从 Control UI 配对（推荐）

使用已经连接且具有 `operator.admin` 访问权限的 Control UI 会话：

1. 打开 Control UI，然后前往 **Settings → Devices**。
2. 在 **Devices** 页面上，点击 **Pair mobile device**。
3. 保留 **Full access (recommended)**，或选择 **Limited access** 以省略
   Gateway 网关管理控制权限。
4. 点击 **Create setup code**。
5. 在手机上打开 OpenClaw 应用 → **Settings** → **Gateway**。
6. 扫描二维码或粘贴设置代码，然后连接。

当官方 OpenClaw iOS 和 Android 应用的
设置代码元数据匹配时，它们会自动获批。如果 **Pending approval** 显示请求（例如
来自非官方客户端或元数据不匹配），请在批准前检查其角色和
权限范围。

当当前 Control UI 会话没有
管理员访问权限时，该按钮会被禁用。在这种情况下，请在 Gateway 网关主机上使用下方的 CLI 审批流程。

### 通过 Telegram 配对

如果使用 `device-pair` 插件，则可以完全通过 Telegram 进行首次设备配对：

1. 在 Telegram 中向你的机器人发送消息：`/pair`
2. 机器人会回复两条消息：一条说明消息和一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在手机上打开 OpenClaw iOS 应用 → Settings → Gateway。
4. 扫描二维码（`/pair qr`）或粘贴设置代码并连接。
5. 官方移动应用会自动连接。如果 `/pair pending` 显示
   请求，请在批准前检查其角色和权限范围。

设置代码是经过 base64 编码的 JSON 有效负载，其中包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `urls`：如果可用，移动应用可以尝试的有序 LAN/Tailnet 路由
- `bootstrapToken`：用于初始配对握手的一次性引导令牌；Gateway 网关会在 10 分钟后使其过期

配对完成后，运行 `/pair cleanup` 使未使用的设置代码失效。

该引导令牌携带内置配对引导配置文件：

- 安全的 `wss://` 设置（或同一主机的环回连接）默认为 `node`，并具有完整的
  原生移动端 `operator` 访问权限
- 移交的 `node` 令牌保持为 `scopes: []`
- 默认移交的 `operator` 令牌包含 `operator.admin`、
  `operator.approvals`、`operator.read`、`operator.talk.secrets` 和
  `operator.write`
- Control UI 的 **Limited access** 和 `openclaw qr --limited` 会省略
  `operator.admin`，同时保留其他操作员权限范围
- 明文 LAN `ws://` 设置会自动使用相同的受限配置文件；
  请配置 `wss://` 或 Tailscale Serve，并生成新代码以获得完整访问权限
- 后续令牌轮换/吊销仍同时受设备已批准的
  角色契约和调用方会话操作员权限范围的约束

设置代码有效期间，请像对待密码一样保护它。

iOS 和 Android 的 **Settings → Gateway** 页面会显示 **Full** 或 **Limited**
访问权限。要升级访问受限的手机，请先配置安全的 `wss://` 或
Tailscale Serve 路由，然后生成新的完整访问设置代码，在该设置页面中扫描或粘贴
此代码，并重新连接。

对于 Tailscale、公共或其他远程移动端配对，请使用 Tailscale Serve/Funnel
或其他 `wss://` Gateway 网关 URL。明文 `ws://` 设置代码仅接受
用于环回地址、私有 LAN 地址、`.local` Bonjour 主机和 Android
模拟器主机。非环回明文路由会获得受限访问权限。Tailnet
CGNAT 地址、`.ts.net` 名称和公共主机在生成
二维码/设置代码前仍会采用失败时关闭策略。

对于 `gateway.bind=lan` 设置 URL，OpenClaw 会检测代理活动 Gateway 网关
环回端口的持久 Tailscale Serve HTTPS 根地址，并将其与 LAN 路由一起公布。设置命令仅
为 `lan` 添加此后备选项；`custom` 和 `tailnet` 保留其明确公布的路由。iOS
应用会按顺序探测公布的路由，并保存第一个可达的
端点。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

当显式审批因执行审批的已配对设备会话
仅以配对权限范围打开而遭拒时，CLI 会使用
`operator.admin` 重试同一请求。这样，具有管理员能力的现有已配对设备就能恢复新的
Control UI/浏览器配对，而无需手动编辑配对存储。
Gateway 网关仍会验证重试的连接；无法使用
`operator.admin` 进行身份验证的令牌仍会被阻止。

如果同一设备使用不同的身份验证详细信息重试（例如不同的
角色/权限范围/公钥），先前的待处理请求会被取代，并创建新的
`requestId`。

<Note>
已配对设备不会无提示地获得更广泛的访问权限。如果它重新连接时请求更多权限范围或更广泛的角色，OpenClaw 会保持现有批准不变，并创建新的待处理升级请求。在批准前，请使用 `openclaw devices list` 比较当前已批准的访问权限和新请求的访问权限。
</Note>

### 可选的受信任 CIDR 节点自动批准

默认情况下，设备配对仍需手动进行。对于严格管控的节点网络，
可以使用显式 CIDR 或确切 IP，选择启用首次节点自动批准：

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

这仅适用于没有请求权限范围的新 `role: node` 配对请求。
操作员、浏览器、Control UI 和 WebChat 客户端仍需要手动
批准。角色、权限范围、元数据和公钥更改仍需要手动
批准。

### 节点配对状态存储

存储在共享 SQLite 状态数据库 `~/.openclaw/state/openclaw.sqlite` 中：

- 待处理的设备配对请求（短期有效；5 分钟后过期）
- 已配对设备 + 令牌

旧版 Gateway 网关将此状态保存在 `~/.openclaw/devices/*.json` 中；这些文件会
在 Gateway 网关启动时导入 SQLite，并使用 `.migrated` 后缀归档。

### 注意事项

- `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）管理
  存储在相同已配对设备记录上的节点能力批准。WS 节点
  仍需要设备配对；请参阅[节点配对](/zh-CN/gateway/pairing)。
- 配对记录是已批准角色的持久事实来源。活动
  设备令牌始终受该已批准角色集的约束；已批准角色之外的
  孤立令牌条目不会创建新的访问权限。

## 相关文档

- 安全模型 + 提示词注入：[安全](/zh-CN/gateway/security)
- 安全更新（运行 Doctor）：[更新](/zh-CN/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/zh-CN/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-CN/channels/whatsapp)
  - Signal：[Signal](/zh-CN/channels/signal)
  - iMessage：[iMessage](/zh-CN/channels/imessage)
  - Discord：[Discord](/zh-CN/channels/discord)
  - Slack：[Slack](/zh-CN/channels/slack)
