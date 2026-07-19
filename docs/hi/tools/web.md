---
read_when:
    - आप web_search को सक्षम या कॉन्फ़िगर करना चाहते हैं
    - आप x_search को सक्षम या कॉन्फ़िगर करना चाहते हैं
    - आपको एक खोज प्रदाता चुनना होगा
    - आप स्वचालित पहचान और प्रदाता चयन को समझना चाहते हैं
sidebarTitle: Web Search
summary: web_search, x_search, और web_fetch -- वेब पर खोजें, X पोस्ट खोजें, या पेज की सामग्री प्राप्त करें
title: वेब खोज
x-i18n:
    generated_at: "2026-07-19T09:38:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb824277fed079a0978499a57a2e0946b7cf3079ef3394a64b30c8df049a29ee
    source_path: tools/web.md
    workflow: 16
---

`web_search` आपके कॉन्फ़िगर किए गए प्रदाता के साथ वेब पर खोज करता है और
सामान्यीकृत परिणाम लौटाता है, जिन्हें क्वेरी के अनुसार 15 मिनट के लिए कैश किया जाता है (कॉन्फ़िगर करने योग्य)। OpenClaw
X (पूर्व में Twitter) पोस्ट के लिए `x_search` और
हल्के URL फ़ेचिंग के लिए `web_fetch` भी बंडल करता है। `web_fetch` हमेशा स्थानीय रूप से चलता है; जब Grok प्रदाता होता है, तब `web_search`
xAI Responses के माध्यम से रूट करता है, और `x_search` हमेशा
xAI Responses का उपयोग करता है।

<Info>
  `web_search` एक हल्का HTTP टूल है, ब्राउज़र स्वचालन नहीं। JS-प्रधान
  साइटों या लॉगिन के लिए, [वेब ब्राउज़र](/hi/tools/browser) का उपयोग करें। किसी
  विशिष्ट URL को फ़ेच करने के लिए, [वेब फ़ेच](/hi/tools/web-fetch) का उपयोग करें।
</Info>

## त्वरित शुरुआत

<Steps>
  <Step title="प्रदाता चुनें">
    कोई प्रदाता चुनें और आवश्यक सेटअप पूरा करें। कुछ प्रदाताओं के लिए
    कुंजी आवश्यक नहीं होती, जबकि अन्य को API कुंजी चाहिए। विवरण के लिए
    नीचे दिए गए प्रदाता पृष्ठ देखें।
  </Step>
  <Step title="कॉन्फ़िगर करें">
    ```bash
    openclaw configure --section web
    ```
    यह प्रदाता और आवश्यक क्रेडेंशियल संग्रहीत करता है। API-समर्थित
    प्रदाताओं के लिए, इसके बजाय प्रदाता का एनवायरनमेंट वेरिएबल (उदाहरण के लिए
    `BRAVE_API_KEY`) सेट करके इस चरण को छोड़ सकते हैं।
  </Step>
  <Step title="इसका उपयोग करें">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X पोस्ट के लिए:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## प्रदाता चुनना

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/hi/tools/brave-search">
    स्निपेट सहित संरचित परिणाम। `llm-context` मोड और देश/भाषा फ़िल्टर का समर्थन करता है। निःशुल्क टियर उपलब्ध है।
  </Card>
  <Card title="Codex होस्टेड खोज" icon="search" href="/hi/plugins/codex-harness">
    आपके Codex ऐप-सर्वर खाते के माध्यम से AI-संश्लेषित, स्रोत-आधारित उत्तर।
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/hi/tools/duckduckgo-search">
    कुंजी-मुक्त प्रदाता। API कुंजी की आवश्यकता नहीं। अनौपचारिक HTML-आधारित एकीकरण।
  </Card>
  <Card title="Exa" icon="brain" href="/hi/tools/exa-search">
    सामग्री निष्कर्षण (हाइलाइट, टेक्स्ट, सारांश) के साथ न्यूरल + कीवर्ड खोज।
  </Card>
  <Card title="Firecrawl" icon="flame" href="/hi/tools/firecrawl">
    संरचित परिणाम। गहन निष्कर्षण के लिए `firecrawl_search` और `firecrawl_scrape` के साथ उपयोग करना सर्वोत्तम है।
  </Card>
  <Card title="Gemini" icon="sparkles" href="/hi/tools/gemini-search">
    Google Search ग्राउंडिंग के माध्यम से उद्धरण सहित AI-संश्लेषित उत्तर।
  </Card>
  <Card title="Grok" icon="zap" href="/hi/tools/grok-search">
    xAI वेब ग्राउंडिंग के माध्यम से उद्धरण सहित AI-संश्लेषित उत्तर।
  </Card>
  <Card title="Kimi" icon="moon" href="/hi/tools/kimi-search">
    Moonshot वेब खोज के माध्यम से उद्धरण सहित AI-संश्लेषित उत्तर; आधारहीन चैट फ़ॉलबैक स्पष्ट रूप से विफल होते हैं।
  </Card>
  <Card title="MiniMax खोज" icon="globe" href="/hi/tools/minimax-search">
    MiniMax Token Plan खोज API के माध्यम से संरचित परिणाम।
  </Card>
  <Card title="Ollama वेब खोज" icon="globe" href="/hi/tools/ollama-search">
    साइन-इन किए गए स्थानीय Ollama होस्ट या होस्टेड Ollama API के माध्यम से खोज।
  </Card>
  <Card title="Parallel" icon="layer-group" href="/hi/tools/parallel-search">
    सशुल्क Parallel Search API (`PARALLEL_API_KEY`); उच्च दर सीमाएँ और उद्देश्य अनुकूलन।
  </Card>
  <Card title="Parallel खोज (निःशुल्क)" icon="layer-group" href="/hi/tools/parallel-search">
    कुंजी-मुक्त वैकल्पिक सुविधा। Parallel का निःशुल्क Search MCP, जिसमें LLM-अनुकूलित सघन अंश हैं और API कुंजी की आवश्यकता नहीं है।
  </Card>
  <Card title="Perplexity" icon="search" href="/hi/tools/perplexity-search">
    सामग्री निष्कर्षण नियंत्रण और डोमेन फ़िल्टरिंग के साथ संरचित परिणाम।
  </Card>
  <Card title="SearXNG" icon="server" href="/hi/tools/searxng-search">
    स्व-होस्टेड मेटा-खोज। API कुंजी की आवश्यकता नहीं। Google, Bing, DuckDuckGo और अन्य को एकत्रित करता है।
  </Card>
  <Card title="Tavily" icon="globe" href="/hi/tools/tavily">
    खोज की गहराई, विषय फ़िल्टरिंग और URL निष्कर्षण के लिए `tavily_extract` सहित संरचित परिणाम।
  </Card>
