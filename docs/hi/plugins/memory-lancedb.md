---
read_when:
    - आप memory-lancedb Plugin कॉन्फ़िगर कर रहे हैं
    - आप auto-recall या auto-capture के साथ LanceDB-समर्थित दीर्घकालिक मेमोरी चाहते हैं
    - आप Ollama जैसे स्थानीय OpenAI-संगत एम्बेडिंग का उपयोग कर रहे हैं
sidebarTitle: Memory LanceDB
summary: आधिकारिक बाहरी LanceDB मेमोरी Plugin को कॉन्फ़िगर करें, जिसमें स्थानीय Ollama-संगत एम्बेडिंग शामिल हैं
title: मेमोरी LanceDB
x-i18n:
    generated_at: "2026-07-19T09:38:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 771b28b9775175f53d3e6543e66618a56dd40ef95598c00c7abf9b62fb261e47
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` एक आधिकारिक बाहरी Plugin है जो वेक्टर खोज के साथ
LanceDB में दीर्घकालिक मेमोरी संग्रहीत करता है। यह मॉडल की बारी से पहले प्रासंगिक
मेमोरी को स्वतः पुनः प्राप्त कर सकता है और प्रतिक्रिया के बाद महत्वपूर्ण तथ्यों को स्वतः कैप्चर कर सकता है।

इसे स्थानीय वेक्टर डेटाबेस, OpenAI-संगत एम्बेडिंग एंडपॉइंट, या
डिफ़ॉल्ट अंतर्निहित मेमोरी बैकएंड से बाहर स्थित मेमोरी स्टोर के लिए उपयोग करें।

## इंस्टॉलेशन

```bash
openclaw plugins install @openclaw/memory-lancedb
```

यह Plugin npm पर प्रकाशित है; इसे OpenClaw रनटाइम
इमेज में बंडल नहीं किया गया है। इसे इंस्टॉल करने पर Plugin प्रविष्टि लिखी जाती है, वह सक्षम होता है, और
`plugins.slots.memory` को `memory-lancedb` पर स्विच किया जाता है। यदि वर्तमान में कोई अन्य Plugin
मेमोरी स्लॉट का स्वामी है, तो उस Plugin को चेतावनी के साथ अक्षम कर दिया जाता है।

<Note>
`memory-wiki` जैसे सहयोगी Plugin, `memory-lancedb` के साथ चल सकते हैं,
लेकिन एक समय में केवल एक Plugin सक्रिय मेमोरी स्लॉट का स्वामी होता है।
</Note>

<Note>
LanceDB के `memory_recall` को `memorySearch.rememberAcrossConversations` द्वारा उपयोग किया जाने वाला
संरक्षित निजी ट्रांसक्रिप्ट प्राधिकरण प्राप्त नहीं होता। [उन्नत Active Memory](/hi/concepts/active-memory#lancedb-memory)
के माध्यम से LanceDB के `autoRecall` या उसके `memory_recall` टूल का उपयोग करें।
जब वर्तमान मेमोरी प्रदाता के साथ वार्तालापों में याद रखना उपलब्ध नहीं होता,
तो `openclaw doctor` इसकी सूचना देता है।
</Note>

## त्वरित शुरुआत

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Plugin कॉन्फ़िगरेशन बदलने के बाद Gateway पुनः आरंभ करें, फिर सत्यापित करें कि वह लोड हुआ है:

```bash
openclaw gateway restart
openclaw plugins list
```

## एम्बेडिंग कॉन्फ़िगरेशन

`embedding` आवश्यक है और इसमें कम-से-कम एक फ़ील्ड होना चाहिए। `provider`
का डिफ़ॉल्ट `openai` है; `model` का डिफ़ॉल्ट `text-embedding-3-small` है।

| फ़ील्ड                  | प्रकार          | टिप्पणियाँ                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | स्ट्रिंग        | अडैप्टर आईडी, जैसे `openai`, `github-copilot`, `ollama`। डिफ़ॉल्ट `openai`। |
| `embedding.model`      | स्ट्रिंग        | डिफ़ॉल्ट `text-embedding-3-small`।                                        |
| `embedding.apiKey`     | स्ट्रिंग        | वैकल्पिक; `${ENV_VAR}` विस्तार का समर्थन करता है।                               |
| `embedding.baseUrl`    | स्ट्रिंग        | वैकल्पिक; `${ENV_VAR}` विस्तार का समर्थन करता है।                               |
| `embedding.dimensions` | पूर्णांक (>=1) | अंतर्निहित तालिका में शामिल न होने वाले मॉडल के लिए आवश्यक (नीचे देखें)।               |

दो अनुरोध पथ उपलब्ध हैं:

- **प्रदाता अडैप्टर पथ** (डिफ़ॉल्ट): `embedding.provider` सेट करें और
  `embedding.apiKey`/`embedding.baseUrl` को छोड़ दें। Plugin, प्रदाता की
  कॉन्फ़िगर की गई प्रमाणीकरण प्रोफ़ाइल, पर्यावरण चर, या
  `models.providers.<provider>.apiKey` को उन्हीं मेमोरी एम्बेडिंग
  अडैप्टरों के माध्यम से हल करता है जिनका उपयोग `memory-core` करता है। यह `github-copilot`, `ollama`,
  और एम्बेडिंग समर्थन वाले किसी भी अन्य बंडल प्रदाता के लिए निर्धारित पथ है।
- **प्रत्यक्ष OpenAI-संगत क्लाइंट पथ**: `embedding.provider` को सेट न करें
  (या `"openai"`) और `embedding.apiKey` के साथ `embedding.baseUrl` सेट करें। इसका उपयोग
  ऐसे मूल OpenAI-संगत एम्बेडिंग एंडपॉइंट के लिए करें जिसका कोई बंडल प्रदाता
  अडैप्टर नहीं है।

OpenAI Codex / ChatGPT OAuth, OpenAI Platform का एम्बेडिंग क्रेडेंशियल नहीं है।
OpenAI एम्बेडिंग के लिए OpenAI API कुंजी प्रमाणीकरण प्रोफ़ाइल, `OPENAI_API_KEY`, या
`models.providers.openai.apiKey` का उपयोग करें। केवल OAuth वाले उपयोगकर्ताओं को
`github-copilot` या `ollama` जैसे किसी अन्य एम्बेडिंग-सक्षम प्रदाता को चुनना चाहिए।

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

कुछ OpenAI-संगत एम्बेडिंग एंडपॉइंट `encoding_format`
पैरामीटर को अस्वीकार करते हैं; अन्य इसे अनदेखा करते हैं और हमेशा `number[]` लौटाते हैं। `memory-lancedb`
अनुरोधों में `encoding_format` को छोड़ देता है और फ़्लोट-सरणी या
base64-एन्कोडेड float32 प्रतिक्रियाओं में से किसी को स्वीकार करता है, इसलिए दोनों प्रतिक्रिया स्वरूप बिना कॉन्फ़िगरेशन के काम करते हैं।

### आयाम

OpenClaw में केवल `text-embedding-3-small` (1536) और
`text-embedding-3-large` (3072) के लिए अंतर्निहित आयाम है। किसी भी अन्य मॉडल के लिए स्पष्ट
`embedding.dimensions` आवश्यक है, ताकि LanceDB वेक्टर कॉलम बना सके, उदाहरण के लिए
2048 आयाम वाला ZhiPu `embedding-3`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ollama एम्बेडिंग

बंडल किए गए Ollama प्रदाता अडैप्टर पथ (`embedding.provider: "ollama"`) का उपयोग करें।
यह Ollama के मूल `/api/embed` एंडपॉइंट को कॉल करता है और [Ollama](/hi/providers/ollama)
प्रदाता वाले समान प्रमाणीकरण/आधार URL नियमों का पालन करता है।

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` अंतर्निहित आयाम तालिका में नहीं है, इसलिए `dimensions`
आवश्यक है। छोटे स्थानीय एम्बेडिंग मॉडल के लिए, यदि स्थानीय सर्वर संदर्भ-लंबाई त्रुटियाँ
लौटाता है तो `recallMaxChars` घटाएँ।

