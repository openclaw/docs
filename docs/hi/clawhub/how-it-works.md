---
read_when:
    - लिस्टिंग, संस्करण, इंस्टॉल, प्रकाशन और मॉडरेशन को समझना
summary: ClawHub सूचियाँ, संस्करण, इंस्टॉल, प्रकाशन, स्कैन और अपडेट कैसे काम करते हैं।
x-i18n:
    generated_at: "2026-07-03T23:31:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub कैसे काम करता है

ClawHub, OpenClaw Skills और Plugins के लिए रजिस्ट्री लेयर है। यह उपयोगकर्ताओं को
पैकेज खोजने की जगह देता है, प्रकाशकों को संस्करण रिलीज़ करने की जगह देता है, और
OpenClaw को उन पैकेजों को सुरक्षित रूप से इंस्टॉल और अपडेट करने के लिए पर्याप्त मेटाडेटा देता है।

## रजिस्ट्री रिकॉर्ड

हर सार्वजनिक लिस्टिंग इन चीज़ों के साथ एक रजिस्ट्री रिकॉर्ड होती है:

- एक owner और slug या package name
- एक या अधिक प्रकाशित संस्करण
- मेटाडेटा, सारांश, फ़ाइलें, और स्रोत एट्रिब्यूशन
- changelog और tag जानकारी, जैसे `latest`
- डाउनलोड, इंस्टॉल, और star संकेत
- सुरक्षा स्कैन और मॉडरेशन स्थिति

लिस्टिंग पेज उपयोगकर्ताओं के लिए यह जांचने की आधिकारिक जगह है कि कोई skill या
plugin इंस्टॉल करने से पहले क्या करने का दावा करता है।

## Skills

एक skill, `SKILL.md` पर केंद्रित versioned टेक्स्ट बंडल है। इसमें
सहायक फ़ाइलें, उदाहरण, टेम्पलेट, और स्क्रिप्ट शामिल हो सकते हैं।

ClawHub skill नाम, विवरण, आवश्यकताओं, environment variables, और मेटाडेटा को
समझने के लिए `SKILL.md` frontmatter पढ़ता है। सटीक
मेटाडेटा महत्वपूर्ण है क्योंकि यह उपयोगकर्ताओं को यह तय करने में मदद करता है कि skill इंस्टॉल करनी है या नहीं, और
automated scans को घोषित और देखे गए व्यवहार के बीच mismatches पहचानने में मदद करता है।

देखें [Skill फ़ॉर्मैट](/hi/clawhub/skill-format)।

## Plugins

Plugins पैकेज किए गए OpenClaw extensions हैं। ClawHub पैकेज मेटाडेटा,
compatibility जानकारी, स्रोत लिंक, artifacts, और version records संग्रहीत करता है।

जब OpenClaw ClawHub से plugin इंस्टॉल करता है, तो वह इंस्टॉल करने से पहले विज्ञापित compatibility
metadata जांचता है। Package records में API compatibility,
minimum gateway version, host targets, environment requirements, और artifact
digests शामिल हो सकते हैं।

जब आप registry को source of truth बनाना चाहते हैं, तो explicit ClawHub install source का उपयोग करें:

```bash
openclaw plugins install clawhub:<package>
```

## प्रकाशन

प्रकाशन एक नया immutable version record बनाता है। प्रकाशक authenticated registry workflows के लिए `clawhub`
CLI का उपयोग करते हैं:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

अपलोड से पहले resolved payload का preview देखने के लिए dry runs का उपयोग करें। इसके बाद सार्वजनिक पेज
प्रकाशित मेटाडेटा, फ़ाइलें, source attribution, और scan status दिखाते हैं।

## इंस्टॉल और अपडेट

OpenClaw install commands ClawHub को package source के रूप में उपयोग करते हैं:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw install source metadata रिकॉर्ड करता है ताकि updates बाद में उसी
registry package को resolve कर सकें। ClawHub CLI उन उपयोगकर्ताओं के लिए direct skill install और
update workflows का भी समर्थन करता है जो पूर्ण OpenClaw workspace के बाहर registry-managed skill folders चाहते हैं।

## सुरक्षा स्थिति

ClawHub publishing के लिए खुला है, लेकिन releases फिर भी upload gates,
automated checks, user reports, और moderator action के अधीन हैं।

उपलब्ध होने पर सार्वजनिक पेज scan summaries दिखाते हैं। रोकी गई, छिपाई गई,
या blocked सामग्री सार्वजनिक search और install flows से गायब हो सकती है, जबकि diagnostics के लिए
owner को दिखाई देती रहती है।

देखें [Security](/clawhub/security), [Security Audits](/clawhub/security-audits),
[Moderation and Account Safety](/hi/clawhub/moderation), और
[Acceptable usage](/clawhub/acceptable-usage)।

## API access

ClawHub discovery, search, package details, और
downloads के लिए public read APIs expose करता है। Third-party catalogs इन APIs का उपयोग कर सकते हैं, जब वे
canonical ClawHub listing पर वापस link करें, rate limits का सम्मान करें, और endorsement का संकेत देने से बचें।

देखें [Public API](/hi/clawhub/api) और [HTTP API](/clawhub/http-api)।
