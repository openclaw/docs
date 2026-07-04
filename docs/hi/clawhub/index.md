---
read_when:
    - ClawHub क्या है, इसकी व्याख्या
    - Skills या Plugins खोजना, इंस्टॉल करना, या अपडेट करना
    - रजिस्ट्री में Skills या plugins प्रकाशित करना
    - openclaw और clawhub CLI फ़्लो के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉल, प्रकाशन, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T10:39:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugin के लिए सार्वजनिक रजिस्ट्री है।

- ClawHub से Skills खोजने, इंस्टॉल करने और अपडेट करने तथा Plugin इंस्टॉल करने के लिए नेटिव `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन, और हटाने/हटाने को पूर्ववत करने वाले वर्कफ़्लो के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## तुरंत शुरुआत

OpenClaw से Skills खोजें और इंस्टॉल करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw से Plugin खोजें और इंस्टॉल करें:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

जब आपको publish या delete/undelete जैसे रजिस्ट्री-प्रमाणित वर्कफ़्लो चाहिए हों, तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                               |
| ------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Skills        | `SKILL.md` और सहायक फ़ाइलों वाले संस्करणित टेक्स्ट बंडल       | `openclaw skills install @openclaw/demo`    |
| Code plugins  | संगतता मेटाडेटा वाले OpenClaw Plugin पैकेज                   | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | OpenClaw वितरण के लिए पैकेज किए गए Plugin बंडल                | `clawhub package publish <source>`          |

ClawHub semver संस्करणों, `latest` जैसे टैग, चेंजलॉग, फ़ाइलों, डाउनलोड, स्टार, और सुरक्षा स्कैन सारांशों को ट्रैक करता है। सार्वजनिक पेज वर्तमान रजिस्ट्री स्थिति दिखाते हैं, ताकि उपयोगकर्ता किसी Skill या Plugin को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें।

## नेटिव OpenClaw फ़्लो

नेटिव OpenClaw कमांड सक्रिय OpenClaw कार्यक्षेत्र में इंस्टॉल करते हैं और स्रोत मेटाडेटा सुरक्षित रखते हैं, ताकि बाद के अपडेट कमांड ClawHub पर बने रह सकें।

जब किसी Plugin इंस्टॉल को ClawHub के माध्यम से हल करना हो, तब `clawhub:<package>` का उपयोग करें। लॉन्च कटओवर के दौरान नंगे npm-सुरक्षित Plugin स्पेक npm के माध्यम से हल हो सकते हैं, और जब स्रोत को स्पष्ट रखना ज़रूरी हो तो `npm:<package>` केवल npm तक सीमित रहता है।

Plugin इंस्टॉल, आर्काइव इंस्टॉल चलने से पहले विज्ञापित `pluginApi` और `minGatewayVersion` संगतता की पुष्टि करते हैं। जब कोई पैकेज संस्करण ClawPack आर्टिफ़ैक्ट प्रकाशित करता है, तो OpenClaw सटीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub डाइजेस्ट हेडर और डाउनलोड किए गए बाइट्स की पुष्टि करता है, और बाद के अपडेट के लिए आर्टिफ़ैक्ट मेटाडेटा रिकॉर्ड करता है।

## ClawHub CLI

ClawHub CLI रजिस्ट्री-प्रमाणित कार्य के लिए है:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI में सीधे रजिस्ट्री वर्कफ़्लो के लिए Skill इंस्टॉल/अपडेट कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

ये कमांड वर्तमान कार्यशील डायरेक्टरी के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं और इंस्टॉल किए गए संस्करणों को `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाले स्थानीय फ़ोल्डर से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य प्रकाशन विकल्प:

- `--slug <slug>`: प्रकाशित Skill URL नाम।
- `--name <name>`: प्रदर्शित नाम।
- `--version <version>`: semver संस्करण।
- `--changelog <text>`: चेंजलॉग टेक्स्ट।
- `--tags <tags>`: कॉमा से अलग किए गए टैग, डिफ़ॉल्ट रूप से `latest`।

स्थानीय फ़ोल्डर, `owner/repo`, `owner/repo@ref`, या GitHub URL से Plugin प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना सटीक प्रकाशन योजना बनाने के लिए `--dry-run` का उपयोग करें, और CI-अनुकूल आउटपुट के लिए `--json` का उपयोग करें।

Code plugins में `package.json` में आवश्यक OpenClaw संगतता मेटाडेटा शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं। पूरे कमांड संदर्भ के लिए [CLI](/hi/clawhub/cli) और Skill मेटाडेटा के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन प्रकाशित करने के लिए ऐसा GitHub खाता आवश्यक है जो अपलोड गेट पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक विवरण पेज इंस्टॉल या डाउनलोड से पहले नवीनतम स्कैन स्थिति का सारांश दिखाते हैं।

ClawHub प्रकाशित Skills और Plugin रिलीज़ पर स्वचालित जांच चलाता है। स्कैन द्वारा रोकी गई या ब्लॉक की गई रिलीज़ सार्वजनिक कैटलॉग और इंस्टॉल सतहों से गायब हो सकती हैं, जबकि वे अपने स्वामी को `/dashboard` में दिखाई देती रहती हैं।

साइन-इन किए हुए उपयोगकर्ता Skills और पैकेज की रिपोर्ट कर सकते हैं। मॉडरेटर रिपोर्ट की समीक्षा कर सकते हैं, सामग्री छिपा या पुनर्स्थापित कर सकते हैं, और दुरुपयोग करने वाले खातों को प्रतिबंधित कर सकते हैं। नीति और प्रवर्तन विवरण के लिए [Security](/hi/clawhub/security), [Security Audits](/clawhub/security-audits), [Moderation and Account Safety](/clawhub/moderation), और [Acceptable usage](/hi/clawhub/acceptable-usage) देखें।

## टेलीमेट्री और परिवेश

जब आप लॉग इन रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort इंस्टॉल इवेंट भेज सकता है, ताकि ClawHub कुल इंस्टॉल गणना निकाल सके। इसे इस तरह बंद करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी परिवेश ओवरराइड:

| वैरिएबल                      | प्रभाव                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ब्राउज़र लॉगिन के लिए उपयोग किए गए साइट URL को ओवरराइड करें। |
| `CLAWHUB_REGISTRY`            | रजिस्ट्री API URL को ओवरराइड करें।               |
| `CLAWHUB_CONFIG_PATH`         | CLI जहाँ token/config स्थिति संग्रहीत करता है, उसे ओवरराइड करें। |
| `CLAWHUB_WORKDIR`             | डिफ़ॉल्ट कार्यशील डायरेक्टरी को ओवरराइड करें।     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | इंस्टॉल टेलीमेट्री बंद करें।                      |

अधिक गहन संदर्भ सामग्री के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और [Troubleshooting](/hi/clawhub/troubleshooting) देखें।
