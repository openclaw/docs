---
read_when:
    - 你正在建立新的訊息傳遞頻道外掛
    - 你想要將 OpenClaw 連接至訊息平台
    - 你需要瞭解 `ChannelPlugin` 介面卡的介面範圍
sidebarTitle: Channel Plugins
summary: 建立 OpenClaw 訊息通道外掛的逐步指南
title: 建置頻道外掛
x-i18n:
    generated_at: "2026-07-16T11:51:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會建置一個將 OpenClaw 連接至訊息
平台的頻道外掛：私訊安全性、配對、回覆串接，以及對外傳送訊息。

<Info>
  第一次使用 OpenClaw 外掛？請先閱讀[入門指南](/zh-TW/plugins/building-plugins)，
  以瞭解套件結構與資訊清單設定。
</Info>

## 你的外掛負責的項目

頻道外掛不會實作傳送／編輯／回應工具；核心會提供一個
共用的 `message` 工具。你的外掛負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - 私訊政策與允許清單
- **配對** - 私訊核准流程
- **工作階段語法** - 如何將供應商特定的對話 ID 對應至基礎
  聊天、討論串 ID 與父層後援
- **對外傳送** - 將文字、媒體與投票傳送至平台
- **討論串處理** - 回覆如何串接
- **心跳偵測輸入狀態** - 用於心跳偵測傳遞
  目標的選用輸入中／忙碌訊號

核心負責共用訊息工具、提示詞連接、外層工作階段索引鍵格式、
通用 `:thread:` 簿記，以及分派。

## 訊息配接器

公開一個 `message` 配接器，其中包含來自
`openclaw/plugin-sdk/channel-outbound` 的 `defineChannelMessageAdapter`。只宣告原生傳輸實際支援且持久有效的最終傳送
功能，並以合約測試證明原生端副作用與傳回的收據。文字／媒體
傳送應指向舊版 `outbound` 配接器使用的相同傳輸函式。如需完整的
API 合約、功能矩陣、收據規則、即時預覽
定稿、接收確認政策、測試與遷移表，請參閱
[頻道對外傳送 API](/zh-TW/plugins/sdk-channel-outbound)。

如果現有的 `outbound` 配接器已有正確的傳送方法與
功能中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)` 衍生
`message` 配接器，而不要手動另寫一個
橋接器。配接器傳送會傳回 `MessageReceipt` 值。對於舊版 ID，請使用
`listMessageReceiptPlatformIds(...)` 或
`resolveMessageReceiptPrimaryId(...)` 衍生，而不要保留平行的 `messageIds`
欄位。

請精確宣告即時與定稿器功能——核心會使用這些功能判斷
頻道可以執行哪些操作，而宣告與實際行為之間的偏差會導致
合約測試失敗：

| 介面                                  | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming`、`quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt`、`retainOnAmbiguousFailure`    |

