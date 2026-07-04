---
read_when:
    - Skill, Plugin, या पैकेज की रिपोर्ट करना
    - रुकी हुई, छिपी हुई, या अवरुद्ध listing से पुनर्प्राप्ति
    - ClawHub मॉडरेशन, प्रतिबंधों या खाते की स्थिति को समझना
sidebarTitle: Moderation and Account Safety
summary: ClawHub में रिपोर्ट, मॉडरेशन होल्ड, छिपी लिस्टिंग, प्रतिबंध और खाते की स्थिति कैसे काम करते हैं।
title: मॉडरेशन और खाता सुरक्षा
x-i18n:
    generated_at: "2026-07-04T15:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# मॉडरेशन और खाता सुरक्षा

ClawHub प्रकाशन के लिए खुला है, लेकिन सार्वजनिक खोज और इंस्टॉल सतहों को अब भी
सुरक्षा-सीमाओं की आवश्यकता होती है। रिपोर्ट, मॉडरेशन होल्ड, छिपी हुई लिस्टिंग, और खाता कार्रवाइयां
उपयोगकर्ताओं की सुरक्षा में मदद करती हैं जब कोई रिलीज़ या खाता असुरक्षित, भ्रामक, या नीति से बाहर
दिखाई देता है।

यह पृष्ठ मॉडरेशन और खाते की स्थिति को कवर करता है। `Pass`, `Review`, `Warn`, `Malicious`, और जोखिम स्तर जैसे ऑडिट लेबलों के लिए, देखें
[सुरक्षा ऑडिट](/clawhub/security-audits).

यह भी देखें [सुरक्षा](/clawhub/security) और
[स्वीकार्य उपयोग](/clawhub/acceptable-usage). कॉपीराइट या अन्य सामग्री
अधिकार संबंधी चिंताओं के लिए, [सामग्री अधिकार अनुरोध](/clawhub/content-rights) का उपयोग करें।

## रिपोर्ट

साइन-इन किए हुए उपयोगकर्ता skills, plugins, और packages की रिपोर्ट कर सकते हैं।

ClawHub रिपोर्टों का उपयोग केवल असुरक्षित marketplace सामग्री के लिए करें, जैसे:

- दुर्भावनापूर्ण लिस्टिंग
- भ्रामक मेटाडेटा
- अघोषित क्रेडेंशियल या अनुमति आवश्यकताएं
- संदिग्ध इंस्टॉल निर्देश
- प्रतिरूपण
- बदनीयती वाले पंजीकरण या ट्रेडमार्क दुरुपयोग
- ऐसी सामग्री जो [स्वीकार्य उपयोग](/clawhub/acceptable-usage) का उल्लंघन करती है

किसी skill पृष्ठ पर **skill की रिपोर्ट करें** बटन, या packages के लिए package reporting
command/API का उपयोग करें।

किसी तृतीय-पक्ष skill या
plugin के अपने स्रोत कोड में कमजोरियों के लिए ClawHub रिपोर्टों का उपयोग न करें। इन्हें सीधे प्रकाशक या लिस्टिंग से लिंक किए गए स्रोत
repository को रिपोर्ट करें। ClawHub तृतीय-पक्ष skill या plugin कोड का रखरखाव या पैच नहीं करता।

`openclaw/clawhub` के लिए GitHub Security Advisories
ClawHub स्वयं में मौजूद कमजोरियों के लिए हैं। उदाहरणों में website, API, CLI, registry, auth,
scanning, moderation, या download/install trust boundaries में bugs शामिल हैं। तृतीय-पक्ष skills या plugins में कमजोरियों के लिए ClawHub
advisories का उपयोग न करें।

अच्छी रिपोर्टें विशिष्ट और कार्रवाई योग्य होती हैं। रिपोर्टिंग का दुरुपयोग स्वयं
खाता कार्रवाई का कारण बन सकता है।

## संगठन और namespace दावे

