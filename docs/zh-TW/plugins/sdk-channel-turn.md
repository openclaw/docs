---
read_when:
    - 你正在建置通道 Plugin，並想使用共用的傳入回合生命週期
    - 你正在將通道監視器從手寫的記錄/分派黏合邏輯遷移出去
    - 你需要了解准入、擷取、分類、預檢、解析、記錄、分派與收尾各階段
sidebarTitle: Channel turn
summary: runtime.channel.turn -- 內建與第三方通道 Plugin 用來記錄、分派並完成代理回合的共用傳入回合核心
title: 通道回合核心
x-i18n:
    generated_at: "2026-05-10T19:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

頻道回合核心是共用的入站狀態機，會將正規化的平台事件轉換為代理程式回合。頻道 Plugin 提供平台事實與傳遞回呼。核心負責編排：擷取、分類、前置檢查、解析、授權、組裝、記錄、分派與完成。

當你的 Plugin 位於入站訊息熱路徑時，請使用此功能。對於非訊息事件（斜線命令、模態視窗、按鈕互動、生命週期事件、反應、語音狀態），請將它們保留在 Plugin 本地。核心只負責可能成為代理程式文字回合的事件。

<Info>
  核心會透過注入的 Plugin 執行階段以 `runtime.channel.turn.*` 觸達。Plugin 執行階段型別會從 `openclaw/plugin-sdk/core` 匯出，因此第三方原生 Plugin 可以像內建頻道 Plugin 一樣使用這些進入點。
</Info>

## 為什麼需要共用核心

頻道 Plugin 會重複相同的入站流程：正規化、路由、閘控、建立內容脈絡、記錄工作階段中繼資料、分派代理程式回合、完成傳遞狀態。若沒有共用核心，提及閘控、僅工具可見回覆、工作階段中繼資料、待處理歷史，或分派完成處理的變更，都必須逐一套用到每個頻道。

核心刻意將四個概念分開：

- `ConversationFacts`：訊息來自何處
- `RouteFacts`：哪個代理程式與工作階段應處理它
- `ReplyPlanFacts`：可見回覆應送往何處
- `MessageFacts`：代理程式應看到的本文與補充內容脈絡

Slack 私訊、Telegram 主題、Matrix 執行緒，以及 Feishu 主題工作階段在實務上都會區分這些概念。將它們視為同一個識別碼，會隨時間造成偏移。

## 階段生命週期

無論頻道為何，核心都會執行相同的固定管線：

1. `ingest` -- 配接器將原始平台事件轉換為 `NormalizedTurnInput`
2. `classify` -- 配接器宣告此事件是否能啟動代理程式回合
3. `preflight` -- 配接器執行去重、自我回音、補水、防抖、解密、部分事實預填
4. `resolve` -- 配接器回傳完整組裝的回合（路由、回覆計畫、訊息、傳遞）
5. `authorize` -- 將私訊、群組、提及與命令政策套用到已組裝的事實
6. `assemble` -- 透過 `buildContext` 依事實建立 `FinalizedMsgContext`
7. `record` -- 持久化入站工作階段中繼資料與最後路由
8. `dispatch` -- 透過緩衝區塊調度器執行代理程式回合
9. `finalize` -- 即使分派發生錯誤，仍會執行配接器的 `onFinalize`

