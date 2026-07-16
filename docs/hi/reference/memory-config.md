---
read_when:
    - आप मेमोरी खोज प्रदाताओं या एम्बेडिंग मॉडल को कॉन्फ़िगर करना चाहते हैं
    - आप QMD बैकएंड सेट अप करना चाहते हैं
    - आप हाइब्रिड खोज, MMR या समय-आधारित क्षय को अनुकूलित करना चाहते हैं
    - आप मल्टीमोडल मेमोरी इंडेक्सिंग सक्षम करना चाहते हैं
sidebarTitle: Memory config
summary: मेमोरी खोज, एम्बेडिंग प्रदाताओं, QMD, हाइब्रिड खोज और मल्टीमोडल इंडेक्सिंग के लिए सभी कॉन्फ़िगरेशन विकल्प
title: मेमोरी कॉन्फ़िगरेशन संदर्भ
x-i18n:
    generated_at: "2026-07-16T17:03:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

यह पृष्ठ OpenClaw मेमोरी खोज के प्रत्येक कॉन्फ़िगरेशन विकल्प को सूचीबद्ध करता है। वैचारिक अवलोकनों के लिए, देखें:

<CardGroup cols={2}>
  <Card title="मेमोरी का अवलोकन" href="/hi/concepts/memory">
    मेमोरी कैसे काम करती है।
  </Card>
  <Card title="अंतर्निहित इंजन" href="/hi/concepts/memory-builtin">
    डिफ़ॉल्ट SQLite बैकएंड।
  </Card>
  <Card title="QMD इंजन" href="/hi/concepts/memory-qmd">
    लोकल-फ़र्स्ट साइडकार।
  </Card>
  <Card title="मेमोरी खोज" href="/hi/concepts/memory-search">
    खोज पाइपलाइन और ट्यूनिंग।
  </Card>
  <Card title="Active Memory" href="/hi/concepts/active-memory">
    इंटरैक्टिव सत्रों के लिए मेमोरी उप-एजेंट।
  </Card>
</CardGroup>

जब तक अन्यथा उल्लेख न किया गया हो, मेमोरी खोज की सभी सेटिंग्स `openclaw.json` में `agents.defaults.memorySearch` के अंतर्गत (या प्रति-एजेंट `agents.list[].memorySearch` ओवरराइड में) होती हैं।

<Note>
यदि आप **Active Memory** फ़ीचर टॉगल और उप-एजेंट कॉन्फ़िगरेशन खोज रहे हैं, तो वह `memorySearch` के बजाय `plugins.entries.active-memory` के अंतर्गत होता है।

Active Memory दो-गेट मॉडल का उपयोग करती है:

1. Plugin सक्षम होना चाहिए और वर्तमान एजेंट आईडी को लक्षित करना चाहिए
2. अनुरोध एक पात्र इंटरैक्टिव स्थायी चैट सत्र होना चाहिए

सक्रियण मॉडल, Plugin-स्वामित्व वाले कॉन्फ़िगरेशन, ट्रांसक्रिप्ट स्थायित्व और सुरक्षित रोलआउट पैटर्न के लिए [Active Memory](/hi/concepts/active-memory) देखें।
</Note>

---

## प्रदाता चयन

