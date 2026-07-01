---
read_when:
    - आप कैश रिटेंशन के साथ प्रॉम्प्ट टोकन लागत घटाना चाहते हैं
    - आपको बहु-एजेंट सेटअप में प्रति-एजेंट कैश व्यवहार चाहिए
    - आप heartbeat और cache-ttl प्रूनिंग को साथ में ट्यून कर रहे हैं
summary: प्रॉम्प्ट कैशिंग नॉब्स, मर्ज क्रम, प्रदाता व्यवहार, और ट्यूनिंग पैटर्न
title: Prompt कैशिंग
x-i18n:
    generated_at: "2026-07-01T08:06:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

प्रॉम्प्ट कैशिंग का मतलब है कि मॉडल प्रदाता हर बार उन्हें फिर से प्रोसेस करने के बजाय, टर्न्स में अपरिवर्तित प्रॉम्प्ट प्रीफ़िक्स (आमतौर पर system/developer निर्देश और अन्य स्थिर संदर्भ) का पुन: उपयोग कर सकता है। OpenClaw प्रदाता उपयोग को `cacheRead` और `cacheWrite` में सामान्यीकृत करता है, जहां अपस्ट्रीम API उन काउंटरों को सीधे उजागर करती है।

जब लाइव सेशन स्नैपशॉट में कैश काउंटर मौजूद न हों, तो स्थिति सतहें सबसे हाल के ट्रांसक्रिप्ट
उपयोग लॉग से भी कैश काउंटर पुनर्प्राप्त कर सकती हैं, ताकि `/status` आंशिक सेशन मेटाडेटा हानि के बाद भी
कैश लाइन दिखाता रहे। मौजूदा गैर-शून्य लाइव
कैश मान अब भी ट्रांसक्रिप्ट फ़ॉलबैक मानों पर प्राथमिकता रखते हैं।

यह क्यों मायने रखता है: कम टोकन लागत, तेज़ प्रतिक्रियाएँ, और लंबे समय तक चलने वाले सेशनों के लिए अधिक पूर्वानुमेय प्रदर्शन। कैशिंग के बिना, दोहराए गए प्रॉम्प्ट हर टर्न पर पूरी प्रॉम्प्ट लागत चुकाते हैं, भले ही अधिकांश इनपुट बदला न हो।

नीचे के अनुभाग प्रॉम्प्ट पुन: उपयोग और टोकन लागत को प्रभावित करने वाले हर कैश-संबंधी नॉब को कवर करते हैं।

प्रदाता संदर्भ:

- Anthropic प्रॉम्प्ट कैशिंग: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI प्रॉम्प्ट कैशिंग: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API हेडर और अनुरोध ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic अनुरोध ID और त्रुटियाँ: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## प्राथमिक नॉब

### `cacheRetention` (वैश्विक डिफ़ॉल्ट, मॉडल, और प्रति-एजेंट)

सभी मॉडलों के लिए वैश्विक डिफ़ॉल्ट के रूप में कैश रिटेंशन सेट करें:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

प्रति-मॉडल ओवरराइड:

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

कॉन्फ़िग मर्ज क्रम:

1. `agents.defaults.params` (वैश्विक डिफ़ॉल्ट — सभी मॉडलों पर लागू)
2. `agents.defaults.models["provider/model"].params` (प्रति-मॉडल ओवरराइड)
3. `agents.list[].params` (मेल खाने वाली एजेंट ID; कुंजी के आधार पर ओवरराइड)

### `contextPruning.mode: "cache-ttl"`

कैश TTL विंडो के बाद पुराने टूल-परिणाम संदर्भ को प्रून करता है, ताकि निष्क्रियता के बाद के अनुरोध बहुत बड़े इतिहास को फिर से कैश न करें।

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

पूरा व्यवहार जानने के लिए [सेशन प्रूनिंग](/hi/concepts/session-pruning) देखें।

### Heartbeat गर्म बनाए रखना

Heartbeat कैश विंडो को गर्म रख सकता है और निष्क्रिय अंतरालों के बाद दोहराए गए कैश लेखन को घटा सकता है।

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

प्रति-एजेंट Heartbeat `agents.list[].heartbeat` पर समर्थित है।

## प्रदाता व्यवहार

### Anthropic (सीधी API)

