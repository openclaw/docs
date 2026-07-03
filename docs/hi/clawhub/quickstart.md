---
read_when:
    - पहली बार ClawHub का उपयोग कर रहे हैं
    - रजिस्ट्री से कोई skill या plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugin खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें.'
x-i18n:
    generated_at: "2026-07-03T02:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# क्विकस्टार्ट

ClawHub, OpenClaw Skills और Plugins के लिए एक रजिस्ट्री है।

जब आप OpenClaw में चीज़ें इंस्टॉल कर रहे हों, तो OpenClaw का उपयोग करें। जब आप साइन इन कर रहे हों, प्रकाशित कर रहे हों, अपनी लिस्टिंग प्रबंधित कर रहे हों, या रजिस्ट्री-विशिष्ट वर्कफ़्लो का उपयोग कर रहे हों, तो `clawhub` CLI का उपयोग करें।

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

OpenClaw यह रिकॉर्ड करता है कि Skill कहाँ से आया था, ताकि बाद के अपडेट ClawHub के माध्यम से समाधान जारी रख सकें।

## Plugin खोजें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw plugins search "calendar"
```

स्पष्ट ClawHub स्रोत के साथ ClawHub पर होस्ट किया गया Plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package>
```

इंस्टॉल किए गए Plugins अपडेट करें:

```bash
openclaw plugins update --all
```

जब आप चाहते हैं कि OpenClaw पैकेज को npm या किसी अन्य स्रोत के बजाय ClawHub के माध्यम से हल करे, तो `clawhub:` प्रीफ़िक्स का उपयोग करें।

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

हेडलेस वातावरण ClawHub वेब UI से API टोकन का उपयोग कर सकते हैं:

```bash
clawhub login --token clh_...
```

## Skill प्रकाशित करें

Skill एक फ़ोल्डर होता है जिसमें आवश्यक `SKILL.md` फ़ाइल और वैकल्पिक सहायक फ़ाइलें होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

यह कमांड अपरिवर्तित सामग्री को छोड़ देता है। नए Skills `1.0.0` से शुरू होते हैं; बाद के बदलाव अपने आप अगला पैच संस्करण प्रकाशित करते हैं। पूर्वावलोकन के लिए `--dry-run` या स्पष्ट संस्करण चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले, `SKILL.md` में मेटाडेटा जांचें। आवश्यक वातावरण वैरिएबल, टूल और अनुमतियां घोषित करें, ताकि उपयोगकर्ता इंस्टॉल करने से पहले समझ सकें कि Skill को क्या चाहिए। [Skill प्रारूप](/hi/clawhub/skill-format) देखें।

कई Skills वाले रिपॉज़िटरी के लिए, पुन: प्रयोज्य GitHub वर्कफ़्लो `skills/` के अंतर्गत प्रत्येक तुरंत उपलब्ध Skill फ़ोल्डर के लिए `skill publish` कॉल करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Plugin प्रकाशित करें

स्थानीय फ़ोल्डर, GitHub repo, GitHub ref, या मौजूदा आर्काइव से Plugin प्रकाशित करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

प्रकाशित किए बिना हल किए गए पैकेज मेटाडेटा, संगतता फ़ील्ड, स्रोत श्रेय, और अपलोड योजना का पूर्वावलोकन करने के लिए पहले `--dry-run` का उपयोग करें।

Code Plugins में `package.json` में OpenClaw संगतता मेटाडेटा शामिल होना चाहिए, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले, मेटाडेटा, स्रोत लिंक, संस्करण, चेंजलॉग और स्कैन स्थिति का निरीक्षण करने के लिए ClawHub वेब पेज या CLI विवरण कमांड का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

सार्वजनिक लिस्टिंग नवीनतम स्कैन स्थिति दिखाती हैं। मॉडरेशन द्वारा रोकी या ब्लॉक की गई रिलीज़ खोज और इंस्टॉल सतहों से तब तक छिपी हो सकती हैं जब तक उनका समाधान न हो जाए।
