---
read_when:
    - आप OpenClaw में ओपन मॉडल मुफ्त में इस्तेमाल करना चाहते हैं
    - आपको NVIDIA_API_KEY सेट अप करना होगा
    - आप NVIDIA के माध्यम से Nemotron 3 Ultra का उपयोग करना चाहते हैं
summary: OpenClaw में NVIDIA की OpenAI-संगत API का उपयोग करें
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:23:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA खुले मॉडलों के लिए `https://integrate.api.nvidia.com/v1` पर मुफ्त
OpenAI-संगत API प्रदान करता है। [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
से API कुंजी लेकर प्रमाणीकरण करें। OpenClaw NVIDIA provider को डिफ़ॉल्ट रूप से
Nemotron 3 Ultra पर सेट करता है, जो लंबे-संदर्भ वाले agentic कार्य के लिए
NVIDIA का 550B कुल / 55B सक्रिय reasoning मॉडल है।

## शुरू करना

<Steps>
  <Step title="अपनी API कुंजी प्राप्त करें">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) पर API कुंजी बनाएं।
  </Step>
  <Step title="कुंजी export करें और onboarding चलाएं">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="NVIDIA मॉडल सेट करें">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
यदि आप env var के बजाय `--nvidia-api-key` पास करते हैं, तो मान shell
history और `ps` output में चला जाता है। संभव होने पर `NVIDIA_API_KEY` environment variable
को प्राथमिकता दें।
</Warning>

non-interactive setup के लिए, आप कुंजी सीधे भी पास कर सकते हैं:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Config उदाहरण

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Featured catalog

जब NVIDIA API कुंजी configured होती है, तो OpenClaw setup और model-selection paths
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` से
NVIDIA के public featured-model catalog को आज़माते हैं और ranked result को
24 घंटे के लिए cache करते हैं। इसलिए build.nvidia.com के नए featured models
OpenClaw release की प्रतीक्षा किए बिना setup और model-selection surfaces में
दिखाई देते हैं। जब live feed उपलब्ध होती है, तो returned पहला मॉडल
NVIDIA setup के दौरान दिखाया जाने वाला default option होता है।

fetch `assets.ngc.nvidia.com` के लिए fixed HTTPS host policy का उपयोग करता है। यदि कोई
NVIDIA API key configured नहीं है, या वह public catalog अनुपलब्ध या
malformed है, तो OpenClaw नीचे दिए bundled catalog और bundled default पर वापस जाता है।

## Nemotron 3 Ultra

Nemotron 3 Ultra OpenClaw में default NVIDIA model है। NVIDIA का build page
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
के लिए इसे 1M-token context specification के साथ उपलब्ध free endpoint के रूप में सूचीबद्ध करता है।
bundled catalog hosted endpoint के लिए NVIDIA के current OpenAI-compatible
sample request से मेल खाने हेतु 16,384-token max output दर्ज करता है।

सबसे अधिक क्षमता वाले NVIDIA default के लिए Ultra का उपयोग करें। जब आप छोटा
Nemotron 3 option चाहते हैं, तब Super selected रखें, या NVIDIA के catalog में hosted
third-party models में से कोई चुनें जब उनका context, latency, या behavior बेहतर fit हो।
bundled Ultra row डिफ़ॉल्ट रूप से `chat_template_kwargs.enable_thinking: false` और
`force_nonempty_content: true` भेजती है, ताकि सामान्य chat output reasoning text
उजागर करने के बजाय visible answer में रहे।

## Bundled fallback catalog

| Model ref                                  | नाम                          | Context   | Max output | Notes                                      |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | Default                                    |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      | Featured fallback                          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | Featured fallback                          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | Featured fallback                          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | Featured fallback                          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | Deprecated, upgrade compatibility          |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | Deprecated, upgrade compatibility          |

## Advanced configuration

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    `NVIDIA_API_KEY` environment variable set होने पर provider auto-enable हो जाता है।
    कुंजी के अलावा कोई explicit provider config आवश्यक नहीं है।
  </Accordion>

  <Accordion title="Catalog and pricing">
    NVIDIA auth configured होने पर OpenClaw NVIDIA के public featured-model catalog को
    प्राथमिकता देता है और उसे 24 घंटे के लिए cache करता है। bundled fallback catalog static है
    और upgrade compatibility के लिए deprecated shipped refs रखता है। Costs source में
    डिफ़ॉल्ट रूप से `0` हैं क्योंकि NVIDIA वर्तमान में listed models के लिए मुफ्त API access प्रदान करता है।
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA standard `/v1` completions endpoint का उपयोग करता है। कोई भी OpenAI-compatible
    tooling NVIDIA base URL के साथ सीधे काम करनी चाहिए।
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    NVIDIA का Ultra sample request reasoning output के लिए `chat_template_kwargs.enable_thinking`
    और `reasoning_budget` का उपयोग करता है। OpenClaw की bundled Ultra row
    सामान्य chat उपयोग के लिए template thinking को डिफ़ॉल्ट रूप से disable करती है। यदि आपको
    NVIDIA reasoning output में opt in करना है या अन्य NVIDIA-specific request
    fields force करने हैं, तो per-model params set करें और provider-specific overrides को
    NVIDIA model तक scoped रखें:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` final OpenAI-compatible request-body override है, इसलिए
    इसका उपयोग केवल उन fields के लिए करें जिन्हें NVIDIA selected endpoint के लिए document करता है।

  </Accordion>

  <Accordion title="Slow custom provider responses">
    कुछ NVIDIA-hosted custom models default model idle watchdog से अधिक समय ले सकते हैं
    इससे पहले कि वे पहला response chunk emit करें। custom NVIDIA provider
    entries के लिए, पूरे agent runtime timeout को बढ़ाने के बजाय provider timeout बढ़ाएं:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA models वर्तमान में उपयोग के लिए मुफ्त हैं। latest availability और
rate-limit details के लिए [build.nvidia.com](https://build.nvidia.com/) देखें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    agents, models, और providers के लिए पूर्ण config reference।
  </Card>
</CardGroup>