- `cacheRetention` समर्थित है।
- Anthropic API-key auth प्रोफ़ाइलों के साथ, अनसेट होने पर OpenClaw Anthropic मॉडल refs के लिए `cacheRetention: "short"` सीड करता है।
- Anthropic नेटिव Messages प्रतिक्रियाएँ `cache_read_input_tokens` और `cache_creation_input_tokens` दोनों उजागर करती हैं, इसलिए OpenClaw `cacheRead` और `cacheWrite` दोनों दिखा सकता है।
- नेटिव Anthropic अनुरोधों के लिए, `cacheRetention: "short"` डिफ़ॉल्ट 5-मिनट ephemeral कैश से मैप होता है, और `cacheRetention: "long"` केवल सीधे `api.anthropic.com` होस्ट पर 1-घंटे TTL में अपग्रेड करता है।

### OpenAI (सीधी API)

- समर्थित हालिया मॉडलों पर प्रॉम्प्ट कैशिंग स्वचालित है। OpenClaw को ब्लॉक-स्तर कैश मार्कर इंजेक्ट करने की ज़रूरत नहीं है।
- OpenClaw टर्न्स में कैश रूटिंग स्थिर रखने के लिए `prompt_cache_key` का उपयोग करता है। जब `cacheRetention: "long"` चुना जाता है, तो सीधे OpenAI होस्ट `prompt_cache_retention: "24h"` का उपयोग करते हैं।
- OpenAI-संगत Completions प्रदाताओं को `prompt_cache_key` केवल तब मिलता है जब उनका मॉडल कॉन्फ़िग स्पष्ट रूप से `compat.supportsPromptCacheKey: true` सेट करता है। लंबी-रिटेंशन फ़ॉरवर्डिंग एक अलग क्षमता है: स्पष्ट `cacheRetention: "long"` `prompt_cache_retention: "24h"` केवल तब भेजता है जब वह compat प्रविष्टि लंबी कैश रिटेंशन का भी समर्थन करती है। Mistral जैसे प्रदाता cache keys में ऑप्ट इन कर सकते हैं, जबकि लंबे-रिटेंशन फ़ील्ड को दबाने के लिए `compat.supportsLongCacheRetention: false` सेट कर सकते हैं। `cacheRetention: "none"` दोनों फ़ील्ड दबाता है।
- OpenAI प्रतिक्रियाएँ `usage.prompt_tokens_details.cached_tokens` (या Responses API इवेंट्स पर `input_tokens_details.cached_tokens`) के माध्यम से कैश किए गए प्रॉम्प्ट टोकन उजागर करती हैं। OpenClaw उसे `cacheRead` से मैप करता है।
- GPT-5.6 Responses उपयोग `input_tokens_details.cache_write_tokens` भी उजागर कर सकता है। OpenClaw उसे `cacheWrite` से मैप करता है और मॉडल की कैश-लेखन दर पर उसका मूल्य लगाता है; जिन Responses में फ़ील्ड नहीं होती, वे `cacheWrite` को `0` पर रखते हैं।
- OpenAI `x-request-id`, `openai-processing-ms`, और `x-ratelimit-*` जैसे उपयोगी ट्रेसिंग और दर-सीमा हेडर लौटाता है, लेकिन कैश-हिट लेखांकन उपयोग payload से आना चाहिए, हेडरों से नहीं।
- व्यवहार में, OpenAI अक्सर Anthropic-शैली के चलते हुए पूर्ण-इतिहास पुन: उपयोग के बजाय initial-prefix cache जैसा व्यवहार करता है। स्थिर लंबे-प्रीफ़िक्स टेक्स्ट टर्न वर्तमान लाइव probes में `4864` cached-token plateau के पास पहुँच सकते हैं, जबकि टूल-भारी या MCP-शैली ट्रांसक्रिप्ट अक्सर सटीक दोहराव पर भी लगभग `4608` cached tokens पर plateau करते हैं।

### Anthropic Vertex

- Vertex AI पर Anthropic मॉडल (`anthropic-vertex/*`) `cacheRetention` को सीधे Anthropic की तरह ही समर्थन करते हैं।
- `cacheRetention: "long"` Vertex AI endpoints पर वास्तविक 1-घंटे prompt-cache TTL से मैप होता है।
- `anthropic-vertex` के लिए डिफ़ॉल्ट कैश रिटेंशन सीधे Anthropic डिफ़ॉल्ट से मेल खाता है।
- Vertex अनुरोध boundary-aware cache shaping के माध्यम से रूट किए जाते हैं, ताकि cache reuse प्रदाताओं को वास्तव में मिलने वाली सामग्री के साथ संरेखित रहे।

