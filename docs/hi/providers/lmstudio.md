---
read_when:
    - आप LM Studio के माध्यम से ओपन सोर्स मॉडल के साथ OpenClaw चलाना चाहते हैं
    - आप LM Studio को सेट अप और कॉन्फ़िगर करना चाहते हैं
summary: LM Studio के साथ OpenClaw चलाएँ
title: LM Studio
x-i18n:
    generated_at: "2026-07-21T16:53:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f43b4d04aad6e5edfdf224747083834ebd441aa7f91ccbf2d61de990443fc414
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio llama.cpp (GGUF) या MLX मॉडल स्थानीय रूप से GUI ऐप या हेडलेस `llmster`
डेमन के रूप में चलाता है। इंस्टॉलेशन और उत्पाद दस्तावेज़ों के लिए [lmstudio.ai](https://lmstudio.ai/) देखें।

## त्वरित शुरुआत

<Steps>
  <Step title="सर्वर इंस्टॉल और शुरू करें">
    LM Studio (डेस्कटॉप) या `llmster` (हेडलेस) इंस्टॉल करें, फिर सर्वर शुरू करें:

    ```bash
    lms server start --port 1234
    ```

    या हेडलेस डेमन चलाएँ:

    ```bash
    lms daemon up
    ```

    यदि डेस्कटॉप ऐप का उपयोग कर रहे हैं, तो मॉडल को सुचारु रूप से लोड करने के लिए JIT सक्षम करें; 
    [LM Studio JIT और TTL गाइड](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) देखें।

  </Step>
  <Step title="प्रमाणीकरण सक्षम होने पर API कुंजी सेट करें">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    यदि LM Studio प्रमाणीकरण अक्षम है, तो सेटअप के दौरान API कुंजी खाली छोड़ें। 
    [LM Studio प्रमाणीकरण](https://lmstudio.ai/docs/developer/core/authentication) देखें।

  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard
    ```

    `LM Studio` चुनें, फिर `Default model` प्रॉम्प्ट पर कोई मॉडल चुनें।

    नए निर्देशित सेटअप में, OpenClaw पहले डिफ़ॉल्ट या कॉन्फ़िगर किए गए LM Studio होस्ट पर
    `/api/v1/models` से क्वेरी करता है। किसी मौजूदा LLM को स्वचालित रूप से केवल तभी प्रस्तुत किया
    जाता है, जब LM Studio टूल प्रशिक्षण और कम-से-कम 16K प्रभावी कॉन्टेक्स्ट की सूचना देता है।
    लोड किए गए मॉडलों के लिए, लोड किए गए इंस्टेंस का कॉन्टेक्स्ट विज्ञापित अधिकतम सीमा से अधिक
    प्राथमिकता रखता है। वही CLI/macOS सेटअप क्रम रूट को सहेजने से पहले वास्तविक कम्प्लीशन से
    सत्यापित करता है। स्वचालित जाँच कभी कोई मॉडल डाउनलोड नहीं करती और केवल एम्बेडिंग वाली कैटलॉग
    प्रविष्टियों को अनदेखा करती है।

  </Step>
</Steps>

बाद में डिफ़ॉल्ट मॉडल बदलें:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio मॉडल कुंजियाँ `author/model-name` प्रारूप का उपयोग करती हैं (उदाहरण के लिए `qwen/qwen3.5-9b`);
OpenClaw मॉडल संदर्भों के आगे प्रदाता जुड़ता है: `lmstudio/qwen/qwen3.5-9b`। किसी मॉडल की सटीक कुंजी खोजने के
लिए नीचे दिया गया कमांड चलाएँ और `key` फ़ील्ड देखें:

```bash
curl http://localhost:1234/api/v1/models
```

## गैर-इंटरैक्टिव ऑनबोर्डिंग

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

या बेस URL, मॉडल और API कुंजी स्पष्ट रूप से निर्दिष्ट करें:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` में LM Studio द्वारा लौटाई गई मॉडल कुंजी दी जाती है (उदाहरण के लिए `qwen/qwen3.5-9b`),
`lmstudio/` प्रदाता उपसर्ग के बिना। प्रमाणीकृत सर्वरों के लिए `--lmstudio-api-key` पास करें
(या `LM_API_TOKEN` सेट करें); अप्रमाणीकृत सर्वरों के लिए इसे छोड़ दें और OpenClaw इसके बजाय एक
स्थानीय गैर-गोपनीय मार्कर संग्रहीत करता है। संगतता के लिए `--custom-api-key` अभी भी स्वीकार किया जाता
है, लेकिन `--lmstudio-api-key` को प्राथमिकता दी जाती है।

यह `models.providers.lmstudio` लिखता है और डिफ़ॉल्ट मॉडल को `lmstudio/<custom-model-id>` पर सेट करता है।
API कुंजी देने पर `lmstudio:default` प्रमाणीकरण प्रोफ़ाइल भी लिखी जाती है।

इंटरैक्टिव सेटअप पसंदीदा लोड कॉन्टेक्स्ट लंबाई भी पूछ सकता है और इसे कॉन्फ़िगरेशन में सहेजे गए
सभी खोजे गए मॉडलों पर लागू करता है।

## कॉन्फ़िगरेशन

### स्ट्रीमिंग उपयोग संगतता

LM Studio स्ट्रीम की गई प्रतिक्रियाओं में हमेशा OpenAI-आकार का `usage` ऑब्जेक्ट उत्सर्जित
नहीं करता। इसके बजाय OpenClaw llama.cpp-शैली के `timings.prompt_n` / `timings.predicted_n` मेटाडेटा से
टोकन संख्या पुनर्प्राप्त करता है। स्थानीय एंडपॉइंट (लूपबैक होस्ट) के रूप में निर्धारित किसी भी
OpenAI-संगत एंडपॉइंट को यही फ़ॉलबैक मिलता है, जिसमें vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
और text-generation-webui जैसे अन्य स्थानीय बैकएंड शामिल हैं।

### थिंकिंग संगतता

जब LM Studio की `/api/v1/models` खोज मॉडल-विशिष्ट रीजनिंग विकल्पों की सूचना देती है, तो OpenClaw
मॉडल संगतता मेटाडेटा में उनसे मेल खाने वाले `reasoning_effort` मान (`none`,
`minimal`, `low`, `medium`, `high`, `xhigh`)
उपलब्ध कराता है। LM Studio के कुछ बिल्ड बाइनरी UI विकल्प (`allowed_options: ["off",
"on"]`) विज्ञापित करते हैं,
लेकिन `/v1/chat/completions` पर उन शाब्दिक मानों को अस्वीकार कर देते हैं; OpenClaw अनुरोध भेजने से पहले
उस बाइनरी संरचना को छह-स्तरीय पैमाने में सामान्यीकृत करता है, जिसमें पुराने सहेजे गए कॉन्फ़िगरेशन भी
शामिल हैं जिनमें अभी भी `off`/`on` रीजनिंग मैप हैं।

### स्पष्ट कॉन्फ़िगरेशन

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
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

### प्रीलोड अक्षम करना

LM Studio जस्ट-इन-टाइम (JIT) मॉडल लोडिंग का समर्थन करता है, जो पहले अनुरोध पर मॉडल लोड करता है।
OpenClaw डिफ़ॉल्ट रूप से LM Studio के नेटिव लोड एंडपॉइंट के माध्यम से मॉडल प्रीलोड करता है, जिससे
JIT अक्षम होने पर सहायता मिलती है। इसके बजाय मॉडल जीवनचक्र का नियंत्रण LM Studio के JIT, निष्क्रिय
TTL और स्वतः-निष्कासन व्यवहार को देने के लिए OpenClaw का प्रीलोड चरण अक्षम करें:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN या टेलनेट होस्ट

LM Studio होस्ट के पहुँच योग्य पते का उपयोग करें, `/v1` बनाए रखें और सुनिश्चित करें कि
उस मशीन पर LM Studio लूपबैक से परे बाइंड किया गया है:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio` मॉडल अनुरोधों के लिए अपने कॉन्फ़िगर किए गए एंडपॉइंट पर स्वचालित रूप से भरोसा करता
है, जिसमें लूपबैक, LAN और टेलनेट होस्ट शामिल हैं (मेटाडेटा/लिंक-लोकल मूल को छोड़कर)। किसी भी
कस्टम/स्थानीय OpenAI-संगत प्रदाता प्रविष्टि को वही सटीक-मूल भरोसा मिलता है। किसी अलग निजी होस्ट या
पोर्ट पर अनुरोधों के लिए अभी भी `models.providers.<id>.request.allowPrivateNetwork: true` आवश्यक है; डिफ़ॉल्ट भरोसे से बाहर निकलने के लिए
इसे `false` पर सेट करें।

## समस्या निवारण

### LM Studio नहीं मिला

सुनिश्चित करें कि LM Studio चल रहा है:

```bash
lms server start --port 1234
```

यदि प्रमाणीकरण सक्षम है, तो `LM_API_TOKEN` भी सेट करें। सत्यापित करें कि API तक पहुँचा जा सकता है:

```bash
curl http://localhost:1234/api/v1/models
```

### प्रमाणीकरण त्रुटियाँ (HTTP 401)

- जाँचें कि `LM_API_TOKEN` LM Studio में कॉन्फ़िगर की गई कुंजी से मेल खाती है।
- [LM Studio प्रमाणीकरण](https://lmstudio.ai/docs/developer/core/authentication) देखें।
- यदि सर्वर को प्रमाणीकरण की आवश्यकता नहीं है, तो सेटअप के दौरान कुंजी खाली छोड़ें।

## संबंधित

- [मॉडल चयन](/hi/concepts/model-providers)
- [Ollama](/hi/providers/ollama)
- [स्थानीय मॉडल](/hi/gateway/local-models)
