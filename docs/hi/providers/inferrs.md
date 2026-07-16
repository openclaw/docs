---
read_when:
    - आप OpenClaw को स्थानीय Inferrs सर्वर के साथ चलाना चाहते हैं
    - आप inferrs के माध्यम से Gemma या कोई अन्य मॉडल उपलब्ध करा रहे हैं
    - आपको Inferrs के लिए सटीक OpenClaw संगतता फ़्लैग चाहिए
summary: inferrs (OpenAI-संगत स्थानीय सर्वर) के माध्यम से OpenClaw चलाएँ
title: Inferrs
x-i18n:
    generated_at: "2026-07-16T16:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) स्थानीय मॉडल को OpenAI-संगत `/v1` API के पीछे उपलब्ध कराता है। OpenClaw सामान्य `openai-completions` अडैप्टर के माध्यम से उससे संचार करता है।

| गुण                | मान                                                                  |
| ------------------ | -------------------------------------------------------------------- |
| प्रदाता आईडी       | `inferrs` (कस्टम; `models.providers.inferrs` के अंतर्गत कॉन्फ़िगर करें) |
| Plugin             | कोई नहीं — यह बंडल किया हुआ OpenClaw प्रदाता Plugin नहीं है          |
| प्रमाणीकरण env var | आवश्यक नहीं; यदि आपके inferrs सर्वर में प्रमाणीकरण नहीं है, तो कोई भी मान काम करता है |
| API                | OpenAI-संगत (`openai-completions`)                                     |
| सुझाया गया आधार URL | `http://127.0.0.1:8080/v1` (या जहाँ भी आपका inferrs सर्वर सुनता हो)          |

<Note>
  `inferrs` एक कस्टम स्व-होस्टेड OpenAI-संगत बैकएंड है, कोई समर्पित OpenClaw प्रदाता Plugin नहीं: ऑनबोर्डिंग प्रमाणीकरण विकल्प चुनने के बजाय आप इसे `models.providers.inferrs` के अंतर्गत कॉन्फ़िगर करते हैं। स्वतः खोज वाले बंडल किए गए Plugin के लिए [SGLang](/hi/providers/sglang) या [vLLM](/hi/providers/vllm) देखें।
</Note>

## आरंभ करना

<Steps>
  <Step title="किसी मॉडल के साथ inferrs शुरू करें">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="सत्यापित करें कि सर्वर तक पहुँचा जा सकता है">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="OpenClaw प्रदाता प्रविष्टि जोड़ें">
    एक स्पष्ट प्रदाता प्रविष्टि जोड़ें और अपने डिफ़ॉल्ट मॉडल को उस पर इंगित करें। नीचे दिया गया कॉन्फ़िगरेशन उदाहरण देखें।
  </Step>
</Steps>

## संपूर्ण कॉन्फ़िगरेशन उदाहरण

स्थानीय `inferrs` सर्वर पर Gemma 4:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## माँग पर स्टार्टअप

