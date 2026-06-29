---
read_when:
    - आप बिना स्थानीय Ollama सर्वर के hosted Ollama मॉडल का उपयोग करना चाहते हैं
    - आपको ollama-cloud प्रदाता आईडी, कुंजी, या एंडपॉइंट की आवश्यकता है
summary: OpenClaw के साथ सीधे Ollama Cloud का उपयोग करें
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-29T00:00:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud, Ollama का होस्टेड मॉडल API है। यह OpenClaw को स्थानीय Ollama सर्वर इंस्टॉल किए बिना या स्थानीय Ollama ऐप को क्लाउड मोड में साइन इन किए बिना Ollama-होस्टेड
मॉडल सीधे कॉल करने देता है। Provider id `ollama-cloud` और
`ollama-cloud/kimi-k2.6` जैसे model refs का उपयोग करें।

यह पेज सीधे केवल-क्लाउड रूटिंग के लिए है। Provider, Ollama की मूल
`/api/chat` शैली का उपयोग करता है, OpenAI-संगत `/v1` रूट का नहीं। OpenClaw इसे
अलग provider id के रूप में रजिस्टर करता है, ताकि केवल-क्लाउड क्रेडेंशियल, लाइव कैटलॉग डिस्कवरी, और
मॉडल चयन स्थानीय `ollama` होस्ट के साथ मिश्रित न हों।

जब आपको केवल-क्लाउड रूटिंग चाहिए, तब इस पेज का उपयोग करें। स्थानीय Ollama, हाइब्रिड
क्लाउड-प्लस-लोकल रूटिंग, embeddings, और कस्टम होस्ट विवरण के लिए,
[Ollama](/hi/providers/ollama) देखें।

## सेटअप

[ollama.com/settings/keys](https://ollama.com/settings/keys) पर Ollama Cloud API कुंजी बनाएं, फिर चलाएं:

```bash
openclaw onboard --auth-choice ollama-cloud
```

या सेट करें:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## डिफ़ॉल्ट

- Provider: `ollama-cloud`
- आधार URL: `https://ollama.com`
- Env var: `OLLAMA_API_KEY`
- API शैली: Ollama मूल `/api/chat`
- उदाहरण मॉडल: `ollama-cloud/kimi-k2.6`

## Ollama Cloud कब चुनें

- आप स्थानीय रूप से `ollama serve` चलाए बिना होस्टेड Ollama मॉडल चाहते हैं।
- आप वही मूल Ollama चैट API आकार चाहते हैं जिसे OpenClaw स्थानीय
  Ollama के लिए उपयोग करता है, लेकिन `https://ollama.com` की ओर निर्देशित।
- आप उन मॉडलों के लिए सरल क्लाउड पथ चाहते हैं जो पहले से Ollama के होस्टेड
  कैटलॉग में हैं।
- आपको स्थानीय मॉडल pulls, स्थानीय GPU नियंत्रण, या केवल-LAN inference की आवश्यकता नहीं है।

जब आप साइन-इन किए हुए Ollama होस्ट के माध्यम से केवल-स्थानीय या
क्लाउड-प्लस-लोकल रूटिंग चाहते हैं, तो इसके बजाय [Ollama](/hi/providers/ollama) का उपयोग करें। जब आपको `/v1/chat/completions`
semantics या provider-specific OpenAI-style सुविधाओं की आवश्यकता हो, तो इसके बजाय
OpenAI-संगत provider का उपयोग करें।

## मॉडल

OpenClaw लाइव होस्टेड कैटलॉग से Ollama Cloud मॉडल खोजता है। सामान्यतः
उपलब्ध होस्टेड ids में शामिल हैं:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

अपने मौजूदा होस्टेड कैटलॉग से model id का उपयोग करें:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Model ids क्लाउड कैटलॉग ids हैं, स्थानीय pull नाम नहीं। यदि कोई मॉडल नाम
स्थानीय Ollama होस्ट में काम करता है, लेकिन होस्टेड कैटलॉग में अनुपस्थित है, तो उसके बजाय उस स्थानीय होस्ट के साथ `ollama`
provider का उपयोग करें।

## लाइव परीक्षण

Ollama Cloud API-key smoke tests के लिए, Ollama live test को होस्टेड
endpoint पर निर्देशित करें और अपने मौजूदा कैटलॉग से मॉडल चुनें:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

क्लाउड smoke text, native stream, और web search चलाता है। यह
`https://ollama.com` के लिए डिफ़ॉल्ट रूप से embeddings छोड़ देता है क्योंकि Ollama Cloud API कुंजियां
`/api/embed` को authorize नहीं कर सकती हैं।

## समस्या निवारण

- `Set OLLAMA_API_KEY` त्रुटियां: वास्तविक cloud API key दें। स्थानीय
  `ollama-local` marker केवल स्थानीय या निजी Ollama hosts के लिए है।
- अज्ञात मॉडल त्रुटियां: `openclaw models list --provider ollama-cloud` चलाएं और
  होस्टेड model id को ठीक-ठीक कॉपी करें।
- कस्टम Ollama hosts पर tool-call या raw JSON समस्याएं: जांचें कि कहीं आप गलती से
  OpenAI-संगत `/v1` URL का उपयोग तो नहीं कर रहे। Ollama routes को
  बिना `/v1` suffix के native base URL का उपयोग करना चाहिए।

## संबंधित

- [Ollama](/hi/providers/ollama)
- [मॉडल providers](/hi/concepts/model-providers)
- [सभी providers](/hi/providers/index)
