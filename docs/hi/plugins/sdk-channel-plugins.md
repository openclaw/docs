---
read_when:
    - आप एक नया मैसेजिंग चैनल Plugin बना रहे हैं
    - आप OpenClaw को किसी मैसेजिंग प्लेटफ़ॉर्म से कनेक्ट करना चाहते हैं
    - आपको ChannelPlugin अडैप्टर इंटरफ़ेस को समझना होगा
sidebarTitle: Channel Plugins
summary: OpenClaw के लिए मैसेजिंग चैनल Plugin बनाने की चरण-दर-चरण मार्गदर्शिका
title: चैनल Plugin बनाना
x-i18n:
    generated_at: "2026-07-16T16:35:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

यह मार्गदर्शिका एक ऐसा चैनल Plugin बनाती है जो OpenClaw को किसी मैसेजिंग
प्लेटफ़ॉर्म से जोड़ता है: DM सुरक्षा, पेयरिंग, उत्तर थ्रेडिंग और आउटबाउंड मैसेजिंग।

<Info>
  OpenClaw plugins के लिए नए हैं? पैकेज संरचना और मैनिफ़ेस्ट सेटअप के लिए पहले
  [आरंभ करना](/hi/plugins/building-plugins) पढ़ें।
</Info>

## आपके Plugin का दायित्व

चैनल plugins भेजने/संपादित करने/प्रतिक्रिया देने वाले टूल लागू नहीं करते; कोर एक
साझा `message` टूल प्रदान करता है। आपके Plugin का दायित्व है:

- **कॉन्फ़िगरेशन** - खाता समाधान और सेटअप विज़ार्ड
- **सुरक्षा** - DM नीति और अनुमति-सूचियाँ
- **पेयरिंग** - DM अनुमोदन प्रवाह
- **सेशन व्याकरण** - प्रदाता-विशिष्ट वार्तालाप आईडी को मूल
  चैट, थ्रेड आईडी और पैरेंट फ़ॉलबैक से मैप करने का तरीका
- **आउटबाउंड** - प्लेटफ़ॉर्म पर टेक्स्ट, मीडिया और पोल भेजना
- **थ्रेडिंग** - उत्तरों को थ्रेड करने का तरीका
- **Heartbeat टाइपिंग** - Heartbeat डिलीवरी लक्ष्यों के लिए वैकल्पिक टाइपिंग/व्यस्तता संकेत

कोर साझा संदेश टूल, प्रॉम्प्ट वायरिंग, बाहरी सेशन-कुंजी संरचना, सामान्य
`:thread:` लेखा-जोखा और डिस्पैच का दायित्व संभालता है।

## संदेश अडैप्टर

`openclaw/plugin-sdk/channel-outbound` से `defineChannelMessageAdapter` वाला
`message` अडैप्टर एक्सपोज़ करें। केवल उन्हीं स्थायी अंतिम-प्रेषण
क्षमताओं को घोषित करें जिनका आपका नेटिव ट्रांसपोर्ट वास्तव में समर्थन करता है और जिन्हें ऐसा कॉन्ट्रैक्ट
टेस्ट समर्थित करता हो जो नेटिव साइड इफ़ेक्ट और लौटाई गई रसीद को सिद्ध करता है। टेक्स्ट/मीडिया
प्रेषण को उन्हीं ट्रांसपोर्ट फ़ंक्शन की ओर इंगित करें जिनका लेगेसी `outbound` अडैप्टर उपयोग करता है। पूर्ण
API कॉन्ट्रैक्ट, क्षमता मैट्रिक्स, रसीद नियमों, लाइव प्रीव्यू
अंतिमीकरण, प्राप्ति अभिस्वीकृति नीति, टेस्ट और माइग्रेशन तालिका के लिए
[चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) देखें।

यदि आपके मौजूदा `outbound` अडैप्टर में पहले से सही प्रेषण विधियाँ और
क्षमता मेटाडेटा हैं, तो दूसरा ब्रिज स्वयं लिखने के बजाय
`createChannelMessageAdapterFromOutbound(...)` से `message` अडैप्टर व्युत्पन्न करें।
अडैप्टर प्रेषण `MessageReceipt` मान लौटाते हैं। लेगेसी आईडी के लिए, समानांतर
`messageIds` फ़ील्ड बनाए रखने के बजाय उन्हें
`listMessageReceiptPlatformIds(...)` या
`resolveMessageReceiptPrimaryId(...)` से व्युत्पन्न करें।

लाइव और फ़ाइनलाइज़र क्षमताओं को सटीक रूप से घोषित करें - कोर इन्हीं से तय करता है
कि चैनल क्या कर सकता है, और घोषित तथा वास्तविक व्यवहार के बीच अंतर
कॉन्ट्रैक्ट टेस्ट की विफलता है:

| सतह                                  | मान                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

