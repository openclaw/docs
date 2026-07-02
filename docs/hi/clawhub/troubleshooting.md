---
read_when:
    - ClawHub CLI या OpenClaw रजिस्ट्री कमांड विफल हो जाते हैं
    - पैकेज इंस्टॉल, प्रकाशित या अपडेट नहीं किया जा सकता
summary: ClawHub में साइन इन, इंस्टॉल, प्रकाशन, अपडेट और API संबंधी समस्याओं का समस्या निवारण।
x-i18n:
    generated_at: "2026-07-02T17:38:37Z"
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

- सुनिश्चित करें कि आपका ब्राउज़र `http://127.0.0.1:<port>/callback` तक पहुँच सकता है।
- यदि कॉलबैक कभी नहीं आता, तो स्थानीय फ़ायरवॉल, VPN और प्रॉक्सी नियम जाँचें।
- हेडलेस परिवेशों में, ClawHub वेब UI में API टोकन बनाएँ और चलाएँ:

```bash
clawhub login --token clh_...
```

## `whoami` या `publish` `Unauthorized` (401) लौटाता है

- `clawhub login` से फिर से साइन इन करें।
- यदि आप कस्टम कॉन्फ़िग पथ का उपयोग करते हैं, तो पुष्टि करें कि `CLAWHUB_CONFIG_PATH` उस
  फ़ाइल की ओर संकेत करता है जिसमें आपका मौजूदा टोकन है।
- यदि आप API टोकन का उपयोग करते हैं, तो पुष्टि करें कि उसे वेब UI में रद्द नहीं किया गया था।

## खोज या इंस्टॉल `Rate limit exceeded` (429) लौटाता है

प्रतिक्रिया में पुनः प्रयास की जानकारी पढ़ें:

- `Retry-After`: पुनः प्रयास करने से पहले प्रतीक्षा करने के सेकंड।
- `RateLimit-Limit`: इस अनुरोध पर लागू सीमा।
- `RateLimit-Remaining`: हेडर मौजूद होने पर आपका सटीक शेष बजट। `429` पर, यह `0` होता है।
- `RateLimit-Reset` या `X-RateLimit-Reset`: रीसेट समय।

यदि कई उपयोगकर्ता एक ही एग्रेस IP साझा करते हैं, तो अनाम IP सीमाएँ तब भी पूरी हो सकती हैं जब प्रत्येक
व्यक्ति केवल कुछ अनुरोध भेजता हो। जहाँ संभव हो साइन इन करें और बताई गई
देरी के बाद पुनः प्रयास करें।

## प्रॉक्सी के पीछे खोज या इंस्टॉल विफल होता है

CLI मानक प्रॉक्सी वेरिएबल्स का सम्मान करता है:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

समर्थित नामों में `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` और
`http_proxy` शामिल हैं।

## कोई Skill खोज में नहीं दिखता

- यदि आपको सटीक स्लग या owner पेज पता है, तो उसे जाँचें।
- पुष्टि करें कि रिलीज़ सार्वजनिक है और स्कैन या मॉडरेशन में रोकी नहीं गई है।
- यदि आप Skill के owner हैं, तो साइन इन करके उसका निरीक्षण करें:

```bash
clawhub inspect @openclaw/demo
```

owner को दिखने वाले डायग्नॉस्टिक्स स्कैन, अपलोड-गेट या मॉडरेशन स्थिति समझा सकते हैं।

## आवश्यक मेटाडेटा गायब होने के कारण publish विफल होता है

Skills के लिए, `SKILL.md` frontmatter जाँचें। आवश्यक एनवायरनमेंट वेरिएबल्स और
टूल्स घोषित होने चाहिए ताकि उपयोगकर्ता और स्कैनर पैकेज को समझ सकें।

Plugins के लिए, `package.json` संगतता मेटाडेटा जाँचें। Code-plugin publish के लिए
`openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` जैसे OpenClaw संगतता फ़ील्ड चाहिए।

पहले publish पेलोड का पूर्वावलोकन करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub owner या स्रोत त्रुटि के साथ publish विफल होता है

ClawHub पैकेजों को उनके publishers से जोड़ने के लिए GitHub पहचान और स्रोत एट्रिब्यूशन का उपयोग करता है।

- सुनिश्चित करें कि आप उस GitHub खाते से साइन इन हैं जो पैकेज का owner है या उसे publish कर सकता है।
- जाँचें कि स्रोत URL सार्वजनिक है या ClawHub के लिए पहुँच योग्य है।
- GitHub स्रोतों के लिए, `owner/repo`, `owner/repo@ref`, या पूर्ण GitHub URL का उपयोग करें।

## namespace claimed या reserved होने के कारण publish विफल होता है

यदि publish इसलिए विफल होता है क्योंकि owner handle, org namespace, package scope, Skill
slug, या package name पहले से claimed या reserved है, तो पहले पुष्टि करें कि आप
namespace से मेल खाने वाले owner के साथ publish कर रहे हैं। Plugin पैकेजों के लिए,
`@example-org/example-plugin` जैसे scoped नामों को मेल खाने वाले
`example-org` owner के रूप में publish किया जाना चाहिए।

यदि आपको लगता है कि आपका org, project या brand वैध namespace owner है लेकिन
आप मौजूदा ClawHub owner को प्रबंधित नहीं कर सकते, तो सार्वजनिक, गैर-संवेदनशील प्रमाण के साथ
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। प्रमाण मार्गदर्शन और सार्वजनिक issues से क्या बाहर रखना है, इसके लिए
[Org और Namespace Claims](/clawhub/namespace-claims) देखें।

## `sync` कहता है कि कोई Skills नहीं मिले

`sync` `SKILL.md` या `skill.md` वाली फ़ोल्डर खोजता है।

इसे उन roots की ओर इंगित करें जिन्हें आप स्कैन करना चाहते हैं:

```bash
clawhub sync --root /path/to/skills
```

यदि आप सुनिश्चित नहीं हैं कि क्या publish होगा, तो पहले पूर्वावलोकन करें:

```bash
clawhub sync --all --dry-run --no-input
```

## स्थानीय बदलावों के कारण `update` मना कर देता है

स्थानीय फ़ाइलें ClawHub को ज्ञात किसी भी संस्करण से मेल नहीं खातीं। एक चुनें:

- स्थानीय edits रखें और update छोड़ दें।
- प्रकाशित संस्करण से overwrite करें:

```bash
clawhub update @openclaw/demo --force
```

- अपनी edited copy को नए slug या fork के रूप में publish करें।

## OpenClaw में Plugin install विफल होता है

- स्पष्ट ClawHub स्रोत का उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

- स्कैन स्थिति और संगतता मेटाडेटा के लिए package detail page जाँचें।
- पुष्टि करें कि आपका OpenClaw संस्करण पैकेज की घोषित
  compatibility range को पूरा करता है।
- यदि पैकेज hidden, held, या blocked है, तो owner द्वारा समस्या हल करने तक
  वह install योग्य नहीं हो सकता।

## सार्वजनिक API अनुरोध विफल होते हैं

- `429` retry headers का सम्मान करें और सार्वजनिक list/search प्रतिक्रियाओं को cache करें।
- उपयोगकर्ताओं को canonical ClawHub listing पर वापस लिंक करें।
- hidden, private, held, या moderation-blocked सामग्री को सार्वजनिक
  API surface के बाहर mirror न करें।

endpoint विवरणों के लिए [HTTP API](/clawhub/http-api) देखें।
