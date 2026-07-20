---
read_when:
    - 你正在建置新的訊息通道外掛
    - 你想要將 OpenClaw 連接至訊息平台
    - 你需要瞭解 `ChannelPlugin` 介面卡介面。
sidebarTitle: Channel Plugins
summary: 逐步指南：為 OpenClaw 建置訊息通道外掛
title: 建置頻道外掛
x-i18n:
    generated_at: "2026-07-20T00:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f287892d3354362d1770e0a70f79f61b812ee6ad213ca5d82f9764e441eff130
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南將建立一個把 OpenClaw 連接至訊息平台的頻道外掛，涵蓋私訊安全性、配對、回覆討論串與外送訊息。

<Info>
  第一次使用 OpenClaw 外掛？請先閱讀[開始使用](/zh-TW/plugins/building-plugins)，
  了解套件結構與資訊清單設定。
</Info>

## 你的外掛負責的範圍

頻道外掛不實作傳送、編輯或回應工具；核心提供一個
共用的 `message` 工具。你的外掛負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - 私訊政策與允許清單
- **配對** - 私訊核准流程
- **工作階段文法** - 供應商特定的對話 ID 如何對應至基礎
  聊天、討論串 ID 與上層備援
- **外送** - 將文字、媒體與投票傳送至平台
- **討論串** - 回覆如何歸入討論串
- **心跳偵測輸入狀態** - 心跳偵測遞送目標可選用的輸入中／忙碌訊號

核心負責共用訊息工具、提示詞接線、外層工作階段金鑰結構、
通用 `:thread:` 帳務記錄與分派。

## 訊息介面卡

從 `openclaw/plugin-sdk/channel-outbound` 公開具有 `defineChannelMessageAdapter` 的
`message` 介面卡。只宣告原生傳輸實際支援且持久有效的最終傳送
功能，並以合約測試證明原生端副作用與傳回的收據。文字／媒體傳送應指向
舊版 `outbound` 介面卡所使用的相同傳輸函式。如需完整的 API
合約、功能矩陣、收據規則、即時預覽最終化、接收確認政策、測試與遷移表，
請參閱[頻道外送 API](/zh-TW/plugins/sdk-channel-outbound)。

如果現有的 `outbound` 介面卡已具有正確的傳送方法與
功能中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)` 衍生
`message` 介面卡，而不要手動編寫另一個
橋接器。介面卡傳送會傳回 `MessageReceipt` 值。對於舊版 ID，請使用
`listMessageReceiptPlatformIds(...)` 或
`resolveMessageReceiptPrimaryId(...)` 衍生，而不要保留平行的 `messageIds`
欄位。

請精確宣告即時與最終化器功能——核心會以此判斷頻道能執行哪些操作，
而宣告內容與實際行為之間的差異會導致合約測試失敗：

| 介面                                  | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

會原地最終化草稿預覽的頻道，應透過 `defineFinalizableLivePreviewAdapter(...)` 加上
`deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯，並讓所宣告的
功能由 `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
與 `verifyChannelMessageLiveFinalizerProofs(...)` 測試支援，避免原生預覽、
進度、編輯、備援／保留、清理與收據行為在未被察覺的情況下產生偏差。

延後平台確認的輸入接收器應宣告
`message.receive.defaultAckPolicy` 與 `supportedAckPolicies`，而不是將
確認時機隱藏在監視器的區域狀態中。請使用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 涵蓋每項已宣告的政策。

`dispatchInboundReplyWithBase` 與
`recordInboundSessionAndDispatchReply` 等舊版回覆輔助程式仍可供相容性
分派器使用。請勿在新的頻道程式碼中使用它們；請改為從 `message`
介面卡、收據，以及 `openclaw/plugin-sdk/channel-outbound` 上的接收／傳送生命週期輔助程式
開始。

### 輸入入口（實驗性）

正在遷移輸入授權的頻道，可從執行階段接收路徑使用實驗性的
`openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。它接受平台事實、原始允許清單、
路由描述元、命令事實與存取群組設定，接著傳回傳送者／路由／命令／啟用
投影及有序入口圖，而平台查詢與副作用仍保留在外掛中。請在傳給解析器的
描述元內保留外掛身分正規化；不要從解析後的狀態或決策序列化原始比對值。
如需 API 設計、責任邊界與測試要求，請參閱
[頻道入口 API](/zh-TW/plugins/sdk-channel-ingress)。

