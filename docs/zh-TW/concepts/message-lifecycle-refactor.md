---
read_when:
    - 重構頻道傳送或接收行為
    - 變更頻道入站、回覆分派、出站佇列、預覽串流，或外掛 SDK 訊息 API
    - 設計需要持久傳送、回執、預覽、編輯或重試的新通道外掛
summary: 統一且持久的訊息接收、傳送、預覽、編輯與串流生命週期設計計畫
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-06-27T19:12:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此頁是目標設計，用來以單一耐久的訊息生命週期，取代分散的通道入站、回覆
派送、預覽串流與出站遞送輔助工具。

簡短版本：

- 核心原語應該是 **接收** 與 **傳送**，而不是 **回覆**。
- 回覆只是出站訊息上的一種關聯。
- 回合是入站處理的便利機制，不是遞送的擁有者。
- 傳送必須以情境為基礎：`begin`、轉譯、預覽或串流、最終傳送、
  提交、失敗。
- 接收也必須以情境為基礎：正規化、去重、路由、記錄、
  派送、平台確認、失敗。
- 公開外掛 SDK 應該收斂成一個小型的通道出站介面。

## 問題

目前的通道堆疊來自幾個合理的局部需求：

- 簡單的入站介面卡使用 `runtime.channel.inbound.run`。
- 豐富的介面卡使用 `runtime.channel.inbound.runPreparedReply`。
- 舊版輔助工具使用 `dispatchInboundReplyWithBase`、
  `recordInboundSessionAndDispatchReply`、回覆承載輔助工具、回覆分塊、
  回覆參照，以及出站執行階段輔助工具。
- 預覽串流存在於通道特定的派送器中。
- 最終遞送耐久性正圍繞既有回覆承載路徑加入。

這種形狀修復了局部錯誤，但讓 OpenClaw 擁有太多公開概念，
也有太多地方可能讓遞送語意漂移。

暴露這個問題的可靠性案例是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標不變式比 Telegram 更廣：一旦核心決定應該存在一則可見的
出站訊息，就必須先讓意圖具備耐久性，然後才嘗試平台傳送；
成功後也必須提交平台收據。這讓 OpenClaw 具備至少一次復原能力。
只有能證明原生冪等性，或能在重播前針對平台狀態調和
傳送後未知結果的介面卡，才存在恰好一次行為。

這是此重構的最終狀態，不是每個目前路徑的描述。遷移期間，
既有出站輔助工具在盡力而為的佇列寫入失敗時，仍可退回直接傳送。
只有當耐久最終傳送採取失敗即關閉，或以已文件化的非耐久政策明確選擇退出時，
此重構才算完成。

## 目標

- 所有通道訊息接收與傳送路徑共用一個核心生命週期。
- 在介面卡宣告可安全重播行為後，新訊息生命週期預設使用耐久最終傳送。
- 共用預覽、編輯、串流、最終化、重試、復原與收據語意。
- 第三方外掛可學習與維護的小型外掛 SDK 介面。
- 遷移期間相容既有入站回覆相容性呼叫端。
- 為新的通道能力提供清楚的擴充點。
- 核心中沒有平台特定分支。
- 沒有 token-delta 通道訊息。通道串流仍是訊息預覽、
  編輯、附加或完成區塊遞送。
- 為作業/系統輸出提供結構化 OpenClaw 來源中繼資料，讓可見的
  閘道失敗不會在啟用機器人的共享房間中，重新進入為新的提示。

## 非目標

- 不要在第一階段強制每個既有通道採用耐久訊息遞送。
- 不要強制每個通道採用相同的原生傳輸行為。
- 不要讓核心理解 Telegram 主題、Slack 原生串流、Matrix 修訂、
  Feishu 卡片、QQ 語音或 Teams 活動。
- 不要將所有內部遷移輔助工具發布為穩定的 SDK API。
- 不要讓重試重播已完成的非冪等平台操作。

## 參考模型

Vercel Chat 有很好的公開心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 介面卡方法，例如 `postMessage`、`editMessage`、`deleteMessage`、
  `stream`、`startTyping`，以及歷史擷取
- 用於去重、鎖定、佇列與持久化的狀態介面卡

OpenClaw 應該借用其詞彙，而不是複製其介面。

OpenClaw 在該模型之外還需要：

