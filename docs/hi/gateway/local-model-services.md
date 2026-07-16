---
read_when:
    - आप चाहते हैं कि OpenClaw किसी स्थानीय मॉडल सर्वर को केवल तभी शुरू करे, जब उसके मॉडल या एम्बेडिंग प्रदाता का चयन किया गया हो
    - आप ds4, inferrs, vLLM, llama.cpp, MLX या कोई अन्य OpenAI-संगत स्थानीय सर्वर चलाते हैं
    - आपको स्थानीय प्रदाताओं के लिए कोल्ड स्टार्ट, तत्परता और निष्क्रियता पर शटडाउन को नियंत्रित करना होगा
summary: OpenClaw मॉडल और एम्बेडिंग अनुरोधों से पहले आवश्यकतानुसार स्थानीय मॉडल सर्वर शुरू करें
title: स्थानीय मॉडल सेवाएँ
x-i18n:
    generated_at: "2026-07-16T14:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` आवश्यकता पड़ने पर प्रदाता-स्वामित्व वाला स्थानीय मॉडल सर्वर शुरू करता है। जब कोई मॉडल या एम्बेडिंग अनुरोध उस प्रदाता को चुनता है, तो OpenClaw स्वास्थ्य एंडपॉइंट की जाँच करता है, प्रक्रिया बंद होने पर उसे शुरू करता है, तैयार होने की प्रतीक्षा करता है और फिर अनुरोध भेजता है। महँगे स्थानीय सर्वरों को पूरे दिन चालू रखने से बचने के लिए इसका उपयोग करें।

## यह कैसे काम करता है

1. कोई मॉडल या एम्बेडिंग अनुरोध कॉन्फ़िगर किए गए प्रदाता पर रिज़ॉल्व होता है।
2. यदि उस प्रदाता में `localService` है, तो OpenClaw `healthUrl` की जाँच करता है।
3. जाँच सफल होने पर OpenClaw पहले से चल रहे सर्वर का उपयोग करता है।
4. जाँच विफल होने पर OpenClaw `command` को `args` के साथ शुरू करता है।
5. OpenClaw, `readyTimeoutMs` की अवधि समाप्त होने तक स्वास्थ्य एंडपॉइंट को पोल करता है।
6. अनुरोध सामान्य मॉडल या एम्बेडिंग ट्रांसपोर्ट से होकर जाता है।
7. यदि OpenClaw ने प्रक्रिया शुरू की है और `idleStopMs` सेट है, तो अंतिम प्रगतिरत अनुरोध के उतनी देर निष्क्रिय रहने के बाद वह प्रक्रिया रोक देता है।

OpenClaw इसके लिए launchd, systemd, Docker या कोई डेमन इंस्टॉल नहीं करता। सर्वर उस OpenClaw प्रक्रिया की सामान्य चाइल्ड प्रक्रिया होता है जिसे सबसे पहले इसकी आवश्यकता पड़ी थी।

हर कॉन्फ़िगर किए गए प्रदाता और कमांड/आर्ग्युमेंट/पर्यावरण सेट के लिए स्टार्टअप क्रमबद्ध होता है, इसलिए एक ही सेवा के लिए समवर्ती चैट और एम्बेडिंग अनुरोध डुप्लिकेट सर्वर शुरू नहीं करते। प्रतिक्रिया प्रबंधन पूरा होने तक प्रत्येक अनुरोध अपना अलग लीज़ बनाए रखता है, इसलिए निष्क्रियता के कारण शटडाउन हर प्रगतिरत मॉडल और एम्बेडिंग अनुरोध की प्रतीक्षा करता है। कॉन्फ़िगर किए गए प्रदाता उपनाम अलग बने रहते हैं: दो उपनाम अलग-अलग GPU होस्ट को इंगित कर सकते हैं और फिर भी एक ही Ollama, LM Studio या OpenAI-संगत अडैप्टर आईडी में समाहित नहीं होते।

