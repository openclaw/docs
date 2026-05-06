---
read_when:
    - 重构渠道发送或接收行为
    - 更改渠道轮次、回复分发、出站队列、预览流式传输或插件 SDK 消息 API
    - 设计一个需要持久化发送、回执、预览、编辑或重试的新渠道插件
summary: 统一持久化消息接收、发送、预览、编辑和流式传输生命周期的设计方案
title: 消息生命周期重构
x-i18n:
    generated_at: "2026-05-06T04:52:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此页面是目标设计，用于以一个持久的消息生命周期，替换分散的频道轮次、回复分发、预览流式传输和出站投递辅助逻辑。

简短版本：

- 核心原语应该是 **接收** 和 **发送**，而不是 **回复**。
- 回复只是出站消息上的一种关系。
- 轮次是入站处理的便利机制，不是投递的所有者。
- 发送必须基于上下文：`begin`、渲染、预览或流式传输、最终发送、
  提交、失败。
- 接收也必须基于上下文：规范化、去重、路由、记录、
  分发、平台确认、失败。
- 公共插件 SDK 应该收敛为一个小型的频道消息接口。

## 问题

当前频道栈来自几个合理的局部需求：

- 简单入站适配器使用 `runtime.channel.turn.run`。
- 富功能适配器使用 `runtime.channel.turn.runPrepared`。
- 旧版辅助逻辑使用 `dispatchInboundReplyWithBase`、
  `recordInboundSessionAndDispatchReply`、回复负载辅助逻辑、回复分块、
  回复引用和出站运行时辅助逻辑。
- 预览流式传输存在于特定频道的分发器中。
- 最终投递持久性正在围绕现有回复负载路径添加。

这种形态能修复局部错误，但它让 OpenClaw 拥有太多公共概念，
也让投递语义在太多位置可能发生偏移。

暴露此问题的可靠性场景是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目标不变式比 Telegram 更广：一旦核心决定应该存在一条可见的出站消息，
就必须先持久化该意图，再尝试平台发送；平台回执必须在成功后提交。
这让 OpenClaw 具备至少一次恢复能力。恰好一次行为只存在于那些能够证明
原生幂等性，或能在重放前将未知发送结果与平台状态进行对账的适配器中。

这是此次重构的最终状态，而不是对每条当前路径的描述。在迁移期间，
当尽力而为的队列写入失败时，现有出站辅助逻辑仍可回退到直接发送。
只有当持久化最终发送默认失败关闭，或通过文档化的非持久策略显式选择退出时，
这次重构才算完成。

## 目标

- 为所有频道消息接收和发送路径提供一个核心生命周期。
- 在适配器声明具备可安全重放的行为后，新消息生命周期默认使用持久化最终发送。
- 共享预览、编辑、流式传输、最终化、重试、恢复和回执语义。
- 提供一个小型插件 SDK 接口，便于第三方插件学习和维护。
- 在迁移期间兼容现有 `channel.turn` 调用方。
- 为新的频道能力提供清晰扩展点。
- 核心中不包含平台特定分支。
- 不发送 token 增量频道消息。频道流式传输仍然是消息预览、编辑、追加或已完成的块投递。
- 为操作性/系统输出提供结构化 OpenClaw 来源元数据，避免可见的 Gateway 网关故障在启用机器人的共享房间中作为新提示重新进入。

## 非目标

- 不在第一阶段移除 `runtime.channel.turn.*`。
- 不强制每个频道采用相同的原生传输行为。
- 不让核心理解 Telegram 话题、Slack 原生流、Matrix 撤回、
  Feishu 卡片、QQ 语音或 Teams 活动。
- 不将所有内部迁移辅助逻辑发布为稳定 SDK API。
- 不让重试重放已完成的非幂等平台操作。

## 参考模型

Vercel Chat 有一个很好的公共心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 适配器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、
  `stream`、`startTyping` 和历史记录获取
- 用于去重、锁、队列和持久化的状态适配器

OpenClaw 应该借用这套词汇，而不是复制其接口。

OpenClaw 在该模型之外还需要：

