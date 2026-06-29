---
read_when:
    - आप एक नया मैसेजिंग चैनल Plugin बना रहे हैं
    - आप OpenClaw को किसी मैसेजिंग प्लेटफ़ॉर्म से कनेक्ट करना चाहते हैं
    - आपको ChannelPlugin एडाप्टर सतह को समझना होगा
sidebarTitle: Channel Plugins
summary: OpenClaw के लिए messaging channel Plugin बनाने की चरण-दर-चरण मार्गदर्शिका
title: चैनल Plugin बनाना
x-i18n:
    generated_at: "2026-06-28T23:52:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

यह गाइड OpenClaw को किसी मैसेजिंग प्लेटफ़ॉर्म से जोड़ने वाला channel plugin बनाने की प्रक्रिया समझाती है। अंत तक आपके पास DM सुरक्षा, pairing, reply threading, और outbound messaging वाला काम करता हुआ channel होगा।

<Info>
  यदि आपने पहले कोई OpenClaw plugin नहीं बनाया है, तो basic package
  structure और manifest setup के लिए पहले
  [शुरू करना](/hi/plugins/building-plugins) पढ़ें।
</Info>

## Channel plugins कैसे काम करते हैं

Channel plugins को अपने send/edit/react tools की ज़रूरत नहीं होती। OpenClaw core में एक shared `message` tool रखता है। आपका plugin इनका मालिक होता है:

- **Config** - account resolution और setup wizard
- **Security** - DM policy और allowlists
- **Pairing** - DM approval flow
- **Session grammar** - provider-specific conversation ids को base chats, thread ids, और parent fallbacks से कैसे map किया जाता है
- **Outbound** - प्लेटफ़ॉर्म पर text, media, और polls भेजना
- **Threading** - replies को कैसे thread किया जाता है
- **Heartbeat typing** - heartbeat delivery targets के लिए optional typing/busy signals

Core shared message tool, prompt wiring, outer session-key shape, generic `:thread:` bookkeeping, और dispatch का मालिक होता है।

नए channel plugins को `openclaw/plugin-sdk/channel-outbound` से
`defineChannelMessageAdapter` के साथ एक `message` adapter भी expose करना चाहिए। adapter यह declare करता है कि native transport वास्तव में कौन-सी durable final-send capabilities support करता है और text/media sends को legacy `outbound` adapter जैसी ही transport functions की ओर point करता है। capability केवल तब declare करें जब कोई contract test native side effect और returned receipt को prove करे।
पूरा API contract, examples, capability matrix, receipt rules, live
preview finalization, receive ack policy, tests, और migration table के लिए
[Channel outbound API](/hi/plugins/sdk-channel-outbound) देखें।
यदि मौजूदा `outbound` adapter में पहले से सही send methods और
capability metadata है, तो एक और bridge हाथ से लिखने के बजाय
`createChannelMessageAdapterFromOutbound(...)` का उपयोग करके
`message` adapter derive करें।
Adapter sends को `MessageReceipt` values return करनी चाहिए। जब compatibility code को अभी भी legacy ids की ज़रूरत हो, तो नए lifecycle code में parallel `messageIds` fields रखने के बजाय उन्हें `listMessageReceiptPlatformIds(...)`
या `resolveMessageReceiptPrimaryId(...)` से derive करें।
Preview-capable channels को `message.live.capabilities` भी declare करनी चाहिए, exact live lifecycle के साथ जिसका वे ownership रखते हैं, जैसे `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, या
`quietFinalization`। जो channels draft preview को उसी जगह finalize करते हैं, उन्हें `message.live.finalizer.capabilities` भी declare करनी चाहिए, जैसे `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, और
`retainOnAmbiguousFailure`, और runtime logic को
`defineFinalizableLivePreviewAdapter(...)` तथा
`deliverWithFinalizableLivePreviewAdapter(...)` से route करना चाहिए। इन capabilities को `verifyChannelMessageLiveCapabilityAdapterProofs(...)` और
`verifyChannelMessageLiveFinalizerProofs(...)` tests से backed रखें, ताकि native preview,
progress, edit, fallback/retention, cleanup, और receipt behavior चुपचाप drift न हो सके।
Inbound receivers जो platform acknowledgements defer करते हैं, उन्हें monitor-local state में ack timing छिपाने के बजाय
`message.receive.defaultAckPolicy` और `supportedAckPolicies` declare करनी चाहिए। हर declared policy को
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` से cover करें।

Legacy reply helpers जैसे `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, और `recordInboundSessionAndDispatchReply`
compatibility dispatchers के लिए उपलब्ध रहते हैं। नए channel code के लिए इन names का उपयोग न करें; नए plugins को `message` adapter, receipts, और
`openclaw/plugin-sdk/channel-outbound` पर receive/send lifecycle helpers से शुरू करना चाहिए।