संगठन, ब्रांड, package-scope, owner-handle, या namespace स्वामित्व विवादों को
[संगठन और Namespace दावे](/clawhub/namespace-claims) प्रक्रिया का उपयोग करना चाहिए, न कि
इन-प्रोडक्ट रिपोर्ट प्रवाह या खाता अपील फ़ॉर्म का।

उस प्रक्रिया का उपयोग करें जब आपको ClawHub स्टाफ से ऐसे गैर-संवेदनशील प्रमाण की समीक्षा करवानी हो कि किसी
namespace को आरक्षित, स्थानांतरित, नाम बदला, छिपाया, क्वारंटीन किया, alias किया,
या अन्यथा समीक्षा किया जाना चाहिए। किसी सार्वजनिक issue में secrets, private documents, private legal
files, personal identity documents, API tokens, या DNS challenge tokens शामिल न करें।

## मॉडरेशन होल्ड

कुछ गंभीर निष्कर्ष या नीति संबंधी मुद्दे किसी publisher या listing को
मॉडरेशन होल्ड के अंतर्गत रख सकते हैं। जब ऐसा होता है, प्रभावित सामग्री सार्वजनिक
खोज से छिपाई जा सकती है या भविष्य के प्रकाशन issue की समीक्षा होने तक छिपे हुए शुरू हो सकते हैं।

मॉडरेशन होल्ड का उद्देश्य उपयोगकर्ताओं की सुरक्षा करना है जबकि ClawHub उच्च-जोखिम
मामलों को हल करता है। झूठी सकारात्मक पुष्टि होने पर इन्हें हटाया भी जा सकता है।

## छिपी हुई या अवरुद्ध लिस्टिंग

कोई listing सार्वजनिक install सतहों पर held, hidden, quarantined, revoked, या अन्यथा अनुपलब्ध हो सकती है।

यदि आपको इनमें से कोई स्थिति दिखाई देती है, तो release को तब तक install न करें जब तक owner
issue को हल न कर दे या moderation उसे restore न कर दे।

Owners अपनी held या hidden listings के लिए अब भी diagnostics देख सकते हैं। ये
diagnostics यह समझाने में मदद करते हैं कि क्या हुआ और listing को public surfaces पर वापस आने से पहले
क्या बदलना होगा।

## प्रतिबंध और खाते की स्थिति

ClawHub नीति का उल्लंघन करने वाले accounts की publishing access खो सकती है। गंभीर abuse से
account bans, token revocation, hidden content, या removed listings हो सकते हैं।
Publisher abuse pressure signals रोज़ जांचे जाते हैं। ClawHub की potential-ban threshold तक पहुंचने वाले signals
automatic warning trigger कर सकते हैं। यदि warning deadline के बाद अगला eligible scan अब भी publisher को
potential-ban threshold में रखता है, तो ClawHub account action automatic रूप से लागू कर सकता है।
Lower-confidence और bounded temporal review signals automatic enforcement से बाहर रहते हैं।

हटाए गए, banned, या disabled accounts ClawHub API tokens का उपयोग नहीं कर सकते। यदि CLI auth
account action के बाद fail होने लगे, तो account
state की समीक्षा के लिए web UI में sign in करें। यदि sign-in या normal CLI access किसी ban या disabled account से blocked है,
तो recovery review के लिए [ClawHub appeal form](https://appeals.openclaw.ai/) का उपयोग करें।

यदि scanner-triggered email किसी skill या plugin version को malicious बताता है,
तो blocked submitted version के stored scan results डाउनलोड करें:
`clawhub scan download <slug> --version <version>`। plugins के लिए,
`--kind plugin` जोड़ें। scan output की समीक्षा करें, listing ठीक करें, version
number बढ़ाएं, और fixed version upload करें।

## Publisher मार्गदर्शन

false positives कम करने और user trust सुधारने के लिए:

- names, summaries, tags, और changelogs सटीक रखें
- required environment variables और permissions घोषित करें
- obfuscated install commands से बचें
- संभव होने पर source से link करें
- plugins publish करने से पहले dry runs का उपयोग करें
- यदि users या moderators release behavior के बारे में पूछें तो स्पष्ट रूप से जवाब दें
