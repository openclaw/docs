---
read_when:
    - रिपॉज़िटरी से स्क्रिप्ट चलाना
    - ./scripts के अंतर्गत स्क्रिप्ट जोड़ना या बदलना
summary: 'रिपॉज़िटरी स्क्रिप्ट: उद्देश्य, दायरा और सुरक्षा संबंधी टिप्पणियाँ'
title: स्क्रिप्ट्स
x-i18n:
    generated_at: "2026-07-16T15:19:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` में स्थानीय वर्कफ़्लो और संचालन कार्यों के लिए सहायक स्क्रिप्ट होती हैं। जब कोई कार्य स्पष्ट रूप से किसी स्क्रिप्ट से जुड़ा हो, तब इनका उपयोग करें; अन्यथा CLI को प्राथमिकता दें।

## परंपराएँ

- दस्तावेज़ों या रिलीज़ जाँच-सूचियों में संदर्भित न होने तक स्क्रिप्ट **वैकल्पिक** हैं।
- CLI इंटरफ़ेस उपलब्ध होने पर उन्हें प्राथमिकता दें (उदाहरण: `openclaw models status --check`)।
- मान लें कि स्क्रिप्ट होस्ट-विशिष्ट हैं; उन्हें किसी नई मशीन पर चलाने से पहले पढ़ें।

## प्रमाणीकरण निगरानी स्क्रिप्ट

सामान्य मॉडल प्रमाणीकरण की जानकारी [प्रमाणीकरण](/hi/gateway/authentication) में दी गई है। नीचे दी गई स्क्रिप्ट किसी दूरस्थ/हेडलेस होस्ट पर **Claude Code CLI सदस्यता टोकन** की निगरानी करने और फ़ोन से फिर से प्रमाणीकरण करने के लिए एक अलग, वैकल्पिक प्रणाली हैं:

- `scripts/setup-auth-system.sh` - एक बार का सेटअप: वर्तमान प्रमाणीकरण की जाँच करता है, दीर्घकालिक `claude setup-token` बनाने में सहायता करता है और systemd/Termux स्थापना चरण प्रिंट करता है।
- `scripts/claude-auth-status.sh [full|json|simple]` - Claude Code + OpenClaw प्रमाणीकरण स्थिति की जाँच करता है।
- `scripts/auth-monitor.sh` - स्थिति का नियमित निरीक्षण करता है और टोकन की समाप्ति निकट होने पर सूचना भेजता है (OpenClaw send और/या ntfy.sh के माध्यम से)। परिवेश चर: `WARN_HOURS` (डिफ़ॉल्ट `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`। इसे साथ दी गई `scripts/systemd/openclaw-auth-monitor.{service,timer}` के माध्यम से निर्धारित समय-सारणी पर चलाएँ (हर 30 मिनट में)।
- `scripts/mobile-reauth.sh` - `claude setup-token` को फिर से चलाता है और फ़ोन पर खोलने के लिए URL प्रिंट करता है; Termux से SSH के माध्यम से उपयोग हेतु।
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - Termux:Widget स्क्रिप्ट, जो होस्ट से SSH के माध्यम से जुड़ती हैं, स्थिति टोस्ट दिखाती हैं और प्रमाणीकरण की समय-सीमा समाप्त होने पर पुनः-प्रमाणीकरण कंसोल/निर्देश खोलती हैं।

## GitHub रीड सहायक

जब आप चाहते हैं कि `gh` रिपॉज़िटरी-स्कोप वाली रीड कॉल के लिए GitHub App स्थापना टोकन का उपयोग करे, जबकि लेखन कार्रवाइयों के लिए सामान्य `gh` आपके व्यक्तिगत लॉगिन पर बना रहे, तब `scripts/gh-read` का उपयोग करें।

आवश्यक परिवेश चर:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

वैकल्पिक परिवेश चर:

- जब आप रिपॉज़िटरी-आधारित स्थापना लुकअप छोड़ना चाहते हैं, तब `OPENCLAW_GH_READ_INSTALLATION_ID`
- अनुरोध किए जाने वाले रीड अनुमति उपसमुच्चय के लिए कॉमा से अलग किया गया ओवरराइड: `OPENCLAW_GH_READ_PERMISSIONS`

रिपॉज़िटरी निर्धारण क्रम:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

उदाहरण:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## स्क्रिप्ट जोड़ते समय

- स्क्रिप्ट को केंद्रित रखें और उनका दस्तावेज़ीकरण करें।
- संबंधित दस्तावेज़ में एक संक्षिप्त प्रविष्टि जोड़ें (या दस्तावेज़ न होने पर एक बनाएँ)।

## संबंधित

- [परीक्षण](/hi/help/testing)
- [लाइव परीक्षण](/hi/help/testing-live)