ड्राफ़्ट प्रीव्यू को उसी स्थान पर अंतिम रूप देने वाले चैनलों को रनटाइम लॉजिक
`defineFinalizableLivePreviewAdapter(...)` और
`deliverWithFinalizableLivePreviewAdapter(...)` के माध्यम से रूट करना चाहिए और घोषित
क्षमताओं को `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
और `verifyChannelMessageLiveFinalizerProofs(...)` टेस्ट द्वारा समर्थित रखना चाहिए, ताकि नेटिव प्रीव्यू,
प्रगति, संपादन, फ़ॉलबैक/अवधारण, क्लीनअप और रसीद का व्यवहार चुपचाप
बदल न सके।

प्लेटफ़ॉर्म अभिस्वीकृतियों को स्थगित करने वाले इनबाउंड रिसीवरों को
मॉनिटर-स्थानीय स्थिति में अभिस्वीकृति समय छिपाने के बजाय
`message.receive.defaultAckPolicy` और `supportedAckPolicies` घोषित करने चाहिए।
प्रत्येक घोषित नीति को `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` से कवर करें।

`dispatchInboundReplyWithBase` और
`recordInboundSessionAndDispatchReply` जैसे लेगेसी उत्तर हेल्पर संगतता
डिस्पैचर के लिए उपलब्ध रहते हैं। नए चैनल कोड के लिए उनका उपयोग न करें; इसके बजाय
`message` अडैप्टर, रसीदों और
`openclaw/plugin-sdk/channel-outbound` पर उपलब्ध प्राप्ति/प्रेषण जीवनचक्र हेल्पर से आरंभ करें।

### इनबाउंड प्रवेश (प्रायोगिक)

इनबाउंड प्राधिकरण माइग्रेट करने वाले चैनल रनटाइम प्राप्ति
पथों से प्रायोगिक `openclaw/plugin-sdk/channel-ingress-runtime` उपपथ का उपयोग कर सकते हैं।
यह प्लेटफ़ॉर्म तथ्य, कच्ची अनुमति-सूचियाँ, रूट विवरणक, कमांड
तथ्य और एक्सेस-समूह कॉन्फ़िगरेशन स्वीकार करता है, फिर प्रेषक/रूट/कमांड/सक्रियण
प्रक्षेपणों के साथ क्रमबद्ध प्रवेश ग्राफ़ लौटाता है, जबकि प्लेटफ़ॉर्म लुकअप और साइड
इफ़ेक्ट Plugin में रहते हैं। Plugin पहचान सामान्यीकरण उस
विवरणक में रखें जिसे आप रिज़ॉल्वर को देते हैं; समाधान की गई स्थिति या निर्णय से कच्चे मिलान मान
क्रमबद्ध न करें। API डिज़ाइन, स्वामित्व सीमा और टेस्ट अपेक्षाओं के लिए
[चैनल प्रवेश API](/hi/plugins/sdk-channel-ingress) देखें।

### टाइपिंग संकेतक

यदि आपका चैनल इनबाउंड उत्तरों के बाहर टाइपिंग संकेतकों का समर्थन करता है, तो चैनल Plugin पर
`heartbeat.sendTyping(...)` एक्सपोज़ करें। कोर Heartbeat मॉडल रन शुरू होने से पहले
समाधान किए गए Heartbeat डिलीवरी लक्ष्य के साथ इसे कॉल करता है और
साझा टाइपिंग कीपअलाइव/क्लीनअप जीवनचक्र का उपयोग करता है। जब प्लेटफ़ॉर्म को स्पष्ट रोक संकेत चाहिए, तब
`heartbeat.clearTyping(...)` जोड़ें।

### मीडिया स्रोत पैरामीटर

यदि आपका चैनल संदेश-टूल में मीडिया स्रोत रखने वाले पैरामीटर जोड़ता है, तो
उन पैरामीटर नामों को `plugin.actions.describeMessageTool(...).mediaSourceParams` के माध्यम से एक्सपोज़ करें।
कोर सैंडबॉक्स पथ सामान्यीकरण और आउटबाउंड
मीडिया-पहुँच नीति के लिए इस स्पष्ट सूची का उपयोग करता है, इसलिए plugins को
प्रदाता-विशिष्ट अवतार, अटैचमेंट या कवर-इमेज पैरामीटर के लिए साझा-कोर विशेष स्थितियों की आवश्यकता नहीं होती।

`{ "set-profile": ["avatarUrl", "avatarPath"] }` जैसे क्रिया-कुंजी वाले मैप को प्राथमिकता दें,
ताकि असंबंधित क्रियाएँ किसी अन्य क्रिया के मीडिया आर्ग्युमेंट ग्रहण न करें। प्रत्येक एक्सपोज़ की गई क्रिया में जानबूझकर
साझा किए गए पैरामीटर के लिए समतल ऐरे भी काम करता है।

जिन चैनलों को प्लेटफ़ॉर्म-पक्षीय मीडिया
फ़ेच के लिए अस्थायी सार्वजनिक URL एक्सपोज़ करना आवश्यक है, वे Plugin स्थिति स्टोर के साथ
`openclaw/plugin-sdk/outbound-media` से `createHostedOutboundMediaStore(...)` का उपयोग कर सकते हैं। प्लेटफ़ॉर्म
रूट पार्सिंग और टोकन प्रवर्तन चैनल Plugin में रखें; साझा हेल्पर
केवल मीडिया लोडिंग, समाप्ति मेटाडेटा, चंक पंक्तियों और क्लीनअप का दायित्व संभालता है।

### नेटिव पेलोड संरचना

यदि आपके चैनल को `message(action="send")` के लिए प्रदाता-विशिष्ट संरचना चाहिए,
तो `actions.prepareSendPayload(...)` को प्राथमिकता दें। नेटिव कार्ड, ब्लॉक, एम्बेड या
अन्य स्थायी डेटा को `payload.channelData.<channel>` के अंतर्गत रखें और कोर को
आउटबाउंड/संदेश अडैप्टर के माध्यम से भेजने दें। केवल उन पेलोड के लिए, जिन्हें क्रमबद्ध करके
पुनः प्रयास नहीं किया जा सकता, संगतता फ़ॉलबैक के रूप में प्रेषण हेतु `actions.handleAction(...)` का उपयोग करें।

### सेशन वार्तालाप व्याकरण

यदि आपका प्लेटफ़ॉर्म वार्तालाप आईडी के भीतर अतिरिक्त स्कोप संग्रहीत करता है, तो उस पार्सिंग को
`messaging.resolveSessionConversation(...)` के साथ Plugin में रखें। यह
`rawId` को मूल वार्तालाप आईडी, वैकल्पिक
थ्रेड आईडी, स्पष्ट `baseConversationId` और किसी भी
`parentConversationCandidates` से मैप करने का कैनोनिकल हुक है। जब आप `parentConversationCandidates`
लौटाएँ, तो उन्हें सबसे संकीर्ण पैरेंट से सबसे व्यापक/मूल वार्तालाप तक क्रमबद्ध करें।

`messaging.resolveParentConversationCandidates(...)` उन plugins के लिए बहिष्कृत
संगतता फ़ॉलबैक है जिन्हें सामान्य/कच्ची आईडी के ऊपर केवल पैरेंट फ़ॉलबैक चाहिए।
यदि दोनों हुक मौजूद हों, तो कोर पहले
`resolveSessionConversation(...).parentConversationCandidates` का उपयोग करता है और कैनोनिकल
हुक द्वारा उन्हें छोड़े जाने पर ही `resolveParentConversationCandidates(...)` पर
फ़ॉलबैक करता है।

जिन बंडल किए गए plugins को चैनल रजिस्ट्री के बूट होने से पहले समान पार्सिंग चाहिए,
वे मेल खाते `resolveSessionConversation(...)` एक्सपोर्ट के साथ शीर्ष-स्तरीय
`session-key-api.ts` फ़ाइल एक्सपोज़ कर सकते हैं (Feishu और Telegram
plugins देखें)। कोर उस बूटस्ट्रैप-सुरक्षित सतह का उपयोग केवल तब करता है, जब रनटाइम Plugin
रजिस्ट्री अभी उपलब्ध नहीं होती।

जब Plugin कोड को रूट-जैसे फ़ील्ड सामान्यीकृत करने, चाइल्ड थ्रेड की उसके पैरेंट रूट से तुलना करने
या `{ channel, to, accountId, threadId }` से स्थिर डीडुप कुंजी बनाने की आवश्यकता हो, तब
`openclaw/plugin-sdk/channel-route` का उपयोग करें। यह हेल्पर
संख्यात्मक थ्रेड आईडी को कोर के समान तरीके से सामान्यीकृत करता है, इसलिए तदर्थ
`String(threadId)` तुलनाओं के बजाय इसे प्राथमिकता दें। प्रदाता-विशिष्ट लक्ष्य व्याकरण वाले
plugins को `messaging.resolveOutboundSessionRoute(...)` एक्सपोज़ करना चाहिए, ताकि कोर को
पार्सर शिम के बिना प्रदाता-नेटिव सेशन और थ्रेड पहचान मिल सके।

### खाता-स्कोप वाला वार्तालाप बाइंडिंग समर्थन

जब चैनल सामान्य वर्तमान-वार्तालाप बाइंडिंग का समर्थन करता हो, तब
`conversationBindings.supportsCurrentConversationBinding` सेट करें। `createChatChannelPlugin(...)`
इस स्थिर क्षमता को डिफ़ॉल्ट रूप से `true` पर सेट करता है।

यदि समर्थन कॉन्फ़िगर किए गए खाते के अनुसार अलग होता है, तो
`conversationBindings.isCurrentConversationBindingSupported({ accountId })` भी लागू करें।
कोर इस समकालिक हुक का मूल्यांकन स्थिर क्षमता सक्षम होने के बाद ही करता है।
`false` लौटाने पर सामान्य वर्तमान-वार्तालाप क्षमता,
बाइंड, लुकअप, सूची, टच और अनबाइंड संचालन उस खाते के लिए अनुपलब्ध हो जाते हैं।
हुक छोड़ने पर स्थिर क्षमता प्रत्येक खाते पर लागू होती है।

उत्तर पहले से लोड किए गए खाता कॉन्फ़िगरेशन या रनटाइम स्थिति से समाधान करें। यह
हुक केवल सामान्य वर्तमान-वार्तालाप बाइंडिंग को नियंत्रित करता है; यह
कॉन्फ़िगर किए गए बाइंडिंग नियमों या Plugin-स्वामित्व वाली सेशन रूटिंग को प्रतिस्थापित नहीं करता। कॉन्ट्रैक्ट टेस्ट में
`openclaw/plugin-sdk/channel-core` द्वारा एक्सपोर्ट किए गए
`ChannelPlugin["conversationBindings"]` कॉन्ट्रैक्ट के माध्यम से कम-से-कम एक समर्थित और एक असमर्थित खाता
कवर होना चाहिए।

## अनुमोदन और चैनल क्षमताएँ

अधिकांश चैनल plugins को अनुमोदन-विशिष्ट कोड की आवश्यकता नहीं होती। कोर समान-चैट
`/approve`, साझा अनुमोदन बटन पेलोड और सामान्य फ़ॉलबैक डिलीवरी का दायित्व संभालता है।
`ChannelPlugin.approvals` हटा दिया गया था; इसके बजाय अनुमोदन डिलीवरी/नेटिव/रेंडर/प्राधिकरण
तथ्यों को एक `approvalCapability` ऑब्जेक्ट पर रखें। `plugin.auth` केवल लॉगिन/लॉगआउट
के लिए है - कोर अब उस ऑब्जेक्ट से अनुमोदन प्राधिकरण हुक नहीं पढ़ता।

केवल नेटिव अनुमोदन रूटिंग या फ़ॉलबैक
दमन के लिए `approvalCapability.delivery` और केवल तभी `approvalCapability.render` का उपयोग करें, जब किसी चैनल को वास्तव में
साझा रेंडरर के बजाय कस्टम अनुमोदन पेलोड की आवश्यकता हो।

### अनुमोदन प्राधिकरण

- `approvalCapability.authorizeActorAction` और
  `approvalCapability.getActionAvailabilityState` कैनोनिकल
  अनुमोदन-प्राधिकरण सीम हैं।
- समान-चैट अनुमोदन प्राधिकरण उपलब्धता के लिए `getActionAvailabilityState` का उपयोग करें।
  नेटिव डिलीवरी अक्षम होने पर भी कॉन्फ़िगर किए गए अनुमोदकों को `/approve` के लिए उपलब्ध रखें;
  इसके बजाय डिलीवरी/सेटअप मार्गदर्शन के लिए नेटिव आरंभिक-सतह स्थिति का उपयोग करें।
- यदि आपका चैनल नेटिव निष्पादन अनुमोदन एक्सपोज़ करता है, तो
  आरंभिक-सतह/नेटिव-क्लाइंट स्थिति समान-चैट
  अनुमोदन प्राधिकरण से अलग होने पर उसके लिए `approvalCapability.getExecInitiatingSurfaceState` का उपयोग करें।
  कोर उस निष्पादन-विशिष्ट हुक का उपयोग `enabled` और
  `disabled` में अंतर करने, यह तय करने कि आरंभिक चैनल नेटिव निष्पादन
  अनुमोदनों का समर्थन करता है या नहीं, और चैनल को नेटिव-क्लाइंट फ़ॉलबैक मार्गदर्शन में शामिल करने के लिए करता है।
  सामान्य स्थिति में `createApproverRestrictedNativeApprovalCapability(...)` इसे भरता है।
- यदि कोई चैनल मौजूदा कॉन्फ़िगरेशन से स्थिर स्वामी-जैसी DM पहचान अनुमानित कर सकता है,
  तो अनुमोदन-विशिष्ट कोर लॉजिक जोड़े बिना समान-चैट
  `/approve` को प्रतिबंधित करने के लिए
  `openclaw/plugin-sdk/approval-runtime` से `createResolvedApproverActionAuthAdapter` का उपयोग करें।
- यदि कस्टम अनुमोदन प्राधिकरण जानबूझकर केवल समान-चैट फ़ॉलबैक की अनुमति देता है, तो
  `openclaw/plugin-sdk/approval-auth-runtime` से `markImplicitSameChatApprovalAuthorization({ authorized: true })` लौटाएँ;
  अन्यथा कोर परिणाम को स्पष्ट अनुमोदक प्राधिकरण मानता है।
- यदि चैनल-स्वामित्व वाला नेटिव कॉलबैक अनुमोदनों को सीधे समाधान करता है, तो समाधान से पहले
  `isImplicitSameChatApprovalAuthorization(...)` का उपयोग करें, ताकि अंतर्निहित
  फ़ॉलबैक फिर भी चैनल के सामान्य अभिनेता प्राधिकरण से होकर जाए।

### पेलोड जीवनचक्र और सेटअप मार्गदर्शन

- डुप्लिकेट स्थानीय अनुमोदन प्रॉम्प्ट छिपाने या डिलीवरी से पहले टाइपिंग
  संकेतक भेजने जैसे चैनल-विशिष्ट पेलोड जीवनचक्र
  व्यवहार के लिए `outbound.shouldSuppressLocalPayloadPrompt` या
  `outbound.beforeDeliverPayload` का उपयोग करें।
- जब चैनल चाहता है कि अक्षम-पथ उत्तर नेटिव निष्पादन अनुमोदन सक्षम करने के लिए आवश्यक
  सटीक कॉन्फ़िगरेशन नॉब समझाए, तब `approvalCapability.describeExecApprovalSetup` का उपयोग करें।
  हुक को `{ channel, channelLabel, accountId }` प्राप्त होता है;
  नामित-खाता चैनलों को शीर्ष-स्तरीय
  डिफ़ॉल्ट के बजाय `channels.<channel>.accounts.<id>.execApprovals.*` जैसे खाता-स्कोप वाले पथ रेंडर करने चाहिए।
- जब Plugin अनुमोदन विफलता मार्गदर्शन को Plugin अनुमोदन के कोई-रूट-नहीं और टाइमआउट
  विफलताओं के लिए दिखाना सुरक्षित हो, तब `approvalCapability.describePluginApprovalSetup` का उपयोग करें।
  `createApproverRestrictedNativeApprovalCapability(...)`, `describeExecApprovalSetup` से
  इसका अनुमान नहीं लगाता; समान हेल्पर को स्पष्ट रूप से केवल तभी पास करें,
  जब Plugin और निष्पादन अनुमोदन वास्तव में समान नेटिव सेटअप का उपयोग करते हों।

### नेटिव अनुमोदन डिलीवरी

यदि किसी चैनल को नेटिव अनुमोदन डिलीवरी चाहिए, तो चैनल कोड को
लक्ष्य सामान्यीकरण और ट्रांसपोर्ट/प्रस्तुति तथ्यों पर केंद्रित रखें।
`openclaw/plugin-sdk/approval-runtime` से
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` और
`createApproverRestrictedNativeApprovalCapability` का उपयोग करें। चैनल-विशिष्ट तथ्यों को
`approvalCapability.nativeRuntime` के पीछे रखें,
आदर्श रूप से `createChannelApprovalNativeRuntimeAdapter(...)` या
`createLazyChannelApprovalNativeRuntimeAdapter(...)` के माध्यम से, ताकि कोर हैंडलर को असेंबल कर सके
और अनुरोध फ़िल्टरिंग, रूटिंग, डीडुप, समाप्ति, Gateway
सदस्यता तथा अन्यत्र-रूट किए गए नोटिस का दायित्व संभाल सके।

