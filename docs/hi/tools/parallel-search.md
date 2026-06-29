---
read_when:
    - आप API कुंजी के बिना वेब खोज चाहते हैं
    - आपको Parallel का सशुल्क Search API चाहिए
    - आप LLM संदर्भ दक्षता के लिए क्रमबद्ध सघन अंश चाहते हैं
summary: समानांतर खोज -- वेब स्रोतों से LLM-अनुकूलित सघन अंश
title: समानांतर खोज
x-i18n:
    generated_at: "2026-06-29T00:22:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin दो [Parallel](https://parallel.ai/) `web_search` प्रदाता देता है:

- **Parallel Search (Free)** (`parallel-free`) -- Parallel का मुफ़्त
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)। किसी
  खाते या API कुंजी की ज़रूरत नहीं है। जब आप Parallel का होस्ट किया हुआ
  बिना-कुंजी खोज पथ चाहते हैं, तो इसे स्पष्ट रूप से चुनें।
- **Parallel Search** (`parallel`) -- Parallel का भुगतान वाला Search API। इसके लिए
  `PARALLEL_API_KEY` चाहिए और यह अधिक दर सीमाएँ और objective tuning देता है।

दोनों AI agents के लिए बनाए गए वेब इंडेक्स से रैंक किए गए, LLM-अनुकूलित अंश लौटाते हैं।
किसी एक को स्पष्ट रूप से चुनने के लिए `tools.web.search.provider` को
`parallel-free` या `parallel` पर सेट करें।

<Note>
  OpenAI Responses मॉडल `tools.web.search.provider` सेट न होने पर OpenAI की
  मूल वेब खोज का उपयोग करते हैं, इसलिए वे Parallel प्रदाताओं को बायपास करते हैं।
  उन्हें Parallel के ज़रिए रूट करने के लिए `tools.web.search.provider` को
  `parallel-free` या `parallel` पर सेट करें।
</Note>

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway को रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API कुंजी (भुगतान वाला प्रदाता)

`parallel-free` को API कुंजी की ज़रूरत नहीं है, लेकिन इसे फिर भी managed
प्रदाता के रूप में चुनना होगा। भुगतान वाले `parallel` प्रदाता को API कुंजी चाहिए:

<Steps>
  <Step title="खाता बनाएं">
    [platform.parallel.ai](https://platform.parallel.ai) पर साइन अप करें और
    अपने डैशबोर्ड से API कुंजी जनरेट करें।
  </Step>
  <Step title="कुंजी स्टोर करें">
    Gateway environment में `PARALLEL_API_KEY` सेट करें, या इसके ज़रिए कॉन्फ़िगर करें:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## कॉन्फ़िगरेशन

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Environment विकल्प:** Gateway environment में `PARALLEL_API_KEY` सेट करें।
Gateway इंस्टॉल के लिए, इसे `~/.openclaw/.env` में रखें।

## Base URL ओवरराइड

Base URL ओवरराइड केवल भुगतान वाले `parallel` प्रदाता पर लागू होता है। मुफ़्त
`parallel-free` प्रदाता हमेशा `https://search.parallel.ai/mcp` का उपयोग करता है।

जब Parallel अनुरोधों को किसी compatible proxy या वैकल्पिक Parallel endpoint
(उदाहरण के लिए, Cloudflare AI Gateway) के ज़रिए जाना हो, तो
`plugins.entries.parallel.config.webSearch.baseUrl` सेट करें। OpenClaw bare hosts को
`https://` जोड़कर normalize करता है और `/v1/search` जोड़ता है, जब तक path पहले से
वहीं समाप्त न हो। हल किया गया endpoint search cache key में शामिल होता है, इसलिए
अलग-अलग Parallel endpoints से आए परिणाम साझा नहीं किए जाते।

## Tool पैरामीटर

OpenClaw Parallel की native search shape को expose करता है ताकि मॉडल
natural-language goal और कुछ छोटी keyword queries, दोनों भर सके — यह pairing
Parallel सर्वोत्तम परिणामों के लिए [अनुशंसित](https://docs.parallel.ai/search/best-practices)
करता है।

<ParamField path="objective" type="string" required>
मूल प्रश्न या लक्ष्य का natural-language विवरण (अधिकतम 5000 chars)।
यह अपने-आप में पूर्ण होना चाहिए।
</ParamField>

<ParamField path="search_queries" type="string[]" required>
संक्षिप्त keyword search queries, प्रत्येक 3-6 शब्द (1-5 entries, प्रत्येक अधिकतम 200 chars)।
सर्वोत्तम परिणामों के लिए 2-3 विविध queries दें।
</ParamField>

<ParamField path="count" type="number">
लौटाए जाने वाले परिणाम (1-40)।
</ParamField>

<ParamField path="session_id" type="string">
वैकल्पिक Parallel session id (`parallel` पर अधिकतम 1000 chars; मुफ़्त
`parallel-free` Search MCP इसे 100 पर सीमित करता है)। उसी task का हिस्सा होने वाली
follow-up searches पर पिछले Parallel result से मिला `sessionId` पास करें ताकि Parallel
संबंधित calls को group कर सके और बाद के परिणाम सुधार सके। सीमा से अधिक id को
हटा दिया जाता है और नया id जनरेट किया जाता है।
</ParamField>

<ParamField path="client_model" type="string">
Call करने वाले मॉडल का वैकल्पिक identifier (जैसे `claude-opus-4-7`,
`gpt-5.5`)। इससे Parallel आपके मॉडल की capabilities के अनुसार default settings
अनुकूलित कर सकता है। exact active model slug पास करें; इसे family alias तक छोटा न करें।
</ParamField>

## नोट्स

- Parallel परिणामों को human click-through के बजाय LLM reasoning utility के आधार पर
  rank और compress करता है; इसलिए प्रत्येक result में full-page content के बजाय
  dense excerpts की अपेक्षा करें
- Result excerpts `excerpts` array के रूप में वापस आते हैं और generic `web_search`
  contract के साथ compatibility के लिए `description` field में भी जोड़ दिए जाते हैं
- Parallel हर response पर `session_id` लौटाता है; OpenClaw इसे tool payload में
  `sessionId` के रूप में surface करता है ताकि callers follow-up searches को group कर सकें
- Parallel से आए `searchId`, `warnings`, और `usage` मौजूद होने पर pass through किए जाते हैं
- OpenClaw हमेशा resolved result count को `advanced_settings.max_results` के रूप में
  Parallel को forward करता है। caller का `count` arg पहले मान्य होता है, फिर
  top-level `tools.web.search.maxResults` setting, अन्यथा OpenClaw का generic
  `web_search` default (5)। इससे providers के बीच switch करते समय result volume
  consistent रहता है; Parallel अपने-आप 10 पर default करता है
- परिणाम default रूप से 15 मिनट तक cache किए जाते हैं (`cacheTtlMinutes` के ज़रिए
  configurable)
- मुफ़्त `parallel-free` प्रदाता वही parameters स्वीकार करता है। यह `count` को
  client-side लागू करता है और जब कोई `session_id` नहीं दिया जाता, तो हर call के लिए
  एक `session_id` जनरेट करता है।

## संबंधित

- [Web Search overview](/hi/tools/web) -- सभी प्रदाता और auto-detection
- [Exa search](/hi/tools/exa-search) -- content extraction के साथ neural search
- [Perplexity Search](/hi/tools/perplexity-search) -- domain filtering के साथ structured results