### 持久輸入與重播去重

採用持久輸入的頻道應使用 `openclaw/plugin-sdk/channel-outbound` 中的
`createChannelIngressMonitor`，除非需要實質不同的准入或提取
合約。請在單一接收關卡將原始傳輸封套加入佇列（接收時不進行正規化）；
對網路鉤子傳輸，應以持久附加是否完成作為傳輸確認的閘門；每個對話衍生
一條序列化通道，並在分派接手時將事件標記為完成。佇列的主鍵是
`(queue_name, event_id)`，完成時會將資料列標記為墓碑，而非刪除，因此平台
稍後再次遞送相同的 `event_id` 時，在墓碑保留期間內仍會被持久拒絕。
如需監視器 API 與關閉合約，請參閱
[頻道外送 API](/zh-TW/plugins/sdk-channel-outbound#durable-ingress-monitors)。

該墓碑構成重播防護的分層規則
（`openclaw/plugin-sdk/persistent-dedupe`）：已清空的頻道只有在防護的身分或保留期限超出佇列時，
才保留個別的重播防護——例如與傳輸遞送 ID 不同的邏輯訊息金鑰（Telegram
會對 `chat_id:message_id` 去重，因為防彈跳合併可能讓訊息以新的
`update_id` 再次出現），或比頻道墓碑保留期限更長的時間範圍。
如果防護金鑰會等同於清空程序的 `event_id`，採用清空程序時請刪除該
防護，並改為調整 `completedTtlMs`/`completedMaxEntries` 的大小，
使其涵蓋舊防護的時間範圍。與去重無關的保護（例如事件時間限制）不適用此
規則。穩定的外送訊息 ID 應使用 `openclaw/plugin-sdk/channel-outbound` 中的共用
外送回音登錄，而不是頻道區域的 TTL 快取。

#### 傳輸類別與保留

依據接收邊界所提供的復原保證對傳輸分類：

- **以確認為閘門的網路鉤子或事件遞送：**只有在持久附加完成後，
  才確認或傳回成功。附加失敗時，必須讓遞送仍可重試，或使接收邊界失敗。
  此類別包括 Slack、SMS、Zalo、Microsoft Teams、Google Chat、LINE 與
  Synology Chat。
- **等待式輪詢或串流遞送：**只有在附加完成後，才推進遠端游標
  或傳送傳輸確認。若沒有明確游標，請維持接收回呼的序列化與等待狀態，
  使附加失敗時接收迴圈無法繼續超前執行。Telegram 輪詢、Signal 與 Tlon
  使用此類別；Telegram 網路鉤子遞送則遵循上述以確認為閘門的規則。
- **不可重播的通訊端：**IRC、Mattermost、Twitch 與 Zalo Personal
  無法要求平台重新遞送已接受的事件。其持久佇列可保護程序當機時間窗並支援
  本機重新啟動復原；完成墓碑對平台重播幾乎不起作用。

將 30 天作為整體部署的墓碑 TTL 慣例，而非 SDK 預設值。高流量重新遞送時間窗
通常使用 20,000 筆已完成項目的上限；流量較低的等待式與不可重播傳輸通常使用
1,000-2,000 筆。目前的例外包括 LINE 的 4,096 筆上限、SMS 的 24 小時已完成
TTL，以及 Tlon 僅以上限控制的已完成保留。失敗資料列的上限也可能低於已完成
資料列的上限。TTL 與上限都會修剪資料列，因此實際保留會在最先觸及任一界限時
結束。只有在有文件記載的平台重試期間、需保留已發布的重播防護時間窗、預期
流量或磁碟預算，或不可重播傳輸等情況下才可偏離此慣例，並應以測試涵蓋保留
合約。

#### 至少一次副作用

清空分派會先執行命令副作用，之後輸入資料列才會進入完成墓碑狀態。若程序在
這兩個步驟之間當機，資料列會被重播，且可能再次執行副作用。此至少一次的當機
時間窗是預設合約。對於非等冪工作，例如寫入設定、清除儲存空間，或回覆通道
以外的可見確認，請使用 `openclaw/plugin-sdk/ingress-effect-once` 中的
`createIngressEffectOnce(...)`。每次呼叫都應提供穩定的輸入
`eventId` 與效果名稱。每個輸入佇列／帳號建立一個輔助程式，
並為該範圍使用穩定且唯一的 `namespacePrefix`，因為傳輸事件
ID 可能只在佇列內唯一。該輔助程式只會在效果成功後提交其持久宣告；若效果
擲回錯誤，便會釋放宣告，讓清空重試再次執行，而並行呼叫者會等待作用中的
宣告。若有提供 `onDiskError`，持久狀態錯誤會呼叫它並拒絕作業，
而不會退回使用程序記憶體。

將輔助程式的 `ttlMs` 設為至少等於頻道輸入墓碑保留期限，加上效果
提交與資料列完成之間的最大延遲，其中包括有界限的停機時間與清空重試。效果
記錄的 TTL 從提交時開始，而墓碑保留則在稍後完成時才開始；如果待處理資料列
的存續時間沒有上限，任何有限 TTL 都無法涵蓋任意長度的停機時間。墓碑不再能
重播該資料列後，較舊的效果記錄便成為無用負擔。請調整
`stateMaxEntries` 的大小，使其能容納該保留期間內可能存在的每個不同
事件／效果金鑰，並將佇列的已完成項目上限及每個事件的最大效果數納入考量。
較低的上限會在最舊記錄的 TTL 到期前將其逐出，導致該效果可以再次執行。
如果程序在效果成功後、宣告提交前終止，或持久化失敗，抑或記錄在其輸入資料列
仍待處理時到期，仍會存在殘餘的至少一次時間窗。

#### 帳號範圍重新啟動合約

頻道設定變更預設會重新啟動整個頻道。只有在設定解析僅讀取整個頻道共用欄位
與所選帳號、絕不讀取同層帳號，且閘道可以停止及啟動單一
`(channel, accountId)` 執行階段而不替換同層執行階段時，多帳號頻道才可以設定
`reload.accountScopedRestart: true`。

範圍限定路徑僅適用於
`channels.<channel>.accounts.<non-default-id>.*` 下的變更。若變更涉及共用頻道
欄位、`accounts.default`、已移除或無法解析的帳號，或可能影響繼承的混合
變更，則會提升為重新啟動整個頻道。未選擇啟用此功能的外掛一律使用整個頻道
路徑。

對使用持久輸入清空程序的頻道，帳號監視器的停止路徑必須先處理完所有已接受的
傳輸准入，再處置並等待其清空程序。啟動帳號時會開啟相同的帳號金鑰佇列，其
初始清空程序會復原尚未分派的持久資料列。請勿新增第二個重新載入專用的重播
階段；佇列復原是標準的重新啟動路徑。

請將此旗標視為功能宣告，而非效能偏好。合約測試應證明：新增及編輯某個具名
帳號時，同層帳號的解析後設定維持不變；停止一個帳號時，只會處理該帳號的
監視器與清空程序；而新的監視器只會復原該帳號的資料列一次。若無法證明任何
一項保證，請省略此旗標。

### 輸入狀態指示器

如果頻道支援輸入回覆以外的輸入狀態指示器，請在頻道外掛上公開
`heartbeat.sendTyping(...)`。核心會在心跳偵測模型執行開始前，使用已解析的心跳偵測
遞送目標呼叫它，並使用共用的輸入狀態維持／清理生命週期。若平台需要明確的
停止訊號，請新增 `heartbeat.clearTyping(...)`。

### 媒體來源參數

如果頻道新增了攜帶媒體來源的訊息工具參數，請透過
`plugin.actions.describeMessageTool(...).mediaSourceParams` 公開這些參數名稱。
核心會使用該明確清單進行沙箱路徑正規化與外送媒體存取政策處理，因此外掛不需
為供應商特定的頭像、附件或封面圖片參數在共用核心中加入特殊處理。

優先使用以動作為鍵的對應表，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，
如此不相關的動作就不會繼承其他動作的媒體引數。若參數是刻意要在每個公開動作間共用，
仍可使用扁平陣列。

若頻道必須公開暫時性的公用 URL，供平台端擷取媒體，
可搭配外掛狀態儲存區使用 `openclaw/plugin-sdk/outbound-media` 中的
`createHostedOutboundMediaStore(...)`。將平台路由解析與權杖強制執行保留在頻道外掛中；共用輔助函式
只負責媒體載入、到期中繼資料、分塊資料列及清理。

### 原生承載資料塑形

如果你的頻道需要針對 `message(action="send")` 進行供應商特定的塑形，
請優先使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入內容或
其他持久資料放在 `payload.channelData.<channel>` 下，並讓核心透過
輸出／訊息轉接器傳送。只有在承載資料無法序列化及重試時，才使用 `actions.handleAction(...)`
進行傳送，作為相容性備援。

### 工作階段對話文法

如果你的平台在對話 ID 內儲存額外範圍，請使用 `messaging.resolveSessionConversation(...)`
將該解析保留在外掛中。這是將
`rawId` 對應至基礎對話 ID、選用的討論串 ID、明確的
`baseConversationId`，以及任何
`parentConversationCandidates` 的標準掛鉤。傳回 `parentConversationCandidates` 時，
請依序從範圍最窄的父層排列到最廣泛的／基礎對話。

`messaging.resolveParentConversationCandidates(...)` 是已淘汰的
相容性備援，供只需在通用／原始 ID 上增加父層備援的外掛使用。
若兩個掛鉤都存在，核心會先使用
`resolveSessionConversation(...).parentConversationCandidates`，且僅在標準掛鉤
省略它們時，才備援至 `resolveParentConversationCandidates(...)`。

若隨附外掛需要在頻道登錄檔啟動前進行相同解析，
可公開頂層 `session-key-api.ts` 檔案，並提供相符的
`resolveSessionConversation(...)` 匯出（請參閱 Feishu 與 Telegram
外掛）。核心只會在執行階段外掛登錄檔尚不可用時，
使用這個啟動安全介面。

當外掛程式碼需要正規化類路由欄位、比較子討論串與其父路由，或從
`{ channel, to, accountId, threadId }` 建立穩定的去重鍵時，請使用 `openclaw/plugin-sdk/channel-route`。
此輔助函式會以與核心相同的方式正規化數字討論串 ID，因此請優先使用它，
而非臨時的 `String(threadId)` 比較。具有供應商特定目標文法的外掛
應公開 `messaging.resolveOutboundSessionRoute(...)`，讓核心無須解析器相容層，
即可取得供應商原生的工作階段與討論串身分。

### 帳號範圍的對話繫結支援

當頻道支援通用的目前對話繫結時，請設定
`conversationBindings.supportsCurrentConversationBinding`。`createChatChannelPlugin(...)`
預設會將此靜態能力設為 `true`。

若支援情況會因已設定的帳號而異，亦請實作
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`。
核心只會在啟用靜態能力後評估此同步掛鉤。
傳回 `false` 會使該帳號無法使用通用的目前對話能力、
繫結、查詢、列出、更新存取時間及解除繫結操作。
省略此掛鉤則會將靜態能力套用至每個帳號。

請從已載入的帳號設定或執行階段狀態解析答案。此掛鉤只管控
通用的目前對話繫結；不會取代已設定的繫結規則或外掛自有的
工作階段路由。契約測試應透過
`openclaw/plugin-sdk/channel-core` 匯出的
`ChannelPlugin["conversationBindings"]` 契約，至少涵蓋一個受支援帳號與一個不受支援帳號。

## 核准與頻道能力

大多數頻道外掛不需要核准專用程式碼。核心負責同一聊天的
`/approve`、共用核准按鈕承載資料，以及通用備援傳遞。
`ChannelPlugin.approvals` 已移除；請改將核准傳遞／原生／呈現／驗證
資訊放在單一 `approvalCapability` 物件上。`plugin.auth` 僅用於登入／登出；
核心不再從該物件讀取核准驗證掛鉤。

只有原生核准路由或抑制備援時才使用 `approvalCapability.delivery`，
且只有頻道確實需要自訂核准承載資料而非共用呈現器時，
才使用 `approvalCapability.render`。

### 核准驗證

- `approvalCapability.authorizeActorAction` 與
  `approvalCapability.getActionAvailabilityState` 是標準的
  核准驗證接縫。
- 使用 `getActionAvailabilityState` 表示同一聊天的核准驗證可用性。
  即使原生傳遞已停用，也應讓已設定的核准者可供 `/approve` 使用；
  傳遞／設定指引則改用原生起始介面狀態。
- 如果你的頻道公開原生執行核准，當起始介面／原生用戶端狀態
  與同一聊天的核准驗證不同時，請使用
  `approvalCapability.getExecInitiatingSurfaceState`。
  核心會使用該執行專用掛鉤來區分 `enabled` 與
  `disabled`、判斷起始頻道是否支援原生執行核准，
  並將該頻道納入原生用戶端備援指引。
  `createApproverRestrictedNativeApprovalCapability(...)` 會處理
  一般情況。
- 如果頻道可從現有設定推斷出穩定且類似擁有者的私訊身分，
  請使用 `openclaw/plugin-sdk/approval-runtime` 中的
  `createResolvedApproverActionAuthAdapter` 來限制同一聊天的 `/approve`，
  而不新增核准專用的核心邏輯。
- 如果自訂核准驗證刻意只允許同一聊天備援，請從
  `openclaw/plugin-sdk/approval-auth-runtime` 傳回
  `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否則核心會將結果視為明確的核准者授權。
- 如果頻道自有的原生回呼會直接解析核准，請在解析前使用
  `isImplicitSameChatApprovalAuthorization(...)`，如此隱含備援仍會經過
  頻道的一般執行者授權。

### 承載資料生命週期與設定指引

- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload` 處理頻道特定的承載資料生命週期
  行為，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入中
  指示器。
- 當頻道希望停用路徑的回覆說明啟用
  原生執行核准所需的確切設定項目時，請使用 `approvalCapability.describeExecApprovalSetup`。
  此掛鉤會接收 `{ channel, channelLabel, accountId }`；
  具名帳號頻道應呈現帳號範圍的路徑，例如
  `channels.<channel>.accounts.<id>.execApprovals.*`，而非頂層
  預設值。
- 當外掛核准失敗指引可安全地顯示於外掛核准無路由及逾時
  失敗時，請使用 `approvalCapability.describePluginApprovalSetup`。
  `createApproverRestrictedNativeApprovalCapability(...)` 不會從
  `describeExecApprovalSetup` 推斷這點；只有在外掛與執行核准確實使用相同的
  原生設定時，才明確傳入同一個輔助函式。

### 原生核准傳遞

如果頻道需要原生核准傳遞，請讓頻道程式碼專注於
目標正規化及傳輸／呈現資訊。請使用
`openclaw/plugin-sdk/approval-runtime` 中的
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver` 與
`createApproverRestrictedNativeApprovalCapability`。將頻道特定資訊置於
`approvalCapability.nativeRuntime` 後方，最好透過
`createChannelApprovalNativeRuntimeAdapter(...)` 或
`createLazyChannelApprovalNativeRuntimeAdapter(...)`，如此核心即可組裝
處理常式，並負責請求篩選、路由、去重、到期、閘道訂閱，
以及已路由至他處的通知。

`nativeRuntime` 已拆分為幾個較小的接縫：

- `availability` - 帳號是否已設定，以及是否應處理請求
- `presentation` - 將共用核准檢視模型對應至
  待處理／已解析／已到期的原生承載資料或最終動作
- `transport` - 準備目標，並傳送／更新／刪除原生核准
  訊息
- `interactions` - 原生按鈕或反應的選用繫結／解除繫結／清除動作掛鉤，
  以及選用的 `cancelDelivered` 掛鉤。當 `deliverPending`
  登錄程序內或持久狀態（例如反應目標儲存區）時，請實作
  `cancelDelivered`，如此若處理常式停止而在 `bindPending`
  執行前取消傳遞，或當 `bindPending` 未傳回控制代碼時，
  即可釋放該狀態
- `observe` - 選用的傳遞診斷掛鉤

其他核准輔助函式：

- 當頻道同時支援工作階段來源的原生傳遞與明確的核准轉送目標時，
  請使用 `openclaw/plugin-sdk/approval-native-runtime` 中的
  `createNativeApprovalChannelRouteGates`。此輔助函式集中處理核准設定選擇、
  `mode` 處理、代理程式／工作階段篩選、帳號繫結、
  工作階段目標比對及目標清單比對；呼叫端仍負責頻道 ID、
  預設轉送模式、帳號查詢、傳輸已啟用檢查、目標正規化，以及
  對話輪次來源目標解析。請勿用它建立核心自有的頻道政策
  預設值；請明確傳入頻道文件記載的預設模式。
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用
  共用頻道路由比對器。只有當頻道具有供應商特定的等價規則時，
  才傳入 `targetsMatch`，例如 Slack 時間戳記前綴比對。
  當頻道需要在預設路由比對器或自訂 `targetsMatch` 回呼執行前，
  將供應商 ID 標準化，同時保留原始目標以供傳遞時，請傳入
  `normalizeTargetForMatch`。只有已解析的傳遞目標本身也應標準化時，
  才使用 `normalizeTarget`。
- 如果頻道需要執行階段自有物件，例如用戶端、權杖、Bolt
  應用程式或網路鉤子接收器，請透過
  `openclaw/plugin-sdk/channel-runtime-context` 登錄。通用執行階段情境
  登錄檔讓核心能從頻道啟動狀態啟動能力驅動的處理常式，
  而不必新增核准專用包裝黏合程式碼。
- 只有在能力驅動的接縫表達力仍不足時，才使用較低階的
  `createChannelApprovalHandler` 或
  `createChannelNativeApprovalRuntime`。
- 原生核准頻道必須透過這些輔助函式路由
  `accountId` 與 `approvalKind`。
  `accountId` 會將多帳號核准政策限定於正確的機器人帳號，
  而 `approvalKind` 則讓頻道可取得執行與外掛核准行為，
  無須在核心中加入硬編碼分支。
- 核心也負責核准重新路由通知。頻道外掛不應從
  `createChannelNativeApprovalRuntime` 傳送自己的“核准已送至私訊／另一個頻道”
  後續訊息；請改為透過共用核准能力輔助函式公開準確的來源及
  核准者私訊路由，並讓核心彙總實際傳遞後，再將任何通知傳回
  起始聊天。
- 端對端保留已傳遞的核准 ID 種類。原生用戶端不應
  根據頻道本機狀態猜測或改寫執行與外掛核准路由。
- 將該明確的 `approvalKind` 傳入 `resolveApprovalOverGateway`。
  這會使用標準的 `approval.resolve` 服務，並在另一個介面先回覆時，
  傳回已記錄的勝出者。較舊的明確 `resolveMethod` 輸入
  仍供命令支援的控制項使用；新的原生動作不得使用它，也不得
  從 ID 推斷種類。
- 不同的核准種類可刻意公開不同的原生介面。
  目前的隨附範例：Matrix 對執行與外掛核准維持相同的原生私訊／頻道路由
  及反應使用者體驗，同時仍允許驗證依核准種類而異；Slack 則讓原生核准路由
  同時可用於執行與外掛 ID。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為
  相容性包裝函式存在，但新程式碼應優先使用能力建構器，
  並在外掛上公開 `approvalCapability`。

### 範圍較窄的核准執行階段子路徑

對於頻繁使用的頻道進入點，若只需要該功能族群的一部分，
請優先使用這些較窄的子路徑，而非較廣泛的
`approval-runtime` 匯出介面：

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

同樣地，當你不需要全部功能時，請優先使用
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 與
`openclaw/plugin-sdk/reply-chunking`，而非較廣泛的傘狀介面。

### 設定子路徑

- `openclaw/plugin-sdk/setup-runtime` 涵蓋執行階段安全的設定輔助工具：
  `createSetupTranslator`、可安全匯入的設定修補配接器
  （`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查詢備註輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  設定代理建構器。
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝的設定
  建構器，以及一些設定安全的基礎元件：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled` 和 `splitSetupEntries`。
- 僅在你也需要較大型的共用設定／組態輔助工具（例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)`）時，才使用範圍較廣的 `openclaw/plugin-sdk/setup` 介面。

如果你的頻道只想在設定介面中宣告「請先安裝此外掛」，
請優先使用 `createOptionalChannelSetupSurface(...)`。產生的
配接器／精靈會在組態寫入和完成作業時採取封閉式失敗，並在驗證、完成及文件連結
文案中重複使用相同的「需要安裝」訊息。

如果你的頻道支援由環境變數驅動的設定或驗證，請透過
頻道組態結構描述和設定描述元公開此功能。頻道執行階段的 `envVars` 或
本機常數僅用於提供給操作人員的文案。

如果你的頻道可能在外掛執行階段啟動前出現在 `status`、`channels list`、`channels status` 或
SecretRef 掃描中，請在
`package.json` 中新增 `openclaw.setupEntry`。此進入點應可安全地匯入至唯讀命令
路徑，並應傳回這些摘要所需的頻道中繼資料、設定安全的組態配接器、
狀態配接器和頻道祕密目標中繼資料。
請勿從設定進入點啟動用戶端、監聽器或傳輸執行階段。

主要頻道進入點的匯入路徑也應保持精簡。探索程序可以評估
該進入點和頻道外掛模組，以註冊功能，而不必
啟用頻道。像 `channel-plugin-api.ts` 這類檔案應匯出
頻道外掛物件，而不要匯入設定精靈、傳輸
用戶端、通訊端監聽器、子程序啟動器或服務啟動模組。
請將這些執行階段元件放在由 `registerFull(...)` 載入的模組、執行階段
設定器或延遲載入的功能配接器中。

### 其他精簡頻道子路徑

對於其他頻道熱門路徑，請優先使用精簡輔助工具，而非範圍較廣的舊版
介面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用於多帳號組態和
  預設帳號後援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用於輸入路由／信封及
  記錄後分派的串接
- `openclaw/plugin-sdk/channel-targets`，用於目標剖析輔助工具
- `openclaw/plugin-sdk/channel-outbound`，用於輸出身分／傳送委派
  和具型別的承載資料規劃
- 當輸出路由應保留
  明確的 `replyToId`/`threadId`，或在基礎工作階段金鑰仍相符時復原目前的 `:thread:`
  工作階段，請使用 `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。若提供者外掛的
  平台具備原生討論串傳遞語意，便可覆寫優先順序、後綴行為和討論串 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於討論串繫結生命週期
  和配接器註冊

