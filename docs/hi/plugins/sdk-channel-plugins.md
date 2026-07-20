---
read_when:
    - आप एक नया मैसेजिंग चैनल Plugin बना रहे हैं
    - आप OpenClaw को किसी मैसेजिंग प्लेटफ़ॉर्म से कनेक्ट करना चाहते हैं
    - आपको ChannelPlugin अडैप्टर सरफ़ेस को समझना होगा
sidebarTitle: Channel Plugins
summary: OpenClaw के लिए मैसेजिंग चैनल Plugin बनाने की चरण-दर-चरण मार्गदर्शिका
title: चैनल Plugin बनाना
x-i18n:
    generated_at: "2026-07-20T07:07:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f287892d3354362d1770e0a70f79f61b812ee6ad213ca5d82f9764e441eff130
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

यह मार्गदर्शिका एक चैनल Plugin बनाती है जो OpenClaw को किसी मैसेजिंग
प्लेटफ़ॉर्म से जोड़ता है: DM सुरक्षा, पेयरिंग, उत्तर थ्रेडिंग और आउटबाउंड मैसेजिंग।

<Info>
  OpenClaw plugins में नए हैं? पैकेज संरचना और मैनिफ़ेस्ट सेटअप के लिए पहले
  [आरंभ करना](/hi/plugins/building-plugins) पढ़ें।
</Info>

## आपका Plugin किन चीज़ों का स्वामी है

चैनल plugins भेजने/संपादित करने/प्रतिक्रिया देने के टूल लागू नहीं करते; कोर एक
साझा `message` टूल प्रदान करता है। आपका Plugin इनका स्वामी है:

- **कॉन्फ़िगरेशन** - अकाउंट रिज़ॉल्यूशन और सेटअप विज़ार्ड
- **सुरक्षा** - DM नीति और अनुमति-सूचियाँ
- **पेयरिंग** - DM अनुमोदन प्रवाह
- **सेशन व्याकरण** - प्रदाता-विशिष्ट वार्तालाप आईडी को आधार
  चैट, थ्रेड आईडी और पैरेंट फ़ॉलबैक से कैसे मैप किया जाता है
- **आउटबाउंड** - प्लेटफ़ॉर्म पर टेक्स्ट, मीडिया और पोल भेजना
- **थ्रेडिंग** - उत्तरों को कैसे थ्रेड किया जाता है
- **Heartbeat टाइपिंग** - Heartbeat डिलीवरी लक्ष्यों के लिए वैकल्पिक टाइपिंग/व्यस्तता संकेत

कोर साझा संदेश टूल, प्रॉम्प्ट वायरिंग, बाहरी सेशन-कुंजी संरचना,
सामान्य `:thread:` लेखांकन और डिस्पैच का स्वामी है।

## संदेश अडैप्टर

`openclaw/plugin-sdk/channel-outbound` से `defineChannelMessageAdapter` वाला
`message` अडैप्टर उजागर करें। केवल उन्हीं टिकाऊ अंतिम-भेजने की
क्षमताओं को घोषित करें जिनका आपका नेटिव ट्रांसपोर्ट वास्तव में समर्थन करता है,
और इसके लिए ऐसा अनुबंध परीक्षण हो जो नेटिव साइड इफ़ेक्ट और लौटाई गई रसीद को
सिद्ध करता हो। टेक्स्ट/मीडिया प्रेषण को उन्हीं ट्रांसपोर्ट फ़ंक्शन की ओर इंगित करें
जिनका लेगेसी `outbound` अडैप्टर उपयोग करता है। संपूर्ण API अनुबंध,
क्षमता मैट्रिक्स, रसीद नियमों, लाइव पूर्वावलोकन अंतिमकरण, प्राप्ति अभिस्वीकृति
नीति, परीक्षणों और माइग्रेशन तालिका के लिए
[चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) देखें।

यदि आपके मौजूदा `outbound` अडैप्टर में पहले से सही प्रेषण विधियाँ और
क्षमता मेटाडेटा हैं, तो कोई दूसरा ब्रिज हाथ से लिखने के बजाय
`createChannelMessageAdapterFromOutbound(...)` से `message` अडैप्टर व्युत्पन्न करें।
अडैप्टर प्रेषण `MessageReceipt` मान लौटाते हैं। लेगेसी आईडी के लिए समानांतर
`messageIds` फ़ील्ड बनाए रखने के बजाय उन्हें
`listMessageReceiptPlatformIds(...)` या `resolveMessageReceiptPrimaryId(...)` से व्युत्पन्न करें।

लाइव और फ़ाइनलाइज़र क्षमताओं को सटीक रूप से घोषित करें - कोर इनका उपयोग यह
निर्धारित करने के लिए करता है कि कोई चैनल क्या कर सकता है, और घोषित तथा वास्तविक
व्यवहार के बीच अंतर होने पर अनुबंध परीक्षण विफल हो जाता है:

| सतह                                  | मान                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

जो चैनल ड्राफ़्ट पूर्वावलोकन को उसी स्थान पर अंतिम रूप देते हैं, उन्हें रनटाइम
लॉजिक को `defineFinalizableLivePreviewAdapter(...)` और
`deliverWithFinalizableLivePreviewAdapter(...)` के माध्यम से रूट करना चाहिए, तथा घोषित
क्षमताओं को `verifyChannelMessageLiveCapabilityAdapterProofs(...)` और
`verifyChannelMessageLiveFinalizerProofs(...)` परीक्षणों द्वारा समर्थित रखना चाहिए, ताकि नेटिव पूर्वावलोकन,
प्रगति, संपादन, फ़ॉलबैक/प्रतिधारण, क्लीनअप और रसीद व्यवहार बिना पता चले
अलग न हो सकें।

इनबाउंड रिसीवर जो प्लेटफ़ॉर्म अभिस्वीकृतियों को स्थगित करते हैं, उन्हें
अभिस्वीकृति समय को मॉनिटर-स्थानीय स्थिति में छिपाने के बजाय
`message.receive.defaultAckPolicy` और `supportedAckPolicies` घोषित करना चाहिए।
हर घोषित नीति को `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` से कवर करें।

`dispatchInboundReplyWithBase` और `recordInboundSessionAndDispatchReply` जैसे लेगेसी उत्तर हेल्पर
संगतता डिस्पैचर के लिए उपलब्ध रहते हैं। नए चैनल कोड के लिए उनका उपयोग न करें;
इसके बजाय `message` अडैप्टर, रसीदों और
`openclaw/plugin-sdk/channel-outbound` पर उपलब्ध प्राप्ति/प्रेषण जीवनचक्र हेल्पर से आरंभ करें।

### इनबाउंड प्रवेश (प्रायोगिक)

इनबाउंड प्राधिकरण माइग्रेट करने वाले चैनल रनटाइम प्राप्ति पथों से प्रायोगिक
`openclaw/plugin-sdk/channel-ingress-runtime` उपपथ का उपयोग कर सकते हैं। यह प्लेटफ़ॉर्म तथ्य,
कच्ची अनुमति-सूचियाँ, रूट विवरणक, कमांड तथ्य और एक्सेस समूह कॉन्फ़िगरेशन
स्वीकार करता है, फिर प्रेषक/रूट/कमांड/सक्रियण प्रोजेक्शन के साथ क्रमबद्ध प्रवेश
ग्राफ़ लौटाता है, जबकि प्लेटफ़ॉर्म लुकअप और साइड इफ़ेक्ट Plugin में रहते हैं।
Plugin पहचान सामान्यीकरण को रिज़ॉल्वर में दिए जाने वाले विवरणक में रखें;
रिज़ॉल्व की गई स्थिति या निर्णय से कच्चे मिलान मानों को सीरियलाइज़ न करें।
API डिज़ाइन, स्वामित्व सीमा और परीक्षण अपेक्षाओं के लिए
[चैनल प्रवेश API](/hi/plugins/sdk-channel-ingress) देखें।

