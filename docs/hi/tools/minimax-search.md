---
read_when:
    - आप web_search के लिए MiniMax का उपयोग करना चाहते हैं
    - आपको MiniMax Token Plan कुंजी या OAuth टोकन चाहिए
    - आप MiniMax CN/ग्लोबल सर्च होस्ट संबंधी मार्गदर्शन चाहते हैं
summary: Token Plan सर्च API के माध्यम से MiniMax Search
title: MiniMax खोज
x-i18n:
    generated_at: "2026-07-16T17:33:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw, MiniMax Token Plan खोज API के माध्यम से MiniMax को `web_search` प्रदाता के रूप में समर्थित करता है। यह शीर्षकों, URLs, स्निपेट और संबंधित क्वेरी के साथ संरचित खोज परिणाम लौटाता है।

## Token Plan क्रेडेंशियल प्राप्त करें

<Steps>
  <Step title="कुंजी बनाएँ">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) से
    MiniMax Token Plan कुंजी बनाएँ या कॉपी करें।
    इसके बजाय OAuth सेटअप `MINIMAX_OAUTH_TOKEN` का पुनः उपयोग कर सकते हैं।
  </Step>
  <Step title="कुंजी संग्रहित करें">
    Gateway परिवेश में `MINIMAX_CODE_PLAN_KEY` सेट करें, या इसके माध्यम से कॉन्फ़िगर करें:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`, और
`MINIMAX_API_KEY` को परिवेश उपनामों के रूप में भी स्वीकार करता है, जिन्हें
`MINIMAX_CODE_PLAN_KEY` के बाद इसी क्रम में जाँचा जाता है। `MINIMAX_API_KEY` को खोज-सक्षम
Token Plan क्रेडेंशियल की ओर इंगित करना चाहिए; सामान्य MiniMax मॉडल API कुंजियाँ
Token Plan खोज एंडपॉइंट द्वारा स्वीकार नहीं की जा सकती हैं।

## कॉन्फ़िगरेशन

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // यदि MiniMax Token Plan परिवेश चर सेट है, तो वैकल्पिक
            region: "global", // या "cn"
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

**परिवेश विकल्प:** Gateway परिवेश में `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN`, या `MINIMAX_API_KEY` सेट करें।
Gateway इंस्टॉलेशन के लिए इसे `~/.openclaw/.env` में रखें।

## क्षेत्र चयन

MiniMax Search इन एंडपॉइंट का उपयोग करता है:

- वैश्विक: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

यदि `plugins.entries.minimax.config.webSearch.region` सेट नहीं है, तो OpenClaw
इस क्रम में क्षेत्र निर्धारित करता है:

1. `tools.web.search.minimax.region` / Plugin के स्वामित्व वाला `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

इसका अर्थ है कि CN ऑनबोर्डिंग या `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search को भी स्वचालित रूप से CN होस्ट पर बनाए रखता है।

भले ही आपने OAuth `minimax-portal` पथ के माध्यम से MiniMax को प्रमाणित किया हो,
वेब खोज फिर भी प्रदाता आईडी `minimax` के रूप में पंजीकृत होती है; OAuth प्रदाता का आधार URL
CN/वैश्विक होस्ट चयन के लिए क्षेत्र संकेत के रूप में उपयोग होता है, और `MINIMAX_OAUTH_TOKEN`
MiniMax Search बियरर क्रेडेंशियल की आवश्यकता पूरी कर सकता है।

## समर्थित पैरामीटर

| पैरामीटर | प्रकार    | प्रतिबंध     | विवरण                                                                 |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | स्ट्रिंग  | आवश्यक        | खोज क्वेरी स्ट्रिंग।                                                        |
| `count`   | पूर्णांक | 1-10, डिफ़ॉल्ट 5 | लौटाए जाने वाले परिणामों की संख्या। OpenClaw लौटाई गई सूची को इस आकार तक सीमित करता है। |

प्रदाता-विशिष्ट फ़िल्टर वर्तमान में समर्थित नहीं हैं।

## संबंधित

- [वेब खोज का अवलोकन](/hi/tools/web) -- सभी प्रदाता और स्वचालित पहचान
- [MiniMax](/hi/providers/minimax) -- मॉडल, छवि, वाक् और प्रमाणीकरण सेटअप
