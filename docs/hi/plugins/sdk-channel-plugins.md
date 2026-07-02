---
read_when:
    - आप एक नया मैसेजिंग चैनल plugin बना रहे हैं
    - आप OpenClaw को किसी मैसेजिंग प्लेटफ़ॉर्म से जोड़ना चाहते हैं
    - आपको ChannelPlugin अडैप्टर सतह को समझना होगा
sidebarTitle: Channel Plugins
summary: OpenClaw के लिए मैसेजिंग चैनल Plugin बनाने की चरण-दर-चरण मार्गदर्शिका
title: चैनल Plugin बनाना
x-i18n:
    generated_at: "2026-07-02T22:32:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

यह गाइड ऐसा चैनल Plugin बनाने की प्रक्रिया बताती है जो OpenClaw को किसी
मैसेजिंग प्लेटफ़ॉर्म से जोड़ता है। अंत तक आपके पास DM सुरक्षा,
पेयरिंग, उत्तर थ्रेडिंग, और आउटबाउंड मैसेजिंग वाला काम करता चैनल होगा।

<Info>
  अगर आपने पहले कोई OpenClaw plugin नहीं बनाया है, तो बुनियादी पैकेज
  संरचना और मैनिफ़ेस्ट सेटअप के लिए पहले
  [शुरू करना](/hi/plugins/building-plugins) पढ़ें।
</Info>

## चैनल plugins कैसे काम करते हैं

चैनल plugins को अपने अलग send/edit/react टूल की ज़रूरत नहीं होती। OpenClaw core में एक
साझा `message` टूल रखता है। आपका plugin इनका स्वामी होता है:

- **कॉन्फ़िग** - खाते का समाधान और सेटअप विज़ार्ड
- **सुरक्षा** - DM नीति और allowlists
- **पेयरिंग** - DM स्वीकृति फ़्लो
- **सेशन व्याकरण** - provider-विशिष्ट conversation ids कैसे base chats, thread ids, और parent fallbacks से मैप होते हैं
- **आउटबाउंड** - प्लेटफ़ॉर्म पर टेक्स्ट, मीडिया, और polls भेजना
- **थ्रेडिंग** - उत्तर कैसे थ्रेड किए जाते हैं
- **Heartbeat टाइपिंग** - heartbeat डिलीवरी targets के लिए वैकल्पिक typing/busy संकेत

Core साझा message टूल, prompt wiring, बाहरी session-key shape,
सामान्य `:thread:` bookkeeping, और dispatch का स्वामी होता है।

नए चैनल plugins को `openclaw/plugin-sdk/channel-outbound` से
`defineChannelMessageAdapter` के साथ एक `message` अडैप्टर भी expose करना चाहिए। अडैप्टर
घोषित करता है कि native transport वास्तव में कौन-सी durable final-send क्षमताएँ
समर्थित करता है और text/media sends को legacy `outbound` अडैप्टर जैसे ही
transport functions पर इंगित करता है। क्षमता तभी घोषित करें जब contract test
native side effect और लौटाई गई receipt सिद्ध करे।
पूर्ण API contract, उदाहरणों, capability matrix, receipt नियमों, live
preview finalization, receive ack policy, tests, और migration table के लिए
[चैनल outbound API](/hi/plugins/sdk-channel-outbound) देखें।
अगर मौजूदा `outbound` अडैप्टर में पहले से सही send methods और
capability metadata हैं, तो दूसरा bridge हाथ से लिखने के बजाय
`createChannelMessageAdapterFromOutbound(...)` का उपयोग करके
`message` अडैप्टर derive करें।
अडैप्टर sends को `MessageReceipt` values लौटानी चाहिए। जब compatibility code
को अभी भी legacy ids चाहिए, तो नए lifecycle code में समानांतर
`messageIds` fields रखने के बजाय उन्हें `listMessageReceiptPlatformIds(...)`
या `resolveMessageReceiptPrimaryId(...)` से derive करें।
Preview-capable चैनलों को अपने स्वामित्व वाले exact live lifecycle, जैसे
`draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, या
`quietFinalization` के साथ `message.live.capabilities` भी घोषित करना चाहिए।
जो चैनल draft preview को उसी जगह finalize करते हैं, उन्हें
`message.live.finalizer.capabilities`, जैसे `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, और
`retainOnAmbiguousFailure` भी घोषित करना चाहिए, और runtime logic को
`defineFinalizableLivePreviewAdapter(...)` तथा
`deliverWithFinalizableLivePreviewAdapter(...)` के माध्यम से route करना चाहिए। इन क्षमताओं को
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` और
`verifyChannelMessageLiveFinalizerProofs(...)` tests से समर्थित रखें ताकि native preview,
progress, edit, fallback/retention, cleanup, और receipt behavior चुपचाप drift न हो।
जो inbound receivers platform acknowledgements को defer करते हैं, उन्हें
ack timing को monitor-local state में छिपाने के बजाय
`message.receive.defaultAckPolicy` और `supportedAckPolicies` घोषित करने चाहिए। हर घोषित policy को
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` से cover करें।

