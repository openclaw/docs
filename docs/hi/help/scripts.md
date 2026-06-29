---
read_when:
    - रिपॉज़िटरी से स्क्रिप्ट चलाना
    - ./scripts के अंतर्गत स्क्रिप्ट जोड़ना या बदलना
summary: 'Repository scripts: उद्देश्य, दायरा, और सुरक्षा संबंधी टिप्पणियां'
title: स्क्रिप्ट्स
x-i18n:
    generated_at: "2026-06-28T23:16:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` निर्देशिका में स्थानीय workflows और ops कार्यों के लिए सहायक scripts होते हैं।
जब कोई कार्य स्पष्ट रूप से किसी script से जुड़ा हो, तो इनका उपयोग करें; अन्यथा CLI को प्राथमिकता दें।

## परंपराएँ

- Scripts **वैकल्पिक** हैं, जब तक कि docs या release checklists में उनका संदर्भ न दिया गया हो।
- जहाँ CLI सतहें मौजूद हों, उन्हें प्राथमिकता दें (उदाहरण: auth monitoring `openclaw models status --check` का उपयोग करता है)।
- मानें कि scripts host-specific हैं; किसी नई मशीन पर चलाने से पहले उन्हें पढ़ें।

## Auth monitoring scripts

Auth monitoring [Authentication](/hi/gateway/authentication) में कवर किया गया है। `scripts/` के अंतर्गत scripts systemd/Termux phone workflows के लिए वैकल्पिक अतिरिक्त हैं।

## GitHub read helper

जब आप चाहते हैं कि `gh` repo-scoped read calls के लिए GitHub App installation token का उपयोग करे, जबकि write actions के लिए सामान्य `gh` आपके personal login पर रहे, तब `scripts/gh-read` का उपयोग करें।

आवश्यक env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

वैकल्पिक env:

- `OPENCLAW_GH_READ_INSTALLATION_ID` जब आप repo-based installation lookup को छोड़ना चाहते हों
- `OPENCLAW_GH_READ_PERMISSIONS` read permission subset को request करने के लिए comma-separated override के रूप में

Repo resolution order:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

उदाहरण:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Scripts जोड़ते समय

- Scripts को केंद्रित और documented रखें।
- संबंधित doc में एक छोटी entry जोड़ें (या अगर missing हो तो एक बनाएँ)।

## संबंधित

- [Testing](/hi/help/testing)
- [Testing live](/hi/help/testing-live)