### टिकाऊ प्रवेश और रीप्ले डीडुप्लीकेशन

टिकाऊ प्रवेश अपनाने वाले चैनलों को, जब तक उन्हें कोई भौतिक रूप से भिन्न
एडमिशन या पंप अनुबंध न चाहिए, `openclaw/plugin-sdk/channel-outbound` से
`createChannelIngressMonitor` का उपयोग करना चाहिए। कच्चे ट्रांसपोर्ट एनवेलप को एकल
प्राप्ति अवरोध-बिंदु पर कतारबद्ध करें (प्राप्ति समय पर कोई सामान्यीकरण नहीं),
Webhook ट्रांसपोर्ट के लिए टिकाऊ एपेंड के आधार पर ट्रांसपोर्ट अभिस्वीकृति को
गेट करें, प्रत्येक वार्तालाप के लिए एक सीरियलाइज़्ड लेन व्युत्पन्न करें और
डिस्पैच द्वारा अपनाए जाने पर इवेंट को पूर्ण चिह्नित करें। कतार की प्राथमिक कुंजी
`(queue_name, event_id)` है और पूर्णता पंक्ति को हटाने के बजाय उसे टूमस्टोन करती है,
इसलिए उसी `event_id` की प्लेटफ़ॉर्म द्वारा देर से पुनः डिलीवरी को
टूमस्टोन प्रतिधारण अवधि के दौरान टिकाऊ रूप से अस्वीकार किया जाता है।
मॉनिटर API और शटडाउन अनुबंध के लिए
[चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound#durable-ingress-monitors) देखें।

वह टूमस्टोन रीप्ले गार्ड
(`openclaw/plugin-sdk/persistent-dedupe`) के लिए लेयरिंग नियम है: ड्रेन किया गया चैनल केवल तभी
अलग रीप्ले गार्ड रखता है जब गार्ड की पहचान या प्रतिधारण कतार से अधिक हो—
ऐसी तार्किक संदेश कुंजी जो ट्रांसपोर्ट डिलीवरी आईडी से भिन्न हो (Telegram
`chat_id:message_id` को डीडुप्लीकेट करता है क्योंकि डिबाउंस मर्ज किसी संदेश को
नए `update_id` के अंतर्गत फिर से सामने ला सकते हैं), या चैनल के
टूमस्टोन प्रतिधारण से अधिक लंबी अवधि हो। यदि आपकी गार्ड कुंजी ड्रेन
`event_id` के बराबर होगी, तो ड्रेन अपनाते समय गार्ड को हटा दें और इसके
बजाय पुरानी गार्ड अवधि को कवर करने के लिए
`completedTtlMs`/`completedMaxEntries` का आकार निर्धारित करें।
आयु सीमाओं जैसी गैर-डीडुप्लीकेशन सुरक्षाएँ इस नियम से असंबंधित हैं।
स्थिर आउटबाउंड संदेश आईडी चैनल-स्थानीय TTL कैश के बजाय
`openclaw/plugin-sdk/channel-outbound` से साझा आउटबाउंड-इको रजिस्ट्री का उपयोग करती हैं।

#### ट्रांसपोर्ट वर्ग और प्रतिधारण

किसी ट्रांसपोर्ट को उसकी प्राप्ति सीमा पर रिकवरी गारंटी के अनुसार वर्गीकृत करें:

- **अभिस्वीकृति-गेटेड Webhook या इवेंट डिलीवरी:** केवल टिकाऊ एपेंड के
  बाद अभिस्वीकृति दें या सफलता लौटाएँ। एपेंड विफलता की स्थिति में डिलीवरी को
  पुनः प्रयास के योग्य रहना चाहिए या प्राप्ति सीमा विफल होनी चाहिए। इस वर्ग में
  Slack, SMS, Zalo, Microsoft Teams, Google Chat, LINE और Synology Chat शामिल हैं।
- **प्रतीक्षित पोलिंग या स्ट्रीम डिलीवरी:** केवल एपेंड के बाद रिमोट
  कर्सर को आगे बढ़ाएँ या ट्रांसपोर्ट अभिस्वीकृति भेजें। जब कोई स्पष्ट कर्सर
  उपलब्ध न हो, तो प्राप्ति कॉलबैक को सीरियलाइज़्ड और प्रतीक्षित रखें, ताकि
  एपेंड विफलता प्राप्ति लूप को आगे न निकलने दे। Telegram पोलिंग, Signal और
  Tlon इस वर्ग का उपयोग करते हैं; Telegram Webhook डिलीवरी ऊपर दिए गए
  अभिस्वीकृति-गेटेड नियम का पालन करती है।
- **गैर-रीप्ले सॉकेट:** IRC, Mattermost, Twitch और Zalo Personal
  प्लेटफ़ॉर्म से स्वीकृत इवेंट को पुनः डिलीवर करने के लिए नहीं कह सकते।
  उनकी टिकाऊ कतार प्रक्रिया क्रैश अवधि की सुरक्षा करती है और स्थानीय पुनरारंभ
  रिकवरी का समर्थन करती है; पूर्णता टूमस्टोन प्लेटफ़ॉर्म रीप्ले के विरुद्ध
  लगभग निष्क्रिय होते हैं।

30 दिनों को फ़्लीट टूमस्टोन-TTL परंपरा के रूप में उपयोग करें, SDK डिफ़ॉल्ट के
रूप में नहीं। उच्च-वॉल्यूम पुनः डिलीवरी अवधि सामान्यतः 20,000-प्रविष्टि पूर्ण
सीमा का उपयोग करती है; कम-वॉल्यूम वाले प्रतीक्षित और गैर-रीप्ले ट्रांसपोर्ट
सामान्यतः 1,000-2,000 का उपयोग करते हैं। वर्तमान अपवादों में LINE की
4,096-प्रविष्टि सीमाएँ, SMS का 24-घंटे का पूर्णता TTL और Tlon का केवल-सीमा
पूर्णता प्रतिधारण शामिल हैं। विफल-पंक्ति सीमाएँ भी पूर्णता सीमाओं से कम हो सकती
हैं। TTL और सीमा दोनों पंक्तियों को छाँटते हैं, इसलिए प्रभावी प्रतिधारण पहली
सीमा पहुँचते ही समाप्त हो जाता है। केवल दस्तावेज़ीकृत प्लेटफ़ॉर्म पुनः प्रयास
अवधि, संरक्षित शिप किया गया रीप्ले-गार्ड अंतराल, अपेक्षित वॉल्यूम या डिस्क बजट,
या गैर-रीप्ले ट्रांसपोर्ट के लिए ही इससे अलग हों, और प्रतिधारण अनुबंध को
परीक्षणों से कवर करें।

#### कम-से-कम-एक-बार साइड इफ़ेक्ट

ड्रेन डिस्पैच प्रवेश पंक्ति के पूर्णता टूमस्टोन तक पहुँचने से पहले कमांड साइड
इफ़ेक्ट चलाता है। इन चरणों के बीच प्रक्रिया क्रैश होने पर पंक्ति रीप्ले होती है
और साइड इफ़ेक्ट फिर से निष्पादित हो सकता है। यह कम-से-कम-एक-बार क्रैश अवधि
डिफ़ॉल्ट अनुबंध है। कॉन्फ़िगरेशन लेखन, स्टोरेज साफ़ करने या उत्तर लेन के बाहर
दृश्यमान अभिस्वीकृतियों जैसे गैर-आइडेम्पोटेंट कार्य के लिए
`openclaw/plugin-sdk/ingress-effect-once` से `createIngressEffectOnce(...)` का उपयोग करें।
हर कॉल को स्थिर प्रवेश `eventId` और एक इफ़ेक्ट नाम दें। प्रत्येक
प्रवेश कतार/अकाउंट के लिए एक हेल्पर बनाएँ और उस दायरे के लिए स्थिर, अद्वितीय
`namespacePrefix` का उपयोग करें क्योंकि ट्रांसपोर्ट इवेंट आईडी कतार-स्थानीय
हो सकती हैं। हेल्पर अपनी टिकाऊ क्लेम केवल इफ़ेक्ट सफल होने के बाद कमिट करता है;
थ्रो किया गया इफ़ेक्ट क्लेम छोड़ देता है ताकि ड्रेन पुनः प्रयास उसे फिर निष्पादित
कर सके, जबकि समवर्ती कॉलर सक्रिय क्लेम की प्रतीक्षा करते हैं। टिकाऊ स्थिति
त्रुटियाँ उपलब्ध होने पर `onDiskError` को कॉल करती हैं और प्रक्रिया मेमोरी
पर फ़ॉलबैक करने के बजाय अनुरोध अस्वीकार करती हैं।

हेल्पर के `ttlMs` को कम-से-कम चैनल के प्रवेश टूमस्टोन प्रतिधारण और
इफ़ेक्ट कमिट तथा पंक्ति पूर्णता के बीच अधिकतम विलंब के योग पर सेट करें, जिसमें
सीमित डाउनटाइम और ड्रेन पुनः प्रयास शामिल हों। इफ़ेक्ट रिकॉर्ड का TTL कमिट पर
आरंभ होता है, जबकि टूमस्टोन प्रतिधारण बाद में पूर्णता पर आरंभ होता है; यदि लंबित
पंक्ति का जीवनकाल असीमित है, तो कोई सीमित TTL मनमाने डाउनटाइम को कवर नहीं करता।
टूमस्टोन द्वारा पंक्ति को रीप्ले न कर पाने के बाद पुराने इफ़ेक्ट रिकॉर्ड
अनावश्यक भार हैं। उस प्रतिधारण अवधि में मौजूद हो सकने वाली हर अलग
इवेंट/इफ़ेक्ट कुंजी के लिए `stateMaxEntries` का आकार निर्धारित करें, जिसमें
कतार की पूर्ण-प्रविष्टि सीमा और प्रति इवेंट अधिकतम इफ़ेक्ट शामिल हों। कम सीमा
सबसे पुराने रिकॉर्ड को उसके TTL से पहले बेदखल कर देती है और उस इफ़ेक्ट को फिर
से निष्पादित होने देती है। अवशिष्ट कम-से-कम-एक-बार अवधियाँ तब बनी रहती हैं
जब इफ़ेक्ट सफल होने के बाद लेकिन क्लेम कमिट होने से पहले प्रक्रिया बंद हो जाए
या स्थायित्व विफल हो जाए, अथवा रिकॉर्ड तब समाप्त हो जाए जब उसकी प्रवेश पंक्ति
अभी भी लंबित हो।

#### अकाउंट-दायरा पुनरारंभ अनुबंध

चैनल कॉन्फ़िगरेशन परिवर्तन डिफ़ॉल्ट रूप से पूरे चैनल को पुनरारंभ करते हैं।
बहु-अकाउंट चैनल केवल तभी `reload.accountScopedRestart: true` सेट कर सकता है जब कॉन्फ़िगरेशन
रिज़ॉल्यूशन चैनल-व्यापी साझा फ़ील्ड और चयनित अकाउंट को पढ़ता हो, कभी किसी
सिब्लिंग अकाउंट को नहीं, और Gateway सिब्लिंग रनटाइम बदले बिना एक
`(channel, accountId)` रनटाइम रोक तथा आरंभ कर सके।

दायरा-बद्ध पथ केवल `channels.<channel>.accounts.<non-default-id>.*` के अंतर्गत होने वाले परिवर्तनों पर लागू
होता है। साझा चैनल फ़ील्ड, `accounts.default`, हटाए गए या रिज़ॉल्व न किए जा
सकने वाले अकाउंट और इनहेरिटेंस को प्रभावित कर सकने वाले मिश्रित परिवर्तन पूरे
चैनल के पुनरारंभ में पदोन्नत किए जाते हैं। जो plugins इसे नहीं अपनाते, वे हमेशा
पूरे चैनल वाले पथ का उपयोग करते हैं।

टिकाऊ प्रवेश ड्रेन का उपयोग करने वाले चैनलों के लिए, अकाउंट मॉनिटर के रोकने
वाले पथ को पहले सभी स्वीकृत ट्रांसपोर्ट एडमिशन को पूर्ण करना चाहिए, फिर अपने
ड्रेन को डिस्पोज़ करके उसकी प्रतीक्षा करनी चाहिए। अकाउंट आरंभ करने पर वही
अकाउंट-कुंजी वाली कतार खुलती है, जिसका प्रारंभिक ड्रेन डिस्पैच न की गई टिकाऊ
पंक्तियों को रिकवर करता है। कोई दूसरा रीलोड-विशिष्ट रीप्ले पास न जोड़ें; कतार
रिकवरी ही प्रामाणिक पुनरारंभ पथ है।

इस फ़्लैग को प्रदर्शन प्राथमिकता नहीं, बल्कि क्षमता का दावा मानें। अनुबंध
परीक्षणों को सिद्ध करना चाहिए कि एक नामित अकाउंट जोड़ने और संपादित करने पर
सिब्लिंग का रिज़ॉल्व किया गया कॉन्फ़िगरेशन अपरिवर्तित रहता है, एक अकाउंट को
रोकने पर केवल उसी अकाउंट का मॉनिटर और ड्रेन पूर्ण होता है, और नया मॉनिटर उस
अकाउंट की पंक्तियों को ठीक एक बार रिकवर करता है। यदि किसी भी गारंटी को सिद्ध
नहीं किया जा सकता, तो फ़्लैग शामिल न करें।

### टाइपिंग संकेतक

यदि आपका चैनल इनबाउंड उत्तरों के बाहर टाइपिंग संकेतकों का समर्थन करता है,
तो चैनल Plugin पर `heartbeat.sendTyping(...)` उजागर करें। Heartbeat मॉडल रन आरंभ होने
से पहले कोर इसे रिज़ॉल्व किए गए Heartbeat डिलीवरी लक्ष्य के साथ कॉल करता है
और साझा टाइपिंग कीपअलाइव/क्लीनअप जीवनचक्र का उपयोग करता है। जब प्लेटफ़ॉर्म को
स्पष्ट रोक संकेत चाहिए, तो `heartbeat.clearTyping(...)` जोड़ें।

### मीडिया स्रोत पैरामीटर

यदि आपका चैनल मीडिया स्रोत रखने वाले संदेश-टूल पैरामीटर जोड़ता है, तो उन
पैरामीटर नामों को `plugin.actions.describeMessageTool(...).mediaSourceParams` के माध्यम से उजागर करें।
कोर सैंडबॉक्स पथ सामान्यीकरण और आउटबाउंड मीडिया-एक्सेस नीति के लिए इस स्पष्ट
सूची का उपयोग करता है, इसलिए plugins को प्रदाता-विशिष्ट अवतार, अटैचमेंट या
कवर-इमेज पैरामीटर के लिए साझा-कोर विशेष मामलों की आवश्यकता नहीं होती।

`{ "set-profile": ["avatarUrl", "avatarPath"] }` जैसे कार्रवाई-कुंजी वाले मैप को प्राथमिकता दें,
ताकि असंबंधित कार्रवाइयों को किसी अन्य कार्रवाई के मीडिया आर्ग्युमेंट विरासत में न मिलें। प्रत्येक उजागर कार्रवाई में जानबूझकर साझा किए गए पैरामीटर के लिए समतल ऐरे
अब भी काम करता है।

जिन चैनलों को प्लेटफ़ॉर्म-पक्षीय मीडिया फ़ेच के लिए अस्थायी सार्वजनिक URL उजागर करना
आवश्यक है, वे Plugin स्टेट स्टोर के साथ
`openclaw/plugin-sdk/outbound-media` से `createHostedOutboundMediaStore(...)` का उपयोग कर सकते हैं। प्लेटफ़ॉर्म
रूट पार्सिंग और टोकन प्रवर्तन चैनल Plugin में रखें; साझा हेल्पर
केवल मीडिया लोडिंग, समाप्ति मेटाडेटा, चंक पंक्तियों और क्लीनअप का स्वामी है।

### नेटिव पेलोड आकार निर्धारण

यदि आपके चैनल को `message(action="send")` के लिए प्रदाता-विशिष्ट आकार निर्धारण चाहिए,
तो `actions.prepareSendPayload(...)` को प्राथमिकता दें। नेटिव कार्ड, ब्लॉक, एम्बेड या
अन्य टिकाऊ डेटा को `payload.channelData.<channel>` के अंतर्गत रखें और कोर को
आउटबाउंड/संदेश अडैप्टर के माध्यम से भेजने दें। केवल उन पेलोड के लिए, जिन्हें सीरियलाइज़ करके
पुनः प्रयास नहीं किया जा सकता, संगतता फ़ॉलबैक के रूप में भेजने हेतु `actions.handleAction(...)` का
उपयोग करें।

### सेशन वार्तालाप व्याकरण

यदि आपका प्लेटफ़ॉर्म वार्तालाप आईडी में अतिरिक्त स्कोप संग्रहीत करता है, तो उस पार्सिंग को
Plugin में `messaging.resolveSessionConversation(...)` के साथ रखें। यह
`rawId` को मूल वार्तालाप आईडी, वैकल्पिक
थ्रेड आईडी, स्पष्ट `baseConversationId` और किसी भी
`parentConversationCandidates` से मैप करने का प्रामाणिक हुक है। जब आप `parentConversationCandidates`
लौटाएँ, तो उन्हें सबसे संकीर्ण पैरेंट से सबसे व्यापक/मूल वार्तालाप के क्रम में रखें।

`messaging.resolveParentConversationCandidates(...)` उन Plugin के लिए अप्रचलित
संगतता फ़ॉलबैक है, जिन्हें केवल सामान्य/कच्ची आईडी के ऊपर पैरेंट फ़ॉलबैक चाहिए।
यदि दोनों हुक मौजूद हों, तो कोर पहले
`resolveSessionConversation(...).parentConversationCandidates` का उपयोग करता है और प्रामाणिक
हुक द्वारा उन्हें छोड़े जाने पर ही `resolveParentConversationCandidates(...)` पर
फ़ॉलबैक करता है।

जिन बंडल किए गए Plugin को चैनल रजिस्ट्री शुरू होने से पहले समान पार्सिंग चाहिए,
वे मेल खाते `resolveSessionConversation(...)` एक्सपोर्ट वाली शीर्ष-स्तरीय
`session-key-api.ts` फ़ाइल उजागर कर सकते हैं (Feishu और Telegram
Plugin देखें)। कोर उस बूटस्ट्रैप-सुरक्षित सतह का उपयोग केवल तब करता है, जब रनटाइम Plugin
रजिस्ट्री अभी उपलब्ध न हो।

जब Plugin कोड को रूट-जैसे फ़ील्ड सामान्यीकृत करने, किसी चाइल्ड थ्रेड की उसके पैरेंट रूट से तुलना करने
या `{ channel, to, accountId, threadId }` से स्थिर डीडुप कुंजी बनाने की आवश्यकता हो, तब
`openclaw/plugin-sdk/channel-route` का उपयोग करें। हेल्पर
संख्यात्मक थ्रेड आईडी को उसी तरह सामान्यीकृत करता है जैसे कोर करता है, इसलिए तदर्थ
`String(threadId)` तुलनाओं के बजाय इसे प्राथमिकता दें। प्रदाता-विशिष्ट लक्ष्य व्याकरण वाले Plugin को
`messaging.resolveOutboundSessionRoute(...)` उजागर करना चाहिए, ताकि कोर को
पार्सर शिम के बिना प्रदाता-नेटिव सेशन और थ्रेड पहचान मिले।

### अकाउंट-स्कोप वाला वार्तालाप बाइंडिंग समर्थन

जब चैनल सामान्य वर्तमान-वार्तालाप बाइंडिंग का समर्थन करता हो, तब
`conversationBindings.supportsCurrentConversationBinding` सेट करें। `createChatChannelPlugin(...)`
इस स्थिर क्षमता को डिफ़ॉल्ट रूप से `true` पर सेट करता है।

यदि समर्थन कॉन्फ़िगर किए गए अकाउंट के अनुसार भिन्न होता है, तो
`conversationBindings.isCurrentConversationBindingSupported({ accountId })` भी लागू करें।
कोर इस सिंक्रोनस हुक का मूल्यांकन स्थिर क्षमता सक्षम होने के बाद ही करता है।
`false` लौटाने से उस अकाउंट के लिए सामान्य वर्तमान-वार्तालाप क्षमता,
बाइंड, लुकअप, सूची, टच और अनबाइंड संचालन अनुपलब्ध हो जाते हैं।
हुक को छोड़ने पर स्थिर क्षमता प्रत्येक अकाउंट पर लागू होती है।

उत्तर को पहले से लोड किए गए अकाउंट कॉन्फ़िगरेशन या रनटाइम स्थिति से हल करें। यह
हुक केवल सामान्य वर्तमान-वार्तालाप बाइंडिंग को नियंत्रित करता है; यह
कॉन्फ़िगर किए गए बाइंडिंग नियमों या Plugin-स्वामित्व वाली सेशन रूटिंग को प्रतिस्थापित नहीं करता। अनुबंध परीक्षणों में
`openclaw/plugin-sdk/channel-core` द्वारा एक्सपोर्ट किए गए
`ChannelPlugin["conversationBindings"]` अनुबंध के माध्यम से कम-से-कम एक समर्थित और एक असमर्थित अकाउंट
शामिल होना चाहिए।

## अनुमोदन और चैनल क्षमताएँ

अधिकांश चैनल Plugin को अनुमोदन-विशिष्ट कोड की आवश्यकता नहीं होती। कोर समान-चैट
`/approve`, साझा अनुमोदन बटन पेलोड और सामान्य फ़ॉलबैक डिलीवरी का स्वामी है।
`ChannelPlugin.approvals` हटा दिया गया था; इसके बजाय अनुमोदन डिलीवरी/नेटिव/रेंडर/प्रमाणीकरण
तथ्यों को एक `approvalCapability` ऑब्जेक्ट पर रखें। `plugin.auth` केवल लॉगिन/लॉगआउट
के लिए है—कोर अब उस ऑब्जेक्ट से अनुमोदन प्रमाणीकरण हुक नहीं पढ़ता।

`approvalCapability.delivery` का उपयोग केवल नेटिव अनुमोदन रूटिंग या फ़ॉलबैक
दमन के लिए करें, और `approvalCapability.render` का उपयोग केवल तब करें जब किसी चैनल को वास्तव में
साझा रेंडरर के बजाय कस्टम अनुमोदन पेलोड चाहिए।

### अनुमोदन प्रमाणीकरण

- `approvalCapability.authorizeActorAction` और
  `approvalCapability.getActionAvailabilityState` प्रामाणिक
  अनुमोदन-प्रमाणीकरण सीम हैं।
- समान-चैट अनुमोदन प्रमाणीकरण उपलब्धता के लिए `getActionAvailabilityState` का उपयोग करें।
  नेटिव डिलीवरी अक्षम होने पर भी कॉन्फ़िगर किए गए अनुमोदकों को `/approve` के लिए उपलब्ध रखें;
  इसके बजाय डिलीवरी/सेटअप मार्गदर्शन के लिए नेटिव आरंभिक-सतह स्थिति का उपयोग करें।
- यदि आपका चैनल नेटिव निष्पादन अनुमोदन उजागर करता है, तो
  जब आरंभिक-सतह/नेटिव-क्लाइंट स्थिति समान-चैट
  अनुमोदन प्रमाणीकरण से भिन्न हो, उसके लिए `approvalCapability.getExecInitiatingSurfaceState` का उपयोग करें।
  कोर उस निष्पादन-विशिष्ट हुक का उपयोग `enabled` बनाम
  `disabled` में अंतर करने, यह तय करने के लिए करता है कि आरंभिक चैनल नेटिव निष्पादन
  अनुमोदन का समर्थन करता है या नहीं, और चैनल को नेटिव-क्लाइंट फ़ॉलबैक मार्गदर्शन में शामिल करता है।
  सामान्य स्थिति में `createApproverRestrictedNativeApprovalCapability(...)` इसे भरता है।
- यदि कोई चैनल मौजूदा कॉन्फ़िगरेशन से स्थिर स्वामी-जैसी DM पहचान का अनुमान लगा सकता है,
  तो अनुमोदन-विशिष्ट कोर लॉजिक जोड़े बिना समान-चैट `/approve` को प्रतिबंधित करने के लिए
  `openclaw/plugin-sdk/approval-runtime` से `createResolvedApproverActionAuthAdapter` का उपयोग करें।
- यदि कस्टम अनुमोदन प्रमाणीकरण जानबूझकर केवल समान-चैट फ़ॉलबैक की अनुमति देता है, तो
  `openclaw/plugin-sdk/approval-auth-runtime` से `markImplicitSameChatApprovalAuthorization({ authorized: true })` लौटाएँ;
  अन्यथा कोर परिणाम को स्पष्ट अनुमोदक प्राधिकरण मानता है।
- यदि चैनल-स्वामित्व वाला नेटिव कॉलबैक अनुमोदनों को सीधे हल करता है, तो हल करने से पहले
  `isImplicitSameChatApprovalAuthorization(...)` का उपयोग करें, ताकि निहित
  फ़ॉलबैक फिर भी चैनल के सामान्य अभिकर्ता प्राधिकरण से होकर गुज़रे।

### पेलोड जीवनचक्र और सेटअप मार्गदर्शन

- चैनल-विशिष्ट पेलोड जीवनचक्र व्यवहार के लिए
  `outbound.shouldSuppressLocalPayloadPrompt` या `outbound.beforeDeliverPayload` का उपयोग करें,
  जैसे डुप्लिकेट स्थानीय अनुमोदन प्रॉम्प्ट छिपाना या डिलीवरी से पहले टाइपिंग
  संकेतक भेजना।
- जब चैनल चाहता हो कि अक्षम-पथ उत्तर नेटिव निष्पादन अनुमोदन सक्षम करने के लिए
  आवश्यक सटीक कॉन्फ़िगरेशन नॉब समझाए, तब `approvalCapability.describeExecApprovalSetup` का उपयोग करें।
  हुक को `{ channel, channelLabel, accountId }` प्राप्त होता है;
  नामित-अकाउंट चैनलों को शीर्ष-स्तरीय
  डिफ़ॉल्ट के बजाय `channels.<channel>.accounts.<id>.execApprovals.*` जैसे अकाउंट-स्कोप वाले पथ रेंडर करने चाहिए।
- जब Plugin अनुमोदन विफलता मार्गदर्शन को Plugin अनुमोदन के नो-रूट और टाइमआउट
  विफलताओं के लिए दिखाना सुरक्षित हो, तब `approvalCapability.describePluginApprovalSetup` का उपयोग करें।
  `createApproverRestrictedNativeApprovalCapability(...)`, `describeExecApprovalSetup` से
  इसका अनुमान नहीं लगाता; समान हेल्पर को स्पष्ट रूप से तभी पास करें,
  जब Plugin और निष्पादन अनुमोदन वास्तव में समान नेटिव सेटअप का उपयोग करते हों।

### नेटिव अनुमोदन डिलीवरी

यदि किसी चैनल को नेटिव अनुमोदन डिलीवरी चाहिए, तो चैनल कोड को
लक्ष्य सामान्यीकरण और ट्रांसपोर्ट/प्रस्तुति तथ्यों पर केंद्रित रखें।
`openclaw/plugin-sdk/approval-runtime` से
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` और
`createApproverRestrictedNativeApprovalCapability` का उपयोग करें। चैनल-विशिष्ट तथ्यों को
`approvalCapability.nativeRuntime` के पीछे रखें, आदर्श रूप से
`createChannelApprovalNativeRuntimeAdapter(...)` या
`createLazyChannelApprovalNativeRuntimeAdapter(...)` के माध्यम से, ताकि कोर
हैंडलर को संयोजित कर सके और अनुरोध फ़िल्टरिंग, रूटिंग, डीडुप, समाप्ति, Gateway
सदस्यता तथा अन्यत्र-रूट किए गए नोटिस का स्वामी रहे।

`nativeRuntime` को कुछ छोटे सीम में विभाजित किया गया है:

- `availability` - क्या अकाउंट कॉन्फ़िगर किया गया है और क्या किसी अनुरोध को
  संभाला जाना चाहिए
- `presentation` - साझा अनुमोदन दृश्य मॉडल को
  लंबित/हल किए गए/समाप्त नेटिव पेलोड या अंतिम कार्रवाइयों में मैप करें
- `transport` - लक्ष्य तैयार करें और नेटिव अनुमोदन
  संदेश भेजें/अपडेट करें/हटाएँ
- `interactions` - नेटिव बटन
  या प्रतिक्रियाओं के लिए वैकल्पिक बाइंड/अनबाइंड/कार्रवाई-साफ़ करने वाले हुक, साथ ही एक वैकल्पिक `cancelDelivered` हुक। जब
  `deliverPending` इन-प्रोसेस या स्थायी
  स्थिति (जैसे प्रतिक्रिया लक्ष्य स्टोर) पंजीकृत करता है, तब `cancelDelivered` लागू करें,
  ताकि यदि हैंडलर रुकने से `bindPending` चलने से पहले डिलीवरी रद्द हो जाए,
  या जब `bindPending` कोई हैंडल न लौटाए, तब उस स्थिति को रिलीज़ किया जा सके
- `observe` - वैकल्पिक डिलीवरी निदान हुक

अन्य अनुमोदन हेल्पर:

- जब कोई चैनल सेशन-मूल नेटिव डिलीवरी और स्पष्ट अनुमोदन फ़ॉरवर्डिंग लक्ष्य,
  दोनों का समर्थन करता हो, तब `openclaw/plugin-sdk/approval-native-runtime` से
  `createNativeApprovalChannelRouteGates` का उपयोग करें। यह
  हेल्पर अनुमोदन कॉन्फ़िगरेशन चयन, `mode` प्रबंधन, एजेंट/सेशन
  फ़िल्टर, अकाउंट बाइंडिंग, सेशन-लक्ष्य मिलान और लक्ष्य-सूची मिलान को केंद्रीकृत करता है,
  जबकि कॉलर अब भी चैनल आईडी, डिफ़ॉल्ट फ़ॉरवर्डिंग मोड, अकाउंट
  लुकअप, ट्रांसपोर्ट-सक्षम जाँच, लक्ष्य सामान्यीकरण और टर्न-स्रोत
  लक्ष्य समाधान के स्वामी रहते हैं। इसका उपयोग कोर-स्वामित्व वाले चैनल नीति
  डिफ़ॉल्ट बनाने के लिए न करें; चैनल का दस्तावेज़ीकृत डिफ़ॉल्ट मोड स्पष्ट रूप से पास करें।
- `createChannelNativeOriginTargetResolver`, `{ to, accountId, threadId }` लक्ष्यों के लिए डिफ़ॉल्ट रूप से साझा चैनल-रूट
  मैचर का उपयोग करता है। `targetsMatch` केवल तभी पास करें, जब किसी चैनल में प्रदाता-विशिष्ट समतुल्यता नियम हों,
  जैसे Slack टाइमस्टैम्प प्रीफ़िक्स मिलान। जब चैनल को डिफ़ॉल्ट रूट
  मैचर या कस्टम `targetsMatch` कॉलबैक चलने से पहले प्रदाता आईडी को प्रामाणिक रूप देना हो,
  और साथ ही डिलीवरी के लिए मूल लक्ष्य संरक्षित रखना हो, तब `normalizeTargetForMatch` पास करें।
  `normalizeTarget` का उपयोग केवल तब करें, जब हल किए गए
  डिलीवरी लक्ष्य को ही प्रामाणिक रूप दिया जाना चाहिए।
- यदि चैनल को क्लाइंट, टोकन, Bolt
  ऐप या Webhook रिसीवर जैसे रनटाइम-स्वामित्व वाले ऑब्जेक्ट चाहिए, तो उन्हें
  `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से पंजीकृत करें। सामान्य रनटाइम-संदर्भ
  रजिस्ट्री कोर को अनुमोदन-विशिष्ट रैपर ग्लू जोड़े बिना चैनल
  स्टार्टअप स्थिति से क्षमता-संचालित हैंडलर बूटस्ट्रैप करने देती है।
- निम्न-स्तरीय `createChannelApprovalHandler` या
  `createChannelNativeApprovalRuntime` का उपयोग केवल तब करें, जब क्षमता-संचालित सीम
  अभी पर्याप्त अभिव्यंजक न हो।
- नेटिव अनुमोदन चैनलों को `accountId` और `approvalKind`, दोनों को
  उन हेल्पर के माध्यम से रूट करना आवश्यक है। `accountId` बहु-अकाउंट अनुमोदन नीति को
  सही बॉट अकाउंट तक सीमित रखता है, और `approvalKind` निष्पादन बनाम Plugin
  अनुमोदन व्यवहार को कोर में हार्डकोडेड शाखाओं के बिना चैनल के लिए उपलब्ध रखता है।
- कोर अनुमोदन पुनः-रूट नोटिस का भी स्वामी है। चैनल Plugin को
  `createChannelNativeApprovalRuntime` से अपने "अनुमोदन DM / किसी अन्य चैनल पर गया" फ़ॉलो-अप संदेश
  नहीं भेजने चाहिए; इसके बजाय साझा अनुमोदन क्षमता हेल्पर के माध्यम से सटीक मूल +
  अनुमोदक-DM रूटिंग उजागर करें और आरंभिक चैट में कोई नोटिस वापस पोस्ट करने से पहले
  कोर को वास्तविक डिलीवरी एकत्रित करने दें।
- डिलीवर की गई अनुमोदन आईडी का प्रकार शुरू से अंत तक संरक्षित रखें। नेटिव क्लाइंट को
  चैनल-स्थानीय स्थिति से निष्पादन बनाम Plugin अनुमोदन रूटिंग का अनुमान या पुनर्लेखन नहीं करना चाहिए।
- उस स्पष्ट `approvalKind` को `resolveApprovalOverGateway` में पास करें। यह
  प्रामाणिक `approval.resolve` सेवा का उपयोग करता है और जब कोई अन्य सतह पहले उत्तर देती है,
  तब दर्ज विजेता लौटाता है। पुराना स्पष्ट `resolveMethod` इनपुट
  कमांड-समर्थित नियंत्रणों के लिए बना हुआ है; नई नेटिव कार्रवाइयों को इसका उपयोग नहीं करना चाहिए और न ही
  किसी आईडी से प्रकार का अनुमान लगाना चाहिए।
- अलग-अलग अनुमोदन प्रकार जानबूझकर अलग-अलग नेटिव
  सतह उजागर कर सकते हैं। वर्तमान बंडल किए गए उदाहरण: Matrix निष्पादन और Plugin अनुमोदनों के लिए समान नेटिव DM/चैनल
  रूटिंग और प्रतिक्रिया UX बनाए रखता है, जबकि अनुमोदन प्रकार के अनुसार प्रमाणीकरण को अलग होने देता है;
  Slack निष्पादन और Plugin आईडी, दोनों के लिए नेटिव अनुमोदन रूटिंग उपलब्ध रखता है।
- `createApproverRestrictedNativeApprovalAdapter` अब भी
  संगतता रैपर के रूप में मौजूद है, लेकिन नए कोड को क्षमता बिल्डर को प्राथमिकता देनी चाहिए
  और Plugin पर `approvalCapability` उजागर करना चाहिए।

### अधिक संकीर्ण अनुमोदन रनटाइम उपपथ

हॉट चैनल एंट्रीपॉइंट के लिए, जब आपको उस परिवार का केवल एक भाग चाहिए,
तो व्यापक `approval-runtime` बैरल के बजाय इन अधिक संकीर्ण उपपथों को प्राथमिकता दें:

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
`openclaw/plugin-sdk/reply-reference` और
`openclaw/plugin-sdk/reply-chunking` को प्राथमिकता दें।

### सेटअप उपपथ

- `openclaw/plugin-sdk/setup-runtime` रनटाइम-सुरक्षित सेटअप सहायकों को समाहित करता है:
  `createSetupTranslator`, इम्पोर्ट-सुरक्षित सेटअप पैच अडैप्टर
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), लुकअप-नोट आउटपुट,
  `promptResolvedAllowFrom`, `splitSetupEntries`, और प्रत्यायोजित
  सेटअप-प्रॉक्सी बिल्डर।
