---
read_when:
    - 重构渠道发送或接收行为
    - 更改渠道入站、回复分发、出站队列、预览流式传输或插件 SDK 消息 API
    - 设计需要持久化发送、回执、预览、编辑或重试功能的新渠道插件
summary: 持久化消息接收/发送生命周期的状态：已交付内容、相较原始设计的变更以及仍待解决的问题
title: 消息生命周期重构
x-i18n:
    generated_at: "2026-07-11T20:29:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
本页最初是一份面向未来的设计提案。此后，该设计的核心已在 `src/channels/message/*` 以及公共子路径 `openclaw/plugin-sdk/channel-outbound` / `channel-inbound` 中发布。有关当前 API，请参阅[渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)和[渠道入口 API](/zh-CN/plugins/sdk-channel-inbound)。本页记录了已经发布的内容、实现与最初草案存在差异之处，以及仍待解决的问题。
</Note>

## 此次重构的原因

渠道栈由若干局部修复逐渐发展而来：按成熟度级别分别设置的入站辅助函数（简单适配器使用 `runtime.channel.inbound.run`，功能丰富的适配器使用 `runtime.channel.inbound.runPreparedReply`）、旧版回复分发辅助函数（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、渠道特定的预览流式传输，以及附加到现有回复负载路径上的最终投递持久性。这种结构产生了过多的公共概念，也导致投递语义可能在过多位置发生偏离。

迫使系统重新设计的可靠性缺口如下：

```text
Telegram 轮询更新已确认
  -> 助手最终文本已生成
  -> 进程在 sendMessage 成功前重启
  -> 最终响应丢失
```

目标不变量：一旦核心确定应当存在一条用户可见的出站消息，就必须在尝试调用平台之前持久化发送意图，并在成功后提交平台回执。这样默认可提供至少一次恢复。只有当适配器能够证明原生幂等性，或能在重放之前根据平台状态核对发送后结果未知的尝试时，才能实现恰好一次行为。

## 已发布的内容

内部领域逻辑位于 `src/channels/message/*`：

