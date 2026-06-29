---
read_when:
    - आप समझना चाहते हैं कि कौन-सी सुविधाएँ paid APIs को कॉल कर सकती हैं
    - आपको keys, costs, और usage visibility का ऑडिट करना होगा
    - आप /status या /usage लागत रिपोर्टिंग समझा रहे हैं
summary: पैसे खर्च कर सकने वाली चीज़ों, उपयोग की जाने वाली कुंजियों, और उपयोग देखने के तरीके का ऑडिट करें
title: API उपयोग और लागतें
x-i18n:
    generated_at: "2026-06-29T00:05:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

यह दस्तावेज़ **उन सुविधाओं को सूचीबद्ध करता है जो API कुंजियाँ invoke कर सकती हैं** और उनकी लागत कहाँ दिखाई देती है। यह उन
OpenClaw सुविधाओं पर केंद्रित है जो provider उपयोग या paid API calls उत्पन्न कर सकती हैं.

## लागत कहाँ दिखाई देती है (chat + CLI)

**प्रति-सत्र लागत snapshot**

- `/status` वर्तमान session model, context usage, और last response tokens दिखाता है।
- यदि OpenClaw के पास active model के लिए usage metadata और local pricing है,
  तो `/status` last reply के लिए **अनुमानित लागत** भी दिखाता है। इसमें
  स्पष्ट रूप से priced non-API-key providers जैसे Bedrock `aws-sdk` models शामिल हो सकते हैं।
- यदि live session metadata sparse है, तो `/status` latest transcript usage
  entry से token/cache counters और active runtime model label recover कर सकता है।
  मौजूदा nonzero live values फिर भी प्राथमिकता लेती हैं, और prompt-sized
  transcript totals तब जीत सकते हैं जब stored totals missing या smaller हों।

**प्रति-संदेश लागत footer**

- `/usage full` हर reply में usage footer जोड़ता है, जिसमें **अनुमानित लागत**
  शामिल होती है जब active model के लिए local pricing configured हो और usage metadata
  उपलब्ध हो।
- `/usage tokens` केवल tokens दिखाता है; subscription-style OAuth/token और CLI flows
  तब तक केवल tokens ही दिखाते हैं जब तक वह runtime compatible usage metadata
  उपलब्ध न कराए और explicit local price configured न हो।
- Gemini CLI नोट: default `stream-json` output और legacy JSON overrides
  दोनों usage को `stats` से पढ़ते हैं, `stats.cached` को `cacheRead` में normalize करते हैं, और
  जरूरत पड़ने पर `stats.input_tokens - stats.cached` से input tokens derive करते हैं।

Anthropic नोट: Anthropic staff ने हमें बताया कि OpenClaw-style Claude CLI usage
फिर से allowed है, इसलिए OpenClaw इस integration के लिए Claude CLI reuse और `claude -p` usage को
sanctioned मानता है जब तक Anthropic कोई नई policy publish नहीं करता।
Anthropic अब भी per-message dollar estimate expose नहीं करता जिसे OpenClaw
`/usage full` में दिखा सके।

**CLI usage windows (provider quotas)**

- `openclaw status --usage` और `openclaw channels list` provider **usage windows**
  (quota snapshots, per-message costs नहीं) दिखाते हैं।
- Human output providers के across `X% left` में normalized होता है।
- Current usage-window providers: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, और z.ai।
- MiniMax नोट: इसके raw `usage_percent` / `usagePercent` fields का अर्थ remaining
  quota है, इसलिए OpenClaw display से पहले उन्हें invert करता है। Count-based fields फिर भी
  मौजूद होने पर जीतते हैं। यदि provider `model_remains` return करता है, तो OpenClaw
  chat-model entry को prefer करता है, जरूरत पड़ने पर timestamps से window label derive करता है, और
  plan label में model name शामिल करता है।
- उन quota windows के लिए usage auth provider-specific hooks से आता है जब
  उपलब्ध हो; अन्यथा OpenClaw auth profiles, env, या config से matching OAuth/API-key
  credentials पर fallback करता है।

विवरण और उदाहरणों के लिए [Token use & costs](/hi/reference/token-use) देखें।

## कुंजियाँ कैसे discover होती हैं

OpenClaw credentials यहाँ से pick up कर सकता है:

