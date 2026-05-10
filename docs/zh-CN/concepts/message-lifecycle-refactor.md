---
read_when:
    - 重构渠道发送或接收行为
    - 更改频道轮次、回复分发、出站队列、预览流式传输或插件 SDK 消息 API
    - 设计需要持久化发送、回执、预览、编辑或重试的新渠道插件
summary: 统一的持久消息接收、发送、预览、编辑和流式传输生命周期设计计划
title: 消息生命周期重构
x-i18n:
    generated_at: "2026-05-10T19:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此页面是目标设计，用于用一个持久的消息生命周期，替换分散的渠道轮次、回复分发、预览流式传输和出站投递辅助逻辑。

简短版本：

- 核心原语应是 **receive** 和 **send**，而不是 **reply**。
- 回复只是出站消息上的一种关系。
- 轮次是入站处理的便利形式，不是投递的所有者。
- 发送必须基于上下文：`begin`、渲染、预览或流式传输、最终发送、提交、失败。
- 接收也必须基于上下文：规范化、去重、路由、记录、分发、平台确认、失败。
- 公共插件 SDK 应收敛为一个小型的渠道消息表面。

## 问题

当前渠道栈源自几个合理的局部需求：

- 简单入站适配器使用 `runtime.channel.turn.run`。
- 富适配器使用 `runtime.channel.turn.runPrepared`。
- 旧版辅助逻辑使用 `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、回复载荷辅助逻辑、回复分块、回复引用和出站运行时辅助逻辑。
- 预览流式传输位于特定渠道的分发器中。
- 最终投递持久性正在围绕现有回复载荷路径添加。

这种形态修复了局部问题，但也让 OpenClaw 具有过多公共概念，并在过多位置让投递语义发生漂移。

暴露这一问题的可靠性场景是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目标不变量比 Telegram 更广：一旦核心决定应存在一条可见的出站消息，在尝试平台发送之前，意图必须已持久化；成功后必须提交平台回执。这样 OpenClaw 就具备至少一次恢复能力。严格一次行为只存在于能够证明原生幂等性，或能在重放前将发送后未知状态的尝试与平台状态进行对账的适配器中。

这是本次重构的最终状态，不是对每一条当前路径的描述。在迁移期间，当尽力而为的队列写入失败时，现有出站辅助逻辑仍可回退到直接发送。只有当持久化最终发送以关闭方式失败，或通过文档化的非持久策略明确选择退出时，重构才算完成。

## 目标

- 为所有渠道消息接收和发送路径提供一个核心生命周期。
- 在适配器声明重放安全行为后，新消息生命周期中的最终发送默认持久化。
- 共享预览、编辑、流式传输、最终化、重试、恢复和回执语义。
- 提供一个第三方插件易于学习和维护的小型插件 SDK 表面。
- 在迁移期间兼容现有 `channel.turn` 调用方。
- 为新的渠道能力提供清晰扩展点。
- 核心中没有平台特定分支。
- 没有 token-delta 渠道消息。渠道流式传输仍是消息预览、编辑、追加或已完成的块投递。
- 为运行/系统输出提供结构化 OpenClaw 来源元数据，使可见的 Gateway 网关故障不会在启用 bot 的共享房间中作为新提示重新进入。

## 非目标

- 不在第一阶段移除 `runtime.channel.turn.*`。
- 不强制每个渠道采用相同的原生传输行为。
- 不让核心了解 Telegram 话题、Slack 原生流、Matrix 撤回、Feishu 卡片、QQ 语音或 Teams 活动。
- 不把所有内部迁移辅助逻辑发布为稳定 SDK API。
- 不让重试重放已完成的非幂等平台操作。

## 参考模型

Vercel Chat 有一个很好的公共心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 适配器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping` 和历史获取
- 用于去重、锁、队列和持久化的状态适配器

OpenClaw 应借用其词汇，而不是复制其表面。

OpenClaw 在该模型之外还需要：

