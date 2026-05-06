---
read_when:
    - 重构渠道发送或接收行为
    - 更改频道轮次、回复分发、出站队列、预览流式传输或插件 SDK 消息 API
    - 设计一个需要持久化发送、回执、预览、编辑或重试的新渠道插件
summary: 统一的持久化消息接收、发送、预览、编辑和流式传输生命周期设计方案
title: 消息生命周期重构
x-i18n:
    generated_at: "2026-05-06T01:07:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2253d5b197bf6df15486d21492fab608b89a5f88bf213a03215d9f6638462017
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此页面是目标设计，用于以一个持久的消息生命周期取代分散的渠道轮次、回复分发、预览流式传输和出站投递辅助函数。

简短版本：

- 核心原语应该是 **接收** 和 **发送**，而不是 **回复**。
- 回复只是出站消息上的一种关系。
- 轮次是入站处理的便利机制，而不是投递的所有者。
- 发送必须基于上下文：`begin`、渲染、预览或流式传输、最终发送、提交、失败。
- 接收也必须基于上下文：规范化、去重、路由、记录、分发、平台确认、失败。
- 公共插件 SDK 应收敛为一个小型的渠道消息表面。

## 问题

当前渠道栈源自几个合理的局部需求：

- 简单的入站适配器使用 `runtime.channel.turn.run`。
- 富入站适配器使用 `runtime.channel.turn.runPrepared`。
- 旧版辅助函数使用 `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、回复载荷辅助函数、回复分块、回复引用和出站运行时辅助函数。
- 预览流式传输存在于渠道专用分发器中。
- 最终投递的持久性正在围绕现有回复载荷路径添加。

这种形态能修复局部问题，但也让 OpenClaw 拥有过多公共概念，并且有太多位置可能导致投递语义漂移。

暴露此问题的可靠性场景是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目标不变量比 Telegram 更广：一旦核心判定应该存在一条可见出站消息，在尝试平台发送之前，意图必须已经持久化；发送成功之后，平台回执必须提交。这样 OpenClaw 就能获得至少一次恢复能力。精确一次行为只存在于那些能够证明原生幂等性，或能在重放前根据平台状态核对发送后未知状态尝试的适配器中。

这是此重构的最终状态，而不是对每条当前路径的描述。在迁移期间，当尽力而为的队列写入失败时，现有出站辅助函数仍可退回到直接发送。只有当持久最终发送以关闭方式失败，或通过有文档说明的非持久策略显式选择退出时，重构才算完成。

## 目标

- 为所有渠道消息接收和发送路径提供一个核心生命周期。
- 在适配器声明重放安全行为之后，新消息生命周期中的最终发送默认持久化。
- 共享预览、编辑、流式传输、最终化、重试、恢复和回执语义。
- 提供一个小型插件 SDK 表面，便于第三方插件学习和维护。
- 在迁移期间兼容现有 `channel.turn` 调用方。
- 为新的渠道能力提供清晰扩展点。
- 核心中没有平台专用分支。
- 不发送 token-delta 渠道消息。渠道流式传输仍然是消息预览、编辑、追加或已完成的块投递。
- 为操作性/系统输出提供结构化的 OpenClaw 来源元数据，避免可见的 Gateway 网关故障在启用共享机器人的房间中作为新提示重新进入。

## 非目标

- 第一阶段不移除 `runtime.channel.turn.*`。
- 不强制每个渠道采用相同的原生传输行为。
- 不让核心理解 Telegram 主题、Slack 原生流、Matrix 撤回、Feishu 卡片、QQ 语音或 Teams 活动。
- 不将所有内部迁移辅助函数发布为稳定 SDK API。
- 不让重试重放已完成的非幂等平台操作。

## 参考模型

Vercel Chat 有一个良好的公共心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 适配器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping` 和历史获取
- 用于去重、锁、队列和持久化的状态适配器

OpenClaw 应借用其词汇，而不是复制其表面。

OpenClaw 在该模型之外还需要：

