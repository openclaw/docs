---
read_when:
    - आप एजेंट हुक प्रबंधित करना चाहते हैं
    - आप हुक की उपलब्धता जाँचना या वर्कस्पेस हुक सक्षम करना चाहते हैं
summary: '`openclaw hooks` (एजेंट हुक्स) के लिए CLI संदर्भ'
title: हुक्स
x-i18n:
    generated_at: "2026-07-19T09:10:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

एजेंट हुक प्रबंधित करें (इवेंट-संचालित ऑटोमेशन, जो `/new`, `/reset` और Gateway स्टार्टअप जैसे कमांड के लिए होते हैं)। केवल `openclaw hooks`, `openclaw hooks list` के समतुल्य है।

संबंधित: [हुक](/hi/automation/hooks) - [Plugin हुक](/hi/plugins/hooks)

## हुक सूचीबद्ध करें

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

वर्कस्पेस, प्रबंधित, अतिरिक्त और बंडल की गई डायरेक्टरियों से खोजे गए हुक सूचीबद्ध करता है।

- `--eligible`: केवल वे हुक जिनकी आवश्यकताएँ पूरी होती हैं।
- `--json`: संरचित आउटपुट।
- `-v, --verbose`: पूरी न हुई आवश्यकताओं के साथ Missing कॉलम शामिल करें।

```
हुक (4/5 तैयार)

तैयार:
  🚀 boot-md ✓ - Gateway स्टार्टअप पर BOOT.md चलाएँ
  📎 bootstrap-extra-files ✓ - एजेंट बूटस्ट्रैप के दौरान अतिरिक्त वर्कस्पेस बूटस्ट्रैप फ़ाइलें इंजेक्ट करें
  📝 command-logger ✓ - सभी कमांड इवेंट को एक केंद्रीकृत ऑडिट फ़ाइल में लॉग करें
  💾 session-memory ✓ - /new या /reset कमांड जारी होने पर सत्र संदर्भ को मेमोरी में सहेजें
```

## हुक की जानकारी प्राप्त करें

```bash
openclaw hooks info <name> [--json]
```

`<name>` हुक का नाम या हुक कुंजी है (उदाहरण के लिए `session-memory`)। स्रोत, फ़ाइल/हैंडलर पथ, होमपेज, इवेंट और प्रत्येक आवश्यकता की स्थिति (बाइनरी, env, कॉन्फ़िगरेशन, OS) दिखाता है।

## पात्रता जाँचें

```bash
openclaw hooks check [--json]
```

तैयार/तैयार-नहीं संख्या का सारांश प्रिंट करता है; तैयार न होने वाले हुक के लिए प्रत्येक हुक को उसके अवरोधक कारण सहित सूचीबद्ध करता है।

## हुक सक्षम करें

```bash
openclaw hooks enable <name>
```

कॉन्फ़िगरेशन में `hooks.internal.entries.<name>.enabled = true` जोड़ता/अपडेट करता है और `hooks.internal.enabled` मास्टर स्विच भी चालू करता है (जब तक कम-से-कम एक हुक कॉन्फ़िगर न हो, Gateway कोई आंतरिक हुक हैंडलर लोड नहीं करता)। यदि हुक मौजूद नहीं है, Plugin द्वारा प्रबंधित है या पात्र नहीं है (आवश्यकताएँ अनुपलब्ध हैं), तो यह विफल हो जाता है।

Plugin द्वारा प्रबंधित हुक `hooks list` में `plugin:<id>` दिखाते हैं और उन्हें यहाँ सक्षम/अक्षम नहीं किया जा सकता; इसके बजाय स्वामी Plugin को सक्षम या अक्षम करें।

सक्षम करने के बाद Gateway पुनः आरंभ करें (macOS मेनू बार ऐप को पुनः आरंभ करें या dev में अपनी Gateway प्रक्रिया पुनः आरंभ करें), ताकि वह हुक फिर से लोड करे।

## हुक अक्षम करें

```bash
openclaw hooks disable <name>
```

`hooks.internal.entries.<name>.enabled = false` सेट करता है। इसके बाद Gateway पुनः आरंभ करें।

## हुक पैक इंस्टॉल और अपडेट करें

