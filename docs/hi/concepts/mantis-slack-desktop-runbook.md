---
read_when:
    - GitHub से या स्थानीय रूप से Mantis Slack डेस्कटॉप QA चलाना
    - धीमी Mantis Slack डेस्कटॉप रन की डीबगिंग
    - स्रोत, पूर्व-हाइड्रेटेड या वार्म-लीज़ मोड चुनना
    - किसी PR पर स्क्रीनशॉट और वीडियो साक्ष्य पोस्ट करना
summary: 'Mantis Slack डेस्कटॉप QA के लिए ऑपरेटर रनबुक: GitHub डिस्पैच, स्थानीय CLI, वार्म VNC लीज़, हाइड्रेट मोड, समय-निर्धारण की व्याख्या, आर्टिफ़ैक्ट और विफलता प्रबंधन।'
title: Mantis Slack डेस्कटॉप रनबुक
x-i18n:
    generated_at: "2026-07-16T14:27:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack डेस्कटॉप QA, Slack-श्रेणी के उन बगों के लिए वास्तविक-UI लेन है जिनके लिए
Linux डेस्कटॉप, VNC बचाव, Slack Web, वास्तविक OpenClaw Gateway, स्क्रीनशॉट,
वीडियो और PR साक्ष्य टिप्पणी आवश्यक हैं। इसका उपयोग तब करें जब यूनिट परीक्षण या हेडलेस
Slack लाइव लेन बग को सिद्ध नहीं कर सकते।

## स्टोरेज मॉडल

Mantis तीन स्टोरेज परतों का उपयोग करता है:

- **प्रदाता इमेज** - Crabbox के स्वामित्व में, क्लाउड प्रदाता खाते में संग्रहीत।
  इसमें मशीन क्षमताएँ (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, नेटिव बिल्ड टूल) और खाली कैश डायरेक्टरी होती हैं।
- **वार्म लीज़ स्थिति** - वर्तमान ऑपरेटर सत्र के स्वामित्व में। लीज़ के सक्रिय रहने तक इसमें
  लॉग-इन किया हुआ ब्राउज़र प्रोफ़ाइल, `/var/cache/crabbox/pnpm`, और तैयार स्रोत
  चेकआउट हो सकते हैं।
- **Mantis आर्टिफ़ैक्ट** - OpenClaw रन के स्वामित्व में। ये
  `.artifacts/qa-e2e/mantis/...` के अंतर्गत रहते हैं; GitHub Actions इन्हें अपलोड करता है और Mantis
  GitHub App PR पर इनलाइन साक्ष्य की टिप्पणी करता है।

किसी प्रदाता इमेज में कभी भी सीक्रेट, ब्राउज़र कुकी, Slack लॉगिन स्थिति, रिपॉज़िटरी चेकआउट,
`node_modules`, या `dist/` शामिल न करें।

## GitHub डिस्पैच

वर्कफ़्लो को `main` से चलाएँ:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` प्रतिबंधित है क्योंकि वर्कफ़्लो लाइव क्रेडेंशियल का उपयोग करता है: इसे
वर्तमान `main` वंशावली, किसी रिलीज़ टैग, या
`openclaw/openclaw` में किसी खुले PR हेड में रिज़ॉल्व होना आवश्यक है।

वर्कफ़्लो निम्न आउटपुट देता है:

- अपलोड किया गया आर्टिफ़ैक्ट `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- Mantis GitHub App से इनलाइन PR टिप्पणी
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- रिमोट लॉग: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

PR टिप्पणी को छिपे हुए `<!-- mantis-slack-desktop-smoke -->` मार्कर के माध्यम से उसी स्थान पर अपडेट किया जाता है।

## स्थानीय CLI

कोल्ड स्रोत प्रमाण:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

VNC बचाव के लिए VM को बनाए रखें:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC खोलें:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

वार्म लीज़ का पुनः उपयोग करें:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

`--hydrate-mode prehydrated` का उपयोग केवल तभी करें जब पुनः उपयोग किए गए रिमोट वर्कस्पेस में पहले से
`node_modules` और बिल्ड किया हुआ `dist/` हो; अन्यथा Mantis सुरक्षित रूप से विफल हो जाता है।

