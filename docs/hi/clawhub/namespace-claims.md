---
read_when:
    - किसी संगठन, ब्रांड, पैकेज स्कोप, मालिक हैंडल, skill स्लग, या पैकेज नेमस्पेस पर दावा करना
    - पहले से दावा किए गए या आरक्षित namespace को हल करना
    - रिपोर्ट, अपील या नेमस्पेस दावा का उपयोग करना है या नहीं, यह तय करना
sidebarTitle: Org and Namespace Claims
summary: संगठन, ब्रांड, स्वामी-हैंडल, पैकेज-स्कोप, स्किल-स्लग, या नेमस्पेस स्वामित्व विवादों के लिए ClawHub समीक्षा का अनुरोध कैसे करें।
title: संगठन और नेमस्पेस दावे
x-i18n:
    generated_at: "2026-06-30T22:16:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# संगठन और नेमस्पेस दावे

ClawHub owner handles, संगठन handles, skill slugs, Plugin पैकेज नामों और
पैकेज scopes को सार्वजनिक नेमस्पेस के रूप में उपयोग करता है। यदि कोई नेमस्पेस
किसी वास्तविक दुनिया के प्रोजेक्ट, ब्रांड, पैकेज ecosystem, या संगठन से संबंधित
दिखता है, लेकिन ClawHub पर पहले से दावा किया गया, आरक्षित, भ्रामक, या विवादित
है, तो स्टाफ से
[संगठन / नेमस्पेस दावा issue form](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
के साथ उसकी समीक्षा करने को कहें।

इस पथ का उपयोग सार्वजनिक, गैर-संवेदनशील स्वामित्व समीक्षा के लिए करें। नेमस्पेस
दावों के लिए इन-प्रोडक्ट रिपोर्ट या खाता अपील फ़ॉर्म का उपयोग न करें।

## दावा कब खोलें

जब आपको लगता है कि ClawHub स्टाफ को यह समीक्षा करनी चाहिए कि वास्तविक दुनिया के
स्वामित्व के कारण किसी नेमस्पेस को आरक्षित, स्थानांतरित, नाम बदला, छिपाया,
quarantine, alias, या अन्यथा बदला जाना चाहिए, तब नेमस्पेस दावा खोलें।

उदाहरणों में शामिल हैं:

- ऐसा संगठन handle जो आपके GitHub संगठन, प्रोजेक्ट, कंपनी, या समुदाय से मेल खाता हो
- `@example-org/*` जैसा पैकेज scope, जिसे केवल मेल खाते ClawHub owner के अंतर्गत
  प्रकाशित होना चाहिए
- ऐसा skill slug या Plugin पैकेज नाम जो किसी प्रोजेक्ट की नकल करता हुआ दिखता हो
- ब्रांड, ट्रेडमार्क, प्रोजेक्ट नाम-परिवर्तन, या पैकेज इतिहास विवाद
- हटाया गया, निष्क्रिय, या पहुंच से बाहर owner जो सही नेमस्पेस owner को रोकता हो

यदि listing स्वामित्व विवाद से आगे unsafe, malicious, या भ्रामक है, तो संबंधित
moderation या security guidance का भी पालन करें। नेमस्पेस दावा फ़ॉर्म स्वामित्व
समीक्षा के लिए है, आपातकालीन vulnerability disclosure के लिए नहीं।

## फ़ाइल करने से पहले

पहले पुष्टि करें कि आप ऐसे owner के साथ प्रकाशित कर रहे हैं जो नेमस्पेस से मेल
खाता है। Plugin पैकेजों के लिए, `@example-org/example-plugin` जैसे scoped नाम
मेल खाते `example-org` owner के रूप में प्रकाशित होने चाहिए।

यदि आप मौजूदा owner को manage कर सकते हैं, तो प्रभावित resource को प्रकाशित,
नाम बदलकर, transfer, hide, या delete करके नेमस्पेस सीधे ठीक करें। दावा तब उपयोग
करें जब आप मौजूदा owner को manage नहीं कर सकते या जब विवाद सुलझाने के लिए स्टाफ
की जरूरत हो।

## शामिल करने के लिए साक्ष्य

सार्वजनिक, गैर-संवेदनशील साक्ष्य का उपयोग करें। उपयोगी proof में शामिल हैं:

- GitHub संगठन, repo, release, या maintainer इतिहास
- आधिकारिक प्रोजेक्ट docs जो नेमस्पेस का नाम बताते हों
- domain या आधिकारिक email-domain proof
- npm, PyPI, crates.io, या अन्य package-registry scope control
- trademark, brand, या project ownership evidence जिसे सार्वजनिक रूप से चर्चा
  करना सुरक्षित हो
- source repository इतिहास, package history, या सार्वजनिक rename notices
- विवादित ClawHub owner, skill, Plugin, package, या issue के links

समझाएँ कि प्रत्येक link क्या साबित करता है। स्टाफ को निजी credentials या secrets
की जरूरत के बिना संबंध समझ में आना चाहिए।

## क्या शामिल न करें

सार्वजनिक GitHub issue में secrets या private proof न डालें। शामिल न करें:

- API tokens, signing keys, या credentials
- DNS challenge tokens
- निजी legal files या contracts
- personal identity documents
- निजी emails, private security reports, या confidential customer data

दावा फ़ॉर्म पूछता है कि क्या sensitive evidence के लिए private staff channel की
जरूरत है। संवेदनशील सामग्री सार्वजनिक रूप से पोस्ट करने के बजाय उस विकल्प का
उपयोग करें।

## संभावित परिणाम

साक्ष्य और जोखिम के आधार पर, ClawHub स्टाफ किसी नेमस्पेस को reserve कर सकता है,
ownership transfer कर सकता है, resource का नाम बदल सकता है, मौजूदा listing को
hide या quarantine कर सकता है, alias या redirect जोड़ सकता है, अधिक proof मांग
सकता है, या request अस्वीकार कर सकता है।

नेमस्पेस समीक्षा यह guarantee नहीं देती कि हर matching name transfer किया जाएगा।
स्टाफ public evidence, existing usage, security risk, और user impact को तौलता है।

## संबंधित Docs

- [Publishing](/hi/clawhub/publishing)
- [Troubleshooting](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation and Account Safety](/clawhub/moderation)
- [Security](/clawhub/security)
