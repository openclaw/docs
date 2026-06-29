---
read_when:
    - आप Tavily-समर्थित वेब खोज चाहते हैं
    - आपको Tavily API कुंजी चाहिए
    - आप Tavily को web_search प्रदाता के रूप में चाहते हैं
    - आप URLs से सामग्री निष्कर्षण चाहते हैं
summary: Tavily खोज और निष्कर्षण टूल
title: Tavily
x-i18n:
    generated_at: "2026-06-29T00:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) एक खोज API है जिसे AI अनुप्रयोगों के लिए डिज़ाइन किया गया है। OpenClaw इसे दो तरीकों से उपलब्ध कराता है:

- सामान्य खोज टूल के लिए `web_search` प्रदाता के रूप में
- स्पष्ट plugin टूल के रूप में: `tavily_search` और `tavily_extract`

Tavily LLM उपभोग के लिए अनुकूलित संरचित परिणाम लौटाता है, जिनमें कॉन्फ़िगर करने योग्य खोज गहराई, विषय फ़िल्टरिंग, डोमेन फ़िल्टर, AI-जनित उत्तर सारांश, और URL से सामग्री निष्कर्षण शामिल हैं (JavaScript-रेंडर किए गए पृष्ठों सहित)।

| गुण        | मान                                 |
| --------- | ----------------------------------- |
| Plugin आईडी | `tavily`                            |
| पैकेज      | `@openclaw/tavily-plugin`           |
| प्रमाणीकरण | `TAVILY_API_KEY` या config `apiKey` |
| आधार URL  | `https://api.tavily.com` (डिफ़ॉल्ट) |
| टूल        | `tavily_search`, `tavily_extract`   |