| कुंजी        | प्रकार      | डिफ़ॉल्ट          | विवरण                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | मेमोरी खोज सक्षम या अक्षम करें                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | एम्बेडिंग अडैप्टर आईडी, जैसे `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, या `voyage`; यह कॉन्फ़िगर किया गया `models.providers.<id>` भी हो सकता है, जिसका `api` किसी मेमोरी एम्बेडिंग अडैप्टर या OpenAI-संगत मॉडल API की ओर इंगित करता हो |
| `model`    | `string`  | प्रदाता डिफ़ॉल्ट | एम्बेडिंग मॉडल का नाम                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | प्राथमिक अडैप्टर विफल होने पर फ़ॉलबैक अडैप्टर आईडी                                                                                                                                                                                                                                                  |

जब `provider` सेट नहीं होता, तो OpenClaw OpenAI एम्बेडिंग का उपयोग करता है। Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, किसी स्थानीय GGUF मॉडल या OpenAI-संगत `/v1/embeddings` एंडपॉइंट का उपयोग करने के लिए `provider`
को स्पष्ट रूप से सेट करें।
वे पुराने कॉन्फ़िगरेशन, जिनमें अभी भी `provider: "auto"` लिखा है, `openai` के रूप में हल होते हैं।

<Warning>
एम्बेडिंग प्रदाता, मॉडल, प्रदाता सेटिंग्स, स्रोत, दायरा,
चंकिंग या टोकनाइज़र बदलने से मौजूदा SQLite वेक्टर इंडेक्स असंगत हो सकता है।
OpenClaw सभी चीज़ों को स्वचालित रूप से फिर से एम्बेड करने के बजाय वेक्टर खोज रोक देता है और इंडेक्स पहचान संबंधी चेतावनी दिखाता है।
तैयार होने पर
`openclaw memory status --index --agent <id>` या
`openclaw memory index --force --agent <id>` से इसे फिर से बनाएँ।
</Warning>

जब `provider` सेट न हो, पुराना `provider: "auto"` मौजूद हो, या
`provider: "none"` जानबूझकर केवल-FTS मोड चुनता हो, तब एम्बेडिंग उपलब्ध न होने पर भी मेमोरी रिकॉल
शाब्दिक FTS रैंकिंग का उपयोग कर सकता है।

स्पष्ट रूप से चुने गए गैर-स्थानीय प्रदाता फ़ेल-क्लोज़ होते हैं। यदि आप `memorySearch.provider` को
Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage या OpenAI-संगत
कस्टम प्रदाता जैसे किसी ठोस रिमोट-समर्थित प्रदाता पर सेट करते हैं और वह प्रदाता रनटाइम पर उपलब्ध नहीं होता, तो `memory_search`
चुपचाप केवल-FTS रिकॉल का उपयोग करने के बजाय अनुपलब्ध परिणाम लौटाता है। प्रदाता/प्रमाणीकरण कॉन्फ़िगरेशन
ठीक करें, उपलब्ध प्रदाता पर स्विच करें, या यदि आप जानबूझकर केवल-FTS रिकॉल चाहते हैं तो
`provider: "none"` सेट करें।

### कस्टम प्रदाता आईडी

`memorySearch.provider`, `ollama` जैसे मेमोरी-विशिष्ट प्रदाता अडैप्टरों या `openai-responses` / `openai-completions` जैसे OpenAI-संगत मॉडल API के लिए किसी कस्टम `models.providers.<id>` प्रविष्टि की ओर इंगित कर सकता है। OpenClaw एंडपॉइंट, प्रमाणीकरण और मॉडल-प्रीफ़िक्स प्रबंधन के लिए कस्टम प्रदाता आईडी सुरक्षित रखते हुए एम्बेडिंग अडैप्टर के लिए उस प्रदाता के `api` स्वामी को हल करता है। इससे मल्टी-GPU या मल्टी-होस्ट सेटअप मेमोरी एम्बेडिंग को किसी विशिष्ट स्थानीय एंडपॉइंट के लिए समर्पित कर सकते हैं:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
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

### API कुंजी समाधान

रिमोट एम्बेडिंग के लिए API कुंजी आवश्यक है। इसके बजाय Bedrock AWS SDK की डिफ़ॉल्ट क्रेडेंशियल शृंखला (इंस्टेंस भूमिकाएँ, SSO, एक्सेस कुंजियाँ या Bedrock API कुंजी) का उपयोग करता है।

| प्रदाता       | परिवेश चर                                             | कॉन्फ़िगरेशन कुंजी                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS क्रेडेंशियल शृंखला, या `AWS_BEARER_TOKEN_BEDROCK` | किसी API कुंजी की आवश्यकता नहीं                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | डिवाइस लॉगिन के माध्यम से प्रमाणीकरण प्रोफ़ाइल       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (प्लेसहोल्डर)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth केवल चैट/कम्प्लीशन को कवर करता है और एम्बेडिंग अनुरोधों की आवश्यकताओं को पूरा नहीं करता।
</Note>

---

## रिमोट एंडपॉइंट कॉन्फ़िगरेशन

ऐसे सामान्य OpenAI-संगत
`/v1/embeddings` सर्वर के लिए `provider: "openai-compatible"` का उपयोग करें, जिसे वैश्विक OpenAI चैट क्रेडेंशियल विरासत में नहीं मिलने चाहिए।

<ParamField path="remote.baseUrl" type="string">
  कस्टम API बेस URL।
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API कुंजी ओवरराइड करें।
</ParamField>
<ParamField path="remote.headers" type="object">
  अतिरिक्त HTTP हेडर (प्रदाता डिफ़ॉल्ट के साथ मर्ज किए जाते हैं)।
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

## प्रदाता-विशिष्ट कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Gemini">
    | कुंजी                    | प्रकार     | डिफ़ॉल्ट                | विवरण                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` का भी समर्थन करता है |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 के लिए: 768, 1536 या 3072        |

    <Warning>
    मॉडल या `outputDimensionality` बदलने से इंडेक्स पहचान बदल जाती है। OpenClaw
    वेक्टर खोज को तब तक रोक देता है, जब तक आप मेमोरी इंडेक्स को स्पष्ट रूप से फिर से नहीं बनाते।
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-संगत इनपुट प्रकार">
    OpenAI-संगत एम्बेडिंग एंडपॉइंट प्रदाता-विशिष्ट `input_type` अनुरोध फ़ील्ड का विकल्प चुन सकते हैं। यह उन असममित एम्बेडिंग मॉडलों के लिए उपयोगी है, जिन्हें क्वेरी और दस्तावेज़ एम्बेडिंग के लिए अलग-अलग लेबल की आवश्यकता होती है।

    | कुंजी                 | प्रकार     | डिफ़ॉल्ट | विवरण                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | सेट नहीं   | क्वेरी और दस्तावेज़ एम्बेडिंग के लिए साझा `input_type`   |
    | `queryInputType`    | `string` | सेट नहीं   | क्वेरी-समय `input_type`; `inputType` को ओवरराइड करता है          |
    | `documentInputType` | `string` | सेट नहीं   | इंडेक्स/दस्तावेज़ `input_type`; `inputType` को ओवरराइड करता है      |

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

    इन मानों को बदलने से प्रदाता बैच इंडेक्सिंग की एम्बेडिंग कैश पहचान प्रभावित होती है और जब अपस्ट्रीम मॉडल लेबलों के साथ अलग-अलग व्यवहार करता हो, तब इसके बाद मेमोरी को फिर से इंडेक्स करना चाहिए।

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock एम्बेडिंग कॉन्फ़िगरेशन

    Bedrock AWS SDK की डिफ़ॉल्ट क्रेडेंशियल शृंखला के साथ OpenClaw द्वारा जाँचे गए बेयरर टोकन का उपयोग करता है, इसलिए कॉन्फ़िगरेशन में कोई API कुंजी संग्रहीत नहीं होती। यदि OpenClaw Bedrock-सक्षम इंस्टेंस भूमिका वाले EC2 पर चलता है, तो केवल प्रदाता और मॉडल सेट करें:

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

    | कुंजी                    | प्रकार     | डिफ़ॉल्ट                        | विवरण                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | कोई भी Bedrock एम्बेडिंग मॉडल आईडी  |
    | `outputDimensionality` | `number` | मॉडल डिफ़ॉल्ट                  | Titan V2 के लिए: 256, 512 या 1024 |

    **समर्थित मॉडल** (फ़ैमिली पहचान और आयाम डिफ़ॉल्ट के साथ):

    | मॉडल ID                                   | प्रदाता   | डिफ़ॉल्ट आयाम | कॉन्फ़िगर करने योग्य आयाम          |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    थ्रूपुट-प्रत्यय वाले वैरिएंट (जैसे, `amazon.titan-embed-text-v1:2:8k`) और क्षेत्र-उपसर्ग वाले इन्फ़रेंस प्रोफ़ाइल ID (जैसे, `us.amazon.titan-embed-text-v2:0`) मूल मॉडल की कॉन्फ़िगरेशन इनहेरिट करते हैं।

    **क्षेत्र:** इस क्रम में निर्धारित होता है: `memorySearch.remote.baseUrl` ओवरराइड, `models.providers.amazon-bedrock.baseUrl` कॉन्फ़िगरेशन, `AWS_REGION`, `AWS_DEFAULT_REGION`, फिर `us-east-1` का डिफ़ॉल्ट।

    **प्रमाणीकरण:** OpenClaw पहले `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` या `AWS_BEARER_TOKEN_BEDROCK` की जाँच करता है, फिर मानक AWS SDK डिफ़ॉल्ट क्रेडेंशियल प्रदाता शृंखला का उपयोग करता है:

    1. पर्यावरण चर (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), जब तक कि `AWS_PROFILE` भी सेट न हो
    2. SSO (केवल जब SSO फ़ील्ड कॉन्फ़िगर किए गए हों)
    3. साझा क्रेडेंशियल और कॉन्फ़िगरेशन फ़ाइलें (`fromIni`, जिसमें `AWS_PROFILE` शामिल है)
    4. क्रेडेंशियल प्रक्रिया (AWS कॉन्फ़िगरेशन फ़ाइल में `credential_process`)
    5. वेब पहचान टोकन क्रेडेंशियल
    6. ECS या EC2 इंस्टेंस मेटाडेटा क्रेडेंशियल

    **IAM अनुमतियाँ:** IAM भूमिका या उपयोगकर्ता को निम्नलिखित की आवश्यकता होती है:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    न्यूनतम-विशेषाधिकार के लिए, `InvokeModel` का दायरा विशिष्ट मॉडल तक सीमित करें:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="स्थानीय (GGUF + llama.cpp)">
    | कुंजी                   | प्रकार               | डिफ़ॉल्ट                | विवरण                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | स्वतः डाउनलोड किया गया        | GGUF मॉडल फ़ाइल का पथ                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp डिफ़ॉल्ट | डाउनलोड किए गए मॉडलों की कैश डायरेक्टरी                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | एम्बेडिंग संदर्भ के लिए कॉन्टेक्स्ट विंडो का आकार। 4096 गैर-वेट VRAM को सीमित रखते हुए सामान्य खंडों (128-512 टोकन) को समाहित करता है। सीमित होस्ट पर इसे घटाकर 1024-2048 करें। `"auto"` मॉडल के प्रशिक्षण में प्रयुक्त अधिकतम सीमा का उपयोग करता है—8B+ मॉडल के लिए अनुशंसित नहीं (Qwen3-Embedding-8B: अधिकतम 40 960 टोकन VRAM को ~32 GB तक पहुँचा सकते हैं)। |

    पहले आधिकारिक llama.cpp प्रदाता इंस्टॉल करें: `openclaw plugins install @openclaw/llama-cpp-provider`।
    डिफ़ॉल्ट मॉडल: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, स्वतः डाउनलोड किया जाता है)। स्रोत चेकआउट के लिए अब भी नेटिव बिल्ड की स्वीकृति आवश्यक है: `pnpm approve-builds`, फिर `pnpm rebuild node-llama-cpp`।

    उसी प्रदाता पथ को सत्यापित करने के लिए स्टैंडअलोन CLI का उपयोग करें जिसका Gateway उपयोग करता है:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    संख्यात्मक `local.contextSize` मान node-llama-cpp के स्वचालित GPU-लेयर प्लेसमेंट को भी सूचित करते हैं, ताकि मॉडल वेट और अनुरोधित एम्बेडिंग संदर्भ एक साथ फ़िट हो सकें। रनटाइम के लोड होने के बाद `openclaw memory status --deep` अंतिम ज्ञात llama.cpp बैकएंड, डिवाइस, ऑफ़लोड, अनुरोधित संदर्भ और टाइमस्टैम्पयुक्त मेमोरी तथ्य रिपोर्ट करता है; निष्क्रिय स्थिति मॉडल को लोड नहीं करती।

    स्थानीय GGUF एम्बेडिंग के लिए `provider: "local"` को स्पष्ट रूप से सेट करें। स्पष्ट स्थानीय कॉन्फ़िगरेशन के लिए `hf:` और HTTP(S) मॉडल संदर्भ समर्थित हैं (node-llama-cpp के मॉडल रिज़ॉल्यूशन के माध्यम से), लेकिन वे डिफ़ॉल्ट प्रदाता को नहीं बदलते।

  </Accordion>
