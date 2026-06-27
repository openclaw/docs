---
read_when:
    - 你正在构建或重构消息渠道插件的接收路径
    - 你需要共享的入站上下文构建、会话记录或预处理的回复分发
    - 你正在将旧的频道轮次助手迁移到入站/消息 API
summary: 渠道插件的入站事件辅助工具：上下文构建、共享 runner 编排、会话记录和已准备回复分发
title: 频道入站 API
x-i18n:
    generated_at: "2026-06-27T02:53:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

渠道插件应使用 inbound 和 message 名词来建模接收路径：

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

使用 `openclaw/plugin-sdk/channel-inbound` 进行入站事件规范化、格式化、根目录和编排。使用
`openclaw/plugin-sdk/channel-outbound` 处理原生发送、回执、持久交付和实时预览行为。

## 核心辅助函数

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`：将规范化的渠道事实投射到 prompt/会话上下文中。使用 `channelContext` 将渠道拥有的发送者/聊天元数据传递给插件钩子 `ctx.channelContext`；从此子路径扩展 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext` 以添加渠道特定字段。
- `runChannelInboundEvent(...)`：针对一个入站平台事件运行摄取、分类、预检、解析、记录、分发和完成处理。
- `dispatchChannelInboundReply(...)`：使用交付适配器记录并分发已组装好的入站回复。

注入的插件运行时会在
`runtime.channel.inbound.*` 下暴露相同的高级辅助函数，供已经接收运行时对象的内置/原生渠道使用。

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

兼容性分发器应组装 `dispatchChannelInboundReply(...)` 输入，并将平台交付保留在交付适配器中。新的发送路径应优先使用消息适配器和持久消息辅助函数。

## 迁移

旧的 `runtime.channel.turn.*` 运行时别名已移除。使用：

- `runtime.channel.inbound.run(...)` 处理原始入站事件。
- `runtime.channel.inbound.dispatchReply(...)` 处理已组装的回复上下文。
- `runtime.channel.inbound.buildContext(...)` 处理入站上下文载荷。
- `runtime.channel.inbound.runPreparedReply(...)` 仅用于渠道拥有的、已组装自身分发闭包的预备分发路径。

新的插件代码不应引入以 `turn` 命名的渠道 API。将模型或 agent 轮次词汇保留在 agent/提供商代码中；渠道插件使用入站、消息、交付和回复术语。
