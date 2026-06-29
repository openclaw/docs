---
read_when:
    - आप OpenClaw में मुफ्त में ओपन मॉडल इस्तेमाल करना चाहते हैं
    - आपको NVIDIA_API_KEY सेटअप करना होगा
    - आप NVIDIA के माध्यम से Nemotron 3 Ultra का उपयोग करना चाहते हैं
summary: OpenClaw में NVIDIA के OpenAI-संगत API का उपयोग करें
title: NVIDIA
x-i18n:
    generated_at: "2026-06-29T00:00:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA `https://integrate.api.nvidia.com/v1` पर open models के लिए एक OpenAI-संगत API
मुफ्त में प्रदान करता है। [build.nvidia.com](https://build.nvidia.com/settings/api-keys) से मिली API key से प्रमाणीकरण करें। OpenClaw
NVIDIA provider को डिफ़ॉल्ट रूप से Nemotron 3 Ultra पर सेट करता है, जो लंबे-संदर्भ वाले एजेंटिक काम के लिए NVIDIA का 550B कुल / 55B
सक्रिय reasoning model है।

## शुरुआत करना

<Steps>
  <Step title="Get your API key">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) पर एक API key बनाएं।
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
अगर आप env var के बजाय `--nvidia-api-key` पास करते हैं, तो वैल्यू shell
history और `ps` आउटपुट में आ जाती है। संभव होने पर `NVIDIA_API_KEY` environment variable को प्राथमिकता दें।
</Warning>

गैर-इंटरैक्टिव setup के लिए, आप key को सीधे भी पास कर सकते हैं:

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

जब NVIDIA API key configured होती है, तो OpenClaw setup और model-selection paths
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` से NVIDIA के public featured-model catalog को
try करते हैं और ranked result को 24 घंटों के लिए cache करते हैं। इसलिए build.nvidia.com से नए featured models
OpenClaw release की प्रतीक्षा किए बिना setup और model-selection surfaces में दिखाई देते हैं।
जब live feed उपलब्ध होती है, तो लौटाया गया पहला model NVIDIA setup के दौरान दिखाया गया
default option होता है।

Fetch `assets.ngc.nvidia.com` के लिए fixed HTTPS host policy का उपयोग करता है। अगर कोई
NVIDIA API key configured नहीं है, या वह public catalog उपलब्ध नहीं है या
malformed है, तो OpenClaw नीचे दिए गए bundled catalog और bundled default पर fallback करता है।

## Nemotron 3 Ultra

Nemotron 3 Ultra OpenClaw में default NVIDIA model है। [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) के लिए NVIDIA का build page
इसे 1M-token context specification के साथ उपलब्ध मुफ्त endpoint के रूप में सूचीबद्ध करता है।
Bundled catalog hosted endpoint के लिए NVIDIA के मौजूदा
OpenAI-संगत sample request से मेल खाने के लिए 16,384-token max output दर्ज करता है।

सबसे अधिक क्षमता वाले NVIDIA default के लिए Ultra का उपयोग करें। जब आप छोटा Nemotron 3 option
चाहते हों तो Super selected रखें, या NVIDIA के catalog में hosted third-party models में से कोई चुनें
जब उनका context, latency, या behavior बेहतर अनुकूल हो।
Bundled Ultra row डिफ़ॉल्ट रूप से `chat_template_kwargs.enable_thinking: false` और
`force_nonempty_content: true` भेजती है ताकि सामान्य chat output reasoning text दिखाने के बजाय
visible answer में रहे।

## Bundled fallback catalog

| Model ref                                  | नाम                         | Context   | Max output | नोट्स                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | डिफ़ॉल्ट                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | Featured fallback                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | Featured fallback                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | Featured fallback                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | Featured fallback                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | Deprecated, upgrade compatibility |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | Deprecated, upgrade compatibility |

## उन्नत configuration

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    `NVIDIA_API_KEY` environment variable set होने पर provider अपने-आप enable हो जाता है।
    Key के अलावा कोई explicit provider config आवश्यक नहीं है।
  </Accordion>

  <Accordion title="Catalog and pricing">
    NVIDIA auth configured होने पर OpenClaw NVIDIA के public featured-model catalog को प्राथमिकता देता है
    और उसे 24 घंटों के लिए cache करता है। Bundled fallback catalog static है
    और upgrade compatibility के लिए deprecated shipped refs रखता है। Source में costs डिफ़ॉल्ट रूप से
    `0` हैं क्योंकि NVIDIA फिलहाल listed models के लिए मुफ्त API access देता है।
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA standard `/v1` completions endpoint का उपयोग करता है। कोई भी OpenAI-संगत
    tooling NVIDIA base URL के साथ सीधे काम करनी चाहिए।
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    NVIDIA का Ultra sample request reasoning output के लिए `chat_template_kwargs.enable_thinking`
    और `reasoning_budget` का उपयोग करता है। OpenClaw की bundled Ultra row
    सामान्य chat उपयोग के लिए template thinking को डिफ़ॉल्ट रूप से disable करती है। अगर आपको
    NVIDIA reasoning output में opt in करना हो या अन्य NVIDIA-specific request
    fields force करनी हों, तो per-model params set करें और provider-specific overrides को
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

    `params.extra_body` अंतिम OpenAI-संगत request-body override है, इसलिए
    इसे केवल उन fields के लिए उपयोग करें जिन्हें NVIDIA selected endpoint के लिए document करता है।

  </Accordion>

  <Accordion title="Slow custom provider responses">
    कुछ NVIDIA-hosted custom models default model idle watchdog से अधिक समय ले सकते हैं
    इससे पहले कि वे पहला response chunk emit करें। Custom NVIDIA provider
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
NVIDIA models फिलहाल उपयोग के लिए मुफ्त हैं। नवीनतम availability और
rate-limit details के लिए [build.nvidia.com](https://build.nvidia.com/) देखें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    Providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    Agents, models, और providers के लिए पूरा config reference।
  </Card>
</CardGroup>
