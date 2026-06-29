---
read_when:
    - आप OpenClaw के साथ Cloudflare AI Gateway का उपयोग करना चाहते हैं
    - आपको खाता ID, Gateway ID, या API कुंजी पर्यावरण चर की आवश्यकता है
summary: Cloudflare AI Gateway सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-06-28T23:57:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway प्रदाता APIs के सामने बैठता है और आपको एनालिटिक्स, कैशिंग और नियंत्रण जोड़ने देता है। Anthropic के लिए, OpenClaw आपके Gateway endpoint के माध्यम से Anthropic Messages API का उपयोग करता है।

| गुण           | मान                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| प्रदाता       | `cloudflare-ai-gateway`                                                                  |
| बेस URL       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| डिफ़ॉल्ट मॉडल | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API कुंजी     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway के माध्यम से अनुरोधों के लिए आपकी प्रदाता API कुंजी) |

<Note>
Cloudflare AI Gateway के माध्यम से रूट किए गए Anthropic मॉडलों के लिए, प्रदाता कुंजी के रूप में अपनी **Anthropic API कुंजी** का उपयोग करें।
</Note>

जब Anthropic Messages मॉडलों के लिए सोच सक्षम होती है, तो OpenClaw Cloudflare AI Gateway के माध्यम से payload भेजने से पहले अंत में आने वाले assistant पूर्व-भरण turns को हटा देता है।
Anthropic विस्तारित सोच के साथ response prefilling को अस्वीकार करता है, जबकि साधारण
बिना-सोच वाला पूर्व-भरण उपलब्ध रहता है।

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः शुरू करें:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## शुरू करना

<Steps>
  <Step title="प्रदाता API कुंजी और Gateway विवरण सेट करें">
    onboarding चलाएँ और Cloudflare AI Gateway auth विकल्प चुनें:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    यह आपके account ID, gateway ID, और API कुंजी के लिए पूछता है।

  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
    मॉडल को अपने OpenClaw config में जोड़ें:

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

स्क्रिप्टेड या CI setups के लिए, command line पर सभी मान पास करें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## उन्नत configuration

<AccordionGroup>
  <Accordion title="प्रमाणित gateways">
    यदि आपने Cloudflare में Gateway authentication सक्षम किया है, तो `cf-aig-authorization` header जोड़ें। यह आपकी प्रदाता API कुंजी के **अतिरिक्त** है।

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
    `cf-aig-authorization` header Cloudflare Gateway के साथ ही authenticate करता है, जबकि प्रदाता API कुंजी (उदाहरण के लिए, आपकी Anthropic कुंजी) upstream प्रदाता के साथ authenticate करती है।
    </Tip>

  </Accordion>

  <Accordion title="Environment नोट">
    यदि Gateway daemon (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `CLOUDFLARE_AI_GATEWAY_API_KEY` उस process के लिए उपलब्ध है।

    <Warning>
    केवल interactive shell में export की गई कुंजी launchd/systemd daemon की मदद नहीं करेगी, जब तक कि वह environment वहाँ भी import न किया गया हो। यह सुनिश्चित करने के लिए कि gateway process इसे पढ़ सके, कुंजी को `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से सेट करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल refs, और failover व्यवहार को चुनना।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और FAQ।
  </Card>
</CardGroup>
