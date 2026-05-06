---
read_when:
    - 你正在建立新的訊息通道 Plugin
    - 你想將 OpenClaw 連接到通訊平台
    - 你需要了解 ChannelPlugin 配接器介面
sidebarTitle: Channel Plugins
summary: OpenClaw 訊息傳遞通道 Plugin 的逐步建置指南
title: 建立通道 Plugin
x-i18n:
    generated_at: "2026-05-06T02:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83bae4deb19ab4acbcb45873679f34dda189b4da1c2c247cb9e47ba7e58c8059
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會逐步說明如何建置一個將 OpenClaw 連接到
訊息平台的通道 Plugin。完成後，你會擁有一個可運作的通道，具備 DM 安全性、
配對、回覆串接，以及對外訊息傳送。

<Info>
  如果你之前尚未建置過任何 OpenClaw Plugin，請先閱讀
  [開始使用](/zh-TW/plugins/building-plugins)，了解基本的套件
  結構與 manifest 設定。
</Info>

## 通道 Plugin 的運作方式

通道 Plugin 不需要自己的傳送/編輯/回應工具。OpenClaw 會在核心中保留一個
共用的 `message` 工具。你的 Plugin 負責：

- **設定** — 帳號解析與設定精靈
- **安全性** — DM 政策與允許清單
- **配對** — DM 核准流程
- **工作階段語法** — 供應商特定的對話 ID 如何對應到基礎聊天室、執行緒 ID 與父層備援
- **對外傳送** — 將文字、媒體與投票傳送到平台
- **串接** — 回覆如何串接
- **Heartbeat 輸入狀態** — 用於 Heartbeat 傳遞目標的選用輸入中/忙碌訊號

核心負責共用訊息工具、提示詞接線、外層工作階段金鑰形狀、
通用 `:thread:` 紀錄，以及分派。

