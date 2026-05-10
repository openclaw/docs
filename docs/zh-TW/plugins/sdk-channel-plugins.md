---
read_when:
    - 你正在建立新的訊息通道 Plugin
    - 您想將 OpenClaw 連接到訊息平台
    - 你需要了解 ChannelPlugin 配接器介面
sidebarTitle: Channel Plugins
summary: 建置 OpenClaw 訊息通道 Plugin 的逐步指南
title: 建置通道 Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會帶你建立一個將 OpenClaw 連接到訊息平台的通道 Plugin。完成後，你會擁有具備 DM 安全性、配對、回覆串接和對外傳訊功能的可運作通道。

<Info>
  如果你以前沒有建立過任何 OpenClaw Plugin，請先閱讀
  [快速開始](/zh-TW/plugins/building-plugins)，了解基本套件結構和 manifest 設定。
</Info>

## 通道 Plugin 的運作方式

通道 Plugin 不需要自己的傳送/編輯/反應工具。OpenClaw 會在核心中保留一個共用的 `message` 工具。你的 Plugin 負責：

- **設定** - 帳號解析與設定精靈
- **安全性** - DM 政策與允許清單
- **配對** - DM 核准流程
- **工作階段語法** - 供應商特定對話 ID 如何對應到基礎聊天、執行緒 ID 與父層備援
- **對外傳送** - 將文字、媒體和投票傳送到平台
- **執行緒** - 回覆如何串接
- **Heartbeat 輸入狀態** - 針對 Heartbeat 傳遞目標的選用輸入中/忙碌訊號

核心負責共用訊息工具、提示接線、外層工作階段鍵形狀、通用 `:thread:` 簿記與分派。

