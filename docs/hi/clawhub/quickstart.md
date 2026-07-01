---
read_when:
    - ClawHub का पहली बार उपयोग
    - रजिस्ट्री से कोई skill या plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugins ढूंढें, इंस्टॉल करें, अपडेट करें, और प्रकाशित करें।'
x-i18n:
    generated_at: "2026-07-01T15:24:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# क्विकस्टार्ट

ClawHub OpenClaw Skills और plugins के लिए एक registry है।

जब आप OpenClaw में चीजें इंस्टॉल कर रहे हों, तब OpenClaw का उपयोग करें। जब आप साइन इन कर रहे हों, प्रकाशित कर रहे हों, अपनी listings प्रबंधित कर रहे हों, या registry-विशिष्ट workflows का उपयोग कर रहे हों, तब `clawhub` CLI का उपयोग करें।

## Skill खोजें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw skills search "calendar"
```

Skill इंस्टॉल करें:

```bash
openclaw skills install @openclaw/demo
```

इंस्टॉल किए गए Skills अपडेट करें:

```bash
openclaw skills update --all
```

OpenClaw यह रिकॉर्ड करता है कि skill कहां से आया था ताकि बाद के अपडेट ClawHub के माध्यम से resolve करना जारी रख सकें।

## Plugin खोजें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw plugins search "calendar"
```

स्पष्ट ClawHub स्रोत के साथ ClawHub-होस्टेड plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package>
```

इंस्टॉल किए गए plugins अपडेट करें:

```bash
openclaw plugins update --all
```

जब आप चाहते हैं कि OpenClaw package को npm या किसी अन्य स्रोत के बजाय ClawHub के माध्यम से resolve करे, तब `clawhub:` prefix का उपयोग करें।

## प्रकाशन के लिए साइन इन करें

ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub से साइन इन करें:

```bash
clawhub login
clawhub whoami
```

Headless environments ClawHub web UI से API token का उपयोग कर सकते हैं:

```bash
clawhub login --token clh_...
```

## Skill प्रकाशित करें

Skill एक folder है जिसमें आवश्यक `SKILL.md` file और वैकल्पिक सहायक files होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Command अपरिवर्तित content को छोड़ देता है। नए Skills `1.0.0` से शुरू होते हैं; बाद के बदलाव स्वचालित रूप से अगला patch version प्रकाशित करते हैं। preview के लिए `--dry-run` या स्पष्ट version चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले, `SKILL.md` में metadata जांचें। आवश्यक environment variables, tools, और permissions घोषित करें ताकि users इंस्टॉल करने से पहले समझ सकें कि skill को क्या चाहिए। [Skill format](/hi/clawhub/skill-format) देखें।

कई Skills वाली repositories के लिए, पुन: प्रयोज्य GitHub workflow `skills/` के तहत प्रत्येक तत्काल skill folder के लिए `skill publish` कॉल करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Plugin प्रकाशित करें

स्थानीय folder, GitHub repo, GitHub ref, या मौजूदा archive से plugin प्रकाशित करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

प्रकाशित किए बिना resolved package metadata, compatibility fields, source attribution, और upload plan का preview देखने के लिए पहले `--dry-run` का उपयोग करें।

Code plugins में `package.json` में OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले, metadata, source links, versions, changelogs, और scan status का निरीक्षण करने के लिए ClawHub web page या CLI detail commands का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Public listings नवीनतम scan state दिखाती हैं। Moderation द्वारा held या blocked releases खोज और install surfaces से तब तक छिपी हो सकती हैं जब तक वे resolved न हो जाएं।