- 在直接传输调用之前持久化出站发送意图。
- 带有 begin、commit 和 fail 的显式发送上下文。
- 了解平台确认策略的接收上下文。
- 能在重启后保留，并可驱动编辑、删除、恢复和重复抑制的回执。
- 更小的公共 SDK。内置插件可以使用内部运行时辅助逻辑，但第三方插件应看到一个一致的消息 API。
- 智能体特定行为：会话、转录、分块流式传输、工具进度、审批、媒体指令、静默回复和群组提及历史。

`thread.post()` 风格的 promise 对 OpenClaw 来说还不够。它们隐藏了决定一次发送是否可恢复的事务边界。

## 核心模型

新领域应位于内部核心命名空间下，例如 `src/channels/message/*`。

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

回复是一种关系，而不是 API 根：

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

这让同一条发送路径可以处理普通回复、cron 通知、审批提示、任务完成、消息工具发送、CLI 或 Control UI 发送、子智能体结果以及自动化发送。

### 来源

来源描述是谁生成了一条消息，以及 OpenClaw 应如何处理该消息的回声。它与关系分离：一条消息可以是对用户的回复，同时仍然是 OpenClaw 来源的运行输出。

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

核心拥有 OpenClaw 来源输出的含义。渠道拥有如何将该来源编码到其传输中的方式。

第一个必需用途是 Gateway 网关故障输出。人类仍应看到诸如 “Agent failed before reply” 或 “Missing API key” 的消息，但带标签的 OpenClaw 运行输出在 `allowBots` 启用时，不得在共享房间中被接受为 bot 编写的输入。

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

一个回执可以描述一条平台消息或一次多部分投递。分块文本、媒体加文本、语音加文本和卡片回退必须保留所有平台 ID，同时仍公开一个主 ID，用于线程关联和后续编辑。

## 接收上下文

接收不应是一个裸辅助调用。核心需要一个了解去重、路由、会话记录和平台确认策略的上下文。

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

确认不是一件单一的事。接收契约必须将这些信号分开：

- **传输确认：** 告诉平台 webhook 或 socket，OpenClaw 已接受事件信封。有些平台要求在分发前完成这一点。
- **轮询偏移确认：** 推进游标，使同一事件不再被再次获取。它不得推进到无法恢复的工作之后。
- **入站记录确认：** 确认 OpenClaw 已持久化足够的入站元数据，可用于对重投递进行去重和路由。
- **用户可见回执：** 可选的已读/状态/正在输入行为；绝不是持久性边界。

`ReceiveAckPolicy` 只控制传输或轮询确认。不得将它复用于已读回执或状态 reaction。

在 bot 授权之前，当渠道能够解码消息来源元数据时，接收必须应用共享的 OpenClaw 回声策略：

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

此丢弃是基于标签，而不是基于文本。具有相同可见 Gateway 网关故障文本、但没有 OpenClaw 来源元数据的 bot 编写房间消息，仍会经过正常的 `allowBots` 授权。

确认策略是显式的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 轮询现在为其持久化重启水位线使用接收上下文确认策略。tracker 仍会观察进入中间件链的 grammY 更新，但 OpenClaw 只会在成功分发后持久化安全的已完成更新 ID，让失败或较低的待处理更新可在重启后重放。Telegram 上游 `getUpdates` 获取偏移仍由轮询库控制，因此如果我们需要超出 OpenClaw 重启水位线的平台级重投递，剩下的更深层改动是完全持久化的轮询源。Webhook 平台可能需要即时 HTTP 确认，但它们仍需要入站去重和持久化出站发送意图，因为 webhook 可能会重投递。

## 发送上下文

发送也基于上下文：

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

首选编排方式：

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

该辅助函数会展开为：

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

意图必须先于传输 I/O 存在。在开始之后、提交之前重启是可恢复的。

