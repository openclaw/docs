---
read_when:
    - ClawHub पहली बार उपयोग कर रहे हैं
    - रजिस्ट्री से skill या plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugin खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें।'
x-i18n:
    generated_at: "2026-07-05T05:05:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# क्विकस्टार्ट

ClawHub OpenClaw Skills और plugins के लिए एक रजिस्ट्री है।

जब आप OpenClaw में चीज़ें इंस्टॉल कर रहे हों, तो OpenClaw का उपयोग करें। जब आप साइन इन कर रहे हों, प्रकाशित कर रहे हों, अपनी listings प्रबंधित कर रहे हों, या रजिस्ट्री-विशिष्ट workflows का उपयोग कर रहे हों, तो `clawhub` CLI का उपयोग करें।

## कोई skill ढूँढें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw skills search "calendar"
```

कोई skill इंस्टॉल करें:

```bash
openclaw skills install @openclaw/demo
```

इंस्टॉल की गई skills अपडेट करें:

```bash
openclaw skills update --all
```

OpenClaw रिकॉर्ड करता है कि skill कहाँ से आई थी, ताकि बाद के अपडेट ClawHub के माध्यम से resolve करना जारी रख सकें।

## कोई plugin ढूँढें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw plugins search "calendar"
```

एक स्पष्ट ClawHub स्रोत के साथ ClawHub-होस्ट किया गया plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package>
```

इंस्टॉल किए गए plugins अपडेट करें:

```bash
openclaw plugins update --all
```

जब आप चाहते हैं कि OpenClaw package को npm या किसी अन्य स्रोत के बजाय ClawHub के माध्यम से resolve करे, तो `clawhub:` prefix का उपयोग करें।

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

## कोई skill प्रकाशित करें

skill एक फ़ोल्डर है जिसमें आवश्यक `SKILL.md` फ़ाइल और वैकल्पिक सहायक फ़ाइलें होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

कमांड अपरिवर्तित content को छोड़ देता है। नई skills `1.0.0` से शुरू होती हैं; बाद के बदलाव स्वतः अगला patch version प्रकाशित करते हैं। पूर्वावलोकन के लिए `--dry-run` या कोई स्पष्ट version चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले, `SKILL.md` में metadata जाँचें। आवश्यक environment variables, tools, और permissions घोषित करें ताकि users समझ सकें कि skill को इंस्टॉल करने से पहले क्या चाहिए। [Skill format](/hi/clawhub/skill-format) देखें।

कई skills वाले repositories के लिए, पुन: उपयोग योग्य GitHub workflow `skills/` के तहत प्रत्येक तत्काल skill folder के लिए `skill publish` कॉल करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## कोई plugin प्रकाशित करें

local folder, GitHub repo, GitHub ref, या मौजूदा archive से plugin प्रकाशित करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

प्रकाशित किए बिना resolved package metadata, compatibility fields, source attribution, और upload plan का पूर्वावलोकन करने के लिए पहले `--dry-run` का उपयोग करें।

Code plugins में `package.json` में OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले, metadata, source links, versions, changelogs, और scan status का निरीक्षण करने के लिए ClawHub web page या CLI detail commands का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Public listings नवीनतम scan state दिखाती हैं। moderation द्वारा रोकी या अवरुद्ध की गई releases search और install surfaces से छिपाई जा सकती हैं जब तक उनका समाधान नहीं हो जाता।
