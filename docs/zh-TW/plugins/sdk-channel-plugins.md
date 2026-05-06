---
read_when:
    - 您正在建置新的訊息通道 Plugin
    - 您想將 OpenClaw 連接到訊息平台
    - 你需要了解 ChannelPlugin 轉接器介面
sidebarTitle: Channel Plugins
summary: 建置 OpenClaw 訊息通道 Plugin 的逐步指南
title: 建置頻道 Plugin
x-i18n:
    generated_at: "2026-05-06T09:15:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南逐步說明如何建置一個將 OpenClaw 連接到訊息平台的頻道 Plugin。完成後，你會擁有一個可運作的頻道，具備 DM 安全性、配對、回覆討論串，以及對外傳送訊息功能。

<Info>
  如果你之前沒有建置過任何 OpenClaw Plugin，請先閱讀
  [入門指南](/zh-TW/plugins/building-plugins)，了解基本套件結構與 manifest 設定。
</Info>

## 頻道 Plugin 的運作方式

頻道 Plugin 不需要自己的傳送、編輯或反應工具。OpenClaw 在核心中保留一個共用的 `message` 工具。你的 Plugin 負責：

- **設定** - 帳戶解析與設定精靈
- **安全性** - DM 政策與允許清單
- **配對** - DM 核准流程
- **工作階段語法** - 供應商特定的對話 ID 如何對應到基礎聊天、討論串 ID 與父層備援
- **對外傳送** - 將文字、媒體與投票傳送到平台
- **討論串處理** - 回覆如何串接成討論串
- **Heartbeat 輸入狀態** - 傳送到 Heartbeat 目標時可選的輸入中／忙碌訊號

核心負責共用的訊息工具、提示詞接線、外層工作階段鍵形狀、通用的 `:thread:` 簿記，以及分派。

新的頻道 Plugin 也應該使用來自 `openclaw/plugin-sdk/channel-message` 的 `defineChannelMessageAdapter` 暴露 `message` 配接器。此配接器會宣告原生傳輸實際支援哪些持久化最終傳送能力，並將文字／媒體傳送指向與舊版 `outbound` 配接器相同的傳輸函式。只有在合約測試證明原生副作用與回傳的收據後，才宣告某項能力。
完整的 API 合約、範例、能力矩陣、收據規則、即時預覽最終化、接收確認政策、測試與遷移表，請參閱[頻道訊息 API](/zh-TW/plugins/sdk-channel-message)。
如果現有的 `outbound` 配接器已經具備正確的傳送方法與能力中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)` 衍生 `message` 配接器，而不是手寫另一個橋接。
配接器傳送應該回傳 `MessageReceipt` 值。當相容性程式碼仍需要舊版 ID 時，請使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 衍生它們，而不是在新的生命週期程式碼中保留平行的 `messageIds` 欄位。
支援預覽的頻道也應該使用其擁有的確切即時生命週期宣告 `message.live.capabilities`，例如 `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming` 或 `quietFinalization`。會在原處最終化草稿預覽的頻道，也應該宣告 `message.live.finalizer.capabilities`，例如 `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt` 與 `retainOnAmbiguousFailure`，並將執行階段邏輯透過 `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)` 路由。請讓這些能力由 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 與 `verifyChannelMessageLiveFinalizerProofs(...)` 測試支撐，避免原生預覽、進度、編輯、備援／保留、清理與收據行為在無聲中漂移。
延遲平台確認的入站接收器應該宣告 `message.receive.defaultAckPolicy` 與 `supportedAckPolicies`，而不是把確認時機藏在監控器本機狀態中。請使用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 涵蓋每個宣告的政策。

舊版回覆／輪次輔助工具，例如 `createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 與 `recordInboundSessionAndDispatchReply`，仍可供相容性分派器使用。新的頻道程式碼不要使用這些名稱；新的 Plugin 應該從 `openclaw/plugin-sdk/channel-message` 上的 `message` 配接器、收據，以及接收／傳送生命週期輔助工具開始。

如果你的頻道支援入站回覆以外的輸入指示器，請在頻道 Plugin 上暴露 `heartbeat.sendTyping(...)`。核心會在 Heartbeat 模型執行開始前，以解析後的 Heartbeat 傳送目標呼叫它，並使用共用的輸入狀態 keepalive／清理生命週期。當平台需要明確停止訊號時，請新增 `heartbeat.clearTyping(...)`。

