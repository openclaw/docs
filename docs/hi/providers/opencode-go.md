---
read_when:
    - आपको OpenCode Go कैटलॉग चाहिए
    - आपको Go-होस्टेड मॉडल के लिए रनटाइम मॉडल रेफ़रेंस चाहिए
summary: साझा OpenCode सेटअप के साथ OpenCode Go कैटलॉग का उपयोग करें
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-16T17:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go, [OpenCode](/hi/providers/opencode) के भीतर मौजूद Go कैटलॉग है। यह Zen कैटलॉग के साथ
`OPENCODE_API_KEY` क्रेडेंशियल साझा करता है, लेकिन अपनी अलग
रनटाइम प्रदाता आईडी (`opencode-go`) रखता है, ताकि अपस्ट्रीम प्रति-मॉडल रूटिंग
सही बनी रहे।

| प्रॉपर्टी         | मान                                              |
| ---------------- | -------------------------------------------------- |
| रनटाइम प्रदाता | `opencode-go`                                      |
| प्रमाणीकरण             | `OPENCODE_API_KEY` (उपनाम: `OPENCODE_ZEN_API_KEY`) |
| पैरेंट सेटअप     | [OpenCode](/hi/providers/opencode)                    |

## आरंभ करना

<Tabs>
  <Tab title="इंटरैक्टिव">
    <Steps>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="किसी Go मॉडल को डिफ़ॉल्ट के रूप में सेट करें">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="गैर-इंटरैक्टिव">
    <Steps>
      <Step title="कुंजी सीधे पास करें">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## अंतर्निहित कैटलॉग

वर्तमान मॉडल सूची के लिए `openclaw models list --provider opencode-go` चलाएँ।
बंडल की गई पंक्तियाँ:

| मॉडल रेफ़रेंस                       | नाम              | कॉन्टेक्स्ट   | अधिकतम आउटपुट | इमेज इनपुट |
| ------------------------------- | ----------------- | --------- | ---------- | ----------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K       | नहीं          |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K       | नहीं          |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768     | नहीं          |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768     | नहीं          |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072    | नहीं          |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768     | नहीं          |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536     | हाँ         |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536     | हाँ         |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144    | हाँ         |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000    | हाँ         |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000    | नहीं          |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536     | नहीं          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072    | नहीं          |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072    | नहीं          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536     | हाँ         |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536     | हाँ         |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536     | नहीं          |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536     | हाँ         |

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="रूटिंग व्यवहार">
    OpenClaw किसी भी `opencode-go/...` मॉडल रेफ़रेंस को स्वचालित रूप से रूट करता है। किसी अतिरिक्त
    प्रदाता कॉन्फ़िगरेशन की आवश्यकता नहीं है।
  </Accordion>

  <Accordion title="रनटाइम रेफ़रेंस परंपरा">
    रनटाइम रेफ़रेंस स्पष्ट रहते हैं: Zen के लिए `opencode/...` और
    Go के लिए `opencode-go/...`। इससे दोनों कैटलॉग में अपस्ट्रीम प्रति-मॉडल रूटिंग सही बनी रहती है।
  </Accordion>

  <Accordion title="साझा क्रेडेंशियल">
    एक `OPENCODE_API_KEY` Zen और Go, दोनों कैटलॉग को कवर करता है। सेटअप के दौरान
    कुंजी दर्ज करने से दोनों रनटाइम प्रदाताओं के क्रेडेंशियल संग्रहीत हो जाते हैं।
  </Accordion>
</AccordionGroup>

<Tip>
साझा ऑनबोर्डिंग के अवलोकन और संपूर्ण Zen + Go कैटलॉग संदर्भ के लिए
[OpenCode](/hi/providers/opencode) देखें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="OpenCode (पैरेंट)" href="/hi/providers/opencode" icon="server">
    साझा ऑनबोर्डिंग, कैटलॉग का अवलोकन और उन्नत नोट्स।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं और मॉडल रेफ़रेंस का चयन तथा फ़ेलओवर व्यवहार।
  </Card>
</CardGroup>
