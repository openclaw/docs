---
read_when:
    - 构建或迁移消息渠道插件
    - 更改私信或群组允许列表、路由门控、命令授权、事件授权或提及激活
    - 审查渠道入口脱敏或 SDK 兼容性边界
sidebarTitle: Channel Ingress
summary: 用于入站消息授权的实验性频道入口 API
title: 频道入口 API
x-i18n:
    generated_at: "2026-05-10T19:42:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# 频道入口 API

频道入口是用于入站渠道事件的实验性访问控制边界。接收路径请使用 `openclaw/plugin-sdk/channel-ingress-runtime`。
较旧的 `openclaw/plugin-sdk/channel-ingress` 子路径仍会作为第三方插件的已弃用兼容外观导出。

插件拥有平台事实和副作用。核心拥有通用策略：私信/群组允许列表、配对存储私信条目、路由门控、命令门控、事件授权、提及激活、脱敏诊断和准入。

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

不要预先计算有效允许列表、命令所有者或命令组。解析器会从原始允许列表、存储回调、路由描述符、访问组、策略和对话类型中派生它们。

## 结果

内置插件应直接使用现代投影：

- `ingress`：有序门控决策和准入
- `senderAccess`：仅发送者/对话授权
- `routeAccess`：路由和路由发送者投影
- `commandAccess`：命令授权；未运行命令门控时为 false
- `activationAccess`：提及/激活结果

事件授权仍可通过有序的 `ingress.graph` 和决定性的 `ingress.reasonCode` 获得；不会发出单独的事件投影。

已弃用的第三方 SDK 辅助函数可以在内部重建旧形状。新的内置接收路径不应把现代结果转换回本地 DTO。

## 访问组

`accessGroup:<name>` 条目保持脱敏。核心自行解析静态 `message.senders` 组，并且只会针对需要平台查找的动态组调用 `resolveAccessGroupMembership`。缺失、不支持和失败的组都会失败关闭。

## 事件模式

| `authMode`       | 含义                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 常规入站发送者门控                               |
| `command`        | 回调或作用域按钮的命令门控                       |
| `origin-subject` | 操作者必须匹配原始消息主体                       |
| `route-only`     | 仅针对路由作用域可信事件的路由门控               |
| `none`           | 插件拥有的内部事件会绕过共享授权                 |

对反应、按钮、回调和原生命令使用 `mayPair: false`。

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

当一个插件有多个可选路由描述符时，使用 `channelIngressRoutes(...)`；它会过滤已禁用的分支，同时保持路由事实通用，并按每个描述符的 `precedence` 排序。

提及门控是激活门控。提及未命中会返回 `admission: "skip"`，因此轮次内核不会处理仅观察轮次。大多数渠道应将激活放在发送者和命令门控之后。必须在发送者允许列表噪声之前静默未提及流量的公共聊天界面，可以在禁用文本命令绕过时选择 `activation.order: "before-sender"`。具有隐式激活的渠道，例如机器人线程中的回复，可以传入 `activation.allowedImplicitMentionKinds`；投影出的 `activationAccess.shouldBypassMention` 随后会报告命令或隐式激活何时绕过了显式提及。

## 脱敏

原始发送者值和原始允许列表条目只能作为解析器输入。它们不得出现在已解析状态、决策、诊断、快照或兼容性事实中。请使用不透明主体 ID、条目 ID、路由 ID 和诊断 ID。

## 验证

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
