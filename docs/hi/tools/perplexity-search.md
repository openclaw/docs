---
read_when:
    - आप वेब खोज के लिए Perplexity Search का उपयोग करना चाहते हैं
    - आपको PERPLEXITY_API_KEY या OPENROUTER_API_KEY सेट अप करना होगा
summary: web_search के लिए Perplexity Search API और Sonar/OpenRouter संगतता
title: Perplexity खोज
x-i18n:
    generated_at: "2026-06-29T00:22:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw Perplexity Search API को `web_search` प्रदाता के रूप में समर्थन करता है।
यह `title`, `url`, और `snippet` फ़ील्ड के साथ संरचित परिणाम लौटाता है।

संगतता के लिए, OpenClaw पुराने Perplexity Sonar/OpenRouter सेटअप का भी समर्थन करता है।
यदि आप `OPENROUTER_API_KEY`, `plugins.entries.perplexity.config.webSearch.apiKey` में कोई `sk-or-...` कुंजी उपयोग करते हैं, या `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` सेट करते हैं, तो प्रदाता chat-completions पथ पर स्विच करता है और संरचित Search API परिणामों के बजाय उद्धरणों के साथ AI-संश्लेषित उत्तर लौटाता है।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity API कुंजी प्राप्त करना

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) पर Perplexity खाता बनाएँ
2. डैशबोर्ड में API कुंजी जनरेट करें
3. कुंजी को कॉन्फ़िग में संग्रहीत करें या Gateway वातावरण में `PERPLEXITY_API_KEY` सेट करें।

## OpenRouter संगतता

यदि आप Perplexity Sonar के लिए पहले से OpenRouter उपयोग कर रहे थे, तो `provider: "perplexity"` रखें और Gateway वातावरण में `OPENROUTER_API_KEY` सेट करें, या `plugins.entries.perplexity.config.webSearch.apiKey` में कोई `sk-or-...` कुंजी संग्रहीत करें।

वैकल्पिक संगतता नियंत्रण:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## कॉन्फ़िग उदाहरण

### नेटिव Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar संगतता

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## कुंजी कहाँ सेट करें

**कॉन्फ़िग के माध्यम से:** `openclaw configure --section web` चलाएँ। यह कुंजी को
`plugins.entries.perplexity.config.webSearch.apiKey` के अंतर्गत `~/.openclaw/openclaw.json` में संग्रहीत करता है।
वह फ़ील्ड SecretRef ऑब्जेक्ट भी स्वीकार करता है।

**वातावरण के माध्यम से:** Gateway प्रक्रिया वातावरण में `PERPLEXITY_API_KEY` या `OPENROUTER_API_KEY`
सेट करें। Gateway इंस्टॉल के लिए, इसे
`~/.openclaw/.env` (या अपने सेवा वातावरण) में रखें। [Env vars](/hi/help/faq#env-vars-and-env-loading) देखें।

यदि `provider: "perplexity"` कॉन्फ़िगर है और Perplexity कुंजी SecretRef बिना किसी env fallback के अनसुलझी है, तो startup/reload तुरंत विफल हो जाता है।

## टूल पैरामीटर

ये पैरामीटर नेटिव Perplexity Search API पथ पर लागू होते हैं।

<ParamField path="query" type="string" required>
खोज क्वेरी।
</ParamField>

<ParamField path="count" type="number" default="5">
लौटाए जाने वाले परिणामों की संख्या (1-10)।
</ParamField>

<ParamField path="country" type="string">
2-अक्षरीय ISO देश कोड (जैसे `US`, `DE`)।
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 भाषा कोड (जैसे `en`, `de`, `fr`)।
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
समय फ़िल्टर - `day` 24 घंटे है।
</ParamField>

<ParamField path="date_after" type="string">
केवल इस तारीख के बाद प्रकाशित परिणाम (`YYYY-MM-DD`)।
</ParamField>

<ParamField path="date_before" type="string">
केवल इस तारीख से पहले प्रकाशित परिणाम (`YYYY-MM-DD`)।
</ParamField>

<ParamField path="domain_filter" type="string[]">
डोमेन allowlist/denylist ऐरे (अधिकतम 20)।
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
कुल सामग्री बजट (अधिकतम 1000000)।
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
प्रति-पृष्ठ टोकन सीमा।
</ParamField>

पुराने Sonar/OpenRouter संगतता पथ के लिए:

- `query`, `count`, और `freshness` स्वीकार किए जाते हैं
- वहाँ `count` केवल संगतता के लिए है; प्रतिक्रिया फिर भी N-परिणाम सूची के बजाय उद्धरणों के साथ एक संश्लेषित
  उत्तर होती है
- केवल Search API वाले फ़िल्टर जैसे `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, और `max_tokens_per_page`
  स्पष्ट त्रुटियाँ लौटाते हैं

**उदाहरण:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### डोमेन फ़िल्टर नियम

- प्रति फ़िल्टर अधिकतम 20 डोमेन
- एक ही अनुरोध में allowlist और denylist को मिलाया नहीं जा सकता
- denylist प्रविष्टियों के लिए `-` उपसर्ग का उपयोग करें (जैसे, `["-reddit.com"]`)

## टिप्पणियाँ

- Perplexity Search API संरचित वेब खोज परिणाम (`title`, `url`, `snippet`) लौटाता है
- OpenRouter या स्पष्ट `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` संगतता के लिए Perplexity को वापस Sonar chat completions पर स्विच करता है
- Sonar/OpenRouter संगतता संरचित परिणाम पंक्तियों के बजाय उद्धरणों के साथ एक संश्लेषित उत्तर लौटाती है
- परिणाम डिफ़ॉल्ट रूप से 15 मिनट के लिए कैश किए जाते हैं (`cacheTtlMinutes` के माध्यम से कॉन्फ़िगर करने योग्य)

## संबंधित

<CardGroup cols={2}>
  <Card title="वेब खोज अवलोकन" href="/hi/tools/web" icon="globe">
    सभी प्रदाता और ऑटो-डिटेक्शन नियम।
  </Card>
  <Card title="Brave खोज" href="/hi/tools/brave-search" icon="shield">
    देश और भाषा फ़िल्टर के साथ संरचित परिणाम।
  </Card>
  <Card title="Exa खोज" href="/hi/tools/exa-search" icon="magnifying-glass">
    सामग्री निष्कर्षण के साथ न्यूरल खोज।
  </Card>
  <Card title="Perplexity Search API दस्तावेज़" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    आधिकारिक Perplexity Search API क्विकस्टार्ट और संदर्भ।
  </Card>
</CardGroup>
