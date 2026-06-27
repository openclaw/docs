---
read_when:
    - 你正在建置新的訊息通道外掛
    - 你想將 OpenClaw 連接到通訊平台
    - 你需要了解 ChannelPlugin 轉接器介面
sidebarTitle: Channel Plugins
summary: 建置 OpenClaw 訊息通道外掛的逐步指南
title: 建置通道外掛
x-i18n:
    generated_at: "2026-06-27T19:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南逐步說明如何建置一個將 OpenClaw 連接到
訊息平台的頻道外掛。完成後，你會擁有一個可運作的頻道，具備私訊安全性、
配對、回覆討論串，以及外送訊息功能。

<Info>
  如果你之前沒有建置過任何 OpenClaw 外掛，請先閱讀
  [入門](/zh-TW/plugins/building-plugins)，了解基本套件
  結構與 manifest 設定。
</Info>

## 頻道外掛如何運作

頻道外掛不需要自己的傳送/編輯/反應工具。OpenClaw 會在核心中保留一個
共用的 `message` 工具。你的外掛負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - 私訊政策與允許清單
- **配對** - 私訊核准流程
- **工作階段語法** - 供應商特定的對話 ID 如何對應到基礎聊天、討論串 ID 與父層後援
- **外送** - 將文字、媒體與投票傳送到平台
- **討論串** - 回覆如何串接
- **心跳偵測輸入狀態** - 心跳偵測傳遞目標的選用輸入中/忙碌訊號

核心負責共用訊息工具、提示詞接線、外層工作階段鍵形狀、
通用 `:thread:` 簿記，以及分派。

新的頻道外掛也應該使用 `openclaw/plugin-sdk/channel-outbound` 的
`defineChannelMessageAdapter` 暴露 `message` 配接器。
該配接器會宣告原生傳輸實際支援哪些可持久化的最終傳送能力，並將文字/媒體傳送指向
與舊版 `outbound` 配接器相同的傳輸函式。只有在合約測試
證明原生副作用與回傳回執時，才宣告某項能力。
完整 API 合約、範例、能力矩陣、回執規則、即時
預覽最終化、接收確認政策、測試與遷移表，請參閱
[頻道外送 API](/zh-TW/plugins/sdk-channel-outbound)。
如果現有的 `outbound` 配接器已經有正確的傳送方法與
能力中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)`
衍生 `message` 配接器，而不是手寫另一個橋接層。
配接器傳送應回傳 `MessageReceipt` 值。當相容性程式碼
仍需要舊版 ID 時，請使用 `listMessageReceiptPlatformIds(...)`
或 `resolveMessageReceiptPrimaryId(...)` 衍生它們，而不是在新的生命週期程式碼中保留平行的
`messageIds` 欄位。
支援預覽的頻道也應宣告 `message.live.capabilities`，並列出
它們擁有的確切即時生命週期，例如 `draftPreview`、
`previewFinalization`、`progressUpdates`、`nativeStreaming` 或
`quietFinalization`。會就地最終化草稿預覽的頻道
也應宣告 `message.live.finalizer.capabilities`，例如 `finalEdit`、
`normalFallback`、`discardPending`、`previewReceipt` 和
`retainOnAmbiguousFailure`，並將執行階段邏輯透過
`defineFinalizableLivePreviewAdapter(...)` 加上
`deliverWithFinalizableLivePreviewAdapter(...)` 路由。請用
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和
`verifyChannelMessageLiveFinalizerProofs(...)` 測試支撐這些能力，避免原生預覽、
進度、編輯、後援/保留、清理與回執行為無聲漂移。
延後平台確認的入站接收器應宣告
`message.receive.defaultAckPolicy` 與 `supportedAckPolicies`，而不是把
確認時機藏在監控器本機狀態中。請用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆蓋每個宣告的政策。

舊版回覆輔助工具，例如 `createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply`
仍可供相容性分派器使用。新的頻道程式碼不要使用這些名稱；新的外掛應從 `openclaw/plugin-sdk/channel-outbound` 上的 `message` 配接器、回執，以及
接收/傳送生命週期輔助工具開始。

正在遷移入站授權的頻道可以從執行階段接收路徑使用實驗性的
`openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。
該子路徑會將平台查詢與副作用保留在外掛中，同時
共用允許清單狀態解析、路由/傳送者/命令/事件/啟用
決策、已遮蔽診斷，以及回合准入對應。請將外掛
身分正規化放在你傳給解析器的描述元中；不要
序列化已解析狀態或決策中的原始匹配值。API 設計、
所有權邊界與測試期望，請參閱
[頻道入站 API](/zh-TW/plugins/sdk-channel-ingress)。

