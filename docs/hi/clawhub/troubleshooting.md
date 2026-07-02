---
read_when:
    - ClawHub CLI या OpenClaw registry कमांड विफल हो जाते हैं
    - पैकेज इंस्टॉल, प्रकाशित या अपडेट नहीं किया जा सकता
summary: ClawHub साइन-इन, इंस्टॉल, प्रकाशित करने, अपडेट और API समस्याओं का निवारण।
x-i18n:
    generated_at: "2026-07-02T22:31:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# समस्या निवारण

## `clawhub login` ब्राउज़र खोलता है लेकिन कभी पूरा नहीं होता

CLI ब्राउज़र लॉगिन के दौरान एक अल्पकालिक स्थानीय कॉलबैक सर्वर शुरू करता है।

- सुनिश्चित करें कि आपका ब्राउज़र `http://127.0.0.1:<port>/callback` तक पहुंच सकता है।
- यदि कॉलबैक कभी नहीं आता है, तो स्थानीय फ़ायरवॉल, VPN, और प्रॉक्सी नियम जांचें।
- हेडलेस परिवेशों में, ClawHub वेब UI में API टोकन बनाएं और चलाएं:

```bash
clawhub login --token clh_...
```

## `whoami` या `publish` `Unauthorized` (401) लौटाता है

- `clawhub login` से फिर से साइन इन करें।
- यदि आप कस्टम कॉन्फ़िग पथ का उपयोग करते हैं, तो पुष्टि करें कि `CLAWHUB_CONFIG_PATH` उस
  फ़ाइल की ओर इशारा करता है जिसमें आपका मौजूदा टोकन है।
- यदि आप API टोकन का उपयोग करते हैं, तो पुष्टि करें कि उसे वेब UI में निरस्त नहीं किया गया था।

## खोज या इंस्टॉल `Rate limit exceeded` (429) लौटाता है

प्रतिक्रिया में पुनः प्रयास जानकारी पढ़ें:

- `Retry-After`: पुनः प्रयास करने से पहले प्रतीक्षा करने के सेकंड।
- `RateLimit-Limit`: इस अनुरोध पर लागू सीमा।
- `RateLimit-Remaining`: हेडर मौजूद होने पर आपका सटीक शेष बजट। `429` पर, यह `0` होता है।
- `RateLimit-Reset` या `X-RateLimit-Reset`: रीसेट समय।

यदि कई उपयोगकर्ता एक एग्रेस IP साझा करते हैं, तो अनाम IP सीमाएं तब भी पूरी हो सकती हैं जब प्रत्येक
व्यक्ति केवल कुछ अनुरोध भेजता हो। जहां संभव हो साइन इन करें और बताई गई देरी के बाद पुनः प्रयास करें।

## खोज या इंस्टॉल प्रॉक्सी के पीछे विफल होता है

CLI मानक प्रॉक्सी वेरिएबल्स का सम्मान करता है:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

