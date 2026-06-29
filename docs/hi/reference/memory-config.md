---
read_when:
    - आप मेमोरी खोज प्रदाताओं या एम्बेडिंग मॉडल को कॉन्फ़िगर करना चाहते हैं
    - आप QMD बैकएंड सेट अप करना चाहते हैं
    - आप हाइब्रिड खोज, MMR, या समय-आधारित क्षय को ट्यून करना चाहते हैं
    - आप मल्टीमॉडल मेमोरी इंडेक्सिंग सक्षम करना चाहते हैं
sidebarTitle: Memory config
summary: मेमोरी खोज, एम्बेडिंग प्रदाताओं, QMD, हाइब्रिड खोज और मल्टीमॉडल इंडेक्सिंग के लिए सभी कॉन्फ़िगरेशन विकल्प
title: मेमोरी कॉन्फ़िगरेशन संदर्भ
x-i18n:
    generated_at: "2026-06-29T00:07:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

यह पेज OpenClaw मेमोरी खोज के हर कॉन्फ़िगरेशन नॉब को सूचीबद्ध करता है। वैचारिक अवलोकनों के लिए, देखें:

<CardGroup cols={2}>
  <Card title="मेमोरी अवलोकन" href="/hi/concepts/memory">
    मेमोरी कैसे काम करती है।
  </Card>
  <Card title="अंतर्निर्मित इंजन" href="/hi/concepts/memory-builtin">
    डिफ़ॉल्ट SQLite बैकएंड।
  </Card>
  <Card title="QMD इंजन" href="/hi/concepts/memory-qmd">
    लोकल-फ़र्स्ट साइडकार।
  </Card>
  <Card title="मेमोरी खोज" href="/hi/concepts/memory-search">
    खोज पाइपलाइन और ट्यूनिंग।
  </Card>
  <Card title="Active Memory" href="/hi/concepts/active-memory">
    इंटरैक्टिव सत्रों के लिए मेमोरी सब-एजेंट।
  </Card>
</CardGroup>

जब तक अन्यथा उल्लेख न हो, सभी मेमोरी खोज सेटिंग्स `openclaw.json` में `agents.defaults.memorySearch` के अंतर्गत रहती हैं।

<Note>
यदि आप **Active Memory** फ़ीचर टॉगल और सब-एजेंट कॉन्फ़िगरेशन खोज रहे हैं, तो वह `memorySearch` के बजाय `plugins.entries.active-memory` के अंतर्गत रहता है।

Active Memory दो-गेट मॉडल का उपयोग करती है:

1. Plugin सक्षम होना चाहिए और वर्तमान एजेंट id को लक्षित करना चाहिए
2. अनुरोध एक पात्र इंटरैक्टिव स्थायी चैट सत्र होना चाहिए

सक्रियण मॉडल, Plugin-स्वामित्व वाले कॉन्फ़िगरेशन, ट्रांसक्रिप्ट स्थायित्व, और सुरक्षित रोलआउट पैटर्न के लिए [Active Memory](/hi/concepts/active-memory) देखें।
</Note>

---

## प्रदाता चयन

| Key        | Type      | Default          | Description                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, या `voyage` जैसे एम्बेडिंग एडैप्टर ID; यह कॉन्फ़िगर किया गया `models.providers.<id>` भी हो सकता है जिसका `api` किसी मेमोरी एम्बेडिंग एडैप्टर या OpenAI-संगत मॉडल API की ओर संकेत करता हो |
| `model`    | `string`  | provider default | एम्बेडिंग मॉडल का नाम                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | प्राथमिक विफल होने पर फ़ॉलबैक एडैप्टर ID                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | मेमोरी खोज सक्षम या अक्षम करें                                                                                                                                                                                                                                                             |

जब `provider` सेट नहीं होता है, OpenClaw OpenAI एम्बेडिंग्स का उपयोग करता है। Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, स्थानीय GGUF मॉडल, या OpenAI-संगत `/v1/embeddings` endpoint का उपयोग करने के लिए `provider`
स्पष्ट रूप से सेट करें।
पुराने कॉन्फ़िगरेशन जो अभी भी `provider: "auto"` कहते हैं, `openai` में रिज़ॉल्व होते हैं।

