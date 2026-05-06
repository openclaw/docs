---
read_when:
    - 重構通道傳送或接收行為
    - 變更通道回合、回覆派送、出站佇列、預覽串流，或 Plugin SDK 訊息 API
    - 設計需要持久化傳送、回執、預覽、編輯或重試的新頻道 Plugin
summary: 統一持久訊息接收、傳送、預覽、編輯與串流生命週期的設計計畫
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-05-06T02:46:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2253d5b197bf6df15486d21492fab608b89a5f88bf213a03215d9f6638462017
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此頁是目標設計，用來以一個持久的訊息生命週期，取代分散的通道回合、回覆分派、預覽串流與外送遞輔助工具。

簡短版本：

- 核心原語應該是 **receive** 和 **send**，而不是 **reply**。
- 回覆只是外送訊息上的一種關係。
- 回合是入站處理的便利機制，不是遞送的擁有者。
- 傳送必須以情境為基礎：`begin`、算繪、預覽或串流、最終傳送、
  提交、失敗。
- 接收也必須以情境為基礎：正規化、去重、路由、記錄、
  分派、平台確認、失敗。
- 公開 Plugin SDK 應收斂成一個小型的通道訊息介面。

## 問題

目前的通道堆疊是由幾個有效的本地需求演進而來：

- 簡單的入站配接器使用 `runtime.channel.turn.run`。
- 複雜的配接器使用 `runtime.channel.turn.runPrepared`。
- 舊版輔助工具使用 `dispatchInboundReplyWithBase`、
  `recordInboundSessionAndDispatchReply`、回覆承載輔助工具、回覆分塊、
  回覆參照，以及外送執行階段輔助工具。
- 預覽串流存在於通道特定的分派器中。
- 最終遞送的持久性正在既有回覆承載路徑周圍加入。

這種形狀能修正本地錯誤，但也讓 OpenClaw 擁有太多公開概念，以及太多遞送語意可能漂移的位置。

暴露此問題的可靠性情境是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標不變式比 Telegram 更廣：一旦核心決定某個可見外送訊息應該存在，該意圖就必須在嘗試平台傳送之前先持久化，且平台收據必須在成功後提交。這讓 OpenClaw 具備至少一次復原能力。只有在配接器能證明原生冪等性，或能在重播前將送出後未知的嘗試與平台狀態對帳時，才存在恰好一次行為。

這是此重構的最終狀態，不是每條目前路徑的描述。在遷移期間，當最佳努力的佇列寫入失敗時，既有外送輔助工具仍可退回到直接傳送。只有當持久的最終傳送會關閉失敗，或以文件化的非持久策略明確選擇退出時，重構才算完成。

## 目標

- 所有通道訊息接收與傳送路徑使用一個核心生命週期。
- 在配接器宣告可安全重播行為後，新的訊息生命週期預設使用持久的最終傳送。
- 共用的預覽、編輯、串流、最終化、重試、復原與收據語意。
- 第三方 Plugin 能學習並維護的小型 Plugin SDK 介面。
- 遷移期間相容既有 `channel.turn` 呼叫者。
- 新通道能力有清楚的擴充點。
- 核心中沒有平台特定分支。
- 沒有 token-delta 通道訊息。通道串流維持為訊息預覽、編輯、追加，或已完成區塊遞送。
- 針對操作性/系統輸出的結構化 OpenClaw 來源中繼資料，讓可見的 Gateway 失敗不會在共用且啟用 bot 的房間中，重新作為新提示進入。

## 非目標

- 不在第一階段移除 `runtime.channel.turn.*`。
- 不強迫每個通道採用相同的原生傳輸行為。
- 不讓核心理解 Telegram topics、Slack 原生串流、Matrix redactions、
  Feishu cards、QQ voice，或 Teams activities。
- 不將所有內部遷移輔助工具發布為穩定 SDK API。
- 不讓重試重播已完成、非冪等的平台操作。

## 參考模型

Vercel Chat 有很好的公開心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 配接器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、
  `stream`、`startTyping`，以及歷史擷取
- 用於去重、鎖定、佇列與持久化的狀態配接器

OpenClaw 應借用詞彙，而不是複製介面。

OpenClaw 在該模型之外還需要：

