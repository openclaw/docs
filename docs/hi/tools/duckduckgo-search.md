---
read_when:
    - आप ऐसा वेब खोज प्रदाता चाहते हैं जिसे किसी API कुंजी की आवश्यकता न हो
    - आप web_search के लिए DuckDuckGo का उपयोग करना चाहते हैं
    - आप स्पष्ट रूप से चुना गया बिना-की वाला खोज प्रदाता चाहते हैं
summary: DuckDuckGo वेब खोज -- कुंजी-मुक्त प्रदाता (प्रायोगिक, HTML-आधारित)
title: DuckDuckGo खोज
x-i18n:
    generated_at: "2026-06-29T00:17:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw DuckDuckGo को **कुंजी-मुक्त** `web_search` प्रदाता के रूप में समर्थन करता है। किसी API
कुंजी या खाते की आवश्यकता नहीं है।

<Warning>
  DuckDuckGo एक **प्रयोगात्मक, अनौपचारिक** इंटीग्रेशन है जो परिणामों को
  DuckDuckGo के गैर-JavaScript खोज पेजों से खींचता है - किसी आधिकारिक API से नहीं। बॉट-चैलेंज पेजों या HTML बदलावों से
  कभी-कभी टूट-फूट की अपेक्षा करें।
</Warning>

## सेटअप

किसी API कुंजी की आवश्यकता नहीं - बस DuckDuckGo को अपने प्रदाता के रूप में सेट करें:

<Steps>
  <Step title="कॉन्फ़िगर करें">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## कॉन्फ़िग

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
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
वापस किए जाने वाले परिणाम (1-10)।
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo क्षेत्र कोड (जैसे `us-en`, `uk-en`, `de-de`)।
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch स्तर।
</ParamField>

क्षेत्र और SafeSearch को Plugin कॉन्फ़िग में भी सेट किया जा सकता है (ऊपर देखें) - टूल
पैरामीटर प्रति-क्वेरी कॉन्फ़िग मानों को ओवरराइड करते हैं।

## नोट्स

- **कोई API कुंजी नहीं** - DuckDuckGo को अपने `web_search`
  प्रदाता के रूप में चुनने के बाद काम करता है
- **प्रयोगात्मक** - परिणाम DuckDuckGo के गैर-JavaScript HTML
  खोज पेजों से इकट्ठा करता है, किसी आधिकारिक API या SDK से नहीं
- **बॉट-चैलेंज जोखिम** - भारी या स्वचालित उपयोग के तहत DuckDuckGo CAPTCHA दिखा सकता है या अनुरोधों को ब्लॉक कर सकता है
- **HTML पार्सिंग** - परिणाम पेज संरचना पर निर्भर करते हैं, जो बिना
  सूचना के बदल सकती है
- **स्पष्ट चयन** - जब कोई API-समर्थित प्रदाता कॉन्फ़िग नहीं होता, OpenClaw DuckDuckGo को स्वचालित रूप से नहीं चुनता
- **कॉन्फ़िग न होने पर SafeSearch डिफ़ॉल्ट रूप से moderate होता है**

<Tip>
  प्रोडक्शन उपयोग के लिए, [Brave Search](/hi/tools/brave-search) (नि:शुल्क स्तर
  उपलब्ध) या किसी अन्य API-समर्थित प्रदाता पर विचार करें।
</Tip>

## संबंधित

- [Web Search अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वतः-पहचान
- [Brave Search](/hi/tools/brave-search) -- नि:शुल्क स्तर के साथ संरचित परिणाम
- [Exa Search](/hi/tools/exa-search) -- सामग्री निष्कर्षण के साथ न्यूरल खोज
