---
read_when:
    - आप कैश बनाए रखकर प्रॉम्प्ट टोकन लागत कम करना चाहते हैं
    - आपको बहु-एजेंट सेटअप में प्रति-एजेंट कैश व्यवहार चाहिए
    - आप Heartbeat और cache-ttl छंटाई को साथ-साथ ट्यून कर रहे हैं
summary: प्रॉम्प्ट कैशिंग नियंत्रण, मर्ज क्रम, प्रदाता व्यवहार, और ट्यूनिंग पैटर्न
title: प्रॉम्प्ट कैशिंग
x-i18n:
    generated_at: "2026-06-29T00:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

प्रॉम्प्ट कैशिंग का अर्थ है कि मॉडल प्रदाता हर बार उन्हें फिर से संसाधित करने के बजाय, टर्नों के बीच अपरिवर्तित प्रॉम्प्ट प्रीफिक्स (आमतौर पर सिस्टम/डेवलपर निर्देश और अन्य स्थिर संदर्भ) का पुन: उपयोग कर सकता है। OpenClaw प्रदाता उपयोग को `cacheRead` और `cacheWrite` में सामान्यीकृत करता है, जहां अपस्ट्रीम API उन काउंटरों को सीधे उजागर करता है।

जब लाइव सेशन स्नैपशॉट में कैश काउंटर मौजूद नहीं होते, तो स्थिति सतहें सबसे हालिया ट्रांसक्रिप्ट
उपयोग लॉग से भी कैश काउंटर पुनर्प्राप्त कर सकती हैं, ताकि `/status` आंशिक सेशन मेटाडेटा हानि के बाद भी
कैश लाइन दिखाता रहे। मौजूदा गैर-शून्य लाइव
कैश मान अभी भी ट्रांसक्रिप्ट फॉलबैक मानों पर प्राथमिकता रखते हैं।

यह क्यों मायने रखता है: कम टोकन लागत, तेज प्रतिक्रियाएं, और लंबे समय तक चलने वाले सेशनों के लिए अधिक पूर्वानुमेय प्रदर्शन। कैशिंग के बिना, दोहराए गए प्रॉम्प्ट हर टर्न पर पूरी प्रॉम्प्ट लागत चुकाते हैं, भले ही अधिकांश इनपुट बदला न हो।

नीचे दिए गए सेक्शन हर उस कैश-संबंधित नियंत्रण को कवर करते हैं जो प्रॉम्प्ट पुन: उपयोग और टोकन लागत को प्रभावित करता है।

प्रदाता संदर्भ:

- Anthropic प्रॉम्प्ट कैशिंग: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI प्रॉम्प्ट कैशिंग: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API हेडर और अनुरोध ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic अनुरोध ID और त्रुटियां: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## मुख्य नियंत्रण

### `cacheRetention` (वैश्विक डिफॉल्ट, मॉडल, और प्रति-एजेंट)

सभी मॉडलों के लिए वैश्विक डिफॉल्ट के रूप में कैश रिटेंशन सेट करें:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

प्रति-मॉडल ओवरराइड करें:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

प्रति-एजेंट ओवरराइड:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

कॉन्फिग मर्ज क्रम:

1. `agents.defaults.params` (वैश्विक डिफॉल्ट — सभी मॉडलों पर लागू)
2. `agents.defaults.models["provider/model"].params` (प्रति-मॉडल ओवरराइड)
3. `agents.list[].params` (मेल खाने वाला एजेंट id; कुंजी के अनुसार ओवरराइड करता है)

### `contextPruning.mode: "cache-ttl"`

कैश TTL विंडो के बाद पुराने टूल-परिणाम संदर्भ को प्रून करता है, ताकि निष्क्रियता के बाद के अनुरोध अत्यधिक बड़े इतिहास को फिर से कैश न करें।

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

पूरे व्यवहार के लिए [सेशन प्रूनिंग](/hi/concepts/session-pruning) देखें।

