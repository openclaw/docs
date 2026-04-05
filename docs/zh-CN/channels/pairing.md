---
read_when:
    - 设置私信访问控制时
    - 为新的 iOS/Android 节点配对时
    - 审查 OpenClaw 安全态势时
summary: 配对概览：批准谁可以给你发私信，以及哪些节点可以加入
title: 配对
x-i18n:
    generated_at: "2026-04-05T08:16:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# 配对

“配对”是 OpenClaw 的显式**所有者批准**步骤。
它用于两个场景：

1. **私信配对**（谁被允许与机器人对话）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网关网络）

安全上下文：[安全](/gateway/security)

## 1）私信配对（入站聊天访问）

当某个渠道配置为私信策略 `pairing` 时，未知发送者会收到一个短代码，并且在你批准之前，他们的消息**不会被处理**。

默认私信策略见：[安全](/gateway/security)

配对码：

- 8 个字符，大写，无易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人仅在创建新请求时发送配对消息（对每个发送者大约每小时一次）。
- 默认情况下，待处理的私信配对请求每个渠道最多 **3 个**；在某个请求过期或被批准之前，额外请求会被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准 allowlist 存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户作用域行为：

- 非默认账户只会读取/写入其带作用域的 allowlist 文件。
- 默认账户使用该渠道范围内的不带作用域 allowlist 文件。

请将这些文件视为敏感数据（它们控制谁可以访问你的助手）。

重要说明：该存储用于私信访问。群组授权是分开的。
批准私信配对码并不会自动允许该发送者执行群组命令，或在群组中控制机器人。对于群组访问，请配置该渠道的显式群组 allowlist（例如 `groupAllowFrom`、`groups`，或视渠道而定的按群组/按话题覆盖）。

## 2）节点设备配对（iOS/Android/macOS/无头节点）

节点作为带有 `role: node` 的**设备**连接到 Gateway 网关。Gateway 网关会创建设备配对请求，必须经过批准。

### 通过 Telegram 配对（推荐用于 iOS）

如果你使用 `device-pair` 插件，则可以完全通过 Telegram 完成首次设备配对：

1. 在 Telegram 中，向你的机器人发送消息：`/pair`
2. 机器人会回复两条消息：一条说明消息，以及一条单独的**设置代码**消息（便于在 Telegram 中复制/粘贴）。
3. 在你的手机上，打开 OpenClaw iOS 应用 → Settings → Gateway。
4. 粘贴设置代码并连接。
5. 回到 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

设置代码是一个经过 base64 编码的 JSON 负载，包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：一个短期的单设备 bootstrap 令牌，用于初始配对握手

该 bootstrap 令牌携带内置的配对 bootstrap 配置文件：

- 主要移交的 `node` 令牌保持为 `scopes: []`
- 任何移交的 `operator` 令牌都保持受 bootstrap allowlist 限制：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- bootstrap 作用域检查按角色前缀区分，而不是一个扁平的统一作用域池：
  operator 作用域条目只满足 operator 请求，非 operator 角色
  仍必须在其自身角色前缀下请求作用域

在其有效期内，请像对待密码一样对待该设置代码。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果同一设备使用不同的认证细节重试（例如不同的角色/作用域/公钥），先前待处理的请求会被替代，并创建新的 `requestId`。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 说明

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|rename`）是一个独立的、由 Gateway 网关拥有的配对存储。WS 节点仍然需要设备配对。
- 配对记录是已批准角色的持久事实来源。活动设备令牌会始终受限于该已批准角色集合；即使出现不在已批准角色中的异常令牌条目，也不会创建新的访问权限。

## 相关文档

- 安全模型 + prompt injection：[安全](/gateway/security)
- 安全更新（运行 Doctor）：[更新](/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/channels/telegram)
  - WhatsApp：[WhatsApp](/channels/whatsapp)
  - Signal：[Signal](/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/channels/bluebubbles)
  - iMessage（旧版）：[iMessage](/channels/imessage)
  - Discord：[Discord](/channels/discord)
  - Slack：[Slack](/channels/slack)
