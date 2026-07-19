---
read_when:
    - आप OpenClaw के साथ Cerebras का उपयोग करना चाहते हैं
    - आपको Cerebras API कुंजी के एनवायरनमेंट वेरिएबल या CLI प्रमाणीकरण विकल्प की आवश्यकता है
summary: Cerebras सेटअप (प्रमाणीकरण + मॉडल चयन)
title: Cerebras
x-i18n:
    generated_at: "2026-07-19T09:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 716eef83155ef80d9aa61bd55ed83e3e38ad22720ae055bce7eb9c2cbfb6cf41
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) कस्टम इन्फ़रेंस हार्डवेयर पर उच्च-गति वाला OpenAI-संगत इन्फ़रेंस प्रदान करता है। Plugin में दो मॉडलों का स्थिर कैटलॉग शामिल है (कोई लाइव खोज नहीं)।

| प्रॉपर्टी        | मान                                                     |
| --------------- | --------------------------------------------------------- |
| प्रदाता आईडी     | `cerebras`                                                |
| Plugin          | आधिकारिक बाहरी पैकेज (`@openclaw/cerebras-provider`) |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल    | `CEREBRAS_API_KEY`                                        |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice cerebras-api-key`                          |
| प्रत्यक्ष CLI फ़्लैग | `--cerebras-api-key <key>`                                |
| API             | OpenAI-संगत (`openai-completions`)                  |
| बेस URL        | `https://api.cerebras.ai/v1`                              |
| डिफ़ॉल्ट मॉडल   | `cerebras/zai-glm-4.7`                                    |

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## शुरू करना

<Steps>
  <Step title="API कुंजी प्राप्त करें">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) में एक API कुंजी बनाएँ।
  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    <CodeGroup>

```bash ऑनबोर्डिंग
openclaw onboard --auth-choice cerebras-api-key
```

```bash प्रत्यक्ष फ़्लैग
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash केवल एनवायरनमेंट
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
    ```bash
    openclaw models list --provider cerebras
    ```

    दोनों स्थिर मॉडलों को सूचीबद्ध करता है। यदि `CEREBRAS_API_KEY` का समाधान नहीं होता, तो `openclaw models status --json` अनुपलब्ध क्रेडेंशियल की रिपोर्ट `auth.unusableProfiles` के अंतर्गत करता है।

  </Step>
</Steps>

## गैर-इंटरैक्टिव सेटअप

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## अंतर्निहित कैटलॉग

दोनों मॉडलों में 128k कॉन्टेक्स्ट विंडो और अधिकतम 8,192 आउटपुट टोकन हैं।

| मॉडल संदर्भ               | नाम         | रीजनिंग | टिप्पणियाँ                                  |
| ----------------------- | ------------ | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`  | Z.ai GLM 4.7 | हाँ       | डिफ़ॉल्ट मॉडल; पूर्वावलोकन रीजनिंग मॉडल |
| `cerebras/gpt-oss-120b` | GPT OSS 120B | हाँ       | प्रोडक्शन रीजनिंग मॉडल             |

## मैन्युअल कॉन्फ़िगरेशन

अधिकांश सेटअप में केवल API कुंजी की आवश्यकता होती है। मॉडल मेटाडेटा को ओवरराइड करने या स्थिर कैटलॉग के विरुद्ध `mode: "merge"` में चलाने के लिए स्पष्ट `models.providers.cerebras` कॉन्फ़िगरेशन का उपयोग करें:

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
यदि Gateway डेमन (launchd, systemd, Docker) के रूप में चलता है, तो सुनिश्चित करें कि `CEREBRAS_API_KEY` उस प्रोसेस के लिए उपलब्ध है—उदाहरण के लिए `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से। केवल इंटरैक्टिव शेल में एक्सपोर्ट की गई कुंजी प्रबंधित सेवा के लिए तब तक उपयोगी नहीं होगी, जब तक एनवायरनमेंट को अलग से इंपोर्ट न किया जाए।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="विचार मोड" href="/hi/tools/thinking" icon="brain">
    रीजनिंग में सक्षम दोनों Cerebras मॉडलों के लिए रीजनिंग प्रयास के स्तर।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    एजेंट डिफ़ॉल्ट और मॉडल कॉन्फ़िगरेशन।
  </Card>
  <Card title="मॉडल संबंधी अक्सर पूछे जाने वाले प्रश्न" href="/hi/help/faq-models" icon="circle-question">
    प्रमाणीकरण प्रोफ़ाइल, मॉडल बदलना और "कोई प्रोफ़ाइल नहीं" त्रुटियों का समाधान।
  </Card>
</CardGroup>
