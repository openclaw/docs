---
read_when:
    - लिस्टिंग, संस्करण, इंस्टॉल, प्रकाशन, और मॉडरेशन को समझना
summary: ClawHub लिस्टिंग, संस्करण, इंस्टॉल, प्रकाशन, स्कैन और अपडेट कैसे काम करते हैं।
x-i18n:
    generated_at: "2026-07-03T17:19:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub कैसे काम करता है

ClawHub OpenClaw Skills और Plugin के लिए registry परत है। यह उपयोगकर्ताओं को
package खोजने की जगह देता है, publishers को versions release करने की जगह देता है, और
OpenClaw को उन packages को सुरक्षित रूप से install और update करने के लिए पर्याप्त metadata देता है।

## Registry records

हर सार्वजनिक listing एक registry record होती है, जिसमें शामिल होते हैं:

- owner और slug या package name
- एक या अधिक published versions
- metadata, summary, files, और source attribution
- changelog और tag जानकारी, जैसे `latest`
- download, install, और star signals
- security scan और moderation status

listing page वह canonical जगह है जहाँ उपयोगकर्ता किसी skill या
plugin को install करने से पहले यह देख सकते हैं कि वह क्या करने का दावा करता है।

## Skills

skill एक versioned text bundle है जो `SKILL.md` पर केंद्रित होता है। इसमें
supporting files, examples, templates, और scripts शामिल हो सकते हैं।

ClawHub `SKILL.md` frontmatter पढ़कर skill name,
description, requirements, environment variables, और metadata समझता है। सटीक
metadata महत्वपूर्ण है क्योंकि यह उपयोगकर्ताओं को यह तय करने में मदद करता है कि skill install करनी है या नहीं, और
automated scans को declared और observed behavior के बीच mismatches पहचानने में मदद करता है।

देखें [Skill format](/clawhub/skill-format)।

## Plugins

Plugins packaged OpenClaw extensions हैं। ClawHub package metadata,
compatibility information, source links, artifacts, और version records store करता है।

जब OpenClaw ClawHub से plugin install करता है, तो वह install करने से पहले advertised compatibility
metadata जाँचता है। Package records में API compatibility,
minimum gateway version, host targets, environment requirements, और artifact
digests शामिल हो सकते हैं।

जब आप चाहते हैं कि registry source of truth हो, तो explicit ClawHub install source का उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

## Publishing

Publishing एक नया immutable version record बनाता है। Publishers authenticated registry workflows के लिए `clawhub`
CLI का उपयोग करते हैं:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

upload से पहले resolved payload का preview देखने के लिए dry runs का उपयोग करें। Public pages फिर
published metadata, files, source attribution, और scan status दिखाते हैं।

## Installs और updates

OpenClaw install commands ClawHub को package source के रूप में उपयोग करते हैं:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw install source metadata record करता है ताकि updates बाद में उसी
registry package को resolve कर सकें। ClawHub CLI उन users के लिए direct skill install और
update workflows भी support करता है जो full OpenClaw workspace के बाहर registry-managed skill folders चाहते हैं।

## Security state

ClawHub publishing के लिए खुला है, लेकिन releases फिर भी upload gates,
automated checks, user reports, और moderator action के अधीन होते हैं।

Public pages उपलब्ध होने पर scan summaries दिखाते हैं। जो content held, hidden,
या blocked है, वह diagnostics के लिए owner को visible रहते हुए public search और install flows से गायब हो सकता है।

देखें [Security](/hi/clawhub/security), [Security Audits](/clawhub/security-audits),
[Moderation and Account Safety](/clawhub/moderation), और
[Acceptable usage](/hi/clawhub/acceptable-usage)।

## API access

ClawHub discovery, search, package details, और
downloads के लिए public read APIs expose करता है। Third-party catalogs इन APIs का उपयोग कर सकते हैं, जब वे
canonical ClawHub listing पर back link करें, rate limits का सम्मान करें, और endorsement का संकेत देने से बचें।

देखें [Public API](/clawhub/api) और [HTTP API](/hi/clawhub/http-api)।
