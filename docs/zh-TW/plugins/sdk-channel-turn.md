---
read_when:
    - 你正在建置通道 Plugin，且需要共用的傳入回合生命週期
    - 你正在將通道監控器遷離自行實作的記錄/分派黏合程式碼
    - 你需要了解准入、擷取、分類、預檢、解析、記錄、派發與完成等階段
sidebarTitle: Channel turn
summary: runtime.channel.turn -- bundled 和第三方 channel plugins 用來記錄、分派並完成 agent turns 的共用入站 turn kernel
title: 通道回合核心
x-i18n:
    generated_at: "2026-05-06T02:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

通道回合核心是共享的傳入狀態機，會將標準化的平台事件轉換成代理程式回合。通道 Plugin 提供平台事實與交付回呼。核心負責協調流程：擷取、分類、預檢、解析、授權、組裝、記錄、分派和完成。

當你的 Plugin 位於傳入訊息熱路徑時使用這個核心。對於非訊息事件（斜線命令、Modal、按鈕互動、生命週期事件、反應、語音狀態），請將它們保留在 Plugin 本地。核心只負責可能成為代理程式文字回合的事件。

<Info>
  核心會透過注入的 Plugin 執行階段以 `runtime.channel.turn.*` 觸達。Plugin 執行階段型別會從 `openclaw/plugin-sdk/core` 匯出，因此第三方原生 Plugin 可以像內建通道 Plugin 一樣使用這些進入點。
</Info>

## 為什麼需要共享核心

通道 Plugin 會重複相同的傳入流程：標準化、路由、閘控、建構上下文、記錄工作階段中繼資料、分派代理程式回合、完成交付狀態。如果沒有共享核心，對提及閘控、僅工具可見回覆、工作階段中繼資料、待處理歷史或分派完成流程的變更，都必須逐一套用到每個通道。

核心刻意將四個概念分開：

- `ConversationFacts`：訊息來自哪裡
- `RouteFacts`：應由哪個代理程式與工作階段處理
- `ReplyPlanFacts`：可見回覆應送往哪裡
- `MessageFacts`：代理程式應看到的本文與補充上下文

Slack 私訊、Telegram 主題、Matrix 執行緒與 Feishu 主題工作階段在實務上都會區分這些概念。將它們視為同一個識別碼，久而久之會造成偏移。

## 階段生命週期

無論通道為何，核心都會執行相同的固定管線：

1. `ingest` -- 配接器將原始平台事件轉換成 `NormalizedTurnInput`
2. `classify` -- 配接器宣告此事件是否可以開始代理程式回合
3. `preflight` -- 配接器執行去重、自我回音、補水、去抖、解密、部分事實預先填入
4. `resolve` -- 配接器傳回完整組裝的回合（路由、回覆計畫、訊息、交付）
5. `authorize` -- 將私訊、群組、提及與命令政策套用到已組裝的事實
6. `assemble` -- 透過 `buildContext` 由事實建構 `FinalizedMsgContext`
7. `record` -- 持久化傳入工作階段中繼資料與最後路由
8. `dispatch` -- 透過緩衝區塊分派器執行代理程式回合
9. `finalize` -- 即使分派發生錯誤，也會執行配接器 `onFinalize`