### Amazon Bedrock

- Anthropic Claude मॉडल refs (`amazon-bedrock/*anthropic.claude*`) स्पष्ट `cacheRetention` pass-through का समर्थन करते हैं।
- गैर-Anthropic Bedrock मॉडल रनटाइम पर `cacheRetention: "none"` के लिए बाध्य किए जाते हैं।

### OpenRouter मॉडल

`openrouter/anthropic/*` मॉडल refs के लिए, OpenClaw प्रॉम्प्ट-कैश
पुन: उपयोग बेहतर करने के लिए system/developer प्रॉम्प्ट ब्लॉकों पर Anthropic
`cache_control` इंजेक्ट करता है, लेकिन केवल तब जब अनुरोध अब भी सत्यापित OpenRouter route
(`openrouter` अपने डिफ़ॉल्ट endpoint पर, या कोई भी प्रदाता/base URL जो
`openrouter.ai` में resolve होता है) को लक्ष्य बना रहा हो।

`openrouter/deepseek/*`, `openrouter/moonshot*/*`, और `openrouter/zai/*`
मॉडल refs के लिए, `contextPruning.mode: "cache-ttl"` अनुमत है क्योंकि OpenRouter
प्रदाता-पक्ष प्रॉम्प्ट कैशिंग अपने आप संभालता है। OpenClaw उन अनुरोधों में
Anthropic `cache_control` मार्कर इंजेक्ट नहीं करता।

DeepSeek कैश निर्माण best-effort है और कुछ सेकंड ले सकता है। एक
तत्काल follow-up अब भी `cached_tokens: 0` दिखा सकता है; थोड़ी देर बाद दोहराए गए
same-prefix अनुरोध से सत्यापित करें और cache-hit signal के रूप में `usage.prompt_tokens_details.cached_tokens`
का उपयोग करें।

यदि आप मॉडल को किसी मनमाने OpenAI-संगत proxy URL की ओर repoint करते हैं, तो OpenClaw
वे OpenRouter-विशिष्ट Anthropic cache markers इंजेक्ट करना बंद कर देता है।

### अन्य प्रदाता

यदि प्रदाता इस कैश मोड का समर्थन नहीं करता, तो `cacheRetention` का कोई प्रभाव नहीं होता।

### Google Gemini सीधी API

- सीधा Gemini transport (`api: "google-generative-ai"`) अपस्ट्रीम `cachedContentTokenCount` के माध्यम से cache hits
  रिपोर्ट करता है; OpenClaw उसे `cacheRead` से मैप करता है।
- जब सीधे Gemini मॉडल पर `cacheRetention` सेट होता है, तो OpenClaw Google AI Studio runs पर system prompts के लिए
  `cachedContents` संसाधन अपने आप बनाता, पुन: उपयोग करता, और refresh करता है। इसका मतलब है कि अब आपको
  cached-content handle पहले से मैन्युअल रूप से बनाने की ज़रूरत नहीं है।
- आप configured
  मॉडल पर `params.cachedContent` (या legacy `params.cached_content`) के रूप में पहले से मौजूद Gemini cached-content handle अब भी पास कर सकते हैं।
- यह Anthropic/OpenAI prompt-prefix caching से अलग है। Gemini के लिए,
  OpenClaw अनुरोध में cache markers इंजेक्ट करने के बजाय प्रदाता-नेटिव `cachedContents` संसाधन प्रबंधित करता है।

### Gemini CLI उपयोग

- Gemini CLI `stream-json` आउटपुट `stats.cached` के माध्यम से cache hits दिखा सकता है;
  OpenClaw उसे `cacheRead` से मैप करता है। Legacy `--output-format json` overrides उसी usage normalization का उपयोग करते हैं।
- यदि CLI सीधे `stats.input` मान छोड़ देता है, तो OpenClaw
  `stats.input_tokens - stats.cached` से input tokens निकालता है।
- यह केवल usage normalization है। इसका मतलब यह नहीं है कि OpenClaw Gemini CLI के लिए
  Anthropic/OpenAI-शैली prompt-cache markers बना रहा है।

## सिस्टम-प्रॉम्प्ट कैश सीमा