僅支援驗證的頻道通常使用預設路徑即可：核心會處理
核准，外掛只需公開輸出／驗證功能。Matrix、Slack、Telegram 等原生
核准頻道和自訂聊天傳輸，應使用共用原生輔助工具，而不是自行實作核准
生命週期。

## 輸入提及政策

將輸入提及處理拆分為兩層：

- 外掛擁有的證據蒐集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策決策。
僅在需要範圍較廣的
輸入輔助工具彙整介面時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合由外掛本機邏輯處理的項目：

- 偵測是否回覆機器人
- 偵測是否引用機器人
- 討論串參與檢查
- 排除服務／系統訊息
- 證明機器人參與所需的平台原生快取

適合由共用輔助工具處理的項目：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令略過
- 最終略過決策

建議流程：

1. 計算本機提及事實。
2. 將這些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的輸入閘門中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和
   `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";
import { resolveChannelImplicitMentions } from "openclaw/plugin-sdk/channel-ingress-runtime";

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

const implicitMentions = resolveChannelImplicitMentions({
  cfg,
  channel: channelId,
  accountId,
});

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    implicitMentions,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` 會傳回布林值。`hasAnyMention`、
`isExplicitlyMentioned` 和 `canResolveExplicit` 來自頻道本身的
原生提及中繼資料（訊息實體、回覆機器人旗標和類似資料）；
如果你的平台無法偵測它們，請提供 `false`/`undefined` 值。