危险边界位于平台成功之后、回执提交之前。如果进程在此处终止，除非适配器提供原生幂等性或回执对账路径，否则 OpenClaw 无法知道平台消息是否存在。这些尝试必须以 `unknown_after_send` 恢复，不能盲目重放。没有对账能力的渠道只有在重复可见消息对该渠道和关系而言是可接受且已记录的权衡时，才可以选择至少一次重放。当前 SDK 对账桥要求适配器声明 `reconcileUnknownSend`，然后请求 `durableFinal.reconcileUnknownSend` 将未知条目分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重放，未解决条目保持终态，或只重试对账检查。

持久性策略必须显式：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示 core 在无法写入持久意图时必须失败关闭。`best_effort` 可以在持久化不可用时继续执行。`disabled` 保留旧的直接发送行为。迁移期间，旧版包装器和公共兼容性辅助函数默认使用 `disabled`；它们不得因为某个渠道有通用出站适配器就推断为 `required`。

发送上下文也拥有渠道本地的发送后效果。如果持久投递绕过了之前附加到渠道直接发送路径的本地行为，则迁移并不安全。示例包括自回显抑制缓存、线程参与标记、原生编辑锚点、模型签名渲染，以及平台特定的重复防护。必须先将这些效果移动到发送适配器、渲染适配器，或命名的发送上下文钩子中，该渠道才能启用持久通用最终投递。

发送辅助函数必须一路将回执返回给调用方。持久包装器不能吞掉消息 ID，也不能用 `undefined` 替换渠道投递结果；缓冲分发器会使用这些 ID 作为线程锚点、后续编辑、预览最终化和重复抑制的依据。

回退发送作用于批次，而不是单个载荷。静默回复重写、媒体回退、卡片回退和分块投影都可能产生多个可投递消息，因此发送上下文必须投递整个投影批次，或者明确记录为什么只有一个载荷有效。

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

当这种回退是持久的，整个投影批次必须由一个持久发送意图或另一种原子批次计划表示。逐个载荷记录是不够的：载荷之间崩溃可能留下部分可见回退，而剩余载荷没有持久记录。恢复必须知道哪些单元已经有回执，并且要么只重放缺失单元，要么将批次标记为 `unknown_after_send`，直到适配器完成对账。

## 实时上下文

预览、编辑、进度和流式行为应属于一个可选择加入的生命周期。

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

实时状态应具备足够持久性，以便恢复或抑制重复：

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

这应该覆盖当前行为：

- Telegram 发送加编辑预览，并在预览过旧后发送全新的最终消息。
- Discord 发送加编辑预览，并在媒体、错误或显式回复时取消。
- Slack 根据线程形态使用原生流或草稿预览。
- Mattermost 草稿帖子最终化。
- Matrix 草稿事件最终化，或在不匹配时撤回。
- Teams 原生进度流。
- QQ Bot 流式传输或累积回退。

## 适配器接口

公共 SDK 目标应为一个子路径：

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
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

在预检授权之前，只要 `origin.decode` 返回 OpenClaw 来源元数据，core 就必须运行共享的 OpenClaw 回显判定。接收适配器提供机器人作者和房间形态等平台事实；core 拥有丢弃决策和顺序，因此渠道无需重新实现文本过滤器。

来源适配器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

core 设置 `MessageOrigin`。渠道只负责将它翻译为原生传输元数据，或从原生传输元数据翻译回来。Slack 将其映射到 `chat.postMessage({ metadata })` 和入站 `message.metadata`；Matrix 可以将其映射到额外事件内容；没有原生元数据的渠道可以在这是最佳可用近似方式时使用回执/出站注册表。

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

新的公共表面应吸收或弃用这些概念区域：

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

内置插件在迁移期间可以继续通过预留运行时子路径使用内部辅助导入。公共文档应在 `plugin-sdk/channel-message` 存在后引导插件作者使用它。

## 与渠道轮次的关系

`runtime.channel.turn.*` 应在迁移期间保留。