新的通道 Plugin 也應該使用 `openclaw/plugin-sdk/channel-message` 的
`defineChannelMessageAdapter` 暴露 `message` 轉接器。轉接器會宣告原生傳輸實際支援哪些持久最終傳送能力，並將文字/媒體傳送指向與舊版 `outbound` 轉接器相同的傳輸函式。只有在合約測試證明原生副作用和回傳 receipt 時，才宣告某項能力。
完整的 API 合約、範例、能力矩陣、receipt 規則、即時預覽最終化、接收 ack 政策、測試與遷移表，請參閱
[通道訊息 API](/zh-TW/plugins/sdk-channel-message)。
如果現有的 `outbound` 轉接器已經具備正確的傳送方法和能力中繼資料，請使用 `createChannelMessageAdapterFromOutbound(...)` 衍生 `message` 轉接器，而不是手寫另一個橋接。
轉接器傳送應回傳 `MessageReceipt` 值。當相容性程式碼仍需要舊版 ID 時，請用 `listMessageReceiptPlatformIds(...)`
或 `resolveMessageReceiptPrimaryId(...)` 衍生它們，而不要在新的生命週期程式碼中保留平行的 `messageIds` 欄位。
具備預覽能力的通道也應以 `message.live.capabilities` 宣告它們擁有的確切即時生命週期，例如 `draftPreview`、
`previewFinalization`、`progressUpdates`、`nativeStreaming` 或
`quietFinalization`。會就地最終化草稿預覽的通道，也應宣告 `message.live.finalizer.capabilities`，例如 `finalEdit`、
`normalFallback`、`discardPending`、`previewReceipt` 和
`retainOnAmbiguousFailure`，並透過
`defineFinalizableLivePreviewAdapter(...)` 加上
`deliverWithFinalizableLivePreviewAdapter(...)` 路由執行階段邏輯。請用 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和
`verifyChannelMessageLiveFinalizerProofs(...)` 測試支撐這些能力，讓原生預覽、進度、編輯、備援/保留、清理和 receipt 行為不會無聲偏移。
會延後平台確認的入站接收器應宣告
`message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是把 ack 時機藏在監視器本地狀態中。用
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆蓋每個宣告的政策。

舊版回覆/回合輔助工具，例如 `createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply`，仍可供相容性分派器使用。新的通道程式碼不要使用這些名稱；新的 Plugin 應從 `openclaw/plugin-sdk/channel-message` 上的 `message` 轉接器、receipt，以及接收/傳送生命週期輔助工具開始。

正在遷移入站授權的通道，可以從執行階段接收路徑使用實驗性的
`openclaw/plugin-sdk/channel-ingress-runtime` 子路徑。此子路徑會把平台查找和副作用留在 Plugin 中，同時共用允許清單狀態解析、路由/傳送者/命令/事件/啟用決策、已遮蔽診斷，以及回合准入對應。請把 Plugin 身分正規化保留在你傳給解析器的 descriptor 中；不要序列化已解析狀態或決策中的原始比對值。API 設計、擁有權邊界與測試期望，請參閱
[通道入口 API](/zh-TW/plugins/sdk-channel-ingress)。

如果你的通道支援入站回覆以外的輸入指示器，請在通道 Plugin 上暴露
`heartbeat.sendTyping(...)`。核心會在 Heartbeat 模型執行開始前，以已解析的 Heartbeat 傳遞目標呼叫它，並使用共用的輸入狀態 keepalive/清理生命週期。當平台需要明確停止訊號時，請加入 `heartbeat.clearTyping(...)`。

如果你的通道新增了會攜帶媒體來源的訊息工具參數，請透過
`describeMessageTool(...).mediaSourceParams` 暴露這些參數名稱。核心會使用該明確清單進行沙盒路徑正規化和對外媒體存取政策，因此 Plugin 不需要為供應商特定的頭像、附件或封面圖片參數新增共用核心特例。
偏好回傳以動作為鍵的映射，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，讓無關動作不會繼承另一個動作的媒體引數。若某些參數有意在每個已暴露動作之間共用，扁平陣列仍然可用。

如果你的通道需要針對 `message(action="send")` 進行供應商特定塑形，請優先使用 `actions.prepareSendPayload(...)`。將原生卡片、區塊、嵌入或其他持久資料放在 `payload.channelData.<channel>` 底下，讓核心透過 outbound/message 轉接器執行實際傳送。只有在 payload 無法序列化並重試時，才把 `actions.handleAction(...)` 用作傳送的相容性備援。

如果你的平台在對話 ID 中儲存額外範圍，請使用 `messaging.resolveSessionConversation(...)` 將該解析保留在 Plugin 中。這是將 `rawId` 對應到基礎對話 ID、選用執行緒 ID、明確的 `baseConversationId`，以及任何 `parentConversationCandidates` 的標準 hook。
當你回傳 `parentConversationCandidates` 時，請依照從最窄父層到最寬/基礎對話的順序排列。

當 Plugin 程式碼需要正規化類路由欄位、比較子執行緒與其父層路由，或從 `{ channel, to, accountId, threadId }` 建立穩定去重鍵時，請使用 `openclaw/plugin-sdk/channel-route`。該輔助工具會以與核心相同的方式正規化數字執行緒 ID，因此 Plugin 應優先使用它，而不是臨時的 `String(threadId)` 比較。
具備供應商特定目標語法的 Plugin，可以將自己的剖析器注入
`resolveChannelRouteTargetWithParser(...)`，並仍取得與核心使用相同的路由目標形狀和執行緒備援語意。

需要在通道登錄啟動前進行相同解析的內建 Plugin，也可以暴露頂層
`session-key-api.ts` 檔案，並匯出相符的
`resolveSessionConversation(...)`。只有在執行階段 Plugin 登錄尚不可用時，核心才會使用這個可安全自舉的介面。

當 Plugin 只需要在通用/原始 ID 之上提供父層備援時，
`messaging.resolveParentConversationCandidates(...)` 仍可作為舊版相容性備援使用。如果兩個 hook 都存在，核心會先使用
`resolveSessionConversation(...).parentConversationCandidates`，且只有在標準 hook 省略它們時，才會退回
`resolveParentConversationCandidates(...)`。

## 核准與通道能力

大多數通道 Plugin 不需要核准特定程式碼。

- 核心擁有同一聊天的 `/approve`、共用核准按鈕 payload，以及通用的後援傳遞。
- 當通道需要核准專屬行為時，偏好在通道 Plugin 上使用單一 `approvalCapability` 物件。
- `ChannelPlugin.approvals` 已移除。請將核准傳遞、原生、算繪、驗證事實放在 `approvalCapability`。
- `plugin.auth` 僅用於登入/登出；核心不再從該物件讀取核准驗證 hook。
- `approvalCapability.authorizeActorAction` 與 `approvalCapability.getActionAvailabilityState` 是標準的核准驗證接縫。
- 使用 `approvalCapability.getActionAvailabilityState` 處理同一聊天核准驗證可用性。
- 如果你的通道公開原生 exec 核准，當發起表面/原生用戶端狀態不同於同一聊天核准驗證時，請使用 `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該 exec 專屬 hook 來區分 `enabled` 與 `disabled`、判斷發起通道是否支援原生 exec 核准，並將該通道納入原生用戶端後援指引。`createApproverRestrictedNativeApprovalCapability(...)` 會為常見情況填入這項內容。
- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 處理通道專屬的 payload 生命週期行為，例如隱藏重複的本機核准提示，或在傳遞前送出輸入中指示。
- 僅將 `approvalCapability.delivery` 用於原生核准路由或後援抑制。
- 使用 `approvalCapability.nativeRuntime` 放置通道擁有的原生核准事實。在熱門通道進入點上透過 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 保持延遲載入；它可以視需要匯入你的 runtime 模組，同時仍讓核心組裝核准生命週期。
- 僅在通道確實需要自訂核准 payload，而非共用算繪器時，才使用 `approvalCapability.render`。
- 當通道希望 disabled 路徑回覆說明啟用原生 exec 核准所需的精確設定旋鈕時，使用 `approvalCapability.describeExecApprovalSetup`。該 hook 會收到 `{ channel, channelLabel, accountId }`；具名帳號通道應算繪帳號範圍路徑，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而非頂層預設值。
- 如果通道可以從現有設定推斷穩定、類似擁有者的 DM 身分，請使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 來限制同一聊天 `/approve`，而不新增核准專屬核心邏輯。
- 如果通道需要原生核准傳遞，請讓通道程式碼聚焦於目標正規化以及傳輸/呈現事實。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 與 `createApproverRestrictedNativeApprovalCapability`。將通道專屬事實放在 `approvalCapability.nativeRuntime` 後方，理想上透過 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心可組裝處理器並擁有請求篩選、路由、去重、到期、Gateway 訂閱與已路由至別處的通知。`nativeRuntime` 會分割成幾個較小接縫：
- `createChannelNativeOriginTargetResolver` 預設會針對 `{ to, accountId, threadId }` 目標使用共用通道路由比對器。只有在通道有供應商專屬等價規則時才傳入 `targetsMatch`，例如 Slack 時間戳前綴比對。
- 當通道需要在預設路由比對器或自訂 `targetsMatch` callback 執行前，先將供應商 id 標準化，同時保留原始目標以供傳遞時，請將 `normalizeTargetForMatch` 傳給 `createChannelNativeOriginTargetResolver`。只有在解析後的傳遞目標本身應被標準化時，才使用 `normalizeTarget`。
- `availability` - 帳號是否已設定，以及請求是否應被處理
- `presentation` - 將共用核准檢視模型對應到待處理/已解析/已到期的原生 payload 或最終動作
- `transport` - 準備目標並傳送/更新/刪除原生核准訊息
- `interactions` - 用於原生按鈕或反應的選用綁定/解除綁定/清除動作 hook
- `observe` - 選用的傳遞診斷 hook
- 如果通道需要 runtime 擁有的物件，例如用戶端、token、Bolt app 或 webhook receiver，請透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊。通用 runtime-context 登錄可讓核心從通道啟動狀態啟動能力驅動的處理器，而不新增核准專屬 wrapper 黏合程式碼。
- 只有在能力驅動接縫尚不足以表達需求時，才使用較低層級的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生核准通道必須透過這些 helper 路由 `accountId` 與 `approvalKind`。`accountId` 會讓多帳號核准政策限定在正確的 bot 帳號範圍內，而 `approvalKind` 會讓通道可取得 exec 與 Plugin 核准行為，無須在核心中硬編碼分支。
- 核心現在也擁有核准重路由通知。通道 Plugin 不應從 `createChannelNativeApprovalRuntime` 傳送自己的「核准已送到 DM / 另一個通道」後續訊息；改為透過共用核准能力 helper 公開準確的來源與核准者 DM 路由，並讓核心在發起聊天中發出任何通知前彙總實際傳遞。
- 端對端保留已傳遞核准 id 種類。原生用戶端不應
  從通道本機狀態猜測或重寫 exec 與 Plugin 核准路由。
