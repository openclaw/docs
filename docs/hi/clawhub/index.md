---
read_when:
    - ClawHub क्या है, इसकी व्याख्या
    - Skills या Plugin खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या plugins प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, स्थापना, प्रकाशन, सुरक्षा और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T23:32:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub OpenClaw Skills और plugins के लिए सार्वजनिक रजिस्ट्री है।

- Skills खोजने, इंस्टॉल करने और अपडेट करने तथा ClawHub से plugins इंस्टॉल करने के लिए मूल `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन, और delete/undelete वर्कफ़्लो के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ Skills खोजें और इंस्टॉल करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw के साथ plugins खोजें और इंस्टॉल करें:

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
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फ़ाइलों वाले संस्करणित टेक्स्ट बंडल      | `openclaw skills install @openclaw/demo`     |
| कोड plugins    | संगतता मेटाडेटा वाले OpenClaw plugin पैकेज                   | `openclaw plugins install clawhub:<package>` |
| बंडल plugins   | OpenClaw वितरण के लिए पैकेज किए गए plugin बंडल                | `clawhub package publish <source>`           |

ClawHub semver संस्करणों, `latest` जैसे टैग, changelogs, फ़ाइलों, डाउनलोड,
स्टार, और सुरक्षा स्कैन सारांशों को ट्रैक करता है। सार्वजनिक पेज वर्तमान रजिस्ट्री
स्थिति दिखाते हैं ताकि उपयोगकर्ता किसी Skill या plugin को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें।

## मूल OpenClaw प्रवाह

मूल OpenClaw कमांड सक्रिय OpenClaw वर्कस्पेस में इंस्टॉल करते हैं और स्रोत
मेटाडेटा सहेजते हैं ताकि बाद के अपडेट कमांड ClawHub पर बने रह सकें।

जब किसी plugin इंस्टॉल को ClawHub के माध्यम से रिज़ॉल्व करना हो, तो `clawhub:<package>` का उपयोग करें।
लॉन्च कटओवर के दौरान bare npm-safe plugin specs npm के माध्यम से रिज़ॉल्व हो सकते हैं, और
जब स्रोत को स्पष्ट होना ज़रूरी हो, तो `npm:<package>` केवल npm तक सीमित रहता है।

Plugin इंस्टॉल, आर्काइव इंस्टॉल चलने से पहले घोषित `pluginApi` और `minGatewayVersion`
संगतता की पुष्टि करते हैं। जब कोई पैकेज संस्करण ClawPack आर्टिफैक्ट प्रकाशित करता है,
OpenClaw सटीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header
और डाउनलोड किए गए bytes की पुष्टि करता है, और बाद के अपडेट के लिए आर्टिफैक्ट मेटाडेटा रिकॉर्ड करता है।

## ClawHub CLI

ClawHub CLI रजिस्ट्री-प्रमाणित काम के लिए है:

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

CLI में सीधे रजिस्ट्री वर्कफ़्लो के लिए Skill install/update कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

ये कमांड मौजूदा working directory के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं
और इंस्टॉल किए गए संस्करणों को `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय फ़ोल्डर से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य प्रकाशन विकल्प:

- `--slug <slug>`: प्रकाशित Skill URL नाम।
- `--name <name>`: प्रदर्शन नाम।
- `--version <version>`: semver संस्करण।
- `--changelog <text>`: changelog टेक्स्ट।
- `--tags <tags>`: comma-separated टैग, डिफ़ॉल्ट रूप से `latest`।

स्थानीय फ़ोल्डर, `owner/repo`, `owner/repo@ref`, या GitHub URL से plugins प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना सटीक publish योजना बनाने के लिए `--dry-run` का उपयोग करें, और CI-अनुकूल आउटपुट
के लिए `--json` का उपयोग करें।

कोड plugins में `package.json` में आवश्यक OpenClaw संगतता मेटाडेटा शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।
पूर्ण कमांड संदर्भ के लिए [CLI](/hi/clawhub/cli) और Skill मेटाडेटा के लिए
[Skill प्रारूप](/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन प्रकाशन के लिए ऐसा GitHub
खाता चाहिए जो upload gate पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक विवरण पेज इंस्टॉल
या डाउनलोड से पहले नवीनतम स्कैन स्थिति का सारांश देते हैं।

ClawHub प्रकाशित Skills और plugin releases पर स्वचालित जाँचें चलाता है। Scan-held
या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि
`/dashboard` में अपने स्वामी को दिखाई देते रहते हैं।

साइन-इन किए हुए उपयोगकर्ता Skills और packages की रिपोर्ट कर सकते हैं। Moderators रिपोर्ट की समीक्षा कर सकते हैं,
सामग्री को छिपा या बहाल कर सकते हैं, और अपमानजनक खातों को ban कर सकते हैं। नीति और enforcement विवरणों के लिए
[सुरक्षा](/hi/clawhub/security),
[सुरक्षा ऑडिट](/clawhub/security-audits),
[मॉडरेशन और खाता सुरक्षा](/clawhub/moderation), और
[स्वीकार्य उपयोग](/hi/clawhub/acceptable-usage) देखें।

## टेलीमेट्री और वातावरण

जब आप लॉग इन रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort
install event भेज सकता है ताकि ClawHub aggregate install counts की गणना कर सके। इसे इससे अक्षम करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए उपयोग किए गए site URL को override करें। |
| `CLAWHUB_REGISTRY`            | registry API URL को override करें।               |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहाँ संग्रहीत करता है, इसे override करें। |
| `CLAWHUB_WORKDIR`             | default working directory को override करें।       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry को अक्षम करें।                 |

अधिक गहरी संदर्भ सामग्री के लिए [टेलीमेट्री](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और
[समस्या निवारण](/hi/clawhub/troubleshooting) देखें।
