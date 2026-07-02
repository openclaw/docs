---
read_when:
    - 你正在建置新的訊息通道外掛
    - 你想要將 OpenClaw 連接到訊息平台
    - 你需要了解 ChannelPlugin 配接器介面
sidebarTitle: Channel Plugins
summary: 逐步指南：為 OpenClaw 建立訊息通道外掛
title: 建置通道外掛
x-i18n:
    generated_at: "2026-07-02T22:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會逐步說明如何建置一個將 OpenClaw 連接到訊息平台的頻道外掛。完成後，你將擁有一個可運作的頻道，具備私訊安全性、配對、回覆討論串，以及對外傳送訊息功能。

<Info>
  如果你還沒有建置過任何 OpenClaw 外掛，請先閱讀
  [入門](/zh-TW/plugins/building-plugins)，了解基本套件結構與 manifest 設定。
</Info>

## 頻道外掛的運作方式

頻道外掛不需要自己的傳送、編輯或回應工具。OpenClaw 會在核心中保留一個共用的 `message` 工具。你的外掛負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - 私訊政策與允許清單
- **配對** - 私訊核准流程
- **工作階段語法** - 供應商專屬對話 ID 如何對應到基礎聊天、討論串 ID，以及父層備援
- **對外傳送** - 將文字、媒體與投票傳送到平台
- **討論串** - 回覆如何串接成討論串
- **心跳偵測輸入狀態** - 用於心跳偵測遞送目標的選用輸入中／忙碌訊號

核心負責共用訊息工具、提示詞接線、外層工作階段鍵形狀、通用 `:thread:` 簿記，以及分派。

