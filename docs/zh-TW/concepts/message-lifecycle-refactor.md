---
read_when:
    - 重構頻道傳送或接收行為
    - 變更頻道回合、回覆派送、傳出佇列、預覽串流，或 Plugin SDK 訊息 API
    - 設計需要持久化傳送、回執、預覽、編輯或重試的新通道 Plugin
summary: 統一的持久化訊息接收、傳送、預覽、編輯與串流生命週期設計計畫
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-05-06T09:06:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此頁是目標設計，用於以單一、耐久的訊息生命週期，取代分散的頻道回合、回覆分派、預覽串流和對外傳遞輔助工具。

簡短版本：

- 核心基元應該是 **接收** 和 **傳送**，而不是 **回覆**。
- 回覆只是對外訊息上的一種關聯。
- 回合是處理入站內容的便利機制，不是傳遞的擁有者。
- 傳送必須以情境為基礎：`begin`、算繪、預覽或串流、最終傳送、提交、失敗。
- 接收也必須以情境為基礎：正規化、去重、路由、記錄、分派、平台 ack、失敗。
- 公開 Plugin SDK 應收斂為一個小型的頻道訊息介面。

## 問題

目前的頻道堆疊是從幾個有效的局部需求成長而來：

- 簡單的入站配接器使用 `runtime.channel.turn.run`。
- 豐富的配接器使用 `runtime.channel.turn.runPrepared`。
- 舊版輔助工具使用 `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、回覆酬載輔助工具、回覆分塊、回覆參照，以及對外執行階段輔助工具。
- 預覽串流存在於特定頻道的分派器中。
- 最終傳遞耐久性正圍繞既有回覆酬載路徑加入。

這種形狀修復了局部錯誤，但也讓 OpenClaw 擁有太多公開概念，且有太多地方可能讓傳遞語義漂移。

暴露此問題的可靠性案例是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標不變式比 Telegram 更廣：一旦核心決定某個可見的對外訊息應該存在，該意圖就必須在嘗試平台傳送之前變成耐久狀態，而平台收據必須在成功後提交。這讓 OpenClaw 具備至少一次復原能力。只有能證明原生冪等性，或能在重播前針對平台狀態協調一次「傳送後未知」嘗試的配接器，才具備恰好一次行為。

這是此重構的最終狀態，不是對每一條現行路徑的描述。在遷移期間，既有對外輔助工具在最佳努力佇列寫入失敗時，仍可退回直接傳送。只有當耐久最終傳送採取失敗關閉，或以文件化的非耐久政策明確選擇退出時，此重構才算完成。

## 目標

- 所有頻道訊息接收與傳送路徑共用一個核心生命週期。
- 在配接器宣告可安全重播行為後，新訊息生命週期中的最終傳送預設具備耐久性。
- 共用預覽、編輯、串流、最終化、重試、復原與收據語義。
- 一個小型 Plugin SDK 介面，讓第三方 Plugin 能學習與維護。
- 遷移期間相容既有 `channel.turn` 呼叫者。
- 為新的頻道能力提供清楚的擴充點。
- 核心中沒有平台特定分支。
- 沒有 token-delta 頻道訊息。頻道串流仍然是訊息預覽、編輯、附加或已完成區塊傳遞。
- 為操作性／系統輸出提供結構化的 OpenClaw 來源中繼資料，讓可見的 Gateway 失敗不會在共用且啟用機器人的聊天室中重新進入為新的提示。

## 非目標

- 不在第一階段移除 `runtime.channel.turn.*`。
- 不強迫每個頻道採用相同的原生傳輸行為。
- 不讓核心了解 Telegram 主題、Slack 原生串流、Matrix 刪除、Feishu 卡片、QQ 語音或 Teams 活動。
- 不將所有內部遷移輔助工具發布為穩定 SDK API。
- 不讓重試重播已完成且非冪等的平台操作。

## 參考模型

Vercel Chat 有一個良好的公開心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 配接器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping` 和歷史擷取
- 用於去重、鎖定、佇列與持久化的狀態配接器

OpenClaw 應借用其詞彙，而不是複製其介面。

OpenClaw 在該模型之外還需要：