Inbound authorization migrate करने वाले channels runtime receive
paths से experimental `openclaw/plugin-sdk/channel-ingress-runtime` subpath का उपयोग कर सकते हैं। subpath platform lookup और side effects को plugin में रखता है, जबकि allowlist state resolution, route/sender/command/event/activation
decisions, redacted diagnostics, और turn-admission mapping share करता है। Resolver को दिए गए descriptor में plugin identity normalization रखें; resolved state या decision से raw match values serialize न करें। API design,
ownership boundary, और test expectations के लिए
[Channel ingress API](/hi/plugins/sdk-channel-ingress) देखें।

यदि आपका channel inbound replies के बाहर typing indicators support करता है, तो channel plugin पर
`heartbeat.sendTyping(...)` expose करें। Core heartbeat model run शुरू होने से पहले resolved heartbeat delivery target के साथ इसे call करता है और shared typing keepalive/cleanup lifecycle का उपयोग करता है। जब platform को explicit stop signal चाहिए, तो `heartbeat.clearTyping(...)` जोड़ें।

यदि आपका channel media sources carry करने वाले message-tool params जोड़ता है, तो उन
param names को `describeMessageTool(...).mediaSourceParams` के ज़रिए expose करें। Core sandbox path normalization और outbound media-access
policy के लिए उस explicit list का उपयोग करता है, इसलिए plugins को provider-specific
avatar, attachment, या cover-image params के लिए shared-core special cases की ज़रूरत नहीं होती।
`{ "set-profile": ["avatarUrl", "avatarPath"] }` जैसे action-keyed map को return करना prefer करें, ताकि unrelated actions किसी दूसरे action के media args inherit न करें। Flat array उन params के लिए अब भी काम करता है जो हर exposed action में जानबूझकर shared हैं।
जिन channels को platform-side media fetch के लिए temporary public URL expose करना पड़ता है, वे plugin state stores के साथ
`openclaw/plugin-sdk/outbound-media` से `createHostedOutboundMediaStore(...)` का उपयोग कर सकते हैं। Platform route parsing और token enforcement को channel plugin में रखें; shared helper केवल media loading, expiry metadata, chunk rows, और cleanup का मालिक होता है।

यदि आपके channel को `message(action="send")` के लिए provider-specific shaping की ज़रूरत है, तो
`actions.prepareSendPayload(...)` prefer करें। Native cards, blocks, embeds, या
अन्य durable data को `payload.channelData.<channel>` के अंतर्गत रखें और core को outbound/message adapter के ज़रिए actual send करने दें। `actions.handleAction(...)` को send के लिए केवल उन payloads के compatibility fallback के रूप में उपयोग करें जिन्हें serialize और retry नहीं किया जा सकता।

यदि आपका platform conversation ids के अंदर extra scope store करता है, तो वह parsing plugin में
`messaging.resolveSessionConversation(...)` के साथ रखें। यही `rawId` को base conversation id, optional thread
id, explicit `baseConversationId`, और किसी भी `parentConversationCandidates` से map करने वाला canonical hook है।
जब आप `parentConversationCandidates` return करें, तो उन्हें सबसे narrow parent से broadest/base conversation तक ordered रखें।

जब plugin code को route-like fields normalize करने हों, child thread की उसके parent route से तुलना करनी हो, या `{ channel, to, accountId, threadId }` से stable dedupe key बनानी हो, तो
`openclaw/plugin-sdk/channel-route` का उपयोग करें। Helper numeric thread ids को उसी तरह normalize करता है जैसे core करता है, इसलिए plugins को ad hoc `String(threadId)` comparisons के बजाय इसे prefer करना चाहिए।
Provider-specific target grammar वाले plugins को
`messaging.resolveOutboundSessionRoute(...)` expose करना चाहिए, ताकि core को parser shims का उपयोग किए बिना provider-native
session और thread identity मिले।

