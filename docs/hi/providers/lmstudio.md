---
read_when:
    - आप LM Studio के माध्यम से मुक्त-स्रोत मॉडलों के साथ OpenClaw चलाना चाहते हैं
    - आप LM Studio को सेट अप और कॉन्फ़िगर करना चाहते हैं
summary: OpenClaw को LM Studio के साथ चलाएँ
title: LM Studio
x-i18n:
    generated_at: "2026-06-29T00:00:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio अपने हार्डवेयर पर open-weight मॉडल चलाने के लिए एक अनुकूल लेकिन शक्तिशाली ऐप है। यह आपको llama.cpp (GGUF) या MLX मॉडल (Apple Silicon) चलाने देता है। यह GUI पैकेज या headless daemon (`llmster`) में आता है। उत्पाद और सेटअप दस्तावेज़ों के लिए, [lmstudio.ai](https://lmstudio.ai/) देखें।

## तुरंत शुरू करें

1. LM Studio (desktop) या `llmster` (headless) इंस्टॉल करें, फिर local server शुरू करें:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. server शुरू करें

सुनिश्चित करें कि आप या तो desktop app शुरू करें या निम्न कमांड का उपयोग करके daemon चलाएँ:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

यदि आप app का उपयोग कर रहे हैं, तो सहज अनुभव के लिए सुनिश्चित करें कि JIT सक्षम है। [LM Studio JIT और TTL गाइड](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) में अधिक जानें।

3. यदि LM Studio authentication सक्षम है, तो `LM_API_TOKEN` सेट करें:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

यदि LM Studio authentication अक्षम है, तो interactive OpenClaw setup के दौरान API key खाली छोड़ सकते हैं।

LM Studio auth setup विवरणों के लिए, [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) देखें।

4. onboarding चलाएँ और `LM Studio` चुनें:

```bash
openclaw onboard
```

5. onboarding में, अपना LM Studio model चुनने के लिए `Default model` prompt का उपयोग करें।

आप इसे बाद में भी सेट या बदल सकते हैं:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model keys `author/model-name` प्रारूप का पालन करती हैं (उदा. `qwen/qwen3.5-9b`)। OpenClaw
model refs provider नाम पहले जोड़ते हैं: `lmstudio/qwen/qwen3.5-9b`। आप किसी model की सटीक key
`curl http://localhost:1234/api/v1/models` चलाकर और `key` field देखकर पा सकते हैं।

## Non-interactive onboarding

जब आप setup को script करना चाहते हों (CI, provisioning, remote bootstrap), तब non-interactive onboarding का उपयोग करें:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

या base URL, model, और वैकल्पिक API key निर्दिष्ट करें:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` LM Studio द्वारा लौटाई गई model key लेता है (उदा. `qwen/qwen3.5-9b`), बिना
`lmstudio/` provider prefix के।

authenticated LM Studio servers के लिए, `--lmstudio-api-key` पास करें या `LM_API_TOKEN` सेट करें।
unauthenticated LM Studio servers के लिए, key छोड़ दें; OpenClaw एक local non-secret marker संग्रहीत करता है।

compatibility के लिए `--custom-api-key` समर्थित रहता है, लेकिन LM Studio के लिए `--lmstudio-api-key` को प्राथमिकता दी जाती है।

यह `models.providers.lmstudio` लिखता है और default model को
`lmstudio/<custom-model-id>` पर सेट करता है। जब आप API key प्रदान करते हैं, तो setup
`lmstudio:default` auth profile भी लिखता है।

Interactive setup वैकल्पिक preferred load context length के लिए prompt कर सकता है और इसे config में सहेजे गए खोजे गए LM Studio models पर लागू करता है।
LM Studio plugin config model requests के लिए configured LM Studio endpoint पर भरोसा करता है, जिसमें loopback, LAN, और tailnet hosts शामिल हैं। Metadata/link-local origins के लिए फिर भी स्पष्ट opt-in आवश्यक है। आप `models.providers.lmstudio.request.allowPrivateNetwork: false` सेट करके opt out कर सकते हैं।

## Configuration

### Streaming usage compatibility

LM Studio streaming-usage compatible है। जब यह OpenAI-shaped
`usage` object emit नहीं करता, तो OpenClaw इसके बजाय llama.cpp-style
`timings.prompt_n` / `timings.predicted_n` metadata से token counts recover करता है।

इन OpenAI-compatible local backends पर भी वही streaming usage behavior लागू होता है:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Thinking compatibility

जब LM Studio का `/api/v1/models` discovery model-specific reasoning
options रिपोर्ट करता है, तो OpenClaw model compat metadata में matching OpenAI-compatible `reasoning_effort`
values expose करता है। मौजूदा LM Studio builds binary
UI options जैसे `allowed_options: ["off", "on"]` advertise कर सकते हैं, जबकि वे values
`/v1/chat/completions` पर reject करते हैं; OpenClaw requests भेजने से पहले उस binary discovery shape को
`none`, `minimal`, `low`, `medium`, `high`, और `xhigh` में normalize करता है।
पुराना saved LM Studio config जिसमें `off`/`on` reasoning maps हैं,
catalog load होने पर उसी तरह normalize किया जाता है।

### Explicit configuration

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

## समस्या निवारण

### LM Studio detected नहीं हुआ

सुनिश्चित करें कि LM Studio चल रहा है। यदि authentication सक्षम है, तो `LM_API_TOKEN` भी सेट करें:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API accessible है या नहीं सत्यापित करें:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentication errors (HTTP 401)

यदि setup HTTP 401 रिपोर्ट करता है, तो अपनी API key सत्यापित करें:

- जाँचें कि `LM_API_TOKEN` LM Studio में configured key से मेल खाता है।
- LM Studio auth setup विवरणों के लिए, [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) देखें।
- यदि आपके server को authentication की आवश्यकता नहीं है, तो setup के दौरान key खाली छोड़ दें।

### Just-in-time model loading

LM Studio just-in-time (JIT) model loading का समर्थन करता है, जहाँ models पहली request पर load होते हैं। OpenClaw default रूप से LM Studio के native load endpoint के माध्यम से models preload करता है, जो JIT disabled होने पर मदद करता है। LM Studio के JIT, idle TTL, और auto-evict behavior को model lifecycle संभालने देने के लिए, OpenClaw का preload step disabled करें:

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

### LAN या tailnet LM Studio host

LM Studio host का reachable address उपयोग करें, `/v1` बनाए रखें, और सुनिश्चित करें कि उस machine पर LM Studio loopback से आगे bound है:

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

`lmstudio` guarded model requests के लिए अपने configured local/private endpoint पर automatically trust करता है। Custom/local OpenAI-compatible provider entries भी अपने exact configured `baseUrl` origin पर trust करती हैं, metadata/link-local origins को छोड़कर; अलग private ports या destinations के लिए requests को अभी भी `models.providers.<id>.request.allowPrivateNetwork: true` चाहिए। exact-origin trust से opt out करने के लिए `models.providers.<id>.request.allowPrivateNetwork: false` सेट करें।

## संबंधित

- [मॉडल चयन](/hi/concepts/model-providers)
- [Ollama](/hi/providers/ollama)
- [स्थानीय मॉडल](/hi/gateway/local-models)
