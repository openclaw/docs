---
read_when:
    - 你正在建置新的訊息通道外掛
    - 你想將 OpenClaw 連接到訊息平台
    - 你需要了解 ChannelPlugin 轉接器介面
sidebarTitle: Channel Plugins
summary: 建置 OpenClaw 訊息通道外掛的逐步指南
title: 建置通道外掛
x-i18n:
    generated_at: "2026-07-05T11:37:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c0151fad0915cda90987aa2401d1d4a326f7922cf5d838171a4014a84ad713f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會建立一個頻道外掛，將 OpenClaw 連接到訊息平台：DM 安全性、配對、回覆串接，以及對外傳訊。

<Info>
  第一次接觸 OpenClaw 外掛？請先閱讀[開始使用](/zh-TW/plugins/building-plugins)，了解套件結構與 manifest 設定。
</Info>

## 你的外掛負責什麼

頻道外掛不實作傳送/編輯/反應工具；核心會提供一個共用的 `message` 工具。你的外掛負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - DM 政策與允許清單
- **配對** - DM 核准流程
- **工作階段文法** - 特定提供者的對話 ID 如何對應到基礎聊天、討論串 ID，以及父層後援
- **對外傳訊** - 將文字、媒體和投票傳送到平台
- **討論串** - 回覆如何串接
- **心跳偵測輸入狀態** - 適用於心跳偵測傳遞目標的選用輸入中/忙碌訊號

核心負責共用的訊息工具、提示接線、外層工作階段鍵形狀、通用 `:thread:` 簿記，以及分派。

## 訊息轉接器

從 `openclaw/plugin-sdk/channel-outbound` 使用 `defineChannelMessageAdapter` 暴露 `message` 轉接器。只宣告你的原生傳輸實際支援、且持久的最終傳送能力，並以合約測試證明原生副作用和回傳的收據。文字/媒體傳送應指向既有 `outbound` 轉接器使用的相同傳輸函式。完整 API 合約、能力矩陣、收據規則、即時預覽最終化、接收確認政策、測試與遷移表，請參閱[頻道對外傳訊 API](/zh-TW/plugins/sdk-channel-outbound)。

如果你現有的 `outbound` 轉接器已具備正確的傳送方法和能力中繼資料，請改用 `createChannelMessageAdapterFromOutbound(...)` 衍生 `message` 轉接器，而不是手寫另一個橋接。轉接器傳送會回傳 `MessageReceipt` 值。對於舊版 ID，請使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 衍生，而不是保留平行的 `messageIds` 欄位。

精確宣告即時與最終化器能力 - 核心會用這些能力決定頻道能做什麼，且宣告與實際行為之間的偏移會導致合約測試失敗：

| 介面                                  | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