OpenClaw केवल तभी `inferrs` को स्वयं शुरू कर सकता है, जब कोई `inferrs/...` मॉडल चुना गया हो। उसी प्रदाता प्रविष्टि में `localService` जोड़ें:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` एक निरपेक्ष पथ होना चाहिए। Gateway होस्ट पर `which inferrs` चलाएँ और उस पथ का उपयोग करें। सभी फ़ील्ड का संदर्भ: [स्थानीय मॉडल सेवाएँ](/hi/gateway/local-model-services)।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="requiresStringContent क्यों महत्वपूर्ण है">
    कुछ `inferrs` Chat Completions रूट संरचित सामग्री-भाग सरणियों के बजाय केवल स्ट्रिंग `messages[].content` स्वीकार करते हैं।

    <Warning>
    यदि OpenClaw रन इस त्रुटि के साथ विफल होते हैं:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    तो मॉडल प्रविष्टि में `compat.requiresStringContent: true` सेट करें। इसके बाद OpenClaw अनुरोध भेजने से पहले केवल-पाठ सामग्री भागों को सामान्य स्ट्रिंग में समतल कर देता है।
    </Warning>

  </Accordion>

  <Accordion title="Gemma और टूल-स्कीमा संबंधी सावधानी">
    कुछ `inferrs` + Gemma संयोजन छोटे प्रत्यक्ष `/v1/chat/completions` अनुरोध स्वीकार करते हैं, लेकिन OpenClaw एजेंट-रनटाइम के संपूर्ण टर्न पर विफल हो जाते हैं। पहले टूल स्कीमा सतह को अक्षम करने का प्रयास करें:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    इससे अधिक सख्त स्थानीय बैकएंड पर प्रॉम्प्ट का दबाव कम होता है। यदि छोटे प्रत्यक्ष अनुरोध फिर भी काम करते हैं, लेकिन सामान्य OpenClaw एजेंट टर्न `inferrs` के भीतर लगातार क्रैश होते हैं, तो इसे OpenClaw परिवहन समस्या के बजाय अपस्ट्रीम मॉडल/सर्वर की सीमा मानें।

  </Accordion>

  <Accordion title="मैन्युअल स्मोक परीक्षण">
    कॉन्फ़िगर करने के बाद दोनों परतों का एक बार परीक्षण करें:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"2 + 2 कितना होता है?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "2 + 2 कितना होता है? एक छोटे वाक्य में उत्तर दें।" \
      --json
    ```

    यदि पहला कमांड काम करता है लेकिन दूसरा विफल होता है, तो नीचे समस्या निवारण देखें।

  </Accordion>

  <Accordion title="प्रॉक्सी-जैसा व्यवहार">
    चूँकि `inferrs` सामान्य `openai-completions` अडैप्टर का उपयोग करता है (`openai-responses` का नहीं), इसलिए केवल-मूल-OpenAI अनुरोध संरचना कभी लागू नहीं होती: कोई `service_tier` नहीं, कोई Responses `store` नहीं, कोई प्रॉम्प्ट-कैश संकेत नहीं और कोई OpenAI रीजनिंग-संगत पेलोड संरचना नहीं भेजी जाती।
  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="curl /v1/models विफल होता है">
    `inferrs` चल नहीं रहा है, उस तक पहुँचा नहीं जा सकता या वह आपके कॉन्फ़िगर किए गए होस्ट/पोर्ट से बाइंड नहीं है। पुष्टि करें कि सर्वर शुरू है और उस पते पर सुन रहा है।
  </Accordion>

  <Accordion title="messages[].content के लिए स्ट्रिंग अपेक्षित है">
    मॉडल प्रविष्टि में `compat.requiresStringContent: true` सेट करें (ऊपर देखें)।
  </Accordion>

  <Accordion title="प्रत्यक्ष /v1/chat/completions कॉल सफल होती हैं, लेकिन openclaw infer model run विफल होता है">
    टूल स्कीमा सतह को अक्षम करने के लिए `compat.supportsTools: false` सेट करें (ऊपर Gemma संबंधी सावधानी देखें)।
  </Accordion>

  <Accordion title="बड़े एजेंट टर्न पर inferrs अब भी क्रैश होता है">
    यदि स्कीमा त्रुटियाँ समाप्त हो गई हैं, लेकिन बड़े एजेंट टर्न पर `inferrs` अब भी क्रैश होता है, तो इसे अपस्ट्रीम `inferrs` या मॉडल की सीमा मानें। प्रॉम्प्ट का दबाव कम करें या बैकएंड/मॉडल बदलें।
  </Accordion>
</AccordionGroup>

<Tip>
सामान्य सहायता के लिए [समस्या निवारण](/hi/help/troubleshooting) और [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq) देखें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="स्थानीय मॉडल" href="/hi/gateway/local-models" icon="server">
    स्थानीय मॉडल सर्वरों के साथ OpenClaw चलाना।
  </Card>
  <Card title="स्थानीय मॉडल सेवाएँ" href="/hi/gateway/local-model-services" icon="play">
    कॉन्फ़िगर किए गए प्रदाताओं के लिए माँग पर स्थानीय मॉडल सर्वर शुरू करना।
  </Card>
  <Card title="Gateway समस्या निवारण" href="/hi/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    उन स्थानीय OpenAI-संगत बैकएंड की डीबगिंग करना जो जाँच में सफल होते हैं, लेकिन एजेंट रन में विफल रहते हैं।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    सभी प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का अवलोकन।
  </Card>
</CardGroup>