</CardGroup>

### प्रदाता तुलना

| प्रदाता                                         | परिणाम शैली                                                   | फ़िल्टर                                          | API कुंजी                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/hi/tools/brave-search)                     | संरचित स्निपेट                                            | देश, भाषा, समय, `llm-context` मोड      | `BRAVE_API_KEY`                                                                         |
| [Codex होस्टेड खोज](/hi/plugins/codex-harness)    | AI-संश्लेषित + स्रोत URL                                   | डोमेन, संदर्भ आकार, उपयोगकर्ता स्थान             | कोई नहीं; Codex/OpenAI साइन-इन का उपयोग करता है                                                         |
| [DuckDuckGo](/hi/tools/duckduckgo-search)           | संरचित स्निपेट                                            | --                                               | कोई नहीं (कुंजी-मुक्त)                                                                         |
| [Exa](/hi/tools/exa-search)                         | संरचित + निष्कर्षित                                         | न्यूरल/कीवर्ड मोड, दिनांक, सामग्री निष्कर्षण    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/hi/tools/firecrawl)                    | संरचित स्निपेट                                            | `firecrawl_search` टूल के माध्यम से                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/hi/tools/gemini-search)                   | AI-संश्लेषित + उद्धरण                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/hi/tools/grok-search)                       | AI-संश्लेषित + उद्धरण                                     | --                                               | xAI OAuth, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/hi/tools/kimi-search)                       | AI-संश्लेषित + उद्धरण; आधारहीन चैट फ़ॉलबैक पर विफल होता है | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax खोज](/hi/tools/minimax-search)          | संरचित स्निपेट                                            | क्षेत्र (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama वेब खोज](/hi/tools/ollama-search)        | संरचित स्निपेट                                            | --                                               | साइन-इन किए गए स्थानीय होस्ट के लिए कोई नहीं; प्रत्यक्ष `https://ollama.com` खोज के लिए `OLLAMA_API_KEY` |
| [Parallel](/hi/tools/parallel-search)               | LLM संदर्भ के लिए क्रमबद्ध सघन अंश                          | --                                               | `PARALLEL_API_KEY` (सशुल्क)                                                               |
| [Parallel खोज (निःशुल्क)](/hi/tools/parallel-search) | LLM संदर्भ के लिए क्रमबद्ध सघन अंश                          | --                                               | कोई नहीं (निःशुल्क Search MCP)                                                                  |
| [Perplexity](/hi/tools/perplexity-search)           | संरचित स्निपेट                                            | देश, भाषा, समय, डोमेन, सामग्री सीमाएँ | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/hi/tools/searxng-search)                 | संरचित स्निपेट                                            | श्रेणियाँ, भाषा                             | कोई नहीं (स्व-होस्टेड)                                                                      |
| [Tavily](/hi/tools/tavily)                          | संरचित स्निपेट                                            | `tavily_search` टूल के माध्यम से                         | `TAVILY_API_KEY`                                                                        |

## परिणाम संरचना