OpenClaw सिस्टम प्रॉम्प्ट को एक **स्थिर प्रीफ़िक्स** और एक **अस्थिर
सफ़िक्स** में विभाजित करता है, जिन्हें एक आंतरिक cache-prefix boundary अलग करती है। सीमा के ऊपर की सामग्री
(tool definitions, skills metadata, workspace files, और अन्य
अपेक्षाकृत स्थिर संदर्भ) इस तरह क्रमबद्ध होती है कि वह टर्न्स में byte-identical बनी रहे।
सीमा के नीचे की सामग्री (उदाहरण के लिए `HEARTBEAT.md`, runtime timestamps, और
अन्य प्रति-टर्न metadata) cached
prefix को invalid किए बिना बदल सकती है।

मुख्य डिज़ाइन चुनाव:

- स्थिर workspace project-context files को `HEARTBEAT.md` से पहले क्रमबद्ध किया जाता है, ताकि
  heartbeat churn स्थिर prefix को bust न करे।
- सीमा Anthropic-family, OpenAI-family, Google, और
  CLI transport shaping में लागू होती है, ताकि सभी समर्थित प्रदाताओं को समान prefix
  stability से लाभ मिले।
- Codex Responses और Anthropic Vertex अनुरोध
  boundary-aware cache shaping के माध्यम से रूट किए जाते हैं, ताकि cache reuse प्रदाताओं को वास्तव में मिलने वाली सामग्री के साथ संरेखित रहे।
- System-prompt fingerprints सामान्यीकृत होते हैं (whitespace, line endings,
  hook-added context, runtime capability ordering), ताकि अर्थ की दृष्टि से अपरिवर्तित
  prompts टर्न्स में KV/cache साझा करें।

यदि आपको config या workspace change के बाद अप्रत्याशित `cacheWrite` spikes दिखें,
तो देखें कि बदलाव cache boundary के ऊपर आता है या नीचे। अस्थिर
content को boundary के नीचे ले जाना (या उसे स्थिर करना) अक्सर समस्या हल कर देता है।

## OpenClaw कैश-स्थिरता गार्ड

OpenClaw अनुरोध के प्रदाता तक पहुँचने से पहले कई cache-sensitive payload shapes को deterministic भी रखता है:

- Bundle MCP tool catalogs को tool
  registration से पहले deterministic ढंग से sort किया जाता है, ताकि `listTools()` order changes tools block को churn न करें और
  prompt-cache prefixes को bust न करें।
- persisted image blocks वाले legacy sessions **3 सबसे हालिया
  completed turns** को intact रखते हैं; पुराने already-processed image blocks को marker से
  बदला जा सकता है, ताकि image-heavy follow-ups बड़े
  stale payloads को बार-बार भेजते न रहें।

## ट्यूनिंग पैटर्न

### मिश्रित ट्रैफ़िक (अनुशंसित डिफ़ॉल्ट)

अपने मुख्य एजेंट पर long-lived baseline रखें, bursty notifier agents पर caching बंद करें:

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
- Heartbeat को अपने TTL से नीचे केवल उन agents के लिए रखें जिन्हें warm caches से लाभ मिलता है।

## कैश निदान

OpenClaw embedded agent runs के लिए समर्पित cache-trace diagnostics उजागर करता है।

सामान्य user-facing diagnostics के लिए, `/status` और अन्य usage summaries
`cacheRead` /
`cacheWrite` के लिए fallback source के रूप में latest transcript usage entry का उपयोग कर सकते हैं
जब live session entry में वे counters न हों।

## लाइव regression tests

OpenClaw repeated prefixes, tool turns, image turns, MCP-style tool transcripts, और Anthropic no-cache control के लिए एक combined live cache regression gate रखता है।

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

नैरो live gate चलाएँ:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

बेसलाइन फ़ाइल सबसे हाल में देखी गई लाइव संख्याओं के साथ-साथ टेस्ट द्वारा उपयोग किए जाने वाले provider-विशिष्ट regression floors को संग्रहीत करती है।
runner हर रन के लिए ताज़ा session IDs और prompt namespaces भी उपयोग करता है, ताकि पिछली cache स्थिति वर्तमान regression sample को प्रदूषित न करे।

ये tests जानबूझकर सभी providers में समान success criteria का उपयोग नहीं करते।

### Anthropic लाइव अपेक्षाएँ

- `cacheWrite` के ज़रिए स्पष्ट warmup writes की अपेक्षा करें।
- repeated turns पर लगभग पूरी history के reuse की अपेक्षा करें, क्योंकि Anthropic cache control बातचीत के दौरान cache breakpoint को आगे बढ़ाता है।
- वर्तमान live assertions अभी भी stable, tool, और image paths के लिए उच्च hit-rate thresholds का उपयोग करती हैं।