- 在直接传输调用之前持久化出站发送意图。
- 带有开始、提交和失败的显式发送上下文。
- 知晓平台确认策略的接收上下文。
- 能在重启后保留，并可驱动编辑、删除、恢复和重复抑制的回执。
- 更小的公共 SDK。内置插件可以使用内部运行时辅助函数，但第三方插件应该看到一个一致的消息 API。
- 智能体专用行为：会话、转录、分块流式传输、工具进度、批准、媒体指令、静默回复和群组提及历史。

`thread.post()` 风格的承诺对 OpenClaw 来说并不够。它们隐藏了决定发送是否可恢复的事务边界。

## 核心模型

新领域应位于内部核心命名空间下，例如 `src/channels/message/*`。

它包含四个概念：

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

规范化消息与平台无关：

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

这让同一发送路径可以处理普通回复、cron 通知、批准提示、任务完成、消息工具发送、CLI 或 Control UI 发送、子智能体结果和自动化发送。

### 来源

来源描述谁产生了消息，以及 OpenClaw 应如何处理该消息的回声。它与关系分离：一条消息可以是对用户的回复，同时仍然是 OpenClaw 来源的操作性输出。

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

核心拥有 OpenClaw 来源输出的含义。渠道拥有将该来源编码到自身传输中的方式。

第一个必需用途是 Gateway 网关故障输出。人类仍应看到诸如 “Agent failed before reply” 或 “Missing API key” 之类的消息，但带有标签的 OpenClaw 操作性输出，在启用 `allowBots` 时不得被共享房间接受为机器人撰写的输入。

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

回执是从持久意图通往未来编辑、删除、预览最终化、重复抑制和恢复的桥梁。

一个回执可以描述一条平台消息或一次多部分投递。分块文本、媒体加文本、语音加文本和卡片回退必须保留所有平台 ID，同时仍暴露用于串联和后续编辑的主 ID。

## 接收上下文

接收不应是一个裸辅助调用。核心需要一个知晓去重、路由、会话记录和平台确认策略的上下文。

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

确认不是一件事。接收契约必须将这些信号分开：

- **传输确认：** 告诉平台 webhook 或 socket，OpenClaw 已接受事件信封。有些平台要求在分发之前完成这一点。
- **轮询偏移确认：** 推进游标，使同一事件不会再次被获取。这不得推进到无法恢复的工作之后。
- **入站记录确认：** 确认 OpenClaw 已持久化足够的入站元数据，以便对重新投递进行去重和路由。
- **用户可见回执：** 可选的已读/状态/输入中行为；绝不是持久性边界。

`ReceiveAckPolicy` 只控制传输或轮询确认。它不得复用于已读回执或状态反应。

在机器人授权之前，当渠道可以解码消息来源元数据时，接收必须应用共享的 OpenClaw 回声策略：

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

此丢弃基于标签，而非基于文本。带有相同可见 Gateway 网关故障文本、但没有 OpenClaw 来源元数据的机器人撰写房间消息，仍会走正常的 `allowBots` 授权。

确认策略是显式的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 轮询现在使用接收上下文确认策略来维护其持久化的重启水位线。追踪器仍会在 grammY 更新进入中间件链时观察它们，但 OpenClaw 只会在成功分发之后持久化安全的已完成更新 ID，让失败或更低的待处理更新可以在重启后重放。Telegram 上游 `getUpdates` 获取偏移仍由轮询库控制，因此如果我们需要超出 OpenClaw 重启水位线的平台级重新投递，剩下的更深层改造是一个完全持久的轮询源。Webhook 平台可能需要即时 HTTP 确认，但它们仍需要入站去重和持久的出站发送意图，因为 webhook 可能重新投递。

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

推荐的编排方式：

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

意图必须在传输 I/O 之前存在。在开始之后、提交之前重启是可恢复的。

