---
read_when:
    - macOS Skills सेटिंग्स UI को अपडेट करना
    - Skills की गेटिंग या इंस्टॉल व्यवहार बदलना
summary: macOS Skills सेटिंग्स UI और Gateway-समर्थित स्थिति
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-16T15:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS ऐप Gateway के माध्यम से OpenClaw Skills उपलब्ध कराता है; यह Skills को स्थानीय रूप से पार्स नहीं करता।

## डेटा स्रोत

- `skills.status` (Gateway) सभी Skills के साथ पात्रता और अनुपलब्ध आवश्यकताएँ लौटाता है, जिनमें बंडल किए गए Skills के लिए अनुमति-सूची अवरोध शामिल हैं।
- आवश्यकताएँ प्रत्येक `SKILL.md` में मौजूद `metadata.openclaw.requires` से आती हैं।

## इंस्टॉल क्रियाएँ

- `metadata.openclaw.install` इंस्टॉल विकल्प (brew/node/go/uv/download) निर्धारित करता है।
- ऐप Gateway होस्ट पर इंस्टॉलर चलाने के लिए `skills.install` को कॉल करता है।
- ऑपरेटर-स्वामित्व वाला `security.installPolicy` (`enabled`, `targets`, `exec`) इंस्टॉलर मेटाडेटा चलने से पहले Gateway-समर्थित Skill इंस्टॉल को अवरुद्ध कर सकता है। अंतर्निहित खतरनाक-कोड स्कैनिंग (जिसका उपयोग Plugin इंस्टॉल के लिए होता है) Skill इंस्टॉल प्रवाह से जुड़ी नहीं है।
- यदि प्रत्येक इंस्टॉल विकल्प `download` है, तो Gateway डाउनलोड के सभी विकल्प दिखाता है।
- अन्यथा, Gateway मौजूदा इंस्टॉल प्राथमिकताओं (`skills.install.preferBrew`, `skills.install.nodeManager`) और होस्ट बाइनरी का उपयोग करके एक पसंदीदा इंस्टॉलर चुनता है: जब `preferBrew` सक्षम हो और `brew` मौजूद हो, तो पहले Homebrew; फिर `uv`; फिर कॉन्फ़िगर किया गया Node प्रबंधक; फिर उपलब्ध होने पर दोबारा Homebrew (यहाँ तक कि `preferBrew` के बिना भी); फिर `go`; और फिर `download`।
- Node इंस्टॉल लेबल कॉन्फ़िगर किए गए Node प्रबंधक को दर्शाते हैं, जिसमें `yarn` भी शामिल है।

## परिवेश/API कुंजियाँ

- ऐप कुंजियों को `~/.openclaw/openclaw.json` में `skills.entries.<skillKey>` के अंतर्गत संग्रहीत करता है।
- `skills.update` `enabled`, `apiKey`, और `env` को पैच करता है।

## रिमोट मोड

- इंस्टॉल और कॉन्फ़िगरेशन अपडेट Gateway होस्ट पर होते हैं, स्थानीय Mac पर नहीं।

## संबंधित

- [Skills](/hi/tools/skills)
- [macOS ऐप](/hi/platforms/macos)
