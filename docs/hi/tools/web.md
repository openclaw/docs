---
read_when:
    - आप web_search को सक्षम या कॉन्फ़िगर करना चाहते हैं
    - आप x_search को सक्षम या कॉन्फ़िगर करना चाहते हैं
    - आपको एक खोज प्रदाता चुनना होगा
    - आप auto-detection और provider चयन को समझना चाहते हैं
sidebarTitle: Web Search
summary: web_search, x_search, और web_fetch -- वेब खोजें, X पोस्ट खोजें, या पृष्ठ सामग्री प्राप्त करें
title: वेब खोज
x-i18n:
    generated_at: "2026-06-29T00:26:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

`web_search` टूल आपके कॉन्फ़िगर किए गए प्रदाता का उपयोग करके वेब खोजता है और
परिणाम लौटाता है। परिणाम क्वेरी के अनुसार 15 मिनट तक कैश किए जाते हैं (कॉन्फ़िगर करने योग्य)।

OpenClaw में X (पूर्व में Twitter) पोस्ट के लिए `x_search` और
हल्के URL फ़ेचिंग के लिए `web_fetch` भी शामिल है। इस चरण में, `web_fetch`
स्थानीय रहता है जबकि `web_search` और `x_search` अंदरूनी तौर पर xAI Responses का उपयोग कर सकते हैं।

<Info>
  `web_search` एक हल्का HTTP टूल है, browser automation नहीं। JS-भारी साइटों या लॉगिन के लिए,
  [Web Browser](/hi/tools/browser) का उपयोग करें। किसी विशिष्ट URL को फ़ेच करने के लिए,
  [Web Fetch](/hi/tools/web-fetch) का उपयोग करें।
</Info>

## त्वरित शुरुआत

<Steps>
  <Step title="प्रदाता चुनें">
    कोई प्रदाता चुनें और आवश्यक सेटअप पूरा करें। कुछ प्रदाता
    key-free हैं, जबकि अन्य API keys का उपयोग करते हैं। विवरण के लिए
    नीचे प्रदाता पेज देखें।
  </Step>
  <Step title="कॉन्फ़िगर करें">
    ```bash
    openclaw configure --section web
    ```
    यह प्रदाता और कोई भी आवश्यक क्रेडेंशियल संग्रहीत करता है। आप env
    var (उदाहरण के लिए `BRAVE_API_KEY`) भी सेट कर सकते हैं और API-समर्थित
    प्रदाताओं के लिए यह चरण छोड़ सकते हैं।
  </Step>
  <Step title="इसका उपयोग करें">
    अब agent `web_search` कॉल कर सकता है:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X पोस्ट के लिए, उपयोग करें:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## प्रदाता चुनना

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/hi/tools/brave-search">
    snippets के साथ संरचित परिणाम। `llm-context` मोड, देश/भाषा फ़िल्टर का समर्थन करता है। मुफ़्त tier उपलब्ध है।
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/hi/plugins/codex-harness">
    आपके Codex app-server खाते के माध्यम से AI-संश्लेषित grounded उत्तर।
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/hi/tools/duckduckgo-search">
    Key-free प्रदाता। API key की आवश्यकता नहीं। अनौपचारिक HTML-आधारित integration।
  </Card>
  <Card title="Exa" icon="brain" href="/hi/tools/exa-search">
    content extraction (highlights, text, summaries) के साथ neural + keyword search।
  </Card>
  <Card title="Firecrawl" icon="flame" href="/hi/tools/firecrawl">
    संरचित परिणाम। गहरे extraction के लिए `firecrawl_search` और `firecrawl_scrape` के साथ सबसे अच्छा।
  </Card>
  <Card title="Gemini" icon="sparkles" href="/hi/tools/gemini-search">
    Google Search grounding के माध्यम से उद्धरणों के साथ AI-संश्लेषित उत्तर।
  </Card>
  <Card title="Grok" icon="zap" href="/hi/tools/grok-search">
    xAI web grounding के माध्यम से उद्धरणों के साथ AI-संश्लेषित उत्तर।
  </Card>
  <Card title="Kimi" icon="moon" href="/hi/tools/kimi-search">
    Moonshot web search के माध्यम से उद्धरणों के साथ AI-संश्लेषित उत्तर; ungrounded chat fallbacks स्पष्ट रूप से विफल होते हैं।
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/hi/tools/minimax-search">
    MiniMax Token Plan search API के माध्यम से संरचित परिणाम।
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/hi/tools/ollama-search">
    signed-in स्थानीय Ollama host या hosted Ollama API के माध्यम से खोज।
  </Card>
  <Card title="Parallel" icon="layer-group" href="/hi/tools/parallel-search">
    सशुल्क Parallel Search API (`PARALLEL_API_KEY`); अधिक rate limits और objective tuning।
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/hi/tools/parallel-search">
    Key-free opt-in। Parallel का मुफ़्त Search MCP, LLM-optimized dense excerpts और बिना API key के।
  </Card>
  <Card title="Perplexity" icon="search" href="/hi/tools/perplexity-search">
    content extraction controls और domain filtering के साथ संरचित परिणाम।
  </Card>
  <Card title="SearXNG" icon="server" href="/hi/tools/searxng-search">
    Self-hosted meta-search। API key की आवश्यकता नहीं। Google, Bing, DuckDuckGo, और अन्य को aggregate करता है।
  </Card>
  <Card title="Tavily" icon="globe" href="/hi/tools/tavily">
    search depth, topic filtering, और URL extraction के लिए `tavily_extract` के साथ संरचित परिणाम।
  </Card>
