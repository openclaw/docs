---
read_when:
    - आप OpenClaw के साथ Vercel AI Gateway का उपयोग करना चाहते हैं
    - आपको API कुंजी का env var या CLI प्रमाणीकरण विकल्प चाहिए
summary: Vercel AI Gateway सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-07-19T09:47:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) एकल एंडपॉइंट के माध्यम से
सैकड़ों मॉडल तक पहुँचने के लिए एक एकीकृत API प्रदान करता है।

| प्रॉपर्टी      | मान                                  |
| ------------- | -------------------------------------- |
| प्रदाता      | `vercel-ai-gateway`                    |
| पैकेज       | `@openclaw/vercel-ai-gateway-provider` |
| प्रमाणीकरण          | `AI_GATEWAY_API_KEY`                   |
| API           | Anthropic Messages के संगत          |
| बेस URL      | `https://ai-gateway.vercel.sh`         |
| मॉडल कैटलॉग | `/v1/models` के माध्यम से स्वतः खोजा गया       |

<Tip>
OpenClaw, Gateway के `/v1/models` कैटलॉग को स्वतः खोजता है, इसलिए
`/models vercel-ai-gateway` चैट कमांड और
`openclaw models list --provider vercel-ai-gateway` दोनों में `vercel-ai-gateway/openai/gpt-5.5` तथा
`vercel-ai-gateway/moonshotai/kimi-k2.6` जैसे मौजूदा मॉडल
रेफ़ शामिल होते हैं।
</Tip>

## शुरुआत करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="API कुंजी सेट करें">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
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
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## गैर-इंटरैक्टिव उदाहरण

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## मॉडल ID का संक्षिप्त रूप

OpenClaw रनटाइम पर Claude के संक्षिप्त मॉडल रेफ़ को सामान्यीकृत करता है:

| संक्षिप्त इनपुट                     | सामान्यीकृत मॉडल रेफ़                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
अपने कॉन्फ़िगरेशन में किसी भी रूप का उपयोग करें; OpenClaw प्रामाणिक
`anthropic/...` रेफ़ को स्वचालित रूप से रिज़ॉल्व करता है।
</Tip>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="डेमन प्रक्रियाओं के लिए एनवायरनमेंट वेरिएबल">
    यदि OpenClaw Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि
    `AI_GATEWAY_API_KEY` उस प्रक्रिया के लिए उपलब्ध हो।

    <Warning>
    केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजी किसी launchd/systemd डेमन को तब तक दिखाई नहीं देगी,
    जब तक उस एनवायरनमेंट को स्पष्ट रूप से इंपोर्ट न किया जाए। यह सुनिश्चित करने के लिए कि Gateway
    प्रक्रिया कुंजी पढ़ सके, कुंजी को `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

  </Accordion>

  <Accordion title="प्रदाता रूटिंग">
    Vercel AI Gateway प्रत्येक अनुरोध को मॉडल रेफ़ प्रीफ़िक्स में नामित अपस्ट्रीम प्रदाता तक
    रूट करता है। उदाहरण के लिए, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    Anthropic के माध्यम से रूट होता है, `vercel-ai-gateway/openai/gpt-5.5` OpenAI के माध्यम से
    रूट होता है और `vercel-ai-gateway/moonshotai/kimi-k2.6` MoonshotAI के माध्यम से
    रूट होता है। एक `AI_GATEWAY_API_KEY` सभी अपस्ट्रीम प्रदाताओं को प्रमाणित करता है।
  </Accordion>
  <Accordion title="चिंतन स्तर">
    जब OpenClaw अपस्ट्रीम मॉडल प्रीफ़िक्स को पहचानता है, तो `/think` विकल्प
    उसका अनुसरण करते हैं। `vercel-ai-gateway/anthropic/...`, Claude चिंतन प्रोफ़ाइल का उपयोग करता है,
    जिसमें Claude 4.6 मॉडल के लिए अनुकूली डिफ़ॉल्ट शामिल है। विश्वसनीय
    `vercel-ai-gateway/openai/...` रेफ़ (`gpt-5.2` और नए, साथ ही
    `gpt-5.1-codex` तक के Codex वेरिएंट) `/think xhigh` उपलब्ध कराते हैं। अन्य नेमस्पेस वाले
    रेफ़ मानक रीजनिंग स्तर बनाए रखते हैं, जब तक उनका कैटलॉग मेटाडेटा अधिक स्तर
    घोषित न करे।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़ और फ़ेलओवर व्यवहार का चयन करना।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
