---
read_when:
    - ClawHub क्या है, इसकी व्याख्या
    - Skills या Plugin खोजना, इंस्टॉल करना या अपडेट करना
    - रजिस्ट्री में Skills या plugins प्रकाशित करना
    - openclaw और clawhub CLI प्रवाहों के बीच चयन करना
sidebarTitle: ClawHub
summary: खोज, स्थापना, प्रकाशन, सुरक्षा, और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T18:12:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills और Plugins के लिए सार्वजनिक registry है।

- Skills खोजने, install करने और update करने के लिए, और ClawHub से Plugins install करने के लिए native `openclaw` commands का उपयोग करें।
- registry auth, publishing, और delete/undelete workflows के लिए अलग `clawhub` CLI का उपयोग करें।

साइट: [clawhub.ai](https://clawhub.ai)

## त्वरित शुरुआत

OpenClaw के साथ Skills खोजें और install करें:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw के साथ Plugins खोजें और install करें:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

जब आपको publish या delete/undelete जैसे registry-authenticated workflows चाहिए हों,
तो ClawHub CLI install करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या host करता है

| सतह           | यह क्या store करता है                                      | सामान्य command                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक files के साथ versioned text bundles | `openclaw skills install @openclaw/demo`     |
| Code Plugins   | compatibility metadata के साथ OpenClaw Plugin packages       | `openclaw plugins install clawhub:<package>` |
| Bundle Plugins | OpenClaw वितरण के लिए packaged Plugin bundles                | `clawhub package publish <source>`           |

ClawHub semver versions, `latest` जैसे tags, changelogs, files,
downloads, stars, और security scan summaries track करता है। Public pages मौजूदा registry
state दिखाते हैं ताकि users किसी Skill या Plugin को install करने से पहले inspect कर सकें।

## Native OpenClaw flows

Native OpenClaw commands active OpenClaw workspace में install करते हैं और
source metadata persist करते हैं ताकि बाद के update commands ClawHub पर बने रह सकें।

जब Plugin install को ClawHub के माध्यम से resolve करना हो, तब `clawhub:<package>` उपयोग करें।
Bare npm-safe Plugin specs launch cutovers के दौरान npm के माध्यम से resolve हो सकते हैं, और
जब source explicit होना चाहिए, तब `npm:<package>` npm-only रहता है।

Plugin installs archive install चलने से पहले advertised `pluginApi` और `minGatewayVersion`
compatibility validate करते हैं। जब कोई package version ClawPack artifact publish करता है,
तो OpenClaw exact uploaded npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header
और downloaded bytes verify करता है, और बाद के updates के लिए artifact metadata record करता है।

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

CLI में direct registry workflows के लिए Skill install/update commands भी हैं:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

ये commands current working directory के अंतर्गत `./skills` में Skills install करते हैं
और installed versions को `.clawhub/lock.json` में record करते हैं।

## Publishing

`SKILL.md` वाली local folder से Skills publish करें:

```bash
clawhub skill publish <path>
```

सामान्य publish options:

- `--slug <slug>`: published Skill URL name.
- `--name <name>`: display name.
- `--version <version>`: semver version.
- `--changelog <text>`: changelog text.
- `--tags <tags>`: comma-separated tags, default `latest`.

Local folder, `owner/repo`, `owner/repo@ref`, या GitHub
URL से Plugins publish करें:

```bash
clawhub package publish <source>
```

Upload किए बिना exact publish plan build करने के लिए `--dry-run` उपयोग करें, और
CI-friendly output के लिए `--json`।

Code Plugins में `package.json` में आवश्यक OpenClaw compatibility metadata शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और
`openclaw.build.openclawVersion` शामिल हैं। पूरी command
reference के लिए [CLI](/hi/clawhub/cli) और Skill metadata के लिए [Skill format](/clawhub/skill-format) देखें।

## सुरक्षा और moderation

ClawHub default रूप से open है: कोई भी upload कर सकता है, लेकिन publishing के लिए ऐसा GitHub
account चाहिए जो upload gate pass करने के लिए पर्याप्त पुराना हो। Public detail pages install या download से पहले
latest scan state summarize करते हैं।

ClawHub published Skills और Plugin releases पर automated checks चलाता है। Scan-held
या blocked releases public catalog और install surfaces से गायब हो सकते हैं, जबकि
`/dashboard` में अपने owner को visible रहते हैं।

Signed-in users Skills और packages report कर सकते हैं। Moderators reports review कर सकते हैं,
content hide या restore कर सकते हैं, और abusive accounts ban कर सकते हैं। Policy और enforcement details के लिए
[Security](/hi/clawhub/security),
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

| Variable                      | प्रभाव                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए उपयोग होने वाला site URL override करें। |
| `CLAWHUB_REGISTRY`            | registry API URL override करें।                    |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहाँ store करता है, इसे override करें। |
| `CLAWHUB_WORKDIR`             | default working directory override करें।           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry disable करें।                    |

अधिक गहरे reference material के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और
[Troubleshooting](/hi/clawhub/troubleshooting) देखें।