Bundled plugins जिन्हें channel registry boot होने से पहले वही parsing चाहिए, वे matching
`resolveSessionConversation(...)` export के साथ top-level `session-key-api.ts` file भी expose कर सकते हैं। Core उस bootstrap-safe surface का उपयोग केवल तब करता है जब runtime plugin registry अभी उपलब्ध नहीं होती।

`messaging.resolveParentConversationCandidates(...)` legacy compatibility fallback के रूप में उपलब्ध रहता है, जब किसी plugin को generic/raw id के ऊपर केवल parent fallbacks चाहिए हों। यदि दोनों hooks मौजूद हैं, तो core पहले
`resolveSessionConversation(...).parentConversationCandidates` का उपयोग करता है और canonical hook उन्हें omit करने पर ही
`resolveParentConversationCandidates(...)` पर fallback करता है।

## Approvals और channel capabilities

अधिकांश channel plugins को approval-specific code की ज़रूरत नहीं होती।

- कोर same-chat `/approve`, साझा अनुमोदन बटन पेलोड, और सामान्य फॉलबैक डिलीवरी का मालिक है।
- जब चैनल को अनुमोदन-विशिष्ट व्यवहार चाहिए, तो चैनल Plugin पर एक `approvalCapability` ऑब्जेक्ट को प्राथमिकता दें।
- `ChannelPlugin.approvals` हटा दिया गया है। अनुमोदन डिलीवरी/native/render/auth तथ्यों को `approvalCapability` पर रखें।
- `plugin.auth` केवल login/logout है; कोर अब उस ऑब्जेक्ट से अनुमोदन auth hooks नहीं पढ़ता।
- `approvalCapability.authorizeActorAction` और `approvalCapability.getActionAvailabilityState` कैनॉनिकल approval-auth seam हैं।
- same-chat अनुमोदन auth उपलब्धता के लिए `approvalCapability.getActionAvailabilityState` का उपयोग करें।
- यदि आपका चैनल native exec अनुमोदन दिखाता है, तो initiating-surface/native-client स्थिति के लिए `approvalCapability.getExecInitiatingSurfaceState` का उपयोग करें, जब वह same-chat अनुमोदन auth से अलग हो। कोर उस exec-विशिष्ट hook का उपयोग `enabled` बनाम `disabled` में अंतर करने, यह तय करने कि initiating चैनल native exec अनुमोदन का समर्थन करता है या नहीं, और चैनल को native-client फॉलबैक मार्गदर्शन में शामिल करने के लिए करता है। `createApproverRestrictedNativeApprovalCapability(...)` सामान्य मामले के लिए इसे भर देता है।
- चैनल-विशिष्ट पेलोड लाइफसाइकिल व्यवहार के लिए `outbound.shouldSuppressLocalPayloadPrompt` या `outbound.beforeDeliverPayload` का उपयोग करें, जैसे डुप्लिकेट स्थानीय अनुमोदन प्रॉम्प्ट छिपाना या डिलीवरी से पहले typing indicators भेजना।
- `approvalCapability.delivery` का उपयोग केवल native अनुमोदन रूटिंग या फॉलबैक suppression के लिए करें।
- चैनल-स्वामित्व वाले native अनुमोदन तथ्यों के लिए `approvalCapability.nativeRuntime` का उपयोग करें। इसे hot चैनल entrypoints पर `createLazyChannelApprovalNativeRuntimeAdapter(...)` के साथ lazy रखें, जो मांग पर आपका runtime मॉड्यूल import कर सकता है और फिर भी कोर को अनुमोदन lifecycle assemble करने देता है।
- `approvalCapability.render` का उपयोग केवल तब करें जब किसी चैनल को साझा renderer की जगह सच में custom अनुमोदन पेलोड चाहिए।
- `approvalCapability.describeExecApprovalSetup` का उपयोग तब करें जब चैनल चाहता है कि disabled-path reply native exec अनुमोदन सक्षम करने के लिए जरूरी सटीक config knobs समझाए। hook को `{ channel, channelLabel, accountId }` मिलता है; named-account चैनलों को top-level defaults की जगह `channels.<channel>.accounts.<id>.execApprovals.*` जैसे account-scoped paths render करने चाहिए।
- यदि कोई चैनल मौजूदा config से स्थिर owner-जैसी DM identities infer कर सकता है, तो approval-विशिष्ट कोर logic जोड़े बिना same-chat `/approve` को restrict करने के लिए `openclaw/plugin-sdk/approval-runtime` से `createResolvedApproverActionAuthAdapter` का उपयोग करें।
- यदि custom अनुमोदन auth जानबूझकर केवल same-chat फॉलबैक की अनुमति देता है, तो `openclaw/plugin-sdk/approval-auth-runtime` से `markImplicitSameChatApprovalAuthorization({ authorized: true })` लौटाएं; अन्यथा कोर परिणाम को explicit approver authorization मानता है।
- यदि चैनल-स्वामित्व वाला native callback अनुमोदन सीधे resolve करता है, तो resolve करने से पहले `isImplicitSameChatApprovalAuthorization(...)` का उपयोग करें ताकि implicit फॉलबैक अब भी चैनल के सामान्य actor authorization से होकर जाए।
- यदि किसी चैनल को native अनुमोदन डिलीवरी चाहिए, तो चैनल कोड को target normalization और transport/presentation facts पर केंद्रित रखें। `openclaw/plugin-sdk/approval-runtime` से `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, और `createApproverRestrictedNativeApprovalCapability` का उपयोग करें। चैनल-विशिष्ट तथ्यों को `approvalCapability.nativeRuntime` के पीछे रखें, आदर्श रूप से `createChannelApprovalNativeRuntimeAdapter(...)` या `createLazyChannelApprovalNativeRuntimeAdapter(...)` के जरिए, ताकि कोर handler assemble कर सके और request filtering, routing, dedupe, expiry, Gateway subscription, और routed-elsewhere notices का मालिक रहे। `nativeRuntime` कुछ छोटे seams में विभाजित है:
- जब कोई चैनल session-origin native delivery और explicit approval forwarding targets दोनों का समर्थन करता है, तो `openclaw/plugin-sdk/approval-native-runtime` से `createNativeApprovalChannelRouteGates` का उपयोग करें। helper approval config selection, `mode` handling, agent/session filters, account binding, session-target matching, और target-list matching को centralize करता है, जबकि callers अभी भी channel id, default forwarding mode, account lookup, transport-enabled check, target normalization, और turn-source target resolution के मालिक रहते हैं। core-owned channel policy defaults बनाने के लिए इसका उपयोग न करें; चैनल का documented default mode स्पष्ट रूप से pass करें।
- `createChannelNativeOriginTargetResolver` `{ to, accountId, threadId }` targets के लिए default रूप से साझा channel-route matcher का उपयोग करता है। `targetsMatch` केवल तब pass करें जब चैनल के पास provider-specific equivalence rules हों, जैसे Slack timestamp prefix matching।
- जब चैनल को default route matcher या custom `targetsMatch` callback चलने से पहले provider ids canonicalize करने हों, और delivery के लिए मूल target बनाए रखना हो, तो `createChannelNativeOriginTargetResolver` को `normalizeTargetForMatch` pass करें। `normalizeTarget` का उपयोग केवल तब करें जब resolved delivery target को ही canonicalize किया जाना चाहिए।
- `availability` - account configured है या नहीं और request handle होनी चाहिए या नहीं
- `presentation` - साझा अनुमोदन view model को pending/resolved/expired native payloads या final actions में map करें
- `transport` - targets prepare करें और native अनुमोदन messages send/update/delete करें
- `interactions` - native buttons या reactions के लिए optional bind/unbind/clear-action hooks, साथ ही optional `cancelDelivered` hook। `cancelDelivered` तब implement करें जब `deliverPending` in-process या persistent state register करता है (जैसे reaction target store), ताकि यदि handler stop `bindPending` चलने से पहले delivery cancel कर दे या जब `bindPending` कोई handle न लौटाए, तो वह state release की जा सके
- `observe` - optional delivery diagnostics hooks
- यदि चैनल को client, token, Bolt app, या webhook receiver जैसे runtime-owned objects चाहिए, तो उन्हें `openclaw/plugin-sdk/channel-runtime-context` के जरिए register करें। generic runtime-context registry कोर को approval-विशिष्ट wrapper glue जोड़े बिना channel startup state से capability-driven handlers bootstrap करने देती है।
- lower-level `createChannelApprovalHandler` या `createChannelNativeApprovalRuntime` की ओर केवल तब जाएं जब capability-driven seam अभी पर्याप्त expressive न हो।
- native अनुमोदन चैनलों को उन helpers के जरिए `accountId` और `approvalKind` दोनों route करने होंगे। `accountId` multi-account अनुमोदन policy को सही bot account तक scoped रखता है, और `approvalKind` exec बनाम plugin अनुमोदन व्यवहार को कोर में hardcoded branches के बिना चैनल के लिए उपलब्ध रखता है।
- कोर अब approval reroute notices का भी मालिक है। चैनल Plugins को `createChannelNativeApprovalRuntime` से अपने "approval went to DMs / another channel" follow-up messages नहीं भेजने चाहिए; इसके बजाय, shared approval capability helpers के जरिए accurate origin + approver-DM routing expose करें और initiating chat में कोई notice post करने से पहले कोर को actual deliveries aggregate करने दें।
- delivered approval id kind को end-to-end preserve करें। native clients को channel-local state से exec बनाम plugin approval routing का
  अनुमान लगाना या rewrite नहीं करना चाहिए।
- अलग-अलग approval kinds जानबूझकर अलग native surfaces expose कर सकते हैं।
  वर्तमान bundled उदाहरण:
  - Slack exec और plugin ids दोनों के लिए native approval routing उपलब्ध रखता है।
  - Matrix exec और plugin approvals के लिए वही native DM/channel routing और reaction UX रखता है,
    जबकि auth को approval kind के अनुसार अलग रहने देता है।
- `createApproverRestrictedNativeApprovalAdapter` अब भी compatibility wrapper के रूप में मौजूद है, लेकिन नए code को capability builder को प्राथमिकता देनी चाहिए और Plugin पर `approvalCapability` expose करना चाहिए।

hot चैनल entrypoints के लिए, जब आपको उस family का केवल एक हिस्सा चाहिए, तो narrower runtime subpaths को प्राथमिकता दें:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

इसी तरह, जब आपको broader umbrella surface की जरूरत न हो, तो
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, और
`openclaw/plugin-sdk/reply-chunking` को प्राथमिकता दें।

setup के लिए विशेष रूप से:

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
Plugin manifest में `channelEnvVars` के साथ declare करें। operator-facing copy के लिए ही चैनल runtime `envVars` या local
constants रखें।

यदि आपका चैनल Plugin runtime शुरू होने से पहले `status`, `channels list`, `channels status`, या
SecretRef scans में दिख सकता है, तो
`package.json` में `openclaw.setupEntry` जोड़ें। वह entrypoint read-only command
paths में import करने के लिए safe होना चाहिए और उन summaries के लिए जरूरी channel metadata, setup-safe config adapter, status
adapter, और channel secret target metadata लौटाना चाहिए। setup entry से
clients, listeners, या transport runtimes शुरू न करें।

main चैनल entry import path को भी narrow रखें। Discovery चैनल activate किए बिना capabilities register करने के लिए
entry और channel Plugin module evaluate कर सकता है।
`channel-plugin-api.ts` जैसी files को setup wizards, transport clients, socket
listeners, subprocess launchers, या service startup modules import किए बिना channel
Plugin object export करना चाहिए। उन runtime
pieces को `registerFull(...)`, runtime setters, या lazy
capability adapters से loaded modules में रखें।

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, और
`splitSetupEntries`

- broader `openclaw/plugin-sdk/setup` seam का उपयोग केवल तब करें जब आपको
  `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे
  भारी shared setup/config helpers भी चाहिए