新的頻道外掛也應該使用 `openclaw/plugin-sdk/channel-outbound` 中的 `defineChannelMessageAdapter` 暴露 `message` 配接器。此配接器宣告原生傳輸實際支援哪些持久最終傳送能力，並將文字／媒體傳送指向與舊版 `outbound` 配接器相同的傳輸函式。只有在契約測試證明原生端副作用與回傳回條時，才宣告該能力。
完整的 API 契約、範例、能力矩陣、回條規則、即時預覽完成處理、接收確認政策、測試與遷移表，請參閱
[頻道對外傳送 API](/zh-TW/plugins/sdk-channel-outbound)。
如果現有 `outbound` 配接器已具備正確的傳送方法與能力中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)` 衍生 `message` 配接器，而不是手寫另一個橋接層。
配接器傳送應回傳 `MessageReceipt` 值。當相容性程式碼仍需要舊版 ID 時，請使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 衍生它們，而不是在新的生命週期程式碼中保留平行的 `messageIds` 欄位。
具備預覽能力的頻道也應以其擁有的確切即時生命週期宣告 `message.live.capabilities`，例如 `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming` 或 `quietFinalization`。會就地完成草稿預覽的頻道，也應宣告 `message.live.finalizer.capabilities`，例如 `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt` 和 `retainOnAmbiguousFailure`，並透過 `defineFinalizableLivePreviewAdapter(...)` 加上 `deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯。請讓這些能力由 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和 `verifyChannelMessageLiveFinalizerProofs(...)` 測試支撐，確保原生預覽、進度、編輯、備援／保留、清理與回條行為不會靜默漂移。
會延後平台確認的入站接收器，應宣告 `message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把確認時機藏在監視器本機狀態中。請用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆蓋每個宣告的政策。

舊版回覆輔助工具，例如 `createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply`，仍可供相容性分派器使用。不要在新的頻道程式碼中使用這些名稱；新的外掛應從 `message` 配接器、回條，以及 `openclaw/plugin-sdk/channel-outbound` 上的接收／傳送生命週期輔助工具開始。

正在遷移入站授權的頻道，可以在執行階段接收路徑中使用實驗性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。此子路徑會把平台查找與副作用保留在外掛中，同時共用允許清單狀態解析、路由／傳送者／命令／事件／啟用決策、已遮蔽診斷，以及回合准入對應。請在傳給解析器的描述子中保留外掛身分正規化；不要序列化已解析狀態或決策中的原始比對值。API 設計、所有權邊界與測試期望，請參閱
[頻道入站 API](/zh-TW/plugins/sdk-channel-ingress)。

如果你的頻道支援入站回覆以外的輸入中指示，請在頻道外掛上暴露 `heartbeat.sendTyping(...)`。核心會在心跳偵測模型執行開始前，以已解析的心跳偵測遞送目標呼叫它，並使用共用的輸入狀態 keepalive／清理生命週期。當平台需要明確停止訊號時，請新增 `heartbeat.clearTyping(...)`。

如果你的頻道新增帶有媒體來源的訊息工具參數，請透過 `describeMessageTool(...).mediaSourceParams` 暴露這些參數名稱。核心會使用該明確清單進行沙盒路徑正規化與對外媒體存取政策，因此外掛不需要為供應商專屬的頭像、附件或封面圖片參數加入共用核心特例。
建議回傳以動作為鍵的對應，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，如此不相關的動作就不會繼承另一個動作的媒體引數。對於有意在每個暴露動作之間共用的參數，平面陣列仍然可用。
必須為平台端媒體擷取暴露暫時公開 URL 的頻道，可以搭配外掛狀態儲存使用 `openclaw/plugin-sdk/outbound-media` 中的 `createHostedOutboundMediaStore(...)`。請將平台路由解析與權杖強制執行保留在頻道外掛中；共用輔助工具只負責媒體載入、到期中繼資料、區塊資料列與清理。

如果你的頻道需要針對 `message(action="send")` 進行供應商專屬塑形，請優先使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入或其他持久資料放在 `payload.channelData.<channel>` 底下，並讓核心透過對外傳送／訊息配接器執行實際傳送。只有在酬載無法序列化並重試時，才將 `actions.handleAction(...)` 作為傳送的相容性備援。

如果你的平台在對話 ID 內儲存額外範圍，請在外掛中使用 `messaging.resolveSessionConversation(...)` 保留該解析。這是將 `rawId` 對應到基礎對話 ID、選用討論串 ID、明確 `baseConversationId`，以及任何 `parentConversationCandidates` 的標準鉤子。
當你回傳 `parentConversationCandidates` 時，請將它們從最窄的父層到最寬／基礎對話排序。

當外掛程式碼需要正規化類似路由的欄位、比較子討論串與其父層路由，或從 `{ channel, to, accountId, threadId }` 建立穩定的去重鍵時，請使用 `openclaw/plugin-sdk/channel-route`。此輔助工具會以與核心相同的方式正規化數字討論串 ID，因此外掛應優先使用它，而不是臨時的 `String(threadId)` 比較。
具有供應商專屬目標語法的外掛應暴露 `messaging.resolveOutboundSessionRoute(...)`，讓核心取得供應商原生的工作階段與討論串身分，而不需使用解析器相容層。

需要在頻道登錄啟動前進行相同解析的內建外掛，也可以暴露頂層 `session-key-api.ts` 檔案，並提供相符的 `resolveSessionConversation(...)` 匯出。只有在執行階段外掛登錄尚不可用時，核心才會使用這個可安全啟動的介面。

當外掛只需要在通用／原始 ID 之上提供父層備援時，`messaging.resolveParentConversationCandidates(...)` 仍可作為舊版相容性備援使用。如果兩個鉤子都存在，核心會先使用 `resolveSessionConversation(...).parentConversationCandidates`，且只有在標準鉤子省略它們時，才退回 `resolveParentConversationCandidates(...)`。

## 核准與頻道能力

大多數頻道外掛不需要核准專屬程式碼。

- 核心擁有同一聊天的 `/approve`、共用核准按鈕 payload，以及通用後援遞送。
- 當通道外掛需要核准專用行為時，優先在通道外掛上使用單一 `approvalCapability` 物件。
- `ChannelPlugin.approvals` 已移除。請將核准遞送、原生、轉譯、驗證事實放在 `approvalCapability` 上。
- `plugin.auth` 僅用於登入/登出；核心不再從該物件讀取核准驗證 hook。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是標準的核准驗證介面。
- 使用 `approvalCapability.getActionAvailabilityState` 取得同一聊天核准驗證可用性。即使原生遞送已停用，也讓已設定的核准者可使用 `/approve`；請改用原生發起介面狀態提供遞送/設定指引。
- 如果你的通道公開原生 exec 核准，當發起介面/原生用戶端狀態不同於同一聊天核准驗證時，請使用 `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該 exec 專用 hook 來區分 `enabled` 與 `disabled`、判斷發起通道是否支援原生 exec 核准，並在原生用戶端後援指引中納入該通道。`createApproverRestrictedNativeApprovalCapability(...)` 會為常見情境填入此項。
- 對於通道專用的 payload 生命週期行為，例如隱藏重複的本機核准提示，或在遞送前傳送輸入中指示器，請使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- `approvalCapability.delivery` 僅用於原生核准路由或後援抑制。
- 使用 `approvalCapability.nativeRuntime` 放置通道擁有的原生核准事實。在熱門通道進入點上，請透過 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持延遲載入；它可以按需匯入你的 runtime 模組，同時仍讓核心組裝核准生命週期。
- 只有在通道確實需要自訂核准 payload，而非共用 renderer 時，才使用 `approvalCapability.render`。
- 當通道想讓停用途徑回覆說明啟用原生 exec 核准所需的確切設定旋鈕時，請使用 `approvalCapability.describeExecApprovalSetup`。該 hook 會收到 `{ channel, channelLabel, accountId }`；具名帳號通道應轉譯帳號範圍路徑，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而非頂層預設值。
- 當外掛核准失敗指引可安全顯示於外掛核准無路由和逾時失敗時，請使用 `approvalCapability.describePluginApprovalSetup`。`createApproverRestrictedNativeApprovalCapability(...)` 不會從 `describeExecApprovalSetup` 推斷此項；只有在外掛和 exec 核准確實使用相同原生設定時，才明確傳入同一個 helper。
- 如果通道可以從既有設定推斷穩定、類 owner 的 DM 身分，請使用 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter`，以在不新增核准專用核心邏輯的情況下限制同一聊天 `/approve`。
- 如果自訂核准驗證刻意只允許同一聊天後援，請從 `openclaw/plugin-sdk/approval-auth-runtime` 回傳 `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否則核心會將結果視為明確的核准者授權。
- 如果通道擁有的原生 callback 會直接解析核准，請在解析前使用 `isImplicitSameChatApprovalAuthorization(...)`，讓隱含後援仍會經過通道的一般 actor 授權。
- 如果通道需要原生核准遞送，請讓通道程式碼聚焦於目標正規化以及傳輸/呈現事實。使用 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。請將通道專用事實放在 `approvalCapability.nativeRuntime` 後方，理想上透過 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心能組裝 handler，並擁有請求篩選、路由、去重、到期、閘道訂閱，以及已路由至其他位置通知。`nativeRuntime` 拆成幾個較小的介面：
- 當通道同時支援 session-origin 原生遞送和明確核准轉送目標時，請使用 `openclaw/plugin-sdk/approval-native-runtime` 的 `createNativeApprovalChannelRouteGates`。該 helper 會集中處理核准設定選擇、`mode` 處理、agent/session 篩選、帳號繫結、session-target 比對，以及目標清單比對；呼叫端仍擁有通道 id、預設轉送模式、帳號查詢、傳輸啟用檢查、目標正規化，以及 turn-source 目標解析。不要用它建立核心擁有的通道政策預設；請明確傳入通道文件化的預設模式。
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用共用通道路由 matcher。只有當通道具有供應商專用等價規則時，才傳入 `targetsMatch`，例如 Slack timestamp 前綴比對。
- 當通道需要在預設 route matcher 或自訂 `targetsMatch` callback 執行前，先對供應商 id 進行標準化，同時保留原始目標以供遞送時，請將 `normalizeTargetForMatch` 傳給 `createChannelNativeOriginTargetResolver`。只有當解析出的遞送目標本身也應標準化時，才使用 `normalizeTarget`。
- `availability` - 帳號是否已設定，以及請求是否應被處理
- `presentation` - 將共用核准 view model 對應為待處理/已解析/已過期的原生 payload 或最終動作
- `transport` - 準備目標並傳送/更新/刪除原生核准訊息
- `interactions` - 原生按鈕或 reactions 的選用繫結/解除繫結/清除動作 hook，以及選用的 `cancelDelivered` hook。當 `deliverPending` 註冊處理序內或持久狀態（例如 reaction 目標儲存）時，請實作 `cancelDelivered`，如此當 handler 停止在 `bindPending` 執行前取消遞送，或 `bindPending` 未回傳 handle 時，該狀態便可釋放
- `observe` - 選用遞送診斷 hook
- 如果通道需要 runtime 擁有的物件，例如 client、token、Bolt app 或網路鉤子接收器，請透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊。通用 runtime-context registry 讓核心可以從通道啟動狀態啟動能力驅動的 handler，而不必新增核准專用 wrapper 膠合程式碼。
- 只有當能力驅動介面尚不足以表達需求時，才使用較低階的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生核准通道必須透過這些 helper 路由 `accountId` 和 `approvalKind`。`accountId` 讓多帳號核准政策限定在正確的機器人帳號範圍內，而 `approvalKind` 讓 exec 與外掛核准行為可供通道使用，而不需要在核心中硬編碼分支。
- 核心現在也擁有核准重新路由通知。通道外掛不應從 `createChannelNativeApprovalRuntime` 傳送自己的「核准已前往 DM / 另一個通道」後續訊息；請改為透過共用核准能力 helper 公開準確的來源 + 核准者 DM 路由，並讓核心彙總實際遞送後，再將任何通知發回發起聊天。
- 請端到端保留已遞送核准 id kind。原生用戶端不應
  從通道本機狀態猜測或重寫 exec 與外掛核准路由。
