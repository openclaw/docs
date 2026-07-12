---
read_when:
    - 你正在建置新的訊息通道外掛
    - 你想要將 OpenClaw 連接至訊息平台
    - 你需要了解 `ChannelPlugin` 轉接器介面
sidebarTitle: Channel Plugins
summary: 逐步指南：為 OpenClaw 建置訊息通道外掛
title: 建置頻道外掛
x-i18n:
    generated_at: "2026-07-12T14:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會建置一個將 OpenClaw 連接至訊息平台的頻道外掛：私訊安全性、配對、回覆討論串，以及對外訊息傳送。

<Info>
  第一次使用 OpenClaw 外掛嗎？請先閱讀[入門指南](/zh-TW/plugins/building-plugins)，
  了解套件結構與資訊清單設定。
</Info>

## 你的外掛負責的部分

頻道外掛不會實作傳送／編輯／回應工具；核心會提供一個
共用的 `message` 工具。你的外掛負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - 私訊政策與允許清單
- **配對** - 私訊核准流程
- **工作階段文法** - 供應商特定的對話 ID 如何對應至基礎
  聊天、討論串 ID 與父層備援
- **對外傳送** - 將文字、媒體與投票傳送至平台
- **討論串** - 回覆如何組織成討論串
- **心跳偵測輸入狀態** - 用於心跳偵測傳遞目標的選用輸入中／忙碌訊號

核心負責共用訊息工具、提示詞連接、外層工作階段金鑰格式、
通用 `:thread:` 簿記，以及分派。

## 訊息轉接器

使用 `openclaw/plugin-sdk/channel-outbound` 的
`defineChannelMessageAdapter` 公開 `message` 轉接器。只宣告原生傳輸實際支援的持久最終傳送功能，
並以合約測試證明原生副作用與傳回的收據。文字／媒體傳送應指向舊版 `outbound` 轉接器使用的相同傳輸函式。
如需完整 API 合約、功能矩陣、收據規則、即時預覽最終處理、接收確認政策、測試與遷移表，
請參閱[頻道對外傳送 API](/zh-TW/plugins/sdk-channel-outbound)。

如果現有的 `outbound` 轉接器已具備正確的傳送方法與功能中繼資料，
請使用 `createChannelMessageAdapterFromOutbound(...)` 衍生 `message` 轉接器，
而不要手動編寫另一個橋接層。轉接器傳送會傳回 `MessageReceipt` 值。若要取得舊版 ID，
請使用 `listMessageReceiptPlatformIds(...)` 或
`resolveMessageReceiptPrimaryId(...)` 衍生，而不要保留平行的 `messageIds`
欄位。

請精確宣告即時與最終處理器功能——核心會據此決定頻道能執行的操作，而宣告內容與實際行為之間的偏差會導致
合約測試失敗：

| 介面                                  | 值                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

在原處完成草稿預覽最終處理的頻道，應透過
`defineFinalizableLivePreviewAdapter(...)` 搭配
`deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯，並以
`verifyChannelMessageLiveCapabilityAdapterProofs(...)`
和 `verifyChannelMessageLiveFinalizerProofs(...)` 測試為宣告的功能提供依據，
以避免原生預覽、進度、編輯、備援／保留、清理及收據行為在未被察覺的情況下發生偏差。

延後平台確認的輸入接收器應宣告
`message.receive.defaultAckPolicy` 與 `supportedAckPolicies`，而不是將
確認時機隱藏在監視器區域狀態中。請使用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 涵蓋每一項宣告的政策。

`createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply`
等舊版回覆輔助函式仍可供相容性分派器使用。請勿在新的
頻道程式碼中使用它們；請改從 `message` 轉接器、收據，以及
`openclaw/plugin-sdk/channel-outbound` 上的接收／傳送生命週期輔助函式開始。

### 輸入入口（實驗性）

正在遷移輸入授權的頻道，可以從執行階段接收路徑使用實驗性的
`openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。它接受平台事實、原始允許清單、路由描述元、命令事實與存取群組設定，
然後傳回傳送者／路由／命令／啟用投影，以及有序的輸入圖，
同時讓平台查詢與副作用保留在外掛中。請在傳給解析器的描述元內保留外掛身分正規化；
請勿序列化已解析狀態或決策中的原始比對值。請參閱
[頻道輸入 API](/zh-TW/plugins/sdk-channel-ingress)，了解 API 設計、
責任邊界與測試預期。較舊的
`openclaw/plugin-sdk/channel-ingress` 子路徑仍會匯出，作為供第三方外掛使用的已淘汰
相容性介面。