`api.runtime.channel.mentions` 會為
已依賴執行階段注入的內建頻道外掛公開相同的共用提及輔助工具：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
請從 `openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入
不相關的輸入執行階段輔助工具。

## 操作指南

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="套件和資訊清單">
    建立標準外掛檔案。`openclaw.plugin.json` 中的
    `channels` 欄位（而非 `kind` 欄位）會將資訊清單標記為
    擁有某個頻道。如需完整的套件中繼資料介面，請參閱
    [外掛設定和組態](/zh-TW/plugins/sdk-setup#openclaw-channel)：

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
          "blurb": "將 OpenClaw 連接至 Acme Chat。"
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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將它用於
    不屬於頻道帳號組態、由外掛擁有的設定。
    `channelConfigs.acme-chat.schema` 會驗證 `channels.acme-chat`，並且是
    外掛執行階段載入前，由組態結構描述、設定和 UI 介面使用的冷路徑來源。
    如需完整的頂層欄位參考，請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。

  </Step>

  <Step title="建構頻道外掛物件">
    `ChannelPlugin` 介面具有許多選用的配接器介面。請從
    最低需求開始，即 `id`、`config` 和 `setup`，並視需要新增
    配接器。

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
        // 帳號解析／檢查應放在 `config`，而不是 `setup`。
        // `setup` 涵蓋初始設定寫入（applyAccountConfig、validateInput）。
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

    對於同時接受標準頂層 DM 鍵與舊版巢狀鍵的頻道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助函式：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 與 `normalizeChannelDmPolicy`，讓帳號本機值優先於繼承的根層級值。請將相同的解析器透過 `normalizeLegacyDmAliases` 與 doctor 修復配對，讓執行階段與遷移讀取相同的契約。

    <Accordion title="createChatChannelPlugin 會為你完成什麼">
      你不必手動實作低階配接器介面，只需傳入
      宣告式選項，建構器便會將其組合：

      | 選項 | 連接的功能 |
      | --- | --- |
      | `security.dm` | 從設定欄位取得具範圍限制的 DM 安全性解析器 |
      | `pairing.text` | 透過交換代碼進行文字式 DM 配對流程 |
      | `threading` | 回覆對象模式解析器（固定、帳號範圍或自訂） |
      | `outbound.attachedResults` | 傳回結果中繼資料（訊息 ID）的傳送函式；需要同層的 `channel` ID，核心才能在傳回的遞送結果上標記資訊 |

      若需要完整控制，也可以傳入原始配接器物件，
      而不使用宣告式選項。

      原始輸出配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶遞送時的格式化決策，
      例如 `maxLinesPerMessage`；請在傳送前套用，以便共用輸出遞送
      僅解析一次回覆討論串與分段界線。
      當原生回覆目標已解析時，傳送情境也會包含 `replyToIdSource`
      （`implicit` 或 `explicit`），讓酬載輔助函式可以保留
      明確的回覆標籤，而不會消耗隱含的單次使用回覆位置。
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

    將頻道所擁有的命令列介面描述元放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    無須啟用完整頻道執行階段，便能在根層級說明中顯示它們；
    一般的完整載入仍會取得相同的描述元，以進行實際的命令
    註冊。請將 `registerFull(...)` 保留給僅限執行階段的工作。
    `defineChannelPluginEntry` 會自動處理註冊模式的分流。
    如果 `registerFull(...)` 註冊閘道 RPC 方法，請使用
    外掛專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留狀態，且一律
    解析為 `operator.admin`。所有選項請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，以便在初始設定期間進行輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道已停用或尚未設定時，OpenClaw 會載入此項目，而非完整進入點。
    這可避免在設定流程期間載入繁重的執行階段程式碼。
    詳細資訊請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全的匯出拆分至附屬
    模組的內建工作區頻道，若也需要
    明確的設定階段執行階段設定函式，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理傳入訊息">
    你的外掛需要從平台接收訊息，並將其轉送至
    OpenClaw。典型模式是使用網路鉤子驗證要求，然後
    透過頻道的傳入處理常式分派要求：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 由外掛管理的驗證（自行驗證簽章）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的傳入處理常式會將訊息分派至 OpenClaw。
          // 實際的連接方式取決於你的平台 SDK —
          // 實際範例請參閱內建的 Microsoft Teams 或 Google Chat 外掛套件。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      傳入訊息處理視頻道而定。每個頻道外掛都擁有
      自己的傳入處理流程。實際模式請參閱內建的頻道外掛
      （例如 Microsoft Teams 或 Google Chat 外掛套件）。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="測試">
在 `src/channel.test.ts` 中撰寫共置測試：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat 外掛", () => {
      it("從設定解析帳號", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("檢查帳號而不具現化密鑰", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("回報缺少設定", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    共用測試輔助函式請參閱[測試](/zh-TW/plugins/sdk-testing)。

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
    └── runtime.ts            # 執行階段儲存區（若需要）
```

## 進階主題

<CardGroup cols={2}>
  <Card title="討論串選項" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳號範圍或自訂回覆模式
  </Card>
  <Card title="訊息工具整合" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="目標解析" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="執行階段輔助函式" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    透過 api.runtime 使用 TTS、STT、媒體、子代理程式
  </Card>
  <Card title="頻道傳入 API" icon="bolt" href="/zh-TW/plugins/sdk-channel-inbound">
    共用傳入事件生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
仍有一些內建輔助接縫，用於內建外掛維護與
相容性。這些並非新頻道外掛的建議模式；
除非你正在直接維護該內建外掛系列，否則請優先使用共用 SDK
介面中的通用頻道、設定、回覆與執行階段子路徑。
</Note>

## 後續步驟

- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 如果你的外掛也提供模型
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試工具與契約測試
- [外掛資訊清單](/zh-TW/plugins/manifest) - 完整的資訊清單結構描述

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [代理程式測試框架外掛](/zh-TW/plugins/sdk-agent-harness)
