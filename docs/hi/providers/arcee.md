---
read_when:
    - आप OpenClaw के साथ Arcee AI का उपयोग करना चाहते हैं
    - आपको API कुंजी का एनवायरनमेंट वेरिएबल या CLI प्रमाणीकरण विकल्प चाहिए
summary: Arcee AI सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-16T16:50:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) OpenAI-संगत API के माध्यम से विशेषज्ञ-मिश्रण मॉडल का Trinity परिवार प्रदान करता है। सभी Trinity मॉडल Apache 2.0 के अंतर्गत लाइसेंस प्राप्त हैं। Arcee एक आधिकारिक OpenClaw Plugin है, जो कोर के साथ बंडल नहीं है, इसलिए ऑनबोर्डिंग से पहले इसे इंस्टॉल करना आवश्यक है।

Arcee मॉडल को सीधे Arcee प्लेटफ़ॉर्म या [OpenRouter](/hi/providers/openrouter) के माध्यम से एक्सेस करें।

| गुण      | मान                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| प्रदाता  | `arcee`                                                                               |
| प्रमाणीकरण | `ARCEEAI_API_KEY` (प्रत्यक्ष) या `OPENROUTER_API_KEY` (OpenRouter के माध्यम से)                   |
| API      | OpenAI-संगत                                                                     |
| बेस URL | `https://api.arcee.ai/api/v1` (प्रत्यक्ष) या `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## आरंभ करना

<Tabs>
  <Tab title="प्रत्यक्ष (Arcee प्लेटफ़ॉर्म)">
    <Steps>
      <Step title="API कुंजी प्राप्त करें">
        [Arcee AI](https://chat.arcee.ai/) पर एक API कुंजी बनाएँ।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="OpenRouter के माध्यम से">
    <Steps>
      <Step title="API कुंजी प्राप्त करें">
        [OpenRouter](https://openrouter.ai/keys) पर एक API कुंजी बनाएँ।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        समान मॉडल संदर्भ प्रत्यक्ष और OpenRouter, दोनों सेटअप के लिए काम करते हैं।
      </Step>
    </Steps>

  </Tab>
</Tabs>

## गैर-इंटरैक्टिव सेटअप

<Tabs>
  <Tab title="प्रत्यक्ष (Arcee प्लेटफ़ॉर्म)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter के माध्यम से">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## अंतर्निहित कैटलॉग

| मॉडल संदर्भ                    | नाम                    | इनपुट | कॉन्टेक्स्ट | अधिकतम आउटपुट | लागत (प्रति 1M इनपुट/आउटपुट) | टूल | टिप्पणियाँ                                |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | टेक्स्ट  | 256K    | 80K        | $0.25 / $0.90        | नहीं    | डिफ़ॉल्ट मॉडल; विस्तारित चिंतन          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | टेक्स्ट  | 128K    | 16K        | $0.25 / $1.00        | हाँ   | सामान्य प्रयोजन; 400B पैरामीटर, 13B सक्रिय  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | टेक्स्ट  | 128K    | 80K        | $0.045 / $0.15       | हाँ   | तेज़ और लागत-कुशल; फ़ंक्शन कॉलिंग |

<Tip>
ऑनबोर्डिंग प्रीसेट `arcee/trinity-large-thinking` को डिफ़ॉल्ट मॉडल के रूप में सेट करता है।
</Tip>

## समर्थित सुविधाएँ

| सुविधा                                        | समर्थित                                      |
| --------------------------------------------- | -------------------------------------------- |
| स्ट्रीमिंग                                     | हाँ                                          |
| टूल का उपयोग / फ़ंक्शन कॉलिंग                   | हाँ (Trinity Mini, Trinity Large Preview)    |
| संरचित आउटपुट (JSON मोड और JSON स्कीमा) | हाँ                                          |
| विस्तारित चिंतन                             | हाँ (Trinity Large Thinking; टूल अक्षम) |

<AccordionGroup>
  <Accordion title="एनवायरनमेंट संबंधी टिप्पणी">
    यदि Gateway डेमॉन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `ARCEEAI_API_KEY`
    (या `OPENROUTER_API_KEY`) उस प्रोसेस के लिए उपलब्ध हो, उदाहरण के लिए
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से।
  </Accordion>

  <Accordion title="OpenRouter रूटिंग">
    OpenRouter के माध्यम से Arcee मॉडल का उपयोग करते समय, वही `arcee/*` मॉडल संदर्भ लागू होते हैं।
    OpenClaw आपके प्रमाणीकरण विकल्प के आधार पर पारदर्शी रूप से रूट करता है। OpenRouter-विशिष्ट
    कॉन्फ़िगरेशन विवरण के लिए [OpenRouter प्रदाता दस्तावेज़](/hi/providers/openrouter) देखें।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/hi/providers/openrouter" icon="shuffle">
    एक ही API कुंजी के माध्यम से Arcee मॉडल और कई अन्य मॉडल एक्सेस करें।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
</CardGroup>
