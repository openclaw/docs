---
read_when:
    - सूचियों, संस्करणों, इंस्टॉल, प्रकाशन और मॉडरेशन को समझना
summary: ClawHub लिस्टिंग, संस्करण, इंस्टॉल, प्रकाशन, स्कैन और अपडेट कैसे काम करते हैं।
x-i18n:
    generated_at: "2026-07-03T00:56:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub कैसे काम करता है

ClawHub, OpenClaw Skills और Plugin के लिए registry layer है। यह उपयोगकर्ताओं को
packages खोजने की जगह देता है, publishers को versions release करने की जगह देता है, और
OpenClaw को उन packages को सुरक्षित रूप से install और update करने के लिए पर्याप्त metadata देता है।

## Registry records

हर public listing एक registry record है, जिसमें शामिल होता है:

- owner और slug या package name
- एक या अधिक published versions
- metadata, summary, files, और source attribution
- changelog और tag जानकारी, जैसे `latest`
- download, install, और star signals
- security scan और moderation status

listing page उपयोगकर्ताओं के लिए canonical जगह है, जहाँ वे install करने से पहले देख सकते हैं कि कोई Skill या
Plugin क्या करने का दावा करता है।

## Skills

Skill एक versioned text bundle है जो `SKILL.md` पर केंद्रित होता है। इसमें
supporting files, examples, templates, और scripts शामिल हो सकते हैं।

ClawHub, Skill name, description, requirements, environment variables, और metadata समझने के लिए
`SKILL.md` frontmatter पढ़ता है। सटीक metadata महत्वपूर्ण है क्योंकि यह उपयोगकर्ताओं को यह तय करने में मदद करता है कि Skill install करना है या नहीं, और automated scans को घोषित और देखे गए behavior के बीच mismatches पहचानने में मदद करता है।

देखें [Skill प्रारूप](/hi/clawhub/skill-format)।

## Plugins

Plugins packaged OpenClaw extensions हैं। ClawHub package metadata,
compatibility information, source links, artifacts, और version records store करता है।

जब OpenClaw, ClawHub से कोई Plugin install करता है, तो वह install करने से पहले advertised compatibility
metadata check करता है। Package records में API compatibility,
minimum Gateway version, host targets, environment requirements, और artifact
digests शामिल हो सकते हैं।

जब आप registry को source of truth बनाना चाहते हैं, तो explicit ClawHub install source इस्तेमाल करें:

```bash
openclaw plugins install clawhub:<package>
```

## Publishing

Publishing एक नया immutable version record बनाता है। Publishers authenticated registry workflows के लिए `clawhub`
CLI इस्तेमाल करते हैं:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

upload से पहले resolved payload preview करने के लिए dry runs इस्तेमाल करें। फिर public pages
published metadata, files, source attribution, और scan status दिखाते हैं।

## Installs और updates

OpenClaw install commands, ClawHub को package source के रूप में इस्तेमाल करते हैं:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw install source metadata record करता है ताकि updates बाद में उसी
registry package को resolve कर सकें। ClawHub CLI उन उपयोगकर्ताओं के लिए direct Skill install और
update workflows भी support करता है जो full OpenClaw workspace के बाहर registry-managed Skill folders चाहते हैं।

## Security state

ClawHub publishing के लिए खुला है, लेकिन releases फिर भी upload gates,
automated checks, user reports, और moderator action के अधीन होते हैं।

उपलब्ध होने पर public pages scan summaries दिखाते हैं। Held, hidden,
या blocked content public search और install flows से गायब हो सकता है, जबकि diagnostics के लिए owner को visible रह सकता है।

देखें [Security](/clawhub/security), [Security Audits](/clawhub/security-audits),
[Moderation और Account Safety](/hi/clawhub/moderation), और
[Acceptable usage](/clawhub/acceptable-usage)।

## API access

ClawHub discovery, search, package details, और downloads के लिए public read APIs expose करता है। Third-party catalogs इन APIs का उपयोग कर सकते हैं, जब वे canonical ClawHub listing पर वापस link करें, rate limits का सम्मान करें, और endorsement imply करने से बचें।

देखें [Public API](/hi/clawhub/api) और [HTTP API](/clawhub/http-api)।
