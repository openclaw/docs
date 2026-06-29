---
read_when:
    - आप web_search के लिए Grok का उपयोग करना चाहते हैं
    - आप वेब खोज के लिए xAI OAuth या XAI_API_KEY का उपयोग करना चाहते हैं
summary: Grok वेब खोज xAI वेब-आधारित प्रतिक्रियाओं के माध्यम से
title: Grok खोज
x-i18n:
    generated_at: "2026-06-29T00:20:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw Grok को `web_search` प्रदाता के रूप में समर्थन देता है, जो लाइव खोज परिणामों द्वारा समर्थित और संदर्भों सहित AI-संश्लेषित उत्तर बनाने के लिए xAI वेब-आधारित प्रतिक्रियाओं का उपयोग करता है।

Grok वेब खोज उपलब्ध होने पर आपके मौजूदा xAI OAuth साइन-इन को प्राथमिकता देती है। यदि कोई OAuth प्रोफ़ाइल मौजूद नहीं है, तो वही xAI API कुंजी X (पूर्व में Twitter) पोस्ट खोज के लिए बिल्ट-इन `x_search` टूल और `code_execution` टूल को भी चला सकती है। यदि आप कुंजी को `plugins.entries.xai.config.webSearch.apiKey` के अंतर्गत संग्रहीत करते हैं, तो OpenClaw इसे बंडल किए गए xAI मॉडल प्रदाता के लिए भी फ़ॉलबैक के रूप में फिर से उपयोग करता है।

रीपोस्ट, जवाब, बुकमार्क या व्यू जैसे पोस्ट-स्तरीय X मेट्रिक्स के लिए, व्यापक खोज क्वेरी के बजाय सटीक पोस्ट URL या status ID के साथ `x_search` को प्राथमिकता दें।

## ऑनबोर्डिंग और कॉन्फ़िगर करना

यदि आप इन दौरान **Grok** चुनते हैं:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw अलग वेब-खोज कुंजी मांगे बिना मौजूदा xAI OAuth प्रोफ़ाइल का उपयोग कर सकता है। यदि OAuth उपलब्ध नहीं है, तो यह xAI API-कुंजी सेटअप पर फ़ॉलबैक करता है। OpenClaw उसी xAI क्रेडेंशियल के साथ `x_search` सक्षम करने के लिए अलग फ़ॉलो-अप चरण भी दिखा सकता है। वह फ़ॉलो-अप:

- केवल तब दिखाई देता है जब आप `web_search` के लिए Grok चुनते हैं
- कोई अलग शीर्ष-स्तरीय वेब-खोज प्रदाता विकल्प नहीं है
- उसी प्रवाह के दौरान वैकल्पिक रूप से `x_search` मॉडल सेट कर सकता है

यदि आप इसे छोड़ देते हैं, तो आप बाद में config में `x_search` सक्षम या बदल सकते हैं।

## साइन इन करें या API कुंजी प्राप्त करें

<Steps>
  <Step title="Use xAI OAuth">
    यदि आपने ऑनबोर्डिंग या मॉडल auth के दौरान पहले ही xAI से साइन इन किया है, तो `web_search` प्रदाता के रूप में Grok चुनें। अलग API कुंजी की आवश्यकता नहीं है:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    जब OAuth उपलब्ध न हो या आप जानबूझकर कुंजी-समर्थित वेब-खोज config चाहते हों, तो [xAI](https://console.x.ai/) से API कुंजी प्राप्त करें।
  </Step>
  <Step title="Store the key">
    Gateway वातावरण में `XAI_API_KEY` सेट करें, या इसके माध्यम से कॉन्फ़िगर करें:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**क्रेडेंशियल विकल्प:** `openclaw models auth login
--provider xai --method oauth` से साइन इन करें, Gateway वातावरण में `XAI_API_KEY` सेट करें, या `plugins.entries.xai.config.webSearch.apiKey` संग्रहीत करें। gateway इंस्टॉल के लिए, env vars को `~/.openclaw/.env` में रखें।

## यह कैसे काम करता है

Grok inline संदर्भों के साथ उत्तरों को संश्लेषित करने के लिए xAI वेब-आधारित प्रतिक्रियाओं का उपयोग करता है, Gemini के Google Search grounding दृष्टिकोण के समान।

## समर्थित पैरामीटर

Grok खोज `query` का समर्थन करती है।

`count` साझा `web_search` संगतता के लिए स्वीकार किया जाता है, लेकिन Grok फिर भी N-परिणाम सूची के बजाय संदर्भों सहित एक संश्लेषित उत्तर लौटाता है।

प्रदाता-विशिष्ट फ़िल्टर वर्तमान में समर्थित नहीं हैं।

Grok प्रदाता-विशिष्ट 60 सेकंड का डिफ़ॉल्ट timeout उपयोग करता है क्योंकि xAI Responses वेब-आधारित खोजें साझा `web_search` डिफ़ॉल्ट से अधिक समय ले सकती हैं। इसे override करने के लिए `tools.web.search.timeoutSeconds` सेट करें।

## Base URL overrides

जब Grok वेब खोज को ऑपरेटर proxy या xAI-संगत Responses endpoint से route करना हो, तो `plugins.entries.xai.config.webSearch.baseUrl` सेट करें। trailing slashes हटाने के बाद OpenClaw `<baseUrl>/responses` पर posts करता है। जब तक `plugins.entries.xai.config.xSearch.baseUrl` सेट न हो, `x_search` वही `webSearch.baseUrl` फ़ॉलबैक उपयोग करता है।

## संबंधित

- [वेब खोज अवलोकन](/hi/tools/web) -- सभी प्रदाता और auto-detection
- [वेब खोज में x_search](/hi/tools/web#x_search) -- xAI के माध्यम से first-class X खोज
- [Gemini Search](/hi/tools/gemini-search) -- Google grounding के माध्यम से AI-संश्लेषित उत्तर
