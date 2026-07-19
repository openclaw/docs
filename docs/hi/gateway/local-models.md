---
read_when:
    - आप अपने स्वयं के GPU बॉक्स से मॉडल सर्व करना चाहते हैं
    - आप LM Studio या OpenAI-संगत प्रॉक्सी को कनेक्ट कर रहे हैं
    - आपको सबसे सुरक्षित स्थानीय मॉडल संबंधी मार्गदर्शन चाहिए
summary: स्थानीय LLMs (LM Studio, vLLM, LiteLLM, कस्टम OpenAI एंडपॉइंट्स) पर OpenClaw चलाएँ
title: स्थानीय मॉडल
x-i18n:
    generated_at: "2026-07-19T09:25:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

स्थानीय मॉडल काम करते हैं, लेकिन वे हार्डवेयर, कॉन्टेक्स्ट आकार और प्रॉम्प्ट-इंजेक्शन सुरक्षा की अपेक्षाएँ बढ़ा देते हैं: छोटे या अत्यधिक क्वांटाइज़ किए गए मॉडल कॉन्टेक्स्ट को छोटा कर देते हैं और प्रोवाइडर-पक्षीय सुरक्षा फ़िल्टर छोड़ देते हैं। यह पेज उच्च-स्तरीय स्थानीय स्टैक और कस्टम OpenAI-संगत सर्वर के बारे में बताता है। सबसे आसान रास्ते के लिए, [LM Studio](/hi/providers/lmstudio) या [Ollama](/hi/providers/ollama) से शुरू करें और `openclaw onboard`।

उन स्थानीय सर्वर के लिए, जिन्हें केवल तभी शुरू होना चाहिए जब किसी चुने गए मॉडल को उनकी आवश्यकता हो, [स्थानीय मॉडल सेवाएँ](/hi/gateway/local-model-services) देखें।

## न्यूनतम हार्डवेयर

सहज एजेंट लूप के लिए **2+ पूर्णतः अधिकतम कॉन्फ़िगरेशन वाले Mac Studios या समकक्ष GPU रिग (~$30k+)** का लक्ष्य रखें। एक **24 GB** GPU अधिक विलंबता पर केवल हल्के प्रॉम्प्ट संभालता है। हमेशा **सबसे बड़ा / पूर्ण-आकार वाला वैरिएंट चलाएँ जिसे आप होस्ट कर सकते हैं** - छोटे या अत्यधिक क्वांटाइज़ किए गए चेकपॉइंट प्रॉम्प्ट-इंजेक्शन का जोखिम बढ़ाते हैं ([सुरक्षा](/hi/gateway/security) देखें)।

## बैकएंड चुनें

| बैकएंड                                              | इसका उपयोग कब करें                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/hi/providers/ds4)                                | OpenAI-संगत टूल कॉल के साथ macOS Metal पर स्थानीय DeepSeek V4 Flash    |
| [LM Studio](/hi/providers/lmstudio)                     | पहली बार स्थानीय सेटअप, GUI लोडर, नेटिव Responses API                    |
| LiteLLM / OAI-proxy / कस्टम OpenAI-संगत प्रॉक्सी | जब आप किसी अन्य मॉडल API को फ़्रंट करते हैं और चाहते हैं कि OpenClaw उसे OpenAI माने         |
| MLX / vLLM / SGLang                                  | OpenAI-संगत HTTP एंडपॉइंट के साथ उच्च-थ्रूपुट सेल्फ़-होस्टेड सर्विंग |
| [Ollama](/hi/providers/ollama)                          | CLI वर्कफ़्लो, मॉडल लाइब्रेरी, बिना हस्तक्षेप वाली systemd सेवा                      |