### Heartbeat गर्म बनाए रखना

Heartbeat कैश विंडो को गर्म बनाए रख सकता है और निष्क्रिय अंतरालों के बाद दोहराए गए कैश लेखन को कम कर सकता है।

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

प्रति-एजेंट Heartbeat `agents.list[].heartbeat` पर समर्थित है।

## प्रदाता व्यवहार

### Anthropic (प्रत्यक्ष API)

- `cacheRetention` समर्थित है।
- Anthropic API-कुंजी auth प्रोफाइलों के साथ, OpenClaw सेट न होने पर Anthropic मॉडल refs के लिए `cacheRetention: "short"` सीड करता है।
- Anthropic नेटिव Messages प्रतिक्रियाएं `cache_read_input_tokens` और `cache_creation_input_tokens` दोनों उजागर करती हैं, इसलिए OpenClaw `cacheRead` और `cacheWrite` दोनों दिखा सकता है।
- नेटिव Anthropic अनुरोधों के लिए, `cacheRetention: "short"` डिफॉल्ट 5-मिनट ephemeral कैश से मैप होता है, और `cacheRetention: "long"` केवल प्रत्यक्ष `api.anthropic.com` होस्टों पर 1-घंटे TTL में अपग्रेड करता है।

### OpenAI (प्रत्यक्ष API)

- समर्थित हालिया मॉडलों पर प्रॉम्प्ट कैशिंग स्वचालित है। OpenClaw को ब्लॉक-स्तरीय कैश मार्कर इंजेक्ट करने की आवश्यकता नहीं है।
- OpenClaw टर्नों के बीच कैश रूटिंग स्थिर रखने के लिए `prompt_cache_key` का उपयोग करता है। जब `cacheRetention: "long"` चुना जाता है, तो प्रत्यक्ष OpenAI होस्ट `prompt_cache_retention: "24h"` का उपयोग करते हैं।
- OpenAI-संगत Completions प्रदाताओं को `prompt_cache_key` केवल तब मिलता है जब उनका मॉडल कॉन्फिग स्पष्ट रूप से `compat.supportsPromptCacheKey: true` सेट करता है। लंबी-रिटेंशन फॉरवर्डिंग एक अलग क्षमता है: स्पष्ट `cacheRetention: "long"` केवल तब `prompt_cache_retention: "24h"` भेजता है जब वह compat एंट्री लंबी कैश रिटेंशन का भी समर्थन करती है। Mistral जैसे प्रदाता कैश कुंजियों में ऑप्ट इन कर सकते हैं और लंबी-रिटेंशन फील्ड दबाने के लिए `compat.supportsLongCacheRetention: false` सेट कर सकते हैं। `cacheRetention: "none"` दोनों फील्ड दबा देता है।
- OpenAI प्रतिक्रियाएं `usage.prompt_tokens_details.cached_tokens` (या Responses API इवेंट्स पर `input_tokens_details.cached_tokens`) के जरिए कैश किए गए प्रॉम्प्ट टोकन उजागर करती हैं। OpenClaw इसे `cacheRead` पर मैप करता है।
- OpenAI अलग कैश-राइट टोकन काउंटर उजागर नहीं करता, इसलिए OpenAI पाथों पर `cacheWrite` `0` रहता है, भले ही प्रदाता कैश गर्म कर रहा हो।
- OpenAI `x-request-id`, `openai-processing-ms`, और `x-ratelimit-*` जैसे उपयोगी ट्रेसिंग और रेट-लिमिट हेडर लौटाता है, लेकिन कैश-हिट अकाउंटिंग उपयोग पेलोड से आनी चाहिए, हेडरों से नहीं।
- व्यवहार में, OpenAI अक्सर Anthropic-शैली चलायमान पूर्ण-इतिहास पुन: उपयोग के बजाय शुरुआती-प्रीफिक्स कैश जैसा व्यवहार करता है। मौजूदा लाइव प्रोब में स्थिर लंबे-प्रीफिक्स टेक्स्ट टर्न लगभग `4864` कैश्ड-टोकन पठार तक पहुंच सकते हैं, जबकि टूल-भारी या MCP-शैली ट्रांसक्रिप्ट अक्सर सटीक दोहरावों पर भी लगभग `4608` कैश्ड टोकन पर स्थिर होते हैं।