</CardGroup>

### प्रदाता तुलना

| प्रदाता                                         | परिणाम शैली                                                   | फ़िल्टर                                          | API key                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/hi/tools/brave-search)                     | संरचित snippets                                            | देश, भाषा, समय, `llm-context` मोड      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/hi/plugins/codex-harness)    | AI-संश्लेषित + source URLs                                   | Domains, context size, user location             | कोई नहीं; Codex/OpenAI sign-in का उपयोग करता है                                                         |
| [DuckDuckGo](/hi/tools/duckduckgo-search)           | संरचित snippets                                            | --                                               | कोई नहीं (key-free)                                                                         |
| [Exa](/hi/tools/exa-search)                         | संरचित + extracted                                         | Neural/keyword mode, date, content extraction    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/hi/tools/firecrawl)                    | संरचित snippets                                            | `firecrawl_search` टूल के माध्यम से                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/hi/tools/gemini-search)                   | AI-संश्लेषित + उद्धरण                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/hi/tools/grok-search)                       | AI-संश्लेषित + उद्धरण                                     | --                                               | xAI OAuth, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/hi/tools/kimi-search)                       | AI-संश्लेषित + उद्धरण; ungrounded chat fallbacks पर विफल होता है | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/hi/tools/minimax-search)          | संरचित snippets                                            | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/hi/tools/ollama-search)        | संरचित snippets                                            | --                                               | signed-in local hosts के लिए कोई नहीं; direct `https://ollama.com` search के लिए `OLLAMA_API_KEY` |
| [Parallel](/hi/tools/parallel-search)               | LLM context के लिए rank किए गए dense excerpts                          | --                                               | `PARALLEL_API_KEY` (सशुल्क)                                                               |
| [Parallel Search (Free)](/hi/tools/parallel-search) | LLM context के लिए rank किए गए dense excerpts                          | --                                               | कोई नहीं (मुफ़्त Search MCP)                                                                  |
| [Perplexity](/hi/tools/perplexity-search)           | संरचित snippets                                            | देश, भाषा, समय, domains, content limits | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/hi/tools/searxng-search)                 | संरचित snippets                                            | Categories, language                             | कोई नहीं (self-hosted)                                                                      |
| [Tavily](/hi/tools/tavily)                          | संरचित snippets                                            | `tavily_search` टूल के माध्यम से                         | `TAVILY_API_KEY`                                                                        |

## Auto-detection

## Native OpenAI web search

Direct OpenAI Responses models OpenClaw web search सक्षम होने और कोई managed provider pinned न होने पर OpenAI के hosted `web_search` टूल का स्वचालित रूप से उपयोग करते हैं। यह bundled OpenAI Plugin में provider-owned व्यवहार है और केवल native OpenAI API traffic पर लागू होता है, OpenAI-compatible proxy base URLs या Azure routes पर नहीं। OpenAI models के लिए managed `web_search` टूल बनाए रखने के लिए `tools.web.search.provider` को किसी अन्य प्रदाता जैसे `brave` पर सेट करें, या managed search और native OpenAI search दोनों को अक्षम करने के लिए `tools.web.search.enabled: false` सेट करें।