</AccordionGroup>

### इनलाइन एम्बेडिंग टाइमआउट

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  मेमोरी इंडेक्सिंग के दौरान इनलाइन एम्बेडिंग बैचों के टाइमआउट को ओवरराइड करें।

सेट न होने पर प्रदाता का डिफ़ॉल्ट उपयोग होता है: `local`, `ollama`, और `lmstudio` जैसे स्थानीय/स्वयं-होस्ट किए गए प्रदाताओं के लिए 600 सेकंड और होस्ट किए गए प्रदाताओं के लिए 120 सेकंड। जब स्थानीय CPU-बाउंड एम्बेडिंग बैच सही ढंग से काम कर रहे हों लेकिन धीमे हों, तो इसे बढ़ाएँ।
</ParamField>

---

## इंडेक्सिंग व्यवहार

जहाँ अन्यथा उल्लेख न हो, सभी `memorySearch.sync` के अंतर्गत हैं:

| कुंजी                            | प्रकार      | डिफ़ॉल्ट | विवरण                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | सत्र शुरू होने पर मेमोरी इंडेक्स सिंक करें                           |
| `onSearch`                     | `boolean` | `true`  | सामग्री में परिवर्तन पहचानने के बाद खोज के समय विलंबित रूप से सिंक करें                 |
| `watch`                        | `boolean` | `true`  | मेमोरी फ़ाइलों (chokidar) पर नज़र रखें और परिवर्तनों पर पुनः इंडेक्सिंग निर्धारित करें         |
| `watchDebounceMs`              | `number`  | `1500`  | तेज़ी से आने वाले फ़ाइल-वॉच इवेंट को संयोजित करने की डिबाउंस अवधि                |
| `intervalMinutes`              | `number`  | `0`     | मिनटों में आवधिक पुनः इंडेक्सिंग अंतराल (`0` इसे अक्षम करता है)                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | Compaction द्वारा ट्रिगर किए गए ट्रांसक्रिप्ट अपडेट के बाद सत्र को बलपूर्वक पुनः इंडेक्स करें |

