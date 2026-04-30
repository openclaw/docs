---
read_when:
    - 你正在建置一個通道 Plugin，並想使用共用的入站回合生命週期
    - 你正在將頻道監控器從手寫的記錄/分派黏合程式碼遷移出來
    - 你需要了解準入、擷取、分類、預檢、解析、記錄、分派與完成等階段
sidebarTitle: Channel turn
summary: runtime.channel.turn -- 隨附與第三方通道 Plugin 用來記錄、分派並完成代理回合的共享入站回合核心
title: 頻道回合核心
x-i18n:
    generated_at: "2026-04-30T03:25:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

頻道回合核心是共用的傳入狀態機，會將正規化的平台事件轉換成代理回合。頻道 Plugin 提供平台事實和傳遞回呼。核心負責編排：擷取、分類、預檢、解析、授權、組裝、記錄、派送和完成。

當你的 Plugin 位於傳入訊息熱路徑時，請使用這個核心。對於非訊息事件（斜線命令、互動視窗、按鈕互動、生命週期事件、反應、語音狀態），請讓它們保留在 Plugin 本地。核心只負責可能成為代理文字回合的事件。

<Info>
  核心透過注入的 Plugin 執行階段以 `runtime.channel.turn.*` 存取。Plugin 執行階段型別從 `openclaw/plugin-sdk/core` 匯出，因此第三方原生 Plugin 可以像內建頻道 Plugin 一樣使用這些進入點。
</Info>

## 為什麼需要共用核心

頻道 Plugin 會重複相同的傳入流程：正規化、路由、閘控、建構情境、記錄工作階段中繼資料、派送代理回合、完成傳遞狀態。如果沒有共用核心，提及閘控、僅工具可見回覆、工作階段中繼資料、待處理歷史或派送完成的變更，都必須逐一套用到每個頻道。

核心刻意將四個概念分開：

- `ConversationFacts`：訊息來自哪裡
- `RouteFacts`：哪個代理和工作階段應該處理它
- `ReplyPlanFacts`：可見回覆應該送到哪裡
- `MessageFacts`：代理應該看到什麼本文和補充情境

Slack 私訊、Telegram 主題、Matrix 討論串和 Feishu 主題工作階段在實務上都會區分這些概念。把它們當作同一個識別碼，久而久之會造成偏移。

## 階段生命週期

無論頻道為何，核心都會執行相同的固定管線：

1. `ingest` -- 轉接器將原始平台事件轉換成 `NormalizedTurnInput`
2. `classify` -- 轉接器宣告此事件是否可以啟動代理回合
3. `preflight` -- 轉接器執行去重、自我回音、補水、去抖、解密、部分事實預填
4. `resolve` -- 轉接器回傳完整組裝的回合（路由、回覆計畫、訊息、傳遞）
5. `authorize` -- 將私訊、群組、提及和命令政策套用到組裝後的事實
6. `assemble` -- 透過 `buildContext` 從事實建構 `FinalizedMsgContext`
7. `record` -- 保存傳入工作階段中繼資料和最後路由
8. `dispatch` -- 透過緩衝區塊派送器執行代理回合
9. `finalize` -- 即使派送發生錯誤，也會執行轉接器 `onFinalize`

