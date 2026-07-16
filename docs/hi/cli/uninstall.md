---
read_when:
    - आप Gateway सेवा और/या स्थानीय स्थिति हटाना चाहते हैं
    - आप पहले एक ड्राई रन करना चाहते हैं
summary: '`openclaw uninstall` के लिए CLI संदर्भ (Gateway सेवा + स्थानीय डेटा हटाएँ)'
title: अनइंस्टॉल करें
x-i18n:
    generated_at: "2026-07-16T14:07:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway सेवा और/या स्थानीय डेटा अनइंस्टॉल करें। CLI स्वयं नहीं
हटाया जाता; इसे npm/pnpm के माध्यम से अलग से अनइंस्टॉल करें।

## विकल्प

| फ़्लैग                | डिफ़ॉल्ट | विवरण                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `--service`         | `false` | Gateway सेवा हटाएँ।                          |
| `--state`           | `false` | स्थिति और कॉन्फ़िगरेशन हटाएँ।                             |
| `--workspace`       | `false` | कार्यस्थान डायरेक्टरियाँ हटाएँ।                        |
| `--app`             | `false` | macOS ऐप हटाएँ।                                |
| `--all`             | `false` | `--service --state --workspace --app` का संक्षिप्त रूप। |
| `--yes`             | `false` | पुष्टिकरण प्रॉम्प्ट छोड़ें।                           |
| `--non-interactive` | `false` | प्रॉम्प्ट अक्षम करें; इसके लिए `--yes` आवश्यक है।                   |
| `--dry-run`         | `false` | फ़ाइलें हटाए बिना नियोजित कार्रवाइयाँ प्रिंट करें।        |

कोई कार्यक्षेत्र फ़्लैग न देने पर, एक इंटरैक्टिव बहु-चयन प्रॉम्प्ट पूछता है कि कौन-से घटक
हटाने हैं (सेवा, स्थिति और कार्यस्थान डिफ़ॉल्ट रूप से पहले से चयनित होते हैं)।

## उदाहरण

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## टिप्पणियाँ

- स्थिति या कार्यस्थान हटाने से पहले पुनर्स्थापित की जा सकने वाली स्नैपशॉट के लिए पहले `openclaw backup create` चलाएँ।
- `--state` कॉन्फ़िगर की गई कार्यस्थान डायरेक्टरियों को सुरक्षित रखता है, जब तक कि `--workspace` भी
  चयनित न हो।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [अनइंस्टॉल करें](/hi/install/uninstall)
