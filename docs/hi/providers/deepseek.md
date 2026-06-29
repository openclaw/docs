---
read_when:
    - आप OpenClaw के साथ DeepSeek का उपयोग करना चाहते हैं
    - आपको API कुंजी पर्यावरण चर या CLI प्रमाणीकरण विकल्प चाहिए
summary: DeepSeek सेटअप (प्रमाणीकरण + मॉडल चयन)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-28T23:57:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) OpenAI-संगत API के साथ शक्तिशाली AI मॉडल प्रदान करता है।

| गुण | मान                       |
| -------- | -------------------------- |
| प्रदाता | `deepseek`                 |
| प्रमाणीकरण | `DEEPSEEK_API_KEY`         |
| API      | OpenAI-संगत          |
| बेस URL | `https://api.deepseek.com` |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## शुरुआत करना

<Steps>
  <Step title="Get your API key">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) पर API कुंजी बनाएं।
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    यह आपकी API कुंजी मांगेगा और `deepseek/deepseek-v4-flash` को डिफ़ॉल्ट मॉडल के रूप में सेट करेगा।

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    चल रहे Gateway की आवश्यकता के बिना Plugin के स्थिर कैटलॉग का निरीक्षण करने के लिए,
    इसका उपयोग करें:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
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
अगर Gateway daemon (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `DEEPSEEK_API_KEY`
उस प्रक्रिया के लिए उपलब्ध है (उदाहरण के लिए, `~/.openclaw/.env` में या
`env.shellEnv` के ज़रिए)।
</Warning>

## अंतर्निहित कैटलॉग

| मॉडल रेफ़                    | नाम              | इनपुट | Context   | अधिकतम आउटपुट | नोट्स                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | पाठ  | 1,000,000 | 384,000    | डिफ़ॉल्ट मॉडल; V4 thinking-सक्षम सतह |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | पाठ  | 1,000,000 | 384,000    | V4 thinking-सक्षम सतह                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | पाठ  | 131,072   | 8,192      | DeepSeek V3.2 non-thinking सतह         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | पाठ  | 131,072   | 65,536     | Reasoning-सक्षम V3.2 सतह             |

<Tip>
V4 मॉडल DeepSeek के `thinking` नियंत्रण का समर्थन करते हैं। OpenClaw फ़ॉलो-अप टर्न पर
DeepSeek `reasoning_content` को भी फिर से चलाता है, ताकि tool
कॉल वाले thinking सेशन जारी रह सकें।
DeepSeek V4 मॉडल के साथ `/think xhigh` या `/think max` का उपयोग करके DeepSeek का
अधिकतम `reasoning_effort` अनुरोध करें।
</Tip>

## Thinking और tools

DeepSeek V4 thinking सेशन का replay contract अधिकांश
OpenAI-संगत प्रदाताओं की तुलना में अधिक सख्त है: thinking-सक्षम टर्न द्वारा tools का उपयोग करने के बाद, DeepSeek
अपेक्षा करता है कि उस टर्न से फिर से चलाए गए assistant संदेशों में
फ़ॉलो-अप अनुरोधों पर `reasoning_content` शामिल हो। OpenClaw इसे
DeepSeek Plugin के भीतर संभालता है, इसलिए सामान्य multi-turn tool उपयोग
`deepseek/deepseek-v4-flash` और `deepseek/deepseek-v4-pro` के साथ काम करता है।

यदि आप किसी मौजूदा सेशन को किसी अन्य OpenAI-संगत प्रदाता से
DeepSeek V4 मॉडल पर स्विच करते हैं, तो पुराने assistant tool-call टर्न में मूल
DeepSeek `reasoning_content` नहीं हो सकता। OpenClaw DeepSeek V4 thinking अनुरोधों के लिए फिर से चलाए गए
assistant संदेशों में उस अनुपलब्ध फ़ील्ड को भरता है, ताकि प्रदाता
`/new` की आवश्यकता के बिना इतिहास स्वीकार कर सके।

जब OpenClaw में thinking अक्षम होती है (UI **कोई नहीं** चयन सहित),
OpenClaw DeepSeek को `thinking: { type: "disabled" }` भेजता है और outgoing history से फिर से चलाए गए
`reasoning_content` को हटा देता है। इससे disabled-thinking
सेशन non-thinking DeepSeek पथ पर बने रहते हैं।

डिफ़ॉल्ट तेज़ पथ के लिए `deepseek/deepseek-v4-flash` का उपयोग करें। जब आपको अधिक शक्तिशाली V4 मॉडल चाहिए और आप
अधिक लागत या latency स्वीकार कर सकते हैं, तो
`deepseek/deepseek-v4-pro` का उपयोग करें।

## लाइव परीक्षण

प्रत्यक्ष लाइव मॉडल suite में आधुनिक मॉडल सेट में DeepSeek V4 शामिल है। केवल
DeepSeek V4 direct-model checks चलाने के लिए:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

वह लाइव जांच सत्यापित करती है कि दोनों V4 मॉडल complete कर सकते हैं और thinking/tool
फ़ॉलो-अप टर्न उस replay payload को संरक्षित रखते हैं जिसकी DeepSeek को आवश्यकता होती है।

## Config उदाहरण

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
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल रेफ़ और failover व्यवहार चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    agents, models और providers के लिए पूरा config संदर्भ।
  </Card>
</CardGroup>