### 輸入狀態指示器

如果你的頻道支援輸入回覆之外的輸入狀態指示器，請在頻道外掛上公開
`heartbeat.sendTyping(...)`。核心會在心跳偵測模型執行開始前，
以解析後的心跳偵測傳遞目標呼叫它，並使用共用的輸入狀態維持／清理生命週期。
當平台需要明確的停止訊號時，請新增
`heartbeat.clearTyping(...)`。

### 媒體來源參數

如果你的頻道新增了攜帶媒體來源的訊息工具參數，請透過
`plugin.actions.describeMessageTool(...).mediaSourceParams` 公開這些參數名稱。
核心會使用這份明確清單進行沙箱路徑正規化與對外媒體存取政策處理，
因此外掛不需要在共用核心中為供應商特定的頭像、附件或封面圖片參數加入特殊情況。

請優先使用依動作索引的對應，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，
這樣不相關的動作就不會繼承另一個動作的媒體引數。對於有意在每個公開動作間共用的參數，
仍可使用平面陣列。

必須公開暫時性公用 URL 以供平台端擷取媒體的頻道，可以搭配外掛狀態儲存區，
使用 `openclaw/plugin-sdk/outbound-media` 的
`createHostedOutboundMediaStore(...)`。請將平台路由剖析與權杖強制執行保留在頻道外掛中；
共用輔助函式只負責媒體載入、到期中繼資料、分塊資料列與清理。

### 原生承載資料塑形

如果你的頻道需要針對 `message(action="send")` 進行供應商特定的塑形，
請優先使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入內容或其他持久資料放在
`payload.channelData.<channel>` 下，並讓核心透過對外傳送／訊息轉接器進行傳送。
只有在承載資料無法序列化並重試時，才將 `actions.handleAction(...)` 用作傳送的相容性備援。

### 工作階段對話文法

如果你的平台在對話 ID 中儲存額外範圍，請使用
`messaging.resolveSessionConversation(...)` 將該剖析保留在外掛中。這是將 `rawId`
對應至基礎對話 ID、選用討論串 ID、明確的 `baseConversationId`
以及任何 `parentConversationCandidates` 的標準掛鉤。傳回 `parentConversationCandidates` 時，
請按照從最窄父層到最廣／基礎對話的順序排列。

`messaging.resolveParentConversationCandidates(...)` 是已淘汰的
相容性備援，適用於只需在通用／原始 ID 上新增父層備援的外掛。如果兩個掛鉤都存在，核心會先使用
`resolveSessionConversation(...).parentConversationCandidates`，只有在標準掛鉤省略它們時，
才會回退至 `resolveParentConversationCandidates(...)`。

如果內建外掛需要在頻道登錄啟動前進行相同剖析，可以公開頂層
`session-key-api.ts` 檔案，並包含相符的
`resolveSessionConversation(...)` 匯出（請參閱 Feishu 與 Telegram
外掛）。只有在執行階段外掛登錄尚不可用時，核心才會使用這個可安全啟動的介面。

當外掛程式碼需要正規化類路由欄位、比較子討論串與其父層路由，或從
`{ channel, to, accountId, threadId }` 建立穩定的去重金鑰時，請使用
`openclaw/plugin-sdk/channel-route`。此輔助函式會以與核心相同的方式正規化數字討論串 ID，
因此應優先使用它，而非臨時的 `String(threadId)` 比較。具有供應商特定目標文法的外掛
應公開 `messaging.resolveOutboundSessionRoute(...)`，讓核心能在不使用剖析器相容層的情況下，
取得供應商原生的工作階段與討論串身分。

