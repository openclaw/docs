---
read_when:
    - आप web_search के लिए MiniMax का उपयोग करना चाहते हैं
    - आपको MiniMax Token Plan कुंजी या OAuth टोकन चाहिए
    - आप MiniMax CN/global खोज होस्ट संबंधी मार्गदर्शन चाहते हैं
summary: Token Plan खोज API के माध्यम से MiniMax Search
title: MiniMax खोज
x-i18n:
    generated_at: "2026-06-29T00:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw MiniMax Token Plan खोज API के माध्यम से MiniMax को `web_search` प्रदाता के रूप में समर्थन देता है। यह शीर्षकों, URLs, स्निपेट और संबंधित क्वेरी के साथ संरचित खोज परिणाम लौटाता है।

## Token Plan क्रेडेंशियल प्राप्त करें

<Steps>
  <Step title="कुंजी बनाएं">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) से MiniMax Token Plan कुंजी बनाएं या कॉपी करें।
    OAuth सेटअप इसके बजाय `MINIMAX_OAUTH_TOKEN` का पुनः उपयोग कर सकते हैं।
  </Step>
  <Step title="कुंजी संग्रहीत करें">
    Gateway वातावरण में `MINIMAX_CODE_PLAN_KEY` सेट करें, या इसके माध्यम से कॉन्फ़िगर करें:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`, और `MINIMAX_API_KEY` को env उपनामों के रूप में भी स्वीकार करता है। `MINIMAX_API_KEY` को खोज-सक्षम Token Plan क्रेडेंशियल की ओर इंगित करना चाहिए; सामान्य MiniMax मॉडल API कुंजियां Token Plan खोज एंडपॉइंट द्वारा स्वीकार नहीं की जा सकती हैं।

## कॉन्फ़िगरेशन

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**वातावरण विकल्प:** Gateway वातावरण में `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN`, या `MINIMAX_API_KEY` सेट करें।
Gateway इंस्टॉल के लिए, इसे `~/.openclaw/.env` में रखें।

## क्षेत्र चयन

MiniMax Search इन एंडपॉइंट का उपयोग करता है:

- वैश्विक: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

यदि `plugins.entries.minimax.config.webSearch.region` सेट नहीं है, तो OpenClaw इस क्रम में क्षेत्र हल करता है:

1. `tools.web.search.minimax.region` / Plugin-स्वामित्व वाला `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

इसका अर्थ है कि CN ऑनबोर्डिंग या `MINIMAX_API_HOST=https://api.minimaxi.com/...` स्वचालित रूप से MiniMax Search को CN होस्ट पर भी बनाए रखता है।

भले ही आपने OAuth `minimax-portal` पथ के माध्यम से MiniMax को प्रमाणित किया हो, वेब खोज अभी भी प्रदाता id `minimax` के रूप में पंजीकृत होती है; OAuth प्रदाता base URL का उपयोग CN/वैश्विक होस्ट चयन के लिए क्षेत्र संकेत के रूप में किया जाता है, और `MINIMAX_OAUTH_TOKEN` MiniMax Search bearer क्रेडेंशियल को पूरा कर सकता है।

## समर्थित पैरामीटर

| पैरामीटर | प्रकार    | बाधाएं | विवरण                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | आवश्यक    | खोज क्वेरी स्ट्रिंग।                                                        |
| `count`   | integer | 1-10        | लौटाए जाने वाले परिणामों की संख्या। OpenClaw लौटाई गई सूची को इस आकार तक छोटा करता है। |

प्रदाता-विशिष्ट फ़िल्टर वर्तमान में समर्थित नहीं हैं।

## संबंधित

- [वेब खोज अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वतः-पहचान
- [MiniMax](/hi/providers/minimax) -- मॉडल, छवि, वाक्, और auth सेटअप
