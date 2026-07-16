---
read_when:
    - 构建或迁移消息渠道插件
    - 更改私信或群组允许列表、路由门控、命令身份验证、事件身份验证或提及激活机制
    - 审查频道入口脱敏或 SDK 兼容性边界
sidebarTitle: Channel Ingress
summary: 用于入站消息授权的实验性频道入口 API
title: 频道入口 API
x-i18n:
    generated_at: "2026-07-16T11:52:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

频道入口是面向入站渠道事件的实验性访问控制边界。插件负责平台事实和副作用；核心负责通用策略：私信/群组允许列表、配对存储中的私信条目、路由门控、命令门控、事件身份验证、提及激活、脱敏诊断和准入。

接收路径使用 `openclaw/plugin-sdk/channel-ingress-runtime`。

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

不要预先计算有效允许列表、命令所有者或命令组。解析器根据原始允许列表、存储回调、路由描述符、访问组、策略和会话类型推导这些内容。

## 结果

内置插件应直接使用现代投影：

| 字段               | 含义                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 有序的门控决策和准入                                               |
| `senderAccess`     | 仅限发送者/会话授权                                                |
| `routeAccess`      | 路由和路由发送者投影                                               |
| `commandAccess`    | 命令授权；未运行命令门控时为 `requested: false`                    |
| `activationAccess` | 提及/激活结果                                                      |

事件授权仍可通过有序的 `ingress.graph` 和起决定作用的 `ingress.reasonCode` 获取；不会生成单独的事件投影。

已弃用的第三方 SDK 辅助函数可以在内部重新构建旧版结构。新的内置接收路径不应将现代结果转换回本地 DTO。

## 访问组

`accessGroup:<name>` 条目保持脱敏。核心自行解析静态 `message.senders` 组，仅对需要平台查询的动态组调用 `resolveAccessGroupMembership`。缺失、不受支持和解析失败的组均采用故障关闭策略。

## 事件模式

| `authMode` | 含义                                             |
| ---------------- | ------------------------------------------------ |
| `inbound` | 常规入站发送者门控                               |
| `command` | 回调或限定范围按钮的命令门控                     |
| `origin-subject` | 操作者必须与原始消息主体匹配                     |
| `route-only` | 仅对限定路由范围的可信事件应用路由门控           |
| `none` | 插件负责的内部事件绕过共享身份验证               |

表情回应、按钮、回调和原生命令使用 `mayPair: false`。

## 路由和激活

使用路由描述符表示房间、话题、服务器、线程或嵌套路由策略：

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

当插件有多个可选路由描述符时，使用 `channelIngressRoutes(...)`；它会过滤已禁用的分支，同时保持路由事实的通用性，并按每个描述符的 `precedence` 排序。

提及门控是一种激活门控。提及未命中时返回 `admission: "skip"`，因此轮次内核不会处理仅观察轮次。大多数渠道应将激活门控置于发送者门控和命令门控之后。必须在产生发送者允许列表噪声前静默处理未提及流量的公开聊天界面，可在禁用文本命令绕过时选择启用 `activation.order: "before-sender"`。具有隐式激活机制的渠道（例如 Bot 线程中的回复）可以传入 `activation.allowedImplicitMentionKinds`；投影后的 `activationAccess.shouldBypassMention` 随后会报告命令或隐式激活何时绕过了显式提及。

## 脱敏

原始发送者值和原始允许列表条目仅可作为解析器输入。它们不得出现在解析后的状态、决策、诊断、快照或兼容性事实中。请使用不透明的主体 ID、条目 ID、路由 ID 和诊断 ID。

## 验证

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
