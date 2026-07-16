---
read_when:
    - आप Perplexity को वेब खोज प्रदाता के रूप में कॉन्फ़िगर करना चाहते हैं
    - आपको Perplexity API कुंजी या OpenRouter प्रॉक्सी सेटअप की आवश्यकता है
summary: Perplexity वेब खोज प्रदाता सेटअप (API कुंजी, खोज मोड, फ़िल्टरिंग)
title: Perplexity
x-i18n:
    generated_at: "2026-07-16T17:00:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin दो ट्रांसपोर्ट के साथ एक `web_search` प्रदाता पंजीकृत करता है: मूल Perplexity Search API (फ़िल्टर वाले संरचित परिणाम) और Perplexity Sonar चैट पूर्णताएँ, सीधे या OpenRouter के माध्यम से (उद्धरणों सहित AI-संश्लेषित उत्तर)।

<Note>
यह पृष्ठ Perplexity **प्रदाता** के सेटअप को कवर करता है। Perplexity **टूल** (एजेंट इसका उपयोग कैसे करता है) के लिए, [Perplexity खोज](/hi/tools/perplexity-search) देखें।
</Note>

| गुण         | मान                                                                    |
| ----------- | ---------------------------------------------------------------------- |
| प्रकार      | वेब खोज प्रदाता (मॉडल प्रदाता नहीं)                                   |
| प्रमाणीकरण  | `PERPLEXITY_API_KEY` (मूल) या `OPENROUTER_API_KEY` (OpenRouter के माध्यम से) |
| कॉन्फ़िगरेशन पथ | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| ओवरराइड     | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| कुंजी प्राप्त करें | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## आरंभ करना

<Steps>
  <Step title="API कुंजी सेट करें">
    ```bash
    openclaw configure --section web
    ```

    या कुंजी सीधे सेट करें:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Gateway परिवेश में `PERPLEXITY_API_KEY` या `OPENROUTER_API_KEY` के रूप में निर्यात की गई कुंजी भी काम करती है।

  </Step>
  <Step title="खोजना शुरू करें">
    उपलब्ध खोज क्रेडेंशियल के रूप में इसकी कुंजी मिलते ही `web_search` स्वचालित रूप से Perplexity का पता लगा लेता है; किसी अतिरिक्त सेटअप की आवश्यकता नहीं है। प्रदाता को स्पष्ट रूप से निर्धारित करने के लिए:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## खोज मोड

Plugin इस क्रम में ट्रांसपोर्ट निर्धारित करता है:

1. `webSearch.baseUrl` या `webSearch.model` सेट होने पर: कुंजी के प्रकार की परवाह किए बिना, हमेशा उस एंडपॉइंट के विरुद्ध Sonar चैट पूर्णताओं के माध्यम से रूट करता है।
2. अन्यथा, कुंजी का स्रोत एंडपॉइंट तय करता है: कॉन्फ़िगर की गई कुंजी का प्रीफ़िक्स ट्रांसपोर्ट चुनता है (कॉन्फ़िगरेशन को परिवेश चरों पर प्राथमिकता मिलती है); परिवेश कुंजी सीधे अपने मेल खाते एंडपॉइंट का उपयोग करती है।

| कुंजी प्रीफ़िक्स | ट्रांसपोर्ट                                                | सुविधाएँ                                          |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | मूल Perplexity Search API (`https://api.perplexity.ai`) | संरचित परिणाम, डोमेन/भाषा/तिथि फ़िल्टर |
| `sk-or-`   | OpenRouter (`https://openrouter.ai/api/v1`), Sonar मॉडल   | उद्धरणों सहित AI-संश्लेषित उत्तर            |

किसी अन्य प्रीफ़िक्स वाली कॉन्फ़िगर की गई कुंजी भी मूल Search API का उपयोग करती है। चैट-पूर्णता पथ डिफ़ॉल्ट रूप से `perplexity/sonar-pro` मॉडल का उपयोग करता है; इसे `plugins.entries.perplexity.config.webSearch.model` से ओवरराइड करें।

## मूल API फ़िल्टरिंग

| फ़िल्टर                               | विवरण                                                     | ट्रांसपोर्ट   |
| ------------------------------------ | --------------------------------------------------------------- | ----------- |
| `count`                              | प्रति खोज परिणाम, 1-10 (डिफ़ॉल्ट 5)                            | केवल मूल |
| `freshness`                          | नवीनता अवधि: `day`, `week`, `month`, `year`                  | दोनों        |
| `country`                            | 2-अक्षर वाला देश कोड (`us`, `de`, `jp`)                        | केवल मूल |
| `language`                           | ISO 639-1 भाषा कोड (`en`, `fr`, `zh`)                      | केवल मूल |
| `date_after` / `date_before`         | `YYYY-MM-DD` में प्रकाशन-तिथि सीमा                            | केवल मूल |
| `domain_filter`                      | अधिकतम 20 डोमेन; अनुमति-सूची या `-`-प्रीफ़िक्स वाली निषेध-सूची, दोनों को कभी न मिलाएँ | केवल मूल |
| `max_tokens` / `max_tokens_per_page` | सभी परिणामों के लिए / प्रति पृष्ठ सामग्री बजट                    | केवल मूल |

केवल मूल API के फ़िल्टर चैट-पूर्णता पथ पर एक वर्णनात्मक त्रुटि लौटाते हैं।
`freshness` को `date_after`/`date_before` के साथ संयोजित नहीं किया जा सकता।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="डेमन प्रक्रियाओं के लिए परिवेश चर">
    <Warning>
    केवल इंटरैक्टिव शेल में निर्यात की गई कुंजी launchd/systemd Gateway डेमन को तब तक दिखाई नहीं देती, जब तक उस परिवेश को स्पष्ट रूप से आयात न किया जाए। कुंजी को `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें, ताकि Gateway प्रक्रिया उसे पढ़ सके। पूर्ण प्राथमिकता क्रम के लिए [परिवेश चर](/hi/help/environment) देखें।
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter प्रॉक्सी सेटअप">
    Perplexity खोजों को OpenRouter के माध्यम से रूट करने के लिए, मूल Perplexity कुंजी के बजाय एक `OPENROUTER_API_KEY` (प्रीफ़िक्स `sk-or-`) सेट करें। OpenClaw कुंजी का पता लगाता है और स्वचालित रूप से Sonar ट्रांसपोर्ट पर स्विच करता है। यह तब उपयोगी है, जब आपने OpenRouter बिलिंग पहले से सेट की हुई है और प्रदाताओं को वहाँ समेकित करना चाहते हैं।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Perplexity खोज टूल" href="/hi/tools/perplexity-search" icon="magnifying-glass">
    एजेंट Perplexity खोजों को कैसे आमंत्रित करता है और परिणामों की व्याख्या कैसे करता है।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    Plugin प्रविष्टियों सहित पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
