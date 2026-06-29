---
read_when:
    - आप चाहते हैं कि OpenClaw स्थानीय मॉडल सर्वर केवल तब शुरू करे जब उसका मॉडल चुना गया हो
    - आप ds4, inferrs, vLLM, llama.cpp, MLX, या कोई अन्य OpenAI-संगत स्थानीय सर्वर चलाते हैं
    - आपको स्थानीय प्रदाताओं के लिए कोल्ड स्टार्ट, तैयारी और निष्क्रिय शटडाउन नियंत्रित करने की आवश्यकता है
summary: मांग पर OpenClaw मॉडल अनुरोधों से पहले स्थानीय मॉडल सर्वर शुरू करें
title: स्थानीय मॉडल सेवाएँ
x-i18n:
    generated_at: "2026-06-28T23:09:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` OpenClaw को मांग पर प्रदाता-स्वामित्व वाला स्थानीय
मॉडल सर्वर शुरू करने देता है। यह प्रदाता-स्तर का कॉन्फ़िग है: जब चयनित मॉडल
उस प्रदाता से संबंधित होता है, OpenClaw सेवा की जांच करता है, अगर
एंडपॉइंट बंद हो तो प्रक्रिया शुरू करता है, तैयार होने की प्रतीक्षा करता है, फिर मॉडल अनुरोध भेजता है।

इसे उन स्थानीय सर्वरों के लिए उपयोग करें जिन्हें पूरे दिन चलाए रखना महंगा है, या उन
मैनुअल सेटअप के लिए जहां मॉडल चयन ही बैकएंड को चालू करने के लिए पर्याप्त होना चाहिए।

## यह कैसे काम करता है

1. मॉडल अनुरोध किसी कॉन्फ़िग किए गए प्रदाता पर रिज़ॉल्व होता है।
2. अगर उस प्रदाता में `localService` है, तो OpenClaw `healthUrl` की जांच करता है।
3. अगर जांच सफल होती है, तो OpenClaw मौजूदा सर्वर का उपयोग करता है।
4. अगर जांच विफल होती है, तो OpenClaw `args` के साथ `command` शुरू करता है।
5. OpenClaw `readyTimeoutMs` समाप्त होने तक तैयारी की पोलिंग करता है।
6. मॉडल अनुरोध सामान्य प्रदाता ट्रांसपोर्ट के जरिए भेजा जाता है।
7. अगर OpenClaw ने प्रक्रिया शुरू की है और `idleStopMs` धनात्मक है, तो अंतिम इन-फ्लाइट
   अनुरोध के इतने समय तक निष्क्रिय रहने के बाद प्रक्रिया रोक दी जाती है।

OpenClaw इसके लिए launchd, systemd, Docker, या कोई daemon इंस्टॉल नहीं करता। सर्वर
उस OpenClaw प्रक्रिया की चाइल्ड प्रक्रिया होता है जिसे सबसे पहले इसकी जरूरत पड़ी।

## कॉन्फ़िग संरचना

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## फ़ील्ड

- `command`: निरपेक्ष executable पथ। Shell lookup उपयोग नहीं किया जाता।
- `args`: प्रक्रिया arguments। कोई shell expansion, pipes, globbing, या quoting
  नियम लागू नहीं किए जाते।
- `cwd`: प्रक्रिया के लिए वैकल्पिक working directory।
- `env`: OpenClaw प्रक्रिया environment पर मर्ज किए गए वैकल्पिक environment variables।
- `healthUrl`: readiness URL। अगर छोड़ा गया हो, तो OpenClaw `baseUrl` में `/models` जोड़ता है,
  इसलिए `http://127.0.0.1:8000/v1` बन जाता है
  `http://127.0.0.1:8000/v1/models`।
- `readyTimeoutMs`: startup readiness deadline। डिफ़ॉल्ट: `120000`।
- `idleStopMs`: OpenClaw द्वारा शुरू की गई प्रक्रियाओं के लिए idle shutdown delay। `0` या
  छोड़े जाने पर प्रक्रिया OpenClaw के बाहर निकलने तक जीवित रहती है।

## Inferrs उदाहरण

Inferrs एक कस्टम OpenAI-संगत `/v1` बैकएंड है, इसलिए वही स्थानीय सेवा
API `inferrs` प्रदाता प्रविष्टि के साथ काम करता है।

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
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

OpenClaw चला रही मशीन पर `which inferrs` के परिणाम से `command` बदलें।

## ds4 उदाहरण

पूरे सेटअप, context sizing मार्गदर्शन, और सत्यापन कमांड के लिए,
[ds4](/hi/providers/ds4) देखें।

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

## संचालन संबंधी नोट्स

- एक OpenClaw प्रक्रिया उस चाइल्ड को प्रबंधित करती है जिसे उसने शुरू किया। दूसरी OpenClaw प्रक्रिया
  जो उसी health URL को पहले से live देखती है, उसे अपनाए बिना पुनः उपयोग करेगी।
- Startup को प्रति प्रदाता command और argument set क्रमबद्ध किया जाता है, इसलिए समान
  कॉन्फ़िग के लिए समवर्ती अनुरोध duplicate servers spawn नहीं करते।
- सक्रिय streaming responses एक lease रखती हैं; idle shutdown तब तक प्रतीक्षा करता है जब तक response
  body handling पूरी नहीं हो जाती।
- धीमे स्थानीय प्रदाताओं पर `timeoutSeconds` उपयोग करें ताकि cold starts और लंबे generations
  डिफ़ॉल्ट model request timeout से न टकराएं।
- अगर आपका सर्वर readiness को `/v1/models` के अलावा कहीं और expose करता है, तो explicit `healthUrl` उपयोग करें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Local models" href="/hi/gateway/local-models" icon="server">
    स्थानीय मॉडल सेटअप, प्रदाता विकल्प, और सुरक्षा मार्गदर्शन।
  </Card>
  <Card title="Inferrs" href="/hi/providers/inferrs" icon="cpu">
    OpenClaw को inferrs OpenAI-संगत स्थानीय सर्वर के जरिए चलाएं।
  </Card>
</CardGroup>
