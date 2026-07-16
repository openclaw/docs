---
read_when:
    - आप OpenClaw में ओपन मॉडल का मुफ़्त उपयोग करना चाहते हैं
    - आपको NVIDIA_API_KEY सेट अप करना होगा
    - आप NVIDIA के माध्यम से Nemotron 3 Ultra का उपयोग करना चाहते हैं
summary: OpenClaw में NVIDIA के OpenAI-संगत API का उपयोग करें
title: NVIDIA
x-i18n:
    generated_at: "2026-07-16T16:45:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA, OpenAI-संगत API के माध्यम से खुले मॉडल निःशुल्क उपलब्ध कराता है:
`https://integrate.api.nvidia.com/v1`, जिसका प्रमाणीकरण
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) से प्राप्त API कुंजी द्वारा होता है। OpenClaw
लंबे-कॉन्टेक्स्ट वाले एजेंटिक कार्य के लिए NVIDIA प्रदाता को डिफ़ॉल्ट रूप से Nemotron 3 Ultra पर सेट करता है, जो NVIDIA का कुल 550B / सक्रिय 55B
रीज़निंग मॉडल है।

## शुरू करना

<Steps>
  <Step title="अपनी API कुंजी प्राप्त करें">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) पर एक API कुंजी बनाएँ।
  </Step>
  <Step title="कुंजी एक्सपोर्ट करें और ऑनबोर्डिंग चलाएँ">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="एक NVIDIA मॉडल सेट करें">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

गैर-इंटरैक्टिव सेटअप के लिए, कुंजी सीधे पास करें:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` कुंजी को शेल इतिहास और `ps` आउटपुट में दर्ज कर देता है। संभव होने पर
`NVIDIA_API_KEY` पर्यावरण चर को प्राथमिकता दें।
</Warning>

## कॉन्फ़िगरेशन उदाहरण

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

## विशेष रूप से प्रदर्शित कैटलॉग

जब NVIDIA API कुंजी कॉन्फ़िगर की जाती है, तो सेटअप और मॉडल-चयन पथ
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` से
NVIDIA का सार्वजनिक विशेष रूप से प्रदर्शित मॉडल कैटलॉग प्राप्त करते हैं और
परिणाम को 24 घंटे के लिए कैश करते हैं (पहली 32 प्रविष्टियाँ, मुक्त टेक्स्ट-इनपुट
पंक्तियों के रूप में आयातित)। इसलिए build.nvidia.com के नए विशेष रूप से प्रदर्शित मॉडल, OpenClaw रिलीज़ की प्रतीक्षा किए बिना सेटअप और
मॉडल-चयन सतहों में दिखाई देते हैं। जब
लाइव फ़ीड उपलब्ध होती है, तो NVIDIA सेटअप के दौरान सबसे पहले लौटाया गया मॉडल पहले से चयनित विकल्प होता है।

प्राप्ति प्रक्रिया `assets.ngc.nvidia.com` के लिए एक निश्चित HTTPS होस्ट नीति का उपयोग करती है। यदि कोई
NVIDIA API कुंजी कॉन्फ़िगर नहीं है, या फ़ीड अनुपलब्ध अथवा विकृत है,
तो OpenClaw नीचे दिए गए बंडल कैटलॉग और बंडल डिफ़ॉल्ट का उपयोग करता है।

## Nemotron 3 Ultra

Nemotron 3 Ultra, OpenClaw में डिफ़ॉल्ट NVIDIA मॉडल है। NVIDIA का
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
बिल्ड पृष्ठ इसे 1M-टोकन कॉन्टेक्स्ट विनिर्देश वाले उपलब्ध निःशुल्क एंडपॉइंट के रूप में सूचीबद्ध करता है।

बंडल की गई Ultra पंक्ति डिफ़ॉल्ट रूप से
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
भेजती है, ताकि सामान्य चैट आउटपुट रीज़निंग टेक्स्ट को उजागर करने के बजाय दृश्यमान उत्तर में बना रहे।

सर्वोच्च क्षमता वाले NVIDIA डिफ़ॉल्ट के लिए Ultra का उपयोग करें। जब
आप Nemotron 3 का छोटा विकल्प चाहते हों, तो Super को चयनित रखें; या NVIDIA के कैटलॉग में
होस्ट किए गए तृतीय-पक्ष मॉडल में से ऐसा मॉडल चुनें, जिसका कॉन्टेक्स्ट, विलंबता या व्यवहार अधिक उपयुक्त हो।

## बंडल फ़ॉलबैक कैटलॉग

चयन योग्य बंडल पंक्तियाँ NVIDIA के विशेष रूप से प्रदर्शित मॉडल कैटलॉग का स्नैपशॉट हैं। बहिष्कृत
संगतता पंक्तियाँ सटीक संदर्भ द्वारा अभी भी हल की जा सकती हैं, लेकिन मॉडल
चयनकर्ताओं में दिखाई नहीं देतीं।

| मॉडल संदर्भ                                  | नाम                  | कॉन्टेक्स्ट   | अधिकतम आउटपुट |
| ------------------------------------------ | --------------------- | --------- | ---------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192      |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192      |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192      |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192      |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192      |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384     |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384     |

