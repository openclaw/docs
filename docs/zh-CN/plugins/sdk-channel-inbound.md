---
read_when:
    - 你正在构建或重构消息渠道插件的接收路径
    - 你需要共享的入站上下文构建、会话记录或预备回复分派
    - 你正在将旧的渠道轮次辅助函数迁移到入口/消息 API
summary: 渠道插件的入站事件辅助工具：上下文构建、共享运行器编排、会话记录和预备回复分发
title: 渠道入站 API
x-i18n:
    generated_at: "2026-07-11T20:48:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

渠道接收路径遵循同一流程：

```text
平台事件 -> 入站事实/上下文 -> 智能体回复 -> 消息投递
```

使用 `openclaw/plugin-sdk/channel-inbound` 进行入站事件规范化、格式化、根路径处理和编排。使用 `openclaw/plugin-sdk/channel-outbound` 实现原生发送、回执、持久化投递和实时预览行为。

## 核心辅助函数

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：将规范化的渠道事实投射到提示词/会话上下文中。通过 `channelContext` 传递由渠道所有的发送者/聊天元数据，插件钩子可通过 `ctx.channelContext` 访问这些数据。可从此子路径扩展 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`，以添加渠道特有字段。
- `runChannelInboundEvent(...)`：针对一个入站平台事件，依次运行摄取、分类、预检、解析、记录、分派和收尾流程。
- `dispatchChannelInboundReply(...)`：使用投递适配器记录并分派已组装完成的入站回复。

已接收注入式插件运行时对象的内置/原生渠道，可以调用 `runtime.channel.inbound.*` 下的相同辅助函数，而无需直接导入此子路径：

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

对于将平台投递保留在投递适配器中的兼容性分派器，请组装 `dispatchChannelInboundReply(...)` 的输入。新的发送路径应改用 `channel-outbound` 中的消息适配器和持久化消息辅助函数。

## 迁移

`runtime.channel.turn.*` 运行时别名已移除。请使用：

- `runtime.channel.inbound.run(...)` 处理原始入站事件。
- `runtime.channel.inbound.dispatchReply(...)` 处理已组装的回复上下文。
- `runtime.channel.inbound.buildContext(...)` 处理入站上下文载荷。
- `runtime.channel.inbound.runPreparedReply(...)` 已弃用，仅用于由渠道所有、且已自行组装分派闭包的预备分派路径。

新的插件代码不应引入以 `turn` 命名的渠道 API。模型或智能体的轮次术语应仅用于智能体/提供商代码；渠道插件应使用入站、消息、投递和回复等术语。
