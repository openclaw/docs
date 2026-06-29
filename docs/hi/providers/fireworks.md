---
read_when:
    - आप OpenClaw के साथ Fireworks का उपयोग करना चाहते हैं
    - आपको Fireworks API key env var या default model id की आवश्यकता है
    - आप Fireworks पर Kimi के thinking-off व्यवहार को डिबग कर रहे हैं
summary: Fireworks सेटअप (प्रमाणीकरण + मॉडल चयन)
title: आतिशबाज़ी
x-i18n:
    generated_at: "2026-06-28T23:58:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) OpenAI-संगत API के माध्यम से open-weight और routed मॉडल उपलब्ध कराता है। दो पूर्व-कैटलॉग किए गए Kimi मॉडल और runtime पर किसी भी Fireworks मॉडल या router id का उपयोग करने के लिए आधिकारिक Fireworks provider plugin इंस्टॉल करें।

| गुण             | मान                                                    |
| --------------- | ------------------------------------------------------ |
| Provider id     | `fireworks` (उपनाम: `fireworks-ai`)                    |
| Package         | `@openclaw/fireworks-provider`                         |
| Auth env var    | `FIREWORKS_API_KEY`                                    |
| Onboarding flag | `--auth-choice fireworks-api-key`                      |
| Direct CLI flag | `--fireworks-api-key <key>`                            |
| API             | OpenAI-संगत (`openai-completions`)                     |
| Base URL        | `https://api.fireworks.ai/inference/v1`                |
| डिफ़ॉल्ट मॉडल   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| डिफ़ॉल्ट उपनाम  | `Kimi K2.5 Turbo`                                      |

## शुरुआत करना

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash ऑनबोर्डिंग
openclaw onboard --auth-choice fireworks-api-key
```

```bash सीधा फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash केवल Env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Onboarding आपके auth profiles में `fireworks` provider के लिए key संग्रहीत करता है और **Fire Pass** Kimi K2.5 Turbo router को डिफ़ॉल्ट मॉडल के रूप में सेट करता है।

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    सूची में `Kimi K2.6` और `Kimi K2.5 Turbo (Fire Pass)` शामिल होने चाहिए। यदि `FIREWORKS_API_KEY` हल नहीं होता, तो `openclaw models status --json` अनुपलब्ध credential को `auth.unusableProfiles` के अंतर्गत रिपोर्ट करता है।

  </Step>
</Steps>

## Non-interactive सेटअप

स्क्रिप्टेड या CI इंस्टॉल के लिए, सब कुछ command line पर पास करें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## अंतर्निहित catalog

| Model ref                                              | नाम                         | इनपुट      | Context | अधिकतम आउटपुट | Thinking                    |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | -------------- | --------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | पाठ + छवि | 262,144 | 262,144        | जबरन बंद                    |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | पाठ + छवि | 256,000 | 256,000        | जबरन बंद (डिफ़ॉल्ट)         |

<Note>
  OpenClaw सभी Fireworks Kimi मॉडलों को `thinking: off` पर pin करता है क्योंकि Fireworks production में Kimi thinking parameters को अस्वीकार करता है। उसी मॉडल को सीधे [Moonshot](/hi/providers/moonshot) के माध्यम से route करने पर Kimi reasoning output सुरक्षित रहता है। providers के बीच स्विच करने के लिए [thinking modes](/hi/tools/thinking) देखें।
</Note>

## Custom Fireworks model ids

OpenClaw runtime पर किसी भी Fireworks मॉडल या router id को स्वीकार करता है। Fireworks द्वारा दिखाया गया सटीक id उपयोग करें और उसके आगे `fireworks/` prefix लगाएं। Dynamic resolution Fire Pass template (पाठ + छवि इनपुट, OpenAI-संगत API, डिफ़ॉल्ट cost zero) को clone करता है और जब id Kimi pattern से मेल खाता है, तो thinking को अपने-आप बंद कर देता है। GLM dynamic ids को text-only के रूप में चिह्नित किया जाता है, जब तक आप image input के साथ custom model entry configure नहीं करते।

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
  <Accordion title="How model id prefixing works">
    OpenClaw में हर Fireworks model ref `fireworks/` से शुरू होता है, जिसके बाद Fireworks platform से सटीक id या router path आता है। उदाहरण के लिए:

    - Router model: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direct model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw API request बनाते समय `fireworks/` prefix हटा देता है और शेष path को OpenAI-संगत `model` field के रूप में Fireworks endpoint पर भेजता है।

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    यदि request में `reasoning_*` parameters होते हैं, तो Fireworks K2.6 400 लौटाता है, भले ही Kimi Moonshot की अपनी API के माध्यम से thinking का समर्थन करता हो। provider policy (`extensions/fireworks/thinking-policy.ts`) Kimi model ids के लिए केवल `off` thinking level घोषित करती है, इसलिए manual `/think` switches और provider-policy surfaces runtime contract के साथ संरेखित रहते हैं।

    Kimi reasoning को end-to-end उपयोग करने के लिए, [Moonshot provider](/hi/providers/moonshot) configure करें और उसी मॉडल को उसके माध्यम से route करें।

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    यदि Gateway किसी managed service (launchd, systemd, Docker) के रूप में चलता है, तो Fireworks key उस process को दिखाई देनी चाहिए — केवल आपके interactive shell को नहीं।

    <Warning>
      केवल interactive shell में export की गई key launchd या systemd daemon की मदद नहीं करेगी, जब तक वह environment वहां भी import न किया गया हो। gateway process से पढ़ने योग्य बनाने के लिए key को `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

    macOS पर, `openclaw gateway install` पहले से ही `~/.openclaw/.env` को LaunchAgent environment file में wire करता है। key rotate करने के बाद install फिर से चलाएं (या `openclaw doctor --fix`)।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model providers" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Thinking modes" href="/hi/tools/thinking" icon="brain">
    `/think` levels, provider policies, और reasoning-सक्षम मॉडलों की routing।
  </Card>
  <Card title="Moonshot" href="/hi/providers/moonshot" icon="moon">
    Moonshot की अपनी API के माध्यम से native thinking output के साथ Kimi चलाएं।
  </Card>
  <Card title="Troubleshooting" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य troubleshooting और FAQ।
  </Card>
</CardGroup>