### 帳號範圍的對話繫結支援

當頻道支援通用的目前對話繫結時，請設定
`conversationBindings.supportsCurrentConversationBinding`。`createChatChannelPlugin(...)`
預設會將此靜態功能設為 `true`。

如果支援情況因已設定的帳號而異，也請實作
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`。
只有在靜態功能已啟用後，核心才會評估這個同步掛鉤。傳回 `false` 會使該帳號無法使用通用的目前對話功能、
繫結、查詢、列出、更新存取時間與解除繫結操作。
省略此掛鉤時，靜態功能會套用至每個帳號。

請從已載入的帳號設定或執行階段狀態解析答案。此掛鉤僅管控通用的目前對話繫結；
它不會取代已設定的繫結規則或外掛擁有的工作階段路由。合約測試應透過
`openclaw/plugin-sdk/channel-core` 匯出的
`ChannelPlugin["conversationBindings"]` 合約，至少涵蓋一個受支援帳號與一個不受支援帳號。

## 核准與頻道功能

大多數頻道外掛不需要核准專用程式碼。核心負責同一聊天中的
`/approve`、共用核准按鈕承載資料與通用備援傳遞。
`ChannelPlugin.approvals` 已移除；請改為將核准傳遞／原生／呈現／驗證事實放在單一
`approvalCapability` 物件上。`plugin.auth` 僅用於登入／登出——核心不再從該物件讀取核准驗證掛鉤。

只有原生核准路由或抑制備援時才使用 `approvalCapability.delivery`；
只有當頻道確實需要自訂核准承載資料而非共用呈現器時，才使用 `approvalCapability.render`。

### 核准驗證

- `approvalCapability.authorizeActorAction` 與
  `approvalCapability.getActionAvailabilityState` 是標準的
  核准驗證接合面。
- 使用 `getActionAvailabilityState` 判斷同一聊天中的核准驗證可用性。
  即使原生傳遞已停用，也要讓已設定的核准者能使用 `/approve`；請改用原生發起介面狀態提供傳遞／設定指引。
- 如果你的頻道公開原生執行核准，當發起介面／原生用戶端狀態與同一聊天中的
  核准驗證不同時，請使用
  `approvalCapability.getExecInitiatingSurfaceState`。核心會使用這個執行專用掛鉤區分 `enabled` 與
  `disabled`、決定發起頻道是否支援原生執行核准，
  並將該頻道納入原生用戶端備援指引。
  `createApproverRestrictedNativeApprovalCapability(...)` 會處理這個常見情況。
- 如果頻道能從現有設定推斷出穩定、類似擁有者的私訊身分，
  請使用 `openclaw/plugin-sdk/approval-runtime` 的
  `createResolvedApproverActionAuthAdapter` 限制同一聊天中的 `/approve`，
  而不需新增核准專用的核心邏輯。
- 如果自訂核准驗證有意只允許同一聊天備援，請從
  `openclaw/plugin-sdk/approval-auth-runtime` 傳回
  `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否則核心會將結果視為明確的核准者授權。
- 如果頻道擁有的原生回呼會直接解析核准，請在解析前使用
  `isImplicitSameChatApprovalAuthorization(...)`，確保隱含備援仍會經過頻道的一般動作者授權。

### 承載資料生命週期與設定指引

- 針對特定頻道的承載資料生命週期行為，請使用 `outbound.shouldSuppressLocalPayloadPrompt` 或
  `outbound.beforeDeliverPayload`，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入中指示。
- 當頻道希望在停用路徑的回覆中說明啟用原生執行核准所需的確切設定項目時，請使用
  `approvalCapability.describeExecApprovalSetup`。此鉤子會接收 `{ channel, channelLabel, accountId }`；
  使用具名帳號的頻道應呈現帳號範圍的路徑，例如
  `channels.<channel>.accounts.<id>.execApprovals.*`，而非頂層預設值。