## पुनः प्राप्ति और कैप्चर सीमाएँ

| सेटिंग           | डिफ़ॉल्ट | सीमा                        | इस पर लागू                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | पुनः प्राप्ति के लिए एम्बेडिंग API को भेजा गया टेक्स्ट।                 |
| `captureMaxChars` | `500`   | 100-10000                    | स्वतः कैप्चर के योग्य संदेश की लंबाई।                  |
| `customTriggers`  | `[]`    | 0-50 आइटम, प्रत्येक <=100 वर्ण | ऐसे शाब्दिक वाक्यांश जिनके कारण स्वतः कैप्चर किसी संदेश पर विचार करता है। |

`recallMaxChars`, `before_prompt_build` स्वतः पुनः प्राप्ति क्वेरी,
`memory_recall` टूल, `memory_forget` क्वेरी पथ, और `openclaw ltm
search` को सीमित करता है। स्वतः पुनः प्राप्ति बारी के नवीनतम उपयोगकर्ता संदेश को एम्बेड करती है और
केवल उपयोगकर्ता संदेश मौजूद न होने पर पूर्ण प्रॉम्प्ट का उपयोग करती है, जिससे चैनल
मेटाडेटा और बड़े प्रॉम्प्ट ब्लॉक एम्बेडिंग अनुरोध से बाहर रहते हैं।