## Native Codex web search

Codex app-server runtime web search सक्षम होने और कोई managed provider selected न होने पर Codex के hosted `web_search` टूल का स्वचालित रूप से उपयोग करता है। Native hosted
search और OpenClaw का managed `web_search` dynamic tool परस्पर exclusive हैं,
इसलिए managed search native domain restrictions को bypass नहीं कर सकता। OpenClaw managed tool का उपयोग तब करता है जब hosted search अनुपलब्ध, स्पष्ट रूप से disabled, या
किसी selected managed provider द्वारा replaced हो। OpenClaw Codex के standalone
`web.run` extension को disabled रखता है क्योंकि production app-server traffic उसके
user-defined `web` namespace को reject करता है।

- native search को `tools.web.search.openaiCodex` के अंतर्गत कॉन्फ़िगर करें
- किसी भी parent model के लिए Codex Hosted Search को managed `web_search` provider के रूप में provision करने के लिए `tools.web.search.provider: "codex"` सेट करें। हर call एक
  bounded ephemeral Codex app-server turn चलाती है और यदि Codex hosted `webSearch` item emit नहीं करता तो विफल होती है।
- `mode: "cached"` default preference है, लेकिन Codex unrestricted app-server turns के लिए इसे live
  external access में resolve करता है; live access स्पष्ट रूप से request करने के लिए `"live"` सेट करें
- OpenClaw के managed `web_search` का उपयोग करने के लिए `tools.web.search.provider` को किसी managed provider जैसे `brave` पर सेट करें
- Codex-hosted search से opt out करने के लिए `tools.web.search.openaiCodex.enabled: false` सेट करें; अन्य managed providers उपलब्ध रहते हैं
- Codex native tool surface को restrict करने से managed `web_search` भी उपलब्ध रहता है
- जब `allowedDomains` सेट हो, hosted search अनुपलब्ध होने पर automatic managed fallback fail closed होता है ताकि native allowlist bypass न हो सके
- Tool-disabled LLM-only runs native और managed search दोनों को अक्षम करते हैं
- `tools.web.search.enabled: false` managed और native search दोनों को अक्षम करता है

Persistent effective Codex search-policy changes एक fresh bound thread शुरू करते हैं ताकि
पहले से loaded app-server thread stale hosted-search access बनाए न रख सके।
Transient per-turn restrictions temporary restricted thread का उपयोग करते हैं और बाद में resume के लिए
existing binding को preserve करते हैं।

Direct OpenAI ChatGPT Responses traffic OpenAI के hosted
`web_search` टूल का भी उपयोग कर सकता है। वह अलग path
`tools.web.search.openaiCodex.enabled: true` के माध्यम से opt-in रहता है और केवल eligible
`openai/*` models पर लागू होता है जो `api: "openai-chatgpt-responses"` का उपयोग करते हैं।

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

ऐसे runtimes और providers के लिए जो native Codex search का समर्थन नहीं करते, Codex
OpenClaw के dynamic tool namespace के माध्यम से managed `web_search` fallback का उपयोग कर सकता है।
जब आपको Codex-hosted search के बजाय OpenClaw के provider-specific
network controls की आवश्यकता हो, तो explicit managed provider का उपयोग करें।

`provider: "codex"` चुनने से bundled `codex` plugin सक्षम होता है और ऊपर दिखाए गए
उसी `tools.web.search.openaiCodex` प्रतिबंधों का उपयोग करता है। पहले Codex
app-server को `openclaw models auth login --provider openai` से authenticate करें।
parent agent कोई भी model या runtime उपयोग कर सकता है; केवल सीमित search worker
Codex के माध्यम से चलता है।

## Network सुरक्षा

Managed HTTP `web_search` प्रदाता calls OpenClaw के guarded fetch path का उपयोग करते हैं। विश्वसनीय
प्रदाता API hosts के लिए, OpenClaw Surge, Clash, और sing-box fake-IP
DNS answers को `198.18.0.0/15` और `fc00::/7` में केवल उस प्रदाता hostname के लिए अनुमति देता है।
अन्य private, loopback, link-local, और metadata destinations blocked रहते हैं।
Codex Hosted Search अपवाद है: इसका सीमित worker network
access को Codex app-server के hosted `web_search` tool को delegate करता है।

