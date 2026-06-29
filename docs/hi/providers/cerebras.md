---
read_when:
    - आप OpenClaw के साथ Cerebras का उपयोग करना चाहते हैं
    - आपको Cerebras API कुंजी env var या CLI प्रमाणीकरण विकल्प चाहिए
summary: Cerebras सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Cerebras
x-i18n:
    generated_at: "2026-06-28T23:56:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) कस्टम इन्फ़रेंस हार्डवेयर पर उच्च-गति OpenAI-संगत इन्फ़रेंस प्रदान करता है। Cerebras प्रदाता Plugin में चार मॉडलों की स्थिर कैटलॉग शामिल है।

| गुण             | मान                                      |
| --------------- | ---------------------------------------- |
| प्रदाता id      | `cerebras`                               |
| Plugin          | आधिकारिक बाहरी पैकेज                    |
| Auth env var    | `CEREBRAS_API_KEY`                       |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice cerebras-api-key`         |
| प्रत्यक्ष CLI फ़्लैग | `--cerebras-api-key <key>`               |
| API             | OpenAI-संगत (`openai-completions`)       |
| बेस URL         | `https://api.cerebras.ai/v1`             |
| डिफ़ॉल्ट मॉडल   | `cerebras/zai-glm-4.7`                   |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## शुरुआत करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) में API कुंजी बनाएं।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएं">
    <CodeGroup>

```bash ऑनबोर्डिंग
openclaw onboard --auth-choice cerebras-api-key
```

```bash प्रत्यक्ष फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash केवल Env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
    ```bash
    openclaw models list --provider cerebras
    ```

    सूची में सभी चार स्थिर मॉडल शामिल होने चाहिए। यदि `CEREBRAS_API_KEY` हल नहीं होता है, तो `openclaw models status --json` अनुपस्थित क्रेडेंशियल को `auth.unusableProfiles` के अंतर्गत रिपोर्ट करता है।

  </Step>
</Steps>

## नॉन-इंटरैक्टिव सेटअप

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## बिल्ट-इन कैटलॉग

OpenClaw एक स्थिर Cerebras कैटलॉग शिप करता है जो सार्वजनिक OpenAI-संगत एंडपॉइंट को मिरर करती है। सभी चार मॉडल 128k संदर्भ और 8,192 अधिकतम-आउटपुट टोकन साझा करते हैं।

| मॉडल ref                                  | नाम                  | रीजनिंग | नोट्स                                  |
| ----------------------------------------- | -------------------- | ------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | हाँ     | डिफ़ॉल्ट मॉडल; प्रीव्यू रीजनिंग मॉडल |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | हाँ     | प्रोडक्शन रीजनिंग मॉडल                |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | नहीं    | प्रीव्यू नॉन-रीजनिंग मॉडल            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | नहीं    | प्रोडक्शन गति-केंद्रित मॉडल          |

<Warning>
  Cerebras `zai-glm-4.7` और `qwen-3-235b-a22b-instruct-2507` को प्रीव्यू मॉडल के रूप में चिह्नित करता है, और `llama3.1-8b` के साथ `qwen-3-235b-a22b-instruct-2507` को 27 मई 2026 को डिप्रिकेशन के लिए दस्तावेज़ित किया गया है। प्रोडक्शन वर्कलोड के लिए इन पर निर्भर होने से पहले Cerebras का समर्थित-मॉडल पेज देखें।
</Warning>

## मैनुअल कॉन्फ़िगरेशन

Plugin का सामान्यतः अर्थ है कि आपको केवल API कुंजी चाहिए। जब आप मॉडल मेटाडेटा ओवरराइड करना चाहते हैं या स्थिर कैटलॉग के विरुद्ध `mode: "merge"` में चलाना चाहते हैं, तो स्पष्ट `models.providers.cerebras` कॉन्फ़िगरेशन का उपयोग करें:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
  यदि Gateway एक daemon के रूप में चलता है (launchd, systemd, Docker), तो सुनिश्चित करें कि `CEREBRAS_API_KEY` उस प्रक्रिया के लिए उपलब्ध है — उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से। केवल इंटरैक्टिव shell में निर्यात की गई कुंजी किसी managed service की मदद नहीं करेगी, जब तक env को अलग से import न किया जाए।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल refs, और failover व्यवहार का चयन।
  </Card>
  <Card title="सोचने के मोड" href="/hi/tools/thinking" icon="brain">
    दो रीजनिंग-सक्षम Cerebras मॉडलों के लिए रीजनिंग प्रयास स्तर।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    Agent डिफ़ॉल्ट और मॉडल कॉन्फ़िगरेशन।
  </Card>
  <Card title="मॉडल FAQ" href="/hi/help/faq-models" icon="circle-question">
    Auth profiles, मॉडल बदलना, और "no profile" त्रुटियों को हल करना।
  </Card>
</CardGroup>
