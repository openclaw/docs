---
read_when:
    - आप web_search के लिए Gemini का उपयोग करना चाहते हैं
    - आपको `GEMINI_API_KEY` या `models.providers.google.apiKey` की आवश्यकता है
    - आप Google Search ग्राउंडिंग चाहते हैं
summary: Google Search ग्राउंडिंग के साथ Gemini वेब खोज
title: Gemini खोज
x-i18n:
    generated_at: "2026-07-16T17:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw में अंतर्निहित
[Google Search ग्राउंडिंग](https://ai.google.dev/gemini-api/docs/grounding) के साथ Gemini मॉडल का समर्थन है,
जो लाइव Google Search परिणामों पर आधारित AI-संश्लेषित उत्तर
उद्धरणों सहित लौटाता है।

## API कुंजी प्राप्त करें

<Steps>
  <Step title="कुंजी बनाएँ">
    [Google AI Studio](https://aistudio.google.com/apikey) पर जाएँ और एक
    API कुंजी बनाएँ।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway परिवेश में `GEMINI_API_KEY` सेट करें, `models.providers.google.apiKey` का पुनः उपयोग
    करें, या इसके माध्यम से एक समर्पित वेब-खोज कुंजी कॉन्फ़िगर करें:

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
            apiKey: "AIza...", // वैकल्पिक, यदि GEMINI_API_KEY या models.providers.google.apiKey सेट है
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // वैकल्पिक; models.providers.google.baseUrl पर फ़ॉलबैक करता है
            model: "gemini-2.5-flash", // डिफ़ॉल्ट
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
`plugins.entries.google.config.webSearch.apiKey`, फिर `GEMINI_API_KEY`,
और फिर `models.providers.google.apiKey` का उपयोग करती है। बेस URL के लिए, समर्पित
`plugins.entries.google.config.webSearch.baseUrl` को
`models.providers.google.baseUrl` से पहले प्राथमिकता मिलती है।

Gateway इंस्टॉलेशन के लिए, परिवेश कुंजियाँ `~/.openclaw/.env` में रखें।

## यह कैसे काम करता है

लिंक और स्निपेट की सूची लौटाने वाले पारंपरिक खोज प्रदाताओं के विपरीत,
Gemini इनलाइन उद्धरणों सहित AI-संश्लेषित उत्तर तैयार करने के लिए Google Search
ग्राउंडिंग का उपयोग करता है। परिणामों में संश्लेषित उत्तर और स्रोत
URL दोनों शामिल होते हैं।

- Gemini ग्राउंडिंग के उद्धरण URL, OpenClaw के SSRF-संरक्षित
  फ़ेच पथ के माध्यम से HEAD अनुरोध द्वारा Google रीडायरेक्ट URL से सीधे URL में
  स्वचालित रूप से रिज़ॉल्व किए जाते हैं (रीडायरेक्ट का अनुसरण, http/https सत्यापन)।
- रीडायरेक्ट रिज़ॉल्यूशन सख्त SSRF डिफ़ॉल्ट का उपयोग करता है, इसलिए
  निजी/आंतरिक लक्ष्यों पर जाने वाले रीडायरेक्ट अवरुद्ध कर दिए जाते हैं।

## समर्थित पैरामीटर

Gemini खोज `query`, `freshness`, `date_after`, और `date_before` का समर्थन करती है।

साझा `web_search` संगतता के लिए `count` स्वीकार किया जाता है, लेकिन Gemini ग्राउंडिंग
फिर भी N-परिणामों की सूची के बजाय उद्धरणों सहित एक संश्लेषित उत्तर
लौटाती है।

`freshness` में `day`, `week`, `month`, `year`, और साझा शॉर्टकट
`pd`, `pw`, `pm`, और `py` स्वीकार किए जाते हैं। `day`/`pd`, 24-घंटे की निश्चित सीमा के बजाय Gemini
क्वेरी में नवीनता संबंधी निर्देश जोड़ता है। `week`, `month`, `year`, और स्पष्ट
`date_after`/`date_before` सीमाएँ Gemini Google Search ग्राउंडिंग का
`timeRangeFilter` सेट करती हैं। `country`, `language`, और `domain_filter` समर्थित नहीं हैं।

## मॉडल चयन

डिफ़ॉल्ट मॉडल `gemini-2.5-flash` है (तेज़ और किफ़ायती)। ग्राउंडिंग का
समर्थन करने वाले किसी भी Gemini मॉडल का उपयोग
`plugins.entries.google.config.webSearch.model` के माध्यम से किया जा सकता है।

## बेस URL ओवरराइड

जब Gemini वेब खोज को ऑपरेटर प्रॉक्सी या कस्टम Gemini-संगत एंडपॉइंट के
माध्यम से रूट करना आवश्यक हो, तब `plugins.entries.google.config.webSearch.baseUrl` सेट करें। यदि
यह सेट नहीं है, तो Gemini वेब खोज `models.providers.google.baseUrl` का पुनः उपयोग करती है। साधारण
`https://generativelanguage.googleapis.com` मान को
`https://generativelanguage.googleapis.com/v1beta` में सामान्यीकृत किया जाता है; कस्टम प्रॉक्सी पथों को
अंतिम स्लैश हटाने के बाद दिए गए रूप में रखा जाता है।

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वतः-पहचान
- [Brave Search](/hi/tools/brave-search) -- स्निपेट सहित संरचित परिणाम
- [Perplexity Search](/hi/tools/perplexity-search) -- संरचित परिणाम + सामग्री निष्कर्षण