`nativeRuntime` को कुछ छोटे सीम में विभाजित किया गया है:

- `availability` - क्या खाता कॉन्फ़िगर किया गया है और क्या किसी अनुरोध को
  संभाला जाना चाहिए
- `presentation` - साझा अनुमोदन व्यू मॉडल को
  लंबित/समाधानित/समय-सीमा समाप्त नेटिव पेलोड या अंतिम कार्रवाइयों में मैप करें
- `transport` - लक्ष्य तैयार करें और नेटिव अनुमोदन
  संदेश भेजें/अपडेट करें/हटाएँ
- `interactions` - नेटिव बटन
  या प्रतिक्रियाओं के लिए वैकल्पिक बाइंड/अनबाइंड/कार्रवाई-साफ़-करने वाले हुक, साथ ही एक वैकल्पिक `cancelDelivered` हुक। जब
  `deliverPending` इन-प्रोसेस या स्थायी
  स्थिति (जैसे प्रतिक्रिया लक्ष्य स्टोर) पंजीकृत करता है, तब `cancelDelivered` लागू करें, ताकि यदि
  हैंडलर रुकने से `bindPending` चलने से पहले डिलीवरी रद्द हो जाए, या जब
  `bindPending` कोई हैंडल न लौटाए, तो उस स्थिति को मुक्त किया जा सके
