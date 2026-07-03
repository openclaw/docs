---
read_when:
    - Skills, Plugin या पैकेज की रिपोर्ट करना
    - रोकी गई, छिपी हुई, या अवरुद्ध लिस्टिंग से उबरना
    - ClawHub मॉडरेशन, प्रतिबंधों या खाते की स्थिति को समझना
sidebarTitle: Moderation and Account Safety
summary: ClawHub रिपोर्ट, मॉडरेशन होल्ड, छिपी हुई लिस्टिंग, बैन, और खाते की स्थिति कैसे काम करते हैं।
title: मॉडरेशन और खाता सुरक्षा
x-i18n:
    generated_at: "2026-07-03T09:34:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# मॉडरेशन और खाता सुरक्षा

ClawHub प्रकाशन के लिए खुला है, लेकिन सार्वजनिक खोज और इंस्टॉल सतहों को अभी भी
गार्डरेल की आवश्यकता है। रिपोर्ट, मॉडरेशन होल्ड, छिपी हुई लिस्टिंग, और खाता कार्रवाइयां
उपयोगकर्ताओं की सुरक्षा में मदद करती हैं जब कोई रिलीज़ या खाता असुरक्षित, भ्रामक, या नीति से बाहर
दिखाई देता है।

यह पेज मॉडरेशन और खाते की स्थिति को कवर करता है। `Pass`, `Review`, `Warn`, `Malicious`, और जोखिम स्तर जैसे
ऑडिट लेबल के लिए, देखें
[सुरक्षा ऑडिट](/clawhub/security-audits)।

यह भी देखें [सुरक्षा](/clawhub/security) और
[स्वीकार्य उपयोग](/clawhub/acceptable-usage)। कॉपीराइट या अन्य सामग्री
अधिकार संबंधी चिंताओं के लिए, [सामग्री अधिकार अनुरोध](/clawhub/content-rights) का उपयोग करें।

## रिपोर्ट

साइन-इन किए हुए उपयोगकर्ता skills, plugins, और packages की रिपोर्ट कर सकते हैं।

ClawHub रिपोर्ट का उपयोग केवल असुरक्षित मार्केटप्लेस सामग्री के लिए करें, जैसे:

- दुर्भावनापूर्ण लिस्टिंग
- भ्रामक मेटाडेटा
- अघोषित क्रेडेंशियल या अनुमति आवश्यकताएं
- संदिग्ध इंस्टॉल निर्देश
- प्रतिरूपण
- दुर्भावनापूर्ण पंजीकरण या ट्रेडमार्क दुरुपयोग
- ऐसी सामग्री जो [स्वीकार्य उपयोग](/clawhub/acceptable-usage) का उल्लंघन करती है

skill पेज पर **skill की रिपोर्ट करें** बटन, या packages के लिए package रिपोर्टिंग
कमांड/API का उपयोग करें।

किसी तृतीय-पक्ष skill या
plugin के अपने सोर्स कोड में कमजोरियों के लिए ClawHub रिपोर्ट का उपयोग न करें। उन्हें सीधे प्रकाशक या लिस्टिंग से लिंक किए गए सोर्स
रिपॉज़िटरी को रिपोर्ट करें। ClawHub तृतीय-पक्ष skill या plugin कोड को मेंटेन या पैच
नहीं करता है।

`openclaw/clawhub` के लिए GitHub Security Advisories
ClawHub की अपनी कमजोरियों के लिए हैं। उदाहरणों में वेबसाइट, API, CLI, रजिस्ट्री, auth,
स्कैनिंग, मॉडरेशन, या डाउनलोड/इंस्टॉल trust boundaries में बग शामिल हैं। तृतीय-पक्ष skills या plugins में कमजोरियों के लिए ClawHub
advisories का उपयोग न करें।

अच्छी रिपोर्ट विशिष्ट और कार्रवाई योग्य होती हैं। रिपोर्टिंग का दुरुपयोग स्वयं
खाता कार्रवाई का कारण बन सकता है।

