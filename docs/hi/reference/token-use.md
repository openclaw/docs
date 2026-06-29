---
read_when:
    - टोकन उपयोग, लागतों, या संदर्भ विंडो की व्याख्या
    - Debugging संदर्भ वृद्धि या Compaction व्यवहार
summary: OpenClaw प्रॉम्प्ट संदर्भ कैसे बनाता है और टोकन उपयोग + लागतों की रिपोर्ट कैसे करता है
title: टोकन उपयोग और लागत
x-i18n:
    generated_at: "2026-06-29T00:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw **टोकन** ट्रैक करता है, वर्ण नहीं। टोकन मॉडल-विशिष्ट होते हैं, लेकिन अधिकतर
OpenAI-style मॉडल अंग्रेज़ी टेक्स्ट के लिए औसतन प्रति टोकन ~4 वर्ण लेते हैं।

## सिस्टम प्रॉम्प्ट कैसे बनाया जाता है

OpenClaw हर रन पर अपना सिस्टम प्रॉम्प्ट असेंबल करता है। इसमें शामिल हैं:

- टूल सूची + छोटे विवरण
- Skills सूची (केवल मेटाडेटा; निर्देश जरूरत पड़ने पर `read` से लोड किए जाते हैं)।
  Native Codex टर्न को टर्न-स्कोप्ड सहयोग डेवलपर निर्देशों के रूप में कॉम्पैक्ट Skills ब्लॉक मिलता है;
  अन्य हार्नेस इसे सामान्य प्रॉम्प्ट सतह में प्राप्त करते हैं। यह
  `skills.limits.maxSkillsPromptChars` से सीमित होता है, और वैकल्पिक प्रति-एजेंट ओवरराइड
  `agents.list[].skillsLimits.maxSkillsPromptChars` पर होता है।