它应变为兼容性适配器：

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` 最初也应保留：

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

在所有内置插件和已知第三方兼容性路径都接入桥接后，可以弃用 `channel.turn`。在发布 SDK 迁移路径并通过契约测试证明旧插件仍可工作，或会以明确的版本错误失败之前，不应移除它。

## 兼容性护栏

迁移期间，对于任何现有投递回调除了“发送此载荷”之外还有副作用的渠道，通用持久投递都必须选择加入。

旧版入口点默认不持久：

- `channel.turn.run` 和 `dispatchAssembledChannelTurn` 使用渠道的投递回调，除非该渠道显式提供已审计的持久策略/选项对象。
- `channel.turn.runPrepared` 保持由渠道拥有，直到准备好的分发器显式调用发送上下文。
- `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接私信辅助函数等公共兼容性辅助函数，绝不会在调用方提供的 `deliver` 或 `reply` 回调之前注入通用持久投递。

对于迁移桥类型，`durable: undefined` 表示“非持久”。只有显式的策略/选项值才会启用持久路径。`durable: false` 可以继续作为兼容性写法保留，但实现不应要求每个未迁移渠道都添加它。

当前桥接代码必须保持持久性决策显式：

- 持久化最终投递会返回一个可判别的状态。`handled_visible` 和
  `handled_no_send` 是终态；`unsupported` 和 `not_applicable` 可以回退到
  渠道自有的投递；`failed` 会传播发送失败。
- 通用持久化最终投递受适配器能力门控，例如静默投递、回复目标保留、原生引用保留，以及
  消息发送钩子。缺少对等能力时应选择渠道自有的投递，
  而不是会改变用户可见行为的通用发送。
- 队列支撑的持久化发送会暴露投递意图引用。现有
  `pendingFinalDelivery*` 会话字段可以在过渡期间携带意图 id；
  最终状态是一个 `MessageSendIntent` 存储，而不是冻结的
  回复文本加临时上下文字段。

在以下条件全部为真之前，不要为某个渠道启用通用持久化路径：

- 通用发送适配器执行与旧直接路径相同的渲染和传输行为。
- 本地发送后副作用通过发送上下文得到保留。
- 适配器返回包含所有平台消息 id 的回执或投递结果。
- 预备的调度器路径要么调用新的发送上下文，要么保持文档说明其不在持久化保证范围内。
- 回退投递处理每一个投影后的载荷，而不仅是第一个。
- 持久化回退投递将整个投影后载荷数组记录为一个可重放意图或批处理计划。

需要保留的具体迁移风险：

- iMessage 监控器投递会在成功发送后将已发送消息记录到回声缓存中。持久化最终发送仍必须填充该缓存，否则
  OpenClaw 可能会把自己的最终回复重新摄取为入站用户消息。
- Tlon 会追加可选的模型签名，并在群组回复后记录已参与的线程。通用持久化投递不得绕过这些效果；
  要么将它们移入 Tlon 的渲染/发送/最终化适配器，要么让 Tlon 继续使用
  渠道自有路径。
- Discord 和其他预备调度器已经拥有直接投递和预览行为。在它们的预备调度器明确通过发送上下文路由最终消息之前，
  这些调度器不受组装轮次持久化保证覆盖。
- Telegram 静默回退投递必须投递完整的投影后载荷数组。单载荷捷径可能会在投影后丢弃额外的回退载荷。
- LINE、Zalo、Nostr 以及其他现有组装/辅助路径可能
  有回复令牌处理、媒体代理、已发送消息缓存、加载/Status
  清理，或仅回调目标。在这些语义由发送适配器表示并通过测试验证之前，
  它们继续使用渠道自有投递。
- 直接私信辅助方法可能有一个回复回调，而它才是唯一正确的传输
  目标。通用出站不得根据 `OriginatingTo` 或 `To` 猜测并跳过
  该回调。
- OpenClaw Gateway 网关失败输出必须继续对人类可见，但带标记的
  bot 所写房间回声必须在 `allowBots` 授权前被丢弃。
  渠道不得使用可见文本前缀过滤器来实现这一点，除非作为
  短期紧急止损；持久化契约是结构化来源元数据。

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

队列应保留足够的身份信息，以便在重启后通过相同的账号、
线程、目标、格式化策略和媒体规则进行重放。

