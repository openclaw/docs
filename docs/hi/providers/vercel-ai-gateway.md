---
read_when:
    - आप OpenClaw के साथ Vercel AI Gateway का उपयोग करना चाहते हैं
    - आपको API कुंजी env var या CLI auth विकल्प चाहिए
summary: Vercel AI Gateway सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-06-29T00:03:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) एक एकीकृत API प्रदान करता है, जिससे
एक ही endpoint के माध्यम से सैकड़ों models तक पहुंचा जा सकता है।

| गुण          | मान                                    |
| ------------- | -------------------------------------- |
| Provider      | `vercel-ai-gateway`                    |
| Package       | `@openclaw/vercel-ai-gateway-provider` |
| Auth          | `AI_GATEWAY_API_KEY`                   |
| API           | Anthropic Messages संगत                |
| Model catalog | `/v1/models` के माध्यम से स्वतः खोजा गया |

<Tip>
OpenClaw Gateway `/v1/models` catalog को स्वतः खोजता है, इसलिए
`/models vercel-ai-gateway` में मौजूदा model refs शामिल होते हैं, जैसे
`vercel-ai-gateway/openai/gpt-5.5` और
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## शुरू करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API key सेट करें">
    onboarding चलाएं और AI Gateway auth विकल्प चुनें:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="डिफ़ॉल्ट model सेट करें">
    model को अपने OpenClaw config में जोड़ें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="सत्यापित करें कि model उपलब्ध है">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Non-interactive उदाहरण

स्क्रिप्टेड या CI सेटअप के लिए, सभी मान command line पर पास करें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Model ID shorthand

OpenClaw Vercel Claude shorthand model refs स्वीकार करता है और उन्हें
runtime पर normalize करता है:

| Shorthand input                     | Normalized model ref                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
आप अपने configuration में shorthand या fully qualified model ref, दोनों में से
किसी का भी उपयोग कर सकते हैं। OpenClaw canonical form को अपने-आप resolve करता है।
</Tip>

## उन्नत configuration

<AccordionGroup>
  <Accordion title="daemon प्रक्रियाओं के लिए environment variable">
    यदि OpenClaw Gateway daemon (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि
    `AI_GATEWAY_API_KEY` उस process के लिए उपलब्ध है।

    <Warning>
    केवल interactive shell में export की गई key किसी launchd/systemd daemon को तब तक
    दिखाई नहीं देगी जब तक उस environment को स्पष्ट रूप से import न किया जाए। Key को
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें, ताकि gateway
    process उसे पढ़ सके।
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    Vercel AI Gateway model ref prefix के आधार पर requests को upstream provider तक
    route करता है। उदाहरण के लिए, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    Anthropic के माध्यम से route होता है, जबकि `vercel-ai-gateway/openai/gpt-5.5`
    OpenAI के माध्यम से route होता है और `vercel-ai-gateway/moonshotai/kimi-k2.6`
    MoonshotAI के माध्यम से route होता है। आपकी एकल `AI_GATEWAY_API_KEY` सभी
    upstream providers के लिए authentication संभालती है।
  </Accordion>
  <Accordion title="Thinking levels">
    जब OpenClaw upstream provider contract जानता है, तो `/think` विकल्प भरोसेमंद
    upstream model prefixes का पालन करते हैं। `vercel-ai-gateway/anthropic/...`
    Claude thinking profile का उपयोग करता है, जिसमें Claude 4.6 models के लिए
    adaptive defaults शामिल हैं। `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5`,
    और Codex-style refs सीधे OpenAI/OpenAI Codex providers की तरह `/think xhigh`
    उपलब्ध कराते हैं। अन्य namespaced refs सामान्य reasoning levels बनाए रखते हैं,
    जब तक कि उनका catalog metadata अधिक घोषित न करे।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model चयन" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Troubleshooting" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य troubleshooting और FAQ।
  </Card>
</CardGroup>
