---
read_when:
    - आप web_search के लिए Exa का उपयोग करना चाहते हैं
    - आपको एक EXA_API_KEY की आवश्यकता है
    - आप न्यूरल खोज या सामग्री निष्कर्षण चाहते हैं
summary: Exa AI खोज -- सामग्री निष्कर्षण के साथ न्यूरल और कीवर्ड खोज
title: Exa खोज
x-i18n:
    generated_at: "2026-07-16T17:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) एक `web_search` प्रदाता है, जिसमें न्यूरल, कीवर्ड और
हाइब्रिड खोज मोड के साथ अंतर्निहित सामग्री निष्कर्षण (हाइलाइट, टेक्स्ट,
सारांश) उपलब्ध है।

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API कुंजी प्राप्त करें

<Steps>
  <Step title="खाता बनाएँ">
    [exa.ai](https://exa.ai/) पर साइन अप करें और अपने
    डैशबोर्ड से API कुंजी जनरेट करें।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway परिवेश में `EXA_API_KEY` सेट करें, या इसके माध्यम से कॉन्फ़िगर करें:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // यदि EXA_API_KEY सेट है तो वैकल्पिक
            baseUrl: "https://api.exa.ai", // वैकल्पिक; OpenClaw /search जोड़ता है
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**परिवेश विकल्प:** Gateway परिवेश में `EXA_API_KEY` सेट करें। Gateway
इंस्टॉलेशन के लिए, इसे `~/.openclaw/.env` में रखें। देखें
[परिवेश चर](/hi/help/faq#env-vars-and-env-loading)।

## आधार URL ओवरराइड

Exa खोज अनुरोधों को किसी संगत प्रॉक्सी या वैकल्पिक एंडपॉइंट
से रूट करने के लिए `plugins.entries.exa.config.webSearch.baseUrl` सेट करें। OpenClaw
`https://` को आगे जोड़कर केवल होस्ट वाले मानों को सामान्यीकृत करता है और, यदि
पथ पहले से वहाँ समाप्त नहीं होता, तो `/search` जोड़ता है। निर्धारित एंडपॉइंट खोज
कैश कुंजी का भाग होता है, इसलिए अलग-अलग एंडपॉइंट के परिणाम कभी साझा नहीं किए जाते।

## टूल पैरामीटर

<ParamField path="query" type="string" required>
खोज क्वेरी।
</ParamField>

<ParamField path="count" type="number" default="5">
लौटाए जाने वाले परिणाम (1-100, Exa खोज-प्रकार की सीमाओं के अधीन)।
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
खोज मोड।
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
समय फ़िल्टर। इसे `date_after`/`date_before` के साथ संयोजित नहीं किया जा सकता।
</ParamField>

<ParamField path="date_after" type="string">
इस तारीख के बाद के परिणाम (`YYYY-MM-DD`)।
</ParamField>

<ParamField path="date_before" type="string">
इस तारीख से पहले के परिणाम (`YYYY-MM-DD`)।
</ParamField>

<ParamField path="contents" type="object">
सामग्री निष्कर्षण विकल्प (नीचे देखें)।
</ParamField>

### सामग्री निष्कर्षण

परिणामों में निकाली गई सामग्री को नियंत्रित करने के लिए एक `contents` ऑब्जेक्ट पास करें:

```javascript
await web_search({
  query: "ट्रांसफ़ॉर्मर आर्किटेक्चर की व्याख्या",
  type: "neural",
  contents: {
    text: true, // पूरे पृष्ठ का टेक्स्ट
    highlights: { numSentences: 3 }, // मुख्य वाक्य
    summary: true, // AI सारांश
  },
});
```

| सामग्री विकल्प | प्रकार                                                                  | विवरण                    |
| --------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | पूरे पृष्ठ का टेक्स्ट निकालें |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | मुख्य वाक्य निकालें          |
| `summary`       | `boolean \| { query }`                                                | AI-जनित सारांश            |

यदि `contents` को छोड़ दिया जाता है, तो Exa डिफ़ॉल्ट रूप से `{ highlights: true }` का उपयोग करता है, जिससे परिणामों
में मुख्य वाक्यों के अंश शामिल होते हैं। परिणाम विवरण पहले हाइलाइट,
फिर सारांश, फिर पूरे टेक्स्ट से निर्धारित होते हैं -- इनमें से जो भी पहले उपलब्ध हो। उपलब्ध होने पर परिणाम
Exa API प्रतिक्रिया के अपरिष्कृत `highlightScores` और `summary` फ़ील्ड भी
संरक्षित रखते हैं।

### खोज मोड

| मोड             | विवरण                              |
| ---------------- | ---------------------------------- |
| `auto`           | Exa सर्वोत्तम मोड चुनता है (डिफ़ॉल्ट) |
| `neural`         | अर्थ-आधारित/सिमेंटिक खोज             |
| `fast`           | त्वरित कीवर्ड खोज                    |
| `deep`           | विस्तृत गहन खोज                      |
| `deep-reasoning` | तर्क सहित गहन खोज                   |
| `instant`        | सबसे तेज़ परिणाम                    |

## टिप्पणियाँ

- `count` Exa खोज-प्रकार की सीमाओं के अधीन अधिकतम 100 स्वीकार करता है।
- परिणाम डिफ़ॉल्ट रूप से 15 मिनट के लिए कैश किए जाते हैं। Exa सहित सभी
  `web_search` प्रदाताओं के लिए कैशिंग और
  अनुरोध टाइमआउट बदलने हेतु साझा `tools.web.search.cacheTtlMinutes` (मिनट) और
  `tools.web.search.timeoutSeconds` (डिफ़ॉल्ट 30 सेकंड) कॉन्फ़िगर करें।

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वचालित पहचान
- [Brave Search](/hi/tools/brave-search) -- देश/भाषा फ़िल्टर वाले संरचित परिणाम
- [Perplexity Search](/hi/tools/perplexity-search) -- डोमेन फ़िल्टरिंग वाले संरचित परिणाम