供應 `log` 回呼時，每個階段都會發出結構化日誌事件。請參閱[可觀測性](#observability)。

## 准入種類

當回合被閘控時，核心不會擲出錯誤。它會傳回 `ChannelTurnAdmission`：

| 種類          | 時機                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 回合已獲准。代理程式回合會執行，並且會行使可見回覆路徑。                                                                   |
| `observeOnly` | 回合會端到端執行，但交付配接器不會傳送任何可見內容。用於廣播觀察者代理程式與其他被動多代理程式流程。 |
| `handled`     | 平台事件已在本地消耗（生命週期、反應、按鈕、Modal）。核心會略過分派。                                           |
| `drop`        | 略過路徑。可選的 `recordHistory: true` 會將訊息保留在待處理群組歷史中，讓未來的提及具有上下文。                      |

准入可以來自 `classify`（事件類別表示它不能開始回合）、來自 `preflight`（去重、自我回音、缺少提及但記錄歷史），或來自 `resolveTurn` 本身。

## 進入點

執行階段會公開三個偏好的進入點，讓配接器能在符合通道的層級選擇加入。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

兩個較舊的執行階段輔助函式仍可供 Plugin SDK 相容性使用：

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

當你的通道可以將其傳入流程表達為 `ChannelTurnAdapter<TRaw>` 時使用。配接器具有 `ingest`、可選的 `classify`、可選的 `preflight`、必要的 `resolveTurn`，以及可選的 `onFinalize` 回呼。

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

當通道只有少量配接器邏輯，並且適合透過 Hook 擁有生命週期時，`run` 是正確的形狀。

### runPrepared

當通道具有複雜的本地分派器，包含預覽、重試、編輯或執行緒啟動程序，而且必須由通道擁有時使用。核心仍會在分派前記錄傳入工作階段，並公開一致的 `DispatchedChannelTurnResult`。

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

豐富通道（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）會使用 `runPrepared`，因為它們的分派器會協調核心不應了解的平台特定行為。

### buildContext

一個純函式，會將事實組合對應成 `FinalizedMsgContext`。當你的通道手動實作部分管線，但希望維持一致的上下文形狀時使用。

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

在為 `run` 組裝回合時，`buildContext` 也很適合在 `resolveTurn` 回呼內使用。

<Note>
  已棄用的 SDK 輔助函式，例如 `dispatchInboundReplyWithBase`，仍會透過已組裝回合輔助函式橋接。新的 Plugin 程式碼應使用 `run` 或 `runPrepared`。
</Note>

## 事實型別

核心從你的配接器取用的事實與平台無關。請先將平台物件轉換成這些形狀，再交給核心。

### NormalizedTurnInput

| 欄位             | 用途                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 用於去重與日誌的穩定訊息 ID                                   |
| `timestamp`       | 可選的 epoch 毫秒                                                            |
| `rawText`         | 從平台收到的本文                                           |
| `textForAgent`    | 可選的代理程式清理本文（移除提及、修剪輸入）             |
| `textForCommands` | 可選的本文，用於 `/command` 剖析                                    |
| `raw`             | 可選的傳遞參考，供需要原始物件的配接器回呼使用 |

### ChannelEventClass

| 欄位                  | 用途                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | 若為 false，核心會傳回 `{ kind: "handled" }`                       |
| `requiresImmediateAck` | 給需要在分派前 ACK 的配接器提示                      |

### SenderFacts

| 欄位          | 用途                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 穩定的平台傳送者 ID                                      |
| `name`         | 顯示名稱                                                   |
| `username`     | 若與 `name` 不同，則為帳號代稱                                 |
| `tag`          | Discord 風格的辨別碼或平台標籤                    |
| `roles`        | 角色 ID，用於成員角色允許清單比對              |
| `isBot`        | 傳送者是已知 Bot 時為 true（核心會用於丟棄） |
| `isSelf`       | 傳送者是已設定的代理程式本身時為 true            |
| `displayLabel` | 信封文字的預先算繪標籤                           |

### ConversationFacts

| 欄位             | 用途                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, 或 `channel`                                      |
| `id`              | 用於路由的對話 ID                                     |
| `label`           | 信封的人類可讀標籤                                         |
| `spaceId`         | 可選的外層空間識別碼（Slack 工作區、Matrix homeserver） |
| `parentId`        | 當這是執行緒時的外層對話 ID                          |
| `threadId`        | 此訊息位於執行緒內時的執行緒 ID                       |
| `nativeChannelId` | 與路由 ID 不同時的平台原生通道 ID        |
| `routePeer`       | 用於 `resolveAgentRoute` 查詢的對等端                             |

### RouteFacts

| 欄位                   | 用途                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 應處理此回合的代理程式                         |
| `accountId`             | 可選覆寫（多帳號通道）                 |
| `routeSessionKey`       | 用於路由的工作階段金鑰                               |
| `dispatchSessionKey`    | 與路由金鑰不同時，分派時使用的工作階段金鑰 |
| `persistedSessionKey`   | 寫入持久化工作階段中繼資料的工作階段金鑰          |
| `parentSessionKey`      | 分支/執行緒工作階段的父項                      |
| `modelParentSessionKey` | 分支工作階段的模型端父項                    |
| `mainSessionKey`        | 直接對話的主要私訊擁有者釘選                 |
| `createIfMissing`       | 允許記錄步驟建立缺少的工作階段資料列          |

### ReplyPlanFacts

| 欄位                      | 用途                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | 寫入情境 `To` 的邏輯回覆目標                           |
| `originatingTo`           | 起始情境目標（`OriginatingTo`）                         |
| `nativeChannelId`         | 用於傳遞的平台原生頻道 id                              |
| `replyTarget`             | 若不同於 `to`，則為最終可見回覆目的地                  |
| `deliveryTarget`          | 較低層級的傳遞覆寫                                     |
| `replyToId`               | 引用/錨定的訊息 id                                     |
| `replyToIdFull`           | 平台同時具備兩者時的完整形式引用 id                    |
| `messageThreadId`         | 傳遞時的討論串 id                                      |
| `threadParentId`          | 討論串的父訊息 id                                      |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct` 或 `none`        |

### AccessFacts

`AccessFacts` 攜帶授權階段所需的布林值。身分比對留在頻道中：核心只消費結果。

| 欄位       | 用途                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `dm`       | DM 允許/配對/拒絕決策與 `allowFrom` 清單                                |
| `group`    | 群組政策、路由允許、寄件者允許、允許清單、提及要求                      |
| `commands` | 跨已設定授權器的命令授權                                                |
| `mentions` | 是否可偵測提及，以及代理是否被提及                                      |

### MessageFacts

| 欄位             | 用途                                                    |
| ---------------- | ------------------------------------------------------- |
| `body`           | 最終信封內文（已格式化）                              |
| `rawBody`        | 原始傳入內文                                            |
| `bodyForAgent`   | 代理看見的內文                                          |
| `commandBody`    | 用於命令解析的內文                                      |
| `envelopeFrom`   | 信封預先算繪的寄件者標籤                                |
| `senderLabel`    | 算繪寄件者的選用覆寫                                    |
| `preview`        | 用於記錄的簡短已遮蔽預覽                                |
| `inboundHistory` | 頻道保留緩衝區時的近期傳入歷史項目                      |

### SupplementalContextFacts

補充情境涵蓋引用、轉寄與討論串啟動情境。核心會套用已設定的 `contextVisibility` 政策。頻道轉接器只提供事實與 `senderAllowed` 旗標，讓跨頻道政策保持一致。

### InboundMediaFacts

媒體採用事實形狀。平台下載、驗證、SSRF 政策、CDN 規則與解密都保留在頻道本地。核心會將事實映射為 `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes` 與 `MediaTranscribedIndexes`。

## 轉接器合約

完整 `run` 的轉接器形狀為：

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

`resolveTurn` 會回傳 `ChannelTurnResolved`，也就是帶有選用准入種類的 `AssembledChannelTurn`。回傳 `{ admission: { kind: "observeOnly" } }` 會執行該回合，但不產生可見輸出。轉接器仍然擁有傳遞回呼；它只是對該回合變成 no-op。

`onFinalize` 會在每個結果上執行，包括派送錯誤。用它清除待處理的群組歷史、移除確認反應、停止狀態指示器，並清空本地狀態。

## 傳遞轉接器

核心不會直接呼叫平台。頻道會交給核心一個 `ChannelTurnDeliveryAdapter`：

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

`deliver` 會針對每個已緩衝的回覆區塊呼叫一次。在訊息生命週期遷移期間，已組裝頻道回合的傳遞預設由頻道擁有：省略 `durable` 欄位表示核心必須直接呼叫 `deliver`，且不得經由通用傳出傳遞路由。只有在該頻道已稽核並證明通用傳送路徑會保留舊傳遞行為後，才設定 `durable`，包括回覆/討論串目標、媒體處理、已傳送訊息/自我回聲快取、狀態清理，以及回傳的訊息 id。`durable: false` 仍是「使用頻道擁有的回呼」的相容拼法，但尚未遷移的頻道不應需要新增它。當頻道有平台訊息 id 時請回傳，讓派送器可以保留討論串錨點並編輯後續區塊；較新的傳遞路徑也應回傳 `receipt`，讓復原、預覽完成化與重複抑制可以脫離 `messageIds`。對於僅觀察回合，請回傳 `{ visibleReplySent: false }` 或使用 `createNoopChannelTurnDeliveryAdapter()`。

使用 `runPrepared` 且具備完全由頻道擁有之派送器的頻道，沒有 `ChannelTurnDeliveryAdapter`。這些派送器預設不是 durable。它們應保留直接傳遞路徑，直到明確選擇加入新的傳送情境，並具備完整目標、可安全重播的轉接器、收據合約，以及頻道副作用鉤子。

公開相容性輔助工具，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 與 direct-DM 輔助工具，在遷移期間必須維持行為不變。它們不應在呼叫端擁有的 `deliver` 或 `reply` 回呼之前呼叫通用 durable 傳遞。

## 記錄選項

記錄階段會包裝 `recordInboundSession`。大多數頻道可以使用預設值。透過 `record` 覆寫：

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

派送器會等待記錄階段。如果記錄拋出錯誤，核心會執行 `onPreDispatchFailure`（當提供給 `runPrepared` 時）並重新拋出。

## 可觀測性

當提供 `log` 回呼時，每個階段都會發出結構化事件：

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

已記錄階段：`ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。避免記錄原始內文；使用 `MessageFacts.preview` 作為簡短的已遮蔽預覽。

## 保留在頻道本地的內容

核心擁有編排。頻道仍然擁有：

- 平台傳輸（Gateway、REST、websocket、polling、webhooks）
- 身分解析與顯示名稱比對
- 原生命令、斜線命令、自動完成、互動視窗、按鈕、語音狀態
- 卡片、互動視窗與 adaptive-card 算繪
- 媒體驗證、CDN 規則、加密媒體、轉錄
- 編輯、反應、遮蔽與在線狀態 API
- 回填與平台端歷史擷取
- 需要平台特定驗證的配對流程

如果兩個頻道開始需要同一個輔助工具來處理其中一項，請擷取共享 SDK 輔助工具，而不是把它推入核心。

## 穩定性

`runtime.channel.turn.*` 是公開 Plugin 執行階段介面的一部分。事實型別（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）與准入形狀（`ChannelTurnAdmission`、`ChannelEventClass`）可透過 `openclaw/plugin-sdk/core` 中的 `PluginRuntime` 存取。

適用向後相容性規則：新的事實欄位是加法式新增，准入種類不會重新命名，入口點名稱保持穩定。需要非加法式變更的新頻道需求，必須經過 Plugin SDK 遷移流程。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor)：說明計畫中將包裝此核心的傳送/接收/即時生命週期
- [建置頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins)：說明更廣泛的頻道 Plugin 合約
- [Plugin 執行階段輔助工具](/zh-TW/plugins/sdk-runtime)：說明其他 `runtime.*` 介面
- [Plugin 內部機制](/zh-TW/plugins/architecture-internals)：說明載入管線與登錄機制