- 當外掛核准失敗指引可安全地顯示於外掛核准無路由與逾時失敗時，請使用
  `approvalCapability.describePluginApprovalSetup`。
  `createApproverRestrictedNativeApprovalCapability(...)` 不會從
  `describeExecApprovalSetup` 推斷此設定；只有當外掛核准與執行核准確實使用相同的原生設定時，
  才明確傳入相同的輔助函式。

### 原生核准傳遞

如果頻道需要原生核准傳遞，請讓頻道程式碼專注於目標正規化以及傳輸／呈現相關資訊。請使用
`openclaw/plugin-sdk/approval-runtime` 中的
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver` 和
`createApproverRestrictedNativeApprovalCapability`。將頻道特定資訊放在
`approvalCapability.nativeRuntime` 後方，理想情況下透過
`createChannelApprovalNativeRuntimeAdapter(...)` 或
`createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心能組裝處理常式，並負責請求篩選、路由、
去重、到期、閘道訂閱，以及已路由至其他位置的通知。

`nativeRuntime` 分為幾個較小的接合面：

- `availability` - 帳號是否已設定，以及是否應處理某個請求
- `presentation` - 將共用核准檢視模型對應為待處理／已解決／已到期的原生承載資料或最終動作
- `transport` - 準備目標，以及傳送／更新／刪除原生核准訊息
- `interactions` - 原生按鈕或回應符號的選用綁定／解除綁定／清除動作鉤子，以及選用的
  `cancelDelivered` 鉤子。當 `deliverPending` 註冊程序內或持久化狀態（例如回應符號目標儲存區）時，
  請實作 `cancelDelivered`，以便在 `bindPending` 執行前，若處理常式停止而取消傳遞，或
  `bindPending` 未傳回控制代碼時，釋放該狀態
- `observe` - 選用的傳遞診斷鉤子

其他核准輔助函式：

- 當頻道同時支援工作階段來源的原生傳遞與明確的核准轉送目標時，請使用
  `openclaw/plugin-sdk/approval-native-runtime` 中的
  `createNativeApprovalChannelRouteGates`。此輔助函式會集中處理核准設定選擇、`mode` 處理、
  代理程式／工作階段篩選、帳號綁定、工作階段目標比對，以及目標清單比對；呼叫端仍負責頻道 ID、
  預設轉送模式、帳號查詢、傳輸啟用檢查、目標正規化，以及回合來源目標解析。請勿使用它建立由核心
  擁有的頻道政策預設值；請明確傳入該頻道文件所述的預設模式。
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用共用頻道路由
  比對器。只有當頻道具有供應商特定的等價規則（例如 Slack 時間戳記前綴比對）時，才傳入
  `targetsMatch`。當頻道需要在預設路由比對器或自訂 `targetsMatch` 回呼執行前，將供應商 ID
  標準化，同時保留原始傳遞目標時，請傳入 `normalizeTargetForMatch`。只有在解析出的傳遞目標本身
  應標準化時，才使用 `normalizeTarget`。
- 如果頻道需要由執行階段擁有的物件，例如用戶端、權杖、Bolt 應用程式或網路鉤子接收器，請透過
  `openclaw/plugin-sdk/channel-runtime-context` 註冊。通用執行階段情境登錄區可讓核心從頻道啟動狀態
  啟動由能力驅動的處理常式，而無須新增核准專用的包裝黏合程式碼。
- 只有當能力驅動的接合面仍不足以表達需求時，才使用較低階的 `createChannelApprovalHandler` 或
  `createChannelNativeApprovalRuntime`。
- 原生核准頻道必須透過這些輔助函式同時路由 `accountId` 與 `approvalKind`。`accountId` 可將多帳號核准
  政策限制在正確的機器人帳號範圍內，而 `approvalKind` 則讓頻道仍能取得執行核准與外掛核准的行為，
  無須在核心中加入硬編碼分支。