如果你的頻道新增會攜帶媒體來源的訊息工具參數，請透過 `describeMessageTool(...).mediaSourceParams` 暴露這些參數名稱。核心會使用這份明確清單進行沙箱路徑正規化與對外媒體存取政策，因此 Plugin 不需要為供應商特定的頭像、附件或封面圖片參數加入共用核心特例。
偏好回傳以動作為鍵的映射，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，如此不相關的動作就不會繼承另一個動作的媒體引數。對於刻意在每個暴露動作之間共用的參數，扁平陣列仍然可用。

如果你的頻道需要針對 `message(action="send")` 進行供應商特定塑形，請優先使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入或其他持久化資料放在 `payload.channelData.<channel>` 下，並讓核心透過 outbound／message 配接器執行實際傳送。只有在酬載無法序列化並重試時，才將 `actions.handleAction(...)` 用作傳送的相容性備援。

如果你的平台在對話 ID 內儲存額外範圍，請在 Plugin 中使用 `messaging.resolveSessionConversation(...)` 保留該解析。這是將 `rawId` 對應到基礎對話 ID、可選討論串 ID、明確的 `baseConversationId`，以及任何 `parentConversationCandidates` 的標準 hook。
回傳 `parentConversationCandidates` 時，請將它們從最窄的父層到最廣／基礎對話排序。

當 Plugin 程式碼需要正規化類路由欄位、比較子討論串與其父層路由，或從 `{ channel, to, accountId, threadId }` 建立穩定的去重鍵時，請使用 `openclaw/plugin-sdk/channel-route`。該輔助工具會以和核心相同的方式正規化數字討論串 ID，因此 Plugin 應優先使用它，而不是臨時進行 `String(threadId)` 比較。
具有供應商特定目標語法的 Plugin，可以將其剖析器注入 `resolveChannelRouteTargetWithParser(...)`，同時仍取得與核心使用相同的路由目標形狀與討論串備援語意。

需要在頻道註冊表啟動前進行相同解析的內建 Plugin，也可以暴露頂層 `session-key-api.ts` 檔案，並提供相符的 `resolveSessionConversation(...)` 匯出。核心只會在執行階段 Plugin 註冊表尚不可用時，使用這個啟動安全介面。

當 Plugin 只需要在通用／原始 ID 之上提供父層備援時，`messaging.resolveParentConversationCandidates(...)` 仍可作為舊版相容性備援使用。如果兩個 hook 都存在，核心會先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有在標準 hook 省略它們時，才會退回到 `resolveParentConversationCandidates(...)`。

## 核准與頻道能力

大多數頻道 Plugin 不需要核准專用程式碼。

