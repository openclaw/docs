---
read_when:
    - आप अपने GPU बॉक्स से मॉडल उपलब्ध कराना चाहते हैं
    - आप LM Studio या OpenAI-संगत प्रॉक्सी को कॉन्फ़िगर कर रहे हैं
    - आपको सबसे सुरक्षित स्थानीय मॉडल मार्गदर्शन चाहिए
summary: स्थानीय LLMs पर OpenClaw चलाएँ (LM Studio, vLLM, LiteLLM, कस्टम OpenAI एंडपॉइंट्स)
title: स्थानीय मॉडल
x-i18n:
    generated_at: "2026-06-28T23:10:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

स्थानीय मॉडल संभव हैं। वे हार्डवेयर, संदर्भ आकार, और prompt-injection बचाव की अपेक्षा भी बढ़ाते हैं — छोटे या आक्रामक रूप से quantized कार्ड संदर्भ को truncate करते हैं और सुरक्षा में रिसाव करते हैं। यह पेज उच्च-स्तरीय स्थानीय stacks और custom OpenAI-compatible स्थानीय servers के लिए opinionated guide है। सबसे कम friction वाली onboarding के लिए, [LM Studio](/hi/providers/lmstudio) या [Ollama](/hi/providers/ollama) और `openclaw onboard` से शुरू करें।

उन स्थानीय servers के लिए जिन्हें केवल तब शुरू होना चाहिए जब किसी चयनित मॉडल को उनकी आवश्यकता हो, देखें
[स्थानीय मॉडल सेवाएं](/hi/gateway/local-model-services).

## हार्डवेयर floor

ऊंचा लक्ष्य रखें: आरामदायक agent loop के लिए **≥2 maxed-out Mac Studios या equivalent GPU rig (~$30k+)**। एक single **24 GB** GPU केवल हल्के prompts के लिए उच्च latency पर काम करता है। हमेशा **सबसे बड़ा / full-size variant जिसे आप host कर सकते हैं** चलाएं; छोटे या heavily quantized checkpoints prompt-injection जोखिम बढ़ाते हैं (देखें [सुरक्षा](/hi/gateway/security))।

## backend चुनें

| Backend                                              | कब उपयोग करें                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/hi/providers/ds4)                                | macOS Metal पर OpenAI-compatible tool calls के साथ स्थानीय DeepSeek V4 Flash    |
| [LM Studio](/hi/providers/lmstudio)                     | पहली बार स्थानीय setup, GUI loader, native Responses API                    |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | आप किसी अन्य model API को front करते हैं और चाहते हैं कि OpenClaw उसे OpenAI की तरह treat करे         |
| MLX / vLLM / SGLang                                  | OpenAI-compatible HTTP endpoint के साथ high-throughput self-hosted serving |
| [Ollama](/hi/providers/ollama)                          | CLI workflow, model library, hands-off systemd service                      |

