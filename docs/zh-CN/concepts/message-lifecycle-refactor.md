---
read_when:
    - 重构渠道发送或接收行为
    - 更改渠道入站、回复分发、出站队列、预览流式传输或插件 SDK 消息 API
    - 设计一个需要持久发送、回执、预览、编辑或重试的新渠道插件
summary: 统一的持久消息接收、发送、预览、编辑和流式生命周期设计计划
title: 消息生命周期重构
x-i18n:
    generated_at: "2026-06-27T01:49:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

本页是目标设计，用于将分散的渠道入站、回复分发、预览流式传输和出站投递辅助函数，替换为一个持久的消息生命周期。

简短版本：

- 核心原语应该是 **receive** 和 **send**，而不是 **reply**。
- 回复只是出站消息上的一种关系。
- 轮次是一种入站处理便利机制，不是投递的所有者。
- 发送必须基于上下文：`begin`、渲染、预览或流式传输、最终发送、提交、失败。
- 接收也必须基于上下文：规范化、去重、路由、记录、分发、平台确认、失败。
- 公共插件 SDK 应收敛为一个小型的渠道出站表面。

## 问题

当前渠道栈源自几个合理的局部需求：

- 简单入站适配器使用 `runtime.channel.inbound.run`。
- 富适配器使用 `runtime.channel.inbound.runPreparedReply`。
- 旧版辅助函数使用 `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、回复载荷辅助函数、回复分块、回复引用和出站运行时辅助函数。
- 预览流式传输位于各渠道专用的分发器中。
- 最终投递持久性正在围绕现有回复载荷路径添加。

这种形态修复了局部缺陷，但让 OpenClaw 拥有了过多公共概念，也让投递语义在过多位置可能发生漂移。

暴露这一点的可靠性问题是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目标不变量比 Telegram 更宽泛：一旦核心决定某条可见出站消息应当存在，就必须在尝试平台发送之前持久化该意图，并在成功后提交平台回执。这让 OpenClaw 具备至少一次恢复能力。只有能够证明原生幂等性，或能够在重放前将一次发送后未知状态的尝试与平台状态对账的适配器，才具备精确一次行为。

这是本次重构的最终状态，并不是对每条当前路径的描述。在迁移期间，当尽力而为的队列写入失败时，现有出站辅助函数仍然可以退回到直接发送。只有当持久的最终发送改为失败即关闭，或通过文档化的非持久策略显式选择退出时，重构才算完成。

## 目标

- 为所有渠道消息接收和发送路径提供一个核心生命周期。
- 在适配器声明可安全重放行为后，新的消息生命周期默认使用持久化最终发送。
- 共享预览、编辑、流式传输、最终化、重试、恢复和回执语义。
- 提供第三方插件可以学习和维护的小型插件 SDK 表面。
- 在迁移期间兼容现有入站回复兼容性调用方。
- 为新的渠道能力提供清晰扩展点。
- 核心中没有平台特定分支。
- 没有 token 增量渠道消息。渠道流式传输仍然是消息预览、编辑、追加或已完成块投递。
- 为运维/系统输出提供结构化的 OpenClaw 来源元数据，避免可见的 Gateway 网关故障在启用机器人的共享房间中重新作为新提示词进入。

## 非目标

- 不在第一阶段强制每个现有渠道使用持久消息投递。
- 不强制每个渠道采用相同的原生传输行为。
- 不让核心理解 Telegram 话题、Slack 原生流、Matrix 撤回、Feishu 卡片、QQ 语音或 Teams 活动。
- 不将所有内部迁移辅助函数发布为稳定 SDK API。
- 不让重试重放已完成的非幂等平台操作。

## 参考模型

Vercel Chat 有一个不错的公共心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 适配器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping` 和历史获取
- 用于去重、锁、队列和持久化的状态适配器

OpenClaw 应借用词汇，而不是复制表面。

在该模型之外，OpenClaw 还需要：