- 在直接傳輸呼叫前建立耐久的對外傳送意圖。
- 具備開始、提交與失敗的明確傳送情境。
- 知道平台 ack 政策的接收情境。
- 能在重新啟動後存續，並驅動編輯、刪除、復原與重複抑制的收據。
- 更小的公開 SDK。隨附 Plugin 可以使用內部執行階段輔助工具，但第三方 Plugin 應看到一個一致的訊息 API。
- 代理程式特定行為：工作階段、轉錄、區塊串流、工具進度、核准、媒體指令、靜默回覆，以及群組提及歷史。

`thread.post()` 風格的 promise 對 OpenClaw 而言並不足夠。它們隱藏了決定傳送是否可復原的交易邊界。

## 核心模型

新領域應位於內部核心命名空間之下，例如 `src/channels/message/*`。

它有四個概念：

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` 擁有入站生命週期。

`send` 擁有對外生命週期。

`live` 擁有預覽、編輯、進度與串流狀態。

`state` 擁有耐久意圖儲存、收據、冪等性、復原、鎖定與去重。

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

### 關聯

回覆是一種關聯，不是 API 根：

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

這讓同一條傳送路徑能處理一般回覆、Cron 通知、核准提示、任務完成、訊息工具傳送、CLI 或控制 UI 傳送、子代理程式結果，以及自動化傳送。

### 來源

來源描述誰產生了一則訊息，以及 OpenClaw 應如何處理該訊息的回音。它與關聯分離：訊息可以是對使用者的回覆，同時仍然是 OpenClaw 來源的操作性輸出。

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

核心擁有 OpenClaw 來源輸出的意義。頻道擁有該來源如何編碼到其傳輸中的方式。

第一個必要用途是 Gateway 失敗輸出。人類仍應看到例如「代理程式在回覆前失敗」或「缺少 API 金鑰」之類的訊息，但帶有標記的 OpenClaw 操作性輸出，在 `allowBots` 啟用時，不得於共用聊天室中被接受為機器人撰寫的輸入。

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

收據是從耐久意圖通往未來編輯、刪除、預覽最終化、重複抑制與復原的橋梁。

收據可以描述一則平台訊息或一次多部分傳遞。分塊文字、媒體加文字、語音加文字，以及卡片後援，都必須保留所有平台 ID，同時仍公開一個主要 ID 以供串接對話串與後續編輯。

## 接收情境

接收不應是單純的輔助呼叫。核心需要一個了解去重、路由、工作階段記錄與平台 ack 政策的情境。

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

Ack 不是單一事物。接收合約必須將這些訊號分開：

- **傳輸 ack：** 告訴平台 Webhook 或 socket，OpenClaw 已接受事件封套。某些平台要求在分派前完成此動作。
- **輪詢位移 ack：** 推進游標，讓同一事件不會再次被擷取。這不得推進到無法復原的工作之後。
- **入站記錄 ack：** 確認 OpenClaw 已持久化足夠的入站中繼資料，以便對重新傳遞進行去重與路由。
- **使用者可見收據：** 選用的已讀／狀態／輸入中行為；絕不是耐久性邊界。

`ReceiveAckPolicy` 只控制傳輸或輪詢確認。不得將它重用於已讀收據或狀態反應。

在機器人授權之前，當頻道能解碼訊息來源中繼資料時，接收必須套用共用的 OpenClaw 回音政策：

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

此丟棄是以標記為基礎，而不是以文字為基礎。具有相同可見 Gateway 失敗文字、但沒有 OpenClaw 來源中繼資料的機器人撰寫聊天室訊息，仍會通過一般 `allowBots` 授權。

Ack 政策是明確的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 輪詢現在使用接收情境 ack 政策來處理其持久化重新啟動水位。追蹤器仍會在 grammY 更新進入中介軟體鏈時觀察它們，但 OpenClaw 只會在成功分派後持久化安全完成的更新 ID，讓失敗或較低的待處理更新能在重新啟動後重播。Telegram 上游 `getUpdates` 擷取位移仍由輪詢程式庫控制，因此若我們需要超出 OpenClaw 重新啟動水位的平台層級重新傳遞，剩餘更深入的改動是完整耐久的輪詢來源。Webhook 平台可能需要立即 HTTP ack，但它們仍需要入站去重與耐久對外傳送意圖，因為 Webhook 可能重新傳遞。

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

建議的協調流程：

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

這個輔助工具會展開為：

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

意圖必須在傳輸 I/O 之前存在。在開始之後、提交之前重新啟動是可復原的。

危險邊界是在平台成功之後、收據提交之前。如果程序在該處終止，除非配接器提供原生冪等性或收據對帳路徑，否則 OpenClaw 無法知道平台訊息是否存在。這些嘗試必須以 `unknown_after_send` 繼續，而不是盲目重播。沒有對帳能力的通道，只有在重複可見訊息對該通道與關係而言是可接受且已文件化的取捨時，才可以選擇至少一次重播。目前的 SDK 對帳橋接要求配接器宣告 `reconcileUnknownSend`，然後要求 `durableFinal.reconcileUnknownSend` 將未知項目分類為 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允許重播，而未解決項目會保持終止狀態，或只重試對帳檢查。

耐久性政策必須明確：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示核心在無法寫入耐久意圖時必須以關閉方式失敗。`best_effort` 可以在持久化不可用時繼續落下。`disabled` 保留舊的直接傳送行為。遷移期間，舊版包裝器與公開相容性輔助工具預設為 `disabled`；它們不得因為某個通道有通用輸出配接器，就推斷為 `required`。

傳送情境也擁有通道本機的傳送後效果。如果耐久交付繞過先前附加在通道直接傳送路徑上的本機行為，該遷移就不安全。範例包括自我回音抑制快取、討論串參與標記、原生編輯錨點、模型簽章算繪，以及平台特定的重複防護。這些效果必須移入傳送配接器、算繪配接器，或具名的傳送情境掛鉤，該通道才能啟用耐久通用最終交付。

傳送輔助工具必須一路將收據傳回呼叫者。耐久包裝器不得吞掉訊息 ID，或用 `undefined` 取代通道交付結果；緩衝式分派器會使用這些 ID 作為討論串錨點、後續編輯、預覽最終化與重複抑制。

後援傳送操作的是批次，而不是單一承載。靜音回覆改寫、媒體後援、卡片後援與區塊投射都可能產生多個可交付訊息，因此傳送情境必須交付整個投射批次，或明確文件化為何只有一個承載有效。

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

當這類後援具備耐久性時，整個投射批次必須由一個耐久傳送意圖或另一個原子批次計畫表示。逐一記錄每個承載是不夠的：若在承載之間當機，可能會留下部分可見的後援，卻沒有剩餘承載的耐久記錄。復原必須知道哪些單元已經有收據，並且只重播遺失的單元，或將批次標記為 `unknown_after_send`，直到配接器完成對帳。

## 即時情境

預覽、編輯、進度與串流行為應該是一個選擇加入的生命週期。

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

即時狀態要足夠耐久，才能復原或抑制重複：

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

這應涵蓋目前行為：

- Telegram 傳送加上編輯預覽，並在預覽過舊後提供新的最終訊息。
- Discord 傳送加上編輯預覽，並在媒體、錯誤或明確回覆時取消。
- Slack 依討論串形態使用原生串流或草稿預覽。
- Mattermost 草稿貼文最終化。
- Matrix 草稿事件最終化，或在不符時修訂。
- Teams 原生進度串流。
- QQ Bot 串流或累積式後援。

## 配接器介面

公開 SDK 目標應該是一個子路徑：

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

傳送配接器：

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

接收配接器：

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

在預檢授權之前，只要 `origin.decode` 傳回 OpenClaw 來源中繼資料，核心就必須執行共用的 OpenClaw 回音述詞。接收配接器提供平台事實，例如機器人作者與房間形態；核心擁有丟棄決策與排序，因此通道不需要重新實作文字篩選器。

來源配接器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

核心會設定 `MessageOrigin`。通道只在它與原生傳輸中繼資料之間進行轉譯。Slack 將此對應到 `chat.postMessage({ metadata })` 與傳入的 `message.metadata`；Matrix 可以將其對應到額外事件內容；沒有原生中繼資料的通道，可以在這是最佳可用近似方案時使用收據／輸出登錄檔。

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

## 公開 SDK 縮減

新的公開介面應吸收或淘汰這些概念區域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` 的大多數公開用法
- 臨時草稿串流生命週期輔助工具