會就地定稿草稿預覽的頻道，應透過
`defineFinalizableLivePreviewAdapter(...)` 加上
`deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯，並以
`verifyChannelMessageLiveCapabilityAdapterProofs(...)`
與 `verifyChannelMessageLiveFinalizerProofs(...)` 測試支援宣告的
功能，確保原生預覽、進度、編輯、後援／保留、清理與收據行為不會
在無提示的情況下發生偏差。

延後平台確認的輸入接收器應宣告
`message.receive.defaultAckPolicy` 與 `supportedAckPolicies`，而不是將
確認時機隱藏在監控器的區域狀態中。請使用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 涵蓋每個已宣告的政策。

`dispatchInboundReplyWithBase` 與
`recordInboundSessionAndDispatchReply` 等舊版回覆輔助函式仍可供相容性
分派器使用。請勿在新的頻道程式碼中使用它們；改從 `message`
配接器、收據，以及
`openclaw/plugin-sdk/channel-outbound` 上的接收／傳送生命週期輔助函式開始。

### 輸入進入流程（實驗性）

正在遷移輸入授權的頻道，可以從執行階段接收
路徑使用實驗性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。
它接受平台事實、原始允許清單、路由描述元、命令
事實與存取群組設定，接著傳回傳送者／路由／命令／啟用
投影及有序的進入流程圖，而平台查詢與副作用仍保留在外掛中。將外掛身分正規化邏輯保留在
你傳給解析器的描述元中；請勿序列化來自
已解析狀態或決策的原始比對值。關於 API 設計、
責任邊界與測試要求，請參閱
[頻道進入 API](/zh-TW/plugins/sdk-channel-ingress)。

### 輸入狀態指示器

如果你的頻道在輸入回覆以外的情境也支援輸入狀態指示器，請在頻道外掛上公開
`heartbeat.sendTyping(...)`。核心會在心跳偵測模型執行開始前，使用已解析的心跳偵測傳遞目標呼叫它，並
使用共用的輸入狀態保活／清理生命週期。如果平台需要明確的停止訊號，請新增
`heartbeat.clearTyping(...)`。

### 媒體來源參數

如果你的頻道新增了攜帶媒體來源的訊息工具參數，請透過
`plugin.actions.describeMessageTool(...).mediaSourceParams` 公開這些參數名稱。
核心會使用這份明確清單進行沙箱路徑正規化與對外傳送
媒體存取政策處理，因此外掛不需要為供應商特定的
頭像、附件或封面圖片參數在共用核心中加入特殊情況。

建議使用以動作為索引鍵的對應，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，
如此不相關的動作就不會繼承另一個動作的媒體引數。對於刻意由每個公開動作共用的參數，
仍可使用平面陣列。

必須公開暫時性公開 URL 供平台端擷取媒體的頻道，
可搭配外掛狀態儲存區使用來自
`openclaw/plugin-sdk/outbound-media` 的 `createHostedOutboundMediaStore(...)`。請將平台
路由剖析與權杖強制執行保留在頻道外掛中；共用輔助函式
只負責媒體載入、到期中繼資料、分塊資料列與清理。

### 原生酬載塑形

如果你的頻道需要針對 `message(action="send")` 進行供應商特定的塑形，
建議使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入內容或
其他持久資料放在 `payload.channelData.<channel>` 下，並讓核心透過
對外傳送／訊息配接器傳送。只有在酬載無法序列化並
重試時，才使用 `actions.handleAction(...)` 傳送，作為相容性後援。

### 工作階段對話語法

如果你的平台在對話 ID 中儲存額外範圍，請使用
`messaging.resolveSessionConversation(...)` 將剖析邏輯保留在外掛中。這是將
`rawId` 對應至基礎對話 ID、選用
討論串 ID、明確的 `baseConversationId`，以及任何
`parentConversationCandidates` 的標準掛鉤。傳回 `parentConversationCandidates` 時，
請依序從範圍最窄的父層排列至範圍最廣的父層／基礎對話。

`messaging.resolveParentConversationCandidates(...)` 是已棄用的
相容性後援，適用於只需在通用／原始 ID 之上提供父層後援的外掛。
如果兩個掛鉤都存在，核心會優先使用
`resolveSessionConversation(...).parentConversationCandidates`，且只有在標準
掛鉤省略這些項目時，才會後援至 `resolveParentConversationCandidates(...)`。

需要在頻道登錄檔啟動前執行相同剖析的隨附外掛，
可以公開頂層 `session-key-api.ts` 檔案，並提供相符的
`resolveSessionConversation(...)` 匯出（請參閱 Feishu 與 Telegram
外掛）。只有在執行階段外掛
登錄檔尚不可用時，核心才會使用這個啟動安全介面。

當外掛程式碼需要正規化
類路由欄位、比較子討論串與其父層路由，或從 `{ channel, to, accountId, threadId }` 建立
穩定的重複資料刪除索引鍵時，請使用 `openclaw/plugin-sdk/channel-route`。此輔助函式
會以與核心相同的方式正規化數字討論串 ID，因此請優先使用它，而不要自行進行
`String(threadId)` 比較。具有供應商特定目標語法的外掛
應公開 `messaging.resolveOutboundSessionRoute(...)`，讓核心無需剖析器相容層即可取得
供應商原生的工作階段與討論串身分。

### 帳號範圍的對話繫結支援

當頻道支援通用的目前對話繫結時，請設定
`conversationBindings.supportsCurrentConversationBinding`。`createChatChannelPlugin(...)`
預設會將這項靜態功能設定為 `true`。

如果支援情況會因設定的帳號而異，也請實作
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`。
核心只有在靜態功能啟用後，才會評估這個同步掛鉤。傳回 `false` 會讓該帳號無法使用通用的目前對話功能、
繫結、查詢、列出、更新存取時間與解除繫結操作。
省略此掛鉤則會將靜態功能套用至每個帳號。