如果你的頻道支援入站回覆以外的輸入指示器，請在頻道外掛上暴露
`heartbeat.sendTyping(...)`。核心會在心跳偵測模型執行開始前，
以已解析的心跳偵測傳遞目標呼叫它，並使用共用的輸入狀態 keepalive/清理生命週期。
當平台需要明確停止訊號時，請加入 `heartbeat.clearTyping(...)`。

如果你的頻道加入了攜帶媒體來源的訊息工具參數，請透過
`describeMessageTool(...).mediaSourceParams` 暴露那些參數名稱。核心會使用
該明確清單進行沙盒路徑正規化與外送媒體存取
政策，因此外掛不需要為供應商特定的
頭像、附件或封面圖片參數加入共用核心特例。
偏好回傳以動作鍵為索引的對應，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，讓無關動作不會
繼承另一個動作的媒體引數。對於刻意在每個暴露動作之間共享的參數，
扁平陣列仍然可用。
必須為平台端媒體擷取暴露暫時公開 URL 的頻道，
可以使用 `openclaw/plugin-sdk/outbound-media` 的
`createHostedOutboundMediaStore(...)` 搭配外掛狀態儲存。請將平台
路由解析與權杖強制執行保留在頻道外掛中；共用輔助工具
只負責媒體載入、到期中繼資料、區塊列與清理。

如果你的頻道需要針對 `message(action="send")` 做供應商特定塑形，
請優先使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入或
其他可持久化資料放在 `payload.channelData.<channel>` 下，並讓核心透過
外送/訊息配接器執行實際傳送。只有在
酬載無法序列化與重試時，才將 `actions.handleAction(...)` 用於傳送作為相容性後援。

如果你的平台在對話 ID 內儲存額外範圍，請將該解析
保留在外掛中的 `messaging.resolveSessionConversation(...)`。這是
將 `rawId` 對應到基礎對話 ID、選用討論串
ID、明確 `baseConversationId` 以及任何 `parentConversationCandidates` 的
標準鉤子。
當你回傳 `parentConversationCandidates` 時，請保持它們從
最窄的父層到最廣/基礎對話排序。

當外掛程式碼需要正規化類路由欄位、比較子討論串與其父層路由，
或從 `{ channel, to, accountId, threadId }` 建置
穩定的去重鍵時，請使用 `openclaw/plugin-sdk/channel-route`。該輔助工具
會以和核心相同的方式正規化數字討論串 ID，因此外掛應優先使用
它，而不是臨時的 `String(threadId)` 比較。
具有供應商特定目標語法的外掛應暴露
`messaging.resolveOutboundSessionRoute(...)`，讓核心取得供應商原生的
工作階段與討論串身分，而不使用解析器 shim。

在頻道登錄檔啟動前需要相同解析的內建外掛，
也可以暴露頂層 `session-key-api.ts` 檔案，並匯出相符的
`resolveSessionConversation(...)`。核心只會在執行階段外掛登錄檔
尚不可用時，使用這個啟動安全的表面。