### Anthropic Vertex

- Vertex AI (`anthropic-vertex/*`) पर Anthropic मॉडल प्रत्यक्ष Anthropic की तरह ही `cacheRetention` का समर्थन करते हैं।
- `cacheRetention: "long"` Vertex AI एंडपॉइंटों पर वास्तविक 1-घंटे प्रॉम्प्ट-कैश TTL से मैप होता है।
- `anthropic-vertex` के लिए डिफॉल्ट कैश रिटेंशन प्रत्यक्ष Anthropic डिफॉल्ट से मेल खाता है।
- Vertex अनुरोध सीमा-जागरूक कैश शेपिंग से रूट किए जाते हैं, ताकि कैश पुन: उपयोग प्रदाताओं को वास्तव में मिलने वाली सामग्री से संरेखित रहे।

### Amazon Bedrock

- Anthropic Claude मॉडल refs (`amazon-bedrock/*anthropic.claude*`) स्पष्ट `cacheRetention` पास-थ्रू का समर्थन करते हैं।
- गैर-Anthropic Bedrock मॉडलों को runtime पर `cacheRetention: "none"` पर बाध्य किया जाता है।

### OpenRouter मॉडल

`openrouter/anthropic/*` मॉडल refs के लिए, OpenClaw प्रॉम्प्ट-कैश
पुन: उपयोग बेहतर करने के लिए सिस्टम/डेवलपर प्रॉम्प्ट ब्लॉकों पर Anthropic
`cache_control` इंजेक्ट करता है, केवल तब जब अनुरोध अब भी सत्यापित OpenRouter रूट को लक्षित कर रहा हो
(अपने डिफॉल्ट एंडपॉइंट पर `openrouter`, या कोई भी प्रदाता/base URL जो
`openrouter.ai` पर रिजॉल्व होता है)।

`openrouter/deepseek/*`, `openrouter/moonshot*/*`, और `openrouter/zai/*`
मॉडल refs के लिए, `contextPruning.mode: "cache-ttl"` अनुमत है क्योंकि OpenRouter
प्रदाता-पक्ष प्रॉम्प्ट कैशिंग को स्वचालित रूप से संभालता है। OpenClaw उन अनुरोधों में
Anthropic `cache_control` मार्कर इंजेक्ट नहीं करता।

DeepSeek कैश निर्माण सर्वोत्तम-प्रयास है और इसमें कुछ सेकंड लग सकते हैं। कोई
तुरंत अगला अनुरोध अभी भी `cached_tokens: 0` दिखा सकता है; थोड़ी देर बाद दोहराए गए
समान-प्रीफिक्स अनुरोध से सत्यापित करें और कैश-हिट संकेत के रूप में `usage.prompt_tokens_details.cached_tokens`
का उपयोग करें।

यदि आप मॉडल को किसी मनमाने OpenAI-संगत proxy URL पर फिर से इंगित करते हैं, तो OpenClaw
वे OpenRouter-विशिष्ट Anthropic कैश मार्कर इंजेक्ट करना बंद कर देता है।

### अन्य प्रदाता

यदि प्रदाता इस कैश मोड का समर्थन नहीं करता, तो `cacheRetention` का कोई प्रभाव नहीं होता।

### Google Gemini प्रत्यक्ष API