पूर्ण संगतता कैटलॉग मौजूदा कॉन्फ़िगरेशन के लिए ये जारी किए गए संदर्भ भी बनाए रखता है:
`nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5`, और
`nvidia/minimaxai/minimax-m2.7`। ये सटीक संदर्भ द्वारा उपलब्ध रहते हैं, लेकिन
ऑनबोर्डिंग या मॉडल चयनकर्ताओं में कभी दिखाई नहीं देते।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="स्वतः-सक्षम होने का व्यवहार">
    जब `NVIDIA_API_KEY` पर्यावरण चर
    सेट हो या ऑनबोर्डिंग के दौरान कोई कुंजी संग्रहीत की गई हो, तो प्रदाता स्वतः सक्षम हो जाता है। कुंजी के अतिरिक्त किसी स्पष्ट प्रदाता कॉन्फ़िगरेशन की
    आवश्यकता नहीं है।
  </Accordion>

  <Accordion title="कैटलॉग और मूल्य निर्धारण">
    NVIDIA प्रमाणीकरण कॉन्फ़िगर होने पर OpenClaw, NVIDIA के सार्वजनिक विशेष रूप से प्रदर्शित मॉडल कैटलॉग को
    प्राथमिकता देता है और उसे 24 घंटे के लिए कैश करता है। बंडल किया गया चयन योग्य फ़ॉलबैक,
    NVIDIA के विशेष रूप से प्रदर्शित मॉडल कैटलॉग का स्थिर स्नैपशॉट है; बहिष्कृत सटीक-संदर्भ
    संगतता पंक्तियाँ मॉडल चयनकर्ताओं से छिपी रहती हैं। स्रोत में लागत डिफ़ॉल्ट रूप से `0` होती है,
    क्योंकि NVIDIA वर्तमान में सूचीबद्ध मॉडलों के लिए निःशुल्क API पहुँच प्रदान करता है।
  </Accordion>

  <Accordion title="OpenAI-संगत एंडपॉइंट">
    OpenClaw, मानक `/v1` चैट कम्प्लीशन रूट पर
    `openai-completions` अडैप्टर के साथ NVIDIA से संचार करता है। NVIDIA बेस URL के साथ कोई भी OpenAI-संगत टूलिंग
    बिना अतिरिक्त कॉन्फ़िगरेशन के काम करनी चाहिए।
  </Accordion>

  <Accordion title="Nemotron 3 Ultra रीज़निंग पैरामीटर">
    NVIDIA का Ultra नमूना अनुरोध रीज़निंग आउटपुट के लिए `chat_template_kwargs.enable_thinking`
    और `reasoning_budget` का उपयोग करता है। OpenClaw की बंडल Ultra पंक्ति
    सामान्य चैट उपयोग के लिए डिफ़ॉल्ट रूप से टेम्पलेट थिंकिंग को अक्षम करती है। यदि आपको
    NVIDIA रीज़निंग आउटपुट को सक्रिय करना हो या NVIDIA-विशिष्ट अन्य अनुरोध
    फ़ील्ड लागू करने हों, तो प्रति-मॉडल पैरामीटर सेट करें और प्रदाता-विशिष्ट ओवरराइड को
    NVIDIA मॉडल तक सीमित रखें:

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

    `params.chat_template_kwargs`, संपूर्ण ऑब्जेक्ट को बदलने के बजाय अनुरोध पर पहले से मौजूद किसी भी `chat_template_kwargs`
    में मर्ज हो जाता है।
    `params.extra_body` अंतिम OpenAI-संगत अनुरोध-बॉडी ओवरराइड है
    और टकराने वाली पेलोड कुंजियों को अधिलेखित करता है, इसलिए इसका उपयोग केवल उन फ़ील्ड के लिए करें जिन्हें NVIDIA
    चयनित एंडपॉइंट के लिए प्रलेखित करता है।

  </Accordion>

  <Accordion title="धीमी कस्टम प्रदाता प्रतिक्रियाएँ">
    NVIDIA द्वारा होस्ट किए गए कुछ कस्टम मॉडल पहला प्रतिक्रिया खंड भेजने से पहले डिफ़ॉल्ट ~120s
    मॉडल निष्क्रियता वॉचडॉग से अधिक समय ले सकते हैं। कस्टम
    NVIDIA प्रदाता प्रविष्टियों के लिए, पूरे
    एजेंट रनटाइम टाइमआउट के बजाय प्रदाता टाइमआउट बढ़ाएँ; `timeoutSeconds` प्रदाता HTTP अनुरोधों को कवर करता है और
    उस प्रदाता के लिए निष्क्रियता/स्ट्रीम वॉचडॉग की सीमा बढ़ाता है:

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
NVIDIA मॉडल वर्तमान में निःशुल्क उपयोग किए जा सकते हैं। नवीनतम उपलब्धता और
दर-सीमा संबंधी विवरणों के लिए [build.nvidia.com](https://build.nvidia.com/) देखें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    एजेंटों, मॉडलों और प्रदाताओं के लिए पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
