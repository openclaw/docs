---
read_when:
    - आप Gateway सेवा और/या स्थानीय स्थिति हटाना चाहते हैं
    - आप पहले ड्राई रन करना चाहते हैं
summary: '`openclaw uninstall` के लिए CLI संदर्भ (Gateway सेवा + स्थानीय डेटा हटाएं)'
title: अनइंस्टॉल करें
x-i18n:
    generated_at: "2026-06-28T22:54:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway सेवा + स्थानीय डेटा अनइंस्टॉल करें (CLI बनी रहती है)।

विकल्प:

- `--service`: Gateway सेवा हटाएं
- `--state`: स्थिति और कॉन्फ़िग हटाएं
- `--workspace`: वर्कस्पेस डायरेक्टरियां हटाएं
- `--app`: macOS ऐप हटाएं
- `--all`: सेवा, स्थिति, वर्कस्पेस और ऐप हटाएं
- `--yes`: पुष्टि प्रॉम्प्ट छोड़ें
- `--non-interactive`: प्रॉम्प्ट अक्षम करें; `--yes` आवश्यक है
- `--dry-run`: फ़ाइलें हटाए बिना कार्रवाइयां प्रिंट करें

उदाहरण:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

नोट्स:

- यदि आप स्थिति या वर्कस्पेस हटाने से पहले पुनर्स्थापित की जा सकने वाली स्नैपशॉट चाहते हैं, तो पहले `openclaw backup create` चलाएं।
- जब तक `--workspace` भी चयनित न हो, `--state` कॉन्फ़िगर की गई वर्कस्पेस डायरेक्टरियां सुरक्षित रखता है।
- `--all` सेवा, स्थिति, वर्कस्पेस और ऐप को साथ में हटाने का संक्षिप्त रूप है।
- `--non-interactive` के लिए `--yes` आवश्यक है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [अनइंस्टॉल](/hi/install/uninstall)
