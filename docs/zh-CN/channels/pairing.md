---
read_when:
    - 设置私信访问控制
    - 配对新的 iOS/Android 节点
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以私信你 + 哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-05-01T23:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“配对”是 OpenClaw 的显式访问批准步骤。
它用于两个地方：

1. **私信配对**（谁被允许与机器人对话）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网关网络）

安全上下文：[安全](/zh-CN/gateway/security)

## 1) 私信配对（入站聊天访问）

当某个渠道配置了私信策略 `pairing` 时，未知发送者会收到一个短代码，并且在你批准之前，他们的消息**不会被处理**。

默认私信策略记录在：[安全](/zh-CN/gateway/security)

只有当有效的私信允许列表包含 `"*"` 时，`dmPolicy: "open"` 才是公开的。
设置和验证要求公开开放配置使用该通配符。如果现有
状态包含 `open` 和具体的 `allowFrom` 条目，运行时仍然只接纳
这些发送者，并且配对存储中的批准不会扩大 `open` 访问权限。

配对代码：

- 8 个字符，大写，不含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人只会在创建新请求时发送配对消息（大约每个发送者每小时一次）。
- 默认情况下，待处理的私信配对请求上限为**每个渠道 3 个**；更多请求会被忽略，直到其中一个过期或获批。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未配置命令所有者，批准私信配对代码也会将
`commands.ownerAllowFrom` 引导设置为已批准的发送者，例如 `telegram:123456789`。
这会为首次设置提供一个用于特权命令和 exec
批准提示的显式所有者。已有所有者之后，后续配对批准只授予私信
访问权限；它们不会添加更多所有者。

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用的发送者组

当同一组受信任发送者需要应用于多个消息渠道，或同时应用于私信和群组允许列表时，
请使用顶层 `accessGroups`。

静态组使用 `type: "message.senders"`，并在渠道允许列表中通过
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

访问组的详细文档在这里：[访问组](/zh-CN/channels/access-groups)

### 状态的存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准允许列表存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户作用域行为：

- 非默认账户只读写其作用域内的允许列表文件。
- 默认账户使用渠道作用域的无作用域允许列表文件。

请将这些文件视为敏感信息（它们控制对你的助手的访问）。

<Note>
配对允许列表存储用于私信访问。群组授权是独立的。
批准私信配对代码不会自动允许该发送者运行群组
命令或在群组中控制机器人。首次所有者引导是
`commands.ownerAllowFrom` 中的独立配置状态，群聊投递仍然遵循该
渠道的群组允许列表（例如 `groupAllowFrom`、`groups`，或取决于渠道的按群组
或按话题覆盖）。
</Note>

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以带有 `role: node` 的**设备**身份连接到 Gateway 网关。Gateway 网关
会创建设备配对请求，必须批准该请求。

### 通过 Telegram 配对（推荐用于 iOS）

如果你使用 `device-pair` 插件，可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中，给你的机器人发送消息：`/pair`
2. 机器人会回复两条消息：一条说明消息，以及一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在手机上，打开 OpenClaw iOS 应用 → 设置 → Gateway 网关。
4. 粘贴设置代码并连接。
5. 回到 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

设置代码是一个 base64 编码的 JSON 载荷，其中包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导令牌

该引导令牌携带内置的配对引导配置文件：

- 主要移交的 `node` 令牌保持为 `scopes: []`
- 任何移交的 `operator` 令牌都保持受限于引导允许列表：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 引导作用域检查按角色加前缀，而不是一个扁平的作用域池：
  operator 作用域条目只满足 operator 请求，非 operator 角色
  仍必须在自己的角色前缀下请求作用域
- 后续令牌轮换/吊销仍然同时受设备已批准的
  角色契约和调用方会话的 operator 作用域限制

设置代码有效期间，请像对待密码一样对待它。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果同一设备使用不同的认证详情重试（例如不同的
角色/作用域/公钥），先前的待处理请求会被取代，并创建新的
`requestId`。

<Note>
已配对的设备不会静默获得更广泛的访问权限。如果它重新连接并请求更多作用域或更宽泛的角色，OpenClaw 会保持现有批准不变，并创建新的待处理升级请求。在批准前，请使用 `openclaw devices list` 比较当前已批准的访问权限与新请求的访问权限。
</Note>

### 可选的受信任 CIDR 节点自动批准

设备配对默认保持手动。对于严格控制的节点网络，
你可以通过显式 CIDR 或精确 IP 选择加入首次节点自动批准：

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

这只适用于没有请求
作用域的全新 `role: node` 配对请求。Operator、浏览器、Control UI 和 WebChat 客户端仍然需要手动
批准。角色、作用域、元数据和公钥变更仍然需要手动
批准。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 备注

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是一个
  独立的 Gateway 网关所有的配对存储。WS 节点仍然需要设备配对。
- 配对记录是已批准角色的持久事实来源。活动
  设备令牌保持受限于该已批准角色集；已批准角色之外的零散令牌条目
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
