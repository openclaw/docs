---
read_when:
    - आप Perplexity को वेब खोज प्रदाता के रूप में कॉन्फ़िगर करना चाहते हैं
    - आपको Perplexity API key या OpenRouter proxy setup की आवश्यकता है
summary: Perplexity वेब खोज प्रदाता सेटअप (API कुंजी, खोज मोड, फ़िल्टरिंग)
title: Perplexity
x-i18n:
    generated_at: "2026-06-29T00:01:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin, Perplexity Search API या OpenRouter के माध्यम से Perplexity Sonar के जरिए वेब खोज क्षमताएं प्रदान करता है।

<Note>
यह पेज Perplexity **प्रदाता** सेटअप है। Perplexity **टूल** के लिए (एजेंट इसका उपयोग कैसे करता है), [Perplexity टूल](/hi/tools/perplexity-search) देखें।
</Note>

| गुण         | मान                                                                    |
| ----------- | ---------------------------------------------------------------------- |
| प्रकार      | वेब खोज प्रदाता (मॉडल प्रदाता नहीं)                                    |
| प्रमाणीकरण | `PERPLEXITY_API_KEY` (सीधा) या `OPENROUTER_API_KEY` (OpenRouter के जरिए) |
| कॉन्फ़िग पथ | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway फिर से शुरू करें:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## शुरू करना

<Steps>
  <Step title="API कुंजी सेट करें">
    इंटरैक्टिव वेब-खोज कॉन्फ़िगरेशन फ़्लो चलाएं:

    ```bash
    openclaw configure --section web
    ```

    या कुंजी सीधे सेट करें:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="खोज शुरू करें">
    कुंजी कॉन्फ़िगर हो जाने के बाद एजेंट वेब खोजों के लिए अपने-आप Perplexity का उपयोग करेगा। कोई अतिरिक्त चरण आवश्यक नहीं हैं।
  </Step>
</Steps>

## खोज मोड

Plugin API कुंजी प्रीफ़िक्स के आधार पर ट्रांसपोर्ट अपने-आप चुनता है:

<Tabs>
  <Tab title="नेटिव Perplexity API (pplx-)">
    जब आपकी कुंजी `pplx-` से शुरू होती है, OpenClaw नेटिव Perplexity Search API का उपयोग करता है। यह ट्रांसपोर्ट संरचित परिणाम लौटाता है और डोमेन, भाषा, और तारीख फ़िल्टर का समर्थन करता है (नीचे फ़िल्टरिंग विकल्प देखें)।
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    जब आपकी कुंजी `sk-or-` से शुरू होती है, OpenClaw Perplexity Sonar मॉडल का उपयोग करके OpenRouter के जरिए रूट करता है। यह ट्रांसपोर्ट उद्धरणों के साथ AI-संश्लेषित उत्तर लौटाता है।
  </Tab>
</Tabs>

| कुंजी प्रीफ़िक्स | ट्रांसपोर्ट                   | सुविधाएं                                           |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | नेटिव Perplexity Search API | संरचित परिणाम, डोमेन/भाषा/तारीख फ़िल्टर           |
| `sk-or-`   | OpenRouter (Sonar)           | उद्धरणों के साथ AI-संश्लेषित उत्तर                 |

## नेटिव API फ़िल्टरिंग

<Note>
फ़िल्टरिंग विकल्प केवल नेटिव Perplexity API (`pplx-` कुंजी) का उपयोग करते समय उपलब्ध हैं। OpenRouter/Sonar खोजें इन पैरामीटरों का समर्थन नहीं करतीं।
</Note>

नेटिव Perplexity API का उपयोग करते समय, खोजें निम्नलिखित फ़िल्टर का समर्थन करती हैं:

| फ़िल्टर        | विवरण                                  | उदाहरण                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| देश            | 2-अक्षरी देश कोड                       | `us`, `de`, `jp`                    |
| भाषा           | ISO 639-1 भाषा कोड                     | `en`, `fr`, `zh`                    |
| तारीख सीमा     | हालियापन विंडो                         | `day`, `week`, `month`, `year`      |
| डोमेन फ़िल्टर  | अनुमति-सूची या निषेध-सूची (अधिकतम 20 डोमेन) | `example.com`                       |
| सामग्री बजट    | प्रति उत्तर / प्रति पेज टोकन सीमाएं    | `max_tokens`, `max_tokens_per_page` |

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="डेमन प्रक्रियाओं के लिए पर्यावरण चर">
    यदि OpenClaw Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `PERPLEXITY_API_KEY` उस प्रक्रिया के लिए उपलब्ध है।

    <Warning>
    केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजी launchd/systemd डेमन को दिखाई नहीं देगी, जब तक कि वह पर्यावरण स्पष्ट रूप से इंपोर्ट न किया जाए। यह सुनिश्चित करने के लिए कि Gateway प्रक्रिया उसे पढ़ सके, कुंजी `~/.openclaw/.env` में या `env.shellEnv` के जरिए सेट करें।
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter प्रॉक्सी सेटअप">
    यदि आप Perplexity खोजों को OpenRouter के जरिए रूट करना पसंद करते हैं, तो नेटिव Perplexity कुंजी के बजाय `OPENROUTER_API_KEY` (प्रीफ़िक्स `sk-or-`) सेट करें। OpenClaw प्रीफ़िक्स का पता लगाएगा और अपने-आप Sonar ट्रांसपोर्ट पर स्विच कर देगा।

    <Tip>
    OpenRouter ट्रांसपोर्ट उपयोगी है यदि आपके पास पहले से OpenRouter खाता है और आप कई प्रदाताओं में समेकित बिलिंग चाहते हैं।
    </Tip>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Perplexity खोज टूल" href="/hi/tools/perplexity-search" icon="magnifying-glass">
    एजेंट Perplexity खोजों को कैसे आह्वान करता है और परिणामों की व्याख्या कैसे करता है।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    Plugin प्रविष्टियों सहित पूरा कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