危险边界位于平台成功之后、回执提交之前。如果进程在此处终止，除非适配器提供原生幂等性或回执对账路径，否则 OpenClaw 无法知道平台消息是否存在。这些尝试必须以 `unknown_after_send` 恢复，而不是盲目重放。没有对账能力的渠道只有在重复可见消息对该渠道和关系是可接受且已记录的权衡时，才可以选择至少一次重放。当前 SDK 对账桥要求适配器声明 `reconcileUnknownSend`，然后要求 `durableFinal.reconcileUnknownSend` 将未知条目分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重放，未解决条目会保持终态，或只重试对账检查。

持久性策略必须显式：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示核心在无法写入持久意图时必须关闭失败。`best_effort` 可以在持久化不可用时继续执行。`disabled` 保留旧的直接发送行为。迁移期间，旧版包装器和公共兼容性辅助函数默认使用 `disabled`；它们不得因为某个渠道拥有通用出站适配器就推断为 `required`。

发送上下文也拥有渠道本地的发送后效果。如果持久递送绕过了之前附加到该渠道直接发送路径的本地行为，那么迁移并不安全。示例包括自身回声抑制缓存、线程参与标记、原生编辑锚点、模型签名渲染，以及平台特定的重复防护。这些效果必须移动到发送适配器、渲染适配器，或具名的发送上下文钩子中，然后该渠道才能启用持久通用最终递送。

发送辅助函数必须将回执一路返回给调用方。持久包装器不能吞掉消息 ID，也不能用 `undefined` 替换渠道递送结果；缓冲调度器会使用这些 ID 来处理线程锚点、后续编辑、预览最终化和重复抑制。

回退发送作用于批次，而不是单个载荷。静默回复重写、媒体回退、卡片回退和分块投影都可能产生多个可递送消息，因此发送上下文必须递送整个投影批次，或明确记录为什么只有一个载荷有效。

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

当这样的回退是持久的，整个投影批次必须由一个持久发送意图或另一种原子批次计划表示。逐个记录每个载荷并不够：载荷之间发生崩溃可能留下部分可见的回退，而剩余载荷没有持久记录。恢复必须知道哪些单元已经有回执，并且只重放缺失单元，或将批次标记为 `unknown_after_send`，直到适配器完成对账。

## 实时上下文

预览、编辑、进度和流式行为应该是一个选择启用的生命周期。

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

实时状态具备足够持久性，可以恢复或抑制重复：

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

- Telegram 发送并编辑预览，预览变旧后发送新的最终消息。
- Discord 发送并编辑预览，在媒体、错误或显式回复时取消。
- Slack 根据线程形态使用原生流或草稿预览。
- Mattermost 草稿帖子最终化。
- Matrix 草稿事件最终化，或在不匹配时撤回。
- Microsoft Teams 原生进度流。
- QQ Bot 流或累积式回退。

## 适配器接口

公共 SDK 目标应该是一个子路径：

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

在预检授权之前，只要 `origin.decode` 返回 OpenClaw 来源元数据，核心就必须运行共享的 OpenClaw 回声谓词。接收适配器提供平台事实，例如机器人作者和房间形态；核心拥有丢弃决策和排序，因此渠道无需重新实现文本过滤器。

来源适配器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

核心设置 `MessageOrigin`。渠道只负责将它与原生传输元数据互相转换。Slack 将其映射到 `chat.postMessage({ metadata })` 和入站 `message.metadata`；Matrix 可以将其映射到额外事件内容；没有原生元数据的渠道可以在这是最佳可用近似方案时使用回执/出站注册表。

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
- 大多数对 `outbound-runtime` 的公共使用
- 临时草稿流生命周期辅助函数

兼容性子路径可以继续作为包装器保留，但新的第三方插件不应需要它们。

内置插件在迁移期间可以继续通过保留的运行时子路径使用内部辅助函数导入。公共文档应在 `plugin-sdk/channel-message` 存在后引导插件作者使用它。

## 与渠道轮次的关系

`runtime.channel.turn.*` 应在迁移期间保留。