`web_search` कोर टूल सीमा पर प्रत्येक बंडल किए गए और बाहरी Plugin प्रदाता को
सामान्यीकृत करता है। कॉल करने वालों को इन बंद संरचनाओं में से ठीक एक प्राप्त होती है:

```typescript
type WebSearchOutput =
  | {
      kind: "error";
      provider: string;
      error: "provider_error";
      message: string;
      docs?: string;
    }
  | {
      kind: "results";
      provider: string;
      query: string;
      count: number;
      tookMs?: number;
      results: Array<{
        title: string;
        url: string;
        snippet?: string;
        published?: string;
        siteName?: string;
      }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "answer";
      provider: string;
      query: string;
      tookMs?: number;
      content: string;
      citations?: Array<{ url: string; title?: string }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "raw";
      provider: string;
      data: unknown;
    };
```

संरचित प्रदाता `kind: "results"` का उपयोग करते हैं; संश्लेषित प्रदाता
`kind: "answer"` का उपयोग करते हैं। जिन बाहरी Plugin प्रदाताओं के पेलोड किसी भी संरचना से
मेल नहीं खाते, वे संगतता के लिए `kind: "raw"` के रूप में बिना बदलाव के आगे भेजे जाते हैं। प्रदाता-विशिष्ट
फ़ील्ड, जैसे अपरिष्कृत स्कोर, अंश, संबंधित खोजें, इनलाइन-उद्धरण
ऑफ़सेट, मॉडल आईडी या सत्र मेटाडेटा, सामान्यीकृत
शाखाओं में आगे नहीं भेजे जाते। जब किसी प्रदाता की अधिक समृद्ध प्रतिक्रिया आपके
वर्कफ़्लो का हिस्सा हो, तब उसके समर्पित टूल का उपयोग करें।

`externalContent.wrapped: true` एक विश्वास चिह्न है जिसे सीमा स्वयं
सत्य बनाती है: प्रदाता का गद्य (`title`, `snippet`, `siteName`, `content`, उद्धरण
शीर्षक, त्रुटि `message`) किसी भी पहले से मौजूद एनवेलप पंक्तियों से हटाकर
कोर सीमा पर ठीक एक बार फिर लपेटा जाता है, इसलिए कोई प्रदाता मेटाडेटा
इस चिह्न की नकल नहीं कर सकता। `query` हमेशा अनुरोधित क्वेरी होती है, उद्धरण और परिणाम URL
http(s) के रूप में पार्स होने चाहिए, `published` का आकार ISO-दिनांक जैसा होना चाहिए, URL कैनॉनिकल रूप में उत्सर्जित किए जाते हैं, और
`error` कुंजी वाला पेलोड हमेशा `kind: "error"` के रूप में रिपोर्ट किया जाता है, जिसमें
अपरिष्कृत प्रदाता कोड लपेटे गए संदेश के भीतर सुरक्षित रहता है। बिना बदलाव के आगे भेजे गए
पेलोड प्रदाता द्वारा सेट किए गए सभी चिह्न बनाए रखते हैं।

## स्वतः-पहचान

दस्तावेज़ों और सेटअप प्रवाहों में प्रदाता सूचियाँ वर्णानुक्रम में होती हैं। स्वतः-पहचान एक
अलग, निश्चित वरीयता क्रम का उपयोग करती है और क्रेडेंशियल की आवश्यकता वाले
प्रदाता (`requiresCredential !== false`) को केवल तभी चुनती है, जब उसे कोई कॉन्फ़िगर किया हुआ मिलता है। यदि
कोई `provider` सेट नहीं है, तो OpenClaw इस क्रम में प्रदाताओं की जाँच करता है और
तैयार मिलने वाले पहले प्रदाता का उपयोग करता है:

पहले API-समर्थित प्रदाता:

