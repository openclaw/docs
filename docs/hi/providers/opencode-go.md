---
read_when:
    - आपको OpenCode Go कैटलॉग चाहिए
    - आपको Go-होस्टेड मॉडल के लिए रनटाइम मॉडल refs चाहिए
summary: साझा OpenCode सेटअप के साथ OpenCode Go कैटलॉग का उपयोग करें
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-29T00:01:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go, [OpenCode](/hi/providers/opencode) के भीतर Go कैटलॉग है।
यह Zen कैटलॉग जैसा ही `OPENCODE_API_KEY` उपयोग करता है, लेकिन रनटाइम
प्रदाता id `opencode-go` रखता है ताकि अपस्ट्रीम प्रति-मॉडल रूटिंग सही रहे।

| गुण              | मान                             |
| ---------------- | ------------------------------- |
| रनटाइम प्रदाता   | `opencode-go`                   |
| प्रमाणीकरण       | `OPENCODE_API_KEY`              |
| पैरेंट सेटअप     | [OpenCode](/hi/providers/opencode) |

## अंतर्निहित कैटलॉग

OpenClaw अधिकांश Go कैटलॉग पंक्तियां बंडल की गई OpenClaw मॉडल रजिस्ट्री से लेता है और
रजिस्ट्री के अद्यतन होने तक मौजूदा अपस्ट्रीम पंक्तियां जोड़ता है। मौजूदा मॉडल सूची के लिए
`openclaw models list --provider opencode-go` चलाएं।

प्रदाता में शामिल हैं:

| मॉडल ref                       | नाम                   |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3x सीमाएं) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2, 1M-token संदर्भ विंडो का उपयोग करता है और 131K तक आउटपुट टोकन का समर्थन करता है।

## शुरू करना

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## कॉन्फ़िग उदाहरण

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Routing behavior">
    जब मॉडल ref `opencode-go/...` का उपयोग करता है, तो OpenClaw प्रति-मॉडल रूटिंग
    अपने-आप संभालता है। किसी अतिरिक्त प्रदाता कॉन्फ़िग की आवश्यकता नहीं है।
  </Accordion>

  <Accordion title="Runtime ref convention">
    रनटाइम refs स्पष्ट रहते हैं: Zen के लिए `opencode/...`, Go के लिए `opencode-go/...`।
    इससे दोनों कैटलॉग में अपस्ट्रीम प्रति-मॉडल रूटिंग सही रहती है।
  </Accordion>

  <Accordion title="Shared credentials">
    Zen और Go दोनों कैटलॉग द्वारा वही `OPENCODE_API_KEY` उपयोग किया जाता है। सेटअप के दौरान
    कुंजी दर्ज करने से दोनों रनटाइम प्रदाताओं के लिए क्रेडेंशियल संग्रहीत हो जाते हैं।
  </Accordion>
</AccordionGroup>

<Tip>
साझा ऑनबोर्डिंग अवलोकन और पूर्ण Zen + Go कैटलॉग संदर्भ के लिए [OpenCode](/hi/providers/opencode) देखें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/hi/providers/opencode" icon="server">
    साझा ऑनबोर्डिंग, कैटलॉग अवलोकन, और उन्नत नोट्स।
  </Card>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल refs, और फ़ेलओवर व्यवहार को चुनना।
  </Card>
</CardGroup>