जब backend इसका support करे (LM Studio करता है), Responses API (`api: "openai-responses"`) का उपयोग करें। अन्यथा Chat Completions (`api: "openai-completions"`) पर बने रहें।

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA users:** आधिकारिक Ollama Linux installer `Restart=always` के साथ systemd service enable करता है। WSL2 GPU setups पर, autostart boot के दौरान last model को reload कर सकता है और host memory को pin कर सकता है। यदि आपकी WSL2 VM Ollama enable करने के बाद बार-बार restart होती है, तो देखें [WSL2 crash loop](/hi/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## अनुशंसित: LM Studio + बड़ा स्थानीय मॉडल (Responses API)

वर्तमान में सबसे अच्छा स्थानीय stack। LM Studio में बड़ा मॉडल load करें (उदाहरण के लिए, full-size Qwen, DeepSeek, या Llama build), local server enable करें (default `http://127.0.0.1:1234`), और reasoning को final text से अलग रखने के लिए Responses API का उपयोग करें।

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

**Setup checklist**

- LM Studio install करें: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio में, **उपलब्ध सबसे बड़ा model build** download करें ("small"/heavily quantized variants से बचें), server start करें, confirm करें कि `http://127.0.0.1:1234/v1/models` उसे list करता है।
- `my-local-model` को LM Studio में दिखाए गए actual model ID से बदलें।
- model को loaded रखें; cold-load startup latency जोड़ता है।
- यदि आपका LM Studio build अलग है तो `contextWindow`/`maxTokens` adjust करें।
- WhatsApp के लिए, Responses API पर टिके रहें ताकि केवल final text भेजा जाए।

स्थानीय चलाते समय भी hosted models configured रखें; `models.mode: "merge"` का उपयोग करें ताकि fallbacks उपलब्ध रहें।

### Hybrid config: hosted primary, local fallback

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

### Local-first with hosted safety net

primary और fallback order को swap करें; वही providers block और `models.mode: "merge"` रखें ताकि local box down होने पर आप Sonnet या Opus पर fall back कर सकें।

### Regional hosting / data routing

- Hosted MiniMax/Kimi/GLM variants OpenRouter पर region-pinned endpoints (जैसे, US-hosted) के साथ भी मौजूद हैं। Anthropic/OpenAI fallbacks के लिए `models.mode: "merge"` का उपयोग करते हुए traffic को अपने चुने हुए jurisdiction में रखने के लिए वहां regional variant चुनें।
- Local-only सबसे मजबूत privacy path रहता है; hosted regional routing वह middle ground है जब आपको provider features चाहिए लेकिन data flow पर control भी चाहिए।

## अन्य OpenAI-compatible स्थानीय proxies

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy, या custom
gateways काम करते हैं यदि वे OpenAI-style `/v1/chat/completions`
endpoint expose करते हैं। जब तक backend स्पष्ट रूप से
`/v1/responses` support document न करे, Chat Completions adapter का उपयोग करें। ऊपर दिए provider block को अपने
endpoint और model ID से बदलें:

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

यदि `baseUrl` वाले custom provider पर `api` omitted है, तो OpenClaw default रूप से
`openai-completions` पर जाता है। Custom/local provider entries guarded model requests के लिए अपने exact configured
`baseUrl` origin पर trust करती हैं, जिसमें loopback, LAN, tailnet,
और private DNS hosts शामिल हैं। अन्य private origins के requests को अभी भी
`request.allowPrivateNetwork: true` चाहिए; metadata/link-local origins explicit opt-in के बिना blocked रहते हैं। exact-origin trust से opt out करने के लिए इसे `false` set करें।

`models.providers.<id>.models[].id` value provider-local है। वहां
provider prefix include न करें। उदाहरण के लिए, `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` के साथ शुरू किए गए MLX server को यह
catalog id और model ref उपयोग करना चाहिए:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

स्थानीय या proxied vision models पर `input: ["text", "image"]` set करें ताकि image
attachments agent turns में inject हों। Interactive custom-provider
onboarding common vision model IDs infer करता है और केवल unknown names के लिए पूछता है।
Non-interactive onboarding वही inference उपयोग करता है; unknown vision IDs के लिए `--custom-image-input`
या जब known-looking model आपके endpoint के पीछे text-only हो तो `--custom-text-input` उपयोग करें।

`models.mode: "merge"` रखें ताकि hosted models fallbacks के रूप में उपलब्ध रहें।
slow local या remote model servers के लिए `agents.defaults.timeoutSeconds` बढ़ाने से पहले
`models.providers.<id>.timeoutSeconds` उपयोग करें। provider timeout
केवल model HTTP requests पर apply होता है, जिसमें connect, headers, body streaming,
और total guarded-fetch abort शामिल हैं। यदि agent या run timeout कम है, तो
वह ceiling भी बढ़ाएं क्योंकि provider timeouts पूरे agent run को extend नहीं कर सकते।

<Note>
custom OpenAI-compatible providers के लिए, `apiKey: "ollama-local"` जैसे non-secret local marker को persist करना स्वीकार्य है जब `baseUrl` loopback, private LAN, `.local`, या bare hostname पर resolve होता है। OpenClaw इसे missing key report करने के बजाय valid local credential मानता है। public hostname accept करने वाले किसी भी provider के लिए real value उपयोग करें।
</Note>

local/proxied `/v1` backends के लिए behavior note:

- OpenClaw इन्हें proxy-style OpenAI-compatible routes मानता है, native
  OpenAI endpoints नहीं
- native OpenAI-only request shaping यहां apply नहीं होती: कोई
  `service_tier` नहीं, कोई Responses `store` नहीं, कोई OpenAI reasoning-compat payload
  shaping नहीं, और कोई prompt-cache hints नहीं
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
  इन custom proxy URLs पर inject नहीं किए जाते

stricter OpenAI-compatible backends के लिए compatibility notes:

- कुछ servers Chat Completions पर केवल string `messages[].content` accept करते हैं,
  structured content-part arrays नहीं। उन endpoints के लिए
  `models.providers.<provider>.models[].compat.requiresStringContent: true` set करें।
- कुछ local models standalone bracketed tool requests text के रूप में emit करते हैं, जैसे
  `[tool_name]` के बाद JSON और `[END_TOOL_REQUEST]`। OpenClaw
  उन्हें real tool calls में केवल तब promote करता है जब name turn के लिए registered
  tool से exactly match करता है; otherwise block को unsupported text माना जाता है और
  user-visible replies से hidden रखा जाता है।
- यदि कोई model JSON, XML, या ReAct-style text emit करता है जो tool call जैसा दिखता है
  लेकिन provider ने structured invocation emit नहीं किया, तो OpenClaw उसे
  text के रूप में छोड़ता है और run id, provider/model, detected pattern, और
  उपलब्ध होने पर tool name के साथ warning log करता है। इसे provider/model tool-call
  incompatibility मानें, completed tool run नहीं।
- यदि tools run होने के बजाय assistant text के रूप में दिखाई देते हैं, उदाहरण के लिए raw JSON,
  XML, ReAct syntax, या provider response में empty `tool_calls` array,
  तो पहले verify करें कि server tool-call-capable chat template/parser उपयोग कर रहा है। उन
  OpenAI-compatible Chat Completions backends के लिए जिनका parser केवल tool
  use forced होने पर काम करता है, text
  parsing पर rely करने के बजाय per-model request override set करें:

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

  इसका उपयोग केवल उन models/sessions के लिए करें जहां हर normal turn को tool call करना चाहिए।
  यह OpenClaw के default proxy value `tool_choice: "auto"` को override करता है।
  `local/my-local-model` को `openclaw models list` द्वारा दिखाए गए exact provider/model ref से बदलें।

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- यदि custom OpenAI-compatible model built-in profile से आगे OpenAI reasoning efforts accept करता है,
  तो उन्हें model compat block पर declare करें। यहां `"xhigh"` जोड़ने से `/think xhigh`, session pickers, Gateway validation, और `llm-task`
  validation उस configured provider/model ref के लिए level expose करते हैं:

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

यदि मॉडल ठीक से लोड होता है लेकिन पूरे एजेंट टर्न ठीक से व्यवहार नहीं करते, तो ऊपर से नीचे तक काम करें — पहले ट्रांसपोर्ट की पुष्टि करें, फिर सतह को सीमित करें।

1. **पुष्टि करें कि स्थानीय मॉडल स्वयं जवाब देता है।** कोई टूल नहीं, कोई एजेंट संदर्भ नहीं:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway रूटिंग की पुष्टि करें।** केवल दिया गया प्रॉम्प्ट भेजता है — ट्रांसक्रिप्ट, AGENTS बूटस्ट्रैप, कॉन्टेक्स्ट-इंजन असेंबली, टूल, और बंडल किए गए MCP सर्वर छोड़ देता है, लेकिन फिर भी Gateway रूटिंग, प्रमाणीकरण, और प्रदाता चयन का अभ्यास करता है:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **लीन मोड आज़माएँ।** यदि दोनों जाँचें पास होती हैं लेकिन वास्तविक एजेंट टर्न विकृत टूल कॉल या बहुत बड़े प्रॉम्प्ट के साथ विफल होते हैं, तो `agents.defaults.experimental.localModelLean: true` सक्षम करें। यह तीन सबसे भारी डिफ़ॉल्ट टूल (`browser`, `cron`, `message`) हटा देता है और बड़े टूल कैटलॉग को संरचित टूल खोज नियंत्रणों के पीछे डिफ़ॉल्ट कर देता है, उन रन को छोड़कर जिनमें सीधे `message` डिलीवरी सिमैंटिक्स रखना आवश्यक है। पूरी व्याख्या, इसे कब उपयोग करना है, और यह चालू है इसकी पुष्टि कैसे करें, इसके लिए [प्रायोगिक सुविधाएँ → स्थानीय मॉडल लीन मोड](/hi/concepts/experimental-features#local-model-lean-mode) देखें।

4. **अंतिम उपाय के रूप में टूल पूरी तरह अक्षम करें।** यदि लीन मोड पर्याप्त नहीं है, तो उस मॉडल प्रविष्टि के लिए `models.providers.<provider>.models[].compat.supportsTools: false` सेट करें। एजेंट तब उस मॉडल पर टूल कॉल के बिना काम करेगा।

5. **इसके आगे, बाधा अपस्ट्रीम है।** यदि लीन मोड और `supportsTools: false` के बाद भी बैकएंड केवल बड़े OpenClaw रन पर विफल होता है, तो शेष समस्या आमतौर पर अपस्ट्रीम मॉडल या सर्वर क्षमता होती है — कॉन्टेक्स्ट विंडो, GPU मेमोरी, kv-cache एविक्शन, या बैकएंड बग। उस बिंदु पर यह OpenClaw की ट्रांसपोर्ट परत नहीं है।

## समस्या निवारण

- Gateway प्रॉक्सी तक पहुँच सकता है? `curl http://127.0.0.1:1234/v1/models`।
- LM Studio मॉडल अनलोड हो गया है? फिर से लोड करें; कोल्ड स्टार्ट "हैंग" होने का आम कारण है।
- स्थानीय सर्वर `terminated`, `ECONNRESET` कहता है, या टर्न के बीच में स्ट्रीम बंद कर देता है?
  OpenClaw डायग्नोस्टिक्स में कम-कार्डिनैलिटी `model.call.error.failureKind` के साथ
  OpenClaw प्रक्रिया RSS/हीप स्नैपशॉट रिकॉर्ड करता है। LM Studio/Ollama
  मेमोरी दबाव के लिए, उस टाइमस्टैम्प को सर्वर लॉग या macOS क्रैश /
  jetsam लॉग से मिलाएँ ताकि पुष्टि हो सके कि मॉडल सर्वर मारा गया था या नहीं।
- OpenClaw कॉन्टेक्स्ट-विंडो प्रीफ्लाइट थ्रेशहोल्ड पहचानी गई मॉडल विंडो से निकालता है, या जब `agents.defaults.contextTokens` प्रभावी विंडो को कम करता है, तब अनकैप्ड मॉडल विंडो से। यह 20% से नीचे **8k** फ़्लोर के साथ चेतावनी देता है। हार्ड ब्लॉक **4k** फ़्लोर के साथ 10% थ्रेशहोल्ड का उपयोग करते हैं, और उन्हें प्रभावी कॉन्टेक्स्ट विंडो तक कैप किया जाता है ताकि बहुत बड़ा मॉडल मेटाडेटा अन्यथा मान्य उपयोगकर्ता कैप को अस्वीकार न कर सके। यदि आप उस प्रीफ्लाइट से टकराते हैं, तो सर्वर/मॉडल कॉन्टेक्स्ट सीमा बढ़ाएँ या बड़ा मॉडल चुनें।
- कॉन्टेक्स्ट त्रुटियाँ? `contextWindow` कम करें या अपनी सर्वर सीमा बढ़ाएँ।
- OpenAI-संगत सर्वर `messages[].content ... expected a string` लौटाता है?
  उस मॉडल प्रविष्टि पर `compat.requiresStringContent: true` जोड़ें।
- OpenAI-संगत सर्वर `validation.keys` लौटाता है या कहता है कि संदेश प्रविष्टियाँ केवल `role` और `content` की अनुमति देती हैं?
  उस मॉडल प्रविष्टि पर `compat.strictMessageKeys: true` जोड़ें।
- सीधे छोटे `/v1/chat/completions` कॉल काम करते हैं, लेकिन `openclaw infer model run --local`
  Gemma या किसी अन्य स्थानीय मॉडल पर विफल होता है? पहले प्रदाता URL, मॉडल रेफ, प्रमाणीकरण
  मार्कर, और सर्वर लॉग जाँचें; स्थानीय `model run` में एजेंट टूल शामिल नहीं होते।
  यदि स्थानीय `model run` सफल होता है लेकिन बड़े एजेंट टर्न विफल होते हैं, तो एजेंट
  टूल सतह को `localModelLean` या `compat.supportsTools: false` से घटाएँ।
- टूल कॉल कच्चे JSON/XML/ReAct टेक्स्ट के रूप में दिखाई देते हैं, या प्रदाता
  खाली `tool_calls` ऐरे लौटाता है? ऐसा प्रॉक्सी न जोड़ें जो सहायक
  टेक्स्ट को अंधाधुंध टूल निष्पादन में बदल दे। पहले सर्वर चैट टेम्पलेट/पार्सर ठीक करें। यदि
  मॉडल केवल तब काम करता है जब टूल उपयोग मजबूर किया जाता है, तो ऊपर प्रति-मॉडल
  `params.extra_body.tool_choice: "required"` ओवरराइड जोड़ें और उस मॉडल
  प्रविष्टि का उपयोग केवल उन सत्रों के लिए करें जहाँ हर टर्न पर टूल कॉल अपेक्षित है।
- सुरक्षा: स्थानीय मॉडल प्रदाता-पक्ष फ़िल्टर छोड़ते हैं; प्रॉम्प्ट इंजेक्शन के प्रभाव क्षेत्र को सीमित करने के लिए एजेंट को सीमित रखें और Compaction चालू रखें।

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [मॉडल फेलओवर](/hi/concepts/model-failover)