- 核准重新路由通知也由核心負責。頻道外掛不應從 `createChannelNativeApprovalRuntime` 傳送自己的
  「核准已移至私訊／另一個頻道」後續訊息；請改為透過共用核准能力輔助函式公開準確的來源與核准者
  私訊路由，並讓核心彙整實際傳遞結果後，再向發起聊天張貼任何通知。
- 請端對端保留已傳遞核准 ID 的種類。原生用戶端不應根據頻道本機狀態猜測或改寫執行核准與外掛核准
  的路由。
- 將該明確的 `approvalKind` 傳給 `resolveApprovalOverGateway`。這會使用標準的 `approval.resolve`
  服務，並在另一個介面先回應時傳回已記錄的勝出者。較舊的明確 `resolveMethod` 輸入仍保留給命令式
  控制項；新的原生動作不得使用它，也不得從 ID 推斷種類。
- 不同的核准種類可以刻意公開不同的原生介面。目前的內建範例：Matrix 對執行核准與外掛核准維持相同的
  原生私訊／頻道路由和回應符號使用者體驗，同時仍允許依核准種類採用不同的驗證方式；Slack 則讓執行
  核准與外掛核准 ID 都可使用原生核准路由。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為相容性包裝器存在，但新程式碼應優先使用能力
  建構器，並在外掛上公開 `approvalCapability`。

### 範圍更窄的核准執行階段子路徑

對於熱門頻道進入點，若你只需要此系列中的一部分，請優先使用以下較窄的子路徑，而非較廣泛的
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

同樣地，若你不需要全部功能，請優先使用 `openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`，而非較廣泛的傘狀介面。

### 設定子路徑

