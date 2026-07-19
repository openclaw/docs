---
read_when:
    - आप Firecrawl-समर्थित वेब निष्कर्षण चाहते हैं
    - आप बिना कुंजी वाला Firecrawl Search (निःशुल्क) या बिना कुंजी वाला web_fetch चाहते हैं
    - खोज या अधिक सीमाओं के लिए आपको Firecrawl API कुंजी की आवश्यकता है
    - आप Firecrawl को web_search प्रदाता के रूप में चाहते हैं
    - आप web_fetch के लिए एंटी-बॉट निष्कर्षण चाहते हैं
summary: Firecrawl खोज, स्क्रैपिंग और web_fetch फ़ॉलबैक
title: Firecrawl
x-i18n:
    generated_at: "2026-07-19T09:35:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw **Firecrawl** का उपयोग तीन तरीकों से कर सकता है:

- `web_search` प्रदाता के रूप में
- स्पष्ट Plugin टूल के रूप में: `firecrawl_search` और `firecrawl_scrape`
- `web_fetch` के लिए फ़ॉलबैक एक्सट्रैक्टर के रूप में

यह एक होस्ट की गई एक्सट्रैक्शन/सर्च सेवा है, जो बॉट अवरोध से बचने और कैशिंग का समर्थन करती है। इससे JS-प्रधान साइटों या साधारण HTTP फ़ेच को ब्लॉक करने वाले पेजों पर मदद मिलती है।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## बिना कुंजी की पहुँच और API कुंजियाँ

Firecrawl दो `web_search` प्रदाता पंजीकृत करता है:

- **Firecrawl Search** (`firecrawl`) — आपकी कुंजी के साथ होस्ट किए गए `/v2/search` API का उपयोग करता है; कुंजी मौजूद होने पर स्वतः पहचाना जाता है।
- **Firecrawl Search (Free)** (`firecrawl-free`) — होस्ट किए गए बिना-कुंजी वाले स्टार्टर टियर का उपयोग करता है; API कुंजी आवश्यक नहीं है। यह **केवल ऑप्ट-इन** है और कभी स्वतः नहीं चुना जाता, क्योंकि इसे चुनने पर आपकी सर्च क्वेरी Firecrawl के मुफ़्त टियर को भेजी जाती हैं।

स्पष्ट रूप से चुना गया Firecrawl `web_fetch` फ़ॉलबैक भी बिना कुंजी के काम करता है। स्पष्ट `firecrawl_search` और `firecrawl_scrape` टूल के लिए API कुंजी आवश्यक है। अधिक सीमाओं के लिए Gateway परिवेश में `FIRECRAWL_API_KEY` जोड़ें या इसे कॉन्फ़िगर करें।

## Firecrawl सर्च कॉन्फ़िगर करें

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

- ऑनबोर्डिंग या `openclaw configure --section web` में Firecrawl चुनने पर इंस्टॉल किया गया Firecrawl Plugin स्वतः सक्षम हो जाता है।
- API कुंजी के बिना चलाने के लिए ऑनबोर्डिंग में **Firecrawl Search (Free)** चुनें (या `provider: "firecrawl-free"` सेट करें)। कुंजी वाला **Firecrawl Search** प्रदाता `plugins.entries.firecrawl.config.webSearch.apiKey` या `FIRECRAWL_API_KEY` भेजता है।
- Firecrawl के साथ `web_search`, `query` और `count` का समर्थन करता है।
- `sources`, `categories`, या परिणाम स्क्रैपिंग जैसे Firecrawl-विशिष्ट नियंत्रणों के लिए `firecrawl_search` का उपयोग करें।
- `baseUrl` का डिफ़ॉल्ट `https://api.firecrawl.dev` पर होस्ट किया गया Firecrawl है। स्वयं होस्ट किए गए ओवरराइड केवल निजी/आंतरिक एंडपॉइंट के लिए अनुमत हैं; HTTP केवल उन निजी लक्ष्यों के लिए स्वीकार किया जाता है।
- `FIRECRAWL_BASE_URL`, Firecrawl सर्च और स्क्रैप के बेस URL के लिए साझा परिवेश फ़ॉलबैक है।
- Firecrawl सर्च अनुरोधों का डिफ़ॉल्ट टाइमआउट 30 सेकंड है; `firecrawl_search` का `timeoutSeconds` पैरामीटर प्रत्येक कॉल के लिए इसे ओवरराइड करता है।

## Firecrawl web_fetch फ़ॉलबैक कॉन्फ़िगर करें

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // स्पष्ट चयन बिना-कुंजी वाला फ़ॉलबैक सक्षम करता है
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

