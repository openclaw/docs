---
read_when:
    - आप वेब खोज के लिए Perplexity Search का उपयोग करना चाहते हैं
    - आपको PERPLEXITY_API_KEY या OPENROUTER_API_KEY सेट अप करना होगा
summary: web_search के लिए Perplexity Search API और Sonar/OpenRouter संगतता
title: Perplexity खोज
x-i18n:
    generated_at: "2026-07-19T09:56:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw, Perplexity Search API को `web_search` प्रदाता के रूप में समर्थित करता है। यह `title`, `url`, और `snippet` फ़ील्ड वाले संरचित परिणाम लौटाता है।

संगतता के लिए, OpenClaw पुराने Perplexity Sonar/OpenRouter सेटअप का भी समर्थन करता है। यदि आप `OPENROUTER_API_KEY`, `plugins.entries.perplexity.config.webSearch.apiKey` में `sk-or-...` कुंजी का उपयोग करते हैं, या `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` सेट करते हैं, तो प्रदाता चैट-कम्प्लीशन्स पथ पर स्विच हो जाता है और संरचित Search API परिणामों के बजाय उद्धरणों सहित AI द्वारा संश्लेषित उत्तर लौटाता है।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity API कुंजी प्राप्त करना

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) पर Perplexity खाता बनाएँ।
2. डैशबोर्ड में API कुंजी जनरेट करें।
3. कुंजी को कॉन्फ़िगरेशन में संग्रहीत करें या Gateway परिवेश में `PERPLEXITY_API_KEY` सेट करें।

## OpenRouter संगतता

यदि आप Perplexity Sonar के लिए पहले से OpenRouter का उपयोग कर रहे थे, तो `provider: "perplexity"` बनाए रखें और Gateway परिवेश में `OPENROUTER_API_KEY` सेट करें, या `plugins.entries.perplexity.config.webSearch.apiKey` में `sk-or-...` कुंजी संग्रहीत करें।

वैकल्पिक संगतता नियंत्रण:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## कॉन्फ़िगरेशन उदाहरण

### मूल Perplexity Search API

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

**कॉन्फ़िगरेशन के माध्यम से:** `openclaw configure --section web` चलाएँ। यह कुंजी को `~/.openclaw/openclaw.json` में `plugins.entries.perplexity.config.webSearch.apiKey` के अंतर्गत संग्रहीत करता है। यह फ़ील्ड SecretRef ऑब्जेक्ट भी स्वीकार करता है।

**परिवेश के माध्यम से:** Gateway प्रक्रिया परिवेश में `PERPLEXITY_API_KEY` या `OPENROUTER_API_KEY` सेट करें। Gateway इंस्टॉलेशन के लिए, इसे `~/.openclaw/.env` (या अपने सेवा परिवेश) में रखें। [परिवेश चर](/hi/help/faq#env-vars-and-env-loading) देखें।

यदि `provider: "perplexity"` कॉन्फ़िगर किया गया है और Perplexity कुंजी का SecretRef बिना किसी परिवेश फ़ॉलबैक के अनसुलझा है, तो स्टार्टअप/रीलोड तुरंत विफल हो जाता है।

## टूल पैरामीटर

ये पैरामीटर मूल Perplexity Search API पथ पर लागू होते हैं।

<ParamField path="query" type="string" required>
खोज क्वेरी।
</ParamField>

<ParamField path="count" type="number" default="5">
लौटाए जाने वाले परिणामों की संख्या (1-10)।
</ParamField>

<ParamField path="country" type="string">
2-अक्षरीय ISO देश कोड (उदा. `US`, `DE`)।
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 भाषा कोड (उदा. `en`, `de`, `fr`)।
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
समय फ़िल्टर — `day` का अर्थ 24 घंटे है।
</ParamField>

<ParamField path="date_after" type="string">
केवल इस तारीख के बाद प्रकाशित परिणाम (`YYYY-MM-DD`)।
</ParamField>

<ParamField path="date_before" type="string">
केवल इस तारीख से पहले प्रकाशित परिणाम (`YYYY-MM-DD`)।
</ParamField>

<ParamField path="domain_filter" type="string[]">
डोमेन अनुमत-सूची/अस्वीकृत-सूची सरणी (अधिकतम 20)।
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
कुल सामग्री बजट (अधिकतम 1000000)।
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
प्रति-पृष्ठ टोकन सीमा।
</ParamField>

पुराने Sonar/OpenRouter संगतता पथ के लिए:

- `query`, `count`, और `freshness` स्वीकार किए जाते हैं।
- वहाँ `count` केवल संगतता के लिए है; प्रतिक्रिया फिर भी N-परिणाम सूची के बजाय उद्धरणों वाला एक संश्लेषित उत्तर होती है।
- केवल Search API के फ़िल्टर (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) स्पष्ट त्रुटियाँ लौटाते हैं।

**उदाहरण:**

```javascript
// देश और भाषा-विशिष्ट खोज
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// हाल के परिणाम (पिछला सप्ताह)
await web_search({
  query: "AI news",
  freshness: "week",
});

// तारीख सीमा खोज
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// डोमेन फ़िल्टरिंग (अनुमत-सूची)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// डोमेन फ़िल्टरिंग (अस्वीकृत-सूची — आगे - लगाएँ)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// अधिक सामग्री निष्कर्षण
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### डोमेन फ़िल्टर नियम

- प्रति फ़िल्टर अधिकतम 20 डोमेन।
- एक ही अनुरोध में अनुमत-सूची और अस्वीकृत-सूची प्रविष्टियाँ मिश्रित नहीं की जा सकतीं।
- अस्वीकृत-सूची प्रविष्टियों के लिए `-` उपसर्ग का उपयोग करें (उदा., `["-reddit.com"]`)।

## टिप्पणियाँ

- Perplexity Search API संरचित वेब खोज परिणाम (`title`, `url`, `snippet`) लौटाता है।
- OpenRouter, या स्पष्ट `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, संगतता के लिए Perplexity को वापस Sonar चैट कम्प्लीशन्स पर स्विच करता है।
- Sonar/OpenRouter संगतता संरचित परिणाम पंक्तियों के बजाय उद्धरणों वाला एक संश्लेषित उत्तर लौटाती है।
- डिफ़ॉल्ट रूप से परिणाम 15 मिनट के लिए कैश किए जाते हैं (`cacheTtlMinutes` के माध्यम से कॉन्फ़िगर किया जा सकता है)।

## संबंधित

<CardGroup cols={2}>
  <Card title="वेब खोज का अवलोकन" href="/hi/tools/web" icon="globe">
    सभी प्रदाता और स्वतः-पहचान नियम।
  </Card>
  <Card title="Brave खोज" href="/hi/tools/brave-search" icon="shield">
    देश और भाषा फ़िल्टर वाले संरचित परिणाम।
  </Card>
  <Card title="Exa खोज" href="/hi/tools/exa-search" icon="magnifying-glass">
    सामग्री निष्कर्षण सहित न्यूरल खोज।
  </Card>
  <Card title="Perplexity Search API दस्तावेज़" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    आधिकारिक Perplexity Search API त्वरित आरंभ और संदर्भ।
  </Card>
</CardGroup>
