---
read_when:
    - आप cache retention के साथ prompt token लागतों को कम करना चाहते हैं
    - बहु-एजेंट सेटअप में आपको प्रति-एजेंट कैश व्यवहार चाहिए
    - आप Heartbeat और cache-ttl छंटाई को साथ-साथ ट्यून कर रहे हैं
summary: प्रॉम्प्ट कैशिंग नियंत्रण, विलय क्रम, प्रदाता व्यवहार, और ट्यूनिंग पैटर्न
title: प्रॉम्प्ट कैशिंग
x-i18n:
    generated_at: "2026-07-01T18:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

प्रॉम्प्ट कैशिंग का अर्थ है कि मॉडल प्रदाता हर बार उन्हें दोबारा प्रोसेस करने के बजाय टर्नों में अपरिवर्तित प्रॉम्प्ट प्रीफिक्स (आमतौर पर सिस्टम/डेवलपर निर्देश और अन्य स्थिर संदर्भ) का पुन: उपयोग कर सकता है। OpenClaw प्रदाता उपयोग को `cacheRead` और `cacheWrite` में सामान्यीकृत करता है, जहां upstream API उन काउंटरों को सीधे उजागर करता है।

जब live session snapshot में कैश काउंटर मौजूद नहीं होते, तो status सतहें सबसे हालिया transcript
usage log से भी कैश काउंटर पुनर्प्राप्त कर सकती हैं, ताकि `/status` आंशिक session metadata loss के बाद भी
कैश लाइन दिखाता रहे। मौजूदा nonzero live
cache values अब भी transcript fallback values पर प्राथमिकता रखते हैं।

यह क्यों मायने रखता है: कम टोकन लागत, तेज प्रतिक्रियाएं, और लंबे समय तक चलने वाले सेशनों के लिए अधिक पूर्वानुमेय प्रदर्शन। कैशिंग के बिना, दोहराए गए प्रॉम्प्ट हर टर्न पर पूरी प्रॉम्प्ट लागत चुकाते हैं, भले ही अधिकांश इनपुट नहीं बदला हो।

नीचे के अनुभाग हर उस cache-related knob को कवर करते हैं जो प्रॉम्प्ट reuse और token cost को प्रभावित करता है।

Provider संदर्भ:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API headers and request IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request IDs and errors: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## प्राथमिक knobs

### `cacheRetention` (global default, model, और per-agent)

सभी मॉडलों के लिए global default के रूप में cache retention सेट करें:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

per-model override करें:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Per-agent override:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Config merge order:

1. `agents.defaults.params` (global default — सभी मॉडलों पर लागू होता है)
2. `agents.defaults.models["provider/model"].params` (per-model override)
3. `agents.list[].params` (matching agent id; key के आधार पर override करता है)

### `contextPruning.mode: "cache-ttl"`

cache TTL windows के बाद पुराने tool-result context को prune करता है ताकि post-idle requests oversized history को दोबारा cache न करें।

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

पूर्ण व्यवहार के लिए [Session Pruning](/hi/concepts/session-pruning) देखें।

### Heartbeat keep-warm

Heartbeat cache windows को warm रख सकता है और idle gaps के बाद दोहराए गए cache writes को कम कर सकता है।

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Per-agent heartbeat `agents.list[].heartbeat` पर समर्थित है।

## Provider व्यवहार

### Anthropic (direct API)

- `cacheRetention` समर्थित है।
- Anthropic API-key auth profiles के साथ, जब unset हो तो OpenClaw Anthropic model refs के लिए `cacheRetention: "short"` seed करता है।
- Anthropic native Messages responses `cache_read_input_tokens` और `cache_creation_input_tokens` दोनों expose करते हैं, इसलिए OpenClaw `cacheRead` और `cacheWrite` दोनों दिखा सकता है।
- native Anthropic requests के लिए, `cacheRetention: "short"` default 5-minute ephemeral cache पर map होता है, और `cacheRetention: "long"` केवल direct `api.anthropic.com` hosts पर 1-hour TTL में upgrade करता है।

### OpenAI (direct API)