- 不同核准種類可以刻意公開不同的原生表面。
  目前的內建範例：
  - Slack 讓 exec 與 Plugin id 都可使用原生核准路由。
  - Matrix 為 exec 與 Plugin 核准保留相同的原生 DM/通道路由與反應 UX，
    同時仍允許驗證依核准種類而異。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為相容性 wrapper 存在，但新程式碼應偏好能力 builder，並在 Plugin 上公開 `approvalCapability`。

對於熱門通道進入點，當你只需要該家族的一部分時，偏好較窄的 runtime 子路徑：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要更廣的傘狀表面時，偏好使用 `openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 與
`openclaw/plugin-sdk/reply-chunking`。

特別針對 setup：

- `openclaw/plugin-sdk/setup-runtime` 涵蓋 runtime 安全的 setup helper：
  匯入安全 setup patch adapter（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、查找備註輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  setup-proxy builder
- `openclaw/plugin-sdk/setup-runtime` 包含用於
  `createEnvPatchedAccountSetupAdapter` 的環境感知 adapter 接縫
- `openclaw/plugin-sdk/channel-setup` 涵蓋選用安裝 setup
  builder 與幾個 setup 安全 primitive：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的通道支援環境驅動的 setup 或驗證，且通用啟動/設定流程應在 runtime 載入前知道這些環境名稱，請在 Plugin manifest 中透過 `channelEnvVars` 宣告。通道 runtime `envVars` 或本機常數只保留給面向操作者的文案。

如果你的通道可在 Plugin runtime 啟動前出現在 `status`、`channels list`、`channels status` 或 SecretRef 掃描中，請在 `package.json` 中加入 `openclaw.setupEntry`。該進入點應可在唯讀命令路徑中安全匯入，並應回傳這些摘要所需的通道中繼資料、setup 安全設定 adapter、狀態 adapter，以及通道祕密目標中繼資料。不要從 setup 進入點啟動用戶端、監聽器或傳輸 runtime。

也請保持主要通道進入匯入路徑狹窄。探索可以評估該進入點與通道 Plugin 模組，以註冊能力而不啟用通道。`channel-plugin-api.ts` 等檔案應匯出通道 Plugin 物件，而不匯入 setup wizard、傳輸用戶端、socket 監聽器、子行程啟動器或服務啟動模組。請將這些 runtime 元件放入從 `registerFull(...)`、runtime setter 或延遲能力 adapter 載入的模組中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 與
`splitSetupEntries`

- 只有在你也需要較重的共用 setup/設定 helper，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用較廣的
  `openclaw/plugin-sdk/setup` 接縫

如果你的通道只想在 setup 表面宣告「請先安裝此 Plugin」，偏好使用 `createOptionalChannelSetupSurface(...)`。產生的 adapter/wizard 會在設定寫入與完成時以失敗關閉，並在驗證、完成與文件連結文案中重用相同的需要安裝訊息。

對於其他熱門通道路徑，偏好較窄的 helper，而非較廣的舊表面：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 與
  `openclaw/plugin-sdk/account-helpers`，用於多帳號設定與
  預設帳號後援
- `openclaw/plugin-sdk/inbound-envelope` 與
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用於傳入路由/envelope 與
  記錄並分派接線
- `openclaw/plugin-sdk/messaging-targets`，用於目標剖析/比對
- `openclaw/plugin-sdk/outbound-media` 與
  `openclaw/plugin-sdk/outbound-runtime`，用於媒體載入以及傳出
  身分/傳送委派與 payload 規劃
- 當傳出路由應保留明確的 `replyToId`/`threadId`，或在基礎 session key 仍相符後恢復目前的 `:thread:` session 時，使用
  `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。供應商 Plugin 可在其平台具有原生 thread 傳遞語意時，覆寫優先順序、後綴行為與 thread id 正規化。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於 thread-binding 生命週期
  與 adapter 註冊