新的通道 Plugin 也應該使用
`openclaw/plugin-sdk/channel-message` 中的 `defineChannelMessageAdapter` 暴露 `message` 轉接器。
轉接器會宣告原生傳輸實際支援哪些持久化最終傳送能力，並將文字/媒體傳送指向與
舊版 `outbound` 轉接器相同的傳輸函式。只有在合約測試證明原生副作用與回傳收據時，
才宣告能力。
完整的 API 合約、範例、能力矩陣、收據規則、即時預覽最終化、接收 ack 政策、
測試與遷移表，請參閱
[通道訊息 API](/zh-TW/plugins/sdk-channel-message)。
如果現有的 `outbound` 轉接器已經具備正確的傳送方法與
能力中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)`
衍生 `message` 轉接器，而不是手寫另一個橋接。
轉接器傳送應回傳 `MessageReceipt` 值。當相容性程式碼
仍需要舊版 ID 時，請使用 `listMessageReceiptPlatformIds(...)`
或 `resolveMessageReceiptPrimaryId(...)` 衍生它們，而不是在新的生命週期程式碼中保留平行的
`messageIds` 欄位。
支援預覽的通道也應該宣告 `message.live.capabilities`，並列出
它們擁有的確切即時生命週期，例如 `draftPreview`、
`previewFinalization`、`progressUpdates`、`nativeStreaming` 或
`quietFinalization`。會就地最終化草稿預覽的通道，也應該
宣告 `message.live.finalizer.capabilities`，例如 `finalEdit`、
`normalFallback`、`discardPending`、`previewReceipt` 與
`retainOnAmbiguousFailure`，並透過
`defineFinalizableLivePreviewAdapter(...)` 加上
`deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯。請使用
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` 與
`verifyChannelMessageLiveFinalizerProofs(...)` 測試支撐這些能力，確保原生預覽、
進度、編輯、備援/保留、清理與收據行為不會默默漂移。
延後平台確認的入站接收器應宣告
`message.receive.defaultAckPolicy` 與 `supportedAckPolicies`，而不是把
ack 時機隱藏在監控器本機狀態中。請用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆蓋每個宣告的政策。

舊版回覆/回合輔助工具，例如 `createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase` 與 `recordInboundSessionAndDispatchReply`
仍可供相容性分派器使用。新的通道程式碼不要使用這些名稱；新的 Plugin 應從
`openclaw/plugin-sdk/channel-message` 上的 `message` 轉接器、收據，以及
接收/傳送生命週期輔助工具開始。

如果你的通道支援入站回覆以外的輸入指示器，請在通道 Plugin 上暴露
`heartbeat.sendTyping(...)`。核心會在 Heartbeat 模型執行開始前，
使用解析後的 Heartbeat 傳遞目標呼叫它，並使用共用的輸入狀態 keepalive/清理生命週期。
當平台需要明確的停止訊號時，請加入 `heartbeat.clearTyping(...)`。

如果你的通道新增了帶有媒體來源的訊息工具參數，請透過
`describeMessageTool(...).mediaSourceParams` 暴露這些
參數名稱。核心會使用該明確清單進行 sandbox 路徑正規化與對外媒體存取
政策，因此 Plugin 不需要為供應商特定的
頭像、附件或封面圖片參數加入共用核心特例。
建議回傳以動作為鍵的對應，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，避免不相關的動作
繼承另一個動作的媒體引數。對於有意在每個暴露動作之間共用的參數，
扁平陣列仍可使用。

如果你的通道需要針對 `message(action="send")` 進行供應商特定塑形，
建議使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入或
其他持久化資料放在 `payload.channelData.<channel>` 下，並讓核心透過
outbound/message 轉接器執行實際傳送。只有在 payload 無法序列化與重試時，
才將 `actions.handleAction(...)` 作為傳送的相容性備援。

如果你的平台在對話 ID 內儲存額外範圍，請使用
`messaging.resolveSessionConversation(...)` 將該解析保留在 Plugin 中。這是將
`rawId` 對應到基礎對話 ID、選用執行緒
ID、明確 `baseConversationId` 以及任何 `parentConversationCandidates` 的
標準 hook。
回傳 `parentConversationCandidates` 時，請從最窄的父層到最寬/基礎對話排序。

當 Plugin 程式碼需要正規化類似路由的欄位、比較子執行緒與其父層路由，
或從 `{ channel, to, accountId, threadId }` 建立穩定的去重金鑰時，請使用
`openclaw/plugin-sdk/channel-route`。此輔助工具會以與核心相同的方式
正規化數字執行緒 ID，因此 Plugin 應優先使用它，而不是臨時的
`String(threadId)` 比較。
具備供應商特定目標語法的 Plugin 可以將其剖析器注入
`resolveChannelRouteTargetWithParser(...)`，同時仍取得核心使用的相同路由目標
形狀與執行緒備援語意。

需要在通道登錄啟動前使用相同解析的 bundled Plugin，也可以暴露頂層
`session-key-api.ts` 檔案，並提供相符的
`resolveSessionConversation(...)` 匯出。只有在執行階段 Plugin 登錄尚不可用時，
核心才會使用這個可安全啟動的表面。

當 Plugin 只需要在通用/raw ID 之上提供父層備援時，
`messaging.resolveParentConversationCandidates(...)` 仍可作為
舊版相容性備援使用。如果兩個 hook 都存在，核心會先使用
`resolveSessionConversation(...).parentConversationCandidates`，並且只有在標準 hook
省略它們時，才退回
`resolveParentConversationCandidates(...)`。

## 核准與通道能力

大多數通道 Plugin 不需要核准特定程式碼。

- 核心負責同一聊天中的 `/approve`、共用批准按鈕負載，以及通用後援遞送。
- 當通道需要批准專用行為時，偏好在通道 Plugin 上使用一個 `approvalCapability` 物件。
- `ChannelPlugin.approvals` 已移除。請將批准遞送、原生、算繪、驗證事實放在 `approvalCapability` 上。
- `plugin.auth` 僅用於登入/登出；核心不再從該物件讀取批准驗證鉤子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是正式的批准驗證接縫。
- 對同一聊天批准驗證可用性使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的通道公開原生 exec 批准，當發起介面/原生用戶端狀態不同於同一聊天批准驗證時，請使用 `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該 exec 專用鉤子來區分 `enabled` 與 `disabled`、判斷發起通道是否支援原生 exec 批准，並在原生用戶端後援指引中包含該通道。`createApproverRestrictedNativeApprovalCapability(...)` 會為常見情況填入此項。
- 對於通道專屬的負載生命週期行為，例如隱藏重複的本機批准提示或在遞送前傳送輸入指示器，請使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 只有在原生批准路由或後援抑制時，才使用 `approvalCapability.delivery`。
- 對通道擁有的原生批准事實使用 `approvalCapability.nativeRuntime`。在熱門通道進入點上，使用 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持延遲載入；它可以按需匯入你的執行階段模組，同時仍讓核心組裝批准生命週期。
- 只有當通道確實需要自訂批准負載而非共用算繪器時，才使用 `approvalCapability.render`。
- 當通道希望停用路徑回覆能說明啟用原生 exec 批准所需的確切設定旋鈕時，使用 `approvalCapability.describeExecApprovalSetup`。此鉤子會接收 `{ channel, channelLabel, accountId }`；具名帳號通道應算繪帳號範圍路徑，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是頂層預設值。
- 如果通道可從既有設定推斷穩定、類似擁有者的 DM 身分，請使用來自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 來限制同一聊天 `/approve`，而無須加入批准專用核心邏輯。
- 如果通道需要原生批准遞送，請讓通道程式碼專注於目標正規化加上傳輸/呈現事實。使用來自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。將通道專屬事實放在 `approvalCapability.nativeRuntime` 後面，理想情況是透過 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心可以組裝處理常式，並擁有請求篩選、路由、去重、到期、Gateway 訂閱，以及已路由到他處通知。`nativeRuntime` 分成幾個較小的接縫：
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用共用通道路由比對器。只有當通道有提供者專屬等價規則時才傳入 `targetsMatch`，例如 Slack 時間戳前綴比對。
- 當通道需要在預設路由比對器或自訂 `targetsMatch` 回呼執行前先將提供者 ID 標準化，同時保留原始目標供遞送使用時，請將 `normalizeTargetForMatch` 傳給 `createChannelNativeOriginTargetResolver`。只有在已解析的遞送目標本身應被標準化時，才使用 `normalizeTarget`。
- `availability` — 帳號是否已設定，以及請求是否應被處理
- `presentation` — 將共用批准檢視模型對應為待處理/已解析/已到期的原生負載或最終動作
- `transport` — 準備目標並傳送/更新/刪除原生批准訊息
- `interactions` — 原生按鈕或反應的選用綁定/解除綁定/清除動作鉤子
- `observe` — 選用遞送診斷鉤子
- 如果通道需要執行階段擁有的物件，例如用戶端、權杖、Bolt 應用程式或 Webhook 接收器，請透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊它們。通用執行階段內容登錄可讓核心從通道啟動狀態啟動能力驅動的處理常式，而無須加入批准專用包裝黏合。
- 只有當能力驅動接縫尚不足以表達需求時，才使用較低階的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生批准通道必須透過這些輔助工具路由 `accountId` 和 `approvalKind`。`accountId` 讓多帳號批准政策限定在正確的機器人帳號範圍內，而 `approvalKind` 讓 exec 與 Plugin 批准行為可供通道使用，無須在核心中硬編碼分支。
- 核心現在也負責批准重新路由通知。通道 Plugin 不應從 `createChannelNativeApprovalRuntime` 傳送自己的「批准已送至 DM / 其他通道」後續訊息；改為透過共用批准能力輔助工具公開準確的來源與批准者 DM 路由，並讓核心彙總實際遞送後，再向發起聊天發布任何通知。
- 保留已遞送批准 ID 種類的端到端一致性。原生用戶端不應
  從通道本機狀態猜測或改寫 exec 與 Plugin 批准路由。