- `observe` - वैकल्पिक डिलीवरी निदान हुक

अन्य अनुमोदन सहायक:

- जब कोई चैनल सत्र-मूल नेटिव डिलीवरी और स्पष्ट अनुमोदन अग्रेषण लक्ष्य,
  दोनों का समर्थन करता है, तब
  `openclaw/plugin-sdk/approval-native-runtime` से `createNativeApprovalChannelRouteGates` का उपयोग करें। यह
  सहायक अनुमोदन कॉन्फ़िग चयन, `mode` प्रबंधन, एजेंट/सत्र
  फ़िल्टर, खाता बाइंडिंग, सत्र-लक्ष्य मिलान और लक्ष्य-सूची मिलान को केंद्रीकृत करता है,
  जबकि कॉलर अब भी चैनल आईडी, डिफ़ॉल्ट अग्रेषण मोड, खाता
  लुकअप, ट्रांसपोर्ट-सक्षम जाँच, लक्ष्य सामान्यीकरण और टर्न-स्रोत
  लक्ष्य समाधान के स्वामी बने रहते हैं। कोर-स्वामित्व वाले चैनल नीति
  डिफ़ॉल्ट बनाने के लिए इसका उपयोग न करें; चैनल का दस्तावेज़ीकृत डिफ़ॉल्ट मोड स्पष्ट रूप से पास करें।
- `createChannelNativeOriginTargetResolver`, `{ to, accountId, threadId }` लक्ष्यों के लिए डिफ़ॉल्ट रूप से साझा चैनल-रूट
  मिलानकर्ता का उपयोग करता है। `targetsMatch` केवल तभी पास करें,
  जब किसी चैनल में प्रदाता-विशिष्ट समतुल्यता नियम हों,
  जैसे Slack टाइमस्टैम्प उपसर्ग मिलान। `normalizeTargetForMatch` तब पास करें, जब
  चैनल को डिफ़ॉल्ट रूट मिलानकर्ता या कस्टम `targetsMatch` कॉलबैक चलने से पहले
  प्रदाता आईडी को कैनोनिकल बनाना हो, जबकि डिलीवरी के लिए
  मूल लक्ष्य संरक्षित रहे। `normalizeTarget` का उपयोग केवल तभी करें, जब समाधानित
  डिलीवरी लक्ष्य को ही कैनोनिकल बनाया जाना चाहिए।