यदि किसी अन्य OpenClaw प्रक्रिया के पास उसी `healthUrl` पर पहले से स्वस्थ सर्वर है, तो यह प्रक्रिया उसे अपनाए बिना पुनः उपयोग करती है (प्रत्येक प्रक्रिया केवल उसी चाइल्ड को प्रबंधित करती है जिसे उसने स्वयं शुरू किया हो)। स्टार्टअप और एग्ज़िट लॉग में समय और एग्ज़िट विवरण के साथ सीमित तथा संपादित चाइल्ड-आउटपुट टेल शामिल होते हैं; कॉन्फ़िगर किए गए पर्यावरण मान कभी उत्सर्जित नहीं किए जाते।

## कॉन्फ़िगरेशन संरचना

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

प्रदाता प्रविष्टि पर `timeoutSeconds` सेट करें (`localService` पर नहीं), ताकि धीमे कोल्ड स्टार्ट और लंबे जनरेशन डिफ़ॉल्ट मॉडल अनुरोध टाइमआउट तक न पहुँचें। जब भी आपका सर्वर बेस URL पर `/models` के अलावा कहीं और तत्परता उपलब्ध कराता हो, तब स्पष्ट `healthUrl` सेट करें।

## फ़ील्ड

| फ़ील्ड            | आवश्यक | विवरण                                                                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | हाँ      | एक्ज़ीक्यूटेबल का निरपेक्ष पथ। शेल PATH में खोज नहीं होती।                                                                                      |
| `args`           | नहीं       | प्रक्रिया के आर्ग्युमेंट। कोई शेल विस्तार, पाइप, ग्लॉबिंग या उद्धरण नहीं।                                                                  |
| `cwd`            | नहीं       | प्रक्रिया की कार्यशील डायरेक्टरी।                                                                                                   |
| `env`            | नहीं       | OpenClaw प्रक्रिया के पर्यावरण पर मर्ज किए जाने वाले पर्यावरण चर।                                                                  |
| `healthUrl`      | नहीं       | तत्परता URL। डिफ़ॉल्ट रूप से `baseUrl`, जिसके अंत में `/models` जोड़ा जाता है (`http://127.0.0.1:8000/v1` से `http://127.0.0.1:8000/v1/models` बनता है)। |
| `readyTimeoutMs` | नहीं       | स्टार्टअप तत्परता की समय-सीमा। डिफ़ॉल्ट: `120000`।                                                                                       |
| `idleStopMs`     | नहीं       | OpenClaw द्वारा शुरू की गई प्रक्रिया के लिए निष्क्रिय शटडाउन विलंब। `0` या इसे न देना, OpenClaw के बंद होने तक प्रक्रिया को चालू रखता है।                             |

## Inferrs उदाहरण

Inferrs एक कस्टम OpenAI-संगत `/v1` बैकएंड है, इसलिए वही `localService` API किसी `inferrs` प्रदाता प्रविष्टि के साथ काम करता है:

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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

`command` को OpenClaw चलाने वाली मशीन पर `which inferrs` के परिणाम से बदलें। Inferrs का पूरा सेटअप: [Inferrs](/hi/providers/inferrs)।

## ds4 उदाहरण

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

पूरा सेटअप, कॉन्टेक्स्ट आकार निर्धारण और सत्यापन कमांड: [ds4](/hi/providers/ds4)।

## संबंधित

<CardGroup cols={2}>
  <Card title="स्थानीय मॉडल" href="/hi/gateway/local-models" icon="server">
    स्थानीय मॉडल सेटअप, प्रदाता विकल्प और सुरक्षा मार्गदर्शन।
  </Card>
  <Card title="Inferrs" href="/hi/providers/inferrs" icon="cpu">
    OpenClaw को inferrs के OpenAI-संगत स्थानीय सर्वर के माध्यम से चलाएँ।
  </Card>
</CardGroup>
