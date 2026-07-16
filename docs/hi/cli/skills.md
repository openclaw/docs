---
read_when:
    - आप देखना चाहते हैं कि कौन-से Skills उपलब्ध हैं और चलाने के लिए तैयार हैं
    - आप ClawHub में खोज करना चाहते हैं या ClawHub, Git अथवा स्थानीय डायरेक्टरियों से Skills इंस्टॉल करना चाहते हैं
    - आप ClawHub के साथ किसी ClawHub Skill को सत्यापित करना चाहते हैं
    - आप Skills के लिए अनुपलब्ध बाइनरी/env/config को डीबग करना चाहते हैं
summary: '`openclaw skills` के लिए CLI संदर्भ (खोजें/इंस्टॉल करें/अपडेट करें/सत्यापित करें/सूची देखें/जानकारी देखें/जाँचें/कार्यशाला)'
title: Skills
x-i18n:
    generated_at: "2026-07-16T14:05:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

स्थानीय Skills का निरीक्षण करें, ClawHub में खोजें, ClawHub/Git/स्थानीय
डायरेक्टरी से Skills इंस्टॉल करें, ClawHub Skills सत्यापित करें और ClawHub द्वारा ट्रैक किए गए इंस्टॉलेशन अपडेट करें।

संबंधित:

- Skills प्रणाली: [Skills](/hi/tools/skills)
- Skill कार्यशाला: [Skill कार्यशाला](/hi/tools/skill-workshop)
- Skills कॉन्फ़िगरेशन: [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config)
- ClawHub इंस्टॉलेशन: [ClawHub](/hi/clawhub/cli)

