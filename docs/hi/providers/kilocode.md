---
read_when:
    - आप कई LLMs के लिए एक ही API कुंजी चाहते हैं
    - आप OpenClaw में Kilo Gateway के माध्यम से मॉडल चलाना चाहते हैं
summary: OpenClaw में कई मॉडलों तक पहुँचने के लिए Kilo Gateway के एकीकृत API का उपयोग करें
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-29T00:00:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway एक ही endpoint और API key के पीछे कई मॉडलों तक अनुरोध रूट करने वाला एक **एकीकृत API** प्रदान करता है। यह OpenAI-संगत है, इसलिए अधिकांश OpenAI SDKs base URL बदलकर काम करते हैं।

| प्रॉपर्टी | मान                                |
| -------- | ---------------------------------- |
| प्रदाता | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | OpenAI-संगत                        |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway को फिर से शुरू करें:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## शुरू करना

<Steps>
  <Step title="Create an account">
    [app.kilo.ai](https://app.kilo.ai) पर जाएं, साइन इन करें या खाता बनाएं, फिर API Keys पर जाएं और नई key जनरेट करें।
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    या environment variable को सीधे सेट करें:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## डिफ़ॉल्ट मॉडल

डिफ़ॉल्ट मॉडल `kilocode/kilo/auto` है, जो Kilo Gateway द्वारा प्रबंधित प्रदाता-स्वामित्व वाला smart-routing मॉडल है।

<Note>
OpenClaw `kilocode/kilo/auto` को स्थिर डिफ़ॉल्ट ref मानता है, लेकिन उस route के लिए source-backed task-to-upstream-model mapping प्रकाशित नहीं करता। `kilocode/kilo/auto` के पीछे सटीक upstream routing Kilo Gateway के स्वामित्व में है, OpenClaw में hard-coded नहीं है।
</Note>

## अंतर्निहित कैटलॉग

OpenClaw startup पर Kilo Gateway से उपलब्ध मॉडलों को dynamic रूप से discover करता है। अपने खाते में उपलब्ध मॉडलों की पूरी सूची देखने के लिए `/models kilocode` का उपयोग करें।

Gateway पर उपलब्ध कोई भी मॉडल `kilocode/` prefix के साथ उपयोग किया जा सकता है:

| मॉडल ref                                 | नोट्स                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | डिफ़ॉल्ट — smart routing           |
| `kilocode/anthropic/claude-sonnet-4`     | Kilo के माध्यम से Anthropic        |
| `kilocode/openai/gpt-5.5`                | Kilo के माध्यम से OpenAI           |
| `kilocode/google/gemini-3.1-pro-preview` | Kilo के माध्यम से Google           |
| ...और भी बहुत सारे                      | सभी सूचीबद्ध करने के लिए `/models kilocode` का उपयोग करें |

<Tip>
Startup पर, OpenClaw `GET https://api.kilo.ai/api/gateway/models` को query करता है और discovered models को static fallback catalog से पहले merge करता है। static fallback में हमेशा `kilocode/kilo/auto` (`Kilo Auto`) शामिल होता है, जिसमें `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, और `maxTokens: 128000` होते हैं।
</Tip>

## कॉन्फ़िग उदाहरण

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway को source में OpenRouter-संगत के रूप में documented किया गया है, इसलिए यह native OpenAI request shaping के बजाय proxy-style OpenAI-संगत path पर रहता है।

    - Gemini-backed Kilo refs proxy-Gemini path पर रहते हैं, इसलिए OpenClaw native Gemini replay validation या bootstrap rewrites सक्षम किए बिना वहां Gemini thought-signature sanitation बनाए रखता है।
    - Kilo Gateway आपके API key के साथ under the hood Bearer token का उपयोग करता है।

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    Kilo का साझा stream wrapper provider app header जोड़ता है और समर्थित concrete model refs के लिए proxy reasoning payloads को normalize करता है।

    <Warning>
    `kilocode/kilo/auto` और अन्य proxy-reasoning-unsupported hints reasoning injection को skip करते हैं। यदि आपको reasoning support चाहिए, तो `kilocode/anthropic/claude-sonnet-4` जैसे concrete model ref का उपयोग करें।
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - यदि startup पर model discovery विफल हो जाती है, तो OpenClaw `kilocode/kilo/auto` वाले static catalog पर fallback करता है।
    - पुष्टि करें कि आपकी API key मान्य है और आपके Kilo खाते में वांछित मॉडल enabled हैं।
    - जब Gateway daemon के रूप में चलता है, तो सुनिश्चित करें कि `KILOCODE_API_KEY` उस process के लिए उपलब्ध है (उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, model refs, और failover behavior को चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    पूरा OpenClaw configuration reference।
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway dashboard, API keys, और account management।
  </Card>
</CardGroup>
