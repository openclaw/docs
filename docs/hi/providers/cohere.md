---
read_when:
    - आप OpenClaw के साथ Cohere का उपयोग करना चाहते हैं
    - आपको Cohere API कुंजी के एनवायरनमेंट वेरिएबल या CLI प्रमाणीकरण विकल्प की आवश्यकता है
summary: Cohere सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Cohere
x-i18n:
    generated_at: "2026-07-16T16:51:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) अपने Compatibility API के माध्यम से OpenAI-संगत इन्फ़रेंस प्रदान करता है। OpenClaw, Cohere प्रदाता को बाहरी बनाने के संक्रमण के दौरान बंडल करता है और इसे आधिकारिक बाहरी Plugin के रूप में भी प्रकाशित करता है।

| गुण             | मान                                                  |
| --------------- | ---------------------------------------------------- |
| प्रदाता आईडी    | `cohere`                                   |
| Plugin          | संक्रमण के दौरान बंडल; आधिकारिक बाहरी पैकेज         |
| प्रमाणीकरण परिवेश चर | `COHERE_API_KEY`                              |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice cohere-api-key`                                 |
| प्रत्यक्ष CLI फ़्लैग | `--cohere-api-key <key>`                               |
| API             | OpenAI-संगत (`openai-completions`)                     |
| आधार URL        | `https://api.cohere.ai/compatibility/v1`                                   |
| डिफ़ॉल्ट मॉडल   | `cohere/command-a-plus-05-2026`                                   |
| संदर्भ विंडो    | 128,000 टोकन                                         |

## अंतर्निहित कैटलॉग

| मॉडल संदर्भ                         | इनपुट      | संदर्भ  | अधिकतम आउटपुट | टिप्पणियाँ                                    |
| ------------------------------------ | ----------- | ------- | ---------- | --------------------------------------------- |
| `cohere/command-a-plus-05-2026`      | टेक्स्ट, इमेज | 128,000 | 64,000     | डिफ़ॉल्ट; प्रमुख एजेंटिक और रीजनिंग मॉडल     |
| `cohere/command-a-03-2025`           | टेक्स्ट       | 256,000 | 8,000      | पिछला Command A मॉडल                          |
| `cohere/command-a-reasoning-08-2025` | टेक्स्ट       | 256,000 | 32,000     | एजेंटिक रीजनिंग और टूल का उपयोग              |
| `cohere/command-a-vision-07-2025`    | टेक्स्ट, इमेज | 128,000 | 8,000      | विज़न और दस्तावेज़ विश्लेषण; टूल उपयोग नहीं  |
| `cohere/north-mini-code-1-0`         | टेक्स्ट, इमेज | 256,000 | 64,000     | एजेंटिक कोडिंग; रीजनिंग; निःशुल्क सीमाएँ     |

रीजनिंग-सक्षम Cohere मॉडल दो Compatibility API रीजनिंग मोड का समर्थन करते हैं। OpenClaw **बंद** को `none` और प्रत्येक सक्षम चिंतन स्तर को `high` से मैप करता है। Command A Vision टूल उपयोग का समर्थन नहीं करता, इसलिए OpenClaw उस मॉडल के लिए एजेंट टूल अक्षम रखता है।

## आरंभ करें

1. Cohere वर्तमान OpenClaw पैकेजों के साथ आता है। यदि यह मौजूद नहीं है, तो बाहरी पैकेज इंस्टॉल करें और Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Cohere API कुंजी बनाएँ।
3. ऑनबोर्डिंग चलाएँ:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. पुष्टि करें कि कैटलॉग उपलब्ध है:

```bash
openclaw models list --provider cohere
```

ऑनबोर्डिंग Cohere को प्राथमिक मॉडल केवल तभी सेट करती है, जब कोई प्राथमिक मॉडल पहले से कॉन्फ़िगर न हो।

## केवल परिवेश से सेटअप

`COHERE_API_KEY` को Gateway प्रक्रिया के लिए उपलब्ध कराएँ, फिर Cohere मॉडल चुनें:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
यदि Gateway डेमन के रूप में या Docker में चलता है, तो उस सेवा के लिए `COHERE_API_KEY` सेट करें। इसे केवल इंटरैक्टिव शेल में एक्सपोर्ट करने से यह पहले से चल रहे Gateway के लिए उपलब्ध नहीं होता।
</Note>

## संबंधित

- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [मॉडल CLI](/hi/cli/models)
- [प्रदाता निर्देशिका](/hi/providers/index)