<Warning>
एम्बेडिंग प्रदाता, मॉडल, प्रदाता सेटिंग्स, स्रोत, स्कोप,
चंकिंग, या tokenizer बदलने से मौजूदा SQLite vector index असंगत हो सकता है।
OpenClaw सब कुछ अपने आप फिर से embed करने के बजाय vector search को रोक देता है और index identity चेतावनी रिपोर्ट करता है।
जब आप तैयार हों, तो
`openclaw memory status --index --agent <id>` या
`openclaw memory index --force --agent <id>` से फिर से बनाएँ।
</Warning>

जब `provider` अनसेट होता है, पुराना `provider: "auto"` मौजूद होता है, या
`provider: "none"` जानबूझकर FTS-only मोड चुनता है, तब embeddings अनुपलब्ध होने पर भी memory recall
lexical FTS ranking का उपयोग कर सकता है।

स्पष्ट non-local providers fail closed होते हैं। यदि आप `memorySearch.provider` को
OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio, या OpenAI-संगत
custom provider जैसे ठोस remote-backed provider पर सेट करते हैं, और वह provider runtime पर अनुपलब्ध है, तो `memory_search`
चुपचाप FTS-only recall का उपयोग करने के बजाय unavailable result लौटाता है। provider/auth configuration ठीक करें, किसी reachable provider पर स्विच करें, या यदि आप जानबूझकर FTS-only recall चाहते हैं तो
`provider: "none"` सेट करें।

### कस्टम प्रदाता id

`memorySearch.provider` memory-specific provider adapters जैसे `ollama`, या OpenAI-compatible model APIs जैसे `openai-responses` / `openai-completions` के लिए custom `models.providers.<id>` entry की ओर संकेत कर सकता है। OpenClaw endpoint, auth, और model-prefix handling के लिए custom provider id को सुरक्षित रखते हुए embedding adapter के लिए उस provider के `api` owner को resolve करता है। इससे multi-GPU या multi-host setups memory embeddings को किसी विशिष्ट local endpoint को समर्पित कर सकते हैं:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API key resolution

Remote embeddings के लिए API key आवश्यक है। Bedrock इसके बजाय AWS SDK default credential chain का उपयोग करता है (instance roles, SSO, access keys)।

| Provider       | Env var                                            | Config key                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS credential chain                               | कोई API key आवश्यक नहीं                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | device login के माध्यम से auth profile       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth केवल chat/completions को कवर करता है और embedding requests को पूरा नहीं करता।
</Note>

---

## Remote endpoint config

एक generic OpenAI-compatible
`/v1/embeddings` server के लिए `provider: "openai-compatible"` का उपयोग करें, जिसे global OpenAI chat credentials विरासत में नहीं लेने चाहिए।

<ParamField path="remote.baseUrl" type="string">
  Custom API base URL।
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API key override करें।
</ParamField>
<ParamField path="remote.headers" type="object">
  अतिरिक्त HTTP headers (provider defaults के साथ merged)।
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Provider-specific config