當外掛只需要在通用/原始 ID 之上提供父層後援時，
`messaging.resolveParentConversationCandidates(...)` 仍可作為
舊版相容性後援使用。如果兩個鉤子都存在，核心會先使用
`resolveSessionConversation(...).parentConversationCandidates`，且只有在標準鉤子
省略它們時，才後援到 `resolveParentConversationCandidates(...)`。

## 核准與頻道能力

大多數頻道外掛不需要核准專用程式碼。

- 核心擁有同一聊天的 `/approve`、共用核准按鈕 payload，以及通用後援傳遞。
- 當頻道需要核准專屬行為時，偏好在頻道外掛上使用單一 `approvalCapability` 物件。
- `ChannelPlugin.approvals` 已移除。請將核准傳遞/原生/render/auth 事實放在 `approvalCapability` 上。
- `plugin.auth` 僅限 login/logout；核心不再從該物件讀取核准 auth hooks。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是標準的核准 auth 介面。
- 對於同一聊天的核准 auth 可用性，請使用 `approvalCapability.getActionAvailabilityState`。
- 如果你的頻道公開原生 exec 核准，當發起介面/原生用戶端狀態不同於同一聊天核准 auth 時，請使用 `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該 exec 專屬 hook 來區分 `enabled` 與 `disabled`、判斷發起頻道是否支援原生 exec 核准，並在原生用戶端後援指引中包含該頻道。`createApproverRestrictedNativeApprovalCapability(...)` 會為常見情況填入這一項。
- 對於頻道專屬 payload 生命週期行為，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入中指示器，請使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 僅將 `approvalCapability.delivery` 用於原生核准路由或後援抑制。
- 將 `approvalCapability.nativeRuntime` 用於頻道擁有的原生核准事實。請在熱門頻道進入點上透過 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持其惰性載入；它可以按需匯入你的 runtime 模組，同時仍讓核心組裝核准生命週期。
- 只有在頻道真正需要自訂核准 payload，而不是共用 renderer 時，才使用 `approvalCapability.render`。
- 當頻道希望 disabled 路徑回覆說明啟用原生 exec 核准所需的確切設定開關時，請使用 `approvalCapability.describeExecApprovalSetup`。該 hook 會接收 `{ channel, channelLabel, accountId }`；具名帳號頻道應轉譯帳號範圍的路徑，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是頂層預設值。
- 如果頻道可以從現有設定推斷穩定、類似擁有者的 DM 身分，請使用 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 來限制同一聊天的 `/approve`，而不必加入核准專屬核心邏輯。
- 如果自訂核准 auth 有意只允許同一聊天後援，請從 `openclaw/plugin-sdk/approval-auth-runtime` 回傳 `markImplicitSameChatApprovalAuthorization({ authorized: true })`；否則核心會將結果視為明確的核准者授權。
- 如果頻道擁有的原生 callback 會直接解析核准，請在解析前使用 `isImplicitSameChatApprovalAuthorization(...)`，讓隱含後援仍會經過頻道的正常 actor 授權。
- 如果頻道需要原生核准傳遞，請讓頻道程式碼專注於目標正規化以及傳輸/呈現事實。使用 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。將頻道專屬事實放在 `approvalCapability.nativeRuntime` 後面，最好透過 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心可以組裝 handler，並擁有請求篩選、路由、去重、過期、閘道訂閱，以及已路由至其他位置通知。`nativeRuntime` 會拆成幾個較小的介面：
- 當頻道同時支援 session-origin 原生傳遞與明確核准轉送目標時，請使用 `openclaw/plugin-sdk/approval-native-runtime` 的 `createNativeApprovalChannelRouteGates`。此 helper 會集中處理核准設定選擇、`mode` 處理、agent/session 篩選、帳號繫結、session-target 比對，以及 target-list 比對；呼叫端仍擁有頻道 id、預設轉送模式、帳號查詢、transport-enabled 檢查、目標正規化，以及 turn-source target 解析。不要用它建立核心擁有的頻道策略預設；請明確傳入該頻道記錄於文件的預設模式。
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用共用 channel-route matcher。只有當頻道具有 provider 專屬等價規則時，才傳入 `targetsMatch`，例如 Slack timestamp prefix matching。
- 當頻道需要在預設 route matcher 或自訂 `targetsMatch` callback 執行前標準化 provider id，同時保留原始目標供傳遞使用時，請將 `normalizeTargetForMatch` 傳給 `createChannelNativeOriginTargetResolver`。只有當解析後的傳遞目標本身應標準化時，才使用 `normalizeTarget`。
- `availability` - 帳號是否已設定，以及請求是否應被處理
- `presentation` - 將共用核准 view model 映射為 pending/resolved/expired 原生 payload 或最終 actions
- `transport` - 準備目標，並傳送/更新/刪除原生核准訊息
- `interactions` - 原生按鈕或 reaction 的選用 bind/unbind/clear-action hooks，加上選用的 `cancelDelivered` hook。當 `deliverPending` 註冊 in-process 或持久狀態（例如 reaction target store）時，請實作 `cancelDelivered`，以便在 handler stop 於 `bindPending` 執行前取消傳遞，或 `bindPending` 未回傳 handle 時釋放該狀態
- `observe` - 選用的傳遞診斷 hooks
- 如果頻道需要 runtime 擁有的物件，例如 client、token、Bolt app 或 webhook receiver，請透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊它們。通用 runtime-context registry 讓核心可以從頻道啟動狀態 bootstrap capability-driven handlers，而不必加入核准專屬 wrapper glue。
- 只有當 capability-driven 介面尚不足以表達需求時，才採用較低階的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生核准頻道必須透過這些 helpers 路由 `accountId` 和 `approvalKind`。`accountId` 讓多帳號核准策略範圍保持在正確的 bot 帳號內，而 `approvalKind` 讓 exec 與外掛核准行為可供頻道使用，不需要在核心中硬編碼分支。
- 核心現在也擁有核准重新路由通知。頻道外掛不應從 `createChannelNativeApprovalRuntime` 傳送自己的「核准已送至 DMs / 另一個頻道」後續訊息；相反地，請透過共用核准 capability helpers 公開準確的 origin + approver-DM 路由，並讓核心在回到發起聊天發佈任何通知前彙總實際傳遞。
- 端到端保留已傳遞核准 id kind。原生用戶端不應
  從頻道本機狀態猜測或重寫 exec 與外掛核准路由。
- 不同核准種類可以有意公開不同的原生介面。
  目前 bundled examples：
  - Slack 對 exec 和外掛 ids 都保持原生核准路由可用。
  - Matrix 對 exec 和外掛核准保持相同的原生 DM/頻道路由與 reaction UX，同時仍允許 auth 依核准種類不同。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為相容性 wrapper 存在，但新程式碼應偏好 capability builder，並在外掛上公開 `approvalCapability`。

對於熱門頻道進入點，當你只需要該系列的一部分時，請偏好較窄的 runtime 子路徑：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要較廣泛的總括介面時，請偏好 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 和
`openclaw/plugin-sdk/reply-chunking`。

特別針對設定：

- `openclaw/plugin-sdk/setup-runtime` 涵蓋 runtime-safe 設定 helpers：
  `createSetupTranslator`、import-safe setup patch adapters（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派式
  setup-proxy builders
- `openclaw/plugin-sdk/setup-runtime` 包含 env-aware adapter 介面，用於
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` 涵蓋 optional-install 設定
  builders，以及幾個 setup-safe primitives：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的頻道支援 env-driven setup 或 auth，且通用 startup/config