會就地最終化草稿預覽的頻道，應透過 `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯，並以 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和 `verifyChannelMessageLiveFinalizerProofs(...)` 測試支撐宣告的能力，確保原生預覽、進度、編輯、後援/保留、清理與收據行為不會無聲偏移。

會延後平台確認的入站接收器，應宣告 `message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把確認時機藏在監視器本機狀態中。使用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆蓋每個宣告的政策。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply` 等舊版回覆輔助工具，仍可供相容性分派器使用。不要在新的頻道程式碼中使用它們；請改從 `message` 轉接器、收據，以及 `openclaw/plugin-sdk/channel-outbound` 上的接收/傳送生命週期輔助工具開始。

### 入站進入點（實驗性）

正在遷移入站授權的頻道，可以從執行階段接收路徑使用實驗性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。它接受平台事實、原始允許清單、路由描述子、命令事實與存取群組設定，然後回傳寄件者/路由/命令/啟用投影與有序的進入圖，同時平台查詢和副作用仍留在外掛中。將外掛身分正規化保留在你傳給解析器的描述子中；不要序列化已解析狀態或決策中的原始比對值。API 設計、所有權邊界與測試期望，請參閱[頻道進入 API](/zh-TW/plugins/sdk-channel-ingress)。較舊的 `openclaw/plugin-sdk/channel-ingress` 子路徑會繼續匯出，作為第三方外掛的已棄用相容性 facade。

### 輸入指示器

如果你的頻道支援入站回覆以外的輸入指示器，請在頻道外掛上暴露 `heartbeat.sendTyping(...)`。核心會在心跳偵測模型執行開始前，使用已解析的心跳偵測傳遞目標呼叫它，並使用共用的輸入中 keepalive/清理生命週期。當平台需要明確的停止訊號時，請加入 `heartbeat.clearTyping(...)`。

### 媒體來源參數

如果你的頻道新增了攜帶媒體來源的訊息工具參數，請透過 `plugin.actions.describeMessageTool(...).mediaSourceParams` 暴露那些參數名稱。核心會使用該明確清單進行沙箱路徑正規化和對外傳訊媒體存取政策，因此外掛不需要為特定提供者的頭像、附件或封面圖片參數加入共用核心特殊案例。

偏好使用依動作鍵控的對應，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，讓無關動作不會繼承另一個動作的媒體引數。若參數刻意在每個已暴露動作之間共用，扁平陣列仍可運作。

必須為平台端媒體擷取暴露暫時公開 URL 的頻道，可搭配外掛狀態儲存使用 `openclaw/plugin-sdk/outbound-media` 中的 `createHostedOutboundMediaStore(...)`。將平台路由剖析和權杖強制執行保留在頻道外掛中；共用輔助工具只負責媒體載入、到期中繼資料、區塊列與清理。

### 原生酬載塑形

如果你的頻道需要針對 `message(action="send")` 做提供者特定塑形，請偏好使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入或其他持久資料放在 `payload.channelData.<channel>` 底下，並讓核心透過 outbound/message 轉接器傳送。只有在酬載無法序列化與重試時，才把 `actions.handleAction(...)` 用於傳送，作為相容性後援。

### 工作階段對話文法

如果你的平台在對話 ID 內儲存額外範圍，請透過 `messaging.resolveSessionConversation(...)` 將剖析保留在外掛中。這是將 `rawId` 對應到基礎對話 ID、選用討論串 ID、明確 `baseConversationId`，以及任何 `parentConversationCandidates` 的標準鉤子。當你回傳 `parentConversationCandidates` 時，請從最窄的父層到最寬/基礎對話排序。

`messaging.resolveParentConversationCandidates(...)` 是已棄用的相容性後援，適用於只需要在通用/原始 ID 之上提供父層後援的外掛。如果兩個鉤子都存在，核心會先使用 `resolveSessionConversation(...).parentConversationCandidates`，且只有在標準鉤子省略它們時，才後援到 `resolveParentConversationCandidates(...)`。

在頻道登錄檔啟動前需要相同剖析的內建外掛，可以暴露一個頂層 `session-key-api.ts` 檔案，並提供相符的 `resolveSessionConversation(...)` 匯出（請參閱 Feishu 和 Telegram 外掛）。核心只會在執行階段外掛登錄檔尚不可用時，使用這個可安全啟動的介面。

當外掛程式碼需要正規化類路由欄位、比較子討論串與其父層路由，或從 `{ channel, to, accountId, threadId }` 建立穩定去重鍵時，請使用 `openclaw/plugin-sdk/channel-route`。輔助工具會以核心相同方式正規化數值討論串 ID，因此請優先使用它，而非臨時的 `String(threadId)` 比較。具有提供者特定目標文法的外掛，應暴露 `messaging.resolveOutboundSessionRoute(...)`，讓核心取得提供者原生的工作階段與討論串身分，而不需要剖析器 shim。

## 核准與頻道能力

大多數頻道外掛不需要核准特定程式碼。核心負責同聊天的 `/approve`、共用核准按鈕酬載，以及通用後援傳遞。`ChannelPlugin.approvals` 已移除；請改將核准傳遞/原生/render/auth 事實放在同一個 `approvalCapability` 物件上。`plugin.auth` 只用於登入/登出 - 核心不再從該物件讀取核准 auth 鉤子。

只有在原生核准路由或後援抑制時，才使用 `approvalCapability.delivery`；只有當頻道真的需要自訂核准酬載、而不是共用 renderer 時，才使用 `approvalCapability.render`。

### 核准 auth

- `approvalCapability.authorizeActorAction` 和
  `approvalCapability.getActionAvailabilityState` 是標準的
  核准 auth 介面。
- 對同聊天核准 auth 可用性使用 `getActionAvailabilityState`。
  即使原生傳遞已停用，仍要讓已設定的核准者可用於 `/approve`；改用原生發起介面狀態提供傳遞/設定指引。
- 如果你的頻道暴露原生 exec 核准，請在發起介面/原生用戶端狀態與同聊天核准 auth 不同時，使用
  `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該 exec 特定鉤子來區分 `enabled` 與
  `disabled`、判斷發起頻道是否支援原生 exec 核准，並將該頻道納入原生用戶端後援指引。
  `createApproverRestrictedNativeApprovalCapability(...)` 會為常見情況填入此項。