- समर्थित recent models पर prompt caching automatic है। OpenClaw को block-level cache markers inject करने की जरूरत नहीं है।
- OpenClaw turns में cache routing stable रखने के लिए `prompt_cache_key` का उपयोग करता है। Direct OpenAI hosts `cacheRetention: "long"` चुने जाने पर `prompt_cache_retention: "24h"` का उपयोग करते हैं।
- OpenAI-compatible Completions providers को `prompt_cache_key` केवल तब मिलता है जब उनका model config स्पष्ट रूप से `compat.supportsPromptCacheKey: true` सेट करता है। Long-retention forwarding एक अलग capability है: explicit `cacheRetention: "long"` `prompt_cache_retention: "24h"` केवल तब भेजता है जब वह compat entry long cache retention को भी support करती हो। Mistral जैसे Providers cache keys में opt in कर सकते हैं और long-retention field को suppress करने के लिए `compat.supportsLongCacheRetention: false` सेट कर सकते हैं। `cacheRetention: "none"` दोनों fields को suppress करता है।
- OpenAI responses cached prompt tokens को `usage.prompt_tokens_details.cached_tokens` (या Responses API events पर `input_tokens_details.cached_tokens`) के माध्यम से expose करते हैं। OpenClaw उसे `cacheRead` पर map करता है।
- GPT-5.6 Responses usage `input_tokens_details.cache_write_tokens` भी expose कर सकता है। OpenClaw उसे `cacheWrite` पर map करता है और model की cache-write rate पर उसकी कीमत लगाता है; जो Responses field omit करते हैं, वे `cacheWrite` को `0` पर रखते हैं।
- OpenAI `x-request-id`, `openai-processing-ms`, और `x-ratelimit-*` जैसे उपयोगी tracing और rate-limit headers लौटाता है, लेकिन cache-hit accounting usage payload से आनी चाहिए, headers से नहीं।
- व्यवहार में, OpenAI अक्सर Anthropic-style moving full-history reuse के बजाय initial-prefix cache जैसा व्यवहार करता है। Stable long-prefix text turns मौजूदा live probes में लगभग `4864` cached-token plateau के पास land कर सकते हैं, जबकि tool-heavy या MCP-style transcripts exact repeats पर भी अक्सर लगभग `4608` cached tokens के पास plateau करते हैं।

### Anthropic Vertex

- Vertex AI (`anthropic-vertex/*`) पर Anthropic models direct Anthropic की तरह ही `cacheRetention` support करते हैं।
- `cacheRetention: "long"` Vertex AI endpoints पर वास्तविक 1-hour prompt-cache TTL पर map होता है।
- `anthropic-vertex` के लिए default cache retention direct Anthropic defaults से match करता है।
- Vertex requests boundary-aware cache shaping के माध्यम से route किए जाते हैं ताकि cache reuse providers को वास्तव में मिलने वाली चीज़ों से aligned रहे।

### Amazon Bedrock

- Anthropic Claude model refs (`amazon-bedrock/*anthropic.claude*`) explicit `cacheRetention` pass-through support करते हैं।
- Non-Anthropic Bedrock models runtime पर forced to `cacheRetention: "none"` होते हैं।

### OpenRouter models

`openrouter/anthropic/*` model refs के लिए, OpenClaw prompt-cache
reuse सुधारने के लिए system/developer prompt blocks पर Anthropic
`cache_control` inject करता है, केवल तब जब request अभी भी verified OpenRouter route
(`openrouter` उसके default endpoint पर, या कोई भी provider/base URL जो
`openrouter.ai` पर resolve होता है) को target कर रही हो।

`openrouter/deepseek/*`, `openrouter/moonshot*/*`, और `openrouter/zai/*`
model refs के लिए, `contextPruning.mode: "cache-ttl"` allowed है क्योंकि OpenRouter
provider-side prompt caching automatically handle करता है। OpenClaw उन requests में
Anthropic `cache_control` markers inject नहीं करता।

DeepSeek cache construction best-effort है और इसमें कुछ सेकंड लग सकते हैं। एक
immediate follow-up अब भी `cached_tokens: 0` दिखा सकता है; थोड़ी देरी के बाद repeated
same-prefix request से verify करें और cache-hit signal के रूप में `usage.prompt_tokens_details.cached_tokens`
का उपयोग करें।

यदि आप model को किसी arbitrary OpenAI-compatible proxy URL पर repoint करते हैं, तो OpenClaw
उन OpenRouter-specific Anthropic cache markers को inject करना बंद कर देता है।

### अन्य providers

यदि provider इस cache mode को support नहीं करता, तो `cacheRetention` का कोई प्रभाव नहीं होता।

### Google Gemini direct API

- Direct Gemini transport (`api: "google-generative-ai"`) upstream `cachedContentTokenCount` के माध्यम से cache hits
  report करता है; OpenClaw उसे `cacheRead` पर map करता है।
- जब direct Gemini model पर `cacheRetention` सेट होता है, तो OpenClaw Google AI Studio runs पर system prompts के लिए
  `cachedContents` resources automatically create, reuse, और refresh करता है। इसका अर्थ है कि अब आपको cached-content handle manually pre-create करने की जरूरत नहीं है।
- आप configured model पर `params.cachedContent` (या legacy `params.cached_content`) के रूप में pre-existing Gemini cached-content handle अब भी pass कर सकते हैं।
- यह Anthropic/OpenAI prompt-prefix caching से अलग है। Gemini के लिए,
  OpenClaw request में cache markers inject करने के बजाय provider-native `cachedContents` resource manage करता है।

