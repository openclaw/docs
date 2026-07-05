---
read_when:
    - 你正在构建或重构消息渠道插件的接收路径
    - 你需要共享的入站上下文构建、会话记录或预备回复分发
    - 你正在将旧版渠道轮次助手迁移到入站/消息 API
summary: 用于渠道插件的入站事件辅助工具：上下文构建、共享运行器编排、会话记录和已准备回复分发
title: 渠道入站 API
x-i18n:
    generated_at: "2026-07-05T11:34:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

渠道接收路径遵循一个流程：

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

使用 `openclaw/plugin-sdk/channel-inbound` 处理入站事件规范化、格式化、根目录和编排。使用
`openclaw/plugin-sdk/channel-outbound` 处理原生发送、回执、持久化投递和实时预览行为。

## 核心辅助函数

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：将规范化的渠道事实投射到 prompt/会话上下文中。通过 `channelContext` 传递渠道拥有的发送者/聊天元数据，插件钩子会将其视为 `ctx.channelContext`。从此子路径扩展 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`，以添加渠道特定字段。
- `runChannelInboundEvent(...)`：对一个入站平台事件运行摄取、分类、预检、解析、记录、分发和收尾。
- `dispatchChannelInboundReply(...)`：使用投递适配器记录并分发一个已组装的入站回复。

已经接收注入式插件运行时对象的内置/原生渠道，可以改为调用 `runtime.channel.inbound.*` 下的相同辅助函数，而不是直接导入此子路径：

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

为兼容性分发器组装 `dispatchChannelInboundReply(...)` 输入，这类分发器会把平台投递保留在投递适配器中。新的发送路径应改用来自 `channel-outbound` 的消息适配器和持久化消息辅助函数。

## 迁移

`runtime.channel.turn.*` 运行时别名已移除。请使用：

- `runtime.channel.inbound.run(...)` 用于原始入站事件。
- `runtime.channel.inbound.dispatchReply(...)` 用于已组装的回复上下文。
- `runtime.channel.inbound.buildContext(...)` 用于入站上下文载荷。
- `runtime.channel.inbound.runPreparedReply(...)` 已弃用，仅用于渠道拥有、且已经组装自身分发闭包的预备分发路径。

新的插件代码不应引入以 `turn` 命名的渠道 API。将模型或智能体轮次词汇保留在智能体/提供商代码中；渠道插件使用入站、消息、投递和回复等术语。
