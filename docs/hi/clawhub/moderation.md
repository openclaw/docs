---
read_when:
    - किसी skill, plugin या package की रिपोर्ट करना
    - रोकी गई, छिपी हुई, या अवरुद्ध लिस्टिंग से रिकवरी
    - ClawHub मॉडरेशन, प्रतिबंधों या खाते की स्थिति को समझना
sidebarTitle: Moderation and Account Safety
summary: ClawHub की रिपोर्ट, मॉडरेशन होल्ड, छिपी हुई लिस्टिंग, प्रतिबंध और खाते की स्थिति कैसे काम करते हैं।
title: मॉडरेशन और खाता सुरक्षा
x-i18n:
    generated_at: "2026-07-03T13:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# मॉडरेशन और खाता सुरक्षा

ClawHub प्रकाशन के लिए खुला है, लेकिन सार्वजनिक खोज और इंस्टॉल सतहों को अब भी
सुरक्षा नियंत्रणों की आवश्यकता होती है। रिपोर्ट, मॉडरेशन होल्ड, छिपी हुई लिस्टिंग, और खाते पर कार्रवाइयां
उपयोगकर्ताओं की सुरक्षा में मदद करती हैं जब कोई रिलीज़ या खाता असुरक्षित, भ्रामक, या नीति से बाहर
दिखाई देता है।

यह पृष्ठ मॉडरेशन और खाते की स्थिति को कवर करता है। ऑडिट लेबल जैसे
`Pass`, `Review`, `Warn`, `Malicious`, और जोखिम स्तर के लिए, देखें
[सुरक्षा ऑडिट](/clawhub/security-audits).

यह भी देखें [सुरक्षा](/clawhub/security) और
[स्वीकार्य उपयोग](/clawhub/acceptable-usage). कॉपीराइट या अन्य सामग्री
अधिकार संबंधी चिंताओं के लिए, [सामग्री अधिकार अनुरोध](/clawhub/content-rights) का उपयोग करें।

## रिपोर्ट

साइन-इन किए हुए उपयोगकर्ता skills, plugins, और packages की रिपोर्ट कर सकते हैं।

ClawHub रिपोर्ट का उपयोग केवल असुरक्षित marketplace सामग्री के लिए करें, जैसे:

- दुर्भावनापूर्ण लिस्टिंग
- भ्रामक मेटाडेटा
- अघोषित क्रेडेंशियल या अनुमति आवश्यकताएं
- संदिग्ध इंस्टॉल निर्देश
- प्रतिरूपण
- दुर्भावनापूर्ण पंजीकरण या ट्रेडमार्क का दुरुपयोग
- ऐसी सामग्री जो [स्वीकार्य उपयोग](/clawhub/acceptable-usage) का उल्लंघन करती है

skill पृष्ठ पर **skill की रिपोर्ट करें** बटन, या packages के लिए package reporting
command/API का उपयोग करें।

किसी तृतीय-पक्ष skill या
plugin के अपने source code में कमजोरियों के लिए ClawHub रिपोर्ट का उपयोग न करें। उनकी रिपोर्ट सीधे प्रकाशक या लिस्टिंग से जुड़े source
repository को करें। ClawHub तृतीय-पक्ष skill या plugin code का रखरखाव या patch
नहीं करता।

`openclaw/clawhub` के लिए GitHub सुरक्षा सलाहें
ClawHub में ही मौजूद कमजोरियों के लिए हैं। उदाहरणों में website, API, CLI, registry, auth,
scanning, moderation, या download/install trust boundaries में bugs शामिल हैं। तृतीय-पक्ष skills या plugins में कमजोरियों के लिए ClawHub
advisories का उपयोग न करें।

अच्छी रिपोर्ट विशिष्ट और कार्रवाई योग्य होती हैं। रिपोर्टिंग का दुरुपयोग खुद भी
खाते पर कार्रवाई का कारण बन सकता है।

## संगठन और namespace दावे

Org, brand, package-scope, owner-handle, या namespace ownership विवादों को
[संगठन और Namespace दावे](/clawhub/namespace-claims) प्रक्रिया का उपयोग करना चाहिए, न कि
in-product report flow या account appeal form का।

इस प्रक्रिया का उपयोग तब करें जब आपको ClawHub staff से ऐसे गैर-संवेदनशील प्रमाण की समीक्षा चाहिए कि कोई
namespace reserved, transferred, renamed, hidden, quarantined, aliased,
या अन्यथा reviewed होना चाहिए। किसी सार्वजनिक issue में secrets, private documents, private legal
files, personal identity documents, API tokens, या DNS challenge tokens शामिल न करें।

## मॉडरेशन होल्ड

कुछ गंभीर findings या policy issues किसी publisher या listing को
moderation hold के तहत रख सकते हैं। ऐसा होने पर, प्रभावित सामग्री public
discovery से छिपाई जा सकती है या भविष्य के publishes issue की समीक्षा होने तक hidden के रूप में शुरू हो सकते हैं।

Moderation holds का उद्देश्य ClawHub द्वारा high-risk
cases हल किए जाने तक users की सुरक्षा करना है। False positive की पुष्टि होने पर इन्हें हटाया भी जा सकता है।

## छिपी हुई या ब्लॉक की गई लिस्टिंग

कोई listing public install surfaces पर held, hidden, quarantined, revoked, या अन्यथा unavailable हो सकती है।

यदि आपको इनमें से कोई state दिखे, तो release install न करें जब तक owner
issue हल न करे या moderation उसे restore न करे।

Owners अपनी held या hidden listings के लिए diagnostics अब भी देख सकते हैं। ये
diagnostics यह समझाने में मदद करते हैं कि क्या हुआ और listing को public surfaces पर वापस लाने से पहले
क्या बदलना होगा।

## प्रतिबंध और खाते की स्थिति

ClawHub policy का उल्लंघन करने वाले accounts publishing access खो सकते हैं। गंभीर abuse के परिणामस्वरूप
account bans, token revocation, hidden content, या removed listings हो सकते हैं।
Publisher abuse pressure signals रोज़ जांचे जाते हैं। जो signals
ClawHub की potential-ban threshold तक पहुंचते हैं, वे automatic warning trigger कर सकते हैं। यदि warning deadline के बाद अगला
eligible scan अब भी publisher को
potential-ban threshold में रखता है, तो ClawHub account action automatically लागू कर सकता है।
Lower-confidence और bounded temporal review signals automatic
enforcement से बाहर रहते हैं।

Deleted, banned, या disabled accounts ClawHub API tokens का उपयोग नहीं कर सकते। यदि CLI auth
account action के बाद fail होने लगे, तो account
state की समीक्षा के लिए web UI में sign in करें। यदि sign-in या सामान्य CLI access ban या disabled account के कारण blocked है,
तो recovery review के लिए [ClawHub appeal form](https://appeals.openclaw.ai/) का उपयोग करें।

यदि scanner-triggered email किसी skill या plugin version को malicious बताती है,
तो blocked submitted version के stored scan results download करें:
`clawhub scan download <slug> --version <version>`। plugins के लिए,
`--kind plugin` जोड़ें। scan output की समीक्षा करें, listing fix करें, version
number बढ़ाएं, और fixed version upload करें।

## Publisher guidance

False positives कम करने और user trust सुधारने के लिए:

- names, summaries, tags, और changelogs accurate रखें
- required environment variables और permissions declare करें
- obfuscated install commands से बचें
- जब संभव हो source से link करें
- plugins publish करने से पहले dry runs का उपयोग करें
- यदि users या moderators release behavior के बारे में पूछें, तो स्पष्ट रूप से जवाब दें