### Gemini CLI usage

- Gemini CLI `stream-json` output `stats.cached` के माध्यम से cache hits surface कर सकता है;
  OpenClaw उसे `cacheRead` पर map करता है। Legacy `--output-format json` overrides वही usage normalization उपयोग करते हैं।
- यदि CLI direct `stats.input` value omit करता है, तो OpenClaw input tokens को
  `stats.input_tokens - stats.cached` से derive करता है।
- यह केवल usage normalization है। इसका अर्थ यह नहीं है कि OpenClaw Gemini CLI के लिए
  Anthropic/OpenAI-style prompt-cache markers create कर रहा है।

## System-prompt cache boundary

OpenClaw system prompt को एक **stable prefix** और एक **volatile
suffix** में split करता है, जिन्हें internal cache-prefix boundary अलग करती है। Boundary के ऊपर की सामग्री
(tool definitions, skills metadata, workspace files, और अन्य
relatively static context) इस तरह ordered होती है कि वह turns में byte-identical रहे।
Boundary के नीचे की सामग्री (उदाहरण के लिए `HEARTBEAT.md`, runtime timestamps, और
अन्य per-turn metadata) cached
prefix को invalid किए बिना बदल सकती है।

मुख्य design choices:

- Stable workspace project-context files को `HEARTBEAT.md` से पहले ordered किया जाता है ताकि
  heartbeat churn stable prefix को bust न करे।
- Boundary Anthropic-family, OpenAI-family, Google, और
  CLI transport shaping में apply की जाती है ताकि सभी supported providers को उसी prefix
  stability से benefit मिले।
- Codex Responses और Anthropic Vertex requests
  boundary-aware cache shaping के माध्यम से route किए जाते हैं ताकि cache reuse providers को
  वास्तव में मिलने वाली चीज़ों से aligned रहे।
- System-prompt fingerprints normalized होते हैं (whitespace, line endings,
  hook-added context, runtime capability ordering) ताकि semantically unchanged
  prompts turns में KV/cache share करें।

यदि config या workspace change के बाद unexpected `cacheWrite` spikes दिखें,
तो जांचें कि change cache boundary के ऊपर land करता है या नीचे। Volatile content को
boundary के नीचे move करना (या उसे stabilize करना) अक्सर issue resolve करता है।

## OpenClaw cache-stability guards

OpenClaw request के provider तक पहुंचने से पहले कई cache-sensitive payload shapes को deterministic भी रखता है:

- Bundle MCP tool catalogs tool
  registration से पहले deterministically sorted होते हैं, ताकि `listTools()` order changes tools block को churn न करें और
  prompt-cache prefixes को bust न करें।
- Persisted image blocks वाले legacy sessions **3 most recent
  completed turns** intact रखते हैं; पुराने already-processed image blocks को
  marker से replace किया जा सकता है ताकि image-heavy follow-ups large
  stale payloads को दोबारा भेजते न रहें।

## Tuning patterns

### Mixed traffic (recommended default)

अपने main agent पर long-lived baseline रखें, bursty notifier agents पर caching disable करें:

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

### Cost-first baseline

- Baseline `cacheRetention: "short"` सेट करें।
- `contextPruning.mode: "cache-ttl"` enable करें।
- केवल उन agents के लिए heartbeat को अपने TTL से कम रखें जिन्हें warm caches से benefit होता है।

## Cache diagnostics

OpenClaw embedded agent runs के लिए dedicated cache-trace diagnostics expose करता है।

Normal user-facing diagnostics के लिए, `/status` और अन्य usage summaries
`cacheRead` /
`cacheWrite` के लिए fallback source के रूप में latest transcript usage entry का उपयोग कर सकते हैं
जब live session entry में वे counters नहीं होते।

## Live regression tests

OpenClaw repeated prefixes, tool turns, image turns, MCP-style tool transcripts, और Anthropic no-cache control के लिए एक combined live cache regression gate रखता है।

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Narrow live gate इस तरह run करें:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

बेसलाइन फ़ाइल सबसे हाल ही में देखी गई लाइव संख्याएँ और परीक्षण द्वारा उपयोग की जाने वाली प्रदाता-विशिष्ट रिग्रेशन न्यूनतम सीमाएँ संग्रहीत करती है।
रनर ताज़ा प्रति-रन सेशन ID और प्रॉम्प्ट नेमस्पेस भी उपयोग करता है ताकि पिछली कैश स्थिति वर्तमान रिग्रेशन नमूने को प्रदूषित न करे।

ये परीक्षण जानबूझकर सभी प्रदाताओं में समान सफलता मानदंडों का उपयोग नहीं करते।

### Anthropic लाइव अपेक्षाएँ

