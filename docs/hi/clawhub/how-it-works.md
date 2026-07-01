---
read_when:
    - लिस्टिंग, संस्करण, इंस्टॉल, प्रकाशन और मॉडरेशन को समझना
summary: ClawHub लिस्टिंग, संस्करण, इंस्टॉल, प्रकाशन, स्कैन और अपडेट कैसे काम करते हैं।
x-i18n:
    generated_at: "2026-07-01T08:02:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub कैसे काम करता है

ClawHub OpenClaw Skills और Plugins के लिए registry layer है। यह उपयोगकर्ताओं को पैकेज खोजने की जगह देता है, प्रकाशकों को संस्करण जारी करने की जगह देता है, और OpenClaw को उन पैकेजों को सुरक्षित रूप से इंस्टॉल और अपडेट करने के लिए पर्याप्त metadata देता है।

## registry records

हर सार्वजनिक सूची एक registry record होती है जिसमें शामिल हैं:

- एक owner और slug या package name
- एक या अधिक प्रकाशित संस्करण
- metadata, summary, files, और source attribution
- changelog और tag जानकारी जैसे `latest`
- download, install, और star संकेत
- security scan और moderation स्थिति

listing page उपयोगकर्ताओं के लिए किसी skill या plugin को इंस्टॉल करने से पहले यह जांचने की canonical जगह है कि वह क्या करने का दावा करता है।

## Skills

Skill `SKILL.md` पर केंद्रित एक versioned text bundle है। इसमें supporting files, examples, templates, और scripts शामिल हो सकते हैं।

ClawHub skill name, description, requirements, environment variables, और metadata समझने के लिए `SKILL.md` frontmatter पढ़ता है। सटीक metadata महत्वपूर्ण है क्योंकि यह उपयोगकर्ताओं को यह तय करने में मदद करता है कि skill इंस्टॉल करनी है या नहीं, और automated scans को घोषित और देखे गए व्यवहार के बीच mismatches पहचानने में मदद करता है।

देखें [Skill format](/hi/clawhub/skill-format).

## Plugins

Plugins पैकेज किए गए OpenClaw extensions हैं। ClawHub package metadata, compatibility information, source links, artifacts, और version records संग्रहीत करता है।

जब OpenClaw ClawHub से plugin इंस्टॉल करता है, तो यह इंस्टॉल करने से पहले घोषित compatibility metadata जांचता है। Package records में API compatibility, minimum gateway version, host targets, environment requirements, और artifact digests शामिल हो सकते हैं।

जब आप चाहते हैं कि registry source of truth हो, तो explicit ClawHub install source का उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

## Publishing

Publishing एक नया immutable version record बनाता है। प्रकाशक authenticated registry workflows के लिए `clawhub` CLI का उपयोग करते हैं:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

upload से पहले resolved payload का preview देखने के लिए dry runs का उपयोग करें। फिर public pages प्रकाशित metadata, files, source attribution, और scan status दिखाते हैं।

## Installs and updates

OpenClaw install commands ClawHub को package source के रूप में उपयोग करते हैं:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw install source metadata रिकॉर्ड करता है ताकि updates बाद में उसी registry package को resolve कर सकें। ClawHub CLI उन उपयोगकर्ताओं के लिए direct skill install और update workflows भी support करता है जो full OpenClaw workspace के बाहर registry-managed skill folders चाहते हैं।

## Security state

ClawHub publishing के लिए खुला है, लेकिन releases अभी भी upload gates, automated checks, user reports, और moderator action के अधीन हैं।

Public pages उपलब्ध होने पर scan summaries दिखाते हैं। रोकी गई, hidden, या blocked content public search और install flows से गायब हो सकती है, जबकि diagnostics के लिए owner को visible बनी रहती है।

देखें [Security](/clawhub/security), [Security Audits](/clawhub/security-audits), [Moderation and Account Safety](/hi/clawhub/moderation), और [Acceptable usage](/clawhub/acceptable-usage).

## API access

ClawHub discovery, search, package details, और downloads के लिए public read APIs उपलब्ध कराता है। Third-party catalogs इन APIs का उपयोग कर सकते हैं जब वे canonical ClawHub listing से वापस link करते हैं, rate limits का सम्मान करते हैं, और endorsement का संकेत देने से बचते हैं।

देखें [Public API](/hi/clawhub/api) और [HTTP API](/clawhub/http-api).