## 失败类别

渠道适配器将传输失败分类为封闭类别：

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
- 除非存在渲染回退，否则不要重试 `invalid_payload`。
- 在配置变更之前，不要重试 `auth` 或 `permission`。
- 对于 `not_found`，当渠道声明安全时，允许实时最终化从编辑回退到新发送。
- 对于 `conflict`，使用回执/idempotency 规则来判断消息是否已经存在。
- 在适配器可能已经完成平台 I/O 之后、回执提交之前发生的任何错误，都会变为 `unknown_after_send`，除非适配器能够证明平台操作没有发生。

## 渠道映射

| 渠道            | 目标迁移                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | 接收 ack 策略并进行持久化最终发送。实时适配器负责发送和编辑预览、过期预览的最终发送、话题、跳过引用回复预览、媒体回退，以及 retry-after 处理。                                                                                                                                                                   |
| Discord         | 发送适配器包装现有的持久化载荷投递。实时适配器负责草稿编辑、进度草稿、媒体/错误预览取消、回复目标保留，以及消息 ID 回执。审计共享房间中由机器人发送的 Gateway 网关失败回显；如果 Discord 无法在普通消息上携带来源元数据，则使用出站注册表或其他原生等价机制。 |
| Slack           | 发送适配器处理普通聊天发布。实时适配器在线程形态支持时选择原生流，否则使用草稿预览。回执保留线程时间戳。来源适配器将 OpenClaw Gateway 网关失败映射到 Slack `chat.postMessage.metadata`，并在 `allowBots` 授权前丢弃带标记的机器人房间回显。                                  |
| WhatsApp        | 发送适配器负责带持久化最终意图的文本/媒体发送。接收适配器处理群组提及和发送者身份。实时适配器可以暂时缺席，直到 WhatsApp 拥有可编辑传输协议。                                                                                                                                                                        |
| Matrix          | 实时适配器负责草稿事件编辑、最终化、撤回、加密媒体约束，以及回复目标不匹配回退。接收适配器负责加密事件补水和去重。来源适配器应将 OpenClaw Gateway 网关失败来源编码进 Matrix 事件内容，并在 `allowBots` 处理前丢弃已配置机器人的房间回显。              |
| Mattermost      | 实时适配器负责一个草稿帖子、进度/工具折叠、原位最终化，以及重新发送回退。                                                                                                                                                                                                                                                       |
| Microsoft Teams | 实时适配器负责原生进度和分块流式传输行为。发送适配器负责活动和附件/卡片回执。                                                                                                                                                                                                                                        |
| Feishu          | 渲染适配器负责文本/卡片/原始渲染。实时适配器负责流式卡片和重复最终消息抑制。发送适配器负责评论、话题会话、媒体，以及语音抑制。                                                                                                                                                                      |
| QQ Bot          | 实时适配器负责 C2C 流式传输、累加器超时，以及回退最终发送。渲染适配器负责媒体标签和文本转语音。                                                                                                                                                                                                                               |
| Signal          | 简单接收加发送适配器。除非 signal-cli 增加可靠的编辑支持，否则不需要实时适配器。                                                                                                                                                                                                                                                                |
| iMessage        | 简单接收加发送适配器。iMessage 发送必须保留监控器回显缓存填充，然后持久化最终消息才能绕过监控器投递。                                                                                                                                                                                                                 |
| Google Chat     | 简单接收加发送适配器，并将线程关系映射到空间和线程 ID。审计 `allowBots=true` 房间中带标记的 OpenClaw Gateway 网关失败回显行为。                                                                                                                                                                                        |
| LINE            | 简单接收加发送适配器，并将回复令牌约束建模为目标/关系能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 接收桥加发送适配器。                                                                                                                                                                                                                                                                                                                          |
| IRC             | 简单接收加发送适配器，没有持久化编辑回执。                                                                                                                                                                                                                                                                                                    |
| Nostr           | 用于加密私信的接收加发送适配器；回执是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel      | 用于接收、发送、实时、重试和恢复行为的契约测试适配器。                                                                                                                                                                                                                                                                                   |
| Synology Chat   | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Tlon            | 在启用通用持久化最终投递前，发送适配器必须保留模型签名渲染和已参与线程跟踪。                                                                                                                                                                                                                        |
| Twitch          | 简单接收加发送适配器，并带有速率限制分类。                                                                                                                                                                                                                                                                                               |
| Zalo            | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |

## 迁移计划

### 第 1 阶段：内部消息域

- 添加 `src/channels/message/*` 类型，用于消息、目标、关系、
  来源、回执、能力、持久化意图、接收上下文、发送
  上下文、实时上下文，以及失败类别。
- 将 `origin?: MessageOrigin` 添加到当前回复投递使用的迁移桥载荷类型，
  然后随着重构替换回复载荷，将该字段移动到 `ChannelMessage` 和已渲染的
  消息类型。
- 在适配器和测试证明该形态前，保持其内部使用。
- 为状态转换和序列化添加纯单元测试。

### 第 2 阶段：持久化发送核心

- 将现有出站队列从回复载荷持久化迁移到持久化
  消息发送意图。
- 允许持久化发送意图携带投影后的载荷数组或批处理计划，而不仅是
  一个回复载荷。
- 通过兼容性转换保留当前队列恢复行为。
- 让 `deliverOutboundPayloads` 调用 `messages.send`。
- 在适配器声明重放安全后，使最终发送持久化成为默认行为，并在新的消息生命周期中无法写入持久化意图时
  关闭失败。现有频道轮次和 SDK 兼容路径在此阶段默认仍保持直接发送。
- 统一记录回执。
- 将回执和投递结果返回给原始调度器调用方，而不是把持久化发送视为终端副作用。
- 通过持久化发送意图持久化消息来源，使恢复、重放和
  分块发送保留 OpenClaw 操作来源信息。

### 第 3 阶段：频道轮次桥

- 基于 `messages.receive` 和 `messages.send` 重新实现
  `channel.turn.run` 和 `dispatchAssembledChannelTurn`。
- 保持当前事实类型稳定。
- 默认保留旧版行为。只有当组装轮次渠道的适配器通过重放安全持久化策略明确选择加入时，它才会变为持久化。
- 保留 `durable: false` 作为兼容性逃生口，用于最终化原生编辑且暂时无法安全重放的路径，
  但不要依赖 `false` 标记来保护未迁移的渠道。
- 只有在新的消息生命周期中，当渠道映射证明通用发送路径保留了旧渠道
  投递语义后，才默认启用组装轮次持久化。

### 第 4 阶段：预备调度器桥

- 用发送上下文桥接替换 `deliverDurableInboundReplyPayload`。
- 将旧辅助函数保留为包装器。
- 先迁移 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因为
  它们已经有持久化最终回复工作，或发送路径更简单。
- 在每个预备 dispatcher 明确选择使用发送上下文之前，都将其视为未覆盖。
  文档和 changelog 条目必须说“组装的渠道轮次”，或点名已迁移的渠道路径，
  而不是声称所有自动最终回复都已覆盖。
- 保持 `recordInboundSessionAndDispatchReply`、直接私信辅助函数以及类似
  公共兼容性辅助函数的行为不变。它们以后可以公开显式的发送上下文选择加入，
  但在调用方拥有的投递回调之前，不得自动尝试通用持久化投递。

### 阶段 5：统一 Live 生命周期

- 构建 `messages.live`，并带有两个证明适配器：
  - Telegram，用于发送、编辑以及过期最终发送。
  - Matrix，用于草稿最终化以及回退删除。
- 然后迁移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 仅在每个渠道都有对等测试之后，才删除重复的预览最终化代码。

### 阶段 6：公共 SDK

- 添加 `openclaw/plugin-sdk/channel-message`。
- 将其记录为首选渠道插件 API。
- 更新包导出、入口点清单、生成的 API 基线以及插件 SDK 文档。
- 在 channel-message SDK 表面中包含 `MessageOrigin`、来源编码/解码钩子以及共享的
  `shouldDropOpenClawEcho` 谓词。