- **Auth profiles** (per-agent, `auth-profiles.json` में stored)।
- **Environment variables** (जैसे `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)।
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)।
- **Skills** (`skills.entries.<name>.apiKey`) जो skill process env में keys export कर सकती हैं।

## वे सुविधाएँ जो keys खर्च कर सकती हैं

### 1) Core model responses (chat + tools)

हर reply या tool call **current model provider** (OpenAI, Anthropic, आदि) का उपयोग करता है। यह
usage और cost का primary source है।

इसमें subscription-style hosted providers भी शामिल हैं जो फिर भी
OpenClaw की local UI के बाहर bill करते हैं, जैसे **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, और
Anthropic का OpenClaw Claude-login path जिसमें **Extra Usage** enabled हो।

Pricing config के लिए [Models](/hi/providers/models) और display के लिए [Token use & costs](/hi/reference/token-use) देखें।

### 2) Media understanding (audio/image/video)

Inbound media को reply चलने से पहले summarized/transcribed किया जा सकता है। यह model/provider APIs का उपयोग करता है।

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral।
- Image: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI।
- Video: Google / Qwen / Moonshot।

[Media understanding](/hi/nodes/media-understanding) देखें।

### 3) Image और video generation

Shared generation capabilities भी provider keys खर्च कर सकती हैं:

- Image generation: OpenAI / Google / DeepInfra / fal / MiniMax
- Video generation: DeepInfra / Qwen

जब `agents.defaults.imageGenerationModel` unset हो, तब Image generation auth-backed provider default infer कर सकता है।
Video generation currently explicit `agents.defaults.videoGenerationModel` require करता है, जैसे
`qwen/wan2.6-t2v`।

[Image generation](/hi/tools/image-generation), [Qwen Cloud](/hi/providers/qwen),
और [Models](/hi/concepts/models) देखें।

### 4) Memory embeddings + semantic search

Semantic memory search remote providers के लिए configured होने पर **embedding APIs** का उपयोग करता है:

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings (local/self-hosted)
- `memorySearch.provider = "ollama"` → Ollama embeddings (local/self-hosted; आम तौर पर hosted API billing नहीं)
- यदि local embeddings fail हों तो remote provider पर optional fallback

आप इसे `memorySearch.provider = "local"` के साथ local रख सकते हैं (कोई API usage नहीं)।

[Memory](/hi/concepts/memory) देखें।

### 5) Web search tool

`web_search` आपके provider के आधार पर usage charges incur कर सकता है:

- **Brave Search API**: `BRAVE_API_KEY` या `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` या `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` या `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` या `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: xAI OAuth profile, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, या `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, या `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: reachable signed-in local Ollama host के लिए key-free; direct `https://ollama.com` search `OLLAMA_API_KEY` का उपयोग करता है, और auth-protected hosts normal Ollama provider bearer auth reuse कर सकते हैं
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, या `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` या `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: explicitly selected होने पर key-free provider (कोई API billing नहीं, लेकिन unofficial और HTML-based)
- **SearXNG**: `SEARXNG_BASE_URL` या `plugins.entries.searxng.config.webSearch.baseUrl` (key-free/self-hosted; कोई hosted API billing नहीं)

Legacy `tools.web.search.*` provider paths अब भी temporary compatibility shim के through load होते हैं, लेकिन वे अब recommended config surface नहीं हैं।

**Brave Search free credit:** हर Brave plan में renewing
free credit में \$5/month शामिल है। Search plan की लागत \$5 प्रति 1,000 requests है, इसलिए credit
बिना charge के 1,000 requests/month cover करता है। Unexpected charges से बचने के लिए Brave dashboard में
अपनी usage limit set करें।

[Web tools](/hi/tools/web) देखें।

### 5) Web fetch tool (Firecrawl)

`web_fetch` keyless starter access के साथ **Firecrawl** call कर सकता है। Higher limits
के लिए API key जोड़ें:

- `FIRECRAWL_API_KEY` या `plugins.entries.firecrawl.config.webFetch.apiKey`

यदि Firecrawl configured नहीं है, तो tool direct fetch plus bundled `web-readability` plugin पर fallback करता है (कोई paid API नहीं)। Local Readability extraction skip करने के लिए `plugins.entries.web-readability.enabled` disable करें।

[Web tools](/hi/tools/web) देखें।

### 6) Provider usage snapshots (status/health)

कुछ status commands quota windows या auth health display करने के लिए **provider usage endpoints** call करते हैं।
ये आम तौर पर low-volume calls होते हैं लेकिन फिर भी provider APIs hit करते हैं:

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/hi/cli/models) देखें।

### 7) Compaction safeguard summarization

Compaction safeguard **current model** का उपयोग करके session history summarize कर सकता है, जो
चलने पर provider APIs invoke करता है।

[Session management + Compaction](/hi/reference/session-management-compaction) देखें।

### 8) Model scan / probe

`openclaw models scan` OpenRouter models probe कर सकता है और probing enabled होने पर `OPENROUTER_API_KEY` का उपयोग करता है।

[Models CLI](/hi/cli/models) देखें।

### 9) Talk (speech)

Talk mode configured होने पर **ElevenLabs** invoke कर सकता है:

- `ELEVENLABS_API_KEY` या `talk.providers.elevenlabs.apiKey`

[Talk mode](/hi/nodes/talk) देखें।

### 10) Skills (third-party APIs)

Skills `skills.entries.<name>.apiKey` में `apiKey` store कर सकती हैं। यदि कोई skill उस key का उपयोग external
APIs के लिए करती है, तो वह skill के provider के अनुसार costs incur कर सकती है।

[Skills](/hi/tools/skills) देखें।

## संबंधित

- [Token use and costs](/hi/reference/token-use)
- [Prompt caching](/hi/reference/prompt-caching)
- [Usage tracking](/hi/concepts/usage-tracking)
