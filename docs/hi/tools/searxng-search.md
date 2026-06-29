---
read_when:
    - आप एक self-hosted वेब खोज प्रदाता चाहते हैं
    - आप web_search के लिए SearXNG का उपयोग करना चाहते हैं
    - आपको गोपनीयता-केंद्रित या एयर-गैप्ड खोज विकल्प चाहिए
summary: SearXNG वेब खोज -- स्व-होस्टेड, कुंजी-मुक्त मेटा-खोज प्रदाता
title: SearXNG खोज
x-i18n:
    generated_at: "2026-06-29T00:23:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw [SearXNG](https://docs.searxng.org/) को **स्व-होस्टेड,
कुंजी-मुक्त** `web_search` प्रदाता के रूप में सपोर्ट करता है। SearXNG एक ओपन-सोर्स मेटा-सर्च इंजन है
जो Google, Bing, DuckDuckGo, और अन्य स्रोतों से परिणाम एकत्र करता है।

लाभ:

- **मुफ्त और असीमित** -- कोई API कुंजी या व्यावसायिक सदस्यता आवश्यक नहीं
- **गोपनीयता / एयर-गैप** -- क्वेरी आपके नेटवर्क से बाहर कभी नहीं जातीं
- **कहीं भी काम करता है** -- व्यावसायिक सर्च API पर कोई क्षेत्रीय प्रतिबंध नहीं

## सेटअप

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="SearXNG इंस्टेंस चलाएँ">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    या कोई भी मौजूदा SearXNG डिप्लॉयमेंट उपयोग करें जिसकी आपको पहुँच है। उत्पादन सेटअप के लिए
    [SearXNG दस्तावेज़](https://docs.searxng.org/) देखें।

  </Step>
  <Step title="कॉन्फ़िगर करें">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    या env var सेट करें और ऑटो-डिटेक्शन को इसे खोजने दें:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## कॉन्फ़िग

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG इंस्टेंस के लिए Plugin-स्तरीय सेटिंग्स:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` फ़ील्ड SecretRef ऑब्जेक्ट भी स्वीकार करता है।

ट्रांसपोर्ट नियम:

- `https://` सार्वजनिक या निजी SearXNG होस्ट के लिए काम करता है
- `http://` केवल विश्वसनीय निजी-नेटवर्क या लूपबैक होस्ट के लिए स्वीकार किया जाता है
- सार्वजनिक SearXNG होस्ट को `https://` का उपयोग करना चाहिए
- निजी/आंतरिक होस्ट स्व-होस्टेड नेटवर्क गार्ड का उपयोग करते हैं; सार्वजनिक `https://`
  होस्ट सख्त वेब-सर्च गार्ड पर रहते हैं और निजी पतों पर रीडायरेक्ट नहीं कर सकते

## एनवायरनमेंट वेरिएबल

कॉन्फ़िग के विकल्प के रूप में `SEARXNG_BASE_URL` सेट करें:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

जब `SEARXNG_BASE_URL` सेट हो और कोई स्पष्ट प्रदाता कॉन्फ़िगर न हो, तो ऑटो-डिटेक्शन
SearXNG को अपने-आप चुनता है (सबसे कम प्राथमिकता पर -- कुंजी वाला कोई भी API-समर्थित प्रदाता
पहले जीतता है)।

## Plugin कॉन्फ़िग संदर्भ

| फ़ील्ड       | विवरण                                                              |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | आपके SearXNG इंस्टेंस का बेस URL (आवश्यक)                          |
| `categories` | कॉमा-सेपरेटेड श्रेणियाँ जैसे `general`, `news`, या `science`       |
| `language`   | परिणामों के लिए भाषा कोड जैसे `en`, `de`, या `fr`                  |

## नोट्स

- **JSON API** -- SearXNG के मूल `format=json` एंडपॉइंट का उपयोग करता है, HTML स्क्रैपिंग का नहीं
- **इमेज परिणाम URL** -- जब SearXNG प्रत्यक्ष इमेज URL लौटाता है, तो इमेज-श्रेणी परिणामों में `img_src` शामिल होता है
- **कोई API कुंजी नहीं** -- किसी भी SearXNG इंस्टेंस के साथ तुरंत काम करता है
- **बेस URL सत्यापन** -- `baseUrl` एक मान्य `http://` या `https://`
  URL होना चाहिए; सार्वजनिक होस्ट को `https://` का उपयोग करना चाहिए
- **नेटवर्क गार्ड** -- निजी/आंतरिक SearXNG एंडपॉइंट
  निजी-नेटवर्क पहुँच के लिए ऑप्ट इन करते हैं; सार्वजनिक `https://` SearXNG एंडपॉइंट सख्त SSRF
  सुरक्षा बनाए रखते हैं
- **ऑटो-डिटेक्शन क्रम** -- SearXNG को कॉन्फ़िगर की गई कुंजियों वाले API-समर्थित प्रदाताओं
  के बाद जाँचा जाता है (क्रम 200)। DuckDuckGo या Ollama Web Search जैसे कुंजी-मुक्त प्रदाता
  स्पष्ट प्रदाता चयन के बिना अपने-आप चयनित नहीं होते
- **स्व-होस्टेड** -- आप इंस्टेंस, क्वेरी, और अपस्ट्रीम सर्च इंजनों को नियंत्रित करते हैं
- **श्रेणियाँ** कॉन्फ़िगर न होने पर डिफ़ॉल्ट रूप से `general` होती हैं
- **श्रेणी फ़ॉलबैक** -- अगर कोई गैर-`general` श्रेणी अनुरोध सफल होता है लेकिन
  शून्य परिणाम लौटाता है, तो खाली परिणाम सेट लौटाने से पहले OpenClaw उसी क्वेरी को `general`
  के साथ एक बार फिर कोशिश करता है

<Tip>
  SearXNG JSON API के काम करने के लिए, सुनिश्चित करें कि आपके SearXNG इंस्टेंस में `json`
  फ़ॉर्मैट उसके `settings.yml` में `search.formats` के अंतर्गत सक्षम है।
</Tip>

## संबंधित

- [वेब सर्च अवलोकन](/hi/tools/web) -- सभी प्रदाता और ऑटो-डिटेक्शन
- [DuckDuckGo Search](/hi/tools/duckduckgo-search) -- एक और कुंजी-मुक्त प्रदाता
- [Brave Search](/hi/tools/brave-search) -- फ्री टियर के साथ संरचित परिणाम
