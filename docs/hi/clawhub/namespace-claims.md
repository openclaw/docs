---
read_when:
    - किसी संगठन, ब्रांड, पैकेज स्कोप, स्वामी हैंडल, skill slug, या पैकेज नेमस्पेस का दावा करना
    - ऐसे नामस्थान को हल करना जिस पर पहले से दावा किया जा चुका है या जो आरक्षित है
    - रिपोर्ट, अपील या नेमस्पेस दावे का उपयोग करना है या नहीं, यह तय करना
sidebarTitle: Org and Namespace Claims
summary: संगठन, ब्रांड, स्वामी-हैंडल, पैकेज-स्कोप, स्किल-स्लग या नेमस्पेस स्वामित्व विवादों के लिए ClawHub समीक्षा का अनुरोध कैसे करें।
title: संगठन और नेमस्पेस दावे
x-i18n:
    generated_at: "2026-07-04T18:01:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# संगठन और नेमस्पेस दावे

ClawHub owner हैंडल, org हैंडल, skill slugs, Plugin पैकेज नामों और
package scopes को सार्वजनिक नेमस्पेस के रूप में उपयोग करता है। अगर कोई नेमस्पेस
किसी वास्तविक परियोजना, ब्रांड, पैकेज इकोसिस्टम या संगठन से संबंधित लगता है,
लेकिन ClawHub पर पहले से दावा किया गया, आरक्षित, भ्रामक या विवादित है, तो स्टाफ़ से
[संगठन / नेमस्पेस दावा issue form](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
के साथ उसकी समीक्षा करने के लिए कहें।

सार्वजनिक, गैर-संवेदनशील स्वामित्व समीक्षा के लिए इस पथ का उपयोग करें। नेमस्पेस
दावों के लिए इन-प्रोडक्ट रिपोर्ट या account appeal form का उपयोग न करें।

## दावा कब खोलें

जब आपको लगता है कि ClawHub स्टाफ़ को समीक्षा करनी चाहिए कि वास्तविक स्वामित्व के
कारण किसी नेमस्पेस को आरक्षित, स्थानांतरित, नाम बदला, छिपाया, क्वारंटीन किया,
alias किया या अन्यथा बदला जाना चाहिए या नहीं, तब नेमस्पेस दावा खोलें।

उदाहरणों में शामिल हैं:

- कोई org हैंडल जो आपके GitHub org, परियोजना, कंपनी या समुदाय से मेल खाता है
- `@example-org/*` जैसा package scope जिसे केवल मिलते-जुलते ClawHub owner के
  अंतर्गत publish होना चाहिए
- कोई skill slug या Plugin पैकेज नाम जो किसी परियोजना का impersonation करता लगता है
- कोई ब्रांड, trademark, परियोजना rename या पैकेज इतिहास विवाद
- कोई deleted, inactive या unreachable owner जो वैध नेमस्पेस owner को रोकता है

अगर listing स्वामित्व विवाद से आगे unsafe, malicious या misleading है, तो संबंधित
moderation या security guidance का भी पालन करें। नेमस्पेस दावा form स्वामित्व
समीक्षा के लिए है, आपातकालीन vulnerability disclosure के लिए नहीं।

## फ़ाइल करने से पहले

पहले पुष्टि करें कि आप उस owner के साथ publish कर रहे हैं जो नेमस्पेस से मेल खाता
है। Plugin पैकेजों के लिए, `@example-org/example-plugin` जैसे scoped names को
मिलते-जुलते `example-org` owner के रूप में publish किया जाना चाहिए।

अगर आप मौजूदा owner को manage कर सकते हैं, तो प्रभावित resource को publish,
rename, transfer, hide या delete करके सीधे नेमस्पेस ठीक करें। दावा तब उपयोग करें
जब आप मौजूदा owner को manage नहीं कर सकते या जब staff को किसी विवाद का समाधान
करना हो।

## शामिल करने योग्य प्रमाण

सार्वजनिक, गैर-संवेदनशील प्रमाण का उपयोग करें। उपयोगी proof में शामिल हैं:

- GitHub org, repo, release या maintainer history
- आधिकारिक project docs जो नेमस्पेस का नाम बताते हैं
- domain या official email-domain proof
- npm, PyPI, crates.io या अन्य package-registry scope control
- trademark, brand या project ownership evidence जिस पर सार्वजनिक रूप से चर्चा
  करना सुरक्षित हो
- source repository history, package history या public rename notices
- विवादित ClawHub owner, skill, Plugin, package या issue के links

समझाएँ कि हर link क्या साबित करता है। Staff को private credentials या secrets की
आवश्यकता के बिना संबंध समझ आना चाहिए।

## क्या शामिल न करें

किसी public GitHub issue में secrets या private proof न डालें। शामिल न करें:

- API tokens, signing keys या credentials
- DNS challenge tokens
- private legal files या contracts
- personal identity documents
- private emails, private security reports या confidential customer data

Claim form पूछता है कि sensitive evidence के लिए private staff channel की
आवश्यकता है या नहीं। संवेदनशील सामग्री सार्वजनिक रूप से post करने के बजाय उस
option का उपयोग करें।

## संभावित परिणाम

प्रमाण और जोखिम के आधार पर, ClawHub staff किसी नेमस्पेस को reserve कर सकता है,
ownership transfer कर सकता है, resource का नाम बदल सकता है, किसी existing listing
को hide या quarantine कर सकता है, alias या redirect जोड़ सकता है, अधिक proof मांग
सकता है या request decline कर सकता है।

Namespace review यह guarantee नहीं करती कि हर matching name transfer किया जाएगा।
Staff public evidence, existing usage, security risk और user impact को तौलता है।

## संबंधित docs

- [Publishing](/hi/clawhub/publishing)
- [Troubleshooting](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation और Account Safety](/clawhub/moderation)
- [Security](/clawhub/security)