नेटिव Slack अनुमोदन UI को सिद्ध करें:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` और `--gateway-setup` परस्पर अनन्य हैं। यदि आप स्पष्ट अनुमोदन-चेकपॉइंट
`--scenario` पास नहीं करते, तो यह ऑप्ट-इन `slack-approval-exec-native` और
`slack-approval-plugin-native` परिदृश्य चलाता है; अन्य Slack परिदृश्य VM शुरू होने से पहले
अस्वीकार कर दिए जाते हैं। Slack QA रनर वास्तविक Slack API संदेश से प्रत्येक चेकपॉइंट JSON
फ़ाइल लिखता है, फिर रिमोट वॉचर उस संदेश को
`approval-checkpoints/<scenario>-pending.png` और
`approval-checkpoints/<scenario>-resolved.png` में रेंडर करता है। यदि कोई
चेकपॉइंट JSON, संदेश साक्ष्य, ack JSON, या रेंडर किया गया स्क्रीनशॉट अनुपस्थित
या खाली हो, तो रन विफल हो जाता है।

कोल्ड GitHub Actions लीज़ में Slack Web कुकी नहीं होतीं, इसलिए उनका ब्राउज़र कैप्चर
Slack साइन-इन स्क्रीन पर पहुँच सकता है। अनुमोदन-चेकपॉइंट प्रमाण के लिए,
`slack-desktop-smoke.png` के बजाय रेंडर की गई चेकपॉइंट इमेज और Slack QA आर्टिफ़ैक्ट पर भरोसा करें।
ब्राउज़र स्क्रीनशॉट में स्वयं Slack Web दिखाना आवश्यक होने पर ही मैन्युअल रूप से
लॉग-इन किए गए Slack Web प्रोफ़ाइल वाली बनाए रखी गई वार्म लीज़ का उपयोग करें।

## हाइड्रेट मोड

| मोड          | कब उपयोग करें                                  | रिमोट व्यवहार                                                                       | समझौता                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | सामान्य PR प्रमाण, कोल्ड मशीनें, CI        | VM के भीतर `pnpm install --frozen-lockfile --prefer-offline` और `pnpm build` चलाता है | सबसे धीमा, सबसे सशक्त स्रोत-चेकआउट प्रमाण                 |
| `prehydrated` | आपने जानबूझकर पुनः उपयोग की गई लीज़ तैयार की है | मौजूदा `node_modules` और `dist/` आवश्यक हैं; इंस्टॉल/बिल्ड छोड़ देता है                     | तेज़, लेकिन केवल ऑपरेटर-नियंत्रित वार्म लीज़ के लिए मान्य |

GitHub Actions, VM रन से पहले हमेशा उम्मीदवार चेकआउट तैयार करता है। इसका
pnpm स्टोर OS, Node संस्करण और लॉकफ़ाइल के आधार पर कैश किया जाता है। उपलब्ध होने पर VM का
`source` रन भी `/var/cache/crabbox/pnpm` का पुनः उपयोग करता है।

## समय की व्याख्या

`mantis-slack-desktop-smoke-report.md` में चरणों का समय शामिल है:

- `crabbox.warmup` - क्लाउड प्रदाता बूट, डेस्कटॉप/ब्राउज़र तैयारी, SSH।
- `crabbox.inspect` - लीज़ मेटाडेटा लुकअप।
- `credentials.prepare` - Convex क्रेडेंशियल लीज़ अधिग्रहण।
- `crabbox.remote_run` - सिंक, ब्राउज़र लॉन्च, OpenClaw इंस्टॉल/बिल्ड या
  हाइड्रेट सत्यापन, Gateway स्टार्टअप, स्क्रीनशॉट और वीडियो कैप्चर।
- `artifacts.copy` - VM से वापस rsync।

जब Crabbox गैर-शून्य रिमोट स्थिति लौटाता है, लेकिन Mantis ने ऐसा मेटाडेटा कॉपी किया हो जो
यह सिद्ध करता हो कि OpenClaw Gateway सेटअप पूरा हुआ या Slack QA कमांड स्वयं सफलतापूर्वक
समाप्त हुआ, तब `crabbox.remote_run`, `accepted` दिखा सकता है।
`accepted` को विफल परिदृश्य नहीं, बल्कि स्पष्टीकरण सहित उत्तीर्ण मानें।

यदि कोई रन धीमा है:

- वार्मअप प्रमुख है: बेहतर Crabbox प्रदाता इमेज को पहले से बेक या प्रमोट करें।
- `source` में `remote_run` प्रमुख है: वार्म लीज़ का उपयोग करें, pnpm स्टोर
  के पुनः उपयोग में सुधार करें, या मशीन की पूर्वापेक्षाएँ प्रदाता इमेज में ले जाएँ।
- `prehydrated` में `remote_run` प्रमुख है: रिमोट वर्कस्पेस वास्तव में
  तैयार नहीं था, या Gateway/ब्राउज़र/Slack सेटअप धीमा है।
- आर्टिफ़ैक्ट कॉपी प्रमुख है: वीडियो का आकार और आर्टिफ़ैक्ट डायरेक्टरी की सामग्री जाँचें।

## साक्ष्य चेकलिस्ट

एक अच्छी PR टिप्पणी में यह दिखता है:

- परिदृश्य id और उम्मीदवार SHA
- GitHub Actions रन URL और आर्टिफ़ैक्ट URL
- इनलाइन अनुमोदन-चेकपॉइंट स्क्रीनशॉट, या लॉग-इन की गई वार्म लीज़ से Slack Web स्क्रीनशॉट
- उपलब्ध होने पर इनलाइन एनिमेटेड पूर्वावलोकन
- पूर्ण MP4 और ट्रिम किए गए MP4 लिंक
- उत्तीर्ण/विफल स्थिति और रिपोर्ट का समय सारांश

स्क्रीनशॉट या वीडियो को रिपॉज़िटरी में कमिट न करें। उन्हें GitHub
Actions आर्टिफ़ैक्ट या PR टिप्पणी में रखें।

## विफलता प्रबंधन

यदि वर्कफ़्लो VM रन से पहले विफल हो जाता है, तो पहले Actions जॉब जाँचें।
सामान्य कारण: अविश्वसनीय `candidate_ref`, अनुपस्थित परिवेश सीक्रेट, या
उम्मीदवार इंस्टॉल/बिल्ड विफलता।

यदि VM रन विफल हो जाता है लेकिन स्क्रीनशॉट वापस कॉपी किए गए थे, तो इन्हें जाँचें:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

यदि रन ने लीज़ बनाए रखी है, तो रिपोर्ट के `crabbox vnc ...`
कमांड से VNC खोलें, फिर काम पूरा होने पर लीज़ रोकें:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

यदि Slack लॉगिन समाप्त हो गया है, तो बनाए रखी गई लीज़ पर VNC में उसे सुधारें और
`--lease-id` के साथ फिर से चलाएँ। उस ब्राउज़र प्रोफ़ाइल को प्रदाता इमेज में शामिल न करें।

## संबंधित

- [QA अवलोकन](/hi/concepts/qa-e2e-automation)
- [Slack चैनल](/hi/channels/slack)
- [परीक्षण](/hi/help/testing)