जब बैकएंड इसका समर्थन करता हो, तब `api: "openai-responses"` का उपयोग करें (LM Studio करता है)। अन्यथा `api: "openai-completions"` का उपयोग करें। यदि `baseUrl` वाले किसी कस्टम प्रोवाइडर पर `api` छोड़ दिया जाता है, तो OpenClaw का डिफ़ॉल्ट `openai-completions` होता है।

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** आधिकारिक Ollama Linux इंस्टॉलर `Restart=always` वाली systemd सेवा सक्षम करता है। WSL2 GPU सेटअप पर, ऑटोस्टार्ट बूट के दौरान अंतिम मॉडल को दोबारा लोड कर सकता है और होस्ट मेमोरी को पिन कर सकता है, जिससे VM बार-बार रीस्टार्ट होता है। [WSL2 क्रैश लूप](/hi/providers/ollama#troubleshooting) देखें।
</Warning>

## LM Studio + बड़ा स्थानीय मॉडल (Responses API)

यह वर्तमान में सबसे अच्छा स्थानीय स्टैक है। LM Studio में एक बड़ा मॉडल (पूर्ण-आकार वाला Qwen, DeepSeek या Llama बिल्ड) लोड करें, स्थानीय सर्वर सक्षम करें (डिफ़ॉल्ट `http://127.0.0.1:1234`), और रीजनिंग को अंतिम टेक्स्ट से अलग रखने के लिए Responses API का उपयोग करें।

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

सेटअप चेकलिस्ट:

- LM Studio इंस्टॉल करें: [https://lmstudio.ai](https://lmstudio.ai)
- **सबसे बड़ा उपलब्ध मॉडल बिल्ड** डाउनलोड करें ("small"/अत्यधिक क्वांटाइज़ किए गए वैरिएंट से बचें), सर्वर शुरू करें और पुष्टि करें कि `http://127.0.0.1:1234/v1/models` इसे सूचीबद्ध करता है।
- `my-local-model` को LM Studio में दिखने वाली वास्तविक मॉडल ID से बदलें।
- मॉडल को लोड रखा रहने दें; कोल्ड-लोड स्टार्टअप विलंबता बढ़ाता है।
- यदि आपका LM Studio बिल्ड अलग है, तो `contextWindow`/`maxTokens` समायोजित करें।
- WhatsApp के लिए, Responses API का ही उपयोग करें ताकि केवल अंतिम टेक्स्ट भेजा जाए।
- `models.mode: "merge"` बनाए रखें ताकि होस्ट किए गए मॉडल फ़ॉलबैक के रूप में उपलब्ध रहें।

### हाइब्रिड कॉन्फ़िगरेशन: होस्टेड प्राथमिक, स्थानीय फ़ॉलबैक

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

होस्टेड सुरक्षा विकल्प वाले स्थानीय-प्रथम सेटअप के लिए, `primary`/`fallbacks` का क्रम बदलें और वही `providers` ब्लॉक तथा `models.mode: "merge"` बनाए रखें।

### क्षेत्रीय होस्टिंग / डेटा रूटिंग

होस्ट किए गए MiniMax/Kimi/GLM वैरिएंट क्षेत्र-निर्धारित एंडपॉइंट (उदाहरण के लिए, US में होस्ट किए गए) के साथ OpenRouter पर भी उपलब्ध हैं। Anthropic/OpenAI फ़ॉलबैक के लिए `models.mode: "merge"` बनाए रखते हुए, ट्रैफ़िक को अपने चुने हुए न्यायक्षेत्र में रखने के लिए क्षेत्रीय वैरिएंट चुनें। केवल स्थानीय सेटअप अब भी गोपनीयता का सबसे मजबूत रास्ता है; जब आपको प्रोवाइडर सुविधाओं की आवश्यकता हो, लेकिन डेटा प्रवाह पर नियंत्रण भी चाहिए, तब होस्टेड क्षेत्रीय रूटिंग मध्य मार्ग है।

## अन्य OpenAI-संगत स्थानीय प्रॉक्सी

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy या कोई भी कस्टम Gateway तब काम करता है, जब वह OpenAI-शैली का `/v1/chat/completions` एंडपॉइंट उपलब्ध कराता हो। जब तक बैकएंड स्पष्ट रूप से `/v1/responses` समर्थन का दस्तावेज़ न दे, `openai-completions` का उपयोग करें।

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

कस्टम/स्थानीय प्रोवाइडर प्रविष्टियाँ सुरक्षित मॉडल अनुरोधों के लिए अपने सटीक कॉन्फ़िगर किए गए `baseUrl` ओरिजिन पर भरोसा करती हैं, जिसमें लूपबैक, LAN, टेलनेट और निजी DNS होस्ट शामिल हैं। मेटाडेटा/लिंक-लोकल ओरिजिन हमेशा अवरुद्ध रहते हैं। अन्य निजी ओरिजिन के अनुरोधों को अब भी `models.providers.<id>.request.allowPrivateNetwork: true` की आवश्यकता होती है; सटीक-ओरिजिन भरोसे से बाहर निकलने के लिए ट्रस्ट फ़्लैग को `false` पर सेट करें।

`models.providers.<id>.models[].id` प्रोवाइडर-स्थानीय है - प्रोवाइडर प्रीफ़िक्स शामिल न करें। `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` के साथ शुरू किए गए MLX सर्वर के लिए:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

स्थानीय या प्रॉक्सी किए गए विज़न मॉडल पर `input: ["text", "image"]` सेट करें, ताकि इमेज अटैचमेंट एजेंट टर्न में डाले जाएँ। इंटरैक्टिव कस्टम-प्रोवाइडर ऑनबोर्डिंग सामान्य विज़न मॉडल ID का अनुमान लगाती है और केवल अज्ञात नामों के बारे में पूछती है; नॉन-इंटरैक्टिव ऑनबोर्डिंग वही अनुमान इस्तेमाल करती है, जिसे ओवरराइड करने के लिए `--custom-image-input` / `--custom-text-input` उपलब्ध हैं।

`agents.defaults.timeoutSeconds` बढ़ाने से पहले धीमे स्थानीय/रिमोट मॉडल सर्वर के लिए `models.providers.<id>.timeoutSeconds` का उपयोग करें। प्रोवाइडर टाइमआउट केवल मॉडल HTTP अनुरोधों के लिए कनेक्शन, हेडर, बॉडी स्ट्रीमिंग और सुरक्षित फ़ेच के कुल अबॉर्ट को कवर करता है - यदि एजेंट/रन टाइमआउट कम है, तो उसे भी बढ़ाएँ, क्योंकि प्रोवाइडर टाइमआउट पूरे रन को लंबा नहीं कर सकता।

<Note>
कस्टम OpenAI-संगत प्रोवाइडर के लिए, `apiKey: "ollama-local"` जैसा गैर-गोपनीय स्थानीय मार्कर तब स्वीकार किया जाता है, जब `baseUrl` लूपबैक, निजी LAN, `.local` या किसी साधारण होस्टनाम पर रिज़ॉल्व होता है - OpenClaw इसे अनुपस्थित कुंजी की रिपोर्ट करने के बजाय एक मान्य स्थानीय क्रेडेंशियल मानता है। सार्वजनिक होस्टनाम स्वीकार करने वाले किसी भी प्रोवाइडर के लिए वास्तविक मान का उपयोग करें।
</Note>

स्थानीय/प्रॉक्सी किए गए `/v1` बैकएंड के व्यवहार संबंधी नोट:

- OpenClaw इन्हें नेटिव OpenAI एंडपॉइंट नहीं, बल्कि प्रॉक्सी-शैली के OpenAI-संगत रूट मानता है।
- केवल नेटिव OpenAI वाला अनुरोध स्वरूपण लागू नहीं होता: कोई `service_tier` नहीं, कोई Responses `store` नहीं, कोई OpenAI रीजनिंग-संगत पेलोड स्वरूपण नहीं, कोई प्रॉम्प्ट-कैश संकेत नहीं।
- छिपे हुए OpenClaw एट्रिब्यूशन हेडर (`originator`, `version`, `User-Agent`) कस्टम प्रॉक्सी URL पर इंजेक्ट नहीं किए जाते।

अधिक सख्त OpenAI-संगत बैकएंड के लिए संगतता ओवरराइड:

- **केवल-स्ट्रिंग कॉन्टेंट**: कुछ सर्वर संरचित कॉन्टेंट-पार्ट ऐरे के बजाय केवल स्ट्रिंग `messages[].content` स्वीकार करते हैं। `models.providers.<provider>.models[].compat.requiresStringContent: true` सेट करें।
- **सख्त मैसेज कुंजियाँ**: यदि सर्वर `role`/`content` से अधिक वाली मैसेज प्रविष्टियाँ अस्वीकार करता है, तो `compat.strictMessageKeys: true` सेट करें।
- **ब्रैकेट वाला टूल टेक्स्ट**: कुछ स्थानीय मॉडल स्वतंत्र ब्रैकेट वाले टूल अनुरोध टेक्स्ट के रूप में निकालते हैं, जैसे `[tool_name]`, उसके बाद JSON और `[END_TOOL_REQUEST]`। OpenClaw इन्हें वास्तविक टूल कॉल में केवल तभी बदलता है, जब नाम टर्न के लिए पंजीकृत टूल से सटीक मेल खाता हो; अन्यथा यह छिपा हुआ, असमर्थित टेक्स्ट बना रहता है।
- **असंरचित टूल-कॉल जैसा दिखने वाला टेक्स्ट**: यदि कोई मॉडल JSON/XML/ReAct-शैली का ऐसा टेक्स्ट निकालता है जो टूल कॉल जैसा दिखता है, लेकिन संरचित इनवोकेशन नहीं था, तो OpenClaw उसे टेक्स्ट ही रहने देता है और रन ID, प्रोवाइडर/मॉडल, पहचाने गए पैटर्न तथा उपलब्ध होने पर टूल नाम के साथ चेतावनी लॉग करता है। यह प्रोवाइडर/मॉडल असंगतता है, पूर्ण हुआ टूल रन नहीं।
- **टूल उपयोग को अनिवार्य करना**: यदि टूल असिस्टेंट टेक्स्ट के रूप में दिखाई देते हैं (कच्चा JSON/XML/ReAct या खाली `tool_calls` ऐरे), तो पहले पुष्टि करें कि सर्वर का चैट टेम्पलेट/पार्सर टूल कॉल का समर्थन करता है। यदि पार्सर केवल टूल उपयोग अनिवार्य होने पर काम करता है, तो प्रति मॉडल `tool_choice: "auto"` के डिफ़ॉल्ट प्रॉक्सी मान को ओवरराइड करें:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  इसका उपयोग केवल वहाँ करें जहाँ हर सामान्य टर्न को टूल कॉल करना चाहिए। `local/my-local-model` को `openclaw models list` के सटीक रेफ़रेंस से बदलें या इसे CLI से सेट करें:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **अतिरिक्त रीजनिंग प्रयास**: यदि कोई कस्टम OpenAI-संगत मॉडल अंतर्निर्मित प्रोफ़ाइल से आगे के OpenAI रीजनिंग प्रयास स्वीकार करता है, तो उन्हें मॉडल के संगतता ब्लॉक में घोषित करें। `"xhigh"` जोड़ने पर यह उस मॉडल रेफ़रेंस के लिए `/think xhigh`, सेशन चयनकर्ताओं, Gateway सत्यापन और `llm-task` सत्यापन में उपलब्ध हो जाता है:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## छोटे या अधिक सख्त बैकएंड

यदि मॉडल ठीक से लोड हो जाता है, लेकिन पूर्ण एजेंट टर्न गलत व्यवहार करते हैं, तो ऊपर से नीचे की ओर काम करें: पहले ट्रांसपोर्ट की पुष्टि करें, फिर दायरा सीमित करें।

1. **पुष्टि करें कि स्थानीय मॉडल प्रतिक्रिया देता है** - कोई टूल नहीं, कोई एजेंट संदर्भ नहीं:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway रूटिंग की पुष्टि करें** - यह केवल प्रॉम्प्ट भेजता है और ट्रांसक्रिप्ट, AGENTS बूटस्ट्रैप, कॉन्टेक्स्ट-इंजन असेंबली, टूल और बंडल किए गए MCP सर्वर छोड़ देता है, लेकिन फिर भी Gateway रूटिंग, प्रमाणीकरण और प्रोवाइडर चयन का परीक्षण करता है:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. यदि दोनों जाँच सफल हों, लेकिन वास्तविक एजेंट टर्न विकृत टूल कॉल या बहुत बड़े प्रॉम्प्ट के कारण विफल हों, तो **लीन मोड आज़माएँ**: `agents.defaults.experimental.localModelLean: true` सेट करें। जब तक स्पष्ट रूप से आवश्यक न हों, यह भारी ब्राउज़र, cron, संदेश, मीडिया-जनरेशन, वॉइस और PDF टूल हटा देता है तथा `exec` को सीधे दृश्यमान रखते हुए बड़े टूल कैटलॉग को डिफ़ॉल्ट रूप से संरचित टूल खोज नियंत्रणों के पीछे रखता है। विवरण और यह पुष्टि करने की विधि कि यह चालू है, जानने के लिए [प्रायोगिक सुविधाएँ -> स्थानीय मॉडल लीन मोड](/hi/concepts/experimental-features#local-model-lean-mode) देखें।

4. अंतिम उपाय के रूप में उस मॉडल के लिए `models.providers.<provider>.models[].compat.supportsTools: false` सेट करके **टूल पूरी तरह अक्षम करें** - इसके बाद एजेंट टूल कॉल के बिना चलता है।

5. **इसके बाद बाधा अपस्ट्रीम में है।** यदि लीन मोड और `supportsTools: false` के बाद भी बैकएंड केवल बड़े OpenClaw रन पर विफल होता है, तो शेष समस्या आम तौर पर मॉडल या सर्वर में ही होती है - कॉन्टेक्स्ट विंडो, GPU मेमोरी, kv-cache निष्कासन या बैकएंड बग - न कि OpenClaw की ट्रांसपोर्ट परत में।

## समस्या निवारण

- **Gateway प्रॉक्सी तक नहीं पहुँच पा रहा है?** `curl http://127.0.0.1:1234/v1/models`।
- **LM Studio मॉडल अनलोड हो गया है?** उसे फिर से लोड करें; कोल्ड स्टार्ट "अटकने" का एक सामान्य कारण है।
- **स्थानीय सर्वर `terminated`, `ECONNRESET` बताता है या टर्न के बीच में स्ट्रीम बंद कर देता है?** OpenClaw निदान में निम्न-कार्डिनैलिटी `model.call.error.failureKind` के साथ OpenClaw प्रक्रिया का RSS/हीप स्नैपशॉट दर्ज करता है। LM Studio/Ollama के मेमोरी दबाव के मामले में, यह पुष्टि करने के लिए कि मॉडल सर्वर समाप्त कर दिया गया था या नहीं, उस टाइमस्टैम्प का सर्वर लॉग या macOS क्रैश/jetsam लॉग से मिलान करें।
- **कॉन्टेक्स्ट त्रुटियाँ?** OpenClaw पहचानी गई मॉडल विंडो (या `agents.defaults.contextTokens` द्वारा घटाई गई कैप्ड विंडो) से कॉन्टेक्स्ट-विंडो प्रीफ्लाइट थ्रेशोल्ड प्राप्त करता है; यह 20% से कम पर **8k** न्यूनतम सीमा के साथ चेतावनी देता है और 10% से कम पर **4k** न्यूनतम सीमा के साथ पूर्णतः अवरुद्ध करता है (इसे प्रभावी कॉन्टेक्स्ट विंडो तक सीमित किया जाता है, ताकि बहुत बड़ा मॉडल मेटाडेटा किसी मान्य उपयोगकर्ता सीमा को अस्वीकार न कर सके)। `contextWindow` घटाएँ या सर्वर/मॉडल की कॉन्टेक्स्ट सीमा बढ़ाएँ।
- **`messages[].content ... expected a string`?** उस मॉडल प्रविष्टि में `compat.requiresStringContent: true` जोड़ें।
- **`validation.keys`, या "संदेश प्रविष्टियाँ केवल `role` और `content` की अनुमति देती हैं"?** उस मॉडल प्रविष्टि में `compat.strictMessageKeys: true` जोड़ें।
- **प्रत्यक्ष `/v1/chat/completions` कॉल काम करती हैं, लेकिन Gemma या किसी अन्य स्थानीय मॉडल पर `openclaw infer model run --local` विफल होता है?** पहले प्रोवाइडर URL, मॉडल रेफ़रेंस, प्रमाणीकरण मार्कर और सर्वर लॉग जाँचें - `model run` एजेंट टूल को पूरी तरह छोड़ देता है। यदि `model run` सफल होता है, लेकिन बड़े एजेंट टर्न विफल होते हैं, तो `localModelLean` या `compat.supportsTools: false` से टूल की उपलब्धता घटाएँ।
- **टूल कॉल अपरिष्कृत JSON/XML/ReAct टेक्स्ट के रूप में दिखाई देती हैं या प्रोवाइडर एक खाली `tool_calls` ऐरे लौटाता है?** ऐसा प्रॉक्सी न जोड़ें जो बिना विवेक के असिस्टेंट टेक्स्ट को टूल निष्पादन में बदल दे - पहले सर्वर का चैट टेम्पलेट/पार्सर ठीक करें। यदि मॉडल केवल तब काम करता है जब टूल का उपयोग अनिवार्य किया जाता है, तो ऊपर दिया गया `params.extra_body.tool_choice: "required"` ओवरराइड जोड़ें और उस मॉडल प्रविष्टि का उपयोग केवल उन सत्रों के लिए करें जहाँ प्रत्येक टर्न में टूल कॉल अपेक्षित हो।
- **सुरक्षा**: स्थानीय मॉडल प्रोवाइडर-पक्ष के फ़िल्टर छोड़ देते हैं। प्रॉम्प्ट-इंजेक्शन के प्रभाव-क्षेत्र को सीमित करने के लिए एजेंटों का दायरा संकीर्ण रखें और Compaction चालू रखें।

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [मॉडल फ़ेलओवर](/hi/concepts/model-failover)
