---
read_when:
    - ClawHub का पहली बार उपयोग کرنا
    - रजिस्ट्री से स्किल या Plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugin खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें।'
x-i18n:
    generated_at: "2026-07-04T15:18:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# त्वरित प्रारंभ

ClawHub OpenClaw Skills और plugins के लिए एक रजिस्ट्री है।

जब आप OpenClaw में चीजें इंस्टॉल कर रहे हों, तो OpenClaw का उपयोग करें। जब आप साइन इन कर रहे हों, प्रकाशित कर रहे हों, अपनी खुद की लिस्टिंग प्रबंधित कर रहे हों, या रजिस्ट्री-विशिष्ट वर्कफ़्लो का उपयोग कर रहे हों, तो `clawhub` CLI का उपयोग करें।

## कोई skill ढूंढें और इंस्टॉल करें

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

OpenClaw यह दर्ज करता है कि skill कहां से आई थी, ताकि बाद के अपडेट ClawHub के माध्यम से resolve करना जारी रख सकें।

## कोई plugin ढूंढें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw plugins search "calendar"
```

स्पष्ट ClawHub स्रोत के साथ ClawHub-hosted plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package>
```

इंस्टॉल किए गए plugins अपडेट करें:

```bash
openclaw plugins update --all
```

जब आप चाहते हैं कि OpenClaw पैकेज को npm या किसी अन्य स्रोत के बजाय ClawHub के माध्यम से resolve करे, तो `clawhub:` प्रीफ़िक्स का उपयोग करें।

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

Headless वातावरण ClawHub वेब UI से API token का उपयोग कर सकते हैं:

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

कमांड अपरिवर्तित सामग्री को छोड़ देता है। नए skills `1.0.0` से शुरू होते हैं; बाद के परिवर्तन स्वचालित रूप से अगला patch संस्करण प्रकाशित करते हैं। preview करने के लिए `--dry-run` या स्पष्ट संस्करण चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले, `SKILL.md` में metadata जांचें। आवश्यक environment variables, tools, और permissions घोषित करें ताकि उपयोगकर्ता इंस्टॉल करने से पहले समझ सकें कि skill को क्या चाहिए। [Skill format](/hi/clawhub/skill-format) देखें।

कई skills वाली repositories के लिए, पुन: प्रयोज्य GitHub workflow `skills/` के अंतर्गत प्रत्येक immediate skill folder के लिए `skill publish` कॉल करता है:

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

प्रकाशित किए बिना resolved package metadata, compatibility fields, source attribution, और upload plan का preview करने के लिए पहले `--dry-run` का उपयोग करें।

Code plugins में `package.json` में OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले, metadata, source links, versions, changelogs, और scan status का निरीक्षण करने के लिए ClawHub web page या CLI detail commands का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Public listings नवीनतम scan state दिखाती हैं। moderation द्वारा रोके गए या अवरुद्ध releases खोज और इंस्टॉल surfaces से तब तक छिपे रह सकते हैं जब तक उनका समाधान न हो जाए।
