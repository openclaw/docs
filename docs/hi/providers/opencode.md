---
read_when:
    - आप OpenCode द्वारा होस्ट किए गए मॉडल का एक्सेस चाहते हैं
    - आप Zen और Go कैटलॉग में से किसी एक को चुनना चाहते हैं
summary: OpenClaw के साथ OpenCode Zen और Go कैटलॉग का उपयोग करें
title: OpenCode
x-i18n:
    generated_at: "2026-07-19T09:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode, OpenClaw में दो होस्टेड कैटलॉग उपलब्ध कराता है:

| कैटलॉग | प्रीफ़िक्स            | रनटाइम प्रदाता |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

दोनों कैटलॉग एक OpenCode API कुंजी (`OPENCODE_API_KEY`, उपनाम
`OPENCODE_ZEN_API_KEY`) साझा करते हैं। OpenClaw रनटाइम प्रदाता आईडी को अलग रखता है, ताकि
अपस्ट्रीम प्रति-मॉडल रूटिंग सही बनी रहे, लेकिन ऑनबोर्डिंग और दस्तावेज़ इन्हें
एक ही OpenCode सेटअप मानते हैं।

## शुरू करना

<Tabs>
  <Tab title="Zen कैटलॉग">
    **इनके लिए सर्वोत्तम:** क्यूरेट किया गया OpenCode मल्टी-मॉडल प्रॉक्सी (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen)।

    <Steps>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        या कुंजी सीधे प्रदान करें:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="किसी Zen मॉडल को डिफ़ॉल्ट के रूप में सेट करें">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go कैटलॉग">
    **इनके लिए सर्वोत्तम:** OpenCode द्वारा होस्ट किए गए Kimi, GLM, MiniMax, Qwen और DeepSeek मॉडल।

    <Steps>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        या कुंजी सीधे प्रदान करें:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## अंतर्निहित कैटलॉग

### Zen

| प्रॉपर्टी         | मान                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| रनटाइम प्रदाता | `opencode`                                                                                    |
| उदाहरण मॉडल   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

पूरी वर्तमान सूची के लिए `openclaw models list --provider opencode` चलाएँ, जिसमें
`opencode/big-pickle` और `opencode/deepseek-v4-flash-free` जैसी मुफ़्त-स्तर की पंक्तियाँ भी
शामिल हैं।

### Go

| प्रॉपर्टी         | मान                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| रनटाइम प्रदाता | `opencode-go`                                                            |
| उदाहरण मॉडल   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

पूरी Go मॉडल तालिका के लिए [OpenCode Go](/hi/providers/opencode-go) देखें।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="API कुंजी के उपनाम">
    `OPENCODE_ZEN_API_KEY` को `OPENCODE_API_KEY` के उपनाम के रूप में भी स्वीकार किया जाता है।
  </Accordion>

  <Accordion title="साझा क्रेडेंशियल">
    सेटअप के दौरान एक OpenCode कुंजी दर्ज करने पर दोनों रनटाइम
    प्रदाताओं के क्रेडेंशियल संग्रहीत हो जाते हैं। आपको प्रत्येक कैटलॉग को अलग से ऑनबोर्ड करने की आवश्यकता नहीं है।
  </Accordion>

  <Accordion title="API कुंजी प्राप्त करना">
    एक OpenCode खाता बनाएँ और
    [opencode.ai/auth](https://opencode.ai/auth) पर API कुंजी जनरेट करें। बिलिंग और कैटलॉग की
    उपलब्धता OpenCode डैशबोर्ड से प्रबंधित की जाती है।
  </Accordion>

  <Accordion title="Gemini रीप्ले व्यवहार">
    Gemini-समर्थित OpenCode रेफ़रेंस प्रॉक्सी-Gemini पथ पर बने रहते हैं, इसलिए OpenClaw वहाँ
    Gemini विचार-हस्ताक्षर सैनिटाइज़ेशन बनाए रखता है, लेकिन नेटिव Gemini
    रीप्ले सत्यापन या बूटस्ट्रैप पुनर्लेखन सक्षम नहीं करता।
  </Accordion>

  <Accordion title="गैर-Gemini रीप्ले व्यवहार">
    गैर-Gemini OpenCode रेफ़रेंस न्यूनतम OpenAI-संगत रीप्ले नीति बनाए रखते हैं।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/hi/providers/opencode-go" icon="server">
    पूरा Go कैटलॉग संदर्भ।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़रेंस और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    एजेंटों, मॉडलों और प्रदाताओं के लिए पूरा कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
