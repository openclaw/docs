---
read_when:
    - आप zsh/bash/fish/PowerShell के लिए शेल पूर्णताएँ चाहते हैं
    - आपको कम्प्लीशन स्क्रिप्ट को OpenClaw स्थिति के अंतर्गत कैश करना होगा
summary: '`openclaw completion` के लिए CLI संदर्भ (शेल पूर्णता स्क्रिप्ट बनाएँ/इंस्टॉल करें)'
title: पूर्णता
x-i18n:
    generated_at: "2026-06-28T22:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

शेल completion scripts जनरेट करें और वैकल्पिक रूप से उन्हें अपने शेल प्रोफ़ाइल में इंस्टॉल करें।

## उपयोग

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## विकल्प

- `-s, --shell <shell>`: शेल लक्ष्य (`zsh`, `bash`, `powershell`, `fish`; डिफ़ॉल्ट: `zsh`)
- `-i, --install`: अपने शेल प्रोफ़ाइल में source लाइन जोड़कर completion इंस्टॉल करें
- `--write-state`: stdout पर प्रिंट किए बिना completion script(s) को `$OPENCLAW_STATE_DIR/completions` में लिखें
- `-y, --yes`: इंस्टॉल पुष्टिकरण प्रॉम्प्ट छोड़ें

## नोट्स

- `--install` आपके शेल प्रोफ़ाइल में एक छोटा "OpenClaw Completion" ब्लॉक लिखता है और उसे कैश किए गए script की ओर इंगित करता है।
- `--install` या `--write-state` के बिना, कमांड script को stdout पर प्रिंट करता है।
- Completion जनरेशन कमांड ट्री को उत्सुकता से लोड करता है ताकि नेस्टेड सबकमांड शामिल हों।

## संबंधित

- [CLI संदर्भ](/hi/cli)
