---
read_when:
    - 重構頻道傳送或接收行為
    - 變更頻道回合、回覆派送、外送佇列、預覽串流，或 Plugin SDK 訊息 API
    - 設計需要持久化傳送、收執、預覽、編輯或重試的新通道 Plugin
summary: 統一持久化訊息接收、傳送、預覽、編輯與串流生命週期的設計計畫
title: 訊息生命週期重構
x-i18n:
    generated_at: "2026-05-10T19:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

此頁是目標設計，用於以一個耐久的訊息生命週期，取代分散的頻道回合、回覆分派、預覽串流，以及出站傳遞輔助工具。

簡短版本：

- 核心基元應該是 **接收** 與 **傳送**，而不是 **回覆**。
- 回覆只是出站訊息上的一種關係。
- 回合是入站處理的便利機制，不是傳遞的擁有者。
- 傳送必須以脈絡為基礎：`begin`、算繪、預覽或串流、最終傳送、提交、失敗。
- 接收也必須以脈絡為基礎：正規化、去重、路由、記錄、分派、平台 ack、失敗。
- 公開的 Plugin SDK 應收斂為一個小型頻道訊息介面。

## 問題

目前的頻道堆疊是由幾個合理的局部需求演進而來：

- 簡單的入站配接器使用 `runtime.channel.turn.run`。
- 功能較完整的配接器使用 `runtime.channel.turn.runPrepared`。
- 舊版輔助工具使用 `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、回覆承載輔助工具、回覆分塊、回覆參照，以及出站執行階段輔助工具。
- 預覽串流位於各頻道專屬的分派器中。
- 最終傳遞耐久性正在既有回覆承載路徑周圍加入。

這種形態修正了局部錯誤，但也讓 OpenClaw 擁有過多公開概念，以及過多可能讓傳遞語意漂移的位置。

暴露此問題的可靠性情境是：

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標不變性比 Telegram 更廣：一旦核心決定應存在可見的出站訊息，在嘗試平台傳送之前，該意圖就必須是耐久的；成功後也必須提交平台收據。這讓 OpenClaw 具備至少一次的復原能力。精確一次行為只存在於能證明原生冪等性，或能在重放前針對傳送後未知狀態的嘗試與平台狀態進行協調的配接器。

這是本次重構的最終狀態，不是每條現有路徑的描述。在遷移期間，當盡力而為的佇列寫入失敗時，現有出站輔助工具仍可退回直接傳送。只有當耐久最終傳送改為失敗關閉，或明確以已記錄的非耐久政策選擇退出時，重構才算完成。

## 目標

- 所有頻道訊息接收與傳送路徑共用一個核心生命週期。
- 配接器宣告具備可安全重放行為後，在新的訊息生命週期中預設使用耐久最終傳送。
- 共用的預覽、編輯、串流、最終化、重試、復原與收據語意。
- 第三方 Plugin 可學習並維護的小型 Plugin SDK 介面。
- 遷移期間相容既有 `channel.turn` 呼叫者。
- 為新的頻道能力提供清楚的擴充點。
- 核心中沒有平台專屬分支。
- 沒有 token-delta 頻道訊息。頻道串流仍維持為訊息預覽、編輯、附加，或已完成區塊傳遞。
- 針對操作性／系統輸出的結構化 OpenClaw 來源中繼資料，避免可見的 Gateway 失敗在啟用機器人的共用房間中重新作為新提示進入。

## 非目標

- 第一階段不移除 `runtime.channel.turn.*`。
- 不強迫每個頻道採用相同的原生傳輸行為。
- 不讓核心理解 Telegram 主題、Slack 原生串流、Matrix 編修、Feishu 卡片、QQ 語音，或 Teams 活動。
- 不將所有內部遷移輔助工具發布為穩定 SDK API。
- 不讓重試重放已完成的非冪等平台操作。

## 參考模型

Vercel Chat 有一個良好的公開心智模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 配接器方法，例如 `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping`，以及歷史擷取
- 用於去重、鎖定、佇列與持久化的狀態配接器

OpenClaw 應借用其詞彙，而不是複製其介面。

OpenClaw 在該模型之外還需要：

- 在直接傳輸呼叫之前建立耐久出站傳送意圖。
- 具有開始、提交與失敗的明確傳送脈絡。
- 知道平台 ack 政策的接收脈絡。
- 可在重新啟動後保留，並驅動編輯、刪除、復原與重複抑制的收據。
- 更小的公開 SDK。內建 Plugin 可以使用內部執行階段輔助工具，但第三方 Plugin 應看到一個一致的訊息 API。
- Agent 專屬行為：工作階段、逐字稿、區塊串流、工具進度、核准、媒體指令、靜默回覆，以及群組提及歷史。

`thread.post()` 風格的 promise 對 OpenClaw 而言並不足夠。它們隱藏了決定傳送是否可復原的交易邊界。

## 核心模型

新的領域應位於內部核心命名空間之下，例如 `src/channels/message/*`。

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

`state` 擁有耐久意圖儲存、收據、冪等性、復原、鎖定與去重。

## 訊息術語

### 訊息

正規化訊息與平台無關：

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

回覆是一種關係，不是 API 根：

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

這讓同一條傳送路徑能處理一般回覆、Cron 通知、核准提示、任務完成、訊息工具傳送、CLI 或 Control UI 傳送、子 Agent 結果，以及自動化傳送。

### 來源

來源描述誰產生了訊息，以及 OpenClaw 應如何處理該訊息的回音。它與關係分離：一則訊息可以是對使用者的回覆，同時仍是 OpenClaw 來源的操作性輸出。

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

核心擁有 OpenClaw 來源輸出的意義。頻道擁有將該來源編碼到其傳輸中的方式。

第一個必要用途是 Gateway 失敗輸出。人類仍應看到像是「Agent failed before reply」或「Missing API key」這類訊息，但已標記的 OpenClaw 操作性輸出，在 `allowBots` 啟用時，不能於共用房間中被接受為機器人撰寫的輸入。

### 收據

收據是一等概念：

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

收據是從耐久意圖到未來編輯、刪除、預覽最終化、重複抑制與復原之間的橋樑。

收據可以描述一則平台訊息或多段傳遞。分塊文字、媒體加文字、語音加文字，以及卡片後備，都必須保留所有平台 ID，同時仍暴露主要 ID 以供串接討論串與之後編輯使用。

## 接收脈絡

接收不應是單純的輔助呼叫。核心需要一個知道去重、路由、工作階段記錄，以及平台 ack 政策的脈絡。

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

Ack 不是單一概念。接收合約必須將這些訊號分開：

- **傳輸 ack：** 告知平台 Webhook 或 socket，OpenClaw 已接受事件信封。有些平台要求這必須發生在分派之前。
- **輪詢 offset ack：** 推進游標，使同一事件不會再次被擷取。這不得推進越過無法復原的工作。
- **入站記錄 ack：** 確認 OpenClaw 已持久化足夠的入站中繼資料，可對重新傳遞進行去重與路由。
- **使用者可見收據：** 選用的已讀／狀態／輸入中行為；絕不是耐久性邊界。

`ReceiveAckPolicy` 只控制傳輸或輪詢確認。它不得重用於已讀收據或狀態反應。

在機器人授權之前，當頻道可解碼訊息來源中繼資料時，接收必須套用共用的 OpenClaw 回音政策：

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

此丟棄是以標記為基礎，而不是以文字為基礎。具有相同可見 Gateway 失敗文字但沒有 OpenClaw 來源中繼資料的機器人撰寫房間訊息，仍會通過正常的 `allowBots` 授權。

Ack 政策是明確的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 輪詢現在使用接收脈絡 ack 政策作為其持久化重新啟動水位線。追蹤器仍會在 grammY 更新進入中介軟體鏈時觀察它們，但 OpenClaw 只會在成功分派後持久化安全的已完成更新 ID，讓失敗或較低的待處理更新能在重新啟動後重放。Telegram 上游的 `getUpdates` 擷取 offset 仍由輪詢函式庫控制，因此如果我們需要超出 OpenClaw 重新啟動水位線的平台層級重新傳遞，剩下更深入的一步就是完全耐久的輪詢來源。Webhook 平台可能需要立即 HTTP ack，但仍需要入站去重與耐久出站傳送意圖，因為 Webhook 可能重新傳遞。

## 傳送脈絡

傳送也以脈絡為基礎：

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

偏好的協調流程：

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

此輔助程式會展開為：

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

意圖必須在傳輸 I/O 之前存在。在開始之後但提交之前重新啟動是可復原的。

危險邊界在平台成功之後、回執提交之前。如果程序在此處終止，除非轉接器提供原生冪等性或回執對帳路徑，否則 OpenClaw 無法知道平台訊息是否存在。這些嘗試必須在 `unknown_after_send` 中恢復，而不是盲目重播。沒有對帳能力的通道，只有在重複可見訊息是該通道與關係可接受且已記錄的取捨時，才可選擇至少一次重播。目前的 SDK 對帳橋接要求轉接器宣告 `reconcileUnknownSend`，然後要求 `durableFinal.reconcileUnknownSend` 將未知項目分類為 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允許重播，而未解決項目會保持終止狀態，或只重試對帳檢查。

持久性政策必須明確：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示當核心無法寫入持久化意圖時，必須失敗關閉。`best_effort` 可在持久化不可用時繼續落入後續流程。`disabled` 會保留舊的直接傳送行為。遷移期間，舊版包裝器與公開相容性輔助程式預設為 `disabled`；它們不得因為通道有通用輸出轉接器，就推斷為 `required`。

傳送情境也擁有通道本地的傳送後效果。如果持久傳遞繞過先前附加在通道直接傳送路徑上的本地行為，遷移就不安全。範例包括自我回聲抑制快取、討論串參與標記、原生編輯錨點、模型簽章轉譯，以及平台特定的重複防護。這些效果必須移入傳送轉接器、轉譯轉接器，或具名的傳送情境 hook，該通道才能啟用持久化通用最終傳遞。

傳送輔助程式必須一路將回執傳回呼叫端。持久化包裝器不能吞掉訊息 ID，或以 `undefined` 取代通道傳遞結果；緩衝式分派器會使用這些 ID 作為討論串錨點、後續編輯、預覽最終化，以及重複抑制。

備援傳送以批次運作，而不是以單一承載運作。靜默回覆重寫、媒體備援、卡片備援，以及分塊投影都可能產生一個以上可傳遞訊息，因此傳送情境必須傳遞完整投影批次，或明確記錄為何只有一個承載有效。

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

當這類備援具備持久性時，整個投影批次必須由一個持久化傳送意圖，或另一個原子批次計畫表示。逐一記錄每個承載並不足夠：承載之間的當機可能留下部分可見的備援，但沒有剩餘承載的持久化記錄。復原必須知道哪些單元已經有回執，並且只重播缺少的單元，或將批次標記為 `unknown_after_send`，直到轉接器完成對帳。

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

即時狀態必須足夠持久，才能復原或抑制重複：

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

- Telegram 傳送加上編輯預覽，並在預覽過舊後使用新的最終訊息。
- Discord 傳送加上編輯預覽，並在媒體、錯誤或明確回覆時取消。
- Slack 原生串流，或依討論串形狀使用草稿預覽。
- Mattermost 草稿貼文最終化。
- Matrix 草稿事件最終化，或在不相符時撤回。
- Teams 原生進度串流。
- QQ Bot 串流或累積式備援。

## 轉接器介面

公開 SDK 目標應為單一子路徑：

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

傳送轉接器：

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

接收轉接器：

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

在預檢授權之前，只要 `origin.decode` 回傳 OpenClaw 來源中繼資料，核心就必須執行共用的 OpenClaw 回聲述詞。接收轉接器會提供平台事實，例如機器人作者與房間形狀；核心擁有丟棄決策與排序，因此通道不需要重新實作文字篩選器。

來源轉接器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

核心設定 `MessageOrigin`。通道只將它轉換為原生傳輸中繼資料，或從原生傳輸中繼資料轉回。Slack 會將此對應到 `chat.postMessage({ metadata })` 與傳入的 `message.metadata`；Matrix 可將它對應到額外事件內容；沒有原生中繼資料的通道，可在那是最佳可用近似方式時使用回執/輸出登錄檔。

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

## 公開 SDK 簡化

新的公開介面應吸收或淘汰這些概念區域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` 的大多數公開用法
- 臨時草稿串流生命週期輔助程式

相容性子路徑可以保留為包裝器，但新的第三方 plugins 不應需要它們。

遷移期間，內建 plugins 可透過保留的執行階段子路徑保留內部輔助匯入。公開文件應在 `plugin-sdk/channel-message` 存在後，引導 Plugin 作者使用它。

## 與通道回合的關係

`runtime.channel.turn.*` 應在遷移期間保留。

它應成為相容性轉接器：

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

在所有內建 plugins 與已知第三方相容性路徑都橋接完成後，即可淘汰 `channel.turn`。在有已發布的 SDK 遷移路徑，以及證明舊 plugins 仍能運作或以清楚版本錯誤失敗的合約測試之前，不應移除它。

## 相容性護欄

遷移期間，對於現有傳遞回呼除了「傳送此承載」以外還有副作用的任何通道，通用持久傳遞都必須選擇啟用。

舊版進入點預設為非持久：

- `channel.turn.run` 與 `dispatchAssembledChannelTurn` 使用通道的傳遞回呼，除非該通道明確提供已稽核的持久性政策/選項物件。
- `channel.turn.runPrepared` 保持由通道擁有，直到已準備的分派器明確呼叫傳送情境。
- 公開相容性輔助程式，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase`，以及直接 DM 輔助程式，在呼叫端提供的 `deliver` 或 `reply` 回呼之前，絕不注入通用持久傳遞。

對於遷移橋接型別，`durable: undefined` 表示「非持久」。持久路徑只有透過明確的政策/選項值才會啟用。`durable:
false` 可作為相容性拼法保留，但實作不應要求每個尚未遷移的通道都加入它。

目前的橋接程式碼必須保持持久性決策明確：

- 持久最終遞送會回傳可辨別聯集狀態。`handled_visible` 和
  `handled_no_send` 是終止狀態；`unsupported` 和 `not_applicable` 可以
  回退到由通道擁有的遞送；`failed` 會傳遞傳送失敗。
- 通用持久最終遞送受轉接器能力控管，例如
  靜默遞送、回覆目標保留、原生引用保留，以及
  訊息傳送掛鉤。若缺少同等行為，應選擇由通道擁有的遞送，
  而不是會改變使用者可見行為的通用傳送。
- 以佇列支援的持久傳送會公開遞送意圖參照。現有
  `pendingFinalDelivery*` 工作階段欄位可以在轉換期間攜帶意圖 id；
  最終狀態是 `MessageSendIntent` 儲存，而不是凍結的
  回覆文字加上臨時脈絡欄位。

在下列全部為 true 之前，不要為通道啟用通用持久路徑：

- 通用傳送轉接器會執行與舊直接路徑相同的算繪與傳輸行為。
- 本機傳送後副作用會透過傳送脈絡保留。
- 轉接器會回傳收據或遞送結果，且包含所有平台訊息 id。
- 已準備的分派器路徑要麼呼叫新的傳送脈絡，要麼持續記錄為不在持久保證範圍內。
- 回退遞送會處理每個投影後的承載，而不只是第一個。
- 持久回退遞送會將整個投影後承載陣列記錄為一個可重播意圖或批次計畫。

需要保留的具體遷移風險：

- iMessage 監控器遞送會在成功傳送後，將已傳送訊息記錄在 echo 快取中。持久最終傳送仍必須填入該快取，否則 OpenClaw 可能會將自己的最終回覆重新擷取為傳入使用者訊息。
- Tlon 會附加可選的模型簽章，並在群組回覆後記錄已參與的討論串。通用持久遞送不得略過這些效果；要麼將它們移入 Tlon 算繪/傳送/完成轉接器，要麼讓 Tlon 維持在由通道擁有的路徑。
- Discord 和其他已準備的分派器已經擁有直接遞送與預覽行為。除非其已準備的分派器明確透過傳送脈絡路由最終訊息，否則它們不受組裝回合持久保證涵蓋。
- Telegram 靜默回退遞送必須遞送完整的投影後承載陣列。單一承載捷徑可能會在投影後丟棄額外的回退承載。
- LINE、Zalo、Nostr，以及其他現有組裝/輔助路徑可能
  具有回覆權杖處理、媒體代理、已傳送訊息快取、載入/狀態
  清理，或僅回呼目標。在這些語義由傳送轉接器表示並經測試驗證之前，
  它們會維持在由通道擁有的遞送。
- 直接 DM 輔助程式可能有一個回覆回呼，且它是唯一正確的傳輸
  目標。通用對外傳送不得從 `OriginatingTo` 或 `To` 猜測並略過
  該回呼。
- OpenClaw Gateway 失敗輸出必須維持讓人類可見，但標記為
  bot 所撰寫的聊天室 echo 必須在 `allowBots` 授權之前丟棄。
  通道不得以可見文字前綴篩選器實作這點，除非作為
  短期緊急權宜措施；持久合約是結構化來源中繼資料。

## 內部儲存

持久佇列應儲存訊息傳送意圖，而不是回覆承載。

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

佇列應保留足夠的身分資訊，以便在重新啟動後透過相同的帳號、
討論串、目標、格式化政策與媒體規則重播。

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
- 除非存在算繪回退，否則不要重試 `invalid_payload`。
- 在設定變更之前，不要重試 `auth` 或 `permission`。
- 對於 `not_found`，當通道宣告安全時，讓即時完成從編輯回退到全新傳送。
- 對於 `conflict`，使用收據/idempotency 規則判斷訊息是否已存在。
- 在轉接器可能已完成平台 I/O 之後、收據提交之前發生的任何錯誤，除非轉接器能證明平台操作並未發生，否則都會變成 `unknown_after_send`。

## 通道對應

| 通道         | 目標遷移                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | 接收確認政策加上持久化的最終傳送。即時配接器負責傳送與編輯預覽、過期預覽的最終傳送、主題、引用回覆預覽略過、媒體備援，以及 retry-after 處理。                                                                                                                                                                   |
| Discord         | 傳送配接器包裝現有的持久化酬載傳遞。即時配接器負責草稿編輯、進度草稿、媒體/錯誤預覽取消、回覆目標保留，以及訊息 ID 回執。稽核共用聊天室中由 bot 產生的 Gateway 失敗回音；如果 Discord 無法在一般訊息上承載來源中繼資料，請使用出站登錄表或其他原生等效機制。 |
| Slack           | 傳送配接器處理一般聊天貼文。當執行緒形態支援時，即時配接器選擇原生串流，否則使用草稿預覽。回執會保留執行緒時間戳。來源配接器將 OpenClaw Gateway 失敗對應到 Slack `chat.postMessage.metadata`，並在 `allowBots` 授權之前丟棄已標記的 bot 聊天室回音。                                  |
| WhatsApp        | 傳送配接器負責文字/媒體傳送與持久化的最終意圖。接收配接器處理群組提及與傳送者身分。即時配接器可以暫時不存在，直到 WhatsApp 擁有可編輯的傳輸。                                                                                                                                                                        |
| Matrix          | 即時配接器負責草稿事件編輯、最終化、遮除、加密媒體限制，以及回覆目標不相符備援。接收配接器負責加密事件補水與去重。來源配接器應將 OpenClaw Gateway 失敗來源編碼到 Matrix 事件內容中，並在 `allowBots` 處理之前丟棄已設定 bot 的聊天室回音。              |
| Mattermost      | 即時配接器負責單一草稿貼文、進度/工具摺疊、就地最終化，以及全新傳送備援。                                                                                                                                                                                                                                                       |
| Microsoft Teams | 即時配接器負責原生進度與區塊串流行為。傳送配接器負責活動與附件/卡片回執。                                                                                                                                                                                                                                        |
| Feishu          | 算繪配接器負責文字/卡片/原始算繪。即時配接器負責串流卡片與重複最終內容抑制。傳送配接器負責留言、主題工作階段、媒體，以及語音抑制。                                                                                                                                                                      |
| QQ Bot          | 即時配接器負責 C2C 串流、累加器逾時，以及備援最終傳送。算繪配接器負責媒體標籤與文字轉語音。                                                                                                                                                                                                                               |
| Signal          | 簡單接收加上傳送配接器。除非 signal-cli 加入可靠的編輯支援，否則不使用即時配接器。                                                                                                                                                                                                                                                                |
| iMessage        | 簡單接收加上傳送配接器。在持久化最終內容可以略過監視器傳遞之前，iMessage 傳送必須保留監視器回音快取填入。                                                                                                                                                                                                                 |
| Google Chat     | 簡單接收加上傳送配接器，執行緒關聯對應到空間與執行緒 ID。稽核 `allowBots=true` 聊天室對已標記 OpenClaw Gateway 失敗回音的行為。                                                                                                                                                                                        |
| LINE            | 簡單接收加上傳送配接器，回覆權杖限制建模為目標/關聯能力。                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 接收橋接加上傳送配接器。                                                                                                                                                                                                                                                                                                                          |
| IRC             | 簡單接收加上傳送配接器，沒有持久化編輯回執。                                                                                                                                                                                                                                                                                                    |
| Nostr           | 加密私訊的接收加上傳送配接器；回執是事件 ID。                                                                                                                                                                                                                                                                                           |
| QA 通道      | 接收、傳送、即時、重試與復原行為的合約測試配接器。                                                                                                                                                                                                                                                                                   |
| Synology Chat   | 簡單接收加上傳送配接器。                                                                                                                                                                                                                                                                                                                              |
| Tlon            | 在啟用通用持久化最終傳遞之前，傳送配接器必須保留模型簽章算繪與已參與執行緒追蹤。                                                                                                                                                                                                                        |
| Twitch          | 簡單接收加上傳送配接器，具備速率限制分類。                                                                                                                                                                                                                                                                                               |
| Zalo            | 簡單接收加上傳送配接器。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | 簡單接收加上傳送配接器。                                                                                                                                                                                                                                                                                                                              |

## 遷移計畫

### 第 1 階段：內部訊息領域

- 新增 `src/channels/message/*` 型別，用於訊息、目標、關聯、
  來源、回執、能力、持久化意圖、接收內容脈絡、傳送
  內容脈絡、即時內容脈絡，以及失敗類別。
- 將 `origin?: MessageOrigin` 加入目前回覆傳遞使用的遷移橋接酬載型別，
  然後隨著重構取代回覆酬載，將該欄位移到 `ChannelMessage` 和算繪後的
  訊息型別。
- 在配接器與測試證明其形態之前，將其保持為內部使用。
- 為狀態轉換與序列化加入純單元測試。

### 第 2 階段：持久化傳送核心

- 將現有出站佇列從回覆酬載持久化移到持久化的
  訊息傳送意圖。
- 讓持久化傳送意圖承載投影後的酬載陣列或批次計畫，而不
  只是單一回覆酬載。
- 透過相容性轉換保留目前的佇列復原行為。
- 讓 `deliverOutboundPayloads` 呼叫 `messages.send`。
- 在配接器宣告重播安全之後，讓最終傳送持久化成為預設值，並在新的訊息生命週期中無法寫入持久化意圖時封閉失敗。現有的通道回合與 SDK 相容性路徑在此階段預設仍維持直接傳送。
- 一致地記錄回執。
- 將回執與傳遞結果回傳給原始分派器呼叫端，而不是將持久化傳送視為終止性的副作用。
- 透過持久化傳送意圖保留訊息來源，讓復原、重播與
  分塊傳送保留 OpenClaw 操作來源。

### 第 3 階段：通道回合橋接

- 在 `messages.receive` 和 `messages.send` 之上重新實作
  `channel.turn.run` 與 `dispatchAssembledChannelTurn`。
- 保持目前的事實型別穩定。
- 預設保留舊有行為。只有當配接器明確選擇加入具備重播安全性的持久化政策時，組裝回合通道才會變為持久化。
- 將 `durable: false` 保留為相容性逃生口，用於最終化原生編輯且尚無法安全重播的路徑，但不要依賴 `false` 標記來保護尚未遷移的通道。
- 只有在新的訊息生命週期中，且通道對應證明通用傳送路徑保留舊通道傳遞語意之後，才預設組裝回合持久化。

### 第 4 階段：已準備分派器橋接

- 將 `deliverDurableInboundReplyPayload` 替換為傳送情境橋接。
- 保留舊 helper 作為 wrapper。
- 先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因為
  它們已有 durable-final 工作或較簡單的傳送路徑。
- 在每個已準備的 dispatcher 明確選擇加入傳送情境之前，都將其視為未涵蓋。
  文件與 changelog 項目必須說「已組裝的頻道回合」，或指名已遷移的頻道路徑，
  而不是宣稱所有自動最終回覆。
- 保持 `recordInboundSessionAndDispatchReply`、direct-DM helpers，以及類似的
  公開相容性 helpers 行為不變。它們日後可以公開明確的傳送情境選擇加入，
  但不得在呼叫端擁有的 delivery callback 之前，自動嘗試通用 durable delivery。

### 階段 5：統一的即時生命週期

- 建置 `messages.live`，並提供兩個 proof adapters：
  - Telegram：用於傳送、編輯，以及過期最終傳送。
  - Matrix：用於草稿完成與 redact 後援。
- 接著遷移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每個頻道都有同等測試後，才刪除重複的預覽完成程式碼。

### 階段 6：公開 SDK

- 新增 `openclaw/plugin-sdk/channel-message`。
- 將其記錄為偏好的頻道 Plugin API。
- 更新套件 exports、entrypoint inventory、產生的 API baselines，以及
  Plugin SDK 文件。
- 在 channel-message SDK 表面納入 `MessageOrigin`、origin encode/decode hooks，
  以及共用的 `shouldDropOpenClawEcho` predicate。
- 保留舊 subpaths 的相容性 wrappers。
- 在隨附 Plugin 都已遷移後，於文件中將以 reply 命名的 SDK helpers 標記為 deprecated。

### 階段 7：所有傳送者

將所有非回覆的 outbound producers 移到 `messages.send`：

- cron 與 heartbeat 通知
- 任務完成
- hook 結果
- approval prompts 與 approval results
- message tool 傳送
- subagent 完成公告
- 明確的 CLI 或 Control UI 傳送
- automation/broadcast 路徑

這是模型停止作為「agent 回覆」，並成為「OpenClaw 傳送訊息」的地方。

### 階段 8：淘汰 Turn

- 保留 `channel.turn` 作為 wrapper，至少維持一個相容性窗口。
- 發布遷移說明。
- 針對舊 imports 執行 Plugin SDK 相容性測試。
- 只有在沒有隨附 Plugin 需要它們，且第三方合約已有穩定替代方案後，
  才移除或隱藏舊的內部 helpers。

## 測試計畫

單元測試：

- Durable send intent 序列化與復原。
- Idempotency key 重用與重複抑制。
- Receipt commit 與 replay skip。
- 當 adapter 支援 reconciliation 時，`unknown_after_send` 復原會在 replay 前先 reconcile。
- 失敗分類政策。
- Receive ack policy sequencing。
- reply、followup、system 和 broadcast sends 的 relation mapping。
- Gateway-failure origin factory 與 `shouldDropOpenClawEcho` predicate。
- origin 在 payload normalization、chunking、durable queue serialization，以及 recovery 中的保留。

整合測試：

- `channel.turn.run` simple adapter 仍會記錄並傳送。
- 舊版 assembled-turn delivery 不會變成 durable，除非該頻道明確選擇加入。
- `channel.turn.runPrepared` bridge 仍會記錄並完成。
- 公開相容性 helpers 預設會呼叫呼叫端擁有的 delivery callbacks，
  且不會在這些 callbacks 之前進行 generic-send。
- Durable fallback delivery 在重新啟動後會 replay 整個 projected payload array，
  且不能在早期 crash 後留下後續 payloads 未記錄。
- Durable assembled-turn delivery 會將平台 message ids 回傳給 buffered dispatcher。
- 當 durable delivery 停用或不可用時，custom delivery hooks 仍會回傳平台 message ids。
- 最終回覆在 assistant completion 與平台傳送之間重新啟動後仍能保留。
- Preview draft 在允許時就地完成。
- 當 media/error/reply-target mismatch 需要一般 delivery 時，preview draft 會被取消或 redacted。
- Block streaming 和 preview streaming 不會同時 delivery 相同文字。
- 早期 streaming 的 media 不會在最終 delivery 中重複。

頻道測試：

- Telegram topic reply 搭配 polling ack，延遲到 receive context 的 safe completed watermark。
- Telegram polling recovery 針對已接受但未 delivery updates，由持久化 safe-completed offset model 涵蓋。
- Telegram stale preview 會傳送新的 final 並清理 preview。
- Telegram silent fallback 會傳送每個 projected fallback payload。
- Telegram silent fallback durability 會原子地記錄完整 projected fallback array，
  而不是在每次 loop iteration 記錄單一 single-payload durable intent。
- Discord 在 media/error/explicit reply 時取消 preview。
- Discord prepared dispatcher finals 會先透過傳送情境路由，
  文件或 changelog 才能宣稱 Discord final-reply durability。
- iMessage durable final sends 會填入 monitor sent-message echo cache。
- LINE、Zalo 和 Nostr 舊版 delivery paths 在其 adapter parity tests 存在之前，
  不會被 generic durable send 繞過。
- Direct-DM/Nostr callback delivery 仍是權威，除非已明確遷移到完整 message target
  與 replay-safe send adapter。
- Slack 帶標籤的 OpenClaw gateway failure messages 仍維持可見 outbound，
  帶標籤的 bot-room echoes 會在 `allowBots` 前 drop，而具有相同可見文字的
  未標籤 bot messages 仍遵循一般 bot authorization。
- Slack native stream fallback 會在 top-level DMs 中 fallback 到 draft preview。
- Matrix preview finalization 與 redaction fallback。
- Matrix 來自已設定 bot accounts、帶標籤的 OpenClaw gateway-failure room echoes
  會在 `allowBots` handling 前 drop。
- Discord 與 Google Chat shared-room gateway-failure cascade audits 會涵蓋
  `allowBots` modes，然後才宣稱那裡有 generic protection。
- Mattermost draft finalization 與 fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final sends 會保留 model-signature rendering 與 participated thread tracking。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal simple durable final sends。

驗證：

- 開發期間使用目標 Vitest 檔案。
- 在 Testbox 中針對完整變更表面執行 `pnpm check:changed`。
- 在落地完整 refactor 前，或公開 SDK/export 變更後，在 Testbox 中執行更廣泛的
  `pnpm check`。
- 在移除相容性 wrappers 前，至少針對一個支援編輯的頻道與一個簡單 send-only 頻道，
  進行 live 或 qa-channel smoke。

## 未決問題

- Telegram 是否最終應以完全 durable polling source 取代 grammY runner source，
  讓它能控制平台層級 redelivery，而不只是 OpenClaw 的持久化 restart watermark。
- durable live preview state 應儲存在與 final send intent 相同的 queue record，
  還是儲存在 sibling live-state store。
- `plugin-sdk/channel-message` 發布後，相容性 wrappers 要繼續記錄在文件中多久。
- 第三方 Plugin 是否應直接實作 receive adapters，還是只透過
  `defineChannelMessageAdapter` 提供 normalize/send/live hooks。
- 哪些 receipt fields 可以安全公開在公開 SDK 中，哪些屬於 internal runtime state。
- self-echo caches 與 participated-thread markers 這類 side effects 應建模為
  send-context hooks、adapter-owned finalize steps，還是 receipt subscribers。
- 哪些頻道有 native origin metadata、哪些需要持久化 outbound registries，
  以及哪些無法提供可靠的 cross-bot echo suppression。

## 驗收標準

- 每個隨附訊息頻道都會透過 `messages.send` 傳送最終可見輸出。
- 每個 inbound message channel 都會透過 `messages.receive` 或已記錄的相容性 wrapper 進入。
- 每個 preview/edit/stream channel 都會使用 `messages.live` 進行 draft state 與 finalization。
- `channel.turn` 只是 wrapper。
- 以 reply 命名的 SDK helpers 是相容性 exports，而不是建議路徑。
- Durable recovery 可以在重新啟動後 replay pending final sends，而不遺失最終回應或重複已 committed sends；
  platform outcome unknown 的 sends 會在 replay 前 reconcile，或在該 adapter 文件中記錄為 at-least-once。
- 當 durable intent 無法寫入時，durable final sends 會 fail closed，
  除非呼叫端明確選擇已記錄的 non-durable mode。
- Legacy channel-turn 與 SDK 相容性 helpers 預設為直接的 channel-owned delivery；
  generic durable send 只能明確 opt-in。
- Receipts 會保留 multi-part deliveries 的所有平台 message ids，
  以及用於 threading/edit convenience 的 primary id。
- Durable wrappers 會在替換 direct delivery callbacks 前保留 channel-local side effects。
- Prepared dispatchers 在其 final delivery path 明確使用傳送情境前，不會被計為 durable。
- Fallback delivery 會處理每個 projected payload。
- Durable fallback delivery 會將每個 projected payload 記錄在一個可 replay 的 intent 或 batch plan 中。
- OpenClaw-originated gateway failure output 對人類可見，但在宣告支援 origin contract 的頻道上，
  帶標籤且由 bot 撰寫的 room echoes 會在 bot authorization 前被 drop。
- 文件會說明 send、receive、live、state、receipts、relations、failure policy、migration，
  以及 test coverage。

## 相關

- [Messages](/zh-TW/concepts/messages)
- [Streaming and chunking](/zh-TW/concepts/streaming)
- [Progress drafts](/zh-TW/concepts/progress-drafts)
- [Retry policy](/zh-TW/concepts/retry)
- [Channel turn kernel](/zh-TW/plugins/sdk-channel-turn)