- 如果頻道可以從既有設定推斷穩定的類擁有者 DM 身分，請使用
  `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 來限制同聊天 `/approve`，
  而不新增核准特定核心邏輯。
- 如果自訂核准 auth 刻意只允許同聊天後援，請從
  `openclaw/plugin-sdk/approval-auth-runtime` 回傳
  `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否則核心會將結果視為明確的核准者授權。
- 如果頻道擁有的原生回呼會直接解析核准，請在解析前使用
  `isImplicitSameChatApprovalAuthorization(...)`，讓隱含後援仍經過頻道的一般執行者授權。

### 酬載生命週期與設定指引

- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload` 來處理頻道特定酬載生命週期行為，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入指示器。
- 當頻道想讓停用路徑回覆說明啟用原生 exec 核准所需的確切設定旋鈕時，請使用 `approvalCapability.describeExecApprovalSetup`。該鉤子會接收 `{ channel, channelLabel, accountId }`；具名帳號頻道應 render 帳號範圍路徑，例如
  `channels.<channel>.accounts.<id>.execApprovals.*`，而不是頂層預設值。
- 當外掛核准失敗指引可安全顯示於外掛核准無路由與逾時失敗時，請使用 `approvalCapability.describePluginApprovalSetup`。`createApproverRestrictedNativeApprovalCapability(...)` 不會從 `describeExecApprovalSetup` 推斷此項；只有在外掛與 exec 核准真的使用相同原生設定時，才明確傳入相同輔助工具。

### 原生核准傳遞

如果某個頻道需要原生核准遞送，請讓頻道程式碼專注於
目標正規化以及傳輸/呈現事實。使用
`openclaw/plugin-sdk/approval-runtime` 中的
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver` 和
`createApproverRestrictedNativeApprovalCapability`。將頻道特定事實放在
`approvalCapability.nativeRuntime` 後面，最好透過
`createChannelApprovalNativeRuntimeAdapter(...)` 或
`createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心可以組裝
處理常式，並擁有請求篩選、路由、去重、到期、閘道
訂閱，以及已路由至其他位置的通知。

`nativeRuntime` 拆分為幾個較小的接縫：

- `availability` - 帳戶是否已設定，以及請求是否
  應被處理
- `presentation` - 將共用的核准檢視模型對應為
  待處理/已解決/已過期的原生承載或最終動作
- `transport` - 準備目標並傳送/更新/刪除原生核准
  訊息
- `interactions` - 原生按鈕
  或反應的選用 bind/unbind/clear-action 鉤子，以及選用的 `cancelDelivered` 鉤子。當
  `deliverPending` 註冊程序內或持久化
  狀態（例如反應目標儲存）時，請實作
  `cancelDelivered`，如此若處理常式停止在 `bindPending` 執行前取消遞送，或
  `bindPending` 未回傳控制代碼時，該狀態就能被釋放
- `observe` - 選用的遞送診斷鉤子

其他核准輔助工具：

- 當頻道同時支援
  工作階段來源的原生遞送和明確核准轉送目標時，使用
  `openclaw/plugin-sdk/approval-native-runtime` 中的
  `createNativeApprovalChannelRouteGates`。此
  輔助工具會集中處理核准設定選擇、`mode` 處理、代理程式/工作階段
  篩選器、帳戶繫結、工作階段目標比對，以及目標清單比對，
  同時呼叫端仍擁有頻道 ID、預設轉送模式、帳戶
  查找、傳輸啟用檢查、目標正規化，以及回合來源
  目標解析。請勿用它建立核心擁有的頻道政策
  預設值；請明確傳入該頻道記載的預設模式。
- `createChannelNativeOriginTargetResolver` 預設會使用共用的頻道路由
  比對器來處理 `{ to, accountId, threadId }` 目標。只有在
  頻道具有供應商特定的等價規則時，才傳入
  `targetsMatch`，例如 Slack 時間戳前綴比對。當
  頻道需要在預設路由
  比對器或自訂 `targetsMatch` 回呼執行前將供應商 ID 規範化，
  同時保留原始目標供遞送使用時，請傳入 `normalizeTargetForMatch`。只有在已解析的
  遞送目標本身應被規範化時，才使用 `normalizeTarget`。
- 如果頻道需要執行階段擁有的物件，例如用戶端、權杖、Bolt
  應用程式或 webhook 接收器，請透過
  `openclaw/plugin-sdk/channel-runtime-context` 註冊它們。通用的執行階段內容
  登錄可讓核心從頻道
  啟動狀態啟動能力驅動的處理常式，而不必加入核准專用的包裝黏合程式碼。
- 只有在能力驅動的接縫
  尚不足以表達需求時，才使用較低階的 `createChannelApprovalHandler` 或
  `createChannelNativeApprovalRuntime`。
- 原生核准頻道必須透過這些輔助工具路由 `accountId` 和 `approvalKind`。
  `accountId` 會將多帳戶核准政策
  限定在正確的機器人帳戶，而 `approvalKind` 讓 exec 與 plugin
  核准行為可供頻道使用，而無需在
  核心中硬編碼分支。
- 核心也擁有核准重新路由通知。頻道外掛不應從
  `createChannelNativeApprovalRuntime` 傳送自己的「核准已送至 DM / 另一個頻道」
  後續訊息；相反地，請透過共用的核准能力輔助工具公開準確的來源 +
  核准者 DM 路由，並讓
  核心在把任何通知發回起始聊天之前彙總實際遞送。
- 端到端保留已遞送核准 ID 的種類。原生用戶端
  不應從頻道本機
  狀態猜測或重寫 exec 與 plugin 核准路由。
- 不同核准種類可以有意公開不同的原生
  介面。現有的 bundled 範例：Matrix 對 exec 和 plugin 核准維持相同的原生 DM/頻道
  路由與反應使用者體驗，同時仍允許
  驗證依核准種類而異；Slack 則讓 exec 和 plugin ID 都能使用原生核准路由。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為
  相容性包裝存在，但新程式碼應優先使用能力建構器，
  並在外掛上公開 `approvalCapability`。

### 較窄的核准執行階段子路徑

對於熱頻道進入點，當你只需要該系列的一部分時，請優先使用這些較窄的子路徑，而非較寬的
`approval-runtime` barrel：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要全部時，請優先使用 `openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`，而非較寬的總括介面。

### 設定子路徑

- `openclaw/plugin-sdk/setup-runtime` 涵蓋執行階段安全的設定輔助工具：
  `createSetupTranslator`、匯入安全的設定修補配接器
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)、查找備註輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  setup-proxy 建構器。
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝設定
  建構器，以及幾個設定安全的基礎項目：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled` 和 `splitSetupEntries`。