請從已載入的帳號設定或執行階段狀態解析答案。這個
掛鉤只會管制通用的目前對話繫結；它不會取代
已設定的繫結規則或外掛自有的工作階段路由。合約測試
至少應透過
`openclaw/plugin-sdk/channel-core` 匯出的 `ChannelPlugin["conversationBindings"]` 合約，涵蓋一個受支援與一個不受支援的帳號。

## 核准與頻道功能

大多數頻道外掛不需要核准專用程式碼。核心負責同一聊天中的
`/approve`、共用的核准按鈕酬載，以及通用後援傳遞。
`ChannelPlugin.approvals` 已移除；請改將核准傳遞／原生／呈現／授權
事實放在單一 `approvalCapability` 物件上。`plugin.auth` 僅供登入／登出使用——
核心不再從該物件讀取核准授權掛鉤。

只有在處理原生核准路由或抑制後援時，才使用 `approvalCapability.delivery`；
只有當頻道確實需要自訂核准酬載而非共用轉譯器時，才使用 `approvalCapability.render`。

### 核准授權

- `approvalCapability.authorizeActorAction` 與
  `approvalCapability.getActionAvailabilityState` 是標準的
  核准授權接縫。
- 使用 `getActionAvailabilityState` 判斷同一聊天中的核准授權是否可用。
  即使原生傳遞已停用，也要讓設定的核准者可供 `/approve` 使用；
  傳遞／設定指引則使用原生起始介面狀態。
- 如果你的頻道公開原生執行核准，當起始介面／原生用戶端狀態與同一聊天中的
  核准授權不同時，請使用
  `approvalCapability.getExecInitiatingSurfaceState`。核心會使用這個執行專用掛鉤來區分 `enabled` 與
  `disabled`、判斷起始頻道是否支援原生執行
  核准，並將該頻道納入原生用戶端後援指引。
  `createApproverRestrictedNativeApprovalCapability(...)` 會為
  常見情況填入此資訊。
- 如果頻道可以從現有設定推斷出穩定且類似擁有者的私訊身分，
  請使用來自
  `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter`，限制同一聊天中的 `/approve`，
  而不新增核准專用的核心邏輯。
- 如果自訂核准授權刻意只允許同一聊天中的後援，請從
  `openclaw/plugin-sdk/approval-auth-runtime` 傳回
  `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否則核心會將結果視為明確的核准者授權。
- 如果頻道自有的原生回呼會直接解析核准，請在解析前使用
  `isImplicitSameChatApprovalAuthorization(...)`，確保隱含後援仍會經過
  頻道的一般執行者授權。

### 酬載生命週期與設定指引

- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload` 處理頻道特定的酬載生命週期
  行為，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入狀態
  指示器。
- 當頻道希望停用路徑的回覆說明啟用
  原生執行核准所需的確切設定項目時，請使用 `approvalCapability.describeExecApprovalSetup`。
  此掛鉤會接收 `{ channel, channelLabel, accountId }`；
  具名帳號頻道應轉譯帳號範圍的路徑，例如
  `channels.<channel>.accounts.<id>.execApprovals.*`，而非頂層
  預設值。
- 當外掛核准的無路由與逾時失敗指引
  可以安全地顯示時，請使用 `approvalCapability.describePluginApprovalSetup`。
  `createApproverRestrictedNativeApprovalCapability(...)` 不會
  從 `describeExecApprovalSetup` 推斷此資訊；只有在外掛與執行核准確實使用相同原生設定時，
  才明確傳入相同的輔助函式。

### 原生核准傳遞

