---
read_when:
    - 构建或迁移消息渠道插件
    - 更改私信或群组允许列表、路由门控、命令鉴权、事件鉴权或提及激活
    - 审查频道入口脱敏或 SDK 兼容性边界
sidebarTitle: Channel Ingress
summary: 用于入站消息授权的实验性频道入口 API
title: 频道入口 API
x-i18n:
    generated_at: "2026-07-05T11:31:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

渠道入口是入站渠道事件的实验性访问控制边界。插件负责平台事实和副作用；核心负责通用策略：私信/群组 allowlist、配对存储中的私信条目、路由门禁、命令门禁、事件认证、提及激活、已脱敏诊断和准入。

对新的接收路径使用 `openclaw/plugin-sdk/channel-ingress-runtime`。较旧的 `openclaw/plugin-sdk/channel-ingress` 子路径仍会导出，作为面向第三方插件的已弃用兼容门面。

## 运行时解析器

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

不要预先计算有效 allowlist、命令所有者或命令组。解析器会根据原始 allowlist、存储回调、路由描述符、访问组、策略和会话类型派生它们。

## 结果

内置插件应直接使用现代投影：

| 字段               | 含义                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 有序的门禁决策和准入                                               |
| `senderAccess`     | 仅发送者/会话授权                                                  |
| `routeAccess`      | 路由和路由发送者投影                                               |
| `commandAccess`    | 命令授权；未运行命令门禁时为 `requested: false`                    |
| `activationAccess` | 提及/激活结果                                                      |

事件授权仍可通过有序的 `ingress.graph` 和决定性的 `ingress.reasonCode` 获取；不会发出单独的事件投影。

已弃用的第三方 SDK 辅助工具可以在内部重建旧形状。新的内置接收路径不应将现代结果转译回本地 DTO。

## 访问组

`accessGroup:<name>` 条目保持脱敏。核心会自行解析静态 `message.senders` 组，并且只对需要平台查询的动态组调用 `resolveAccessGroupMembership`。缺失、不支持和失败的组都会关闭访问。

## 事件模式

| `authMode`       | 含义                                           |
| ---------------- | ---------------------------------------------- |
| `inbound`        | 普通入站发送者门禁                             |
| `command`        | 用于回调或有作用域按钮的命令门禁               |
| `origin-subject` | 操作者必须匹配原始消息主体                     |
| `route-only`     | 仅用于路由作用域可信事件的路由门禁             |
| `none`           | 插件负责的内部事件绕过共享认证                 |

对表情回应、按钮、回调和原生命令使用 `mayPair: false`。

## 路由和激活

对房间、话题、公会、线程或嵌套路由策略使用路由描述符：

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

当插件有多个可选路由描述符时，使用 `channelIngressRoutes(...)`；它会过滤已禁用分支，同时保持路由事实通用，并按每个描述符的 `precedence` 排序。

提及门禁是一种激活门禁。提及未命中会返回 `admission: "skip"`，这样轮次内核就不会处理仅观察的轮次。大多数渠道应将激活放在发送者和命令门禁之后。必须在发送者 allowlist 噪声之前静默未提及流量的公共聊天表面，可以在文本命令绕过被禁用时选择 `activation.order: "before-sender"`。具有隐式激活的渠道，例如 Bot 线程中的回复，可以传入 `activation.allowedImplicitMentionKinds`；投影出的 `activationAccess.shouldBypassMention` 随后会报告命令或隐式激活何时绕过了显式提及。

## 脱敏

原始发送者值和原始 allowlist 条目仅作为解析器输入。它们不得出现在已解析状态、决策、诊断、快照或兼容性事实中。请使用不透明的主体 ID、条目 ID、路由 ID 和诊断 ID。

## 验证

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