流程應在 runtime 載入前知道這些 env 名稱，請在
外掛 manifest 中以 `channelEnvVars` 宣告它們。頻道 runtime `envVars` 或本機
constants 僅保留給 operator-facing copy 使用。

如果你的頻道可能在外掛 runtime 啟動前出現在 `status`、`channels list`、`channels status` 或
SecretRef scans 中，請在
`package.json` 加入 `openclaw.setupEntry`。該 entrypoint 應可在唯讀命令
路徑中安全匯入，並應回傳這些摘要所需的頻道 metadata、setup-safe config adapter、status
adapter，以及 channel secret target metadata。不要
從 setup entry 啟動 clients、listeners 或 transport runtimes。

也請保持主頻道 entry 匯入路徑狹窄。Discovery 可以評估
entry 和頻道外掛模組來註冊 capabilities，而不啟用
頻道。像 `channel-plugin-api.ts` 這類檔案應匯出頻道
外掛物件，而不匯入 setup wizards、transport clients、socket
listeners、subprocess launchers 或 service startup modules。將這些 runtime
部分放在由 `registerFull(...)`、runtime setters 或惰性
capability adapters 載入的模組中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有當你也需要較重的共用 setup/config helpers，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用較廣泛的 `openclaw/plugin-sdk/setup` 介面

