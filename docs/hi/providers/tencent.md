---
read_when:
    - आप OpenClaw के साथ Tencent Hy3 preview का उपयोग करना चाहते हैं
    - आपको TokenHub API कुंजी सेटअप की आवश्यकता है
summary: Hy3 पूर्वावलोकन के लिए Tencent Cloud TokenHub सेटअप
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-29T00:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

OpenAI-संगत API का उपयोग करके TokenHub endpoint (`tencent-tokenhub`) के माध्यम से Tencent Hy3 preview तक पहुंचने के लिए आधिकारिक Tencent Cloud प्रदाता Plugin इंस्टॉल करें।

| प्रॉपर्टी         | मान                                                   |
| ---------------- | ----------------------------------------------------- |
| प्रदाता id        | `tencent-tokenhub`                                    |
| पैकेज            | `@openclaw/tencent-provider`                          |
| Auth env var     | `TOKENHUB_API_KEY`                                    |
| Onboarding flag  | `--auth-choice tokenhub-api-key`                      |
| Direct CLI flag  | `--tokenhub-api-key <key>`                            |
| API              | OpenAI-संगत (`openai-completions`)                    |
| डिफ़ॉल्ट base URL | `https://tokenhub.tencentmaas.com/v1`                 |
| वैश्विक base URL | `https://tokenhub-intl.tencentmaas.com/v1` (override) |
| डिफ़ॉल्ट मॉडल     | `tencent-tokenhub/hy3-preview`                        |

## त्वरित शुरुआत

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    Tencent Cloud TokenHub में API key बनाएं। यदि आप key के लिए सीमित access scope चुनते हैं, तो अनुमत मॉडलों में **Hy3 preview** शामिल करें।
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Non-interactive सेटअप

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## अंतर्निहित कैटलॉग

| मॉडल ref                       | नाम                    | इनपुट | Context | अधिकतम आउटपुट | नोट्स                    |
| ------------------------------ | ---------------------- | ----- | ------- | -------------- | ------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | पाठ   | 256,000 | 64,000         | डिफ़ॉल्ट; reasoning-सक्षम |

Hy3 preview, Tencent Hunyuan का बड़ा MoE भाषा मॉडल है, जो reasoning, long-context निर्देशों का पालन, code, और agent workflows के लिए है। Tencent के OpenAI-संगत उदाहरण model id के रूप में `hy3-preview` का उपयोग करते हैं और मानक chat-completions tool calling के साथ `reasoning_effort` का समर्थन करते हैं।

<Tip>
  model id `hy3-preview` है। इसे Tencent के `HY-3D-*` मॉडलों से भ्रमित न करें, जो 3D generation API हैं और इस प्रदाता द्वारा कॉन्फ़िगर किया गया OpenClaw chat model नहीं हैं।
</Tip>

## स्तरीकृत मूल्य निर्धारण

प्रदाता कैटलॉग स्तरीकृत लागत metadata के साथ आता है, जो input window length के अनुसार scale होता है, इसलिए लागत अनुमान manual overrides के बिना भर दिए जाते हैं।

| Input tokens range | Input rate | Output rate | Cache read |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

दरें Tencent द्वारा विज्ञापित USD में प्रति मिलियन tokens हैं। केवल तभी `models.providers.tencent-tokenhub` के अंतर्गत pricing override करें जब आपको अलग surface की आवश्यकता हो।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw डिफ़ॉल्ट रूप से Tencent Cloud के `https://tokenhub.tencentmaas.com/v1` endpoint का उपयोग करता है। Tencent एक अंतरराष्ट्रीय TokenHub endpoint भी दस्तावेज़ित करता है:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    endpoint को केवल तभी override करें जब आपके TokenHub खाते या क्षेत्र को इसकी आवश्यकता हो।

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    यदि Gateway managed service (launchd, systemd, Docker) के रूप में चलता है, तो `TOKENHUB_API_KEY` उस process को visible होना चाहिए। इसे `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें ताकि launchd, systemd, या Docker exec environments इसे पढ़ सकें।

    <Warning>
      केवल interactive shell में export की गई keys managed gateway processes को visible नहीं होतीं। स्थायी availability के लिए env file या config seam का उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model providers" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, model refs, और failover behavior को चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration" icon="gear">
    प्रदाता settings सहित पूर्ण config schema।
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud का TokenHub product page।
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview details और benchmarks।
  </Card>
</CardGroup>
