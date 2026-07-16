---
read_when:
    - आप स्थानीय Ollama सर्वर के बिना होस्ट किए गए Ollama मॉडल का उपयोग करना चाहते हैं
    - आपको ollama-cloud प्रदाता आईडी, कुंजी या एंडपॉइंट चाहिए
summary: OpenClaw के साथ सीधे Ollama Cloud का उपयोग करें
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-16T16:58:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud, Ollama का होस्ट किया गया मॉडल API है। `ollama-cloud` प्रदाता इसे
बिना किसी स्थानीय Ollama सर्वर और क्लाउड मोड में साइन इन किए हुए किसी स्थानीय Ollama ऐप के,
Ollama के मूल `/api/chat` API पर सीधे `https://ollama.com` पर कॉल करता है। `ollama-cloud/kimi-k2.6`
जैसे मॉडल संदर्भों का उपयोग करें।

OpenClaw, `ollama-cloud` को अपने स्वयं के प्रदाता आईडी के रूप में पंजीकृत करता है, ताकि केवल-क्लाउड
क्रेडेंशियल, लाइव कैटलॉग खोज और मॉडल चयन किसी स्थानीय `ollama` होस्ट के साथ मिश्रित न हों।
स्थानीय Ollama, हाइब्रिड क्लाउड-प्लस-स्थानीय रूटिंग, एम्बेडिंग और कस्टम होस्ट विवरणों के लिए,
[Ollama](/hi/providers/ollama) देखें।

## सेटअप

[ollama.com/settings/keys](https://ollama.com/settings/keys) पर Ollama Cloud API कुंजी बनाएँ, फिर चलाएँ:

```bash
openclaw onboard --auth-choice ollama-cloud
```

या इसे सेट करें:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

गैर-इंटरैक्टिव ऑनबोर्डिंग सीधे कुंजी स्वीकार करती है:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

ऑनबोर्डिंग डिफ़ॉल्ट मॉडल को `ollama-cloud/kimi-k2.5:cloud` पर सेट करती है।

## डिफ़ॉल्ट

- प्रदाता: `ollama-cloud`
- आधार URL: `https://ollama.com`
- पर्यावरण चर: `OLLAMA_API_KEY`
- API शैली: Ollama का मूल `/api/chat`
- ऑनबोर्डिंग का डिफ़ॉल्ट मॉडल: `ollama-cloud/kimi-k2.5:cloud`

## Ollama Cloud कब चुनें

- आप `ollama serve` को स्थानीय रूप से चलाए बिना होस्ट किए गए Ollama मॉडल चाहते हैं।
- आप वही मूल Ollama चैट API स्वरूप चाहते हैं जिसका उपयोग OpenClaw स्थानीय
  Ollama के लिए करता है, लेकिन जिसे `https://ollama.com` की ओर निर्देशित किया गया हो।
- आप उन मॉडलों के लिए एक सरल क्लाउड मार्ग चाहते हैं जो पहले से ही Ollama के होस्ट किए गए
  कैटलॉग में मौजूद हैं।
- आपको स्थानीय मॉडल पुल, स्थानीय GPU नियंत्रण या केवल-LAN अनुमान की आवश्यकता नहीं है।

जब आप साइन इन किए हुए Ollama होस्ट के माध्यम से केवल-स्थानीय या
क्लाउड-प्लस-स्थानीय रूटिंग चाहते हों, तो इसके बजाय [Ollama](/hi/providers/ollama) का उपयोग करें।
जब आपको `/v1/chat/completions` सिमेंटिक्स या प्रदाता-विशिष्ट OpenAI-शैली की सुविधाओं की आवश्यकता हो,
तो इसके बजाय OpenAI-संगत प्रदाता का उपयोग करें।

## मॉडल

प्रदाता को API कुंजी की आवश्यकता होती है; इसके बिना वह निष्क्रिय रहता है। कुंजी उपलब्ध होने पर,
OpenClaw होस्ट किए गए कैटलॉग से Ollama Cloud मॉडल की लाइव खोज करता है:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

लाइव कैटलॉग में होस्ट किए गए आईडी में `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` और `minimax-m2.7` शामिल हैं। जब लाइव खोज में
कुछ नहीं मिलता, तो OpenClaw बंडल की गई पंक्तियों `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` और `glm-5.2:cloud` का उपयोग करता है।

मॉडल आईडी क्लाउड कैटलॉग आईडी हैं, स्थानीय पुल नाम नहीं। यदि कोई मॉडल नाम
स्थानीय Ollama होस्ट में काम करता है, लेकिन होस्ट किए गए कैटलॉग में मौजूद नहीं है,
तो इसके बजाय उस स्थानीय होस्ट के साथ `ollama` प्रदाता का उपयोग करें।

## लाइव परीक्षण

Ollama Cloud API-कुंजी स्मोक परीक्षणों के लिए, Ollama लाइव परीक्षण को होस्ट किए गए
एंडपॉइंट पर निर्देशित करें और अपने वर्तमान कैटलॉग से एक मॉडल चुनें:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

क्लाउड स्मोक परीक्षण टेक्स्ट, मूल स्ट्रीम और वेब खोज चलाता है; वेब खोज छोड़ने के लिए
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` सेट करें। यह `https://ollama.com` के लिए एम्बेडिंग को
डिफ़ॉल्ट रूप से छोड़ देता है, क्योंकि Ollama Cloud API कुंजियाँ
`/api/embed` को अधिकृत नहीं कर सकतीं; उन्हें `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` से बाध्य करें।

## समस्या निवारण

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` त्रुटियाँ: एक
  वास्तविक क्लाउड API कुंजी प्रदान करें। स्थानीय `ollama-local` मार्कर केवल स्थानीय या
  निजी Ollama होस्ट के लिए है।
- अज्ञात मॉडल त्रुटियाँ: `openclaw models list --provider ollama-cloud` चलाएँ और
  होस्ट किए गए मॉडल आईडी को हूबहू कॉपी करें।
- कस्टम Ollama होस्ट पर टूल-कॉल या अपरिष्कृत JSON समस्याएँ: जाँचें कि कहीं आप
  गलती से OpenAI-संगत `/v1` URL का उपयोग तो नहीं कर रहे हैं। Ollama रूट को
  बिना `/v1` प्रत्यय वाले मूल आधार URL का उपयोग करना चाहिए।

## संबंधित

- [Ollama](/hi/providers/ollama)
- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [सभी प्रदाता](/hi/providers/index)
