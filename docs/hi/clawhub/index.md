---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या Plugins को खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या plugins प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉल, प्रकाशन, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T22:44:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugin के लिए सार्वजनिक रजिस्ट्री है।

- Skills खोजने, इंस्टॉल करने और अपडेट करने तथा ClawHub से Plugin इंस्टॉल करने के लिए मूल `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन, और delete/undelete वर्कफ़्लो के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ Skills खोजें और इंस्टॉल करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw के साथ Plugin खोजें और इंस्टॉल करें:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

जब आपको publish या delete/undelete जैसे रजिस्ट्री-प्रमाणित वर्कफ़्लो चाहिए हों,
तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                                |
| ------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills        | `SKILL.md` और सहायक फ़ाइलों के साथ संस्करणित टेक्स्ट बंडल    | `openclaw skills install @openclaw/demo`     |
| कोड Plugin    | संगतता मेटाडेटा के साथ OpenClaw Plugin पैकेज                 | `openclaw plugins install clawhub:<package>` |
| बंडल Plugin   | OpenClaw वितरण के लिए पैकेज किए गए Plugin बंडल                | `clawhub package publish <source>`           |

ClawHub semver संस्करण, `latest` जैसे टैग, changelog, फ़ाइलें,
डाउनलोड, स्टार, और सुरक्षा स्कैन सारांश ट्रैक करता है। सार्वजनिक पेज वर्तमान रजिस्ट्री
स्थिति दिखाते हैं ताकि उपयोगकर्ता इंस्टॉल करने से पहले किसी Skill या Plugin की जाँच कर सकें।

## मूल OpenClaw फ़्लो

मूल OpenClaw कमांड सक्रिय OpenClaw workspace में इंस्टॉल करते हैं और स्रोत
मेटाडेटा कायम रखते हैं ताकि बाद के अपडेट कमांड ClawHub पर बने रह सकें।

जब किसी Plugin इंस्टॉल को ClawHub के माध्यम से हल होना चाहिए, तब `clawhub:<package>` का उपयोग करें।
साधारण npm-सुरक्षित Plugin specs लॉन्च कटओवर के दौरान npm के माध्यम से हल हो सकते हैं, और
जब स्रोत स्पष्ट होना आवश्यक हो तब `npm:<package>` केवल npm तक सीमित रहता है।

Plugin इंस्टॉल archive install चलने से पहले घोषित `pluginApi` और `minGatewayVersion`
संगतता की पुष्टि करते हैं। जब कोई पैकेज संस्करण ClawPack artifact प्रकाशित करता है,
OpenClaw ठीक उसी अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header
और डाउनलोड किए गए bytes की पुष्टि करता है, और बाद के अपडेट के लिए artifact मेटाडेटा रिकॉर्ड करता है।

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

ये कमांड वर्तमान कार्यशील डायरेक्टरी के तहत `./skills` में Skills इंस्टॉल करते हैं
और इंस्टॉल किए गए संस्करण `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय फ़ोल्डर से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य publish विकल्प:

- `--slug <slug>`: प्रकाशित Skill URL नाम।
- `--name <name>`: प्रदर्शित नाम।
- `--version <version>`: semver संस्करण।
- `--changelog <text>`: changelog टेक्स्ट।
- `--tags <tags>`: अल्पविराम से अलग किए गए टैग, डिफ़ॉल्ट रूप से `latest`।

Plugin को स्थानीय फ़ोल्डर, `owner/repo`, `owner/repo@ref`, या GitHub
URL से प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना सटीक publish योजना बनाने के लिए `--dry-run` का उपयोग करें, और CI-अनुकूल
आउटपुट के लिए `--json` का उपयोग करें।

कोड Plugin में `package.json` में आवश्यक OpenClaw संगतता मेटाडेटा शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। पूर्ण कमांड संदर्भ के लिए [CLI](/hi/clawhub/cli)
और Skill मेटाडेटा के लिए [Skill format](/hi/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन प्रकाशन के लिए ऐसा GitHub
खाता चाहिए जो upload gate पास करने जितना पुराना हो। सार्वजनिक detail pages इंस्टॉल या डाउनलोड से पहले
नवीनतम scan state का सारांश देते हैं।

ClawHub प्रकाशित Skills और Plugin releases पर स्वचालित checks चलाता है। Scan-held
या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि
`/dashboard` में अपने owner को दिखाई देते रहते हैं।

साइन-इन किए हुए उपयोगकर्ता Skills और packages की रिपोर्ट कर सकते हैं। मॉडरेटर reports की समीक्षा कर सकते हैं,
content छिपा या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं। Policy और enforcement विवरण के लिए
[Security](/hi/clawhub/security),
[Security Audits](/hi/clawhub/security-audits),
[Moderation and Account Safety](/hi/clawhub/moderation), और
[Acceptable usage](/hi/clawhub/acceptable-usage) देखें।

## Telemetry और environment

जब आप लॉग इन रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort
install event भेज सकता है ताकि ClawHub aggregate install counts की गणना कर सके। इसे इससे अक्षम करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| वेरिएबल                      | प्रभाव                                            |
| ---------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`               | browser login के लिए उपयोग किए गए site URL को override करें। |
| `CLAWHUB_REGISTRY`           | registry API URL को override करें।              |
| `CLAWHUB_CONFIG_PATH`        | CLI token/config state कहाँ संग्रहीत करता है, इसे override करें। |
| `CLAWHUB_WORKDIR`            | default working directory को override करें।      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry अक्षम करें।                   |

अधिक गहन संदर्भ सामग्री के लिए [Telemetry](/hi/clawhub/telemetry), [HTTP API](/hi/clawhub/http-api), और
[Troubleshooting](/hi/clawhub/troubleshooting) देखें।