- 不同批准種類可以刻意公開不同的原生介面。
  目前內建範例：
  - Slack 讓 exec 和 Plugin ID 都可使用原生批准路由。
  - Matrix 對 exec 和 Plugin 批准維持相同的原生 DM/通道路由與反應使用者體驗，同時仍允許驗證依批准種類不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為相容性包裝存在，但新程式碼應偏好能力建構器，並在 Plugin 上公開 `approvalCapability`。

對於熱門通道進入點，當你只需要該系列的一部分時，偏好使用較窄的執行階段子路徑：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要較廣泛的傘狀介面時，偏好使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

針對設定：

- `openclaw/plugin-sdk/setup-runtime` 涵蓋執行階段安全的設定輔助工具：
  匯入安全的設定修補配接器（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查詢備註輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派式
  設定代理建構器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用於 `createEnvPatchedAccountSetupAdapter` 的窄版環境感知配接器
  接縫
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝設定
  建構器，以及少數設定安全原語：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的通道支援由環境驅動的設定或驗證，且通用啟動/設定
流程應在執行階段載入前知道那些環境名稱，請在
Plugin manifest 中以 `channelEnvVars` 宣告它們。通道執行階段 `envVars` 或本機
常數只保留給面向操作者的文案。

如果你的通道可在 Plugin 執行階段啟動前出現在 `status`、`channels list`、`channels status` 或
SecretRef 掃描中，請在
`package.json` 加入 `openclaw.setupEntry`。該進入點應可安全匯入於唯讀命令
路徑，並應傳回這些摘要所需的通道中繼資料、設定安全設定配接器、狀態
配接器，以及通道祕密目標中繼資料。不要
從設定進入點啟動用戶端、監聽器或傳輸執行階段。