- 核心擁有同一聊天中的 `/approve`、共用的核准按鈕承載資料，以及通用的後援傳遞。
- 當頻道 Plugin 需要核准專屬行為時，偏好在頻道 Plugin 上使用單一 `approvalCapability` 物件。
- `ChannelPlugin.approvals` 已移除。請將核准傳遞、原生、算繪、驗證事實放在 `approvalCapability` 上。
- `plugin.auth` 僅用於登入/登出；核心不再從該物件讀取核准驗證 hook。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是標準的核准驗證接縫。
- 對於同一聊天的核准驗證可用性，請使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的頻道公開原生執行核准，當啟動介面/原生用戶端狀態不同於同一聊天核准驗證時，請使用 `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該執行專屬 hook 來區分 `enabled` 與 `disabled`、判斷啟動頻道是否支援原生執行核准，並將該頻道納入原生用戶端後援指引。`createApproverRestrictedNativeApprovalCapability(...)` 會為常見情境填入這項內容。
- 對於頻道專屬的承載資料生命週期行為，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入中指示器，請使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 只有在原生核准路由或後援抑制時，才使用 `approvalCapability.delivery`。
- 對於頻道擁有的原生核准事實，請使用 `approvalCapability.nativeRuntime`。在熱門頻道進入點上，請透過 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持惰性，它可以按需匯入你的執行階段模組，同時仍讓核心組裝核准生命週期。
- 只有當頻道確實需要自訂核准承載資料，而不是共用算繪器時，才使用 `approvalCapability.render`。
- 當頻道希望停用路徑回覆說明啟用原生執行核准所需的確切設定旋鈕時，請使用 `approvalCapability.describeExecApprovalSetup`。該 hook 會收到 `{ channel, channelLabel, accountId }`；具名帳號頻道應算繪帳號範圍路徑，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是頂層預設值。
- 如果頻道可以從現有設定推斷穩定、類似擁有者的私訊身分，請使用來自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter`，在不加入核准專屬核心邏輯的情況下限制同一聊天中的 `/approve`。
- 如果頻道需要原生核准傳遞，請讓頻道程式碼專注於目標正規化以及傳輸/呈現事實。請使用來自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。將頻道專屬事實放在 `approvalCapability.nativeRuntime` 後方，理想上透過 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心可以組裝處理器，並擁有請求篩選、路由、去重、到期、Gateway 訂閱，以及已路由至其他位置的通知。`nativeRuntime` 被拆成幾個較小的接縫：
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用共用的頻道路由比對器。只有當頻道具備供應商專屬等價規則時，例如 Slack 時間戳前綴比對，才傳入 `targetsMatch`。
- 當頻道需要在預設路由比對器或自訂 `targetsMatch` 回呼執行之前，先將供應商 ID 標準化，同時保留原始目標以供傳遞時，請將 `normalizeTargetForMatch` 傳入 `createChannelNativeOriginTargetResolver`。只有當已解析的傳遞目標本身應被標準化時，才使用 `normalizeTarget`。
- `availability` - 帳號是否已設定，以及請求是否應被處理
- `presentation` - 將共用核准檢視模型對應到待處理/已解析/已到期的原生承載資料或最終動作
- `transport` - 準備目標並傳送/更新/刪除原生核准訊息
- `interactions` - 原生按鈕或反應的選用繫結/解除繫結/清除動作 hook
- `observe` - 選用的傳遞診斷 hook
- 如果頻道需要由執行階段擁有的物件，例如用戶端、權杖、Bolt 應用程式或 Webhook 接收器，請透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊它們。通用執行階段內容登錄可讓核心從頻道啟動狀態啟動能力驅動的處理器，而不需要加入核准專屬包裝黏合程式碼。
- 只有當能力驅動的接縫尚不足以表達需求時，才使用較低階的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生核准頻道必須透過這些 helper 路由 `accountId` 和 `approvalKind`。`accountId` 讓多帳號核准政策限定在正確的 bot 帳號範圍內，而 `approvalKind` 讓頻道可以取得執行與 Plugin 核准行為，且不需要在核心中硬編碼分支。
- 核心現在也擁有核准重新路由通知。頻道 Plugin 不應從 `createChannelNativeApprovalRuntime` 傳送自己的「核准已送往私訊/其他頻道」後續訊息；相反地，請透過共用核准能力 helper 公開準確的來源與核准者私訊路由，並讓核心在將任何通知貼回啟動聊天前彙總實際傳遞。
- 端到端保留已傳遞核准 ID 類型。原生用戶端不應
  從頻道本機狀態猜測或改寫執行與 Plugin 核准路由。
- 不同核准類型可以有意公開不同的原生介面。
  目前的內建範例：
  - Slack 讓原生核准路由同時可用於執行與 Plugin ID。
  - Matrix 對執行與 Plugin 核准保持相同的原生私訊/頻道路由與反應 UX，
    同時仍允許驗證依核准類型不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為相容性包裝器存在，但新程式碼應偏好能力建構器，並在 Plugin 上公開 `approvalCapability`。

對於熱門頻道進入點，當你只需要該系列的一部分時，偏好較窄的執行階段子路徑：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要較廣的總括介面時，偏好 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`，以及
`openclaw/plugin-sdk/reply-chunking`。

特別針對設定：

- `openclaw/plugin-sdk/setup-runtime` 涵蓋執行階段安全的設定 helper：
  匯入安全的設定修補配接器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查詢備註輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  設定 Proxy 建構器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用於 `createEnvPatchedAccountSetupAdapter` 的窄版、感知環境的配接器
  接縫
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝設定
  建構器，以及少數設定安全的基本元件：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`，

如果你的頻道支援由環境驅動的設定或驗證，且通用啟動/設定
流程應在執行階段載入前知道這些環境名稱，請在
Plugin manifest 中以 `channelEnvVars` 宣告它們。頻道執行階段 `envVars` 或本機
常數只應保留給面向操作員的文案。