- 不同核准 kind 可以刻意公開不同原生介面。
  目前的內建範例：
  - Slack 讓 exec 和外掛 id 都可使用原生核准路由。
  - Matrix 對 exec 和外掛核准保留相同的原生 DM/通道路由與 reaction UX，同時仍允許驗證依核准 kind 不同而有所差異。
- `createApproverRestrictedNativeApprovalAdapter` 仍以相容性 wrapper 形式存在，但新程式碼應優先使用能力 builder，並在外掛上公開 `approvalCapability`。

對於熱門通道進入點，當你只需要該系列的一部分時，優先使用較窄的 runtime 子路徑：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要更廣的傘狀介面時，優先使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`，以及
`openclaw/plugin-sdk/reply-chunking`。

特別針對設定：

- `openclaw/plugin-sdk/setup-runtime` 涵蓋 runtime-safe 設定 helper：
  `createSetupTranslator`、import-safe 設定 patch adapter（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  setup-proxy builder
- `openclaw/plugin-sdk/setup-runtime` 包含用於
  `createEnvPatchedAccountSetupAdapter` 的 env-aware adapter 介面
- `openclaw/plugin-sdk/channel-setup` 涵蓋 optional-install 設定
  builder，以及幾個 setup-safe primitive：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的通道支援 env 驅動的設定或驗證，且通用啟動/設定流程應在 runtime 載入前知道這些 env 名稱，請在外掛 manifest 中用 `channelEnvVars` 宣告。通道 runtime 的 `envVars` 或本機常數僅保留給面向操作員的文案。

如果你的通道可能在外掛 runtime 啟動前出現在 `status`、`channels list`、`channels status` 或 SecretRef 掃描中，請在 `package.json` 中新增 `openclaw.setupEntry`。該進入點應可在唯讀命令路徑中安全匯入，並應回傳這些摘要所需的通道中繼資料、setup-safe 設定 adapter、狀態 adapter，以及通道 secret 目標中繼資料。不要從 setup entry 啟動 client、listener 或 transport runtime。

也請保持主要通道進入匯入路徑狹窄。探索可以評估 entry 和通道外掛模組來註冊能力，而不啟用通道。像 `channel-plugin-api.ts` 這類檔案應匯出通道外掛物件，而不匯入 setup wizard、transport client、socket listener、subprocess launcher 或服務啟動模組。請將這些 runtime 部件放在由 `registerFull(...)`、runtime setter 或延遲能力 adapter 載入的模組中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`，以及
`splitSetupEntries`

