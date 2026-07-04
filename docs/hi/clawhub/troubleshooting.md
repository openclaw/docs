---
read_when:
    - ClawHub CLI या OpenClaw रजिस्ट्री कमांड विफल होते हैं
    - किसी पैकेज को इंस्टॉल, प्रकाशित या अपडेट नहीं किया जा सकता
summary: ClawHub में साइन-इन, इंस्टॉल, प्रकाशन, अपडेट और API से जुड़ी समस्याओं का समस्या निवारण।
x-i18n:
    generated_at: "2026-07-04T17:59:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# समस्या निवारण

## `clawhub login` ब्राउज़र खोलता है लेकिन कभी पूरा नहीं होता

CLI ब्राउज़र लॉगिन के दौरान एक अल्पकालिक स्थानीय callback server शुरू करता है।

- सुनिश्चित करें कि आपका ब्राउज़र `http://127.0.0.1:<port>/callback` तक पहुँच सकता है।
- यदि callback कभी नहीं आता, तो स्थानीय firewall, VPN, और proxy नियम जाँचें।
- headless environments में, ClawHub web UI में एक API token बनाएँ और चलाएँ:

```bash
clawhub login --token clh_...
```

## `whoami` या `publish` `Unauthorized` (401) लौटाता है

- `clawhub login` से फिर से sign in करें।
- यदि आप custom config path इस्तेमाल करते हैं, तो पुष्टि करें कि `CLAWHUB_CONFIG_PATH` उस
  फ़ाइल की ओर इशारा करता है जिसमें आपका मौजूदा token है।
- यदि आप API token इस्तेमाल करते हैं, तो पुष्टि करें कि उसे web UI में revoke नहीं किया गया है।

## Search या install `Rate limit exceeded` (429) लौटाता है

response में retry जानकारी पढ़ें:

- `Retry-After`: retry करने से पहले प्रतीक्षा करने के सेकंड।
- `RateLimit-Limit`: इस request पर लागू की गई limit।
- `RateLimit-Remaining`: header मौजूद होने पर आपका सटीक शेष budget। `429` पर, यह `0` होता है।
- `RateLimit-Reset` या `X-RateLimit-Reset`: reset timing।

यदि कई users एक egress IP साझा करते हैं, तो anonymous IP limits hit हो सकती हैं, भले ही हर
व्यक्ति केवल कुछ requests भेजे। जहाँ संभव हो sign in करें और बताई गई delay के बाद retry करें।

## Search या install proxy के पीछे विफल होता है

CLI standard proxy variables का सम्मान करता है:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Supported names में `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, और
`http_proxy` शामिल हैं।

## कोई Skill search में दिखाई नहीं देता

- यदि आपको exact slug या owner page पता है, तो उसे जाँचें।
- पुष्टि करें कि release public है और scan या moderation के कारण held नहीं है।
- यदि आप Skill के owner हैं, तो sign in करें और उसे inspect करें:

```bash
clawhub inspect @openclaw/demo
```

Owner-visible diagnostics scan, upload-gate, या moderation state समझा सकते हैं।

## Publish विफल होता है क्योंकि required metadata missing है

Skills के लिए, `SKILL.md` frontmatter जाँचें। Required environment variables और
tools घोषित होने चाहिए ताकि users और scanners package को समझ सकें।

Plugins के लिए, `package.json` compatibility metadata जाँचें। Code-plugin publishes के लिए
OpenClaw compatibility fields जैसे `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` चाहिए।

पहले publish payload preview करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publish GitHub owner या source error के कारण विफल होता है

ClawHub packages को उनके publishers से जोड़ने के लिए GitHub identity और source attribution इस्तेमाल करता है।

- सुनिश्चित करें कि आप उस GitHub account से signed in हैं जो package का owner है या publish कर सकता है।
- जाँचें कि source URL public है या ClawHub के लिए accessible है।
- GitHub sources के लिए, `owner/repo`, `owner/repo@ref`, या पूरा GitHub URL इस्तेमाल करें।

## Publish विफल होता है क्योंकि namespace claimed या reserved है

यदि publish इसलिए विफल होता है क्योंकि owner handle, org namespace, package scope, Skill
slug, या package name पहले से claimed या reserved है, तो पहले पुष्टि करें कि आप
namespace से मेल खाने वाले owner के साथ publish कर रहे हैं। Plugin packages के लिए,
`@example-org/example-plugin` जैसे scoped names को matching `example-org` owner के रूप में publish करना होगा।

यदि आपको लगता है कि आपका org, project, या brand सही namespace owner है लेकिन
आप current ClawHub owner manage नहीं कर सकते, तो public, non-sensitive proof के साथ
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
खोलें। evidence guidance और public issues से बाहर क्या रखना है, इसके लिए
[Org and Namespace Claims](/clawhub/namespace-claims) देखें।

## `sync` कहता है कि कोई Skills नहीं मिलीं

`sync` `SKILL.md` या `skill.md` वाली folders ढूँढता है।

इसे उन roots की ओर point करें जिन्हें आप scan करना चाहते हैं:

```bash
clawhub sync --root /path/to/skills
```

यदि आप सुनिश्चित नहीं हैं कि क्या publish होगा, तो पहले preview करें:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` local changes के कारण मना करता है

Local files ClawHub को ज्ञात किसी version से मेल नहीं खातीं। एक चुनें:

- Local edits रखें और update skip करें।
- Published version से overwrite करें:

```bash
clawhub update @openclaw/demo --force
```

- अपनी edited copy को नए slug या fork के रूप में publish करें।

## OpenClaw में Plugin install विफल होता है

- Explicit ClawHub source इस्तेमाल करें:

```bash
openclaw plugins install clawhub:<package>
```

- scan status और compatibility metadata के लिए package detail page जाँचें।
- पुष्टि करें कि आपका OpenClaw version package की advertised
  compatibility range पूरी करता है।
- यदि package hidden, held, या blocked है, तो owner द्वारा issue resolve किए जाने तक
  वह installable नहीं हो सकता।

## Public API requests विफल होती हैं

- `429` retry headers का सम्मान करें और public list/search responses cache करें।
- users को canonical ClawHub listing पर वापस link करें।
- hidden, private, held, या moderation-blocked content को public API surface के बाहर
  mirror न करें।

endpoint details के लिए [HTTP API](/clawhub/http-api) देखें।
