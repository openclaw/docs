---
read_when:
    - आप CLI को इंस्टॉल रखा रखते हुए स्थानीय स्थिति मिटाना चाहते हैं
    - आप यह देखना चाहते हैं कि क्या हटाया जाएगा, बिना वास्तव में हटाए।
summary: '`openclaw reset` के लिए CLI संदर्भ (स्थानीय स्थिति/कॉन्फ़िगरेशन रीसेट करें)'
title: रीसेट करें
x-i18n:
    generated_at: "2026-07-19T09:14:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54f1d320ee368dae4a4bfb32dea73d19eb35f9f30edd12d9c2580ab7e6a26fa6
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

स्थानीय कॉन्फ़िगरेशन/स्थिति रीसेट करें (CLI इंस्टॉल रहता है)।

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## विकल्प

- `--scope <scope>`: `config`, `config+creds+sessions`, या `full`
- `--yes`: पुष्टिकरण प्रॉम्प्ट छोड़ें
- `--non-interactive`: प्रॉम्प्ट अक्षम करें; `--scope` और `--yes` आवश्यक हैं
- `--dry-run`: फ़ाइलें हटाए बिना कार्रवाइयाँ प्रिंट करें

## दायरे

| दायरा                   | हटाता है                                                                     | पहले Gateway रोकता है |
| ----------------------- | --------------------------------------------------------------------------- | ------------------- |
| `config`                | केवल कॉन्फ़िगरेशन फ़ाइल                                                            | नहीं                  |
| `config+creds+sessions` | कॉन्फ़िगरेशन फ़ाइल, OAuth/क्रेडेंशियल डायरेक्टरी, प्रति-एजेंट सत्र डायरेक्टरियाँ           | हाँ                 |
| `full`                  | स्थिति डायरेक्टरी (साझा SQLite डेटाबेस सहित) और वर्कस्पेस डायरेक्टरियाँ | हाँ                 |

`config+creds+sessions` और `full` स्थिति हटाने से पहले चल रही प्रबंधित Gateway सेवा को रोकते हैं।

## टिप्पणियाँ

- स्थानीय स्थिति हटाने से पहले पुनर्स्थापित किए जा सकने वाले स्नैपशॉट के लिए पहले `openclaw backup create` चलाएँ।
- वर्कस्पेस सेटअप स्थिति और सत्यापन साझा SQLite डेटाबेस में पंक्तियाँ हैं, इसलिए `full` उन्हें स्थिति डायरेक्टरी के साथ हटा देता है; अलग से हटाने के लिए वर्तमान में कोई सत्यापन साइडकार फ़ाइल नहीं है।
- `--scope` के बिना, `openclaw reset` हटाए जाने वाले दायरे के लिए इंटरैक्टिव रूप से संकेत देता है।
- `--non-interactive` केवल तभी मान्य है, जब `--scope` और `--yes` दोनों सेट हों।
- `config+creds+sessions` और `full` पूरा होने पर `Next: openclaw onboard --install-daemon` प्रिंट करते हैं।

## संबंधित

- [CLI संदर्भ](/hi/cli)