- 在直接传输调用之前持久化出站发送意图。
- 带有 begin、commit 和 fail 的显式发送上下文。
- 了解平台确认策略的接收上下文。
- 能够在重启后保留，并驱动编辑、删除、恢复和重复抑制的回执。
- 更小的公共 SDK。内置插件可以使用内部运行时辅助函数，但第三方插件应看到一个连贯的消息 API。
- Agent 专用行为：会话、转录、分块流式传输、工具进度、审批、媒体指令、静默回复和群组提及历史。

`thread.post()` 风格的 promise 对 OpenClaw 来说不够。它们隐藏了决定一次发送是否可恢复的事务边界。

## 核心模型

新的领域应位于内部核心命名空间下，例如 `src/channels/message/*`。

它有四个概念：

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` 拥有入站生命周期。

`send` 拥有出站生命周期。

`live` 拥有预览、编辑、进度和流状态。

`state` 拥有持久意图存储、回执、幂等性、恢复、锁和去重。

## 消息术语

### 消息

规范化消息是平台中立的：

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### 目标

目标描述消息所在位置：

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### 关系

回复是一种关系，不是 API 根：

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

这让同一发送路径可以处理普通回复、cron 通知、审批提示、任务完成、消息工具发送、CLI 或 Control UI 发送、子智能体结果和自动化发送。

### 来源

来源描述谁生成了消息，以及 OpenClaw 应如何处理该消息的回声。它与关系分离：一条消息可以是对用户的回复，同时仍然是 OpenClaw 来源的运维输出。

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

核心拥有 OpenClaw 来源输出的含义。渠道拥有如何将该来源编码到其传输中的职责。

第一个必需用途是 Gateway 网关故障输出。人类仍应看到诸如 “Agent failed before reply” 或 “Missing API key” 的消息，但带标签的 OpenClaw 运维输出，在启用 `allowBots` 时不得在共享房间中被接受为机器人编写的输入。

### 回执

回执是一等概念：

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

回执是从持久意图到未来编辑、删除、预览最终化、重复抑制和恢复的桥梁。

一个回执可以描述一条平台消息，也可以描述多部分投递。分块文本、媒体加文本、语音加文本和卡片回退必须保留所有平台 ID，同时仍暴露一个用于串联和后续编辑的主 ID。

## 接收上下文

接收不应是一次裸辅助函数调用。核心需要一个了解去重、路由、会话记录和平台确认策略的上下文。

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

接收流程：

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

确认不是一种东西。接收契约必须将这些信号分开：

- **传输确认：** 告诉平台 webhook 或 socket，OpenClaw 已接受事件信封。某些平台要求在分发之前完成这一点。
- **轮询偏移确认：** 推进游标，使同一事件不会再次被获取。它不得推进到无法恢复的工作之后。
- **入站记录确认：** 确认 OpenClaw 已持久化足够的入站元数据，以便对重新投递进行去重和路由。
- **用户可见回执：** 可选的已读/状态/正在输入行为；绝不是持久性边界。

`ReceiveAckPolicy` 只控制传输或轮询确认。它不得复用于已读回执或状态反应。

在机器人授权之前，如果渠道能够解码消息来源元数据，接收必须应用共享的 OpenClaw 回声策略：

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

该丢弃基于标签，而不是基于文本。一条机器人编写的房间消息即使具有相同的可见 Gateway 网关故障文本，但没有 OpenClaw 来源元数据，仍会通过正常的 `allowBots` 授权。

确认策略是显式的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 轮询现在使用接收上下文确认策略作为其持久化重启水位线。跟踪器仍会在 grammY 更新进入中间件链时观察它们，但 OpenClaw 只会在成功分发后持久化安全的已完成更新 ID，让失败的或较低的待处理更新在重启后可重放。Telegram 上游 `getUpdates` 获取偏移仍由轮询库控制，因此如果我们需要超出 OpenClaw 重启水位线的平台级重新投递，剩下更深的一步是完全持久的轮询源。Webhook 平台可能需要立即 HTTP 确认，但它们仍需要入站去重和持久的出站发送意图，因为 webhook 可能重新投递。

## 发送上下文

发送同样基于上下文：

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

推荐编排方式：

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

该辅助函数展开为：

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

意图必须先于传输 I/O 存在。在 begin 之后、commit 之前重启是可恢复的。

危险边界位于平台成功之后、回执提交之前。如果进程在这里退出，除非适配器提供原生幂等性或回执对账路径，否则 OpenClaw 无法知道平台消息是否存在。这些尝试必须在 `unknown_after_send` 中恢复，不能盲目重放。没有对账能力的渠道只有在重复可见消息对该渠道和关系是可接受且已记录的权衡时，才可以选择至少一次重放。当前 SDK 对账桥要求适配器声明 `reconcileUnknownSend`，然后请求 `durableFinal.reconcileUnknownSend` 将未知条目分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重放，未解决条目保持终态，或仅重试对账检查。

持久性策略必须显式：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示当核心无法写入持久化意图时必须关闭失败。`best_effort` 可在持久化不可用时继续执行。`disabled` 保留旧的直接发送行为。迁移期间，旧包装器和公共兼容性辅助函数默认使用 `disabled`；它们不得因为某个渠道有通用出站适配器就推断为 `required`。

发送上下文还拥有渠道本地的发送后效果。如果持久化投递绕过此前附加在渠道直接发送路径上的本地行为，迁移就是不安全的。示例包括自回显抑制缓存、线程参与标记、原生编辑锚点、模型签名渲染，以及平台特定的重复保护。这些效果必须移动到发送适配器、渲染适配器，或命名的发送上下文钩子中，然后该渠道才能启用持久化通用最终投递。

发送辅助函数必须一路向调用方返回回执。持久化包装器不能吞掉消息 id，也不能用 `undefined` 替换渠道投递结果；缓冲调度器会使用这些 id 作为线程锚点、后续编辑、预览最终化和重复抑制的依据。

回退发送作用于批次，而不是单个载荷。静默回复重写、媒体回退、卡片回退和分块投影都可能产生多个可投递消息，因此发送上下文必须投递整个投影批次，或明确记录为什么只有一个载荷有效。

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

当此类回退是持久化的，整个投影批次必须由一个持久化发送意图或另一个原子批次计划表示。逐个记录每个载荷并不够：载荷之间崩溃可能留下部分可见回退，而剩余载荷没有持久化记录。恢复必须知道哪些单元已有回执，并且要么只重放缺失单元，要么将批次标记为 `unknown_after_send`，直到适配器完成对账。

## 实时上下文

预览、编辑、进度和流行为应当是一个可选启用的生命周期。

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

实时状态具有足够的持久性，可用于恢复或抑制重复：

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

这应覆盖当前行为：

- Telegram 发送并编辑预览，在预览过旧后发送新的最终消息。
- Discord 发送并编辑预览，在媒体、错误或显式回复时取消。
- Slack 根据线程形态使用原生流或草稿预览。
- Mattermost 草稿帖最终化。
- Matrix 草稿事件最终化，或在不匹配时撤回。
- Teams 原生进度流。
- QQ Bot 流或累积式回退。

## 适配器接口

公共 SDK 目标应当是一个子路径：

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

目标形态：

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

发送适配器：

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

接收适配器：

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

在预检授权之前，只要 `origin.decode` 返回 OpenClaw 来源元数据，核心就必须运行共享的 OpenClaw 回显谓词。接收适配器提供平台事实，例如 bot 作者和房间形态；核心拥有丢弃决策和排序，因此渠道无需重新实现文本过滤器。

来源适配器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

核心设置 `MessageOrigin`。渠道只负责在它与原生传输元数据之间转换。Slack 将其映射到 `chat.postMessage({ metadata })` 和入站 `message.metadata`；Matrix 可将其映射到额外事件内容；没有原生元数据的渠道可在这是最佳可用近似方式时使用回执/出站注册表。

能力：

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## 公共 SDK 精简

新的公共接口应吸收或弃用这些概念区域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` 的大多数公共用法
- 临时草稿流生命周期辅助函数

