---
read_when:
    - आप OpenClaw में Thinking Machines Lab का Inkling चलाना चाहते हैं
    - आप Baseten के होस्ट किए गए मॉडल के लिए एक OpenAI-संगत API चाहते हैं
summary: Inkling और होस्ट किए गए मॉडल API के लिए Baseten सेटअप
title: Baseten
x-i18n:
    generated_at: "2026-07-19T09:41:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5b4a8358141188171cb0b67510ec6bea1bb80dcab9c0c6da9a37aeb97560089
    source_path: providers/baseten.md
    workflow: 16
---

[Baseten Model APIs](https://docs.baseten.co/inference/model-apis/overview) अग्रणी मॉडलों तक होस्टेड, OpenAI-संगत पहुँच प्रदान करते हैं। आधिकारिक बाहरी Plugin प्रमाणित खोज का उपयोग करता है, इसलिए OpenClaw आपके Baseten खाते के लिए सक्षम संपूर्ण मॉडल समूह का अनुसरण करता है। इसके ऑफ़लाइन फ़ॉलबैक में इस OpenClaw रिलीज़ के बनाए जाने के समय उपलब्ध प्रत्येक Model API शामिल है।

| गुण             | मान                                                      |
| --------------- | -------------------------------------------------------- |
| प्रदाता आईडी    | `baseten`                                                |
| Plugin          | आधिकारिक बाहरी पैकेज (`@openclaw/baseten-provider`) |
| प्रमाणीकरण परिवेश चर | `BASETEN_API_KEY`                                        |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice baseten-api-key`                          |
| प्रत्यक्ष CLI फ़्लैग | `--baseten-api-key <key>`                                |
| API             | OpenAI-संगत (`openai-completions`)                 |
| आधार URL        | `https://inference.baseten.co/v1`                        |
| डिफ़ॉल्ट मॉडल   | `baseten/thinkingmachines/inkling`                       |

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/baseten-provider
openclaw gateway restart
```

## आरंभ करना

<Steps>
  <Step title="Baseten खाता और API कुंजी बनाएँ">
    Baseten के Basic प्लान में कोई मासिक प्लेटफ़ॉर्म शुल्क नहीं है; Model API कॉल का मूल्य उपयोग के आधार पर निर्धारित होता है। [Baseten API कुंजी सेटिंग](https://app.baseten.co/settings/api_keys) में एक कुंजी बनाएँ और [मूल्य निर्धारण पृष्ठ](https://www.baseten.co/pricing) पर वर्तमान दरें देखें।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    <CodeGroup>

```bash ऑनबोर्डिंग
openclaw onboard --auth-choice baseten-api-key
```

```bash प्रत्यक्ष फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice baseten-api-key \
  --baseten-api-key "$BASETEN_API_KEY"
```

```bash केवल परिवेश
export BASETEN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="लाइव कैटलॉग सत्यापित करें">
    ```bash
    openclaw models list --provider baseten
    ```

    उपयोग योग्य प्रमाणीकरण होने पर, Plugin `GET /v1/models` का अनुरोध करता है और खाते के लिए लौटाए गए प्रत्येक मॉडल को सूचीबद्ध करता है। प्रमाणीकरण के बिना, यह ऑफ़लाइन रहता है और बंडल किए गए फ़ॉलबैक का उपयोग करता है।

  </Step>
</Steps>

## Inkling

[Thinking Machines Lab का Inkling](https://thinkingmachines.ai/news/introducing-inkling/) डिफ़ॉल्ट मॉडल है। OpenClaw में यह टेक्स्ट और इमेज इनपुट, टूल कॉलिंग, संरचित टूल स्कीमा, कॉन्फ़िगर करने योग्य रीजनिंग प्रयास, 1.048M-टोकन कॉन्टेक्स्ट विंडो और अधिकतम 32k आउटपुट टोकन का समर्थन करता है:

```json5
{
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
}
```

किसी मौजूदा चैट को बदलने के लिए `/model baseten/thinkingmachines/inkling` का उपयोग करें।

## बंडल किया गया फ़ॉलबैक कैटलॉग

प्रमाणित लाइव कैटलॉग प्रामाणिक स्रोत है। खोज सफल होने से पहले ये पंक्तियाँ सेटअप और मॉडल चयन को उपयोगी बनाए रखती हैं:

| मॉडल संदर्भ                                        | इनपुट      | कॉन्टेक्स्ट | अधिकतम आउटपुट |
| -------------------------------------------------- | ----------- | ------: | ---------: |
| `baseten/deepseek-ai/DeepSeek-V4-Pro`              | टेक्स्ट        |    262k |       262k |
| `baseten/zai-org/GLM-4.7`                          | टेक्स्ट        |    200k |       200k |
| `baseten/zai-org/GLM-5`                            | टेक्स्ट        |    202k |       202k |
| `baseten/zai-org/GLM-5.1`                          | टेक्स्ट        |    202k |       202k |
| `baseten/zai-org/GLM-5.2`                          | टेक्स्ट        |    202k |       202k |
| `baseten/thinkingmachines/inkling`                 | टेक्स्ट, इमेज |  1.048M |        32k |
| `baseten/moonshotai/Kimi-K2.5`                     | टेक्स्ट, इमेज |    262k |       262k |
| `baseten/moonshotai/Kimi-K2.6`                     | टेक्स्ट, इमेज |    262k |       262k |
| `baseten/moonshotai/Kimi-K2.7-Code`                | टेक्स्ट, इमेज |    262k |       262k |
| `baseten/nvidia/Nemotron-120B-A12B`                | टेक्स्ट        |    202k |       202k |
| `baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B` | टेक्स्ट        |    202k |       202k |
| `baseten/openai/gpt-oss-120b`                      | टेक्स्ट        |    128k |       128k |

सभी बंडल किए गए मॉडल टूल कॉलिंग और रीजनिंग का समर्थन करते हैं। OpenClaw अपने थिंकिंग स्तरों को मूल `reasoning_effort` वाले मॉडलों से मैप करता है। Baseten के वैकल्पिक GLM, Kimi और Nemotron मॉडल में डिफ़ॉल्ट रूप से थिंकिंग बंद रहती है; अधिकांश में बंद/चालू का द्विआधारी नियंत्रण उपलब्ध है, जबकि GLM 5.2 में बंद, उच्च और अधिकतम विकल्प उपलब्ध हैं। OpenClaw इन विकल्पों को Baseten के `chat_template_args.enable_thinking` नियंत्रण के माध्यम से और GLM 5.2 के लिए सत्यापित शीर्ष-स्तरीय `reasoning_effort` पैरामीटर के माध्यम से भेजता है।

<Note>
Baseten, OpenClaw रिलीज़ से स्वतंत्र रूप से Model APIs जोड़, हटा या बदल सकता है। मॉडल-विशिष्ट OpenClaw ट्रांसपोर्ट नीति को बनाए रखते हुए Plugin प्रमाणित API से मॉडल आईडी, कॉन्टेक्स्ट सीमाएँ, आउटपुट सीमाएँ और इनपुट, कैश किए गए इनपुट तथा आउटपुट का मूल्य निर्धारण रीफ़्रेश करता है।
</Note>

## मैन्युअल कॉन्फ़िगरेशन

अधिकांश सेटअप में केवल API कुंजी की आवश्यकता होती है। प्रदाता को स्पष्ट रूप से निर्धारित करने के लिए:

```json5
{
  env: { BASETEN_API_KEY: "..." },
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      baseten: {
        baseUrl: "https://inference.baseten.co/v1",
        apiKey: "${BASETEN_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "thinkingmachines/inkling",
            name: "Inkling",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048000,
            maxTokens: 32000,
            compat: {
              supportsStore: false,
              supportsDeveloperRole: false,
              supportsUsageInStreaming: true,
              supportsStrictMode: true,
              supportsTools: true,
              supportsReasoningEffort: true,
              supportedReasoningEfforts: ["none", "minimal", "low", "medium", "high", "xhigh"],
              reasoningEffortMap: {
                off: "none",
                none: "none",
                adaptive: "xhigh",
                max: "xhigh",
              },
              maxTokensField: "max_tokens",
            },
          },
        ],
      },
    },
  },
}
```

<Note>
यदि Gateway एक डेमन (launchd, systemd, Docker) के रूप में चलता है, तो सुनिश्चित करें कि `BASETEN_API_KEY` उस प्रक्रिया के लिए उपलब्ध हो। केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजी पहले से चल रही प्रबंधित सेवा को दिखाई नहीं देती।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="थिंकिंग मोड" href="/hi/tools/thinking" icon="brain">
    OpenClaw के रीजनिंग प्रयास स्तर चुनें।
  </Card>
  <Card title="मॉडल CLI" href="/hi/cli/models" icon="terminal">
    खोजे गए मॉडलों को सूचीबद्ध करें, उनका निरीक्षण करें और चुनें।
  </Card>
  <Card title="मॉडल संबंधी सामान्य प्रश्न" href="/hi/help/faq-models" icon="circle-question">
    प्रमाणीकरण प्रोफ़ाइल और मॉडल-चयन की समस्या का निवारण।
  </Card>
</CardGroup>
