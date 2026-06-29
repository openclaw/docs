---
read_when:
    - आप OpenClaw को GMI Cloud मॉडल के साथ चलाना चाहते हैं
    - आपको GMI provider id, key, या endpoint चाहिए
summary: OpenClaw के साथ GMI Cloud की OpenAI-संगत API का उपयोग करें
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-28T23:58:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud frontier और open-weight models के लिए OpenAI-compatible API के पीछे एक hosted inference platform है। OpenClaw में यह एक official external provider
plugin है, जिसका मतलब है कि आप इसे एक बार install करते हैं, provider id `gmi` से चुनते हैं,
normal model auth के ज़रिए credentials store करते हैं, और
`gmi/google/gemini-3.1-flash-lite` जैसे model refs का उपयोग करते हैं।

GMI का उपयोग तब करें जब आप GMI के
catalog द्वारा expose किए गए Google, Anthropic, OpenAI, DeepSeek, Moonshot, और Z.AI routes सहित कई hosted model families के लिए एक API key चाहते हों। यह model fallback के लिए secondary provider के रूप में, vendors के बीच
hosted routes की तुलना करने के लिए, या जब GMI के पास आपके
primary provider से पहले कोई model उपलब्ध हो, तब उपयोगी है।

यह provider OpenAI-compatible chat semantics का उपयोग करता है। OpenClaw provider
id, auth profile, aliases, model catalog seed, और base URL का स्वामी है; GMI live
model availability, billing, rate limits, और किसी भी provider-side routing policy का स्वामी है।

## सेटअप

Plugin install करें, Gateway restart करें, फिर GMI Cloud में API key बनाएँ:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

फिर चलाएँ:

```bash
openclaw onboard --auth-choice gmi-api-key
```

या set करें:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## डिफ़ॉल्ट

- Provider: `gmi`
- Aliases: `gmi-cloud`, `gmicloud`
- Base URL: `https://api.gmi-serving.com/v1`
- Env var: `GMI_API_KEY`
- Default model: `gmi/google/gemini-3.1-flash-lite`

## GMI कब चुनें

- आप local model server के बजाय hosted OpenAI-compatible endpoint चाहते हैं।
- आप एक provider account के ज़रिए कई commercial और open-weight model families आज़माना चाहते हैं।
- आप OpenRouter,
  DeepInfra, Together, या direct vendor APIs से अलग upstream routing वाला fallback provider चाहते हैं।
- आपको GMI-specific model ids, pricing, या account controls चाहिए।

जब आपको vendor-native features चाहिए जिन्हें GMI अपने OpenAI-compatible route के ज़रिए expose नहीं करता, तो इसके बजाय direct vendor provider चुनें। जब data locality या local
GPU control hosted सुविधा से अधिक मायने रखता हो, तो Ollama, LM Studio, vLLM, या SGLang जैसे local
provider चुनें।

## Models

Plugin catalog सामान्यतः उपलब्ध GMI Cloud route ids seed करता है, जिनमें शामिल हैं:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

catalog एक seed है, यह वादा नहीं कि हर account हर समय हर model को call कर सकता है। आपके environment में configured
provider क्या report करता है, यह देखने के लिए OpenClaw का model listing command उपयोग करें:

```bash
openclaw models list --provider gmi
```

## समस्या निवारण

- `401` या `403`: जाँचें कि `GMI_API_KEY` OpenClaw चला रहे process के लिए set है, या provider auth profile में key store करने के लिए onboarding फिर से run करें।
- Unknown model errors: पुष्टि करें कि model आपके GMI account में मौजूद है और `openclaw models list --provider gmi` द्वारा दिखाए गए पूरे `gmi/<route-id>` ref का उपयोग करें।
- Intermittent provider errors: कोई अलग GMI route आज़माएँ या GMI को एकमात्र primary model provider के बजाय fallback के रूप में configure करें।

## संबंधित

- [Model providers](/hi/concepts/model-providers)
- [All providers](/hi/providers/index)