- 只有當你也需要較重的共用設定/組態輔助工具，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用
  較寬的 `openclaw/plugin-sdk/setup` 接縫。

如果你的頻道只想在設定介面中宣告「請先安裝此外掛」，
請優先使用 `createOptionalChannelSetupSurface(...)`。產生的
配接器/精靈會在組態寫入和完成時 fail closed，並且會在驗證、finalize 和 docs-link
文案中重用相同的需要安裝訊息。

如果你的頻道支援由環境驅動的設定或驗證，且通用啟動/組態
流程應在執行階段載入前知道這些環境變數名稱，請在
外掛 manifest 中以 `channelEnvVars` 宣告它們。將頻道執行階段 `envVars` 或本機
常數僅用於面向操作員的文案。

如果你的頻道可能在外掛執行階段啟動前出現在 `status`、`channels list`、`channels status` 或
SecretRef 掃描中，請在
`package.json` 加入 `openclaw.setupEntry`。該進入點應可在唯讀命令
路徑中安全匯入，並應回傳這些
摘要所需的頻道中繼資料、設定安全的組態配接器、
狀態配接器，以及頻道秘密目標中繼資料。請勿從
設定進入點啟動用戶端、監聽器或傳輸執行階段。

也請讓主要頻道進入匯入路徑保持狹窄。Discovery 可以評估
進入點和頻道外掛模組來註冊能力，而不
啟用該頻道。像 `channel-plugin-api.ts` 這類檔案應匯出
頻道外掛物件，而不匯入設定精靈、傳輸
用戶端、socket 監聽器、子程序啟動器或服務啟動模組。
將這些執行階段元件放在由 `registerFull(...)`、執行階段
setter 或惰性能力配接器載入的模組中。

