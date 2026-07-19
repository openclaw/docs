---
read_when:
    - आप OpenClaw में Mistral मॉडल का उपयोग करना चाहते हैं
    - आप Voice Call के लिए Voxtral रीयल-टाइम ट्रांसक्रिप्शन चाहते हैं
    - आपको Mistral API कुंजी की ऑनबोर्डिंग और मॉडल संदर्भ चाहिए
summary: OpenClaw के साथ Mistral मॉडल और Voxtral ट्रांसक्रिप्शन का उपयोग करें
title: Mistral
x-i18n:
    generated_at: "2026-07-19T09:33:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

बंडल किया गया `mistral` Plugin चार अनुबंध पंजीकृत करता है: चैट पूर्णताएँ, मीडिया समझ (Voxtral बैच ट्रांसक्रिप्शन), Voice Call के लिए रीयलटाइम STT (Voxtral Realtime), और मेमोरी एम्बेडिंग (`mistral-embed`)।

| गुण              | मान                                         |
| ---------------- | ------------------------------------------- |
| प्रदाता आईडी     | `mistral`                                   |
| Plugin           | बंडल किया गया, डिफ़ॉल्ट रूप से सक्षम       |
| प्रमाणीकरण एन्वायरनमेंट वेरिएबल | `MISTRAL_API_KEY`                           |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice mistral-api-key`             |
| प्रत्यक्ष CLI फ़्लैग | `--mistral-api-key <key>`                   |
| API              | OpenAI-संगत (`openai-completions`)    |
| बेस URL          | `https://api.mistral.ai/v1`                 |
| डिफ़ॉल्ट मॉडल    | `mistral/mistral-large-latest`              |
| एम्बेडिंग मॉडल   | `mistral-embed`                             |
| Voxtral बैच      | `voxtral-mini-latest` (ऑडियो ट्रांसक्रिप्शन) |
| Voxtral रीयलटाइम | `voxtral-mini-transcribe-realtime-2602`     |

## आरंभ करना

