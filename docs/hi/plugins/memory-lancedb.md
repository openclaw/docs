---
read_when:
    - आप memory-lancedb Plugin कॉन्फ़िगर कर रहे हैं
    - आप LanceDB-समर्थित दीर्घकालिक मेमोरी चाहते हैं, जिसमें स्वतः-स्मरण या स्वतः-कैप्चर हो
    - आप Ollama जैसे स्थानीय OpenAI-संगत embeddings का उपयोग कर रहे हैं
sidebarTitle: Memory LanceDB
summary: आधिकारिक बाहरी LanceDB मेमोरी plugin को कॉन्फ़िगर करें, जिसमें स्थानीय Ollama-संगत embeddings शामिल हैं
title: मेमोरी LanceDB
x-i18n:
    generated_at: "2026-06-28T23:37:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` एक आधिकारिक बाहरी memory plugin है, जो दीर्घकालिक memory को
LanceDB में संग्रहीत करता है और recall के लिए embeddings का उपयोग करता है। यह model turn से पहले
संबंधित memories को स्वचालित रूप से recall कर सकता है और response के बाद महत्वपूर्ण तथ्य capture कर सकता है।

इसका उपयोग तब करें जब आपको memory के लिए local vector database चाहिए, किसी
OpenAI-संगत embedding endpoint की आवश्यकता हो, या आप memory database को default built-in memory store से बाहर रखना चाहते हों।

## स्थापना

`plugins.slots.memory = "memory-lancedb"` सेट करने से पहले `memory-lancedb` इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

यह plugin npm पर प्रकाशित है और OpenClaw runtime image में bundled नहीं है।
installer plugin entry लिखता है और memory slot को तब switch करता है जब कोई अन्य
plugin उसका owner न हो।

<Note>
`memory-lancedb` एक active memory plugin है। इसे `plugins.slots.memory = "memory-lancedb"` के साथ memory
slot चुनकर enable करें। `memory-wiki` जैसे companion plugins इसके साथ चल सकते हैं, लेकिन active memory slot का owner केवल एक plugin होता है।
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

plugin config बदलने के बाद Gateway को restart करें:

```bash
openclaw gateway restart
```

फिर सत्यापित करें कि plugin loaded है:

```bash
openclaw plugins list
```

## Provider-backed embeddings