- यदि चैनल को क्लाइंट, टोकन, Bolt
  ऐप या Webhook रिसीवर जैसी रनटाइम-स्वामित्व वाली वस्तुओं की आवश्यकता हो, तो उन्हें
  `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से पंजीकृत करें। सामान्य रनटाइम-संदर्भ
  रजिस्ट्री, अनुमोदन-विशिष्ट रैपर ग्लू जोड़े बिना, कोर को चैनल
  स्टार्टअप स्थिति से क्षमता-संचालित हैंडलर बूटस्ट्रैप करने देती है।
- निचले-स्तर के `createChannelApprovalHandler` या
  `createChannelNativeApprovalRuntime` का उपयोग केवल तभी करें, जब क्षमता-संचालित सीम
  अभी पर्याप्त रूप से अभिव्यंजक न हो।
- नेटिव अनुमोदन चैनलों को `accountId` और `approvalKind` दोनों को
  उन सहायकों के माध्यम से रूट करना होगा। `accountId` बहु-खाता अनुमोदन नीति को
  सही बॉट खाते तक सीमित रखता है, और `approvalKind` कोर में
  हार्डकोडेड शाखाओं के बिना exec बनाम Plugin अनुमोदन व्यवहार
  चैनल के लिए उपलब्ध रखता है।
- अनुमोदन पुनः-रूट सूचना का स्वामित्व भी कोर के पास है। चैनल Plugin को
  `createChannelNativeApprovalRuntime` से अपने स्वयं के "अनुमोदन DMs / किसी अन्य चैनल पर गया" अनुवर्ती संदेश
  नहीं भेजने चाहिए; इसके बजाय, साझा अनुमोदन क्षमता सहायकों के माध्यम से
  सटीक मूल + अनुमोदक-DM रूटिंग उजागर करें और आरंभिक चैट में
  कोई सूचना वापस पोस्ट करने से पहले कोर को वास्तविक डिलीवरी एकत्रित करने दें।
- डिलीवर किए गए अनुमोदन आईडी के प्रकार को शुरू से अंत तक संरक्षित रखें। नेटिव क्लाइंट को
  चैनल-स्थानीय स्थिति से exec बनाम Plugin अनुमोदन रूटिंग का अनुमान नहीं लगाना
  या उसे फिर से लिखना नहीं चाहिए।
- उस स्पष्ट `approvalKind` को `resolveApprovalOverGateway` में पास करें। यह
  कैनोनिकल `approval.resolve` सेवा का उपयोग करता है और जब कोई अन्य सतह पहले उत्तर देती है,
  तो दर्ज विजेता लौटाता है। पुराना स्पष्ट `resolveMethod` इनपुट
  कमांड-समर्थित नियंत्रणों के लिए बना हुआ है; नई नेटिव कार्रवाइयों को इसका उपयोग नहीं करना चाहिए
  या किसी आईडी से प्रकार का अनुमान नहीं लगाना चाहिए।
- अलग-अलग अनुमोदन प्रकार जानबूझकर अलग नेटिव
  सतहें उजागर कर सकते हैं। वर्तमान बंडल किए गए उदाहरण: Matrix, exec और Plugin अनुमोदनों के लिए समान नेटिव DM/चैनल
  रूटिंग और प्रतिक्रिया UX बनाए रखता है, जबकि फिर भी अनुमोदन प्रकार के अनुसार
  प्रमाणीकरण अलग होने देता है; Slack, exec और Plugin दोनों आईडी के लिए नेटिव अनुमोदन रूटिंग
  उपलब्ध रखता है।
- `createApproverRestrictedNativeApprovalAdapter` अब भी एक
  संगतता रैपर के रूप में मौजूद है, लेकिन नए कोड को क्षमता बिल्डर को प्राथमिकता देनी चाहिए
  और Plugin पर `approvalCapability` उजागर करना चाहिए।

### अनुमोदन रनटाइम के अधिक संकीर्ण उपपथ

हॉट चैनल प्रवेश-बिंदुओं के लिए, जब आपको उस समूह का केवल एक भाग चाहिए, तो व्यापक
`approval-runtime` बैरल के बजाय इन अधिक संकीर्ण उपपथों को प्राथमिकता दें:

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

इसी प्रकार, जब आपको उन सभी की आवश्यकता न हो, तो व्यापक अम्ब्रेला सतहों के बजाय
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, और
`openclaw/plugin-sdk/reply-chunking` को प्राथमिकता दें।

### सेटअप उपपथ

- `openclaw/plugin-sdk/setup-runtime` रनटाइम-सुरक्षित सेटअप सहायकों को कवर करता है:
  `createSetupTranslator`, इम्पोर्ट-सुरक्षित सेटअप पैच एडाप्टर
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), लुकअप-नोट आउटपुट,
  `promptResolvedAllowFrom`, `splitSetupEntries`, और प्रत्यायोजित
  सेटअप-प्रॉक्सी बिल्डर।
- `openclaw/plugin-sdk/channel-setup` वैकल्पिक-इंस्टॉल सेटअप
  बिल्डर और कुछ सेटअप-सुरक्षित प्रिमिटिव को कवर करता है: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled`, और `splitSetupEntries`।
- व्यापक `openclaw/plugin-sdk/setup` सीम का उपयोग केवल तभी करें, जब आपको
  `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे अधिक भारी साझा सेटअप/कॉन्फ़िग सहायकों की भी
  आवश्यकता हो।

यदि आपका चैनल सेटअप सतहों में केवल "पहले यह Plugin इंस्टॉल करें" का विज्ञापन करना चाहता है,
तो `createOptionalChannelSetupSurface(...)` को प्राथमिकता दें। जनरेट किया गया
एडाप्टर/विज़ार्ड कॉन्फ़िग लेखन और अंतिमकरण पर सुरक्षित रूप से विफल होता है, और वह
सत्यापन, अंतिमकरण तथा दस्तावेज़-लिंक कॉपी में समान इंस्टॉल-आवश्यक संदेश का पुनः उपयोग करता है।

यदि आपका चैनल env-संचालित सेटअप या प्रमाणीकरण का समर्थन करता है और सामान्य स्टार्टअप/कॉन्फ़िग
प्रवाहों को रनटाइम लोड होने से पहले उन env नामों की जानकारी होनी चाहिए, तो उन्हें
Plugin मैनिफ़ेस्ट में `channelEnvVars` के साथ घोषित करें। चैनल रनटाइम `envVars` या स्थानीय
स्थिरांकों को केवल ऑपरेटर-दृश्य कॉपी के लिए रखें।

यदि आपका चैनल Plugin रनटाइम शुरू होने से पहले `status`, `channels list`, `channels status`, या
SecretRef स्कैन में दिखाई दे सकता है, तो
`package.json` में `openclaw.setupEntry` जोड़ें। यह प्रवेश-बिंदु केवल-पठन कमांड
पथों में इम्पोर्ट करने के लिए सुरक्षित होना चाहिए और उन
सारांशों के लिए आवश्यक चैनल मेटाडेटा, सेटअप-सुरक्षित कॉन्फ़िग एडाप्टर,
स्थिति एडाप्टर और चैनल सीक्रेट लक्ष्य मेटाडेटा लौटाना चाहिए।
सेटअप प्रविष्टि से क्लाइंट, लिसनर या ट्रांसपोर्ट रनटाइम शुरू न करें।

मुख्य चैनल प्रविष्टि के इम्पोर्ट पथ को भी संकीर्ण रखें। डिस्कवरी,
चैनल को सक्रिय किए बिना क्षमताएँ पंजीकृत करने के लिए प्रविष्टि और चैनल Plugin मॉड्यूल का मूल्यांकन कर सकती है।
`channel-plugin-api.ts` जैसी फ़ाइलों को
सेटअप विज़ार्ड, ट्रांसपोर्ट क्लाइंट, सॉकेट लिसनर, सबप्रोसेस लॉन्चर या सेवा स्टार्टअप मॉड्यूल इम्पोर्ट किए बिना
चैनल Plugin ऑब्जेक्ट एक्सपोर्ट करना चाहिए।
उन रनटाइम भागों को `registerFull(...)`, रनटाइम
सेटर या लेज़ी क्षमता एडाप्टर से लोड किए गए मॉड्यूल में रखें।

### अन्य संकीर्ण चैनल उपपथ

अन्य हॉट चैनल पथों के लिए, व्यापक लेगेसी
सतहों के बजाय संकीर्ण सहायकों को प्राथमिकता दें:

- बहु-खाता कॉन्फ़िग और
  डिफ़ॉल्ट-खाता फ़ॉलबैक के लिए `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, और
  `openclaw/plugin-sdk/account-helpers`