### OpenAI लाइव अपेक्षाएँ

- केवल `cacheRead` की अपेक्षा करें। `cacheWrite` `0` रहता है।
- repeated-turn cache reuse को provider-विशिष्ट plateau मानें, Anthropic-शैली moving full-history reuse नहीं।
- वर्तमान live assertions `gpt-5.4-mini` पर देखे गए live behavior से निकले conservative floor checks का उपयोग करती हैं:
  - stable prefix: `cacheRead >= 4608`, hit rate `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, hit rate `>= 0.85`
  - image transcript: `cacheRead >= 3840`, hit rate `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`, hit rate `>= 0.85`

2026-04-04 को ताज़ा combined live verification यहाँ पहुँची:

- stable prefix: `cacheRead=4864`, hit rate `0.966`
- tool transcript: `cacheRead=4608`, hit rate `0.896`
- image transcript: `cacheRead=4864`, hit rate `0.954`
- MCP-style transcript: `cacheRead=4608`, hit rate `0.891`

combined gate के लिए हाल का स्थानीय wall-clock time लगभग `88s` था।

assertions अलग क्यों हैं:

- Anthropic explicit cache breakpoints और moving conversation-history reuse उजागर करता है।
- OpenAI prompt caching अभी भी exact-prefix sensitive है, लेकिन live Responses traffic में प्रभावी reusable prefix पूरे prompt से पहले plateau हो सकता है।
- इस कारण, Anthropic और OpenAI की तुलना एक ही cross-provider percentage threshold से करने पर false regressions बनते हैं।

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

### Env toggles (एकबारगी debugging)

- `OPENCLAW_CACHE_TRACE=1` cache tracing सक्षम करता है।
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` output path को override करता है।
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` full message payload capture को toggle करता है।
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` prompt text capture को toggle करता है।
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` system prompt capture को toggle करता है।

### क्या inspect करें

- Cache trace events JSONL होते हैं और इनमें `session:loaded`, `prompt:before`, `stream:context`, और `session:after` जैसे staged snapshots शामिल होते हैं।
- Per-turn cache token impact सामान्य usage surfaces में `cacheRead` और `cacheWrite` के ज़रिए दिखता है, उदाहरण के लिए `/usage full` और session usage summaries।
- Anthropic के लिए, caching active होने पर `cacheRead` और `cacheWrite` दोनों की अपेक्षा करें।
- OpenAI के लिए, cache hits पर `cacheRead` की अपेक्षा करें। GPT-5.6 Responses prompt segments लिखे जाने के दौरान `cacheWrite` भी report कर सकते हैं; अन्य Responses payloads जो write counter छोड़ देते हैं, उसे `0` पर रखते हैं।
- यदि आपको request tracing चाहिए, तो request IDs और rate-limit headers को cache metrics से अलग log करें। OpenClaw का मौजूदा cache-trace output raw provider response headers के बजाय prompt/session shape और normalized token usage पर केंद्रित है।

## त्वरित troubleshooting

- अधिकांश turns पर उच्च `cacheWrite`: volatile system-prompt inputs की जाँच करें और सत्यापित करें कि model/provider आपकी cache settings का समर्थन करता है।
- Anthropic पर उच्च `cacheWrite`: अक्सर इसका मतलब होता है कि cache breakpoint ऐसे content पर आ रहा है जो हर request में बदलता है।
- कम OpenAI `cacheRead`: सत्यापित करें कि stable prefix शुरुआत में है, repeated prefix कम से कम 1024 tokens का है, और वही `prompt_cache_key` उन turns के लिए reuse हो रहा है जिन्हें cache share करना चाहिए।
- `cacheRetention` से कोई प्रभाव नहीं: पुष्टि करें कि model key `agents.defaults.models["provider/model"]` से match करता है।
- cache settings के साथ Bedrock Nova/Mistral requests: runtime force से `none` अपेक्षित है।

संबंधित docs:

- [Anthropic](/hi/providers/anthropic)
- [Token use और costs](/hi/reference/token-use)
- [Session pruning](/hi/concepts/session-pruning)
- [Gateway configuration reference](/hi/gateway/configuration-reference)

## संबंधित

- [Token use और costs](/hi/reference/token-use)
- [API usage और costs](/hi/reference/api-usage-costs)