यदि आपका चैनल setup surfaces में केवल "install this plugin first" advertise करना चाहता है,
तो `createOptionalChannelSetupSurface(...)` को प्राथमिकता दें। generated
adapter/wizard config writes और finalization पर fail closed करते हैं, और वे validation, finalize, और docs-link
copy में वही install-required message reuse करते हैं।

अन्य hot चैनल paths के लिए, broader legacy
surfaces की जगह narrow helpers को प्राथमिकता दें:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, और
  `openclaw/plugin-sdk/account-helpers` मल्टी-अकाउंट कॉन्फ़िग और
  डिफ़ॉल्ट-अकाउंट फ़ॉलबैक के लिए
- `openclaw/plugin-sdk/inbound-envelope` और
  `openclaw/plugin-sdk/channel-inbound` इनबाउंड रूट/एनवेलप और
  रिकॉर्ड-और-डिस्पैच वायरिंग के लिए
- `openclaw/plugin-sdk/channel-targets` टार्गेट पार्सिंग हेल्पर के लिए
- `openclaw/plugin-sdk/outbound-media` मीडिया लोडिंग के लिए और
  `openclaw/plugin-sdk/channel-outbound` आउटबाउंड पहचान/सेंड डेलिगेट और
  पेलोड प्लानिंग के लिए