如果你的頻道只想在設定介面中宣傳「先安裝此外掛」，請偏好 `createOptionalChannelSetupSurface(...)`。產生的
adapter/wizard 會在 config writes 和 finalization 上 fail closed，並且在 validation、finalize 和 docs-link
copy 中重用相同的 install-required message。

對於其他熱門頻道路徑，請偏好狹窄 helpers，而不是較廣泛的 legacy
介面：

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`，以及
  `openclaw/plugin-sdk/account-helpers`，用於多帳號設定與
  預設帳號備援
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/channel-inbound`，用於傳入路由/信封與
  記錄並分派接線
- `openclaw/plugin-sdk/channel-targets`，用於目標解析輔助工具
- `openclaw/plugin-sdk/outbound-media`，用於媒體載入，以及
  `openclaw/plugin-sdk/channel-outbound`，用於傳出身分/傳送委派
  與酬載規劃
- 來自
  `openclaw/plugin-sdk/channel-core` 的 `buildThreadAwareOutboundSessionRoute(...)`，
  當傳出路由應保留明確的 `replyToId`/`threadId`，或在基礎工作階段金鑰仍然相符後
  復原目前的 `:thread:` 工作階段時使用。提供者外掛可以在其平台
  具備原生執行緒傳遞語意時，覆寫
  優先順序、尾碼行為與執行緒 ID 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於執行緒綁定生命週期
  與配接器註冊
- 只有在仍需要舊版代理/媒體
  酬載欄位版面配置時，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用於 Telegram 自訂命令
  正規化、重複/衝突驗證，以及備援穩定的命令
  設定合約

僅驗證的通道通常可以停在預設路徑：核心會處理核准，而外掛只需公開傳出/驗證能力。Matrix、Slack、Telegram 等原生核准通道，以及自訂聊天傳輸，應使用共用的原生輔助工具，而不是自行實作核准生命週期。

## 傳入提及政策

將傳入提及處理分成兩層：

- 外掛擁有的證據蒐集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行提及政策決策。
只有在需要更廣泛的傳入
輔助 barrel 時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合外掛本機邏輯的項目：

- 回覆機器人偵測
- 引用機器人偵測
- 執行緒參與檢查
- 服務/系統訊息排除
- 證明機器人參與所需的平台原生快取

適合共用輔助工具的項目：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令略過
- 最終略過決策

建議流程：

1. 計算本機提及事實。
2. 將那些事實傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在傳入閘門中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

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

