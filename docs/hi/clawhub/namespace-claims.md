---
read_when:
    - किसी org, ब्रांड, पैकेज स्कोप, owner handle, skill slug, या पैकेज namespace पर दावा करना
    - पहले से दावा किए गए या आरक्षित नामस्थान का समाधान करना
    - यह तय करना कि रिपोर्ट, अपील, या namespace claim का उपयोग करना है या नहीं
sidebarTitle: Org and Namespace Claims
summary: संगठन, ब्रांड, मालिक-हैंडल, पैकेज-स्कोप, skill-slug, या नेमस्पेस स्वामित्व विवादों के लिए ClawHub समीक्षा का अनुरोध कैसे करें।
title: संगठन और नेमस्पेस दावे
x-i18n:
    generated_at: "2026-07-01T08:03:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# संगठन और Namespace दावे

ClawHub स्वामी हैंडल, संगठन हैंडल, skill slugs, Plugin पैकेज नामों, और
पैकेज scopes को सार्वजनिक namespaces के रूप में उपयोग करता है। यदि कोई namespace
किसी वास्तविक दुनिया के प्रोजेक्ट, ब्रांड, पैकेज ecosystem, या संगठन से संबंधित
लगता है, लेकिन ClawHub पर पहले से claim किया गया, reserved, भ्रमित करने वाला,
या disputed है, तो staff से
[संगठन / Namespace दावा issue form](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
के साथ इसकी review करने को कहें।

सार्वजनिक, गैर-संवेदनशील स्वामित्व review के लिए इस path का उपयोग करें। Namespace
claims के लिए in-product reports या account appeal form का उपयोग न करें।

## दावा कब खोलें

Namespace claim तब खोलें जब आपको लगता हो कि ClawHub staff को review करना चाहिए कि
real-world ownership के कारण किसी namespace को reserved, transferred, renamed, hidden,
quarantined, aliased, या अन्यथा बदला जाना चाहिए या नहीं।

उदाहरणों में शामिल हैं:

- ऐसा org handle जो आपके GitHub org, project, company, या community से मेल खाता हो
- `@example-org/*` जैसा package scope जिसे केवल मेल खाते ClawHub owner के अंतर्गत
  publish किया जाना चाहिए
- कोई skill slug या Plugin package name जो किसी project का impersonation करता लगता हो
- brand, trademark, project rename, या package history dispute
- deleted, inactive, या unreachable owner जो rightful namespace owner को block करता हो

यदि listing ownership dispute से परे unsafe, malicious, या misleading है, तो
relevant moderation या security guidance का भी पालन करें। Namespace claim form
ownership review के लिए है, emergency vulnerability disclosure के लिए नहीं।

## File करने से पहले

पहले पुष्टि करें कि आप namespace से मेल खाते owner के साथ publish कर रहे हैं।
Plugin packages के लिए, `@example-org/example-plugin` जैसे scoped names को
matching `example-org` owner के रूप में publish किया जाना चाहिए।

यदि आप current owner को manage कर सकते हैं, तो affected resource को publish,
rename, transfer, hide, या delete करके namespace को सीधे fix करें। Claim का उपयोग
तब करें जब आप current owner को manage नहीं कर सकते या जब staff को dispute resolve
करना हो।

## शामिल करने योग्य Evidence

सार्वजनिक, गैर-संवेदनशील evidence का उपयोग करें। उपयोगी proof में शामिल हैं:

- GitHub org, repo, release, या maintainer history
- official project docs जो namespace का नाम देते हों
- domain या official email-domain proof
- npm, PyPI, crates.io, या अन्य package-registry scope control
- trademark, brand, या project ownership evidence जिस पर publicly चर्चा करना safe हो
- source repository history, package history, या public rename notices
- disputed ClawHub owner, skill, Plugin, package, या issue के links

समझाएं कि हर link क्या साबित करता है। Staff को private credentials या secrets की
ज़रूरत पड़े बिना relationship समझ में आना चाहिए।

## क्या शामिल न करें

Public GitHub issue में secrets या private proof न डालें। शामिल न करें:

- API tokens, signing keys, या credentials
- DNS challenge tokens
- private legal files या contracts
- personal identity documents
- private emails, private security reports, या confidential customer data

Claim form पूछता है कि sensitive evidence के लिए private staff channel चाहिए या नहीं।
Sensitive material को publicly post करने के बजाय उस option का उपयोग करें।

## संभावित परिणाम

Evidence और risk के आधार पर, ClawHub staff किसी namespace को reserve कर सकता है,
ownership transfer कर सकता है, resource rename कर सकता है, existing listing को hide
या quarantine कर सकता है, alias या redirect जोड़ सकता है, अधिक proof मांग सकता है,
या request decline कर सकता है।

Namespace review यह guarantee नहीं करती कि हर matching name transfer किया जाएगा।
Staff public evidence, existing usage, security risk, और user impact को तौलता है।

## संबंधित Docs

- [Publishing](/hi/clawhub/publishing)
- [समस्या निवारण](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation और Account Safety](/clawhub/moderation)
- [Security](/clawhub/security)
