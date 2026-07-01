---
read_when:
    - ClawHub CLI या OpenClaw registry commands विफल होते हैं
    - किसी पैकेज को इंस्टॉल, प्रकाशित या अपडेट नहीं किया जा सकता
summary: ClawHub में साइन-इन, इंस्टॉल, प्रकाशन, अपडेट और API से जुड़ी समस्याओं का समस्या-निवारण।
x-i18n:
    generated_at: "2026-07-01T18:13:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# समस्या निवारण

## `clawhub login` ब्राउज़र खोलता है लेकिन कभी पूरा नहीं होता

CLI ब्राउज़र लॉगिन के दौरान एक अल्पकालिक स्थानीय callback सर्वर शुरू करता है।

- सुनिश्चित करें कि आपका ब्राउज़र `http://127.0.0.1:<port>/callback` तक पहुंच सकता है।
- यदि callback कभी नहीं आता है, तो स्थानीय firewall, VPN और proxy नियम जांचें।
- headless परिवेशों में, ClawHub वेब UI में एक API token बनाएं और चलाएं:

```bash
clawhub login --token clh_...
```

## `whoami` या `publish` `Unauthorized` (401) लौटाता है

- `clawhub login` से फिर से साइन इन करें।
- यदि आप custom config path का उपयोग करते हैं, तो पुष्टि करें कि `CLAWHUB_CONFIG_PATH` उस
  file की ओर इंगित करता है जिसमें आपका मौजूदा token है।
- यदि आप API token का उपयोग करते हैं, तो पुष्टि करें कि उसे वेब UI में revoked नहीं किया गया था।

## खोज या install `Rate limit exceeded` (429) लौटाता है

response में retry जानकारी पढ़ें:

- `Retry-After`: retry करने से पहले प्रतीक्षा करने के सेकंड।
- `RateLimit-Limit`: इस request पर लागू limit।
- `RateLimit-Remaining`: header मौजूद होने पर आपका सटीक शेष budget। `429` पर, यह `0` होता है।
- `RateLimit-Reset` या `X-RateLimit-Reset`: reset timing।

यदि कई user एक egress IP साझा करते हैं, तो anonymous IP limits hit हो सकती हैं, भले ही हर
व्यक्ति केवल कुछ requests भेजे। जहां संभव हो साइन इन करें और बताई गई
देरी के बाद retry करें।

## proxy के पीछे खोज या install विफल होता है

CLI standard proxy variables का सम्मान करता है:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

समर्थित names में `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, और
`http_proxy` शामिल हैं।

## कोई Skills search में दिखाई नहीं देता

- यदि आपको exact slug या owner page पता है, तो उसे जांचें।
- पुष्टि करें कि release public है और scan या moderation द्वारा hold पर नहीं है।
- यदि आप Skill के owner हैं, तो साइन इन करें और उसका निरीक्षण करें:

```bash
clawhub inspect @openclaw/demo
```

Owner-visible diagnostics scan, upload-gate, या moderation state समझा सकते हैं।

## publish विफल होता है क्योंकि आवश्यक metadata missing है

Skills के लिए, `SKILL.md` frontmatter जांचें। आवश्यक environment variables और
tools घोषित होने चाहिए ताकि users और scanners package को समझ सकें।

plugins के लिए, `package.json` compatibility metadata जांचें। Code-plugin publishes के लिए
`openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` जैसे OpenClaw compatibility fields चाहिए।

पहले publish payload का preview करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## publish GitHub owner या source error के कारण विफल होता है

ClawHub packages को उनके publishers से जोड़ने के लिए GitHub identity और source attribution का उपयोग करता है।

- सुनिश्चित करें कि आप उस GitHub account से साइन इन हैं जो package का owner है या publish कर सकता है।
- जांचें कि source URL public है या ClawHub के लिए accessible है।
- GitHub sources के लिए, `owner/repo`, `owner/repo@ref`, या पूरा GitHub URL उपयोग करें।

## publish विफल होता है क्योंकि namespace claimed या reserved है

यदि publish इसलिए विफल होता है क्योंकि owner handle, org namespace, package scope, Skill
slug, या package name पहले से claimed या reserved है, तो पहले पुष्टि करें कि आप
उस owner से publish कर रहे हैं जो namespace से मेल खाता है। Plugin packages के लिए,
`@example-org/example-plugin` जैसे scoped names को matching
`example-org` owner के रूप में publish किया जाना चाहिए।

यदि आपको लगता है कि आपका org, project, या brand rightful namespace owner है लेकिन
आप मौजूदा ClawHub owner को manage नहीं कर सकते, तो public, non-sensitive proof के साथ एक
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। evidence guidance और public issues से क्या
बाहर रखना है, इसके लिए
[Org and Namespace Claims](/clawhub/namespace-claims) देखें।

## `sync` कहता है कि कोई Skills नहीं मिला

`sync` `SKILL.md` या `skill.md` वाले folders खोजता है।

इसे उन roots की ओर point करें जिन्हें आप scan करना चाहते हैं:

```bash
clawhub sync --root /path/to/skills
```

यदि आप unsure हैं कि क्या publish होगा, तो पहले preview करें:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` local changes के कारण मना करता है

local files ClawHub को ज्ञात किसी भी version से मेल नहीं खातीं। एक चुनें:

- local edits रखें और update छोड़ दें।
- published version से overwrite करें:

```bash
clawhub update @openclaw/demo --force
```

- अपनी edited copy को नए slug या fork के रूप में publish करें।

## OpenClaw में Plugin install विफल होता है

- explicit ClawHub source उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

- scan status और compatibility metadata के लिए package detail page जांचें।
- पुष्टि करें कि आपका OpenClaw version package की advertised
  compatibility range को satisfy करता है।
- यदि package hidden, held, या blocked है, तो owner द्वारा issue resolve किए जाने तक
  वह installable नहीं हो सकता है।

## Public API requests विफल होते हैं

- `429` retry headers का सम्मान करें और public list/search responses को cache करें।
- users को canonical ClawHub listing पर वापस link करें।
- public API surface के बाहर hidden, private, held, या moderation-blocked content को
  mirror न करें।

endpoint details के लिए [HTTP API](/clawhub/http-api) देखें।
