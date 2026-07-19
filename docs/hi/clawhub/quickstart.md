---
read_when:
    - ClawHub का पहली बार उपयोग करना
    - रजिस्ट्री से कोई skill या plugin इंस्टॉल करना
    - ClawHub पर प्रकाशित करना
summary: 'ClawHub का उपयोग शुरू करें: Skills या Plugins खोजें, इंस्टॉल करें, अपडेट करें और प्रकाशित करें।'
x-i18n:
    generated_at: "2026-07-19T08:14:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# त्वरित आरंभ

ClawHub, OpenClaw Skills और Plugins की एक रजिस्ट्री है।

OpenClaw में चीज़ें इंस्टॉल करते समय OpenClaw का उपयोग करें। साइन इन करने, प्रकाशित करने, अपनी लिस्टिंग प्रबंधित करने या रजिस्ट्री-विशिष्ट कार्यप्रवाहों का उपयोग करने के लिए `clawhub` CLI का उपयोग करें।

## कोई Skill खोजें और इंस्टॉल करें

OpenClaw से खोजें:

```bash
openclaw skills search "calendar"
```

कोई Skill इंस्टॉल करें:

```bash
openclaw skills install @openclaw/demo
```

इंस्टॉल किए गए Skills अपडेट करें:

```bash
openclaw skills update --all
```

OpenClaw यह रिकॉर्ड करता है कि Skill कहाँ से आया था, ताकि बाद के अपडेट ClawHub के माध्यम से उसका समाधान जारी रख सकें।

## कोई Plugin खोजें और इंस्टॉल करें

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

जब आप चाहते हैं कि OpenClaw पैकेज का समाधान npm या किसी अन्य स्रोत के बजाय ClawHub के माध्यम से करे, तो `clawhub:` उपसर्ग का उपयोग करें।

## प्रकाशित करने के लिए साइन इन करें

ClawHub CLI इंस्टॉल करें:

```bash
npm i -g clawhub
# या
pnpm add -g clawhub
```

GitHub से साइन इन करें:

```bash
clawhub login
clawhub whoami
```

हेडलेस परिवेश ClawHub वेब UI से प्राप्त API टोकन का उपयोग कर सकते हैं:

```bash
clawhub login --token clh_...
```

## कोई Skill प्रकाशित करें

Skill एक फ़ोल्डर होता है, जिसमें आवश्यक `SKILL.md` फ़ाइल और वैकल्पिक सहायक फ़ाइलें होती हैं।

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

यह कमांड अपरिवर्तित सामग्री को छोड़ देता है। नए Skills `1.0.0` से शुरू होते हैं; बाद के परिवर्तन अगला पैच संस्करण स्वचालित रूप से प्रकाशित करते हैं। पूर्वावलोकन के लिए `--dry-run` या स्पष्ट संस्करण चुनने के लिए `--version` का उपयोग करें।

प्रकाशित करने से पहले `SKILL.md` में मेटाडेटा जाँचें। आवश्यक परिवेश चर, टूल और अनुमतियाँ घोषित करें, ताकि उपयोगकर्ता Skill इंस्टॉल करने से पहले समझ सकें कि उसे किन चीज़ों की आवश्यकता है। [Skill प्रारूप](/clawhub/skill-format) देखें।

एकाधिक Skills वाली रिपॉज़िटरी के लिए, पुनः उपयोग योग्य GitHub कार्यप्रवाह `skills/` के अंतर्गत प्रत्येक सीधे स्थित Skill फ़ोल्डर के लिए `skill publish` को कॉल करता है:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## कोई Plugin प्रकाशित करें

किसी स्थानीय फ़ोल्डर, GitHub रिपॉज़िटरी, GitHub रेफ़ या मौजूदा आर्काइव से Plugin प्रकाशित करें:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

प्रकाशित किए बिना समाधान किए गए पैकेज मेटाडेटा, संगतता फ़ील्ड, स्रोत श्रेय और अपलोड योजना का पूर्वावलोकन करने के लिए पहले `--dry-run` का उपयोग करें।

कोड Plugins के `package.json` में OpenClaw संगतता मेटाडेटा होना आवश्यक है, जिसमें `openclaw.compat.pluginApi` और `openclaw.build.openclawVersion` शामिल हैं।

## इंस्टॉल करने से पहले निरीक्षण करें

इंस्टॉल करने से पहले मेटाडेटा, स्रोत लिंक, संस्करण, परिवर्तन-सूचियों और स्कैन की स्थिति का निरीक्षण करने के लिए ClawHub वेब पेज या CLI विवरण कमांड का उपयोग करें:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

सार्वजनिक लिस्टिंग नवीनतम स्कैन स्थिति दिखाती हैं। मॉडरेशन द्वारा रोकी या अवरुद्ध की गई रिलीज़ समाधान होने तक खोज और इंस्टॉल इंटरफ़ेस से छिपाई जा सकती हैं।