`captureMaxChars` यह नियंत्रित करता है कि बारी के `agent_end`
ईवेंट से प्राप्त उपयोगकर्ता संदेश स्वतः कैप्चर के लिए विचार किए जाने योग्य रूप से पर्याप्त छोटा है या नहीं; यह
पुनः प्राप्ति क्वेरी को प्रभावित नहीं करता।

`customTriggers` रेगेक्स के बिना शाब्दिक स्वतः कैप्चर वाक्यांश जोड़ता है। अंतर्निहित
ट्रिगर सामान्य अंग्रेज़ी, चेक, चीनी, जापानी और कोरियाई मेमोरी
वाक्यांशों (`remember`, `prefer`, `记住`, `覚えて`, `기억해`, और इसी तरह के) को कवर करते हैं।

स्वतः कैप्चर ऐसे टेक्स्ट को भी अस्वीकार करता है जो एन्वेलप/ट्रांसपोर्ट मेटाडेटा,
प्रॉम्प्ट-इंजेक्शन पेलोड, या पहले से इंजेक्ट किए गए `<relevant-memories>` संदर्भ जैसा दिखता है,
और प्रत्येक एजेंट बारी में अधिकतम 3 कैप्चर की गई मेमोरी की सीमा लागू करता है।

प्रत्येक मेमोरी का स्वामी एक एजेंट होता है। पुनः प्राप्ति, डुप्लिकेट पहचान, कैप्चर,
सूचीकरण, मूल क्वेरी और हटाना—सभी पंक्तियाँ लौटाने या
बदलने से पहले उस स्वामी को लागू करते हैं। `memorySearch.enabled: false` वाला एजेंट (`agents.list[]`
में या `agents.defaults` के माध्यम से) `memory_recall`, `memory_store`,
या `memory_forget` टूल में से कोई भी प्राप्त नहीं करता और स्वचालित पुनः प्राप्ति या
कैप्चर में भाग नहीं लेता, भले ही Plugin-स्तरीय `autoRecall`/`autoCapture` फ़्लैग चालू हों।

## कमांड