<ParamField path="chunking.tokens" type="number">
  एम्बेडिंग से पहले मेमोरी स्रोतों को विभाजित करते समय उपयोग किया जाने वाला खंड आकार, टोकन में (डिफ़ॉल्ट: 400)।
</ParamField>
<ParamField path="chunking.overlap" type="number">
  विभाजन सीमाओं के पास संदर्भ बनाए रखने के लिए आसन्न खंडों के बीच टोकन ओवरलैप (डिफ़ॉल्ट: 80)।
</ParamField>

<Note>
`chunking.tokens` या `chunking.overlap` को बदलने से खंड सीमाएँ बदलती हैं और मौजूदा इंडेक्स पहचान अमान्य हो जाती है (प्रदाता चयन के अंतर्गत चेतावनी देखें)।
</Note>

---

## हाइब्रिड खोज कॉन्फ़िगरेशन

सभी `memorySearch.query` के अंतर्गत:

| कुंजी          | प्रकार     | डिफ़ॉल्ट | विवरण                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | इंजेक्शन से पहले लौटाए जाने वाले अधिकतम मेमोरी परिणाम |
| `minScore`   | `number` | `0.35`  | किसी परिणाम को शामिल करने के लिए न्यूनतम प्रासंगिकता स्कोर  |

और `memorySearch.query.hybrid` के अंतर्गत:

