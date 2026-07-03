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
    generated_at: "2026-07-03T09:36:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugin के लिए सार्वजनिक रजिस्ट्री है।

- Skills खोजने, इंस्टॉल करने और अपडेट करने के लिए, और ClawHub से Plugin इंस्टॉल करने के लिए मूल `openclaw` कमांड का उपयोग करें।
- रजिस्ट्री auth, प्रकाशन, और delete/undelete workflows के लिए अलग `clawhub` CLI का उपयोग करें।

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

जब आपको publish या delete/undelete जैसे रजिस्ट्री-प्रमाणित workflows चाहिए हों,
तो ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| सतह           | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फाइलों वाले संस्करणित टेक्स्ट बंडल       | `openclaw skills install @openclaw/demo`     |
| Code plugins   | संगतता metadata वाले OpenClaw Plugin packages                | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | OpenClaw वितरण के लिए packaged Plugin bundles                 | `clawhub package publish <source>`           |

ClawHub semver संस्करणों, `latest` जैसे tags, changelogs, files,
downloads, stars, और security scan summaries को ट्रैक करता है। सार्वजनिक पेज मौजूदा रजिस्ट्री
स्थिति दिखाते हैं ताकि उपयोगकर्ता किसी Skill या Plugin को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें।

## मूल OpenClaw flows

मूल OpenClaw कमांड सक्रिय OpenClaw workspace में इंस्टॉल करते हैं और
source metadata को स्थायी रखते हैं ताकि बाद के update कमांड ClawHub पर बने रह सकें।

जब किसी Plugin इंस्टॉल को ClawHub के जरिए resolve करना हो, तो `clawhub:<package>` का उपयोग करें।
Bare npm-safe Plugin specs launch cutovers के दौरान npm के जरिए resolve हो सकते हैं, और
जब source स्पष्ट होना आवश्यक हो तब `npm:<package>` npm-only रहता है।

Plugin installs archive install चलने से पहले घोषित `pluginApi` और `minGatewayVersion`
संगतता को validate करते हैं। जब कोई package version
ClawPack artifact publish करता है, तो OpenClaw सटीक uploaded npm-pack `.tgz` को प्राथमिकता देता है, ClawHub
digest header और downloaded bytes को verify करता है, और बाद के
updates के लिए artifact metadata दर्ज करता है।

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

CLI में सीधे रजिस्ट्री workflows के लिए Skill install/update कमांड भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

वे कमांड मौजूदा working directory के तहत `./skills` में Skills इंस्टॉल करते हैं
और installed versions को `.clawhub/lock.json` में दर्ज करते हैं।

## प्रकाशन

`SKILL.md` वाली स्थानीय folder से Skills publish करें:

```bash
clawhub skill publish <path>
```

सामान्य publish विकल्प:

- `--slug <slug>`: published Skill URL name.
- `--name <name>`: display name.
- `--version <version>`: semver version.
- `--changelog <text>`: changelog text.
- `--tags <tags>`: comma-separated tags, defaulting to `latest`.

स्थानीय folder, `owner/repo`, `owner/repo@ref`, या GitHub
URL से Plugin publish करें:

```bash
clawhub package publish <source>
```

Upload किए बिना सटीक publish plan बनाने के लिए `--dry-run` का उपयोग करें, और CI-friendly output
के लिए `--json` का उपयोग करें।

Code plugins में `package.json` में आवश्यक OpenClaw compatibility metadata शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। पूर्ण कमांड
reference के लिए [CLI](/hi/clawhub/cli) और Skill metadata के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और moderation

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी upload कर सकता है, लेकिन publishing के लिए ऐसा GitHub
account आवश्यक है जो upload gate पास करने के लिए पर्याप्त पुराना हो। सार्वजनिक detail pages
install या download से पहले latest scan state का सारांश देते हैं।

ClawHub published Skills और Plugin releases पर automated checks चलाता है। Scan-held
या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि
वे `/dashboard` में अपने owner को दिखते रहते हैं।

Signed-in users Skills और packages की report कर सकते हैं। Moderators reports की review कर सकते हैं,
content छिपा या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं। Policy और enforcement details के लिए
[Security](/hi/clawhub/security),
[Security Audits](/clawhub/security-audits),
[Moderation and Account Safety](/clawhub/moderation), और
[Acceptable usage](/clawhub/acceptable-usage) देखें।

## Telemetry और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort
install event भेज सकता है ताकि ClawHub aggregate install counts निकाल सके। इसे इस तरह disable करें:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए उपयोग किया गया site URL override करें। |
| `CLAWHUB_REGISTRY`            | registry API URL override करें।                  |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state जहां store करता है, उसे override करें। |
| `CLAWHUB_WORKDIR`             | default working directory override करें।          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry disable करें।                  |

गहरी reference material के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और
[Troubleshooting](/hi/clawhub/troubleshooting) देखें।
