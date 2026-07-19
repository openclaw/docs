---
read_when:
    - आप OpenClaw के साथ Together AI का उपयोग करना चाहते हैं
    - आपको API कुंजी का env var या CLI प्रमाणीकरण विकल्प चाहिए
summary: Together AI सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Together AI
x-i18n:
    generated_at: "2026-07-19T09:50:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b08cae93c1ea7df46e1d2fbe78692f73bb3e56809122f70a56eec8b3dc5d8a4
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) एकीकृत API के माध्यम से Llama, DeepSeek, Kimi और अन्य प्रमुख ओपन-सोर्स
मॉडल तक पहुँच प्रदान करता है।
OpenClaw इसे `together` प्रदाता के रूप में बंडल करता है।

| गुण | मान                         |
| -------- | ----------------------------- |
| प्रदाता | `together`                    |
| प्रमाणीकरण     | `TOGETHER_API_KEY`            |
| API      | OpenAI-संगत             |
| आधार URL | `https://api.together.xyz/v1` |

## आरंभ करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    यहाँ API कुंजी बनाएँ:
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल सेट करें">
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
ऑनबोर्डिंग `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` को
डिफ़ॉल्ट मॉडल के रूप में सेट करती है।
</Note>

## अंतर्निहित कैटलॉग

लागत प्रति दस लाख टोकन USD में है।

| मॉडल संदर्भ                                          | नाम                         | इनपुट       | कॉन्टेक्स्ट | अधिकतम आउटपुट | लागत (इन/आउट) | टिप्पणियाँ               |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | टेक्स्ट        | 131,072 | 8,192      | 0.88 / 0.88   | डिफ़ॉल्ट मॉडल       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | टेक्स्ट, इमेज | 262,144 | 32,768     | 1.20 / 4.50   | रीजनिंग मॉडल     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | टेक्स्ट        | 512,000 | 8,192      | 2.10 / 4.40   | रीजनिंग मॉडल     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | टेक्स्ट        | 32,768  | 8,192      | 0.30 / 0.30   | तेज़, गैर-रीजनिंग |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | टेक्स्ट        | 202,752 | 8,192      | 1.40 / 4.40   | रीजनिंग मॉडल     |

## वीडियो जनरेशन

बंडल किया गया `together` Plugin, साझा
`video_generate` टूल के माध्यम से वीडियो जनरेशन भी पंजीकृत करता है।

| गुण             | मान                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| डिफ़ॉल्ट वीडियो मॉडल  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| अन्य मॉडल         | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/hailuo-02`, `kwaivgI/kling-2.1-master`                 |
| मोड                | टेक्स्ट-से-वीडियो; केवल `Wan-AI/Wan2.2-I2V-A14B` के साथ इमेज-से-वीडियो (एक संदर्भ इमेज) |
| अवधि             | 1-10 सेकंड                                                                              |
| समर्थित पैरामीटर | `size` (`<width>x<height>` के रूप में पार्स किया जाता है); `aspectRatio`/`resolution` पढ़े नहीं जाते            |

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
[वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Tip>

<AccordionGroup>
  <Accordion title="परिवेश संबंधी टिप्पणी">
    यदि Gateway डेमॉन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि
    `TOGETHER_API_KEY` उस प्रक्रिया के लिए उपलब्ध हो (उदाहरण के लिए,
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।

    <Warning>
    केवल आपके इंटरैक्टिव शेल में सेट की गई कुंजियाँ डेमॉन द्वारा प्रबंधित
    Gateway प्रक्रियाओं को दिखाई नहीं देतीं। स्थायी उपलब्धता के लिए
    `~/.openclaw/.env` या `env.shellEnv` कॉन्फ़िगरेशन का उपयोग करें।
    </Warning>

  </Accordion>

  <Accordion title="समस्या निवारण">
    - सत्यापित करें कि आपकी कुंजी काम करती है: `openclaw models list --provider together`
    - यदि मॉडल दिखाई नहीं दे रहे हैं, तो पुष्टि करें कि API कुंजी आपकी Gateway प्रक्रिया के लिए सही
      परिवेश में सेट है।
    - मॉडल संदर्भों का प्रारूप `together/<model-id>` होता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता नियम, मॉडल संदर्भ और फ़ेलओवर व्यवहार।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो जनरेशन टूल के पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाता सेटिंग सहित संपूर्ण कॉन्फ़िगरेशन स्कीमा।
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI डैशबोर्ड, API दस्तावेज़ और मूल्य निर्धारण।
  </Card>
</CardGroup>