- सेल्फ-अपडेट निर्देश
- वर्कस्पेस + बूटस्ट्रैप फ़ाइलें (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` जब नई हो, साथ ही `MEMORY.md` जब मौजूद हो)। Native Codex टर्न उस कॉन्फ़िगर किए गए एजेंट वर्कस्पेस से कच्चा `MEMORY.md` पेस्ट नहीं करते जब उस वर्कस्पेस के लिए मेमोरी टूल उपलब्ध होते हैं; वे टर्न-स्कोप्ड सहयोग डेवलपर निर्देशों में एक छोटा मेमोरी पॉइंटर शामिल करते हैं और जरूरत पड़ने पर मेमोरी टूल इस्तेमाल करते हैं। अगर टूल अक्षम हैं, मेमोरी खोज उपलब्ध नहीं है, या सक्रिय वर्कस्पेस एजेंट मेमोरी वर्कस्पेस से अलग है, तो `MEMORY.md` सामान्य सीमित टर्न-कॉन्टेक्स्ट पथ का उपयोग करता है। लोअरकेस रूट `memory.md` इंजेक्ट नहीं किया जाता; `MEMORY.md` के साथ जोड़े जाने पर यह `openclaw doctor --fix` के लिए लीगेसी रिपेयर इनपुट है। बड़ी इंजेक्टेड फ़ाइलें `agents.defaults.bootstrapMaxChars` (डिफ़ॉल्ट: 20000) से ट्रंकैट की जाती हैं, और कुल बूटस्ट्रैप इंजेक्शन `agents.defaults.bootstrapTotalMaxChars` (डिफ़ॉल्ट: 60000) से कैप होता है। `memory/*.md` दैनिक फ़ाइलें सामान्य बूटस्ट्रैप प्रॉम्प्ट का हिस्सा नहीं हैं; वे सामान्य टर्न पर मेमोरी टूल के जरिए ऑन-डिमांड रहती हैं, लेकिन रीसेट/स्टार्टअप मॉडल रन पहले टर्न के लिए हाल की दैनिक मेमोरी वाला वन-शॉट स्टार्टअप-कॉन्टेक्स्ट ब्लॉक प्रीपेंड कर सकते हैं। बेयर चैट `/new` और `/reset` कमांड मॉडल को invoke किए बिना स्वीकार किए जाते हैं। स्टार्टअप प्रील्यूड `agents.defaults.startupContext` से नियंत्रित होता है। पोस्ट-Compaction AGENTS.md अंश अलग होते हैं और स्पष्ट `agents.defaults.compaction.postCompactionSections` ऑप्ट-इन मांगते हैं।
- समय (UTC + उपयोगकर्ता टाइमज़ोन)
- रिप्लाई टैग + Heartbeat व्यवहार
- रनटाइम मेटाडेटा (होस्ट/OS/मॉडल/thinking)

पूरा ब्रेकडाउन [सिस्टम प्रॉम्प्ट](/hi/concepts/system-prompt) में देखें।

क्रेडेंशियल या ऑथ स्निपेट का दस्तावेज़ बनाते समय, docs-only बदलावों में
सीक्रेट-स्कैनर false positives से बचने के लिए
[सीक्रेट प्लेसहोल्डर परंपराएं](/hi/reference/secret-placeholder-conventions) इस्तेमाल करें।

## कॉन्टेक्स्ट विंडो में क्या गिना जाता है

मॉडल को मिलने वाली हर चीज़ कॉन्टेक्स्ट सीमा में गिनी जाती है:

- सिस्टम प्रॉम्प्ट (ऊपर सूचीबद्ध सभी सेक्शन)
- बातचीत का इतिहास (यूज़र + असिस्टेंट संदेश)
- टूल कॉल और टूल परिणाम
- अटैचमेंट/ट्रांसक्रिप्ट (चित्र, ऑडियो, फ़ाइलें)
- Compaction सारांश और pruning artifacts
- प्रोवाइडर wrappers या safety headers (दिखते नहीं हैं, लेकिन फिर भी गिने जाते हैं)

कुछ runtime-heavy सतहों की अपनी स्पष्ट कैप होती हैं:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

प्रति-एजेंट ओवरराइड `agents.list[].contextLimits` के अंतर्गत होते हैं। ये नॉब
सीमित रनटाइम अंशों और इंजेक्ट किए गए runtime-owned ब्लॉकों के लिए हैं। ये
बूटस्ट्रैप सीमाओं, स्टार्टअप-कॉन्टेक्स्ट सीमाओं, और Skills प्रॉम्प्ट
सीमाओं से अलग हैं।

`toolResultMaxChars` एक उन्नत सीलिंग है (`1000000` वर्णों तक)। जब यह अनसेट हो, OpenClaw
प्रभावी मॉडल कॉन्टेक्स्ट विंडो से लाइव टूल-रिज़ल्ट कैप चुनता है: 100K टोकन से
नीचे `16000` chars, 100K+ टोकन पर `32000` chars, और 200K+ टोकन पर `64000` chars,
फिर भी runtime context-share guard से सीमित।

चित्रों के लिए, OpenClaw प्रोवाइडर कॉल से पहले transcript/tool image payloads को downscale करता है।
इसे ट्यून करने के लिए `agents.defaults.imageMaxDimensionPx` (डिफ़ॉल्ट: `1200`) इस्तेमाल करें:

- कम मान आम तौर पर vision-token उपयोग और payload आकार कम करते हैं।
- अधिक मान OCR/UI-heavy स्क्रीनशॉट के लिए अधिक visual detail बचाते हैं।

व्यावहारिक ब्रेकडाउन (प्रति इंजेक्टेड फ़ाइल, टूल, Skills, और सिस्टम प्रॉम्प्ट आकार) के लिए `/context list` या `/context detail` इस्तेमाल करें। [कॉन्टेक्स्ट](/hi/concepts/context) देखें।

## वर्तमान टोकन उपयोग कैसे देखें

चैट में इन्हें इस्तेमाल करें:

- `/status` → सत्र मॉडल, कॉन्टेक्स्ट उपयोग,
  अंतिम response input/output टोकन, और सक्रिय मॉडल के लिए local pricing
  कॉन्फ़िगर होने पर **अनुमानित लागत** वाला **इमोजी-समृद्ध स्टेटस कार्ड**।
- `/usage off|tokens|full` → हर रिप्लाई में **प्रति-response usage footer** जोड़ता है।
  - प्रति सत्र persist होता है (`responseUsage` के रूप में संग्रहीत)।
  - `/usage reset` (aliases: `inherit`, `clear`, `default`) — सत्र
    ओवरराइड साफ करता है ताकि सत्र कॉन्फ़िगर किए गए डिफ़ॉल्ट को फिर से inherit करे।
  - `/usage full` अनुमानित लागत केवल तब दिखाता है जब OpenClaw के पास usage metadata और
    सक्रिय मॉडल के लिए local pricing हो। अन्यथा यह केवल टोकन दिखाता है।
- `/usage cost` → OpenClaw सत्र लॉग से स्थानीय लागत सारांश दिखाता है।

अन्य सतहें:

- **TUI/Web TUI:** `/status` + `/usage` समर्थित हैं।
- **CLI:** `openclaw status --usage` और `openclaw channels list`
  normalized provider quota windows (`X% left`, per-response costs नहीं) दिखाते हैं।
  वर्तमान usage-window प्रोवाइडर: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, और z.ai।

Usage सतहें display से पहले common provider-native field aliases को normalize करती हैं।
OpenAI-family Responses traffic के लिए, इसमें `input_tokens` /
`output_tokens` और `prompt_tokens` / `completion_tokens` दोनों शामिल हैं, ताकि transport-specific
field names `/status`, `/usage`, या session summaries न बदलें।
Gemini CLI usage भी normalized है: डिफ़ॉल्ट `stream-json` parser assistant
`message` events पढ़ता है, और `stats.cached` `cacheRead` पर map होता है, जिसमें
CLI द्वारा explicit `stats.input` field छोड़ने पर `stats.input_tokens - stats.cached`
इस्तेमाल किया जाता है। Legacy JSON overrides अभी भी reply text
`response` से पढ़ते हैं।
Native OpenAI-family Responses traffic के लिए, WebSocket/SSE usage aliases भी
उसी तरह normalized होते हैं, और `total_tokens` missing या `0` होने पर totals
normalized input + output पर fall back करते हैं।
जब वर्तमान सत्र snapshot sparse हो, `/status` और `session_status`
सबसे हाल के transcript usage log से token/cache counters और active runtime model label भी
recover कर सकते हैं। मौजूदा nonzero live values अभी भी transcript fallback values पर
precedence लेते हैं, और stored totals missing या छोटे होने पर बड़े prompt-oriented
transcript totals जीत सकते हैं।
Provider quota windows के लिए usage auth उपलब्ध होने पर provider-specific hooks से आता है;
अन्यथा OpenClaw auth profiles, env, या config से matching OAuth/API-key credentials
पर fall back करता है।
Assistant transcript entries वही normalized usage shape persist करती हैं, जिसमें
`usage.cost` शामिल है जब active model के लिए pricing configured हो और provider
usage metadata लौटाए। यह live runtime state gone होने के बाद भी `/usage cost` और transcript-backed session
status को stable source देता है।

OpenClaw provider usage accounting को वर्तमान context
snapshot से अलग रखता है। Provider `usage.total` में cached input, output, और कई
tool-loop model calls शामिल हो सकते हैं, इसलिए यह cost और telemetry के लिए उपयोगी है लेकिन
live context window को overstate कर सकता है। Context displays और diagnostics `context.used` के लिए latest prompt
snapshot (`promptTokens`, या prompt snapshot उपलब्ध न होने पर last model call)
इस्तेमाल करते हैं।

## लागत अनुमान (जब दिखाया जाए)

लागत आपके model pricing config से अनुमानित होती है:

```
models.providers.<provider>.models[].cost
```

ये `input`, `output`, `cacheRead`, और
`cacheWrite` के लिए **USD प्रति 1M tokens** हैं। अगर pricing missing है, OpenClaw केवल tokens दिखाता है। Cost display
API-key auth तक सीमित नहीं है: `aws-sdk` जैसे non-API-key providers
estimated cost दिखा सकते हैं जब उनकी configured model entry में local pricing शामिल हो और
provider usage metadata लौटाए।

Sidecars और channels के Gateway ready path तक पहुंचने के बाद, OpenClaw उन configured model refs के लिए
optional background pricing bootstrap शुरू करता है जिनके पास पहले से
local pricing नहीं है। वह bootstrap remote OpenRouter और LiteLLM
pricing catalogs fetch करता है। Offline या restricted networks पर वे catalog
fetches छोड़ने के लिए `models.pricing.enabled: false` सेट करें; explicit
`models.providers.*.models[].cost` entries local cost
estimates चलाती रहती हैं।

## Cache TTL और pruning प्रभाव

Provider prompt caching केवल cache TTL window के भीतर लागू होती है। OpenClaw
वैकल्पिक रूप से **cache-ttl pruning** चला सकता है: cache TTL expire हो जाने पर यह session prune करता है,
फिर cache window reset करता है ताकि बाद के requests full history को re-cache करने के बजाय
freshly cached context फिर से use कर सकें। यह TTL के बाद session idle होने पर cache
write costs कम रखता है।

इसे [Gateway configuration](/hi/gateway/configuration) में configure करें और
behavior details [Session pruning](/hi/concepts/session-pruning) में देखें।

Heartbeat idle gaps में cache को **warm** रख सकता है। अगर आपके model cache TTL
`1h` है, तो heartbeat interval उससे थोड़ा कम (जैसे, `55m`) सेट करने से
full prompt को re-cache करने से बचा जा सकता है, जिससे cache write costs घटती हैं।

Multi-agent setups में, आप एक shared model config रख सकते हैं और cache behavior को
`agents.list[].params.cacheRetention` के साथ प्रति agent tune कर सकते हैं।

पूरी knob-by-knob guide के लिए, [Prompt Caching](/hi/reference/prompt-caching) देखें।

Anthropic API pricing के लिए, cache reads input
tokens से काफी सस्ते होते हैं, जबकि cache writes अधिक multiplier पर bill होते हैं। Latest rates और TTL multipliers के लिए Anthropic की
prompt caching pricing देखें:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### उदाहरण: heartbeat के साथ 1h cache warm रखें

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### उदाहरण: प्रति-agent cache strategy के साथ mixed traffic

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` selected model के `params` के ऊपर merge होता है, ताकि आप
केवल `cacheRetention` override कर सकें और अन्य model defaults unchanged inherit कर सकें।

### Anthropic 1M context

OpenClaw Opus 4.8, Opus 4.7, Opus 4.6, और
Sonnet 4.6 जैसे GA-सक्षम Claude 4.x models को Anthropic की 1M context window के साथ size करता है। उन models के लिए आपको
`params.context1m: true` की जरूरत नहीं है।

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

पुराने configs `context1m: true` रख सकते हैं, लेकिन OpenClaw अब इस setting के लिए
Anthropic का retired `context-1m-2025-08-07` beta header नहीं भेजता और
unsupported older Claude models को 1M तक expand नहीं करता।

आवश्यकता: credential long-context usage के लिए eligible होना चाहिए। अगर नहीं,
Anthropic उस request के लिए provider-side rate limit error से respond करता है।

अगर आप Anthropic को OAuth/subscription tokens (`sk-ant-oat-*`) से authenticate करते हैं,
तो OpenClaw OAuth-required Anthropic beta headers preserve करता है और
retired `context-1m-*` beta अगर older config में रहता है तो उसे strip करता है।

## टोकन दबाव कम करने के सुझाव

- लंबे sessions summarize करने के लिए `/compact` इस्तेमाल करें।
- अपने workflows में बड़े tool outputs trim करें।
- Screenshot-heavy sessions के लिए `agents.defaults.imageMaxDimensionPx` कम करें।
- Skill descriptions छोटे रखें (skill list prompt में injected होती है)।
- Verbose, exploratory work के लिए छोटे models को prefer करें।

Exact skill list overhead formula के लिए [Skills](/hi/tools/skills) देखें।

## संबंधित

- [API उपयोग और लागत](/hi/reference/api-usage-costs)
- [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching)
- [उपयोग ट्रैकिंग](/hi/concepts/usage-tracking)