Legacy reply helpers जैसे `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, और `recordInboundSessionAndDispatchReply`
compatibility dispatchers के लिए उपलब्ध रहते हैं। नए चैनल code के लिए इन नामों का उपयोग न करें; नए plugins को `openclaw/plugin-sdk/channel-outbound` पर `message` अडैप्टर, receipts, और
receive/send lifecycle helpers से शुरू करना चाहिए।

Inbound authorization migrate करने वाले चैनल runtime receive
paths से experimental
`openclaw/plugin-sdk/channel-ingress-runtime` subpath का उपयोग कर सकते हैं।
Subpath platform lookup और side effects को plugin में रखता है, जबकि
allowlist state resolution, route/sender/command/event/activation
decisions, redacted diagnostics, और turn-admission mapping साझा करता है। Plugin
identity normalization को उस descriptor में रखें जिसे आप resolver को देते हैं; resolved state या decision से raw match values serialize न करें। API design,
ownership boundary, और test expectations के लिए
[चैनल ingress API](/hi/plugins/sdk-channel-ingress) देखें।

अगर आपका चैनल inbound replies के बाहर typing indicators का समर्थन करता है, तो
channel plugin पर `heartbeat.sendTyping(...)` expose करें। Core इसे heartbeat model run शुरू होने से पहले resolved heartbeat delivery target के साथ call करता है और
shared typing keepalive/cleanup lifecycle का उपयोग करता है। जब platform को explicit stop signal चाहिए, तो `heartbeat.clearTyping(...)`
जोड़ें।

अगर आपका चैनल media sources ले जाने वाले message-tool params जोड़ता है, तो उन
param names को `describeMessageTool(...).mediaSourceParams` के माध्यम से expose करें। Core
sandbox path normalization और outbound media-access
policy के लिए इस explicit list का उपयोग करता है, इसलिए plugins को provider-विशिष्ट
avatar, attachment, या cover-image params के लिए shared-core special cases की ज़रूरत नहीं होती।
`{ "set-profile": ["avatarUrl", "avatarPath"] }` जैसे action-keyed map लौटाना
बेहतर है ताकि असंबंधित actions किसी दूसरे action के media args inherit न करें। Flat array उन params के लिए अभी भी काम करता है जो
हर exposed action में जानबूझकर साझा किए जाते हैं।
जिन चैनलों को platform-side media fetch के लिए temporary public URL expose करना हो, वे
plugin state stores के साथ
`openclaw/plugin-sdk/outbound-media` से `createHostedOutboundMediaStore(...)` का उपयोग कर सकते हैं। Platform
route parsing और token enforcement को channel plugin में रखें; shared helper
सिर्फ media loading, expiry metadata, chunk rows, और cleanup का स्वामी होता है।

अगर आपके चैनल को `message(action="send")` के लिए provider-विशिष्ट shaping चाहिए,
तो `actions.prepareSendPayload(...)` को प्राथमिकता दें। Native cards, blocks, embeds, या
अन्य durable data को `payload.channelData.<channel>` के अंतर्गत रखें और core को
outbound/message अडैप्टर के माध्यम से actual send करने दें। Send के लिए
`actions.handleAction(...)` का उपयोग केवल उन payloads के लिए compatibility fallback के रूप में करें
जो serialize और retry नहीं किए जा सकते।

अगर आपका platform conversation ids के अंदर अतिरिक्त scope store करता है, तो उस parsing को
`messaging.resolveSessionConversation(...)` के साथ plugin में रखें। यह
`rawId` को base conversation id, वैकल्पिक thread
id, explicit `baseConversationId`, और किसी भी `parentConversationCandidates` से मैप करने का canonical hook है।
जब आप `parentConversationCandidates` लौटाते हैं, तो उन्हें सबसे संकरे parent से
सबसे व्यापक/base conversation तक क्रम में रखें।

जब plugin code को route-जैसे fields normalize करने, child thread की उसके parent route से तुलना करने, या
`{ channel, to, accountId, threadId }` से stable dedupe key बनाने की ज़रूरत हो, तो `openclaw/plugin-sdk/channel-route` का उपयोग करें। Helper
numeric thread ids को उसी तरह normalize करता है जैसे core करता है, इसलिए plugins को ad hoc `String(threadId)` comparisons के बजाय
इसे प्राथमिकता देनी चाहिए।
Provider-विशिष्ट target grammar वाले plugins को
`messaging.resolveOutboundSessionRoute(...)` expose करना चाहिए ताकि core को parser shims का उपयोग किए बिना provider-native
session और thread identity मिल सके।

जिन bundled plugins को channel registry boot होने से पहले वही parsing चाहिए,
वे matching
`resolveSessionConversation(...)` export के साथ top-level `session-key-api.ts` file भी expose कर सकते हैं। Core इस bootstrap-safe surface का उपयोग
सिर्फ तब करता है जब runtime plugin registry अभी उपलब्ध नहीं होती।

`messaging.resolveParentConversationCandidates(...)` legacy compatibility fallback के रूप में उपलब्ध रहता है, जब plugin को generic/raw id के ऊपर
सिर्फ parent fallbacks चाहिए। अगर दोनों hooks मौजूद हैं, तो core पहले
`resolveSessionConversation(...).parentConversationCandidates` का उपयोग करता है और केवल तब
`resolveParentConversationCandidates(...)` पर fallback करता है जब canonical hook
उन्हें omit करता है।

## स्वीकृतियाँ और चैनल क्षमताएँ

अधिकांश चैनल plugins को approval-विशिष्ट code की ज़रूरत नहीं होती।

- कोर समान-चैट `/approve`, साझा अनुमोदन बटन पेलोड, और सामान्य फ़ॉलबैक डिलीवरी का स्वामी है।
- जब चैनल को अनुमोदन-विशिष्ट व्यवहार चाहिए, तो चैनल Plugin पर एक `approvalCapability` ऑब्जेक्ट को प्राथमिकता दें।
- `ChannelPlugin.approvals` हटा दिया गया है। अनुमोदन डिलीवरी/नेटिव/रेंडर/auth तथ्य `approvalCapability` पर रखें।
- `plugin.auth` केवल login/logout है; कोर अब उस ऑब्जेक्ट से अनुमोदन auth हुक नहीं पढ़ता।
- `approvalCapability.authorizeActorAction` और `approvalCapability.getActionAvailabilityState` कैनोनिकल अनुमोदन-auth सीम हैं।
- समान-चैट अनुमोदन auth उपलब्धता के लिए `approvalCapability.getActionAvailabilityState` का उपयोग करें। नेटिव डिलीवरी अक्षम होने पर भी कॉन्फ़िगर किए गए अनुमोदकों को `/approve` के लिए उपलब्ध रखें; इसके बजाय डिलीवरी/setup मार्गदर्शन के लिए नेटिव आरंभिक-सतह स्थिति का उपयोग करें।
- यदि आपका चैनल नेटिव exec अनुमोदन उजागर करता है, तो जब यह समान-चैट अनुमोदन auth से अलग हो, आरंभिक-सतह/नेटिव-क्लाइंट स्थिति के लिए `approvalCapability.getExecInitiatingSurfaceState` का उपयोग करें। कोर उस exec-विशिष्ट हुक का उपयोग `enabled` बनाम `disabled` में अंतर करने, यह तय करने कि आरंभिक चैनल नेटिव exec अनुमोदन का समर्थन करता है या नहीं, और चैनल को नेटिव-क्लाइंट फ़ॉलबैक मार्गदर्शन में शामिल करने के लिए करता है। `createApproverRestrictedNativeApprovalCapability(...)` सामान्य मामले के लिए इसे भरता है।
- चैनल-विशिष्ट पेलोड लाइफ़साइकल व्यवहार, जैसे डुप्लिकेट स्थानीय अनुमोदन प्रॉम्प्ट छिपाना या डिलीवरी से पहले टाइपिंग संकेत भेजना, के लिए `outbound.shouldSuppressLocalPayloadPrompt` या `outbound.beforeDeliverPayload` का उपयोग करें।
- `approvalCapability.delivery` का उपयोग केवल नेटिव अनुमोदन रूटिंग या फ़ॉलबैक दमन के लिए करें।
- चैनल-स्वामित्व वाले नेटिव अनुमोदन तथ्यों के लिए `approvalCapability.nativeRuntime` का उपयोग करें। इसे हॉट चैनल एंट्रीपॉइंट पर `createLazyChannelApprovalNativeRuntimeAdapter(...)` के साथ lazy रखें, जो मांग पर आपके runtime मॉड्यूल को import कर सकता है और फिर भी कोर को अनुमोदन लाइफ़साइकल असेंबल करने देता है।
- `approvalCapability.render` का उपयोग केवल तब करें जब चैनल को साझा रेंडरर के बजाय सचमुच कस्टम अनुमोदन पेलोड चाहिए।
- जब चैनल चाहता है कि disabled-path उत्तर नेटिव exec अनुमोदन सक्षम करने के लिए ज़रूरी सटीक config knobs समझाए, तो `approvalCapability.describeExecApprovalSetup` का उपयोग करें। हुक को `{ channel, channelLabel, accountId }` मिलता है; नामित-अकाउंट चैनलों को शीर्ष-स्तरीय defaults के बजाय `channels.<channel>.accounts.<id>.execApprovals.*` जैसे अकाउंट-स्कोप्ड पथ रेंडर करने चाहिए।
- जब Plugin अनुमोदन no-route और timeout विफलताओं के लिए Plugin अनुमोदन विफलता मार्गदर्शन दिखाना सुरक्षित हो, तो `approvalCapability.describePluginApprovalSetup` का उपयोग करें। `createApproverRestrictedNativeApprovalCapability(...)` इसे `describeExecApprovalSetup` से infer नहीं करता; वही helper स्पष्ट रूप से केवल तब पास करें जब Plugin और exec अनुमोदन सचमुच समान नेटिव setup का उपयोग करते हों।
- यदि कोई चैनल मौजूदा config से स्थिर owner-जैसी DM पहचानों का अनुमान लगा सकता है, तो अनुमोदन-विशिष्ट कोर लॉजिक जोड़े बिना समान-चैट `/approve` को सीमित करने के लिए `openclaw/plugin-sdk/approval-runtime` से `createResolvedApproverActionAuthAdapter` का उपयोग करें।
- यदि कस्टम अनुमोदन auth जानबूझकर केवल समान-चैट फ़ॉलबैक की अनुमति देता है, तो `openclaw/plugin-sdk/approval-auth-runtime` से `markImplicitSameChatApprovalAuthorization({ authorized: true })` लौटाएँ; अन्यथा कोर परिणाम को स्पष्ट अनुमोदक authorization मानता है।
- यदि चैनल-स्वामित्व वाला नेटिव callback अनुमोदनों को सीधे resolve करता है, तो resolve करने से पहले `isImplicitSameChatApprovalAuthorization(...)` का उपयोग करें, ताकि implicit फ़ॉलबैक फिर भी चैनल के सामान्य actor authorization से गुज़रे।
- यदि किसी चैनल को नेटिव अनुमोदन डिलीवरी चाहिए, तो चैनल कोड को target normalization और transport/presentation तथ्यों पर केंद्रित रखें। `openclaw/plugin-sdk/approval-runtime` से `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, और `createApproverRestrictedNativeApprovalCapability` का उपयोग करें। चैनल-विशिष्ट तथ्यों को `approvalCapability.nativeRuntime` के पीछे रखें, आदर्श रूप से `createChannelApprovalNativeRuntimeAdapter(...)` या `createLazyChannelApprovalNativeRuntimeAdapter(...)` के माध्यम से, ताकि कोर handler असेंबल कर सके और request filtering, routing, dedupe, expiry, Gateway subscription, और routed-elsewhere notices का स्वामित्व रख सके। `nativeRuntime` कुछ छोटे seams में विभाजित है:
- जब कोई चैनल session-origin नेटिव डिलीवरी और स्पष्ट अनुमोदन forwarding targets, दोनों का समर्थन करता है, तो `openclaw/plugin-sdk/approval-native-runtime` से `createNativeApprovalChannelRouteGates` का उपयोग करें। helper अनुमोदन config चयन, `mode` handling, agent/session filters, account binding, session-target matching, और target-list matching को केंद्रीकृत करता है, जबकि callers अभी भी channel id, default forwarding mode, account lookup, transport-enabled check, target normalization, और turn-source target resolution के स्वामी रहते हैं। core-owned channel policy defaults बनाने के लिए इसका उपयोग न करें; चैनल का दस्तावेज़ीकृत default mode स्पष्ट रूप से पास करें।
- `createChannelNativeOriginTargetResolver` `{ to, accountId, threadId }` targets के लिए default रूप से shared channel-route matcher का उपयोग करता है। `targetsMatch` केवल तब पास करें जब किसी चैनल के provider-specific equivalence rules हों, जैसे Slack timestamp prefix matching।
- जब चैनल को default route matcher या custom `targetsMatch` callback चलने से पहले provider ids को canonicalize करना हो, और delivery के लिए original target को सुरक्षित रखना हो, तो `createChannelNativeOriginTargetResolver` में `normalizeTargetForMatch` पास करें। `normalizeTarget` का उपयोग केवल तब करें जब resolved delivery target को स्वयं canonicalize किया जाना चाहिए।
- `availability` - क्या अकाउंट configured है और क्या request को handle किया जाना चाहिए
- `presentation` - shared approval view model को pending/resolved/expired नेटिव पेलोड या final actions में map करें
- `transport` - targets तैयार करें और नेटिव अनुमोदन messages भेजें/update/delete करें
- `interactions` - नेटिव buttons या reactions के लिए वैकल्पिक bind/unbind/clear-action hooks, साथ ही वैकल्पिक `cancelDelivered` hook। `cancelDelivered` तब implement करें जब `deliverPending` in-process या persistent state (जैसे reaction target store) register करता हो, ताकि handler stop द्वारा `bindPending` चलने से पहले delivery cancel होने पर या `bindPending` no handle लौटाने पर वह state release की जा सके
- `observe` - वैकल्पिक delivery diagnostics hooks
- यदि चैनल को client, token, Bolt app, या webhook receiver जैसे runtime-owned objects चाहिए, तो उन्हें `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से register करें। generic runtime-context registry कोर को channel startup state से capability-driven handlers bootstrap करने देती है, बिना अनुमोदन-विशिष्ट wrapper glue जोड़े।
- निचले-स्तर के `createChannelApprovalHandler` या `createChannelNativeApprovalRuntime` तक केवल तब पहुँचें जब capability-driven seam अभी पर्याप्त expressive न हो।
- नेटिव अनुमोदन चैनलों को उन helpers के माध्यम से `accountId` और `approvalKind`, दोनों route करने होंगे। `accountId` multi-account approval policy को सही bot account तक scoped रखता है, और `approvalKind` exec बनाम Plugin अनुमोदन व्यवहार को core में hardcoded branches के बिना channel के लिए उपलब्ध रखता है।
- कोर अब approval reroute notices का भी स्वामी है। Channel plugins को `createChannelNativeApprovalRuntime` से अपने "approval went to DMs / another channel" follow-up messages नहीं भेजने चाहिए; इसके बजाय, shared approval capability helpers के माध्यम से accurate origin + approver-DM routing expose करें और initiating chat में कोई notice वापस post करने से पहले core को actual deliveries aggregate करने दें।
- delivered approval id kind को end-to-end सुरक्षित रखें। नेटिव clients को channel-local state से exec बनाम Plugin approval routing का अनुमान लगाना या rewrite नहीं करना चाहिए।
- अलग-अलग approval kinds जानबूझकर अलग नेटिव surfaces expose कर सकते हैं।
  मौजूदा bundled examples:
  - Slack exec और Plugin ids, दोनों के लिए नेटिव approval routing उपलब्ध रखता है।
  - Matrix exec और Plugin approvals के लिए समान नेटिव DM/channel routing और reaction UX रखता है, जबकि auth को approval kind के अनुसार अलग रहने देता है।
- `createApproverRestrictedNativeApprovalAdapter` अभी भी compatibility wrapper के रूप में मौजूद है, लेकिन नए code को capability builder को प्राथमिकता देनी चाहिए और Plugin पर `approvalCapability` expose करना चाहिए।

हॉट चैनल entrypoints के लिए, जब आपको उस family का केवल एक हिस्सा चाहिए, तो संकरे runtime subpaths को प्राथमिकता दें:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

इसी तरह, जब आपको व्यापक umbrella surface की ज़रूरत न हो, तो
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, और
`openclaw/plugin-sdk/reply-chunking` को प्राथमिकता दें।

विशेष रूप से setup के लिए:

- `openclaw/plugin-sdk/setup-runtime` runtime-safe setup helpers को cover करता है:
  `createSetupTranslator`, import-safe setup patch adapters (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries`, और delegated
  setup-proxy builders