- 为旧子路径保留兼容性包装器。
- 在内置插件迁移完成后，在文档中将以回复命名的 SDK 辅助函数标记为已弃用。

### 阶段 7：所有发送方

将所有非回复出站生产者迁移到 `messages.send`：

- cron 和 Heartbeat 通知
- 任务完成
- 钩子结果
- 审批提示和审批结果
- 消息工具发送
- 子智能体完成公告
- 显式 CLI 或控制界面发送
- 自动化/广播路径

这是模型不再是“智能体回复”，而变成“OpenClaw 发送消息”的阶段。

### 阶段 8：弃用 Turn

- 将 `channel.turn` 作为包装器保留至少一个兼容窗口。
- 发布迁移说明。
- 针对旧导入运行插件 SDK 兼容性测试。
- 仅在没有内置插件再需要旧内部辅助函数，并且第三方契约已有稳定替代方案后，
  才移除或隐藏这些辅助函数。

## 测试计划

单元测试：

- 持久化发送意图的序列化和恢复。
- 幂等键复用和重复抑制。
- 回执提交和重放跳过。
- 当适配器支持协调时，先协调再重放的 `unknown_after_send` 恢复。
- 失败分类策略。
- 接收确认策略排序。
- 回复、后续、系统和广播发送的关系映射。
- Gateway 网关失败来源工厂和 `shouldDropOpenClawEcho` 谓词。
- 来源在载荷归一化、分块、持久化队列序列化和恢复中的保留。

集成测试：

- `channel.turn.run` 简单适配器仍会记录并发送。
- 旧版组装轮次投递不会变成持久化，除非渠道明确选择加入。
- `channel.turn.runPrepared` 桥接仍会记录并最终化。
- 公共兼容性辅助函数默认调用调用方拥有的投递回调，并且不会在这些回调之前进行通用发送。
- 持久化回退投递在重启后会重放整个投影载荷数组，并且不能在早期崩溃后让后续载荷未被记录。
- 持久化组装轮次投递会将平台消息 ID 返回给缓冲 dispatcher。
- 在禁用或不可用持久化投递时，自定义投递钩子仍会返回平台消息 ID。
- 最终回复能在助手完成和平台发送之间重启后保留下来。
- 允许时，预览草稿会原地最终化。
- 当媒体、错误或回复目标不匹配需要普通投递时，预览草稿会被取消或删除。
- 分块流式传输和预览流式传输不会同时投递相同文本。
- 提前流式传输的媒体不会在最终投递中重复。

渠道测试：

- Telegram 主题回复，其轮询确认会延迟到接收上下文的安全完成水位。
- Telegram 轮询恢复针对已接受但未投递更新，由持久化的安全完成偏移模型覆盖。
- Telegram 过期预览会发送新的最终消息并清理预览。
- Telegram 静默回退会发送每个投影的回退载荷。
- Telegram 静默回退持久化会以原子方式记录完整的投影回退数组，而不是在每次循环迭代中记录一个单载荷持久化意图。
- Discord 在媒体、错误或显式回复时取消预览。
- 在文档或 changelog 声称 Discord 最终回复持久化之前，Discord 预备 dispatcher 的最终消息会通过发送上下文路由。
- iMessage 持久化最终发送会填充监控器的已发送消息回声缓存。
- LINE、Zalo 和 Nostr 旧版投递路径不会被通用持久化发送绕过，直到它们的适配器对等测试存在。
- 除非显式迁移到完整消息目标和可安全重放的发送适配器，否则直接私信/Nostr 回调投递仍保持权威。
- Slack 标记的 OpenClaw Gateway 网关失败消息保持可见出站；标记的机器人房间回声会在 `allowBots` 之前丢弃；具有相同可见文本的未标记机器人消息仍遵循正常机器人授权。
- Slack 原生流式传输在顶层私信中回退到草稿预览。
- Matrix 预览最终化和回退删除。
- Matrix 中来自已配置机器人账户、标记为 OpenClaw Gateway 网关失败的房间回声会在 `allowBots` 处理之前丢弃。
- Discord 和 Google Chat 共享房间 Gateway 网关失败级联审计会覆盖 `allowBots` 模式，然后才声称那里有通用保护。
- Mattermost 草稿最终化和新发送回退。
- Teams 原生进度最终化。
- Feishu 重复最终消息抑制。
- QQ Bot 累加器超时回退。
- Tlon 持久化最终发送会保留模型签名渲染和已参与线程跟踪。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal 简单持久化最终发送。