如果頻道需要原生核准傳遞，請讓頻道程式碼專注於
目標正規化以及傳輸／呈現事實。使用來自
`openclaw/plugin-sdk/approval-runtime` 的
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver` 與
`createApproverRestrictedNativeApprovalCapability`。將頻道特定的事實置於
`approvalCapability.nativeRuntime` 後方，最好透過
`createChannelApprovalNativeRuntimeAdapter(...)` 或
`createLazyChannelApprovalNativeRuntimeAdapter(...)`，如此核心便可組裝
處理常式，並負責請求篩選、路由、重複資料刪除、到期、閘道
訂閱，以及已路由至其他位置的通知。

`nativeRuntime` 已拆分成幾個較小的接縫：

- `availability` - 帳戶是否已設定，以及是否應處理請求
- `presentation` - 將共用的核准檢視模型對應至
  待處理／已解決／已過期的原生承載資料或最終動作
- `transport` - 準備目標，以及傳送／更新／刪除原生核准
  訊息
- `interactions` - 原生按鈕或反應的選用繫結／解除繫結／清除動作鉤子，
  以及選用的 `cancelDelivered` 鉤子。當 `deliverPending` 註冊處理程序內或持久
  狀態（例如反應目標存放區）時，請實作
  `cancelDelivered`，如此一來，若處理程序停止導致傳遞在
  `bindPending` 執行前取消，或當 `bindPending` 未傳回控制代碼時，
  即可釋放該狀態
- `observe` - 選用的傳遞診斷鉤子

其他核准輔助工具：

- 當頻道同時支援工作階段來源的原生傳遞與明確的核准轉送目標時，
  請使用來自 `openclaw/plugin-sdk/approval-native-runtime` 的
  `createNativeApprovalChannelRouteGates`。此輔助工具集中處理核准設定選擇、
  `mode` 處理、代理程式／工作階段篩選條件、帳戶繫結、
  工作階段目標比對及目標清單比對，而呼叫端仍負責頻道 ID、
  預設轉送模式、帳戶查詢、傳輸啟用檢查、目標正規化，以及回合來源
  目標解析。請勿使用它建立核心擁有的頻道政策預設值；
  請明確傳入該頻道文件記載的預設模式。
- 對於 `{ to, accountId, threadId }` 目標，`createChannelNativeOriginTargetResolver` 預設使用共用的頻道路由
  比對器。只有當頻道具有提供者特定的等價規則時才傳入
  `targetsMatch`，例如 Slack 時間戳記前綴比對。當頻道需要在預設路由
  比對器或自訂 `targetsMatch` 回呼執行前將提供者 ID 標準化，
  同時保留原始目標供傳遞使用時，請傳入 `normalizeTargetForMatch`。
  只有在解析出的傳遞目標本身應標準化時，才使用 `normalizeTarget`。
- 若頻道需要由執行階段擁有的物件，例如用戶端、權杖、Bolt
  應用程式或網路鉤子接收器，請透過
  `openclaw/plugin-sdk/channel-runtime-context` 註冊。通用執行階段情境
  登錄讓核心能從頻道啟動狀態啟動由能力驅動的處理程序，而無須加入核准專用的包裝銜接程式碼。
- 只有在由能力驅動的接合面表達能力仍不足時，才採用較低階的
  `createChannelApprovalHandler` 或
  `createChannelNativeApprovalRuntime`。
- 原生核准頻道必須透過這些輔助工具路由 `accountId` 和 `approvalKind`。
  `accountId` 讓多帳戶核准政策限定於正確的機器人帳戶，
  而 `approvalKind` 讓頻道仍可使用執行核准與外掛核准的行為差異，
  無須在核心中使用硬式編碼的分支。
- 核心也擁有核准重新路由通知。頻道外掛不應從
  `createChannelNativeApprovalRuntime` 傳送自己的「核准已移至私訊／其他頻道」後續訊息；
  應改為透過共用核准能力輔助工具公開準確的來源與
  核准者私訊路由，並讓核心彙總實際傳遞後，再將任何通知發回
  發起聊天。
- 完整保留已傳遞核准 ID 的種類。原生用戶端不應根據頻道本機
  狀態猜測或改寫執行核准與外掛核准的路由。
- 將該明確的 `approvalKind` 傳入 `resolveApprovalOverGateway`。這會使用
  標準的 `approval.resolve` 服務，並在其他介面先回覆時傳回已記錄的勝出者。
  較舊的明確 `resolveMethod` 輸入仍保留給命令支援的控制項；
  新的原生動作不得使用它，也不得從 ID 推斷種類。
- 不同核准種類可刻意公開不同的原生介面。目前的內建範例：
  Matrix 對執行核准和外掛核准維持相同的原生私訊／頻道路由與反應使用者體驗，
  同時仍允許依核准種類採用不同驗證方式；Slack 則讓執行與外掛 ID
  都能使用原生核准路由。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為
  相容性包裝器存在，但新程式碼應優先使用能力建構器，並在外掛上公開
  `approvalCapability`。

### 範圍更窄的核准執行階段子路徑

對於頻繁使用的頻道進入點，若只需要該系列的其中一部分，請優先使用以下較窄的子路徑，
而非較廣泛的 `approval-runtime` 匯出介面：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要全部功能時，請優先使用 `openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`，而非較廣泛的傘狀介面。

### 設定子路徑

- `openclaw/plugin-sdk/setup-runtime` 涵蓋執行階段安全的設定輔助工具：
  `createSetupTranslator`、匯入安全的設定修補配接器
  （`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查詢備註輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  設定代理建構器。
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝設定
  建構器，以及一些設定安全的基礎元件：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled` 和 `splitSetupEntries`。
- 只有當你也需要較繁重的共用設定／組態輔助工具（例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）時，才使用較廣泛的
  `openclaw/plugin-sdk/setup` 接合面。

如果你的頻道只想在設定介面中宣告「請先安裝此外掛」，
請優先使用 `createOptionalChannelSetupSurface(...)`。產生的
配接器／精靈會在寫入組態和完成程序時採取失敗關閉，
並在驗證、完成及文件連結文案中重複使用相同的需要安裝訊息。

如果你的頻道支援由環境驅動的設定或驗證，且通用啟動／組態
流程應在載入執行階段前得知這些環境名稱，請在
外掛資訊清單中以 `channelEnvVars` 宣告。頻道執行階段的 `envVars` 或本機
常數僅保留用於面向操作人員的文案。

如果你的頻道可在外掛執行階段啟動前出現在 `status`、`channels list`、
`channels status` 或 SecretRef 掃描中，請在
`package.json` 加入 `openclaw.setupEntry`。該進入點應可安全匯入唯讀命令
路徑，並應傳回這些摘要所需的頻道中繼資料、設定安全的組態配接器、
狀態配接器及頻道祕密目標中繼資料。
請勿從設定進入點啟動用戶端、監聽器或傳輸執行階段。

主頻道進入點的匯入路徑也應保持精簡。探索程序可以評估
該進入點與頻道外掛模組，以註冊能力而不啟用頻道。
`channel-plugin-api.ts` 等檔案應匯出
頻道外掛物件，而不要匯入設定精靈、傳輸
用戶端、通訊端監聽器、子程序啟動器或服務啟動模組。
請將這些執行階段元件放在從 `registerFull(...)` 載入的模組、
執行階段設定器或延遲載入能力配接器中。

### 其他精簡頻道子路徑

對於其他頻繁使用的頻道路徑，請優先使用精簡輔助工具，而非較廣泛的舊版
介面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用於多帳戶組態與
  預設帳戶後援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用於傳入路由／封套及
  記錄後分派的配線
- `openclaw/plugin-sdk/channel-targets`，用於目標剖析輔助工具
- `openclaw/plugin-sdk/outbound-media`，用於媒體載入；以及
  `openclaw/plugin-sdk/channel-outbound`，用於傳出身分／傳送委派
  與承載資料規劃
- 當傳出路由應保留明確的
  `replyToId`/`threadId`，或在基本工作階段金鑰仍相符後復原目前的
  `:thread:` 工作階段時，請使用來自
  `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`。當提供者外掛的平台具有原生討論串
  傳遞語意時，可覆寫優先順序、尾碼行為及討論串 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於討論串繫結生命週期
  與配接器註冊
- 只有在仍需要舊版代理程式／媒體
  承載資料欄位配置時，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`（已棄用：沒有內建
  外掛在正式環境中使用），用於 Telegram 自訂命令正規化、
  重複／衝突驗證，以及具穩定後援的命令組態
  合約；新的外掛程式碼應優先使用外掛本機的命令組態處理