## org और namespace दावे

org, brand, package-scope, owner-handle, या namespace ownership विवादों में
[org और Namespace दावे](/clawhub/namespace-claims) प्रक्रिया का उपयोग होना चाहिए, न कि
इन-प्रोडक्ट रिपोर्ट flow या खाता अपील फॉर्म का।

उस प्रक्रिया का उपयोग तब करें जब आपको ClawHub स्टाफ से ऐसे non-sensitive प्रमाण की समीक्षा करवानी हो कि किसी
namespace को reserve, transfer, rename, hide, quarantine, alias,
या अन्यथा review किया जाना चाहिए। सार्वजनिक issue में secrets, private documents, private legal
files, personal identity documents, API tokens, या DNS challenge tokens शामिल न करें।

## मॉडरेशन होल्ड

कुछ गंभीर निष्कर्ष या नीति मुद्दे किसी publisher या listing को
मॉडरेशन होल्ड के तहत रख सकते हैं। जब ऐसा होता है, प्रभावित सामग्री सार्वजनिक
discovery से छिपाई जा सकती है या भविष्य के publishes issue review होने तक hidden शुरू हो सकते हैं।

Moderation holds का उद्देश्य ClawHub द्वारा high-risk
cases को resolve करते समय users की रक्षा करना है। false positive confirm होने पर इन्हें lift भी किया जा सकता है।

## छिपी हुई या अवरुद्ध लिस्टिंग

कोई listing सार्वजनिक install surfaces पर held, hidden, quarantined, revoked, या अन्यथा unavailable हो सकती है।

यदि आपको इनमें से कोई state दिखे, तो release install न करें जब तक owner
issue resolve न करे या moderation उसे restore न करे।

Owners अभी भी अपनी held या hidden listings के लिए diagnostics देख सकते हैं। ये
diagnostics यह समझाने में मदद करते हैं कि क्या हुआ और listing के public surfaces पर वापस आने से पहले क्या बदलना होगा।

## प्रतिबंध और खाते की स्थिति

ClawHub नीति का उल्लंघन करने वाले खातों की publishing access समाप्त हो सकती है। गंभीर दुरुपयोग से
account bans, token revocation, hidden content, या removed listings हो सकते हैं।
Publisher abuse pressure signals daily check किए जाते हैं। ClawHub के potential-ban threshold तक पहुंचने वाले signals automatic warning trigger कर सकते हैं। यदि warning deadline के बाद अगला
eligible scan अभी भी publisher को
potential-ban threshold में रखता है, तो ClawHub account action automatically apply कर सकता है।
Lower-confidence और bounded temporal review signals automatic
enforcement से बाहर रहते हैं।

Deleted, banned, या disabled accounts ClawHub API tokens का उपयोग नहीं कर सकते। यदि CLI auth
account action के बाद fail होने लगे, तो account
state review करने के लिए web UI में sign in करें। यदि sign-in या normal CLI access किसी ban या disabled account से blocked है,
तो recovery review के लिए [ClawHub appeal form](https://appeals.openclaw.ai/) का उपयोग करें।

यदि scanner-triggered email किसी skill या plugin version को malicious बताता है,
तो blocked submitted version के stored scan results डाउनलोड करें:
`clawhub scan download <slug> --version <version>`। plugins के लिए,
`--kind plugin` जोड़ें। scan output review करें, listing fix करें, version
number बढ़ाएं, और fixed version upload करें।

## Publisher मार्गदर्शन

false positives कम करने और user trust सुधारने के लिए:

- names, summaries, tags, और changelogs accurate रखें
- required environment variables और permissions declare करें
- obfuscated install commands से बचें
- संभव होने पर source से link करें
- plugins publish करने से पहले dry runs का उपयोग करें
- यदि users या moderators release behavior के बारे में पूछें, तो स्पष्ट रूप से respond करें
