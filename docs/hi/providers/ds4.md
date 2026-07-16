---
read_when:
    - आप OpenClaw को antirez/ds4 के साथ चलाना चाहते हैं
    - आप टूल कॉल के साथ एक स्थानीय DeepSeek V4 Flash बैकएंड चाहते हैं
    - आपको ds4-server के लिए OpenClaw कॉन्फ़िगरेशन चाहिए
summary: स्थानीय DeepSeek V4 Flash OpenAI-संगत सर्वर ds4 के माध्यम से OpenClaw चलाएँ
title: ds4
x-i18n:
    generated_at: "2026-07-16T16:41:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) स्थानीय Metal बैकएंड से OpenAI-संगत `/v1` API के माध्यम से DeepSeek V4 Flash उपलब्ध कराता है। OpenClaw सामान्य `openai-completions` प्रदाता परिवार के माध्यम से ds4 से कनेक्ट होता है।

ds4, OpenClaw के साथ बंडल किया गया प्रदाता Plugin नहीं है। इसे
`models.providers.ds4` के अंतर्गत कॉन्फ़िगर करें, फिर `ds4/deepseek-v4-flash` चुनें।

| गुण         | मान                                                       |
| ----------- | --------------------------------------------------------- |
| प्रदाता आईडी | `ds4`                                                     |
| Plugin      | कोई नहीं (केवल कॉन्फ़िगरेशन)                              |
| API         | OpenAI-संगत चैट कम्प्लीशन्स (`openai-completions`) |
| आधार URL    | `http://127.0.0.1:18000/v1` (सुझाया गया)                   |
| मॉडल आईडी   | `deepseek-v4-flash`                                       |
| टूल कॉल     | OpenAI-शैली के `tools` / `tool_calls`                       |
| रीजनिंग     | DeepSeek-शैली के `thinking` और `reasoning_effort`          |

## आवश्यकताएँ

- Metal समर्थन वाला macOS।
- `ds4-server` और DeepSeek V4 Flash GGUF फ़ाइल के साथ कार्यरत ds4 चेकआउट।
- आपके चुने गए कॉन्टेक्स्ट के लिए पर्याप्त मेमोरी; बड़े `--ctx` मान सर्वर शुरू होने पर अधिक
  KV मेमोरी आवंटित करते हैं।

<Warning>
OpenClaw एजेंट टर्न में टूल स्कीमा और वर्कस्पेस कॉन्टेक्स्ट शामिल होते हैं। `--ctx 4096` जैसा छोटा कॉन्टेक्स्ट
सीधे curl परीक्षणों में सफल हो सकता है, लेकिन पूर्ण एजेंट रन में
`500 prompt exceeds context` के साथ विफल हो सकता है। एजेंट और टूल स्मोक परीक्षणों के लिए कम-से-कम `--ctx 32768` का उपयोग करें।
`--ctx 393216` का उपयोग केवल पर्याप्त मेमोरी होने और ds4 Think Max सक्षम करने के लिए करें।
</Warning>

## त्वरित शुरुआत