- 只有在仍需要舊式 agent/media
  payload 欄位配置時，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用於 Telegram 自訂命令
  正規化、重複/衝突驗證，以及後援穩定的命令
  設定合約

僅驗證通道通常可以停在預設路徑：核心處理核准，而 Plugin 只公開傳出/驗證能力。Matrix、Slack、Telegram 與自訂聊天傳輸等原生核准通道，應使用共用原生 helper，而非自行建立核准生命週期。

## 傳入提及政策

將傳入提及處理分成兩層：

- Plugin 擁有的證據收集
- 共用政策評估

使用 `openclaw/plugin-sdk/channel-mention-gating` 處理提及政策決策。
只有在你需要較廣的傳入 helper barrel 時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合放在 Plugin 本機邏輯中的項目：

- 回覆 bot 偵測
- 引用 bot 偵測
- thread 參與檢查
- 服務/系統訊息排除
- 需要用來證明 bot 參與的平台原生快取

適合放在共用 helper 中的項目：

- `requireMention`
- 明確提及結果
- 隱含提及允許清單
- 命令繞過
- 最終略過決策

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

`api.runtime.channel.mentions` 會為已依賴執行階段注入的內建通道 Plugin，公開相同的共用提及輔助工具：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，請從
`openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入不相關的傳入執行階段輔助工具。

較舊的 `resolveMentionGating*` 輔助工具仍保留在
`openclaw/plugin-sdk/channel-inbound`，但僅作為相容性匯出。新程式碼應使用 `resolveInboundMentionDecision({ facts, policy })`。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    建立標準 Plugin 檔案。`package.json` 中的 `channel` 欄位會讓它成為通道 Plugin。完整的套件中繼資料介面請參閱 [Plugin 設定與組態](/zh-TW/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將它用於 Plugin 擁有、但不屬於通道帳號組態的設定。`channelConfigs`
    會驗證 `channels.acme-chat`，並且是在 Plugin 執行階段載入前，由組態結構描述、設定流程和 UI 介面使用的冷路徑來源。

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` 介面有許多選用的轉接器介面。先從最小集合開始，也就是 `id` 和 `setup`，再依需求新增轉接器。

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

    對於同時接受標準頂層 DM 鍵和舊版巢狀鍵的通道，請使用 `plugin-sdk/channel-config-helpers` 中的輔助工具：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓帳號本機值優先於繼承的根層級值。請搭配同一個解析器與透過 `normalizeLegacyDmAliases` 進行的 doctor 修復，讓執行階段和遷移讀取相同合約。

    <Accordion title="What createChatChannelPlugin does for you">
      你不必手動實作低階轉接器介面，而是傳入宣告式選項，由建構器負責組合：

      | 選項 | 連接內容 |
      | --- | --- |
      | `security.dm` | 來自組態欄位的範圍化 DM 安全性解析器 |
      | `pairing.text` | 使用代碼交換的文字式 DM 配對流程 |
      | `threading` | 回覆目標模式解析器（固定、帳號範圍或自訂） |
      | `outbound.attachedResults` | 回傳結果中繼資料（訊息 ID）的傳送函式 |

      如果你需要完整控制，也可以傳入原始轉接器物件，而不是宣告式選項。

      原始傳出轉接器可以定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳遞時的格式化決策，例如 `maxLinesPerMessage`；請在傳送前套用它，讓回覆串接和分段邊界由共用傳出傳遞流程一次解析完成。
      當原生回覆目標已解析時，傳送內容也會包含 `replyToIdSource`（`implicit` 或 `explicit`），因此承載輔助工具可以保留明確回覆標籤，而不會耗用隱含的一次性回覆槽。
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

    將通道擁有的 CLI 描述元放在 `registerCliMetadata(...)` 中，這樣 OpenClaw 不必啟動完整通道執行階段，就能在根說明中顯示它們；一般完整載入仍會取得相同描述元，用於實際命令註冊。將 `registerFull(...)` 保留給僅限執行階段的工作。
    如果 `registerFull(...)` 註冊 Gateway RPC 方法，請使用
    Plugin 專用前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，並且一律解析為 `operator.admin`。
    `defineChannelPluginEntry` 會自動處理註冊模式的分割。所有選項請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="Add a setup entry">
    建立 `setup-entry.ts`，供上線引導期間輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當通道已停用或尚未設定時，OpenClaw 會載入這個項目，而不是完整進入點。它可避免在設定流程中拉入沉重的執行階段程式碼。
    詳情請參閱 [設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出拆分到 sidecar 模組的內建工作區通道，也可以在需要明確設定期間執行階段 setter 時，使用
    `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="Handle inbound messages">
    你的 Plugin 需要從平台接收訊息，並將它們轉送給 OpenClaw。典型模式是使用 Webhook 驗證請求，並透過你的通道傳入處理器分派：

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
      傳入訊息處理依頻道而異。每個頻道 Plugin 都擁有
      自己的傳入管線。請參考隨附的頻道 Plugin
      （例如 Microsoft Teams 或 Google Chat Plugin 套件）以了解實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
在 `src/channel.test.ts` 中撰寫同置測試：

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
    固定、帳戶範圍或自訂回覆模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和動作探索
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體、透過 api.runtime 使用的子代理
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/zh-TW/plugins/sdk-channel-turn">
    共用傳入回合生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
有些隨附的輔助介面仍存在，用於隨附 Plugin 的維護與
相容性。它們不是新頻道 Plugin 的建議模式；
除非你直接維護該隨附 Plugin 家族，否則請優先使用共用 SDK
介面中的通用 channel/setup/reply/runtime 子路徑。
</Note>

## 下一步

- [Provider Plugins](/zh-TW/plugins/sdk-provider-plugins) - 如果你的 Plugin 也提供模型
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) - 測試工具與合約測試
- [Plugin Manifest](/zh-TW/plugins/manifest) - 完整 Manifest 結構描述

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [代理程式框架 Plugin](/zh-TW/plugins/sdk-agent-harness)
