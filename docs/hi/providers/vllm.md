---
read_when:
    - आप OpenClaw को स्थानीय vLLM सर्वर के साथ चलाना चाहते हैं
    - आप अपने मॉडलों के साथ OpenAI-संगत /v1 endpoints चाहते हैं
summary: OpenClaw को vLLM के साथ चलाएँ (OpenAI-संगत स्थानीय सर्वर)
title: vLLM
x-i18n:
    generated_at: "2026-06-29T00:04:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM ओपन-सोर्स (और कुछ कस्टम) मॉडल को **OpenAI-संगत** HTTP API के जरिए serve कर सकता है। OpenClaw `openai-completions` API का उपयोग करके vLLM से जुड़ता है।

जब आप `VLLM_API_KEY` के साथ opt in करते हैं, तो OpenClaw vLLM से उपलब्ध मॉडल को **स्वतः खोज** भी सकता है (अगर आपका server auth लागू नहीं करता, तो कोई भी value काम करती है)। जब आप कस्टम vLLM base URL भी configure करते हैं, तो discovery को dynamic रखने के लिए `agents.defaults.models` में `vllm/*` का उपयोग करें।

OpenClaw `vllm` को एक स्थानीय OpenAI-संगत provider मानता है, जो
streamed usage accounting को support करता है, इसलिए status/context token counts
`stream_options.include_usage` responses से update हो सकते हैं।

| गुण             | मान                                      |
| ---------------- | ---------------------------------------- |
| Provider ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-संगत) |
| Auth             | `VLLM_API_KEY` environment variable      |
| Default base URL | `http://127.0.0.1:8000/v1`               |

## शुरुआत करना

<Steps>
  <Step title="OpenAI-संगत server के साथ vLLM शुरू करें">
    आपके base URL को `/v1` endpoints expose करने चाहिए (जैसे `/v1/models`, `/v1/chat/completions`)। vLLM आम तौर पर इस पर चलता है:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API key environment variable set करें">
    अगर आपका server auth लागू नहीं करता, तो कोई भी value काम करती है:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="एक मॉडल चुनें">
    इसे अपने vLLM model IDs में से किसी एक से बदलें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## मॉडल discovery (implicit provider)

जब `VLLM_API_KEY` set हो (या auth profile मौजूद हो) और आप `models.providers.vllm` define **नहीं** करते, तो OpenClaw query करता है:

```
GET http://127.0.0.1:8000/v1/models
```

और लौटे हुए IDs को model entries में बदलता है।

<Note>
अगर आप `models.providers.vllm` को स्पष्ट रूप से set करते हैं, तो OpenClaw default रूप से आपके declared models का उपयोग करता है। जब आप चाहते हैं कि OpenClaw उस configured provider के `/models` endpoint को query करे और सभी advertised vLLM models शामिल करे, तो `agents.defaults.models` में `"vllm/*": {}` जोड़ें।
</Note>

## स्पष्ट configuration (manual models)

स्पष्ट config का उपयोग करें जब:

- vLLM किसी अलग host या port पर चलता है
- आप `contextWindow` या `maxTokens` values pin करना चाहते हैं
- आपके server को वास्तविक API key चाहिए (या आप headers control करना चाहते हैं)
- आप trusted loopback, LAN, या Tailscale vLLM endpoint से जुड़ते हैं

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

हर model को manually list किए बिना इस provider को dynamic रखने के लिए, visible model catalog में
provider wildcard जोड़ें:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Advanced configuration

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM को native OpenAI endpoint नहीं, बल्कि proxy-style OpenAI-संगत `/v1` backend माना जाता है।
    इसका अर्थ है:

    | व्यवहार | लागू हुआ? |
    |----------|----------|
    | Native OpenAI request shaping | नहीं |
    | `service_tier` | नहीं भेजा गया |
    | Responses `store` | नहीं भेजा गया |
    | Prompt-cache hints | नहीं भेजे गए |
    | OpenAI reasoning-compat payload shaping | लागू नहीं |
    | Hidden OpenClaw attribution headers | custom base URLs पर inject नहीं किए गए |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    vLLM के जरिए serve किए गए Qwen models के लिए, configured provider
    model row पर `compat.thinkingFormat: "qwen-chat-template"` set करें
    जब server Qwen chat-template kwargs की अपेक्षा करता हो। इस तरह configured models
    binary `/think` profile (`off`, `on`) expose करते हैं, क्योंकि
    Qwen template thinking एक on/off request flag है, OpenAI-style effort
    ladder नहीं।

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw `/think off` को इस पर map करता है:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Non-`off` thinking levels `enable_thinking: true` भेजते हैं। अगर आपका endpoint
    इसके बजाय DashScope-style top-level flags की अपेक्षा करता है, तो request
    root पर `enable_thinking` भेजने के लिए `compat.thinkingFormat: "qwen"` का उपयोग करें।

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 chat-template kwargs का उपयोग करके control कर सकता है कि reasoning
    hidden reasoning के रूप में लौटे या visible answer text के रूप में। जब OpenClaw session
    thinking off के साथ `vllm/nemotron-3-*` का उपयोग करता है, तो bundled vLLM plugin भेजता है:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    इन values को customize करने के लिए, model params के तहत `chat_template_kwargs` set करें।
    अगर आप `params.extra_body.chat_template_kwargs` भी set करते हैं, तो उस value की
    final precedence होती है क्योंकि `extra_body` आखिरी request-body override है।

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen tool calls text के रूप में दिखते हैं">
    पहले सुनिश्चित करें कि vLLM model के लिए सही tool-call parser और chat
    template के साथ शुरू किया गया था। उदाहरण के लिए, vLLM Qwen2.5
    models के लिए `hermes` और Qwen3-Coder models के लिए `qwen3_xml` document करता है।

    लक्षण:

    - skills या tools कभी नहीं चलते
    - assistant raw JSON/XML print करता है, जैसे `{"name":"read","arguments":...}`
    - जब OpenClaw `tool_choice: "auto"` भेजता है, तो vLLM खाली `tool_calls` array लौटाता है

    कुछ Qwen/vLLM combinations structured tool calls केवल तब लौटाते हैं जब
    request `tool_choice: "required"` का उपयोग करता है। उन model entries के लिए,
    OpenAI-संगत request field को `params.extra_body` के साथ force करें:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    `Qwen-Qwen2.5-Coder-32B-Instruct` को इस command से लौटे exact id से बदलें:

    ```bash
    openclaw models list --provider vllm
    ```

    आप CLI से भी वही override apply कर सकते हैं:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    यह opt-in compatibility workaround है। यह tools के साथ हर model turn को
    tool call require कराता है, इसलिए इसका उपयोग केवल dedicated local model entry के लिए करें
    जहां यह behavior स्वीकार्य हो। इसे सभी vLLM models के लिए global default के रूप में
    उपयोग न करें, और ऐसा proxy उपयोग न करें जो arbitrary
    assistant text को blindly executable tool calls में बदल देता हो।

  </Accordion>

  <Accordion title="Custom base URL">
    अगर आपका vLLM server non-default host या port पर चलता है, तो explicit provider config में `baseUrl` set करें:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Troubleshooting