- `openclaw/plugin-sdk/channel-core` से `buildThreadAwareOutboundSessionRoute(...)`, जब किसी आउटबाउंड रूट को
  स्पष्ट `replyToId`/`threadId` सुरक्षित रखना हो या बेस सेशन कुंजी अब भी मेल खाने के बाद मौजूदा `:thread:` सेशन
  फिर से प्राप्त करना हो। Provider Plugin अपने प्लेटफ़ॉर्म में नेटिव थ्रेड डिलीवरी सेमांटिक्स होने पर
  प्रीसिडेंस, सफ़िक्स व्यवहार, और थ्रेड id नॉर्मलाइज़ेशन को ओवरराइड कर सकते हैं।
- `openclaw/plugin-sdk/thread-bindings-runtime` थ्रेड-बाइंडिंग लाइफ़साइकल
  और एडॉप्टर रजिस्ट्रेशन के लिए
- `openclaw/plugin-sdk/agent-media-payload` केवल तब जब पुराना एजेंट/मीडिया
  पेलोड फ़ील्ड लेआउट अब भी आवश्यक हो
- `openclaw/plugin-sdk/telegram-command-config` Telegram कस्टम-कमांड
  नॉर्मलाइज़ेशन, डुप्लिकेट/कॉनफ़्लिक्ट वैलिडेशन, और फ़ॉलबैक-स्थिर कमांड
  कॉन्फ़िग कॉन्ट्रैक्ट के लिए