如果你的頻道可以在 Plugin 執行階段啟動前出現在 `status`、`channels list`、`channels status` 或
SecretRef 掃描中，請在
`package.json` 中加入 `openclaw.setupEntry`。該進入點應可安全匯入到唯讀命令
路徑中，並應回傳這些摘要所需的頻道中繼資料、設定安全的設定配接器、狀態
配接器，以及頻道秘密目標中繼資料。請勿
從設定進入點啟動用戶端、監聽器或傳輸執行階段。

也請保持主要頻道進入匯入路徑狹窄。探索可以評估
進入點和頻道 Plugin 模組以註冊能力，而不啟用
頻道。像 `channel-plugin-api.ts` 這類檔案應匯出頻道
Plugin 物件，而不匯入設定精靈、傳輸用戶端、socket
監聽器、子行程啟動器或服務啟動模組。請將這些執行階段
部分放在由 `registerFull(...)`、執行階段 setter 或惰性
能力配接器載入的模組中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`，以及
`splitSetupEntries`

- 只有當你也需要較重的共用設定/config helper，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用較廣的
  `openclaw/plugin-sdk/setup` 接縫

如果你的頻道只想在設定介面中公告「先安裝此 Plugin」，請偏好 `createOptionalChannelSetupSurface(...)`。產生的
配接器/精靈會在設定寫入和最終化時封閉失敗，並在驗證、最終化與文件連結
文案中重複使用相同的需要安裝訊息。

對於其他熱門頻道路徑，偏好窄版 helper，而不是較廣的舊版
介面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`，以及
  `openclaw/plugin-sdk/account-helpers` 用於多帳號設定和
  預設帳號後援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch` 用於入站路由/封套，以及
  記錄並派送接線
- `openclaw/plugin-sdk/messaging-targets` 用於目標剖析/比對
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime` 用於媒體載入，以及出站
  身分/傳送委派與承載資料規劃
- 當出站路由應保留明確的
  `replyToId`/`threadId`，或在基礎工作階段鍵仍然相符後復原目前的 `:thread:` 工作階段時，請使用來自
  `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。供應商 Plugin 可以在其平台
  具有原生執行緒傳遞語意時，覆寫
  優先順序、尾碼行為和執行緒 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime` 用於執行緒繫結生命週期
  和配接器註冊
- 只有當仍需要舊版代理程式/媒體
  承載資料欄位版面配置時，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用於 Telegram 自訂命令
  正規化、重複/衝突驗證，以及後援穩定的命令
  設定合約

僅驗證頻道通常可以停在預設路徑：核心處理核准，而 Plugin 只公開出站/驗證能力。像 Matrix、Slack、Telegram 和自訂聊天傳輸這類原生核准頻道，應使用共用原生 helper，而不是自行實作核准生命週期。

## 入站提及政策

請將入站提及處理分成兩層：

- Plugin 擁有的證據收集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策決策。
只有在需要較廣的入站 helper barrel 時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合 Plugin 本機邏輯的項目：

- 回覆 bot 偵測
- 引用 bot 偵測
- 執行緒參與檢查
- 服務/系統訊息排除
- 證明 bot 參與所需的平台原生快取

適合共用 helper 的項目：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令繞過
- 最終跳過決策

建議流程：

1. 計算本機提及事實。
2. 將這些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的傳入閘門中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` 會公開相同的共用提及輔助工具，供已依賴 runtime injection 的內建頻道 Plugin 使用：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，請從
`openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入無關的傳入
runtime 輔助工具。