主通道進入匯入路徑也要保持精簡。探索可以評估
進入點和通道 Plugin 模組以註冊能力，而不啟用
通道。像 `channel-plugin-api.ts` 這類檔案應匯出通道
Plugin 物件，而不要匯入設定精靈、傳輸用戶端、socket
監聽器、子程序啟動器或服務啟動模組。將這些執行階段
元件放在由 `registerFull(...)`、執行階段 setter 或延遲
能力配接器載入的模組中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有當你也需要較重的共用設定/組態輔助工具時，才使用較廣泛的 `openclaw/plugin-sdk/setup` 接縫，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

如果你的通道只想在設定介面中宣傳「先安裝此 Plugin」，偏好使用 `createOptionalChannelSetupSurface(...)`。產生的
配接器/精靈會在設定寫入與最終化時封閉失敗，並在驗證、最終化與文件連結
文案中重用相同的需要安裝訊息。

對其他熱門通道路徑，偏好使用較窄的輔助工具，而非較廣泛的舊版
介面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers` 用於多帳號設定與
  預設帳號後援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch` 用於入站路由/信封與
  記錄並分派接線
- `openclaw/plugin-sdk/messaging-targets` 用於目標剖析/比對
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime` 用於媒體載入，以及出站
  身分/傳送委派與負載規劃
- 當出站路由應保留明確的 `replyToId`/`threadId`，或在基礎工作階段鍵仍然相符後恢復目前的 `:thread:` 工作階段時，使用
  來自 `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。
  提供者 Plugin 可在其平台具有原生討論串遞送語意時，覆寫
  優先順序、後綴行為與討論串 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime` 用於討論串綁定生命週期
  和配接器註冊
- 只有在仍需要舊版代理程式/媒體
  負載欄位配置時，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用於 Telegram 自訂命令
  正規化、重複/衝突驗證，以及後援穩定的命令
  設定合約

僅驗證通道通常可以停在預設路徑：核心處理批准，而 Plugin 只公開出站/驗證能力。Matrix、Slack、Telegram 和自訂聊天傳輸等原生批准通道，應使用共用原生輔助工具，而不是自行實作批准生命週期。

## 入站提及政策

將入站提及處理保持分成兩層：

- Plugin 擁有的證據收集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策決策。
只有在需要較廣泛的入站
輔助工具桶時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合 Plugin 本機邏輯：

- 回覆機器人偵測
- 引用機器人偵測
- 討論串參與檢查
- 服務/系統訊息排除
- 證明機器人參與所需的平台原生快取

適合共用輔助工具：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令繞過
- 最終略過決策

建議流程：

1. 計算本機提及事實。
2. 將這些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的入站閘門中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

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

`api.runtime.channel.mentions` 會公開相同的共用提及輔助工具，供已依賴執行階段注入的內建頻道 Plugin 使用：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，請從
`openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入不相關的入站執行階段輔助工具。

