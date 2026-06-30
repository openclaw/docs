---
read_when:
    - ClawHub CLI या OpenClaw रजिस्ट्री कमांड विफल होते हैं
    - किसी पैकेज को इंस्टॉल, प्रकाशित या अपडेट नहीं किया जा सकता
summary: ClawHub साइन-इन, इंस्टॉल, प्रकाशन, अपडेट, और API समस्याओं का समस्या निवारण।
x-i18n:
    generated_at: "2026-06-30T22:17:08Z"
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
- हेडलेस वातावरणों में, ClawHub वेब UI में एक API टोकन बनाएं और चलाएं:

```bash
clawhub login --token clh_...
```

## `whoami` या `publish` `Unauthorized` (401) लौटाता है

- `clawhub login` से फिर से साइन इन करें।
- यदि आप कस्टम कॉन्फ़िग पाथ का उपयोग करते हैं, तो पुष्टि करें कि `CLAWHUB_CONFIG_PATH` उस
  फ़ाइल की ओर इशारा करता है जिसमें आपका वर्तमान टोकन है।
- यदि आप API टोकन का उपयोग करते हैं, तो पुष्टि करें कि उसे वेब UI में निरस्त नहीं किया गया है।

## खोज या इंस्टॉल `Rate limit exceeded` (429) लौटाता है

प्रतिक्रिया में retry जानकारी पढ़ें:

- `Retry-After`: फिर से प्रयास करने से पहले प्रतीक्षा करने के सेकंड।
- `RateLimit-Limit`: इस अनुरोध पर लागू सीमा।
- `RateLimit-Remaining`: हेडर मौजूद होने पर आपका सटीक शेष बजट। `429` पर, यह `0` होता है।
- `RateLimit-Reset` या `X-RateLimit-Reset`: रीसेट समय।

यदि कई उपयोगकर्ता एक egress IP साझा करते हैं, तो प्रत्येक व्यक्ति द्वारा केवल कुछ अनुरोध भेजने पर भी
अनाम IP सीमाएं हिट हो सकती हैं। जहां संभव हो साइन इन करें और बताई गई
देरी के बाद फिर से प्रयास करें।

## खोज या इंस्टॉल प्रॉक्सी के पीछे विफल होता है

CLI मानक प्रॉक्सी वेरिएबल्स का सम्मान करता है:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

समर्थित नामों में `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, और
`http_proxy` शामिल हैं।

## कोई स्किल खोज में दिखाई नहीं देता

- यदि आप exact slug या owner page जानते हैं, तो उसे जांचें।
- पुष्टि करें कि release सार्वजनिक है और scan या moderation द्वारा रोकी नहीं गई है।
- यदि आप स्किल के स्वामी हैं, तो साइन इन करें और उसका निरीक्षण करें:

```bash
clawhub inspect @openclaw/demo
```

स्वामी-दृश्यमान diagnostics scan, upload-gate, या moderation स्थिति समझा सकते हैं।

## आवश्यक metadata गायब होने के कारण publish विफल होता है

स्किल्स के लिए, `SKILL.md` frontmatter जांचें। आवश्यक environment variables और
tools घोषित होने चाहिए ताकि उपयोगकर्ता और scanners package को समझ सकें।

Plugins के लिए, `package.json` compatibility metadata जांचें। Code-plugin publishes को
`openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` जैसे OpenClaw compatibility fields चाहिए।

पहले publish payload का preview करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub owner या source error के कारण publish विफल होता है

ClawHub packages को उनके publishers से जोड़ने के लिए GitHub identity और source attribution का उपयोग करता है।

- सुनिश्चित करें कि आप उस GitHub खाते से signed in हैं जो package का स्वामी है या उसे publish कर सकता है।
- जांचें कि source URL सार्वजनिक है या ClawHub के लिए accessible है।
- GitHub sources के लिए, `owner/repo`, `owner/repo@ref`, या पूर्ण GitHub URL का उपयोग करें।

## Namespace claim या reserve होने के कारण publish विफल होता है

यदि owner handle, org namespace, package scope, skill
slug, या package name पहले से claimed या reserved होने के कारण publish विफल होता है, तो पहले पुष्टि करें कि आप
उस owner के साथ publish कर रहे हैं जो namespace से मेल खाता है। Plugin packages के लिए,
`@example-org/example-plugin` जैसे scoped names को matching
`example-org` owner के रूप में publish किया जाना चाहिए।

यदि आपको लगता है कि आपका org, project, या brand सही namespace owner है लेकिन
आप वर्तमान ClawHub owner को manage नहीं कर सकते, तो सार्वजनिक, non-sensitive proof के साथ
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। Evidence guidance और public issues से क्या बाहर रखना है, इसके लिए
[Org and Namespace Claims](/clawhub/namespace-claims) देखें।

## `sync` कहता है कि कोई skills नहीं मिले

`sync` `SKILL.md` या `skill.md` वाली folders खोजता है।

इसे उन roots की ओर इंगित करें जिन्हें आप scan करना चाहते हैं:

```bash
clawhub sync --root /path/to/skills
```

यदि आप निश्चित नहीं हैं कि क्या publish होगा, तो पहले preview करें:

```bash
clawhub sync --all --dry-run --no-input
```

## स्थानीय changes के कारण `update` मना करता है

स्थानीय files ClawHub को ज्ञात किसी भी version से मेल नहीं खातीं। एक चुनें:

- स्थानीय edits रखें और update छोड़ दें।
- Published version से overwrite करें:

```bash
clawhub update @openclaw/demo --force
```

- अपनी edited copy को नए slug या fork के रूप में publish करें।

## OpenClaw में Plugin install विफल होता है

- स्पष्ट ClawHub source का उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

- Scan status और compatibility metadata के लिए package detail page जांचें।
- पुष्टि करें कि आपका OpenClaw version package की advertised
  compatibility range को satisfy करता है।
- यदि package hidden, held, या blocked है, तो owner द्वारा issue resolve किए जाने तक
  यह installable नहीं हो सकता।

## Public API requests विफल होते हैं

- `429` retry headers का सम्मान करें और public list/search responses cache करें।
- उपयोगकर्ताओं को canonical ClawHub listing पर वापस link करें।
- Hidden, private, held, या moderation-blocked content को public API surface के बाहर
  mirror न करें।

Endpoint details के लिए [HTTP API](/clawhub/http-api) देखें।
