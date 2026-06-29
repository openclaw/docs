---
read_when:
    - आप web_search के लिए Exa का उपयोग करना चाहते हैं
    - आपको EXA_API_KEY की आवश्यकता है
    - आप neural search या सामग्री निष्कर्षण चाहते हैं
summary: Exa AI खोज -- सामग्री निष्कर्षण के साथ न्यूरल और कीवर्ड खोज
title: Exa खोज
x-i18n:
    generated_at: "2026-06-29T00:18:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw `web_search` प्रदाता के रूप में [Exa AI](https://exa.ai/) का समर्थन करता है। Exa
बिल्ट-इन सामग्री निष्कर्षण (हाइलाइट, पाठ, सारांश) के साथ न्यूरल, कीवर्ड और
हाइब्रिड खोज मोड प्रदान करता है।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway को रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API कुंजी प्राप्त करें

<Steps>
  <Step title="खाता बनाएँ">
    [exa.ai](https://exa.ai/) पर साइन अप करें और अपने डैशबोर्ड से API कुंजी
    जनरेट करें।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway वातावरण में `EXA_API_KEY` सेट करें, या इसके माध्यम से कॉन्फ़िगर करें:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**वातावरण विकल्प:** Gateway वातावरण में `EXA_API_KEY` सेट करें।
Gateway इंस्टॉल के लिए, इसे `~/.openclaw/.env` में रखें।

## बेस URL ओवरराइड

जब Exa खोज अनुरोधों को किसी संगत प्रॉक्सी या वैकल्पिक Exa एंडपॉइंट से होकर
जाना हो, तब `plugins.entries.exa.config.webSearch.baseUrl` सेट करें। OpenClaw
खाली होस्ट के आगे `https://` जोड़कर उन्हें सामान्यीकृत करता है और `/search` जोड़ता
है, जब तक कि पथ पहले से वहीं समाप्त न होता हो। हल किया गया एंडपॉइंट खोज कैश
कुंजी में शामिल होता है, इसलिए अलग-अलग Exa एंडपॉइंट से मिले परिणाम साझा नहीं किए जाते।

## टूल पैरामीटर

<ParamField path="query" type="string" required>
खोज क्वेरी।
</ParamField>

<ParamField path="count" type="number">
वापस किए जाने वाले परिणाम (1–100)।
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
खोज मोड।
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
समय फ़िल्टर।
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

Exa खोज परिणामों के साथ निकाली गई सामग्री भी लौटा सकता है। सक्षम करने के लिए
`contents` ऑब्जेक्ट पास करें:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| सामग्री विकल्प | प्रकार                                                                  | विवरण            |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | पूरे पेज का पाठ निकालें |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | मुख्य वाक्य निकालें  |
| `summary`       | `boolean \| { query }`                                                | AI-जनित सारांश   |

### खोज मोड

| मोड             | विवरण                       |
| ---------------- | --------------------------------- |
| `auto`           | Exa सबसे अच्छा मोड चुनता है (डिफ़ॉल्ट) |
| `neural`         | अर्थ-आधारित खोज     |
| `fast`           | तेज़ कीवर्ड खोज              |
| `deep`           | गहन विस्तृत खोज              |
| `deep-reasoning` | तर्क के साथ गहन खोज        |
| `instant`        | सबसे तेज़ परिणाम                   |

## नोट्स

- यदि कोई `contents` विकल्प प्रदान नहीं किया गया है, तो Exa डिफ़ॉल्ट रूप से `{ highlights: true }`
  का उपयोग करता है, ताकि परिणामों में मुख्य वाक्य अंश शामिल हों
- उपलब्ध होने पर परिणाम Exa API प्रतिक्रिया से `highlightScores` और `summary` फ़ील्ड
  बनाए रखते हैं
- परिणाम विवरण पहले हाइलाइट से, फिर सारांश से, फिर पूरे पाठ से हल किए जाते हैं —
  जो भी उपलब्ध हो
- `freshness` और `date_after`/`date_before` को जोड़ा नहीं जा सकता — एक ही
  समय-फ़िल्टर मोड का उपयोग करें
- प्रति क्वेरी 100 तक परिणाम लौटाए जा सकते हैं (Exa खोज-प्रकार सीमाओं के
  अधीन)
- परिणाम डिफ़ॉल्ट रूप से 15 मिनट के लिए कैश किए जाते हैं (`cacheTtlMinutes`
  के माध्यम से कॉन्फ़िगर योग्य)
- Exa संरचित JSON प्रतिक्रियाओं वाला आधिकारिक API एकीकरण है

## संबंधित

- [वेब खोज अवलोकन](/hi/tools/web) -- सभी प्रदाता और ऑटो-डिटेक्शन
- [Brave Search](/hi/tools/brave-search) -- देश/भाषा फ़िल्टर के साथ संरचित परिणाम
- [Perplexity Search](/hi/tools/perplexity-search) -- डोमेन फ़िल्टरिंग के साथ संरचित परिणाम
