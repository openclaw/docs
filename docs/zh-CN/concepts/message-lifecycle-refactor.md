---
read_when:
    - 重构渠道发送或接收行为
    - 更改渠道入站、回复分发、出站队列、预览流式传输或插件 SDK 消息 API
    - 设计需要持久发送、回执、预览、编辑或重试的新渠道插件
summary: 持久消息接收/发送生命周期的状态：已发布内容、相较原始设计的变更，以及仍未解决的事项
title: 消息生命周期重构
x-i18n:
    generated_at: "2026-07-05T11:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
本页最初是一份前瞻性设计提案。该设计的核心后来已在 `src/channels/message/*` 以及公开的 `openclaw/plugin-sdk/channel-outbound` / `channel-inbound` 子路径中发布。关于当前 API，请使用 [渠道出站 API](/zh-CN/plugins/sdk-channel-outbound) 和 [渠道入站 API](/zh-CN/plugins/sdk-channel-inbound)。本页跟踪已发布的内容、实现与原始草案的差异，以及仍未解决的问题。
</Note>

## 为什么进行这次重构

频道栈源自若干本地修复：按成熟度级别拆分的入站辅助函数（简单适配器使用 `runtime.channel.inbound.run`，富适配器使用 `runtime.channel.inbound.runPreparedReply`）、旧版回复分发辅助函数（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、频道特定的预览流式传输，以及附加到现有回复载荷路径上的最终投递持久性。这种形态产生了过多公开概念，也产生了过多可能导致投递语义漂移的位置。

迫使重新设计的可靠性缺口：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目标不变量：一旦核心决定某条可见出站消息应该存在，就必须先持久化发送意图，再尝试平台调用；平台回执必须在成功后提交。这默认提供至少一次恢复。精确一次行为只存在于适配器能够证明原生幂等性，或能在重放前将发送后状态未知的尝试与平台状态对账的场景中。

## 已发布内容

内部领域位于 `src/channels/message/*`：

| 文件                        | 负责内容                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | 适配器、发送上下文、回执和持久意图类型契约                                                  |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 持久发送上下文                             |
| `receive.ts`                | `createMessageReceiveContext` — 入站 ack 策略状态机                                                   |
| `live.ts`                   | 实时预览状态，以及原地最终化或回退逻辑                                                        |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 中断后的恢复分类                                    |
| `receipt.ts`                | 将平台发送结果规范化为 `MessageReceipt`                                                             |
| `capabilities.ts`           | 从载荷推导所需的持久最终能力                                                         |
| `contracts.ts`              | 针对已声明适配器能力的契约证明验证                                                      |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — 包装旧版 `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 函数 |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 持久入站事件队列                                                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — 用于入站去重的 accept/pending/complete/release 日志                  |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` 和旧版命名包装器                                                            |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、回复前缀和 typing 回调辅助函数                                             |

公开表面：`openclaw/plugin-sdk/channel-outbound`（发送/回执/持久/live/回复流水线辅助函数）和 `openclaw/plugin-sdk/channel-inbound`（入站上下文、`runChannelInboundEvent`、`dispatchChannelInboundReply`）。关于适配器示例、当前类型名称和迁移说明，请参阅这些页面；它们是 API 形态的事实来源，而不是下面的草案。

### 发送上下文

`withDurableMessageSendContext` 为频道代码提供围绕一条出站消息的 `render`、`previewUpdate`、`send`、`edit`、`delete`、`commit` 和 `fail` 步骤。`sendDurableMessageBatch` 是常见场景包装器：渲染、发送，然后在 `sent`/`suppressed` 时提交，或在出错时失败。

`sendDurableMessageBatch` 返回一个判别式结果：

| 状态           | 含义                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | 至少一条可见平台消息已投递                              |
| `suppressed`     | 不应将任何平台消息视为缺失（hook 取消、dry-run 等） |
| `partial_failed` | 后续载荷或副作用失败前，至少一条消息已投递      |
| `failed`         | 未产生平台回执                                                 |

持久性是 `required`、`best_effort` 或 `disabled` 之一（`src/channels/message/types.ts` 中的 `MessageDurabilityPolicy`）。当无法写入持久意图时，`required` 会失败关闭；当持久化不可用时，`best_effort` 会继续直接发送；`disabled` 保持重构前的直接发送行为。旧版兼容辅助函数默认使用 `disabled`，不会仅因为频道有通用出站适配器就推断为 `required`。

