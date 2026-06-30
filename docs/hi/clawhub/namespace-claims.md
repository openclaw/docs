---
read_when:
    - किसी संगठन, ब्रांड, पैकेज स्कोप, स्वामी हैंडल, स्किल स्लग, या पैकेज नेमस्पेस पर दावा करना
    - पहले से दावा किए गए या आरक्षित नामस्थान का समाधान करना
    - रिपोर्ट, अपील, या नेमस्पेस दावे का उपयोग करना है या नहीं, यह तय करना
sidebarTitle: Org and Namespace Claims
summary: org, brand, owner-handle, package-scope, skill-slug, या namespace स्वामित्व विवादों के लिए ClawHub समीक्षा का अनुरोध कैसे करें।
title: संगठन और नेमस्पेस दावे
x-i18n:
    generated_at: "2026-06-30T14:02:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# संगठन और नेमस्पेस दावे

ClawHub स्वामी हैंडल, संगठन हैंडल, skill slugs, Plugin पैकेज नामों, और
पैकेज scopes को सार्वजनिक नेमस्पेस के रूप में उपयोग करता है। यदि कोई नेमस्पेस
किसी वास्तविक प्रोजेक्ट, ब्रांड, पैकेज ecosystem, या संगठन का लगता है, लेकिन
ClawHub पर पहले से दावा किया गया, आरक्षित, भ्रामक, या विवादित है, तो staff से
इसकी समीक्षा करने के लिए
[संगठन / नेमस्पेस दावा इश्यू फॉर्म](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) का उपयोग करें।

सार्वजनिक, असंवेदनशील ownership समीक्षा के लिए इस path का उपयोग करें। नेमस्पेस
दावों के लिए इन-प्रोडक्ट reports या account appeal form का उपयोग न करें।

## दावा कब खोलें

जब आपको लगे कि ClawHub staff को यह समीक्षा करनी चाहिए कि वास्तविक ownership के
कारण किसी नेमस्पेस को आरक्षित, स्थानांतरित, नाम बदला, छिपाया, quarantined,
aliased, या अन्यथा बदला जाना चाहिए या नहीं, तब नेमस्पेस दावा खोलें।

उदाहरणों में शामिल हैं:

- ऐसा संगठन हैंडल जो आपके GitHub संगठन, प्रोजेक्ट, कंपनी, या community से मेल खाता हो
- ऐसा पैकेज scope, जैसे `@example-org/*`, जिसे केवल मेल खाने वाले
  ClawHub स्वामी के अंतर्गत publish किया जाना चाहिए
- ऐसा skill slug या Plugin पैकेज नाम जो किसी प्रोजेक्ट का impersonation करता हुआ लगे
- ब्रांड, trademark, प्रोजेक्ट rename, या पैकेज history dispute
- deleted, inactive, या unreachable स्वामी जो rightful नेमस्पेस
  स्वामी को block करता हो

यदि listing ownership dispute से आगे unsafe, malicious, या misleading है, तो
संबंधित moderation या security guidance का भी पालन करें। नेमस्पेस दावा फॉर्म
ownership समीक्षा के लिए है, emergency vulnerability disclosure के लिए नहीं।

## फाइल करने से पहले

पहले पुष्टि करें कि आप उस स्वामी के साथ publish कर रहे हैं जो नेमस्पेस से मेल
खाता है। Plugin पैकेजों के लिए, scoped नाम जैसे `@example-org/example-plugin`
को मेल खाने वाले `example-org` स्वामी के रूप में publish किया जाना चाहिए।

यदि आप वर्तमान स्वामी को manage कर सकते हैं, तो प्रभावित resource को publish,
rename, transfer, hide, या delete करके नेमस्पेस को सीधे fix करें। claim का
उपयोग तब करें जब आप वर्तमान स्वामी को manage नहीं कर सकते या जब staff को
dispute हल करना हो।

## शामिल करने योग्य साक्ष्य

सार्वजनिक, असंवेदनशील साक्ष्य का उपयोग करें। सहायक proof में शामिल हैं:

- GitHub संगठन, repo, release, या maintainer history
- official प्रोजेक्ट docs जो नेमस्पेस का नाम बताते हों
- domain या official email-domain proof
- npm, PyPI, crates.io, या अन्य package-registry scope control
- trademark, ब्रांड, या प्रोजेक्ट ownership evidence जिसे सार्वजनिक रूप से
  discuss करना सुरक्षित हो
- source repository history, package history, या public rename notices
- disputed ClawHub स्वामी, skill, Plugin, पैकेज, या issue के links

समझाएं कि प्रत्येक link क्या proof करता है। Staff को private credentials या
secrets की आवश्यकता के बिना relationship समझ आना चाहिए।

## क्या शामिल न करें

सार्वजनिक GitHub issue में secrets या private proof न डालें। शामिल न करें:

- API tokens, signing keys, या credentials
- DNS challenge tokens
- private legal files या contracts
- personal identity documents
- private emails, private security reports, या confidential customer data

claim form पूछता है कि sensitive evidence के लिए private staff channel चाहिए या
नहीं। sensitive material को सार्वजनिक रूप से post करने के बजाय उस विकल्प का
उपयोग करें।

## संभावित परिणाम

साक्ष्य और risk के आधार पर, ClawHub staff किसी नेमस्पेस को reserve कर सकता है,
ownership transfer कर सकता है, resource का नाम बदल सकता है, existing listing को
hide या quarantine कर सकता है, alias या redirect जोड़ सकता है, अधिक proof मांग
सकता है, या request decline कर सकता है।

नेमस्पेस review यह guarantee नहीं करती कि हर matching name transfer किया जाएगा।
Staff public evidence, existing usage, security risk, और user impact को weigh
करता है।

## संबंधित Docs

- [Publishing](/hi/clawhub/publishing)
- [Troubleshooting](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation and Account Safety](/clawhub/moderation)
- [Security](/clawhub/security)
