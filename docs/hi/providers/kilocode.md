---
read_when:
    - आप कई LLM के लिए एक ही API कुंजी चाहते हैं
    - आप OpenClaw में Kilo Gateway के माध्यम से मॉडल चलाना चाहते हैं
summary: OpenClaw में कई मॉडलों तक पहुँचने के लिए Kilo Gateway की एकीकृत API का उपयोग करें
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-19T09:48:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0246a1a77f4265168b213e0167360e1cd89dc2ca864997f08cae5331037f9e89
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway एकल OpenAI-संगत एंडपॉइंट और API कुंजी के पीछे कई मॉडलों तक अनुरोध रूट करता है।

| गुण       | मान                                |
| -------- | ---------------------------------- |
| प्रदाता    | `kilocode`                         |
| प्रमाणीकरण | `KILOCODE_API_KEY`                 |
| API      | OpenAI-संगत                       |
| बेस URL  | `https://api.kilo.ai/api/gateway/` |

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## सेटअप

<Steps>
  <Step title="खाता बनाएँ">
    [app.kilo.ai](https://app.kilo.ai) पर जाएँ, साइन इन करें या खाता बनाएँ, फिर एक API कुंजी जनरेट करें।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    या पर्यावरण चर सीधे सेट करें:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## डिफ़ॉल्ट मॉडल और कैटलॉग

डिफ़ॉल्ट मॉडल `kilocode/kilo-auto/balanced`, Kilo Gateway का संतुलित स्मार्ट-रूटिंग स्तर है।
OpenClaw इसके लिए कार्य-से-अपस्ट्रीम-मॉडल मैपिंग प्रकाशित नहीं करता; 
`kilo-auto/balanced` के पीछे की रूटिंग का स्वामित्व Kilo Gateway के पास है।

स्टार्टअप पर OpenClaw `GET https://api.kilo.ai/api/gateway/models` से क्वेरी करता है और खोजे गए मॉडलों को
स्थिर फ़ॉलबैक कैटलॉग से पहले मर्ज करता है। स्थिर फ़ॉलबैक में केवल
`kilocode/kilo-auto/balanced` (`Auto Balanced`, `input: ["text", "image"]`, `reasoning: true`,
`contextWindow: 1000000`, `maxTokens: 65536`) शामिल हैं।

Gateway पर मौजूद किसी भी मॉडल को `kilocode/<upstream-id>` के रूप में संबोधित किया जा सकता है (उदाहरण के लिए
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`)। खोजी गई पूरी सूची देखने के लिए `/models kilocode` या
`openclaw models list --provider kilocode` चलाएँ।

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo-auto/balanced" },
    },
  },
}
```

## व्यवहार संबंधी टिप्पणियाँ

<AccordionGroup>
  <Accordion title="ट्रांसपोर्ट और संगतता">
    Kilo Gateway OpenRouter-संगत है, इसलिए यह मूल OpenAI अनुरोध संरचना के बजाय प्रॉक्सी-शैली का OpenAI-संगत अनुरोध
    पथ उपयोग करता है (कोई `store` नहीं, कोई OpenAI रीजनिंग-एफ़र्ट पेलोड नहीं)।

    - Gemini-समर्थित Kilo रेफ़रेंस प्रॉक्सी-Gemini पथ पर बने रहते हैं: OpenClaw वहाँ Gemini थॉट
      सिग्नेचर को सैनिटाइज़ करता है, लेकिन मूल Gemini रीप्ले सत्यापन या बूटस्ट्रैप पुनर्लेखन सक्षम नहीं करता।
    - अनुरोध आपकी API कुंजी से बनाए गए Bearer टोकन का उपयोग करते हैं।

  </Accordion>

  <Accordion title="स्ट्रीम रैपर और रीजनिंग">
    Kilo स्ट्रीम रैपर एक `X-KILOCODE-FEATURE` अनुरोध हेडर जोड़ता है (डिफ़ॉल्ट `openclaw`,
    `KILOCODE_FEATURE` पर्यावरण चर से ओवरराइड करें) और इसका समर्थन करने वाले
    मॉडलों के लिए रीजनिंग-एफ़र्ट पेलोड को सामान्यीकृत करता है।

    <Warning>
    `kilocode/kilo-auto/balanced` और `x-ai/*` रेफ़रेंस रीजनिंग-एफ़र्ट इंजेक्शन छोड़ देते हैं। यदि आपको रीजनिंग समर्थन चाहिए,
    तो `kilocode/anthropic/claude-sonnet-4` जैसे किसी विशिष्ट मॉडल रेफ़रेंस का उपयोग करें।
    </Warning>

  </Accordion>

  <Accordion title="समस्या निवारण">
    - यदि स्टार्टअप पर मॉडल खोज विफल हो जाती है, तो OpenClaw `kilocode/kilo-auto/balanced` वाले स्थिर कैटलॉग का फ़ॉलबैक के रूप में उपयोग करता है।
    - पुष्टि करें कि आपकी API कुंजी मान्य है और आपके Kilo खाते में वांछित मॉडल सक्षम हैं।
    - जब Gateway डेमन के रूप में चलता है, तो सुनिश्चित करें कि `KILOCODE_API_KEY` उस प्रक्रिया के लिए उपलब्ध है (उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़रेंस और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    संपूर्ण OpenClaw कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway डैशबोर्ड, API कुंजियाँ और खाता प्रबंधन।
  </Card>
</CardGroup>
