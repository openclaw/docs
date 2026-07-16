---
read_when:
    - आप Tavily-समर्थित वेब खोज चाहते हैं
    - आपको Tavily API कुंजी की आवश्यकता है
    - आप Tavily को web_search प्रदाता के रूप में चाहते हैं
    - आप URLs से सामग्री निकालना चाहते हैं
summary: Tavily खोज और निष्कर्षण टूल
title: Tavily
x-i18n:
    generated_at: "2026-07-16T17:36:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) AI अनुप्रयोगों के लिए डिज़ाइन किया गया एक खोज API है। OpenClaw इसे दो तरीकों से उपलब्ध कराता है:

- सामान्य खोज टूल के लिए `web_search` प्रदाता के रूप में
- स्पष्ट Plugin टूल के रूप में: `tavily_search` और `tavily_extract`

Tavily LLM के उपयोग के लिए अनुकूलित संरचित परिणाम देता है, जिसमें कॉन्फ़िगर करने योग्य खोज गहराई, विषय फ़िल्टरिंग, डोमेन फ़िल्टर, AI-जनित उत्तर सारांश और URL से सामग्री निष्कर्षण (JavaScript द्वारा रेंडर किए गए पृष्ठों सहित) शामिल हैं।

| प्रॉपर्टी  | मान                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- |
| Plugin आईडी | `tavily`                                                                                      |
| पैकेज   | `@openclaw/tavily-plugin`                                                                     |
| प्रमाणीकरण      | `TAVILY_API_KEY` परिवेश चर या कॉन्फ़िग `apiKey`                                                   |
| बेस URL  | `https://api.tavily.com` (डिफ़ॉल्ट); ओवरराइड करने के लिए `TAVILY_BASE_URL` परिवेश चर या कॉन्फ़िग `baseUrl` |
| टाइमआउट  | खोज के लिए 30s, निष्कर्षण के लिए 60s (डिफ़ॉल्ट)                                                             |
| टूल     | `tavily_search`, `tavily_extract`                                                             |