सिर्फ़-ऑथ चैनल आम तौर पर डिफ़ॉल्ट पाथ पर रुक सकते हैं: कोर approvals संभालता है और Plugin केवल आउटबाउंड/ऑथ क्षमताएं उजागर करता है। Matrix, Slack, Telegram, और कस्टम चैट ट्रांसपोर्ट जैसे नेटिव approval चैनल को अपना approval लाइफ़साइकल खुद बनाने के बजाय साझा नेटिव हेल्पर इस्तेमाल करने चाहिए।

## इनबाउंड मेंशन नीति

इनबाउंड मेंशन हैंडलिंग को दो लेयर में विभाजित रखें:

- Plugin-स्वामित्व वाला एविडेंस संग्रह
- साझा नीति मूल्यांकन

मेंशन-नीति निर्णयों के लिए `openclaw/plugin-sdk/channel-mention-gating` का उपयोग करें।
व्यापक इनबाउंड हेल्पर बैरल की आवश्यकता होने पर ही
`openclaw/plugin-sdk/channel-inbound` का उपयोग करें।

Plugin-स्थानीय लॉजिक के लिए अच्छा विकल्प:

- reply-to-bot पहचान
- quoted-bot पहचान
- थ्रेड-भागीदारी जांच
- सर्विस/सिस्टम-मैसेज बहिष्करण
- बॉट भागीदारी साबित करने के लिए ज़रूरी प्लेटफ़ॉर्म-नेटिव कैश

साझा हेल्पर के लिए अच्छा विकल्प:

- `requireMention`
- स्पष्ट मेंशन परिणाम
- इम्प्लिसिट मेंशन अलाउलिस्ट
- कमांड बायपास
- अंतिम स्किप निर्णय

