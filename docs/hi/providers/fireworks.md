---
read_when:
    - आप OpenClaw के साथ Fireworks का उपयोग करना चाहते हैं
    - आपको Fireworks API कुंजी का एनवायरनमेंट वेरिएबल या डिफ़ॉल्ट मॉडल आईडी चाहिए
    - आप Fireworks पर Kimi के thinking-off व्यवहार को डीबग कर रहे हैं
summary: Fireworks सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Fireworks
x-i18n:
    generated_at: "2026-07-16T16:53:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) OpenAI-संगत API के माध्यम से ओपन-वेट और रूट किए गए मॉडल उपलब्ध कराता है। पहले से कैटलॉग किए गए दो Kimi मॉडल और रनटाइम पर किसी भी Fireworks मॉडल या राउटर आईडी का उपयोग करने के लिए आधिकारिक Fireworks प्रदाता Plugin इंस्टॉल करें।

| प्रॉपर्टी        | मान                                                  |
| --------------- | ------------------------------------------------------ |
| प्रदाता आईडी     | `fireworks` (उपनाम: `fireworks-ai`)                    |
| पैकेज         | `@openclaw/fireworks-provider`                         |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल    | `FIREWORKS_API_KEY`                                    |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice fireworks-api-key`                      |
| प्रत्यक्ष CLI फ़्लैग | `--fireworks-api-key <key>`                            |
| API             | OpenAI-संगत (`openai-completions`)               |
| बेस URL        | `https://api.fireworks.ai/inference/v1`                |
| डिफ़ॉल्ट मॉडल   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| डिफ़ॉल्ट उपनाम   | `Kimi K2.5 Turbo`                                      |

## आरंभ करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Fireworks API कुंजी सेट करें">
    <CodeGroup>

```bash ऑनबोर्डिंग
openclaw onboard --auth-choice fireworks-api-key
```

```bash प्रत्यक्ष फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash केवल एनवायरनमेंट
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    ऑनबोर्डिंग आपके प्रमाणीकरण प्रोफ़ाइल में कुंजी को `fireworks` प्रदाता के साथ संग्रहीत करती है और **Fire Pass** Kimi K2.5 Turbo राउटर को डिफ़ॉल्ट मॉडल के रूप में सेट करती है।

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider fireworks
    ```

    सूची में `Kimi K2.6` और `Kimi K2.5 Turbo (Fire Pass)` शामिल होने चाहिए। यदि `FIREWORKS_API_KEY` हल नहीं होता है, तो `openclaw models status --json`, `auth.unusableProfiles` के अंतर्गत अनुपलब्ध क्रेडेंशियल की रिपोर्ट करता है।

  </Step>
</Steps>

## गैर-इंटरैक्टिव सेटअप

स्क्रिप्टेड या CI इंस्टॉलेशन के लिए, सभी चीज़ें कमांड लाइन पर पास करें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## अंतर्निहित कैटलॉग

| मॉडल संदर्भ                                              | नाम                        | इनपुट        | कॉन्टेक्स्ट | अधिकतम आउटपुट | चिंतन             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | टेक्स्ट + इमेज | 262,144 | 262,144    | बलपूर्वक बंद           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | टेक्स्ट + इमेज | 256,000 | 256,000    | बलपूर्वक बंद (डिफ़ॉल्ट) |

<Note>
  OpenClaw सभी Fireworks Kimi मॉडलों को `thinking: off` पर पिन करता है, क्योंकि यदि अनुरोध स्पष्ट रूप से चिंतन अक्षम नहीं करता है, तो Fireworks पर Kimi की विचार-श्रृंखला दृश्यमान उत्तर में लीक हो सकती है। उसी मॉडल को सीधे [Moonshot](/hi/providers/moonshot) के माध्यम से रूट करने पर Kimi का तर्क आउटपुट सुरक्षित रहता है। प्रदाताओं के बीच स्विच करने के लिए [चिंतन मोड](/hi/tools/thinking) देखें।
</Note>

## कस्टम Fireworks मॉडल आईडी

