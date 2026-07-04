---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या Plugin खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या Plugin प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉल, प्रकाशित करने, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T03:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugins के लिए सार्वजनिक रजिस्ट्री है।

- ClawHub से Skills खोजने, इंस्टॉल करने और अपडेट करने तथा Plugins इंस्टॉल करने के लिए मूल `openclaw` कमांड इस्तेमाल करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन, और हटाने/हटाना वापस लेने वाले वर्कफ़्लो के लिए अलग `clawhub` CLI इस्तेमाल करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ Skills खोजें और इंस्टॉल करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw के साथ Plugins खोजें और इंस्टॉल करें:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

जब आप प्रकाशित करने या हटाने/हटाना वापस लेने जैसे रजिस्ट्री-प्रमाणित वर्कफ़्लो चाहते हों, तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फ़ाइलों वाले संस्करणित टेक्स्ट बंडल       | `openclaw skills install @openclaw/demo`     |
| कोड Plugins    | संगतता मेटाडेटा वाले OpenClaw Plugin पैकेज                   | `openclaw plugins install clawhub:<package>` |
| बंडल Plugins   | OpenClaw वितरण के लिए पैकेज किए गए Plugin बंडल                | `clawhub package publish <source>`           |

ClawHub semver संस्करणों, `latest` जैसे टैग, changelogs, फ़ाइलों, डाउनलोड, स्टार और सुरक्षा स्कैन सारांशों को ट्रैक करता है। सार्वजनिक पेज मौजूदा रजिस्ट्री स्थिति दिखाते हैं ताकि उपयोगकर्ता किसी Skill या Plugin को इंस्टॉल करने से पहले उसकी जांच कर सकें।

## मूल OpenClaw फ़्लो

मूल OpenClaw कमांड सक्रिय OpenClaw वर्कस्पेस में इंस्टॉल करते हैं और स्रोत मेटाडेटा सहेजते हैं, ताकि बाद के अपडेट कमांड ClawHub पर बने रह सकें।

जब किसी Plugin इंस्टॉल को ClawHub के माध्यम से हल करना हो, तो `clawhub:<package>` इस्तेमाल करें। लॉन्च कटओवर के दौरान bare npm-safe Plugin specs npm के माध्यम से हल हो सकते हैं, और जब स्रोत स्पष्ट होना ज़रूरी हो तब `npm:<package>` सिर्फ npm तक सीमित रहता है।

Plugin इंस्टॉल, archive install चलने से पहले विज्ञापित `pluginApi` और `minGatewayVersion` संगतता की पुष्टि करते हैं। जब कोई पैकेज संस्करण ClawPack artifact प्रकाशित करता है, तो OpenClaw सटीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header और डाउनलोड किए गए bytes की पुष्टि करता है, और बाद के अपडेट के लिए artifact metadata रिकॉर्ड करता है।

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

वे कमांड मौजूदा working directory के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं और इंस्टॉल किए गए संस्करणों को `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय फ़ोल्डर से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य publish विकल्प:

- `--slug <slug>`: प्रकाशित Skill URL नाम।
- `--name <name>`: प्रदर्शन नाम।
- `--version <version>`: semver संस्करण।
- `--changelog <text>`: changelog टेक्स्ट।
- `--tags <tags>`: comma-separated टैग, डिफ़ॉल्ट रूप से `latest`।

स्थानीय फ़ोल्डर, `owner/repo`, `owner/repo@ref`, या GitHub URL से Plugins प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना सटीक publish plan बनाने के लिए `--dry-run` इस्तेमाल करें, और CI-अनुकूल आउटपुट के लिए `--json`।

कोड Plugins में `package.json` में आवश्यक OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं। पूरे कमांड संदर्भ के लिए [CLI](/hi/clawhub/cli) और Skill metadata के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन प्रकाशित करने के लिए ऐसा GitHub खाता चाहिए जो upload gate पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक detail pages इंस्टॉल या डाउनलोड से पहले नवीनतम scan state का सारांश देते हैं।

ClawHub प्रकाशित Skills और Plugin releases पर automated checks चलाता है। Scan-held या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि `/dashboard` में अपने owner को दिखाई देते रहते हैं।

Signed-in उपयोगकर्ता Skills और packages की रिपोर्ट कर सकते हैं। Moderators रिपोर्ट की समीक्षा कर सकते हैं, content को hide या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं। Policy और enforcement विवरणों के लिए [Security](/hi/clawhub/security), [Security Audits](/clawhub/security-audits), [Moderation and Account Safety](/clawhub/moderation), और [Acceptable usage](/hi/clawhub/acceptable-usage) देखें।

## Telemetry और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort install event भेज सकता है ताकि ClawHub aggregate install counts की गणना कर सके। इसे इससे disable करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए इस्तेमाल की गई site URL को override करें। |
| `CLAWHUB_REGISTRY`            | registry API URL को override करें।               |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहाँ store करता है, उसे override करें। |
| `CLAWHUB_WORKDIR`             | default working directory को override करें।      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry disable करें।                  |

गहरे reference material के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और [Troubleshooting](/hi/clawhub/troubleshooting) देखें।