- `cacheWrite` के माध्यम से स्पष्ट वार्मअप writes की अपेक्षा करें।
- दोहराए गए turns पर लगभग पूरे इतिहास के पुनः उपयोग की अपेक्षा करें, क्योंकि Anthropic cache control बातचीत के माध्यम से कैश ब्रेकपॉइंट को आगे बढ़ाता है।
- मौजूदा लाइव assertions अभी भी stable, tool, और image पथों के लिए उच्च hit-rate thresholds का उपयोग करती हैं।

### OpenAI लाइव अपेक्षाएँ

- केवल `cacheRead` की अपेक्षा करें। `cacheWrite` `0` ही रहता है।
- repeated-turn cache reuse को Anthropic-शैली के moving full-history reuse के बजाय प्रदाता-विशिष्ट plateau मानें।
- मौजूदा लाइव assertions `gpt-5.4-mini` पर देखे गए लाइव व्यवहार से निकले conservative floor checks का उपयोग करती हैं:
  - stable prefix: `cacheRead >= 4608`, hit rate `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, hit rate `>= 0.85`
  - image transcript: `cacheRead >= 3840`, hit rate `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`, hit rate `>= 0.85`

2026-04-04 पर ताज़ा संयुक्त लाइव verification यहाँ पहुँचा:

- stable prefix: `cacheRead=4864`, hit rate `0.966`
- tool transcript: `cacheRead=4608`, hit rate `0.896`
- image transcript: `cacheRead=4864`, hit rate `0.954`
- MCP-style transcript: `cacheRead=4608`, hit rate `0.891`

संयुक्त gate के लिए हालिया स्थानीय wall-clock समय लगभग `88s` था।

assertions अलग क्यों हैं:

- Anthropic स्पष्ट cache breakpoints और moving conversation-history reuse उजागर करता है।
- OpenAI prompt caching अभी भी exact-prefix sensitive है, लेकिन लाइव Responses traffic में प्रभावी reusable prefix पूरे prompt से पहले plateau हो सकता है।
- इसके कारण, Anthropic और OpenAI की तुलना एक ही cross-provider percentage threshold से करने पर false regressions बनते हैं।

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

### Env toggles (एक-बार debugging)

- `OPENCLAW_CACHE_TRACE=1` cache tracing सक्षम करता है।
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` output path को override करता है।
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` full message payload capture को toggle करता है।
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` prompt text capture को toggle करता है।
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` system prompt capture को toggle करता है।

### क्या inspect करें

- Cache trace events JSONL होते हैं और `session:loaded`, `prompt:before`, `stream:context`, और `session:after` जैसे staged snapshots शामिल करते हैं।
- Per-turn cache token impact सामान्य usage surfaces में `cacheRead` और `cacheWrite` के माध्यम से दिखाई देता है (उदाहरण के लिए `/usage tokens`, `/status`, session usage summaries, और custom `messages.usageTemplate` layouts)।
- Anthropic के लिए, caching सक्रिय होने पर `cacheRead` और `cacheWrite` दोनों की अपेक्षा करें।
- OpenAI के लिए, cache hits पर `cacheRead` की अपेक्षा करें। GPT-5.6 Responses prompt segments लिखे जाते समय `cacheWrite` भी report कर सकते हैं; अन्य Responses payloads जो write counter छोड़ देते हैं, उसे `0` पर रखते हैं।
- यदि आपको request tracing चाहिए, तो request IDs और rate-limit headers को cache metrics से अलग log करें। OpenClaw का मौजूदा cache-trace output raw provider response headers के बजाय prompt/session shape और normalized token usage पर केंद्रित है।

## त्वरित troubleshooting

- अधिकांश turns पर उच्च `cacheWrite`: volatile system-prompt inputs की जाँच करें और verify करें कि model/provider आपकी cache settings का समर्थन करता है।
- Anthropic पर उच्च `cacheWrite`: अक्सर इसका मतलब है कि cache breakpoint ऐसी content पर landing कर रहा है जो हर request में बदलती है।
- कम OpenAI `cacheRead`: verify करें कि stable prefix front पर है, repeated prefix कम से कम 1024 tokens है, और वही `prompt_cache_key` उन turns के लिए reuse होता है जिन्हें cache साझा करना चाहिए।
- `cacheRetention` से कोई प्रभाव नहीं: confirm करें कि model key `agents.defaults.models["provider/model"]` से मेल खाती है।
- cache settings के साथ Bedrock Nova/Mistral requests: runtime द्वारा `none` पर force किया जाना expected है।

संबंधित docs:

- [Anthropic](/hi/providers/anthropic)
- [Token use and costs](/hi/reference/token-use)
- [Session pruning](/hi/concepts/session-pruning)
- [Gateway configuration reference](/hi/gateway/configuration-reference)

## संबंधित

- [Token use and costs](/hi/reference/token-use)
- [API usage and costs](/hi/reference/api-usage-costs)