- `openclaw/plugin-sdk/setup-runtime` में
  `createEnvPatchedAccountSetupAdapter` के लिए env-aware adapter seam शामिल है
- `openclaw/plugin-sdk/channel-setup` optional-install setup
  builders और कुछ setup-safe primitives को cover करता है:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

यदि आपका चैनल env-driven setup या auth का समर्थन करता है और generic startup/config
flows को runtime load होने से पहले उन env names को जानना चाहिए, तो उन्हें
Plugin manifest में `channelEnvVars` के साथ declare करें। channel runtime `envVars` या local
constants को केवल operator-facing copy के लिए रखें।

यदि आपका चैनल Plugin runtime शुरू होने से पहले `status`, `channels list`, `channels status`, या
SecretRef scans में दिखाई दे सकता है, तो `package.json` में `openclaw.setupEntry` जोड़ें। वह entrypoint read-only command
paths में import करने के लिए सुरक्षित होना चाहिए और उसे उन summaries के लिए ज़रूरी channel metadata, setup-safe config adapter, status
adapter, और channel secret target metadata लौटाना चाहिए। setup entry से clients, listeners, या transport runtimes शुरू न करें।

मुख्य channel entry import path को भी संकरा रखें। Discovery channel को activate किए बिना capabilities register करने के लिए entry और channel plugin module को evaluate कर सकता है। `channel-plugin-api.ts` जैसी files को setup wizards, transport clients, socket
listeners, subprocess launchers, या service startup modules import किए बिना channel
Plugin object export करना चाहिए। उन runtime
pieces को `registerFull(...)`, runtime setters, या lazy
capability adapters से loaded modules में रखें।

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, और
`splitSetupEntries`

