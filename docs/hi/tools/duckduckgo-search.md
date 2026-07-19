---
read_when:
    - आप ऐसा वेब खोज प्रदाता चाहते हैं जिसके लिए API कुंजी की आवश्यकता न हो
    - आप web_search के लिए DuckDuckGo का उपयोग करना चाहते हैं
    - आप स्पष्ट रूप से चुना गया बिना कुंजी वाला खोज प्रदाता चाहते हैं
summary: DuckDuckGo वेब खोज -- कुंजी-मुक्त प्रदाता (प्रायोगिक, HTML-आधारित)
title: DuckDuckGo खोज
x-i18n:
    generated_at: "2026-07-19T09:34:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw, DuckDuckGo को **कुंजी-मुक्त** `web_search` प्रदाता के रूप में समर्थित करता है। किसी API कुंजी या खाते की आवश्यकता नहीं है।

<Warning>
  DuckDuckGo एक **प्रयोगात्मक, अनौपचारिक** एकीकरण है, जो DuckDuckGo के गैर-JavaScript HTML खोज पृष्ठों को स्क्रैप करता है—यह कोई आधिकारिक API नहीं है। बॉट-चैलेंज पृष्ठों या HTML परिवर्तनों के कारण कभी-कभी इसके काम न करने की संभावना रखें।
</Warning>

## सेटअप

DuckDuckGo कभी भी स्वतः चयनित नहीं होता, क्योंकि स्वतः-पहचान केवल उपयोग योग्य क्रेडेंशियल वाले प्रदाताओं पर विचार करती है। इसे स्पष्ट रूप से सेट करें:

<Steps>
  <Step title="कॉन्फ़िगर करें">
    ```bash
    openclaw configure --section web
    # प्रदाता के रूप में "duckduckgo" चुनें
    ```
  </Step>
</Steps>

## कॉन्फ़िगरेशन

कॉन्फ़िगरेशन में प्रदाता को सीधे सेट करें:

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

क्षेत्र और SafeSearch के लिए वैकल्पिक Plugin-स्तरीय सेटिंग्स:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo क्षेत्र कोड
            safeSearch: "moderate", // "strict", "moderate", या "off"
          },
        },
      },
    },
  },
}
```

## टूल पैरामीटर

<ParamField path="query" type="string" required>
खोज क्वेरी।
</ParamField>

<ParamField path="count" type="number" default="5">
लौटाए जाने वाले परिणाम (1-10)।
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo क्षेत्र कोड (जैसे `us-en`, `uk-en`, `de-de`)।
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch स्तर।
</ParamField>

`region` और `safeSearch` टूल पैरामीटर प्रत्येक क्वेरी के आधार पर ऊपर दिए गए Plugin कॉन्फ़िगरेशन मानों को ओवरराइड करते हैं।

## टिप्पणियाँ

- **कोई API कुंजी नहीं**—DuckDuckGo को `web_search` प्रदाता के रूप में चुने जाने के बाद काम करता है।
- **प्रयोगात्मक**—DuckDuckGo के गैर-JavaScript HTML खोज पृष्ठों को स्क्रैप करता है; यह कोई आधिकारिक API या SDK नहीं है। परिणाम पृष्ठ की संरचना पर निर्भर करते हैं, जो बिना सूचना के बदल सकती है।
- **बॉट-चैलेंज का जोखिम**—DuckDuckGo अत्यधिक या स्वचालित उपयोग के दौरान CAPTCHA दिखा सकता है या अनुरोधों को अवरुद्ध कर सकता है।
- **केवल स्पष्ट चयन**—OpenClaw की स्वतः-पहचान केवल उपयोग योग्य क्रेडेंशियल वाले प्रदाताओं पर विचार करती है, इसलिए DuckDuckGo जैसा कुंजी-मुक्त प्रदाता कभी भी स्वतः नहीं चुना जाता; आपको `provider: "duckduckgo"` सेट करना होगा।
- कॉन्फ़िगर न होने पर **SafeSearch का डिफ़ॉल्ट मान `moderate` होता है**।

<Tip>
  प्रोडक्शन में उपयोग के लिए [Brave Search](/hi/tools/brave-search) (मुफ़्त स्तर उपलब्ध) या किसी अन्य API-समर्थित प्रदाता पर विचार करें।
</Tip>

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web)—सभी प्रदाता और स्वतः-पहचान
- [Brave Search](/hi/tools/brave-search)—मुफ़्त स्तर के साथ संरचित परिणाम
- [Exa Search](/hi/tools/exa-search)—सामग्री निष्कर्षण के साथ न्यूरल खोज