समर्थित नामों में `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, और
`http_proxy` शामिल हैं।

## कोई skill खोज में दिखाई नहीं देता

- यदि आपको पता है, तो सटीक स्लग या मालिक पेज जांचें।
- पुष्टि करें कि रिलीज़ सार्वजनिक है और स्कैन या मॉडरेशन द्वारा रोकी नहीं गई है।
- यदि skill आपका है, तो साइन इन करें और उसका निरीक्षण करें:

```bash
clawhub inspect @openclaw/demo
```

मालिक को दिखाई देने वाले निदान स्कैन, अपलोड-गेट, या मॉडरेशन स्थिति समझा सकते हैं।

## प्रकाशन विफल होता है क्योंकि आवश्यक मेटाडेटा मौजूद नहीं है

skills के लिए, `SKILL.md` frontmatter जांचें। आवश्यक एनवायरनमेंट वेरिएबल्स और
टूल घोषित होने चाहिए ताकि उपयोगकर्ता और स्कैनर पैकेज को समझ सकें।

plugins के लिए, `package.json` संगतता मेटाडेटा जांचें। Code-plugin प्रकाशनों को
`openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` जैसे OpenClaw संगतता फ़ील्ड चाहिए।

पहले प्रकाशन पेलोड का पूर्वावलोकन करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## प्रकाशन GitHub मालिक या स्रोत त्रुटि के कारण विफल होता है

ClawHub पैकेजों को उनके प्रकाशकों से जोड़ने के लिए GitHub पहचान और स्रोत आरोपण का उपयोग करता है।

- सुनिश्चित करें कि आपने उस GitHub खाते से साइन इन किया है जो पैकेज का मालिक है या उसे प्रकाशित कर सकता है।
- जांचें कि स्रोत URL सार्वजनिक है या ClawHub के लिए सुलभ है।
- GitHub स्रोतों के लिए, `owner/repo`, `owner/repo@ref`, या पूर्ण GitHub URL का उपयोग करें।

## प्रकाशन विफल होता है क्योंकि कोई namespace दावा किया गया या आरक्षित है

यदि प्रकाशन इसलिए विफल होता है क्योंकि मालिक हैंडल, org namespace, पैकेज scope, skill
स्लग, या पैकेज नाम पहले से दावा किया गया या आरक्षित है, तो पहले पुष्टि करें कि आप
namespace से मेल खाने वाले मालिक के साथ प्रकाशित कर रहे हैं। plugin पैकेजों के लिए,
`@example-org/example-plugin` जैसे scoped नामों को मेल खाते
`example-org` मालिक के रूप में प्रकाशित किया जाना चाहिए।

यदि आपको लगता है कि आपका org, प्रोजेक्ट, या ब्रांड सही namespace मालिक है लेकिन
आप मौजूदा ClawHub मालिक को प्रबंधित नहीं कर सकते, तो सार्वजनिक, गैर-संवेदनशील प्रमाण के साथ
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। प्रमाण मार्गदर्शन और सार्वजनिक issues से क्या बाहर रखना है, इसके लिए
[Org और Namespace Claims](/clawhub/namespace-claims) देखें।

## `sync` कहता है कि कोई skills नहीं मिले

`sync` `SKILL.md` या `skill.md` वाली फ़ोल्डर खोजता है।

इसे उन roots की ओर निर्देशित करें जिन्हें आप स्कैन करना चाहते हैं:

```bash
clawhub sync --root /path/to/skills
```

यदि आपको पक्का नहीं है कि क्या प्रकाशित होगा, तो पहले पूर्वावलोकन करें:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` स्थानीय बदलावों के कारण मना करता है

स्थानीय फ़ाइलें ClawHub को ज्ञात किसी भी संस्करण से मेल नहीं खातीं। एक चुनें:

- स्थानीय संपादन रखें और update छोड़ दें।
- प्रकाशित संस्करण से overwrite करें:

```bash
clawhub update @openclaw/demo --force
```

- अपनी संपादित कॉपी को नए स्लग या fork के रूप में प्रकाशित करें।

## OpenClaw में plugin install विफल होता है

- स्पष्ट ClawHub स्रोत का उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

- स्कैन स्थिति और संगतता मेटाडेटा के लिए पैकेज विवरण पेज जांचें।
- पुष्टि करें कि आपका OpenClaw संस्करण पैकेज की विज्ञापित
  संगतता रेंज को संतुष्ट करता है।
- यदि पैकेज hidden, held, या blocked है, तो मालिक द्वारा समस्या हल किए जाने तक
  यह install करने योग्य नहीं हो सकता।

## सार्वजनिक API अनुरोध विफल होते हैं

- `429` पुनः प्रयास हेडर्स का सम्मान करें और सार्वजनिक list/search प्रतिक्रियाओं को cache करें।
- उपयोगकर्ताओं को canonical ClawHub listing पर वापस link करें।
- hidden, private, held, या moderation-blocked सामग्री को सार्वजनिक API surface के बाहर
  mirror न करें।

endpoint विवरणों के लिए [HTTP API](/clawhub/http-api) देखें।