यह automatic allowance arbitrary `web_fetch` URLs पर लागू नहीं होती। `web_fetch` के लिए,
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` और
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` को स्पष्ट रूप से केवल तब सक्षम करें जब आपका
विश्वसनीय proxy उन synthetic ranges का owner हो।

## web search सेट करना

docs और setup flows में प्रदाता सूचियां alphabetical हैं। Auto-detection एक
अलग precedence order रखता है।

यदि कोई `provider` set नहीं है, तो OpenClaw इस क्रम में providers check करता है और
जो पहला ready हो उसे उपयोग करता है:

पहले API-समर्थित providers:

1. **Brave** -- `BRAVE_API_KEY` या `plugins.entries.brave.config.webSearch.apiKey` (order 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` या `plugins.entries.minimax.config.webSearch.apiKey` (order 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, या `models.providers.google.apiKey` (order 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey` (order 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` या `plugins.entries.moonshot.config.webSearch.apiKey` (order 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` या `plugins.entries.perplexity.config.webSearch.apiKey` (order 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` या `plugins.entries.firecrawl.config.webSearch.apiKey` (order 60)
8. **Exa** -- `EXA_API_KEY` या `plugins.entries.exa.config.webSearch.apiKey`; वैकल्पिक `plugins.entries.exa.config.webSearch.baseUrl` Exa endpoint को override करता है (order 65)
9. **Tavily** -- `TAVILY_API_KEY` या `plugins.entries.tavily.config.webSearch.apiKey` (order 70)
10. **Parallel** -- paid Parallel Search API via `PARALLEL_API_KEY` या `plugins.entries.parallel.config.webSearch.apiKey`; वैकल्पिक `plugins.entries.parallel.config.webSearch.baseUrl` endpoint को override करता है (order 75)

इसके बाद configured endpoint providers:

11. **SearXNG** -- `SEARXNG_BASE_URL` या `plugins.entries.searxng.config.webSearch.baseUrl` (order 200)

**Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search**, और **Codex Hosted Search** जैसे key-free providers केवल तब उपलब्ध होते हैं जब आप
उन्हें `tools.web.search.provider` के साथ या
`openclaw configure --section web` के माध्यम से स्पष्ट रूप से चुनते हैं। OpenClaw managed
`web_search` queries को किसी key-free provider को सिर्फ इसलिए नहीं भेजता कि कोई API-समर्थित provider
configured नहीं है।

OpenAI Responses models एक अपवाद हैं: जब `tools.web.search.provider`
unset हो, वे ऊपर के managed providers के बजाय OpenAI की native web search का उपयोग करते हैं।
उन्हें managed path से route करने के लिए `tools.web.search.provider` को `parallel-free` (या कोई अन्य provider)
पर set करें।

<Note>
  सभी provider key fields SecretRef objects का support करते हैं। Plugin-scoped SecretRefs
  `plugins.entries.<plugin>.config.webSearch.apiKey` के अंतर्गत installed API-समर्थित web search providers के लिए resolve होते हैं,
  जिनमें Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity, और Tavily शामिल हैं,
  चाहे provider `tools.web.search.provider` के माध्यम से स्पष्ट रूप से चुना गया हो या
  auto-detect के माध्यम से selected हो। auto-detect mode में, OpenClaw केवल
  selected provider key resolve करता है -- non-selected SecretRefs inactive रहते हैं, इसलिए आप
  जिन providers का उपयोग नहीं कर रहे हैं उनके लिए resolution cost दिए बिना कई providers configured रख सकते हैं।
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Provider-specific config (API keys, base URLs, modes)
`plugins.entries.<plugin>.config.webSearch.*` के अंतर्गत रहता है। Gemini अपने dedicated web-search config और `GEMINI_API_KEY` के बाद lower-priority
fallbacks के रूप में `models.providers.google.apiKey` और `models.providers.google.baseUrl` को भी reuse कर सकता है। उदाहरणों के लिए
provider pages देखें।
Grok `openclaw models auth login
--provider xai --method oauth` से xAI OAuth auth profile को भी reuse कर सकता है; API-key config fallback रहता है।

`tools.web.search.provider` को bundled और installed plugin manifests द्वारा declared web-search provider ids के विरुद्ध validate किया जाता है।
`"brvae"` जैसी typo silently auto-detection पर fallback करने के बजाय config validation fail करती है। यदि किसी
configured provider के पास केवल stale plugin evidence है, जैसे third-party plugin uninstall करने के बाद बचा हुआ
`plugins.entries.<plugin>` block,
OpenClaw startup को resilient रखता है और warning report करता है ताकि आप
plugin reinstall कर सकें या stale config साफ करने के लिए `openclaw doctor --fix` चला सकें।

`web_fetch` fallback provider selection अलग है:

- इसे `tools.web.fetch.provider` से चुनें
- या उस field को omit करें और OpenClaw को configured credentials से पहला ready web-fetch
  provider auto-detect करने दें
- non-sandboxed `web_fetch` installed plugin providers का उपयोग कर सकता है जो
  `contracts.webFetchProviders` declare करते हैं; sandboxed fetches bundled providers और
  verified official plugin installs allow करते हैं, लेकिन third-party external plugins exclude करते हैं
- official Firecrawl plugin web-fetch fallback देता है, जो
  `plugins.entries.firecrawl.config.webFetch.*` के अंतर्गत configured होता है

जब आप `openclaw onboard` या
`openclaw configure --section web` के दौरान **Kimi** चुनते हैं, तो OpenClaw यह भी पूछ सकता है:

- Moonshot API region (`https://api.moonshot.ai/v1` या `https://api.moonshot.cn/v1`)
- default Kimi web-search model (default `kimi-k2.6`)

`x_search` के लिए, `plugins.entries.xai.config.xSearch.*` configure करें। यह chat जैसा
ही xAI auth profile, या Grok web search द्वारा उपयोग किया गया `XAI_API_KEY` / plugin web-search
credential उपयोग करता है।
Legacy `tools.web.x_search.*` config `openclaw doctor --fix` द्वारा auto-migrated है।
जब आप `openclaw onboard` या `openclaw configure --section web` के दौरान Grok चुनते हैं,
OpenClaw उसी credential के साथ optional `x_search` setup भी offer कर सकता है।
यह Grok path के अंदर एक अलग follow-up step है, अलग top-level
web-search provider choice नहीं। यदि आप कोई दूसरा provider चुनते हैं, तो OpenClaw
`x_search` prompt नहीं दिखाता।

### API keys store करना

<Tabs>
  <Tab title="Config file">
    `openclaw configure --section web` चलाएं या key सीधे set करें:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Environment variable">
    Gateway process environment में provider env var set करें:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    gateway install के लिए, इसे `~/.openclaw/.env` में डालें।
    [Env vars](/hi/help/faq#env-vars-and-env-loading) देखें।

  </Tab>
</Tabs>

## Tool parameters

| Parameter             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Search query (आवश्यक)                                |
| `count`               | लौटाने के लिए results (1-10, default: 5)              |
| `country`             | 2-letter ISO country code (जैसे "US", "DE")           |
| `language`            | ISO 639-1 language code (जैसे "en", "de")             |
| `search_lang`         | Search-language code (केवल Brave)                    |
| `freshness`           | Time filter: `day`, `week`, `month`, या `year`        |
| `date_after`          | इस date के बाद results (YYYY-MM-DD)                  |
| `date_before`         | इस date से पहले results (YYYY-MM-DD)                 |
| `ui_lang`             | UI language code (केवल Brave)                        |
| `domain_filter`       | Domain allowlist/denylist array (केवल Perplexity)    |
| `max_tokens`          | कुल content budget, default 25000 (केवल Perplexity) |
| `max_tokens_per_page` | Per-page token limit, default 2048 (केवल Perplexity) |

<Warning>
  सभी parameters सभी providers के साथ काम नहीं करते। Brave `llm-context` mode
  `ui_lang` reject करता है; `date_before` को `date_after` भी चाहिए क्योंकि Brave custom
  freshness ranges के लिए start और end dates दोनों आवश्यक हैं।
  Gemini, Grok, और Kimi citations के साथ एक synthesized answer लौटाते हैं। वे
  shared-tool compatibility के लिए `count` accept करते हैं, लेकिन यह
  grounded answer shape नहीं बदलता। Gemini `day` freshness को recency hint मानता है; wider
  freshness values और explicit dates Google Search grounding time ranges set करते हैं।
  Perplexity भी वैसा ही व्यवहार करता है जब आप Sonar/OpenRouter
  compatibility path (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` या `OPENROUTER_API_KEY`) उपयोग करते हैं।
  SearXNG केवल trusted private-network या loopback hosts के लिए `http://` accept करता है;
  public SearXNG endpoints को `https://` उपयोग करना होगा।
  Firecrawl और Tavily `web_search` के माध्यम से केवल `query` और `count` support करते हैं
  -- advanced options के लिए उनके dedicated tools उपयोग करें।
</Warning>

## x_search

`x_search` xAI का उपयोग करके X (formerly Twitter) posts query करता है और
citations के साथ AI-synthesized answers लौटाता है। यह natural-language queries और
optional structured filters accept करता है। OpenClaw built-in xAI `x_search`
tool को केवल उस request पर enable करता है जो इस tool call को serve करती है।

<Note>
  xAI `x_search` को keyword search, semantic search, user
  search, और thread fetch support करने वाला document करता है। per-post engagement stats जैसे reposts,
  replies, bookmarks, या views के लिए, exact post URL
  या status ID के लिए targeted lookup prefer करें। Broad keyword searches सही post ढूंढ सकती हैं लेकिन
  कम complete per-post metadata return कर सकती हैं। अच्छा pattern है: पहले post locate करें, फिर
  उसी exact post पर focused दूसरा `x_search` query run करें।
</Note>

### x_search config

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

जब `plugins.entries.xai.config.xSearch.baseUrl` set हो, तब `x_search`
`<baseUrl>/responses` पर post करता है। यदि वह field omitted है,
तो यह `plugins.entries.xai.config.webSearch.baseUrl`, फिर
legacy `tools.web.search.grok.baseUrl`, और अंत में public xAI endpoint पर fallback करता है।

### x_search parameters

| पैरामीटर                    | विवरण                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | खोज क्वेरी (आवश्यक)                                |
| `allowed_x_handles`          | परिणामों को विशिष्ट X हैंडल तक सीमित करें                 |
| `excluded_x_handles`         | विशिष्ट X हैंडल बाहर रखें                             |
| `from_date`                  | केवल इस तिथि को या इसके बाद की पोस्ट शामिल करें (YYYY-MM-DD)  |
| `to_date`                    | केवल इस तिथि को या इससे पहले की पोस्ट शामिल करें (YYYY-MM-DD) |
| `enable_image_understanding` | xAI को मेल खाती पोस्ट से जुड़ी छवियों का निरीक्षण करने दें      |
| `enable_video_understanding` | xAI को मेल खाती पोस्ट से जुड़े वीडियो का निरीक्षण करने दें      |

### x_search उदाहरण

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// प्रति-पोस्ट आंकड़े: जब संभव हो तो सटीक status URL या status ID का उपयोग करें
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## उदाहरण

```javascript
// बुनियादी खोज
await web_search({ query: "OpenClaw plugin SDK" });

// जर्मन-विशिष्ट खोज
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// हालिया परिणाम (पिछला सप्ताह)
await web_search({ query: "AI developments", freshness: "week" });

// तिथि सीमा
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// डोमेन फ़िल्टरिंग (केवल Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## टूल प्रोफ़ाइल

यदि आप टूल प्रोफ़ाइल या allowlist का उपयोग करते हैं, तो `web_search`, `x_search`, या `group:web` जोड़ें:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // या: allow: ["group:web"]  (web_search, x_search, और web_fetch शामिल हैं)
  },
}
```

## संबंधित

- [Web Fetch](/hi/tools/web-fetch) -- URL प्राप्त करें और पठनीय सामग्री निकालें
- [Web Browser](/hi/tools/browser) -- JS-भारी साइटों के लिए पूर्ण ब्राउज़र ऑटोमेशन
- [Grok Search](/hi/tools/grok-search) -- `web_search` प्रदाता के रूप में Grok
- [Ollama Web Search](/hi/tools/ollama-search) -- आपके Ollama होस्ट के माध्यम से कुंजी-रहित वेब खोज