`api.runtime.channel.mentions` 會為
已依賴執行階段注入的內建通道外掛公開相同的共用提及輔助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，請從
`openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入無關的傳入
執行階段輔助工具。

使用 `resolveInboundMentionDecision({ facts, policy })` 進行提及閘控。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    建立標準外掛檔案。`package.json` 中的 `channel` 欄位
    會讓這成為通道外掛。如需完整的套件中繼資料介面，
    請參閱[外掛設定與組態](/zh-TW/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。將它用於
    不屬於通道帳號設定、且由外掛擁有的設定。`channelConfigs`
    會驗證 `channels.acme-chat`，並且是在外掛執行階段載入之前，
    供設定
    schema、設定流程與 UI 介面使用的冷路徑來源。

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` 介面有許多選用的配接器介面。從
    最小需求開始，也就是 `id` 和 `setup`，再依需要加入配接器。

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

    對於同時接受標準頂層 DM 金鑰與舊版巢狀金鑰的通道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助工具：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳號本機值優先於繼承的根值。將相同的解析器與透過 `normalizeLegacyDmAliases` 進行的 doctor 修復配對，讓執行階段與遷移讀取同一份合約。

    <Accordion title="What createChatChannelPlugin does for you">
      你不需要手動實作低階配接器介面，而是傳入
      宣告式選項，建構器會將它們組合起來：

      | 選項 | 接線內容 |
      | --- | --- |
      | `security.dm` | 來自設定欄位的範圍化 DM 安全解析器 |
      | `pairing.text` | 透過代碼交換的文字式 DM 配對流程 |
      | `threading` | 回覆模式解析器（固定、帳號範圍或自訂） |
      | `outbound.attachedResults` | 回傳結果中繼資料（訊息 ID）的傳送函式 |

      如果需要完全控制，你也可以傳入原始配接器物件，
      而不是宣告式選項。

      原始傳出配接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳遞時間的格式化決策，
      例如 `maxLinesPerMessage`；請在傳送前套用它，讓回覆執行緒
      與分塊邊界由共用傳出傳遞一次解析完成。
      傳送內容也會在原生回覆目標已解析時包含 `replyToIdSource`（`implicit` 或 `explicit`），
      因此酬載輔助工具可以保留
      明確回覆標記，而不消耗隱含的一次性回覆槽。
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

    將頻道擁有的命令列介面描述項放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    可以在根說明中顯示它們，而不啟用完整的頻道執行階段；
    同時一般完整載入仍會取得相同描述項，用於實際命令
    註冊。將 `registerFull(...)` 保留給僅限執行階段的工作。
    如果 `registerFull(...)` 註冊閘道 RPC 方法，請使用
    外掛專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，且一律
    解析到 `operator.admin`。
    `defineChannelPluginEntry` 會自動處理註冊模式的分割。請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)了解所有
    選項。

  </Step>

  <Step title="Add a setup entry">
    建立 `setup-entry.ts`，用於入門設定期間的輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道停用或尚未設定時，OpenClaw 會載入此項目，而不是完整進入點。
    這可避免在設定流程期間拉入繁重的執行階段程式碼。
    詳情請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出拆分到 sidecar
    模組的內建工作區頻道，若也需要明確的設定期間執行階段 setter，
    可以使用來自 `openclaw/plugin-sdk/channel-entry-contract` 的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="Handle inbound messages">
    你的外掛需要從平台接收訊息，並將其轉送給
    OpenClaw。典型模式是使用網路鉤子驗證請求，並
    透過你的頻道傳入處理器分派它：

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
      自己的傳入管線。請查看內建頻道外掛
      （例如 Microsoft Teams 或 Google Chat 外掛套件）中的實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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
  <Card title="Threading options" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳號範圍或自訂回覆模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體、透過 api.runtime 使用子代理
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/zh-TW/plugins/sdk-channel-inbound">
    共用傳入事件生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分內建輔助接縫仍存在，用於內建外掛維護與
相容性。它們不是新頻道外掛的建議模式；
除非你直接維護該內建外掛家族，否則請優先使用通用 SDK
介面中的一般 channel/setup/reply/runtime 子路徑。
</Note>

## 後續步驟

- [Provider 外掛](/zh-TW/plugins/sdk-provider-plugins) - 如果你的外掛也提供模型
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試工具與契約測試
- [外掛 Manifest](/zh-TW/plugins/manifest) - 完整 manifest schema

## 相關

- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [代理 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