验证：

- 开发期间运行目标 Vitest 文件。
- 在 Testbox 中对完整变更表面运行 `pnpm check:changed`。
- 在完整重构落地之前，或在公共 SDK/导出变更之后，在 Testbox 中运行更广泛的 `pnpm check`。
- 在移除兼容性包装器之前，对至少一个支持编辑的渠道和一个简单仅发送渠道进行实时或 qa-channel 冒烟测试。

## 未决问题

- Telegram 是否最终应将 grammY runner 源替换为完全持久化的轮询源，
  该源可以控制平台级重投递，而不仅仅是 OpenClaw 的持久化重启水位。
- 持久化实时预览状态应存储在与最终发送意图相同的队列记录中，
  还是存储在同级实时状态存储中。
- `plugin-sdk/channel-message` 发布后，兼容性包装器应在文档中保留多久。
- 第三方插件是否应直接实现接收适配器，还是只通过 `defineChannelMessageAdapter`
  提供归一化、发送和实时钩子。
- 哪些回执字段可以安全地暴露在公共 SDK 中，而不是内部运行时状态。
- 自回声缓存和已参与线程标记等副作用，应建模为发送上下文钩子、
  适配器拥有的最终化步骤，还是回执订阅者。
- 哪些渠道有原生来源元数据，哪些需要持久化出站注册表，
  哪些无法提供可靠的跨机器人回声抑制。

## 验收标准

- 每个内置消息渠道都通过 `messages.send` 发送最终可见输出。
- 每个入站消息渠道都通过 `messages.receive` 或已记录的兼容性包装器进入。
- 每个预览/编辑/流式渠道都使用 `messages.live` 处理草稿状态和最终化。
- `channel.turn` 只是一个包装器。
- 以回复命名的 SDK 辅助函数是兼容性导出，而不是推荐路径。
- 持久化恢复可以在重启后重放待处理的最终发送，不会丢失最终响应，
  也不会重复已经提交的发送；平台结果未知的发送会在重放前协调，
  或者记录为该适配器的至少一次投递。
- 当无法写入持久化意图时，持久化最终发送会失败关闭，
  除非调用方明确选择了已记录的非持久化模式。
- 旧版 channel-turn 和 SDK 兼容性辅助函数默认使用直接的渠道拥有投递；
  通用持久化发送只能显式选择加入。
- 回执会为多部分投递保留所有平台消息 ID，并保留一个主 ID 以便线程/编辑使用。
- 持久化包装器在替换直接投递回调之前，会保留渠道本地副作用。
- 在预备 dispatcher 的最终投递路径明确使用发送上下文之前，不会将其计为持久化。
- 回退投递会处理每个投影载荷。
- 持久化回退投递会在一个可重放意图或批处理计划中记录每个投影载荷。
- OpenClaw 来源的 Gateway 网关失败输出对人类可见，但在声明支持来源契约的渠道上，
  标记的机器人创作房间回声会在机器人授权之前被丢弃。
- 文档会解释发送、接收、实时、状态、回执、关系、失败策略、迁移和测试覆盖。

## 相关

- [消息](/zh-CN/concepts/messages)
- [流式传输和分块](/zh-CN/concepts/streaming)
- [进度草稿](/zh-CN/concepts/progress-drafts)
- [重试策略](/zh-CN/concepts/retry)
- [频道轮次内核](/zh-CN/plugins/sdk-channel-turn)