### 其他較窄的頻道子路徑

對於其他熱頻道路徑，請優先使用較窄的輔助工具，而非較寬的舊版
介面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用於多帳戶組態和
  預設帳戶 fallback
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用於 inbound 路由/envelope 和
  record-and-dispatch wiring
- `openclaw/plugin-sdk/channel-targets`，用於目標解析輔助工具
- `openclaw/plugin-sdk/outbound-media`，用於媒體載入，以及
  `openclaw/plugin-sdk/channel-outbound`，用於 outbound 身分/傳送委派
  和承載規劃
- 當 outbound 路由應保留
  明確的 `replyToId`/`threadId`，或在基礎工作階段鍵仍相符後恢復目前的 `:thread:`
  工作階段時，使用
  `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。供應商外掛可以在
  其平台具有原生 thread 遞送語意時
  覆寫優先順序、尾碼行為和 thread ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於 thread-binding 生命週期
  和配接器註冊
- 僅在仍需要舊版代理程式/媒體
  承載欄位版面時，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`（已淘汰：沒有 bundled
  外掛在生產環境中使用它），用於 Telegram 自訂命令正規化、
  重複/衝突驗證，以及 fallback-stable 命令組態
  合約；新外掛程式碼請優先使用外掛本機的命令組態處理

僅驗證的頻道通常可以停在預設路徑：核心會處理
核准，而外掛只需公開 outbound/auth 能力。像 Matrix、Slack、Telegram 和自訂聊天傳輸這類
原生核准頻道，應使用共用的原生輔助工具，而不是自行建構核准
生命週期。

## Inbound 提及政策

將 inbound 提及處理分成兩層：

- 外掛擁有的證據收集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策決策。
只有在需要較寬的
inbound 輔助 barrel 時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合外掛本機邏輯的項目：

- 偵測回覆機器人
- 偵測引用機器人
- thread 參與檢查
- 服務/系統訊息排除
- 證明機器人參與所需的平台原生快取

適合共用輔助工具的項目：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令略過
- 最終略過決策

偏好的流程：