- प्रत्यक्ष Gemini ट्रांसपोर्ट (`api: "google-generative-ai"`) अपस्ट्रीम `cachedContentTokenCount` के माध्यम से कैश हिट रिपोर्ट करता है; OpenClaw इसे `cacheRead` पर मैप करता है।
- जब प्रत्यक्ष Gemini मॉडल पर `cacheRetention` सेट होता है, तो OpenClaw Google AI Studio रन पर सिस्टम प्रॉम्प्टों के लिए `cachedContents` संसाधन अपने-आप बनाता, पुन: उपयोग करता, और रीफ्रेश करता है। इसका मतलब है कि अब आपको cached-content हैंडल पहले से मैन्युअली बनाने की आवश्यकता नहीं है।
- आप अब भी कॉन्फिगर किए गए मॉडल पर `params.cachedContent` (या legacy `params.cached_content`) के रूप में पहले से मौजूद Gemini cached-content हैंडल पास कर सकते हैं।
- यह Anthropic/OpenAI प्रॉम्प्ट-प्रीफिक्स कैशिंग से अलग है। Gemini के लिए, OpenClaw अनुरोध में कैश मार्कर इंजेक्ट करने के बजाय प्रदाता-नेटिव `cachedContents` संसाधन प्रबंधित करता है।

### Gemini CLI उपयोग

- Gemini CLI `stream-json` आउटपुट `stats.cached` के माध्यम से कैश हिट दिखा सकता है;
  OpenClaw इसे `cacheRead` पर मैप करता है। Legacy `--output-format json` ओवरराइड समान
  उपयोग सामान्यीकरण का उपयोग करते हैं।
- यदि CLI प्रत्यक्ष `stats.input` मान छोड़ देता है, तो OpenClaw `stats.input_tokens - stats.cached` से इनपुट टोकन निकालता है।
- यह केवल उपयोग सामान्यीकरण है। इसका मतलब यह नहीं है कि OpenClaw Gemini CLI के लिए Anthropic/OpenAI-शैली प्रॉम्प्ट-कैश मार्कर बना रहा है।

## सिस्टम-प्रॉम्प्ट कैश सीमा

OpenClaw सिस्टम प्रॉम्प्ट को एक **स्थिर प्रीफिक्स** और एक **अस्थिर
सफिक्स** में विभाजित करता है, जिन्हें आंतरिक कैश-प्रीफिक्स सीमा अलग करती है। सीमा के ऊपर की
सामग्री (टूल परिभाषाएं, Skills मेटाडेटा, workspace फाइलें, और अन्य
अपेक्षाकृत स्थिर संदर्भ) इस तरह क्रमबद्ध होती है कि वह टर्नों के बीच byte-identical बनी रहे।
सीमा के नीचे की सामग्री (उदाहरण के लिए `HEARTBEAT.md`, runtime timestamp, और
अन्य प्रति-टर्न मेटाडेटा) को कैश्ड
प्रीफिक्स को अमान्य किए बिना बदलने की अनुमति है।

मुख्य डिजाइन विकल्प:

- स्थिर workspace project-context फाइलें `HEARTBEAT.md` से पहले क्रमबद्ध होती हैं, ताकि
  Heartbeat churn स्थिर प्रीफिक्स को न तोड़े।
- सीमा Anthropic-family, OpenAI-family, Google, और
  CLI ट्रांसपोर्ट शेपिंग में लागू होती है, ताकि सभी समर्थित प्रदाता समान प्रीफिक्स
  स्थिरता से लाभान्वित हों।
- Codex Responses और Anthropic Vertex अनुरोध
  सीमा-जागरूक कैश शेपिंग से रूट किए जाते हैं, ताकि कैश पुन: उपयोग प्रदाताओं को
  वास्तव में मिलने वाली सामग्री से संरेखित रहे।
- सिस्टम-प्रॉम्प्ट फिंगरप्रिंट सामान्यीकृत होते हैं (whitespace, line endings,
  hook-added context, runtime capability ordering), ताकि semantically अपरिवर्तित
  प्रॉम्प्ट टर्नों के बीच KV/cache साझा करें।