- `openclaw/plugin-sdk/channel-setup` वैकल्पिक-इंस्टॉल सेटअप
  बिल्डरों के साथ कुछ सेटअप-सुरक्षित प्रिमिटिव को समाहित करता है: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled`, और `splitSetupEntries`।
- व्यापक `openclaw/plugin-sdk/setup` सीम का उपयोग केवल तभी करें, जब आपको
  `moveSingleAccountChannelSectionToDefaultAccount(...)` जैसे अधिक भारी साझा सेटअप/कॉन्फ़िगरेशन
  सहायकों की भी आवश्यकता हो।

यदि आपका चैनल सेटअप सतहों में केवल "पहले यह Plugin इंस्टॉल करें" बताना चाहता है,
तो `createOptionalChannelSetupSurface(...)` को प्राथमिकता दें। जनरेट किया गया
अडैप्टर/विज़ार्ड कॉन्फ़िगरेशन लेखन और अंतिमकरण में विफलता पर बंद हो जाता है, और सत्यापन,
अंतिमकरण तथा दस्तावेज़-लिंक की प्रतिलिपि में उसी इंस्टॉल-आवश्यक संदेश का
पुनः उपयोग करता है।

यदि आपका चैनल एनवायरनमेंट-आधारित सेटअप या प्रमाणीकरण का समर्थन करता है, तो उसे
चैनल कॉन्फ़िगरेशन स्कीमा और सेटअप डिस्क्रिप्टर के माध्यम से उजागर करें। ऑपरेटर-सामना
पाठ के लिए ही चैनल रनटाइम `envVars` या स्थानीय स्थिरांक रखें।

यदि Plugin रनटाइम शुरू होने से पहले आपका चैनल `status`, `channels list`, `channels status`, या
SecretRef स्कैन में दिखाई दे सकता है, तो `package.json` में
`openclaw.setupEntry` जोड़ें। वह एंट्रीपॉइंट केवल-पठन कमांड
पथों में इम्पोर्ट करने के लिए सुरक्षित होना चाहिए और उन सारांशों के लिए आवश्यक
चैनल मेटाडेटा, सेटअप-सुरक्षित कॉन्फ़िगरेशन अडैप्टर, स्थिति अडैप्टर और चैनल सीक्रेट
लक्ष्य मेटाडेटा लौटाना चाहिए। सेटअप एंट्री से क्लाइंट, लिसनर या ट्रांसपोर्ट रनटाइम
शुरू न करें।

मुख्य चैनल एंट्री का इम्पोर्ट पथ भी सीमित रखें। डिस्कवरी चैनल सक्रिय किए बिना
क्षमताएँ पंजीकृत करने के लिए एंट्री और चैनल Plugin मॉड्यूल का मूल्यांकन कर सकती है।
`channel-plugin-api.ts` जैसी फ़ाइलों को सेटअप विज़ार्ड, ट्रांसपोर्ट
क्लाइंट, सॉकेट लिसनर, सबप्रोसेस लॉन्चर या सेवा स्टार्टअप मॉड्यूल इम्पोर्ट किए बिना
चैनल Plugin ऑब्जेक्ट एक्सपोर्ट करना चाहिए। उन रनटाइम भागों को `registerFull(...)`,
रनटाइम सेटर या लेज़ी क्षमता अडैप्टर से लोड होने वाले मॉड्यूल में रखें।

### अन्य सीमित चैनल उपपथ

अन्य सक्रिय चैनल पथों के लिए, व्यापक पुराने सतहों के बजाय सीमित सहायकों को
प्राथमिकता दें:

- बहु-अकाउंट कॉन्फ़िगरेशन और
  डिफ़ॉल्ट-अकाउंट फ़ॉलबैक के लिए `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, और
  `openclaw/plugin-sdk/account-helpers`