## आरंभ करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="API कुंजी प्राप्त करें">
    [tavily.com](https://tavily.com) पर Tavily खाता बनाएँ, फिर डैशबोर्ड में एक API कुंजी जनरेट करें।
  </Step>
  <Step title="Plugin और प्रदाता कॉन्फ़िगर करें">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // वैकल्पिक, यदि TAVILY_API_KEY सेट है
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
  <Step title="सत्यापित करें कि खोज चलती है">
    किसी भी एजेंट से `web_search` ट्रिगर करें या सीधे `tavily_search` कॉल करें।
  </Step>
</Steps>

<Tip>
ऑनबोर्डिंग या `openclaw configure --section web` में Tavily चुनने पर आवश्यकता होने पर आधिकारिक Tavily Plugin इंस्टॉल और सक्षम हो जाता है।
</Tip>

## टूल संदर्भ

### `tavily_search`

जब सामान्य `web_search` के बजाय Tavily-विशिष्ट खोज नियंत्रण चाहिए, तो इसका उपयोग करें।

| पैरामीटर         | प्रकार         | प्रतिबंध / डिफ़ॉल्ट                  | विवरण                                   |
| ----------------- | ------------ | -------------------------------------- | --------------------------------------------- |
| `query`           | स्ट्रिंग       | आवश्यक                               | खोज क्वेरी स्ट्रिंग।                          |
| `search_depth`    | एनम         | `basic` (डिफ़ॉल्ट), `advanced`          | `advanced` धीमा है, लेकिन अधिक प्रासंगिकता देता है।    |
| `topic`           | एनम         | `general` (डिफ़ॉल्ट), `news`, `finance` | विषय श्रेणी के अनुसार फ़िल्टर करें।                       |
| `max_results`     | पूर्णांक      | 1-20, डिफ़ॉल्ट `5`                      | परिणामों की संख्या।                            |
| `include_answer`  | बूलियन      | डिफ़ॉल्ट `false`                        | Tavily का AI-जनित उत्तर सारांश शामिल करें। |
| `time_range`      | एनम         | `day`, `week`, `month`, `year`         | नवीनता के अनुसार परिणाम फ़िल्टर करें।                    |
| `include_domains` | स्ट्रिंग ऐरे | (कोई नहीं)                                 | केवल इन डोमेन के परिणाम शामिल करें।      |
| `exclude_domains` | स्ट्रिंग ऐरे | (कोई नहीं)                                 | इन डोमेन के परिणामों को बाहर रखें।           |

खोज गहराई का संतुलन:

| गहराई      | गति  | प्रासंगिकता | इसके लिए सर्वोत्तम                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | तेज़ | उच्च      | सामान्य-उद्देश्य वाली क्वेरी (डिफ़ॉल्ट)।   |
| `advanced` | धीमा | सर्वाधिक   | सटीक शोध और तथ्य-खोज। |

### `tavily_extract`

एक या अधिक URL से साफ़ सामग्री निकालने के लिए इसका उपयोग करें। यह JavaScript द्वारा रेंडर किए गए पृष्ठों को संभालता है और लक्षित निष्कर्षण के लिए क्वेरी-केंद्रित चंकिंग का समर्थन करता है।

| पैरामीटर           | प्रकार         | प्रतिबंध / डिफ़ॉल्ट         | विवरण                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | स्ट्रिंग ऐरे | आवश्यक, 1-20                | वे URL जिनसे सामग्री निकालनी है।                               |
| `query`             | स्ट्रिंग       | (वैकल्पिक)                    | इस क्वेरी से प्रासंगिकता के आधार पर निकाले गए चंकों को फिर से रैंक करें।         |
| `extract_depth`     | एनम         | `basic` (डिफ़ॉल्ट), `advanced` | अधिक JS वाले पृष्ठों, SPA या डायनेमिक तालिकाओं के लिए `advanced` का उपयोग करें। |
| `chunks_per_source` | पूर्णांक      | 1-5; **`query` आवश्यक है**     | प्रति URL लौटाए गए चंक। `query` के बिना सेट करने पर त्रुटि होती है।     |
| `include_images`    | बूलियन      | डिफ़ॉल्ट `false`               | परिणामों में इमेज URL शामिल करें।                              |

निष्कर्षण गहराई का संतुलन:

| गहराई      | कब उपयोग करें                                |
| ---------- | ------------------------------------------ |
| `basic`    | सरल पृष्ठ। पहले इसे आज़माएँ।              |
| `advanced` | JS द्वारा रेंडर किए गए SPA, डायनेमिक सामग्री, तालिकाएँ। |

<Tip>
बड़ी URL सूचियों को एकाधिक `tavily_extract` कॉल में बाँटें (प्रति अनुरोध अधिकतम 20)। पूरे पृष्ठों के बजाय केवल प्रासंगिक सामग्री पाने के लिए `query` के साथ `chunks_per_source` का उपयोग करें।
</Tip>

## सही टूल चुनना

| आवश्यकता                                 | टूल             |
| ------------------------------------ | ---------------- |
| त्वरित वेब खोज, कोई विशेष विकल्प नहीं | `web_search`     |
| गहराई, विषय और AI उत्तरों के साथ खोज | `tavily_search`  |
| विशिष्ट URL से सामग्री निकालना   | `tavily_extract` |

<Note>
Tavily प्रदाता वाला सामान्य `web_search` टूल `query` और `count` (अधिकतम 20 परिणाम) का समर्थन करता है। Tavily-विशिष्ट नियंत्रणों (`search_depth`, `topic`, `include_answer`, डोमेन फ़िल्टर, समय सीमा) के लिए इसके बजाय `tavily_search` का उपयोग करें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="API कुंजी समाधान क्रम">
    Tavily क्लाइंट अपनी API कुंजी इस क्रम में खोजता है:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (SecretRefs के माध्यम से हल किया गया)।
    2. Gateway परिवेश से `TAVILY_API_KEY`।

    यदि दोनों में से कोई भी मौजूद नहीं है, तो `tavily_search` और `tavily_extract` दोनों सेटअप त्रुटि उत्पन्न करते हैं।

  </Accordion>

  <Accordion title="कस्टम बेस URL">
    यदि Tavily को प्रॉक्सी के माध्यम से उपलब्ध कराते हैं, तो `plugins.entries.tavily.config.webSearch.baseUrl` को ओवरराइड करें या `TAVILY_BASE_URL` सेट करें। कॉन्फ़िग को परिवेश चर से प्राथमिकता मिलती है। डिफ़ॉल्ट `https://api.tavily.com` है।
  </Accordion>

  <Accordion title="`chunks_per_source` के लिए `query` आवश्यक है">
    `tavily_extract` उन कॉल को अस्वीकार करता है जो `query` के बिना `chunks_per_source` पास करती हैं। Tavily क्वेरी प्रासंगिकता के अनुसार चंकों को रैंक करता है, इसलिए इसके बिना यह पैरामीटर अर्थहीन है।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="वेब खोज का अवलोकन" href="/hi/tools/web" icon="magnifying-glass">
    सभी प्रदाता और स्वतः-पहचान नियम।
  </Card>
  <Card title="Firecrawl" href="/hi/tools/firecrawl" icon="fire">
    सामग्री निष्कर्षण सहित खोज और स्क्रैपिंग।
  </Card>
  <Card title="Exa खोज" href="/hi/tools/exa-search" icon="binoculars">
    सामग्री निष्कर्षण सहित न्यूरल खोज।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    Plugin प्रविष्टियों और टूल रूटिंग के लिए पूर्ण कॉन्फ़िग स्कीमा।
  </Card>
</CardGroup>
