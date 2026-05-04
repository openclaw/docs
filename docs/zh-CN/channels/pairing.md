---
read_when:
    - 设置私信访问控制
    - 配对新的 iOS/Android 节点
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以私信你 + 哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-05-04T07:16:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

“配对”是 OpenClaw 的显式访问批准步骤。
它用于两个地方：

1. **私信配对**（谁可以与机器人对话）
2. **节点配对**（哪些设备/节点可以加入 Gateway 网关网络）

安全上下文：[安全性](/zh-CN/gateway/security)

## 1) 私信配对（入站聊天访问）

当渠道配置了私信策略 `pairing` 时，未知发送者会获得一个短代码，并且他们的消息在你批准之前**不会被处理**。

默认私信策略记录在：[安全性](/zh-CN/gateway/security)

只有当有效的私信允许列表包含 `"*"` 时，`dmPolicy: "open"` 才是公开的。
设置和验证要求公开开放配置使用这个通配符。如果现有
状态包含带具体 `allowFrom` 条目的 `open`，运行时仍然只允许
这些发送者，配对存储中的批准不会扩大 `open` 访问权限。

配对码：

- 8 个字符，大写，不含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人只会在创建新请求时发送配对消息（约每个发送者每小时一次）。
- 待处理的私信配对请求默认每个渠道上限为 **3 个**；额外请求会被忽略，直到某个请求过期或被批准。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未配置命令所有者，批准私信配对码也会引导初始化
`commands.ownerAllowFrom` 为已批准的发送者，例如 `telegram:123456789`。
这会为首次设置提供一个显式所有者，用于特权命令和 exec
批准提示。所有者存在后，后续配对批准只授予私信
访问权限；它们不会添加更多所有者。

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用的发送者组

当同一组可信发送者应适用于多个消息渠道，或同时适用于私信和群组允许列表时，
使用顶层 `accessGroups`。

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

访问组在这里有详细文档：[访问组](/zh-CN/channels/access-groups)

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准允许列表存储：
  - 默认账号：`<channel>-allowFrom.json`
  - 非默认账号：`<channel>-<accountId>-allowFrom.json`

账号作用域行为：

- 非默认账号只读写它们的作用域允许列表文件。
- 默认账号使用渠道作用域的非作用域允许列表文件。

请将这些文件视为敏感内容（它们控制对你的助手的访问）。

<Note>
配对允许列表存储用于私信访问。群组授权是分开的。
批准私信配对码不会自动允许该发送者运行群组
命令或在群组中控制机器人。首个所有者引导是 `commands.ownerAllowFrom`
中的独立配置状态，而群聊投递仍遵循该
渠道的群组允许列表（例如 `groupAllowFrom`、`groups`，或取决于渠道的按群组
或按主题覆盖）。
</Note>

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以 `role: node` 的**设备**身份连接到 Gateway 网关。Gateway 网关
会创建设备配对请求，该请求必须被批准。

### 通过 Telegram 配对（推荐用于 iOS）

如果使用 `device-pair` 插件，你可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中，给你的机器人发送消息：`/pair`
2. 机器人会回复两条消息：一条说明消息，以及一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在手机上，打开 OpenClaw iOS 应用 → 设置 → Gateway 网关。
4. 扫描二维码或粘贴设置代码并连接。
5. 回到 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

设置代码是一个 base64 编码的 JSON 载荷，其中包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导令牌

该引导令牌携带内置的配对引导配置：

- 交接后的主 `node` 令牌保持 `scopes: []`
- 任何交接后的 `operator` 令牌都受限于引导允许列表：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 引导作用域检查按角色加前缀，而不是一个扁平的作用域池：
  operator 作用域条目只满足 operator 请求，非 operator 角色
  仍必须请求其自身角色前缀下的作用域
- 后续令牌轮换/撤销仍同时受设备已批准
  角色合约和调用方会话的 operator 作用域约束

设置代码有效期间，请像对待密码一样对待它。

对于 Tailscale、公开或其他非 loopback 移动端配对，请使用 Tailscale
Serve/Funnel 或其他 `wss://` Gateway 网关 URL。直接的非 loopback `ws://` 设置
URL 会在二维码/设置代码签发前被拒绝。明文 `ws://` 设置代码
仅限于 loopback URL；私有网络 `ws://` 客户端仍需要远程
Gateway 网关指南中描述的显式 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
破窗开关。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

当显式批准被拒绝，因为执行批准的已配对设备会话
以仅配对作用域打开时，CLI 会使用 `operator.admin`
重试同一个请求。这让现有具备 admin 能力的已配对设备能够恢复新的
Control UI/浏览器配对，而无需手动编辑 `devices/paired.json`。Gateway 网关
仍会验证重试的连接；无法使用 `operator.admin` 认证的令牌
仍会被阻止。

如果同一设备使用不同认证详细信息重试（例如不同的
角色/作用域/公钥），之前的待处理请求会被取代，并创建新的
`requestId`。

<Note>
已配对的设备不会静默获得更广泛的访问权限。如果它重新连接时请求更多作用域或更广泛的角色，OpenClaw 会保持现有批准不变，并创建一个新的待处理升级请求。在批准前，请使用 `openclaw devices list` 比较当前已批准的访问权限和新请求的访问权限。
</Note>

### 可选的可信 CIDR 节点自动批准

设备配对默认仍为手动。对于严格受控的节点网络，
你可以使用显式 CIDR 或精确 IP 选择启用首次节点自动批准：

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
作用域的全新 `role: node` 配对请求。Operator、浏览器、Control UI 和 WebChat 客户端仍需要手动
批准。角色、作用域、元数据和公钥变更仍需要手动
批准。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期存在；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 注意事项

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  单独的 Gateway 网关所有的配对存储。WS 节点仍需要设备配对。
- 配对记录是已批准角色的持久事实来源。活动
  设备令牌仍受限于该已批准的角色集合；批准角色之外的零散令牌条目
  不会创建新的访问权限。

## 相关文档

- 安全模型 + 提示注入：[安全性](/zh-CN/gateway/security)
- 安全更新（运行 Doctor）：[更新](/zh-CN/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/zh-CN/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-CN/channels/whatsapp)
  - Signal：[Signal](/zh-CN/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/zh-CN/channels/bluebubbles)
  - iMessage（旧版）：[iMessage](/zh-CN/channels/imessage)
  - Discord：[Discord](/zh-CN/channels/discord)
  - Slack：[Slack](/zh-CN/channels/slack)