## शुरू करना

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    [tavily.com](https://tavily.com) पर Tavily खाता बनाएं, फिर डैशबोर्ड में API कुंजी जनरेट करें।
  </Step>
  <Step title="Configure the plugin and provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify search runs">
    किसी भी एजेंट से `web_search` ट्रिगर करें, या सीधे `tavily_search` कॉल करें।
  </Step>
</Steps>

<Tip>
ऑनबोर्डिंग में Tavily चुनना या `openclaw configure --section web` आवश्यकता होने पर आधिकारिक Tavily plugin इंस्टॉल और सक्षम करता है।
</Tip>

## टूल संदर्भ

### `tavily_search`

जब आप सामान्य `web_search` के बजाय Tavily-विशिष्ट खोज नियंत्रण चाहते हों, तब इसका उपयोग करें।

| पैरामीटर          | प्रकार       | सीमाएं / डिफ़ॉल्ट                       | विवरण                                           |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | आवश्यक                                | खोज क्वेरी string। 400 वर्णों से कम रखें।       |
| `search_depth`    | enum         | `basic` (डिफ़ॉल्ट), `advanced`          | `advanced` धीमा है लेकिन प्रासंगिकता अधिक है।  |
| `topic`           | enum         | `general` (डिफ़ॉल्ट), `news`, `finance` | विषय परिवार के अनुसार फ़िल्टर करें।            |
| `max_results`     | integer      | 1-20                                   | परिणामों की संख्या।                            |
| `include_answer`  | boolean      | डिफ़ॉल्ट `false`                       | Tavily AI-जनित उत्तर सारांश शामिल करें।        |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | नवीनता के अनुसार परिणाम फ़िल्टर करें।          |
| `include_domains` | string array | (कोई नहीं)                             | केवल इन डोमेन से परिणाम शामिल करें।            |
| `exclude_domains` | string array | (कोई नहीं)                             | इन डोमेन से परिणाम बाहर रखें।                  |

खोज गहराई का संतुलन:

| गहराई      | गति   | प्रासंगिकता | इसके लिए सर्वोत्तम                         |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | तेज़   | उच्च      | सामान्य-उद्देश्य क्वेरी (डिफ़ॉल्ट)।       |
| `advanced` | धीमा  | सर्वोच्च  | सटीक शोध और तथ्य-जांच।                  |

### `tavily_extract`

एक या अधिक URL से साफ़ सामग्री निकालने के लिए इसका उपयोग करें। यह JavaScript-रेंडर किए गए पृष्ठों को संभालता है और लक्षित निष्कर्षण के लिए क्वेरी-केंद्रित चंकिंग का समर्थन करता है।

| पैरामीटर            | प्रकार       | सीमाएं / डिफ़ॉल्ट              | विवरण                                                        |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | आवश्यक, 1-20                  | जिन URL से सामग्री निकालनी है।                              |
| `query`             | string       | (वैकल्पिक)                    | निकाले गए चंक्स को इस क्वेरी से प्रासंगिकता के अनुसार फिर से रैंक करें। |
| `extract_depth`     | enum         | `basic` (डिफ़ॉल्ट), `advanced` | JS-भारी पृष्ठों, SPA, या डायनेमिक तालिकाओं के लिए `advanced` का उपयोग करें। |
| `chunks_per_source` | integer      | 1-5; **`query` आवश्यक है**    | प्रति URL लौटाए गए चंक्स। `query` के बिना सेट करने पर त्रुटि। |
| `include_images`    | boolean      | डिफ़ॉल्ट `false`              | परिणामों में छवि URL शामिल करें।                            |

निष्कर्षण गहराई का संतुलन:

| गहराई      | कब उपयोग करें                              |
| ---------- | ------------------------------------------ |
| `basic`    | सरल पृष्ठ। पहले इसे आज़माएं।              |
| `advanced` | JS-रेंडर किए गए SPA, डायनेमिक सामग्री, तालिकाएं। |

<Tip>
बड़ी URL सूचियों को कई `tavily_extract` कॉल में बैच करें (प्रति अनुरोध अधिकतम 20)। पूर्ण पृष्ठों के बजाय केवल प्रासंगिक सामग्री पाने के लिए `query` के साथ `chunks_per_source` का उपयोग करें।
</Tip>

## सही टूल चुनना

| आवश्यकता                              | टूल             |
| ------------------------------------ | ---------------- |
| तेज़ वेब खोज, कोई विशेष विकल्प नहीं | `web_search`     |
| गहराई, विषय, AI उत्तरों के साथ खोज  | `tavily_search`  |
| विशिष्ट URL से सामग्री निकालना      | `tavily_extract` |

<Note>
Tavily को प्रदाता के रूप में उपयोग करने वाला सामान्य `web_search` टूल `query` और `count` (20 परिणामों तक) का समर्थन करता है। Tavily-विशिष्ट नियंत्रणों (`search_depth`, `topic`, `include_answer`, डोमेन फ़िल्टर, समय सीमा) के लिए इसके बजाय `tavily_search` का उपयोग करें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="API key resolution order">
    Tavily क्लाइंट अपनी API कुंजी इस क्रम में खोजता है:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (SecretRefs के माध्यम से हल किया गया)।
    2. Gateway परिवेश से `TAVILY_API_KEY`।

    यदि दोनों में से कोई मौजूद नहीं है, तो `tavily_extract` सेटअप त्रुटि उठाता है।

  </Accordion>

  <Accordion title="Custom base URL">
    यदि आप Tavily को प्रॉक्सी के माध्यम से आगे भेजते हैं, तो `plugins.entries.tavily.config.webSearch.baseUrl` को ओवरराइड करें। डिफ़ॉल्ट `https://api.tavily.com` है।
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` उन कॉल को अस्वीकार करता है जो `query` के बिना `chunks_per_source` पास करती हैं। Tavily क्वेरी प्रासंगिकता के अनुसार चंक्स को रैंक करता है, इसलिए इसके बिना यह पैरामीटर निरर्थक है।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/hi/tools/web" icon="magnifying-glass">
    सभी प्रदाता और स्वतः-पहचान नियम।
  </Card>
  <Card title="Firecrawl" href="/hi/tools/firecrawl" icon="fire">
    सामग्री निष्कर्षण के साथ खोज और स्क्रैपिंग।
  </Card>
  <Card title="Exa Search" href="/hi/tools/exa-search" icon="binoculars">
    सामग्री निष्कर्षण के साथ न्यूरल खोज।
  </Card>
  <Card title="Configuration" href="/hi/gateway/configuration" icon="gear">
    plugin प्रविष्टियों और टूल रूटिंग के लिए पूर्ण config स्कीमा।
  </Card>
</CardGroup>
