---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या Plugin खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या plugins प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन
sidebarTitle: ClawHub
summary: डिस्कवरी, इंस्टॉल, प्रकाशन, सुरक्षा और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-06-30T13:59:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub OpenClaw skills और plugins के लिए सार्वजनिक रजिस्ट्री है।

- skills खोजने, इंस्टॉल करने और अपडेट करने तथा ClawHub से plugins इंस्टॉल करने के लिए मूल `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन, और हटाने/पुनर्स्थापित करने वाले workflows के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ skills खोजें और इंस्टॉल करें:

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

जब आपको publish या delete/undelete जैसे रजिस्ट्री-प्रमाणित workflows चाहिए हों, तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह | यह क्या संग्रहित करता है | सामान्य कमांड |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | `SKILL.md` और सहायक फ़ाइलों के साथ संस्करणित टेक्स्ट बंडल | `openclaw skills install @openclaw/demo` |
| कोड plugins | संगतता metadata के साथ OpenClaw plugin पैकेज | `openclaw plugins install clawhub:<package>` |
| बंडल plugins | OpenClaw वितरण के लिए पैकेज किए गए plugin बंडल | `clawhub package publish <source>` |

ClawHub semver संस्करणों, `latest` जैसे टैग, changelogs, फ़ाइलों, downloads, stars, और सुरक्षा स्कैन सारांशों को ट्रैक करता है। सार्वजनिक पृष्ठ वर्तमान रजिस्ट्री स्थिति दिखाते हैं ताकि उपयोगकर्ता किसी skill या plugin को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें।

## मूल OpenClaw flows

मूल OpenClaw कमांड सक्रिय OpenClaw workspace में इंस्टॉल करते हैं और स्रोत metadata बनाए रखते हैं ताकि बाद के update कमांड ClawHub पर बने रह सकें।

जब किसी plugin इंस्टॉल को ClawHub के माध्यम से resolve होना चाहिए, तब `clawhub:<package>` का उपयोग करें। सीधे npm-सुरक्षित plugin specs launch cutovers के दौरान npm के माध्यम से resolve हो सकते हैं, और जब स्रोत स्पष्ट होना चाहिए तब `npm:<package>` केवल npm तक सीमित रहता है।

Plugin इंस्टॉल archive install चलने से पहले घोषित `pluginApi` और `minGatewayVersion` संगतता को validate करते हैं। जब कोई पैकेज संस्करण ClawPack artifact प्रकाशित करता है, तो OpenClaw सटीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header और डाउनलोड किए गए bytes को verify करता है, और बाद के updates के लिए artifact metadata रिकॉर्ड करता है।

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

CLI में सीधे रजिस्ट्री workflows के लिए skill install/update कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

ये कमांड वर्तमान कार्यशील directory के अंतर्गत `./skills` में skills इंस्टॉल करते हैं और इंस्टॉल किए गए संस्करणों को `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय folder से skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य publish विकल्प:

- `--slug <slug>`: प्रकाशित skill URL नाम।
- `--name <name>`: display name।
- `--version <version>`: semver version।
- `--changelog <text>`: changelog text।
- `--tags <tags>`: comma-separated tags, defaulting to `latest`।

स्थानीय folder, `owner/repo`, `owner/repo@ref`, या GitHub URL से plugins प्रकाशित करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना सटीक publish plan बनाने के लिए `--dry-run` का उपयोग करें, और CI-अनुकूल output के लिए `--json` का उपयोग करें।

Code plugins को `package.json` में आवश्यक OpenClaw compatibility metadata शामिल करना होगा, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं। पूर्ण command reference के लिए [CLI](/hi/clawhub/cli) और skill metadata के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और moderation

ClawHub default रूप से खुला है: कोई भी upload कर सकता है, लेकिन publishing के लिए इतना पुराना GitHub account चाहिए जो upload gate पास कर सके। सार्वजनिक detail pages install या download से पहले latest scan state का सारांश देते हैं।

ClawHub प्रकाशित skills और plugin releases पर automated checks चलाता है। Scan-held या blocked releases public catalog और install surfaces से गायब हो सकते हैं, जबकि वे `/dashboard` में अपने owner को दिखाई देते रहते हैं।

Signed-in users skills और packages की report कर सकते हैं। Moderators reports की review कर सकते हैं, content को hide या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं। Policy और enforcement details के लिए [Security](/hi/clawhub/security), [Security Audits](/clawhub/security-audits), [Moderation and Account Safety](/clawhub/moderation), और [Acceptable usage](/clawhub/acceptable-usage) देखें।

## Telemetry और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort install event भेज सकता है ताकि ClawHub aggregate install counts compute कर सके। इसे इससे disable करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable | Effect |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | Browser login के लिए उपयोग किए गए site URL को override करें। |
| `CLAWHUB_REGISTRY` | Registry API URL को override करें। |
| `CLAWHUB_CONFIG_PATH` | CLI token/config state कहाँ store करता है, इसे override करें। |
| `CLAWHUB_WORKDIR` | Default working directory को override करें। |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Install telemetry को disable करें। |

अधिक गहन reference material के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और [Troubleshooting](/hi/clawhub/troubleshooting) देखें।