較舊的 `resolveMentionGating*` 輔助工具仍保留在
`openclaw/plugin-sdk/channel-inbound` 上，但僅作為相容性匯出。新程式碼應使用
`resolveInboundMentionDecision({ facts, policy })`。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="套件與資訊清單">
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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。將它用於 Plugin 擁有、但不屬於頻道帳號組態的設定。`channelConfigs`
    會驗證 `channels.acme-chat`，並且是在 Plugin 執行階段載入前，組態結構描述、設定流程和 UI 介面使用的冷路徑來源。

  </Step>

  <Step title="建構頻道 Plugin 物件">
    `ChannelPlugin` 介面有許多選用的配接器介面。從最小需求開始，也就是 `id` 和 `setup`，再依需求加入配接器。

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

    對於同時接受標準頂層 DM 鍵與舊版巢狀鍵的頻道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助工具：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳號本機值優先於繼承的根層值。請將同一個解析器與透過 `normalizeLegacyDmAliases` 的 doctor 修復配對，讓執行階段與遷移讀取相同合約。

    <Accordion title="createChatChannelPlugin 會為你做什麼">
      你不需要手動實作低階配接器介面，而是傳入宣告式選項，由建構器將它們組合起來：

      | 選項 | 接線內容 |
      | --- | --- |
      | `security.dm` | 來自組態欄位的範圍化 DM 安全性解析器 |
      | `pairing.text` | 以文字為基礎、透過代碼交換的 DM 配對流程 |
      | `threading` | 回覆模式解析器（固定、帳號範圍或自訂） |
      | `outbound.attachedResults` | 傳回結果中繼資料（訊息 ID）的傳送函式 |

      如果需要完整控制，也可以傳入原始配接器物件，而不是宣告式選項。

      原始出站配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳遞時的格式化決策，
      例如 `maxLinesPerMessage`；請在傳送前套用它，讓回覆執行緒與分塊邊界由共用出站傳遞一次解析。
      當已解析原生回覆目標時，傳送情境也會包含 `replyToIdSource`（`implicit` 或 `explicit`），因此承載輔助工具可以保留明確回覆標籤，而不會消耗隱含的一次性回覆位置。
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

    將頻道擁有的 CLI 描述器放在 `registerCliMetadata(...)` 中，這樣 OpenClaw
    就能在不啟用完整頻道執行階段的情況下，將它們顯示在根說明中，
    而一般完整載入仍會取得相同描述器，用於實際命令註冊。將 `registerFull(...)` 保留給僅限執行階段的工作。
    如果 `registerFull(...)` 會註冊 Gateway RPC 方法，請使用
    Plugin 專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，且一律解析為 `operator.admin`。
    `defineChannelPluginEntry` 會自動處理註冊模式分流。所有選項請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，用於在 onboarding 期間輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道停用或尚未設定時，OpenClaw 會載入此項，而不是完整進入點。
    這可避免在設定流程中拉入沉重的執行階段程式碼。
    詳情請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出拆分到 sidecar 模組的內建工作區頻道，
    若也需要明確的設定期間執行階段 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理入站訊息">
    你的 Plugin 需要從平台接收訊息，並將它們轉送給
    OpenClaw。典型模式是使用 Webhook 驗證請求，並透過你頻道的入站處理器分派它：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      自己的傳入管線。請參考隨附的通道 Plugin
      （例如 Microsoft Teams 或 Google Chat Plugin 套件）以了解實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="測試">
在 `src/channel.test.ts` 中撰寫並置測試：

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

    如需共用測試輔助工具，請參閱[測試](/zh-TW/plugins/sdk-testing)。

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
  <Card title="執行緒選項" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳戶範圍或自訂回覆模式
  </Card>
  <Card title="訊息工具整合" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="目標解析" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="Runtime 輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體、透過 api.runtime 的子代理
  </Card>
  <Card title="通道回合核心" icon="bolt" href="/zh-TW/plugins/sdk-channel-turn">
    共用的傳入回合生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分隨附的輔助接縫仍保留，用於維護隨附 Plugin 與
相容性。它們不是新通道 Plugin 的建議模式；
除非你正在直接維護該隨附 Plugin 系列，否則請優先使用通用 SDK
表面中的通用通道、設定、回覆與 runtime 子路徑。
</Note>

## 後續步驟

- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) — 如果你的 Plugin 也提供模型
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) — 測試工具與合約測試
- [Plugin Manifest](/zh-TW/plugins/manifest) — 完整 manifest 結構描述

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
