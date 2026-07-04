---
read_when:
    - ClawHub का पहली बार उपयोग
    - रजिस्ट्री से Skill या Plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या plugins खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें।'
x-i18n:
    generated_at: "2026-07-04T03:48:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# त्वरित शुरुआत

ClawHub OpenClaw Skills और plugins की रजिस्ट्री है।

जब आप OpenClaw में चीज़ें इंस्टॉल कर रहे हों, तो OpenClaw का उपयोग करें। जब आप साइन इन कर रहे हों, प्रकाशित कर रहे हों, अपनी खुद की लिस्टिंग प्रबंधित कर रहे हों, या रजिस्ट्री-विशिष्ट workflows का उपयोग कर रहे हों, तो `clawhub` CLI का उपयोग करें।

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

OpenClaw रिकॉर्ड करता है कि skill कहां से आया था, ताकि बाद के अपडेट ClawHub के माध्यम से resolve करना जारी रख सकें।

## कोई plugin खोजें और इंस्टॉल करें

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

हेडलेस परिवेश ClawHub वेब UI से API टोकन का उपयोग कर सकते हैं:

```bash
clawhub login --token clh_...
```

## Skill प्रकाशित करें

Skill एक फ़ोल्डर होता है जिसमें आवश्यक `SKILL.md` फ़ाइल और वैकल्पिक सहायक
फ़ाइलें होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

कमांड अपरिवर्तित सामग्री को छोड़ देता है। नए Skills `1.0.0` से शुरू होते हैं; बाद के बदलाव
स्वचालित रूप से अगला पैच संस्करण प्रकाशित करते हैं। पूर्वावलोकन के लिए `--dry-run` या
स्पष्ट संस्करण चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले, `SKILL.md` में मेटाडेटा जांचें। आवश्यक
पर्यावरण चर, टूल और अनुमतियां घोषित करें ताकि उपयोगकर्ता समझ सकें कि
Skill को इंस्टॉल करने से पहले उसे क्या चाहिए। [Skill प्रारूप](/hi/clawhub/skill-format) देखें।

कई Skills वाले रिपॉजिटरी के लिए, पुन: प्रयोज्य GitHub वर्कफ़्लो
`skills/` के अंतर्गत प्रत्येक तत्काल Skill फ़ोल्डर के लिए `skill publish` कॉल करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Plugin प्रकाशित करें

स्थानीय फ़ोल्डर, GitHub repo, GitHub ref, या मौजूदा archive से Plugin प्रकाशित करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

प्रकाशित किए बिना हल किए गए package metadata, compatibility
fields, source attribution, और upload plan का पूर्वावलोकन करने के लिए पहले `--dry-run` का उपयोग करें।

Code plugins में `package.json` में OpenClaw compatibility metadata शामिल होना चाहिए,
जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले, metadata, source links, versions, changelogs, और scan status का निरीक्षण करने के लिए
ClawHub वेब पेज या CLI detail commands का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

सार्वजनिक सूचियां नवीनतम scan state दिखाती हैं। जिन releases को moderation द्वारा रोका या blocked किया गया है,
वे समाधान होने तक search और install surfaces से छिपे रह सकते हैं।
