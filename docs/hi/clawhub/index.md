---
read_when:
    - ClawHub क्या है, यह समझाना
    - Skills या plugins को खोजना, इंस्टॉल करना या अपडेट करना
    - Skills या Plugin को रजिस्ट्री में प्रकाशित करना
    - openclaw और clawhub CLI फ़्लो के बीच चयन करना
sidebarTitle: ClawHub
summary: डिस्कवरी, इंस्टॉल, प्रकाशित करने, सुरक्षा और clawhub CLI के लिए सार्वजनिक ClawHub अवलोकन।
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T15:17:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub OpenClaw Skills और Plugins के लिए सार्वजनिक रजिस्ट्री है.

- Skills खोजने, इंस्टॉल करने और अपडेट करने के लिए, और ClawHub से Plugins इंस्टॉल करने के लिए नेटिव `openclaw` कमांड का उपयोग करें.
- रजिस्ट्री auth, प्रकाशन, और delete/undelete workflows के लिए अलग `clawhub` CLI का उपयोग करें.

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

जब आपको publish या delete/undelete जैसे रजिस्ट्री-authenticated workflows चाहिए हों, तब ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub क्या होस्ट करता है

| Surface        | यह क्या संग्रहीत करता है                                      | सामान्य कमांड                                |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` और सहायक फ़ाइलों वाले versioned text bundles       | `openclaw skills install @openclaw/demo`     |
| Code plugins   | compatibility metadata वाले OpenClaw Plugin packages          | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | OpenClaw वितरण के लिए packaged Plugin bundles                 | `clawhub package publish <source>`           |

ClawHub semver versions, `latest` जैसे tags, changelogs, files, downloads, stars, और security scan summaries ट्रैक करता है. सार्वजनिक पेज वर्तमान रजिस्ट्री स्थिति दिखाते हैं, ताकि उपयोगकर्ता किसी Skill या Plugin को इंस्टॉल करने से पहले उसका निरीक्षण कर सकें.

## नेटिव OpenClaw flows

नेटिव OpenClaw कमांड सक्रिय OpenClaw workspace में इंस्टॉल करते हैं और source metadata को persist करते हैं, ताकि बाद के update commands ClawHub पर बने रह सकें.

जब किसी Plugin install को ClawHub के माध्यम से resolve करना हो, तब `clawhub:<package>` का उपयोग करें. Bare npm-safe Plugin specs launch cutovers के दौरान npm के माध्यम से resolve हो सकते हैं, और जब source स्पष्ट होना आवश्यक हो, तब `npm:<package>` npm-only रहता है.

Plugin installs archive install चलने से पहले advertised `pluginApi` और `minGatewayVersion` compatibility को validate करते हैं. जब कोई package version ClawPack artifact publish करता है, OpenClaw सटीक uploaded npm-pack `.tgz` को प्राथमिकता देता है, ClawHub digest header और downloaded bytes को verify करता है, और बाद के updates के लिए artifact metadata रिकॉर्ड करता है.

## ClawHub CLI

ClawHub CLI registry-authenticated work के लिए है:

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

ये commands वर्तमान working directory के अंतर्गत `./skills` में Skills इंस्टॉल करते हैं और installed versions को `.clawhub/lock.json` में रिकॉर्ड करते हैं.

## प्रकाशन

`SKILL.md` वाले local folder से Skills publish करें:

```bash
clawhub skill publish <path>
```

सामान्य publish options:

- `--slug <slug>`: प्रकाशित Skill URL नाम.
- `--name <name>`: display name.
- `--version <version>`: semver version.
- `--changelog <text>`: changelog text.
- `--tags <tags>`: comma-separated tags, default `latest`.

Local folder, `owner/repo`, `owner/repo@ref`, या GitHub URL से Plugins publish करें:

```bash
clawhub package publish <source>
```

बिना upload किए सटीक publish plan बनाने के लिए `--dry-run` का उपयोग करें, और CI-friendly output के लिए `--json`.

Code Plugins में `package.json` में आवश्यक OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं. पूर्ण command reference के लिए [CLI](/hi/clawhub/cli) और Skill metadata के लिए [Skill format](/clawhub/skill-format) देखें.

## सुरक्षा और moderation

ClawHub डिफ़ॉल्ट रूप से खुला है: कोई भी upload कर सकता है, लेकिन publishing के लिए ऐसा GitHub account आवश्यक है जो upload gate पास करने के लिए पर्याप्त पुराना हो. सार्वजनिक detail pages install या download से पहले latest scan state का सारांश देते हैं.

ClawHub published Skills और Plugin releases पर automated checks चलाता है. Scan-held या blocked releases सार्वजनिक catalog और install surfaces से गायब हो सकते हैं, जबकि वे अपने owner को `/dashboard` में दिखाई देते रहते हैं.

Signed-in users Skills और packages की report कर सकते हैं. Moderators reports की review कर सकते हैं, content को hide या restore कर सकते हैं, और abusive accounts को ban कर सकते हैं. Policy और enforcement details के लिए [Security](/hi/clawhub/security), [Security Audits](/clawhub/security-audits), [Moderation and Account Safety](/clawhub/moderation), और [Acceptable usage](/hi/clawhub/acceptable-usage) देखें.

## Telemetry और environment

जब आप logged in रहते हुए `clawhub install` चलाते हैं, तो CLI best-effort install event भेज सकता है, ताकि ClawHub aggregate install counts compute कर सके. इसे बंद करने के लिए:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

उपयोगी environment overrides:

| Variable                      | Effect                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser login के लिए उपयोग किए जाने वाले site URL को override करें. |
| `CLAWHUB_REGISTRY`            | registry API URL को override करें.               |
| `CLAWHUB_CONFIG_PATH`         | CLI token/config state कहाँ store करता है, उसे override करें. |
| `CLAWHUB_WORKDIR`             | default working directory को override करें.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | install telemetry बंद करें.                       |

अधिक गहरे reference material के लिए [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), और [Troubleshooting](/hi/clawhub/troubleshooting) देखें.