<Steps>
  <Step title="ds4-server शुरू करें">
    `<DS4_DIR>` को अपने ds4 चेकआउट पथ से बदलें।

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="OpenAI-संगत एंडपॉइंट सत्यापित करें">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    प्रतिक्रिया में `deepseek-v4-flash` शामिल होना चाहिए।

  </Step>
  <Step title="OpenClaw प्रदाता कॉन्फ़िगरेशन जोड़ें">
    [पूर्ण कॉन्फ़िगरेशन](#full-config) से कॉन्फ़िगरेशन जोड़ें, फिर एक बार का मॉडल
    परीक्षण चलाएँ:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## पूर्ण कॉन्फ़िगरेशन

इस कॉन्फ़िगरेशन का उपयोग तब करें जब ds4 पहले से `127.0.0.1:18000` पर चल रहा हो।

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`contextWindow` को `ds4-server --ctx` के अनुरूप रखें। `maxTokens` को
`--tokens` के अनुरूप रखें, जब तक कि आप जानबूझकर नहीं चाहते कि OpenClaw सर्वर के डिफ़ॉल्ट से कम आउटपुट का अनुरोध करे।

## माँग पर शुरुआत

OpenClaw केवल `ds4/...` मॉडल चुने जाने पर ds4 शुरू कर सकता है। उसी प्रदाता प्रविष्टि में
`localService` जोड़ें:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` एक निरपेक्ष निष्पादन-योग्य पथ होना चाहिए। शेल लुकअप और `~` विस्तार का
उपयोग नहीं किया जाता। प्रत्येक `localService` फ़ील्ड के लिए
[स्थानीय मॉडल सेवाएँ](/hi/gateway/local-model-services) देखें।

## Think Max

ds4 केवल इन दोनों के सत्य होने पर Think Max लागू करता है:

- `ds4-server`, `--ctx 393216` या उससे अधिक से शुरू होता है।
- अनुरोध `reasoning_effort: "max"` (या समतुल्य ds4 एफर्ट फ़ील्ड) का उपयोग करता है।

यदि आप इतना बड़ा कॉन्टेक्स्ट चलाते हैं, तो सर्वर फ़्लैग और OpenClaw मॉडल
मेटाडेटा दोनों अपडेट करें:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## परीक्षण

OpenClaw को बायपास करते हुए प्रत्यक्ष HTTP परीक्षण:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

OpenClaw मॉडल रूटिंग (त्वरित शुरुआत के परीक्षण के समान):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

कम-से-कम 32768 के कॉन्टेक्स्ट के साथ पूर्ण एजेंट और टूल-कॉल स्मोक परीक्षण:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

अपेक्षित परिणाम:

- `executionTrace.winnerProvider`, `ds4` है
- `executionTrace.winnerModel`, `deepseek-v4-flash` है
- `toolSummary.calls`, कम-से-कम `1` है
- `finalAssistantVisibleText`, `tool-ok` से शुरू होता है

## समस्या निवारण

<AccordionGroup>
  <Accordion title="curl /v1/models कनेक्ट नहीं कर सकता">
    ds4 चल नहीं रहा है या `baseUrl` में दिए गए होस्ट/पोर्ट से बाइंड नहीं है।
    `ds4-server` शुरू करें, फिर पुनः प्रयास करें:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 प्रॉम्प्ट कॉन्टेक्स्ट से अधिक है">
    कॉन्फ़िगर किया गया `--ctx`, OpenClaw टर्न के लिए बहुत छोटा है।
    `ds4-server --ctx` बढ़ाएँ, फिर मिलान के लिए `models.providers.ds4.models[].contextWindow`
    अपडेट करें। टूल वाले पूर्ण एजेंट टर्न को एक प्रत्यक्ष, एक-संदेश वाले curl अनुरोध की तुलना में काफी अधिक कॉन्टेक्स्ट चाहिए।
  </Accordion>

  <Accordion title="Think Max सक्रिय नहीं होता">
    ds4, Think Max का उपयोग केवल तब करता है जब `--ctx` कम-से-कम `393216` हो और अनुरोध
    `reasoning_effort: "max"` माँगे। छोटे कॉन्टेक्स्ट उच्च
    रीजनिंग पर वापस चले जाते हैं।
  </Accordion>

  <Accordion title="पहला अनुरोध धीमा है">
    ds4 में कोल्ड Metal रेज़िडेंसी और मॉडल वार्मअप चरण होता है। जब OpenClaw माँग पर सर्वर शुरू करता है, तब
    `localService.readyTimeoutMs: 300000` सेट करें।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="स्थानीय मॉडल सेवाएँ" href="/hi/gateway/local-model-services" icon="play">
    मॉडल अनुरोधों से पहले माँग पर स्थानीय मॉडल सर्वर शुरू करें।
  </Card>
  <Card title="स्थानीय मॉडल" href="/hi/gateway/local-models" icon="server">
    स्थानीय मॉडल बैकएंड चुनें और संचालित करें।
  </Card>
  <Card title="मॉडल प्रदाता" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता रेफ़रेंस, प्रमाणीकरण और फ़ेलओवर कॉन्फ़िगर करें।
  </Card>
  <Card title="DeepSeek" href="/hi/providers/deepseek" icon="brain">
    मूल DeepSeek प्रदाता व्यवहार और थिंकिंग नियंत्रण।
  </Card>
</CardGroup>
