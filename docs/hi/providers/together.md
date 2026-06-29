---
read_when:
    - आप OpenClaw के साथ Together AI का उपयोग करना चाहते हैं
    - आपको API कुंजी वाला env var या CLI प्रमाणीकरण विकल्प चाहिए
summary: Together AI सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Together AI
x-i18n:
    generated_at: "2026-06-29T00:03:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) एकीकृत API के माध्यम से Llama, DeepSeek, Kimi और अन्य प्रमुख ओपन-सोर्स
मॉडल तक पहुंच प्रदान करता है.

| गुण | मान                         |
| -------- | ----------------------------- |
| प्रदाता | `together`                    |
| प्रमाणीकरण     | `TOGETHER_API_KEY`            |
| API      | OpenAI-संगत             |
| आधार URL | `https://api.together.xyz/v1` |

## शुरू करना

<Steps>
  <Step title="Get an API key">
    API कुंजी यहां बनाएं:
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### गैर-इंटरैक्टिव उदाहरण

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
ऑनबोर्डिंग प्रीसेट
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` को डिफ़ॉल्ट मॉडल के रूप में सेट करता है.
</Note>

## अंतर्निहित कैटलॉग

OpenClaw यह बंडल किया गया Together कैटलॉग भेजता है:

| मॉडल संदर्भ                                          | नाम                         | इनपुट       | संदर्भ | नोट्स                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | पाठ        | 131,072 | डिफ़ॉल्ट मॉडल        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | पाठ, छवि | 262,144 | Kimi तर्क मॉडल |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | पाठ        | 512,000 | तर्क पाठ मॉडल |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | पाठ        | 32,768  | तेज़ पाठ मॉडल      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | पाठ        | 202,752 | तर्क पाठ मॉडल |

## वीडियो जनरेशन

बंडल किया गया `together` Plugin साझा `video_generate` टूल के माध्यम से
वीडियो जनरेशन भी रजिस्टर करता है.

| गुण             | मान                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| डिफ़ॉल्ट वीडियो मॉडल  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| मोड                | टेक्स्ट-से-वीडियो; `Wan-AI/Wan2.2-I2V-A14B` के साथ केवल एकल-छवि संदर्भ |
| समर्थित पैरामीटर | `aspectRatio`, `resolution`                                              |

Together को डिफ़ॉल्ट वीडियो प्रदाता के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए
[वीडियो जनरेशन](/hi/tools/video-generation) देखें.
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि
    `TOGETHER_API_KEY` उस प्रक्रिया के लिए उपलब्ध है (उदाहरण के लिए,
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से).

    <Warning>
    केवल आपके इंटरैक्टिव शेल में सेट की गई कुंजियां डेमन-प्रबंधित
    Gateway प्रक्रियाओं को दिखाई नहीं देतीं. स्थायी उपलब्धता के लिए
    `~/.openclaw/.env` या `env.shellEnv` कॉन्फ़िगरेशन का उपयोग करें.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - सत्यापित करें कि आपकी कुंजी काम करती है: `openclaw models list --provider together`
    - यदि मॉडल दिखाई नहीं दे रहे हैं, तो पुष्टि करें कि API कुंजी आपके Gateway
      प्रक्रिया के लिए सही वातावरण में सेट है.
    - मॉडल संदर्भ `together/<model-id>` रूप का उपयोग करते हैं.

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता नियम, मॉडल संदर्भ और फ़ेलओवर व्यवहार.
  </Card>
  <Card title="Video generation" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो जनरेशन टूल पैरामीटर और प्रदाता चयन.
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग्स सहित पूरा कॉन्फ़िगरेशन स्कीमा.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI डैशबोर्ड, API दस्तावेज़ और मूल्य निर्धारण.
  </Card>
</CardGroup>