供應 `log` 回呼時，每個階段都會發出結構化記錄事件。請參閱[可觀測性](#observability)。

## 准入種類

當回合被閘控時，核心不會擲出錯誤。它會回傳 `ChannelTurnAdmission`：

| 種類          | 時機                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 回合被准入。代理程式回合會執行，且可見回覆路徑會被使用。                                                                   |
| `observeOnly` | 回合會端到端執行，但傳遞配接器不會送出任何可見內容。用於廣播觀察者代理程式和其他被動多代理程式流程。 |
| `handled`     | 平台事件已在本地消耗（生命週期、反應、按鈕、模態視窗）。核心會略過分派。                                           |
| `drop`        | 略過路徑。可選的 `recordHistory: true` 會將訊息保留在待處理群組歷史中，讓未來的提及有內容脈絡。                      |

准入可以來自 `classify`（事件類別表示它無法啟動回合）、來自 `preflight`（去重、自我回音、缺少提及但記錄歷史），或來自 `resolveTurn` 本身。

## 進入點

執行階段公開三個偏好的進入點，讓配接器能在符合頻道的層級選擇加入。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

兩個較舊的執行階段輔助函式仍可用於 Plugin SDK 相容性：

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

當你的頻道可以將其入站流程表達為 `ChannelTurnAdapter<TRaw>` 時，請使用此進入點。配接器提供 `ingest`、選用的 `classify`、選用的 `preflight`、必要的 `resolveTurn`，以及選用的 `onFinalize` 回呼。

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

當頻道只有小量配接器邏輯，並且能透過掛鉤掌握生命週期時，`run` 是正確的形狀。

### runAssembled

當頻道已解析路由、建立 `FinalizedMsgContext`，且只需要共用的記錄、回覆管線、分派與完成處理順序時，請使用此進入點。對於簡單的內建入站路徑，若不使用它就會重複 `createChannelMessageReplyPipeline(...)` 和 `runPrepared(...)` 樣板，這是偏好的形狀。

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

當唯一由頻道擁有的分派行為是最終酬載傳遞，加上選用的輸入中狀態、回覆選項、耐久傳遞或錯誤記錄時，請選擇 `runAssembled` 而不是 `runPrepared`。

### runPrepared

當頻道有複雜的本地調度器，包含預覽、重試、編輯或執行緒啟動程序，而且必須維持由頻道擁有時，請使用此進入點。核心仍會在分派前記錄入站工作階段，並公開一致的 `DispatchedChannelTurnResult`。

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

豐富頻道（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）使用 `runPrepared`，因為它們的調度器會編排核心不應理解的平台特定行為。

### buildContext

這是一個純函式，會將事實組合對應為 `FinalizedMsgContext`。當你的頻道手動實作管線的一部分，但希望內容脈絡形狀保持一致時，請使用它。

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

在 `resolveTurn` 回呼內為 `run` 組裝回合時，`buildContext` 也很有用。

<Note>
  已棄用的 SDK 輔助函式，例如 `dispatchInboundReplyWithBase`，仍會透過已組裝回合輔助函式銜接。新的 Plugin 程式碼應使用 `run` 或 `runPrepared`。
</Note>

## 事實型別

核心從你的配接器消耗的事實與平台無關。請先將平台物件轉換為這些形狀，再交給核心。

### NormalizedTurnInput

| 欄位             | 用途                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 用於去重與記錄的穩定訊息 ID                                   |
| `timestamp`       | 選用的 epoch 毫秒                                                            |
| `rawText`         | 從平台收到的本文                                           |
| `textForAgent`    | 選用的代理程式清理後本文（移除提及、修剪輸入中狀態）             |
| `textForCommands` | 選用的本文，用於 `/command` 解析                                    |
| `raw`             | 選用的透傳參照，供需要原始物件的配接器回呼使用 |

### ChannelEventClass

| 欄位                  | 用途                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | 若為 false，核心會回傳 `{ kind: "handled" }`                       |
| `requiresImmediateAck` | 給需要在分派前 ACK 的配接器的提示                      |

### SenderFacts

| 欄位          | 用途                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 穩定的平台傳送者 ID                                      |
| `name`         | 顯示名稱                                                   |
| `username`     | 若與 `name` 不同，則為帳號名稱                                 |
| `tag`          | Discord 樣式的辨識碼或平台標籤                    |
| `roles`        | 角色 ID，用於成員角色允許清單比對              |
| `isBot`        | 傳送者是已知機器人時為 true（核心用於丟棄） |
| `isSelf`       | 傳送者是已設定的代理程式本身時為 true            |
| `displayLabel` | 用於信封文字的預先算繪標籤                           |

### ConversationFacts

| 欄位             | 用途                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`、`group` 或 `channel`                                      |
| `id`              | 用於路由的對話 ID                                     |
| `label`           | 信封的人類可讀標籤                                         |
| `spaceId`         | 選用的外層空間識別碼（Slack 工作區、Matrix homeserver） |
| `parentId`        | 當這是執行緒時的外層對話 ID                          |
| `threadId`        | 此訊息位於執行緒內時的執行緒 ID                       |
| `nativeChannelId` | 與路由 ID 不同時的平台原生頻道 ID        |
| `routePeer`       | 用於 `resolveAgentRoute` 查詢的對等方                             |

### RouteFacts

| 欄位                    | 用途                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 應處理此輪的代理程式                                      |
| `accountId`             | 選用覆寫值（多帳號通道）                                  |
| `routeSessionKey`       | 用於路由的工作階段金鑰                                    |
| `dispatchSessionKey`    | 與路由金鑰不同時，在分派時使用的工作階段金鑰              |
| `persistedSessionKey`   | 寫入持久化工作階段中繼資料的工作階段金鑰                  |
| `parentSessionKey`      | 分支/串接工作階段的父項                                   |
| `modelParentSessionKey` | 分支工作階段在模型端的父項                                |
| `mainSessionKey`        | 直接對話的主要 DM 擁有者釘選                              |
| `createIfMissing`       | 允許記錄步驟建立遺失的工作階段列                          |

### ReplyPlanFacts

| 欄位                      | 用途                                                   |
| ------------------------- | ------------------------------------------------------ |
| `to`                      | 寫入內容脈絡 `To` 的邏輯回覆目標                      |
| `originatingTo`           | 來源內容脈絡目標（`OriginatingTo`）                    |
| `nativeChannelId`         | 用於遞送的平台原生通道 id                              |
| `replyTarget`             | 若與 `to` 不同，則為最終可見回覆目的地                 |
| `deliveryTarget`          | 較低階的遞送覆寫值                                     |
| `replyToId`               | 引用/錨定的訊息 id                                     |
| `replyToIdFull`           | 平台同時具備兩者時的完整形式引用 id                    |
| `messageThreadId`         | 遞送時的執行緒 id                                      |
| `threadParentId`          | 執行緒的父訊息 id                                      |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct` 或 `none`       |

### AccessFacts

`AccessFacts` 會攜帶授權階段需要的布林值。身分比對留在通道中：核心只取用結果。

| 欄位       | 用途                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `dm`       | DM 允許/配對/拒絕決策與 `allowFrom` 清單                                |
| `group`    | 群組政策、路由允許、傳送者允許、允許清單、提及要求                      |
| `commands` | 跨已設定授權器的命令授權                                                |
| `mentions` | 是否可偵測提及，以及代理程式是否被提及                                  |

### MessageFacts

| 欄位             | 用途                                                       |
| ---------------- | ---------------------------------------------------------- |
| `body`           | 最終信封本文（已格式化）                                  |
| `rawBody`        | 原始傳入本文                                              |
| `bodyForAgent`   | 代理程式看到的本文                                        |
| `commandBody`    | 用於命令剖析的本文                                        |
| `envelopeFrom`   | 信封的預先算繪傳送者標籤                                  |
| `senderLabel`    | 已算繪傳送者的選用覆寫值                                  |
| `preview`        | 用於記錄的簡短遮罩預覽                                    |
| `inboundHistory` | 通道保留緩衝區時的近期傳入歷史項目                        |

### SupplementalContextFacts

補充內容脈絡涵蓋引用、轉寄與執行緒啟動內容脈絡。核心會套用已設定的 `contextVisibility` 政策。通道配接器只提供事實與 `senderAllowed` 旗標，讓跨通道政策保持一致。

### InboundMediaFacts

媒體會以事實形式呈現。平台下載、驗證、SSRF 政策、CDN 規則與解密仍保留在通道本地。核心會將事實對應到 `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes` 與 `MediaTranscribedIndexes`。

## 配接器合約

對於完整的 `run`，配接器形式如下：

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

`resolveTurn` 會回傳 `ChannelTurnResolved`，也就是帶有選用准入種類的 `AssembledChannelTurn`。回傳 `{ admission: { kind: "observeOnly" } }` 會執行該輪，但不產生可見輸出。配接器仍擁有遞送回呼；它只是在該輪中變成 no-op。

`onFinalize` 會在每個結果上執行，包括分派錯誤。可用它清除待處理的群組歷史、移除 ack 反應、停止狀態指示器，並清空本地狀態。

## 遞送配接器

核心不會直接呼叫平台。通道會把 `ChannelTurnDeliveryAdapter` 交給核心：

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

每個已緩衝的回覆片段都會呼叫一次 `deliver`。在訊息生命週期遷移期間，已組裝的通道輪次遞送預設由通道擁有：省略 `durable` 欄位表示核心必須直接呼叫 `deliver`，且不得透過一般出站遞送進行路由。只有在通道已完成稽核，證明一般傳送路徑會保留舊有遞送行為時，才設定 `durable`，包括回覆/執行緒目標、媒體處理、已傳送訊息/自我回音快取、狀態清理，以及回傳的訊息 id。`durable: false` 仍是「使用通道擁有的回呼」的相容寫法，但尚未遷移的通道不應需要新增它。當通道有平台訊息 id 時請回傳，讓分派器能保留執行緒錨點並編輯後續片段；較新的遞送路徑也應回傳 `receipt`，讓復原、預覽最終化與重複抑制可從 `messageIds` 移出。對於僅觀察輪次，回傳 `{ visibleReplySent: false }` 或使用 `createNoopChannelTurnDeliveryAdapter()`。

使用 `runPrepared` 且具備完全由通道擁有之分派器的通道，不會有 `ChannelTurnDeliveryAdapter`。這些分派器預設並非持久化。它們應保留直接遞送路徑，直到明確選擇採用新的傳送內容脈絡，並具備完整目標、可安全重放的配接器、收據合約與通道副作用掛鉤。

公開相容性輔助工具，例如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 與直接 DM 輔助工具，在遷移期間必須保持行為不變。它們不應在呼叫者擁有的 `deliver` 或 `reply` 回呼之前呼叫一般持久化遞送。

## 記錄選項

記錄階段會包裝 `recordInboundSession`。大多數通道可以使用預設值。透過 `record` 覆寫：

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

分派器會等待記錄階段。如果記錄擲出錯誤，核心會執行 `onPreDispatchFailure`（在提供給 `runPrepared` 時），然後重新擲出。

## 可觀測性

提供 `log` 回呼時，每個階段都會發出結構化事件：

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

已記錄的階段：`ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。避免記錄原始本文；使用 `MessageFacts.preview` 作為簡短遮罩預覽。

## 保留在通道本地的內容

核心擁有編排。通道仍擁有：

- 平台傳輸（Gateway、REST、websocket、polling、webhooks）
- 身分解析與顯示名稱比對
- 原生命令、斜線命令、自動完成、modal、按鈕、語音狀態
- card、modal 與 adaptive-card 算繪
- 媒體驗證、CDN 規則、加密媒體、轉錄
- 編輯、反應、遮罩與 presence API
- 回填與平台端歷史擷取
- 需要平台特定驗證的配對流程

如果兩個通道開始需要其中某項的相同輔助工具，請抽出共用 SDK 輔助工具，而不是把它推進核心。

## 穩定性

`runtime.channel.turn.*` 是公開 Plugin 執行階段介面的一部分。事實型別（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）與准入形式（`ChannelTurnAdmission`、`ChannelEventClass`）可透過 `openclaw/plugin-sdk/core` 的 `PluginRuntime` 存取。

適用向後相容性規則：新的事實欄位是加成的、准入種類不會重新命名，而且進入點名稱保持穩定。需要非加成變更的新通道需求，必須經過 Plugin SDK 遷移流程。

## 相關

- [訊息生命週期重構](/zh-TW/concepts/message-lifecycle-refactor)：計畫中的傳送/接收/即時生命週期，將包裝此核心
- [建置通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)：更廣泛的通道 Plugin 合約
- [Plugin 執行階段輔助工具](/zh-TW/plugins/sdk-runtime)：其他 `runtime.*` 介面
- [Plugin 內部機制](/zh-TW/plugins/architecture-internals)：載入管線與登錄機制