仍然危险的边界：平台调用成功之后、回执提交之前。如果进程在此处退出，除非适配器声明 `reconcileUnknownSend`，否则核心无法知道平台消息是否存在。该 hook 会将被中断的发送分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重放。没有对账能力的频道会回退到 `unknown_after_send` 状态（`src/channels/message/state.ts`、`src/infra/outbound/delivery-queue-recovery.ts`），并且只有在重复可见消息对该频道是可接受且已记录的权衡时，才可以选择至少一次重放。

### 接收上下文

`createMessageReceiveContext` 使用幂等的 `ack()` 和显式的 `nack(error)` 按入站事件跟踪 ack/nack 状态。ack 策略（`ChannelMessageReceiveAckPolicy`）是以下之一：

| 策略                 | ack 时机                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | 核心已持久化足够的入站元数据，可对重新投递去重/路由                           |
| `after_agent_dispatch` | 智能体运行已分发                                                             |
| `after_durable_send`   | 本轮的持久出站发送已提交                                             |
| `manual`               | 调用方显式控制 ack 时机（未声明策略的适配器默认使用此项） |

Telegram 轮询使用它来持久化安全完成的更新水位线（`extensions/telegram/src/bot-update-tracker.ts` 中的 `safeCompletedUpdateId`）：grammY 仍然会在每个更新进入中间件链时观察到它，但 OpenClaw 只会把持久化的重启水位线推进到已完成分发的更新之后，因此失败或仍处于挂起状态的更新会在重启后重放。Telegram 上游的 `getUpdates` offset 仍由 grammY 拥有；目前尚未构建能够在此水位线之外控制平台级重新投递的完全持久轮询源（见未解决问题）。

### 实时预览

`src/channels/message/live.ts` 将预览/编辑/最终化建模为一个生命周期：`createLiveMessageState`、`markLiveMessagePreviewUpdated`、`markLiveMessageFinalized`、`markLiveMessageCancelled` 和 `deliverFinalizableLivePreviewAdapter`（从草稿构建最终编辑、应用它，并在无法编辑或编辑失败时回退到普通发送）。`LiveMessageState.phase` 是 `idle | previewing | finalizing | finalized | cancelled`；`canFinalizeInPlace` 控制预览是否可以通过编辑变成最终消息，而不是重新发送一条新消息。

### 持久回执

`MessageReceipt`（`src/channels/message/types.ts`）会把一次逻辑发送产生的一个或多个平台消息 ID 规范化为 `platformMessageIds`，以及按分部记录的 `parts`（kind、index、thread id、reply-to id）。主 ID 会保留下来用于线程和后续编辑。这使多段投递（文本加媒体、分块文本、卡片回退）在重启后可重放且可去重。

### 公开 SDK 精简

