---
read_when:
    - आप web_search के लिए Grok का उपयोग करना चाहते हैं
    - आप वेब खोज के लिए xAI OAuth या XAI_API_KEY का उपयोग करना चाहते हैं
summary: xAI वेब-आधारित उत्तरों के माध्यम से Grok वेब खोज
title: Grok खोज
x-i18n:
    generated_at: "2026-07-19T09:56:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw, Grok को एक `web_search` प्रदाता के रूप में समर्थित करता है, जो लाइव खोज परिणामों
और उद्धरणों द्वारा समर्थित AI-संश्लेषित उत्तर देने के लिए xAI के वेब-आधारित
जवाबों का उपयोग करता है।

Grok वेब खोज उपलब्ध होने पर मौजूदा xAI OAuth साइन-इन को प्राथमिकता देती है।
यदि कोई OAuth प्रोफ़ाइल मौजूद नहीं है, तो वही xAI API कुंजी X (पूर्व में Twitter) पोस्ट खोज के लिए अंतर्निहित
`x_search` टूल और `code_execution`
टूल को भी संचालित करती है। कुंजी को `plugins.entries.xai.config.webSearch.apiKey` पर संग्रहीत करने से
OpenClaw उसे बंडल किए गए xAI मॉडल प्रदाता के फ़ॉलबैक के रूप में भी दोबारा उपयोग कर सकता है।

पोस्ट-स्तरीय X मेट्रिक्स (रीपोस्ट, जवाब, बुकमार्क, व्यू) के लिए, व्यापक खोज क्वेरी के बजाय
सटीक पोस्ट URL या स्टेटस ID के साथ
[`x_search`](/hi/tools/web#x_search) का उपयोग करें।

## ऑनबोर्डिंग और कॉन्फ़िगरेशन

`openclaw onboard` या `openclaw configure --section
web` के दौरान **Grok** चुनने से OpenClaw अलग वेब-खोज कुंजी मांगे बिना
मौजूदा xAI OAuth प्रोफ़ाइल का दोबारा उपयोग कर सकता है। OAuth के बिना, यह xAI API-कुंजी सेटअप का उपयोग करता है।

इसके बाद OpenClaw उसी xAI क्रेडेंशियल के साथ `x_search` सक्षम करने के लिए एक अनुवर्ती चरण प्रस्तुत करता है।
वह अनुवर्ती चरण:

- केवल तभी दिखाई देता है, जब आप `web_search` के लिए Grok चुनते हैं
- कोई अलग शीर्ष-स्तरीय वेब-खोज प्रदाता विकल्प नहीं है
- उसी प्रवाह में वैकल्पिक रूप से `x_search` मॉडल सेट कर सकता है

बाद में कॉन्फ़िगरेशन में `x_search` सक्षम करने या बदलने के लिए इसे छोड़ दें।

## साइन इन करें या API कुंजी प्राप्त करें

<Steps>
  <Step title="xAI OAuth का उपयोग करें">
    यदि आपने ऑनबोर्डिंग या मॉडल प्रमाणीकरण के दौरान पहले ही xAI से साइन इन किया है, तो
    Grok को `web_search` प्रदाता के रूप में चुनें। किसी अलग API कुंजी की आवश्यकता नहीं है:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API कुंजी फ़ॉलबैक का उपयोग करें">
    OAuth अनुपलब्ध होने पर या जब आप जानबूझकर कुंजी-समर्थित वेब-खोज कॉन्फ़िगरेशन चाहते हों,
    [xAI](https://console.x.ai/) से API कुंजी प्राप्त करें।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway परिवेश में `XAI_API_KEY` सेट करें, या इसके माध्यम से कॉन्फ़िगर करें:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // वैकल्पिक, यदि xAI OAuth या XAI_API_KEY उपलब्ध है
            baseUrl: "https://api.x.ai/v1", // वैकल्पिक Responses API प्रॉक्सी/आधार URL ओवरराइड
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**क्रेडेंशियल के विकल्प:** Gateway परिवेश में `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY`, या
`plugins.entries.xai.config.webSearch.apiKey`। Gateway इंस्टॉलेशन के लिए, परिवेश
चर `~/.openclaw/.env` में रखें।

## यह कैसे काम करता है

Grok, Gemini के Google Search ग्राउंडिंग दृष्टिकोण के समान, इनलाइन
उद्धरणों वाले उत्तरों को संश्लेषित करने के लिए xAI के वेब-आधारित जवाबों का उपयोग करता है।

## समर्थित पैरामीटर

Grok खोज `query` का समर्थन करती है। साझा `web_search`
संगतता के लिए `count` स्वीकार किया जाता है, लेकिन Grok हमेशा N-परिणामों की सूची के बजाय
उद्धरणों वाला एक संश्लेषित उत्तर देता है। प्रदाता-विशिष्ट फ़िल्टर समर्थित नहीं हैं।

Grok का डिफ़ॉल्ट टाइमआउट 60 सेकंड है, क्योंकि xAI Responses की वेब-आधारित
खोजों में साझा `web_search` डिफ़ॉल्ट से अधिक समय लग सकता है। इसे
`tools.web.search.timeoutSeconds` से ओवरराइड करें।

## आधार URL ओवरराइड

Grok वेब खोज को ऑपरेटर प्रॉक्सी या xAI-संगत Responses एंडपॉइंट के माध्यम से रूट करने के लिए
`plugins.entries.xai.config.webSearch.baseUrl` सेट करें। OpenClaw अंतिम स्लैश हटाने के बाद
`<baseUrl>/responses` पर पोस्ट करता है। जब तक `plugins.entries.xai.config.xSearch.baseUrl` सेट न हो,
`x_search` उसी `webSearch.baseUrl` पर फ़ॉलबैक करता है।

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वचालित पहचान
- [वेब खोज में x_search](/hi/tools/web#x_search) -- xAI के माध्यम से प्रथम-श्रेणी X खोज
- [Gemini खोज](/hi/tools/gemini-search) -- Google ग्राउंडिंग के माध्यम से AI-संश्लेषित उत्तर