- इनबाउंड रूट/एनवेलप और
  रिकॉर्ड-एंड-डिस्पैच वायरिंग के लिए `openclaw/plugin-sdk/inbound-envelope` और
  `openclaw/plugin-sdk/channel-inbound`
- लक्ष्य पार्सिंग सहायकों के लिए `openclaw/plugin-sdk/channel-targets`
- आउटबाउंड पहचान/प्रेषण प्रतिनिधियों
  और टाइप किए गए पेलोड नियोजन के लिए `openclaw/plugin-sdk/channel-outbound`
- `openclaw/plugin-sdk/channel-core` से
  `buildThreadAwareOutboundSessionRoute(...)`, जब किसी आउटबाउंड रूट को स्पष्ट
  `replyToId`/`threadId` बनाए रखना हो या आधार सेशन कुंजी का मिलान अभी भी होने पर वर्तमान `:thread:`
  सेशन पुनर्प्राप्त करना हो। जब प्लेटफ़ॉर्म में मूल थ्रेड डिलीवरी सिमेंटिक्स हों, तो
  प्रदाता Plugin प्राथमिकता, सफ़िक्स व्यवहार और थ्रेड आईडी सामान्यीकरण को
  ओवरराइड कर सकते हैं।
- थ्रेड-बाइंडिंग जीवनचक्र
  और अडैप्टर पंजीकरण के लिए `openclaw/plugin-sdk/thread-bindings-runtime`