OpenClaw रनटाइम पर किसी भी Fireworks मॉडल या राउटर आईडी को स्वीकार करता है। Fireworks द्वारा दिखाई गई सटीक आईडी का उपयोग करें और उसके आगे `fireworks/` लगाएँ। डायनेमिक रिज़ॉल्यूशन Fire Pass टेम्पलेट (टेक्स्ट + इमेज इनपुट, OpenAI-संगत API, डिफ़ॉल्ट लागत शून्य) को क्लोन करता है और जब आईडी Kimi पैटर्न से मेल खाती है, तो चिंतन को स्वचालित रूप से अक्षम कर देता है। GLM डायनेमिक आईडी को केवल-टेक्स्ट के रूप में चिह्नित किया जाता है, जब तक कि आप इमेज इनपुट वाली कोई कस्टम मॉडल प्रविष्टि कॉन्फ़िगर न करें।

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="मॉडल आईडी प्रीफ़िक्सिंग कैसे काम करती है">
    OpenClaw में प्रत्येक Fireworks मॉडल संदर्भ की शुरुआत `fireworks/` से होती है, जिसके बाद Fireworks प्लेटफ़ॉर्म की सटीक आईडी या राउटर पाथ आता है। उदाहरण के लिए:

    - राउटर मॉडल: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - प्रत्यक्ष मॉडल: `fireworks/accounts/fireworks/models/<model-name>`

    API अनुरोध बनाते समय OpenClaw `fireworks/` प्रीफ़िक्स हटा देता है और शेष पाथ को OpenAI-संगत `model` फ़ील्ड के रूप में Fireworks एंडपॉइंट पर भेजता है।

  </Accordion>

  <Accordion title="Kimi के लिए चिंतन बलपूर्वक बंद क्यों किया जाता है">
    Fireworks किसी अलग तर्क चैनल के बिना Kimi उपलब्ध कराता है, इसलिए विचार-श्रृंखला दृश्यमान `content` स्ट्रीम में दिखाई दे सकती है। प्रत्येक Fireworks Kimi अनुरोध पर OpenClaw `thinking: { type: "disabled" }` भेजता है और पेलोड (`extensions/fireworks/stream.ts`) से `reasoning`, `reasoning_effort`, तथा `reasoningEffort` हटा देता है। प्रदाता नीति (`extensions/fireworks/thinking-policy.ts`) Kimi मॉडल आईडी के लिए केवल `off` चिंतन स्तर घोषित करती है, ताकि मैन्युअल `/think` स्विच और प्रदाता-नीति की सतहें रनटाइम अनुबंध के अनुरूप रहें।

    Kimi तर्क का शुरू से अंत तक उपयोग करने के लिए, [Moonshot प्रदाता](/hi/providers/moonshot) कॉन्फ़िगर करें और उसी मॉडल को उसके माध्यम से रूट करें।

  </Accordion>

  <Accordion title="डेमॉन के लिए एनवायरनमेंट उपलब्धता">
    यदि Gateway एक प्रबंधित सेवा (launchd, systemd, Docker) के रूप में चलता है, तो Fireworks कुंजी उस प्रोसेस को दिखाई देनी चाहिए—केवल आपके इंटरैक्टिव शेल को नहीं।

    <Warning>
      केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजी launchd या systemd डेमॉन की सहायता नहीं करेगी, जब तक कि उस एनवायरनमेंट को वहाँ भी इम्पोर्ट न किया जाए। कुंजी को Gateway प्रोसेस से पढ़ने योग्य बनाने के लिए उसे `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

    कॉन्फ़िग लोड करते समय OpenClaw `~/.openclaw/.env` लोड करता है, इसलिए वहाँ संग्रहीत कुंजियाँ प्रत्येक प्लेटफ़ॉर्म पर प्रबंधित Gateway सेवाओं तक पहुँचती हैं। कुंजी रोटेट करने के बाद Gateway को रीस्टार्ट करें (या `openclaw doctor --fix` फिर से चलाएँ)।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="चिंतन मोड" href="/hi/tools/thinking" icon="brain">
    `/think` स्तर, प्रदाता नीतियाँ और तर्क-सक्षम मॉडलों की रूटिंग।
  </Card>
  <Card title="Moonshot" href="/hi/providers/moonshot" icon="moon">
    Moonshot के अपने API के माध्यम से मूल चिंतन आउटपुट के साथ Kimi चलाएँ।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
