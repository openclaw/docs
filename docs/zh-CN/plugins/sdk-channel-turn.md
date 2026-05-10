---
read_when:
    - 你正在构建一个渠道插件，并希望使用共享的入站轮次生命周期
    - 你正在将一个渠道监控器迁出手写的记录/分发胶水代码
    - 你需要理解准入、摄取、分类、预检、解析、记录、分派和收尾阶段
sidebarTitle: Channel turn
summary: runtime.channel.turn -- 内置和第三方渠道插件用于记录、派发和最终完成智能体轮次的共享入站轮次内核
title: 频道轮次内核
x-i18n:
    generated_at: "2026-05-10T19:42:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

频道轮次内核是共享的入站状态机，用于把规范化的平台事件转换为智能体轮次。渠道插件提供平台事实和投递回调。核心负责编排：摄取、分类、预检、解析、授权、组装、记录、分发和最终处理。

当你的插件位于入站消息热路径上时使用它。对于非消息事件（斜杠命令、模态框、按钮交互、生命周期事件、反应、语音状态），请保持插件本地处理。该内核只负责可能成为智能体文本轮次的事件。

<Info>
  内核通过注入的插件运行时以 `runtime.channel.turn.*` 访问。插件运行时类型从 `openclaw/plugin-sdk/core` 导出，因此第三方原生插件可以像内置渠道插件一样使用这些入口点。
</Info>

## 为什么需要共享内核

渠道插件会重复同一套入站流程：规范化、路由、门控、构建上下文、记录会话元数据、分发智能体轮次、最终处理投递状态。如果没有共享内核，对提及门控、仅工具可见回复、会话元数据、待处理历史或分发最终处理的变更，都必须逐个渠道应用。

内核刻意将四个概念分开：

- `ConversationFacts`：消息来自哪里
- `RouteFacts`：哪个智能体和会话应处理它
- `ReplyPlanFacts`：可见回复应发往哪里
- `MessageFacts`：智能体应看到哪些正文和补充上下文

Slack 私信、Telegram 话题、Matrix 线程和 Feishu 话题会话在实践中都会区分这些概念。把它们当作同一个标识符会随着时间推移造成偏差。

## 阶段生命周期

无论渠道如何，内核都会运行同一条固定流水线：

1. `ingest` -- 适配器将原始平台事件转换为 `NormalizedTurnInput`
2. `classify` -- 适配器声明该事件是否可以启动智能体轮次
3. `preflight` -- 适配器执行去重、自身回显、补水、防抖、解密、部分事实预填
4. `resolve` -- 适配器返回完整组装的轮次（路由、回复计划、消息、投递）
5. `authorize` -- 将私信、群组、提及和命令策略应用到组装后的事实
6. `assemble` -- 通过 `buildContext` 从事实构建 `FinalizedMsgContext`
7. `record` -- 持久化入站会话元数据和最后路由
8. `dispatch` -- 通过缓冲分块分发器执行智能体轮次
9. `finalize` -- 即使发生分发错误，也会运行适配器的 `onFinalize`