`memory-lancedb`, `memory-core` जैसे ही memory embedding provider adapters का उपयोग कर सकता है।
provider के configured auth profile, environment variable, या
`models.providers.<provider>.apiKey` का उपयोग करने के लिए `embedding.provider` सेट करें और `embedding.apiKey` छोड़ दें।

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
        },
      },
    },
  },
}
```

यह path उन provider auth profiles के साथ काम करता है जो embedding credentials expose करते हैं।
उदाहरण के लिए, GitHub Copilot का उपयोग तब किया जा सकता है जब Copilot profile/plan
embeddings का समर्थन करता हो:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth कोई OpenAI Platform embeddings credential नहीं है।
OpenAI embeddings के लिए, OpenAI API key auth profile,
`OPENAI_API_KEY`, या `models.providers.openai.apiKey` का उपयोग करें। केवल OAuth वाले users
GitHub Copilot या Ollama जैसे किसी अन्य embedding-capable provider का उपयोग कर सकते हैं।

## Ollama embeddings

Ollama embeddings के लिए bundled Ollama embedding provider को प्राथमिकता दें। यह native Ollama
`/api/embed` endpoint का उपयोग करता है और [Ollama](/hi/providers/ollama) में documented Ollama provider जैसे ही auth/base URL rules का पालन करता है।

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

non-standard embedding models के लिए `dimensions` सेट करें। OpenClaw को
`text-embedding-3-small` और `text-embedding-3-large` के dimensions पता हैं; custom
models को config में value चाहिए ताकि LanceDB vector column बना सके।

छोटे local embedding models के लिए, यदि local server से context
length errors दिखें तो `recallMaxChars` कम करें।

## OpenAI-compatible providers

कुछ OpenAI-compatible embedding providers `encoding_format`
parameter को reject करते हैं, जबकि कुछ उसे ignore करके हमेशा `number[]` vectors लौटाते हैं।
इसलिए `memory-lancedb` embedding requests पर `encoding_format` छोड़ देता है और
float-array responses या base64-encoded float32 responses, दोनों स्वीकार करता है।

यदि आपके पास raw OpenAI-compatible embeddings endpoint है जिसके लिए कोई
bundled provider adapter नहीं है, तो `embedding.provider` छोड़ दें (या उसे `openai` ही रहने दें) और
`embedding.apiKey` के साथ `embedding.baseUrl` सेट करें। इससे direct
OpenAI-compatible client path सुरक्षित रहता है।

उन providers के लिए `embedding.dimensions` सेट करें जिनके model dimensions built
in नहीं हैं। उदाहरण के लिए, ZhiPu `embedding-3` `2048` dimensions का उपयोग करता है:

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

## Recall और capture limits

`memory-lancedb` में दो अलग-अलग text limits हैं:

| Setting           | Default | Range     | Applies to                                                |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | recall के लिए embedding API को भेजा गया text              |
| `captureMaxChars` | `500`   | 100-10000 | auto-capture के लिए eligible message length               |
| `customTriggers`  | `[]`    | 0-50      | literal phrases जो auto-capture को message consider करवाते हैं |

`recallMaxChars` auto-recall, `memory_recall` tool,
`memory_forget` query path, और `openclaw ltm search` को control करता है। Auto-recall turn से
latest user message को प्राथमिकता देता है और केवल user message उपलब्ध न होने पर
full prompt पर fallback करता है। इससे channel metadata और बड़े prompt blocks
embedding request से बाहर रहते हैं।

`captureMaxChars` यह control करता है कि response automatic capture के लिए consider होने लायक
पर्याप्त छोटा है या नहीं। यह recall query embeddings को cap नहीं करता।

`customTriggers` आपको regular expressions लिखे बिना literal auto-capture phrases जोड़ने देता है।
built-in triggers में common English, Czech,
Chinese, Japanese, और Korean memory phrases शामिल हैं।

## Commands

जब `memory-lancedb` active memory plugin होता है, तो यह `ltm` CLI
namespace register करता है:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

`query` subcommand सीधे LanceDB table के विरुद्ध non-vector query चलाता है:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: comma-separated column allowlist (defaults to `id`, `text`, `importance`, `category`, `createdAt`)।
- `--filter <condition>`: SQL-style WHERE clause; 200 characters पर capped और alphanumerics, comparison operators, quotes, parentheses, तथा safe punctuation के छोटे set तक restricted।
- `--limit <n>`: positive integer; default `10`।
- `--order-by <column>:<asc|desc>`: filter के बाद applied in-memory sort; sort column projection में auto-included होता है।

Agents को active memory plugin से LanceDB memory tools भी मिलते हैं:

- LanceDB-backed recall के लिए `memory_recall`
- महत्वपूर्ण facts, preferences, decisions, और entities save करने के लिए `memory_store`
- matching memories हटाने के लिए `memory_forget`

## Storage

Default रूप से, LanceDB data `~/.openclaw/memory/lancedb` के अंतर्गत रहता है। `dbPath` से
path override करें:

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

`storageOptions`, LanceDB storage backends के लिए string key/value pairs स्वीकार करता है और
`${ENV_VAR}` expansion का समर्थन करता है:

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

## Runtime dependencies

`memory-lancedb` native `@lancedb/lancedb` package पर निर्भर करता है। Packaged
OpenClaw उस package को plugin package का हिस्सा मानता है। Gateway startup
plugin dependencies repair नहीं करता; यदि dependency missing है, तो plugin package reinstall या
update करें और Gateway restart करें।

यदि कोई पुराना install plugin load के दौरान missing `dist/package.json` या missing
`@lancedb/lancedb` error log करता है, तो OpenClaw upgrade करें और
Gateway restart करें।

यदि plugin log करता है कि LanceDB `darwin-x64` पर unavailable है, तो उस machine पर default
memory backend का उपयोग करें, Gateway को supported platform पर move करें, या
`memory-lancedb` disable करें।

## Troubleshooting

### Input length exceeds the context length

इसका सामान्य अर्थ है कि embedding model ने recall query reject कर दी:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

कम `recallMaxChars` सेट करें, फिर Gateway restart करें:

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

Ollama के लिए, यह भी verify करें कि embedding server Gateway host से reachable है:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Unsupported embedding model

`dimensions` के बिना, केवल built-in OpenAI embedding dimensions ज्ञात होते हैं।
local या custom embedding models के लिए, `embedding.dimensions` को उस model द्वारा reported vector
size पर सेट करें।

### Plugin loads but no memories appear

जांचें कि `plugins.slots.memory` `memory-lancedb` की ओर point करता है, फिर चलाएं:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

यदि `autoCapture` disabled है, तो plugin existing memories recall करेगा लेकिन
new ones को automatically store नहीं करेगा। यदि आप automatic capture चाहते हैं, तो `memory_store` tool का उपयोग करें या
`autoCapture` enable करें।

## Related

- [Memory overview](/hi/concepts/memory)
- [Active memory](/hi/concepts/active-memory)
- [Memory search](/hi/concepts/memory-search)
- [Memory Wiki](/hi/plugins/memory-wiki)
- [Ollama](/hi/providers/ollama)