- 在直接傳輸呼叫之前建立耐久的出站傳送意圖。
- 具有開始、提交與失敗的明確傳送情境。
- 知道平台確認政策的接收情境。
- 可在重啟後存活，並能驅動編輯、刪除、復原與
  重複抑制的收據。
- 更小的公開 SDK。內建外掛可以使用內部執行階段輔助工具，
  但第三方外掛應該看到一個一致的訊息 API。
- 代理特定行為：工作階段、文字記錄、區塊串流、工具
  進度、核准、媒體指令、靜默回覆，以及群組提及
  歷史。

`thread.post()` 風格的 promise 對 OpenClaw 而言並不足夠。它們隱藏了
決定傳送是否可復原的交易邊界。

## 核心模型

新的領域應位於內部核心命名空間之下，例如
`src/channels/message/*`。

它有四個概念：

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` 擁有入站生命週期。

`send` 擁有出站生命週期。

`live` 擁有預覽、編輯、進度與串流狀態。

`state` 擁有耐久意圖儲存、收據、冪等性、復原、鎖定與
去重。

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

這讓相同的傳送路徑能處理一般回覆、排程通知、核准
提示、任務完成、訊息工具傳送、命令列介面或 Control UI 傳送、子代理
結果，以及自動化傳送。

### 來源

來源描述誰產生了訊息，以及 OpenClaw 應如何處理該訊息的回聲。
它與關聯分開：一則訊息可以是對使用者的回覆，
同時仍是 OpenClaw 來源的作業輸出。

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

核心擁有 OpenClaw 來源輸出的意義。通道擁有如何將該
來源編碼到其傳輸中的方式。

第一個必要用途是閘道失敗輸出。人類仍應看到
「Agent failed before reply」或「Missing API key」等訊息，但帶有標記的
OpenClaw 作業輸出，不得在 `allowBots` 啟用時被接受為共享
房間中的機器人作者輸入。

### 收據

收據是一等公民：

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

收據是從耐久意圖到未來編輯、刪除、預覽
最終化、重複抑制與復原之間的橋梁。

收據可以描述一則平台訊息或多部分遞送。分塊
文字、媒體加文字、語音加文字，以及卡片備援，都必須保留所有
平台 ID，同時仍暴露主要 ID 以供串接與後續編輯使用。

## 接收情境

接收不應只是裸輔助工具呼叫。核心需要一個知道
去重、路由、工作階段記錄與平台確認政策的情境。

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

確認不是單一事物。接收合約必須讓這些訊號保持分離：

- **傳輸確認：** 告訴平台網路鉤子或 socket，OpenClaw 已接受
  事件信封。有些平台要求必須在派送前完成此確認。
- **輪詢偏移確認：** 推進游標，避免再次擷取相同事件。
  這不得推進到無法復原的工作之後。
- **入站記錄確認：** 確認 OpenClaw 已持久化足夠的入站中繼資料，
  可對重新遞送進行去重與路由。
- **使用者可見收據：** 選用的已讀/狀態/輸入中行為；絕不是
  耐久性邊界。

`ReceiveAckPolicy` 只控制傳輸或輪詢確認。不得
將其重用於已讀收據或狀態反應。

在機器人授權之前，當通道可以解碼訊息來源中繼資料時，接收必須套用共享的 OpenClaw 回聲政策：

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

此丟棄是基於標記，而非基於文字。具有相同可見閘道失敗文字、
但沒有 OpenClaw 來源中繼資料的機器人作者房間訊息，仍會
經過正常的 `allowBots` 授權。

確認政策是明確的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 輪詢現在使用接收情境確認政策來處理其持久化的
重啟浮水印。追蹤器仍會在 grammY 更新進入
中介軟體鏈時觀察它們，但 OpenClaw 只會在成功派送後持久化安全的已完成更新 ID，
讓失敗或較低的待處理更新可在重啟後重播。Telegram 的上游 `getUpdates`
擷取偏移仍由輪詢程式庫控制，所以如果我們需要超出 OpenClaw 重啟
浮水印的平台層級重新遞送，剩下更深入的切入點是完整耐久的輪詢
來源。網路鉤子平台可能需要立即 HTTP 確認，但它們仍需要
入站去重與耐久出站傳送意圖，因為網路鉤子可能重新遞送。

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

此輔助函式會展開為：

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

意圖必須在傳輸 I/O 之前存在。在開始後、提交前重新啟動是可復原的。

危險邊界位於平台成功後、回條提交前。如果程序在該處死亡，除非配接器提供原生冪等性或回條對帳路徑，否則 OpenClaw 無法知道平台訊息是否存在。這些嘗試必須在 `unknown_after_send` 中恢復，而不是盲目重放。沒有對帳能力的通道，只有在重複可見訊息是該通道與關係可接受且已文件化的取捨時，才可以選擇至少一次重放。目前的 SDK 對帳橋接要求配接器宣告 `reconcileUnknownSend`，接著要求 `durableFinal.reconcileUnknownSend` 將未知項目分類為 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允許重放，而未解決項目會保持終結狀態，或只重試對帳檢查。

持久性政策必須明確：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示核心在無法寫入持久意圖時必須失敗關閉。`best_effort` 可在持久化不可用時繼續往下執行。`disabled` 保留舊的直接傳送行為。遷移期間，舊版包裝器與公開相容性輔助函式預設為 `disabled`；它們不得因為通道有通用輸出配接器，就推斷為 `required`。

傳送情境也擁有通道本機的傳送後效果。如果持久傳遞繞過先前附加在通道直接傳送路徑上的本機行為，遷移就不安全。範例包括自我回音抑制快取、討論串參與標記、原生編輯錨點、模型簽章呈現，以及平台特定的重複防護。這些效果必須移至傳送配接器、呈現配接器，或具名的傳送情境掛鉤，該通道才能啟用持久通用最終傳遞。

傳送輔助函式必須一路將回條回傳給呼叫端。持久包裝器不能吞掉訊息 id，或用 `undefined` 取代通道傳遞結果；緩衝分派器會使用這些 id 來處理討論串錨點、後續編輯、預覽完成，以及重複抑制。

備援傳送作用於批次，而不是單一酬載。靜默回覆改寫、媒體備援、卡片備援與分塊投影都可能產生多個可傳遞訊息，因此傳送情境必須傳遞整個投影批次，或明確文件化為什麼只有一個酬載有效。

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

當這類備援具備持久性時，整個投影批次必須由一個持久傳送意圖，或另一種原子批次計畫表示。逐一記錄每個酬載並不足夠：酬載之間的當機可能留下部分可見備援，卻沒有剩餘酬載的持久記錄。復原必須知道哪些單元已經有回條，並且只重放缺漏單元，或將批次標記為 `unknown_after_send`，直到配接器完成對帳。

## 即時情境

預覽、編輯、進度與串流行為應該是一個選擇啟用的生命週期。

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

即時狀態具備足夠的持久性，可復原或抑制重複：

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

- Telegram 傳送加上編輯預覽，並在預覽過期後送出新的最終訊息。
- Discord 傳送加上編輯預覽，並在媒體、錯誤或明確回覆時取消。
- Slack 依討論串形態使用原生串流或草稿預覽。
- Mattermost 草稿貼文完成。
- Matrix 草稿事件完成，或在不符時撤回。
- Teams 原生進度串流。
- QQ Bot 串流或累積備援。

## 配接器介面

公開 SDK 目標應為一個子路徑：

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

在預檢授權之前，只要 `origin.decode` 回傳 OpenClaw 來源中繼資料，核心就必須執行共用的 OpenClaw 回音述詞。接收配接器提供平台事實，例如 Bot 作者與房間形態；核心擁有捨棄決策與排序，因此通道不會重新實作文字篩選器。

來源配接器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

核心設定 `MessageOrigin`。通道只負責在它與原生傳輸中繼資料之間轉換。Slack 會將其對應至 `chat.postMessage({ metadata })` 與輸入的 `message.metadata`；Matrix 可將其對應至額外事件內容；沒有原生中繼資料的通道，若回條/輸出登錄表是最佳可用近似方式，也可以使用它。

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

## 公開 SDK 精簡

新的公開介面應吸收或淘汰這些概念領域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` 的大多數公開用途
- 臨時草稿串流生命週期輔助函式