- 在直接调用传输之前持久化出站发送意图。
- 带有开始、提交和失败的显式发送上下文。
- 知道平台确认策略的接收上下文。
- 能在重启后保留，并可驱动编辑、删除、恢复和重复抑制的回执。
- 更小的公共 SDK。内置插件可以使用内部运行时辅助逻辑，但第三方插件应该只看到一个一致的消息 API。
- 智能体特定行为：会话、转录记录、分块流式传输、工具进度、批准、媒体指令、静默回复和群组提及历史。

`thread.post()` 风格的 promise 对 OpenClaw 来说并不够。它们隐藏了决定发送是否可恢复的事务边界。

## 核心模型

新领域应该位于内部核心命名空间下，例如
`src/channels/message/*`。

它有四个概念：

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` 负责入站生命周期。

`send` 负责出站生命周期。

`live` 负责预览、编辑、进度和流状态。

`state` 负责持久化意图存储、回执、幂等性、恢复、锁和去重。

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

目标描述消息所在的位置：

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

这让同一条发送路径可以处理普通回复、cron 通知、批准提示、任务完成、消息工具发送、CLI 或 Control UI 发送、子智能体结果和自动化发送。

### 来源

来源描述谁生成了消息，以及 OpenClaw 应该如何处理该消息的回声。
它独立于关系：一条消息可以是对用户的回复，同时仍然是由 OpenClaw 发起的操作性输出。

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

核心拥有 OpenClaw 来源输出的含义。频道拥有如何将该来源编码到其传输中的责任。

第一个必需用途是 Gateway 网关故障输出。人类仍应看到诸如 “Agent failed before reply” 或 “Missing API key” 这样的消息，但带有标签的 OpenClaw 操作性输出在 `allowBots` 启用时，不得在共享房间中被接受为机器人编写的输入。

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

回执是从持久化意图通往未来编辑、删除、预览最终化、重复抑制和恢复的桥梁。

一个回执可以描述一条平台消息或一次多部分投递。分块文本、媒体加文本、语音加文本和卡片回退必须保留所有平台 id，同时仍公开一个用于穿线和后续编辑的主 id。

## 接收上下文

接收不应该只是一次裸辅助调用。核心需要一个知道去重、路由、会话记录和平台确认策略的上下文。

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

确认并不是单一事物。接收契约必须将这些信号分开：

- **传输确认：** 告诉平台 webhook 或 socket，OpenClaw 已接受事件信封。一些平台要求在分发前完成此操作。
- **轮询偏移确认：** 推进游标，使同一事件不会再次被获取。这不得越过无法恢复的工作。
- **入站记录确认：** 确认 OpenClaw 已持久化足够的入站元数据，以便对重新投递进行去重和路由。
- **用户可见回执：** 可选的已读/状态/正在输入行为；绝不是持久性边界。

`ReceiveAckPolicy` 仅控制传输或轮询确认。不得将其复用于已读回执或状态反应。

在机器人授权之前，当频道能够解码消息来源元数据时，接收必须应用共享的 OpenClaw 回声策略：

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

此丢弃基于标签，而不是基于文本。一条机器人编写的房间消息，即使具有相同的可见 Gateway 网关故障文本，但没有 OpenClaw 来源元数据，仍会通过正常的 `allowBots` 授权。

确认策略是显式的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 轮询现在使用接收上下文确认策略来维护其持久化重启水位线。跟踪器仍会在 grammY 更新进入中间件链时观察它们，但 OpenClaw 只会在成功分发后持久化安全的已完成更新 id，让失败的或更低的待处理更新可在重启后重放。Telegram 的上游 `getUpdates` 获取偏移仍由轮询库控制，因此如果我们需要超出 OpenClaw 重启水位线的平台级重新投递，剩余的更深层改动是完全持久化的轮询源。Webhook 平台可能需要立即 HTTP 确认，但它们仍需要入站去重和持久化出站发送意图，因为 webhook 可能重新投递。

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

该 helper 会展开为：

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

intent 必须在传输 I/O 之前存在。在 begin 之后、commit 之前重启是可恢复的。

危险边界在平台成功之后、receipt commit 之前。如果进程在此处退出，除非 adapter 提供原生幂等性或 receipt 协调路径，否则 OpenClaw 无法知道平台消息是否存在。这些尝试必须在 `unknown_after_send` 中恢复，而不能盲目重放。没有协调能力的渠道只有在重复可见消息对该渠道和关系而言是可接受且已记录的权衡时，才可以选择至少一次重放。当前 SDK 协调桥要求 adapter 声明 `reconcileUnknownSend`，然后让 `durableFinal.reconcileUnknownSend` 将未知条目分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重放，未解决的条目保持终止状态，或只重试协调检查。

持久性策略必须是显式的：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示 core 在无法写入持久化 intent 时必须失败关闭。`best_effort` 可以在持久化不可用时继续执行。`disabled` 保持旧的直接发送行为。迁移期间，旧版 wrapper 和公共兼容性 helper 默认使用 `disabled`；它们不得因为某个渠道拥有通用出站 adapter 就推断为 `required`。

发送上下文还拥有渠道本地的发送后效果。如果持久化投递绕过了之前附加到渠道直接发送路径上的本地行为，迁移就是不安全的。示例包括自回声抑制缓存、线程参与标记、原生编辑锚点、模型签名渲染，以及平台特定的重复防护。这些效果必须移动到发送 adapter、渲染 adapter，或具名发送上下文钩子中，然后该渠道才能启用持久化通用最终投递。

发送 helper 必须一路向调用方返回 receipt。持久化 wrapper 不能吞掉 message id，也不能用 `undefined` 替换渠道投递结果；缓冲 dispatcher 会使用这些 id 来处理线程锚点、后续编辑、预览最终化和重复抑制。

回退发送操作的是批次，而不是单个 payload。静默回复重写、媒体回退、卡片回退和 chunk 投影都可能产生多个可投递消息，因此发送上下文必须投递整个投影批次，或者明确记录为什么只有一个 payload 有效。

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

当这种回退是持久化的，整个投影批次必须由一个持久化发送 intent 或另一种原子批次计划表示。逐个记录每个 payload 是不够的：payload 之间的崩溃可能留下部分可见回退，却没有剩余 payload 的持久化记录。恢复必须知道哪些 unit 已经有 receipt，并且要么只重放缺失的 unit，要么将该批次标记为 `unknown_after_send`，直到 adapter 对其完成协调。

## 实时上下文

预览、编辑、进度和流式传输行为应当是一个可选择启用的生命周期。

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

实时状态需要具备足够持久性，以便恢复或抑制重复：

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

这应当覆盖当前行为：

- Telegram 发送并编辑预览，预览年龄过旧后发送新的最终消息。
- Discord 发送并编辑预览，在媒体、错误或显式回复时取消。
- Slack 根据线程形态使用原生 stream 或草稿预览。
- Mattermost 草稿帖子最终化。
- Matrix 草稿事件最终化，或在不匹配时撤回。
- Teams 原生进度 stream。
- QQ Bot stream 或累积式回退。

## Adapter 表面

公共 SDK 目标应当是一个子路径：

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

发送 adapter：

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

接收 adapter：

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

在 preflight 授权之前，只要 `origin.decode` 返回 OpenClaw 来源元数据，core 就必须运行共享的 OpenClaw 回声判定。接收 adapter 提供平台事实，例如 bot 作者和房间形态；core 拥有丢弃决策和排序，因此渠道无需重新实现文本过滤器。

来源 adapter：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core 设置 `MessageOrigin`。渠道只负责在它和原生传输元数据之间进行转换。Slack 将其映射到 `chat.postMessage({ metadata })` 和入站 `message.metadata`；Matrix 可以将其映射到额外事件内容；没有原生元数据的渠道可以在这是最佳可用近似方案时使用 receipt/outbound registry。

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

## 公共 SDK 收敛

新的公共表面应当吸收或弃用这些概念区域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` 的大多数公共用法
- 临时草稿 stream 生命周期 helper

