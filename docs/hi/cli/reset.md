---
read_when:
    - आप CLI को इंस्टॉल रखा रखते हुए स्थानीय स्थिति मिटाना चाहते हैं
    - आप यह देखना चाहते हैं कि ड्राई-रन में क्या हटाया जाएगा
summary: '`openclaw reset` के लिए CLI संदर्भ (स्थानीय स्थिति/कॉन्फ़िग रीसेट करें)'
title: रीसेट
x-i18n:
    generated_at: "2026-06-28T22:52:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

स्थानीय कॉन्फ़िगरेशन/स्थिति रीसेट करें (CLI इंस्टॉल रहता है)।

विकल्प:

- `--scope <scope>`: `config`, `config+creds+sessions`, या `full`
- `--yes`: पुष्टि संकेतों को छोड़ें
- `--non-interactive`: संकेतों को अक्षम करें; `--scope` और `--yes` आवश्यक हैं
- `--dry-run`: फ़ाइलें हटाए बिना कार्रवाइयाँ प्रिंट करें

उदाहरण:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

टिप्पणियाँ:

- स्थानीय स्थिति हटाने से पहले यदि आप पुनर्स्थापित करने योग्य स्नैपशॉट चाहते हैं, तो पहले `openclaw backup create` चलाएँ।
- यदि आप `--scope` छोड़ देते हैं, तो `openclaw reset` क्या हटाना है यह चुनने के लिए एक इंटरैक्टिव संकेत का उपयोग करता है।
- `--non-interactive` केवल तभी मान्य है जब `--scope` और `--yes` दोनों सेट हों।

## संबंधित

- [CLI संदर्भ](/hi/cli)
