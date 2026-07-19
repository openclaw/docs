---
read_when:
    - आप OpenClaw के साथ Tencent hy3 का उपयोग करना चाहते हैं
    - आपको TokenHub या TokenPlan API कुंजी सेटअप की आवश्यकता है
summary: hy3 के लिए Tencent Cloud TokenHub और TokenPlan सेटअप
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-19T09:34:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

OpenAI-संगत API का उपयोग करके दो एंडपॉइंट — TokenHub (`tencent-tokenhub`) और TokenPlan (`tencent-tokenplan`) — के माध्यम से Tencent Hy3 तक पहुँचने के लिए आधिकारिक Tencent Cloud प्रदाता Plugin इंस्टॉल करें।

| प्रॉपर्टी                  | मान                                                 |
| ------------------------- | ----------------------------------------------------- |
| प्रदाता आईडी              | `tencent-tokenhub`, `tencent-tokenplan`               |
| पैकेज                   | `@openclaw/tencent-provider`                          |
| TokenHub प्रमाणीकरण एनवायरनमेंट वेरिएबल     | `TOKENHUB_API_KEY`                                    |
| TokenPlan प्रमाणीकरण एनवायरनमेंट वेरिएबल    | `TOKENPLAN_API_KEY`                                   |
| TokenHub ऑनबोर्डिंग फ़्लैग  | `--auth-choice tokenhub-api-key`                      |
| TokenPlan ऑनबोर्डिंग फ़्लैग | `--auth-choice tokenplan-api-key`                     |
| TokenHub प्रत्यक्ष CLI फ़्लैग  | `--tokenhub-api-key <key>`                            |
| TokenPlan प्रत्यक्ष CLI फ़्लैग | `--tokenplan-api-key <key>`                           |
| API                       | OpenAI-संगत (`openai-completions`)              |
| TokenHub आधार URL         | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub वैश्विक आधार URL  | `https://tokenhub-intl.tencentmaas.com/v1` (ओवरराइड) |
| TokenPlan आधार URL        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| डिफ़ॉल्ट मॉडल             | `tencent-tokenhub/hy3`                                |

## त्वरित शुरुआत

<Steps>
  <Step title="Tencent API कुंजी बनाएँ">
    Tencent Cloud TokenHub और TokenPlan के लिए एक API कुंजी बनाएँ। यदि आप कुंजी के लिए सीमित पहुँच का दायरा चुनते हैं, तो अनुमत मॉडलों में **hy3** (और यदि आप इसे TokenHub पर उपयोग करने की योजना बनाते हैं, तो **hy3 preview**) शामिल करें।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    <CodeGroup>

```bash TokenHub ऑनबोर्डिंग
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub प्रत्यक्ष फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan ऑनबोर्डिंग
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan प्रत्यक्ष फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash केवल एनवायरनमेंट
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="मॉडल सत्यापित करें">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## गैर-इंटरैक्टिव सेटअप

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` के साथ `--non-interactive` आवश्यक है।
</Note>

## बिल्ट-इन कैटलॉग

| मॉडल संदर्भ                      | नाम                   | इनपुट | कॉन्टेक्स्ट | अधिकतम आउटपुट | टिप्पणियाँ             |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | टेक्स्ट  | 256,000 | 64,000     | रीजनिंग-सक्षम |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | टेक्स्ट  | 256,000 | 64,000     | रीजनिंग-सक्षम |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | टेक्स्ट  | 256,000 | 64,000     | रीजनिंग-सक्षम |

hy3 रीजनिंग, लंबे कॉन्टेक्स्ट वाले निर्देशों का पालन, कोड और एजेंट कार्यप्रवाहों के लिए Tencent Hunyuan का बड़ा MoE भाषा मॉडल है। Tencent के OpenAI-संगत उदाहरण मॉडल आईडी के रूप में `hy3` का उपयोग करते हैं और मानक चैट-कम्प्लीशन्स टूल कॉलिंग के साथ `reasoning_effort` का समर्थन करते हैं।

<Tip>
  मॉडल आईडी `hy3` है। इसे Tencent के `HY-3D-*` मॉडलों से भ्रमित न करें, जो 3D जनरेशन API हैं और इस प्रदाता द्वारा कॉन्फ़िगर किया गया OpenClaw चैट मॉडल नहीं हैं।
</Tip>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="एंडपॉइंट ओवरराइड">
    OpenClaw का बिल्ट-इन कैटलॉग Tencent Cloud के `https://tokenhub.tencentmaas.com/v1` एंडपॉइंट का उपयोग करता है। इसे केवल तभी ओवरराइड करें, जब आपके TokenHub खाते या क्षेत्र के लिए किसी दूसरे एंडपॉइंट की आवश्यकता हो:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="डेमन के लिए एनवायरनमेंट उपलब्धता">
    यदि Gateway एक प्रबंधित सेवा (launchd, systemd, Docker) के रूप में चलता है, तो `TOKENHUB_API_KEY` और `TOKENPLAN_API_KEY` उस प्रोसेस को दिखाई देने चाहिए। उन्हें `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें, ताकि launchd, systemd या Docker exec एनवायरनमेंट उन्हें पढ़ सकें।

    <Warning>
      केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजियाँ प्रबंधित Gateway प्रोसेस को दिखाई नहीं देती हैं। स्थायी उपलब्धता के लिए एनवायरनमेंट फ़ाइल या कॉन्फ़िगरेशन सीम का उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग सहित संपूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud का TokenHub उत्पाद पृष्ठ।
  </Card>
  <Card title="Hy3 preview मॉडल कार्ड" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview का विवरण और बेंचमार्क।
  </Card>
</CardGroup>