- व्यापक `openclaw/plugin-sdk/setup` seam का उपयोग केवल तब करें जब आपको
  `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे भारी shared setup/config helpers भी चाहिए हों

यदि आपका चैनल setup surfaces में केवल "पहले यह Plugin install करें" advertise करना चाहता है, तो `createOptionalChannelSetupSurface(...)` को प्राथमिकता दें। generated
adapter/wizard config writes और finalization पर fail closed करते हैं, और वे validation, finalize, और docs-link
copy में वही install-required message reuse करते हैं।

अन्य हॉट channel paths के लिए, व्यापक legacy
surfaces के बजाय narrow helpers को प्राथमिकता दें:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, और
  `openclaw/plugin-sdk/account-helpers` बहु-खाता कॉन्फ़िग और
  डिफ़ॉल्ट-खाता फ़ॉलबैक के लिए
- `openclaw/plugin-sdk/inbound-envelope` और
  `openclaw/plugin-sdk/channel-inbound` आवक route/envelope और
  record-and-dispatch वायरिंग के लिए
- `openclaw/plugin-sdk/channel-targets` लक्ष्य पार्सिंग हेल्पर के लिए
- `openclaw/plugin-sdk/outbound-media` मीडिया लोडिंग के लिए और
  `openclaw/plugin-sdk/channel-outbound` जावक पहचान/भेजने वाले डेलिगेट
  और payload योजना के लिए
- `openclaw/plugin-sdk/channel-core` से `buildThreadAwareOutboundSessionRoute(...)`
  जब किसी जावक route को स्पष्ट `replyToId`/`threadId` सुरक्षित रखना हो या
  base session key के अब भी मेल खाने के बाद मौजूदा `:thread:` session को
  पुनर्प्राप्त करना हो। Provider plugins precedence, suffix व्यवहार, और thread id
  normalization को override कर सकते हैं, जब उनके platform में native thread delivery semantics हों।
- `openclaw/plugin-sdk/thread-bindings-runtime` thread-binding lifecycle
  और adapter registration के लिए
- `openclaw/plugin-sdk/agent-media-payload` केवल तब, जब legacy agent/media
  payload field layout अब भी आवश्यक हो
- `openclaw/plugin-sdk/telegram-command-config` Telegram custom-command
  normalization, duplicate/conflict validation, और fallback-stable command
  config contract के लिए

केवल-auth चैनल आम तौर पर default path पर रुक सकते हैं: core approvals संभालता है और Plugin केवल outbound/auth capabilities उजागर करता है। Matrix, Slack, Telegram, और custom chat transports जैसे native approval channels को अपनी approval lifecycle बनाने के बजाय साझा native helpers का उपयोग करना चाहिए।

## आवक mention नीति

आवक mention handling को दो layers में विभाजित रखें:

- Plugin-स्वामित्व वाला evidence gathering
- साझा policy evaluation

mention-policy निर्णयों के लिए `openclaw/plugin-sdk/channel-mention-gating` का उपयोग करें।
`openclaw/plugin-sdk/channel-inbound` का उपयोग केवल तब करें जब आपको व्यापक inbound
helper barrel की आवश्यकता हो।

Plugin-local logic के लिए अच्छा विकल्प:

- reply-to-bot detection
- quoted-bot detection
- thread-participation checks
- service/system-message exclusions
- bot participation साबित करने के लिए आवश्यक platform-native caches

साझा helper के लिए अच्छा विकल्प:

- `requireMention`
- explicit mention result
- implicit mention allowlist
- command bypass
- final skip decision

पसंदीदा flow:

1. local mention facts compute करें।
2. उन facts को `resolveInboundMentionDecision({ facts, policy })` में पास करें।
3. अपने inbound gate में `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, और `decision.shouldSkip` का उपयोग करें।

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

