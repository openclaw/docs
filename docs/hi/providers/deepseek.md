---
read_when:
    - आप OpenClaw के साथ DeepSeek का उपयोग करना चाहते हैं
    - आपको API कुंजी का एनवायरनमेंट वेरिएबल या CLI प्रमाणीकरण विकल्प चाहिए
summary: DeepSeek सेटअप (प्रमाणीकरण + मॉडल चयन)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-19T09:46:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) OpenAI-संगत API के साथ शक्तिशाली AI मॉडल प्रदान करता है।

| प्रॉपर्टी | मान                      |
| -------- | -------------------------- |
| प्रदाता | `deepseek`                 |
| प्रमाणीकरण     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI-संगत          |
| बेस URL | `https://api.deepseek.com` |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## आरंभ करना

<Steps>
  <Step title="अपनी API कुंजी प्राप्त करें">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) पर एक API कुंजी बनाएँ।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    यह आपकी API कुंजी माँगता है और `deepseek/deepseek-v4-flash` को डिफ़ॉल्ट मॉडल के रूप में सेट करता है।

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
    ```bash
    openclaw models list --provider deepseek
    ```

    चलते हुए Gateway के बिना Plugin के स्थिर कैटलॉग का निरीक्षण करने के लिए:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="गैर-इंटरैक्टिव सेटअप">
    स्क्रिप्टेड या हेडलेस इंस्टॉलेशन के लिए, सभी फ़्लैग सीधे पास करें:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि
`DEEPSEEK_API_KEY` उस प्रक्रिया के लिए उपलब्ध हो (उदाहरण के लिए,
`~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।
</Warning>

## अंतर्निहित कैटलॉग

| मॉडल संदर्भ                    | नाम              | इनपुट | कॉन्टेक्स्ट   | अधिकतम आउटपुट | टिप्पणियाँ                                               |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | टेक्स्ट  | 1,000,000 | 384,000    | डिफ़ॉल्ट मॉडल; V4 सोचने में सक्षम इंटरफ़ेस          |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | टेक्स्ट  | 1,000,000 | 384,000    | V4 सोचने में सक्षम इंटरफ़ेस                         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | टेक्स्ट  | 1,000,000 | 384,000    | अप्रचलित V4 Flash गैर-विचारशील संगतता नाम |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | टेक्स्ट  | 1,000,000 | 384,000    | अप्रचलित V4 Flash विचारशील संगतता नाम     |

<Warning>
DeepSeek, `deepseek-chat` और `deepseek-reasoner` को 24 जुलाई 2026 को
15:59 UTC पर बंद कर देगा। वर्तमान में ये क्रमशः गैर-विचारशील और
विचारशील मोड में DeepSeek V4 Flash पर रूट होते हैं। समय-सीमा से पहले कॉन्फ़िगर किए गए मॉडल संदर्भों को
`deepseek/deepseek-v4-flash` या `deepseek/deepseek-v4-pro` पर ले जाएँ।
</Warning>

OpenClaw के स्थानीय लागत अनुमान DeepSeek द्वारा प्रकाशित कैश-हिट,
कैश-मिस और आउटपुट दरों का अनुसरण करते हैं। DeepSeek इन दरों को बदल सकता है; बिलिंग के लिए उसका
[मॉडल और मूल्य निर्धारण](https://api-docs.deepseek.com/quick_start/pricing/) पृष्ठ
प्रामाणिक स्रोत है।

<Tip>
V4 मॉडल DeepSeek के `thinking` नियंत्रण का समर्थन करते हैं। OpenClaw फ़ॉलो-अप टर्न पर
DeepSeek `reasoning_content` को भी दोबारा भेजता है, ताकि टूल
कॉल वाले विचारशील सत्र जारी रह सकें।
DeepSeek V4 मॉडल के साथ `/think xhigh` या `/think max` का उपयोग करके DeepSeek का
अधिकतम `reasoning_effort` अनुरोध करें; दोनों `"max"` पर मैप होते हैं।
</Tip>

## विचार और टूल

DeepSeek V4 के विचारशील सत्रों के लिए, विचार-सक्षम टर्न से दोबारा भेजे गए सहायक संदेशों में
फ़ॉलो-अप अनुरोधों पर `reasoning_content` शामिल होना आवश्यक है।
OpenClaw का DeepSeek Plugin उस फ़ील्ड को स्वचालित रूप से भरता है, इसलिए
`deepseek/deepseek-v4-flash` और `deepseek/deepseek-v4-pro` पर सामान्य
मल्टी-टर्न टूल उपयोग काम करता है, भले ही इतिहास किसी अन्य
OpenAI-संगत प्रदाता (कोई मूल `reasoning_content` नहीं) या किसी साधारण
सहायक संदेश से आया हो। सत्र के बीच प्रदाता बदलने के बाद `/new` आवश्यक नहीं है।

जब विचार करना अक्षम होता है (UI के **None** चयन सहित), OpenClaw
`thinking: { type: "disabled" }` भेजता है और आउटगोइंग इतिहास से दोबारा भेजे गए `reasoning_content`
हटा देता है, जिससे सत्र गैर-विचारशील DeepSeek पथ पर बना रहता है।

डिफ़ॉल्ट तेज़ पथ के लिए `deepseek/deepseek-v4-flash` का उपयोग करें। जब अधिक
लागत या विलंब स्वीकार्य हो, तब अधिक शक्तिशाली मॉडल के लिए
`deepseek/deepseek-v4-pro` का उपयोग करें।

## लाइव परीक्षण

आधुनिक मॉडल लाइव सुइट से केवल DeepSeek V4 के प्रत्यक्ष-मॉडल परीक्षण चलाने के लिए:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

यह सत्यापित करता है कि दोनों V4 मॉडल पूर्ण होते हैं और विचार/टूल के फ़ॉलो-अप टर्न
DeepSeek के लिए आवश्यक रीप्ले पेलोड को बनाए रखते हैं।

## कॉन्फ़िगरेशन उदाहरण

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    एजेंट, मॉडल और प्रदाताओं के लिए पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
</CardGroup>