केवल-प्रमाणीकरण चैनल सामान्यतः डिफ़ॉल्ट पथ तक सीमित रह सकते हैं: कोर स्वीकृतियाँ
संभालता है और Plugin केवल आउटबाउंड/प्रमाणीकरण क्षमताएँ उजागर करता है। Matrix,
Slack, Telegram और कस्टम चैट ट्रांसपोर्ट जैसे मूल स्वीकृति चैनलों को अपना
स्वीकृति जीवनचक्र स्वयं बनाने के बजाय साझा मूल सहायकों का उपयोग करना चाहिए।

## इनबाउंड उल्लेख नीति

इनबाउंड उल्लेख प्रबंधन को दो परतों में विभाजित रखें:

- Plugin-स्वामित्व वाला साक्ष्य संग्रह
- साझा नीति मूल्यांकन

उल्लेख-नीति निर्णयों के लिए `openclaw/plugin-sdk/channel-mention-gating` का उपयोग करें।
व्यापक इनबाउंड सहायक बैरल की आवश्यकता होने पर ही `openclaw/plugin-sdk/channel-inbound`
का उपयोग करें।

Plugin-स्थानीय लॉजिक के लिए उपयुक्त:

- बॉट को दिए गए उत्तर का पता लगाना
- उद्धृत बॉट का पता लगाना
- थ्रेड-भागीदारी जाँच
- सेवा/सिस्टम-संदेश अपवर्जन
- बॉट की भागीदारी सिद्ध करने के लिए आवश्यक प्लेटफ़ॉर्म-मूल कैश