相容性子路徑可作為包裝器保留，但新的第三方外掛不應需要它們。

遷移期間，內建外掛可以透過保留的執行階段子路徑保留內部輔助函式匯入。公開文件應在 `plugin-sdk/channel-outbound` 存在後，引導外掛作者使用它。

## 與通道輸入的關係

`runtime.channel.inbound.*` 是遷移期間的執行階段橋接。

它應成為相容性配接器：

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` 一開始也應保留：

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

舊的 `channel.turn` 執行階段介面已移除。執行階段呼叫端使用 `channel.inbound.*`；通道文件與 SDK 子路徑使用輸入/訊息名詞。

## 相容性護欄

遷移期間，對於任何既有傳遞回呼除了「傳送此酬載」之外還有副作用的通道，通用持久傳遞都必須選擇啟用。

舊版進入點預設為非持久：

- `channel.inbound.run` 與 `dispatchChannelInboundReply` 會使用通道的傳遞回呼，除非該通道明確提供經稽核的持久政策/選項物件。
- `channel.inbound.runPreparedReply` 保持由通道擁有，直到準備好的分派器明確呼叫傳送情境。
- 公開相容性輔助函式，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 與直接 DM 輔助函式，絕不會在呼叫端提供的 `deliver` 或 `reply` 回呼之前注入通用持久傳遞。

對於遷移橋接型別，`durable: undefined` 表示「非持久」。持久路徑只會由明確的政策/選項值啟用。`durable:
false` 可作為相容拼法保留，但實作不應要求每個尚未遷移的通道都加入它。

目前的橋接程式碼必須讓持久性決策保持明確：

- 耐久化最終遞送會回傳可辨識聯集狀態。`handled_visible` 和
  `handled_no_send` 是終端狀態；`unsupported` 和 `not_applicable` 可能會
  回退到由頻道擁有的遞送；`failed` 會傳播傳送失敗。
- 通用耐久化最終遞送受配接器能力控管，例如靜默遞送、保留回覆目標、保留原生引用，以及
  訊息傳送鉤子。若缺少同等能力，應選擇由頻道擁有的遞送，
  而不是會改變使用者可見行為的通用傳送。
- 佇列支援的耐久化傳送會公開遞送意圖參照。現有的
  `pendingFinalDelivery*` 工作階段欄位可在轉換期間攜帶意圖 id；
  最終狀態是 `MessageSendIntent` 儲存，而不是凍結的回覆文字加上臨時情境欄位。

在下列所有條件都成立之前，請勿為頻道啟用通用耐久化路徑：

- 通用傳送配接器執行與舊直接路徑相同的轉譯與傳輸行為。
- 本機傳送後副作用會透過傳送情境保留下來。
- 配接器會回傳包含所有平台訊息 id 的收據或遞送結果。
- 已準備的分派器路徑會呼叫新的傳送情境，或持續記錄為不在耐久化保證範圍內。
- 回退遞送會處理每個投影後的承載，而不只是第一個。
- 耐久化回退遞送會將整個投影後承載陣列記錄為一個可重播的意圖或批次計畫。

需要保留的具體遷移風險：

- iMessage 監控器遞送會在成功傳送後，將已傳送訊息記錄到回音快取中。耐久化最終傳送仍必須填入該快取，否則
  OpenClaw 可能會把自己的最終回覆重新擷取為傳入的使用者訊息。
- Tlon 會附加選用的模型簽章，並在群組回覆後記錄參與過的討論串。通用耐久化遞送不得繞過這些效果；
  請將它們移到 Tlon 的轉譯/傳送/最終化配接器中，或讓 Tlon 維持在由頻道擁有的路徑上。
- Discord 和其他已準備的分派器已經擁有直接遞送與預覽行為。在它們的已準備分派器明確將最終訊息透過傳送情境路由之前，
  它們不受組裝回合的耐久化保證涵蓋。
- Telegram 靜默回退遞送必須遞送完整的投影後承載陣列。單一承載捷徑可能會在投影後丟棄額外的回退承載。
- LINE、Zalo、Nostr 和其他既有的組裝/輔助路徑可能
  具有回覆權杖處理、媒體代理、已傳送訊息快取、載入/狀態清理，或僅限回呼的目標。它們會維持在由頻道擁有的遞送上，直到
  這些語意由傳送配接器表示，並由測試驗證。
- 直接私訊輔助工具可能有一個回覆回呼，而那是唯一正確的傳輸目標。通用對外傳送不得從 `OriginatingTo` 或 `To` 猜測並略過該回呼。
- OpenClaw 閘道失敗輸出必須維持對人類可見，但帶標籤且由機器人撰寫的聊天室回音必須在 `allowBots` 授權之前被丟棄。
  頻道不得使用可見文字前綴篩選器來實作此行為，除非作為短期緊急權宜措施；耐久化合約是結構化來源中繼資料。

## 內部儲存

耐久化佇列應儲存訊息傳送意圖，而不是回覆承載。

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

佇列應保留足夠的身分資訊，以便在重新啟動後，透過相同的帳號、
討論串、目標、格式化政策和媒體規則重播。

## 失敗類別

頻道配接器會將傳輸失敗分類為封閉類別：

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
- 對於 `not_found`，當頻道宣告安全時，允許即時最終化從編輯回退到全新傳送。
- 對於 `conflict`，使用收據/idempotency 規則來判斷訊息是否已存在。
- 配接器可能已完成平台 I/O，但在收據提交之前發生的任何錯誤，都會變成 `unknown_after_send`，除非配接器可以證明平台操作未發生。

## 頻道對應

| 渠道         | 目標遷移                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | 接收確認政策加上持久化最終傳送。即時轉接器負責傳送與編輯預覽、過期預覽的最終傳送、主題、引用回覆預覽略過、媒體備援，以及 retry-after 處理。                                                                                                                                                                   |
| Discord         | 傳送轉接器包裝現有的持久化酬載遞送。即時轉接器負責草稿編輯、進度草稿、媒體/錯誤預覽取消、回覆目標保留，以及訊息 ID 回執。稽核共用房間中由 bot 撰寫的閘道失敗回聲；如果 Discord 無法在一般訊息上攜帶來源中繼資料，請使用外送登錄檔或其他原生等價機制。 |
| Slack           | 傳送轉接器處理一般聊天貼文。即時轉接器在討論串形狀支援時選擇原生串流，否則使用草稿預覽。回執保留討論串時間戳記。來源轉接器將 OpenClaw 閘道失敗對應到 Slack `chat.postMessage.metadata`，並在 `allowBots` 授權之前丟棄已標記的 bot 房間回聲。                                  |
| WhatsApp        | 傳送轉接器負責文字/媒體傳送與持久化最終意圖。接收轉接器處理群組提及與傳送者身分。即時轉接器可保持缺席，直到 WhatsApp 具備可編輯的傳輸為止。                                                                                                                                                                        |
| Matrix          | 即時轉接器負責草稿事件編輯、最終化、修訂刪除、加密媒體限制，以及回覆目標不符備援。接收轉接器負責加密事件補水與去重。來源轉接器應將 OpenClaw 閘道失敗來源編碼到 Matrix 事件內容中，並在 `allowBots` 處理之前丟棄已設定 bot 的房間回聲。              |
| Mattermost      | 即時轉接器負責一則草稿貼文、進度/工具折疊、原地最終化，以及新傳送備援。                                                                                                                                                                                                                                                       |
| Microsoft Teams | 即時轉接器負責原生進度與區塊串流行為。傳送轉接器負責活動與附件/卡片回執。                                                                                                                                                                                                                                        |
| Feishu          | 轉譯轉接器負責文字/卡片/原始轉譯。即時轉接器負責串流卡片與重複最終訊息抑制。傳送轉接器負責留言、主題工作階段、媒體，以及語音抑制。                                                                                                                                                                      |
| QQ Bot          | 即時轉接器負責 C2C 串流、累加器逾時，以及備援最終傳送。轉譯轉接器負責媒體標籤與文字轉語音。                                                                                                                                                                                                                               |
| Signal          | 簡單接收加上傳送轉接器。除非 signal-cli 加入可靠的編輯支援，否則不需要即時轉接器。                                                                                                                                                                                                                                                                |
| iMessage        | 簡單接收加上傳送轉接器。iMessage 傳送必須保留監控器回聲快取填充，持久化最終訊息才能繞過監控器遞送。                                                                                                                                                                                                                 |
| Google Chat     | 簡單接收加上傳送轉接器，並將討論串關係對應到聊天室與討論串 ID。稽核 `allowBots=true` 房間行為是否有已標記的 OpenClaw 閘道失敗回聲。                                                                                                                                                                                        |
| LINE            | 簡單接收加上傳送轉接器，並將回覆權杖限制建模為目標/關係能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 接收橋接加上傳送轉接器。                                                                                                                                                                                                                                                                                                                          |
| IRC             | 簡單接收加上傳送轉接器，沒有持久化編輯回執。                                                                                                                                                                                                                                                                                                    |
| Nostr           | 加密 DM 的接收加上傳送轉接器；回執是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA Channel      | 用於接收、傳送、即時、重試和復原行為的合約測試轉接器。                                                                                                                                                                                                                                                                                   |
| Synology Chat   | 簡單接收加上傳送轉接器。                                                                                                                                                                                                                                                                                                                              |
| Tlon            | 傳送轉接器必須先保留模型簽章轉譯與已參與討論串追蹤，才能啟用通用持久化最終遞送。                                                                                                                                                                                                                        |
| Twitch          | 簡單接收加上傳送轉接器，並具備速率限制分類。                                                                                                                                                                                                                                                                                               |
| Zalo            | 簡單接收加上傳送轉接器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | 簡單接收加上傳送轉接器。                                                                                                                                                                                                                                                                                                                              |

## 遷移計畫

### 階段 1：內部訊息領域

- 新增 `src/channels/message/*` 型別，用於訊息、目標、關係、
  來源、回執、能力、持久化意圖、接收情境、傳送
  情境、即時情境，以及失敗類別。
- 將 `origin?: MessageOrigin` 新增到目前回覆遞送使用的遷移橋接酬載型別，
  然後隨著重構取代回覆酬載，將該欄位移到 `ChannelMessage` 和已轉譯
  訊息型別。
- 在轉接器與測試證明該形狀之前，保持內部使用。
- 為狀態轉換與序列化新增純單元測試。

### 階段 2：持久化傳送核心

- 將現有外送佇列從回覆酬載持久性移到持久化
  訊息傳送意圖。
- 讓持久化傳送意圖攜帶投影後的酬載陣列或批次計畫，而不只是
  一個回覆酬載。
- 透過相容性轉換保留目前的佇列復原行為。
- 讓 `deliverOutboundPayloads` 呼叫 `messages.send`。
- 在轉接器宣告重播安全後，讓最終傳送持久性成為預設，並在新的訊息生命週期中無法寫入持久化意圖時封閉失敗。現有的入站執行器與 SDK 相容性路徑在此階段仍預設為直接傳送。
- 一致地記錄回執。
- 將回執與遞送結果傳回原始分派器呼叫者，而不是將持久化傳送視為終端副作用。
- 透過持久化傳送意圖持續保存訊息來源，讓復原、重播和分段傳送保留 OpenClaw 操作來源。

### 階段 3：渠道入站橋接

- 在 `messages.receive` 和 `messages.send` 之上重新實作
  `channel.inbound.run` 和 `dispatchChannelInboundReply`。
- 保持目前事實型別穩定。
- 預設保留舊有行為。組裝回合渠道只有在其轉接器明確以重播安全的持久性政策選擇加入時，才會變成持久化。
- 保留 `durable: false` 作為相容性逃生口，用於會最終化原生編輯且尚無法安全重播的路徑，但不要依賴 `false` 標記來保護尚未遷移的渠道。
- 只有在新的訊息生命週期中，並且渠道對應證明通用傳送路徑保留舊渠道遞送語義後，才預設啟用組裝回合持久性。

### 階段 4：已準備分派器橋接

- 將 `deliverDurableInboundReplyPayload` 替換為傳送情境橋接。
- 保留舊 helper 作為 wrapper。
- 先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因為
  它們已經有 durable-final 工作，或傳送路徑較簡單。
- 將每個已準備好的 dispatcher 都視為未涵蓋，直到它明確選擇加入
  傳送情境。文件與 changelog 項目必須說「已組裝的
  頻道 turn」，或點名已遷移的頻道路徑，而不是宣稱所有
  自動 final reply。
- 保持 `recordInboundSessionAndDispatchReply`、直接 DM helper，以及類似的
  公開相容性 helper 行為不變。它們之後可以公開明確的
  傳送情境選擇加入，但不得在呼叫端擁有的 delivery callback 之前
  自動嘗試通用持久 delivery。

### 階段 5：統一 Live 生命週期

- 建立 `messages.live`，並提供兩個 proof adapter：
  - Telegram 用於 send 加 edit 加 stale final send。
  - Matrix 用於 draft finalization 加 redaction fallback。
- 然後遷移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每個頻道都有 parity tests 之後，才刪除重複的 preview finalization code。

### 階段 6：公開 SDK

- 新增 `openclaw/plugin-sdk/channel-outbound`。
- 將它記錄為偏好的頻道外掛 API。
- 更新 package exports、entrypoint inventory、generated API baselines，以及
  外掛 SDK 文件。
- 在 channel-outbound SDK surface 中納入 `MessageOrigin`、origin encode/decode hooks，以及共用的
  `shouldDropOpenClawEcho` predicate。
- 保留舊 subpath 的相容性 wrapper。
- 在 bundled plugins 遷移後，於文件中將 reply-named SDK helper 標示為 deprecated。

### 階段 7：所有 Senders

將所有非回覆的 outbound producer 移至 `messages.send`：

- 排程與心跳偵測通知
- task completions
- hook results
- approval prompts 和 approval results
- message tool sends
- subagent completion announcements
- 明確的命令列介面或 Control UI sends
- automation/broadcast paths

這就是模型不再是「agent replies」，而是變成「OpenClaw sends
messages」的地方。

### 階段 8：移除 Turn-Named 相容性

- 保留 inbound/message-named wrapper 作為相容性期間。
- 發布 migration notes。
- 對舊 import 執行外掛 SDK compatibility tests。
- 只有在沒有 bundled plugin 需要它們，且第三方合約已有穩定替代方案後，
  才移除或隱藏舊的 internal helper。

## 測試計畫

單元測試：

- Durable send intent serialization and recovery。
- Idempotency key reuse and duplicate suppression。
- Receipt commit and replay skip。
- 當 adapter 支援 reconciliation 時，`unknown_after_send` recovery 會在 replay 前進行 reconcile。
- Failure classification policy。
- Receive ack policy sequencing。
- Reply、followup、system 和 broadcast sends 的 relation mapping。
- Gateway-failure origin factory 和 `shouldDropOpenClawEcho` predicate。
- Origin preservation through payload normalization、chunking、durable queue serialization 和 recovery。

整合測試：

- `channel.inbound.run` simple adapter 仍會記錄並傳送。
- Legacy assembled-event delivery 不會變成 durable，除非頻道明確選擇加入。
- `channel.inbound.runPreparedReply` bridge 仍會記錄並 finalize。
- 公開相容性 helper 預設呼叫 caller-owned delivery callbacks，且不會在那些 callbacks 前 generic-send。
- Durable fallback delivery 在 restart 後 replay 整個 projected payload array，且不能在 early crash 後留下後續 payloads 未記錄。
- Durable assembled-event delivery 會將 platform message ids 回傳給 buffered dispatcher。
- 當 durable delivery 停用或無法使用時，custom delivery hooks 仍會回傳 platform message ids。
- Final reply 在 assistant completion 與 platform send 之間 restart 後仍保留。
- Preview draft 在允許時會就地 finalize。
- 當 media/error/reply-target mismatch 需要 normal delivery 時，Preview draft 會被取消或 redacted。
- Block streaming 和 preview streaming 不會同時 delivery 相同文字。
- 提早 streamed 的 media 不會在 final delivery 中重複。

頻道測試：

- Telegram topic reply with polling ack delayed until the receive context's safe
  completed watermark。
- Telegram polling recovery for accepted-but-not-delivered updates covered by
  the persisted safe-completed offset model。
- Telegram stale preview sends fresh final and cleans up preview。
- Telegram silent fallback sends every projected fallback payload。
- Telegram silent fallback durability records the full projected fallback array
  atomically, not one single-payload durable intent per loop iteration。
- Discord preview cancel on media/error/explicit reply。
- Discord prepared dispatcher finals route through the send context before docs
  or changelog claim Discord final-reply durability。
- iMessage durable final sends populate the monitor sent-message echo cache。
- LINE、Zalo 和 Nostr legacy delivery paths 不會被
  generic durable send 繞過，直到它們的 adapter parity tests 存在。
- Direct-DM/Nostr callback delivery 仍具權威性，除非明確遷移到完整的 message target 和 replay-safe send adapter。
- Slack tagged OpenClaw gateway failure messages stay visible outbound, tagged
  bot-room echoes drop before `allowBots`, and untagged bot messages with the
  same visible text still follow normal bot authorization。
- Slack native stream fallback to draft preview in top-level DMs。
- Matrix preview finalization and redaction fallback。
- Matrix tagged OpenClaw gateway-failure room echoes from configured bot
  accounts drop before `allowBots` handling。
- Discord 和 Google Chat shared-room gateway-failure cascade audits cover
  `allowBots` modes before claiming generic protection there。
- Mattermost draft finalization and fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final sends preserve model-signature rendering and participated
  thread tracking。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal simple durable final
  sends。

驗證：

- 開發期間使用目標 Vitest files。
- 在 Testbox 中對完整 changed surface 執行 `pnpm check:changed`。
- 在 landing 完整 refactor 前，或 public SDK/export changes 後，在 Testbox 中執行更廣泛的 `pnpm check`。
- 在移除 compatibility wrappers 前，至少對一個 edit-capable channel 和一個
  simple send-only channel 執行 live 或 qa-channel smoke。

## 開放問題

- Telegram 是否最終應以完整 durable polling source 取代 grammY runner source，
  讓它能控制 platform-level redelivery，而不只是 OpenClaw 的 persisted restart watermark。
- Durable live preview state 應該儲存在與 final send intent 相同的 queue record，
  還是 sibling live-state store。
- `plugin-sdk/channel-outbound` 發布後，compatibility wrappers 要在文件中保留多久。
- 第三方外掛應該直接實作 receive adapters，還是只透過 `defineChannelMessageAdapter`
  提供 normalize/send/live hooks。
- 哪些 receipt fields 可以安全公開在 public SDK，而不是 internal runtime state。
- self-echo caches 和 participated-thread markers 等 side effects 應建模為 send-context hooks、
  adapter-owned finalize steps，還是 receipt subscribers。
- 哪些頻道有 native origin metadata，哪些需要 persisted outbound registries，
  以及哪些無法提供可靠的 cross-bot echo suppression。

## 驗收標準

- 每個 bundled message channel 都透過 `messages.send` 傳送 final visible output。
- 每個 inbound message channel 都透過 `messages.receive` 或記錄在文件中的
  compatibility wrapper 進入。
- 每個 preview/edit/stream channel 都使用 `messages.live` 處理 draft state 和
  finalization。
- `channel.inbound` 只是一個 wrapper。
- Reply-named SDK helpers 是 compatibility exports，不是建議路徑。
- Durable recovery 可以在 restart 後 replay pending final sends，而不會遺失
  final response 或重複已 committed sends；platform outcome unknown 的 sends
  會在 replay 前 reconcile，或針對該 adapter 記錄為 at-least-once。
- 當 durable intent 無法寫入時，Durable final sends 會 fail closed，
  除非 caller 明確選擇了記錄在文件中的 non-durable mode。
- Legacy SDK compatibility helpers 預設為直接
  channel-owned delivery；generic durable send 只允許明確選擇加入。
- Receipts 會保留 multi-part deliveries 的所有 platform message ids，以及
  threading/edit 便利用途的 primary id。
- Durable wrappers 在取代 direct delivery callbacks 前，會保留 channel-local side effects。
- Prepared dispatchers 不會被計為 durable，直到它們的 final delivery
  path 明確使用 send context。
- Fallback delivery 會處理每個 projected payload。
- Durable fallback delivery 會將每個 projected payload 記錄在一個可 replay 的
  intent 或 batch plan 中。
- OpenClaw-originated gateway failure output 對人類可見，但在宣告支援 origin contract 的頻道上，
  tagged bot-authored room echoes 會在 bot authorization 前被丟棄。
- 文件會說明 send、receive、live、state、receipts、relations、failure
  policy、migration 和 test coverage。

## 相關

- [Messages](/zh-TW/concepts/messages)
- [Streaming and chunking](/zh-TW/concepts/streaming)
- [Progress drafts](/zh-TW/concepts/progress-drafts)
- [Retry policy](/zh-TW/concepts/retry)
- [Channel inbound API](/zh-TW/plugins/sdk-channel-inbound)