相容性子路徑可以保留為包裝器，但新的第三方 Plugin 不應該需要它們。

Bundled plugins 可以在遷移期間透過保留的執行階段子路徑保留內部輔助工具匯入。公開文件應在 `plugin-sdk/channel-message` 存在後，引導 Plugin 作者使用它。

## 與通道回合的關係

`runtime.channel.turn.*` 應在遷移期間保留。

它應成為相容性配接器：

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` 一開始也應保留：

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

在所有 bundled plugins 與已知第三方相容性路徑都完成橋接之後，`channel.turn` 可以被淘汰。在有已發布的 SDK 遷移路徑，以及合約測試證明舊 Plugin 仍可運作或會以明確版本錯誤失敗之前，不應移除它。

## 相容性防護措施

遷移期間，對於任何既有交付回呼在「傳送此承載」之外還有副作用的通道，通用耐久交付都必須是選擇加入。

舊版進入點預設不具耐久性：

- `channel.turn.run` 與 `dispatchAssembledChannelTurn` 會使用通道的交付回呼，除非該通道明確提供已稽核的耐久政策／選項物件。
- `channel.turn.runPrepared` 會維持通道擁有，直到已準備好的分派器明確呼叫傳送情境。
- 公開相容性輔助工具，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 與直接 DM 輔助工具，在呼叫者提供的 `deliver` 或 `reply` 回呼之前，絕不注入通用耐久交付。

對於遷移橋接型別，`durable: undefined` 表示「不具耐久性」。耐久路徑只會由明確的政策／選項值啟用。`durable: false` 可以保留為相容性寫法，但實作不應要求每個尚未遷移的通道都加入它。

目前的橋接程式碼必須保持耐久性決策明確：

- 耐久最終傳遞會回傳一個可辨別聯集狀態。`handled_visible` 和
  `handled_no_send` 是終止狀態；`unsupported` 和 `not_applicable` 可能會
  回退到通道擁有的傳遞；`failed` 會傳播傳送失敗。
- 泛用耐久最終傳遞受轉接器能力控管，例如
  靜默傳遞、回覆目標保留、原生引用保留，以及
  訊息傳送掛鉤。缺少對等能力時，應選擇通道擁有的傳遞，
  而不是會改變使用者可見行為的泛用傳送。
- 由佇列支援的耐久傳送會公開傳遞意圖參照。既有的
  `pendingFinalDelivery*` 工作階段欄位可在轉換期間承載意圖 ID；
  最終狀態會是 `MessageSendIntent` 存放區，而不是凍結的
  回覆文字加上臨時情境欄位。

在下列條件全部成立之前，請勿為通道啟用泛用耐久路徑：

- 泛用傳送轉接器會執行與舊直接路徑相同的轉譯和傳輸行為。
- 本機傳送後副作用會透過傳送情境保留下來。
- 轉接器會回傳收據或傳遞結果，並包含所有平台訊息 ID。
- 已準備的分派器路徑要嘛呼叫新的傳送情境，要嘛仍記錄為不在耐久保證範圍內。
- 回退傳遞會處理每個投射後的承載，而不只是第一個。
- 耐久回退傳遞會將整個投射後承載陣列記錄為一個可重播意圖或批次計畫。

要保留的具體遷移風險：

- iMessage 監控器傳遞會在成功傳送後，將已傳送訊息記錄到回音快取中。耐久最終傳送仍必須填入該快取，否則
  OpenClaw 可能會將自己的最終回覆重新攝入為傳入的使用者訊息。
- Tlon 會附加選用的模型簽名，並在群組回覆後記錄已參與的執行緒。泛用耐久傳遞不得略過這些效果；
  請將它們移入 Tlon 轉譯/傳送/完成轉接器，或讓 Tlon 保持在通道擁有的路徑上。
- Discord 和其他已準備的分派器已經擁有直接傳遞和預覽行為。在其已準備的分派器明確透過傳送情境路由最終訊息之前，
  它們不受組裝回合耐久保證涵蓋。
- Telegram 靜默回退傳遞必須傳遞完整的投射後承載陣列。單一承載捷徑可能會在投射後丟棄額外的回退承載。
- LINE、BlueBubbles、Zalo、Nostr，以及其他既有的組裝/輔助路徑，可能具有回覆權杖處理、媒體代理、已傳送訊息快取、載入/狀態清理，或僅限回呼的目標。在這些語意由傳送轉接器表示並經測試驗證之前，它們會保持在通道擁有的傳遞上。
- 直接 DM 輔助工具可能有一個回覆回呼，那是唯一正確的傳輸目標。泛用輸出不得從 `OriginatingTo` 或 `To` 猜測並略過該回呼。
- OpenClaw gateway 失敗輸出必須保持讓人類可見，但帶標籤的機器人撰寫房間回音必須在 `allowBots` 授權之前丟棄。
  通道不得以可見文字前綴篩選器實作此行為，除非作為短期緊急止血；耐久合約是結構化來源中繼資料。

## 內部儲存

耐久佇列應儲存訊息傳送意圖，而不是回覆承載。

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

佇列應保留足夠的身分資訊，以便在重新啟動後透過相同帳號、
執行緒、目標、格式化政策和媒體規則重播。

## 失敗類別

通道轉接器會將傳輸失敗分類為封閉類別：

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
- 除非存在轉譯回退，否則不要重試 `invalid_payload`。
- 在設定變更之前，不要重試 `auth` 或 `permission`。
- 對於 `not_found`，當通道宣告安全時，讓即時完成從編輯回退到全新傳送。
- 對於 `conflict`，使用收據/冪等規則來決定訊息是否已存在。
- 轉接器可能已完成平台 I/O 之後、但收據提交之前發生的任何錯誤，都會成為 `unknown_after_send`，除非轉接器可以證明平台操作並未發生。

## 通道對應

| 通道                     | 目標遷移                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | 接收確認政策加上持久化最終傳送。即時轉接器負責傳送加上編輯預覽、過期預覽最終傳送、主題、引用回覆預覽略過、媒體後援，以及 retry-after 處理。                                                                                                                                                                      |
| Discord                  | 傳送轉接器包裝現有的持久化承載資料交付。即時轉接器負責草稿編輯、進度草稿、媒體/錯誤預覽取消、回覆目標保留，以及訊息 ID 回條。稽核共用房間中由機器人撰寫的 Gateway 失敗回音；如果 Discord 無法在一般訊息上攜帶來源中繼資料，請使用出站登錄表或其他原生等效機制。 |
| Slack                    | 傳送轉接器處理一般聊天貼文。即時轉接器會在線程形狀支援時選擇原生串流，否則使用草稿預覽。回條會保留線程時間戳。來源轉接器會將 OpenClaw Gateway 失敗對應到 Slack `chat.postMessage.metadata`，並在 `allowBots` 授權前丟棄已標記的機器人房間回音。                                  |
| WhatsApp                 | 傳送轉接器負責文字/媒體傳送與持久化最終意圖。接收轉接器處理群組提及與寄件者身分。即時可保持不存在，直到 WhatsApp 具備可編輯的傳輸。                                                                                                                                                                      |
| Matrix                   | 即時轉接器負責草稿事件編輯、最終化、修訂刪除、加密媒體限制，以及回覆目標不相符後援。接收轉接器負責加密事件補水與去重。來源轉接器應將 OpenClaw Gateway 失敗來源編碼到 Matrix 事件內容中，並在 `allowBots` 處理前丟棄已設定機器人的房間回音。              |
| Mattermost               | 即時轉接器負責一篇草稿貼文、進度/工具摺疊、原地最終化，以及全新傳送後援。                                                                                                                                                                                                                                                       |
| Microsoft Teams          | 即時轉接器負責原生進度與區塊串流行為。傳送轉接器負責活動以及附件/卡片回條。                                                                                                                                                                                                                                        |
| Feishu                   | 算繪轉接器負責文字/卡片/原始算繪。即時轉接器負責串流卡片與重複最終抑制。傳送轉接器負責留言、主題工作階段、媒體，以及語音抑制。                                                                                                                                                                      |
| QQ Bot                   | 即時轉接器負責 C2C 串流、累加器逾時，以及後援最終傳送。算繪轉接器負責媒體標籤與文字作為語音。                                                                                                                                                                                                                               |
| Signal                   | 簡單接收加上傳送轉接器。除非 signal-cli 加入可靠的編輯支援，否則不使用即時轉接器。                                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | 簡單接收加上傳送轉接器。iMessage 傳送必須保留監視器回音快取填入，持久化最終項才能繞過監視器交付。BlueBubbles 專屬的輸入狀態、反應與附件仍維持為轉接器能力。                                                                                                                            |
| Google Chat              | 簡單接收加上傳送轉接器，並將線程關係對應到空間與線程 ID。稽核 `allowBots=true` 房間行為中已標記的 OpenClaw Gateway 失敗回音。                                                                                                                                                                                        |
| LINE                     | 簡單接收加上傳送轉接器，並將回覆權杖限制建模為目標/關係能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | SDK 接收橋接加上傳送轉接器。                                                                                                                                                                                                                                                                                                                          |
| IRC                      | 簡單接收加上傳送轉接器，沒有持久化編輯回條。                                                                                                                                                                                                                                                                                                    |
| Nostr                    | 加密私訊的接收加上傳送轉接器；回條是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel               | 接收、傳送、即時、重試與復原行為的合約測試轉接器。                                                                                                                                                                                                                                                                                   |
| Synology Chat            | 簡單接收加上傳送轉接器。                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | 傳送轉接器必須先保留模型簽章算繪與已參與線程追蹤，才能啟用一般持久化最終交付。                                                                                                                                                                                                                        |
| Twitch                   | 簡單接收加上傳送轉接器，包含速率限制分類。                                                                                                                                                                                                                                                                                               |
| Zalo                     | 簡單接收加上傳送轉接器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | 簡單接收加上傳送轉接器。                                                                                                                                                                                                                                                                                                                              |

## 遷移計畫

### 階段 1：內部訊息領域

- 新增 `src/channels/message/*` 型別，用於訊息、目標、關係、
  來源、回條、能力、持久化意圖、接收內容、傳送
  內容、即時內容，以及失敗類別。
- 將 `origin?: MessageOrigin` 新增到目前回覆交付使用的遷移橋接承載資料型別，
  接著隨著重構取代回覆承載資料，將該欄位移至 `ChannelMessage` 和算繪後的
  訊息型別。
- 保持內部使用，直到轉接器與測試證明其形狀。
- 為狀態轉換與序列化新增純單元測試。

### 階段 2：持久化傳送核心

- 將現有出站佇列從回覆承載資料持久化移至持久化
  訊息傳送意圖。
- 允許持久化傳送意圖攜帶投影承載資料陣列或批次計畫，而不只是
  一個回覆承載資料。
- 透過相容性轉換保留目前的佇列復原行為。
- 讓 `deliverOutboundPayloads` 呼叫 `messages.send`。
- 在轉接器宣告可安全重播後，將最終傳送持久化設為預設，並在新的訊息生命週期中無法寫入持久化意圖時封閉失敗。現有的通道回合與 SDK 相容性路徑在此階段預設仍維持直接傳送。
- 一致地記錄回條。
- 將回條與交付結果傳回原始分派器呼叫端，而不是將持久化傳送視為終端副作用。
- 透過持久化傳送意圖保留訊息來源，讓復原、重播與
  分塊傳送保留 OpenClaw 作業來源。

### 階段 3：通道回合橋接

- 在 `messages.receive` 和 `messages.send` 之上重新實作
  `channel.turn.run` 與 `dispatchAssembledChannelTurn`。
- 保持目前事實型別穩定。
- 預設保留舊版行為。組裝回合通道只有在其轉接器明確選擇加入具備重播安全性的持久化政策時，才會變成持久化。
- 將 `durable: false` 保留為相容性逃生口，用於已最終化原生編輯且尚無法安全重播的路徑，但不要依賴 `false` 標記來保護尚未遷移的通道。
- 只有在新的訊息生命週期中，並且通道對應證明通用傳送路徑會保留舊通道交付語意後，才預設組裝回合持久化。

### 階段 4：已準備的分派器橋接

- 將 `deliverDurableInboundReplyPayload` 替換為傳送脈絡橋接。
- 保留舊輔助函式作為包裝器。
- 先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因為
  它們已經有 durable-final 工作或較簡單的傳送路徑。
- 將每個已準備好的分派器都視為尚未涵蓋，直到它明確選擇加入
  傳送脈絡為止。文件和變更日誌項目必須說「已組裝的
  通道回合」，或點名已遷移的通道路徑，而不是宣稱所有
  自動最終回覆。
- 保持 `recordInboundSessionAndDispatchReply`、direct-DM 輔助函式和類似的
  公開相容性輔助函式行為不變。它們之後可以公開明確的
  傳送脈絡選擇加入，但不得在呼叫端擁有的傳遞回呼之前，
  自動嘗試通用持久傳遞。

### 階段 5：統一的即時生命週期

- 建置 `messages.live`，並提供兩個驗證配接器：
  - Telegram 用於傳送、編輯，以及過期最終傳送。
  - Matrix 用於草稿最終化和刪除備援。
- 然後遷移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每個通道都有同等行為測試之後，才刪除重複的預覽最終化程式碼。

### 階段 6：公開 SDK

- 新增 `openclaw/plugin-sdk/channel-message`。
- 將它記錄為偏好的通道 Plugin API。
- 更新套件匯出、進入點清單、產生的 API 基準線，以及
  Plugin SDK 文件。
- 在 channel-message SDK 介面中包含 `MessageOrigin`、來源編碼/解碼鉤子，以及共用的
  `shouldDropOpenClawEcho` 述詞。
- 保留舊子路徑的相容性包裝器。
- 在已捆綁 Plugin 遷移完成後，於文件中將以 reply 命名的 SDK 輔助函式標記為已棄用。

### 階段 7：所有傳送端

將所有非回覆的對外產生器移到 `messages.send`：

- Cron 和 Heartbeat 通知
- 任務完成
- 鉤子結果
- 核准提示和核准結果
- 訊息工具傳送
- 子代理完成公告
- 明確的 CLI 或 Control UI 傳送
- 自動化/廣播路徑

這是模型從「代理回覆」轉變為「OpenClaw 傳送
訊息」的地方。

### 階段 8：棄用 Turn

- 將 `channel.turn` 保留為包裝器，至少維持一個相容性期間。
- 發布遷移說明。
- 針對舊匯入執行 Plugin SDK 相容性測試。
- 只有在沒有已捆綁 Plugin 需要它們，且第三方合約已有穩定替代方案之後，
  才移除或隱藏舊的內部輔助函式。

## 測試計畫

單元測試：

- 持久傳送意圖序列化和復原。
- 冪等性鍵重用和重複抑制。
- 收據提交和重播略過。
- 當配接器支援協調時，`unknown_after_send` 復原會在重播前先協調。
- 失敗分類政策。
- 接收確認政策排序。
- 回覆、後續、系統和廣播傳送的關係對應。
- Gateway 失敗來源工廠和 `shouldDropOpenClawEcho` 述詞。
- 來源在承載正規化、分塊、持久佇列序列化和復原過程中保持不變。

整合測試：

- `channel.turn.run` 簡單配接器仍會記錄並傳送。
- 舊版已組裝回合傳遞不會變成持久，除非通道明確選擇加入。
- `channel.turn.runPrepared` 橋接仍會記錄並最終化。
- 公開相容性輔助函式預設會呼叫呼叫端擁有的傳遞回呼，
  且不會在這些回呼之前進行通用傳送。
- 持久備援傳遞會在重新啟動後重播整個投影承載陣列，
  且無法在早期當機後讓後續承載未被記錄。
- 持久已組裝回合傳遞會將平台訊息 ID 回傳給緩衝分派器。
- 當持久傳遞停用或不可用時，自訂傳遞鉤子仍會回傳平台訊息 ID。
- 最終回覆可在助理完成與平台傳送之間重新啟動後保留下來。
- 預覽草稿會在允許時就地最終化。
- 當媒體/錯誤/回覆目標不相符而需要正常傳遞時，預覽草稿會被取消或刪除。
- 區塊串流和預覽串流不會同時傳遞相同文字。
- 早期串流的媒體不會在最終傳遞中重複。

通道測試：

- Telegram 主題回覆搭配輪詢確認，延遲到接收脈絡的安全完成水位。
- Telegram 對已接受但未傳遞更新的輪詢復原，由持久化的安全完成偏移模型涵蓋。
- Telegram 過期預覽會傳送新的最終訊息並清理預覽。
- Telegram 靜默備援會傳送每個投影備援承載。
- Telegram 靜默備援持久性會以原子方式記錄完整投影備援陣列，
  而不是每次迴圈迭代記錄一個單一承載持久意圖。
- Discord 在媒體/錯誤/明確回覆時取消預覽。
- Discord 已準備分派器的最終訊息，在文件或變更日誌宣稱 Discord 最終回覆持久性之前，
  會先透過傳送脈絡路由。
- iMessage 持久最終傳送會填入監控器的已傳送訊息回音快取。
- LINE、BlueBubbles、Zalo 和 Nostr 舊版傳遞路徑不會被
  通用持久傳送繞過，直到它們的配接器同等行為測試存在為止。
- Direct-DM/Nostr 回呼傳遞仍具有權威性，除非已明確遷移到完整訊息目標和可安全重播的傳送配接器。
- Slack 已標記的 OpenClaw Gateway 失敗訊息保持可見對外傳送，已標記的機器人聊天室回音會在 `allowBots` 之前丟棄，而具有相同可見文字的未標記機器人訊息仍遵循一般機器人授權。
- Slack 原生串流在頂層 DM 中備援為草稿預覽。
- Matrix 預覽最終化和刪除備援。
- Matrix 來自已設定機器人帳號、已標記的 OpenClaw Gateway 失敗聊天室回音，
  會在 `allowBots` 處理前丟棄。
- Discord 和 Google Chat 共享聊天室 Gateway 失敗串聯稽核，會在宣稱該處有通用保護之前涵蓋
  `allowBots` 模式。
- Mattermost 草稿最終化和新傳送備援。
- Teams 原生進度最終化。
- Feishu 重複最終訊息抑制。
- QQ Bot 累加器逾時備援。
- Tlon 持久最終傳送會保留模型簽章算繪和已參與執行緒追蹤。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal 簡單持久最終
  傳送。

驗證：

- 開發期間的目標 Vitest 檔案。
- 在 Testbox 中針對完整變更範圍執行 `pnpm check:changed`。
- 在登陸完整重構前，或公開 SDK/匯出變更後，
  在 Testbox 中執行更廣泛的 `pnpm check`。
- 移除相容性包裝器前，至少針對一個可編輯通道和一個
  簡單僅傳送通道執行 live 或 qa-channel smoke。

## 未決問題

- Telegram 最終是否應該以完全持久的輪詢來源取代 grammY runner 來源，
  讓它能控制平台層級的重新傳遞，而不只是 OpenClaw 的持久化重新啟動水位。
- 持久即時預覽狀態應儲存在與最終傳送意圖相同的佇列記錄中，
  還是儲存在同層的即時狀態儲存區中。
- `plugin-sdk/channel-message` 發布後，相容性包裝器要在文件中保留多久。
- 第三方 Plugin 是否應直接實作接收配接器，或只透過
  `defineChannelMessageAdapter` 提供正規化/傳送/即時鉤子。
- 哪些收據欄位可安全公開於公開 SDK，哪些屬於內部執行階段狀態。
- 自我回音快取和已參與執行緒標記等副作用，應建模為傳送脈絡鉤子、
  配接器擁有的最終化步驟，還是收據訂閱者。
- 哪些通道具有原生來源中繼資料，哪些需要持久化對外登錄，
  哪些無法提供可靠的跨機器人回音抑制。

## 驗收標準

- 每個已捆綁訊息通道都透過 `messages.send` 傳送最終可見輸出。
- 每個入站訊息通道都透過 `messages.receive` 或已記錄的相容性包裝器進入。
- 每個預覽/編輯/串流通道都使用 `messages.live` 管理草稿狀態和最終化。
- `channel.turn` 只是包裝器。
- 以 reply 命名的 SDK 輔助函式是相容性匯出，不是建議路徑。
- 持久復原可以在重新啟動後重播待處理的最終傳送，而不會遺失最終回應或重複已提交的傳送；平台結果未知的傳送會在重播前協調，或針對該配接器記錄為至少一次。
- 當持久意圖無法寫入時，持久最終傳送會封閉失敗，
  除非呼叫端明確選擇了已記錄的非持久模式。
- 舊版通道回合和 SDK 相容性輔助函式預設為通道擁有的直接傳遞；通用持久傳送僅能明確選擇加入。
- 收據會保留多段傳遞的所有平台訊息 ID，以及供執行緒/編輯方便使用的主要 ID。
- 持久包裝器會在取代直接傳遞回呼之前保留通道本地副作用。
- 已準備分派器在其最終傳遞路徑明確使用傳送脈絡之前，不會被計入持久。
- 備援傳遞會處理每個投影承載。
- 持久備援傳遞會在一個可重播意圖或批次計畫中記錄每個投影承載。
- OpenClaw 來源的 Gateway 失敗輸出對人類可見，但在宣告支援來源合約的通道上，
  已標記且由機器人撰寫的聊天室回音會在機器人授權前被丟棄。
- 文件會說明傳送、接收、即時、狀態、收據、關係、失敗政策、遷移和測試涵蓋範圍。

## 相關

- [訊息](/zh-TW/concepts/messages)
- [串流和分塊](/zh-TW/concepts/streaming)
- [進度草稿](/zh-TW/concepts/progress-drafts)
- [重試政策](/zh-TW/concepts/retry)
- [通道回合核心](/zh-TW/plugins/sdk-channel-turn)
