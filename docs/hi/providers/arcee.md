---
read_when:
    - आप OpenClaw के साथ Arcee AI का उपयोग करना चाहते हैं
    - आपको API कुंजी env var या CLI प्रमाणीकरण विकल्प चाहिए
summary: Arcee AI सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-28T23:56:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) OpenAI-संगत API के माध्यम से मिश्रित-विशेषज्ञ मॉडलों के Trinity परिवार तक पहुँच प्रदान करता है। सभी Trinity मॉडल Apache 2.0 लाइसेंस प्राप्त हैं।

Arcee AI मॉडलों तक सीधे Arcee प्लेटफ़ॉर्म के माध्यम से या [OpenRouter](/hi/providers/openrouter) के ज़रिए पहुँचा जा सकता है।

| गुण | मान                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| प्रदाता | `arcee`                                                                               |
| प्रमाणीकरण     | `ARCEEAI_API_KEY` (सीधा) या `OPENROUTER_API_KEY` (OpenRouter के ज़रिए)                   |
| API      | OpenAI-संगत                                                                     |
| आधार URL | `https://api.arcee.ai/api/v1` (सीधा) या `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः प्रारंभ करें:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## शुरू करना

<Tabs>
  <Tab title="सीधा (Arcee प्लेटफ़ॉर्म)">
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

  <Tab title="OpenRouter के ज़रिए">
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

        वही मॉडल रेफ़रेंस सीधे और OpenRouter, दोनों सेटअप के लिए काम करते हैं (उदाहरण के लिए `arcee/trinity-large-thinking`)।
      </Step>
    </Steps>

  </Tab>
</Tabs>

## गैर-इंटरैक्टिव सेटअप

<Tabs>
  <Tab title="सीधा (Arcee प्लेटफ़ॉर्म)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter के ज़रिए">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## अंतर्निहित कैटलॉग

OpenClaw अभी यह Arcee स्थैतिक कैटलॉग शिप करता है:

| मॉडल रेफ़रेंस                      | नाम                   | इनपुट | संदर्भ | लागत (प्रति 1M अंदर/बाहर) | नोट्स                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | डिफ़ॉल्ट मॉडल; रीजनिंग सक्षम          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | सामान्य-उद्देश्य; 400B पैरामीटर, 13B सक्रिय  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | तेज़ और लागत-किफ़ायती; फ़ंक्शन कॉलिंग |

<Tip>
ऑनबोर्डिंग प्रीसेट `arcee/trinity-large-thinking` को डिफ़ॉल्ट मॉडल के रूप में सेट करता है।
</Tip>

## समर्थित सुविधाएँ

| सुविधा                                       | समर्थित                                    |
| --------------------------------------------- | -------------------------------------------- |
| स्ट्रीमिंग                                     | हाँ                                          |
| टूल उपयोग / फ़ंक्शन कॉलिंग                   | हाँ (Trinity Mini, Trinity Large Preview)    |
| संरचित आउटपुट (JSON मोड और JSON स्कीमा) | हाँ                                          |
| विस्तारित सोच                             | हाँ (Trinity Large Thinking; टूल अक्षम) |

<AccordionGroup>
  <Accordion title="पर्यावरण नोट">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `ARCEEAI_API_KEY`
    (या `OPENROUTER_API_KEY`) उस प्रक्रिया के लिए उपलब्ध है (उदाहरण के लिए,
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।
  </Accordion>

  <Accordion title="OpenRouter रूटिंग">
    OpenRouter के माध्यम से Arcee मॉडल इस्तेमाल करते समय, वही `arcee/*` मॉडल रेफ़रेंस लागू होते हैं।
    OpenClaw आपके प्रमाणीकरण विकल्प के आधार पर रूटिंग को पारदर्शी रूप से संभालता है। OpenRouter-विशिष्ट
    कॉन्फ़िगरेशन विवरणों के लिए
    [OpenRouter provider दस्तावेज़](/hi/providers/openrouter) देखें।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/hi/providers/openrouter" icon="shuffle">
    एक ही API कुंजी के माध्यम से Arcee मॉडल और कई अन्य तक पहुँचें।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़रेंस और फ़ेलओवर व्यवहार को चुनना।
  </Card>
</CardGroup>