## कमांड

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` और `verify` सीधे ClawHub का उपयोग करते हैं। `install @owner/<slug>`
एक ClawHub Skill इंस्टॉल करता है, `install git:owner/repo[@ref]` एक Git Skill क्लोन करता है
और `install ./path` एक स्थानीय Skill डायरेक्टरी कॉपी करता है। डिफ़ॉल्ट रूप से, `install`,
`update` और `verify` सक्रिय वर्कस्पेस की `skills/` डायरेक्टरी को लक्षित करते हैं; 
`--global` के साथ वे साझा प्रबंधित Skills डायरेक्टरी को लक्षित करते हैं। `list`/`info`/`check`
फिर भी वर्तमान वर्कस्पेस और कॉन्फ़िगरेशन को दिखाई देने वाले स्थानीय Skills का निरीक्षण करते हैं।
वर्कस्पेस-आधारित कमांड लक्ष्य वर्कस्पेस को पहले `--agent <id>` से,
फिर वर्तमान कार्यशील डायरेक्टरी से—यदि वह कॉन्फ़िगर किए गए एजेंट
वर्कस्पेस में हो—और उसके बाद डिफ़ॉल्ट एजेंट से निर्धारित करते हैं।

Git और स्थानीय डायरेक्टरी इंस्टॉलेशन के लिए स्रोत रूट पर `SKILL.md` अपेक्षित है। इंस्टॉल
स्लग पहले `SKILL.md` फ्रंटमैटर के `name` से लिया जाता है, यदि वह मान्य हो, फिर
स्रोत डायरेक्टरी या रिपॉज़िटरी के नाम से; इसे ओवरराइड करने के लिए `--as <slug>` का उपयोग करें।
`--version` केवल ClawHub के लिए है। Skill इंस्टॉलेशन npm पैकेज विनिर्देशों
या zip/आर्काइव पथों का समर्थन नहीं करते और `openclaw skills update` केवल ClawHub द्वारा ट्रैक किए गए
इंस्टॉलेशन अपडेट करता है।

ऑनबोर्डिंग या Skills सेटिंग से ट्रिगर किए गए Gateway-आधारित Skill निर्भरता इंस्टॉलेशन
इसके बजाय अलग `skills.install` अनुरोध पथ का उपयोग करते हैं।

नोट्स:

| फ़्लैग/व्यवहार                    | विवरण                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | वैकल्पिक क्वेरी; डिफ़ॉल्ट ClawHub खोज फ़ीड ब्राउज़ करने के लिए इसे छोड़ दें।                                                                                                                                                                                                                |
| `search --limit <n>`             | लौटाए गए परिणामों की अधिकतम संख्या निर्धारित करता है।                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | एक Git Skill इंस्टॉल करता है। ब्रांच रेफ़रेंस में स्लैश हो सकते हैं, जैसे `git:owner/repo@feature/foo`।                                                                                                                                                                                      |
| `install ./path/to/skill`        | ऐसी स्थानीय डायरेक्टरी इंस्टॉल करता है जिसके रूट में `SKILL.md` मौजूद हो।                                                                                                                                                                                                                        |
| `install --as <slug>`            | Git और स्थानीय डायरेक्टरी इंस्टॉलेशन के लिए अनुमानित स्लग को ओवरराइड करता है।                                                                                                                                                                                                                 |
| `install --version <version>`    | केवल ClawHub Skill रेफ़रेंस पर लागू होता है।                                                                                                                                                                                                                                               |
| `install --force`                | समान स्लग के मौजूदा वर्कस्पेस Skill फ़ोल्डर को अधिलेखित करता है।                                                                                                                                                                                                                  |
| `install/update --force-install` | ClawHub का स्कैन पूरा होने से पहले लंबित GitHub-आधारित ClawHub Skill इंस्टॉल करता है।                                                                                                                                                                                                   |
| `--global`                       | साझा प्रबंधित Skills डायरेक्टरी को लक्षित करता है; `--agent <id>` के साथ संयोजित नहीं किया जा सकता।                                                                                                                                                                                                  |
| `--agent <id>`                   | एक कॉन्फ़िगर किए गए एजेंट वर्कस्पेस को लक्षित करता है; वर्तमान कार्यशील डायरेक्टरी के अनुमान को ओवरराइड करता है।                                                                                                                                                                                            |
| `update @owner/<slug>`           | एक ट्रैक किए गए Skill को अपडेट करता है। वर्कस्पेस के बजाय साझा प्रबंधित Skills डायरेक्टरी को लक्षित करने के लिए `--global` जोड़ें।                                                                                                                                                            |
| `update --all`                   | चयनित वर्कस्पेस में ट्रैक किए गए ClawHub इंस्टॉलेशन अपडेट करता है, या `--global` के साथ साझा प्रबंधित Skills डायरेक्टरी में।                                                                                                                                                               |
| `verify @owner/<slug>`           | डिफ़ॉल्ट रूप से ClawHub का `clawhub.skill.verify.v1` JSON एनवलप प्रिंट करता है। कोई `--json` फ़्लैग नहीं है क्योंकि JSON पहले से ही डिफ़ॉल्ट है। संगतता के लिए बिना ओनर वाले स्लग स्वीकार किए जाते हैं, जब Skill पहले से इंस्टॉल हो या असंदिग्ध हो; ओनर-योग्य रेफ़रेंस प्रकाशक की अस्पष्टता से बचाते हैं। |
| `verify` उद्गम              | जब ClawHub सर्वर द्वारा निर्धारित स्रोत उद्गम लौटाता है, तब सत्यापन JSON में कमिट-पिन किया गया `openclaw.verifiedSourceUrl` भी शामिल होता है। अनुपलब्ध या स्वयं घोषित स्रोत URL केवल कच्चे उद्गम एनवलप में रहते हैं और उन्हें पदोन्नत नहीं किया जाता।                                           |
| `verify` संस्करण चयनकर्ता        | `verify` इंस्टॉल किए गए ClawHub Skills के लिए `.clawhub/origin.json` का उपयोग करता है, इसलिए यह इंस्टॉल किए गए संस्करण को उसी रजिस्ट्री के विरुद्ध सत्यापित करता है जहाँ से वह आया था। `--version` और `--tag` संस्करण चयनकर्ता को ओवरराइड करते हैं, लेकिन मूल मेटाडेटा मौजूद होने पर उसी इंस्टॉल की गई रजिस्ट्री को बनाए रखते हैं।                    |
| `verify --card`                  | JSON के बजाय जनरेट किया गया Skill Card Markdown प्रिंट करता है। ClawHub द्वारा `ok: false` या `decision: "fail"` लौटाए जाने पर गैर-शून्य स्थिति के साथ समाप्त होता है; अहस्ताक्षरित हस्ताक्षर केवल सूचनात्मक होते हैं, जब तक ClawHub नीति न बदले।                                                                             |
| Skill Card फ़िंगरप्रिंट           | इंस्टॉल किए गए ClawHub बंडल में जनरेट किया गया `skill-card.md` शामिल हो सकता है। OpenClaw सत्यापन को ClawHub सर्वर का निर्णय मानता है और किसी इंस्टॉल किए गए Skill को केवल इसलिए अस्वीकार नहीं करता कि जनरेट किया गया कार्ड बंडल फ़िंगरप्रिंट बदल देता है।                                              |
| `check --agent <id>`             | चयनित एजेंट के वर्कस्पेस की जाँच करता है और बताता है कि कौन-से तैयार Skills वास्तव में उस एजेंट के प्रॉम्प्ट या कमांड सतह पर दिखाई देते हैं।                                                                                                                                              |
| `list`                           | कोई उपकमांड न दिए जाने पर डिफ़ॉल्ट क्रिया।                                                                                                                                                                                                                                    |
| `list`/`info`/`check` आउटपुट     | रेंडर किया गया आउटपुट stdout पर जाता है। `--json` के साथ मशीन-पठनीय पेलोड पाइप और स्क्रिप्ट के लिए stdout पर ही रहता है।                                                                                                                                                                |

सामुदायिक ClawHub Skill इंस्टॉलेशन और अपडेट डाउनलोड करने से पहले विश्वसनीयता की जाँच करते हैं।
संस्करणयुक्त सामुदायिक आर्काइव रिलीज़ सटीक-रिलीज़ विश्वसनीयता मेटाडेटा का उपयोग करते हैं।
रिज़ॉल्वर-आधारित GitHub Skills, पिन किया गया कमिट लौटाने से पहले
स्कैन और बलपूर्वक इंस्टॉल नीति लागू करने के लिए ClawHub के इंस्टॉल रिज़ॉल्वर पर निर्भर करते हैं; उस स्कैन के
पूरा होने से पहले लंबित GitHub-आधारित Skill इंस्टॉल करने के लिए
`--force-install` का उपयोग करें। दुर्भावनापूर्ण या अवरुद्ध सामुदायिक रिलीज़ अस्वीकार कर दी जाती हैं। जोखिमपूर्ण
सामुदायिक रिलीज़ के लिए समीक्षा और `--acknowledge-clawhub-risk` आवश्यक हैं, जब कोई
गैर-इंटरैक्टिव कमांड उस समीक्षा के बाद जारी रहना चाहिए। आधिकारिक ClawHub
Skill प्रकाशक और बंडल किए गए OpenClaw Skill स्रोत इस रिलीज़-विश्वसनीयता
प्रॉम्प्ट को बायपास करते हैं।

## Skill कार्यशाला

`openclaw skills workshop` चयनित कार्यस्थान में लंबित skill प्रस्तावों को प्रबंधित करता है। प्रस्ताव लागू किए जाने तक सक्रिय skills नहीं होते। प्रस्ताव
संग्रहण, सहायक-फ़ाइल सुरक्षा उपायों, Gateway विधियों और अनुमोदन नीति के लिए,
[Skill कार्यशाला](/hi/tools/skill-workshop) देखें।

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "दोहराई जा सकने वाली QA जाँच-सूची" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "दोहराई जा सकने वाली QA जाँच-सूची" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "डुप्लिकेट"
openclaw skills workshop quarantine <proposal-id> --reason "सुरक्षा समीक्षा आवश्यक है"
```

`propose-create`, `propose-update`, और `revise`, प्रस्ताव की प्रेरणा और सहायक
टिप्पणियों को `--proposal`/`--proposal-dir` सामग्री के साथ दर्ज करने के लिए `--goal <text>`
और `--evidence <text>` को भी स्वीकार करते हैं।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Skills](/hi/tools/skills)
