---
read_when:
    - आप OpenClaw को स्थानीय SGLang सर्वर के विरुद्ध चलाना चाहते हैं
    - आप अपने मॉडल्स के साथ OpenAI-संगत /v1 एंडपॉइंट्स चाहते हैं
summary: OpenClaw को SGLang के साथ चलाएँ (OpenAI-संगत सेल्फ-होस्टेड सर्वर)
title: SGLang
x-i18n:
    generated_at: "2026-06-29T00:02:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang खुले-वज़न मॉडलों को OpenAI-संगत HTTP API के माध्यम से सर्व करता है। OpenClaw उपलब्ध मॉडलों की स्वतः-खोज के साथ `openai-completions` प्रदाता परिवार का उपयोग करके SGLang से कनेक्ट होता है।

| गुण                       | मान                                                          |
| ------------------------- | ------------------------------------------------------------ |
| प्रदाता id                | `sglang`                                                     |
| Plugin                    | बंडल किया हुआ, `enabledByDefault: true`                      |
| प्रमाणीकरण पर्यावरण चर    | `SGLANG_API_KEY` (यदि सर्वर में प्रमाणीकरण नहीं है तो कोई भी गैर-रिक्त मान) |
| ऑनबोर्डिंग फ़्लैग         | `--auth-choice sglang`                                       |
| API                       | OpenAI-संगत (`openai-completions`)                           |
| डिफ़ॉल्ट बेस URL          | `http://127.0.0.1:30000/v1`                                  |
| डिफ़ॉल्ट मॉडल प्लेसहोल्डर | `sglang/Qwen/Qwen3-8B`                                       |
| स्ट्रीमिंग उपयोग          | हाँ (`supportsStreamingUsage: true`)                         |
| मूल्य निर्धारण            | बाहरी-मुक्त के रूप में चिह्नित (`modelPricing.external: false`) |

जब आप `SGLANG_API_KEY` के साथ ऑप्ट इन करते हैं, तो OpenClaw SGLang से उपलब्ध मॉडलों की **स्वतः-खोज** भी करता है। जब आप कस्टम SGLang बेस URL भी कॉन्फ़िगर करते हैं, तो खोज को डायनेमिक रखने के लिए `agents.defaults.models` में `sglang/*` का उपयोग करें। नीचे [मॉडल खोज (अंतर्निहित प्रदाता)](#model-discovery-implicit-provider) देखें।

## शुरू करना

<Steps>
  <Step title="SGLang शुरू करें">
    SGLang को OpenAI-संगत सर्वर के साथ लॉन्च करें। आपके बेस URL को
    `/v1` एंडपॉइंट उजागर करने चाहिए (उदाहरण के लिए `/v1/models`, `/v1/chat/completions`)। SGLang
    आमतौर पर इस पर चलता है:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API कुंजी सेट करें">
    यदि आपके सर्वर पर कोई प्रमाणीकरण कॉन्फ़िगर नहीं है, तो कोई भी मान काम करता है:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ या सीधे मॉडल सेट करें">
    ```bash
    openclaw onboard
    ```

    या मॉडल को मैन्युअल रूप से कॉन्फ़िगर करें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## मॉडल खोज (अंतर्निहित प्रदाता)

जब `SGLANG_API_KEY` सेट हो (या कोई प्रमाणीकरण प्रोफ़ाइल मौजूद हो) और आप
`models.providers.sglang` परिभाषित **नहीं** करते, तो OpenClaw यह क्वेरी करेगा:

- `GET http://127.0.0.1:30000/v1/models`

और लौटाए गए ID को मॉडल प्रविष्टियों में बदल देगा।

<Note>
यदि आप `models.providers.sglang` स्पष्ट रूप से सेट करते हैं, तो OpenClaw डिफ़ॉल्ट रूप से आपके घोषित
मॉडलों का उपयोग करता है। जब आप चाहते हैं कि OpenClaw उस कॉन्फ़िगर किए गए प्रदाता के `/models` एंडपॉइंट को क्वेरी करे और
सभी विज्ञापित SGLang मॉडलों को शामिल करे, तो `agents.defaults.models` में `"sglang/*": {}` जोड़ें।
</Note>

## स्पष्ट कॉन्फ़िगरेशन (मैन्युअल मॉडल)

स्पष्ट कॉन्फ़िगरेशन का उपयोग करें जब:

- SGLang किसी अलग होस्ट/पोर्ट पर चलता है।
- आप `contextWindow`/`maxTokens` मानों को पिन करना चाहते हैं।
- आपके सर्वर को वास्तविक API कुंजी चाहिए (या आप हेडर नियंत्रित करना चाहते हैं)।

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="प्रॉक्सी-शैली व्यवहार">
    SGLang को प्रॉक्सी-शैली वाले OpenAI-संगत `/v1` बैकएंड के रूप में माना जाता है, न कि
    मूल OpenAI एंडपॉइंट के रूप में।

    | व्यवहार | SGLang |
    |----------|--------|
    | केवल-OpenAI अनुरोध आकार देना | लागू नहीं |
    | `service_tier`, Responses `store`, प्रॉम्प्ट-कैश संकेत | भेजे नहीं जाते |
    | रीजनिंग-संगत पेलोड आकार देना | लागू नहीं |
    | छिपे हुए एट्रिब्यूशन हेडर (`originator`, `version`, `User-Agent`) | कस्टम SGLang बेस URL पर इंजेक्ट नहीं किए जाते |

  </Accordion>

  <Accordion title="समस्या निवारण">
    **सर्वर तक पहुँचा नहीं जा सकता**

    सत्यापित करें कि सर्वर चल रहा है और प्रतिक्रिया दे रहा है:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **प्रमाणीकरण त्रुटियाँ**

    यदि अनुरोध प्रमाणीकरण त्रुटियों के साथ विफल होते हैं, तो ऐसी वास्तविक `SGLANG_API_KEY` सेट करें जो
    आपके सर्वर कॉन्फ़िगरेशन से मेल खाती हो, या प्रदाता को
    `models.providers.sglang` के अंतर्गत स्पष्ट रूप से कॉन्फ़िगर करें।

    <Tip>
    यदि आप SGLang को प्रमाणीकरण के बिना चलाते हैं, तो
    `SGLANG_API_KEY` के लिए कोई भी गैर-रिक्त मान मॉडल खोज में ऑप्ट इन करने के लिए पर्याप्त है।
    </Tip>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़ और फ़ेलओवर व्यवहार को चुनना।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता प्रविष्टियों सहित पूर्ण कॉन्फ़िग स्कीमा।
  </Card>
</CardGroup>