兼容性子路径可以作为包装器保留，但新的第三方插件不应需要它们。

内置插件在迁移期间可以继续通过保留的运行时子路径使用内部辅助导入。公共文档应在 `plugin-sdk/channel-outbound` 存在后引导插件作者使用它。

## 与渠道入站的关系

`runtime.channel.inbound.*` 是迁移期间的运行时桥。

它应变为兼容性适配器：

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` 初期也应保留：

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

旧的 `channel.turn` 运行时接口已移除。运行时调用方使用 `channel.inbound.*`；渠道文档和 SDK 子路径使用入站/消息名词。

## 兼容性护栏

迁移期间，对于现有投递回调具有“发送此载荷”之外副作用的任何渠道，通用持久化投递都必须显式启用。

旧入口点默认非持久化：

- `channel.inbound.run` 和 `dispatchChannelInboundReply` 使用渠道的投递回调，除非该渠道显式提供经过审计的持久化策略/选项对象。
- `channel.inbound.runPreparedReply` 继续归渠道所有，直到预备调度器显式调用发送上下文。
- 公共兼容性辅助函数，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接私信辅助函数，永远不会在调用方提供的 `deliver` 或 `reply` 回调之前注入通用持久化投递。

对于迁移桥类型，`durable: undefined` 表示“非持久化”。只有显式策略/选项值才启用持久化路径。`durable: false` 可以继续作为兼容写法保留，但实现不应要求每个未迁移渠道都添加它。

当前桥代码必须保持持久性决策显式：

- 持久化最终投递会返回可辨别的状态。`handled_visible` 和
  `handled_no_send` 是终止状态；`unsupported` 和 `not_applicable` 可以回退到
  渠道自有投递；`failed` 会传播发送失败。
- 通用持久化最终投递受适配器能力门控，例如静默投递、回复目标保留、原生引用保留，以及消息发送钩子。缺少等价能力时应选择渠道自有投递，而不是会改变用户可见行为的通用发送。
- 队列支撑的持久化发送会暴露投递意图引用。现有的
  `pendingFinalDelivery*` 会话字段可以在迁移期间承载意图 ID；最终状态是一个
  `MessageSendIntent` 存储，而不是冻结的回复文本加临时上下文字段。

在以下全部为真之前，不要为某个渠道启用通用持久化路径：

- 通用发送适配器执行的渲染和传输行为与旧的直接路径相同。
- 本地发送后副作用会通过发送上下文保留下来。
- 适配器会返回包含所有平台消息 ID 的回执或投递结果。
- 已准备的分发器路径要么调用新的发送上下文，要么记录为不在持久化保证范围内。
- 回退投递会处理每一个投影后的载荷，而不只是第一个。
- 持久化回退投递会将整个投影载荷数组记录为一个可重放意图或批处理计划。

需要保留的具体迁移风险：

- iMessage 监控器投递会在发送成功后把已发送消息记录到回声缓存中。持久化最终发送仍必须填充该缓存，否则 OpenClaw 可能会把自己的最终回复重新摄入为入站用户消息。
- Tlon 会追加可选的模型签名，并在群组回复后记录参与过的线程。通用持久化投递不得绕过这些效果；要么将它们移入 Tlon 的渲染、发送、最终化适配器，要么让 Tlon 保持在渠道自有路径上。
- Discord 和其他已准备的分发器已经自有直接投递和预览行为。在它们的已准备分发器显式通过发送上下文路由最终消息之前，它们不受组装轮次的持久化保证覆盖。
- Telegram 静默回退投递必须投递完整的投影载荷数组。单载荷捷径可能会在投影后丢弃额外的回退载荷。
- LINE、Zalo、Nostr 和其他现有的组装/辅助路径可能具有回复令牌处理、媒体代理、已发送消息缓存、加载/状态清理，或仅回调目标。在这些语义由发送适配器表示并由测试验证之前，它们保持在渠道自有投递上。
- 直接私信辅助函数可能有一个回复回调，而它是唯一正确的传输目标。通用出站不得根据 `OriginatingTo` 或 `To` 猜测并跳过该回调。
- OpenClaw Gateway 网关失败输出必须对人类保持可见，但带标签的机器人创作房间回声必须在 `allowBots` 授权之前丢弃。渠道不得用可见文本前缀过滤器实现这一点，除非作为短期紧急止损；持久化契约应使用结构化来源元数据。

## 内部存储

持久化队列应存储消息发送意图，而不是回复载荷。

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

恢复循环：

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

队列应保留足够的身份信息，以便在重启后通过相同的账号、线程、目标、格式策略和媒体规则进行重放。

## 失败类别

渠道适配器会将传输失败分类到封闭类别中：

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

核心策略：

- 重试 `transient` 和 `rate_limit`。
- 不要重试 `invalid_payload`，除非存在渲染回退。
- 在配置变更之前，不要重试 `auth` 或 `permission`。
- 对于 `not_found`，当渠道声明这样做安全时，允许实时最终化从编辑回退到新发送。
- 对于 `conflict`，使用回执/幂等性规则判断消息是否已存在。
- 适配器可能已完成平台 I/O、但在回执提交之前发生的任何错误都会变为 `unknown_after_send`，除非适配器能够证明平台操作没有发生。

## 渠道映射

| 渠道            | 目标迁移                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | 接收确认策略加持久化最终发送。实时适配器负责发送和编辑预览、过期预览的最终发送、话题、引用回复预览跳过、媒体降级，以及 retry-after 处理。                                                                                                                                                                   |
| Discord         | 发送适配器封装现有的持久化载荷投递。实时适配器负责草稿编辑、进度草稿、媒体/错误预览取消、回复目标保留，以及消息 ID 回执。审计共享房间中由 Bot 发出的 Gateway 网关故障回显；如果 Discord 无法在普通消息上携带来源元数据，则使用出站注册表或其他原生等效机制。 |
| Slack           | 发送适配器处理普通聊天发帖。实时适配器在线程形态支持时选择原生流，否则使用草稿预览。回执保留线程时间戳。来源适配器将 OpenClaw Gateway 网关故障映射到 Slack `chat.postMessage.metadata`，并在 `allowBots` 授权前丢弃带标签的 Bot 房间回显。                                  |
| WhatsApp        | 发送适配器负责文本/媒体发送及持久化最终意图。接收适配器处理群组提及和发送者身份。在 WhatsApp 拥有可编辑传输协议之前，可以不提供实时适配器。                                                                                                                                                                        |
| Matrix          | 实时适配器负责草稿事件编辑、最终化、撤回、加密媒体约束，以及回复目标不匹配降级。接收适配器负责加密事件水合和去重。来源适配器应将 OpenClaw Gateway 网关故障来源编码进 Matrix 事件内容，并在 `allowBots` 处理前丢弃已配置 Bot 的房间回显。              |
| Mattermost      | 实时适配器负责一个草稿帖子、进度/工具折叠、原位最终化，以及重新发送降级。                                                                                                                                                                                                                                                       |
| Microsoft Teams | 实时适配器负责原生进度和分块流式传输行为。发送适配器负责活动和附件/卡片回执。                                                                                                                                                                                                                                        |
| Feishu          | 渲染适配器负责文本/卡片/原始渲染。实时适配器负责流式卡片和重复最终消息抑制。发送适配器负责评论、话题会话、媒体，以及语音抑制。                                                                                                                                                                      |
| QQ Bot          | 实时适配器负责 C2C 流式传输、累加器超时，以及降级最终发送。渲染适配器负责媒体标签和文本转语音。                                                                                                                                                                                                                               |
| Signal          | 简单接收加发送适配器。除非 signal-cli 添加可靠的编辑支持，否则不提供实时适配器。                                                                                                                                                                                                                                                                |
| iMessage        | 简单接收加发送适配器。在持久化最终消息可绕过监视器投递之前，iMessage 发送必须保留监视器回显缓存填充。                                                                                                                                                                                                                 |
| Google Chat     | 简单接收加发送适配器，并将线程关系映射到空间和线程 ID。审计 `allowBots=true` 房间行为，检查带标签的 OpenClaw Gateway 网关故障回显。                                                                                                                                                                                        |
| LINE            | 简单接收加发送适配器，并将回复令牌约束建模为目标/关系能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 接收桥加发送适配器。                                                                                                                                                                                                                                                                                                                          |
| IRC             | 简单接收加发送适配器，不提供持久化编辑回执。                                                                                                                                                                                                                                                                                                    |
| Nostr           | 针对加密私信的接收加发送适配器；回执是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel      | 用于接收、发送、实时、重试和恢复行为的合约测试适配器。                                                                                                                                                                                                                                                                                   |
| Synology Chat   | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Tlon            | 在启用通用持久化最终投递之前，发送适配器必须保留模型签名渲染和已参与线程跟踪。                                                                                                                                                                                                                        |
| Twitch          | 简单接收加发送适配器，并带有速率限制分类。                                                                                                                                                                                                                                                                                               |
| Zalo            | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |

## 迁移计划

### 阶段 1：内部消息域

- 添加 `src/channels/message/*` 类型，用于消息、目标、关系、
  来源、回执、能力、持久化意图、接收上下文、发送
  上下文、实时上下文，以及故障类别。
- 将 `origin?: MessageOrigin` 添加到当前回复投递使用的迁移桥载荷类型，
  然后随着重构替换回复载荷，将该字段移动到 `ChannelMessage` 和已渲染
  消息类型。
- 在适配器和测试证明该形态之前，保持其内部使用。
- 为状态转换和序列化添加纯单元测试。

### 阶段 2：持久化发送核心

- 将现有出站队列从回复载荷持久化迁移到持久化
  消息发送意图。
- 允许持久化发送意图携带投影后的载荷数组或批处理计划，而不
  只是一个回复载荷。
- 通过兼容转换保留当前队列恢复行为。
- 让 `deliverOutboundPayloads` 调用 `messages.send`。
- 在适配器声明重放安全后，在新的消息生命周期中将最终发送持久化设为默认，
  并在无法写入持久化意图时保守失败。现有入站运行器和 SDK 兼容路径
  在此阶段默认仍为直接发送。
- 一致地记录回执。
- 将回执和投递结果返回给原始调度器调用方，而不是将持久化发送
  视为终结性副作用。
- 通过持久化发送意图持久化消息来源，使恢复、重放和
  分块发送保留 OpenClaw 操作来源。

### 阶段 3：频道入站桥

- 基于 `messages.receive` 和 `messages.send` 重新实现
  `channel.inbound.run` 和 `dispatchChannelInboundReply`。
- 保持当前事实类型稳定。
- 默认保留旧行为。只有当适配器使用重放安全的持久化策略明确选择加入时，
  已组装轮次的渠道才会变为持久化。
- 保留 `durable: false` 作为兼容逃生口，用于那些会最终化
  原生编辑且尚不能安全重放的路径，但不要依赖 `false` 标记
  来保护未迁移的渠道。
- 仅在新的消息生命周期中默认启用已组装轮次持久化，并且要在
  渠道映射证明通用发送路径保留旧渠道投递语义之后启用。

### 阶段 4：预备调度器桥

- 用发送上下文桥接替换 `deliverDurableInboundReplyPayload`。
- 将旧 helper 保留为包装器。
- 先迁移 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因为
  它们已经有持久化最终态工作，或发送路径更简单。
- 将每个已准备的 dispatcher 都视为未覆盖，直到它显式选择使用
  发送上下文。文档和 changelog 条目必须说明“组装的渠道轮次”，或点名已迁移的渠道路径，而不是声称所有
  自动最终回复都已覆盖。
- 保持 `recordInboundSessionAndDispatchReply`、direct-DM helper 和类似
  公共兼容性 helper 的行为不变。它们以后可以暴露显式的
  发送上下文选择入口，但不得在调用方拥有的投递回调之前自动尝试通用持久化
  投递。

### 阶段 5：统一实时生命周期

- 构建 `messages.live`，并配套两个证明 adapter：
  - Telegram，用于发送、编辑以及过期最终发送。
  - Matrix，用于草稿最终化和撤回 fallback。
- 然后迁移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每个渠道都有对等测试后，才删除重复的预览最终化代码。

### 阶段 6：公共 SDK

- 添加 `openclaw/plugin-sdk/channel-outbound`。
- 将它记录为首选渠道插件 API。
- 更新 package exports、entrypoint 清单、生成的 API baseline，以及
  插件 SDK 文档。
- 在 channel-outbound SDK 表面中包含 `MessageOrigin`、origin 编码/解码钩子，以及共享的
  `shouldDropOpenClawEcho` 谓词。
- 为旧 subpath 保留兼容性包装器。
- 在内置插件迁移完成后，在文档中将以 reply 命名的 SDK helper 标记为
  deprecated。

### 阶段 7：所有发送方

将所有非回复的 outbound producer 迁移到 `messages.send`：

- cron 和 Heartbeat 通知
- 任务完成
- hook 结果
- 审批提示和审批结果
- 消息工具发送
- 子智能体完成公告
- 显式 CLI 或 Control UI 发送
- 自动化/广播路径

这里模型不再是“智能体回复”，而变成“OpenClaw 发送
消息”。

### 阶段 8：移除以 Turn 命名的兼容性

- 保留 inbound/message 命名的包装器作为兼容窗口。
- 发布迁移说明。
- 针对旧 import 运行插件 SDK 兼容性测试。
- 只有在没有内置插件需要旧内部 helper，且第三方契约已有稳定替代方案后，
  才移除或隐藏旧内部 helper。

## 测试计划

单元测试：

- 持久化发送意图的序列化和恢复。
- 幂等键复用和重复抑制。
- 回执提交和重放跳过。
- 当 adapter 支持对账时，`unknown_after_send` 恢复会在重放前先对账。
- 失败分类策略。
- 接收 ack 策略排序。
- reply、followup、system 和 broadcast 发送的关系映射。
- Gateway 网关失败 origin 工厂和 `shouldDropOpenClawEcho` 谓词。
- origin 在 payload 规范化、分块、持久化队列序列化和恢复过程中的保留。

集成测试：

- `channel.inbound.run` 简单 adapter 仍会记录并发送。
- 旧的 assembled-event 投递不会变为持久化，除非渠道显式选择启用。
- `channel.inbound.runPreparedReply` 桥接仍会记录并最终化。
- 公共兼容性 helper 默认调用调用方拥有的投递回调，且不会在这些回调之前执行通用发送。
- 持久化 fallback 投递在重启后会重放完整的 projected payload 数组，并且不会在早期崩溃后让后续 payload 未被记录。
- 持久化 assembled-event 投递会将平台消息 ID 返回给缓冲 dispatcher。
- 当持久化投递被禁用或不可用时，自定义投递 hook 仍会返回平台消息 ID。
- 最终回复能在 assistant 完成与平台发送之间重启后保留下来。
- 允许时，预览草稿会原地最终化。
- 当媒体/错误/回复目标不匹配需要普通投递时，预览草稿会被取消或撤回。
- 分块流式传输和预览流式传输不会同时投递相同文本。
- 提前流式传输的媒体不会在最终投递中重复。

渠道测试：

- Telegram topic reply 的 polling ack 延迟到接收上下文的安全完成水位线。
- Telegram 对已接受但未投递 update 的 polling 恢复由持久化的安全完成 offset 模型覆盖。
- Telegram 过期预览会发送新的最终消息并清理预览。
- Telegram silent fallback 会发送每个 projected fallback payload。
- Telegram silent fallback 持久性会原子记录完整 projected fallback 数组，而不是在每次循环迭代中记录一个单 payload 持久化意图。
- Discord 在媒体/错误/显式回复时取消预览。
- 在文档或 changelog 声称 Discord 最终回复持久化之前，Discord 已准备 dispatcher 的最终态会通过发送上下文路由。
- iMessage 持久化最终发送会填充 monitor sent-message echo 缓存。
- 在 LINE、Zalo 和 Nostr 的 adapter 对等测试存在之前，旧投递路径不会被
  通用持久化发送绕过。
- Direct-DM/Nostr 回调投递仍然具有权威性，除非显式迁移到完整消息目标和可安全重放的发送 adapter。
- Slack 带标记的 OpenClaw Gateway 网关故障消息保持 outbound 可见，带标记的 bot-room echo 会在 `allowBots` 前丢弃，未标记但可见文本相同的 bot 消息仍遵循正常 bot 授权。
- Slack 原生流式传输 fallback 到顶层私信中的草稿预览。
- Matrix 预览最终化和撤回 fallback。
- Matrix 中来自已配置 bot 账号、带标记的 OpenClaw Gateway 网关故障房间 echo 会在 `allowBots` 处理前丢弃。
- Discord 和 Google Chat 共享房间 Gateway 网关故障级联审计会覆盖
  `allowBots` 模式，之后才声明通用保护。
- Mattermost 草稿最终化和新发送 fallback。
- Teams 原生进度最终化。
- Feishu 重复最终态抑制。
- QQ Bot accumulator timeout fallback。
- Tlon 持久化最终发送会保留 model-signature 渲染和已参与 thread 跟踪。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal 简单持久化最终
  发送。

验证：

- 开发期间使用目标 Vitest 文件。
- 在 Testbox 中对完整变更表面运行 `pnpm check:changed`。
- 在完整重构落地前，或公共 SDK/export 变更后，在 Testbox 中运行更广泛的 `pnpm check`。
- 在移除兼容性包装器之前，至少对一个支持编辑的渠道和一个
  简单仅发送渠道执行 live 或 qa-channel smoke。

## 未决问题

- Telegram 是否最终应将 grammY runner source 替换为完全持久化的 polling source，以便控制平台级重投递，而不仅仅是 OpenClaw 的持久化重启水位线。
- 持久化实时预览状态应存储在与最终发送意图相同的队列记录中，还是存储在同级 live-state store 中。
- `plugin-sdk/channel-outbound` 发布后，兼容性包装器应在文档中保留多久。
- 第三方插件应直接实现接收 adapter，还是只通过 `defineChannelMessageAdapter` 提供 normalize/send/live hook。
- 哪些回执字段可以安全暴露在公共 SDK 中，哪些应保留为内部运行时状态。
- 自回显缓存和已参与 thread 标记等副作用，应建模为发送上下文 hook、adapter 拥有的 finalize 步骤，还是回执 subscriber。
- 哪些渠道具备原生 origin 元数据，哪些需要持久化 outbound registry，哪些无法提供可靠的跨 bot echo 抑制。

## 验收标准

- 每个内置消息渠道都通过 `messages.send` 发送最终可见输出。
- 每个 inbound 消息渠道都通过 `messages.receive` 或有文档说明的兼容性包装器进入。
- 每个预览/编辑/流式传输渠道都使用 `messages.live` 管理草稿状态和最终化。
- `channel.inbound` 只是包装器。
- 以 reply 命名的 SDK helper 是兼容性 export，而不是推荐路径。
- 持久化恢复可以在重启后重放待处理的最终发送，不会丢失最终响应，也不会重复已提交的发送；平台结果未知的发送会在重放前对账，或针对该 adapter 文档说明为至少一次。
- 当持久化意图无法写入时，持久化最终发送会 fail closed，除非调用方显式选择了有文档说明的非持久化模式。
- 旧 SDK 兼容性 helper 默认使用渠道拥有的直接投递；通用持久化发送只能显式选择启用。
- 回执会保留多段投递的所有平台消息 ID，并保留一个 primary ID 以便 thread/edit 使用。
- 持久化包装器会在替换直接投递回调前保留渠道本地副作用。
- 已准备的 dispatcher 在其最终投递路径显式使用发送上下文之前，不计为持久化。
- Fallback 投递会处理每个 projected payload。
- 持久化 fallback 投递会在一个可重放意图或批处理计划中记录每个 projected payload。
- OpenClaw 发起的 Gateway 网关故障输出对人类可见，但在声明支持 origin 契约的渠道上，带标记的 bot-authored room echo 会在 bot 授权前丢弃。
- 文档会解释发送、接收、实时、状态、回执、关系、失败策略、迁移和测试覆盖。

## 相关

- [消息](/zh-CN/concepts/messages)
- [流式传输和分块](/zh-CN/concepts/streaming)
- [进度草稿](/zh-CN/concepts/progress-drafts)
- [重试策略](/zh-CN/concepts/retry)
- [渠道 inbound API](/zh-CN/plugins/sdk-channel-inbound)