提供 `log` 回呼時，每個階段都會發出結構化記錄事件。請參閱[可觀測性](#observability)。

## 准入種類

當回合被閘控時，核心不會擲出例外。它會回傳 `ChannelTurnAdmission`：

| 種類          | 時機                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 回合已准入。代理回合會執行，且會走可見回覆路徑。                                                                   |
| `observeOnly` | 回合會端到端執行，但傳遞轉接器不會送出任何可見內容。用於廣播觀察者代理和其他被動多代理流程。 |
| `handled`     | 平台事件已在本地消耗（生命週期、反應、按鈕、互動視窗）。核心會略過派送。                                           |
| `drop`        | 略過路徑。可選的 `recordHistory: true` 會將訊息保留在待處理群組歷史中，讓未來提及時有情境。                      |

准入可能來自 `classify`（事件類別表示它無法啟動回合）、`preflight`（去重、自我回音、缺少提及但記錄歷史），或 `resolveTurn` 本身。

## 進入點

執行階段公開三個偏好的進入點，讓轉接器可以在符合頻道的層級選擇加入。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

兩個較舊的執行階段輔助函式仍可用於 Plugin SDK 相容性：

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

當你的頻道可以將其傳入流程表達為 `ChannelTurnAdapter<TRaw>` 時使用。轉接器包含 `ingest` 回呼、選用的 `classify`、選用的 `preflight`、必要的 `resolveTurn`，以及選用的 `onFinalize`。

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

當頻道只有少量轉接器邏輯，且適合透過鉤子擁有生命週期時，`run` 是合適的形狀。

### runPrepared

當頻道有複雜的本地派送器，包含預覽、重試、編輯或討論串啟動，且必須保留由頻道擁有時使用。核心仍會在派送前記錄傳入工作階段，並呈現一致的 `DispatchedChannelTurnResult`。

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

豐富頻道（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）使用 `runPrepared`，因為它們的派送器會編排核心不應了解的平台特定行為。

### buildContext

這是一個純函式，會將事實組合對應成 `FinalizedMsgContext`。當你的頻道手寫部分管線，但想要一致的情境形狀時使用。

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

在為 `run` 組裝回合時，`buildContext` 也很適合用在 `resolveTurn` 回呼內。

<Note>
  已淘汰的 SDK 輔助函式，例如 `dispatchInboundReplyWithBase`，仍會透過組裝回合輔助函式橋接。新的 Plugin 程式碼應使用 `run` 或 `runPrepared`。
</Note>

## 事實型別

核心從你的轉接器消耗的事實與平台無關。將平台物件轉換成這些形狀後，再交給核心。

### NormalizedTurnInput

| 欄位             | 用途                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 用於去重和記錄的穩定訊息 id                                   |
| `timestamp`       | 選用的 epoch ms                                                            |
| `rawText`         | 從平台收到的本文                                           |
| `textForAgent`    | 選用的代理清理後本文（移除提及、修剪輸入）             |
| `textForCommands` | 選用的本文，用於 `/command` 解析                                    |
| `raw`             | 選用的透傳參照，供需要原始物件的轉接器回呼使用 |

### ChannelEventClass

| 欄位                  | 用途                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | 若為 false，核心會回傳 `{ kind: "handled" }`                       |
| `requiresImmediateAck` | 給需要在派送前 ACK 的轉接器的提示                      |

### SenderFacts

| 欄位          | 用途                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 穩定的平台傳送者 id                                      |
| `name`         | 顯示名稱                                                   |
| `username`     | 若不同於 `name`，則為代號                                 |
| `tag`          | Discord 風格的判別碼或平台標籤                    |
| `roles`        | 角色 id，用於成員角色允許清單比對              |
| `isBot`        | 傳送者是已知 Bot 時為 true（核心用於丟棄） |
| `isSelf`       | 傳送者是已設定的代理本身時為 true            |
| `displayLabel` | 預先算繪的信封文字標籤                           |

### ConversationFacts

| 欄位             | 用途                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, 或 `channel`                                      |
| `id`              | 用於路由的對話 id                                     |
| `label`           | 信封的人類可讀標籤                                         |
| `spaceId`         | 選用的外層空間識別碼（Slack 工作區、Matrix homeserver） |
| `parentId`        | 當這是討論串時的外層對話 id                          |
| `threadId`        | 此訊息位於討論串內時的討論串 id                       |
| `nativeChannelId` | 與路由 id 不同時的平台原生頻道 id        |
| `routePeer`       | 用於 `resolveAgentRoute` 查詢的對等方                             |

### RouteFacts

| 欄位                   | 用途                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 應處理此回合的代理                         |
| `accountId`             | 選用覆寫（多帳號頻道）                 |
| `routeSessionKey`       | 用於路由的工作階段鍵                               |
| `dispatchSessionKey`    | 與路由鍵不同時，用於派送的工作階段鍵 |
| `persistedSessionKey`   | 寫入已保存工作階段中繼資料的工作階段鍵          |
| `parentSessionKey`      | 分支/討論串工作階段的父項                      |
| `modelParentSessionKey` | 分支工作階段的模型端父項                    |
| `mainSessionKey`        | 直接對話的主要私訊擁有者釘選                 |
| `createIfMissing`       | 允許記錄步驟建立缺少的工作階段列          |

### ReplyPlanFacts

| 欄位                      | 用途                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | 寫入內容 `To` 的邏輯回覆目標                           |
| `originatingTo`           | 原始內容目標（`OriginatingTo`）                         |
| `nativeChannelId`         | 用於傳遞的平台原生通道 ID                              |
| `replyTarget`             | 若不同於 `to`，則為最終可見回覆目的地                  |
| `deliveryTarget`          | 較低層級的傳遞覆寫                                    |
| `replyToId`               | 引用/錨定的訊息 ID                                     |
| `replyToIdFull`           | 平台同時具備兩者時的完整形式引用 ID                    |
| `messageThreadId`         | 傳遞時的執行緒 ID                                      |
| `threadParentId`          | 執行緒的父訊息 ID                                      |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct` 或 `none`        |

### AccessFacts

`AccessFacts` 承載 authorize 階段所需的布林值。身分比對保留在通道中：核心只會取用結果。

| 欄位       | 用途                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `dm`       | DM 允許/配對/拒絕決策與 `allowFrom` 清單                                |
| `group`    | 群組政策、路由允許、寄件者允許、允許清單、提及要求                      |
| `commands` | 跨已設定 authorizers 的命令授權                                         |
| `mentions` | 是否能偵測提及，以及 agent 是否被提及                                   |

### MessageFacts

| 欄位             | 用途                                                       |
| ---------------- | ---------------------------------------------------------- |
| `body`           | 最終信封本文（已格式化）                                  |
| `rawBody`        | 原始傳入本文                                              |
| `bodyForAgent`   | agent 看到的本文                                          |
| `commandBody`    | 用於命令解析的本文                                        |
| `envelopeFrom`   | 信封的預先算繪寄件者標籤                                  |
| `senderLabel`    | 算繪寄件者的可選覆寫                                      |
| `preview`        | 用於記錄的簡短遮蔽預覽                                    |
| `inboundHistory` | 通道保留緩衝區時的近期傳入歷史項目                        |

### SupplementalContextFacts

補充內容涵蓋引用、轉寄與執行緒啟動內容。核心會套用已設定的 `contextVisibility` 政策。通道配接器只提供事實與 `senderAllowed` 旗標，讓跨通道政策保持一致。

### InboundMediaFacts

媒體以事實形狀表示。平台下載、驗證、SSRF 政策、CDN 規則與解密都保留在通道本地。核心會將事實對應到 `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes` 與 `MediaTranscribedIndexes`。

## 配接器合約

完整 `run` 的配接器形狀如下：

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

`resolveTurn` 會回傳 `ChannelTurnResolved`，也就是帶有可選 admission 種類的 `AssembledChannelTurn`。回傳 `{ admission: { kind: "observeOnly" } }` 會執行該輪次，但不產生可見輸出。配接器仍擁有傳遞回呼；它只是在該輪次變成無動作。

`onFinalize` 會在每個結果上執行，包括分派錯誤。用它來清除待處理的群組歷史、移除 ack reactions、停止狀態指示器，並排清本地狀態。

## 傳遞配接器

核心不會直接呼叫平台。通道會將 `ChannelTurnDeliveryAdapter` 交給核心：

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

每個已緩衝的回覆區塊都會呼叫一次 `deliver`。當通道有平台訊息 ID 時請回傳，讓 dispatcher 能保留執行緒錨點並編輯後續區塊。對於僅觀察輪次，請回傳 `{ visibleReplySent: false }` 或使用 `createNoopChannelTurnDeliveryAdapter()`。

## 記錄選項

記錄階段會包裝 `recordInboundSession`。多數通道可使用預設值。透過 `record` 覆寫：

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher 會等待記錄階段。如果記錄拋出錯誤，核心會執行 `onPreDispatchFailure`（提供給 `runPrepared` 時）並重新拋出。

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

記錄的階段：`ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。避免記錄原始本文；使用 `MessageFacts.preview` 作為簡短遮蔽預覽。

## 保留在通道本地的內容

核心負責編排。通道仍負責：

- 平台傳輸（Gateway、REST、websocket、輪詢、Webhook）
- 身分解析與顯示名稱比對
- 原生命令、斜線命令、自動完成、modal、按鈕、語音狀態
- 卡片、modal 與 adaptive-card 算繪
- 媒體驗證、CDN 規則、加密媒體、轉錄
- 編輯、reaction、遮蔽與 presence API
- 回填與平台端歷史擷取
- 需要平台特定驗證的配對流程

如果兩個通道開始需要其中某項的相同 helper，請擷取共用 SDK helper，而不是將它推入核心。

## 穩定性

`runtime.channel.turn.*` 是公開 Plugin runtime surface 的一部分。事實型別（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）與 admission 形狀（`ChannelTurnAdmission`、`ChannelEventClass`）可透過 `openclaw/plugin-sdk/core` 的 `PluginRuntime` 取得。

適用向後相容規則：新的事實欄位是加法式的、admission 種類不會重新命名，且進入點名稱保持穩定。需要非加法式變更的新通道需求，必須經過 Plugin SDK 遷移流程。

## 相關

- [建置通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)：更廣泛的通道 Plugin 合約
- [Plugin runtime helpers](/zh-TW/plugins/sdk-runtime)：其他 `runtime.*` surface
- [Plugin internals](/zh-TW/plugins/architecture-internals)：載入管線與 registry 機制