僅驗證的頻道通常可採用預設路徑即可：核心處理
核准，而外掛只公開傳出／驗證能力。Matrix、Slack、Telegram 等原生
核准頻道及自訂聊天傳輸應使用共用原生輔助工具，
而非自行建構核准生命週期。

## 傳入提及政策

將傳入提及處理分為兩層：

- 外掛擁有的證據蒐集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策決策。
只有在需要較廣泛的傳入輔助工具匯出介面時，才使用
`openclaw/plugin-sdk/channel-inbound`。

適合外掛本機邏輯：

- 回覆機器人偵測
- 引用機器人偵測
- 討論串參與檢查
- 服務／系統訊息排除
- 證明機器人參與所需的平台原生快取

適合共用輔助工具：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令略過
- 最終略過決策

建議流程：

1. 計算本機提及事實。
2. 將這些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的傳入閘門中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和
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

`matchesMentionWithExplicit(...)` 傳回布林值。`hasAnyMention`、
`isExplicitlyMentioned` 和 `canResolveExplicit` 來自頻道本身的
原生提及中繼資料（訊息實體、回覆機器人旗標等）；
當你的平台無法偵測這些資料時，請提供 `false`/`undefined` 值。

`api.runtime.channel.mentions` 為已依賴執行階段注入的
內建頻道外掛公開相同的共用提及輔助工具：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
請從 `openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入
不相關的傳入執行階段輔助工具。

## 操作導覽

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="套件與資訊清單">
    建立標準的外掛檔案。`openclaw.plugin.json` 中的 `channels` 欄位（而非 `kind` 欄位）用於標示資訊清單擁有某個頻道。如需完整的套件中繼資料介面，請參閱
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
          "blurb": "將 OpenClaw 連線至 Acme Chat。"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat 頻道外掛",
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
              "label": "機器人權杖",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將其用於不屬於頻道帳號組態、由外掛擁有的設定。
    `channelConfigs.acme-chat.schema` 會驗證 `channels.acme-chat`，也是外掛執行階段載入前供組態結構描述、設定流程和使用者介面使用的冷路徑來源。如需完整的頂層欄位參考，請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。

  </Step>

  <Step title="建立頻道外掛物件">
    `ChannelPlugin` 介面有許多選用的轉接器介面。請從最低需求開始：`id`、`config` 和 `setup`，再依需要加入轉接器。

    建立 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // 你的平台 API 用戶端

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
        // 帳號解析／檢查應放在 `config`，而非 `setup`。
        // `setup` 涵蓋新手引導寫入（applyAccountConfig、validateInput）。
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

      // 私訊安全性：誰可以傳訊息給機器人
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // 配對：新私訊聯絡人的核准流程
      pairing: {
        text: {
          idLabel: "Acme Chat 使用者名稱",
          message: "傳送此代碼以驗證你的身分：",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // 討論串：回覆的傳遞方式
      threading: { topLevelReplyToMode: "reply" },

      // 輸出：將訊息傳送至平台
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

    對於同時接受標準頂層私訊鍵與舊版巢狀鍵的頻道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助函式：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳號本機值優先於繼承的根層級值。透過 `normalizeLegacyDmAliases` 將同一個解析器與 doctor 修復配對，讓執行階段和遷移讀取相同的合約。

    <Accordion title="createChatChannelPlugin 為你完成的工作">
      你不必手動實作低階轉接器介面，只需傳入宣告式選項，建構器便會組合它們：

      | 選項 | 連接的功能 |
      | --- | --- |
      | `security.dm` | 從組態欄位建立限定範圍的私訊安全性解析器 |
      | `pairing.text` | 透過代碼交換進行文字式私訊配對流程 |
      | `threading` | 回覆模式解析器（固定、帳號範圍或自訂） |
      | `outbound.attachedResults` | 傳回結果中繼資料（訊息 ID）的傳送函式；需要同層的 `channel` ID，讓核心可在傳回的傳遞結果上加註標記 |

      如果需要完整控制，也可以傳入原始轉接器物件，而非宣告式選項。

      原始輸出轉接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳遞時的格式決策，例如 `maxLinesPerMessage`；請在傳送前套用，讓共用輸出傳遞只需解析一次回覆討論串和分段邊界。
      當原生回覆目標已解析時，傳送情境也會包含 `replyToIdSource`（`implicit` 或 `explicit`），讓承載資料輔助函式可以保留明確的回覆標籤，而不會耗用隱含的單次回覆位置。
    </Accordion>

  </Step>

  <Step title="連接進入點">
    建立 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat 頻道外掛",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat 管理");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat 管理",
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

    將頻道擁有的命令列介面描述元放在 `registerCliMetadata(...)` 中，讓 OpenClaw 無須啟用完整的頻道執行階段，就能在根說明中顯示它們；一般的完整載入仍會取得相同的描述元，以進行實際的命令註冊。將 `registerFull(...)` 保留給僅限執行階段的工作。
    `defineChannelPluginEntry` 會自動處理註冊模式的分流。
    如果 `registerFull(...)` 註冊閘道 RPC 方法，請使用外掛專屬的前綴。核心管理命名空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）維持保留，且一律解析為 `operator.admin`。如需所有選項，請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，以便在新手引導期間輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道停用或尚未設定時，OpenClaw 會載入此項，而非完整進入點。這可避免在設定流程期間載入繁重的執行階段程式碼。如需詳細資訊，請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出拆分至附屬模組的內建工作區頻道，如果也需要明確的設定期間執行階段設定器，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理傳入訊息">
    你的外掛需要從平台接收訊息，並將其轉送至 OpenClaw。典型模式是使用網路鉤子驗證要求，並透過頻道的傳入處理常式分派：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 由外掛管理的驗證（自行驗證簽章）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的傳入處理常式會將訊息分派至 OpenClaw。
          // 確切的連接方式取決於你的平台 SDK——
          // 請參閱內建 Microsoft Teams 或 Google Chat 外掛套件中的實際範例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      傳入訊息處理因頻道而異。每個頻道外掛都擁有自己的傳入管線。請查看內建頻道外掛（例如 Microsoft Teams 或 Google Chat 外掛套件）中的實際模式。
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

    如需共用的測試輔助工具，請參閱[測試](/zh-TW/plugins/sdk-testing)。

</Step>
</Steps>

## 檔案結構

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 中繼資料
├── openclaw.plugin.json      # 含設定結構描述的資訊清單
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開匯出（選用）
├── runtime-api.ts            # 內部執行階段匯出（選用）
└── src/
    ├── channel.ts            # 透過 createChatChannelPlugin 建立的 ChannelPlugin
    ├── channel.test.ts       # 測試
    ├── client.ts             # 平台 API 用戶端
    └── runtime.ts            # 執行階段儲存區（如有需要）
```

## 進階主題

<CardGroup cols={2}>
  <Card title="執行緒選項" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳號範圍或自訂回覆模式
  </Card>
  <Card title="訊息工具整合" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="目標解析" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、STT、媒體與子代理程式
  </Card>
  <Card title="頻道入站 API" icon="bolt" href="/zh-TW/plugins/sdk-channel-inbound">
    共用的入站事件生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分隨附的輔助介面仍為維護隨附外掛及相容性而保留。
不建議新頻道外掛採用這些模式；除非你正在直接維護該隨附外掛系列，
否則請優先使用通用 SDK 介面中的一般頻道、設定、回覆及執行階段子路徑。
</Note>

## 後續步驟

- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 如果你的外掛也提供模型
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試公用程式與契約測試
- [外掛資訊清單](/zh-TW/plugins/manifest) - 完整的資訊清單結構描述

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [代理程式測試框架外掛](/zh-TW/plugins/sdk-agent-harness)