这次重构吸收或弃用了：作为公开 API 暴露的 `reply-runtime`、`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、`reply-payload` 辅助函数，`inbound-reply-dispatch`、`channel-reply-pipeline`，以及大多数对 `outbound-runtime` 的公开使用。`src/plugin-sdk/channel-message.ts` 现在是一个 `@deprecated` 重新导出桶，指向 `channel-outbound` / `channel-inbound`；`channel.turn` 运行时别名已移除，旧的 `/plugins/sdk-channel-turn` 文档页面会重定向到 [渠道入站 API](/zh-CN/plugins/sdk-channel-inbound)。新的插件代码应直接面向 `channel-outbound` 和 `channel-inbound`。

## 实现与原始设计的差异

下面的设计草案从未按字面描述发布。保留记录仅用于历史准确性；不要把这些类型名称视为当前 API。

- **没有 `MessageOrigin` / `shouldDropOpenClawEcho`。** 原始计划要求在 Gateway 网关失败消息上添加 `source: "openclaw"` 来源标签，并提供一个共享谓词，在 `allowBots` 授权之前丢弃共享房间中带标签且由 bot 创作的回声。该类型和谓词在代码库中不存在。`allowBots` 本身是真实存在的按频道配置键（Slack、Discord、Google Chat 等），但原本用于保护它的来源标签机制从未构建。在启用 bot 的房间中，Gateway 网关失败回声抑制仍是一个未解决缺口，而不是已发布保证。
- **没有统一的 `core.messages.receive/send/live/state` 命名空间。** 已发布函数直接位于 `src/channels/message/*` 中（`withDurableMessageSendContext`、`createMessageReceiveContext`、`createLiveMessageState`、`classifyDurableSendRecoveryState`），而不是位于 `core.messages.*` 门面之后。
- **没有通用的 `ChannelMessage` / `MessageTarget` / `MessageRelation` 规范化消息类型。** 核心仍然通过发送适配器传递具体回复载荷（`ReplyPayload`）和频道特定上下文，而不是使用一个带有 `kind: "reply" | "followup" | "broadcast" | "system"` 关系的平台中立消息形态。
- **ack 策略名称与草案不同。** 已发布的是：`after_receive_record | after_agent_dispatch | after_durable_send | manual`。原始草案使用 `immediate | after-record | after-durable-send | manual`，并带有 webhook 超时原因字段；该形态没有构建。
- **`DurableFinalDeliveryRequirementMap` 能力键取代了草案中的 `MessageCapabilities` 对象。** 能力是扁平布尔标志（`text`、`media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、`messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、`afterCommit`），通过 `verifyDurableFinalCapabilityProofs` 验证，而不是使用嵌套的 `text.chunking` / `attachments.voice` 风格结构。

## 具体迁移风险（仍然相关）

这些渠道特定的副作用早于这次重构存在，并且必须在新的发送路径中继续
工作。它们不是假设场景：每一项今天都已实现并承担关键作用。

- **iMessage**（`extensions/imessage/src/monitor/echo-cache.ts`、
  `persisted-echo-cache.ts`）：监视器会在成功发送后，将已发送消息记录到 echo
  cache 中。持久化的最终发送仍必须填充该
  cache，否则 OpenClaw 可能会把自己的回复重新摄入为入站用户消息。
- **Tlon**（`extensions/tlon/src/monitor/index.ts`）：在群组回复后追加可选的模型
  签名，并记录已参与的线程。持久化
  投递不能绕过这些效果。
- **Discord 和其他已准备的调度器**已经拥有直接投递和
  预览行为。只有当渠道的已准备
  调度器显式地通过发送上下文路由最终消息时，该渠道才是端到端持久化的；不要只凭
  通用适配器就假定已经覆盖。
- **Telegram 静默回退投递**必须在分块/回退
  投影之后投递整个已投影的
  payload 数组，而不是只投递第一个 payload。
- **LINE、Zalo、Nostr** 以及类似的 helper 路径可能具有 reply-token
  处理、媒体代理、已发送消息缓存，或仅回调的目标。
  在这些语义由发送适配器表示并被测试覆盖之前，
  它们仍由渠道自有投递处理。
- **直接私信 helper** 可能具有一个回复回调，而它是唯一正确的
  传输目标。通用出站逻辑不能从原始
  平台字段中猜测目标并跳过该回调。

## 失败分类

适配器会将传输失败分类为 `DeliveryFailureKind` 风格的闭合
类别（transient、rate limit、auth、permission、not found、invalid
payload、conflict、cancelled、unknown）。核心策略：

- 重试 transient 和 rate-limit 失败。
- 不要重试 invalid-payload 失败，除非存在渲染回退。
- 在配置变更之前，不要重试 auth 或 permission 失败。
- 对于 not-found，当渠道声明这样做安全时，允许实时最终化从编辑回退到全新发送。
- 对于 conflict，使用回执/幂等性状态来判断消息
  是否已经存在。
- 平台调用之后、回执
  提交之前发生的任何错误，都可能已经成功执行，因此会变为 `unknown_after_send`，除非适配器能证明平台
  操作没有发生。

## 未决问题

- Telegram 是否最终应将 grammY（`1.43.0`）轮询
  runner 替换为完全持久化的轮询源，由其控制平台级
  重新投递，而不只是 OpenClaw 的持久化重启水位线
  （`safeCompletedUpdateId`）。
- 实时预览状态应与最终发送
  intent 存在同一条记录中，还是存在同级的 live-state 存储中。
- 在共享的 bot 启用房间中，Gateway 网关失败 echo 抑制是否需要
  最初计划的 origin-tagging 机制、更简单的按渠道
  contract，还是不在范围内。
- 哪些渠道具有原生的来源/元数据支持，可用于跨 bot echo
  抑制；哪些渠道需要持久化的出站注册表。

## 相关

- [消息](/zh-CN/concepts/messages)
- [流式传输和分块](/zh-CN/concepts/streaming)
- [进度草稿](/zh-CN/concepts/progress-drafts)
- [重试策略](/zh-CN/concepts/retry)
- [渠道出站 API](/zh-CN/plugins/sdk-channel-outbound)
- [渠道入站 API](/zh-CN/plugins/sdk-channel-inbound)