- `openclaw/plugin-sdk/setup-runtime` 涵蓋可安全用於執行階段的設定輔助函式：
  `createSetupTranslator`、可安全匯入的設定修補配接器
  （`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查詢註記輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派式設定代理建構器。
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝設定建構器，以及一些可安全用於設定的基礎項目：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、
  `createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled` 和 `splitSetupEntries`。
- 只有當你也需要較繁重的共用設定／組態輔助函式，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用較廣泛的
  `openclaw/plugin-sdk/setup` 接合面。

如果你的頻道只想在設定介面中提示「請先安裝此外掛」，請優先使用
`createOptionalChannelSetupSurface(...)`。產生的配接器／精靈對設定寫入與完成操作採取失敗關閉，
並在驗證、完成及文件連結文案中重複使用相同的必須安裝訊息。

如果你的頻道支援環境變數驅動的設定或驗證，且通用啟動／設定流程應在執行階段載入前得知這些環境變數
名稱，請在外掛資訊清單中使用 `channelEnvVars` 宣告。頻道執行階段的 `envVars` 或本機常數只保留給
面向操作人員的文案使用。

如果你的頻道能在外掛執行階段啟動前出現在 `status`、`channels list`、`channels status` 或
SecretRef 掃描中，請在 `package.json` 加入 `openclaw.setupEntry`。該進入點應能安全地匯入唯讀命令
路徑，並應傳回這些摘要所需的頻道中繼資料、可安全用於設定的組態配接器、狀態配接器，以及頻道密鑰
目標中繼資料。請勿從設定進入點啟動用戶端、監聽器或傳輸執行階段。

主要頻道進入點的匯入路徑也應保持精簡。探索流程可以評估進入點與頻道外掛模組以註冊能力，而無須啟用
頻道。`channel-plugin-api.ts` 等檔案應匯出頻道外掛物件，但不要匯入設定精靈、傳輸用戶端、
通訊端監聽器、子程序啟動器或服務啟動模組。請將這些執行階段元件放入由 `registerFull(...)`、
執行階段設定函式或延遲能力配接器載入的模組中。

### 其他範圍更窄的頻道子路徑

對於其他熱門頻道路徑，請優先使用較窄的輔助函式，而非較廣泛的舊版介面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用於多帳號組態與預設帳號後援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用於輸入路由／封套與記錄後分派的串接
- `openclaw/plugin-sdk/channel-targets`，用於目標剖析輔助函式
- `openclaw/plugin-sdk/outbound-media`，用於媒體載入；以及
  `openclaw/plugin-sdk/channel-outbound`，用於輸出身分／傳送委派與承載資料規劃
- 當輸出路由應保留明確的 `replyToId`／`threadId`，或在基礎工作階段索引鍵仍相符時復原目前的
  `:thread:` 工作階段，請使用 `openclaw/plugin-sdk/channel-core` 中的
  `buildThreadAwareOutboundSessionRoute(...)`。當供應商外掛的平台具有原生討論串傳遞語意時，
  可覆寫優先順序、後綴行為及討論串 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於討論串綁定生命週期與配接器註冊
- 只有在仍需要舊版代理程式／媒體承載資料欄位配置時，才使用
  `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`（已棄用：沒有內建外掛在正式環境使用它），用於
  Telegram 自訂命令正規化、重複／衝突驗證，以及具穩定後援行為的命令組態合約；新的外掛程式碼
  應優先在外掛本機處理命令組態

僅驗證的頻道通常可以停留在預設路徑：核心處理核准，而外掛只公開輸出／驗證能力。Matrix、Slack、
Telegram 等原生核准頻道及自訂聊天傳輸，應使用共用原生輔助函式，而非自行建構核准生命週期。

## 輸入提及政策

將輸入提及處理分為兩層：

- 由外掛負責的證據蒐集
- 共用政策評估

提及政策決策請使用 `openclaw/plugin-sdk/channel-mention-gating`。只有當你需要較廣泛的輸入輔助函式
匯出介面時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合外掛本機邏輯的項目：

- 偵測是否回覆機器人
- 偵測是否引用機器人
- 討論串參與檢查
- 排除服務／系統訊息
- 證明機器人參與所需的平台原生快取

適合共用輔助函式的項目：

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

`matchesMentionWithExplicit(...)` 會傳回布林值。`hasAnyMention`、
`isExplicitlyMentioned` 和 `canResolveExplicit` 來自頻道本身的
原生提及中繼資料（訊息實體、回覆機器人旗標及類似資料）；
當你的平台無法偵測這些資料時，請提供 `false`／`undefined` 值。

`api.runtime.channel.mentions` 會為已依賴執行階段注入的
內建頻道外掛公開相同的共用提及輔助函式：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

如果你只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，
請從 `openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入
不相關的傳入執行階段輔助函式。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="套件與資訊清單">
    建立標準外掛檔案。`openclaw.plugin.json` 中的 `channels` 欄位
    （而非 `kind` 欄位）會將資訊清單標記為擁有某個頻道。如需完整的
    套件中繼資料介面，請參閱
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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將它用於
    不屬於頻道帳號組態的外掛自有設定。
    `channelConfigs.acme-chat.schema` 會驗證 `channels.acme-chat`，並且是在
    外掛執行階段載入前，組態結構描述、設定流程及 UI 介面所使用的
    冷路徑來源。如需完整的頂層欄位參考，請參閱
    [外掛資訊清單](/zh-TW/plugins/manifest)。

  </Step>

  <Step title="建置頻道外掛物件">
    `ChannelPlugin` 介面有許多選用的配接器介面。先從最低需求
    `id`、`config` 和 `setup` 開始，再依需求新增配接器。

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
      if (!token) throw new Error("acme-chat: 必須提供權杖");
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

      // 私訊安全性：誰可以傳送訊息給機器人
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
            await acmeChatApi.sendDm(target, `配對代碼：${code}`);
          },
        },
      },

      // 執行緒：如何傳遞回覆
      threading: { topLevelReplyToMode: "reply" },

      // 傳出：將訊息傳送至平台
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

    對於同時接受標準頂層私訊索引鍵與舊版巢狀索引鍵的頻道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助函式：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳號本機值優先於繼承的根層級值。請透過 `normalizeLegacyDmAliases` 將相同的解析器與 doctor 修復配對，讓執行階段和遷移讀取相同的契約。

    <Accordion title="createChatChannelPlugin 可為你完成哪些工作">
      你不必手動實作低階配接器介面，而是傳入
      宣告式選項，由建構器組合這些選項：

      | 選項 | 連接的內容 |
      | --- | --- |
      | `security.dm` | 從組態欄位取得具範圍限制的私訊安全性解析器 |
      | `pairing.text` | 透過代碼交換進行的文字式私訊配對流程 |
      | `threading` | 回覆目標模式解析器（固定、帳號範圍或自訂） |
      | `outbound.attachedResults` | 傳回結果中繼資料（訊息 ID）的傳送函式；需要同層的 `channel` ID，讓核心可以在傳回的傳遞結果上標記頻道 |

      如果需要完整控制，你也可以傳入原始配接器物件，
      而不使用宣告式選項。

      原始傳出配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳遞時的格式決策，
      例如 `maxLinesPerMessage`；請在傳送前套用，讓回覆執行緒
      和分塊邊界僅由共用傳出傳遞機制解析一次。
      解析出原生回覆目標時，傳送情境也會包含 `replyToIdSource`
      （`implicit` 或 `explicit`），讓承載資料輔助函式可以保留
      明確回覆標籤，而不耗用隱含的單次回覆欄位。
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

    將頻道自有的命令列介面描述項放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    無須啟用完整頻道執行階段，即可在根層級說明中顯示這些描述項；
    一般的完整載入仍會取得相同的描述項，以進行實際的命令註冊。
    將 `registerFull(...)` 保留給僅限執行階段的工作。
    `defineChannelPluginEntry` 會自動處理註冊模式的拆分。
    如果 `registerFull(...)` 註冊了閘道 RPC 方法，請使用
    外掛專用前置詞。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，且一律
    解析為 `operator.admin`。如需所有選項，請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，以便在新手引導期間輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道停用或尚未設定時，OpenClaw 會載入此進入點，而不是完整進入點。
    這可避免在設定流程期間載入沉重的執行階段程式碼。
    詳情請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出項目拆分至側載模組的內建工作區頻道，
    若還需要明確的設定階段執行階段 setter，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理傳入訊息">
    你的外掛需要接收來自平台的訊息，並將其轉送至
    OpenClaw。典型模式是使用網路鉤子驗證請求，然後
    透過頻道的傳入處理常式分派訊息：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 由外掛管理驗證（請自行驗證簽章）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的輸入處理常式會將訊息分派給 OpenClaw。
          // 確切的接線方式取決於你的平台 SDK -
          // 請參考內建 Microsoft Teams 或 Google Chat 外掛套件中的實際範例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      輸入訊息處理因頻道而異。每個頻道外掛都擁有
      自己的輸入管線。請參考內建頻道外掛
      （例如 Microsoft Teams 或 Google Chat 外掛套件）中的實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="測試">
在 `src/channel.test.ts` 中撰寫同位置測試：

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

      it("在不具現化祕密的情況下檢查帳號", () => {
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

    如需共用測試輔助工具，請參閱[測試](/zh-TW/plugins/sdk-testing)。

</Step>
</Steps>

## 檔案結構

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 中繼資料
├── openclaw.plugin.json      # 包含設定結構描述的資訊清單
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
  <Card title="頻道輸入 API" icon="bolt" href="/zh-TW/plugins/sdk-channel-inbound">
    共用輸入事件生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
針對內建外掛的維護與相容性，目前仍保留部分內建輔助介面。
不建議新頻道外掛使用這些模式；
除非你直接維護該內建外掛系列，否則請優先使用通用 SDK
介面中的一般頻道、設定、回覆及執行階段子路徑。
</Note>

## 後續步驟

- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 如果你的外掛也提供模型
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試公用程式與合約測試
- [外掛資訊清單](/zh-TW/plugins/manifest) - 完整的資訊清單結構描述

## 相關內容

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [代理程式測試框架外掛](/zh-TW/plugins/sdk-agent-harness)