```bash
openclaw plugins install <package>        # डिफ़ॉल्ट रूप से npm
openclaw plugins install npm:<package>    # केवल npm
openclaw plugins install <package> --pin  # रिज़ॉल्व किया गया संस्करण पिन करें
openclaw plugins install <path>           # स्थानीय डायरेक्टरी या आर्काइव
openclaw plugins install -l <path>        # कॉपी करने के बजाय स्थानीय डायरेक्टरी लिंक करें

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

हुक पैक एकीकृत Plugin इंस्टॉलर/अपडेटर के माध्यम से इंस्टॉल होते हैं; `openclaw hooks install` / `openclaw hooks update` अब भी बहिष्कृत उपनामों के रूप में काम करते हैं, जो चेतावनी प्रिंट करके `plugins` कमांड को अग्रेषित करते हैं।

- Npm स्पेसिफ़िकेशन केवल रजिस्ट्री के लिए हैं: पैकेज नाम और वैकल्पिक सटीक संस्करण या dist-tag। Git/URL/फ़ाइल स्पेसिफ़िकेशन और semver श्रेणियाँ अस्वीकार कर दी जाती हैं। डिपेंडेंसी इंस्टॉलेशन `--ignore-scripts` के साथ प्रोजेक्ट में स्थानीय रूप से चलते हैं।
- साधारण स्पेसिफ़िकेशन और `@latest` स्थिर ट्रैक पर बने रहते हैं; यदि npm किसी प्रीरिलीज़ को रिज़ॉल्व करता है, तो OpenClaw रुक जाता है और आपसे स्पष्ट रूप से ऑप्ट-इन करने को कहता है (`@beta`, `@rc` या कोई सटीक प्रीरिलीज़ संस्करण)।
- समर्थित आर्काइव: `.zip`, `.tgz`, `.tar.gz`, `.tar`।
- `-l, --link` किसी स्थानीय डायरेक्टरी को कॉपी करने के बजाय लिंक करता है (उसे `hooks.internal.load.extraDirs` में जोड़ता है); लिंक किए गए हुक पैक ऑपरेटर द्वारा कॉन्फ़िगर की गई डायरेक्टरी के प्रबंधित हुक हैं, वर्कस्पेस हुक नहीं।
- `--pin`, npm इंस्टॉलेशन को `hooks.internal.installs` में सटीक रूप से रिज़ॉल्व किए गए `name@version` के रूप में रिकॉर्ड करता है।
- इंस्टॉलेशन पैक को `~/.openclaw/hooks/<id>` में कॉपी करता है, उसके हुक को `hooks.internal.entries.*` के अंतर्गत सक्षम करता है और इंस्टॉलेशन को `hooks.internal.installs` के अंतर्गत रिकॉर्ड करता है।
- यदि संग्रहीत इंटेग्रिटी हैश अब प्राप्त आर्टिफ़ैक्ट से मेल नहीं खाता, तो OpenClaw चेतावनी देता है और जारी रखने से पहले संकेत देता है; संकेत को छोड़ने के लिए वैश्विक `--yes` पास करें (उदाहरण के लिए CI में)।

## बंडल किए गए हुक

| हुक                   | इवेंट                                             | यह क्या करता है                                                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | प्रत्येक कॉन्फ़िगर किए गए एजेंट स्कोप के लिए Gateway स्टार्टअप पर `BOOT.md` चलाता है                                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | एजेंट बूटस्ट्रैप के दौरान अतिरिक्त बूटस्ट्रैप फ़ाइलें (उदाहरण के लिए मोनोरेपो `AGENTS.md`/`TOOLS.md`) इंजेक्ट करता है |
| command-logger        | `command`                                         | कमांड इवेंट को `~/.openclaw/logs/commands.log` में लॉग करता है                                             |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | सत्र Compaction शुरू और समाप्त होने पर दृश्यमान चैट सूचनाएँ भेजता है                             |
| session-memory        | `command:new`, `command:reset`                    | `/new` या `/reset` पर सत्र संदर्भ को मेमोरी में सहेजता है                                              |

किसी भी बंडल किए गए हुक को `openclaw hooks enable <hook-name>` से सक्षम करें। पूर्ण विवरण, कॉन्फ़िगरेशन कुंजियाँ और डिफ़ॉल्ट: [बंडल किए गए हुक](/hi/automation/hooks#bundled-hooks)।

### command-logger लॉग फ़ाइल

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # हाल के कमांड
cat ~/.openclaw/logs/commands.log | jq .          # सुव्यवस्थित रूप से प्रिंट करें
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # कार्रवाई के अनुसार फ़िल्टर करें
```

## टिप्पणियाँ

- `hooks list --json`, `info --json` और `check --json` संरचित JSON को सीधे stdout पर लिखते हैं।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ऑटोमेशन हुक](/hi/automation/hooks)
