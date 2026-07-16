---
read_when:
    - आप किसी अन्य एप्लिकेशन में OpenClaw के मॉडल ट्रांसपोर्ट का पुनः उपयोग करना चाहते हैं
    - आप packages/ai या AI ट्रांसपोर्ट होस्ट पोर्ट बदल रहे हैं
    - आप समीक्षा कर रहे हैं कि OpenClaw रिलीज़ रूट पैकेज के अलावा npm पर क्या प्रकाशित करती है
summary: '@openclaw/ai npm पैकेज: पुन: प्रयोज्य मॉडल ट्रांसपोर्ट, पृथक रनटाइम और होस्ट नीति पोर्ट्स'
title: '@openclaw/ai पैकेज'
x-i18n:
    generated_at: "2026-07-16T17:05:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` OpenClaw की मॉडल निष्पादन परत का प्रकाशित किया जा सकने वाला लाइब्रेरी रूप है:
प्रदाता-निरपेक्ष संदेश/टूल/स्ट्रीम अनुबंध, सत्यापन, निदान,
इवेंट स्ट्रीम, एक पृथक रनटाइम रजिस्ट्री, और आठ
अंतर्निहित API परिवारों (Anthropic Messages, OpenAI Completions, OpenAI
Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative
AI, Google Vertex, Mistral Conversations) के लिए लेज़ी अडैप्टर।

यह प्रत्येक रिलीज़ पर रूट `openclaw` पैकेज के साथ प्रकाशित होता है और
उसी संस्करण पर पिन किया जाता है, साथ ही इसका अपना `npm-shrinkwrap.json` होता है ताकि इसकी ट्रांज़िटिव
निर्भरता ट्री इंस्टॉल के समय लॉक रहे। `openclaw` को इंस्टॉल करने पर
मेल खाता `@openclaw/ai` स्वचालित रूप से इंस्टॉल हो जाता है; लाइब्रेरी उपभोक्ता
OpenClaw के किसी भी एप्लिकेशन कोड के बिना सीधे इस पर निर्भर हो सकते हैं।

## त्वरित शुरुआत

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

चलाने योग्य संस्करण रिपॉज़िटरी में `examples/ai-chat` पर उपलब्ध है।

## डिज़ाइन अनुबंध

- **डिफ़ॉल्ट रूप से इंस्टेंस-स्कोप्ड।** पैकेज को इम्पोर्ट करने पर वैश्विक रूप से
  कुछ भी पंजीकृत नहीं होता। `createApiRegistry()` / `createLlmRuntime()` पृथक
  इंस्टेंस लौटाते हैं; `registerBuiltInApiProviders(registry)` एक रजिस्ट्री में
  अंतर्निहित ट्रांसपोर्ट सक्रिय करता है। प्रदाता SDK मॉड्यूल पहली बार उपयोग किए जाने पर लेज़ी रूप से लोड होते हैं।
- **होस्ट नीति इंजेक्ट की जाती है, बंडल नहीं।** अनुरोध फ़ेच सुरक्षा (उदाहरण के लिए
  SSRF नीति), टूल-परिणाम रीप्ले टेक्स्ट से सीक्रेट हटाना, OpenAI
  के स्ट्रिक्ट-टूल डिफ़ॉल्ट और निदान लॉगिंग, `configureAiTransportHost` से कॉन्फ़िगर किए गए
  `AiTransportHost` पोर्ट हैं। लाइब्रेरी के डिफ़ॉल्ट निष्क्रिय हैं;
  OpenClaw अपने स्ट्रीम फ़साड में इनके वास्तविक कार्यान्वयन इंस्टॉल करता है।
- **एक इवेंट-स्ट्रीम पहचान।** `@openclaw/ai/event-stream`, OpenClaw कोर,
  agent-core और बाहरी उपभोक्ताओं द्वारा साझा किया जाने वाला कैनॉनिकल
  `EventStream` कंस्ट्रक्टर है।
- **`internal/*` उपपथ API नहीं हैं।** वे स्वयं OpenClaw
  एप्लिकेशन के लिए मौजूद हैं और कोई semver गारंटी नहीं देते।
- प्रदाता आईडी, क्रेडेंशियल, मॉडल कैटलॉग, पुनः प्रयास और फ़ेलओवर
  एप्लिकेशन की ज़िम्मेदारियाँ बने रहते हैं। OpenClaw इस पैकेज के चारों ओर इन परतों को जोड़ता है;
  लाइब्रेरी उपभोक्ता सीधे एक `Model` ऑब्जेक्ट और विकल्प प्रदान करता है।

## उपपथ एक्सपोर्ट

| उपपथ          | सामग्री                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | अनुबंध, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | मॉडल/संदेश/टूल/स्ट्रीम प्रकार                                                |
| `./validation`   | टूल आर्ग्युमेंट सत्यापन                                                       |
| `./diagnostics`  | निदान अनुबंध                                                          |
| `./event-stream` | साझा `EventStream` कार्यान्वयन                                            |
| `./internal/*`   | OpenClaw-आंतरिक, कोई semver गारंटी नहीं                                         |
