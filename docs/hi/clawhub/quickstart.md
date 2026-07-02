---
read_when:
    - ClawHub पहली बार उपयोग कर रहे हैं
    - रजिस्ट्री से कौशल या Plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugin खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें.'
x-i18n:
    generated_at: "2026-07-02T22:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# त्वरित शुरुआत

ClawHub OpenClaw Skills और plugins के लिए एक रजिस्ट्री है।

जब आप OpenClaw में चीज़ें इंस्टॉल कर रहे हों, तब OpenClaw का उपयोग करें। जब आप साइन इन कर रहे हों, प्रकाशित कर रहे हों, अपनी लिस्टिंग प्रबंधित कर रहे हों, या रजिस्ट्री-विशिष्ट वर्कफ़्लो का उपयोग कर रहे हों, तब `clawhub` CLI का उपयोग करें।

## कोई skill खोजें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw skills search "calendar"
```

कोई skill इंस्टॉल करें:

```bash
openclaw skills install @openclaw/demo
```

इंस्टॉल किए गए skills अपडेट करें:

```bash
openclaw skills update --all
```

OpenClaw यह रिकॉर्ड करता है कि skill कहाँ से आया था ताकि बाद के अपडेट ClawHub के माध्यम से resolve करना जारी रख सकें।

## कोई plugin खोजें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw plugins search "calendar"
```

एक स्पष्ट ClawHub स्रोत के साथ ClawHub-होस्टेड plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package>
```

इंस्टॉल किए गए plugins अपडेट करें:

```bash
openclaw plugins update --all
```

जब आप चाहते हैं कि OpenClaw पैकेज को npm या किसी अन्य स्रोत के बजाय ClawHub के माध्यम से resolve करे, तब `clawhub:` प्रीफ़िक्स का उपयोग करें।

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

हेडलेस वातावरण ClawHub वेब UI से API token का उपयोग कर सकते हैं:

```bash
clawhub login --token clh_...
```

## कोई skill प्रकाशित करें

skill एक फ़ोल्डर होता है जिसमें आवश्यक `SKILL.md` फ़ाइल और वैकल्पिक सहायक फ़ाइलें होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

कमांड अपरिवर्तित सामग्री को छोड़ देता है। नए skills `1.0.0` से शुरू होते हैं; बाद के परिवर्तन अगला patch version अपने-आप प्रकाशित करते हैं। पूर्वावलोकन के लिए `--dry-run` या स्पष्ट version चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले, `SKILL.md` में metadata जाँचें। आवश्यक environment variables, tools, और permissions घोषित करें ताकि उपयोगकर्ता इंस्टॉल करने से पहले समझ सकें कि skill को क्या चाहिए। [Skill format](/hi/clawhub/skill-format) देखें।

कई skills वाले repositories के लिए, पुन: उपयोग योग्य GitHub workflow `skills/` के तहत हर immediate skill folder के लिए `skill publish` कॉल करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## कोई plugin प्रकाशित करें

किसी local folder, GitHub repo, GitHub ref, या मौजूदा archive से plugin प्रकाशित करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

प्रकाशित किए बिना resolved package metadata, compatibility fields, source attribution, और upload plan का पूर्वावलोकन करने के लिए पहले `--dry-run` का उपयोग करें।

Code plugins में `package.json` में OpenClaw compatibility metadata शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले, metadata, source links, versions, changelogs, और scan status का निरीक्षण करने के लिए ClawHub वेब पेज या CLI detail commands का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

सार्वजनिक listings latest scan state दिखाती हैं। moderation द्वारा रोकी या blocked releases search और install surfaces से तब तक छिपी रह सकती हैं जब तक उनका समाधान न हो जाए।