較舊的 `resolveMentionGating*` 輔助工具仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，但僅作為相容性匯出。新程式碼
應使用 `resolveInboundMentionDecision({ facts, policy })`。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="套件與清單">
    建立標準 Plugin 檔案。`package.json` 中的 `channel` 欄位會讓它成為頻道 Plugin。如需完整的套件中繼資料介面，請參閱 [Plugin 設定與組態](/zh-TW/plugins/sdk-setup#openclaw-channel)：

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將它用於非頻道帳戶組態、且由 Plugin 擁有的設定。`channelConfigs`
    會驗證 `channels.acme-chat`，也是 Plugin runtime 載入前，組態
    schema、設定流程與 UI 介面使用的冷路徑來源。

  </Step>

  <Step title="建置頻道 Plugin 物件">
    `ChannelPlugin` 介面有許多選用的配接器介面。先從最小項目開始，也就是
    `id` 和 `setup`，再依需求加入配接器。

    建立 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    若頻道同時接受標準頂層 DM 鍵與舊版巢狀鍵，請使用 `plugin-sdk/channel-config-helpers` 中的輔助工具：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳戶本機值優先於繼承的根層級值。將同一個解析器與透過 `normalizeLegacyDmAliases` 進行的 doctor 修復配對，讓 runtime 和遷移讀取相同合約。

    <Accordion title="createChatChannelPlugin 為你做什麼">
      你不必手動實作低階配接器介面，而是傳入宣告式選項，由建置器將它們組合起來：

      | 選項 | 它會接線的內容 |
      | --- | --- |
      | `security.dm` | 來自組態欄位的 scoped DM 安全性解析器 |
      | `pairing.text` | 以文字為基礎、透過代碼交換的 DM 配對流程 |
      | `threading` | 回覆目標模式解析器（固定、帳戶 scoped 或自訂） |
      | `outbound.attachedResults` | 回傳結果中繼資料（訊息 ID）的傳送函式 |

      如果需要完整控制，也可以傳入原始配接器物件，而不是宣告式選項。

      原始傳出配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳送時的格式決策，例如
      `maxLinesPerMessage`；請在傳送前套用它，讓回覆串接與分段邊界
      由共用傳出傳遞一次解析完成。當原生回覆目標已解析時，傳送情境
      也會包含 `replyToIdSource`（`implicit` 或 `explicit`），讓 payload 輔助工具可以保留
      明確回覆標記，而不消耗隱含的一次性回覆位置。
    </Accordion>

  </Step>

  <Step title="接上進入點">
    建立 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    將頻道擁有的 CLI 描述元放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    能在不啟用完整頻道 runtime 的情況下，於根說明中顯示它們；
    一般完整載入仍會取得相同描述元，以進行真正的命令註冊。
    將 `registerFull(...)` 保留給僅限 runtime 的工作。
    如果 `registerFull(...)` 註冊 Gateway RPC 方法，請使用
    Plugin 專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保留，且一律
    解析為 `operator.admin`。
    `defineChannelPluginEntry` 會自動處理註冊模式分離。請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry) 了解所有
    選項。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，供上手流程期間輕量載入使用：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw 會在頻道停用或尚未設定時載入此項，而不是完整進入點。
    這可避免在設定流程期間拉入沉重的 runtime 程式碼。
    詳情請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將 setup-safe 匯出拆分到 sidecar
    模組的內建工作區頻道，如果也需要明確的設定時 runtime setter，
    可以使用來自 `openclaw/plugin-sdk/channel-entry-contract` 的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理傳入訊息">
    你的 Plugin 需要從平台接收訊息，並將其轉送至
    OpenClaw。典型模式是使用 Webhook 來驗證請求，並透過你頻道的傳入處理器分派：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      傳入訊息處理依通道而異。每個通道 Plugin 都擁有
      自己的傳入管線。請參考內建通道 Plugin
      （例如 Microsoft Teams 或 Google Chat Plugin 套件）以了解實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="測試">
在 `src/channel.test.ts` 中撰寫 colocated 測試：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    關於共用測試輔助工具，請參閱[測試](/zh-TW/plugins/sdk-testing)。

</Step>
</Steps>

## 檔案結構

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## 進階主題

<CardGroup cols={2}>
  <Card title="對話串選項" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳號範圍或自訂回覆模式
  </Card>
  <Card title="訊息工具整合" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="目標解析" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體、透過 api.runtime 使用 subagent
  </Card>
  <Card title="通道 turn 核心" icon="bolt" href="/zh-TW/plugins/sdk-channel-turn">
    共用傳入 turn 生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分內建輔助 seam 仍然存在，用於內建 Plugin 維護與
相容性。這些不是新通道 Plugin 的建議模式；
除非你正在直接維護該內建 Plugin 家族，否則請優先使用通用 SDK
介面的泛用 channel/setup/reply/runtime 子路徑。
</Note>

## 下一步

- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) - 如果你的 Plugin 也提供模型
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試工具與合約測試
- [Plugin Manifest](/zh-TW/plugins/manifest) - 完整 Manifest schema

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
