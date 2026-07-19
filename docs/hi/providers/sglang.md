---
read_when:
    - आप OpenClaw को स्थानीय SGLang सर्वर के साथ चलाना चाहते हैं
    - आप अपने स्वयं के मॉडलों के साथ OpenAI-संगत /v1 एंडपॉइंट चाहते हैं
summary: SGLang (OpenAI-संगत स्व-होस्टेड सर्वर) के साथ OpenClaw चलाएँ
title: SGLang
x-i18n:
    generated_at: "2026-07-19T09:49:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang, OpenAI-संगत HTTP API के माध्यम से ओपन-वेट मॉडल उपलब्ध कराता है। OpenClaw उपलब्ध मॉडलों की स्वतः खोज के साथ `openai-completions` प्रोवाइडर फ़ैमिली का उपयोग करके SGLang से कनेक्ट होता है।

| प्रॉपर्टी                  | मान                                                        |
| ------------------------- | ------------------------------------------------------------ |
| प्रोवाइडर आईडी               | `sglang`                                                     |
| Plugin                    | बंडल किया गया, `enabledByDefault: true`                            |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल              | `SGLANG_API_KEY` (यदि सर्वर पर प्रमाणीकरण नहीं है, तो कोई भी गैर-रिक्त मान) |
| ऑनबोर्डिंग फ़्लैग           | `--auth-choice sglang`                                       |
| API                       | OpenAI-संगत (`openai-completions`)                     |
| डिफ़ॉल्ट बेस URL          | `http://127.0.0.1:30000/v1`                                  |
| डिफ़ॉल्ट मॉडल प्लेसहोल्डर | `sglang/Qwen/Qwen3-8B`                                       |
| स्ट्रीमिंग उपयोग           | हाँ (`supportsStreamingUsage: true`)                         |
| मूल्य निर्धारण                   | बाहरी-निःशुल्क के रूप में चिह्नित (`modelPricing.external: false`)        |

जब आप `SGLANG_API_KEY` के साथ विकल्प चुनते हैं, तब OpenClaw SGLang से उपलब्ध मॉडलों की **स्वतः खोज** भी करता है। कस्टम SGLang बेस URL कॉन्फ़िगर करते समय भी खोज को डायनेमिक बनाए रखने के लिए `agents.defaults.models` में `sglang/*` का उपयोग करें। नीचे [मॉडल खोज (अंतर्निहित प्रोवाइडर)](#model-discovery-implicit-provider) देखें।

## शुरू करना

<Steps>
  <Step title="SGLang शुरू करें">
    OpenAI-संगत सर्वर के साथ SGLang लॉन्च करें। आपके बेस URL को
    `/v1` एंडपॉइंट उपलब्ध कराने चाहिए (उदाहरण के लिए `/v1/models`, `/v1/chat/completions`)। SGLang
    आम तौर पर यहाँ चलता है:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API कुंजी सेट करें">
    यदि आपके सर्वर पर प्रमाणीकरण कॉन्फ़िगर नहीं है, तो कोई भी मान काम करेगा:

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

## मॉडल खोज (अंतर्निहित प्रोवाइडर)

जब `SGLANG_API_KEY` सेट हो (या कोई प्रमाणीकरण प्रोफ़ाइल मौजूद हो) और आप
`models.providers.sglang` परिभाषित **नहीं** करते हैं, तब OpenClaw इसे क्वेरी करता है:

- `GET http://127.0.0.1:30000/v1/models`

और लौटाई गई आईडी को मॉडल प्रविष्टियों में बदल देता है।

<Note>
यदि आप `models.providers.sglang` को स्पष्ट रूप से सेट करते हैं, तो OpenClaw डिफ़ॉल्ट रूप से आपके घोषित
मॉडलों का उपयोग करता है। जब आप चाहते हैं कि OpenClaw उस कॉन्फ़िगर किए गए प्रोवाइडर के `/models` एंडपॉइंट को क्वेरी करे और
विज्ञापित सभी SGLang मॉडल शामिल करे, तब `agents.defaults.models` में `"sglang/*": {}` जोड़ें।
</Note>

## स्पष्ट कॉन्फ़िगरेशन (मैन्युअल मॉडल)

स्पष्ट कॉन्फ़िगरेशन का उपयोग तब करें, जब:

- SGLang किसी अलग होस्ट/पोर्ट पर चलता हो।
- आप `contextWindow`/`maxTokens` मान निश्चित करना चाहते हों।
- आपके सर्वर को वास्तविक API कुंजी की आवश्यकता हो (या आप हेडर नियंत्रित करना चाहते हों)।

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
  <Accordion title="प्रॉक्सी-शैली का व्यवहार">
    SGLang को किसी नेटिव OpenAI एंडपॉइंट के बजाय प्रॉक्सी-शैली का OpenAI-संगत `/v1` बैकएंड माना जाता है।

    | व्यवहार | SGLang |
    |----------|--------|
    | केवल OpenAI के लिए अनुरोध संरचना | लागू नहीं |
    | `service_tier`, Responses `store`, प्रॉम्प्ट-कैश संकेत | भेजे नहीं जाते |
    | रीजनिंग-संगत पेलोड संरचना | लागू नहीं |
    | छिपे हुए एट्रिब्यूशन हेडर (`originator`, `version`, `User-Agent`) | कस्टम SGLang बेस URL पर इंजेक्ट नहीं किए जाते |

  </Accordion>

  <Accordion title="समस्या निवारण">
    **सर्वर पहुँच योग्य नहीं है**

    सत्यापित करें कि सर्वर चल रहा है और प्रतिक्रिया दे रहा है:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **प्रमाणीकरण त्रुटियाँ**

    यदि प्रमाणीकरण त्रुटियों के कारण अनुरोध विफल होते हैं, तो अपने सर्वर कॉन्फ़िगरेशन से मेल खाने वाली वास्तविक `SGLANG_API_KEY` सेट करें,
    या `models.providers.sglang` के अंतर्गत प्रोवाइडर को स्पष्ट रूप से कॉन्फ़िगर करें।

    <Tip>
    यदि आप SGLang को प्रमाणीकरण के बिना चलाते हैं, तो मॉडल खोज का विकल्प चुनने के लिए
    `SGLANG_API_KEY` का कोई भी गैर-रिक्त मान पर्याप्त है।
    </Tip>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रोवाइडर, मॉडल संदर्भ और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रोवाइडर प्रविष्टियों सहित संपूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
</CardGroup>
