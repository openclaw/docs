---
read_when:
    - आप OpenClaw के साथ Groq का उपयोग करना चाहते हैं
    - आपको API कुंजी के env var या CLI प्रमाणीकरण विकल्प की आवश्यकता है
    - आप Groq पर Whisper ऑडियो ट्रांसक्रिप्शन कॉन्फ़िगर कर रहे हैं
summary: Groq सेटअप (प्रमाणीकरण + मॉडल चयन + Whisper प्रतिलेखन)
title: Groq
x-i18n:
    generated_at: "2026-06-28T23:59:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) कस्टम LPU हार्डवेयर का उपयोग करके open-weight मॉडल (Llama, Gemma, Kimi, Qwen, GPT OSS, और अधिक) पर अति-तेज़ inference प्रदान करता है। Groq plugin OpenAI-संगत chat provider और audio media-understanding provider, दोनों को register करता है।

| गुण                    | मान                                      |
| ---------------------- | ---------------------------------------- |
| Provider id            | `groq`                                   |
| Plugin                 | आधिकारिक बाहरी package                  |
| Auth env var           | `GROQ_API_KEY`                           |
| API                    | OpenAI-संगत (`openai-completions`)       |
| Base URL               | `https://api.groq.com/openai/v1`         |
| Audio transcription    | `whisper-large-v3-turbo` (default)       |
| Suggested chat default | `groq/llama-3.3-70b-versatile`           |

## Plugin install करें

आधिकारिक plugin install करें, फिर Gateway restart करें:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## शुरू करना

<Steps>
  <Step title="API key प्राप्त करें">
    [console.groq.com/keys](https://console.groq.com/keys) पर API key बनाएँ।
  </Step>
  <Step title="API key सेट करें">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="default model सेट करें">
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
  <Step title="catalog पहुँच योग्य है, सत्यापित करें">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Config file उदाहरण

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

## Built-in catalog

OpenClaw reasoning और non-reasoning entries, दोनों के साथ manifest-backed Groq catalog ship करता है। अपने installed version के static rows देखने के लिए `openclaw models list --provider groq` चलाएँ, या Groq की authoritative list के लिए [console.groq.com/docs/models](https://console.groq.com/docs/models) देखें।

| Model ref                                        | नाम                     | Reasoning | Input        | Context |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | नहीं      | text         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | नहीं      | text         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | नहीं      | text + image | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | हाँ       | text         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | हाँ       | text         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | हाँ       | text         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | हाँ       | text         | 131,072 |
| `groq/groq/compound`                             | Compound                | हाँ       | text         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | हाँ       | text         | 131,072 |

<Tip>
  catalog हर OpenClaw release के साथ विकसित होता है। `openclaw models list --provider groq` आपके installed version को ज्ञात rows दिखाता है; नए जोड़े गए या deprecated models के लिए [console.groq.com/docs/models](https://console.groq.com/docs/models) से cross-check करें।
</Tip>

## Reasoning models

OpenClaw अपने साझा `/think` levels को Groq के model-specific `reasoning_effort` values से map करता है:

- `qwen/qwen3-32b` के लिए, disabled thinking `none` भेजता है और enabled thinking `default` भेजता है।
- Groq GPT OSS reasoning models (`openai/gpt-oss-*`) के लिए, OpenClaw `/think` level के आधार पर `low`, `medium`, या `high` भेजता है। Disabled thinking `reasoning_effort` को omit करता है क्योंकि ये models disabled value support नहीं करते।
- DeepSeek R1 Distill, Qwen QwQ, और Compound Groq की native reasoning surface का उपयोग करते हैं; `/think` visibility control करता है लेकिन model हमेशा reason करता है।

साझा `/think` levels और OpenClaw उन्हें प्रत्येक provider के लिए कैसे translate करता है, इसके लिए [Thinking modes](/hi/tools/thinking) देखें।

## Audio transcription

Groq का plugin एक **audio media-understanding provider** भी register करता है ताकि voice messages को साझा `tools.media.audio` surface के माध्यम से transcribe किया जा सके।

| गुण                | मान                                       |
| ------------------ | ----------------------------------------- |
| Shared config path | `tools.media.audio`                       |
| Default base URL   | `https://api.groq.com/openai/v1`          |
| Default model      | `whisper-large-v3-turbo`                  |
| Auto priority      | 20                                        |
| API endpoint       | OpenAI-संगत `/audio/transcriptions`       |

Groq को default audio backend बनाने के लिए:

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
  <Accordion title="daemon के लिए environment availability">
    यदि Gateway managed service (launchd, systemd, Docker) के रूप में चलता है, तो `GROQ_API_KEY` उस process को visible होना चाहिए — केवल आपके interactive shell को नहीं।

    <Warning>
      केवल interactive shell में export की गई key launchd या systemd daemon की मदद नहीं करेगी, जब तक कि वह environment वहाँ भी import न किया गया हो। key को gateway process से readable बनाने के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw runtime पर कोई भी Groq model id स्वीकार करता है। Groq द्वारा दिखाए गए exact id का उपयोग करें और उसके आगे `groq/` prefix लगाएँ। static catalog common cases को cover करता है; uncatalogued ids default OpenAI-संगत template पर fall through करते हैं।

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
  <Card title="Model providers" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Thinking modes" href="/hi/tools/thinking" icon="brain">
    Reasoning effort levels और provider-policy interaction।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    provider और audio settings सहित पूरा config schema।
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq dashboard, API docs, और pricing।
  </Card>
</CardGroup>