兼容性子路径可以继续作为 wrapper 保留，但新的第三方插件不应需要它们。

内置插件在迁移期间可以继续通过保留的运行时子路径使用内部 helper 导入。公共文档应在 `plugin-sdk/channel-message` 存在后引导插件作者使用它。

## 与渠道轮次的关系

`runtime.channel.turn.*` 应在迁移期间保留。

它应成为一个兼容性 adapter：

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

所有内置插件和已知第三方兼容路径都接入桥接之后，可以弃用 `channel.turn`。在发布 SDK 迁移路径，并且有合约测试证明旧插件仍可工作或会以清晰版本错误失败之前，不应移除它。

## 兼容性护栏

迁移期间，对于任何现有投递回调具有“发送此 payload”之外副作用的渠道，通用持久化投递都是选择启用的。

旧版入口点默认非持久化：

- `channel.turn.run` 和 `dispatchAssembledChannelTurn` 使用渠道的投递回调，除非该渠道显式提供经过审计的持久化 policy/options 对象。
- `channel.turn.runPrepared` 保持由渠道拥有，直到 prepared dispatcher 显式调用发送上下文。
- `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接私信 helper 等公共兼容性 helper，绝不会在调用方提供的 `deliver` 或 `reply` 回调之前注入通用持久化投递。

对于迁移桥接类型，`durable: undefined` 表示“非持久化”。只有显式的 policy/options 值才会启用持久化路径。`durable: false` 可以作为兼容性写法保留，但实现不应要求每个未迁移的渠道都添加它。

当前桥接代码必须保持持久性决策显式：

- 持久化最终交付会返回一个可判别的状态。`handled_visible` 和
  `handled_no_send` 是终态；`unsupported` 和 `not_applicable` 可以回退到
  渠道自有交付；`failed` 会传播发送失败。
- 通用持久化最终交付受适配器能力控制，例如静默交付、回复目标保留、
  原生引用保留，以及消息发送钩子。缺少对等能力时应选择渠道自有交付，
  而不是会改变用户可见行为的通用发送。
- 队列支持的持久化发送会暴露一个交付意图引用。现有的
  `pendingFinalDelivery*` 会话字段可以在过渡期间携带意图 id；最终状态是
  一个 `MessageSendIntent` 存储，而不是冻结的回复文本加上临时上下文字段。

在满足以下所有条件之前，不要为某个渠道启用通用持久化路径：

- 通用发送适配器执行与旧直接路径相同的渲染和传输行为。
- 本地发送后副作用通过发送上下文保留下来。
- 适配器返回包含所有平台消息 id 的回执或交付结果。
- 已准备好的分发器路径要么调用新的发送上下文，要么继续记录为不在持久化保证范围内。
- 回退交付处理每个投影后的载荷，而不只是第一个。
- 持久化回退交付将整个投影后的载荷数组记录为一个可重放意图或批处理计划。

需要保留的具体迁移风险：

- iMessage 监视器交付会在成功发送后将已发送消息记录到回声缓存。持久化最终发送仍必须填充该缓存，否则 OpenClaw 可能会将自己的最终回复重新摄取为入站用户消息。
- Tlon 会追加可选的模型签名，并在群组回复后记录参与过的线程。通用持久化交付不得绕过这些效果；要么将它们移入 Tlon 渲染/发送/最终化适配器，要么让 Tlon 继续使用渠道自有路径。
- Discord 和其他已准备好的分发器已经拥有直接交付和预览行为。除非它们的已准备好分发器明确通过发送上下文路由最终消息，否则它们不受组装轮次持久化保证覆盖。
- Telegram 静默回退交付必须交付完整的投影载荷数组。单载荷快捷路径可能会在投影后丢弃额外的回退载荷。
- LINE、BlueBubbles、Zalo、Nostr 以及其他现有组装/辅助路径可能有回复令牌处理、媒体代理、已发送消息缓存、加载/Status 清理，或仅回调目标。在这些语义由发送适配器表示并通过测试验证之前，它们继续使用渠道自有交付。
- 直接私信辅助函数可能有一个回复回调，而该回调是唯一正确的传输目标。通用出站不得从 `OriginatingTo` 或 `To` 猜测并跳过该回调。
- OpenClaw Gateway 网关故障输出必须继续对人类可见，但带标签的机器人撰写房间回声必须在 `allowBots` 授权前丢弃。除短期紧急止血外，渠道不得用可见文本前缀过滤器实现这一点；持久化契约是结构化来源元数据。

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

队列应保留足够的身份信息，以便在重启后通过同一个账号、线程、目标、格式化策略和媒体规则重放。

## 故障类别

渠道适配器将传输故障归类为封闭类别：

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
- 对于 `not_found`，当渠道声明安全时，允许实时最终化从编辑回退到全新发送。
- 对于 `conflict`，使用回执/idempotency 规则判断消息是否已经存在。
- 如果适配器可能已经完成平台 I/O，但在回执提交前发生任何错误，则状态变为 `unknown_after_send`，除非适配器可以证明平台操作没有发生。

## 渠道映射

| 渠道                  | 目标迁移                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | 接收确认策略以及持久化的最终发送。实时适配器负责发送和编辑预览、过期预览的最终发送、话题、引用回复预览跳过、媒体回退以及 retry-after 处理。                                                                                                                                                                   |
| Discord                  | 发送适配器封装现有的持久化载荷投递。实时适配器负责草稿编辑、进度草稿、媒体/错误预览取消、回复目标保留以及消息 ID 回执。审计共享房间中由机器人发出的 Gateway 网关故障回显；如果 Discord 无法在普通消息中携带来源元数据，请使用出站注册表或其他原生等价方案。 |
| Slack                    | 发送适配器处理普通聊天发布。实时适配器在线程形态支持时选择原生流式传输，否则使用草稿预览。回执保留线程时间戳。来源适配器将 OpenClaw Gateway 网关故障映射到 Slack `chat.postMessage.metadata`，并在 `allowBots` 授权前丢弃已标记的机器人房间回显。                                  |
| WhatsApp                 | 发送适配器负责带持久化最终意图的文本/媒体发送。接收适配器处理群组提及和发送者身份。实时适配器可以暂时缺席，直到 WhatsApp 拥有可编辑的传输方式。                                                                                                                                                                        |
| Matrix                   | 实时适配器负责草稿事件编辑、最终确定、撤回、加密媒体约束以及回复目标不匹配回退。接收适配器负责加密事件补全和去重。来源适配器应将 OpenClaw Gateway 网关故障来源编码到 Matrix 事件内容中，并在 `allowBots` 处理前丢弃已配置机器人的房间回显。              |
| Mattermost               | 实时适配器负责一条草稿帖子、进度/工具折叠、原位最终确定以及全新发送回退。                                                                                                                                                                                                                                                       |
| Microsoft Teams          | 实时适配器负责原生进度和分块流式传输行为。发送适配器负责活动以及附件/卡片回执。                                                                                                                                                                                                                                        |
| Feishu                   | 渲染适配器负责文本/卡片/原始渲染。实时适配器负责流式卡片和重复最终消息抑制。发送适配器负责评论、话题会话、媒体以及语音抑制。                                                                                                                                                                      |
| QQ Bot                   | 实时适配器负责 C2C 流式传输、累加器超时以及回退最终发送。渲染适配器负责媒体标签和文本转语音。                                                                                                                                                                                                                               |
| Signal                   | 简单接收加发送适配器。除非 signal-cli 增加可靠的编辑支持，否则不使用实时适配器。                                                                                                                                                                                                                                                                |
| iMessage 和 BlueBubbles | 简单接收加发送适配器。在持久化最终消息可以绕过监视器投递前，iMessage 发送必须保留监视器回显缓存填充。BlueBubbles 特有的输入状态、回应和附件仍作为适配器能力保留。                                                                                                                            |
| Google Chat              | 简单接收加发送适配器，将线程关系映射到空间和线程 ID。审计 `allowBots=true` 房间中已标记的 OpenClaw Gateway 网关故障回显行为。                                                                                                                                                                                        |
| LINE                     | 简单接收加发送适配器，将回复令牌约束建模为目标/关系能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | SDK 接收桥接加发送适配器。                                                                                                                                                                                                                                                                                                                          |
| IRC                      | 简单接收加发送适配器，无持久化编辑回执。                                                                                                                                                                                                                                                                                                    |
| Nostr                    | 面向加密私信的接收加发送适配器；回执是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel               | 用于接收、发送、实时、重试和恢复行为的契约测试适配器。                                                                                                                                                                                                                                                                                   |
| Synology Chat            | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | 在启用通用持久化最终投递前，发送适配器必须保留模型签名渲染和已参与线程跟踪。                                                                                                                                                                                                                        |
| Twitch                   | 带速率限制分类的简单接收加发送适配器。                                                                                                                                                                                                                                                                                               |
| Zalo                     | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |

## 迁移计划

### 阶段 1：内部消息域

- 添加 `src/channels/message/*` 类型，用于消息、目标、关系、
  来源、回执、能力、持久化意图、接收上下文、发送
  上下文、实时上下文以及失败类别。
- 将 `origin?: MessageOrigin` 添加到当前回复投递使用的迁移桥接载荷类型中，
  然后随着重构替换回复载荷，将该字段移动到 `ChannelMessage` 和已渲染的
  消息类型中。
- 在适配器和测试证明其形态前，保持其为内部机制。
- 为状态转换和序列化添加纯单元测试。

### 阶段 2：持久化发送核心

- 将现有出站队列从回复载荷持久化迁移到持久化
  消息发送意图。
- 允许持久化发送意图携带投影后的载荷数组或批处理计划，而不
  只是一个回复载荷。
- 通过兼容转换保留当前队列恢复行为。
- 让 `deliverOutboundPayloads` 调用 `messages.send`。
- 在适配器声明重放安全后，在新的消息生命周期中，将最终发送持久化设为默认值，并在无法写入持久化意图时关闭失败。
  现有频道轮次和 SDK 兼容路径在此阶段默认仍为直接发送。
- 一致记录回执。
- 将回执和投递结果返回给原始分发器调用方，而不是把持久化发送视为终止性的副作用。
- 通过持久化发送意图持久化消息来源，使恢复、重放和
  分块发送保留 OpenClaw 运维来源信息。

### 阶段 3：频道轮次桥接

- 基于 `messages.receive` 和 `messages.send` 重新实现 `channel.turn.run` 和 `dispatchAssembledChannelTurn`。
- 保持当前事实类型稳定。
- 默认保留旧行为。只有当适配器使用重放安全的持久化策略显式选择加入时，组装轮次渠道才会变为持久化。
- 对于那些会最终确定原生编辑且尚无法安全重放的路径，保留 `durable: false` 作为兼容性逃生口，
  但不要依赖 `false` 标记来保护未迁移的渠道。
- 只有在新的消息生命周期中，并且渠道映射证明通用发送路径保留了旧渠道
  投递语义后，才默认启用组装轮次持久化。

### 阶段 4：预备分发器桥接

- 将 `deliverDurableInboundReplyPayload` 替换为发送上下文桥接。
- 保留旧 helper 作为 wrapper。
- 先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因为
  它们已经有 durable-final 工作或更简单的发送路径。
- 将每个已准备好的 dispatcher 视为未覆盖，直到它显式选择加入
  发送上下文。文档和 changelog 条目必须写作 “assembled
  channel turns” 或点名已迁移的渠道路径，而不是声称所有
  自动最终回复。
- 保持 `recordInboundSessionAndDispatchReply`、直接私信 helper 以及类似
  公共兼容性 helper 的行为不变。它们之后可以暴露显式的
  发送上下文选择加入，但不得在调用方拥有的投递 callback 之前
  自动尝试通用持久化投递。

### 阶段 5：统一的实时生命周期

- 构建 `messages.live`，并带两个证明 adapter：
  - Telegram，用于发送、编辑以及过期最终发送。
  - Matrix，用于草稿终结以及 redaction fallback。
- 然后迁移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每个渠道都有 parity 测试之后，才删除重复的 preview 终结代码。

### 阶段 6：公共 SDK

- 添加 `openclaw/plugin-sdk/channel-message`。
- 将它记录为首选渠道插件 API。
- 更新 package exports、entrypoint inventory、生成的 API baseline 以及
  插件 SDK 文档。
- 在 channel-message SDK surface 中包含 `MessageOrigin`、origin encode/decode 钩子以及共享的
  `shouldDropOpenClawEcho` predicate。
- 保留旧 subpath 的兼容性 wrapper。
- 在内置插件迁移完成后，在文档中将以 reply 命名的 SDK helper 标记为 deprecated。

### 阶段 7：所有发送方

将所有非回复 outbound producer 移到 `messages.send`：

- cron 和 Heartbeat 通知
- 任务完成通知
- hook 结果
- approval prompt 和 approval result
- 消息工具发送
- subagent 完成公告
- 显式 CLI 或 Control UI 发送
- automation/broadcast 路径

这是模型从“智能体回复”变为“OpenClaw 发送消息”的位置。

### 阶段 8：弃用 Turn

- 将 `channel.turn` 作为 wrapper 保留至少一个兼容窗口。
- 发布迁移说明。
- 针对旧 import 运行插件 SDK 兼容性测试。
- 只有在没有内置插件需要旧内部 helper，且第三方契约已有稳定替代方案之后，
  才移除或隐藏旧内部 helper。

## 测试计划

单元测试：

- 持久化发送意图序列化和恢复。
- 幂等键复用和重复抑制。
- receipt commit 和 replay skip。
- 当 adapter 支持 reconciliation 时，`unknown_after_send` 恢复会在 replay 前 reconcile。
- 故障分类策略。
- receive ack 策略排序。
- reply、followup、system 和 broadcast 发送的关系映射。
- Gateway 网关故障 origin factory 和 `shouldDropOpenClawEcho` predicate。
- origin 在 payload 规范化、chunking、持久化队列序列化和恢复中的保留。

集成测试：

- `channel.turn.run` 简单 adapter 仍会记录并发送。
- 旧 assembled-turn delivery 不会变成持久化，除非渠道显式选择加入。
- `channel.turn.runPrepared` bridge 仍会记录并终结。
- 公共兼容性 helper 默认调用调用方拥有的投递 callback，并且不会在这些 callback 前执行 generic-send。
- 持久化 fallback delivery 会在重启后 replay 整个投影 payload 数组，并且不会在早期崩溃后让后续 payload 未记录。
- 持久化 assembled-turn delivery 会将平台 message id 返回给 buffered dispatcher。
- 当持久化投递被禁用或不可用时，自定义 delivery hook 仍会返回平台 message id。
- 最终回复能在 assistant 完成和平台发送之间重启后保留下来。
- 允许时，preview draft 会原地终结。
- 当媒体、错误或回复目标不匹配需要正常投递时，preview draft 会被取消或 redacted。
- 分块流式传输和 preview streaming 不会同时投递相同文本。
- 早期流式传输的媒体不会在最终投递中重复。

渠道测试：

- Telegram topic reply，在 receive context 的安全 completed watermark 之前延迟 polling ack。
- Telegram polling recovery，覆盖由持久化 safe-completed offset 模型处理的 accepted-but-not-delivered update。
- Telegram 过期 preview 会发送新的最终消息并清理 preview。
- Telegram silent fallback 会发送每个投影 fallback payload。
- Telegram silent fallback durability 会以原子方式记录完整投影 fallback 数组，而不是在每次循环迭代中记录一个 single-payload durable intent。
- Discord 在媒体、错误或显式回复时取消 preview。
- Discord prepared dispatcher 的 final 在文档或 changelog 声称 Discord final-reply durability 之前，会通过发送上下文路由。
- iMessage 持久化 final send 会填充 monitor sent-message echo cache。
- LINE、BlueBubbles、Zalo 和 Nostr 的旧投递路径在其 adapter parity 测试存在之前，不会被 generic durable send 绕过。
- Direct-DM/Nostr callback delivery 保持权威，除非显式迁移到完整的 message target 和 replay-safe send adapter。
- Slack 标记的 OpenClaw Gateway 网关故障消息会保持 outbound 可见，标记的 bot-room echo 会在 `allowBots` 前丢弃，而具有相同可见文本的未标记 bot 消息仍遵循正常 bot authorization。
- Slack native stream fallback 到顶层私信中的 draft preview。
- Matrix preview finalization 和 redaction fallback。
- Matrix 中来自已配置 bot account 的标记 OpenClaw Gateway 网关故障 room echo 会在 `allowBots` 处理前丢弃。
- Discord 和 Google Chat shared-room Gateway 网关故障 cascade audit 会在声称具备通用保护之前覆盖
  `allowBots` 模式。
- Mattermost draft finalization 和 fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final send 会保留 model-signature 渲染和 participated
  thread tracking。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal 的简单持久化 final
  send。

验证：

- 开发期间运行目标 Vitest 文件。
- 在 Testbox 中针对完整变更面运行 `pnpm check:changed`。
- 在落地完整重构之前，或在 public SDK/export 变更之后，在 Testbox 中运行更广泛的 `pnpm check`。
- 在移除兼容性 wrapper 之前，至少对一个支持编辑的渠道和一个
  简单 send-only 渠道运行 live 或 qa-channel smoke。

## 待解决问题

- Telegram 是否最终应将 grammY runner source 替换为完全持久化的 polling source，
  使其能够控制平台级 redelivery，而不仅是 OpenClaw 的持久化 restart watermark。
- durable live preview state 应存储在与 final send intent 相同的 queue record 中，
  还是存储在 sibling live-state store 中。
- `plugin-sdk/channel-message` 发布后，兼容性 wrapper 应在文档中保留多久。
- 第三方插件应直接实现 receive adapter，还是只通过 `defineChannelMessageAdapter`
  提供 normalize/send/live hook。
- 哪些 receipt 字段可以安全暴露在公共 SDK 中，而不是作为内部运行时状态。
- self-echo cache 和 participated-thread marker 等副作用应建模为 send-context hook、
  adapter-owned finalize step，还是 receipt subscriber。
- 哪些渠道具有 native origin metadata，哪些需要持久化 outbound registry，
  以及哪些无法提供可靠的 cross-bot echo suppression。

## 验收标准

- 每个内置消息渠道都通过 `messages.send` 发送最终可见输出。
- 每个 inbound message 渠道都通过 `messages.receive` 或记录在文档中的兼容性 wrapper 进入。
- 每个 preview/edit/stream 渠道都使用 `messages.live` 管理草稿状态和终结。
- `channel.turn` 只是一个 wrapper。
- 以 reply 命名的 SDK helper 是兼容性 export，而不是推荐路径。
- 持久化恢复可以在重启后 replay 待处理的最终发送，不会丢失最终响应或重复已经 committed 的发送；平台结果未知的发送会在 replay 前 reconcile，或在该 adapter 文档中声明为 at-least-once。
- 当 durable intent 无法写入时，持久化 final send 会 fail closed，除非调用方显式选择了记录在文档中的 non-durable mode。
- 旧 channel-turn 和 SDK 兼容性 helper 默认使用直接的渠道自有投递；generic durable send 只能显式选择加入。
- receipt 会为 multipart delivery 保留所有平台 message id，并为 threading/edit 便利保留 primary id。
- durable wrapper 在替换 direct delivery callback 之前会保留 channel-local 副作用。
- prepared dispatcher 在其最终投递路径显式使用发送上下文之前，不会被计为 durable。
- fallback delivery 会处理每个投影 payload。
- 持久化 fallback delivery 会将每个投影 payload 记录在一个可 replay 的 intent 或 batch plan 中。
- OpenClaw 发起的 Gateway 网关故障输出对人类可见，但标记的 bot-authored room echo 会在声明支持 origin contract 的渠道上，在 bot authorization 前被丢弃。
- 文档解释 send、receive、live、state、receipt、relation、failure
  policy、migration 和 test coverage。

## 相关

- [消息](/zh-CN/concepts/messages)
- [流式传输和分块](/zh-CN/concepts/streaming)
- [进度草稿](/zh-CN/concepts/progress-drafts)
- [重试策略](/zh-CN/concepts/retry)
- [频道轮次内核](/zh-CN/plugins/sdk-channel-turn)