साझा सहायक के लिए उपयुक्त:

- `requireMention`
- स्पष्ट उल्लेख परिणाम
- अप्रत्यक्ष उल्लेख अनुमति-सूची
- कमांड बायपास
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

`matchesMentionWithExplicit(...)` बूलियन लौटाता है। `hasAnyMention`,
`isExplicitlyMentioned`, और `canResolveExplicit` चैनल के अपने
मूल उल्लेख मेटाडेटा (संदेश एंटिटी, बॉट को उत्तर देने के फ़्लैग और इसी प्रकार की चीज़ें) से आते हैं;
यदि आपका प्लेटफ़ॉर्म उनका पता नहीं लगा सकता, तो `false`/`undefined` मान दें।

`api.runtime.channel.mentions` उन बंडल किए गए चैनल Plugin के लिए
वही साझा उल्लेख सहायक उजागर करता है, जो पहले से रनटाइम इंजेक्शन पर निर्भर हैं:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`।

यदि आपको केवल `implicitMentionKindWhen` और `resolveInboundMentionDecision` की आवश्यकता है,
तो असंबंधित इनबाउंड रनटाइम सहायक लोड होने से बचाने के लिए
`openclaw/plugin-sdk/channel-mention-gating` से इम्पोर्ट करें।

## चरणबद्ध विवरण

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="पैकेज और मैनिफ़ेस्ट">
    मानक Plugin फ़ाइलें बनाएँ। `openclaw.plugin.json` में
    `channels` फ़ील्ड (`kind` फ़ील्ड नहीं) ही किसी मैनिफ़ेस्ट को
    चैनल का स्वामी चिह्नित करती है। पूर्ण पैकेज-मेटाडेटा सतह के लिए
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

    `configSchema`, `plugins.entries.acme-chat.config` को सत्यापित करता है। इसका उपयोग
    उन Plugin-स्वामित्व वाली सेटिंग्स के लिए करें, जो चैनल अकाउंट कॉन्फ़िगरेशन नहीं हैं।
    `channelConfigs.acme-chat.schema`, `channels.acme-chat` को सत्यापित करता है और
    Plugin रनटाइम लोड होने से पहले कॉन्फ़िगरेशन स्कीमा, सेटअप और UI सतहों द्वारा उपयोग किया जाने वाला
    कोल्ड-पथ स्रोत है। शीर्ष-स्तरीय फ़ील्ड के पूर्ण संदर्भ के लिए
    [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) देखें।

  </Step>

  <Step title="चैनल Plugin ऑब्जेक्ट बनाएँ">
    `ChannelPlugin` इंटरफ़ेस में कई वैकल्पिक अडैप्टर सतहें हैं। न्यूनतम -
    `id`, `config`, और `setup` - से शुरू करें और आवश्यकता के अनुसार
    अडैप्टर जोड़ें।

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

    उन चैनलों के लिए जो कैनोनिकल शीर्ष-स्तरीय DM कुंजियाँ और पुरानी नेस्टेड कुंजियाँ, दोनों स्वीकार करते हैं, `plugin-sdk/channel-config-helpers` के हेल्पर का उपयोग करें: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, और `normalizeChannelDmPolicy` अकाउंट-स्थानीय मानों को इनहेरिट किए गए रूट मानों से पहले रखते हैं। उसी रिज़ॉल्वर को `normalizeLegacyDmAliases` के माध्यम से doctor सुधार के साथ जोड़ें, ताकि रनटाइम और माइग्रेशन एक ही अनुबंध पढ़ें।

    <Accordion title="createChatChannelPlugin आपके लिए क्या करता है">
      निम्न-स्तरीय अडैप्टर इंटरफ़ेस को मैन्युअल रूप से लागू करने के बजाय, आप
      घोषणात्मक विकल्प देते हैं और बिल्डर उन्हें संयोजित करता है:

      | विकल्प | यह क्या जोड़ता है |
      | --- | --- |
      | `security.dm` | कॉन्फ़िग फ़ील्ड से स्कोप किया गया DM सुरक्षा रिज़ॉल्वर |
      | `pairing.text` | कोड विनिमय के साथ टेक्स्ट-आधारित DM पेयरिंग प्रवाह |
      | `threading` | उत्तर-मोड रिज़ॉल्वर (निश्चित, अकाउंट-स्कोप किया गया या कस्टम) |
      | `outbound.attachedResults` | परिणाम मेटाडेटा (संदेश ID) लौटाने वाले प्रेषण फ़ंक्शन; इसके लिए समान स्तर का `channel` id आवश्यक है, ताकि कोर लौटाए गए डिलीवरी परिणाम पर मुहर लगा सके |

      यदि आपको पूर्ण नियंत्रण चाहिए, तो आप घोषणात्मक विकल्पों के बजाय सीधे
      अडैप्टर ऑब्जेक्ट भी दे सकते हैं।

      रॉ आउटबाउंड अडैप्टर एक `chunker(text, limit, ctx)` फ़ंक्शन परिभाषित कर सकते हैं।
      वैकल्पिक `ctx.formatting` डिलीवरी-समय के फ़ॉर्मैटिंग निर्णय रखता है,
      जैसे `maxLinesPerMessage`; इसे भेजने से पहले लागू करें, ताकि उत्तर थ्रेडिंग
      और खंड सीमाएँ साझा आउटबाउंड डिलीवरी द्वारा केवल एक बार निर्धारित हों।
      जब कोई नेटिव उत्तर लक्ष्य निर्धारित हो जाता है, तो प्रेषण संदर्भों में
      `replyToIdSource` (`implicit` या `explicit`) भी शामिल होता है,
      ताकि पेलोड हेल्पर किसी अंतर्निहित एकल-उपयोग उत्तर स्लॉट का उपभोग किए बिना
      स्पष्ट उत्तर टैग सुरक्षित रख सकें।
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

    चैनल-स्वामित्व वाले CLI डिस्क्रिप्टर `registerCliMetadata(...)` में रखें, ताकि OpenClaw
    पूर्ण चैनल रनटाइम सक्रिय किए बिना उन्हें रूट सहायता में दिखा सके,
    जबकि सामान्य पूर्ण लोड वास्तविक कमांड पंजीकरण के लिए उन्हीं डिस्क्रिप्टर को
    प्राप्त करते रहें। केवल रनटाइम कार्य के लिए `registerFull(...)` रखें।
    `defineChannelPluginEntry` पंजीकरण-मोड विभाजन को स्वचालित रूप से संभालता है।
    यदि `registerFull(...)` Gateway RPC विधियाँ पंजीकृत करता है, तो
    Plugin-विशिष्ट प्रीफ़िक्स का उपयोग करें। कोर व्यवस्थापक नेमस्पेस (`config.*`,
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

    चैनल अक्षम या अनकॉन्फ़िगर होने पर OpenClaw पूर्ण एंट्री के बजाय इसे लोड करता है।
    यह सेटअप प्रवाहों के दौरान भारी रनटाइम कोड लोड होने से बचाता है।
    विवरण के लिए [सेटअप और कॉन्फ़िग](/hi/plugins/sdk-setup#setup-entry) देखें।

    बंडल किए गए वर्कस्पेस चैनल, जो सेटअप-सुरक्षित एक्सपोर्ट को साइडकार
    मॉड्यूल में विभाजित करते हैं, `openclaw/plugin-sdk/channel-entry-contract` से
    `defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं, जब उन्हें
    स्पष्ट सेटअप-समय रनटाइम सेटर की भी आवश्यकता हो।

  </Step>

  <Step title="इनबाउंड संदेश संभालें">
    आपके Plugin को प्लेटफ़ॉर्म से संदेश प्राप्त करके उन्हें OpenClaw को
    अग्रेषित करना होगा। सामान्य पैटर्न एक Webhook है, जो अनुरोध सत्यापित करता है और
    उसे आपके चैनल के इनबाउंड हैंडलर के माध्यम से प्रेषित करता है:

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
      इनबाउंड संदेश प्रबंधन चैनल-विशिष्ट है। प्रत्येक चैनल Plugin अपनी
      इनबाउंड पाइपलाइन का स्वामी होता है। वास्तविक पैटर्न के लिए बंडल किए गए चैनल Plugin
      (उदाहरण के लिए Microsoft Teams या Google Chat Plugin पैकेज) देखें।
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="परीक्षण करें">
`src/channel.test.ts` में साथ स्थित परीक्षण लिखें:

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

    साझा परीक्षण हेल्पर के लिए [परीक्षण](/hi/plugins/sdk-testing) देखें।