| 文件                        | 职责                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | 适配器、发送上下文、回执和持久化意图的类型契约                                                                     |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch`——持久化发送上下文                                       |
| `receive.ts`                | `createMessageReceiveContext`——入站确认策略状态机                                                                   |
| `live.ts`                   | 实时预览状态，以及原位完成或回退逻辑                                                                                 |
| `state.ts`                  | `classifyDurableSendRecoveryState`——中断后的恢复分类                                                                |
| `receipt.ts`                | 将平台发送结果规范化为 `MessageReceipt`                                                                             |
| `capabilities.ts`           | 根据负载推导所需的持久化最终投递能力                                                                                 |
| `contracts.ts`              | 验证所声明适配器能力的契约证明                                                                                       |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound`——封装旧版 `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 函数             |
| `ingress-queue.ts`          | `createChannelIngressQueue`——持久化入站事件队列                                                                      |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal`——用于入站去重的接受/待处理/完成/释放日志                                        |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` 和保留旧名称的封装函数                                                                 |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、回复前缀和输入状态回调辅助函数                                                         |

公共接口：`openclaw/plugin-sdk/channel-outbound`（发送/回执/持久化/实时/回复管线辅助函数）和 `openclaw/plugin-sdk/channel-inbound`（入站上下文、`runChannelInboundEvent`、`dispatchChannelInboundReply`）。有关适配器示例、当前类型名称和迁移说明，请参阅这些页面——它们才是 API 结构的权威来源，而不是下文的草案。

### 发送上下文

`withDurableMessageSendContext` 围绕一条出站消息，为渠道代码提供 `render`、`previewUpdate`、`send`、`edit`、`delete`、`commit` 和 `fail` 步骤。`sendDurableMessageBatch` 是常见场景下的封装：渲染、发送，然后在结果为 `sent`/`suppressed` 时提交，出错时则标记失败。

`sendDurableMessageBatch` 返回以下判别结果之一：

| 状态             | 含义                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `sent`           | 至少有一条用户可见的平台消息已投递                                           |
| `suppressed`     | 不应将任何平台消息视为缺失（钩子取消、试运行等）                             |
| `partial_failed` | 在后续负载或副作用失败前，至少有一条消息已投递                               |
| `failed`         | 未生成任何平台回执                                                         |

持久性取值为 `required`、`best_effort` 或 `disabled`（参见 `src/channels/message/types.ts` 中的 `MessageDurabilityPolicy`）。当无法写入持久化意图时，`required` 会以失败关闭；当持久化不可用时，`best_effort` 会回退到直接发送；`disabled` 则保留重构前的直接发送行为。旧版兼容辅助函数默认为 `disabled`，不会仅因为某个渠道具有通用出站适配器就推断应使用 `required`。

仍然危险的边界是：平台调用成功之后、回执提交之前。如果进程在此处终止，除非适配器声明了 `reconcileUnknownSend`，否则核心无法知道平台消息是否存在。该钩子会将中断的发送分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重放。没有核对机制的渠道会回退到 `unknown_after_send` 状态（`src/channels/message/state.ts`、`src/infra/outbound/delivery-queue-recovery.ts`），并且只有当重复的用户可见消息是该渠道可以接受且已记录在文档中的权衡时，才能选择至少一次重放。

### 接收上下文

`createMessageReceiveContext` 使用幂等的 `ack()` 和显式的 `nack(error)` 跟踪每个入站事件的确认/否认状态。确认策略（`ChannelMessageReceiveAckPolicy`）为以下之一：

| 策略                   | 确认时机                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `after_receive_record` | 核心已持久化足够的入站元数据，可对重新投递进行去重/路由                                          |
| `after_agent_dispatch` | 智能体运行已完成分发                                                                            |
| `after_durable_send`   | 本轮的持久化出站发送已提交                                                                       |
| `manual`               | 调用方显式控制确认时机（未声明策略的适配器默认使用此项）                                          |

Telegram 轮询使用此机制持久化安全完成的更新水位线（`extensions/telegram/src/bot-update-tracker.ts` 中的 `safeCompletedUpdateId`）：grammY 仍会观察进入中间件链的每个更新，但 OpenClaw 仅会在更新完成分发后，才将持久化的重启水位线推进到该更新之后，因此失败或仍在等待处理的更新会在重启后重放。Telegram 上游的 `getUpdates` 偏移量仍由 grammY 管理；目前尚未构建一种完全持久化、可在该水位线之外控制平台级重新投递的轮询源（参见“开放问题”）。

### 实时预览

`src/channels/message/live.ts` 将预览/编辑/完成建模为一个生命周期：`createLiveMessageState`、`markLiveMessagePreviewUpdated`、`markLiveMessageFinalized`、`markLiveMessageCancelled` 和 `deliverFinalizableLivePreviewAdapter`（根据草稿构建最终编辑内容、应用编辑，并在无法编辑或编辑失败时回退到普通发送）。`LiveMessageState.phase` 的取值为 `idle | previewing | finalizing | finalized | cancelled`；`canFinalizeInPlace` 用于控制是否可以通过编辑将预览转换为最终消息，而不是重新发送一条消息。

### 持久化回执

`MessageReceipt`（`src/channels/message/types.ts`）将一次逻辑发送产生的一个或多个平台消息 ID 规范化为 `platformMessageIds`，并附带每个部分的 `parts`（类型、索引、话题 ID、回复目标 ID）。系统会保留一个主要 ID，用于话题关联和后续编辑。正因如此，多部分投递（文本加媒体、分块文本、卡片回退）才能在重启后重放并去重。

### 公共 SDK 精简

此次重构吸收或弃用了以下公共 API：`reply-runtime`、`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、`reply-payload` 辅助函数、`inbound-reply-dispatch`、`channel-reply-pipeline`，以及 `outbound-runtime` 的大多数公共用途。`src/plugin-sdk/channel-message.ts` 现在是一个标记为 `@deprecated` 的重新导出汇总入口，指向 `channel-outbound` / `channel-inbound`；`channel.turn` 运行时别名已移除，旧的 `/plugins/sdk-channel-turn` 文档页面会重定向至[渠道入口 API](/zh-CN/plugins/sdk-channel-inbound)。新的插件代码应直接面向 `channel-outbound` 和 `channel-inbound`。

## 实现与最初设计的差异

下文的设计草案从未完全按字面描述发布。保留这些记录仅为确保历史准确性；请勿将这些类型名称视为当前 API。

