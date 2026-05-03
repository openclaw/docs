---
read_when:
    - 设置私信访问控制
    - 配对新的 iOS/Android 节点
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以给你发私信 + 哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-05-03T23:54:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“配对”是 OpenClaw 的显式访问批准步骤。
它用于两个位置：

1. **私信配对**（谁可以与机器人对话）
2. **节点配对**（哪些设备/节点可以加入 Gateway 网关网络）

安全上下文：[安全](/zh-CN/gateway/security)

## 1) 私信配对（入站聊天访问）

当某个渠道配置为私信策略 `pairing` 时，未知发送者会收到一个短代码，并且在你批准之前，他们的消息**不会被处理**。

默认私信策略记录在：[安全](/zh-CN/gateway/security)

`dmPolicy: "open"` 仅当有效私信允许列表包含 `"*"` 时才是公开的。
设置和验证要求公开开放配置使用该通配符。如果现有
状态包含 `open` 且带有具体的 `allowFrom` 条目，运行时仍然只允许
这些发送者，并且配对存储中的批准不会扩大 `open` 访问范围。

配对码：

- 8 个字符，大写，不含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人只会在创建新请求时发送配对消息（每个发送者大约每小时一次）。
- 待处理的私信配对请求默认每个渠道上限为 **3 个**；额外请求会被忽略，直到有请求过期或获批。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未配置命令所有者，批准私信配对码也会将
`commands.ownerAllowFrom` 引导设置为已批准的发送者，例如 `telegram:123456789`。
这会为首次设置提供一个显式所有者，用于特权命令和 exec
批准提示。所有者存在后，后续配对批准只授予私信
访问权限；它们不会添加更多所有者。

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用的发送者组

当同一组受信任发送者应适用于多个消息渠道，或同时适用于私信和群组允许列表时，请使用顶层 `accessGroups`。

静态组使用 `type: "message.senders"`，并通过
渠道允许列表中的 `accessGroup:<name>` 引用：

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

访问组的详细文档在这里：[访问组](/zh-CN/channels/access-groups)

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准允许列表存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户作用域行为：

- 非默认账户只读写其作用域内的允许列表文件。
- 默认账户使用渠道作用域的未限定作用域允许列表文件。

请将这些文件视为敏感内容（它们控制对你的助手的访问）。

<Note>
配对允许列表存储用于私信访问。群组授权是分开的。
批准私信配对码不会自动允许该发送者运行群组
命令或在群组中控制机器人。首个所有者引导是单独的配置
状态，位于 `commands.ownerAllowFrom`，群组聊天投递仍然遵循
该渠道的群组允许列表（例如 `groupAllowFrom`、`groups`，或根据渠道不同使用每群组
或每主题覆盖）。
</Note>

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以 `role: node` 的**设备**身份连接到 Gateway 网关。Gateway 网关
会创建设备配对请求，必须批准该请求。

### 通过 Telegram 配对（推荐用于 iOS）

如果你使用 `device-pair` 插件，可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中，向你的机器人发送消息：`/pair`
2. 机器人会回复两条消息：一条说明消息，以及一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在手机上打开 OpenClaw iOS 应用 → 设置 → Gateway 网关。
4. 粘贴设置代码并连接。
5. 回到 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

设置代码是一个 base64 编码的 JSON 载荷，包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导令牌

该引导令牌携带内置配对引导配置文件：

- 主要交接的 `node` 令牌保持 `scopes: []`
- 任何交接的 `operator` 令牌都限定在引导允许列表内：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 引导作用域检查按角色加前缀，而不是一个扁平作用域池：
  operator 作用域条目只满足 operator 请求，非 operator 角色
  仍必须在其自己的角色前缀下请求作用域
- 后续令牌轮换/吊销仍同时受设备已批准
  角色合约和调用方会话 operator 作用域的限制

设置代码有效期间，请像对待密码一样对待它。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

当显式批准被拒绝，原因是执行批准的已配对设备会话
以仅配对作用域打开时，CLI 会使用
`operator.admin` 重试同一请求。这让现有具备管理员能力的已配对设备无需手动编辑
`devices/paired.json`，即可恢复新的
Control UI/浏览器配对。Gateway 网关仍会验证重试的连接；无法使用
`operator.admin` 进行身份验证的令牌仍会被阻止。

如果同一设备使用不同身份验证详情重试（例如不同的
角色/作用域/公钥），先前的待处理请求会被取代，并创建新的
`requestId`。

<Note>
已配对设备不会静默获得更宽的访问权限。如果它重新连接时请求更多作用域或更宽的角色，OpenClaw 会保持现有批准不变，并创建一个新的待处理升级请求。批准之前，请使用 `openclaw devices list` 对比当前已批准访问权限和新请求的访问权限。
</Note>

### 可选的受信任 CIDR 节点自动批准

设备配对默认仍然是手动的。对于严格受控的节点网络，
你可以通过显式 CIDR 或精确 IP，选择为首次节点配对启用自动批准：

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

这仅适用于没有请求
作用域的新 `role: node` 配对请求。Operator、浏览器、Control UI 和 WebChat 客户端仍需要手动
批准。角色、作用域、元数据和公钥变更仍需要手动
批准。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 备注

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是一个
  独立的 Gateway 网关自有配对存储。WS 节点仍需要设备配对。
- 配对记录是已批准角色的持久事实来源。活动
  设备令牌仍限定于该已批准角色集合；已批准角色之外的零散令牌条目
  不会创建新的访问权限。

## 相关文档

- 安全模型 + 提示注入：[安全](/zh-CN/gateway/security)
- 安全更新（运行 Doctor）：[更新](/zh-CN/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/zh-CN/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-CN/channels/whatsapp)
  - Signal：[Signal](/zh-CN/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/zh-CN/channels/bluebubbles)
  - iMessage（旧版）：[iMessage](/zh-CN/channels/imessage)
  - Discord：[Discord](/zh-CN/channels/discord)
  - Slack：[Slack](/zh-CN/channels/slack)