| कुंजी                   | प्रकार      | डिफ़ॉल्ट | विवरण                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | हाइब्रिड BM25 + वेक्टर खोज सक्षम करें |
| `vectorWeight`        | `number`  | `0.7`   | वेक्टर स्कोर का भार (0-1)     |
| `textWeight`          | `number`  | `0.3`   | BM25 स्कोर का भार (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | उम्मीदवार पूल आकार गुणक     |

<Tabs>
  <Tab title="MMR (विविधता)">
    | कुंजी           | प्रकार      | डिफ़ॉल्ट | विवरण                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | MMR पुनः रैंकिंग सक्षम करें                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = अधिकतम विविधता, 1 = अधिकतम प्रासंगिकता |
  </Tab>
  <Tab title="कालिक क्षय (नवीनता)">
    | कुंजी                          | प्रकार      | डिफ़ॉल्ट | विवरण               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | नवीनता बूस्ट सक्षम करें      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | प्रत्येक N दिन में स्कोर आधा होता है |

    सदाबहार फ़ाइलों (`MEMORY.md`, `memory/` में बिना तारीख वाली फ़ाइलें) का कभी क्षय नहीं होता।

  </Tab>
</Tabs>

### पूरा उदाहरण

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
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
| `extraPaths` | `string[]` | इंडेक्स करने के लिए अतिरिक्त डायरेक्टरियाँ या फ़ाइलें |

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

पथ निरपेक्ष या कार्यक्षेत्र-सापेक्ष हो सकते हैं। डायरेक्टरियों में `.md` फ़ाइलों के लिए पुनरावर्ती रूप से स्कैन किया जाता है। सिमलिंक प्रबंधन सक्रिय बैकएंड पर निर्भर करता है: अंतर्निहित इंजन सिमलिंक छोड़ देता है, जबकि QMD अंतर्निहित QMD स्कैनर के व्यवहार का पालन करता है।

एजेंट-स्कोप वाले क्रॉस-एजेंट ट्रांसक्रिप्ट खोज के लिए, `memory.qmd.paths` के बजाय `agents.list[].memorySearch.qmd.extraCollections` का उपयोग करें। वे अतिरिक्त संग्रह समान `{ path, name, pattern? }` संरचना का पालन करते हैं, लेकिन उन्हें प्रत्येक एजेंट के अनुसार मर्ज किया जाता है और जब पथ वर्तमान कार्यक्षेत्र के बाहर इंगित करता है, तब स्पष्ट साझा नाम बनाए रख सकते हैं। यदि समान रिज़ॉल्व किया गया पथ `memory.qmd.paths` और `memorySearch.qmd.extraCollections` दोनों में दिखाई देता है, तो QMD पहली प्रविष्टि रखता है और डुप्लिकेट को छोड़ देता है।

---

## मल्टीमॉडल मेमोरी (Gemini)

Gemini Embedding 2 का उपयोग करके Markdown के साथ चित्र और ऑडियो इंडेक्स करें:

| कुंजी                       | प्रकार       | डिफ़ॉल्ट    | विवरण                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | मल्टीमॉडल इंडेक्सिंग सक्षम करें             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, या `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | इंडेक्सिंग के लिए अधिकतम फ़ाइल आकार (10 MiB)    |

<Note>
केवल `extraPaths` में मौजूद फ़ाइलों पर लागू होता है। डिफ़ॉल्ट मेमोरी रूट केवल Markdown तक सीमित रहते हैं। `gemini-embedding-2-preview` आवश्यक है। `fallback` को `"none"` होना चाहिए।
</Note>

समर्थित प्रारूप: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (चित्र); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ऑडियो)।

---

## एम्बेडिंग कैश

| कुंजी                | प्रकार      | डिफ़ॉल्ट | विवरण                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | खंड एम्बेडिंग को SQLite में कैश करें             |
| `cache.maxEntries` | `number`  | सेट नहीं   | कैश की गई एम्बेडिंग की सर्वोत्तम-प्रयास ऊपरी सीमा |

रीइंडेक्स या ट्रांसक्रिप्ट अपडेट के दौरान अपरिवर्तित टेक्स्ट को फिर से एम्बेड होने से रोकता है। असीमित कैश के लिए `maxEntries` को सेट न करें; जब अधिकतम रीइंडेक्स गति की तुलना में डिस्क की वृद्धि अधिक महत्वपूर्ण हो, तब इसे सेट करें। इसे सेट करने पर, कैश द्वारा सीमा पार करते ही सबसे पुरानी प्रविष्टियाँ (अंतिम अपडेट के समय के अनुसार) पहले हटाई जाती हैं।

---

## बैच इंडेक्सिंग

| कुंजी                           | प्रकार      | डिफ़ॉल्ट | विवरण                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | समानांतर इनलाइन एम्बेडिंग |
| `remote.batch.enabled`        | `boolean` | `false` | बैच एम्बेडिंग API सक्षम करें |
| `remote.batch.concurrency`    | `number`  | `2`     | समानांतर बैच जॉब        |
| `remote.batch.wait`           | `boolean` | `true`  | बैच पूरा होने की प्रतीक्षा करें  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | पोल अंतराल              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | बैच टाइमआउट              |

`gemini`, `openai`, और `voyage` के लिए उपलब्ध। बड़े बैकफ़िल के लिए OpenAI बैच आमतौर पर सबसे तेज़ और सबसे सस्ता होता है।

`remote.nonBatchConcurrency` स्थानीय/स्व-होस्टेड प्रदाताओं और होस्टेड प्रदाताओं द्वारा उपयोग की जाने वाली इनलाइन एम्बेडिंग कॉल को नियंत्रित करता है, जब प्रदाता के बैच API सक्रिय नहीं होते। छोटे स्थानीय होस्ट पर अत्यधिक भार पड़ने से बचाने के लिए, गैर-बैच इंडेक्सिंग हेतु Ollama का डिफ़ॉल्ट `1` है; बड़ी मशीनों पर अधिक मान सेट करें।

यह `sync.embeddingBatchTimeoutSeconds` से अलग है, जो इनलाइन एम्बेडिंग कॉल के टाइमआउट को नियंत्रित करता है।

---

## सत्र मेमोरी खोज (प्रायोगिक)

सत्र ट्रांसक्रिप्ट को इंडेक्स करें और उन्हें `memory_search` के माध्यम से उपलब्ध कराएँ:

| कुंजी                           | प्रकार       | डिफ़ॉल्ट      | विवरण                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | सत्र इंडेक्सिंग सक्षम करें                 |
| `sources`                     | `string[]` | `["memory"]` | ट्रांसक्रिप्ट शामिल करने के लिए `"sessions"` जोड़ें |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | रीइंडेक्स के लिए बाइट सीमा              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | रीइंडेक्स के लिए संदेश सीमा           |

<Warning>
सत्र इंडेक्सिंग वैकल्पिक है और एसिंक्रोनस रूप से चलती है। परिणाम थोड़े पुराने हो सकते हैं। सत्र लॉग डिस्क पर रहते हैं, इसलिए फ़ाइल सिस्टम एक्सेस को विश्वास-सीमा मानें।
</Warning>

सत्र ट्रांसक्रिप्ट के परिणाम भी
[`tools.sessions.visibility`](/hi/gateway/config-tools#toolssessions) का पालन करते हैं। डिफ़ॉल्ट
`tree` दृश्यता केवल वर्तमान सत्र और उसके द्वारा बनाए गए सत्रों को प्रदर्शित करती है। किसी भिन्न
सत्र, जैसे DM, से असंबंधित समान-एजेंट Gateway-प्रेषित सत्र को
याद करने के लिए, दृश्यता को जानबूझकर `agent` तक बढ़ाएँ (या केवल `all`
जब क्रॉस-एजेंट रिकॉल भी आवश्यक हो और एजेंट-से-एजेंट नीति इसकी अनुमति देती हो)।

नीचे दिए गए उदाहरण इन सेटिंग्स को `agents.defaults` के अंतर्गत रखते हैं। जब केवल एक
एजेंट को सत्र ट्रांसक्रिप्ट इंडेक्स और खोजने चाहिए, तब प्रति-एजेंट ओवरराइड में समकक्ष
`memorySearch` सेटिंग्स भी लागू की जा सकती हैं।

समान-एजेंट Gateway-से-DM रिकॉल के लिए:

<Tabs>
  <Tab title="अंतर्निर्मित बैकएंड">
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
  <Tab title="QMD बैकएंड">
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
`sources: ["sessions"]` अपने आप ट्रांसक्रिप्ट को QMD में निर्यात नहीं करते। साथ ही
`memory.qmd.sessions.enabled: true` भी सेट करें।

---

## SQLite वेक्टर त्वरण (sqlite-vec)

| कुंजी                          | प्रकार      | डिफ़ॉल्ट | विवरण                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | वेक्टर क्वेरी के लिए sqlite-vec का उपयोग करें |
| `store.vector.extensionPath` | `string`  | बंडल किया हुआ | sqlite-vec पथ को ओवरराइड करें          |

जब sqlite-vec उपलब्ध नहीं होता, तो OpenClaw स्वचालित रूप से इन-प्रोसेस कोसाइन समानता का उपयोग करता है।

---

## इंडेक्स संग्रहण

अंतर्निर्मित मेमोरी इंडेक्स प्रत्येक एजेंट के OpenClaw SQLite डेटाबेस में
`agents/<agentId>/agent/openclaw-agent.sqlite` पर रहते हैं।

| कुंजी                   | प्रकार     | डिफ़ॉल्ट     | विवरण                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 टोकनाइज़र (`unicode61` या `trigram`) |

---

## QMD बैकएंड कॉन्फ़िगरेशन

सक्षम करने के लिए `memory.backend = "qmd"` सेट करें। सभी QMD सेटिंग्स `memory.qmd` के अंतर्गत रहती हैं:

| कुंजी                      | प्रकार      | डिफ़ॉल्ट  | विवरण                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD निष्पादन योग्य फ़ाइल का पथ; जब सेवा `PATH` आपके शेल से भिन्न हो, तब पूर्ण पथ सेट करें |
| `searchMode`             | `string`  | `search` | खोज कमांड: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | QMD री-रैंकिंग छोड़ने के लिए `searchMode: "query"` और QMD 2.1+ के साथ `false` पर सेट करें          |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` को स्वतः इंडेक्स करें                                             |
| `paths[]`                | `array`   | --       | अतिरिक्त पथ: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | सत्र ट्रांसक्रिप्ट को QMD में निर्यात करें                                                   |
| `sessions.retentionDays` | `number`  | --       | ट्रांसक्रिप्ट प्रतिधारण                                                                  |
| `sessions.exportDir`     | `string`  | --       | निर्यात निर्देशिका                                                                      |

`searchMode: "search"` केवल लेक्सिकल/BM25 है। OpenClaw उस मोड के लिए, `memory status --deep` के दौरान भी, सिमेंटिक वेक्टर तत्परता जाँच या QMD एम्बेडिंग रखरखाव नहीं चलाता; `vsearch` और `query` के लिए QMD वेक्टर तत्परता और एम्बेडिंग की आवश्यकता बनी रहती है।

`rerank: false` केवल QMD के `query` मोड को बदलता है और इसके लिए QMD 2.1 या नया संस्करण आवश्यक है। प्रत्यक्ष CLI मोड में OpenClaw `--no-rerank` पास करता है; mcporter-समर्थित MCP मोड में यह QMD के एकीकृत क्वेरी टूल को `rerank: false` पास करता है। QMD के डिफ़ॉल्ट क्वेरी री-रैंकिंग व्यवहार का उपयोग करने के लिए इसे सेट न करें।

OpenClaw वर्तमान QMD संग्रह और MCP क्वेरी संरचनाओं को प्राथमिकता देता है, लेकिन आवश्यकता पड़ने पर संगत संग्रह पैटर्न फ़्लैग और पुराने MCP टूल नाम आज़माकर पुराने QMD रिलीज़ को भी कार्यशील रखता है। जब QMD एकाधिक संग्रह फ़िल्टर के समर्थन की सूचना देता है, तो समान-स्रोत संग्रह एक ही QMD प्रोसेस से खोजे जाते हैं; पुराने QMD बिल्ड प्रति-संग्रह संगतता पथ का उपयोग जारी रखते हैं। समान-स्रोत का अर्थ है कि स्थायी मेमोरी संग्रह (डिफ़ॉल्ट मेमोरी फ़ाइलें और कस्टम पथ) एक साथ समूहीकृत होते हैं, जबकि सत्र ट्रांसक्रिप्ट संग्रह अलग समूह बने रहते हैं, ताकि स्रोत विविधीकरण में दोनों इनपुट बने रहें।

<Note>
QMD मॉडल ओवरराइड QMD की ओर ही रहते हैं, OpenClaw कॉन्फ़िगरेशन में नहीं। यदि QMD के मॉडल को वैश्विक रूप से ओवरराइड करना आवश्यक हो, तो Gateway रनटाइम परिवेश में `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, और `QMD_GENERATE_MODEL` जैसे परिवेश चर सेट करें।
</Note>

### mcporter एकीकरण

सभी सेटिंग्स `memory.qmd.mcporter` के अंतर्गत हैं। प्रति क्वेरी `qmd` प्रारंभ करने के बजाय QMD खोजों को लंबे समय तक चलने वाले `mcporter` MCP डेमन से रूट करता है, जिससे बड़े मॉडल के लिए कोल्ड-स्टार्ट ओवरहेड घटता है।

| कुंजी           | प्रकार      | डिफ़ॉल्ट | विवरण                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | प्रति अनुरोध `qmd` प्रारंभ करने के बजाय QMD कॉल को mcporter से रूट करें |
| `serverName`  | `string`  | `qmd`   | mcporter सर्वर का नाम, जो `lifecycle: keep-alive` के साथ `qmd mcp` चलाता है  |
| `startDaemon` | `boolean` | `true`  | `enabled` के सत्य होने पर mcporter डेमन को स्वचालित रूप से प्रारंभ करें         |

इसके लिए `mcporter` का इंस्टॉल और PATH पर उपलब्ध होना, साथ ही `qmd mcp` चलाने वाला कॉन्फ़िगर किया हुआ mcporter सर्वर आवश्यक है। जहाँ प्रति-क्वेरी प्रोसेस प्रारंभ करने की लागत स्वीकार्य हो, ऐसे सरल स्थानीय सेटअप के लिए इसे अक्षम रखें।

<AccordionGroup>
  <Accordion title="अपडेट शेड्यूल">
    | कुंजी                       | प्रकार      | डिफ़ॉल्ट | विवरण                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | रीफ़्रेश अंतराल                      |
    | `update.debounceMs`       | `number`  | `15000` | फ़ाइल परिवर्तनों का डिबाउंस                 |
    | `update.onBoot`           | `boolean` | `true`  | लंबे समय तक चलने वाला QMD प्रबंधक खुलने पर रीफ़्रेश करें; तत्काल बूट अपडेट छोड़ने के लिए false सेट करें |
    | `update.startup`          | `string`  | `off`   | वैकल्पिक Gateway-प्रारंभ QMD आरंभीकरण: `off`, `idle`, या `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` रीफ़्रेश चलने से पहले विलंब |
    | `update.waitForBootSync`  | `boolean` | `false` | प्रबंधक को तब तक खुलने से रोकें, जब तक उसका प्रारंभिक रीफ़्रेश पूरा न हो जाए |
    | `update.embedInterval`    | `string`  | `60m`   | अलग एम्बेड आवृत्ति                |
    | `update.commandTimeoutMs` | `number`  | `30000` | QMD रखरखाव कमांडों (संग्रह सूची/जोड़ना) के लिए टाइमआउट |
    | `update.updateTimeoutMs`  | `number`  | `120000` | प्रत्येक `qmd update` चक्र के लिए टाइमआउट   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | प्रत्येक `qmd embed` चक्र के लिए टाइमआउट    |
  </Accordion>
  <Accordion title="सीमाएँ">
    | कुंजी                       | प्रकार     | डिफ़ॉल्ट | विवरण                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | अधिकतम खोज परिणाम         |
    | `limits.maxSnippetChars`  | `number` | `450`   | स्निपेट की लंबाई सीमित करें       |
    | `limits.maxInjectedChars` | `number` | `2200`  | इंजेक्ट किए गए कुल वर्ण सीमित करें |
    | `limits.timeoutMs`        | `number` | `4000`  | QMD-समर्थित खोज के दौरान QMD कमांड टाइमआउट, जिसमें `memory_search` शामिल है; सेटअप, सिंक, अंतर्निहित फ़ॉलबैक और पूरक कार्य डिफ़ॉल्ट टूल समय-सीमा बनाए रखते हैं |
  </Accordion>
  <Accordion title="दायरा">
    यह नियंत्रित करता है कि कौन-से सत्र QMD खोज परिणाम प्राप्त कर सकते हैं। [`session.sendPolicy`](/hi/gateway/config-agents#session) के समान स्कीमा:

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

    शिप किया गया डिफ़ॉल्ट केवल DM/प्रत्यक्ष है, जो समूहों और अन्य चैनल प्रकारों को अस्वीकार करता है। `match.keyPrefix` सामान्यीकृत सत्र कुंजी से मेल खाता है; `match.rawKeyPrefix`, `agent:<id>:` सहित कच्ची कुंजी से मेल खाता है।

  </Accordion>
  <Accordion title="उद्धरण">
    `memory.citations` सभी बैकएंड पर लागू होता है:

    | मान            | व्यवहार                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (डिफ़ॉल्ट) | स्निपेट में `Source: <path#line>` पादलेख शामिल करें    |
    | `on`             | पादलेख हमेशा शामिल करें                               |
    | `off`            | पादलेख छोड़ दें (पथ फिर भी आंतरिक रूप से एजेंट को दिया जाता है) |

  </Accordion>
</AccordionGroup>

जब Gateway-प्रारंभ QMD आरंभीकरण सक्षम होता है, तो OpenClaw केवल पात्र एजेंटों के लिए QMD प्रारंभ करता है। यदि `update.onBoot` true है और कोई अंतराल/एम्बेड रखरखाव कॉन्फ़िगर नहीं है, तो स्टार्टअप बूट रीफ़्रेश के लिए एक बार चलने वाला प्रबंधक उपयोग करता है और उसे बंद कर देता है। यदि कोई अपडेट या एम्बेड अंतराल कॉन्फ़िगर है, तो स्टार्टअप लंबे समय तक चलने वाला QMD प्रबंधक खोलता है, ताकि वह वॉचर और अंतराल टाइमरों का स्वामित्व ले सके; `update.onBoot: false` केवल तत्काल बूट रीफ़्रेश को छोड़ता है।

### पूर्ण QMD उदाहरण

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
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

Dreaming को `plugins.entries.memory-core.config.dreaming` के अंतर्गत कॉन्फ़िगर किया जाता है, `agents.defaults.memorySearch` के अंतर्गत नहीं।

Dreaming एक निर्धारित स्वीप के रूप में चलता है और कार्यान्वयन विवरण के रूप में आंतरिक हल्के/गहरे/REM चरणों का उपयोग करता है।

अवधारणात्मक व्यवहार और स्लैश कमांडों के लिए, [Dreaming](/hi/concepts/dreaming) देखें।

### उपयोगकर्ता सेटिंग्स

| कुंजी                                    | प्रकार      | डिफ़ॉल्ट       | विवरण                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming को पूरी तरह सक्षम या अक्षम करें                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | पूर्ण Dreaming स्वीप के लिए वैकल्पिक Cron आवृत्ति                                                                                |
| `model`                                | `string`  | डिफ़ॉल्ट मॉडल | वैकल्पिक Dream Diary सबएजेंट मॉडल ओवरराइड                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md` में पदोन्नत किए गए प्रत्येक अल्पकालिक स्मरण स्निपेट से रखे जाने वाले अधिकतम अनुमानित टोकन; उद्गम मेटाडेटा दृश्यमान रहता है |

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
- Dreaming मशीन स्थिति को `memory/.dreams/` में लिखता है।
- Dreaming मानव-पठनीय वर्णनात्मक आउटपुट को `DREAMS.md` (या मौजूदा `dreams.md`) में लिखता है।
- `dreaming.model` मौजूदा Plugin सबएजेंट विश्वास गेट का उपयोग करता है; इसे सक्षम करने से पहले `plugins.entries.memory-core.subagent.allowModelOverride: true` सेट करें।
- कॉन्फ़िगर किया गया मॉडल अनुपलब्ध होने पर Dream Diary सत्र के डिफ़ॉल्ट मॉडल के साथ एक बार पुनः प्रयास करता है। विश्वास या अनुमति-सूची विफलताएँ लॉग की जाती हैं और उनके लिए चुपचाप पुनः प्रयास नहीं किया जाता।
- हल्के/गहरे/REM चरणों की नीति और सीमाएँ आंतरिक व्यवहार हैं, उपयोगकर्ता-सामना कॉन्फ़िगरेशन नहीं।

</Note>

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [मेमोरी अवलोकन](/hi/concepts/memory)
- [मेमोरी खोज](/hi/concepts/memory-search)