पसंदीदा फ़्लो:

1. स्थानीय मेंशन तथ्यों की गणना करें।
2. उन तथ्यों को `resolveInboundMentionDecision({ facts, policy })` में पास करें।
3. अपने इनबाउंड गेट में `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, और `decision.shouldSkip` का उपयोग करें।

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

`api.runtime.channel.mentions` उन बंडल्ड channel Plugin के लिए वही साझा मेंशन हेल्पर उजागर करता है
जो पहले से रनटाइम इंजेक्शन पर निर्भर हैं:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

यदि आपको केवल `implicitMentionKindWhen` और
`resolveInboundMentionDecision` चाहिए, तो असंबंधित इनबाउंड
रनटाइम हेल्पर लोड करने से बचने के लिए
`openclaw/plugin-sdk/channel-mention-gating` से इम्पोर्ट करें।

मेंशन गेटिंग के लिए `resolveInboundMentionDecision({ facts, policy })` का उपयोग करें।

## वॉकथ्रू

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    मानक Plugin फ़ाइलें बनाएं। `package.json` में `channel` फ़ील्ड ही
    इसे channel Plugin बनाता है। पूरी पैकेज-मेटाडेटा सतह के लिए,
    [Plugin Setup and Config](/hi/plugins/sdk-setup#openclaw-channel) देखें:

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

    `configSchema` `plugins.entries.acme-chat.config` को वैलिडेट करता है। इसे
    उन Plugin-स्वामित्व वाली सेटिंग्स के लिए उपयोग करें जो channel account config नहीं हैं। `channelConfigs`
    `channels.acme-chat` को वैलिडेट करता है और Plugin रनटाइम लोड होने से पहले कॉन्फ़िग
    स्कीमा, सेटअप, और UI सतहों द्वारा उपयोग किया जाने वाला कोल्ड-पाथ स्रोत है।

  </Step>

  <Step title="Build the channel plugin object">
    `ChannelPlugin` इंटरफ़ेस में कई वैकल्पिक एडॉप्टर सतहें हैं। न्यूनतम -
    `id` और `setup` - से शुरू करें और ज़रूरत के अनुसार एडॉप्टर जोड़ें।

    `src/channel.ts` बनाएं:

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

    उन चैनलों के लिए जो canonical top-level DM keys और legacy nested keys दोनों स्वीकार करते हैं, `plugin-sdk/channel-config-helpers` से हेल्पर उपयोग करें: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, और `normalizeChannelDmPolicy` account-local वैल्यूज़ को इनहेरिटेड root वैल्यूज़ से आगे रखते हैं। उसी resolver को `normalizeLegacyDmAliases` के ज़रिये doctor repair के साथ जोड़ें ताकि रनटाइम और माइग्रेशन वही कॉन्ट्रैक्ट पढ़ें।

    <Accordion title="What createChatChannelPlugin does for you">
      निम्न-स्तरीय एडॉप्टर इंटरफ़ेस को मैन्युअली लागू करने के बजाय, आप
      डिक्लेरेटिव विकल्प पास करते हैं और बिल्डर उन्हें संयोजित करता है:

      | विकल्प | यह क्या वायर करता है |
      | --- | --- |
      | `security.dm` | कॉन्फ़िग फ़ील्ड से स्कोप्ड DM सुरक्षा resolver |
      | `pairing.text` | कोड एक्सचेंज के साथ टेक्स्ट-आधारित DM पेयरिंग फ़्लो |
      | `threading` | Reply-to-mode resolver (फिक्स्ड, अकाउंट-स्कोप्ड, या कस्टम) |
      | `outbound.attachedResults` | परिणाम मेटाडेटा (message IDs) लौटाने वाले सेंड फ़ंक्शन |

      यदि आपको पूरा नियंत्रण चाहिए, तो आप डिक्लेरेटिव विकल्पों के बजाय रॉ एडॉप्टर ऑब्जेक्ट भी पास कर सकते हैं।

      रॉ आउटबाउंड एडॉप्टर `chunker(text, limit, ctx)` फ़ंक्शन परिभाषित कर सकते हैं।
      वैकल्पिक `ctx.formatting` डिलीवरी-समय फ़ॉर्मैटिंग निर्णय जैसे
      `maxLinesPerMessage` लेकर चलता है; भेजने से पहले इसे लागू करें ताकि reply threading
      और chunk boundaries साझा outbound delivery द्वारा एक बार में resolve हों।
      Send contexts में `replyToIdSource` (`implicit` या `explicit`) भी शामिल होता है
      जब कोई native reply target resolve हुआ हो, ताकि payload helpers explicit reply tags को
      implicit single-use reply slot खर्च किए बिना सुरक्षित रख सकें।
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    `index.ts` बनाएं:

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

    चैनल-स्वामित्व वाले CLI descriptors को `registerCliMetadata(...)` में रखें ताकि OpenClaw
    उन्हें पूर्ण चैनल runtime सक्रिय किए बिना root help में दिखा सके,
    जबकि सामान्य full loads अभी भी वास्तविक command
    registration के लिए वही descriptors उठा लें। Runtime-only काम के लिए `registerFull(...)` रखें।
    यदि `registerFull(...)` gateway RPC methods register करता है, तो
    plugin-specific prefix का उपयोग करें। Core admin namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) reserved रहते हैं और हमेशा
    `operator.admin` पर resolve होते हैं।
    `defineChannelPluginEntry` registration-mode split को अपने आप संभालता है। सभी
    options के लिए [Entry Points](/hi/plugins/sdk-entrypoints#definechannelpluginentry) देखें।

  </Step>

  <Step title="सेटअप entry जोड़ें">
    Onboarding के दौरान हल्की loading के लिए `setup-entry.ts` बनाएँ:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    जब channel disabled या unconfigured हो, तब OpenClaw full entry के बजाय इसे load करता है।
    यह setup flows के दौरान भारी runtime code खींचने से बचाता है।
    विवरण के लिए [Setup and Config](/hi/plugins/sdk-setup#setup-entry) देखें।

    Bundled workspace channels जो setup-safe exports को sidecar
    modules में split करते हैं, वे `openclaw/plugin-sdk/channel-entry-contract` से
    `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं, जब उन्हें
    explicit setup-time runtime setter की भी जरूरत हो।

  </Step>

  <Step title="Inbound messages संभालें">
    आपके plugin को platform से messages receive करके उन्हें
    OpenClaw तक forward करना होगा। सामान्य pattern एक webhook है जो request को verify करता है और
    उसे आपके channel के inbound handler के माध्यम से dispatch करता है:

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
      Inbound message handling channel-specific होता है। हर channel plugin अपनी
      inbound pipeline का मालिक होता है। वास्तविक patterns के लिए bundled channel plugins
      (उदाहरण के लिए Microsoft Teams या Google Chat plugin package) देखें।
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Colocated tests `src/channel.test.ts` में लिखें:

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

    Shared test helpers के लिए, [Testing](/hi/plugins/sdk-testing) देखें।