`memory-lancedb` इंस्टॉल होने पर हमेशा `ltm` CLI नेमस्पेस पंजीकृत करता है
(केवल सक्रिय मेमोरी स्लॉट का स्वामी होने पर नहीं):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` सीधे LanceDB तालिका पर एक गैर-वेक्टर क्वेरी चलाता है:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| फ़्लैग                              | डिफ़ॉल्ट                                 | टिप्पणियाँ                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | कॉन्फ़िगर किया गया डिफ़ॉल्ट एजेंट                | निजी एजेंट नेमस्पेस चुनता है। `list`, `search`, `query`, और `stats` पर उपलब्ध।                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | कॉमा से अलग की गई कॉलम अनुमति-सूची।                                                                                                         |
| `--filter <condition>`            | कोई नहीं                                    | आउटपुट कॉलम पर एक तुलना, जैसे `category = 'preference'` या `importance >= 0.8`। स्ट्रिंग मान उद्धरण चिह्नों में होने चाहिए।             |
| `--limit <n>`                     | `10`                                    | धनात्मक पूर्णांक।                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | कोई नहीं                                    | फ़िल्टर चलने के बाद मेमोरी में क्रमबद्ध; सॉर्ट कॉलम स्वचालित रूप से प्रोजेक्शन में जोड़ा जाता है और यदि उसका अनुरोध नहीं किया गया था, तो आउटपुट से हटा दिया जाता है। |

एजेंट को सक्रिय मेमोरी Plugin से तीन टूल मिलते हैं:

- `memory_recall`: संग्रहीत मेमोरी पर वेक्टर खोज।
- `memory_store`: तथ्य, प्राथमिकता, निर्णय या एंटिटी सहेजता है (ऐसे टेक्स्ट को अस्वीकार करता है
  जो प्रॉम्प्ट-इंजेक्शन पेलोड जैसा दिखता है; लगभग डुप्लिकेट स्टोर छोड़ देता है)।
- `memory_forget`: `memoryId` द्वारा, या `query` द्वारा हटाता है (90% से अधिक स्कोर वाला एकल
  मिलान स्वतः हटा देता है, अन्यथा अस्पष्टता दूर करने के लिए उम्मीदवार आईडी सूचीबद्ध करता है)।

## स्टोरेज

LanceDB डेटा का डिफ़ॉल्ट `~/.openclaw/memory/lancedb` है। `dbPath` से ओवरराइड करें:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Plugin एक LanceDB तालिका रखता है और प्रत्येक
पंक्ति में सामान्यीकृत एजेंट स्वामी संग्रहीत करता है। यह स्टोरेज सीमा है, खोज-पश्चात फ़िल्टर नहीं: एजेंट स्वामित्व
वेक्टर रैंकिंग से पहले लागू होता है और सूची, क्वेरी, गणना तथा हटाने के
प्रेडिकेट में शामिल होता है। `ltm query --filter` सार्वजनिक आउटपुट कॉलम पर एक सत्यापित तुलना स्वीकार करता है।
स्टोर उस तुलना को अनिवार्य स्वामी प्रेडिकेट से अलग बनाता है,
इसलिए फ़िल्टर क्वेरी को किसी अन्य एजेंट तक विस्तृत नहीं कर सकता।

प्रति-एजेंट स्वामित्व से पहले बनाए गए डेटाबेस में पंक्ति के उद्गम का कोई विश्वसनीय विवरण नहीं होता।
अपग्रेड पर, `openclaw doctor --fix` उन पुरानी पंक्तियों को एक बार
कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट को असाइन करता है। वह माइग्रेशन पूरा होने तक रनटाइम पहुँच
बंद रहती है; अन्य एजेंट पुरानी साझा पंक्तियों को कभी प्राप्त नहीं करते।

`storageOptions` LanceDB स्टोरेज बैकएंड (जैसे S3-संगत ऑब्जेक्ट स्टोरेज) के लिए स्ट्रिंग कुंजी/मान युग्म स्वीकार करता है और `${ENV_VAR}` विस्तार का समर्थन करता है:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## रनटाइम निर्भरताएँ और प्लेटफ़ॉर्म समर्थन

`memory-lancedb` नेटिव `@lancedb/lancedb` पैकेज पर निर्भर करता है, जिसका स्वामित्व Plugin पैकेज के पास है (OpenClaw कोर डिस्ट्रीब्यूशन के पास नहीं)। Gateway स्टार्टअप Plugin निर्भरताओं की मरम्मत नहीं करता; यदि नेटिव निर्भरता अनुपलब्ध है या लोड होने में विफल रहती है, तो Plugin पैकेज को फिर से इंस्टॉल या अपडेट करें और Gateway को पुनः आरंभ करें।

`@lancedb/lancedb`, `darwin-x64` (Intel Mac) के लिए नेटिव बिल्ड प्रकाशित नहीं करता। उस प्लेटफ़ॉर्म पर Plugin लोड होते समय लॉग करता है कि LanceDB अनुपलब्ध है; डिफ़ॉल्ट मेमोरी बैकएंड का उपयोग करें, Gateway को किसी समर्थित प्लेटफ़ॉर्म/आर्किटेक्चर पर चलाएँ, या `memory-lancedb` को अक्षम करें।

## समस्या निवारण

### इनपुट की लंबाई कॉन्टेक्स्ट लंबाई से अधिक है

एम्बेडिंग मॉडल ने रिकॉल क्वेरी अस्वीकार कर दी:

```text
memory-lancedb: रिकॉल विफल: त्रुटि: 400 इनपुट की लंबाई कॉन्टेक्स्ट लंबाई से अधिक है
```

`recallMaxChars` को कम करें, फिर Gateway को पुनः आरंभ करें:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Ollama के लिए यह भी सत्यापित करें कि एम्बेडिंग सर्वर के नेटिव एम्बेड एंडपॉइंट का उपयोग करके Gateway होस्ट से उस तक पहुँचा जा सकता है:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### असमर्थित एम्बेडिंग मॉडल

`embedding.dimensions` के बिना, केवल अंतर्निहित OpenAI एम्बेडिंग आयाम ज्ञात होते हैं (`text-embedding-3-small`, `text-embedding-3-large`)। किसी भी अन्य मॉडल के लिए, `embedding.dimensions` को उस मॉडल द्वारा रिपोर्ट किए गए वेक्टर आकार पर सेट करें।

### Plugin लोड होता है, लेकिन कोई मेमोरी दिखाई नहीं देती

पुष्टि करें कि `plugins.slots.memory`, `memory-lancedb` की ओर इंगित करता है, फिर चलाएँ:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

यदि `autoCapture` अक्षम है, तो Plugin मौजूदा मेमोरी को अभी भी रिकॉल करता है, लेकिन नई मेमोरी को स्वचालित रूप से संग्रहीत नहीं करता। `memory_store` टूल का उपयोग करें, या `autoCapture` को सक्षम करें।

## संबंधित

- [मेमोरी का अवलोकन](/hi/concepts/memory)
- [Active Memory](/hi/concepts/active-memory)
- [मेमोरी खोज](/hi/concepts/memory-search)
- [मेमोरी विकी](/hi/plugins/memory-wiki)
- [Ollama](/hi/providers/ollama)