<AccordionGroup>
  <Accordion title="Gemini">
    | Key                    | Type     | Default                | Description                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` को भी support करता है |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 के लिए: 768, 1536, या 3072        |

    <Warning>
    मॉडल या `outputDimensionality` बदलने से index identity बदल जाती है। OpenClaw
    memory index को स्पष्ट रूप से rebuild करने तक vector search रोक देता है।
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-compatible embedding endpoints provider-specific `input_type` request fields में opt in कर सकते हैं। यह asymmetric embedding models के लिए उपयोगी है, जिन्हें query और document embeddings के लिए अलग labels चाहिए होते हैं।

    | Key                 | Type     | Default | Description                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | unset   | query और document embeddings के लिए साझा `input_type`   |
    | `queryInputType`    | `string` | unset   | Query-time `input_type`; `inputType` को override करता है          |
    | `documentInputType` | `string` | unset   | Index/document `input_type`; `inputType` को override करता है      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    इन मानों को बदलना provider batch indexing के लिए embedding cache identity को प्रभावित करता है और जब upstream model labels को अलग तरह से treat करता है, तो इसके बाद memory reindex किया जाना चाहिए।

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock embedding config

    Bedrock AWS SDK default credential chain का उपयोग करता है — कोई API keys आवश्यक नहीं। यदि OpenClaw Bedrock-enabled instance role के साथ EC2 पर चलता है, तो बस provider और model सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Key                    | Type     | Default                        | Description                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | कोई भी Bedrock embedding model ID  |
    | `outputDimensionality` | `number` | model default                  | Titan V2 के लिए: 256, 512, या 1024 |

    **Supported models** (family detection और dimension defaults के साथ):

    | मॉडल ID                                   | प्रदाता   | डिफ़ॉल्ट आयाम | कॉन्फ़िगर करने योग्य आयाम |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    थ्रूपुट-प्रत्यय वाले वैरिएंट (जैसे, `amazon.titan-embed-text-v1:2:8k`) बेस मॉडल का कॉन्फ़िगरेशन इनहेरिट करते हैं।

    **प्रमाणीकरण:** Bedrock प्रमाणीकरण मानक AWS SDK क्रेडेंशियल समाधान क्रम का उपयोग करता है:

    1. एनवायरनमेंट वेरिएबल (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO टोकन कैश
    3. वेब आइडेंटिटी टोकन क्रेडेंशियल
    4. साझा क्रेडेंशियल और कॉन्फ़िग फ़ाइलें
    5. ECS या EC2 मेटाडेटा क्रेडेंशियल

    रीजन `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` प्रदाता `baseUrl` से निर्धारित होता है, या डिफ़ॉल्ट रूप से `us-east-1` होता है।

    **IAM अनुमतियाँ:** IAM रोल या उपयोगकर्ता को चाहिए:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    न्यूनतम-विशेषाधिकार के लिए, `InvokeModel` को विशिष्ट मॉडल तक सीमित करें:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | कुंजी                   | प्रकार               | डिफ़ॉल्ट                | विवरण                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | स्वतः डाउनलोड किया गया        | GGUF मॉडल फ़ाइल का पथ                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp डिफ़ॉल्ट | डाउनलोड किए गए मॉडल के लिए कैश डायरेक्टरी                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | एम्बेडिंग कॉन्टेक्स्ट के लिए कॉन्टेक्स्ट विंडो आकार। 4096 सामान्य चंक्स (128–512 टोकन) को कवर करता है और non-weight VRAM को सीमित रखता है। सीमित होस्ट पर इसे घटाकर 1024–2048 करें। `"auto"` मॉडल के प्रशिक्षित अधिकतम का उपयोग करता है — 8B+ मॉडल के लिए अनुशंसित नहीं (Qwen3-Embedding-8B: 40 960 टोकन → ~32 GB VRAM बनाम 4096 पर ~8.8 GB)। |

    पहले आधिकारिक llama.cpp प्रदाता इंस्टॉल करें: `openclaw plugins install @openclaw/llama-cpp-provider`.
    डिफ़ॉल्ट मॉडल: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, स्वतः डाउनलोड किया गया)। सोर्स चेकआउट में अब भी नेटिव बिल्ड स्वीकृति चाहिए: `pnpm approve-builds` फिर `pnpm rebuild node-llama-cpp`.

    Gateway द्वारा उपयोग किए जाने वाले उसी प्रदाता पथ को सत्यापित करने के लिए स्टैंडअलोन CLI का उपयोग करें:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    स्थानीय GGUF एम्बेडिंग के लिए `provider: "local"` स्पष्ट रूप से सेट करें। `hf:` और HTTP(S) मॉडल संदर्भ स्पष्ट स्थानीय कॉन्फ़िग के लिए समर्थित हैं, लेकिन वे डिफ़ॉल्ट प्रदाता को नहीं बदलते।

  </Accordion>
</AccordionGroup>

### इनलाइन एम्बेडिंग टाइमआउट

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  मेमोरी इंडेक्सिंग के दौरान इनलाइन एम्बेडिंग बैच के लिए टाइमआउट ओवरराइड करें।

सेट न होने पर प्रदाता डिफ़ॉल्ट का उपयोग होता है: `local`, `ollama`, और `lmstudio` जैसे स्थानीय/स्व-होस्टेड प्रदाताओं के लिए 600 सेकंड, और होस्टेड प्रदाताओं के लिए 120 सेकंड। जब स्थानीय CPU-बाउंड एम्बेडिंग बैच स्वस्थ हों लेकिन धीमे हों, तो इसे बढ़ाएँ।
</ParamField>

---

## हाइब्रिड खोज कॉन्फ़िग

सभी `memorySearch.query.hybrid` के अंतर्गत:

| कुंजी                   | प्रकार      | डिफ़ॉल्ट | विवरण                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | हाइब्रिड BM25 + वेक्टर खोज सक्षम करें |
| `vectorWeight`        | `number`  | `0.7`   | वेक्टर स्कोर के लिए वेट (0-1)     |
| `textWeight`          | `number`  | `0.3`   | BM25 स्कोर के लिए वेट (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | उम्मीदवार पूल आकार गुणक     |

<Tabs>
  <Tab title="MMR (diversity)">
    | कुंजी           | प्रकार      | डिफ़ॉल्ट | विवरण                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | MMR री-रैंकिंग सक्षम करें                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = अधिकतम विविधता, 1 = अधिकतम प्रासंगिकता |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | कुंजी                          | प्रकार      | डिफ़ॉल्ट | विवरण               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | हालिया होने का बूस्ट सक्षम करें      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | स्कोर हर N दिन में आधा हो जाता है |

    एवरग्रीन फ़ाइलें (`MEMORY.md`, `memory/` में बिना तारीख वाली फ़ाइलें) कभी decay नहीं की जातीं।

  </Tab>
</Tabs>

### पूरा उदाहरण

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## अतिरिक्त मेमोरी पथ

| कुंजी          | प्रकार       | विवरण                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | इंडेक्स करने के लिए अतिरिक्त निर्देशिकाएं या फ़ाइलें |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

पथ निरपेक्ष या workspace-सापेक्ष हो सकते हैं। निर्देशिकाओं को `.md` फ़ाइलों के लिए पुनरावर्ती रूप से स्कैन किया जाता है। Symlink हैंडलिंग सक्रिय backend पर निर्भर करती है: builtin engine symlinks को अनदेखा करता है, जबकि QMD अंतर्निहित QMD scanner व्यवहार का पालन करता है।

agent-scoped cross-agent transcript search के लिए, `memory.qmd.paths` के बजाय `agents.list[].memorySearch.qmd.extraCollections` का उपयोग करें। वे अतिरिक्त collections समान `{ path, name, pattern? }` आकार का पालन करती हैं, लेकिन उन्हें प्रति agent merge किया जाता है और जब path वर्तमान workspace के बाहर इंगित करता है, तो वे स्पष्ट shared names को संरक्षित रख सकती हैं। यदि वही resolved path `memory.qmd.paths` और `memorySearch.qmd.extraCollections` दोनों में दिखाई देता है, तो QMD पहली entry रखता है और duplicate को छोड़ देता है।

---

## Multimodal मेमोरी (Gemini)

Gemini Embedding 2 का उपयोग करके Markdown के साथ images और audio को इंडेक्स करें:

| कुंजी                       | प्रकार       | डिफ़ॉल्ट    | विवरण                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | multimodal indexing सक्षम करें             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, या `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | indexing के लिए अधिकतम फ़ाइल आकार             |

