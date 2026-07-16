---
read_when:
    - आप web_search के लिए Brave Search का उपयोग करना चाहते हैं
    - आपको BRAVE_API_KEY या प्लान का विवरण चाहिए
summary: web_search के लिए Brave Search API सेटअप
title: Brave खोज
x-i18n:
    generated_at: "2026-07-16T17:38:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw, `web_search` प्रदाता के रूप में Brave Search API का समर्थन करता है।

## API कुंजी प्राप्त करें

1. [https://brave.com/search/api/](https://brave.com/search/api/) पर Brave Search API खाता बनाएँ।
2. डैशबोर्ड में **Search** प्लान चुनें और API कुंजी जनरेट करें।
3. कुंजी को कॉन्फ़िगरेशन में संग्रहीत करें या Gateway परिवेश में `BRAVE_API_KEY` सेट करें।

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // या "llm-context"
            baseUrl: "https://api.search.brave.com", // वैकल्पिक प्रॉक्सी/आधार URL ओवरराइड
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

प्रदाता-विशिष्ट Brave खोज सेटिंग्स `plugins.entries.brave.config.webSearch.*` के अंतर्गत होती हैं; यही मानक कॉन्फ़िगरेशन पथ है। साझा शीर्ष-स्तरीय `tools.web.search.apiKey` और सीमित-दायरे वाला `tools.web.search.brave.*` अब भी संगतता मर्ज के माध्यम से लोड होते हैं, लेकिन नए कॉन्फ़िगरेशन को ऊपर दिए गए Plugin-दायरे वाले पथ का उपयोग करना चाहिए।

`webSearch.mode`, Brave ट्रांसपोर्ट को नियंत्रित करता है:

- `web` (डिफ़ॉल्ट): शीर्षकों, URL और स्निपेट के साथ सामान्य Brave वेब खोज
- `llm-context`: ग्राउंडिंग के लिए पहले से निकाले गए टेक्स्ट खंडों और स्रोतों वाला Brave LLM Context API

`webSearch.baseUrl`, Brave अनुरोधों को किसी विश्वसनीय Brave-संगत प्रॉक्सी
या Gateway पर भेज सकता है। OpenClaw कॉन्फ़िगर किए गए आधार URL में `/res/v1/web/search` या `/res/v1/llm/context` जोड़ता है
और आधार URL को कैश कुंजी में रखता है। सार्वजनिक
एंडपॉइंट को `https://` का उपयोग करना अनिवार्य है; `http://` केवल विश्वसनीय लूपबैक
या निजी-नेटवर्क प्रॉक्सी होस्ट के लिए स्वीकार किया जाता है।

## टूल पैरामीटर

<ParamField path="query" type="string" required>
खोज क्वेरी।
</ParamField>

<ParamField path="count" type="number" default="5">
लौटाए जाने वाले परिणामों की संख्या (1–10)।
</ParamField>

<ParamField path="country" type="string">
2-अक्षरीय ISO देश कोड (जैसे `US`, `DE`)।
</ParamField>

<ParamField path="language" type="string">
खोज परिणामों के लिए ISO 639-1 भाषा कोड (जैसे `en`, `de`, `fr`)।
</ParamField>

<ParamField path="search_lang" type="string">
Brave खोज-भाषा कोड (जैसे `en`, `en-gb`, `zh-hans`)।
</ParamField>

<ParamField path="ui_lang" type="string">
UI तत्वों के लिए ISO भाषा कोड।
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

**उदाहरण:**

```javascript
// देश और भाषा-विशिष्ट खोज
await web_search({
  query: "नवीकरणीय ऊर्जा",
  country: "DE",
  language: "de",
});

// हाल के परिणाम (पिछला सप्ताह)
await web_search({
  query: "AI समाचार",
  freshness: "week",
});

// तारीख सीमा खोज
await web_search({
  query: "AI के विकास",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## टिप्पणियाँ

- OpenClaw, Brave **Search** प्लान का उपयोग करता है। यदि आपके पास कोई पुरानी सदस्यता है (जैसे प्रति माह 2,000 क्वेरी वाला मूल Free प्लान), तो वह मान्य रहती है, लेकिन उसमें LLM Context या अधिक दर सीमाओं जैसी नई सुविधाएँ शामिल नहीं होतीं।
- प्रत्येक Brave प्लान में **प्रति माह \$5 का मुफ़्त क्रेडिट** (नवीनीकृत होने वाला) शामिल है। Search प्लान की लागत प्रति 1,000 अनुरोधों के लिए \$5 है, इसलिए यह क्रेडिट प्रति माह 1,000 क्वेरी कवर करता है। अनपेक्षित शुल्क से बचने के लिए Brave डैशबोर्ड में अपनी उपयोग सीमा सेट करें। वर्तमान प्लान के लिए [Brave API पोर्टल](https://brave.com/search/api/) देखें।
- Search प्लान में LLM Context एंडपॉइंट और AI अनुमान अधिकार शामिल हैं। मॉडल को प्रशिक्षित या ट्यून करने के लिए परिणाम संग्रहीत करने हेतु स्पष्ट संग्रहण अधिकारों वाला प्लान आवश्यक है। Brave की [सेवा की शर्तें](https://api-dashboard.search.brave.com/terms-of-service) देखें।
- `llm-context` मोड सामान्य वेब-खोज स्निपेट संरचना के बजाय स्रोत-आधारित प्रविष्टियाँ लौटाता है।
- `llm-context` मोड `freshness` और सीमाबद्ध `date_after` + `date_before` श्रेणियों का समर्थन करता है। यह `ui_lang` का समर्थन नहीं करता; `date_after` के बिना `date_before` अस्वीकार कर दिया जाता है, क्योंकि Brave में कस्टम ताज़गी श्रेणियों में आरंभ और समाप्ति, दोनों तारीखें शामिल होना आवश्यक है।
- `ui_lang` में `en-US` जैसा क्षेत्र उपटैग शामिल होना अनिवार्य है।
- डिफ़ॉल्ट रूप से परिणाम 15 मिनट के लिए कैश किए जाते हैं (`cacheTtlMinutes` के माध्यम से कॉन्फ़िगर करने योग्य)।
- कस्टम `webSearch.baseUrl` मान Brave कैश पहचान में शामिल किए जाते हैं, इसलिए
  प्रॉक्सी-विशिष्ट प्रतिक्रियाएँ आपस में टकराती नहीं हैं।
- समस्या निवारण के दौरान Brave अनुरोध URL/क्वेरी पैरामीटर, प्रतिक्रिया स्थिति/समय और खोज-कैश हिट/मिस/लेखन घटनाओं को लॉग करने के लिए `brave.http` निदान फ़्लैग सक्षम करें। यह फ़्लैग कभी भी API कुंजी या प्रतिक्रिया बॉडी लॉग नहीं करता, लेकिन खोज क्वेरी संवेदनशील हो सकती हैं।

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वचालित पहचान
- [Perplexity खोज](/hi/tools/perplexity-search) -- डोमेन फ़िल्टरिंग के साथ संरचित परिणाम
- [Exa खोज](/hi/tools/exa-search) -- सामग्री निष्कर्षण के साथ न्यूरल खोज