`api.runtime.channel.mentions` उन्हीं साझा mention helpers को उन
bundled channel plugins के लिए उजागर करता है जो पहले से runtime injection पर निर्भर हैं:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

यदि आपको केवल `implicitMentionKindWhen` और
`resolveInboundMentionDecision` चाहिए, तो असंबंधित inbound
runtime helpers लोड करने से बचने के लिए
`openclaw/plugin-sdk/channel-mention-gating` से import करें।

mention gating के लिए `resolveInboundMentionDecision({ facts, policy })` का उपयोग करें।

## वॉकथ्रू

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package और manifest">
    मानक Plugin files बनाएँ। `package.json` में `channel` field ही
    इसे channel Plugin बनाता है। पूरे package-metadata surface के लिए,
    [Plugin Setup और Config](/hi/plugins/sdk-setup#openclaw-channel) देखें:

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

    `configSchema` `plugins.entries.acme-chat.config` को validate करता है। इसे
    Plugin-स्वामित्व वाली उन settings के लिए उपयोग करें जो channel account config नहीं हैं। `channelConfigs`
    `channels.acme-chat` को validate करता है और वह cold-path source है जिसे config
    schema, setup, और UI surfaces Plugin runtime लोड होने से पहले उपयोग करते हैं।

  </Step>

  <Step title="Channel Plugin object बनाएँ">
    `ChannelPlugin` interface में कई optional adapter surfaces हैं। न्यूनतम
    - `id` और `setup` - से शुरू करें और जैसे आवश्यकता हो adapters जोड़ें।

    `src/channel.ts` बनाएँ:

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

    ऐसे channels के लिए जो canonical top-level DM keys और legacy nested keys दोनों स्वीकार करते हैं, `plugin-sdk/channel-config-helpers` से helpers का उपयोग करें: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, और `normalizeChannelDmPolicy` account-local values को inherited root values से आगे रखते हैं। उसी resolver को `normalizeLegacyDmAliases` के माध्यम से doctor repair के साथ pair करें ताकि runtime और migration समान contract पढ़ें।

    <Accordion title="createChatChannelPlugin आपके लिए क्या करता है">
      low-level adapter interfaces को मैन्युअल रूप से implement करने के बजाय, आप
      declarative options पास करते हैं और builder उन्हें compose करता है:

      | विकल्प | यह क्या वायर करता है |
      | --- | --- |
      | `security.dm` | config fields से scoped DM security resolver |
      | `pairing.text` | code exchange के साथ text-based DM pairing flow |
      | `threading` | Reply-to-mode resolver (fixed, account-scoped, या custom) |
      | `outbound.attachedResults` | result metadata (message IDs) लौटाने वाले send functions |

      यदि आपको पूरा control चाहिए, तो आप declarative options के बजाय raw adapter objects
      भी पास कर सकते हैं।

      Raw outbound adapters एक `chunker(text, limit, ctx)` function define कर सकते हैं।
      optional `ctx.formatting` delivery-time formatting decisions जैसे
      `maxLinesPerMessage` रखता है; भेजने से पहले इसे apply करें ताकि reply threading
      और chunk boundaries shared outbound delivery द्वारा एक बार resolve हों।
      Send contexts में native reply target resolve होने पर `replyToIdSource` (`implicit` या `explicit`)
      भी शामिल होता है, ताकि payload helpers implicit single-use reply slot consume किए बिना
      explicit reply tags सुरक्षित रख सकें।
    </Accordion>

  </Step>

  <Step title="Entry point वायर करें">
    `index.ts` बनाएँ:

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

    चैनल-स्वामित्व वाले CLI वर्णनकर्ताओं को `registerCliMetadata(...)` में रखें ताकि OpenClaw
    पूरे चैनल रनटाइम को सक्रिय किए बिना उन्हें रूट सहायता में दिखा सके,
    जबकि सामान्य पूर्ण लोड वास्तविक कमांड पंजीकरण के लिए वही वर्णनकर्ता अब भी उठा लें।
    रनटाइम-केवल काम के लिए `registerFull(...)` रखें।
    यदि `registerFull(...)` Gateway RPC विधियां पंजीकृत करता है, तो
    Plugin-विशिष्ट उपसर्ग का उपयोग करें। कोर एडमिन नेमस्पेस (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) आरक्षित रहते हैं और हमेशा
    `operator.admin` पर रिजॉल्व होते हैं।
    `defineChannelPluginEntry` पंजीकरण-मोड विभाजन को अपने आप संभालता है। सभी
    विकल्पों के लिए [एंट्री पॉइंट](/hi/plugins/sdk-entrypoints#definechannelpluginentry) देखें।

  </Step>

  <Step title="Add a setup entry">
    ऑनबोर्डिंग के दौरान हल्के लोडिंग के लिए `setup-entry.ts` बनाएं:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    जब चैनल अक्षम या अनकन्फिगर हो, तो OpenClaw पूर्ण एंट्री के बजाय इसे लोड करता है।
    यह सेटअप फ्लो के दौरान भारी रनटाइम कोड खींचने से बचाता है।
    विवरण के लिए [सेटअप और कॉन्फिग](/hi/plugins/sdk-setup#setup-entry) देखें।

    बंडल किए गए वर्कस्पेस चैनल, जो सेटअप-सुरक्षित एक्सपोर्ट को साइडकार
    मॉड्यूल में विभाजित करते हैं, `openclaw/plugin-sdk/channel-entry-contract` से
    `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं, जब उन्हें
    स्पष्ट सेटअप-समय रनटाइम सेटर की भी जरूरत हो।

  </Step>

  <Step title="Handle inbound messages">
    आपके Plugin को प्लेटफॉर्म से संदेश प्राप्त करके उन्हें
    OpenClaw को आगे भेजना होगा। सामान्य पैटर्न एक Webhook है जो अनुरोध सत्यापित करता है और
    उसे आपके चैनल के इनबाउंड हैंडलर के माध्यम से डिस्पैच करता है:

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
      इनबाउंड संदेश हैंडलिंग चैनल-विशिष्ट है। हर चैनल Plugin अपनी
      इनबाउंड पाइपलाइन का स्वामी होता है। वास्तविक पैटर्न के लिए बंडल किए गए चैनल Plugins
      (उदाहरण के लिए Microsoft Teams या Google Chat Plugin पैकेज) देखें।
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
`src/channel.test.ts` में सह-स्थित टेस्ट लिखें:

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

    साझा टेस्ट हेल्पर के लिए, [टेस्टिंग](/hi/plugins/sdk-testing) देखें।

</Step>
</Steps>

## फाइल संरचना

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

## उन्नत विषय

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/hi/plugins/sdk-entrypoints#registration-mode">
    स्थिर, खाता-स्कोप वाले, या कस्टम उत्तर मोड
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/hi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool और एक्शन खोज
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/hi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/hi/plugins/sdk-runtime">
    TTS, STT, मीडिया, api.runtime के माध्यम से सबएजेंट
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/hi/plugins/sdk-channel-inbound">
    साझा इनबाउंड इवेंट जीवनचक्र: इनजेस्ट, रिजॉल्व, रिकॉर्ड, डिस्पैच, फाइनलाइज
  </Card>
</CardGroup>

<Note>
कुछ बंडल किए गए हेल्पर सीम अब भी बंडल किए गए Plugin रखरखाव और
संगतता के लिए मौजूद हैं। वे नए चैनल Plugins के लिए अनुशंसित पैटर्न नहीं हैं;
जब तक आप उस बंडल किए गए Plugin परिवार का सीधे रखरखाव नहीं कर रहे हैं, सामान्य SDK
सतह से जेनेरिक चैनल/सेटअप/रिप्लाई/रनटाइम उपपथों को प्राथमिकता दें।
</Note>

## अगले चरण

- [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins) - यदि आपका Plugin मॉडल भी प्रदान करता है
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूर्ण उपपथ इंपोर्ट संदर्भ
- [SDK टेस्टिंग](/hi/plugins/sdk-testing) - टेस्ट यूटिलिटी और कॉन्ट्रैक्ट टेस्ट
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) - पूर्ण मैनिफेस्ट स्कीमा

## संबंधित

- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
- [एजेंट हार्नेस Plugins](/hi/plugins/sdk-agent-harness)