- **没有 `MessageOrigin` / `shouldDropOpenClawEcho`。**最初的计划要求在 Gateway 网关故障消息上添加 `source: "openclaw"` 来源标签，并提供一个共享谓词，在执行 `allowBots` 授权之前，丢弃共享房间中带有该标签且由机器人发出的回显。代码库中不存在该类型和谓词。`allowBots` 本身确实是一个真实的渠道级配置键（Slack、Discord、Google Chat 等渠道均有使用），但原本用于保护它的来源标签机制从未构建。在允许机器人的房间中抑制 Gateway 网关故障回显仍是一个待解决的缺口，而不是已经发布的保证。
- **没有统一的 `core.messages.receive/send/live/state` 命名空间。**已发布的函数直接位于 `src/channels/message/*` 中（`withDurableMessageSendContext`、`createMessageReceiveContext`、`createLiveMessageState`、`classifyDurableSendRecoveryState`），而不是位于 `core.messages.*` 门面之后。
- **没有通用的 `ChannelMessage` / `MessageTarget` / `MessageRelation` 规范化消息类型。**核心仍然通过发送适配器传递具体的回复负载（`ReplyPayload`）和渠道特定上下文，而不是使用一种带有 `kind: "reply" | "followup" | "broadcast" | "system"` 关系的平台无关消息结构。
- **确认策略名称与草案不同。**已发布的名称为：`after_receive_record | after_agent_dispatch | after_durable_send | manual`。最初草案使用 `immediate | after-record | after-durable-send | manual`，并包含一个 Webhook 超时原因字段；该结构并未构建。
- **`DurableFinalDeliveryRequirementMap` 能力键取代了草案中的 `MessageCapabilities` 对象。**能力采用扁平布尔标志（`text`、`media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、`messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、`afterCommit`），并通过 `verifyDurableFinalCapabilityProofs` 验证，而不是使用嵌套的 `text.chunking` / `attachments.voice` 风格结构。

## 具体迁移风险（仍然相关）

这些渠道特有的副作用早于此次重构，并且必须在新的发送路径中继续
正常工作。它们并非假设：每一项如今都已实现，并承担着关键作用。

- **iMessage**（`extensions/imessage/src/monitor/echo-cache.ts`、
  `persisted-echo-cache.ts`）：监视器会在发送成功后将已发送消息记录到回显
  缓存中。持久化的最终发送仍必须填充该缓存，否则 OpenClaw 可能会将自己的
  回复重新作为入站用户消息摄取。
- **Tlon**（`extensions/tlon/src/monitor/index.ts`）：附加可选的模型
  签名，并在群组回复后记录已参与的线程。持久化投递不得绕过这些副作用。
- **Discord 和其他已准备的分发器**已经负责直接投递和预览行为。只有当某个
  渠道的已准备分发器明确通过发送上下文路由最终消息时，该渠道才实现了端到端
  持久化；不要认为仅凭通用适配器就已覆盖。
- **Telegram 静默回退投递**必须在分块/回退投影后投递整个已投影的
  载荷数组，而不只是第一个载荷。
- **LINE、Zalo、Nostr** 及类似的辅助路径可能包含回复令牌
  处理、媒体代理、已发送消息缓存或仅限回调的目标。在发送适配器能够表示这些
  语义并由测试覆盖之前，它们仍由渠道负责投递。
- **直接私信辅助函数**可能包含一个作为唯一正确传输目标的回复回调。通用出站
  逻辑不得根据原始平台字段猜测目标并跳过该回调。

## 故障分类

适配器将传输故障划分为 `DeliveryFailureKind` 风格的封闭
类别（暂时性、速率限制、身份验证、权限、未找到、无效
载荷、冲突、已取消、未知）。核心策略：

- 重试暂时性故障和速率限制故障。
- 除非存在渲染回退，否则不要重试无效载荷故障。
- 在配置更改之前，不要重试身份验证或权限故障。
- 遇到未找到错误时，如果渠道声明这样做是安全的，则允许实时最终确定逻辑从编辑
  回退为全新发送。
- 遇到冲突时，使用回执/幂等性状态判断消息是否已经存在。
- 如果平台调用可能已经成功，但在提交回执前发生错误，则该错误归类为
  `unknown_after_send`，除非适配器能够证明平台操作并未发生。

## 待解决问题

- Telegram 最终是否应使用完全持久化的轮询源替换 grammY（`1.43.0`）
  轮询运行器，由该轮询源控制平台级重新投递，而不只是 OpenClaw 的持久化重启
  水位标记（`safeCompletedUpdateId`）。
- 实时预览状态应与最终发送意图存储在同一条记录中，还是存储在同级的实时状态
  存储中。
- 启用了共享 Bot 的房间中的 Gateway 网关故障回显抑制，是否需要最初规划的来源
  标记机制、更简单的按渠道契约，或者该问题不在范围内。
- 哪些渠道原生支持用于跨 Bot 回显抑制的来源/元数据，哪些渠道则需要持久化的
  出站注册表。

## 相关内容

- [消息](/zh-CN/concepts/messages)
- [流式传输和分块](/zh-CN/concepts/streaming)
- [进度草稿](/zh-CN/concepts/progress-drafts)
- [重试策略](/zh-CN/concepts/retry)
- [渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)
- [渠道入站 API](/zh-CN/plugins/sdk-channel-inbound)