<Note>
केवल `extraPaths` में मौजूद फ़ाइलों पर लागू होता है। डिफ़ॉल्ट memory roots केवल Markdown रहती हैं। `gemini-embedding-2-preview` आवश्यक है। `fallback` `"none"` होना चाहिए।
</Note>

समर्थित formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (images); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## एम्बेडिंग कैश

| कुंजी                | प्रकार      | डिफ़ॉल्ट | विवरण                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | chunk embeddings को SQLite में cache करें |
| `cache.maxEntries` | `number`  | `50000` | अधिकतम cached embeddings            |

reindex या transcript updates के दौरान अपरिवर्तित text को फिर से embed होने से रोकता है।

---

## बैच इंडेक्सिंग

| कुंजी                           | प्रकार      | डिफ़ॉल्ट | विवरण                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | समानांतर inline embeddings |
| `remote.batch.enabled`        | `boolean` | `false` | batch embedding API सक्षम करें |
| `remote.batch.concurrency`    | `number`  | `2`     | समानांतर batch jobs        |
| `remote.batch.wait`           | `boolean` | `true`  | batch completion की प्रतीक्षा करें  |
| `remote.batch.pollIntervalMs` | `number`  | --      | poll interval              |
| `remote.batch.timeoutMinutes` | `number`  | --      | batch timeout              |