- इनबाउंड रूट/एन्वेलप और
  रिकॉर्ड-एवं-डिस्पैच वायरिंग के लिए `openclaw/plugin-sdk/inbound-envelope` और
  `openclaw/plugin-sdk/channel-inbound`
- लक्ष्य पार्सिंग सहायकों के लिए `openclaw/plugin-sdk/channel-targets`
- मीडिया लोडिंग के लिए `openclaw/plugin-sdk/outbound-media` और
  आउटबाउंड पहचान/भेजने के प्रतिनिधियों
  तथा पेलोड योजना के लिए `openclaw/plugin-sdk/channel-outbound`
- जब किसी आउटबाउंड रूट को स्पष्ट
  `replyToId`/`threadId` संरक्षित करना चाहिए या बेस सत्र कुंजी के अब भी मेल खाने के बाद वर्तमान `:thread:`
  सत्र को पुनर्प्राप्त करना चाहिए, तब
  `openclaw/plugin-sdk/channel-core` से `buildThreadAwareOutboundSessionRoute(...)`। जब उनके प्लेटफ़ॉर्म में नेटिव थ्रेड डिलीवरी सिमेंटिक्स हों,
  प्रदाता Plugin प्राथमिकता, प्रत्यय व्यवहार और थ्रेड आईडी सामान्यीकरण को
  ओवरराइड कर सकते हैं।
- थ्रेड-बाइंडिंग जीवनचक्र
  और एडाप्टर पंजीकरण के लिए `openclaw/plugin-sdk/thread-bindings-runtime`
- केवल तभी `openclaw/plugin-sdk/agent-media-payload`, जब लेगेसी एजेंट/मीडिया
  पेलोड फ़ील्ड लेआउट अब भी आवश्यक हो
- Telegram कस्टम-कमांड सामान्यीकरण,
  डुप्लिकेट/टकराव सत्यापन और फ़ॉलबैक-स्थिर कमांड कॉन्फ़िग
  अनुबंध के लिए `openclaw/plugin-sdk/telegram-command-config` (अप्रचलित: कोई बंडल किया गया
  Plugin उत्पादन में इसका उपयोग नहीं करता); नए Plugin कोड के लिए Plugin-स्थानीय कमांड कॉन्फ़िग प्रबंधन को प्राथमिकता दें

केवल-प्रमाणीकरण चैनल सामान्यतः डिफ़ॉल्ट पथ तक सीमित रह सकते हैं: कोर
अनुमोदनों को संभालता है और Plugin केवल आउटबाउंड/प्रमाणीकरण क्षमताएँ उजागर करता है। Matrix, Slack, Telegram और कस्टम चैट ट्रांसपोर्ट जैसे
नेटिव अनुमोदन चैनलों को अपना अनुमोदन
जीवनचक्र स्वयं बनाने के बजाय साझा नेटिव सहायकों का उपयोग करना चाहिए।

## इनबाउंड उल्लेख नीति

इनबाउंड उल्लेख प्रबंधन को दो परतों में विभाजित रखें:

- Plugin-स्वामित्व वाला साक्ष्य संग्रह
- साझा नीति मूल्यांकन

उल्लेख-नीति निर्णयों के लिए `openclaw/plugin-sdk/channel-mention-gating` का उपयोग करें।
व्यापक इनबाउंड सहायक बैरल की आवश्यकता होने पर ही
`openclaw/plugin-sdk/channel-inbound` का उपयोग करें।

Plugin-स्थानीय तर्क के लिए उपयुक्त:

- बॉट को दिए गए उत्तर की पहचान
- उद्धृत बॉट की पहचान
- थ्रेड-भागीदारी जाँच
- सेवा/सिस्टम-संदेश अपवर्जन
- बॉट की भागीदारी सिद्ध करने के लिए आवश्यक प्लेटफ़ॉर्म-नेटिव कैश

साझा सहायक के लिए उपयुक्त:

- `requireMention`
- स्पष्ट उल्लेख परिणाम
- अप्रत्यक्ष उल्लेख अनुमति-सूची
- कमांड बाइपास
- अंतिम छोड़ने का निर्णय

वरीय प्रवाह:

1. स्थानीय उल्लेख तथ्यों की गणना करें।
2. उन तथ्यों को `resolveInboundMentionDecision({ facts, policy })` में पास करें।
3. अपने इनबाउंड गेट में `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, और
   `decision.shouldSkip` का उपयोग करें।

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

`matchesMentionWithExplicit(...)` एक बूलियन लौटाता है। `hasAnyMention`,
`isExplicitlyMentioned`, और `canResolveExplicit` चैनल के अपने
नेटिव उल्लेख मेटाडेटा (संदेश एंटिटी, बॉट को उत्तर देने वाले फ़्लैग और इसी प्रकार की जानकारी) से आते हैं;
जब आपका प्लेटफ़ॉर्म उनका पता नहीं लगा सकता, तब `false`/`undefined` मान प्रदान करें।

`api.runtime.channel.mentions` उन बंडल किए गए चैनल Plugin के लिए
समान साझा उल्लेख सहायक उजागर करता है, जो पहले से रनटाइम इंजेक्शन पर निर्भर हैं:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`।

