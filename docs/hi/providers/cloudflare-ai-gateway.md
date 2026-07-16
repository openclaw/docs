---
read_when:
    - आप OpenClaw के साथ Cloudflare AI Gateway का उपयोग करना चाहते हैं
    - आपको खाता ID, Gateway ID या API कुंजी के पर्यावरण चर की आवश्यकता है
summary: Cloudflare AI Gateway सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-07-16T16:38:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) प्रदाता API के आगे स्थित होता है और विश्लेषिकी, कैशिंग तथा नियंत्रण जोड़ता है। Anthropic के लिए, OpenClaw आपके Gateway एंडपॉइंट के माध्यम से Anthropic Messages API का उपयोग करता है।

| गुण           | मान                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| प्रदाता       | `cloudflare-ai-gateway`                                                                  |
| Plugin        | आधिकारिक बाहरी पैकेज (`@openclaw/cloudflare-ai-gateway-provider`)                   |
| आधार URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| डिफ़ॉल्ट मॉडल | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API कुंजी     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway के माध्यम से अनुरोधों के लिए आपकी प्रदाता API कुंजी) |

<Note>
Cloudflare AI Gateway के माध्यम से रूट किए गए Anthropic मॉडल के लिए, प्रदाता कुंजी के रूप में अपनी **Anthropic API कुंजी** का उपयोग करें।
</Note>

Anthropic Messages मॉडल के लिए थिंकिंग सक्षम होने पर, OpenClaw पेलोड को Cloudflare AI Gateway के माध्यम से भेजने से पहले अंत में आने वाले
असिस्टेंट प्रीफ़िल टर्न हटा देता है।
Anthropic विस्तारित थिंकिंग के साथ प्रतिक्रिया प्रीफ़िलिंग को अस्वीकार करता है, जबकि सामान्य
गैर-थिंकिंग प्रीफ़िल उपलब्ध रहता है।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway को पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## आरंभ करना

<Steps>
  <Step title="प्रदाता API कुंजी और Gateway विवरण सेट करें">
    ऑनबोर्डिंग चलाएँ और Cloudflare AI Gateway प्रमाणीकरण विकल्प चुनें:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    यह आपके खाता ID, Gateway ID और API कुंजी के लिए संकेत देता है।

  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
    मॉडल को अपने OpenClaw कॉन्फ़िगरेशन में जोड़ें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## गैर-इंटरैक्टिव उदाहरण

स्क्रिप्टेड या CI सेटअप के लिए, सभी मान कमांड लाइन पर दें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="प्रमाणीकृत Gateway">
    यदि आपने Cloudflare में Gateway प्रमाणीकरण सक्षम किया है, तो `cf-aig-authorization` हेडर जोड़ें। यह आपकी प्रदाता API कुंजी के **अतिरिक्त** है।

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` हेडर स्वयं Cloudflare Gateway के साथ प्रमाणीकरण करता है, जबकि प्रदाता API कुंजी (उदाहरण के लिए, आपकी Anthropic कुंजी) अपस्ट्रीम प्रदाता के साथ प्रमाणीकरण करती है।
    </Tip>

  </Accordion>

  <Accordion title="परिवेश संबंधी टिप्पणी">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `CLOUDFLARE_AI_GATEWAY_API_KEY` उस प्रक्रिया के लिए उपलब्ध हो।

    <Warning>
    केवल इंटरैक्टिव शेल में निर्यात की गई कुंजी launchd/systemd डेमन के लिए तब तक उपयोगी नहीं होगी, जब तक उस परिवेश को वहाँ भी आयात न किया जाए। यह सुनिश्चित करने के लिए कि Gateway प्रक्रिया कुंजी पढ़ सके, कुंजी को `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