<Steps>
  <Step title="अपनी API कुंजी प्राप्त करें">
    [Mistral Console](https://console.mistral.ai/) में एक API कुंजी बनाएँ।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    या कुंजी सीधे पास करें:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## अंतर्निर्मित LLM कैटलॉग

| मॉडल संदर्भ                     | इनपुट      | कॉन्टेक्स्ट | अधिकतम आउटपुट | टिप्पणियाँ                                            |
| -------------------------------- | ----------- | ------- | ---------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | टेक्स्ट, इमेज | 262,144 | 16,384     | डिफ़ॉल्ट मॉडल                                         |
| `mistral/mistral-medium-2508`    | टेक्स्ट, इमेज | 262,144 | 8,192      | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | टेक्स्ट, इमेज | 262,144 | 8,192      | Mistral Medium 3.5; समायोज्य रीजनिंग                  |
| `mistral/mistral-small-latest`   | टेक्स्ट, इमेज | 262,144 | 16,384     | Mistral Small 4 का नवीनतम संस्करण; समायोज्य `reasoning_effort` |
| `mistral/mistral-small-2603`     | टेक्स्ट, इमेज | 262,144 | 16,384     | Mistral Small 4 का पिन किया गया संस्करण; समायोज्य `reasoning_effort` |
| `mistral/pixtral-large-latest`   | टेक्स्ट, इमेज | 128,000 | 32,768     | Pixtral                                               |
| `mistral/codestral-latest`       | टेक्स्ट      | 256,000 | 4,096      | कोडिंग                                                |
| `mistral/devstral-medium-latest` | टेक्स्ट      | 262,144 | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`        | टेक्स्ट      | 128,000 | 40,000     | रीजनिंग-सक्षम                                         |

कॉन्फ़िग बदलने से पहले बंडल की गई कैटलॉग पंक्ति देखें:

```bash
openclaw models list --all --provider mistral --plain
```

Gateway शुरू किए बिना किसी मॉडल का स्मोक टेस्ट करें:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "ठीक यही उत्तर दें: mistral-ok" \
  --json
```

## ऑडियो ट्रांसक्रिप्शन (Voxtral)

मीडिया समझ पाइपलाइन के माध्यम से बैच ऑडियो ट्रांसक्रिप्शन के लिए Voxtral का उपयोग करें:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
मीडिया ट्रांसक्रिप्शन पथ `/v1/audio/transcriptions` का उपयोग करता है। Mistral के लिए डिफ़ॉल्ट ऑडियो मॉडल `voxtral-mini-latest` है।
</Tip>

## Voice Call स्ट्रीमिंग STT

बंडल किया गया `mistral` Plugin, Voxtral Realtime को Voice Call स्ट्रीमिंग STT प्रदाता के रूप में पंजीकृत करता है।

| सेटिंग       | कॉन्फ़िग पथ                                                           | डिफ़ॉल्ट                                |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API कुंजी    | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY` पर फ़ॉलबैक करता है    |
| मॉडल         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| एन्कोडिंग    | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| सैंपल दर     | `...mistral.sampleRate`                                                | `8000`                                  |
| लक्षित विलंब | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw, Mistral रीयलटाइम STT को 8 kHz पर `pcm_mulaw` पर डिफ़ॉल्ट करता है, ताकि Voice Call, Twilio मीडिया फ़्रेम सीधे फ़ॉरवर्ड कर सके। `encoding: "pcm_s16le"` और मेल खाते `sampleRate` का उपयोग केवल तभी करें, जब आपकी अपस्ट्रीम स्ट्रीम पहले से रॉ PCM हो।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="समायोज्य रीजनिंग">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603`, और `mistral/mistral-medium-3-5`, Chat Completions API पर `reasoning_effort` के माध्यम से [समायोज्य रीजनिंग](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) का समर्थन करते हैं (`none` आउटपुट में अतिरिक्त चिंतन को न्यूनतम करता है; `high` अंतिम उत्तर से पहले चिंतन के पूर्ण ट्रेस दिखाता है)।

    OpenClaw, सत्र के **चिंतन** स्तर को Mistral के API से मैप करता है:

    | OpenClaw चिंतन स्तर                                                  | Mistral `reasoning_effort` |
    | ----------------------------------------------------------------------- | --------------------------- |
    | **बंद** / **न्यूनतम**                                                 | `none`                      |
    | **निम्न** / **मध्यम** / **उच्च** / **अति उच्च** / **अनुकूली** / **अधिकतम** | `high`                       |

    <Warning>
    Medium 3.5 रीजनिंग मोड को `temperature: 0` के साथ संयोजित करने से बचें; रिपोर्ट के अनुसार Mistral HTTP API, `reasoning_effort="high"` और `temperature: 0` को साथ भेजने पर 400 प्रतिक्रिया के साथ अनुरोध अस्वीकार करता है। तापमान को सेट न करें, या चिंतन को बंद/न्यूनतम करें ताकि आपके कम तापमान सेट करने से पहले OpenClaw `reasoning_effort: "none"` भेजे।
    </Warning>

    Medium 3.5 रीजनिंग के लिए मॉडल-स्कोप वाला उदाहरण कॉन्फ़िग:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    बंडल किए गए अन्य Mistral कैटलॉग मॉडल इस पैरामीटर का उपयोग नहीं करते। जब आप Mistral का मूल रीजनिंग-प्रथम व्यवहार चाहते हों, तो `magistral-*` मॉडल का उपयोग जारी रखें।
    </Note>

  </Accordion>

  <Accordion title="मेमोरी एम्बेडिंग">
    Mistral, `/v1/embeddings` के माध्यम से मेमोरी एम्बेडिंग प्रदान कर सकता है (डिफ़ॉल्ट मॉडल: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="प्रमाणीकरण और बेस URL">
    - Mistral प्रमाणीकरण `MISTRAL_API_KEY` (Bearer हेडर) का उपयोग करता है।
    - प्रदाता का बेस URL डिफ़ॉल्ट रूप से `https://api.mistral.ai/v1` होता है और मानक OpenAI-संगत चैट-पूर्णता अनुरोध प्रारूप स्वीकार करता है।
    - ऑनबोर्डिंग का डिफ़ॉल्ट मॉडल `mistral/mistral-large-latest` है।
    - बेस URL को `models.providers.mistral.baseUrl` के अंतर्गत केवल तभी ओवरराइड करें, जब Mistral स्पष्ट रूप से आपके लिए आवश्यक क्षेत्रीय एंडपॉइंट प्रकाशित करे।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="मीडिया समझ" href="/hi/nodes/media-understanding" icon="microphone">
    ऑडियो ट्रांसक्रिप्शन सेटअप और प्रदाता चयन।
  </Card>
</CardGroup>