1. 計算本機提及事實。
2. 將這些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的 inbound gate 中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和
   `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
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

`matchesMentionWithExplicit(...)` 會回傳 boolean。`hasAnyMention`、
`isExplicitlyMentioned` 和 `canResolveExplicit` 來自頻道自己的
原生提及中繼資料（訊息實體、回覆機器人旗標等）；
當你的平台無法偵測它們時，請提供 `false`/`undefined` 值。

`api.runtime.channel.mentions` 會公開相同的共用提及輔助工具，供已依賴執行階段注入的
內建頻道外掛使用：
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`。

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
請從 `openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入
不相關的傳入執行階段輔助工具。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="套件與資訊清單">
    建立標準外掛檔案。`openclaw.plugin.json` 中的 `channels` 欄位
    （不是 `kind` 欄位）會將資訊清單標記為擁有某個頻道。完整的套件中繼資料介面請參閱
    [外掛設定與組態](/zh-TW/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。用它來處理
    外掛擁有、但不屬於頻道帳號組態的設定。
    `channelConfigs.acme-chat.schema` 會驗證 `channels.acme-chat`，並且是在
    外掛執行階段載入前，供組態結構描述、設定流程和 UI 介面使用的冷路徑來源。
    完整的頂層欄位參考請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。

  </Step>

  <Step title="建置頻道外掛物件">
    `ChannelPlugin` 介面有許多選用的配接器介面。從最低需求開始：
    `id`、`config` 和 `setup`，再依需要加入配接器。

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
        // Account resolution/inspection belongs on `config`, not `setup`.
        // `setup` covers onboarding writes (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
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
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
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
          channel: "acme-chat",
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

    對於同時接受標準頂層 DM 鍵與舊版巢狀鍵的頻道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助工具：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳號本機值優先於繼承自根層的值。請將相同的解析器搭配 `normalizeLegacyDmAliases` 的 doctor 修復一起使用，讓執行階段與遷移讀取相同合約。

    <Accordion title="createChatChannelPlugin 會為你做什麼">
      你不用手動實作低階配接器介面，而是傳入宣告式選項，讓建置器將它們組合起來：

      | 選項 | 連接的內容 |
      | --- | --- |
      | `security.dm` | 來自組態欄位的作用域 DM 安全性解析器 |
      | `pairing.text` | 透過代碼交換的文字型 DM 配對流程 |
      | `threading` | 回覆目標模式解析器（固定、帳號作用域或自訂） |
      | `outbound.attachedResults` | 傳回結果中繼資料（訊息 ID）的傳送函式；需要同層的 `channel` ID，讓核心可以標記傳回的遞送結果 |

      如果你需要完整控制，也可以傳入原始配接器物件，而不是宣告式選項。

      原始傳出配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶遞送時的格式決策，
      例如 `maxLinesPerMessage`；請在傳送前套用它，讓回覆串接
      與分塊邊界由共用的傳出遞送流程一次解析完成。
      傳送內容也會在解析出原生回覆目標時包含 `replyToIdSource`
      （`implicit` 或 `explicit`），讓酬載輔助工具可以保留
      明確回覆標記，而不消耗隱含的一次性回覆位置。
    </Accordion>

  </Step>

  <Step title="串接進入點">
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

    將頻道擁有的命令列介面描述元放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    可以在不啟用完整頻道執行階段的情況下，在根層說明中顯示它們，
    而一般完整載入仍會取得相同描述元，以進行真正的指令註冊。
    將 `registerFull(...)` 保留給僅限執行階段的工作。
    `defineChannelPluginEntry` 會自動處理註冊模式分流。
    如果 `registerFull(...)` 註冊閘道 RPC 方法，請使用
    外掛專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，並且一律
    解析為 `operator.admin`。所有選項請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，供上線設定期間輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道停用或尚未設定時，OpenClaw 會載入這個進入點，而不是完整進入點。
    這可避免在設定流程期間拉入龐大的執行階段程式碼。
    詳情請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出分割到 sidecar 模組的內建工作區頻道，
    如果也需要明確的設定時執行階段 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理傳入訊息">
    你的外掛需要從平台接收訊息，並將它們轉送給 OpenClaw。
    典型模式是使用網路鉤子來驗證請求，並透過你頻道的傳入處理常式分派：

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
      傳入訊息處理是頻道專屬的。每個頻道外掛都擁有
      自己的傳入管線。請參考內建頻道外掛
      （例如 Microsoft Teams 或 Google Chat 外掛套件）中的實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="測試">
在 `src/channel.test.ts` 中撰寫共置測試：

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
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    如需共用測試輔助工具，請參閱[測試](/zh-TW/plugins/sdk-testing)。

</Step>
</Steps>

## 檔案結構

```text
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
  <Card title="Threading options" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳戶範圍或自訂回覆模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體，以及透過 api.runtime 使用子代理
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/zh-TW/plugins/sdk-channel-inbound">
    共用輸入事件生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分 bundled 外掛輔助接縫仍存在，用於 bundled 外掛維護與相容性。這不是新通道外掛的建議模式；除非你直接維護該 bundled 外掛系列，否則請優先使用通用 SDK 介面中的通用通道、設定、回覆、執行階段子路徑。
</Note>

## 下一步

- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 如果你的外掛也提供模型
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試工具與合約測試
- [外掛 Manifest](/zh-TW/plugins/manifest) - 完整 Manifest schema

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [Agent harness 外掛](/zh-TW/plugins/sdk-agent-harness)