<AccordionGroup>
  <Accordion title="धीमा पहला response या remote server timeout">
    बड़े local models, remote LAN hosts, या tailnet links के लिए,
    provider-scoped request timeout set करें:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` केवल vLLM model HTTP requests पर लागू होता है, जिसमें
    connection setup, response headers, body streaming, और total
    guarded-fetch abort शामिल हैं। `agents.defaults.timeoutSeconds` बढ़ाने से पहले इसे prefer करें,
    जो पूरे agent run को control करता है।

  </Accordion>

  <Accordion title="Server reachable नहीं है">
    जांचें कि vLLM server चल रहा है और accessible है:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    अगर आपको connection error दिखता है, तो host, port, और यह verify करें कि vLLM OpenAI-संगत server mode के साथ शुरू हुआ था।
    explicit loopback, LAN, या Tailscale endpoints के लिए, OpenClaw guarded model
    requests के लिए exact configured `models.providers.vllm.baseUrl` origin पर trust करता है।
    Metadata/link-local origins explicit opt-in के बिना blocked रहते हैं।
    `models.providers.vllm.request.allowPrivateNetwork: true` केवल तब set करें
    जब vLLM requests को किसी दूसरे private origin तक पहुंचना जरूरी हो, और exact-origin trust से opt out करने के लिए इसे `false`
    set करें।

  </Accordion>

  <Accordion title="Requests पर auth errors">
    अगर requests auth errors के साथ fail होती हैं, तो अपने server configuration से match करने वाली वास्तविक `VLLM_API_KEY` set करें, या provider को `models.providers.vllm` के तहत स्पष्ट रूप से configure करें।

    <Tip>
    अगर आपका vLLM server auth लागू नहीं करता, तो `VLLM_API_KEY` के लिए कोई भी non-empty value OpenClaw के लिए opt-in signal के रूप में काम करती है।
    </Tip>

  </Accordion>

  <Accordion title="कोई model discover नहीं हुआ">
    Auto-discovery के लिए `VLLM_API_KEY` set होना आवश्यक है। अगर आपने `models.providers.vllm` define किया है, तो OpenClaw केवल आपके declared models का उपयोग करता है, जब तक `agents.defaults.models` में `"vllm/*": {}` शामिल न हो।
  </Accordion>

  <Accordion title="Tools raw text के रूप में render होते हैं">
    अगर कोई Qwen model skill execute करने के बजाय JSON/XML tool syntax print करता है,
    तो ऊपर Advanced configuration में Qwen guidance देखें। सामान्य fix है:

    - उस model के लिए सही parser/template के साथ vLLM शुरू करें
    - `openclaw models list --provider vllm` के साथ exact model id confirm करें
    - dedicated per-model `params.extra_body.tool_choice: "required"` override
      केवल तभी जोड़ें जब `tool_choice: "auto"` अभी भी empty या text-only
      tool calls लौटाता हो

  </Accordion>
</AccordionGroup>

<Warning>
और मदद: [Troubleshooting](/hi/help/troubleshooting) और [FAQ](/hi/help/faq)।
</Warning>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल refs, और failover व्यवहार का चयन करना।
  </Card>
  <Card title="OpenAI" href="/hi/providers/openai" icon="bolt">
    मूल OpenAI प्रदाता और OpenAI-संगत route व्यवहार।
  </Card>
  <Card title="OAuth and auth" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और credential पुनः उपयोग के नियम।
  </Card>
  <Card title="Troubleshooting" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और उन्हें हल करने का तरीका।
  </Card>
</CardGroup>
