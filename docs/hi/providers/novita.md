---
read_when:
    - आप OpenClaw को NovitaAI मॉडल्स के साथ चलाना चाहते हैं
    - आपको Novita प्रदाता ID, कुंजी, या एंडपॉइंट चाहिए
summary: NovitaAI के OpenAI-संगत API का OpenClaw के साथ उपयोग करें
title: NovitaAI
x-i18n:
    generated_at: "2026-06-29T00:00:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI एक होस्टेड AI अवसंरचना प्रदाता है, जिसके पास OpenAI-संगत मॉडल
API है। OpenClaw में यह एक bundled मॉडल प्रदाता है, इसलिए provider id
`novita` है, credentials सामान्य मॉडल auth flow से गुजरते हैं, और model refs
`novita/deepseek/deepseek-v3-0324` जैसे दिखते हैं।

Novita का उपयोग तब करें जब आप अपना inference server चलाए बिना open-weight और
third-party मॉडल routes तक hosted access चाहते हों। bundled catalog उन chat
models पर केंद्रित है जो agent turns के लिए व्यावहारिक हैं, जिनमें Novita द्वारा
expose किए गए DeepSeek, Moonshot, MiniMax, GLM, और Qwen routes शामिल हैं।

यह provider Novita के OpenAI-compatible endpoint का उपयोग करता है। OpenClaw
provider registration, auth, aliases, model ref normalization, और base URL
selection संभालता है; Novita live model availability, account permissions,
pricing, और rate limits नियंत्रित करता है।

## सेटअप

[novita.ai/settings/key-management](https://novita.ai/settings/key-management) पर API key बनाएं, फिर चलाएं:

```bash
openclaw onboard --auth-choice novita-api-key
```

या सेट करें:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## डिफ़ॉल्ट

- Provider: `novita`
- उपनाम: `novita-ai`, `novitaai`
- Base URL: `https://api.novita.ai/openai/v1`
- Env var: `NOVITA_API_KEY`
- डिफ़ॉल्ट मॉडल: `novita/deepseek/deepseek-v3-0324`

## Novita कब चुनें

- आप OpenAI-संगत API के साथ hosted open-weight मॉडल access चाहते हैं।
- आप एक ही provider account के माध्यम से DeepSeek, Kimi, MiniMax, GLM, या Qwen-family routes चाहते हैं।
- आप OpenRouter, GMI, DeepInfra, या direct vendor APIs के अलावा एक और hosted fallback path चाहते हैं।
- आप vLLM, SGLang, LM Studio, या Ollama infrastructure बनाए रखने के बजाय provider-side model hosting पसंद करते हैं।

जब आपको vendor-native request parameters या support contracts की आवश्यकता हो,
तो direct vendor provider चुनें। जब मॉडल को आपके अपने hardware पर या आपके अपने
network boundary के पीछे चलना हो, तो local provider चुनें।

## मॉडल

bundled catalog आम तौर पर उपलब्ध NovitaAI route ids seed करता है, जिनमें शामिल हैं:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

catalog OpenClaw model selection के लिए starting point है। आपका account,
region, या Novita का current catalog routes जोड़, हटा, या restrict कर सकता है।
long-lived default सेट करने से पहले CLI से provider जांचें:

```bash
openclaw models list --provider novita
```

## समस्या निवारण

- `401` या `403`: Novita के key management page में key verify करें और यदि stored profile stale है तो
  `openclaw onboard --auth-choice novita-api-key` फिर से चलाएं।
- Unknown model errors: `openclaw models list --provider novita` द्वारा लौटाया गया ठीक वही
  `novita/<route-id>` उपयोग करें।
- Slow या failed routes: कोई दूसरा Novita model route आज़माएं या उन workloads के लिए Novita को fallback provider के रूप में सेट करें जो provider-specific variance सहन कर सकते हैं।

## संबंधित

- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [सभी providers](/hi/providers/index)