यदि आपको कॉन्फिग या workspace बदलाव के बाद अप्रत्याशित `cacheWrite` spikes दिखते हैं,
तो जांचें कि बदलाव कैश सीमा के ऊपर आता है या नीचे। अस्थिर
सामग्री को सीमा के नीचे ले जाना (या उसे स्थिर करना) अक्सर
समस्या हल कर देता है।

## OpenClaw कैश-स्थिरता गार्ड

OpenClaw प्रदाता तक अनुरोध पहुंचने से पहले कई कैश-संवेदनशील पेलोड आकारों को भी deterministic रखता है:

- Bundle MCP टूल कैटलॉग टूल
  पंजीकरण से पहले deterministic रूप से क्रमबद्ध किए जाते हैं, ताकि `listTools()` क्रम में बदलाव tools block को churn करके
  प्रॉम्प्ट-कैश प्रीफिक्स न तोड़े।
- persisted image blocks वाले legacy sessions **3 सबसे हालिया
  पूर्ण टर्नों** को अक्षुण्ण रखते हैं; पुराने पहले से संसाधित image blocks को
  marker से बदला जा सकता है, ताकि image-heavy follow-ups बड़े
  stale payloads को बार-बार न भेजते रहें।

## ट्यूनिंग पैटर्न

### मिश्रित ट्रैफिक (अनुशंसित डिफॉल्ट)

अपने मुख्य एजेंट पर दीर्घजीवी baseline रखें, bursty notifier agents पर कैशिंग बंद करें:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### लागत-प्रथम baseline

- baseline `cacheRetention: "short"` सेट करें।
- `contextPruning.mode: "cache-ttl"` सक्षम करें।
- केवल उन एजेंटों के लिए Heartbeat को अपने TTL से नीचे रखें जिन्हें गर्म कैश से लाभ होता है।

## कैश डायग्नोस्टिक्स

OpenClaw embedded agent runs के लिए समर्पित cache-trace diagnostics उजागर करता है।

सामान्य user-facing diagnostics के लिए, `/status` और अन्य उपयोग सारांश
ताजा transcript usage entry को `cacheRead` /
`cacheWrite` के लिए fallback source के रूप में उपयोग कर सकते हैं, जब live session entry में वे काउंटर नहीं होते।

## लाइव रिग्रेशन टेस्ट

OpenClaw दोहराए गए प्रीफिक्स, टूल टर्न, image टर्न, MCP-शैली टूल ट्रांसक्रिप्ट, और Anthropic no-cache control के लिए एक संयुक्त live cache regression gate रखता है।

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

narrow live gate इस तरह चलाएं:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

baseline file सबसे हालिया observed live numbers और test द्वारा उपयोग किए गए provider-specific regression floors को store करती है।
runner fresh per-run session IDs और prompt namespaces भी उपयोग करता है, ताकि previous cache state current regression sample को pollute न करे।

ये परीक्षण जानबूझकर providers में समान सफलता मानदंडों का उपयोग नहीं करते।

### Anthropic लाइव अपेक्षाएँ

- `cacheWrite` के माध्यम से स्पष्ट warmup writes की अपेक्षा करें।
- repeated turns पर लगभग पूर्ण इतिहास reuse की अपेक्षा करें क्योंकि Anthropic cache control बातचीत के माध्यम से cache breakpoint को आगे बढ़ाता है।
- मौजूदा लाइव assertions अभी भी stable, tool, और image paths के लिए high hit-rate thresholds का उपयोग करते हैं।

### OpenAI लाइव अपेक्षाएँ