- 只有當你也需要較重的共用設定/config helper，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用較廣的 `openclaw/plugin-sdk/setup` 介面

如果你的通道只想在設定介面宣傳「先安裝此外掛」，請優先使用 `createOptionalChannelSetupSurface(...)`。產生的 adapter/wizard 會在設定寫入與 finalization 上 fail closed，並在驗證、finalize 和 docs-link 文案中重用相同的需要安裝訊息。

對於其他熱門通道路徑，優先使用較窄的 helper，而不是較廣的舊版介面：

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用於多帳戶設定和
  預設帳戶備援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用於入站路由/信封和
  記錄並分派接線
- `openclaw/plugin-sdk/channel-targets`，用於目標解析輔助工具
- `openclaw/plugin-sdk/outbound-media`，用於媒體載入，以及
  `openclaw/plugin-sdk/channel-outbound`，用於出站身分/傳送委派
  和承載規劃
- 當出站路由應保留明確的 `replyToId`/`threadId`，或在基礎工作階段鍵仍相符後復原目前的 `:thread:` 工作階段時，使用
  來自 `openclaw/plugin-sdk/channel-core` 的
  `buildThreadAwareOutboundSessionRoute(...)`。提供者外掛可以在其平台具有原生執行緒傳遞語意時，覆寫優先順序、後綴行為和執行緒 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於執行緒繫結生命週期
  和配接器註冊
