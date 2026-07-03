---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या plugins खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या Plugin प्रकाशित करना
    - openclaw और clawhub CLI फ़्लो के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉल, प्रकाशित करने, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T17:21:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugin के लिए सार्वजनिक रजिस्ट्री है।

- Skills खोजने, इंस्टॉल करने और अपडेट करने के लिए, और ClawHub से Plugin इंस्टॉल करने के लिए मूल `openclaw` कमांड इस्तेमाल करें।
- रजिस्ट्री auth, publishing, और delete/undelete वर्कफ़्लो के लिए अलग `clawhub` CLI इस्तेमाल करें।

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

जब आपको publish या delete/undelete जैसे registry-authenticated वर्कफ़्लो चाहिए हों,
तो ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                               |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फ़ाइलों के साथ वर्शन किए गए टेक्स्ट बंडल | `openclaw skills install @openclaw/demo`     |
| कोड Plugin     | compatibility metadata के साथ OpenClaw Plugin पैकेज          | `openclaw plugins install clawhub:<package>` |
| बंडल Plugin    | OpenClaw वितरण के लिए पैकेज किए गए Plugin बंडल                | `clawhub package publish <source>`           |

ClawHub semver वर्शन, `latest` जैसे टैग, changelog, फ़ाइलें,
डाउनलोड, स्टार और सुरक्षा स्कैन सारांश ट्रैक करता है। सार्वजनिक पेज वर्तमान रजिस्ट्री
स्थिति दिखाते हैं ताकि उपयोगकर्ता इंस्टॉल करने से पहले किसी skill या Plugin का निरीक्षण कर सकें।

## मूल OpenClaw फ़्लो

मूल OpenClaw कमांड सक्रिय OpenClaw workspace में इंस्टॉल करते हैं और
source metadata बनाए रखते हैं ताकि बाद के update कमांड ClawHub पर बने रह सकें।

जब किसी Plugin install को ClawHub के ज़रिए resolve करना हो, तो `clawhub:<package>` इस्तेमाल करें।
Bare npm-safe Plugin specs launch cutovers के दौरान npm के ज़रिए resolve हो सकते हैं, और
जब किसी source को स्पष्ट होना चाहिए, तो `npm:<package>` केवल npm ही रहता है।

Plugin installs archive install चलने से पहले विज्ञापित `pluginApi` और `minGatewayVersion`
compatibility सत्यापित करते हैं। जब कोई package version ClawPack artifact प्रकाशित करता है,
तो OpenClaw सटीक अपलोड किए गए npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header
और डाउनलोड किए गए bytes सत्यापित करता है, और बाद के updates के लिए artifact metadata दर्ज करता है।

## ClawHub CLI

ClawHub CLI registry-authenticated काम के लिए है:

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

CLI में सीधे रजिस्ट्री वर्कफ़्लो के लिए skill install/update कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

वे कमांड वर्तमान working directory के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं
और इंस्टॉल किए गए versions को `.clawhub/lock.json` में दर्ज करते हैं।

## Publishing

`SKILL.md` वाली स्थानीय फ़ोल्डर से Skills publish करें:

```bash
clawhub skill publish <path>
```

सामान्य publish विकल्प:

- `--slug <slug>`: प्रकाशित skill URL नाम।
- `--name <name>`: प्रदर्शन नाम।
- `--version <version>`: semver version।
- `--changelog <text>`: changelog text।
- `--tags <tags>`: comma-separated tags, defaulting to `latest`।

स्थानीय फ़ोल्डर, `owner/repo`, `owner/repo@ref`, या GitHub
URL से Plugin publish करें:

```bash
clawhub package publish <source>
```

अपलोड किए बिना सटीक publish plan बनाने के लिए `--dry-run` इस्तेमाल करें, और CI-friendly
output के लिए `--json`।

कोड Plugin में `package.json` में आवश्यक OpenClaw compatibility metadata शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। पूर्ण command reference के लिए [CLI](/hi/clawhub/cli)
और skill metadata के लिए [Skill format](/hi/clawhub/skill-format) देखें।

## सुरक्षा और moderation

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी अपलोड कर सकता है, लेकिन publishing के लिए ऐसा GitHub
account चाहिए जो upload gate पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक detail pages install
या download से पहले latest scan state का सारांश देते हैं।

ClawHub प्रकाशित Skills और Plugin releases पर automated checks चलाता है। Scan-held
या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि
वे अपने owner को `/dashboard` में दिखाई देते रहते हैं।

Signed-in users Skills और packages की report कर सकते हैं। Moderators reports review कर सकते हैं,
content hide या restore कर सकते हैं, और abusive accounts ban कर सकते हैं। Policy और enforcement details के लिए
[Security](/clawhub/security),
[Security Audits](/clawhub/security-audits),
[Moderation and Account Safety](/clawhub/moderation), और
[Acceptable usage](/hi/clawhub/acceptable-usage) देखें।

## Telemetry और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort
install event भेज सकता है ताकि ClawHub aggregate install counts compute कर सके। इसे इससे disable करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | Effect                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए इस्तेमाल किया गया site URL override करें। |
| `CLAWHUB_REGISTRY`            | registry API URL override करें।                  |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहाँ store करता है, उसे override करें। |
| `CLAWHUB_WORKDIR`             | default working directory override करें।          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry disable करें।                  |

अधिक गहन reference material के लिए [Telemetry](/hi/clawhub/telemetry), [HTTP API](/hi/clawhub/http-api), और
[Troubleshooting](/clawhub/troubleshooting) देखें।
