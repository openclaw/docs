---
read_when:
    - आप OpenClaw को NovitaAI मॉडल के साथ चलाना चाहते हैं
    - आपको Novita प्रदाता की आईडी, कुंजी या एंडपॉइंट की आवश्यकता है
summary: OpenClaw के साथ NovitaAI के OpenAI-संगत API का उपयोग करें
title: NovitaAI
x-i18n:
    generated_at: "2026-07-19T09:46:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI एक होस्टेड AI अवसंरचना प्रदाता है, जिसका API OpenAI के साथ संगत है।
यह एक बंडल किए गए OpenClaw प्रदाता के रूप में उपलब्ध है (अलग से Plugin इंस्टॉल करने की आवश्यकता नहीं), इसलिए
क्रेडेंशियल सामान्य मॉडल प्रमाणीकरण प्रवाह से गुजरते हैं और मॉडल संदर्भ इस प्रकार दिखते हैं:
`novita/deepseek/deepseek-v3-0324`।

## सेटअप

[novita.ai/settings/key-management](https://novita.ai/settings/key-management) पर API कुंजी बनाएँ, फिर चलाएँ:

```bash
openclaw onboard --auth-choice novita-api-key
```

या सेट करें:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## डिफ़ॉल्ट

| सेटिंग       | मान                              |
| ------------- | ---------------------------------- |
| प्रदाता आईडी   | `novita`                           |
| उपनाम       | `novita-ai`, `novitaai`            |
| आधार URL      | `https://api.novita.ai/openai/v1`  |
| परिवेश चर       | `NOVITA_API_KEY`                   |
| डिफ़ॉल्ट मॉडल | `novita/deepseek/deepseek-v3-0324` |

## बंडल किया गया मॉडल कैटलॉग

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

यह केवल एक शुरुआती बिंदु है, लाइव कैटलॉग नहीं। आपका खाता, क्षेत्र या
Novita की वर्तमान पेशकश रूट जोड़, हटा या प्रतिबंधित कर सकती है। लंबे समय तक उपयोग होने वाला
डिफ़ॉल्ट सेट करने से पहले जाँचें:

```bash
openclaw models list --provider novita
```

## Novita कब चुनें

- OpenAI-संगत API के साथ होस्ट किए गए ओपन-वेट मॉडल की पहुँच।
- एक ही प्रदाता खाते के माध्यम से DeepSeek, Kimi, MiniMax, GLM या Qwen-परिवार के रूट।
- DeepInfra, GMI, OpenRouter या प्रत्यक्ष विक्रेता API के अतिरिक्त एक अन्य होस्टेड फ़ॉलबैक पथ।
- LM Studio, Ollama, SGLang या vLLM अवसंरचना का रखरखाव करने के बजाय प्रदाता-पक्षीय मॉडल होस्टिंग।

जब आपको विक्रेता-मूल अनुरोध पैरामीटर या सहायता अनुबंधों की आवश्यकता हो, तो प्रत्यक्ष विक्रेता प्रदाता चुनें।
जब मॉडल को आपके अपने हार्डवेयर या नेटवर्क सीमा के भीतर चलना आवश्यक हो, तो स्थानीय प्रदाता चुनें।

## समस्या निवारण

- `401`/`403`: Novita के कुंजी प्रबंधन पृष्ठ पर कुंजी सत्यापित करें और यदि संग्रहीत प्रोफ़ाइल
  पुरानी हो गई है, तो `openclaw onboard --auth-choice novita-api-key` फिर से चलाएँ।
- अज्ञात मॉडल त्रुटियाँ: `openclaw models list --provider novita` द्वारा लौटाए गए सटीक `novita/<route-id>` का उपयोग करें।
- धीमे या विफल रूट: कोई अन्य Novita मॉडल रूट आज़माएँ या ऐसे कार्यभार के लिए Novita को
  फ़ॉलबैक प्रदाता के रूप में सेट करें जो प्रदाता-विशिष्ट
  भिन्नता सहन कर सकते हैं।

## संबंधित

- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [प्रदाता निर्देशिका](/hi/providers/index)