- केवल `cacheRead` की अपेक्षा करें। `cacheWrite` `0` ही रहता है।
- repeated-turn cache reuse को provider-specific plateau मानें, Anthropic-शैली के moving full-history reuse के रूप में नहीं।
- मौजूदा लाइव assertions `gpt-5.4-mini` पर देखे गए लाइव व्यवहार से निकाले गए conservative floor checks का उपयोग करते हैं:
  - stable prefix: `cacheRead >= 4608`, hit rate `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, hit rate `>= 0.85`
  - image transcript: `cacheRead >= 3840`, hit rate `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`, hit rate `>= 0.85`

2026-04-04 को ताज़ा combined live verification यहाँ पहुँचा:

- stable prefix: `cacheRead=4864`, hit rate `0.966`
- tool transcript: `cacheRead=4608`, hit rate `0.896`
- image transcript: `cacheRead=4864`, hit rate `0.954`
- MCP-style transcript: `cacheRead=4608`, hit rate `0.891`

combined gate के लिए हालिया local wall-clock time लगभग `88s` था।

assertions अलग क्यों हैं:

- Anthropic स्पष्ट cache breakpoints और moving conversation-history reuse expose करता है।
- OpenAI prompt caching अभी भी exact-prefix sensitive है, लेकिन लाइव Responses traffic में प्रभावी reusable prefix पूरे prompt से पहले plateau कर सकता है।
- इसी कारण, Anthropic और OpenAI की तुलना एक single cross-provider percentage threshold से करने पर false regressions बनते हैं।

### `diagnostics.cacheTrace` config

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Defaults:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env toggles (one-off debugging)

- `OPENCLAW_CACHE_TRACE=1` cache tracing सक्षम करता है।
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` output path override करता है।
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` full message payload capture toggle करता है।
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` prompt text capture toggle करता है।
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` system prompt capture toggle करता है।

### क्या inspect करें

- Cache trace events JSONL होते हैं और इनमें `session:loaded`, `prompt:before`, `stream:context`, और `session:after` जैसे staged snapshots शामिल होते हैं।
- Per-turn cache token impact सामान्य usage surfaces में `cacheRead` और `cacheWrite` के माध्यम से दिखाई देता है (उदाहरण के लिए `/usage full` और session usage summaries)।
- Anthropic के लिए, caching सक्रिय होने पर `cacheRead` और `cacheWrite` दोनों की अपेक्षा करें।
- OpenAI के लिए, cache hits पर `cacheRead` की अपेक्षा करें और `cacheWrite` को `0` ही रहने दें; OpenAI अलग cache-write token field प्रकाशित नहीं करता।
- यदि आपको request tracing चाहिए, तो request IDs और rate-limit headers को cache metrics से अलग log करें। OpenClaw का मौजूदा cache-trace output raw provider response headers के बजाय prompt/session shape और normalized token usage पर केंद्रित है।

## त्वरित troubleshooting

- अधिकांश turns पर high `cacheWrite`: volatile system-prompt inputs जाँचें और सत्यापित करें कि model/provider आपकी cache settings का समर्थन करता है।
- Anthropic पर high `cacheWrite`: अक्सर इसका अर्थ होता है कि cache breakpoint ऐसी सामग्री पर landing कर रहा है जो हर request में बदलती है।
- Low OpenAI `cacheRead`: सत्यापित करें कि stable prefix सामने है, repeated prefix कम से कम 1024 tokens है, और वही `prompt_cache_key` उन turns के लिए reused है जिन्हें cache साझा करना चाहिए।
- `cacheRetention` से कोई प्रभाव नहीं: पुष्टि करें कि model key `agents.defaults.models["provider/model"]` से मेल खाती है।
- cache settings के साथ Bedrock Nova/Mistral requests: runtime द्वारा `none` पर force अपेक्षित है।

संबंधित docs:

- [Anthropic](/hi/providers/anthropic)
- [Token use और costs](/hi/reference/token-use)
- [Session pruning](/hi/concepts/session-pruning)
- [Gateway configuration reference](/hi/gateway/configuration-reference)

## संबंधित

- [Token use और costs](/hi/reference/token-use)
- [API usage और costs](/hi/reference/api-usage-costs)
