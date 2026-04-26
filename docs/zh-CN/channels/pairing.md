---
read_when:
    - 设置私信访问控制
    - 为新的 iOS/Android 节点配对
    - 审查 OpenClaw 的安全态势
summary: 配对概览：批准谁可以给你发私信 + 哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-04-26T06:31:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

“配对”是 OpenClaw 明确的**所有者批准**步骤。  
它用于两个场景：

1. **私信配对**（谁被允许与机器人对话）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网关网络）

安全背景： [Security](/zh-CN/gateway/security)

## 1) 私信配对（入站聊天访问）

当某个渠道配置了私信策略 `pairing` 时，未知发送者会收到一个简短代码，并且在你批准之前，他们的消息**不会被处理**。

默认私信策略记录在： [Security](/zh-CN/gateway/security)

配对代码：

- 8 个字符，大写，不包含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人只会在创建新请求时发送配对消息（大约每个发送者每小时一次）。
- 默认情况下，每个渠道最多保留 **3 个待处理的私信配对请求**；在其中一个请求过期或获批之前，额外请求会被忽略。

### 批准一个发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准的允许列表存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户作用域行为：

- 非默认账户只读取/写入其带作用域的允许列表文件。
- 默认账户使用渠道级的无作用域允许列表文件。

请将这些视为敏感数据（它们控制你对智能体的访问权限）。

重要：这个存储仅用于私信访问。群组授权是单独处理的。  
批准私信配对代码**不会**自动允许该发送者执行群组命令，也不会允许其在群组中控制机器人。对于群组访问，请配置该渠道的显式群组允许列表（例如 `groupAllowFrom`、`groups`，或根据渠道使用每组/每话题覆盖配置）。

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点会以 `role: node` 的**设备**身份连接到 Gateway 网关。Gateway 网关会创建一个设备配对请求，必须经过批准。

### 通过 Telegram 配对（推荐用于 iOS）

如果你使用 `device-pair` 插件，你可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中，给你的机器人发送：`/pair`
2. 机器人会回复两条消息：一条说明消息，以及一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在你的手机上，打开 OpenClaw iOS 应用 → Settings → Gateway。
4. 粘贴设置代码并连接。
5. 回到 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

设置代码是一个经过 base64 编码的 JSON 负载，其中包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导令牌

该引导令牌携带内置的配对引导配置：

- 主要交接的 `node` 令牌保持 `scopes: []`
- 任何交接的 `operator` 令牌都仍受限于引导允许列表：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 引导作用域检查使用角色前缀，而不是单一扁平作用域池：
  operator 作用域条目只满足 operator 请求，而非 operator 角色
  仍必须在其自身角色前缀下请求作用域
- 后续令牌轮换/撤销仍同时受设备已批准的角色契约
  和调用方会话的 operator 作用域限制

在设置代码有效期间，请像对待密码一样保护它。

### 批准一个节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果同一设备使用不同的身份验证详情重试（例如不同的角色/作用域/公钥），之前的待处理请求会被替换，并创建一个新的 `requestId`。

重要：已配对的设备不会在无提示的情况下自动获得更广泛的访问权限。如果它重新连接并请求更多作用域或更宽泛的角色，OpenClaw 会保持现有批准不变，并创建一个新的待处理升级请求。批准之前，请使用 `openclaw devices list` 对比当前已批准的访问权限和新请求的访问权限。

### 可选：基于受信任 CIDR 的节点自动批准

默认情况下，设备配对仍需手动批准。对于严格受控的节点网络，你可以通过显式 CIDR 或精确 IP，选择启用首次节点自动批准：

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

这仅适用于未请求任何作用域的全新 `role: node` 配对请求。Operator、浏览器、Control UI 和 WebChat 客户端仍需要手动批准。角色、作用域、元数据和公钥的变更仍需要手动批准。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期文件；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 说明

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|rename`）是一个
  独立的、由 Gateway 网关拥有的配对存储。WS 节点仍然需要设备配对。
- 配对记录是已批准角色的持久化事实来源。活动中的
  设备令牌仍受限于该已批准角色集合；即使存在一个超出已批准角色范围的异常令牌条目，
  也不会产生新的访问权限。

## 相关文档

- 安全模型 + 提示注入： [Security](/zh-CN/gateway/security)
- 安全更新（运行 doctor）： [Updating](/zh-CN/install/updating)
- 渠道配置：
  - Telegram： [Telegram](/zh-CN/channels/telegram)
  - WhatsApp： [WhatsApp](/zh-CN/channels/whatsapp)
  - Signal： [Signal](/zh-CN/channels/signal)
  - BlueBubbles（iMessage）： [BlueBubbles](/zh-CN/channels/bluebubbles)
  - iMessage（旧版）： [iMessage](/zh-CN/channels/imessage)
  - Discord： [Discord](/zh-CN/channels/discord)
  - Slack： [Slack](/zh-CN/channels/slack)