यदि आपको केवल `implicitMentionKindWhen` और `resolveInboundMentionDecision` की आवश्यकता है,
तो असंबंधित इनबाउंड रनटाइम सहायकों को लोड करने से बचने के लिए
`openclaw/plugin-sdk/channel-mention-gating` से इम्पोर्ट करें।

## चरण-दर-चरण विवरण

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="पैकेज और मैनिफ़ेस्ट">
    मानक plugin फ़ाइलें बनाएँ। `openclaw.plugin.json` में
    `channels` फ़ील्ड (`kind` फ़ील्ड नहीं) ही किसी मैनिफ़ेस्ट को
    किसी चैनल का स्वामी चिह्नित करती है। संपूर्ण पैकेज-मेटाडेटा सतह के लिए,
    [Plugin सेटअप और कॉन्फ़िगरेशन](/hi/plugins/sdk-setup#openclaw-channel) देखें:

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
          "blurb": "OpenClaw को Acme Chat से कनेक्ट करें।"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat चैनल plugin",
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
              "label": "बॉट टोकन",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema`, `plugins.entries.acme-chat.config` को सत्यापित करता है। इसका उपयोग
    plugin के स्वामित्व वाली उन सेटिंग्स के लिए करें जो चैनल खाता कॉन्फ़िगरेशन नहीं हैं।
    `channelConfigs.acme-chat.schema`, `channels.acme-chat` को सत्यापित करता है और यह
    plugin रनटाइम लोड होने से पहले कॉन्फ़िगरेशन स्कीमा, सेटअप और UI सतहों द्वारा उपयोग किया जाने वाला
    कोल्ड-पाथ स्रोत है। शीर्ष-स्तरीय फ़ील्ड के संपूर्ण संदर्भ के लिए
    [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) देखें।

  </Step>

  <Step title="चैनल plugin ऑब्जेक्ट बनाएँ">
    `ChannelPlugin` इंटरफ़ेस में कई वैकल्पिक अडैप्टर सतहें हैं। न्यूनतम
    `id`, `config` और `setup` से शुरू करें और आवश्यकतानुसार
    अडैप्टर जोड़ें।

    `src/channel.ts` बनाएँ:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // आपका प्लेटफ़ॉर्म API क्लाइंट

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
      if (!token) throw new Error("acme-chat: टोकन आवश्यक है");
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
        // खाता रिज़ॉल्यूशन/निरीक्षण `config` में होता है, `setup` में नहीं।
        // `setup` ऑनबोर्डिंग लेखनों (applyAccountConfig, validateInput) को संभालता है।
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

      // DM सुरक्षा: बॉट को कौन संदेश भेज सकता है
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // पेयरिंग: नए DM संपर्कों के लिए अनुमोदन प्रवाह
      pairing: {
        text: {
          idLabel: "Acme Chat उपयोगकर्ता नाम",
          message: "अपनी पहचान सत्यापित करने के लिए यह कोड भेजें:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `पेयरिंग कोड: ${code}`);
          },
        },
      },

      // थ्रेडिंग: उत्तर कैसे वितरित किए जाते हैं
      threading: { topLevelReplyToMode: "reply" },

      // आउटबाउंड: प्लेटफ़ॉर्म को संदेश भेजें
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

    उन चैनलों के लिए जो मानक शीर्ष-स्तरीय DM कुंजियाँ और विरासती नेस्टेड कुंजियाँ दोनों स्वीकार करते हैं, `plugin-sdk/channel-config-helpers` के हेल्पर का उपयोग करें: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` और `normalizeChannelDmPolicy`, खाते के स्थानीय मानों को इनहेरिट किए गए रूट मानों से आगे रखते हैं। उसी रिज़ॉल्वर को `normalizeLegacyDmAliases` के माध्यम से डॉक्टर रिपेयर के साथ युग्मित करें, ताकि रनटाइम और माइग्रेशन एक ही अनुबंध पढ़ें।

    <Accordion title="createChatChannelPlugin आपके लिए क्या करता है">
      निम्न-स्तरीय अडैप्टर इंटरफ़ेस को मैन्युअल रूप से लागू करने के बजाय, आप
      घोषणात्मक विकल्प देते हैं और बिल्डर उन्हें संयोजित करता है:

      | विकल्प | यह क्या जोड़ता है |
      | --- | --- |
      | `security.dm` | कॉन्फ़िगरेशन फ़ील्ड से स्कोप किया गया DM सुरक्षा रिज़ॉल्वर |
      | `pairing.text` | कोड विनिमय के साथ टेक्स्ट-आधारित DM पेयरिंग प्रवाह |
      | `threading` | रिप्लाई-टू-मोड रिज़ॉल्वर (निश्चित, खाता-स्कोप किया गया या कस्टम) |
      | `outbound.attachedResults` | परिणाम मेटाडेटा (संदेश ID) लौटाने वाले प्रेषण फ़ंक्शन; इसके लिए सहोदर `channel` id आवश्यक है, ताकि कोर लौटाए गए डिलीवरी परिणाम पर मुहर लगा सके |

      यदि आपको पूर्ण नियंत्रण चाहिए, तो घोषणात्मक विकल्पों के बजाय रॉ अडैप्टर
      ऑब्जेक्ट भी दिए जा सकते हैं।

      रॉ आउटबाउंड अडैप्टर एक `chunker(text, limit, ctx)` फ़ंक्शन परिभाषित कर सकते हैं।
      वैकल्पिक `ctx.formatting`, `maxLinesPerMessage` जैसे डिलीवरी-समय के
      फ़ॉर्मैटिंग निर्णय रखता है; इसे भेजने से पहले लागू करें, ताकि रिप्लाई थ्रेडिंग
      और खंड सीमाओं को साझा आउटबाउंड डिलीवरी द्वारा केवल एक बार हल किया जाए।
      जब कोई नेटिव रिप्लाई लक्ष्य रिज़ॉल्व हो जाता है, तब प्रेषण संदर्भों में
      `replyToIdSource` (`implicit` या `explicit`) भी शामिल होता है,
      ताकि पेलोड हेल्पर किसी अंतर्निहित एकल-उपयोग रिप्लाई स्लॉट का उपभोग किए बिना
      स्पष्ट रिप्लाई टैग सुरक्षित रख सकें।
    </Accordion>

  </Step>

  <Step title="एंट्री पॉइंट जोड़ें">
    `index.ts` बनाएँ:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat चैनल plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat प्रबंधन");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat प्रबंधन",
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

    चैनल के स्वामित्व वाले CLI डिस्क्रिप्टर `registerCliMetadata(...)` में रखें, ताकि OpenClaw
    पूर्ण चैनल रनटाइम सक्रिय किए बिना उन्हें रूट सहायता में दिखा सके,
    जबकि सामान्य पूर्ण लोड वास्तविक कमांड पंजीकरण के लिए उन्हीं डिस्क्रिप्टर को
    प्राप्त करते रहें। `registerFull(...)` को केवल रनटाइम कार्य के लिए रखें।
    `defineChannelPluginEntry` पंजीकरण-मोड के विभाजन को स्वचालित रूप से संभालता है।
    यदि `registerFull(...)`, Gateway RPC विधियाँ पंजीकृत करता है, तो
    plugin-विशिष्ट प्रीफ़िक्स का उपयोग करें। कोर एडमिन नेमस्पेस (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) आरक्षित रहते हैं और हमेशा
    `operator.admin` में रिज़ॉल्व होते हैं। सभी विकल्पों के लिए
    [एंट्री पॉइंट](/hi/plugins/sdk-entrypoints#definechannelpluginentry) देखें।

  </Step>

  <Step title="सेटअप एंट्री जोड़ें">
    ऑनबोर्डिंग के दौरान हल्के लोडिंग के लिए `setup-entry.ts` बनाएँ:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    चैनल अक्षम या अपुष्ट होने पर OpenClaw पूर्ण एंट्री के बजाय इसे लोड करता है।
    यह सेटअप प्रवाहों के दौरान भारी रनटाइम कोड लोड होने से बचाता है।
    विवरण के लिए [सेटअप और कॉन्फ़िगरेशन](/hi/plugins/sdk-setup#setup-entry) देखें।

    बंडल किए गए वर्कस्पेस चैनल, जो सेटअप-सुरक्षित एक्सपोर्ट को साइडकार
    मॉड्यूल में विभाजित करते हैं, स्पष्ट सेटअप-समय रनटाइम सेटर की आवश्यकता होने पर
    `openclaw/plugin-sdk/channel-entry-contract` से `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं।

  </Step>

  <Step title="इनबाउंड संदेश संभालें">
    आपके plugin को प्लेटफ़ॉर्म से संदेश प्राप्त करके उन्हें OpenClaw को अग्रेषित करना
    होगा। सामान्य पैटर्न एक Webhook है, जो अनुरोध को सत्यापित करता है और
    उसे आपके चैनल के इनबाउंड हैंडलर के माध्यम से डिस्पैच करता है:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-प्रबंधित प्रमाणीकरण (हस्ताक्षरों को स्वयं सत्यापित करें)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // आपका इनबाउंड हैंडलर संदेश को OpenClaw में डिस्पैच करता है।
          // सटीक वायरिंग आपके प्लेटफ़ॉर्म SDK पर निर्भर करती है -
          // बंडल किए गए Microsoft Teams या Google Chat plugin पैकेज में वास्तविक उदाहरण देखें।
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      इनबाउंड संदेश प्रबंधन चैनल-विशिष्ट है। प्रत्येक चैनल plugin अपनी
      इनबाउंड पाइपलाइन का स्वामी होता है। वास्तविक पैटर्न के लिए बंडल किए गए चैनल plugin
      (उदाहरण के लिए Microsoft Teams या Google Chat plugin पैकेज) देखें।
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="परीक्षण">
`src/channel.test.ts` में साथ रखे गए परीक्षण लिखें:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat Plugin", () => {
      it("कॉन्फ़िगरेशन से खाता हल करता है", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("सीक्रेट को मूर्त रूप दिए बिना खाते का निरीक्षण करता है", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("अनुपलब्ध कॉन्फ़िगरेशन की रिपोर्ट करता है", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    साझा परीक्षण सहायकों के लिए, [परीक्षण](/hi/plugins/sdk-testing) देखें।

</Step>
</Steps>

## फ़ाइल संरचना

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel मेटाडेटा
├── openclaw.plugin.json      # कॉन्फ़िगरेशन स्कीमा वाला मैनिफ़ेस्ट
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # सार्वजनिक एक्सपोर्ट (वैकल्पिक)
├── runtime-api.ts            # आंतरिक रनटाइम एक्सपोर्ट (वैकल्पिक)
└── src/
    ├── channel.ts            # createChatChannelPlugin के माध्यम से ChannelPlugin
    ├── channel.test.ts       # परीक्षण
    ├── client.ts             # प्लेटफ़ॉर्म API क्लाइंट
    └── runtime.ts            # रनटाइम स्टोर (यदि आवश्यक हो)
```

## उन्नत विषय

<CardGroup cols={2}>
  <Card title="थ्रेडिंग विकल्प" icon="git-branch" href="/hi/plugins/sdk-entrypoints#registration-mode">
    निश्चित, खाता-क्षेत्रित या कस्टम उत्तर मोड
  </Card>
  <Card title="संदेश टूल एकीकरण" icon="puzzle" href="/hi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool और कार्रवाई की खोज
  </Card>
  <Card title="लक्ष्य समाधान" icon="crosshair" href="/hi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="रनटाइम सहायक" icon="settings" href="/hi/plugins/sdk-runtime">
    api.runtime के माध्यम से TTS, STT, मीडिया और उप-एजेंट
  </Card>
  <Card title="चैनल इनबाउंड API" icon="bolt" href="/hi/plugins/sdk-channel-inbound">
    साझा इनबाउंड इवेंट जीवनचक्र: अंतर्ग्रहण, समाधान, रिकॉर्डिंग, प्रेषण, अंतिम रूप देना
  </Card>
</CardGroup>

<Note>
बंडल किए गए Plugin के रखरखाव और संगतता के लिए कुछ बंडल किए गए सहायक सीम अभी भी
मौजूद हैं। नए चैनल Plugin के लिए ये अनुशंसित पैटर्न नहीं हैं;
जब तक आप सीधे उस बंडल किए गए Plugin परिवार का रखरखाव नहीं कर रहे हों, सामान्य SDK
सतह के जेनेरिक चैनल/सेटअप/उत्तर/रनटाइम सबपाथ को प्राथमिकता दें।
</Note>

## अगले चरण

- [प्रदाता Plugin](/hi/plugins/sdk-provider-plugins) - यदि आपका Plugin मॉडल भी प्रदान करता है
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूर्ण सबपाथ इंपोर्ट संदर्भ
- [SDK परीक्षण](/hi/plugins/sdk-testing) - परीक्षण उपयोगिताएँ और अनुबंध परीक्षण
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - पूर्ण मैनिफ़ेस्ट स्कीमा

## संबंधित

- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [एजेंट हार्नेस Plugin](/hi/plugins/sdk-agent-harness)
