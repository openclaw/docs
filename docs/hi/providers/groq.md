---
read_when:
    - आप OpenClaw के साथ Groq का उपयोग करना चाहते हैं
    - आपको API कुंजी के पर्यावरण चर या CLI प्रमाणीकरण विकल्प की आवश्यकता है
    - आप Groq पर Whisper ऑडियो ट्रांसक्रिप्शन कॉन्फ़िगर कर रहे हैं
summary: Groq सेटअप (प्रमाणीकरण + मॉडल चयन + Whisper ट्रांसक्रिप्शन)
title: Groq
x-i18n:
    generated_at: "2026-07-16T16:43:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) कस्टम LPU हार्डवेयर का उपयोग करके ओपन-वेट मॉडल (Llama, Gemma, Kimi, Qwen, GPT OSS और अन्य) पर अत्यंत तेज़ इन्फ़रेंस प्रदान करता है। Groq Plugin, OpenAI-संगत चैट प्रदाता और ऑडियो मीडिया-समझ प्रदाता—दोनों को पंजीकृत करता है।

| गुण                    | मान                                      |
| ---------------------- | ---------------------------------------- |
| प्रदाता आईडी           | `groq`                       |
| Plugin                 | आधिकारिक बाहरी पैकेज                     |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल | `GROQ_API_KEY`             |
| API                    | OpenAI-संगत (`openai-completions`)         |
| आधार URL               | `https://api.groq.com/openai/v1`                       |
| ऑडियो ट्रांसक्रिप्शन   | `whisper-large-v3-turbo` (डिफ़ॉल्ट)            |
| सुझाया गया डिफ़ॉल्ट चैट मॉडल | `groq/llama-3.3-70b-versatile`                 |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## शुरुआत करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    [console.groq.com/keys](https://console.groq.com/keys) पर एक API कुंजी बनाएँ।
  </Step>
  <Step title="API कुंजी सेट करें">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="पुष्टि करें कि कैटलॉग उपलब्ध है">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### कॉन्फ़िगरेशन फ़ाइल का उदाहरण

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## अंतर्निहित कैटलॉग

OpenClaw में मैनिफ़ेस्ट-समर्थित Groq कैटलॉग शामिल है, जिसमें रीजनिंग और गैर-रीजनिंग दोनों प्रविष्टियाँ हैं। अपने इंस्टॉल किए गए संस्करण की स्थिर पंक्तियाँ देखने के लिए `openclaw models list --provider groq` चलाएँ या Groq की आधिकारिक सूची के लिए [console.groq.com/docs/models](https://console.groq.com/docs/models) देखें।

| मॉडल संदर्भ                                      | नाम                     | रीजनिंग  | इनपुट       | कॉन्टेक्स्ट |
| ------------------------------------------------ | ----------------------- | -------- | ------------ | ----------- |
| `groq/llama-3.3-70b-versatile`                               | Llama 3.3 70B Versatile | नहीं     | टेक्स्ट      | 131,072     |
| `groq/llama-3.1-8b-instant`                               | Llama 3.1 8B Instant    | नहीं     | टेक्स्ट      | 131,072     |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`                               | Llama 4 Scout 17B       | नहीं     | टेक्स्ट + इमेज | 131,072   |
| `groq/openai/gpt-oss-120b`                               | GPT OSS 120B            | हाँ      | टेक्स्ट      | 131,072     |
| `groq/openai/gpt-oss-20b`                               | GPT OSS 20B             | हाँ      | टेक्स्ट      | 131,072     |
| `groq/openai/gpt-oss-safeguard-20b`                               | Safety GPT OSS 20B      | हाँ      | टेक्स्ट      | 131,072     |
| `groq/qwen/qwen3-32b`                               | Qwen3 32B               | हाँ      | टेक्स्ट      | 131,072     |
| `groq/groq/compound`                               | Compound                | हाँ      | टेक्स्ट      | 131,072     |
| `groq/groq/compound-mini`                               | Compound Mini           | हाँ      | टेक्स्ट      | 131,072     |

<Tip>
  प्रत्येक OpenClaw रिलीज़ के साथ कैटलॉग विकसित होता है। `openclaw models list --provider groq` आपके इंस्टॉल किए गए संस्करण को ज्ञात पंक्तियाँ दिखाता है; नए जोड़े गए या बहिष्कृत मॉडल के लिए [console.groq.com/docs/models](https://console.groq.com/docs/models) से मिलान करें।
</Tip>

## रीजनिंग मॉडल

Groq रीजनिंग मॉडल (ऊपर दी गई तालिका में `reasoning: true`) OpenClaw के साझा `/think` स्तरों को `low`, `medium` या `high` के `reasoning_effort` मानों पर मैप करते हैं। `/think off` या `/think none`, निष्क्रिय मान भेजने के बजाय अनुरोध से `reasoning_effort` को हटा देता है।

साझा `/think` स्तरों और OpenClaw द्वारा प्रत्येक प्रदाता के लिए उनके अनुवाद की जानकारी के लिए [थिंकिंग मोड](/hi/tools/thinking) देखें।

## ऑडियो ट्रांसक्रिप्शन

Groq का Plugin एक **ऑडियो मीडिया-समझ प्रदाता** भी पंजीकृत करता है, ताकि साझा `tools.media.audio` सतह के माध्यम से वॉइस संदेशों को ट्रांसक्राइब किया जा सके।

| गुण                | मान                                       |
| ------------------ | ----------------------------------------- |
| साझा कॉन्फ़िगरेशन पथ | `tools.media.audio`                     |
| डिफ़ॉल्ट आधार URL  | `https://api.groq.com/openai/v1`                        |
| डिफ़ॉल्ट मॉडल      | `whisper-large-v3-turbo`                        |
| स्वचालित प्राथमिकता | 20                                      |
| API एंडपॉइंट       | OpenAI-संगत `/audio/transcriptions`            |

Groq को डिफ़ॉल्ट ऑडियो बैकएंड बनाने के लिए:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="डेमन के लिए एनवायरनमेंट की उपलब्धता">
    यदि Gateway एक प्रबंधित सेवा (launchd, systemd, Docker) के रूप में चलता है, तो `GROQ_API_KEY` उस प्रोसेस को दिखाई देना चाहिए—केवल आपके इंटरैक्टिव शेल को नहीं।

    <Warning>
      केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजी launchd या systemd डेमन के लिए उपयोगी नहीं होगी, जब तक उस एनवायरनमेंट को वहाँ भी इंपोर्ट न किया जाए। कुंजी को Gateway प्रोसेस से पठनीय बनाने के लिए इसे `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

  </Accordion>

  <Accordion title="कस्टम Groq मॉडल आईडी">
    OpenClaw रनटाइम पर किसी भी Groq मॉडल आईडी को स्वीकार करता है। Groq द्वारा दिखाई गई सटीक आईडी का उपयोग करें और उसके आगे `groq/` लगाएँ। स्थिर कैटलॉग सामान्य मामलों को समाहित करता है; कैटलॉग में शामिल न की गई आईडी डिफ़ॉल्ट OpenAI-संगत टेम्पलेट पर चली जाती हैं।

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="थिंकिंग मोड" href="/hi/tools/thinking" icon="brain">
    रीजनिंग प्रयास के स्तर और प्रदाता-नीति की परस्पर क्रिया।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता और ऑडियो सेटिंग सहित संपूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq डैशबोर्ड, API दस्तावेज़ और मूल्य निर्धारण।
  </Card>
</CardGroup>