- 在直接傳輸呼叫前，持久化外送傳送意圖。
- 具有開始、提交與失敗的明確傳送情境。
- 知道平台確認策略的接收情境。
- 可在重新啟動後保留，並能驅動編輯、刪除、復原與重複抑制的收據。
- 更小的公開 SDK。隨附 Plugin 可使用內部執行階段輔助工具，但第三方 Plugin 應看到一個一致的訊息 API。
- 代理特定行為：工作階段、文字記錄、區塊串流、工具進度、核准、媒體指令、靜默回覆，以及群組提及歷史。

`thread.post()` 風格的 promise 對 OpenClaw 來說不夠。它們隱藏了決定傳送是否可復原的交易邊界。

## 核心模型

新的領域應位於內部核心命名空間下，例如 `src/channels/message/*`。

它有四個概念：

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` 擁有入站生命週期。

`send` 擁有外送生命週期。

`live` 擁有預覽、編輯、進度與串流狀態。

`state` 擁有持久意圖儲存、收據、冪等性、復原、鎖定與去重。

## 訊息術語

### 訊息

正規化訊息是平台中立的：

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

### 目標

目標描述訊息所在的位置：

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

### 關係

回覆是一種關係，不是 API 根節點：

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

這讓同一條傳送路徑能處理一般回覆、cron 通知、核准提示、任務完成、訊息工具傳送、CLI 或 Control UI 傳送、子代理結果，以及自動化傳送。

### 來源

來源描述誰產生了訊息，以及 OpenClaw 應如何處理該訊息的回音。它與關係分離：訊息可以是對使用者的回覆，同時仍是 OpenClaw 來源的操作性輸出。

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

核心擁有 OpenClaw 來源輸出的意義。通道擁有如何將該來源編碼到其傳輸中的方式。

第一個必要用途是 Gateway 失敗輸出。人類仍應看到像是「代理在回覆前失敗」或「缺少 API 金鑰」這類訊息，但已標記的 OpenClaw 操作性輸出，在 `allowBots` 啟用時，不得在共用房間中被接受為 bot 撰寫的輸入。

### 收據

收據是一級概念：

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

收據是從持久意圖通往未來編輯、刪除、預覽最終化、重複抑制與復原的橋梁。

收據可以描述一則平台訊息或多部分遞送。分塊文字、媒體加文字、語音加文字，以及卡片後援，都必須保留所有平台 ID，同時仍公開一個主要 ID 供串接與後續編輯使用。

## 接收情境

接收不應是裸露的輔助呼叫。核心需要一個知道去重、路由、工作階段記錄與平台確認策略的情境。

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

確認不是單一事物。接收合約必須將這些訊號分開：

- **傳輸確認：** 告訴平台 Webhook 或 socket，OpenClaw 已接受事件封包。有些平台要求在分派前完成此動作。
- **輪詢位移確認：** 推進游標，讓同一事件不會再次被擷取。這不得推進到無法復原的工作之後。
- **入站記錄確認：** 確認 OpenClaw 已持久化足夠的入站中繼資料，可對重新遞送進行去重與路由。
- **使用者可見收據：** 選用的已讀/狀態/輸入中行為；絕不是持久性邊界。

`ReceiveAckPolicy` 只控制傳輸或輪詢確認。它不得被重用於已讀收據或狀態反應。

在 bot 授權之前，當通道能解碼訊息來源中繼資料時，接收必須套用共用的 OpenClaw 回音策略：

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

此丟棄是基於標記，而不是基於文字。具有相同可見 Gateway 失敗文字、但沒有 OpenClaw 來源中繼資料的 bot 撰寫房間訊息，仍會通過一般的 `allowBots` 授權。

確認策略是明確的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 輪詢現在使用接收情境確認策略作為其持久化的重新啟動浮水印。追蹤器仍會在 grammY 更新進入中介軟體鏈時觀察它們，但 OpenClaw 只會在成功分派後持久化安全的已完成更新 ID，讓失敗或較低的待處理更新能在重新啟動後重播。Telegram 上游 `getUpdates` 擷取位移仍由輪詢函式庫控制，因此如果我們需要超出 OpenClaw 重新啟動浮水印的平台層級重新遞送，剩下的更深層改動是完整持久的輪詢來源。Webhook 平台可能需要立即 HTTP 確認，但它們仍需要入站去重與持久外送傳送意圖，因為 Webhook 可能重新遞送。

## 傳送情境

傳送也以情境為基礎：

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

偏好的編排方式：

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

此輔助工具會展開為：

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

intent 必須在傳輸 I/O 之前存在。在 begin 之後、commit 之前重新啟動是可復原的。

危險的邊界是在平台成功之後、receipt commit 之前。如果程序在此處死亡，除非 adapter 提供原生冪等性或 receipt 對帳路徑，否則 OpenClaw 無法知道平台訊息是否存在。這些嘗試必須以 `unknown_after_send` 恢復，而不是盲目重放。沒有對帳能力的 Channels 只有在重複可見訊息對該 channel 與關係而言是可接受且已文件化的取捨時，才可以選擇至少一次重放。目前的 SDK 對帳橋接要求 adapter 宣告 `reconcileUnknownSend`，接著要求 `durableFinal.reconcileUnknownSend` 將未知項目分類為 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允許重放，而未解決的項目會保持終止狀態，或只重試對帳檢查。

耐久性策略必須明確：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示 core 在無法寫入 durable intent 時必須封閉式失敗。`best_effort` 可在持久化不可用時繼續往下執行。`disabled` 保留舊的直接傳送行為。在遷移期間，舊版 wrappers 與公開相容性 helpers 預設為 `disabled`；它們不得因為某個 channel 有通用 outbound adapter，就推斷為 `required`。

Send contexts 也擁有 channel-local 的傳送後效果。如果 durable delivery 繞過了先前附加到 channel 直接傳送路徑的本地行為，該遷移就不安全。範例包括 self-echo suppression caches、thread participation markers、native edit anchors、model-signature rendering，以及平台特定的 duplicate guards。這些效果必須先移入 send adapter、render adapter，或具名的 send-context hook，該 channel 才能啟用 durable generic final delivery。

Send helpers 必須一路將 receipts 回傳給其呼叫者。Durable wrappers 不能吞掉 message ids，也不能用 `undefined` 取代 channel delivery result；buffered dispatchers 會使用這些 ids 作為 thread anchors、後續 edits、preview finalization，以及 duplicate suppression。

Fallback sends 是以 batches 運作，而不是單一 payload。Silent-reply rewrites、media fallback、card fallback，以及 chunk projection 都可能產生超過一則可投遞訊息，因此 send context 必須投遞整個 projected batch，或明確記錄為何只有一個 payload 有效。

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

當這類 fallback 具備 durable 特性時，整個 projected batch 必須由一個 durable send intent 或另一個 atomic batch plan 表示。逐一記錄每個 payload 並不足夠：payload 之間的崩潰可能留下部分可見的 fallback，卻沒有剩餘 payload 的 durable record。復原時必須知道哪些 units 已經有 receipts，並且只重放缺少的 units，或將 batch 標記為 `unknown_after_send`，直到 adapter 完成對帳。

## 即時 Context

Preview、edit、progress 與 stream 行為應該是一個選擇加入的 lifecycle。

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

Live state 的耐久性足以復原或抑制重複：

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

這應該涵蓋目前行為：

- Telegram send 加 edit preview，並在 preview age 過舊後使用 fresh final。
- Discord send 加 edit preview，並在 media/error/explicit reply 時 cancel。
- Slack native stream 或 draft preview，取決於 thread shape。
- Mattermost draft post finalization。
- Matrix draft event finalization，或在不匹配時 redaction。
- Teams native progress stream。
- QQ Bot stream 或累積的 fallback。

## Adapter Surface

公開 SDK 目標應是一個 subpath：

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

目標形狀：

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

Send adapter：

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

Receive adapter：

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

在 preflight authorization 之前，只要 `origin.decode` 回傳 OpenClaw-origin metadata，core 就必須執行共用的 OpenClaw echo predicate。receive adapter 會提供平台事實，例如 bot author 與 room shape；core 擁有 drop decision 與 ordering，因此 channels 不會重新實作 text filters。

Origin adapter：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core 會設定 `MessageOrigin`。Channels 只負責在其與原生 transport metadata 之間轉換。Slack 會將它映射到 `chat.postMessage({ metadata })` 與 inbound `message.metadata`；Matrix 可將它映射到額外的 event content；沒有原生 metadata 的 channels，可在 receipt/outbound registry 是最佳可用近似方案時使用它。

Capabilities：

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

## 公開 SDK 簡化

新的公開 surface 應吸收或棄用這些概念區域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` 的多數公開用途
- 臨時的 draft stream lifecycle helpers