当提供 `log` 回调时，每个阶段都会发出结构化日志事件。请参阅 [可观测性](#observability)。

## 准入种类

当轮次被门控时，内核不会抛出错误。它返回一个 `ChannelTurnAdmission`：

| 种类          | 何时                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 轮次被准入。智能体轮次运行，并使用可见回复路径。                                                                   |
| `observeOnly` | 轮次端到端运行，但投递适配器不发送任何可见内容。用于广播观察者智能体和其他被动多智能体流程。 |
| `handled`     | 平台事件已在本地消费（生命周期、反应、按钮、模态框）。内核跳过分发。                                           |
| `drop`        | 跳过路径。可选的 `recordHistory: true` 会把消息保留在待处理群组历史中，以便未来提及时有上下文。                      |

准入可以来自 `classify`（事件类别表示它不能启动轮次）、来自 `preflight`（去重、自身回显、缺少提及但记录历史），也可以来自 `resolveTurn` 本身。

## 入口点

运行时公开三个首选入口点，让适配器可以按匹配渠道的层级接入。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

两个旧版运行时辅助函数仍然可用于插件 SDK 兼容性：

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

当你的渠道可以把其入站流程表达为 `ChannelTurnAdapter<TRaw>` 时使用。适配器具有 `ingest`、可选 `classify`、可选 `preflight`、必需 `resolveTurn` 和可选 `onFinalize` 回调。

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

当渠道只有少量适配器逻辑，并且适合通过钩子拥有生命周期时，`run` 是合适的形态。

### runAssembled

当渠道已经解析路由、构建了 `FinalizedMsgContext`，
并且只需要共享的记录、回复流水线、分发和最终处理
顺序时使用。这是简单内置入站路径的首选形态，否则这些路径
会重复 `createChannelMessageReplyPipeline(...)` 和
`runPrepared(...)` 样板代码。

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

当唯一由渠道拥有的分发行为是最终载荷投递，加上可选的正在输入、回复选项、持久投递或错误日志时，选择 `runAssembled` 而不是 `runPrepared`。

### runPrepared

当渠道具有复杂的本地分发器，需要保留渠道拥有的预览、重试、编辑或线程引导时使用。内核仍会在分发前记录入站会话，并暴露统一的 `DispatchedChannelTurnResult`。

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

丰富渠道（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）使用 `runPrepared`，因为它们的分发器会编排平台特定行为，而内核不应了解这些行为。

### buildContext

一个纯函数，将事实包映射为 `FinalizedMsgContext`。当你的渠道手写流水线的一部分，但希望保持一致的上下文形态时使用。

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

在为 `run` 组装轮次时，`buildContext` 也适合在 `resolveTurn` 回调内使用。

<Note>
  已弃用的 SDK 辅助函数（如 `dispatchInboundReplyWithBase`）仍会通过组装轮次辅助函数桥接。新的插件代码应使用 `run` 或 `runPrepared`。
</Note>

## 事实类型

内核从你的适配器消费的事实与平台无关。请先将平台对象转换为这些形态，再交给内核。

### NormalizedTurnInput

| 字段             | 用途                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 用于去重和日志的稳定消息 ID                                   |
| `timestamp`       | 可选的纪元毫秒                                                            |
| `rawText`         | 从平台收到的正文                                           |
| `textForAgent`    | 给智能体的可选清理后正文（去除提及、修剪输入状态）             |
| `textForCommands` | 用于 `/command` 解析的可选正文                                    |
| `raw`             | 给需要原始对象的适配器回调使用的可选透传引用 |

### ChannelEventClass

| 字段                  | 用途                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | 如果为 false，内核返回 `{ kind: "handled" }`                       |
| `requiresImmediateAck` | 给需要在分发前 ACK 的适配器的提示                      |

### SenderFacts

| 字段          | 用途                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 稳定的平台发送者 ID                                      |
| `name`         | 显示名称                                                   |
| `username`     | 如果与 `name` 不同，则为用户名                                 |
| `tag`          | Discord 风格的判别符或平台标签                    |
| `roles`        | 角色 ID，用于成员角色允许列表匹配              |
| `isBot`        | 当发送者是已知 bot 时为 true（内核用于丢弃） |
| `isSelf`       | 当发送者是配置的智能体自身时为 true            |
| `displayLabel` | 用于信封文本的预渲染标签                           |

### ConversationFacts

| 字段             | 用途                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`、`group` 或 `channel`                                      |
| `id`              | 用于路由的会话 ID                                     |
| `label`           | 信封的人类可读标签                                         |
| `spaceId`         | 可选的外层空间标识符（Slack 工作区、Matrix homeserver） |
| `parentId`        | 当这是线程时的外层会话 ID                          |
| `threadId`        | 当此消息位于线程内时的线程 ID                       |
| `nativeChannelId` | 当与路由 ID 不同时的平台原生渠道 ID        |
| `routePeer`       | 用于 `resolveAgentRoute` 查找的对端                             |

### RouteFacts

| 字段                    | 用途                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 应处理此轮次的智能体                                       |
| `accountId`             | 可选覆盖项（多账号渠道）                                   |
| `routeSessionKey`       | 用于路由的会话键                                           |
| `dispatchSessionKey`    | 当不同于路由键时，调度时使用的会话键                       |
| `persistedSessionKey`   | 写入持久化会话元数据的会话键                               |
| `parentSessionKey`      | 分支/线程会话的父级                                        |
| `modelParentSessionKey` | 分支会话的模型侧父级                                       |
| `mainSessionKey`        | 直接对话的主私信所有者固定项                               |
| `createIfMissing`       | 允许记录步骤创建缺失的会话行                               |

### ReplyPlanFacts

| 字段                      | 用途                                                   |
| ------------------------- | ------------------------------------------------------ |
| `to`                      | 写入上下文 `To` 的逻辑回复目标                         |
| `originatingTo`           | 原始上下文目标（`OriginatingTo`）                      |
| `nativeChannelId`         | 用于投递的平台原生渠道 ID                              |
| `replyTarget`             | 当不同于 `to` 时，最终可见回复的目的地                 |
| `deliveryTarget`          | 更底层的投递覆盖项                                     |
| `replyToId`               | 引用/锚定的消息 ID                                     |
| `replyToIdFull`           | 当平台同时具备两种形式时，完整形式的引用 ID            |
| `messageThreadId`         | 投递时的线程 ID                                        |
| `threadParentId`          | 线程的父消息 ID                                        |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct` 或 `none`       |

### AccessFacts

`AccessFacts` 携带授权阶段所需的布尔值。身份匹配保留在渠道中：内核只消费结果。

| 字段       | 用途                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `dm`       | 私信允许/配对/拒绝决策和 `allowFrom` 列表                            |
| `group`    | 群组策略、路由允许、发送者允许、允许列表、提及要求                   |
| `commands` | 跨已配置授权器的命令授权                                             |
| `mentions` | 是否可以检测提及，以及智能体是否被提及                               |

### MessageFacts

| 字段             | 用途                                                       |
| ---------------- | ---------------------------------------------------------- |
| `body`           | 最终信封正文（已格式化）                                   |
| `rawBody`        | 原始入站正文                                               |
| `bodyForAgent`   | 智能体看到的正文                                           |
| `commandBody`    | 用于命令解析的正文                                         |
| `envelopeFrom`   | 信封的预渲染发送者标签                                     |
| `senderLabel`    | 渲染后发送者的可选覆盖项                                   |
| `preview`        | 用于日志的短脱敏预览                                       |
| `inboundHistory` | 当渠道保留缓冲区时的近期入站历史条目                       |

### SupplementalContextFacts

补充上下文覆盖引用、转发和线程引导上下文。内核会应用已配置的 `contextVisibility` 策略。渠道适配器只提供事实和 `senderAllowed` 标志，以便跨渠道策略保持一致。

### InboundMediaFacts

媒体采用事实形态。平台下载、认证、SSRF 策略、CDN 规则和解密保留在渠道本地。内核将事实映射到 `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes` 和 `MediaTranscribedIndexes`。

## 适配器契约

对于完整的 `run`，适配器形态为：

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` 返回 `ChannelTurnResolved`，它是带有可选准入类型的 `AssembledChannelTurn`。返回 `{ admission: { kind: "observeOnly" } }` 会运行该轮次但不产生可见输出。适配器仍然拥有投递回调；它只是在该轮次中变成 no-op。

`onFinalize` 会在每个结果上运行，包括调度错误。用它清理待处理的群组历史、移除确认反应、停止状态指示器，并刷新本地状态。

## 投递适配器

内核不会直接调用平台。渠道会向内核交付一个 `ChannelTurnDeliveryAdapter`：

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

每个已缓冲的回复分块都会调用一次 `deliver`。在消息生命周期迁移期间，组装后的渠道轮次投递默认由渠道拥有：省略 `durable` 字段意味着内核必须直接调用 `deliver`，并且不得通过通用出站投递路由。只有在渠道经过审计、证明通用发送路径保留了旧投递行为之后，才设置 `durable`，包括回复/线程目标、媒体处理、已发送消息/自回显缓存、状态清理和返回的消息 ID。`durable: false` 仍然是“使用渠道拥有的回调”的兼容写法，但未迁移的渠道不应需要添加它。当渠道拥有平台消息 ID 时返回它们，以便调度器可以保留线程锚点并编辑后续分块；较新的投递路径也应返回 `receipt`，以便恢复、预览最终化和重复抑制可以从 `messageIds` 迁移出去。对于仅观察轮次，返回 `{ visibleReplySent: false }`，或使用 `createNoopChannelTurnDeliveryAdapter()`。

使用 `runPrepared` 且拥有完全由渠道拥有的调度器的渠道没有 `ChannelTurnDeliveryAdapter`。这些调度器默认不是持久化的。它们应保留直接投递路径，直到显式选择加入新的发送上下文，并具备完整目标、可安全重放的适配器、回执契约和渠道副作用钩子。

公共兼容性辅助函数，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接私信辅助函数，在迁移期间必须保持行为不变。它们不应在调用方拥有的 `deliver` 或 `reply` 回调之前调用通用持久化投递。

## 记录选项

记录阶段会包装 `recordInboundSession`。大多数渠道可以使用默认值。通过 `record` 覆盖：

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

调度器会等待记录阶段。如果记录抛出异常，内核会运行 `onPreDispatchFailure`（当提供给 `runPrepared` 时）并重新抛出。

## 可观测性

当提供 `log` 回调时，每个阶段都会发出结构化事件：

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

记录的阶段：`ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。避免记录原始正文；使用 `MessageFacts.preview` 作为短脱敏预览。

## 哪些内容保留在渠道本地

内核拥有编排。渠道仍然拥有：

- 平台传输（Gateway 网关、REST、WebSocket、轮询、Webhook）
- 身份解析和显示名称匹配
- 原生命令、斜杠命令、自动完成、模态框、按钮、语音状态
- 卡片、模态框和自适应卡片渲染
- 媒体认证、CDN 规则、加密媒体、转录
- 编辑、反应、密文删除和在线状态 API
- 回填和平台侧历史获取
- 需要平台特定验证的配对流程

如果两个渠道开始需要其中某一项的相同辅助函数，请提取共享 SDK 辅助函数，而不是将它推入内核。

## 稳定性

`runtime.channel.turn.*` 是公共插件运行时表面的一部分。事实类型（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）和准入形态（`ChannelTurnAdmission`、`ChannelEventClass`）可以通过 `openclaw/plugin-sdk/core` 中的 `PluginRuntime` 访问。

适用向后兼容规则：新的事实字段是增量添加的，准入类型不会重命名，入口点名称保持稳定。需要非增量更改的新渠道需求必须经过插件 SDK 迁移流程。

## 相关

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor)：计划中的发送/接收/实时生命周期将包装此内核
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)：更广泛的渠道插件契约
- [插件运行时辅助函数](/zh-CN/plugins/sdk-runtime)：其他 `runtime.*` 表面
- [插件内部机制](/zh-CN/plugins/architecture-internals)：加载管线和注册表机制