- स्पष्ट रूप से चुना गया Firecrawl `web_fetch` फ़ॉलबैक API कुंजी के बिना काम करता है। कॉन्फ़िगर होने पर OpenClaw अधिक सीमाओं के लिए `plugins.entries.firecrawl.config.webFetch.apiKey` या `FIRECRAWL_API_KEY` भेजता है।
- ऑनबोर्डिंग या `openclaw configure --section web` के दौरान Firecrawl चुनने पर Plugin सक्षम होता है और `web_fetch` के लिए Firecrawl चुना जाता है, जब तक कि कोई अन्य फ़ेच प्रदाता पहले से कॉन्फ़िगर न हो।
- `firecrawl_scrape` के लिए API कुंजी आवश्यक है।
- `maxAgeMs` यह नियंत्रित करता है कि कैश किए गए परिणाम कितने पुराने हो सकते हैं (ms)। डिफ़ॉल्ट 172,800,000 ms (2 दिन) है।
- `onlyMainContent` का डिफ़ॉल्ट `true` है; `timeoutSeconds` का डिफ़ॉल्ट 60 है।
- पुराने `tools.web.fetch.firecrawl.*` और `tools.web.search.firecrawl.*` कॉन्फ़िगरेशन को `openclaw doctor --fix` द्वारा स्वतः माइग्रेट किया जाता है।
- Firecrawl स्क्रैप/बेस URL ओवरराइड सर्च के समान होस्टेड/निजी नियम का पालन करते हैं: सार्वजनिक होस्टेड ट्रैफ़िक `https://api.firecrawl.dev` का उपयोग करता है; स्वयं होस्ट किए गए ओवरराइड को निजी/आंतरिक एंडपॉइंट पर रिज़ॉल्व होना चाहिए।
- `firecrawl_scrape`, Firecrawl को अग्रेषित करने से पहले स्पष्ट निजी, लूपबैक, मेटाडेटा और गैर-HTTP(S) लक्ष्य URL अस्वीकार करता है, जो स्पष्ट Firecrawl स्क्रैप कॉल के `web_fetch` लक्ष्य-सुरक्षा अनुबंध से मेल खाता है।

`firecrawl_scrape` उन्हीं `plugins.entries.firecrawl.config.webFetch.*` सेटिंग और परिवेश वेरिएबल का पुनः उपयोग करता है, जिसमें इसकी आवश्यक API कुंजी भी शामिल है।

### स्वयं होस्ट किया गया Firecrawl

Firecrawl को स्वयं चलाते समय `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl`, या `FIRECRAWL_BASE_URL` सेट करें। OpenClaw केवल लूपबैक, निजी नेटवर्क, `.local`, `.internal`, या `.localhost` लक्ष्यों के लिए `http://` स्वीकार करता है। सार्वजनिक कस्टम होस्ट अस्वीकार किए जाते हैं, ताकि Firecrawl API कुंजियाँ गलती से मनमाने एंडपॉइंट को न भेजी जाएँ।

## Firecrawl Plugin टूल

### `firecrawl_search`

जब सामान्य `web_search` के बजाय Firecrawl-विशिष्ट सर्च नियंत्रण चाहिए, तो इसका उपयोग करें। API कुंजी आवश्यक है।

पैरामीटर:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (केवल होस्टनेम; परस्पर अनन्य)
- `tbs` (समय फ़िल्टर, उदाहरण के लिए `qdr:d`, `qdr:w`, `sbd:1`)
- `location` और `country` (भौगोलिक लक्ष्यीकरण)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

इसका उपयोग उन JS-प्रधान या बॉट-संरक्षित पेजों के लिए करें, जहाँ साधारण `web_fetch` कमज़ोर पड़ता है।

पैरामीटर:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## स्टेल्थ / बॉट अवरोध से बचाव

`firecrawl_scrape` और `web_fetch` Firecrawl फ़ॉलबैक का डिफ़ॉल्ट `proxy: "auto"` के साथ `storeInCache: true` है, जब तक कि कॉलर उन पैरामीटर को ओवरराइड न करे। `firecrawl_search` और `web_search` Firecrawl प्रदाता में `proxy`/`storeInCache` नियंत्रण नहीं हैं; स्टेल्थ प्रॉक्सी मोड केवल स्क्रैप/फ़ेच अनुरोधों पर लागू होता है।

Firecrawl का `proxy` मोड बॉट अवरोध से बचाव (`basic`, `stealth`, या `auto`) नियंत्रित करता है। यदि सामान्य प्रयास विफल हो जाता है, तो `auto` स्टेल्थ प्रॉक्सी के साथ पुनः प्रयास करता है, जिसमें केवल सामान्य स्क्रैपिंग की तुलना में अधिक क्रेडिट लग सकते हैं।

## `web_fetch` Firecrawl का उपयोग कैसे करता है

`web_fetch` एक्सट्रैक्शन क्रम:

1. Readability (स्थानीय)
2. कॉन्फ़िगर किया गया फ़ेच प्रदाता, जैसे Firecrawl (चुने जाने पर, या कॉन्फ़िगर किए गए क्रेडेंशियल से स्वतः पहचाने जाने पर)
3. मूल HTML सफ़ाई (अंतिम फ़ॉलबैक)

चयन सेटिंग `tools.web.fetch.provider` है। इसे छोड़ने पर OpenClaw उपलब्ध क्रेडेंशियल से पहले तैयार वेब-फ़ेच प्रदाता को स्वतः पहचानता है। आधिकारिक Firecrawl Plugin वह फ़ॉलबैक प्रदान करता है।

## संबंधित

- [वेब सर्च का अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वतः पहचान
- [वेब फ़ेच](/hi/tools/web-fetch) -- Firecrawl फ़ॉलबैक वाला web_fetch टूल
- [Tavily](/hi/tools/tavily) -- सर्च + एक्सट्रैक्ट टूल
