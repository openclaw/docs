---
read_when:
    - आप OpenClaw के साथ Cohere का उपयोग करना चाहते हैं
    - आपको Cohere API कुंजी पर्यावरण चर या CLI प्रमाणीकरण विकल्प की आवश्यकता है
summary: Cohere सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Cohere
x-i18n:
    generated_at: "2026-06-28T23:57:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) अपने Compatibility API के माध्यम से OpenAI-संगत inference प्रदान करता है। OpenClaw अपने externalization संक्रमण के दौरान Cohere प्रदाता को शिप करता है और इसे Command A मॉडल कैटलॉग के साथ एक आधिकारिक बाहरी Plugin के रूप में भी प्रकाशित करता है।

| गुण             | मान                                                  |
| --------------- | ---------------------------------------------------- |
| प्रदाता आईडी    | `cohere`                                             |
| Plugin          | संक्रमण के दौरान बंडल; आधिकारिक बाहरी पैकेज          |
| Auth env var    | `COHERE_API_KEY`                                     |
| Onboarding फ़्लैग | `--auth-choice cohere-api-key`                       |
| प्रत्यक्ष CLI फ़्लैग | `--cohere-api-key <key>`                             |
| API             | OpenAI-संगत (`openai-completions`)                   |
| बेस URL         | `https://api.cohere.ai/compatibility/v1`             |
| डिफ़ॉल्ट मॉडल   | `cohere/command-a-03-2025`                           |

## शुरू करें

1. Cohere मौजूदा OpenClaw पैकेजों में शामिल है। अगर यह उपलब्ध नहीं है, तो बाहरी पैकेज इंस्टॉल करें और Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Cohere API कुंजी बनाएं।
3. onboarding चलाएं:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. पुष्टि करें कि कैटलॉग उपलब्ध है:

```bash
openclaw models list --provider cohere
```

डिफ़ॉल्ट मॉडल केवल तभी सेट किया जाता है जब कोई प्राथमिक मॉडल पहले से कॉन्फ़िगर न हो।

## केवल-environment सेटअप

`COHERE_API_KEY` को Gateway प्रक्रिया के लिए उपलब्ध कराएं, फिर Cohere मॉडल चुनें:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
अगर Gateway daemon के रूप में या Docker में चलता है, तो उस सेवा के लिए `COHERE_API_KEY` कॉन्फ़िगर करें। इसे केवल interactive shell में export करने से यह पहले से चल रहे Gateway के लिए उपलब्ध नहीं होता।
</Note>

## संबंधित

- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [मॉडल CLI](/hi/cli/models)
- [प्रदाता निर्देशिका](/hi/providers)