- `openclaw/plugin-sdk/agent-media-payload`，僅在仍需要舊版代理程式/媒體
  承載欄位配置時使用
- `openclaw/plugin-sdk/telegram-command-config`，用於 Telegram 自訂命令
  正規化、重複/衝突驗證，以及備援穩定的命令設定合約

僅驗證的通道通常可以停在預設路徑：核心會處理核准，而外掛只需公開出站/驗證能力。Matrix、Slack、Telegram 和自訂聊天傳輸等原生核准通道，應使用共用的原生輔助工具，而不是自行實作核准生命週期。

## 入站提及政策

將入站提及處理拆成兩層：

- 外掛擁有的證據收集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策判斷。
只有在需要更廣泛的入站輔助工具 barrel 時，才使用
`openclaw/plugin-sdk/channel-inbound`。

適合外掛本機邏輯的項目：

- 回覆機器人偵測
- 引用機器人偵測
- 執行緒參與檢查
- 服務/系統訊息排除
- 用於證明機器人參與的平台原生快取

適合共用輔助工具的項目：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令略過
- 最終略過判斷

建議流程：

1. 計算本機提及事實。
2. 將這些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在入站閘門中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

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

`api.runtime.channel.mentions` 會為已依賴執行階段注入的
內建通道外掛公開相同的共用提及輔助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，請從
`openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入無關的入站
執行階段輔助工具。

使用 `resolveInboundMentionDecision({ facts, policy })` 進行提及閘控。

## 逐步指南

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    建立標準外掛檔案。`package.json` 中的 `channel` 欄位
    會讓它成為通道外掛。如需完整的套件中繼資料介面，
    請參閱[外掛設定與設定](/zh-TW/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將它用於
    不屬於通道帳戶設定、且由外掛擁有的設定。`channelConfigs`
    會驗證 `channels.acme-chat`，並且是外掛執行階段載入前，設定
    結構描述、設定流程和 UI 介面所使用的冷路徑來源。

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` 介面有許多選用的配接器介面。先從最小集合開始：
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

    對於同時接受標準最上層 DM 鍵和舊版巢狀鍵的通道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助工具：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳戶本機值優先於繼承的根值。請將相同解析器搭配透過 `normalizeLegacyDmAliases` 進行的 doctor 修復使用，讓執行階段和遷移讀取相同合約。

    <Accordion title="What createChatChannelPlugin does for you">
      不必手動實作低階配接器介面，你可以傳入宣告式選項，
      由建構器組合它們：

      | 選項 | 接線內容 |
      | --- | --- |
      | `security.dm` | 來自設定欄位的範圍化 DM 安全解析器 |
      | `pairing.text` | 透過代碼交換進行的文字型 DM 配對流程 |
      | `threading` | 回覆模式解析器（固定、帳戶範圍或自訂） |
      | `outbound.attachedResults` | 會回傳結果中繼資料（訊息 ID）的傳送函式 |

      如果需要完整控制，你也可以傳入原始配接器物件，而不是宣告式選項。

      原始出站配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳遞時的格式化決策，
      例如 `maxLinesPerMessage`；請在傳送前套用它，讓回覆執行緒
      和分塊邊界由共用出站傳遞一次解析完成。
      當已解析原生回覆目標時，傳送內容也會包含 `replyToIdSource`
      （`implicit` 或 `explicit`），讓承載輔助工具可以保留
      明確回覆標記，而不消耗隱含的一次性回覆位置。
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    將通道擁有的命令列介面描述元放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    可以在根說明中顯示它們，而不啟用完整通道執行階段；
    一般完整載入仍會取得相同描述元，以進行真正的命令
    註冊。將 `registerFull(...)` 保留給僅限執行階段的工作。
    如果 `registerFull(...)` 註冊閘道 RPC 方法，請使用
    外掛專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，且一律
    解析為 `operator.admin`。
    `defineChannelPluginEntry` 會自動處理註冊模式拆分。請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry) 了解所有
    選項。

  </Step>

  <Step title="新增設定進入點">
    建立 `setup-entry.ts`，以便在入門設定期間進行輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當通道停用或尚未設定時，OpenClaw 會載入這個項目，而不是完整進入點。
    這可避免在設定流程期間拉入繁重的執行階段程式碼。
    詳情請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出拆分到附屬
    模組的內建工作區通道，在也需要
    明確的設定期間執行階段 setter 時，可以使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="處理傳入訊息">
    你的外掛需要從平台接收訊息，並將它們轉送給
    OpenClaw。典型模式是使用會驗證請求並
    透過通道傳入處理常式分派的網路鉤子：

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
      傳入訊息處理會因通道而異。每個通道外掛都擁有
      自己的傳入管線。請查看內建通道外掛
      （例如 Microsoft Teams 或 Google Chat 外掛套件）了解實際模式。
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
  <Card title="執行緒選項" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳號範圍，或自訂回覆模式
  </Card>
  <Card title="訊息工具整合" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="目標解析" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="執行階段輔助工具" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體、透過 api.runtime 使用子代理
  </Card>
  <Card title="通道傳入 API" icon="bolt" href="/zh-TW/plugins/sdk-channel-inbound">
    共用傳入事件生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分內建輔助接縫仍為了內建外掛維護與
相容性而存在。它們不是新通道外掛的建議模式；
除非你正直接維護該內建外掛家族，否則請優先使用通用 SDK
介面中的泛用通道、設定、回覆、執行階段子路徑。
</Note>

## 後續步驟

- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 如果你的外掛也提供模型
- [SDK 總覽](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試工具與合約測試
- [外掛資訊清單](/zh-TW/plugins/manifest) - 完整資訊清單架構

## 相關

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [代理器控制框架外掛](/zh-TW/plugins/sdk-agent-harness)