1. **Brave** -- `BRAVE_API_KEY` या `plugins.entries.brave.config.webSearch.apiKey` (क्रम 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` या `plugins.entries.minimax.config.webSearch.apiKey` (क्रम 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, या `models.providers.google.apiKey` (क्रम 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey` (क्रम 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` या `plugins.entries.moonshot.config.webSearch.apiKey` (क्रम 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` या `plugins.entries.perplexity.config.webSearch.apiKey` (क्रम 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` या `plugins.entries.firecrawl.config.webSearch.apiKey` (क्रम 60)
8. **Exa** -- `EXA_API_KEY` या `plugins.entries.exa.config.webSearch.apiKey`; वैकल्पिक `plugins.entries.exa.config.webSearch.baseUrl` Exa एंडपॉइंट को ओवरराइड करता है (क्रम 65)
9. **Tavily** -- `TAVILY_API_KEY` या `plugins.entries.tavily.config.webSearch.apiKey` (क्रम 70)
10. **Parallel** -- `PARALLEL_API_KEY` या `plugins.entries.parallel.config.webSearch.apiKey` के माध्यम से सशुल्क Parallel Search API; वैकल्पिक `plugins.entries.parallel.config.webSearch.baseUrl` एंडपॉइंट को ओवरराइड करता है (क्रम 75)

इसके बाद कॉन्फ़िगर किए गए एंडपॉइंट प्रदाता:

11. **SearXNG** -- `SEARXNG_BASE_URL` या `plugins.entries.searxng.config.webSearch.baseUrl` (क्रम 200)

**Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search**, और **Codex Hosted Search** जैसे कुंजी-मुक्त प्रदाता कभी भी स्वतः-पहचान में नहीं चुने जाते,
भले ही उनका कोई आंतरिक क्रम मान हो। उनका उपयोग केवल तभी किया जाता है, जब आप
उन्हें `tools.web.search.provider` से या
`openclaw configure --section web` के माध्यम से स्पष्ट रूप से चुनते हैं। केवल इसलिए कि कोई API-समर्थित
प्रदाता कॉन्फ़िगर नहीं है, OpenClaw प्रबंधित
`web_search` क्वेरी किसी कुंजी-मुक्त प्रदाता को नहीं भेजता।

OpenAI Responses मॉडल एक अपवाद हैं: जब तक `tools.web.search.provider`
सेट नहीं है, वे ऊपर दिए गए प्रबंधित प्रदाताओं के बजाय OpenAI की मूल वेब खोज का
उपयोग करते हैं (नीचे देखें)। इसके बजाय उन्हें प्रबंधित पथ से रूट करने के लिए
`tools.web.search.provider` को `parallel-free`
(या किसी अन्य प्रदाता) पर सेट करें।

<Note>
  सभी प्रदाता कुंजी फ़ील्ड SecretRef ऑब्जेक्ट का समर्थन करते हैं। Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity, और Tavily सहित
  इंस्टॉल किए गए API-समर्थित वेब खोज प्रदाताओं के लिए
  `plugins.entries.<plugin>.config.webSearch.apiKey` के अंतर्गत Plugin-स्कोप वाले SecretRefs
  रिज़ॉल्व किए जाते हैं, चाहे प्रदाता को `tools.web.search.provider` के माध्यम से स्पष्ट रूप से चुना गया हो या
  स्वतः-पहचान से चयनित किया गया हो। स्वतः-पहचान मोड में, OpenClaw केवल
  चयनित प्रदाता की कुंजी को रिज़ॉल्व करता है -- अचयनित SecretRefs निष्क्रिय रहते हैं, इसलिए आप
  जिन प्रदाताओं का उपयोग नहीं कर रहे हैं, उनके लिए रिज़ॉल्यूशन लागत चुकाए बिना
  कई प्रदाताओं को कॉन्फ़िगर रख सकते हैं।
</Note>

## मूल OpenAI वेब खोज

प्रत्यक्ष OpenAI Responses मॉडल (`api: "openai-responses"`, प्रदाता `openai`,
कोई बेस URL नहीं या आधिकारिक OpenAI API बेस URL) OpenClaw वेब खोज सक्षम होने और कोई
प्रबंधित प्रदाता पिन न होने पर OpenAI के होस्ट किए गए
`web_search` टूल का स्वचालित रूप से उपयोग करते हैं। यह बंडल किए गए
OpenAI Plugin में प्रदाता-स्वामित्व वाला व्यवहार है और OpenAI-संगत प्रॉक्सी बेस URL या Azure
रूट पर लागू नहीं होता। OpenAI मॉडल के लिए प्रबंधित `web_search` टूल बनाए रखने हेतु
`tools.web.search.provider` को `brave` जैसे किसी अन्य प्रदाता पर सेट करें, या प्रबंधित खोज और मूल
OpenAI खोज दोनों को अक्षम करने के लिए `tools.web.search.enabled: false` सेट करें।

## मूल Codex वेब खोज

वेब खोज सक्षम होने और कोई प्रबंधित प्रदाता चयनित न होने पर Codex ऐप-सर्वर रनटाइम,
Codex के होस्ट किए गए `web_search` टूल का स्वचालित रूप से उपयोग करता है। मूल होस्ट की गई
खोज और OpenClaw का प्रबंधित `web_search` डायनेमिक टूल परस्पर अनन्य हैं,
इसलिए प्रबंधित खोज मूल डोमेन प्रतिबंधों को बायपास नहीं कर सकती। होस्ट की गई खोज अनुपलब्ध,
स्पष्ट रूप से अक्षम, या किसी चयनित प्रबंधित प्रदाता द्वारा प्रतिस्थापित होने पर
OpenClaw प्रबंधित टूल का उपयोग करता है। OpenClaw, Codex के स्टैंडअलोन
`web.run` एक्सटेंशन को अक्षम (`features.standalone_web_search: false`) रखता है,
क्योंकि प्रोडक्शन ऐप-सर्वर ट्रैफ़िक उसके उपयोगकर्ता-परिभाषित `web`
नेमस्पेस को अस्वीकार करता है।

- `tools.web.search.openaiCodex` के अंतर्गत मूल खोज कॉन्फ़िगर करें
- किसी भी पैरेंट मॉडल के लिए Codex Hosted Search को प्रबंधित
  `web_search` प्रदाता के रूप में उपलब्ध कराने हेतु `tools.web.search.provider: "codex"` सेट करें। प्रत्येक कॉल एक
  सीमित अस्थायी Codex ऐप-सर्वर टर्न चलाती है और यदि Codex होस्ट किया गया
  `webSearch` आइटम उत्सर्जित नहीं करता, तो विफल हो जाती है।
- `mode: "cached"` डिफ़ॉल्ट प्राथमिकता है, लेकिन Codex अप्रतिबंधित
  ऐप-सर्वर टर्न के लिए इसे लाइव बाहरी पहुँच में रिज़ॉल्व करता है; लाइव पहुँच का स्पष्ट अनुरोध करने के लिए
  `"live"` सेट करें
- इसके बजाय OpenClaw के प्रबंधित `web_search` का उपयोग करने हेतु
  `tools.web.search.provider` को `brave` जैसे किसी प्रबंधित प्रदाता पर सेट करें
- Codex द्वारा होस्ट की गई खोज से बाहर रहने के लिए `tools.web.search.openaiCodex.enabled: false` सेट करें;
  अन्य प्रबंधित प्रदाता उपलब्ध रहते हैं
- Codex के मूल टूल सरफ़ेस को प्रतिबंधित करने पर भी प्रबंधित `web_search`
  उपलब्ध रहता है
- जब `allowedDomains` सेट होता है, तब होस्ट की गई खोज अनुपलब्ध होने पर
  स्वचालित प्रबंधित फ़ॉलबैक सुरक्षित रूप से विफल होता है, ताकि मूल अनुमति-सूची को बायपास न किया जा सके
- टूल-अक्षम केवल-LLM रन मूल और प्रबंधित, दोनों खोज को अक्षम करते हैं
- `tools.web.search.enabled: false` प्रबंधित और मूल, दोनों खोज को अक्षम करता है

Codex की प्रभावी खोज-नीति में स्थायी परिवर्तन एक नया बाउंड थ्रेड शुरू करते हैं, ताकि
पहले से लोड किया गया ऐप-सर्वर थ्रेड पुरानी होस्टेड-खोज पहुँच बनाए न रख सके।
प्रति-टर्न अस्थायी प्रतिबंध एक अस्थायी प्रतिबंधित थ्रेड का उपयोग करते हैं और बाद में फिर से शुरू करने हेतु
मौजूदा बाइंडिंग सुरक्षित रखते हैं।

प्रत्यक्ष OpenAI ChatGPT Responses ट्रैफ़िक भी OpenAI के होस्ट किए गए
`web_search` टूल का उपयोग कर सकता है। वह अलग पथ
`tools.web.search.openaiCodex.enabled: true` के माध्यम से वैकल्पिक बना रहता है और केवल
`api: "openai-chatgpt-responses"` का उपयोग करने वाले पात्र `openai/*` मॉडल पर लागू होता है।

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // वैकल्पिक: गैर-Codex पैरेंट मॉडल से भी Codex Hosted Search का उपयोग करें।
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

मूल Codex खोज का समर्थन न करने वाले रनटाइम और प्रदाताओं के लिए, Codex
OpenClaw के डायनेमिक टूल नेमस्पेस के माध्यम से प्रबंधित `web_search` फ़ॉलबैक का उपयोग कर सकता है।
जब आपको Codex द्वारा होस्ट की गई खोज के बजाय OpenClaw के प्रदाता-विशिष्ट
नेटवर्क नियंत्रणों की आवश्यकता हो, तो किसी प्रबंधित प्रदाता को स्पष्ट रूप से चुनें।

`provider: "codex"` चुनने पर बंडल किया गया `codex` Plugin सक्षम होता है और
ऊपर दिखाए गए समान `tools.web.search.openaiCodex` प्रतिबंधों का उपयोग करता है। पहले
`openclaw models auth login --provider openai` से Codex ऐप-सर्वर को प्रमाणित करें।
पैरेंट एजेंट किसी भी मॉडल या रनटाइम का उपयोग कर सकता है; केवल सीमित खोज वर्कर
Codex के माध्यम से चलता है।

## नेटवर्क सुरक्षा

प्रबंधित HTTP `web_search` प्रदाता कॉल OpenClaw के सुरक्षित फ़ेच पथ का उपयोग करती हैं,
जो वर्तमान प्रदाता के अपने होस्टनाम तक सीमित होता है। केवल उस होस्टनाम के लिए,
OpenClaw `198.18.0.0/15` और `fc00::/7` में Surge, Clash, और sing-box के
फ़ेक-IP DNS उत्तरों की अनुमति देता है। अन्य निजी, लूपबैक, लिंक-लोकल, और
मेटाडेटा गंतव्य अवरुद्ध रहते हैं। Codex Hosted Search इसका अपवाद है:
इसका सीमित वर्कर नेटवर्क पहुँच को Codex ऐप-सर्वर के होस्ट किए गए
`web_search` टूल को सौंपता है।

यह स्वचालित अनुमति मनमाने `web_fetch` URL पर लागू नहीं होती। trusted प्रॉक्सी के
उन कृत्रिम श्रेणियों का स्वामी होने पर ही `web_fetch` के लिए
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` और `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` को स्पष्ट रूप से सक्षम करें।

## कॉन्फ़िगरेशन

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // डिफ़ॉल्ट: true
        provider: "brave", // या स्वतः-पहचान के लिए इसे छोड़ दें
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

प्रदाता-विशिष्ट कॉन्फ़िगरेशन (API कुंजियाँ, बेस URL, मोड)
`plugins.entries.<plugin>.config.webSearch.*` के अंतर्गत रहता है। Gemini अपने समर्पित वेब-खोज कॉन्फ़िगरेशन और
`GEMINI_API_KEY` के बाद कम-प्राथमिकता वाले फ़ॉलबैक के रूप में
`models.providers.google.apiKey` और `models.providers.google.baseUrl` का भी पुनः उपयोग कर सकता है। उदाहरणों के लिए
प्रदाता पृष्ठ देखें।
Grok, `openclaw models auth login
--provider xai --method oauth` से xAI OAuth प्रमाणीकरण प्रोफ़ाइल का भी पुनः उपयोग कर सकता है; API-कुंजी कॉन्फ़िगरेशन फ़ॉलबैक बना रहता है।

`tools.web.search.provider` को बंडल और इंस्टॉल किए गए Plugin मैनिफ़ेस्ट द्वारा
घोषित वेब-खोज प्रदाता ID के विरुद्ध सत्यापित किया जाता है। `"brvae"` जैसी टाइपो,
चुपचाप स्वतः-पहचान पर लौटने के बजाय कॉन्फ़िगरेशन सत्यापन को विफल कर देती है। यदि किसी
कॉन्फ़िगर किए गए प्रदाता के लिए केवल पुराना Plugin प्रमाण हो, जैसे किसी तृतीय-पक्ष Plugin को
अनइंस्टॉल करने के बाद बचा हुआ `plugins.entries.<plugin>` ब्लॉक,
तो OpenClaw स्टार्टअप को लचीला बनाए रखता है और चेतावनी देता है, ताकि आप
Plugin को फिर से इंस्टॉल कर सकें या पुराने कॉन्फ़िगरेशन को साफ़ करने के लिए
`openclaw doctor --fix` चला सकें।

`web_fetch` फ़ॉलबैक प्रदाता का चयन अलग है:

- इसे `tools.web.fetch.provider` से चुनें
- या उस फ़ील्ड को छोड़ दें और OpenClaw को कॉन्फ़िगर किए गए क्रेडेंशियल से पहला तैयार वेब-फ़ेच
  प्रदाता स्वतः पहचानने दें
- गैर-सैंडबॉक्स `web_fetch` उन इंस्टॉल किए गए Plugin प्रदाताओं का उपयोग कर सकता है जो
  `contracts.webFetchProviders` घोषित करते हैं; सैंडबॉक्स फ़ेच बंडल प्रदाताओं और
  सत्यापित आधिकारिक Plugin इंस्टॉलेशन की अनुमति देते हैं, लेकिन तृतीय-पक्ष बाहरी Plugin को बाहर रखते हैं
- आधिकारिक Firecrawl Plugin आज एकमात्र बंडल किया गया `webFetchProviders`
  योगदानकर्ता है, जिसे
  `plugins.entries.firecrawl.config.webFetch.*` के अंतर्गत कॉन्फ़िगर किया जाता है

`openclaw onboard` या `openclaw configure --section web` के दौरान **Kimi** चुनने पर,
OpenClaw ये भी पूछ सकता है:

- Moonshot API क्षेत्र (`https://api.moonshot.ai/v1` या `https://api.moonshot.cn/v1`)
- डिफ़ॉल्ट Kimi वेब-खोज मॉडल (डिफ़ॉल्ट `kimi-k2.6`)

`x_search` के लिए `plugins.entries.xai.config.xSearch.*` कॉन्फ़िगर करें। यह
चैट वाली समान xAI प्रमाणीकरण प्रोफ़ाइल या Grok वेब खोज द्वारा उपयोग किए जाने वाले
`XAI_API_KEY` / Plugin वेब-खोज क्रेडेंशियल का उपयोग करता है।
पुराने `tools.web.x_search.*` कॉन्फ़िगरेशन को `openclaw doctor --fix` स्वचालित रूप से माइग्रेट करता है।
`openclaw onboard` या `openclaw configure --section web` के दौरान Grok चुनने पर,
Grok सेटअप पूरा होने के तुरंत बाद OpenClaw समान क्रेडेंशियल के साथ वैकल्पिक
`x_search` सेटअप भी प्रस्तुत करता है। यह Grok पथ के भीतर एक अलग अनुवर्ती चरण है,
वेब-खोज प्रदाता का कोई अलग शीर्ष-स्तरीय विकल्प नहीं। यदि आप कोई अन्य
प्रदाता चुनते हैं, तो OpenClaw `x_search` प्रॉम्प्ट नहीं दिखाता।

### API कुंजियाँ संग्रहीत करना

<Tabs>
  <Tab title="कॉन्फ़िगरेशन फ़ाइल">
    `openclaw configure --section web` चलाएँ या कुंजी को सीधे सेट करें:

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
  <Tab title="परिवेश चर">
    प्रदाता परिवेश चर को Gateway प्रक्रिया के परिवेश में सेट करें:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway इंस्टॉलेशन के लिए इसे `~/.openclaw/.env` में रखें।
    [परिवेश चर](/hi/help/faq#env-vars-and-env-loading) देखें।

  </Tab>
</Tabs>

## टूल पैरामीटर

| पैरामीटर             | विवरण                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | खोज क्वेरी (आवश्यक)                                            |
| `count`               | लौटाए जाने वाले परिणाम (1-10, डिफ़ॉल्ट: 5)                               |
| `country`             | 2-अक्षरीय ISO देश कोड (जैसे "US", "DE")                        |
| `language`            | ISO 639-1 भाषा कोड (जैसे "en", "de")                          |
| `search_lang`         | खोज-भाषा कोड (केवल Brave)                                  |
| `freshness`           | समय फ़िल्टर: `day`, `week`, `month`, या `year`                     |
| `date_after`          | इस तारीख के बाद के परिणाम (YYYY-MM-DD)                               |
| `date_before`         | इस तारीख से पहले के परिणाम (YYYY-MM-DD)                              |
| `ui_lang`             | UI भाषा कोड (केवल Brave)                                      |
| `domain_filter`       | डोमेन अनुमति-सूची/अस्वीकृति-सूची ऐरे (केवल Perplexity)                  |
| `max_tokens`          | कुल सामग्री टोकन बजट, केवल नेटिव Perplexity Search API      |
| `max_tokens_per_page` | प्रति-पृष्ठ निष्कर्षण टोकन सीमा, केवल नेटिव Perplexity Search API |

<Warning>
  सभी पैरामीटर सभी प्रदाताओं के साथ काम नहीं करते। Brave का `llm-context` मोड
  `ui_lang` को अस्वीकार करता है; `date_before` के लिए `date_after` भी आवश्यक है, क्योंकि Brave की कस्टम
  ताज़गी सीमाओं के लिए आरंभ और समाप्ति, दोनों तारीखें आवश्यक होती हैं।
  Gemini, Grok और Kimi उद्धरणों सहित एक संश्लेषित उत्तर लौटाते हैं। वे
  साझा-टूल संगतता के लिए `count` स्वीकार करते हैं, लेकिन इससे
  आधार-स्रोतों पर आधारित उत्तर का स्वरूप नहीं बदलता। Gemini, `day` ताज़गी को हालिया होने के संकेत के रूप में मानता है; अधिक व्यापक
  ताज़गी मान और स्पष्ट तारीखें Google Search के आधार-स्रोत समय-क्षेत्र निर्धारित करती हैं।
  जब आप Sonar/OpenRouter
  संगतता पथ (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` या `OPENROUTER_API_KEY`) का उपयोग करते हैं, तो Perplexity भी इसी तरह व्यवहार करता है; यह पथ `max_tokens` और
  `max_tokens_per_page` समर्थन भी हटा देता है।
  SearXNG केवल विश्वसनीय निजी-नेटवर्क या लूपबैक होस्ट के लिए `http://` स्वीकार करता है;
  सार्वजनिक SearXNG एंडपॉइंट को `https://` का उपयोग करना होगा।
  Firecrawl और Tavily, `web_search` के माध्यम से केवल `query` और `count` का समर्थन करते हैं
  -- उन्नत विकल्पों के लिए उनके समर्पित टूल का उपयोग करें।
</Warning>

## x_search

`x_search`, xAI का उपयोग करके X (पूर्व में Twitter) पोस्टों की क्वेरी करता है और
उद्धरणों सहित AI-संश्लेषित उत्तर लौटाता है। यह स्वाभाविक-भाषा क्वेरी और
वैकल्पिक संरचित फ़िल्टर स्वीकार करता है। OpenClaw, अंतर्निहित xAI `x_search`
टूल को स्थायी रूप से पंजीकृत रखने के बजाय प्रत्येक अनुरोध के लिए बनाता है, इसलिए यह केवल
उसी टर्न के लिए सक्रिय होता है जो वास्तव में इसे कॉल करता है।

<Warning>
  `x_search` xAI के सर्वरों पर चलता है। xAI प्रति 1,000 टूल कॉल के लिए $5 और साथ में
  मॉडल के इनपुट तथा आउटपुट टोकन का शुल्क लेता है।
</Warning>

<Note>
  xAI के दस्तावेज़ों के अनुसार `x_search` कीवर्ड खोज, सिमैंटिक खोज, उपयोगकर्ता
  खोज और थ्रेड प्राप्ति का समर्थन करता है। रीपोस्ट,
  उत्तर, बुकमार्क या व्यू जैसे प्रति-पोस्ट सहभागिता आँकड़ों के लिए, सटीक पोस्ट URL
  या स्टेटस ID की लक्षित खोज को प्राथमिकता दें। व्यापक कीवर्ड खोज सही पोस्ट ढूँढ़ सकती है, लेकिन
  प्रति-पोस्ट मेटाडेटा कम पूर्ण लौटा सकती है। एक अच्छा तरीका है: पहले पोस्ट ढूँढ़ें, फिर
  उसी सटीक पोस्ट पर केंद्रित दूसरी `x_search` क्वेरी चलाएँ।
</Note>

### x_search कॉन्फ़िगरेशन

`enabled` को छोड़ने पर, `x_search` केवल तभी उपलब्ध कराया जाता है जब सक्रिय मॉडल का
प्रदाता `xai` हो और xAI क्रेडेंशियल उपलब्ध हों। ज्ञात
गैर-xAI प्रदाता वाले सक्रिय मॉडल के लिए, विभिन्न प्रदाताओं में उपयोग चुनने हेतु `plugins.entries.xai.config.xSearch.enabled` को `true` पर सेट करें।
यदि सक्रिय मॉडल प्रदाता अनुपस्थित या
अनसुलझा है, तो टूल छिपा रहता है। इसे प्रत्येक प्रदाता के लिए अक्षम करने हेतु `enabled` को `false` पर सेट करें।
xAI क्रेडेंशियल हमेशा आवश्यक हैं।

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // किसी ज्ञात गैर-xAI मॉडल प्रदाता के लिए आवश्यक
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // वैकल्पिक, webSearch.baseUrl को ओवरराइड करता है
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // यदि कोई xAI प्रमाणीकरण प्रोफ़ाइल या XAI_API_KEY सेट है, तो वैकल्पिक
            baseUrl: "https://api.x.ai/v1", // वैकल्पिक साझा xAI Responses आधार URL
          },
        },
      },
    },
  },
}
```

जब `plugins.entries.xai.config.xSearch.baseUrl` सेट हो, तो `x_search`, `<baseUrl>/responses` पर पोस्ट करता है।
यदि वह फ़ील्ड छोड़ा गया है,
तो यह पहले `plugins.entries.xai.config.webSearch.baseUrl`, फिर
पुराने `tools.web.search.grok.baseUrl`, और अंततः सार्वजनिक xAI एंडपॉइंट
(`https://api.x.ai/v1`) का उपयोग करता है।

### x_search पैरामीटर

| पैरामीटर                    | विवरण                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | खोज क्वेरी (आवश्यक)                                |
| `allowed_x_handles`          | परिणामों को अधिकतम 20 X हैंडल तक सीमित करें               |
| `excluded_x_handles`         | अधिकतम 20 X हैंडल बाहर रखें                           |
| `from_date`                  | केवल इस तारीख को या इसके बाद की पोस्ट शामिल करें (YYYY-MM-DD)  |
| `to_date`                    | केवल इस तारीख को या इससे पहले की पोस्ट शामिल करें (YYYY-MM-DD) |
| `enable_image_understanding` | xAI को मेल खाने वाली पोस्टों से जुड़ी छवियों का निरीक्षण करने दें      |
| `enable_video_understanding` | xAI को मेल खाने वाली पोस्टों से जुड़े वीडियो का निरीक्षण करने दें      |

`allowed_x_handles` और `excluded_x_handles` परस्पर अनन्य हैं।

### x_search उदाहरण

```javascript
await x_search({
  query: "रात के खाने की रेसिपी",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// प्रति-पोस्ट आँकड़े: जब संभव हो, सटीक स्टेटस URL या स्टेटस ID का उपयोग करें
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

// तारीख सीमा
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

यदि आप टूल प्रोफ़ाइल या अनुमति-सूचियों का उपयोग करते हैं, तो `web_search`, `x_search`, या `group:web` जोड़ें:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // या: allow: ["group:web"]  (इसमें web_search, x_search और web_fetch शामिल हैं)
  },
}
```

## संबंधित

- [वेब फ़ेच](/hi/tools/web-fetch) -- किसी URL से पठनीय सामग्री प्राप्त और निष्कर्षित करें
- [वेब ब्राउज़र](/hi/tools/browser) -- JS-प्रधान साइटों के लिए पूर्ण ब्राउज़र स्वचालन
- [Grok खोज](/hi/tools/grok-search) -- `web_search` प्रदाता के रूप में Grok
- [Ollama वेब खोज](/hi/tools/ollama-search) -- आपके Ollama होस्ट के माध्यम से कुंजी-रहित वेब खोज
