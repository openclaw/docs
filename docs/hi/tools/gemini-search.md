---
read_when:
    - आप web_search के लिए Gemini का उपयोग करना चाहते हैं
    - आपको GEMINI_API_KEY या models.providers.google.apiKey की आवश्यकता है
    - आप Google Search ग्राउंडिंग चाहते हैं
summary: Google Search grounding के साथ Gemini वेब खोज
title: Gemini खोज
x-i18n:
    generated_at: "2026-06-29T00:19:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw अंतर्निहित
[Google Search ग्राउंडिंग](https://ai.google.dev/gemini-api/docs/grounding) के साथ Gemini मॉडल का समर्थन करता है,
जो लाइव Google Search परिणामों से समर्थित AI-संश्लेषित उत्तर
साइटेशन सहित लौटाता है।

## API कुंजी प्राप्त करें

<Steps>
  <Step title="कुंजी बनाएँ">
    [Google AI Studio](https://aistudio.google.com/apikey) पर जाएँ और एक
    API कुंजी बनाएँ।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway परिवेश में `GEMINI_API_KEY` सेट करें, `models.providers.google.apiKey`
    का पुनः उपयोग करें, या इसके माध्यम से एक समर्पित वेब-खोज कुंजी कॉन्फ़िगर करें:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**क्रेडेंशियल प्राथमिकता:** Gemini वेब खोज पहले
`plugins.entries.google.config.webSearch.apiKey` का उपयोग करती है, फिर `GEMINI_API_KEY`
का, फिर `models.providers.google.apiKey` का। बेस URL के लिए, समर्पित
`plugins.entries.google.config.webSearch.baseUrl`, `models.providers.google.baseUrl`
से पहले प्रभावी होता है।

Gateway इंस्टॉल के लिए, env कुंजियाँ `~/.openclaw/.env` में रखें।

## यह कैसे काम करता है

पारंपरिक खोज प्रदाताओं के विपरीत, जो लिंक और स्निपेट की सूची लौटाते हैं,
Gemini Google Search ग्राउंडिंग का उपयोग करके इनलाइन साइटेशन वाले
AI-संश्लेषित उत्तर बनाता है। परिणामों में संश्लेषित उत्तर और स्रोत
URL दोनों शामिल होते हैं।

- Gemini ग्राउंडिंग से मिलने वाले साइटेशन URL, Google रीडायरेक्ट URL से
  सीधे URL में स्वचालित रूप से रिज़ॉल्व किए जाते हैं।
- अंतिम साइटेशन URL लौटाने से पहले रीडायरेक्ट रिज़ॉल्यूशन SSRF गार्ड पथ
  (HEAD + रीडायरेक्ट जाँचें + http/https सत्यापन) का उपयोग करता है।
- रीडायरेक्ट रिज़ॉल्यूशन सख्त SSRF डिफ़ॉल्ट का उपयोग करता है, इसलिए
  निजी/आंतरिक लक्ष्यों पर रीडायरेक्ट अवरुद्ध किए जाते हैं।

## समर्थित पैरामीटर

Gemini खोज `query`, `freshness`, `date_after`, और `date_before` का समर्थन करती है।

`count` साझा `web_search` संगतता के लिए स्वीकार किया जाता है, लेकिन Gemini ग्राउंडिंग
अब भी N-परिणाम सूची के बजाय साइटेशन के साथ एक संश्लेषित उत्तर लौटाती है।

`freshness` `day`, `week`, `month`, `year`, और साझा शॉर्टकट
`pd`, `pw`, `pm`, और `py` स्वीकार करता है। `day`/`pd`, Gemini
क्वेरी में कठोर 24-घंटे की सीमा के बजाय हालियापन निर्देश जोड़ता है।
`week`, `month`, `year`, और स्पष्ट `date_after`/`date_before` श्रेणियाँ
Gemini Google Search ग्राउंडिंग का `timeRangeFilter` सेट करती हैं।
`country`, `language`, और `domain_filter` समर्थित नहीं हैं।

## मॉडल चयन

डिफ़ॉल्ट मॉडल `gemini-2.5-flash` है (तेज़ और लागत-प्रभावी)। ग्राउंडिंग का
समर्थन करने वाला कोई भी Gemini मॉडल
`plugins.entries.google.config.webSearch.model` के माध्यम से उपयोग किया जा सकता है।

## बेस URL ओवरराइड

जब Gemini वेब खोज को किसी ऑपरेटर प्रॉक्सी या कस्टम Gemini-संगत एंडपॉइंट
के माध्यम से रूट करना हो, तो `plugins.entries.google.config.webSearch.baseUrl`
सेट करें। यदि यह सेट नहीं है, तो Gemini वेब खोज `models.providers.google.baseUrl`
का पुनः उपयोग करती है। साधारण `https://generativelanguage.googleapis.com` मान को
`https://generativelanguage.googleapis.com/v1beta` में सामान्यीकृत किया जाता है;
कस्टम प्रॉक्सी पथों को पीछे के स्लैश हटाने के बाद दिए गए रूप में रखा जाता है।

## संबंधित

- [Web Search अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वतः-पहचान
- [Brave Search](/hi/tools/brave-search) -- स्निपेट के साथ संरचित परिणाम
- [Perplexity Search](/hi/tools/perplexity-search) -- संरचित परिणाम + सामग्री निष्कर्षण