</Step>
</Steps>

## File structure

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
    Fixed, account-scoped, या custom reply modes
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/hi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool और action discovery
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/hi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/hi/plugins/sdk-runtime">
    api.runtime के माध्यम से TTS, STT, media, subagent
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/hi/plugins/sdk-channel-inbound">
    Shared inbound event lifecycle: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
कुछ bundled helper seams अब भी bundled-plugin maintenance और
compatibility के लिए मौजूद हैं। वे नए channel plugins के लिए recommended pattern नहीं हैं;
जब तक आप सीधे उस bundled plugin family को maintain नहीं कर रहे हों, common SDK
surface से generic channel/setup/reply/runtime subpaths को प्राथमिकता दें।
</Note>

## अगले चरण

- [Provider Plugins](/hi/plugins/sdk-provider-plugins) - यदि आपका plugin models भी प्रदान करता है
- [SDK Overview](/hi/plugins/sdk-overview) - पूरा subpath import reference
- [SDK Testing](/hi/plugins/sdk-testing) - test utilities और contract tests
- [Plugin Manifest](/hi/plugins/manifest) - पूरा manifest schema

## संबंधित

- [Plugin SDK setup](/hi/plugins/sdk-setup)
- [Building plugins](/hi/plugins/building-plugins)
- [Agent harness plugins](/hi/plugins/sdk-agent-harness)