`openai`, `gemini`, और `voyage` के लिए उपलब्ध। बड़े backfills के लिए OpenAI batch आमतौर पर सबसे तेज और सबसे सस्ता होता है।

`remote.nonBatchConcurrency` local/self-hosted providers और hosted providers द्वारा उपयोग की जाने वाली inline embedding calls को नियंत्रित करता है, जब provider batch APIs सक्रिय नहीं होती हैं। छोटे local hosts पर अधिक भार से बचने के लिए Ollama non-batch indexing के लिए डिफ़ॉल्ट रूप से `1` का उपयोग करता है; बड़ी machines पर अधिक मान सेट करें।

यह `sync.embeddingBatchTimeoutSeconds` से अलग है, जो inline embedding calls के लिए timeout को नियंत्रित करता है।

---

## सेशन मेमोरी खोज (प्रायोगिक)

session transcripts को इंडेक्स करें और उन्हें `memory_search` के माध्यम से प्रस्तुत करें:

| कुंजी                           | प्रकार       | डिफ़ॉल्ट      | विवरण                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | session indexing सक्षम करें                 |
| `sources`                     | `string[]` | `["memory"]` | transcripts शामिल करने के लिए `"sessions"` जोड़ें |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | reindex के लिए byte threshold              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | reindex के लिए message threshold           |

<Warning>
Session indexing opt-in है और asynchronously चलती है। Results थोड़े पुराने हो सकते हैं। Session logs disk पर रहते हैं, इसलिए filesystem access को trust boundary मानें।
</Warning>