Compatibility subpaths 可以作為 wrappers 保留，但新的第三方 Plugin 不應需要它們。

Bundled plugins 可在遷移期間透過保留的 runtime subpaths 保留內部 helper imports。公開文件應在 `plugin-sdk/channel-message` 存在後，引導 Plugin 作者使用它。

## 與 Channel Turn 的關係

`runtime.channel.turn.*` 應在遷移期間保留。

它應成為 compatibility adapter：

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` 最初也應保留：

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

所有 bundled plugins 與已知第三方相容性路徑都完成橋接後，`channel.turn` 可以被棄用。在有已發布的 SDK migration path 與 contract tests 證明舊 Plugin 仍可運作，或會以清楚的 version error 失敗之前，不應移除它。

## 相容性 Guardrails

在遷移期間，對於任何既有 delivery callback 在「send this payload」之外還有 side effects 的 channel，generic durable delivery 都必須選擇加入。

Legacy entry points 預設為非 durable：

- `channel.turn.run` 與 `dispatchAssembledChannelTurn` 會使用 channel 的 delivery callback，除非該 channel 明確提供經稽核的 durable policy/options object。
- `channel.turn.runPrepared` 會維持 channel-owned，直到 prepared dispatcher 明確呼叫 send context。
- 公開相容性 helpers，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 與 direct-DM helpers，在 caller-provided `deliver` 或 `reply` callback 之前，絕不注入 generic durable delivery。

對於 migration bridge types，`durable: undefined` 表示「not durable」。durable path 只有在明確的 policy/options value 下才會啟用。`durable:
false` 可以保留作為 compatibility spelling，但實作不應要求每個未遷移的 channel 都加入它。

目前的 bridge code 必須保持 durability decision 明確：

- 持久化最終交付會傳回可辨識聯集狀態。`handled_visible` 和
  `handled_no_send` 是終止狀態；`unsupported` 和 `not_applicable` 可能會
  回退到通道擁有的交付；`failed` 會傳播傳送失敗。
- 通用持久化最終交付受配接器能力控管，例如靜默交付、回覆目標保留、原生引用保留，以及
  訊息傳送掛鉤。缺少同等行為時，應選擇通道擁有的交付，
  而不是會改變使用者可見行為的通用傳送。
- 由佇列支援的持久化傳送會公開交付意圖參照。現有的
  `pendingFinalDelivery*` 工作階段欄位可以在轉換期間承載意圖 id；
  最終狀態是 `MessageSendIntent` 儲存區，而不是凍結的
  回覆文字加上臨時情境欄位。

在以下全部條件都成立之前，不要為通道啟用通用持久化路徑：

- 通用傳送配接器執行與舊直接路徑相同的渲染與傳輸行為。
- 本機傳送後副作用會透過傳送情境保留。
- 配接器會傳回包含所有平台訊息 id 的收據或交付結果。
- 已準備的分派器路徑要麼呼叫新的傳送情境，要麼維持記錄為不在持久化保證範圍內。
- 回退交付會處理每個投影後的酬載，而不只是第一個。
- 持久化回退交付會將整個投影後酬載陣列記錄為一個可重播意圖或批次計畫。

需要保留的具體遷移風險：

- iMessage 監控器交付會在成功傳送後，於回音快取中記錄已傳送訊息。持久化最終傳送仍必須填入該快取，否則
  OpenClaw 可能會將自己的最終回覆重新擷取為傳入使用者訊息。
- Tlon 會附加選用的模型簽名，並在群組回覆後記錄參與過的執行緒。通用持久化交付不得繞過這些效果；
  要麼將它們移入 Tlon 渲染、傳送、完成配接器，要麼讓 Tlon 繼續使用通道擁有的路徑。
- Discord 和其他已準備的分派器已經擁有直接交付與預覽行為。在它們的已準備分派器明確將最終訊息透過傳送情境路由之前，
  它們不受組裝回合的持久化保證涵蓋。
- Telegram 靜默回退交付必須交付完整的投影後酬載陣列。單一酬載捷徑可能會在投影後丟棄其他回退酬載。
- LINE、BlueBubbles、Zalo、Nostr，以及其他現有的組裝或輔助路徑，可能有回覆權杖處理、媒體代理、已傳送訊息快取、載入或狀態清理，
  或僅限回呼的目標。在這些語意由傳送配接器表示並經測試驗證之前，它們會維持使用通道擁有的交付。
- Direct-DM 輔助工具可能有一個回覆回呼，而那是唯一正確的傳輸目標。通用傳出不得從 `OriginatingTo` 或 `To` 猜測並跳過該回呼。
- OpenClaw Gateway 失敗輸出必須對人類保持可見，但帶有標記且由機器人撰寫的聊天室回音必須在 `allowBots` 授權之前丟棄。
  通道不得使用可見文字前綴篩選器來實作此行為，除非作為短期緊急權宜措施；持久化合約是結構化來源中繼資料。

## 內部儲存

持久化佇列應儲存訊息傳送意圖，而不是回覆酬載。

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

復原迴圈：

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

佇列應保留足夠的身分資訊，以便在重新啟動後透過相同的帳號、執行緒、目標、格式化政策和媒體規則重播。

## 失敗類別

通道配接器會將傳輸失敗分類為封閉類別：

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

核心政策：

- 重試 `transient` 和 `rate_limit`。
- 不要重試 `invalid_payload`，除非存在渲染回退。
- 在設定變更之前，不要重試 `auth` 或 `permission`。
- 對於 `not_found`，當通道宣告安全時，允許即時完成從編輯回退到全新傳送。
- 對於 `conflict`，使用收據與等冪規則決定訊息是否已經存在。
- 在配接器可能已完成平台 I/O 之後、但在收據提交之前發生的任何錯誤，都會變成 `unknown_after_send`，除非配接器能證明平台操作未發生。

## 通道對應

| Channel                  | 目標遷移                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | 接收 ack 政策以及持久化最終傳送。即時配接器負責傳送加上編輯預覽、過期預覽的最終傳送、主題、引用回覆預覽略過、媒體備援，以及 retry-after 處理。                                                                                                                                                                   |
| Discord                  | 傳送配接器包裝現有的持久化酬載遞送。即時配接器負責草稿編輯、進度草稿、媒體/錯誤預覽取消、回覆目標保留，以及訊息 ID 收據。稽核共用房間中由 bot 撰寫的 gateway-failure 回聲；如果 Discord 無法在一般訊息上承載來源中繼資料，請使用出站登錄表或其他原生等效機制。 |
| Slack                    | 傳送配接器處理一般聊天貼文。即時配接器在執行緒形態支援時選擇原生串流，否則使用草稿預覽。收據保留執行緒時間戳記。來源配接器會將 OpenClaw gateway 失敗對應到 Slack `chat.postMessage.metadata`，並在 `allowBots` 授權之前丟棄已標記的 bot 房間回聲。                                  |
| WhatsApp                 | 傳送配接器負責文字/媒體傳送與持久化最終意圖。接收配接器處理群組提及與傳送者身分。即時配接器可維持不存在，直到 WhatsApp 具備可編輯的傳輸機制。                                                                                                                                                                        |
| Matrix                   | 即時配接器負責草稿事件編輯、最終化、刪除、加密媒體限制，以及回覆目標不相符備援。接收配接器負責加密事件補水與去重。來源配接器應將 OpenClaw gateway-failure 來源編碼進 Matrix 事件內容，並在 `allowBots` 處理之前丟棄已設定 bot 的房間回聲。              |
| Mattermost               | 即時配接器負責單一草稿貼文、進度/工具摺疊、原地最終化，以及全新傳送備援。                                                                                                                                                                                                                                                       |
| Microsoft Teams          | 即時配接器負責原生進度與區塊串流行為。傳送配接器負責活動以及附件/卡片收據。                                                                                                                                                                                                                                        |
| Feishu                   | 呈現配接器負責文字/卡片/原始呈現。即時配接器負責串流卡片與重複最終訊息抑制。傳送配接器負責留言、主題工作階段、媒體，以及語音抑制。                                                                                                                                                                      |
| QQ Bot                   | 即時配接器負責 C2C 串流、累加器逾時，以及備援最終傳送。呈現配接器負責媒體標籤與文字轉語音。                                                                                                                                                                                                                               |
| Signal                   | 簡單接收加傳送配接器。除非 signal-cli 增加可靠的編輯支援，否則不需要即時配接器。                                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | 簡單接收加傳送配接器。iMessage 傳送必須在持久化最終訊息可繞過監視器遞送之前，保留監視器回聲快取填入。BlueBubbles 專屬的輸入狀態、反應與附件仍作為配接器能力保留。                                                                                                                            |
| Google Chat              | 簡單接收加傳送配接器，將執行緒關係對應到空間與執行緒 ID。稽核 `allowBots=true` 房間中已標記的 OpenClaw gateway-failure 回聲行為。                                                                                                                                                                                        |
| LINE                     | 簡單接收加傳送配接器，將回覆 token 限制作為目標/關係能力建模。                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | SDK 接收橋接加傳送配接器。                                                                                                                                                                                                                                                                                                                          |
| IRC                      | 簡單接收加傳送配接器，沒有持久化編輯收據。                                                                                                                                                                                                                                                                                                    |
| Nostr                    | 加密 DM 的接收加傳送配接器；收據是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel               | 用於接收、傳送、即時、重試與復原行為的合約測試配接器。                                                                                                                                                                                                                                                                                   |
| Synology Chat            | 簡單接收加傳送配接器。                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | 在啟用通用持久化最終遞送之前，傳送配接器必須保留模型簽章呈現與已參與執行緒追蹤。                                                                                                                                                                                                                        |
| Twitch                   | 簡單接收加傳送配接器，具備速率限制分類。                                                                                                                                                                                                                                                                                               |
| Zalo                     | 簡單接收加傳送配接器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | 簡單接收加傳送配接器。                                                                                                                                                                                                                                                                                                                              |

## 遷移計畫

### 第 1 階段：內部訊息領域

- 新增 `src/channels/message/*` 型別，用於訊息、目標、關係、
  來源、收據、能力、持久化意圖、接收情境、傳送
  情境、即時情境，以及失敗類別。
- 將 `origin?: MessageOrigin` 新增到目前回覆遞送使用的遷移橋接酬載型別，
  然後在重構取代回覆酬載時，將該欄位移到 `ChannelMessage` 與已呈現
  訊息型別。
- 在配接器與測試證明形狀之前，先維持為內部使用。
- 為狀態轉換與序列化新增純單元測試。

### 第 2 階段：持久化傳送核心

- 將現有出站佇列從回覆酬載持久化移到持久化
  訊息傳送意圖。
- 讓持久化傳送意圖承載投影酬載陣列或批次計畫，而不只是
  單一回覆酬載。
- 透過相容性轉換保留目前的佇列復原行為。
- 讓 `deliverOutboundPayloads` 呼叫 `messages.send`。
- 在配接器宣告重播安全之後，於新的訊息生命週期中預設使用最終傳送持久化，並在無法寫入持久化意圖時封閉失敗。既有 channel-turn 與 SDK 相容路徑在此階段預設仍為直接傳送。
- 一致地記錄收據。
- 將收據與遞送結果傳回原始 dispatcher 呼叫者，而不是將持久化傳送視為終端副作用。
- 透過持久化傳送意圖保留訊息來源，使復原、重播與分塊傳送保留 OpenClaw 營運來源。

### 第 3 階段：Channel Turn 橋接

- 在 `messages.receive` 與 `messages.send` 之上重新實作
  `channel.turn.run` 與 `dispatchAssembledChannelTurn`。
- 維持目前的 fact 型別穩定。
- 預設保留舊有行為。只有在配接器以重播安全的持久化政策明確選擇加入時，assembled-turn channel 才會變成持久化。
- 將 `durable: false` 保留為相容性逃生口，用於會最終化原生編輯且尚無法安全重播的路徑，但不要依賴 `false` 標記來保護尚未遷移的 channel。
- 只有在新的訊息生命週期中，且 channel 對應證明通用傳送路徑會保留舊有 channel 遞送語意之後，才預設啟用 assembled-turn 持久化。

### 第 4 階段：Prepared Dispatcher 橋接

- 以傳送情境橋接取代 `deliverDurableInboundReplyPayload`。
- 保留舊輔助函式作為包裝器。
- 先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因為
  它們已有 durable-final 工作或較簡單的傳送路徑。
- 將每個已準備好的分派器視為未涵蓋，直到它明確選擇加入
  傳送情境。文件和變更日誌項目必須寫「組裝後的
  channel turns」，或指名已遷移的 channel 路徑，而不是宣稱所有
  automatic final replies。
- 保持 `recordInboundSessionAndDispatchReply`、直接 DM 輔助函式，以及類似的
  public compatibility helpers 行為不變。它們之後可以公開明確的
  傳送情境選擇加入，但不得在呼叫者擁有的 delivery callback 之前
  自動嘗試通用 durable delivery。

### 階段 5：統一的即時生命週期

- 建立 `messages.live`，並包含兩個 proof adapters：
  - Telegram 用於傳送、編輯，以及過期 final send。
  - Matrix 用於 draft finalization 和 redaction fallback。
- 接著遷移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每個 channel 都有 parity tests 之後，才刪除重複的 preview finalization 程式碼。

### 階段 6：公開 SDK

- 新增 `openclaw/plugin-sdk/channel-message`。
- 將其記錄為偏好的 channel Plugin API。
- 更新套件 exports、entrypoint inventory、generated API baselines，以及
  Plugin SDK 文件。
- 在 channel-message SDK 介面中包含 `MessageOrigin`、origin encode/decode hooks，以及共用的
  `shouldDropOpenClawEcho` predicate。
- 保留舊 subpaths 的 compatibility wrappers。
- 在內建 Plugin 遷移後，於文件中將 reply-named SDK helpers 標示為 deprecated。

### 階段 7：所有傳送者

將所有非回覆的 outbound producers 移到 `messages.send`：

- cron 和 heartbeat notifications
- task completions
- hook results
- approval prompts 和 approval results
- message tool sends
- subagent completion announcements
- explicit CLI 或 Control UI sends
- automation/broadcast paths

這裡是模型不再只是「agent replies」，而是成為「OpenClaw sends
messages」的地方。

### 階段 8：棄用 Turn

- 至少在一個相容性窗口內，保留 `channel.turn` 作為包裝器。
- 發布 migration notes。
- 針對舊 imports 執行 Plugin SDK compatibility tests。
- 只有在沒有內建 Plugin 需要舊 internal helpers，
  且第三方 contracts 已有穩定替代方案後，才移除或隱藏它們。

## 測試計畫

單元測試：

- Durable send intent serialization 和 recovery。
- Idempotency key reuse 和 duplicate suppression。
- Receipt commit 和 replay skip。
- `unknown_after_send` recovery，當 adapter 支援 reconciliation 時，會在 replay 前先 reconcile。
- Failure classification policy。
- Receive ack policy sequencing。
- Reply、followup、system 和 broadcast sends 的 relation mapping。
- Gateway-failure origin factory 和 `shouldDropOpenClawEcho` predicate。
- Origin preservation，涵蓋 payload normalization、chunking、durable queue
  serialization 和 recovery。

整合測試：

- `channel.turn.run` simple adapter 仍會記錄並傳送。
- Legacy assembled-turn delivery 不會變成 durable，除非 channel
  明確選擇加入。
- `channel.turn.runPrepared` bridge 仍會記錄並完成 finalization。
- Public compatibility helpers 預設呼叫呼叫者擁有的 delivery callbacks，
  且不會在那些 callbacks 前執行 generic-send。
- Durable fallback delivery 會在重新啟動後 replay 整個 projected payload array，
  且不會在早期 crash 後讓後續 payloads 未被記錄。
- Durable assembled-turn delivery 會將 platform message ids 回傳給 buffered
  dispatcher。
- Custom delivery hooks 在 durable delivery 停用或不可用時，仍會回傳 platform message ids。
- Final reply 可在 assistant completion 與 platform send 之間重新啟動後保留。
- Preview draft 在允許時會原地 finalizes。
- Preview draft 會在 media/error/reply-target mismatch 需要 normal delivery 時
  被取消或 redacted。
- Block streaming 和 preview streaming 不會同時傳遞相同文字。
- 早期串流的 Media 不會在 final delivery 中重複。

Channel 測試：

- Telegram topic reply，其 polling ack 會延遲到 receive context 的 safe
  completed watermark。
- Telegram polling recovery 針對 accepted-but-not-delivered updates，由
  persisted safe-completed offset model 涵蓋。
- Telegram stale preview 會傳送 fresh final 並清理 preview。
- Telegram silent fallback 會傳送每個 projected fallback payload。
- Telegram silent fallback durability 會 atomically 記錄完整 projected fallback array，
  而不是每次 loop iteration 一個 single-payload durable intent。
- Discord preview 會在 media/error/explicit reply 時取消。
- Discord prepared dispatcher finals 在文件或變更日誌宣稱 Discord final-reply durability 前，
  會先透過 send context 路由。
- iMessage durable final sends 會填入 monitor sent-message echo cache。
- LINE、BlueBubbles、Zalo 和 Nostr legacy delivery paths 不會在其 adapter parity tests 存在前
  被 generic durable send 繞過。
- Direct-DM/Nostr callback delivery 仍然是 authoritative，除非明確遷移到完整的 message target
  和 replay-safe send adapter。
- Slack 標記的 OpenClaw gateway failure messages 會維持 visible outbound，標記的
  bot-room echoes 會在 `allowBots` 前丟棄，而具有相同 visible text 的未標記 bot messages
  仍會遵循一般 bot authorization。
- Slack native stream fallback 到 top-level DMs 中的 draft preview。
- Matrix preview finalization 和 redaction fallback。
- Matrix 來自 configured bot accounts 的標記 OpenClaw gateway-failure room echoes，
  會在 `allowBots` handling 前丟棄。
- Discord 和 Google Chat shared-room gateway-failure cascade audits 在宣稱那裡有
  generic protection 前，會涵蓋 `allowBots` modes。
- Mattermost draft finalization 和 fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final sends 會保留 model-signature rendering 和 participated
  thread tracking。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal simple durable final
  sends。

驗證：

- 開發期間使用目標 Vitest files。
- 在 Testbox 中針對完整 changed surface 執行 `pnpm check:changed`。
- 在 landing 完整 refactor 前，或 public SDK/export 變更後，
  在 Testbox 中執行更廣泛的 `pnpm check`。
- 在移除 compatibility wrappers 前，針對至少一個 edit-capable channel 和一個
  simple send-only channel 執行 live 或 qa-channel smoke。

## 未決問題

- Telegram 最終是否應以完全 durable polling source 取代 grammY runner source，
  使其能控制 platform-level redelivery，而不只是 OpenClaw 的 persisted restart watermark。
- Durable live preview state 應儲存在與 final send intent 相同的 queue record，
  還是 sibling live-state store。
- `plugin-sdk/channel-message` 發布後，compatibility wrappers 應在文件中保留多久。
- 第三方 Plugin 是否應直接實作 receive adapters，或只透過
  `defineChannelMessageAdapter` 提供 normalize/send/live hooks。
- 哪些 receipt fields 可以安全地公開在 public SDK，而不是 internal runtime
  state。
- self-echo caches 和 participated-thread markers 之類的 side effects，
  應建模為 send-context hooks、adapter-owned finalize steps，還是
  receipt subscribers。
- 哪些 channels 有 native origin metadata，哪些需要 persisted outbound
  registries，以及哪些無法提供可靠的 cross-bot echo suppression。

## 驗收條件

- 每個內建 message channel 都會透過 `messages.send` 傳送 final visible output。
- 每個 inbound message channel 都會透過 `messages.receive` 或 documented compatibility wrapper 進入。
- 每個 preview/edit/stream channel 都會使用 `messages.live` 處理 draft state 和
  finalization。
- `channel.turn` 只是一個包裝器。
- Reply-named SDK helpers 是 compatibility exports，不是建議路徑。
- Durable recovery 可在重新啟動後 replay pending final sends，不會遺失
  final response，也不會重複已 committed sends；platform outcome unknown 的 sends
  會在 replay 前 reconcile，或針對該 adapter 記錄為 at-least-once。
- 當 durable intent 無法寫入時，durable final sends 會 fail closed，
  除非呼叫者明確選擇 documented non-durable mode。
- Legacy channel-turn 和 SDK compatibility helpers 預設使用 direct
  channel-owned delivery；generic durable send 只可明確選擇加入。
- Receipts 會保留 multi-part deliveries 的所有 platform message ids，
  以及供 threading/edit convenience 使用的 primary id。
- Durable wrappers 會在取代 direct delivery callbacks 前保留 channel-local side effects。
- Prepared dispatchers 不會被計為 durable，直到其 final delivery
  path 明確使用 send context。
- Fallback delivery 會處理每個 projected payload。
- Durable fallback delivery 會將每個 projected payload 記錄在一個可 replay 的
  intent 或 batch plan 中。
- OpenClaw-originated gateway failure output 對使用者可見，但標記的
  bot-authored room echoes 會在宣告支援 origin contract 的 channels 上，
  於 bot authorization 前被丟棄。
- 文件會說明 send、receive、live、state、receipts、relations、failure
  policy、migration 和 test coverage。

## 相關

- [Messages](/zh-TW/concepts/messages)
- [串流與分塊](/zh-TW/concepts/streaming)
- [進度草稿](/zh-TW/concepts/progress-drafts)
- [重試政策](/zh-TW/concepts/retry)
- [Channel turn kernel](/zh-TW/plugins/sdk-channel-turn)