</Step>
</Steps>

## फ़ाइल संरचना

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel मेटाडेटा
├── openclaw.plugin.json      # कॉन्फ़िग स्कीमा वाला मैनिफ़ेस्ट
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
    निश्चित, अकाउंट-स्कोप किए गए या कस्टम उत्तर मोड
  </Card>
  <Card title="संदेश टूल एकीकरण" icon="puzzle" href="/hi/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool और कार्रवाई खोज
  </Card>
  <Card title="लक्ष्य निर्धारण" icon="crosshair" href="/hi/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="रनटाइम हेल्पर" icon="settings" href="/hi/plugins/sdk-runtime">
    api.runtime के माध्यम से TTS, STT, मीडिया, सबएजेंट
  </Card>
  <Card title="चैनल इनबाउंड API" icon="bolt" href="/hi/plugins/sdk-channel-inbound">
    साझा इनबाउंड इवेंट जीवनचक्र: ग्रहण, निर्धारण, रिकॉर्डिंग, प्रेषण, अंतिम रूप देना
  </Card>
</CardGroup>

<Note>
बंडल किए गए Plugin के रखरखाव और संगतता के लिए कुछ बंडल किए गए हेल्पर सीम अभी भी
मौजूद हैं। नए चैनल Plugin के लिए ये अनुशंसित पैटर्न नहीं हैं;
जब तक आप उस बंडल किए गए Plugin परिवार का सीधे रखरखाव नहीं कर रहे हों, सामान्य SDK
सतह के जेनेरिक चैनल/सेटअप/उत्तर/रनटाइम सबपाथ को प्राथमिकता दें।
</Note>

## अगले चरण

- [प्रोवाइडर Plugin](/hi/plugins/sdk-provider-plugins) - यदि आपका Plugin मॉडल भी प्रदान करता है
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूर्ण सबपाथ इम्पोर्ट संदर्भ
- [SDK परीक्षण](/hi/plugins/sdk-testing) - परीक्षण उपयोगिताएँ और अनुबंध परीक्षण
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - पूर्ण मैनिफ़ेस्ट स्कीमा

## संबंधित

- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [एजेंट हार्नेस Plugin](/hi/plugins/sdk-agent-harness)