सत्र प्रतिलेख मिलान भी
[`tools.sessions.visibility`](/hi/gateway/config-tools#toolssessions) का पालन करते हैं। डिफ़ॉल्ट
`tree` दृश्यता केवल वर्तमान सत्र और उसके द्वारा शुरू किए गए सत्रों को दिखाती है। किसी
अलग सत्र, जैसे DM, से किसी असंबंधित समान-एजेंट Gateway द्वारा भेजे गए सत्र को
याद करने के लिए, दृश्यता को जानबूझकर `agent` तक बढ़ाएँ (या `all` केवल तब जब
क्रॉस-एजेंट रिकॉल भी आवश्यक हो और एजेंट-से-एजेंट नीति इसकी अनुमति देती हो)।

नीचे दिए गए उदाहरण इन सेटिंग्स को `agents.defaults` के अंतर्गत रखते हैं। जब केवल एक
एजेंट को सत्र प्रतिलेखों को इंडेक्स और खोज करना चाहिए, तब आप प्रति-एजेंट ओवरराइड में
समकक्ष `memorySearch` सेटिंग्स भी लागू कर सकते हैं।

समान-एजेंट Gateway-से-DM रिकॉल के लिए:

<Tabs>
  <Tab title="Builtin backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

QMD का उपयोग करते समय, `agents.defaults.memorySearch.experimental.sessionMemory` और
`sources: ["sessions"]` अपने-आप प्रतिलेखों को QMD में निर्यात नहीं करते। साथ में
`memory.qmd.sessions.enabled: true` भी सेट करें।

---

## SQLite वेक्टर त्वरण (sqlite-vec)

| कुंजी                        | प्रकार    | डिफ़ॉल्ट | विवरण                              |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | वेक्टर क्वेरी के लिए sqlite-vec का उपयोग करें |
| `store.vector.extensionPath` | `string`  | बंडल किया गया | sqlite-vec पथ को ओवरराइड करें          |

जब sqlite-vec उपलब्ध नहीं होता, OpenClaw अपने-आप इन-प्रोसेस कोसाइन समानता पर वापस चला जाता है।

---

## इंडेक्स संग्रहण

बिल्ट-इन मेमोरी इंडेक्स प्रत्येक एजेंट के OpenClaw SQLite डेटाबेस में रहते हैं:
`agents/<agentId>/agent/openclaw-agent.sqlite`।

| कुंजी                 | प्रकार   | डिफ़ॉल्ट    | विवरण                                  |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 टोकनाइज़र (`unicode61` या `trigram`) |

---

## QMD बैकएंड कॉन्फ़िगरेशन

सक्षम करने के लिए `memory.backend = "qmd"` सेट करें। सभी QMD सेटिंग्स `memory.qmd` के अंतर्गत रहती हैं:

| कुंजी                    | प्रकार    | डिफ़ॉल्ट | विवरण                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD executable पथ; जब सेवा का `PATH` आपके shell से अलग हो तो एक absolute पथ सेट करें |
| `searchMode`             | `string`  | `search` | खोज कमांड: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | QMD reranking छोड़ने के लिए `searchMode: "query"` और QMD 2.1+ के साथ `false` पर सेट करें |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` को अपने-आप इंडेक्स करें                                             |
| `paths[]`                | `array`   | --       | अतिरिक्त पथ: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | सत्र प्रतिलेखों को QMD में निर्यात करें                                                   |
| `sessions.retentionDays` | `number`  | --       | प्रतिलेख retention                                                                  |
| `sessions.exportDir`     | `string`  | --       | निर्यात निर्देशिका                                                                      |

`searchMode: "search"` केवल lexical/BM25 है। OpenClaw उस मोड के लिए semantic vector readiness probes या QMD embedding maintenance नहीं चलाता, जिसमें `memory status --deep` के दौरान भी शामिल है; `vsearch` और `query` के लिए QMD vector readiness और embeddings आवश्यक बने रहते हैं।

`rerank: false` केवल QMD `query` मोड को बदलता है और इसके लिए QMD 2.1 या उससे नया संस्करण आवश्यक है। direct CLI मोड में OpenClaw `--no-rerank` पास करता है; mcporter-backed MCP मोड में यह QMD के unified query tool को `rerank: false` पास करता है। QMD के डिफ़ॉल्ट query reranking व्यवहार का उपयोग करने के लिए इसे unset छोड़ दें।

OpenClaw मौजूदा QMD collection और MCP query shapes को प्राथमिकता देता है, लेकिन आवश्यकता होने पर compatible collection pattern flags और पुराने MCP tool names आज़माकर पुराने QMD रिलीज़ को काम करते रहने देता है। जब QMD कई collection filters के समर्थन का विज्ञापन करता है, same-source collections को एक QMD process से खोजा जाता है; पुराने QMD builds per-collection compatibility path बनाए रखते हैं। Same-source का अर्थ है कि durable memory collections को साथ में समूहित किया जाता है, जबकि session transcript collections एक अलग समूह बने रहते हैं ताकि source diversification में अब भी दोनों inputs रहें।

<Note>
QMD model overrides QMD पक्ष पर रहते हैं, OpenClaw config में नहीं। यदि आपको QMD के models को globally override करना है, तो gateway runtime environment में `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, और `QMD_GENERATE_MODEL` जैसे environment variables सेट करें।
</Note>

<AccordionGroup>
  <Accordion title="अपडेट शेड्यूल">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | रीफ़्रेश अंतराल                      |
    | `update.debounceMs`       | `number`  | `15000` | फ़ाइल बदलावों को Debounce करें                 |
    | `update.onBoot`           | `boolean` | `true`  | लंबे समय तक चलने वाला QMD मैनेजर खुलने पर रीफ़्रेश करें; तत्काल बूट अपडेट छोड़ने के लिए false सेट करें |
    | `update.startup`          | `string`  | `off`   | वैकल्पिक gateway-start QMD आरंभीकरण: `off`, `idle`, या `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` रीफ़्रेश चलने से पहले विलंब |
    | `update.waitForBootSync`  | `boolean` | `false` | मैनेजर खोलने को तब तक रोकें जब तक उसका शुरुआती रीफ़्रेश पूरा न हो जाए |
    | `update.embedInterval`    | `string`  | --      | अलग embed cadence                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD कमांड के लिए Timeout              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD अपडेट कार्रवाइयों के लिए Timeout     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed कार्रवाइयों के लिए Timeout      |
  </Accordion>
  <Accordion title="सीमाएँ">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | अधिकतम खोज परिणाम         |
    | `limits.maxSnippetChars`  | `number` | --      | स्निपेट की लंबाई सीमित करें       |
    | `limits.maxInjectedChars` | `number` | --      | कुल इंजेक्ट किए गए वर्ण सीमित करें |
    | `limits.timeoutMs`        | `number` | `4000`  | खोज Timeout             |
  </Accordion>
  <Accordion title="स्कोप">
    नियंत्रित करता है कि कौन-से सत्र QMD खोज परिणाम प्राप्त कर सकते हैं। वही स्कीमा जो [`session.sendPolicy`](/hi/gateway/config-agents#session) में है:

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    शिप किया गया डिफ़ॉल्ट direct और channel सत्रों को अनुमति देता है, जबकि groups को अब भी अस्वीकार करता है।

    डिफ़ॉल्ट केवल-DM है। `match.keyPrefix` सामान्यीकृत session key से मेल खाता है; `match.rawKeyPrefix` `agent:<id>:` सहित raw key से मेल खाता है।

  </Accordion>
  <Accordion title="उद्धरण">
    `memory.citations` सभी backends पर लागू होता है:

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | स्निपेट में `Source: <path#line>` footer शामिल करें    |
    | `on`             | हमेशा footer शामिल करें                               |
    | `off`            | footer छोड़ें (path अब भी आंतरिक रूप से agent को भेजा जाता है) |

  </Accordion>
</AccordionGroup>

जब gateway-start QMD आरंभीकरण सक्षम होता है, OpenClaw केवल पात्र agents के लिए QMD शुरू करता है। यदि `update.onBoot` true है और कोई interval/embed maintenance कॉन्फ़िगर नहीं है, तो startup boot refresh के लिए one-shot manager का उपयोग करता है और उसे बंद कर देता है। यदि कोई update या embed interval कॉन्फ़िगर है, तो startup लंबे समय तक चलने वाला QMD manager खोलता है ताकि वह watcher और interval timers का स्वामी हो सके; `update.onBoot: false` केवल तत्काल boot refresh को छोड़ता है।

### पूरा QMD उदाहरण

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming को `agents.defaults.memorySearch` के अंतर्गत नहीं, बल्कि `plugins.entries.memory-core.config.dreaming` के अंतर्गत कॉन्फ़िगर किया जाता है।

Dreaming एक scheduled sweep के रूप में चलता है और implementation detail के रूप में आंतरिक light/deep/REM phases का उपयोग करता है।

संकल्पनात्मक व्यवहार और slash commands के लिए, [Dreaming](/hi/concepts/dreaming) देखें।

### उपयोगकर्ता सेटिंग्स

| Key                                    | Type      | Default       | Description                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming को पूरी तरह सक्षम या अक्षम करें                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | पूरे dreaming sweep के लिए वैकल्पिक Cron cadence                                                                                |
| `model`                                | `string`  | डिफ़ॉल्ट model | वैकल्पिक Dream Diary subagent model override                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md` में promote किए गए प्रत्येक short-term recall snippet से रखे गए अधिकतम अनुमानित tokens; provenance metadata दृश्यमान रहता है |

### उदाहरण

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming machine state को `memory/.dreams/` में लिखता है।
- Dreaming human-readable narrative output को `DREAMS.md` (या मौजूदा `dreams.md`) में लिखता है।
- `dreaming.model` मौजूदा plugin subagent trust gate का उपयोग करता है; इसे सक्षम करने से पहले `plugins.entries.memory-core.subagent.allowModelOverride: true` सेट करें।
- कॉन्फ़िगर किया गया model उपलब्ध न होने पर Dream Diary session default model के साथ एक बार पुनः प्रयास करता है। Trust या allowlist विफलताएँ log की जाती हैं और चुपचाप पुनः प्रयास नहीं की जातीं।
- light/deep/REM phase policy और thresholds आंतरिक व्यवहार हैं, user-facing config नहीं।

</Note>

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [मेमोरी अवलोकन](/hi/concepts/memory)
- [मेमोरी खोज](/hi/concepts/memory-search)
