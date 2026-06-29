---
read_when:
    - आप Firecrawl-समर्थित वेब निष्कर्षण चाहते हैं
    - आप बिना कुंजी वाला Firecrawl web_fetch चाहते हैं
    - खोज या उच्च सीमाओं के लिए आपको Firecrawl API कुंजी की आवश्यकता है
    - आप Firecrawl को web_search प्रदाता के रूप में चाहते हैं
    - आप web_fetch के लिए एंटी-बॉट निष्कर्षण चाहते हैं
summary: Firecrawl खोज, scrape, और web_fetch fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-06-29T00:19:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw **Firecrawl** का उपयोग तीन तरीकों से कर सकता है:

- `web_search` provider के रूप में
- स्पष्ट Plugin tools के रूप में: `firecrawl_search` और `firecrawl_scrape`
- `web_fetch` के लिए फॉलबैक निष्कर्षक के रूप में

यह एक होस्टेड निष्कर्षण/खोज सेवा है जो बॉट परिहार और कैशिंग का समर्थन करती है,
जिससे JS-भारी साइटों या उन पेजों में मदद मिलती है जो सादे HTTP fetch को ब्लॉक करते हैं।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## कुंजी-रहित web_fetch और API कुंजियां

स्पष्ट रूप से चुना गया होस्टेड Firecrawl `web_fetch` फॉलबैक API कुंजी के बिना स्टार्टर
एक्सेस का समर्थन करता है। जब आपको उच्च सीमाओं की जरूरत हो, तो gateway वातावरण में
`FIRECRAWL_API_KEY` जोड़ें या इसे कॉन्फिगर करें। Firecrawl `web_search` और
`firecrawl_scrape` के लिए API कुंजी जरूरी है।

## Firecrawl खोज कॉन्फिगर करें

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

नोट्स:

- onboarding में Firecrawl चुनने या `openclaw configure --section web` चलाने पर इंस्टॉल किया गया Firecrawl Plugin अपने-आप सक्षम हो जाता है।
- Firecrawl के साथ `web_search` `query` और `count` का समर्थन करता है।
- `sources`, `categories` या परिणाम scraping जैसे Firecrawl-विशिष्ट नियंत्रणों के लिए `firecrawl_search` का उपयोग करें।
- `baseUrl` का डिफॉल्ट `https://api.firecrawl.dev` पर होस्टेड Firecrawl है। स्व-होस्टेड ओवरराइड केवल निजी/आंतरिक endpoints के लिए अनुमत हैं; HTTP केवल उन्हीं निजी targets के लिए स्वीकार किया जाता है।
- `FIRECRAWL_BASE_URL` Firecrawl खोज और scrape base URLs के लिए साझा env फॉलबैक है।

## Firecrawl web_fetch फॉलबैक कॉन्फिगर करें

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

नोट्स:

- स्पष्ट रूप से चुना गया Firecrawl `web_fetch` फॉलबैक API कुंजी के बिना काम करता है। कॉन्फिगर होने पर, OpenClaw उच्च सीमाओं के लिए `plugins.entries.firecrawl.config.webFetch.apiKey` या `FIRECRAWL_API_KEY` भेजता है।
- onboarding के दौरान Firecrawl चुनने या `openclaw configure --section web` चलाने पर Plugin सक्षम हो जाता है और `web_fetch` के लिए Firecrawl चुना जाता है, जब तक कोई दूसरा fetch provider पहले से कॉन्फिगर न हो।
- `firecrawl_scrape` के लिए API कुंजी जरूरी है।
- `maxAgeMs` नियंत्रित करता है कि cached परिणाम कितने पुराने हो सकते हैं (ms)। डिफॉल्ट 2 दिन है।
- लेगेसी `tools.web.fetch.firecrawl.*` config को `openclaw doctor --fix` अपने-आप migrate करता है।
- Firecrawl scrape/base URL ओवरराइड खोज जैसे ही होस्टेड/निजी नियम का पालन करते हैं: सार्वजनिक होस्टेड traffic `https://api.firecrawl.dev` का उपयोग करता है; स्व-होस्टेड ओवरराइड को निजी/आंतरिक endpoints पर resolve होना चाहिए।
- `firecrawl_scrape` स्पष्ट Firecrawl scrape calls के लिए `web_fetch` target-safety contract से मेल खाते हुए, स्पष्ट निजी, loopback, metadata और non-HTTP(S) target URLs को Firecrawl पर forward करने से पहले अस्वीकार करता है।

`firecrawl_scrape` वही `plugins.entries.firecrawl.config.webFetch.*` settings और env vars दोबारा उपयोग करता है, जिसमें इसकी जरूरी API कुंजी भी शामिल है।

### स्व-होस्टेड Firecrawl

जब आप Firecrawl खुद चलाते हैं, तो `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` या `FIRECRAWL_BASE_URL`
सेट करें। OpenClaw `http://` केवल loopback,
private-network, `.local`, `.internal` या `.localhost` targets के लिए स्वीकार करता है। सार्वजनिक custom
hosts अस्वीकार किए जाते हैं ताकि Firecrawl API कुंजियां गलती से मनमाने endpoints पर न भेजी जाएं।

## Firecrawl Plugin tools

### `firecrawl_search`

इसे तब उपयोग करें जब आपको generic `web_search` के बजाय Firecrawl-विशिष्ट खोज नियंत्रण चाहिए हों।

मुख्य parameters:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

इसे JS-भारी या बॉट-सुरक्षित पेजों के लिए उपयोग करें जहां सादा `web_fetch` कमजोर पड़ता है।

मुख्य parameters:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / बॉट परिहार

Firecrawl बॉट परिहार के लिए **proxy mode** parameter उजागर करता है (`basic`, `stealth` या `auto`)।
OpenClaw Firecrawl requests के लिए हमेशा `proxy: "auto"` और `storeInCache: true` का उपयोग करता है।
अगर proxy छोड़ा गया है, तो Firecrawl का डिफॉल्ट `auto` होता है। `auto` basic प्रयास विफल होने पर stealth proxies के साथ retry करता है, जिससे basic-only scraping की तुलना में
अधिक credits लग सकते हैं।

## `web_fetch` Firecrawl का उपयोग कैसे करता है

`web_fetch` निष्कर्षण क्रम:

1. Readability (स्थानीय)
2. Firecrawl (चुने जाने पर, या कॉन्फिगर किए गए credentials से अपने-आप detect होने पर)
3. बेसिक HTML cleanup (अंतिम फॉलबैक)

चयन knob `tools.web.fetch.provider` है। अगर आप इसे छोड़ते हैं, तो OpenClaw
उपलब्ध credentials से पहले तैयार web-fetch provider को अपने-आप detect करता है।
आधिकारिक Firecrawl Plugin वह फॉलबैक प्रदान करता है।

## संबंधित

- [Web Search अवलोकन](/hi/tools/web) -- सभी providers और auto-detection
- [Web Fetch](/hi/tools/web-fetch) -- Firecrawl फॉलबैक वाला web_fetch tool
- [Tavily](/hi/tools/tavily) -- खोज + extract tools
