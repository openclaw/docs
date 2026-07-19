---
read_when:
    - आप web_search के लिए Kimi का उपयोग करना चाहते हैं
    - आपको `KIMI_API_KEY` या `MOONSHOT_API_KEY` की आवश्यकता है
summary: Moonshot वेब सर्च के माध्यम से Kimi वेब सर्च
title: Kimi खोज
x-i18n:
    generated_at: "2026-07-19T09:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi, Moonshot की नेटिव वेब खोज द्वारा समर्थित एक `web_search` प्रदाता है। रैंक की गई परिणाम सूची लौटाने के बजाय, Moonshot
इनलाइन उद्धरणों के साथ एक उत्तर संश्लेषित करता है, जो Gemini और Grok के
ग्राउंडेड-रिस्पॉन्स प्रदाताओं के समान है।

## सेटअप

<Steps>
  <Step title="कुंजी बनाएँ">
    [Moonshot AI](https://platform.moonshot.cn/) से API कुंजी प्राप्त करें।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway परिवेश में `KIMI_API_KEY` या `MOONSHOT_API_KEY` सेट करें (Gateway
    इंस्टॉलेशन के लिए, इसे `~/.openclaw/.env` में जोड़ें), या इसके माध्यम से कॉन्फ़िगर करें:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` या `openclaw configure --section web` के दौरान **Kimi** चुनने पर
इनके लिए भी संकेत दिया जाता है:

- Moonshot API क्षेत्र: `https://api.moonshot.ai/v1` या `https://api.moonshot.cn/v1`
- वेब-खोज मॉडल (डिफ़ॉल्ट: `kimi-k2.6`)

## कॉन्फ़िगरेशन

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // वैकल्पिक, यदि KIMI_API_KEY या MOONSHOT_API_KEY सेट है
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` को छोड़ने पर उपलब्ध API कुंजियों से इसका स्वतः पता लगाया जाता है;
यदि एकाधिक खोज क्रेडेंशियल कॉन्फ़िगर हैं, तो इसे स्पष्ट रूप से `kimi` पर सेट करें।

`tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`) के अंतर्गत समतुल्य स्कोप किया गया रूप
भी काम करता है; दोनों संरचनाएँ एक ही समाधान किए गए कॉन्फ़िगरेशन में मर्ज होती हैं।

डिफ़ॉल्ट: `baseUrl` को छोड़ने पर इसका डिफ़ॉल्ट `https://api.moonshot.ai/v1` होता है, `model`
का डिफ़ॉल्ट `kimi-k2.6` होता है।

यदि चैट ट्रैफ़िक चीन होस्ट (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) का उपयोग करता है, तो अपना `baseUrl` सेट न होने पर Kimi `web_search` स्वतः उसी होस्ट का पुनः उपयोग करता है,
जिससे `.cn` कुंजियाँ गलती से अंतरराष्ट्रीय एंडपॉइंट पर नहीं जातीं
(जो उन कुंजियों के लिए HTTP 401 लौटाता है)। इस इनहेरिटेंस को ओवरराइड करने के लिए
एक स्पष्ट Kimi `baseUrl` सेट करें।

## ग्राउंडिंग आवश्यकता

OpenClaw केवल तभी Kimi `web_search` परिणाम लौटाता है, जब Moonshot के प्रत्युत्तर में
नेटिव वेब-खोज ग्राउंडिंग प्रमाण शामिल हों, जैसे `$web_search` टूल-कॉल
रीप्ले, `search_results`, या उद्धरण URL। यदि Kimi बिना ग्राउंडिंग के सीधे
उत्तर देता है (उदाहरण के लिए "मैं इंटरनेट ब्राउज़ नहीं कर सकता"), तो OpenClaw उस टेक्स्ट को खोज
परिणाम मानने के बजाय `kimi_web_search_ungrounded` त्रुटि लौटाता है।
क्वेरी का पुनः प्रयास करें, Brave जैसे किसी संरचित प्रदाता पर स्विच करें, या जब आपके पास पहले से कोई लक्ष्य URL हो, तो
`web_fetch` / ब्राउज़र टूल का उपयोग करें।

## टूल पैरामीटर

| पैरामीटर                                                       | समर्थित                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | हाँ                                                                                                                      |
| `count`                                                         | क्रॉस-प्रदाता संगतता के लिए स्वीकार किया जाता है, लेकिन अनदेखा किया जाता है: Kimi हमेशा एक संश्लेषित उत्तर लौटाता है, N-परिणाम सूची नहीं |
| `country`, `language`, `freshness`, `date_after`, `date_before` | नहीं                                                                                                                       |

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web) - सभी प्रदाता और स्वतः पहचान
- [Moonshot AI](/hi/providers/moonshot) - Moonshot मॉडल + Kimi Coding प्रदाता दस्तावेज़
- [Gemini खोज](/hi/tools/gemini-search) - Google ग्राउंडिंग के माध्यम से AI-संश्लेषित उत्तर
- [Grok खोज](/hi/tools/grok-search) - xAI ग्राउंडिंग के माध्यम से AI-संश्लेषित उत्तर