它应变成兼容性适配器：

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` 初期也应保留：

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

在所有内置插件和已知第三方兼容性路径都桥接后，可以弃用 `channel.turn`。在发布 SDK 迁移路径并通过合约测试证明旧插件仍可工作或会以明确版本错误失败之前，不应移除它。

## 兼容性护栏

迁移期间，对于任何现有递送回调具有“发送此载荷”以外副作用的渠道，通用持久递送都是选择启用的。

旧版入口点默认不持久：

- `channel.turn.run` 和 `dispatchAssembledChannelTurn` 使用渠道的递送回调，除非该渠道显式提供经过审计的持久策略/选项对象。
- `channel.turn.runPrepared` 保持由渠道拥有，直到准备好的调度器显式调用发送上下文。
- 公共兼容性辅助函数，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接私信辅助函数，在调用方提供的 `deliver` 或 `reply` 回调之前，绝不注入通用持久递送。

对于迁移桥类型，`durable: undefined` 表示“不持久”。只有显式的策略/选项值才会启用持久路径。`durable: false` 可以继续作为兼容写法保留，但实现不应要求每个未迁移渠道都添加它。

当前桥接代码必须保持持久性决策显式：

- 持久化最终交付会返回一个可判别的状态。`handled_visible` 和
  `handled_no_send` 是终止状态；`unsupported` 和 `not_applicable` 可以回退到
  渠道自有交付；`failed` 会传播发送失败。
- 通用持久化最终交付受适配器能力门控，例如静默交付、回复目标保留、原生引用保留，以及
  消息发送钩子。缺少对等能力时，应选择渠道自有交付，
  而不是会改变用户可见行为的通用发送。
- 队列支持的持久化发送会暴露一个交付意图引用。现有的
  `pendingFinalDelivery*` 会话字段可以在过渡期间携带该意图 ID；
  最终状态是一个 `MessageSendIntent` 存储，而不是冻结的
  回复文本加上临时上下文字段。

在以下全部成立之前，不要为某个渠道启用通用持久化路径：

- 通用发送适配器执行与旧直接路径相同的渲染和传输行为。
- 本地发送后副作用会通过发送上下文保留。
- 适配器返回包含所有平台消息 ID 的回执或交付结果。
- 已准备好的调度器路径要么调用新的发送上下文，要么继续被文档标注为不在持久化保证范围内。
- 回退交付会处理每一个投影后的载荷，而不仅是第一个。
- 持久化回退交付会将整个投影后载荷数组记录为一个可重放的意图或批处理计划。

需要保留的具体迁移风险：

- iMessage 监控器交付会在成功发送后把已发送消息记录到回显缓存。持久化最终发送仍必须填充该缓存，否则 OpenClaw 可能会把自己的最终回复重新摄入为入站用户消息。
- Tlon 会追加可选的模型签名，并在群组回复后记录已参与的线程。通用持久化交付不得绕过这些效果；要么把它们移入 Tlon 的渲染/发送/最终化适配器，要么让 Tlon 保持在渠道自有路径上。
- Discord 和其他已准备好的调度器已经拥有直接交付和预览行为。在它们的已准备调度器明确通过发送上下文路由最终消息之前，它们不受 assembled-turn 持久化保证覆盖。
- Telegram 静默回退交付必须交付完整的投影后载荷数组。单载荷快捷路径可能会在投影后丢弃额外的回退载荷。
- LINE、BlueBubbles、Zalo、Nostr 和其他现有 assembled/helper 路径可能具备回复令牌处理、媒体代理、已发送消息缓存、加载/Status 清理，或仅回调目标。在这些语义由发送适配器表示并由测试验证之前，它们保持在渠道自有交付上。
- Direct-DM helper 可能有一个回复回调，而且它是唯一正确的传输目标。通用出站不得根据 `OriginatingTo` 或 `To` 猜测并跳过该回调。
- OpenClaw Gateway 网关失败输出必须保持对人类可见，但带标签的 bot 作者房间回显必须在 `allowBots` 授权之前丢弃。渠道不得用可见文本前缀过滤器来实现这一点，除非是短期紧急权宜措施；持久化契约是结构化来源元数据。

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

渠道适配器会把传输失败分类到封闭类别中：

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
- 在配置改变之前，不要重试 `auth` 或 `permission`。
- 对于 `not_found`，当渠道声明这样做是安全的，让实时最终化从编辑回退到全新发送。
- 对于 `conflict`，使用回执/幂等性规则来判断消息是否已经存在。
- 在适配器可能已经完成平台 I/O 之后、回执提交之前发生的任何错误都会变为 `unknown_after_send`，除非适配器能够证明平台操作没有发生。

## 渠道映射

| 渠道                     | 目标迁移                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | 接收确认策略加持久化最终发送。实时适配器负责发送加编辑预览、过期预览最终发送、话题、引用回复预览跳过、媒体回退，以及重试等待处理。                                                                                                                                                                   |
| Discord                  | 发送适配器封装现有的持久化载荷交付。实时适配器负责草稿编辑、进度草稿、媒体/错误预览取消、回复目标保留，以及消息 ID 回执。审计共享房间中由机器人发送的 Gateway 网关失败回显；如果 Discord 无法在普通消息上携带来源元数据，则使用出站注册表或其他原生等效机制。 |
| Slack                    | 发送适配器处理普通聊天发布。实时适配器在线程形态支持时选择原生流，否则使用草稿预览。回执保留线程时间戳。来源适配器将 OpenClaw Gateway 网关故障映射到 Slack `chat.postMessage.metadata`，并在 `allowBots` 授权前丢弃带标签的机器人房间回显。                                  |
| WhatsApp                 | 发送适配器负责文本/媒体发送，并带有持久化最终意图。接收适配器处理群组提及和发送者身份。实时适配器可以暂时缺席，直到 WhatsApp 具备可编辑传输。                                                                                                                                                                        |
| Matrix                   | 实时适配器负责草稿事件编辑、最终化、删除、加密媒体约束，以及回复目标不匹配回退。接收适配器负责加密事件水合和去重。来源适配器应将 OpenClaw Gateway 网关失败来源编码进 Matrix 事件内容，并在 `allowBots` 处理前丢弃已配置机器人的房间回显。              |
| Mattermost               | 实时适配器负责一条草稿帖子、进度/工具折叠、原位最终化，以及新发送回退。                                                                                                                                                                                                                                                       |
| Microsoft Teams          | 实时适配器负责原生进度和分块流式传输行为。发送适配器负责活动和附件/卡片回执。                                                                                                                                                                                                                                        |
| Feishu                   | 渲染适配器负责文本/卡片/原始渲染。实时适配器负责流式卡片和重复最终消息抑制。发送适配器负责评论、话题会话、媒体，以及语音抑制。                                                                                                                                                                      |
| QQ Bot                   | 实时适配器负责 C2C 流式传输、累加器超时，以及回退最终发送。渲染适配器负责媒体标签和文本转语音。                                                                                                                                                                                                                               |
| Signal                   | 简单接收加发送适配器。除非 signal-cli 增加可靠编辑支持，否则不提供实时适配器。                                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | 简单接收加发送适配器。iMessage 发送必须先保留监控回显缓存填充，然后持久化最终消息才能绕过监控交付。BlueBubbles 专属的输入状态、回应和附件仍作为适配器能力保留。                                                                                                                            |
| Google Chat              | 简单接收加发送适配器，线程关系映射到空间和线程 ID。审计 `allowBots=true` 房间中带标签的 OpenClaw Gateway 网关失败回显行为。                                                                                                                                                                                        |
| LINE                     | 简单接收加发送适配器，并将回复令牌约束建模为目标/关系能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | SDK 接收桥加发送适配器。                                                                                                                                                                                                                                                                                                                          |
| IRC                      | 简单接收加发送适配器，无持久化编辑回执。                                                                                                                                                                                                                                                                                                    |
| Nostr                    | 用于加密私信的接收加发送适配器；回执为事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel               | 用于接收、发送、实时、重试和恢复行为的契约测试适配器。                                                                                                                                                                                                                                                                                   |
| Synology Chat            | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | 在启用通用持久化最终交付之前，发送适配器必须保留模型签名渲染和已参与线程跟踪。                                                                                                                                                                                                                        |
| Twitch                   | 简单接收加发送适配器，并带有速率限制分类。                                                                                                                                                                                                                                                                                               |
| Zalo                     | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | 简单接收加发送适配器。                                                                                                                                                                                                                                                                                                                              |

## 迁移计划

### 阶段 1：内部消息领域

- 为消息、目标、关系、来源、回执、能力、持久化意图、接收上下文、发送上下文、实时上下文和失败类别添加 `src/channels/message/*` 类型。
- 将 `origin?: MessageOrigin` 添加到当前回复交付使用的迁移桥接载荷类型，然后随着重构替换回复载荷，将该字段移动到 `ChannelMessage` 和已渲染消息类型。
- 在适配器和测试证明该形态之前，保持其内部使用。
- 为状态转换和序列化添加纯单元测试。

### 阶段 2：持久化发送核心

- 将现有出站队列从回复载荷持久化迁移到持久化消息发送意图。
- 允许持久化发送意图携带投影载荷数组或批处理计划，而不只是一个回复载荷。
- 通过兼容性转换保留当前队列恢复行为。
- 让 `deliverOutboundPayloads` 调用 `messages.send`。
- 在适配器声明重放安全后，在新的消息生命周期中默认使用最终发送持久化，并在无法写入持久化意图时封闭失败。现有频道轮次和 SDK 兼容路径在此阶段默认仍为直接发送。
- 一致地记录回执。
- 将回执和交付结果返回给原始调度器调用方，而不是将持久化发送视为终端副作用。
- 通过持久化发送意图持久保存消息来源，使恢复、重放和分块发送保留 OpenClaw 操作溯源。

### 阶段 3：频道轮次桥接

- 在 `messages.receive` 和 `messages.send` 之上重新实现 `channel.turn.run` 和 `dispatchAssembledChannelTurn`。
- 保持当前事实类型稳定。
- 默认保持旧行为。只有当适配器以重放安全的持久化策略显式选择加入时，组装轮次渠道才会变为持久化。
- 对于会最终化原生编辑且尚无法安全重放的路径，保留 `durable: false` 作为兼容性逃生口，但不要依赖 `false` 标记来保护未迁移的渠道。
- 只有在新的消息生命周期中，且渠道映射证明通用发送路径保留旧渠道交付语义之后，才默认启用组装轮次持久化。

### 阶段 4：已准备调度器桥接

- 用发送上下文桥接替换 `deliverDurableInboundReplyPayload`。
- 将旧辅助函数保留为包装器。
- 先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因为它们已经有 durable-final 工作或更简单的发送路径。
- 在每个预备 dispatcher 明确选择加入发送上下文之前，都将其视为未覆盖。文档和变更日志条目必须写成“组装后的渠道轮次”，或点名已迁移的渠道路径，而不是声称覆盖所有自动最终回复。
- 保持 `recordInboundSessionAndDispatchReply`、直接私信辅助函数以及类似的公共兼容辅助函数行为不变。它们之后可以暴露显式发送上下文选择加入，但不得在调用方拥有的投递回调之前自动尝试通用 durable 投递。

### 阶段 5：统一实时生命周期

- 构建 `messages.live`，包含两个证明适配器：
  - Telegram 用于发送、编辑和过期最终发送。
  - Matrix 用于草稿最终化和撤回兜底。
- 然后迁移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每个渠道都有等价性测试后，才删除重复的预览最终化代码。

### 阶段 6：公共 SDK

- 添加 `openclaw/plugin-sdk/channel-message`。
- 将其记录为首选渠道插件 API。
- 更新包导出、入口点清单、生成的 API 基线和插件 SDK 文档。
- 在 channel-message SDK 表面中包含 `MessageOrigin`、来源编码/解码钩子，以及共享的 `shouldDropOpenClawEcho` 谓词。
- 保留旧子路径的兼容包装器。
- 在内置插件迁移完成后，在文档中将以回复命名的 SDK 辅助函数标记为已弃用。

### 阶段 7：所有发送方

将所有非回复的出站生产者迁移到 `messages.send`：

- cron 和 Heartbeat 通知
- 任务完成
- 钩子结果
- 审批提示和审批结果
- 消息工具发送
- 子智能体完成公告
- 显式 CLI 或 Control UI 发送
- 自动化/广播路径

这里模型将不再是“智能体回复”，而是“OpenClaw 发送消息”。

### 阶段 8：弃用轮次

- 将 `channel.turn` 作为包装器保留至少一个兼容窗口。
- 发布迁移说明。
- 针对旧导入运行插件 SDK 兼容性测试。
- 只有在没有内置插件需要旧内部辅助函数，且第三方契约已有稳定替代方案后，才移除或隐藏它们。

## 测试计划

单元测试：

- durable 发送意图序列化和恢复。
- 幂等键复用和重复抑制。
- 回执提交和重放跳过。
- 当适配器支持协调时，`unknown_after_send` 恢复会在重放前先协调。
- 失败分类策略。
- 接收确认策略排序。
- 回复、跟进、系统和广播发送的关系映射。
- Gateway 网关故障来源工厂和 `shouldDropOpenClawEcho` 谓词。
- 来源在载荷规范化、分块、durable 队列序列化和恢复中的保留。

集成测试：

- `channel.turn.run` 简单适配器仍会记录并发送。
- 旧版组装轮次投递不会变为 durable，除非渠道明确选择加入。
- `channel.turn.runPrepared` 桥接仍会记录并最终化。
- 公共兼容辅助函数默认调用调用方拥有的投递回调，并且不会在这些回调之前进行通用发送。
- durable 兜底投递会在重启后重放整个投影载荷数组，并且不会在早期崩溃后留下未记录的后续载荷。
- durable 组装轮次投递会将平台消息 ID 返回给缓冲 dispatcher。
- 当 durable 投递被禁用或不可用时，自定义投递钩子仍会返回平台消息 ID。
- 最终回复能在 assistant 完成和平台发送之间重启后保留下来。
- 允许时，预览草稿会原地最终化。
- 当媒体、错误或回复目标不匹配需要常规投递时，预览草稿会被取消或撤回。
- 分块流式传输和预览流式传输不会同时投递相同文本。
- 提前流式传输的媒体不会在最终投递中重复。

渠道测试：

- Telegram 主题回复的轮询确认会延迟到接收上下文的安全完成水位线。
- Telegram 轮询恢复覆盖已接受但未投递更新的持久化安全完成偏移模型。
- Telegram 过期预览会发送新的最终消息并清理预览。
- Telegram 静默兜底会发送每个投影兜底载荷。
- Telegram 静默兜底 durable 会原子记录完整的投影兜底数组，而不是在每次循环迭代中记录一个单载荷 durable 意图。
- Discord 在媒体、错误或显式回复时取消预览。
- Discord 预备 dispatcher 的最终消息会先通过发送上下文路由，然后文档或变更日志才可声称 Discord 最终回复具备 durable 能力。
- iMessage durable 最终发送会填充监控器的已发送消息回声缓存。
- LINE、BlueBubbles、Zalo 和 Nostr 旧版投递路径不会被通用 durable 发送绕过，直到它们的适配器等价性测试存在。
- 直接私信/Nostr 回调投递仍然是权威路径，除非明确迁移到完整消息目标和可安全重放的发送适配器。
- Slack 带标签的 OpenClaw Gateway 网关故障消息保持可见出站，带标签的机器人房间回声会在 `allowBots` 之前丢弃，而具有相同可见文本的未标记机器人消息仍遵循常规机器人授权。
- Slack 原生流在顶层私信中兜底到草稿预览。
- Matrix 预览最终化和撤回兜底。
- Matrix 来自已配置机器人账号的带标签 OpenClaw Gateway 网关故障房间回声会在 `allowBots` 处理前丢弃。
- Discord 和 Google Chat 共享房间 Gateway 网关故障级联审计会覆盖 `allowBots` 模式，然后才能声称那里有通用保护。
- Mattermost 草稿最终化和新发送兜底。
- Teams 原生进度最终化。
- Feishu 重复最终消息抑制。
- QQ Bot 累加器超时兜底。
- Tlon durable 最终发送会保留模型签名渲染和已参与线程跟踪。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal 的简单 durable 最终发送。

验证：

- 开发期间运行目标 Vitest 文件。
- 在 Testbox 中针对完整变更表面运行 `pnpm check:changed`。
- 在落地完整重构前，或在公共 SDK/导出变更后，在 Testbox 中运行更广泛的 `pnpm check`。
- 移除兼容包装器之前，至少对一个支持编辑的渠道和一个仅简单发送的渠道进行 live 或 qa-channel 冒烟测试。

## 未决问题

- Telegram 是否最终应将 grammY runner 来源替换为完全 durable 的轮询来源，使其能够控制平台级重投递，而不仅仅是 OpenClaw 的持久化重启水位线。
- durable 实时预览状态应存储在与最终发送意图相同的队列记录中，还是存储在相邻的实时状态存储中。
- `plugin-sdk/channel-message` 发布后，兼容包装器应在文档中保留多久。
- 第三方插件应直接实现接收适配器，还是只通过 `defineChannelMessageAdapter` 提供规范化/发送/实时钩子。
- 哪些回执字段可以安全暴露在公共 SDK 中，哪些应保留为内部运行时状态。
- 自回声缓存和已参与线程标记等副作用应建模为发送上下文钩子、适配器拥有的最终化步骤，还是回执订阅者。
- 哪些渠道有原生来源元数据，哪些需要持久化出站注册表，哪些无法提供可靠的跨机器人回声抑制。

## 验收标准

- 每个内置消息渠道都通过 `messages.send` 发送最终可见输出。
- 每个入站消息渠道都通过 `messages.receive` 或记录在文档中的兼容包装器进入。
- 每个预览/编辑/流式渠道都使用 `messages.live` 管理草稿状态和最终化。
- `channel.turn` 只是包装器。
- 以回复命名的 SDK 辅助函数是兼容导出，不是推荐路径。
- durable 恢复可以在重启后重放待处理的最终发送，不会丢失最终响应或重复已经提交的发送；平台结果未知的发送会在重放前协调，或在文档中标记为该适配器的至少一次语义。
- 当 durable 意图无法写入时，durable 最终发送会失败关闭，除非调用方明确选择了有文档记录的非 durable 模式。
- 旧版渠道轮次和 SDK 兼容辅助函数默认使用渠道拥有的直接投递；通用 durable 发送只能显式选择加入。
- 回执会为多部分投递保留所有平台消息 ID，并保留一个主 ID 以方便线程和编辑。
- durable 包装器会在替换直接投递回调前保留渠道本地副作用。
- 预备 dispatcher 在其最终投递路径明确使用发送上下文之前，不计为 durable。
- 兜底投递会处理每个投影载荷。
- durable 兜底投递会在一个可重放意图或批处理计划中记录每个投影载荷。
- OpenClaw 发起的 Gateway 网关故障输出对人类可见，但在声明支持来源契约的渠道上，带标签的机器人创作房间回声会在机器人授权前丢弃。
- 文档解释发送、接收、实时、状态、回执、关系、失败策略、迁移和测试覆盖。

## 相关

- [消息](/zh-CN/concepts/messages)
- [流式传输和分块](/zh-CN/concepts/streaming)
- [进度草稿](/zh-CN/concepts/progress-drafts)
- [重试策略](/zh-CN/concepts/retry)
- [频道轮次内核](/zh-CN/plugins/sdk-channel-turn)
