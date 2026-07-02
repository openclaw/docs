---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या Plugin को खोजना, इंस्टॉल करना या अपडेट करना
    - Skills या Plugins को रजिस्ट्री में प्रकाशित करना
    - openclaw और ClawHub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, इंस्टॉल, प्रकाशन, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T08:16:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub OpenClaw Skills और Plugins के लिए सार्वजनिक रजिस्ट्री है।

- ClawHub से Skills खोजने, इंस्टॉल करने और अपडेट करने तथा Plugins इंस्टॉल करने के लिए मूल `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री प्रमाणीकरण, प्रकाशन, और delete/undelete workflows के लिए अलग `clawhub` CLI का उपयोग करें।

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

जब आपको publish या delete/undelete जैसे रजिस्ट्री-प्रमाणित workflows चाहिए हों,
तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                               |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फ़ाइलों के साथ versioned text bundles    | `openclaw skills install @openclaw/demo`     |
| कोड Plugins    | compatibility metadata वाले OpenClaw plugin packages          | `openclaw plugins install clawhub:<package>` |
| बंडल Plugins   | OpenClaw वितरण के लिए packaged plugin bundles                 | `clawhub package publish <source>`           |

ClawHub semver versions, `latest` जैसे tags, changelogs, files,
downloads, stars, और security scan summaries को ट्रैक करता है। सार्वजनिक पृष्ठ वर्तमान रजिस्ट्री
स्थिति दिखाते हैं ताकि उपयोगकर्ता किसी Skill या Plugin को इंस्टॉल करने से पहले उसकी जांच कर सकें।

## मूल OpenClaw flows

मूल OpenClaw कमांड सक्रिय OpenClaw workspace में इंस्टॉल करते हैं और
source metadata सहेजते हैं ताकि बाद के update commands ClawHub पर बने रह सकें।

जब किसी Plugin install को ClawHub के ज़रिए resolve करना हो, तो `clawhub:<package>` का उपयोग करें।
Launch cutovers के दौरान bare npm-safe plugin specs npm के ज़रिए resolve हो सकते हैं, और
जब source स्पष्ट होना चाहिए तो `npm:<package>` केवल npm तक सीमित रहता है।

Archive install चलने से पहले Plugin installs advertised `pluginApi` और `minGatewayVersion`
compatibility को validate करते हैं। जब कोई package version
ClawPack artifact प्रकाशित करता है, तो OpenClaw exact uploaded npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header और downloaded bytes को verify करता है, और बाद के updates के लिए artifact metadata रिकॉर्ड करता है।

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

CLI में direct registry workflows के लिए Skill install/update commands भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

ये commands वर्तमान working directory के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं
और installed versions को `.clawhub/lock.json` में रिकॉर्ड करते हैं।

## प्रकाशन

`SKILL.md` वाली local folder से Skills प्रकाशित करें:

```bash
clawhub skill publish <path>
```

सामान्य publish options:

- `--slug <slug>`: published Skill URL name.
- `--name <name>`: display name.
- `--version <version>`: semver version.
- `--changelog <text>`: changelog text.
- `--tags <tags>`: comma-separated tags, defaulting to `latest`.

Local folder, `owner/repo`, `owner/repo@ref`, या GitHub
URL से Plugins प्रकाशित करें:

```bash
clawhub package publish <source>
```

Upload किए बिना exact publish plan बनाने के लिए `--dry-run` का उपयोग करें, और CI-friendly output के लिए `--json`
का उपयोग करें।

Code Plugins में `package.json` में आवश्यक OpenClaw compatibility metadata शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। पूरी command reference के लिए [CLI](/hi/clawhub/cli) और Skill metadata के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और मॉडरेशन

ClawHub default रूप से खुला है: कोई भी upload कर सकता है, लेकिन publish करने के लिए ऐसा GitHub
account चाहिए जो upload gate पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक detail pages install या download से पहले
latest scan state का सारांश देते हैं।

ClawHub प्रकाशित Skills और Plugin releases पर automated checks चलाता है। Scan-held
या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि
वे `/dashboard` में अपने owner को दिखाई देते रहते हैं।

Signed-in users Skills और packages की रिपोर्ट कर सकते हैं। Moderators reports की समीक्षा कर सकते हैं,
content को hide या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं। Policy और enforcement details के लिए
[Security](/hi/clawhub/security),
[Security Audits](/clawhub/security-audits),
[Moderation and Account Safety](/clawhub/moderation), और
[Acceptable usage](/hi/clawhub/acceptable-usage) देखें।

## Telemetry और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort
install event भेज सकता है ताकि ClawHub aggregate install counts निकाल सके। इसे इस तरह disable करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Browser login के लिए उपयोग किए गए site URL को override करें। |
| `CLAWHUB_REGISTRY`            | Registry API URL को override करें।               |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहां store करता है, इसे override करें। |
| `CLAWHUB_WORKDIR`             | Default working directory को override करें।       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Install telemetry disable करें।                   |

अधिक गहन reference material के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और
[Troubleshooting](/hi/clawhub/troubleshooting) देखें।
