---
read_when:
    - किसी संगठन, ब्रांड, पैकेज स्कोप, मालिक हैंडल, स्किल स्लग, या पैकेज नेमस्पेस पर दावा करना
    - पहले से दावा किए गए या आरक्षित namespace को resolve करना
    - रिपोर्ट, अपील या namespace claim का उपयोग करना है या नहीं तय करना
sidebarTitle: Org and Namespace Claims
summary: संगठन, ब्रांड, स्वामी-हैंडल, पैकेज-स्कोप, Skill-स्लग, या नेमस्पेस स्वामित्व विवादों के लिए ClawHub समीक्षा का अनुरोध कैसे करें।
title: संगठन और नामस्थान दावे
x-i18n:
    generated_at: "2026-07-04T20:31:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Org और Namespace दावे

ClawHub स्वामी हैंडल, org हैंडल, skill slugs, Plugin पैकेज नामों और
पैकेज scopes को सार्वजनिक namespaces के रूप में उपयोग करता है। यदि कोई namespace
किसी वास्तविक दुनिया के प्रोजेक्ट, ब्रांड, पैकेज ecosystem या संगठन से संबंधित
लगता है, लेकिन ClawHub पर पहले से दावा किया गया, आरक्षित, भ्रामक या विवादित है,
तो staff से
[Org / Namespace Claim issue form](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
के साथ इसकी समीक्षा करने को कहें।

सार्वजनिक, गैर-संवेदनशील स्वामित्व समीक्षा के लिए इस पथ का उपयोग करें। namespace
दावों के लिए in-product रिपोर्ट या खाता appeal form का उपयोग न करें।

## दावा कब खोलें

namespace दावा तब खोलें जब आपको लगे कि ClawHub staff को समीक्षा करनी चाहिए कि
वास्तविक दुनिया के स्वामित्व के कारण किसी namespace को आरक्षित, स्थानांतरित,
नामांतरित, छिपाया, quarantined, aliased, या अन्यथा बदला जाना चाहिए या नहीं।

उदाहरणों में शामिल हैं:

- ऐसा org हैंडल जो आपके GitHub org, प्रोजेक्ट, कंपनी या समुदाय से मेल खाता हो
- `@example-org/*` जैसा पैकेज scope, जिसे केवल मेल खाने वाले ClawHub स्वामी के
  अंतर्गत प्रकाशित होना चाहिए
- कोई skill slug या Plugin पैकेज नाम जो किसी प्रोजेक्ट का प्रतिरूपण करता लगता हो
- ब्रांड, trademark, प्रोजेक्ट rename, या पैकेज इतिहास से जुड़ा विवाद
- कोई हटाया गया, निष्क्रिय या पहुंच से बाहर स्वामी जो उचित namespace स्वामी को
  रोकता हो

यदि listing स्वामित्व विवाद से परे असुरक्षित, दुर्भावनापूर्ण या भ्रामक है, तो
संबंधित moderation या सुरक्षा guidance का भी पालन करें। namespace claim form
स्वामित्व समीक्षा के लिए है, आपातकालीन vulnerability disclosure के लिए नहीं।

## फाइल करने से पहले

पहले पुष्टि करें कि आप उस स्वामी के साथ प्रकाशित कर रहे हैं जो namespace से मेल
खाता है। Plugin पैकेजों के लिए, `@example-org/example-plugin` जैसे scoped नामों
को मेल खाने वाले `example-org` स्वामी के रूप में प्रकाशित किया जाना चाहिए।

यदि आप वर्तमान स्वामी को manage कर सकते हैं, तो प्रभावित resource को प्रकाशित,
नामांतरित, स्थानांतरित, छिपाकर या हटाकर namespace को सीधे ठीक करें। claim का
उपयोग तब करें जब आप वर्तमान स्वामी को manage नहीं कर सकते या जब staff को किसी
विवाद का समाधान करना हो।

## शामिल करने योग्य प्रमाण

सार्वजनिक, गैर-संवेदनशील प्रमाण का उपयोग करें। सहायक प्रमाणों में शामिल हैं:

- GitHub org, repo, release, या maintainer history
- आधिकारिक प्रोजेक्ट docs जो namespace का नाम बताते हों
- domain या official email-domain proof
- npm, PyPI, crates.io, या अन्य package-registry scope control
- trademark, brand, या project ownership evidence जिसे सार्वजनिक रूप से चर्चा
  करना सुरक्षित हो
- source repository history, package history, या public rename notices
- विवादित ClawHub स्वामी, skill, Plugin, पैकेज या issue के लिंक

समझाएं कि प्रत्येक लिंक क्या सिद्ध करता है। staff को निजी credentials या secrets
की आवश्यकता के बिना संबंध समझ में आना चाहिए।

## क्या शामिल न करें

सार्वजनिक GitHub issue में secrets या निजी proof न डालें। शामिल न करें:

- API tokens, signing keys, या credentials
- DNS challenge tokens
- निजी कानूनी files या contracts
- व्यक्तिगत identity documents
- निजी emails, निजी security reports, या confidential customer data

claim form पूछता है कि संवेदनशील प्रमाण के लिए private staff channel की आवश्यकता
है या नहीं। संवेदनशील सामग्री को सार्वजनिक रूप से पोस्ट करने के बजाय उस विकल्प का
उपयोग करें।

## संभावित परिणाम

प्रमाण और जोखिम के आधार पर, ClawHub staff किसी namespace को आरक्षित कर सकता है,
स्वामित्व स्थानांतरित कर सकता है, किसी resource का नाम बदल सकता है, मौजूदा
listing को छिपा या quarantine कर सकता है, alias या redirect जोड़ सकता है, अधिक
proof मांग सकता है, या अनुरोध अस्वीकार कर सकता है।

namespace समीक्षा यह guarantee नहीं करती कि हर matching name स्थानांतरित किया
जाएगा। staff सार्वजनिक प्रमाण, मौजूदा उपयोग, security risk और user impact को
तौलता है।

## संबंधित Docs

- [प्रकाशन](/hi/clawhub/publishing)
- [समस्या निवारण](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation और Account Safety](/clawhub/moderation)
- [Security](/clawhub/security)
